define(["../../../lib/xeogl"], function () {

    "use strict";

    /**
     Custom xeoEngine component that shows a wireframe box representing an axis-aligned 3D boundary.
     */
    xeogl.BIMBoundaryHelper = xeogl.Entity.extend({

        type: "xeogl.BIMBoundaryHelper",

        _init: function (cfg) {

            this._super(xeogl._apply({

                geometry: this.create({ type:"xeogl.AABBGeometry" }), // http://xeoengine.org/docs/classes/AABBGeometry.html

                material: this.create({
                    type: "xeogl.PhongMaterial",
                    diffuse: [0, 0, 0],
                    ambient: [0, 0, 0],
                    specular: [0, 0, 0],
                    //emissive: [1.0, 1.0, 0.6], // Glowing
                    lineWidth: 2
                }),

                visibility: this.create({
                    type: "xeogl.Visibility",
                    visible: false // Initially invisible
                }),

                modes: this.create({
                    type: "xeogl.Modes",
                    collidable: false // This helper has no collision boundary of its own
                }),

                // Causes this entity to render after all other entities
                stage: this.create({
                    type: "xeogl.Stage",
                    priority: 3
                }),

                // Disables depth-testing so that this entity
                // appears to "float" over other entities
                depthBuf: this.create({
                    type: "xeogl.DepthBuf",
                    active: false
                })

            }, cfg));
        }
    });
});
