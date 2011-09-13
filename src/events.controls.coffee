# Eventful code comes here
# Program state should not be manipulated outside events files

controlsToggleLayer = (event) ->
  elements = ($ '#layers input:checked').toArray()
  tags = (((($ el).attr 'id').split /^layer\-/)[1] for el in elements)
  state.scene.set 'tagMask', '(' + (tags.join '|') + ')'
