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
	
	// GeometryInfo.oid -> GeometryData.oid
	o.infoToData = {};
	
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
		data.align4();
		if (geometryType == 5) {
			var roid = data.readLong();
			var geometryInfoOid = data.readLong();
			var objectBounds = data.readFloatArray(6);
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
			
			var transformationMatrix = data.readFloatArray(16);
			var geometryDataOid = data.readLong();
			var coreIds = [geometryDataOid];
			o.infoToData[geometryInfoOid] = geometryDataOid;
			if (o.dataToInfo[geometryDataOid] == null) {
				o.dataToInfo[geometryDataOid] = [geometryInfoOid];
			} else {
				o.dataToInfo[geometryDataOid].push(geometryInfoOid);
			}
			
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
						if (Object.prototype.toString.call(loaded) === '[object Array]') {
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
								alpha: material.a,
								nodes : [{
									type : "name",
									id : geometryInfoOid,
									oid: oid,
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
			}
		} else if (geometryType == 1) {
			var geometryDataOid = data.readLong();
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
			
			geometry.coreId = geometryDataOid;
			geometry.indices = indices;
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
			}
		}

		o.state.nrObjectsRead++;
		o.updateProgress();
	};
	
	this.updateProgress = function() {
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
			topicId: o.topicId
		};
		
		o.bimServerApi.setBinaryDataListener(o.topicId, o.binaryDataListener);
		o.bimServerApi.downloadViaWebsocket(msg);
	};
	
	this.binaryDataListener = function(data){
		o.todo.push(data);
	};
	
	this.readEnd = function(data){
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
		
		o.viewer.SYSTEM.events.trigger('progressDone');
		o.progressListeners.forEach(function(progressListener){
			progressListener("done", o.state.nrObjectsRead, o.state.nrObjectsRead);
		});
		o.viewer.events.trigger('sceneLoaded', [o.viewer.scene]);
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
		if (version != 4 && version != 5 && version != 6 && version != 7) {
			console.log("Unimplemented version");
			return false;
		} else {
			o.state.version = version;
		}
		data.align4();
		
		var modelBounds = data.readFloatArray(6);
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
		}
		o.state.mode = 1;
//o.state.nrObjects = data.readInt();
		o.updateProgress();
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
				} else if (messageType == 6) {
					o.readEnd(inputStream);
				} else {
					o.readObject(inputStream, messageType);
				}
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
		}
	};

	this.setLoadRevision = function(roid) {
		o.options = {type: "revision", roid: roid};
	};
	
	this.setLoadTypes = function(roid, schema, types) {
		o.options = {type: "types", schema: schema, roid: roid, types: types};
	};
	
	this.setLoadOids = function(roids, oids) {
		o.options = {type: "oids", roids: roids, oids: oids};
	}

	this.start = function(){
		if (o.options != null) {
			if (o.options.type == "types") {
				var types = o.options.types.map(function(type){
					return type.name;
				});
				o.groupId = o.options.roid;
				o.types = o.options.types;
				o.bimServerApi.getMessagingSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingSerializerPlugin", function(serializer){
					o.bimServerApi.call("Bimsie1ServiceInterface", "downloadByTypes", {
						roids: [o.options.roid],
						schema: o.options.schema,
						classNames : types,
						serializerOid : serializer.oid,
						includeAllSubtypes : false,
						useObjectIDM : false,
						sync : false,
						deep: false
					}, function(topicId){
						o.topicId = topicId;
						o.bimServerApi.registerProgressHandler(o.topicId, o.progressHandler);
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
						o.bimServerApi.registerProgressHandler(o.topicId, o.progressHandler);
					});
				});
			} else if (o.options.type == "oids") {
				o.groupId = o.options.roids[0];
				
				o.infoToOid = o.options.oids;
				
				var oids = [];
				for (var k in o.infoToOid) {
				    if (o.infoToOid.hasOwnProperty(k)) {
				    	if (k != null && k != "undefined") {
				    		oids.push(parseInt(k, 10));
				    	}
				    }
				}
				
				var query = {
					type: "GeometryInfo",
					oids: oids,
					include: {
						type: "GeometryInfo",
						field: "data"
					}
				};
				o.bimServerApi.getSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometryMessagingStreamingSerializerPlugin", function(serializer){
					o.bimServerApi.call("Bimsie1ServiceInterface", "downloadByNewJsonQuery", {
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