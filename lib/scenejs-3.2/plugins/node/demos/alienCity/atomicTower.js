/**
 * An atom
 */
SceneJS.Types.addType("demos/alienCity/atomicTower", {

    /** Constructor
     *
     * @param params Attributes from JSON node instance
     */
    construct:function (params) {
        this.addNode( {
            type:"translate",
            x:0,
            y:0,
            nodes:[
                {
                    type:"translate",
                    y:155,
                    nodes:[
                        {
                            type:"demos/alienCity/atom"
                        }
                    ]
                },
                {
                    type:"translate",
                    y:50,
                    nodes:[
                        {
                            type:"material",
                            color:{ r:0.4, g:0.4, b:0.4 },
                            specular:0,
                            nodes:[

                                // Cylinder primitive, implemented by plugin at
                                // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                                // Author: Moritz Kornher
                                {
                                    type:"prims/cylinder",
                                    radiusTop:10, // Default 20
                                    radiusBottom:10, // Default 20
                                    height:100, // Default 100
                                    radialSegments:24, // Default 8
                                    heightSegments:1, // Default 1
                                    openEnded:false // Default false
                                }
                            ]
                        }
                    ]
                },
                {
                    type:"translate",
                    y:80,
                    nodes:[
                        {
                            type:"material",
                            color:{ r:0.4, g:0.4, b:0.4 },
                            specular:0,
                            nodes:[

                                // Cylinder primitive, implemented by plugin at
                                // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                                // Author: Moritz Kornher
                                {
                                    type:"prims/cylinder",
                                    radiusTop:10, // Default 20
                                    radiusBottom:10, // Default 20
                                    height:100, // Default 100
                                    radialSegments:24, // Default 8
                                    heightSegments:1, // Default 1
                                    openEnded:false // Default false
                                }
                            ]
                        }
                    ]
                },
                {
                    type:"translate",
                    y:131,
                    nodes:[
                        {
                            type:"material",
                            color:{ r:0.4, g:0.4, b:1.0 },
                            nodes:[

                                // Cylinder primitive, implemented by plugin at
                                // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                                // Author: Moritz Kornher
                                {
                                    type:"prims/cylinder",
                                    radiusTop:30, // Default 20
                                    radiusBottom:20, // Default 20
                                    height:8, // Default 100
                                    radialSegments:24, // Default 8
                                    heightSegments:1, // Default 1
                                    openEnded:false // Default false
                                }
                            ]
                        }
                    ]
                },
                {
                    type:"translate",
                    y:110,
                    nodes:[
                        {
                            type:"material",
                            color:{ r:0.4, g:0.4, b:1.0 },
                            nodes:[

                                // Cylinder primitive, implemented by plugin at
                                // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                                // Author: Moritz Kornher
                                {
                                    type:"prims/cylinder",
                                    radiusTop:15, // Default 20
                                    radiusBottom:15, // Default 20
                                    height:4, // Default 100
                                    radialSegments:24, // Default 8
                                    heightSegments:1, // Default 1
                                    openEnded:false // Default false
                                }
                            ]
                        }
                    ]
                },

                {
                    type:"translate",
                    y:100,
                    nodes:[
                        {
                            type:"material",
                            color:{ r:0.4, g:0.4, b:1.0 },
                            nodes:[

                                // Cylinder primitive, implemented by plugin at
                                // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                                // Author: Moritz Kornher
                                {
                                    type:"prims/cylinder",
                                    radiusTop:13, // Default 20
                                    radiusBottom:13, // Default 20
                                    height:4, // Default 100
                                    radialSegments:24, // Default 8
                                    heightSegments:1, // Default 1
                                    openEnded:false // Default false
                                }
                            ]
                        }
                    ]
                },
                {
                    type:"translate",
                    y:90,
                    nodes:[
                        {
                            type:"material",
                            color:{ r:0.4, g:0.4, b:1.0 },
                            nodes:[

                                // Cylinder primitive, implemented by plugin at
                                // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                                // Author: Moritz Kornher
                                {
                                    type:"prims/cylinder",
                                    radiusTop:13, // Default 20
                                    radiusBottom:13, // Default 20
                                    height:4, // Default 100
                                    radialSegments:24, // Default 8
                                    heightSegments:1, // Default 1
                                    openEnded:false // Default false
                                }
                            ]
                        }
                    ]
                },
                {
                    type:"translate",
                    y:10,
                    nodes:[
                        {
                            type:"material",
                            color:{ r:0.4, g:0.4, b:1.0 },
                            nodes:[

                                // Cylinder primitive, implemented by plugin at
                                // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                                // Author: Moritz Kornher
                                {
                                    type:"prims/cylinder",
                                    radiusTop:10, // Default 20
                                    radiusBottom:20, // Default 20
                                    height:20, // Default 100
                                    radialSegments:24, // Default 8
                                    heightSegments:1, // Default 1
                                    openEnded:false // Default false
                                }
                            ]
                        }
                    ]
                },
                {
                    type:"flags",
                    flags:{
                        backfaces:false
                    },

                    nodes:[

                        {
                            type:"translate",
                            y:155,
                            nodes:[
                                { type:"scale",
                                    y:0.75,
                                    nodes:[
                                        {
                                            type:"material",
                                            color:{ r:0.6, g:1.0, b:0.6 },
                                            specular:1000,
                                         //   alpha:0.3,
                                            nodes:[

                                                {
                                                    type:"effects/xray",
                                                    xrayOpacity:0.01,
                                                    nodes:[

                                                        // Sphere primitive, implemented by plugin at
                                                        // http://scenejs.org/api/latest/plugins/node/prims/sphere.js
                                                        {
                                                            type:"prims/sphere",
                                                            latudeBands:20,
                                                            longitudeBands:30,
                                                            radius:40
                                                        }
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
            ]
        });
    }
});
