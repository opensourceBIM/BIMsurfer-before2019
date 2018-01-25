# BIMsurfer example scripts

## Compilation and minification

BimSurfer relies on RequireJS for module loading. You can use r.js to build compiled and minified source to reduce the number of requests. The glTF example uses such a minified source. Note that the resulting file includes xeogl.

~~~
npm install -g requirejs uglify-es
r.js -o build-gltf_app.js
uglifyjs --compress --mangle -o gltf_app.min.js -- gltf_app.build.js
~~~
