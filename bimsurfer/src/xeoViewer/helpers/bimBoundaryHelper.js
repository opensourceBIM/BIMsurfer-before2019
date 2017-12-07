import 'xeogl';

    /**
     Custom xeoEngine component that shows a wireframe box representing an non axis-aligned 3D boundary.
     */
    var BIMBoundaryHelperEntity = xeogl.Entity.extend({

        type: "xeogl.BIMBoundaryHelperEntity",

        _init: function (cfg) {
        
            var obbGeometry = this.create({
                type: "xeogl.OBBGeometry"
            });
            
            var phongMaterial = this.create({
                type: "xeogl.PhongMaterial",
                diffuse: cfg.color || [0.5, 0.5, 0.5],
                ambient: [0, 0, 0],
                specular: [0, 0, 0],
                lineWidth: 2,
            });
            
            var nonCollidableMode = this.create({
                type: "xeogl.Modes",
                collidable: false // This helper has no collision boundary of its own
            });
            
            // Causes this entity to render after all other entities
            var stagePriorityThree = this.create({
                type: "xeogl.Stage",
                priority: 3
            });
            
            var visible = this.create({
                type: "xeogl.Visibility",
                visible: true
            });
            
            // Disables depth-testing so that this entity
            // appears to "float" over other entities
            var depthBufInactive = this.create({
                type: "xeogl.DepthBuf",
                active: false
            });
            
            this._super(xeogl._apply({
                geometry: obbGeometry,
                material: phongMaterial,
                modes: nonCollidableMode,                
                stage: stagePriorityThree,
                depthBuf: depthBufInactive,
                visibility: visible
            }, cfg));
            
        }
    });
    
    xeogl.BIMBoundaryHelper = function(scene, viewer, cfg) {
        
        var self = this;
        
        self._entities = {};
        self._pool = [];
        
        self.setSelected = function(ids) {
            
            var oldIds = Object.keys(self._entities);
            
            ids.forEach(function(id) {
                if (!self._entities[id]) {
                    var h;
                    if (self._pool.length > 0) {
                        h = self._entities[id] = self._pool.shift();
                        h.visibility.visible = true;
                    } else {
                        h = self._entities[id] = new BIMBoundaryHelperEntity(scene, cfg);
                    }
                    h.geometry.boundary = viewer.getObject(id).worldBoundary;
                }
                
                var oldIdx = oldIds.indexOf(id);
                if (oldIdx !== -1) {
                    oldIds.splice(oldIdx, 1);
                }
            });
            
            oldIds.forEach(function(id) {
                var h = self._entities[id];
                h.visibility.visible = false;
                self._pool.push(h);
                delete self._entities[id];
            });
        };
    
    };
