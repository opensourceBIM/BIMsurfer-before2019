"use strict"

/**
 * Class: BIMSURFER.Server
 * Manages the connection to a BIMServer
 */
BIMSURFER.Server = BIMSURFER.Class({
	CLASS: 'BIMSURFER.Server',
	SYSTEM: null,

	url: null,
	username: null,
	password: null,
	rememberMe: null,
	server: null,
	events:null,
	connectionStatus: null,
	loginStatus: null,
	projects: null,
	serializers: new Array(),

	__construct: function(system, url, username, password, rememberMe, autoConnect, autoLogin) {
		this.SYSTEM = system;

		this.url = (url.substr(-1) == '/' ? url.substr(0, url.length - 1) : url);
		this.events = new BIMSURFER.Events(this);
		this.username = username;
		this.password = password;

		if(typeof rememberMe != 'boolean') {
			rememberMe = false;
		}
		if(typeof autoConnect != 'boolean') {
			autoConnect = true;
		}
		if(typeof autoLogin != 'boolean') {
			autoLogin = true;
		}

		this.rememberMe = rememberMe;

		if(autoConnect) {
			this.events.register('connected', function()
			{
				if(this.connectionStatus == 'connected' && autoLogin) {
					this.login();
				}
			});
			this.connect();
		}
	},

	connect: function()	{

		var _this = this;

		var timeoutTimer = setTimeout((function() {
			var error = 'Timed out';
			_this.connectionStatus = 'error: ' + error;
			_this.events.trigger('connectionError', error);
		}), BIMSURFER.Constants.timeoutTime);

		jQuery.ajax({
			url: this.url + '/js/bimserverapi.js',
			type: "GET",
			dataType: 'text',
			cache: false,
			success: function(script) {
				clearTimeout(timeoutTimer);
				try {
					jQuery.globalEval(script);

					if(typeof BimServerApi == 'object' || typeof BimServerApi == 'function') {
						_this.server = new BimServerApi(_this.url);
						_this.connectionStatus = 'connected';
						_this.events.trigger('connected');
					} else {
						var error = 'BimServerApi not found.';
						_this.connectionStatus = 'error: ' + error;
						_this.events.trigger('connectionError', error);
					}
				} catch(e) {
					var error = 'Syntax error in BimServerApi script.';
					_this.connectionStatus = 'error: ' + error;
					_this.events.trigger('connectionError', error);
				}
			},
			error: function(error) {
				clearTimeout(timeoutTimer);
				var error = 'Could not load the BimServerApi.';
				_this.connectionStatus = 'error: ' + error;
				_this.events.trigger('connectionError', error);
			}
		});
	},

	login: function(successCallback, errorCallback) {
		if(typeof successCallback != 'function') successCallback = function() {};
		if(typeof errorCallback != 'function') errorCallback = function(error) {};

		var _this = this;

		if(!this.server) {
			var error = 'The BimServerApi is not loaded';
			_this.loginStatus = 'error: ' + error;
			_this.events.trigger('loginError', error);
		}

		var timeoutTimer = setTimeout((function() {
			var error = 'Timed out';
			_this.connectionStatus = 'error: ' + error;
			_this.events.trigger('loginError', error);
		}), BIMSURFER.Constants.timeoutTime);

		this.server.login(this.username, this.password, this.rememberMe, function() {
			_this.server.call(
				"Bimsie1ServiceInterface", 
				"getAllProjects",
				{ onlyTopLevel : true, onlyActive: true },
				function(projects) {
					clearTimeout(timeoutTimer);
					_this.projects = new Array();

					for(var i = 0; i < projects.length; i++) {
						_this.projects.push(new BIMSURFER.Project(_this.SYSTEM, projects[i], _this));
					}

					_this.loginStatus = 'loggedin';
					_this.events.trigger('loggedin');
				}, 
				function() {
			 		clearTimeout(timeoutTimer);
					_this.project = null;
					var error = 'Could not resolve projects';
			   		_this.loginStatus = 'error: ' + error;
			   		_this.events.trigger('loginError', error);
				}
			);
		},
		function(exception) {
			clearTimeout(timeoutTimer);
			var error = 'Login request failed' + (typeof exception.message == 'string' ? ': ' + exception.message : '');
			_this.loginStatus = 'error: ' + error;
			_this.events.trigger('loginError', error);
		}, { });
	},

	getSerializer: function(name) {
		if(!BIMSURFER.Util.isset(this.serializers[name])) {
			var _this = this;
			this.server.call("PluginInterface", "getSerializerByPluginClassName", {pluginClassName : name, async: false}, function(serializer) {
				if(!BIMSURFER.Util.isset(serializer.oid)) {
					console.error('Serializer not found on server: ', name);
					return null;
				}
				_this.serializers[name] = serializer;
			});
		}

		if(!this.serializers[name]) {
			console.error('Serializer not found on server: ', name);
			return null;
		}
		return this.serializers[name];
	}

});
