# Eventful code comes here
# Program state should not be manipulated outside this file

sceneInit = () ->
  # Set the correct aspect ratio
  modifySubAttr (state.scene.findNode 'main-camera'), 'optics', 'aspect', state.canvas.width / state.canvas.height
  # Calculate camera attributes
  sceneData = state.scene.data()
  sceneDiameter = SceneJS_math_lenVec3 sceneData.bounds
  state.camera.distanceLimits = [sceneDiameter * 0.1, sceneDiameter * 2.0]

# Start rendering as soon as possible
sceneInit()
state.scene.start()

# Mouse events
mouseDown = (event) ->
  state.viewport.mouse.last = [event.clientX, event.clientY]
  switch event.which
    when 1 then state.viewport.mouse.leftDragging = true
    when 2 then state.viewport.mouse.middleDragging = true

mouseUp = (event) ->
  state.viewport.mouse.leftDragging = false
  state.viewport.mouse.middleDragging = false
  #coords = mouseCoordsWithinElement event
  #pickRecord = scene.pick coords[0] coords[1]
  #if pickRecord
  # alert "Picked 'name' node with id '" + pickRecord.nodeId + "' at canvasX=" + pickRecord.canvasX + ", canvasY=" + pickRecord.canvasY
  #else
  # alert "Nothing picked"

mouseMove = (event) ->
  # TODO: Get an accurate time measurement since the last mouseMove event
  if state.viewport.mouse.middleDragging
    # Get the delta position of the mouse over this frame
    delta = [event.clientX - state.viewport.mouse.last[0], event.clientY - state.viewport.mouse.last[1]]
    deltaLength = SceneJS_math_lenVec2 delta

    # Calculate the orbit angle to apply to the lookAt
    orbitAngles = [0.0,0.0]
    SceneJS_math_mulVec2Scalar delta, constants.camera.orbitSpeedFactor / deltaLength, orbitAngles
    orbitAngles = [
      Math.clamp orbitAngles[0], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed
      Math.clamp orbitAngles[1], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed
    ]
    orbitLookAtNode (state.scene.findNode 'main-lookAt'), orbitAngles, [0.0,0.0,1.0]
  state.viewport.mouse.last = [event.clientX, event.clientY]

mouseWheel = (event) ->
  # TODO: When the camera projection mode is ortho then this will need to scale the view
  zoomDistance = event.wheelDelta / -120.0 * state.camera.distanceLimits[1] * constants.camera.zoomSpeedFactor
  zoomLookAtNode (state.scene.findNode 'main-lookAt'), zoomDistance, state.camera.distanceLimits

# Register document events
registerDOMEvents = () ->
  state.viewport.domElement.addEventListener 'mousedown', mouseDown, true
  state.viewport.domElement.addEventListener 'mouseup', mouseUp, true
  state.viewport.domElement.addEventListener 'mousemove', mouseMove, true
  state.viewport.domElement.addEventListener 'mousewheel', mouseWheel, true
  state.viewport.domElement.addEventListener 'DOMMouseScroll', mouseWheel, true
registerDOMEvents()
