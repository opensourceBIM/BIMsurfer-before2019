BIM.Light.Camera = BIM.Class(
{
	CLASS: 'BIM.Light.Camera',
	__construct: function()
	{
		this.lightObject =
		{
			type:		'light',
			id:			'sun-light',
			mode:		'dir',
			color:		{r: 1, g: 1, b: 1},
			dir:   		{x: -0.5, y: -0.5, z: -1.0},
			space:		'world',
			diffuse:	true,
			specular:	true
		};
	},

	activate: function()
	{
		var lights = this.surfer.scene.findNode('my-lights')._data.lights;
		console.debug(lights);

		//	var mainRenderer = this.surfer.scene.findNode('main-renderer');
		//	mainRenderer.addNode(this.lightObject);
	},

	setSurfer: function(surfer)
	{
		this.surfer = surfer;
	}
});