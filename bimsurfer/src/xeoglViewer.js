define([
    "./DefaultMaterials",
    "./EventHandler",
    "./Utils",
    "../lib/xeogl/xeogl"
], function (DefaultMaterials, EventHandler, Utils) {

    "use strict";

    function xeoglViewer(cfg) {

        var self = this;

        const FAR_CLIP = 8000; // Distance to WebGL's far clipping plane.

        EventHandler.call(this);

        var domNode = document.getElementById(cfg.domNode);
        var canvas = document.createElement("canvas");
        domNode.appendChild(canvas);

        var scene = self.scene = new xeogl.Scene({canvas: canvas, transparent: true});
        var lambertMaterial = new xeogl.LambertMaterial(scene, {}); // Same material for all meshes, which are individually colorized
        var lights = [
            {type: "ambient", params: {color: [0.65, 0.65, 0.75], intensity: 1}},
            {type: "dir", params: {dir: [0.0, 0.0, -1.0], color: [1.0, 1.0, 1.0], intensity: 1.0, space: "view"}}
        ];
        scene.lights.lights = buildLights(lights);

        var worldScale = 1.0;

        var input = scene.input; // Provides user input

        var camera = scene.camera;
        camera.perspective.far = FAR_CLIP;
        camera.ortho.far = FAR_CLIP;
        camera.frustum.far = FAR_CLIP;

        var cameraFlight = new xeogl.CameraFlightAnimation(scene, {fitFOV: 25, duration: 1});

        var hiddenTypes = {"IfcOpeningElement": true, "IfcSpace": true};
        var modelObjects = {}; // For each xeogl.Model the BIM xeogl.Objects within it mapped to their IDs
        var resetBookmark = null; // Bookmark of initial state to reset to - captured with #saveReset(), applied with #reset().
        var projectionType = "persp"; // The current projection type

        //-----------------------------------------------------------------------------------------------------------
        // Camera notifications
        //-----------------------------------------------------------------------------------------------------------

        (function () { // Fold xeogl events for view and projection updates into a single deferred "camera-changed" event
            var cameraUpdated = false;
            camera.on("projectMatrix", function () {
                cameraUpdated = true;
            });
            camera.on("viewMatrix", function () {
                cameraUpdated = true;
            });
            scene.on("tick", function () {
                /**
                 * Fired on the iteration of each "tick" for this xeoglViewer.
                 * @event tick
                 * @param {String} sceneID The ID of this Scene.
                 * @param {Number} startTime The time in seconds since 1970 that this xeoglViewer was instantiated.
                 * @param {Number} time The time in seconds since 1970 of this "tick" event.
                 * @param {Number} prevTime The time of the previous "tick" event from this xeoglViewer.
                 * @param {Number} deltaTime The time in seconds since the previous "tick" event from this xeoglViewer.
                 */
                self.fire("tick");
                if (cameraUpdated) {
                    /**
                     * Fired whenever this xeoglViewer's camera changes.
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

        var cameraControl = new xeogl.CameraControl(scene, {pivoting: true, panToPointer: true});

        cameraControl.on("picked", function (hit) { // Click to select objects, SHIFT down to multiselect
            var mesh = hit.mesh;
            var object = mesh.parent; // Assume flat object hierarchy
            var objectId = object.id;
            var selected = !!selectedObjects[objectId]; // Object currently selected?
            var shiftDown = input.keyDown[input.KEY_SHIFT]; // Shift key down?
            self.setSelection({
                ids: [objectId],
                selected: !selected, // Picking an object toggles its selection status
                clear: !shiftDown // Clear selection first if shift not down
            });
        });

        cameraControl.on("pickedNothing", function () { // Click space to deselect everything
            self.setSelection({
                clear: true
            });
        });

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
         Creates a model.

         @param {String} modelId An ID for the model. Should not match an existing model or object.
         @returns {xeogl.Model} The new model.
         @private
         */
        this.createModel = function (modelId) {
            if (scene.models[modelId]) {
                console.log("Can't create model - model with id " + modelId + " already exists");
                return;
            }
            if (scene.components[modelId]) {
                console.log("Can't create model - scene component with this ID already exists: " + modelId);
                return;
            }
            // TODO: Test against IFC types
            var model = new xeogl.Model(scene, {
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
         @private
         */
        this.createGeometry = function (modelId, geometryId, positions, normals, colors, indices) {
            var model = scene.models[modelId];
            if (!model) {
                console.error("Can't create geometry - model not found: " + modelId);
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

         @param modelId
         @param roid
         @param oid
         @param objectId
         @param geometryIds
         @param ifcType
         @param matrix
         @returns {xeogl.Object} The new object
         @private
         */
        this.createObject = function (modelId, roid, oid, objectId, geometryIds, ifcType, matrix) {
            // Each object is represented by a xeogl.Object, which has
            // a child xeogl.Mesh for each of the object's geometries
            var model = scene.models[modelId];
            if (!model) {
                console.log("Can't create object - model not found: " + modelId);
                return;
            }
            objectId = modelId + "." + objectId;
            if (scene.entities[objectId]) {
                console.log("Can't create object - object with id " + objectId + " already exists");
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
            for (var i = 0, len = geometryIds.length; i < len; i++) { // Create child Meshes of Object
                var mesh = new xeogl.Mesh(model, { // Each Mesh will be destroyed with the Model
                    geometry: modelId + "." + geometryIds[i]
                });
                mesh.colorize = color; // HACK: Overrides state inheritance
                object.addChild(mesh, true); // Mesh is child of Object, inherits visibility states from Object
            }
            return object;
        };

        /**
         Creates a test model.

         @method createTestModel
         @param {String} modelId An ID for the model. Should not match an IFC type of the ID of an existing model or object.
         @param {*} params Parameters
         @param {Number} [params.numObjects=200] Number of meshes to create.
         @param {Number} [params.size=200] Size of model on every axis.
         @param {Float32Array} [params.center] Center point of model.
         */
        this.createTestModel = function (modelId, params) {
            if (scene.models[modelId]) {
                console.log("Can't create model - model with id " + modelId + " already exists");
                return;
            }
            if (scene.components[modelId]) {
                console.log("Can't create model - scene component with this ID already exists: " + modelId);
                return;
            }
            scene.loading++; // Suspends rendering while > 0
            params = params || {};
            var model = this.createModel(modelId);
            var geometryId;
            var geometry;
            if (params.sameGeometry) {
                geometryId = "testModelGeometry";
                geometry = new xeogl.BoxGeometry(model, {
                    id: modelId + "." + geometryId
                });
            }
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
                // console.log("loading object: " + i);
                oid = objectId;
                translate = xeogl.math.translationMat4c(
                    (Math.random() * size - halfSize) + centerX,
                    (Math.random() * size - halfSize) + centerY,
                    (Math.random() * size - halfSize) + centerZ);
                scale = xeogl.math.scalingMat4c(Math.random() * 32 + 0.2, Math.random() * 32 + 0.2, Math.random() * 10 + 0.2);
                matrix = xeogl.math.mulMat4(translate, scale, xeogl.math.mat4());
                type = types[Math.round(Math.random() * types.length)];
                if (!params.sameGeometry) {
                    geometryId = "testModelGeometry" + i;
                    geometry = new xeogl.BoxGeometry(model, {
                        id: modelId + "." + geometryId
                    });
                }
                var object = this.createObject(modelId, roid, oid, objectId, [geometryId], type, matrix);
                console.log("Created object " + i);
                object.colorize = [Math.random(), Math.random(), Math.random()];
            }
            scene.loading--;
        };

        /**
         Destroys a model.

         @param modelId
         */
        this.destroyModel = function (modelId) {
            var model = scene.models[modelId];
            if (!model) {
                console.warn("Can't destroy model - model not found: " + modelId);
                return;
            }
            delete modelObjects[modelId];
        };

        /**
         Clears the viewer.
         Subsequent calls to #reset will then set the viewer this clear state.
         */
        this.clear = function () {
            for (var modelId in scene.models) {
                if (scene.models.hasOwnProperty(modelId)) {
                    this.destroyModel(modelId); // Implicitly destroys objects etc
                }
            }
            this.saveReset();
        };

        /**
         Gets IDs of objects.
         @return {Array} Array of IDs.
         */
        this.getObjects = function () {
            return scene.entityIds;
        };

        /**
         Shows or hides IFC types, objects and/or models.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.visible=true] {Boolean} Whether to show or hide.
         */
        this.setVisibility = function (params) { // TODO: Don't update hidden types
            var changed = false;
            if (params.clear) {
                changed = scene.setVisible(scene.visibleEntityIds, false);
            }
            if (params.visible !== undefined) {
                if (params.ids) {
                    changed = scene.setVisible(params.ids, params.visible);
                }
                if (params.types) {
                    changed = scene.setVisible(params.types, params.visible);
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
         Returns array of IDs of objects that are currently visible.
         @return {Array} Array of IDs.
         */
        this.getVisibility = function () {
            return scene.visibleEntityIds;
        };

        /**
         Ghosts or un-ghosts IFC types, objects and/or models.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.ghosted=false] {Boolean} Whether to ghost or un-ghost.
         */
        this.setGhosted = function (params) {
            var changed = false;
            if (params.clear) {
                changed = scene.setGhosted(scene.ghostedEntityIds, false);
            }
            if (params.ghosted !== undefined) {
                if (params.ids) {
                    changed = scene.setGhosted(params.ids, params.ghosted);
                }
                if (params.types) {
                    changed = scene.setGhosted(params.types, params.ghosted);
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
         Returns array of IDs of objects that are currently ghosted.
         @return {Array} Array of IDs.
         */
        this.getGhosted = function () {
            return scene.ghostedEntityIds;
        };

        /**
         Selects or de-selects IFC types, objects and/or models.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.selected=false] {Boolean} Whether to select or deselect.
         */
        this.setSelection = function (params) {
            var changed = false;
            if (params.clear) {
                changed = scene.setSelected(scene.selectedEntityIds, false);
            }
            if (params.selected !== undefined) {
                if (params.ids) {
                    changed = scene.setSelected(params.ids, params.selected);
                }
                if (params.types) {
                    changed = scene.setSelected(params.types, params.selected);
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
         Returns array of IDs of objects that are currently selected
         @return {Array} Array of IDs.
         */
        this.getSelection = function () {
            return scene.selectedEntityIds;
        };

        /**
         Sets the color of IFC types, objects and/or models.

         Note that this will override the colors that are already assigned to those objects.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.color=(1,1,1)] {Float32Array} RGB colorize factors, multiplied by rendered pixel colors.
         */
        this.setColor = function (params) {
            if (params.clear) {
                scene.setColorize(scene.entityIds);
            }
            if (params.ids) {
                scene.setColorize(params.ids, params.color);
            }
            if (params.types) {
                scene.setColorize(params.types, params.color);
            }
        };

        /**
         Sets opacity of objects, models and/or IFC types.

         Note that this will override the opacities of those objects.

         @param params {*}
         @param [params.types] {Array} IFC types of objects to update.
         @param [params.ids] {Array} IDs or GUIDs of objects/models to update.
         @param [params.opacity=1] {Number} Opacity factor in range ````[0..1]````, multiplies by the rendered pixel alphas.
         */
        this.setOpacity = function (params) {
            if (params.clear) {
                scene.setOpacity(scene.entityIds);
            }
            if (params.ids) {
                scene.setOpacity(params.ids, params.opacity);
            }
            if (params.types) {
                scene.setOpacity(params.types, params.opacity);
            }
        };

        /**
         Sets camera state.

         @param params
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
         Gets camera state.

         @returns {{type: string, eye: (*|Array.<T>), target: (*|Array.<T>), up: (*|Array.<T>)}}
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
         Redefines light sources.

         @param params Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
         See http://xeogl.org/docs/classes/Lights.html for possible params for each light type
         */
        this.setLights = function (params) {
            lights = params;
            for (var i = scene.lights.lights.length - 1; i >= 0; i--) {
                scene.lights.lights[i].destroy();
            }
            scene.lights.lights = buildLights(lights);
        };

        /**
         Returns light sources.

         @returns Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
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

         @param params
         @param ok
         */
        this.viewFit = function (params, ok) {
            params = params || {};
            var aabb = scene.getAABB(params.ids);
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

        /**
         * Remembers the current state of the viewer so that it can be reset to this state with
         * a subsequent call to #reset.
         */
        this.saveReset = function () {
            resetBookmark = this.getBookmark();
        };


        this.getObject = function (id) {
            return scene.entityIds[id];
        };

        /**
         * Resets the state of this viewer to the state previously saved with #saveReset.
         * @param {*} params A mask which specifies which aspects of viewer state to reset.
         */
        this.reset = function (params) {
            if (!resetBookmark) {
                console.log("Ignoring call to xeoglViewer.reset - xeoglViewer.saveReset not called previously.");
                return;
            }
            this.setBookmark(resetBookmark, params);
        };

        /**
         Saves a bookmark.

         @param {*} mask Masks which aspects of viewer state to bookmark. Saves everything by default.
         */
        this.getBookmark = function (mask) {
            var bookmark = {};
            if (!mask || mask.colors) {
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
            if (!mask || mask.visible) {
                bookmark.visible = this.getVisibility();
            }
            if (!mask || mask.ghosted) {
                bookmark.ghosted = this.getGhosted();
            }
            if (!mask || mask.selected) {
                bookmark.selected = this.getSelection();
            }
            if (!mask || mask.camera) {
                var camera = this.getCamera();
                camera.animate = true; // Camera will fly to position when bookmark is restored
                bookmark.camera = camera;
            }
            return bookmark;
        };

        /**
         Restores a bookmark.

         @param bookmark
         @param {*} mask Masks which aspects of viewer state to restore. Restores everything by default.
         */
        this.setBookmark = function (bookmark, mask) {
            if (bookmark.colors && (!mask || mask.colors)) {
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
            if (bookmark.visible && (!mask || mask.visible)) {
                this.setVisibility({ids: bookmark.visible, visible: true});
            }
            if (bookmark.ghosted && (!mask || mask.ghosted)) {
                this.setGhosted({ids: bookmark.ghosted, ghosted: true});
            }
            if (bookmark.selected && (!mask || mask.selected)) {
                this.setSelection({ids: bookmark.selected, selected: true});
            }
            if (bookmark.camera && (!mask || mask.camera)) {
                this.setCamera(bookmark.camera);
            }
        };

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
         Captures a snapshot image.

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
         @returns {Object} World boundary of object, containing {obb, aabb, center, sphere} properties. See xeogl.Boundary3D
         */
        this.getWorldBoundary = function (objectId, result) {
            var object = scene.entities[objectId] || scene.guidObjects[objectId];
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
         Destroys the viewer
         */
        this.destroy = function () {
            scene.destroy();
        }
    }

    xeoglViewer.prototype = Object.create(EventHandler.prototype);

    return xeoglViewer;
});
