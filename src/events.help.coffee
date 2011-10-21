# Eventful code comes here
# Program state should not be manipulated outside events files

helpStatus = (str) ->
  ($ '#main-view-help').html str

helpStatusClear = () ->
  ($ '#main-view-help').html ""
