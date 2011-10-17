# Eventful code comes here
# Program state should not be manipulated outside events files

bimserverImport = (url,oid) ->
  #console.log "TODO: Load project with oid " + oid
  ($.get url + 'download?poid=' + oid + '&serializerName=SceneJS', undefined, undefined, 'text')
    .done (data, textStatus, jqXHR) -> 
      console.log data
      return # TODO
    .fail (jqXHR, textStatus, errorThrown) -> 
      console.log textStatus
      return # TODO

