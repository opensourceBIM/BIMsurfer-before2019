# Eventful code comes here
# Program state should not be manipulated outside events files

snapshotsPush = () ->
  node = state.scene.findNode 'main-lookAt'
  imgURI = canvasCaptureThumbnail state.canvas, 512 * 1.25, 512, 125, 100
  state.snapshots.push
    eye: node.get 'eye'
    look: node.get 'look'
    up: node.get 'up'
  snapshotElement = ($ '#snapshots').append "
<div class='snapshot'>
<div class='snapshot-thumb'>
<a href='#' class='snapshot-delete'>x</a>
<img width='125px' height='100px'>
</div>
<div class='snapshot-swap'><a href='#'>&lt;</a><a href='#'>&gt;</a></div>
</div>"
  (($ snapshotElement).find 'img').attr 'src', imgURI

snapshotsDelete = (event) ->
  parent = ($ event.target).parent()
  state.snapshots.slice parent.index() + 1
  parent.remove()

snapshotsToggle = (event) ->
  # TODO: SceneJS.FX.transition (state.scene.findNode 'main-lookAt'), state.snapshots, { interpolation: 'linear' }

