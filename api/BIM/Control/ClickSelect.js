"use strict"
BIM.Control.ClickSelect = BIM.Class(BIM.Control,
{
	CLASS: "BIM.Control.CLickSelect",
	surfer: null,
	active: false,
	events: null,

	downX: null,
	downY: null,

	highlighted: null,

	__construct: function(params)
	{
		this.events = new BIM.Events(this);
	},

	activate: function()
	{

		if(this.surfer == null || !this.surfer.sceneLoaded)
		{
			console.error('Cannot activate ' + this.CLASS + ': Surfer or scene not ready');
			return null;
		}
		this.active = true;

		this.surfer.events.register('pick', this.pick, this);
	},
	pick: function(hit)
	{
		this.unHighlight();
		this.highlighted = this.surfer.scene.findNode(hit.nodeId);
		this.highlighted.insert('node', BIM.Constants.highlightSelectedObject);

		this.events.trigger('select', [this.highlighted]);
	},
	unHighlight: function()
	{
		if(this.highlighted)
		{
			var node = this.surfer.scene.findNode(BIM.Constants.highlightSelectedObject.id);
			node.splice();
			//console.debug('&&&&&&&&&&&&&&&&',  == this.highlighted);
			//this.highlighted.splice();
		}
	}

});