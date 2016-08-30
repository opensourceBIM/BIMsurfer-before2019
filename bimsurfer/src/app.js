require(["bimsurfer/src/BimSurfer.js", "bimsurfer/src/StaticTreeRenderer.js", "bimsurfer/lib/domReady.js!"], function (BimSurfer, StaticTreeRenderer) {

    var bimSurfer = new BimSurfer({
        domNode: "viewerContainer"
    });

    // For console debugging
    window.bimSurfer = bimSurfer;

    // Viewer's local test mode, loads randomly generated objects
    //
    //bimSurfer.load({
    //    test: true
    //});

    bimSurfer.load({
        bimserver: ADDRESS,
        username: USERNAME,
        password: PASSWORD,
        poid: 4587521,
        roid: 11534339,
        schema: "ifc2x3tc1" // < TODO: Deduce automatically
    })
        .then(function (model) {

            model.getTree().then(function (tree) {

                var domtree = new StaticTreeRenderer({
                    domNode: 'treeContainer',
                    tree: tree
                });

                domtree.build();

                domtree.on("click",
                    function (oid) {

                        // Clicking an explorer node fits the view to its object

                        bimSurfer.viewFit({
                            ids: [oid],
                            animate: true
                        });


                    });
            });
        });
});
