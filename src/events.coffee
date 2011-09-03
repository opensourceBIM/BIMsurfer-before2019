# Eventful code comes here
# Program state should not be manipulated outside this file

sceneInit = () ->
  (state.scene.findNode 'main-camera').set 
    optics: 
      type: 'perspective', 
      aspect: state.canvas.width / state.canvas.height

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

    lookAtNode = state.scene.findNode 'main-lookAt'
    orbitLookAtNode orbitAngles, lookAtNode
  state.viewport.mouse.last = [event.clientX, event.clientY]

# Register document events
state.viewport.domElement.addEventListener 'mousedown', mouseDown, true
state.viewport.domElement.addEventListener 'mouseup', mouseUp, true
state.viewport.domElement.addEventListener 'mousemove', mouseMove, true

