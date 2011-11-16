# Eventful code comes here
# Program state should not be manipulated outside events files

# Import the object with the specified revision oid from the bimserver at the given url
bimserverImport = (url,oid) ->
  console?.log? "Load BIMserver project with revision # " + oid + "..."
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

  # Ajax callbacks
  # Note: unfortunately CoffeeScript does not currently allow us to embed the try-catch blocks inside the ajax call (thus we've defined it outside)
  getDownloadDataDone = (data, textStatus, jqXHR) -> 
    #console.log data
    #console.log $.parseJSON window.atob data.sCheckoutResult.file
    console?.log? "...Download completed"
    try
      loadScene $.parseJSON window.atob data.sCheckoutResult.file
      helpStatusClear()
    catch error
      console?.log? error
    return # TODO display error

  downloadDone = (data, textStatus, jqXHR) -> 
    #console.log data
    console?.log? "...Got download action id '#{data}'"
    console?.log? "Fetch download data..."
    (($.ajax
      username: encodeURIComponent user
      password: encodeURIComponent pwd
      type: 'GET'
      url: url + 'rest/getDownloadData'
      dataType: 'json'
      data: 'actionId=' + data)
      .done getDownloadDataDone)
      .fail (jqXHR, textStatus, errorThrown) -> 
        console?.log? textStatus
        console?.log? "...BIMserver import failed"
    return
  
  # Download model
  (($.ajax
    username: encodeURIComponent user
    password: encodeURIComponent pwd
    type: 'GET'
    url: url + 'rest/download'
    dataType: 'text' 
    data: "roid=#{oid}&serializerName=SceneJS&sync=true")
    .done downloadDone)
    .fail (jqXHR, textStatus, errorThrown) -> 
      console?.log? textStatus
      console?.log? "...BIMserver import failed"

