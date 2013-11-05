"use strict"
BIM.Surfer = BIM.Class(
{
	CLASS: 'Bim.Surfer',
	div: null,
	mode: null,
	canvas: null,
	server: null,
	events: null,
	controls: null,
	lights: null,
	scene: null,
	sceneLoaded: false,
	camera: null,
	lookAt: null,
	loadedTypes: null,
	//propertyValues
	scalefactor: 0,
	viewfactor: 0,
	boundfactor: 0,
//	selectedObj: 'emtpy Selection',
//	mouseRotate: 0,
//	oldZoom: 15,
//	autoLoadPath: "",


	__construct: function(div, server)
	{
		if(typeof div == 'string')
			div = jQuery('div#' + div)[0];


		if(!jQuery(div).is('div'))
		{
			console.error('BIMSURFER: Can not find div element');
			return;
		}
		if(server.CLASS != 'BIM.Server')
		{
			console.error('BIMSURFER: No server given');
			return;
		}

		this.div = div;
		this.server = server;
		this.events = new BIM.Events(this);
		this.controls = new Array();
		this.lights =
		{
			type: 'lights',
			id: 'myLights',
			lights: new Array()
		};
		this.loadedTypes = new Array();

		this.camera = 	{ distanceLimits : new Array(0.0, 0.0) };
		this.lookAt = 	{
					   		defaultParameters :
					 		{
					 			look :
					 			{
									x : 0.0,
									y : 0.0,
									z : 0.0
								},
								eye :
								{
									x : 10.0,
									y : 10.0,
									z : 10.0
								},
								up :
								{
									x : 0.0,
									y : 0.0,
									z : 1.0
								}
					   		},
							currentParameters:
							{
					 			look :
					 			{
									x : 0.0,
									y : 0.0,
									z : 0.0
								},
								eye :
								{
									x : 10.0,
									y : 10.0,
									z : 10.0
								},
								up :
								{
									x : 0.0,
									y : 0.0,
									z : 1.0
								}
							}
						};
	// Variables for BPI.MOST Features (TU Vienna)
	this.scalefactor = 0;
	this.viewfactor = 0;
	this.boundfactor = 0;
//	this.selectedObj = 'emtpy Selection';
//	this.mouseRotate = 0;
//	this.oldZoom = 15;
//	this.autoLoadPath = "";
	},

	setProgress: function(perc)
	{
		if(typeof this.controls['BIM.Control.ProgressBar'] == 'undefined') return;
		for(var i = 0; i < this.controls['BIM.Control.ProgressBar'].length; i++)
		{
			this.controls['BIM.Control.ProgressBar'][i].animateProgress(perc);
		}
	},
	setProgressMessage: function(message)
	{
		if(typeof this.controls['BIM.Control.ProgressBar'] == 'undefined') return;
		for(var i = 0; i < this.controls['BIM.Control.ProgressBar'].length; i++)
		{
			this.controls['BIM.Control.ProgressBar'][i].changeMessage(message);
		}
	},
	hideProgress: function()
	{
		if(typeof this.controls['BIM.Control.ProgressBar'] == 'undefined') return;
		for(var i = 0; i < this.controls['BIM.Control.ProgressBar'].length; i++)
		{
			this.controls['BIM.Control.ProgressBar'][i].hide('fast');
		}
	},
	showProgress: function()
	{
		if(typeof this.controls['BIM.Control.ProgressBar'] == 'undefined') return;
		for(var i = 0; i < this.controls['BIM.Control.ProgressBar'].length; i++)
		{
			this.controls['BIM.Control.ProgressBar'][i].show('fast');
		}
	},

	addControl: function(control)
	{
		if(typeof this.controls[control.CLASS] == 'undefined') this.controls[control.CLASS] = new Array();

		if(this.controls[control.CLASS].indexOf(control) == -1)
			this.controls[control.CLASS].push(control);

		control.setSurfer(this);
	},
	addLight: function(light)
	{
	   /*	if(light.CLASS.substr(0, 10) != 'BIM.Light.') return;

		if(typeof this.lights._engine == 'undefined')
		{
			this.scene.findNode('main-renderer').addNode(this.lights);
			this.lights = this.scene.findNode('myLights');
		}

		if(this.lights._core.lights.indexOf(light) == -1)
		{
			this.lights._core.lights.push(light);
			this.lights.setLights(this.lights._core.lights);
		}

		light.setSurfer(this);
		light.activate(); */
	},
	drawCanvas: function()
	{
		var width = $(this.div).width();
		var height = $(this.div).height();
		if(!(width > 0 && height > 0)) return;

		if($(this.canvas).length == 1) $(this.canvas).remove();

		this.canvas = $('<canvas />')
							.attr('id', $(this.div).attr('id') + "-canvas")
							.attr('width', width)
							.attr('height', height)
							.html('<p>This application requires a browser that supports the <a href="http://www.w3.org/html/wg/html5/">HTML5</a> &lt;canvas&gt; feature.</p>')
							.addClass(this.CLASS.replace(/\./g,"-"))
							.appendTo(this.div);
		this.initEvents();
		return this.canvas;
	},

	initEvents: function()
	{
		var _this = this;
		$(this.canvas)
			.on('mousedown', function(e)
			{
				_this.events.trigger('mouseDown', [e]);
				})
			.on('mouseup', function(e){ _this.events.trigger('mouseUp', [e]); })
			.on('mousemove', function(e){ _this.events.trigger('mouseMove', [e]); })
			.on('scroll', function(e){ _this.events.trigger('mouseWheel', [e]); })
			.on('touchstart', function(e){ _this.events.trigger('touchStart', [e]); })
			.on('touchmove', function(e){ _this.events.trigger('touchMove', [e]); })
			.on('touchend', function(e){ _this.events.trigger('touchEnd', [e]); });
	},

	loadScene: function(scene)
	{
		if(this.scene != null)
		{
			this.scene.destroy();
			this.events.trigger('sceneUnloaded', [this.scene]);
			this.sceneLoaded = false;
			this.scene = null;
		}

		try
		{
			this.drawCanvas();
			scene.canvasId = $(this.canvas).attr('id');
			this.scene = SceneJS.createScene(scene);
			if(this.scene != null)
			{
				this.sceneInit();
				this.scene.start({idleFunc: SceneJS.FX.idle});


				// Calculate Scalefactor
				var unit = this.scene.data.unit;
				var bounds = this.scene.data.bounds;

				// to decide which side is used to set view in setViewToObject
				if(bounds[0] > bounds[1])
					this.boundfactor = 1; // for setView to decide the main viewside

				this.scalefactor = parseFloat(unit);

				// setting viewfactor for different views
				this.viewfactor = SceneJS_math_lenVec3(bounds);

				this.events.trigger('sceneLoaded', [this.scene]);
				this.sceneLoaded = true;
				return this.scene;
			}
		}
		catch (error)
		{
			console.error('loadScene: ', error.stack, this, arguments);
			console.debug('loadScene ERROR', error.stack, this, arguments);
		}
		return null;
	},

	sceneInit: function()
	{
		var optics = this.scene.findNode('main-camera').get('optics');
		optics['aspect'] = $(this.canvas).width() / $(this.canvas).height();
		this.scene.findNode('main-camera').set('optics', optics);

		var sceneDiameter = SceneJS_math_lenVec3(this.scene.data.bounds);
		this.camera.distanceLimits = new Array(sceneDiameter * 0.1, sceneDiameter * 2.0);

		var tags = new Array();
		var ifcTypes = this.scene.data.ifcTypes
		for(var i = 0; i < ifcTypes.length; i++)
		{
			tags.push(ifcTypes[i].toLowerCase());
		}

		this.scene.set('tagMask', '^(' + (tags.join('|')) + ')$');
		this.lookAt.defaultParameters.eye = this.scene.findNode('main-lookAt').get('eye');
		this.lookAt.defaultParameters.look = this.scene.findNode('main-lookAt').get('look');
		this.lookAt.defaultParameters.up = this.scene.findNode('main-lookAt').get('up');
	},

	loadGeometry: function(project, typesToLoad)
	{
		this.showProgress();
		var roid = project.lastRevisionId
		var _this = this;
		if(typeof typesToLoad == 'undefined')
			typesToLoad = BIM.Constants.defaultTypes;

   		if (typesToLoad.length == 0)
		{
			this.mode = "done";
		   	this.setProgress(100);
			this.setProgressMessage('Downloading complete');
			this.hideProgress();
		  	return;
		}

	  	_this.setProgress(0);
		_this.setProgressMessage("Loading " + typesToLoad[0]);

		var params =
		{
				roid: roid,
				serializerOid: this.server.getSerializer('org.bimserver.geometry.json.JsonGeometrySerializerPlugin').oid,
				downloadQueue: typesToLoad,
				project: project
		}


		this.server.server.call("Bimsie1ServiceInterface", "downloadByTypes",
			{
				roids : [ roid ],
				classNames : [ typesToLoad[0] ],
				serializerOid : this.server.getSerializer('org.bimserver.geometry.json.JsonGeometrySerializerPlugin').oid,
				includeAllSubtypes : false,
				useObjectIDM : false,
				sync : false,
				deep: true
			},
	   		function(laid)
			{
				params.laid = laid;
				var step = function(params, state, progressLoader) { _this.setProgress(state.progress); }
				var done = function(params, state, progressLoader)
				{
				 	if(_this.mode != 'loading') return;
					_this.mode = "processing";
					_this.setProgress(90);
					progressLoader.unregister();

					var url = _this.server.server.generateRevisionDownloadUrl({
						serializerOid : params.serializerOid,
						laid : params.laid
					});

					$.getJSON(url, function(data)
					{
				   		_this.setProgress(100);
						_this.loadedTypes.push(params.downloadQueue[0]);

					  	_this.loadGeometry(params.project, params.downloadQueue.slice(1));
						var typeNode =
						{
							type: 'tag',
							tag: params.downloadQueue[0].toLowerCase(),
							id: params.downloadQueue[0].toLowerCase(),
							nodes: []
						};

						var library = _this.scene.findNode("library");
						var bounds = _this.scene.data.bounds2;

						data.geometry.forEach(function(geometry)
						{
							var material =
							{
								type : "material",
								coreId : geometry.material + "Material",
								nodes : [
								{
									id : geometry.coreId,
									type : "name",
									nodes : new Array()
								}]
							};

							if (geometry.nodes != null)
							{
								geometry.nodes.forEach(function(node)
								{
									if (node.positions != null)
									{
										for (var i = 0; i < node.positions.length; i += 3)
										{
											node.positions[i] = node.positions[i] - bounds[0];
											node.positions[i + 1] = node.positions[i + 1] - bounds[1];
											node.positions[i + 2] = node.positions[i + 2] - bounds[2];
										}
										node.indices = new Array();
										for (var i = 0; i < node.nrindices; i++)
										{
											node.indices.push(i);
										}
										library.add("node", node);
										material.nodes[0].nodes.push(
										{
											type: "geometry",
											coreId: node.coreId
										});
									}
								});
							}
							else
							{
								if (geometry.positions != null)
								{
									for (var i = 0; i < geometry.positions.length; i += 3)
									{
										geometry.positions[i] = geometry.positions[i] - bounds[0];
										geometry.positions[i + 1] = geometry.positions[i + 1] - bounds[1];
										geometry.positions[i + 2] = geometry.positions[i + 2] - bounds[2];
									}
									geometry.indices = [];
									for (var i = 0; i < geometry.nrindices; i++)
									{
										geometry.indices.push(i);
									}
									library.add("node", geometry);
									material.nodes[0].nodes.push(
									{
										type: "geometry",
										coreId: geometry.coreId
									});
								}
							}
							var flags =
							{
								type : "flags",
								flags : { transparent : true },
								nodes : [ material ]
							};

							typeNode.nodes.push(flags);
						});
						_this.scene.findNode("my-lights").add("node", typeNode);
					});
				}
				_this.mode = 'loading';
				var progressLoader = new BIM.ProgressLoader(_this.server.server, laid, step, done, params, false);
			});
	}

});