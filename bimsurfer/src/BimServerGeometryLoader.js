import DataInputStreamReader from "./DataInputStreamReader.js";
import "xeogl";

export default class BimServerGeometryLoader {

	constructor(bimServerApi, viewer, model, roid, globalTransformationMatrix) {
		this.bimServerApi = bimServerApi;
		this.viewer = viewer;
		this.state = {};
		this.progressListeners = [];
		this.objectAddedListeners = [];
		this.prepareReceived = false;
		this.todo = [];
		this.geometryIds = {};
		this.dataToInfo = {};
		this.globalTransformationMatrix = globalTransformationMatrix;
		this.model = model;
		this.roid = roid;

		console.log(globalTransformationMatrix);
	}

	addProgressListener(progressListener) {
		this.progressListeners.push(progressListener);
	}

	process() {
		let data = this.todo.shift();
		let stream;

		while (data != null) {
			stream = new DataInputStreamReader(data);

			const channel = stream.readLong();
			const messageType = stream.readByte();

			if (messageType == 0) {
				this._readStart(stream);
			} else if (messageType == 6) {
				this._readEnd(stream);
			} else {
				this._readObject(stream, messageType);
			}

			data = this.todo.shift();
		}
	}

	setLoadOids(oids) {
		this.options = {
			type: "oids",
			oids: oids
		};
	}

	/**
	 * Starts this loader.
	 */
	start() {
		if (!this.options || this.options.type !== "oids") {
			throw new Error("Invalid loader configuration");
		}

		let obj = [];

		this.groupId = this.roid;
		this.infoToOid = this.options.oids;

		for (let k in this.infoToOid) {
			const oid = parseInt(this.infoToOid[k]);
			this.model.apiModel.get(oid, (object) => {
				if (object.object._rgeometry != null) {
					if (object.model.objects[object.object._rgeometry] != null) {
						// Only if this data is preloaded, otherwise just don't include any gi
						object.getGeometry((geometryInfo) => {
							obj.push({
								gid: object.object._rgeometry,
								oid: object.oid,
								object: object,
								info: geometryInfo.object
							});
						});
					} else {
						obj.push({
							gid: object.object._rgeometry,
							oid: object.oid,
							object: object
						});
					}
				}
			});
		}

		obj.sort((a, b) => {
			if (a.info != null && b.info != null) {
				const topa = (a.info._emaxBounds.z + a.info._eminBounds.z) / 2;
				const topb = (b.info._emaxBounds.z + b.info._eminBounds.z) / 2;
				return topa - topb;
			} else {
				// Resort back to type
				// TODO this is dodgy when some objects do have info, and others don't
				return a.object.getType().localeCompare(b.object.getType());
			}
		});

		let oids = [];
		obj.forEach((wrapper) => {
			oids.push(wrapper.object.object._rgeometry/*._i*/);
		});

		const query = {
			type: "GeometryInfo",
			oids: oids,
			include: {
				type: "GeometryInfo",
				field: "data"
			}
		};

		this.bimServerApi.getSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingStreamingSerializerPlugin3", (serializer) => {
			this.bimServerApi.call("ServiceInterface", "download", {
				roids: [this.roid],
				query: JSON.stringify(query),
				serializerOid: serializer.oid,
				sync: false
			}, (topicId) => {
				this.topicId = topicId;
				this.bimServerApi.registerProgressHandler(this.topicId, this._progressHandler.bind(this));
			});
		});
	}

	_progressHandler(topicId, state) {
		if (topicId == this.topicId) {
			if (state.title == "Done preparing") {
				if (!this.prepareReceived) {
					this.prepareReceived = true;
					this._downloadInitiated();
				}
			}
			if (state.state == "FINISHED") {
				this.bimServerApi.unregisterProgressHandler(this.topicId, this._progressHandler.bind(this));
			}
		}
	}

	_downloadInitiated() {
		this.state = {
			mode: 0,
			nrObjectsRead: 0,
			nrObjects: 0
		};
		// this.viewer.SYSTEM.events.trigger('progressStarted', ['Loading Geometry']);
		// this.viewer.SYSTEM.events.trigger('progressBarStyleChanged', BIMSURFER.Constants.ProgressBarStyle.Continuous);
		const msg = {
			longActionId: this.topicId,
			topicId: this.topicId
		};
		this.bimServerApi.setBinaryDataListener(this.topicId, this._binaryDataListener.bind(this));
		this.bimServerApi.downloadViaWebsocket(msg);
	}

	_binaryDataListener(data) {
		this.todo.push(data);
	}

	_afterRegistration(topicId) {
		this.bimServerApi.call("Bimsie1NotificationRegistryInterface", "getProgress", {
			topicId: this.topicId
		}, (state) => {
			this._progressHandler(this.topicId, state);
		});
	}

	_readEnd(data) {
		this.progressListeners.forEach((progressListener) => {
			progressListener("done", this.state.nrObjectsRead, this.state.nrObjectsRead);
		});
		this.bimServerApi.call("ServiceInterface", "cleanupLongAction", {
			topicId: this.topicId
		}, () => { });
	}

	_readStart(data) {
		const start = data.readUTF8();

		if (start != "BGS") {
			console.error("data does not start with BGS (" + start + ")");
			return false;
		}

		this.protocolVersion = data.readByte();

		if (this.protocolVersion != 10 && this.protocolVersion != 11) {
			console.error("Unimplemented version");
			return false;
		}

		data.align8();

		const boundary = data.readDoubleArray(6);

		this._initCamera(boundary);

		this.state.mode = 1;

		this.progressListeners.forEach((progressListener) => {
			progressListener("start", this.state.nrObjectsRead, this.state.nrObjectsRead);
		});
		//this._updateProgress();
	}

	_initCamera(boundary) {

		if (!this._gotCamera) {

			this._gotCamera = true;

			// Bump scene origin to center the model

			const xmin = boundary[0];
			const ymin = boundary[1];
			const zmin = boundary[2];
			const xmax = boundary[3];
			const ymax = boundary[4];
			const zmax = boundary[5];

			const diagonal = Math.sqrt(
				Math.pow(xmax - xmin, 2) +
				Math.pow(ymax - ymin, 2) +
				Math.pow(zmax - zmin, 2));

			const scale = 100 / diagonal;

			this.viewer.setScale(scale); // Temporary until we find a better scaling system.

			const far = diagonal * 5; // 5 being a guessed constant that should somehow coincide with the max zoom-out-factor

			const center = [
				scale * ((xmax + xmin) / 2),
				scale * ((ymax + ymin) / 2),
				scale * ((zmax + zmin) / 2)
			];

			this.viewer.setCamera({
				type: "persp",
				target: center,
				up: [0, 0, 1],
				eye: [center[0] - scale * diagonal, center[1] - scale * diagonal, center[2] + scale * diagonal],
				far: 5000,
				near: 0.1,
				fovy: 35.8493
			});
		}
	}

	_updateProgress() {
		//            if (this.state.nrObjectsRead < this.state.nrObjects) {
		//                const progress = Math.ceil(100 * this.state.nrObjectsRead / this.state.nrObjects);
		//                if (progress != this.state.lastProgress) {
		//                    this.progressListeners.forEach(function (progressListener) {
		//                        progressListener(progress, this.state.nrObjectsRead, this.state.nrObjects);
		//                    });
		//                    // TODO: Add events
		//                    // this.viewer.SYSTEM.events.trigger('progressChanged', [progress]);
		//                    this.state.lastProgress = progress;
		//                }
		//            } else {
		//                // this.viewer.SYSTEM.events.trigger('progressDone');
		//                this.progressListeners.forEach(function (progressListener) {
		//                    progressListener("done", this.state.nrObjectsRead, this.state.nrObjects);
		//                });
		//                // this.viewer.events.trigger('sceneLoaded', [this.viewer.scene.scene]);
		//
		//                const d = {};
		//                d[BIMSERVER_VERSION == "1.4" ? "actionId" : "topicId"] = this.topicId;
		//                this.bimServerApi.call("ServiceInterface", "cleanupLongAction", d, function () {});
		//            }
	}

	_readObject(stream, geometryType) {
		stream.align8();

		//            const type = stream.readUTF8();
		//            const roid = stream.readLong(); // TODO: Needed?
		//            const objectId = stream.readLong();
		//            const oid = objectId;

		let geometryId;
		let numGeometries;
		let numParts;
		let objectBounds;
		let numIndices;
		let indices;
		let numPositions;
		let positions;
		let numNormals;
		let normals;
		let numColors;
		let colors = null;
		let color;

		let i;

		if (geometryType == 1) {
			geometryId = stream.readLong();
			numIndices = stream.readInt();
			indices = stream.readShortArray(numIndices);

			if (this.protocolVersion == 11) {
				const b = stream.readInt();
				if (b == 1) {
					color = {
						r: stream.readFloat(),
						g: stream.readFloat(),
						b: stream.readFloat(),
						a: stream.readFloat()
					};
				}
			}
			stream.align4();
			numPositions = stream.readInt();
			positions = stream.readFloatArray(numPositions);
			numNormals = stream.readInt();
			normals = stream.readFloatArray(numNormals);
			numColors = stream.readInt();
			if (numColors > 0) {
				colors = stream.readFloatArray(numColors);
			} else if (color != null) {
				// Creating vertex colors here anyways (not transmitted over the line is a plus), should find a way to do this with scenejs without vertex-colors
				colors = new Array(numPositions * 4);
				for (let i = 0; i < numPositions; i++) {
					colors[i * 4 + 0] = color.r;
					colors[i * 4 + 1] = color.g;
					colors[i * 4 + 2] = color.b;
					colors[i * 4 + 3] = color.a;
				}
			}

			this.geometryIds[geometryId] = [geometryId];
			this.viewer.createGeometry(geometryId, positions, normals, colors, indices);

			if (this.dataToInfo[geometryId] != null) {
				this.dataToInfo[geometryId].forEach((oid) => {
					const ob = this.viewer.getObject(this.roid + ":" + oid);
					ob.add(geometryId);
				});
				delete this.dataToInfo[geometryId];
			}
		} else if (geometryType == 2) {
			console.log("Unimplemented", 2);
		} else if (geometryType == 3) {
			const geometryDataOid = stream.readLong();
			numParts = stream.readInt();
			this.geometryIds[geometryDataOid] = [];

			let geometryIds = [];
			for (i = 0; i < numParts; i++) {
				const partId = stream.readLong();
				geometryId = geometryDataOid + "_" + i;
				numIndices = stream.readInt();
				indices = stream.readShortArray(numIndices);

				if (this.protocolVersion == 11) {
					const b = stream.readInt();
					if (b == 1) {
						const color = {
							r: stream.readFloat(),
							g: stream.readFloat(),
							b: stream.readFloat(),
							a: stream.readFloat()
						};
					}
				}
				stream.align4();

				numPositions = stream.readInt();
				positions = stream.readFloatArray(numPositions);
				numNormals = stream.readInt();
				normals = stream.readFloatArray(numNormals);
				numColors = stream.readInt();
				if (numColors > 0) {
					colors = stream.readFloatArray(numColors);
				} else if (color != null) {
					// Creating vertex colors here anyways (not transmitted over the line is a plus), should find a way to do this with scenejs without vertex-colors
					colors = new Array(numPositions * 4);
					for (let i = 0; i < numPositions; i++) {
						colors[i * 4 + 0] = color.r;
						colors[i * 4 + 1] = color.g;
						colors[i * 4 + 2] = color.b;
						colors[i * 4 + 3] = color.a;
					}
				}

				geometryIds.push(geometryId);
				this.geometryIds[geometryDataOid].push(geometryId);
				this.viewer.createGeometry(geometryId, positions, normals, colors, indices);
			}
			if (this.dataToInfo[geometryDataOid] != null) {
				this.dataToInfo[geometryDataOid].forEach((oid) => {
					const ob = this.viewer.getObject(this.roid + ":" + oid);
					geometryIds.forEach((geometryId) => {
						ob.add(geometryId);
					});
				});
				delete this.dataToInfo[geometryDataOid];
			}
		} else if (geometryType == 4) {
			console.log("Unimplemented", 4);
		} else if (geometryType == 5) {
			const roid = stream.readLong();
			const geometryInfoOid = stream.readLong();
			const objectBounds = stream.readDoubleArray(6);
			const matrix = stream.readDoubleArray(16);
			if (this.globalTransformationMatrix != null) {
				xeogl.math.mulMat4(matrix, matrix, this.globalTransformationMatrix);
			}
			const geometryDataOid = stream.readLong();
			let geometryDataOids = this.geometryIds[geometryDataOid];
			const oid = this.infoToOid[geometryInfoOid];
			if (geometryDataOids == null) {
				geometryDataOids = [];
				let list = this.dataToInfo[geometryDataOid];
				if (list == null) {
					list = [];
					this.dataToInfo[geometryDataOid] = list;
				}
				list.push(oid);
			}
			if (oid == null) {
				console.error("Not found", this.infoToOid, geometryInfoOid);
			} else {
				this.model.apiModel.get(oid, (object) => {
					object.gid = geometryInfoOid;
					const modelId = this.roid; // TODO: set to the model ID
					this._createObject(modelId, roid, oid, oid, geometryDataOids, object.getType(), matrix);
				});
			}
		} else {
			this.warn("Unsupported geometry type: " + geometryType);
			return;
		}

		this.state.nrObjectsRead++;

		this._updateProgress();
	}

	_createObject(modelId, roid, oid, objectId, geometryIds, type, matrix) {

		if (this.state.mode == 0) {
			console.log("Mode is still 0, should be 1");
			return;
		}


		// this.models[roid].get(oid,
		// function () {
		if (this.viewer.createObject(modelId, roid, oid, objectId, geometryIds, type, matrix)) {

			// this.objectAddedListeners.forEach(function (listener) {
			// listener(objectId);
			// });
		}

		// });
	}
}