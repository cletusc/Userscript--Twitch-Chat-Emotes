// ==UserScript==
// @name            Twitch Chat Emotes
// @namespace       #Cletus
// @description     Adds a button to Twitch that allows you to "click-to-insert" an emote.
// @copyright       2011+, Ryan Chatham (http://userscripts.org/users/cletus)
// @license         Creative Commons; http://creativecommons.org/licenses/by-nc-sa/3.0/
// @icon            http://www.gravatar.com/avatar.php?gravatar_id=6875e83aa6c563790cb2da914aaba8b3&r=PG&s=48&default=identicon
//
// @grant           none
//
// @include         http://www.twitch.tv/*
//
// @version         0.3.2
// ==/UserScript==

// Start wrapper.
(function wrapper(window, injectNeeded, undefined) {
	'use strict';

	// Script injection if needed.
	if (injectNeeded) {
		var script = document.createElement('script');
		script.textContent = '(' + wrapper + ')(window, false)';
		document.body.appendChild(script);
		document.body.removeChild(script);
		return;
	}

	// Script-wide variables.
	//-----------------------
	var emotes = [],
		emotesRaw = [],
		emoteListeners = [],
		emotePopularity = false,
		$,
		jQuery,

		userInfo = {
			displayName: '',
			emoteSets: [],
			name: ''
		},

		elemChatButton,
		elemChatButtonsContainer,
		elemChatInput,
		elemEmoteButton,
		elemEmoteMenu,

		SCRIPT_NAME = 'Twitch Chat Emotes',
		MESSAGES = {
			ALREADY_RUNNING: 'There is already an instance of this script running, cancelling this instance.',
			CHAT_NOT_LOADED: 'Chat hasn\'t loaded yet.',
			EMOTES_NOT_LOADED: 'Emotes aren\'t loaded from the API yet.',
			NO_CHAT_ELEMENT: 'There is no chat element on the page, unable to continue.',
			NOT_LOGGED_IN: 'You are not logged in, please log in first.',
			OBJECTS_NOT_LOADED: 'Needed objects haven\'t loaded yet.',
			TIMEOUT_EMOTE_SETS: 'Took too long to find turbo/subscription emote sets, using default. Refresh to try again.',
			TIMEOUT_SCRIPT_LOAD: 'Script took too long to load. Refresh to try again.'
		};

	// Quick manipulation of script-wide variables.
	//---------------------------------------------
	// Prefix all messages with script name.
	for (var message in MESSAGES) {
		if (MESSAGES.hasOwnProperty(message)) {
			MESSAGES[message] = '[' + SCRIPT_NAME + ']: ' + MESSAGES[message];
		}
	}

	// Only enable script if we have the right variables.
	//---------------------------------------------------
	(function init(time) {
		var	chatLoaded = (window.CurrentChat ? window.CurrentChat.last_sender !== false : false),
			frequency = 50,
			loggedIn = (window.PP ? window.PP.login !== '' : false),
			objectsLoaded = (
				window.PP !== undefined &&
				window.Twitch !== undefined &&
				window.CurrentChat !== undefined &&
				window.jQuery !== undefined
			);

		if (document.querySelector('#chat_emote_dropmenu_button')) {
			console.warn(MESSAGES.ALREADY_RUNNING);
			return;
		}

		if (
			!objectsLoaded ||
			!loggedIn ||
			!chatLoaded
		) {
			if (time >= 60000) {
				console.error(MESSAGES.TIMEOUT_SCRIPT_LOAD);
				return;
			}
			if (time >= 10000) {
				frequency = 1000;

				if (!loggedIn) {
					console.error(MESSAGES.NOT_LOGGED_IN);
					return;
				}
				if (!objectsLoaded) {
					console.warn(MESSAGES.OBJECTS_NOT_LOADED);
				}
				if (!chatLoaded) {
					console.warn(MESSAGES.CHAT_NOT_LOADED);
				}
			}
			setTimeout(init, frequency, time + frequency);
			return;
		}
		setup();
	})(0);

	// Start of functions.
	//--------------------
	/**
	 * Runs initial setup of DOM and variables.
	 */
	function setup() {
		$ = jQuery = window.jQuery;

		elemChatButton = $('#chat_speak');
		elemChatButtonsContainer = $('#control_buttons');
		elemChatInput = $('#control_input');

		// No chat, just exit.
		if (!elemChatButton.length) {
			console.warn(MESSAGES.NO_CHAT_ELEMENT);
			return;
		}

		userInfo.displayName = window.PP.display_name;
		userInfo.name = window.PP.login;
		(function checkEmoteSets(time) {
			var	emoteSets = window.CurrentChat.user_to_emote_sets[userInfo.name],
				frequency = 50;

			if (!emoteSets) {
				if (time >= 60000) {
					console.warn(MESSAGES.TIMEOUT_EMOTE_SETS);
					return;
				}
				if (time >= 10000) {
					frequency = 1000;
				}
				setTimeout(checkEmoteSets, frequency, time + frequency);
				return;
			}
			userInfo.emoteSets = emoteSets;
			populateEmotesMenu();
		})(0);

		// Get current emotes from API.
		window.Twitch.api.get('chat/emoticons').done(function (api) {
			var count = 0;
			api.emoticons.forEach(function (emote) {
				// Taken from http://userscripts.org/scripts/show/160183
				emote.text = decodeURI(emote.regex)
					.replace('&gt\\;', '>') // right angle bracket
					.replace('&lt\\;', '<') // left angle bracket
					.replace(/\(\?![^)]*\)/g, '') // remove negative group
					.replace(/\(([^|])*\|?[^)]*\)/g, '$1') // pick first option from a group
					.replace(/\[([^|])*\|?[^\]]*\]/g, '$1') // pick first character from a character group
					.replace(/[^\\]\?/g, '') // remove optional chars
					.replace(/\\/g, ''); // unescape

				emote.images.forEach(function (image) {
					count++;
					image.html = window.ich['chat-emoticon']({
						id: count
					}).prop('outerHTML');
				});
				emotesRaw.push(emote);
			});
			addSetStyle();
			populateEmotesMenu();
		});

		createMenuElements();
		addBaseStyle();
		bindListeners();
	}

	/**
	 * Creates the initial menu elements
	 */
	function createMenuElements() {
		// Create emote button.
		elemEmoteButton = $('<a class="dropdown_glyph" id="chat_emote_dropmenu_button"><span>emotes</span></a>');
		elemEmoteButton.insertBefore(elemChatButton);
		elemEmoteButton.hide();
		// Animate for non-channel pages (dashboard, popout, etc.).
		if (elemChatButton.hasClass('cap')) {
			elemChatInput.animate({'margin-right': '175px'});
			elemChatButtonsContainer.css('width', '175px');
			elemChatButton.animate({'margin-right': '51px'}, {
				complete: function () {
					elemChatButton.css('margin-right', '5px');
					elemEmoteButton.css('margin-right', '5px').fadeIn();
				}
			});
		}
		// Animate for channel page.
		else {
			elemChatButton.css('float', 'right').animate({'width': '128px'}, {
				complete: function () {
					elemEmoteButton.fadeIn();
				}
			});
		}

		// Create emote menu.
		elemEmoteMenu = $('<div class="dropmenu" id="chat_emote_dropmenu"></div>');
		elemEmoteMenu.html([
			'<h4 class="draggable">Popular Emotes</h4>',
			'<div class="scroll emotes-popular">',
			'	<div class="tse-content emotes-container"></div>',
			'</div>',
			'<h4>All Emotes</h4>',
			'<div class="scroll scroll-dark emotes-all">',
			'	<div class="tse-content emotes-container"></div>',
			'</div>',
			'<p class="dropmenu_alt_section">',
			'	<a class="left icon github" href="https://github.com/cletusc/Userscript--Twitch-Chat-Emotes" target="_blank" title="Visit the Github homepage"></a>',
			'	<a class="reset" title="Reset the popularity of the emotes back to default">Reset Popularity</a>',
			'	<a class="right icon resize-handle"></a>',
			'</p>'
		].join('\n'));
		elemEmoteMenu.appendTo(document.body);
	}

	/**
	 * Bind event listeners.
	 */
	function bindListeners() {
		// Handle popup.
		elemEmoteButton.popup('click_to_close', elemEmoteMenu, {
			above: true
		});

		// Toggle buttons.
		elemEmoteButton.on('click', function () {
			elemEmoteMenu.removeClass('has_moved');
			$(this).toggleClass('toggled');
			populateEmotesMenu();
		});

		// Restore outside clicks to close popup, but only when it hasn't been moved.
		elemEmoteMenu.on('clickoutside', function () {
			if (!$(this).hasClass('has_moved') && $(this).is(':visible')) {
				elemEmoteButton.click();
			}
		});

		// Make draggable.
		elemEmoteMenu.draggable({
			handle: 'h4.draggable',
			start: function () {
				$(this).addClass('has_moved');
			}
		});

		// Make resizable.
		var originalX,
			originalY,
			originalHeight,
			originalWidth,
			elemEmotesAll = elemEmoteMenu.find('.emotes-all');
		function adjustSize(evt) {
			var diffX = evt.pageX - originalX,
				diffY = evt.pageY - originalY;
			elemEmoteMenu.width(originalWidth + diffX);
			elemEmotesAll.height(originalHeight + diffY);
		}
		elemEmoteMenu.find('.resize-handle').on('mousedown', function (evt) {
			// Prevent text selection.
			evt.preventDefault();
			elemEmoteMenu.addClass('has_moved');
			originalX = evt.pageX;
			originalY = evt.pageY;
			originalWidth = elemEmoteMenu.width();
			originalHeight = elemEmotesAll.height();
			$(document).on('mousemove', '*', adjustSize);
		});
		$(document).on('mouseup', function () {
			$(document).off('mousemove', '*', adjustSize);
		});

		// Enable the popularity reset.
		elemEmoteMenu.find('.dropmenu_alt_section a.reset').on('click', function () {
			emotePopularityClear();
			populateEmotesMenu();
		});

		// Create scroll function if needed.
		if (!$().TrackpadScrollEmulator) {
			/**
			 * TrackpadScrollEmulator
			 * Version: 1.0.2
			 * Author: Jonathan Nicol @f6design
			 * https://github.com/jnicol/trackpad-scroll-emulator
			 *
			 * The MIT License
			 *
			 * Copyright (c) 2012-2013 Jonathan Nicol
			 *
			 * Permission is hereby granted, free of charge, to any person obtaining a copy
			 * of this software and associated documentation files (the "Software"), to deal
			 * in the Software without restriction, including without limitation the rights
			 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
			 * copies of the Software, and to permit persons to whom the Software is
			 * furnished to do so, subject to the following conditions:
			 *
			 * The above copyright notice and this permission notice shall be included in
			 * all copies or substantial portions of the Software.
			 *
			 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
			 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
			 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
			 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
			 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
			 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
			 * THE SOFTWARE.
			 */(function(e){function n(n,r){function m(){if(s.hasClass("horizontal")){h="horiz";p="scrollLeft";d="width";v="left"}s.prepend('<div class="tse-scrollbar"><div class="drag-handle"></div></div>');a=s.find(".tse-scrollbar");f=s.find(".drag-handle");if(r.wrapContent){u.wrap('<div class="tse-scroll-content" />')}o=s.find(".tse-scroll-content");N();s.on("mouseenter",S);f.on("mousedown",g);o.on("scroll",w);E()}function g(t){t.preventDefault();var n=t.pageY;if(h==="horiz"){n=t.pageX}l=n-f.offset()[v];e(document).on("mousemove",y);e(document).on("mouseup",b)}function y(e){e.preventDefault();var t=e.pageY;if(h==="horiz"){t=e.pageX}var n=t-a.offset()[v]-l;var r=n/a[d]();var i=r*u[d]();o[p](i)}function b(){e(document).off("mousemove",y);e(document).off("mouseup",b)}function w(e){S()}function E(){var e=u[d]();var t=o[p]();var n=a[d]();var r=n/e;var i=Math.round(r*t)+2;var s=Math.floor(r*(n-2))-2;if(n<e){if(h==="vert"){f.css({top:i,height:s})}else{f.css({left:i,width:s})}a.show()}else{a.hide()}}function S(){E();x()}function x(){f.addClass("visible");if(typeof c==="number"){window.clearTimeout(c)}c=window.setTimeout(function(){T()},1e3)}function T(){f.removeClass("visible");if(typeof c==="number"){window.clearTimeout(c)}}function N(){if(h==="vert"){o.width(s.width()+C());o.height(s.height())}else{o.width(s.width());o.height(s.height()+C());u.height(s.height())}}function C(){var t=e('<div class="scrollbar-width-tester" style="width:50px;height:50px;overflow-y:scroll;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');e("body").append(t);var n=e(t).innerWidth();var r=e("div",t).innerWidth();t.remove();return n-r}function k(){N();E()}function L(e,t){if(t){r[e]=t}else{return r[e]}}function A(){u.insertBefore(a);a.remove();o.remove();u.css({height:s.height()+"px","overflow-y":"scroll"});O("onDestroy");s.removeData("plugin_"+t)}function O(e){if(r[e]!==undefined){r[e].call(i)}}var i=n;var s=e(n);var o;var u=s.find(".tse-content");var a;var f;var l;var c;var h="vert";var p="scrollTop";var d="height";var v="top";r=e.extend({},e.fn[t].defaults,r);m();return{option:L,destroy:A,recalculate:k}}var t="TrackpadScrollEmulator";e.fn[t]=function(r){if(typeof arguments[0]==="string"){var i=arguments[0];var s=Array.prototype.slice.call(arguments,1);var o;this.each(function(){if(e.data(this,"plugin_"+t)&&typeof e.data(this,"plugin_"+t)[i]==="function"){o=e.data(this,"plugin_"+t)[i].apply(this,s)}else{throw new Error("Method "+i+" does not exist on jQuery."+t)}});if(o!==undefined){return o}else{return this}}else if(typeof r==="object"||!r){return this.each(function(){if(!e.data(this,"plugin_"+t)){e.data(this,"plugin_"+t,new n(this,r))}})}};e.fn[t].defaults={onInit:function(){},onDestroy:function(){},wrapContent:true}})(jQuery)
		}

		// Create custom scroll bar.
		elemEmoteMenu.find('.scroll.emotes-all').TrackpadScrollEmulator();
	}

	/**
	 * Populates the popup menu with current emote data.
	 */
	function populateEmotesMenu() {
		var container,
			height,
			elemChatLines = $('#chat_lines');

		refreshUsableEmotes();

		if (emotes.length < 1) {
			console.warn(MESSAGES.EMOTES_NOT_LOADED);
			setTimeout(populateEmotesMenu, 50);
			return;
		}

		// Remove old listeners.
		emoteListeners.forEach(function (listener) {
			listener.element.off(listener.type, listener.func);
		});
		emoteListeners = [];

		// Add popular emotes.
		container = elemEmoteMenu.find('.emotes-popular .emotes-container');
		container.html('');
		emotes.sort(sortByNormal);
		emotes.sort(sortByPopularity);
		emotes.forEach(function (emote) {
			createEmote(emote, container);
		});

		// Add all emotes.
		container = elemEmoteMenu.find('.emotes-all .emotes-container');
		container.html('');
		emotes.sort(sortByNormal);
		emotes.sort(sortBySet);
		emotes.forEach(function (emote) {
			createEmote(emote, container);
		});

		// Adjust dimensions if the menu hasn't been moved.
		if (!elemEmoteMenu.hasClass('has_moved')) {
			// Adjust the height of the popup, requires special handling due to scrolling element.
			height = elemEmoteMenu.outerHeight() - elemEmoteMenu.find('.emotes-all').outerHeight();
			height = elemChatLines.height() - height;
			elemEmoteMenu.find('.emotes-all').height(height);

			// Adjust the width and position of the popup.
			elemEmoteMenu.width($('#speak').outerWidth() - 12);
			elemEmoteMenu.offset(elemChatLines.offset());
		}

		/**
		 * Sort by popularity: most used -> least used
		 */
		function sortByPopularity(a, b) {
			var aGet = emotePopularityGet(a.text),
				bGet = emotePopularityGet(b.text),
				aNumber = typeof aGet === 'number',
				bNumber = typeof bGet === 'number';
			if (aNumber && !bNumber) {
				return -1;
			}
			if (bNumber && !aNumber) {
				return 1;
			}
			if (aGet < bGet) {
				return 1;
			}
			if (aGet > bGet) {
				return -1;
			}
			return 0;
		}

		/**
		 * Sort by alphanumeric in this order: symbols -> numbers -> AaBb... -> numbers
		 */
		function sortByNormal(a, b){
			a = a.text;
			b = b.text;
			var aTest = /[\W]/.test(a),
				bTest = /[\W]/.test(b);
			if (aTest && !bTest) {
				return -1;
			}
			if (bTest && !aTest) {
				return 1;
			}
			if (a.toLowerCase() < b.toLowerCase()) {
				return -1;
			}
			if (a.toLowerCase() > b.toLowerCase()) {
				return 1;
			}
			if (a < b) {
				return -1;
			}
			if (a > b) {
				return 1;
			}
			return 0;
		}

		/**
		 * Sort by emoticon set: basic smileys -> no set -> set 0-9...
		 */
		function sortBySet(a, b){
			if (a.image && !b.image) {
				return 1;
			}
			if (b.image && !a.image) {
				return -1;
			}
			if (a.image && b.image) {
				// Override for turbo emotes.
				if (
					(a.image.emoticon_set === 33 || a.image.emoticon_set === 42) &&
					(b.image.emoticon_set !== 33 && b.image.emoticon_set !== 42)
				) {
					return -1;
				}
				if (
					(b.image.emoticon_set === 33 || b.image.emoticon_set === 42) &&
					(a.image.emoticon_set !== 33 && a.image.emoticon_set !== 42)
				) {
					return 1;
				}
				// Override for basic emotes.
				var basicEmotes = [':(', ':)', ':/', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o'];
				if (basicEmotes.indexOf(a.text) >= 0 &&	basicEmotes.indexOf(b.text) < 0) {
					return -1;
				}
				if (basicEmotes.indexOf(b.text) >= 0 &&	basicEmotes.indexOf(a.text) < 0) {
					return 1;
				}
				// Sort by set number.
				if (a.image.emoticon_set < b.image.emoticon_set) {
					return -1;
				}
				if (a.image.emoticon_set > b.image.emoticon_set) {
					return 1;
				}
			}
			return 0;
		}
	}

	function refreshUsableEmotes() {
		emotes = [];
		emotesRaw.forEach(function (emote) {
			var defaultImage = false;
			emote.images.forEach(function (image) {
				if (image.emoticon_set === null) {
					defaultImage = image;
				}
				if (userInfo.emoteSets.indexOf(image.emoticon_set) >= 0) {
					emote.image = image;
				}
			});

			// No emotes from sets.
			if (!emote.image) {
				// Use the non-set emote if available.
				if (defaultImage) {
					emote.image = defaultImage;
				}
			}
			emotes.push(emote);
		});
	}

	/**
	 * Adds / sets popularity of an emote. Note: saves popularity data to storage each time this is called.
	 * @param {string} text          The text of the emote (e.g. "Kappa").
	 * @param {number} [forceAmount] The amount of popularity to force the emote to have. If not specificed, popularity will increase by 1.
	 */
	function emotePopularityAdd(text, forceAmount) {
		emotePopularityInit();
		if (emotePopularity[text] === undefined) {
			emotePopularity[text] = 0;
		}
		if (typeof forceAmount === 'number' && forceAmount >= 0) {
			emotePopularity[text] = forceAmount;
		}
		else {
			emotePopularity[text]++;
		}
		setSetting('emote-popularity-tracking', JSON.stringify(emotePopularity));
	}

	/**
	 * Gets the current popularity of an emote.
	 * @param  {string} text The text of the emote (e.g. "Kappa").
	 * @return {number}      The amount of popularity. Possible to be 0 if it has been forced.
	 * @return {boolean}     `false` if the emote is not in the popularity tracking data (never been added by `emotePopularityAdd`).
	 */
	function emotePopularityGet(text) {
		emotePopularityInit();
		if (typeof emotePopularity[text] === 'number' && emotePopularity[text] >= 0) {
			return emotePopularity[text];
		}
		return false;
	}

	/**
	 * Clears the current emote popularity tracking data.
	 */
	function emotePopularityClear() {
		deleteSetting('emote-popularity-tracking');
		emotePopularity = false;
		emotePopularityInit();
	}

	/**
	 * Initiates the popularity tracking. This will pull data from storage, or if none exists, set some common defaults.
	 */
	function emotePopularityInit() {
		if (!emotePopularity) {
			emotePopularity = JSON.parse(getSetting('emote-popularity-tracking', '{}'));
			emotePopularityAdd('BibleThump', 0);
			emotePopularityAdd('DansGame', 0);
			emotePopularityAdd('FailFish', 0);
			emotePopularityAdd('Kappa', 0);
			emotePopularityAdd('Kreygasm', 0);
			emotePopularityAdd('SwiftRage', 0);
		}
	}

	/**
	 * Inserts an emote into the chat box.
	 * @param {string} text The text of the emote (e.g. "Kappa").
	 */
	function insertEmoteText(text) {
		emotePopularityAdd(text);
		// Get input.
		var element = document.querySelector('#chat_text_input');

		// Insert at cursor / replace selection.
		// https://developer.mozilla.org/en-US/docs/Code_snippets/Miscellaneous
		var selectionEnd = element.selectionStart + text.length;
		var currentValue = element.value;
		var beforeText = currentValue.substring(0, element.selectionStart);
		var afterText = currentValue.substring(element.selectionEnd, currentValue.length);
		// Smart padding, only put space at start if needed.
		if (
			beforeText !== '' &&
			beforeText.substr(-1) !== ' '
		) {
			text = ' ' + text;
		}
		// Always put space at end.
		text += ' ';
		// Set the text.
		element.value = beforeText + text + afterText;
		element.focus();
		// Put cursor at end.
		selectionEnd = element.selectionStart + text.length;
		element.setSelectionRange(selectionEnd, selectionEnd);

		// Close popup if it hasn't been moved by the user.
		if (!elemEmoteMenu.hasClass('has_moved')) {
			elemEmoteButton.click();
		}
		// Re-populate as it is still open.
		else {
			populateEmotesMenu();
		}
	}

	/**
	 * Creates the emote element and listens for a click event that will add the emote text to the chat.
	 * @param {object}  emote     The emote that you want to add. This object should be one coming from `emotes`.
	 * @param {element} container The HTML element that the emote should be appended to.
	 */
	function createEmote(emote, container) {
		// Emote not usable or no container, can't add.
		if (!emote || !emote.image || !container.length) {
			return;
		}

		// Create element.
		var element = $('<div class="userscript_emoticon"></div>');
		element.html(emote.image.html);

		element.attr('data-emote', emote.text);
		if (emote.image.emoticon_set) {
			element.attr('data-emote-set', emote.image.emoticon_set);
		}
		element.attr('title', emote.text);
		container.append(element);

		// Add listeners.
		var listener = {
			'element': element,
			'func': function () {
				insertEmoteText(emote.text);
			},
			'type': 'click'
		};
		listener.element.on(listener.type, listener.func);
		emoteListeners.push(listener);
	}

	/**
	 * Adds the base style.
	 */
	function addBaseStyle() {
		var icons = {
			dropmenuButton: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAQCAYAAADwMZRfAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAOtJREFUOE+NkLERgzAMRdkgS2QGpvAYqVNRpmMDimyRo2YiVqBz/ncknSTIAXfvwPL/L467WmtgGIYeTGA5gPM+d8ICgdc4jvUM5nzPC3oG5nk+RUR2IpNg43NU+AfzQYLnfvUUCvPsmaSU8lYJjlmxbm9fynPm2WsS/jduqoTfipfkuUja3VDy5EIluqlrJc91zX63bVs4yVVUwn67E3zYnVyFefbsYvHcMFx9IEvzjHn2TCKneaTQDr/HvHZNQrC5+vARIlx9L0hgLxIKv+zKDeZ8L0gIA6CdKMN5FpCw8IhsAou8d+UftfsCjtrm7yD1aJgAAAAASUVORK5CYII=',
			resizeHandle: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAX0lEQVQ4T6WPUQ7AIAhDPfpuzuyHxpGK7SR5IVYeCS0irqChAw0daOhAQwcaijyAfShARv1aMOWOfcJHBnmgIsvo8glMRkkLtnLneEIpg3U4c5LRtycoMqpcMIaLd7QXl2chH51cR7QAAAAASUVORK5CYII=',
			// "The mark": inverted color to suit dark theme and resized to 16x16.
			// @attribution Github, Inc. (https://github.com/logos)
			github: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiIAAC4iAari3ZIAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAWpJREFUOE+F0ssrRGEYx/EZBhs2ssHCrCasFf4DFiKyERuytRMZESl3WxsbK0s2FlKKxkIJOyRpEgtyv19yfH/H87qm86tPvee9POd5z0zodzzPK8I4NnFuNjCKmG37GxbTMYEXrKMb9aYHKviMYaTZsY8wocPzOEENbOUrzIWhYmeYQ8SW/MUxnKICekMhNJ+FTBvraiOohK414A7HoNbqUAvlCcd4NRprj1KFBmhPVAWGsAXXYlCqkYJt9KnAGvrhxkFJWOe66ooGaq8REdwgKBdQBy1IqsARmqArqFhQktC5VhxosIpBa2sKQZm0vfrPLGmg++uD5KAYKvhflpGNVOwjrgIFeEAbZhFFGXbhkkAJwvZ2tX+HPD1rohdXtnAI/axvcPE/nO0thT52p39Y4UEtzeAS7SjHI1zUYQaacY1p+AU/w4SKxHEPfRP9A1003sEt9IKfh7+HxXx0YRF7ZgEdyLVtllDoHUPsDkVplXakAAAAAElFTkSuQmCC'
		},
		// Base style.
		css = [
			'#chat_emote_dropmenu_button span {',
			'	background: url("' + icons.dropmenuButton + '") no-repeat 50%;',
			'	cursor: pointer;',
			'}',
			'#chat_emote_dropmenu_button.toggled {',
			'	box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.65);',
			'	-moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.65);',
			'	-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.65);',
			'	border-top: 1px solid rgba(0, 0, 0, 0.35);',
			'	border-left: 1px solid rgba(0, 0, 0, 0.3);',
			'	border-right: 1px solid rgba(0, 0, 0, 0.3);',
			'	border-bottom: 1px solid rgba(0, 0, 0, 0.3);',
			'	background: url("../images/xarth/dropdown_arrow.png") no-repeat right center, -webkit-gradient(linear, left top, left bottom, from(#ddd), to(#bbb));',
			'	background: url("../images/xarth/dropdown_arrow.png") no-repeat right center, -moz-linear-gradient(top, #ddd, #bbb);',
			'	background: url("../images/xarth/dropdown_arrow.png") no-repeat right center, -o-linear-gradient(top, #ddd, #bbb);',
			'	background: url("../images/xarth/dropdown_arrow.png") no-repeat right center, linear-gradient(top, #ddd, #bbb);',
			'	background-color: #ccc;',
			'}',
			'#chat_emote_dropmenu {',
			'	padding: 5px;',
			'}',
			'#chat_emote_dropmenu:hover {',
			'	background-color: #202020;',
			'	transition: background-color 0.25s;',
			'}',
			'#chat_emote_dropmenu .tse-scroll-content {',
			'	right: -17px;',
			'}',
			'#chat_emote_dropmenu h4 {',
			'	text-align: center;',
			'	padding: 3px;',
			'}',
			'#chat_emote_dropmenu .emotes-popular {',
			'	height: 38px;',
			'}',
			'#chat_emote_dropmenu h4.draggable:hover {',
			'	background-color: rgba(255, 255, 255, 0.1);',
			'	border-radius: 5px;',
			'	cursor: move;',
			'}',
			'#chat_emote_dropmenu .userscript_emoticon {',
			'	display: inline-block;',
			'	padding: 2px;',
			'	margin: 1px;',
			'	cursor: pointer;',
			'	border-radius: 5px;',
			'	text-align: center;',
			'	width: 32px;',
			'}',
			'#chat_emote_dropmenu .userscript_emoticon .emoticon {',
			'	max-width: 32px;',
			'	margin: 0 !important;',
			'	height: 32px;',
			'	background-size: contain;',
			'}',
			'#chat_emote_dropmenu .userscript_emoticon:hover {',
			'	background-color: rgba(255, 255, 255, 0.1);',
			'}',
			'#chat_emote_dropmenu .dropmenu_alt_section a {',
			'	cursor: pointer;',
			'}',
			'#chat_emote_dropmenu .dropmenu_alt_section .left {',
			'	float: left;',
			'	margin-right: 5px;',
			'}',
			'#chat_emote_dropmenu .dropmenu_alt_section .right {',
			'	float: right;',
			'	margin-left: 5px;',
			'}',
			'#chat_emote_dropmenu .dropmenu_alt_section a.icon {',
			'	height: 16px;',
			'	width: 16px;',
			'	opacity: 0.5;',
			'}',
			'#chat_emote_dropmenu .dropmenu_alt_section a.icon:hover {',
			'	opacity: 1.0;',
			'}',
			'#chat_emote_dropmenu .dropmenu_alt_section a.github {',
			'	background: url("' + icons.github + '") no-repeat 50%;',
			'}',
			'#chat_emote_dropmenu .dropmenu_alt_section a.resize-handle {',
			'	background: url("' + icons.resizeHandle + '") no-repeat 50%;',
			'	cursor: nwse-resize;',
			'}'
		],
		fixedEmotes = {
			'DansGame': 'http://i.imgur.com/qonn0aV.png'
		};

		// Fix white-background emotes.
		for (var emote in fixedEmotes) {
			if (fixedEmotes.hasOwnProperty(emote)) {
				css.push('#chat_emote_dropmenu .userscript_emoticon[data-emote="' + emote + '"] .emoticon { background-image: url("' + fixedEmotes[emote] + '") !important; }');
			}
		}
		addStyle(css.join('\n'));
	}

	/**
	 * Add style for set-unique background colors.
	 */
	function addSetStyle() {
		var css = [],
			sets = {};
		emotesRaw.forEach(function (emote) {
			emote.images.forEach(function (image) {
				if (image.emoticon_set !== null && !sets[image.emoticon_set]) {
					sets[image.emoticon_set] = '#chat_emote_dropmenu .userscript_emoticon[data-emote-set="' + image.emoticon_set + '"] { background-color: hsla(' + (image.emoticon_set * 90) + ', 100%, 50%, 0.1) !important; }';
					sets[image.emoticon_set] += '#chat_emote_dropmenu .userscript_emoticon[data-emote-set="' + image.emoticon_set + '"]:hover { background-color: hsla(' + (image.emoticon_set * 90) + ', 100%, 50%, 0.2) !important; }';
				}
			});
		});
		for (var set in sets) {
			if (sets.hasOwnProperty(set)) {
				css.push(sets[set]);
			}
		}
		addStyle(css.join('\n'));
	}

	// Generic functions.
	//-------------------
	/**
	 * Adds a stylesheet to the document.
	 * @param {string} text The styles to be added.
	 */
	function addStyle(text) {
		var style = document.createElement('style');
		style.textContent = text;
		document.querySelector('head').appendChild(style);
	}

	/**
	 * Gets a storage value.
	 * @param  {string} aKey     The key you want to get.
	 * @param  {mixed}  aDefault The default value to return if there isn't anything in storage.
	 * @return {mixed}           The value in storage or `aDefault` if there isn't anything in storage.
	 */
	function getSetting(aKey, aDefault) {
		var val = localStorage.getItem(aKey);
		if (val === null && typeof aDefault !== 'undefined') {
			return aDefault;
		}
		return val;
	}
	/**
	 * Sets a storage value.
	 * @param {string} aKey The key you want to set.
	 * @param {mixed}  aVal The value you want to store.
	 */
	function setSetting(aKey, aVal) {
		localStorage.setItem(aKey, aVal);
	}

	/**
	 * Deletes a storage key.
	 * @param {string} aKey The key you want to set.
	 */
	function deleteSetting(aKey) {
		localStorage.removeItem(aKey);
	}

// End wrapper.
})(this.unsafeWindow || window, window.chrome ? true : false);
