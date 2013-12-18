"use strict"
BIMSURFER.Project = BIMSURFER.Class({
	CLASS: 'BIMSURFER.Project',
	SYSTEM: null,

	events: null,
	server: null,
	scene: null,
	ifcTypes: null,
	loadedTypes: null,

	__construct: function(system, serverProject, server) {
		this.SYSTEM = system;

		if(typeof server.CLASS == 'undefined' || server.CLASS !== 'BIMSURFER.Server') {
			console.error('BIMSURFER.Project: No server given');
			return
		}

		if(typeof serverProject.lastRevisionId == 'undefined') {
			console.error('BIMSURFER.Project: No project lastRevisionId given');
			return;
		}
		this.server = server;

		this.loadedTypes = new Array();

		jQuery.extend(this, serverProject);

		this.events = new BIMSURFER.Events(this.SYSTEM, this);
	},

	load: function() {
		if(this.scene != null) {
			return this.types;
		}

		var _this = this;

		var step = function(params, state, progressLoader) {
			_this.SYSTEM.events.trigger('progressChanged', state.progress);
		};
		var done = function(params, state, progressLoader) {
			progressLoader.unregister();

			_this.SYSTEM.events.trigger('progressBarStyleChanged', BIMSURFER.Constants.ProgressBarStyle.Marquee);

			var url = _this.server.server.generateRevisionDownloadUrl({
				serializerOid : _this.server.getSerializer('org.bimserver.geometry.jsonshell.SceneJs3ShellSerializerPlugin').oid,
				laid : params.laid
			});

			$.ajax({
				url: url,
				dataType: 'json',
				success: function(scene) {
					_this.scene = scene;
					_this.ifcTypes = _this.scene.data.ifcTypes;
					_this.ifcTypes.sort();
					_this.scene.data.ifcTypes = new Array();
					_this.events.trigger('projectLoaded');
					_this.SYSTEM.events.trigger('progressDone');
				},
				error: function(a,b,c,d,e) {
					console.debug('Todo: Error');
					console.debug('ERROR');
					console.debug(a,b,c,d,e);
				}
			});

			return _this.scene;

		}

		this.server.server.call("Bimsie1ServiceInterface", "download", {
			roid : this.lastRevisionId,
			serializerOid : this.server.getSerializer('org.bimserver.geometry.jsonshell.SceneJs3ShellSerializerPlugin').oid,
			showOwn : true,
			sync: false
		}, function(laid) {
			if(!BIMSURFER.Util.isset(laid)) {
				console.error('Error loading project:', _this.lastRevisionId);
				return;
			}
			_this.SYSTEM.events.trigger('progressStarted', 'Preparing project');
			new BIMSURFER.ProgressLoader(_this.SYSTEM, _this.server.server, laid, step, done, {laid: laid}, false);
		});
	}
});