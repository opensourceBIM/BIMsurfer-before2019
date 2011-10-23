# Eventful code comes here
# Program state should not be manipulated outside events files

mouseDown = (event) ->
  if not state.scene?  
    return
  
  state.viewport.mouse.last = [event.clientX, event.clientY]
  
  # Activate the appropriate mouse button mode
  switch event.which
    when 1 then state.viewport.mouse.leftDown = true
    when 2 then state.viewport.mouse.middleDown = true

  # Pick the object under the mouse
  if event.which == 1 # Left mouse button
    coords = mouseCoordsWithinElement event
    state.viewport.mouse.pickRecord = state.scene.pick coords[0], coords[1]

mouseUp = (event) ->
  if not state.scene?  
    return
  
  # If the mouse was not dragged, select the object that was picked
  if event.which == 1 and state.viewport.mouse.leftDragDistance < constants.mouse.pickDragThreshold
    if state.viewport.mouse.pickRecord?
      controlsTreeSelectObject state.viewport.mouse.pickRecord.nodeId
    else
      controlsTreeSelectObject()
    state.viewport.mouse.pickRecord = null

  # De-activate the appropriate mouse button and dragging modes
  switch event.which
    when 1 
      state.viewport.mouse.leftDown = false
      state.viewport.mouse.leftDragDistance = 0
    when 2
      state.viewport.mouse.middleDown = false
      state.viewport.mouse.middleDragDistance = 0

mouseMove = (event) ->
  # TODO: Get an accurate time measurement since the last mouseMove event
  # Get the delta position of the mouse over this frame
  delta = [event.clientX - state.viewport.mouse.last[0], event.clientY - state.viewport.mouse.last[1]]
  deltaLength = SceneJS_math_lenVec2 delta

  # Activate the appropriate mouse dragging mode
  state.viewport.mouse.leftDragDistance += deltaLength if state.viewport.mouse.leftDown
  state.viewport.mouse.middleDragDistance += deltaLength if state.viewport.mouse.middleDown
  
  # Manipulate the camera when dragging
  # See http://stackoverflow.com/questions/4065992/jquery-detecting-pressed-mouse-button-during-mousemove-event 
  if state.viewport.mouse.leftDown and event.which == 1
    # Calculate the orbit angle to apply to the lookAt
    orbitAngles = [0.0,0.0]
    SceneJS_math_mulVec2Scalar delta, constants.camera.orbitSpeedFactor / deltaLength, orbitAngles
    orbitAngles = [
      Math.clamp orbitAngles[0], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed
      Math.clamp orbitAngles[1], -constants.camera.maxOrbitSpeed, constants.camera.maxOrbitSpeed
    ]
    orbitLookAtNode (state.scene.findNode 'main-lookAt'), orbitAngles, [0.0,0.0,1.0]
  else if state.viewport.mouse.middleDown and event.which == 2
    # Pan the camera
    panVector = [0.0,0.0]
    SceneJS_math_mulVec2Scalar [-delta[0],delta[1]], constants.camera.panSpeedFactor / deltaLength, panVector
    lookAtNodePanRelative (state.scene.findNode 'main-lookAt'), panVector
  
  state.viewport.mouse.last = [event.clientX, event.clientY]

mouseWheel = (event) ->
  if not state.scene?  
    return

  # TODO: When the camera projection mode is ortho then this will need to scale the view
  # See http://www.javascriptkit.com/javatutors/onmousewheel.shtml
  # But also note, unfortunately firefox actually appears to give different values of event.detail some times.
  # It is likely that this is due to a user having changed his scroll speed settings, thus we'll clamp the value to 1 or -1
  delta = if event.wheelDelta? then event.wheelDelta / -120.0 else Math.clamp event.detail, -1.0, 1.0
  zoomDistance = delta * state.camera.distanceLimits[1] * constants.camera.zoomSpeedFactor
  zoomLookAtNode (state.scene.findNode 'main-lookAt'), zoomDistance, state.camera.distanceLimits

