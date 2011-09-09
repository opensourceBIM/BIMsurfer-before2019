# The program state
# No global state is allowed to exist outside of this structure

state =
  scene: SceneJS.scene 'Scene'
  canvas: document.getElementById 'scenejsCanvas'
  viewport: 
    domElement: document.getElementById 'viewport'
    selectedIfcObject: null
    mouse:
      last: [0, 0]
      leftDragging: false
      middleDragging: false
  camera:
    distanceLimits: [0.0, 0.0]    # Min / Max limits
  snapshots: []
