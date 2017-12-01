const xmlToJson = function (node, attributeRenamer) {
	if (node.nodeType === node.TEXT_NODE) {
		const v = node.nodeValue;
		if (v.match(/^\s+$/) === null) {
			return v;
		}
	} else if (node.nodeType === node.ELEMENT_NODE ||
		node.nodeType === node.DOCUMENT_NODE) {
		const json = {
			type: node.nodeName,
			children: []
		};

		if (node.nodeType === node.ELEMENT_NODE) {
			for (let j = 0; j < node.attributes.length; j++) {
				const attribute = node.attributes[j];
				const nm = attributeRenamer[attribute.nodeName] || attribute.nodeName;
				json[nm] = attribute.nodeValue;
			}
		}

		for (let i = 0; i < node.childNodes.length; i++) {
			const item = node.childNodes[i];
			const j = xmlToJson(item, attributeRenamer);
			if (j) {
				json.children.push(j);
			}
		}

		return json;
	}
};

const clone = function (ob) {
	return JSON.parse(JSON.stringify(ob));
};

const guidChars = [
	["0", 10],
	["A", 26],
	["a", 26],
	["_", 1],
	["$", 1]
].map(function (a) {
	let li = [];
	const st = a[0].charCodeAt(0);
	const en = st + a[1];
	for (let i = st; i < en; ++i) {
		li.push(i);
	}
	return String.fromCharCode.apply(null, li);
}).join("");

const b64 = function (v, len) {
	const r = (!len || len == 4) ? [0, 6, 12, 18] : [0, 6];
	return r.map(function (i) {
		return guidChars.substr(parseInt(v / (1 << i)) % 64, 1);
	}).reverse().join("");
};

const compressGuid = function (g) {
	const bs = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30].map(function (i) {
		return parseInt(g.substr(i, 2), 16);
	});
	return b64(bs[0], 2) + [1, 4, 7, 10, 13].map(function (i) {
		return b64((bs[i] << 16) + (bs[i + 1] << 8) + bs[i + 2]);
	}).join("");
};

const findNodeOfType = function (m, t) {
	let li = [];
	const _ = function (n) {
		if (n.type === t) {
			li.push(n);
		}
		(n.children || []).forEach(function (c) {
			_(c);
		});
	};

	_(m);
	return li;
};

const timeout = function (dt) {
	return new Promise(function (resolve, reject) {
		setTimeout(resolve, dt);
	});
};

const Utils = {
	'XmlToJson': xmlToJson,
	'Clone': clone,
	'CompressGuid': compressGuid,
	'FindNodeOfType': findNodeOfType,
	'Delay': timeout
};

export default Utils;