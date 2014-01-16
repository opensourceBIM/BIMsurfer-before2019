BIMSURFER.Control.LayerList = BIMSURFER.Class(BIMSURFER.Control,
{
	CLASS: "BIMSURFER.Control.LayerList",
	showCheckboxes: true,
	autoDraw: true,

	redraw: function()
	{
		$(this.div).empty();
		$(this.DOMelement).remove();
		var controlClass = this.CLASS.replace(/\./g,"-");
		this.DOMelement = $('<ul />').addClass(controlClass);
		if(this.active)
		{
			$(this.div).append(this.DOMelement);

			for(var i = 0; i < this.SYSTEM.loadedProjects.length; i++) {
				var project = this.SYSTEM.loadedProjects[i];
				var projectLi = $('<li />').addClass(controlClass + '-Project');
				$('<span />').addClass(controlClass + '-Project-Title').text(project.name).appendTo(projectLi);
				var projectUl = $('<ul />').addClass(controlClass + '-Revisions').appendTo(projectLi);

				for(var x = 0; x < project.loadedRevisions.length; x++) {
					var revision = project.loadedRevisions[x];
					var revisionLi = $('<li />').addClass(controlClass + '-Revision');
					if(project.loadedRevisions.length > 1) {
						$('<span />').addClass(controlClass + '-Revision-Title').text(revision.comment).appendTo(revisionLi);
					}
					var revisionUl = $('<ul />').addClass(controlClass + '-ifcTypes').appendTo(revisionLi);

					for(var y = 0; y < revision.ifcTypes.length; y++) {
						var ifcType = revision.ifcTypes[y];
						var typeLi = $('<li />').addClass(controlClass + '-ifcType');
						var label = $('<label />').addClass(controlClass + '-ifcType-Label').appendTo(typeLi);

						if(this.showCheckboxes) {
							var _this = this;
							var checkbox = $('<input />')
													.attr('type', 'checkbox')
													.attr('name', controlClass + '-' + project.oid + '-' + revision.oid + '-' + ifcType)
													.addClass(controlClass + '-ifcType-Checkbox')
													.data('ifcType', ifcType)
													.data('revision', revision)
													.change(function() {
															if($(this).is(':checked')) {
																_this.SYSTEM.showType($(this).data('ifcType'), $(this).data('revision'));
															} else {
																_this.SYSTEM.hideType($(this).data('ifcType'), $(this).data('revision'));
															}
													});
							$('<span />').addClass(controlClass + '-ifcType-checkboxContainer').append(checkbox).appendTo(label);
							if(revision.visibleTypes.indexOf(ifcType.toLowerCase()) > -1) {
								$(checkbox).attr('checked', 'checked');
							}
						}

						$('<span />').addClass(controlClass + '-ifcType-Name').text(ifcType).appendTo(label);
						$(typeLi).appendTo(revisionUl);
					}
					$(revisionLi).appendTo(projectUl);
				}

				$(projectLi).appendTo(this.DOMelement);
			}
		}
		return this;
	},
	initEvents: function() {
		if(!this.SYSTEM) { return; }

		if(this.active) {
			var _this = this;
			this.SYSTEM.events.register('revisionSceneLoaded', function() {
				if(_this.autoDraw) { _this.redraw(); }
			});

			this.SYSTEM.events.register('tagMaskUpdated', function() {
				if(_this.autoDraw) { _this.redraw(); }
			});
		}
	}
});