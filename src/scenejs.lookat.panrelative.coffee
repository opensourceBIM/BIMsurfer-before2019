# Pan camera relative to screen space for manipulating the SceneJS lookat node
lookAtPanRelative = (dPosition, lookAt) ->  
  if dPosition[0] == 0.0 and dPosition[1] == 0.0
    return { eye: lookAt.eye, look: lookAt.look, up: lookAt.up }

  eye = recordToVec3 lookAt.eye
  look = recordToVec3 lookAt.look
  up = recordToVec3 lookAt.up

  # Calculate the view axes
  axes = [[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]]
  axesNorm = [[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]]
  SceneJS_math_subVec3 eye, look, axes[2]
  SceneJS_math_cross3Vec3 up, axes[2], axes[0]
  SceneJS_math_normalizeVec3 axes[0]
  SceneJS_math_cross3Vec3 axes[2], axes[0], axes[1]
  SceneJS_math_normalizeVec3 axes[1]

  # Project dPosition from screen space into world space
  SceneJS_math_mulVec3Scalar axes[0], dPosition[0]
  SceneJS_math_mulVec3Scalar axes[1], dPosition[1]
  dPositionProj = [0.0,0.0,0.0]
  SceneJS_math_addVec3 axes[0], axes[1], dPositionProj  
  result =
    eye: vec3ToRecord SceneJS_math_addVec3 eye, dPositionProj
    look: vec3ToRecord SceneJS_math_addVec3 look, dPositionProj
    up: lookAt.up

lookAtNodePanRelative = (node, dPosition) ->
  node.set lookAtPanRelative dPosition,
    eye: node.get 'eye'
    look: node.get 'look'
    up: node.get 'up'

