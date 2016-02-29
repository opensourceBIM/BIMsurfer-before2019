
    Copyright 2016, bimsurfer.org
    BIM Surfer will be licensed under the MIT License.

# New version 2016 
In 2016 a new version of BIM Surfer will be released.
The code will be build from scratch into a component that can be re-used in other softwaretools. 
The license will change to MIT license to allow liberal re-use in commercial applications.

At this moment an API is being designed. This file will elaborate about this API and the intended implementation.

# Design rationale
A BIM viewer module that can be used by 3d-novices without extensive knowledge on either web-frameworks or 3d frameworks. The example below serves to minimize boilerplate code, but is implemented on top of modular classes that can be instantiated manually as well. Legibility is prefered at all times. Hence, whenever sensible, methods take dictionaries rather than positional arguments

```javascript
var viewer = new BimSurfer();

// Alternative 1: Load a model from an on-line BIMserver with existing bimserverapi/model:
var bimServerApi = ...// existing bimserverapi
var model = ...// existing bimserverapi model
var viewerModel = viewer.load({bimserverapi: bimserverapi, model: model, query: …});

// Alternative 2: Let bimsurfer create a bimsererapi and model
// The load()'ing of a model happens asynchronously. Hence, it
// returns a Promise with a then() function that accepts a 
// method in case of success and (optionally) in case of error.
viewer.load({bimserver: …, username: …, password: …,
             poid: …, roid: …, query: …}).then(
    function(model) { … },
    function(error) { … }
);

// Alternatively 3: load a model from file:
var model = viewer.load({url: "/path/to/file.glTF"}).then(function(model) {

// getTree() returns a javascript notation of the tree.
// `guid` and `nlevels` allow to only return a subset 
// of the tree for performance reasons.
var tree = model.getTree({guid: …, nlevels: …}).then(function(tree) {

// Creating a DOM tree is framework specific, but examples
// are provided for various frameworks [1]
// [1] https://github.com/opensourceBIM/bimvie.ws-viewer/
//             blob/master/index.html#L108
var domtree = …;

domtree.on("click", function(oid) {
    viewer.viewFit({ids: [oid]});
});

domtree.on("eye-click", function(oid) {
    viewer.hide([oid]);
});

// Event handlers on the viewer can be subscribed to using the 
// on() method.

function selectionChanged(currentlySelected, selectionChanged) {

}

viewer.on("selection-changed", selectionChanged);

// Event handler can be canceled using the off() method. Possibly
// by using a wildcard to cancel all handlers on a particular
// event.
viewer.off("selection-changed", selectionChanged);
viewer.off("selection-changed", "*");
```

### Advanced usage
The example above favours ease of use over modularity and extensibility. In fact, the code above are merely shortcuts providing sensible defaults to functionally identical behaviour.

```javascript
var viewer = BimSurfer.Viewer();
// Still not so sure what to do with this
var tree_view = BimSurfer.DojoTreeView();
var canvas = BimSurfer.XeoEngineViewer();
var loader = BimSurfer.BimServerLoader();
var query = BimSurfer.RubenQueryEngine();
var painter = BimSurfer.MaterialColorByEntity();

viewer.addTreeView(tree_view);
viewer.addViewer(canvas);
viewer.addLoader(loader);
viewer.setPainter(painter);

loader.load({bimserver: …, username: …, password: …,
             poid: …, roid: …, query: …});
```

# API reference

NB: This is the “simple” viewer API
NB2: What do we prefer? select/deselect or setSelectionState

The type <id> refers to
- A numeric identifier (“oid” / objectID in BIMserver jargon)
- A textual guid (“GUID” / Globally Unique IDentifier in IFC jargon)
Users are free to mix and match these types of ids and the viewer will translate between them. Use of numeric identifiers is more efficient, hence numeric ids are returned by the viewer. The user can translate between them with toId() toGuid() respectively.



| | | |
| ------------ | ------------ | ------------ |
| BimSurfer.BimSurfer() | constructor: no arguments |   |
| BimSurfer.load({}) <br/> → promise  | bimserver<br/> username<br/> password<br/> poid<br/> roid<br/> query<br/><br/> -or-<br/> url|  Loads the elements and tree for the specific {poid, roid} or url. This is the simple viewer, hence, loaded models are directly shown |
|  BimSurfer.getTree({})<br/> → promise | id: <id> or null <br/> nlevels: int | Returns a promise of the representation of the tree |
| BimSurfer.setVisibility({}) <br/> → void | ids: Array of id <br/> entities: Array of string <br/> recursive: boolean (=false) <br/> visible: boolean | Show/hide previously unhidden elements specified by <id> or by entity type, e.g IfcWall. When recursive is set to true, hides children (aggregates, spatial structures, …) or subtypes<br/> NB: ids and entities are mutually exclusive |

