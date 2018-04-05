define(["./Utils", "../lib/xeogl/xeogl"], function (Utils) {

    "use strict";

    /**
     Custom xeogl component that represents a BIMSurfer object within a xeogl scene.

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

        type: "xeogl.BIMObject",

        _init: function (cfg) {

            this._aabb = null; // Lazy-create
            this._aabbDirty = false;

            this.ifcType = cfg.ifcType || "DEFAULT";
            this.guid = (this.id.indexOf("#") !== -1) ? Utils.CompressGuid(this.id.split("#")[1].substr(8, 36).replace(/-/g, "")) : null;
            this.model = cfg.model;
            this.transform = new xeogl.Transform(this, {
                matrix: cfg.matrix
            });
            this.entities = [];
        },

        addEntity: function (entity) {
          //  entity.transform = this.transform; // FIXME
            this.entities.push(entity);
            this._aabbDirty = true;
        },

        _update: function () {
            if (this._aabbDirty) {
                if (!this._aabb) {
                    this._aabb = xeogl.math.AABB3();
                    this._aabbDirty = true;
                    for (var i = 0, len = this.entities.length; i < len; i++) {
                        this.entities[i].on("boundary", function () {
                            this._aabbDirty = true;
                        }, this);
                    }
                }
                xeogl.math.collapseAABB3(this._aabb);
                for (var i = 0, len = this.entities.length; i < len; i++) {
                    xeogl.math.expandAABB3(this._aabb, this.entities[i].aabb);
                }
                if (!this._center) {
                    this._center = new Float32Array(3);
                }
                xeogl.math.getAABB3Center(this._aabb, this._center);
                this._aabbDirty = false;
            }
        },

        _props: {

            opacity: {  //  0 is fully transparent, 1 is fully opaque
                set: function (opacity) {
                    var entity;
                    var colorize;
                    for (var i = 0, len = this.entities.length; i < len; i++) {
                        entity = this.entities[i];
                        colorize = entity.colorize;
                        colorize[3] = opacity;
                        entity.colorize = colorize;
                    }
                },
                get: function () {
                    return this.entities[0].colorize[3];
                }
            },

            color: {
                set: function (color) { // RGB or RGBA
                    var entity;
                    var colorize;
                    for (var i = 0, len = this.entities.length; i < len; i++) {
                        entity = this.entities[i];
                        colorize = entity.colorize;
                        colorize[0] = color[0];
                        colorize[1] = color[1];
                        colorize[2] = color[2];
                        if (color.length === 4) {
                            colorize[3] = color[3];
                        }
                        entity.colorize = colorize;
                    }
                },
                get: function () { // RGB
                    return this.entities[0].colorize.slice(0, 3);
                }
            },

            culled: {
                set: function (culled) {
                    return this.entities[0].culled = culled;
                },
                get: function () {
                    return this.entities[0].culled
                }
            },

            visible: {
                set: function (visible) {
                    return this.entities[0].visible = visible;
                },
                get: function () {
                    return this.entities[0].visible
                }
            },

            ghosted: {
                set: function (ghosted) {
                    for (var i = 0, len = this.entities.length; i < len; i++) {
                        this.entities[i].ghosted = ghosted;
                    }
                },
                get: function () {
                    return this.entities[0].ghosted;
                }
            },

            highlighted: {
                set: function (highlighted) {
                    for (var i = 0, len = this.entities.length; i < len; i++) {
                        this.entities[i].highlighted = highlighted;
                    }
                },
                get: function () {
                    return this.entities[0].highlighted;
                }
            },

            selected: {
                set: function (selected) {
                    for (var i = 0, len = this.entities.length; i < len; i++) {
                        this.entities[i].selected = selected;
                    }
                },
                get: function () {
                    return this.entities[0].selected;
                }
            },

            aabb: {
                get: function () {
                    if (this._aabbDirty) {
                        this._update();
                    }
                    return this._aabb;
                }
            }
        }
    });
});
