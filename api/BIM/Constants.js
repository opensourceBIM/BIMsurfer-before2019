if(typeof BIM.Constants != 'object') {
	BIM.Constants = {};
}

BIM.Constants.timeoutTime = 10000; // ms

BIM.Constants.defaultTypes = [
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

BIM.Constants.camera = {
	maxOrbitSpeed : Math.PI * 0.1,
	orbitSpeedFactor : 0.05,
	zoomSpeedFactor : 0.1,
	panSpeedFactor : 0.6
};

BIM.Constants.clamp = function(s, min, max) {
	return Math.min(Math.max(s, min), max);
};

BIM.Constants.highlightSelectedObject = {
	type : 'material',
	id : 'highlight',
	emit : 0.0,
	baseColor : {r: 0.0, g: 0.5, b: 0.5}
}

BIM.Constants.highlightSelectedSpecialObject = {
	type : 'material',
	id : 'specialselectedhighlight',
	emit : 1,
	baseColor : {r: 0.16,g: 0.70,b: 0.88},
	shine : 10.0
};

BIM.Constants.ProgressBarStyle = {
	Continuous: 1,
	Marquee: 2
}