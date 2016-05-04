define(function () {

    "use strict";

    /**
     Custom xeoEngine component that shows a wireframe box representing an axis-aligned 3D boundary.
     */
    XEO.BIMBoundaryHelper = XEO.Entity.extend({

        type: "XEO.BIMBoundaryHelper",

        _init: function (cfg) {

            this._super(XEO._apply({

                geometry: this.create(XEO.BoundaryGeometry), // http://xeoengine.org/docs/classes/BoundaryGeometry.html

                material: this.create(XEO.PhongMaterial, {
                    diffuse: [0, 0, 0],
                    ambient: [0, 0, 0],
                    specular: [0, 0, 0],
                    emissive: [1.0, 1.0, 0.6], // Glowing
                    lineWidth: 4
                }),

                visibility: this.create(XEO.Visibility, {
                    visible: false // Initially invisible
                }),

                modes: this.create(XEO.Modes, {
                    collidable: false // This helper has no collision boundary of its own
                })

            }, cfg));
        }
    });
});
