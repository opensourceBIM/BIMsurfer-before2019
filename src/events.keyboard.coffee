# Eventful code comes here
# Program state should not be manipulated outside events files

keyDown = (event) ->
  switch event.which
    when 72 # h - Toggle help
      topmenuHelp()

