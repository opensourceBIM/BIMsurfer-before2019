# Eventful code comes here
# Program state should not be manipulated outside events files

windowResize = ->
  switch state.settings.performance
    when 'performance'
      state.canvas.width = constants.canvas.defaultSize[0]
      state.canvas.height = constants.canvas.defaultSize[1]
    when 'quality'
      state.canvas.width = ($ '#viewport').width()
      state.canvas.height = ($ '#viewport').height()
  # TODO: reconfigure camera (don't force render when camera is updated)
  if state.application.initialized
    state.scene.renderFrame { force: true }
  #topOffset

