BIM.Control = BIM.Class({

	type: 'Control',
	options: null,
	trala: 'Joepie',

	__construct: function(name, options)
	{
		console.debug(name);
		console.debug(options);
		this.options = options;
	}

});

console.debug(BIM.Control);

BIM.Control.Button = BIM.Class(BIM.Control, {

	name: 'Button',

	opGeklikt: function()
	{
		alert('tralala');
	},

	type: 'Control.Button'

});