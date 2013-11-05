BIM.Control.PanOrbit = BIM.Class(
{
	CLASS: "BIM.Control.PanOrbit",
	surfer: null,
	active: false,
	events: null,
	sceneLoaded: false,

	dragging: false,
	lastX: null,
	lastY: null,
	downX: null,
	downY: null,

	yaw: 0,
	pitch: 0,

	eye: { x: 0, y: 0, z: 0 },
	look: { x: 0, y: 0, z: 0 },

	lookat: null,

	__construct: function(params)
	{
		this.events = new BIM.Events(this);
		this.eye = params.eye || this.eye;
		this.look = params.look || this.look;


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


	getOrbitLookAt: function(dAngles, orbitUp, lookAt)
	{
		if (dAngles[0] === 0.0 && dAngles[1] === 0.0)
		{
			return {
				eye : lookAt.eye,
				look : lookAt.look,
				up : lookAt.up
			};
		}
		var eye0 = [lookAt.eye.x, lookAt.eye.y, lookAt.eye.z];
		var up0 = [lookAt.up.x, lookAt.up.y, lookAt.up.z];
		var look = [lookAt.look.x, lookAt.look.y, lookAt.look.z];

		var axes = [ [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ] ];
		var axesNorm = [ [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ] ];
		var eye1 = [ 0.0, 0.0, 0.0 ];
		var tangentError = [ 0.0, 0.0, 0.0 ];
		var up1 = [ 0.0, 0.0, 0.0 ];

		SceneJS_math_subVec3(eye0, look, axes[2]);
		SceneJS_math_cross3Vec3(up0, axes[2], axes[0]);
		SceneJS_math_normalizeVec3(axes[0], axesNorm[0]);
		SceneJS_math_normalizeVec3(axes[2], axesNorm[2]);
		SceneJS_math_cross3Vec3(axesNorm[2], axesNorm[0], axesNorm[1]);

		console.debug('axesNorm:', axesNorm, 'dAngles', dAngles);

		var rotAxis =
		[
			axesNorm[0][0] * -dAngles[1] + axesNorm[1][0] * -dAngles[0],
			axesNorm[0][1] * -dAngles[1] + axesNorm[1][1] * -dAngles[0],
			axesNorm[0][2] * -dAngles[1] + axesNorm[1][2] * -dAngles[0]
		];
		var dAngle = SceneJS_math_lenVec2(dAngles);
		var rotMat = SceneJS_math_rotationMat4v(dAngle, rotAxis);

		var transformedX = SceneJS_math_transformVector3(rotMat, axesNorm[0]);
		var transformedZ = SceneJS_math_transformVector3(rotMat, axes[2]);

		console.debug('transformedX', transformedX, 'transformedZ', transformedZ);

		SceneJS_math_addVec3(look, transformedZ, eye1);
		SceneJS_math_mulVec3(transformedX, orbitUp, tangentError);
		SceneJS_math_subVec3(transformedX, tangentError);
		SceneJS_math_cross3Vec3(transformedZ, transformedX, up1);
		console.debug('transformedX', transformedX, 'transformedZ', transformedZ);
		console.debug('--------');

		eye1 =
		{
			x: eye1[0],
			y: eye1[1],
			z: eye1[2]
		};
		up1 =
		{
			x: up1[0],
			y: up1[1],
			z: up1[2]
		};
		var result =
		{
			eye: eye1,
			look: lookAt.look,
			up: up1

		};
		return result;

	},

	activate: function()
	{
	  	this.surfer.events.register('mouseDown', this.mouseDown, this);
		this.surfer.events.register('mouseUp', this.mouseUp, this);
		this.surfer.events.register('mouseMove', this.mouseMove, this);
		this.surfer.events.register('mouseWheel', this.mouseWheel, this);
		this.surfer.events.register('touchStart', this.touchStart, this);
		this.surfer.events.register('touchMove', this.touchMove, this);
		this.surfer.events.register('touchEnd', this.touchEnd, this);

		if(this.surfer == null || !this.surfer.sceneLoaded)
		{
			console.error('Cannot activate ' + this.CLASS + '... Surfer or scene not ready');
			return null;
		}
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
	update: function(x, y)
	{

		var delta = new Array(x - this.lastX, y - this.lastY);

		if (delta[0] == 0 && delta[1] == 0) {
			return; // avoids disappearing
		}

		// object
		var deltaLength = SceneJS_math_lenVec2(delta);


		var orbitAngles = [ 0.0, 0.0 ];
		SceneJS_math_mulVec2Scalar(delta, BIM.Constants.camera.orbitSpeedFactor / deltaLength, orbitAngles);


		orbitAngles =
		[
			BIM.Constants.clamp(orbitAngles[0], -BIM.Constants.camera.maxOrbitSpeed, BIM.Constants.camera.maxOrbitSpeed),
			BIM.Constants.clamp(orbitAngles[1], BIM.Constants.camera.maxOrbitSpeed, BIM.Constants.camera.maxOrbitSpeed)
		];

		if ((isNaN(orbitAngles[0])) || (Math.abs(orbitAngles[0])) === Infinity)
			orbitAngles[0] = 0.0;
		if ((isNaN(orbitAngles[1])) || (Math.abs(orbitAngles[1])) === Infinity)
			orbitAngles[1] = 0.0;

	   //	this.getOrbitLookAt(othis.scene.findNode('main-lookAt'), orbitAngles, [ 0.0, 0.0, 1.0 ]);


		var node = this.surfer.scene.findNode('main-lookAt');
		var orbitLookAt = this.getOrbitLookAt(orbitAngles, [ 0.0, 0.0, 1.0 ],
		{
			eye : node.get('eye'),
			look : node.get('look'),
			up : node.get('up')
		})
console.debug('orbitLookAt: ', orbitLookAt);

		node.set(orbitLookAt);


/*			var zoom = 1;
            var eye = [0, 0, zoom];
            var look = [0, 0, 0];
            var up = [0, 1, 0];

            var eyeVec = SceneJS_math_subVec3(eye, look, []);
            var axis = SceneJS_math_cross3Vec3(up, eyeVec, []);

            var pitchMat = SceneJS_math_rotationMat4v(this.pitch * 0.0174532925, axis);
            var yawMat = SceneJS_math_rotationMat4v(this.yaw * 0.0174532925, up);

            var eye3 = SceneJS_math_transformPoint3(pitchMat, eye);
            eye3 = SceneJS_math_transformPoint3(yawMat, eye3);

			this.surfer.scene.findNode('main-lookAt').set('eye', {x:eye3[0], y:eye3[1], z:eye3[2] });
*/
	},
	pick: function(x, y)
	{
		//scene.pick(canvasX, canvasY, { rayPick:true });
	},
	actionMove: function(x, y)
	{
		if(this.dragging)
		{
			this.yaw += (x - this.lastX) * 0.1;
			this.pitch -= (y - this.lastY) * 0.1;
			this.update(x, y);
		}
		this.lastX = x;
		this.lastY = y;
	},



	mouseDown: function(e)
	{
		//if(this.surfer.mode != 'done') return;
		this.lastX = this.downX = e.offsetX;
		this.lastY = this.lastY = e.offsetY;
		this.dragging = true;
	},
	mouseUp: function(e)
	{
		if(this.surfer.mode != 'done') return;
		if(this.dragging && ((e.offsetX > this.downX) ? (e.offsetX - this.downX < 5) : (this.downX - e.offsetX < 5)) &&	((e.offsetY > this.downY) ? (e.offsetY - this.downY < 5) : (this.downY - e.offsetY < 5)))
			this.pick(e.offsetX, e.offsetY);
		this.dragging = false;
	},
	mouseMove: function(e)
	{
		//if(this.surfer.mode != 'done') return;
		this.actionMove(e.offsetX, e.offsetY);
	},
	mouseWheel: function(e) { console.debug('mouseWheel', e);},
	touchStart: function(e) { console.debug('touchStart', e);},
	touchMove: function(e) { console.debug('touchMove', e);},
	touchEnd: function(e) {console.debug('touchEnd', e); },

});