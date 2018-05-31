// Backwards compatibility
var deps = ["./Notifier", "./BimServerModel", "./PreloadQuery", "./BimServerGeometryLoader", "./xeoglViewer", "./EventHandler"];

/*
 if (typeof(BimServerClient) == 'undefined') {
 window.BIMSERVER_VERSION = "1.4";
 deps.push("bimserverapi_BimServerApi");
 } else {
 window.BIMSERVER_VERSION = "1.5";
 }
 */

window.BIMSERVER_VERSION = "1.5";

define(deps, function (Notifier, Model, PreloadQuery, GeometryLoader, xeoglViewer, EventHandler, _BimServerApi) {

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

        var viewer = this.viewer = new xeoglViewer(cfg);

        /**
         * Fired whenever this BIMSurfer's camera changes.
         * @event camera-changed
         */
        viewer.on("camera-changed", function () {
            self.fire("camera-changed", arguments);
        });

        /**
         * Fired whenever this BIMSurfer's selection changes.
         * @event selection-changed
         */
        viewer.on("selection-changed", function () {
            self.fire("selection-changed", arguments);
        });

        // This are arrays as multiple models might be loaded or unloaded.
        this._idMapping = {
            'toGuid': [],
            'toId': []
        };

        /**
         * Loads a model into this BIMSurfer.
         * @param params
         */
        this.load = function (params) {
            if (params.test) {
                viewer.createTestModel("testModel", params);
                return null;
            } else if (params.bimserver) {
                return this._loadFromServer(params);
            } else if (params.api) {
                return this._loadFromAPI(params);
            }
        };

        this._loadFromServer = function (params) {
            var notifier = new Notifier();
            var bimServerApi = new BimServerApi(params.bimserver, notifier);
            params.api = bimServerApi; // TODO: Make copy of params
            return self._initApi(params)
                .then(self._loginToServer)
                .then(self._getRevisionFromServer)
                .then(self._loadFromAPI);
        };

        this._initApi = function (params) {
            return new Promise(function (resolve, reject) {
                params.api.init(function () {
                    resolve(params);
                });
            });
        };

        this._loginToServer = function (params) {
            return new Promise(function (resolve, reject) {
                if (params.token) {
                    params.api.setToken(params.token, function () {
                        resolve(params)
                    }, reject);
                } else {
                    params.api.login(params.username, params.password, function () {
                        resolve(params)
                    }, reject);
                }
            });
        };

        this._getRevisionFromServer = function (params) {
            return new Promise(function (resolve, reject) {
                if (params.roid) {
                    resolve(params);
                } else {
                    params.api.call("ServiceInterface", "getAllRelatedProjects", {poid: params.poid}, function (data) {
                        var resolved = false;

                        data.forEach(function (projectData) {
                            if (projectData.oid == params.poid) {
                                params.roid = projectData.lastRevisionId;
                                params.schema = projectData.schema;
                                if (!self.models) {
                                    self.models = [];
                                }
                                self.models.push(projectData);
                                resolved = true;
                                resolve(params);
                            }
                        });

                        if (!resolved) {
                            reject();
                        }
                    }, reject);
                }
            });
        };

        this._loadFromAPI = function (params) {

            return new Promise(function (resolve, reject) {

                params.api.getModel(params.poid, params.roid, params.schema, false,
                    function (model) {

                        // TODO: Preload not necessary combined with the bruteforce tree
                        var fired = false;

                        model.query(PreloadQuery,
                            function () {
                                if (!fired) {
                                    fired = true;
                                    var vmodel = new Model(params.api, model);

                                    self._loadModel(vmodel);

                                    resolve(vmodel);
                                }
                            });
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

                // Notify viewer that things are loading, so viewer can
                // reduce rendering speed and show a spinner.
                viewer.taskStarted();

                viewer.createModel(model.model.roid);

                var loader = new GeometryLoader(model.api, models, viewer);

                loader.addProgressListener(function (progress, nrObjectsRead, totalNrObjects) {
                    if (progress == "start") {
                        console.log("Started loading geometries");
                        self.fire("loading-started");
                    } else if (progress == "done") {
                        console.log("Finished loading geometries (" + totalNrObjects + " objects received)");
                        self.fire("loading-finished");
                        viewer.taskFinished();
                    }
                });

                loader.setLoadOids([model.model.roid], oids);

                viewer.on("tick", function () { // TODO: Fire "tick" event from xeoglViewer
                    loader.process();
                });

                loader.start();
            });
        };

        // Helper function to traverse over the mappings for individually loaded models
        var _traverseMappings = function (mappings) {
            return function (k) {
                for (var i = 0; i < mappings.length; ++i) {
                    var v = mappings[i][k];
                    if (v) return v;
                }
                return null;
            }
        };

        /**
         Returns a list of object ids (oid) for the list of guids (GlobalId)

         @param guids List of globally unique identifiers from the IFC model
         */
        this.toId = function (guids) {
            return guids.map(_traverseMappings(self._idMapping.toId));
        };

        /**
         Returns a list of guids (GlobalId) for the list of object ids (oid)

         @param ids List of internal object ids from the BIMserver.
         */
        this.toGuid = function (ids) {
            return ids.map(_traverseMappings(self._idMapping.toGuid));
        };

        /**
         Gets IDs of objects.
         @return {Array} Array of IDs.
         */
        this.getObjects = viewer.getObjects;

        /**
         Shows or hides IFC types, objects and/or models.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.visible=true] {Boolean} Whether to show or hide.
         */
        this.setVisibility = viewer.setVisibility;

        /**
         Returns array of IDs of objects that are currently visible.
         @return {Array} Array of IDs.
         */
        this.getVisibility = viewer.getVisibility;

        /**
         Ghosts or un-ghosts IFC types, objects and/or models.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.ghosted=false] {Boolean} Whether to ghost or un-ghost.
         */
        this.setGhosted = viewer.setGhosted;

        /**
         Returns array of IDs of objects that are currently ghosted.
         @return {Array} Array of IDs.
         */
        this.getGhosted = viewer.getGhosted;

        /**
         Selects or de-selects IFC types, objects and/or models.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.selected=false] {Boolean} Whether to select or deselect.
         */
        this.setSelection = viewer.setSelection;

        /**
         Returns array of IDs of objects that are currently selected
         @return {Array} Array of IDs.
         */
        this.getSelection = viewer.getSelection;

        /**
         Sets the color of IFC types, objects and/or models.

         Note that this will override the colors that are already assigned to those objects.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.color=(1,1,1)] {Float32Array} RGB colorize factors, multiplied by rendered pixel colors.
         */
        this.setColor = viewer.setColor;

        /**
         Sets opacity of objects, models and/or IFC types.

         Note that this will override the opacities of those objects.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.opacity=1] {Number} Opacity factor in range ````[0..1]````, multiplies by the rendered pixel alphas.
         */
        this.setOpacity = viewer.setOpacity;

        /**
         Fits the elements into view.

         Fits the entire model into view if ids is an empty array, null or undefined.
         Animate allows to specify a transition period in milliseconds in which the view is altered.

         @param params
         */
        this.viewFit = viewer.viewFit;

        /**
         Gets camera state.
         */
        this.getCamera = viewer.getCamera;

        /**
         Sets camera state.

         @param params
         */
        this.setCamera = viewer.setCamera;

        /**
         Redefines light sources.

         @param params Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
         See http://xeogl.org/docs/classes/Lights.html for possible params for each light type
         */
        this.setLights = viewer.setLights;

        /**
         Returns light sources.

         @returns Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
         */
        this.getLights = viewer.getLights;

        /**

         @param params
         */
        this.reset = viewer.reset;

        /**
         Returns a list of loaded IFC entity types in the model.

         @method getTypes
         @returns {Array} List of loaded IFC entity types, with visibility flag
         */
        this.getTypes = viewer.getTypes;

        /**
         Sets the default behaviour of mouse and touch drag input

         @method setDefaultDragAction
         @param {String} action ("pan" | "orbit")
         */
        this.setDefaultDragAction = viewer.setDefaultDragAction;

        /**
         Returns the world boundary of an object

         @method getWorldBoundary
         @param {String} objectId id of object
         @param {Object} result Existing boundary object
         @returns {Object} World boundary of object, containing {obb, aabb, center, sphere} properties. See xeogl.Boundary3D
         */
        this.getWorldBoundary = viewer.getWorldBoundary;

        this.getBookmark = function (mask) {
            var bookmark = viewer.getBookmark;
            // TODO: include loaded models
            return bookmark;
        };

        this.setBookmark = function(bookmark, mask) {
            // TODO: include loaded models
            viewer.setBookmark(bookmark);
        };

        /**
         Destroys the BIMSurfer
         */
        this.destroy = function () {
            viewer.destroy();
        }
    }

    BimSurfer.prototype = Object.create(EventHandler.prototype);

    return BimSurfer;

});
