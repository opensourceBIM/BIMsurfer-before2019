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
      return if @_sequence.length == 0 || not @_play
      if @_t >= @totalTime() || @_sequence.length == 1
        @_target.set @_sequence[@_sequence.length - 1]
        # TODO: remove from the list if tween is done        
        console.log "done"
      else
        i = 0
        ++i while @_timeline[i] <= @_t        
        console.log "Tween interval: " + i
        dt = @_timeline[i] - @_timeline[i - 1]
        lerpLookAtNode @_target, 
          (@_t - @_timeline[i - 1]) / dt,
          @_sequence[i - 1], 
          @_sequence[i]
  
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
    tween = new TweenSpline lookAtNode
    _tweens.push tween
    return tween
  
  _r.update = () ->
    for tween in _tweens
      if tween._t < tween.totalTime()
        tween.update()
  
  return _r
