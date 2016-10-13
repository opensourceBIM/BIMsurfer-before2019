define(["bimsurfer/src/DataInputStreamReader"], function (DataInputStreamReader) {

    function BimServerGeometryLoader(bimServerApi, models, viewer) {

        var o = this;

        o.models = models;
        o.bimServerApi = bimServerApi;
        o.viewer = viewer;
        o.state = {};
        o.progressListeners = [];
        o.objectAddedListeners = [];
        o.prepareReceived = false;
        o.todo = [];
		o.geometryIds = {};

        this.addProgressListener = function (progressListener) {
            o.progressListeners.push(progressListener);
        };

        this.process = function () {

            var data = o.todo.shift();
            var stream;

            while (data != null) {

                stream = new DataInputStreamReader(data);

                var channel = stream.readLong();
                var messageType = stream.readByte();

                if (messageType == 0) {
                    o._readStart(stream);
    			} else if (messageType == 6) {
    				o._readEnd(stream);
    			} else {
    				o._readObject(stream, messageType);
                }

                data = o.todo.shift();
            }
        };

        this.setLoadRevision = function (roid) {
            o.options = {type: "revision", roid: roid};
        };

        this.setLoadTypes = function (roid, schema, types) {
            o.options = {type: "types", schema: schema, roid: roid, types: types};
        };

        this.setLoadOids = function (roids, oids) {
            o.options = {type: "oids", roids: roids, oids: oids};
        };

        /**
         * Starts this loader.
         */
        this.start = function () {
            if (!o.options || o.options.type !== "oids") {
                throw new Error("Invalid loader configuration");
            }

            if (BIMSERVER_VERSION == "1.4") {

                o.groupId = o.options.roids[0];
                o.oids = o.options.oids;
                o.bimServerApi.getMessagingSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingSerializerPlugin", function (serializer) {
                    o.bimServerApi.call("Bimsie1ServiceInterface", "downloadByOids", {
                        roids: o.options.roids,
                        oids: o.options.oids,
                        serializerOid: serializer.oid,
                        sync: false,
                        deep: false
                    }, function (topicId) {
                        o.topicId = topicId;
                        o.bimServerApi.registerProgressHandler(o.topicId, o._progressHandler, o._afterRegistration);
                    });
                });

            } else {

                o.groupId = o.options.roids[0];
                o.infoToOid = o.options.oids;

                var oids = [];
                for (var k in o.infoToOid) {
                    if (o.infoToOid.hasOwnProperty(k)) {
                        if (k != null && k != "undefined") {
                            oids.push(parseInt(o.infoToOid[k], 10));
                        }
                    }
                }

                var query = {
                    type: "IfcProduct",
                    includeAllSubtypes: true,
                    oids: oids,
                    include: {
                        type: "IfcProduct",
                        field: "geometry",
                        include: {
                            type: "GeometryInfo",
                            field: "data"
                        }
                    }
                };
                o.bimServerApi.getSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingStreamingSerializerPlugin2", function (serializer) {
                    o.bimServerApi.call("ServiceInterface", "downloadByNewJsonQuery", {
                        roids: o.options.roids,
                        query: JSON.stringify(query),
                        serializerOid : serializer.oid,
                        sync : false
                    }, function(topicId){
                        o.topicId = topicId;
                        o.bimServerApi.registerProgressHandler(o.topicId, o._progressHandler);
                    });
                });
            }

        };

        this._progressHandler = function (topicId, state) {
            if (topicId == o.topicId) {
                if (state.title == "Done preparing") {
                    if (!o.prepareReceived) {
                        o.prepareReceived = true;
                        o._downloadInitiated();
                    }
                }
                if (state.state == "FINISHED") {
                    o.bimServerApi.unregisterProgressHandler(o.topicId, o._progressHandler);
                }
            }
        };

        this._downloadInitiated = function () {
            o.state = {
                mode: 0,
                nrObjectsRead: 0,
                nrObjects: 0
            };
            // o.viewer.SYSTEM.events.trigger('progressStarted', ['Loading Geometry']);
            // o.viewer.SYSTEM.events.trigger('progressBarStyleChanged', BIMSURFER.Constants.ProgressBarStyle.Continuous);
            var msg = {
                longActionId: o.topicId,
                topicId: o.topicId
            };
            o.bimServerApi.setBinaryDataListener(o.topicId, o._binaryDataListener);
            o.bimServerApi.downloadViaWebsocket(msg);
        };

        this._binaryDataListener = function (data) {
            o.todo.push(data);
        };

        this._afterRegistration = function (topicId) {
            o.bimServerApi.call("Bimsie1NotificationRegistryInterface", "getProgress", {
                topicId: o.topicId
            }, function (state) {
                o._progressHandler(o.topicId, state);
            });
        };

        this._readEnd = function (data) {
			o.progressListeners.forEach(function(progressListener){
				progressListener("done", o.state.nrObjectsRead, o.state.nrObjectsRead);
			});
			o.bimServerApi.call("ServiceInterface", "cleanupLongAction", {topicId: o.topicId}, function(){});
        };

        this._readStart = function (data) {
            var start = data.readUTF8();

            if (start != "BGS") {
                console.error("data does not start with BGS (" + start + ")");
                return false;
            }

            var version = data.readByte();

            if (BIMSERVER_VERSION == "1.4") {
	            if (version != 4 && version != 5 && version != 6) {
	                console.error("Unimplemented version");
	                return false;
	            }
            } else {
	            if (version != 10) {
	                console.error("Unimplemented version");
	                return false;
	            }
            }
            data.align8();

            if (BIMSERVER_VERSION == "1.4") {
                var boundary = data.readFloatArray(6);
            } else {
                var boundary = data.readDoubleArray(6);
            }

            this._initCamera(boundary);

            o.state.mode = 1;

            if (BIMSERVER_VERSION == "1.4") {
            	o.state.nrObjects = data.readInt();
            }

			o.progressListeners.forEach(function(progressListener){
				progressListener("start", o.state.nrObjectsRead, o.state.nrObjectsRead);
			});
            //o._updateProgress();
        };

        this._initCamera = function (boundary) {

            if (!this._gotCamera) {

                this._gotCamera = true;

                // Bump scene origin to center the model

                var xmin = boundary[0];
                var ymin = boundary[1];
                var zmin = boundary[2];
                var xmax = boundary[3];
                var ymax = boundary[4];
                var zmax = boundary[5];

                var diagonal = Math.sqrt(
                    Math.pow(xmax - xmin, 2) +
                    Math.pow(ymax - ymin, 2) +
                    Math.pow(zmax - zmin, 2));

                var scale = 100 / diagonal;

                this.viewer.setScale(scale); // Temporary until we find a better scaling system.

                var far = diagonal * 5; // 5 being a guessed constant that should somehow coincide with the max zoom-out-factor

                var center = [
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
        };

        this._updateProgress = function () {
//            if (o.state.nrObjectsRead < o.state.nrObjects) {
//                var progress = Math.ceil(100 * o.state.nrObjectsRead / o.state.nrObjects);
//                if (progress != o.state.lastProgress) {
//                    o.progressListeners.forEach(function (progressListener) {
//                        progressListener(progress, o.state.nrObjectsRead, o.state.nrObjects);
//                    });
//                    // TODO: Add events
//                    // o.viewer.SYSTEM.events.trigger('progressChanged', [progress]);
//                    o.state.lastProgress = progress;
//                }
//            } else {
//                // o.viewer.SYSTEM.events.trigger('progressDone');
//                o.progressListeners.forEach(function (progressListener) {
//                    progressListener("done", o.state.nrObjectsRead, o.state.nrObjects);
//                });
//                // o.viewer.events.trigger('sceneLoaded', [o.viewer.scene.scene]);
//
//                var d = {};
//                d[BIMSERVER_VERSION == "1.4" ? "actionId" : "topicId"] = o.topicId;
//                o.bimServerApi.call("ServiceInterface", "cleanupLongAction", d, function () {});
//            }
        };

        this._readObject = function (stream, geometryType) {
        	if (BIMSERVER_VERSION != "1.4") {
        		stream.align8();
        	}

//            var type = stream.readUTF8();
//            var roid = stream.readLong(); // TODO: Needed?
//            var objectId = stream.readLong();
//            var oid = objectId;

            var geometryId;
            var numGeometries;
            var numParts;
            var objectBounds;
            var numIndices;
            var indices;
            var numPositions;
            var positions;
            var numNormals;
            var normals;
            var numColors;
            var colors = null;

            var i;


            if (geometryType == 1) {
                geometryId = stream.readLong();
                numIndices = stream.readInt();
                if (BIMSERVER_VERSION == "1.4") {
                	indices = stream.readIntArray(numIndices);
                } else {
                	indices = stream.readShortArray(numIndices);
                	stream.align4();
                }
                numPositions = stream.readInt();
                positions = stream.readFloatArray(numPositions);
                numNormals = stream.readInt();
                normals = stream.readFloatArray(numNormals);
                numColors = stream.readInt();
                if (numColors > 0) {
                	colors = stream.readFloatArray(numColors);
                }

				o.geometryIds[geometryId] = [geometryId];
                this.viewer.createGeometry(geometryId, positions, normals, colors, indices);
            } else if (geometryType == 2) {
            } else if (geometryType == 3) {
     			var geometryDataOid = stream.readLong();
                numParts = stream.readInt();
				o.geometryIds[geometryDataOid] = [];
				
                for (i = 0; i < numParts; i++) {
                    geometryId = stream.readLong();
                    numIndices = stream.readInt();

                    if (BIMSERVER_VERSION == "1.4") {
                    	indices = stream.readIntArray(numIndices);
                    } else {
                    	indices = stream.readShortArray(numIndices);
                    	stream.align4();
                    }

                    numPositions = stream.readInt();
                    positions = stream.readFloatArray(numPositions);
                    numNormals = stream.readInt();
                    normals = stream.readFloatArray(numNormals);
                    numColors = stream.readInt();
                    if (numColors > 0) {
                    	colors = stream.readFloatArray(numColors);
                    }

					o.geometryIds[geometryDataOid].push(geometryId);
                    this.viewer.createGeometry(geometryId, positions, normals, colors, indices);
                }
            } else if (geometryType == 4) {
            } else if (geometryType == 5) {
            	var roid = stream.readLong();
    			var geometryInfoOid = stream.readLong();
    			var objectBounds = stream.readDoubleArray(6);
    			var matrix = stream.readDoubleArray(16);
    			var geometryDataOid = stream.readLong();
				var geometryDataOids = o.geometryIds[geometryDataOid];
    			var oid = o.infoToOid[geometryInfoOid];
    			if (oid == null) {
    				console.error("Not found", o.infoToOid, geometryInfoOid);
    			} else {
    				o.models[roid].get(oid, function(object){
    					object.gid = geometryInfoOid;
    					var modelId = roid; // TODO: set to the model ID
    					o._createObject(modelId, roid, oid, oid, geometryDataOids, object.getType(), matrix);
    				});
    			}
            } else {

                //this.warn("Unsupported geometry type: " + geometryType);
                return;
            }

            o.state.nrObjectsRead++;

            o._updateProgress();
        };

        this._createObject = function (modelId, roid, oid, objectId, geometryIds, type, matrix) {

            if (o.state.mode == 0) {
                console.log("Mode is still 0, should be 1");
                return;
            }


            // o.models[roid].get(oid,
                // function () {
                    if (o.viewer.createObject(modelId, roid, oid, objectId, geometryIds, type, matrix)) {

                        // o.objectAddedListeners.forEach(function (listener) {
                        // listener(objectId);
                        // });
                    }

                // });
        };
    }

    return BimServerGeometryLoader;

});