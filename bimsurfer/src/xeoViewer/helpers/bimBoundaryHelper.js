define(["../../../lib/xeogl"], function () {

    "use strict";

    /**
     Custom xeoEngine component that shows a wireframe box representing an non axis-aligned 3D boundary.
     */
    var BIMBoundaryHelperEntity = xeogl.Entity.extend({

        type: "xeogl.BIMBoundaryHelperEntity",

        _init: function (cfg) {
        
            var g = this.create({
                type: "xeogl.OBBGeometry"
            });
            
            var m = this.create({
                type: "xeogl.PhongMaterial",
                diffuse: [0.5, 0.5, 0.5],
                ambient: [0, 0, 0],
                specular: [0, 0, 0],
                lineWidth: 2,
            });
            
            var v = this.create({
                type: "xeogl.Visibility",
                visible: false // Initially invisible
            });
            
            var md = this.create({
                type: "xeogl.Modes",
                collidable: false // This helper has no collision boundary of its own
            });
            
            // Causes this entity to render after all other entities
            var st = this.create({
                type: "xeogl.Stage",
                priority: 3
            });
            
            // Disables depth-testing so that this entity
            // appears to "float" over other entities
            var db = this.create({
                type: "xeogl.DepthBuf",
                active: false
            });
            
            this._super(xeogl._apply({
                geometry: g,
                material: m,
                visibility: v,
                modes: md,                
                stage: st,
                depthBuf: db
            }, cfg));
            
        }
    });
    
    xeogl.BIMBoundaryHelper = function(cfg) {
        
        var self = this;
        
        self.entities = {};
        
        self.setSelected = function(ids) {
            
            var old_ids = Object.keys(self.entities);
            
            ids.forEach(function(id) {
                if (!self.entities[id]) {
                    var h = self.entities[id] = new BIMBoundaryHelperEntity(cfg.scene);
                    h.geometry.boundary = cfg.viewer.getObject(id).worldBoundary;
                    h.visibility.visible = true;
                }
                
                var old_idx = old_ids.indexOf(id);
                if (old_idx !== -1) {
                    old_ids.splice(old_idx, 1);
                }
            });
            
            old_ids.forEach(function(id) {
                // TODO: Don't destroy, but toggle visibility to save resources,
                // then the variables above (`db`, `st`, ...) can also be shared.
                self.entities[id].destroy();
                delete self.entities[id];
            });
        };
    
    };
    
});
