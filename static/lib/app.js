/*
 * BIM Viewer
 * Copyright 2011, Bimserver.org.
 */
"use strict";

(function() {
  var canvasCaptureThumbnail, constants, controlsInit, controlsToggleLayer, lookAtToQuaternion, modifySubAttr, mouseDown, mouseMove, mouseUp, mouseWheel, orbitLookAt, orbitLookAtNode, recordToVec3, recordToVec4, registerDOMEvents, sceneInit, snapshotsDelete, snapshotsPush, snapshotsToggle, state, topmenuHelp, vec3ToRecord, vec4ToRecord, zoomLookAt, zoomLookAtNode;
  canvasCaptureThumbnail = function(srcCanvas, srcWidth, srcHeight, destWidth, destHeight) {
    var clipHeight, clipWidth, clipX, clipY, h, imgURI, thumbCanvas, thumbCtx, w;
    thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = destWidth;
    thumbCanvas.height = destHeight;
    thumbCtx = thumbCanvas.getContext('2d');
    w = ($(srcCanvas)).width();
    h = ($(srcCanvas)).height();
    clipHeight = Math.min(h, srcHeight);
    clipWidth = Math.min(w, srcWidth);
    clipX = Math.floor((w - srcWidth) / 2);
    clipY = Math.floor((h - srcHeight) / 2);
    thumbCtx.drawImage(srcCanvas, clipX, clipY, clipWidth, clipHeight, 0, 0, destWidth, destHeight);
    imgURI = thumbCanvas.toDataURL('image/png');
    return imgURI;
  };
  modifySubAttr = function(node, attr, subAttr, value) {
    var attrRecord;
    attrRecord = node.get(attr);
    attrRecord[subAttr] = value;
    return node.set(attr, attrRecord);
  };
  recordToVec3 = function(record) {
    return [record.x, record.y, record.z];
  };
  recordToVec4 = function(record) {
    return [record.x, record.y, record.z, record.w];
  };
  vec3ToRecord = function(vec) {
    return {
      x: vec[0],
      y: vec[1],
      z: vec[2]
    };
  };
  vec4ToRecord = function(vec) {
    return {
      x: vec[0],
      y: vec[1],
      z: vec[2],
      w: vec[3]
    };
  };
  lookAtToQuaternion = function(lookAt) {
    var axis, look, up;
    look = SceneJS_math_subVec3(lookAt.target(lookAt.eye));
    axis = SceneJS_math_normalizeVec3(SceneJS_math_cross3Vec3(look(lookAt.up)));
    SceneJS_math_normalizeVec3(look(look));
    up = SceneJS_math_cross3Vec3(axis(look));
    return SceneJS_math_newQuaternionFromMat3(axis.concat(up, look));
  };
  orbitLookAt = function(dAngles, orbitUp, lookAt) {
    var axis, dAngle, eye0, eye0len, eye0norm, eye1, look, result, rotMat, tangent0, tangent0norm, tangent1, tangentError, up0, up0norm, up1;
    if (dAngles[0] === 0.0 && dAngles[1] === 0.0) {
      return {
        eye: lookAt.eye,
        up: lookAt.up
      };
    }
    eye0 = recordToVec3(lookAt.eye);
    up0 = recordToVec3(lookAt.up);
    look = recordToVec3(lookAt.look);
    eye0len = SceneJS_math_lenVec3(eye0);
    eye0norm = [0.0, 0.0, 0.0];
    SceneJS_math_mulVec3Scalar(eye0, 1.0 / eye0len, eye0norm);
    tangent0 = [0.0, 0.0, 0.0];
    SceneJS_math_cross3Vec3(up0, eye0, tangent0);
    tangent0norm = SceneJS_math_normalizeVec3(tangent0);
    up0norm = [0.0, 0.0, 0.0];
    SceneJS_math_cross3Vec3(eye0norm, tangent0norm, up0norm);
    axis = [tangent0norm[0] * -dAngles[1] + up0norm[0] * -dAngles[0], tangent0norm[1] * -dAngles[1] + up0norm[1] * -dAngles[0], tangent0norm[2] * -dAngles[1] + up0norm[2] * -dAngles[0]];
    dAngle = SceneJS_math_lenVec2(dAngles);
    rotMat = SceneJS_math_rotationMat4v(dAngle, axis);
    eye1 = SceneJS_math_transformVector3(rotMat, eye0);
    tangent1 = SceneJS_math_transformVector3(rotMat, tangent0);
    tangentError = [0.0, 0.0, 0.0];
    SceneJS_math_mulVec3(tangent1, orbitUp, tangentError);
    SceneJS_math_subVec3(tangent1, tangentError);
    up1 = [0.0, 0.0, 0.0];
    SceneJS_math_cross3Vec3(eye1, tangent1, up1);
    return result = {
      eye: vec3ToRecord(eye1),
      look: lookAt.look,
      up: vec3ToRecord(up1)
    };
  };
  orbitLookAtNode = function(node, dAngles, orbitUp) {
    return node.set(orbitLookAt(dAngles, orbitUp, {
      eye: node.get('eye'),
      look: node.get('look'),
      up: node.get('up')
    }));
  };
  zoomLookAt = function(distance, limits, lookAt) {
    var eye0, eye0len, eye1, eye1len, look, result;
    eye0 = recordToVec3(lookAt.eye);
    look = recordToVec3(lookAt.look);
    eye0len = SceneJS_math_lenVec3(eye0);
    eye1len = Math.clamp(eye0len + distance, limits[0], limits[1]);
    eye1 = [0.0, 0.0, 0.0];
    SceneJS_math_mulVec3Scalar(eye0, eye1len / eye0len, eye1);
    return result = {
      eye: vec3ToRecord(eye1),
      look: lookAt.look,
      up: lookAt.up
    };
  };
  zoomLookAtNode = function(node, distance, limits) {
    return node.set(zoomLookAt(distance, limits, {
      eye: node.get('eye'),
      look: node.get('look'),
      up: node.get('up')
    }));
  };
  SceneJS.FX = {};
  SceneJS.FX.idle = function() {
    return null;
  };
  constants = {
    camera: {
      maxOrbitSpeed: Math.PI * 0.1,
      orbitSpeedFactor: 0.01,
      zoomSpeedFactor: 0.05
    }
  };
  Math.clamp = function(s, min, max) {
    return Math.min(Math.max(s, min), max);
  };
  state = {
    scene: SceneJS.scene('Scene'),
    canvas: document.getElementById('scenejsCanvas'),
    viewport: {
      domElement: document.getElementById('viewport'),
      selectedIfcObject: null,
      mouse: {
        last: [0, 0],
        leftDragging: false,
        middleDragging: false
      }
    },
    camera: {
      distanceLimits: [0.0, 0.0]
    },
    snapshots: []
  };
  sceneInit = function() {
    var sceneDiameter;
    modifySubAttr(state.scene.findNode('main-camera'), 'optics', 'aspect', state.canvas.width / state.canvas.height);
    sceneDiameter = SceneJS_math_lenVec3(state.scene.data().bounds);
    return state.camera.distanceLimits = [sceneDiameter * 0.1, sceneDiameter * 2.0];
  };
  controlsInit = function() {
    var ifcType, layersHtml, sceneData;
    sceneData = state.scene.data();
    layersHtml = (function() {
      var _i, _len, _ref, _results;
      _ref = sceneData.ifcTypes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ifcType = _ref[_i];
        _results.push("<div><input id='layer-" + ifcType.toLowerCase() + "' type='checkbox'> " + ifcType + "</div>");
      }
      return _results;
    })();
    ($('#layers')).html(layersHtml.join(''));
    ($('#controls-accordion')).accordion({
      header: 'h3'
    });
    return ($('#main-view-controls')).removeAttr('style');
  };
  sceneInit();
  state.scene.start({
    idleFunc: SceneJS.FX.idle
  });
  $(function() {
    return controlsInit();
  });
  mouseDown = function(event) {
    state.viewport.mouse.last = [event.clientX, event.clientY];
    switch (event.which) {
      case 1:
        return state.viewport.mouse.leftDragging = true;
      case 2:
        return state.viewport.mouse.middleDragging = true;
    }
  };
  mouseUp = function(event) {
    state.viewport.mouse.leftDragging = false;
    return state.viewport.mouse.middleDragging = false;
  };
  mouseMove = function(event) {
    var delta, deltaLength, orbitAngles;
    if (state.viewport.mouse.middleDragging) {
      delta = [event.clientX - state.viewport.mouse.last[0], event.clientY - state.viewport.mouse.last[1]];
      deltaLength = SceneJS_math_lenVec2(delta);
      orbitAngles = [0.0, 0.0];
      SceneJS_math_mulVec2Scalar(delta, constants.camera.orbitSpeedFactor / deltaLength, orbitAngles);
      orbitAngles = [Math.clamp(orbitAngles[0], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed), Math.clamp(orbitAngles[1], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed)];
      orbitLookAtNode(state.scene.findNode('main-lookAt'), orbitAngles, [0.0, 0.0, 1.0]);
    }
    return state.viewport.mouse.last = [event.clientX, event.clientY];
  };
  mouseWheel = function(event) {
    var zoomDistance;
    zoomDistance = event.wheelDelta / -120.0 * state.camera.distanceLimits[1] * constants.camera.zoomSpeedFactor;
    return zoomLookAtNode(state.scene.findNode('main-lookAt'), zoomDistance, state.camera.distanceLimits);
  };
  topmenuHelp = function(event) {
    ($(event.target)).toggleClass('top-menu-activated');
    ($('#main-view-help')).toggle();
    return ($('#main-view-keys')).toggle();
  };
  controlsToggleLayer = function(event) {
    return state.scene.set('tagMask', '(' + (event.target.id.split(/^layer\-/))[1] + ')');
  };
  snapshotsPush = function() {
    var imgURI, node, snapshotElement;
    node = state.scene.findNode('main-lookAt');
    imgURI = canvasCaptureThumbnail(state.canvas, 512 * 1.25, 512, 125, 100);
    state.snapshots.push({
      eye: node.get('eye'),
      look: node.get('look'),
      up: node.get('up')
    });
    snapshotElement = ($('#snapshots')).append("<div class='snapshot'><div class='snapshot-thumb'><a href='#' class='snapshot-delete'>x</a><img width='125px' height='100px'></div><div class='snapshot-swap'><a href='#'>&lt;</a><a href='#'>&gt;</a></div></div>");
    return (($(snapshotElement)).find('img')).attr('src', imgURI);
  };
  snapshotsDelete = function(event) {
    var parent;
    parent = ($(event.target)).parent();
    state.snapshots.slice(parent.index() + 1);
    return parent.remove();
  };
  snapshotsToggle = function(event) {};
  registerDOMEvents = function() {
    state.viewport.domElement.addEventListener('mousedown', mouseDown, true);
    state.viewport.domElement.addEventListener('mouseup', mouseUp, true);
    state.viewport.domElement.addEventListener('mousemove', mouseMove, true);
    state.viewport.domElement.addEventListener('mousewheel', mouseWheel, true);
    return state.viewport.domElement.addEventListener('DOMMouseScroll', mouseWheel, true);
  };
  registerDOMEvents();
  ($('#layer-walls')).change(controlsToggleLayer);
  ($('#layer-doors')).change(controlsToggleLayer);
  ($('#layer-windows')).change(controlsToggleLayer);
  ($('#layer-columns')).change(controlsToggleLayer);
  ($('#layer-roofs')).change(controlsToggleLayer);
  ($('#layer-floors')).change(controlsToggleLayer);
  ($('#snapshot-placeholder')).click(snapshotsPush);
  ($('#snapshots')).delegate('.snapshot', 'click', snapshotsToggle);
  ($('#snapshots')).delegate('.snapshot-delete', 'click', snapshotsDelete);
  ($('#top-menu-help')).click(topmenuHelp);
}).call(this);
