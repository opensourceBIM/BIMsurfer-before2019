# Eventful code comes here
# Program state should not be manipulated outside events files

mainmenuViewsReset = (event) ->
  if state.scene?
    lookAtNode = state.scene.findNode 'main-lookAt'
    lookAtNode.set 'eye', state.lookAt.defaultParameters.eye
    lookAtNode.set 'look', state.lookAt.defaultParameters.look
    lookAtNode.set 'up', state.lookAt.defaultParameters.up
