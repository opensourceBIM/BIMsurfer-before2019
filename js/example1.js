var BIMServer = null;
var BIMSurfer = null;

$(function()
{
	function connect(server, email, password)
	{
		BIMServer = new BIM.Server(server, email, password, false, true);
		if(BIMServer.connectionStatus != 'connected')
			return BIMServer.connectionStatus;
		if(BIMServer.loginStatus != 'loggedin')
			return BIMServer.loginStatus;
		return 'success';
	}

	var dialog = $('<div />').attr('class', 'form').attr('title', 'Conntect to a server');

	var form = $('<form />').attr('action', './').attr('method', 'post').appendTo(dialog);
	$('<div />').append($('<label />').append($('<span />').text('BIMserver: ')).append($('<input />').attr('type', 'text').attr('name', 'server').val('http://127.0.0.1:8080/'))).appendTo(form);
	$('<div />').append($('<label />').append($('<span />').text('Email: ')).append($('<input />').attr('type', 'text').attr('name', 'email').val('admin@bimserver.org'))).appendTo(form);
	$('<div />').append($('<label />').append($('<span />').text('Password: ')).append($('<input />').attr('type', 'password').attr('name', 'password').val('admin'))).appendTo(form);

	$(form).find('input').keydown(function(e)
	{
		var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
		if(keycode == 13) $(form).submit();
	});

	$(form).submit(function(e)
	{
		e.preventDefault();

		$(dialog).find('div.state').remove();

		var server = $.trim($(dialog).find('input[name="server"]').val());
		var email = $.trim($(dialog).find('input[name="email"]').val());
		var password = $.trim($(dialog).find('input[name="password"]').val());

		var ok = true;

		if(server == '')
		{
			ok = false;
			$(dialog).find('input[name="server"]').addClass('ui-state-error');
		}
		else
		{
			$(dialog).find('input[name="server"]').removeClass('ui-state-error')
		}

		if(email == '')
		{
			ok = false;
			$(dialog).find('input[name="email"]').addClass('ui-state-error');
		}
		else
		{
			$(dialog).find('input[name="email"]').removeClass('ui-state-error')
		}

		if(password == '')
		{
			ok = false;
			$(dialog).find('input[name="password"]').addClass('ui-state-error');
		}
		else
		{
			$(dialog).find('input[name="password"]').removeClass('ui-state-error')
		}

		if(ok)
		{
			var connectionStatus = connect(server, email, password);
			if( connectionStatus == 'success' )
			{
				$(dialog).dialog('close');
				connected();
			}
			else
			{
				var icon = $('<span />').addClass('ui-icon').addClass('ui-icon-alert').css({'float': 'left', 'margin-right': '.3em'});
				$(dialog).prepend($('<div />').addClass('state').addClass('ui-state-error').text(connectionStatus).prepend(icon));
			}
		}
	});


	$(dialog).dialog({
		autoOpen: true,
		width: 450,
		modal: true,
		closeOnEscape: false,
		open: function(event, ui) { $(".ui-dialog .ui-dialog-titlebar-close").hide(); },
		buttons: {
			"Connect": function()
			{
				$(form).submit();
			}
		},
		close: function() { $(dialog).remove(); }
	});



	function connected()
	{

		BIMSurfer = new BIM.Surfer('viewport', BIMServer);
		var dialog = $('<div />').attr('title', 'Open a project');
		var projectList = $('<ul />').attr('id', 'projects').appendTo(dialog);

		var progressBar = new BIM.Control.ProgressBar('progress_bar');
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

				if(BIM.Constants.defaultTypes.indexOf(this.ifcTypes[i]) != -1)
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

						var layerLists = $('div#leftbar').find('div#layerlist').find('.data');
						if($(layerLists).is('.empty')) {
							$(layerLists).empty();
						}

						var container = $('<div />').attr('id', 'layerlist-' + project.oid).data('project', project).appendTo(layerLists);
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


						if(BIMSurfer.loadScene(project.scene) != null)
						{
							var clickSelect = new BIM.Control.ClickSelect();
							clickSelect.events.register('select', nodeSelected);
							clickSelect.events.register('unselect', nodeUnselected);
							BIMSurfer.addControl(clickSelect);
							clickSelect.activate();

							var panOrbit = new BIM.Control.PickFlyOrbit();
							BIMSurfer.addControl(panOrbit);
							panOrbit.activate();

							var ambientLight = new BIM.Light.Ambient();
						   	BIMSurfer.addLight(ambientLight);


					   		BIMSurfer.loadGeometry();
						}

					}
				}
			});
		});
		var scene = project.load();
	}

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