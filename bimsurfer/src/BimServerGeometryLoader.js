define(["./DataInputStreamReader"], function (DataInputStreamReader) {

    function BimServerGeometryLoader(bimServerApi, viewer, model, roid, globalTransformationMatrix) {

        var o = this;

        o.bimServerApi = bimServerApi;
        o.viewer = viewer;
        o.state = {};
        o.progressListeners = [];
        o.objectAddedListeners = [];
        o.prepareReceived = false;
        o.todo = [];
        o.geometryIds = {};
        o.dataToInfo = {};
        
        o.model = model;
        o.roid = roid;
        
        console.log(globalTransformationMatrix);

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

        this.setLoadOids = function (oids) {
            o.options = {type: "oids", oids: oids};
        };

        /**
         * Starts this loader.
         */
        this.start = function () {
            if (!o.options || o.options.type !== "oids") {
                throw new Error("Invalid loader configuration");
            }

            if (BIMSERVER_VERSION == "1.4") {

                o.groupId = o.roid;
                o.oids = o.options.oids;
                o.bimServerApi.getMessagingSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingSerializerPlugin", function (serializer) {
                    o.bimServerApi.call("Bimsie1ServiceInterface", "downloadByOids", {
                        roids: [o.roid],
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
                var obj = [];

                o.groupId = o.roid;
                o.infoToOid = o.options.oids;

                for (var k in o.infoToOid) {
                    var oid = parseInt(o.infoToOid[k]);
                    o.model.apiModel.get(oid, function(object){
                        if (object.object._rgeometry != null) {
                            if (object.model.objects[object.object._rgeometry] != null) {
                                // Only if this data is preloaded, otherwise just don't include any gi
                                object.getGeometry(function(geometryInfo){
                                    obj.push({gid: object.object._rgeometry, oid: object.oid, object: object, info: geometryInfo.object});
                                });
                            } else {
                                obj.push({gid: object.object._rgeometry, oid: object.oid, object: object});
                            }
                        }
                    });
                }
                obj.sort(function(a, b){
                    if (a.info != null && b.info != null) {
                        var topa = (a.info._emaxBounds.z + a.info._eminBounds.z) / 2;
                        var topb = (b.info._emaxBounds.z + b.info._eminBounds.z) / 2;
                        return topa - topb;
                    } else {
                        // Resort back to type
                        // TODO this is dodgy when some objects do have info, and others don't
                        return a.object.getType().localeCompare(b.object.getType());
                    }
                });

                var oids = [];
                obj.forEach(function(wrapper){
                    oids.push(wrapper.object.object._rgeometry._i);
                });

                var query = {
                    type: "GeometryInfo",
                    oids: oids,
                    include: {
                        type: "GeometryInfo",
                        field: "data"
                    }
                };
                o.bimServerApi.getSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingStreamingSerializerPlugin3").then((serializer) => {
                    o.bimServerApi.call("ServiceInterface", "download", {
                        roids: [o.roid],
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

            o.protocolVersion = data.readByte();
            console.log(o.protocolVersion);

            if (BIMSERVER_VERSION == "1.4") {
                if (version != 4 && version != 5 && version != 6) {
                    console.error("Unimplemented version");
                    return false;
                }
            } else {
                if (o.protocolVersion != 10 && o.protocolVersion != 11 && o.protocolVersion != 12) {
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
                
                var scaledGlobalTransformationMatrix = globalTransformationMatrix.slice(); 
                scaledGlobalTransformationMatrix[12] = globalTransformationMatrix[12] * scale; 
                scaledGlobalTransformationMatrix[13] = globalTransformationMatrix[13] * scale; 
                scaledGlobalTransformationMatrix[14] = globalTransformationMatrix[14] * scale; 
 
                var transformedCenter = xeogl.math.mulMat4v4(scaledGlobalTransformationMatrix, new xeogl.math.vec4([center[0], center[1], center[2], 1])); 
                var finalCenter = [transformedCenter[0], transformedCenter[1], transformedCenter[2]]; 
 
                this.viewer.setCamera({
                    type: "persp",
                    target: finalCenter,
                    up: [0, 0, 1],
                    eye: [finalCenter[0] - scale * diagonal, finalCenter[1] - scale * diagonal, finalCenter[2] + scale * diagonal],
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
                if (o.protocolVersion == 12) {
                    var hasTransparency = stream.readLong() == 1;
                }
                geometryId = stream.readLong();
                numIndices = stream.readInt();
                if (BIMSERVER_VERSION == "1.4") {
                    indices = stream.readIntArray(numIndices);
                } else {
                    indices = stream.readShortArray(numIndices);
                }
                if (o.protocolVersion >= 11) {
                    var b = stream.readInt();
                    if (b == 1) {
                        var color = {r: stream.readFloat(), g: stream.readFloat(), b: stream.readFloat(), a: stream.readFloat()};
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
                    for (var i=0; i<numPositions; i++) {
                        colors[i * 4 + 0] = color.r;
                        colors[i * 4 + 1] = color.g;
                        colors[i * 4 + 2] = color.b;
                        colors[i * 4 + 3] = color.a;
                    }
                }

                o.geometryIds[geometryId] = [geometryId];
                this.viewer.createGeometry(geometryId, positions, normals, colors, indices);
                
                if (o.dataToInfo[geometryId] != null) {
                    o.dataToInfo[geometryId].forEach(function(oid){
                        var ob = o.viewer.getObject(o.roid + ":" + oid);
                        ob.add(geometryId);
                    });
                    delete o.dataToInfo[geometryId];
                }
            } else if (geometryType == 2) {
                console.log("Unimplemented", 2);
            } else if (geometryType == 3) {
                if (o.protocolVersion == 12) {
                    var hasTransparency = stream.readLong() == 1;
                }
                var geometryDataOid = stream.readLong();
                numParts = stream.readInt();
                o.geometryIds[geometryDataOid] = [];
                
                var geometryIds = [];
                for (i = 0; i < numParts; i++) {
                    var partId = stream.readLong();
                    geometryId = geometryDataOid + "_" + i;
                    numIndices = stream.readInt();

                    if (BIMSERVER_VERSION == "1.4") {
                        indices = stream.readIntArray(numIndices);
                    } else {
                        indices = stream.readShortArray(numIndices);
                    }

                    if (o.protocolVersion >= 11) {
                        var b = stream.readInt();
                        if (b == 1) {
                            var color = {r: stream.readFloat(), g: stream.readFloat(), b: stream.readFloat(), a: stream.readFloat()};
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
                        for (var i=0; i<numPositions; i++) {
                            colors[i * 4 + 0] = color.r;
                            colors[i * 4 + 1] = color.g;
                            colors[i * 4 + 2] = color.b;
                            colors[i * 4 + 3] = color.a;
                        }
                    }

                    geometryIds.push(geometryId);
                    o.geometryIds[geometryDataOid].push(geometryId);
                    this.viewer.createGeometry(geometryId, positions, normals, colors, indices);
                }
                if (o.dataToInfo[geometryDataOid] != null) {
                    o.dataToInfo[geometryDataOid].forEach(function(oid){
                        var ob = o.viewer.getObject(o.roid + ":" + oid);
                        geometryIds.forEach(function(geometryId){
                            ob.add(geometryId);
                        });
                    });
                    delete o.dataToInfo[geometryDataOid];
                }
            } else if (geometryType == 4) {
                console.log("Unimplemented", 4);
            } else if (geometryType == 5) {
                var roid = stream.readLong();
                var geometryInfoOid = stream.readLong();
                if (o.protocolVersion == 12) {
                    var hasTransparency = stream.readLong() == 1;
                }
                var objectBounds = stream.readDoubleArray(6);
                var matrix = stream.readDoubleArray(16);
                if (globalTransformationMatrix != null) {
                    xeogl.math.mulMat4(globalTransformationMatrix, matrix, matrix);
                }
                var geometryDataOid = stream.readLong();
                var geometryDataOids = o.geometryIds[geometryDataOid];
                var oid = o.infoToOid[geometryInfoOid];
                if (geometryDataOids == null) {
                    geometryDataOids = [];
                    var list = o.dataToInfo[geometryDataOid];
                    if (list == null) {
                        list = [];
                        o.dataToInfo[geometryDataOid] = list;
                    }
                    list.push(oid);
                }
                if (oid == null) {
                    console.error("Not found", o.infoToOid, geometryInfoOid);
                } else {
                    o.model.apiModel.get(oid, function(object){
                        object.gid = geometryInfoOid;
                        var modelId = o.roid; // TODO: set to the model ID
                        o._createObject(modelId, roid, oid, oid, geometryDataOids, object.getType(), matrix);
                    });
                }
            } else {
                this.warn("Unsupported geometry type: " + geometryType);
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