"use strict"
BIM.Control = BIM.Class({
	CLASS: 'BIM.Control',
	div: null,
	DOMelement: null,
	surfer: null,
	active: false,
	events: null,

	__construct: function(div) {
		if(typeof div == 'string') {
			this.div = $(document).find('div#' + div)[0] || null;
		} else if($(div).is('div')) {
			this.div = div;
		}

		this.events = new BIM.Events(this);
	},

	redraw: function() {
		$(this.div).empty();
		$(this.DOMelement).remove();
		this.DOMelement = $('<div />').addClass(this.CLASS.replace(/\./g,"-"));
		if(this.active) {
			$(this.div).append(this.DOMelement);
		}
		return this;
	},

	setSurfer: function(surfer) {
		this.surfer = surfer;
		return this;
	},

	removeFromSurfer: function() {
		this.surfer = null;
		return this;
	},

	initEvents: function() {

	},

	activate: function() {
		if(this.div) {
			this.active = true;
			this.redraw();
			this.initEvents();
			this.show();
		}
		return this;
	},

	deactivate: function() {
		this.active = false;
		this.initEvents();
		$(this.DOMelement).remove();
		this.DOMelement = null;
		return this;
	},

	show: function(speed) {
		switch(speed) {
			case 'fast':
			case 'normal':
			case 'slow':
				$(this.DOMelement).stop().fadeIn(speed);
				break;
			default:
				$(this.DOMelement).stop().show();
		}
		return this;
	},
	hide: function(speed) {
		switch(speed) {
			case 'fast':
			case 'normal':
			case 'slow':
				$(this.DOMelement).stop().fadeOut(speed);
				break;
			default:
				$(this.DOMelement).stop().hide();
		}
		return this;
	}
});