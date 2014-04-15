var BIMSURFER = {
	CLASS: "BIMSURFER",
	VERSION_NUMBER: "2.0 Dev"
};


/**
 * Constructor: BIMSURFER.Class
 * Base class used to construct all other classes. Includes support for multiple inheritance.
 */
BIMSURFER.Class = function(baseClass, subClass){
	var constructor = null;
	var classObject = subClass || baseClass;

	if(typeof classObject.__construct == 'function') {
		constructor = classObject.__construct;
	} else if(typeof baseClass.prototype.__construct == 'function') {
		constructor = function() {
			baseClass.prototype.__construct.apply(this, arguments);
		}
	} else {
		constructor = function() { };
	}

	var Class = constructor;

	if(typeof subClass == 'undefined') {
		Class.prototype = classObject
	} else {
		var newClass = function() {};
		newClass.prototype = jQuery.extend({}, baseClass.prototype);
		jQuery.extend(newClass.prototype, subClass);
		Class.prototype = new newClass;
	}

	return Class;
};