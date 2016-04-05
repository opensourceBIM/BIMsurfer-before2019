define(function () {

    /**
     A **XEO.BIMObject** represents a BIMSurfer object with a xeoEngine Scene.

     @class BIMObject
     @module XEO
     @submodule controls
     @constructor
     @param [scene] {Scene} Parent {{#crossLink "Scene"}}{{/crossLink}}.
     @param [cfg] {*} Configs
     @param [cfg.id] {String} Optional ID, unique among all components in the parent viewer, generated automatically when omitted.
     @param [cfg.meta] {String:Object} Optional map of user-defined metadata to attach to this KeyboardAxisCamera.
     @extends Component
     */
    XEO.BIMObject = XEO.Component.extend({

        /**
         JavaScript class name for this Component.

         @property type
         @type String
         @final
         */
        type: "XEO.BIMObject",

        _init: function (cfg) {

            // Modelling transform matrix
            this.transform = this.create(XEO.Transform, { // http://xeoengine.org/docs/classes/Matrix.html
                id: this.id + ".transform",
                matrix: cfg.matrix
            });

            // Controls visibility
            this.visibility = this.create(XEO.Visibility, { // http://xeoengine.org/docs/classes/Visibility.html
                id: this.id + ".visibility",
                visible: true
            });

            // Random color to start with - need to set color from type
            this.material = this.create(XEO.PhongMaterial, { // http://xeoengine.org/docs/classes/Material.html
                id: this.id + ".material",
                diffuse: [Math.random(), Math.random(), Math.random()],
                opacity: 1.0
            });

            // Controls rendering effects (eg transparency) for each Entity individually
            this.modes = this.create(XEO.Modes, { // http://xeoengine.org/docs/classes/Modes.html
                id: this.id + ".modes",
                transparent: false
            });

            // Create an Entity for each Geometry

            // TODO: If we can combine Geometries into one Entity, then we can just use a single Entity to represent an object

            this.entities = [];
            var entity;

            for (var i = 0, len = cfg.geometryIds.length; i < len; i++) {

                entity = this.create(XEO.Entity, { // http://xeoengine.org/docs/classes/Entity.html
                    id: this.id + ".entity." + i,
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

        _props: {

            worldBoundary: {
                get: function () {
                    return this.entities[0].worldBoundary
                }
            },

            viewBoundary: {
                get: function () {
                    return this.entities[0].viewBoundary
                }
            },

            canvasBoundary: {
                get: function () {
                    return this.entities[0].viewBoundary
                }
            }
        }
    });

});