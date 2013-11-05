/**
 * A subatomic particle, spinning on a torus
 */
SceneJS.Types.addType("demos/alienCity/particle", {

    /** Constructor
     *
     * @param params Attributes from JSON node instance
     */
    construct:function (params) {

        var self = this;

        this.addNode({
                type:"rotate",
                z:1,
                angle:0,
                nodes:[
                    {
                        type:"material",
                        color:{ r:0.8, g:0.8, b:0.9 },
                        nodes:[
                            {
                                type:"prims/torus",
                                radius:params.orbitRadius || 20,
                                segmentsT:60,
                                tube:0.5
                            }
                        ]
                    }                ,
                    {
                        type:"translate",
                        y:params.orbitRadius || 20,
                        nodes:[
                            {
                                type:"material",
                                color:params.particleColor || { r:1.0, g:0.4, b:0.4 },

                                nodes:[

                                    // Cylinder primitive, implemented by plugin at
                                    // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                                    // Author: Moritz Kornher
                                    {
                                        type:"prims/sphere",
                                        radius:params.particleSize || 4
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },

            function (rotate) {

                // Process node attributes
                var spinRate = (undefined != params.spinRate) ? params.spinRate : 1.0;

                // Spin the teapot within the scene animation loop
                var angle = 0;

                self._tick = self.getScene().on("tick",
                    function () {
                        angle += spinRate;
                        if (angle < 0) {
                            angle = 360.0;
                        } else if (angle > 360) {
                            angle = 0;
                        }
                        rotate.setAngle(angle);
                    });
            });


    },

    /**
     * Node destructor, unsubscribes from scene tick
     */
    destroy:function () {
        this.getScene().off(this._tick);
    }
});
