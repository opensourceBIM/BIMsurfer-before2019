define(function () {

    "use strict";

    /**
     Custom xeoEngine component that rotates the camera using arrow keys.
     */
    XEO.BIMKeyboardRotateCamera = XEO.Component.extend({

        type: "XEO.BIMKeyboardRotateCamera",

        _init: function (cfg) {

            var input = this.scene.input;
            var camera = cfg.camera;
            var sensitivity = 0.5;

            this.scene.on("tick",
                function (params) {

                    if (!input.mouseover) {
                        return;
                    }

                    var elapsed = params.deltaTime;

                    var yawRate = sensitivity * 0.3;
                    var pitchRate = sensitivity * 0.3;

                    if (!input.ctrlDown && !input.altDown) {

                        var left = input.keyDown[input.KEY_LEFT_ARROW];
                        var right = input.keyDown[input.KEY_RIGHT_ARROW];
                        var up = input.keyDown[input.KEY_UP_ARROW];
                        var down = input.keyDown[input.KEY_DOWN_ARROW];

                        if (left || right || up || down) {

                            var yaw = 0;
                            var pitch = 0;

                            if (right) {
                                yaw = -elapsed * yawRate;

                            } else if (left) {
                                yaw = elapsed * yawRate;
                            }

                            if (down) {
                                pitch = elapsed * pitchRate;

                            } else if (up) {
                                pitch = -elapsed * pitchRate;
                            }

                            if (Math.abs(yaw) > Math.abs(pitch)) {
                                pitch = 0;
                            } else {
                                yaw = 0;
                            }

                            if (yaw !== 0) {
                                camera.view.rotateEyeY(yaw);
                            }

                            if (pitch !== 0) {
                                camera.view.rotateEyeX(pitch);
                            }
                        }
                    }
                });
        }
    });
});
