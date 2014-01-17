$(function() {
	var options = {
		autoStart:	{
						serverUrl: 'http://127.0.0.1:8080/',
						serverUsername: 'admin@bimserver.org',
						serverPassword: 'admin',
						projectOid: 655361,
	   					revisionOid: 1179651
					},
		controls: [
			new BIMSURFER.Control.ProgressBar('progress_bar'),
			new BIMSURFER.Control.PickFlyOrbit()
		]
	};
	var BIMSurfer = new BIMSURFER.Viewer('viewport', options);
});