# Eventful code comes here
# Program state should not be manipulated outside events files

# Show a help/info status message
helpStatus = (str) ->
  ($ '#main-view-help').html str

# Clear the last help/info status message that was set
helpStatusClear = () ->
  ($ '#main-view-help').html ""
