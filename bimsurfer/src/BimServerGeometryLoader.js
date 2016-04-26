define(["bimsurfer/src/DataInputStreamReader.js"], function (DataInputStreamReader) {

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

        this.addProgressListener = function (progressListener) {
            o.progressListeners.push(progressListener);
        };

        this.process = function () {

            var data = o.todo.shift();
            var stream;

            while (data != null) {

                stream = new DataInputStreamReader(data);

                var channel = stream.readInt();
                var nrMessages = stream.readInt();

                for (var i = 0; i < nrMessages; i++) {

                    var messageType = stream.readByte();

                    if (messageType == 0) {
                        o._readStart(stream);
                    } else {
                        o._readObject(stream, messageType);
                    }
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
            if (o.options != null) {
                if (o.options.type == "types") {
                    var types = o.options.types.map(function (type) {
                        return type.name;
                    });
                    o.groupId = o.options.roid;
                    o.types = o.options.types;
                    o.bimServerApi.getMessagingSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingSerializerPlugin", function (serializer) {
                        o.bimServerApi.call("Bimsie1ServiceInterface", "downloadByTypes", {
                            roids: [o.options.roid],
                            schema: o.options.schema,
                            classNames: types,
                            serializerOid: serializer.oid,
                            includeAllSubtypes: false,
                            useObjectIDM: false,
                            sync: false,
                            deep: false
                        }, function (topicId) {
                            o.topicId = topicId;
                            o.bimServerApi.registerProgressHandler(o.topicId, o._progressHandler, o._afterRegistration);
                        });
                    });
                } else if (o.options.type == "revision") {
                    o.groupId = o.options.roid;
                    o.types = o.options.types;
                    o.bimServerApi.getMessagingSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingSerializerPlugin", function (serializer) {
                        o.bimServerApi.call("Bimsie1ServiceInterface", "download", {
                            roid: o.options.roid,
                            serializerOid: serializer.oid,
                            sync: false,
                            showOwn: true
                        }, function (topicId) {
                            o.topicId = topicId;
                            o.bimServerApi.registerProgressHandler(o.topicId, o._progressHandler, o._afterRegistration);
                        });
                    });
                } else if (o.options.type == "oids") {
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
                    o.bimServerApi.getSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingSerializerPlugin", function (serializer) {
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

        this._readStart = function (data) {

            var start = data.readUTF8();

            if (start != "BGS") {
                console.error("data does not start with BGS (" + start + ")");
                return false;
            }

            var version = data.readByte();

            if (version != 4 && version != 5 && version != 6) {
                console.error("Unimplemented version");
                return false;
            }

            data.align4();

            var boundary = data.readDoubleArray(6);

            this._initCamera(boundary);

            o.state.mode = 1;
            o.state.nrObjects = data.readInt();

            o._updateProgress();
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

                var center = [
                    (xmax + xmin) / 2,
                    (ymax + ymin) / 2,
                    (zmax + zmin) / 2
                ];

                var diagonal = Math.sqrt(
                    Math.pow(xmax - xmin, 2) +
                    Math.pow(ymax - ymin, 2) +
                    Math.pow(zmax - zmin, 2));

                var far = diagonal * 5; // 5 being a guessed constant that should somehow coincide with the max zoom-out-factor

                this.viewer.setCamera({
                    target: center,
                    up: [0, 0, 1],
                    eye: [center[0] - 50, center[1] - 100, center[2]],
                    far: far,
                    near: far / 1000,
                    fovy: 37.8493
                });
            }
        };

        this._updateProgress = function () {
            if (o.state.nrObjectsRead < o.state.nrObjects) {
                var progress = Math.ceil(100 * o.state.nrObjectsRead / o.state.nrObjects);
                if (progress != o.state.lastProgress) {
                    o.progressListeners.forEach(function (progressListener) {
                        progressListener(progress, o.state.nrObjectsRead, o.state.nrObjects);
                    });
                    // TODO: Add events
                    // o.viewer.SYSTEM.events.trigger('progressChanged', [progress]);
                    o.state.lastProgress = progress;
                }
            } else {
                // o.viewer.SYSTEM.events.trigger('progressDone');
                o.progressListeners.forEach(function (progressListener) {
                    progressListener("done", o.state.nrObjectsRead, o.state.nrObjects);
                });
                // o.viewer.events.trigger('sceneLoaded', [o.viewer.scene.scene]);
                o.bimServerApi.call("ServiceInterface", "cleanupLongAction", {topicId: o.topicId}, function () {
                });
            }
        };

        this._readObject = function (stream, geometryType) {

            var type = stream.readUTF8();
            var roid = stream.readLong(); // TODO: Needed?
            var objectId = stream.readLong();
            var oid = objectId;

            var geometryId;
            var geometryIds = [];
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
            var colors;

            var i;

            stream.align8();

            var matrix = stream.readDoubleArray(16);

            if (geometryType == 1) {
                objectBounds = stream.readDoubleArray(6);
                geometryId = stream.readLong();
                numIndices = stream.readInt();
                indices = stream.readIntArray(numIndices);
                numPositions = stream.readInt();
                positions = stream.readFloatArray(numPositions);
                numNormals = stream.readInt();
                normals = stream.readFloatArray(numNormals);
                numColors = stream.readInt();
                if (numColors > 0) {
                	colors = stream.readFloatArray(numColors);
                }

                this.viewer.createGeometry(geometryId, positions, normals, colors, indices);

                this._createObject(roid, oid, objectId, [geometryId], type, matrix);

            } else if (geometryType == 2) {

                geometryId = stream.readLong();

                this._createObject(roid, oid, objectId, [geometryId], type, matrix);

            } else if (geometryType == 3) {

                numParts = stream.readInt();

                for (i = 0; i < numParts; i++) {

                    // Object contains multiple geometries

                    geometryId = stream.readLong();
                    numIndices = stream.readInt();
                    indices = stream.readIntArray(numIndices);
                    numPositions = stream.readInt();
                    positions = stream.readFloatArray(numPositions);
                    numNormals = stream.readInt();
                    normals = stream.readFloatArray(numNormals);
                    numColors = stream.readInt();
                    if (numColors > 0) {
                    	colors = stream.readFloatArray(numColors);
                    }
                    colors = stream.readFloatArray(numColors);

                    this.viewer.createGeometry(geometryId, positions, normals, colors, indices);

                    geometryIds.push(geometryId);
                }

                this._createObject(roid, oid, objectId, geometryIds, type, matrix);

            } else if (geometryType == 4) {

                // Object contains multiple instances of geometries

                numGeometries = stream.readInt();
                geometryIds = [];

                for (i = 0; i < numGeometries; i++) {
                    geometryIds.push(stream.readLong());
                }

                this._createObject(roid, oid, objectId, geometryIds, type, matrix);

            } else {

                //this.warn("Unsupported geometry type: " + geometryType);
                return;
            }

            o.state.nrObjectsRead++;

            o._updateProgress();
        };

        this._createObject = function (roid, oid, objectId, geometryIds, type, matrix) {

            if (o.state.mode == 0) {
                console.log("Mode is still 0, should be 1");
                return;
            }

            o.models[roid].get(oid,
                function () {

                    if (o.viewer.scene.components[objectId]) {
                        console.log("Object with id " + objectId + " already existed");
                        return;
                    }

                    o.viewer.createObject(roid, oid, objectId, geometryIds, type, matrix);

                    o.objectAddedListeners.forEach(function (listener) {

                        listener(objectId);
                    });
                });
        };
    }

    return BimServerGeometryLoader;

});