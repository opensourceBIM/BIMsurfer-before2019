// Backwards compatibility
var deps = ["bimsurfer/src/Notifier.js", "bimsurfer/src/BimServerModel.js", "bimsurfer/src/PreloadQuery.js", "bimsurfer/src/BimServerGeometryLoader.js", "bimsurfer/src/xeoViewer/xeoViewer.js", "bimsurfer/src/EventHandler.js"];

/*
if (typeof(BimServerClient) == 'undefined') {
    window.BIMSERVER_VERSION = "1.4";
    deps.push("bimserverapi_BimServerApi");
} else {
    window.BIMSERVER_VERSION = "1.5";
}
*/

window.BIMSERVER_VERSION = "1.5";

define(deps, function (Notifier, Model, PreloadQuery, GeometryLoader, xeoViewer, EventHandler, _BimServerApi) {
	
    // Backwards compatibility
    var BimServerApi;
    if (_BimServerApi) {
		BimServerApi = _BimServerApi;
	} else {
        BimServerApi = window.BimServerClient;
	}
    
    function BimSurfer(cfg) {

        var self = this;

        EventHandler.call(this);

        cfg = cfg || {};

        var viewer = this.viewer = new xeoViewer({
            domNode: cfg.domNode
        });

        /**
         * Fired whenever this BIMSurfer's camera changes.
         * @event camera-changed
         */
        viewer.on("camera-changed", function() {
           self.fire("camera-changed", arguments);
        });

        /**
         * Fired whenever this BIMSurfer's selection changes.
         * @event selection-changed
         */
        viewer.on("selection-changed", function() {
            self.fire("selection-changed", arguments);
        });
        
        // This are arrays as multiple models might be loaded or unloaded.
        this._idMapping = {
            'toGuid': [],
            'toId'  : []
        };

        /**
         * Loads a model into this BIMSurfer.
         * @param params
         */
        this.load = function (params) {

            if (params.test) {
                viewer.loadRandom();
                return null;

            } else if (params.bimserver) {
                return this._loadFromServer(params);

            } else if (params.api) {
                return this._loadFromAPI(params);

            } else if (params.src) {
                return this._loadFrom_glTF(params);
            }
        };

        this._loadFromServer = function (params) {

            var notifier = new Notifier();
            var bimServerApi = new BimServerApi(params.bimserver, notifier);

            return new Promise(function (resolve, reject) {

                bimServerApi.init(function () {

                    bimServerApi.login(params.username, params.password, function () {

                        params.api = bimServerApi; // TODO: Make copy of params

                        self._loadFromAPI(params).then(function (m) {
                            resolve(m);
                        });

                    }, function () {
                        reject(arguments);
                    });
                });
            });
        };

        this._loadFrom_glTF = function (params) {
            if (params.src) {
                return new Promise(function (resolve, reject) {
                    var m = viewer.loadglTF(params.src);
                    m.on("loaded", function() {
                    
                        var numComponents = 0, componentsLoaded = 0;

                        m.collection.iterate(function (component) {
                            if (component.isType("XEO.Entity")) {
                                ++ numComponents;
                                (function(c) {
                                    var timesUpdated = 0;
                                    c.worldBoundary.on("updated", function() {
                                        if (++timesUpdated == 2) {
                                            ++ componentsLoaded;
                                            if (componentsLoaded == numComponents) {
                                                viewer.viewFit({});
                                                
                                                resolve(m);
                                            }
                                        }
                                    });
                                })(component);
                            }
                        });
                    });
                });
            }
        };

        this._loadFromAPI = function (params) {

            return new Promise(function (resolve, reject) {

                params.api.getModel(params.poid, params.roid, params.schema, false,
                    function (model) {

                        // TODO: Preload not necessary combined with the bruteforce tree
                        var fired = false;

//                        model.query(PreloadQuery,
//                            function () {
//                                if (!fired) {
                                    fired = true;
                                    var vmodel = new Model(params.api, model);

                                    self._loadModel(vmodel);

                                    resolve(vmodel);
//                                }
//                            });
                    });
            });
        };

        this._loadModel = function (model) {
        
            model.getTree().then(function (tree) {

                var oids = [];
                var oidToGuid = {};
                var guidToOid = {};

                var visit = function (n) {
                    if (BIMSERVER_VERSION == "1.4") {
                        oids.push(n.id);
                    } else {
                        oids[n.gid] = n.id;
                    }
                    oidToGuid[n.id] = n.guid;
                    guidToOid[n.guid] = n.id;
                    
                    for (var i = 0; i < (n.children || []).length; ++i) {
                        visit(n.children[i]);
                    }
                };

                visit(tree);
                
                self._idMapping.toGuid.push(oidToGuid);
                self._idMapping.toId.push(guidToOid);

                var models = {};

                // TODO: Ugh. Undecorate some of the newly created classes
                models[model.model.roid] = model.model;

                viewer.createModel(model.model.roid);

                var loader = new GeometryLoader(model.api, models, viewer);

                loader.addProgressListener(function (progress, nrObjectsRead, totalNrObjects) {
					if (progress == "start") {
						console.log("Started loading geometries");
						self.fire("loading-started");
					} else if (progress == "done") {
						console.log("Finished loading geometries (" + totalNrObjects + " objects received)");
						self.fire("loading-finished");
					}
                });

                loader.setLoadOids([model.model.roid], oids);

                viewer.clear(); // For now, until we support multiple models through the API

                viewer.on("tick", function () { // TODO: Fire "tick" event from xeoViewer
                    loader.process();
                });

                loader.start();
            });
        };
        
        // Helper function to traverse over the mappings for individually loaded models
        var _traverseMappings = function(mappings) {
            return function(k) {
                for (var i = 0; i < mappings.length; ++i) {
                    var v = mappings[i][k];
                    if (v) return v;
                }
                return null;
            }
        };

        /**
         * Returns a list of object ids (oid) for the list of guids (GlobalId)
         *
         * @param guids List of globally unique identifiers from the IFC model
         */
        this.toId = function(guids) {
            return guids.map(_traverseMappings(self._idMapping.toId));
        };

        /**
         * Returns a list of guids (GlobalId) for the list of object ids (oid) 
         *
         * @param ids List of internal object ids from the BIMserver / glTF file
         */
        this.toGuid = function(ids) {
            return ids.map(_traverseMappings(self._idMapping.toGuid));
        };

        /**
         * Shows/hides objects specified by id or entity type, e.g IfcWall.
         *
         * When recursive is set to true, hides children (aggregates, spatial structures etc) or
         * subtypes (IfcWallStandardCase ⊆ IfcWall).
         *
         * @param params
         */
        this.setVisibility = function (params) {
            viewer.setVisibility(params);
        };

        /**
         * Selects/deselects objects specified by id.
         **
         * @param params
         */
        this.setSelection = function (params) {
            return viewer.setSelection(params);
        };

        /**
         * Gets a list of selected elements.
         */
        this.getSelection = function () {
            return viewer.getSelection();
        };

        /**
         * Sets color of objects specified by ids or entity type, e.g IfcWall.
         **
         * @param params
         */
        this.setColor = function (params) {
            viewer.setColor(params);
        };
		
		/**
         * Sets opacity of objects specified by ids or entity type, e.g IfcWall.
         **
         * @param params
         */
        this.setOpacity = function (params) {
            viewer.setOpacity(params);
        };

        /**
         * Fits the elements into view.
         *
         * Fits the entire model into view if ids is an empty array, null or undefined.
         * Animate allows to specify a transition period in milliseconds in which the view is altered.
         *
         * @param params
         */
        this.viewFit = function (params) {
            viewer.viewFit(params);
        };

        /**
         *
         */
        this.getCamera = function () {
            return viewer.getCamera();
        };

        /**
         *
         * @param params
         */
        this.setCamera = function (params) {
            viewer.setCamera(params);
        };

        /**
         *
         * @param params
         */
        this.reset = function (params) {
            viewer.reset(params);
        }
    }

    BimSurfer.prototype = Object.create(EventHandler.prototype);

    return BimSurfer;

});