import EventHandler from './EventHandler';
import * as Request from './Request';
import Utils from './Utils';

export default class StaticTreeRenderer extends EventHandler {
	constructor(args) {
		super();

		this.args = args;
		this.TOGGLE = 0;
		this.SELECT = 1;
		this.SELECT_EXCLUSIVE = 2;
		this.DESELECT = 3;

		this.fromXml = false;

		this.domNodes = {};
		this.selectionState = {};
		this.models = [];
	}

	getOffset(elem) {
		const reference = document.getElementById(this.args.domNode);
		let y = 0;

		while (true) {
			y += elem.offsetTop;
			if (elem == reference) {
				break;
			}
			elem = elem.offsetParent;
		}
		return y;
	}

	setSelected(ids, mode) {
		if (mode == this.SELECT_EXCLUSIVE) {
			this.setSelected(this.getSelected(true), this.DESELECT);
		}

		ids.forEach((id) => {
			let s = null;

			if (mode == this.TOGGLE) {
				s = this.selectionState[id] = !this.selectionState[id];
			} else if (mode == this.SELECT || mode == this.SELECT_EXCLUSIVE) {
				s = this.selectionState[id] = true;
			} else if (mode == this.DESELECT) {
				s = this.selectionState[id] = false;
			}

			this.domNodes[id].className = s ? "label selected" : "label";
		});

		let desiredViewRange = this.getSelected().map((id) => {
			return this.getOffset(this.domNodes[id]);
		});

		if (desiredViewRange.length) {
			desiredViewRange.sort();
			desiredViewRange = [desiredViewRange[0], desiredViewRange[desiredViewRange.length - 1]];

			const domNode = document.getElementById(this.args.domNode);
			let currentViewRange = [domNode.scrollTop, domNode.scrollTop + domNode.offsetHeight];

			if (!(desiredViewRange[0] >= currentViewRange[0] && desiredViewRange[1] <= currentViewRange[1])) {
				if ((desiredViewRange[1] - desiredViewRange[0]) > (currentViewRange[1] - currentViewRange[0])) {
					domNode.scrollTop = desiredViewRange[0];
				} else {
					let l = parseInt((desiredViewRange[1] + desiredViewRange[0]) / 2.0 - (currentViewRange[1] - currentViewRange[0]) / 2.0, 10);

					l = Math.max(l, 0);
					l = Math.min(l, domNode.scrollHeight - domNode.offsetHeight);
					domNode.scrollTop = l;
				}
			}
		}

		this.fire("selection-changed", [this.getSelected(true)]);
	}

	getSelected(b) {
		b = typeof (b) === 'undefined' ? true : !!b;
		const l = [];
		Object.keys(this.selectionState).forEach((k) => {
			if (!!this.selectionState[k] === b) {
				l.push(k);
			}
		});
		return l;
	}

	addModel(args) {
		this.models.push(args);
		if (args.src) {
			this.fromXml = true;
		}
	}

	qualifyInstance(modelId, id) {
		if (this.fromXml) {
			return id;
		} else {
			return modelId + ":" + id;
		}
	}

	build() {
		const build = (modelId, d, n) => {
			const qid = this.qualifyInstance(modelId, this.fromXml ? n.guid : n.id);
			const label = document.createElement("div");
			const children = document.createElement("div");

			label.className = "label";
			label.appendChild(document.createTextNode(n.name || n.guid));
			d.appendChild(label);
			children.className = "children";
			d.appendChild(children);
			this.domNodes[qid] = label;

			label.onclick = (evt) => {
				evt.stopPropagation();
				evt.preventDefault();
				this.setSelected([qid], evt.shiftKey ? this.TOGGLE : this.SELECT_EXCLUSIVE);
				this.fire("click", [qid, this.getSelected(true)]);
				return false;
			};

			for (let i = 0; i < (n.children || []).length; ++i) {
				const child = n.children[i];
				if (this.fromXml) {
					if (child["xlink:href"]) { continue; }
					if (child.type === "IfcOpeningElement") { continue; }
				}
				const d2 = document.createElement("div");
				d2.className = "item";
				children.appendChild(d2);
				build(modelId, d2, child);
			}
		};

		this.models.forEach((m) => {
			const d = document.createElement("div");
			d.className = "item";
			if (m.tree) {
				build(m.id, d, m.tree);
			} else if (m.src) {
				Request.make({ url: m.src }).then((xml) => {
					const json = Utils.XmlToJson(xml, { 'Name': 'name', 'id': 'guid' });
					const project = Utils.FindNodeOfType(json.children[0], "decomposition")[0].children[0];
					build(m.id || i, d, project);
				});
			}
			document.getElementById(this.args.domNode).appendChild(d);
		});
	}

}
