# Eventful code comes here
# Program state should not be manipulated outside events files

topmenuHelp = (event) ->
  ($ event.target).toggleClass 'top-menu-activated'
  ($ '#main-view-help').toggle()
  ($ '#main-view-keys').toggle()
