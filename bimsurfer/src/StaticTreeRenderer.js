define(["bimsurfer/src/EventHandler.js"], function(EventHandler) {
    
    function StaticTreeRenderer(args) {
        
        var self = this;        
        EventHandler.call(this);
        
        var TOGGLE = self.TOGGLE = 0;
        var SELECT = self.SELECT = 1;
        var SELECT_EXCLUSIVE = self.SELECT_EXCLUSIVE = 2;
        var DESELECT = self.DESELECT = 3;
        
        var domNodes = {};
        var selectionState = {};
        
        this.setSelected = function(ids, mode) {
            if (mode == SELECT_EXCLUSIVE) {
                self.setSelected(self.getSelected(true), DESELECT);
            }
            
            ids.forEach(function(id) {        
                var s = null;
                if (mode == TOGGLE) {
                    s = selectionState[id] = !selectionState[id];
                } else if (mode == SELECT || mode == SELECT_EXCLUSIVE) {
                    s = selectionState[id] = true;
                } else if (mode == DESELECT) {
                    s = selectionState[id] = false;
                }
                
                console.log(id, s);
                domNodes[id].className = s ? "label selected" : "label";                
            });
        };
        
        this.getSelected = function(b) {
            var l = [];
            Object.keys(selectionState).forEach(function (k) {
                if (!!selectionState[k] === b) {
                    l.push(k);
                }
            });
            return l;
        };
        
        this.build = function() {
            var build = function(d, n) {
                var label = document.createElement("div");
                label.className = "label";
                label.appendChild(document.createTextNode(n.name || n.guid));
                d.appendChild(label);
                var children = document.createElement("div");
                children.className = "children";
                d.appendChild(children);
                domNodes[n.id] = label;
                label.onclick = function(evt) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    self.setSelected([n.id], evt.shiftKey ? TOGGLE : SELECT_EXCLUSIVE);
                    self.fire("click", [n.id, self.getSelected(true)]);
                    return false;
                };
                for (var i = 0; i < (n.children || []).length; ++i) {
                    var d2 = document.createElement("div");
                    d2.className = "item";
                    children.appendChild(d2);
                    build(d2, n.children[i]);
                }
            }
            var d = document.createElement("div");
            d.className = "item";
            build(d, args['tree']);
            document.getElementById(args['domNode']).appendChild(d);            
        }
        
    };
    
    StaticTreeRenderer.prototype = Object.create(EventHandler.prototype);

    return StaticTreeRenderer;
    
});