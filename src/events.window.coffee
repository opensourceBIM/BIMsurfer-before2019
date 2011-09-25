# Eventful code comes here
# Program state should not be manipulated outside events files

windowResize = ->
  state.canvas.width = ($ '#viewport').width()
  state.canvas.height = ($ '#viewport').height()
  # TODO: reconfigure camera

