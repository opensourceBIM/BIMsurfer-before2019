# Conversion of various scenejs types / structures

recordToVec3 = (record) ->
  return [record.x, record.y, record.z]

recordToVec4 = (record) ->
  return [record.x, record.y, record.z, record.w]

vec3ToRecord = (vec) ->
  return { x: vec[0], y: vec[1], z: vec[2] }

vec4ToRecord = (vec) ->
  return { x: vec[0], y: vec[1], z: vec[2], w: vec[3] }
