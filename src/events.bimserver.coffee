# Eventful code comes here
# Program state should not be manipulated outside events files

# Import the object with the specified oid from the bimserver ath the given url
bimserverImport = (url,oid) ->
  console?.log? "Load BIMserver project with oid" + oid + "..."
  ($.get url + 'download?poid=' + oid + '&serializerName=SceneJS', undefined, undefined, 'text')
    .done (data, textStatus, jqXHR) -> 
      console?.log? data
      console?.log? "...Done (TODO: now load scene...)"
      return # TODO
    .fail (jqXHR, textStatus, errorThrown) ->
      console.log textStatus
      console?.log? "...BIMserver import failed" 
      return # TODO

