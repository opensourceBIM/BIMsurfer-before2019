function GeometryLoader(bimServerApi, models, viewer) {
	var o = this;
	o.models = models;
	o.bimServerApi = bimServerApi;
	o.viewer = viewer;
	o.state = {};
	o.progressListeners = [];
	o.objectAddedListeners = [];
	o.prepareReceived = false;
	o.todo = [];

	this.addProgressListener = function(progressListener) {
		o.progressListeners.push(progressListener);
	};
	
	this.readObject = function(data, geometryType) {
		var type = data.readUTF8();
		var roid = data.readLong();
		var objectId = data.readLong();
		data.align4();
		var transformationMatrix = data.readFloatArray(16);
		if (geometryType == 1) {
			var objectBounds = data.readFloatArray(6);
			var coreId = data.readLong();
			var nrIndices = data.readInt();
			var indices = data.readIntArray(nrIndices);
			var nrVertices = data.readInt();
			var vertices = data.readFloatArray(nrVertices);
			var nrNormals = data.readInt();
			var normals = data.readFloatArray(nrNormals);
			var nrColors = data.readInt();
			var colors = data.readFloatArray(nrColors);
			
			var geometry = {
				type: "geometry",
				primitive: "triangles"
			};
			
			geometry.coreId = coreId;
			geometry.indices = indices;
			geometry.positions = vertices;
			geometry.normals = normals;
			
			if (colors != null && colors.length > 0) {
				geometry.colors = colors;
			}
			o.library.add("node", geometry);
			o.processGeometry(roid, objectId, geometryType, objectId, [coreId], type, transformationMatrix);
		} else if (geometryType == 2) {
			var coreId = data.readLong();
			o.processGeometry(roid, objectId, geometryType, objectId, [coreId], type, transformationMatrix);
		} else if (geometryType == 3) {
			var coreIds = [];
			var nrParts = data.readInt();
			var objectBounds = data.readFloatArray(6);
			for (var i=0; i<nrParts; i++) {
				var coreId = data.readLong();
				coreIds.push(coreId);
				var nrIndices = data.readInt();
				var indices = data.readIntArray(nrIndices);
				var nrVertices = data.readInt();
				var vertices = data.readFloatArray(nrVertices);
				var nrNormals = data.readInt();
				var normals = data.readFloatArray(nrNormals);
				var nrColors = data.readInt();
				var colors = data.readFloatArray(nrColors);
				
				var geometry = {
					type: "geometry",
					primitive: "triangles"
				};
				
				geometry.coreId = coreId;
				geometry.indices = indices;
				geometry.positions = vertices;
				geometry.normals = normals;
				
				if (colors != null && colors.length > 0) {
					geometry.colors = colors;
				}
				o.library.add("node", geometry);
			}
			o.processGeometry(roid, objectId, geometryType, objectId, coreIds, type, transformationMatrix);
		} else if (geometryType == 4) {
			var nrCoreIds = data.readInt();
			var coreIds = [];
			for (var i=0; i<nrCoreIds; i++) {
				coreIds.push(data.readLong());
			}
			o.processGeometry(roid, objectId, geometryType, objectId, coreIds, type, transformationMatrix);
		}
		o.state.nrObjectsRead++;
		o.updateProgress();
	};
	
	this.updateProgress = function() {
		if (o.state.nrObjectsRead < o.state.nrObjects) {
			var progress = Math.ceil(100 * o.state.nrObjectsRead / o.state.nrObjects);
			if (progress != o.state.lastProgress) {
				o.progressListeners.forEach(function(progressListener){
					progressListener(progress);
				});
				o.viewer.SYSTEM.events.trigger('progressChanged', [progress]);
				o.state.lastProgress = progress;
			}
		} else {
			o.viewer.SYSTEM.events.trigger('progressDone');
			o.progressListeners.forEach(function(progressListener){
				progressListener("done");
			});
			o.viewer.events.trigger('sceneLoaded', [o.viewer.scene]);
			o.bimServerApi.call("ServiceInterface", "cleanupLongAction", {actionId: o.topicId}, function(){
			});
		}
	};
	
	this.downloadInitiated = function(){
		o.state = {
			nrObjectsRead: 0,
			nrObjects: 0
		};
		o.viewer.SYSTEM.events.trigger('progressStarted', ['Loading Geometry']);
		o.viewer.SYSTEM.events.trigger('progressBarStyleChanged', BIMSURFER.Constants.ProgressBarStyle.Continuous);
		
		o.viewer.refreshMask();

		o.library = o.viewer.scene.findNode("library-" + o.groupId);
		if (o.library == null) {
			o.library = o.viewer.scene.addNode({
				id: "library-" + o.groupId,
				type: "library"
			});
		}
		
		var msg = {
			longActionId: o.topicId,
			topicId: o.groupId
		};
		
		o.bimServerApi.setBinaryDataListener(o.groupId, o.binaryDataListener);
		o.bimServerApi.downloadViaWebsocket(msg);
	};
	
	this.binaryDataListener = function(data){
		o.todo.push(data);
	};
	
	this.processGeometry = function(roid, oid, geometryType, objectId, coreIds, type, transformationMatrix) {
		o.models[roid].get(oid, function(object){
			if (o.viewer.scene.findNode(objectId) != null) {
				console.log("Node with id " + objectId + " already existed");
				return;
			}

			var material = BIMSURFER.Constants.materials[type];
			var hasTransparency = false;
			if (material == null) {
				console.log("material not found", type);
				material = BIMSURFER.Constants.materials["DEFAULT"];
			}
			if (material.a < 1) {
				hasTransparency = true;
			}

			var enabled = object.trans.mode == 0;
			
			var coreNodes = [];
			coreIds.forEach(function(coreId){
				coreNodes.push({
					type: "geometry",
					coreId: coreId
				});
			});
			
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
						alpha: material.a,
						nodes : [{
							type : "name",
							id : objectId,
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
				listener(objectId);
			});
		});
	};
	
	this.readStart = function(data){
		var start = data.readUTF8();
		if (start != "BGS") {
			console.log("Stream does not start with BGS (" + start + ")");
			return false;
		}
		var version = data.readByte();
		if (version != 4 && version != 5 && version != 6) {
			console.log("Unimplemented version");
			return false;
		} else {
			o.state.version = version;
		}
		data.align4();
		var modelBounds = data.readFloatArray(6);
		modelBounds = {
			min: {x: modelBounds[0], y: modelBounds[1], z: modelBounds[2]},
			max: {x: modelBounds[3], y: modelBounds[4], z: modelBounds[5]}
		};
		var center = {
			x: (modelBounds.max.x + modelBounds.min.x) / 2,
			y: (modelBounds.max.y + modelBounds.min.y) / 2,
			z: (modelBounds.max.z + modelBounds.min.z) / 2,
		};
		
		o.boundsTranslate = o.viewer.scene.findNode("bounds_translate");
		var firstModel = false;
		if (o.boundsTranslate == null) {
			var firstModel = true;
			o.boundsTranslate = {
				id: "bounds_translate",
				type: "translate",
				x: -center.x,
				y: -center.y,
				z: -center.z,
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
			var eye = { x: (modelBounds.max.x - modelBounds.min.x) * 0.5, y: (modelBounds.max.y - modelBounds.min.y) * -1, z: (modelBounds.max.z - modelBounds.min.z) * 0.5 };
			lookat.set("eye", eye);
			
			var maincamera = o.viewer.scene.findNode("main-camera");
			
			var diagonal = Math.sqrt(Math.pow(modelBounds.max.x - modelBounds.min.x, 2) + Math.pow(modelBounds.max.y - modelBounds.min.y, 2) + Math.pow(modelBounds.max.z - modelBounds.min.z, 2));
			
			var far = diagonal * 5; // 5 being a guessed constant that should somehow coincide with the max zoom-out-factor
			
			maincamera.setOptics({
				type: 'perspective',
				far: far,
				near: far / 1000,
				aspect: jQuery(o.viewer.canvas).width() / jQuery(o.viewer.canvas).height(),
				fovy: 37.8493
			});
		}
		o.state.nrObjects = data.readInt();
//		console.log("Nr Objects", o.state.nrObjects);
	};
	
	this.process = function(){
		var data = o.todo.shift();
		while (data != null) {
			inputStream = new BIMSURFER.DataInputStreamReader(null, data);
			var channel = inputStream.readInt();
			var nrMessages = inputStream.readInt();
			for (var i=0; i<nrMessages; i++) {
				var messageType = inputStream.readByte();
				if (messageType == 0) {
					o.readStart(inputStream);
				} else {
					o.readObject(inputStream, messageType);
				}
			}
			data = o.todo.shift();
		}
	};
	
	this.progressHandler = function(topicId, state){
		if (topicId == o.topicId) {
			o.progressListeners.forEach(function(progressListener){
				progressListener(state.progress);
				o.viewer.SYSTEM.events.trigger('progressChanged', [state.progress]);
			});
			if (state.title == "Done preparing") {
				if (!o.prepareReceived) {
					o.prepareReceived = true;
					o.downloadInitiated();
				}
			}
			if (state.state == "FINISHED") {
				o.bimServerApi.unregisterProgressHandler(o.topicId, o.progressHandler);
			}
		}
	};

	// Loads everything, but only show the types given in types
	this.setLoadRevision = function(roid, types) {
		o.options = {type: "revision", roid: roid, types: types};
	};
	
	// Only loads the given types
	this.setLoadTypes = function(roid, types) {
		o.options = {type: "types", roid: roid, types: types};
	};
	
	this.setLoadOids = function(roids, oids) {
		o.options = {type: "oids", roids: roids, oids: oids};
	}

	this.afterRegistration = function(topicId) {
		Global.bimServerApi.call("Bimsie1NotificationRegistryInterface", "getProgress", {
			topicId: o.topicId
		}, function(state){
			o.progressHandler(o.topicId, state);
		});
	}
	
	this.start = function(){
		if (o.options != null) {
			if (o.options.type == "types") {
				o.groupId = o.options.roid;
				o.types = o.options.types;
				o.bimServerApi.getMessagingSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingSerializerPlugin", function(serializer){
					o.bimServerApi.call("Bimsie1ServiceInterface", "downloadByTypes", {
						roids: [o.options.roid],
						classNames : o.options.types,
						serializerOid : serializer.oid,
						includeAllSubtypes : false,
						useObjectIDM : false,
						sync : false,
						deep: false
					}, function(topicId){
						o.topicId = topicId;
						o.bimServerApi.registerProgressHandler(o.topicId, o.progressHandler, o.afterRegistration);
					});
				});
			} else if (o.options.type == "revision") {
				o.groupId = o.options.roid;
				o.types = o.options.types;
				o.bimServerApi.getMessagingSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingSerializerPlugin", function(serializer){
					o.bimServerApi.call("Bimsie1ServiceInterface", "download", {
						roid: o.options.roid,
						serializerOid : serializer.oid,
						sync : false,
						showOwn: true
					}, function(topicId){
						o.topicId = topicId;
						o.bimServerApi.registerProgressHandler(o.topicId, o.progressHandler, o.afterRegistration);
					});
				});
			} else if (o.options.type == "oids") {
				o.groupId = o.options.roids[0];
				o.oids = o.options.oids;
				o.bimServerApi.getMessagingSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingSerializerPlugin", function(serializer){
					o.bimServerApi.call("Bimsie1ServiceInterface", "downloadByOids", {
						roids: o.options.roids,
						oids: o.options.oids,
						serializerOid : serializer.oid,
						sync : false,
						deep: false
					}, function(topicId){
						o.topicId = topicId;
						o.bimServerApi.registerProgressHandler(o.topicId, o.progressHandler, o.afterRegistration);
					});
				});
			}
		}
	};
}