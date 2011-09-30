# Eventful code comes here
# Program state should not be manipulated outside events files

controlsPropertiesSelectObject = (id) ->
  properties = state.scene.data().properties
  if !properties
    return ($ '#controls-properties').html "<em>No IFC properties could be found in the scene.</em>"

  objectProperties = properties[id]
  if !objectProperties
    return ($ '#controls-properties').html "<em>No IFC properties could be found for the object with id '" + id + "'.</em>"
  
  html = "<ul class='controls-tree controls-table'>"
  console.log objectProperties
  for key, value of objectProperties
    html += "<li class='controls-table-item'>"
    html += "<label class='controls-table-label'>" + key + "</label>"
    #html += "<div class='controls-table-value'><input disabled='disabled' value='" + value + "'></div>"
    html += "<div class='controls-table-value'>" + value + "</div>"
    html += "</li>"
  html += "</ul>"
  ($ '#controls-properties').html html

controlsToggleTreeOpen = (event) ->
  parentSel = ($ event.target).parent()
  parentSel.toggleClass 'controls-tree-open'
  controlsPropertiesSelectObject parentSel.attr 'id'

controlsToggleTreeSelected = (event) ->
  parentSel = ($ event.target).parent()
  parentSel.toggleClass 'controls-tree-selected'
  controlsPropertiesSelectObject parentSel.attr 'id'

controlsToggleLayer = (event) ->
  elements = ($ '#controls-layers input:checked').toArray()
  tags = (((($ el).attr 'id').split /^layer\-/)[1] for el in elements)
  state.scene.set 'tagMask', '(' + (tags.join '|') + ')'
