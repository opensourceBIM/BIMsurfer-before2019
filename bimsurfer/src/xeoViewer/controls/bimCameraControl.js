define([
    "bimsurfer/src/xeoViewer/controls/bimKeyboardAxisCamera.js",
    "bimsurfer/src/xeoViewer/controls/bimKeyboardPanCamera.js",
    "bimsurfer/src/xeoViewer/controls/bimKeyboardRotateCamera.js",
    "bimsurfer/src/xeoViewer/controls/bimKeyboardZoomCamera.js",
    "bimsurfer/src/xeoViewer/controls/bimMouseOrbitPick.js",
    "bimsurfer/src/xeoViewer/controls/bimMousePanCamera.js",
    "bimsurfer/src/xeoViewer/controls/bimMouseZoomCamera.js"
], function () {

    "use strict";

    /**
     * Custom xeo component that handles user camera input.
     */
    XEO.BIMCameraControl = XEO.Component.extend({

        type: "XEO.BIMCameraControl",

        _init: function (cfg) {

            if (!cfg.camera) {
                this.error("camera required");
                return;
            }

            var camera = cfg.camera;

            this.create(XEO.BIMKeyboardAxisCamera, {
                camera: camera
            });

            this.create(XEO.BIMKeyboardRotateCamera, {
                camera: camera
            });

            this.create(XEO.BIMKeyboardPanCamera, {
                camera: camera
            });

            this.create(XEO.BIMMousePanCamera, {
                camera: camera
            });

            this.create(XEO.BIMKeyboardZoomCamera, {
                camera: cfg.camera
            });

            this.create(XEO.BIMMouseZoomCamera, {
                camera: camera
            });

            var orbitPick = this.create(XEO.BIMMouseOrbitPick, {
                camera: camera,
                rayPick: true
            });

            orbitPick.on("pick",
                function (hit) {
                    this.fire("pick", hit);
                }, this);

            orbitPick.on("nopick",
                function (hit) {
                    this.fire("nopick", hit);
                }, this);
        }
    });

});
