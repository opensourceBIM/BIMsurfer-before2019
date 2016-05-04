define(function () {

    "use strict";

    /**
     Custom xeoEngine component that pans the camera with the mouse.
     */
    XEO.BIMMousePanCamera = XEO.Component.extend({

        type: "XEO.BIMMousePanCamera",

        _init: function (cfg) {

            var camera = cfg.camera;
            var scene = this.scene;
            var input = scene.input;
            var sensitivity = 0.03;
            var lastX;
            var lastY;
            var xDelta = 0;
            var yDelta = 0;
            var down = false;

            this.scene.on("tick",
                function () {
                    if (xDelta !== 0 || yDelta !== 0) {
                        camera.view.pan([xDelta, yDelta, 0]);
                        xDelta = 0;
                        yDelta = 0;
                    }
                });

            input.on("mousedown",
                function (e) {
                    if ((input.mouseDownLeft && input.mouseDownRight) ||
                        (input.mouseDownLeft && input.keyDown[input.KEY_SHIFT]) ||
                        input.mouseDownMiddle) {
                        lastX = e[0];
                        lastY = e[1];
                        down = true;
                    } else {
                        down = false;
                    }
                });

            input.on("mouseup",
                function () {
                    down = false;
                });

            input.on("mouseout",
                function () {
                    down = false;
                });

            input.on("mousemove",
                function (e) {
                    if (down) {
                        xDelta += (e[0] - lastX) * sensitivity;
                        yDelta += (e[1] - lastY) * sensitivity;
                        lastX = e[0];
                        lastY = e[1];
                    }
                });
        }
    });
});
