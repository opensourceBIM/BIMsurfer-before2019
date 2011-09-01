# Eventful code comes here
# Program state should not be manipulated outside this file

mouseDown = (event) ->
  state.mouse.lastX = event.clientX
  state.mouse.lastY = event.clientY
  switch event.which
    when 1 then state.mouse.leftDragging = true
    when 3 then state.mouse.middleDragging = true

mouseUp = ->
  state.mouse.leftDragging = false
  state.mouse.middleDragging = false

