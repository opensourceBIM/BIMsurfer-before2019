# An extension for capturing thumbnails from an html5 canvas
canvasCaptureThumbnail = (srcCanvas, srcWidth, srcHeight, destWidth, destHeight) ->
  thumbCanvas = document.createElement 'canvas'
  thumbCanvas.width = destWidth
  thumbCanvas.height = destHeight
  thumbCtx = thumbCanvas.getContext '2d'

  w = ($ srcCanvas).width()
  h = ($ srcCanvas).height()
  clipHeight = Math.min h, srcHeight
  clipWidth = Math.min w, srcWidth

  clipX = Math.floor (w - srcWidth) / 2
  clipY = Math.floor (h - srcHeight) / 2

  thumbCtx.drawImage srcCanvas, clipX, clipY, clipWidth, clipHeight, 0, 0, destWidth, destHeight
  imgURI = thumbCanvas.toDataURL 'image/png'
  #TODO: In future if there's better browser support for it, see if a blob might be more performant?
  #result = thumbCanvas.toBlob ((blob) -> alert "blob got"), 'image/png'
  return imgURI
