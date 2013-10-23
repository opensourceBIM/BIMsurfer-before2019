BIM.Control.PanOrbit = BIM.Class(
{
	CLASS: "BIM.Control.PanOrbit",
	surfer: null,
	active: false,
	events: null,

	dragging: false,

	__construct: function()
	{
		this.events = new BIM.Events(this);
	},
	setSurfer: function(surfer)
	{
		this.surfer = surfer;
		return this;
	},
	removeFromSurfer: function()
	{
		this.surfer = null;
		return this;
	},

	activate: function()
	{
		this.surfer.events.register('mouseDown', this.mouseDown);
		this.surfer.events.register('mouseUp', this.mouseUp);
		this.surfer.events.register('mouseMove', this.mouseMove);
		this.surfer.events.register('mouseWheel', this.mouseWheel);
		this.surfer.events.register('touchStart', this.touchStart);
		this.surfer.events.register('touchMove', this.touchMove);
		this.surfer.events.register('touchEnd', this.touchEnd);

		this.active = true;
		return this;
	},

	deactivate: function()
	{
		this.active = false;
		this.surfer.events.unregister('mouseDown', this.mouseDown);
		this.surfer.events.unregister('mouseUp', this.mouseUp);
		this.surfer.events.unregister('mouseMove', this.mouseMove);
		this.surfer.events.unregister('mouseWheel', this.mouseWheel);
		this.surfer.events.unregister('touchStart', this.touchStart);
		this.surfer.events.unregister('touchMove', this.touchMove);
		this.surfer.events.unregister('touchEnd', this.touchEnd);
		return this;
	},

	mouseDown: function(e) { console.debug('mouseDown', e); },
	mouseUp: function(e) { console.debug('mouseUp', e); },
	mouseMove: function(e) { console.debug('mouseMove', e);},
	mouseWheel: function(e) { console.debug('mouseWheel', e);},
	touchStart: function(e) { console.debug('touchStart', e);},
	touchMove: function(e) { console.debug('touchMove', e);},
	touchEnd: function(e) {console.debug('touchEnd', e); },

});