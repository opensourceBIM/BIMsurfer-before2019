"use strict"

/**
 * Class: BIMSURFER.Viewer
 * The viewer can load and show the BIM Models.
 */
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
	__construct: function(div, options, autoStart) {
		if(typeof div == 'string') {
			div = jQuery('div#' + div)[0];
		}

		if(!jQuery(div).is('div')) {
			console.error('BIMSURFER: Can not find div element');
			return;
		}
		if(typeof options == 'undefined') {
			options = {};
		}

		this.SYSTEM = this;
		this.div = div;
		this.events = new BIMSURFER.Events(this);
		this.connectedServers = new Array();
		this.controls = new Array();
		if(typeof options.controls == 'undefined') {
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
		if(typeof this.controls[control.CLASS] == 'undefined') {
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
	 * @param {Numver} height The new height in px
	 */
	resize: function(width, height) {
		if(this.canvas) {
			$(this.canvas).width(width).height(height);
			if(typeof this.canvas[0] != 'undefined') {
				this.canvas[0].width = width;
				this.canvas[0].height = height;
			}
		}

		if(this.scene !== null) {
			var optics = this.scene.findNode('main-camera').get('optics');
			optics['aspect'] = $(this.canvas).width() / $(this.canvas).height();
			this.scene.findNode('main-camera').set('optics', optics);
		}
	},

	/**
	 * Draws the HTML5 canvas element
	 *
	 * @return The canvas element
	 */
	drawCanvas: function() {
		var width = $(this.div).width();
		var height = $(this.div).height();
		if(!(width > 0 && height > 0)) {
			return;
		}

		if($(this.canvas).length == 1) {
			$(this.canvas).remove();
		}

		$(this.div).empty();

		this.canvas = $('<canvas />')
							.attr('id', $(this.div).attr('id') + "-canvas")
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
	loadScene: function(revision, options) {

		if(typeof options != 'object') {
			options = {};
		}
		if(typeof revision.scene != 'object') {
			console.error('No scene in revision');
			return;
		}
		var scene = revision.scene;

		if(this.scene == null) {
			try {
				this.drawCanvas();
				scene.canvasId = $(this.canvas).attr('id');
				scene.id = scene.canvasId;

				if(!BIMSURFER.Util.isArray(scene.nodes)) {
					console.error('No nodes array in scene');
					return;
				}

				for(var i = 0; i < scene.nodes.length; i++) {
					if(scene.nodes[i].type == 'library') {
						scene.nodes[i].id += '-' + revision.project.oid + '-' + revision.oid;
						break;
					}
				}

				scene.nodes.push({
					type: 'lookAt',
					id: 'main-lookAt',
					eye: (typeof options.eye == 'object' ? options.eye : { x: scene.data.bounds[0] * 1.5, y: scene.data.bounds[1] * 1.5, z: scene.data.bounds[2] * 1.5 }),
					look: (typeof options.look == 'object' ? options.look : { x: 0.0, y: 0.0, z: 0.0 }),
					up: (typeof options.up == 'object' ? options.up : { x: 0.0, y: 0.0, z: 1.0 }),
					nodes: [{
							type: 'camera',
							id: 'main-camera',
							optics: {
								type: 'perspective',
								far: (typeof options.far == 'number' ? options.far : Math.sqrt(scene.data.bounds[0] * scene.data.bounds[0] + scene.data.bounds[1] * scene.data.bounds[1] + scene.data.bounds[2] * scene.data.bounds[2]) * 6),
								near: (typeof options.near == 'number' ? options.near : Math.sqrt(scene.data.bounds[0] * scene.data.bounds[0] + scene.data.bounds[1] * scene.data.bounds[1] + scene.data.bounds[2] * scene.data.bounds[2]) * 0.001),
								aspect: (typeof options.aspect ==  'number' ? options.aspect : $(this.canvas).width() / $(this.canvas).height()),
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
				});

				this.scene = SceneJS.createScene(scene);
				if(this.scene != null) {
					this.scene.set('tagMask', '^()$');

					this.initEvents();
					this.sceneLoaded = true;
					if(this.loadedProjects.indexOf(revision.project) == -1) {
						this.loadedProjects.push(revision.project);
					}
					if(revision.project.loadedRevisions.indexOf(revision) == -1) {
						revision.project.loadedRevisions.push(revision);
					}

					for(var i = 0; i < this.lights.length; i++) {
						this.lights[i].activate();
					}

					this.events.trigger('sceneLoaded', [this.scene]);
					return this.scene;
				}
			}
			catch (error) {
				console.error('loadScene: ', error, error.stack, this, arguments);
				console.debug('loadScene ERROR', error, error.stack, this, arguments);
			}
		}
		else
		{
			$.extend(this.scene.data.properties, scene.data.properties);

			for(var i = 0; i < scene.nodes.length; i++) {
				if(scene.nodes[i].type == 'library') {
					scene.nodes[i].id += '-' + revision.project.oid + '-' + revision.oid;
					this.scene.addNode(scene.nodes[i]);
					break;
				}
			}

			var camera = this.scene.findNode('main-camera');
			var optics = camera.getOptics();
			var far = (typeof options.far == 'number' ? options.far : Math.sqrt(scene.data.bounds[0] * scene.data.bounds[0] + scene.data.bounds[1] * scene.data.bounds[1] + scene.data.bounds[2] * scene.data.bounds[2]) * 6);
			var near = (typeof options.near == 'number' ? options.near : Math.sqrt(scene.data.bounds[0] * scene.data.bounds[0] + scene.data.bounds[1] * scene.data.bounds[1] + scene.data.bounds[2] * scene.data.bounds[2]) * 0.001);

			if(far != optics.far || near != optics.near)
			{
				optics.far = far;
				optics.near = near;
			  	camera.setOptics(optics);
			}
			if(this.loadedProjects.indexOf(revision.project) == -1) {
				this.loadedProjects.push(revision.project);
			}
			if(revision.project.loadedRevisions.indexOf(revision) == -1) {
				revision.project.loadedRevisions.push(revision);
			}
			this.events.trigger('sceneReloaded', [this.scene]);
			return this.scene;
		}
		return null;
	},

	/**
	 * Loads and shows the geometry of the revisions that are in the load queue
	 */
	loadGeometry: function() {
   		if (this.loadQueue.length == 0) {
			this.mode = "done";
			this.SYSTEM.events.trigger('progressChanged', [100]);
			this.SYSTEM.events.trigger('progressMessageChanged', ['Downloading complete']);
			this.SYSTEM.events.trigger('progressDone');
		  	return;
		}
		this.mode = 'loading';

		var load = this.loadQueue[0];

		if(typeof load.revision != 'object') {
			params.downloadQueue = params.downloadQueue.slice(1)
			_this.loadGeometry();
			return;
		}

		this.SYSTEM.events.trigger('progressStarted', ['Loading Geometry']);
		var _this = this;

		this.SYSTEM.events.trigger('progressChanged', [0]);
		this.SYSTEM.events.trigger('progressMessageChanged', "Loading " + load.type);

		var params = {
				roid: load.revision.oid,
				serializerOid: load.revision.project.server.getSerializer('org.bimserver.geometry.json.JsonGeometrySerializerPlugin').oid,
				downloadQueue: this.loadQueue,
				load: load,
				revision: load.revision
		};
		load.revision.project.server.server.call("Bimsie1ServiceInterface", "downloadByTypes", {
				roids : [ load.revision.oid ],
				classNames : [ load.type ],
				serializerOid : load.revision.project.server.getSerializer('org.bimserver.serializers.binarygeometry.BinaryGeometrySerializerPlugin').oid,
				includeAllSubtypes : false,
				useObjectIDM : false,
				sync : false,
				deep: true
			},
	   		function(laid) {
				params.laid = laid;
				var step = function(params, state, progressLoader) {
					_this.SYSTEM.events.trigger('progressChanged', [state.progress]);
				}
				var done = function(params, state, progressLoader) {
				 	if(_this.mode != 'loading') {
				 		return;
					}
					_this.mode = "processing";
					_this.SYSTEM.events.trigger('progressChanged', [100]);
					progressLoader.unregister();

					var url = load.revision.project.server.server.generateRevisionDownloadUrl({
						serializerOid : params.serializerOid,
						laid : params.laid
					});

					var onSuccess = function(data) {
						_this.SYSTEM.events.trigger('progressDone');
						params.revision.loadedTypes.push(load.type);

						if(_this.scene.data.ifcTypes.indexOf(params.revision.project.oid + '-' + params.revision.oid + '-' + load.type.toLowerCase()) == -1) {
							_this.scene.data.ifcTypes.push(params.revision.project.oid + '-' + params.revision.oid + '-' + load.type.toLowerCase());
						}
					 /*	if(_this.visibleTypes.indexOf(params.revision.project.oid + '-' + params.revision.oid + '-' + load.type.toLowerCase()) == -1) {
							_this.visibleTypes.push(params.revision.project.oid + '-' + params.revision.oid + '-' + load.type.toLowerCase());
						} */

						//_this.refreshMask();
						_this.showType(load.type, params.revision);

						var typeNode =  {
							type: 'tag',
							tag: params.revision.project.oid + '-' + params.revision.oid + '-' + load.type.toLowerCase(),
							id: params.revision.project.oid + '-' + params.revision.oid + '-' + load.type.toLowerCase(),
							nodes: []
						};

						for(var i = 0; i < _this.loadQueue.length; i++){
							if(load === _this.loadQueue[i]) {
								_this.loadQueue.splice(i, 1);
								break;
							}
						}

						params.downloadQueue = params.downloadQueue.slice(1);
					  	_this.loadGeometry();

						var dataInputStream = new BIMSURFER.DataInputStreamReader(this, data);
						var start = dataInputStream.readUTF8();
						var library = _this.scene.findNode("library-" + params.revision.project.oid + '-' + params.revision.oid);
						var bounds = _this.scene.data.bounds2;

						if (start == "BGS") {
							var version = dataInputStream.readByte();
							if (version == 3) {
								var boundsX = {
									min: {x: dataInputStream.readFloat(), y: dataInputStream.readFloat(), z: dataInputStream.readFloat()},
									max: {x: dataInputStream.readFloat(), y: dataInputStream.readFloat(), z: dataInputStream.readFloat()}
								};
								var nrObjects = dataInputStream.readInt();
								for (var o=0; o<nrObjects; o++) {
									var geometry = {
										type: "geometry",
										primitive: "triangles"
									};

									var materialName = dataInputStream.readUTF8();
									var type = dataInputStream.readUTF8();

									geometry.coreId = dataInputStream.readLong();

									dataInputStream.align4();

									var objectBounds = {
										min: {x: dataInputStream.readFloat(), y: dataInputStream.readFloat(), z: dataInputStream.readFloat()},
										max: {x: dataInputStream.readFloat(), y: dataInputStream.readFloat(), z: dataInputStream.readFloat()}
									};
									geometry.nrindices = dataInputStream.readInt();
									var nrVertices = dataInputStream.readInt();
									geometry.positions = dataInputStream.readFloatArray(nrVertices);
									var nrNormals = dataInputStream.readInt();
									geometry.normals = dataInputStream.readFloatArray(nrNormals);

									var material = {
										type : "material",
										coreId : materialName + "Material",
										nodes : [ {
											id : geometry.coreId,
											type : "name",
											nodes : [  ]
										} ]
									};

									for (var i = 0; i < geometry.positions.length; i += 3) {
										geometry.positions[i] = geometry.positions[i] - bounds[0];
										geometry.positions[i + 1] = geometry.positions[i + 1] - bounds[1];
										geometry.positions[i + 2] = geometry.positions[i + 2] - bounds[2];
									}
									geometry.indices = [];
									for (var i = 0; i < geometry.nrindices; i++) {
										geometry.indices.push(i);
									}
									library.add("node", geometry);
									material.nodes[0].nodes.push({
										type: "geometry",
										coreId: geometry.coreId
									});

									var flags = {
										type : "flags",
										flags : {
											transparent : true
										},
										nodes : [ material ]
									};
									typeNode.nodes.push(flags);
								}
							}
						}
						_this.scene.findNode("my-lights").add("node", typeNode);
					}

					var oReq = new XMLHttpRequest();
					oReq.open("GET", url, true);
					oReq.responseType = "arraybuffer";

					oReq.onload = function (oEvent) {
					  var arrayBuffer = oReq.response;
					  if (arrayBuffer) {
						  onSuccess(arrayBuffer);
					  }
					};

					oReq.send(null);
				}
				_this.mode = 'loading';
				var progressLoader = new BIMSURFER.ProgressLoader(_this.SYSTEM, load.revision.project.server.server, laid, step, done, params, false);
			});
	},

	/**
	 * Shows an ifcType of a revision
	 *
	 * @param {String} typeName The name of the type to show
	 * @param {BIMSURFER.ProjectRevision instance} revision The revision
	 */
	showType: function(typeName, revision) {
		var i = this.loadedProjects.indexOf(revision.project);
		if(i == -1 || this.loadedProjects[i].loadedRevisions.indexOf(revision) == -1 || !revision.sceneLoaded) {
			console.error('Revision Scene is not loaded yet.');
			return;
		}
		if(revision.ifcTypes.indexOf(typeName) == -1) {
			console.error('Type does not exist in loaded revision: ', typeName);
			return;
		}

		if(revision.loadedTypes.indexOf(typeName) == -1) {
			this.loadQueue.push({revision: revision, type: typeName});
			if(this.mode != 'loading' && this.mode != 'processing') {
				this.loadGeometry();
			}
		} else {
			if(revision.visibleTypes.indexOf(typeName.toLowerCase()) > -1) {
				return;
			}
			revision.visibleTypes.push(typeName.toLowerCase());
			this.refreshMask();
		}
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
		for(var i = 0; i < this.loadedProjects.length; i++) {
			for(var x = 0; x < this.loadedProjects[i].loadedRevisions.length; x++) {
				for(var y = 0; y < this.loadedProjects[i].loadedRevisions[x].visibleTypes.length; y++) {
					mask.push(this.loadedProjects[i].oid + '-' + this.loadedProjects[i].loadedRevisions[x].oid + '-' + this.loadedProjects[i].loadedRevisions[x].visibleTypes[y].toLowerCase());
				}
			}
		}

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
		if(typeof types == 'undefined') {
			types = new Array();
			for(var i = 0; i < revision.ifcTypes.length; i++) {
				if(BIMSURFER.Constants.defaultTypes.indexOf(revision.ifcTypes[i]) != -1) {
					types.push(revision.ifcTypes[i]);
				}
			}
		}

		for(var i = 0; i < types.length; i++) {
			this.showType(types[i], revision);
		}
	}
});