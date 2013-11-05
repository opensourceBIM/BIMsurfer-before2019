BIM.Control.PanOrbit = BIM.Class(
{
	CLASS: "BIM.Control.PanOrbit",
	surfer: null,
	active: false,
	events: null,
	sceneLoaded: false,

	dragging: false,
	orbiting: false,
	lastX: null,
	lastY: null,
	downX: null,
	downY: null,

	startEye: null,

	yaw: 0,
	pitch: 0,
	zoom: 1,

	eye: { x: 0, y: 0, z: 0 },
	look: { x: 0, y: 0, z: 0 },
	beginPivot: null,

	lookat: null,

	__construct: function(params)
	{
		this.events = new BIM.Events(this);
		if(typeof params != 'undefined')
		{
			this.eye = params.eye || this.eye;
			this.look = params.look || this.look;
			this.zoom = params.zoom || this.zoom;
		}
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
		if(this.surfer == null || !this.surfer.sceneLoaded)
		{
			console.error('Cannot activate ' + this.CLASS + ': Surfer or scene not ready');
			return null;
		}

		this.eye = this.surfer.scene.findNode('main-lookAt').getEye();
		this.startEye = this.surfer.scene.findNode('main-lookAt').getEye();
		this.look = this.surfer.scene.findNode('main-lookAt').getLook();
		this.beginPivot = BIM.Util.glMatrix.vec3.fromValues(this.look.x, this.look.y, this.look.z);

	  	this.surfer.events.register('mouseDown', this.mouseDown, this);
		this.surfer.events.register('mouseUp', this.mouseUp, this);
		this.surfer.events.register('mouseMove', this.mouseMove, this);
		this.surfer.events.register('mouseWheel', this.mouseWheel, this);
		this.surfer.events.register('touchStart', this.touchStart, this);
		this.surfer.events.register('touchMove', this.touchMove, this);
		this.surfer.events.register('touchEnd', this.touchEnd, this);

		var _this = this;
		this.surfer.scene.on('tick', function()
		{
			if(_this.orbiting)
			{
				var eye = BIM.Util.glMatrix.vec3.fromValues(_this.startEye.x, _this.startEye.y, _this.startEye.z);
				var look = BIM.Util.glMatrix.vec3.fromValues(_this.beginPivot[0], _this.beginPivot[1], _this.beginPivot[2]);

				var eyeVec = BIM.Util.glMatrix.vec3.create();
				BIM.Util.glMatrix.vec3.sub(eyeVec, eye, look)

				var mat = BIM.Util.glMatrix.mat4.create();
				BIM.Util.glMatrix.mat4.rotateY(mat, mat, -_this.yaw * BIM.Constants.camera.orbitSpeedFactor);
				BIM.Util.glMatrix.mat4.rotateX(mat, mat, -_this.pitch * BIM.Constants.camera.orbitSpeedFactor);

				var eye3 = BIM.Util.glMatrix.vec3.create();
				BIM.Util.glMatrix.vec3.transformMat4(eye3, eye, mat);

				// Update view transform
				var lookAt = _this.surfer.scene.findNode('main-lookAt');

				lookAt.setLook({x: look[0], y: look[1], z: look[2] });
				lookAt.setEye({x: look[0] - eye3[0], y: look[1] - eye3[1], z: look[2] - eye3[2] });

				_this.orbiting = false;
			}
		});


		this.active = true;

		return this;
	},

	deactivate: function()
	{
		this.active = false;
		this.surfer.events.unregister('mouseDown', this.mouseDown, this);
		this.surfer.events.unregister('mouseUp', this.mouseUp, this);
		this.surfer.events.unregister('mouseMove', this.mouseMove, this);
		this.surfer.events.unregister('mouseWheel', this.mouseWheel, this);
		this.surfer.events.unregister('touchStart', this.touchStart, this);
		this.surfer.events.unregister('touchMove', this.touchMove, this);
		this.surfer.events.unregister('touchEnd', this.touchEnd, this);
		return this;
	},

	actionMove: function(x, y)
	{
		if(this.dragging)
		{
			this.yaw += (x - this.lastX) * 0.1;
			this.pitch -= (y - this.lastY) * 0.1;
			this.orbiting = true;
		}
		this.lastX = x;
		this.lastY = y;
	},
	mouseDown: function(e)
	{
		this.lastX = this.downX = e.offsetX;
		this.lastY = this.lastY = e.offsetY;
		this.dragging = true;
	},
	mouseUp: function(e)
	{
		if(this.dragging && ((e.offsetX > this.downX) ? (e.offsetX - this.downX < 5) : (this.downX - e.offsetX < 5)) &&	((e.offsetY > this.downY) ? (e.offsetY - this.downY < 5) : (this.downY - e.offsetY < 5)))
			this.pick(e.offsetX, e.offsetY);
		this.dragging = false;
	},
	mouseMove: function(e)
	{
		this.actionMove(e.offsetX, e.offsetY);
	},
	mouseWheel: function(e) { console.debug('mouseWheel', e);},
	touchStart: function(e) { console.debug('touchStart', e);},
	touchMove: function(e) { console.debug('touchMove', e);},
	touchEnd: function(e) {console.debug('touchEnd', e); },

});