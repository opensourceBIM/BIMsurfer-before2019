BIM.Events = BIM.Class(
{
	CLASS: 'BIM.Events',

	listeners: {},
	object: null,

	__construct: function(object)
	{
		this.object = object;
	},

	register: function(event, callback, object)
	{
		if(typeof event != 'string' || typeof callback != 'function') return;

		if(!this.listeners[event])
			this.listeners[event] = new Array();
		this.listeners[event].push({object: (typeof object == 'undefined' || object == null ? this.object : object), callback: callback});
	},

	unregister: function(event, callback, object)
	{
		if(typeof event != 'string' || typeof callback != 'function') return;

		object = (typeof object == 'undefined' || object == null ? this.object : object);

		if(this.listeners[event])
		{
			for(var i = 0; i < this.listeners[event].length; i++)
			{
				if(this.listeners[event][i].object == object && this.listeners[event][i].callback == callback)
				{
					this.listeners[event].splice(i, 1);
					break;
				}
			}
		}
	},

	trigger: function(event, eventArguments, object)
	{
		if(typeof event != 'string') return false;

		if(event.substring(0, 5).toLowerCase() == 'mouse') eventArguments[0] = this.normalizeEvent(eventArguments[0]);

		if(!this.listeners[event] || this.listeners[event].length == 0) return true;

		eventArguments = eventArguments || new Array();

		for(var i = 0; i < this.listeners[event].length; i++)
		{
			var continueEvent
			if(typeof object != 'undefined')
				continueEvent = this.listeners[event][i].callback.apply(object, eventArguments);
			else
				continueEvent = this.listeners[event][i].callback.apply(this.listeners[event][i].object, eventArguments);

			if(continueEvent === false)
				return false;
		}
		return true;
	},

	normalizeEvent: function(event)
	{
		if(!event.offsetX)
		{
			event.offsetX = (event.pageX - $(event.target).offset().left);
			event.offsetY = (event.pageY - $(event.target).offset().top);
		}
		return event;
	}
});