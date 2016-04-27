define(["bimsurfer/lib/text.js"], function(text) {

    /*
    var getElementName = function(elem) {
        var name = null;
        // TODO: This is synchronous right?
        ["LongName", "Name"].forEach(function(attr) {
            if (name === null && elem["get" + attr] && elem["get" + attr]()) {
                name = elem["get" + attr]();
            }
        });
        return name;
    };
    */
    
    // Backwards compatibility
    if (BIMSERVER_VERSION === "1.4") {
        var SERVICE_INTERFACE = "Bimsie1ServiceInterface";
        var DOWNLOAD          = "downloadRevisions";
    } else {
        var SERVICE_INTERFACE = "ServiceInterface";
        var DOWNLOAD          = "downloadRevisions";
    }   
    
    function BimServerModel(api, model) {
    
        this.api = api;
        this.model = model;
        this.tree = null;
        this.treePromise = null;
    
        this.getTree = function(args) {
            
            /* 
            // TODO: This is rather tricky. Never know when the list of Projects is exhausted.
            // Luckily a valid IFC contains one and only one. Let's assume there is just one.
            var projectEncountered = false;
            
            this.model.getAllOfType("IfcProject", false, function(project) {
                if (projectEncountered) {
                    throw new Error("More than a single project encountered, bleh!");
                }
                console.log('project', project);
            });
            
            */
            
            var self = this;
            
            return self.treePromise || (self.treePromise = new Promise(function(resolve, reject) {
                
                if (self.tree) {
                    resolve(self.tree);
                }           
            
                // Get a reference to the JSON serializer
                api.getJsonSerializer(function (jsonSerializer) {
                    
                    // Initiate download
                    api.call(SERVICE_INTERFACE, DOWNLOAD, {
                        roids: [model.roid],
                        serializerOid: jsonSerializer.oid,
                        showOwn: false,
                        sync: true
                    }, function (laid) {
                    	
                        // Construct download url
                        var url = api.generateRevisionDownloadUrl({
                            laid: laid,
                            topicId: laid,
                            serializerOid: jsonSerializer.oid
                        });
                        
                        // A list of entities that define parent-child relationships
                        var entities = {
                            'IfcRelDecomposes': 1,
                            'IfcRelAggregates': 1,
                            'IfcRelContainedInSpatialStructure': 1,
                            'IfcRelFillsElement': 1,
                            'IfcRelVoidsElement': 1
                        }
                        
                        // Perform the download
                        text.get(url, function(data) {
                            data = JSON.parse(data);
                        
                            // Create a mapping from id->instance
                            var instance_by_id = {};
                            data.objects.forEach(function (o) {
                                // The root node in a dojo store should have its parent
                                // set to null, not just something that evaluates to false
                                o.parent = null;
                                instance_by_id[o._i] = o;
                            });

                            // Filter all instances based on relationship entities
                            var relationships = data.objects.filter(function (o) {
                                return entities[o._t];
                            });

                            // Construct a tuple of {parent, child} ids
                            var parents = relationships.map(function (o) {
                                var ks = Object.keys(o);
                                var related = ks.filter(function (k) {
                                    return k.indexOf('Related') !== -1;
                                });
                                var relating = ks.filter(function (k) {
                                    return k.indexOf('Relating') !== -1;
                                });
                                return [o[relating[0]], o[related[0]]];
                            });

                            var is_array = function (o) {
                                return Object.prototype.toString.call(o) === '[object Array]';
                            }

                            var data = [];
                            var visited = {};
                            parents.forEach(function (a) {
                                // Relationships in IFC can be one to one/many
                                var ps = is_array(a[0]) ? a[0] : [a[0]];
                                var cs = is_array(a[1]) ? a[1] : [a[1]];
                                for (var i = 0; i < ps.length; ++i) {
                                    for (var j = 0; j < cs.length; ++j) {
                                        // Lookup the instance ids in the mapping
                                        var p = instance_by_id[ps[i]];
                                        var c = instance_by_id[cs[j]];

                                        // parent, id, hasChildren are significant attributes in a dojo store
                                        c.parent = p.id = p._i;
                                        c.id = c._i;
                                        p.hasChildren = true;

                                        // Make sure to only add instances once
                                        if (!visited[c.id]) {
                                            data.push(c);
                                        }
                                        if (!visited[p.id]) {
                                            data.push(p);
                                        }
                                        visited[p.id] = visited[c.id] = true;
                                    }
                                }
                            });
                            
                            var make_element = function (o) {
                                return {name: o.Name, id: o.id, guid: o.GlobalId, parent: o.parent, gid: o._rgeometry};
                            };
                            
                            var fold = (function() {
                                var root = null;
                                return function(li) {
                                    var by_oid = {};
                                    li.forEach(function(elem) {
                                        by_oid[elem.id] = elem;
                                    });
                                    li.forEach(function(elem) {
                                        if (elem.parent === null) {
                                            root = elem;
                                        } else {
                                            var p = by_oid[elem.parent];
                                            (p.children || (p.children = [])).push(elem);
                                        }
                                    });
                                    return root;
                            }})();
                            
                            resolve(self.tree = fold(data.map(make_element)));
                        });
                    });
                });
            }));
        };
        
    }
    
    return BimServerModel;

});