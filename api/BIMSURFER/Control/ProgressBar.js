"use strict"

/**
 * Class: BIMSURFER.Control.ProgressBar
 * A progressbar can show the progress of some long running actions
 * It will register and listen to some events on the Viewer instance.
 * Other objects can trigger these events and the progressbar will show the progress.
 */
 BIMSURFER.Control.ProgressBar = BIMSURFER.Class(BIMSURFER.Control, {
	CLASS: "BIMSURFER.Control.ProgressBar",
	percentage: 0,
	shownPercentage: 0,
	message: '',
	animationSpeed: 200,
	animationTimer: null,
	currentType: BIMSURFER.Constants.ProgressBarStyle.Continuous,
	marqueeImageSrc: './images/loader.png',
	marqueeImage: null,
	marqueeSpeed: 20,

	activate: function() {
		if(this.div && this.SYSTEM) {
			this.active = true;
			this.marqueeImage = new Image();
			this.marqueeImage.src = this.marqueeImageSrc;
			this.redraw();
			this.initEvents();
		}
		return this;
	},

	deactivate: function() {
		this.active = false;
		this.marqueeImage = null;
		this.initEvents();
		$(this.DOMelement).remove();
		this.DOMelement = null;
		return this;
	},

	initEvents: function() {
		if(this.active) {
			this.SYSTEM.events.register('progressStarted', this.start, this); // Register on global events
			this.SYSTEM.events.register('progressDone', this.stop, this); // Register on global events
			this.SYSTEM.events.register('progressBarStyleChanged', this.changeType, this); // Register on global events
			this.SYSTEM.events.register('progressChanged', this.animateProgress, this); // Register on global events
			this.SYSTEM.events.register('progressMessageChanged', this.changeMessage, this); // Register on global events
		} else {
			this.SYSTEM.events.register('progressLoadingTypeChanged', this.animateProgress, this); // Register on global events
			this.SYSTEM.events.unregister('progressChanged', this.animateProgress, this);
			this.SYSTEM.events.unregister('progressMessageChanged', this.changeMessage, this);
		}
	},
	redraw: function() {
		$(this.div).empty();
		$(this.DOMelement).remove();
		this.DOMelement = $('<div />').addClass(this.CLASS.replace(/\./g,"-"));
		if(this.active) {
			$(this.div).append(this.DOMelement);
		}

		$('<div />').addClass(this.CLASS.replace(/\./g,"-") + '-progress').appendTo(this.DOMelement);
		$('<div />').addClass(this.CLASS.replace(/\./g,"-") + '-text').appendTo(this.DOMelement).text('0%');
		return this;
	},

	start: function(message) {
		if(this.active) {
			this.changeMessage(message);
			this.show();
		}
	},
	stop: function() {
		this.hide('slow');
	},

	changeType: function(loadingType) {
		var bar = $(this.DOMelement).find('.' + this.CLASS.replace(/\./g,"-") + '-progress');
		var text = $(this.DOMelement).find('.' + this.CLASS.replace(/\./g, "-") + '-text');
		switch(loadingType) {
			case BIMSURFER.Constants.ProgressBarStyle.Continuous:
				if(this.animationTimer != null) {
					clearInterval(this.animationTimer);
					this.animationTimer = null;
				}
				$(bar).removeAttr('style');
				$(text).show();
				this.currentType = BIMSURFER.Constants.ProgressBarStyle.Continuous;
				break;

			case BIMSURFER.Constants.ProgressBarStyle.Marquee:
				$(text).hide();
				var width = Math.round($(this.DOMelement).height() / this.marqueeImage.height * this.marqueeImage.width);

				$(bar).css({
					'width': '100%',
					'background-image': 'url(' + this.marqueeImageSrc + ')',
					'background-position': '0px 0px',
					'background-size': width + 'px ' + $(this.DOMelement).height() + 'px'
				});
				if(this.animationTimer != null) {
					clearInterval(this.animationTimer);
					this.animationTimer = null;
				}
				var _this = this;
				this.animationTimer = setInterval((function() {
					var position = $(bar).css('background-position').split('px');
					position = position[0];
					if(position >= width) {
						position = 0;
					}

				   	$(bar).css('background-position', position/1+1 + 'px 0px');

				}), this.marqueeSpeed);
				this.currentType = BIMSURFER.Constants.ProgressBarStyle.Marquee;
				break;
		}
	},

	setAnimationSpeed: function(speed) {
		this.animationSpeed = speed;
		return this;
	},

	changeShownProgress: function(percentage) {
		if(this.currentType != BIMSURFER.Constants.ProgressBarStyle.Continuous) {
			this.changeType(BIMSURFER.Constants.ProgressBarStyle.Continuous);
		}
		if(percentage > 100) {
			percentage = 100;
		} else if(percentage < 0) {
			percentage = 0;
		}
		this.shownPercentage = percentage;
		$(this.DOMelement).find('.' + this.CLASS.replace(/\./g,"-") + '-text').text(this.shownPercentage + '%' + (this.message.length > 0 ? ' (' + this.message + ')': ''));
		return this;
	},

	animateProgress: function(percentage) {

		if(percentage > 100) {
			percentage = 100;
		} else if(percentage < 0) {
			percentage = 0;
		}
		if(this.animationTimer != null) {
			clearInterval(this.animationTimer);
			this.animationTimer = null;
		}

		if(this.percentage < percentage) {
			$(this.DOMelement).find('.' + this.CLASS.replace(/\./g,"-") + '-progress').stop(true, false).animate({'width': percentage + '%'}, {duration: this.animationSpeed, queue: false});

			var _this = this;
			this.animationTimer = setInterval((function() {

				if(_this.shownPercentage == _this.percentage) {
					clearInterval(_this.animationTimer);
					_this.animationTimer = null;
					return;
				}

				_this.changeShownProgress(_this.shownPercentage + 1);

			}), Math.floor(this.animationSpeed / (percentage - this.shownPercentage)));
		} else {
			$(this.DOMelement).find('.' + this.CLASS.replace(/\./g,"-") + '-progress').stop().css('width', percentage + '%');
			this.changeShownProgress(percentage);
		}

		this.percentage = percentage;
		return this;
	},

	changeMessage: function(message) {
		$(this.DOMelement).find('.' + this.CLASS.replace(/\./g,"-") + '-text').text(this.percentage + '%' + (message.length > 0 ? ' (' + message + ')': ''));
		this.message = message;
		return this;
	}

});