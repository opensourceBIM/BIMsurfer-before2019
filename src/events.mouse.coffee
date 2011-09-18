# Eventful code comes here
# Program state should not be manipulated outside events files

mouseDown = (event) ->
  state.viewport.mouse.last = [event.clientX, event.clientY]
  switch event.which
    when 1 then state.viewport.mouse.leftDragging = true
    when 2 then state.viewport.mouse.middleDragging = true

mouseUp = (event) ->
  state.viewport.mouse.leftDragging = false
  state.viewport.mouse.middleDragging = false
  if event.which == 1 # Left mouse button
    coords = mouseCoordsWithinElement event
    pickRecord = state.scene.pick coords[0], coords[1]
    console.log coords
    # Delete the old highlight material
    oldHighlight = state.scene.findNode constants.highlightMaterial.id
    oldHighlight.splice() if oldHighlight?
    # Apply the highlight material to the node
    if pickRecord
      console.log "Picked 'name' node with id '" + pickRecord.nodeId + "' at canvasX=" + pickRecord.canvasX + ", canvasY=" + pickRecord.canvasY
      (state.scene.findNode pickRecord.nodeId).insert 'node', constants.highlightMaterial
    #else
    #  console.log "Nothing picked"

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

