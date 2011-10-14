# Eventful code comes here
# Program state should not be manipulated outside events files

bimserverImportDialogShow = () ->
  ($ '#dialog-background').show()
  #($ '#dialog-bimserver-import').show()

bimserverImportDialogLogin = () ->
  url = ($ '#bimserver-import-url').val()
  user = ($ '#bimserver-import-username').val()
  pwd = ($ '#bimserver-import-password').val()

  # Validate inputs
  if url.length < 1 then return false
  if user.length < 1 then return false
  if pwd.length < 1 then return false

  # NOTE: Writing a correct url validation regex (with no false positives or false negatives) is close to impossible.
  # Instead we are relying on the browsers validation on the field itself and then simply try to use the url.
  # If the server answers the url is clearly correct.

  # Ensure root url ends with /
  if url[url.length - 1] != '/'
    url += '/'
  
  # TODO: Ping the url to make sure it's correct? (Is it necessary?)

  # Call the REST api
  # TODO: Would be nice to find a more secure way to login (without using clear text)
  ($.get url + 'rest/login', 'username=' + (encodeURIComponent user) + '&password=' + (encodeURIComponent pwd))
    .done (data, textStatus, jqXHR) -> 
      console.log 'Login request succeeded'
    .fail (jqXHR, textStatus, errorThrown) -> 
      console.log 'Login request failed'
    .always (jqXHR, textStatus, errorThrown) -> 
      console.log 'Login request completed'

  pwd = null
  return true

