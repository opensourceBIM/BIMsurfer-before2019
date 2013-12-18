BIMSURFER.Light.Sun = BIMSURFER.Class(
{
	CLASS: 'BIMSURFER.Light.Sun',
	__construct: function(system)
	{
		this.SYSTEM = system;
		this.lightObject =
		{
			type:		'light',
			id:			'sun-light',
			mode:		'dir',
			color:		{r: 0.8, g: 0.8, b: 0.8},
			dir:   		{x: -0.5, y: 0.5, z: -1.0},
			diffuse:	true,
			specular:	true
		};
	},

	activate: function()
	{
	  //	var lights = this.surfer.scene.findNode('my-lights')._data.lights;
	  //	console.debug(lights);
	},

	setSurfer: function(surfer)
	{
		this.surfer = surfer;
	}
});