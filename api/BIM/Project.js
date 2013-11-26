"use strict"
BIM.Project = BIM.Class({
	CLASS: 'Bim.Project',
	events: null,
	server: null,
	scene: null,
	ifcTypes: null,
	loadedTypes: null,

	__construct: function(serverProject, server) {

		if(typeof server.CLASS == 'undefined' || server.CLASS !== 'BIM.Server') {
			console.error('BIM.Project: No server given');
			return
		}

		if(typeof serverProject.lastRevisionId == 'undefined') {
			console.error('BIM.Project: No project lastRevisionId given');
			return;
		}
		this.server = server;

		this.loadedTypes = new Array();

		jQuery.extend(this, serverProject);

		this.events = new BIM.Events(this);
	},

	load: function() {
		if(this.scene != null) {
			return this.types;
		}

		var _this = this;

		var step = function(params, state, progressLoader) {
			BIM.events.trigger('progressChanged', state.progress);
		};
		var done = function(params, state, progressLoader) {
			progressLoader.unregister();

			BIM.events.trigger('progressBarStyleChanged', BIM.Constants.ProgressBarStyle.Marquee);

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
					BIM.events.trigger('progressDone');
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
			if(!BIM.Util.isset(laid)) {
				console.error('Error loading project:', _this.lastRevisionId);
				return;
			}
			BIM.events.trigger('progressStarted', 'Preparing project');
			new BIM.ProgressLoader(_this.server.server, laid, step, done, {laid: laid}, false);
		});
	}
});