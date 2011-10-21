# Eventful code comes here
# Program state should not be manipulated outside events files

hideDialog = () ->
  ($ '#dialog-background,#dialog-bimserver-import,#dialog-file-import').hide()

