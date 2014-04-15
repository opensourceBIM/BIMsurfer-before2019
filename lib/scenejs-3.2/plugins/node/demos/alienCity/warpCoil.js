/**
 * A subatomic particle, spinning on a torus
 */
SceneJS.Types.addType("demos/alienCity/warpCoil", {

    /** Constructor
     *
     * @param params Attributes from JSON node instance
     */
    construct:function (params) {

        var ns = this.id;

        this.addNodes([

            // Power rings
            {
                type:"material",
                color:{ r:0.3, g:0.3, b:1.0 },
                emit:100.0,
                nodes:[
                    {
                        type:"translate",
                        y:120,
                        id:ns + "__powerRingTop",

                        nodes:[
                            {
                                type:"rotate", angle:90, x:1,
                                nodes:[
                                    {
                                        type:"prims/torus",
                                        radius:20,
                                        segmentsT:60,
                                        tube:3
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type:"translate",
                        y:20,
                        id:ns + "__powerRingBottom",

                        nodes:[
                            {
                                type:"rotate",
                                angle:90,
                                x:1,
                                nodes:[
                                    {
                                        type:"prims/torus",
                                        radius:20,
                                        segmentsT:60,
                                        tube:3
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },

            {
                type:"material",
                color:{ r:1.0, g:1.0, b:1.0 },
                nodes:[
                    {
                        type:"translate",
                        y:130,
                        nodes:[
                            // Cylinder primitive, implemented by plugin at
                            // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                            // Author: Moritz Kornher
                            {
                                type:"prims/cylinder",
                                radiusTop:15, // Default 20
                                radiusBottom:15, // Default 20
                                height:20, // Default 100
                                radialSegments:24, // Default 8
                                heightSegments:1, // Default 1
                                openEnded:false // Default false
                            }
                        ]
                    },
                    {
                        type:"translate",
                        y:20,
                        nodes:[
                            // Cylinder primitive, implemented by plugin at
                            // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                            // Author: Moritz Kornher
                            {
                                type:"prims/cylinder",
                                radiusTop:15, // Default 20
                                radiusBottom:15, // Default 20
                                height:20, // Default 100
                                radialSegments:24, // Default 8
                                heightSegments:1, // Default 1
                                openEnded:false // Default false
                            }
                        ]
                    }
                ]
            },


            // Caps
            {
                type:"material",
                color:{ r:0.6, g:0.6, b:0.7 },
                specularColor:{ r:0.6, g:1.0, b:0.0 },
                specular:1.0,
                shine:70.0,
                emit:0,
                alpha:1.0,
                nodes:[

                    // Top
                    {
                        type:"translate",
                        y:150,
                        nodes:[
                            // Cylinder primitive, implemented by plugin at
                            // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                            // Author: Moritz Kornher
                            {
                                type:"prims/cylinder",
                                radiusTop:30, // Default 20
                                radiusBottom:15, // Default 20
                                height:20, // Default 100
                                radialSegments:24, // Default 8
                                heightSegments:1, // Default 1
                                openEnded:false // Default false
                            }
                        ]
                    },

                    // Base
                    {
                        type:"translate",
                        y:0,
                        nodes:[
                            // Cylinder primitive, implemented by plugin at
                            // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                            // Author: Moritz Kornher
                            {
                                type:"prims/cylinder",
                                radiusTop:15, // Default 20
                                radiusBottom:30, // Default 20
                                height:20, // Default 100
                                radialSegments:24, // Default 8
                                heightSegments:1, // Default 1
                                openEnded:false // Default false
                            }
                        ]
                    }
                ]
            },

            // Glass
            {
                type:"material",
                color:{ r:1.0, g:0.0, b:0.0 },
                specular:100.0,
                shine:70.0,
                alpha:0.5,
                nodes:[
                    { type:"flags",
                        flags:{
                            transparent:true,
                            backfaces:false
                        },
                        nodes:[
                            {
                                type:"translate",
                                y:75,
                                nodes:[
                                    // Cylinder primitive, implemented by plugin at
                                    // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                                    // Author: Moritz Kornher
                                    {
                                        type:"prims/cylinder",
                                        radiusTop:15,
                                        radiusBottom:15,
                                        height:90,
                                        radialSegments:24,
                                        heightSegments:1,
                                        openEnded:true
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },

            // Inner concentrator manifolds
            {
                type:"material",
                color:{ r:0.6, g:0.6, b:0.7 },
                specularColor:{ r:0.6, g:1.0, b:0.0 },
                specular:1.0,
                shine:70.0,
                emit:0,
                alpha:1.0,
                nodes:[

                    // Top
                    {
                        type:"translate",
                        y:110,
                        nodes:[
                            // Cylinder primitive, implemented by plugin at
                            // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                            // Author: Moritz Kornher
                            {
                                type:"prims/cylinder",
                                radiusTop:15, // Default 20
                                radiusBottom:5, // Default 20
                                height:20, // Default 100
                                radialSegments:24, // Default 8
                                heightSegments:1, // Default 1
                                openEnded:false // Default false
                            }
                        ]
                    },

                    // Base
                    {
                        type:"translate",
                        y:40,
                        nodes:[
                            // Cylinder primitive, implemented by plugin at
                            // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                            // Author: Moritz Kornher
                            {
                                type:"prims/cylinder",
                                radiusTop:5, // Default 20
                                radiusBottom:15, // Default 20
                                height:20, // Default 100
                                radialSegments:24, // Default 8
                                heightSegments:1, // Default 1
                                openEnded:false // Default false
                            }
                        ]
                    }
                ]
            },

            // Charge couplers
            {
                type:"material",
                color:{ r:1.0, g:1.0, b:0.0 },
                specularColor:{ r:0.6, g:1.0, b:0.0 },
                specular:1.0,
                shine:70.0,
                emit:0,
                alpha:1.0,
                nodes:[

                    // Top
                    {
                        type:"translate",
                        y:70,
                        nodes:[
                            {
                                type:"style",
                                lineWidth:5,
                                nodes:[
                                    {
                                        type:"effects/wobble",
                                        nodes:[
                                            {
                                                type:"geometry",
                                                primitive:"lines",
                                                positions:[
                                                    0, 30, 0,
                                                    0, 20, 0,
                                                    0, 10, 0,
                                                    0, 0, 0,
                                                    0, -10, 0,
                                                    0, -20, 0,
                                                    0, -30, 0
                                                ],
                                                indices:[
                                                    0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

        ]);

        var self = this;

        this.getScene().getNode(ns + "__powerRingTop",
            function (topRing) {

                self.getScene().getNode(ns + "__powerRingBottom",
                    function (bottomRing) {

                        var rnd = Math.random() * 0.2;

                        var topPos = 130;
                        var topInc = -.1 - rnd;

                        var bottomPos = 15;
                        var bottomInc = .1 + rnd;

                        self._tick = self.getScene().on("tick",
                            function () {

                                topRing.setY(topPos);
                                bottomRing.setY(bottomPos);

                                topPos += topInc;
                                if (topPos > 130 || topPos < 15) {
                                    topInc *= -1;
                                }

                                bottomPos += bottomInc;
                                if (bottomPos > 130 || bottomPos < 15) {
                                    bottomInc *= -1;
                                }
                            });
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