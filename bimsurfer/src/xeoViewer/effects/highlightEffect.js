(function () {

    "use strict";

    XEO.HighlightEffect = XEO.Component.extend({

        type: "XEO.HighlightEffect",

        _init: function (cfg) {

            this._modes = this.create(XEO.Modes, {
                transparent: true,
                collidable: false // Has no collision boundary of its own
            });

            this._stage = this.create(XEO.Stage, {
                priority: 2
            });

            this._depthBuf = this.create(XEO.DepthBuf, {
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
                helper = this.create(XEO.Entity, {
                    geometry: entity.geometry,
                    transform: entity.transform,
                    material:    this.create(XEO.PhongMaterial, {
                        emissive: [1.0, 1.0, 0.0],
                        diffuse: [0,0,0],
                        ambient: [0,0,0],
                     //   diffuse: [1,1,0],
                        //ambient: entity.material.ambient,
                        opacity: 0.3
                    }),
                    modes: this._modes,
                    stage: this._stage,
                    depthBuf: this._depthBuf,
                    visibility: this.create(XEO.Visibility, {
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
})();