define(["../../../lib/xeogl"], function () {

    "use strict";

    /**
     Custom xeoEngine component that represents a BIMSurfer object within a xeoEngine scene.

     An object consists of a set of xeogl.Entity's that share components between them.

     The components control functionality for the Entity's as a group, while the Entity's
     themselves each have their own xeogl.Geometry.

     This way, we are able to have BIM objects containing multiple geometries.

     @class BIMObject
     @module XEO
     @constructor
     @param [scene] {Scene} Parent {{#crossLink "Scene"}}{{/crossLink}}.
     @param [cfg] {*} Configs
     @param [cfg.id] {String} Optional ID, unique among all components in the parent scene, generated automatically when omitted.
     @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this xeogl.BIMObject.
     @extends Component
     */
    xeogl.BIMObject = xeogl.Component.extend({

        /**
         JavaScript class name for this xeogl.BIMObject.

         @property type
         @type String
         @final
         */
        type: "xeogl.BIMObject",

        // Constructor

        _init: function (cfg) {

            // Model this object belongs to, will be null when no model
            this.model = cfg.model; // xeogl.BIMModel

            // Modelling transform component
            this.transform = this.create({
                type: "xeogl.Transform",// http://xeoengine.org/docs/classes/Transform.html
                matrix: cfg.matrix
            });

            // Visibility control component.
            this.visibility = this.create({
                type: "xeogl.Visibility", // http://xeoengine.org/docs/classes/Visibility.html
                visible: true
            });

            // Material component
            this.material = this.create({
                type: "xeogl.PhongMaterial", // http://xeoengine.org/docs/classes/Material.html
                emissive: [0, 0, 0],
                diffuse: [Math.random(), Math.random(), Math.random()], // Random color until we set for type
                opacity: 1.0
            });

            // Rendering modes component
            this.modes = this.create({
                type: "xeogl.Modes", // http://xeoengine.org/docs/classes/Modes.html
                transparent: false,
                backfaces: false
            });

            // When highlighting, causes this object to render after non-highlighted objects
            this.stage = this.create({
                type: "xeogl.Stage",
                priority: 0
            });

            // When highlighting, we use this component to disable depth-testing so that this object
            // appears to "float" over non-highlighted objects
            this.depthBuf = this.create({
                type: "xeogl.DepthBuf",
                active: true
            });

            // Create a xeogl.Entity for each xeogl.Geometry
            // Each xeogl.Entity shares the components defined above

            // TODO: If all geometries are of same primitive, then we can combine them

            this.entities = [];
            var entity;

            for (var i = 0, len = cfg.geometryIds.length; i < len; i++) {

                entity = this.create({ // http://xeoengine.org/docs/classes/Entity.html
                    type: "xeogl.Entity",
                    meta: {
                        objectId: this.id
                    },
                    geometry: "geometry." + cfg.geometryIds[i],
                    transform: this.transform,
                    visibility: this.visibility,
                    material: this.material,
                    modes: this.modes,
                    stage: this.stage,
                    depthBuf: this.depthBuf
                });

                this.entities.push(entity);
            }
        },

        // Define read-only properties of xeogl.BIMObject

        _props: {

            // World-space bounding volume
            worldBoundary: {
                get: function () {
                    return this.entities[0].worldBoundary
                }
            },

            // View-space bounding volume
            viewBoundary: {
                get: function () {
                    return this.entities[0].viewBoundary
                }
            },

            // Canvas-space bounding volume
            canvasBoundary: {
                get: function () {
                    return this.entities[0].viewBoundary
                }
            },

            // Whether or not this object is highlighted
            highlighted: {
                set: function (highlight) {
                    this.depthBuf.active = !highlight;
                    this.stage.priority = highlight ? 2 : 0;
                    this.material.emissive = highlight ? [0.5, 0.5, 0.5] : [0, 0, 0];
                }
            }
        }
    });
});
