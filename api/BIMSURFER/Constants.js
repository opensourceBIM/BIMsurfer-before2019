if(typeof BIMSURFER.Constants != 'object') {
	BIMSURFER.Constants = {};
}


/**
 * Time in milliseconds before a connect or login action will timeout
 */
BIMSURFER.Constants.timeoutTime = 10000; // ms

/**
 * The default IFC Types to load
 */
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

/*
 * Default camera settings
 */
BIMSURFER.Constants.camera = {
	maxOrbitSpeed : Math.PI * 0.1,
	orbitSpeedFactor : 0.05,
	zoomSpeedFactor : 0.1,
	panSpeedFactor : 0.6
};

/*
 * Default markup for highlighted objects
 */
BIMSURFER.Constants.highlightSelectedObject = {
	type : 'material',
	id : 'highlight',
	emit : 0.0,
	baseColor : {r: 0.0, g: 0.5, b: 0.5}
}

/*
 * Default markup for highlighted special objects
 */
BIMSURFER.Constants.highlightSelectedSpecialObject = {
	type : 'material',
	id : 'specialselectedhighlight',
	emit : 1,
	baseColor : {r: 0.16,g: 0.70,b: 0.88},
	shine : 10.0
};

/*
 * Enumeration for progressbar types
 */
BIMSURFER.Constants.ProgressBarStyle = {
	Continuous: 1,
	Marquee: 2
}



/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} s The number to clamp
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
BIMSURFER.Constants.clamp = function(s, min, max) {
	return Math.min(Math.max(s, min), max);
};