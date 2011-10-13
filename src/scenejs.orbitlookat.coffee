# Orbit camera model for manipulating the SceneJS lookat node
orbitLookAt = (dAngles, orbitUp, lookAt) ->
  # TODO: Include the 'look' target in the calculation
  # NOTE: This would probably be more elegant with quaternions, but the scenejs camera is already in a matrix-like format

  if dAngles[0] == 0.0 and dAngles[1] == 0.0
    return { eye: lookAt.eye, look: lookAt.look, up: lookAt.up }

  eye0 = recordToVec3 lookAt.eye
  up0 = recordToVec3 lookAt.up
  look = recordToVec3 lookAt.look

  # Calculate the view axes
  axes = [[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]]
  axesNorm = [[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]]
  SceneJS_math_subVec3 eye0, look, axes[2]
  SceneJS_math_cross3Vec3 up0, axes[2], axes[0]
  SceneJS_math_normalizeVec3 axes[0], axesNorm[0]
  SceneJS_math_normalizeVec3 axes[2], axesNorm[2]
  SceneJS_math_cross3Vec3 axesNorm[2], axesNorm[0], axesNorm[1]
  #[axes[1][0], axes[1][1], axes[1][2]] = [axesNorm[1][0],axesNorm[1][1],axesNorm[1][2]] (not needed)

  # Transform rotation axis from view space to world space
  rotAxis = [
    axesNorm[0][0] * -dAngles[1] + axesNorm[1][0] * -dAngles[0]
    axesNorm[0][1] * -dAngles[1] + axesNorm[1][1] * -dAngles[0]
    axesNorm[0][2] * -dAngles[1] + axesNorm[1][2] * -dAngles[0]
  ]
  dAngle = SceneJS_math_lenVec2 dAngles
  rotMat = SceneJS_math_rotationMat4v dAngle, rotAxis

  # Transform the axes of the view (but without normalizing the Z-axis)
  transformedX = SceneJS_math_transformVector3 rotMat, axesNorm[0]
  transformedZ = SceneJS_math_transformVector3 rotMat, axes[2]

  # Calculate lookat parameters (eye, up)
  eye1 = [0.0,0.0,0.0]
  SceneJS_math_addVec3 look, transformedZ, eye1

  # Transform the tangent vector of the lookat and then correct for drift
  # (Drift is the deviation of the tangent vector from the plane that forms an orthogonal complement to the orbitUp vector)
  tangent1 = transformedX
  tangentError = [0.0,0.0,0.0]
  SceneJS_math_mulVec3 tangent1, orbitUp, tangentError
  SceneJS_math_subVec3 tangent1, tangentError

  # Calculate the up vector using the corrected tangent
  up1 = [0.0,0.0,0.0]
  SceneJS_math_cross3Vec3 transformedZ, tangent1, up1
  
  result =
    eye: vec3ToRecord eye1
    look: lookAt.look
    up: vec3ToRecord up1

orbitLookAtNode = (node, dAngles, orbitUp) ->
  node.set orbitLookAt dAngles, orbitUp,
    eye: node.get 'eye'
    look: node.get 'look'
    up: node.get 'up'

