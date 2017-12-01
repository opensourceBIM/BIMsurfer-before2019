import EventHandler from './EventHandler';
import * as Request from './Request';
import Utils from './Utils';

class Row {
	constructor(args) {
		this.args = args;
		this.num_names = 0;
		this.num_values = 0;
	}
	setName(name) {
		if (this.num_names++ > 0) {
			this.args.name.appendChild(document.createTextNode(" "));
		}
		this.args.name.appendChild(document.createTextNode(name));
	}

	setValue(value) {
		if (this.num_values++ > 0) {
			this.args.value.appendChild(document.createTextNode(", "));
		}
		this.args.value.appendChild(document.createTextNode(value));
	}
}

class Section {
	constructor(args) {
		this.args = args;

		this.div = document.createElement("div");
		this.nameh = document.createElement("h3");
		this.table = document.createElement("table");

		this.tr = document.createElement("tr");
		this.table.appendChild(this.tr);

		this.nameth = document.createElement("th");
		this.valueth = document.createElement("th");

		this.nameth.appendChild(document.createTextNode("Name"));
		this.valueth.appendChild(document.createTextNode("Value"));
		this.tr.appendChild(this.nameth);
		this.tr.appendChild(this.valueth);

		this.div.appendChild(this.nameh);
		this.div.appendChild(this.table);

		args.domNode.appendChild(this.div);

		this.setSelected([]);
	}

	setName(name) {
		this.nameh.appendChild(document.createTextNode(name));
	}

	addRow() {
		const tr = document.createElement("tr");
		this.table.appendChild(tr);
		const nametd = document.createElement("td");
		const valuetd = document.createElement("td");
		tr.appendChild(nametd);
		tr.appendChild(valuetd);
		return new Row({ name: nametd, value: valuetd });
	}
}


function loadModelFromSource(src) {
	return new Promise((resolve, reject) => {
		Request.make({ url: src }).then((xml) => {
			const json = Utils.XmlToJson(xml, { 'Name': 'name', 'id': 'guid' });

			const psets = Utils.FindNodeOfType(json, "properties")[0];
			const project = Utils.FindNodeOfType(json, "decomposition")[0].children[0];
			const types = Utils.FindNodeOfType(json, "types")[0];

			const objects = {};
			const typeObjects = {};
			const properties = {};
			psets.children.forEach((pset) => {
				properties[pset.guid] = pset;
			});

			const visitObject = (parent, node) => {
				const props = [];
				const o = (parent && parent.ObjectPlacement) ? objects : typeObjects;

				if (node["xlink:href"]) {
					if (!o[parent.guid]) {
						const p = Utils.Clone(parent);
						p.GlobalId = p.guid;
						o[p.guid] = p;
						o[p.guid].properties = [];
					}
					const g = node["xlink:href"].substr(1);
					const p = properties[g];
					if (p) {
						o[parent.guid].properties.push(p);
					} else if (typeObjects[g]) {
						// If not a pset, it is a type, so concatenate type props
						o[parent.guid].properties = o[parent.guid].properties.concat(typeObjects[g].properties);
					}
				}
				node.children.forEach((n) => {
					visitObject(node, n);
				});
			};

			visitObject(null, types);
			visitObject(null, project);

			resolve({ model: { objects: objects, source: 'XML' } });
		});
	});
}

export default class MetaDataRenderer extends EventHandler {
	constructor(args) {
		super();
		this.args = args;

		this.models = {};
		this.domNode = document.getElementById(this.args.domNode);
	}

	addModel(args) {
		return new Promise((resolve, reject) => {
			if (args.model) {
				this.models[args.id] = args.model;
				resolve(args.model);
			} else {
				loadModelFromSource(args.src).then((m) => {
					this.models[args.id] = m;
					resolve(m);
				});
			}
		});
	}

	renderAttributes(elem) {
		const s = new Section({ domNode: this.domNode });
		s.setName(elem.type || elem.getType());

		["GlobalId", "Name", "OverallWidth", "OverallHeight", "Tag"].forEach((k) => {
			let v = elem[k];
			if (typeof (v) === 'undefined') {
				const fn = elem["get" + k];
				if (fn) {
					v = fn.apply(elem);
				}
			}
			if (typeof (v) !== 'undefined') {
				const r = s.addRow();
				r.setName(k);
				r.setValue(v);
			}
		});
		return s;
	}

	renderPSet(pset) {
		const s = new Section({ domNode: this.domNode });
		if (pset.name && pset.children) {
			s.setName(pset.name);
			pset.children.forEach((v) => {
				const r = s.addRow();
				r.setName(v.name);
				r.setValue(v.NominalValue);
			});
		} else {
			pset.getName((name) => {
				s.setName(name);
			});
			const render = (prop, index, row) => {
				const r = row || s.addRow();
				prop.getName((name) => {
					r.setName(name);
				});
				if (prop.getNominalValue) {
					prop.getNominalValue((value) => {
						r.setValue(value._v);
					});
				}
				if (prop.getHasProperties) {
					prop.getHasProperties((prop, index) => {
						render(prop, index, r);
					});
				}
			};
			pset.getHasProperties(render);
		}
		return s;
	}

	setSelected(oid) {
		if (oid.length !== 1) {
			this.domNode.innerHTML = "&nbsp;<br>Select a single element in order to see object properties.";
			return;
		}

		this.domNode.innerHTML = "";

		oid = oid[0];

		if (oid.indexOf(':') !== -1) {
			oid = oid.split(':');
			const o = this.models[oid[0]].model.objects[oid[1]];

			this.renderAttributes(o);

			o.getIsDefinedBy((isDefinedBy) => {
				if (isDefinedBy.getType() == "IfcRelDefinesByProperties") {
					isDefinedBy.getRelatingPropertyDefinition((pset) => {
						if (pset.getType() == "IfcPropertySet") {
							this.renderPSet(pset);
						}
					});
				}
			});
		} else {
			const o = this.models["1"].model.objects[oid];
			this.renderAttributes(o);
			o.properties.forEach((pset) => {
				this.renderPSet(pset);
			});
		}
	}

}
