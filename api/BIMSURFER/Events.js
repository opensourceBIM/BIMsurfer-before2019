BIMSURFER.Events = BIMSURFER.Class({
	CLASS: 'BIMSURFER.Events',
	SYSTEM: null,

	listeners: {},
	object: null,

	__construct: function(system, object) {
		this.SYSTEM = system;
		this.object = object;
		this.listeners = {};
	},

	register: function(event, callback, object) {
		if(typeof event != 'string' || typeof callback != 'function') {
			return;
		}

		if(!this.listeners[event]) {
			this.listeners[event] = new Array();
		}
		this.listeners[event].push({object: (typeof object == 'undefined' || object == null ? this.object : object), callback: callback});
	},

	unregister: function(event, callback, object) {
		if(typeof event != 'string' || typeof callback != 'function') {
			return;
		}

		object = (typeof object == 'undefined' || object == null ? this.object : object);

		if(this.listeners[event]) {
			for(var i = 0; i < this.listeners[event].length; i++) {
				if(this.listeners[event][i].object == object && this.listeners[event][i].callback == callback) {
					this.listeners[event].splice(i, 1);
					break;
				}
			}
		}
	},

	trigger: function(event, eventArguments, object) {
		if(typeof event != 'string') {
			return false;
		}
		eventArguments = eventArguments || new Array();
		if(typeof eventArguments == 'undefined') {
			eventArguments = new Array();
		} else if(!BIMSURFER.Util.isArray(eventArguments)) {
			eventArguments = [eventArguments];
		}

		if(event.substring(0, 5).toLowerCase() == 'mouse') {
			eventArguments[0] = this.normalizeEvent(eventArguments[0]);
		}

		if(!this.listeners[event] || this.listeners[event].length == 0) {
			return true;
		}

		for(var i = 0; i < this.listeners[event].length; i++) {
			var continueEvent = null;
			if(typeof object != 'undefined') {
				continueEvent = this.listeners[event][i].callback.apply(object, eventArguments);
			} else {
				continueEvent = this.listeners[event][i].callback.apply(this.listeners[event][i].object, eventArguments);
			}

			if(continueEvent === false) {
				return false;
			}
		}
		return true;
	},

	normalizeEvent: function(event) {
		if(!event.offsetX) {
			event.offsetX = (event.pageX - $(event.target).offset().left);
			event.offsetY = (event.pageY - $(event.target).offset().top);
		}
		return event;
	}
});