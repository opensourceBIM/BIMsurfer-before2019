define(function () {

    "use strict";

    /**
     Custom xeoEngine component that switches a XEO.Camera between preset left, right, anterior,
     posterior, superior and inferior views using the keyboard.
     */
    XEO.BIMKeyboardAxisCamera = XEO.Component.extend({

        type: "XEO.BIMKeyboardAxisCamera",

        _init: function (cfg) {

            var scene = this.scene;
            var camera = cfg.camera;
            var input = scene.input;

            var flight = this.create(XEO.CameraFlight, {
                camera: camera,
                duration: 1.0 // One second to fly to each new target
            });

            input.on("keydown",
                function (keyCode) {

                    if (!input.mouseover) {
                        return;
                    }

                    var boundary = scene.worldBoundary;
                    var aabb = boundary.aabb;
                    var center = boundary.center;
                    var diag = XEO.math.getAABBDiag(aabb);
                    var stopFOV = 55;
                    var dist = Math.abs((diag) / Math.tan(stopFOV / 2));

                    switch (keyCode) {

                        case input.KEY_NUM_1: // Right view
                            flight.flyTo({
                                look: center,
                                eye: [center[0] - dist, center[1], center[2]],
                                up: [0, 1, 0]
                            });
                            break;

                        case input.KEY_NUM_2: // Back view
                            flight.flyTo({
                                look: center,
                                eye: [center[0], center[1], center[2] + dist],
                                up: [0, 1, 0]
                            });
                            break;

                        case input.KEY_NUM_3: // Left view
                            flight.flyTo({
                                look: center,
                                eye: [center[0] + dist, center[1], center[2]],
                                up: [0, 1, 0]
                            });
                            break;

                        case input.KEY_NUM_4: // Front view
                            flight.flyTo({
                                look: center,
                                eye: [center[0], center[1], center[2] - dist],
                                up: [0, 1, 0]
                            });
                            break;

                        case input.KEY_NUM_5: // Top view
                            flight.flyTo({
                                look: center,
                                eye: [center[0], center[1] - dist, center[2]],
                                up: [0, 0, -1]
                            });
                            break;

                        case input.KEY_NUM_6: // Bottom view
                            flight.flyTo({
                                look: center,
                                eye: [center[0], center[1] + dist, center[2]],
                                up: [0, 0, 1]
                            });
                            break;
                    }
                });
        }
    });
});
