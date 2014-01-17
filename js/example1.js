var BIMServer = null;
var BIMSurfer = null;

$(function()
{
	BIMSurfer = new BIMSURFER.Viewer('viewport');

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

	var dialog = $('<div />').attr('class', 'form').attr('title', 'Conntect to a server');

	function connectCallback() {
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



	function connected()
	{
		$(this.window).resize(function(e) {
			BIMSurfer.resize($('div#viewport').width(), $('div#viewport').height());
		});

		var dialog = $('<div />').attr('title', 'Open a project');
		var projectList = $('<ul />').attr('id', 'projects').appendTo(dialog);

		var progressBar = new BIMSURFER.Control.ProgressBar('progress_bar');
		BIMSurfer.addControl(progressBar);
		progressBar.activate();

		for(var i = 0; i < BIMServer.projects.length; i++)
		{
			var project = BIMServer.projects[i];

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


	function loadProject(project)
	{
		var revisionSceneLoaded = function() {
			project.events.unregister('revisionSceneLoaded', revisionSceneLoaded);
			var scene = this.scene;
			var _this = this;
			if(scene == null)
			{
				console.error('Could not load project revision scene');
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
				maxHeight: $('div#full_screen').height() - 50,
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
							BIMSurfer.loadQueue.push({revision: _this, type: $(this).val()});
						});


						$(dialog).dialog('close');

						var layerLists = $('div#leftbar').find('div#layer_list').find('.data');
						if($(layerLists).is('.empty')) {
							$(layerLists).empty();
						}

						var layerList = new BIMSURFER.Control.LayerList(layerLists);
						BIMSurfer.addControl(layerList);
						layerList.activate();

						/*

						var container = $('<div />').attr('id', 'layer_list-' + _this.project.oid).data('project', _this.project).appendTo(layerLists);
						$('<h3 />').text(_this.project.name).appendTo(container);
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
									BIMSurfer.showType($(this).val(), project);
								} else {
									BIMSurfer.hideType($(this).val(), project);
								}


							});
							$('<div />').append($('<label />').text(_this.ifcTypes[i]).prepend(checkbox)).appendTo(typesList);
						}
						*/




						if(BIMSurfer.loadScene(_this) != null)
						{
							var clickSelect = new BIMSURFER.Control.ClickSelect();
							clickSelect.events.register('select', nodeSelected);
							clickSelect.events.register('unselect', nodeUnselected);
							BIMSurfer.addControl(clickSelect);
							clickSelect.activate();

					   		BIMSurfer.loadGeometry();

							/*var objectTreeView = new BIMSURFER.Control.ObjectTreeView('object_tree_view');
							BIMSurfer.addControl(objectTreeView);
							objectTreeView.activate();*/
						}

					}
				}
			});
		};
		project.events.register('revisionSceneLoaded', revisionSceneLoaded);
		var scene = project.loadScene();
	}

	function nodeSelected(node)
	{
		if(typeof this.SYSTEM.scene.data.properties[node.getId()] == 'undefined') {
			return;
		}
		var infoContainer = $('#object_info').find('.data');
		$(infoContainer).empty();

		var properties = this.SYSTEM.scene.data.properties[node.getId()];

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
