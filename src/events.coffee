# Eventful code comes here
# Program state should not be manipulated outside this file

# Start rendering as soon as possible
state.scene.start();

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
  if state.viewport.mouse.middleDragging
    delta = [event.clientX - state.viewport.mouse.last[0], event.clientY - state.viewport.mouse.last[0]]
    lookAtNode = state.scene.findNode("main-lookAt")
    #alert orbitLookAtNode delta, lookAtNode
  state.viewport.mouse.last = [event.clientX, event.clientY]

# Register document events
state.canvas.addEventListener 'mousedown', mouseDown, true
state.canvas.addEventListener 'mouseup', mouseUp, true
state.canvas.addEventListener 'mousemove', mouseMove, true

