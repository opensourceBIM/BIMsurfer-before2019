
$(function()
{
	var o = this;

	o.server = null;
	o.viewer = null;
	o.bimServerApi = null;

	function showSelectProject() {
		$(this.window).resize(function(e) {
			o.viewer.resize($('div#viewport').width(), $('div#viewport').height());
		});

		var dialog = $('<div />').attr('title', 'Open a project');
		var projectList = $('<ul />').attr('id', 'projects').appendTo(dialog);

		o.bimServerApi.call("Bimsie1ServiceInterface", "getAllProjects", {onlyActive: true, onlyTopLevel: false}, function(projects){
			projects.forEach(function(project){
				if(project.lastRevisionId != -1)
				{
					var link = $('<a />')
					.attr('href', '#')
					.attr('title', 'Laad het project ' + project.name)
					.click(function(e) {
						e.preventDefault();
						var project = $(this).parent().data('project');
						if(project == null) return;
						loadProject(project);
						$(dialog).dialog('close');
					})
					.text(project.name);
					$(projectList).append($('<li />').data('project', project).append(link));
				}
			});
			$(projectList).menu();

			$(dialog).dialog({
				autoOpen: true,
				width: 450,
				modal: true,
				closeOnEscape: false,
				open: function(event, ui) { $(".ui-dialog .ui-dialog-titlebar-close").hide(); },
				close: function() { $(dialog).remove(); }
			});
		});
	}
	
	function connect(server, email, password) {
		loadBimServerApi(server, null, function(bimServerApi){
			o.bimServerApi = bimServerApi;
			o.bimServerApi.login(email, password, false, function(){
				$(dialog).dialog('close');
				o.viewer = new BIMSURFER.Viewer(o.bimServerApi, 'viewport');
				resize();
				
				o.viewer.loadScene(function(){
					var clickSelect = o.viewer.getControl("BIMSURFER.Control.ClickSelect");
					clickSelect.activate();
					clickSelect.events.register('select', o.nodeSelected);
					clickSelect.events.register('unselect', o.nodeUnselected);
				});
				
				showSelectProject();
			});
		});
	}

	var dialog = $('<div />').attr('class', 'form').attr('title', 'Connect to a server');

	function connectCallback() {
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

	function buildDecomposedTree(object, tree, indent) {
		var div = $("<div></div>");
		for (var i=0; i<indent; i++) {
			div.append("&nbsp;");
		}
		div.append(object.Name);
		tree.append(div);
		object.getIsDecomposedBy(function(isDecomposedBy){
			isDecomposedBy.getRelatedObjects(function(relatedObject){
				buildDecomposedTree(relatedObject, div, indent+1);
			});
		});
	}
	
	function resize(){
		$("#viewport").width($(window).width() + "px");
		$("#viewport").height(($(window).height() - 98) + "px");
		$("#viewport").css("width", $(window).width() + "px");
		$("#viewport").css("height", ($(window).height() - 98) + "px");
		o.viewer.resize($('div#viewport').width(), $('div#viewport').height());
	};
	
	function loadProject(project) {
		o.model = o.bimServerApi.getModel(project.oid, project.lastRevisionId, project.schema, false, function(model){
//			model.getAllOfType("IfcProject", true, function(project){
//				buildDecomposedTree(project, $(".tree"), 0);
//			});
		});

		o.bimServerApi.call("ServiceInterface", "getRevisionSummary", {roid: project.lastRevisionId}, function(summary){
			summary.list.forEach(function(item){
				if (item.name == "IFC Entities") {
					var _this = this;
					var dialog = $('<div />').attr('title', 'What types do you want to load?');
					var typesList = $('<ul />').attr('id', 'types').appendTo(dialog);

					item.types.forEach(function(type){
						var checkbox = $('<input />').attr('type', 'checkbox').attr('name', 'types').val(type.name);
						
						if(BIMSURFER.Constants.defaultTypes.indexOf(type.name) != -1) {
							$(checkbox).attr('checked', 'checked');
						}
						
						$('<div />').append($('<label />').text(type.name).prepend(checkbox)).appendTo(typesList);
					});

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

								var toLoad = {};
								$(checkedTypes).each(function()
								{
									toLoad[$(this).val()] = {mode: 0};
								});

								$(dialog).dialog('close');

								var layerLists = $('div#leftbar').find('div#layer_list').find('.data');
								if($(layerLists).is('.empty')) {
									$(layerLists).empty();
								}

								$(window).resize(resize);
								
		                        var models = {};
		                        models[project.lastRevisionId] = o.model;
		                        for (var key in toLoad) {
		                        	o.model.getAllOfType(key, true, function(object){
		                        		object.trans.mode = 0;
		                        	});
		                        }
		                        var geometryLoader = new GeometryLoader(o.bimServerApi, models, o.viewer);
		                   
		                        var progressdiv = $("<div class=\"progressdiv\">");
		                        var text = $("<div class=\"text\">");
		                        text.html(project.name);
		                        var progress = $("<div class=\"progress progress-striped\">");
		                        var progressbar = $("<div class=\"progress-bar\">");
		                        progressdiv.append(text);
		                        progressdiv.append(progress);
		                        progress.append(progressbar);
		                        
		                        //containerDiv.find(".progressbars").append(progressdiv);
		                        
		                        geometryLoader.addProgressListener(function(progress){
		                        	progressbar.css("width", progress + "%");
		                        	if (progress == 100) {
		                        		progressdiv.fadeOut(800);
		                        	}
		                        });
		                        geometryLoader.setLoadTypes(project.lastRevisionId, project.schema, toLoad);
		                        o.viewer.loadGeometry(geometryLoader);
							}
						}
					});
				}
			});
		});
	}
	
	function showProperty (propertySet, property, headerTr, editable){
		var tr = $("<tr></tr>");
		tr.attr("oid", property.__oid);
		tr.attr("psetoid", propertySet.__oid);
		headerTr.after(tr);
		if (property.changedFields != null && (property.changedFields["NominalValue"] || property.changedFields["Name"])) {
			tr.addClass("warning");
		}
		
		tr.append("<td>" + property.Name + "</td>");
		getValue(tr, property, editable);
	};
	
	function showProperties(propertySet, headerTr) {
		propertySet.getHasProperties(function(property){
			if (property.__type == "IfcPropertySingleValue") {
				showProperty(propertySet, property, headerTr);
			}
		});
	}
	
	function showPropertySet(propertySet) {
		var headerTr = $("<tr class=\"active\"></tr>");
		headerTr.attr("oid", propertySet.__oid);
		headerTr.attr("uri", propertySet.Name);
		if (propertySet.changedFields != null && propertySet.changedFields["Name"]) {
			headerTr.addClass("warning");
		}
		$("#object_info table tbody").append(headerTr);
		var headerTd = $("<td></td>");
		headerTr.append(headerTd);

		headerTd.append("<b>" + propertySet.Name + "</b>");
		showProperties(propertySet, headerTr);
	}

	function getValue(tr, property, editable) {
		(function (tr) {
			property.getNominalValue(function(value){
				var td = $("<td>");
				var v = value == null ? "" : value.value;
				var span = $("<span class=\"value nonEditable\">" + v + "</span>");
				td.append(span);
				tr.append(td);
			});
		} )(tr);
	}
	
	function nodeSelected(node) {
		$("#object_info table tbody tr").remove();
		if (node.id != null) {
			o.model.get(node.id, function(product){
				if (product.oid == node.id) {
					var tr = $("<tr></tr>");
					tr.append("<b>" + product.__type + "</b>");
					if (product.name != null) {
						tr.append("<b>" + product.name + "</b>");
					}
					$("#object_info table tbody").append(tr);
					product.getIsDefinedBy(function(isDefinedBy){
						if (isDefinedBy.__type == "IfcRelDefinesByProperties") {
							isDefinedBy.getRelatingPropertyDefinition(function(propertySet){
								if (propertySet.__type == "IfcPropertySet") {
									showPropertySet(propertySet);
								}
							});
						}
					});
				}
			});
		}
//		if(typeof this.SYSTEM.scene.data.properties[node.getId()] == 'undefined') {
//			return;
//		}
//		var infoContainer = $('#object_info').find('.data');
//		$(infoContainer).empty();
//
//		var properties = this.SYSTEM.scene.data.properties[node.getId()];
//
//		for(var i in properties) {
//			if(typeof properties[i] == 'string') {
//				$('<div />').append($('<label />').text(i)).appendTo(infoContainer);
//				$('<div />').text(properties[i]).appendTo(infoContainer);
//			}
//		}
	}

	function nodeUnselected(node) {
		$("#object_info table tbody tr").remove();
//		var infoContainer = $('#object_info').find('.data');
//		$(infoContainer).empty();
//		$('<p>').text('No object selected.').appendTo(infoContainer);
	}
});
