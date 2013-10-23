BIM.Control.LayerList = BIM.Class(BIM.Control,
{
	CLASS: "BIM.Control.LayerList",
	showCheckboxes: true,

	redraw: function()
	{
		$(this.div).empty();
		$(this.DOMelement).remove();
		this.DOMelement = $('<ul />').addClass(this.CLASS.replace(/\./g,"-"));
		if(this.active)
		{
			$(this.div).append(this.DOMelement);

		//	for(var i = 0; i < this.surfer.server.
		}
		return this;
	},
	setSurfer: function(surfer)
	{
		this.surfer = surfer;

		this.surfer.register('loggedin', this.redraw);
		return this;
	}
});