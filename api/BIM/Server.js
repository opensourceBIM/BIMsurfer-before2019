BIM.Server = BIM.Class({
	CLASS: 'BIM.Server',
	url: null,
	username: null,
	password: null,
	rememberMe: null,
	server: null,
	connectionStatus: null,
	loginStatus: null,
	projects: null,
	serializers: new Array(),

	__construct: function(url, username, password, rememberMe, autoConnect, autoLogin) {
		this.url = (url.substr(-1) == '/' ? url.substr(0, url.length - 1) : url);
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
			this.connect();
			if(this.connectionStatus == 'connected' && autoLogin) {
				this.login();
			}
		}
	},

	connect: function()	{
		var result = {success: false, error: 'No response'};

		var _this = this;

		jQuery.ajax({
			url: this.url + '/js/bimserverapi.js',
			type: "GET",
			dataType: 'text',
			cache: false,
			async: false,
			success: function(script) {
				try {
					jQuery.globalEval(script);

					if(typeof BimServerApi == 'object' || typeof BimServerApi == 'function') {
						_this.server = new BimServerApi(_this.url);
						_this.connectionStatus = 'connected';
						result.success = true;
					} else {
						result.success = false;
						result.error = 'BimServerApi not found.';
						_this.connectionStatus = 'error: ' + result.error;
					}
				} catch(e) {
					result.success = false;
					result.error = 'Syntax error in BimServerApi script.';
					_this.connectionStatus = 'error: ' + result.error;
				}
			},
			error: function(a,b,c,d,e) {
				result.success = false;
				result.error = 'Could not load the BimServerApi.';
				_this.connectionStatus = 'error: ' + result.error;
			}
		});
		return result;
	},

	login: function(successCallback, errorCallback) {
		if(typeof successCallback != 'function') successCallback = function(){};
		if(typeof errorCallback != 'function') errorCallback = function(error){};

		var result = {success: true, error: 'No response'};

		var _this = this;

		if(!this.server) {
			result.success = false;
			result.error = 'The BimServerApi is not loaded';
			_this.loginStatus = 'error: ' + result.error;
			return result;
		}

		this.server.login(this.username, this.password, this.rememberMe, function() {
			_this.server.call("Bimsie1ServiceInterface", "getAllProjects", { onlyTopLevel : true, onlyActive: true, async: false }, function(projects) {
				_this.projects = new Array();

				for(var i = 0; i < projects.length; i++) {
					_this.projects.push(new BIM.Project(projects[i], _this));
				}

				result.success = true;
				_this.loginStatus = 'loggedin';
			}, function() {
				_this.project = null;
				result.success = false;
				result.error = 'Could not resolve projects';
		   		_this.loginStatus = 'error: ' + result.error;
			});
		},
		function() {
			result.success = false;
			result.error = 'Login request failed';
			_this.loginStatus = 'error: ' + result.error;
		}, { async: false });

		return result;
	},

	getSerializer: function(name) {
		if(!BIM.Util.isset(this.serializers[name])) {
			var _this = this;
			this.server.call("PluginInterface", "getSerializerByPluginClassName", {pluginClassName : name, async: false}, function(serializer) {
				if(!BIM.Util.isset(serializer.oid)) return null;
					_this.serializers[name] = serializer;
			});
		}
		return this.serializers[name];
	}

});