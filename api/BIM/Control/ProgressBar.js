BIM.Control.ProgressBar = BIM.Class(BIM.Control,
{
	CLASS: "BIM.Control.ProgressBar",
	percentage: 0,
	shownPercentage: 0,
	message: '',
	animationSpeed: 200,
	animationTimer: null,

	initEvents: function()
	{
		if(this.active) {
			BIM.events.register('progressStarted', this.start, this); // Register on global events
			BIM.events.register('progressDone', this.stop, this); // Register on global events
			BIM.events.register('progressBarStyleChanged', this.changeType, this); // Register on global events
			BIM.events.register('progressChanged', this.animateProgress, this); // Register on global events
			BIM.events.register('progressMessageChanged', this.changeMessage, this); // Register on global events
		} else {
			BIM.events.register('progressLoadingTypeChanged', this.animateProgress, this); // Register on global events
			BIM.events.unregister('progressChanged', this.animateProgress, this);
			BIM.events.unregister('progressMessageChanged', this.changeMessage, this);
		}
	},
	redraw: function()
	{
		$(this.div).empty();
		$(this.DOMelement).remove();
		this.DOMelement = $('<div />').addClass(this.CLASS.replace(/\./g,"-"));
		if(this.active)
			$(this.div).append(this.DOMelement);

		$('<div />').addClass(this.CLASS.replace(/\./g,"-") + '-progress').appendTo(this.DOMelement);
		$('<div />').addClass(this.CLASS.replace(/\./g,"-") + '-text').appendTo(this.DOMelement).text('0%');
		return this;
	},

	start: function(message)
	{
		if(this.active) {
			this.changeMessage(message);
			this.show();
		}
	},
	stop: function()
	{
		this.hide('slow');
	},

	changeType: function(loadingType)
	{
		console.debug('CHANGED LOADINGTYPE', loadingType);
	},

	setAnimationSpeed: function(speed)
	{
		this.animationSpeed = speed;
		return this;
	},

	changeShownProgress: function(percentage)
	{
		this.shownPercentage = percentage;
		$(this.DOMelement).find('.BIM-Control-ProgressBar-text').text(this.shownPercentage + '%' + (this.message.length > 0 ? ' (' + this.message + ')': ''));
		return this;
	},

	animateProgress: function(percentage)
	{

		if(this.animationTimer != null)
		{
			clearInterval(this.animationTimer);
			this.animationTimer = null;

		}

		if(this.percentage < percentage)
		{
			$(this.DOMelement).find('.BIM-Control-ProgressBar-progress').stop(true, false).animate({'width': percentage + '%'}, {duration: this.animationSpeed, queue: false});

			var _this = this;
			this.animationTimer = setInterval((function()
			{

				if(_this.shownPercentage == _this.percentage)
				{
					clearInterval(_this.animationTimer);
					_this.animationTimer = null;
					return;
				}

				_this.changeShownProgress(_this.shownPercentage + 1);

			}), Math.floor(this.animationSpeed / (percentage - this.shownPercentage)));
		}
		else
		{
			$(this.DOMelement).find('.BIM-Control-ProgressBar-progress').stop().css('width', percentage + '%');
			this.changeShownProgress(percentage);
		}

		this.percentage = percentage;
		return this;
	},

	changeMessage: function(message)
	{
		$(this.DOMelement).find('.BIM-Control-ProgressBar-text').text(this.percentage + '%' + (message.length > 0 ? ' (' + message + ')': ''));
		this.message = message;
		return this;
	}

});