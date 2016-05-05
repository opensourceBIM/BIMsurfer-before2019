define(function () {

    "use strict";

    /**
     * Custom xeo component for defining an orthographic projection with near, far and scale properties.
     */
    XEO.BIMOrtho = XEO.Projection.extend({

        type: "XEO.BIMOrtho",

        _init: function (cfg) {

            this._super(cfg);

            this.scale = cfg.scale;
            this.near = cfg.near;
            this.far = cfg.far;

            this._onCanvasBoundary = this.scene.canvas.on("boundary", this._scheduleUpdate, this);
        },

        _props: {

            scale: {
                set: function (value) {
                    this._scale = (value !== undefined && value !== null) ? value : 1.0;
                    this._scheduleUpdate();
                },

                get: function () {
                    return this._scale;
                }
            },

            near: {
                set: function (value) {
                    this._near = (value !== undefined && value !== null) ? value : 0.01;
                    this._scheduleUpdate();
                },

                get: function () {
                    return this._near;
                }
            },

            far: {
                set: function (value) {
                    this._far = (value !== undefined && value !== null) ? value : 10000.0;
                    this._scheduleUpdate();
                },

                get: function () {
                    return this._far;
                }
            }
        },

        _update: function () {
            
            var scene = this.scene;
            var scale = this._scale;
            var canvas = scene.canvas.canvas;
            var canvasWidth = canvas.clientWidth;
            var canvasHeight = canvas.clientHeight;
            var halfSize = 0.5 * scale;
            var aspect = canvasWidth / canvasHeight;

            var left;
            var right;
            var top;
            var bottom;

            if (canvasWidth > canvasHeight) {
                left = -halfSize;
                right = halfSize;
                top = halfSize / aspect;
                bottom = -halfSize / aspect;

            } else {
                left = -halfSize * aspect;
                right = halfSize * aspect;
                top = halfSize;
                bottom = -halfSize;
            }

            this.matrix = XEO.math.orthoMat4c(left, right, bottom, top, this._near, this._far, this.__tempMat || (this.__tempMat = XEO.math.mat4()));
        },

        _destroy: function () {
            this._super();
            this.scene.canvas.off(this._onCanvasBoundary);
        }
    });
});
