# Additional routines for modifying/manipulating scenejs node attributes

lerpLookAt = (t, lookAt0, lookAt1) ->
  # Do spherical linear interpolation to calculate the up vector
  eye0 = recordToVec3 lookAt0.eye
  look0 = recordToVec3 lookAt0.look
  up0  = recordToVec3 lookAt0.up
  x0 = [0.0, 0.0, 0.0]
  y0 = [0.0, 0.0, 0.0] 
  z0 = [0.0, 0.0, 0.0]
  SceneJS_math_subVec3 look0, eye0, z0
  SceneJS_math_cross3Vec3 up0, z0, x0
  SceneJS_math_cross3Vec3 z0, x0, y0
  SceneJS_math_normalizeVec3 x0
  SceneJS_math_normalizeVec3 y0
  SceneJS_math_normalizeVec3 z0
 
  eye1 = recordToVec3 lookAt1.eye
  look1 = recordToVec3 lookAt1.look
  up1  = recordToVec3 lookAt1.up
  x1 = [0.0, 0.0, 0.0]
  y1 = [0.0, 0.0, 0.0] 
  z1 = [0.0, 0.0, 0.0]
  SceneJS_math_subVec3 look1, eye1, z1
  SceneJS_math_cross3Vec3 up1, z1, x1
  SceneJS_math_cross3Vec3 z1, x1, y1
  SceneJS_math_normalizeVec3 x1
  SceneJS_math_normalizeVec3 y1
  SceneJS_math_normalizeVec3 z1

  mat0 = [].concat x0, y0, z0
  mat1 = [].concat x1, y1, z1
  q0 = SceneJS_math_newQuaternionFromMat3 mat0
  q1 = SceneJS_math_newQuaternionFromMat3 mat1
  q = SceneJS_math_slerp t, q0, q1

  result = 
    eye: vec3ToRecord SceneJS_math_lerpVec3 t, 0.0, 1.0, eye0, eye1
    look: vec3ToRecord SceneJS_math_lerpVec3 t, 0.0, 1.0, look0, look1
    up: vec3ToRecord SceneJS_math_newUpVec3FromQuaternion q

lerpLookAtNode = (node, t, lookAt0, lookAt1) ->
  node.set (lerpLookAt t, lookAt0, lookAt1)

