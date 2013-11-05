/**
 * An atom
 */
SceneJS.Types.addType("demos/alienCity/atom", {

    /** Constructor
     *
     * @param params Attributes from JSON node instance
     */
    construct:function (params) {
        this.addNode({
            nodes:[
                {
                    type:"material",
                    color:{ r:1.0, g:0.3, b:1.0 },

                    nodes:[

                        // Cylinder primitive, implemented by plugin at
                        // http://scenejs.org/api/latest/plugins/node/prims/cylinder.js
                        {
                            type:"prims/sphere",
                            radius:5
                        }
                    ]
                },
                {
                    type:"rotate",
                    x:1,
                    angle:30,
                    nodes:[
                        {
                            type:"translate",
                            x:10,
                            nodes:[
                                {
                                    type:"demos/alienCity/particle",
                                    particleSize:4,
                                    spinRate:Math.random() * 6 - 3,
                                    orbitRadius:20,
                                    particleColor:{ r:0.4, g:1.0, b:0.4 }
                                }
                            ]
                        }
                    ]
                },
                {
                    type:"rotate",
                    x:1,
                    angle:-30,
                    nodes:[
                        {
                            type:"translate",
                            x:-3,
                            nodes:[
                                {
                                    type:"demos/alienCity/particle",
                                    particleSize:3,
                                    spinRate:Math.random() * 6 - 3,
                                    orbitRadius:17,
                                    particleColor:{ r:1.0, g:0.4, b:0.4 }
                                }
                            ]
                        }
                    ]
                },
                {
                    type:"rotate",
                    x:1,
                    y:1,
                    angle:-90,
                    nodes:[
                        {
                            type:"translate",
                            y:-3,
                            nodes:[
                                {
                                    type:"demos/alienCity/particle",
                                    particleSize:3,
                                    spinRate:Math.random() * 6 - 3,
                                    orbitRadius:15,
                                    particleColor:{ r:0.4, g:0.4, b:1.0 }
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    }
});
