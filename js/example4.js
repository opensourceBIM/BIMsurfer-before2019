$(function()
{
	var surfer = new BIMSURFER.Viewer('viewport');

	var layerListContainer = $('div#layer_list');
	var layerList = new BIMSURFER.Control.LayerList($(layerListContainer).find('.data'));
	surfer.addControl(layerList);
	layerList.events.register('activated', function() {
			$(layerListContainer).addClass('open');

			var screenHeight = $('div#viewer_container').height();

			$(layerListContainer).find('h2').animate({'font-size': 20});
			$(layerListContainer.find('.data').slideDown());
			$(layerListContainer).css('max-height', screenHeight - 50);
	});
	layerList.events.register('deactivated', function() {
			$(layerListContainer).removeClass('open');
	});

	$(layerListContainer).find('a.openCloseButton').click(function(e) {
		e.preventDefault();
		if($(layerListContainer).is('.open')) {
			$(layerListContainer).find('h2').animate({'font-size': 12});
			$(layerListContainer.find('.data').slideUp('normal', function() {
				layerList.deactivate();
			}));
		} else {
			layerList.activate();
		}
	});

	$('div.viewer').find('a.load_button').click(function(e) {
		e.preventDefault();

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

				function connected()
				{

					$(this.window).resize(function(e) {
						surfer.resize($(surfer.div).width(), $(surfer.div).height());
					});

					var dialog = $('<div />').attr('title', 'Open a project');
					var projectList = $('<ul />').attr('id', 'projects').appendTo(dialog);

					var progressBar = $('<div />').attr('id', 'progress_bar_' + $(surfer.div).attr('id'));
					$(surfer.div).closest('.container').append(progressBar);

					progressBar = new BIMSURFER.Control.ProgressBar(progressBar);
					surfer.addControl(progressBar);
					progressBar.activate();

					for(var i = 0; i < server.projects.length; i++)
					{
						var project = server.projects[i];

						if(project.lastRevisionId != -1)
						{
							var link = $('<a />')
											.attr('href', '#')
											.attr('title', 'Load the project ' + project.name)
											.click(function(e)
													{
														e.preventDefault();
														var project = $(this).parent().data('project');
														if(project == null) return;
													   	loadProject(project);
														timeline.apply(project)
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

	function loadProject(project)
	{

		var revisionSceneLoaded = function() {
			project.events.unregister('revisionSceneLoaded', revisionSceneLoaded);
			var scene = this.scene;
			if(scene == null) {
				console.error('Could not load project revision scene');
				return;
			};

			for(var i = 0; i < this.ifcTypes.length; i++) {
				if(BIMSURFER.Constants.defaultTypes.indexOf(this.ifcTypes[i]) != -1) {
					surfer.loadQueue.push({revision: this, type: this.ifcTypes[i]});
				}
			}

			if(surfer.loadScene(this) != null)
			{
				var clickSelect = new BIMSURFER.Control.ClickSelect();
				surfer.addControl(clickSelect);
				clickSelect.activate();

				var panOrbit = new BIMSURFER.Control.PickFlyOrbit();
				surfer.addControl(panOrbit);
				panOrbit.activate();

				var sunLight = new BIMSURFER.Light.Sun();
			   	surfer.addLight(sunLight);

				var ambientLight = new BIMSURFER.Light.Ambient();
			   	surfer.addLight(ambientLight);

		   		surfer.loadGeometry();

				var objectTreeView = new BIMSURFER.Control.ObjectTreeView('object_tree_view');
				surfer.addControl(objectTreeView);
				objectTreeView.activate();
			}
		};
		project.events.register('revisionSceneLoaded', revisionSceneLoaded);
		var scene = project.loadScene();
	}


	function timeline() {
		/*
				<li class="selected">
			<div class="IDs">
				<span class="number">#2</span>
				<span class="ID">ID: 39476</span>
			</div>
			<div class="description">Revisie_bestand_iets_met_dak1.ifc</div>
			<div class="date">8 Jan 2013 16:16</div>
		</li>
		*/

		for(var i in this.revisions) {
			var li = $('<li />');
			if(this.revisions[i].oid == this.lastRevisionId) {
				$(li).addClass('selected');
			}
			$(li).data('revision', this.revisions[i]);

			$('<div />').addClass('IDs').append(
				$('<span />').addClass('number').text('#' + (i/1+1))
			).append(
				$('<span />').addClass('ID').text('ID: ' + this.revisions[i].oid)
			).appendTo(li);

			$('<div />').addClass('description').append(
				$('<a />').attr('href', '#').attr('title', 'Show the revision: ' + this.revisions[i].comment).text(this.revisions[i].comment).click(revisionClick).appendTo(li)
			).appendTo(li);

			var date = new Date(this.revisions[i].date);
			var month = date.getMonth();
			switch(month) {
				case 0: month = 'Jan'; break;
				case 1: month = 'Feb'; break;
				case 2: month = 'Mar'; break;
				case 3: month = 'Apr'; break;
				case 4: month = 'May'; break;
				case 5: month = 'Jun'; break;
				case 6: month = 'Jul'; break;
				case 7: month = 'Aug'; break;
				case 8: month = 'Sep'; break;
				case 9: month = 'Oct'; break;
				case 10: month = 'Nov'; break;
				case 11: month = 'Dec'; break;
			}
			$('<div />').addClass('date').text(date.getDate() + ' ' + month + ' ' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes()).appendTo(li);
			$(li).appendTo($('#timeline').find('ul'));
		}
	}

	function revisionClick(e) {
		e.preventDefault();
		var li = $(this).closest('li');
		var revision = $(li).data('revision');

		if($(li).is('.selected')) {
			return;
		}
		$(li).closest('ul').find('li.selected').removeClass('selected');
		$(li).addClass('selected');

		revision.SYSTEM.loadQueue = new Array();

		for(var i = 0; i < revision.project.revisions.length; i++) {
			if(!revision.project.revisions[i].sceneLoaded) {
				continue;
			}
			revision.project.revisions[i].hide();
		}

		revision.show();
	}
});