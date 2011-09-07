# Eventful code comes here
# Program state should not be manipulated outside events files

sceneInit = () ->
  # Set the correct aspect ratio
  modifySubAttr (state.scene.findNode 'main-camera'), 'optics', 'aspect', state.canvas.width / state.canvas.height
  # Calculate camera attributes
  sceneData = state.scene.data()
  sceneDiameter = SceneJS_math_lenVec3 sceneData.bounds
  state.camera.distanceLimits = [sceneDiameter * 0.1, sceneDiameter * 2.0]

# Start rendering as soon as possible
sceneInit()
state.scene.start()

