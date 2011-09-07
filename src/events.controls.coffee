# Eventful code comes here
# Program state should not be manipulated outside events files

controlsToggleLayer = (event) ->
  state.scene.set 'tagMask', '(' + (event.target.id.split /^layer\-/)[1] + ')'
