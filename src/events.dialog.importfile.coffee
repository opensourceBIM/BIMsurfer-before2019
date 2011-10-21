# Eventful code comes here
# Program state should not be manipulated outside events files

fileImportDialogShow = (event) ->
  ($ '#dialog-background,#dialog-file-import').show()

fileImportDialogLoad = (event) ->
  reader = new FileReader()
  reader.onloadend = (f) -> 
    try 
      loadScene $.parseJSON f.target.result
      helpStatusClear()
    catch error
      console?.log? error
      return # TODO display error
  file = ($ '#upload-file').get(0)?.files[0]
  if file?
    reader.readAsText file
    # Close the dialog
    hideDialog()
  else
    ($ '#file-import-message-error').html "No file selected"
    console?.log? "No file selected"
  
  #($ '#upload-form').submit()
  #($.get 'static/models/Vogel_Gesamt.json', undefined, undefined, 'json')
  #  .done (data, textStatus, jqXHR) -> 
  #    console.log data
  #    return # TODO
  #  .fail (jqXHR, textStatus, errorThrown) -> 
  #    console.log textStatus
  #    return # TODO

