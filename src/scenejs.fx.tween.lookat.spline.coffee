# Tween effect along a spline path

# USAGE:
#   SceneJS.FX.TweenSpline node [, interval]

# TODO: Implement the spline, for now we're just doing linear interpolation

SceneJS.FX.TweenSpline = do () ->
  class TweenSpline
    constructor: (lookAtNode, play) ->
      @_target = lookAtNode
      @_sequence = []
      @_timeline = []
      @_play = play ? true
      @_t = 0.0
    
    tick: (dt) ->
      @_t += dt if @_play
    
    start: (lookAt) ->
      @_sequence = [lookAt ? {
        eye: @_target.get 'eye'
        look: @_target.get 'look'
        up: @_target.get 'up' }]
      @_timeline = [0.0]
      @_t = 0.0

    push: (lookAt, dt) ->
      @_t = 0.0 if @_sequence.length == 0
      dt_prime = dt ? 5000
      if @_timeline.length == 0
        dt_prime = 0.0
      @_timeline.push @totalTime() + dt_prime
      @_sequence.push lookAt
    
    sequence: (lookAts, dt) ->
      @_t = 0.0 if @_sequence.length == 0
      for lookAt in lookAts
        # CoffeeScript bug:
        #dt_prime = (dt ? 5000) if @_timeline.length > 0 else 0.0
        dt_prime = dt ? 5000
        if @_timeline.length == 0
          dt_prime = 0.0
        @_timeline.push @totalTime() + dt_prime
        @_sequence.push lookAt 
      null
    
    pause: () -> @_play = false

    play: () -> @_play = true
    
    totalTime: () -> 
      # CoffeeScript bug:
      # return @_timeline[@_timeline.length] if @_timeline.length > 0 else 0
      if @_timeline.length > 0
        return @_timeline[@_timeline.length - 1] 
      return 0

    update: () ->
      # Remove from tweens if the sequence is empty
      return false if @_sequence.length == 0
      
      # Check if the animation is paused
      return true if not @_play

      # Remove from tweens if the sequence is complete
      if @_t >= @totalTime() || @_sequence.length == 1
        @_target.set @_sequence[@_sequence.length - 1]
        return false
      
      # Perform interpolation
      i = 0
      ++i while @_timeline[i] <= @_t        
      dt = @_timeline[i] - @_timeline[i - 1]
      lerpLookAtNode @_target, 
        (@_t - @_timeline[i - 1]) / dt,
        @_sequence[i - 1], 
        @_sequence[i]
      return true
  
  _tweens = []
  _intervalID = null
  _dt = 0
  
  _tick = () ->
    for tween in _tweens
      tween.tick _dt
    null
  
  _r = (lookAtNode, interval) ->
    _dt = interval || 50                       # The default interval is 50 ms equivalent to 20 FPS
    if _intervalID != null
      clearInterval _intervalID
    _intervalID = setInterval _tick, _dt
    tween = new TweenSpline lookAtNode
    _tweens.push tween
    return tween
  
  _r.update = () ->
    i = 0
    while i < _tweens.length
      tween = _tweens[i]
      if not tween.update()
        _tweens.splice i, 1
      else
        i += 1
  
  return _r
