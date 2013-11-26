BIM = {
	CLASS: "BIM",
	VERSION_NUMBER: "2.0 Dev"
};


/**
 * Constructor: BIM.Class
 * Base class used to construct all other classes. Includes support for multiple inheritance.
 */
BIM.Class = function(baseClass, subClass){
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
		newClass.prototype = $.extend({}, baseClass.prototype);
		$.extend(newClass.prototype, subClass);
		Class.prototype = new newClass;
	}

	return Class;
};


(function() {
	var js_files = [
		'SceneJS.js',
	  	'BIM/Constants.js',
		'BIM/ProgressLoader.js',
		'BIM/Types/Light.js',
		'BIM/Types/Light/Ambient.js',
		'BIM/Types/Light/Sun.js',
		'BIM/Control.js',
		'BIM/Control/ClickSelect.js',
		'BIM/Control/ProgressBar.js',
		'BIM/Control/PickFlyOrbit.js',
	 	'BIM/Events.js',
	 	'BIM/Project.js',
	 	'BIM/stringview.js',
	 	'BIM/DataInputStream.js',
	  	'BIM/Server.js',
		'BIM/Surfer.js',
	  	'BIM/Util.js'
	];

	var scriptPath = $('script').last()[0].src;
	scriptFolder = scriptPath.substr(0, scriptPath.lastIndexOf('/')+1)

	var prefix = '<script type="text/javascript" src="' + scriptFolder;
	var suffix = '"></script>' + "\r\n";

	var scripts = prefix + js_files.join(suffix + prefix) + suffix;

	var css_files = ['BIM/Control/ProgressBar.css'];

	prefix = '<link rel="stylesheet" href="' + scriptFolder;
	suffix = '" type="text/css" />' + "\r\n";

	var stylesheets = prefix + css_files.join(suffix + prefix) + suffix;

	document.write(stylesheets);
	document.write(scripts);
})();
