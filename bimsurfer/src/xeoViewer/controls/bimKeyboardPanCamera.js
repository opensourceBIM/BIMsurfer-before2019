define(function () {

    "use strict";

    /**
     Custom xeoEngine component that pans the camera using the W,S,A,D, X and Z keys.
     */
    XEO.BIMKeyboardPanCamera = XEO.Component.extend({

        type: "XEO.BIMKeyboardPanCamera",

        _init: function (cfg) {

            var camera = cfg.camera;
            var input = this.scene.input;
            var sensitivity = 0.5;

            this.scene.on("tick",
                function (params) {

                    if (!input.mouseover) {
                        return;
                    }

                    var elapsed = params.deltaTime;

                    if (!input.ctrlDown && !input.altDown) {

                        var wkey = input.keyDown[input.KEY_W];
                        var skey = input.keyDown[input.KEY_S];
                        var akey = input.keyDown[input.KEY_A];
                        var dkey = input.keyDown[input.KEY_D];
                        var zkey = input.keyDown[input.KEY_Z];
                        var xkey = input.keyDown[input.KEY_X];

                        if (wkey || skey || akey || dkey || xkey || zkey) {

                            var x = 0;
                            var y = 0;
                            var z = 0;

                            var sensitivity = sensitivity * 0.01;

                            if (skey) {
                                y = elapsed * sensitivity;

                            } else if (wkey) {
                                y = -elapsed * sensitivity;
                            }

                            if (dkey) {
                                x = elapsed * sensitivity;

                            } else if (akey) {
                                x = -elapsed * sensitivity;
                            }

                            if (xkey) {
                                z = elapsed * sensitivity;

                            } else if (zkey) {
                                z = -elapsed * sensitivity;
                            }

                            camera.view.pan([x, y, z]);
                        }
                    }
                });
        }
    });
});
