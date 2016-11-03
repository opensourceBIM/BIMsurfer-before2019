function GeometryLoader(bimServerApi, models, viewer, type) {
	var o = this;
	o.models = models;
	o.bimServerApi = bimServerApi;
	o.viewer = viewer;
	o.state = {};
	o.progressListeners = [];
	o.objectAddedListeners = [];
	o.prepareReceived = false;
	o.todo = [];
	o.type = type;
	
	if (o.type == null) {
		o.type = "triangles";
	}
	
	o.stats = {
		nrPrimitives: 0,
		nrVertices: 0,
		nrNormals: 0,
		nrColors: 0
	};
	
	// GeometryInfo.oid -> GeometryData.oid
//	o.infoToData = {};
	
	// GeometryData.oid -> [GeometryInfo.oid]
	o.dataToInfo = {};
	
	// Loaded geometry, GeometryData.oid -> Boolean
	o.loadedGeometry = {};
	
	// GeometryInfo.oid -> IfcProduct.oid
	o.infoToOid = {};
	
	this.addProgressListener = function(progressListener) {
		o.progressListeners.push(progressListener);
	};
	
	this.readObject = function(data, geometryType) {
		data.align8();
		if (geometryType == 5) {
			var roid = data.readLong();
			var geometryInfoOid = data.readLong();
			var objectBounds = data.readDoubleArray(6);
//			if (objectBounds[0] < o.modelBounds.min.x) {
//				o.modelBounds.min.x = objectBounds[0];
//			}
//			if (objectBounds[1] < o.modelBounds.min.y) {
//				o.modelBounds.min.y = objectBounds[1];
//			}
//			if (objectBounds[2] < o.modelBounds.min.z) {
//				o.modelBounds.min.z = objectBounds[2];
//			}
//			if (objectBounds[3] > o.modelBounds.max.x) {
//				o.modelBounds.max.x = objectBounds[3];
//			}
//			if (objectBounds[4] > o.modelBounds.max.y) {
//				o.modelBounds.max.y = objectBounds[4];
//			}
//			if (objectBounds[5] > o.modelBounds.max.z) {
//				o.modelBounds.max.z = objectBounds[5];
//			}
			
			var transformationMatrix = data.readDoubleArray(16);
			var geometryDataOid = data.readLong();
			var coreIds = [geometryDataOid];
//			o.infoToData[geometryInfoOid] = geometryDataOid;
			
			if (o.state.mode == 0) {
				console.log("Mode is still 0, should be 1");
				return;
			}
			
			var oid = o.infoToOid[geometryInfoOid];
			if (oid == null) {
				console.log("Not found", geometryInfoOid);
			} else {
				o.models[roid].get(oid, function(object){
					object.gid = geometryInfoOid;
					if (o.viewer.scene.findNode(geometryInfoOid) != null) {
						console.log("Node with id " + geometryInfoOid + " already existed");
						return;
					}
					var material = BIMSURFER.Constants.materials[object.getType()];
					var hasTransparency = false;
					if (material == null) {
						console.log("material not found", object.getType());
						material = BIMSURFER.Constants.materials["DEFAULT"];
					}
					if (material.a < 1) {
						hasTransparency = true;
					}
					
					var enabled = object.trans.mode == 0;
					
					var coreNodes = null;
					
					var loaded = o.loadedGeometry[geometryDataOid];
					if (loaded != null) {
						if (Array.isArray(loaded)) {
							coreNodes = [];
							loaded.forEach(function(id){
								coreNodes.push({
									type: "geometry",
									coreId: id
								});
							});
						} else {
							coreNodes = [{
								type: "geometry",
								coreId: geometryDataOid
							}];
						}
					} else {
						if (o.dataToInfo[geometryDataOid] == null) {
							o.dataToInfo[geometryDataOid] = [geometryInfoOid];
						} else {
							o.dataToInfo[geometryDataOid].push(geometryInfoOid);
						}
					}

					var flags = {
						type : "flags",
						flags : {
							transparent : hasTransparency
						},
						nodes : [{
							type: "enable",
							enabled: enabled,
							nodes : [{
								type : "material",
								baseColor: material,
								alpha: 1,
//								nodes : [{}]
//								nodes : [{
//									type: "translate",
//									x: objectBounds[0] + (objectBounds[3] - objectBounds[0]) / 2,
//									y: objectBounds[1] + (objectBounds[4] - objectBounds[1]) / 2,
//									z: objectBounds[2] + (objectBounds[5] - objectBounds[2]) / 2,
//									nodes : [{
//										type: "scale",
//										x: (objectBounds[3] - objectBounds[0]) / 2,
//										y: (objectBounds[4] - objectBounds[1]) / 2,
//										z: (objectBounds[5] - objectBounds[2]) / 2,
//										nodes: [{
//											type: "geometry/box",
//											wire: true
//										}]
//									}]
//								}]
							}, {
								type : "material",
								baseColor: material,
								alpha: material.a,
								nodes : [{
									type : "name",
									id : geometryInfoOid,
									data: {
										object: object
									},
									nodes : [{
										type: "matrix",
										elements: transformationMatrix,
										nodes: coreNodes
									}]
								}]
							}]
						}]
					};
					
					o.modelNode.addNode(flags);
					
					o.objectAddedListeners.forEach(function(listener){
						listener(oid);
					});
				});
			}
		} else if (geometryType == 3) {
			var coreIds = [];
			var geometryDataOid = data.readLong();
			var nrParts = data.readInt();
			//var objectBounds = data.readFloatArray(6);
			
			for (var i=0; i<nrParts; i++) {
				var coreId = data.readLong();
				coreIds.push(coreId);
				var nrIndices = data.readInt();
				o.stats.nrPrimitives += nrIndices / 3;
				var indices = data.readShortArray(nrIndices);
				data.align4();
				var nrVertices = data.readInt();
				o.stats.nrVertices += nrVertices;
				var vertices = data.readFloatArray(nrVertices);
				var nrNormals = data.readInt();
				o.stats.nrNormals += nrNormals;
				var normals = data.readFloatArray(nrNormals);
				var nrColors = data.readInt();
				o.stats.nrColors += nrColors;
				var colors = data.readFloatArray(nrColors);
				
				var geometry = {
					type: "geometry",
					primitive: o.type
				};
				
				geometry.coreId = coreId;
				
				if (o.type == "lines") {
					geometry.indices = o.convertToLines(indices);
				} else {
					geometry.indices = indices;
				}
				geometry.positions = vertices;
				geometry.normals = normals;
				
				if (colors != null && colors.length > 0) {
					geometry.colors = colors;
				}
				o.library.add("node", geometry);
			}
			o.loadedGeometry[geometryDataOid] = coreIds;
			if (o.dataToInfo[geometryDataOid] != null) {
				o.dataToInfo[geometryDataOid].forEach(function(geometryInfoId){
					var node = o.viewer.scene.findNode(geometryInfoId);
					if (node != null && node.nodes[0] != null) {
						coreIds.forEach(function(coreId){
							node.nodes[0].addNode({
								type: "geometry",
								coreId: coreId
							});
						});
					}
				});
				delete o.dataToInfo[geometryDataOid];
			}
		} else if (geometryType == 1) {
			var geometryDataOid = data.readLong();
			var nrIndices = data.readInt();
			var indices = data.readShortArray(nrIndices);
			o.stats.nrPrimitives += nrIndices / 3;
			data.align4();
			var nrVertices = data.readInt();
			var vertices = data.readFloatArray(nrVertices);
			o.stats.nrVertices += nrVertices;
			var nrNormals = data.readInt();
			o.stats.nrNormals += nrNormals;
			var normals = data.readFloatArray(nrNormals);
			var nrColors = data.readInt();
			o.stats.nrColors += nrColors;
			var colors = data.readFloatArray(nrColors);
			
			var geometry = {
				type: "geometry",
				primitive: o.type
			};
			
			geometry.coreId = geometryDataOid;
			if (o.type == "lines") {
				geometry.indices = o.convertToLines(indices);
			} else {
				geometry.indices = indices;
			}
			geometry.positions = vertices;
			geometry.normals = normals;
			
			if (colors != null && colors.length > 0) {
				geometry.colors = colors;
			}
			o.library.add("node", geometry);
			
			o.loadedGeometry[geometryDataOid] = true;
			if (o.dataToInfo[geometryDataOid] != null) {
				o.dataToInfo[geometryDataOid].forEach(function(geometryInfoId){
					var node = o.viewer.scene.findNode(geometryInfoId);
					if (node != null && node.nodes[0] != null) {
						node.nodes[0].addNode({
							type: "geometry",
							coreId: geometryDataOid
						});
					}
				});
				delete o.dataToInfo[geometryDataOid];
			}
		}

		o.state.nrObjectsRead++;
//		o.updateProgress();
	};
	
	this.convertToLines = function(indices) {
		var lineIndices = [];
		for (var i=0; i<indices.length; i+=3) {
			var i1 = indices[i];
			var i2 = indices[i+1];
			var i3 = indices[i+2];
			
			lineIndices.push(i1, i2);
			lineIndices.push(i2, i3);
			lineIndices.push(i3, i1);
		}
		return lineIndices;
	}
	
	this.updateProgress = function() {
		o.progressListeners.forEach(function(progressListener){
			progressListener("Loading", -1);
		});

//		if (o.state.nrObjectsRead < o.state.nrObjects) {
//			var progress = Math.ceil(100 * o.state.nrObjectsRead / o.state.nrObjects);
//			if (progress != o.state.lastProgress) {
//				o.progressListeners.forEach(function(progressListener){
//					progressListener(progress, o.state.nrObjectsRead, o.state.nrObjects);
//				});
//				o.viewer.SYSTEM.events.trigger('progressChanged', [progress]);
//				o.state.lastProgress = progress;
//			}
//		} else {
//			o.viewer.SYSTEM.events.trigger('progressDone');
//			o.progressListeners.forEach(function(progressListener){
//				progressListener("done", o.state.nrObjectsRead, o.state.nrObjects);
//			});
//			o.viewer.events.trigger('sceneLoaded', [o.viewer.scene]);
//			o.bimServerApi.call("ServiceInterface", "cleanupLongAction", {topicId: o.topicId}, function(){
//			});
//		}
	};
	
	this.downloadInitiated = function(){
		o.state = {
			mode: 0,
			nrObjectsRead: 0,
			nrObjects: 0
		};
//		o.viewer.SYSTEM.events.trigger('progressStarted', ['Loading Geometry']);
//		o.viewer.SYSTEM.events.trigger('progressBarStyleChanged', BIMSURFER.Constants.ProgressBarStyle.Continuous);
		
//		o.viewer.refreshMask();

		o.library = o.viewer.scene.findNode("library-" + o.groupId);
		if (o.library == null) {
			o.library = o.viewer.scene.addNode({
				id: "library-" + o.groupId,
				type: "library"
			});
		}
		
		var msg = {
			topicId: o.topicId
		};
		
		o.bimServerApi.setBinaryDataListener(o.topicId, o.binaryDataListener);
		o.bimServerApi.downloadViaWebsocket(msg);
	};
	
	this.binaryDataListener = function(data){
		o.todo.push(data);
	};
	
	this.readEnd = function(data){
		if (Object.keys(o.dataToInfo).length > 0) {
			console.error("Unsolved links");
			for (var key in o.dataToInfo) {
				console.log(key, o.dataToInfo[key]);
			}
		}
		
//		o.boundsTranslate = o.viewer.scene.findNode("bounds_translate");
//
//		var center = {
//			x: (o.modelBounds.max.x + o.modelBounds.min.x) / 2,
//			y: (o.modelBounds.max.y + o.modelBounds.min.y) / 2,
//			z: (o.modelBounds.max.z + o.modelBounds.min.z) / 2,
//		};
//		
//		o.boundsTranslate.x = -o.center.x;
//		o.boundsTranslate.y = -o.center.y;
//		o.boundsTranslate.z = -o.center.z;
//
//		var lookat = o.viewer.scene.findNode("main-lookAt");
//		var eye = { x: (o.modelBounds.max.x - o.modelBounds.min.x) * 0.5, y: (o.modelBounds.max.y - o.modelBounds.min.y) * -1, z: (o.modelBounds.max.z - o.modelBounds.min.z) * 0.5 };
//		lookat.set("eye", eye);
//		
//		var maincamera = o.viewer.scene.findNode("main-camera");
//		
//		var diagonal = Math.sqrt(Math.pow(o.modelBounds.max.x - o.modelBounds.min.x, 2) + Math.pow(o.modelBounds.max.y - o.modelBounds.min.y, 2) + Math.pow(o.modelBounds.max.z - o.modelBounds.min.z, 2));
//		
//		var far = diagonal * 5; // 5 being a guessed constant that should somehow coincide with the max zoom-out-factor
//		
//		maincamera.setOptics({
//			type: 'perspective',
//			far: far,
//			near: far / 1000,
//			aspect: jQuery(o.viewer.canvas).width() / jQuery(o.viewer.canvas).height(),
//			fovy: 37.8493
//		});
		
		console.log(o.stats);
		
		o.viewer.SYSTEM.events.trigger('progressDone');
		o.progressListeners.forEach(function(progressListener){
			progressListener("done", o.state.nrObjectsRead, o.state.nrObjectsRead);
		});
		o.bimServerApi.call("ServiceInterface", "cleanupLongAction", {topicId: o.topicId}, function(){
		});
	}
	
	this.readStart = function(data){
		var start = data.readUTF8();
		if (start != "BGS") {
			console.log("Stream does not start with BGS (" + start + ")");
			return false;
		}
		var version = data.readByte();
		if (version != 10) {
			console.log("Unimplemented version");
			return false;
		} else {
			o.state.version = version;
		}
		data.align8();
		
		var modelBounds = data.readDoubleArray(6);
		o.modelBounds = {
			min: {x: modelBounds[0], y: modelBounds[1], z: modelBounds[2]},
			max: {x: modelBounds[3], y: modelBounds[4], z: modelBounds[5]}
		};
		o.center = {
			x: (o.modelBounds.max.x + o.modelBounds.min.x) / 2,
			y: (o.modelBounds.max.y + o.modelBounds.min.y) / 2,
			z: (o.modelBounds.max.z + o.modelBounds.min.z) / 2,
		};

		o.boundsTranslate = o.viewer.scene.findNode("bounds_translate");
		var firstModel = false;
		if (o.boundsTranslate == null) {
			var firstModel = true;
			o.boundsTranslate = {
				id: "bounds_translate",
				type: "translate",
				x: -o.center.x,
				y: -o.center.y,
				z: -o.center.z,
				nodes: []
			}
			o.boundsTranslate = o.viewer.scene.findNode("my-lights").addNode(o.boundsTranslate);
		}
		
		o.modelNode = o.viewer.scene.findNode("model_node_" + o.groupId);
		if (o.modelNode == null) {
			o.modelNode = {
				id: "model_node_" + o.groupId,
				type: "translate",
				x: 0,
				y: 0,
				z: 0,
				data: {
					groupId: o.groupId
				},
				nodes: []
			};
			o.modelNode = o.boundsTranslate.addNode(o.modelNode);
		}
		
		if (firstModel) {
			var lookat = o.viewer.scene.findNode("main-lookAt");
			var eye = { x: (o.modelBounds.max.x - o.modelBounds.min.x) * 0.5, y: (o.modelBounds.max.y - o.modelBounds.min.y) * -1, z: (o.modelBounds.max.z - o.modelBounds.min.z) * 0.5 };
			lookat.set("eye", eye);
			
			var maincamera = o.viewer.scene.findNode("main-camera");
			
			var diagonal = Math.sqrt(Math.pow(o.modelBounds.max.x - o.modelBounds.min.x, 2) + Math.pow(o.modelBounds.max.y - o.modelBounds.min.y, 2) + Math.pow(o.modelBounds.max.z - o.modelBounds.min.z, 2));
			
			var far = diagonal * 5; // 5 being a guessed constant that should somehow coincide with the max zoom-out-factor
			
			maincamera.setOptics({
				type: 'perspective',
				far: far,
				near: far / 1000,
				aspect: jQuery(o.viewer.canvas).width() / jQuery(o.viewer.canvas).height(),
				fovy: 37.8493
			});
			
			o.viewer.events.trigger('sceneLoaded', [o.viewer.scene]);
		}
		o.state.mode = 1;
//o.state.nrObjects = data.readInt();
//		o.updateProgress();
//		console.log("Nr Objects", o.state.nrObjects);
	};
	
	this.process = function(){
		var data = o.todo.shift();
		while (data != null) {
			inputStream = new BIMSURFER.DataInputStreamReader(null, data);
			var topicId = inputStream.readLong(); // Which we don't use here
			var messageType = inputStream.readByte();
			if (messageType == 0) {
				o.readStart(inputStream);
			} else if (messageType == 6) {
				o.readEnd(inputStream);
			} else {
				o.readObject(inputStream, messageType);
			}
			data = o.todo.shift();
		}
	};
	
	this.progressHandler = function(topicId, state){
		if (topicId == o.topicId) {
			if (state.title == "Done preparing") {
				if (!o.prepareReceived) {
					o.prepareReceived = true;
					o.downloadInitiated();
				}
			}
			if (state.state == "FINISHED") {
				o.bimServerApi.unregisterProgressHandler(o.topicId, o.progressHandler);
			}
			o.progressListeners.forEach(function(progressListener){
				progressListener("Loading" + (o.options.title == null ? "" : " " + o.options.title) + "...", state.progress);
			});
		}
	};
	
	this.setTitle = function(title) {
		o.options.title = title;
	}

	this.setLoadOids = function(roids, oids) {
		o.options = {type: "oids", roids: roids, oids: oids};
	}

	this.start = function(){
		if (o.options != null) {
			o.groupId = o.options.roids[0];
			
			o.infoToOid = {};
			
			var oids = [];
			o.options.oids.forEach(function(object){
				if (object.gid != null) {
					o.infoToOid[object.gid] = object.oid;
					oids.push(object.gid);
				}
			});

			if (oids.length > 0) {
				var query = {
					type: "GeometryInfo",
					oids: oids,
					include: {
						type: "GeometryInfo",
						field: "data"
					}
				};
				o.bimServerApi.getSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingStreamingSerializerPlugin3", function(serializer){
					o.bimServerApi.call("ServiceInterface", "download", {
						roids: o.options.roids,
						serializerOid : serializer.oid,
						sync : false,
						query: JSON.stringify(query)
					}, function(topicId){
						o.topicId = topicId;
						o.bimServerApi.registerProgressHandler(o.topicId, o.progressHandler);
					});
				});
			}
		}
	};
}