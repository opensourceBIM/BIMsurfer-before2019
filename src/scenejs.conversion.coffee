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
  look = SceneJS_math_subVec3 lookAt.target lookAt.eye
  axis = SceneJS_math_normalizeVec3 (SceneJS_math_cross3Vec3 look lookAt.up)
  SceneJS_math_normalizeVec3 look look
  up = SceneJS_math_cross3Vec3 axis look
  # Convert to quaternion
  return SceneJS_math_newQuaternionFromMat3 (axis.concat up, look)

