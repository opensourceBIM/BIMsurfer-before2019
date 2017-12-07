
    Copyright 2017, bimsurfer.org
    BIM Surfer is licensed under the MIT License.

# Table of Contents

- [Introduction](#introduction)
- [Usage](#usage)
  - [Basic usage](#basic-usage)
  - [Import as a module](#import-as-a-module)
  - [Loading a test model](#loading-a-test-model)
  - [Loading a model from BIMserver](#loading-a-model-from-bimserver)
  - [Loading a model from a glTF file](#loading-a-model-from-a-gltf-file)
- [API documentation](#api-documentation)
  - [Selecting and deselecting objects](#selecting-and-deselecting-objects)
  - [Showing and hiding objects](#showing-and-hiding-objects)
  - [Changing color and transparency of objects](#changing-color-and-transparency-of-objects)
  - [Camera](#camera)
    - [Controlling the camera](#controlling-the-camera)
    - [Fitting objects in view](#fitting-objects-in-view)
  - [Resetting](#resetting)
    - [Camera](#camera-1)
    - [Objects](#objects-1)
- [Build BIMsurfer](#build-bimsurfer)

# Introduction

BIMSurfer is a WebGL-based 3D viewer for [BIMServer](https://github.com/opensourceBIM/BIMserver) that is built on the [xeogl](http://xeogl.org) engine.
 
TODO: More info
     
# Usage

## Basic usage

Download the [combined minified library](https://raw.githubusercontent.com/opensourceBIM/BIMsurfer/master/build/bimsurfer.umd.js) and include it in your HTML.

```html
<script type="module" src="bimsurfer.umd.js"></script>
```

BIMsurfer components are loaded under the ``bimsurfer`` namespace. Instanciate the components as follow:

```javascript
var bimSurfer = new bimsurfer.BimSurfer({
    domNode: "viewerContainer"
});

var domtree = new bimsurfer.StaticTreeRenderer({
    domNode: 'treeContainer'
});

var metadata = new bimsurfer.MetaDataRenderer({
    domNode: 'dataContainer'
});
```

## Import as a module
If you are using a transpiler such as [Typescript](https://www.typescriptlang.org/) or [Babel](http://babeljs.io/), or a bundler such as [Webpack](https://webpack.js.org/) or [Rollup](https://rollupjs.org/), you can import the module using the [Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) syntax.

It is also possible to load the module directly into the browser, however not all browser support this yet.

```javascript
import { Bimsurfer, BimServerModelLoader, StaticTreeRenderer, MetaDataRenderer } from './bimsurfer/src/index.js';
```

## Loading a test model
Generate a random test model if you want to test BIMsurfer without loading anything from BIMserver:   

```javascript
var bimSurfer = new bimsurfer.BimSurfer({
    domNode: "viewerContainer"
});

bimSurfer.loadRandom();
```

## Loading a model from BIMServer
You need to load the [BIMserver javascript API](https://github.com/opensourceBIM/BIMserver-JavaScript-API) first.

```javascript
var bimSurfer = new bimsurfer.BimSurfer({
    domNode: "viewerContainer"
});

var bimServerClient = new bimserverapi.BimServerClient(BIMSERVER_ADDRESS, null);

bimServerClient.init(function() {
    bimServerClient.login(BIMSERVER_USERNAME, BIMSERVER_PASSWORD, function() {
        var modelLoader = new bimsurfer.BimServerModelLoader(bimServerClient, bimSurfer);

        bimServerClient.call("ServiceInterface", "getAllRelatedProjects", { poid: POID }, (projects) => {
            projects.forEach(function(project) {
                if (project.lastRevisionId != -1 && (project.nrSubProjects == 0 || project.oid != POID)) {
                    bimServerClient.getModel(project.oid, project.lastRevisionId, project.schema, false, function(model) {
                        modelLoader.loadFullModel(model).then(function (bimSurferModel) {
                            // Model is now loaded and rendering.
                        });
                    });
                }
            });
        });
    });
});
```

## Loading a model from a glTF file
```javascript
var bimSurfer = new bimsurfer.BimSurfer({
    domNode: "viewerContainer"
});

bimSurfer.load({
    src: "model_file_name.gltf"
}).then(function (bimSurferModel) {
    // Model is now loaded and rendering.
});
```

# API documentation

The following usage examples in this guide will refer to objects from the generated test model.

## Selecting and deselecting objects

Selecting four objects:

````javascript
bimSurfer.setSelection({ids: ["object3", "object2", "object4", "object6"], selected: true });
````

then querying which objects are selected:

````javascript
bimSurfer.getSelection()
````

The result shows that those four objects are currently selected:

````json
["object3", "object2", "object4", "object6"]
````

If we then deselect two objects, then query the selection again:

````javascript
bimSurfer.setSelection({ids: ["object3", "object6"], selected: false });
bimSurfer.getSelection()
````

The result shows that only two objects are now selected:

````json
["object2", "object4"]  
````

Subscribing to selection updates:

````javascript
bimSurfer.on("selection-changed", 
    function() {
         var selected = bimSurfer.getSelection();
         console.log("selection = " + JSON.stringify(selected));
    });
````

## Showing and hiding objects

Hiding three objects by ID:

````javascript
bimSurfer.setVisibility({ids: ["object3", "object1", "object6"], visible: false });
````

Setting two objects visible by ID:

````javascript
bimSurfer.setVisibility({ids: ["object1", "object6"], visible: true });
````

Hiding all objects of IFC types "IfcSlab" and "IfcWall":

````javascript
bimSurfer.setVisibility({types: ["IfcSlab", "IfcWall"], visible: false });
````

## Changing color and transparency of objects

Making two objects pink:

````javascript
bimSurfer.setColor({ids: ["object3", "object6"], color: [1, 0, 1] })
````

An optional fourth element may be specified in the color to set opacity: 

````javascript
bimSurfer.setColor({ids: ["object3", "object6"], color: [1, 0, 1, 0.5] })
````

## Camera
  
### Controlling the camera

Setting the camera position:

````javascript
bimSurfer.setCamera({ 
    eye: [-20,0,20],
    target: [0,10,0],
    up: [0,1,0]
});
````

Then "target" will then be the position we'll orbit about with the mouse or arrow keys (until we double-click an object to 
 select a different orbit position).

Setting the camera projection to orthographic:

````javascript
bimSurfer.setCamera({ 
    type:"ortho"
});
````

Setting the view volume size for orthographic, switching to orthographic projection first if necessary:

````javascript
bimSurfer.setCamera({ 
    type:"ortho", 
    scale: 100
});
````
This uses the same technique as Blender, where the scale argument relates to the "real world" size of the model, meaning 
that if you set scale to 100, then your view would at most encompass an element of 100 units size.    

Setting the camera projection to perspective:

````javascript
bimSurfer.setCamera({ 
    type:"persp"
});
````

Setting the FOV on Y-axis for perspective, switching to perspective projection first if necessary:

````javascript
bimSurfer.setCamera({ 
    type:"persp", 
    fovy: 65
});
````

Querying camera state:

````javascript
var camera = bimSurfer.getCamera();
````

The returned value would be:

````json
{
    "type": "persp",
    "eye": [-20,0,20],
    "target": [0,10,0],
    "up": [0,1,0],
    "fovy": 65
}
````

Subscribing to camera updates:

````javascript
bimSurfer.on("camera-changed", 
    function() {
         var camera = bimSurfer.getCamera();
         console.log(JSON.stringify(camera));
    });
````
 
### Fitting objects in view

Flying the camera to fit the specified objects in view:

````javascript
bimSurfer.viewFit({ ids: ["object3", "object1", "object6"], animate: true });
````

Jumping the camera to fit the specified objects in view:

````javascript
bimSurfer.viewFit({ids: ["object1", "object6"], animate: false });
````

Flying to fit all objects in view:

````javascript
bimSurfer.viewFit({ animate: true });
````

Jumping to fit all objects in view:

````javascript
bimSurfer.viewFit({ animate: false });
````

## Resetting

### Camera

Resetting the camera to initial position:  

````javascript
bimSurfer.reset({ cameraPosition: true });
````

### Objects

Resetting all objects to initial visibilities:

````javascript
bimSurfer.reset({ visibility: true });
````

Resetting two objects to their initial visibilities:  

````javascript
bimSurfer.reset({ ids: ["object3", "object6"], visibility: true });
````

Resetting all objects to their initial colors:  

````javascript
bimSurfer.reset({ elementColors: true });
````

Resetting two objects to their initial colors:  

````javascript
bimSurfer.reset({ ids: ["object3", "object6"], elementColors: true });
````

Deselecting all objects:  

````javascript
bimSurfer.reset({ selectionState: true });
````

# Build BIMsurfer
* Install [Node.js](https://nodejs.org/)
* Clone (or download and unzip) the project to your file system:
```
git clone https://github.com/opensourceBIM/BIMsurfer.git
```
* Go to the project directory
```
cd BIMsurfer
```
* Install build dependencies
```
npm install
```
* Run the build script
```
npm run build
```
The compiled file is located at ``build/bimsurfer.umd.js``
