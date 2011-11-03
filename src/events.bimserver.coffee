# Eventful code comes here
# Program state should not be manipulated outside events files

# Import the object with the specified oid from the bimserver ath the given url
bimserverImport = (url,oid) ->
  console?.log? "Load BIMserver project with oid " + oid + "..."
  #($.get url + 'download?poid=' + oid + '&serializerName=SceneJS', undefined, undefined, 'text')
  # ...URL is hardcoded for now...
  #($.get 'http://localhost:8082/' + 'download?poid=' + oid + '&serializerName=SceneJS', undefined, undefined, 'text')
  #($.get 'http://localhost:8082/' + 'download?poid=' + oid + '&serializerName=SceneJS', undefined, undefined, 'text')
  #  .done (data, textStatus, jqXHR) -> 
  #    console?.log? data
  #    console?.log? "...Done (TODO: now load scene...)"
  #    return # TODO
  #  .fail (jqXHR, textStatus, errorThrown) ->
  #    console.log textStatus
  #    console?.log? "...BIMserver import failed" 
  #    return # TODO
  
  # ... and authentication added again for different port...
  user = ($ '#bimserver-login-username').val()
  pwd = ($ '#bimserver-login-password').val()

  # Note: unfortunately CoffeeScript does not currently allow us to embed the try-catch blocks inside the ajax call (thus we've defined it outside)
  downloadDone = (data, textStatus, jqXHR) -> 
    console?.log? "...Download complete"
    try
      loadScene data
      helpStatusClear()
    catch error
      console?.log? error
    return # TODO display error

  (($.ajax
    username: encodeURIComponent user
    password: encodeURIComponent pwd
    type: 'GET'
    url: url + 'download'
    #dataType: 'text' 
    dataType: 'json'
    data: 'poid=' + oid + '&serializerName=SceneJS')
    .done downloadDone)
    .fail (jqXHR, textStatus, errorThrown) -> 
      console.log textStatus
      console?.log? "...BIMserver import failed"

