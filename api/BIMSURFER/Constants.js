if(typeof BIMSURFER.Constants != 'object') {
	BIMSURFER.Constants = {};
}

BIMSURFER.Constants.timeoutTime = 10000; // ms

BIMSURFER.Constants.defaultTypes = [
	"IfcColumn",
	"IfcStair",
	"IfcSlab",
	"IfcWindow",
	"IfcDoor",
	"IfcBuildingElementProxy",
	"IfcWallStandardCase",
	"IfcWall",
	"IfcBeam",
	"IfcRailing",
	"IfcProxy",
	"IfcRoof"
];

BIMSURFER.Constants.camera = {
	maxOrbitSpeed : Math.PI * 0.1,
	orbitSpeedFactor : 0.05,
	zoomSpeedFactor : 0.1,
	panSpeedFactor : 0.6
};

BIMSURFER.Constants.clamp = function(s, min, max) {
	return Math.min(Math.max(s, min), max);
};

BIMSURFER.Constants.highlightSelectedObject = {
	type : 'material',
	id : 'highlight',
	emit : 0.0,
	baseColor : {r: 0.0, g: 0.5, b: 0.5}
}

BIMSURFER.Constants.highlightSelectedSpecialObject = {
	type : 'material',
	id : 'specialselectedhighlight',
	emit : 1,
	baseColor : {r: 0.16,g: 0.70,b: 0.88},
	shine : 10.0
};

BIMSURFER.Constants.ProgressBarStyle = {
	Continuous: 1,
	Marquee: 2
}