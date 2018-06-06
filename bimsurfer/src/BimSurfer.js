// Backwards compatibility
var deps = ["./Notifier", "./BimServerModel", "./PreloadQuery", "./BimServerGeometryLoader", "./EventHandler", "./DefaultMaterials", "./Utils", "../lib/xeogl/xeogl"];

/*
 if (typeof(BimServerClient) == 'undefined') {
 window.BIMSERVER_VERSION = "1.4";
 deps.push("bimserverapi_BimServerApi");
 } else {
 window.BIMSERVER_VERSION = "1.5";
 }
 */

window.BIMSERVER_VERSION = "1.5";

define(deps, function (Notifier, Model, PreloadQuery, GeometryLoader, EventHandler, DefaultMaterials, Utils, _BimServerApi) {

    // Backwards compatibility
    var BimServerApi;
    if (_BimServerApi) {
        BimServerApi = _BimServerApi;
    } else {
        BimServerApi = window.BimServerClient;
    }

    /**
     A WebGL-based 3D viewer for BIMServer.

     BIMSurfer is a stateless wrapper around a xeogl.Scene, providing higher-level convenience methods for updating
     the xeogl.Scene in the context of BIMServer.

     Since BIMSurfer is stateless, you can generally create, update and destroy everything
     directly via the xeogl.Scene, as well as use the convenience methods.

     @param cfg {*} Configuration object.
     @param cfg.domNode {String} ID of container element within which this BIMSurfer will create its canvas.
     @param [cfg.transparent=false] {Boolean} Whether or not the canvas is transparent.
     @constructor
     */
    function BimSurfer(cfg) {

        EventHandler.call(this);

        var self = this;

        cfg = cfg || {};

        if (!cfg.domNode) {
            throw "Config expected: domNode";
        }

        var worldScale = 1.0;
        var hiddenTypes = {"IfcOpeningElement": true, "IfcSpace": true};
        var modelObjects = {}; // For each xeogl.Model the BIM xeogl.Objects within it mapped to their IDs
        var resetBookmark = null; // Bookmark of initial state to reset to - captured with #saveReset(), applied with #reset().
        var projectionType = "persp"; // The current projection type

        var domNode = document.getElementById(cfg.domNode);
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        domNode.appendChild(canvas);

        /**
         The xeogl.Scene that contains all 3D graphical objects and state.

         @property scene
         @final
         @type {xeogl.Scene}
         */
        this.scene = new xeogl.Scene({canvas: canvas, transparent: true});
        // this.scene.lights.lights = [
        //     new xeogl.AmbientLight(this.scene, {
        //         color: [0.65, 0.65, 0.75],
        //         intensity: 1
        //     }),
        //     new xeogl.DirLight(this.scene, {
        //         dir: [0.0, 0.0, -1.0],
        //         color: [1.0, 1.0, 1.0],
        //         intensity: 1.0,
        //         space: "view"
        //     })
        // ];

        /**
         The xeogl.Camera, which defines the current viewpoint and projection.

         @property camera
         @final
         @type {xeogl.Camera}
         */
        this.camera = this.scene.camera;
        this.camera.perspective.far = this.camera.ortho.far = this.camera.frustum.far = 8000;
        (function () { // Fold xeogl events for view and projection updates into a single deferred "camera-changed" event
            var cameraUpdated = false;
            self.scene.camera.on("projectMatrix", function () {
                cameraUpdated = true;
            });
            self.scene.camera.on("viewMatrix", function () {
                cameraUpdated = true;
            });
            self.scene.on("tick", function () {
                /**
                 Fired on the iteration of each "tick".
                 @event tick
                 @param {Number} startTime The time in seconds since 1970 that this xeoglViewer was instantiated.
                 @param {Number} time The time in seconds since 1970 of this "tick" event.
                 @param {Number} prevTime The time of the previous "tick" event from this xeoglViewer.
                 @param {Number} deltaTime The time in seconds since the previous "tick" event from this xeoglViewer.
                 */
                self.fire("tick");
                if (cameraUpdated) {
                    /**
                     * Fired whenever this xeoglViewer's camera changes.
                     * @event camera-changed
                     * @params New camera state, same as that got with #getCamera.
                     */
                    self.fire("camera-changed");
                    cameraUpdated = false;
                }
            });
        })();

        /**
         The xeogl.CameraFlight that animates the movement of the xeogl.Camera around the xeogl.Scene.

         Configure the speed of the xeogl.Camera animations via this component.

         @property cameraFlight
         @final
         @type {xeogl.CameraFlight}
         */
        this.cameraFlight = new xeogl.CameraFlightAnimation(this.scene, {fitFOV: 25, duration: 1});

        /**
         The xeogl.CameraControl through which the user interacts with the xeogl.Camera with touch and mouse input.

         Configure your camera interaction preferences via this component.

         @property cameraControl
         @final
         @type {xeogl.CameraControl}
         */
        this.cameraControl = new xeogl.CameraControl(this.scene, {pivoting: true, panToPointer: true});
        this.cameraControl.on("picked", function (hit) { // Click to select objects, SHIFT down to multiselect
            var mesh = hit.mesh;
            var object = mesh.parent; // Assume flat object hierarchy
            var objectId = object.id;
            var selected = !!self.scene.selectedObjects[objectId]; // Object currently selected?
            var shiftDown = self.scene.input.keyDown[self.scene.input.KEY_SHIFT]; // Shift key down?
            self.setSelection({
                ids: [objectId],
                selected: !selected, // Picking an object toggles its selection status
                clear: !shiftDown // Clear selection first if shift not down
            });
        });
        this.cameraControl.on("pickedNothing", function () { // Click space to deselect everything
            self.setSelection({
                clear: true
            });
        });

        this._idMapping = { // This are arrays as multiple models might be loaded or unloaded.
            'toGuid': [],
            'toId': []
        };

        //--------------------------------------------------------------------------------------------------------------
        // Everything that follows are effectively convenience methods that create, update or query 3D content
        // within the xeogl.Scene.
        //--------------------------------------------------------------------------------------------------------------

        /**
         Sets general configurations.

         @param params
         @param {Boolean} [params.mouseRayPick=true] When true, camera flies to orbit each clicked point, otherwise
         it flies to the boundary of the object that was clicked on.
         @param [params.viewFitFOV=25] {Number} How much of field-of-view, in degrees, that a target {{#crossLink "Entity"}}{{/crossLink}} or its AABB should
         fill the canvas when calling {{#crossLink "CameraFlightAnimation/flyTo:method"}}{{/crossLink}} or {{#crossLink "CameraFlightAnimation/jumpTo:method"}}{{/crossLink}}.
         @param [params.viewFitDuration=1] {Number} Flight duration, in seconds, when calling {{#crossLink "CameraFlightAnimation/flyTo:method"}}{{/crossLink}}.
         */
        this.setConfigs = function (params) {
            params = params || {};
            if (params.mouseRayPick != undefined) {
                //this.cameraControl.mousePickEntity.rayPick = params.mouseRayPick;
            }
            if (params.viewFitFOV != undefined) {
                this.cameraFlight.fitFOV = params.viewFitFOV;
            }
            if (params.viewFitDuration != undefined) {
                this.cameraFlight.duration = params.viewFitDuration;
            }
        };

        /**
         Sets the default behaviour of mouse and touch drag input

         @method setDefaultDragAction
         @param {String} action ("pan" | "orbit")
         */
        this.setDefaultDragAction = function (action) {
            // cameraControl.defaultDragAction = action;
        };

        /**
         Sets the global scale for models loaded into the viewer.

         @method setScale
         @param {Number} s Scale factor.
         */
        this.setScale = function (s) {
            worldScale = s;
        };

        /**
         Creates a test model.

         @method createTestModel
         @param {*} params Parameters
         @param {String} modelId An ID for the model. Should not match an IFC type of the ID of an existing model or object.
         @param {Number} [params.numObjects=200] Number of meshes to create.
         @param {Number} [params.size=200] Size of model on every axis.
         @param {Float32Array} [params.center] Center point of model.
         @returns {xeogl.Model} The new model.
         */
        this.createTestModel = function (modelId, params) {
            if (this.scene.models[modelId]) {
                this.log("Can't create model - model with id " + modelId + " already exists");
                return;
            }
            if (this.scene.components[modelId]) {
                this.log("Can't create model - scene component with this ID already exists: " + modelId);
                return;
            }
            this.scene.loading++; // Suspends rendering while > 0
            params = params || {};
            var model = this.createModel(modelId);
            new xeogl.BoxGeometry(model, {
                id: modelId + "." + "testModelGeometry"
            });
            var roid = "test";
            var oid;
            var type;
            var objectId;
            var translate;
            var scale;
            var matrix;
            var types = Object.keys(DefaultMaterials);
            var numObjects = params.numObjects || 200;
            var size = params.size || 200;
            var halfSize = size / 2;
            var centerX = params.center ? params.center[0] : 0;
            var centerY = params.center ? params.center[1] : 0;
            var centerZ = params.center ? params.center[2] : 0;
            for (var i = 0; i < numObjects; i++) {
                objectId = modelId + "#" + i;
                //this.log("loading object: " + i);
                oid = objectId;
                translate = xeogl.math.translationMat4c(
                    (Math.random() * size - halfSize) + centerX,
                    (Math.random() * size - halfSize) + centerY,
                    (Math.random() * size - halfSize) + centerZ);
                scale = xeogl.math.scalingMat4c(Math.random() * 32 + 0.2, Math.random() * 32 + 0.2, Math.random() * 10 + 0.2);
                matrix = xeogl.math.mulMat4(translate, scale, xeogl.math.mat4());
                type = types[Math.round(Math.random() * types.length)];
                var object = this.createObject(modelId, roid, oid, objectId, ["testModelGeometry"], type, matrix);
                object.colorize = [Math.random(), Math.random(), Math.random()];
            }
            this.scene.loading--;
            return model
        };

        /**
         Creates a model.

         @param {String} modelId An ID for the model. Should not match an existing model, object or IFC type.
         @returns {xeogl.Model} The new model.
         */
        this.createModel = function (modelId) {
            if (this.scene.models[modelId]) {
                this.log("Can't create model - model with id " + modelId + " already exists");
                return;
            }
            if (this.scene.components[modelId]) {
                this.log("Can't create model - scene component with this ID already exists: " + modelId);
                return;
            }
            // TODO: Test against IFC types
            var model = new xeogl.Model(this.scene, {
                id: modelId
            });
            modelObjects[modelId] = {};
            return model;
        };

        /**
         Creates a geometry within a model.

         @method createGeometry
         @param modelId
         @param geometryId
         @param positions
         @param normals
         @param colors
         @param indices
         @returns {xeogl.Geometry} The new geometry
         */
        this.createGeometry = function (modelId, geometryId, positions, normals, colors, indices) {
            var model = this.scene.models[modelId];
            if (!model) {
                this.error("Can't create geometry - model not found: " + modelId);
                return;
            }
            new xeogl.Geometry(model, { // Geometry will be destroyed with the Model
                id: modelId + "." + geometryId,
                primitive: "triangles",
                positions: positions,
                normals: normals,
                colors: colors,
                indices: indices
            });
        };

        /**
         Creates an object within a model.

         @param {String} modelId ID of model.
         @param roid
         @param oid
         @param {String} objectId
         @param {Array(String)} geometryIds IDs of geometries previously created with #createGeometry.
         @param ifcType
         @param matrix
         @returns {xeogl.Object} The new object.
         */
        this.createObject = function (modelId, roid, oid, objectId, geometryIds, ifcType, matrix) {
            // Each object is represented by a xeogl.Object, which has
            // a child xeogl.Mesh for each of the object's geometries
            var model = this.scene.models[modelId];
            if (!model) {
                this.log("Can't create object - model not found: " + modelId);
                return;
            }
            objectId = modelId + "." + objectId;
            if (this.scene.entities[objectId]) {
                this.log("Can't create object - object with id " + objectId + " already exists");
                return;
            }
            ifcType = ifcType || "DEFAULT";
            var guid = (objectId.indexOf("#") !== -1) ? Utils.CompressGuid(objectId.split("#")[1].substr(8, 36).replace(/-/g, "")) : null; // TODO: Computing GUID looks like a performance bottleneck
            var color = DefaultMaterials[ifcType] || DefaultMaterials["DEFAULT"];
            var object = new xeogl.Object(model, { // Object will be destroyed with the Model
                id: objectId,
                guid: guid,
                entityType: ifcType, // xeogl semantic models are generic, not limited to IFC
                matrix: matrix,
                colorize: color, // RGB
                opacity: color[3], // A
                visibility: !hiddenTypes[ifcType]
            });
            // TODO: Call model._addComponent to register child Object?
            model.addChild(object, false); // Object is child of Model, does not inherit visible states from Model
            modelObjects[model.id][objectId] = object;
            var lambertMaterial = this.scene.components["__lambertMaterial"] || new xeogl.LambertMaterial(this.scene, {id: "__lambertMaterial"}); // Same material for all meshes, which are individually colorized
            for (var i = 0, len = geometryIds.length; i < len; i++) { // Create child Meshes of Object
                var geometry = this.scene.components[modelId + "." + geometryIds[i]];
                if (!geometry || !geometry.isType("xeogl.Geometry")) {
                    this.log("Can't create object mesh - geometry with id " + objectId + " not found");
                    continue;
                }
                var mesh = new xeogl.Mesh(model, { // Each Mesh will be destroyed with the Model
                    geometry: geometry,
                    material: lambertMaterial
                });
                mesh.colorize = color; // HACK: Overrides state inheritance
                object.addChild(mesh, true); // Mesh is child of Object, inherits visibility states from Object
            }
            return object;
        };

        /**
         Gets IDs of objects.

         */
        this.getObjects = function () {
            return this.scene.entityIds;
        };

        /**
         Destroys a model.

         @param {String} modelId ID of model to destroy.
         */
        this.destroyModel = function (modelId) {
            var model = this.scene.models[modelId];
            if (!model) {
                this.warn("Can't destroy model - model not found: " + modelId);
                return;
            }
            delete modelObjects[modelId];
        };

        /**
         Clears the viewer.
         Subsequent calls to #reset will then set the viewer this clear state.
         */
        this.clear = function () {
            for (var modelId in this.scene.models) {
                if (this.scene.models.hasOwnProperty(modelId)) {
                    this.destroyModel(modelId); // Implicitly destroys objects etc
                }
            }
            this.saveReset();
        };

        /**
         Loads a model into this BIMSurfer.
         @param params
         @returns {xeogl.Model} The new model.
         */
        this.load = function (params) {
            if (params.test) {
                if (!params.modelId) {
                    this.scene.log("Param required: 'modelId'");
                    return;
                }
                return this.createTestModel(params.modelId, params);
            } else if (params.bimserver) {
                return this.loadModelFromBIMServer(params);
            } else if (params.api) {
                return this.loadModelFromAPI(params);
            }
        };

        /**
         Loads a model from BIMServer.
         @param params
         @returns {*}
         @returns {xeogl.Model} The new model.
         */
        this.loadModelFromBIMServer = (function () {

            function initApi(params) {
                return new Promise(function (resolve, reject) {
                    params.api.init(function () {
                        resolve(params);
                    });
                });
            }

            function loginToServer(params) {
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
            }

            function getRevisionFromServer(params) {
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
            }

            return function (params) {
                var notifier = new Notifier();
                var bimServerApi = new BimServerApi(params.bimserver, notifier);
                params.api = bimServerApi; // TODO: Make copy of params
                return initApi(params)
                    .then(loginToServer)
                    .then(getRevisionFromServer)
                    .then(self.loadModelFromAPI);
            };
        })();

        /**
         * Loads a model from BIMServer via the API client.
         * @param params
         * @returns {Promise}
         */
        this.loadModelFromAPI = function (params) {
            return new Promise(function (resolve, reject) {
                params.api.getModel(params.poid, params.roid, params.schema, false,
                    function (model) {
                        // TODO: Preload not necessary combined with the bruteforce tree
                        var fired = false;
                        model.query(PreloadQuery, function () {
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
            var scene = this.scene;
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
                scene.taskStarted();
                self.createModel(model.model.roid);
                var loader = new GeometryLoader(model.api, models, viewer);
                loader.addProgressListener(function (progress, nrObjectsRead, totalNrObjects) {
                    if (progress == "start") {
                        self.log("Started loading geometries");
                        self.fire("loading-started");
                    } else if (progress == "done") {
                        self.log("Finished loading geometries (" + totalNrObjects + " objects received)");
                        self.fire("loading-finished");
                        scene.taskFinished();
                    }
                });
                loader.setLoadOids([model.model.roid], oids);
                scene.on("tick", function () {
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
         Gets IDs of models.
         @return {Array} Array of IDs.
         */
        this.getModels = function () {
            return Object.keys(this.scene.models);
        };

        /**
         Gets IDs of objects.
         @return {Array} Array of IDs.
         */
        this.getObjects = function () {
            return this.scene.entityIds;
        };

        /**

         @method setPosition
         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects or models to update.
         @param [params.visible=true] {Boolean} Whether to show or hide.
         @returns {Boolean} True if any objects updated.
         */
        this.setPosition = function (params) {
            this.scene.setPosition(params.ids, params.position);
        };

        /**
         Shows or hides objects, specified by their IDs, GUIDs, IFC types, or models.

         Fires a "visibility-changed" event if any object visibilities change.

         @method setVisibility
         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects or models to update.
         @param [params.visible=true] {Boolean} Whether to show or hide.
         @returns {Boolean} True if any objects updated.
         */
        this.setVisibility = function (params) {
            var changed = false;
            if (params.clear) {
                changed = this.scene.setVisible(this.scene.visibleEntityIds, false);
            }
            if (params.visible !== undefined) {
                if (params.ids) {
                    changed = this.scene.setVisible(params.ids, params.visible);
                }
                if (params.types) {
                    changed = this.scene.setVisible(params.types, params.visible);
                }
            }
            if (changed) {
                /**
                 Fired whenever objects become invisible or invisible
                 Get the IDs of currently visible objects from #getVisibility().
                 @event visibility-changed
                 */
                this.fire("visibility-changed");
            }
        };

        /**
         Gets the IDs of objects that are currently visible.

         @method getVisibility
         @returns {Array(String)} Array of IDs of objects that are currently visible.
         */
        this.getVisibility = function () {
            return this.scene.visibleEntityIds;
        };

        /**
         Ghosts or un-ghosts objects, specified by their IDs, GUIDs, IFC types, or models.

         Ghosting makes objects appear as translucent wireframe.

         Fires a "ghosted-changed" event if any object ghosted states change.

         @method setGhosted
         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects or models to update.
         @param [params.visible=true] {Boolean} Whether to show or hide.
         @returns {Boolean} True if any objects updated.
         */
        this.setGhosted = function (params) {
            var changed = false;
            if (params.clear) {
                changed = this.scene.setGhosted(this.scene.ghostedEntityIds, false);
            }
            if (params.ghosted !== undefined) {
                if (params.ids) {
                    changed = this.scene.setGhosted(params.ids, params.ghosted);
                }
                if (params.types) {
                    changed = this.scene.setGhosted(params.types, params.ghosted);
                }
            }
            if (changed) {
                /**
                 Fired whenever objects become ghosted or unghosted
                 Get the IDs of currently ghosted objects from #getGhosted().
                 @event ghosted-changed
                 */
                this.fire("ghosted-changed");
            }
        };

        /**
         Gets the IDs of objects that are currently visible.

         @method getVisibility
         @returns {Array(String)} Array of IDs of objects that are currently visible.
         */
        this.getGhosted = function () {
            return this.scene.ghostedEntityIds;
        };

        /**
         Selects or de-selects objects, specified by their IDs, GUIDs, IFC types, or models.

         Selection makes objects appear glowing and visible through other objects that would normally occlude them.

         Fires a "selection-changed" event if any object selection states change.

         @method setGhosted
         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects or models to update.
         @param [params.visible=true] {Boolean} Whether to show or hide.
         @returns {Boolean} True if any objects updated.
         */
        this.setSelection = function (params) {
            var changed = false;
            if (params.clear) {
                changed = this.scene.setSelected(this.scene.selectedEntityIds, false);
            }
            if (params.selected !== undefined) {
                if (params.ids) {
                    changed = this.scene.setSelected(params.ids, params.selected);
                }
                if (params.types) {
                    changed = this.scene.setSelected(params.types, params.selected);
                }
            }
            if (changed) {
                /**
                 Fired whenever this xeoglViewer's selection state changes.
                 Get the IDs of currently selected objects from #getGhosted().
                 @event selection-changed
                 */
                this.fire("selection-changed");
            }
        };

        /**
         Gets the IDs of objects that are currently selected.

         @method getVisibility
         @returns {Array(String)} Array of IDs of objects that are currently selected.
         */
        this.getSelection = function () {
            return this.scene.selectedEntityIds;
        };

        /**
         Colorizes objects, specified by their IDs, GUIDs, IFC types, or models.

         Note that this will override default IFC colors already assigned to those objects.

         @method setColor
         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects or models to update.
         @param [params.visible=true] {Boolean} Whether to show or hide.
         @returns {Boolean} True if any objects updated.
         */
        this.setColor = function (params) {
            if (params.clear) {
                return this.scene.setColorize(this.scene.entityIds);
            }
            if (params.ids) {
                return scene.setColorize(params.ids, params.color);
            }
            if (params.types) {
                return scene.setColorize(params.types, params.color);
            }
        };

        /**
         Sets the opacity of objects, models and/or IFC types.

         Note that this will override the opacities of those objects.

         @param params {Object}
         @param [params.ids] {Array of String} IDs of objects to update.
         @param [params.types] {Array of String} IFC type of objects to update.
         @param [params.opacity=1] Number Opacity factor in range ````[0..1]````, multiplies by the rendered pixel alphas.
         */
        this.setOpacity = function (params) {
            if (params.clear) {
                return this.scene.setOpacity(this.scene.entityIds);
            }
            if (params.ids) {
                return this.scene.setOpacity(params.ids, params.opacity);
            }
            if (params.types) {
                return this.scene.setOpacity(params.types, params.opacity);
            }
        };

        /**

         @param params
         @param ok
         */
        /**

         @param {*} [params] viewFit options.
         @param {Boolean} [params.animate=false] Flies camera to target when true, otherwise jumps.
         @param {Number} [params.fitFOV] Field-of-view occupied by target at camera destination.
         @param {Number} [params.duration] Duration in seconds until arrival at camera destination.
         @param {Function} [ok]
         */
        this.viewFit = function (params, ok) {
            params = params || {};
            var aabb = this.scene.getAABB(params.ids);
            if (params.animate) {
                var self = this;
                this.cameraFlight.flyTo({aabb: aabb, fitFOV: params.fitFOV, duration: params.duration}, function () {
                    self.cameraControl.rotatePos = self.scene.camera.look;  // Now orbiting the point we flew to
                    if (ok) {
                        ok();
                    }
                });
            } else {
                this.cameraFlight.jumpTo({aabb: aabb, fitFOV: 50.});
                this.cameraControl.rotatePos = this.scene.camera.look;  // Now orbiting the point we jumped to
                if (ok) {
                    ok();
                }
            }
        };

        /**
         Redefines light sources.

         @param params Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
         See http://xeogl.org/docs/classes/Lights.html for possible params for each light type
         */
        this.setLights = function (params) {
            if (!params || !!params.length) {
                this.error("setLights: No lights provided");
            }
            var oldLights = this.scene.lights.lights.slice(0);
            for (var i = 0, len = oldLights.length; i < len; i++) {
                oldLights[i].destroy();
            }
            var newLights = [];
            for (var i = 0, len = params.length; i < len; i++) {
                var light = params[i];
                switch (light.type) {
                    case "ambient":
                        newLights.push(new xeogl.AmbientLight(this.scene, light.params));
                        break;
                    case "dir":
                        newLights.push(new xeogl.DirLight(this.scene, light.params));
                        break;
                    case "point":
                        newLights.push(new xeogl.PointLight(this.scene, light.params));
                        break;
                    default:
                        this.error("setLights: Unknown light type - ignoring: " + light.type);
                }
            }
            if (newLights.length > 0) {
                this.scene.lights.lights = newLights;
            }
        };

        /**
         Returns light sources.

         @returns Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
         */
        this.getLights = function () {
            // TODO:
            //return lights;
        };

        /**
         Saves a bookmark.

         @param {*} options Indicates which state to bookmark. Bookmarks everything by default.
         @param {Boolean} [options.colors=true] Saves object colors.
         @param {Boolean} [options.ghosted=true] Saves whether objects are visible or not.
         @param {Boolean} [options.ghosted=true] Saves whether objects are ghosted or not.
         @param {Boolean} [options.selected=true] Saves whether objects are selected or not.
         @param {Boolean} [options.camera=true] Saves camera position and projection.
         */
        this.getBookmark = (function () {
            function toArray(typedArray) {
                return Array.prototype.slice.call(typedArray);
            }

            return function (options) {
                var scene = this.scene;
                var bookmark = {};
                if (!options || options.colors) {
                    var colors = {};
                    var opacities = {};
                    for (var objectId in scene.entities) {
                        if (scene.entities.hasOwnProperty(objectId)) {
                            var object = scene.entities[objectId];
                            colors[objectId] = object.color;
                            opacities[objectId] = object.opacity;
                        }
                    }
                    bookmark.colors = colors;
                    bookmark.opacities = opacities;
                }
                if (!options || options.visible) {
                    bookmark.visible = scene.visibleEntityIds.slice(0);
                }
                if (!options || options.ghosted) {
                    bookmark.ghosted = scene.ghostedEntityIds.slice(0);
                }
                if (!options || options.selected) {
                    bookmark.selected = scene.selectedEntityIds.slice(0);
                }
                if (!options || options.camera) {
                    bookmark.camera = {
                        eye: toArray(scene.camera.eye),
                        look: toArray(scene.camera.look),
                        up: toArray(scene.camera.up),
                        projection: scene.camera.projection
                    };
                }
                return bookmark;
            };
        })();

        /**
         Restores a bookmark that was previously captured by #getBookmark().

         @param bookmark
         */
        this.setBookmark = function (bookmark) {
            if (bookmark.colors) {
                var colors = bookmark.colors;
                var opacities = bookmark.opacities;
                for (var objectId in colors) {
                    if (colors.hasOwnProperty(objectId)) {
                        var object = scene.entities[objectId];
                        object.color = colors[objectId];
                        object.opacity = opacities[objectId];
                    }
                }
            }
            var scene = this.scene;
            if (bookmark.visible) {
                scene.setVisible(scene.visibleEntityIds, false);
                scene.setVisible(bookmark.visible, true);
            }
            if (bookmark.ghosted) {
                scene.setGhosted(scene.ghostedEntityIds, false);
                scene.setGhosted(bookmark.ghosted, true);
            }
            if (bookmark.selected) {
                scene.setSelected(scene.selectedEntityIds, false);
                scene.setSelected(bookmark.selected, true);
            }
            if (bookmark.camera) {
                scene.camera.eye = bookmark.camera.eye;
                scene.camera.look = bookmark.camera.look;
                scene.camera.up = bookmark.camera.up;
            }
        };

        /**
         Captures a snapshot image.

         @method getSnapshot
         @param {*} [params] Capture options.
         @param {Number} [params.width] Desired width of result in pixels - defaults to width of canvas.
         @param {Number} [params.height] Desired height of result in pixels - defaults to height of canvas.
         @param {String} [params.format="jpeg"] Desired format; "jpeg", "png" or "bmp".
         @returns {String} String-encoded image data.
         */
        this.getSnapshot = function (params) {
            return this.scene.canvas.getSnapshot(params);
        };

        /**
         Returns a list of loaded IFC types, along with information on whether each type is hidden or not.

         @method getTypes
         @returns {Array} List of loaded IFC entity types, with visibility flag
         */
        this.getTypes = function () {
            return Object.keys(scene.entityTypes).map(function (type) {
                return {name: type, visible: !hiddenTypes[type]};
            });
        };

        /**
         Returns the world boundary of an object

         @method getWorldBoundary
         @param {String} objectId id of object
         @param {Object} result Existing boundary object
         @returns {Object} World boundary of object, containing {obb, aabb, center, sphere} properties.
         */
        this.getWorldBoundary = function (objectId, result) {
            var object = this.scene.entities[objectId] || this.scene.guidObjects[objectId];
            if (object === undefined) {
                return null;
            } else {
                if (result === undefined) {
                    result = {
                        obb: new Float32Array(32),
                        aabb: new Float32Array(6),
                        center: xeogl.math.vec3(),
                        sphere: xeogl.math.vec4()
                    };
                }
                // the boundary needs to be scaled back to real world units
                var s = 1 / worldScale;
                var aabb = object.aabb;
                result.aabb[0] = aabb[0] * s;
                result.aabb[1] = aabb[1] * s;
                result.aabb[2] = aabb[2] * s;
                result.aabb[3] = aabb[3] * s;
                result.aabb[4] = aabb[4] * s;
                result.aabb[5] = aabb[5] * s;
                xeogl.math.mulVec3Scalar(object.center, s, result.center);
                var obb = object.obb;
                var buffer = result.obb.buffer;
                for (var i = 0; i < 32; i += 4) {
                    var v = new Float32Array(buffer, 4 * i);
                    xeogl.math.mulVec3Scalar(obb.slice(i), s, v);
                    v[3] = 1.;
                }
                return result;
            }
        };

        /**
         Destroys this BIMSurfer.
         */
        this.destroy = function () {
            this.scene.destroy();
        };

        /**
         Logs a message to the console for this BIMSurfer.
         @param msg
         */
        this.log = function (msg) {
            console.log("[BIMSurfer]: " + msg);
        };

        /**
         Logs a warning message to the console for this BIMSurfer.
         @param msg
         */
        this.warn = function (msg) {
            console.warn("[BIMSurfer]: " + msg);
        };

        /**
         Logs an error message to the console for this BIMSurfer.
         @param msg
         */
        this.error = function (msg) {
            console.error("[BIMSurfer]: " + msg);
        };
    }

    BimSurfer.prototype = Object.create(EventHandler.prototype);

    return BimSurfer;

});
