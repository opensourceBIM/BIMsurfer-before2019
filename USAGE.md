#Table of Contents

- [Introduction](#introduction)
- [Usage](#usage)
  - [BIMSurfer](#bimsurfer)
  - [Objects](#objects)
    - [Selecting and deselecting objects](#selecting-and-deselecting-objects)
    - [Showing and hiding objects](#showing-and-hiding-objects)
    - [Changing color and transparency of objects](#changing-color-and-transparency-of-objects)
  - [Camera](#camera)
    - [Controlling the camera](#controlling-the-camera)
    - [Fitting objects in view](#fitting-objects-in-view)
  - [Resetting](#resetting)
    - [Camera](#camera-1)
    - [Objects](#objects-1)

# Introduction

BIMSurfer is a WebGL-based 3D viewer for [BIMServer]() that's built on [xeoEngine](http://xeoengine.org).
 
TODO: More info
     
# Usage

## BIMSurfer

Creating a [BIMSurfer](bimsurfer/src/BimSurfer.js): 

````javascript
var bimSurfer = new BimSurfer({
    domNode: "viewerContainer"
});
````

Loading a model from BIMServer:
 
````javascript
bimSurfer.load({
        bimserver: ADDRESS,
        username: USERNAME,
        password: PASSWORD,
        poid: 131073,
        roid: 65539,
        schema: "ifc2x3tc1" // < TODO: Deduce automatically
    })
        .then(function (model) {
        
                // Model is now loaded and rendering.
                // The following sections show what you can do with BIMSurfer at this point.
                //...
            });
````

Generate a random test model if you want to test BIMSurfer without loading anything from BIMServer:   

````javascript
bimSurfer.loadRandom();
````

The following usage examples in this guide will refer to objects from the generated test model.

## Objects

### Selecting and deselecting objects

Selecting four objects:

````javascript
bimSurfer.setSelectionState({ids: ["object3", "object2", "object4", "object6"], selected: true });
````

then querying which objects are selected:

````javascript
bimSurfer.getSelected()
````

The result shows that those four objects are currently selected:

````json
["object3", "object2", "object4", "object6"]
````

If we then deselect two objects, then query the selection again:

````javascript
bimSurfer.setSelectionState({ids: ["object3", "object6"], selected: false });
bimSurfer.getSelected()
````

The result shows that only two objects are now selected:

````json
["object2", "object4"]  
````

### Showing and hiding objects

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
bimSurfer.setVisibility({ids: ["IfcSlab", "IfcWall"], visible: false });
````

### Changing color and transparency of objects

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
    scale: [10,10,10]
});
````

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

 

