define(["bimsurfer/src/EventHandler"], function(EventHandler) {
    
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
        
        var models = [];
        
        this.addModel = function(args) {
            models.push(args);
        };
        
        this.qualifyInstance = function(modelId, id) {
            return modelId + ":" + id;
        };
        
        this.build = function() {
            var build = function(modelId, d, n) {
                var qid = self.qualifyInstance(modelId, n.id);
                var label = document.createElement("div");
                var children = document.createElement("div");
                
                label.className = "label";
                label.appendChild(document.createTextNode(n.name || n.guid));
                d.appendChild(label);
                children.className = "children";
                d.appendChild(children);
                domNodes[qid] = label;
                
                label.onclick = function(evt) {
                    evt.stopPropagation();
                    evt.preventDefault();
                    self.setSelected([qid], evt.shiftKey ? TOGGLE : SELECT_EXCLUSIVE);
                    self.fire("click", [qid, self.getSelected(true)]);
                    return false;
                };
                
                for (var i = 0; i < (n.children || []).length; ++i) {
                    var d2 = document.createElement("div");
                    d2.className = "item";
                    children.appendChild(d2);
                    build(modelId, d2, n.children[i]);
                }
            }
            models.forEach(function(m) {
                var d = document.createElement("div");
                d.className = "item";
                build(m['id'], d, m['tree']);
                document.getElementById(args['domNode']).appendChild(d);
            });
        }
        
    };
    
    StaticTreeRenderer.prototype = Object.create(EventHandler.prototype);

    return StaticTreeRenderer;
    
});