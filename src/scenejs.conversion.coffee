# Conversion of various scenejs types / structures

recordToVec3 = (record) ->
  return [record.x, record.y, record.z]

recordToVec4 = (record) ->
  return [record.x, record.y, record.z, record.w]

vec3ToRecord = (vec) ->
  return { x: vec[0], y: vec[1], z: vec[2] }

vec4ToRecord = (vec) ->
  return { x: vec[0], y: vec[1], z: vec[2], w: vec[3] }

lookAtToQuaternion = (lookAt) ->
  # Create an orthonormal basis
  eye = recordToVec3 lookAt.eye
  look = recordToVec3 lookAt.look
  up  = recordToVec3 lookAt.up
  x = [0.0, 0.0, 0.0]
  y = [0.0, 0.0, 0.0] 
  z = [0.0, 0.0, 0.0]
  SceneJS_math_subVec3 look, eye, z
  SceneJS_math_cross3Vec3 up, z, x
  SceneJS_math_cross3Vec3 z, x, y
  SceneJS_math_normalizeVec3 x
  SceneJS_math_normalizeVec3 y
  SceneJS_math_normalizeVec3 z

  # Convert to quaternion
  return SceneJS_math_newQuaternionFromMat3 x.concat y, z

