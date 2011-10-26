# The program state
# No global state is allowed to exist outside of this structure

state =
  scene: do () -> 
    try 
      return SceneJS.scene 'Scene' 
    catch error
      return null
  canvas: document.getElementById 'scenejsCanvas'
  settings:
    performance: 'quality'
    mode: 'basic'
  viewport: 
    domElement: document.getElementById 'viewport'
    selectedIfcObject: null
    mouse:
      last: [0, 0]
      leftDown: false
      middleDown: false
      leftDragDistance: 0
      middleDragDistance: 0
      pickRecord: null
  camera:
    distanceLimits: [0.0, 0.0]    # Min / Max limits
  lookAt:
    defaultParameters: 
      look: { x: 0.0, y: 0.0, z: 0.0 }
      eye: { x: 10.0, y: 10.0, z: 10.0 }
      up: { x: 0.0, y: 0.0, z: 1.0 }
  snapshots: 
    lookAts: []
  application:
    initialized: false
