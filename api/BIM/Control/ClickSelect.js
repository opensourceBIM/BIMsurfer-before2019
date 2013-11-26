"use strict"
BIM.Control.ClickSelect = BIM.Class(BIM.Control, {
	CLASS: "BIM.Control.CLickSelect",
	surfer: null,
	active: false,
	events: null,

	downX: null,
	downY: null,

	highlighted: null,
	lastSelected: 0,

	__construct: function(params) {
		this.events = new BIM.Events(this);
	},

	activate: function() {

		if(this.surfer == null || !this.surfer.sceneLoaded) {
			console.error('Cannot activate ' + this.CLASS + ': Surfer or scene not ready');
			return null;
		}
		this.active = true;

		this.surfer.events.register('pick', this.pick, this);
		this.surfer.events.register('mouseDown', this.mouseDown, this);
		this.surfer.events.register('mouseUp', this.mouseUp, this);
	},

	mouseDown: function(e) {
		this.downX = e.offsetX;
		this.downY = e.offsetY;
	},

	mouseUp: function(e) {
		if(((e.offsetX > this.downX) ? (e.offsetX - this.downX < 5) : (this.downX - e.offsetX < 5)) &&	((e.offsetY > this.downY) ? (e.offsetY - this.downY < 5) : (this.downY - e.offsetY < 5))) {
			if(Date.now() - this.lastSelected > 10) {
				this.unselect();
			}
		}
	},

	pick: function(hit) {
		this.unselect();
		this.highlighted = this.surfer.scene.findNode(hit.nodeId);
		this.highlighted.insert('node', BIM.Constants.highlightSelectedObject);
		this.lastSelected = Date.now();
		this.events.trigger('select', [this.highlighted]);
	},

	unselect: function() {
		if(this.highlighted) {
			var node = this.surfer.scene.findNode(BIM.Constants.highlightSelectedObject.id);
			node.splice();
			this.events.trigger('unselect', [this.highlighted]);
			this.highlighted = null;
		}
	},
});