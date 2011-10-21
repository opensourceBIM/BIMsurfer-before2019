# Eventful code comes here
# Program state should not be manipulated outside events files

loadScene = (scene) ->
  if state.scene?
    state.scene.destroy()
  try 
    SceneJS.createScene scene
    console?.log? 'Scene created...'
    state.scene = SceneJS.scene 'Scene' 
    # Re-initialize controls and scene
    if state.scene?
      sceneInit()
      console?.log? 'Scene init...'
      state.scene.start
        idleFunc: SceneJS.FX.idle
      console?.log? 'Scene started...'
      controlsInit()
      console?.log? 'Controls init...'
      ifcTreeInit()
    console?.log? 'Scene loaded...'
    return state.scene
  catch error
    console.log error
    return null
