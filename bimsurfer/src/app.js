require(["bimsurfer/src/BimSurfer.js", "bimsurfer/src/StaticTreeRenderer.js", "bimsurfer/lib/domReady.js!"], function (BimSurfer, StaticTreeRenderer) {

    var bimSurfer = new BimSurfer({
        domNode: "viewerContainer"
    });

    // Viewer's local test mode, loads randomly generated objects
    //
    //bimSurfer.load({
    //    test: true
    //});

    bimSurfer.load({
        bimserver: ADDRESS,
        username: USERNAME,
        password: PASSWORD,
        poid: 131073,
        roid: 65539,
        schema: "ifc2x3tc1" // < TODO: Deduce automatically
    })
        .then(function (model) {

            model.getTree().then(function (tree) {

                domtree = new StaticTreeRenderer({
                    domNode: 'treeContainer',
                    tree: tree
                });

                domtree.build();

                domtree.on("click",
                    function (oid) {




                    });
            });
        });
});
