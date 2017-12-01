import 'xeogl';

import DefaultMaterials from '../DefaultMaterials';
import EventHandler from '../EventHandler';
import Utils from '../Utils';
import './controls/bimCameraControl';
import './entities/bimModel';
import './entities/bimObject';
import './helpers/bimBoundaryHelper';
import './effects/highlightEffect';
import './utils/collection';

export default class xeoViewer extends EventHandler {
	constructor(cfg) {
		// Create xeoViewer
		super();

		// Distance to WebGL's far clipping plane.
		const FAR_CLIP = 5000;

		const domNode = document.getElementById(cfg.domNode);
		const canvas = document.createElement("canvas");

		domNode.appendChild(canvas);

		// Create a Scene
		this.scene = new xeogl.Scene({ // http://xeoengine.org/docs/classes/Scene.html
			canvas: canvas,
			transparent: true
		});

		// Redefine default light sources;
		this.lights = [
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
		this.scene.lights.lights = this.buildLights(this.lights);

		// Attached to all objects to fit the model inside the view volume
		this.scale = new xeogl.Scale(this.scene, {
			xyz: [1, 1, 1]
		});

		// Provides user input
		this.input = this.scene.input;

		// Using the scene's default camera
		this.camera = this.scene.camera;
		this.camera.project.far = FAR_CLIP;

		// Flies cameras to objects
		this.cameraFlight = new xeogl.CameraFlightAnimation(this.scene, { // http://xeoengine.org/docs/classes/CameraFlightAnimation.html
			fitFOV: 25,
			duration: 1
		});

		// Registers loaded xeoEngine components for easy destruction
		this.collection = new xeogl.Collection(this.scene); // http://xeoengine.org/docs/classes/Collection.html

		// Shows a wireframe box at the given boundary
		this.boundaryHelper = new xeogl.BIMBoundaryHelper(this.scene, this, { color: cfg.selectionBorderColor });

		this.highlightEffect = new xeogl.HighlightEffect(this.scene, { color: cfg.selectionColor });

		// Models mapped to their IDs
		this.models = {};

		// Objects mapped to IDs
		this.objects = {};

		this.objects_by_guid = {};

		// For each RFC type, a map of objects mapped to their IDs
		this.rfcTypes = {};

		// Objects that are currently visible, mapped to IDs
		this.visibleObjects = {};

		// Lazy-generated array of visible object IDs, for return by #getVisibility()
		this.visibleObjectList = null;

		// Array of objects RFC types hidden by default
		this.hiddenTypes = ["IfcOpeningElement", "IfcSpace"];

		// Objects that are currently selected, mapped to IDs
		this.selectedObjects = {};

		// Lazy-generated array of selected object IDs, for return by #getSelection()
		this.selectedObjectList = null;

		// Bookmark of initial state to reset to - captured with #saveReset(), applied with #reset().
		this.resetBookmark = null;

		// Component for each projection type,
		// to swap on the camera when we switch projection types
		this.projections = {

			persp: this.camera.project, // Camera has a xeogl.Perspective by default

			ortho: new xeogl.Ortho(this.scene, {
				scale: 1.0,
				near: 0.1,
				far: FAR_CLIP
			})
		};

		// The current projection type
		this.projectionType = "persp";

		//-----------------------------------------------------------------------------------------------------------
		// Camera notifications
		//-----------------------------------------------------------------------------------------------------------


		// Fold xeoEngine's separate events for view and projection updates
		// into a single "camera-changed" event, deferred to fire on next scene tick.

		let cameraUpdated = false;

		this.camera.on("projectMatrix", () => {
			cameraUpdated = true;
		});

		this.camera.on("viewMatrix", () => {
			cameraUpdated = true;
		});

		this.scene.on("tick", () => {

			/**
			 * Fired on the iteration of each "game loop" for this xeoViewer.
			 * @event tick
			 * @param {String} sceneID The ID of this Scene.
			 * @param {Number} startTime The time in seconds since 1970 that this xeoViewer was instantiated.
			 * @param {Number} time The time in seconds since 1970 of this "tick" event.
			 * @param {Number} prevTime The time of the previous "tick" event from this xeoViewer.
			 * @param {Number} deltaTime The time in seconds since the previous "tick" event from this xeoViewer.
			 */
			this.fire("tick");

			if (cameraUpdated) {

				/**
				 * Fired whenever this xeoViewer's camera changes.
				 * @event camera-changed
				 * @params New camera state, same as that got with #getCamera.
				 */
				this.fire("camera-changed", [this.getCamera()]);
				cameraUpdated = false;
			}
		});

		//-----------------------------------------------------------------------------------------------------------
		// Camera control
		//-----------------------------------------------------------------------------------------------------------

		this.cameraControl = new xeogl.BIMCameraControl(this.scene, {
			camera: this.camera
		});

		this.cameraControl.on("pick", (hit) => {
			// Get BIM object ID from entity metadata
			const entity = hit.entity;

			if (!entity.meta) {
				return;
			}

			const objectId = entity.meta.objectId || entity.id;

			if (objectId === undefined) {
				return;
			}

			const selected = !!this.selectedObjects[objectId]; // Object currently selected?
			const shiftDown = this.scene.input.keyDown[this.input.KEY_SHIFT]; // Shift key down?

			this.setSelection({
				ids: [objectId],
				selected: !selected, // Picking an object toggles its selection status
				clear: !shiftDown // Clear selection first if shift not down
			});
		});

		this.cameraControl.on("nopick", (hit) => {
			this.setSelection({
				clear: true
			});
		});
	}

	/**
	 * Sets the default behaviour of mouse and touch drag input
	 *
	 * @method setDefaultDragAction
	 * @param {String} action ("pan" | "orbit")
	 */
	setDefaultDragAction(action) {
		this.cameraControl.defaultDragAction = action;
	}

	/**
	 * Sets the global scale for models loaded into the viewer.
	 *
	 * @method setScale
	 * @param {Number} s Scale factor.
	 */
	setScale(s) {
		this.scale.xyz = [s, s, s];
	}

	/**
	 * Notifies the viewer that a task (such as loading a model) has started. Use #taskFinished
	 * to signal that the task has finished.
	 *
	 * Whenever the number of tasks is greater than zero, the viewer will display a spinner,
	 * and reduce rendering speed so as to allow scene updates to happen faster.
	 */
	taskStarted() {
		this.scene.canvas.spinner.processes++;
		this.scene.ticksPerRender = 15; // Tweak this if necessary
	}

	/**
	 * Signals that a task has finished (see #taskStarted).
	 */
	taskFinished() {
		const spinner = this.scene.canvas.spinner;
		if (spinner.processes === 0) {
			return;
		}
		spinner.processes--;
		if (spinner.processes === 0) {
			this.scene.ticksPerRender = 1; // Back to max speed, one render per tick
		}
	}

	/**
	 * Loads random objects into the viewer for testing.
	 *
	 * Subsequent calls to #reset will then set the viewer to the state right after the model was loaded.
	 *
	 * @method loadRandom
	 * @param {*} params Parameters
	 * @param {Number} [params.numEntities=200] Number of entities to create.
	 * @param {Number} [params.size=200] Size of model on every axis.
	 * @param {Float32Array} [params.center] Center point of model.
	 */
	loadRandom(params) {

		params = params || {};

		this.clear();

		const geometry = new xeogl.BoxGeometry(this.scene, {
			id: "geometry.test"
		});

		this.collection.add(geometry);

		const modelId = "test";
		const roid = "test";
		let oid;
		let type;
		let objectId;
		let translate;
		let scale;
		let matrix;
		let types = Object.keys(DefaultMaterials);

		const numEntities = params.numEntities || 200;
		const size = params.size || 200;
		const halfSize = size / 2;
		const centerX = params.center ? params.center[0] : 0;
		const centerY = params.center ? params.center[1] : 0;
		const centerZ = params.center ? params.center[2] : 0;

		this.createModel(modelId);

		for (let i = 0; i < numEntities; i++) {
			objectId = "object" + i;
			oid = objectId;
			translate = xeogl.math.translationMat4c(
				(Math.random() * size - halfSize) + centerX,
				(Math.random() * size - halfSize) + centerY,
				(Math.random() * size - halfSize) + centerZ);
			scale = xeogl.math.scalingMat4c(Math.random() * 32 + 0.2, Math.random() * 32 + 0.2, Math.random() * 10 + 0.2);
			matrix = xeogl.math.mulMat4(translate, scale, xeogl.math.mat4());
			type = types[Math.round(Math.random() * types.length)];
			this.createObject(modelId, roid, oid, objectId, ["test"], type, matrix);
		}

		// Set camera just to establish the up vector as +Z; the following
		// call to viewFit() will arrange the eye and target positions properly.
		this.setCamera({
			eye: [0, 0, 0],
			target: [centerX, centerY, centerZ],
			up: [0, 0, 1]
		});

		this.viewFit();

		this.saveReset();
	}

	/**
	 * Creates a geometry.
	 *
	 * @method createGeometry
	 * @param geometryId
	 * @param positions
	 * @param normals
	 * @param colors
	 * @param indices
	 * @returns {xeogl.Geometry} The new geometry
	 * @private
	 */
	createGeometry(geometryId, positions, normals, colors, indices) {
		const geometry = new xeogl.Geometry(this.scene, { // http://xeoengine.org/docs/classes/Geometry.html
			id: "geometry." + geometryId,
			primitive: "triangles",
			positions: positions,
			normals: normals,
			colors: colors,
			indices: indices
		});

		this.collection.add(geometry);

		return geometry;
	}


	/**
	 * Creates a model.
	 *
	 * @param modelId
	 * @returns {xeogl.BIMModel} The new model
	 * @private
	 */
	createModel(modelId) {

		if (this.models[modelId]) {
			console.log("Model with id " + modelId + " already exists, won't recreate");
			return;
		}

		const model = new xeogl.BIMModel(this.scene, {});

		this.models[modelId] = model;

		this.collection.add(model);

		return model;
	}

	/**
	 * Creates an object.
	 * @param [modelId] Optional model ID
	 * @param roid
	 * @param oid
	 * @param objectId
	 * @param geometryIds
	 * @param type
	 * @param matrix
	 * @returns {xeogl.BIMObject} The new object
	 * @private
	 */
	createObject(modelId, roid, oid, objectId, geometryIds, type, matrix) {
		let model;

		if (modelId) {
			model = this.models[modelId];
			if (!model) {
				console.log("Can't create object - model not found: " + modelId);
				return;
			}
			objectId = modelId + ":" + objectId;
		}

		if (this.objects[objectId]) {
			console.log("Object with id " + objectId + " already exists, won't recreate");
			return;
		}

		const object = new xeogl.BIMObject(this.scene, {
			id: objectId,
			geometryIds: geometryIds,
			matrix: matrix
		});

		object.transform.parent = this.scale; // Apply model scaling

		this._addObject(type, object);

		if (model) {
			model.collection.add(object);
		}

		// Hide objects of certain types by default
		if (this.hiddenTypes.indexOf(type) !== -1) {
			object.visibility.visible = false;
		}

		return object;
	}

	/**
	 * Inserts an object into this viewer
	 *
	 * @param {String} type
	 * @param {xeogl.Entity | xeogl.BIMObject} object
	 * @private
	 */
	_addObject(type, object) {
		let guid;
		if (object.id.indexOf("#") !== -1) {
			guid = Utils.CompressGuid(object.id.split("#")[1].substr(8, 36).replace(/-/g, ""));
		}
		this.collection.add(object);

		// Register object against ID
		this.objects[object.id] = object;
		if (guid) {
			(this.objects_by_guid[guid] || (this.objects_by_guid[guid] = [])).push(object);
		}

		// Register object against IFC type
		const types = (this.rfcTypes[type] || (this.rfcTypes[type] = {}));
		types[object.id] = object;

		const color = DefaultMaterials[type] || DefaultMaterials.DEFAULT;

		if (!guid) {
			object.material.diffuse = [color[0], color[1], color[2]];
		}
		object.material.specular = [0, 0, 0];

		if (color[3] < 1) { // Transparent object
			object.material.opacity = color[3];
			object.modes.transparent = true;
		}
		if (object.material.opacity < 1) { // Transparent object
			object.modes.transparent = true;
		}
	}

	/**
	 * Loads glTF model.
	 *
	 * Subsequent calls to #reset will then set the viewer to the state right after the model was loaded.
	 *
	 * @param src
	 */
	loadglTF(src) {

		this.clear();

		const model = new xeogl.GLTFModel(this.scene, {
			src: src
		});

		this.collection.add(model);

		this.models[model.id] = model;

		model.on("loaded", () => {

			// TODO: viewFit, but boundaries not yet ready on Model Entities

			model.iterate((component) => {
				if (component.isType("xeogl.Entity")) {
					this._addObject("DEFAULT", component);
				}
			});

			this.saveReset();
		});

		return model;
	}

	/**
	 * Destroys a model and all its objects.
	 *
	 * @param modelId
	 */
	destroyModel(modelId) {

		const model = this.models[modelId];

		if (!model) {
			console.warn("Can't destroy model - model not found: " + modelId);
			return;
		}

		model.collection.iterate((component) => {
			component.destroy();
		});

		model.destroy();

		delete this.models[modelId];
	}

	/**
	 * Clears the viewer.
	 *
	 * Subsequent calls to #reset will then set the viewer this clear state.
	 */
	clear() {

		const list = [];

		this.collection.iterate((component) => {
			list.push(component);
		});

		while (list.length) {
			list.pop().destroy();
		}

		this.objects = {};
		this.rfcTypes = {};
		this.visibleObjects = {};
		this.visibleObjectList = null;
		this.selectedObjects = {};
		this.selectedObjectList = null;

		this.saveReset();
	}

	/**
	 * Sets the visibility of objects specified by IDs or IFC types.
	 * If IFC types are specified, this will affect existing objects as well as subsequently loaded objects of these types
	 *
	 * @param params
	 * @param params.ids IDs of objects or IFC types to update.
	 * @param params.color Color to set.
	 */
	setVisibility(params) {

		let changed = false; // Only fire "visibility-changed" when visibility updates are actually made
		params = params || {};

		let ids = params.ids;
		let types = params.types;

		if (!ids && !types) {
			console.error("Param expected: ids or types");
			return;
		}

		ids = ids || [];
		types = types || [];

		//const recursive = !!params.recursive;
		const visible = params.visible !== false;

		let i;
		let len;
		let id;
		let objectId;

		if (params.clear) {
			for (objectId in this.visibleObjects) {
				if (this.visibleObjects.hasOwnProperty(objectId)) {
					delete this.visibleObjects[objectId];
					changed = true;
				}
			}
		}

		for (i = 0, len = types.length; i < len; i++) {
			const type = types[i];
			const typedict = this.rfcTypes[type] || {};

			Object.keys(typedict).forEach((id) => {
				const object = typedict[id];
				object.visibility.visible = visible;
				changed = true;
			});

			const index = this.hiddenTypes.indexOf(type);

			if (index !== -1 && visible) {
				this.hiddenTypes.splice(index, 1);	// remove type from array
			} else if (index === -1 && !visible) {
				this.hiddenTypes.push(type);			// add type to array
			}
		}

		for (i = 0, len = ids.length; i < len; i++) {
			id = ids[i];
			const fn = (object) => {
				object.visibility.visible = visible;
				changed = true;
			};
			const object_ = this.objects[id];
			if (!object_) { this.objects_by_guid[id].forEach(fn); }
			else { fn(object_); }
		}

		if (changed) {
			this.visibleObjectList = Object.keys(this.visibleObjects);

			/**
			 * Fired whenever objects become invisible or invisible
			 * @event visibility-changed
			 * @params Array of IDs of all currently-visible objects.
			 */
			this.fire("visibility-changed", [this.visibleObjectList]);
		}
	}

	/**
	 * Returns array of IDs of objects that are currently visible
	 */
	getVisibility() {
		if (this.visibleObjectList) {
			return this.visibleObjectList;
		}
		this.visibleObjectList = Object.keys(this.visibleObjects);
		return this.visibleObjectList;
	}

	/**
	 * Select or deselect some objects.
	 *
	 * @param params
	 * @param params.ids IDs of objects.
	 * @param params.selected Whether to select or deselect the objects
	 * @param params.clear Whether to clear selection state prior to updating
	 */
	setSelection(params) {

		params = params || {};

		let changed = false; // Only fire "selection-changed" when selection actually changes
		const selected = !!params.selected;
		let objectId;
		let object;

		if (params.clear) {
			for (objectId in this.selectedObjects) {
				if (this.selectedObjects.hasOwnProperty(objectId)) {
					object = this.selectedObjects[objectId];
					//  object.highlighted = false;
					delete this.selectedObjects[objectId];
					changed = true;
				}
			}
		}

		const ids = params.ids;

		if (ids) {

			for (let i = 0, len = ids.length; i < len; i++) {

				const fn = (object) => {

					const objectId = object.id;

					if (!!this.selectedObjects[objectId] !== selected) {
						changed = true;
					}

					if (selected) {
						this.selectedObjects[objectId] = object;
					} else {
						if (this.selectedObjects[objectId]) {
							delete this.selectedObjects[objectId];
						}
					}

					this.selectedObjectList = null; // Now needs lazy-rebuild

				};

				objectId = ids[i];
				const object_ = this.objects[objectId];
				if (!object_) {
					this.objects_by_guid[objectId].forEach(fn);
				}
				else {
					fn(object_);
				}

			}
		}

		if (changed) {

			this.selectedObjectList = Object.keys(this.selectedObjects);

			// Show boundary around selected objects
			this.setBoundaryState({
				ids: this.selectedObjectList,
				show: this.selectedObjectList.length > 0
			});

			/**
			 * Fired whenever this xeoViewer's selection state changes.
			 * @event selection-changed
			 * @params Array of IDs of all currently-selected objects.
			 */
			this.fire("selection-changed", [this.selectedObjectList]);
		}
	}

	/**
	 * Returns array of IDs of objects that are currently selected
	 */
	getSelection() {
		if (this.selectedObjectList) {
			return this.selectedObjectList;
		}
		this.selectedObjectList = Object.keys(this.selectedObjects);
		return this.selectedObjectList;
	}

	/**
	 * Sets the color of objects specified by IDs or IFC types.
	 *
	 * @param params
	 * @param params.ids IDs of objects to update.
	 * @param params.types IFC type of objects to update.
	 * @param params.color Color to set.
	 */
	setColor(params) {

		params = params || {};

		let ids = params.ids;
		let types = params.types;

		if (!ids && !types) {
			console.error("Param expected: ids or types");
			return;
		}

		ids = ids || [];
		types = types || [];

		const color = params.color;

		if (!color) {
			console.error("Param expected: 'color'");
			return;
		}

		let objectId;
		let object;

		for (let i = 0, len = types.length; i < len; i++) {
			const typedict = this.rfcTypes[types[i]] || {};
			Object.keys(typedict).forEach((id) => {
				const object = typedict[id];
				this._setObjectColor(object, color);
			});
		}

		for (let i = 0, len = ids.length; i < len; i++) {

			objectId = ids[i];
			object = this.objects[objectId] || this.objects_by_guid[objectId];

			if (!object) {
				// No return on purpose to continue changing color of
				// other potentially valid object identifiers.
				console.error("Object not found: '" + objectId + "'");
			} else {
				this._setObjectColor(object, color);
			}
		}
	}

	_setObjectColor(object, color) {

		const material = object.material;
		material.diffuse = [color[0], color[1], color[2]];

		const opacity = (color.length > 3) ? color[3] : 1;
		if (opacity !== material.opacity) {
			material.opacity = opacity;
			object.modes.transparent = opacity < 1;
		}
	}

	/**
	 * Sets the opacity of objects specified by IDs of IFC types.
	 *
	 * @param params
	 * @param params.ids IDs of objects to update.
	 * @param params.types IFC type of objects to update.
	 * @param params.opacity Opacity to set.
	 */
	setOpacity(params) {

		params = params || {};

		let ids = params.ids;
		let types = params.types;

		if (!ids && !types) {
			console.error("Param expected: ids or types");
			return;
		}

		ids = ids || [];
		types = types || [];

		const opacity = params.opacity;

		if (opacity === undefined) {
			console.error("Param expected: 'opacity'");
			return;
		}

		let objectId;
		let object;

		for (let i = 0, len = types.length; i < len; i++) {
			const typedict = this.rfcTypes[types[i]] || {};
			Object.keys(typedict).forEach((id) => {
				const object = typedict[id];
				this._setObjectOpacity(object, opacity);
			});
		}

		for (let i = 0, len = ids.length; i < len; i++) {

			objectId = ids[i];
			object = this.objects[objectId] || this.objects_by_guid[objectId];

			if (!object) {
				// No return on purpose to continue changing opacity of
				// other potentially valid object identifiers.
				console.error("Object not found: '" + objectId + "'");
			} else {
				this._setObjectOpacity(object, opacity);
			}
		}
	}

	_setObjectOpacity(object, opacity) {

		const material = object.material;

		if (opacity !== material.opacity) {
			material.opacity = opacity;
			object.modes.transparent = opacity < 1;
		}
	}

	/**
	 * Sets camera state.
	 *
	 * @param params
	 */
	setCamera(params) {

		params = params || {};

		// Set projection type

		const type = params.type;

		if (type && type !== this.projectionType) {

			const projection = this.projections[type];

			if (!projection) {
				console.error("Unsupported camera projection type: " + type);
			} else {
				this.camera.project = projection;
				this.projectionType = type;
			}
		}

		// Set camera position

		if (params.animate) {

			this.cameraFlight.flyTo({
				eye: params.eye,
				look: params.target,
				up: params.up,
				fitFOV: params.fitFOV,
				duration: params.duration
			});

		} else {

			if (params.eye) {
				this.camera.view.eye = params.eye;
			}

			if (params.target) {
				this.camera.view.look = params.target;
				this.cameraControl.rotatePos = this.camera.view.look; // Rotate about target initially
			}

			if (params.up) {
				this.camera.view.up = params.up;
			}
		}

		// Set camera FOV angle, only if currently perspective

		if (params.fovy) {
			if (this.projectionType !== "persp") {
				console.error("Ignoring update to 'fovy' for current '" + this.projectionType + "' camera");
			} else {
				this.camera.project.fovy = params.fovy;
			}
		}

		// Set camera view volume size, only if currently orthographic

		if (params.scale) {
			if (this.projectionType !== "ortho") {
				console.error("Ignoring update to 'scale' for current '" + this.projectionType + "' camera");
			} else {
				this.camera.project.scale = params.scale;
			}
		}
	}

	/**
	 * Gets camera state.
	 *
	 * @returns {{type: string, eye: (*|Array.<T>), target: (*|Array.<T>), up: (*|Array.<T>)}}
	 */
	getCamera() {

		const view = this.camera.view;

		const json = {
			type: this.projectionType,
			eye: view.eye.slice(0),
			target: view.look.slice(0),
			up: view.up.slice(0)
		};

		const project = this.camera.project;

		if (this.projectionType === "persp") {
			json.fovy = project.fovy;

		} else if (this.projectionType === "ortho") {
			json.size = [1, 1, 1]; // TODO: efficiently derive from cached value or otho volume
		}

		return json;
	}


	/**
	 * Redefines light sources.
	 * 
	 * @param params Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
	 * See http://xeoengine.org/docs/classes/Lights.html for possible params for each light type
	 */
	setLights(params) {
		this.lights = params;

		for (let i = this.scene.lights.lights.length - 1; i >= 0; i--) {
			this.scene.lights.lights[i].destroy();
		}

		this.scene.lights.lights = this.buildLights(this.lights);
	}


	/**
	 * Returns light sources.
	 * 
	 * @returns Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
	 */
	getLights() {
		return this.lights;
	}

	buildLights(lights) {
		return lights.map((light) => {
			if (light.type == "ambient") {
				return new xeogl.AmbientLight(this.scene, light.params);
			} else if (light.type == "dir") {
				return new xeogl.DirLight(this.scene, light.params);
			} else if (light.type == "point") {
				return new xeogl.PointLight(this.scene, light.params);
			} else {
				console.log("Unknown light type: " + light.type);
			}
		});
	}


	/**
	 *
	 * @param params
	 * @param ok
	 */
	viewFit(params, ok) {

		params = params || {};

		const ids = params.ids;
		let aabb;

		if (!ids || ids.length === 0) {

			// Fit everything in view by default
			aabb = this.scene.worldBoundary.aabb;

		} else {
			aabb = this.getObjectsAABB(ids);
		}

		if (params.animate) {

			this.cameraFlight.flyTo({
				aabb: aabb,
				fitFOV: params.fitFOV,
				duration: params.duration
			}, () => {
				if (ok) {
					ok();
				}

				// Now orbiting the point we flew to
				this.cameraControl.rotatePos = this.camera.view.look;
			});

		} else {

			this.cameraFlight.jumpTo({
				aabb: aabb,
				fitFOV: 50.0
			});
		}
	}

	// Updates the boundary helper
	setBoundaryState(params) {

		if (params.aabb) {
			throw new Error("Not supported");
		} else if (params.ids) {
			this.boundaryHelper.setSelected(params.ids);

			this.highlightEffect.clear();

			const ids = params.ids;
			let objectId;
			let object;

			for (let i = 0, len = ids.length; i < len; i++) {
				objectId = ids[i];
				object = this.objects[objectId];
				if (object) {

					this.highlightEffect.add(object);
					//object.highlighted = true;
				}
			}
		}

	}

	// Returns an axis-aligned bounding box (AABB) that encloses the given objects
	getObjectsAABB(ids_) {

		let ids;
		if (Object.keys(this.objects_by_guid).length) {
			ids = [];
			ids_.forEach((i) => {
				this.objects_by_guid[i].forEach((o) => {
					ids.push(o.id);
				});
			});
		} else {
			ids = ids_;
		}

		if (ids.length === 0) {

			// No object IDs given
			return null;
		}

		let objectId;
		let object;
		let worldBoundary;

		if (ids.length === 1) {

			// One object ID given

			objectId = ids[0];
			object = this.objects[objectId] || this.objects_by_guid[objectId];

			if (object) {
				worldBoundary = object.worldBoundary;

				if (worldBoundary) {

					return worldBoundary.aabb;

				} else {
					return null;
				}

			} else {
				return null;
			}
		}

		// Many object IDs given

		let i;
		let len;
		let min;
		let max;

		let xmin = 100000;
		let ymin = 100000;
		let zmin = 100000;
		let xmax = -100000;
		let ymax = -100000;
		let zmax = -100000;

		let aabb;

		for (i = 0, len = ids.length; i < len; i++) {

			objectId = ids[i];
			object = this.objects[objectId] || this.objects_by_guid[objectId];

			if (!object) {
				continue;
			}

			worldBoundary = object.worldBoundary;

			if (!worldBoundary) {
				continue;
			}

			aabb = worldBoundary.aabb;

			min = aabb.slice(0);
			max = aabb.slice(3);

			if (min[0] < xmin) {
				xmin = min[0];
			}

			if (min[1] < ymin) {
				ymin = min[1];
			}

			if (min[2] < zmin) {
				zmin = min[2];
			}

			if (max[0] > xmax) {
				xmax = max[0];
			}

			if (max[1] > ymax) {
				ymax = max[1];
			}

			if (max[2] > zmax) {
				zmax = max[2];
			}
		}

		const result = xeogl.math.AABB3();

		result[0 + 0] = xmin;
		result[1 + 0] = ymin;
		result[2 + 0] = zmin;
		result[0 + 3] = xmax;
		result[1 + 3] = ymax;
		result[2 + 3] = zmax;

		return result;
	}

	/**
	 * Remembers the current state of the viewer so that it can be reset to this state with
	 * a subsequent call to #reset.
	 */
	saveReset() {
		this.resetBookmark = this.getBookmark();
	}

	getObject(id) {
		return this.objects[id];
	}

	/**
	 * Resets the state of this viewer to the state previously saved with #saveReset.
	 * @param {*} params A mask which specifies which aspects of viewer state to reset.
	 */
	reset(params) {
		if (!this.resetBookmark) {
			console.log("Ignoring call to xeoViewer.reset - xeoViewer.saveReset not called previously.");
			return;
		}
		this.setBookmark(this.resetBookmark, params);
	}

	/**
	 * Returns a bookmark of xeoViewer state.
	 * @param {*} options A mask which specifies which aspects of viewer state to bookmark.
	 */
	getBookmark(options) {

		// Get everything by default

		const getVisible = !options || options.visible;
		const getColors = !options || options.colors;
		const getSelected = !options || options.selected;
		const getCamera = !options || options.camera;

		const bookmark = {};

		let objectId;
		let object;

		if (getVisible) {

			const visible = [];

			for (objectId in this.objects) {
				if (this.objects.hasOwnProperty(objectId)) {

					object = this.objects[objectId] || this.objects_by_guid[objectId];

					if (getVisible && object.visibility.visible) {
						visible.push(objectId);
					}
				}
			}
			bookmark.visible = visible;
		}

		if (getColors) {

			let opacity;
			const colors = {};
			const opacities = {};

			for (objectId in this.objects) {
				if (this.objects.hasOwnProperty(objectId)) {
					object = this.objects[objectId] || this.objects_by_guid[objectId];
					colors[objectId] = object.material.diffuse.slice(); // RGB
					opacities[objectId] = object.modes.transparent ? object.material.opacity : 1.0;
				}
			}
			bookmark.colors = colors;
			bookmark.opacities = opacities;
		}

		if (getSelected) {
			bookmark.selected = this.getSelection();
		}

		if (getCamera) {
			const camera = this.getCamera();
			camera.animate = true; // Camera will fly to position when bookmark is restored
			bookmark.camera = camera;
		}

		return bookmark;
	}

	/**
	 * Restores xeoViewer to a bookmark.
	 *
	 * @param bookmark
	 * @param options
	 */
	setBookmark(bookmark, options) {

		// Set everything by default, where provided in bookmark

		const setVisible = bookmark.visible && (!options || options.visible);
		const setColors = bookmark.colors && (!options || options.colors);
		const setSelected = bookmark.selected && (!options || options.selected);
		const setCamera = bookmark.camera && (!options || options.camera);

		if (setColors) {

			let objectId;
			let object;
			const colors = bookmark.colors;
			const opacities = bookmark.opacities;

			for (objectId in colors) {
				if (colors.hasOwnProperty(objectId)) {
					object = this.objects[objectId] || this.objects_by_guid[objectId];
					if (object) {
						this._setObjectColor(object, colors[objectId]);
						this._setObjectOpacity(object, opacities[objectId]);
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
	}

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
	setConfigs(params) {

		params = params || {};

		if (params.mouseRayPick != undefined) {
			this.cameraControl.mousePickEntity.rayPick = params.mouseRayPick;
		}

		if (params.viewFitFOV != undefined) {
			this.cameraFlight.fitFOV = params.viewFitFOV;
		}

		if (params.viewFitDuration != undefined) {
			this.cameraFlight.duration = params.viewFitDuration;
		}
	}

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
	getSnapshot(params) {
		return this.scene.canvas.getSnapshot(params);
	}

	/**
	 Returns a list of loaded IFC entity types in the model.
		
	 @method getTypes
	 @returns {Array} List of loaded IFC entity types, with visibility flag
	 */
	getTypes() {
		return Object.keys(this.rfcTypes).map((n) => {
			return { name: n, visible: this.hiddenTypes.indexOf(n) === -1 };
		});
	}

	/**
	 * Returns the world boundary of an object
	 *
	 * @method getWorldBoundary
	 * @param {String} objectId id of object
	 * @param {Object} result Existing boundary object
	 * @returns {Object} World boundary of object, containing {obb, aabb, center, sphere} properties. See xeogl.Boundary3D
	 */
	getWorldBoundary(objectId, result) {
		let object = this.objects[objectId] || this.objects_by_guid[objectId];

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
			let s = 1 / this.scale.xyz[0],
				scaled = object.worldBoundary;

			result.aabb[0] = scaled.aabb[0] * s;
			result.aabb[1] = scaled.aabb[1] * s;
			result.aabb[2] = scaled.aabb[2] * s;
			result.aabb[3] = scaled.aabb[3] * s;
			result.aabb[4] = scaled.aabb[4] * s;
			result.aabb[5] = scaled.aabb[5] * s;

			xeogl.math.mulVec3Scalar(scaled.center, s, result.center);
			xeogl.math.mulVec4Scalar(scaled.sphere, s, result.sphere);

			const obb = scaled.obb;
			const buffer = result.obb.buffer;
			for (let i = 0; i < 32; i += 4) {
				const v = new Float32Array(buffer, 4 * i);
				xeogl.math.mulVec3Scalar(obb.slice(i), s, v);
				v[3] = 1.0;
			}

			return result;
		}
	}

	/**
	 * Destroys the viewer
	 */
	destroy() {
		this.scene.destroy();
	}
}