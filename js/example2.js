$(function()
{
	var surfers = new Array();
	surfers.push(new BIMSURFER.Viewer('viewer_1'));
	surfers.push(new BIMSURFER.Viewer('viewer_2'));

	debug.surfers = surfers;

	$('div.viewer').find('a.load_button').click(function(e) {
		e.preventDefault();

		var surferDiv = $(this).closest('.viewer')[0];
		var surfer = null;
		for(var i = 0; i < surfers.length; i++) {
			if(surfers[i].div === surferDiv) {
				surfer = surfers[i];
				break;
			}
		}
		if(surfer == null) {
			return;
		}

		var dialog = $('<div />').attr('class', 'form').attr('title', 'Conntect to a server');
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

		$(dialog).dialog({
			autoOpen: true,
			width: 450,
			modal: true,
			buttons: {
				"Connect": function() {
					$(form).submit();
				}
			},
			close: function() { $(dialog).remove(); }
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

				var server = new BIMSURFER.Server(surfer, server, email, password);

				function loadProject(project)
				{
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
										surfer.loadQueue.push({project: project, type: $(this).val()});
									});


									$(dialog).dialog('close');

									var layerLists = $('div#leftbar').find('div#layer_list').find('.data');
									if($(layerLists).is('.empty')) {
										$(layerLists).empty();
									}

									var container = $('<div />').attr('id', 'layer_list-' + project.oid).data('project', project).appendTo(layerLists);
									$('<h3 />').text(project.name).appendTo(container);
									var typesList = $('<ul />').appendTo(container);

									var loadQueueTypes = new Array();
									for(var i = 0; i < surfer.loadQueue.length; i++) {
										loadQueueTypes.push(surfer.loadQueue[i].type);
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
												surfer.showLayer($(this).val(), project);
											} else {
												surfer.hideLayer($(this).val(), project);
											}


										});
										$('<div />').append($('<label />').text(_this.ifcTypes[i]).prepend(checkbox)).appendTo(typesList);
									}


									if(surfer.loadScene(project.scene) != null)
									{
										var clickSelect = new BIMSURFER.Control.ClickSelect(surfer);
										//clickSelect.events.register('select', nodeSelected);
										//clickSelect.events.register('unselect', nodeUnselected);
										surfer.addControl(clickSelect);
										clickSelect.activate();

										var panOrbit = new BIMSURFER.Control.PickFlyOrbit(surfer);
										surfer.addControl(panOrbit);
										panOrbit.activate();

										var sunLight = new BIMSURFER.Light.Sun(surfer);
									   	surfer.addLight(sunLight);

										var ambientLight = new BIMSURFER.Light.Ambient(surfer);
									   	surfer.addLight(ambientLight);

								   		surfer.loadGeometry();

										var objectTreeView = new BIMSURFER.Control.ObjectTreeView(surfer, 'object_tree_view');
										surfer.addControl(objectTreeView);
										objectTreeView.activate();
									}

								}
							}
						});
					});
					var scene = project.load();
				}

				function connected()
				{
					surfer.setServer(server);

					$(this.window).resize(function(e) {
						surfer.resize($(surfer.div).width(), $(surfer.div).height());
					});

					var dialog = $('<div />').attr('title', 'Open a project');
					var projectList = $('<ul />').attr('id', 'projects').appendTo(dialog);

					var progressBar = $('<div />').attr('id', 'progress_bar_' + $(surfer.div).attr('id'));
					$(surfer.div).closest('.container').append(progressBar);

					progressBar = new BIMSURFER.Control.ProgressBar(surfer, progressBar);
					surfer.addControl(progressBar);
					progressBar.activate();

					for(var i = 0; i < surfer.server.projects.length; i++)
					{
						var project = surfer.server.projects[i];

						if(project.lastRevisionId != -1)
						{
							var link = $('<a />')
											.attr('href', '#')
											.attr('title', 'Laad het project ' + project.name)
											.click(function(e)
													{
														e.preventDefault();
														var project = $(this).parent().data('project');
														if(project == null) return;
													   	loadProject(project);
														$(dialog).dialog('close');
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

				function connectCallback(e) {
					server.events.unregister("serverLogin", connectCallback);

					if(server.connectionStatus == 'connected' && server.loginStatus == 'loggedin') {
							$(dialog).dialog('close');
							connected();
					} else {
						var connectionStatus = (server.connectionStatus != 'connected' ? server.connectionStatus : server.loginStatus);
						var icon = $('<span />').addClass('ui-icon').addClass('ui-icon-alert').css({'float': 'left', 'margin-right': '.3em'});
						$(dialog).find('.state').remove();
						$(dialog).prepend($('<div />').addClass('state').addClass('ui-state-error').text(connectionStatus).prepend(icon));
						$(dialog).closest('div.ui-dialog').find('.ui-dialog-buttonpane').find('button:contains("Connect")').removeAttr('disabled').removeClass('disabled');
					}
				}

				server.events.register("loggedin", connectCallback);
				server.events.register("loginError", connectCallback);
				server.events.register("connectionError", connectCallback);
				if(server.connectionStatus != null) {
					if(server.connectionStatus == 'connected' ) {
						server.events.trigger('connected');
					} else {
						server.events.trigger('connectionError');
						return;
					}
				}
				if(server.loginStatus != null) {
					if(server.loginStatus == 'loggedin' ) {
						server.events.trigger('loggedin');
					} else {
						server.events.trigger('loginError');
					}
				}


			}
		});

	});



});