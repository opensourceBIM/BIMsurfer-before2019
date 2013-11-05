if(typeof BIM.Constants != 'object')
	BIM.Constants = {};

BIM.Constants.defaultTypes =
[
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

BIM.Constants.camera =
{
	maxOrbitSpeed : Math.PI * 0.1,
	orbitSpeedFactor : 0.05,
	zoomSpeedFactor : 0.05,
	panSpeedFactor : 0.6
};

BIM.Constants.clamp = function(s, min, max)
{
	return Math.min(Math.max(s, min), max);
};