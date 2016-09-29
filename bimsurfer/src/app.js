require(["bimsurfer/src/BimSurfer.js", "bimsurfer/src/StaticTreeRenderer.js", "bimsurfer/src/MetaDataRenderer.js", "bimsurfer/lib/domReady.js!"], function (BimSurfer, StaticTreeRenderer, MetaDataRenderer) {

    var bimSurfer = new BimSurfer({
        domNode: "viewerContainer"
    });

    // For console debugging
    window.bimSurfer = bimSurfer;

    bimSurfer.load({
        bimserver: ADDRESS,
        username: USERNAME,
        password: PASSWORD,
        poid: 10027009,
        roid: 25231363,
        schema: "ifc2x3tc1" // < TODO: Deduce automatically
    }).then(function (model) {

        model.getTree().then(function (tree) {

            var domtree = new StaticTreeRenderer({
                domNode: 'treeContainer'
            });
            
            domtree.addModel({name: tree.name, id:model.model.roid, tree:tree});
            domtree.build();

            var metadata = new MetaDataRenderer({
                domNode: 'dataContainer'
            });
            
            metadata.addModel({name: tree.name, id:model.model.roid, model:model});

            domtree.on("click", function (oid) {
                // Clicking an explorer node fits the view to its object
                bimSurfer.viewFit({
                    ids: [oid],
                    animate: true
                });
            });
                
            bimSurfer.on("selection-changed", function(selected) {
                domtree.setSelected(selected, domtree.SELECT_EXCLUSIVE);
                metadata.setSelected(selected);
            });
        });

    });
});
