"use strict"
BIM.Surfer = BIM.Class(
{

	var _this = this;
	this.__construct(div)
	{
		this.div = (typeof div == "string" ? $('#' + div) : div);
		if($(this.div).length != 1) return null;
	}

	this.canvas    	  		= null;
	this.timeoutTime  		= 3000;
	this.bimServer	  		= null;
	this.mode 				= "none";

	this.projects	  		= new Array();
	this.loadedTypes   		= new Array();

	// Variables for BPI.MOST Features (TU Vienna)
	this.propertyValues = {
		scalefactor : 0,
		viewfactor : 0,
		selectedObj : 'emtpy Selection',
		mouseRotate : 0,
		oldZoom : 15,
		boundfactor : 0,
		autoLoadPath : ""
	};

	this.scene		  		= null;
	this.camera				= {distanceLimits : [ 0.0, 0.0 ]};
	this.lookAt				=	{
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
							   		}
								};
	this.defaultTypes =
	[
		"IfcColumn",
		"IfcStair",
		"IfcSlab",
		"IfcWindow",
		"IfcDoor",
		"IfcBuildingElementProxy",
		"IfcWallStandardCase",
		"IfcWall",
		"IfcBeam",
		"IfcRailing",
		"IfcProxy",
		"IfcRoof"
	];

	this.controls = new Array();
	this.addControl = function(control)
	{
		if(this.controls.indexOf(control) != -1) return false;
		control.setViewer(this);
		control.activate();
		return true;
	}
	this.removeControl = function(control)
	{
		if(this.controls.indexOf(control) == -1) return false;
		control.deactivate();
		control.removeFromViewer();
	}

	this.typeDownloadQueue	= new Array();
	this.currentAction		= {};

	this.events		  		=	{
									unloadScene: new Array(),
									layerAdded: new Array(),
									layerRemoved: new Array()
								};

	this.Progress

	this.progressListeners	= new Array();

	this.addProgressListener = function(listener)
	{
		if(this.progressListeners.indexOf(listener) == -1)
			this.progressListeners.push(listener);
	}
	this.progressMessage = '';
	this.
	this.setProgress = function(percent)
	{
		for(var i in this.progressListeners)
			this.progressListeners[i](percent, this.progressMessage);
	}
	this.setProgressMessage = function(message)
	{
		this.progressMessage = message;
	}

	this.bindEvent = function(event, callback)
	{
		if(!$.isArray(this.events[event]))
			this.events[event] = new Array();

		this.events[event].push(callback);
	}
	this.fireEvent = function(event, data)
	{
		if($.isArray(this.events[event]))
		{
			for(var i in this.events[event])
			{
				if(typeof this.events[event][i] == 'function')
			   		this.events[event][i](data);
			}
		}
	}
	this.unbindEvent = function(event, callback)
	{
		if(!$.isArray(this.events[event]))
			return;

		if(typeof callback != 'undefined')
		{
			if(this.events[event].indexOf(callback) > -1)
				this.events[event][this.events[event].indexOf(callback)] = null;
		}
		else
		{
			this.events[event] = new Array();
		}

	}

	this.log = function(log)
	{
		console.debug(log);
	}


	SceneJS.FX = {};

	SceneJS.FX.Tween = {};

	SceneJS.FX.TweenSpline = (function() {
		var TweenSpline, _dt, _intervalID, _r, _tick, _tweens;
		TweenSpline = (function() {

			function TweenSpline(lookAtNode, play) {
				this._target = lookAtNode;
				this._sequence = [];
				this._timeline = [];
				this._play = play != null ? play : true;
				this._t = 0.0;
			}

			TweenSpline.prototype.tick = function(dt) {
				if (this._play)
					return this._t += dt;
			};

			TweenSpline.prototype.start = function(lookAt) {
				this._sequence = [ lookAt != null ? lookAt : {
					eye : this._target.get('eye'),
					look : this._target.get('look'),
					up : this._target.get('up')
				} ];
				this._timeline = [ 0.0 ];
				return this._t = 0.0;
			};

			TweenSpline.prototype.push = function(lookAt, dt) {
				var dt_prime;
				if (this._sequence.length === 0)
					this._t = 0.0;
				dt_prime = dt != null ? dt : 5000;
				if (this._timeline.length === 0)
					dt_prime = 0.0;
				this._timeline.push(this.totalTime() + dt_prime);
				return this._sequence.push(lookAt);
			};

			TweenSpline.prototype.sequence = function(lookAts, dt) {
				var dt_prime, lookAt, _i, _len;
				if (this._sequence.length === 0)
					this._t = 0.0;
				for (_i = 0, _len = lookAts.length; _i < _len; _i++) {
					lookAt = lookAts[_i];
					dt_prime = dt != null ? dt : 800; // speedfactor of
					// playing sequences
					if (this._timeline.length === 0)
						dt_prime = 0.0;
					this._timeline.push(this.totalTime() + dt_prime);
					this._sequence.push(lookAt);
				}
				return null;
			};

			TweenSpline.prototype.pause = function() {
				return this._play = false;
			};

			TweenSpline.prototype.play = function() {
				return this._play = true;
			};

			TweenSpline.prototype.totalTime = function() {
				if (this._timeline.length > 0) {
					return this._timeline[this._timeline.length - 1];
				}
				return 0;
			};

			TweenSpline.prototype.update = function() {
				var dt, i;
				if (this._sequence.length === 0)
					return false;
				if (!this._play)
					return true;
				if (this._t >= this.totalTime() || this._sequence.length === 1) {
					this._target.set(this._sequence[this._sequence.length - 1]);
					return false;
				}
				i = 0;
				while (this._timeline[i] <= this._t) {
					++i;
				}
				dt = this._timeline[i] - this._timeline[i - 1];
				_this.lerpLookAtNode(this._target, (this._t - this._timeline[i - 1]) / dt, this._sequence[i - 1], this._sequence[i]);
				return true;
			};

			return TweenSpline;

		})();
		_tweens = [];
		_intervalID = null;
		_dt = 0;
		_tick = function() {
			var tween, _i, _len;
			for (_i = 0, _len = _tweens.length; _i < _len; _i++) {
				tween = _tweens[_i];
				tween.tick(_dt);
			}
			return null;
		};
		_r = function(lookAtNode, interval) {
			var tween;
			_dt = interval || 50;
			if (_intervalID !== null)
				clearInterval(_intervalID);
			_intervalID = setInterval(_tick, _dt);
			tween = new TweenSpline(lookAtNode);
			_tweens.push(tween);
			return tween;
		};
		_r.update = function() {
			var i, tween, _results;
			i = 0;
			_results = [];
			while (i < _tweens.length) {
				tween = _tweens[i];
				if (!tween.update()) {
					_results.push(_tweens.splice(i, 1));
				} else {
					_results.push(i += 1);
				}
			}
			return _results;
		};
		return _r;
	})();

	SceneJS.FX.idle = function() {
		SceneJS.FX.TweenSpline.update();
		return null;
	};






	this.drawCanvas = function()
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
							.appendTo(this.div);
		return this.canvas;
	}





	this.connect = function(serverUrl, successCallback, errorCallback)
	{
		if(typeof successCallback != 'function') successCallback = function(){};
		if(typeof errorCallback != 'function') errorCallback = function(error){};

		serverUrl = (serverUrl.substr(-1) == '/' ? serverUrl.substr(0, serverUrl.length - 1) : serverUrl);
		var success = false;

		$.ajax({
			url: "http://bim.bryandenijs.nl/bimserverapi.js", // Tijdelijk BimServerApi bestand, totdat deze is geupdate op 1 van de live BimServer servers.
			type: "GET",
			success: function(script)
			{
				try
				{
					$.globalEval(script);
					if(typeof BimServerApi == 'object' || typeof BimServerApi == 'function')
					{
						_this.bimServer = new BimServerApi(serverUrl);

						if(typeof _this.bimServer.AJAXaSync == 'undefined')
						{
							_this.bimServer = null;
							errorCallback('The connected BimServerApi does not support synchronous AJAX calls.');
							return;
						}

						_this.bimServer.AJAXaSync = false;
						success = true;
						successCallback();
					}
					else
					{
						_this.bimServer = null;
						errorCallback('BimServerApi not found.');
					}
				}
				catch(e)
				{
					_this.bimServer = null;
					errorCallback('Syntax error in BimServerApi script.');
				}
			},
			error: function(a,b,c,d,e)
			{
				_this.bimServer = null;
				if(typeof errorCallback == 'function') errorCallback('Could not load the BimServerApi.');
			},
			dataType: 'text',
			cache: false,
			async: false
		});
		return success;
	}






	this.login = function(username, password, rememberMe, successCallback, errorCallback)
	{
		if(typeof successCallback != 'function') successCallback = function(){};
		if(typeof errorCallback != 'function') errorCallback = function(error){};

		var result = {success: false, message: "Not logged in"};
		if(!_this.bimServer)
		{
			errorCallback('The BimServerApi is not loaded');
			result.success = false;
			result.message = 'The BimServerApi is not loaded';
		}


		_this.bimServer.login(username, password, rememberMe, function()
		{
			_this.bimServer.call("Bimsie1ServiceInterface", "getAllProjects", { onlyTopLevel : true, onlyActive: true }, function(data)
			{
				_this.projects = data;
				successCallback();
				result.success = true;
				result.message = null;

			}, function() {
				_this.project = new Array();
				errorCallback('Could not resolve projects');
				result.success = false;
				result.message = 'Could not resolve projects';
			});
		},
		function()
		{
			errorCallback('Login request failed');
			result.success = false;
			result.message = 'Login request failed';
		});

		return result;
	}







	this.loadProject = function(project, callback)
	{

		return new _this.Project(project);
/*
		var serializer = _this.getSerializer('org.bimserver.geometry.jsonshell.SceneJsShellSerializerPlugin');
		if(!BIM.Util.isset(serializer) || !BIM.Util.isset(project.lastRevisionId))
		{
			_this.setProgress(-1);
			_this.setProgressMessage("Loading failed");
			return null;
		}
		var serializerOid = serializer.oid;





_this.currentAction.serializerOid = serializerOid;
_this.currentAction.laid = downloadId;
_this.currentAction.roid = project.lastRevisionId;
*/
	}


	this.Project = function(project)
	{

		var pthis		= this;
		this.project	= project;
		this.downloadId	= null;
		this.scene	= null;

		_this.setProgress(0);
		_this.setProgressMessage("Loading Project");

		_this.bimServer.call("Bimsie1ServiceInterface", "download",
		{
			roid : this.project.lastRevisionId,
			serializerOid : _this.getSerializer('org.bimserver.geometry.jsonshell.SceneJsShellSerializerPlugin').oid,
			showOwn : true,
			sync : true
		}, function(id)
		{
			pthis.downloadId = id;
		});

		if(!BIM.Util.isset(this.downloadId)) return null;

		this.url = _this.bimServer.generateRevisionDownloadUrl(
		{
			serializerOid : _this.getSerializer('org.bimserver.geometry.jsonshell.SceneJsShellSerializerPlugin').oid,
			laid : pthis.downloadId
		});

		$.ajax(
		{
			url: this.url,
			dataType: 'json',
			async: false,
			success: function(scene)
			{
				pthis.scene = scene;
				pthis.scene.data.ifcTypes.sort();

				_this.setProgress(100);
	   			_this.setProgressMessage("Project Loaded");

			   /*	_this.loadScene(sceneData);

				_this.typeDownloadQueue = _this.defaultTypes.slice(0);

				// Remove the types that are not there anyways
				_this.typeDownloadQueue.sort();
				_this.typeDownloadQueue = _this.intersect_safe(_this.typeDownloadQueue, sceneData.data.ifcTypes);
				*/
			},
			fail: function(a,b,c,d,e)
			{
				console.debug('Todo: Error');
				console.debug('ERROR');
				console.debug(a,b,c,d,e);
			}
		});

	}

	this.unloadScene = function()
	{

	}

	this.loadScene = function(scene)
	{
		if (_this.scene != null)
		{
			_this.scene.destroy();
			_this.scene = null;
			_this.fireEvent('unloadScene');
		}
		try
		{
			_this.log('Create scene...');
			scene.canvasId = $(_this.drawCanvas()).attr('id');

			_this.scene = SceneJS.createScene(scene);

			if (_this.scene != null) {
				_this.log('Initialize scene...');
				_this.sceneInit();

				_this.log('Start scene...');
				_this.scene.start({
					idleFunc : SceneJS.FX.idle
				});

				// Calculate Scalefactor
				var ref, len, i, unit, sizingFactor;

				unit = _this.scene.data().unit;
				_this.log("Unit: " + unit);
				ref = _this.scene.data().bounds;
				for (i = 0, len = ref.length; i < len; i++) { // iterate all
					// bounds
					_this.log("Bound" + i + ": " + ref[i]);
				}
				// to decide which side is used to set view in setViewToObject
				if (ref[0] > ref[1]) {
					_this.propertyValues.boundfactor = 1; // for setView to
					// decide the main
					// viewside
				}
				_this.propertyValues.scalefactor = parseFloat(unit);

				// setting viewfactor for different views
				_this.propertyValues.viewfactor = SceneJS_math_lenVec3(_this.scene.data().bounds);

				return _this.scene;
			}
		} catch (error) {
			_this.log(error);
			_this.log('...Errors occured');
		}
		return null;
	}

	this.sceneInit = function()
	{
		var lookAtNode;
		var sceneDiameter;
		var tag;
		var tags;

		_this.modifySubAttr(_this.scene.findNode('main-camera'), 'optics', 'aspect', _this.canvas.width / _this.canvas.height);
		sceneDiameter = SceneJS_math_lenVec3(_this.scene.data().bounds);
		_this.log("SceneDiameter: " + sceneDiameter); // TODO: remove log?
		_this.camera.distanceLimits = [ sceneDiameter * 0.1, sceneDiameter * 2.0 ];
		tags = (function() {
			var _i, _len, _ref, _results;
			_ref = _this.scene.data().ifcTypes;
			_results = [];
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				tag = _ref[_i];
				_results.push(tag.toLowerCase());
			}
			return _results;
		})();
		_this.scene.set('tagMask', '^(' + (tags.join('|')) + ')$');
		lookAtNode = _this.scene.findNode('main-lookAt');
		_this.lookAt.defaultParameters.eye = lookAtNode.get('eye');
		_this.lookAt.defaultParameters.look = lookAtNode.get('look');
		return _this.lookAt.defaultParameters.up = lookAtNode.get('up');
	};

	this.modifySubAttr = function(node, attr, subAttr, value)
	{
		var attrRecord = node.get(attr);
		attrRecord[subAttr] = value;
		return node.set(attr, attrRecord);
	};


	this.progressLoader = function(downloadID, step, done, params, autoUnregister)
	{
		var pthis = this;
		this.params = params;
		this.downloadID = downloadID;
		this.step = step;
		this.done = done;
		this.autoUnregister = autoUnregister;
		this.registered = false;

		this.unregister = function()
		{
			_this.bimServer.unregisterProgressHandler(pthis.downloadID, pthis.progressHandler);
			pthis.registered = false;
		}

		this.progressHandler = function(topicId, state)
		{
			if(state.state == "FINISHED")
			{
				if(pthis.autoUnregister && pthis.registered)
					pthis.unregister();

				pthis.done(pthis.params, state, pthis);
			}
			else
			{
				pthis.step(pthis.params, state, pthis);
			}
		}

		_this.bimServer.registerProgressHandler(downloadID, this.progressHandler, function() { pthis.registered = true; });

	}


	this.loadGeometry = function(project, typesToLoad)
	{
		var roid = null;
		if(typeof project.project == 'object' && typeof project.project.lastRevisionId != 'undefined')
			roid = project.project.lastRevisionId;
		else if(typeof project.lastRevisionId != 'undefined')
			roid = project.lastRevisionId
		else return;

		if(typeof typesToLoad == 'undefined')
			typesToLoad = this.defaultTypes;


   		if (typesToLoad.length == 0)
		{
			_this.mode = "done";
			_this.setProgress(-1);
			_this.setProgressMessage('');
			return;
		}

		_this.setProgress(0);
		_this.setProgressMessage("Loading " + typesToLoad[0]);

		var params =
		{
				roid: roid,
				serializerOid: _this.getSerializer('org.bimserver.geometry.json.JsonGeometrySerializerPlugin').oid,
				downloadQueue: typesToLoad,
				project: project
		}

		_this.bimServer.call("Bimsie1ServiceInterface", "downloadByTypes", {
			roids : [ roid ],
			classNames : [ typesToLoad[0] ],
			serializerOid : _this.getSerializer('org.bimserver.geometry.json.JsonGeometrySerializerPlugin').oid,
			includeAllSubtypes : false,
			useObjectIDM : false,
			sync : false,
			deep: true
		}, function(laid) {
			_this.mode = "loading";

			params.laid = laid;

			var progressLoader = new _this.progressLoader(laid, function(params, state, progressLoader)
			{
				_this.setProgress(state.progress);
			},
			function(params, state, progressLoader)
			{
				if(_this.mode != 'loading') return;
				_this.mode = "processing";
				_this.setProgress(state.progress);

				progressLoader.unregister();

				var url = _this.bimServer.generateRevisionDownloadUrl({
					serializerOid : params.serializerOid,
					laid : params.laid
				});

				console.debug('URL: ', url);

				$.getJSON(url, function(data)
				{
					_this.loadedTypes.push(params.downloadQueue[0]);
					var typeNode =
					{
						type : "tag",
						tag : params.downloadQueue[0].toLowerCase(),
						id : params.downloadQueue[0].toLowerCase(),
						nodes : []
					};
					var library = _this.scene.findNode("library");
					var bounds = _this.scene.data().bounds2;
					data.geometry.forEach(function(geometry) {
						var material = {
							type : "material",
							coreId : geometry.material + "Material",
							nodes : [ {
								id : geometry.coreId,
								type : "name",
								nodes : [  ]
							} ]
						};
						if (geometry.nodes != null) {
							geometry.nodes.forEach(function(node){
								if (node.positions != null) {
									for (var i = 0; i < node.positions.length; i += 3) {
										node.positions[i] = node.positions[i] - bounds[0];
										node.positions[i + 1] = node.positions[i + 1] - bounds[1];
										node.positions[i + 2] = node.positions[i + 2] - bounds[2];
									}
									node.indices = [];
									for (var i = 0; i < node.nrindices; i++) {
										node.indices.push(i);
									}
									library.add("node", node);
									material.nodes[0].nodes.push({
										type: "geometry",
										coreId: node.coreId
									});
								}
							});
						} else {
							if (geometry.positions != null) {
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
							}
						}
						var flags = {
							type : "flags",
							flags : {
								transparent : true
							},
							nodes : [ material ]
						};
						typeNode.nodes.push(flags);
					});
					_this.scene.findNode("main-renderer").add("node", typeNode);

					_this.loadGeometry(params.project, params.downloadQueue.slice(1));
				   //	$("#layer-" + _this.currentAction.className.toLowerCase()).attr("checked", "checked");
				});


			}, params, false);
		});
	}

	this.loadType = function(type)
	{

	}

	// http://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript
	this.intersect_safe = function(a, b)
	{
		var ai=0, bi=0;
		var result = new Array();

		while( ai < a.length && bi < b.length )
		{
			if      (a[ai] < b[bi] ){ ai++; }
			else if (a[ai] > b[bi] ){ bi++; }
			else /* they're equal */
			{
				result.push(a[ai]);
				ai++;
				bi++;
			}
		}
		return result;
	}















});