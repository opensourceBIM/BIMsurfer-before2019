/*
 * BIMsurfer
 * Copyright 2012, Bimsurfer.org.
 * 
 * started by L�on van Berlo, BIMserver.org / TNO
 * created by Rehno Lindeque
 * enhanced by Kaltenriner Cristoph, Leichtfried Michael, TU Vienna, 2012
 */
"use strict";

function BimSurfer() {
	var othis = this;
	this.loggingEnabled = true;
	this.bimServerApi = null;
	this.mode = "none";
	this.classNames = [ 
       "IfcColumn", 
       "IfcStair", 
       "IfcSlab", 
       "IfcWindow", 
       "IfcDoor", 
       "IfcBuildingElementProxy", 
       "IfcWallStandardCase", 
       "IfcWall", 
       "IfcBeam", 
       "IfcRailing",
       "IfcProxy",
       "IfcRoof"
	];
	this.loadedTypes = [];

	this.canvasCaptureThumbnail = function(srcCanvas, srcWidth, srcHeight, destWidth, destHeight) {
		var clipHeight, clipWidth, clipX, clipY, h, imgURI, thumbCanvas, thumbCtx, w;
		thumbCanvas = document.createElement('canvas');
		thumbCanvas.width = destWidth;
		thumbCanvas.height = destHeight;
		thumbCtx = thumbCanvas.getContext('2d');
		w = ($(srcCanvas)).width();
		h = ($(srcCanvas)).height();
		clipWidth = Math.min(w, srcWidth);
		clipHeight = Math.min(h, srcHeight);
		clipX = Math.floor((w - clipWidth) / 2);
		clipY = Math.floor((h - clipHeight) / 2);
		thumbCtx.drawImage(srcCanvas, clipX, clipY, clipWidth, clipHeight, 0, 0, destWidth, destHeight);
		imgURI = thumbCanvas.toDataURL('image/png');
		return imgURI;
	};

	this.modifySubAttr = function(node, attr, subAttr, value) {
		var attrRecord;
		attrRecord = node.get(attr);
		attrRecord[subAttr] = value;
		return node.set(attr, attrRecord);
	};

	SceneJS.FX = {};

	SceneJS.FX.Tween = {};

	SceneJS.FX.TweenSpline = (function() {
		var TweenSpline, _dt, _intervalID, _r, _tick, _tweens;
		TweenSpline = (function() {

			function TweenSpline(lookAtNode, play) {
				this._target = lookAtNode;
				this._sequence = [];
				this._timeline = [];
				this._play = play != null ? play : true;
				this._t = 0.0;
			}

			TweenSpline.prototype.tick = function(dt) {
				if (this._play)
					return this._t += dt;
			};

			TweenSpline.prototype.start = function(lookAt) {
				this._sequence = [ lookAt != null ? lookAt : {
					eye : this._target.get('eye'),
					look : this._target.get('look'),
					up : this._target.get('up')
				} ];
				this._timeline = [ 0.0 ];
				return this._t = 0.0;
			};

			TweenSpline.prototype.push = function(lookAt, dt) {
				var dt_prime;
				if (this._sequence.length === 0)
					this._t = 0.0;
				dt_prime = dt != null ? dt : 5000;
				if (this._timeline.length === 0)
					dt_prime = 0.0;
				this._timeline.push(this.totalTime() + dt_prime);
				return this._sequence.push(lookAt);
			};

			TweenSpline.prototype.sequence = function(lookAts, dt) {
				var dt_prime, lookAt, _i, _len;
				if (this._sequence.length === 0)
					this._t = 0.0;
				for (_i = 0, _len = lookAts.length; _i < _len; _i++) {
					lookAt = lookAts[_i];
					dt_prime = dt != null ? dt : 800; // speedfactor of
					// playing sequences
					if (this._timeline.length === 0)
						dt_prime = 0.0;
					this._timeline.push(this.totalTime() + dt_prime);
					this._sequence.push(lookAt);
				}
				return null;
			};

			TweenSpline.prototype.pause = function() {
				return this._play = false;
			};

			TweenSpline.prototype.play = function() {
				return this._play = true;
			};

			TweenSpline.prototype.totalTime = function() {
				if (this._timeline.length > 0) {
					return this._timeline[this._timeline.length - 1];
				}
				return 0;
			};

			TweenSpline.prototype.update = function() {
				var dt, i;
				if (this._sequence.length === 0)
					return false;
				if (!this._play)
					return true;
				if (this._t >= this.totalTime() || this._sequence.length === 1) {
					this._target.set(this._sequence[this._sequence.length - 1]);
					return false;
				}
				i = 0;
				while (this._timeline[i] <= this._t) {
					++i;
				}
				dt = this._timeline[i] - this._timeline[i - 1];
				othis.lerpLookAtNode(this._target, (this._t - this._timeline[i - 1]) / dt, this._sequence[i - 1], this._sequence[i]);
				return true;
			};

			return TweenSpline;

		})();
		_tweens = [];
		_intervalID = null;
		_dt = 0;
		_tick = function() {
			var tween, _i, _len;
			for (_i = 0, _len = _tweens.length; _i < _len; _i++) {
				tween = _tweens[_i];
				tween.tick(_dt);
			}
			return null;
		};
		_r = function(lookAtNode, interval) {
			var tween;
			_dt = interval || 50;
			if (_intervalID !== null)
				clearInterval(_intervalID);
			_intervalID = setInterval(_tick, _dt);
			tween = new TweenSpline(lookAtNode);
			_tweens.push(tween);
			return tween;
		};
		_r.update = function() {
			var i, tween, _results;
			i = 0;
			_results = [];
			while (i < _tweens.length) {
				tween = _tweens[i];
				if (!tween.update()) {
					_results.push(_tweens.splice(i, 1));
				} else {
					_results.push(i += 1);
				}
			}
			return _results;
		};
		return _r;
	})();

	SceneJS.FX.idle = function() {
		SceneJS.FX.TweenSpline.update();
		return null;
	};
	
	this.lookAtToQuaternion = function(lookAt) {
		var eye, look, up, x, y, z;
		eye = recordToVec3(lookAt.eye);
		look = recordToVec3(lookAt.look);
		up = recordToVec3(lookAt.up);
		x = [ 0.0, 0.0, 0.0 ];
		y = [ 0.0, 0.0, 0.0 ];
		z = [ 0.0, 0.0, 0.0 ];
		SceneJS_math_subVec3(look, eye, z);
		SceneJS_math_cross3Vec3(up, z, x);
		SceneJS_math_cross3Vec3(z, x, y);
		SceneJS_math_normalizeVec3(x);
		SceneJS_math_normalizeVec3(y);
		SceneJS_math_normalizeVec3(z);
		return SceneJS_math_newQuaternionFromMat3(x.concat(y, z));
	};

	this.orbitLookAt = function(dAngles, orbitUp, lookAt) {
		var axes, axesNorm, dAngle, eye0, eye1, look, result, rotAxis, rotMat, tangent1, tangentError, transformedX, transformedZ, up0, up1;
		if (dAngles[0] === 0.0 && dAngles[1] === 0.0) {
			return {
				eye : lookAt.eye,
				look : lookAt.look,
				up : lookAt.up
			};
		}
		eye0 = recordToVec3(lookAt.eye);
		up0 = recordToVec3(lookAt.up);
		look = recordToVec3(lookAt.look);
		axes = [ [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ] ];
		axesNorm = [ [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ] ];
		SceneJS_math_subVec3(eye0, look, axes[2]);
		SceneJS_math_cross3Vec3(up0, axes[2], axes[0]);
		SceneJS_math_normalizeVec3(axes[0], axesNorm[0]);
		SceneJS_math_normalizeVec3(axes[2], axesNorm[2]);
		SceneJS_math_cross3Vec3(axesNorm[2], axesNorm[0], axesNorm[1]);
		rotAxis = [ axesNorm[0][0] * -dAngles[1] + axesNorm[1][0] * -dAngles[0], axesNorm[0][1] * -dAngles[1] + axesNorm[1][1] * -dAngles[0],
				axesNorm[0][2] * -dAngles[1] + axesNorm[1][2] * -dAngles[0] ];
		dAngle = SceneJS_math_lenVec2(dAngles);
		rotMat = SceneJS_math_rotationMat4v(dAngle, rotAxis);
		transformedX = SceneJS_math_transformVector3(rotMat, axesNorm[0]);
		transformedZ = SceneJS_math_transformVector3(rotMat, axes[2]);
		eye1 = [ 0.0, 0.0, 0.0 ];
		SceneJS_math_addVec3(look, transformedZ, eye1);
		tangent1 = transformedX;
		tangentError = [ 0.0, 0.0, 0.0 ];
		SceneJS_math_mulVec3(tangent1, orbitUp, tangentError);
		SceneJS_math_subVec3(tangent1, tangentError);
		up1 = [ 0.0, 0.0, 0.0 ];
		SceneJS_math_cross3Vec3(transformedZ, tangent1, up1);
		return result = {
			eye : vec3ToRecord(eye1),
			look : lookAt.look,
			up : vec3ToRecord(up1)
		};
	};

	this.orbitLookAtNode = function(node, dAngles, orbitUp) {
		return node.set(othis.orbitLookAt(dAngles, orbitUp, {
			eye : node.get('eye'),
			look : node.get('look'),
			up : node.get('up')
		}));
	};

	this.zoomLookAt = function(distance, limits, lookAt) {
		var eye0, eye0len, eye1, eye1len, look, result;
		eye0 = recordToVec3(lookAt.eye);
		look = recordToVec3(lookAt.look);
		eye0len = SceneJS_math_lenVec3(eye0);
		eye1len = Math.clamp(eye0len + distance, limits[0], limits[1]);
		eye1 = [ 0.0, 0.0, 0.0 ];
		SceneJS_math_mulVec3Scalar(eye0, eye1len / eye0len, eye1);
		return result = {
			eye : vec3ToRecord(eye1),
			look : lookAt.look,
			up : lookAt.up
		};
	};

	this.zoomLookAtNode = function(node, distance, limits) {
		return node.set(othis.zoomLookAt(distance, limits, {
			eye : node.get('eye'),
			look : node.get('look'),
			up : node.get('up')
		}));
	};

	this.lookAtPanRelative = function(dPosition, lookAt) {
		var axes, dPositionProj, eye, look, result, up;
		if (dPosition[0] === 0.0 && dPosition[1] === 0.0) {
			return {
				eye : lookAt.eye,
				look : lookAt.look,
				up : lookAt.up
			};
		}
		eye = recordToVec3(lookAt.eye);
		look = recordToVec3(lookAt.look);
		up = recordToVec3(lookAt.up);
		axes = [ [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ], [ 0.0, 0.0, 0.0 ] ];
		SceneJS_math_subVec3(eye, look, axes[2]);
		SceneJS_math_cross3Vec3(up, axes[2], axes[0]);
		SceneJS_math_normalizeVec3(axes[0]);
		SceneJS_math_cross3Vec3(axes[2], axes[0], axes[1]);
		SceneJS_math_normalizeVec3(axes[1]);
		SceneJS_math_mulVec3Scalar(axes[0], dPosition[0]);
		SceneJS_math_mulVec3Scalar(axes[1], dPosition[1]);
		dPositionProj = [ 0.0, 0.0, 0.0 ];
		SceneJS_math_addVec3(axes[0], axes[1], dPositionProj);
		return result = {
			eye : vec3ToRecord(SceneJS_math_addVec3(eye, dPositionProj)),
			look : vec3ToRecord(SceneJS_math_addVec3(look, dPositionProj)),
			up : lookAt.up
		};
	};

	this.lookAtNodePanRelative = function(node, dPosition) {
		return node.set(othis.lookAtPanRelative(dPosition, {
			eye : node.get('eye'),
			look : node.get('look'),
			up : node.get('up')
		}));
	};

	this.lerpLookAt = function(t, lookAt0, lookAt1) {
		var q, q0, q1, result;
		q0 = othis.lookAtToQuaternion(lookAt0);
		q1 = othis.lookAtToQuaternion(lookAt1);
		q = SceneJS_math_slerp(t, q0, q1);
		return result = {
			eye : SceneJS_math_lerpVec3(t, 0.0, 1.0, lookAt0.eye, lookAt1.eye),
			look : SceneJS_math_lerpVec3(t, 0.0, 1.0, lookAt0.look, lookAt1.look),
			up : vec3ToRecord(SceneJS_math_newUpVec3FromQuaternion(q))
		};
	};

	this.lerpLookAtNode = function(node, t, lookAt0, lookAt1) {
		return node.set(othis.lerpLookAt(t, lookAt0, lookAt1));
	};

	this.constants = {
		loadingType : {
			loadFromBimserver : 1			//to differ loading from Server or local File (0..lokal; 1..Server)
		},
		camera : {
			maxOrbitSpeed : Math.PI * 0.1,
			orbitSpeedFactor : 0.05,
			zoomSpeedFactor : 0.05,
			panSpeedFactor : 0.6
		},
		mouse : {
			pickDragThreshold : 10
		},
		canvas : {
			defaultSize : [ 1024, 512 ],
			topOffset : 122
		},
		thumbnails : {
			size : [ 125, 100 ],
			scale : 2
		},
		// Highlight Information for special objects
		highlightSpecialObject : {
			type : 'material',
			name : "specialhighlight",
			emit : 0.4,
			baseColor : {
				r : 0.16,
				g : 0.42,
				b : 0.61
			},
			shine : 10.0,
			nodes : [ {
				type : 'flags',
				flags : {
					specular : false, // set specular false
				}
			} ]
		},
		// Highlight Information for a selected special object
		highlightSelectedSpecialObject : {
			type : 'material',
			id : 'specialselectedhighlight',
			emit : 1,
			baseColor : {
				r : 0.16,
				g : 0.70,
				b : 0.88
			},
			shine : 10.0
		},
		// Highlight Information for a Warning Objects
		highlightWarning : {
			type : 'material',
			coreid : 'warninghighlight',
			emit : 1,
			baseColor : {
				r : 1,
				g : 0,
				b : 0
			}
		},
		highlightMaterial : {
			type : 'material',
			id : 'highlight',
			emit : 0.0,
			baseColor : {
				r : 0.0,
				g : 0.5,
				b : 0.5
			}
		}
	};

	othis.canvas = document.getElementById('scenejsCanvas');
	othis.settings = {
		performance : 'quality',
		mode : 'basic'
	};
	othis.viewport = {
		domElement : document.getElementById('viewport'),
		selectedIfcObject : null,
		mouse : {
			last : [ 0, 0 ],
			leftDown : false,
			middleDown : false,
			leftDragDistance : 0,
			middleDragDistance : 0,
			pickRecord : null
		}
	};
	othis.queryArgs = {};
	othis.camera = {
		distanceLimits : [ 0.0, 0.0 ]
	};
	// Variables for BPI.MOST Features (TU Vienna)
	othis.propertyValues = {
		scalefactor : 0,
		viewfactor : 0,
		selectedObj : 'emtpy Selection',
		mouseRotate : 0,
		oldZoom : 15,
		boundfactor : 0,
		autoLoadPath : ""
	};
	othis.lookAt = {
		defaultParameters : {
			look : {
				x : 0.0,
				y : 0.0,
				z : 0.0
			},
			eye : {
				x : 10.0,
				y : 10.0,
				z : 10.0
			},
			up : {
				x : 0.0,
				y : 0.0,
				z : 1.0
			}
		}
	};
	othis.snapshots = {
		lookAts : []
	};
	othis.application = {
		initialized : false
	};

	this.mouseCoordsWithinElement = function(event) {
		var coords, element, totalOffsetLeft, totalOffsetTop;
		coords = [ 0, 0 ];
		if (!event) {
			event = window.event;
			coords = [ event.x, event.y ];
		} else {
			element = event.target;
			totalOffsetLeft = 0;
			totalOffsetTop = 0;
			while (element.offsetParent) {
				totalOffsetLeft += element.offsetLeft;
				totalOffsetTop += element.offsetTop;
				element = element.offsetParent;
			}
			coords = [ event.pageX - totalOffsetLeft, event.pageY - totalOffsetTop ];
		}
		return coords;
	};

	this.windowResize = function() {
		var cameraNode, cameraOptics;
		switch (othis.settings.performance) {
		case 'performance':
			othis.canvas.width = othis.constants.canvas.defaultSize[0];
			othis.canvas.height = othis.constants.canvas.defaultSize[1];
			break;
		case 'quality':
			othis.canvas.width = ($('#viewport')).width();
			othis.canvas.height = ($('#viewport')).height();
		}
		if (othis.scene != null) {
			cameraNode = othis.scene.findNode('main-camera');
			cameraOptics = cameraNode.get('optics');
			cameraOptics.aspect = othis.canvas.width / othis.canvas.height;
			return cameraNode.set('optics', cameraOptics);
		}
	};

	this.mouseDown = function(event) {
		var coords, picknode;
		if (!(othis.scene != null))
			return;

		othis.viewport.mouse.last = [ event.clientX, event.clientY ];
		switch (event.which) {
		case 1:
			othis.viewport.mouse.leftDown = true;
			break;
		case 2:
			othis.viewport.mouse.middleDown = true;
		}
		if (event.which === 1) {
			coords = othis.mouseCoordsWithinElement(event);
			// check if selected Object is a special object
			othis.viewport.mouse.pickRecord = othis.scene.pick(coords[0], coords[1]);
			if (othis.viewport.mouse.pickRecord != null) {
				picknode = othis.scene.findNode(othis.viewport.mouse.pickRecord.name);
				// if selected element begins with dp_ (marks special object)
				if ($('#' + RegExp.escape(picknode.get("id"))).text().match(/^ dp_/)) {
					if (othis.propertyValues.selectedObj == ($('#' + RegExp.escape(picknode.get("id"))).text())) {
						othis.log("No special object selected");
					} else {
						othis.propertyValues.selectedObj = ($('#' + RegExp.escape(picknode.get("id"))).text());
						//call GWT Application
		    			//GWT: window.callbackAddDpWidget(othis.propertyValues.selectedObj,coords[0], coords[1]);
					}
					othis.viewport.mouse.leftDown = false;
					//GWT: window.callbackClickEventDatapointMove(othis.propertyValues.selectedObj);
					event.preventDefault();
				} else {
					othis.propertyValues.selectedObj = 'emtpy Selection';
				}
			}
			return 0;
		}
	};

	this.mouseUp = function(event) {
		if (!(othis.scene != null))
			return;
		if (event.which === 1 && othis.viewport.mouse.leftDragDistance < othis.constants.mouse.pickDragThreshold
				&& othis.viewport.mouse.middleDragDistance < othis.constants.mouse.pickDragThreshold) {
			if (othis.viewport.mouse.pickRecord != null) {
				othis.controlsTreeSelectObject(othis.viewport.mouse.pickRecord.name);
				othis.controlsTreeScrollToSelected();
				if (othis.propertyValues.selectedObj != 'emtpy Selection') {
					//GWT: window.callbackClickEventZoneMarked(othis.propertyValues.selectedObj);
				}
			} else {
				othis.controlsTreeSelectObject();
				othis.helpShortcutsHide('selection');
			}
			othis.viewport.mouse.pickRecord = null;
		}
		// switch between Navigation Mode (pan/rotate)
		var navigationMode = othis.getNavigationMode();
		switch (navigationMode) {
		case 0:
			othis.viewport.mouse.leftDragDistance = 0;
			break;
		case 1:
			othis.viewport.mouse.middleDragDistance = 0;
			break;
		}
		switch (event.which) {
		case 1:
			othis.viewport.mouse.leftDown = false;
			return othis.viewport.mouse.leftDragDistance = 0;
		case 2:
			othis.viewport.mouse.middleDown = false;
			return othis.viewport.mouse.middleDragDistance = 0;
		}
	};

	this.mouseMove = function(event) {
		var delta, deltaLength, orbitAngles, panVector;

		delta = [ event.clientX - othis.viewport.mouse.last[0], event.clientY - othis.viewport.mouse.last[1] ];
		
		if (delta[0] == 0 || delta[1] == 0)
			return; // avoids disappearing
		// object
		deltaLength = SceneJS_math_lenVec2(delta);
		if (othis.viewport.mouse.leftDown) {
			// check which navigation mode is activated
			if (othis.getNavigationMode() == 0) {
				othis.viewport.mouse.leftDragDistance += deltaLength;
			} else {
				othis.viewport.mouse.middleDragDistance += deltaLength;
			}

		}
		if (othis.viewport.mouse.middleDown) {
			othis.viewport.mouse.middleDragDistance += deltaLength;
		}
		if (othis.viewport.mouse.leftDown && event.which === 1) {
			if (othis.getNavigationMode() == 0) {
				orbitAngles = [ 0.0, 0.0 ];
				SceneJS_math_mulVec2Scalar(delta, othis.constants.camera.orbitSpeedFactor / deltaLength, orbitAngles);
				orbitAngles = [ Math.clamp(orbitAngles[0], -othis.constants.camera.maxOrbitSpeed, othis.constants.camera.maxOrbitSpeed),
						Math.clamp(orbitAngles[1], -othis.constants.camera.maxOrbitSpeed, othis.constants.camera.maxOrbitSpeed) ];
				if ((isNaN(orbitAngles[0])) || (Math.abs(orbitAngles[0])) === Infinity) {
					orbitAngles[0] = 0.0;
				}
				if ((isNaN(orbitAngles[1])) || (Math.abs(orbitAngles[1])) === Infinity) {
					orbitAngles[1] = 0.0;
				}
				othis.orbitLookAtNode(othis.scene.findNode('main-lookAt'), orbitAngles, [ 0.0, 0.0, 1.0 ]);
			} else {
				panVector = [ 0.0, 0.0 ];
				SceneJS_math_mulVec2Scalar([ -delta[0], delta[1] ], othis.constants.camera.panSpeedFactor * 1 / othis.propertyValues.scalefactor / deltaLength, panVector);
				othis.lookAtNodePanRelative(othis.scene.findNode('main-lookAt'), panVector);
			}
		} else if (othis.viewport.mouse.middleDown && event.which === 2) {
			panVector = [ 0.0, 0.0 ];
			SceneJS_math_mulVec2Scalar([ -delta[0], delta[1] ], othis.constants.camera.panSpeedFactor * 1 / othis.propertyValues.scalefactor / deltaLength, panVector);
			othis.lookAtNodePanRelative(othis.scene.findNode('main-lookAt'), panVector);
		}
		return othis.viewport.mouse.last = [ event.clientX, event.clientY ];
	};

	this.mouseWheel = function(event) {
		var delta, zoomDistance;
		if (!(othis.scene != null))
			return;
		delta = event.wheelDelta != null ? event.wheelDelta / -120.0 : Math.clamp(event.detail, -1.0, 1.0);
		othis.propertyValues.oldZoom = Math.clamp(othis.propertyValues.oldZoom + delta, 0, 20);
		//GWT: window.callbackZoomLevelAbsolute(othis.propertyValues.oldZoom);
		zoomDistance = delta * othis.camera.distanceLimits[1] * othis.constants.camera.zoomSpeedFactor;
		return othis.zoomLookAtNode(othis.scene.findNode('main-lookAt'), zoomDistance, othis.camera.distanceLimits);
	};

	/**
	 * Sets Rotate or Pan mode (called from GWT)
	 * 
	 * @param _mouseRotate
	 *            an Integer: 0...Rotate, 1...Pan
	 */
	window.setNavigationMode = function(_mouseRotate) {
		othis.propertyValues.mouseRotate = _mouseRotate;
	};

	/**
	 * Get Navigation Mode (0 for Rotate and 1 for Pan)
	 */
	this.getNavigationMode = function(event) {
		return othis.propertyValues.mouseRotate;
	};

	this.keyDown = function(event) {
		switch (event.which) {
		case 72:
			return othis.topmenuHelp();
		}
	};

	this.helpStatus = function(str) {
		return ($('#main-view-help')).html(str);
	};

	this.helpStatusClear = function() {
		return ($('#main-view-help')).html("");
	};

	this.helpShortcuts = function() {
		var postfix, _i, _len, _results;
		($('.shortcut')).hide();
		_results = [];
		for (_i = 0, _len = arguments.length; _i < _len; _i++) {
			postfix = arguments[_i];
			_results.push(($('.shortcut-' + postfix)).show());
		}
		return _results;
	};

	this.helpShortcutsHide = function() {
		var postfix, _i, _len, _results;
		_results = [];
		for (_i = 0, _len = arguments.length; _i < _len; _i++) {
			postfix = arguments[_i];
			_results.push(($('.shortcut-' + postfix)).hide());
		}
		return _results;
	};

	this.topmenuImportBimserver = function(event) {
		othis.constants.loadingType.loadFromBimserver = 1;
		return othis.bimserverImportDialogShow();
	};

	this.topmenuImportSceneJS = function(event) {
		othis.constants.loadingType.loadFromBimserver = 0;
		return othis.fileImportDialogShow();
	};

	this.topmenuPerformanceQuality = function(event) {
		($(event.target)).addClass('top-menu-activated');
		($('#top-menu-performance-performance')).removeClass('top-menu-activated');
		($('#viewport')).removeClass('viewport-performance');
		othis.settings.performance = 'quality';
		return othis.windowResize();
	};

	this.topmenuPerformancePerformance = function(event) {
		($(event.target)).addClass('top-menu-activated');
		($('#top-menu-performance-quality')).removeClass('top-menu-activated');
		($('#viewport')).addClass('viewport-performance');
		othis.settings.performance = 'performance';
		return othis.windowResize();
	};

	this.topmenuModeBasic = function(event) {
		($(event.target)).addClass('top-menu-activated');
		($('#top-menu-mode-advanced')).removeClass('top-menu-activated');
		return othis.settings.mode = 'basic';
	};

	this.topmenuModeAdvanced = function(event) {
		($(event.target)).addClass('top-menu-activated');
		($('#top-menu-mode-basic')).removeClass('top-menu-activated');
		return othis.settings.mode = 'performance';
	};

	this.topmenuHelp = function() {
		($('#top-menu-help')).toggleClass('top-menu-activated');
		($('#main-view-help')).toggle();
		return ($('#main-view-keys')).toggle();
	};

	/**
	 * Set camera to view position. Sets predesigned view positions: 0...reset,
	 * 1...front, 2...side, 3...top
	 * 
	 * @param view
	 *            an Integer: 0...reset, 1...front, 2...side, 3...top
	 */
	window.setView = function(view) {
		var lookAtNode;
		if (othis.scene != null) {
			switch (view) {
			case (0): // reset
				othis.resetView();
				othis.propertyValues.oldZoom = 15;
				othis.setZoomSlider(75);
				//GWT: window.callbackZoomLevelAbsolute(15);
				break;
			case (1): // front
				othis.resetView();
				lookAtNode = othis.scene.findNode('main-lookAt');
				lookAtNode.set('eye', {
					x : othis.propertyValues.viewfactor,
					y : 0,
					z : 0
				});
				lookAtNode.set('look', {
					x : 0,
					y : 0,
					z : 0
				});
				othis.propertyValues.oldZoom = 10;
				othis.setZoomSlider(50);
				//GWT: window.callbackZoomLevelAbsolute(10);
				break;
			case (2): // side
				othis.resetView();
				lookAtNode = othis.scene.findNode('main-lookAt');
				lookAtNode.set('eye', {
					x : 0,
					y : othis.propertyValues.viewfactor,
					z : 0
				});
				lookAtNode.set('look', {
					x : 0,
					y : 0,
					z : 0
				});
				othis.propertyValues.oldZoom = 10;
				othis.setZoomSlider(50);
				//GWT: window.callbackZoomLevelAbsolute(10);
				break;
			case (3): // top
				othis.resetView();
				lookAtNode = othis.scene.findNode('main-lookAt');
				lookAtNode.set('up', {
					x : 0,
					y : 1,
					z : 0
				});
				lookAtNode.set('eye', {
					x : 0,
					y : 0,
					z : othis.propertyValues.viewfactor
				});
				lookAtNode.set('look', {
					x : 0,
					y : 0,
					z : 0
				});
				othis.propertyValues.oldZoom = 10;
				othis.setZoomSlider(50);
				//GWT: window.callbackZoomLevelAbsolute(10);
				break;
			}
		}
		return 0;
	};

	/**
	 * Resets the view to predesignd Position.
	 */
	this.resetView = function(event) {
		var lookAtNode;
		lookAtNode = othis.scene.findNode('main-lookAt');
		lookAtNode.set('eye', othis.lookAt.defaultParameters.eye);
		lookAtNode.set('look', othis.lookAt.defaultParameters.look);
		return lookAtNode.set('up', othis.lookAt.defaultParameters.up);
	};

	/**
	 * Set View to start view
	 */
	this.mainmenuViewsReset = function(event) {
		window.setView(0);
	};

	/**
	 * Set View to front view
	 */
	this.mainmenuViewsFront = function(event) {
		window.setView(1);
	};

	/**
	 * Set View to side view
	 */
	this.mainmenuViewsSide = function(event) {
		window.setView(2);
	};

	/**
	 * Set View to top view
	 */
	this.mainmenuViewsTop = function(event) {
		window.setView(3);
	};

	/**
	 * Switch between rotate and pan navigation mode
	 */
	this.togglePanRotate = function(event) {
		if (othis.getNavigationMode() == 1) {
			window.setNavigationMode(0);
		} else {
			window.setNavigationMode(1);
		}
	};

	/**
	 * Set zoom level.
	 * 
	 * @param zoomVal
	 *            an int, -1 for zoom in, 1 for zoom out
	 */
	window.setZoomLevel = function(zoomVal) {
		var zoomDistance;
		zoomDistance = zoomVal * othis.camera.distanceLimits[1] * othis.constants.camera.zoomSpeedFactor;
		return othis.zoomLookAtNode(othis.scene.findNode('main-lookAt'), zoomDistance, othis.camera.distanceLimits);
	};

	/**
	 * Set zoom Level with Absolute Value
	 * 
	 * @param zoomVal
	 *            an int in range 0 to 20
	 */
	window.setZoomLevelAbsolute = function(zoomVal) {

		var zoomDistance;

		if ((zoomVal >= 0) && (zoomVal <= 20)) {
			var zoomSteps = zoomVal - othis.propertyValues.oldZoom;

			zoomDistance = othis.camera.distanceLimits[1] * othis.constants.camera.zoomSpeedFactor;
			zoomDistance = zoomDistance * zoomSteps;
			othis.zoomLookAtNode(othis.scene.findNode('main-lookAt'), zoomDistance, othis.camera.distanceLimits);

			othis.propertyValues.oldZoom = zoomVal;
		}
		return 0;
	};

	// set Warning is called from an extern Applicatin (GWT)
	/**
	 * Marks all Objects from an Array.
	 * 
	 * @param names
	 *            a String Array with all Objects to Highlight
	 */
	this.setWarning = function(names) {

		var oldHighlight;

		// delete all old Highlights
		othis.deleteHighlights();

		for ( var i = 0; i < names.length; i++) {
			var id = ($("ul.controls-tree").find("div:contains(" + names[i] + ")").parent().attr("id"));
			var nodeID = othis.scene.findNode(id);

			if (nodeID == null) {
				othis.log("Set Warning Error: Invalid Object");
				return;
			}
			oldHighlight = othis.scene.findNode('highlightspecialobject-' + nodeID.get("id"));
			if (oldHighlight != null)
				oldHighlight.splice();
			nodeID.insert('node', othis.constants.highlightWarning);
		}
		return;
	};

	/**
	 * Translates Object Name into ID
	 * 
	 * @param objName
	 *            a String with the name of an Object
	 * @returns doSetViewToObject a Function to do the setView to Object Action
	 */
	window.setViewToObject = function(objName) {
		var objID = ($("ul.controls-tree").find("div:contains(" + objName + ")").parent().attr("id"));
		return othis.doSetViewToObject(objID);
	};

	/**
	 * Generates two snapshots and starts camera movement. First snapshot is
	 * generated on actual position. For the second snapshot a good View to the
	 * Objects is calculated.
	 * 
	 * @param objID
	 *            a String with the ID of an Object
	 */
	this.doSetViewToObject = function(objID) {

		var deltaPosX, deltaPosY, deltaPosZ, oldHighlight, addTranslate, nodeID, childnode, endlessstopper, oldSnapshots;

		// delete actual Highlights, because destination is new highlight
		othis.deleteHighlights();

		// get child from wanted Node
		nodeID = othis.scene.findNode(objID);

		// if there is no scenejs node (node is not a physical object)
		if (nodeID == null) {
			othis.log("No physical Object found!", objID);
			return;
		}
		childnode = nodeID.node(0);

		// reset values
		addTranslate = 0;
		endlessstopper = 0;

		// find geometry node if existing
		while ((childnode.get("type") != "geometry") && (endlessstopper < 17)) {
			// if there is a translation add additional displacement
			if ((childnode.get("type")) == "translate") {
				addTranslate = childnode.get("y");
			}
			// next childnode
			childnode = childnode.node(0);
			endlessstopper++;
		}

		// if no geometry node is found in 17 steps
		if (endlessstopper == 17) {
			othis.log("No Geometry found!");
			return;
		}

		if (childnode.get("type") == "geometry") {
			var pos = childnode.get("positions");

			// calculate "look" Position out of 3 Geometric Points of the object
			deltaPosX = (pos[0] + pos[(pos.length / 2) - 3] + pos[pos.length - 3]) / 3;
			deltaPosY = (pos[1] + pos[(pos.length / 2) - 2] + pos[pos.length - 1]) / 3;
			deltaPosZ = (pos[2] + pos[(pos.length / 2) - 1] + pos[pos.length - 1]) / 3;

			// if some values were not valid
			if (isNaN(deltaPosX)) {
				othis.log("Incorrect Geometry found!");
				return 0;
			}
			oldSnapshots = othis.snapshots.lookAts.length
			// delete all old snapshots
			for ( var i = 0; i < oldSnapshots; i++) {
				othis.snapshotsDelete(i);
			}

			// make snapshot from actual position (with parameter false that no
			// thumb is created)
			othis.snapshotsPush(false);
			// make snapshot from calculated position (end of camera-movement)
			othis.snapshotsPushObject(deltaPosX, deltaPosY + addTranslate, deltaPosZ);

			// Highlight object
			oldHighlight = othis.scene.findNode('highlightspecialobject-' + nodeID.get("id"));
			if (oldHighlight != null)
				oldHighlight.splice();
			if ($('#' + RegExp.escape(nodeID.get("id"))).text().match(/^ dp_/))
				nodeID.insert('node', othis.constants.highlightSelectedSpecialObject);
			else
				nodeID.insert('node', othis.constants.highlightMaterial);
			// do camera movement
			othis.snapshotsPlay();

			//set zoom slider closer to the middle
			othis.setZoomSlider(15);
		}
		return 0;
	};

	/**
	 * Method for obtaining the available Building Storeys.
	 */
	this.getBuildingStoreys = function() {

		// find building storeys in hierarchy of building
		return $("ul.controls-tree").find(".controls-tree-postfix:contains('(BuildingStorey)')").closest("li.controls-tree-rel");
	};

	/**
	 * Method for obtaining the corresponding wall objects of the selected
	 * element in a Building Storey.
	 */
	this.getSelectedStoreyWalls = function() {
		return ($('.controls-tree').find('.controls-tree-selected')).closest(".controls-tree-rel:contains('(BuildingStorey)')").find(
				".controls-tree-rel:contains('(WallStandardCase)')");
	};

	/**
	 * Method for setting the corresponding transparent level adjusted in GWT.
	 * 
	 * @param factor
	 *            the transparency factor (0 - 100)
	 */
	window.setTransparentLevel = function(factor) {
		if (othis.scene == null)
			return;

		// if a wall element is selected, get the corresponding storey to set
		// this
		// one transparent
		if ($('.controls-tree-selected').find(".controls-tree-postfix").text() != "") {
			var storeyElements = othis.getSelectedStoreyWalls();
			var numStoreyElements = storeyElements.size();
			if(numStoreyElements > 0) {
				for ( var i = 0; i < numStoreyElements; i++) {
					if ($(storeyElements[i]).find(".controls-tree-postfix").text() == "(WallStandardCase)") {
						var nodeId = ($(storeyElements[i])).attr("id");
						othis.insertTransparentNodes(othis.scene.findNode(nodeId), factor);
					}
				}
			}
			else {
				othis.setAllWallsTransparent(factor);
			}
		}

		// if no element is selected, make all elements of WallStandardCase
		// transparent
		else {
			othis.setAllWallsTransparent(factor);
		}
	};
	
	
	this.setAllWallsTransparent = function(factor) {
	
		var sceneData = othis.scene.data();
		var index = sceneData.ifcTypes.indexOf('WallStandardCase');
		var wallCase = sceneData.ifcTypes[index];
		var wallNode = othis.scene.findNode(wallCase.toLowerCase());

		// also set the roof transparent
		var roofIndex = sceneData.ifcTypes.indexOf('Roof');
		var roof = sceneData.ifcTypes[roofIndex];
		var roofNode;
		
		if(roof != null) {
			roofNode = othis.scene.findNode(roof.toLowerCase());
		}
		if(wallNode != null) {
			wallNode.eachNode(function() {
				if (this.get('type') === 'name')
					othis.insertTransparentNodes(this, factor);
			}, {
				depthFirst : true
			// Descend depth-first into tree
			});
		}
		if(roofNode != null) {
			roofNode.eachNode(function() {
				if (this.get('type') === 'name')
					othis.insertTransparentNodes(this, factor);
			}, {
				depthFirst : true
			// Descend depth-first into tree
			});
		};
	}

	/**
	 * Method to insert transparent material nodes.
	 * 
	 * @param currentNode
	 *            the node where the transparency material should be inserted
	 * @param factor
	 *            the transparency factor (0 - 100)
	 */
	this.insertTransparentNodes = function(currentNode, factor) {
		// insert a new transparent node if there isn't any
		var transparentMaterial = {
			type : 'material',
			id : currentNode.get('id') + '-' + 'transparent-walls',
			alpha : factor / 100.0,

			nodes : [ {
				type : 'flags',
				coreid : 'flagsTransparent',
				flags : {
					picking : false, // Picking enabled
					transparent : true,
				}
			} ]
		};
		var insertedMaterial = othis.scene.findNode(transparentMaterial.id);
		if (insertedMaterial == null) {
			insertedMaterial = currentNode.insert('node', transparentMaterial);
		}

		// if there is already a transparent node inserted, update the
		// transparentNode to the new factor
		else {
			// if factor is 100, remove transparency material and set elemnts
			// pickable again
			if (factor == 100) {
				insertedMaterial.node(0).splice();
				insertedMaterial.splice();
			} else {
				insertedMaterial.set('alpha', factor / 100.0);
				insertedMaterial.node(0).set('flags', {
					picking : false,
					transparent : true
				});
			}
		}
	};

	/**
	 * Method for setting the corresponding expose level adjusted in GWT.
	 * 
	 * @param factor
	 *            the expose factor (0 - 150)
	 */
	window.setExposeLevel = function(factor) {
		if (othis.scene == null)
			return;

		var storeyElems;
		var distance = factor / 10 * 1 / othis.propertyValues.scalefactor;

		// if an element is selected, get the corresponding storey to expose
		// this one
		if ($('.controls-tree-selected').find(".controls-tree-postfix").text() != "") {
			// find the parent node of the selected one, which holds the node id
			var parent = ($('.controls-tree').find('.controls-tree-selected')).closest(".controls-tree-rel:contains('(BuildingStorey)')");
			othis.exposeSelectedStorey($(parent), distance);
		} else {
			storeyElems = othis.getBuildingStoreys();
			for ( var i = 0; i < storeyElems.size(); i++) {
				othis.exposeSelectedStorey($(storeyElems[i]), distance * -i);
			}
		}
	};

	/**
	 * Method for exposing a particular Building Storey.
	 * 
	 * @param parent
	 *            the parent node of the storey which should be exposed
	 * @param distance
	 *            the distance the storey should be exposed
	 */
	this.exposeSelectedStorey = function($parent, distance) {
		var translateNodeJson, disabledNodes, ids, parentId, parentNode, tag, tagNode, _j, _k, _len1, _len2, _ref, _ref1;
		parentId = $parent.attr('id');
		ids = [ parentId ]; // array of ids

		// find controls-tree-rel (jquery) elements and add them to ids array;
		// they
		// are defined in ifcTreeInit() when tree on the left side is built up;
		// there also the object's ids are defined
		($parent.find('.controls-tree-rel')).each(function() {
			ids[this.id] = true;
		});
		_ref = othis.scene.data().ifcTypes; // ifc types; WallStandardCase,
		// Roof, Window, Stair
		for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) { // iterate all
			// ifc
			// Types
			tag = _ref[_j]; // one ifcType of the ifcTypes Array in
			// othis.scene.data()
			tag = tag.toLowerCase();
			tagNode = othis.scene.findNode(tag);
			if (tagNode == null) {
				othis.log("tag node not found", tag);
			} else {
				tagNode.eachNode((function() { // for each node (scenejs) under
					// the
					// parent tag node (= ifc Type eg.
					// WallStandardCase)
					// eachNode performs function on each child node;
					// eachNode(function(), depthFirst)

					var _ref1, id;
					id = this.get("id");

					// create a new translate Node; hierarchies with this node
					// attached
					// get translated
					translateNodeJson = {
						type : 'translate',
						id : 'translateZone-' + id + '-' + parentId,
						x : 0,
						y : distance,
						z : 0
					};
					if (this.get('type') === 'name' && ids[this.get('id')] != null) {
						var insertedTranslateNode = othis.scene.findNode(translateNodeJson.id);
						if (insertedTranslateNode == null) {
							insertedTranslateNode = this.insert("node", translateNodeJson);
						} else {
							insertedTranslateNode.set('y', distance);
						}
					}
					return false;
				}), {
					depthFirst : true
				});
			}
		}
		return false;
	};

	/**
	 * Sets the expose slider according to the expose level of the selected
	 * element
	 */
	this.setExposeSlider = function(id) {
		var parentId = $('#' + RegExp.escape(id)).parentsUntil('li.controls-tree-rel').parent().attr('id');
		var translateNode = othis.scene.findNode('translateZone-' + id + '-' + parentId);
		if (translateNode != null) {
			($('#expose')).slider("value", othis.propertyValues.scalefactor * 10 * Math.abs(translateNode.get('y')));
			//GWT: window.callbackExposeLevel(othis.propertyValues.scalefactor*10*Math.abs(translateNode.get('y')));
		} else {
			($('#expose')).slider("value", 0);
			//GWT: window.callbackExposeLevel(0);
		}
	};
	
	/**
	   * Sets the transparent slider according to the transparent level of the selected element
	   */
	  this.setTransparentSlider = function (id) {
		  var storeyId = $('#'+RegExp.escape(id)).closest(".controls-tree-rel:contains('(BuildingStorey)')").andSelf().first().attr('id');
		  var wallId = $('#'+RegExp.escape(storeyId)).find(".controls-tree-rel:contains('(WallStandardCase)')").attr('id');
		  var transparentNode = othis.scene.findNode(wallId + '-' + 'transparent-walls');
		  if(transparentNode != null) {
			  //GWT: window.callbackTransparentLevel(100 - transparentNode.get('alpha')*100);
			  ($('#transparent')).slider("value" , 100 - transparentNode.get('alpha')*100);
		  }
		  else {
			  if(wallId != null) {
				  //GWT: window.callbackTransparentLevel(100);
				  ($('#transparent')).slider("value" , 0);
			  }
		  }
	  };
	  
	  /**
	   * Sets the Zoom Slider according to the Zoomlevel
	   */
	  this.setZoomSlider = function (value){
		  ($('#zoom')).slider("value" , value);
	  }

	/**
	 * Deletes all actual highlights for setting a new highlight
	 */
	this.deleteHighlights = function() {

		var oldHighlightWarning, oldHighlight;

		othis.restoreSpecialObjectHighlight();
		oldHighlightWarning = othis.scene.findNode(othis.constants.highlightWarning.id);
		if (oldHighlightWarning != null)
			oldHighlightWarning.splice();
		oldHighlight = othis.scene.findNode(othis.constants.highlightMaterial.id);
		if (oldHighlight != null)
			oldHighlight.splice();

		return 0;
	};

	/**
	 * Searches for all objects with the specified name or pattern and
	 * highlights them.
	 * 
	 * @param pattern
	 *            the name or pattern of the elements to be selected
	 */
	this.highlightElements = function(pattern) {
		var foundElements = $('div.controls-tree-item:contains(' + pattern + ')');

		// iterate all found elements
		for ( var i = 0; i < foundElements.length; i++) {
			var id = $(foundElements[i]).closest('.controls-tree-rel').attr('id');
			var node = othis.scene.findNode(id);
			if (node != null) {
				var materialNode = othis.constants.highlightSpecialObject;
				materialNode.id = 'highlightspecialobject-' + id;
				node.insert('node', materialNode);
			}
		}
	};

	/**
	 * Restores the default highlighting of a special object after it was
	 * selected.
	 */
	this.restoreSpecialObjectHighlight = function() {
		var oldHighlight = othis.scene.findNode(othis.constants.highlightSelectedSpecialObject.id);
		if (oldHighlight != null) {
			// insert default special-object highlight
			var materialNode = othis.constants.highlightSpecialObject;
			materialNode.id = 'highlightspecialobject-' + oldHighlight.parent().get("id");
			if (othis.scene.findNode(RegExp.escape(materialNode.id)) == null) // if
				// default
				// special-object
				// highlight
				// not
				// added
				// yet
				oldHighlight.parent().insert('node', materialNode);
			oldHighlight.splice();
		}
	};

	// checkboxes in "Objects" window left sideSelect; iterates the list of
	// control elements on the left side
	this.controlsToggleTreeVisibility = function(event) {
		var $parent, collectNodes, disableNode, disableTagJson, disabledNodes, ids, node, parentId, parentNode, tag, tagNode, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
		$parent = ($(event.target)).closest('.controls-tree-rel');
		if (event.target.checked) {
			$parent.find('.controls-tree-rel').andSelf().each(function() {
				var node = othis.scene.findNode('disable-' + this.id);
				if (node != null) {
					node.splice();
				}
			});
			return;
		}
		$parent.find('.controls-tree-rel').andSelf().each(function() {
			var disableTagJson = {
		        type: 'tag',
		        tag: 'disable-' + this.id,
		        id: 'disable-' + this.id
		      };
			var node = othis.scene.findNode(this.id);
			if (node != null) {
				node.insert("node",disableTagJson);
			}
		});
		return false;
	};

	this.controlsPropertiesSelectObject = function(id) {
		var html, key, keyStack, objectProperties, properties, tableItem, tableItemObject, value, _i, _len;
		properties = othis.scene.data().properties;
		if (!(id != null)) {
			return ($('#controls-properties')).html("<p class='controls-message'>Select an object to see its properties.</p>");
		}
		if (!(properties != null)) {
			return ($('#controls-properties')).html("<p class='controls-message'>No properties could be found in the scene.</p>");
		}
		keyStack = [ id ];
		objectProperties = properties;
		for (_i = 0, _len = keyStack.length; _i < _len; _i++) {
			key = keyStack[_i];
			objectProperties = objectProperties[key];
		}
		tableItemObject = function(keyStack, key, value) {
			var html, k, _j, _len2;
			html = "<a class='ifc-link' href='#";
			if ((value.link != null) && typeof value.link === 'number') {
				return html += value.link + ("'>" + value.link + "</a>");
			} else {
				for (_j = 0, _len2 = keyStack.length; _j < _len2; _j++) {
					k = keyStack[_j];
					html += k + "/";
				}
				return html += key + "'>...</a>";
			}
		};

		tableItem = function(key, value) {
			var arrayValue, html, i, _ref;
			html = "<li class='controls-table-item'>";
			html += "<label class='controls-table-label'>" + key + "</label>";
			html += "<div class='controls-table-value'>";
			if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			} else if (Array.isArray(value)) {
				for (i = 0, _ref = value.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
					arrayValue = value[i];
					if (i > 0)
						html += ",<br>";
					if (typeof arrayValue === 'string' || typeof arrayValue === 'number' || typeof arrayValue === 'boolean') {
						html += arrayValue;
					} else if (typeof value === 'object') {
						html += tableItemObject(keyStack, key, arrayValue);
					} else {
						html += arrayValue;
					}
				}
			} else if (typeof value === 'object') {
				html += tableItemObject(keyStack, key, value);
			} else {
				html += value;
			}
			html += "</div>";
			return html += "</li>";
		};
		html = "<ul class='controls-table'>";
		if (keyStack.length === 1)
			html += tableItem('Global Id', id);
		if (objectProperties != null) {
			for (key in objectProperties) {
				value = objectProperties[key];
				html += tableItem(key, value);
			}
		}
		html += "</ul>";
		if (!objectProperties) {
			html += "<p class='controls-message'>No additional properties could be found for the object with id '" + id + "'.</p>";
		}
		return ($('#controls-properties')).html(html);
	};

	this.controlsToggleTreeOpen = function(event) {
		var $parent, id;
		$parent = ($(event.target)).parent();
		id = $parent.attr('id');
		$parent.toggleClass('controls-tree-open');
		othis.controlsTreeSelectObject(id);
		return othis.controlsPropertiesSelectObject(id);
	};

	/**
	 * Highights in Accordeon selected Objecs in 3D View
	 */
	this.controlsTreeSelectObject = function(id) {
		var $treeItem, node, oldHighlight, oldHighlightDB, oldHighlightWarning, parentEl;
		($('.controls-tree-selected')).removeClass('controls-tree-selected');
		($('.controls-tree-selected-parent')).removeClass('controls-tree-selected-parent');
		othis.deleteHighlights();
		if (id != null) {
			othis.setExposeSlider(id);
			othis.setTransparentSlider(id);
			parentEl = document.getElementById(id);
			$treeItem = ($(parentEl)).children('.controls-tree-item');
			$treeItem.addClass('controls-tree-selected');
			($('.controls-tree:has(.controls-tree-selected)')).addClass('controls-tree-selected-parent');

			// set filter element selected if there is any corresponding
			var filterElem = $('#filtered-list').find('#' + RegExp.escape(id));
			if (filterElem != null)
				filterElem.addClass("controls-tree-selected");
			othis.controlsPropertiesSelectObject(id);
			node = othis.scene.findNode(id);
			if (node != null) {
				// if selected element begins with dp_ (= special object)
				if ($('#' + RegExp.escape(node.get("id"))).text().match(/^ dp_/)) {
					var oldHighlight = othis.scene.findNode('highlightspecialobject-' + node.get("id"));
					// delete default highlight
					if (oldHighlight != null)
						oldHighlight.splice();
					// higlight special object
					node.insert('node', othis.constants.highlightSelectedSpecialObject);
				} else
					// insert a higlight node to highlight selected element;
					// highlight
					// entire storey by adding a highlight node under parent
					// (original
					// withount parent())
					node.insert('node', othis.constants.highlightMaterial);
				othis.helpShortcuts('selection', 'navigation', 'standard');
				if (($('#controls-accordion-properties')).hasClass('ui-accordion-content-active')) {
					return othis.helpShortcutsHide('inspection');
				}
			}
		}
	};

	/**
	 * Scrolls to the selected Element in the ifc Tree.
	 */
	this.controlsTreeScrollToSelected = function() {
		var list = $('#main-view-controls');
		var offset = list.find('.controls-tree-selected').offset();
		if (offset != null) {
			var optionTop = offset.top;
			var selectTop = list.offset().top;
			list.scrollTop(list.scrollTop() + (optionTop - selectTop));
		}
	};

	/**
	 * Reacts on Filter inputtext changed event.
	 */
	this.filterChanged = function() {
		$('#filtered-list').find('li').remove(); // clear last filter result
		var inputtext = $('#filterinput').val().split(';'); // get tokens
		// delimited by ';'
		othis.filterObjects(inputtext);
	};

	/**
	 * Filters the Object tree according to the string in the input field.
	 */
	this.filterObjects = function(inputtext) {
		// add case-insensitive search functionally to jquery
		$.extend($.expr[':'], {
			'contains-case-insensitive' : function(elem, i, match, array) {
				return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
			}
		});
		// iterate all filter patterns (delimited by ';')
		for ( var j = 0; j < inputtext.length; j++) {
			var filtertext = inputtext[j];
			var foundElements = $('div.controls-tree-item:contains-case-insensitive(' + filtertext + ')');
			// iterate all found elements
			for ( var i = 0; i < foundElements.length; i++) {
				var id = $(foundElements[i]).closest('.controls-tree-rel').attr('id');
				var text = $(foundElements[i]).closest('.controls-tree-rel').text().split(")")[0] + ")"; // split
				// ensures
				// that
				// only
				// the
				// first
				// element
				// (inclusive
				// description
				// in
				// brackets)
				// is
				// listed
				var html = "<li id='" + id + "' class='filtered-item controls-tree-item'>" + text + "</li>";
				$('#filtered-list').append(html);
				$('#filtered-list').find('#' + RegExp.escape(id)).click(function() { // append
					// filtered
					// element
					// to
					// list
					// and
					// set
					// click
					// handler
					var id = $(this).attr('id');
					othis.controlsTreeSelectObject(id); // select Element in 3D
					// Modell
					$(this).addClass("controls-tree-selected");
				});
			}
		}
	};

	this.controlsShowProperties = function(event) {
		if ((event != null) && event.target.nodeName === 'INPUT')
			return;
		($('#controls-accordion')).accordion('activate', 1);
		return othis.helpShortcutsHide('inspection');
	};

	/**
	 * If doubleclick on an Object in Filter Tab, set View to this Object
	 */
	this.controlsDoubleClickFilter = function(event) {
		if ((event != null) && event.target.nodeName === 'INPUT')
			return;
		return othis.doSetViewToObject(event.target.id);
	};

	/**
	 * If doubleclick on an Object in Overview Tab, set View to this Object
	 */
	this.controlsDoubleClickOverview = function(event) {
		if ((event != null) && event.target.nodeName === 'INPUT')
			return;
		return othis.doSetViewToObject($(event.target).parent().attr('id'));
	};

	this.controlsNavigateLink = function(event) {
		othis.controlsPropertiesSelectObject((($(event.target)).attr('href')).slice(1));
		return false;
	};

	this.controlsToggleLayer = function(event) {
		var el, elements, tags;
		elements = ($('#controls-layers input:checked')).toArray();
		tags = (function() {
			var _i, _len, _results;
			_results = [];
			for (_i = 0, _len = elements.length; _i < _len; _i++) {
				el = elements[_i];
				if (othis.constants.loadingType.loadFromBimserver == 1){
					if (othis.loadedTypes.indexOf($(el).attr("className")) == -1) {
						othis.typeDownloadQueue = [ $(el).attr("className") ];
						othis.bimServerApi.call("PluginInterface", "getSerializerByPluginClassName", {
							pluginClassName : "org.bimserver.geometry.json.JsonGeometrySerializerPlugin"
						}, function(serializer) {
							othis.loadGeometry(othis.currentAction.roid, serializer.oid);
						});
					}
				}
				_results.push(((($(el)).attr('id')).split(/^layer\-/))[1]);
			}
			return _results;
		})();
		return othis.scene.set('tagMask', '^(' + (tags.join('|')) + ')$');
	};

	this.snapshotsPush = function(thumb) {
		var imgURI, node, thumbSize;
		if (!(othis.scene != null))
			return;
		if ($.browser.webkit) {
			othis.scene.renderFrame({
				force : true
			});
		}
		thumbSize = othis.constants.thumbnails.size;
		imgURI = othis.canvasCaptureThumbnail(othis.canvas, 512 * thumbSize[0] / thumbSize[1], 512, othis.constants.thumbnails.scale * thumbSize[0],
				othis.constants.thumbnails.scale * thumbSize[1]);
		node = othis.scene.findNode('main-lookAt');
		othis.snapshots.lookAts.push({
			eye : node.get('eye'),
			look : node.get('look'),
			up : node.get('up')
		});
		if (thumb)
			($('#snapshots')).append("<div class='snapshot'><div class='snapshot-thumb'><a href='#' class='snapshot-delete'>x</a><img width='" + thumbSize[0] + "px' height='"
					+ thumbSize[1] + "px' src='" + imgURI + "'></div></div>");
		// return ($('#snapshots')).append("<div class='snapshot'><div
		// class='snapshot-thumb'><a href='#' class='snapshot-delete'>x</a><img
		// width='"
		// + thumbSize[0] + "px' height='" + thumbSize[1] + "px' src='" + imgURI
		// +
		// "'></div></div>");
		return 0;
	};

	/**
	 * Calculates the Eye Position and the Look Position to get a View to the
	 * Point of interest
	 * 
	 * @param x
	 *            an Integer with the x Value of the first Vertex of an Object
	 * @param y
	 *            an Integer with the y Value of the first Vertex of an Object
	 * @param z
	 *            an Integer with the z Value of the first Vertex of an Object
	 */
	this.snapshotsPushObject = function(x, y, z) {
		var node, zoomAtNode;
		if (!(othis.scene != null))
			return;
		if ($.browser.webkit) {
			othis.scene.renderFrame({
				force : true
			});
		}

		// get reference to main-lookAt node
		node = othis.scene.findNode('main-lookAt');

		var xView, yView, zView;

		// from which side should be watched
		if (othis.propertyValues.boundfactor) {
			if (y < 0) {
				yView = y - 14 * 1 / othis.propertyValues.scalefactor;
			} else {
				yView = y + 14 * 1 / othis.propertyValues.scalefactor;
			}
			xView = x;
		} else {
			if (x < 0) {
				xView = x - 14 * 1 / othis.propertyValues.scalefactor;
			} else {
				xView = x + 14 * 1 / othis.propertyValues.scalefactor;
			}
			yView = y;
		}
		zView = z + 5 * 1 / othis.propertyValues.scalefactor;

		// Set new eye, look and up values
		zoomAtNode = othis.scene.findNode('main-lookAt');
		zoomAtNode.set('eye', {
			x : xView,
			y : yView,
			z : zView
		});
		zoomAtNode.set('look', {
			x : x,
			y : y,
			z : z
		});
		zoomAtNode.set('up', othis.lookAt.defaultParameters.up);

		// call snapshot move destination
		othis.snapshots.lookAts.push({
			eye : zoomAtNode.get('eye'),
			look : zoomAtNode.get('look'),
			up : zoomAtNode.get('up')
		});

		return 0;
		// return ($('#snapshots')).append("<div class='snapshot'><div
		// class='snapshot-thumb'><a href='#' class='snapshot-delete'>x</a><img
		// width='" + thumbSize[0] + "px' height='" + thumbSize[1] + "px' src='"
		// + imgURI + "'></div></div>");
	};

	this.snapshotsDelete = function(event) {
		var $parent;
		$parent = ($(event.target)).parent();
		othis.snapshots.lookAts.splice($parent.index() + 1, 1);
		return $parent.remove();
	};

	this.snapshotsToggle = function(event) {
		if (!(othis.scene != null)) {
		}
	};

	this.snapshotsPlay = function(event) {
		if (!(othis.scene != null))
			return;
		return (SceneJS.FX.TweenSpline(othis.scene.findNode('main-lookAt'))).sequence(othis.snapshots.lookAts);
	};

	// http://stackoverflow.com/questions/1885557/simplest-code-for-array-intersection-in-javascript	
	this.intersect_safe = function(a, b)
	{
	  var ai=0, bi=0;
	  var result = new Array();

	  while( ai < a.length && bi < b.length )
	  {
	     if      (a[ai] < b[bi] ){ ai++; }
	     else if (a[ai] > b[bi] ){ bi++; }
	     else /* they're equal */
	     {
	       result.push(a[ai]);
	       ai++;
	       bi++;
	     }
	  }
	  return result;
	}
	
	this.progressHandler = function(topicId, state) {
		if (state.state == "FINISHED") {
			othis.bimServerApi.unregisterProgressHandler(othis.currentAction.laid, othis.progressHandler);
			var url = othis.bimServerApi.generateRevisionDownloadUrl({
				serializerOid : othis.currentAction.serializerOid,
				laid : othis.currentAction.laid
			});
			$(".loadingdiv .text").html("Downloading BIM model");
			$(".loadingdiv .progress").remove();
			$(".loadingdiv").append("<div class=\"progress progress-striped active\"><div class=\"bar\" style=\"width: 0%\"></div></div>");
			$(".loadingdiv .progress .bar").css("width", "100%");
			$.ajax(url).done(function(data) {
				othis.loadScene(data);
				othis.helpStatusClear();
				othis.bimServerApi.call("PluginInterface", "getSerializerByPluginClassName", {
					pluginClassName : "org.bimserver.geometry.json.JsonGeometrySerializerPlugin"
				}, function(serializer) {
					othis.typeDownloadQueue = othis.classNames.slice(0);

					// Remove the types that are not there anyways
					othis.typeDownloadQueue.sort();
					data.data.ifcTypes.sort();
					othis.typeDownloadQueue = othis.intersect_safe(othis.typeDownloadQueue, data.data.ifcTypes);
					
					othis.loadGeometry(othis.currentAction.roid, serializer.oid);
				});
			});
		} else {
			if (state.progress != -1) {
				$(".loadingdiv .progress .bar").css("width", state.progress + "%");
			}
		}
	};

	this.loadBimServerModelNew = function(roid) {
		othis.loadedTypes = [];
		othis.currentAction = {
			roid : roid
		};
		othis.bimServerApi.call("PluginInterface", "getSerializerByPluginClassName", {
			pluginClassName : "org.bimserver.geometry.jsonshell.SceneJsShellSerializerPlugin"
		}, function(serializer) {
			othis.bimServerApi.call("ServiceInterface", "download", {
				roid : roid,
				serializerOid : serializer.oid,
				showOwn : true,
				sync : false
			}, function(laid) {
				othis.bimServerApi.registerProgressHandler(laid, othis.progressHandler, function(){
					othis.bimServerApi.call("RegistryInterface", "getProgress", {topicId: laid}, function(state){
						othis.progressHandler(null, state);
					});
				});
				$(".loadingdiv").hide();
				$(".loadingdiv .text").html("Loading BIM model");
				$(".loadingdiv .progress").remove();
				$(".loadingdiv").append("<div class=\"progress\"><div class=\"bar\" style=\"width: 0%\"></div></div>");
				$(".loadingdiv").fadeIn(500);
				othis.currentAction.serializerOid = serializer.oid;
				othis.currentAction.laid = laid;
				othis.currentAction.roid = roid;
			});
		});
	};

	this.progressHandlerType = function(topicId, state) {
		$(".loadingdiv .progress .bar").css("width", state.progress + "%");
		if (state.state == "FINISHED" && othis.mode == "loading") {
			othis.mode = "processing";
			othis.bimServerApi.unregisterProgressHandler(othis.currentAction.laid, othis.progressHandlerType);
			var url = othis.bimServerApi.generateRevisionDownloadUrl({
				serializerOid : othis.currentAction.serializerOid,
				laid : othis.currentAction.laid
			});
			$(".loadingdiv .progress").addClass("progress-striped").addClass("active");
			$.getJSON(url, function(data) {
				othis.loadedTypes.push(othis.currentAction.className);
				othis.loadGeometry(othis.currentAction.roid, othis.currentAction.serializerOid);
				var typeNode = {
					type : "tag",
					tag : othis.currentAction.className.toLowerCase(),
					id : othis.currentAction.className.toLowerCase(),
					nodes : []
				};
				var library = othis.scene.findNode("library");
				var bounds = othis.scene.data().bounds2;
				data.geometry.forEach(function(geometry) {
					var material = {
						type : "material",
						coreId : geometry.material + "Material",
						nodes : [ {
							id : geometry.coreId,
							type : "name",
							nodes : [  ]
						} ]
					};
					if (geometry.nodes != null) {
						geometry.nodes.forEach(function(node){
							if (node.positions != null) {
								for (var i = 0; i < node.positions.length; i += 3) {
									node.positions[i] = node.positions[i] - bounds[0];
									node.positions[i + 1] = node.positions[i + 1] - bounds[1];
									node.positions[i + 2] = node.positions[i + 2] - bounds[2];
								}
								node.indices = [];
								for (var i = 0; i < node.nrindices; i++) {
									node.indices.push(i);
								}
								library.add("node", node);
								material.nodes[0].nodes.push({
									type: "geometry",
									coreId: node.coreId
								});
							}
						});
					} else {
						if (geometry.positions != null) {
							for (var i = 0; i < geometry.positions.length; i += 3) {
								geometry.positions[i] = geometry.positions[i] - bounds[0];
								geometry.positions[i + 1] = geometry.positions[i + 1] - bounds[1];
								geometry.positions[i + 2] = geometry.positions[i + 2] - bounds[2];
							}
							geometry.indices = [];
							for (var i = 0; i < geometry.nrindices; i++) {
								geometry.indices.push(i);
							}
							library.add("node", geometry);
							material.nodes[0].nodes.push({
								type: "geometry",
								coreId: geometry.coreId
							});
						}
					}
					if (geometry.material == "IfcWindow") {
						var flags = {
							type : "flags",
							flags : {
								transparent : true
							},
							nodes : [ material ]
						};
						typeNode.nodes.push(flags);
					} else {
						typeNode.nodes.push(material);
					}
				});
				othis.scene.findNode("main-renderer").add("node", typeNode);
				$("#layer-" + othis.currentAction.className.toLowerCase()).attr("checked", "checked");
			});
		}
	};

	this.loadGeometry = function(roid, serializerOid) {
		if (othis.typeDownloadQueue.length == 0) {
			$(".loadingdiv").fadeOut(800);
			return;
		}
		var className = othis.typeDownloadQueue[0];
		$(".loadingdiv .text").html("Loading " + className);
		$(".loadingdiv .progress").remove();
		$(".loadingdiv").append("<div class=\"progress\"><div class=\"bar\" style=\"width: 0%\"></div></div>");
		$(".loadingdiv").show();
		othis.typeDownloadQueue = othis.typeDownloadQueue.slice(1);
		othis.bimServerApi.call("ServiceInterface", "downloadByTypes", {
			roids : [ roid ],
			classNames : [ className ],
			serializerOid : serializerOid,
			includeAllSubtypes : false,
			useObjectIDM : false,
			sync : false,
			deep: true
		}, function(laid) {
			othis.mode = "loading";
			othis.bimServerApi.registerProgressHandler(laid, othis.progressHandlerType, function(){
				othis.bimServerApi.call("RegistryInterface", "getProgress", {topicId: laid}, function(state){
					othis.progressHandlerType(null, state);
				});
			});
			othis.currentAction.serializerOid = serializerOid;
			othis.currentAction.laid = laid;
			othis.currentAction.roid = roid;
			othis.currentAction.className = className;
		});
	};

	// Fixes download of objects from BIM Server Repository
	/*
	 * duckt-tape-fix by: DLabz designlabz@gmail.com veljko@sigidev.com * * * * * * * * * * * * *
	 */
	this.bimserverImport = function(url, roid) {
		var downloadDone, getDownloadDataDone, pwd, user;

		othis.log("Load BIMserver project with revision # " + roid + "...");

		othis.loadBimServerModelNew(roid);
	};

	/* end fix */

	this.hideDialog = function() {
		return ($('#dialog-background,#dialog-bimserver-import,#dialog-file-import')).hide();
	};

	this.bimserverImportDialogClearMessages = function() {
		($('#bimserver-import-message-info')).html('');
		($('#bimserver-import-message-error')).html('');
		return ($('.error')).removeClass('error');
	};

	this.bimserverImportDialogShow = function() {
		othis.bimserverImportDialogShowTab1();
		if (othis.bimServerApi == null) {
			if ($.cookie("autologin") != null) {
				var timeoutId;
				timeoutId = window.setTimeout(function() {
					$.removeCookie("username");
					$.removeCookie("autologin");
					$.removeCookie("address");
				}, 3000);
				$.getScript($.cookie("address") + "/js/bimserverapi.js").done(function(script, textStatus) {
					window.clearTimeout(timeoutId);
					othis.bimServerApi = new BimServerApi($.cookie("address"));
					othis.bimServerApi.autologin($.cookie("username"), $.cookie("autologin"), function() {
						othis.bimserverImportDialogShowTab2();
						othis.bimserverImportDialogRefresh();
					}, function() {
					});
				})
			} else {
			}
		} else {
			othis.bimserverImportDialogShowTab2();
		}
		return ($('#dialog-background,#dialog-bimserver-import')).show();
	};

	this.bimserverImportDialogShowTab1 = function() {
		var $stepElements;
		othis.bimserverImportDialogClearMessages();
		$stepElements = $('#dialog-bimserver-import .dialog-step');
		($($stepElements.get(0))).addClass('dialog-step-active');
		($($stepElements.get(1))).removeClass('dialog-step-active');
		($('#dialog-tab-bimserver1')).show();
		return ($('#dialog-tab-bimserver2')).hide();
	};

	this.bimserverImportDialogShowTab2 = function() {
		var $stepElements;
		othis.bimserverImportDialogClearMessages();
		$stepElements = $('#dialog-bimserver-import .dialog-step');
		($($stepElements.get(0))).removeClass('dialog-step-active');
		($($stepElements.get(1))).addClass('dialog-step-active');
		($('#dialog-tab-bimserver1')).hide();
		return ($('#dialog-tab-bimserver2')).show();
	};

	this.bimserverImportDialogToggleTab2 = function() {
		return othis.bimserverImportDialogShowTab2();
	};

	this.bimserverLogout = function(){
		othis.bimServerApi.logout(function(){
			othis.bimserverImportDialogShowTab1();
		});
	};
	
	this.bimserverImportDialogLogin = function() {
		var pwd, url, user, valid;
		othis.bimserverImportDialogClearMessages();
		($('bimserver-projects')).html("");
		url = ($('#bimserver-login-url')).val();
		user = ($('#bimserver-login-username')).val();
		pwd = ($('#bimserver-login-password')).val();
		valid = true;
		if (url.length < 1) {
			($('#bimserver-login-url')).addClass('error');
			valid = false;
		}
		if (user.length < 1) {
			($('#bimserver-login-username')).addClass('error');
			valid = false;
		}
		if (pwd.length < 1) {
			($('#bimserver-login-password')).addClass('error');
			valid = false;
		}
		if (!valid) {
			($('#bimserver-import-message-error')).html("Some fields are incorrect");
			return false;
		}
		($('#dialog-tab-bimserver1 input, #dialog-tab-bimserver1 button')).attr('disabled', 'disabled');
		($('#bimserver-import-message-info')).html("Sending login request...");

		var timeoutId; // timeout id is a global variable
		timeoutId = window.setTimeout(function() {
			othis.log("Could not connect");
		}, 3000);
		$.getScript(url + "/js/bimserverapi.js").done(function(script, textStatus) {
			window.clearTimeout(timeoutId);
			othis.bimServerApi = new BimServerApi(url);
			othis.bimServerApi.login(user, pwd, $("#bimserver-login-rememberme").is(":checked"), function() {
				($('#bimserver-import-message-info')).html("Login request succeeded");
				($('#dialog-tab-bimserver1 input, #dialog-tab-bimserver1 button')).removeAttr('disabled');
				othis.bimserverImportDialogShowTab2();
				return othis.bimserverImportDialogRefresh();
			}, function() {
				($('#bimserver-import-message-info')).html("");
				return ($('#bimserver-import-message-error')).html("Login request failed");
			});
		});
		return false;
	};

	this.bimserverImportDialogRefresh = function() {
		var $projectList, url;
		url = ($('#bimserver-login-url')).val();
		($('#dialog-tab-bimserver2 button')).attr('disabled', 'disabled');
		($('#bimserver-projects-submit')).attr('disabled', 'disabled');
		$projectList = $('#bimserver-projects');
		$projectList.html("");

		othis.bimServerApi.call("ServiceInterface", "getAllProjects", {
			onlyTopLevel : true
		}, function(data) {
			($('#bimserver-import-message-info')).html("Fetched all projects");
			data.forEach(function(project) {
				if (project.lastRevisionId != -1) {
					$projectList
							.append("<li class='bimserver-project' bimserveroid='" + project.oid + "' bimserverroid='" + project.lastRevisionId + "'>" + project.name + "</li>")
				}
			});
			return ($('#dialog-tab-bimserver2 button')).removeAttr('disabled');
		}, function() {
			($('#bimserver-import-message-info')).html('');
			($('#dialog-tab-bimserver2 button')).removeAttr('disabled');
			return ($('#bimserver-import-message-error')).html("Couldn't fetch projects");
		});
	};

	this.bimserverImportDialogSelect = function(event) {
		($('.bimserver-project-selected')).removeClass('bimserver-project-selected');
		($(event.target)).addClass('bimserver-project-selected');
		return ($('#bimserver-projects-submit')).removeAttr('disabled');
	};

	this.bimserverImportDialogLoad = function() {
		var $selectedProject, url;
		$selectedProject = $('.bimserver-project-selected');
		if ($selectedProject.length === 0) {
			return ($('#bimserver-import-message-error')).html("No project selected");
		} else {
			othis.hideDialog();
			url = ($('#bimserver-login-url')).val();
			if (url[url.length - 1] !== '/')
				url += '/';
			return othis.bimserverImport(url, $selectedProject.attr('bimserverroid'));
		}
	};

	this.fileImportDialogShow = function(event) {
		return ($('#dialog-background,#dialog-file-import')).show();
	};

	this.fileImportDialogLoad = function(event) {
		var file, reader, _ref;
		reader = new FileReader();
		reader.onloadend = function(f) {
			try {
				othis.loadScene($.parseJSON(f.target.result));
				return othis.helpStatusClear();
			} catch (error) {
				othis.log(error);
			}
		};
		file = (_ref = ($('#upload-file')).get(0)) != null ? _ref.files[0] : void 0;
		if (file != null) {
			reader.readAsText(file);
			return othis.hideDialog();
		} else {
			($('#file-import-message-error')).html("No file selected");
			othis.log("No file selected");
			return void 0;
		}
	};
	
	//window.fileImport = function(file) {		//use this for call from GWT
	this.fileImport = function(file) {
		var ret = $.getJSON(file, function(json) {
			othis.loadScene(json);
		});
		if (ret.readyState == 0){
			console.log("File: .../" + file + " not found!");
		}
	}

	this.registerDOMEvents = function() {
		($(othis.viewport.domElement)).mousedown(othis.mouseDown);
		($(othis.viewport.domElement)).mouseup(othis.mouseUp);
		($(othis.viewport.domElement)).mousemove(othis.mouseMove);
		othis.viewport.domElement.addEventListener('mousewheel', othis.mouseWheel, false);

		document.addEventListener('keydown', othis.keyDown, false);
		return window.addEventListener('resize', othis.windowResize, false);
	};

	this.registerControlEvents = function() {
		($('#upload-form')).submit(othis.fileImportDialogLoad);
		($('.dialog-close')).click(othis.hideDialog);
		($('#dialog-tab-bimserver1')).submit(othis.bimserverImportDialogLogin);
		($('#dialog-tab-bimserver2')).submit(othis.bimserverImportDialogLoad);
		($('#bimserver-import-step1')).click(othis.bimserverImportDialogShowTab1);
		($('#bimserver-import-step2')).click(othis.bimserverImportDialogToggleTab2);
		($('#bimserver-projects-refresh')).click(othis.bimserverImportDialogRefresh);
		($('#bimserver-projects-logout')).click(othis.bimserverLogout);
		($('#bimserver-projects')).delegate('li', 'click', othis.bimserverImportDialogSelect);
		($('#top-menu-import-bimserver')).click(othis.topmenuImportBimserver);
		($('#top-menu-import-scenejs')).click(othis.topmenuImportSceneJS);
		($('#top-menu-performance-quality')).click(othis.topmenuPerformanceQuality);
		($('#top-menu-performance-performance')).click(othis.topmenuPerformancePerformance);
		($('#top-menu-mode-basic')).click(othis.topmenuModeBasic);
		($('#top-menu-mode-advanced')).click(othis.topmenuModeAdvanced);
		($('#top-menu-help')).click(othis.topmenuHelp);
		($('#main-views-reset')).click(othis.mainmenuViewsReset);
		($('#main-views-front')).click(othis.mainmenuViewsFront);
		($('#main-views-side')).click(othis.mainmenuViewsSide);
		($('#main-views-top')).click(othis.mainmenuViewsTop);
		($('#expose')).slider({
			slide : function(event, ui) {
				window.setExposeLevel(ui.value);
			}
		});
		($('#transparent')).slider({
			slide : function(event, ui) {
				window.setTransparentLevel(100 - ui.value);
			}
		});
		($('#zoom')).slider({
			slide : function(event, ui) {
				window.setZoomLevelAbsolute(Math.round(ui.value/5))
			}
		});
		($('#toggle-Pan-Rotate')).click(othis.togglePanRotate);
		($('#controls-relationships')).delegate('.controls-tree-item', 'click', othis.controlsToggleTreeOpen);
		($('#controls-relationships')).delegate('.controls-tree-item', 'dblclick', othis.controlsDoubleClickOverview);
		($('#filtered-list')).delegate('.controls-tree-item', 'dblclick', othis.controlsDoubleClickFilter);
		($('#controls-relationships')).delegate('input', 'change', othis.controlsToggleTreeVisibility);
		($('#controls-layers')).delegate('input', 'change', othis.controlsToggleLayer);
		($('#snapshot-placeholder')).click(function() {
			othis.snapshotsPush(true);
		});
		($('#snapshots')).delegate('.snapshot', 'click', othis.snapshotsToggle);
		($('#snapshots')).delegate('.snapshot-delete', 'click', othis.snapshotsDelete);
		($('#snapshots-play')).click(othis.snapshotsPlay);
		return ($(othis.viewport.domElement)).dblclick(othis.controlsShowProperties);
	};

	this.canvasInit = function() {
		return othis.windowResize();
	};

	this.log = function(message) {
		if (othis.loggingEnabled) {
			console.log(message);
		}
	};

	this.sceneInit = function() {
		var lookAtNode, sceneDiameter, tag, tags;
		othis.modifySubAttr(othis.scene.findNode('main-camera'), 'optics', 'aspect', othis.canvas.width / othis.canvas.height);
		sceneDiameter = SceneJS_math_lenVec3(othis.scene.data().bounds);
		othis.log("SceneDiameter: " + sceneDiameter); // TODO: remove log?
		othis.camera.distanceLimits = [ sceneDiameter * 0.1, sceneDiameter * 2.0 ];
		tags = (function() {
			var _i, _len, _ref, _results;
			_ref = othis.scene.data().ifcTypes;
			_results = [];
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				tag = _ref[_i];
				_results.push(tag.toLowerCase());
			}
			return _results;
		})();
		othis.scene.set('tagMask', '^(' + (tags.join('|')) + ')$');
		lookAtNode = othis.scene.findNode('main-lookAt');
		othis.lookAt.defaultParameters.eye = lookAtNode.get('eye');
		othis.lookAt.defaultParameters.look = lookAtNode.get('look');
		return othis.lookAt.defaultParameters.up = lookAtNode.get('up');
	};

	this.controlsInit = function() {
		var ifcType, layersHtml, sceneData;
		sceneData = othis.scene.data();
		layersHtml = (function() {
			var _i, _len, _ref, _results;
			_ref = sceneData.ifcTypes;
			_results = [];
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				ifcType = _ref[_i];
				//check if Layer checkboxes get info from local file or a Bimserver
				if(othis.constants.loadingType.loadFromBimserver == 1){
					_results.push("<div><label>" + "<input id='layer-" + ifcType.toLowerCase() + "' className='" + ifcType + "' type='checkbox'> " + ifcType + "</label>" + "</div>");
				}else{
					_results.push("<div><label>" + "<input id='layer-" + ifcType.toLowerCase() + "' className='" + ifcType + "' type='checkbox' checked='checked'> " + ifcType + "</label>" + "</div>");
				}
			}
			return _results;
		})();
		($('#controls-layers')).html(layersHtml.join(''));
		othis.controlsPropertiesSelectObject();
		($('#controls-accordion')).accordion({
			header : 'h3'
		});
		($('#object-tabs')).tabs();
		($('#filterinput')).val("");
		($('#filterinput')).change(othis.filterChanged);

		return ($('#main-view-controls')).removeAttr('style');
	};

	this.viewportInit = function() {
		return $('#scenejsCanvas').toggleClass('bimsurfer-empty-watermark', !(othis.scene != null));
	};

	// initialize the ifc object tree
	this.ifcTreeInit = function() {
		var ifcContains, ifcDecomposedBy, ifcDefinedBy, ifcObjectDescription, ifcProject, ifcRelationships, project, sceneData, treeHtml, _i, _len, _ref;
		sceneData = othis.scene.data();

		// initialize the Objects Tab
		ifcObjectDescription = function(obj, indent) {
			return "<li class='controls-tree-rel' id='" + obj.id + "'><div class='controls-tree-item'><span class='indent-" + String(indent) + "'/>"
					+ "<input type='checkbox' checked='checked'> " + obj.name + "<span class='controls-tree-postfix'>(" + obj.type + ")</span></div>"
					+ (ifcDefinedBy(obj.decomposedBy, indent)) + (ifcDefinedBy(obj.definedBy, indent)) + (ifcContains(obj.contains, indent)) + "</li>";
		};
		ifcProject = function(obj) {
			return "<li class='controls-tree-root' id='" + obj.id + "'><div class='controls-tree-item'>" + obj.name + "<span class='controls-tree-postfix'>(" + obj.type
					+ ")</span></div>" + (ifcDefinedBy(obj.decomposedBy, 0)) + (ifcDefinedBy(obj.definedBy, 0)) + (ifcContains(obj.contains, 0)) + "</li>";
		};
		ifcRelationships = function(type, rel, indent) {
			var html, obj, _i, _len;
			if ((rel != null) && rel.length > 0) {
				indent = Math.min(indent + 1, 6);
				html = "<ul class='controls-tree'>";
				html += "<div class='controls-tree-heading'><hr><h4>" + type + "</h4></div>";
				for (_i = 0, _len = rel.length; _i < _len; _i++) {
					obj = rel[_i];
					html += ifcObjectDescription(obj, indent);
				}
				return html += "</ul>";
			} else {
				return "";
			}
		};
		ifcDecomposedBy = function(rel, indent) {
			return ifcRelationships('Decomposed By', rel, indent);
		};
		ifcDefinedBy = function(rel, indent) {
			return ifcRelationships('Defined By', rel, indent);
		};
		ifcContains = function(rel, indent) {
			return ifcRelationships('Contains', rel, indent);
		};
		treeHtml = "<ul class='controls-tree'>";
		_ref = sceneData.relationships;
		for (_i = 0, _len = _ref.length; _i < _len; _i++) {
			project = _ref[_i];
			var name = project.name;
			othis.log("obj.name: " + project.name);
			othis.log("obj.type: " + project.type);
			treeHtml += ifcProject(project);
		}
		treeHtml += "</ul>";
		return ($('#controls-relationships')).html(treeHtml);
	};

	this.parseQueryArguments = function() {
		var arg, argKeyVal, args, argsParts, part, _i, _len;
		args = {};
		argsParts = (document.location.search.substring(1)).split('&');
		for (_i = 0, _len = argsParts.length; _i < _len; _i++) {
			part = argsParts[_i];
			arg = unescape(part);
			if ((arg.indexOf('=')) === -1) {
				args[arg.trim()] = true;
			} else {
				argKeyVal = arg.split('=');
				args[argKeyVal[0].trim()] = argKeyVal[1].trim();
			}
		}
		if ((args.model != null) && (args.model.substr(-1)) === '/') {
			args.model = args.model.substr(0, args.model.length - 1);
		}
		return args;
	};

	this.initLoadModel = function(modelUrl) {
		($.get(modelUrl, void 0, void 0, 'json')).done(function(data, textStatus, jqXHR) {
			try {
				return othis.loadScene(data);
			} catch (error) {
				othis.log(error);
				return void 0;
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			othis.log(textStatus);
		});
	};

	this.loadScene = function(scene) {
		if (othis.scene != null) {
			othis.scene.destroy();
			othis.scene = null;
			($('#expose')).slider("value",0);
			($('#transparent')).slider("value",0);
		}
		try {
			othis.log('Create scene...');
			othis.scene = SceneJS.createScene(scene);
			othis.viewportInit();
			if (othis.scene != null) {
				othis.log('Initialize scene...');
				othis.sceneInit();

				othis.log('Start scene...');
				othis.scene.start({
					idleFunc : SceneJS.FX.idle
				});

				othis.log('Initialize controls...');
				othis.controlsInit();

				othis.log('Initialize IFC object tree...');
				othis.ifcTreeInit();
				othis.helpShortcuts('standard', 'navigation');

				othis.log('...Done');

				// Calculate Scalefactor
				var ref, len, i, unit, sizingFactor;

				unit = othis.scene.data().unit;
				othis.log("Unit: " + unit);
				ref = othis.scene.data().bounds;
				for (i = 0, len = ref.length; i < len; i++) { // iterate all
					// bounds
					othis.log("Bound" + i + ": " + ref[i]);
				}
				// to decide which side is used to set view in setViewToObject
				if (ref[0] > ref[1]) {
					othis.propertyValues.boundfactor = 1; // for setView to
					// decide the main
					// viewside
				}
				othis.propertyValues.scalefactor = parseFloat(unit);

				// setting viewfactor for different views
				othis.propertyValues.viewfactor = SceneJS_math_lenVec3(othis.scene.data().bounds);

				// set Navigation Mode to rotate
				window.setNavigationMode(0);

				// highlight all elements with specified name
				othis.highlightElements("dp_");
				
				// set ZoomSlider to middle
				othis.setZoomSlider(75);
				return othis.scene;
			}
		} catch (error) {
			othis.log(error);
			othis.log('...Errors occured');
		}
		othis.helpShortcuts('standard');
		return null;
	};
	
	othis.queryArgs = othis.parseQueryArguments();
	othis.canvasInit();
	othis.viewportInit();
	if (othis.scene != null) {
		othis.controlsInit();
		othis.ifcTreeInit();
		othis.helpShortcuts('standard', 'navigation');
	} else {
		othis.helpStatus("Please load a project from the <strong>File</strong> menu in the top left-hand corner.");
		othis.helpShortcuts('standard');
	}
	othis.registerDOMEvents();
	othis.registerControlEvents();
	othis.application.initialized = true;
	
	if (othis.queryArgs.token != null) {
		var timeoutId; // timeout id is a global variable
		timeoutId = window.setTimeout(function() {
			othis.log("Could not connect");
		}, 3000);
		$.getScript(othis.queryArgs.server + "/js/bimserverapi.js").done(function(script, textStatus) {
			window.clearTimeout(timeoutId);
			othis.bimServerApi = new BimServerApi(othis.queryArgs.server);
			othis.bimServerApi.setToken(othis.queryArgs.token);
			othis.loadBimServerModelNew(othis.queryArgs.roid);
		});
	}
	
	if ((othis.queryArgs.model != null) && othis.queryArgs.format === 'scenejson') {
		return othis.initLoadModel(othis.queryArgs.model);
	}
	
	//Hardcoded Path for autoload
	//othis.propertyValues.autoLoadPath = "models/Haus.json";
	
	//start Autoload-Action from GWT
	//GWT: window.callbackImportObject();
	
	//if there is a string set, load Model
	if (othis.propertyValues.autoLoadPath == ""){
		console.log("No Model for Autoload");
	}else{
		console.log("Autoload Model   .../" + othis.propertyValues.autoLoadPath);
		othis.fileImport(othis.propertyValues.autoLoadPath);
	}
}
new BimSurfer();