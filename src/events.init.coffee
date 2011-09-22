# Eventful code comes here
# Program state should not be manipulated outside events files

sceneInit = () ->
  # Set the correct aspect ratio
  modifySubAttr (state.scene.findNode 'main-camera'), 'optics', 'aspect', state.canvas.width / state.canvas.height
  # Calculate camera attributes
  sceneDiameter = SceneJS_math_lenVec3 state.scene.data().bounds
  state.camera.distanceLimits = [sceneDiameter * 0.1, sceneDiameter * 2.0]
  # Add useful nodes to the library
  #highlightNode = 

controlsInit = () ->
  # Initialize controls
  sceneData = state.scene.data()
  layersHtml = ("<div><input id='layer-" + ifcType.toLowerCase() + "' type='checkbox'> " + ifcType + "</div>" for ifcType in sceneData.ifcTypes)
  ($ '#layers').html layersHtml.join ''
  ($ '#controls-accordion').accordion { header: 'h3' }
  
  # Make controls visible
  ($ '#main-view-controls').removeAttr 'style'

ifcTreeInit = () ->
  # Initialize the IFC tree control
  sceneData = state.scene.data()
  
  ifcObjectDescription = (obj) ->
    "<li class='controls-tree-rel' id='" + obj.name + "'><a>" + obj.name + "<span class='controls-tree-postfix'>(" + obj.type + ")</span></a>" + (ifcRelationships obj.rel) + "</li>"
  
  ifcRelationships = (rel) ->
    if rel? and rel.length > 0
      html = "<ul class='controls-tree'>"
      for obj in rel
        html += ifcObjectDescription obj
      html += "</ul>"
    else
      ""
  
  ifcProject = (obj) ->
    "<li class='controls-tree-root' id='" + obj.name + "'><a>" + obj.name + "<span class='controls-tree-postfix'>(" + obj.type + ")</span></a>" + (ifcRelationships obj.rel) + "</li>"

  treeHtml = ""
  for project in sceneData.composition
    treeHtml += ifcProject project
  ($ '#controls-decomposition').html treeHtml

# Start rendering as soon as possible
sceneInit()
state.scene.start
  idleFunc: SceneJS.FX.idle

# Initialize the gui controls and register events once the rest of the document has completely loaded
$ () -> 
  controlsInit()
  registerDOMEvents()
  registerControlEvents()
  ifcTreeInit()
