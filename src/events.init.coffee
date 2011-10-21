# Eventful code comes here
# Program state should not be manipulated outside events files

canvasInit = () ->
  windowResize()

sceneInit = () ->
  # Set the correct aspect ratio
  modifySubAttr (state.scene.findNode 'main-camera'), 'optics', 'aspect', state.canvas.width / state.canvas.height
  # Calculate camera attributes
  sceneDiameter = SceneJS_math_lenVec3 state.scene.data().bounds
  state.camera.distanceLimits = [sceneDiameter * 0.1, sceneDiameter * 2.0]
  # Initialize the tag mask (for layers / hidden objects)
  tags = (tag.toLowerCase() for tag in state.scene.data().ifcTypes)
  state.scene.set 'tagMask', '^(' + (tags.join '|') + ')$'
  # Add useful nodes to the library
  #highlightNode = 

controlsInit = () ->
  sceneData = state.scene.data()

  # Populate the layers tab
  layersHtml = ("<div><input id='layer-" + ifcType.toLowerCase() + "' type='checkbox' checked='checked'> " + ifcType + "</div>" for ifcType in sceneData.ifcTypes)
  ($ '#controls-layers').html layersHtml.join ''

  # Clear the properties tab
  controlsPropertiesSelectObject()

  # Initialize the accordion control
  ($ '#controls-accordion').accordion { header: 'h3' }

  # Make controls visible
  ($ '#main-view-controls').removeAttr 'style'

ifcTreeInit = () ->
  # Initialize the IFC tree control
  sceneData = state.scene.data()
  
  ifcObjectDescription = (obj, indent) ->
    "<li class='controls-tree-rel' id='" + obj.id + "'><div class='controls-tree-item'><span class='indent-" + String(indent) + "'/>" + 
      "<input type='checkbox' checked='checked'> " +
      obj.name + "<span class='controls-tree-postfix'>(" + obj.type + ")</span></div>" +
      (ifcDefinedBy obj.decomposedBy, indent) +
      (ifcDefinedBy obj.definedBy, indent) +
      (ifcContains obj.contains, indent) +
      "</li>"
  
  ifcProject = (obj) ->
    "<li class='controls-tree-root' id='" + obj.id + "'><div class='controls-tree-item'>" + obj.name + "<span class='controls-tree-postfix'>(" + obj.type + ")</span></div>" +
      (ifcDefinedBy obj.decomposedBy, 0) +
      (ifcDefinedBy obj.definedBy, 0) +
      (ifcContains obj.contains, 0) +
      "</li>"

  ifcRelationships = (type, rel, indent) ->
    if rel? and rel.length > 0
      indent = Math.min(indent + 1, 6)
      html = "<ul class='controls-tree'>"
      html += "<div class='controls-tree-heading'><hr><h4>" + type + "</h4></div>"
      for obj in rel
        html += ifcObjectDescription obj, indent
      html += "</ul>"
    else
      ""
  
  ifcDecomposedBy = (rel, indent) -> ifcRelationships 'Decomposed By', rel, indent
  ifcDefinedBy = (rel, indent) -> ifcRelationships 'Defined By', rel, indent
  ifcContains = (rel, indent) -> ifcRelationships 'Contains', rel, indent
    
  treeHtml = "<ul class='controls-tree'>"
  for project in sceneData.relationships
    treeHtml += ifcProject project
  treeHtml += "</ul>"
  ($ '#controls-relationships').html treeHtml

# Start rendering as soon as possible
canvasInit()
if state.scene?
  sceneInit()
  state.scene.start
    idleFunc: SceneJS.FX.idle

# Initialize the gui controls and register events once the rest of the document has completely loaded
$ () -> 
  if state.scene?
    controlsInit()
    ifcTreeInit()
  else
    helpStatus "Please load a project from the <strong>File</strong> menu in the top left-hand corner."
  registerDOMEvents()
  registerControlEvents()
  state.application.initialized = true

