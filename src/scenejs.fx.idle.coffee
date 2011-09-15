# The idle function for running SceneJS fx

SceneJS.FX.idle = () -> 
  # TODO: Run the fx loop
  SceneJS.FX.TweenSpline.update()
  return null
