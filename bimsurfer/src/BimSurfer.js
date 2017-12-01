import Notifier from './Notifier.js';
import Model from './BimServerModel.js';
import PreloadQuery from './PreloadQuery.js';
import GeometryLoader from './BimServerGeometryLoader.js';
import EventHandler from './EventHandler.js';
import xeoViewer from './xeoViewer/xeoViewer.js';

import BimServerClient from "bimserverapi";

export default class BimSurfer extends EventHandler {
	constructor(cfg) {
		super();

		this.BimServerApi = BimServerClient;

		cfg = cfg || {};

		this.viewer = new xeoViewer(cfg);

		/**
		 * Fired whenever this BIMSurfer's camera changes.
		 * @event camera-changed
		 */
		this.viewer.on("camera-changed", (args) => {
			this.fire("camera-changed", args);
		});

		/**
		 * Fired whenever this BIMSurfer's selection changes.
		 * @event selection-changed
		 */
		this.viewer.on("selection-changed", (args) => {
			this.fire("selection-changed", args);
		});

		// This are arrays as multiple models might be loaded or unloaded.
		this._idMapping = {
			'toGuid': [],
			'toId': []
		};
	}
	/**
	 * Loads a model into this BIMSurfer.
	 * @param params
	 */
	load(params) {

		if (params.test) {
			this.viewer.loadRandom(params);
			return null;

		} else if (params.bimserver) {
			return this._loadFromServer(params);

		} else if (params.api) {
			return this._loadFromAPI(params);

		} else if (params.src) {
			return this._loadFrom_glTF(params);
		}
	}

	_loadFromServer(params) {

		const notifier = new Notifier();
		const bimServerApi = new this.BimServerApi(params.bimserver, notifier);

		params.api = bimServerApi; // TODO: Make copy of params

		return this._initApi(params)
			.then(this._loginToServer)
			.then(this._getRevisionFromServer.bind(this))
			.then(this._loadFromAPI.bind(this));
	}

	_initApi(params) {
		return new Promise((resolve, reject) => {
			params.api.init(() => {
				resolve(params);
			});
		});
	}

	_loginToServer(params) {
		return new Promise((resolve, reject) => {
			if (params.token) {
				params.api.setToken(params.token, () => {
					resolve(params);
				}, reject);
			} else {
				params.api.login(params.username, params.password, () => {
					resolve(params);
				}, reject);
			}
		});
	}

	_getRevisionFromServer(params) {
		return new Promise((resolve, reject) => {
			if (params.roid) {
				resolve(params);
			} else {
				params.api.call("ServiceInterface", "getAllRelatedProjects", { poid: params.poid }, (data) => {
					let resolved = false;

					data.forEach((projectData) => {
						if (projectData.oid == params.poid) {
							params.roid = projectData.lastRevisionId;
							params.schema = projectData.schema;
							if (!this.models) {
								this.models = [];
							}
							this.models.push(projectData);
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

	_loadFrom_glTF(params) {
		if (params.src) {
			return new Promise((resolve, reject) => {
				const m = this.viewer.loadglTF(params.src);
				m.on("loaded", () => {

					let numComponents = 0, componentsLoaded = 0;

					m.iterate((component) => {
						if (component.isType("xeogl.Entity")) {
							++numComponents;
							((c) => {
								let timesUpdated = 0;
								c.worldBoundary.on("updated", () => {
									if (++timesUpdated == 2) {
										++componentsLoaded;
										if (componentsLoaded == numComponents) {
											this.viewer.viewFit({});

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
	}

	_loadFromAPI(params) {

		return new Promise((resolve, reject) => {

			params.api.getModel(params.poid, params.roid, params.schema, false,
				(model) => {

					// TODO: Preload not necessary combined with the bruteforce tree
					let fired = false;

					model.query(PreloadQuery,
						() => {
							if (!fired) {
								fired = true;
								const vmodel = new Model(params.api, model);

								this._loadModel(vmodel);

								resolve(vmodel);
							}
						});
				});
		});
	}

	_loadModel(model) {

		model.getTree().then((tree) => {

			const oids = [];
			const oidToGuid = {};
			const guidToOid = {};

			const visit = (n) => {
				oids[n.gid] = n.id;
				oidToGuid[n.id] = n.guid;
				guidToOid[n.guid] = n.id;

				for (let i = 0; i < (n.children || []).length; ++i) {
					visit(n.children[i]);
				}
			};

			visit(tree);

			this._idMapping.toGuid.push(oidToGuid);
			this._idMapping.toId.push(guidToOid);

			const models = {};

			// TODO: Ugh. Undecorate some of the newly created classes
			models[model.model.roid] = model.model;

			// Notify viewer that things are loading, so viewer can
			// reduce rendering speed and show a spinner.
			this.viewer.taskStarted();

			this.viewer.createModel(model.model.roid);

			const loader = new GeometryLoader(model.api, models, this.viewer);

			loader.addProgressListener((progress, nrObjectsRead, totalNrObjects) => {
				if (progress == "start") {
					console.log("Started loading geometries");
					this.fire("loading-started");
				} else if (progress == "done") {
					console.log("Finished loading geometries (" + totalNrObjects + " objects received)");
					this.fire("loading-finished");
					this.viewer.taskFinished();
				}
			});

			loader.setLoadOids([model.model.roid], oids);

			// viewer.clear(); // For now, until we support multiple models through the API

			this.viewer.on("tick", () => { // TODO: Fire "tick" event from xeoViewer
				loader.process();
			});

			loader.start();
		});
	}

	// Helper function to traverse over the mappings for individually loaded models
	static _traverseMappings(mappings) {
		return (k) => {
			for (let i = 0; i < mappings.length; ++i) {
				const v = mappings[i][k];
				if (v) { return v; }
			}
			return null;
		};
	}

	/**
	 * Returns a list of object ids (oid) for the list of guids (GlobalId)
	 *
	 * @param guids List of globally unique identifiers from the IFC model
	 */
	toId(guids) {
		return guids.map(this._traverseMappings(this._idMapping.toId));
	}

	/**
	 * Returns a list of guids (GlobalId) for the list of object ids (oid) 
	 *
	 * @param ids List of internal object ids from the BIMserver / glTF file
	 */
	toGuid(ids) {
		return ids.map(this._traverseMappings(this._idMapping.toGuid));
	}

	/**
	 * Shows/hides objects specified by id or entity type, e.g IfcWall.
	 *
	 * When recursive is set to true, hides children (aggregates, spatial structures etc) or
	 * subtypes (IfcWallStandardCase ⊆ IfcWall).
	 *
	 * @param params
	 */
	setVisibility(params) {
		this.viewer.setVisibility(params);
	}

	/**
	 * Selects/deselects objects specified by id.
	 **
	 * @param params
	 */
	setSelection(params) {
		return this.viewer.setSelection(params);
	}

	/**
	 * Gets a list of selected elements.
	 */
	getSelection() {
		return this.viewer.getSelection();
	}

	/**
	 * Sets color of objects specified by ids or entity type, e.g IfcWall.
	 **
	 * @param params
	 */
	setColor(params) {
		this.viewer.setColor(params);
	}

	/**
	 * Sets opacity of objects specified by ids or entity type, e.g IfcWall.
	 **
	 * @param params
	 */
	setOpacity(params) {
		this.viewer.setOpacity(params);
	}

	/**
	 * Fits the elements into view.
	 *
	 * Fits the entire model into view if ids is an empty array, null or undefined.
	 * Animate allows to specify a transition period in milliseconds in which the view is altered.
	 *
	 * @param params
	 */
	viewFit(params) {
		this.viewer.viewFit(params);
	}

	/**
	 *
	 */
	getCamera() {
		return this.viewer.getCamera();
	}

	/**
	 *
	 * @param params
	 */
	setCamera(params) {
		this.viewer.setCamera(params);
	}

	/**
	 * Redefines light sources.
	 * 
	 * @param params Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
	 * See http://xeoengine.org/docs/classes/Lights.html for possible params for each light type
	 */
	setLights(params) {
		this.viewer.setLights(params);
	}

	/**
	 * Returns light sources.
	 * 
	 * @returns Array of lights {type: "ambient"|"dir"|"point", params: {[...]}}
	 */
	getLights() {
		return this.viewer.getLights;
	}

	/**
	 *
	 * @param params
	 */
	reset(params) {
		this.viewer.reset(params);
	}

	/**
	 * Returns a list of loaded IFC entity types in the model.
	 * 
	 * @method getTypes
	 * @returns {Array} List of loaded IFC entity types, with visibility flag
	 */
	getTypes() {
		return this.viewer.getTypes();
	}

	/**
	 * Sets the default behaviour of mouse and touch drag input
	 *
	 * @method setDefaultDragAction
	 * @param {String} action ("pan" | "orbit")
	 */
	setDefaultDragAction(action) {
		this.viewer.setDefaultDragAction(action);
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
		return this.viewer.getWorldBoundary(objectId, result);
	}

	/**
	  * Destroys the BIMSurfer
	  */
	destroy() {
		this.viewer.destroy();
	}
}
