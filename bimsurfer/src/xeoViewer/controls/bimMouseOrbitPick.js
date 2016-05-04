define(function () {

    "use strict";

    /**
     Custom xeoEngine component that picks and orbits objects with the mouse.
     */
    XEO.BIMMouseOrbitPick = XEO.Component.extend({

        type: "XEO.BIMMouseOrbitPick",

        _init: function (cfg) {

            const INIT = 0;
            const PICKED = 1;
            const CLICKED = 2;
            const ORBITING = 3;
            const ROTATING = 4;

            var self = this;
            var camera = cfg.camera;
            var scene = this.scene;
            var input = scene.input;

            var state = INIT;
            var pickedHit = null;
            var pickTolerance = 2;
            var xDown;
            var yDown;
            var xMoved;
            var yMoved;
            var xDelta;
            var yDelta;
            var orbitSensitivity = 1.0;


            input.on("mousedown",
                function (canvasPos) {

                    if (!input.mouseDownLeft) {
                        return;
                    }

                    switch (state) {

                        case INIT:

                            xDown = canvasPos[0];
                            yDown = canvasPos[1];

                            pickedHit = scene.pick({
                                canvasPos: canvasPos,
                                rayPick: true
                            });

                            if (pickedHit) {
                                state = PICKED;

                            } else {
                                state = CLICKED;
                            }

                            break;
                    }
                });

            input.on("mousemove", function (canvasPos) {

                switch (state) {

                    case PICKED:

                        xMoved = canvasPos[0];
                        yMoved = canvasPos[1];

                        state = ORBITING;

                        return;

                    case CLICKED:

                        xMoved = canvasPos[0];
                        yMoved = canvasPos[1];

                        state = ROTATING;

                        return;

                    case ORBITING:

                        // Orbit the camera about the picked entity

                        xDelta = (canvasPos[0] - xMoved) * orbitSensitivity;
                        yDelta = (canvasPos[1] - yMoved) * orbitSensitivity;

                        if (xDelta !== 0) {
                            camera.view.rotateEyeY(-xDelta);
                        }

                        if (yDelta !== 0) {
                            camera.view.rotateEyeX(yDelta);
                        }

                        xMoved = canvasPos[0];
                        yMoved = canvasPos[1];

                        state = ORBITING;

                        break;

                    case ROTATING:

                        // Orbit the camera about its target point

                        xDelta = (canvasPos[0] - xMoved) * orbitSensitivity;
                        yDelta = (canvasPos[1] - yMoved) * orbitSensitivity;

                        if (xDelta !== 0) {
                            camera.view.rotateEyeY(-xDelta);
                        }

                        if (yDelta !== 0) {
                            camera.view.rotateEyeX(yDelta);
                        }

                        xMoved = canvasPos[0];
                        yMoved = canvasPos[1];

                        state = ROTATING;

                        break;
                }
            });

            input.on("mouseup",
                function (canvasPos) {

                    switch (state) {
                        case ORBITING:
                            
                            if (closeEnough(canvasPos)) {
                                // Click on entity, rotate, release very close to click
                                self.fire("pick", pickedHit);
                            }
                            state = INIT;
                            break;

                        case ROTATING:
                            if (closeEnough(canvasPos)) {
                                // Click on nothing, rotate, release very close to click
                                self.fire("nopick");
                            }
                            state = INIT;
                            break;

                        case PICKED:
                            // Click on entity, release
                            self.fire("pick", pickedHit);
                            state = INIT;
                            break;

                        case CLICKED:
                            // Click on nothing, release
                            self.fire("nopick");
                            state = INIT;
                            break;
                    }
                });

            function closeEnough(canvasPos) {
                return (xDown >= (canvasPos[0] - pickTolerance) &&
                xDown <= (canvasPos[0] + pickTolerance) &&
                yDown >= (canvasPos[1] - pickTolerance) &&
                yDown <= (canvasPos[1] + pickTolerance));
            }
        }
    });
});