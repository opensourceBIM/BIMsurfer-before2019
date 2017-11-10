define(["./BimServerModel", "./PreloadQuery", "./BimServerGeometryLoader", "./BimSurfer"], function(BimServerModel, PreloadQuery, BimServerGeometryLoader, BimSufer) { 
    
    function BimServerModelLoader(bimServerClient, bimSurfer) {
    	
    	var o = this;
    	
    	this.loadFullModel = function(apiModel){
    		return new Promise(function(resolve, reject) {
    			var model = new BimServerModel(apiModel);

    			apiModel.query(PreloadQuery, function () {}).done(function(){
    				var oids = [];
    				apiModel.getAllOfType("IfcProduct", true, function(object){
    					oids.push(object.oid);
    				});
    				o.loadOids(model, oids);
    				resolve(model);
                });
    		});
    	};
    	
    	this.loadObjects = function(apiModel, objects){
    		return new Promise(function(resolve, reject) {
    			var model = new BimServerModel(apiModel);

				var oids = [];
				objects.forEach(function(object){
					oids.push(object.oid);
				});
				o.loadOids(model, oids);
				resolve(model);
    		});
    	};
    	
    	this.loadOids = function(model, oids){
            var oidToGuid = {};
            var guidToOid = {};

            var oidGid = {};
            
            oids.forEach(function(oid){
            	model.apiModel.get(oid, function(object){
            		if (object.object._rgeometry != null) {
            			var gid = object.object._rgeometry._i;
            			var guid = object.object.GlobalId;
            			oidToGuid[oid] = guid;
            			guidToOid[guid] = oid;
            			oidGid[gid] = oid;
            		}
            	});
            });
            
            bimSurfer._idMapping.toGuid.push(oidToGuid);
            bimSurfer._idMapping.toId.push(guidToOid);
    		
    		var viewer = bimSurfer.viewer;
    		viewer.taskStarted();
	
    		viewer.createModel(model.apiModel.roid);
	
	        var loader = new BimServerGeometryLoader(model.api, viewer, model, model.apiModel.roid, o.globalTransformationMatrix);
	
	        loader.addProgressListener(function (progress, nrObjectsRead, totalNrObjects) {
				if (progress == "start") {
					console.log("Started loading geometries");
//					self.fire("loading-started");
				} else if (progress == "done") {
					console.log("Finished loading geometries (" + totalNrObjects + " objects received)");
//					self.fire("loading-finished");
	                viewer.taskFinished();
				}
	        });
	
	        loader.setLoadOids(oidGid);
	
	        // viewer.clear(); // For now, until we support multiple models through the API
	
	        viewer.on("tick", function () { // TODO: Fire "tick" event from xeoViewer
	            loader.process();
	        });
	
	        loader.start();
    	}
    	
    	this.setGlobalTransformationMatrix = function(globalTransformationMatrix) {
    		o.globalTransformationMatrix = globalTransformationMatrix;
    	}
    }
    
    BimServerModelLoader.prototype = Object.create(BimServerModelLoader.prototype);

    return BimServerModelLoader;
});