"use strict"
BIM.Project = BIM.Class(
{
	CLASS: 'Bim.Project',
	server: null,
	scene: null,
	type: null,

	__construct: function(serverProject, server)
	{

		if(typeof server.CLASS == 'undefined' || server.CLASS !== 'BIM.Server')
		{
			console.error('BIM.Project: No server given');
			return
		}

		if(typeof serverProject.lastRevisionId == 'undefined')
		{
			console.error('BIM.Project: No project lastRevisionId given');
			return;
		}
		this.server = server;
		jQuery.extend(this, serverProject);
	},

	getScene: function()
	{
		if(this.scene != null) return this.types;

		var downloadId = null;
		this.server.server.call("Bimsie1ServiceInterface", "download",
		{
			roid : this.lastRevisionId,
			serializerOid : this.server.getSerializer('org.bimserver.geometry.jsonshell.SceneJs3ShellSerializerPlugin').oid,
			showOwn : true,
			sync : true
		}, function(id)
		{
			downloadId = id;
		});

		if(!BIM.Util.isset(downloadId)) return null;

		var url = this.server.server.generateRevisionDownloadUrl(
		{
			serializerOid : this.server.getSerializer('org.bimserver.geometry.jsonshell.SceneJs3ShellSerializerPlugin').oid,
			laid : downloadId
		});

		var _this = this;
		console.debug(url, downloadId);
		$.ajax(
		{
			url: url,
			dataType: 'json',
			async: false,
			success: function(scene)
			{

				_this.scene = scene;
				_this.scene.data.ifcTypes.sort();
			},
			error: function(a,b,c,d,e)
			{
				console.debug('Todo: Error');
				console.debug('ERROR');
				console.debug(a,b,c,d,e);
			}
		});

		return this.scene;
	}
});