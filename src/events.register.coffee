# Eventful code comes here
# Program state should not be manipulated outside events files

# Please note the following conventions: 
#
#  * Use jquery delegate in place of live
#    http://jupiterjs.com/news/why-you-should-never-use-jquery-live
#

# Register document events
registerDOMEvents = () ->
  state.viewport.domElement.addEventListener 'mousedown', mouseDown, true
  state.viewport.domElement.addEventListener 'mouseup', mouseUp, true
  state.viewport.domElement.addEventListener 'mousemove', mouseMove, true
  state.viewport.domElement.addEventListener 'mousewheel', mouseWheel, true
  state.viewport.domElement.addEventListener 'DOMMouseScroll', mouseWheel, true
registerDOMEvents()

# Register UI events
($ '#layer-walls').change controlsToggleLayer
($ '#layer-doors').change controlsToggleLayer
($ '#layer-windows').change controlsToggleLayer
($ '#layer-columns').change controlsToggleLayer
($ '#layer-roofs').change controlsToggleLayer
($ '#layer-floors').change controlsToggleLayer

($ '#snapshot-placeholder').click snapshotsPush
($ '#snapshots').delegate '.snapshot', 'click', snapshotsToggle
($ '#snapshots').delegate '.snapshot-delete', 'click', snapshotsDelete
