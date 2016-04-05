define(["bimserverapi_BimServerApi", "bimsurfer/src/Notifier.js", "bimsurfer/src/BimServerModel.js", "bimsurfer/src/PreloadQuery.js", "bimsurfer/src/BimServerGeometryLoader.js", "bimsurfer/src/xeoViewer.js"], function (BimServerApi, Notifier, Model, PreloadQuery, GeometryLoader, xeoViewer) {

    function BimSurfer(cfg) {

        var self = this;

        cfg = cfg || {};

        this._viewer = new xeoViewer({
            domNode: cfg.domNode
        });

        /**
         * Loads content into this BIMSurfer.
         * @param params
         */
        this.load = function (params) {

            if (params.test) {
                this._viewer.loadRandom();
                return null;

            } else if (params.bimserver) {
                return this._loadFromServer(params);

            } else if (params.api) {
                return this._loadFromAPI(params);

            } else if (params.gltf) {
                this._loadFrom_glTF(params);
            }
        };

        this._loadFromServer = function (params) {

            var self = this;
            var notifier = new Notifier();
            var bimServerApi = new BimServerApi(ADDRESS, notifier);

            return new Promise(function (resolve, reject) {

                bimServerApi.init(function () {

                    bimServerApi.login(params.username, params.password, function () {

                        params.api = bimServerApi; // TODO: Make copy of params

                        self._loadFromAPI(params).then(function (m) {
                            resolve(m);
                        });

                    }, function () {
                        reject(arguments);
                    });
                });
            });
        };

        this._loadFrom_glTF = function (params) {
            if (params.src) {
                this._viewer.loadglTF(params.src);
            }
        };

        this._loadFromAPI = function (params) {

            return new Promise(function (resolve, reject) {

                params.api.getModel(params.poid, params.roid, params.schema, false,
                    function (model) {

                        // TODO: Preload not necessary combined with the bruteforce tree
                        var fired = false;

                        model.query(PreloadQuery,
                            function () {
                                if (!fired) {
                                    fired = true;
                                    var vmodel = new Model(params.api, model);

                                    self._loadModel(vmodel);

                                    resolve(vmodel);
                                }
                            });
                    });
            });
        };

        this._loadModel = function (model) {

            model.getTree().then(function (tree) {

                var oids = [];

                var visit = function (n) {
                    oids.push(n.id);
                    for (var i = 0; i < (n.children || []).length; ++i) {
                        visit(n.children[i]);
                    }
                };

                visit(tree);

                var models = {};

                // TODO: Ugh. Undecorate some of the newly created classes
                models[model.model.roid] = model.model;

                var loader = new GeometryLoader(model.api, models, self._viewer);

                loader.addProgressListener(function (progress, nrObjectsRead, totalNrObjects) {
                    console.log("Loading... (" + nrObjectsRead + "/" + totalNrObjects + ")");
                });

                loader.setLoadOids([model.model.roid], oids);

                self._viewer.scene.on("tick", function () { // TODO: Fire "tick" event from xeoViewer
                    loader.process();
                });

                loader.start();
            });
        };

        /**
         * Shows/hides objects specified by id or entity type, e.g IfcWall.
         *
         * When recursive is set to true, hides children (aggregates, spatial structures etc) or
         * subtypes (IfcWallStandardCase ⊆ IfcWall).
         *
         * @param params
         */
        this.setVisibility = function (params) {
            this._viewer.setVisibility(params);
        };

        /**
         * Selects/deselects objects specified by id.
         **
         * @param params
         */
        this.setSelectionState = function (params) {
            return this._viewer.setSelectionState(params);
        };

        /**
         * Gets a list of selected elements.
         */
        this.getSelected = function () {
            return this._viewer.getSelected();
        };

        /**
         * Sets color of objects specified by ids.
         **
         * @param params
         */
        this.setColor = function (params) {
            this._viewer.setColor(params);
        };

        /**
         * Fits the elements into view.
         *
         * Fits the entire model into view if ids is an empty array, null or undefined.
         * Animate allows to specify a transition period in milliseconds in which the view is altered.
         *
         * @param params
         */
        this.viewFit = function (params) {
            this._viewer.viewFit(params);
        };

        /**
         *
         */
        this.getCamera = function () {
            return this._viewer.getCamera();
        };

        /**
         *
         * @param params
         */
        this.setCamera = function (params) {
            this._viewer.setCamera(params);
        };

        /**
         *
         * @param params
         */
        this.reset = function (params) {
            this._viewer.reset(params);
        }
    }

    return BimSurfer;

});