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

  # Reconfigure the camera
  if state.scene?
    cameraNode = (state.scene.findNode 'main-camera')
    cameraOptics = cameraNode.get 'optics'
    cameraOptics.aspect = state.canvas.width / state.canvas.height
    cameraNode.set 'optics', cameraOptics
