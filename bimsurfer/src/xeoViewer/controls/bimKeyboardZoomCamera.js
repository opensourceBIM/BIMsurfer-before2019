define(function () {

    "use strict";

    /**
     Custom xeoEngine component that zooms the camera using + and - keys.
     */
    XEO.BIMKeyboardZoomCamera = XEO.Component.extend({

        type: "XEO.BIMKeyboardZoomCamera",

        _init: function (cfg) {

            var input = this.scene.input;
            var camera = cfg.camera;
            var sensitivity = 0.05;

            this.scene.on("tick",
                function (params) {

                    if (!input.mouseover) {
                        return;
                    }

                    var elapsed = params.deltaTime;

                    if (!input.ctrlDown && !input.altDown) {

                        var wkey = input.keyDown[input.KEY_ADD];
                        var skey = input.keyDown[input.KEY_SUBTRACT];

                        if (wkey || skey) {

                            var z = 0;

                            if (skey) {
                                z = elapsed * sensitivity;

                            } else if (wkey) {
                                z = -elapsed * sensitivity;
                            }

                            camera.view.zoom(z);
                        }
                    }
                });
        }
    });
});
