import BimServerModel from './BimServerModel.js';
import PreloadQuery from './PreloadQuery.js';
import BimServerGeometryLoader from './BimServerGeometryLoader.js';

export default class BimServerModelLoader {

	//define(["./BimServerModel", "./PreloadQuery", "./BimServerGeometryLoader", "./BimSurfer"], function(BimServerModel, PreloadQuery, BimServerGeometryLoader, BimSufer) { 

	constructor(bimServerClient, bimSurfer) {
		this.bimServerClient = bimServerClient;
		this.bimSurfer = bimSurfer;
		this.globalTransformationMatrix = [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	}

	loadFullModel(apiModel) {
		return new Promise((resolve, reject) => {
			const model = new BimServerModel(apiModel);

			apiModel.query(PreloadQuery, () => { }).done(() => {
				const oids = [];
				apiModel.getAllOfType("IfcProduct", true, (object) => {
					oids.push(object.oid);
				});
				this.loadOids(model, oids);
				resolve(model);
			});
		});
	}

	loadObjects(apiModel, objects) {
		return new Promise((resolve, reject) => {
			const model = new BimServerModel(apiModel);

			const oids = [];
			objects.forEach((object) => {
				oids.push(object.oid);
			});
			this.loadOids(model, oids);
			resolve(model);
		});
	}

	loadOids(model, oids) {
		const oidToGuid = {};
		const guidToOid = {};

		const oidGid = {};

		oids.forEach((oid) => {
			model.apiModel.get(oid, (object) => {
				if (object.object._rgeometry != null) {
					const gid = object.object._rgeometry;//._i;
					const guid = object.object.GlobalId;
					oidToGuid[oid] = guid;
					guidToOid[guid] = oid;
					oidGid[gid] = oid;
				}
			});
		});

		this.bimSurfer._idMapping.toGuid.push(oidToGuid);
		this.bimSurfer._idMapping.toId.push(guidToOid);

		const viewer = this.bimSurfer.viewer;
		viewer.taskStarted();

		viewer.createModel(model.apiModel.roid);

		const loader = new BimServerGeometryLoader(model.apiModel.bimServerApi, viewer, model, model.apiModel.roid, this.globalTransformationMatrix);

		loader.addProgressListener((progress, nrObjectsRead, totalNrObjects) => {
			if (progress == "start") {
				console.log("Started loading geometries");
				this.bimSurfer.fire("loading-started");
			} else if (progress == "done") {
				console.log("Finished loading geometries (" + totalNrObjects + " objects received)");
				this.bimSurfer.fire("loading-finished");
				viewer.taskFinished();
			}
		});

		loader.setLoadOids(oidGid);

		// viewer.clear(); // For now, until we support multiple models through the API

		viewer.on("tick", () => { // TODO: Fire "tick" event from xeoViewer
			loader.process();
		});

		loader.start();
	}

	setGlobalTransformationMatrix(globalTransformationMatrix) {
		this.globalTransformationMatrix = globalTransformationMatrix;
	}
}