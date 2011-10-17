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
  document.addEventListener 'keydown', keyDown, true
  window.addEventListener 'resize', windowResize, true

# Register UI controls events
registerControlEvents = () ->
  ($ '.dialog-close').click hideDialog
  ($ '#dialog-tab-bimserver1').submit bimserverImportDialogLogin
  ($ '#dialog-tab-bimserver2').submit bimserverImportDialogOpen
  ($ '#bimserver-import-step1').click bimserverImportDialogShowTab1
  ($ '#bimserver-import-step2').click bimserverImportDialogToggleTab2
  ($ '#bimserver-projects-refresh').click bimserverImportDialogRefresh
  ($ '#bimserver-projects').delegate 'li', 'click', bimserverImportDialogSelect

  ($ '#top-menu-import-bimserver').click topmenuImportBimserver
  ($ '#top-menu-performance-quality').click topmenuPerformanceQuality
  ($ '#top-menu-performance-performance').click topmenuPerformancePerformance
  ($ '#top-menu-mode-basic').click topmenuModeBasic
  ($ '#top-menu-mode-advanced').click topmenuModeAdvanced
  ($ '#top-menu-help').click topmenuHelp

  ($ '#controls-relationships').delegate '.controls-tree-item', 'click', controlsToggleTreeOpen
  ($ '#controls-relationships').delegate '.controls-tree-item', 'dblclick', controlsShowProperties
  ($ '#controls-relationships').delegate 'input', 'change', controlsToggleTreeVisibility
  ($ '#controls-layers input').change controlsToggleLayer

  ($ '#snapshot-placeholder').click snapshotsPush
  ($ '#snapshots').delegate '.snapshot', 'click', snapshotsToggle
  ($ '#snapshots').delegate '.snapshot-delete', 'click', snapshotsDelete
  ($ '#snapshots-play').click snapshotsPlay

  ($ state.viewport.domElement).dblclick controlsShowProperties
