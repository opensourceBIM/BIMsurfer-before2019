var BIM = null;
$(function()
{
	console.debug('=== START ===');

	var server = 'http://bimserver.logic-labs.nl/';
	var username = 'admin@bimserver.org';
	var password = 'admin';

	BIM = new BIMsurfer('viewport');

	console.log(BIM.connect(server, function(){console.log(":D");}, function(message){console.log(":(" + message);}));;
});