# Eventful code comes here
# Program state should not be manipulated outside events files

snapshotsPush = () ->
  node = state.scene.findNode 'main-lookAt'
  thumbSize = constants.thumbnails.size
  imgURI = canvasCaptureThumbnail state.canvas, 512 * thumbSize[0] / thumbSize[1], 512, constants.thumbnails.scale * thumbSize[0], constants.thumbnails.scale * thumbSize[1]
  state.snapshots.lookAts.push
    eye: node.get 'eye'
    look: node.get 'look'
    up: node.get 'up'
  ($ '#snapshots').append "
<div class='snapshot'>
<div class='snapshot-thumb'>
<a href='#' class='snapshot-delete'>x</a>
<img width='" + thumbSize[0] + "px' height='" + thumbSize[1] + "px' src='" + imgURI + "'>
</div>
<div class='snapshot-swap'><a href='#'>&lt;</a><a href='#'>&gt;</a></div>
</div>"

snapshotsDelete = (event) ->
  parent = ($ event.target).parent()
  state.snapshots.lookAts.slice parent.index() + 1
  parent.remove()

snapshotsToggle = (event) ->
  # TODO: SceneJS.FX.transition (state.scene.findNode 'main-lookAt'), state.snapshots, { interpolation: 'linear' }

snapshotsPlay = (event) ->
  lookTween = SceneJS.FX.TweenSpline state.snapshots.lookAts
  return lookTween

