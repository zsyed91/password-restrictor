/**
 * Password restrictor library to check strength and prevent users
 *    from entering compromised passwords
 * Check https:R//github.com/zsyed91/password-restrictor/ for the latest updates.
 *
 * Author:       Zshawn Syed
 * Created:      Oct 25th 2014
 * Last Updated: Nov 13nd 2014
 * Version:      0.0.5
 * Licence:      PasswordRestrictor is licenced under MIT licence (http://opensource.org/licenses/MIT)
 */ 
(function($){

	"use strict";

	var PasswordRestrictor = function ($element, options) {
		this.el  = $element;
	
		var defaults = {
			success: function() {
				this.el.css('border', self._getCSS(this.successCSS));
			},
			
			error: function(message) {
				var $message_area = $('#password-strength-message');
				$message_area.val(message);
				$message_area.show();
				this.el.css('border', self._getCSS(this.errorCSS));
				this.el.val('');
			},
			
			
			errorCSS: { 
				size: '2px', 
				type: 'solid', 
				color: 'red'
			},
			
			successCSS: {
				size: '1px', 
				type: 'solid', 
				color: 'green'
			},
			
			minLength: 8,

			invalidPasswordsPath: 'badPasswords.json',

			invalidPasswords: [],

			loadError: true,

			showMeter: true,

			meter: {
				width: '250px',
				height: '20px'
			},

			meterColors: {
				background: '#eee',
				low: '#b72020',
				medium: 'yellow',
				high: '#3cad04',
				strong: '#2b7e02'
			},

			strengthLevel: 'medium',


		};

		var config = $.extend(true, defaults, options);

		// Passwords less than 8 characters are significantly insecure
		if (config.minLength < 8) {
			config.minLength = 8;
		}


		// Lets have a reference to the element here so all functions called by the api don't need to pass this in
		config.el = this.el;


		// Public API Methods
		this.verify = function() {
			var value = this.el.val();

			if (value.length < config.minLength) {
				config.error("Password must be at least " + config.minLength + " characters");
				return false;
			}

			if (config.invalidPasswords.indexOf(value.toLowerCase()) > -1) {

				config.error("This password is very common, please select a more secure one.");
				return false;
			}

			config.success();
			return true;
		}


		// Private methods
		var self = {

			_getCSS: function(css) {
				return css.size + ' ' + css.type + ' ' + css.color;
			},
			loadPasswords: function() {
				$.get(
					config.invalidPasswordsPath
				)
				.done(function(data, status){
					config.invalidPasswords = data;
					self.cachePasswords();
				})
				.fail(function(){
					if (config.loadError === true) {
						alert("Could not load data.");
					}
				});
			},

			cachePasswords: function() {
				window.invalidPasswords = config.invalidPasswords;
			},


			getCharacterTypes: function(password) {
				var characterTypes = 0;

				if (password.match(/[a-z]+/)) {
					characterTypes++;
				}

				if (password.match(/[A-Z]+/)) {
					characterTypes++;
				}

				if (password.match(/[0-9]+/)) {
					characterTypes++;
				}

				if (password.match(/[^a-zA-Z0-9]+/)) {
					characterTypes++;
				}

				return characterTypes;

			},

			getStrengthPercent: {
				low: function(password) {
					var length = password.length;

					if (length < config.minLength + 8) {
						return 25 + (12.5 * (length - config.minLength));
					}

					return 100;

				},
				medium: function(password) {
					var length = password.length;

					if (self.getCharacterTypes(password) < 2) {
						return 25;
					}				

					if (length < config.minLength + 12) {
						return 25 + (8.33 * (length - config.minLength));
					}

					return 100;

				},
				high: function(password) {
					var length = password.length;

					if (self.getCharacterTypes(password) < 3) {
						return 25;
					}				

					if (length < config.minLength + 20) {
						return 25 + (5 * (length - config.minLength));
					}

					return 100;
				}
			},

			calculateStrength: function() {
				var password = config.el.val();
				var percent = 1;

				if (password.length < config.minLength) {
					percent = 1;
				}
				else if (config.invalidPasswords.indexOf(password.toLowerCase()) > -1) {
					percent = 1;
				}
				else {
					percent = self.getStrengthPercent[config.strengthLevel](password);			
				}


				self.updateMeter(percent);
			},

			addMeter: function() {
				if (config.showMeter !== true) {
					return;
				}

				var $meter = $("<div>", {
								id: 'password-strength-meter', 
								class: 'password-strength-meter',
								css: {
									width: '1%',
									height: config.meter.height,
									background: config.meterColors.low,
									display: 'inline-block'						 
								}
							  }
							);

				var $padding = $("<div>", {
						id: 'password-strength-padding',
						css: {
							width: '99%',
							height: config.meter.height,
							background: config.meterColors.background,
							display: 'inline-block'
						}

				});


				var $wrapper = $("<div>", 
								{
									id: 'password-strength-wrapper', 
									class: 'password-strength-wrapper',
									css: {
										width: config.meter.width,
										height: config.meter.height,
										border: '1px solid #ccc',
									}
								}
						   ).append($meter)
							.append($padding);

				config.el.after($wrapper);
			},

			updateMeter: function(percent) {
				var color;

				if (percent > 100) {
					percent = 100;
				}

				if (percent < 50) {
					color = config.meterColors.low;
				} 
				else if (percent < 75) {
					color = config.meterColors.medium;
				}
				else if (percent < 90) {
					color = config.meterColors.high;
				} else {
					color = config.meterColors.strong;
				}

				$('#password-strength-meter').css({
					width: percent + '%',
					background: color
				});

				$('#password-strength-padding').css({
					width: (100 - percent) + '%'
				});
			},

			addMessageArea: function() {
				var $message_area = $('<span>', {
											id: 'password-strength-message', 
											class: 'password-strength-meter',
											css: {display: 'none'}
										}
									);

				config.el.after($message_area);
			}
		}

		// Apply plugin!
		if ($element !== null) {

			// Cache the results in case we want multiple instances on the same page
			if (window.passwordRestrictorPasswords === undefined) {
				self.loadPasswords();
			}

			$element.blur($.proxy(this.verify, this));
			$element.keyup($.proxy(self.calculateStrength, this))

			self.addMessageArea();
			self.addMeter();
		}

	}

	$.fn.passwordRestrictor = function(options) {
		var $element = $(this);

		// This element already has this plugin applied
		if ($element.data('passwordRestrictor')) {
			return $element.data('passwordRestrictor');
		}

		var pr = new PasswordRestrictor($element, options);
		$element.data('passwordRestrictor', pr);
		return $element.data('passwordRestrictor');
	}



})(jQuery);