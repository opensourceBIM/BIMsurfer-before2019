var BIMServer = null;
var BIMSurfer = null;

$(function()
{
	BIMSurfer = new BIMSURFER.Viewer('viewport');


	var loadProjectButton = $('div#leftbar').find(':button[name="loadProject"]').button().click(function()
	{
		var dialog = $('<div />').attr('class', 'form').attr('title', 'Conntect to a server');

		function connect(server, email, password) {
			BIMServer = new BIMSURFER.Server(BIMSurfer, server, email, password);
			BIMServer.events.register("loggedin", connectCallback);
			BIMServer.events.register("loginError", connectCallback);
			BIMServer.events.register("connectionError", connectCallback);
			if(BIMServer.connectionStatus != null) {
				if(BIMServer.connectionStatus == 'connected' ) {
					BIMServer.events.trigger('connected');
				} else {
					BIMServer.events.trigger('connectionError');
					return;
				}
			}
			if(BIMServer.loginStatus != null) {
				if(BIMServer.loginStatus == 'loggedin' ) {
					BIMServer.events.trigger('loggedin');
				} else {
					BIMServer.events.trigger('loginError');
				}
			}
		}


		function connectCallback(e) {
			BIMServer.events.unregister("serverLogin", connectCallback);

			if(BIMServer.connectionStatus == 'connected' && BIMServer.loginStatus == 'loggedin') {
					$(dialog).dialog('close');
					connected();
			} else {
				var connectionStatus = (BIMServer.connectionStatus != 'connected' ? BIMServer.connectionStatus : BIMServer.loginStatus);
				var icon = $('<span />').addClass('ui-icon').addClass('ui-icon-alert').css({'float': 'left', 'margin-right': '.3em'});
				$(dialog).find('.state').remove();
				$(dialog).prepend($('<div />').addClass('state').addClass('ui-state-error').text(connectionStatus).prepend(icon));
				$(dialog).closest('div.ui-dialog').find('.ui-dialog-buttonpane').find('button:contains("Connect")').removeAttr('disabled').removeClass('disabled');
			}
		}


		var form = $('<form />').attr('action', './').attr('method', 'post').appendTo(dialog);
		$('<div />').append($('<label />').append($('<span />').text('BIMserver: ')).append($('<input />').attr('type', 'text').attr('name', 'server').val('http://127.0.0.1:8080/'))).appendTo(form);
		$('<div />').append($('<label />').append($('<span />').text('Email: ')).append($('<input />').attr('type', 'text').attr('name', 'email').val('admin@bimserver.org'))).appendTo(form);
		$('<div />').append($('<label />').append($('<span />').text('Password: ')).append($('<input />').attr('type', 'password').attr('name', 'password').val('admin'))).appendTo(form);

		$(form).find('input').keydown(function(e) {
			var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
			if(keycode == 13) {
				$(form).submit();
			}
		});

		$(form).submit(function(e) {
			e.preventDefault();

			$(dialog).find('div.state').remove();

			var server = $.trim($(dialog).find('input[name="server"]').val());
			var email = $.trim($(dialog).find('input[name="email"]').val());
			var password = $.trim($(dialog).find('input[name="password"]').val());

			var ok = true;

			if(server == '') {
				ok = false;
				$(dialog).find('input[name="server"]').addClass('ui-state-error');
			} else {
				$(dialog).find('input[name="server"]').removeClass('ui-state-error')
			}

			if(email == '') {
				ok = false;
				$(dialog).find('input[name="email"]').addClass('ui-state-error');
			} else {
				$(dialog).find('input[name="email"]').removeClass('ui-state-error')
			}

			if(password == '') {
				ok = false;
				$(dialog).find('input[name="password"]').addClass('ui-state-error');
			} else {
				$(dialog).find('input[name="password"]').removeClass('ui-state-error')
			}

			if(ok) {
				$(dialog).closest('div.ui-dialog').find('.ui-dialog-buttonpane').find('button:contains("Connect")').attr('disabled', 'disabled').addClass('disabled');
				connect(server, email, password);
			}
		});

		$(dialog).dialog({
			autoOpen: true,
			width: 450,
			modal: true,
			closeOnEscape: false,
			open: function(event, ui) { $(".ui-dialog .ui-dialog-titlebar-close").hide(); },
			buttons: {
				"Connect": function() {
					$(form).submit();
				}
			},
			close: function() { $(dialog).remove(); }
		});
	});



	function connected()
	{
		BIMSurfer.setServer(BIMServer);

		$(this.window).resize(function(e) {
			BIMSurfer.resize($('div#viewport').width(), $('div#viewport').height());
		});

		var dialog = $('<div />').attr('title', 'Open a project');
		var projectList = $('<ul />').attr('id', 'projects').appendTo(dialog);

		var progressBar = new BIMSURFER.Control.ProgressBar(BIMSurfer, 'progress_bar');
		BIMSurfer.addControl(progressBar);
		progressBar.activate();

		for(var i = 0; i < BIMSurfer.server.projects.length; i++)
		{
			var project = BIMSurfer.server.projects[i];

			if(project.lastRevisionId != -1)
			{
				var link = $('<a />')
								.attr('href', '#')
								.attr('title', 'Laad het project ' + project.name)
								.click(function(e)
										{
											e.preventDefault();
											var project = $(this).parent().data('project');
											if(project.revisions.length == 1) {
												for(var x = 0; x < BIMSurfer.loadedProjects.length; x++) {
													if(project.oid == BIMSurfer.loadedProjects[x].oid) {
														var icon = $('<span />').addClass('ui-icon').addClass('ui-icon-circle-close').css({'float': 'left', 'margin-right': '.3em'});
														$(dialog).find('.state').remove();
														$(dialog).prepend($('<div />').addClass('state').addClass('ui-state-error').text("This project is allready loaded").prepend(icon));
														return;
													}
												}
											}
											if(project == null) return;

											$(dialog).dialog('close');
											dialog = null;
											if(project.revisions.length == 1) {
										   		loadProject(project);
											}
											else
											{
												dialog = $('<div />').attr('title', 'Choose a project revision');
												var revisionList = $('<ul />').attr('id', 'revisions').appendTo(dialog);
												for(var x = 0; x < project.revisions.length; x++) {
													var date = new Date(project.revisions[x].date);
													var link = $('<a />')
																	.attr('href', '#')
																	.attr('title', 'Laad revisie ' + project.revisions[x].id)
																	.click(function(ev)
																			{
																				ev.preventDefault();
																				var revision = $(this).parent().data('revision');
																				for(var x = 0; x < BIMSurfer.loadedProjects.length; x++) {
																					if(project.oid == BIMSurfer.loadedProjects[x].oid && BIMSurfer.loadedProjects[x].loadedRevisionId == revision.oid) {
																						var icon = $('<span />').addClass('ui-icon').addClass('ui-icon-circle-close').css({'float': 'left', 'margin-right': '.3em'});
																						$(dialog).find('.state').remove();
																						$(dialog).prepend($('<div />').addClass('state').addClass('ui-state-error').text("This revision is allready loaded").prepend(icon));
																						return;
																					}
																				}

																				loadProject(project, revision.oid);
																				$(dialog).dialog('close');
																			})
																	.text(project.revisions[x].id + ' - ' + project.revisions[x].comment + ' (' + date.getFullYear() + '-' + (date.getMonth()/1+1) + '-' + date.getDate() + ')');
													$(revisionList).append($('<li />').data('revision', project.revisions[x]).append(link));
												}

												$(revisionList).menu();

												$(dialog).dialog({
													autoOpen: true,
													width: 450,
													modal: true,
													close: function() { $(dialog).remove(); }
												});
											}
										})
								.text(project.name)
				$(projectList).append($('<li />').data('project', project).append(link));
			}
		}

		$(projectList).menu();


		$(dialog).dialog({
			autoOpen: true,
			width: 450,
			modal: true,
			closeOnEscape: false,
			open: function(event, ui) { $(".ui-dialog .ui-dialog-titlebar-close").hide(); },
			close: function() { $(dialog).remove(); }
		});
	}


	function loadProject(project, revisionId)
	{
		if(typeof revisionId == 'undefined')
		{
			revisionId = project.lastRevisionId;
		}
		project.events.register('projectLoaded', function()
		{
			var scene = this.scene;
			var _this = this;
			if(scene == null)
			{
				console.error('Could not load project scene: ', project);
				return;
			};
			var dialog = $('<div />').attr('title', 'What types do you want to load?');
			var typesList = $('<ul />').attr('id', 'types').appendTo(dialog);

			for(var i = 0; i < this.ifcTypes.length; i++)
			{
				var checkbox = $('<input />').attr('type', 'checkbox').attr('name', 'types').val(this.ifcTypes[i]);

				if(BIMSURFER.Constants.defaultTypes.indexOf(this.ifcTypes[i]) != -1)
				{
					$(checkbox).attr('checked', 'checked');
				}

				$('<div />').append($('<label />').text(this.ifcTypes[i]).prepend(checkbox)).appendTo(typesList);
			}

			$(dialog).dialog({
				autoOpen: true,
				width: 450,
				modal: true,
				closeOnEscape: false,
				open: function(event, ui) { $(".ui-dialog .ui-dialog-titlebar-close").hide(); },
				close: function() { $(dialog).remove(); },
				buttons: {
					'Load': function()
					{
						var checkedTypes = $(dialog).find('input:checkbox:checked');

						$(checkedTypes).each(function()
						{
							BIMSurfer.loadQueue.push({project: project, type: $(this).val()});
						});


						$(dialog).dialog('close');

						var layerLists = $('div#leftbar').find('div#layer_list').find('.data');
						if($(layerLists).is('.empty')) {
							$(layerLists).empty();
						}
						$(layerLists).removeClass('empty');

						var container = $('<div />').attr('id', 'layer_list-' + project.oid).data('project', project).appendTo(layerLists);
						$('<h3 />').text(project.name).appendTo(container);
						var typesList = $('<ul />').appendTo(container);

						var loadQueueTypes = new Array();
						for(var i = 0; i < BIMSurfer.loadQueue.length; i++) {
							loadQueueTypes.push(BIMSurfer.loadQueue[i].type);
						}

						for(var i = 0; i < _this.ifcTypes.length; i++)
						{
							var checkbox = $('<input />').attr('type', 'checkbox').attr('name', 'types').val(_this.ifcTypes[i]);
							if(loadQueueTypes.indexOf(_this.ifcTypes[i]) != -1) {
								$(checkbox).attr('checked', 'checked');
							}

							$(checkbox).change(function(e) {

								var project = $(this).closest('ul').closest('div').data('project');

								if($(this).is(':checked')) {
									BIMSurfer.showLayer($(this).val(), project);
								} else {
									BIMSurfer.hideLayer($(this).val(), project);
								}


							});
							$('<div />').append($('<label />').text(_this.ifcTypes[i]).prepend(checkbox)).appendTo(typesList);
						}


						BIMSurfer.loadScene(project);

					}
				}
			});
		});
		var scene = project.load(revisionId);
	}

	function sceneLoaded() {

		var clickSelect = new BIMSURFER.Control.ClickSelect(BIMSurfer);
		clickSelect.events.register('select', nodeSelected);
		clickSelect.events.register('unselect', nodeUnselected);
		BIMSurfer.addControl(clickSelect);
		clickSelect.activate();

		var panOrbit = new BIMSURFER.Control.PickFlyOrbit(BIMSurfer);
		BIMSurfer.addControl(panOrbit);
		panOrbit.activate();

		var sunLight = new BIMSURFER.Light.Sun(BIMSurfer);
	   	BIMSurfer.addLight(sunLight);

		var ambientLight = new BIMSURFER.Light.Ambient(BIMSurfer);
	   	BIMSurfer.addLight(ambientLight);

  		BIMSurfer.loadGeometry();

		var objectTreeView = new BIMSURFER.Control.ObjectTreeView(BIMSurfer, 'object_tree_view');
		BIMSurfer.addControl(objectTreeView);
		objectTreeView.activate();
	}

	BIMSurfer.events.register('sceneReloaded', BIMSurfer.loadGeometry, null);
	BIMSurfer.events.register('sceneLoaded', sceneLoaded, null);

	function nodeSelected(node)
	{
		if(typeof this.surfer.scene.data.properties[node.getId()] == 'undefined') {
			return;
		}
		var infoContainer = $('#object_info').find('.data');
		$(infoContainer).empty();

		var properties = this.surfer.scene.data.properties[node.getId()];

		for(var i in properties) {
			if(typeof properties[i] == 'string') {
				$('<div />').append($('<label />').text(i)).appendTo(infoContainer);
				$('<div />').text(properties[i]).appendTo(infoContainer);
			}
		}
	}

	function nodeUnselected(node)
	{
		var infoContainer = $('#object_info').find('.data');
		$(infoContainer).empty();
		$('<p>').text('No object selected.').appendTo(infoContainer);
	}
});