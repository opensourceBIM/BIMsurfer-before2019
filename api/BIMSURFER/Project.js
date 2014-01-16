"use strict"

/**
 * Class: BIMSURFER.Project
 * Projects loads all information about the BIMServer projects
 */
BIMSURFER.Project = BIMSURFER.Class({
	CLASS: 'BIMSURFER.Project',
	SYSTEM: null,

	events: null,
	server: null,

	__construct: function(system, serverProject, server) {
		this.SYSTEM = system;

		if(typeof server.CLASS == 'undefined' || server.CLASS !== 'BIMSURFER.Server') {
			console.error('BIMSURFER.Project: No server given');
			return
		}
		this.server = server;

		var _this = this;
		this.server.server.call("Bimsie1ServiceInterface", "getAllRevisionsOfProject", {
			poid : serverProject.oid,
			async: false
		}, function(revisions) {
			_this.revisions = new Array();
			for(var i = 0; i < revisions.length; i++) {
				if(revisions[i].hasGeometry) {
					_this.revisions.push(new BIMSURFER.ProjectRevision(_this.SYSTEM, _this, revisions[i]));
				}
			}
		});

		if(typeof serverProject.lastRevisionId == 'undefined' || _this.revisions.length == 0) {
			console.error('BIMSURFER.Project: Project has no revisions');
			return;
		}

		this.loadedRevisions = new Array();

		delete serverProject.revisions;
		jQuery.extend(this, serverProject);

		this.events = new BIMSURFER.Events(this);
	},

	loadScene: function(revision) {
		if(this.scene != null) {
			return this.types;
		}
		//revisionId = (typeof revisionId == 'undefined' ? this.lastRevisionId : revisionId);

		if(typeof revision == 'object') {
			if(this.revisions.indexOf(revision) > -1) {
				revision.loadScene();
			} else {
				console.error('BIMSURFER.Project.looad: This revision ID does not exist in this project');
				return;
			}
		} else {
			if(typeof revision == 'undefined') {
				revision = this.lastRevisionId;
			}
			var revisionFound = false;
			for(var i = 0; i < this.revisions.length; i++) {
				if(this.revisions[i].oid == revision) {
					revisionFound = true;
					this.revisions[i].loadScene();
					break;
				}
			}
			if(!revisionFound) {
				console.error('BIMSURFER.Project.looad: This revision ID does not exist in this project');
				return;
			}
		}

	}
});