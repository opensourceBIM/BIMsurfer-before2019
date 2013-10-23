BIMsurfer.Control =
{
	LayerList: function(div)
	{
		this.layers = new Array();
		this.showCheckboxes = true;
		this.DOMelement = $('<ul />').addClass('BIM-Control-LayerList');
		this.div = div;
		this.active = true;
		this.viewer = null;

		if(this.div)
		{
			$(this.div).append(this.DOMelement);
		}

		this.setViewer = function(viewer)
		{
			this.viewer = viewer;
			this.layers = viewer.loadedTypes;

			this.viewer.bindEvent('layerAdded', this.addLayer);
			this.viewer.bindEvent('layerRemoved', this.removeLayer);
		}

		this.addLayer = function(layer)
		{
			this.layers.push(layer);
			this.redraw();
		}

		this.removeLayer = function(layer)
		{
			var index = this.layers.indexOf(layer);
			if(index > -1)
			{
				this.layers.splice(index, 1);
				this.redraw();
			}
		}
		this.activate = function()
		{
			this.active = true;
			this.redraw();
		}
		this.deactivate = function()
		{
			this.active = false;
			this.redraw();
		}

		this.redraw = function()
		{

			$(this.DOMelement).find('li').remove();
			if(this.active)
			{
				$(this.DOMelement).show();

				for(var i in this.layers)
				{
					var layer = this.layers[i];
					var li = $('<li />').addClass('BIM-Control-LayerList-layer').data('layer', layer);
					var content = li;

					if(this.showCheckboxes)
						content = $('<label />').addClass('BIM-Control-LayerList-layer-label').appendTo(li);

					$(content).text(layer.name);
					if(this.showCheckboxes)
					{
						console.debug('Todo: Add checkbox change event');
						$('<input />').attr('type', 'checkbox').prependTo(content);
					}

					$(li).appendTo(this.DOMelement);
				}
			}
			else
			{
				$(this.DOMelement).hide();
			}
			return this.DOMelement;
		}
	}
};