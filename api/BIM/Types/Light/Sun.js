BIM.Light.Sun = BIM.Class(
{
	CLASS: 'BIM.Light.Sun',
	__construct: function()
	{
		this.lightObject =
		{
			type:		'light',
			id:			'sun-light',
			mode:		'dir',
			color:		{r: 0.8, g: 0.8, b: 0.8},
			dir:   		{x: -0.5, y: -0.5, z: -1.0},
			diffuse:	true,
			specular:	true
		};
	},

	activate: function()
	{
	 //	var mainRenderer = this.surfer.scene.findNode('main-renderer');
	 //	mainRenderer.addNode(this.lightObject);
	},

	setSurfer: function(surfer)
	{
		this.surfer = surfer;
	}
});