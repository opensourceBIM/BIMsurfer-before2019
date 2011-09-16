# Additional routines for modifying/manipulating scenejs node attributes

lerpLookAt = (t, lookAt0, lookAt1) ->
  # Do spherical linear interpolation to calculate the up vector
  q0 = lookAtToQuaternion lookAt0
  q1 = lookAtToQuaternion lookAt1
  q = SceneJS_math_slerp t, q0, q1

  result = 
    eye: SceneJS_math_lerpVec3 t, 0.0, 1.0, lookAt0.eye, lookAt1.eye
    look: SceneJS_math_lerpVec3 t, 0.0, 1.0, lookAt0.look, lookAt1.look
    up: vec3ToRecord SceneJS_math_newUpVec3FromQuaternion q

lerpLookAtNode = (node, t, lookAt0, lookAt1) ->
  node.set (lerpLookAt t, lookAt0, lookAt1)

