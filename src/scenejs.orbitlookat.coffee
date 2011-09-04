# Orbit camera model for manipulating the SceneJS lookat node
orbitLookAt = (dAngles, orbitUp, lookAt) ->
  # TODO: Include the 'look' target in the calculation
  # NOTE: This would probably be more elegant with quaternions, but the scenejs camera is already in a matrix-like format

  if dAngles[0] == 0.0 and dAngles[1] == 0.0
    return { eye: lookAt.eye, up: lookAt.up }

  eye0 = recordToVec3 lookAt.eye
  up0 = recordToVec3 lookAt.up
  look = recordToVec3 lookAt.look

  # Create an axis-angle rotation transformation
  eyeLen = SceneJS_math_lenVec3 eye0
  eye0norm = [0.0,0.0,0.0]
  SceneJS_math_mulVec3Scalar eye0, 1.0 / eyeLen, eye0norm

  tangent0 = [0.0,0.0,0.0]
  SceneJS_math_cross3Vec3 up0, eye0, tangent0
  tangent0norm = SceneJS_math_normalizeVec3 tangent0

  up0norm = [0.0,0.0,0.0]
  SceneJS_math_cross3Vec3 eye0norm, tangent0norm, up0norm

  # (Transform axis out of the local space of the lookat)
  axis = [
    tangent0norm[0] * -dAngles[1] + up0norm[0] * -dAngles[0]
    tangent0norm[1] * -dAngles[1] + up0norm[1] * -dAngles[0]
    tangent0norm[2] * -dAngles[1] + up0norm[2] * -dAngles[0]
  ]
  dAngle = SceneJS_math_lenVec2 dAngles
  rotMat = SceneJS_math_rotationMat4v dAngle, axis

  # Transform the eye vector of the lookat
  eye1 = SceneJS_math_transformVector3 rotMat, eye0

  # Transform the tangent vector of the lookat and then correct for drift
  # (Drift is the deviation of the tangent vector from the plane that forms an orthogonal complement to the orbitUp vector)
  tangent1 = SceneJS_math_transformVector3 rotMat, tangent0
  tangentError = [0.0,0.0,0.0]
  SceneJS_math_mulVec3 tangent1, orbitUp, tangentError
  SceneJS_math_subVec3 tangent1, tangentError

  # Transform the up vector using the corrected tangent
  up1 = [0.0,0.0,0.0]
  SceneJS_math_cross3Vec3 eye1, tangent1, up1
  
  result =
    eye: vec3ToRecord eye1
    up: vec3ToRecord up1

orbitLookAtNode = (node, dAngles, orbitUp) ->
  node.set orbitLookAt dAngles, orbitUp, {
    eye: node.get 'eye'
    look: node.get 'look'
    up: node.get 'up'
  }

