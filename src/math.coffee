# Additional math routines not found in standard JavaScript or SceneJS
Math.clamp = (s, min, max) ->
  Math.min(Math.max(s, min), max)
