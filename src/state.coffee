# The program state
# No global state is allowed to exist outside of this structure

state =
  scene: SceneJS.scene 'Scene'
  viewport:
    selectedElement: null
    mouse:
      lastX: 0
      lastY: 0
      leftDragging: false
      middleDragging: false

