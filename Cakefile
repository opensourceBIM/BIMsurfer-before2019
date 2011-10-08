fs     = require 'fs'
path   = require 'path'
{exec} = require 'child_process'

appFiles  = [
  # omit src/ and .coffee to make the below lines a little shorter
  'regexp.escape'
  'canvas.thumbnail'
  'scenejs.nodeattr'
  'scenejs.conversion'
  'scenejs.orbitlookat'
  'scenejs.zoomlookat'
  'scenejs.interpolate.lookat'
  'scenejs.fx'
  'scenejs.fx.tween.lookat.spline'
  'scenejs.fx.idle'
  'constants'
  'math'
  'state'
  'mouse'
  'events.window'
  'events.mouse'
  'events.keyboard'
  'events.topmenu'
  'events.controls'
  'events.snapshots'
  'events.register'
  'events.init'
]

task 'build', "Build single application file from source files", ->
  #fs.mkdirSync 'build', 0755
  exec "mkdir -p 'build'", (err, stdout, stderr) ->
  # Concatenate files
  appContents = new Array remaining = appFiles.length
  for file, index in appFiles then do (file, index) ->
    fs.readFile "src/#{file}.coffee", 'utf8', (err, fileContents) ->
      throw err if err
      appContents[index] = fileContents
      process() if --remaining is 0
  # Translate concatenated file
  process = ->
    fs.writeFile 'build/app.coffee', appContents.join('\n\n'), 'utf8', (err) ->
      throw err if err
      exec "coffee -o static/lib -c build/app.coffee", (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr
        fs.unlink 'build/app.coffee', (err) ->
          throw err if err
          # Concatenate the header file
          fs.readFile 'static/lib/app.js', 'utf8', (err, appjsContents) ->
            throw err if err
            fs.readFile 'src/header.js', 'utf8', (err, headerjsContents) ->
              throw err if err
              # Write out the result
              fs.writeFile 'static/lib/app.js', headerjsContents + appjsContents, 'utf8', (err) ->
                throw err if err
                console.log "Done."

task 'fetch:npm', "Fetch the npm package manager", ->
  exec "curl http://npmjs.org/install.sh | sudo sh", (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr
    console.log "Done."

task 'fetch:uglifyjs', "Fetch the UglifyJS minification tool", ->
  exec "npm install uglify-js", (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr
    console.log "Done."
  #path.exists 'tools/UglifyJS', (exists) ->
  #  cmdString = if exists then "cd tools/UglifyJS;git pull;cd ../.." else "git clone git://github.com/mishoo/UglifyJS.git tools/UglifyJS"
  #  exec cmdString, (err, stdout, stderr) ->
  #    throw err if err
  #    console.log stdout + stderr
  #    exec "ln -s tools/UglifyJS/uglify-js.js -t ~/.node_libraries", (err, stdout, stderr) ->
  #      throw err if err
  #      console.log stdout + stderr
  #      console.log "Done."

task 'minify', "Minify the resulting application file after build", ->
  #path.exists 'tools/UglifyJS', (exists) ->
  path.exists 'node_modules/.bin/uglifyjs', (exists) ->
    if exists
      #exec "tools/UglifyJS/bin/uglifyjs static/lib/app.js > static/lib/app.min.js", (err, stdout, stderr) ->
      exec "node_modules/.bin/uglifyjs static/lib/app.js > static/lib/app.min.js", (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr
        console.log "Done."
    else
      exec "uglifyjs static/lib/app.js > static/lib/app.min.js", (err, stdout, stderr) ->
        throw err if err
        console.log stdout + stderr
        console.log "Done."

task 'clean', "Cleanup all build files and distribution files", ->
  exec "rm -rf build;rm static/lib/app.js;rm static/lib/app.min.js", (err, stdout, stderr) ->
    #throw err if err
    console.log stdout + stderr
    console.log "Done."

task 'remove:tools', "Remove all tools from the tools directory", ->
  exec "rm -rf tools", (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr
    console.log "Done."

