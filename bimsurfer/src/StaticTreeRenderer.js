define(["bimsurfer/src/EventHandler.js"], function(EventHandler) {
    
    function StaticTreeRenderer(args) {
        
        var self = this;        
        EventHandler.call(this);
        
        this.build = function() {
            var build = function(d, n) {
                d.appendChild(document.createTextNode(n.name || n.guid));
                for (var i = 0; i < (n.children || []).length; ++i) {
                    var d2 = document.createElement("div");
                    (function(id) {
                        d2.onclick = function(evt) {
                            evt.stopPropagation();
                            evt.preventDefault();
                            self.fire("click", [id]);
                        };
                    })(n.children[i].id);
                    d.appendChild(d2);
                    build(d2, n.children[i]);
                }
            }
            var d = document.createElement("div");
            build(d, args['tree']);
            document.getElementById(args['domNode']).appendChild(d);            
        }
        
    };
    
    StaticTreeRenderer.prototype = Object.create(EventHandler.prototype);

    return StaticTreeRenderer;
    
});