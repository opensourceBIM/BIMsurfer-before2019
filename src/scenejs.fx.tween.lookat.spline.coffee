# Tween effect along a spline path

# USAGE:
#   SceneJS.FX.TweenSpline node [, interval]

# TODO: Implement the spline, for now we're just doing linear interpolation

SceneJS.FX.TweenSpline = do () ->
  class TweenSpline
    constructor: (lookAtNode) ->
      @_target = lookAtNode
      @_sequence = []
      @_timeline = []
      if window.Ticker? 
        Ticker.addListener(Tween);
    
    _t: 0.0 
    
    tick: (dt) ->
      @_t += dt
    
    start: (lookAt) ->
      @_sequence = [lookAt]
      @_timeline = [0.0]
      @_t = 0.0

    push: (lookAt, dt) ->
      if @_sequence == []
        @_t = 0.0
      @_sequence.push lookAt
      @_timeline.push @totalTime() + dt
    
    sequence: (lookAts, dt) ->
      if @_sequence == []
        @_t = 0.0
      for lookAt in lookAts
        @_sequence.push lookAt 
        @_timeline.push (@_timeline[0] ? 0.0) + dt
      null
    
    totalTime: () -> 
      # CoffeeScript bug:
      # return @_timeline[@_timeline.length] if @_timeline.length > 0 else 0
      if @_timeline.length > 0
        return @_timeline[@_timeline.length] 
      else
        return 0
  
  _tweens = []
  _intervalID = null
  _dt = 0
  
  _tick = () ->
    for tween in _tweens
      tween.tick _dt
    null
  
  _r = (lookAtNode, interval) ->
    _dt = interval || 50                       # The default interval is 50 ms equivalent to 20 FPS
    _intervalID = setInterval _tick, _dt
    return _tweens.push (new TweenSpline lookAtNode)
  
  _r.update = () ->
    for tween in _tweens
      console.log tween
      if tween._t < tween.totalTime()
        console.log tween
  
  return _r
