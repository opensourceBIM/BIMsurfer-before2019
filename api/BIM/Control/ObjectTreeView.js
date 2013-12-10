BIM.Control.ObjectTreeView = BIM.Class(BIM.Control,
{
	CLASS: "BIM.Control.ObjectTreeView",
	showCheckboxes: true,

	projectHtml: null,

	__construct: function(div) {
		if(typeof div == 'string') {
			this.div = $(document).find('div#' + div)[0] || null;
		} else if($(div).is('div')) {
			this.div = div;
		}

		this.events = new BIM.Events(this);

		//this.projectHtml = '<li id="{ID}"
	},

	redraw: function()
	{
		$(this.div).empty();
		$(this.DOMelement).remove();
		var classIdPrefix = this.CLASS.replace(/\./g,"-");
		this.DOMelement = $('<ul />').addClass(classIdPrefix);
		if(this.active)
		{
			$(this.div).append(this.DOMelement);

			var relationships = this.surfer.scene.data.relationships;
			var showCheckboxes = this.showCheckboxes;

			function drawRelationships(objects, relationship) {
				if(objects == null || objects.length == 0) {
					return null;
				}

				var div = $('<div />');
				$('<span />').text(relationship).appendTo(div);
				var list = $('<ul />').appendTo(div);

				for(var i = 0; i < objects.length; i++) {
					$(list).append(drawObject(objects[i]));
				}
				return div;
			}

			function drawObject(object) {
				var li = $('<li />');
				var div = $('<div />').appendTo(li);
				if(showCheckboxes) {
					$('<span />').append($('<input />').attr('type', 'checkbox').attr('checked', 'checked')).appendTo(div);
				}
				$('<span />').text(object.name).appendTo(div);
				$('<span />').text('(' + object.type + ')');

				$(li).append(drawRelationships(object.decomposedBy, 'Decomposed by'));
				$(li).append(drawRelationships(object.definedBy, 'Defined by'));
				$(li).append(drawRelationships(object.contains, 'Contains'));
				return li;
			}

			function drawProject(project) {
				var projLi = $('<li />').attr('id', classIdPrefix + '-project-' + project.id).addClass( + '-project');
				$('<div />').appendTo(projLi)
					.append($('<span />').addClass(classIdPrefix + '-project-name').text(project.name))
					.append($('<span />').addClass(classIdPrefix + '-project-type').text('(' + project.type + ')'));

				$(projLi).append(drawRelationships(project.decomposedBy, 'Decomposed by'));
				$(projLi).append(drawRelationships(project.definedBy, 'Defined by'));
				$(projLi).append(drawRelationships(project.contains, 'Contains'));

				return projLi;
			}

			for(var i = 0; i < this.surfer.scene.data.relationships.length; i++) {
				var project = this.surfer.scene.data.relationships[i];

				$(this.DOMelement).append(drawProject(project));

/*

		ifcRelationships = function(type, rel, indent) {
			var html, obj, _i, _len;
			if ((rel != null) && rel.length > 0) {
				indent = Math.min(indent + 1, 6);
				html = "<ul class='controls-tree'>";
				html += "<div class='controls-tree-heading'><hr><h4>" + type + "</h4></div>";
				for (_i = 0, _len = rel.length; _i < _len; _i++) {
					obj = rel[_i];
					html += ifcObjectDescription(obj, indent);
				}
				return html += "</ul>";
			} else {
				return "";
			}
		};
ifcObjectDescription = function(obj, indent) {
			return "<li class='controls-tree-rel' id='" + obj.id + "'><div class='controls-tree-item'><span class='indent-" + String(indent) + "'/>"
					+ "<input type='checkbox' checked='checked'> " + obj.name + "<span class='controls-tree-postfix'>(" + obj.type + ")</span></div>"
					+ (ifcDefinedBy(obj.decomposedBy, indent)) + (ifcDefinedBy(obj.definedBy, indent)) + (ifcContains(obj.contains, indent)) + "</li>";
		};
		ifcProject = function(obj) {
			return "<li class='controls-tree-root' id='" + obj.id + "'><div class='controls-tree-item'>" + obj.name + "<span class='controls-tree-postfix'>(" + obj.type
					+ ")</span></div>" + (ifcDefinedBy(obj.decomposedBy, 0)) + (ifcDefinedBy(obj.definedBy, 0)) + (ifcContains(obj.contains, 0)) + "</li>";
		};
*/




			}
		}
		return this;
	},
	setSurfer: function(surfer)
	{
		this.surfer = surfer;
		return this;
	}
});