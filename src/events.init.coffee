# Eventful code comes here
# Program state should not be manipulated outside events files

sceneInit = () ->
  # Set the correct aspect ratio
  modifySubAttr (state.scene.findNode 'main-camera'), 'optics', 'aspect', state.canvas.width / state.canvas.height
  # Calculate camera attributes
  sceneDiameter = SceneJS_math_lenVec3 state.scene.data().bounds
  state.camera.distanceLimits = [sceneDiameter * 0.1, sceneDiameter * 2.0]

controlsInit = () ->
  # Initialize controls
  sceneData = state.scene.data()
  layersHtml = ("<div><input id='layer-" + ifcType.toLowerCase() + "' type='checkbox'> " + ifcType + "</div>" for ifcType in sceneData.ifcTypes)
  ($ '#layers').html layersHtml.join ''
  ($ '#controls-accordion').accordion { header: 'h3' }
  
  # Make controls visible
  ($ '#main-view-controls').removeAttr 'style'

# Start rendering as soon as possible
sceneInit()
state.scene.start()

# Initialize the gui controls once the rest of the document has completely loaded
$ () -> controlsInit()

