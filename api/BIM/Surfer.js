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
	scene: null,
	sceneLoaded: false,
	loadQueue: null,
	visibleTypes: null,
	loadedProjects: null,
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
		this.loadQueue = new Array();
		this.visibleTypes = new Array();
		this.loadedProjects = new Array();
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
	   	if(light.CLASS.substr(0, 10) != 'BIM.Light.') return;

		var lights = this.scene.findNode('my-lights');

		if(Object.prototype.toString.call(light.lightObject) == '[object Array]')
		{
			for(var i = 0; i < light.lightObject.length; i++)
			{
				if(lights._core.lights.indexOf(light.lightObject[i]) == -1)
					lights._core.lights.push(light.lightObject[i]);
			}
			lights.setLights(lights._core.lights);
		}
		else
		{
			if(lights._core.lights.indexOf(light.lightObject) == -1)
			{
				lights._core.lights.push(light.lightObject);
				lights.setLights(lights._core.lights);
			}
		}

		light.setSurfer(this);
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
		return this.canvas;
	},

	initEvents: function()
	{
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
		this.events.register('mouseDown', function(e)
		{
			this.x = e.offsetX;
			this.y = e.offsetY;
		}, lastDown);
		this.events.register('mouseUp', function(e)
		{
			if(((e.offsetX > this.x) ? (e.offsetX - this.x < 5) : (this.x - e.offsetX < 5)) &&	((e.offsetY > this.y) ? (e.offsetY - this.y < 5) : (this.y - e.offsetY < 5)))
				this.scene.pick(this.x, this.y, {rayPick: true});
		}, lastDown);

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
				var optics = this.scene.findNode('main-camera').get('optics');
				optics['aspect'] = $(this.canvas).width() / $(this.canvas).height();
				this.scene.findNode('main-camera').set('optics', optics);

				this.scene.set('tagMask', '^()$');

				this.initEvents();
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

	loadGeometry: function()
	{
   		if (this.loadQueue.length == 0)
		{
			this.mode = "done";
			BIM.events.trigger('progressChanged', [100]);
			BIM.events.trigger('progressMessageChanged', ['Downloading complete']);
			BIM.events.trigger('progressDone');
		  	return;
		}

		var load = this.loadQueue[0];

		if(this.loadedProjects.indexOf(load.project) == -1) {
			this.loadedProjects.push(load.project);
		}

		BIM.events.trigger('progressStarted', ['Loading Geometry']);
		var roid = load.project.lastRevisionId;
		var _this = this;

		BIM.events.trigger('progressChanged', [0]);
		BIM.events.trigger('progressMessageChanged', "Loading " + load.type);

		var params =
		{
				roid: roid,
				serializerOid: this.server.getSerializer('org.bimserver.geometry.json.JsonGeometrySerializerPlugin').oid,
				downloadQueue: this.loadQueue,
				load: load,
				project: load.project
		}

		this.server.server.call("Bimsie1ServiceInterface", "downloadByTypes",
			{
				roids : [ roid ],
				classNames : [ load.type ],
				serializerOid : this.server.getSerializer('org.bimserver.serializers.binarygeometry.BinaryGeometrySerializerPlugin').oid,
				includeAllSubtypes : false,
				useObjectIDM : false,
				sync : false,
				deep: true
			},
	   		function(laid)
			{
				params.laid = laid;
				var step = function(params, state, progressLoader) { BIM.events.trigger('progressChanged', [state.progress]); }
				var done = function(params, state, progressLoader)
				{
				 	if(_this.mode != 'loading') return;
					_this.mode = "processing";
					BIM.events.trigger('progressChanged', [100]);
					progressLoader.unregister();

					var url = _this.server.server.generateRevisionDownloadUrl({
						serializerOid : params.serializerOid,
						laid : params.laid
					});

					var onSuccess = function(data) {
						BIM.events.trigger('progressDone');

						if(_this.scene.data.ifcTypes.indexOf(params.project.oid + '-' + load.type.toLowerCase()) == -1) {
							_this.scene.data.ifcTypes.push(params.project.oid + '-' + load.type.toLowerCase());
						}
						if(_this.visibleTypes.indexOf(params.project.oid + '-' + load.type.toLowerCase()) == -1) {
							_this.visibleTypes.push(params.project.oid + '-' + load.type.toLowerCase());
						}

						_this.refreshMask();

						var typeNode =
						{
							type: 'tag',
							tag: params.project.oid + '-' + load.type.toLowerCase(),
							id: params.project.oid + '-' + load.type.toLowerCase(),
							nodes: []
						};

						params.project.loadedTypes.push(load.type);
						for(var i = 0; i < _this.loadQueue.length; i++){
							if(load === _this.loadQueue[i]) {
								_this.loadQueue.splice(i, 1);
								break;
							}
						}

						params.downloadQueue = params.downloadQueue.slice(1)
					  	_this.loadGeometry();

						var dataInputStream = new DataInputStream(data);
						var start = dataInputStream.readUTF8();
						var library = _this.scene.findNode("library");
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
				var progressLoader = new BIM.ProgressLoader(_this.server.server, laid, step, done, params, false);
			});
	},

	showLayer: function(layerName, project) {

		if(project.ifcTypes.indexOf(layerName) == -1) {
			console.error('Layer does not exist in loaded model(s): ', layerName);
			return;
		}

		if(project.loadedTypes.indexOf(layerName) == -1) {
			this.loadQueue.push({project: project, type: layerName});
			if(this.mode != 'loading' && this.mode != 'processing') {
				this.loadGeometry();
			}
		} else if(this.visibleTypes.indexOf(project.oid + '-' + layerName.toLowerCase()) == -1) {
			this.visibleTypes.push(project.oid + '-' + layerName.toLowerCase());
			this.refreshMask();
		}
	},

	hideLayer: function(layerName, project) {
		var i = this.visibleTypes.indexOf(project.oid + '-' + layerName.toLowerCase());
		if(i == -1) {
			return;
		}

		this.visibleTypes.splice(i, 1);
		this.refreshMask();
	},

	refreshMask: function() {
		var tagMask = '^(' + this.visibleTypes.join('|') + ')$';
		this.scene.set('tagMask', tagMask);
	}

});