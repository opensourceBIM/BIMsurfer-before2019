"use strict"

/**
 * Class: BIMSURFER.Viewer
 * The viewer can load and show the BIM Models.
 */
var GEOMETRY_TYPE_TRIANGLES = 0;
var GEOMETRY_TYPE_INSTANCE = 1;


BIMSURFER.Viewer = BIMSURFER.Class({
	CLASS: 'BIMSURFER.Viewer',
	SYSTEM: null,

	connectedServers: null,
	div: null,
	mode: null,
	canvas: null,
	events: null,
	controls: null,
	lights: null,
	scene: null,
	sceneLoaded: false,
	loadQueue: null,
	visibleTypes: null,
	loadedProjects: null,
	bimServerApi: null,
	loadedGroups: [],
	addToScene: [],
//	selectedObj: 'emtpy Selection',
//	mouseRotate: 0,
//	oldZoom: 15,
//	autoLoadPath: "",


	/**
	 * @constructor
	 * @param {String|div DOMelement} div The viewport div that will be used for the canvas
	 * @param {Object} [options] An object with options for controls and/or lights
	 * @param {Boolean} autoStart Full start automatically with the given options (default = false)
	 */
	__construct: function(bimServerApi, div, options, autoStart) {
		this.bimServerApi = bimServerApi;
		if(typeof div == 'string') {
			div = jQuery('div#' + div)[0];
		}

		if(!jQuery(div).is('div')) {
			console.error('BIMSURFER: Can not find div element');
			return;
		}
		if(!BIMSURFER.Util.isset(options)) {
			options = {};
		}

		this.SYSTEM = this;
		this.div = div;
		this.events = new BIMSURFER.Events(this);
		this.connectedServers = new Array();
		this.controls = new Array();
		if(!BIMSURFER.Util.isset(options.controls)) {
			this.addControl(new BIMSURFER.Control.PickFlyOrbit()).activateWhenReady();
		} else if (BIMSURFER.Util.isArray(options.controls)) {
			for(var i = 0; i < options.controls.length; i++) {
				this.addControl(options.controls[i]).activateWhenReady();
			}
		}

		this.lights = new Array();
		if(typeof options.lights == 'undefined') {
			this.addLight(new BIMSURFER.Light.Sun());
			this.addLight(new BIMSURFER.Light.Ambient());
		} else if (BIMSURFER.Util.isArray(options.lights)) {
			for(var i = 0; i < options.lights.length; i++) {
				this.addLight(options.lights[i]);
			}
		}


		this.loadQueue = new Array();
		this.visibleTypes = new Array();
		this.loadedProjects = new Array();

		if(BIMSURFER.Util.isset(options, options.autoStart)) {
			if(!BIMSURFER.Util.isset(options.autoStart.serverUrl, options.autoStart.serverUsername, options.autoStart.serverPassword, options.autoStart.projectOid)) {
				console.error('Some autostart parameters are missing');
				return;
			}
			var _this = this;
			var BIMServer = new BIMSURFER.Server(this, options.autoStart.serverUrl, options.autoStart.serverUsername, options.autoStart.serverPassword, false, true, true, function() {
				if(BIMServer.loginStatus != 'loggedin') {
					_this.div.innerHTML = 'Something went wrong while connecting';
					console.error('Something went wrong while connecting');
					return;
				}
				var project = BIMServer.getProjectByOid(options.autoStart.projectOid);
				project.loadScene((BIMSURFER.Util.isset(options.autoStart.revisionOid) ? options.autoStart.revisionOid : null), true);
			});
		}
	},

	/**
	 * Stores a connection to a server for later use
	 *
	 * @param {BIMSURFER.Server instance} server The server connection to store
	 */
	addConnectedServer: function(server) {
		if(this.connectedServers.indexOf(server) == -1) {
			this.connectedServers.push(server);
		}
	},

	/**
	 * Adds a control to the viewer.
	 *
	 * @param {BIMSURFER.Control.* instance} control The control to add
	 * @return The control object
	 */
	addControl: function(control) {
		if(!BIMSURFER.Util.isset(this.controls[control.CLASS])) {
			this.controls[control.CLASS] = new Array();
		}

		if(this.controls[control.CLASS].indexOf(control) == -1) {
			this.controls[control.CLASS].push(control);
		}

		control.setViewer(this);
		return control;
	},

	/**
	 * Removes a control from the viewer
	 *
	 * @param {BIMSURFER.Control.* instance} control The controle to remove
	 * @return The control object
	 */
	removeControl: function(control) {
		if(BIMSURFER.Util.isArray(this.controls[control.CLASS])) {
			var i = this.controls[control.CLASS].indexOf(control);
			if(i != -1) {
				this.controls[control.CLASS].splice(i, 1);
				control.deactivate();
				control.removeFromViewer();
			}
		}
		return control;
	},

	/**
	 * Adds a light to the viewer
	 *
	 * @param {BIMSURFER.Light.* instance} light The light to add
	 * @return The light object
	 */
	addLight: function(light) {
	   	if(light.CLASS.substr(0, 16) != 'BIMSURFER.Light.') {
	   		return;
		}

		if(this.lights.indexOf(light) == -1) {
			this.lights.push(light);
		}
		light.setViewer(this);

		if(this.scene) {
			light.activate();
		}
		return light;
	},

	/**
	 * Resizes the viewport and updates the aspect ratio
	 *
	 * @param {Number} width The new width in px
	 * @param {Number} height The new height in px
	 */
	resize: function(width, height) {
		if(this.canvas) {
			jQuery(this.canvas).width(width).height(height);
			if(BIMSURFER.Util.isset(this.canvas[0])) {
				this.canvas[0].width = width;
				this.canvas[0].height = height;
			}
		}

		if(this.scene !== null) {
			var optics = this.scene.findNode('main-camera').get('optics');
			optics['aspect'] = jQuery(this.canvas).width() / jQuery(this.canvas).height();
			this.scene.findNode('main-camera').set('optics', optics);
		}
	},

	/**
	 * Draws the HTML5 canvas element
	 *
	 * @return The canvas element
	 */
	drawCanvas: function() {
		var width = jQuery(this.div).width();
		var height = jQuery(this.div).height();
		if(!(width > 0 && height > 0)) {
			return;
		}

		if(jQuery(this.canvas).length == 1) {
			jQuery(this.canvas).remove();
		}

		jQuery(this.div).empty();

		this.canvas = jQuery('<canvas />')
							.attr('id', jQuery(this.div).attr('id') + "-canvas")
							.attr('width', width)
							.attr('height', height)
							.html('<p>This application requires a browser that supports the <a href="http://www.w3.org/html/wg/html5/">HTML5</a> &lt;canvas&gt; feature.</p>')
							.addClass(this.CLASS.replace(/\./g,"-"))
							.appendTo(this.div);
		return this.canvas;
	},

	/**
	 * Initializes the common events of the viewer
	 */
	initEvents: function() {
		var _this = this;
		var canvas = this.scene.getCanvas();
		canvas.addEventListener('mousedown', function(e) { _this.events.trigger('mouseDown', [e]); }, true);
		canvas.addEventListener('mousemove', function(e) { _this.events.trigger('mouseMove', [e]); }, true);
		canvas.addEventListener('mouseup', function(e) { _this.events.trigger('mouseUp', [e]); }, true);
		canvas.addEventListener('touchstart', function(e) { _this.events.trigger('touchStart', [e]); }, true);
		canvas.addEventListener('touchmove', function(e) { _this.events.trigger('touchMove', [e]); }, true);
		canvas.addEventListener('touchend', function(e) { _this.events.trigger('touchEnd', [e]); }, true);
		canvas.addEventListener('mousewheel', function(e) { _this.events.trigger('mouseWheel', [e]); }, true);
		canvas.addEventListener('DOMMouseScroll', function(e) { _this.events.trigger('mouseWheel', [e]); }, true);
		this.scene.on('pick', function(hit) { _this.events.trigger('pick', [hit]); });
		this.scene.on('tick', function() { _this.events.trigger('tick', []); });

		var lastDown = { x: null, y: null, scene: this.scene };
		this.events.register('mouseDown', function(e) {
			this.x = e.offsetX;
			this.y = e.offsetY;
		}, lastDown);
		this.events.register('mouseUp', function(e) {
			if(((e.offsetX > this.x) ? (e.offsetX - this.x < 5) : (this.x - e.offsetX < 5)) &&	((e.offsetY > this.y) ? (e.offsetY - this.y < 5) : (this.y - e.offsetY < 5))) {
				this.scene.pick(this.x, this.y, {rayPick: true});
			}
		}, lastDown);
	},

	/**
	 * Creates or updates the SceneJS Scene, based on a revision
	 *
	 * @param {BIMSURFER.ProjectRevision instance} revision The revision
	 * @param {Object} [options] An object with options to overwrite the default values
	 * @return The loaded scene
	 */
	loadScene: function(callback, options) {
		if(typeof options != 'object') {
			options = {};
		}

		if (this.scene == null) {
			try {
				this.scene = {
					backfaces: false,
					type: "scene",
					nodes: [{
						type: 'lookAt',
						id: 'main-lookAt',
						eye: (typeof options.eye == 'object' ? options.eye : { x: 1, y: 1, z: 1 }),
						look: (typeof options.look == 'object' ? options.look : { x: 0.0, y: 0.0, z: 0.0 }),
						up: (typeof options.up == 'object' ? options.up : { x: 0.0, y: 0.0, z: 1.0 }),
						nodes: [{
							type: 'camera',
							id: 'main-camera',
							optics: {
								type: 'perspective',
								far: (typeof options.far == 'number' ? options.far : 100),
								near: (typeof options.near == 'number' ? options.near : 0.001),
								aspect: (typeof options.aspect ==  'number' ? options.aspect : jQuery(this.canvas).width() / jQuery(this.canvas).height()),
								fovy: (typeof options.fovy ==  'number' ? options.fovy : 37.8493)
							},
							nodes: [{
								type: 'renderer',
								id: 'main-renderer',
								clear: {
									color: (typeof options.clearColor ==  'boolean' ? options.clearColor : true),
									depth: (typeof options.clearDepth ==  'boolean' ? options.clearDepth : true),
									stencil: (typeof options.clearStencil ==  'boolean' ? options.clearStencil : true)
								},
								nodes: [{
									type: 'lights',
									id: 'my-lights',
									lights: []
								}]
							}]
						}]
					}]
				};
				
				var defaultMaterialsLibrary = {
					type: "library",
					id: "default-materials-library",
					nodes: []
				};
				
				for (var type in BIMSURFER.Constants.materials) {
					var material = BIMSURFER.Constants.materials[type];
					defaultMaterialsLibrary.nodes.push({
						type: "material",
						coreId: type + "Material",
						id: type + "Material",
						baseColor: {r: material.r, g: material.g, b: material.b},
						alpha: material.a,
						emit: 0
					});
				}
				this.scene.nodes.push(defaultMaterialsLibrary);

				this.drawCanvas();
				this.scene.canvasId = jQuery(this.canvas).attr('id');
				this.scene.id = this.scene.canvasId;
				this.scene = SceneJS.createScene(this.scene);
				
				var _this = this;
				this.scene.on("tick", function(){
					if (_this.asyncStream != null) {
						_this.asyncStream.process(Math.ceil(1 + _this.state.nrObjects / 10));
					}
				});
				
				for(var i = 0; i < this.lights.length; i++) {
					this.lights[i].activate();
				}
				
				if(this.scene != null) {
					this.scene.set('tagMask', '^()$');

					this.initEvents();
					this.sceneLoaded = true;

//					for(var i = 0; i < this.lights.length; i++) {
//						this.lights[i].activate();
//					}
//
//					this.events.trigger('sceneLoaded', [this.scene]);
				}
				callback();
			}
			catch (error) {
				console.error('loadScene: ', error, error.stack, this, arguments);
				console.debug('loadScene ERROR', error, error.stack, this, arguments);
			}
		}
		else
		{
			callback();
//			jQuery.extend(this.scene.data.properties, scene.data.properties);
//
//			for(var i = 0; i < scene.nodes.length; i++) {
//				if(scene.nodes[i].type == 'library') {
//					scene.nodes[i].id += '-' + revision.project.oid + '-' + revision.oid;
//					this.scene.addNode(scene.nodes[i]);
//					break;
//				}
//			}
//
//			var camera = this.scene.findNode('main-camera');
//			var optics = camera.getOptics();
//			var far = (typeof options.far == 'number' ? options.far : 2);
//			var near = (typeof options.near == 'number' ? options.near : 1);
//
//			if(far != optics.far || near != optics.near)
//			{
//				optics.far = far;
//				optics.near = near;
//			  	camera.setOptics(optics);
//			}
//			if(this.loadedProjects.indexOf(revision.project) == -1) {
//				this.loadedProjects.push(revision.project);
//			}
//			if(revision.project.loadedRevisions.indexOf(revision) == -1) {
//				revision.project.loadedRevisions.push(revision);
//			}
//			this.events.trigger('sceneReloaded', [this.scene]);
//			return this.scene;
		}
		return null;
	},

	/**
	 * Loads and shows the geometry of the revisions that are in the load queue
	 */
	loadGeometry: function(options) {
		var _this = this;
		_this.SYSTEM.events.trigger('progressStarted', ['Loading Model']);
		_this.SYSTEM.events.trigger('progressBarStyleChanged', BIMSURFER.Constants.ProgressBarStyle.Marquee);

		this.bimServerApi.getSerializerByPluginClassName("org.bimserver.serializers.binarygeometry.BinaryGeometrySerializerPlugin", function(serializer){
			_this.bimServerApi.call("Bimsie1ServiceInterface", "downloadByTypes", {
				roids : options.roids,
				classNames : options.types,
				serializerOid : serializer.oid,
				includeAllSubtypes : false,
				useObjectIDM : false,
				sync : false,
				deep: true
			}, function(laid) {
				var done = function(state, progressLoader) {
					progressLoader.unregister();
					
					var boundsTranslate = null;
					
					_this.state = {
						nrObjectsRead: 0,
						nrObjects: 0
					};
					_this.asyncStream = new AsyncStream();

					function processGeometry(geometryType, nrVertices, vertices, nrNormals, normals, state) {
						if (geometryType == GEOMETRY_TYPE_TRIANGLES) {
							var geometry = {
								type: "geometry",
								primitive: "triangles"
							};
							
							geometry.coreId = _this.state.coreId;
							geometry.nrindices = _this.state.nrIndices;
							geometry.positions = vertices;
							geometry.normals = normals;
							geometry.indices = [];
							for (var i = 0; i < geometry.nrindices; i++) {
								geometry.indices.push(i);
							}
							library.add("node", geometry);
						}

						var materialNode = _this.scene.findNode(_this.state.materialName + "Material");
						var hasTransparency = false;
						if (materialNode != null) {
							if (materialNode.alpha != 1) {
								hasTransparency = true;
							}
						}

						var flags = {
							type : "flags",
							flags : {
								transparent : hasTransparency
							},
							nodes : [{
								type : "material",
								coreId : _this.state.materialName + "Material",
								nodes : [{
									id : _this.state.objectId,
									type : "name",
									nodes : [{
										type: "matrix",
		                                elements: _this.state.transformationMatrix,
		                                nodes:[{
											type: "geometry",
											coreId: _this.state.coreId
										}]
									}]
								}]
							}]
						};
						var typeNode = _this.scene.findNode(options.groupId + '-' + _this.state.type.toLowerCase());
						if (typeNode == null) {
							var typeNode =  {
								type: 'tag',
								tag: options.groupId + '-' + _this.state.type.toLowerCase(),
								id: options.groupId + '-' + _this.state.type.toLowerCase(),
								nodes: []
							};
							typeNode = boundsTranslate.addNode(typeNode);
						}
						typeNode.addNode(flags);
					}
					
					function addReadObject(asyncStream) {
						asyncStream.addReadUTF8(function(materialName){
							_this.state.materialName = materialName;
						});
						asyncStream.addReadUTF8(function(type){
							_this.state.type = type;
						});
						asyncStream.addReadLong(function(objectId){
							_this.state.objectId = objectId;
						});
						asyncStream.addReadByte(function(geometryType){
							if (geometryType == GEOMETRY_TYPE_TRIANGLES) {
								asyncStream.addReadLong(function(coreId){
									_this.state.coreId = coreId;
								});
								asyncStream.addReadInt(function(nrIndices){
									_this.state.nrIndices = nrIndices;
								});
								asyncStream.addReadFloats(6, function(objectBounds){
								});
								asyncStream.addReadInt(function(nrVertices){
									asyncStream.addReadFloatArray(nrVertices, function(vertices){
										asyncStream.addReadInt(function(nrNormals){
											asyncStream.addReadFloatArray(nrNormals, function(normals){
												_this.state.nrObjectsRead++;
												processGeometry(geometryType, nrVertices, vertices, nrNormals, normals, state);
												if (_this.state.nrObjectsRead < _this.state.nrObjects) {
													var progress = Math.ceil(100 * _this.state.nrObjectsRead / _this.state.nrObjects);
													if (progress != _this.state.lastProgress) {
														_this.SYSTEM.events.trigger('progressChanged', [progress]);
														_this.state.lastProgress = progress;
													}
													addReadObject(asyncStream);
												} else {
													_this.SYSTEM.events.trigger('progressDone');
													_this.events.trigger('sceneLoaded', [_this.scene]);
												}
											});
										});
									});
								});
							} else if (geometryType == GEOMETRY_TYPE_INSTANCE) {
								asyncStream.addReadLong(function(coreId){
									_this.state.coreId = coreId;
									_this.state.nrObjectsRead++;
									
									processGeometry(geometryType, -1, null, -1, null, state);
									if (_this.state.nrObjectsRead < _this.state.nrObjects) {
										var progress = Math.ceil(100 * _this.state.nrObjectsRead / _this.state.nrObjects);
										if (progress != _this.state.lastProgress) {
											_this.SYSTEM.events.trigger('progressChanged', [progress]);
											_this.state.lastProgress = progress;
										}
										addReadObject(asyncStream);
									} else {
										_this.SYSTEM.events.trigger('progressDone');
										_this.events.trigger('sceneLoaded', [_this.scene]);
									}
								});
							}
						});
						asyncStream.addReadFloatArray(16, function(transformationMatrix){
							_this.state.transformationMatrix = transformationMatrix;
						});
					}
					
					_this.SYSTEM.events.trigger('progressStarted', ['Loading Geometry']);
					_this.SYSTEM.events.trigger('progressBarStyleChanged', BIMSURFER.Constants.ProgressBarStyle.Continuous);
					_this.SYSTEM.events.trigger('progressChanged', [0]);
					_this.asyncStream.addReadUTF8(function(start){
						if (start != "BGS") {
							return false;
						}
						_this.asyncStream.addReadByte(function(version){
							if (version != 4) {
								return false;
							}
							_this.asyncStream.addReadFloats(6, function(modelBounds){
								var modelBounds = {
									min: {x: modelBounds[0], y: modelBounds[1], z: modelBounds[2]},
									max: {x: modelBounds[3], y: modelBounds[4], z: modelBounds[5]}
								};
								
								var center = {
									x: (modelBounds.max.x + modelBounds.min.x) / 2,
									y: (modelBounds.max.y + modelBounds.min.y) / 2,
									z: (modelBounds.max.z + modelBounds.min.z) / 2,
								};

								boundsTranslate = _this.scene.findNode("bounds_translate_" + options.groupId);
								if (boundsTranslate == null) {
									boundsTranslate = {
										id: "bounds_translate_" + options.groupId,
										type: "translate",
										x: -center.x,
										y: -center.y,
										z: -center.z,
										nodes: []
									}
									boundsTranslate = _this.scene.findNode("my-lights").addNode(boundsTranslate);
								}
								
								var lookat = _this.scene.findNode("main-lookAt");
								var eye = { x: (modelBounds.max.x - modelBounds.min.x) * 1.5, y: 0, z: 0 };
								lookat.set("eye", eye);
								
								var maincamera = _this.scene.findNode("main-camera");
								
								var far = Math.max(modelBounds.max.x - modelBounds.min.x, modelBounds.max.y - modelBounds.min.y, modelBounds.max.z - modelBounds.min.z) * 5;
								
								maincamera.setOptics({
									type: 'perspective',
									far: far,
									near: far / 1000,
									aspect: jQuery(_this.canvas).width() / jQuery(_this.canvas).height(),
									fovy: 37.8493
								});
							}); // model bounds
							_this.asyncStream.addReadInt(function(nrObjects){
								_this.state.nrObjects = nrObjects;
								addReadObject(_this.asyncStream);
							});
						});
					});
					
					options.types.forEach(function(type){
						if(_this.visibleTypes.indexOf(options.groupId + '-' + type.toLowerCase()) == -1) {
							_this.visibleTypes.push(options.groupId + '-' + type.toLowerCase());
						}
					});

					_this.refreshMask();

					var library = _this.scene.findNode("library-" + options.groupId);
					if (library == null) {
						library = _this.scene.addNode({
							id: "library-" + options.groupId,
							type: "library"
						});
					}
					
					var msg = {
						longActionId: laid
					};
					
					_this.bimServerApi.setBinaryDataListener(function(data){
						_this.asyncStream.newData(data);
					});
					_this.bimServerApi.downloadViaWebsocket(msg);
					
				}
				var progressLoader = new BIMSURFER.ProgressLoader(_this.SYSTEM, _this.bimServerApi, laid, function(){}, done, false);
			});			
		});			
	},

	/**
	 * Shows an ifcType of a revision
	 *
	 * @param {String} typeName The name of the type to show
	 * @param {BIMSURFER.ProjectRevision instance} revision The revision
	 */
	showType: function(typeNames, revision) {
//		var _this = this;
//		var i = this.loadedProjects.indexOf(revision.project);
//		if(i == -1 || this.loadedProjects[i].loadedRevisions.indexOf(revision) == -1 || !revision.sceneLoaded) {
//			console.error('Revision Scene is not loaded yet.');
//			return;
//		}
//		var toLoad = [];
//		typeNames.forEach(function(typeName){
//			if(revision.ifcTypes.indexOf(typeName) == -1) {
//				console.error('Type does not exist in loaded revision: ', typeName);
//			} else if (revision.loadedTypes.indexOf(typeName) == -1) {
//				toLoad.push(typeName);
//			} else {
//				if(revision.visibleTypes.indexOf(typeName.toLowerCase()) > -1) {
//					return;
//				}
//				revision.visibleTypes.push(typeName.toLowerCase());
//				_this.refreshMask();
//			}
//		});
//		if (toLoad.length > 0) {
//			this.loadQueue.push({revision: revision, types: toLoad});
//			if(this.mode != 'loading' && this.mode != 'processing') {
//				this.loadGeometry();
//			}
//		}
	},

	/**
	 * Hides an ifcType of a revision.
	 *
	 * @param {String} typeName The name of the type to hide
	 * @param {BIMSURFER.ProjectRevision instance} revision The revision
	 */
	hideType: function(typeName, revision) {
		var i = revision.visibleTypes.indexOf(typeName.toLowerCase());
		if(i == -1) {
			return;
		}
		revision.visibleTypes.splice(i, 1);
		this.refreshMask();
	},

	/**
	 * Updates the mask filter of the viewer (shows/hides the ifcTypes)
	 */
	refreshMask: function() {
		var mask = new Array();
//		for(var i = 0; i < this.loadedProjects.length; i++) {
//			for(var x = 0; x < this.loadedProjects[i].loadedRevisions.length; x++) {
//				for(var y = 0; y < this.loadedProjects[i].loadedRevisions[x].visibleTypes.length; y++) {
//					mask.push(this.loadedProjects[i].oid + '-' + this.loadedProjects[i].loadedRevisions[x].oid + '-' + this.loadedProjects[i].loadedRevisions[x].visibleTypes[y].toLowerCase());
//				}
//			}
//		}

		this.visibleTypes.forEach(function(type){
			mask.push(type);
		});
		
		var tagMask = '^(' + mask.join('|') + ')$';
		this.scene.set('tagMask', tagMask);
		this.events.trigger('tagMaskUpdated');
	},

	/**
	 * Hides all the types of a revision
	 *
	 * @param {BIMSURFER.ProjectRevision} revision The revision to hide
	 */
	hideRevision: function(revision) {
		var visibleTypes = revision.visibleTypes.slice(0);
		for(var i = 0; i < visibleTypes.length; i++) {
			this.hideType(visibleTypes[i], revision);
		}
	},

	/**
	 * Shows a revision
	 *
	 * @param {BIMSURFER.ProjectRevision} revision The revision to show
	 * @param {Array} [types] The types to show (default = BIMSURFER.Constants.defaultTypes)
	 */
	showRevision: function(revision, types) {
		if(!BIMSURFER.Util.isset(types)) {
			types = new Array();
			for(var i = 0; i < revision.ifcTypes.length; i++) {
				if(BIMSURFER.Constants.defaultTypes.indexOf(revision.ifcTypes[i]) != -1) {
					types.push(revision.ifcTypes[i]);
				}
			}
		}

		this.showType(types, revision);
	}
});