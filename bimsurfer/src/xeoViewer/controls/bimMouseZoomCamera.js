define(function () {

    "use strict";

    /**
     Custom xeoEngine component that zooms the camera with the mouse.
     */
    XEO.BIMMouseZoomCamera = XEO.Component.extend({

        type: "XEO.BIMMouseZoomCamera",

        _init: function (cfg) {

            var camera = cfg.camera;
            var sensitivity = 0.5;
            var delta = 0;
            var target = 0;
            var newTarget = false;
            var targeting = false;
            var progress = 0;
            var eyeVec = XEO.math.vec3();
            var lookVec = XEO.math.vec3();
            var tempVec3 = XEO.math.vec3();

            this.scene.input.on("mousewheel",
                function (_delta) {

                    delta = _delta;

                    if (delta === 0) {
                        targeting = false;
                        newTarget = false;
                    } else {
                        newTarget = true;
                    }
                });

            this.scene.on("tick",
                function () {

                    var view = camera.view;

                    var eye = view.eye;
                    var look = view.look;

                    eyeVec[0] = eye[0];
                    eyeVec[1] = eye[1];
                    eyeVec[2] = eye[2];

                    lookVec[0] = look[0];
                    lookVec[1] = look[1];
                    lookVec[2] = look[2];

                    XEO.math.subVec3(eyeVec, lookVec, tempVec3);

                    var lenLook = Math.abs(XEO.math.lenVec3(tempVec3));
                    var lenLimits = 1000;
                    var f = sensitivity * (2.0 + (lenLook / lenLimits));

                    if (newTarget) {
                        target = delta * f;
                        progress = 0;
                        newTarget = false;
                        targeting = true;
                    }

                    if (targeting) {

                        if (delta > 0) {

                            progress += 0.2 * f;

                            if (progress > target) {
                                targeting = false;
                            }

                        } else if (delta < 0) {

                            progress -= 0.2 * f;

                            if (progress < target) {
                                targeting = false;
                            }
                        }

                        if (targeting) {
                            view.zoom(progress);
                        }
                    }
                });
        }
    });
});
