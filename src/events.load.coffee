# Eventful code comes here
# Program state should not be manipulated outside events files

# Load the scene and initialize controls
loadScene = (scene) ->
  if state.scene?
    state.scene.destroy()
    state.scene = null
  try 
    console?.log? 'Create scene...'
    SceneJS.createScene scene
    state.scene = SceneJS.scene 'Scene' 
    viewportInit()
    # Re-initialize controls and scene
    if state.scene?
      console?.log? 'Initialize scene...'
      sceneInit()
      console?.log? 'Start scene...'
      state.scene.start
        idleFunc: SceneJS.FX.idle
      console?.log? 'Initialize controls...'
      controlsInit()
      console?.log? 'Initialize IFC object tree...'
      ifcTreeInit()
      console?.log? '...Done'
      return state.scene
  catch error
    console?.log? error
    console?.log? '...Errors occured'
  return null
