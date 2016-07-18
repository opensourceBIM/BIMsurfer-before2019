define(function () {

    "use strict";

    /**
     Custom xeoEngine component that represents a BIMSurfer object within a xeoEngine scene.

     An object consists of a set of XEO.Entity's that share components between them.

     The components control functionality for the Entity's as a group, while the Entity's
     themselves each have their own XEO.Geometry.

     This way, we are able to have BIM objects containing multiple geometries.

     @class BIMObject
     @module XEO
     @constructor
     @param [scene] {Scene} Parent {{#crossLink "Scene"}}{{/crossLink}}.
     @param [cfg] {*} Configs
     @param [cfg.id] {String} Optional ID, unique among all components in the parent scene, generated automatically when omitted.
     @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this XEO.BIMObject.
     @extends Component
     */
    XEO.BIMObject = XEO.Component.extend({

        /**
         JavaScript class name for this XEO.BIMObject.

         @property type
         @type String
         @final
         */
        type: "XEO.BIMObject",

        // Constructor

        _init: function (cfg) {

            // Model this object belongs to, will be null when no model
            this.model = cfg.model; // XEO.BIMModel

            // Modelling transform component
            this.transform = this.create(XEO.Transform, { // http://xeoengine.org/docs/classes/Matrix.html
                matrix: cfg.matrix
            });

            // Visibility control component.
            this.visibility = this.create(XEO.Visibility, { // http://xeoengine.org/docs/classes/Visibility.html
                visible: true
            });

            // Material component
            this.material = this.create(XEO.PhongMaterial, { // http://xeoengine.org/docs/classes/Material.html
                diffuse: [Math.random(), Math.random(), Math.random()], // Random color until we set for type
                opacity: 1.0
            });

            // Rendering modes component
            this.modes = this.create(XEO.Modes, { // http://xeoengine.org/docs/classes/Modes.html
                transparent: false,
                backfaces: false
            });

            // Create a XEO.Entity for each XEO.Geometry
            // Each XEO.Entity shares the components defined above

            // TODO: If all geometries are of same primitive, then we can combine them

            this.entities = [];
            var entity;

            for (var i = 0, len = cfg.geometryIds.length; i < len; i++) {

                entity = this.create(XEO.Entity, { // http://xeoengine.org/docs/classes/Entity.html
                    meta: {
                        objectId: this.id
                    },
                    geometry: "geometry." + cfg.geometryIds[i],
                    transform: this.transform,
                    visibility: this.visibility,
                    material: this.material,
                    modes: this.modes
                });

                this.entities.push(entity);
            }
        },

        // Define read-only properties of XEO.BIMObject

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
            }
        }
    });
});
