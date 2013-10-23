if(typeof BIM.Util != 'object')
	BIM.Util = {};


BIM.Util.isset = function(variable)
{
	return !(typeof variable == 'undefined' || variable == null);
}