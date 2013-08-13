var BIMsurfer = function(div)
{
	var othis	   		= this;
	this.div	   		= (typeof div == "string" ? $('#' + div) : div);
	this.canvas    		= null;
	this.bimServer		= null;
	this.timeoutTime	= 3000;

	if($(this.div).length != 1) return null;

	this.drawCanvas = function()
	{
		var width = $(this.div).width();
		var height = $(this.div).height();
		if(!(width > 0 && height > 0)) return;

		if($(this.canvas).length == 1) $(this.canvas).remove();

		this.canvas = $('<canvas />')
							.attr('id', $(this.div).attr('id') + "-canvas")
							.attr('width', width)
							.attr('height', height)
							.html('<p>This application requires a browser that supports the<a href="http://www.w3.org/html/wg/html5/">HTML5</a>&lt;canvas&gt; feature.</p>')
							.appendTo(this.div);
	}

	this.drawCanvas();

	this.connect = function(serverUrl, success, fail)
	{
		serverUrl = (serverUrl.substr(-1) == '/' ? serverUrl.substr(0, serverUrl.length - 1) : serverUrl);
		var success = false;

		$.ajax({
			url: serverUrl + "/js/bimserverapi.js",
			type: "GET",
			success: function(script)
			{
				try
				{
					$.globalEval(script);
					if(typeof BimServerApi == 'object' || typeof BimServerApi == 'function')
					{
						othis.bimServer = new BimServerApi(serverUrl);
						success = true;
						if(typeof success == 'function') success();
					}
					else
					{
						othis.bimServer = null;
						if(typeof fail == 'function') fail('BimServerApi not found.');
					}
				}
				catch(e)
				{
					othis.bimServer = null;
					if(typeof fail == 'function') fail('Syntax error in BimServerApi script.');
				}
			},
			error: function(a,b,c,d,e)
			{
				othis.bimServer = null;
				if(typeof fail == 'function') fail('Could not load the BimServerApi.');
			},
			dataType: 'text',
			cache: false,
			async: false
		});
		return success;
	}


	this.ok = true;
}