define(["../../../lib/xeogl"], function () {

    "use strict";

    xeogl.HighlightEffect = xeogl.Component.extend({

        type: "xeogl.HighlightEffect",

        _init: function (cfg) {

            this._modes = this.create({
                type: "xeogl.Modes",
                transparent: true,
                collidable: false // Has no collision boundary of its own
            });

            this._stage = this.create({
                type: "xeogl.Stage",
                priority: 2
            });

            this._depthBuf = this.create({
                type: "xeogl.DepthBuf",
                active: false
            });

            this._helpers = {};
            this._freeHelpers = [];
        },

        add: function (bimObject) {
            var entities = bimObject.entities;
            var entity;
            for (var i = 0, len = entities.length; i < len; i++) {
                entity = entities[i];
                this._createHelper(entity);
            }
        },

        _createHelper: function (entity) {
            var helper = this._freeHelpers.pop();
            if (!helper) {
                helper = this.create({
                    type: "xeogl.Entity",
                    geometry: entity.geometry,
                    transform: entity.transform,
                    material:    this.create({
                        type: "xeogl.PhongMaterial",
                        emissive: [0.2, 0.9, 0.2],
                        specular: [0, 0, 0],
                        diffuse:  [0, 0, 0],
                        ambient:  [0, 0, 0],
                        opacity:  0.25
                    }),
                    modes: this._modes,
                    stage: this._stage,
                    depthBuf: this._depthBuf,
                    visibility: this.create({
                        type: "xeogl.Visibility",
                        visible: true
                    }),
                    meta: {
                        entityId: entity.id
                    }
                });
            } else {
                helper.geometry = entity.geometry;
                helper.material.diffuse = entity.material.diffuse;
                helper.material.ambient = entity.material.ambient;
                helper.transform = entity.transform;
                helper.visibility.visible = true;
                helper.meta.entityId = entity.id;
            }
            this._helpers[entity.id] = helper;
        },

        clear: function () {
            var helper;
            for (var id in this._helpers) {
                if (this._helpers.hasOwnProperty(id)) {
                    helper = this._helpers[id];
                    this._destroyHelper(helper);
                }
            }
        },

        remove: function (bimObject) {
            var entities = bimObject.entities;
            var entity;
            for (var i = 0, len = entities.length; i < len; i++) {
                entity = entities[i];
                var helper = this._helpers[entity.id];
                if (helper) {
                    this._destroyHelper(helper);
                }
            }
        },

        _destroyHelper: function (helper) {
            helper.visibility.visible = false;
            this._freeHelpers.push(helper);
            delete this._helpers[helper.meta.entityId];
        }

    });
});
