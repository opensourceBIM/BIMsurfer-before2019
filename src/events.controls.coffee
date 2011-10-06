# Eventful code comes here
# Program state should not be manipulated outside events files

controlsPropertiesSelectObject = (id) ->
  properties = state.scene.data().properties
  if not id?
    return ($ '#controls-properties').html "<p class='controls-message'>Select an object to see its properties.</p>"
  if not properties?
    return ($ '#controls-properties').html "<p class='controls-message'>No properties could be found in the scene.</p>"
  objectProperties = properties[id]

  tableItem = (key, value) -> 
    html = "<li class='controls-table-item'>"
    html += "<label class='controls-table-label'>" + key + "</label>"
    #html += "<div class='controls-table-value'><input disabled='disabled' value='" + value + "'></div>"
    html += "<div class='controls-table-value'>" + value + "</div>"
    html += "</li>"
  
  html = "<ul class='controls-table'>"
  html += tableItem 'Global Id', id
  if objectProperties?
    for key, value of objectProperties
      html += tableItem key, value
  html += "</ul>"

  if not objectProperties
    html += "<p class='controls-message'>No additional properties could be found for the object with id '" + id + "'.</p>"

  # DEBUG: Print debug information
  #scenejsNode = state.scene.findNode id
  #console.log scenejsNode

  ($ '#controls-properties').html html

controlsToggleTreeOpen = (event) ->
  $parent = ($ event.target).parent()
  id = $parent.attr 'id'
  $parent.toggleClass 'controls-tree-open'
  controlsTreeSelectObject id
  controlsPropertiesSelectObject id

controlsTreeSelectObject = (id) ->
  ($ '.controls-tree-selected').removeClass 'controls-tree-selected'
  ($ '.controls-tree-selected-parent').removeClass 'controls-tree-selected-parent'
  # Delete the old highlight material
  oldHighlight = state.scene.findNode constants.highlightMaterial.id
  oldHighlight.splice() if oldHighlight?
  if id?
    parentEl = document.getElementById id
    $treeItem = ($ parentEl).children '.controls-tree-item'
    $treeItem.addClass 'controls-tree-selected'
    ($ '.controls-tree:has(.controls-tree-selected)').addClass 'controls-tree-selected-parent'
    controlsPropertiesSelectObject id
    # Apply the highlight material to the selected node
    (state.scene.findNode id).insert 'node', constants.highlightMaterial

controlsShowProperties = () ->
  ($ '#controls-accordion').accordion 'activate', 1

controlsToggleLayer = (event) ->
  elements = ($ '#controls-layers input:checked').toArray()
  tags = (((($ el).attr 'id').split /^layer\-/)[1] for el in elements)
  state.scene.set 'tagMask', '(' + (tags.join '$|') + '$)'

