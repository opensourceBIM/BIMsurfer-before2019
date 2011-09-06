# Orbit camera model for manipulating the SceneJS lookat node
zoomLookAt = (distance, limits, lookAt) ->
  # TODO: Include the 'look' target in the calculation
  eye0 = recordToVec3 lookAt.eye
  look = recordToVec3 lookAt.look
  
  eye0len = SceneJS_math_lenVec3 eye0
  eye1len = Math.clamp eye0len + distance, limits[0], limits[1]
  eye1 = [0.0,0.0,0.0]
  SceneJS_math_mulVec3Scalar eye0, eye1len / eye0len, eye1

  result =
    eye: vec3ToRecord eye1
    look: lookAt.look
    up: lookAt.up

zoomLookAtNode = (node, distance, limits) ->
  node.set zoomLookAt distance, limits, {
    eye: node.get 'eye'
    look: node.get 'look'
    up: node.get 'up'
  }

