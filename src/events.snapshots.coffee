# Eventful code comes here
# Program state should not be manipulated outside events files

snapshotsPush = () ->
  node = state.scene.findNode 'main-lookAt'
  state.snapshots.push
    eye: node.get 'eye'
    look: node.get 'look'
    up: node.get 'up'
  ($ '#snapshots').append "
<div class='snapshot'>
<div class='snapshot-thumb'><a href='#' class='snapshot-delete'>x</a></div>
</div>"

snapshotsDelete = (event) ->
  parent = ($ event.target).parent()
  state.snapshots.slice parent.index() + 1
  parent.remove()

snapshotsToggle = (event) ->
  # TODO: SceneJS.FX.transition (state.scene.findNode 'main-lookAt'), state.snapshots, { interpolation: 'linear' }

