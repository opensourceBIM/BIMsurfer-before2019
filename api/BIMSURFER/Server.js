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


	/**
	 * @constructor
	 * @param {BIMSURFER.Viewer instance} system The viewer instance
	 * @param {string} url The server URL
	 * @param {string} username The server username
	 * @param {String} password The server password
	 * @param {Boolean} [rememberMe] Remember Default = false
	 * @param {Boolean} [autoConnect] Automatically connect to the server? Default = true
	 * @param {Boolean} [autoLogin] Automatically login to the server after auto connecting? Default = true
	 * @param {Function} [autoLoginCallback] Callback function that will be called after auto login
	 */
	__construct: function(system, url, username, password, rememberMe, autoConnect, autoLogin, autoLoginCallback) {
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

		if(typeof autoLoginCallback == 'function') {
			var autoLoginCallbackStarter = function() {
				this.events.unregister('loggedin', autoLoginCallbackStarter);
				this.events.unregister('loginError', autoLoginCallbackStarter);
				this.events.unregister('connectionError', autoLoginCallbackStarter);
				autoLoginCallback.apply(this);
			}
			this.events.register('loggedin', autoLoginCallbackStarter);
			this.events.register('loginError', autoLoginCallbackStarter);
			this.events.register('connectionError', autoLoginCallbackStarter);
		}

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

	/**
	 * Connects to the BIMServer and loads the BimServerApi.js file
	 */
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

	/**
	 * Log in to the server and collect all projects
	 *
	 * @param {Function} [successCallback] Callback function when login is successful
	 * @param {Function} [errorCallback] Callback function when login is unsuccessful
	 */
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

	/**
	 * Gets the ID of a serializer on the server
	 *
	 * @param {String} name Serializer name
	 * @return {Number} the ID of the serializer
	 */
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
	},

	/**
	 * Gets project by OID
	 *
	 * @param {Number} oid The OID of the project
	 * @return {BIMSURFER.Project instance} The Project object or null
	 */
	 getProjectByOid: function(oid) {
		for(var i = 0; i < this.projects.length; i++) {
			if(this.projects[i].oid == oid) {
				return this.projects[i];
			}
		}
		return null;
	 }

});
