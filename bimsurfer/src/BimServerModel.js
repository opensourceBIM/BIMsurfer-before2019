export default class BimServerModel {
	constructor(apiModel) {
		this.apiModel = apiModel;
		this.tree = null;
		this.treePromise = null;
	}

	getTree(args) {

		/* 
		// TODO: This is rather tricky. Never know when the list of Projects is exhausted.
		// Luckily a valid IFC contains one and only one. Let's assume there is just one.
		const projectEncountered = false;
		
		this.model.getAllOfType("IfcProject", false, function(project) {
			if (projectEncountered) {
				throw new Error("More than a single project encountered, bleh!");
			}
			console.log('project', project);
		});
		
		*/

		const self = this;

		return self.treePromise || (self.treePromise = new Promise(function (resolve, reject) {

			if (self.tree) {
				resolve(self.tree);
			}

			const query =
				{
					defines: {
						Representation: {
							type: "IfcProduct",
							field: "Representation"
						},
						ContainsElementsDefine: {
							type: "IfcSpatialStructureElement",
							field: "ContainsElements",
							include: {
								type: "IfcRelContainedInSpatialStructure",
								field: "RelatedElements",
								includes: [
									"IsDecomposedByDefine",
									"ContainsElementsDefine",
									"Representation"
								]
							}
						},
						IsDecomposedByDefine: {
							type: "IfcObjectDefinition",
							field: "IsDecomposedBy",
							include: {
								type: "IfcRelDecomposes",
								field: "RelatedObjects",
								includes: [
									"IsDecomposedByDefine",
									"ContainsElementsDefine",
									"Representation"
								]
							}
						},
					},
					queries: [{
						type: "IfcProject",
						includes: [
							"IsDecomposedByDefine",
							"ContainsElementsDefine"
						]
					}, {
						type: "IfcRepresentation",
						includeAllSubtypes: true
					}, {
						type: "IfcProductRepresentation"
					}, {
						type: "IfcPresentationLayerWithStyle"
					}, {
						type: "IfcProduct",
						includeAllSubtypes: true
					}, {
						type: "IfcProductDefinitionShape"
					}, {
						type: "IfcPresentationLayerAssignment"
					}, {
						type: "IfcRelAssociatesClassification",
						includes: [{
							type: "IfcRelAssociatesClassification",
							field: "RelatedObjects"
						}, {
							type: "IfcRelAssociatesClassification",
							field: "RelatingClassification"
						}]
					}, {
						type: "IfcSIUnit"
					}, {
						type: "IfcPresentationLayerAssignment"
					}]
				};

			// Perform the download
			//				apiModel.query(query, function(o) {}).done(function(){		

			// A list of entities that define parent-child relationships
			const entities = {
				'IfcRelDecomposes': 1,
				'IfcRelAggregates': 1,
				'IfcRelContainedInSpatialStructure': 1,
				'IfcRelFillsElement': 1,
				'IfcRelVoidsElement': 1
			};

			// Create a mapping from id->instance
			const instance_by_id = {};
			const objects = [];

			for (const e in self.apiModel.objects) {
				// The root node in a dojo store should have its parent
				// set to null, not just something that evaluates to false
				const o = self.apiModel.objects[e].object;
				o.parent = null;
				instance_by_id[o._i] = o;
				objects.push(o);
			}

			// Filter all instances based on relationship entities
			const relationships = objects.filter(function (o) {
				return entities[o._t];
			});

			// Construct a tuple of {parent, child} ids
			const parents = relationships.map(function (o) {
				const ks = Object.keys(o);
				const related = ks.filter(function (k) {
					return k.indexOf('Related') !== -1;
				});
				const relating = ks.filter(function (k) {
					return k.indexOf('Relating') !== -1;
				});
				return [o[relating[0]], o[related[0]]];
			});

			const is_array = function (o) {
				return Object.prototype.toString.call(o) === '[object Array]';
			};

			const data = [];
			const visited = {};
			parents.forEach(function (a) {
				// Relationships in IFC can be one to one/many
				const ps = is_array(a[0]) ? a[0] : [a[0]];
				const cs = is_array(a[1]) ? a[1] : [a[1]];
				for (let i = 0; i < ps.length; ++i) {
					for (let j = 0; j < cs.length; ++j) {
						// Lookup the instance ids in the mapping
						const p = instance_by_id[ps[i]._i];
						const c = instance_by_id[cs[j]._i];

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

			const make_element = function (o) {
			return { name: o.Name, id: o.id, guid: o.GlobalId, parent: o.parent, gid: (o._rgeometry == null ? null : o._rgeometry/*._i*/) };
			};

			const fold = (function () {
				let root = null;
				return function (li) {
					const by_oid = {};
					li.forEach(function (elem) {
						by_oid[elem.id] = elem;
					});
					li.forEach(function (elem) {
						if (elem.parent === null) {
							root = elem;
						} else {
							const p = by_oid[elem.parent];
							(p.children || (p.children = [])).push(elem);
						}
					});
					return root;
				};
			})();

			resolve(self.tree = fold(data.map(make_element)));
			//				});
		}));
	}

}
