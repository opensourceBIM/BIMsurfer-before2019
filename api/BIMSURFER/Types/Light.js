BIMSURFER.Light = BIMSURFER.Class({
	CLASS: 'BIMSURFER.Light',
	SYSTEM: null,
	surfer: null,
	lightObject: null,
	__construct: function(system) {
		this.SYSTEM = system;
	},
	activate: function() {
		var myLights = this.surfer.scene.findNode('my-lights');
		var lights = myLights._core.lights;

		if(BIMSURFER.Util.isArray(this.lightObject)) {
			for(var i = 0; i < this.lightObject.length; i++) {
				if(lights.indexOf(this.lightObject[i]) == -1) {
					lights.push(this.lightObject[i]);
				}
			}
		} else if(lights.indexOf(this.lightObject) == -1) {
			lights.push(this.lightObject);
		}
		myLights.setLights(lights);
	},
	deactivate: function() {
		var myLight = this.surfer.scene.findNode('my-lights');
		var lights = myLights._core.lights;

		var i = -1;
		if(BIMSURFER.Util.isArray(this.lightObject)) {
			for(i = 0; i < this.lightObject.length; i++) {
				var y = lights.indexOf(this.lightObject[i]);
				if(y > -1) {
					lights.splice(y, 1);
				}
			}
		} else if(i = lights.indexOf(this.lightObject) > -1) {
			lights.splice(i, 1);
		}
		myLights.setLights(lights);
	},

	setSurfer: function(surfer) {
		this.surfer = surfer;
	}
});