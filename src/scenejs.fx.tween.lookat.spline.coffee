# Tween effect along a spline path

# TODO: Implement the spline, for now we're just doing linear interpolation

SceneJS.FX.TweenSpline = do () ->
  class TweenSpline
    constructor: (lookAtNode) ->
      @_target = lookAtNode
      @_sequence = []

    @_t: 0.0 
    
    tick: (dt) ->
      @_t += dt

    start: (lookAt) ->
      @_sequence.push lookAt

    sequence: (lookAts, dt) ->
      for lookAt in lookAts
        @_sequence.push lookAt 
        @_timeline.push (@_timeline[0] ? 0.0) + dt
      null
  
  return (lookAtNode) ->
    new TweenSpline lookAtNode

