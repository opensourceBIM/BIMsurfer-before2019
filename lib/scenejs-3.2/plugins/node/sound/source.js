require([
    // Prefix routes to plugin support libs
    //"scenejsPluginDeps/frustum/frustumCullSystemPool"
],
    function () {

        SceneJS.Types.addType("sound/source", {

            construct:function (params) {
                this.addNode({
                        nodes:[
                            {
                                type:"prims/box"
                            },
                            {
                                nodes:params.nodes
                            }
                        ]},
                    function (node) {

                        // Update sound source pos from sphere

                    });
            },

            play:function () {
                var text = "does the water ripple?"
                var http = new XMLHttpRequest();
                var url = "http://translate.google.com/translate_tts?tl=en&q=" + text;
                http.open('HEAD', url);
                http.onreadystatechange = function () {
                    if (this.readyState == this.DONE) {
                        callback(this.status != 404);
                    }
                };
                http.send();
            },

            preCompile:function () {
            },

            postCompile:function () {
            },

            destruct:function () {
            }
        });
    });

