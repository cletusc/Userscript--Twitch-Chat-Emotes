// ==UserScript==
// @name Twitch Chat Emotes
// @namespace #Cletus
// @version 0.6.4
// @description Adds a button to Twitch that allows you to "click-to-insert" an emote.
// @copyright 2011+, Ryan Chatham <ryan.b.chatham@gmail.com> (https://github.com/cletusc)
// @author Ryan Chatham <ryan.b.chatham@gmail.com> (https://github.com/cletusc)
// @icon http://www.gravatar.com/avatar.php?gravatar_id=6875e83aa6c563790cb2da914aaba8b3&r=PG&s=48&default=identicon
// @license MIT; http://opensource.org/licenses/MIT
// @license CC BY-NC-SA 3.0; http://creativecommons.org/licenses/by-nc-sa/3.0/
// @homepage http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/
// @supportURL https://github.com/cletusc/Userscript--Twitch-Chat-Emotes/issues
// @contributionURL http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/#donate
// @grant none
// @include http://*.twitch.tv/*
// @exclude http://api.twitch.tv/*
// @exclude http://chatdepot.twitch.tv/*
// @exclude http://*.twitch.tv/*/profile*
// ==/UserScript==

/* Script compiled using build script. Script uses Browserify for CommonJS modules. */

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var templates = require('./modules/templates');
var pkg = require('../package.json');
var storage = require('./modules/storage');
var api = require('./modules/api');

var $ = null;
var jQuery = null;

// Script-wide variables.
//-----------------------
var url = require('url');
var emotes = {
	usable: [],
	get raw() {
		if (window.App) {
			return window.App.__container__.lookup('controller:emoticons').get('emoticons');
		}
		return [];
	},
	subscriptions: {
		badges: {},
		emotes: {}
	}
};
var isInitiated = false;

// DOM elements.
var elements = {
	// The button to send a chat message.
	chatButton: null,
	// The area where all chat messages are contained.
	chatContainer: null,
	// The input field for chat messages.
	chatBox: null,
	// The button used to show the menu.
	menuButton: null,
	// The menu that contains all emotes.
	menu: null
};

var SCRIPT_NAME = pkg.userscript.name;
var MESSAGES = {
	NO_CHAT_ELEMENT: 'There is no chat element on the page, unable to continue.',
	OBJECTS_NOT_LOADED: 'Needed objects haven\'t loaded yet.',
	TIMEOUT_SCRIPT_LOAD: 'Script took too long to load. Refresh to try again.'
};

// The basic smiley emotes.
var basicEmotes = [':(', ':)', ':/', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o', '#/', ':7', ':>', ':S', '<]'];

var helpers = {
	user: {
		/**
		 * Check if user is logged in, and prompts them to if they aren't.
		 * @return {boolean} `true` if logged in, `false` if logged out.
		 */
		login: function () {
			// Check if logged in already.
			if (window.Twitch && window.Twitch.user.isLoggedIn()) {
				return true;
			}
			// Not logged in, call Twitch's login method.
			$.login();
			return false;
		},
		getEmoteSets: function () {
			var sets = [];
			try {
				sets = App.__container__
					.lookup('controller:chat')
					.get('currentRoom')
					.get('tmiRoom')
					.getEmotes(Twitch.user.login());

				sets = sets.filter(function (val) {
					return typeof val === 'number' && val >= 0;
				});
				return sets;
			}
			catch (err) {
				return [];
			}
		}
	}
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
	$ = jQuery = window.jQuery;
	var routes = window.App && (window.App.ChannelRoute || window.App.ChatRoute);
	var objectsLoaded = (
		window.Twitch !== undefined &&
		(
			window.App !== undefined &&
			window.App.__container__ !== undefined &&
			window.App.__container__.lookup('controller:emoticons').get('emoticons') !== undefined &&
			window.App.__container__.lookup('controller:emoticons').get('emoticons').length
		) &&
		jQuery !== undefined &&
		// Chat button.
		document.querySelector('#chat_speak, .send-chat-button')
	);
	if (!isInitiated && routes) {
		var activate = {
			activate: function () {
				this._super();
				init(50);
			}
		};

		if (window.App.ChannelRoute) {
			window.App.ChannelRoute.reopen(activate);
			isInitiated = true;
		}
		if (window.App.ChatRoute) {
			window.App.ChatRoute.reopen(activate);
			isInitiated = true;
		}
	}
	if (!objectsLoaded || !routes) {
		// Errors in approximately 102400ms.
		if (time >= 60000) {
			console.error(MESSAGES.TIMEOUT_SCRIPT_LOAD);
			return;
		}
		if (time >= 10000) {
			if (!objectsLoaded) {
				console.warn(MESSAGES.OBJECTS_NOT_LOADED);
			}
		}
		setTimeout(init, time, time * 2);
		return;
	}
	setup();
})(50);

// Start of functions.
//--------------------
/**
 * Runs initial setup of DOM and variables.
 */
function setup() {
	// Load CSS.
	require('../build/styles');
	// Load jQuery plugins.
	require('./plugins/resizable');
	require('jquery-custom-scrollbar/jquery.custom-scrollbar');
	
	elements.chatButton = $('.send-chat-button');
	elements.chatBox = $('.chat-interface textarea');
	elements.chatContainer = $('.chat-messages');

	// No chat, just exit.
	if (!elements.chatButton.length) {
		console.warn(MESSAGES.NO_CHAT_ELEMENT);
		return;
	}

	createMenuElements();
	bindListeners();

	// Get active subscriptions.
	api.getTickets(function (tickets) {
		tickets.forEach(function (ticket) {
			var product = ticket.product;
			var channel = product.owner_name || product.short_name;
			// Get subscriptions with emotes.
			if (product.emoticons && product.emoticons.length) {
				// Add emotes channel.
				product.emoticons.forEach(function (emote) {
					emotes.subscriptions.emotes[getEmoteFromRegEx(new RegExp(emote.regex))] = {
						channel: channel,
						url: emote.url
					};
				});

				// Get badge.
				api.getBadges(channel, function (badges) {
					var badge = '';
					if (channel === 'turbo') {
						badge = badges.turbo.image;
					}
					else if (badges.subscriber && badges.subscriber.image) {
						badge = badges.subscriber.image;
					}
					emotes.subscriptions.badges[channel] = badge;
				});
			}
		});
	});
}

/**
 * Creates the initial menu elements
 */
function createMenuElements() {
	// Remove menu button if found.
	elements.menuButton = $('#emote-menu-button');
	if (elements.menuButton.length) {
		elements.menuButton.remove();
	}
	// Create menu button.
	elements.menuButton = $(templates.emoteButton());
	elements.menuButton.insertBefore(elements.chatButton);
	elements.menuButton.hide();
	elements.menuButton.fadeIn();

	// Remove menu if found.
	elements.menu = $('#emote-menu-for-twitch');
	if (elements.menu.length) {
		elements.menu.remove();
	}
	// Create menu.
	elements.menu = $(templates.menu());
	elements.menu.appendTo(document.body);
}

/**
 * Bind event listeners.
 */
function bindListeners() {

	function toggleMenu() {
		// Menu shown, hide it.
		if (elements.menu.is(':visible')) {
			elements.menu.hide();
			elements.menu.removeClass('pinned');
			elements.menu.removeClass('editing');
			elements.menuButton.removeClass('active');
		}
		// Menu hidden, show it.
		else if (helpers.user.login()) {
			populateEmotesMenu();
			elements.menu.show();
			elements.menuButton.addClass('active');

			$(document).on('mouseup', checkForClickOutside);

			// Menu moved, move it back.
			if (elements.menu.hasClass('moved')) {
				elements.menu.offset(JSON.parse(elements.menu.attr('data-offset')));
			}
			// Never moved, make it the same size as the chat window.
			else {
				var diff = elements.menu.height() - elements.menu.find('#all-emotes-group').height();
				// Adjust the size and position of the popup.
				elements.menu.height(elements.chatContainer.outerHeight() - (elements.menu.outerHeight() - elements.menu.height()));
				elements.menu.width(elements.chatContainer.outerWidth() - (elements.menu.outerWidth() - elements.menu.width()));
				elements.menu.offset(elements.chatContainer.offset());
				// Fix `.emotes-all` height.
				elements.menu.find('#all-emotes-group').height(elements.menu.height() - diff);
				elements.menu.find('#all-emotes-group').width(elements.menu.width());
			}
			// Recalculate any scroll bars.
			elements.menu.find('.scrollable').customScrollbar('resize');
		}

		function checkForClickOutside(e) {
			// Not outside of the menu, ignore the click.
			if ($(e.target).is('#emote-menu-for-twitch, #emote-menu-for-twitch *')) {
				return;
			}
			// Clicked on the menu button, just remove the listener and let the normal listener handle it.
			if (!elements.menu.is(':visible') || $(e.target).is('#emote-menu-button, #emote-menu-button *')) {
				$(document).off('mouseup', checkForClickOutside);
				return;
			}
			// Clicked outside, make sure the menu isn't pinned.
			if (!elements.menu.hasClass('pinned')) {
				// Menu wasn't pinned, remove listener.
				$(document).off('mouseup', checkForClickOutside);
				toggleMenu();
			}
		}
	}

	// Toggle menu.
	elements.menuButton.on('click', toggleMenu);

	// Make draggable.
	elements.menu.draggable({
		handle: '.draggable',
		start: function () {
			$(this).addClass('pinned');
			$(this).addClass('moved');
		},
		stop: function () {
			elements.menu.attr('data-offset', JSON.stringify(elements.menu.offset()));
		},
		containment: $(document.body)
	});

	elements.menu.resizable({
		handle: '[data-command="resize-handle"]',
		resize: function () {
			// Recalculate any scroll bars.
			elements.menu.find('.scrollable').customScrollbar('resize');
		},
		stop: function () {
			$(this).addClass('pinned');
			$(this).addClass('moved');
		},
		alsoResize: elements.menu.find('.scrollable'),
		containment: $(document.body),
		minHeight: 180,
		minWidth: 200
	});

	// Enable the popularity reset.
	elements.menu.find('[data-command="reset-popularity"]').on('click', function () {
		storage.popularity.removeAll();
		populateEmotesMenu();
	});

	// Enable menu pinning.
	elements.menu.find('[data-command="toggle-pinned"]').on('click', function () {
		elements.menu.toggleClass('pinned');
	});

	// Enable menu editing.
	elements.menu.find('[data-command="toggle-editing"]').on('click', function () {
		elements.menu.toggleClass('editing');
		// Recalculate any scroll bars.
		elements.menu.find('.scrollable').customScrollbar('resize');
	});

	// Enable emote clicking (delegated).
	elements.menu.on('click', '.emote', function () {
		if (elements.menu.is('.editing')) {
			return;
		}
		insertEmoteText($(this).attr('data-emote'));
	});

	// Enable emote hiding (delegated).
	elements.menu.on('click', '[data-command="toggle-visibility"]', function () {
		// Make sure we are in edit mode.
		if (!elements.menu.is('.editing')) {
			return;
		}
		var which = $(this).attr('data-which');
		var isVisible = storage.visibility.get(which, true);
		// Toggle visibility.
		storage.visibility.set(which, !isVisible);
		populateEmotesMenu();
	});

	elements.menu.find('.scrollable').customScrollbar({
		skin: 'default-skin',
		hScroll: false,
		preventDefaultScroll: true
	});
}

/**
 * Populates the popup menu with current emote data.
 */
function populateEmotesMenu() {
	var container;

	refreshUsableEmotes();

	// Add popular emotes.
	container = elements.menu.find('#popular-emotes-group');
	container.html('');
	emotes.usable.sort(sortByPopularity);
	emotes.usable.forEach(function (emote) {
		createEmote(emote, container);
	});

	// Add all emotes.
	container = elements.menu.find('#all-emotes-group');
	if (container.find('.overview').length) {
		container = container.find('.overview');
	}
	container.html('');
	emotes.usable.sort(sortBySet);
	emotes.usable.forEach(function (emote) {
		createEmote(emote, container, true);
	});

	/**
	 * Sort by popularity: most used -> least used
	 */
	function sortByPopularity(a, b) {
		var aGet = Number(storage.popularity.get(a.text, 0));
		var bGet = Number(storage.popularity.get(b.text, 0));
		if (aGet < bGet) {
			return 1;
		}
		if (aGet > bGet) {
			return -1;
		}
		return sortByNormal(a, b);
	}

	/**
	 * Sort by alphanumeric in this order: symbols -> numbers -> AaBb... -> numbers
	 */
	function sortByNormal(a, b){
		a = a.text;
		b = b.text;
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
	 * Sort by emoticon set: basic smileys -> no set -> subscription emotes
	 */
	function sortBySet(a, b){
		// Override for basic emotes.
		if (basicEmotes.indexOf(a.text) >= 0 &&	basicEmotes.indexOf(b.text) < 0) {
			return -1;
		}
		if (basicEmotes.indexOf(b.text) >= 0 &&	basicEmotes.indexOf(a.text) < 0) {
			return 1;
		}
		// Sort by channel name.
		if (a.channel && !b.channel) {
			return 1;
		}
		if (b.channel && !a.channel) {
			return -1;
		}
		if (a.channel && b.channel) {
			// Force addon emote groups below standard Twitch groups.
			if (emotes.subscriptions.badges[a.channel] && !emotes.subscriptions.badges[b.channel]) {
				return -1;
			}
			if (emotes.subscriptions.badges[b.channel] && !emotes.subscriptions.badges[a.channel]) {
				return 1;
			}

			var channelSort = sortByNormal({text: a.channel}, {text: b.channel});
			var normalSort = sortByNormal(a, b);
			if (channelSort === 0) {
				return normalSort;
			}
			return channelSort;
		}
		// Get it back to a stable sort.
		return sortByNormal(a, b);
	}
}

/**
 * Refreshes the usable emotes. An emote is deemed usable if it either has no set or the set is in your user info. For turbo sets, it will use the turbo if in your user info, otherwise fall back to default.
 */
function refreshUsableEmotes() {
	var turboSets = [457, 793];
	storage.global.set('emoteSets', helpers.user.getEmoteSets());
	emotes.usable = [];
	emotes.raw.forEach(function (emote) {
		// Allow hiding of emotes from the menu.
		if (emote.hidden) {
			return;
		}
		if (!emote.text) {
			emote.text = getEmoteFromRegEx(emote.regex);
		}
		if (emotes.subscriptions.emotes[emote.text]) {
			emote.channel = emotes.subscriptions.emotes[emote.text].channel;
		}
		var defaultImage;
		emote.images.some(function (image) {
			if (image.emoticon_set === null) {
				defaultImage = image;
			}
			if (
				// Image is the same URL as the subscription emote.
				(emotes.subscriptions.emotes[emote.text] && image.url === emotes.subscriptions.emotes[emote.text].url) ||
				(storage.global.get('emoteSets', []).indexOf(image.emoticon_set) >= 0) ||
				// Emote is forced to show.
				emote.hidden === false
			) {
				if (turboSets.indexOf(image.emoticon_set) >= 0) {
					emote.channel = 'turbo';
				}
				emote.image = image;
				return true;
			}
		});
		emote.image = emote.image || defaultImage;

		// Only add the emote if there is a URL.
		if (emote.image && emote.image.url !== null) {
			// Determine if emote is from a third-party addon.
			emote.isThirdParty = url.parse(emote.image.url).hostname !== 'static-cdn.jtvnw.net';
			// Determine if emote is hidden by user.
			emote.isVisible = storage.visibility.get('channel-' + emote.channel, true) && storage.visibility.get(emote.text, true);
			
			emotes.usable.push(emote);
		}
	});
}

/**
 * Inserts an emote into the chat box.
 * @param {string} text The text of the emote (e.g. "Kappa").
 */
function insertEmoteText(text) {
	storage.popularity.set(text, Number(storage.popularity.get(text, 0)) + 1);
	// Get input.
	var element = document.querySelector('#chat_text_input, .chat-interface textarea');

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
	text = beforeText + text + ' ' + afterText;
	// Set the text.
	window.App.__container__.lookup('controller:chat').get('currentRoom').set('messageToSend', text);
	element.focus();
	// Put cursor at end.
	selectionEnd = element.selectionStart + text.length;
	element.setSelectionRange(selectionEnd, selectionEnd);

	// Close popup if it hasn't been moved by the user.
	if (!elements.menu.hasClass('pinned')) {
		elements.menuButton.click();
	}
	// Re-populate as it is still open.
	else {
		populateEmotesMenu();
	}
}

/**
 * Creates the emote element and listens for a click event that will add the emote text to the chat.
 * @param {object}  emote      The emote that you want to add. This object should be one coming from `emotes`.
 * @param {element} container  The HTML element that the emote should be appended to.
 * @param {boolean} showHeader Whether a header shouldbe created if found. Only creates the header once.
 */
function createEmote(emote, container, showHeader) {
	// Emote not usable or no container, can't add.
	if (!emote || !emote.image || !container.length) {
		return;
	}
	if (showHeader) {
		if (emote.channel && basicEmotes.indexOf(emote.text) < 0) {
			var badge = emotes.subscriptions.badges[emote.channel] || emote.badge;
			if (!elements.menu.find('.group-header[data-emote-channel="' + emote.channel + '"]').length) {
				container.append(
					$(templates.emoteGroupHeader({
						badge: badge,
						channel: emote.channel,
						isVisible: storage.visibility.get('channel-' + emote.channel, true)
					}))
				);
			}
		}
	}

	var channelContainer = container.find('.group-header[data-emote-channel="' + emote.channel + '"]');
	if (channelContainer.length) {
		container = channelContainer;
	}
	container.append(
		$(templates.emote({
			image: emote.image,
			text: emote.text,
			thirdParty: emote.isThirdParty,
			isVisible: emote.isVisible
		}))
	);
}

/**
 * Gets the usable emote text from a regex.
 * @attribute http://userscripts.org/scripts/show/160183 (adaption)
 */
function getEmoteFromRegEx(regex) {
	if (typeof regex === 'string') {
		regex = new RegExp(regex);
	}
	return decodeURI(regex.source)
		.replace('&gt\\;', '>') // right angle bracket
		.replace('&lt\\;', '<') // left angle bracket
		.replace(/\(\?![^)]*\)/g, '') // remove negative group
		.replace(/\(([^|])*\|?[^)]*\)/g, '$1') // pick first option from a group
		.replace(/\[([^|])*\|?[^\]]*\]/g, '$1') // pick first character from a character group
		.replace(/[^\\]\?/g, '') // remove optional chars
		.replace(/^\\b|\\b$/g, '') // remove boundaries
		.replace(/\\/g, ''); // unescape
}

},{"../build/styles":2,"../package.json":12,"./modules/api":13,"./modules/storage":14,"./modules/templates":15,"./plugins/resizable":16,"jquery-custom-scrollbar/jquery.custom-scrollbar":10,"url":8}],2:[function(require,module,exports){
(function (doc, cssText) {
    var styleEl = doc.createElement("style");
    doc.getElementsByTagName("head")[0].appendChild(styleEl);
    if (styleEl.styleSheet) {
        if (!styleEl.styleSheet.disabled) {
            styleEl.styleSheet.cssText = cssText;
        }
    } else {
        try {
            styleEl.innerHTML = cssText;
        } catch (ignore) {
            styleEl.innerText = cssText;
        }
    }
}(document, "/**\n" +
" * Minified style.\n" +
" * Original filename: \\node_modules\\jquery-custom-scrollbar\\jquery.custom-scrollbar.css\n" +
" */\n" +
".scrollable{position:relative}.scrollable:focus{outline:0}.scrollable .viewport{position:relative;overflow:hidden}.scrollable .viewport .overview{position:absolute}.scrollable .scroll-bar{display:none}.scrollable .scroll-bar.vertical{position:absolute;right:0;height:100%}.scrollable .scroll-bar.horizontal{position:relative;width:100%}.scrollable .scroll-bar .thumb{position:absolute}.scrollable .scroll-bar.vertical .thumb{width:100%;min-height:10px}.scrollable .scroll-bar.horizontal .thumb{height:100%;min-width:10px;left:0}.not-selectable{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.scrollable.default-skin{padding-right:10px;padding-bottom:6px}.scrollable.default-skin .scroll-bar.vertical{width:6px}.scrollable.default-skin .scroll-bar.horizontal{height:6px}.scrollable.default-skin .scroll-bar .thumb{background-color:#000;opacity:.4;border-radius:3px;-moz-border-radius:4px;-webkit-border-radius:4px}.scrollable.default-skin .scroll-bar:hover .thumb{opacity:.6}.scrollable.gray-skin{padding-right:17px}.scrollable.gray-skin .scroll-bar{border:1px solid gray;background-color:#d3d3d3}.scrollable.gray-skin .scroll-bar .thumb{background-color:gray}.scrollable.gray-skin .scroll-bar:hover .thumb{background-color:#000}.scrollable.gray-skin .scroll-bar.vertical{width:10px}.scrollable.gray-skin .scroll-bar.horizontal{height:10px;margin-top:2px}.scrollable.modern-skin{padding-right:17px}.scrollable.modern-skin .scroll-bar{border:1px solid gray;border-radius:4px;-moz-border-radius:4px;-webkit-border-radius:4px;box-shadow:inset 0 0 5px #888}.scrollable.modern-skin .scroll-bar .thumb{background-color:#95aabf;border-radius:4px;-moz-border-radius:4px;-webkit-border-radius:4px;border:1px solid #536984}.scrollable.modern-skin .scroll-bar.vertical .thumb{width:8px;background:-webkit-gradient(linear,left top,right top,color-stop(0%,#95aabf),color-stop(100%,#547092));background:-webkit-linear-gradient(left,#95aabf 0,#547092 100%);background:linear-gradient(to right,#95aabf 0,#547092 100%);-ms-filter:\"progid:DXImageTransform.Microsoft.gradient( startColorstr='#95aabf', endColorstr='#547092',GradientType=1 )\"}.scrollable.modern-skin .scroll-bar.horizontal .thumb{height:8px;background-image:linear-gradient(#95aabf,#547092);background-image:-webkit-linear-gradient(#95aabf,#547092);-ms-filter:\"progid:DXImageTransform.Microsoft.gradient( startColorstr='#95aabf', endColorstr='#547092',GradientType=0 )\"}.scrollable.modern-skin .scroll-bar.vertical{width:10px}.scrollable.modern-skin .scroll-bar.horizontal{height:10px;margin-top:2px}\n" +
"/**\n" +
" * Minified style.\n" +
" * Original filename: \\src\\styles\\style.css\n" +
" */\n" +
"@-webkit-keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;margin-left:7px}#emote-menu-button.active{border-radius:2px;background-color:rgba(128,128,128,.5)}.emote-menu{padding:5px;z-index:1000;display:none;background-color:#202020}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-popular{height:38px}.emote-menu .draggable{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px)}.emote-menu .header-info{border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;background-image:-webkit-linear-gradient(bottom,transparent,rgba(0,0,0,.5));background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center;position:relative}.emote-menu .header-info img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:32px;height:32px;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu.editing .emote{cursor:auto}.emote-menu .emote div{max-width:32px;max-height:32px;background-repeat:no-repeat;background-size:contain;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;padding:5px 0 2px;margin-top:5px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5;background-size:contain!important}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-home{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNjQiDQogICBoZWlnaHQ9IjY0Ig0KICAgdmlld0JveD0iMCAwIDY0IDY0Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhMzAwMSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczI5OTkiIC8+DQo8cGF0aA0KICAgZD0ibSA1Ny4wNjIsMzEuMzk4IGMgMC45MzIsLTEuMDI1IDAuODQyLC0yLjU5NiAtMC4yMDEsLTMuNTA4IEwgMzMuODg0LDcuNzg1IEMgMzIuODQxLDYuODczIDMxLjE2OSw2Ljg5MiAzMC4xNDgsNy44MjggTCA3LjA5MywyOC45NjIgYyAtMS4wMjEsMC45MzYgLTEuMDcxLDIuNTA1IC0wLjExMSwzLjUwMyBsIDAuNTc4LDAuNjAyIGMgMC45NTksMC45OTggMi41MDksMS4xMTcgMy40NiwwLjI2NSBsIDEuNzIzLC0xLjU0MyB2IDIyLjU5IGMgMCwxLjM4NiAxLjEyMywyLjUwOCAyLjUwOCwyLjUwOCBoIDguOTg3IGMgMS4zODUsMCAyLjUwOCwtMS4xMjIgMi41MDgsLTIuNTA4IFYgMzguNTc1IGggMTEuNDYzIHYgMTUuODA0IGMgLTAuMDIsMS4zODUgMC45NzEsMi41MDcgMi4zNTYsMi41MDcgaCA5LjUyNCBjIDEuMzg1LDAgMi41MDgsLTEuMTIyIDIuNTA4LC0yLjUwOCBWIDMyLjEwNyBjIDAsMCAwLjQ3NiwwLjQxNyAxLjA2MywwLjkzMyAwLjU4NiwwLjUxNSAxLjgxNywwLjEwMiAyLjc0OSwtMC45MjQgbCAwLjY1MywtMC43MTggeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%}.emote-menu .icon-gear{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB2ZXJzaW9uPSIxLjEiCiAgIHdpZHRoPSIyMS41OSIKICAgaGVpZ2h0PSIyMS4xMzY5OTkiCiAgIHZpZXdCb3g9IjAgMCAyMS41OSAyMS4xMzciCiAgIGlkPSJDYXBhXzEiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQogICBpZD0ibWV0YWRhdGEzOSI+PHJkZjpSREY+PGNjOldvcmsKICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcwogICBpZD0iZGVmczM3IiAvPgo8cGF0aAogICBkPSJNIDE4LjYyMiw4LjE0NSAxOC4wNzcsNi44NSBjIDAsMCAxLjI2OCwtMi44NjEgMS4xNTYsLTIuOTcxIEwgMTcuNTU0LDIuMjQgQyAxNy40MzgsMi4xMjcgMTQuNTc2LDMuNDMzIDE0LjU3NiwzLjQzMyBMIDEzLjI1NiwyLjkgQyAxMy4yNTYsMi45IDEyLjA5LDAgMTEuOTMsMCBIIDkuNTYxIEMgOS4zOTYsMCA4LjMxNywyLjkwNiA4LjMxNywyLjkwNiBMIDYuOTk5LDMuNDQxIGMgMCwwIC0yLjkyMiwtMS4yNDIgLTMuMDM0LC0xLjEzMSBMIDIuMjg5LDMuOTUxIEMgMi4xNzMsNC4wNjQgMy41MDcsNi44NjcgMy41MDcsNi44NjcgTCAyLjk2Miw4LjE2IEMgMi45NjIsOC4xNiAwLDkuMzAxIDAsOS40NTUgdiAyLjMyMiBjIDAsMC4xNjIgMi45NjksMS4yMTkgMi45NjksMS4yMTkgbCAwLjU0NSwxLjI5MSBjIDAsMCAtMS4yNjgsMi44NTkgLTEuMTU3LDIuOTY5IGwgMS42NzgsMS42NDMgYyAwLjExNCwwLjExMSAyLjk3NywtMS4xOTUgMi45NzcsLTEuMTk1IGwgMS4zMjEsMC41MzUgYyAwLDAgMS4xNjYsMi44OTggMS4zMjcsMi44OTggaCAyLjM2OSBjIDAuMTY0LDAgMS4yNDQsLTIuOTA2IDEuMjQ0LC0yLjkwNiBsIDEuMzIyLC0wLjUzNSBjIDAsMCAyLjkxNiwxLjI0MiAzLjAyOSwxLjEzMyBsIDEuNjc4LC0xLjY0MSBjIDAuMTE3LC0wLjExNSAtMS4yMiwtMi45MTYgLTEuMjIsLTIuOTE2IGwgMC41NDQsLTEuMjkzIGMgMCwwIDIuOTYzLC0xLjE0MyAyLjk2MywtMS4yOTkgViA5LjM2IEMgMjEuNTksOS4xOTkgMTguNjIyLDguMTQ1IDE4LjYyMiw4LjE0NSB6IG0gLTQuMzY2LDIuNDIzIGMgMCwxLjg2NyAtMS41NTMsMy4zODcgLTMuNDYxLDMuMzg3IC0xLjkwNiwwIC0zLjQ2MSwtMS41MiAtMy40NjEsLTMuMzg3IDAsLTEuODY3IDEuNTU1LC0zLjM4NSAzLjQ2MSwtMy4zODUgMS45MDksMC4wMDEgMy40NjEsMS41MTggMy40NjEsMy4zODUgeiIKICAgaWQ9InBhdGgzIgogICBzdHlsZT0iZmlsbDojRkZGRkZGIiAvPgo8ZwogICBpZD0iZzUiPgo8L2c+CjxnCiAgIGlkPSJnNyI+CjwvZz4KPGcKICAgaWQ9Imc5Ij4KPC9nPgo8ZwogICBpZD0iZzExIj4KPC9nPgo8ZwogICBpZD0iZzEzIj4KPC9nPgo8ZwogICBpZD0iZzE1Ij4KPC9nPgo8ZwogICBpZD0iZzE3Ij4KPC9nPgo8ZwogICBpZD0iZzE5Ij4KPC9nPgo8ZwogICBpZD0iZzIxIj4KPC9nPgo8ZwogICBpZD0iZzIzIj4KPC9nPgo8ZwogICBpZD0iZzI1Ij4KPC9nPgo8ZwogICBpZD0iZzI3Ij4KPC9nPgo8ZwogICBpZD0iZzI5Ij4KPC9nPgo8ZwogICBpZD0iZzMxIj4KPC9nPgo8ZwogICBpZD0iZzMzIj4KPC9nPgo8L3N2Zz4K) no-repeat 50%}.emote-menu.editing .icon-gear{-webkit-animation:spin 4s linear infinite;animation:spin 4s linear infinite}.emote-menu .icon-resize-handle{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgdmlld0JveD0iMCAwIDE2IDE2Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhNDM1NyI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczQzNTUiIC8+DQo8cGF0aA0KICAgZD0iTSAxMy41LDggQyAxMy4yMjUsOCAxMyw4LjIyNCAxMyw4LjUgdiAzLjc5MyBMIDMuNzA3LDMgSCA3LjUgQyA3Ljc3NiwzIDgsMi43NzYgOCwyLjUgOCwyLjIyNCA3Ljc3NiwyIDcuNSwyIGggLTUgTCAyLjMwOSwyLjAzOSAyLjE1LDIuMTQ0IDIuMTQ2LDIuMTQ2IDIuMTQzLDIuMTUyIDIuMDM5LDIuMzA5IDIsMi41IHYgNSBDIDIsNy43NzYgMi4yMjQsOCAyLjUsOCAyLjc3Niw4IDMsNy43NzYgMyw3LjUgViAzLjcwNyBMIDEyLjI5MywxMyBIIDguNSBDIDguMjI0LDEzIDgsMTMuMjI1IDgsMTMuNSA4LDEzLjc3NSA4LjIyNCwxNCA4LjUsMTQgaCA1IGwgMC4xOTEsLTAuMDM5IGMgMC4xMjEsLTAuMDUxIDAuMjIsLTAuMTQ4IDAuMjcsLTAuMjcgTCAxNCwxMy41MDIgViA4LjUgQyAxNCw4LjIyNCAxMy43NzUsOCAxMy41LDggeiINCiAgIGlkPSJwYXRoNDM1MSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%;cursor:nwse-resize!important}.emote-menu .icon-pin{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgaWQ9InN2ZzMwMDUiPg0KICA8bWV0YWRhdGENCiAgICAgaWQ9Im1ldGFkYXRhMzAyMyI+DQogICAgPHJkZjpSREY+DQogICAgICA8Y2M6V29yaw0KICAgICAgICAgcmRmOmFib3V0PSIiPg0KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4NCiAgICAgICAgPGRjOnR5cGUNCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4NCiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+DQogICAgICA8L2NjOldvcms+DQogICAgPC9yZGY6UkRGPg0KICA8L21ldGFkYXRhPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczMwMjEiIC8+DQogIDxnDQogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzkzMDc4MiwwLDAsMC43OTMwNzgyLC0yLjE3MDk4NSwtODE0LjY5Mjk5KSINCiAgICAgaWQ9ImczMDA3Ij4NCiAgICA8Zw0KICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTEsMC43MDcxMSwtMC43MDcxMSwwLjcwNzExLDczNy43MDc1NSwyOTUuNDg4MDgpIg0KICAgICAgIGlkPSJnMzAwOSI+DQogICAgICA8Zw0KICAgICAgICAgaWQ9ImczNzU1Ij4NCiAgICAgICAgPHBhdGgNCiAgICAgICAgICAgZD0iTSA5Ljc4MTI1LDAgQyA5LjQ3NDA1NjIsMC42ODkxMTIgOS41MjA2OCwxLjUyMzA4NTMgOS4zMTI1LDIuMTg3NSBMIDQuOTM3NSw2LjU5Mzc1IEMgMy45NTg5NjA4LDYuNDI5NDgzIDIuOTQ3NzU0OCw2LjUzMjc4OTkgMiw2LjgxMjUgTCA1LjAzMTI1LDkuODQzNzUgMC41NjI1LDE0LjMxMjUgMCwxNiBDIDAuNTY5Mjk2MjgsMTUuNzk1NjI2IDEuMTY3NzM3OCwxNS42NDAyMzcgMS43MTg3NSwxNS40MDYyNSBMIDYuMTU2MjUsMTAuOTY4NzUgOS4xODc1LDE0IGMgMC4yNzk2ODIzLC0wLjk0Nzc4MyAwLjM4MzE1MjgsLTEuOTU4OTM3IDAuMjE4NzUsLTIuOTM3NSAxLjUwMDAxMSwtMS40ODk1Nzk4IDMuMDAwMDAxLC0yLjk3OTE1OSA0LjUsLTQuNDY4NzUgMC42MDExMDIsLTAuMDMxMzYxIDEuODIyMTM4LC0wLjA5NjEzNyAyLC0wLjQ2ODc1IEMgMTMuODc5ODkyLDQuMDY5NDgwMyAxMS44NDI4NjUsMi4wMjAyMjgyIDkuNzgxMjUsMCB6Ig0KICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg5MTU5Mzc0LC0wLjg5MTU5Mzc0LDAuODkxNTkzNzQsMC44OTE1OTM3NCwtMi4yNjU1LDEwMzcuMTM0NSkiDQogICAgICAgICAgIGlkPSJwYXRoMzAxMSINCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K) no-repeat 50%;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu .icon-pin:hover,.emote-menu.pinned .icon-pin{-webkit-transform:rotate(-45deg);-ms-transform:rotate(-45deg);transform:rotate(-45deg);opacity:1}.emote-menu .scrollable.default-skin{padding-right:0;padding-bottom:0}.emote-menu .scrollable.default-skin .scroll-bar .thumb{background-color:#555;opacity:.2;z-index:1}.emote-menu .edit-visibility{background-color:#00c800;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB2ZXJzaW9uPSIxLjEiCiAgIHdpZHRoPSIxMDAiCiAgIGhlaWdodD0iMTAwIgogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCIKICAgaWQ9IkxheWVyXzEiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQogICBpZD0ibWV0YWRhdGE5Ij48cmRmOlJERj48Y2M6V29yawogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzCiAgIGlkPSJkZWZzNyIgLz4KPHBhdGgKICAgZD0iTSA5Ny45NjQsNDYuNTQ4IEMgOTcuMDk4LDQ1LjUyOCA3Ni40MjcsMjEuNjAzIDUwLDIxLjYwMyBjIC0yNi40MjcsMCAtNDcuMDk4LDIzLjkyNSAtNDcuOTY1LDI0Ljk0NiAtMS43MDEsMiAtMS43MDEsNC45MDIgMTBlLTQsNi45MDMgMC44NjYsMS4wMiAyMS41MzcsMjQuOTQ1IDQ3Ljk2NCwyNC45NDUgMjYuNDI3LDAgNDcuMDk4LC0yMy45MjYgNDcuOTY1LC0yNC45NDYgMS43MDEsLTIgMS43MDEsLTQuOTAyIC0wLjAwMSwtNi45MDMgeiBNIDU4LjA3MywzNS45NzUgYyAxLjc3NywtMC45NyA0LjI1NSwwLjE0MyA1LjUzNCwyLjQ4NSAxLjI3OSwyLjM0MyAwLjg3NSw1LjAyOSAtMC45MDIsNS45OTkgLTEuNzc3LDAuOTcxIC00LjI1NSwtMC4xNDMgLTUuNTM1LC0yLjQ4NSAtMS4yNzksLTIuMzQzIC0wLjg3NSwtNS4wMjkgMC45MDMsLTUuOTk5IHogTSA1MCw2OS43MjkgQyAzMS41NCw2OS43MjkgMTYuMDA1LDU1LjU1MyAxMC42MjgsNTAgMTQuMjU5LDQ2LjI0OSAyMi41MjYsMzguNTcxIDMzLjE5NSwzMy45NzkgMzEuMTE0LDM3LjE0NSAyOS44OTQsNDAuOTI4IDI5Ljg5NCw0NSBjIDAsMTEuMTA0IDkuMDAxLDIwLjEwNSAyMC4xMDUsMjAuMTA1IDExLjEwNCwwIDIwLjEwNiwtOS4wMDEgMjAuMTA2LC0yMC4xMDUgMCwtNC4wNzIgLTEuMjE5LC03Ljg1NSAtMy4zLC0xMS4wMjEgQyA3Ny40NzQsMzguNTcyIDg1Ljc0MSw0Ni4yNSA4OS4zNzIsNTAgODMuOTk1LDU1LjU1NSA2OC40Niw2OS43MjkgNTAsNjkuNzI5IHoiCiAgIGlkPSJwYXRoMyIgLz4KPC9zdmc+);background-position:50%;background-repeat:no-repeat;background-size:14px;border:1px solid #000;border-radius:4px;cursor:pointer;display:none;opacity:.5;height:14px;position:absolute;width:14px;z-index:1;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu .edit-visibility:hover{opacity:1}.emote-menu .emote>.edit-visibility{top:0;right:0;left:auto;bottom:auto}.emote-menu .header-info>.edit-visibility{margin-left:5px}.emote-menu.editing .edit-visibility{display:inline-block}.emote-menu .emote-menu-hidden .edit-visibility{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB2ZXJzaW9uPSIxLjEiCiAgIHdpZHRoPSIxMDAiCiAgIGhlaWdodD0iMTAwIgogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCIKICAgaWQ9IkxheWVyXzMiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQogICBpZD0ibWV0YWRhdGExNSI+PHJkZjpSREY+PGNjOldvcmsKICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcwogICBpZD0iZGVmczEzIiAvPgo8ZwogICBpZD0iZzMiPgoJPHBhdGgKICAgZD0iTSA3MC4wODIsNDUuNDc1IDUwLjQ3NCw2NS4wODIgQyA2MS4xOTgsNjQuODMxIDY5LjgzMSw1Ni4xOTcgNzAuMDgyLDQ1LjQ3NSB6IgogICBpZD0icGF0aDUiCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+Cgk8cGF0aAogICBkPSJtIDk3Ljk2NCw0Ni41NDggYyAtMC40NSwtMC41MjkgLTYuMjQ1LC03LjIzIC0xNS40MDMsLTEzLjU1NCBsIC02LjIsNi4yIEMgODIuMzUxLDQzLjE0OCA4Ni45Miw0Ny40NjkgODkuMzcyLDUwIDgzLjk5NSw1NS41NTUgNjguNDYsNjkuNzI5IDUwLDY5LjcyOSBjIC0xLjMzNCwwIC0yLjY1MSwtMC4wODIgLTMuOTUyLC0wLjIyMiBsIC03LjQzOSw3LjQzOSBjIDMuNjM5LDAuOTA5IDcuNDQ5LDEuNDUgMTEuMzkxLDEuNDUgMjYuNDI3LDAgNDcuMDk4LC0yMy45MjYgNDcuOTY1LC0yNC45NDYgMS43MDEsLTEuOTk5IDEuNzAxLC00LjkwMSAtMC4wMDEsLTYuOTAyIHoiCiAgIGlkPSJwYXRoNyIKICAgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgLz4KCTxwYXRoCiAgIGQ9Im0gOTEuNDExLDE2LjY2IGMgMCwtMC4yNjYgLTAuMTA1LC0wLjUyIC0wLjI5MywtMC43MDcgbCAtNy4wNzEsLTcuMDcgYyAtMC4zOTEsLTAuMzkxIC0xLjAyMywtMC4zOTEgLTEuNDE0LDAgTCA2Ni44MDQsMjQuNzExIEMgNjEuNjAyLDIyLjgxOCA1NS45NDksMjEuNjAzIDUwLDIxLjYwMyBjIC0yNi40MjcsMCAtNDcuMDk4LDIzLjkyNiAtNDcuOTY1LDI0Ljk0NiAtMS43MDEsMiAtMS43MDEsNC45MDIgMTBlLTQsNi45MDMgMC41MTcsMC42MDcgOC4wODMsOS4zNTQgMTkuNzA3LDE2LjMyIEwgOC44ODMsODIuNjMyIEMgOC42OTUsODIuODIgOC41OSw4My4wNzMgOC41OSw4My4zMzkgYyAwLDAuMjY2IDAuMTA1LDAuNTIgMC4yOTMsMC43MDcgbCA3LjA3MSw3LjA3IGMgMC4xOTUsMC4xOTUgMC40NTEsMC4yOTMgMC43MDcsMC4yOTMgMC4yNTYsMCAwLjUxMiwtMC4wOTggMC43MDcsLTAuMjkzIGwgNzMuNzUsLTczLjc1IGMgMC4xODcsLTAuMTg2IDAuMjkzLC0wLjQ0IDAuMjkzLC0wLjcwNiB6IE0gMTAuNjI4LDUwIEMgMTQuMjU5LDQ2LjI0OSAyMi41MjYsMzguNTcxIDMzLjE5NSwzMy45NzkgMzEuMTE0LDM3LjE0NSAyOS44OTQsNDAuOTI4IDI5Ljg5NCw0NSBjIDAsNC42NjUgMS42MDEsOC45NDUgNC4yNywxMi4zNTEgTCAyOC4wNCw2My40NzUgQyAxOS44ODgsNTguOTU1IDEzLjY0OSw1My4xMiAxMC42MjgsNTAgeiIKICAgaWQ9InBhdGg5IgogICBzdHlsZT0iZmlsbDojRkZGRkZGIiAvPgo8L2c+Cjwvc3ZnPgo=);background-color:red}.emote-menu:not(.editing) .emote-menu-hidden{display:none}"));

},{}],3:[function(require,module,exports){
module.exports = (function() {
    var Hogan = require('hogan.js/lib/template.js');
    var templates = {};
    templates['emote'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote");if(t.s(t.f("thirdParty",c,p,1),c,p,0,32,44,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" third-party");});c.pop();}if(!t.s(t.f("isVisible",c,p,1),c,p,1,0,0,"")){t.b(" emote-menu-hidden");};t.b("\" data-emote=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" title=\"");t.b(t.v(t.f("text",c,p,0)));if(t.s(t.f("thirdParty",c,p,1),c,p,0,159,182,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" (from 3rd party addon)");});c.pop();}t.b("\">\r");t.b("\n" + i);t.b("	<div style=\"background-image: url(");t.b(t.t(t.d("image.url",c,p,0)));t.b("); height: ");t.b(t.t(t.d("image.height",c,p,0)));t.b("px; width: ");t.b(t.t(t.d("image.width",c,p,0)));t.b("px\"></div>\r");t.b("\n" + i);t.b("	<div class=\"edit-visibility\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button glyph-only float-left\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteGroupHeader'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"group-header");if(!t.s(t.f("isVisible",c,p,1),c,p,1,0,0,"")){t.b(" emote-menu-hidden");};t.b("\" data-emote-channel=\"");t.b(t.v(t.f("channel",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div class=\"header-info\">\r");t.b("\n" + i);t.b("		<img src=\"");t.b(t.v(t.f("badge",c,p,0)));t.b("\" />\r");t.b("\n" + i);t.b("		");t.b(t.v(t.f("channel",c,p,0)));t.b("\r");t.b("\n" + i);t.b("		<div class=\"edit-visibility\" data-which=\"channel-");t.b(t.v(t.f("channel",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show all emotes for ");t.b(t.v(t.f("channel",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['menu'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote-menu\" id=\"emote-menu-for-twitch\">\r");t.b("\n" + i);t.b("	<div class=\"draggable\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"header-info\">All Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container scrollable\" id=\"all-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"header-info\">Popular Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container single-row\" id=\"popular-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"footer\">\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-home\" href=\"http://cletusc.github.io/Userscript--Twitch-Chat-Emotes\" target=\"_blank\" title=\"Visit the homepage where you can donate, post a review, or contact the developer\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-gear\" data-command=\"toggle-editing\" title=\"Toggle edit mode\"></a>\r");t.b("\n" + i);t.b("		<a title=\"Reset the popularity of the emotes back to default\" data-command=\"reset-popularity\">Reset Popularity</a>\r");t.b("\n" + i);t.b("		<a class=\"pull-right icon icon-resize-handle\" data-command=\"resize-handle\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-right icon icon-pin\" data-command=\"toggle-pinned\" title=\"Pin/unpin the emote menu to the screen\"></a>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['newsMessage'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("\r");t.b("\n" + i);t.b("<div class=\"twitch-chat-emotes-news\">\r");t.b("\n" + i);t.b("	[");t.b(t.v(t.f("scriptName",c,p,0)));t.b("] News: ");t.b(t.t(t.f("message",c,p,0)));t.b(" (<a href=\"#\" data-command=\"twitch-chat-emotes:dismiss-news\" data-news-id=\"");t.b(t.v(t.f("id",c,p,0)));t.b("\">Dismiss</a>)\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    return templates;
})();
},{"hogan.js/lib/template.js":9}],4:[function(require,module,exports){
(function (global){
/*! http://mths.be/punycode v1.2.4 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports;
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings.
	 * @private
	 * @param {String} domain The domain name.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		return map(string.split(regexSeparators), fn).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name to Unicode. Only the
	 * Punycoded parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it on a string that has already been converted to
	 * Unicode.
	 * @memberOf punycode
	 * @param {String} domain The Punycode domain name to convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(domain) {
		return mapDomain(domain, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name to Punycode. Only the
	 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it with a domain that's already in ASCII.
	 * @memberOf punycode
	 * @param {String} domain The domain name to convert, as a Unicode string.
	 * @returns {String} The Punycode representation of the given domain name.
	 */
	function toASCII(domain) {
		return mapDomain(domain, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.2.4',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],7:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":5,"./encode":6}],8:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":4,"querystring":7}],9:[function(require,module,exports){
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var Hogan = {};

(function (Hogan) {
  Hogan.Template = function (codeObj, text, compiler, options) {
    codeObj = codeObj || {};
    this.r = codeObj.code || this.r;
    this.c = compiler;
    this.options = options || {};
    this.text = text || '';
    this.partials = codeObj.partials || {};
    this.subs = codeObj.subs || {};
    this.buf = '';
  }

  Hogan.Template.prototype = {
    // render: replaced by generated code.
    r: function (context, partials, indent) { return ''; },

    // variable escaping
    v: hoganEscape,

    // triple stache
    t: coerceToString,

    render: function render(context, partials, indent) {
      return this.ri([context], partials || {}, indent);
    },

    // render internal -- a hook for overrides that catches partials too
    ri: function (context, partials, indent) {
      return this.r(context, partials, indent);
    },

    // ensurePartial
    ep: function(symbol, partials) {
      var partial = this.partials[symbol];

      // check to see that if we've instantiated this partial before
      var template = partials[partial.name];
      if (partial.instance && partial.base == template) {
        return partial.instance;
      }

      if (typeof template == 'string') {
        if (!this.c) {
          throw new Error("No compiler available.");
        }
        template = this.c.compile(template, this.options);
      }

      if (!template) {
        return null;
      }

      // We use this to check whether the partials dictionary has changed
      this.partials[symbol].base = template;

      if (partial.subs) {
        // Make sure we consider parent template now
        if (!partials.stackText) partials.stackText = {};
        for (key in partial.subs) {
          if (!partials.stackText[key]) {
            partials.stackText[key] = (this.activeSub !== undefined && partials.stackText[this.activeSub]) ? partials.stackText[this.activeSub] : this.text;
          }
        }
        template = createSpecializedPartial(template, partial.subs, partial.partials,
          this.stackSubs, this.stackPartials, partials.stackText);
      }
      this.partials[symbol].instance = template;

      return template;
    },

    // tries to find a partial in the current scope and render it
    rp: function(symbol, context, partials, indent) {
      var partial = this.ep(symbol, partials);
      if (!partial) {
        return '';
      }

      return partial.ri(context, partials, indent);
    },

    // render a section
    rs: function(context, partials, section) {
      var tail = context[context.length - 1];

      if (!isArray(tail)) {
        section(context, partials, this);
        return;
      }

      for (var i = 0; i < tail.length; i++) {
        context.push(tail[i]);
        section(context, partials, this);
        context.pop();
      }
    },

    // maybe start a section
    s: function(val, ctx, partials, inverted, start, end, tags) {
      var pass;

      if (isArray(val) && val.length === 0) {
        return false;
      }

      if (typeof val == 'function') {
        val = this.ms(val, ctx, partials, inverted, start, end, tags);
      }

      pass = !!val;

      if (!inverted && pass && ctx) {
        ctx.push((typeof val == 'object') ? val : ctx[ctx.length - 1]);
      }

      return pass;
    },

    // find values with dotted names
    d: function(key, ctx, partials, returnFound) {
      var found,
          names = key.split('.'),
          val = this.f(names[0], ctx, partials, returnFound),
          doModelGet = this.options.modelGet,
          cx = null;

      if (key === '.' && isArray(ctx[ctx.length - 2])) {
        val = ctx[ctx.length - 1];
      } else {
        for (var i = 1; i < names.length; i++) {
          found = findInScope(names[i], val, doModelGet);
          if (found !== undefined) {
            cx = val;
            val = found;
          } else {
            val = '';
          }
        }
      }

      if (returnFound && !val) {
        return false;
      }

      if (!returnFound && typeof val == 'function') {
        ctx.push(cx);
        val = this.mv(val, ctx, partials);
        ctx.pop();
      }

      return val;
    },

    // find values with normal names
    f: function(key, ctx, partials, returnFound) {
      var val = false,
          v = null,
          found = false,
          doModelGet = this.options.modelGet;

      for (var i = ctx.length - 1; i >= 0; i--) {
        v = ctx[i];
        val = findInScope(key, v, doModelGet);
        if (val !== undefined) {
          found = true;
          break;
        }
      }

      if (!found) {
        return (returnFound) ? false : "";
      }

      if (!returnFound && typeof val == 'function') {
        val = this.mv(val, ctx, partials);
      }

      return val;
    },

    // higher order templates
    ls: function(func, cx, partials, text, tags) {
      var oldTags = this.options.delimiters;

      this.options.delimiters = tags;
      this.b(this.ct(coerceToString(func.call(cx, text)), cx, partials));
      this.options.delimiters = oldTags;

      return false;
    },

    // compile text
    ct: function(text, cx, partials) {
      if (this.options.disableLambda) {
        throw new Error('Lambda features disabled.');
      }
      return this.c.compile(text, this.options).render(cx, partials);
    },

    // template result buffering
    b: function(s) { this.buf += s; },

    fl: function() { var r = this.buf; this.buf = ''; return r; },

    // method replace section
    ms: function(func, ctx, partials, inverted, start, end, tags) {
      var textSource,
          cx = ctx[ctx.length - 1],
          result = func.call(cx);

      if (typeof result == 'function') {
        if (inverted) {
          return true;
        } else {
          textSource = (this.activeSub && this.subsText && this.subsText[this.activeSub]) ? this.subsText[this.activeSub] : this.text;
          return this.ls(result, cx, partials, textSource.substring(start, end), tags);
        }
      }

      return result;
    },

    // method replace variable
    mv: function(func, ctx, partials) {
      var cx = ctx[ctx.length - 1];
      var result = func.call(cx);

      if (typeof result == 'function') {
        return this.ct(coerceToString(result.call(cx)), cx, partials);
      }

      return result;
    },

    sub: function(name, context, partials, indent) {
      var f = this.subs[name];
      if (f) {
        this.activeSub = name;
        f(context, partials, this, indent);
        this.activeSub = false;
      }
    }

  };

  //Find a key in an object
  function findInScope(key, scope, doModelGet) {
    var val;

    if (scope && typeof scope == 'object') {

      if (scope[key] !== undefined) {
        val = scope[key];

      // try lookup with get for backbone or similar model data
      } else if (doModelGet && scope.get && typeof scope.get == 'function') {
        val = scope.get(key);
      }
    }

    return val;
  }

  function createSpecializedPartial(instance, subs, partials, stackSubs, stackPartials, stackText) {
    function PartialTemplate() {};
    PartialTemplate.prototype = instance;
    function Substitutions() {};
    Substitutions.prototype = instance.subs;
    var key;
    var partial = new PartialTemplate();
    partial.subs = new Substitutions();
    partial.subsText = {};  //hehe. substext.
    partial.buf = '';

    stackSubs = stackSubs || {};
    partial.stackSubs = stackSubs;
    partial.subsText = stackText;
    for (key in subs) {
      if (!stackSubs[key]) stackSubs[key] = subs[key];
    }
    for (key in stackSubs) {
      partial.subs[key] = stackSubs[key];
    }

    stackPartials = stackPartials || {};
    partial.stackPartials = stackPartials;
    for (key in partials) {
      if (!stackPartials[key]) stackPartials[key] = partials[key];
    }
    for (key in stackPartials) {
      partial.partials[key] = stackPartials[key];
    }

    return partial;
  }

  var rAmp = /&/g,
      rLt = /</g,
      rGt = />/g,
      rApos = /\'/g,
      rQuot = /\"/g,
      hChars = /[&<>\"\']/;

  function coerceToString(val) {
    return String((val === null || val === undefined) ? '' : val);
  }

  function hoganEscape(str) {
    str = coerceToString(str);
    return hChars.test(str) ?
      str
        .replace(rAmp, '&amp;')
        .replace(rLt, '&lt;')
        .replace(rGt, '&gt;')
        .replace(rApos, '&#39;')
        .replace(rQuot, '&quot;') :
      str;
  }

  var isArray = Array.isArray || function(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
  };

})(typeof exports !== 'undefined' ? exports : Hogan);

},{}],10:[function(require,module,exports){
(function ($) {

  $.fn.customScrollbar = function (options, args) {

    var defaultOptions = {
      skin: undefined,
      hScroll: true,
      vScroll: true,
      updateOnWindowResize: false,
      animationSpeed: 300,
      onCustomScroll: undefined,
      swipeSpeed: 1,
      wheelSpeed: 40,
      fixedThumbWidth: undefined,
      fixedThumbHeight: undefined
    }

    var Scrollable = function (element, options) {
      this.$element = $(element);
      this.options = options;
      this.addScrollableClass();
      this.addSkinClass();
      this.addScrollBarComponents();
      if (this.options.vScroll)
        this.vScrollbar = new Scrollbar(this, new VSizing());
      if (this.options.hScroll)
        this.hScrollbar = new Scrollbar(this, new HSizing());
      this.$element.data("scrollable", this);
      this.initKeyboardScrolling();
      this.bindEvents();
    }

    Scrollable.prototype = {

      addScrollableClass: function () {
        if (!this.$element.hasClass("scrollable")) {
          this.scrollableAdded = true;
          this.$element.addClass("scrollable");
        }
      },

      removeScrollableClass: function () {
        if (this.scrollableAdded)
          this.$element.removeClass("scrollable");
      },

      addSkinClass: function () {
        if (typeof(this.options.skin) == "string" && !this.$element.hasClass(this.options.skin)) {
          this.skinClassAdded = true;
          this.$element.addClass(this.options.skin);
        }
      },

      removeSkinClass: function () {
        if (this.skinClassAdded)
          this.$element.removeClass(this.options.skin);
      },

      addScrollBarComponents: function () {
        this.assignViewPort();
        if (this.$viewPort.length == 0) {
          this.$element.wrapInner("<div class=\"viewport\" />");
          this.assignViewPort();
          this.viewPortAdded = true;
        }
        this.assignOverview();
        if (this.$overview.length == 0) {
          this.$viewPort.wrapInner("<div class=\"overview\" />");
          this.assignOverview();
          this.overviewAdded = true;
        }
        this.addScrollBar("vertical", "prepend");
        this.addScrollBar("horizontal", "append");
      },

      removeScrollbarComponents: function () {
        this.removeScrollbar("vertical");
        this.removeScrollbar("horizontal");
        if (this.overviewAdded)
          this.$element.unwrap();
        if (this.viewPortAdded)
          this.$element.unwrap();
      },

      removeScrollbar: function (orientation) {
        if (this[orientation + "ScrollbarAdded"])
          this.$element.find(".scroll-bar." + orientation).remove();
      },

      assignViewPort: function () {
        this.$viewPort = this.$element.find(".viewport");
      },

      assignOverview: function () {
        this.$overview = this.$viewPort.find(".overview");
      },

      addScrollBar: function (orientation, fun) {
        if (this.$element.find(".scroll-bar." + orientation).length == 0) {
          this.$element[fun]("<div class='scroll-bar " + orientation + "'><div class='thumb'></div></div>")
          this[orientation + "ScrollbarAdded"] = true;
        }
      },

      resize: function (keepPosition) {
        if (this.vScrollbar)
          this.vScrollbar.resize(keepPosition);
        if (this.hScrollbar)
          this.hScrollbar.resize(keepPosition);
      },

      scrollTo: function (element) {
        if (this.vScrollbar)
          this.vScrollbar.scrollToElement(element);
        if (this.hScrollbar)
          this.hScrollbar.scrollToElement(element);
      },

      scrollToXY: function (x, y) {
        this.scrollToX(x);
        this.scrollToY(y);
      },

      scrollToX: function (x) {
        if (this.hScrollbar)
          this.hScrollbar.scrollOverviewTo(x, true);
      },

      scrollToY: function (y) {
        if (this.vScrollbar)
          this.vScrollbar.scrollOverviewTo(y, true);
      },

      remove: function () {
        this.removeScrollableClass();
        this.removeSkinClass();
        this.removeScrollbarComponents();
        this.$element.data("scrollable", null);
        this.removeKeyboardScrolling();
        if (this.vScrollbar)
          this.vScrollbar.remove();
        if (this.hScrollbar)
          this.hScrollbar.remove();
      },

      setAnimationSpeed: function (speed) {
        this.options.animationSpeed = speed;
      },

      isInside: function (element, wrappingElement) {
        var $element = $(element);
        var $wrappingElement = $(wrappingElement);
        var elementOffset = $element.offset();
        var wrappingElementOffset = $wrappingElement.offset();
        return (elementOffset.top >= wrappingElementOffset.top) && (elementOffset.left >= wrappingElementOffset.left) &&
          (elementOffset.top + $element.height() <= wrappingElementOffset.top + $wrappingElement.height()) &&
          (elementOffset.left + $element.width() <= wrappingElementOffset.left + $wrappingElement.width())
      },

      initKeyboardScrolling: function () {
        var _this = this;

        this.elementKeydown = function (event) {
          if (document.activeElement === _this.$element[0]) {
            if (_this.vScrollbar)
              _this.vScrollbar.keyScroll(event);
            if (_this.hScrollbar)
              _this.hScrollbar.keyScroll(event);
          }
        }

        this.$element
          .attr('tabindex', '-1')
          .keydown(this.elementKeydown);
      },

      removeKeyboardScrolling: function () {
        this.$element
          .removeAttr('tabindex')
          .unbind("keydown", this.elementKeydown);
      },

      bindEvents: function () {
        if (this.options.onCustomScroll)
          this.$element.on("customScroll", this.options.onCustomScroll);
      }

    }

    var Scrollbar = function (scrollable, sizing) {
      this.scrollable = scrollable;
      this.sizing = sizing
      this.$scrollBar = this.sizing.scrollBar(this.scrollable.$element);
      this.$thumb = this.$scrollBar.find(".thumb");
      this.setScrollPosition(0, 0);
      this.resize();
      this.initMouseMoveScrolling();
      this.initMouseWheelScrolling();
      this.initTouchScrolling();
      this.initMouseClickScrolling();
      this.initWindowResize();
    }

    Scrollbar.prototype = {

      resize: function (keepPosition) {
        this.scrollable.$viewPort.height(this.scrollable.$element.height());
        this.sizing.size(this.scrollable.$viewPort, this.sizing.size(this.scrollable.$element));
        this.viewPortSize = this.sizing.size(this.scrollable.$viewPort);
        this.overviewSize = this.sizing.size(this.scrollable.$overview);
        this.ratio = this.viewPortSize / this.overviewSize;
        this.sizing.size(this.$scrollBar, this.viewPortSize);
        this.thumbSize = this.calculateThumbSize();
        this.sizing.size(this.$thumb, this.thumbSize);
        this.maxThumbPosition = this.calculateMaxThumbPosition();
        this.maxOverviewPosition = this.calculateMaxOverviewPosition();
        this.enabled = (this.overviewSize > this.viewPortSize);
        if (this.scrollPercent === undefined)
          this.scrollPercent = 0.0;
        if (this.enabled)
          this.rescroll(keepPosition);
        else
          this.setScrollPosition(0, 0);
        this.$scrollBar.toggle(this.enabled);
      },

      calculateThumbSize: function () {
        var fixedSize = this.sizing.fixedThumbSize(this.scrollable.options)
        var size;
        if (fixedSize)
          size = fixedSize;
        else
          size = this.ratio * this.viewPortSize
        return Math.max(size, this.sizing.minSize(this.$thumb));
      },

      initMouseMoveScrolling: function () {
        var _this = this;
        this.$thumb.mousedown(function (event) {
          if (_this.enabled)
            _this.startMouseMoveScrolling(event);
        });
        this.documentMouseup = function (event) {
          _this.stopMouseMoveScrolling(event);
        };
        $(document).mouseup(this.documentMouseup);
        this.documentMousemove = function (event) {
          _this.mouseMoveScroll(event);
        };
        $(document).mousemove(this.documentMousemove);
        this.$thumb.click(function (event) {
          event.stopPropagation();
        });
      },

      removeMouseMoveScrolling: function () {
        this.$thumb.unbind();
        $(document).unbind("mouseup", this.documentMouseup);
        $(document).unbind("mousemove", this.documentMousemove);
      },

      initMouseWheelScrolling: function () {
        var _this = this;
        this.scrollable.$element.mousewheel(function (event, delta, deltaX, deltaY) {
          if (_this.enabled) {
            if (_this.mouseWheelScroll(deltaX, deltaY)) {
              event.stopPropagation();
              event.preventDefault();
            }
          }
        });
      },

      removeMouseWheelScrolling: function () {
        this.scrollable.$element.unbind("mousewheel");
      },

      initTouchScrolling: function () {
        if (document.addEventListener) {
          var _this = this;
          this.elementTouchstart = function (event) {
            if (_this.enabled)
              _this.startTouchScrolling(event);
          }
          this.scrollable.$element[0].addEventListener("touchstart", this.elementTouchstart);
          this.documentTouchmove = function (event) {
            _this.touchScroll(event);
          }
          document.addEventListener("touchmove", this.documentTouchmove);
          this.elementTouchend = function (event) {
            _this.stopTouchScrolling(event);
          }
          this.scrollable.$element[0].addEventListener("touchend", this.elementTouchend);
        }
      },

      removeTouchScrolling: function () {
        if (document.addEventListener) {
          this.scrollable.$element[0].removeEventListener("touchstart", this.elementTouchstart);
          document.removeEventListener("touchmove", this.documentTouchmove);
          this.scrollable.$element[0].removeEventListener("touchend", this.elementTouchend);
        }
      },

      initMouseClickScrolling: function () {
        var _this = this;
        this.scrollBarClick = function (event) {
          _this.mouseClickScroll(event);
        };
        this.$scrollBar.click(this.scrollBarClick);
      },

      removeMouseClickScrolling: function () {
        this.$scrollBar.unbind("click", this.scrollBarClick);
      },

      initWindowResize: function () {
        if (this.scrollable.options.updateOnWindowResize) {
          var _this = this;
          this.windowResize = function () {
            _this.resize();
          };
          $(window).resize(this.windowResize);
        }
      },

      removeWindowResize: function () {
        $(window).unbind("resize", this.windowResize);
      },

      isKeyScrolling: function (key) {
        return this.keyScrollDelta(key) != null;
      },

      keyScrollDelta: function (key) {
        for (var scrollingKey in this.sizing.scrollingKeys)
          if (scrollingKey == key)
            return this.sizing.scrollingKeys[key](this.viewPortSize);
        return null;
      },

      startMouseMoveScrolling: function (event) {
        this.mouseMoveScrolling = true;
        $("html").addClass("not-selectable");
        this.setUnselectable($("html"), "on");
        this.setScrollEvent(event);
      },

      stopMouseMoveScrolling: function (event) {
        this.mouseMoveScrolling = false;
        $("html").removeClass("not-selectable");
        this.setUnselectable($("html"), null);
      },

      setUnselectable: function (element, value) {
        if (element.attr("unselectable") != value) {
          element.attr("unselectable", value);
          element.find(':not(input)').attr('unselectable', value);
        }
      },

      mouseMoveScroll: function (event) {
        if (this.mouseMoveScrolling) {
          var delta = this.sizing.mouseDelta(this.scrollEvent, event);
          this.scrollThumbBy(delta);
          this.setScrollEvent(event);
        }
      },

      startTouchScrolling: function (event) {
        if (event.touches && event.touches.length == 1) {
          this.setScrollEvent(event.touches[0]);
          this.touchScrolling = true;
          event.stopPropagation();
        }
      },

      touchScroll: function (event) {
        if (this.touchScrolling && event.touches && event.touches.length == 1) {
          var delta = -this.sizing.mouseDelta(this.scrollEvent, event.touches[0]) * this.scrollable.options.swipeSpeed;
          var scrolled = this.scrollOverviewBy(delta);
          if (scrolled) {
            event.stopPropagation();
            event.preventDefault();
            this.setScrollEvent(event.touches[0]);
          }
        }
      },

      stopTouchScrolling: function (event) {
        this.touchScrolling = false;
        event.stopPropagation();
      },

      mouseWheelScroll: function (deltaX, deltaY) {
        var delta = -this.sizing.wheelDelta(deltaX, deltaY) * this.scrollable.options.wheelSpeed;
        if (delta != 0)
          return this.scrollOverviewBy(delta);
      },

      mouseClickScroll: function (event) {
        var delta = this.viewPortSize - 20;
        if (event["page" + this.sizing.scrollAxis()] < this.$thumb.offset()[this.sizing.offsetComponent()])
        // mouse click over thumb
          delta = -delta;
        this.scrollOverviewBy(delta);
      },

      keyScroll: function (event) {
        var keyDown = event.which;
        if (this.enabled && this.isKeyScrolling(keyDown)) {
          if (this.scrollOverviewBy(this.keyScrollDelta(keyDown)))
            event.preventDefault();
        }
      },

      scrollThumbBy: function (delta) {
        var thumbPosition = this.thumbPosition();
        thumbPosition += delta;
        thumbPosition = this.positionOrMax(thumbPosition, this.maxThumbPosition);
        var oldScrollPercent = this.scrollPercent;
        this.scrollPercent = thumbPosition / this.maxThumbPosition;
        var overviewPosition = (thumbPosition * this.maxOverviewPosition) / this.maxThumbPosition;
        this.setScrollPosition(overviewPosition, thumbPosition);
        if (oldScrollPercent != this.scrollPercent) {
          this.triggerCustomScroll(oldScrollPercent);
          return true
        }
        else
          return false;
      },

      thumbPosition: function () {
        return this.$thumb.position()[this.sizing.offsetComponent()];
      },

      scrollOverviewBy: function (delta) {
        var overviewPosition = this.overviewPosition() + delta;
        return this.scrollOverviewTo(overviewPosition, false);
      },

      overviewPosition: function () {
        return -this.scrollable.$overview.position()[this.sizing.offsetComponent()];
      },

      scrollOverviewTo: function (overviewPosition, animate) {
        overviewPosition = this.positionOrMax(overviewPosition, this.maxOverviewPosition);
        var oldScrollPercent = this.scrollPercent;
        this.scrollPercent = overviewPosition / this.maxOverviewPosition;
        var thumbPosition = this.scrollPercent * this.maxThumbPosition;
        if (animate)
          this.setScrollPositionWithAnimation(overviewPosition, thumbPosition);
        else
          this.setScrollPosition(overviewPosition, thumbPosition);
        if (oldScrollPercent != this.scrollPercent) {
          this.triggerCustomScroll(oldScrollPercent);
          return true;
        }
        else
          return false;
      },

      positionOrMax: function (p, max) {
        if (p < 0)
          return 0;
        else if (p > max)
          return max;
        else
          return p;
      },

      triggerCustomScroll: function (oldScrollPercent) {
        this.scrollable.$element.trigger("customScroll", {
            scrollAxis: this.sizing.scrollAxis(),
            direction: this.sizing.scrollDirection(oldScrollPercent, this.scrollPercent),
            scrollPercent: this.scrollPercent * 100
          }
        );
      },

      rescroll: function (keepPosition) {
        if (keepPosition) {
          var overviewPosition = this.positionOrMax(this.overviewPosition(), this.maxOverviewPosition);
          this.scrollPercent = overviewPosition / this.maxOverviewPosition;
          var thumbPosition = this.scrollPercent * this.maxThumbPosition;
          this.setScrollPosition(overviewPosition, thumbPosition);
        }
        else {
          var thumbPosition = this.scrollPercent * this.maxThumbPosition;
          var overviewPosition = this.scrollPercent * this.maxOverviewPosition;
          this.setScrollPosition(overviewPosition, thumbPosition);
        }
      },

      setScrollPosition: function (overviewPosition, thumbPosition) {
        this.$thumb.css(this.sizing.offsetComponent(), thumbPosition + "px");
        this.scrollable.$overview.css(this.sizing.offsetComponent(), -overviewPosition + "px");
      },

      setScrollPositionWithAnimation: function (overviewPosition, thumbPosition) {
        var thumbAnimationOpts = {};
        var overviewAnimationOpts = {};
        thumbAnimationOpts[this.sizing.offsetComponent()] = thumbPosition + "px";
        this.$thumb.animate(thumbAnimationOpts, this.scrollable.options.animationSpeed);
        overviewAnimationOpts[this.sizing.offsetComponent()] = -overviewPosition + "px";
        this.scrollable.$overview.animate(overviewAnimationOpts, this.scrollable.options.animationSpeed);
      },

      calculateMaxThumbPosition: function () {
        return this.sizing.size(this.$scrollBar) - this.thumbSize;
      },

      calculateMaxOverviewPosition: function () {
        return this.sizing.size(this.scrollable.$overview) - this.sizing.size(this.scrollable.$viewPort);
      },

      setScrollEvent: function (event) {
        var attr = "page" + this.sizing.scrollAxis();
        if (!this.scrollEvent || this.scrollEvent[attr] != event[attr])
          this.scrollEvent = {pageX: event.pageX, pageY: event.pageY};
      },

      scrollToElement: function (element) {
        var $element = $(element);
        if (this.sizing.isInside($element, this.scrollable.$overview) && !this.sizing.isInside($element, this.scrollable.$viewPort)) {
          var elementOffset = $element.offset();
          var overviewOffset = this.scrollable.$overview.offset();
          var viewPortOffset = this.scrollable.$viewPort.offset();
          this.scrollOverviewTo(elementOffset[this.sizing.offsetComponent()] - overviewOffset[this.sizing.offsetComponent()], true);
        }
      },

      remove: function () {
        this.removeMouseMoveScrolling();
        this.removeMouseWheelScrolling();
        this.removeTouchScrolling();
        this.removeMouseClickScrolling();
        this.removeWindowResize();
      }

    }

    var HSizing = function () {
    }

    HSizing.prototype = {
      size: function ($el, arg) {
        if (arg)
          return $el.width(arg);
        else
          return $el.width();
      },

      minSize: function ($el) {
        return parseInt($el.css("min-width")) || 0;
      },

      fixedThumbSize: function (options) {
        return options.fixedThumbWidth;
      },

      scrollBar: function ($el) {
        return $el.find(".scroll-bar.horizontal");
      },

      mouseDelta: function (event1, event2) {
        return event2.pageX - event1.pageX;
      },

      offsetComponent: function () {
        return "left";
      },

      wheelDelta: function (deltaX, deltaY) {
        return deltaX;
      },

      scrollAxis: function () {
        return "X";
      },

      scrollDirection: function (oldPercent, newPercent) {
        return oldPercent < newPercent ? "right" : "left";
      },

      scrollingKeys: {
        37: function (viewPortSize) {
          return -10; //arrow left
        },
        39: function (viewPortSize) {
          return 10; //arrow right
        }
      },

      isInside: function (element, wrappingElement) {
        var $element = $(element);
        var $wrappingElement = $(wrappingElement);
        var elementOffset = $element.offset();
        var wrappingElementOffset = $wrappingElement.offset();
        return (elementOffset.left >= wrappingElementOffset.left) &&
          (elementOffset.left + $element.width() <= wrappingElementOffset.left + $wrappingElement.width());
      }

    }

    var VSizing = function () {
    }

    VSizing.prototype = {

      size: function ($el, arg) {
        if (arg)
          return $el.height(arg);
        else
          return $el.height();
      },

      minSize: function ($el) {
        return parseInt($el.css("min-height")) || 0;
      },

      fixedThumbSize: function (options) {
        return options.fixedThumbHeight;
      },

      scrollBar: function ($el) {
        return $el.find(".scroll-bar.vertical");
      },

      mouseDelta: function (event1, event2) {
        return event2.pageY - event1.pageY;
      },

      offsetComponent: function () {
        return "top";
      },

      wheelDelta: function (deltaX, deltaY) {
        return deltaY;
      },

      scrollAxis: function () {
        return "Y";
      },

      scrollDirection: function (oldPercent, newPercent) {
        return oldPercent < newPercent ? "down" : "up";
      },

      scrollingKeys: {
        38: function (viewPortSize) {
          return -10; //arrow up
        },
        40: function (viewPortSize) {
          return 10; //arrow down
        },
        33: function (viewPortSize) {
          return -(viewPortSize - 20); //page up
        },
        34: function (viewPortSize) {
          return viewPortSize - 20; //page down
        }
      },

      isInside: function (element, wrappingElement) {
        var $element = $(element);
        var $wrappingElement = $(wrappingElement);
        var elementOffset = $element.offset();
        var wrappingElementOffset = $wrappingElement.offset();
        return (elementOffset.top >= wrappingElementOffset.top) &&
          (elementOffset.top + $element.height() <= wrappingElementOffset.top + $wrappingElement.height());
      }

    }

    return this.each(function () {
      if (options == undefined)
        options = defaultOptions;
      if (typeof(options) == "string") {
        var scrollable = $(this).data("scrollable");
        if (scrollable)
          scrollable[options](args);
      }
      else if (typeof(options) == "object") {
        options = $.extend(defaultOptions, options);
        new Scrollable($(this), options);
      }
      else
        throw "Invalid type of options";
    });

  }
  ;

})
  (jQuery);

(function ($) {

  var types = ['DOMMouseScroll', 'mousewheel'];

  if ($.event.fixHooks) {
    for (var i = types.length; i;) {
      $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
  }

  $.event.special.mousewheel = {
    setup: function () {
      if (this.addEventListener) {
        for (var i = types.length; i;) {
          this.addEventListener(types[--i], handler, false);
        }
      } else {
        this.onmousewheel = handler;
      }
    },

    teardown: function () {
      if (this.removeEventListener) {
        for (var i = types.length; i;) {
          this.removeEventListener(types[--i], handler, false);
        }
      } else {
        this.onmousewheel = null;
      }
    }
  };

  $.fn.extend({
    mousewheel: function (fn) {
      return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },

    unmousewheel: function (fn) {
      return this.unbind("mousewheel", fn);
    }
  });


  function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call(arguments, 1), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";

    // Old school scrollwheel delta
    if (orgEvent.wheelDelta) {
      delta = orgEvent.wheelDelta / 120;
    }
    if (orgEvent.detail) {
      delta = -orgEvent.detail / 3;
    }

    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;

    // Gecko
    if (orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
      deltaY = 0;
      deltaX = delta;
    }

    // Webkit
    if (orgEvent.wheelDeltaY !== undefined) {
      deltaY = orgEvent.wheelDeltaY / 120;
    }
    if (orgEvent.wheelDeltaX !== undefined) {
      deltaX = orgEvent.wheelDeltaX / 120;
    }

    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);

    return ($.event.dispatch || $.event.handle).apply(this, args);
  }

})(jQuery);

},{}],11:[function(require,module,exports){
// Storage cache.
var cache = {};
// The store handling expiration of data.
var expiresStore = new Store({
	namespace: '__storage-wrapper:expires'
});

/**
 * Storage wrapper for making routine storage calls super easy.
 * @class Store
 * @constructor
 * @param {object} [options]                     The options for the store. Options not overridden will use the defaults.
 * @param {mixed}  [options.namespace='']        See {{#crossLink "Store/setNamespace"}}Store#setNamespace{{/crossLink}}
 * @param {mixed}  [options.storageType='local'] See {{#crossLink "Store/setStorageType"}}Store#setStorageType{{/crossLink}}
 */
function Store(options) {
	var settings = {
		namespace: '',
		storageType: 'local'
	};

	/**
	 * Sets the storage namespace.
	 * @method setNamespace
	 * @param {string|false|null} namespace The namespace to work under. To use no namespace (e.g. global namespace), pass in `false` or `null` or an empty string.
	 */
	this.setNamespace = function (namespace) {
		var validNamespace = /^[\w-:]+$/;
		// No namespace.
		if (namespace === false || namespace == null || namespace === '') {
			settings.namespace = '';
			return;
		}
		if (typeof namespace !== 'string' || !validNamespace.test(namespace)) {
			throw new Error('Invalid namespace.');
		}
		settings.namespace = namespace;
	};

	/**
	 * Gets the current storage namespace.
	 * @method getNamespace
	 * @return {string} The current namespace.
	 */
	this.getNamespace = function (includeSeparator) {
		if (includeSeparator && settings.namespace !== '') {
			return settings.namespace + ':';
		}
		return settings.namespace;
	}

	/**
	 * Sets the type of storage to use.
	 * @method setStorageType
	 * @param {string} type The type of storage to use. Use `session` for `sessionStorage` and `local` for `localStorage`.
	 */
	this.setStorageType = function (type) {
		if (['session', 'local'].indexOf(type) < 0) {
			throw new Error('Invalid storage type.');
		}
		settings.storageType = type;
	};
	/**
	 * Get the type of storage being used.
	 * @method getStorageType
	 * @return {string} The type of storage being used.
	 */
	this.getStorageType = function () {
		return settings.storageType;
	};

	// Override default settings.
	if (options) {
		for (var key in options) {
			switch (key) {
				case 'namespace':
					this.setNamespace(options[key]);
					break;
				case 'storageType':
					this.setStorageType(options[key]);
					break;
			}
		}
	}
}

/**
 * Gets the actual handler to use
 * @method getStorageHandler
 * @return {mixed} The storage handler.
 */
Store.prototype.getStorageHandler = function () {
	var handlers = {
		'local': localStorage,
		'session': sessionStorage
	};
	return handlers[this.getStorageType()];
}

/**
 * Gets the full storage name for a key, including the namespace, if any.
 * @method getStorageKey
 * @param  {string} key The storage key name.
 * @return {string}     The full storage name that is used by the storage methods.
 */
Store.prototype.getStorageKey = function (key) {
	if (!key || typeof key !== 'string' || key.length < 1) {
		throw new Error('Key must be a string.');
	}
	return this.getNamespace(true) + key;
};

/**
 * Gets a storage item from the current namespace.
 * @method get
 * @param  {string} key          The key that the data can be accessed under.
 * @param  {mixed}  defaultValue The default value to return in case the storage value is not set or `null`.
 * @return {mixed}               The data for the storage.
 */
Store.prototype.get = function (key, defaultValue) {
	// Prevent recursion. Only check expire date if it isn't called from `expiresStore`.
	if (this !== expiresStore) {
		// Check if key is expired.
		var expireDate = expiresStore.get(this.getStorageKey(key));
		if (expireDate !== null && expireDate.getTime() < Date.now()) {
			// Expired, remove it.
			this.remove(key);
			expiresStore.remove(this.getStorageKey(key));
		}
	}

	// Cached, read from memory.
	if (cache[this.getStorageKey(key)] != null) {
		return cache[this.getStorageKey(key)];
	}

	var val = this.getStorageHandler().getItem(this.getStorageKey(key));

	// Value doesn't exist and we have a default, return default.
	if (val === null && typeof defaultValue !== 'undefined') {
		return defaultValue;
	}

	// Only pre-process strings.
	if (typeof val === 'string') {
		// Handle RegExps.
		if (val.indexOf('~RegExp:') === 0) {
			var matches = /^~RegExp:([gim]*?):(.*)/.exec(val);
			val = new RegExp(matches[2], matches[1]);
		}
		// Handle Dates.
		else if (val.indexOf('~Date:') === 0) {
			val = new Date(val.replace(/^~Date:/, ''));
		}
		// Handle numbers.
		else if (val.indexOf('~Number:') === 0) {
			val = parseInt(val.replace(/^~Number:/, ''), 10);
		}
		// Handle booleans.
		else if (val.indexOf('~Boolean:') === 0) {
			val = val.replace(/^~Boolean:/, '') === 'true';
		}
		// Handle objects.
		else if (val.indexOf('~JSON:') === 0) {
			val = val.replace(/^~JSON:/, '');
			// Try parsing it.
			try {
				val = JSON.parse(val);
			}
			// Parsing went wrong (invalid JSON), return default or null.
			catch (e) {
				if (typeof defaultValue !== 'undefined') {
					return defaultValue;
				}
				return null;
			}
		}
	}

	// Return it.
	cache[this.getStorageKey(key)] = val;
	return val;
};

/**
 * Sets a storage item on the current namespace.
 * @method set
 * @param {string}      key       The key that the data can be accessed under.
 * @param {mixed}       val       The value to store. May be the following types of data: `RegExp`, `Date`, `Object`, `String`, `Boolean`, `Number`
 * @param {Date|number} [expires] The date in the future to expire, or relative number of milliseconds from `Date#now` to expire.
 *
 * Note: This converts special data types that normally can't be stored in the following way:
 * 
 * - `RegExp`: prefixed with type, flags stored, and source stored as string.
 * - `Date`: prefixed with type, stored as string using `Date#toString`.
 * - `Object`: prefixed with "JSON" indicator, stored as string using `JSON#stringify`.
 */
Store.prototype.set = function (key, val, expires) {
	var parsedVal = null;
	// Handle RegExps.
	if (val instanceof RegExp) {
		var flags = [
			val.global ? 'g' : '',
			val.ignoreCase ? 'i' : '',
			val.multiline ? 'm' : '',
		].join('');
		parsedVal = '~RegExp:' + flags + ':' + val.source;
	}
	// Handle Dates.
	else if (val instanceof Date) {
		parsedVal = '~Date:' + val.toString();
	}
	// Handle objects.
	else if (val === Object(val)) {
		parsedVal = '~JSON:' + JSON.stringify(val);
	}
	// Handle numbers.
	else if (typeof val === 'number') {
		parsedVal = '~Number:' + val.toString();
	}
	// Handle booleans.
	else if (typeof val === 'boolean') {
		parsedVal = '~Boolean:' + val.toString();
	}
	// Handle strings.
	else if (typeof val === 'string') {
		parsedVal = val;
	}
	// Throw if we don't know what it is.
	else {
		throw new Error('Unable to store this value; wrong value type.');
	}
	// Set expire date if needed.
	if (typeof expires !== 'undefined') {
		// Convert to a relative date.
		if (typeof expires === 'number') {
			expires = new Date(Date.now() + expires);
		}
		// Make sure it is a date.
		if (expires instanceof Date) {
			expiresStore.set(this.getStorageKey(key), expires);
		}
		else {
			throw new Error('Key expire must be a valid date or timestamp.');
		}
	}
	// Save it.
	cache[this.getStorageKey(key)] = val;
	this.getStorageHandler().setItem(this.getStorageKey(key), parsedVal);
};

/**
 * Gets all data for the current namespace.
 * @method getAll
 * @return {object} An object containing all data in the form of `{theKey: theData}` where `theData` is parsed using {{#crossLink "Store/get"}}Store#get{{/crossLink}}.
 */
Store.prototype.getAll = function () {
	var keys = this.listKeys();
	var data = {};
	keys.forEach(function (key) {
		data[key] = this.get(key);
	}, this);
	return data;
};

/**
 * List all keys that are tied to the current namespace.
 * @method listKeys
 * @return {array} The storage keys.
 */
Store.prototype.listKeys = function () {
	var keys = [];
	var key = null;
	var storageLength = this.getStorageHandler().length;
	var prefix = new RegExp('^' + this.getNamespace(true));
	for (var i = 0; i < storageLength; i++) {
		key = this.getStorageHandler().key(i)
		if (prefix.test(key)) {
			keys.push(key.replace(prefix, ''));
		}
	}
	return keys;
};

/**
 * Removes a specific key and data from the current namespace.
 * @method remove
 * @param {string} key The key to remove the data for.
 */
Store.prototype.remove = function (key) {
	cache[this.getStorageKey(key)] = null;
	this.getStorageHandler().removeItem(this.getStorageKey(key));
};

/**
 * Removes all data and keys from the current namespace.
 * @method removeAll
 */
Store.prototype.removeAll = function () {
	this.listKeys().forEach(this.remove, this);
};

/**
 * Removes namespaced items from the cache so your next {{#crossLink "Store/get"}}Store#get{{/crossLink}} will be fresh from the storage.
 * @method freshen
 * @param {string} key The key to remove the cache data for.
 */
Store.prototype.freshen = function (key) {
	var keys = key ? [key] : this.listKeys();
	keys.forEach(function (key) {
		cache[this.getStorageKey(key)] = null;
	}, this);
};

/**
 * Migrate data from a different namespace to current namespace.
 * @method migrate
 * @param {object}   migration                          The migration object.
 * @param {string}   migration.toKey                    The key name under your current namespace the old data should change to.
 * @param {string}   migration.fromNamespace            The old namespace that the old key belongs to.
 * @param {string}   migration.fromKey                  The old key name to migrate from.
 * @param {string}   [migration.fromStorageType]        The storage type to migrate from. Defaults to same type as where you are migrating to.
 * @param {boolean}  [migration.keepOldData=false]      Whether old data should be kept after it has been migrated.
 * @param {boolean}  [migration.overwriteNewData=false] Whether old data should overwrite currently stored data if it exists.
 * @param {function} [migration.transform]              The function to pass the old key data through before migrating.
 * @example
 * 
 *     var Store = require('storage-wrapper');
 *     var store = new Store({
 *         namespace: 'myNewApp'
 *     });
 *
 *     // Migrate from the old app.
 *     store.migrate({
 *         toKey: 'new-key',
 *         fromNamespace: 'myOldApp',
 *         fromKey: 'old-key'
 *     });
 *     
 *     // Migrate from global data. Useful when moving from other storage wrappers or regular ol' `localStorage`.
 *     store.migrate({
 *         toKey: 'other-new-key',
 *         fromNamespace: '',
 *         fromKey: 'other-old-key-on-global'
 *     });
 *     
 *     // Migrate some JSON data that was stored as a string.
 *     store.migrate({
 *         toKey: 'new-json-key',
 *         fromNamespace: 'myOldApp',
 *         fromKey: 'old-json-key',
 *         // Try converting some old JSON data.
 *         transform: function (data) {
 *             try {
 *                 return JSON.parse(data);
 *             }
 *             catch (e) {
 *                 return data;
 *             }
 *         }
 *     });
 */

Store.prototype.migrate = function (migration) {
	// Save our current namespace.
	var toNamespace = this.getNamespace();
	var toStorageType = this.getStorageType();

	// Create a temporary store to avoid changing namespace during actual get/sets.
	var store = new Store({
		namespace: toNamespace,
		storageType: toStorageType
	});

	var data = null;

	// Get data from old namespace.
	store.setNamespace(migration.fromNamespace);
	if (typeof migration.fromStorageType !== 'undefined') {
		store.setStorageType(migration.fromStorageType);
	}
	data = store.get(migration.fromKey);

	// Remove old if needed.
	if (!migration.keepOldData) {
		store.remove(migration.fromKey);
	}
	
	// No data, ignore this migration.
	if (data === null) {
		return;
	}

	// Transform data if needed.
	if (typeof migration.transform === 'function') {
		data = migration.transform(data);
	}
	else if (typeof migration.transform !== 'undefined') {
		throw new Error('Invalid transform callback.');
	}

	// Go back to current namespace.
	store.setNamespace(toNamespace);
	store.setStorageType(toStorageType);

	// Only overwrite new data if it doesn't exist or it's requested.
	if (store.get(migration.toKey) === null || migration.overwriteNewData) {
		store.set(migration.toKey, data);
	}
};

/**
 * Creates a substore that is nested in the current namespace.
 * @method createSubstore
 * @param  {string} namespace The substore's namespace.
 * @return {Store}            The substore.
 * @example
 * 
 *     var Store = require('storage-wrapper');
 *     // Create main store.
 *     var store = new Store({
 *         namespace: 'myapp'
 *     });
 *
 *     // Create substore.
 *     var substore = store.createSubstore('things');
 *     substore.set('foo', 'bar');
 *
 *     substore.get('foo') === store.get('things:foo');
 *     // true
 */
Store.prototype.createSubstore = function (namespace) {
	return new Store({
		namespace: this.getNamespace(true) + namespace,
		storageType: this.getStorageType()
	});
};

module.exports = Store;

},{}],12:[function(require,module,exports){
module.exports={
	"name": "twitch-chat-emotes",
	"version": "0.6.4",
	"homepage": "http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/",
	"bugs": "https://github.com/cletusc/Userscript--Twitch-Chat-Emotes/issues",
	"author": "Ryan Chatham <ryan.b.chatham@gmail.com> (https://github.com/cletusc)",
	"repository": {
		"type": "git",
		"url": "https://github.com/cletusc/Userscript--Twitch-Chat-Emotes.git"
	},
	"userscript": {
		"name": "Twitch Chat Emotes",
		"namespace": "#Cletus",
		"version": "{{{pkg.version}}}",
		"description": "Adds a button to Twitch that allows you to \"click-to-insert\" an emote.",
		"copyright": "2011+, {{{pkg.author}}}",
		"author": "{{{pkg.author}}}",
		"icon": "http://www.gravatar.com/avatar.php?gravatar_id=6875e83aa6c563790cb2da914aaba8b3&r=PG&s=48&default=identicon",
		"license": [
			"MIT; http://opensource.org/licenses/MIT",
			"CC BY-NC-SA 3.0; http://creativecommons.org/licenses/by-nc-sa/3.0/"
		],
		"homepage": "{{{pkg.homepage}}}",
		"supportURL": "{{{pkg.bugs}}}",
		"contributionURL": "http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/#donate",
		"grant": "none",
		"include": "http://*.twitch.tv/*",
		"exclude": [
			"http://api.twitch.tv/*",
			"http://chatdepot.twitch.tv/*",
			"http://*.twitch.tv/*/profile*"
		]
	},
	"scripts": {
		"install": "napa"
	},
	"devDependencies": {
		"browser-sync": "^1.3.2",
		"browserify": "^5.9.1",
		"gulp": "^3.8.3",
		"gulp-autoprefixer": "0.0.8",
		"gulp-beautify": "1.1.0",
		"gulp-changed": "^0.4.1",
		"gulp-concat": "^2.2.0",
		"gulp-conflict": "^0.1.2",
		"gulp-css-base64": "^1.1.0",
		"gulp-css2js": "^1.0.2",
		"gulp-header": "^1.0.2",
		"gulp-hogan-compile": "^0.2.1",
		"gulp-minify-css": "^0.3.5",
		"gulp-notify": "^1.4.1",
		"gulp-rename": "^1.2.0",
		"gulp-uglify": "^0.3.1",
		"gulp-util": "^3.0.0",
		"hogan.js": "^3.0.2",
		"jquery-ui": "^1.10.5",
		"napa": "^0.4.1",
		"pretty-hrtime": "^0.2.1",
		"vinyl-map": "^1.0.1",
		"vinyl-source-stream": "^0.1.1",
		"watchify": "^1.0.1",
		"storage-wrapper": "cletusc/storage-wrapper#v0.1.1"
	},
	"napa": {
		"jquery-custom-scrollbar": "mzubala/jquery-custom-scrollbar#0.5.5"
	}
}

},{}],13:[function(require,module,exports){
var api = window.Twitch.api;

function getBadges(username, callback) {
	// Note: not a documented API endpoint.
	api.get('chat/' + username + '/badges')
		.done(function (api) {
			callback(api);
		})
		.fail(function () {
			callback({});
		});
}

function getTickets(callback) {
	// Note: not a documented API endpoint.
	api.get(
		'/api/users/:login/tickets',
		{
			offset: 0,
			limit: 100,
			unended: true
		}
	)
		.done(function (api) {
			callback(api.tickets || []);
		})
		.fail(function () {
			callback([]);
		});
}

module.exports = {
	getBadges: getBadges,
	getTickets: getTickets
};

},{}],14:[function(require,module,exports){
var Store = require('storage-wrapper');
var storage = {};

// General storage.
storage.global = new Store({
	namespace: 'emote-menu-for-twitch'
});

// Emote popularity storage.
storage.popularity = storage.global.createSubstore('popularity');
// Emote visibility storage.
storage.visibility = storage.global.createSubstore('visibility');

// Migrate old keys.
storage.global.migrate({
	fromNamespace: '',
	fromKey: 'emote-popularity-tracking',
	toKey: '_migrate',
	transform: function (data) {
		try {
			data = JSON.parse(data);
		}
		catch (e) {
			data = {};
		}
		for (var key in data) {
			if (!data.hasOwnProperty(key)) {
				continue;
			}
			storage.popularity.set(key, Number(data[key]));
		}
		return data;
	}
});

module.exports = storage;

},{"storage-wrapper":11}],15:[function(require,module,exports){
var templates = require('../../build/templates');

module.exports = (function () {
	var data = {};
	var key = null;

	// Convert templates to their shorter "render" form.
	for (key in templates) {
		if (!templates.hasOwnProperty(key)) {
			continue;
		}
		data[key] = render(key);
	}

	// Shortcut the render function. All templates will be passed in as partials by default.
	function render(template) {
		template = templates[template];
		return function (context, partials, indent) {
			return template.render(context, partials || templates, indent);
		};
	}

	return data;
})();

},{"../../build/templates":3}],16:[function(require,module,exports){
(function ($) {
	$.fn.resizable = function (options) {
		var settings = $.extend({
			alsoResize: null,
			alsoResizeType: 'both', // `height`, `width`, `both`
			containment: null,
			create: null,
			destroy: null,
			handle: '.resize-handle',
			maxHeight: 9999,
			maxWidth: 9999,
			minHeight: 0,
			minWidth: 0,
			resize: null,
			resizeOnce: null,
			snapSize: 1,
			start: null,
			stop: null
		}, options);

		settings.element = $(this);

		function recalculateSize(evt) {
			var data = evt.data,
				resized = {};
			data.diffX = Math.round((evt.pageX - data.pageX) / settings.snapSize) * settings.snapSize;
			data.diffY = Math.round((evt.pageY - data.pageY) / settings.snapSize) * settings.snapSize;
			if (Math.abs(data.diffX) > 0 || Math.abs(data.diffY) > 0) {
				if (
					settings.element.height() !== data.height + data.diffY &&
					data.height + data.diffY >= settings.minHeight &&
					data.height + data.diffY <= settings.maxHeight &&
					(settings.containment ? data.outerHeight + data.diffY + data.offset.top <= settings.containment.offset().top + settings.containment.outerHeight() : true)
				) {
					settings.element.height(data.height + data.diffY);
					resized.height = true;
				}
				if (
					settings.element.width() !== data.width + data.diffX &&
					data.width + data.diffX >= settings.minWidth &&
					data.width + data.diffX <= settings.maxWidth &&
					(settings.containment ? data.outerWidth + data.diffX + data.offset.left <= settings.containment.offset().left + settings.containment.outerWidth() : true)
				) {
					settings.element.width(data.width + data.diffX);
					resized.width = true;
				}
				if (resized.height || resized.width) {
					if (settings.resizeOnce) {
						settings.resizeOnce.bind(settings.element)(evt.data);
						settings.resizeOnce = null;
					}
					if (settings.resize) {
						settings.resize.bind(settings.element)(evt.data);
					}
					if (settings.alsoResize) {
						if (resized.height && (settings.alsoResizeType === 'height' || settings.alsoResizeType === 'both')) {
							settings.alsoResize.height(data.alsoResizeHeight + data.diffY);
						}
						if (resized.width && (settings.alsoResizeType === 'width' || settings.alsoResizeType === 'both')) {
							settings.alsoResize.width(data.alsoResizeWidth + data.diffX);
						}
					}
				}
			}
		}

		function start(evt) {
			evt.preventDefault();
			if (settings.start) {
				settings.start.bind(settings.element)();
			}
			var data = {
				alsoResizeHeight: settings.alsoResize ? settings.alsoResize.height() : 0,
				alsoResizeWidth: settings.alsoResize ? settings.alsoResize.width() : 0,
				height: settings.element.height(),
				offset: settings.element.offset(),
				outerHeight: settings.element.outerHeight(),
				outerWidth: settings.element.outerWidth(),
				pageX: evt.pageX,
				pageY: evt.pageY,
				width: settings.element.width()
			};
			$(document).on('mousemove', '*', data, recalculateSize);
			$(document).on('mouseup', '*', stop);
		}

		function stop() {
			if (settings.stop) {
				settings.stop.bind(settings.element)();
			}
			$(document).off('mousemove', '*', recalculateSize);
			$(document).off('mouseup', '*', stop);
		}

		if (settings.handle) {
			if (settings.alsoResize && ['both', 'height', 'width'].indexOf(settings.alsoResizeType) >= 0) {
				settings.alsoResize = $(settings.alsoResize);
			}
			if (settings.containment) {
				settings.containment = $(settings.containment);
			}
			settings.handle = $(settings.handle);
			settings.snapSize = settings.snapSize < 1 ? 1 : settings.snapSize;

			if (options === 'destroy') {
				settings.handle.off('mousedown', start);

				if (settings.destroy) {
					settings.destroy.bind(this)();
				}
				return this;
			}

			settings.handle.on('mousedown', start);

			if (settings.create) {
				settings.create.bind(this)();
			}
		}
		return this;
	};
})(jQuery);

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxVc2Vyc1xcQ2xldHVzXFxQcm9qZWN0c1xcVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIi4vc3JjL3NjcmlwdC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvYnVpbGQvc3R5bGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wdW55Y29kZS9wdW55Y29kZS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9kZWNvZGUuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2luZGV4LmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXJsL3VybC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2hvZ2FuLmpzL2xpYi90ZW1wbGF0ZS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2pxdWVyeS1jdXN0b20tc2Nyb2xsYmFyL2pxdWVyeS5jdXN0b20tc2Nyb2xsYmFyLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvc3RvcmFnZS13cmFwcGVyL2luZGV4LmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9wYWNrYWdlLmpzb24iLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL2FwaS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvc3RvcmFnZS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvdGVtcGxhdGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvcGx1Z2lucy9yZXNpemFibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3htQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25zQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6d0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy90ZW1wbGF0ZXMnKTtcclxudmFyIHBrZyA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xyXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9zdG9yYWdlJyk7XHJcbnZhciBhcGkgPSByZXF1aXJlKCcuL21vZHVsZXMvYXBpJyk7XHJcblxyXG52YXIgJCA9IG51bGw7XHJcbnZhciBqUXVlcnkgPSBudWxsO1xyXG5cclxuLy8gU2NyaXB0LXdpZGUgdmFyaWFibGVzLlxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbnZhciB1cmwgPSByZXF1aXJlKCd1cmwnKTtcclxudmFyIGVtb3RlcyA9IHtcclxuXHR1c2FibGU6IFtdLFxyXG5cdGdldCByYXcoKSB7XHJcblx0XHRpZiAod2luZG93LkFwcCkge1xyXG5cdFx0XHRyZXR1cm4gd2luZG93LkFwcC5fX2NvbnRhaW5lcl9fLmxvb2t1cCgnY29udHJvbGxlcjplbW90aWNvbnMnKS5nZXQoJ2Vtb3RpY29ucycpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIFtdO1xyXG5cdH0sXHJcblx0c3Vic2NyaXB0aW9uczoge1xyXG5cdFx0YmFkZ2VzOiB7fSxcclxuXHRcdGVtb3Rlczoge31cclxuXHR9XHJcbn07XHJcbnZhciBpc0luaXRpYXRlZCA9IGZhbHNlO1xyXG5cclxuLy8gRE9NIGVsZW1lbnRzLlxyXG52YXIgZWxlbWVudHMgPSB7XHJcblx0Ly8gVGhlIGJ1dHRvbiB0byBzZW5kIGEgY2hhdCBtZXNzYWdlLlxyXG5cdGNoYXRCdXR0b246IG51bGwsXHJcblx0Ly8gVGhlIGFyZWEgd2hlcmUgYWxsIGNoYXQgbWVzc2FnZXMgYXJlIGNvbnRhaW5lZC5cclxuXHRjaGF0Q29udGFpbmVyOiBudWxsLFxyXG5cdC8vIFRoZSBpbnB1dCBmaWVsZCBmb3IgY2hhdCBtZXNzYWdlcy5cclxuXHRjaGF0Qm94OiBudWxsLFxyXG5cdC8vIFRoZSBidXR0b24gdXNlZCB0byBzaG93IHRoZSBtZW51LlxyXG5cdG1lbnVCdXR0b246IG51bGwsXHJcblx0Ly8gVGhlIG1lbnUgdGhhdCBjb250YWlucyBhbGwgZW1vdGVzLlxyXG5cdG1lbnU6IG51bGxcclxufTtcclxuXHJcbnZhciBTQ1JJUFRfTkFNRSA9IHBrZy51c2Vyc2NyaXB0Lm5hbWU7XHJcbnZhciBNRVNTQUdFUyA9IHtcclxuXHROT19DSEFUX0VMRU1FTlQ6ICdUaGVyZSBpcyBubyBjaGF0IGVsZW1lbnQgb24gdGhlIHBhZ2UsIHVuYWJsZSB0byBjb250aW51ZS4nLFxyXG5cdE9CSkVDVFNfTk9UX0xPQURFRDogJ05lZWRlZCBvYmplY3RzIGhhdmVuXFwndCBsb2FkZWQgeWV0LicsXHJcblx0VElNRU9VVF9TQ1JJUFRfTE9BRDogJ1NjcmlwdCB0b29rIHRvbyBsb25nIHRvIGxvYWQuIFJlZnJlc2ggdG8gdHJ5IGFnYWluLidcclxufTtcclxuXHJcbi8vIFRoZSBiYXNpYyBzbWlsZXkgZW1vdGVzLlxyXG52YXIgYmFzaWNFbW90ZXMgPSBbJzooJywgJzopJywgJzovJywgJzpEJywgJzpvJywgJzpwJywgJzp6JywgJzspJywgJztwJywgJzwzJywgJz4oJywgJ0IpJywgJ1IpJywgJ29fbycsICcjLycsICc6NycsICc6PicsICc6UycsICc8XSddO1xyXG5cclxudmFyIGhlbHBlcnMgPSB7XHJcblx0dXNlcjoge1xyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVjayBpZiB1c2VyIGlzIGxvZ2dlZCBpbiwgYW5kIHByb21wdHMgdGhlbSB0byBpZiB0aGV5IGFyZW4ndC5cclxuXHRcdCAqIEByZXR1cm4ge2Jvb2xlYW59IGB0cnVlYCBpZiBsb2dnZWQgaW4sIGBmYWxzZWAgaWYgbG9nZ2VkIG91dC5cclxuXHRcdCAqL1xyXG5cdFx0bG9naW46IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Ly8gQ2hlY2sgaWYgbG9nZ2VkIGluIGFscmVhZHkuXHJcblx0XHRcdGlmICh3aW5kb3cuVHdpdGNoICYmIHdpbmRvdy5Ud2l0Y2gudXNlci5pc0xvZ2dlZEluKCkpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBOb3QgbG9nZ2VkIGluLCBjYWxsIFR3aXRjaCdzIGxvZ2luIG1ldGhvZC5cclxuXHRcdFx0JC5sb2dpbigpO1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9LFxyXG5cdFx0Z2V0RW1vdGVTZXRzOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHZhciBzZXRzID0gW107XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0c2V0cyA9IEFwcC5fX2NvbnRhaW5lcl9fXHJcblx0XHRcdFx0XHQubG9va3VwKCdjb250cm9sbGVyOmNoYXQnKVxyXG5cdFx0XHRcdFx0LmdldCgnY3VycmVudFJvb20nKVxyXG5cdFx0XHRcdFx0LmdldCgndG1pUm9vbScpXHJcblx0XHRcdFx0XHQuZ2V0RW1vdGVzKFR3aXRjaC51c2VyLmxvZ2luKCkpO1xyXG5cclxuXHRcdFx0XHRzZXRzID0gc2V0cy5maWx0ZXIoZnVuY3Rpb24gKHZhbCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHR5cGVvZiB2YWwgPT09ICdudW1iZXInICYmIHZhbCA+PSAwO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiBzZXRzO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlcnIpIHtcclxuXHRcdFx0XHRyZXR1cm4gW107XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcbn07XHJcblxyXG4vLyBRdWljayBtYW5pcHVsYXRpb24gb2Ygc2NyaXB0LXdpZGUgdmFyaWFibGVzLlxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyBQcmVmaXggYWxsIG1lc3NhZ2VzIHdpdGggc2NyaXB0IG5hbWUuXHJcbmZvciAodmFyIG1lc3NhZ2UgaW4gTUVTU0FHRVMpIHtcclxuXHRpZiAoTUVTU0FHRVMuaGFzT3duUHJvcGVydHkobWVzc2FnZSkpIHtcclxuXHRcdE1FU1NBR0VTW21lc3NhZ2VdID0gJ1snICsgU0NSSVBUX05BTUUgKyAnXTogJyArIE1FU1NBR0VTW21lc3NhZ2VdO1xyXG5cdH1cclxufVxyXG5cclxuLy8gT25seSBlbmFibGUgc2NyaXB0IGlmIHdlIGhhdmUgdGhlIHJpZ2h0IHZhcmlhYmxlcy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuKGZ1bmN0aW9uIGluaXQodGltZSkge1xyXG5cdCQgPSBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xyXG5cdHZhciByb3V0ZXMgPSB3aW5kb3cuQXBwICYmICh3aW5kb3cuQXBwLkNoYW5uZWxSb3V0ZSB8fCB3aW5kb3cuQXBwLkNoYXRSb3V0ZSk7XHJcblx0dmFyIG9iamVjdHNMb2FkZWQgPSAoXHJcblx0XHR3aW5kb3cuVHdpdGNoICE9PSB1bmRlZmluZWQgJiZcclxuXHRcdChcclxuXHRcdFx0d2luZG93LkFwcCAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHRcdHdpbmRvdy5BcHAuX19jb250YWluZXJfXyAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHRcdHdpbmRvdy5BcHAuX19jb250YWluZXJfXy5sb29rdXAoJ2NvbnRyb2xsZXI6ZW1vdGljb25zJykuZ2V0KCdlbW90aWNvbnMnKSAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHRcdHdpbmRvdy5BcHAuX19jb250YWluZXJfXy5sb29rdXAoJ2NvbnRyb2xsZXI6ZW1vdGljb25zJykuZ2V0KCdlbW90aWNvbnMnKS5sZW5ndGhcclxuXHRcdCkgJiZcclxuXHRcdGpRdWVyeSAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHQvLyBDaGF0IGJ1dHRvbi5cclxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjaGF0X3NwZWFrLCAuc2VuZC1jaGF0LWJ1dHRvbicpXHJcblx0KTtcclxuXHRpZiAoIWlzSW5pdGlhdGVkICYmIHJvdXRlcykge1xyXG5cdFx0dmFyIGFjdGl2YXRlID0ge1xyXG5cdFx0XHRhY3RpdmF0ZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHRoaXMuX3N1cGVyKCk7XHJcblx0XHRcdFx0aW5pdCg1MCk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0aWYgKHdpbmRvdy5BcHAuQ2hhbm5lbFJvdXRlKSB7XHJcblx0XHRcdHdpbmRvdy5BcHAuQ2hhbm5lbFJvdXRlLnJlb3BlbihhY3RpdmF0ZSk7XHJcblx0XHRcdGlzSW5pdGlhdGVkID0gdHJ1ZTtcclxuXHRcdH1cclxuXHRcdGlmICh3aW5kb3cuQXBwLkNoYXRSb3V0ZSkge1xyXG5cdFx0XHR3aW5kb3cuQXBwLkNoYXRSb3V0ZS5yZW9wZW4oYWN0aXZhdGUpO1xyXG5cdFx0XHRpc0luaXRpYXRlZCA9IHRydWU7XHJcblx0XHR9XHJcblx0fVxyXG5cdGlmICghb2JqZWN0c0xvYWRlZCB8fCAhcm91dGVzKSB7XHJcblx0XHQvLyBFcnJvcnMgaW4gYXBwcm94aW1hdGVseSAxMDI0MDBtcy5cclxuXHRcdGlmICh0aW1lID49IDYwMDAwKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoTUVTU0FHRVMuVElNRU9VVF9TQ1JJUFRfTE9BRCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGlmICh0aW1lID49IDEwMDAwKSB7XHJcblx0XHRcdGlmICghb2JqZWN0c0xvYWRlZCkge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihNRVNTQUdFUy5PQkpFQ1RTX05PVF9MT0FERUQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRzZXRUaW1lb3V0KGluaXQsIHRpbWUsIHRpbWUgKiAyKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0c2V0dXAoKTtcclxufSkoNTApO1xyXG5cclxuLy8gU3RhcnQgb2YgZnVuY3Rpb25zLlxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8qKlxyXG4gKiBSdW5zIGluaXRpYWwgc2V0dXAgb2YgRE9NIGFuZCB2YXJpYWJsZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzZXR1cCgpIHtcclxuXHQvLyBMb2FkIENTUy5cclxuXHRyZXF1aXJlKCcuLi9idWlsZC9zdHlsZXMnKTtcclxuXHQvLyBMb2FkIGpRdWVyeSBwbHVnaW5zLlxyXG5cdHJlcXVpcmUoJy4vcGx1Z2lucy9yZXNpemFibGUnKTtcclxuXHRyZXF1aXJlKCdqcXVlcnktY3VzdG9tLXNjcm9sbGJhci9qcXVlcnkuY3VzdG9tLXNjcm9sbGJhcicpO1xyXG5cdFxyXG5cdGVsZW1lbnRzLmNoYXRCdXR0b24gPSAkKCcuc2VuZC1jaGF0LWJ1dHRvbicpO1xyXG5cdGVsZW1lbnRzLmNoYXRCb3ggPSAkKCcuY2hhdC1pbnRlcmZhY2UgdGV4dGFyZWEnKTtcclxuXHRlbGVtZW50cy5jaGF0Q29udGFpbmVyID0gJCgnLmNoYXQtbWVzc2FnZXMnKTtcclxuXHJcblx0Ly8gTm8gY2hhdCwganVzdCBleGl0LlxyXG5cdGlmICghZWxlbWVudHMuY2hhdEJ1dHRvbi5sZW5ndGgpIHtcclxuXHRcdGNvbnNvbGUud2FybihNRVNTQUdFUy5OT19DSEFUX0VMRU1FTlQpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Y3JlYXRlTWVudUVsZW1lbnRzKCk7XHJcblx0YmluZExpc3RlbmVycygpO1xyXG5cclxuXHQvLyBHZXQgYWN0aXZlIHN1YnNjcmlwdGlvbnMuXHJcblx0YXBpLmdldFRpY2tldHMoZnVuY3Rpb24gKHRpY2tldHMpIHtcclxuXHRcdHRpY2tldHMuZm9yRWFjaChmdW5jdGlvbiAodGlja2V0KSB7XHJcblx0XHRcdHZhciBwcm9kdWN0ID0gdGlja2V0LnByb2R1Y3Q7XHJcblx0XHRcdHZhciBjaGFubmVsID0gcHJvZHVjdC5vd25lcl9uYW1lIHx8IHByb2R1Y3Quc2hvcnRfbmFtZTtcclxuXHRcdFx0Ly8gR2V0IHN1YnNjcmlwdGlvbnMgd2l0aCBlbW90ZXMuXHJcblx0XHRcdGlmIChwcm9kdWN0LmVtb3RpY29ucyAmJiBwcm9kdWN0LmVtb3RpY29ucy5sZW5ndGgpIHtcclxuXHRcdFx0XHQvLyBBZGQgZW1vdGVzIGNoYW5uZWwuXHJcblx0XHRcdFx0cHJvZHVjdC5lbW90aWNvbnMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRcdGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tnZXRFbW90ZUZyb21SZWdFeChuZXcgUmVnRXhwKGVtb3RlLnJlZ2V4KSldID0ge1xyXG5cdFx0XHRcdFx0XHRjaGFubmVsOiBjaGFubmVsLFxyXG5cdFx0XHRcdFx0XHR1cmw6IGVtb3RlLnVybFxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0Ly8gR2V0IGJhZGdlLlxyXG5cdFx0XHRcdGFwaS5nZXRCYWRnZXMoY2hhbm5lbCwgZnVuY3Rpb24gKGJhZGdlcykge1xyXG5cdFx0XHRcdFx0dmFyIGJhZGdlID0gJyc7XHJcblx0XHRcdFx0XHRpZiAoY2hhbm5lbCA9PT0gJ3R1cmJvJykge1xyXG5cdFx0XHRcdFx0XHRiYWRnZSA9IGJhZGdlcy50dXJiby5pbWFnZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2UgaWYgKGJhZGdlcy5zdWJzY3JpYmVyICYmIGJhZGdlcy5zdWJzY3JpYmVyLmltYWdlKSB7XHJcblx0XHRcdFx0XHRcdGJhZGdlID0gYmFkZ2VzLnN1YnNjcmliZXIuaW1hZ2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbY2hhbm5lbF0gPSBiYWRnZTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBpbml0aWFsIG1lbnUgZWxlbWVudHNcclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZU1lbnVFbGVtZW50cygpIHtcclxuXHQvLyBSZW1vdmUgbWVudSBidXR0b24gaWYgZm91bmQuXHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbiA9ICQoJyNlbW90ZS1tZW51LWJ1dHRvbicpO1xyXG5cdGlmIChlbGVtZW50cy5tZW51QnV0dG9uLmxlbmd0aCkge1xyXG5cdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5yZW1vdmUoKTtcclxuXHR9XHJcblx0Ly8gQ3JlYXRlIG1lbnUgYnV0dG9uLlxyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24gPSAkKHRlbXBsYXRlcy5lbW90ZUJ1dHRvbigpKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmluc2VydEJlZm9yZShlbGVtZW50cy5jaGF0QnV0dG9uKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmhpZGUoKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmZhZGVJbigpO1xyXG5cclxuXHQvLyBSZW1vdmUgbWVudSBpZiBmb3VuZC5cclxuXHRlbGVtZW50cy5tZW51ID0gJCgnI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCcpO1xyXG5cdGlmIChlbGVtZW50cy5tZW51Lmxlbmd0aCkge1xyXG5cdFx0ZWxlbWVudHMubWVudS5yZW1vdmUoKTtcclxuXHR9XHJcblx0Ly8gQ3JlYXRlIG1lbnUuXHJcblx0ZWxlbWVudHMubWVudSA9ICQodGVtcGxhdGVzLm1lbnUoKSk7XHJcblx0ZWxlbWVudHMubWVudS5hcHBlbmRUbyhkb2N1bWVudC5ib2R5KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEJpbmQgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gYmluZExpc3RlbmVycygpIHtcclxuXHJcblx0ZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcclxuXHRcdC8vIE1lbnUgc2hvd24sIGhpZGUgaXQuXHJcblx0XHRpZiAoZWxlbWVudHMubWVudS5pcygnOnZpc2libGUnKSkge1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LmhpZGUoKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5yZW1vdmVDbGFzcygncGlubmVkJyk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUucmVtb3ZlQ2xhc3MoJ2VkaXRpbmcnKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcblx0XHR9XHJcblx0XHQvLyBNZW51IGhpZGRlbiwgc2hvdyBpdC5cclxuXHRcdGVsc2UgaWYgKGhlbHBlcnMudXNlci5sb2dpbigpKSB7XHJcblx0XHRcdHBvcHVsYXRlRW1vdGVzTWVudSgpO1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LnNob3coKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5hZGRDbGFzcygnYWN0aXZlJyk7XHJcblxyXG5cdFx0XHQkKGRvY3VtZW50KS5vbignbW91c2V1cCcsIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKTtcclxuXHJcblx0XHRcdC8vIE1lbnUgbW92ZWQsIG1vdmUgaXQgYmFjay5cclxuXHRcdFx0aWYgKGVsZW1lbnRzLm1lbnUuaGFzQ2xhc3MoJ21vdmVkJykpIHtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51Lm9mZnNldChKU09OLnBhcnNlKGVsZW1lbnRzLm1lbnUuYXR0cignZGF0YS1vZmZzZXQnKSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIE5ldmVyIG1vdmVkLCBtYWtlIGl0IHRoZSBzYW1lIHNpemUgYXMgdGhlIGNoYXQgd2luZG93LlxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHR2YXIgZGlmZiA9IGVsZW1lbnRzLm1lbnUuaGVpZ2h0KCkgLSBlbGVtZW50cy5tZW51LmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykuaGVpZ2h0KCk7XHJcblx0XHRcdFx0Ly8gQWRqdXN0IHRoZSBzaXplIGFuZCBwb3NpdGlvbiBvZiB0aGUgcG9wdXAuXHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5oZWlnaHQoZWxlbWVudHMuY2hhdENvbnRhaW5lci5vdXRlckhlaWdodCgpIC0gKGVsZW1lbnRzLm1lbnUub3V0ZXJIZWlnaHQoKSAtIGVsZW1lbnRzLm1lbnUuaGVpZ2h0KCkpKTtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LndpZHRoKGVsZW1lbnRzLmNoYXRDb250YWluZXIub3V0ZXJXaWR0aCgpIC0gKGVsZW1lbnRzLm1lbnUub3V0ZXJXaWR0aCgpIC0gZWxlbWVudHMubWVudS53aWR0aCgpKSk7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5vZmZzZXQoZWxlbWVudHMuY2hhdENvbnRhaW5lci5vZmZzZXQoKSk7XHJcblx0XHRcdFx0Ly8gRml4IGAuZW1vdGVzLWFsbGAgaGVpZ2h0LlxyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKS5oZWlnaHQoZWxlbWVudHMubWVudS5oZWlnaHQoKSAtIGRpZmYpO1xyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKS53aWR0aChlbGVtZW50cy5tZW51LndpZHRoKCkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIFJlY2FsY3VsYXRlIGFueSBzY3JvbGwgYmFycy5cclxuXHRcdFx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcigncmVzaXplJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gY2hlY2tGb3JDbGlja091dHNpZGUoZSkge1xyXG5cdFx0XHQvLyBOb3Qgb3V0c2lkZSBvZiB0aGUgbWVudSwgaWdub3JlIHRoZSBjbGljay5cclxuXHRcdFx0aWYgKCQoZS50YXJnZXQpLmlzKCcjZW1vdGUtbWVudS1mb3ItdHdpdGNoLCAjZW1vdGUtbWVudS1mb3ItdHdpdGNoIConKSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBDbGlja2VkIG9uIHRoZSBtZW51IGJ1dHRvbiwganVzdCByZW1vdmUgdGhlIGxpc3RlbmVyIGFuZCBsZXQgdGhlIG5vcm1hbCBsaXN0ZW5lciBoYW5kbGUgaXQuXHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5pcygnOnZpc2libGUnKSB8fCAkKGUudGFyZ2V0KS5pcygnI2Vtb3RlLW1lbnUtYnV0dG9uLCAjZW1vdGUtbWVudS1idXR0b24gKicpKSB7XHJcblx0XHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgY2hlY2tGb3JDbGlja091dHNpZGUpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBDbGlja2VkIG91dHNpZGUsIG1ha2Ugc3VyZSB0aGUgbWVudSBpc24ndCBwaW5uZWQuXHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5oYXNDbGFzcygncGlubmVkJykpIHtcclxuXHRcdFx0XHQvLyBNZW51IHdhc24ndCBwaW5uZWQsIHJlbW92ZSBsaXN0ZW5lci5cclxuXHRcdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCBjaGVja0ZvckNsaWNrT3V0c2lkZSk7XHJcblx0XHRcdFx0dG9nZ2xlTWVudSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBUb2dnbGUgbWVudS5cclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLm9uKCdjbGljaycsIHRvZ2dsZU1lbnUpO1xyXG5cclxuXHQvLyBNYWtlIGRyYWdnYWJsZS5cclxuXHRlbGVtZW50cy5tZW51LmRyYWdnYWJsZSh7XHJcblx0XHRoYW5kbGU6ICcuZHJhZ2dhYmxlJyxcclxuXHRcdHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdtb3ZlZCcpO1xyXG5cdFx0fSxcclxuXHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5hdHRyKCdkYXRhLW9mZnNldCcsIEpTT04uc3RyaW5naWZ5KGVsZW1lbnRzLm1lbnUub2Zmc2V0KCkpKTtcclxuXHRcdH0sXHJcblx0XHRjb250YWlubWVudDogJChkb2N1bWVudC5ib2R5KVxyXG5cdH0pO1xyXG5cclxuXHRlbGVtZW50cy5tZW51LnJlc2l6YWJsZSh7XHJcblx0XHRoYW5kbGU6ICdbZGF0YS1jb21tYW5kPVwicmVzaXplLWhhbmRsZVwiXScsXHJcblx0XHRyZXNpemU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Ly8gUmVjYWxjdWxhdGUgYW55IHNjcm9sbCBiYXJzLlxyXG5cdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJykuY3VzdG9tU2Nyb2xsYmFyKCdyZXNpemUnKTtcclxuXHRcdH0sXHJcblx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdtb3ZlZCcpO1xyXG5cdFx0fSxcclxuXHRcdGFsc29SZXNpemU6IGVsZW1lbnRzLm1lbnUuZmluZCgnLnNjcm9sbGFibGUnKSxcclxuXHRcdGNvbnRhaW5tZW50OiAkKGRvY3VtZW50LmJvZHkpLFxyXG5cdFx0bWluSGVpZ2h0OiAxODAsXHJcblx0XHRtaW5XaWR0aDogMjAwXHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSB0aGUgcG9wdWxhcml0eSByZXNldC5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJyZXNldC1wb3B1bGFyaXR5XCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0c3RvcmFnZS5wb3B1bGFyaXR5LnJlbW92ZUFsbCgpO1xyXG5cdFx0cG9wdWxhdGVFbW90ZXNNZW51KCk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBtZW51IHBpbm5pbmcuXHJcblx0ZWxlbWVudHMubWVudS5maW5kKCdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLXBpbm5lZFwiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGVsZW1lbnRzLm1lbnUudG9nZ2xlQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgbWVudSBlZGl0aW5nLlxyXG5cdGVsZW1lbnRzLm1lbnUuZmluZCgnW2RhdGEtY29tbWFuZD1cInRvZ2dsZS1lZGl0aW5nXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0ZWxlbWVudHMubWVudS50b2dnbGVDbGFzcygnZWRpdGluZycpO1xyXG5cdFx0Ly8gUmVjYWxjdWxhdGUgYW55IHNjcm9sbCBiYXJzLlxyXG5cdFx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcigncmVzaXplJyk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBlbW90ZSBjbGlja2luZyAoZGVsZWdhdGVkKS5cclxuXHRlbGVtZW50cy5tZW51Lm9uKCdjbGljaycsICcuZW1vdGUnLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoZWxlbWVudHMubWVudS5pcygnLmVkaXRpbmcnKSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpbnNlcnRFbW90ZVRleHQoJCh0aGlzKS5hdHRyKCdkYXRhLWVtb3RlJykpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgZW1vdGUgaGlkaW5nIChkZWxlZ2F0ZWQpLlxyXG5cdGVsZW1lbnRzLm1lbnUub24oJ2NsaWNrJywgJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtdmlzaWJpbGl0eVwiXScsIGZ1bmN0aW9uICgpIHtcclxuXHRcdC8vIE1ha2Ugc3VyZSB3ZSBhcmUgaW4gZWRpdCBtb2RlLlxyXG5cdFx0aWYgKCFlbGVtZW50cy5tZW51LmlzKCcuZWRpdGluZycpKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdHZhciB3aGljaCA9ICQodGhpcykuYXR0cignZGF0YS13aGljaCcpO1xyXG5cdFx0dmFyIGlzVmlzaWJsZSA9IHN0b3JhZ2UudmlzaWJpbGl0eS5nZXQod2hpY2gsIHRydWUpO1xyXG5cdFx0Ly8gVG9nZ2xlIHZpc2liaWxpdHkuXHJcblx0XHRzdG9yYWdlLnZpc2liaWxpdHkuc2V0KHdoaWNoLCAhaXNWaXNpYmxlKTtcclxuXHRcdHBvcHVsYXRlRW1vdGVzTWVudSgpO1xyXG5cdH0pO1xyXG5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJykuY3VzdG9tU2Nyb2xsYmFyKHtcclxuXHRcdHNraW46ICdkZWZhdWx0LXNraW4nLFxyXG5cdFx0aFNjcm9sbDogZmFsc2UsXHJcblx0XHRwcmV2ZW50RGVmYXVsdFNjcm9sbDogdHJ1ZVxyXG5cdH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUG9wdWxhdGVzIHRoZSBwb3B1cCBtZW51IHdpdGggY3VycmVudCBlbW90ZSBkYXRhLlxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdWxhdGVFbW90ZXNNZW51KCkge1xyXG5cdHZhciBjb250YWluZXI7XHJcblxyXG5cdHJlZnJlc2hVc2FibGVFbW90ZXMoKTtcclxuXHJcblx0Ly8gQWRkIHBvcHVsYXIgZW1vdGVzLlxyXG5cdGNvbnRhaW5lciA9IGVsZW1lbnRzLm1lbnUuZmluZCgnI3BvcHVsYXItZW1vdGVzLWdyb3VwJyk7XHJcblx0Y29udGFpbmVyLmh0bWwoJycpO1xyXG5cdGVtb3Rlcy51c2FibGUuc29ydChzb3J0QnlQb3B1bGFyaXR5KTtcclxuXHRlbW90ZXMudXNhYmxlLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gQWRkIGFsbCBlbW90ZXMuXHJcblx0Y29udGFpbmVyID0gZWxlbWVudHMubWVudS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpO1xyXG5cdGlmIChjb250YWluZXIuZmluZCgnLm92ZXJ2aWV3JykubGVuZ3RoKSB7XHJcblx0XHRjb250YWluZXIgPSBjb250YWluZXIuZmluZCgnLm92ZXJ2aWV3Jyk7XHJcblx0fVxyXG5cdGNvbnRhaW5lci5odG1sKCcnKTtcclxuXHRlbW90ZXMudXNhYmxlLnNvcnQoc29ydEJ5U2V0KTtcclxuXHRlbW90ZXMudXNhYmxlLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyLCB0cnVlKTtcclxuXHR9KTtcclxuXHJcblx0LyoqXHJcblx0ICogU29ydCBieSBwb3B1bGFyaXR5OiBtb3N0IHVzZWQgLT4gbGVhc3QgdXNlZFxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHNvcnRCeVBvcHVsYXJpdHkoYSwgYikge1xyXG5cdFx0dmFyIGFHZXQgPSBOdW1iZXIoc3RvcmFnZS5wb3B1bGFyaXR5LmdldChhLnRleHQsIDApKTtcclxuXHRcdHZhciBiR2V0ID0gTnVtYmVyKHN0b3JhZ2UucG9wdWxhcml0eS5nZXQoYi50ZXh0LCAwKSk7XHJcblx0XHRpZiAoYUdldCA8IGJHZXQpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAoYUdldCA+IGJHZXQpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHNvcnRCeU5vcm1hbChhLCBiKTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgYWxwaGFudW1lcmljIGluIHRoaXMgb3JkZXI6IHN5bWJvbHMgLT4gbnVtYmVycyAtPiBBYUJiLi4uIC0+IG51bWJlcnNcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBzb3J0QnlOb3JtYWwoYSwgYil7XHJcblx0XHRhID0gYS50ZXh0O1xyXG5cdFx0YiA9IGIudGV4dDtcclxuXHRcdGlmIChhLnRvTG93ZXJDYXNlKCkgPCBiLnRvTG93ZXJDYXNlKCkpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGEudG9Mb3dlckNhc2UoKSA+IGIudG9Mb3dlckNhc2UoKSkge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdGlmIChhIDwgYikge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYSA+IGIpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgZW1vdGljb24gc2V0OiBiYXNpYyBzbWlsZXlzIC0+IG5vIHNldCAtPiBzdWJzY3JpcHRpb24gZW1vdGVzXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gc29ydEJ5U2V0KGEsIGIpe1xyXG5cdFx0Ly8gT3ZlcnJpZGUgZm9yIGJhc2ljIGVtb3Rlcy5cclxuXHRcdGlmIChiYXNpY0Vtb3Rlcy5pbmRleE9mKGEudGV4dCkgPj0gMCAmJlx0YmFzaWNFbW90ZXMuaW5kZXhPZihiLnRleHQpIDwgMCkge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYmFzaWNFbW90ZXMuaW5kZXhPZihiLnRleHQpID49IDAgJiZcdGJhc2ljRW1vdGVzLmluZGV4T2YoYS50ZXh0KSA8IDApIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHQvLyBTb3J0IGJ5IGNoYW5uZWwgbmFtZS5cclxuXHRcdGlmIChhLmNoYW5uZWwgJiYgIWIuY2hhbm5lbCkge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdGlmIChiLmNoYW5uZWwgJiYgIWEuY2hhbm5lbCkge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYS5jaGFubmVsICYmIGIuY2hhbm5lbCkge1xyXG5cdFx0XHQvLyBGb3JjZSBhZGRvbiBlbW90ZSBncm91cHMgYmVsb3cgc3RhbmRhcmQgVHdpdGNoIGdyb3Vwcy5cclxuXHRcdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1thLmNoYW5uZWxdICYmICFlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbYi5jaGFubmVsXSkge1xyXG5cdFx0XHRcdHJldHVybiAtMTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZW1vdGVzLnN1YnNjcmlwdGlvbnMuYmFkZ2VzW2IuY2hhbm5lbF0gJiYgIWVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1thLmNoYW5uZWxdKSB7XHJcblx0XHRcdFx0cmV0dXJuIDE7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBjaGFubmVsU29ydCA9IHNvcnRCeU5vcm1hbCh7dGV4dDogYS5jaGFubmVsfSwge3RleHQ6IGIuY2hhbm5lbH0pO1xyXG5cdFx0XHR2YXIgbm9ybWFsU29ydCA9IHNvcnRCeU5vcm1hbChhLCBiKTtcclxuXHRcdFx0aWYgKGNoYW5uZWxTb3J0ID09PSAwKSB7XHJcblx0XHRcdFx0cmV0dXJuIG5vcm1hbFNvcnQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGNoYW5uZWxTb3J0O1xyXG5cdFx0fVxyXG5cdFx0Ly8gR2V0IGl0IGJhY2sgdG8gYSBzdGFibGUgc29ydC5cclxuXHRcdHJldHVybiBzb3J0QnlOb3JtYWwoYSwgYik7XHJcblx0fVxyXG59XHJcblxyXG4vKipcclxuICogUmVmcmVzaGVzIHRoZSB1c2FibGUgZW1vdGVzLiBBbiBlbW90ZSBpcyBkZWVtZWQgdXNhYmxlIGlmIGl0IGVpdGhlciBoYXMgbm8gc2V0IG9yIHRoZSBzZXQgaXMgaW4geW91ciB1c2VyIGluZm8uIEZvciB0dXJibyBzZXRzLCBpdCB3aWxsIHVzZSB0aGUgdHVyYm8gaWYgaW4geW91ciB1c2VyIGluZm8sIG90aGVyd2lzZSBmYWxsIGJhY2sgdG8gZGVmYXVsdC5cclxuICovXHJcbmZ1bmN0aW9uIHJlZnJlc2hVc2FibGVFbW90ZXMoKSB7XHJcblx0dmFyIHR1cmJvU2V0cyA9IFs0NTcsIDc5M107XHJcblx0c3RvcmFnZS5nbG9iYWwuc2V0KCdlbW90ZVNldHMnLCBoZWxwZXJzLnVzZXIuZ2V0RW1vdGVTZXRzKCkpO1xyXG5cdGVtb3Rlcy51c2FibGUgPSBbXTtcclxuXHRlbW90ZXMucmF3LmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHQvLyBBbGxvdyBoaWRpbmcgb2YgZW1vdGVzIGZyb20gdGhlIG1lbnUuXHJcblx0XHRpZiAoZW1vdGUuaGlkZGVuKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGlmICghZW1vdGUudGV4dCkge1xyXG5cdFx0XHRlbW90ZS50ZXh0ID0gZ2V0RW1vdGVGcm9tUmVnRXgoZW1vdGUucmVnZXgpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSkge1xyXG5cdFx0XHRlbW90ZS5jaGFubmVsID0gZW1vdGVzLnN1YnNjcmlwdGlvbnMuZW1vdGVzW2Vtb3RlLnRleHRdLmNoYW5uZWw7XHJcblx0XHR9XHJcblx0XHR2YXIgZGVmYXVsdEltYWdlO1xyXG5cdFx0ZW1vdGUuaW1hZ2VzLnNvbWUoZnVuY3Rpb24gKGltYWdlKSB7XHJcblx0XHRcdGlmIChpbWFnZS5lbW90aWNvbl9zZXQgPT09IG51bGwpIHtcclxuXHRcdFx0XHRkZWZhdWx0SW1hZ2UgPSBpbWFnZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoXHJcblx0XHRcdFx0Ly8gSW1hZ2UgaXMgdGhlIHNhbWUgVVJMIGFzIHRoZSBzdWJzY3JpcHRpb24gZW1vdGUuXHJcblx0XHRcdFx0KGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSAmJiBpbWFnZS51cmwgPT09IGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XS51cmwpIHx8XHJcblx0XHRcdFx0KHN0b3JhZ2UuZ2xvYmFsLmdldCgnZW1vdGVTZXRzJywgW10pLmluZGV4T2YoaW1hZ2UuZW1vdGljb25fc2V0KSA+PSAwKSB8fFxyXG5cdFx0XHRcdC8vIEVtb3RlIGlzIGZvcmNlZCB0byBzaG93LlxyXG5cdFx0XHRcdGVtb3RlLmhpZGRlbiA9PT0gZmFsc2VcclxuXHRcdFx0KSB7XHJcblx0XHRcdFx0aWYgKHR1cmJvU2V0cy5pbmRleE9mKGltYWdlLmVtb3RpY29uX3NldCkgPj0gMCkge1xyXG5cdFx0XHRcdFx0ZW1vdGUuY2hhbm5lbCA9ICd0dXJibyc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVtb3RlLmltYWdlID0gaW1hZ2U7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdFx0ZW1vdGUuaW1hZ2UgPSBlbW90ZS5pbWFnZSB8fCBkZWZhdWx0SW1hZ2U7XHJcblxyXG5cdFx0Ly8gT25seSBhZGQgdGhlIGVtb3RlIGlmIHRoZXJlIGlzIGEgVVJMLlxyXG5cdFx0aWYgKGVtb3RlLmltYWdlICYmIGVtb3RlLmltYWdlLnVybCAhPT0gbnVsbCkge1xyXG5cdFx0XHQvLyBEZXRlcm1pbmUgaWYgZW1vdGUgaXMgZnJvbSBhIHRoaXJkLXBhcnR5IGFkZG9uLlxyXG5cdFx0XHRlbW90ZS5pc1RoaXJkUGFydHkgPSB1cmwucGFyc2UoZW1vdGUuaW1hZ2UudXJsKS5ob3N0bmFtZSAhPT0gJ3N0YXRpYy1jZG4uanR2bncubmV0JztcclxuXHRcdFx0Ly8gRGV0ZXJtaW5lIGlmIGVtb3RlIGlzIGhpZGRlbiBieSB1c2VyLlxyXG5cdFx0XHRlbW90ZS5pc1Zpc2libGUgPSBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KCdjaGFubmVsLScgKyBlbW90ZS5jaGFubmVsLCB0cnVlKSAmJiBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KGVtb3RlLnRleHQsIHRydWUpO1xyXG5cdFx0XHRcclxuXHRcdFx0ZW1vdGVzLnVzYWJsZS5wdXNoKGVtb3RlKTtcclxuXHRcdH1cclxuXHR9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEluc2VydHMgYW4gZW1vdGUgaW50byB0aGUgY2hhdCBib3guXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSAoZS5nLiBcIkthcHBhXCIpLlxyXG4gKi9cclxuZnVuY3Rpb24gaW5zZXJ0RW1vdGVUZXh0KHRleHQpIHtcclxuXHRzdG9yYWdlLnBvcHVsYXJpdHkuc2V0KHRleHQsIE51bWJlcihzdG9yYWdlLnBvcHVsYXJpdHkuZ2V0KHRleHQsIDApKSArIDEpO1xyXG5cdC8vIEdldCBpbnB1dC5cclxuXHR2YXIgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjaGF0X3RleHRfaW5wdXQsIC5jaGF0LWludGVyZmFjZSB0ZXh0YXJlYScpO1xyXG5cclxuXHQvLyBJbnNlcnQgYXQgY3Vyc29yIC8gcmVwbGFjZSBzZWxlY3Rpb24uXHJcblx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Db2RlX3NuaXBwZXRzL01pc2NlbGxhbmVvdXNcclxuXHR2YXIgc2VsZWN0aW9uRW5kID0gZWxlbWVudC5zZWxlY3Rpb25TdGFydCArIHRleHQubGVuZ3RoO1xyXG5cdHZhciBjdXJyZW50VmFsdWUgPSBlbGVtZW50LnZhbHVlO1xyXG5cdHZhciBiZWZvcmVUZXh0ID0gY3VycmVudFZhbHVlLnN1YnN0cmluZygwLCBlbGVtZW50LnNlbGVjdGlvblN0YXJ0KTtcclxuXHR2YXIgYWZ0ZXJUZXh0ID0gY3VycmVudFZhbHVlLnN1YnN0cmluZyhlbGVtZW50LnNlbGVjdGlvbkVuZCwgY3VycmVudFZhbHVlLmxlbmd0aCk7XHJcblx0Ly8gU21hcnQgcGFkZGluZywgb25seSBwdXQgc3BhY2UgYXQgc3RhcnQgaWYgbmVlZGVkLlxyXG5cdGlmIChcclxuXHRcdGJlZm9yZVRleHQgIT09ICcnICYmXHJcblx0XHRiZWZvcmVUZXh0LnN1YnN0cigtMSkgIT09ICcgJ1xyXG5cdCkge1xyXG5cdFx0dGV4dCA9ICcgJyArIHRleHQ7XHJcblx0fVxyXG5cdC8vIEFsd2F5cyBwdXQgc3BhY2UgYXQgZW5kLlxyXG5cdHRleHQgPSBiZWZvcmVUZXh0ICsgdGV4dCArICcgJyArIGFmdGVyVGV4dDtcclxuXHQvLyBTZXQgdGhlIHRleHQuXHJcblx0d2luZG93LkFwcC5fX2NvbnRhaW5lcl9fLmxvb2t1cCgnY29udHJvbGxlcjpjaGF0JykuZ2V0KCdjdXJyZW50Um9vbScpLnNldCgnbWVzc2FnZVRvU2VuZCcsIHRleHQpO1xyXG5cdGVsZW1lbnQuZm9jdXMoKTtcclxuXHQvLyBQdXQgY3Vyc29yIGF0IGVuZC5cclxuXHRzZWxlY3Rpb25FbmQgPSBlbGVtZW50LnNlbGVjdGlvblN0YXJ0ICsgdGV4dC5sZW5ndGg7XHJcblx0ZWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZShzZWxlY3Rpb25FbmQsIHNlbGVjdGlvbkVuZCk7XHJcblxyXG5cdC8vIENsb3NlIHBvcHVwIGlmIGl0IGhhc24ndCBiZWVuIG1vdmVkIGJ5IHRoZSB1c2VyLlxyXG5cdGlmICghZWxlbWVudHMubWVudS5oYXNDbGFzcygncGlubmVkJykpIHtcclxuXHRcdGVsZW1lbnRzLm1lbnVCdXR0b24uY2xpY2soKTtcclxuXHR9XHJcblx0Ly8gUmUtcG9wdWxhdGUgYXMgaXQgaXMgc3RpbGwgb3Blbi5cclxuXHRlbHNlIHtcclxuXHRcdHBvcHVsYXRlRW1vdGVzTWVudSgpO1xyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgdGhlIGVtb3RlIGVsZW1lbnQgYW5kIGxpc3RlbnMgZm9yIGEgY2xpY2sgZXZlbnQgdGhhdCB3aWxsIGFkZCB0aGUgZW1vdGUgdGV4dCB0byB0aGUgY2hhdC5cclxuICogQHBhcmFtIHtvYmplY3R9ICBlbW90ZSAgICAgIFRoZSBlbW90ZSB0aGF0IHlvdSB3YW50IHRvIGFkZC4gVGhpcyBvYmplY3Qgc2hvdWxkIGJlIG9uZSBjb21pbmcgZnJvbSBgZW1vdGVzYC5cclxuICogQHBhcmFtIHtlbGVtZW50fSBjb250YWluZXIgIFRoZSBIVE1MIGVsZW1lbnQgdGhhdCB0aGUgZW1vdGUgc2hvdWxkIGJlIGFwcGVuZGVkIHRvLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHNob3dIZWFkZXIgV2hldGhlciBhIGhlYWRlciBzaG91bGRiZSBjcmVhdGVkIGlmIGZvdW5kLiBPbmx5IGNyZWF0ZXMgdGhlIGhlYWRlciBvbmNlLlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlRW1vdGUoZW1vdGUsIGNvbnRhaW5lciwgc2hvd0hlYWRlcikge1xyXG5cdC8vIEVtb3RlIG5vdCB1c2FibGUgb3Igbm8gY29udGFpbmVyLCBjYW4ndCBhZGQuXHJcblx0aWYgKCFlbW90ZSB8fCAhZW1vdGUuaW1hZ2UgfHwgIWNvbnRhaW5lci5sZW5ndGgpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0aWYgKHNob3dIZWFkZXIpIHtcclxuXHRcdGlmIChlbW90ZS5jaGFubmVsICYmIGJhc2ljRW1vdGVzLmluZGV4T2YoZW1vdGUudGV4dCkgPCAwKSB7XHJcblx0XHRcdHZhciBiYWRnZSA9IGVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1tlbW90ZS5jaGFubmVsXSB8fCBlbW90ZS5iYWRnZTtcclxuXHRcdFx0aWYgKCFlbGVtZW50cy5tZW51LmZpbmQoJy5ncm91cC1oZWFkZXJbZGF0YS1lbW90ZS1jaGFubmVsPVwiJyArIGVtb3RlLmNoYW5uZWwgKyAnXCJdJykubGVuZ3RoKSB7XHJcblx0XHRcdFx0Y29udGFpbmVyLmFwcGVuZChcclxuXHRcdFx0XHRcdCQodGVtcGxhdGVzLmVtb3RlR3JvdXBIZWFkZXIoe1xyXG5cdFx0XHRcdFx0XHRiYWRnZTogYmFkZ2UsXHJcblx0XHRcdFx0XHRcdGNoYW5uZWw6IGVtb3RlLmNoYW5uZWwsXHJcblx0XHRcdFx0XHRcdGlzVmlzaWJsZTogc3RvcmFnZS52aXNpYmlsaXR5LmdldCgnY2hhbm5lbC0nICsgZW1vdGUuY2hhbm5lbCwgdHJ1ZSlcclxuXHRcdFx0XHRcdH0pKVxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBjaGFubmVsQ29udGFpbmVyID0gY29udGFpbmVyLmZpbmQoJy5ncm91cC1oZWFkZXJbZGF0YS1lbW90ZS1jaGFubmVsPVwiJyArIGVtb3RlLmNoYW5uZWwgKyAnXCJdJyk7XHJcblx0aWYgKGNoYW5uZWxDb250YWluZXIubGVuZ3RoKSB7XHJcblx0XHRjb250YWluZXIgPSBjaGFubmVsQ29udGFpbmVyO1xyXG5cdH1cclxuXHRjb250YWluZXIuYXBwZW5kKFxyXG5cdFx0JCh0ZW1wbGF0ZXMuZW1vdGUoe1xyXG5cdFx0XHRpbWFnZTogZW1vdGUuaW1hZ2UsXHJcblx0XHRcdHRleHQ6IGVtb3RlLnRleHQsXHJcblx0XHRcdHRoaXJkUGFydHk6IGVtb3RlLmlzVGhpcmRQYXJ0eSxcclxuXHRcdFx0aXNWaXNpYmxlOiBlbW90ZS5pc1Zpc2libGVcclxuXHRcdH0pKVxyXG5cdCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSB1c2FibGUgZW1vdGUgdGV4dCBmcm9tIGEgcmVnZXguXHJcbiAqIEBhdHRyaWJ1dGUgaHR0cDovL3VzZXJzY3JpcHRzLm9yZy9zY3JpcHRzL3Nob3cvMTYwMTgzIChhZGFwdGlvbilcclxuICovXHJcbmZ1bmN0aW9uIGdldEVtb3RlRnJvbVJlZ0V4KHJlZ2V4KSB7XHJcblx0aWYgKHR5cGVvZiByZWdleCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleCk7XHJcblx0fVxyXG5cdHJldHVybiBkZWNvZGVVUkkocmVnZXguc291cmNlKVxyXG5cdFx0LnJlcGxhY2UoJyZndFxcXFw7JywgJz4nKSAvLyByaWdodCBhbmdsZSBicmFja2V0XHJcblx0XHQucmVwbGFjZSgnJmx0XFxcXDsnLCAnPCcpIC8vIGxlZnQgYW5nbGUgYnJhY2tldFxyXG5cdFx0LnJlcGxhY2UoL1xcKFxcPyFbXildKlxcKS9nLCAnJykgLy8gcmVtb3ZlIG5lZ2F0aXZlIGdyb3VwXHJcblx0XHQucmVwbGFjZSgvXFwoKFtefF0pKlxcfD9bXildKlxcKS9nLCAnJDEnKSAvLyBwaWNrIGZpcnN0IG9wdGlvbiBmcm9tIGEgZ3JvdXBcclxuXHRcdC5yZXBsYWNlKC9cXFsoW158XSkqXFx8P1teXFxdXSpcXF0vZywgJyQxJykgLy8gcGljayBmaXJzdCBjaGFyYWN0ZXIgZnJvbSBhIGNoYXJhY3RlciBncm91cFxyXG5cdFx0LnJlcGxhY2UoL1teXFxcXF1cXD8vZywgJycpIC8vIHJlbW92ZSBvcHRpb25hbCBjaGFyc1xyXG5cdFx0LnJlcGxhY2UoL15cXFxcYnxcXFxcYiQvZywgJycpIC8vIHJlbW92ZSBib3VuZGFyaWVzXHJcblx0XHQucmVwbGFjZSgvXFxcXC9nLCAnJyk7IC8vIHVuZXNjYXBlXHJcbn1cclxuIiwiKGZ1bmN0aW9uIChkb2MsIGNzc1RleHQpIHtcbiAgICB2YXIgc3R5bGVFbCA9IGRvYy5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChzdHlsZUVsKTtcbiAgICBpZiAoc3R5bGVFbC5zdHlsZVNoZWV0KSB7XG4gICAgICAgIGlmICghc3R5bGVFbC5zdHlsZVNoZWV0LmRpc2FibGVkKSB7XG4gICAgICAgICAgICBzdHlsZUVsLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzc1RleHQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3R5bGVFbC5pbm5lckhUTUwgPSBjc3NUZXh0O1xuICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHtcbiAgICAgICAgICAgIHN0eWxlRWwuaW5uZXJUZXh0ID0gY3NzVGV4dDtcbiAgICAgICAgfVxuICAgIH1cbn0oZG9jdW1lbnQsIFwiLyoqXFxuXCIgK1xuXCIgKiBNaW5pZmllZCBzdHlsZS5cXG5cIiArXG5cIiAqIE9yaWdpbmFsIGZpbGVuYW1lOiBcXFxcbm9kZV9tb2R1bGVzXFxcXGpxdWVyeS1jdXN0b20tc2Nyb2xsYmFyXFxcXGpxdWVyeS5jdXN0b20tc2Nyb2xsYmFyLmNzc1xcblwiICtcblwiICovXFxuXCIgK1xuXCIuc2Nyb2xsYWJsZXtwb3NpdGlvbjpyZWxhdGl2ZX0uc2Nyb2xsYWJsZTpmb2N1c3tvdXRsaW5lOjB9LnNjcm9sbGFibGUgLnZpZXdwb3J0e3Bvc2l0aW9uOnJlbGF0aXZlO292ZXJmbG93OmhpZGRlbn0uc2Nyb2xsYWJsZSAudmlld3BvcnQgLm92ZXJ2aWV3e3Bvc2l0aW9uOmFic29sdXRlfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFye2Rpc3BsYXk6bm9uZX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci52ZXJ0aWNhbHtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO2hlaWdodDoxMDAlfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyLmhvcml6b250YWx7cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MTAwJX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhciAudGh1bWJ7cG9zaXRpb246YWJzb2x1dGV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIudmVydGljYWwgLnRodW1ie3dpZHRoOjEwMCU7bWluLWhlaWdodDoxMHB4fS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyLmhvcml6b250YWwgLnRodW1ie2hlaWdodDoxMDAlO21pbi13aWR0aDoxMHB4O2xlZnQ6MH0ubm90LXNlbGVjdGFibGV7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1raHRtbC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lfS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbntwYWRkaW5nLXJpZ2h0OjEwcHg7cGFkZGluZy1ib3R0b206NnB4fS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhci52ZXJ0aWNhbHt3aWR0aDo2cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyLmhvcml6b250YWx7aGVpZ2h0OjZweH0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6IzAwMDtvcGFjaXR5Oi40O2JvcmRlci1yYWRpdXM6M3B4Oy1tb3otYm9yZGVyLXJhZGl1czo0cHg7LXdlYmtpdC1ib3JkZXItcmFkaXVzOjRweH0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXI6aG92ZXIgLnRodW1ie29wYWNpdHk6LjZ9LnNjcm9sbGFibGUuZ3JheS1za2lue3BhZGRpbmctcmlnaHQ6MTdweH0uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXJ7Ym9yZGVyOjFweCBzb2xpZCBncmF5O2JhY2tncm91bmQtY29sb3I6I2QzZDNkM30uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6Z3JheX0uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXI6aG92ZXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6IzAwMH0uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXIudmVydGljYWx7d2lkdGg6MTBweH0uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXIuaG9yaXpvbnRhbHtoZWlnaHQ6MTBweDttYXJnaW4tdG9wOjJweH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbntwYWRkaW5nLXJpZ2h0OjE3cHh9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXJ7Ym9yZGVyOjFweCBzb2xpZCBncmF5O2JvcmRlci1yYWRpdXM6NHB4Oy1tb3otYm9yZGVyLXJhZGl1czo0cHg7LXdlYmtpdC1ib3JkZXItcmFkaXVzOjRweDtib3gtc2hhZG93Omluc2V0IDAgMCA1cHggIzg4OH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojOTVhYWJmO2JvcmRlci1yYWRpdXM6NHB4Oy1tb3otYm9yZGVyLXJhZGl1czo0cHg7LXdlYmtpdC1ib3JkZXItcmFkaXVzOjRweDtib3JkZXI6MXB4IHNvbGlkICM1MzY5ODR9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIudmVydGljYWwgLnRodW1ie3dpZHRoOjhweDtiYWNrZ3JvdW5kOi13ZWJraXQtZ3JhZGllbnQobGluZWFyLGxlZnQgdG9wLHJpZ2h0IHRvcCxjb2xvci1zdG9wKDAlLCM5NWFhYmYpLGNvbG9yLXN0b3AoMTAwJSwjNTQ3MDkyKSk7YmFja2dyb3VuZDotd2Via2l0LWxpbmVhci1ncmFkaWVudChsZWZ0LCM5NWFhYmYgMCwjNTQ3MDkyIDEwMCUpO2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCM5NWFhYmYgMCwjNTQ3MDkyIDEwMCUpOy1tcy1maWx0ZXI6XFxcInByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5ncmFkaWVudCggc3RhcnRDb2xvcnN0cj0nIzk1YWFiZicsIGVuZENvbG9yc3RyPScjNTQ3MDkyJyxHcmFkaWVudFR5cGU9MSApXFxcIn0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFsIC50aHVtYntoZWlnaHQ6OHB4O2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KCM5NWFhYmYsIzU0NzA5Mik7YmFja2dyb3VuZC1pbWFnZTotd2Via2l0LWxpbmVhci1ncmFkaWVudCgjOTVhYWJmLCM1NDcwOTIpOy1tcy1maWx0ZXI6XFxcInByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5ncmFkaWVudCggc3RhcnRDb2xvcnN0cj0nIzk1YWFiZicsIGVuZENvbG9yc3RyPScjNTQ3MDkyJyxHcmFkaWVudFR5cGU9MCApXFxcIn0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhci52ZXJ0aWNhbHt3aWR0aDoxMHB4fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyLmhvcml6b250YWx7aGVpZ2h0OjEwcHg7bWFyZ2luLXRvcDoycHh9XFxuXCIgK1xuXCIvKipcXG5cIiArXG5cIiAqIE1pbmlmaWVkIHN0eWxlLlxcblwiICtcblwiICogT3JpZ2luYWwgZmlsZW5hbWU6IFxcXFxzcmNcXFxcc3R5bGVzXFxcXHN0eWxlLmNzc1xcblwiICtcblwiICovXFxuXCIgK1xuXCJALXdlYmtpdC1rZXlmcmFtZXMgc3BpbnsxMDAley13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpO3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKX19QGtleWZyYW1lcyBzcGluezEwMCV7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpfX0jZW1vdGUtbWVudS1idXR0b257YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCSUFBQUFRQ0FZQUFBQWJCaTljQUFBQUFYTlNSMElBcnM0YzZRQUFBQVJuUVUxQkFBQ3hqd3Y4WVFVQUFBQUpjRWhaY3dBQURzTUFBQTdEQWNkdnFHUUFBQUtVU1VSQlZEaFBmWlROaTFKUkdNWnZNSXNXVVp0czVTSVhGWUswQ01FL0lHZ2h4VkM3V1VvVTFOQml4SSttUlNENE1Rem14emlLTzNYVUJoUm1VR1pLZEJHNDBYRUdVNmQwR0ZHWmNUNHF4VzFoaTdmenZOd1pxS3dERDV6N3ZzL3Z1ZWVlZSs2Vk1KeE81d1VoaGR2dGZ1SHorVDR0TFMyTmhlZ2ZHc01ETHhpd0hJSWhMaTU3UEo3NVZDcjFZMzkvbjRiRElZMUdvNGxDRHg1NHdZQ1ZZempvVmpRYS9keHV0eWZDa3dTdllKcGdPU1FmNzA4dHVCYTF5V1J5L0wrVi9DbDR3WUJGaGhUeGZMaHVtL2VzaWlKMXUxMktSQ0prc1Zob2ZYMmRUazVPemtITVVVTVBIbmpCMkY1NVZwRWhQZGUvTGJ4OEZxQkVJa0hwZEpvTUJnTnB0VnJTNlhSVXFWVE9nN2EzdDJsbVpvYjBlajJwMVdyMmdnR0xET25KM1FTWkg0Y29Iby9UeXNvS2h5Z1VDdEpvTkZRc0Zta3dHTEF3UjdoU3FTU1ZTc1ZlTUdDUklUMjlGNmZYSmk4WHkrVXltYzFtbXA2ZUpvZkRRZlY2blU1UFQxbVkyKzEyN3VIeFNxVVNoNEZGaGhRTHZydnRjcm0rWXBrSEJ3ZFVyVlpwYTJ1TGFyVWFkVG9kT2p3OFpHR09HbnJ3d0FzR0xETHcxaTR1THJ6UlllT09qNDlwYjIrUGRuZDNxZFZxOFN0R0FJUTVhbzFHZ3ozd2dnR0xERDRDNGl6Y0VjV2ZSMGRIYk1ybGNyU3hzY0dialZBSUs4bG1zN1M1dWNtQi9YNmZYejlZRHNFUUZ6ZGpzVml0Mld6eXFjMWtNcndmVnF1VmpFWWp6YzNOa2Nsa0lwdk5SbXRyYSt5QlZ6QWZCWHREanVHZ1M4RmdjRmJjOFF2dWhqTlNLQlFvRkFxUjZMRkVuL0w1UFBmZ2dYZDVlWGtXckJ6RFFkQzFRQ0JnRm9ldXQ3T3p3L3R5QnAyRlF6aFB3dE9GRnd6WTM0WW80QTl3Ulh6ZEQ4TGhjRTQ4d25jRTlubzlGdWFvaWQ1NzRia1BMeGdaLzN1STVwVFFWZkZsUC9MNy9XbWhiN0pTWHEvM0lYcnd5SFo1U05JdkdDbnF5aCtKNytnQUFBQUFTVVZPUks1Q1lJST0pIWltcG9ydGFudDtiYWNrZ3JvdW5kLXBvc2l0aW9uOjUwJTtiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7Y3Vyc29yOnBvaW50ZXI7bWFyZ2luLWxlZnQ6N3B4fSNlbW90ZS1tZW51LWJ1dHRvbi5hY3RpdmV7Ym9yZGVyLXJhZGl1czoycHg7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEyOCwxMjgsMTI4LC41KX0uZW1vdGUtbWVudXtwYWRkaW5nOjVweDt6LWluZGV4OjEwMDA7ZGlzcGxheTpub25lO2JhY2tncm91bmQtY29sb3I6IzIwMjAyMH0uZW1vdGUtbWVudSBhe2NvbG9yOiNmZmZ9LmVtb3RlLW1lbnUgYTpob3ZlcntjdXJzb3I6cG9pbnRlcjt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO2NvbG9yOiNjY2N9LmVtb3RlLW1lbnUgLmVtb3Rlcy1wb3B1bGFye2hlaWdodDozOHB4fS5lbW90ZS1tZW51IC5kcmFnZ2FibGV7YmFja2dyb3VuZC1pbWFnZTotd2Via2l0LXJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDEwcHgpO2JhY2tncm91bmQtaW1hZ2U6cmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgMTBweCk7Y3Vyc29yOm1vdmU7aGVpZ2h0OjdweDttYXJnaW4tYm90dG9tOjNweH0uZW1vdGUtbWVudSAuZHJhZ2dhYmxlOmhvdmVye2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1yZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgMTBweCk7YmFja2dyb3VuZC1pbWFnZTpyZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgMTBweCl9LmVtb3RlLW1lbnUgLmhlYWRlci1pbmZve2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDA7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA1KSBpbnNldDtiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtbGluZWFyLWdyYWRpZW50KGJvdHRvbSx0cmFuc3BhcmVudCxyZ2JhKDAsMCwwLC41KSk7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQodG8gdG9wLHRyYW5zcGFyZW50LHJnYmEoMCwwLDAsLjUpKTtwYWRkaW5nOjJweDtjb2xvcjojZGRkO3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOnJlbGF0aXZlfS5lbW90ZS1tZW51IC5oZWFkZXItaW5mbyBpbWd7bWFyZ2luLXJpZ2h0OjhweH0uZW1vdGUtbWVudSAuZW1vdGV7ZGlzcGxheTppbmxpbmUtYmxvY2s7cGFkZGluZzoycHg7bWFyZ2luOjFweDtjdXJzb3I6cG9pbnRlcjtib3JkZXItcmFkaXVzOjVweDt0ZXh0LWFsaWduOmNlbnRlcjtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDozMnB4O2hlaWdodDozMnB4Oy13ZWJraXQtdHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZX0uZW1vdGUtbWVudS5lZGl0aW5nIC5lbW90ZXtjdXJzb3I6YXV0b30uZW1vdGUtbWVudSAuZW1vdGUgZGl2e21heC13aWR0aDozMnB4O21heC1oZWlnaHQ6MzJweDtiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7YmFja2dyb3VuZC1zaXplOmNvbnRhaW47bWFyZ2luOmF1dG87cG9zaXRpb246YWJzb2x1dGU7dG9wOjA7Ym90dG9tOjA7bGVmdDowO3JpZ2h0OjB9LmVtb3RlLW1lbnUgLnNpbmdsZS1yb3d7b3ZlcmZsb3c6aGlkZGVuO2hlaWdodDozN3B4fS5lbW90ZS1tZW51IC5zaW5nbGUtcm93IC5lbW90ZXtkaXNwbGF5OmlubGluZS1ibG9jazttYXJnaW4tYm90dG9tOjEwMHB4fS5lbW90ZS1tZW51IC5lbW90ZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsLjEpfS5lbW90ZS1tZW51IC5wdWxsLWxlZnR7ZmxvYXQ6bGVmdH0uZW1vdGUtbWVudSAucHVsbC1yaWdodHtmbG9hdDpyaWdodH0uZW1vdGUtbWVudSAuZm9vdGVye3RleHQtYWxpZ246Y2VudGVyO2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDA7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA1KSBpbnNldDtwYWRkaW5nOjVweCAwIDJweDttYXJnaW4tdG9wOjVweH0uZW1vdGUtbWVudSAuZm9vdGVyIC5wdWxsLWxlZnR7bWFyZ2luLXJpZ2h0OjVweH0uZW1vdGUtbWVudSAuZm9vdGVyIC5wdWxsLXJpZ2h0e21hcmdpbi1sZWZ0OjVweH0uZW1vdGUtbWVudSAuaWNvbntoZWlnaHQ6MTZweDt3aWR0aDoxNnB4O29wYWNpdHk6LjU7YmFja2dyb3VuZC1zaXplOmNvbnRhaW4haW1wb3J0YW50fS5lbW90ZS1tZW51IC5pY29uOmhvdmVye29wYWNpdHk6MX0uZW1vdGUtbWVudSAuaWNvbi1ob21le2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTmpRaURRb2dJQ0JvWldsbmFIUTlJalkwSWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURZMElEWTBJZzBLSUNBZ2FXUTlJa05oY0dGZk1TSU5DaUFnSUhodGJEcHpjR0ZqWlQwaWNISmxjMlZ5ZG1VaVBqeHRaWFJoWkdGMFlRMEtJQ0FnYVdROUltMWxkR0ZrWVhSaE16QXdNU0krUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6STVPVGtpSUM4K0RRbzhjR0YwYUEwS0lDQWdaRDBpYlNBMU55NHdOaklzTXpFdU16azRJR01nTUM0NU16SXNMVEV1TURJMUlEQXVPRFF5TEMweUxqVTVOaUF0TUM0eU1ERXNMVE11TlRBNElFd2dNek11T0RnMExEY3VOemcxSUVNZ016SXVPRFF4TERZdU9EY3pJRE14TGpFMk9TdzJMamc1TWlBek1DNHhORGdzTnk0NE1qZ2dUQ0EzTGpBNU15d3lPQzQ1TmpJZ1l5QXRNUzR3TWpFc01DNDVNellnTFRFdU1EY3hMREl1TlRBMUlDMHdMakV4TVN3ekxqVXdNeUJzSURBdU5UYzRMREF1TmpBeUlHTWdNQzQ1TlRrc01DNDVPVGdnTWk0MU1Ea3NNUzR4TVRjZ015NDBOaXd3TGpJMk5TQnNJREV1TnpJekxDMHhMalUwTXlCMklESXlMalU1SUdNZ01Dd3hMak00TmlBeExqRXlNeXd5TGpVd09DQXlMalV3T0N3eUxqVXdPQ0JvSURndU9UZzNJR01nTVM0ek9EVXNNQ0F5TGpVd09Dd3RNUzR4TWpJZ01pNDFNRGdzTFRJdU5UQTRJRllnTXpndU5UYzFJR2dnTVRFdU5EWXpJSFlnTVRVdU9EQTBJR01nTFRBdU1ESXNNUzR6T0RVZ01DNDVOekVzTWk0MU1EY2dNaTR6TlRZc01pNDFNRGNnYUNBNUxqVXlOQ0JqSURFdU16ZzFMREFnTWk0MU1EZ3NMVEV1TVRJeUlESXVOVEE0TEMweUxqVXdPQ0JXSURNeUxqRXdOeUJqSURBc01DQXdMalEzTml3d0xqUXhOeUF4TGpBMk15d3dMamt6TXlBd0xqVTROaXd3TGpVeE5TQXhMamd4Tnl3d0xqRXdNaUF5TGpjME9Td3RNQzQ1TWpRZ2JDQXdMalkxTXl3dE1DNDNNVGdnZWlJTkNpQWdJR2xrUFNKd1lYUm9Nams1TlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptWm1abVk3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejQ9KSBuby1yZXBlYXQgNTAlfS5lbW90ZS1tZW51IC5pY29uLWdlYXJ7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtDandoTFMwZ1EzSmxZWFJsWkNCM2FYUm9JRWx1YTNOallYQmxJQ2hvZEhSd09pOHZkM2QzTG1sdWEzTmpZWEJsTG05eVp5OHBJQzB0UGdvS1BITjJad29nSUNCNGJXeHVjenBrWXowaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyVnNaVzFsYm5Sekx6RXVNUzhpQ2lBZ0lIaHRiRzV6T21OalBTSm9kSFJ3T2k4dlkzSmxZWFJwZG1WamIyMXRiMjV6TG05eVp5OXVjeU1pQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SUtJQ0FnZUcxc2JuTTZjM1puUFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnlJS0lDQWdlRzFzYm5NOUltaDBkSEE2THk5M2QzY3Vkek11YjNKbkx6SXdNREF2YzNabklnb2dJQ0IyWlhKemFXOXVQU0l4TGpFaUNpQWdJSGRwWkhSb1BTSXlNUzQxT1NJS0lDQWdhR1ZwWjJoMFBTSXlNUzR4TXpZNU9Ua2lDaUFnSUhacFpYZENiM2c5SWpBZ01DQXlNUzQxT1NBeU1TNHhNemNpQ2lBZ0lHbGtQU0pEWVhCaFh6RWlDaUFnSUhodGJEcHpjR0ZqWlQwaWNISmxjMlZ5ZG1VaVBqeHRaWFJoWkdGMFlRb2dJQ0JwWkQwaWJXVjBZV1JoZEdFek9TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc0tJQ0FnSUNBZ0lISmtaanBoWW05MWREMGlJajQ4WkdNNlptOXliV0YwUG1sdFlXZGxMM04yWnl0NGJXdzhMMlJqT21admNtMWhkRDQ4WkdNNmRIbHdaUW9nSUNBZ0lDQWdJQ0J5WkdZNmNtVnpiM1Z5WTJVOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWtZMjFwZEhsd1pTOVRkR2xzYkVsdFlXZGxJaUF2UGp4a1l6cDBhWFJzWlQ0OEwyUmpPblJwZEd4bFBqd3ZZMk02VjI5eWF6NDhMM0prWmpwU1JFWStQQzl0WlhSaFpHRjBZVDQ4WkdWbWN3b2dJQ0JwWkQwaVpHVm1jek0zSWlBdlBnbzhjR0YwYUFvZ0lDQmtQU0pOSURFNExqWXlNaXc0TGpFME5TQXhPQzR3Tnpjc05pNDROU0JqSURBc01DQXhMakkyT0N3dE1pNDROakVnTVM0eE5UWXNMVEl1T1RjeElFd2dNVGN1TlRVMExESXVNalFnUXlBeE55NDBNemdzTWk0eE1qY2dNVFF1TlRjMkxETXVORE16SURFMExqVTNOaXd6TGpRek15Qk1JREV6TGpJMU5pd3lMamtnUXlBeE15NHlOVFlzTWk0NUlERXlMakE1TERBZ01URXVPVE1zTUNCSUlEa3VOVFl4SUVNZ09TNHpPVFlzTUNBNExqTXhOeXd5TGprd05pQTRMak14Tnl3eUxqa3dOaUJNSURZdU9UazVMRE11TkRReElHTWdNQ3d3SUMweUxqa3lNaXd0TVM0eU5ESWdMVE11TURNMExDMHhMakV6TVNCTUlESXVNamc1TERNdU9UVXhJRU1nTWk0eE56TXNOQzR3TmpRZ015NDFNRGNzTmk0NE5qY2dNeTQxTURjc05pNDROamNnVENBeUxqazJNaXc0TGpFMklFTWdNaTQ1TmpJc09DNHhOaUF3TERrdU16QXhJREFzT1M0ME5UVWdkaUF5TGpNeU1pQmpJREFzTUM0eE5qSWdNaTQ1Tmprc01TNHlNVGtnTWk0NU5qa3NNUzR5TVRrZ2JDQXdMalUwTlN3eExqSTVNU0JqSURBc01DQXRNUzR5Tmpnc01pNDROVGtnTFRFdU1UVTNMREl1T1RZNUlHd2dNUzQyTnpnc01TNDJORE1nWXlBd0xqRXhOQ3d3TGpFeE1TQXlMamszTnl3dE1TNHhPVFVnTWk0NU56Y3NMVEV1TVRrMUlHd2dNUzR6TWpFc01DNDFNelVnWXlBd0xEQWdNUzR4TmpZc01pNDRPVGdnTVM0ek1qY3NNaTQ0T1RnZ2FDQXlMak0yT1NCaklEQXVNVFkwTERBZ01TNHlORFFzTFRJdU9UQTJJREV1TWpRMExDMHlMamt3TmlCc0lERXVNekl5TEMwd0xqVXpOU0JqSURBc01DQXlMamt4Tml3eExqSTBNaUF6TGpBeU9Td3hMakV6TXlCc0lERXVOamM0TEMweExqWTBNU0JqSURBdU1URTNMQzB3TGpFeE5TQXRNUzR5TWl3dE1pNDVNVFlnTFRFdU1qSXNMVEl1T1RFMklHd2dNQzQxTkRRc0xURXVNamt6SUdNZ01Dd3dJREl1T1RZekxDMHhMakUwTXlBeUxqazJNeXd0TVM0eU9Ua2dWaUE1TGpNMklFTWdNakV1TlRrc09TNHhPVGtnTVRndU5qSXlMRGd1TVRRMUlERTRMall5TWl3NExqRTBOU0I2SUcwZ0xUUXVNelkyTERJdU5ESXpJR01nTUN3eExqZzJOeUF0TVM0MU5UTXNNeTR6T0RjZ0xUTXVORFl4TERNdU16ZzNJQzB4TGprd05pd3dJQzB6TGpRMk1Td3RNUzQxTWlBdE15NDBOakVzTFRNdU16ZzNJREFzTFRFdU9EWTNJREV1TlRVMUxDMHpMak00TlNBekxqUTJNU3d0TXk0ek9EVWdNUzQ1TURrc01DNHdNREVnTXk0ME5qRXNNUzQxTVRnZ015NDBOakVzTXk0ek9EVWdlaUlLSUNBZ2FXUTlJbkJoZEdneklnb2dJQ0J6ZEhsc1pUMGlabWxzYkRvalJrWkdSa1pHSWlBdlBnbzhad29nSUNCcFpEMGlaelVpUGdvOEwyYytDanhuQ2lBZ0lHbGtQU0puTnlJK0Nqd3ZaejRLUEdjS0lDQWdhV1E5SW1jNUlqNEtQQzluUGdvOFp3b2dJQ0JwWkQwaVp6RXhJajRLUEM5blBnbzhad29nSUNCcFpEMGlaekV6SWo0S1BDOW5QZ284WndvZ0lDQnBaRDBpWnpFMUlqNEtQQzluUGdvOFp3b2dJQ0JwWkQwaVp6RTNJajRLUEM5blBnbzhad29nSUNCcFpEMGlaekU1SWo0S1BDOW5QZ284WndvZ0lDQnBaRDBpWnpJeElqNEtQQzluUGdvOFp3b2dJQ0JwWkQwaVp6SXpJajRLUEM5blBnbzhad29nSUNCcFpEMGlaekkxSWo0S1BDOW5QZ284WndvZ0lDQnBaRDBpWnpJM0lqNEtQQzluUGdvOFp3b2dJQ0JwWkQwaVp6STVJajRLUEM5blBnbzhad29nSUNCcFpEMGlaek14SWo0S1BDOW5QZ284WndvZ0lDQnBaRDBpWnpNeklqNEtQQzluUGdvOEwzTjJaejRLKSBuby1yZXBlYXQgNTAlfS5lbW90ZS1tZW51LmVkaXRpbmcgLmljb24tZ2Vhcnstd2Via2l0LWFuaW1hdGlvbjpzcGluIDRzIGxpbmVhciBpbmZpbml0ZTthbmltYXRpb246c3BpbiA0cyBsaW5lYXIgaW5maW5pdGV9LmVtb3RlLW1lbnUgLmljb24tcmVzaXplLWhhbmRsZXtiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UWWlEUW9nSUNCb1pXbG5hSFE5SWpFMklnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lERTJJREUySWcwS0lDQWdhV1E5SWtOaGNHRmZNU0lOQ2lBZ0lIaHRiRHB6Y0dGalpUMGljSEpsYzJWeWRtVWlQanh0WlhSaFpHRjBZUTBLSUNBZ2FXUTlJbTFsZEdGa1lYUmhORE0xTnlJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jelF6TlRVaUlDOCtEUW84Y0dGMGFBMEtJQ0FnWkQwaVRTQXhNeTQxTERnZ1F5QXhNeTR5TWpVc09DQXhNeXc0TGpJeU5DQXhNeXc0TGpVZ2RpQXpMamM1TXlCTUlETXVOekEzTERNZ1NDQTNMalVnUXlBM0xqYzNOaXd6SURnc01pNDNOellnT0N3eUxqVWdPQ3d5TGpJeU5DQTNMamMzTml3eUlEY3VOU3d5SUdnZ0xUVWdUQ0F5TGpNd09Td3lMakF6T1NBeUxqRTFMREl1TVRRMElESXVNVFEyTERJdU1UUTJJREl1TVRRekxESXVNVFV5SURJdU1ETTVMREl1TXpBNUlESXNNaTQxSUhZZ05TQkRJRElzTnk0M056WWdNaTR5TWpRc09DQXlMalVzT0NBeUxqYzNOaXc0SURNc055NDNOellnTXl3M0xqVWdWaUF6TGpjd055Qk1JREV5TGpJNU15d3hNeUJJSURndU5TQkRJRGd1TWpJMExERXpJRGdzTVRNdU1qSTFJRGdzTVRNdU5TQTRMREV6TGpjM05TQTRMakl5TkN3eE5DQTRMalVzTVRRZ2FDQTFJR3dnTUM0eE9URXNMVEF1TURNNUlHTWdNQzR4TWpFc0xUQXVNRFV4SURBdU1qSXNMVEF1TVRRNElEQXVNamNzTFRBdU1qY2dUQ0F4TkN3eE15NDFNRElnVmlBNExqVWdReUF4TkN3NExqSXlOQ0F4TXk0M056VXNPQ0F4TXk0MUxEZ2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb05ETTFNU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1abVptWTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6ND0pIG5vLXJlcGVhdCA1MCU7Y3Vyc29yOm53c2UtcmVzaXplIWltcG9ydGFudH0uZW1vdGUtbWVudSAuaWNvbi1waW57YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVFlpRFFvZ0lDQm9aV2xuYUhROUlqRTJJZzBLSUNBZ2FXUTlJbk4yWnpNd01EVWlQZzBLSUNBOGJXVjBZV1JoZEdFTkNpQWdJQ0FnYVdROUltMWxkR0ZrWVhSaE16QXlNeUkrRFFvZ0lDQWdQSEprWmpwU1JFWStEUW9nSUNBZ0lDQThZMk02VjI5eWF3MEtJQ0FnSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGcwS0lDQWdJQ0FnSUNBOFpHTTZabTl5YldGMFBtbHRZV2RsTDNOMlp5dDRiV3c4TDJSak9tWnZjbTFoZEQ0TkNpQWdJQ0FnSUNBZ1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lDQWdjbVJtT25KbGMyOTFjbU5sUFNKb2RIUndPaTh2Y0hWeWJDNXZjbWN2WkdNdlpHTnRhWFI1Y0dVdlUzUnBiR3hKYldGblpTSWdMejROQ2lBZ0lDQWdJQ0FnUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK0RRb2dJQ0FnSUNBOEwyTmpPbGR2Y21zK0RRb2dJQ0FnUEM5eVpHWTZVa1JHUGcwS0lDQThMMjFsZEdGa1lYUmhQZzBLSUNBOFpHVm1jdzBLSUNBZ0lDQnBaRDBpWkdWbWN6TXdNakVpSUM4K0RRb2dJRHhuRFFvZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1Tnprek1EYzRNaXd3TERBc01DNDNPVE13TnpneUxDMHlMakUzTURrNE5Td3RPREUwTGpZNU1qazVLU0lOQ2lBZ0lDQWdhV1E5SW1jek1EQTNJajROQ2lBZ0lDQThadzBLSUNBZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1TnpBM01URXNNQzQzTURjeE1Td3RNQzQzTURjeE1Td3dMamN3TnpFeExEY3pOeTQzTURjMU5Td3lPVFV1TkRnNE1EZ3BJZzBLSUNBZ0lDQWdJR2xrUFNKbk16QXdPU0krRFFvZ0lDQWdJQ0E4WncwS0lDQWdJQ0FnSUNBZ2FXUTlJbWN6TnpVMUlqNE5DaUFnSUNBZ0lDQWdQSEJoZEdnTkNpQWdJQ0FnSUNBZ0lDQWdaRDBpVFNBNUxqYzRNVEkxTERBZ1F5QTVMalEzTkRBMU5qSXNNQzQyT0RreE1USWdPUzQxTWpBMk9Dd3hMalV5TXpBNE5UTWdPUzR6TVRJMUxESXVNVGczTlNCTUlEUXVPVE0zTlN3MkxqVTVNemMxSUVNZ015NDVOVGc1TmpBNExEWXVOREk1TkRneklESXVPVFEzTnpVME9DdzJMalV6TWpjNE9Ua2dNaXcyTGpneE1qVWdUQ0ExTGpBek1USTFMRGt1T0RRek56VWdNQzQxTmpJMUxERTBMak14TWpVZ01Dd3hOaUJESURBdU5UWTVNamsyTWpnc01UVXVOemsxTmpJMklERXVNVFkzTnpNM09Dd3hOUzQyTkRBeU16Y2dNUzQzTVRnM05Td3hOUzQwTURZeU5TQk1JRFl1TVRVMk1qVXNNVEF1T1RZNE56VWdPUzR4T0RjMUxERTBJR01nTUM0eU56azJPREl6TEMwd0xqazBOemM0TXlBd0xqTTRNekUxTWpnc0xURXVPVFU0T1RNM0lEQXVNakU0TnpVc0xUSXVPVE0zTlNBeExqVXdNREF4TVN3dE1TNDBPRGsxTnprNElETXVNREF3TURBeExDMHlMamszT1RFMU9TQTBMalVzTFRRdU5EWTROelVnTUM0Mk1ERXhNRElzTFRBdU1ETXhNell4SURFdU9ESXlNVE00TEMwd0xqQTVOakV6TnlBeUxDMHdMalEyT0RjMUlFTWdNVE11T0RjNU9Ea3lMRFF1TURZNU5EZ3dNeUF4TVM0NE5ESTROalVzTWk0d01qQXlNamd5SURrdU56Z3hNalVzTUNCNklnMEtJQ0FnSUNBZ0lDQWdJQ0IwY21GdWMyWnZjbTA5SW0xaGRISnBlQ2d3TGpnNU1UVTVNemMwTEMwd0xqZzVNVFU1TXpjMExEQXVPRGt4TlRrek56UXNNQzQ0T1RFMU9UTTNOQ3d0TWk0eU5qVTFMREV3TXpjdU1UTTBOU2tpRFFvZ0lDQWdJQ0FnSUNBZ0lHbGtQU0p3WVhSb016QXhNU0lOQ2lBZ0lDQWdJQ0FnSUNBZ2MzUjViR1U5SW1acGJHdzZJMlptWm1abVpqdG1hV3hzTFc5d1lXTnBkSGs2TVNJZ0x6NE5DaUFnSUNBZ0lEd3ZaejROQ2lBZ0lDQThMMmMrRFFvZ0lEd3ZaejROQ2p3dmMzWm5QZzBLKSBuby1yZXBlYXQgNTAlOy13ZWJraXQtdHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZX0uZW1vdGUtbWVudSAuaWNvbi1waW46aG92ZXIsLmVtb3RlLW1lbnUucGlubmVkIC5pY29uLXBpbnstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTstbXMtdHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3RyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTtvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLnNjcm9sbGFibGUuZGVmYXVsdC1za2lue3BhZGRpbmctcmlnaHQ6MDtwYWRkaW5nLWJvdHRvbTowfS5lbW90ZS1tZW51IC5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojNTU1O29wYWNpdHk6LjI7ei1pbmRleDoxfS5lbW90ZS1tZW51IC5lZGl0LXZpc2liaWxpdHl7YmFja2dyb3VuZC1jb2xvcjojMDBjODAwO2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrQ2p3aExTMGdRM0psWVhSbFpDQjNhWFJvSUVsdWEzTmpZWEJsSUNob2RIUndPaTh2ZDNkM0xtbHVhM05qWVhCbExtOXlaeThwSUMwdFBnb0tQSE4yWndvZ0lDQjRiV3h1Y3pwa1l6MGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlZzWlcxbGJuUnpMekV1TVM4aUNpQWdJSGh0Ykc1ek9tTmpQU0pvZEhSd09pOHZZM0psWVhScGRtVmpiMjF0YjI1ekxtOXlaeTl1Y3lNaUNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlLSUNBZ2VHMXNibk02YzNablBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHlNREF3TDNOMlp5SUtJQ0FnZUcxc2JuTTlJbWgwZEhBNkx5OTNkM2N1ZHpNdWIzSm5Mekl3TURBdmMzWm5JZ29nSUNCMlpYSnphVzl1UFNJeExqRWlDaUFnSUhkcFpIUm9QU0l4TURBaUNpQWdJR2hsYVdkb2REMGlNVEF3SWdvZ0lDQjJhV1YzUW05NFBTSXdJREFnTVRBd0lERXdNQ0lLSUNBZ2FXUTlJa3hoZVdWeVh6RWlDaUFnSUhodGJEcHpjR0ZqWlQwaWNISmxjMlZ5ZG1VaVBqeHRaWFJoWkdGMFlRb2dJQ0JwWkQwaWJXVjBZV1JoZEdFNUlqNDhjbVJtT2xKRVJqNDhZMk02VjI5eWF3b2dJQ0FnSUNBZ2NtUm1PbUZpYjNWMFBTSWlQanhrWXpwbWIzSnRZWFErYVcxaFoyVXZjM1puSzNodGJEd3ZaR002Wm05eWJXRjBQanhrWXpwMGVYQmxDaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekNpQWdJR2xrUFNKa1pXWnpOeUlnTHo0S1BIQmhkR2dLSUNBZ1pEMGlUU0E1Tnk0NU5qUXNORFl1TlRRNElFTWdPVGN1TURrNExEUTFMalV5T0NBM05pNDBNamNzTWpFdU5qQXpJRFV3TERJeExqWXdNeUJqSUMweU5pNDBNamNzTUNBdE5EY3VNRGs0TERJekxqa3lOU0F0TkRjdU9UWTFMREkwTGprME5pQXRNUzQzTURFc01pQXRNUzQzTURFc05DNDVNRElnTVRCbExUUXNOaTQ1TURNZ01DNDROallzTVM0d01pQXlNUzQxTXpjc01qUXVPVFExSURRM0xqazJOQ3d5TkM0NU5EVWdNall1TkRJM0xEQWdORGN1TURrNExDMHlNeTQ1TWpZZ05EY3VPVFkxTEMweU5DNDVORFlnTVM0M01ERXNMVElnTVM0M01ERXNMVFF1T1RBeUlDMHdMakF3TVN3dE5pNDVNRE1nZWlCTklEVTRMakEzTXl3ek5TNDVOelVnWXlBeExqYzNOeXd0TUM0NU55QTBMakkxTlN3d0xqRTBNeUExTGpVek5Dd3lMalE0TlNBeExqSTNPU3d5TGpNME15QXdMamczTlN3MUxqQXlPU0F0TUM0NU1ESXNOUzQ1T1RrZ0xURXVOemMzTERBdU9UY3hJQzAwTGpJMU5Td3RNQzR4TkRNZ0xUVXVOVE0xTEMweUxqUTROU0F0TVM0eU56a3NMVEl1TXpReklDMHdMamczTlN3dE5TNHdNamtnTUM0NU1ETXNMVFV1T1RrNUlIb2dUU0ExTUN3Mk9TNDNNamtnUXlBek1TNDFOQ3cyT1M0M01qa2dNVFl1TURBMUxEVTFMalUxTXlBeE1DNDJNamdzTlRBZ01UUXVNalU1TERRMkxqSTBPU0F5TWk0MU1qWXNNemd1TlRjeElETXpMakU1TlN3ek15NDVOemtnTXpFdU1URTBMRE0zTGpFME5TQXlPUzQ0T1RRc05EQXVPVEk0SURJNUxqZzVOQ3cwTlNCaklEQXNNVEV1TVRBMElEa3VNREF4TERJd0xqRXdOU0F5TUM0eE1EVXNNakF1TVRBMUlERXhMakV3TkN3d0lESXdMakV3Tml3dE9TNHdNREVnTWpBdU1UQTJMQzB5TUM0eE1EVWdNQ3d0TkM0d056SWdMVEV1TWpFNUxDMDNMamcxTlNBdE15NHpMQzB4TVM0d01qRWdReUEzTnk0ME56UXNNemd1TlRjeUlEZzFMamMwTVN3ME5pNHlOU0E0T1M0ek56SXNOVEFnT0RNdU9UazFMRFUxTGpVMU5TQTJPQzQwTml3Mk9TNDNNamtnTlRBc05qa3VOekk1SUhvaUNpQWdJR2xrUFNKd1lYUm9NeUlnTHo0S1BDOXpkbWMrKTtiYWNrZ3JvdW5kLXBvc2l0aW9uOjUwJTtiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7YmFja2dyb3VuZC1zaXplOjE0cHg7Ym9yZGVyOjFweCBzb2xpZCAjMDAwO2JvcmRlci1yYWRpdXM6NHB4O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6bm9uZTtvcGFjaXR5Oi41O2hlaWdodDoxNHB4O3Bvc2l0aW9uOmFic29sdXRlO3dpZHRoOjE0cHg7ei1pbmRleDoxOy13ZWJraXQtdHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZX0uZW1vdGUtbWVudSAuZWRpdC12aXNpYmlsaXR5OmhvdmVye29wYWNpdHk6MX0uZW1vdGUtbWVudSAuZW1vdGU+LmVkaXQtdmlzaWJpbGl0eXt0b3A6MDtyaWdodDowO2xlZnQ6YXV0bztib3R0b206YXV0b30uZW1vdGUtbWVudSAuaGVhZGVyLWluZm8+LmVkaXQtdmlzaWJpbGl0eXttYXJnaW4tbGVmdDo1cHh9LmVtb3RlLW1lbnUuZWRpdGluZyAuZWRpdC12aXNpYmlsaXR5e2Rpc3BsYXk6aW5saW5lLWJsb2NrfS5lbW90ZS1tZW51IC5lbW90ZS1tZW51LWhpZGRlbiAuZWRpdC12aXNpYmlsaXR5e2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrQ2p3aExTMGdRM0psWVhSbFpDQjNhWFJvSUVsdWEzTmpZWEJsSUNob2RIUndPaTh2ZDNkM0xtbHVhM05qWVhCbExtOXlaeThwSUMwdFBnb0tQSE4yWndvZ0lDQjRiV3h1Y3pwa1l6MGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlZzWlcxbGJuUnpMekV1TVM4aUNpQWdJSGh0Ykc1ek9tTmpQU0pvZEhSd09pOHZZM0psWVhScGRtVmpiMjF0YjI1ekxtOXlaeTl1Y3lNaUNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlLSUNBZ2VHMXNibk02YzNablBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHlNREF3TDNOMlp5SUtJQ0FnZUcxc2JuTTlJbWgwZEhBNkx5OTNkM2N1ZHpNdWIzSm5Mekl3TURBdmMzWm5JZ29nSUNCMlpYSnphVzl1UFNJeExqRWlDaUFnSUhkcFpIUm9QU0l4TURBaUNpQWdJR2hsYVdkb2REMGlNVEF3SWdvZ0lDQjJhV1YzUW05NFBTSXdJREFnTVRBd0lERXdNQ0lLSUNBZ2FXUTlJa3hoZVdWeVh6TWlDaUFnSUhodGJEcHpjR0ZqWlQwaWNISmxjMlZ5ZG1VaVBqeHRaWFJoWkdGMFlRb2dJQ0JwWkQwaWJXVjBZV1JoZEdFeE5TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc0tJQ0FnSUNBZ0lISmtaanBoWW05MWREMGlJajQ4WkdNNlptOXliV0YwUG1sdFlXZGxMM04yWnl0NGJXdzhMMlJqT21admNtMWhkRDQ4WkdNNmRIbHdaUW9nSUNBZ0lDQWdJQ0J5WkdZNmNtVnpiM1Z5WTJVOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWtZMjFwZEhsd1pTOVRkR2xzYkVsdFlXZGxJaUF2UGp4a1l6cDBhWFJzWlQ0OEwyUmpPblJwZEd4bFBqd3ZZMk02VjI5eWF6NDhMM0prWmpwU1JFWStQQzl0WlhSaFpHRjBZVDQ4WkdWbWN3b2dJQ0JwWkQwaVpHVm1jekV6SWlBdlBnbzhad29nSUNCcFpEMGlaek1pUGdvSlBIQmhkR2dLSUNBZ1pEMGlUU0EzTUM0d09ESXNORFV1TkRjMUlEVXdMalEzTkN3Mk5TNHdPRElnUXlBMk1TNHhPVGdzTmpRdU9ETXhJRFk1TGpnek1TdzFOaTR4T1RjZ056QXVNRGd5TERRMUxqUTNOU0I2SWdvZ0lDQnBaRDBpY0dGMGFEVWlDaUFnSUhOMGVXeGxQU0ptYVd4c09pTkdSa1pHUmtZaUlDOCtDZ2s4Y0dGMGFBb2dJQ0JrUFNKdElEazNMamsyTkN3ME5pNDFORGdnWXlBdE1DNDBOU3d0TUM0MU1qa2dMVFl1TWpRMUxDMDNMakl6SUMweE5TNDBNRE1zTFRFekxqVTFOQ0JzSUMwMkxqSXNOaTR5SUVNZ09ESXVNelV4TERRekxqRTBPQ0E0Tmk0NU1pdzBOeTQwTmprZ09Ea3VNemN5TERVd0lEZ3pMams1TlN3MU5TNDFOVFVnTmpndU5EWXNOamt1TnpJNUlEVXdMRFk1TGpjeU9TQmpJQzB4TGpNek5Dd3dJQzB5TGpZMU1Td3RNQzR3T0RJZ0xUTXVPVFV5TEMwd0xqSXlNaUJzSUMwM0xqUXpPU3czTGpRek9TQmpJRE11TmpNNUxEQXVPVEE1SURjdU5EUTVMREV1TkRVZ01URXVNemt4TERFdU5EVWdNall1TkRJM0xEQWdORGN1TURrNExDMHlNeTQ1TWpZZ05EY3VPVFkxTEMweU5DNDVORFlnTVM0M01ERXNMVEV1T1RrNUlERXVOekF4TEMwMExqa3dNU0F0TUM0d01ERXNMVFl1T1RBeUlIb2lDaUFnSUdsa1BTSndZWFJvTnlJS0lDQWdjM1I1YkdVOUltWnBiR3c2STBaR1JrWkdSaUlnTHo0S0NUeHdZWFJvQ2lBZ0lHUTlJbTBnT1RFdU5ERXhMREUyTGpZMklHTWdNQ3d0TUM0eU5qWWdMVEF1TVRBMUxDMHdMalV5SUMwd0xqSTVNeXd0TUM0M01EY2diQ0F0Tnk0d056RXNMVGN1TURjZ1l5QXRNQzR6T1RFc0xUQXVNemt4SUMweExqQXlNeXd0TUM0ek9URWdMVEV1TkRFMExEQWdUQ0EyTmk0NE1EUXNNalF1TnpFeElFTWdOakV1TmpBeUxESXlMamd4T0NBMU5TNDVORGtzTWpFdU5qQXpJRFV3TERJeExqWXdNeUJqSUMweU5pNDBNamNzTUNBdE5EY3VNRGs0TERJekxqa3lOaUF0TkRjdU9UWTFMREkwTGprME5pQXRNUzQzTURFc01pQXRNUzQzTURFc05DNDVNRElnTVRCbExUUXNOaTQ1TURNZ01DNDFNVGNzTUM0Mk1EY2dPQzR3T0RNc09TNHpOVFFnTVRrdU56QTNMREUyTGpNeUlFd2dPQzQ0T0RNc09ESXVOak15SUVNZ09DNDJPVFVzT0RJdU9ESWdPQzQxT1N3NE15NHdOek1nT0M0MU9TdzRNeTR6TXprZ1l5QXdMREF1TWpZMklEQXVNVEExTERBdU5USWdNQzR5T1RNc01DNDNNRGNnYkNBM0xqQTNNU3czTGpBM0lHTWdNQzR4T1RVc01DNHhPVFVnTUM0ME5URXNNQzR5T1RNZ01DNDNNRGNzTUM0eU9UTWdNQzR5TlRZc01DQXdMalV4TWl3dE1DNHdPVGdnTUM0M01EY3NMVEF1TWpreklHd2dOek11TnpVc0xUY3pMamMxSUdNZ01DNHhPRGNzTFRBdU1UZzJJREF1TWprekxDMHdMalEwSURBdU1qa3pMQzB3TGpjd05pQjZJRTBnTVRBdU5qSTRMRFV3SUVNZ01UUXVNalU1TERRMkxqSTBPU0F5TWk0MU1qWXNNemd1TlRjeElETXpMakU1TlN3ek15NDVOemtnTXpFdU1URTBMRE0zTGpFME5TQXlPUzQ0T1RRc05EQXVPVEk0SURJNUxqZzVOQ3cwTlNCaklEQXNOQzQyTmpVZ01TNDJNREVzT0M0NU5EVWdOQzR5Tnl3eE1pNHpOVEVnVENBeU9DNHdOQ3cyTXk0ME56VWdReUF4T1M0NE9EZ3NOVGd1T1RVMUlERXpMalkwT1N3MU15NHhNaUF4TUM0Mk1qZ3NOVEFnZWlJS0lDQWdhV1E5SW5CaGRHZzVJZ29nSUNCemRIbHNaVDBpWm1sc2JEb2pSa1pHUmtaR0lpQXZQZ284TDJjK0Nqd3ZjM1puUGdvPSk7YmFja2dyb3VuZC1jb2xvcjpyZWR9LmVtb3RlLW1lbnU6bm90KC5lZGl0aW5nKSAuZW1vdGUtbWVudS1oaWRkZW57ZGlzcGxheTpub25lfVwiKSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgSG9nYW4gPSByZXF1aXJlKCdob2dhbi5qcy9saWIvdGVtcGxhdGUuanMnKTtcbiAgICB2YXIgdGVtcGxhdGVzID0ge307XG4gICAgdGVtcGxhdGVzWydlbW90ZSddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJlbW90ZVwiKTtpZih0LnModC5mKFwidGhpcmRQYXJ0eVwiLGMscCwxKSxjLHAsMCwzMiw0NCxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIHRoaXJkLXBhcnR5XCIpO30pO2MucG9wKCk7fWlmKCF0LnModC5mKFwiaXNWaXNpYmxlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7dC5iKFwiIGVtb3RlLW1lbnUtaGlkZGVuXCIpO307dC5iKFwiXFxcIiBkYXRhLWVtb3RlPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIiB0aXRsZT1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO2lmKHQucyh0LmYoXCJ0aGlyZFBhcnR5XCIsYyxwLDEpLGMscCwwLDE1OSwxODIsXCJ7eyB9fVwiKSl7dC5ycyhjLHAsZnVuY3Rpb24oYyxwLHQpe3QuYihcIiAoZnJvbSAzcmQgcGFydHkgYWRkb24pXCIpO30pO2MucG9wKCk7fXQuYihcIlxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoXCIpO3QuYih0LnQodC5kKFwiaW1hZ2UudXJsXCIsYyxwLDApKSk7dC5iKFwiKTsgaGVpZ2h0OiBcIik7dC5iKHQudCh0LmQoXCJpbWFnZS5oZWlnaHRcIixjLHAsMCkpKTt0LmIoXCJweDsgd2lkdGg6IFwiKTt0LmIodC50KHQuZChcImltYWdlLndpZHRoXCIsYyxwLDApKSk7dC5iKFwicHhcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZWRpdC12aXNpYmlsaXR5XFxcIiBkYXRhLXdoaWNoPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS12aXNpYmlsaXR5XFxcIiB0aXRsZT1cXFwiSGlkZS9zaG93IGVtb3RlOiBcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWydlbW90ZUJ1dHRvbiddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8YnV0dG9uIGNsYXNzPVxcXCJidXR0b24gZ2x5cGgtb25seSBmbG9hdC1sZWZ0XFxcIiB0aXRsZT1cXFwiRW1vdGUgTWVudVxcXCIgaWQ9XFxcImVtb3RlLW1lbnUtYnV0dG9uXFxcIj48L2J1dHRvbj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWydlbW90ZUdyb3VwSGVhZGVyJ10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIjxkaXYgY2xhc3M9XFxcImdyb3VwLWhlYWRlclwiKTtpZighdC5zKHQuZihcImlzVmlzaWJsZVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe3QuYihcIiBlbW90ZS1tZW51LWhpZGRlblwiKTt9O3QuYihcIlxcXCIgZGF0YS1lbW90ZS1jaGFubmVsPVxcXCJcIik7dC5iKHQudih0LmYoXCJjaGFubmVsXCIsYyxwLDApKSk7dC5iKFwiXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImhlYWRlci1pbmZvXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGltZyBzcmM9XFxcIlwiKTt0LmIodC52KHQuZihcImJhZGdlXCIsYyxwLDApKSk7dC5iKFwiXFxcIiAvPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcIik7dC5iKHQudih0LmYoXCJjaGFubmVsXCIsYyxwLDApKSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcImVkaXQtdmlzaWJpbGl0eVxcXCIgZGF0YS13aGljaD1cXFwiY2hhbm5lbC1cIik7dC5iKHQudih0LmYoXCJjaGFubmVsXCIsYyxwLDApKSk7dC5iKFwiXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS12aXNpYmlsaXR5XFxcIiB0aXRsZT1cXFwiSGlkZS9zaG93IGFsbCBlbW90ZXMgZm9yIFwiKTt0LmIodC52KHQuZihcImNoYW5uZWxcIixjLHAsMCkpKTt0LmIoXCJcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snbWVudSddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJlbW90ZS1tZW51XFxcIiBpZD1cXFwiZW1vdGUtbWVudS1mb3ItdHdpdGNoXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImRyYWdnYWJsZVxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXItaW5mb1xcXCI+QWxsIEVtb3RlczwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtY29udGFpbmVyIHNjcm9sbGFibGVcXFwiIGlkPVxcXCJhbGwtZW1vdGVzLWdyb3VwXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImhlYWRlci1pbmZvXFxcIj5Qb3B1bGFyIEVtb3RlczwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtY29udGFpbmVyIHNpbmdsZS1yb3dcXFwiIGlkPVxcXCJwb3B1bGFyLWVtb3Rlcy1ncm91cFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJmb290ZXJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8YSBjbGFzcz1cXFwicHVsbC1sZWZ0IGljb24gaWNvbi1ob21lXFxcIiBocmVmPVxcXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgdGl0bGU9XFxcIlZpc2l0IHRoZSBob21lcGFnZSB3aGVyZSB5b3UgY2FuIGRvbmF0ZSwgcG9zdCBhIHJldmlldywgb3IgY29udGFjdCB0aGUgZGV2ZWxvcGVyXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLWxlZnQgaWNvbiBpY29uLWdlYXJcXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLWVkaXRpbmdcXFwiIHRpdGxlPVxcXCJUb2dnbGUgZWRpdCBtb2RlXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIHRpdGxlPVxcXCJSZXNldCB0aGUgcG9wdWxhcml0eSBvZiB0aGUgZW1vdGVzIGJhY2sgdG8gZGVmYXVsdFxcXCIgZGF0YS1jb21tYW5kPVxcXCJyZXNldC1wb3B1bGFyaXR5XFxcIj5SZXNldCBQb3B1bGFyaXR5PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8YSBjbGFzcz1cXFwicHVsbC1yaWdodCBpY29uIGljb24tcmVzaXplLWhhbmRsZVxcXCIgZGF0YS1jb21tYW5kPVxcXCJyZXNpemUtaGFuZGxlXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLXJpZ2h0IGljb24gaWNvbi1waW5cXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLXBpbm5lZFxcXCIgdGl0bGU9XFxcIlBpbi91bnBpbiB0aGUgZW1vdGUgbWVudSB0byB0aGUgc2NyZWVuXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWyduZXdzTWVzc2FnZSddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJ0d2l0Y2gtY2hhdC1lbW90ZXMtbmV3c1xcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRbXCIpO3QuYih0LnYodC5mKFwic2NyaXB0TmFtZVwiLGMscCwwKSkpO3QuYihcIl0gTmV3czogXCIpO3QuYih0LnQodC5mKFwibWVzc2FnZVwiLGMscCwwKSkpO3QuYihcIiAoPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS1jb21tYW5kPVxcXCJ0d2l0Y2gtY2hhdC1lbW90ZXM6ZGlzbWlzcy1uZXdzXFxcIiBkYXRhLW5ld3MtaWQ9XFxcIlwiKTt0LmIodC52KHQuZihcImlkXCIsYyxwLDApKSk7dC5iKFwiXFxcIj5EaXNtaXNzPC9hPilcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgcmV0dXJuIHRlbXBsYXRlcztcbn0pKCk7IiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLyohIGh0dHA6Ly9tdGhzLmJlL3B1bnljb2RlIHYxLjIuNCBieSBAbWF0aGlhcyAqL1xuOyhmdW5jdGlvbihyb290KSB7XG5cblx0LyoqIERldGVjdCBmcmVlIHZhcmlhYmxlcyAqL1xuXHR2YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzO1xuXHR2YXIgZnJlZU1vZHVsZSA9IHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlICYmXG5cdFx0bW9kdWxlLmV4cG9ydHMgPT0gZnJlZUV4cG9ydHMgJiYgbW9kdWxlO1xuXHR2YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsO1xuXHRpZiAoZnJlZUdsb2JhbC5nbG9iYWwgPT09IGZyZWVHbG9iYWwgfHwgZnJlZUdsb2JhbC53aW5kb3cgPT09IGZyZWVHbG9iYWwpIHtcblx0XHRyb290ID0gZnJlZUdsb2JhbDtcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgYHB1bnljb2RlYCBvYmplY3QuXG5cdCAqIEBuYW1lIHB1bnljb2RlXG5cdCAqIEB0eXBlIE9iamVjdFxuXHQgKi9cblx0dmFyIHB1bnljb2RlLFxuXG5cdC8qKiBIaWdoZXN0IHBvc2l0aXZlIHNpZ25lZCAzMi1iaXQgZmxvYXQgdmFsdWUgKi9cblx0bWF4SW50ID0gMjE0NzQ4MzY0NywgLy8gYWthLiAweDdGRkZGRkZGIG9yIDJeMzEtMVxuXG5cdC8qKiBCb290c3RyaW5nIHBhcmFtZXRlcnMgKi9cblx0YmFzZSA9IDM2LFxuXHR0TWluID0gMSxcblx0dE1heCA9IDI2LFxuXHRza2V3ID0gMzgsXG5cdGRhbXAgPSA3MDAsXG5cdGluaXRpYWxCaWFzID0gNzIsXG5cdGluaXRpYWxOID0gMTI4LCAvLyAweDgwXG5cdGRlbGltaXRlciA9ICctJywgLy8gJ1xceDJEJ1xuXG5cdC8qKiBSZWd1bGFyIGV4cHJlc3Npb25zICovXG5cdHJlZ2V4UHVueWNvZGUgPSAvXnhuLS0vLFxuXHRyZWdleE5vbkFTQ0lJID0gL1teIC1+XS8sIC8vIHVucHJpbnRhYmxlIEFTQ0lJIGNoYXJzICsgbm9uLUFTQ0lJIGNoYXJzXG5cdHJlZ2V4U2VwYXJhdG9ycyA9IC9cXHgyRXxcXHUzMDAyfFxcdUZGMEV8XFx1RkY2MS9nLCAvLyBSRkMgMzQ5MCBzZXBhcmF0b3JzXG5cblx0LyoqIEVycm9yIG1lc3NhZ2VzICovXG5cdGVycm9ycyA9IHtcblx0XHQnb3ZlcmZsb3cnOiAnT3ZlcmZsb3c6IGlucHV0IG5lZWRzIHdpZGVyIGludGVnZXJzIHRvIHByb2Nlc3MnLFxuXHRcdCdub3QtYmFzaWMnOiAnSWxsZWdhbCBpbnB1dCA+PSAweDgwIChub3QgYSBiYXNpYyBjb2RlIHBvaW50KScsXG5cdFx0J2ludmFsaWQtaW5wdXQnOiAnSW52YWxpZCBpbnB1dCdcblx0fSxcblxuXHQvKiogQ29udmVuaWVuY2Ugc2hvcnRjdXRzICovXG5cdGJhc2VNaW51c1RNaW4gPSBiYXNlIC0gdE1pbixcblx0Zmxvb3IgPSBNYXRoLmZsb29yLFxuXHRzdHJpbmdGcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLFxuXG5cdC8qKiBUZW1wb3JhcnkgdmFyaWFibGUgKi9cblx0a2V5O1xuXG5cdC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cdC8qKlxuXHQgKiBBIGdlbmVyaWMgZXJyb3IgdXRpbGl0eSBmdW5jdGlvbi5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgVGhlIGVycm9yIHR5cGUuXG5cdCAqIEByZXR1cm5zIHtFcnJvcn0gVGhyb3dzIGEgYFJhbmdlRXJyb3JgIHdpdGggdGhlIGFwcGxpY2FibGUgZXJyb3IgbWVzc2FnZS5cblx0ICovXG5cdGZ1bmN0aW9uIGVycm9yKHR5cGUpIHtcblx0XHR0aHJvdyBSYW5nZUVycm9yKGVycm9yc1t0eXBlXSk7XG5cdH1cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGBBcnJheSNtYXBgIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeSBhcnJheVxuXHQgKiBpdGVtLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IGFycmF5IG9mIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBtYXAoYXJyYXksIGZuKSB7XG5cdFx0dmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblx0XHR3aGlsZSAobGVuZ3RoLS0pIHtcblx0XHRcdGFycmF5W2xlbmd0aF0gPSBmbihhcnJheVtsZW5ndGhdKTtcblx0XHR9XG5cdFx0cmV0dXJuIGFycmF5O1xuXHR9XG5cblx0LyoqXG5cdCAqIEEgc2ltcGxlIGBBcnJheSNtYXBgLWxpa2Ugd3JhcHBlciB0byB3b3JrIHdpdGggZG9tYWluIG5hbWUgc3RyaW5ncy5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGRvbWFpbiBUaGUgZG9tYWluIG5hbWUuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeVxuXHQgKiBjaGFyYWN0ZXIuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgc3RyaW5nIG9mIGNoYXJhY3RlcnMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrXG5cdCAqIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwRG9tYWluKHN0cmluZywgZm4pIHtcblx0XHRyZXR1cm4gbWFwKHN0cmluZy5zcGxpdChyZWdleFNlcGFyYXRvcnMpLCBmbikuam9pbignLicpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgbnVtZXJpYyBjb2RlIHBvaW50cyBvZiBlYWNoIFVuaWNvZGVcblx0ICogY2hhcmFjdGVyIGluIHRoZSBzdHJpbmcuIFdoaWxlIEphdmFTY3JpcHQgdXNlcyBVQ1MtMiBpbnRlcm5hbGx5LFxuXHQgKiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udmVydCBhIHBhaXIgb2Ygc3Vycm9nYXRlIGhhbHZlcyAoZWFjaCBvZiB3aGljaFxuXHQgKiBVQ1MtMiBleHBvc2VzIGFzIHNlcGFyYXRlIGNoYXJhY3RlcnMpIGludG8gYSBzaW5nbGUgY29kZSBwb2ludCxcblx0ICogbWF0Y2hpbmcgVVRGLTE2LlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmVuY29kZWBcblx0ICogQHNlZSA8aHR0cDovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcblx0ICogQG5hbWUgZGVjb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmcgVGhlIFVuaWNvZGUgaW5wdXQgc3RyaW5nIChVQ1MtMikuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gVGhlIG5ldyBhcnJheSBvZiBjb2RlIHBvaW50cy5cblx0ICovXG5cdGZ1bmN0aW9uIHVjczJkZWNvZGUoc3RyaW5nKSB7XG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBjb3VudGVyID0gMCxcblx0XHQgICAgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aCxcblx0XHQgICAgdmFsdWUsXG5cdFx0ICAgIGV4dHJhO1xuXHRcdHdoaWxlIChjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHR2YWx1ZSA9IHN0cmluZy5jaGFyQ29kZUF0KGNvdW50ZXIrKyk7XG5cdFx0XHRpZiAodmFsdWUgPj0gMHhEODAwICYmIHZhbHVlIDw9IDB4REJGRiAmJiBjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHRcdC8vIGhpZ2ggc3Vycm9nYXRlLCBhbmQgdGhlcmUgaXMgYSBuZXh0IGNoYXJhY3RlclxuXHRcdFx0XHRleHRyYSA9IHN0cmluZy5jaGFyQ29kZUF0KGNvdW50ZXIrKyk7XG5cdFx0XHRcdGlmICgoZXh0cmEgJiAweEZDMDApID09IDB4REMwMCkgeyAvLyBsb3cgc3Vycm9nYXRlXG5cdFx0XHRcdFx0b3V0cHV0LnB1c2goKCh2YWx1ZSAmIDB4M0ZGKSA8PCAxMCkgKyAoZXh0cmEgJiAweDNGRikgKyAweDEwMDAwKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyB1bm1hdGNoZWQgc3Vycm9nYXRlOyBvbmx5IGFwcGVuZCB0aGlzIGNvZGUgdW5pdCwgaW4gY2FzZSB0aGUgbmV4dFxuXHRcdFx0XHRcdC8vIGNvZGUgdW5pdCBpcyB0aGUgaGlnaCBzdXJyb2dhdGUgb2YgYSBzdXJyb2dhdGUgcGFpclxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0XHRjb3VudGVyLS07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dDtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgc3RyaW5nIGJhc2VkIG9uIGFuIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG5cdCAqIEBzZWUgYHB1bnljb2RlLnVjczIuZGVjb2RlYFxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGUudWNzMlxuXHQgKiBAbmFtZSBlbmNvZGVcblx0ICogQHBhcmFtIHtBcnJheX0gY29kZVBvaW50cyBUaGUgYXJyYXkgb2YgbnVtZXJpYyBjb2RlIHBvaW50cy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIG5ldyBVbmljb2RlIHN0cmluZyAoVUNTLTIpLlxuXHQgKi9cblx0ZnVuY3Rpb24gdWNzMmVuY29kZShhcnJheSkge1xuXHRcdHJldHVybiBtYXAoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHR2YXIgb3V0cHV0ID0gJyc7XG5cdFx0XHRpZiAodmFsdWUgPiAweEZGRkYpIHtcblx0XHRcdFx0dmFsdWUgLT0gMHgxMDAwMDtcblx0XHRcdFx0b3V0cHV0ICs9IHN0cmluZ0Zyb21DaGFyQ29kZSh2YWx1ZSA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMCk7XG5cdFx0XHRcdHZhbHVlID0gMHhEQzAwIHwgdmFsdWUgJiAweDNGRjtcblx0XHRcdH1cblx0XHRcdG91dHB1dCArPSBzdHJpbmdGcm9tQ2hhckNvZGUodmFsdWUpO1xuXHRcdFx0cmV0dXJuIG91dHB1dDtcblx0XHR9KS5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGJhc2ljIGNvZGUgcG9pbnQgaW50byBhIGRpZ2l0L2ludGVnZXIuXG5cdCAqIEBzZWUgYGRpZ2l0VG9CYXNpYygpYFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlcn0gY29kZVBvaW50IFRoZSBiYXNpYyBudW1lcmljIGNvZGUgcG9pbnQgdmFsdWUuXG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludCAoZm9yIHVzZSBpblxuXHQgKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGluIHRoZSByYW5nZSBgMGAgdG8gYGJhc2UgLSAxYCwgb3IgYGJhc2VgIGlmXG5cdCAqIHRoZSBjb2RlIHBvaW50IGRvZXMgbm90IHJlcHJlc2VudCBhIHZhbHVlLlxuXHQgKi9cblx0ZnVuY3Rpb24gYmFzaWNUb0RpZ2l0KGNvZGVQb2ludCkge1xuXHRcdGlmIChjb2RlUG9pbnQgLSA0OCA8IDEwKSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gMjI7XG5cdFx0fVxuXHRcdGlmIChjb2RlUG9pbnQgLSA2NSA8IDI2KSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gNjU7XG5cdFx0fVxuXHRcdGlmIChjb2RlUG9pbnQgLSA5NyA8IDI2KSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gOTc7XG5cdFx0fVxuXHRcdHJldHVybiBiYXNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgZGlnaXQvaW50ZWdlciBpbnRvIGEgYmFzaWMgY29kZSBwb2ludC5cblx0ICogQHNlZSBgYmFzaWNUb0RpZ2l0KClgXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBkaWdpdCBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQuXG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBiYXNpYyBjb2RlIHBvaW50IHdob3NlIHZhbHVlICh3aGVuIHVzZWQgZm9yXG5cdCAqIHJlcHJlc2VudGluZyBpbnRlZ2VycykgaXMgYGRpZ2l0YCwgd2hpY2ggbmVlZHMgdG8gYmUgaW4gdGhlIHJhbmdlXG5cdCAqIGAwYCB0byBgYmFzZSAtIDFgLiBJZiBgZmxhZ2AgaXMgbm9uLXplcm8sIHRoZSB1cHBlcmNhc2UgZm9ybSBpc1xuXHQgKiB1c2VkOyBlbHNlLCB0aGUgbG93ZXJjYXNlIGZvcm0gaXMgdXNlZC4gVGhlIGJlaGF2aW9yIGlzIHVuZGVmaW5lZFxuXHQgKiBpZiBgZmxhZ2AgaXMgbm9uLXplcm8gYW5kIGBkaWdpdGAgaGFzIG5vIHVwcGVyY2FzZSBmb3JtLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGlnaXRUb0Jhc2ljKGRpZ2l0LCBmbGFnKSB7XG5cdFx0Ly8gIDAuLjI1IG1hcCB0byBBU0NJSSBhLi56IG9yIEEuLlpcblx0XHQvLyAyNi4uMzUgbWFwIHRvIEFTQ0lJIDAuLjlcblx0XHRyZXR1cm4gZGlnaXQgKyAyMiArIDc1ICogKGRpZ2l0IDwgMjYpIC0gKChmbGFnICE9IDApIDw8IDUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEJpYXMgYWRhcHRhdGlvbiBmdW5jdGlvbiBhcyBwZXIgc2VjdGlvbiAzLjQgb2YgUkZDIDM0OTIuXG5cdCAqIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM0OTIjc2VjdGlvbi0zLjRcblx0ICogQHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGFkYXB0KGRlbHRhLCBudW1Qb2ludHMsIGZpcnN0VGltZSkge1xuXHRcdHZhciBrID0gMDtcblx0XHRkZWx0YSA9IGZpcnN0VGltZSA/IGZsb29yKGRlbHRhIC8gZGFtcCkgOiBkZWx0YSA+PiAxO1xuXHRcdGRlbHRhICs9IGZsb29yKGRlbHRhIC8gbnVtUG9pbnRzKTtcblx0XHRmb3IgKC8qIG5vIGluaXRpYWxpemF0aW9uICovOyBkZWx0YSA+IGJhc2VNaW51c1RNaW4gKiB0TWF4ID4+IDE7IGsgKz0gYmFzZSkge1xuXHRcdFx0ZGVsdGEgPSBmbG9vcihkZWx0YSAvIGJhc2VNaW51c1RNaW4pO1xuXHRcdH1cblx0XHRyZXR1cm4gZmxvb3IoayArIChiYXNlTWludXNUTWluICsgMSkgKiBkZWx0YSAvIChkZWx0YSArIHNrZXcpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMgdG8gYSBzdHJpbmcgb2YgVW5pY29kZVxuXHQgKiBzeW1ib2xzLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgcmVzdWx0aW5nIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG5cdCAqL1xuXHRmdW5jdGlvbiBkZWNvZGUoaW5wdXQpIHtcblx0XHQvLyBEb24ndCB1c2UgVUNTLTJcblx0XHR2YXIgb3V0cHV0ID0gW10sXG5cdFx0ICAgIGlucHV0TGVuZ3RoID0gaW5wdXQubGVuZ3RoLFxuXHRcdCAgICBvdXQsXG5cdFx0ICAgIGkgPSAwLFxuXHRcdCAgICBuID0gaW5pdGlhbE4sXG5cdFx0ICAgIGJpYXMgPSBpbml0aWFsQmlhcyxcblx0XHQgICAgYmFzaWMsXG5cdFx0ICAgIGosXG5cdFx0ICAgIGluZGV4LFxuXHRcdCAgICBvbGRpLFxuXHRcdCAgICB3LFxuXHRcdCAgICBrLFxuXHRcdCAgICBkaWdpdCxcblx0XHQgICAgdCxcblx0XHQgICAgLyoqIENhY2hlZCBjYWxjdWxhdGlvbiByZXN1bHRzICovXG5cdFx0ICAgIGJhc2VNaW51c1Q7XG5cblx0XHQvLyBIYW5kbGUgdGhlIGJhc2ljIGNvZGUgcG9pbnRzOiBsZXQgYGJhc2ljYCBiZSB0aGUgbnVtYmVyIG9mIGlucHV0IGNvZGVcblx0XHQvLyBwb2ludHMgYmVmb3JlIHRoZSBsYXN0IGRlbGltaXRlciwgb3IgYDBgIGlmIHRoZXJlIGlzIG5vbmUsIHRoZW4gY29weVxuXHRcdC8vIHRoZSBmaXJzdCBiYXNpYyBjb2RlIHBvaW50cyB0byB0aGUgb3V0cHV0LlxuXG5cdFx0YmFzaWMgPSBpbnB1dC5sYXN0SW5kZXhPZihkZWxpbWl0ZXIpO1xuXHRcdGlmIChiYXNpYyA8IDApIHtcblx0XHRcdGJhc2ljID0gMDtcblx0XHR9XG5cblx0XHRmb3IgKGogPSAwOyBqIDwgYmFzaWM7ICsraikge1xuXHRcdFx0Ly8gaWYgaXQncyBub3QgYSBiYXNpYyBjb2RlIHBvaW50XG5cdFx0XHRpZiAoaW5wdXQuY2hhckNvZGVBdChqKSA+PSAweDgwKSB7XG5cdFx0XHRcdGVycm9yKCdub3QtYmFzaWMnKTtcblx0XHRcdH1cblx0XHRcdG91dHB1dC5wdXNoKGlucHV0LmNoYXJDb2RlQXQoaikpO1xuXHRcdH1cblxuXHRcdC8vIE1haW4gZGVjb2RpbmcgbG9vcDogc3RhcnQganVzdCBhZnRlciB0aGUgbGFzdCBkZWxpbWl0ZXIgaWYgYW55IGJhc2ljIGNvZGVcblx0XHQvLyBwb2ludHMgd2VyZSBjb3BpZWQ7IHN0YXJ0IGF0IHRoZSBiZWdpbm5pbmcgb3RoZXJ3aXNlLlxuXG5cdFx0Zm9yIChpbmRleCA9IGJhc2ljID4gMCA/IGJhc2ljICsgMSA6IDA7IGluZGV4IDwgaW5wdXRMZW5ndGg7IC8qIG5vIGZpbmFsIGV4cHJlc3Npb24gKi8pIHtcblxuXHRcdFx0Ly8gYGluZGV4YCBpcyB0aGUgaW5kZXggb2YgdGhlIG5leHQgY2hhcmFjdGVyIHRvIGJlIGNvbnN1bWVkLlxuXHRcdFx0Ly8gRGVjb2RlIGEgZ2VuZXJhbGl6ZWQgdmFyaWFibGUtbGVuZ3RoIGludGVnZXIgaW50byBgZGVsdGFgLFxuXHRcdFx0Ly8gd2hpY2ggZ2V0cyBhZGRlZCB0byBgaWAuIFRoZSBvdmVyZmxvdyBjaGVja2luZyBpcyBlYXNpZXJcblx0XHRcdC8vIGlmIHdlIGluY3JlYXNlIGBpYCBhcyB3ZSBnbywgdGhlbiBzdWJ0cmFjdCBvZmYgaXRzIHN0YXJ0aW5nXG5cdFx0XHQvLyB2YWx1ZSBhdCB0aGUgZW5kIHRvIG9idGFpbiBgZGVsdGFgLlxuXHRcdFx0Zm9yIChvbGRpID0gaSwgdyA9IDEsIGsgPSBiYXNlOyAvKiBubyBjb25kaXRpb24gKi87IGsgKz0gYmFzZSkge1xuXG5cdFx0XHRcdGlmIChpbmRleCA+PSBpbnB1dExlbmd0aCkge1xuXHRcdFx0XHRcdGVycm9yKCdpbnZhbGlkLWlucHV0Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRkaWdpdCA9IGJhc2ljVG9EaWdpdChpbnB1dC5jaGFyQ29kZUF0KGluZGV4KyspKTtcblxuXHRcdFx0XHRpZiAoZGlnaXQgPj0gYmFzZSB8fCBkaWdpdCA+IGZsb29yKChtYXhJbnQgLSBpKSAvIHcpKSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpICs9IGRpZ2l0ICogdztcblx0XHRcdFx0dCA9IGsgPD0gYmlhcyA/IHRNaW4gOiAoayA+PSBiaWFzICsgdE1heCA/IHRNYXggOiBrIC0gYmlhcyk7XG5cblx0XHRcdFx0aWYgKGRpZ2l0IDwgdCkge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YmFzZU1pbnVzVCA9IGJhc2UgLSB0O1xuXHRcdFx0XHRpZiAodyA+IGZsb29yKG1heEludCAvIGJhc2VNaW51c1QpKSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR3ICo9IGJhc2VNaW51c1Q7XG5cblx0XHRcdH1cblxuXHRcdFx0b3V0ID0gb3V0cHV0Lmxlbmd0aCArIDE7XG5cdFx0XHRiaWFzID0gYWRhcHQoaSAtIG9sZGksIG91dCwgb2xkaSA9PSAwKTtcblxuXHRcdFx0Ly8gYGlgIHdhcyBzdXBwb3NlZCB0byB3cmFwIGFyb3VuZCBmcm9tIGBvdXRgIHRvIGAwYCxcblx0XHRcdC8vIGluY3JlbWVudGluZyBgbmAgZWFjaCB0aW1lLCBzbyB3ZSdsbCBmaXggdGhhdCBub3c6XG5cdFx0XHRpZiAoZmxvb3IoaSAvIG91dCkgPiBtYXhJbnQgLSBuKSB7XG5cdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0fVxuXG5cdFx0XHRuICs9IGZsb29yKGkgLyBvdXQpO1xuXHRcdFx0aSAlPSBvdXQ7XG5cblx0XHRcdC8vIEluc2VydCBgbmAgYXQgcG9zaXRpb24gYGlgIG9mIHRoZSBvdXRwdXRcblx0XHRcdG91dHB1dC5zcGxpY2UoaSsrLCAwLCBuKTtcblxuXHRcdH1cblxuXHRcdHJldHVybiB1Y3MyZW5jb2RlKG91dHB1dCk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzIHRvIGEgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHlcblx0ICogc3ltYm9scy5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIHJlc3VsdGluZyBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZW5jb2RlKGlucHV0KSB7XG5cdFx0dmFyIG4sXG5cdFx0ICAgIGRlbHRhLFxuXHRcdCAgICBoYW5kbGVkQ1BDb3VudCxcblx0XHQgICAgYmFzaWNMZW5ndGgsXG5cdFx0ICAgIGJpYXMsXG5cdFx0ICAgIGosXG5cdFx0ICAgIG0sXG5cdFx0ICAgIHEsXG5cdFx0ICAgIGssXG5cdFx0ICAgIHQsXG5cdFx0ICAgIGN1cnJlbnRWYWx1ZSxcblx0XHQgICAgb3V0cHV0ID0gW10sXG5cdFx0ICAgIC8qKiBgaW5wdXRMZW5ndGhgIHdpbGwgaG9sZCB0aGUgbnVtYmVyIG9mIGNvZGUgcG9pbnRzIGluIGBpbnB1dGAuICovXG5cdFx0ICAgIGlucHV0TGVuZ3RoLFxuXHRcdCAgICAvKiogQ2FjaGVkIGNhbGN1bGF0aW9uIHJlc3VsdHMgKi9cblx0XHQgICAgaGFuZGxlZENQQ291bnRQbHVzT25lLFxuXHRcdCAgICBiYXNlTWludXNULFxuXHRcdCAgICBxTWludXNUO1xuXG5cdFx0Ly8gQ29udmVydCB0aGUgaW5wdXQgaW4gVUNTLTIgdG8gVW5pY29kZVxuXHRcdGlucHV0ID0gdWNzMmRlY29kZShpbnB1dCk7XG5cblx0XHQvLyBDYWNoZSB0aGUgbGVuZ3RoXG5cdFx0aW5wdXRMZW5ndGggPSBpbnB1dC5sZW5ndGg7XG5cblx0XHQvLyBJbml0aWFsaXplIHRoZSBzdGF0ZVxuXHRcdG4gPSBpbml0aWFsTjtcblx0XHRkZWx0YSA9IDA7XG5cdFx0YmlhcyA9IGluaXRpYWxCaWFzO1xuXG5cdFx0Ly8gSGFuZGxlIHRoZSBiYXNpYyBjb2RlIHBvaW50c1xuXHRcdGZvciAoaiA9IDA7IGogPCBpbnB1dExlbmd0aDsgKytqKSB7XG5cdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblx0XHRcdGlmIChjdXJyZW50VmFsdWUgPCAweDgwKSB7XG5cdFx0XHRcdG91dHB1dC5wdXNoKHN0cmluZ0Zyb21DaGFyQ29kZShjdXJyZW50VmFsdWUpKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRoYW5kbGVkQ1BDb3VudCA9IGJhc2ljTGVuZ3RoID0gb3V0cHV0Lmxlbmd0aDtcblxuXHRcdC8vIGBoYW5kbGVkQ1BDb3VudGAgaXMgdGhlIG51bWJlciBvZiBjb2RlIHBvaW50cyB0aGF0IGhhdmUgYmVlbiBoYW5kbGVkO1xuXHRcdC8vIGBiYXNpY0xlbmd0aGAgaXMgdGhlIG51bWJlciBvZiBiYXNpYyBjb2RlIHBvaW50cy5cblxuXHRcdC8vIEZpbmlzaCB0aGUgYmFzaWMgc3RyaW5nIC0gaWYgaXQgaXMgbm90IGVtcHR5IC0gd2l0aCBhIGRlbGltaXRlclxuXHRcdGlmIChiYXNpY0xlbmd0aCkge1xuXHRcdFx0b3V0cHV0LnB1c2goZGVsaW1pdGVyKTtcblx0XHR9XG5cblx0XHQvLyBNYWluIGVuY29kaW5nIGxvb3A6XG5cdFx0d2hpbGUgKGhhbmRsZWRDUENvdW50IDwgaW5wdXRMZW5ndGgpIHtcblxuXHRcdFx0Ly8gQWxsIG5vbi1iYXNpYyBjb2RlIHBvaW50cyA8IG4gaGF2ZSBiZWVuIGhhbmRsZWQgYWxyZWFkeS4gRmluZCB0aGUgbmV4dFxuXHRcdFx0Ly8gbGFyZ2VyIG9uZTpcblx0XHRcdGZvciAobSA9IG1heEludCwgaiA9IDA7IGogPCBpbnB1dExlbmd0aDsgKytqKSB7XG5cdFx0XHRcdGN1cnJlbnRWYWx1ZSA9IGlucHV0W2pdO1xuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlID49IG4gJiYgY3VycmVudFZhbHVlIDwgbSkge1xuXHRcdFx0XHRcdG0gPSBjdXJyZW50VmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gSW5jcmVhc2UgYGRlbHRhYCBlbm91Z2ggdG8gYWR2YW5jZSB0aGUgZGVjb2RlcidzIDxuLGk+IHN0YXRlIHRvIDxtLDA+LFxuXHRcdFx0Ly8gYnV0IGd1YXJkIGFnYWluc3Qgb3ZlcmZsb3dcblx0XHRcdGhhbmRsZWRDUENvdW50UGx1c09uZSA9IGhhbmRsZWRDUENvdW50ICsgMTtcblx0XHRcdGlmIChtIC0gbiA+IGZsb29yKChtYXhJbnQgLSBkZWx0YSkgLyBoYW5kbGVkQ1BDb3VudFBsdXNPbmUpKSB7XG5cdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0fVxuXG5cdFx0XHRkZWx0YSArPSAobSAtIG4pICogaGFuZGxlZENQQ291bnRQbHVzT25lO1xuXHRcdFx0biA9IG07XG5cblx0XHRcdGZvciAoaiA9IDA7IGogPCBpbnB1dExlbmd0aDsgKytqKSB7XG5cdFx0XHRcdGN1cnJlbnRWYWx1ZSA9IGlucHV0W2pdO1xuXG5cdFx0XHRcdGlmIChjdXJyZW50VmFsdWUgPCBuICYmICsrZGVsdGEgPiBtYXhJbnQpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChjdXJyZW50VmFsdWUgPT0gbikge1xuXHRcdFx0XHRcdC8vIFJlcHJlc2VudCBkZWx0YSBhcyBhIGdlbmVyYWxpemVkIHZhcmlhYmxlLWxlbmd0aCBpbnRlZ2VyXG5cdFx0XHRcdFx0Zm9yIChxID0gZGVsdGEsIGsgPSBiYXNlOyAvKiBubyBjb25kaXRpb24gKi87IGsgKz0gYmFzZSkge1xuXHRcdFx0XHRcdFx0dCA9IGsgPD0gYmlhcyA/IHRNaW4gOiAoayA+PSBiaWFzICsgdE1heCA/IHRNYXggOiBrIC0gYmlhcyk7XG5cdFx0XHRcdFx0XHRpZiAocSA8IHQpIHtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRxTWludXNUID0gcSAtIHQ7XG5cdFx0XHRcdFx0XHRiYXNlTWludXNUID0gYmFzZSAtIHQ7XG5cdFx0XHRcdFx0XHRvdXRwdXQucHVzaChcblx0XHRcdFx0XHRcdFx0c3RyaW5nRnJvbUNoYXJDb2RlKGRpZ2l0VG9CYXNpYyh0ICsgcU1pbnVzVCAlIGJhc2VNaW51c1QsIDApKVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdHEgPSBmbG9vcihxTWludXNUIC8gYmFzZU1pbnVzVCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0b3V0cHV0LnB1c2goc3RyaW5nRnJvbUNoYXJDb2RlKGRpZ2l0VG9CYXNpYyhxLCAwKSkpO1xuXHRcdFx0XHRcdGJpYXMgPSBhZGFwdChkZWx0YSwgaGFuZGxlZENQQ291bnRQbHVzT25lLCBoYW5kbGVkQ1BDb3VudCA9PSBiYXNpY0xlbmd0aCk7XG5cdFx0XHRcdFx0ZGVsdGEgPSAwO1xuXHRcdFx0XHRcdCsraGFuZGxlZENQQ291bnQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0KytkZWx0YTtcblx0XHRcdCsrbjtcblxuXHRcdH1cblx0XHRyZXR1cm4gb3V0cHV0LmpvaW4oJycpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgUHVueWNvZGUgc3RyaW5nIHJlcHJlc2VudGluZyBhIGRvbWFpbiBuYW1lIHRvIFVuaWNvZGUuIE9ubHkgdGhlXG5cdCAqIFB1bnljb2RlZCBwYXJ0cyBvZiB0aGUgZG9tYWluIG5hbWUgd2lsbCBiZSBjb252ZXJ0ZWQsIGkuZS4gaXQgZG9lc24ndFxuXHQgKiBtYXR0ZXIgaWYgeW91IGNhbGwgaXQgb24gYSBzdHJpbmcgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGNvbnZlcnRlZCB0b1xuXHQgKiBVbmljb2RlLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGRvbWFpbiBUaGUgUHVueWNvZGUgZG9tYWluIG5hbWUgdG8gY29udmVydCB0byBVbmljb2RlLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgVW5pY29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gUHVueWNvZGVcblx0ICogc3RyaW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9Vbmljb2RlKGRvbWFpbikge1xuXHRcdHJldHVybiBtYXBEb21haW4oZG9tYWluLCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdHJldHVybiByZWdleFB1bnljb2RlLnRlc3Qoc3RyaW5nKVxuXHRcdFx0XHQ/IGRlY29kZShzdHJpbmcuc2xpY2UoNCkudG9Mb3dlckNhc2UoKSlcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBVbmljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSB0byBQdW55Y29kZS4gT25seSB0aGVcblx0ICogbm9uLUFTQ0lJIHBhcnRzIG9mIHRoZSBkb21haW4gbmFtZSB3aWxsIGJlIGNvbnZlcnRlZCwgaS5lLiBpdCBkb2Vzbid0XG5cdCAqIG1hdHRlciBpZiB5b3UgY2FsbCBpdCB3aXRoIGEgZG9tYWluIHRoYXQncyBhbHJlYWR5IGluIEFTQ0lJLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGRvbWFpbiBUaGUgZG9tYWluIG5hbWUgdG8gY29udmVydCwgYXMgYSBVbmljb2RlIHN0cmluZy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIFB1bnljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBkb21haW4gbmFtZS5cblx0ICovXG5cdGZ1bmN0aW9uIHRvQVNDSUkoZG9tYWluKSB7XG5cdFx0cmV0dXJuIG1hcERvbWFpbihkb21haW4sIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdFx0cmV0dXJuIHJlZ2V4Tm9uQVNDSUkudGVzdChzdHJpbmcpXG5cdFx0XHRcdD8gJ3huLS0nICsgZW5jb2RlKHN0cmluZylcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKiogRGVmaW5lIHRoZSBwdWJsaWMgQVBJICovXG5cdHB1bnljb2RlID0ge1xuXHRcdC8qKlxuXHRcdCAqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBQdW55Y29kZS5qcyB2ZXJzaW9uIG51bWJlci5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBTdHJpbmdcblx0XHQgKi9cblx0XHQndmVyc2lvbic6ICcxLjIuNCcsXG5cdFx0LyoqXG5cdFx0ICogQW4gb2JqZWN0IG9mIG1ldGhvZHMgdG8gY29udmVydCBmcm9tIEphdmFTY3JpcHQncyBpbnRlcm5hbCBjaGFyYWN0ZXJcblx0XHQgKiByZXByZXNlbnRhdGlvbiAoVUNTLTIpIHRvIFVuaWNvZGUgY29kZSBwb2ludHMsIGFuZCBiYWNrLlxuXHRcdCAqIEBzZWUgPGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG5cdFx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdFx0ICogQHR5cGUgT2JqZWN0XG5cdFx0ICovXG5cdFx0J3VjczInOiB7XG5cdFx0XHQnZGVjb2RlJzogdWNzMmRlY29kZSxcblx0XHRcdCdlbmNvZGUnOiB1Y3MyZW5jb2RlXG5cdFx0fSxcblx0XHQnZGVjb2RlJzogZGVjb2RlLFxuXHRcdCdlbmNvZGUnOiBlbmNvZGUsXG5cdFx0J3RvQVNDSUknOiB0b0FTQ0lJLFxuXHRcdCd0b1VuaWNvZGUnOiB0b1VuaWNvZGVcblx0fTtcblxuXHQvKiogRXhwb3NlIGBwdW55Y29kZWAgKi9cblx0Ly8gU29tZSBBTUQgYnVpbGQgb3B0aW1pemVycywgbGlrZSByLmpzLCBjaGVjayBmb3Igc3BlY2lmaWMgY29uZGl0aW9uIHBhdHRlcm5zXG5cdC8vIGxpa2UgdGhlIGZvbGxvd2luZzpcblx0aWYgKFxuXHRcdHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJlxuXHRcdHR5cGVvZiBkZWZpbmUuYW1kID09ICdvYmplY3QnICYmXG5cdFx0ZGVmaW5lLmFtZFxuXHQpIHtcblx0XHRkZWZpbmUoJ3B1bnljb2RlJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gcHVueWNvZGU7XG5cdFx0fSk7XG5cdH0gZWxzZSBpZiAoZnJlZUV4cG9ydHMgJiYgIWZyZWVFeHBvcnRzLm5vZGVUeXBlKSB7XG5cdFx0aWYgKGZyZWVNb2R1bGUpIHsgLy8gaW4gTm9kZS5qcyBvciBSaW5nb0pTIHYwLjguMCtcblx0XHRcdGZyZWVNb2R1bGUuZXhwb3J0cyA9IHB1bnljb2RlO1xuXHRcdH0gZWxzZSB7IC8vIGluIE5hcndoYWwgb3IgUmluZ29KUyB2MC43LjAtXG5cdFx0XHRmb3IgKGtleSBpbiBwdW55Y29kZSkge1xuXHRcdFx0XHRwdW55Y29kZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIChmcmVlRXhwb3J0c1trZXldID0gcHVueWNvZGVba2V5XSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgeyAvLyBpbiBSaGlubyBvciBhIHdlYiBicm93c2VyXG5cdFx0cm9vdC5wdW55Y29kZSA9IHB1bnljb2RlO1xuXHR9XG5cbn0odGhpcykpO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBJZiBvYmouaGFzT3duUHJvcGVydHkgaGFzIGJlZW4gb3ZlcnJpZGRlbiwgdGhlbiBjYWxsaW5nXG4vLyBvYmouaGFzT3duUHJvcGVydHkocHJvcCkgd2lsbCBicmVhay5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2pveWVudC9ub2RlL2lzc3Vlcy8xNzA3XG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHFzLCBzZXAsIGVxLCBvcHRpb25zKSB7XG4gIHNlcCA9IHNlcCB8fCAnJic7XG4gIGVxID0gZXEgfHwgJz0nO1xuICB2YXIgb2JqID0ge307XG5cbiAgaWYgKHR5cGVvZiBxcyAhPT0gJ3N0cmluZycgfHwgcXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHZhciByZWdleHAgPSAvXFwrL2c7XG4gIHFzID0gcXMuc3BsaXQoc2VwKTtcblxuICB2YXIgbWF4S2V5cyA9IDEwMDA7XG4gIGlmIChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zLm1heEtleXMgPT09ICdudW1iZXInKSB7XG4gICAgbWF4S2V5cyA9IG9wdGlvbnMubWF4S2V5cztcbiAgfVxuXG4gIHZhciBsZW4gPSBxcy5sZW5ndGg7XG4gIC8vIG1heEtleXMgPD0gMCBtZWFucyB0aGF0IHdlIHNob3VsZCBub3QgbGltaXQga2V5cyBjb3VudFxuICBpZiAobWF4S2V5cyA+IDAgJiYgbGVuID4gbWF4S2V5cykge1xuICAgIGxlbiA9IG1heEtleXM7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdmFyIHggPSBxc1tpXS5yZXBsYWNlKHJlZ2V4cCwgJyUyMCcpLFxuICAgICAgICBpZHggPSB4LmluZGV4T2YoZXEpLFxuICAgICAgICBrc3RyLCB2c3RyLCBrLCB2O1xuXG4gICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICBrc3RyID0geC5zdWJzdHIoMCwgaWR4KTtcbiAgICAgIHZzdHIgPSB4LnN1YnN0cihpZHggKyAxKTtcbiAgICB9IGVsc2Uge1xuICAgICAga3N0ciA9IHg7XG4gICAgICB2c3RyID0gJyc7XG4gICAgfVxuXG4gICAgayA9IGRlY29kZVVSSUNvbXBvbmVudChrc3RyKTtcbiAgICB2ID0gZGVjb2RlVVJJQ29tcG9uZW50KHZzdHIpO1xuXG4gICAgaWYgKCFoYXNPd25Qcm9wZXJ0eShvYmosIGspKSB7XG4gICAgICBvYmpba10gPSB2O1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShvYmpba10pKSB7XG4gICAgICBvYmpba10ucHVzaCh2KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqW2tdID0gW29ialtrXSwgdl07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoeHMpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHN0cmluZ2lmeVByaW1pdGl2ZSA9IGZ1bmN0aW9uKHYpIHtcbiAgc3dpdGNoICh0eXBlb2Ygdikge1xuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gdjtcblxuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgcmV0dXJuIHYgPyAndHJ1ZScgOiAnZmFsc2UnO1xuXG4gICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgIHJldHVybiBpc0Zpbml0ZSh2KSA/IHYgOiAnJztcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJyc7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob2JqLCBzZXAsIGVxLCBuYW1lKSB7XG4gIHNlcCA9IHNlcCB8fCAnJic7XG4gIGVxID0gZXEgfHwgJz0nO1xuICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgb2JqID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG1hcChvYmplY3RLZXlzKG9iaiksIGZ1bmN0aW9uKGspIHtcbiAgICAgIHZhciBrcyA9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUoaykpICsgZXE7XG4gICAgICBpZiAoaXNBcnJheShvYmpba10pKSB7XG4gICAgICAgIHJldHVybiBtYXAob2JqW2tdLCBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZSh2KSk7XG4gICAgICAgIH0pLmpvaW4oc2VwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBrcyArIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUob2JqW2tdKSk7XG4gICAgICB9XG4gICAgfSkuam9pbihzZXApO1xuXG4gIH1cblxuICBpZiAoIW5hbWUpIHJldHVybiAnJztcbiAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUobmFtZSkpICsgZXEgK1xuICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmopKTtcbn07XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoeHMpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4cykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG5mdW5jdGlvbiBtYXAgKHhzLCBmKSB7XG4gIGlmICh4cy5tYXApIHJldHVybiB4cy5tYXAoZik7XG4gIHZhciByZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgIHJlcy5wdXNoKGYoeHNbaV0sIGkpKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHJlcy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuZGVjb2RlID0gZXhwb3J0cy5wYXJzZSA9IHJlcXVpcmUoJy4vZGVjb2RlJyk7XG5leHBvcnRzLmVuY29kZSA9IGV4cG9ydHMuc3RyaW5naWZ5ID0gcmVxdWlyZSgnLi9lbmNvZGUnKTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgcHVueWNvZGUgPSByZXF1aXJlKCdwdW55Y29kZScpO1xuXG5leHBvcnRzLnBhcnNlID0gdXJsUGFyc2U7XG5leHBvcnRzLnJlc29sdmUgPSB1cmxSZXNvbHZlO1xuZXhwb3J0cy5yZXNvbHZlT2JqZWN0ID0gdXJsUmVzb2x2ZU9iamVjdDtcbmV4cG9ydHMuZm9ybWF0ID0gdXJsRm9ybWF0O1xuXG5leHBvcnRzLlVybCA9IFVybDtcblxuZnVuY3Rpb24gVXJsKCkge1xuICB0aGlzLnByb3RvY29sID0gbnVsbDtcbiAgdGhpcy5zbGFzaGVzID0gbnVsbDtcbiAgdGhpcy5hdXRoID0gbnVsbDtcbiAgdGhpcy5ob3N0ID0gbnVsbDtcbiAgdGhpcy5wb3J0ID0gbnVsbDtcbiAgdGhpcy5ob3N0bmFtZSA9IG51bGw7XG4gIHRoaXMuaGFzaCA9IG51bGw7XG4gIHRoaXMuc2VhcmNoID0gbnVsbDtcbiAgdGhpcy5xdWVyeSA9IG51bGw7XG4gIHRoaXMucGF0aG5hbWUgPSBudWxsO1xuICB0aGlzLnBhdGggPSBudWxsO1xuICB0aGlzLmhyZWYgPSBudWxsO1xufVxuXG4vLyBSZWZlcmVuY2U6IFJGQyAzOTg2LCBSRkMgMTgwOCwgUkZDIDIzOTZcblxuLy8gZGVmaW5lIHRoZXNlIGhlcmUgc28gYXQgbGVhc3QgdGhleSBvbmx5IGhhdmUgdG8gYmVcbi8vIGNvbXBpbGVkIG9uY2Ugb24gdGhlIGZpcnN0IG1vZHVsZSBsb2FkLlxudmFyIHByb3RvY29sUGF0dGVybiA9IC9eKFthLXowLTkuKy1dKzopL2ksXG4gICAgcG9ydFBhdHRlcm4gPSAvOlswLTldKiQvLFxuXG4gICAgLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgcmVzZXJ2ZWQgZm9yIGRlbGltaXRpbmcgVVJMcy5cbiAgICAvLyBXZSBhY3R1YWxseSBqdXN0IGF1dG8tZXNjYXBlIHRoZXNlLlxuICAgIGRlbGltcyA9IFsnPCcsICc+JywgJ1wiJywgJ2AnLCAnICcsICdcXHInLCAnXFxuJywgJ1xcdCddLFxuXG4gICAgLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgbm90IGFsbG93ZWQgZm9yIHZhcmlvdXMgcmVhc29ucy5cbiAgICB1bndpc2UgPSBbJ3snLCAnfScsICd8JywgJ1xcXFwnLCAnXicsICdgJ10uY29uY2F0KGRlbGltcyksXG5cbiAgICAvLyBBbGxvd2VkIGJ5IFJGQ3MsIGJ1dCBjYXVzZSBvZiBYU1MgYXR0YWNrcy4gIEFsd2F5cyBlc2NhcGUgdGhlc2UuXG4gICAgYXV0b0VzY2FwZSA9IFsnXFwnJ10uY29uY2F0KHVud2lzZSksXG4gICAgLy8gQ2hhcmFjdGVycyB0aGF0IGFyZSBuZXZlciBldmVyIGFsbG93ZWQgaW4gYSBob3N0bmFtZS5cbiAgICAvLyBOb3RlIHRoYXQgYW55IGludmFsaWQgY2hhcnMgYXJlIGFsc28gaGFuZGxlZCwgYnV0IHRoZXNlXG4gICAgLy8gYXJlIHRoZSBvbmVzIHRoYXQgYXJlICpleHBlY3RlZCogdG8gYmUgc2Vlbiwgc28gd2UgZmFzdC1wYXRoXG4gICAgLy8gdGhlbS5cbiAgICBub25Ib3N0Q2hhcnMgPSBbJyUnLCAnLycsICc/JywgJzsnLCAnIyddLmNvbmNhdChhdXRvRXNjYXBlKSxcbiAgICBob3N0RW5kaW5nQ2hhcnMgPSBbJy8nLCAnPycsICcjJ10sXG4gICAgaG9zdG5hbWVNYXhMZW4gPSAyNTUsXG4gICAgaG9zdG5hbWVQYXJ0UGF0dGVybiA9IC9eW2EtejAtOUEtWl8tXXswLDYzfSQvLFxuICAgIGhvc3RuYW1lUGFydFN0YXJ0ID0gL14oW2EtejAtOUEtWl8tXXswLDYzfSkoLiopJC8sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgY2FuIGFsbG93IFwidW5zYWZlXCIgYW5kIFwidW53aXNlXCIgY2hhcnMuXG4gICAgdW5zYWZlUHJvdG9jb2wgPSB7XG4gICAgICAnamF2YXNjcmlwdCc6IHRydWUsXG4gICAgICAnamF2YXNjcmlwdDonOiB0cnVlXG4gICAgfSxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBuZXZlciBoYXZlIGEgaG9zdG5hbWUuXG4gICAgaG9zdGxlc3NQcm90b2NvbCA9IHtcbiAgICAgICdqYXZhc2NyaXB0JzogdHJ1ZSxcbiAgICAgICdqYXZhc2NyaXB0Oic6IHRydWVcbiAgICB9LFxuICAgIC8vIHByb3RvY29scyB0aGF0IGFsd2F5cyBjb250YWluIGEgLy8gYml0LlxuICAgIHNsYXNoZWRQcm90b2NvbCA9IHtcbiAgICAgICdodHRwJzogdHJ1ZSxcbiAgICAgICdodHRwcyc6IHRydWUsXG4gICAgICAnZnRwJzogdHJ1ZSxcbiAgICAgICdnb3BoZXInOiB0cnVlLFxuICAgICAgJ2ZpbGUnOiB0cnVlLFxuICAgICAgJ2h0dHA6JzogdHJ1ZSxcbiAgICAgICdodHRwczonOiB0cnVlLFxuICAgICAgJ2Z0cDonOiB0cnVlLFxuICAgICAgJ2dvcGhlcjonOiB0cnVlLFxuICAgICAgJ2ZpbGU6JzogdHJ1ZVxuICAgIH0sXG4gICAgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xuXG5mdW5jdGlvbiB1cmxQYXJzZSh1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGlmICh1cmwgJiYgaXNPYmplY3QodXJsKSAmJiB1cmwgaW5zdGFuY2VvZiBVcmwpIHJldHVybiB1cmw7XG5cbiAgdmFyIHUgPSBuZXcgVXJsO1xuICB1LnBhcnNlKHVybCwgcGFyc2VRdWVyeVN0cmluZywgc2xhc2hlc0Rlbm90ZUhvc3QpO1xuICByZXR1cm4gdTtcbn1cblxuVXJsLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHVybCwgcGFyc2VRdWVyeVN0cmluZywgc2xhc2hlc0Rlbm90ZUhvc3QpIHtcbiAgaWYgKCFpc1N0cmluZyh1cmwpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlBhcmFtZXRlciAndXJsJyBtdXN0IGJlIGEgc3RyaW5nLCBub3QgXCIgKyB0eXBlb2YgdXJsKTtcbiAgfVxuXG4gIHZhciByZXN0ID0gdXJsO1xuXG4gIC8vIHRyaW0gYmVmb3JlIHByb2NlZWRpbmcuXG4gIC8vIFRoaXMgaXMgdG8gc3VwcG9ydCBwYXJzZSBzdHVmZiBsaWtlIFwiICBodHRwOi8vZm9vLmNvbSAgXFxuXCJcbiAgcmVzdCA9IHJlc3QudHJpbSgpO1xuXG4gIHZhciBwcm90byA9IHByb3RvY29sUGF0dGVybi5leGVjKHJlc3QpO1xuICBpZiAocHJvdG8pIHtcbiAgICBwcm90byA9IHByb3RvWzBdO1xuICAgIHZhciBsb3dlclByb3RvID0gcHJvdG8udG9Mb3dlckNhc2UoKTtcbiAgICB0aGlzLnByb3RvY29sID0gbG93ZXJQcm90bztcbiAgICByZXN0ID0gcmVzdC5zdWJzdHIocHJvdG8ubGVuZ3RoKTtcbiAgfVxuXG4gIC8vIGZpZ3VyZSBvdXQgaWYgaXQncyBnb3QgYSBob3N0XG4gIC8vIHVzZXJAc2VydmVyIGlzICphbHdheXMqIGludGVycHJldGVkIGFzIGEgaG9zdG5hbWUsIGFuZCB1cmxcbiAgLy8gcmVzb2x1dGlvbiB3aWxsIHRyZWF0IC8vZm9vL2JhciBhcyBob3N0PWZvbyxwYXRoPWJhciBiZWNhdXNlIHRoYXQnc1xuICAvLyBob3cgdGhlIGJyb3dzZXIgcmVzb2x2ZXMgcmVsYXRpdmUgVVJMcy5cbiAgaWYgKHNsYXNoZXNEZW5vdGVIb3N0IHx8IHByb3RvIHx8IHJlc3QubWF0Y2goL15cXC9cXC9bXkBcXC9dK0BbXkBcXC9dKy8pKSB7XG4gICAgdmFyIHNsYXNoZXMgPSByZXN0LnN1YnN0cigwLCAyKSA9PT0gJy8vJztcbiAgICBpZiAoc2xhc2hlcyAmJiAhKHByb3RvICYmIGhvc3RsZXNzUHJvdG9jb2xbcHJvdG9dKSkge1xuICAgICAgcmVzdCA9IHJlc3Quc3Vic3RyKDIpO1xuICAgICAgdGhpcy5zbGFzaGVzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWhvc3RsZXNzUHJvdG9jb2xbcHJvdG9dICYmXG4gICAgICAoc2xhc2hlcyB8fCAocHJvdG8gJiYgIXNsYXNoZWRQcm90b2NvbFtwcm90b10pKSkge1xuXG4gICAgLy8gdGhlcmUncyBhIGhvc3RuYW1lLlxuICAgIC8vIHRoZSBmaXJzdCBpbnN0YW5jZSBvZiAvLCA/LCA7LCBvciAjIGVuZHMgdGhlIGhvc3QuXG4gICAgLy9cbiAgICAvLyBJZiB0aGVyZSBpcyBhbiBAIGluIHRoZSBob3N0bmFtZSwgdGhlbiBub24taG9zdCBjaGFycyAqYXJlKiBhbGxvd2VkXG4gICAgLy8gdG8gdGhlIGxlZnQgb2YgdGhlIGxhc3QgQCBzaWduLCB1bmxlc3Mgc29tZSBob3N0LWVuZGluZyBjaGFyYWN0ZXJcbiAgICAvLyBjb21lcyAqYmVmb3JlKiB0aGUgQC1zaWduLlxuICAgIC8vIFVSTHMgYXJlIG9ibm94aW91cy5cbiAgICAvL1xuICAgIC8vIGV4OlxuICAgIC8vIGh0dHA6Ly9hQGJAYy8gPT4gdXNlcjphQGIgaG9zdDpjXG4gICAgLy8gaHR0cDovL2FAYj9AYyA9PiB1c2VyOmEgaG9zdDpjIHBhdGg6Lz9AY1xuXG4gICAgLy8gdjAuMTIgVE9ETyhpc2FhY3MpOiBUaGlzIGlzIG5vdCBxdWl0ZSBob3cgQ2hyb21lIGRvZXMgdGhpbmdzLlxuICAgIC8vIFJldmlldyBvdXIgdGVzdCBjYXNlIGFnYWluc3QgYnJvd3NlcnMgbW9yZSBjb21wcmVoZW5zaXZlbHkuXG5cbiAgICAvLyBmaW5kIHRoZSBmaXJzdCBpbnN0YW5jZSBvZiBhbnkgaG9zdEVuZGluZ0NoYXJzXG4gICAgdmFyIGhvc3RFbmQgPSAtMTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhvc3RFbmRpbmdDaGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGhlYyA9IHJlc3QuaW5kZXhPZihob3N0RW5kaW5nQ2hhcnNbaV0pO1xuICAgICAgaWYgKGhlYyAhPT0gLTEgJiYgKGhvc3RFbmQgPT09IC0xIHx8IGhlYyA8IGhvc3RFbmQpKVxuICAgICAgICBob3N0RW5kID0gaGVjO1xuICAgIH1cblxuICAgIC8vIGF0IHRoaXMgcG9pbnQsIGVpdGhlciB3ZSBoYXZlIGFuIGV4cGxpY2l0IHBvaW50IHdoZXJlIHRoZVxuICAgIC8vIGF1dGggcG9ydGlvbiBjYW5ub3QgZ28gcGFzdCwgb3IgdGhlIGxhc3QgQCBjaGFyIGlzIHRoZSBkZWNpZGVyLlxuICAgIHZhciBhdXRoLCBhdFNpZ247XG4gICAgaWYgKGhvc3RFbmQgPT09IC0xKSB7XG4gICAgICAvLyBhdFNpZ24gY2FuIGJlIGFueXdoZXJlLlxuICAgICAgYXRTaWduID0gcmVzdC5sYXN0SW5kZXhPZignQCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBhdFNpZ24gbXVzdCBiZSBpbiBhdXRoIHBvcnRpb24uXG4gICAgICAvLyBodHRwOi8vYUBiL2NAZCA9PiBob3N0OmIgYXV0aDphIHBhdGg6L2NAZFxuICAgICAgYXRTaWduID0gcmVzdC5sYXN0SW5kZXhPZignQCcsIGhvc3RFbmQpO1xuICAgIH1cblxuICAgIC8vIE5vdyB3ZSBoYXZlIGEgcG9ydGlvbiB3aGljaCBpcyBkZWZpbml0ZWx5IHRoZSBhdXRoLlxuICAgIC8vIFB1bGwgdGhhdCBvZmYuXG4gICAgaWYgKGF0U2lnbiAhPT0gLTEpIHtcbiAgICAgIGF1dGggPSByZXN0LnNsaWNlKDAsIGF0U2lnbik7XG4gICAgICByZXN0ID0gcmVzdC5zbGljZShhdFNpZ24gKyAxKTtcbiAgICAgIHRoaXMuYXV0aCA9IGRlY29kZVVSSUNvbXBvbmVudChhdXRoKTtcbiAgICB9XG5cbiAgICAvLyB0aGUgaG9zdCBpcyB0aGUgcmVtYWluaW5nIHRvIHRoZSBsZWZ0IG9mIHRoZSBmaXJzdCBub24taG9zdCBjaGFyXG4gICAgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9uSG9zdENoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaGVjID0gcmVzdC5pbmRleE9mKG5vbkhvc3RDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpXG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgfVxuICAgIC8vIGlmIHdlIHN0aWxsIGhhdmUgbm90IGhpdCBpdCwgdGhlbiB0aGUgZW50aXJlIHRoaW5nIGlzIGEgaG9zdC5cbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpXG4gICAgICBob3N0RW5kID0gcmVzdC5sZW5ndGg7XG5cbiAgICB0aGlzLmhvc3QgPSByZXN0LnNsaWNlKDAsIGhvc3RFbmQpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKGhvc3RFbmQpO1xuXG4gICAgLy8gcHVsbCBvdXQgcG9ydC5cbiAgICB0aGlzLnBhcnNlSG9zdCgpO1xuXG4gICAgLy8gd2UndmUgaW5kaWNhdGVkIHRoYXQgdGhlcmUgaXMgYSBob3N0bmFtZSxcbiAgICAvLyBzbyBldmVuIGlmIGl0J3MgZW1wdHksIGl0IGhhcyB0byBiZSBwcmVzZW50LlxuICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lIHx8ICcnO1xuXG4gICAgLy8gaWYgaG9zdG5hbWUgYmVnaW5zIHdpdGggWyBhbmQgZW5kcyB3aXRoIF1cbiAgICAvLyBhc3N1bWUgdGhhdCBpdCdzIGFuIElQdjYgYWRkcmVzcy5cbiAgICB2YXIgaXB2Nkhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZVswXSA9PT0gJ1snICYmXG4gICAgICAgIHRoaXMuaG9zdG5hbWVbdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAxXSA9PT0gJ10nO1xuXG4gICAgLy8gdmFsaWRhdGUgYSBsaXR0bGUuXG4gICAgaWYgKCFpcHY2SG9zdG5hbWUpIHtcbiAgICAgIHZhciBob3N0cGFydHMgPSB0aGlzLmhvc3RuYW1lLnNwbGl0KC9cXC4vKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gaG9zdHBhcnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIgcGFydCA9IGhvc3RwYXJ0c1tpXTtcbiAgICAgICAgaWYgKCFwYXJ0KSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFwYXJ0Lm1hdGNoKGhvc3RuYW1lUGFydFBhdHRlcm4pKSB7XG4gICAgICAgICAgdmFyIG5ld3BhcnQgPSAnJztcbiAgICAgICAgICBmb3IgKHZhciBqID0gMCwgayA9IHBhcnQubGVuZ3RoOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICBpZiAocGFydC5jaGFyQ29kZUF0KGopID4gMTI3KSB7XG4gICAgICAgICAgICAgIC8vIHdlIHJlcGxhY2Ugbm9uLUFTQ0lJIGNoYXIgd2l0aCBhIHRlbXBvcmFyeSBwbGFjZWhvbGRlclxuICAgICAgICAgICAgICAvLyB3ZSBuZWVkIHRoaXMgdG8gbWFrZSBzdXJlIHNpemUgb2YgaG9zdG5hbWUgaXMgbm90XG4gICAgICAgICAgICAgIC8vIGJyb2tlbiBieSByZXBsYWNpbmcgbm9uLUFTQ0lJIGJ5IG5vdGhpbmdcbiAgICAgICAgICAgICAgbmV3cGFydCArPSAneCc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9IHBhcnRbal07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHdlIHRlc3QgYWdhaW4gd2l0aCBBU0NJSSBjaGFyIG9ubHlcbiAgICAgICAgICBpZiAoIW5ld3BhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZFBhcnRzID0gaG9zdHBhcnRzLnNsaWNlKDAsIGkpO1xuICAgICAgICAgICAgdmFyIG5vdEhvc3QgPSBob3N0cGFydHMuc2xpY2UoaSArIDEpO1xuICAgICAgICAgICAgdmFyIGJpdCA9IHBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0U3RhcnQpO1xuICAgICAgICAgICAgaWYgKGJpdCkge1xuICAgICAgICAgICAgICB2YWxpZFBhcnRzLnB1c2goYml0WzFdKTtcbiAgICAgICAgICAgICAgbm90SG9zdC51bnNoaWZ0KGJpdFsyXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm90SG9zdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmVzdCA9ICcvJyArIG5vdEhvc3Quam9pbignLicpICsgcmVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaG9zdG5hbWUgPSB2YWxpZFBhcnRzLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmhvc3RuYW1lLmxlbmd0aCA+IGhvc3RuYW1lTWF4TGVuKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gJyc7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGhvc3RuYW1lcyBhcmUgYWx3YXlzIGxvd2VyIGNhc2UuXG4gICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIGlmICghaXB2Nkhvc3RuYW1lKSB7XG4gICAgICAvLyBJRE5BIFN1cHBvcnQ6IFJldHVybnMgYSBwdW55IGNvZGVkIHJlcHJlc2VudGF0aW9uIG9mIFwiZG9tYWluXCIuXG4gICAgICAvLyBJdCBvbmx5IGNvbnZlcnRzIHRoZSBwYXJ0IG9mIHRoZSBkb21haW4gbmFtZSB0aGF0XG4gICAgICAvLyBoYXMgbm9uIEFTQ0lJIGNoYXJhY3RlcnMuIEkuZS4gaXQgZG9zZW50IG1hdHRlciBpZlxuICAgICAgLy8geW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0IGFscmVhZHkgaXMgaW4gQVNDSUkuXG4gICAgICB2YXIgZG9tYWluQXJyYXkgPSB0aGlzLmhvc3RuYW1lLnNwbGl0KCcuJyk7XG4gICAgICB2YXIgbmV3T3V0ID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRvbWFpbkFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBzID0gZG9tYWluQXJyYXlbaV07XG4gICAgICAgIG5ld091dC5wdXNoKHMubWF0Y2goL1teQS1aYS16MC05Xy1dLykgP1xuICAgICAgICAgICAgJ3huLS0nICsgcHVueWNvZGUuZW5jb2RlKHMpIDogcyk7XG4gICAgICB9XG4gICAgICB0aGlzLmhvc3RuYW1lID0gbmV3T3V0LmpvaW4oJy4nKTtcbiAgICB9XG5cbiAgICB2YXIgcCA9IHRoaXMucG9ydCA/ICc6JyArIHRoaXMucG9ydCA6ICcnO1xuICAgIHZhciBoID0gdGhpcy5ob3N0bmFtZSB8fCAnJztcbiAgICB0aGlzLmhvc3QgPSBoICsgcDtcbiAgICB0aGlzLmhyZWYgKz0gdGhpcy5ob3N0O1xuXG4gICAgLy8gc3RyaXAgWyBhbmQgXSBmcm9tIHRoZSBob3N0bmFtZVxuICAgIC8vIHRoZSBob3N0IGZpZWxkIHN0aWxsIHJldGFpbnMgdGhlbSwgdGhvdWdoXG4gICAgaWYgKGlwdjZIb3N0bmFtZSkge1xuICAgICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUuc3Vic3RyKDEsIHRoaXMuaG9zdG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBpZiAocmVzdFswXSAhPT0gJy8nKSB7XG4gICAgICAgIHJlc3QgPSAnLycgKyByZXN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIG5vdyByZXN0IGlzIHNldCB0byB0aGUgcG9zdC1ob3N0IHN0dWZmLlxuICAvLyBjaG9wIG9mZiBhbnkgZGVsaW0gY2hhcnMuXG4gIGlmICghdW5zYWZlUHJvdG9jb2xbbG93ZXJQcm90b10pIHtcblxuICAgIC8vIEZpcnN0LCBtYWtlIDEwMCUgc3VyZSB0aGF0IGFueSBcImF1dG9Fc2NhcGVcIiBjaGFycyBnZXRcbiAgICAvLyBlc2NhcGVkLCBldmVuIGlmIGVuY29kZVVSSUNvbXBvbmVudCBkb2Vzbid0IHRoaW5rIHRoZXlcbiAgICAvLyBuZWVkIHRvIGJlLlxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXV0b0VzY2FwZS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBhZSA9IGF1dG9Fc2NhcGVbaV07XG4gICAgICB2YXIgZXNjID0gZW5jb2RlVVJJQ29tcG9uZW50KGFlKTtcbiAgICAgIGlmIChlc2MgPT09IGFlKSB7XG4gICAgICAgIGVzYyA9IGVzY2FwZShhZSk7XG4gICAgICB9XG4gICAgICByZXN0ID0gcmVzdC5zcGxpdChhZSkuam9pbihlc2MpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gY2hvcCBvZmYgZnJvbSB0aGUgdGFpbCBmaXJzdC5cbiAgdmFyIGhhc2ggPSByZXN0LmluZGV4T2YoJyMnKTtcbiAgaWYgKGhhc2ggIT09IC0xKSB7XG4gICAgLy8gZ290IGEgZnJhZ21lbnQgc3RyaW5nLlxuICAgIHRoaXMuaGFzaCA9IHJlc3Quc3Vic3RyKGhhc2gpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIGhhc2gpO1xuICB9XG4gIHZhciBxbSA9IHJlc3QuaW5kZXhPZignPycpO1xuICBpZiAocW0gIT09IC0xKSB7XG4gICAgdGhpcy5zZWFyY2ggPSByZXN0LnN1YnN0cihxbSk7XG4gICAgdGhpcy5xdWVyeSA9IHJlc3Quc3Vic3RyKHFtICsgMSk7XG4gICAgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgIHRoaXMucXVlcnkgPSBxdWVyeXN0cmluZy5wYXJzZSh0aGlzLnF1ZXJ5KTtcbiAgICB9XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgcW0pO1xuICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAvLyBubyBxdWVyeSBzdHJpbmcsIGJ1dCBwYXJzZVF1ZXJ5U3RyaW5nIHN0aWxsIHJlcXVlc3RlZFxuICAgIHRoaXMuc2VhcmNoID0gJyc7XG4gICAgdGhpcy5xdWVyeSA9IHt9O1xuICB9XG4gIGlmIChyZXN0KSB0aGlzLnBhdGhuYW1lID0gcmVzdDtcbiAgaWYgKHNsYXNoZWRQcm90b2NvbFtsb3dlclByb3RvXSAmJlxuICAgICAgdGhpcy5ob3N0bmFtZSAmJiAhdGhpcy5wYXRobmFtZSkge1xuICAgIHRoaXMucGF0aG5hbWUgPSAnLyc7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gIGlmICh0aGlzLnBhdGhuYW1lIHx8IHRoaXMuc2VhcmNoKSB7XG4gICAgdmFyIHAgPSB0aGlzLnBhdGhuYW1lIHx8ICcnO1xuICAgIHZhciBzID0gdGhpcy5zZWFyY2ggfHwgJyc7XG4gICAgdGhpcy5wYXRoID0gcCArIHM7XG4gIH1cblxuICAvLyBmaW5hbGx5LCByZWNvbnN0cnVjdCB0aGUgaHJlZiBiYXNlZCBvbiB3aGF0IGhhcyBiZWVuIHZhbGlkYXRlZC5cbiAgdGhpcy5ocmVmID0gdGhpcy5mb3JtYXQoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBmb3JtYXQgYSBwYXJzZWQgb2JqZWN0IGludG8gYSB1cmwgc3RyaW5nXG5mdW5jdGlvbiB1cmxGb3JtYXQob2JqKSB7XG4gIC8vIGVuc3VyZSBpdCdzIGFuIG9iamVjdCwgYW5kIG5vdCBhIHN0cmluZyB1cmwuXG4gIC8vIElmIGl0J3MgYW4gb2JqLCB0aGlzIGlzIGEgbm8tb3AuXG4gIC8vIHRoaXMgd2F5LCB5b3UgY2FuIGNhbGwgdXJsX2Zvcm1hdCgpIG9uIHN0cmluZ3NcbiAgLy8gdG8gY2xlYW4gdXAgcG90ZW50aWFsbHkgd29ua3kgdXJscy5cbiAgaWYgKGlzU3RyaW5nKG9iaikpIG9iaiA9IHVybFBhcnNlKG9iaik7XG4gIGlmICghKG9iaiBpbnN0YW5jZW9mIFVybCkpIHJldHVybiBVcmwucHJvdG90eXBlLmZvcm1hdC5jYWxsKG9iaik7XG4gIHJldHVybiBvYmouZm9ybWF0KCk7XG59XG5cblVybC5wcm90b3R5cGUuZm9ybWF0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBhdXRoID0gdGhpcy5hdXRoIHx8ICcnO1xuICBpZiAoYXV0aCkge1xuICAgIGF1dGggPSBlbmNvZGVVUklDb21wb25lbnQoYXV0aCk7XG4gICAgYXV0aCA9IGF1dGgucmVwbGFjZSgvJTNBL2ksICc6Jyk7XG4gICAgYXV0aCArPSAnQCc7XG4gIH1cblxuICB2YXIgcHJvdG9jb2wgPSB0aGlzLnByb3RvY29sIHx8ICcnLFxuICAgICAgcGF0aG5hbWUgPSB0aGlzLnBhdGhuYW1lIHx8ICcnLFxuICAgICAgaGFzaCA9IHRoaXMuaGFzaCB8fCAnJyxcbiAgICAgIGhvc3QgPSBmYWxzZSxcbiAgICAgIHF1ZXJ5ID0gJyc7XG5cbiAgaWYgKHRoaXMuaG9zdCkge1xuICAgIGhvc3QgPSBhdXRoICsgdGhpcy5ob3N0O1xuICB9IGVsc2UgaWYgKHRoaXMuaG9zdG5hbWUpIHtcbiAgICBob3N0ID0gYXV0aCArICh0aGlzLmhvc3RuYW1lLmluZGV4T2YoJzonKSA9PT0gLTEgP1xuICAgICAgICB0aGlzLmhvc3RuYW1lIDpcbiAgICAgICAgJ1snICsgdGhpcy5ob3N0bmFtZSArICddJyk7XG4gICAgaWYgKHRoaXMucG9ydCkge1xuICAgICAgaG9zdCArPSAnOicgKyB0aGlzLnBvcnQ7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMucXVlcnkgJiZcbiAgICAgIGlzT2JqZWN0KHRoaXMucXVlcnkpICYmXG4gICAgICBPYmplY3Qua2V5cyh0aGlzLnF1ZXJ5KS5sZW5ndGgpIHtcbiAgICBxdWVyeSA9IHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeSh0aGlzLnF1ZXJ5KTtcbiAgfVxuXG4gIHZhciBzZWFyY2ggPSB0aGlzLnNlYXJjaCB8fCAocXVlcnkgJiYgKCc/JyArIHF1ZXJ5KSkgfHwgJyc7XG5cbiAgaWYgKHByb3RvY29sICYmIHByb3RvY29sLnN1YnN0cigtMSkgIT09ICc6JykgcHJvdG9jb2wgKz0gJzonO1xuXG4gIC8vIG9ubHkgdGhlIHNsYXNoZWRQcm90b2NvbHMgZ2V0IHRoZSAvLy4gIE5vdCBtYWlsdG86LCB4bXBwOiwgZXRjLlxuICAvLyB1bmxlc3MgdGhleSBoYWQgdGhlbSB0byBiZWdpbiB3aXRoLlxuICBpZiAodGhpcy5zbGFzaGVzIHx8XG4gICAgICAoIXByb3RvY29sIHx8IHNsYXNoZWRQcm90b2NvbFtwcm90b2NvbF0pICYmIGhvc3QgIT09IGZhbHNlKSB7XG4gICAgaG9zdCA9ICcvLycgKyAoaG9zdCB8fCAnJyk7XG4gICAgaWYgKHBhdGhuYW1lICYmIHBhdGhuYW1lLmNoYXJBdCgwKSAhPT0gJy8nKSBwYXRobmFtZSA9ICcvJyArIHBhdGhuYW1lO1xuICB9IGVsc2UgaWYgKCFob3N0KSB7XG4gICAgaG9zdCA9ICcnO1xuICB9XG5cbiAgaWYgKGhhc2ggJiYgaGFzaC5jaGFyQXQoMCkgIT09ICcjJykgaGFzaCA9ICcjJyArIGhhc2g7XG4gIGlmIChzZWFyY2ggJiYgc2VhcmNoLmNoYXJBdCgwKSAhPT0gJz8nKSBzZWFyY2ggPSAnPycgKyBzZWFyY2g7XG5cbiAgcGF0aG5hbWUgPSBwYXRobmFtZS5yZXBsYWNlKC9bPyNdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChtYXRjaCk7XG4gIH0pO1xuICBzZWFyY2ggPSBzZWFyY2gucmVwbGFjZSgnIycsICclMjMnKTtcblxuICByZXR1cm4gcHJvdG9jb2wgKyBob3N0ICsgcGF0aG5hbWUgKyBzZWFyY2ggKyBoYXNoO1xufTtcblxuZnVuY3Rpb24gdXJsUmVzb2x2ZShzb3VyY2UsIHJlbGF0aXZlKSB7XG4gIHJldHVybiB1cmxQYXJzZShzb3VyY2UsIGZhbHNlLCB0cnVlKS5yZXNvbHZlKHJlbGF0aXZlKTtcbn1cblxuVXJsLnByb3RvdHlwZS5yZXNvbHZlID0gZnVuY3Rpb24ocmVsYXRpdmUpIHtcbiAgcmV0dXJuIHRoaXMucmVzb2x2ZU9iamVjdCh1cmxQYXJzZShyZWxhdGl2ZSwgZmFsc2UsIHRydWUpKS5mb3JtYXQoKTtcbn07XG5cbmZ1bmN0aW9uIHVybFJlc29sdmVPYmplY3Qoc291cmNlLCByZWxhdGl2ZSkge1xuICBpZiAoIXNvdXJjZSkgcmV0dXJuIHJlbGF0aXZlO1xuICByZXR1cm4gdXJsUGFyc2Uoc291cmNlLCBmYWxzZSwgdHJ1ZSkucmVzb2x2ZU9iamVjdChyZWxhdGl2ZSk7XG59XG5cblVybC5wcm90b3R5cGUucmVzb2x2ZU9iamVjdCA9IGZ1bmN0aW9uKHJlbGF0aXZlKSB7XG4gIGlmIChpc1N0cmluZyhyZWxhdGl2ZSkpIHtcbiAgICB2YXIgcmVsID0gbmV3IFVybCgpO1xuICAgIHJlbC5wYXJzZShyZWxhdGl2ZSwgZmFsc2UsIHRydWUpO1xuICAgIHJlbGF0aXZlID0gcmVsO1xuICB9XG5cbiAgdmFyIHJlc3VsdCA9IG5ldyBVcmwoKTtcbiAgT2JqZWN0LmtleXModGhpcykuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgcmVzdWx0W2tdID0gdGhpc1trXTtcbiAgfSwgdGhpcyk7XG5cbiAgLy8gaGFzaCBpcyBhbHdheXMgb3ZlcnJpZGRlbiwgbm8gbWF0dGVyIHdoYXQuXG4gIC8vIGV2ZW4gaHJlZj1cIlwiIHdpbGwgcmVtb3ZlIGl0LlxuICByZXN1bHQuaGFzaCA9IHJlbGF0aXZlLmhhc2g7XG5cbiAgLy8gaWYgdGhlIHJlbGF0aXZlIHVybCBpcyBlbXB0eSwgdGhlbiB0aGVyZSdzIG5vdGhpbmcgbGVmdCB0byBkbyBoZXJlLlxuICBpZiAocmVsYXRpdmUuaHJlZiA9PT0gJycpIHtcbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gaHJlZnMgbGlrZSAvL2Zvby9iYXIgYWx3YXlzIGN1dCB0byB0aGUgcHJvdG9jb2wuXG4gIGlmIChyZWxhdGl2ZS5zbGFzaGVzICYmICFyZWxhdGl2ZS5wcm90b2NvbCkge1xuICAgIC8vIHRha2UgZXZlcnl0aGluZyBleGNlcHQgdGhlIHByb3RvY29sIGZyb20gcmVsYXRpdmVcbiAgICBPYmplY3Qua2V5cyhyZWxhdGl2ZSkuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICBpZiAoayAhPT0gJ3Byb3RvY29sJylcbiAgICAgICAgcmVzdWx0W2tdID0gcmVsYXRpdmVba107XG4gICAgfSk7XG5cbiAgICAvL3VybFBhcnNlIGFwcGVuZHMgdHJhaWxpbmcgLyB0byB1cmxzIGxpa2UgaHR0cDovL3d3dy5leGFtcGxlLmNvbVxuICAgIGlmIChzbGFzaGVkUHJvdG9jb2xbcmVzdWx0LnByb3RvY29sXSAmJlxuICAgICAgICByZXN1bHQuaG9zdG5hbWUgJiYgIXJlc3VsdC5wYXRobmFtZSkge1xuICAgICAgcmVzdWx0LnBhdGggPSByZXN1bHQucGF0aG5hbWUgPSAnLyc7XG4gICAgfVxuXG4gICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGlmIChyZWxhdGl2ZS5wcm90b2NvbCAmJiByZWxhdGl2ZS5wcm90b2NvbCAhPT0gcmVzdWx0LnByb3RvY29sKSB7XG4gICAgLy8gaWYgaXQncyBhIGtub3duIHVybCBwcm90b2NvbCwgdGhlbiBjaGFuZ2luZ1xuICAgIC8vIHRoZSBwcm90b2NvbCBkb2VzIHdlaXJkIHRoaW5nc1xuICAgIC8vIGZpcnN0LCBpZiBpdCdzIG5vdCBmaWxlOiwgdGhlbiB3ZSBNVVNUIGhhdmUgYSBob3N0LFxuICAgIC8vIGFuZCBpZiB0aGVyZSB3YXMgYSBwYXRoXG4gICAgLy8gdG8gYmVnaW4gd2l0aCwgdGhlbiB3ZSBNVVNUIGhhdmUgYSBwYXRoLlxuICAgIC8vIGlmIGl0IGlzIGZpbGU6LCB0aGVuIHRoZSBob3N0IGlzIGRyb3BwZWQsXG4gICAgLy8gYmVjYXVzZSB0aGF0J3Mga25vd24gdG8gYmUgaG9zdGxlc3MuXG4gICAgLy8gYW55dGhpbmcgZWxzZSBpcyBhc3N1bWVkIHRvIGJlIGFic29sdXRlLlxuICAgIGlmICghc2xhc2hlZFByb3RvY29sW3JlbGF0aXZlLnByb3RvY29sXSkge1xuICAgICAgT2JqZWN0LmtleXMocmVsYXRpdmUpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgICByZXN1bHRba10gPSByZWxhdGl2ZVtrXTtcbiAgICAgIH0pO1xuICAgICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJlc3VsdC5wcm90b2NvbCA9IHJlbGF0aXZlLnByb3RvY29sO1xuICAgIGlmICghcmVsYXRpdmUuaG9zdCAmJiAhaG9zdGxlc3NQcm90b2NvbFtyZWxhdGl2ZS5wcm90b2NvbF0pIHtcbiAgICAgIHZhciByZWxQYXRoID0gKHJlbGF0aXZlLnBhdGhuYW1lIHx8ICcnKS5zcGxpdCgnLycpO1xuICAgICAgd2hpbGUgKHJlbFBhdGgubGVuZ3RoICYmICEocmVsYXRpdmUuaG9zdCA9IHJlbFBhdGguc2hpZnQoKSkpO1xuICAgICAgaWYgKCFyZWxhdGl2ZS5ob3N0KSByZWxhdGl2ZS5ob3N0ID0gJyc7XG4gICAgICBpZiAoIXJlbGF0aXZlLmhvc3RuYW1lKSByZWxhdGl2ZS5ob3N0bmFtZSA9ICcnO1xuICAgICAgaWYgKHJlbFBhdGhbMF0gIT09ICcnKSByZWxQYXRoLnVuc2hpZnQoJycpO1xuICAgICAgaWYgKHJlbFBhdGgubGVuZ3RoIDwgMikgcmVsUGF0aC51bnNoaWZ0KCcnKTtcbiAgICAgIHJlc3VsdC5wYXRobmFtZSA9IHJlbFBhdGguam9pbignLycpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucGF0aG5hbWUgPSByZWxhdGl2ZS5wYXRobmFtZTtcbiAgICB9XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICByZXN1bHQuaG9zdCA9IHJlbGF0aXZlLmhvc3QgfHwgJyc7XG4gICAgcmVzdWx0LmF1dGggPSByZWxhdGl2ZS5hdXRoO1xuICAgIHJlc3VsdC5ob3N0bmFtZSA9IHJlbGF0aXZlLmhvc3RuYW1lIHx8IHJlbGF0aXZlLmhvc3Q7XG4gICAgcmVzdWx0LnBvcnQgPSByZWxhdGl2ZS5wb3J0O1xuICAgIC8vIHRvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKHJlc3VsdC5wYXRobmFtZSB8fCByZXN1bHQuc2VhcmNoKSB7XG4gICAgICB2YXIgcCA9IHJlc3VsdC5wYXRobmFtZSB8fCAnJztcbiAgICAgIHZhciBzID0gcmVzdWx0LnNlYXJjaCB8fCAnJztcbiAgICAgIHJlc3VsdC5wYXRoID0gcCArIHM7XG4gICAgfVxuICAgIHJlc3VsdC5zbGFzaGVzID0gcmVzdWx0LnNsYXNoZXMgfHwgcmVsYXRpdmUuc2xhc2hlcztcbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgdmFyIGlzU291cmNlQWJzID0gKHJlc3VsdC5wYXRobmFtZSAmJiByZXN1bHQucGF0aG5hbWUuY2hhckF0KDApID09PSAnLycpLFxuICAgICAgaXNSZWxBYnMgPSAoXG4gICAgICAgICAgcmVsYXRpdmUuaG9zdCB8fFxuICAgICAgICAgIHJlbGF0aXZlLnBhdGhuYW1lICYmIHJlbGF0aXZlLnBhdGhuYW1lLmNoYXJBdCgwKSA9PT0gJy8nXG4gICAgICApLFxuICAgICAgbXVzdEVuZEFicyA9IChpc1JlbEFicyB8fCBpc1NvdXJjZUFicyB8fFxuICAgICAgICAgICAgICAgICAgICAocmVzdWx0Lmhvc3QgJiYgcmVsYXRpdmUucGF0aG5hbWUpKSxcbiAgICAgIHJlbW92ZUFsbERvdHMgPSBtdXN0RW5kQWJzLFxuICAgICAgc3JjUGF0aCA9IHJlc3VsdC5wYXRobmFtZSAmJiByZXN1bHQucGF0aG5hbWUuc3BsaXQoJy8nKSB8fCBbXSxcbiAgICAgIHJlbFBhdGggPSByZWxhdGl2ZS5wYXRobmFtZSAmJiByZWxhdGl2ZS5wYXRobmFtZS5zcGxpdCgnLycpIHx8IFtdLFxuICAgICAgcHN5Y2hvdGljID0gcmVzdWx0LnByb3RvY29sICYmICFzbGFzaGVkUHJvdG9jb2xbcmVzdWx0LnByb3RvY29sXTtcblxuICAvLyBpZiB0aGUgdXJsIGlzIGEgbm9uLXNsYXNoZWQgdXJsLCB0aGVuIHJlbGF0aXZlXG4gIC8vIGxpbmtzIGxpa2UgLi4vLi4gc2hvdWxkIGJlIGFibGVcbiAgLy8gdG8gY3Jhd2wgdXAgdG8gdGhlIGhvc3RuYW1lLCBhcyB3ZWxsLiAgVGhpcyBpcyBzdHJhbmdlLlxuICAvLyByZXN1bHQucHJvdG9jb2wgaGFzIGFscmVhZHkgYmVlbiBzZXQgYnkgbm93LlxuICAvLyBMYXRlciBvbiwgcHV0IHRoZSBmaXJzdCBwYXRoIHBhcnQgaW50byB0aGUgaG9zdCBmaWVsZC5cbiAgaWYgKHBzeWNob3RpYykge1xuICAgIHJlc3VsdC5ob3N0bmFtZSA9ICcnO1xuICAgIHJlc3VsdC5wb3J0ID0gbnVsbDtcbiAgICBpZiAocmVzdWx0Lmhvc3QpIHtcbiAgICAgIGlmIChzcmNQYXRoWzBdID09PSAnJykgc3JjUGF0aFswXSA9IHJlc3VsdC5ob3N0O1xuICAgICAgZWxzZSBzcmNQYXRoLnVuc2hpZnQocmVzdWx0Lmhvc3QpO1xuICAgIH1cbiAgICByZXN1bHQuaG9zdCA9ICcnO1xuICAgIGlmIChyZWxhdGl2ZS5wcm90b2NvbCkge1xuICAgICAgcmVsYXRpdmUuaG9zdG5hbWUgPSBudWxsO1xuICAgICAgcmVsYXRpdmUucG9ydCA9IG51bGw7XG4gICAgICBpZiAocmVsYXRpdmUuaG9zdCkge1xuICAgICAgICBpZiAocmVsUGF0aFswXSA9PT0gJycpIHJlbFBhdGhbMF0gPSByZWxhdGl2ZS5ob3N0O1xuICAgICAgICBlbHNlIHJlbFBhdGgudW5zaGlmdChyZWxhdGl2ZS5ob3N0KTtcbiAgICAgIH1cbiAgICAgIHJlbGF0aXZlLmhvc3QgPSBudWxsO1xuICAgIH1cbiAgICBtdXN0RW5kQWJzID0gbXVzdEVuZEFicyAmJiAocmVsUGF0aFswXSA9PT0gJycgfHwgc3JjUGF0aFswXSA9PT0gJycpO1xuICB9XG5cbiAgaWYgKGlzUmVsQWJzKSB7XG4gICAgLy8gaXQncyBhYnNvbHV0ZS5cbiAgICByZXN1bHQuaG9zdCA9IChyZWxhdGl2ZS5ob3N0IHx8IHJlbGF0aXZlLmhvc3QgPT09ICcnKSA/XG4gICAgICAgICAgICAgICAgICByZWxhdGl2ZS5ob3N0IDogcmVzdWx0Lmhvc3Q7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gKHJlbGF0aXZlLmhvc3RuYW1lIHx8IHJlbGF0aXZlLmhvc3RuYW1lID09PSAnJykgP1xuICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aXZlLmhvc3RuYW1lIDogcmVzdWx0Lmhvc3RuYW1lO1xuICAgIHJlc3VsdC5zZWFyY2ggPSByZWxhdGl2ZS5zZWFyY2g7XG4gICAgcmVzdWx0LnF1ZXJ5ID0gcmVsYXRpdmUucXVlcnk7XG4gICAgc3JjUGF0aCA9IHJlbFBhdGg7XG4gICAgLy8gZmFsbCB0aHJvdWdoIHRvIHRoZSBkb3QtaGFuZGxpbmcgYmVsb3cuXG4gIH0gZWxzZSBpZiAocmVsUGF0aC5sZW5ndGgpIHtcbiAgICAvLyBpdCdzIHJlbGF0aXZlXG4gICAgLy8gdGhyb3cgYXdheSB0aGUgZXhpc3RpbmcgZmlsZSwgYW5kIHRha2UgdGhlIG5ldyBwYXRoIGluc3RlYWQuXG4gICAgaWYgKCFzcmNQYXRoKSBzcmNQYXRoID0gW107XG4gICAgc3JjUGF0aC5wb3AoKTtcbiAgICBzcmNQYXRoID0gc3JjUGF0aC5jb25jYXQocmVsUGF0aCk7XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgfSBlbHNlIGlmICghaXNOdWxsT3JVbmRlZmluZWQocmVsYXRpdmUuc2VhcmNoKSkge1xuICAgIC8vIGp1c3QgcHVsbCBvdXQgdGhlIHNlYXJjaC5cbiAgICAvLyBsaWtlIGhyZWY9Jz9mb28nLlxuICAgIC8vIFB1dCB0aGlzIGFmdGVyIHRoZSBvdGhlciB0d28gY2FzZXMgYmVjYXVzZSBpdCBzaW1wbGlmaWVzIHRoZSBib29sZWFuc1xuICAgIGlmIChwc3ljaG90aWMpIHtcbiAgICAgIHJlc3VsdC5ob3N0bmFtZSA9IHJlc3VsdC5ob3N0ID0gc3JjUGF0aC5zaGlmdCgpO1xuICAgICAgLy9vY2NhdGlvbmFseSB0aGUgYXV0aCBjYW4gZ2V0IHN0dWNrIG9ubHkgaW4gaG9zdFxuICAgICAgLy90aGlzIGVzcGVjaWFseSBoYXBwZW5zIGluIGNhc2VzIGxpa2VcbiAgICAgIC8vdXJsLnJlc29sdmVPYmplY3QoJ21haWx0bzpsb2NhbDFAZG9tYWluMScsICdsb2NhbDJAZG9tYWluMicpXG4gICAgICB2YXIgYXV0aEluSG9zdCA9IHJlc3VsdC5ob3N0ICYmIHJlc3VsdC5ob3N0LmluZGV4T2YoJ0AnKSA+IDAgP1xuICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuaG9zdC5zcGxpdCgnQCcpIDogZmFsc2U7XG4gICAgICBpZiAoYXV0aEluSG9zdCkge1xuICAgICAgICByZXN1bHQuYXV0aCA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgICAgcmVzdWx0Lmhvc3QgPSByZXN1bHQuaG9zdG5hbWUgPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlc3VsdC5zZWFyY2ggPSByZWxhdGl2ZS5zZWFyY2g7XG4gICAgcmVzdWx0LnF1ZXJ5ID0gcmVsYXRpdmUucXVlcnk7XG4gICAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmICghaXNOdWxsKHJlc3VsdC5wYXRobmFtZSkgfHwgIWlzTnVsbChyZXN1bHQuc2VhcmNoKSkge1xuICAgICAgcmVzdWx0LnBhdGggPSAocmVzdWx0LnBhdGhuYW1lID8gcmVzdWx0LnBhdGhuYW1lIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICAgIH1cbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaWYgKCFzcmNQYXRoLmxlbmd0aCkge1xuICAgIC8vIG5vIHBhdGggYXQgYWxsLiAgZWFzeS5cbiAgICAvLyB3ZSd2ZSBhbHJlYWR5IGhhbmRsZWQgdGhlIG90aGVyIHN0dWZmIGFib3ZlLlxuICAgIHJlc3VsdC5wYXRobmFtZSA9IG51bGw7XG4gICAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmIChyZXN1bHQuc2VhcmNoKSB7XG4gICAgICByZXN1bHQucGF0aCA9ICcvJyArIHJlc3VsdC5zZWFyY2g7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gbnVsbDtcbiAgICB9XG4gICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIGlmIGEgdXJsIEVORHMgaW4gLiBvciAuLiwgdGhlbiBpdCBtdXN0IGdldCBhIHRyYWlsaW5nIHNsYXNoLlxuICAvLyBob3dldmVyLCBpZiBpdCBlbmRzIGluIGFueXRoaW5nIGVsc2Ugbm9uLXNsYXNoeSxcbiAgLy8gdGhlbiBpdCBtdXN0IE5PVCBnZXQgYSB0cmFpbGluZyBzbGFzaC5cbiAgdmFyIGxhc3QgPSBzcmNQYXRoLnNsaWNlKC0xKVswXTtcbiAgdmFyIGhhc1RyYWlsaW5nU2xhc2ggPSAoXG4gICAgICAocmVzdWx0Lmhvc3QgfHwgcmVsYXRpdmUuaG9zdCkgJiYgKGxhc3QgPT09ICcuJyB8fCBsYXN0ID09PSAnLi4nKSB8fFxuICAgICAgbGFzdCA9PT0gJycpO1xuXG4gIC8vIHN0cmlwIHNpbmdsZSBkb3RzLCByZXNvbHZlIGRvdWJsZSBkb3RzIHRvIHBhcmVudCBkaXJcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHNyY1BhdGgubGVuZ3RoOyBpID49IDA7IGktLSkge1xuICAgIGxhc3QgPSBzcmNQYXRoW2ldO1xuICAgIGlmIChsYXN0ID09ICcuJykge1xuICAgICAgc3JjUGF0aC5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgc3JjUGF0aC5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKCFtdXN0RW5kQWJzICYmICFyZW1vdmVBbGxEb3RzKSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBzcmNQYXRoLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG11c3RFbmRBYnMgJiYgc3JjUGF0aFswXSAhPT0gJycgJiZcbiAgICAgICghc3JjUGF0aFswXSB8fCBzcmNQYXRoWzBdLmNoYXJBdCgwKSAhPT0gJy8nKSkge1xuICAgIHNyY1BhdGgudW5zaGlmdCgnJyk7XG4gIH1cblxuICBpZiAoaGFzVHJhaWxpbmdTbGFzaCAmJiAoc3JjUGF0aC5qb2luKCcvJykuc3Vic3RyKC0xKSAhPT0gJy8nKSkge1xuICAgIHNyY1BhdGgucHVzaCgnJyk7XG4gIH1cblxuICB2YXIgaXNBYnNvbHV0ZSA9IHNyY1BhdGhbMF0gPT09ICcnIHx8XG4gICAgICAoc3JjUGF0aFswXSAmJiBzcmNQYXRoWzBdLmNoYXJBdCgwKSA9PT0gJy8nKTtcblxuICAvLyBwdXQgdGhlIGhvc3QgYmFja1xuICBpZiAocHN5Y2hvdGljKSB7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gcmVzdWx0Lmhvc3QgPSBpc0Fic29sdXRlID8gJycgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjUGF0aC5sZW5ndGggPyBzcmNQYXRoLnNoaWZ0KCkgOiAnJztcbiAgICAvL29jY2F0aW9uYWx5IHRoZSBhdXRoIGNhbiBnZXQgc3R1Y2sgb25seSBpbiBob3N0XG4gICAgLy90aGlzIGVzcGVjaWFseSBoYXBwZW5zIGluIGNhc2VzIGxpa2VcbiAgICAvL3VybC5yZXNvbHZlT2JqZWN0KCdtYWlsdG86bG9jYWwxQGRvbWFpbjEnLCAnbG9jYWwyQGRvbWFpbjInKVxuICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICByZXN1bHQuaG9zdC5zcGxpdCgnQCcpIDogZmFsc2U7XG4gICAgaWYgKGF1dGhJbkhvc3QpIHtcbiAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgcmVzdWx0Lmhvc3QgPSByZXN1bHQuaG9zdG5hbWUgPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgfVxuICB9XG5cbiAgbXVzdEVuZEFicyA9IG11c3RFbmRBYnMgfHwgKHJlc3VsdC5ob3N0ICYmIHNyY1BhdGgubGVuZ3RoKTtcblxuICBpZiAobXVzdEVuZEFicyAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHNyY1BhdGgudW5zaGlmdCgnJyk7XG4gIH1cblxuICBpZiAoIXNyY1BhdGgubGVuZ3RoKSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gbnVsbDtcbiAgICByZXN1bHQucGF0aCA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gc3JjUGF0aC5qb2luKCcvJyk7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgcmVxdWVzdC5odHRwXG4gIGlmICghaXNOdWxsKHJlc3VsdC5wYXRobmFtZSkgfHwgIWlzTnVsbChyZXN1bHQuc2VhcmNoKSkge1xuICAgIHJlc3VsdC5wYXRoID0gKHJlc3VsdC5wYXRobmFtZSA/IHJlc3VsdC5wYXRobmFtZSA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAocmVzdWx0LnNlYXJjaCA/IHJlc3VsdC5zZWFyY2ggOiAnJyk7XG4gIH1cbiAgcmVzdWx0LmF1dGggPSByZWxhdGl2ZS5hdXRoIHx8IHJlc3VsdC5hdXRoO1xuICByZXN1bHQuc2xhc2hlcyA9IHJlc3VsdC5zbGFzaGVzIHx8IHJlbGF0aXZlLnNsYXNoZXM7XG4gIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuVXJsLnByb3RvdHlwZS5wYXJzZUhvc3QgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhvc3QgPSB0aGlzLmhvc3Q7XG4gIHZhciBwb3J0ID0gcG9ydFBhdHRlcm4uZXhlYyhob3N0KTtcbiAgaWYgKHBvcnQpIHtcbiAgICBwb3J0ID0gcG9ydFswXTtcbiAgICBpZiAocG9ydCAhPT0gJzonKSB7XG4gICAgICB0aGlzLnBvcnQgPSBwb3J0LnN1YnN0cigxKTtcbiAgICB9XG4gICAgaG9zdCA9IGhvc3Quc3Vic3RyKDAsIGhvc3QubGVuZ3RoIC0gcG9ydC5sZW5ndGgpO1xuICB9XG4gIGlmIChob3N0KSB0aGlzLmhvc3RuYW1lID0gaG9zdDtcbn07XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gXCJzdHJpbmdcIjtcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gIGFyZyA9PSBudWxsO1xufVxuIiwiLypcbiAqICBDb3B5cmlnaHQgMjAxMSBUd2l0dGVyLCBJbmMuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgSG9nYW4gPSB7fTtcblxuKGZ1bmN0aW9uIChIb2dhbikge1xuICBIb2dhbi5UZW1wbGF0ZSA9IGZ1bmN0aW9uIChjb2RlT2JqLCB0ZXh0LCBjb21waWxlciwgb3B0aW9ucykge1xuICAgIGNvZGVPYmogPSBjb2RlT2JqIHx8IHt9O1xuICAgIHRoaXMuciA9IGNvZGVPYmouY29kZSB8fCB0aGlzLnI7XG4gICAgdGhpcy5jID0gY29tcGlsZXI7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLnRleHQgPSB0ZXh0IHx8ICcnO1xuICAgIHRoaXMucGFydGlhbHMgPSBjb2RlT2JqLnBhcnRpYWxzIHx8IHt9O1xuICAgIHRoaXMuc3VicyA9IGNvZGVPYmouc3VicyB8fCB7fTtcbiAgICB0aGlzLmJ1ZiA9ICcnO1xuICB9XG5cbiAgSG9nYW4uVGVtcGxhdGUucHJvdG90eXBlID0ge1xuICAgIC8vIHJlbmRlcjogcmVwbGFjZWQgYnkgZ2VuZXJhdGVkIGNvZGUuXG4gICAgcjogZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHsgcmV0dXJuICcnOyB9LFxuXG4gICAgLy8gdmFyaWFibGUgZXNjYXBpbmdcbiAgICB2OiBob2dhbkVzY2FwZSxcblxuICAgIC8vIHRyaXBsZSBzdGFjaGVcbiAgICB0OiBjb2VyY2VUb1N0cmluZyxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnJpKFtjb250ZXh0XSwgcGFydGlhbHMgfHwge30sIGluZGVudCk7XG4gICAgfSxcblxuICAgIC8vIHJlbmRlciBpbnRlcm5hbCAtLSBhIGhvb2sgZm9yIG92ZXJyaWRlcyB0aGF0IGNhdGNoZXMgcGFydGlhbHMgdG9vXG4gICAgcmk6IGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5yKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyBlbnN1cmVQYXJ0aWFsXG4gICAgZXA6IGZ1bmN0aW9uKHN5bWJvbCwgcGFydGlhbHMpIHtcbiAgICAgIHZhciBwYXJ0aWFsID0gdGhpcy5wYXJ0aWFsc1tzeW1ib2xdO1xuXG4gICAgICAvLyBjaGVjayB0byBzZWUgdGhhdCBpZiB3ZSd2ZSBpbnN0YW50aWF0ZWQgdGhpcyBwYXJ0aWFsIGJlZm9yZVxuICAgICAgdmFyIHRlbXBsYXRlID0gcGFydGlhbHNbcGFydGlhbC5uYW1lXTtcbiAgICAgIGlmIChwYXJ0aWFsLmluc3RhbmNlICYmIHBhcnRpYWwuYmFzZSA9PSB0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gcGFydGlhbC5pbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0ZW1wbGF0ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoIXRoaXMuYykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNvbXBpbGVyIGF2YWlsYWJsZS5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgPSB0aGlzLmMuY29tcGlsZSh0ZW1wbGF0ZSwgdGhpcy5vcHRpb25zKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgdXNlIHRoaXMgdG8gY2hlY2sgd2hldGhlciB0aGUgcGFydGlhbHMgZGljdGlvbmFyeSBoYXMgY2hhbmdlZFxuICAgICAgdGhpcy5wYXJ0aWFsc1tzeW1ib2xdLmJhc2UgPSB0ZW1wbGF0ZTtcblxuICAgICAgaWYgKHBhcnRpYWwuc3Vicykge1xuICAgICAgICAvLyBNYWtlIHN1cmUgd2UgY29uc2lkZXIgcGFyZW50IHRlbXBsYXRlIG5vd1xuICAgICAgICBpZiAoIXBhcnRpYWxzLnN0YWNrVGV4dCkgcGFydGlhbHMuc3RhY2tUZXh0ID0ge307XG4gICAgICAgIGZvciAoa2V5IGluIHBhcnRpYWwuc3Vicykge1xuICAgICAgICAgIGlmICghcGFydGlhbHMuc3RhY2tUZXh0W2tleV0pIHtcbiAgICAgICAgICAgIHBhcnRpYWxzLnN0YWNrVGV4dFtrZXldID0gKHRoaXMuYWN0aXZlU3ViICE9PSB1bmRlZmluZWQgJiYgcGFydGlhbHMuc3RhY2tUZXh0W3RoaXMuYWN0aXZlU3ViXSkgPyBwYXJ0aWFscy5zdGFja1RleHRbdGhpcy5hY3RpdmVTdWJdIDogdGhpcy50ZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSA9IGNyZWF0ZVNwZWNpYWxpemVkUGFydGlhbCh0ZW1wbGF0ZSwgcGFydGlhbC5zdWJzLCBwYXJ0aWFsLnBhcnRpYWxzLFxuICAgICAgICAgIHRoaXMuc3RhY2tTdWJzLCB0aGlzLnN0YWNrUGFydGlhbHMsIHBhcnRpYWxzLnN0YWNrVGV4dCk7XG4gICAgICB9XG4gICAgICB0aGlzLnBhcnRpYWxzW3N5bWJvbF0uaW5zdGFuY2UgPSB0ZW1wbGF0ZTtcblxuICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH0sXG5cbiAgICAvLyB0cmllcyB0byBmaW5kIGEgcGFydGlhbCBpbiB0aGUgY3VycmVudCBzY29wZSBhbmQgcmVuZGVyIGl0XG4gICAgcnA6IGZ1bmN0aW9uKHN5bWJvbCwgY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgdmFyIHBhcnRpYWwgPSB0aGlzLmVwKHN5bWJvbCwgcGFydGlhbHMpO1xuICAgICAgaWYgKCFwYXJ0aWFsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhcnRpYWwucmkoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCk7XG4gICAgfSxcblxuICAgIC8vIHJlbmRlciBhIHNlY3Rpb25cbiAgICByczogZnVuY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHNlY3Rpb24pIHtcbiAgICAgIHZhciB0YWlsID0gY29udGV4dFtjb250ZXh0Lmxlbmd0aCAtIDFdO1xuXG4gICAgICBpZiAoIWlzQXJyYXkodGFpbCkpIHtcbiAgICAgICAgc2VjdGlvbihjb250ZXh0LCBwYXJ0aWFscywgdGhpcyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YWlsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnRleHQucHVzaCh0YWlsW2ldKTtcbiAgICAgICAgc2VjdGlvbihjb250ZXh0LCBwYXJ0aWFscywgdGhpcyk7XG4gICAgICAgIGNvbnRleHQucG9wKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIG1heWJlIHN0YXJ0IGEgc2VjdGlvblxuICAgIHM6IGZ1bmN0aW9uKHZhbCwgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpIHtcbiAgICAgIHZhciBwYXNzO1xuXG4gICAgICBpZiAoaXNBcnJheSh2YWwpICYmIHZhbC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbCA9IHRoaXMubXModmFsLCBjdHgsIHBhcnRpYWxzLCBpbnZlcnRlZCwgc3RhcnQsIGVuZCwgdGFncyk7XG4gICAgICB9XG5cbiAgICAgIHBhc3MgPSAhIXZhbDtcblxuICAgICAgaWYgKCFpbnZlcnRlZCAmJiBwYXNzICYmIGN0eCkge1xuICAgICAgICBjdHgucHVzaCgodHlwZW9mIHZhbCA9PSAnb2JqZWN0JykgPyB2YWwgOiBjdHhbY3R4Lmxlbmd0aCAtIDFdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhc3M7XG4gICAgfSxcblxuICAgIC8vIGZpbmQgdmFsdWVzIHdpdGggZG90dGVkIG5hbWVzXG4gICAgZDogZnVuY3Rpb24oa2V5LCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCkge1xuICAgICAgdmFyIGZvdW5kLFxuICAgICAgICAgIG5hbWVzID0ga2V5LnNwbGl0KCcuJyksXG4gICAgICAgICAgdmFsID0gdGhpcy5mKG5hbWVzWzBdLCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCksXG4gICAgICAgICAgZG9Nb2RlbEdldCA9IHRoaXMub3B0aW9ucy5tb2RlbEdldCxcbiAgICAgICAgICBjeCA9IG51bGw7XG5cbiAgICAgIGlmIChrZXkgPT09ICcuJyAmJiBpc0FycmF5KGN0eFtjdHgubGVuZ3RoIC0gMl0pKSB7XG4gICAgICAgIHZhbCA9IGN0eFtjdHgubGVuZ3RoIC0gMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZm91bmQgPSBmaW5kSW5TY29wZShuYW1lc1tpXSwgdmFsLCBkb01vZGVsR2V0KTtcbiAgICAgICAgICBpZiAoZm91bmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY3ggPSB2YWw7XG4gICAgICAgICAgICB2YWwgPSBmb3VuZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsID0gJyc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXR1cm5Gb3VuZCAmJiAhdmFsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXR1cm5Gb3VuZCAmJiB0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY3R4LnB1c2goY3gpO1xuICAgICAgICB2YWwgPSB0aGlzLm12KHZhbCwgY3R4LCBwYXJ0aWFscyk7XG4gICAgICAgIGN0eC5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgLy8gZmluZCB2YWx1ZXMgd2l0aCBub3JtYWwgbmFtZXNcbiAgICBmOiBmdW5jdGlvbihrZXksIGN0eCwgcGFydGlhbHMsIHJldHVybkZvdW5kKSB7XG4gICAgICB2YXIgdmFsID0gZmFsc2UsXG4gICAgICAgICAgdiA9IG51bGwsXG4gICAgICAgICAgZm91bmQgPSBmYWxzZSxcbiAgICAgICAgICBkb01vZGVsR2V0ID0gdGhpcy5vcHRpb25zLm1vZGVsR2V0O1xuXG4gICAgICBmb3IgKHZhciBpID0gY3R4Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHYgPSBjdHhbaV07XG4gICAgICAgIHZhbCA9IGZpbmRJblNjb3BlKGtleSwgdiwgZG9Nb2RlbEdldCk7XG4gICAgICAgIGlmICh2YWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHJldHVybiAocmV0dXJuRm91bmQpID8gZmFsc2UgOiBcIlwiO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJldHVybkZvdW5kICYmIHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSB0aGlzLm12KHZhbCwgY3R4LCBwYXJ0aWFscyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIGhpZ2hlciBvcmRlciB0ZW1wbGF0ZXNcbiAgICBsczogZnVuY3Rpb24oZnVuYywgY3gsIHBhcnRpYWxzLCB0ZXh0LCB0YWdzKSB7XG4gICAgICB2YXIgb2xkVGFncyA9IHRoaXMub3B0aW9ucy5kZWxpbWl0ZXJzO1xuXG4gICAgICB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycyA9IHRhZ3M7XG4gICAgICB0aGlzLmIodGhpcy5jdChjb2VyY2VUb1N0cmluZyhmdW5jLmNhbGwoY3gsIHRleHQpKSwgY3gsIHBhcnRpYWxzKSk7XG4gICAgICB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycyA9IG9sZFRhZ3M7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gY29tcGlsZSB0ZXh0XG4gICAgY3Q6IGZ1bmN0aW9uKHRleHQsIGN4LCBwYXJ0aWFscykge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXNhYmxlTGFtYmRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTGFtYmRhIGZlYXR1cmVzIGRpc2FibGVkLicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYy5jb21waWxlKHRleHQsIHRoaXMub3B0aW9ucykucmVuZGVyKGN4LCBwYXJ0aWFscyk7XG4gICAgfSxcblxuICAgIC8vIHRlbXBsYXRlIHJlc3VsdCBidWZmZXJpbmdcbiAgICBiOiBmdW5jdGlvbihzKSB7IHRoaXMuYnVmICs9IHM7IH0sXG5cbiAgICBmbDogZnVuY3Rpb24oKSB7IHZhciByID0gdGhpcy5idWY7IHRoaXMuYnVmID0gJyc7IHJldHVybiByOyB9LFxuXG4gICAgLy8gbWV0aG9kIHJlcGxhY2Ugc2VjdGlvblxuICAgIG1zOiBmdW5jdGlvbihmdW5jLCBjdHgsIHBhcnRpYWxzLCBpbnZlcnRlZCwgc3RhcnQsIGVuZCwgdGFncykge1xuICAgICAgdmFyIHRleHRTb3VyY2UsXG4gICAgICAgICAgY3ggPSBjdHhbY3R4Lmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuY2FsbChjeCk7XG5cbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKGludmVydGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGV4dFNvdXJjZSA9ICh0aGlzLmFjdGl2ZVN1YiAmJiB0aGlzLnN1YnNUZXh0ICYmIHRoaXMuc3Vic1RleHRbdGhpcy5hY3RpdmVTdWJdKSA/IHRoaXMuc3Vic1RleHRbdGhpcy5hY3RpdmVTdWJdIDogdGhpcy50ZXh0O1xuICAgICAgICAgIHJldHVybiB0aGlzLmxzKHJlc3VsdCwgY3gsIHBhcnRpYWxzLCB0ZXh0U291cmNlLnN1YnN0cmluZyhzdGFydCwgZW5kKSwgdGFncyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLy8gbWV0aG9kIHJlcGxhY2UgdmFyaWFibGVcbiAgICBtdjogZnVuY3Rpb24oZnVuYywgY3R4LCBwYXJ0aWFscykge1xuICAgICAgdmFyIGN4ID0gY3R4W2N0eC5sZW5ndGggLSAxXTtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmNhbGwoY3gpO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmN0KGNvZXJjZVRvU3RyaW5nKHJlc3VsdC5jYWxsKGN4KSksIGN4LCBwYXJ0aWFscyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIHN1YjogZnVuY3Rpb24obmFtZSwgY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgdmFyIGYgPSB0aGlzLnN1YnNbbmFtZV07XG4gICAgICBpZiAoZikge1xuICAgICAgICB0aGlzLmFjdGl2ZVN1YiA9IG5hbWU7XG4gICAgICAgIGYoY29udGV4dCwgcGFydGlhbHMsIHRoaXMsIGluZGVudCk7XG4gICAgICAgIHRoaXMuYWN0aXZlU3ViID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gIH07XG5cbiAgLy9GaW5kIGEga2V5IGluIGFuIG9iamVjdFxuICBmdW5jdGlvbiBmaW5kSW5TY29wZShrZXksIHNjb3BlLCBkb01vZGVsR2V0KSB7XG4gICAgdmFyIHZhbDtcblxuICAgIGlmIChzY29wZSAmJiB0eXBlb2Ygc2NvcGUgPT0gJ29iamVjdCcpIHtcblxuICAgICAgaWYgKHNjb3BlW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWwgPSBzY29wZVtrZXldO1xuXG4gICAgICAvLyB0cnkgbG9va3VwIHdpdGggZ2V0IGZvciBiYWNrYm9uZSBvciBzaW1pbGFyIG1vZGVsIGRhdGFcbiAgICAgIH0gZWxzZSBpZiAoZG9Nb2RlbEdldCAmJiBzY29wZS5nZXQgJiYgdHlwZW9mIHNjb3BlLmdldCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbCA9IHNjb3BlLmdldChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTcGVjaWFsaXplZFBhcnRpYWwoaW5zdGFuY2UsIHN1YnMsIHBhcnRpYWxzLCBzdGFja1N1YnMsIHN0YWNrUGFydGlhbHMsIHN0YWNrVGV4dCkge1xuICAgIGZ1bmN0aW9uIFBhcnRpYWxUZW1wbGF0ZSgpIHt9O1xuICAgIFBhcnRpYWxUZW1wbGF0ZS5wcm90b3R5cGUgPSBpbnN0YW5jZTtcbiAgICBmdW5jdGlvbiBTdWJzdGl0dXRpb25zKCkge307XG4gICAgU3Vic3RpdHV0aW9ucy5wcm90b3R5cGUgPSBpbnN0YW5jZS5zdWJzO1xuICAgIHZhciBrZXk7XG4gICAgdmFyIHBhcnRpYWwgPSBuZXcgUGFydGlhbFRlbXBsYXRlKCk7XG4gICAgcGFydGlhbC5zdWJzID0gbmV3IFN1YnN0aXR1dGlvbnMoKTtcbiAgICBwYXJ0aWFsLnN1YnNUZXh0ID0ge307ICAvL2hlaGUuIHN1YnN0ZXh0LlxuICAgIHBhcnRpYWwuYnVmID0gJyc7XG5cbiAgICBzdGFja1N1YnMgPSBzdGFja1N1YnMgfHwge307XG4gICAgcGFydGlhbC5zdGFja1N1YnMgPSBzdGFja1N1YnM7XG4gICAgcGFydGlhbC5zdWJzVGV4dCA9IHN0YWNrVGV4dDtcbiAgICBmb3IgKGtleSBpbiBzdWJzKSB7XG4gICAgICBpZiAoIXN0YWNrU3Vic1trZXldKSBzdGFja1N1YnNba2V5XSA9IHN1YnNba2V5XTtcbiAgICB9XG4gICAgZm9yIChrZXkgaW4gc3RhY2tTdWJzKSB7XG4gICAgICBwYXJ0aWFsLnN1YnNba2V5XSA9IHN0YWNrU3Vic1trZXldO1xuICAgIH1cblxuICAgIHN0YWNrUGFydGlhbHMgPSBzdGFja1BhcnRpYWxzIHx8IHt9O1xuICAgIHBhcnRpYWwuc3RhY2tQYXJ0aWFscyA9IHN0YWNrUGFydGlhbHM7XG4gICAgZm9yIChrZXkgaW4gcGFydGlhbHMpIHtcbiAgICAgIGlmICghc3RhY2tQYXJ0aWFsc1trZXldKSBzdGFja1BhcnRpYWxzW2tleV0gPSBwYXJ0aWFsc1trZXldO1xuICAgIH1cbiAgICBmb3IgKGtleSBpbiBzdGFja1BhcnRpYWxzKSB7XG4gICAgICBwYXJ0aWFsLnBhcnRpYWxzW2tleV0gPSBzdGFja1BhcnRpYWxzW2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnRpYWw7XG4gIH1cblxuICB2YXIgckFtcCA9IC8mL2csXG4gICAgICByTHQgPSAvPC9nLFxuICAgICAgckd0ID0gLz4vZyxcbiAgICAgIHJBcG9zID0gL1xcJy9nLFxuICAgICAgclF1b3QgPSAvXFxcIi9nLFxuICAgICAgaENoYXJzID0gL1smPD5cXFwiXFwnXS87XG5cbiAgZnVuY3Rpb24gY29lcmNlVG9TdHJpbmcodmFsKSB7XG4gICAgcmV0dXJuIFN0cmluZygodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSA/ICcnIDogdmFsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhvZ2FuRXNjYXBlKHN0cikge1xuICAgIHN0ciA9IGNvZXJjZVRvU3RyaW5nKHN0cik7XG4gICAgcmV0dXJuIGhDaGFycy50ZXN0KHN0cikgP1xuICAgICAgc3RyXG4gICAgICAgIC5yZXBsYWNlKHJBbXAsICcmYW1wOycpXG4gICAgICAgIC5yZXBsYWNlKHJMdCwgJyZsdDsnKVxuICAgICAgICAucmVwbGFjZShyR3QsICcmZ3Q7JylcbiAgICAgICAgLnJlcGxhY2UockFwb3MsICcmIzM5OycpXG4gICAgICAgIC5yZXBsYWNlKHJRdW90LCAnJnF1b3Q7JykgOlxuICAgICAgc3RyO1xuICB9XG5cbiAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKGEpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG59KSh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzIDogSG9nYW4pO1xuIiwiKGZ1bmN0aW9uICgkKSB7XG5cbiAgJC5mbi5jdXN0b21TY3JvbGxiYXIgPSBmdW5jdGlvbiAob3B0aW9ucywgYXJncykge1xuXG4gICAgdmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgICAgc2tpbjogdW5kZWZpbmVkLFxuICAgICAgaFNjcm9sbDogdHJ1ZSxcbiAgICAgIHZTY3JvbGw6IHRydWUsXG4gICAgICB1cGRhdGVPbldpbmRvd1Jlc2l6ZTogZmFsc2UsXG4gICAgICBhbmltYXRpb25TcGVlZDogMzAwLFxuICAgICAgb25DdXN0b21TY3JvbGw6IHVuZGVmaW5lZCxcbiAgICAgIHN3aXBlU3BlZWQ6IDEsXG4gICAgICB3aGVlbFNwZWVkOiA0MCxcbiAgICAgIGZpeGVkVGh1bWJXaWR0aDogdW5kZWZpbmVkLFxuICAgICAgZml4ZWRUaHVtYkhlaWdodDogdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgdmFyIFNjcm9sbGFibGUgPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgdGhpcy5hZGRTY3JvbGxhYmxlQ2xhc3MoKTtcbiAgICAgIHRoaXMuYWRkU2tpbkNsYXNzKCk7XG4gICAgICB0aGlzLmFkZFNjcm9sbEJhckNvbXBvbmVudHMoKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudlNjcm9sbClcbiAgICAgICAgdGhpcy52U2Nyb2xsYmFyID0gbmV3IFNjcm9sbGJhcih0aGlzLCBuZXcgVlNpemluZygpKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaFNjcm9sbClcbiAgICAgICAgdGhpcy5oU2Nyb2xsYmFyID0gbmV3IFNjcm9sbGJhcih0aGlzLCBuZXcgSFNpemluZygpKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuZGF0YShcInNjcm9sbGFibGVcIiwgdGhpcyk7XG4gICAgICB0aGlzLmluaXRLZXlib2FyZFNjcm9sbGluZygpO1xuICAgICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gICAgfVxuXG4gICAgU2Nyb2xsYWJsZS5wcm90b3R5cGUgPSB7XG5cbiAgICAgIGFkZFNjcm9sbGFibGVDbGFzczogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoXCJzY3JvbGxhYmxlXCIpKSB7XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlQWRkZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoXCJzY3JvbGxhYmxlXCIpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTY3JvbGxhYmxlQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsYWJsZUFkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoXCJzY3JvbGxhYmxlXCIpO1xuICAgICAgfSxcblxuICAgICAgYWRkU2tpbkNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YodGhpcy5vcHRpb25zLnNraW4pID09IFwic3RyaW5nXCIgJiYgIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5vcHRpb25zLnNraW4pKSB7XG4gICAgICAgICAgdGhpcy5za2luQ2xhc3NBZGRlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuc2tpbik7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNraW5DbGFzczogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5za2luQ2xhc3NBZGRlZClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5za2luKTtcbiAgICAgIH0sXG5cbiAgICAgIGFkZFNjcm9sbEJhckNvbXBvbmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5hc3NpZ25WaWV3UG9ydCgpO1xuICAgICAgICBpZiAodGhpcy4kdmlld1BvcnQubGVuZ3RoID09IDApIHtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LndyYXBJbm5lcihcIjxkaXYgY2xhc3M9XFxcInZpZXdwb3J0XFxcIiAvPlwiKTtcbiAgICAgICAgICB0aGlzLmFzc2lnblZpZXdQb3J0KCk7XG4gICAgICAgICAgdGhpcy52aWV3UG9ydEFkZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFzc2lnbk92ZXJ2aWV3KCk7XG4gICAgICAgIGlmICh0aGlzLiRvdmVydmlldy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgIHRoaXMuJHZpZXdQb3J0LndyYXBJbm5lcihcIjxkaXYgY2xhc3M9XFxcIm92ZXJ2aWV3XFxcIiAvPlwiKTtcbiAgICAgICAgICB0aGlzLmFzc2lnbk92ZXJ2aWV3KCk7XG4gICAgICAgICAgdGhpcy5vdmVydmlld0FkZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFkZFNjcm9sbEJhcihcInZlcnRpY2FsXCIsIFwicHJlcGVuZFwiKTtcbiAgICAgICAgdGhpcy5hZGRTY3JvbGxCYXIoXCJob3Jpem9udGFsXCIsIFwiYXBwZW5kXCIpO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlU2Nyb2xsYmFyQ29tcG9uZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbGJhcihcInZlcnRpY2FsXCIpO1xuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbGJhcihcImhvcml6b250YWxcIik7XG4gICAgICAgIGlmICh0aGlzLm92ZXJ2aWV3QWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC51bndyYXAoKTtcbiAgICAgICAgaWYgKHRoaXMudmlld1BvcnRBZGRlZClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnVud3JhcCgpO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlU2Nyb2xsYmFyOiBmdW5jdGlvbiAob3JpZW50YXRpb24pIHtcbiAgICAgICAgaWYgKHRoaXNbb3JpZW50YXRpb24gKyBcIlNjcm9sbGJhckFkZGVkXCJdKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQuZmluZChcIi5zY3JvbGwtYmFyLlwiICsgb3JpZW50YXRpb24pLnJlbW92ZSgpO1xuICAgICAgfSxcblxuICAgICAgYXNzaWduVmlld1BvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kdmlld1BvcnQgPSB0aGlzLiRlbGVtZW50LmZpbmQoXCIudmlld3BvcnRcIik7XG4gICAgICB9LFxuXG4gICAgICBhc3NpZ25PdmVydmlldzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRvdmVydmlldyA9IHRoaXMuJHZpZXdQb3J0LmZpbmQoXCIub3ZlcnZpZXdcIik7XG4gICAgICB9LFxuXG4gICAgICBhZGRTY3JvbGxCYXI6IGZ1bmN0aW9uIChvcmllbnRhdGlvbiwgZnVuKSB7XG4gICAgICAgIGlmICh0aGlzLiRlbGVtZW50LmZpbmQoXCIuc2Nyb2xsLWJhci5cIiArIG9yaWVudGF0aW9uKS5sZW5ndGggPT0gMCkge1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnRbZnVuXShcIjxkaXYgY2xhc3M9J3Njcm9sbC1iYXIgXCIgKyBvcmllbnRhdGlvbiArIFwiJz48ZGl2IGNsYXNzPSd0aHVtYic+PC9kaXY+PC9kaXY+XCIpXG4gICAgICAgICAgdGhpc1tvcmllbnRhdGlvbiArIFwiU2Nyb2xsYmFyQWRkZWRcIl0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZXNpemU6IGZ1bmN0aW9uIChrZWVwUG9zaXRpb24pIHtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIucmVzaXplKGtlZXBQb3NpdGlvbik7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnJlc2l6ZShrZWVwUG9zaXRpb24pO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVG86IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy52U2Nyb2xsYmFyLnNjcm9sbFRvRWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIuc2Nyb2xsVG9FbGVtZW50KGVsZW1lbnQpO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVG9YWTogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxUb1goeCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9ZKHkpO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVG9YOiBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAodGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMuaFNjcm9sbGJhci5zY3JvbGxPdmVydmlld1RvKHgsIHRydWUpO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVG9ZOiBmdW5jdGlvbiAoeSkge1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5zY3JvbGxPdmVydmlld1RvKHksIHRydWUpO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsYWJsZUNsYXNzKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlU2tpbkNsYXNzKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsYmFyQ29tcG9uZW50cygpO1xuICAgICAgICB0aGlzLiRlbGVtZW50LmRhdGEoXCJzY3JvbGxhYmxlXCIsIG51bGwpO1xuICAgICAgICB0aGlzLnJlbW92ZUtleWJvYXJkU2Nyb2xsaW5nKCk7XG4gICAgICAgIGlmICh0aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy52U2Nyb2xsYmFyLnJlbW92ZSgpO1xuICAgICAgICBpZiAodGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMuaFNjcm9sbGJhci5yZW1vdmUoKTtcbiAgICAgIH0sXG5cbiAgICAgIHNldEFuaW1hdGlvblNwZWVkOiBmdW5jdGlvbiAoc3BlZWQpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmFuaW1hdGlvblNwZWVkID0gc3BlZWQ7XG4gICAgICB9LFxuXG4gICAgICBpc0luc2lkZTogZnVuY3Rpb24gKGVsZW1lbnQsIHdyYXBwaW5nRWxlbWVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgICB2YXIgJHdyYXBwaW5nRWxlbWVudCA9ICQod3JhcHBpbmdFbGVtZW50KTtcbiAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAkZWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgdmFyIHdyYXBwaW5nRWxlbWVudE9mZnNldCA9ICR3cmFwcGluZ0VsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHJldHVybiAoZWxlbWVudE9mZnNldC50b3AgPj0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LnRvcCkgJiYgKGVsZW1lbnRPZmZzZXQubGVmdCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQubGVmdCkgJiZcbiAgICAgICAgICAoZWxlbWVudE9mZnNldC50b3AgKyAkZWxlbWVudC5oZWlnaHQoKSA8PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQudG9wICsgJHdyYXBwaW5nRWxlbWVudC5oZWlnaHQoKSkgJiZcbiAgICAgICAgICAoZWxlbWVudE9mZnNldC5sZWZ0ICsgJGVsZW1lbnQud2lkdGgoKSA8PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQubGVmdCArICR3cmFwcGluZ0VsZW1lbnQud2lkdGgoKSlcbiAgICAgIH0sXG5cbiAgICAgIGluaXRLZXlib2FyZFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudEtleWRvd24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gX3RoaXMuJGVsZW1lbnRbMF0pIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgICAgICBfdGhpcy52U2Nyb2xsYmFyLmtleVNjcm9sbChldmVudCk7XG4gICAgICAgICAgICBpZiAoX3RoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICAgICAgX3RoaXMuaFNjcm9sbGJhci5rZXlTY3JvbGwoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgICAuYXR0cigndGFiaW5kZXgnLCAnLTEnKVxuICAgICAgICAgIC5rZXlkb3duKHRoaXMuZWxlbWVudEtleWRvd24pO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlS2V5Ym9hcmRTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAgIC5yZW1vdmVBdHRyKCd0YWJpbmRleCcpXG4gICAgICAgICAgLnVuYmluZChcImtleWRvd25cIiwgdGhpcy5lbGVtZW50S2V5ZG93bik7XG4gICAgICB9LFxuXG4gICAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMub25DdXN0b21TY3JvbGwpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5vbihcImN1c3RvbVNjcm9sbFwiLCB0aGlzLm9wdGlvbnMub25DdXN0b21TY3JvbGwpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIFNjcm9sbGJhciA9IGZ1bmN0aW9uIChzY3JvbGxhYmxlLCBzaXppbmcpIHtcbiAgICAgIHRoaXMuc2Nyb2xsYWJsZSA9IHNjcm9sbGFibGU7XG4gICAgICB0aGlzLnNpemluZyA9IHNpemluZ1xuICAgICAgdGhpcy4kc2Nyb2xsQmFyID0gdGhpcy5zaXppbmcuc2Nyb2xsQmFyKHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudCk7XG4gICAgICB0aGlzLiR0aHVtYiA9IHRoaXMuJHNjcm9sbEJhci5maW5kKFwiLnRodW1iXCIpO1xuICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbigwLCAwKTtcbiAgICAgIHRoaXMucmVzaXplKCk7XG4gICAgICB0aGlzLmluaXRNb3VzZU1vdmVTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuaW5pdE1vdXNlV2hlZWxTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuaW5pdFRvdWNoU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmluaXRNb3VzZUNsaWNrU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmluaXRXaW5kb3dSZXNpemUoKTtcbiAgICB9XG5cbiAgICBTY3JvbGxiYXIucHJvdG90eXBlID0ge1xuXG4gICAgICByZXNpemU6IGZ1bmN0aW9uIChrZWVwUG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydC5oZWlnaHQodGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0LCB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudCkpO1xuICAgICAgICB0aGlzLnZpZXdQb3J0U2l6ZSA9IHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCk7XG4gICAgICAgIHRoaXMub3ZlcnZpZXdTaXplID0gdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3KTtcbiAgICAgICAgdGhpcy5yYXRpbyA9IHRoaXMudmlld1BvcnRTaXplIC8gdGhpcy5vdmVydmlld1NpemU7XG4gICAgICAgIHRoaXMuc2l6aW5nLnNpemUodGhpcy4kc2Nyb2xsQmFyLCB0aGlzLnZpZXdQb3J0U2l6ZSk7XG4gICAgICAgIHRoaXMudGh1bWJTaXplID0gdGhpcy5jYWxjdWxhdGVUaHVtYlNpemUoKTtcbiAgICAgICAgdGhpcy5zaXppbmcuc2l6ZSh0aGlzLiR0aHVtYiwgdGhpcy50aHVtYlNpemUpO1xuICAgICAgICB0aGlzLm1heFRodW1iUG9zaXRpb24gPSB0aGlzLmNhbGN1bGF0ZU1heFRodW1iUG9zaXRpb24oKTtcbiAgICAgICAgdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uID0gdGhpcy5jYWxjdWxhdGVNYXhPdmVydmlld1Bvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9ICh0aGlzLm92ZXJ2aWV3U2l6ZSA+IHRoaXMudmlld1BvcnRTaXplKTtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsUGVyY2VudCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IDAuMDtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlZClcbiAgICAgICAgICB0aGlzLnJlc2Nyb2xsKGtlZXBQb3NpdGlvbik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKDAsIDApO1xuICAgICAgICB0aGlzLiRzY3JvbGxCYXIudG9nZ2xlKHRoaXMuZW5hYmxlZCk7XG4gICAgICB9LFxuXG4gICAgICBjYWxjdWxhdGVUaHVtYlNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGZpeGVkU2l6ZSA9IHRoaXMuc2l6aW5nLmZpeGVkVGh1bWJTaXplKHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zKVxuICAgICAgICB2YXIgc2l6ZTtcbiAgICAgICAgaWYgKGZpeGVkU2l6ZSlcbiAgICAgICAgICBzaXplID0gZml4ZWRTaXplO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgc2l6ZSA9IHRoaXMucmF0aW8gKiB0aGlzLnZpZXdQb3J0U2l6ZVxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoc2l6ZSwgdGhpcy5zaXppbmcubWluU2l6ZSh0aGlzLiR0aHVtYikpO1xuICAgICAgfSxcblxuICAgICAgaW5pdE1vdXNlTW92ZVNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLiR0aHVtYi5tb3VzZWRvd24oZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKF90aGlzLmVuYWJsZWQpXG4gICAgICAgICAgICBfdGhpcy5zdGFydE1vdXNlTW92ZVNjcm9sbGluZyhldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRvY3VtZW50TW91c2V1cCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIF90aGlzLnN0b3BNb3VzZU1vdmVTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICAkKGRvY3VtZW50KS5tb3VzZXVwKHRoaXMuZG9jdW1lbnRNb3VzZXVwKTtcbiAgICAgICAgdGhpcy5kb2N1bWVudE1vdXNlbW92ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIF90aGlzLm1vdXNlTW92ZVNjcm9sbChldmVudCk7XG4gICAgICAgIH07XG4gICAgICAgICQoZG9jdW1lbnQpLm1vdXNlbW92ZSh0aGlzLmRvY3VtZW50TW91c2Vtb3ZlKTtcbiAgICAgICAgdGhpcy4kdGh1bWIuY2xpY2soZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlTW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJHRodW1iLnVuYmluZCgpO1xuICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoXCJtb3VzZXVwXCIsIHRoaXMuZG9jdW1lbnRNb3VzZXVwKTtcbiAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKFwibW91c2Vtb3ZlXCIsIHRoaXMuZG9jdW1lbnRNb3VzZW1vdmUpO1xuICAgICAgfSxcblxuICAgICAgaW5pdE1vdXNlV2hlZWxTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50Lm1vdXNld2hlZWwoZnVuY3Rpb24gKGV2ZW50LCBkZWx0YSwgZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLm1vdXNlV2hlZWxTY3JvbGwoZGVsdGFYLCBkZWx0YVkpKSB7XG4gICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVNb3VzZVdoZWVsU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudC51bmJpbmQoXCJtb3VzZXdoZWVsXCIpO1xuICAgICAgfSxcblxuICAgICAgaW5pdFRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICB0aGlzLmVsZW1lbnRUb3VjaHN0YXJ0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMuZW5hYmxlZClcbiAgICAgICAgICAgICAgX3RoaXMuc3RhcnRUb3VjaFNjcm9sbGluZyhldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudFswXS5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0aGlzLmVsZW1lbnRUb3VjaHN0YXJ0KTtcbiAgICAgICAgICB0aGlzLmRvY3VtZW50VG91Y2htb3ZlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBfdGhpcy50b3VjaFNjcm9sbChldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5kb2N1bWVudFRvdWNobW92ZSk7XG4gICAgICAgICAgdGhpcy5lbGVtZW50VG91Y2hlbmQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIF90aGlzLnN0b3BUb3VjaFNjcm9sbGluZyhldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudFswXS5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgdGhpcy5lbGVtZW50VG91Y2hlbmQpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudFswXS5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCB0aGlzLmVsZW1lbnRUb3VjaHN0YXJ0KTtcbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIHRoaXMuZG9jdW1lbnRUb3VjaG1vdmUpO1xuICAgICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudFswXS5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgdGhpcy5lbGVtZW50VG91Y2hlbmQpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBpbml0TW91c2VDbGlja1Njcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnNjcm9sbEJhckNsaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgX3RoaXMubW91c2VDbGlja1Njcm9sbChldmVudCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuJHNjcm9sbEJhci5jbGljayh0aGlzLnNjcm9sbEJhckNsaWNrKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZU1vdXNlQ2xpY2tTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kc2Nyb2xsQmFyLnVuYmluZChcImNsaWNrXCIsIHRoaXMuc2Nyb2xsQmFyQ2xpY2spO1xuICAgICAgfSxcblxuICAgICAgaW5pdFdpbmRvd1Jlc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMudXBkYXRlT25XaW5kb3dSZXNpemUpIHtcbiAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgIHRoaXMud2luZG93UmVzaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMucmVzaXplKCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICAkKHdpbmRvdykucmVzaXplKHRoaXMud2luZG93UmVzaXplKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlV2luZG93UmVzaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQod2luZG93KS51bmJpbmQoXCJyZXNpemVcIiwgdGhpcy53aW5kb3dSZXNpemUpO1xuICAgICAgfSxcblxuICAgICAgaXNLZXlTY3JvbGxpbmc6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5U2Nyb2xsRGVsdGEoa2V5KSAhPSBudWxsO1xuICAgICAgfSxcblxuICAgICAga2V5U2Nyb2xsRGVsdGE6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgZm9yICh2YXIgc2Nyb2xsaW5nS2V5IGluIHRoaXMuc2l6aW5nLnNjcm9sbGluZ0tleXMpXG4gICAgICAgICAgaWYgKHNjcm9sbGluZ0tleSA9PSBrZXkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zaXppbmcuc2Nyb2xsaW5nS2V5c1trZXldKHRoaXMudmlld1BvcnRTaXplKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9LFxuXG4gICAgICBzdGFydE1vdXNlTW92ZVNjcm9sbGluZzogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHRoaXMubW91c2VNb3ZlU2Nyb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgJChcImh0bWxcIikuYWRkQ2xhc3MoXCJub3Qtc2VsZWN0YWJsZVwiKTtcbiAgICAgICAgdGhpcy5zZXRVbnNlbGVjdGFibGUoJChcImh0bWxcIiksIFwib25cIik7XG4gICAgICAgIHRoaXMuc2V0U2Nyb2xsRXZlbnQoZXZlbnQpO1xuICAgICAgfSxcblxuICAgICAgc3RvcE1vdXNlTW92ZVNjcm9sbGluZzogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHRoaXMubW91c2VNb3ZlU2Nyb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICQoXCJodG1sXCIpLnJlbW92ZUNsYXNzKFwibm90LXNlbGVjdGFibGVcIik7XG4gICAgICAgIHRoaXMuc2V0VW5zZWxlY3RhYmxlKCQoXCJodG1sXCIpLCBudWxsKTtcbiAgICAgIH0sXG5cbiAgICAgIHNldFVuc2VsZWN0YWJsZTogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmF0dHIoXCJ1bnNlbGVjdGFibGVcIikgIT0gdmFsdWUpIHtcbiAgICAgICAgICBlbGVtZW50LmF0dHIoXCJ1bnNlbGVjdGFibGVcIiwgdmFsdWUpO1xuICAgICAgICAgIGVsZW1lbnQuZmluZCgnOm5vdChpbnB1dCknKS5hdHRyKCd1bnNlbGVjdGFibGUnLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlTW92ZVNjcm9sbDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLm1vdXNlTW92ZVNjcm9sbGluZykge1xuICAgICAgICAgIHZhciBkZWx0YSA9IHRoaXMuc2l6aW5nLm1vdXNlRGVsdGEodGhpcy5zY3JvbGxFdmVudCwgZXZlbnQpO1xuICAgICAgICAgIHRoaXMuc2Nyb2xsVGh1bWJCeShkZWx0YSk7XG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxFdmVudChldmVudCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHN0YXJ0VG91Y2hTY3JvbGxpbmc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQudG91Y2hlcyAmJiBldmVudC50b3VjaGVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxFdmVudChldmVudC50b3VjaGVzWzBdKTtcbiAgICAgICAgICB0aGlzLnRvdWNoU2Nyb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgdG91Y2hTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAodGhpcy50b3VjaFNjcm9sbGluZyAmJiBldmVudC50b3VjaGVzICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICB2YXIgZGVsdGEgPSAtdGhpcy5zaXppbmcubW91c2VEZWx0YSh0aGlzLnNjcm9sbEV2ZW50LCBldmVudC50b3VjaGVzWzBdKSAqIHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLnN3aXBlU3BlZWQ7XG4gICAgICAgICAgdmFyIHNjcm9sbGVkID0gdGhpcy5zY3JvbGxPdmVydmlld0J5KGRlbHRhKTtcbiAgICAgICAgICBpZiAoc2Nyb2xsZWQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsRXZlbnQoZXZlbnQudG91Y2hlc1swXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBzdG9wVG91Y2hTY3JvbGxpbmc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0aGlzLnRvdWNoU2Nyb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgfSxcblxuICAgICAgbW91c2VXaGVlbFNjcm9sbDogZnVuY3Rpb24gKGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIHZhciBkZWx0YSA9IC10aGlzLnNpemluZy53aGVlbERlbHRhKGRlbHRhWCwgZGVsdGFZKSAqIHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLndoZWVsU3BlZWQ7XG4gICAgICAgIGlmIChkZWx0YSAhPSAwKVxuICAgICAgICAgIHJldHVybiB0aGlzLnNjcm9sbE92ZXJ2aWV3QnkoZGVsdGEpO1xuICAgICAgfSxcblxuICAgICAgbW91c2VDbGlja1Njcm9sbDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBkZWx0YSA9IHRoaXMudmlld1BvcnRTaXplIC0gMjA7XG4gICAgICAgIGlmIChldmVudFtcInBhZ2VcIiArIHRoaXMuc2l6aW5nLnNjcm9sbEF4aXMoKV0gPCB0aGlzLiR0aHVtYi5vZmZzZXQoKVt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0pXG4gICAgICAgIC8vIG1vdXNlIGNsaWNrIG92ZXIgdGh1bWJcbiAgICAgICAgICBkZWx0YSA9IC1kZWx0YTtcbiAgICAgICAgdGhpcy5zY3JvbGxPdmVydmlld0J5KGRlbHRhKTtcbiAgICAgIH0sXG5cbiAgICAgIGtleVNjcm9sbDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBrZXlEb3duID0gZXZlbnQud2hpY2g7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZWQgJiYgdGhpcy5pc0tleVNjcm9sbGluZyhrZXlEb3duKSkge1xuICAgICAgICAgIGlmICh0aGlzLnNjcm9sbE92ZXJ2aWV3QnkodGhpcy5rZXlTY3JvbGxEZWx0YShrZXlEb3duKSkpXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUaHVtYkJ5OiBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnRodW1iUG9zaXRpb24oKTtcbiAgICAgICAgdGh1bWJQb3NpdGlvbiArPSBkZWx0YTtcbiAgICAgICAgdGh1bWJQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25Pck1heCh0aHVtYlBvc2l0aW9uLCB0aGlzLm1heFRodW1iUG9zaXRpb24pO1xuICAgICAgICB2YXIgb2xkU2Nyb2xsUGVyY2VudCA9IHRoaXMuc2Nyb2xsUGVyY2VudDtcbiAgICAgICAgdGhpcy5zY3JvbGxQZXJjZW50ID0gdGh1bWJQb3NpdGlvbiAvIHRoaXMubWF4VGh1bWJQb3NpdGlvbjtcbiAgICAgICAgdmFyIG92ZXJ2aWV3UG9zaXRpb24gPSAodGh1bWJQb3NpdGlvbiAqIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbikgLyB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24ob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbik7XG4gICAgICAgIGlmIChvbGRTY3JvbGxQZXJjZW50ICE9IHRoaXMuc2Nyb2xsUGVyY2VudCkge1xuICAgICAgICAgIHRoaXMudHJpZ2dlckN1c3RvbVNjcm9sbChvbGRTY3JvbGxQZXJjZW50KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuXG4gICAgICB0aHVtYlBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiR0aHVtYi5wb3NpdGlvbigpW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbE92ZXJ2aWV3Qnk6IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMub3ZlcnZpZXdQb3NpdGlvbigpICsgZGVsdGE7XG4gICAgICAgIHJldHVybiB0aGlzLnNjcm9sbE92ZXJ2aWV3VG8ob3ZlcnZpZXdQb3NpdGlvbiwgZmFsc2UpO1xuICAgICAgfSxcblxuICAgICAgb3ZlcnZpZXdQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gLXRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcucG9zaXRpb24oKVt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV07XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxPdmVydmlld1RvOiBmdW5jdGlvbiAob3ZlcnZpZXdQb3NpdGlvbiwgYW5pbWF0ZSkge1xuICAgICAgICBvdmVydmlld1Bvc2l0aW9uID0gdGhpcy5wb3NpdGlvbk9yTWF4KG92ZXJ2aWV3UG9zaXRpb24sIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbik7XG4gICAgICAgIHZhciBvbGRTY3JvbGxQZXJjZW50ID0gdGhpcy5zY3JvbGxQZXJjZW50O1xuICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSBvdmVydmlld1Bvc2l0aW9uIC8gdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uO1xuICAgICAgICB2YXIgdGh1bWJQb3NpdGlvbiA9IHRoaXMuc2Nyb2xsUGVyY2VudCAqIHRoaXMubWF4VGh1bWJQb3NpdGlvbjtcbiAgICAgICAgaWYgKGFuaW1hdGUpXG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbldpdGhBbmltYXRpb24ob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICBpZiAob2xkU2Nyb2xsUGVyY2VudCAhPSB0aGlzLnNjcm9sbFBlcmNlbnQpIHtcbiAgICAgICAgICB0aGlzLnRyaWdnZXJDdXN0b21TY3JvbGwob2xkU2Nyb2xsUGVyY2VudCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG5cbiAgICAgIHBvc2l0aW9uT3JNYXg6IGZ1bmN0aW9uIChwLCBtYXgpIHtcbiAgICAgICAgaWYgKHAgPCAwKVxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICBlbHNlIGlmIChwID4gbWF4KVxuICAgICAgICAgIHJldHVybiBtYXg7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gcDtcbiAgICAgIH0sXG5cbiAgICAgIHRyaWdnZXJDdXN0b21TY3JvbGw6IGZ1bmN0aW9uIChvbGRTY3JvbGxQZXJjZW50KSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudC50cmlnZ2VyKFwiY3VzdG9tU2Nyb2xsXCIsIHtcbiAgICAgICAgICAgIHNjcm9sbEF4aXM6IHRoaXMuc2l6aW5nLnNjcm9sbEF4aXMoKSxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogdGhpcy5zaXppbmcuc2Nyb2xsRGlyZWN0aW9uKG9sZFNjcm9sbFBlcmNlbnQsIHRoaXMuc2Nyb2xsUGVyY2VudCksXG4gICAgICAgICAgICBzY3JvbGxQZXJjZW50OiB0aGlzLnNjcm9sbFBlcmNlbnQgKiAxMDBcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9LFxuXG4gICAgICByZXNjcm9sbDogZnVuY3Rpb24gKGtlZXBQb3NpdGlvbikge1xuICAgICAgICBpZiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgICAgdmFyIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uT3JNYXgodGhpcy5vdmVydmlld1Bvc2l0aW9uKCksIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbik7XG4gICAgICAgICAgdGhpcy5zY3JvbGxQZXJjZW50ID0gb3ZlcnZpZXdQb3NpdGlvbiAvIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbjtcbiAgICAgICAgICB2YXIgdGh1bWJQb3NpdGlvbiA9IHRoaXMuc2Nyb2xsUGVyY2VudCAqIHRoaXMubWF4VGh1bWJQb3NpdGlvbjtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy5zY3JvbGxQZXJjZW50ICogdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gdGhpcy5zY3JvbGxQZXJjZW50ICogdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uO1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24ob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHNldFNjcm9sbFBvc2l0aW9uOiBmdW5jdGlvbiAob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbikge1xuICAgICAgICB0aGlzLiR0aHVtYi5jc3ModGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCksIHRodW1iUG9zaXRpb24gKyBcInB4XCIpO1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3LmNzcyh0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKSwgLW92ZXJ2aWV3UG9zaXRpb24gKyBcInB4XCIpO1xuICAgICAgfSxcblxuICAgICAgc2V0U2Nyb2xsUG9zaXRpb25XaXRoQW5pbWF0aW9uOiBmdW5jdGlvbiAob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbikge1xuICAgICAgICB2YXIgdGh1bWJBbmltYXRpb25PcHRzID0ge307XG4gICAgICAgIHZhciBvdmVydmlld0FuaW1hdGlvbk9wdHMgPSB7fTtcbiAgICAgICAgdGh1bWJBbmltYXRpb25PcHRzW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXSA9IHRodW1iUG9zaXRpb24gKyBcInB4XCI7XG4gICAgICAgIHRoaXMuJHRodW1iLmFuaW1hdGUodGh1bWJBbmltYXRpb25PcHRzLCB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy5hbmltYXRpb25TcGVlZCk7XG4gICAgICAgIG92ZXJ2aWV3QW5pbWF0aW9uT3B0c1t0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0gPSAtb3ZlcnZpZXdQb3NpdGlvbiArIFwicHhcIjtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldy5hbmltYXRlKG92ZXJ2aWV3QW5pbWF0aW9uT3B0cywgdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMuYW5pbWF0aW9uU3BlZWQpO1xuICAgICAgfSxcblxuICAgICAgY2FsY3VsYXRlTWF4VGh1bWJQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaXppbmcuc2l6ZSh0aGlzLiRzY3JvbGxCYXIpIC0gdGhpcy50aHVtYlNpemU7XG4gICAgICB9LFxuXG4gICAgICBjYWxjdWxhdGVNYXhPdmVydmlld1Bvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcpIC0gdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0KTtcbiAgICAgIH0sXG5cbiAgICAgIHNldFNjcm9sbEV2ZW50OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGF0dHIgPSBcInBhZ2VcIiArIHRoaXMuc2l6aW5nLnNjcm9sbEF4aXMoKTtcbiAgICAgICAgaWYgKCF0aGlzLnNjcm9sbEV2ZW50IHx8IHRoaXMuc2Nyb2xsRXZlbnRbYXR0cl0gIT0gZXZlbnRbYXR0cl0pXG4gICAgICAgICAgdGhpcy5zY3JvbGxFdmVudCA9IHtwYWdlWDogZXZlbnQucGFnZVgsIHBhZ2VZOiBldmVudC5wYWdlWX07XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb0VsZW1lbnQ6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIGlmICh0aGlzLnNpemluZy5pc0luc2lkZSgkZWxlbWVudCwgdGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldykgJiYgIXRoaXMuc2l6aW5nLmlzSW5zaWRlKCRlbGVtZW50LCB0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0KSkge1xuICAgICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgICAgdmFyIG92ZXJ2aWV3T2Zmc2V0ID0gdGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldy5vZmZzZXQoKTtcbiAgICAgICAgICB2YXIgdmlld1BvcnRPZmZzZXQgPSB0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0Lm9mZnNldCgpO1xuICAgICAgICAgIHRoaXMuc2Nyb2xsT3ZlcnZpZXdUbyhlbGVtZW50T2Zmc2V0W3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXSAtIG92ZXJ2aWV3T2Zmc2V0W3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlbW92ZU1vdXNlTW92ZVNjcm9sbGluZygpO1xuICAgICAgICB0aGlzLnJlbW92ZU1vdXNlV2hlZWxTY3JvbGxpbmcoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVUb3VjaFNjcm9sbGluZygpO1xuICAgICAgICB0aGlzLnJlbW92ZU1vdXNlQ2xpY2tTY3JvbGxpbmcoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVXaW5kb3dSZXNpemUoKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHZhciBIU2l6aW5nID0gZnVuY3Rpb24gKCkge1xuICAgIH1cblxuICAgIEhTaXppbmcucHJvdG90eXBlID0ge1xuICAgICAgc2l6ZTogZnVuY3Rpb24gKCRlbCwgYXJnKSB7XG4gICAgICAgIGlmIChhcmcpXG4gICAgICAgICAgcmV0dXJuICRlbC53aWR0aChhcmcpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRlbC53aWR0aCgpO1xuICAgICAgfSxcblxuICAgICAgbWluU2l6ZTogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoJGVsLmNzcyhcIm1pbi13aWR0aFwiKSkgfHwgMDtcbiAgICAgIH0sXG5cbiAgICAgIGZpeGVkVGh1bWJTaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5maXhlZFRodW1iV2lkdGg7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxCYXI6IGZ1bmN0aW9uICgkZWwpIHtcbiAgICAgICAgcmV0dXJuICRlbC5maW5kKFwiLnNjcm9sbC1iYXIuaG9yaXpvbnRhbFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlRGVsdGE6IGZ1bmN0aW9uIChldmVudDEsIGV2ZW50Mikge1xuICAgICAgICByZXR1cm4gZXZlbnQyLnBhZ2VYIC0gZXZlbnQxLnBhZ2VYO1xuICAgICAgfSxcblxuICAgICAgb2Zmc2V0Q29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcImxlZnRcIjtcbiAgICAgIH0sXG5cbiAgICAgIHdoZWVsRGVsdGE6IGZ1bmN0aW9uIChkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICByZXR1cm4gZGVsdGFYO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsQXhpczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJYXCI7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxEaXJlY3Rpb246IGZ1bmN0aW9uIChvbGRQZXJjZW50LCBuZXdQZXJjZW50KSB7XG4gICAgICAgIHJldHVybiBvbGRQZXJjZW50IDwgbmV3UGVyY2VudCA/IFwicmlnaHRcIiA6IFwibGVmdFwiO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsaW5nS2V5czoge1xuICAgICAgICAzNzogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiAtMTA7IC8vYXJyb3cgbGVmdFxuICAgICAgICB9LFxuICAgICAgICAzOTogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiAxMDsgLy9hcnJvdyByaWdodFxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBpc0luc2lkZTogZnVuY3Rpb24gKGVsZW1lbnQsIHdyYXBwaW5nRWxlbWVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgICB2YXIgJHdyYXBwaW5nRWxlbWVudCA9ICQod3JhcHBpbmdFbGVtZW50KTtcbiAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAkZWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgdmFyIHdyYXBwaW5nRWxlbWVudE9mZnNldCA9ICR3cmFwcGluZ0VsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHJldHVybiAoZWxlbWVudE9mZnNldC5sZWZ0ID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC5sZWZ0KSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LmxlZnQgKyAkZWxlbWVudC53aWR0aCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC5sZWZ0ICsgJHdyYXBwaW5nRWxlbWVudC53aWR0aCgpKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHZhciBWU2l6aW5nID0gZnVuY3Rpb24gKCkge1xuICAgIH1cblxuICAgIFZTaXppbmcucHJvdG90eXBlID0ge1xuXG4gICAgICBzaXplOiBmdW5jdGlvbiAoJGVsLCBhcmcpIHtcbiAgICAgICAgaWYgKGFyZylcbiAgICAgICAgICByZXR1cm4gJGVsLmhlaWdodChhcmcpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuICRlbC5oZWlnaHQoKTtcbiAgICAgIH0sXG5cbiAgICAgIG1pblNpemU6IGZ1bmN0aW9uICgkZWwpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KCRlbC5jc3MoXCJtaW4taGVpZ2h0XCIpKSB8fCAwO1xuICAgICAgfSxcblxuICAgICAgZml4ZWRUaHVtYlNpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmZpeGVkVGh1bWJIZWlnaHQ7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxCYXI6IGZ1bmN0aW9uICgkZWwpIHtcbiAgICAgICAgcmV0dXJuICRlbC5maW5kKFwiLnNjcm9sbC1iYXIudmVydGljYWxcIik7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZURlbHRhOiBmdW5jdGlvbiAoZXZlbnQxLCBldmVudDIpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50Mi5wYWdlWSAtIGV2ZW50MS5wYWdlWTtcbiAgICAgIH0sXG5cbiAgICAgIG9mZnNldENvbXBvbmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJ0b3BcIjtcbiAgICAgIH0sXG5cbiAgICAgIHdoZWVsRGVsdGE6IGZ1bmN0aW9uIChkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICByZXR1cm4gZGVsdGFZO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsQXhpczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJZXCI7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxEaXJlY3Rpb246IGZ1bmN0aW9uIChvbGRQZXJjZW50LCBuZXdQZXJjZW50KSB7XG4gICAgICAgIHJldHVybiBvbGRQZXJjZW50IDwgbmV3UGVyY2VudCA/IFwiZG93blwiIDogXCJ1cFwiO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsaW5nS2V5czoge1xuICAgICAgICAzODogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiAtMTA7IC8vYXJyb3cgdXBcbiAgICAgICAgfSxcbiAgICAgICAgNDA6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gMTA7IC8vYXJyb3cgZG93blxuICAgICAgICB9LFxuICAgICAgICAzMzogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiAtKHZpZXdQb3J0U2l6ZSAtIDIwKTsgLy9wYWdlIHVwXG4gICAgICAgIH0sXG4gICAgICAgIDM0OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIHZpZXdQb3J0U2l6ZSAtIDIwOyAvL3BhZ2UgZG93blxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBpc0luc2lkZTogZnVuY3Rpb24gKGVsZW1lbnQsIHdyYXBwaW5nRWxlbWVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgICB2YXIgJHdyYXBwaW5nRWxlbWVudCA9ICQod3JhcHBpbmdFbGVtZW50KTtcbiAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAkZWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgdmFyIHdyYXBwaW5nRWxlbWVudE9mZnNldCA9ICR3cmFwcGluZ0VsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHJldHVybiAoZWxlbWVudE9mZnNldC50b3AgPj0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LnRvcCkgJiZcbiAgICAgICAgICAoZWxlbWVudE9mZnNldC50b3AgKyAkZWxlbWVudC5oZWlnaHQoKSA8PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQudG9wICsgJHdyYXBwaW5nRWxlbWVudC5oZWlnaHQoKSk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChvcHRpb25zID09IHVuZGVmaW5lZClcbiAgICAgICAgb3B0aW9ucyA9IGRlZmF1bHRPcHRpb25zO1xuICAgICAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHZhciBzY3JvbGxhYmxlID0gJCh0aGlzKS5kYXRhKFwic2Nyb2xsYWJsZVwiKTtcbiAgICAgICAgaWYgKHNjcm9sbGFibGUpXG4gICAgICAgICAgc2Nyb2xsYWJsZVtvcHRpb25zXShhcmdzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHR5cGVvZihvcHRpb25zKSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZChkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIG5ldyBTY3JvbGxhYmxlKCQodGhpcyksIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBcIkludmFsaWQgdHlwZSBvZiBvcHRpb25zXCI7XG4gICAgfSk7XG5cbiAgfVxuICA7XG5cbn0pXG4gIChqUXVlcnkpO1xuXG4oZnVuY3Rpb24gKCQpIHtcblxuICB2YXIgdHlwZXMgPSBbJ0RPTU1vdXNlU2Nyb2xsJywgJ21vdXNld2hlZWwnXTtcblxuICBpZiAoJC5ldmVudC5maXhIb29rcykge1xuICAgIGZvciAodmFyIGkgPSB0eXBlcy5sZW5ndGg7IGk7KSB7XG4gICAgICAkLmV2ZW50LmZpeEhvb2tzWyB0eXBlc1stLWldIF0gPSAkLmV2ZW50Lm1vdXNlSG9va3M7XG4gICAgfVxuICB9XG5cbiAgJC5ldmVudC5zcGVjaWFsLm1vdXNld2hlZWwgPSB7XG4gICAgc2V0dXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHR5cGVzLmxlbmd0aDsgaTspIHtcbiAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIodHlwZXNbLS1pXSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9ubW91c2V3aGVlbCA9IGhhbmRsZXI7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHRlYXJkb3duOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSB0eXBlcy5sZW5ndGg7IGk7KSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGVzWy0taV0sIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vbm1vdXNld2hlZWwgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkLmZuLmV4dGVuZCh7XG4gICAgbW91c2V3aGVlbDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICByZXR1cm4gZm4gPyB0aGlzLmJpbmQoXCJtb3VzZXdoZWVsXCIsIGZuKSA6IHRoaXMudHJpZ2dlcihcIm1vdXNld2hlZWxcIik7XG4gICAgfSxcblxuICAgIHVubW91c2V3aGVlbDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICByZXR1cm4gdGhpcy51bmJpbmQoXCJtb3VzZXdoZWVsXCIsIGZuKTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xuICAgIHZhciBvcmdFdmVudCA9IGV2ZW50IHx8IHdpbmRvdy5ldmVudCwgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZGVsdGEgPSAwLCByZXR1cm5WYWx1ZSA9IHRydWUsIGRlbHRhWCA9IDAsIGRlbHRhWSA9IDA7XG4gICAgZXZlbnQgPSAkLmV2ZW50LmZpeChvcmdFdmVudCk7XG4gICAgZXZlbnQudHlwZSA9IFwibW91c2V3aGVlbFwiO1xuXG4gICAgLy8gT2xkIHNjaG9vbCBzY3JvbGx3aGVlbCBkZWx0YVxuICAgIGlmIChvcmdFdmVudC53aGVlbERlbHRhKSB7XG4gICAgICBkZWx0YSA9IG9yZ0V2ZW50LndoZWVsRGVsdGEgLyAxMjA7XG4gICAgfVxuICAgIGlmIChvcmdFdmVudC5kZXRhaWwpIHtcbiAgICAgIGRlbHRhID0gLW9yZ0V2ZW50LmRldGFpbCAvIDM7XG4gICAgfVxuXG4gICAgLy8gTmV3IHNjaG9vbCBtdWx0aWRpbWVuc2lvbmFsIHNjcm9sbCAodG91Y2hwYWRzKSBkZWx0YXNcbiAgICBkZWx0YVkgPSBkZWx0YTtcblxuICAgIC8vIEdlY2tvXG4gICAgaWYgKG9yZ0V2ZW50LmF4aXMgIT09IHVuZGVmaW5lZCAmJiBvcmdFdmVudC5heGlzID09PSBvcmdFdmVudC5IT1JJWk9OVEFMX0FYSVMpIHtcbiAgICAgIGRlbHRhWSA9IDA7XG4gICAgICBkZWx0YVggPSBkZWx0YTtcbiAgICB9XG5cbiAgICAvLyBXZWJraXRcbiAgICBpZiAob3JnRXZlbnQud2hlZWxEZWx0YVkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZGVsdGFZID0gb3JnRXZlbnQud2hlZWxEZWx0YVkgLyAxMjA7XG4gICAgfVxuICAgIGlmIChvcmdFdmVudC53aGVlbERlbHRhWCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkZWx0YVggPSBvcmdFdmVudC53aGVlbERlbHRhWCAvIDEyMDtcbiAgICB9XG5cbiAgICAvLyBBZGQgZXZlbnQgYW5kIGRlbHRhIHRvIHRoZSBmcm9udCBvZiB0aGUgYXJndW1lbnRzXG4gICAgYXJncy51bnNoaWZ0KGV2ZW50LCBkZWx0YSwgZGVsdGFYLCBkZWx0YVkpO1xuXG4gICAgcmV0dXJuICgkLmV2ZW50LmRpc3BhdGNoIHx8ICQuZXZlbnQuaGFuZGxlKS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG59KShqUXVlcnkpO1xuIiwiLy8gU3RvcmFnZSBjYWNoZS5cclxudmFyIGNhY2hlID0ge307XHJcbi8vIFRoZSBzdG9yZSBoYW5kbGluZyBleHBpcmF0aW9uIG9mIGRhdGEuXHJcbnZhciBleHBpcmVzU3RvcmUgPSBuZXcgU3RvcmUoe1xyXG5cdG5hbWVzcGFjZTogJ19fc3RvcmFnZS13cmFwcGVyOmV4cGlyZXMnXHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIFN0b3JhZ2Ugd3JhcHBlciBmb3IgbWFraW5nIHJvdXRpbmUgc3RvcmFnZSBjYWxscyBzdXBlciBlYXN5LlxyXG4gKiBAY2xhc3MgU3RvcmVcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gICAgICAgICAgICAgICAgICAgICBUaGUgb3B0aW9ucyBmb3IgdGhlIHN0b3JlLiBPcHRpb25zIG5vdCBvdmVycmlkZGVuIHdpbGwgdXNlIHRoZSBkZWZhdWx0cy5cclxuICogQHBhcmFtIHttaXhlZH0gIFtvcHRpb25zLm5hbWVzcGFjZT0nJ10gICAgICAgIFNlZSB7eyNjcm9zc0xpbmsgXCJTdG9yZS9zZXROYW1lc3BhY2VcIn19U3RvcmUjc2V0TmFtZXNwYWNle3svY3Jvc3NMaW5rfX1cclxuICogQHBhcmFtIHttaXhlZH0gIFtvcHRpb25zLnN0b3JhZ2VUeXBlPSdsb2NhbCddIFNlZSB7eyNjcm9zc0xpbmsgXCJTdG9yZS9zZXRTdG9yYWdlVHlwZVwifX1TdG9yZSNzZXRTdG9yYWdlVHlwZXt7L2Nyb3NzTGlua319XHJcbiAqL1xyXG5mdW5jdGlvbiBTdG9yZShvcHRpb25zKSB7XHJcblx0dmFyIHNldHRpbmdzID0ge1xyXG5cdFx0bmFtZXNwYWNlOiAnJyxcclxuXHRcdHN0b3JhZ2VUeXBlOiAnbG9jYWwnXHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgc3RvcmFnZSBuYW1lc3BhY2UuXHJcblx0ICogQG1ldGhvZCBzZXROYW1lc3BhY2VcclxuXHQgKiBAcGFyYW0ge3N0cmluZ3xmYWxzZXxudWxsfSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSB0byB3b3JrIHVuZGVyLiBUbyB1c2Ugbm8gbmFtZXNwYWNlIChlLmcuIGdsb2JhbCBuYW1lc3BhY2UpLCBwYXNzIGluIGBmYWxzZWAgb3IgYG51bGxgIG9yIGFuIGVtcHR5IHN0cmluZy5cclxuXHQgKi9cclxuXHR0aGlzLnNldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHRcdHZhciB2YWxpZE5hbWVzcGFjZSA9IC9eW1xcdy06XSskLztcclxuXHRcdC8vIE5vIG5hbWVzcGFjZS5cclxuXHRcdGlmIChuYW1lc3BhY2UgPT09IGZhbHNlIHx8IG5hbWVzcGFjZSA9PSBudWxsIHx8IG5hbWVzcGFjZSA9PT0gJycpIHtcclxuXHRcdFx0c2V0dGluZ3MubmFtZXNwYWNlID0gJyc7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGlmICh0eXBlb2YgbmFtZXNwYWNlICE9PSAnc3RyaW5nJyB8fCAhdmFsaWROYW1lc3BhY2UudGVzdChuYW1lc3BhY2UpKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBuYW1lc3BhY2UuJyk7XHJcblx0XHR9XHJcblx0XHRzZXR0aW5ncy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0cyB0aGUgY3VycmVudCBzdG9yYWdlIG5hbWVzcGFjZS5cclxuXHQgKiBAbWV0aG9kIGdldE5hbWVzcGFjZVxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0TmFtZXNwYWNlID0gZnVuY3Rpb24gKGluY2x1ZGVTZXBhcmF0b3IpIHtcclxuXHRcdGlmIChpbmNsdWRlU2VwYXJhdG9yICYmIHNldHRpbmdzLm5hbWVzcGFjZSAhPT0gJycpIHtcclxuXHRcdFx0cmV0dXJuIHNldHRpbmdzLm5hbWVzcGFjZSArICc6JztcclxuXHRcdH1cclxuXHRcdHJldHVybiBzZXR0aW5ncy5uYW1lc3BhY2U7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSB0eXBlIG9mIHN0b3JhZ2UgdG8gdXNlLlxyXG5cdCAqIEBtZXRob2Qgc2V0U3RvcmFnZVR5cGVcclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBUaGUgdHlwZSBvZiBzdG9yYWdlIHRvIHVzZS4gVXNlIGBzZXNzaW9uYCBmb3IgYHNlc3Npb25TdG9yYWdlYCBhbmQgYGxvY2FsYCBmb3IgYGxvY2FsU3RvcmFnZWAuXHJcblx0ICovXHJcblx0dGhpcy5zZXRTdG9yYWdlVHlwZSA9IGZ1bmN0aW9uICh0eXBlKSB7XHJcblx0XHRpZiAoWydzZXNzaW9uJywgJ2xvY2FsJ10uaW5kZXhPZih0eXBlKSA8IDApIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0b3JhZ2UgdHlwZS4nKTtcclxuXHRcdH1cclxuXHRcdHNldHRpbmdzLnN0b3JhZ2VUeXBlID0gdHlwZTtcclxuXHR9O1xyXG5cdC8qKlxyXG5cdCAqIEdldCB0aGUgdHlwZSBvZiBzdG9yYWdlIGJlaW5nIHVzZWQuXHJcblx0ICogQG1ldGhvZCBnZXRTdG9yYWdlVHlwZVxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gVGhlIHR5cGUgb2Ygc3RvcmFnZSBiZWluZyB1c2VkLlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0U3RvcmFnZVR5cGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gc2V0dGluZ3Muc3RvcmFnZVR5cGU7XHJcblx0fTtcclxuXHJcblx0Ly8gT3ZlcnJpZGUgZGVmYXVsdCBzZXR0aW5ncy5cclxuXHRpZiAob3B0aW9ucykge1xyXG5cdFx0Zm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcclxuXHRcdFx0c3dpdGNoIChrZXkpIHtcclxuXHRcdFx0XHRjYXNlICduYW1lc3BhY2UnOlxyXG5cdFx0XHRcdFx0dGhpcy5zZXROYW1lc3BhY2Uob3B0aW9uc1trZXldKTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgJ3N0b3JhZ2VUeXBlJzpcclxuXHRcdFx0XHRcdHRoaXMuc2V0U3RvcmFnZVR5cGUob3B0aW9uc1trZXldKTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgYWN0dWFsIGhhbmRsZXIgdG8gdXNlXHJcbiAqIEBtZXRob2QgZ2V0U3RvcmFnZUhhbmRsZXJcclxuICogQHJldHVybiB7bWl4ZWR9IFRoZSBzdG9yYWdlIGhhbmRsZXIuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZ2V0U3RvcmFnZUhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGhhbmRsZXJzID0ge1xyXG5cdFx0J2xvY2FsJzogbG9jYWxTdG9yYWdlLFxyXG5cdFx0J3Nlc3Npb24nOiBzZXNzaW9uU3RvcmFnZVxyXG5cdH07XHJcblx0cmV0dXJuIGhhbmRsZXJzW3RoaXMuZ2V0U3RvcmFnZVR5cGUoKV07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBmdWxsIHN0b3JhZ2UgbmFtZSBmb3IgYSBrZXksIGluY2x1ZGluZyB0aGUgbmFtZXNwYWNlLCBpZiBhbnkuXHJcbiAqIEBtZXRob2QgZ2V0U3RvcmFnZUtleVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGtleSBUaGUgc3RvcmFnZSBrZXkgbmFtZS5cclxuICogQHJldHVybiB7c3RyaW5nfSAgICAgVGhlIGZ1bGwgc3RvcmFnZSBuYW1lIHRoYXQgaXMgdXNlZCBieSB0aGUgc3RvcmFnZSBtZXRob2RzLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldFN0b3JhZ2VLZXkgPSBmdW5jdGlvbiAoa2V5KSB7XHJcblx0aWYgKCFrZXkgfHwgdHlwZW9mIGtleSAhPT0gJ3N0cmluZycgfHwga2V5Lmxlbmd0aCA8IDEpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignS2V5IG11c3QgYmUgYSBzdHJpbmcuJyk7XHJcblx0fVxyXG5cdHJldHVybiB0aGlzLmdldE5hbWVzcGFjZSh0cnVlKSArIGtleTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGEgc3RvcmFnZSBpdGVtIGZyb20gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIGdldFxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9IGtleSAgICAgICAgICBUaGUga2V5IHRoYXQgdGhlIGRhdGEgY2FuIGJlIGFjY2Vzc2VkIHVuZGVyLlxyXG4gKiBAcGFyYW0gIHttaXhlZH0gIGRlZmF1bHRWYWx1ZSBUaGUgZGVmYXVsdCB2YWx1ZSB0byByZXR1cm4gaW4gY2FzZSB0aGUgc3RvcmFnZSB2YWx1ZSBpcyBub3Qgc2V0IG9yIGBudWxsYC5cclxuICogQHJldHVybiB7bWl4ZWR9ICAgICAgICAgICAgICAgVGhlIGRhdGEgZm9yIHRoZSBzdG9yYWdlLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXksIGRlZmF1bHRWYWx1ZSkge1xyXG5cdC8vIFByZXZlbnQgcmVjdXJzaW9uLiBPbmx5IGNoZWNrIGV4cGlyZSBkYXRlIGlmIGl0IGlzbid0IGNhbGxlZCBmcm9tIGBleHBpcmVzU3RvcmVgLlxyXG5cdGlmICh0aGlzICE9PSBleHBpcmVzU3RvcmUpIHtcclxuXHRcdC8vIENoZWNrIGlmIGtleSBpcyBleHBpcmVkLlxyXG5cdFx0dmFyIGV4cGlyZURhdGUgPSBleHBpcmVzU3RvcmUuZ2V0KHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxuXHRcdGlmIChleHBpcmVEYXRlICE9PSBudWxsICYmIGV4cGlyZURhdGUuZ2V0VGltZSgpIDwgRGF0ZS5ub3coKSkge1xyXG5cdFx0XHQvLyBFeHBpcmVkLCByZW1vdmUgaXQuXHJcblx0XHRcdHRoaXMucmVtb3ZlKGtleSk7XHJcblx0XHRcdGV4cGlyZXNTdG9yZS5yZW1vdmUodGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gQ2FjaGVkLCByZWFkIGZyb20gbWVtb3J5LlxyXG5cdGlmIChjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gIT0gbnVsbCkge1xyXG5cdFx0cmV0dXJuIGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXTtcclxuXHR9XHJcblxyXG5cdHZhciB2YWwgPSB0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkuZ2V0SXRlbSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcblxyXG5cdC8vIFZhbHVlIGRvZXNuJ3QgZXhpc3QgYW5kIHdlIGhhdmUgYSBkZWZhdWx0LCByZXR1cm4gZGVmYXVsdC5cclxuXHRpZiAodmFsID09PSBudWxsICYmIHR5cGVvZiBkZWZhdWx0VmFsdWUgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRyZXR1cm4gZGVmYXVsdFZhbHVlO1xyXG5cdH1cclxuXHJcblx0Ly8gT25seSBwcmUtcHJvY2VzcyBzdHJpbmdzLlxyXG5cdGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xyXG5cdFx0Ly8gSGFuZGxlIFJlZ0V4cHMuXHJcblx0XHRpZiAodmFsLmluZGV4T2YoJ35SZWdFeHA6JykgPT09IDApIHtcclxuXHRcdFx0dmFyIG1hdGNoZXMgPSAvXn5SZWdFeHA6KFtnaW1dKj8pOiguKikvLmV4ZWModmFsKTtcclxuXHRcdFx0dmFsID0gbmV3IFJlZ0V4cChtYXRjaGVzWzJdLCBtYXRjaGVzWzFdKTtcclxuXHRcdH1cclxuXHRcdC8vIEhhbmRsZSBEYXRlcy5cclxuXHRcdGVsc2UgaWYgKHZhbC5pbmRleE9mKCd+RGF0ZTonKSA9PT0gMCkge1xyXG5cdFx0XHR2YWwgPSBuZXcgRGF0ZSh2YWwucmVwbGFjZSgvXn5EYXRlOi8sICcnKSk7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgbnVtYmVycy5cclxuXHRcdGVsc2UgaWYgKHZhbC5pbmRleE9mKCd+TnVtYmVyOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IHBhcnNlSW50KHZhbC5yZXBsYWNlKC9efk51bWJlcjovLCAnJyksIDEwKTtcclxuXHRcdH1cclxuXHRcdC8vIEhhbmRsZSBib29sZWFucy5cclxuXHRcdGVsc2UgaWYgKHZhbC5pbmRleE9mKCd+Qm9vbGVhbjonKSA9PT0gMCkge1xyXG5cdFx0XHR2YWwgPSB2YWwucmVwbGFjZSgvXn5Cb29sZWFuOi8sICcnKSA9PT0gJ3RydWUnO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIG9iamVjdHMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfkpTT046JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gdmFsLnJlcGxhY2UoL15+SlNPTjovLCAnJyk7XHJcblx0XHRcdC8vIFRyeSBwYXJzaW5nIGl0LlxyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHZhbCA9IEpTT04ucGFyc2UodmFsKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBQYXJzaW5nIHdlbnQgd3JvbmcgKGludmFsaWQgSlNPTiksIHJldHVybiBkZWZhdWx0IG9yIG51bGwuXHJcblx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBkZWZhdWx0VmFsdWUgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZGVmYXVsdFZhbHVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gUmV0dXJuIGl0LlxyXG5cdGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSA9IHZhbDtcclxuXHRyZXR1cm4gdmFsO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgYSBzdG9yYWdlIGl0ZW0gb24gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIHNldFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICBrZXkgICAgICAgVGhlIGtleSB0aGF0IHRoZSBkYXRhIGNhbiBiZSBhY2Nlc3NlZCB1bmRlci5cclxuICogQHBhcmFtIHttaXhlZH0gICAgICAgdmFsICAgICAgIFRoZSB2YWx1ZSB0byBzdG9yZS4gTWF5IGJlIHRoZSBmb2xsb3dpbmcgdHlwZXMgb2YgZGF0YTogYFJlZ0V4cGAsIGBEYXRlYCwgYE9iamVjdGAsIGBTdHJpbmdgLCBgQm9vbGVhbmAsIGBOdW1iZXJgXHJcbiAqIEBwYXJhbSB7RGF0ZXxudW1iZXJ9IFtleHBpcmVzXSBUaGUgZGF0ZSBpbiB0aGUgZnV0dXJlIHRvIGV4cGlyZSwgb3IgcmVsYXRpdmUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBmcm9tIGBEYXRlI25vd2AgdG8gZXhwaXJlLlxyXG4gKlxyXG4gKiBOb3RlOiBUaGlzIGNvbnZlcnRzIHNwZWNpYWwgZGF0YSB0eXBlcyB0aGF0IG5vcm1hbGx5IGNhbid0IGJlIHN0b3JlZCBpbiB0aGUgZm9sbG93aW5nIHdheTpcclxuICogXHJcbiAqIC0gYFJlZ0V4cGA6IHByZWZpeGVkIHdpdGggdHlwZSwgZmxhZ3Mgc3RvcmVkLCBhbmQgc291cmNlIHN0b3JlZCBhcyBzdHJpbmcuXHJcbiAqIC0gYERhdGVgOiBwcmVmaXhlZCB3aXRoIHR5cGUsIHN0b3JlZCBhcyBzdHJpbmcgdXNpbmcgYERhdGUjdG9TdHJpbmdgLlxyXG4gKiAtIGBPYmplY3RgOiBwcmVmaXhlZCB3aXRoIFwiSlNPTlwiIGluZGljYXRvciwgc3RvcmVkIGFzIHN0cmluZyB1c2luZyBgSlNPTiNzdHJpbmdpZnlgLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbCwgZXhwaXJlcykge1xyXG5cdHZhciBwYXJzZWRWYWwgPSBudWxsO1xyXG5cdC8vIEhhbmRsZSBSZWdFeHBzLlxyXG5cdGlmICh2YWwgaW5zdGFuY2VvZiBSZWdFeHApIHtcclxuXHRcdHZhciBmbGFncyA9IFtcclxuXHRcdFx0dmFsLmdsb2JhbCA/ICdnJyA6ICcnLFxyXG5cdFx0XHR2YWwuaWdub3JlQ2FzZSA/ICdpJyA6ICcnLFxyXG5cdFx0XHR2YWwubXVsdGlsaW5lID8gJ20nIDogJycsXHJcblx0XHRdLmpvaW4oJycpO1xyXG5cdFx0cGFyc2VkVmFsID0gJ35SZWdFeHA6JyArIGZsYWdzICsgJzonICsgdmFsLnNvdXJjZTtcclxuXHR9XHJcblx0Ly8gSGFuZGxlIERhdGVzLlxyXG5cdGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIERhdGUpIHtcclxuXHRcdHBhcnNlZFZhbCA9ICd+RGF0ZTonICsgdmFsLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBvYmplY3RzLlxyXG5cdGVsc2UgaWYgKHZhbCA9PT0gT2JqZWN0KHZhbCkpIHtcclxuXHRcdHBhcnNlZFZhbCA9ICd+SlNPTjonICsgSlNPTi5zdHJpbmdpZnkodmFsKTtcclxuXHR9XHJcblx0Ly8gSGFuZGxlIG51bWJlcnMuXHJcblx0ZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcclxuXHRcdHBhcnNlZFZhbCA9ICd+TnVtYmVyOicgKyB2YWwudG9TdHJpbmcoKTtcclxuXHR9XHJcblx0Ly8gSGFuZGxlIGJvb2xlYW5zLlxyXG5cdGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdib29sZWFuJykge1xyXG5cdFx0cGFyc2VkVmFsID0gJ35Cb29sZWFuOicgKyB2YWwudG9TdHJpbmcoKTtcclxuXHR9XHJcblx0Ly8gSGFuZGxlIHN0cmluZ3MuXHJcblx0ZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHBhcnNlZFZhbCA9IHZhbDtcclxuXHR9XHJcblx0Ly8gVGhyb3cgaWYgd2UgZG9uJ3Qga25vdyB3aGF0IGl0IGlzLlxyXG5cdGVsc2Uge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gc3RvcmUgdGhpcyB2YWx1ZTsgd3JvbmcgdmFsdWUgdHlwZS4nKTtcclxuXHR9XHJcblx0Ly8gU2V0IGV4cGlyZSBkYXRlIGlmIG5lZWRlZC5cclxuXHRpZiAodHlwZW9mIGV4cGlyZXMgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHQvLyBDb252ZXJ0IHRvIGEgcmVsYXRpdmUgZGF0ZS5cclxuXHRcdGlmICh0eXBlb2YgZXhwaXJlcyA9PT0gJ251bWJlcicpIHtcclxuXHRcdFx0ZXhwaXJlcyA9IG5ldyBEYXRlKERhdGUubm93KCkgKyBleHBpcmVzKTtcclxuXHRcdH1cclxuXHRcdC8vIE1ha2Ugc3VyZSBpdCBpcyBhIGRhdGUuXHJcblx0XHRpZiAoZXhwaXJlcyBpbnN0YW5jZW9mIERhdGUpIHtcclxuXHRcdFx0ZXhwaXJlc1N0b3JlLnNldCh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSwgZXhwaXJlcyk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdLZXkgZXhwaXJlIG11c3QgYmUgYSB2YWxpZCBkYXRlIG9yIHRpbWVzdGFtcC4nKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Ly8gU2F2ZSBpdC5cclxuXHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSB2YWw7XHJcblx0dGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLnNldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KGtleSksIHBhcnNlZFZhbCk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBhbGwgZGF0YSBmb3IgdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIGdldEFsbFxyXG4gKiBAcmV0dXJuIHtvYmplY3R9IEFuIG9iamVjdCBjb250YWluaW5nIGFsbCBkYXRhIGluIHRoZSBmb3JtIG9mIGB7dGhlS2V5OiB0aGVEYXRhfWAgd2hlcmUgYHRoZURhdGFgIGlzIHBhcnNlZCB1c2luZyB7eyNjcm9zc0xpbmsgXCJTdG9yZS9nZXRcIn19U3RvcmUjZ2V0e3svY3Jvc3NMaW5rfX0uXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBrZXlzID0gdGhpcy5saXN0S2V5cygpO1xyXG5cdHZhciBkYXRhID0ge307XHJcblx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdGRhdGFba2V5XSA9IHRoaXMuZ2V0KGtleSk7XHJcblx0fSwgdGhpcyk7XHJcblx0cmV0dXJuIGRhdGE7XHJcbn07XHJcblxyXG4vKipcclxuICogTGlzdCBhbGwga2V5cyB0aGF0IGFyZSB0aWVkIHRvIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBsaXN0S2V5c1xyXG4gKiBAcmV0dXJuIHthcnJheX0gVGhlIHN0b3JhZ2Uga2V5cy5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5saXN0S2V5cyA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIga2V5cyA9IFtdO1xyXG5cdHZhciBrZXkgPSBudWxsO1xyXG5cdHZhciBzdG9yYWdlTGVuZ3RoID0gdGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLmxlbmd0aDtcclxuXHR2YXIgcHJlZml4ID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLmdldE5hbWVzcGFjZSh0cnVlKSk7XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzdG9yYWdlTGVuZ3RoOyBpKyspIHtcclxuXHRcdGtleSA9IHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5rZXkoaSlcclxuXHRcdGlmIChwcmVmaXgudGVzdChrZXkpKSB7XHJcblx0XHRcdGtleXMucHVzaChrZXkucmVwbGFjZShwcmVmaXgsICcnKSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiBrZXlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSBzcGVjaWZpYyBrZXkgYW5kIGRhdGEgZnJvbSB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgcmVtb3ZlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byByZW1vdmUgdGhlIGRhdGEgZm9yLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSBudWxsO1xyXG5cdHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5yZW1vdmVJdGVtKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBkYXRhIGFuZCBrZXlzIGZyb20gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIHJlbW92ZUFsbFxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHR0aGlzLmxpc3RLZXlzKCkuZm9yRWFjaCh0aGlzLnJlbW92ZSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBuYW1lc3BhY2VkIGl0ZW1zIGZyb20gdGhlIGNhY2hlIHNvIHlvdXIgbmV4dCB7eyNjcm9zc0xpbmsgXCJTdG9yZS9nZXRcIn19U3RvcmUjZ2V0e3svY3Jvc3NMaW5rfX0gd2lsbCBiZSBmcmVzaCBmcm9tIHRoZSBzdG9yYWdlLlxyXG4gKiBAbWV0aG9kIGZyZXNoZW5cclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIHJlbW92ZSB0aGUgY2FjaGUgZGF0YSBmb3IuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZnJlc2hlbiA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHR2YXIga2V5cyA9IGtleSA/IFtrZXldIDogdGhpcy5saXN0S2V5cygpO1xyXG5cdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSBudWxsO1xyXG5cdH0sIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1pZ3JhdGUgZGF0YSBmcm9tIGEgZGlmZmVyZW50IG5hbWVzcGFjZSB0byBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBtaWdyYXRlXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSAgIG1pZ3JhdGlvbiAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIG1pZ3JhdGlvbiBvYmplY3QuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG1pZ3JhdGlvbi50b0tleSAgICAgICAgICAgICAgICAgICAgVGhlIGtleSBuYW1lIHVuZGVyIHlvdXIgY3VycmVudCBuYW1lc3BhY2UgdGhlIG9sZCBkYXRhIHNob3VsZCBjaGFuZ2UgdG8uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG1pZ3JhdGlvbi5mcm9tTmFtZXNwYWNlICAgICAgICAgICAgVGhlIG9sZCBuYW1lc3BhY2UgdGhhdCB0aGUgb2xkIGtleSBiZWxvbmdzIHRvLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24uZnJvbUtleSAgICAgICAgICAgICAgICAgIFRoZSBvbGQga2V5IG5hbWUgdG8gbWlncmF0ZSBmcm9tLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBbbWlncmF0aW9uLmZyb21TdG9yYWdlVHlwZV0gICAgICAgIFRoZSBzdG9yYWdlIHR5cGUgdG8gbWlncmF0ZSBmcm9tLiBEZWZhdWx0cyB0byBzYW1lIHR5cGUgYXMgd2hlcmUgeW91IGFyZSBtaWdyYXRpbmcgdG8uXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gIFttaWdyYXRpb24ua2VlcE9sZERhdGE9ZmFsc2VdICAgICAgV2hldGhlciBvbGQgZGF0YSBzaG91bGQgYmUga2VwdCBhZnRlciBpdCBoYXMgYmVlbiBtaWdyYXRlZC5cclxuICogQHBhcmFtIHtib29sZWFufSAgW21pZ3JhdGlvbi5vdmVyd3JpdGVOZXdEYXRhPWZhbHNlXSBXaGV0aGVyIG9sZCBkYXRhIHNob3VsZCBvdmVyd3JpdGUgY3VycmVudGx5IHN0b3JlZCBkYXRhIGlmIGl0IGV4aXN0cy5cclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW21pZ3JhdGlvbi50cmFuc2Zvcm1dICAgICAgICAgICAgICBUaGUgZnVuY3Rpb24gdG8gcGFzcyB0aGUgb2xkIGtleSBkYXRhIHRocm91Z2ggYmVmb3JlIG1pZ3JhdGluZy5cclxuICogQGV4YW1wbGVcclxuICogXHJcbiAqICAgICB2YXIgU3RvcmUgPSByZXF1aXJlKCdzdG9yYWdlLXdyYXBwZXInKTtcclxuICogICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yZSh7XHJcbiAqICAgICAgICAgbmFtZXNwYWNlOiAnbXlOZXdBcHAnXHJcbiAqICAgICB9KTtcclxuICpcclxuICogICAgIC8vIE1pZ3JhdGUgZnJvbSB0aGUgb2xkIGFwcC5cclxuICogICAgIHN0b3JlLm1pZ3JhdGUoe1xyXG4gKiAgICAgICAgIHRvS2V5OiAnbmV3LWtleScsXHJcbiAqICAgICAgICAgZnJvbU5hbWVzcGFjZTogJ215T2xkQXBwJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb2xkLWtleSdcclxuICogICAgIH0pO1xyXG4gKiAgICAgXHJcbiAqICAgICAvLyBNaWdyYXRlIGZyb20gZ2xvYmFsIGRhdGEuIFVzZWZ1bCB3aGVuIG1vdmluZyBmcm9tIG90aGVyIHN0b3JhZ2Ugd3JhcHBlcnMgb3IgcmVndWxhciBvbCcgYGxvY2FsU3RvcmFnZWAuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ290aGVyLW5ldy1rZXknLFxyXG4gKiAgICAgICAgIGZyb21OYW1lc3BhY2U6ICcnLFxyXG4gKiAgICAgICAgIGZyb21LZXk6ICdvdGhlci1vbGQta2V5LW9uLWdsb2JhbCdcclxuICogICAgIH0pO1xyXG4gKiAgICAgXHJcbiAqICAgICAvLyBNaWdyYXRlIHNvbWUgSlNPTiBkYXRhIHRoYXQgd2FzIHN0b3JlZCBhcyBhIHN0cmluZy5cclxuICogICAgIHN0b3JlLm1pZ3JhdGUoe1xyXG4gKiAgICAgICAgIHRvS2V5OiAnbmV3LWpzb24ta2V5JyxcclxuICogICAgICAgICBmcm9tTmFtZXNwYWNlOiAnbXlPbGRBcHAnLFxyXG4gKiAgICAgICAgIGZyb21LZXk6ICdvbGQtanNvbi1rZXknLFxyXG4gKiAgICAgICAgIC8vIFRyeSBjb252ZXJ0aW5nIHNvbWUgb2xkIEpTT04gZGF0YS5cclxuICogICAgICAgICB0cmFuc2Zvcm06IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAqICAgICAgICAgICAgIHRyeSB7XHJcbiAqICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcclxuICogICAgICAgICAgICAgfVxyXG4gKiAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gKiAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAqICAgICAgICAgICAgIH1cclxuICogICAgICAgICB9XHJcbiAqICAgICB9KTtcclxuICovXHJcblxyXG5TdG9yZS5wcm90b3R5cGUubWlncmF0ZSA9IGZ1bmN0aW9uIChtaWdyYXRpb24pIHtcclxuXHQvLyBTYXZlIG91ciBjdXJyZW50IG5hbWVzcGFjZS5cclxuXHR2YXIgdG9OYW1lc3BhY2UgPSB0aGlzLmdldE5hbWVzcGFjZSgpO1xyXG5cdHZhciB0b1N0b3JhZ2VUeXBlID0gdGhpcy5nZXRTdG9yYWdlVHlwZSgpO1xyXG5cclxuXHQvLyBDcmVhdGUgYSB0ZW1wb3Jhcnkgc3RvcmUgdG8gYXZvaWQgY2hhbmdpbmcgbmFtZXNwYWNlIGR1cmluZyBhY3R1YWwgZ2V0L3NldHMuXHJcblx0dmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuXHRcdG5hbWVzcGFjZTogdG9OYW1lc3BhY2UsXHJcblx0XHRzdG9yYWdlVHlwZTogdG9TdG9yYWdlVHlwZVxyXG5cdH0pO1xyXG5cclxuXHR2YXIgZGF0YSA9IG51bGw7XHJcblxyXG5cdC8vIEdldCBkYXRhIGZyb20gb2xkIG5hbWVzcGFjZS5cclxuXHRzdG9yZS5zZXROYW1lc3BhY2UobWlncmF0aW9uLmZyb21OYW1lc3BhY2UpO1xyXG5cdGlmICh0eXBlb2YgbWlncmF0aW9uLmZyb21TdG9yYWdlVHlwZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHN0b3JlLnNldFN0b3JhZ2VUeXBlKG1pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGUpO1xyXG5cdH1cclxuXHRkYXRhID0gc3RvcmUuZ2V0KG1pZ3JhdGlvbi5mcm9tS2V5KTtcclxuXHJcblx0Ly8gUmVtb3ZlIG9sZCBpZiBuZWVkZWQuXHJcblx0aWYgKCFtaWdyYXRpb24ua2VlcE9sZERhdGEpIHtcclxuXHRcdHN0b3JlLnJlbW92ZShtaWdyYXRpb24uZnJvbUtleSk7XHJcblx0fVxyXG5cdFxyXG5cdC8vIE5vIGRhdGEsIGlnbm9yZSB0aGlzIG1pZ3JhdGlvbi5cclxuXHRpZiAoZGF0YSA9PT0gbnVsbCkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Ly8gVHJhbnNmb3JtIGRhdGEgaWYgbmVlZGVkLlxyXG5cdGlmICh0eXBlb2YgbWlncmF0aW9uLnRyYW5zZm9ybSA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0ZGF0YSA9IG1pZ3JhdGlvbi50cmFuc2Zvcm0oZGF0YSk7XHJcblx0fVxyXG5cdGVsc2UgaWYgKHR5cGVvZiBtaWdyYXRpb24udHJhbnNmb3JtICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRyYW5zZm9ybSBjYWxsYmFjay4nKTtcclxuXHR9XHJcblxyXG5cdC8vIEdvIGJhY2sgdG8gY3VycmVudCBuYW1lc3BhY2UuXHJcblx0c3RvcmUuc2V0TmFtZXNwYWNlKHRvTmFtZXNwYWNlKTtcclxuXHRzdG9yZS5zZXRTdG9yYWdlVHlwZSh0b1N0b3JhZ2VUeXBlKTtcclxuXHJcblx0Ly8gT25seSBvdmVyd3JpdGUgbmV3IGRhdGEgaWYgaXQgZG9lc24ndCBleGlzdCBvciBpdCdzIHJlcXVlc3RlZC5cclxuXHRpZiAoc3RvcmUuZ2V0KG1pZ3JhdGlvbi50b0tleSkgPT09IG51bGwgfHwgbWlncmF0aW9uLm92ZXJ3cml0ZU5ld0RhdGEpIHtcclxuXHRcdHN0b3JlLnNldChtaWdyYXRpb24udG9LZXksIGRhdGEpO1xyXG5cdH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgc3Vic3RvcmUgdGhhdCBpcyBuZXN0ZWQgaW4gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIGNyZWF0ZVN1YnN0b3JlXHJcbiAqIEBwYXJhbSAge3N0cmluZ30gbmFtZXNwYWNlIFRoZSBzdWJzdG9yZSdzIG5hbWVzcGFjZS5cclxuICogQHJldHVybiB7U3RvcmV9ICAgICAgICAgICAgVGhlIHN1YnN0b3JlLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBcclxuICogICAgIHZhciBTdG9yZSA9IHJlcXVpcmUoJ3N0b3JhZ2Utd3JhcHBlcicpO1xyXG4gKiAgICAgLy8gQ3JlYXRlIG1haW4gc3RvcmUuXHJcbiAqICAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG4gKiAgICAgICAgIG5hbWVzcGFjZTogJ215YXBwJ1xyXG4gKiAgICAgfSk7XHJcbiAqXHJcbiAqICAgICAvLyBDcmVhdGUgc3Vic3RvcmUuXHJcbiAqICAgICB2YXIgc3Vic3RvcmUgPSBzdG9yZS5jcmVhdGVTdWJzdG9yZSgndGhpbmdzJyk7XHJcbiAqICAgICBzdWJzdG9yZS5zZXQoJ2ZvbycsICdiYXInKTtcclxuICpcclxuICogICAgIHN1YnN0b3JlLmdldCgnZm9vJykgPT09IHN0b3JlLmdldCgndGhpbmdzOmZvbycpO1xyXG4gKiAgICAgLy8gdHJ1ZVxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmNyZWF0ZVN1YnN0b3JlID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cdHJldHVybiBuZXcgU3RvcmUoe1xyXG5cdFx0bmFtZXNwYWNlOiB0aGlzLmdldE5hbWVzcGFjZSh0cnVlKSArIG5hbWVzcGFjZSxcclxuXHRcdHN0b3JhZ2VUeXBlOiB0aGlzLmdldFN0b3JhZ2VUeXBlKClcclxuXHR9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3RvcmU7XHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcblx0XCJuYW1lXCI6IFwidHdpdGNoLWNoYXQtZW1vdGVzXCIsXG5cdFwidmVyc2lvblwiOiBcIjAuNi40XCIsXG5cdFwiaG9tZXBhZ2VcIjogXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL1wiLFxuXHRcImJ1Z3NcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvaXNzdWVzXCIsXG5cdFwiYXV0aG9yXCI6IFwiUnlhbiBDaGF0aGFtIDxyeWFuLmIuY2hhdGhhbUBnbWFpbC5jb20+IChodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYylcIixcblx0XCJyZXBvc2l0b3J5XCI6IHtcblx0XHRcInR5cGVcIjogXCJnaXRcIixcblx0XHRcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy5naXRcIlxuXHR9LFxuXHRcInVzZXJzY3JpcHRcIjoge1xuXHRcdFwibmFtZVwiOiBcIlR3aXRjaCBDaGF0IEVtb3Rlc1wiLFxuXHRcdFwibmFtZXNwYWNlXCI6IFwiI0NsZXR1c1wiLFxuXHRcdFwidmVyc2lvblwiOiBcInt7e3BrZy52ZXJzaW9ufX19XCIsXG5cdFx0XCJkZXNjcmlwdGlvblwiOiBcIkFkZHMgYSBidXR0b24gdG8gVHdpdGNoIHRoYXQgYWxsb3dzIHlvdSB0byBcXFwiY2xpY2stdG8taW5zZXJ0XFxcIiBhbiBlbW90ZS5cIixcblx0XHRcImNvcHlyaWdodFwiOiBcIjIwMTErLCB7e3twa2cuYXV0aG9yfX19XCIsXG5cdFx0XCJhdXRob3JcIjogXCJ7e3twa2cuYXV0aG9yfX19XCIsXG5cdFx0XCJpY29uXCI6IFwiaHR0cDovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyLnBocD9ncmF2YXRhcl9pZD02ODc1ZTgzYWE2YzU2Mzc5MGNiMmRhOTE0YWFiYThiMyZyPVBHJnM9NDgmZGVmYXVsdD1pZGVudGljb25cIixcblx0XHRcImxpY2Vuc2VcIjogW1xuXHRcdFx0XCJNSVQ7IGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcIixcblx0XHRcdFwiQ0MgQlktTkMtU0EgMy4wOyBodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1uYy1zYS8zLjAvXCJcblx0XHRdLFxuXHRcdFwiaG9tZXBhZ2VcIjogXCJ7e3twa2cuaG9tZXBhZ2V9fX1cIixcblx0XHRcInN1cHBvcnRVUkxcIjogXCJ7e3twa2cuYnVnc319fVwiLFxuXHRcdFwiY29udHJpYnV0aW9uVVJMXCI6IFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy8jZG9uYXRlXCIsXG5cdFx0XCJncmFudFwiOiBcIm5vbmVcIixcblx0XHRcImluY2x1ZGVcIjogXCJodHRwOi8vKi50d2l0Y2gudHYvKlwiLFxuXHRcdFwiZXhjbHVkZVwiOiBbXG5cdFx0XHRcImh0dHA6Ly9hcGkudHdpdGNoLnR2LypcIixcblx0XHRcdFwiaHR0cDovL2NoYXRkZXBvdC50d2l0Y2gudHYvKlwiLFxuXHRcdFx0XCJodHRwOi8vKi50d2l0Y2gudHYvKi9wcm9maWxlKlwiXG5cdFx0XVxuXHR9LFxuXHRcInNjcmlwdHNcIjoge1xuXHRcdFwiaW5zdGFsbFwiOiBcIm5hcGFcIlxuXHR9LFxuXHRcImRldkRlcGVuZGVuY2llc1wiOiB7XG5cdFx0XCJicm93c2VyLXN5bmNcIjogXCJeMS4zLjJcIixcblx0XHRcImJyb3dzZXJpZnlcIjogXCJeNS45LjFcIixcblx0XHRcImd1bHBcIjogXCJeMy44LjNcIixcblx0XHRcImd1bHAtYXV0b3ByZWZpeGVyXCI6IFwiMC4wLjhcIixcblx0XHRcImd1bHAtYmVhdXRpZnlcIjogXCIxLjEuMFwiLFxuXHRcdFwiZ3VscC1jaGFuZ2VkXCI6IFwiXjAuNC4xXCIsXG5cdFx0XCJndWxwLWNvbmNhdFwiOiBcIl4yLjIuMFwiLFxuXHRcdFwiZ3VscC1jb25mbGljdFwiOiBcIl4wLjEuMlwiLFxuXHRcdFwiZ3VscC1jc3MtYmFzZTY0XCI6IFwiXjEuMS4wXCIsXG5cdFx0XCJndWxwLWNzczJqc1wiOiBcIl4xLjAuMlwiLFxuXHRcdFwiZ3VscC1oZWFkZXJcIjogXCJeMS4wLjJcIixcblx0XHRcImd1bHAtaG9nYW4tY29tcGlsZVwiOiBcIl4wLjIuMVwiLFxuXHRcdFwiZ3VscC1taW5pZnktY3NzXCI6IFwiXjAuMy41XCIsXG5cdFx0XCJndWxwLW5vdGlmeVwiOiBcIl4xLjQuMVwiLFxuXHRcdFwiZ3VscC1yZW5hbWVcIjogXCJeMS4yLjBcIixcblx0XHRcImd1bHAtdWdsaWZ5XCI6IFwiXjAuMy4xXCIsXG5cdFx0XCJndWxwLXV0aWxcIjogXCJeMy4wLjBcIixcblx0XHRcImhvZ2FuLmpzXCI6IFwiXjMuMC4yXCIsXG5cdFx0XCJqcXVlcnktdWlcIjogXCJeMS4xMC41XCIsXG5cdFx0XCJuYXBhXCI6IFwiXjAuNC4xXCIsXG5cdFx0XCJwcmV0dHktaHJ0aW1lXCI6IFwiXjAuMi4xXCIsXG5cdFx0XCJ2aW55bC1tYXBcIjogXCJeMS4wLjFcIixcblx0XHRcInZpbnlsLXNvdXJjZS1zdHJlYW1cIjogXCJeMC4xLjFcIixcblx0XHRcIndhdGNoaWZ5XCI6IFwiXjEuMC4xXCIsXG5cdFx0XCJzdG9yYWdlLXdyYXBwZXJcIjogXCJjbGV0dXNjL3N0b3JhZ2Utd3JhcHBlciN2MC4xLjFcIlxuXHR9LFxuXHRcIm5hcGFcIjoge1xuXHRcdFwianF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXJcIjogXCJtenViYWxhL2pxdWVyeS1jdXN0b20tc2Nyb2xsYmFyIzAuNS41XCJcblx0fVxufVxuIiwidmFyIGFwaSA9IHdpbmRvdy5Ud2l0Y2guYXBpO1xyXG5cclxuZnVuY3Rpb24gZ2V0QmFkZ2VzKHVzZXJuYW1lLCBjYWxsYmFjaykge1xyXG5cdC8vIE5vdGU6IG5vdCBhIGRvY3VtZW50ZWQgQVBJIGVuZHBvaW50LlxyXG5cdGFwaS5nZXQoJ2NoYXQvJyArIHVzZXJuYW1lICsgJy9iYWRnZXMnKVxyXG5cdFx0LmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0XHRjYWxsYmFjayhhcGkpO1xyXG5cdFx0fSlcclxuXHRcdC5mYWlsKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Y2FsbGJhY2soe30pO1xyXG5cdFx0fSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFRpY2tldHMoY2FsbGJhY2spIHtcclxuXHQvLyBOb3RlOiBub3QgYSBkb2N1bWVudGVkIEFQSSBlbmRwb2ludC5cclxuXHRhcGkuZ2V0KFxyXG5cdFx0Jy9hcGkvdXNlcnMvOmxvZ2luL3RpY2tldHMnLFxyXG5cdFx0e1xyXG5cdFx0XHRvZmZzZXQ6IDAsXHJcblx0XHRcdGxpbWl0OiAxMDAsXHJcblx0XHRcdHVuZW5kZWQ6IHRydWVcclxuXHRcdH1cclxuXHQpXHJcblx0XHQuZG9uZShmdW5jdGlvbiAoYXBpKSB7XHJcblx0XHRcdGNhbGxiYWNrKGFwaS50aWNrZXRzIHx8IFtdKTtcclxuXHRcdH0pXHJcblx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGNhbGxiYWNrKFtdKTtcclxuXHRcdH0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHRnZXRCYWRnZXM6IGdldEJhZGdlcyxcclxuXHRnZXRUaWNrZXRzOiBnZXRUaWNrZXRzXHJcbn07XHJcbiIsInZhciBTdG9yZSA9IHJlcXVpcmUoJ3N0b3JhZ2Utd3JhcHBlcicpO1xyXG52YXIgc3RvcmFnZSA9IHt9O1xyXG5cclxuLy8gR2VuZXJhbCBzdG9yYWdlLlxyXG5zdG9yYWdlLmdsb2JhbCA9IG5ldyBTdG9yZSh7XHJcblx0bmFtZXNwYWNlOiAnZW1vdGUtbWVudS1mb3ItdHdpdGNoJ1xyXG59KTtcclxuXHJcbi8vIEVtb3RlIHBvcHVsYXJpdHkgc3RvcmFnZS5cclxuc3RvcmFnZS5wb3B1bGFyaXR5ID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ3BvcHVsYXJpdHknKTtcclxuLy8gRW1vdGUgdmlzaWJpbGl0eSBzdG9yYWdlLlxyXG5zdG9yYWdlLnZpc2liaWxpdHkgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgndmlzaWJpbGl0eScpO1xyXG5cclxuLy8gTWlncmF0ZSBvbGQga2V5cy5cclxuc3RvcmFnZS5nbG9iYWwubWlncmF0ZSh7XHJcblx0ZnJvbU5hbWVzcGFjZTogJycsXHJcblx0ZnJvbUtleTogJ2Vtb3RlLXBvcHVsYXJpdHktdHJhY2tpbmcnLFxyXG5cdHRvS2V5OiAnX21pZ3JhdGUnLFxyXG5cdHRyYW5zZm9ybTogZnVuY3Rpb24gKGRhdGEpIHtcclxuXHRcdHRyeSB7XHJcblx0XHRcdGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xyXG5cdFx0fVxyXG5cdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0ZGF0YSA9IHt9O1xyXG5cdFx0fVxyXG5cdFx0Zm9yICh2YXIga2V5IGluIGRhdGEpIHtcclxuXHRcdFx0aWYgKCFkYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRzdG9yYWdlLnBvcHVsYXJpdHkuc2V0KGtleSwgTnVtYmVyKGRhdGFba2V5XSkpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc3RvcmFnZTtcclxuIiwidmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4uLy4uL2J1aWxkL3RlbXBsYXRlcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xyXG5cdHZhciBkYXRhID0ge307XHJcblx0dmFyIGtleSA9IG51bGw7XHJcblxyXG5cdC8vIENvbnZlcnQgdGVtcGxhdGVzIHRvIHRoZWlyIHNob3J0ZXIgXCJyZW5kZXJcIiBmb3JtLlxyXG5cdGZvciAoa2V5IGluIHRlbXBsYXRlcykge1xyXG5cdFx0aWYgKCF0ZW1wbGF0ZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cdFx0XHRjb250aW51ZTtcclxuXHRcdH1cclxuXHRcdGRhdGFba2V5XSA9IHJlbmRlcihrZXkpO1xyXG5cdH1cclxuXHJcblx0Ly8gU2hvcnRjdXQgdGhlIHJlbmRlciBmdW5jdGlvbi4gQWxsIHRlbXBsYXRlcyB3aWxsIGJlIHBhc3NlZCBpbiBhcyBwYXJ0aWFscyBieSBkZWZhdWx0LlxyXG5cdGZ1bmN0aW9uIHJlbmRlcih0ZW1wbGF0ZSkge1xyXG5cdFx0dGVtcGxhdGUgPSB0ZW1wbGF0ZXNbdGVtcGxhdGVdO1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XHJcblx0XHRcdHJldHVybiB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgcGFydGlhbHMgfHwgdGVtcGxhdGVzLCBpbmRlbnQpO1xyXG5cdFx0fTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBkYXRhO1xyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24gKCQpIHtcclxuXHQkLmZuLnJlc2l6YWJsZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0XHR2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7XHJcblx0XHRcdGFsc29SZXNpemU6IG51bGwsXHJcblx0XHRcdGFsc29SZXNpemVUeXBlOiAnYm90aCcsIC8vIGBoZWlnaHRgLCBgd2lkdGhgLCBgYm90aGBcclxuXHRcdFx0Y29udGFpbm1lbnQ6IG51bGwsXHJcblx0XHRcdGNyZWF0ZTogbnVsbCxcclxuXHRcdFx0ZGVzdHJveTogbnVsbCxcclxuXHRcdFx0aGFuZGxlOiAnLnJlc2l6ZS1oYW5kbGUnLFxyXG5cdFx0XHRtYXhIZWlnaHQ6IDk5OTksXHJcblx0XHRcdG1heFdpZHRoOiA5OTk5LFxyXG5cdFx0XHRtaW5IZWlnaHQ6IDAsXHJcblx0XHRcdG1pbldpZHRoOiAwLFxyXG5cdFx0XHRyZXNpemU6IG51bGwsXHJcblx0XHRcdHJlc2l6ZU9uY2U6IG51bGwsXHJcblx0XHRcdHNuYXBTaXplOiAxLFxyXG5cdFx0XHRzdGFydDogbnVsbCxcclxuXHRcdFx0c3RvcDogbnVsbFxyXG5cdFx0fSwgb3B0aW9ucyk7XHJcblxyXG5cdFx0c2V0dGluZ3MuZWxlbWVudCA9ICQodGhpcyk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcmVjYWxjdWxhdGVTaXplKGV2dCkge1xyXG5cdFx0XHR2YXIgZGF0YSA9IGV2dC5kYXRhLFxyXG5cdFx0XHRcdHJlc2l6ZWQgPSB7fTtcclxuXHRcdFx0ZGF0YS5kaWZmWCA9IE1hdGgucm91bmQoKGV2dC5wYWdlWCAtIGRhdGEucGFnZVgpIC8gc2V0dGluZ3Muc25hcFNpemUpICogc2V0dGluZ3Muc25hcFNpemU7XHJcblx0XHRcdGRhdGEuZGlmZlkgPSBNYXRoLnJvdW5kKChldnQucGFnZVkgLSBkYXRhLnBhZ2VZKSAvIHNldHRpbmdzLnNuYXBTaXplKSAqIHNldHRpbmdzLnNuYXBTaXplO1xyXG5cdFx0XHRpZiAoTWF0aC5hYnMoZGF0YS5kaWZmWCkgPiAwIHx8IE1hdGguYWJzKGRhdGEuZGlmZlkpID4gMCkge1xyXG5cdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KCkgIT09IGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSAmJlxyXG5cdFx0XHRcdFx0ZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZID49IHNldHRpbmdzLm1pbkhlaWdodCAmJlxyXG5cdFx0XHRcdFx0ZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZIDw9IHNldHRpbmdzLm1heEhlaWdodCAmJlxyXG5cdFx0XHRcdFx0KHNldHRpbmdzLmNvbnRhaW5tZW50ID8gZGF0YS5vdXRlckhlaWdodCArIGRhdGEuZGlmZlkgKyBkYXRhLm9mZnNldC50b3AgPD0gc2V0dGluZ3MuY29udGFpbm1lbnQub2Zmc2V0KCkudG9wICsgc2V0dGluZ3MuY29udGFpbm1lbnQub3V0ZXJIZWlnaHQoKSA6IHRydWUpXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LmhlaWdodChkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkpO1xyXG5cdFx0XHRcdFx0cmVzaXplZC5oZWlnaHQgPSB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LndpZHRoKCkgIT09IGRhdGEud2lkdGggKyBkYXRhLmRpZmZYICYmXHJcblx0XHRcdFx0XHRkYXRhLndpZHRoICsgZGF0YS5kaWZmWCA+PSBzZXR0aW5ncy5taW5XaWR0aCAmJlxyXG5cdFx0XHRcdFx0ZGF0YS53aWR0aCArIGRhdGEuZGlmZlggPD0gc2V0dGluZ3MubWF4V2lkdGggJiZcclxuXHRcdFx0XHRcdChzZXR0aW5ncy5jb250YWlubWVudCA/IGRhdGEub3V0ZXJXaWR0aCArIGRhdGEuZGlmZlggKyBkYXRhLm9mZnNldC5sZWZ0IDw9IHNldHRpbmdzLmNvbnRhaW5tZW50Lm9mZnNldCgpLmxlZnQgKyBzZXR0aW5ncy5jb250YWlubWVudC5vdXRlcldpZHRoKCkgOiB0cnVlKVxyXG5cdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC53aWR0aChkYXRhLndpZHRoICsgZGF0YS5kaWZmWCk7XHJcblx0XHRcdFx0XHRyZXNpemVkLndpZHRoID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHJlc2l6ZWQuaGVpZ2h0IHx8IHJlc2l6ZWQud2lkdGgpIHtcclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5yZXNpemVPbmNlKSB7XHJcblx0XHRcdFx0XHRcdHNldHRpbmdzLnJlc2l6ZU9uY2UuYmluZChzZXR0aW5ncy5lbGVtZW50KShldnQuZGF0YSk7XHJcblx0XHRcdFx0XHRcdHNldHRpbmdzLnJlc2l6ZU9uY2UgPSBudWxsO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLnJlc2l6ZSkge1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemUuYmluZChzZXR0aW5ncy5lbGVtZW50KShldnQuZGF0YSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZSkge1xyXG5cdFx0XHRcdFx0XHRpZiAocmVzaXplZC5oZWlnaHQgJiYgKHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnaGVpZ2h0JyB8fCBzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ2JvdGgnKSkge1xyXG5cdFx0XHRcdFx0XHRcdHNldHRpbmdzLmFsc29SZXNpemUuaGVpZ2h0KGRhdGEuYWxzb1Jlc2l6ZUhlaWdodCArIGRhdGEuZGlmZlkpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGlmIChyZXNpemVkLndpZHRoICYmIChzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ3dpZHRoJyB8fCBzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ2JvdGgnKSkge1xyXG5cdFx0XHRcdFx0XHRcdHNldHRpbmdzLmFsc29SZXNpemUud2lkdGgoZGF0YS5hbHNvUmVzaXplV2lkdGggKyBkYXRhLmRpZmZYKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHN0YXJ0KGV2dCkge1xyXG5cdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0aWYgKHNldHRpbmdzLnN0YXJ0KSB7XHJcblx0XHRcdFx0c2V0dGluZ3Muc3RhcnQuYmluZChzZXR0aW5ncy5lbGVtZW50KSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHZhciBkYXRhID0ge1xyXG5cdFx0XHRcdGFsc29SZXNpemVIZWlnaHQ6IHNldHRpbmdzLmFsc29SZXNpemUgPyBzZXR0aW5ncy5hbHNvUmVzaXplLmhlaWdodCgpIDogMCxcclxuXHRcdFx0XHRhbHNvUmVzaXplV2lkdGg6IHNldHRpbmdzLmFsc29SZXNpemUgPyBzZXR0aW5ncy5hbHNvUmVzaXplLndpZHRoKCkgOiAwLFxyXG5cdFx0XHRcdGhlaWdodDogc2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoKSxcclxuXHRcdFx0XHRvZmZzZXQ6IHNldHRpbmdzLmVsZW1lbnQub2Zmc2V0KCksXHJcblx0XHRcdFx0b3V0ZXJIZWlnaHQ6IHNldHRpbmdzLmVsZW1lbnQub3V0ZXJIZWlnaHQoKSxcclxuXHRcdFx0XHRvdXRlcldpZHRoOiBzZXR0aW5ncy5lbGVtZW50Lm91dGVyV2lkdGgoKSxcclxuXHRcdFx0XHRwYWdlWDogZXZ0LnBhZ2VYLFxyXG5cdFx0XHRcdHBhZ2VZOiBldnQucGFnZVksXHJcblx0XHRcdFx0d2lkdGg6IHNldHRpbmdzLmVsZW1lbnQud2lkdGgoKVxyXG5cdFx0XHR9O1xyXG5cdFx0XHQkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlJywgJyonLCBkYXRhLCByZWNhbGN1bGF0ZVNpemUpO1xyXG5cdFx0XHQkKGRvY3VtZW50KS5vbignbW91c2V1cCcsICcqJywgc3RvcCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gc3RvcCgpIHtcclxuXHRcdFx0aWYgKHNldHRpbmdzLnN0b3ApIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5zdG9wLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZScsICcqJywgcmVjYWxjdWxhdGVTaXplKTtcclxuXHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgJyonLCBzdG9wKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoc2V0dGluZ3MuaGFuZGxlKSB7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5hbHNvUmVzaXplICYmIFsnYm90aCcsICdoZWlnaHQnLCAnd2lkdGgnXS5pbmRleE9mKHNldHRpbmdzLmFsc29SZXNpemVUeXBlKSA+PSAwKSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZSA9ICQoc2V0dGluZ3MuYWxzb1Jlc2l6ZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHNldHRpbmdzLmNvbnRhaW5tZW50KSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuY29udGFpbm1lbnQgPSAkKHNldHRpbmdzLmNvbnRhaW5tZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRzZXR0aW5ncy5oYW5kbGUgPSAkKHNldHRpbmdzLmhhbmRsZSk7XHJcblx0XHRcdHNldHRpbmdzLnNuYXBTaXplID0gc2V0dGluZ3Muc25hcFNpemUgPCAxID8gMSA6IHNldHRpbmdzLnNuYXBTaXplO1xyXG5cclxuXHRcdFx0aWYgKG9wdGlvbnMgPT09ICdkZXN0cm95Jykge1xyXG5cdFx0XHRcdHNldHRpbmdzLmhhbmRsZS5vZmYoJ21vdXNlZG93bicsIHN0YXJ0KTtcclxuXHJcblx0XHRcdFx0aWYgKHNldHRpbmdzLmRlc3Ryb3kpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmRlc3Ryb3kuYmluZCh0aGlzKSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c2V0dGluZ3MuaGFuZGxlLm9uKCdtb3VzZWRvd24nLCBzdGFydCk7XHJcblxyXG5cdFx0XHRpZiAoc2V0dGluZ3MuY3JlYXRlKSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuY3JlYXRlLmJpbmQodGhpcykoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcclxufSkoalF1ZXJ5KTtcclxuIl19
