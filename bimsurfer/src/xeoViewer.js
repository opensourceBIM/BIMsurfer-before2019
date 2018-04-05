define([
    "./DefaultMaterials",
    "./EventHandler",
    "./Utils",
    "../lib/xeogl/xeogl",
    "../lib/xeogl/glTFModel",
    "./bimCameraControl",
    "./bimObject"
], function (DefaultMaterials, EventHandler, Utils) {

    "use strict";

    function xeoViewer(cfg) {

        const FAR_CLIP = 5000; // Distance to WebGL's far clipping plane.

        EventHandler.call(this);

        var self = this;

        var domNode = document.getElementById(cfg.domNode);
        var canvas = document.createElement("canvas");

        domNode.appendChild(canvas);

        var scene = self.scene = new xeogl.Scene({
            canvas: canvas,
            transparent: true
        });

        var lights = [ // Redefine default light sources;
            {
                type: "ambient",
                params: {
                    color: [0.65, 0.65, 0.75],
                    intensity: 1
                }
            },
            {
                type: "dir",
                params: {
                    dir: [0.0, 0.0, -1.0],
                    color: [1.0, 1.0, 1.0],
                    intensity: 1.0,
                    space: "view"
                }
            }
        ];
        scene.lights.lights = buildLights(lights);

        var scale = new xeogl.Scale(scene, { // Attached to all objects to fit things inside the view volume
            xyz: [1, 1, 1]
        });

        var input = scene.input; // Provides user input

        var camera = scene.camera;

        camera.perspective.far = FAR_CLIP;
        camera.ortho.far = FAR_CLIP;
        camera.frustum.far = FAR_CLIP;

        var cameraFlight = new xeogl.CameraFlightAnimation(scene, { // Flies cameras to objects
            fitFOV: 25,
            duration: 1
        });

        var hiddenTypes = {  // RFC types hidden by default, in a map for fast access
            "IfcOpeningElement": true,
            "IfcSpace": true
        };

        var models = {}; // BIMModels mapped to their IDs
        var objects = {}; // BIMObjects mapped to IDs
        var objects_by_guid = {}; // BIMObjects mapped to GUIDs
        var rfcTypes = {}; // For each RFC type, a map of objects mapped to their IDs
        var visibleObjects = {}; // BIMObjects that are currently visible, mapped to IDs
        var visibleObjectList = null; // Lazy-generated array of visible object IDs, for return by #getVisibility()
        var selectedObjects = {}; // BIMObjects that are currently selected, mapped to IDs
        var selectedObjectList = null; // Lazy-generated array of selected object IDs, for return by #getSelection()
        var resetBookmark = null; // Bookmark of initial state to reset to - captured with #saveReset(), applied with #reset().
        var projectionType = "persp"; // The current projection type

        //-----------------------------------------------------------------------------------------------------------
        // Camera notifications
        //-----------------------------------------------------------------------------------------------------------

        (function () {

            // Fold xeogl's separate events for view and projection updates
            // into a single "camera-changed" event, deferred to fire on next scene tick.

            var cameraUpdated = false;

            camera.on("projectMatrix", function () {
                cameraUpdated = true;
            });

            camera.on("viewMatrix", function () {
                cameraUpdated = true;
            });

            scene.on("tick", function () {

                /**
                 * Fired on the iteration of each "tick" for this xeoViewer.
                 * @event tick
                 * @param {String} sceneID The ID of this Scene.
                 * @param {Number} startTime The time in seconds since 1970 that this xeoViewer was instantiated.
                 * @param {Number} time The time in seconds since 1970 of this "tick" event.
                 * @param {Number} prevTime The time of the previous "tick" event from this xeoViewer.
                 * @param {Number} deltaTime The time in seconds since the previous "tick" event from this xeoViewer.
                 */
                self.fire("tick");

                if (cameraUpdated) {

                    /**
                     * Fired whenever this xeoViewer's camera changes.
                     * @event camera-changed
                     * @params New camera state, same as that got with #getCamera.
                     */
                    self.fire("camera-changed", [self.getCamera()]);
                    cameraUpdated = false;
                }
            });
        })();

        //-----------------------------------------------------------------------------------------------------------
        // Camera control
        //-----------------------------------------------------------------------------------------------------------

        var cameraControl = new xeogl.BIMCameraControl(scene);

        cameraControl.on("pick", function (hit) {
            var entity = hit.entity;  // Get BIM object ID from entity metadata
            if (!entity.meta) {
                return;
            }
            var objectId = entity.meta.objectId || entity.id;
            if (objectId === undefined) {
                return;
            }
            var selected = !!selectedObjects[objectId]; // Object currently selected?
            var shiftDown = input.keyDown[input.KEY_SHIFT]; // Shift key down?
            self.setSelection({
                ids: [objectId],
                selected: !selected, // Picking an object toggles its selection status
                clear: !shiftDown // Clear selection first if shift not down
            });
        });

        cameraControl.on("nopick", function () {
            self.setSelection({
                clear: true
            });
        });

        /**
         * Sets the default behaviour of mouse and touch drag input
         *
         * @method setDefaultDragAction
         * @param {String} action ("pan" | "orbit")
         */
        this.setDefaultDragAction = function (action) {
            cameraControl.defaultDragAction = action;
        };

        /**
         * Sets the global scale for models loaded into the viewer.
         *
         * @method setScale
         * @param {Number} s Scale factor.
         */
        this.setScale = function (s) {
            scale.xyz = [s, s, s];
        };

        /**
         * Notifies the viewer that a task (such as loading a model) has started. Use #taskFinished
         * to signal that the task has finished.
         *
         * Whenever the number of tasks is greater than zero, the viewer will display a spinner,
         * and reduce rendering speed so as to allow scene updates to happen faster.
         */
        this.taskStarted = function () {
            scene.canvas.spinner.processes++;
            scene.ticksPerRender = 15; // Tweak this if necessary
        };

        /**
         * Signals that a task has finished (see #taskStarted).
         */
        this.taskFinished = function () {
            var spinner = scene.canvas.spinner;
            if (spinner.processes === 0) {
                return;
            }
            spinner.processes--;
            if (spinner.processes === 0) {
                scene.ticksPerRender = 1; // Back to max speed, one render per tick
            }
        };

        /**
         * Creates a model.
         *
         * @param {String} modelId An ID for the model. Should not match an existing model or object.
         * @returns {xeogl.BIMModel} The new model
         * @private
         */
        this.createModel = function (modelId) {
            if (models[modelId]) {
                console.log("Can't create model - model with id " + modelId + " already exists");
                return;
            }
            if (objects[modelId]) {
                console.log("Can't create model - object with id " + modelId + " already exists");
                return;
            }
            var model = new xeogl.Model(scene, {
                id: modelId
            });
            models[modelId] = model;
            return model;
        };

        /**
         * Creates a geometry within a model.
         *
         * @method createGeometry
         * @param modelId
         * @param geometryId
         * @param positions
         * @param normals
         * @param colors
         * @param indices
         * @returns {xeogl.Geometry} The new geometry
         * @private
         */
        this.createGeometry = function (modelId, geometryId, positions, normals, colors, indices) {
            var model = models[modelId];
            if (!model) {
                console.error("Can't create geometry - model not found: " + modelId);
                return;
            }
            var geometry = new xeogl.Geometry(scene, {
                id: modelId + "." + geometryId,
                primitive: "triangles",
                positions: positions,
                normals: normals,
                colors: colors,
                indices: indices
            });
            model.add(geometry);
            return geometry;
        };

        /**
         * Creates an object within a model, giving it the specified geometries.
         *
         * @param modelId
         * @param roid
         * @param oid
         * @param objectId
         * @param geometryIds
         * @param type
         * @param matrix
         * @returns {xeogl.BIMObject} The new object
         * @private
         */
        this.createObject = function (modelId, roid, oid, objectId, geometryIds, type, matrix) {
            var model = models[modelId];
            var i;
            var len;
            if (!model) {
                console.log("Can't create object - model not found: " + modelId);
                return;
            }
            objectId = modelId + "." + objectId;
            if (objects[objectId]) {
                console.log("Can't create object - object with id " + objectId + " already exists");
                return;
            }
            var object = new xeogl.BIMObject(scene, {
                id: objectId,
                ifcType: type,
                matrix: matrix
            });
            for (i = 0, len = geometryIds.length; i < len; i++) {
                object.addEntity(new xeogl.Entity(model, {
                    geometry: modelId + "." + geometryIds[i]
                }));
            }
            registerObject(object);
            model.add(object);
            return object;
        };

        function registerObject(object) {
            var objectId = object.id;
            var type = object.ifcType;
            var guid = object.guid;
            objects[objectId] = object;
            (rfcTypes[type] || (rfcTypes[type] = {}))[objectId] = object;
            if (guid) {
                (objects_by_guid[guid] || (objects_by_guid[guid] = {}))[objectId] = object;
            }
            var color = DefaultMaterials[type] || DefaultMaterials["DEFAULT"];
            if (!guid) {
                object.color = color; // Uses RGB components
            }
            object.opacity = color[3];
            if (hiddenTypes[type]) { // Hide objects of certain types by default
                object.visible = false;
            }
            object.transform.parent = scale; // Apply model scaling
        }

        /**
         * Creates a random model for testing.
         *
         * @method createTestModel
         * @param {*} params Parameters
         * @param {String} modelId An ID for the model. Should not match an existing model or object.
         * @param {Number} [params.numEntities=200] Number of entities to create.
         * @param {Number} [params.size=200] Size of model on every axis.
         * @param {Float32Array} [params.center] Center point of model.
         */
        this.createTestModel = function (modelId, params) {
            if (models[modelId]) {
                console.log("Can't create model - model with this ID already exists: " + modelId);
                return;
            }
            params = params || {};
            var model = new xeogl.Model(scene, {
                id: modelId
            });
            models[modelId] = model;
            var geometry = new xeogl.BoxGeometry(scene, {
                id: modelId + "." + "theGeometry"
            });
            model.add(geometry);

            var roid = "test";
            var oid;
            var type;
            var objectId;
            var translate;
            var scale;
            var matrix;
            var types = Object.keys(DefaultMaterials);

            var numEntities = params.numEntities || 200;
            var size = params.size || 200;
            var halfSize = size / 2;
            var centerX = params.center ? params.center[0] : 0;
            var centerY = params.center ? params.center[1] : 0;
            var centerZ = params.center ? params.center[2] : 0;

            for (var i = 0; i < numEntities; i++) {

                objectId = modelId + "#" + i;
                oid = objectId;
                translate = xeogl.math.translationMat4c(
                    (Math.random() * size - halfSize) + centerX,
                    (Math.random() * size - halfSize) + centerY,
                    (Math.random() * size - halfSize) + centerZ);
                scale = xeogl.math.scalingMat4c(Math.random() * 32 + 0.2, Math.random() * 32 + 0.2, Math.random() * 10 + 0.2);
                matrix = xeogl.math.mulMat4(translate, scale, xeogl.math.mat4());
                type = types[Math.round(Math.random() * types.length)];

                this.createObject(modelId, roid, oid, objectId, ["theGeometry"], type, matrix);
            }
        };

        /**
         * Loads a glTF model.
         *
         * Subsequent calls to #reset will then set the viewer to the state right after the model was loaded.
         *
         * @param modelId
         * @param src
         * @param ok
         * @param err
         */
        this.loadGLTFModel = function (modelId, src, ok, err) {
            if (models[modelId]) {
                console.log("Can't load model - model with this ID already exists: " + modelId);
                if (ok) {
                    ok();
                }
                return;
            }
            var model = new xeogl.GLTFModel(scene, {
                id: modelId,
                src: src,
                lambertMaterials: true
            });
            models[modelId] = model;
            model.once("loaded", function () {
                var entities = model.entities;
                var entity;
                var object;
                for (var entityId in entities) {
                    if (entities.hasOwnProperty(entityId)) {
                        entity = entities[entityId];
                        var dotIdx = entityId.indexOf(".");
                        var objectId = (dotIdx === -1) ? entityId : entityId.substring(0, dotIdx);
                        object = objects[objectId];
                        if (!object) {
                            object = new xeogl.BIMObject(model, { // TODO: Assign types to glTF objects
                                id: objectId,
                                ifcType: "DEFAULT",
                                model: model
                            });
                            model.add(object);
                            registerObject(object);
                        }
                        object.addEntity(entity);
                        entity.meta = {
                            objectId: objectId // Ties entity to its object
                        }
                    }
                }
                self.saveReset();
                if (ok) {
                    ok(model);
                }
            });
            model.on("error", function (msg) {
                model.destroy();
                delete models[modelId];
                if (err) {
                    err(msg);
                }
            });
        };

        /**
         * Destroys a model.
         *
         * @param modelId
         */
        this.destroyModel = function (modelId) {
            var model = models[modelId];
            var object;
            var typeObjects;
            if (!model) {
                console.warn("Can't destroy model - model not found: " + modelId);
                return;
            }
            var modelObjects = model.types["xeogl.BIMObject"];
            if (modelObjects) {
                for (var objectId in modelObjects) {
                    if (modelObjects.hasOwnProperty(objectId)) {
                        object = modelObjects[objectId];
                        typeObjects = rfcTypes[object.ifcType];
                        if (typeObjects) {
                            delete typeObjects[objectId];
                        }
                        if (object.guid) {
                            delete objects_by_guid[object.guid];
                        }
                        delete objects[objectId];
                        delete visibleObjects[objectId];
                        delete selectedObjects[objectId];
                    }
                }
            }
            model.destroy();
            delete models[modelId];
        };

        /**
         * Clears the viewer.
         *
         * Destroys all models.
         *
         * Subsequent calls to #reset will then set the viewer this clear state.
         */
        this.clear = function () {
            for (var modelId in models) {
                if (models.hasOwnProperty(modelId)) {
                    this.destroyModel(modelId);
                }
            }
            visibleObjectList = null;
            selectedObjectList = null;
            this.saveReset();
        };

        /**
         * Sets the visibility of objects specified by IDs or IFC types.
         * If IFC types are specified, this will affect existing objects as well as subsequently loaded objects of these types
         *
         * @param params
         * @param params.ids IDs of objects or IFC types to update.
         */
        this.setVisibility = (function () {

            var changed = false;

            function callback(object, params) {
                var visible = params.visible;
                if (object.visible !== visible) {
                    object.visible = visible;
                    if (visible) {
                        visibleObjects[object.id] = object;
                    } else {
                        delete visibleObjects[object.id];
                    }
                    changed = true;
                }
            }

            return function (params) {
                if (params.clear) {
                    var objectId;
                    var object;
                    for (objectId in visibleObjects) {
                        if (visibleObjects.hasOwnProperty(objectId)) {
                            object = visibleObjects[objectId];
                            delete visibleObjects[objectId];
                            object.visible = false;
                            changed = true;
                        }
                    }
                }
                if (params.visible !== undefined) {
                    if (params.ids) {
                        withObjectsAndModels(params.ids, callback, params);
                    }
                    if (params.types) {
                        withTypes(params.types, callback, params);
                        var i;
                        var len;
                        var visible = params.visible;
                        var type;
                        for (i = 0, len = params.types.length; i < len; i++) {
                            type = params.types[i];
                            visible ? hiddenTypes[type] = true : delete hiddenTypes[type];
                        }
                    }
                }
                if (changed) {
                    /**
                     * Fired whenever objects become invisible or invisible
                     * @event visibility-changed
                     * @params Array of IDs of all currently-visible objects.
                     */
                    visibleObjectList = Object.keys(visibleObjects); // OPTIMIZE: Lazy-create in getter, instead of eager-creating on every viz update
                    this.fire("visibility-changed", [visibleObjectList]);
                }
            };
        })();

        function withObjectsAndModels(ids, callback, params) {
            var id;
            var object;
            var model;
            var modelObjects;
            var objectId;
            var guidObjects;
            for (var i = 0, len = ids.length; i < len; i++) {
                id = ids[i];
                object = objects[id];
                if (object) {
                    callback(object, params);
                } else {
                    guidObjects = objects_by_guid[id];
                    if (guidObjects) {
                        for (objectId in guidObjects) {
                            if (guidObjects.hasOwnProperty(objectId)) {
                                object = guidObjects[objectId];
                                callback(object, params);
                            }
                        }
                    } else {
                        model = models[id];
                        if (model) {
                            modelObjects = model.types["xeogl.BIMOBject"];
                            if (modelObjects) {
                                for (objectId in modelObjects) {
                                    if (modelObjects.hasOwnProperty(objectId)) {
                                        object = modelObjects[objectId];
                                        callback(object, params);
                                    }
                                }
                            }
                        } else {
                            console.log("No object, type, model or guid found matching this ID - ignoring: " + id);
                        }
                    }
                }
            }
        }

        function withTypes(types, callback, params) {
            var type;
            var typeObjects;
            var object;
            var objectId;
            for (var i = 0, len = types.length; i < len; i++) {
                type = types[i];
                typeObjects = rfcTypes[type];
                if (typeObjects) {
                    for (objectId in typeObjects) {
                        if (typeObjects.hasOwnProperty(objectId)) {
                            object = typeObjects[objectId];
                            callback(object, params);
                        }
                    }
                }
            }
        }

        /**
         * Returns array of IDs of objects that are currently visible
         */
        this.getVisibility = function () {
            if (visibleObjectList) {
                return visibleObjectList;
            }
            visibleObjectList = Object.keys(visibleObjects);
            return visibleObjectList;
        };

        /**
         * Selects or deselects objects specified by IDs or IFC types.
         *
         * @param params
         * @param params.types IFC type of objects to update.
         * @param params.ids IDs of objects or IFC types to update.
         * @param params.selected Whether to select or not.
         */
        this.setSelection = (function () {

            var changed = false;

            function callback(object, params) {
                var objectId = object.id;
                var selected = params.selected;
                if (!!selectedObjects[objectId] === selected) {
                    return;
                }
                if (selected) {
                    object.selected = true;
                    selectedObjects[objectId] = object;
                } else  {
                    object.selected = false;
                    delete selectedObjects[objectId];
                }
                selectedObjectList = null; // Now needs lazy-rebuild
                changed = true;
            }

            return function (params) {
                if (params.clear) {
                    var objectId;
                    var object;
                    for (objectId in selectedObjects) {
                        if (selectedObjects.hasOwnProperty(objectId)) {
                            object = selectedObjects[objectId];
                            delete selectedObjects[objectId];
                            object.selected = false;
                            changed = true;
                        }
                    }
                }
                if (params.selected !== undefined) {
                    if (params.ids) {
                        withObjectsAndModels(params.ids, callback, params);
                    }
                    if (params.types) {
                        withTypes(params.types, callback, params);
                    }
                }
                if (changed) {
                    selectedObjectList = Object.keys(selectedObjects);

                    // setBoundaryState({
                    //     ids: selectedObjectList,
                    //     show: selectedObjectList.length > 0
                    // });

                    /**
                     * Fired whenever this xeoViewer's selection state changes.
                     * @event selection-changed
                     * @params Array of IDs of all currently-selected objects.
                     */
                    this.fire("selection-changed", [selectedObjectList]);
                }
            };
        })();

        /**
         * Returns array of IDs of objects that are currently selected
         */
        this.getSelection = function () {
            if (selectedObjectList) {
                return selectedObjectList;
            }
            selectedObjectList = Object.keys(selectedObjects);
            return selectedObjectList;
        };

        /**
         * Sets the color of objects, models and/or IFC types.
         *
         * @param params
         * @param params.ids IDs of objects and/or models to update.
         * @param params.types IFC type of objects to update.
         * @param params.color Color to set - RGB or RGBA.
         */
        this.setColor = (function () {
            function callback(object, params) {
                object.color = params.color;
            }
            return function (params) {
                if (!params.ids && !params.types) {
                    console.error("Param expected: ids or types");
                    return;
                }
                if (!params.color) {
                    console.error("Param expected: 'color'");
                    return;
                }
                if (params.ids) {
                    withObjectsAndModels(params.ids, callback, params);
                }
                if (params.types) {
                    withTypes(params.types, callback, params);
                }
            };
        })();

        /**
         * Sets the opacity of objects, models and/or IFC types.
         *
         * @param params
         * @param params.ids IDs of objects to update.
         * @param params.types IFC type of objects to update.
         * @param params.opacity Opacity to set.
         */
        this.setOpacity = (function () {
            function callback(object, params) {
                object.opacity = params.opacity;
            }
            return function (params) {
                if (!params.ids && !params.types) {
                    console.error("Param expected: ids or types");
                    return;
                }
                if (params.opacity === undefined || params.opacity === null) {
                    console.error("Param expected: 'color'");
                    return;
                }
                if (params.ids) {
                    withObjectsAndModels(params.ids, callback, params);
                }
                if (params.types) {
                    withTypes(params.types, callback, params);
                }
            };
        })();

        /**
         * Ghosts/un-ghosts objects, models and/or IFC types.
         *
         * @param params
         * @param params.ids IDs of objects to update.
         * @param params.types IFC type of objects to update.
         * @param params.ghosted Whether to ghost or un-ghost.
         */
        this.setGhosted = (function () {
            function callback(object, params) {
                object.ghosted = params.ghosted;
            }
            return function (params) {
                if (!params.ids && !params.types) {
                    console.error("Param expected: ids or types");
                    return;
                }
                if (params.ghosted === undefined || params.ghosted === null) {
                    console.error("Param expected: 'ghosted'");
                    return;
                }
                if (params.ids) {
                    withObjectsAndModels(params.ids, callback, params);
                }
                if (params.types) {
                    withTypes(params.types, callback, params);
                }
            };
        })();

        /**
         * Highlights or de-highlights objects, models and/or IFC types.
         *
         * @param params
         * @param params.ids IDs of objects to update.
         * @param params.types IFC type of objects to update.
         * @param params.highlighted Whether to highlighted or de-highlighted.
         */
        this.setHighlighted = (function () {
            function callback(object, params) {
                object.highlighted = params.highlighted;
            }
            return function (params) {
                if (!params.ids && !params.types) {
                    console.error("Param expected: ids or types");
                    return;
                }
                if (params.highlighted === undefined || params.highlighted === null) {
                    console.error("Param expected: 'highlighted'");
                    return;
                }
                if (params.ids) {
                    withObjectsAndModels(params.ids, callback, params);
                }
                if (params.types) {
                    withTypes(params.types, callback, params);
                }
            };
        })();

        /**
         * Sets camera state.
         *
         * @param params
         */
        this.setCamera = function (params) {
            params = params || {};
            var type = params.type;
            if (type) {
                if (type !== "persp" && type !== "ortho" && type !== "frustum") {
                    console.error("Unsupported camera projection type: " + type);
                } else {
                    if (type !== projectionType) {
                        camera.projection = (type === "persp") ? "perspective" : type; // Naming difference with xeogl
                        projectionType = type;
                    }
                }
            }
            if (params.animate) {
                cameraFlight.flyTo({
                    eye: params.eye,
                    look: params.target,
                    up: params.up,
                    fitFOV: params.fitFOV,
                    duration: params.duration
                });
            } else {
                if (params.eye) {
                    camera.eye = params.eye;
                }
                if (params.target) {
                    camera.look = params.target;
                    cameraControl.rotatePos = camera.look; // Rotate about target initially
                }
                if (params.up) {
                    camera.up = params.up;
                }
            }
            if (params.fovy) {
                if (projectionType !== "persp") {
                    console.error("Ignoring update to 'fovy' for current '" + projectionType + "' camera");
                } else {
                    camera.project.fovy = params.fovy;
                }
            }
            if (params.scale) {
                if (projectionType !== "ortho") {
                    console.error("Ignoring update to 'scale' for current '" + projectionType + "' camera");
                } else {
                    camera.project.scale = params.scale;
                }
            }
        };

        /**
         * Gets camera state.
         *
         * @returns {{type: string, eye: (*|Array.<T>), target: (*|Array.<T>), up: (*|Array.<T>)}}
         */
        this.getCamera = function () {
            var json = {
                type: projectionType,
                eye: camera.eye.slice(0),
                target: camera.look.slice(0),
                up: camera.up.slice(0)
            };
            if (projectionType === "persp") {
                json.fovy = camera.perspective.fovy;
            } else if (projectionType === "ortho") {
                json.size = [1, 1, 1]; // TODO: efficiently derive from cached value or otho volume
            }
            return json;
        };

        /**
         * Redefines light sources.
         *
         * @param params Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
         * See http://xeogl.org/docs/classes/Lights.html for possible params for each light type
         */
        this.setLights = function (params) {
            lights = params;
            for (var i = scene.lights.lights.length - 1; i >= 0; i--) {
                scene.lights.lights[i].destroy();
            }
            scene.lights.lights = buildLights(lights);
        };

        /**
         * Returns light sources.
         *
         * @returns Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
         */
        this.getLights = function () {
            return lights;
        };

        function buildLights(lights) {
            return lights.map(function (light) {
                if (light.type == "ambient") {
                    return new xeogl.AmbientLight(scene, light.params);
                } else if (light.type == "dir") {
                    return new xeogl.DirLight(scene, light.params);
                } else if (light.type == "point") {
                    return new xeogl.PointLight(scene, light.params);
                } else {
                    console.log("Unknown light type: " + type);
                }
            });
        }

        /**
         *
         * @param params
         * @param ok
         */
        this.viewFit = function (params, ok) {
            params = params || {};
            var aabb = getAABB(params.ids);
            if (params.animate) {
                cameraFlight.flyTo({aabb: aabb, fitFOV: params.fitFOV, duration: params.duration}, function () {
                    cameraControl.rotatePos = camera.look;  // Now orbiting the point we flew to
                    if (ok) {
                        ok();
                    }
                });
            } else {
                cameraFlight.jumpTo({aabb: aabb, fitFOV: 50.});
                cameraControl.rotatePos = camera.look;  // Now orbiting the point we jumped to
                if (ok) {
                    ok();
                }
            }
        };

        // Updates the boundary helper
        // function setBoundaryState(params) {
        //
        //     if (params.aabb) {
        //         throw new Error("Not supported");
        //     } else if (params.ids) {
        //         boundaryHelper.setSelected(params.ids);
        //         for (var id in highlightedObjects) {
        //             if (highlightedObjects.hasOwnProperty(id)) {
        //                 highlightedObjects[id].highlighted = false;
        //                 delete highlightedObjects[id];
        //             }
        //         }
        //         var ids = params.ids;
        //         var objectId;
        //         var object;
        //         for (var i = 0, len = ids.length; i < len; i++) {
        //             objectId = ids[i];
        //             object = objects[objectId];
        //             if (object) {
        //                 object.highlighted = true;
        //                 highlightedObjects[object.id] = object;
        //             }
        //         }
        //     }
        // }

        // Returns the collective World-space axis-aligned boundary of the given objects, models and/or IFC types.
        // Returns entite scene boundary by default.
        function getAABB(ids) {
            if (!ids || ids.length === 0) {
                return scene.aabb;
            }
            var math = xeogl.math;
            var i;
            var len;
            var id;
            var object;
            var aabb = xeogl.math.AABB3();
            var guidObjects;
            var guid;
            var guidObject;
            var typeObjects;
            var typeObjectId;
            var typeObject;
            var model;
            math.collapseAABB3(aabb);
            for (i = 0, len = ids.length; i < len; i++) { // Expand by ID'd object
                id = ids[i];
                object = objects[id];
                if (object) {
                    math.expandAABB3(aabb, object.aabb);
                } else { // Expand by GUID'd object
                    guidObjects = objects_by_guid[id];
                    if (guidObjects) {
                        for (guid in guidObjects) {
                            if (guidObjects.hasOwnProperty(guid)) {
                                guidObject = guidObjects[guid];
                                math.expandAABB3(aabb, guidObject.aabb);
                            }
                        }
                    } else { // Expand by IFC type
                        typeObjects = rfcTypes[id];
                        if (typeObjects) {
                            for (typeObjectId in guidObjects) {
                                if (typeObjects.hasOwnProperty(typeObjectId)) {
                                    typeObject = guidObjects[typeObjectId];
                                    math.expandAABB3(aabb, typeObject.aabb);
                                }
                            }
                        } else { // Expand by mmodel
                            model = models[id];
                            if (model) {
                                math.expandAABB3(aabb, model.aabb);
                            }
                        }
                    }
                }
            }
            return aabb;
        }

        /**
         * Remembers the current state of the viewer so that it can be reset to this state with
         * a subsequent call to #reset.
         */
        this.saveReset = function () {
            resetBookmark = this.getBookmark();
        };

        this.getObject = function (id) {
            return objects[id];
        };

        /**
         * Resets the state of this viewer to the state previously saved with #saveReset.
         * @param {*} params A mask which specifies which aspects of viewer state to reset.
         */
        this.reset = function (params) {
            if (!resetBookmark) {
                console.log("Ignoring call to xeoViewer.reset - xeoViewer.saveReset not called previously.");
                return;
            }
            this.setBookmark(resetBookmark, params);
        };

        /**
         * Returns a bookmark of xeoViewer state.
         * @param {*} options A mask which specifies which aspects of viewer state to bookmark.
         */
        this.getBookmark = function (options) {

            // Get everything by default

            var getVisible = !options || options.visible;
            var getColors = !options || options.colors;
            var getSelected = !options || options.selected;
            var getCamera = !options || options.camera;

            var bookmark = {};

            var objectId;
            var object;

            if (getVisible) {

                var visible = [];

                for (objectId in objects) {
                    if (objects.hasOwnProperty(objectId)) {

                        object = objects[objectId] || objects_by_guid[objectId];

                        if (getVisible && object.visible) {
                            visible.push(objectId);
                        }
                    }
                }
                bookmark.visible = visible;
            }

            if (getColors) {

                var opacity;
                var colors = {};
                var opacities = {};

                for (objectId in objects) {
                    if (objects.hasOwnProperty(objectId)) {
                        object = objects[objectId] || objects_by_guid[objectId];
                        colors[objectId] = object.color; // RGB
                        opacities[objectId] = object.opacity;
                    }
                }
                bookmark.colors = colors;
                bookmark.opacities = opacities;
            }

            if (getSelected) {
                bookmark.selected = this.getSelection();
            }

            if (getCamera) {
                var camera = this.getCamera();
                camera.animate = true; // Camera will fly to position when bookmark is restored
                bookmark.camera = camera;
            }

            return bookmark;
        };

        /**
         * Restores xeoViewer to a bookmark.
         *
         * @param bookmark
         * @param options
         */
        this.setBookmark = function (bookmark, options) {

            // Set everything by default, where provided in bookmark

            var setVisible = bookmark.visible && (!options || options.visible);
            var setColors = bookmark.colors && (!options || options.colors);
            var setSelected = bookmark.selected && (!options || options.selected);
            var setCamera = bookmark.camera && (!options || options.camera);

            if (setColors) {

                var objectId;
                var object;
                var colors = bookmark.colors;
                var opacities = bookmark.opacities;

                for (objectId in colors) {
                    if (colors.hasOwnProperty(objectId)) {
                        object = objects[objectId] || objects_by_guid[objectId];
                        if (object) {
                            object.color = colors[objectId];
                            object.opacity = opacities[objectId];
                        }
                    }
                }
            }

            if (setVisible) {
                this.setVisibility({
                    ids: bookmark.visible,
                    visible: true
                });
            }

            if (setSelected) {
                this.setSelection({
                    ids: bookmark.selected,
                    selected: true
                });
            }

            if (setCamera) {
                this.setCamera(bookmark.camera);
            }
        };

        /**
         * Sets general configurations.
         *
         * @param params
         * @param {Boolean} [params.mouseRayPick=true] When true, camera flies to orbit each clicked point, otherwise
         * it flies to the boundary of the object that was clicked on.
         * @param [params.viewFitFOV=25] {Number} How much of field-of-view, in degrees, that a target {{#crossLink "Entity"}}{{/crossLink}} or its AABB should
         * fill the canvas when calling {{#crossLink "CameraFlightAnimation/flyTo:method"}}{{/crossLink}} or {{#crossLink "CameraFlightAnimation/jumpTo:method"}}{{/crossLink}}.
         * @param [params.viewFitDuration=1] {Number} Flight duration, in seconds, when calling {{#crossLink "CameraFlightAnimation/flyTo:method"}}{{/crossLink}}.
         */
        this.setConfigs = function (params) {
            params = params || {};
            if (params.mouseRayPick != undefined) {
                cameraControl.mousePickEntity.rayPick = params.mouseRayPick;
            }
            if (params.viewFitFOV != undefined) {
                cameraFlight.fitFOV = params.viewFitFOV;
            }
            if (params.viewFitDuration != undefined) {
                cameraFlight.duration = params.viewFitDuration;
            }
        };

        /**
         Returns a snapshot of this xeoViewer as a Base64-encoded image.

         #### Usage:
         ````javascript
         imageElement.src = xeoViewer.getSnapshot({
             width: 500, // Defaults to size of canvas
             height: 500,
             format: "png" // Options are "jpeg" (default), "png" and "bmp"
         });
         ````

         @method getSnapshot
         @param {*} [params] Capture options.
         @param {Number} [params.width] Desired width of result in pixels - defaults to width of canvas.
         @param {Number} [params.height] Desired height of result in pixels - defaults to height of canvas.
         @param {String} [params.format="jpeg"] Desired format; "jpeg", "png" or "bmp".
         @returns {String} String-encoded image data.
         */
        this.getSnapshot = function (params) {
            return scene.canvas.getSnapshot(params);
        };

        /**
         Returns a list of loaded IFC entity types in the model.

         @method getTypes
         @returns {Array} List of loaded IFC entity types, with visibility flag
         */
        this.getTypes = function () {
            return Object.keys(rfcTypes).map(function (n) {
                return {name: n, visible: hiddenTypes.indexOf(n) === -1};
            });
        };

        /**
         * Returns the world boundary of an object
         *
         * @method getWorldBoundary
         * @param {String} objectId id of object
         * @param {Object} result Existing boundary object
         * @returns {Object} World boundary of object, containing {obb, aabb, center, sphere} properties. See xeogl.Boundary3D
         */
        this.getWorldBoundary = function (objectId, result) {
            var  object = objects[objectId] || objects_by_guid[objectId];

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
                var s = 1 / scale.xyz[0];
                var aabb = object.aabb;

                result.aabb[0] = aabb[0] * s;
                result.aabb[1] = aabb[1] * s;
                result.aabb[2] = aabb[2] * s;
                result.aabb[3] = aabb[3] * s;
                result.aabb[4] = aabb[4] * s;
                result.aabb[5] = aabb[5] * s;

                xeogl.math.mulVec3Scalar(object.center, s, result.center);
                //xeogl.math.mulVec4Scalar(scaled.sphere, s, result.sphere); // TODO

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
         * Destroys the viewer
         */
        this.destroy = function () {
            scene.destroy();
        }
    }

    xeoViewer.prototype = Object.create(EventHandler.prototype);

    return xeoViewer;
});
