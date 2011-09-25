# Eventful code comes here
# Program state should not be manipulated outside events files

topmenuPerformanceQuality = (event) ->
  ($ event.target).addClass 'top-menu-activated'
  ($ '#top-menu-performance-performance').removeClass 'top-menu-activated'
  ($ '#viewport').attr position, 'absolute'
  state.settings.performance = 'quality'

topmenuPerformancePerformance = (event) ->
  ($ event.target).addClass 'top-menu-activated'
  ($ '#top-menu-performance-performance').removeClass 'top-menu-activated'
  ($ '#viewport').attr position, 'relative'
  state.settings.performance = 'performance'

topmenuModeBasic = (event) ->
  ($ event.target).addClass 'top-menu-activated'
  ($ '#top-menu-mode-advanced').removeClass 'top-menu-activated'

topmenuModeAdvanced = (event) ->
  ($ event.target).addClass 'top-menu-activated'
  ($ '#top-menu-mode-basic').removeClass 'top-menu-activated'

topmenuHelp = (event) ->
  ($ event.target).toggleClass 'top-menu-activated'
  ($ '#main-view-help').toggle()
  ($ '#main-view-keys').toggle()
