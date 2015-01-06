// ==UserScript==
// @name Twitch Chat Emotes
// @namespace #Cletus
// @version 1.0.3
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
// ==/UserScript==

/* Script compiled using build script. Script uses Browserify for CommonJS modules. */

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var templates = require('./modules/templates');
var pkg = require('../package.json');
var storage = require('./modules/storage');
var twitchApi = require('./modules/twitch-api');
var publicApi = require('./modules/public-api');
var logger = require('./modules/logger');

var $ = null;
var jQuery = null;

// Expose public api.
if (typeof window.emoteMenu === 'undefined') {
	window.emoteMenu = publicApi;
}

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
var isHooked = {
	channelRoute: false,
	chatRoute: false
};

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
				logger.debug('User is logged in.');
				return true;
			}
			// Not logged in, call Twitch's login method.
			$.login();
			logger.debug('User is not logged in, show the login screen.');
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

				logger.debug('Emoticon sets retrieved.', sets);
				return sets;
			}
			catch (err) {
				return [];
			}
		}
	}
};

logger.log('Initial load.');

// Only enable script if we have the right variables.
//---------------------------------------------------
(function init(time) {
	$ = jQuery = window.jQuery;
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
	if (!objectsLoaded) {
		// Errors in approximately 102400ms.
		if (time >= 60000) {
			logger.debug('Taking too long to load, stopping.');
			return;
		}
		if (time >= 10000) {
			if (!objectsLoaded) {
				logger.debug('Objects still not loaded.');
			}
		}
		setTimeout(init, time, time * 2);
		return;
	}
	var activate = {
		activate: function () {
			this._super();
			init(50);
		}
	};
	var channelRoute = window.App.__container__.lookup('route:channel');
	var chatRoute = window.App.__container__.lookup('route:chat');

	if (!isHooked.channelRoute && channelRoute) {
		channelRoute.reopen(activate);
		isHooked.channelRoute = true;
		logger.debug('Hooked into channel route.');
	}
	if (!isHooked.chatRoute && chatRoute) {
		chatRoute.reopen(activate);
		isHooked.chatRoute = true;
		logger.debug('Hooked into chat route.');
	}
	setup();
})(50);

// Start of functions.
//--------------------
/**
 * Runs initial setup of DOM and variables.
 */
function setup() {
	logger.debug('Running setup...');
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
		logger.debug('No chat element available, ignore setup this time.');
		return;
	}

	createMenuElements();
	bindListeners();

	// Get active subscriptions.
	twitchApi.getTickets(function (tickets) {
		logger.debug('Tickets loaded.', tickets);
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
				twitchApi.getBadges(channel, function (badges) {
					var badge = '';
					if (channel === 'turbo') {
						badge = badges.turbo.image;
					}
					else if (badges.subscriber && badges.subscriber.image) {
						badge = badges.subscriber.image;
					}
					emotes.subscriptions.badges[channel] = badge;
				});

				// Get display names.
				if (channel !== null && storage.displayNames.get(channel) === null) {
					if (channel === 'turbo') {
						storage.displayNames.set(channel, 'Turbo');
					}
					else {
						twitchApi.getUser(channel, function (user) {
							logger.debug('Getting fresh display name for user', user);
							storage.displayNames.set(channel, user.display_name, 86400000);
						});
					}
				}
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

	logger.debug('Created menu elements.');
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

			logger.debug('Menu hidden.');
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

			logger.debug('Menu visible.');
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
		logger.debug('Clicked emote: ' + $(this).attr('data-emote'));
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

		logger.debug('Set hidden emote.', {
			which: which,
			isVisible: !isVisible
		});
	});

	// Enable emote starring (delegated).
	elements.menu.on('click', '[data-command="toggle-starred"]', function () {
		// Make sure we are in edit mode.
		if (!elements.menu.is('.editing')) {
			return;
		}
		var which = $(this).attr('data-which');
		var isStarred = storage.starred.get(which, false);
		// Toggle star.
		storage.starred.set(which, !isStarred);
		populateEmotesMenu();

		logger.debug('Set starred emote.', {
			which: which,
			isStarred: !isStarred
		});
	});

	elements.menu.find('.scrollable').customScrollbar({
		skin: 'default-skin',
		hScroll: false,
		preventDefaultScroll: true
	});

	logger.debug('Bounded event listeners.');
}

/**
 * Populates the popup menu with current emote data.
 */
function populateEmotesMenu() {
	var container;
	var starredEmotes = null;

	refreshUsableEmotes();

	// Add starred emotes.
	container = elements.menu.find('#starred-emotes-group');
	container.html('');
	starredEmotes = emotes.usable.filter(function (emote) {
		return emote.isStarred && emote.isVisible;
	});
	starredEmotes.sort(sortByNormal);
	starredEmotes.forEach(function (emote) {
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
			// Get starred status.
			emote.isStarred = storage.starred.get(emote.text, false);
			
			emotes.usable.push(emote);
		}
	});
}

/**
 * Inserts an emote into the chat box.
 * @param {string} text The text of the emote (e.g. "Kappa").
 */
function insertEmoteText(text) {
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
						channelDisplayName: storage.displayNames.get(emote.channel, emote.channel),
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
			isVisible: emote.isVisible,
			isStarred: emote.isStarred
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

},{"../build/styles":2,"../package.json":12,"./modules/logger":13,"./modules/public-api":14,"./modules/storage":15,"./modules/templates":16,"./modules/twitch-api":17,"./plugins/resizable":18,"jquery-custom-scrollbar/jquery.custom-scrollbar":10,"url":8}],2:[function(require,module,exports){
(function (doc, cssText) {
    var id = "emote-menu-for-twitch-styles";
    var styleEl = doc.getElementById(id);
    if (!styleEl) {
        styleEl = doc.createElement("style");
        styleEl.id = id;
        doc.getElementsByTagName("head")[0].appendChild(styleEl);
    }
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
"@-webkit-keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;margin-left:7px}#emote-menu-button.active{border-radius:2px;background-color:rgba(128,128,128,.5)}.emote-menu{padding:5px;z-index:1000;display:none;background-color:#202020}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-starred{height:38px}.emote-menu .draggable{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px)}.emote-menu .header-info{border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;background-image:-webkit-linear-gradient(bottom,transparent,rgba(0,0,0,.5));background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center;position:relative}.emote-menu .header-info img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:30px;height:30px;-webkit-transition:all .25s ease;transition:all .25s ease;border:1px solid transparent}.emote-menu.editing .emote{cursor:auto}.emote-menu .emote div{max-width:30px;max-height:30px;background-repeat:no-repeat;background-size:contain;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;padding:5px 0 2px;margin-top:5px;height:18px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5;background-size:contain!important}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-home{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNjQiDQogICBoZWlnaHQ9IjY0Ig0KICAgdmlld0JveD0iMCAwIDY0IDY0Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhMzAwMSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczI5OTkiIC8+DQo8cGF0aA0KICAgZD0ibSA1Ny4wNjIsMzEuMzk4IGMgMC45MzIsLTEuMDI1IDAuODQyLC0yLjU5NiAtMC4yMDEsLTMuNTA4IEwgMzMuODg0LDcuNzg1IEMgMzIuODQxLDYuODczIDMxLjE2OSw2Ljg5MiAzMC4xNDgsNy44MjggTCA3LjA5MywyOC45NjIgYyAtMS4wMjEsMC45MzYgLTEuMDcxLDIuNTA1IC0wLjExMSwzLjUwMyBsIDAuNTc4LDAuNjAyIGMgMC45NTksMC45OTggMi41MDksMS4xMTcgMy40NiwwLjI2NSBsIDEuNzIzLC0xLjU0MyB2IDIyLjU5IGMgMCwxLjM4NiAxLjEyMywyLjUwOCAyLjUwOCwyLjUwOCBoIDguOTg3IGMgMS4zODUsMCAyLjUwOCwtMS4xMjIgMi41MDgsLTIuNTA4IFYgMzguNTc1IGggMTEuNDYzIHYgMTUuODA0IGMgLTAuMDIsMS4zODUgMC45NzEsMi41MDcgMi4zNTYsMi41MDcgaCA5LjUyNCBjIDEuMzg1LDAgMi41MDgsLTEuMTIyIDIuNTA4LC0yLjUwOCBWIDMyLjEwNyBjIDAsMCAwLjQ3NiwwLjQxNyAxLjA2MywwLjkzMyAwLjU4NiwwLjUxNSAxLjgxNywwLjEwMiAyLjc0OSwtMC45MjQgbCAwLjY1MywtMC43MTggeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%}.emote-menu .icon-gear{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMjEuNTkiDQogICBoZWlnaHQ9IjIxLjEzNjk5OSINCiAgIHZpZXdCb3g9IjAgMCAyMS41OSAyMS4xMzciDQogICBpZD0iQ2FwYV8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGEzOSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczM3IiAvPg0KPHBhdGgNCiAgIGQ9Ik0gMTguNjIyLDguMTQ1IDE4LjA3Nyw2Ljg1IGMgMCwwIDEuMjY4LC0yLjg2MSAxLjE1NiwtMi45NzEgTCAxNy41NTQsMi4yNCBDIDE3LjQzOCwyLjEyNyAxNC41NzYsMy40MzMgMTQuNTc2LDMuNDMzIEwgMTMuMjU2LDIuOSBDIDEzLjI1NiwyLjkgMTIuMDksMCAxMS45MywwIEggOS41NjEgQyA5LjM5NiwwIDguMzE3LDIuOTA2IDguMzE3LDIuOTA2IEwgNi45OTksMy40NDEgYyAwLDAgLTIuOTIyLC0xLjI0MiAtMy4wMzQsLTEuMTMxIEwgMi4yODksMy45NTEgQyAyLjE3Myw0LjA2NCAzLjUwNyw2Ljg2NyAzLjUwNyw2Ljg2NyBMIDIuOTYyLDguMTYgQyAyLjk2Miw4LjE2IDAsOS4zMDEgMCw5LjQ1NSB2IDIuMzIyIGMgMCwwLjE2MiAyLjk2OSwxLjIxOSAyLjk2OSwxLjIxOSBsIDAuNTQ1LDEuMjkxIGMgMCwwIC0xLjI2OCwyLjg1OSAtMS4xNTcsMi45NjkgbCAxLjY3OCwxLjY0MyBjIDAuMTE0LDAuMTExIDIuOTc3LC0xLjE5NSAyLjk3NywtMS4xOTUgbCAxLjMyMSwwLjUzNSBjIDAsMCAxLjE2NiwyLjg5OCAxLjMyNywyLjg5OCBoIDIuMzY5IGMgMC4xNjQsMCAxLjI0NCwtMi45MDYgMS4yNDQsLTIuOTA2IGwgMS4zMjIsLTAuNTM1IGMgMCwwIDIuOTE2LDEuMjQyIDMuMDI5LDEuMTMzIGwgMS42NzgsLTEuNjQxIGMgMC4xMTcsLTAuMTE1IC0xLjIyLC0yLjkxNiAtMS4yMiwtMi45MTYgbCAwLjU0NCwtMS4yOTMgYyAwLDAgMi45NjMsLTEuMTQzIDIuOTYzLC0xLjI5OSBWIDkuMzYgQyAyMS41OSw5LjE5OSAxOC42MjIsOC4xNDUgMTguNjIyLDguMTQ1IHogbSAtNC4zNjYsMi40MjMgYyAwLDEuODY3IC0xLjU1MywzLjM4NyAtMy40NjEsMy4zODcgLTEuOTA2LDAgLTMuNDYxLC0xLjUyIC0zLjQ2MSwtMy4zODcgMCwtMS44NjcgMS41NTUsLTMuMzg1IDMuNDYxLC0zLjM4NSAxLjkwOSwwLjAwMSAzLjQ2MSwxLjUxOCAzLjQ2MSwzLjM4NSB6Ig0KICAgaWQ9InBhdGgzIg0KICAgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgLz4NCjxnDQogICBpZD0iZzUiPg0KPC9nPg0KPGcNCiAgIGlkPSJnNyI+DQo8L2c+DQo8Zw0KICAgaWQ9Imc5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzExIj4NCjwvZz4NCjxnDQogICBpZD0iZzEzIj4NCjwvZz4NCjxnDQogICBpZD0iZzE1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzIxIj4NCjwvZz4NCjxnDQogICBpZD0iZzIzIj4NCjwvZz4NCjxnDQogICBpZD0iZzI1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzMxIj4NCjwvZz4NCjxnDQogICBpZD0iZzMzIj4NCjwvZz4NCjwvc3ZnPg0K) no-repeat 50%}.emote-menu.editing .icon-gear{-webkit-animation:spin 4s linear infinite;animation:spin 4s linear infinite}.emote-menu .icon-resize-handle{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgdmlld0JveD0iMCAwIDE2IDE2Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhNDM1NyI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczQzNTUiIC8+DQo8cGF0aA0KICAgZD0iTSAxMy41LDggQyAxMy4yMjUsOCAxMyw4LjIyNCAxMyw4LjUgdiAzLjc5MyBMIDMuNzA3LDMgSCA3LjUgQyA3Ljc3NiwzIDgsMi43NzYgOCwyLjUgOCwyLjIyNCA3Ljc3NiwyIDcuNSwyIGggLTUgTCAyLjMwOSwyLjAzOSAyLjE1LDIuMTQ0IDIuMTQ2LDIuMTQ2IDIuMTQzLDIuMTUyIDIuMDM5LDIuMzA5IDIsMi41IHYgNSBDIDIsNy43NzYgMi4yMjQsOCAyLjUsOCAyLjc3Niw4IDMsNy43NzYgMyw3LjUgViAzLjcwNyBMIDEyLjI5MywxMyBIIDguNSBDIDguMjI0LDEzIDgsMTMuMjI1IDgsMTMuNSA4LDEzLjc3NSA4LjIyNCwxNCA4LjUsMTQgaCA1IGwgMC4xOTEsLTAuMDM5IGMgMC4xMjEsLTAuMDUxIDAuMjIsLTAuMTQ4IDAuMjcsLTAuMjcgTCAxNCwxMy41MDIgViA4LjUgQyAxNCw4LjIyNCAxMy43NzUsOCAxMy41LDggeiINCiAgIGlkPSJwYXRoNDM1MSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%;cursor:nwse-resize!important}.emote-menu .icon-pin{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgaWQ9InN2ZzMwMDUiPg0KICA8bWV0YWRhdGENCiAgICAgaWQ9Im1ldGFkYXRhMzAyMyI+DQogICAgPHJkZjpSREY+DQogICAgICA8Y2M6V29yaw0KICAgICAgICAgcmRmOmFib3V0PSIiPg0KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4NCiAgICAgICAgPGRjOnR5cGUNCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4NCiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+DQogICAgICA8L2NjOldvcms+DQogICAgPC9yZGY6UkRGPg0KICA8L21ldGFkYXRhPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczMwMjEiIC8+DQogIDxnDQogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzkzMDc4MiwwLDAsMC43OTMwNzgyLC0yLjE3MDk4NSwtODE0LjY5Mjk5KSINCiAgICAgaWQ9ImczMDA3Ij4NCiAgICA8Zw0KICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTEsMC43MDcxMSwtMC43MDcxMSwwLjcwNzExLDczNy43MDc1NSwyOTUuNDg4MDgpIg0KICAgICAgIGlkPSJnMzAwOSI+DQogICAgICA8Zw0KICAgICAgICAgaWQ9ImczNzU1Ij4NCiAgICAgICAgPHBhdGgNCiAgICAgICAgICAgZD0iTSA5Ljc4MTI1LDAgQyA5LjQ3NDA1NjIsMC42ODkxMTIgOS41MjA2OCwxLjUyMzA4NTMgOS4zMTI1LDIuMTg3NSBMIDQuOTM3NSw2LjU5Mzc1IEMgMy45NTg5NjA4LDYuNDI5NDgzIDIuOTQ3NzU0OCw2LjUzMjc4OTkgMiw2LjgxMjUgTCA1LjAzMTI1LDkuODQzNzUgMC41NjI1LDE0LjMxMjUgMCwxNiBDIDAuNTY5Mjk2MjgsMTUuNzk1NjI2IDEuMTY3NzM3OCwxNS42NDAyMzcgMS43MTg3NSwxNS40MDYyNSBMIDYuMTU2MjUsMTAuOTY4NzUgOS4xODc1LDE0IGMgMC4yNzk2ODIzLC0wLjk0Nzc4MyAwLjM4MzE1MjgsLTEuOTU4OTM3IDAuMjE4NzUsLTIuOTM3NSAxLjUwMDAxMSwtMS40ODk1Nzk4IDMuMDAwMDAxLC0yLjk3OTE1OSA0LjUsLTQuNDY4NzUgMC42MDExMDIsLTAuMDMxMzYxIDEuODIyMTM4LC0wLjA5NjEzNyAyLC0wLjQ2ODc1IEMgMTMuODc5ODkyLDQuMDY5NDgwMyAxMS44NDI4NjUsMi4wMjAyMjgyIDkuNzgxMjUsMCB6Ig0KICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg5MTU5Mzc0LC0wLjg5MTU5Mzc0LDAuODkxNTkzNzQsMC44OTE1OTM3NCwtMi4yNjU1LDEwMzcuMTM0NSkiDQogICAgICAgICAgIGlkPSJwYXRoMzAxMSINCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K) no-repeat 50%;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu .icon-pin:hover,.emote-menu.pinned .icon-pin{-webkit-transform:rotate(-45deg);-ms-transform:rotate(-45deg);transform:rotate(-45deg);opacity:1}.emote-menu .scrollable.default-skin{padding-right:0;padding-bottom:0}.emote-menu .scrollable.default-skin .scroll-bar .thumb{background-color:#555;opacity:.2;z-index:1}.emote-menu .edit-tool{background-position:50%;background-repeat:no-repeat;background-size:14px;border-radius:4px;border:1px solid #000;cursor:pointer;display:none;height:14px;opacity:.25;position:absolute;-webkit-transition:all .25s ease;transition:all .25s ease;width:14px;z-index:1}.emote-menu .edit-tool:hover,.emote-menu .emote:hover .edit-tool{opacity:1}.emote-menu .edit-visibility{background-color:#00c800;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGE5Ij48cmRmOlJERj48Y2M6V29yaw0KICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQ0KICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz48ZGM6dGl0bGU+PC9kYzp0aXRsZT48L2NjOldvcms+PC9yZGY6UkRGPjwvbWV0YWRhdGE+PGRlZnMNCiAgIGlkPSJkZWZzNyIgLz4NCjxwYXRoDQogICBkPSJNIDk3Ljk2NCw0Ni41NDggQyA5Ny4wOTgsNDUuNTI4IDc2LjQyNywyMS42MDMgNTAsMjEuNjAzIGMgLTI2LjQyNywwIC00Ny4wOTgsMjMuOTI1IC00Ny45NjUsMjQuOTQ2IC0xLjcwMSwyIC0xLjcwMSw0LjkwMiAxMGUtNCw2LjkwMyAwLjg2NiwxLjAyIDIxLjUzNywyNC45NDUgNDcuOTY0LDI0Ljk0NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMiAxLjcwMSwtNC45MDIgLTAuMDAxLC02LjkwMyB6IE0gNTguMDczLDM1Ljk3NSBjIDEuNzc3LC0wLjk3IDQuMjU1LDAuMTQzIDUuNTM0LDIuNDg1IDEuMjc5LDIuMzQzIDAuODc1LDUuMDI5IC0wLjkwMiw1Ljk5OSAtMS43NzcsMC45NzEgLTQuMjU1LC0wLjE0MyAtNS41MzUsLTIuNDg1IC0xLjI3OSwtMi4zNDMgLTAuODc1LC01LjAyOSAwLjkwMywtNS45OTkgeiBNIDUwLDY5LjcyOSBDIDMxLjU0LDY5LjcyOSAxNi4wMDUsNTUuNTUzIDEwLjYyOCw1MCAxNC4yNTksNDYuMjQ5IDIyLjUyNiwzOC41NzEgMzMuMTk1LDMzLjk3OSAzMS4xMTQsMzcuMTQ1IDI5Ljg5NCw0MC45MjggMjkuODk0LDQ1IGMgMCwxMS4xMDQgOS4wMDEsMjAuMTA1IDIwLjEwNSwyMC4xMDUgMTEuMTA0LDAgMjAuMTA2LC05LjAwMSAyMC4xMDYsLTIwLjEwNSAwLC00LjA3MiAtMS4yMTksLTcuODU1IC0zLjMsLTExLjAyMSBDIDc3LjQ3NCwzOC41NzIgODUuNzQxLDQ2LjI1IDg5LjM3Miw1MCA4My45OTUsNTUuNTU1IDY4LjQ2LDY5LjcyOSA1MCw2OS43MjkgeiINCiAgIGlkPSJwYXRoMyIgLz4NCjwvc3ZnPg==)}.emote-menu .edit-starred{background-color:#323232;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNjY2NjY2M7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote>.edit-visibility{bottom:auto;left:auto;right:0;top:0}.emote-menu .emote>.edit-starred{bottom:auto;left:0;right:auto;top:0}.emote-menu .header-info>.edit-tool{margin-left:5px}.emote-menu.editing .edit-tool{display:inline-block}.emote-menu .emote-menu-hidden .edit-visibility{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8zIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGExNSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczEzIiAvPg0KPGcNCiAgIGlkPSJnMyI+DQoJPHBhdGgNCiAgIGQ9Ik0gNzAuMDgyLDQ1LjQ3NSA1MC40NzQsNjUuMDgyIEMgNjEuMTk4LDY0LjgzMSA2OS44MzEsNTYuMTk3IDcwLjA4Miw0NS40NzUgeiINCiAgIGlkPSJwYXRoNSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTcuOTY0LDQ2LjU0OCBjIC0wLjQ1LC0wLjUyOSAtNi4yNDUsLTcuMjMgLTE1LjQwMywtMTMuNTU0IGwgLTYuMiw2LjIgQyA4Mi4zNTEsNDMuMTQ4IDg2LjkyLDQ3LjQ2OSA4OS4zNzIsNTAgODMuOTk1LDU1LjU1NSA2OC40Niw2OS43MjkgNTAsNjkuNzI5IGMgLTEuMzM0LDAgLTIuNjUxLC0wLjA4MiAtMy45NTIsLTAuMjIyIGwgLTcuNDM5LDcuNDM5IGMgMy42MzksMC45MDkgNy40NDksMS40NSAxMS4zOTEsMS40NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMS45OTkgMS43MDEsLTQuOTAxIC0wLjAwMSwtNi45MDIgeiINCiAgIGlkPSJwYXRoNyINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTEuNDExLDE2LjY2IGMgMCwtMC4yNjYgLTAuMTA1LC0wLjUyIC0wLjI5MywtMC43MDcgbCAtNy4wNzEsLTcuMDcgYyAtMC4zOTEsLTAuMzkxIC0xLjAyMywtMC4zOTEgLTEuNDE0LDAgTCA2Ni44MDQsMjQuNzExIEMgNjEuNjAyLDIyLjgxOCA1NS45NDksMjEuNjAzIDUwLDIxLjYwMyBjIC0yNi40MjcsMCAtNDcuMDk4LDIzLjkyNiAtNDcuOTY1LDI0Ljk0NiAtMS43MDEsMiAtMS43MDEsNC45MDIgMTBlLTQsNi45MDMgMC41MTcsMC42MDcgOC4wODMsOS4zNTQgMTkuNzA3LDE2LjMyIEwgOC44ODMsODIuNjMyIEMgOC42OTUsODIuODIgOC41OSw4My4wNzMgOC41OSw4My4zMzkgYyAwLDAuMjY2IDAuMTA1LDAuNTIgMC4yOTMsMC43MDcgbCA3LjA3MSw3LjA3IGMgMC4xOTUsMC4xOTUgMC40NTEsMC4yOTMgMC43MDcsMC4yOTMgMC4yNTYsMCAwLjUxMiwtMC4wOTggMC43MDcsLTAuMjkzIGwgNzMuNzUsLTczLjc1IGMgMC4xODcsLTAuMTg2IDAuMjkzLC0wLjQ0IDAuMjkzLC0wLjcwNiB6IE0gMTAuNjI4LDUwIEMgMTQuMjU5LDQ2LjI0OSAyMi41MjYsMzguNTcxIDMzLjE5NSwzMy45NzkgMzEuMTE0LDM3LjE0NSAyOS44OTQsNDAuOTI4IDI5Ljg5NCw0NSBjIDAsNC42NjUgMS42MDEsOC45NDUgNC4yNywxMi4zNTEgTCAyOC4wNCw2My40NzUgQyAxOS44ODgsNTguOTU1IDEzLjY0OSw1My4xMiAxMC42MjgsNTAgeiINCiAgIGlkPSJwYXRoOSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQo8L2c+DQo8L3N2Zz4NCg==);background-color:red}.emote-menu .emote-menu-starred .edit-starred{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmNjMDA7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote.emote-menu-starred{border-color:rgba(200,200,0,.5)}.emote-menu .emote.emote-menu-hidden{border-color:rgba(255,0,0,.5)}.emote-menu:not(.editing) .emote-menu-hidden{display:none}.emote-menu:not(.editing) #starred-emotes-group .emote-menu-starred{border-color:transparent}.emote-menu #starred-emotes-group{text-align:center;color:#646464}.emote-menu #starred-emotes-group:empty:before{content:\"Use the edit mode to star an emote!\";position:relative;top:8px}"));

},{}],3:[function(require,module,exports){
module.exports = (function() {
    var Hogan = require('hogan.js/lib/template.js');
    var templates = {};
    templates['emote'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote");if(t.s(t.f("thirdParty",c,p,1),c,p,0,32,44,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" third-party");});c.pop();}if(!t.s(t.f("isVisible",c,p,1),c,p,1,0,0,"")){t.b(" emote-menu-hidden");};if(t.s(t.f("isStarred",c,p,1),c,p,0,119,138,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" emote-menu-starred");});c.pop();}t.b("\" data-emote=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" title=\"");t.b(t.v(t.f("text",c,p,0)));if(t.s(t.f("thirdParty",c,p,1),c,p,0,206,229,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" (from 3rd party addon)");});c.pop();}t.b("\">\r");t.b("\n" + i);t.b("	<div style=\"background-image: url(");t.b(t.t(t.d("image.url",c,p,0)));t.b("); height: ");t.b(t.t(t.d("image.height",c,p,0)));t.b("px; width: ");t.b(t.t(t.d("image.width",c,p,0)));t.b("px\"></div>\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-starred\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-starred\" title=\"Star/unstar emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-visibility\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button glyph-only float-left\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteGroupHeader'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"group-header");if(!t.s(t.f("isVisible",c,p,1),c,p,1,0,0,"")){t.b(" emote-menu-hidden");};t.b("\" data-emote-channel=\"");t.b(t.v(t.f("channel",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div class=\"header-info\">\r");t.b("\n" + i);t.b("		<img src=\"");t.b(t.v(t.f("badge",c,p,0)));t.b("\" />\r");t.b("\n" + i);t.b("		");t.b(t.v(t.f("channelDisplayName",c,p,0)));t.b("\r");t.b("\n" + i);t.b("		<div class=\"edit-tool edit-visibility\" data-which=\"channel-");t.b(t.v(t.f("channel",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show all emotes for ");t.b(t.v(t.f("channel",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['menu'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote-menu\" id=\"emote-menu-for-twitch\">\r");t.b("\n" + i);t.b("	<div class=\"draggable\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"header-info\">All Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container scrollable\" id=\"all-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"header-info\">Favorite Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container single-row\" id=\"starred-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"footer\">\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-home\" href=\"http://cletusc.github.io/Userscript--Twitch-Chat-Emotes\" target=\"_blank\" title=\"Visit the homepage where you can donate, post a review, or contact the developer\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-gear\" data-command=\"toggle-editing\" title=\"Toggle edit mode\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-right icon icon-resize-handle\" data-command=\"resize-handle\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-right icon icon-pin\" data-command=\"toggle-pinned\" title=\"Pin/unpin the emote menu to the screen\"></a>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
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
	"version": "1.0.3",
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
			"http://chatdepot.twitch.tv/*"
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
var api = {};
var prefix = '[Emote Menu] ';
var storage = require('./storage');

api.log = function () {
	if (typeof console.log === 'undefined') {
		return;
	}
	arguments = [].slice.call(arguments).map(function (arg) {
		if (typeof arg !== 'string') {
			return JSON.stringify(arg);
		}
		return arg;
	});
	arguments.unshift(prefix);
	console.log.apply(console, arguments);
};

api.debug = function () {
	if (!storage.global.get('debugMessagesEnabled', false)) {
		return;
	}
	arguments = [].slice.call(arguments);
	arguments.unshift('[DEBUG] ');
	api.log.apply(null, arguments);
}

module.exports = api;

},{"./storage":15}],14:[function(require,module,exports){
var storage = require('./storage');
var logger = require('./logger');
var api = {};

api.toggleDebug = function (forced) {
	if (typeof forced === 'undefined') {
		forced = !storage.global.get('debugMessagesEnabled', false);
	}
	else {
		forced = !!forced;
	}
	storage.global.set('debugMessagesEnabled', forced);
	logger.log('Debug messages are now ' + (forced ? 'enabled' : 'disabled'));
};

module.exports = api;

},{"./logger":13,"./storage":15}],15:[function(require,module,exports){
var Store = require('storage-wrapper');
var storage = {};

// General storage.
storage.global = new Store({
	namespace: 'emote-menu-for-twitch'
});

// Emote visibility storage.
storage.visibility = storage.global.createSubstore('visibility');
// Emote starred storage.
storage.starred = storage.global.createSubstore('starred');
// Display name storage.
storage.displayNames = storage.global.createSubstore('displayNames');

module.exports = storage;

},{"storage-wrapper":11}],16:[function(require,module,exports){
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

},{"../../build/templates":3}],17:[function(require,module,exports){
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

function getUser(username, callback) {
	// Note: not a documented API endpoint.
	api.get('users/' + username)
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
	getTickets: getTickets,
	getUser: getUser
};

},{}],18:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxVc2Vyc1xcQ2xldHVzXFxQcm9qZWN0c1xcVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIi4vc3JjL3NjcmlwdC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvYnVpbGQvc3R5bGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wdW55Y29kZS9wdW55Y29kZS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9kZWNvZGUuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2luZGV4LmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXJsL3VybC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2hvZ2FuLmpzL2xpYi90ZW1wbGF0ZS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2pxdWVyeS1jdXN0b20tc2Nyb2xsYmFyL2pxdWVyeS5jdXN0b20tc2Nyb2xsYmFyLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvc3RvcmFnZS13cmFwcGVyL2luZGV4LmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9wYWNrYWdlLmpzb24iLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL2xvZ2dlci5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvcHVibGljLWFwaS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvc3RvcmFnZS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvdGVtcGxhdGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy90d2l0Y2gtYXBpLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvcGx1Z2lucy9yZXNpemFibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMW9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25zQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6d0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy90ZW1wbGF0ZXMnKTtcclxudmFyIHBrZyA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xyXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9zdG9yYWdlJyk7XHJcbnZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL21vZHVsZXMvdHdpdGNoLWFwaScpO1xyXG52YXIgcHVibGljQXBpID0gcmVxdWlyZSgnLi9tb2R1bGVzL3B1YmxpYy1hcGknKTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnZXInKTtcclxuXHJcbnZhciAkID0gbnVsbDtcclxudmFyIGpRdWVyeSA9IG51bGw7XHJcblxyXG4vLyBFeHBvc2UgcHVibGljIGFwaS5cclxuaWYgKHR5cGVvZiB3aW5kb3cuZW1vdGVNZW51ID09PSAndW5kZWZpbmVkJykge1xyXG5cdHdpbmRvdy5lbW90ZU1lbnUgPSBwdWJsaWNBcGk7XHJcbn1cclxuXHJcbi8vIFNjcmlwdC13aWRlIHZhcmlhYmxlcy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG52YXIgdXJsID0gcmVxdWlyZSgndXJsJyk7XHJcbnZhciBlbW90ZXMgPSB7XHJcblx0dXNhYmxlOiBbXSxcclxuXHRnZXQgcmF3KCkge1xyXG5cdFx0aWYgKHdpbmRvdy5BcHApIHtcclxuXHRcdFx0cmV0dXJuIHdpbmRvdy5BcHAuX19jb250YWluZXJfXy5sb29rdXAoJ2NvbnRyb2xsZXI6ZW1vdGljb25zJykuZ2V0KCdlbW90aWNvbnMnKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBbXTtcclxuXHR9LFxyXG5cdHN1YnNjcmlwdGlvbnM6IHtcclxuXHRcdGJhZGdlczoge30sXHJcblx0XHRlbW90ZXM6IHt9XHJcblx0fVxyXG59O1xyXG52YXIgaXNIb29rZWQgPSB7XHJcblx0Y2hhbm5lbFJvdXRlOiBmYWxzZSxcclxuXHRjaGF0Um91dGU6IGZhbHNlXHJcbn07XHJcblxyXG4vLyBET00gZWxlbWVudHMuXHJcbnZhciBlbGVtZW50cyA9IHtcclxuXHQvLyBUaGUgYnV0dG9uIHRvIHNlbmQgYSBjaGF0IG1lc3NhZ2UuXHJcblx0Y2hhdEJ1dHRvbjogbnVsbCxcclxuXHQvLyBUaGUgYXJlYSB3aGVyZSBhbGwgY2hhdCBtZXNzYWdlcyBhcmUgY29udGFpbmVkLlxyXG5cdGNoYXRDb250YWluZXI6IG51bGwsXHJcblx0Ly8gVGhlIGlucHV0IGZpZWxkIGZvciBjaGF0IG1lc3NhZ2VzLlxyXG5cdGNoYXRCb3g6IG51bGwsXHJcblx0Ly8gVGhlIGJ1dHRvbiB1c2VkIHRvIHNob3cgdGhlIG1lbnUuXHJcblx0bWVudUJ1dHRvbjogbnVsbCxcclxuXHQvLyBUaGUgbWVudSB0aGF0IGNvbnRhaW5zIGFsbCBlbW90ZXMuXHJcblx0bWVudTogbnVsbFxyXG59O1xyXG5cclxuLy8gVGhlIGJhc2ljIHNtaWxleSBlbW90ZXMuXHJcbnZhciBiYXNpY0Vtb3RlcyA9IFsnOignLCAnOiknLCAnOi8nLCAnOkQnLCAnOm8nLCAnOnAnLCAnOnonLCAnOyknLCAnO3AnLCAnPDMnLCAnPignLCAnQiknLCAnUiknLCAnb19vJywgJyMvJywgJzo3JywgJzo+JywgJzpTJywgJzxdJ107XHJcblxyXG52YXIgaGVscGVycyA9IHtcclxuXHR1c2VyOiB7XHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrIGlmIHVzZXIgaXMgbG9nZ2VkIGluLCBhbmQgcHJvbXB0cyB0aGVtIHRvIGlmIHRoZXkgYXJlbid0LlxyXG5cdFx0ICogQHJldHVybiB7Ym9vbGVhbn0gYHRydWVgIGlmIGxvZ2dlZCBpbiwgYGZhbHNlYCBpZiBsb2dnZWQgb3V0LlxyXG5cdFx0ICovXHJcblx0XHRsb2dpbjogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQvLyBDaGVjayBpZiBsb2dnZWQgaW4gYWxyZWFkeS5cclxuXHRcdFx0aWYgKHdpbmRvdy5Ud2l0Y2ggJiYgd2luZG93LlR3aXRjaC51c2VyLmlzTG9nZ2VkSW4oKSkge1xyXG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZygnVXNlciBpcyBsb2dnZWQgaW4uJyk7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gTm90IGxvZ2dlZCBpbiwgY2FsbCBUd2l0Y2gncyBsb2dpbiBtZXRob2QuXHJcblx0XHRcdCQubG9naW4oKTtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdVc2VyIGlzIG5vdCBsb2dnZWQgaW4sIHNob3cgdGhlIGxvZ2luIHNjcmVlbi4nKTtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSxcclxuXHRcdGdldEVtb3RlU2V0czogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHR2YXIgc2V0cyA9IFtdO1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHNldHMgPSBBcHAuX19jb250YWluZXJfX1xyXG5cdFx0XHRcdFx0Lmxvb2t1cCgnY29udHJvbGxlcjpjaGF0JylcclxuXHRcdFx0XHRcdC5nZXQoJ2N1cnJlbnRSb29tJylcclxuXHRcdFx0XHRcdC5nZXQoJ3RtaVJvb20nKVxyXG5cdFx0XHRcdFx0LmdldEVtb3RlcyhUd2l0Y2gudXNlci5sb2dpbigpKTtcclxuXHJcblx0XHRcdFx0c2V0cyA9IHNldHMuZmlsdGVyKGZ1bmN0aW9uICh2YWwpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0eXBlb2YgdmFsID09PSAnbnVtYmVyJyAmJiB2YWwgPj0gMDtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdFbW90aWNvbiBzZXRzIHJldHJpZXZlZC4nLCBzZXRzKTtcclxuXHRcdFx0XHRyZXR1cm4gc2V0cztcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaCAoZXJyKSB7XHJcblx0XHRcdFx0cmV0dXJuIFtdO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG59O1xyXG5cclxubG9nZ2VyLmxvZygnSW5pdGlhbCBsb2FkLicpO1xyXG5cclxuLy8gT25seSBlbmFibGUgc2NyaXB0IGlmIHdlIGhhdmUgdGhlIHJpZ2h0IHZhcmlhYmxlcy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuKGZ1bmN0aW9uIGluaXQodGltZSkge1xyXG5cdCQgPSBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xyXG5cdHZhciBvYmplY3RzTG9hZGVkID0gKFxyXG5cdFx0d2luZG93LlR3aXRjaCAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHQoXHJcblx0XHRcdHdpbmRvdy5BcHAgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0XHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18gIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0XHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdjb250cm9sbGVyOmVtb3RpY29ucycpLmdldCgnZW1vdGljb25zJykgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0XHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdjb250cm9sbGVyOmVtb3RpY29ucycpLmdldCgnZW1vdGljb25zJykubGVuZ3RoXHJcblx0XHQpICYmXHJcblx0XHRqUXVlcnkgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0Ly8gQ2hhdCBidXR0b24uXHJcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2hhdF9zcGVhaywgLnNlbmQtY2hhdC1idXR0b24nKVxyXG5cdCk7XHJcblx0aWYgKCFvYmplY3RzTG9hZGVkKSB7XHJcblx0XHQvLyBFcnJvcnMgaW4gYXBwcm94aW1hdGVseSAxMDI0MDBtcy5cclxuXHRcdGlmICh0aW1lID49IDYwMDAwKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnVGFraW5nIHRvbyBsb25nIHRvIGxvYWQsIHN0b3BwaW5nLicpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpZiAodGltZSA+PSAxMDAwMCkge1xyXG5cdFx0XHRpZiAoIW9iamVjdHNMb2FkZWQpIHtcclxuXHRcdFx0XHRsb2dnZXIuZGVidWcoJ09iamVjdHMgc3RpbGwgbm90IGxvYWRlZC4nKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0c2V0VGltZW91dChpbml0LCB0aW1lLCB0aW1lICogMik7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHZhciBhY3RpdmF0ZSA9IHtcclxuXHRcdGFjdGl2YXRlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHRoaXMuX3N1cGVyKCk7XHJcblx0XHRcdGluaXQoNTApO1xyXG5cdFx0fVxyXG5cdH07XHJcblx0dmFyIGNoYW5uZWxSb3V0ZSA9IHdpbmRvdy5BcHAuX19jb250YWluZXJfXy5sb29rdXAoJ3JvdXRlOmNoYW5uZWwnKTtcclxuXHR2YXIgY2hhdFJvdXRlID0gd2luZG93LkFwcC5fX2NvbnRhaW5lcl9fLmxvb2t1cCgncm91dGU6Y2hhdCcpO1xyXG5cclxuXHRpZiAoIWlzSG9va2VkLmNoYW5uZWxSb3V0ZSAmJiBjaGFubmVsUm91dGUpIHtcclxuXHRcdGNoYW5uZWxSb3V0ZS5yZW9wZW4oYWN0aXZhdGUpO1xyXG5cdFx0aXNIb29rZWQuY2hhbm5lbFJvdXRlID0gdHJ1ZTtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnSG9va2VkIGludG8gY2hhbm5lbCByb3V0ZS4nKTtcclxuXHR9XHJcblx0aWYgKCFpc0hvb2tlZC5jaGF0Um91dGUgJiYgY2hhdFJvdXRlKSB7XHJcblx0XHRjaGF0Um91dGUucmVvcGVuKGFjdGl2YXRlKTtcclxuXHRcdGlzSG9va2VkLmNoYXRSb3V0ZSA9IHRydWU7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0hvb2tlZCBpbnRvIGNoYXQgcm91dGUuJyk7XHJcblx0fVxyXG5cdHNldHVwKCk7XHJcbn0pKDUwKTtcclxuXHJcbi8vIFN0YXJ0IG9mIGZ1bmN0aW9ucy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vKipcclxuICogUnVucyBpbml0aWFsIHNldHVwIG9mIERPTSBhbmQgdmFyaWFibGVzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcblx0bG9nZ2VyLmRlYnVnKCdSdW5uaW5nIHNldHVwLi4uJyk7XHJcblx0Ly8gTG9hZCBDU1MuXHJcblx0cmVxdWlyZSgnLi4vYnVpbGQvc3R5bGVzJyk7XHJcblx0Ly8gTG9hZCBqUXVlcnkgcGx1Z2lucy5cclxuXHRyZXF1aXJlKCcuL3BsdWdpbnMvcmVzaXphYmxlJyk7XHJcblx0cmVxdWlyZSgnanF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXIvanF1ZXJ5LmN1c3RvbS1zY3JvbGxiYXInKTtcclxuXHRcclxuXHRlbGVtZW50cy5jaGF0QnV0dG9uID0gJCgnLnNlbmQtY2hhdC1idXR0b24nKTtcclxuXHRlbGVtZW50cy5jaGF0Qm94ID0gJCgnLmNoYXQtaW50ZXJmYWNlIHRleHRhcmVhJyk7XHJcblx0ZWxlbWVudHMuY2hhdENvbnRhaW5lciA9ICQoJy5jaGF0LW1lc3NhZ2VzJyk7XHJcblxyXG5cdC8vIE5vIGNoYXQsIGp1c3QgZXhpdC5cclxuXHRpZiAoIWVsZW1lbnRzLmNoYXRCdXR0b24ubGVuZ3RoKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ05vIGNoYXQgZWxlbWVudCBhdmFpbGFibGUsIGlnbm9yZSBzZXR1cCB0aGlzIHRpbWUuJyk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHRjcmVhdGVNZW51RWxlbWVudHMoKTtcclxuXHRiaW5kTGlzdGVuZXJzKCk7XHJcblxyXG5cdC8vIEdldCBhY3RpdmUgc3Vic2NyaXB0aW9ucy5cclxuXHR0d2l0Y2hBcGkuZ2V0VGlja2V0cyhmdW5jdGlvbiAodGlja2V0cykge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdUaWNrZXRzIGxvYWRlZC4nLCB0aWNrZXRzKTtcclxuXHRcdHRpY2tldHMuZm9yRWFjaChmdW5jdGlvbiAodGlja2V0KSB7XHJcblx0XHRcdHZhciBwcm9kdWN0ID0gdGlja2V0LnByb2R1Y3Q7XHJcblx0XHRcdHZhciBjaGFubmVsID0gcHJvZHVjdC5vd25lcl9uYW1lIHx8IHByb2R1Y3Quc2hvcnRfbmFtZTtcclxuXHRcdFx0Ly8gR2V0IHN1YnNjcmlwdGlvbnMgd2l0aCBlbW90ZXMuXHJcblx0XHRcdGlmIChwcm9kdWN0LmVtb3RpY29ucyAmJiBwcm9kdWN0LmVtb3RpY29ucy5sZW5ndGgpIHtcclxuXHRcdFx0XHQvLyBBZGQgZW1vdGVzIGNoYW5uZWwuXHJcblx0XHRcdFx0cHJvZHVjdC5lbW90aWNvbnMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRcdGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tnZXRFbW90ZUZyb21SZWdFeChuZXcgUmVnRXhwKGVtb3RlLnJlZ2V4KSldID0ge1xyXG5cdFx0XHRcdFx0XHRjaGFubmVsOiBjaGFubmVsLFxyXG5cdFx0XHRcdFx0XHR1cmw6IGVtb3RlLnVybFxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0Ly8gR2V0IGJhZGdlLlxyXG5cdFx0XHRcdHR3aXRjaEFwaS5nZXRCYWRnZXMoY2hhbm5lbCwgZnVuY3Rpb24gKGJhZGdlcykge1xyXG5cdFx0XHRcdFx0dmFyIGJhZGdlID0gJyc7XHJcblx0XHRcdFx0XHRpZiAoY2hhbm5lbCA9PT0gJ3R1cmJvJykge1xyXG5cdFx0XHRcdFx0XHRiYWRnZSA9IGJhZGdlcy50dXJiby5pbWFnZTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2UgaWYgKGJhZGdlcy5zdWJzY3JpYmVyICYmIGJhZGdlcy5zdWJzY3JpYmVyLmltYWdlKSB7XHJcblx0XHRcdFx0XHRcdGJhZGdlID0gYmFkZ2VzLnN1YnNjcmliZXIuaW1hZ2U7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbY2hhbm5lbF0gPSBiYWRnZTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0Ly8gR2V0IGRpc3BsYXkgbmFtZXMuXHJcblx0XHRcdFx0aWYgKGNoYW5uZWwgIT09IG51bGwgJiYgc3RvcmFnZS5kaXNwbGF5TmFtZXMuZ2V0KGNoYW5uZWwpID09PSBudWxsKSB7XHJcblx0XHRcdFx0XHRpZiAoY2hhbm5lbCA9PT0gJ3R1cmJvJykge1xyXG5cdFx0XHRcdFx0XHRzdG9yYWdlLmRpc3BsYXlOYW1lcy5zZXQoY2hhbm5lbCwgJ1R1cmJvJyk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0dHdpdGNoQXBpLmdldFVzZXIoY2hhbm5lbCwgZnVuY3Rpb24gKHVzZXIpIHtcclxuXHRcdFx0XHRcdFx0XHRsb2dnZXIuZGVidWcoJ0dldHRpbmcgZnJlc2ggZGlzcGxheSBuYW1lIGZvciB1c2VyJywgdXNlcik7XHJcblx0XHRcdFx0XHRcdFx0c3RvcmFnZS5kaXNwbGF5TmFtZXMuc2V0KGNoYW5uZWwsIHVzZXIuZGlzcGxheV9uYW1lLCA4NjQwMDAwMCk7XHJcblx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBpbml0aWFsIG1lbnUgZWxlbWVudHNcclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZU1lbnVFbGVtZW50cygpIHtcclxuXHQvLyBSZW1vdmUgbWVudSBidXR0b24gaWYgZm91bmQuXHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbiA9ICQoJyNlbW90ZS1tZW51LWJ1dHRvbicpO1xyXG5cdGlmIChlbGVtZW50cy5tZW51QnV0dG9uLmxlbmd0aCkge1xyXG5cdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5yZW1vdmUoKTtcclxuXHR9XHJcblx0Ly8gQ3JlYXRlIG1lbnUgYnV0dG9uLlxyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24gPSAkKHRlbXBsYXRlcy5lbW90ZUJ1dHRvbigpKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmluc2VydEJlZm9yZShlbGVtZW50cy5jaGF0QnV0dG9uKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmhpZGUoKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmZhZGVJbigpO1xyXG5cclxuXHQvLyBSZW1vdmUgbWVudSBpZiBmb3VuZC5cclxuXHRlbGVtZW50cy5tZW51ID0gJCgnI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCcpO1xyXG5cdGlmIChlbGVtZW50cy5tZW51Lmxlbmd0aCkge1xyXG5cdFx0ZWxlbWVudHMubWVudS5yZW1vdmUoKTtcclxuXHR9XHJcblx0Ly8gQ3JlYXRlIG1lbnUuXHJcblx0ZWxlbWVudHMubWVudSA9ICQodGVtcGxhdGVzLm1lbnUoKSk7XHJcblx0ZWxlbWVudHMubWVudS5hcHBlbmRUbyhkb2N1bWVudC5ib2R5KTtcclxuXHJcblx0bG9nZ2VyLmRlYnVnKCdDcmVhdGVkIG1lbnUgZWxlbWVudHMuJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBCaW5kIGV2ZW50IGxpc3RlbmVycy5cclxuICovXHJcbmZ1bmN0aW9uIGJpbmRMaXN0ZW5lcnMoKSB7XHJcblxyXG5cdGZ1bmN0aW9uIHRvZ2dsZU1lbnUoKSB7XHJcblx0XHQvLyBNZW51IHNob3duLCBoaWRlIGl0LlxyXG5cdFx0aWYgKGVsZW1lbnRzLm1lbnUuaXMoJzp2aXNpYmxlJykpIHtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5oaWRlKCk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUucmVtb3ZlQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LnJlbW92ZUNsYXNzKCdlZGl0aW5nJyk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnVCdXR0b24ucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdNZW51IGhpZGRlbi4nKTtcclxuXHRcdH1cclxuXHRcdC8vIE1lbnUgaGlkZGVuLCBzaG93IGl0LlxyXG5cdFx0ZWxzZSBpZiAoaGVscGVycy51c2VyLmxvZ2luKCkpIHtcclxuXHRcdFx0cG9wdWxhdGVFbW90ZXNNZW51KCk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuc2hvdygpO1xyXG5cdFx0XHRlbGVtZW50cy5tZW51QnV0dG9uLmFkZENsYXNzKCdhY3RpdmUnKTtcclxuXHJcblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwJywgY2hlY2tGb3JDbGlja091dHNpZGUpO1xyXG5cclxuXHRcdFx0Ly8gTWVudSBtb3ZlZCwgbW92ZSBpdCBiYWNrLlxyXG5cdFx0XHRpZiAoZWxlbWVudHMubWVudS5oYXNDbGFzcygnbW92ZWQnKSkge1xyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUub2Zmc2V0KEpTT04ucGFyc2UoZWxlbWVudHMubWVudS5hdHRyKCdkYXRhLW9mZnNldCcpKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gTmV2ZXIgbW92ZWQsIG1ha2UgaXQgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgY2hhdCB3aW5kb3cuXHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdHZhciBkaWZmID0gZWxlbWVudHMubWVudS5oZWlnaHQoKSAtIGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKS5oZWlnaHQoKTtcclxuXHRcdFx0XHQvLyBBZGp1c3QgdGhlIHNpemUgYW5kIHBvc2l0aW9uIG9mIHRoZSBwb3B1cC5cclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LmhlaWdodChlbGVtZW50cy5jaGF0Q29udGFpbmVyLm91dGVySGVpZ2h0KCkgLSAoZWxlbWVudHMubWVudS5vdXRlckhlaWdodCgpIC0gZWxlbWVudHMubWVudS5oZWlnaHQoKSkpO1xyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUud2lkdGgoZWxlbWVudHMuY2hhdENvbnRhaW5lci5vdXRlcldpZHRoKCkgLSAoZWxlbWVudHMubWVudS5vdXRlcldpZHRoKCkgLSBlbGVtZW50cy5tZW51LndpZHRoKCkpKTtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51Lm9mZnNldChlbGVtZW50cy5jaGF0Q29udGFpbmVyLm9mZnNldCgpKTtcclxuXHRcdFx0XHQvLyBGaXggYC5lbW90ZXMtYWxsYCBoZWlnaHQuXHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpLmhlaWdodChlbGVtZW50cy5tZW51LmhlaWdodCgpIC0gZGlmZik7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpLndpZHRoKGVsZW1lbnRzLm1lbnUud2lkdGgoKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gUmVjYWxjdWxhdGUgYW55IHNjcm9sbCBiYXJzLlxyXG5cdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJykuY3VzdG9tU2Nyb2xsYmFyKCdyZXNpemUnKTtcclxuXHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnTWVudSB2aXNpYmxlLicpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKGUpIHtcclxuXHRcdFx0Ly8gTm90IG91dHNpZGUgb2YgdGhlIG1lbnUsIGlnbm9yZSB0aGUgY2xpY2suXHJcblx0XHRcdGlmICgkKGUudGFyZ2V0KS5pcygnI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCwgI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCAqJykpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gQ2xpY2tlZCBvbiB0aGUgbWVudSBidXR0b24sIGp1c3QgcmVtb3ZlIHRoZSBsaXN0ZW5lciBhbmQgbGV0IHRoZSBub3JtYWwgbGlzdGVuZXIgaGFuZGxlIGl0LlxyXG5cdFx0XHRpZiAoIWVsZW1lbnRzLm1lbnUuaXMoJzp2aXNpYmxlJykgfHwgJChlLnRhcmdldCkuaXMoJyNlbW90ZS1tZW51LWJ1dHRvbiwgI2Vtb3RlLW1lbnUtYnV0dG9uIConKSkge1xyXG5cdFx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gQ2xpY2tlZCBvdXRzaWRlLCBtYWtlIHN1cmUgdGhlIG1lbnUgaXNuJ3QgcGlubmVkLlxyXG5cdFx0XHRpZiAoIWVsZW1lbnRzLm1lbnUuaGFzQ2xhc3MoJ3Bpbm5lZCcpKSB7XHJcblx0XHRcdFx0Ly8gTWVudSB3YXNuJ3QgcGlubmVkLCByZW1vdmUgbGlzdGVuZXIuXHJcblx0XHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgY2hlY2tGb3JDbGlja091dHNpZGUpO1xyXG5cdFx0XHRcdHRvZ2dsZU1lbnUoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gVG9nZ2xlIG1lbnUuXHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbi5vbignY2xpY2snLCB0b2dnbGVNZW51KTtcclxuXHJcblx0Ly8gTWFrZSBkcmFnZ2FibGUuXHJcblx0ZWxlbWVudHMubWVudS5kcmFnZ2FibGUoe1xyXG5cdFx0aGFuZGxlOiAnLmRyYWdnYWJsZScsXHJcblx0XHRzdGFydDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdwaW5uZWQnKTtcclxuXHRcdFx0JCh0aGlzKS5hZGRDbGFzcygnbW92ZWQnKTtcclxuXHRcdH0sXHJcblx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuYXR0cignZGF0YS1vZmZzZXQnLCBKU09OLnN0cmluZ2lmeShlbGVtZW50cy5tZW51Lm9mZnNldCgpKSk7XHJcblx0XHR9LFxyXG5cdFx0Y29udGFpbm1lbnQ6ICQoZG9jdW1lbnQuYm9keSlcclxuXHR9KTtcclxuXHJcblx0ZWxlbWVudHMubWVudS5yZXNpemFibGUoe1xyXG5cdFx0aGFuZGxlOiAnW2RhdGEtY29tbWFuZD1cInJlc2l6ZS1oYW5kbGVcIl0nLFxyXG5cdFx0cmVzaXplOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdC8vIFJlY2FsY3VsYXRlIGFueSBzY3JvbGwgYmFycy5cclxuXHRcdFx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcigncmVzaXplJyk7XHJcblx0XHR9LFxyXG5cdFx0c3RvcDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdwaW5uZWQnKTtcclxuXHRcdFx0JCh0aGlzKS5hZGRDbGFzcygnbW92ZWQnKTtcclxuXHRcdH0sXHJcblx0XHRhbHNvUmVzaXplOiBlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJyksXHJcblx0XHRjb250YWlubWVudDogJChkb2N1bWVudC5ib2R5KSxcclxuXHRcdG1pbkhlaWdodDogMTgwLFxyXG5cdFx0bWluV2lkdGg6IDIwMFxyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgbWVudSBwaW5uaW5nLlxyXG5cdGVsZW1lbnRzLm1lbnUuZmluZCgnW2RhdGEtY29tbWFuZD1cInRvZ2dsZS1waW5uZWRcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRlbGVtZW50cy5tZW51LnRvZ2dsZUNsYXNzKCdwaW5uZWQnKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIG1lbnUgZWRpdGluZy5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtZWRpdGluZ1wiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGVsZW1lbnRzLm1lbnUudG9nZ2xlQ2xhc3MoJ2VkaXRpbmcnKTtcclxuXHRcdC8vIFJlY2FsY3VsYXRlIGFueSBzY3JvbGwgYmFycy5cclxuXHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnLnNjcm9sbGFibGUnKS5jdXN0b21TY3JvbGxiYXIoJ3Jlc2l6ZScpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgZW1vdGUgY2xpY2tpbmcgKGRlbGVnYXRlZCkuXHJcblx0ZWxlbWVudHMubWVudS5vbignY2xpY2snLCAnLmVtb3RlJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKGVsZW1lbnRzLm1lbnUuaXMoJy5lZGl0aW5nJykpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0aW5zZXJ0RW1vdGVUZXh0KCQodGhpcykuYXR0cignZGF0YS1lbW90ZScpKTtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnQ2xpY2tlZCBlbW90ZTogJyArICQodGhpcykuYXR0cignZGF0YS1lbW90ZScpKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIGVtb3RlIGhpZGluZyAoZGVsZWdhdGVkKS5cclxuXHRlbGVtZW50cy5tZW51Lm9uKCdjbGljaycsICdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLXZpc2liaWxpdHlcIl0nLCBmdW5jdGlvbiAoKSB7XHJcblx0XHQvLyBNYWtlIHN1cmUgd2UgYXJlIGluIGVkaXQgbW9kZS5cclxuXHRcdGlmICghZWxlbWVudHMubWVudS5pcygnLmVkaXRpbmcnKSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHR2YXIgd2hpY2ggPSAkKHRoaXMpLmF0dHIoJ2RhdGEtd2hpY2gnKTtcclxuXHRcdHZhciBpc1Zpc2libGUgPSBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KHdoaWNoLCB0cnVlKTtcclxuXHRcdC8vIFRvZ2dsZSB2aXNpYmlsaXR5LlxyXG5cdFx0c3RvcmFnZS52aXNpYmlsaXR5LnNldCh3aGljaCwgIWlzVmlzaWJsZSk7XHJcblx0XHRwb3B1bGF0ZUVtb3Rlc01lbnUoKTtcclxuXHJcblx0XHRsb2dnZXIuZGVidWcoJ1NldCBoaWRkZW4gZW1vdGUuJywge1xyXG5cdFx0XHR3aGljaDogd2hpY2gsXHJcblx0XHRcdGlzVmlzaWJsZTogIWlzVmlzaWJsZVxyXG5cdFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBlbW90ZSBzdGFycmluZyAoZGVsZWdhdGVkKS5cclxuXHRlbGVtZW50cy5tZW51Lm9uKCdjbGljaycsICdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLXN0YXJyZWRcIl0nLCBmdW5jdGlvbiAoKSB7XHJcblx0XHQvLyBNYWtlIHN1cmUgd2UgYXJlIGluIGVkaXQgbW9kZS5cclxuXHRcdGlmICghZWxlbWVudHMubWVudS5pcygnLmVkaXRpbmcnKSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHR2YXIgd2hpY2ggPSAkKHRoaXMpLmF0dHIoJ2RhdGEtd2hpY2gnKTtcclxuXHRcdHZhciBpc1N0YXJyZWQgPSBzdG9yYWdlLnN0YXJyZWQuZ2V0KHdoaWNoLCBmYWxzZSk7XHJcblx0XHQvLyBUb2dnbGUgc3Rhci5cclxuXHRcdHN0b3JhZ2Uuc3RhcnJlZC5zZXQod2hpY2gsICFpc1N0YXJyZWQpO1xyXG5cdFx0cG9wdWxhdGVFbW90ZXNNZW51KCk7XHJcblxyXG5cdFx0bG9nZ2VyLmRlYnVnKCdTZXQgc3RhcnJlZCBlbW90ZS4nLCB7XHJcblx0XHRcdHdoaWNoOiB3aGljaCxcclxuXHRcdFx0aXNTdGFycmVkOiAhaXNTdGFycmVkXHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHJcblx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcih7XHJcblx0XHRza2luOiAnZGVmYXVsdC1za2luJyxcclxuXHRcdGhTY3JvbGw6IGZhbHNlLFxyXG5cdFx0cHJldmVudERlZmF1bHRTY3JvbGw6IHRydWVcclxuXHR9KTtcclxuXHJcblx0bG9nZ2VyLmRlYnVnKCdCb3VuZGVkIGV2ZW50IGxpc3RlbmVycy4nKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFBvcHVsYXRlcyB0aGUgcG9wdXAgbWVudSB3aXRoIGN1cnJlbnQgZW1vdGUgZGF0YS5cclxuICovXHJcbmZ1bmN0aW9uIHBvcHVsYXRlRW1vdGVzTWVudSgpIHtcclxuXHR2YXIgY29udGFpbmVyO1xyXG5cdHZhciBzdGFycmVkRW1vdGVzID0gbnVsbDtcclxuXHJcblx0cmVmcmVzaFVzYWJsZUVtb3RlcygpO1xyXG5cclxuXHQvLyBBZGQgc3RhcnJlZCBlbW90ZXMuXHJcblx0Y29udGFpbmVyID0gZWxlbWVudHMubWVudS5maW5kKCcjc3RhcnJlZC1lbW90ZXMtZ3JvdXAnKTtcclxuXHRjb250YWluZXIuaHRtbCgnJyk7XHJcblx0c3RhcnJlZEVtb3RlcyA9IGVtb3Rlcy51c2FibGUuZmlsdGVyKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0cmV0dXJuIGVtb3RlLmlzU3RhcnJlZCAmJiBlbW90ZS5pc1Zpc2libGU7XHJcblx0fSk7XHJcblx0c3RhcnJlZEVtb3Rlcy5zb3J0KHNvcnRCeU5vcm1hbCk7XHJcblx0c3RhcnJlZEVtb3Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0Y3JlYXRlRW1vdGUoZW1vdGUsIGNvbnRhaW5lcik7XHJcblx0fSk7XHJcblxyXG5cdC8vIEFkZCBhbGwgZW1vdGVzLlxyXG5cdGNvbnRhaW5lciA9IGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKTtcclxuXHRpZiAoY29udGFpbmVyLmZpbmQoJy5vdmVydmlldycpLmxlbmd0aCkge1xyXG5cdFx0Y29udGFpbmVyID0gY29udGFpbmVyLmZpbmQoJy5vdmVydmlldycpO1xyXG5cdH1cclxuXHRjb250YWluZXIuaHRtbCgnJyk7XHJcblx0ZW1vdGVzLnVzYWJsZS5zb3J0KHNvcnRCeVNldCk7XHJcblx0ZW1vdGVzLnVzYWJsZS5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0Y3JlYXRlRW1vdGUoZW1vdGUsIGNvbnRhaW5lciwgdHJ1ZSk7XHJcblx0fSk7XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgYWxwaGFudW1lcmljIGluIHRoaXMgb3JkZXI6IHN5bWJvbHMgLT4gbnVtYmVycyAtPiBBYUJiLi4uIC0+IG51bWJlcnNcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBzb3J0QnlOb3JtYWwoYSwgYil7XHJcblx0XHRhID0gYS50ZXh0O1xyXG5cdFx0YiA9IGIudGV4dDtcclxuXHRcdGlmIChhLnRvTG93ZXJDYXNlKCkgPCBiLnRvTG93ZXJDYXNlKCkpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGEudG9Mb3dlckNhc2UoKSA+IGIudG9Mb3dlckNhc2UoKSkge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdGlmIChhIDwgYikge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYSA+IGIpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgZW1vdGljb24gc2V0OiBiYXNpYyBzbWlsZXlzIC0+IG5vIHNldCAtPiBzdWJzY3JpcHRpb24gZW1vdGVzXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gc29ydEJ5U2V0KGEsIGIpe1xyXG5cdFx0Ly8gT3ZlcnJpZGUgZm9yIGJhc2ljIGVtb3Rlcy5cclxuXHRcdGlmIChiYXNpY0Vtb3Rlcy5pbmRleE9mKGEudGV4dCkgPj0gMCAmJlx0YmFzaWNFbW90ZXMuaW5kZXhPZihiLnRleHQpIDwgMCkge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYmFzaWNFbW90ZXMuaW5kZXhPZihiLnRleHQpID49IDAgJiZcdGJhc2ljRW1vdGVzLmluZGV4T2YoYS50ZXh0KSA8IDApIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHQvLyBTb3J0IGJ5IGNoYW5uZWwgbmFtZS5cclxuXHRcdGlmIChhLmNoYW5uZWwgJiYgIWIuY2hhbm5lbCkge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdGlmIChiLmNoYW5uZWwgJiYgIWEuY2hhbm5lbCkge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYS5jaGFubmVsICYmIGIuY2hhbm5lbCkge1xyXG5cdFx0XHQvLyBGb3JjZSBhZGRvbiBlbW90ZSBncm91cHMgYmVsb3cgc3RhbmRhcmQgVHdpdGNoIGdyb3Vwcy5cclxuXHRcdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1thLmNoYW5uZWxdICYmICFlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbYi5jaGFubmVsXSkge1xyXG5cdFx0XHRcdHJldHVybiAtMTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZW1vdGVzLnN1YnNjcmlwdGlvbnMuYmFkZ2VzW2IuY2hhbm5lbF0gJiYgIWVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1thLmNoYW5uZWxdKSB7XHJcblx0XHRcdFx0cmV0dXJuIDE7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBjaGFubmVsU29ydCA9IHNvcnRCeU5vcm1hbCh7dGV4dDogYS5jaGFubmVsfSwge3RleHQ6IGIuY2hhbm5lbH0pO1xyXG5cdFx0XHR2YXIgbm9ybWFsU29ydCA9IHNvcnRCeU5vcm1hbChhLCBiKTtcclxuXHRcdFx0aWYgKGNoYW5uZWxTb3J0ID09PSAwKSB7XHJcblx0XHRcdFx0cmV0dXJuIG5vcm1hbFNvcnQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGNoYW5uZWxTb3J0O1xyXG5cdFx0fVxyXG5cdFx0Ly8gR2V0IGl0IGJhY2sgdG8gYSBzdGFibGUgc29ydC5cclxuXHRcdHJldHVybiBzb3J0QnlOb3JtYWwoYSwgYik7XHJcblx0fVxyXG59XHJcblxyXG4vKipcclxuICogUmVmcmVzaGVzIHRoZSB1c2FibGUgZW1vdGVzLiBBbiBlbW90ZSBpcyBkZWVtZWQgdXNhYmxlIGlmIGl0IGVpdGhlciBoYXMgbm8gc2V0IG9yIHRoZSBzZXQgaXMgaW4geW91ciB1c2VyIGluZm8uIEZvciB0dXJibyBzZXRzLCBpdCB3aWxsIHVzZSB0aGUgdHVyYm8gaWYgaW4geW91ciB1c2VyIGluZm8sIG90aGVyd2lzZSBmYWxsIGJhY2sgdG8gZGVmYXVsdC5cclxuICovXHJcbmZ1bmN0aW9uIHJlZnJlc2hVc2FibGVFbW90ZXMoKSB7XHJcblx0dmFyIHR1cmJvU2V0cyA9IFs0NTcsIDc5M107XHJcblx0c3RvcmFnZS5nbG9iYWwuc2V0KCdlbW90ZVNldHMnLCBoZWxwZXJzLnVzZXIuZ2V0RW1vdGVTZXRzKCkpO1xyXG5cdGVtb3Rlcy51c2FibGUgPSBbXTtcclxuXHRlbW90ZXMucmF3LmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHQvLyBBbGxvdyBoaWRpbmcgb2YgZW1vdGVzIGZyb20gdGhlIG1lbnUuXHJcblx0XHRpZiAoZW1vdGUuaGlkZGVuKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGlmICghZW1vdGUudGV4dCkge1xyXG5cdFx0XHRlbW90ZS50ZXh0ID0gZ2V0RW1vdGVGcm9tUmVnRXgoZW1vdGUucmVnZXgpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSkge1xyXG5cdFx0XHRlbW90ZS5jaGFubmVsID0gZW1vdGVzLnN1YnNjcmlwdGlvbnMuZW1vdGVzW2Vtb3RlLnRleHRdLmNoYW5uZWw7XHJcblx0XHR9XHJcblx0XHR2YXIgZGVmYXVsdEltYWdlO1xyXG5cdFx0ZW1vdGUuaW1hZ2VzLnNvbWUoZnVuY3Rpb24gKGltYWdlKSB7XHJcblx0XHRcdGlmIChpbWFnZS5lbW90aWNvbl9zZXQgPT09IG51bGwpIHtcclxuXHRcdFx0XHRkZWZhdWx0SW1hZ2UgPSBpbWFnZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoXHJcblx0XHRcdFx0Ly8gSW1hZ2UgaXMgdGhlIHNhbWUgVVJMIGFzIHRoZSBzdWJzY3JpcHRpb24gZW1vdGUuXHJcblx0XHRcdFx0KGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSAmJiBpbWFnZS51cmwgPT09IGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XS51cmwpIHx8XHJcblx0XHRcdFx0KHN0b3JhZ2UuZ2xvYmFsLmdldCgnZW1vdGVTZXRzJywgW10pLmluZGV4T2YoaW1hZ2UuZW1vdGljb25fc2V0KSA+PSAwKSB8fFxyXG5cdFx0XHRcdC8vIEVtb3RlIGlzIGZvcmNlZCB0byBzaG93LlxyXG5cdFx0XHRcdGVtb3RlLmhpZGRlbiA9PT0gZmFsc2VcclxuXHRcdFx0KSB7XHJcblx0XHRcdFx0aWYgKHR1cmJvU2V0cy5pbmRleE9mKGltYWdlLmVtb3RpY29uX3NldCkgPj0gMCkge1xyXG5cdFx0XHRcdFx0ZW1vdGUuY2hhbm5lbCA9ICd0dXJibyc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVtb3RlLmltYWdlID0gaW1hZ2U7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdFx0ZW1vdGUuaW1hZ2UgPSBlbW90ZS5pbWFnZSB8fCBkZWZhdWx0SW1hZ2U7XHJcblxyXG5cdFx0Ly8gT25seSBhZGQgdGhlIGVtb3RlIGlmIHRoZXJlIGlzIGEgVVJMLlxyXG5cdFx0aWYgKGVtb3RlLmltYWdlICYmIGVtb3RlLmltYWdlLnVybCAhPT0gbnVsbCkge1xyXG5cdFx0XHQvLyBEZXRlcm1pbmUgaWYgZW1vdGUgaXMgZnJvbSBhIHRoaXJkLXBhcnR5IGFkZG9uLlxyXG5cdFx0XHRlbW90ZS5pc1RoaXJkUGFydHkgPSB1cmwucGFyc2UoZW1vdGUuaW1hZ2UudXJsKS5ob3N0bmFtZSAhPT0gJ3N0YXRpYy1jZG4uanR2bncubmV0JztcclxuXHRcdFx0Ly8gRGV0ZXJtaW5lIGlmIGVtb3RlIGlzIGhpZGRlbiBieSB1c2VyLlxyXG5cdFx0XHRlbW90ZS5pc1Zpc2libGUgPSBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KCdjaGFubmVsLScgKyBlbW90ZS5jaGFubmVsLCB0cnVlKSAmJiBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KGVtb3RlLnRleHQsIHRydWUpO1xyXG5cdFx0XHQvLyBHZXQgc3RhcnJlZCBzdGF0dXMuXHJcblx0XHRcdGVtb3RlLmlzU3RhcnJlZCA9IHN0b3JhZ2Uuc3RhcnJlZC5nZXQoZW1vdGUudGV4dCwgZmFsc2UpO1xyXG5cdFx0XHRcclxuXHRcdFx0ZW1vdGVzLnVzYWJsZS5wdXNoKGVtb3RlKTtcclxuXHRcdH1cclxuXHR9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEluc2VydHMgYW4gZW1vdGUgaW50byB0aGUgY2hhdCBib3guXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSAoZS5nLiBcIkthcHBhXCIpLlxyXG4gKi9cclxuZnVuY3Rpb24gaW5zZXJ0RW1vdGVUZXh0KHRleHQpIHtcclxuXHQvLyBHZXQgaW5wdXQuXHJcblx0dmFyIGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2hhdF90ZXh0X2lucHV0LCAuY2hhdC1pbnRlcmZhY2UgdGV4dGFyZWEnKTtcclxuXHJcblx0Ly8gSW5zZXJ0IGF0IGN1cnNvciAvIHJlcGxhY2Ugc2VsZWN0aW9uLlxyXG5cdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvQ29kZV9zbmlwcGV0cy9NaXNjZWxsYW5lb3VzXHJcblx0dmFyIHNlbGVjdGlvbkVuZCA9IGVsZW1lbnQuc2VsZWN0aW9uU3RhcnQgKyB0ZXh0Lmxlbmd0aDtcclxuXHR2YXIgY3VycmVudFZhbHVlID0gZWxlbWVudC52YWx1ZTtcclxuXHR2YXIgYmVmb3JlVGV4dCA9IGN1cnJlbnRWYWx1ZS5zdWJzdHJpbmcoMCwgZWxlbWVudC5zZWxlY3Rpb25TdGFydCk7XHJcblx0dmFyIGFmdGVyVGV4dCA9IGN1cnJlbnRWYWx1ZS5zdWJzdHJpbmcoZWxlbWVudC5zZWxlY3Rpb25FbmQsIGN1cnJlbnRWYWx1ZS5sZW5ndGgpO1xyXG5cdC8vIFNtYXJ0IHBhZGRpbmcsIG9ubHkgcHV0IHNwYWNlIGF0IHN0YXJ0IGlmIG5lZWRlZC5cclxuXHRpZiAoXHJcblx0XHRiZWZvcmVUZXh0ICE9PSAnJyAmJlxyXG5cdFx0YmVmb3JlVGV4dC5zdWJzdHIoLTEpICE9PSAnICdcclxuXHQpIHtcclxuXHRcdHRleHQgPSAnICcgKyB0ZXh0O1xyXG5cdH1cclxuXHQvLyBBbHdheXMgcHV0IHNwYWNlIGF0IGVuZC5cclxuXHR0ZXh0ID0gYmVmb3JlVGV4dCArIHRleHQgKyAnICcgKyBhZnRlclRleHQ7XHJcblx0Ly8gU2V0IHRoZSB0ZXh0LlxyXG5cdHdpbmRvdy5BcHAuX19jb250YWluZXJfXy5sb29rdXAoJ2NvbnRyb2xsZXI6Y2hhdCcpLmdldCgnY3VycmVudFJvb20nKS5zZXQoJ21lc3NhZ2VUb1NlbmQnLCB0ZXh0KTtcclxuXHRlbGVtZW50LmZvY3VzKCk7XHJcblx0Ly8gUHV0IGN1cnNvciBhdCBlbmQuXHJcblx0c2VsZWN0aW9uRW5kID0gZWxlbWVudC5zZWxlY3Rpb25TdGFydCArIHRleHQubGVuZ3RoO1xyXG5cdGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0aW9uRW5kLCBzZWxlY3Rpb25FbmQpO1xyXG5cclxuXHQvLyBDbG9zZSBwb3B1cCBpZiBpdCBoYXNuJ3QgYmVlbiBtb3ZlZCBieSB0aGUgdXNlci5cclxuXHRpZiAoIWVsZW1lbnRzLm1lbnUuaGFzQ2xhc3MoJ3Bpbm5lZCcpKSB7XHJcblx0XHRlbGVtZW50cy5tZW51QnV0dG9uLmNsaWNrKCk7XHJcblx0fVxyXG5cdC8vIFJlLXBvcHVsYXRlIGFzIGl0IGlzIHN0aWxsIG9wZW4uXHJcblx0ZWxzZSB7XHJcblx0XHRwb3B1bGF0ZUVtb3Rlc01lbnUoKTtcclxuXHR9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBlbW90ZSBlbGVtZW50IGFuZCBsaXN0ZW5zIGZvciBhIGNsaWNrIGV2ZW50IHRoYXQgd2lsbCBhZGQgdGhlIGVtb3RlIHRleHQgdG8gdGhlIGNoYXQuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSAgZW1vdGUgICAgICBUaGUgZW1vdGUgdGhhdCB5b3Ugd2FudCB0byBhZGQuIFRoaXMgb2JqZWN0IHNob3VsZCBiZSBvbmUgY29taW5nIGZyb20gYGVtb3Rlc2AuXHJcbiAqIEBwYXJhbSB7ZWxlbWVudH0gY29udGFpbmVyICBUaGUgSFRNTCBlbGVtZW50IHRoYXQgdGhlIGVtb3RlIHNob3VsZCBiZSBhcHBlbmRlZCB0by5cclxuICogQHBhcmFtIHtib29sZWFufSBzaG93SGVhZGVyIFdoZXRoZXIgYSBoZWFkZXIgc2hvdWxkYmUgY3JlYXRlZCBpZiBmb3VuZC4gT25seSBjcmVhdGVzIHRoZSBoZWFkZXIgb25jZS5cclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZUVtb3RlKGVtb3RlLCBjb250YWluZXIsIHNob3dIZWFkZXIpIHtcclxuXHQvLyBFbW90ZSBub3QgdXNhYmxlIG9yIG5vIGNvbnRhaW5lciwgY2FuJ3QgYWRkLlxyXG5cdGlmICghZW1vdGUgfHwgIWVtb3RlLmltYWdlIHx8ICFjb250YWluZXIubGVuZ3RoKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdGlmIChzaG93SGVhZGVyKSB7XHJcblx0XHRpZiAoZW1vdGUuY2hhbm5lbCAmJiBiYXNpY0Vtb3Rlcy5pbmRleE9mKGVtb3RlLnRleHQpIDwgMCkge1xyXG5cdFx0XHR2YXIgYmFkZ2UgPSBlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbZW1vdGUuY2hhbm5lbF0gfHwgZW1vdGUuYmFkZ2U7XHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5maW5kKCcuZ3JvdXAtaGVhZGVyW2RhdGEtZW1vdGUtY2hhbm5lbD1cIicgKyBlbW90ZS5jaGFubmVsICsgJ1wiXScpLmxlbmd0aCkge1xyXG5cdFx0XHRcdGNvbnRhaW5lci5hcHBlbmQoXHJcblx0XHRcdFx0XHQkKHRlbXBsYXRlcy5lbW90ZUdyb3VwSGVhZGVyKHtcclxuXHRcdFx0XHRcdFx0YmFkZ2U6IGJhZGdlLFxyXG5cdFx0XHRcdFx0XHRjaGFubmVsOiBlbW90ZS5jaGFubmVsLFxyXG5cdFx0XHRcdFx0XHRjaGFubmVsRGlzcGxheU5hbWU6IHN0b3JhZ2UuZGlzcGxheU5hbWVzLmdldChlbW90ZS5jaGFubmVsLCBlbW90ZS5jaGFubmVsKSxcclxuXHRcdFx0XHRcdFx0aXNWaXNpYmxlOiBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KCdjaGFubmVsLScgKyBlbW90ZS5jaGFubmVsLCB0cnVlKVxyXG5cdFx0XHRcdFx0fSkpXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGNoYW5uZWxDb250YWluZXIgPSBjb250YWluZXIuZmluZCgnLmdyb3VwLWhlYWRlcltkYXRhLWVtb3RlLWNoYW5uZWw9XCInICsgZW1vdGUuY2hhbm5lbCArICdcIl0nKTtcclxuXHRpZiAoY2hhbm5lbENvbnRhaW5lci5sZW5ndGgpIHtcclxuXHRcdGNvbnRhaW5lciA9IGNoYW5uZWxDb250YWluZXI7XHJcblx0fVxyXG5cdGNvbnRhaW5lci5hcHBlbmQoXHJcblx0XHQkKHRlbXBsYXRlcy5lbW90ZSh7XHJcblx0XHRcdGltYWdlOiBlbW90ZS5pbWFnZSxcclxuXHRcdFx0dGV4dDogZW1vdGUudGV4dCxcclxuXHRcdFx0dGhpcmRQYXJ0eTogZW1vdGUuaXNUaGlyZFBhcnR5LFxyXG5cdFx0XHRpc1Zpc2libGU6IGVtb3RlLmlzVmlzaWJsZSxcclxuXHRcdFx0aXNTdGFycmVkOiBlbW90ZS5pc1N0YXJyZWRcclxuXHRcdH0pKVxyXG5cdCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSB1c2FibGUgZW1vdGUgdGV4dCBmcm9tIGEgcmVnZXguXHJcbiAqIEBhdHRyaWJ1dGUgaHR0cDovL3VzZXJzY3JpcHRzLm9yZy9zY3JpcHRzL3Nob3cvMTYwMTgzIChhZGFwdGlvbilcclxuICovXHJcbmZ1bmN0aW9uIGdldEVtb3RlRnJvbVJlZ0V4KHJlZ2V4KSB7XHJcblx0aWYgKHR5cGVvZiByZWdleCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleCk7XHJcblx0fVxyXG5cdHJldHVybiBkZWNvZGVVUkkocmVnZXguc291cmNlKVxyXG5cdFx0LnJlcGxhY2UoJyZndFxcXFw7JywgJz4nKSAvLyByaWdodCBhbmdsZSBicmFja2V0XHJcblx0XHQucmVwbGFjZSgnJmx0XFxcXDsnLCAnPCcpIC8vIGxlZnQgYW5nbGUgYnJhY2tldFxyXG5cdFx0LnJlcGxhY2UoL1xcKFxcPyFbXildKlxcKS9nLCAnJykgLy8gcmVtb3ZlIG5lZ2F0aXZlIGdyb3VwXHJcblx0XHQucmVwbGFjZSgvXFwoKFtefF0pKlxcfD9bXildKlxcKS9nLCAnJDEnKSAvLyBwaWNrIGZpcnN0IG9wdGlvbiBmcm9tIGEgZ3JvdXBcclxuXHRcdC5yZXBsYWNlKC9cXFsoW158XSkqXFx8P1teXFxdXSpcXF0vZywgJyQxJykgLy8gcGljayBmaXJzdCBjaGFyYWN0ZXIgZnJvbSBhIGNoYXJhY3RlciBncm91cFxyXG5cdFx0LnJlcGxhY2UoL1teXFxcXF1cXD8vZywgJycpIC8vIHJlbW92ZSBvcHRpb25hbCBjaGFyc1xyXG5cdFx0LnJlcGxhY2UoL15cXFxcYnxcXFxcYiQvZywgJycpIC8vIHJlbW92ZSBib3VuZGFyaWVzXHJcblx0XHQucmVwbGFjZSgvXFxcXC9nLCAnJyk7IC8vIHVuZXNjYXBlXHJcbn1cclxuIiwiKGZ1bmN0aW9uIChkb2MsIGNzc1RleHQpIHtcbiAgICB2YXIgaWQgPSBcImVtb3RlLW1lbnUtZm9yLXR3aXRjaC1zdHlsZXNcIjtcbiAgICB2YXIgc3R5bGVFbCA9IGRvYy5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKCFzdHlsZUVsKSB7XG4gICAgICAgIHN0eWxlRWwgPSBkb2MuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgICBzdHlsZUVsLmlkID0gaWQ7XG4gICAgICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG4gICAgfVxuICAgIGlmIChzdHlsZUVsLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgaWYgKCFzdHlsZUVsLnN0eWxlU2hlZXQuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIHN0eWxlRWwuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzVGV4dDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdHlsZUVsLmlubmVySFRNTCA9IGNzc1RleHQ7XG4gICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge1xuICAgICAgICAgICAgc3R5bGVFbC5pbm5lclRleHQgPSBjc3NUZXh0O1xuICAgICAgICB9XG4gICAgfVxufShkb2N1bWVudCwgXCIvKipcXG5cIiArXG5cIiAqIE1pbmlmaWVkIHN0eWxlLlxcblwiICtcblwiICogT3JpZ2luYWwgZmlsZW5hbWU6IFxcXFxub2RlX21vZHVsZXNcXFxcanF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXJcXFxcanF1ZXJ5LmN1c3RvbS1zY3JvbGxiYXIuY3NzXFxuXCIgK1xuXCIgKi9cXG5cIiArXG5cIi5zY3JvbGxhYmxle3Bvc2l0aW9uOnJlbGF0aXZlfS5zY3JvbGxhYmxlOmZvY3Vze291dGxpbmU6MH0uc2Nyb2xsYWJsZSAudmlld3BvcnR7cG9zaXRpb246cmVsYXRpdmU7b3ZlcmZsb3c6aGlkZGVufS5zY3JvbGxhYmxlIC52aWV3cG9ydCAub3ZlcnZpZXd7cG9zaXRpb246YWJzb2x1dGV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXJ7ZGlzcGxheTpub25lfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyLnZlcnRpY2Fse3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7aGVpZ2h0OjEwMCV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIuaG9yaXpvbnRhbHtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxMDAlfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyIC50aHVtYntwb3NpdGlvbjphYnNvbHV0ZX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci52ZXJ0aWNhbCAudGh1bWJ7d2lkdGg6MTAwJTttaW4taGVpZ2h0OjEwcHh9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIuaG9yaXpvbnRhbCAudGh1bWJ7aGVpZ2h0OjEwMCU7bWluLXdpZHRoOjEwcHg7bGVmdDowfS5ub3Qtc2VsZWN0YWJsZXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LWtodG1sLXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmV9LnNjcm9sbGFibGUuZGVmYXVsdC1za2lue3BhZGRpbmctcmlnaHQ6MTBweDtwYWRkaW5nLWJvdHRvbTo2cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2Fse3dpZHRoOjZweH0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXIuaG9yaXpvbnRhbHtoZWlnaHQ6NnB4fS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojMDAwO29wYWNpdHk6LjQ7Ym9yZGVyLXJhZGl1czozcHg7LW1vei1ib3JkZXItcmFkaXVzOjRweDstd2Via2l0LWJvcmRlci1yYWRpdXM6NHB4fS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhcjpob3ZlciAudGh1bWJ7b3BhY2l0eTouNn0uc2Nyb2xsYWJsZS5ncmF5LXNraW57cGFkZGluZy1yaWdodDoxN3B4fS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhcntib3JkZXI6MXB4IHNvbGlkIGdyYXk7YmFja2dyb3VuZC1jb2xvcjojZDNkM2QzfS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjpncmF5fS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhcjpob3ZlciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojMDAwfS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhci52ZXJ0aWNhbHt3aWR0aDoxMHB4fS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFse2hlaWdodDoxMHB4O21hcmdpbi10b3A6MnB4fS5zY3JvbGxhYmxlLm1vZGVybi1za2lue3BhZGRpbmctcmlnaHQ6MTdweH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhcntib3JkZXI6MXB4IHNvbGlkIGdyYXk7Ym9yZGVyLXJhZGl1czo0cHg7LW1vei1ib3JkZXItcmFkaXVzOjRweDstd2Via2l0LWJvcmRlci1yYWRpdXM6NHB4O2JveC1zaGFkb3c6aW5zZXQgMCAwIDVweCAjODg4fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOiM5NWFhYmY7Ym9yZGVyLXJhZGl1czo0cHg7LW1vei1ib3JkZXItcmFkaXVzOjRweDstd2Via2l0LWJvcmRlci1yYWRpdXM6NHB4O2JvcmRlcjoxcHggc29saWQgIzUzNjk4NH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhci52ZXJ0aWNhbCAudGh1bWJ7d2lkdGg6OHB4O2JhY2tncm91bmQ6LXdlYmtpdC1ncmFkaWVudChsaW5lYXIsbGVmdCB0b3AscmlnaHQgdG9wLGNvbG9yLXN0b3AoMCUsIzk1YWFiZiksY29sb3Itc3RvcCgxMDAlLCM1NDcwOTIpKTtiYWNrZ3JvdW5kOi13ZWJraXQtbGluZWFyLWdyYWRpZW50KGxlZnQsIzk1YWFiZiAwLCM1NDcwOTIgMTAwJSk7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIzk1YWFiZiAwLCM1NDcwOTIgMTAwJSk7LW1zLWZpbHRlcjpcXFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LmdyYWRpZW50KCBzdGFydENvbG9yc3RyPScjOTVhYWJmJywgZW5kQ29sb3JzdHI9JyM1NDcwOTInLEdyYWRpZW50VHlwZT0xIClcXFwifS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyLmhvcml6b250YWwgLnRodW1ie2hlaWdodDo4cHg7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoIzk1YWFiZiwjNTQ3MDkyKTtiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtbGluZWFyLWdyYWRpZW50KCM5NWFhYmYsIzU0NzA5Mik7LW1zLWZpbHRlcjpcXFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LmdyYWRpZW50KCBzdGFydENvbG9yc3RyPScjOTVhYWJmJywgZW5kQ29sb3JzdHI9JyM1NDcwOTInLEdyYWRpZW50VHlwZT0wIClcXFwifS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2Fse3dpZHRoOjEwcHh9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIuaG9yaXpvbnRhbHtoZWlnaHQ6MTBweDttYXJnaW4tdG9wOjJweH1cXG5cIiArXG5cIi8qKlxcblwiICtcblwiICogTWluaWZpZWQgc3R5bGUuXFxuXCIgK1xuXCIgKiBPcmlnaW5hbCBmaWxlbmFtZTogXFxcXHNyY1xcXFxzdHlsZXNcXFxcc3R5bGUuY3NzXFxuXCIgK1xuXCIgKi9cXG5cIiArXG5cIkAtd2Via2l0LWtleWZyYW1lcyBzcGluezEwMCV7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpfX1Aa2V5ZnJhbWVzIHNwaW57MTAwJXstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKTt0cmFuc2Zvcm06cm90YXRlKDM2MGRlZyl9fSNlbW90ZS1tZW51LWJ1dHRvbntiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJJQUFBQVFDQVlBQUFBYkJpOWNBQUFBQVhOU1IwSUFyczRjNlFBQUFBUm5RVTFCQUFDeGp3djhZUVVBQUFBSmNFaFpjd0FBRHNNQUFBN0RBY2R2cUdRQUFBS1VTVVJCVkRoUGZaVE5pMUpSR01adk1Jc1dVWnRzNVNJWEZZSzBDTUUvSUdnaHhWQzdXVW9VMU5CaXhJK21SU0Q0TVF6bXh6aUtPM1hVQmhSbVVHWktkQkc0MFhFR1U2ZDBHRkdaY1Q0cXhXMWhpN2Z6dk53WnFLd0RENXo3dnMvdnVlZWVlKzZWTUp4TzV3VWhoZHZ0ZnVIeitUNHRMUzJOaGVnZkdzTURMeGl3SElJaExpNTdQSjc1VkNyMVkzOS9uNGJESVkxR280bENEeDU0d1lDVll6am9WalFhL2R4dXR5ZkNrd1N2WUpwZ09TUWY3MDh0dUJhMXlXUnkvTCtWL0NsNHdZQkZoaFR4ZkxodW0vZXNpaUoxdTEyS1JDSmtzVmhvZlgyZFRrNU96a0hNVVVNUEhuakIyRjU1VnBFaFBkZS9MYng4RnFCRUlrSHBkSm9NQmdOcHRWclM2WFJVcVZUT2c3YTN0MmxtWm9iMGVqMnAxV3IyZ2dHTERPbkozUVNaSDRjb0hvL1R5c29LaHlnVUN0Sm9ORlFzRm1rd0dMQXdSN2hTcVNTVlNzVmVNR0NSSVQyOUY2ZlhKaThYeStVeW1jMW1tcDZlSm9mRFFmVjZuVTVQVDFtWTIrMTI3dUh4U3FVU2g0RkZoaFFMdnJ2dGNybStZcGtIQndkVXJWWnBhMnVMYXJVYWRUb2RPanc4WkdHT0ducnd3QXNHTERMdzFpNHVMcnpSWWVPT2o0OXBiMitQZG5kM3FkVnE4U3RHQUlRNWFvMUdnejN3Z2dHTERENEM0aXpjRWNXZlIwZEhiTXJsY3JTeHNjR2JqVkFJSzhsbXM3UzV1Y21CL1g2Zlh6OVlEc0VRRnpkanNWaXQyV3p5cWMxa01yd2ZWcXVWakVZanpjM05rY2xrSXB2TlJtdHJhK3lCVnpBZkJYdERqdUdnUzhGZ2NGYmM4UXZ1aGpOU0tCUW9GQXFSNkxGRW4vTDVQUGZnZ1hkNWVYa1dyQnpEUWRDMVFDQmdGb2V1dDdPencvdHlCcDJGUXpoUHd0T0ZGd3pZMzRZbzRBOXdSWHpkRDhMaGNFNDh3bmNFOW5vOUZ1YW9pZDU3NGJrUEx4Z1ovM3VJNXBUUVZmRmxQL0w3L1dtaGI3SlNYcS8zSVhyd3lIWjVTTkl2R0NucXloK0o3K2dBQUFBQVNVVk9SSzVDWUlJPSkhaW1wb3J0YW50O2JhY2tncm91bmQtcG9zaXRpb246NTAlO2JhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tbGVmdDo3cHh9I2Vtb3RlLW1lbnUtYnV0dG9uLmFjdGl2ZXtib3JkZXItcmFkaXVzOjJweDtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTI4LDEyOCwxMjgsLjUpfS5lbW90ZS1tZW51e3BhZGRpbmc6NXB4O3otaW5kZXg6MTAwMDtkaXNwbGF5Om5vbmU7YmFja2dyb3VuZC1jb2xvcjojMjAyMDIwfS5lbW90ZS1tZW51IGF7Y29sb3I6I2ZmZn0uZW1vdGUtbWVudSBhOmhvdmVye2N1cnNvcjpwb2ludGVyO3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmU7Y29sb3I6I2NjY30uZW1vdGUtbWVudSAuZW1vdGVzLXN0YXJyZWR7aGVpZ2h0OjM4cHh9LmVtb3RlLW1lbnUgLmRyYWdnYWJsZXtiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtcmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgMTBweCk7YmFja2dyb3VuZC1pbWFnZTpyZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSAxMHB4KTtjdXJzb3I6bW92ZTtoZWlnaHQ6N3B4O21hcmdpbi1ib3R0b206M3B4fS5lbW90ZS1tZW51IC5kcmFnZ2FibGU6aG92ZXJ7YmFja2dyb3VuZC1pbWFnZTotd2Via2l0LXJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSAxMHB4KTtiYWNrZ3JvdW5kLWltYWdlOnJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSAxMHB4KX0uZW1vdGUtbWVudSAuaGVhZGVyLWluZm97Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQoYm90dG9tLHRyYW5zcGFyZW50LHJnYmEoMCwwLDAsLjUpKTtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCh0byB0b3AsdHJhbnNwYXJlbnQscmdiYSgwLDAsMCwuNSkpO3BhZGRpbmc6MnB4O2NvbG9yOiNkZGQ7dGV4dC1hbGlnbjpjZW50ZXI7cG9zaXRpb246cmVsYXRpdmV9LmVtb3RlLW1lbnUgLmhlYWRlci1pbmZvIGltZ3ttYXJnaW4tcmlnaHQ6OHB4fS5lbW90ZS1tZW51IC5lbW90ZXtkaXNwbGF5OmlubGluZS1ibG9jaztwYWRkaW5nOjJweDttYXJnaW46MXB4O2N1cnNvcjpwb2ludGVyO2JvcmRlci1yYWRpdXM6NXB4O3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjMwcHg7aGVpZ2h0OjMwcHg7LXdlYmtpdC10cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7dHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO2JvcmRlcjoxcHggc29saWQgdHJhbnNwYXJlbnR9LmVtb3RlLW1lbnUuZWRpdGluZyAuZW1vdGV7Y3Vyc29yOmF1dG99LmVtb3RlLW1lbnUgLmVtb3RlIGRpdnttYXgtd2lkdGg6MzBweDttYXgtaGVpZ2h0OjMwcHg7YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2JhY2tncm91bmQtc2l6ZTpjb250YWluO21hcmdpbjphdXRvO3Bvc2l0aW9uOmFic29sdXRlO3RvcDowO2JvdHRvbTowO2xlZnQ6MDtyaWdodDowfS5lbW90ZS1tZW51IC5zaW5nbGUtcm93e292ZXJmbG93OmhpZGRlbjtoZWlnaHQ6MzdweH0uZW1vdGUtbWVudSAuc2luZ2xlLXJvdyAuZW1vdGV7ZGlzcGxheTppbmxpbmUtYmxvY2s7bWFyZ2luLWJvdHRvbToxMDBweH0uZW1vdGUtbWVudSAuZW1vdGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LC4xKX0uZW1vdGUtbWVudSAucHVsbC1sZWZ0e2Zsb2F0OmxlZnR9LmVtb3RlLW1lbnUgLnB1bGwtcmlnaHR7ZmxvYXQ6cmlnaHR9LmVtb3RlLW1lbnUgLmZvb3Rlcnt0ZXh0LWFsaWduOmNlbnRlcjtib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwO2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LC4wNSkgaW5zZXQ7cGFkZGluZzo1cHggMCAycHg7bWFyZ2luLXRvcDo1cHg7aGVpZ2h0OjE4cHh9LmVtb3RlLW1lbnUgLmZvb3RlciAucHVsbC1sZWZ0e21hcmdpbi1yaWdodDo1cHh9LmVtb3RlLW1lbnUgLmZvb3RlciAucHVsbC1yaWdodHttYXJnaW4tbGVmdDo1cHh9LmVtb3RlLW1lbnUgLmljb257aGVpZ2h0OjE2cHg7d2lkdGg6MTZweDtvcGFjaXR5Oi41O2JhY2tncm91bmQtc2l6ZTpjb250YWluIWltcG9ydGFudH0uZW1vdGUtbWVudSAuaWNvbjpob3ZlcntvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLmljb24taG9tZXtiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU5qUWlEUW9nSUNCb1pXbG5hSFE5SWpZMElnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lEWTBJRFkwSWcwS0lDQWdhV1E5SWtOaGNHRmZNU0lOQ2lBZ0lIaHRiRHB6Y0dGalpUMGljSEpsYzJWeWRtVWlQanh0WlhSaFpHRjBZUTBLSUNBZ2FXUTlJbTFsZEdGa1lYUmhNekF3TVNJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jekk1T1RraUlDOCtEUW84Y0dGMGFBMEtJQ0FnWkQwaWJTQTFOeTR3TmpJc016RXVNems0SUdNZ01DNDVNeklzTFRFdU1ESTFJREF1T0RReUxDMHlMalU1TmlBdE1DNHlNREVzTFRNdU5UQTRJRXdnTXpNdU9EZzBMRGN1TnpnMUlFTWdNekl1T0RReExEWXVPRGN6SURNeExqRTJPU3cyTGpnNU1pQXpNQzR4TkRnc055NDRNamdnVENBM0xqQTVNeXd5T0M0NU5qSWdZeUF0TVM0d01qRXNNQzQ1TXpZZ0xURXVNRGN4TERJdU5UQTFJQzB3TGpFeE1Td3pMalV3TXlCc0lEQXVOVGM0TERBdU5qQXlJR01nTUM0NU5Ua3NNQzQ1T1RnZ01pNDFNRGtzTVM0eE1UY2dNeTQwTml3d0xqSTJOU0JzSURFdU56SXpMQzB4TGpVME15QjJJREl5TGpVNUlHTWdNQ3d4TGpNNE5pQXhMakV5TXl3eUxqVXdPQ0F5TGpVd09Dd3lMalV3T0NCb0lEZ3VPVGczSUdNZ01TNHpPRFVzTUNBeUxqVXdPQ3d0TVM0eE1qSWdNaTQxTURnc0xUSXVOVEE0SUZZZ016Z3VOVGMxSUdnZ01URXVORFl6SUhZZ01UVXVPREEwSUdNZ0xUQXVNRElzTVM0ek9EVWdNQzQ1TnpFc01pNDFNRGNnTWk0ek5UWXNNaTQxTURjZ2FDQTVMalV5TkNCaklERXVNemcxTERBZ01pNDFNRGdzTFRFdU1USXlJREl1TlRBNExDMHlMalV3T0NCV0lETXlMakV3TnlCaklEQXNNQ0F3TGpRM05pd3dMalF4TnlBeExqQTJNeXd3TGprek15QXdMalU0Tml3d0xqVXhOU0F4TGpneE55d3dMakV3TWlBeUxqYzBPU3d0TUM0NU1qUWdiQ0F3TGpZMU15d3RNQzQzTVRnZ2VpSU5DaUFnSUdsa1BTSndZWFJvTWprNU5TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTm1abVptWm1ZN1ptbHNiQzF2Y0dGamFYUjVPakVpSUM4K0RRbzhMM04yWno0PSkgbm8tcmVwZWF0IDUwJX0uZW1vdGUtbWVudSAuaWNvbi1nZWFye2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTWpFdU5Ua2lEUW9nSUNCb1pXbG5hSFE5SWpJeExqRXpOams1T1NJTkNpQWdJSFpwWlhkQ2IzZzlJakFnTUNBeU1TNDFPU0F5TVM0eE16Y2lEUW9nSUNCcFpEMGlRMkZ3WVY4eElnMEtJQ0FnZUcxc09uTndZV05sUFNKd2NtVnpaWEoyWlNJK1BHMWxkR0ZrWVhSaERRb2dJQ0JwWkQwaWJXVjBZV1JoZEdFek9TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pNM0lpQXZQZzBLUEhCaGRHZ05DaUFnSUdROUlrMGdNVGd1TmpJeUxEZ3VNVFExSURFNExqQTNOeXcyTGpnMUlHTWdNQ3d3SURFdU1qWTRMQzB5TGpnMk1TQXhMakUxTml3dE1pNDVOekVnVENBeE55NDFOVFFzTWk0eU5DQkRJREUzTGpRek9Dd3lMakV5TnlBeE5DNDFOellzTXk0ME16TWdNVFF1TlRjMkxETXVORE16SUV3Z01UTXVNalUyTERJdU9TQkRJREV6TGpJMU5pd3lMamtnTVRJdU1Ea3NNQ0F4TVM0NU15d3dJRWdnT1M0MU5qRWdReUE1TGpNNU5pd3dJRGd1TXpFM0xESXVPVEEySURndU16RTNMREl1T1RBMklFd2dOaTQ1T1Rrc015NDBOREVnWXlBd0xEQWdMVEl1T1RJeUxDMHhMakkwTWlBdE15NHdNelFzTFRFdU1UTXhJRXdnTWk0eU9Ea3NNeTQ1TlRFZ1F5QXlMakUzTXl3MExqQTJOQ0F6TGpVd055dzJMamcyTnlBekxqVXdOeXcyTGpnMk55Qk1JREl1T1RZeUxEZ3VNVFlnUXlBeUxqazJNaXc0TGpFMklEQXNPUzR6TURFZ01DdzVMalExTlNCMklESXVNekl5SUdNZ01Dd3dMakUyTWlBeUxqazJPU3d4TGpJeE9TQXlMamsyT1N3eExqSXhPU0JzSURBdU5UUTFMREV1TWpreElHTWdNQ3d3SUMweExqSTJPQ3d5TGpnMU9TQXRNUzR4TlRjc01pNDVOamtnYkNBeExqWTNPQ3d4TGpZME15QmpJREF1TVRFMExEQXVNVEV4SURJdU9UYzNMQzB4TGpFNU5TQXlMamszTnl3dE1TNHhPVFVnYkNBeExqTXlNU3d3TGpVek5TQmpJREFzTUNBeExqRTJOaXd5TGpnNU9DQXhMak15Tnl3eUxqZzVPQ0JvSURJdU16WTVJR01nTUM0eE5qUXNNQ0F4TGpJME5Dd3RNaTQ1TURZZ01TNHlORFFzTFRJdU9UQTJJR3dnTVM0ek1qSXNMVEF1TlRNMUlHTWdNQ3d3SURJdU9URTJMREV1TWpReUlETXVNREk1TERFdU1UTXpJR3dnTVM0Mk56Z3NMVEV1TmpReElHTWdNQzR4TVRjc0xUQXVNVEUxSUMweExqSXlMQzB5TGpreE5pQXRNUzR5TWl3dE1pNDVNVFlnYkNBd0xqVTBOQ3d0TVM0eU9UTWdZeUF3TERBZ01pNDVOak1zTFRFdU1UUXpJREl1T1RZekxDMHhMakk1T1NCV0lEa3VNellnUXlBeU1TNDFPU3c1TGpFNU9TQXhPQzQyTWpJc09DNHhORFVnTVRndU5qSXlMRGd1TVRRMUlIb2diU0F0TkM0ek5qWXNNaTQwTWpNZ1l5QXdMREV1T0RZM0lDMHhMalUxTXl3ekxqTTROeUF0TXk0ME5qRXNNeTR6T0RjZ0xURXVPVEEyTERBZ0xUTXVORFl4TEMweExqVXlJQzB6TGpRMk1Td3RNeTR6T0RjZ01Dd3RNUzQ0TmpjZ01TNDFOVFVzTFRNdU16ZzFJRE11TkRZeExDMHpMak00TlNBeExqa3dPU3d3TGpBd01TQXpMalEyTVN3eExqVXhPQ0F6TGpRMk1Td3pMak00TlNCNklnMEtJQ0FnYVdROUluQmhkR2d6SWcwS0lDQWdjM1I1YkdVOUltWnBiR3c2STBaR1JrWkdSaUlnTHo0TkNqeG5EUW9nSUNCcFpEMGlaelVpUGcwS1BDOW5QZzBLUEdjTkNpQWdJR2xrUFNKbk55SStEUW84TDJjK0RRbzhadzBLSUNBZ2FXUTlJbWM1SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RXhJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFeklqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekUxSWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RTNJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFNUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekl4SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6SXpJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJMUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekkzSWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6STVJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpNeElqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaek16SWo0TkNqd3ZaejROQ2p3dmMzWm5QZzBLKSBuby1yZXBlYXQgNTAlfS5lbW90ZS1tZW51LmVkaXRpbmcgLmljb24tZ2Vhcnstd2Via2l0LWFuaW1hdGlvbjpzcGluIDRzIGxpbmVhciBpbmZpbml0ZTthbmltYXRpb246c3BpbiA0cyBsaW5lYXIgaW5maW5pdGV9LmVtb3RlLW1lbnUgLmljb24tcmVzaXplLWhhbmRsZXtiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UWWlEUW9nSUNCb1pXbG5hSFE5SWpFMklnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lERTJJREUySWcwS0lDQWdhV1E5SWtOaGNHRmZNU0lOQ2lBZ0lIaHRiRHB6Y0dGalpUMGljSEpsYzJWeWRtVWlQanh0WlhSaFpHRjBZUTBLSUNBZ2FXUTlJbTFsZEdGa1lYUmhORE0xTnlJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jelF6TlRVaUlDOCtEUW84Y0dGMGFBMEtJQ0FnWkQwaVRTQXhNeTQxTERnZ1F5QXhNeTR5TWpVc09DQXhNeXc0TGpJeU5DQXhNeXc0TGpVZ2RpQXpMamM1TXlCTUlETXVOekEzTERNZ1NDQTNMalVnUXlBM0xqYzNOaXd6SURnc01pNDNOellnT0N3eUxqVWdPQ3d5TGpJeU5DQTNMamMzTml3eUlEY3VOU3d5SUdnZ0xUVWdUQ0F5TGpNd09Td3lMakF6T1NBeUxqRTFMREl1TVRRMElESXVNVFEyTERJdU1UUTJJREl1TVRRekxESXVNVFV5SURJdU1ETTVMREl1TXpBNUlESXNNaTQxSUhZZ05TQkRJRElzTnk0M056WWdNaTR5TWpRc09DQXlMalVzT0NBeUxqYzNOaXc0SURNc055NDNOellnTXl3M0xqVWdWaUF6TGpjd055Qk1JREV5TGpJNU15d3hNeUJJSURndU5TQkRJRGd1TWpJMExERXpJRGdzTVRNdU1qSTFJRGdzTVRNdU5TQTRMREV6TGpjM05TQTRMakl5TkN3eE5DQTRMalVzTVRRZ2FDQTFJR3dnTUM0eE9URXNMVEF1TURNNUlHTWdNQzR4TWpFc0xUQXVNRFV4SURBdU1qSXNMVEF1TVRRNElEQXVNamNzTFRBdU1qY2dUQ0F4TkN3eE15NDFNRElnVmlBNExqVWdReUF4TkN3NExqSXlOQ0F4TXk0M056VXNPQ0F4TXk0MUxEZ2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb05ETTFNU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1abVptWTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6ND0pIG5vLXJlcGVhdCA1MCU7Y3Vyc29yOm53c2UtcmVzaXplIWltcG9ydGFudH0uZW1vdGUtbWVudSAuaWNvbi1waW57YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVFlpRFFvZ0lDQm9aV2xuYUhROUlqRTJJZzBLSUNBZ2FXUTlJbk4yWnpNd01EVWlQZzBLSUNBOGJXVjBZV1JoZEdFTkNpQWdJQ0FnYVdROUltMWxkR0ZrWVhSaE16QXlNeUkrRFFvZ0lDQWdQSEprWmpwU1JFWStEUW9nSUNBZ0lDQThZMk02VjI5eWF3MEtJQ0FnSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGcwS0lDQWdJQ0FnSUNBOFpHTTZabTl5YldGMFBtbHRZV2RsTDNOMlp5dDRiV3c4TDJSak9tWnZjbTFoZEQ0TkNpQWdJQ0FnSUNBZ1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lDQWdjbVJtT25KbGMyOTFjbU5sUFNKb2RIUndPaTh2Y0hWeWJDNXZjbWN2WkdNdlpHTnRhWFI1Y0dVdlUzUnBiR3hKYldGblpTSWdMejROQ2lBZ0lDQWdJQ0FnUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK0RRb2dJQ0FnSUNBOEwyTmpPbGR2Y21zK0RRb2dJQ0FnUEM5eVpHWTZVa1JHUGcwS0lDQThMMjFsZEdGa1lYUmhQZzBLSUNBOFpHVm1jdzBLSUNBZ0lDQnBaRDBpWkdWbWN6TXdNakVpSUM4K0RRb2dJRHhuRFFvZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1Tnprek1EYzRNaXd3TERBc01DNDNPVE13TnpneUxDMHlMakUzTURrNE5Td3RPREUwTGpZNU1qazVLU0lOQ2lBZ0lDQWdhV1E5SW1jek1EQTNJajROQ2lBZ0lDQThadzBLSUNBZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1TnpBM01URXNNQzQzTURjeE1Td3RNQzQzTURjeE1Td3dMamN3TnpFeExEY3pOeTQzTURjMU5Td3lPVFV1TkRnNE1EZ3BJZzBLSUNBZ0lDQWdJR2xrUFNKbk16QXdPU0krRFFvZ0lDQWdJQ0E4WncwS0lDQWdJQ0FnSUNBZ2FXUTlJbWN6TnpVMUlqNE5DaUFnSUNBZ0lDQWdQSEJoZEdnTkNpQWdJQ0FnSUNBZ0lDQWdaRDBpVFNBNUxqYzRNVEkxTERBZ1F5QTVMalEzTkRBMU5qSXNNQzQyT0RreE1USWdPUzQxTWpBMk9Dd3hMalV5TXpBNE5UTWdPUzR6TVRJMUxESXVNVGczTlNCTUlEUXVPVE0zTlN3MkxqVTVNemMxSUVNZ015NDVOVGc1TmpBNExEWXVOREk1TkRneklESXVPVFEzTnpVME9DdzJMalV6TWpjNE9Ua2dNaXcyTGpneE1qVWdUQ0ExTGpBek1USTFMRGt1T0RRek56VWdNQzQxTmpJMUxERTBMak14TWpVZ01Dd3hOaUJESURBdU5UWTVNamsyTWpnc01UVXVOemsxTmpJMklERXVNVFkzTnpNM09Dd3hOUzQyTkRBeU16Y2dNUzQzTVRnM05Td3hOUzQwTURZeU5TQk1JRFl1TVRVMk1qVXNNVEF1T1RZNE56VWdPUzR4T0RjMUxERTBJR01nTUM0eU56azJPREl6TEMwd0xqazBOemM0TXlBd0xqTTRNekUxTWpnc0xURXVPVFU0T1RNM0lEQXVNakU0TnpVc0xUSXVPVE0zTlNBeExqVXdNREF4TVN3dE1TNDBPRGsxTnprNElETXVNREF3TURBeExDMHlMamszT1RFMU9TQTBMalVzTFRRdU5EWTROelVnTUM0Mk1ERXhNRElzTFRBdU1ETXhNell4SURFdU9ESXlNVE00TEMwd0xqQTVOakV6TnlBeUxDMHdMalEyT0RjMUlFTWdNVE11T0RjNU9Ea3lMRFF1TURZNU5EZ3dNeUF4TVM0NE5ESTROalVzTWk0d01qQXlNamd5SURrdU56Z3hNalVzTUNCNklnMEtJQ0FnSUNBZ0lDQWdJQ0IwY21GdWMyWnZjbTA5SW0xaGRISnBlQ2d3TGpnNU1UVTVNemMwTEMwd0xqZzVNVFU1TXpjMExEQXVPRGt4TlRrek56UXNNQzQ0T1RFMU9UTTNOQ3d0TWk0eU5qVTFMREV3TXpjdU1UTTBOU2tpRFFvZ0lDQWdJQ0FnSUNBZ0lHbGtQU0p3WVhSb016QXhNU0lOQ2lBZ0lDQWdJQ0FnSUNBZ2MzUjViR1U5SW1acGJHdzZJMlptWm1abVpqdG1hV3hzTFc5d1lXTnBkSGs2TVNJZ0x6NE5DaUFnSUNBZ0lEd3ZaejROQ2lBZ0lDQThMMmMrRFFvZ0lEd3ZaejROQ2p3dmMzWm5QZzBLKSBuby1yZXBlYXQgNTAlOy13ZWJraXQtdHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZX0uZW1vdGUtbWVudSAuaWNvbi1waW46aG92ZXIsLmVtb3RlLW1lbnUucGlubmVkIC5pY29uLXBpbnstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTstbXMtdHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3RyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTtvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLnNjcm9sbGFibGUuZGVmYXVsdC1za2lue3BhZGRpbmctcmlnaHQ6MDtwYWRkaW5nLWJvdHRvbTowfS5lbW90ZS1tZW51IC5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojNTU1O29wYWNpdHk6LjI7ei1pbmRleDoxfS5lbW90ZS1tZW51IC5lZGl0LXRvb2x7YmFja2dyb3VuZC1wb3NpdGlvbjo1MCU7YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2JhY2tncm91bmQtc2l6ZToxNHB4O2JvcmRlci1yYWRpdXM6NHB4O2JvcmRlcjoxcHggc29saWQgIzAwMDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5Om5vbmU7aGVpZ2h0OjE0cHg7b3BhY2l0eTouMjU7cG9zaXRpb246YWJzb2x1dGU7LXdlYmtpdC10cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7dHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3dpZHRoOjE0cHg7ei1pbmRleDoxfS5lbW90ZS1tZW51IC5lZGl0LXRvb2w6aG92ZXIsLmVtb3RlLW1lbnUgLmVtb3RlOmhvdmVyIC5lZGl0LXRvb2x7b3BhY2l0eToxfS5lbW90ZS1tZW51IC5lZGl0LXZpc2liaWxpdHl7YmFja2dyb3VuZC1jb2xvcjojMDBjODAwO2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTVRBd0lnMEtJQ0FnYUdWcFoyaDBQU0l4TURBaURRb2dJQ0IyYVdWM1FtOTRQU0l3SURBZ01UQXdJREV3TUNJTkNpQWdJR2xrUFNKTVlYbGxjbDh4SWcwS0lDQWdlRzFzT25Od1lXTmxQU0p3Y21WelpYSjJaU0krUEcxbGRHRmtZWFJoRFFvZ0lDQnBaRDBpYldWMFlXUmhkR0U1SWo0OGNtUm1PbEpFUmo0OFkyTTZWMjl5YXcwS0lDQWdJQ0FnSUhKa1pqcGhZbTkxZEQwaUlqNDhaR002Wm05eWJXRjBQbWx0WVdkbEwzTjJaeXQ0Yld3OEwyUmpPbVp2Y20xaGRENDhaR002ZEhsd1pRMEtJQ0FnSUNBZ0lDQWdjbVJtT25KbGMyOTFjbU5sUFNKb2RIUndPaTh2Y0hWeWJDNXZjbWN2WkdNdlpHTnRhWFI1Y0dVdlUzUnBiR3hKYldGblpTSWdMejQ4WkdNNmRHbDBiR1UrUEM5a1l6cDBhWFJzWlQ0OEwyTmpPbGR2Y21zK1BDOXlaR1k2VWtSR1Bqd3ZiV1YwWVdSaGRHRStQR1JsWm5NTkNpQWdJR2xrUFNKa1pXWnpOeUlnTHo0TkNqeHdZWFJvRFFvZ0lDQmtQU0pOSURrM0xqazJOQ3cwTmk0MU5EZ2dReUE1Tnk0d09UZ3NORFV1TlRJNElEYzJMalF5Tnl3eU1TNDJNRE1nTlRBc01qRXVOakF6SUdNZ0xUSTJMalF5Tnl3d0lDMDBOeTR3T1Rnc01qTXVPVEkxSUMwME55NDVOalVzTWpRdU9UUTJJQzB4TGpjd01Td3lJQzB4TGpjd01TdzBMamt3TWlBeE1HVXROQ3cyTGprd015QXdMamcyTml3eExqQXlJREl4TGpVek55d3lOQzQ1TkRVZ05EY3VPVFkwTERJMExqazBOU0F5Tmk0ME1qY3NNQ0EwTnk0d09UZ3NMVEl6TGpreU5pQTBOeTQ1TmpVc0xUSTBMamswTmlBeExqY3dNU3d0TWlBeExqY3dNU3d0TkM0NU1ESWdMVEF1TURBeExDMDJMamt3TXlCNklFMGdOVGd1TURjekxETTFMamszTlNCaklERXVOemMzTEMwd0xqazNJRFF1TWpVMUxEQXVNVFF6SURVdU5UTTBMREl1TkRnMUlERXVNamM1TERJdU16UXpJREF1T0RjMUxEVXVNREk1SUMwd0xqa3dNaXcxTGprNU9TQXRNUzQzTnpjc01DNDVOekVnTFRRdU1qVTFMQzB3TGpFME15QXROUzQxTXpVc0xUSXVORGcxSUMweExqSTNPU3d0TWk0ek5ETWdMVEF1T0RjMUxDMDFMakF5T1NBd0xqa3dNeXd0TlM0NU9Ua2dlaUJOSURVd0xEWTVMamN5T1NCRElETXhMalUwTERZNUxqY3lPU0F4Tmk0d01EVXNOVFV1TlRVeklERXdMall5T0N3MU1DQXhOQzR5TlRrc05EWXVNalE1SURJeUxqVXlOaXd6T0M0MU56RWdNek11TVRrMUxETXpMamszT1NBek1TNHhNVFFzTXpjdU1UUTFJREk1TGpnNU5DdzBNQzQ1TWpnZ01qa3VPRGswTERRMUlHTWdNQ3d4TVM0eE1EUWdPUzR3TURFc01qQXVNVEExSURJd0xqRXdOU3d5TUM0eE1EVWdNVEV1TVRBMExEQWdNakF1TVRBMkxDMDVMakF3TVNBeU1DNHhNRFlzTFRJd0xqRXdOU0F3TEMwMExqQTNNaUF0TVM0eU1Ua3NMVGN1T0RVMUlDMHpMak1zTFRFeExqQXlNU0JESURjM0xqUTNOQ3d6T0M0MU56SWdPRFV1TnpReExEUTJMakkxSURnNUxqTTNNaXcxTUNBNE15NDVPVFVzTlRVdU5UVTFJRFk0TGpRMkxEWTVMamN5T1NBMU1DdzJPUzQzTWprZ2VpSU5DaUFnSUdsa1BTSndZWFJvTXlJZ0x6NE5Dand2YzNablBnPT0pfS5lbW90ZS1tZW51IC5lZGl0LXN0YXJyZWR7YmFja2dyb3VuZC1jb2xvcjojMzIzMjMyO2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTlRBaURRb2dJQ0JvWldsbmFIUTlJalV3SWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURVd0lEVXdJZzBLSUNBZ2FXUTlJa3hoZVdWeVh6RWlEUW9nSUNCNGJXdzZjM0JoWTJVOUluQnlaWE5sY25abElqNDhiV1YwWVdSaGRHRU5DaUFnSUdsa1BTSnRaWFJoWkdGMFlUTXdNREVpUGp4eVpHWTZVa1JHUGp4all6cFhiM0pyRFFvZ0lDQWdJQ0FnY21SbU9tRmliM1YwUFNJaVBqeGtZenBtYjNKdFlYUSthVzFoWjJVdmMzWm5LM2h0YkR3dlpHTTZabTl5YldGMFBqeGtZenAwZVhCbERRb2dJQ0FnSUNBZ0lDQnlaR1k2Y21WemIzVnlZMlU5SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5a1kyMXBkSGx3WlM5VGRHbHNiRWx0WVdkbElpQXZQanhrWXpwMGFYUnNaVDQ4TDJSak9uUnBkR3hsUGp3dlkyTTZWMjl5YXo0OEwzSmtaanBTUkVZK1BDOXRaWFJoWkdGMFlUNDhaR1ZtY3cwS0lDQWdhV1E5SW1SbFpuTXlPVGs1SWlBdlBnMEtQSEJoZEdnTkNpQWdJR1E5SW0wZ05ETXVNRFFzTWpJdU5qazJJQzAzTGpVMk9DdzNMak0zTnlBeExqYzROeXd4TUM0ME1UY2dZeUF3TGpFeU55d3dMamMxSUMwd0xqRTRNaXd4TGpVd09TQXRNQzQzT1Rjc01TNDVOVGNnTFRBdU16UTRMREF1TWpVeklDMHdMamMyTWl3d0xqTTRNaUF0TVM0eE56WXNNQzR6T0RJZ0xUQXVNekU0TERBZ0xUQXVOak00TEMwd0xqQTNOaUF0TUM0NU16RXNMVEF1TWpNZ1RDQXlOU3d6Tnk0Mk9ERWdNVFV1TmpRMUxEUXlMalU1T1NCaklDMHdMalkzTkN3d0xqTTFOU0F0TVM0ME9Td3dMakk1TlNBdE1pNHhNRGNzTFRBdU1UVXhJRU1nTVRJdU9USXpMRFF5SURFeUxqWXhOQ3cwTVM0eU5ESWdNVEl1TnpRekxEUXdMalE1TVNCTUlERTBMalV6TERNd0xqQTNOQ0EyTGprMk1pd3lNaTQyT1RjZ1F5QTJMalF4TlN3eU1pNHhOallnTmk0eU1qRXNNakV1TXpjeElEWXVORFUwTERJd0xqWTBOeUEyTGpZNUxERTVMamt5TXlBM0xqTXhOU3d4T1M0ek9UWWdPQzR3Tmprc01Ua3VNamcySUd3Z01UQXVORFU1TEMweExqVXlNU0EwTGpZNExDMDVMalEzT0NCRElESXpMalUwTXl3M0xqWXdNeUF5TkM0eU16a3NOeTR4TnpFZ01qVXNOeTR4TnpFZ1l5QXdMamMyTXl3d0lERXVORFUyTERBdU5ETXlJREV1TnprekxERXVNVEUxSUd3Z05DNDJOemtzT1M0ME56Z2dNVEF1TkRZeExERXVOVEl4SUdNZ01DNDNOVElzTUM0eE1Ea2dNUzR6Tnprc01DNDJNemNnTVM0Mk1USXNNUzR6TmpFZ01DNHlNemNzTUM0M01qUWdNQzR3TXpnc01TNDFNVGtnTFRBdU5UQTFMREl1TURVZ2VpSU5DaUFnSUdsa1BTSndZWFJvTWprNU5TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTmpZMk5qWTJNN1ptbHNiQzF2Y0dGamFYUjVPakVpSUM4K0RRbzhMM04yWno0TkNnPT0pfS5lbW90ZS1tZW51IC5lbW90ZT4uZWRpdC12aXNpYmlsaXR5e2JvdHRvbTphdXRvO2xlZnQ6YXV0bztyaWdodDowO3RvcDowfS5lbW90ZS1tZW51IC5lbW90ZT4uZWRpdC1zdGFycmVke2JvdHRvbTphdXRvO2xlZnQ6MDtyaWdodDphdXRvO3RvcDowfS5lbW90ZS1tZW51IC5oZWFkZXItaW5mbz4uZWRpdC10b29se21hcmdpbi1sZWZ0OjVweH0uZW1vdGUtbWVudS5lZGl0aW5nIC5lZGl0LXRvb2x7ZGlzcGxheTppbmxpbmUtYmxvY2t9LmVtb3RlLW1lbnUgLmVtb3RlLW1lbnUtaGlkZGVuIC5lZGl0LXZpc2liaWxpdHl7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVEF3SWcwS0lDQWdhR1ZwWjJoMFBTSXhNREFpRFFvZ0lDQjJhV1YzUW05NFBTSXdJREFnTVRBd0lERXdNQ0lOQ2lBZ0lHbGtQU0pNWVhsbGNsOHpJZzBLSUNBZ2VHMXNPbk53WVdObFBTSndjbVZ6WlhKMlpTSStQRzFsZEdGa1lYUmhEUW9nSUNCcFpEMGliV1YwWVdSaGRHRXhOU0krUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6RXpJaUF2UGcwS1BHY05DaUFnSUdsa1BTSm5NeUkrRFFvSlBIQmhkR2dOQ2lBZ0lHUTlJazBnTnpBdU1EZ3lMRFExTGpRM05TQTFNQzQwTnpRc05qVXVNRGd5SUVNZ05qRXVNVGs0TERZMExqZ3pNU0EyT1M0NE16RXNOVFl1TVRrM0lEY3dMakE0TWl3ME5TNDBOelVnZWlJTkNpQWdJR2xrUFNKd1lYUm9OU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5HUmtaR1JrWWlJQzgrRFFvSlBIQmhkR2dOQ2lBZ0lHUTlJbTBnT1RjdU9UWTBMRFEyTGpVME9DQmpJQzB3TGpRMUxDMHdMalV5T1NBdE5pNHlORFVzTFRjdU1qTWdMVEUxTGpRd015d3RNVE11TlRVMElHd2dMVFl1TWl3MkxqSWdReUE0TWk0ek5URXNORE11TVRRNElEZzJMamt5TERRM0xqUTJPU0E0T1M0ek56SXNOVEFnT0RNdU9UazFMRFUxTGpVMU5TQTJPQzQwTml3Mk9TNDNNamtnTlRBc05qa3VOekk1SUdNZ0xURXVNek0wTERBZ0xUSXVOalV4TEMwd0xqQTRNaUF0TXk0NU5USXNMVEF1TWpJeUlHd2dMVGN1TkRNNUxEY3VORE01SUdNZ015NDJNemtzTUM0NU1Ea2dOeTQwTkRrc01TNDBOU0F4TVM0ek9URXNNUzQwTlNBeU5pNDBNamNzTUNBME55NHdPVGdzTFRJekxqa3lOaUEwTnk0NU5qVXNMVEkwTGprME5pQXhMamN3TVN3dE1TNDVPVGtnTVM0M01ERXNMVFF1T1RBeElDMHdMakF3TVN3dE5pNDVNRElnZWlJTkNpQWdJR2xrUFNKd1lYUm9OeUlOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5HUmtaR1JrWWlJQzgrRFFvSlBIQmhkR2dOQ2lBZ0lHUTlJbTBnT1RFdU5ERXhMREUyTGpZMklHTWdNQ3d0TUM0eU5qWWdMVEF1TVRBMUxDMHdMalV5SUMwd0xqSTVNeXd0TUM0M01EY2diQ0F0Tnk0d056RXNMVGN1TURjZ1l5QXRNQzR6T1RFc0xUQXVNemt4SUMweExqQXlNeXd0TUM0ek9URWdMVEV1TkRFMExEQWdUQ0EyTmk0NE1EUXNNalF1TnpFeElFTWdOakV1TmpBeUxESXlMamd4T0NBMU5TNDVORGtzTWpFdU5qQXpJRFV3TERJeExqWXdNeUJqSUMweU5pNDBNamNzTUNBdE5EY3VNRGs0TERJekxqa3lOaUF0TkRjdU9UWTFMREkwTGprME5pQXRNUzQzTURFc01pQXRNUzQzTURFc05DNDVNRElnTVRCbExUUXNOaTQ1TURNZ01DNDFNVGNzTUM0Mk1EY2dPQzR3T0RNc09TNHpOVFFnTVRrdU56QTNMREUyTGpNeUlFd2dPQzQ0T0RNc09ESXVOak15SUVNZ09DNDJPVFVzT0RJdU9ESWdPQzQxT1N3NE15NHdOek1nT0M0MU9TdzRNeTR6TXprZ1l5QXdMREF1TWpZMklEQXVNVEExTERBdU5USWdNQzR5T1RNc01DNDNNRGNnYkNBM0xqQTNNU3czTGpBM0lHTWdNQzR4T1RVc01DNHhPVFVnTUM0ME5URXNNQzR5T1RNZ01DNDNNRGNzTUM0eU9UTWdNQzR5TlRZc01DQXdMalV4TWl3dE1DNHdPVGdnTUM0M01EY3NMVEF1TWpreklHd2dOek11TnpVc0xUY3pMamMxSUdNZ01DNHhPRGNzTFRBdU1UZzJJREF1TWprekxDMHdMalEwSURBdU1qa3pMQzB3TGpjd05pQjZJRTBnTVRBdU5qSTRMRFV3SUVNZ01UUXVNalU1TERRMkxqSTBPU0F5TWk0MU1qWXNNemd1TlRjeElETXpMakU1TlN3ek15NDVOemtnTXpFdU1URTBMRE0zTGpFME5TQXlPUzQ0T1RRc05EQXVPVEk0SURJNUxqZzVOQ3cwTlNCaklEQXNOQzQyTmpVZ01TNDJNREVzT0M0NU5EVWdOQzR5Tnl3eE1pNHpOVEVnVENBeU9DNHdOQ3cyTXk0ME56VWdReUF4T1M0NE9EZ3NOVGd1T1RVMUlERXpMalkwT1N3MU15NHhNaUF4TUM0Mk1qZ3NOVEFnZWlJTkNpQWdJR2xrUFNKd1lYUm9PU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5HUmtaR1JrWWlJQzgrRFFvOEwyYytEUW84TDNOMlp6NE5DZz09KTtiYWNrZ3JvdW5kLWNvbG9yOnJlZH0uZW1vdGUtbWVudSAuZW1vdGUtbWVudS1zdGFycmVkIC5lZGl0LXN0YXJyZWR7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlOVEFpRFFvZ0lDQm9aV2xuYUhROUlqVXdJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJRFV3SURVd0lnMEtJQ0FnYVdROUlreGhlV1Z5WHpFaURRb2dJQ0I0Yld3NmMzQmhZMlU5SW5CeVpYTmxjblpsSWo0OGJXVjBZV1JoZEdFTkNpQWdJR2xrUFNKdFpYUmhaR0YwWVRNd01ERWlQanh5WkdZNlVrUkdQanhqWXpwWGIzSnJEUW9nSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGp4a1l6cG1iM0p0WVhRK2FXMWhaMlV2YzNabkszaHRiRHd2WkdNNlptOXliV0YwUGp4a1l6cDBlWEJsRFFvZ0lDQWdJQ0FnSUNCeVpHWTZjbVZ6YjNWeVkyVTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlrWTIxcGRIbHdaUzlUZEdsc2JFbHRZV2RsSWlBdlBqeGtZenAwYVhSc1pUNDhMMlJqT25ScGRHeGxQand2WTJNNlYyOXlhejQ4TDNKa1pqcFNSRVkrUEM5dFpYUmhaR0YwWVQ0OFpHVm1jdzBLSUNBZ2FXUTlJbVJsWm5NeU9UazVJaUF2UGcwS1BIQmhkR2dOQ2lBZ0lHUTlJbTBnTkRNdU1EUXNNakl1TmprMklDMDNMalUyT0N3M0xqTTNOeUF4TGpjNE55d3hNQzQwTVRjZ1l5QXdMakV5Tnl3d0xqYzFJQzB3TGpFNE1pd3hMalV3T1NBdE1DNDNPVGNzTVM0NU5UY2dMVEF1TXpRNExEQXVNalV6SUMwd0xqYzJNaXd3TGpNNE1pQXRNUzR4TnpZc01DNHpPRElnTFRBdU16RTRMREFnTFRBdU5qTTRMQzB3TGpBM05pQXRNQzQ1TXpFc0xUQXVNak1nVENBeU5Td3pOeTQyT0RFZ01UVXVOalExTERReUxqVTVPU0JqSUMwd0xqWTNOQ3d3TGpNMU5TQXRNUzQwT1N3d0xqSTVOU0F0TWk0eE1EY3NMVEF1TVRVeElFTWdNVEl1T1RJekxEUXlJREV5TGpZeE5DdzBNUzR5TkRJZ01USXVOelF6TERRd0xqUTVNU0JNSURFMExqVXpMRE13TGpBM05DQTJMamsyTWl3eU1pNDJPVGNnUXlBMkxqUXhOU3d5TWk0eE5qWWdOaTR5TWpFc01qRXVNemN4SURZdU5EVTBMREl3TGpZME55QTJMalk1TERFNUxqa3lNeUEzTGpNeE5Td3hPUzR6T1RZZ09DNHdOamtzTVRrdU1qZzJJR3dnTVRBdU5EVTVMQzB4TGpVeU1TQTBMalk0TEMwNUxqUTNPQ0JESURJekxqVTBNeXczTGpZd015QXlOQzR5TXprc055NHhOekVnTWpVc055NHhOekVnWXlBd0xqYzJNeXd3SURFdU5EVTJMREF1TkRNeUlERXVOemt6TERFdU1URTFJR3dnTkM0Mk56a3NPUzQwTnpnZ01UQXVORFl4TERFdU5USXhJR01nTUM0M05USXNNQzR4TURrZ01TNHpOemtzTUM0Mk16Y2dNUzQyTVRJc01TNHpOakVnTUM0eU16Y3NNQzQzTWpRZ01DNHdNemdzTVM0MU1Ua2dMVEF1TlRBMUxESXVNRFVnZWlJTkNpQWdJR2xrUFNKd1lYUm9Nams1TlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptTmpNREE3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejROQ2c9PSl9LmVtb3RlLW1lbnUgLmVtb3RlLmVtb3RlLW1lbnUtc3RhcnJlZHtib3JkZXItY29sb3I6cmdiYSgyMDAsMjAwLDAsLjUpfS5lbW90ZS1tZW51IC5lbW90ZS5lbW90ZS1tZW51LWhpZGRlbntib3JkZXItY29sb3I6cmdiYSgyNTUsMCwwLC41KX0uZW1vdGUtbWVudTpub3QoLmVkaXRpbmcpIC5lbW90ZS1tZW51LWhpZGRlbntkaXNwbGF5Om5vbmV9LmVtb3RlLW1lbnU6bm90KC5lZGl0aW5nKSAjc3RhcnJlZC1lbW90ZXMtZ3JvdXAgLmVtb3RlLW1lbnUtc3RhcnJlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnR9LmVtb3RlLW1lbnUgI3N0YXJyZWQtZW1vdGVzLWdyb3Vwe3RleHQtYWxpZ246Y2VudGVyO2NvbG9yOiM2NDY0NjR9LmVtb3RlLW1lbnUgI3N0YXJyZWQtZW1vdGVzLWdyb3VwOmVtcHR5OmJlZm9yZXtjb250ZW50OlxcXCJVc2UgdGhlIGVkaXQgbW9kZSB0byBzdGFyIGFuIGVtb3RlIVxcXCI7cG9zaXRpb246cmVsYXRpdmU7dG9wOjhweH1cIikpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIEhvZ2FuID0gcmVxdWlyZSgnaG9nYW4uanMvbGliL3RlbXBsYXRlLmpzJyk7XG4gICAgdmFyIHRlbXBsYXRlcyA9IHt9O1xuICAgIHRlbXBsYXRlc1snZW1vdGUnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZW1vdGVcIik7aWYodC5zKHQuZihcInRoaXJkUGFydHlcIixjLHAsMSksYyxwLDAsMzIsNDQsXCJ7eyB9fVwiKSl7dC5ycyhjLHAsZnVuY3Rpb24oYyxwLHQpe3QuYihcIiB0aGlyZC1wYXJ0eVwiKTt9KTtjLnBvcCgpO31pZighdC5zKHQuZihcImlzVmlzaWJsZVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe3QuYihcIiBlbW90ZS1tZW51LWhpZGRlblwiKTt9O2lmKHQucyh0LmYoXCJpc1N0YXJyZWRcIixjLHAsMSksYyxwLDAsMTE5LDEzOCxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIGVtb3RlLW1lbnUtc3RhcnJlZFwiKTt9KTtjLnBvcCgpO310LmIoXCJcXFwiIGRhdGEtZW1vdGU9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiIHRpdGxlPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7aWYodC5zKHQuZihcInRoaXJkUGFydHlcIixjLHAsMSksYyxwLDAsMjA2LDIyOSxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIChmcm9tIDNyZCBwYXJ0eSBhZGRvbilcIik7fSk7Yy5wb3AoKTt9dC5iKFwiXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgc3R5bGU9XFxcImJhY2tncm91bmQtaW1hZ2U6IHVybChcIik7dC5iKHQudCh0LmQoXCJpbWFnZS51cmxcIixjLHAsMCkpKTt0LmIoXCIpOyBoZWlnaHQ6IFwiKTt0LmIodC50KHQuZChcImltYWdlLmhlaWdodFwiLGMscCwwKSkpO3QuYihcInB4OyB3aWR0aDogXCIpO3QuYih0LnQodC5kKFwiaW1hZ2Uud2lkdGhcIixjLHAsMCkpKTt0LmIoXCJweFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJlZGl0LXRvb2wgZWRpdC1zdGFycmVkXFxcIiBkYXRhLXdoaWNoPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS1zdGFycmVkXFxcIiB0aXRsZT1cXFwiU3Rhci91bnN0YXIgZW1vdGU6IFwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZWRpdC10b29sIGVkaXQtdmlzaWJpbGl0eVxcXCIgZGF0YS13aGljaD1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtdmlzaWJpbGl0eVxcXCIgdGl0bGU9XFxcIkhpZGUvc2hvdyBlbW90ZTogXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVCdXR0b24nXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGJ1dHRvbiBjbGFzcz1cXFwiYnV0dG9uIGdseXBoLW9ubHkgZmxvYXQtbGVmdFxcXCIgdGl0bGU9XFxcIkVtb3RlIE1lbnVcXFwiIGlkPVxcXCJlbW90ZS1tZW51LWJ1dHRvblxcXCI+PC9idXR0b24+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVHcm91cEhlYWRlciddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJncm91cC1oZWFkZXJcIik7aWYoIXQucyh0LmYoXCJpc1Zpc2libGVcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXt0LmIoXCIgZW1vdGUtbWVudS1oaWRkZW5cIik7fTt0LmIoXCJcXFwiIGRhdGEtZW1vdGUtY2hhbm5lbD1cXFwiXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIlxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXItaW5mb1xcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxpbWcgc3JjPVxcXCJcIik7dC5iKHQudih0LmYoXCJiYWRnZVwiLGMscCwwKSkpO3QuYihcIlxcXCIgLz5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbERpc3BsYXlOYW1lXCIsYyxwLDApKSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcImVkaXQtdG9vbCBlZGl0LXZpc2liaWxpdHlcXFwiIGRhdGEtd2hpY2g9XFxcImNoYW5uZWwtXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIlxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtdmlzaWJpbGl0eVxcXCIgdGl0bGU9XFxcIkhpZGUvc2hvdyBhbGwgZW1vdGVzIGZvciBcIik7dC5iKHQudih0LmYoXCJjaGFubmVsXCIsYyxwLDApKSk7dC5iKFwiXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ21lbnUnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZW1vdGUtbWVudVxcXCIgaWQ9XFxcImVtb3RlLW1lbnUtZm9yLXR3aXRjaFxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJkcmFnZ2FibGVcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiaGVhZGVyLWluZm9cXFwiPkFsbCBFbW90ZXM8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImdyb3VwLWNvbnRhaW5lciBzY3JvbGxhYmxlXFxcIiBpZD1cXFwiYWxsLWVtb3Rlcy1ncm91cFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXItaW5mb1xcXCI+RmF2b3JpdGUgRW1vdGVzPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1jb250YWluZXIgc2luZ2xlLXJvd1xcXCIgaWQ9XFxcInN0YXJyZWQtZW1vdGVzLWdyb3VwXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImZvb3RlclxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLWxlZnQgaWNvbiBpY29uLWhvbWVcXFwiIGhyZWY9XFxcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXNcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIiB0aXRsZT1cXFwiVmlzaXQgdGhlIGhvbWVwYWdlIHdoZXJlIHlvdSBjYW4gZG9uYXRlLCBwb3N0IGEgcmV2aWV3LCBvciBjb250YWN0IHRoZSBkZXZlbG9wZXJcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGEgY2xhc3M9XFxcInB1bGwtbGVmdCBpY29uIGljb24tZ2VhclxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtZWRpdGluZ1xcXCIgdGl0bGU9XFxcIlRvZ2dsZSBlZGl0IG1vZGVcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGEgY2xhc3M9XFxcInB1bGwtcmlnaHQgaWNvbiBpY29uLXJlc2l6ZS1oYW5kbGVcXFwiIGRhdGEtY29tbWFuZD1cXFwicmVzaXplLWhhbmRsZVxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8YSBjbGFzcz1cXFwicHVsbC1yaWdodCBpY29uIGljb24tcGluXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS1waW5uZWRcXFwiIHRpdGxlPVxcXCJQaW4vdW5waW4gdGhlIGVtb3RlIG1lbnUgdG8gdGhlIHNjcmVlblxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snbmV3c01lc3NhZ2UnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPGRpdiBjbGFzcz1cXFwidHdpdGNoLWNoYXQtZW1vdGVzLW5ld3NcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0W1wiKTt0LmIodC52KHQuZihcInNjcmlwdE5hbWVcIixjLHAsMCkpKTt0LmIoXCJdIE5ld3M6IFwiKTt0LmIodC50KHQuZihcIm1lc3NhZ2VcIixjLHAsMCkpKTt0LmIoXCIgKDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtY29tbWFuZD1cXFwidHdpdGNoLWNoYXQtZW1vdGVzOmRpc21pc3MtbmV3c1xcXCIgZGF0YS1uZXdzLWlkPVxcXCJcIik7dC5iKHQudih0LmYoXCJpZFwiLGMscCwwKSkpO3QuYihcIlxcXCI+RGlzbWlzczwvYT4pXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHJldHVybiB0ZW1wbGF0ZXM7XG59KSgpOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8qISBodHRwOi8vbXRocy5iZS9wdW55Y29kZSB2MS4yLjQgYnkgQG1hdGhpYXMgKi9cbjsoZnVuY3Rpb24ocm9vdCkge1xuXG5cdC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZXMgKi9cblx0dmFyIGZyZWVFeHBvcnRzID0gdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgJiYgZXhwb3J0cztcblx0dmFyIGZyZWVNb2R1bGUgPSB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJlxuXHRcdG1vZHVsZS5leHBvcnRzID09IGZyZWVFeHBvcnRzICYmIG1vZHVsZTtcblx0dmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbDtcblx0aWYgKGZyZWVHbG9iYWwuZ2xvYmFsID09PSBmcmVlR2xvYmFsIHx8IGZyZWVHbG9iYWwud2luZG93ID09PSBmcmVlR2xvYmFsKSB7XG5cdFx0cm9vdCA9IGZyZWVHbG9iYWw7XG5cdH1cblxuXHQvKipcblx0ICogVGhlIGBwdW55Y29kZWAgb2JqZWN0LlxuXHQgKiBAbmFtZSBwdW55Y29kZVxuXHQgKiBAdHlwZSBPYmplY3Rcblx0ICovXG5cdHZhciBwdW55Y29kZSxcblxuXHQvKiogSGlnaGVzdCBwb3NpdGl2ZSBzaWduZWQgMzItYml0IGZsb2F0IHZhbHVlICovXG5cdG1heEludCA9IDIxNDc0ODM2NDcsIC8vIGFrYS4gMHg3RkZGRkZGRiBvciAyXjMxLTFcblxuXHQvKiogQm9vdHN0cmluZyBwYXJhbWV0ZXJzICovXG5cdGJhc2UgPSAzNixcblx0dE1pbiA9IDEsXG5cdHRNYXggPSAyNixcblx0c2tldyA9IDM4LFxuXHRkYW1wID0gNzAwLFxuXHRpbml0aWFsQmlhcyA9IDcyLFxuXHRpbml0aWFsTiA9IDEyOCwgLy8gMHg4MFxuXHRkZWxpbWl0ZXIgPSAnLScsIC8vICdcXHgyRCdcblxuXHQvKiogUmVndWxhciBleHByZXNzaW9ucyAqL1xuXHRyZWdleFB1bnljb2RlID0gL154bi0tLyxcblx0cmVnZXhOb25BU0NJSSA9IC9bXiAtfl0vLCAvLyB1bnByaW50YWJsZSBBU0NJSSBjaGFycyArIG5vbi1BU0NJSSBjaGFyc1xuXHRyZWdleFNlcGFyYXRvcnMgPSAvXFx4MkV8XFx1MzAwMnxcXHVGRjBFfFxcdUZGNjEvZywgLy8gUkZDIDM0OTAgc2VwYXJhdG9yc1xuXG5cdC8qKiBFcnJvciBtZXNzYWdlcyAqL1xuXHRlcnJvcnMgPSB7XG5cdFx0J292ZXJmbG93JzogJ092ZXJmbG93OiBpbnB1dCBuZWVkcyB3aWRlciBpbnRlZ2VycyB0byBwcm9jZXNzJyxcblx0XHQnbm90LWJhc2ljJzogJ0lsbGVnYWwgaW5wdXQgPj0gMHg4MCAobm90IGEgYmFzaWMgY29kZSBwb2ludCknLFxuXHRcdCdpbnZhbGlkLWlucHV0JzogJ0ludmFsaWQgaW5wdXQnXG5cdH0sXG5cblx0LyoqIENvbnZlbmllbmNlIHNob3J0Y3V0cyAqL1xuXHRiYXNlTWludXNUTWluID0gYmFzZSAtIHRNaW4sXG5cdGZsb29yID0gTWF0aC5mbG9vcixcblx0c3RyaW5nRnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZSxcblxuXHQvKiogVGVtcG9yYXJ5IHZhcmlhYmxlICovXG5cdGtleTtcblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGVycm9yIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBlcnJvciB0eXBlLlxuXHQgKiBAcmV0dXJucyB7RXJyb3J9IFRocm93cyBhIGBSYW5nZUVycm9yYCB3aXRoIHRoZSBhcHBsaWNhYmxlIGVycm9yIG1lc3NhZ2UuXG5cdCAqL1xuXHRmdW5jdGlvbiBlcnJvcih0eXBlKSB7XG5cdFx0dGhyb3cgUmFuZ2VFcnJvcihlcnJvcnNbdHlwZV0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIEEgZ2VuZXJpYyBgQXJyYXkjbWFwYCB1dGlsaXR5IGZ1bmN0aW9uLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBmb3IgZXZlcnkgYXJyYXlcblx0ICogaXRlbS5cblx0ICogQHJldHVybnMge0FycmF5fSBBIG5ldyBhcnJheSBvZiB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwKGFycmF5LCBmbikge1xuXHRcdHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cdFx0d2hpbGUgKGxlbmd0aC0tKSB7XG5cdFx0XHRhcnJheVtsZW5ndGhdID0gZm4oYXJyYXlbbGVuZ3RoXSk7XG5cdFx0fVxuXHRcdHJldHVybiBhcnJheTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBIHNpbXBsZSBgQXJyYXkjbWFwYC1saWtlIHdyYXBwZXIgdG8gd29yayB3aXRoIGRvbWFpbiBuYW1lIHN0cmluZ3MuXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIGRvbWFpbiBuYW1lLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBmb3IgZXZlcnlcblx0ICogY2hhcmFjdGVyLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IHN0cmluZyBvZiBjaGFyYWN0ZXJzIHJldHVybmVkIGJ5IHRoZSBjYWxsYmFja1xuXHQgKiBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIG1hcERvbWFpbihzdHJpbmcsIGZuKSB7XG5cdFx0cmV0dXJuIG1hcChzdHJpbmcuc3BsaXQocmVnZXhTZXBhcmF0b3JzKSwgZm4pLmpvaW4oJy4nKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIG51bWVyaWMgY29kZSBwb2ludHMgb2YgZWFjaCBVbmljb2RlXG5cdCAqIGNoYXJhY3RlciBpbiB0aGUgc3RyaW5nLiBXaGlsZSBKYXZhU2NyaXB0IHVzZXMgVUNTLTIgaW50ZXJuYWxseSxcblx0ICogdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnZlcnQgYSBwYWlyIG9mIHN1cnJvZ2F0ZSBoYWx2ZXMgKGVhY2ggb2Ygd2hpY2hcblx0ICogVUNTLTIgZXhwb3NlcyBhcyBzZXBhcmF0ZSBjaGFyYWN0ZXJzKSBpbnRvIGEgc2luZ2xlIGNvZGUgcG9pbnQsXG5cdCAqIG1hdGNoaW5nIFVURi0xNi5cblx0ICogQHNlZSBgcHVueWNvZGUudWNzMi5lbmNvZGVgXG5cdCAqIEBzZWUgPGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG5cdCAqIEBuYW1lIGRlY29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nIFRoZSBVbmljb2RlIGlucHV0IHN0cmluZyAoVUNTLTIpLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBuZXcgYXJyYXkgb2YgY29kZSBwb2ludHMuXG5cdCAqL1xuXHRmdW5jdGlvbiB1Y3MyZGVjb2RlKHN0cmluZykge1xuXHRcdHZhciBvdXRwdXQgPSBbXSxcblx0XHQgICAgY291bnRlciA9IDAsXG5cdFx0ICAgIGxlbmd0aCA9IHN0cmluZy5sZW5ndGgsXG5cdFx0ICAgIHZhbHVlLFxuXHRcdCAgICBleHRyYTtcblx0XHR3aGlsZSAoY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0dmFsdWUgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0aWYgKHZhbHVlID49IDB4RDgwMCAmJiB2YWx1ZSA8PSAweERCRkYgJiYgY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0XHQvLyBoaWdoIHN1cnJvZ2F0ZSwgYW5kIHRoZXJlIGlzIGEgbmV4dCBjaGFyYWN0ZXJcblx0XHRcdFx0ZXh0cmEgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0XHRpZiAoKGV4dHJhICYgMHhGQzAwKSA9PSAweERDMDApIHsgLy8gbG93IHN1cnJvZ2F0ZVxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKCgodmFsdWUgJiAweDNGRikgPDwgMTApICsgKGV4dHJhICYgMHgzRkYpICsgMHgxMDAwMCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gdW5tYXRjaGVkIHN1cnJvZ2F0ZTsgb25seSBhcHBlbmQgdGhpcyBjb2RlIHVuaXQsIGluIGNhc2UgdGhlIG5leHRcblx0XHRcdFx0XHQvLyBjb2RlIHVuaXQgaXMgdGhlIGhpZ2ggc3Vycm9nYXRlIG9mIGEgc3Vycm9nYXRlIHBhaXJcblx0XHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdFx0Y291bnRlci0tO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIHN0cmluZyBiYXNlZCBvbiBhbiBhcnJheSBvZiBudW1lcmljIGNvZGUgcG9pbnRzLlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmRlY29kZWBcblx0ICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcblx0ICogQG5hbWUgZW5jb2RlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGNvZGVQb2ludHMgVGhlIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBuZXcgVW5pY29kZSBzdHJpbmcgKFVDUy0yKS5cblx0ICovXG5cdGZ1bmN0aW9uIHVjczJlbmNvZGUoYXJyYXkpIHtcblx0XHRyZXR1cm4gbWFwKGFycmF5LCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0dmFyIG91dHB1dCA9ICcnO1xuXHRcdFx0aWYgKHZhbHVlID4gMHhGRkZGKSB7XG5cdFx0XHRcdHZhbHVlIC09IDB4MTAwMDA7XG5cdFx0XHRcdG91dHB1dCArPSBzdHJpbmdGcm9tQ2hhckNvZGUodmFsdWUgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApO1xuXHRcdFx0XHR2YWx1ZSA9IDB4REMwMCB8IHZhbHVlICYgMHgzRkY7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQgKz0gc3RyaW5nRnJvbUNoYXJDb2RlKHZhbHVlKTtcblx0XHRcdHJldHVybiBvdXRwdXQ7XG5cdFx0fSkuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBiYXNpYyBjb2RlIHBvaW50IGludG8gYSBkaWdpdC9pbnRlZ2VyLlxuXHQgKiBAc2VlIGBkaWdpdFRvQmFzaWMoKWBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGNvZGVQb2ludCBUaGUgYmFzaWMgbnVtZXJpYyBjb2RlIHBvaW50IHZhbHVlLlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQgKGZvciB1c2UgaW5cblx0ICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpbiB0aGUgcmFuZ2UgYDBgIHRvIGBiYXNlIC0gMWAsIG9yIGBiYXNlYCBpZlxuXHQgKiB0aGUgY29kZSBwb2ludCBkb2VzIG5vdCByZXByZXNlbnQgYSB2YWx1ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGJhc2ljVG9EaWdpdChjb2RlUG9pbnQpIHtcblx0XHRpZiAoY29kZVBvaW50IC0gNDggPCAxMCkge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDIyO1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gNjUgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDY1O1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gOTcgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDk3O1xuXHRcdH1cblx0XHRyZXR1cm4gYmFzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGRpZ2l0L2ludGVnZXIgaW50byBhIGJhc2ljIGNvZGUgcG9pbnQuXG5cdCAqIEBzZWUgYGJhc2ljVG9EaWdpdCgpYFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlcn0gZGlnaXQgVGhlIG51bWVyaWMgdmFsdWUgb2YgYSBiYXNpYyBjb2RlIHBvaW50LlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYmFzaWMgY29kZSBwb2ludCB3aG9zZSB2YWx1ZSAod2hlbiB1c2VkIGZvclxuXHQgKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGlzIGBkaWdpdGAsIHdoaWNoIG5lZWRzIHRvIGJlIGluIHRoZSByYW5nZVxuXHQgKiBgMGAgdG8gYGJhc2UgLSAxYC4gSWYgYGZsYWdgIGlzIG5vbi16ZXJvLCB0aGUgdXBwZXJjYXNlIGZvcm0gaXNcblx0ICogdXNlZDsgZWxzZSwgdGhlIGxvd2VyY2FzZSBmb3JtIGlzIHVzZWQuIFRoZSBiZWhhdmlvciBpcyB1bmRlZmluZWRcblx0ICogaWYgYGZsYWdgIGlzIG5vbi16ZXJvIGFuZCBgZGlnaXRgIGhhcyBubyB1cHBlcmNhc2UgZm9ybS5cblx0ICovXG5cdGZ1bmN0aW9uIGRpZ2l0VG9CYXNpYyhkaWdpdCwgZmxhZykge1xuXHRcdC8vICAwLi4yNSBtYXAgdG8gQVNDSUkgYS4ueiBvciBBLi5aXG5cdFx0Ly8gMjYuLjM1IG1hcCB0byBBU0NJSSAwLi45XG5cdFx0cmV0dXJuIGRpZ2l0ICsgMjIgKyA3NSAqIChkaWdpdCA8IDI2KSAtICgoZmxhZyAhPSAwKSA8PCA1KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBCaWFzIGFkYXB0YXRpb24gZnVuY3Rpb24gYXMgcGVyIHNlY3Rpb24gMy40IG9mIFJGQyAzNDkyLlxuXHQgKiBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNDkyI3NlY3Rpb24tMy40XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhZGFwdChkZWx0YSwgbnVtUG9pbnRzLCBmaXJzdFRpbWUpIHtcblx0XHR2YXIgayA9IDA7XG5cdFx0ZGVsdGEgPSBmaXJzdFRpbWUgPyBmbG9vcihkZWx0YSAvIGRhbXApIDogZGVsdGEgPj4gMTtcblx0XHRkZWx0YSArPSBmbG9vcihkZWx0YSAvIG51bVBvaW50cyk7XG5cdFx0Zm9yICgvKiBubyBpbml0aWFsaXphdGlvbiAqLzsgZGVsdGEgPiBiYXNlTWludXNUTWluICogdE1heCA+PiAxOyBrICs9IGJhc2UpIHtcblx0XHRcdGRlbHRhID0gZmxvb3IoZGVsdGEgLyBiYXNlTWludXNUTWluKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZsb29yKGsgKyAoYmFzZU1pbnVzVE1pbiArIDEpICogZGVsdGEgLyAoZGVsdGEgKyBza2V3KSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzIHRvIGEgc3RyaW5nIG9mIFVuaWNvZGVcblx0ICogc3ltYm9scy5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIHJlc3VsdGluZyBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGVjb2RlKGlucHV0KSB7XG5cdFx0Ly8gRG9uJ3QgdXNlIFVDUy0yXG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aCxcblx0XHQgICAgb3V0LFxuXHRcdCAgICBpID0gMCxcblx0XHQgICAgbiA9IGluaXRpYWxOLFxuXHRcdCAgICBiaWFzID0gaW5pdGlhbEJpYXMsXG5cdFx0ICAgIGJhc2ljLFxuXHRcdCAgICBqLFxuXHRcdCAgICBpbmRleCxcblx0XHQgICAgb2xkaSxcblx0XHQgICAgdyxcblx0XHQgICAgayxcblx0XHQgICAgZGlnaXQsXG5cdFx0ICAgIHQsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBiYXNlTWludXNUO1xuXG5cdFx0Ly8gSGFuZGxlIHRoZSBiYXNpYyBjb2RlIHBvaW50czogbGV0IGBiYXNpY2AgYmUgdGhlIG51bWJlciBvZiBpbnB1dCBjb2RlXG5cdFx0Ly8gcG9pbnRzIGJlZm9yZSB0aGUgbGFzdCBkZWxpbWl0ZXIsIG9yIGAwYCBpZiB0aGVyZSBpcyBub25lLCB0aGVuIGNvcHlcblx0XHQvLyB0aGUgZmlyc3QgYmFzaWMgY29kZSBwb2ludHMgdG8gdGhlIG91dHB1dC5cblxuXHRcdGJhc2ljID0gaW5wdXQubGFzdEluZGV4T2YoZGVsaW1pdGVyKTtcblx0XHRpZiAoYmFzaWMgPCAwKSB7XG5cdFx0XHRiYXNpYyA9IDA7XG5cdFx0fVxuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGJhc2ljOyArK2opIHtcblx0XHRcdC8vIGlmIGl0J3Mgbm90IGEgYmFzaWMgY29kZSBwb2ludFxuXHRcdFx0aWYgKGlucHV0LmNoYXJDb2RlQXQoaikgPj0gMHg4MCkge1xuXHRcdFx0XHRlcnJvcignbm90LWJhc2ljJyk7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQucHVzaChpbnB1dC5jaGFyQ29kZUF0KGopKTtcblx0XHR9XG5cblx0XHQvLyBNYWluIGRlY29kaW5nIGxvb3A6IHN0YXJ0IGp1c3QgYWZ0ZXIgdGhlIGxhc3QgZGVsaW1pdGVyIGlmIGFueSBiYXNpYyBjb2RlXG5cdFx0Ly8gcG9pbnRzIHdlcmUgY29waWVkOyBzdGFydCBhdCB0aGUgYmVnaW5uaW5nIG90aGVyd2lzZS5cblxuXHRcdGZvciAoaW5kZXggPSBiYXNpYyA+IDAgPyBiYXNpYyArIDEgOiAwOyBpbmRleCA8IGlucHV0TGVuZ3RoOyAvKiBubyBmaW5hbCBleHByZXNzaW9uICovKSB7XG5cblx0XHRcdC8vIGBpbmRleGAgaXMgdGhlIGluZGV4IG9mIHRoZSBuZXh0IGNoYXJhY3RlciB0byBiZSBjb25zdW1lZC5cblx0XHRcdC8vIERlY29kZSBhIGdlbmVyYWxpemVkIHZhcmlhYmxlLWxlbmd0aCBpbnRlZ2VyIGludG8gYGRlbHRhYCxcblx0XHRcdC8vIHdoaWNoIGdldHMgYWRkZWQgdG8gYGlgLiBUaGUgb3ZlcmZsb3cgY2hlY2tpbmcgaXMgZWFzaWVyXG5cdFx0XHQvLyBpZiB3ZSBpbmNyZWFzZSBgaWAgYXMgd2UgZ28sIHRoZW4gc3VidHJhY3Qgb2ZmIGl0cyBzdGFydGluZ1xuXHRcdFx0Ly8gdmFsdWUgYXQgdGhlIGVuZCB0byBvYnRhaW4gYGRlbHRhYC5cblx0XHRcdGZvciAob2xkaSA9IGksIHcgPSAxLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblxuXHRcdFx0XHRpZiAoaW5kZXggPj0gaW5wdXRMZW5ndGgpIHtcblx0XHRcdFx0XHRlcnJvcignaW52YWxpZC1pbnB1dCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGlnaXQgPSBiYXNpY1RvRGlnaXQoaW5wdXQuY2hhckNvZGVBdChpbmRleCsrKSk7XG5cblx0XHRcdFx0aWYgKGRpZ2l0ID49IGJhc2UgfHwgZGlnaXQgPiBmbG9vcigobWF4SW50IC0gaSkgLyB3KSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aSArPSBkaWdpdCAqIHc7XG5cdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA8IHQpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0aWYgKHcgPiBmbG9vcihtYXhJbnQgLyBiYXNlTWludXNUKSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dyAqPSBiYXNlTWludXNUO1xuXG5cdFx0XHR9XG5cblx0XHRcdG91dCA9IG91dHB1dC5sZW5ndGggKyAxO1xuXHRcdFx0YmlhcyA9IGFkYXB0KGkgLSBvbGRpLCBvdXQsIG9sZGkgPT0gMCk7XG5cblx0XHRcdC8vIGBpYCB3YXMgc3VwcG9zZWQgdG8gd3JhcCBhcm91bmQgZnJvbSBgb3V0YCB0byBgMGAsXG5cdFx0XHQvLyBpbmNyZW1lbnRpbmcgYG5gIGVhY2ggdGltZSwgc28gd2UnbGwgZml4IHRoYXQgbm93OlxuXHRcdFx0aWYgKGZsb29yKGkgLyBvdXQpID4gbWF4SW50IC0gbikge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0biArPSBmbG9vcihpIC8gb3V0KTtcblx0XHRcdGkgJT0gb3V0O1xuXG5cdFx0XHQvLyBJbnNlcnQgYG5gIGF0IHBvc2l0aW9uIGBpYCBvZiB0aGUgb3V0cHV0XG5cdFx0XHRvdXRwdXQuc3BsaWNlKGkrKywgMCwgbik7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdWNzMmVuY29kZShvdXRwdXQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scyB0byBhIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5XG5cdCAqIHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGVuY29kZShpbnB1dCkge1xuXHRcdHZhciBuLFxuXHRcdCAgICBkZWx0YSxcblx0XHQgICAgaGFuZGxlZENQQ291bnQsXG5cdFx0ICAgIGJhc2ljTGVuZ3RoLFxuXHRcdCAgICBiaWFzLFxuXHRcdCAgICBqLFxuXHRcdCAgICBtLFxuXHRcdCAgICBxLFxuXHRcdCAgICBrLFxuXHRcdCAgICB0LFxuXHRcdCAgICBjdXJyZW50VmFsdWUsXG5cdFx0ICAgIG91dHB1dCA9IFtdLFxuXHRcdCAgICAvKiogYGlucHV0TGVuZ3RoYCB3aWxsIGhvbGQgdGhlIG51bWJlciBvZiBjb2RlIHBvaW50cyBpbiBgaW5wdXRgLiAqL1xuXHRcdCAgICBpbnB1dExlbmd0aCxcblx0XHQgICAgLyoqIENhY2hlZCBjYWxjdWxhdGlvbiByZXN1bHRzICovXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50UGx1c09uZSxcblx0XHQgICAgYmFzZU1pbnVzVCxcblx0XHQgICAgcU1pbnVzVDtcblxuXHRcdC8vIENvbnZlcnQgdGhlIGlucHV0IGluIFVDUy0yIHRvIFVuaWNvZGVcblx0XHRpbnB1dCA9IHVjczJkZWNvZGUoaW5wdXQpO1xuXG5cdFx0Ly8gQ2FjaGUgdGhlIGxlbmd0aFxuXHRcdGlucHV0TGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB0aGUgc3RhdGVcblx0XHRuID0gaW5pdGlhbE47XG5cdFx0ZGVsdGEgPSAwO1xuXHRcdGJpYXMgPSBpbml0aWFsQmlhcztcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHNcblx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgMHg4MCkge1xuXHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoY3VycmVudFZhbHVlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aGFuZGxlZENQQ291bnQgPSBiYXNpY0xlbmd0aCA9IG91dHB1dC5sZW5ndGg7XG5cblx0XHQvLyBgaGFuZGxlZENQQ291bnRgIGlzIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgdGhhdCBoYXZlIGJlZW4gaGFuZGxlZDtcblx0XHQvLyBgYmFzaWNMZW5ndGhgIGlzIHRoZSBudW1iZXIgb2YgYmFzaWMgY29kZSBwb2ludHMuXG5cblx0XHQvLyBGaW5pc2ggdGhlIGJhc2ljIHN0cmluZyAtIGlmIGl0IGlzIG5vdCBlbXB0eSAtIHdpdGggYSBkZWxpbWl0ZXJcblx0XHRpZiAoYmFzaWNMZW5ndGgpIHtcblx0XHRcdG91dHB1dC5wdXNoKGRlbGltaXRlcik7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBlbmNvZGluZyBsb29wOlxuXHRcdHdoaWxlIChoYW5kbGVkQ1BDb3VudCA8IGlucHV0TGVuZ3RoKSB7XG5cblx0XHRcdC8vIEFsbCBub24tYmFzaWMgY29kZSBwb2ludHMgPCBuIGhhdmUgYmVlbiBoYW5kbGVkIGFscmVhZHkuIEZpbmQgdGhlIG5leHRcblx0XHRcdC8vIGxhcmdlciBvbmU6XG5cdFx0XHRmb3IgKG0gPSBtYXhJbnQsIGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA+PSBuICYmIGN1cnJlbnRWYWx1ZSA8IG0pIHtcblx0XHRcdFx0XHRtID0gY3VycmVudFZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIEluY3JlYXNlIGBkZWx0YWAgZW5vdWdoIHRvIGFkdmFuY2UgdGhlIGRlY29kZXIncyA8bixpPiBzdGF0ZSB0byA8bSwwPixcblx0XHRcdC8vIGJ1dCBndWFyZCBhZ2FpbnN0IG92ZXJmbG93XG5cdFx0XHRoYW5kbGVkQ1BDb3VudFBsdXNPbmUgPSBoYW5kbGVkQ1BDb3VudCArIDE7XG5cdFx0XHRpZiAobSAtIG4gPiBmbG9vcigobWF4SW50IC0gZGVsdGEpIC8gaGFuZGxlZENQQ291bnRQbHVzT25lKSkge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0ZGVsdGEgKz0gKG0gLSBuKSAqIGhhbmRsZWRDUENvdW50UGx1c09uZTtcblx0XHRcdG4gPSBtO1xuXG5cdFx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgbiAmJiArK2RlbHRhID4gbWF4SW50KSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlID09IG4pIHtcblx0XHRcdFx0XHQvLyBSZXByZXNlbnQgZGVsdGEgYXMgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlclxuXHRcdFx0XHRcdGZvciAocSA9IGRlbHRhLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblx0XHRcdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXHRcdFx0XHRcdFx0aWYgKHEgPCB0KSB7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cU1pbnVzVCA9IHEgLSB0O1xuXHRcdFx0XHRcdFx0YmFzZU1pbnVzVCA9IGJhc2UgLSB0O1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goXG5cdFx0XHRcdFx0XHRcdHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWModCArIHFNaW51c1QgJSBiYXNlTWludXNULCAwKSlcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRxID0gZmxvb3IocU1pbnVzVCAvIGJhc2VNaW51c1QpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWMocSwgMCkpKTtcblx0XHRcdFx0XHRiaWFzID0gYWRhcHQoZGVsdGEsIGhhbmRsZWRDUENvdW50UGx1c09uZSwgaGFuZGxlZENQQ291bnQgPT0gYmFzaWNMZW5ndGgpO1xuXHRcdFx0XHRcdGRlbHRhID0gMDtcblx0XHRcdFx0XHQrK2hhbmRsZWRDUENvdW50O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdCsrZGVsdGE7XG5cdFx0XHQrK247XG5cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dC5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSB0byBVbmljb2RlLiBPbmx5IHRoZVxuXHQgKiBQdW55Y29kZWQgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLCBpLmUuIGl0IGRvZXNuJ3Rcblx0ICogbWF0dGVyIGlmIHlvdSBjYWxsIGl0IG9uIGEgc3RyaW5nIHRoYXQgaGFzIGFscmVhZHkgYmVlbiBjb252ZXJ0ZWQgdG9cblx0ICogVW5pY29kZS5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIFB1bnljb2RlIGRvbWFpbiBuYW1lIHRvIGNvbnZlcnQgdG8gVW5pY29kZS5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIFVuaWNvZGUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIFB1bnljb2RlXG5cdCAqIHN0cmluZy5cblx0ICovXG5cdGZ1bmN0aW9uIHRvVW5pY29kZShkb21haW4pIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGRvbWFpbiwgZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRyZXR1cm4gcmVnZXhQdW55Y29kZS50ZXN0KHN0cmluZylcblx0XHRcdFx0PyBkZWNvZGUoc3RyaW5nLnNsaWNlKDQpLnRvTG93ZXJDYXNlKCkpXG5cdFx0XHRcdDogc3RyaW5nO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgVW5pY29kZSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgZG9tYWluIG5hbWUgdG8gUHVueWNvZGUuIE9ubHkgdGhlXG5cdCAqIG5vbi1BU0NJSSBwYXJ0cyBvZiB0aGUgZG9tYWluIG5hbWUgd2lsbCBiZSBjb252ZXJ0ZWQsIGkuZS4gaXQgZG9lc24ndFxuXHQgKiBtYXR0ZXIgaWYgeW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0J3MgYWxyZWFkeSBpbiBBU0NJSS5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIGRvbWFpbiBuYW1lIHRvIGNvbnZlcnQsIGFzIGEgVW5pY29kZSBzdHJpbmcuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBQdW55Y29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gZG9tYWluIG5hbWUuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b0FTQ0lJKGRvbWFpbikge1xuXHRcdHJldHVybiBtYXBEb21haW4oZG9tYWluLCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdHJldHVybiByZWdleE5vbkFTQ0lJLnRlc3Qoc3RyaW5nKVxuXHRcdFx0XHQ/ICd4bi0tJyArIGVuY29kZShzdHJpbmcpXG5cdFx0XHRcdDogc3RyaW5nO1xuXHRcdH0pO1xuXHR9XG5cblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblx0LyoqIERlZmluZSB0aGUgcHVibGljIEFQSSAqL1xuXHRwdW55Y29kZSA9IHtcblx0XHQvKipcblx0XHQgKiBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgUHVueWNvZGUuanMgdmVyc2lvbiBudW1iZXIuXG5cdFx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdFx0ICogQHR5cGUgU3RyaW5nXG5cdFx0ICovXG5cdFx0J3ZlcnNpb24nOiAnMS4yLjQnLFxuXHRcdC8qKlxuXHRcdCAqIEFuIG9iamVjdCBvZiBtZXRob2RzIHRvIGNvbnZlcnQgZnJvbSBKYXZhU2NyaXB0J3MgaW50ZXJuYWwgY2hhcmFjdGVyXG5cdFx0ICogcmVwcmVzZW50YXRpb24gKFVDUy0yKSB0byBVbmljb2RlIGNvZGUgcG9pbnRzLCBhbmQgYmFjay5cblx0XHQgKiBAc2VlIDxodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nPlxuXHRcdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHRcdCAqIEB0eXBlIE9iamVjdFxuXHRcdCAqL1xuXHRcdCd1Y3MyJzoge1xuXHRcdFx0J2RlY29kZSc6IHVjczJkZWNvZGUsXG5cdFx0XHQnZW5jb2RlJzogdWNzMmVuY29kZVxuXHRcdH0sXG5cdFx0J2RlY29kZSc6IGRlY29kZSxcblx0XHQnZW5jb2RlJzogZW5jb2RlLFxuXHRcdCd0b0FTQ0lJJzogdG9BU0NJSSxcblx0XHQndG9Vbmljb2RlJzogdG9Vbmljb2RlXG5cdH07XG5cblx0LyoqIEV4cG9zZSBgcHVueWNvZGVgICovXG5cdC8vIFNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMsIGxpa2Ugci5qcywgY2hlY2sgZm9yIHNwZWNpZmljIGNvbmRpdGlvbiBwYXR0ZXJuc1xuXHQvLyBsaWtlIHRoZSBmb2xsb3dpbmc6XG5cdGlmIChcblx0XHR0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiZcblx0XHR0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JyAmJlxuXHRcdGRlZmluZS5hbWRcblx0KSB7XG5cdFx0ZGVmaW5lKCdwdW55Y29kZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHB1bnljb2RlO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKGZyZWVFeHBvcnRzICYmICFmcmVlRXhwb3J0cy5ub2RlVHlwZSkge1xuXHRcdGlmIChmcmVlTW9kdWxlKSB7IC8vIGluIE5vZGUuanMgb3IgUmluZ29KUyB2MC44LjArXG5cdFx0XHRmcmVlTW9kdWxlLmV4cG9ydHMgPSBwdW55Y29kZTtcblx0XHR9IGVsc2UgeyAvLyBpbiBOYXJ3aGFsIG9yIFJpbmdvSlMgdjAuNy4wLVxuXHRcdFx0Zm9yIChrZXkgaW4gcHVueWNvZGUpIHtcblx0XHRcdFx0cHVueWNvZGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAoZnJlZUV4cG9ydHNba2V5XSA9IHB1bnljb2RlW2tleV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHsgLy8gaW4gUmhpbm8gb3IgYSB3ZWIgYnJvd3NlclxuXHRcdHJvb3QucHVueWNvZGUgPSBwdW55Y29kZTtcblx0fVxuXG59KHRoaXMpKTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gSWYgb2JqLmhhc093blByb3BlcnR5IGhhcyBiZWVuIG92ZXJyaWRkZW4sIHRoZW4gY2FsbGluZ1xuLy8gb2JqLmhhc093blByb3BlcnR5KHByb3ApIHdpbGwgYnJlYWsuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qb3llbnQvbm9kZS9pc3N1ZXMvMTcwN1xuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihxcywgc2VwLCBlcSwgb3B0aW9ucykge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIGlmICh0eXBlb2YgcXMgIT09ICdzdHJpbmcnIHx8IHFzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICB2YXIgcmVnZXhwID0gL1xcKy9nO1xuICBxcyA9IHFzLnNwbGl0KHNlcCk7XG5cbiAgdmFyIG1heEtleXMgPSAxMDAwO1xuICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5tYXhLZXlzID09PSAnbnVtYmVyJykge1xuICAgIG1heEtleXMgPSBvcHRpb25zLm1heEtleXM7XG4gIH1cblxuICB2YXIgbGVuID0gcXMubGVuZ3RoO1xuICAvLyBtYXhLZXlzIDw9IDAgbWVhbnMgdGhhdCB3ZSBzaG91bGQgbm90IGxpbWl0IGtleXMgY291bnRcbiAgaWYgKG1heEtleXMgPiAwICYmIGxlbiA+IG1heEtleXMpIHtcbiAgICBsZW4gPSBtYXhLZXlzO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciB4ID0gcXNbaV0ucmVwbGFjZShyZWdleHAsICclMjAnKSxcbiAgICAgICAgaWR4ID0geC5pbmRleE9mKGVxKSxcbiAgICAgICAga3N0ciwgdnN0ciwgaywgdjtcblxuICAgIGlmIChpZHggPj0gMCkge1xuICAgICAga3N0ciA9IHguc3Vic3RyKDAsIGlkeCk7XG4gICAgICB2c3RyID0geC5zdWJzdHIoaWR4ICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtzdHIgPSB4O1xuICAgICAgdnN0ciA9ICcnO1xuICAgIH1cblxuICAgIGsgPSBkZWNvZGVVUklDb21wb25lbnQoa3N0cik7XG4gICAgdiA9IGRlY29kZVVSSUNvbXBvbmVudCh2c3RyKTtcblxuICAgIGlmICghaGFzT3duUHJvcGVydHkob2JqLCBrKSkge1xuICAgICAgb2JqW2tdID0gdjtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgb2JqW2tdLnB1c2godik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9ialtrXSA9IFtvYmpba10sIHZdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvYmo7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHhzKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBzdHJpbmdpZnlQcmltaXRpdmUgPSBmdW5jdGlvbih2KSB7XG4gIHN3aXRjaCAodHlwZW9mIHYpIHtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIHY7XG5cbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiB2ID8gJ3RydWUnIDogJ2ZhbHNlJztcblxuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gaXNGaW5pdGUodikgPyB2IDogJyc7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICcnO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgc2VwLCBlcSwgbmFtZSkge1xuICBzZXAgPSBzZXAgfHwgJyYnO1xuICBlcSA9IGVxIHx8ICc9JztcbiAgaWYgKG9iaiA9PT0gbnVsbCkge1xuICAgIG9iaiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBtYXAob2JqZWN0S2V5cyhvYmopLCBmdW5jdGlvbihrKSB7XG4gICAgICB2YXIga3MgPSBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKGspKSArIGVxO1xuICAgICAgaWYgKGlzQXJyYXkob2JqW2tdKSkge1xuICAgICAgICByZXR1cm4gbWFwKG9ialtrXSwgZnVuY3Rpb24odikge1xuICAgICAgICAgIHJldHVybiBrcyArIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUodikpO1xuICAgICAgICB9KS5qb2luKHNlcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9ialtrXSkpO1xuICAgICAgfVxuICAgIH0pLmpvaW4oc2VwKTtcblxuICB9XG5cbiAgaWYgKCFuYW1lKSByZXR1cm4gJyc7XG4gIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG5hbWUpKSArIGVxICtcbiAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdpZnlQcmltaXRpdmUob2JqKSk7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHhzKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxuZnVuY3Rpb24gbWFwICh4cywgZikge1xuICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGYpO1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICByZXMucHVzaChmKHhzW2ldLCBpKSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciByZXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSByZXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiByZXM7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLmRlY29kZSA9IGV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL2RlY29kZScpO1xuZXhwb3J0cy5lbmNvZGUgPSBleHBvcnRzLnN0cmluZ2lmeSA9IHJlcXVpcmUoJy4vZW5jb2RlJyk7XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHB1bnljb2RlID0gcmVxdWlyZSgncHVueWNvZGUnKTtcblxuZXhwb3J0cy5wYXJzZSA9IHVybFBhcnNlO1xuZXhwb3J0cy5yZXNvbHZlID0gdXJsUmVzb2x2ZTtcbmV4cG9ydHMucmVzb2x2ZU9iamVjdCA9IHVybFJlc29sdmVPYmplY3Q7XG5leHBvcnRzLmZvcm1hdCA9IHVybEZvcm1hdDtcblxuZXhwb3J0cy5VcmwgPSBVcmw7XG5cbmZ1bmN0aW9uIFVybCgpIHtcbiAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG4gIHRoaXMuc2xhc2hlcyA9IG51bGw7XG4gIHRoaXMuYXV0aCA9IG51bGw7XG4gIHRoaXMuaG9zdCA9IG51bGw7XG4gIHRoaXMucG9ydCA9IG51bGw7XG4gIHRoaXMuaG9zdG5hbWUgPSBudWxsO1xuICB0aGlzLmhhc2ggPSBudWxsO1xuICB0aGlzLnNlYXJjaCA9IG51bGw7XG4gIHRoaXMucXVlcnkgPSBudWxsO1xuICB0aGlzLnBhdGhuYW1lID0gbnVsbDtcbiAgdGhpcy5wYXRoID0gbnVsbDtcbiAgdGhpcy5ocmVmID0gbnVsbDtcbn1cblxuLy8gUmVmZXJlbmNlOiBSRkMgMzk4NiwgUkZDIDE4MDgsIFJGQyAyMzk2XG5cbi8vIGRlZmluZSB0aGVzZSBoZXJlIHNvIGF0IGxlYXN0IHRoZXkgb25seSBoYXZlIHRvIGJlXG4vLyBjb21waWxlZCBvbmNlIG9uIHRoZSBmaXJzdCBtb2R1bGUgbG9hZC5cbnZhciBwcm90b2NvbFBhdHRlcm4gPSAvXihbYS16MC05ListXSs6KS9pLFxuICAgIHBvcnRQYXR0ZXJuID0gLzpbMC05XSokLyxcblxuICAgIC8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIHJlc2VydmVkIGZvciBkZWxpbWl0aW5nIFVSTHMuXG4gICAgLy8gV2UgYWN0dWFsbHkganVzdCBhdXRvLWVzY2FwZSB0aGVzZS5cbiAgICBkZWxpbXMgPSBbJzwnLCAnPicsICdcIicsICdgJywgJyAnLCAnXFxyJywgJ1xcbicsICdcXHQnXSxcblxuICAgIC8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIG5vdCBhbGxvd2VkIGZvciB2YXJpb3VzIHJlYXNvbnMuXG4gICAgdW53aXNlID0gWyd7JywgJ30nLCAnfCcsICdcXFxcJywgJ14nLCAnYCddLmNvbmNhdChkZWxpbXMpLFxuXG4gICAgLy8gQWxsb3dlZCBieSBSRkNzLCBidXQgY2F1c2Ugb2YgWFNTIGF0dGFja3MuICBBbHdheXMgZXNjYXBlIHRoZXNlLlxuICAgIGF1dG9Fc2NhcGUgPSBbJ1xcJyddLmNvbmNhdCh1bndpc2UpLFxuICAgIC8vIENoYXJhY3RlcnMgdGhhdCBhcmUgbmV2ZXIgZXZlciBhbGxvd2VkIGluIGEgaG9zdG5hbWUuXG4gICAgLy8gTm90ZSB0aGF0IGFueSBpbnZhbGlkIGNoYXJzIGFyZSBhbHNvIGhhbmRsZWQsIGJ1dCB0aGVzZVxuICAgIC8vIGFyZSB0aGUgb25lcyB0aGF0IGFyZSAqZXhwZWN0ZWQqIHRvIGJlIHNlZW4sIHNvIHdlIGZhc3QtcGF0aFxuICAgIC8vIHRoZW0uXG4gICAgbm9uSG9zdENoYXJzID0gWyclJywgJy8nLCAnPycsICc7JywgJyMnXS5jb25jYXQoYXV0b0VzY2FwZSksXG4gICAgaG9zdEVuZGluZ0NoYXJzID0gWycvJywgJz8nLCAnIyddLFxuICAgIGhvc3RuYW1lTWF4TGVuID0gMjU1LFxuICAgIGhvc3RuYW1lUGFydFBhdHRlcm4gPSAvXlthLXowLTlBLVpfLV17MCw2M30kLyxcbiAgICBob3N0bmFtZVBhcnRTdGFydCA9IC9eKFthLXowLTlBLVpfLV17MCw2M30pKC4qKSQvLFxuICAgIC8vIHByb3RvY29scyB0aGF0IGNhbiBhbGxvdyBcInVuc2FmZVwiIGFuZCBcInVud2lzZVwiIGNoYXJzLlxuICAgIHVuc2FmZVByb3RvY29sID0ge1xuICAgICAgJ2phdmFzY3JpcHQnOiB0cnVlLFxuICAgICAgJ2phdmFzY3JpcHQ6JzogdHJ1ZVxuICAgIH0sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgbmV2ZXIgaGF2ZSBhIGhvc3RuYW1lLlxuICAgIGhvc3RsZXNzUHJvdG9jb2wgPSB7XG4gICAgICAnamF2YXNjcmlwdCc6IHRydWUsXG4gICAgICAnamF2YXNjcmlwdDonOiB0cnVlXG4gICAgfSxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBhbHdheXMgY29udGFpbiBhIC8vIGJpdC5cbiAgICBzbGFzaGVkUHJvdG9jb2wgPSB7XG4gICAgICAnaHR0cCc6IHRydWUsXG4gICAgICAnaHR0cHMnOiB0cnVlLFxuICAgICAgJ2Z0cCc6IHRydWUsXG4gICAgICAnZ29waGVyJzogdHJ1ZSxcbiAgICAgICdmaWxlJzogdHJ1ZSxcbiAgICAgICdodHRwOic6IHRydWUsXG4gICAgICAnaHR0cHM6JzogdHJ1ZSxcbiAgICAgICdmdHA6JzogdHJ1ZSxcbiAgICAgICdnb3BoZXI6JzogdHJ1ZSxcbiAgICAgICdmaWxlOic6IHRydWVcbiAgICB9LFxuICAgIHF1ZXJ5c3RyaW5nID0gcmVxdWlyZSgncXVlcnlzdHJpbmcnKTtcblxuZnVuY3Rpb24gdXJsUGFyc2UodXJsLCBwYXJzZVF1ZXJ5U3RyaW5nLCBzbGFzaGVzRGVub3RlSG9zdCkge1xuICBpZiAodXJsICYmIGlzT2JqZWN0KHVybCkgJiYgdXJsIGluc3RhbmNlb2YgVXJsKSByZXR1cm4gdXJsO1xuXG4gIHZhciB1ID0gbmV3IFVybDtcbiAgdS5wYXJzZSh1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KTtcbiAgcmV0dXJuIHU7XG59XG5cblVybC5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbih1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGlmICghaXNTdHJpbmcodXJsKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQYXJhbWV0ZXIgJ3VybCcgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHVybCk7XG4gIH1cblxuICB2YXIgcmVzdCA9IHVybDtcblxuICAvLyB0cmltIGJlZm9yZSBwcm9jZWVkaW5nLlxuICAvLyBUaGlzIGlzIHRvIHN1cHBvcnQgcGFyc2Ugc3R1ZmYgbGlrZSBcIiAgaHR0cDovL2Zvby5jb20gIFxcblwiXG4gIHJlc3QgPSByZXN0LnRyaW0oKTtcblxuICB2YXIgcHJvdG8gPSBwcm90b2NvbFBhdHRlcm4uZXhlYyhyZXN0KTtcbiAgaWYgKHByb3RvKSB7XG4gICAgcHJvdG8gPSBwcm90b1swXTtcbiAgICB2YXIgbG93ZXJQcm90byA9IHByb3RvLnRvTG93ZXJDYXNlKCk7XG4gICAgdGhpcy5wcm90b2NvbCA9IGxvd2VyUHJvdG87XG4gICAgcmVzdCA9IHJlc3Quc3Vic3RyKHByb3RvLmxlbmd0aCk7XG4gIH1cblxuICAvLyBmaWd1cmUgb3V0IGlmIGl0J3MgZ290IGEgaG9zdFxuICAvLyB1c2VyQHNlcnZlciBpcyAqYWx3YXlzKiBpbnRlcnByZXRlZCBhcyBhIGhvc3RuYW1lLCBhbmQgdXJsXG4gIC8vIHJlc29sdXRpb24gd2lsbCB0cmVhdCAvL2Zvby9iYXIgYXMgaG9zdD1mb28scGF0aD1iYXIgYmVjYXVzZSB0aGF0J3NcbiAgLy8gaG93IHRoZSBicm93c2VyIHJlc29sdmVzIHJlbGF0aXZlIFVSTHMuXG4gIGlmIChzbGFzaGVzRGVub3RlSG9zdCB8fCBwcm90byB8fCByZXN0Lm1hdGNoKC9eXFwvXFwvW15AXFwvXStAW15AXFwvXSsvKSkge1xuICAgIHZhciBzbGFzaGVzID0gcmVzdC5zdWJzdHIoMCwgMikgPT09ICcvLyc7XG4gICAgaWYgKHNsYXNoZXMgJiYgIShwcm90byAmJiBob3N0bGVzc1Byb3RvY29sW3Byb3RvXSkpIHtcbiAgICAgIHJlc3QgPSByZXN0LnN1YnN0cigyKTtcbiAgICAgIHRoaXMuc2xhc2hlcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFob3N0bGVzc1Byb3RvY29sW3Byb3RvXSAmJlxuICAgICAgKHNsYXNoZXMgfHwgKHByb3RvICYmICFzbGFzaGVkUHJvdG9jb2xbcHJvdG9dKSkpIHtcblxuICAgIC8vIHRoZXJlJ3MgYSBob3N0bmFtZS5cbiAgICAvLyB0aGUgZmlyc3QgaW5zdGFuY2Ugb2YgLywgPywgOywgb3IgIyBlbmRzIHRoZSBob3N0LlxuICAgIC8vXG4gICAgLy8gSWYgdGhlcmUgaXMgYW4gQCBpbiB0aGUgaG9zdG5hbWUsIHRoZW4gbm9uLWhvc3QgY2hhcnMgKmFyZSogYWxsb3dlZFxuICAgIC8vIHRvIHRoZSBsZWZ0IG9mIHRoZSBsYXN0IEAgc2lnbiwgdW5sZXNzIHNvbWUgaG9zdC1lbmRpbmcgY2hhcmFjdGVyXG4gICAgLy8gY29tZXMgKmJlZm9yZSogdGhlIEAtc2lnbi5cbiAgICAvLyBVUkxzIGFyZSBvYm5veGlvdXMuXG4gICAgLy9cbiAgICAvLyBleDpcbiAgICAvLyBodHRwOi8vYUBiQGMvID0+IHVzZXI6YUBiIGhvc3Q6Y1xuICAgIC8vIGh0dHA6Ly9hQGI/QGMgPT4gdXNlcjphIGhvc3Q6YyBwYXRoOi8/QGNcblxuICAgIC8vIHYwLjEyIFRPRE8oaXNhYWNzKTogVGhpcyBpcyBub3QgcXVpdGUgaG93IENocm9tZSBkb2VzIHRoaW5ncy5cbiAgICAvLyBSZXZpZXcgb3VyIHRlc3QgY2FzZSBhZ2FpbnN0IGJyb3dzZXJzIG1vcmUgY29tcHJlaGVuc2l2ZWx5LlxuXG4gICAgLy8gZmluZCB0aGUgZmlyc3QgaW5zdGFuY2Ugb2YgYW55IGhvc3RFbmRpbmdDaGFyc1xuICAgIHZhciBob3N0RW5kID0gLTE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBob3N0RW5kaW5nQ2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBoZWMgPSByZXN0LmluZGV4T2YoaG9zdEVuZGluZ0NoYXJzW2ldKTtcbiAgICAgIGlmIChoZWMgIT09IC0xICYmIChob3N0RW5kID09PSAtMSB8fCBoZWMgPCBob3N0RW5kKSlcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICB9XG5cbiAgICAvLyBhdCB0aGlzIHBvaW50LCBlaXRoZXIgd2UgaGF2ZSBhbiBleHBsaWNpdCBwb2ludCB3aGVyZSB0aGVcbiAgICAvLyBhdXRoIHBvcnRpb24gY2Fubm90IGdvIHBhc3QsIG9yIHRoZSBsYXN0IEAgY2hhciBpcyB0aGUgZGVjaWRlci5cbiAgICB2YXIgYXV0aCwgYXRTaWduO1xuICAgIGlmIChob3N0RW5kID09PSAtMSkge1xuICAgICAgLy8gYXRTaWduIGNhbiBiZSBhbnl3aGVyZS5cbiAgICAgIGF0U2lnbiA9IHJlc3QubGFzdEluZGV4T2YoJ0AnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYXRTaWduIG11c3QgYmUgaW4gYXV0aCBwb3J0aW9uLlxuICAgICAgLy8gaHR0cDovL2FAYi9jQGQgPT4gaG9zdDpiIGF1dGg6YSBwYXRoOi9jQGRcbiAgICAgIGF0U2lnbiA9IHJlc3QubGFzdEluZGV4T2YoJ0AnLCBob3N0RW5kKTtcbiAgICB9XG5cbiAgICAvLyBOb3cgd2UgaGF2ZSBhIHBvcnRpb24gd2hpY2ggaXMgZGVmaW5pdGVseSB0aGUgYXV0aC5cbiAgICAvLyBQdWxsIHRoYXQgb2ZmLlxuICAgIGlmIChhdFNpZ24gIT09IC0xKSB7XG4gICAgICBhdXRoID0gcmVzdC5zbGljZSgwLCBhdFNpZ24pO1xuICAgICAgcmVzdCA9IHJlc3Quc2xpY2UoYXRTaWduICsgMSk7XG4gICAgICB0aGlzLmF1dGggPSBkZWNvZGVVUklDb21wb25lbnQoYXV0aCk7XG4gICAgfVxuXG4gICAgLy8gdGhlIGhvc3QgaXMgdGhlIHJlbWFpbmluZyB0byB0aGUgbGVmdCBvZiB0aGUgZmlyc3Qgbm9uLWhvc3QgY2hhclxuICAgIGhvc3RFbmQgPSAtMTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vbkhvc3RDaGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGhlYyA9IHJlc3QuaW5kZXhPZihub25Ib3N0Q2hhcnNbaV0pO1xuICAgICAgaWYgKGhlYyAhPT0gLTEgJiYgKGhvc3RFbmQgPT09IC0xIHx8IGhlYyA8IGhvc3RFbmQpKVxuICAgICAgICBob3N0RW5kID0gaGVjO1xuICAgIH1cbiAgICAvLyBpZiB3ZSBzdGlsbCBoYXZlIG5vdCBoaXQgaXQsIHRoZW4gdGhlIGVudGlyZSB0aGluZyBpcyBhIGhvc3QuXG4gICAgaWYgKGhvc3RFbmQgPT09IC0xKVxuICAgICAgaG9zdEVuZCA9IHJlc3QubGVuZ3RoO1xuXG4gICAgdGhpcy5ob3N0ID0gcmVzdC5zbGljZSgwLCBob3N0RW5kKTtcbiAgICByZXN0ID0gcmVzdC5zbGljZShob3N0RW5kKTtcblxuICAgIC8vIHB1bGwgb3V0IHBvcnQuXG4gICAgdGhpcy5wYXJzZUhvc3QoKTtcblxuICAgIC8vIHdlJ3ZlIGluZGljYXRlZCB0aGF0IHRoZXJlIGlzIGEgaG9zdG5hbWUsXG4gICAgLy8gc28gZXZlbiBpZiBpdCdzIGVtcHR5LCBpdCBoYXMgdG8gYmUgcHJlc2VudC5cbiAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZSB8fCAnJztcblxuICAgIC8vIGlmIGhvc3RuYW1lIGJlZ2lucyB3aXRoIFsgYW5kIGVuZHMgd2l0aCBdXG4gICAgLy8gYXNzdW1lIHRoYXQgaXQncyBhbiBJUHY2IGFkZHJlc3MuXG4gICAgdmFyIGlwdjZIb3N0bmFtZSA9IHRoaXMuaG9zdG5hbWVbMF0gPT09ICdbJyAmJlxuICAgICAgICB0aGlzLmhvc3RuYW1lW3RoaXMuaG9zdG5hbWUubGVuZ3RoIC0gMV0gPT09ICddJztcblxuICAgIC8vIHZhbGlkYXRlIGEgbGl0dGxlLlxuICAgIGlmICghaXB2Nkhvc3RuYW1lKSB7XG4gICAgICB2YXIgaG9zdHBhcnRzID0gdGhpcy5ob3N0bmFtZS5zcGxpdCgvXFwuLyk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGhvc3RwYXJ0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIHBhcnQgPSBob3N0cGFydHNbaV07XG4gICAgICAgIGlmICghcGFydCkgY29udGludWU7XG4gICAgICAgIGlmICghcGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgIHZhciBuZXdwYXJ0ID0gJyc7XG4gICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGsgPSBwYXJ0Lmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgaWYgKHBhcnQuY2hhckNvZGVBdChqKSA+IDEyNykge1xuICAgICAgICAgICAgICAvLyB3ZSByZXBsYWNlIG5vbi1BU0NJSSBjaGFyIHdpdGggYSB0ZW1wb3JhcnkgcGxhY2Vob2xkZXJcbiAgICAgICAgICAgICAgLy8gd2UgbmVlZCB0aGlzIHRvIG1ha2Ugc3VyZSBzaXplIG9mIGhvc3RuYW1lIGlzIG5vdFxuICAgICAgICAgICAgICAvLyBicm9rZW4gYnkgcmVwbGFjaW5nIG5vbi1BU0NJSSBieSBub3RoaW5nXG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gJ3gnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbmV3cGFydCArPSBwYXJ0W2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyB3ZSB0ZXN0IGFnYWluIHdpdGggQVNDSUkgY2hhciBvbmx5XG4gICAgICAgICAgaWYgKCFuZXdwYXJ0Lm1hdGNoKGhvc3RuYW1lUGFydFBhdHRlcm4pKSB7XG4gICAgICAgICAgICB2YXIgdmFsaWRQYXJ0cyA9IGhvc3RwYXJ0cy5zbGljZSgwLCBpKTtcbiAgICAgICAgICAgIHZhciBub3RIb3N0ID0gaG9zdHBhcnRzLnNsaWNlKGkgKyAxKTtcbiAgICAgICAgICAgIHZhciBiaXQgPSBwYXJ0Lm1hdGNoKGhvc3RuYW1lUGFydFN0YXJ0KTtcbiAgICAgICAgICAgIGlmIChiaXQpIHtcbiAgICAgICAgICAgICAgdmFsaWRQYXJ0cy5wdXNoKGJpdFsxXSk7XG4gICAgICAgICAgICAgIG5vdEhvc3QudW5zaGlmdChiaXRbMl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdEhvc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJlc3QgPSAnLycgKyBub3RIb3N0LmpvaW4oJy4nKSArIHJlc3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmhvc3RuYW1lID0gdmFsaWRQYXJ0cy5qb2luKCcuJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5ob3N0bmFtZS5sZW5ndGggPiBob3N0bmFtZU1heExlbikge1xuICAgICAgdGhpcy5ob3N0bmFtZSA9ICcnO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBob3N0bmFtZXMgYXJlIGFsd2F5cyBsb3dlciBjYXNlLlxuICAgICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB9XG5cbiAgICBpZiAoIWlwdjZIb3N0bmFtZSkge1xuICAgICAgLy8gSUROQSBTdXBwb3J0OiBSZXR1cm5zIGEgcHVueSBjb2RlZCByZXByZXNlbnRhdGlvbiBvZiBcImRvbWFpblwiLlxuICAgICAgLy8gSXQgb25seSBjb252ZXJ0cyB0aGUgcGFydCBvZiB0aGUgZG9tYWluIG5hbWUgdGhhdFxuICAgICAgLy8gaGFzIG5vbiBBU0NJSSBjaGFyYWN0ZXJzLiBJLmUuIGl0IGRvc2VudCBtYXR0ZXIgaWZcbiAgICAgIC8vIHlvdSBjYWxsIGl0IHdpdGggYSBkb21haW4gdGhhdCBhbHJlYWR5IGlzIGluIEFTQ0lJLlxuICAgICAgdmFyIGRvbWFpbkFycmF5ID0gdGhpcy5ob3N0bmFtZS5zcGxpdCgnLicpO1xuICAgICAgdmFyIG5ld091dCA9IFtdO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkb21haW5BcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgcyA9IGRvbWFpbkFycmF5W2ldO1xuICAgICAgICBuZXdPdXQucHVzaChzLm1hdGNoKC9bXkEtWmEtejAtOV8tXS8pID9cbiAgICAgICAgICAgICd4bi0tJyArIHB1bnljb2RlLmVuY29kZShzKSA6IHMpO1xuICAgICAgfVxuICAgICAgdGhpcy5ob3N0bmFtZSA9IG5ld091dC5qb2luKCcuJyk7XG4gICAgfVxuXG4gICAgdmFyIHAgPSB0aGlzLnBvcnQgPyAnOicgKyB0aGlzLnBvcnQgOiAnJztcbiAgICB2YXIgaCA9IHRoaXMuaG9zdG5hbWUgfHwgJyc7XG4gICAgdGhpcy5ob3N0ID0gaCArIHA7XG4gICAgdGhpcy5ocmVmICs9IHRoaXMuaG9zdDtcblxuICAgIC8vIHN0cmlwIFsgYW5kIF0gZnJvbSB0aGUgaG9zdG5hbWVcbiAgICAvLyB0aGUgaG9zdCBmaWVsZCBzdGlsbCByZXRhaW5zIHRoZW0sIHRob3VnaFxuICAgIGlmIChpcHY2SG9zdG5hbWUpIHtcbiAgICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lLnN1YnN0cigxLCB0aGlzLmhvc3RuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgaWYgKHJlc3RbMF0gIT09ICcvJykge1xuICAgICAgICByZXN0ID0gJy8nICsgcmVzdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBub3cgcmVzdCBpcyBzZXQgdG8gdGhlIHBvc3QtaG9zdCBzdHVmZi5cbiAgLy8gY2hvcCBvZmYgYW55IGRlbGltIGNoYXJzLlxuICBpZiAoIXVuc2FmZVByb3RvY29sW2xvd2VyUHJvdG9dKSB7XG5cbiAgICAvLyBGaXJzdCwgbWFrZSAxMDAlIHN1cmUgdGhhdCBhbnkgXCJhdXRvRXNjYXBlXCIgY2hhcnMgZ2V0XG4gICAgLy8gZXNjYXBlZCwgZXZlbiBpZiBlbmNvZGVVUklDb21wb25lbnQgZG9lc24ndCB0aGluayB0aGV5XG4gICAgLy8gbmVlZCB0byBiZS5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGF1dG9Fc2NhcGUubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgYWUgPSBhdXRvRXNjYXBlW2ldO1xuICAgICAgdmFyIGVzYyA9IGVuY29kZVVSSUNvbXBvbmVudChhZSk7XG4gICAgICBpZiAoZXNjID09PSBhZSkge1xuICAgICAgICBlc2MgPSBlc2NhcGUoYWUpO1xuICAgICAgfVxuICAgICAgcmVzdCA9IHJlc3Quc3BsaXQoYWUpLmpvaW4oZXNjKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vIGNob3Agb2ZmIGZyb20gdGhlIHRhaWwgZmlyc3QuXG4gIHZhciBoYXNoID0gcmVzdC5pbmRleE9mKCcjJyk7XG4gIGlmIChoYXNoICE9PSAtMSkge1xuICAgIC8vIGdvdCBhIGZyYWdtZW50IHN0cmluZy5cbiAgICB0aGlzLmhhc2ggPSByZXN0LnN1YnN0cihoYXNoKTtcbiAgICByZXN0ID0gcmVzdC5zbGljZSgwLCBoYXNoKTtcbiAgfVxuICB2YXIgcW0gPSByZXN0LmluZGV4T2YoJz8nKTtcbiAgaWYgKHFtICE9PSAtMSkge1xuICAgIHRoaXMuc2VhcmNoID0gcmVzdC5zdWJzdHIocW0pO1xuICAgIHRoaXMucXVlcnkgPSByZXN0LnN1YnN0cihxbSArIDEpO1xuICAgIGlmIChwYXJzZVF1ZXJ5U3RyaW5nKSB7XG4gICAgICB0aGlzLnF1ZXJ5ID0gcXVlcnlzdHJpbmcucGFyc2UodGhpcy5xdWVyeSk7XG4gICAgfVxuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIHFtKTtcbiAgfSBlbHNlIGlmIChwYXJzZVF1ZXJ5U3RyaW5nKSB7XG4gICAgLy8gbm8gcXVlcnkgc3RyaW5nLCBidXQgcGFyc2VRdWVyeVN0cmluZyBzdGlsbCByZXF1ZXN0ZWRcbiAgICB0aGlzLnNlYXJjaCA9ICcnO1xuICAgIHRoaXMucXVlcnkgPSB7fTtcbiAgfVxuICBpZiAocmVzdCkgdGhpcy5wYXRobmFtZSA9IHJlc3Q7XG4gIGlmIChzbGFzaGVkUHJvdG9jb2xbbG93ZXJQcm90b10gJiZcbiAgICAgIHRoaXMuaG9zdG5hbWUgJiYgIXRoaXMucGF0aG5hbWUpIHtcbiAgICB0aGlzLnBhdGhuYW1lID0gJy8nO1xuICB9XG5cbiAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICBpZiAodGhpcy5wYXRobmFtZSB8fCB0aGlzLnNlYXJjaCkge1xuICAgIHZhciBwID0gdGhpcy5wYXRobmFtZSB8fCAnJztcbiAgICB2YXIgcyA9IHRoaXMuc2VhcmNoIHx8ICcnO1xuICAgIHRoaXMucGF0aCA9IHAgKyBzO1xuICB9XG5cbiAgLy8gZmluYWxseSwgcmVjb25zdHJ1Y3QgdGhlIGhyZWYgYmFzZWQgb24gd2hhdCBoYXMgYmVlbiB2YWxpZGF0ZWQuXG4gIHRoaXMuaHJlZiA9IHRoaXMuZm9ybWF0KCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZm9ybWF0IGEgcGFyc2VkIG9iamVjdCBpbnRvIGEgdXJsIHN0cmluZ1xuZnVuY3Rpb24gdXJsRm9ybWF0KG9iaikge1xuICAvLyBlbnN1cmUgaXQncyBhbiBvYmplY3QsIGFuZCBub3QgYSBzdHJpbmcgdXJsLlxuICAvLyBJZiBpdCdzIGFuIG9iaiwgdGhpcyBpcyBhIG5vLW9wLlxuICAvLyB0aGlzIHdheSwgeW91IGNhbiBjYWxsIHVybF9mb3JtYXQoKSBvbiBzdHJpbmdzXG4gIC8vIHRvIGNsZWFuIHVwIHBvdGVudGlhbGx5IHdvbmt5IHVybHMuXG4gIGlmIChpc1N0cmluZyhvYmopKSBvYmogPSB1cmxQYXJzZShvYmopO1xuICBpZiAoIShvYmogaW5zdGFuY2VvZiBVcmwpKSByZXR1cm4gVXJsLnByb3RvdHlwZS5mb3JtYXQuY2FsbChvYmopO1xuICByZXR1cm4gb2JqLmZvcm1hdCgpO1xufVxuXG5VcmwucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYXV0aCA9IHRoaXMuYXV0aCB8fCAnJztcbiAgaWYgKGF1dGgpIHtcbiAgICBhdXRoID0gZW5jb2RlVVJJQ29tcG9uZW50KGF1dGgpO1xuICAgIGF1dGggPSBhdXRoLnJlcGxhY2UoLyUzQS9pLCAnOicpO1xuICAgIGF1dGggKz0gJ0AnO1xuICB9XG5cbiAgdmFyIHByb3RvY29sID0gdGhpcy5wcm90b2NvbCB8fCAnJyxcbiAgICAgIHBhdGhuYW1lID0gdGhpcy5wYXRobmFtZSB8fCAnJyxcbiAgICAgIGhhc2ggPSB0aGlzLmhhc2ggfHwgJycsXG4gICAgICBob3N0ID0gZmFsc2UsXG4gICAgICBxdWVyeSA9ICcnO1xuXG4gIGlmICh0aGlzLmhvc3QpIHtcbiAgICBob3N0ID0gYXV0aCArIHRoaXMuaG9zdDtcbiAgfSBlbHNlIGlmICh0aGlzLmhvc3RuYW1lKSB7XG4gICAgaG9zdCA9IGF1dGggKyAodGhpcy5ob3N0bmFtZS5pbmRleE9mKCc6JykgPT09IC0xID9cbiAgICAgICAgdGhpcy5ob3N0bmFtZSA6XG4gICAgICAgICdbJyArIHRoaXMuaG9zdG5hbWUgKyAnXScpO1xuICAgIGlmICh0aGlzLnBvcnQpIHtcbiAgICAgIGhvc3QgKz0gJzonICsgdGhpcy5wb3J0O1xuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLnF1ZXJ5ICYmXG4gICAgICBpc09iamVjdCh0aGlzLnF1ZXJ5KSAmJlxuICAgICAgT2JqZWN0LmtleXModGhpcy5xdWVyeSkubGVuZ3RoKSB7XG4gICAgcXVlcnkgPSBxdWVyeXN0cmluZy5zdHJpbmdpZnkodGhpcy5xdWVyeSk7XG4gIH1cblxuICB2YXIgc2VhcmNoID0gdGhpcy5zZWFyY2ggfHwgKHF1ZXJ5ICYmICgnPycgKyBxdWVyeSkpIHx8ICcnO1xuXG4gIGlmIChwcm90b2NvbCAmJiBwcm90b2NvbC5zdWJzdHIoLTEpICE9PSAnOicpIHByb3RvY29sICs9ICc6JztcblxuICAvLyBvbmx5IHRoZSBzbGFzaGVkUHJvdG9jb2xzIGdldCB0aGUgLy8uICBOb3QgbWFpbHRvOiwgeG1wcDosIGV0Yy5cbiAgLy8gdW5sZXNzIHRoZXkgaGFkIHRoZW0gdG8gYmVnaW4gd2l0aC5cbiAgaWYgKHRoaXMuc2xhc2hlcyB8fFxuICAgICAgKCFwcm90b2NvbCB8fCBzbGFzaGVkUHJvdG9jb2xbcHJvdG9jb2xdKSAmJiBob3N0ICE9PSBmYWxzZSkge1xuICAgIGhvc3QgPSAnLy8nICsgKGhvc3QgfHwgJycpO1xuICAgIGlmIChwYXRobmFtZSAmJiBwYXRobmFtZS5jaGFyQXQoMCkgIT09ICcvJykgcGF0aG5hbWUgPSAnLycgKyBwYXRobmFtZTtcbiAgfSBlbHNlIGlmICghaG9zdCkge1xuICAgIGhvc3QgPSAnJztcbiAgfVxuXG4gIGlmIChoYXNoICYmIGhhc2guY2hhckF0KDApICE9PSAnIycpIGhhc2ggPSAnIycgKyBoYXNoO1xuICBpZiAoc2VhcmNoICYmIHNlYXJjaC5jaGFyQXQoMCkgIT09ICc/Jykgc2VhcmNoID0gJz8nICsgc2VhcmNoO1xuXG4gIHBhdGhuYW1lID0gcGF0aG5hbWUucmVwbGFjZSgvWz8jXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQobWF0Y2gpO1xuICB9KTtcbiAgc2VhcmNoID0gc2VhcmNoLnJlcGxhY2UoJyMnLCAnJTIzJyk7XG5cbiAgcmV0dXJuIHByb3RvY29sICsgaG9zdCArIHBhdGhuYW1lICsgc2VhcmNoICsgaGFzaDtcbn07XG5cbmZ1bmN0aW9uIHVybFJlc29sdmUoc291cmNlLCByZWxhdGl2ZSkge1xuICByZXR1cm4gdXJsUGFyc2Uoc291cmNlLCBmYWxzZSwgdHJ1ZSkucmVzb2x2ZShyZWxhdGl2ZSk7XG59XG5cblVybC5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uKHJlbGF0aXZlKSB7XG4gIHJldHVybiB0aGlzLnJlc29sdmVPYmplY3QodXJsUGFyc2UocmVsYXRpdmUsIGZhbHNlLCB0cnVlKSkuZm9ybWF0KCk7XG59O1xuXG5mdW5jdGlvbiB1cmxSZXNvbHZlT2JqZWN0KHNvdXJjZSwgcmVsYXRpdmUpIHtcbiAgaWYgKCFzb3VyY2UpIHJldHVybiByZWxhdGl2ZTtcbiAgcmV0dXJuIHVybFBhcnNlKHNvdXJjZSwgZmFsc2UsIHRydWUpLnJlc29sdmVPYmplY3QocmVsYXRpdmUpO1xufVxuXG5VcmwucHJvdG90eXBlLnJlc29sdmVPYmplY3QgPSBmdW5jdGlvbihyZWxhdGl2ZSkge1xuICBpZiAoaXNTdHJpbmcocmVsYXRpdmUpKSB7XG4gICAgdmFyIHJlbCA9IG5ldyBVcmwoKTtcbiAgICByZWwucGFyc2UocmVsYXRpdmUsIGZhbHNlLCB0cnVlKTtcbiAgICByZWxhdGl2ZSA9IHJlbDtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSBuZXcgVXJsKCk7XG4gIE9iamVjdC5rZXlzKHRoaXMpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgIHJlc3VsdFtrXSA9IHRoaXNba107XG4gIH0sIHRoaXMpO1xuXG4gIC8vIGhhc2ggaXMgYWx3YXlzIG92ZXJyaWRkZW4sIG5vIG1hdHRlciB3aGF0LlxuICAvLyBldmVuIGhyZWY9XCJcIiB3aWxsIHJlbW92ZSBpdC5cbiAgcmVzdWx0Lmhhc2ggPSByZWxhdGl2ZS5oYXNoO1xuXG4gIC8vIGlmIHRoZSByZWxhdGl2ZSB1cmwgaXMgZW1wdHksIHRoZW4gdGhlcmUncyBub3RoaW5nIGxlZnQgdG8gZG8gaGVyZS5cbiAgaWYgKHJlbGF0aXZlLmhyZWYgPT09ICcnKSB7XG4gICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIGhyZWZzIGxpa2UgLy9mb28vYmFyIGFsd2F5cyBjdXQgdG8gdGhlIHByb3RvY29sLlxuICBpZiAocmVsYXRpdmUuc2xhc2hlcyAmJiAhcmVsYXRpdmUucHJvdG9jb2wpIHtcbiAgICAvLyB0YWtlIGV2ZXJ5dGhpbmcgZXhjZXB0IHRoZSBwcm90b2NvbCBmcm9tIHJlbGF0aXZlXG4gICAgT2JqZWN0LmtleXMocmVsYXRpdmUpLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgaWYgKGsgIT09ICdwcm90b2NvbCcpXG4gICAgICAgIHJlc3VsdFtrXSA9IHJlbGF0aXZlW2tdO1xuICAgIH0pO1xuXG4gICAgLy91cmxQYXJzZSBhcHBlbmRzIHRyYWlsaW5nIC8gdG8gdXJscyBsaWtlIGh0dHA6Ly93d3cuZXhhbXBsZS5jb21cbiAgICBpZiAoc2xhc2hlZFByb3RvY29sW3Jlc3VsdC5wcm90b2NvbF0gJiZcbiAgICAgICAgcmVzdWx0Lmhvc3RuYW1lICYmICFyZXN1bHQucGF0aG5hbWUpIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gcmVzdWx0LnBhdGhuYW1lID0gJy8nO1xuICAgIH1cblxuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpZiAocmVsYXRpdmUucHJvdG9jb2wgJiYgcmVsYXRpdmUucHJvdG9jb2wgIT09IHJlc3VsdC5wcm90b2NvbCkge1xuICAgIC8vIGlmIGl0J3MgYSBrbm93biB1cmwgcHJvdG9jb2wsIHRoZW4gY2hhbmdpbmdcbiAgICAvLyB0aGUgcHJvdG9jb2wgZG9lcyB3ZWlyZCB0aGluZ3NcbiAgICAvLyBmaXJzdCwgaWYgaXQncyBub3QgZmlsZTosIHRoZW4gd2UgTVVTVCBoYXZlIGEgaG9zdCxcbiAgICAvLyBhbmQgaWYgdGhlcmUgd2FzIGEgcGF0aFxuICAgIC8vIHRvIGJlZ2luIHdpdGgsIHRoZW4gd2UgTVVTVCBoYXZlIGEgcGF0aC5cbiAgICAvLyBpZiBpdCBpcyBmaWxlOiwgdGhlbiB0aGUgaG9zdCBpcyBkcm9wcGVkLFxuICAgIC8vIGJlY2F1c2UgdGhhdCdzIGtub3duIHRvIGJlIGhvc3RsZXNzLlxuICAgIC8vIGFueXRoaW5nIGVsc2UgaXMgYXNzdW1lZCB0byBiZSBhYnNvbHV0ZS5cbiAgICBpZiAoIXNsYXNoZWRQcm90b2NvbFtyZWxhdGl2ZS5wcm90b2NvbF0pIHtcbiAgICAgIE9iamVjdC5rZXlzKHJlbGF0aXZlKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgICAgcmVzdWx0W2tdID0gcmVsYXRpdmVba107XG4gICAgICB9KTtcbiAgICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXN1bHQucHJvdG9jb2wgPSByZWxhdGl2ZS5wcm90b2NvbDtcbiAgICBpZiAoIXJlbGF0aXZlLmhvc3QgJiYgIWhvc3RsZXNzUHJvdG9jb2xbcmVsYXRpdmUucHJvdG9jb2xdKSB7XG4gICAgICB2YXIgcmVsUGF0aCA9IChyZWxhdGl2ZS5wYXRobmFtZSB8fCAnJykuc3BsaXQoJy8nKTtcbiAgICAgIHdoaWxlIChyZWxQYXRoLmxlbmd0aCAmJiAhKHJlbGF0aXZlLmhvc3QgPSByZWxQYXRoLnNoaWZ0KCkpKTtcbiAgICAgIGlmICghcmVsYXRpdmUuaG9zdCkgcmVsYXRpdmUuaG9zdCA9ICcnO1xuICAgICAgaWYgKCFyZWxhdGl2ZS5ob3N0bmFtZSkgcmVsYXRpdmUuaG9zdG5hbWUgPSAnJztcbiAgICAgIGlmIChyZWxQYXRoWzBdICE9PSAnJykgcmVsUGF0aC51bnNoaWZ0KCcnKTtcbiAgICAgIGlmIChyZWxQYXRoLmxlbmd0aCA8IDIpIHJlbFBhdGgudW5zaGlmdCgnJyk7XG4gICAgICByZXN1bHQucGF0aG5hbWUgPSByZWxQYXRoLmpvaW4oJy8nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnBhdGhuYW1lID0gcmVsYXRpdmUucGF0aG5hbWU7XG4gICAgfVxuICAgIHJlc3VsdC5zZWFyY2ggPSByZWxhdGl2ZS5zZWFyY2g7XG4gICAgcmVzdWx0LnF1ZXJ5ID0gcmVsYXRpdmUucXVlcnk7XG4gICAgcmVzdWx0Lmhvc3QgPSByZWxhdGl2ZS5ob3N0IHx8ICcnO1xuICAgIHJlc3VsdC5hdXRoID0gcmVsYXRpdmUuYXV0aDtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSByZWxhdGl2ZS5ob3N0bmFtZSB8fCByZWxhdGl2ZS5ob3N0O1xuICAgIHJlc3VsdC5wb3J0ID0gcmVsYXRpdmUucG9ydDtcbiAgICAvLyB0byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmIChyZXN1bHQucGF0aG5hbWUgfHwgcmVzdWx0LnNlYXJjaCkge1xuICAgICAgdmFyIHAgPSByZXN1bHQucGF0aG5hbWUgfHwgJyc7XG4gICAgICB2YXIgcyA9IHJlc3VsdC5zZWFyY2ggfHwgJyc7XG4gICAgICByZXN1bHQucGF0aCA9IHAgKyBzO1xuICAgIH1cbiAgICByZXN1bHQuc2xhc2hlcyA9IHJlc3VsdC5zbGFzaGVzIHx8IHJlbGF0aXZlLnNsYXNoZXM7XG4gICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHZhciBpc1NvdXJjZUFicyA9IChyZXN1bHQucGF0aG5hbWUgJiYgcmVzdWx0LnBhdGhuYW1lLmNoYXJBdCgwKSA9PT0gJy8nKSxcbiAgICAgIGlzUmVsQWJzID0gKFxuICAgICAgICAgIHJlbGF0aXZlLmhvc3QgfHxcbiAgICAgICAgICByZWxhdGl2ZS5wYXRobmFtZSAmJiByZWxhdGl2ZS5wYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJ1xuICAgICAgKSxcbiAgICAgIG11c3RFbmRBYnMgPSAoaXNSZWxBYnMgfHwgaXNTb3VyY2VBYnMgfHxcbiAgICAgICAgICAgICAgICAgICAgKHJlc3VsdC5ob3N0ICYmIHJlbGF0aXZlLnBhdGhuYW1lKSksXG4gICAgICByZW1vdmVBbGxEb3RzID0gbXVzdEVuZEFicyxcbiAgICAgIHNyY1BhdGggPSByZXN1bHQucGF0aG5hbWUgJiYgcmVzdWx0LnBhdGhuYW1lLnNwbGl0KCcvJykgfHwgW10sXG4gICAgICByZWxQYXRoID0gcmVsYXRpdmUucGF0aG5hbWUgJiYgcmVsYXRpdmUucGF0aG5hbWUuc3BsaXQoJy8nKSB8fCBbXSxcbiAgICAgIHBzeWNob3RpYyA9IHJlc3VsdC5wcm90b2NvbCAmJiAhc2xhc2hlZFByb3RvY29sW3Jlc3VsdC5wcm90b2NvbF07XG5cbiAgLy8gaWYgdGhlIHVybCBpcyBhIG5vbi1zbGFzaGVkIHVybCwgdGhlbiByZWxhdGl2ZVxuICAvLyBsaW5rcyBsaWtlIC4uLy4uIHNob3VsZCBiZSBhYmxlXG4gIC8vIHRvIGNyYXdsIHVwIHRvIHRoZSBob3N0bmFtZSwgYXMgd2VsbC4gIFRoaXMgaXMgc3RyYW5nZS5cbiAgLy8gcmVzdWx0LnByb3RvY29sIGhhcyBhbHJlYWR5IGJlZW4gc2V0IGJ5IG5vdy5cbiAgLy8gTGF0ZXIgb24sIHB1dCB0aGUgZmlyc3QgcGF0aCBwYXJ0IGludG8gdGhlIGhvc3QgZmllbGQuXG4gIGlmIChwc3ljaG90aWMpIHtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSAnJztcbiAgICByZXN1bHQucG9ydCA9IG51bGw7XG4gICAgaWYgKHJlc3VsdC5ob3N0KSB7XG4gICAgICBpZiAoc3JjUGF0aFswXSA9PT0gJycpIHNyY1BhdGhbMF0gPSByZXN1bHQuaG9zdDtcbiAgICAgIGVsc2Ugc3JjUGF0aC51bnNoaWZ0KHJlc3VsdC5ob3N0KTtcbiAgICB9XG4gICAgcmVzdWx0Lmhvc3QgPSAnJztcbiAgICBpZiAocmVsYXRpdmUucHJvdG9jb2wpIHtcbiAgICAgIHJlbGF0aXZlLmhvc3RuYW1lID0gbnVsbDtcbiAgICAgIHJlbGF0aXZlLnBvcnQgPSBudWxsO1xuICAgICAgaWYgKHJlbGF0aXZlLmhvc3QpIHtcbiAgICAgICAgaWYgKHJlbFBhdGhbMF0gPT09ICcnKSByZWxQYXRoWzBdID0gcmVsYXRpdmUuaG9zdDtcbiAgICAgICAgZWxzZSByZWxQYXRoLnVuc2hpZnQocmVsYXRpdmUuaG9zdCk7XG4gICAgICB9XG4gICAgICByZWxhdGl2ZS5ob3N0ID0gbnVsbDtcbiAgICB9XG4gICAgbXVzdEVuZEFicyA9IG11c3RFbmRBYnMgJiYgKHJlbFBhdGhbMF0gPT09ICcnIHx8IHNyY1BhdGhbMF0gPT09ICcnKTtcbiAgfVxuXG4gIGlmIChpc1JlbEFicykge1xuICAgIC8vIGl0J3MgYWJzb2x1dGUuXG4gICAgcmVzdWx0Lmhvc3QgPSAocmVsYXRpdmUuaG9zdCB8fCByZWxhdGl2ZS5ob3N0ID09PSAnJykgP1xuICAgICAgICAgICAgICAgICAgcmVsYXRpdmUuaG9zdCA6IHJlc3VsdC5ob3N0O1xuICAgIHJlc3VsdC5ob3N0bmFtZSA9IChyZWxhdGl2ZS5ob3N0bmFtZSB8fCByZWxhdGl2ZS5ob3N0bmFtZSA9PT0gJycpID9cbiAgICAgICAgICAgICAgICAgICAgICByZWxhdGl2ZS5ob3N0bmFtZSA6IHJlc3VsdC5ob3N0bmFtZTtcbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICAgIHNyY1BhdGggPSByZWxQYXRoO1xuICAgIC8vIGZhbGwgdGhyb3VnaCB0byB0aGUgZG90LWhhbmRsaW5nIGJlbG93LlxuICB9IGVsc2UgaWYgKHJlbFBhdGgubGVuZ3RoKSB7XG4gICAgLy8gaXQncyByZWxhdGl2ZVxuICAgIC8vIHRocm93IGF3YXkgdGhlIGV4aXN0aW5nIGZpbGUsIGFuZCB0YWtlIHRoZSBuZXcgcGF0aCBpbnN0ZWFkLlxuICAgIGlmICghc3JjUGF0aCkgc3JjUGF0aCA9IFtdO1xuICAgIHNyY1BhdGgucG9wKCk7XG4gICAgc3JjUGF0aCA9IHNyY1BhdGguY29uY2F0KHJlbFBhdGgpO1xuICAgIHJlc3VsdC5zZWFyY2ggPSByZWxhdGl2ZS5zZWFyY2g7XG4gICAgcmVzdWx0LnF1ZXJ5ID0gcmVsYXRpdmUucXVlcnk7XG4gIH0gZWxzZSBpZiAoIWlzTnVsbE9yVW5kZWZpbmVkKHJlbGF0aXZlLnNlYXJjaCkpIHtcbiAgICAvLyBqdXN0IHB1bGwgb3V0IHRoZSBzZWFyY2guXG4gICAgLy8gbGlrZSBocmVmPSc/Zm9vJy5cbiAgICAvLyBQdXQgdGhpcyBhZnRlciB0aGUgb3RoZXIgdHdvIGNhc2VzIGJlY2F1c2UgaXQgc2ltcGxpZmllcyB0aGUgYm9vbGVhbnNcbiAgICBpZiAocHN5Y2hvdGljKSB7XG4gICAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IHNyY1BhdGguc2hpZnQoKTtcbiAgICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAgIC8vdGhpcyBlc3BlY2lhbHkgaGFwcGVucyBpbiBjYXNlcyBsaWtlXG4gICAgICAvL3VybC5yZXNvbHZlT2JqZWN0KCdtYWlsdG86bG9jYWwxQGRvbWFpbjEnLCAnbG9jYWwyQGRvbWFpbjInKVxuICAgICAgdmFyIGF1dGhJbkhvc3QgPSByZXN1bHQuaG9zdCAmJiByZXN1bHQuaG9zdC5pbmRleE9mKCdAJykgPiAwID9cbiAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lmhvc3Quc3BsaXQoJ0AnKSA6IGZhbHNlO1xuICAgICAgaWYgKGF1dGhJbkhvc3QpIHtcbiAgICAgICAgcmVzdWx0LmF1dGggPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgICAgIHJlc3VsdC5ob3N0ID0gcmVzdWx0Lmhvc3RuYW1lID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICAgIC8vdG8gc3VwcG9ydCBodHRwLnJlcXVlc3RcbiAgICBpZiAoIWlzTnVsbChyZXN1bHQucGF0aG5hbWUpIHx8ICFpc051bGwocmVzdWx0LnNlYXJjaCkpIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gKHJlc3VsdC5wYXRobmFtZSA/IHJlc3VsdC5wYXRobmFtZSA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgIChyZXN1bHQuc2VhcmNoID8gcmVzdWx0LnNlYXJjaCA6ICcnKTtcbiAgICB9XG4gICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGlmICghc3JjUGF0aC5sZW5ndGgpIHtcbiAgICAvLyBubyBwYXRoIGF0IGFsbC4gIGVhc3kuXG4gICAgLy8gd2UndmUgYWxyZWFkeSBoYW5kbGVkIHRoZSBvdGhlciBzdHVmZiBhYm92ZS5cbiAgICByZXN1bHQucGF0aG5hbWUgPSBudWxsO1xuICAgIC8vdG8gc3VwcG9ydCBodHRwLnJlcXVlc3RcbiAgICBpZiAocmVzdWx0LnNlYXJjaCkge1xuICAgICAgcmVzdWx0LnBhdGggPSAnLycgKyByZXN1bHQuc2VhcmNoO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucGF0aCA9IG51bGw7XG4gICAgfVxuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBpZiBhIHVybCBFTkRzIGluIC4gb3IgLi4sIHRoZW4gaXQgbXVzdCBnZXQgYSB0cmFpbGluZyBzbGFzaC5cbiAgLy8gaG93ZXZlciwgaWYgaXQgZW5kcyBpbiBhbnl0aGluZyBlbHNlIG5vbi1zbGFzaHksXG4gIC8vIHRoZW4gaXQgbXVzdCBOT1QgZ2V0IGEgdHJhaWxpbmcgc2xhc2guXG4gIHZhciBsYXN0ID0gc3JjUGF0aC5zbGljZSgtMSlbMF07XG4gIHZhciBoYXNUcmFpbGluZ1NsYXNoID0gKFxuICAgICAgKHJlc3VsdC5ob3N0IHx8IHJlbGF0aXZlLmhvc3QpICYmIChsYXN0ID09PSAnLicgfHwgbGFzdCA9PT0gJy4uJykgfHxcbiAgICAgIGxhc3QgPT09ICcnKTtcblxuICAvLyBzdHJpcCBzaW5nbGUgZG90cywgcmVzb2x2ZSBkb3VibGUgZG90cyB0byBwYXJlbnQgZGlyXG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBzcmNQYXRoLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICBsYXN0ID0gc3JjUGF0aFtpXTtcbiAgICBpZiAobGFzdCA9PSAnLicpIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgc3JjUGF0aC5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmICghbXVzdEVuZEFicyAmJiAhcmVtb3ZlQWxsRG90cykge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgc3JjUGF0aC51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChtdXN0RW5kQWJzICYmIHNyY1BhdGhbMF0gIT09ICcnICYmXG4gICAgICAoIXNyY1BhdGhbMF0gfHwgc3JjUGF0aFswXS5jaGFyQXQoMCkgIT09ICcvJykpIHtcbiAgICBzcmNQYXRoLnVuc2hpZnQoJycpO1xuICB9XG5cbiAgaWYgKGhhc1RyYWlsaW5nU2xhc2ggJiYgKHNyY1BhdGguam9pbignLycpLnN1YnN0cigtMSkgIT09ICcvJykpIHtcbiAgICBzcmNQYXRoLnB1c2goJycpO1xuICB9XG5cbiAgdmFyIGlzQWJzb2x1dGUgPSBzcmNQYXRoWzBdID09PSAnJyB8fFxuICAgICAgKHNyY1BhdGhbMF0gJiYgc3JjUGF0aFswXS5jaGFyQXQoMCkgPT09ICcvJyk7XG5cbiAgLy8gcHV0IHRoZSBob3N0IGJhY2tcbiAgaWYgKHBzeWNob3RpYykge1xuICAgIHJlc3VsdC5ob3N0bmFtZSA9IHJlc3VsdC5ob3N0ID0gaXNBYnNvbHV0ZSA/ICcnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyY1BhdGgubGVuZ3RoID8gc3JjUGF0aC5zaGlmdCgpIDogJyc7XG4gICAgLy9vY2NhdGlvbmFseSB0aGUgYXV0aCBjYW4gZ2V0IHN0dWNrIG9ubHkgaW4gaG9zdFxuICAgIC8vdGhpcyBlc3BlY2lhbHkgaGFwcGVucyBpbiBjYXNlcyBsaWtlXG4gICAgLy91cmwucmVzb2x2ZU9iamVjdCgnbWFpbHRvOmxvY2FsMUBkb21haW4xJywgJ2xvY2FsMkBkb21haW4yJylcbiAgICB2YXIgYXV0aEluSG9zdCA9IHJlc3VsdC5ob3N0ICYmIHJlc3VsdC5ob3N0LmluZGV4T2YoJ0AnKSA+IDAgP1xuICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lmhvc3Quc3BsaXQoJ0AnKSA6IGZhbHNlO1xuICAgIGlmIChhdXRoSW5Ib3N0KSB7XG4gICAgICByZXN1bHQuYXV0aCA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgIHJlc3VsdC5ob3N0ID0gcmVzdWx0Lmhvc3RuYW1lID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgIH1cbiAgfVxuXG4gIG11c3RFbmRBYnMgPSBtdXN0RW5kQWJzIHx8IChyZXN1bHQuaG9zdCAmJiBzcmNQYXRoLmxlbmd0aCk7XG5cbiAgaWYgKG11c3RFbmRBYnMgJiYgIWlzQWJzb2x1dGUpIHtcbiAgICBzcmNQYXRoLnVuc2hpZnQoJycpO1xuICB9XG5cbiAgaWYgKCFzcmNQYXRoLmxlbmd0aCkge1xuICAgIHJlc3VsdC5wYXRobmFtZSA9IG51bGw7XG4gICAgcmVzdWx0LnBhdGggPSBudWxsO1xuICB9IGVsc2Uge1xuICAgIHJlc3VsdC5wYXRobmFtZSA9IHNyY1BhdGguam9pbignLycpO1xuICB9XG5cbiAgLy90byBzdXBwb3J0IHJlcXVlc3QuaHR0cFxuICBpZiAoIWlzTnVsbChyZXN1bHQucGF0aG5hbWUpIHx8ICFpc051bGwocmVzdWx0LnNlYXJjaCkpIHtcbiAgICByZXN1bHQucGF0aCA9IChyZXN1bHQucGF0aG5hbWUgPyByZXN1bHQucGF0aG5hbWUgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICB9XG4gIHJlc3VsdC5hdXRoID0gcmVsYXRpdmUuYXV0aCB8fCByZXN1bHQuYXV0aDtcbiAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblVybC5wcm90b3R5cGUucGFyc2VIb3N0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBob3N0ID0gdGhpcy5ob3N0O1xuICB2YXIgcG9ydCA9IHBvcnRQYXR0ZXJuLmV4ZWMoaG9zdCk7XG4gIGlmIChwb3J0KSB7XG4gICAgcG9ydCA9IHBvcnRbMF07XG4gICAgaWYgKHBvcnQgIT09ICc6Jykge1xuICAgICAgdGhpcy5wb3J0ID0gcG9ydC5zdWJzdHIoMSk7XG4gICAgfVxuICAgIGhvc3QgPSBob3N0LnN1YnN0cigwLCBob3N0Lmxlbmd0aCAtIHBvcnQubGVuZ3RoKTtcbiAgfVxuICBpZiAoaG9zdCkgdGhpcy5ob3N0bmFtZSA9IGhvc3Q7XG59O1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09IFwic3RyaW5nXCI7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuICBhcmcgPT0gbnVsbDtcbn1cbiIsIi8qXG4gKiAgQ29weXJpZ2h0IDIwMTEgVHdpdHRlciwgSW5jLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEhvZ2FuID0ge307XG5cbihmdW5jdGlvbiAoSG9nYW4pIHtcbiAgSG9nYW4uVGVtcGxhdGUgPSBmdW5jdGlvbiAoY29kZU9iaiwgdGV4dCwgY29tcGlsZXIsIG9wdGlvbnMpIHtcbiAgICBjb2RlT2JqID0gY29kZU9iaiB8fCB7fTtcbiAgICB0aGlzLnIgPSBjb2RlT2JqLmNvZGUgfHwgdGhpcy5yO1xuICAgIHRoaXMuYyA9IGNvbXBpbGVyO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy50ZXh0ID0gdGV4dCB8fCAnJztcbiAgICB0aGlzLnBhcnRpYWxzID0gY29kZU9iai5wYXJ0aWFscyB8fCB7fTtcbiAgICB0aGlzLnN1YnMgPSBjb2RlT2JqLnN1YnMgfHwge307XG4gICAgdGhpcy5idWYgPSAnJztcbiAgfVxuXG4gIEhvZ2FuLlRlbXBsYXRlLnByb3RvdHlwZSA9IHtcbiAgICAvLyByZW5kZXI6IHJlcGxhY2VkIGJ5IGdlbmVyYXRlZCBjb2RlLlxuICAgIHI6IGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7IHJldHVybiAnJzsgfSxcblxuICAgIC8vIHZhcmlhYmxlIGVzY2FwaW5nXG4gICAgdjogaG9nYW5Fc2NhcGUsXG5cbiAgICAvLyB0cmlwbGUgc3RhY2hlXG4gICAgdDogY29lcmNlVG9TdHJpbmcsXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5yaShbY29udGV4dF0sIHBhcnRpYWxzIHx8IHt9LCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgaW50ZXJuYWwgLS0gYSBob29rIGZvciBvdmVycmlkZXMgdGhhdCBjYXRjaGVzIHBhcnRpYWxzIHRvb1xuICAgIHJpOiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgcmV0dXJuIHRoaXMucihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gZW5zdXJlUGFydGlhbFxuICAgIGVwOiBmdW5jdGlvbihzeW1ib2wsIHBhcnRpYWxzKSB7XG4gICAgICB2YXIgcGFydGlhbCA9IHRoaXMucGFydGlhbHNbc3ltYm9sXTtcblxuICAgICAgLy8gY2hlY2sgdG8gc2VlIHRoYXQgaWYgd2UndmUgaW5zdGFudGlhdGVkIHRoaXMgcGFydGlhbCBiZWZvcmVcbiAgICAgIHZhciB0ZW1wbGF0ZSA9IHBhcnRpYWxzW3BhcnRpYWwubmFtZV07XG4gICAgICBpZiAocGFydGlhbC5pbnN0YW5jZSAmJiBwYXJ0aWFsLmJhc2UgPT0gdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWwuaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGVtcGxhdGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKCF0aGlzLmMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBjb21waWxlciBhdmFpbGFibGUuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gdGhpcy5jLmNvbXBpbGUodGVtcGxhdGUsIHRoaXMub3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHVzZSB0aGlzIHRvIGNoZWNrIHdoZXRoZXIgdGhlIHBhcnRpYWxzIGRpY3Rpb25hcnkgaGFzIGNoYW5nZWRcbiAgICAgIHRoaXMucGFydGlhbHNbc3ltYm9sXS5iYXNlID0gdGVtcGxhdGU7XG5cbiAgICAgIGlmIChwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGNvbnNpZGVyIHBhcmVudCB0ZW1wbGF0ZSBub3dcbiAgICAgICAgaWYgKCFwYXJ0aWFscy5zdGFja1RleHQpIHBhcnRpYWxzLnN0YWNrVGV4dCA9IHt9O1xuICAgICAgICBmb3IgKGtleSBpbiBwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgICBpZiAoIXBhcnRpYWxzLnN0YWNrVGV4dFtrZXldKSB7XG4gICAgICAgICAgICBwYXJ0aWFscy5zdGFja1RleHRba2V5XSA9ICh0aGlzLmFjdGl2ZVN1YiAhPT0gdW5kZWZpbmVkICYmIHBhcnRpYWxzLnN0YWNrVGV4dFt0aGlzLmFjdGl2ZVN1Yl0pID8gcGFydGlhbHMuc3RhY2tUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgPSBjcmVhdGVTcGVjaWFsaXplZFBhcnRpYWwodGVtcGxhdGUsIHBhcnRpYWwuc3VicywgcGFydGlhbC5wYXJ0aWFscyxcbiAgICAgICAgICB0aGlzLnN0YWNrU3VicywgdGhpcy5zdGFja1BhcnRpYWxzLCBwYXJ0aWFscy5zdGFja1RleHQpO1xuICAgICAgfVxuICAgICAgdGhpcy5wYXJ0aWFsc1tzeW1ib2xdLmluc3RhbmNlID0gdGVtcGxhdGU7XG5cbiAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9LFxuXG4gICAgLy8gdHJpZXMgdG8gZmluZCBhIHBhcnRpYWwgaW4gdGhlIGN1cnJlbnQgc2NvcGUgYW5kIHJlbmRlciBpdFxuICAgIHJwOiBmdW5jdGlvbihzeW1ib2wsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBwYXJ0aWFsID0gdGhpcy5lcChzeW1ib2wsIHBhcnRpYWxzKTtcbiAgICAgIGlmICghcGFydGlhbCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXJ0aWFsLnJpKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgYSBzZWN0aW9uXG4gICAgcnM6IGZ1bmN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCBzZWN0aW9uKSB7XG4gICAgICB2YXIgdGFpbCA9IGNvbnRleHRbY29udGV4dC5sZW5ndGggLSAxXTtcblxuICAgICAgaWYgKCFpc0FycmF5KHRhaWwpKSB7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFpbC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb250ZXh0LnB1c2godGFpbFtpXSk7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICBjb250ZXh0LnBvcCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBtYXliZSBzdGFydCBhIHNlY3Rpb25cbiAgICBzOiBmdW5jdGlvbih2YWwsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKSB7XG4gICAgICB2YXIgcGFzcztcblxuICAgICAgaWYgKGlzQXJyYXkodmFsKSAmJiB2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSB0aGlzLm1zKHZhbCwgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpO1xuICAgICAgfVxuXG4gICAgICBwYXNzID0gISF2YWw7XG5cbiAgICAgIGlmICghaW52ZXJ0ZWQgJiYgcGFzcyAmJiBjdHgpIHtcbiAgICAgICAgY3R4LnB1c2goKHR5cGVvZiB2YWwgPT0gJ29iamVjdCcpID8gdmFsIDogY3R4W2N0eC5sZW5ndGggLSAxXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXNzO1xuICAgIH0sXG5cbiAgICAvLyBmaW5kIHZhbHVlcyB3aXRoIGRvdHRlZCBuYW1lc1xuICAgIGQ6IGZ1bmN0aW9uKGtleSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpIHtcbiAgICAgIHZhciBmb3VuZCxcbiAgICAgICAgICBuYW1lcyA9IGtleS5zcGxpdCgnLicpLFxuICAgICAgICAgIHZhbCA9IHRoaXMuZihuYW1lc1swXSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpLFxuICAgICAgICAgIGRvTW9kZWxHZXQgPSB0aGlzLm9wdGlvbnMubW9kZWxHZXQsXG4gICAgICAgICAgY3ggPSBudWxsO1xuXG4gICAgICBpZiAoa2V5ID09PSAnLicgJiYgaXNBcnJheShjdHhbY3R4Lmxlbmd0aCAtIDJdKSkge1xuICAgICAgICB2YWwgPSBjdHhbY3R4Lmxlbmd0aCAtIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZvdW5kID0gZmluZEluU2NvcGUobmFtZXNbaV0sIHZhbCwgZG9Nb2RlbEdldCk7XG4gICAgICAgICAgaWYgKGZvdW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGN4ID0gdmFsO1xuICAgICAgICAgICAgdmFsID0gZm91bmQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbCA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmV0dXJuRm91bmQgJiYgIXZhbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmV0dXJuRm91bmQgJiYgdHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGN0eC5wdXNoKGN4KTtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgICBjdHgucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIGZpbmQgdmFsdWVzIHdpdGggbm9ybWFsIG5hbWVzXG4gICAgZjogZnVuY3Rpb24oa2V5LCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCkge1xuICAgICAgdmFyIHZhbCA9IGZhbHNlLFxuICAgICAgICAgIHYgPSBudWxsLFxuICAgICAgICAgIGZvdW5kID0gZmFsc2UsXG4gICAgICAgICAgZG9Nb2RlbEdldCA9IHRoaXMub3B0aW9ucy5tb2RlbEdldDtcblxuICAgICAgZm9yICh2YXIgaSA9IGN0eC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICB2ID0gY3R4W2ldO1xuICAgICAgICB2YWwgPSBmaW5kSW5TY29wZShrZXksIHYsIGRvTW9kZWxHZXQpO1xuICAgICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICByZXR1cm4gKHJldHVybkZvdW5kKSA/IGZhbHNlIDogXCJcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXR1cm5Gb3VuZCAmJiB0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICAvLyBoaWdoZXIgb3JkZXIgdGVtcGxhdGVzXG4gICAgbHM6IGZ1bmN0aW9uKGZ1bmMsIGN4LCBwYXJ0aWFscywgdGV4dCwgdGFncykge1xuICAgICAgdmFyIG9sZFRhZ3MgPSB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycztcblxuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSB0YWdzO1xuICAgICAgdGhpcy5iKHRoaXMuY3QoY29lcmNlVG9TdHJpbmcoZnVuYy5jYWxsKGN4LCB0ZXh0KSksIGN4LCBwYXJ0aWFscykpO1xuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSBvbGRUYWdzO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8vIGNvbXBpbGUgdGV4dFxuICAgIGN0OiBmdW5jdGlvbih0ZXh0LCBjeCwgcGFydGlhbHMpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlzYWJsZUxhbWJkYSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xhbWJkYSBmZWF0dXJlcyBkaXNhYmxlZC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmMuY29tcGlsZSh0ZXh0LCB0aGlzLm9wdGlvbnMpLnJlbmRlcihjeCwgcGFydGlhbHMpO1xuICAgIH0sXG5cbiAgICAvLyB0ZW1wbGF0ZSByZXN1bHQgYnVmZmVyaW5nXG4gICAgYjogZnVuY3Rpb24ocykgeyB0aGlzLmJ1ZiArPSBzOyB9LFxuXG4gICAgZmw6IGZ1bmN0aW9uKCkgeyB2YXIgciA9IHRoaXMuYnVmOyB0aGlzLmJ1ZiA9ICcnOyByZXR1cm4gcjsgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHNlY3Rpb25cbiAgICBtczogZnVuY3Rpb24oZnVuYywgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpIHtcbiAgICAgIHZhciB0ZXh0U291cmNlLFxuICAgICAgICAgIGN4ID0gY3R4W2N0eC5sZW5ndGggLSAxXSxcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmNhbGwoY3gpO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmIChpbnZlcnRlZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRleHRTb3VyY2UgPSAodGhpcy5hY3RpdmVTdWIgJiYgdGhpcy5zdWJzVGV4dCAmJiB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSkgPyB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICByZXR1cm4gdGhpcy5scyhyZXN1bHQsIGN4LCBwYXJ0aWFscywgdGV4dFNvdXJjZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCksIHRhZ3MpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHZhcmlhYmxlXG4gICAgbXY6IGZ1bmN0aW9uKGZ1bmMsIGN0eCwgcGFydGlhbHMpIHtcbiAgICAgIHZhciBjeCA9IGN0eFtjdHgubGVuZ3RoIC0gMV07XG4gICAgICB2YXIgcmVzdWx0ID0gZnVuYy5jYWxsKGN4KTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gdGhpcy5jdChjb2VyY2VUb1N0cmluZyhyZXN1bHQuY2FsbChjeCkpLCBjeCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICBzdWI6IGZ1bmN0aW9uKG5hbWUsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBmID0gdGhpcy5zdWJzW25hbWVdO1xuICAgICAgaWYgKGYpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVTdWIgPSBuYW1lO1xuICAgICAgICBmKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzLCBpbmRlbnQpO1xuICAgICAgICB0aGlzLmFjdGl2ZVN1YiA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICB9O1xuXG4gIC8vRmluZCBhIGtleSBpbiBhbiBvYmplY3RcbiAgZnVuY3Rpb24gZmluZEluU2NvcGUoa2V5LCBzY29wZSwgZG9Nb2RlbEdldCkge1xuICAgIHZhciB2YWw7XG5cbiAgICBpZiAoc2NvcGUgJiYgdHlwZW9mIHNjb3BlID09ICdvYmplY3QnKSB7XG5cbiAgICAgIGlmIChzY29wZVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFsID0gc2NvcGVba2V5XTtcblxuICAgICAgLy8gdHJ5IGxvb2t1cCB3aXRoIGdldCBmb3IgYmFja2JvbmUgb3Igc2ltaWxhciBtb2RlbCBkYXRhXG4gICAgICB9IGVsc2UgaWYgKGRvTW9kZWxHZXQgJiYgc2NvcGUuZ2V0ICYmIHR5cGVvZiBzY29wZS5nZXQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSBzY29wZS5nZXQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3BlY2lhbGl6ZWRQYXJ0aWFsKGluc3RhbmNlLCBzdWJzLCBwYXJ0aWFscywgc3RhY2tTdWJzLCBzdGFja1BhcnRpYWxzLCBzdGFja1RleHQpIHtcbiAgICBmdW5jdGlvbiBQYXJ0aWFsVGVtcGxhdGUoKSB7fTtcbiAgICBQYXJ0aWFsVGVtcGxhdGUucHJvdG90eXBlID0gaW5zdGFuY2U7XG4gICAgZnVuY3Rpb24gU3Vic3RpdHV0aW9ucygpIHt9O1xuICAgIFN1YnN0aXR1dGlvbnMucHJvdG90eXBlID0gaW5zdGFuY2Uuc3VicztcbiAgICB2YXIga2V5O1xuICAgIHZhciBwYXJ0aWFsID0gbmV3IFBhcnRpYWxUZW1wbGF0ZSgpO1xuICAgIHBhcnRpYWwuc3VicyA9IG5ldyBTdWJzdGl0dXRpb25zKCk7XG4gICAgcGFydGlhbC5zdWJzVGV4dCA9IHt9OyAgLy9oZWhlLiBzdWJzdGV4dC5cbiAgICBwYXJ0aWFsLmJ1ZiA9ICcnO1xuXG4gICAgc3RhY2tTdWJzID0gc3RhY2tTdWJzIHx8IHt9O1xuICAgIHBhcnRpYWwuc3RhY2tTdWJzID0gc3RhY2tTdWJzO1xuICAgIHBhcnRpYWwuc3Vic1RleHQgPSBzdGFja1RleHQ7XG4gICAgZm9yIChrZXkgaW4gc3Vicykge1xuICAgICAgaWYgKCFzdGFja1N1YnNba2V5XSkgc3RhY2tTdWJzW2tleV0gPSBzdWJzW2tleV07XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHN0YWNrU3Vicykge1xuICAgICAgcGFydGlhbC5zdWJzW2tleV0gPSBzdGFja1N1YnNba2V5XTtcbiAgICB9XG5cbiAgICBzdGFja1BhcnRpYWxzID0gc3RhY2tQYXJ0aWFscyB8fCB7fTtcbiAgICBwYXJ0aWFsLnN0YWNrUGFydGlhbHMgPSBzdGFja1BhcnRpYWxzO1xuICAgIGZvciAoa2V5IGluIHBhcnRpYWxzKSB7XG4gICAgICBpZiAoIXN0YWNrUGFydGlhbHNba2V5XSkgc3RhY2tQYXJ0aWFsc1trZXldID0gcGFydGlhbHNba2V5XTtcbiAgICB9XG4gICAgZm9yIChrZXkgaW4gc3RhY2tQYXJ0aWFscykge1xuICAgICAgcGFydGlhbC5wYXJ0aWFsc1trZXldID0gc3RhY2tQYXJ0aWFsc1trZXldO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJ0aWFsO1xuICB9XG5cbiAgdmFyIHJBbXAgPSAvJi9nLFxuICAgICAgckx0ID0gLzwvZyxcbiAgICAgIHJHdCA9IC8+L2csXG4gICAgICByQXBvcyA9IC9cXCcvZyxcbiAgICAgIHJRdW90ID0gL1xcXCIvZyxcbiAgICAgIGhDaGFycyA9IC9bJjw+XFxcIlxcJ10vO1xuXG4gIGZ1bmN0aW9uIGNvZXJjZVRvU3RyaW5nKHZhbCkge1xuICAgIHJldHVybiBTdHJpbmcoKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHZhbCk7XG4gIH1cblxuICBmdW5jdGlvbiBob2dhbkVzY2FwZShzdHIpIHtcbiAgICBzdHIgPSBjb2VyY2VUb1N0cmluZyhzdHIpO1xuICAgIHJldHVybiBoQ2hhcnMudGVzdChzdHIpID9cbiAgICAgIHN0clxuICAgICAgICAucmVwbGFjZShyQW1wLCAnJmFtcDsnKVxuICAgICAgICAucmVwbGFjZShyTHQsICcmbHQ7JylcbiAgICAgICAgLnJlcGxhY2Uockd0LCAnJmd0OycpXG4gICAgICAgIC5yZXBsYWNlKHJBcG9zLCAnJiMzOTsnKVxuICAgICAgICAucmVwbGFjZShyUXVvdCwgJyZxdW90OycpIDpcbiAgICAgIHN0cjtcbiAgfVxuXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihhKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxufSkodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnID8gZXhwb3J0cyA6IEhvZ2FuKTtcbiIsIihmdW5jdGlvbiAoJCkge1xuXG4gICQuZm4uY3VzdG9tU2Nyb2xsYmFyID0gZnVuY3Rpb24gKG9wdGlvbnMsIGFyZ3MpIHtcblxuICAgIHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIHNraW46IHVuZGVmaW5lZCxcbiAgICAgIGhTY3JvbGw6IHRydWUsXG4gICAgICB2U2Nyb2xsOiB0cnVlLFxuICAgICAgdXBkYXRlT25XaW5kb3dSZXNpemU6IGZhbHNlLFxuICAgICAgYW5pbWF0aW9uU3BlZWQ6IDMwMCxcbiAgICAgIG9uQ3VzdG9tU2Nyb2xsOiB1bmRlZmluZWQsXG4gICAgICBzd2lwZVNwZWVkOiAxLFxuICAgICAgd2hlZWxTcGVlZDogNDAsXG4gICAgICBmaXhlZFRodW1iV2lkdGg6IHVuZGVmaW5lZCxcbiAgICAgIGZpeGVkVGh1bWJIZWlnaHQ6IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIHZhciBTY3JvbGxhYmxlID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgIHRoaXMuYWRkU2Nyb2xsYWJsZUNsYXNzKCk7XG4gICAgICB0aGlzLmFkZFNraW5DbGFzcygpO1xuICAgICAgdGhpcy5hZGRTY3JvbGxCYXJDb21wb25lbnRzKCk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnZTY3JvbGwpXG4gICAgICAgIHRoaXMudlNjcm9sbGJhciA9IG5ldyBTY3JvbGxiYXIodGhpcywgbmV3IFZTaXppbmcoKSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmhTY3JvbGwpXG4gICAgICAgIHRoaXMuaFNjcm9sbGJhciA9IG5ldyBTY3JvbGxiYXIodGhpcywgbmV3IEhTaXppbmcoKSk7XG4gICAgICB0aGlzLiRlbGVtZW50LmRhdGEoXCJzY3JvbGxhYmxlXCIsIHRoaXMpO1xuICAgICAgdGhpcy5pbml0S2V5Ym9hcmRTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH1cblxuICAgIFNjcm9sbGFibGUucHJvdG90eXBlID0ge1xuXG4gICAgICBhZGRTY3JvbGxhYmxlQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKFwic2Nyb2xsYWJsZVwiKSkge1xuICAgICAgICAgIHRoaXMuc2Nyb2xsYWJsZUFkZGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKFwic2Nyb2xsYWJsZVwiKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlU2Nyb2xsYWJsZUNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbGFibGVBZGRlZClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKFwic2Nyb2xsYWJsZVwiKTtcbiAgICAgIH0sXG5cbiAgICAgIGFkZFNraW5DbGFzczogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHlwZW9mKHRoaXMub3B0aW9ucy5za2luKSA9PSBcInN0cmluZ1wiICYmICF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5za2luKSkge1xuICAgICAgICAgIHRoaXMuc2tpbkNsYXNzQWRkZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnNraW4pO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTa2luQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2tpbkNsYXNzQWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuc2tpbik7XG4gICAgICB9LFxuXG4gICAgICBhZGRTY3JvbGxCYXJDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYXNzaWduVmlld1BvcnQoKTtcbiAgICAgICAgaWYgKHRoaXMuJHZpZXdQb3J0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC53cmFwSW5uZXIoXCI8ZGl2IGNsYXNzPVxcXCJ2aWV3cG9ydFxcXCIgLz5cIik7XG4gICAgICAgICAgdGhpcy5hc3NpZ25WaWV3UG9ydCgpO1xuICAgICAgICAgIHRoaXMudmlld1BvcnRBZGRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hc3NpZ25PdmVydmlldygpO1xuICAgICAgICBpZiAodGhpcy4kb3ZlcnZpZXcubGVuZ3RoID09IDApIHtcbiAgICAgICAgICB0aGlzLiR2aWV3UG9ydC53cmFwSW5uZXIoXCI8ZGl2IGNsYXNzPVxcXCJvdmVydmlld1xcXCIgLz5cIik7XG4gICAgICAgICAgdGhpcy5hc3NpZ25PdmVydmlldygpO1xuICAgICAgICAgIHRoaXMub3ZlcnZpZXdBZGRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGRTY3JvbGxCYXIoXCJ2ZXJ0aWNhbFwiLCBcInByZXBlbmRcIik7XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsQmFyKFwiaG9yaXpvbnRhbFwiLCBcImFwcGVuZFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNjcm9sbGJhckNvbXBvbmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxiYXIoXCJ2ZXJ0aWNhbFwiKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxiYXIoXCJob3Jpem9udGFsXCIpO1xuICAgICAgICBpZiAodGhpcy5vdmVydmlld0FkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudW53cmFwKCk7XG4gICAgICAgIGlmICh0aGlzLnZpZXdQb3J0QWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC51bndyYXAoKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNjcm9sbGJhcjogZnVuY3Rpb24gKG9yaWVudGF0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzW29yaWVudGF0aW9uICsgXCJTY3JvbGxiYXJBZGRlZFwiXSlcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LmZpbmQoXCIuc2Nyb2xsLWJhci5cIiArIG9yaWVudGF0aW9uKS5yZW1vdmUoKTtcbiAgICAgIH0sXG5cbiAgICAgIGFzc2lnblZpZXdQb3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJHZpZXdQb3J0ID0gdGhpcy4kZWxlbWVudC5maW5kKFwiLnZpZXdwb3J0XCIpO1xuICAgICAgfSxcblxuICAgICAgYXNzaWduT3ZlcnZpZXc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kb3ZlcnZpZXcgPSB0aGlzLiR2aWV3UG9ydC5maW5kKFwiLm92ZXJ2aWV3XCIpO1xuICAgICAgfSxcblxuICAgICAgYWRkU2Nyb2xsQmFyOiBmdW5jdGlvbiAob3JpZW50YXRpb24sIGZ1bikge1xuICAgICAgICBpZiAodGhpcy4kZWxlbWVudC5maW5kKFwiLnNjcm9sbC1iYXIuXCIgKyBvcmllbnRhdGlvbikubGVuZ3RoID09IDApIHtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50W2Z1bl0oXCI8ZGl2IGNsYXNzPSdzY3JvbGwtYmFyIFwiICsgb3JpZW50YXRpb24gKyBcIic+PGRpdiBjbGFzcz0ndGh1bWInPjwvZGl2PjwvZGl2PlwiKVxuICAgICAgICAgIHRoaXNbb3JpZW50YXRpb24gKyBcIlNjcm9sbGJhckFkZGVkXCJdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVzaXplOiBmdW5jdGlvbiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy52U2Nyb2xsYmFyLnJlc2l6ZShrZWVwUG9zaXRpb24pO1xuICAgICAgICBpZiAodGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMuaFNjcm9sbGJhci5yZXNpemUoa2VlcFBvc2l0aW9uKTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5zY3JvbGxUb0VsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnNjcm9sbFRvRWxlbWVudChlbGVtZW50KTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvWFk6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9YKHgpO1xuICAgICAgICB0aGlzLnNjcm9sbFRvWSh5KTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvWDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIuc2Nyb2xsT3ZlcnZpZXdUbyh4LCB0cnVlKTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvWTogZnVuY3Rpb24gKHkpIHtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIuc2Nyb2xsT3ZlcnZpZXdUbyh5LCB0cnVlKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbGFibGVDbGFzcygpO1xuICAgICAgICB0aGlzLnJlbW92ZVNraW5DbGFzcygpO1xuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbGJhckNvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5kYXRhKFwic2Nyb2xsYWJsZVwiLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVLZXlib2FyZFNjcm9sbGluZygpO1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5yZW1vdmUoKTtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICB9LFxuXG4gICAgICBzZXRBbmltYXRpb25TcGVlZDogZnVuY3Rpb24gKHNwZWVkKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5hbmltYXRpb25TcGVlZCA9IHNwZWVkO1xuICAgICAgfSxcblxuICAgICAgaXNJbnNpZGU6IGZ1bmN0aW9uIChlbGVtZW50LCB3cmFwcGluZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgdmFyICR3cmFwcGluZ0VsZW1lbnQgPSAkKHdyYXBwaW5nRWxlbWVudCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciB3cmFwcGluZ0VsZW1lbnRPZmZzZXQgPSAkd3JhcHBpbmdFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICByZXR1cm4gKGVsZW1lbnRPZmZzZXQudG9wID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3ApICYmIChlbGVtZW50T2Zmc2V0LmxlZnQgPj0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQpICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQudG9wICsgJGVsZW1lbnQuaGVpZ2h0KCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LnRvcCArICR3cmFwcGluZ0VsZW1lbnQuaGVpZ2h0KCkpICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQubGVmdCArICRlbGVtZW50LndpZHRoKCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQgKyAkd3JhcHBpbmdFbGVtZW50LndpZHRoKCkpXG4gICAgICB9LFxuXG4gICAgICBpbml0S2V5Ym9hcmRTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB0aGlzLmVsZW1lbnRLZXlkb3duID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IF90aGlzLiRlbGVtZW50WzBdKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICAgICAgX3RoaXMudlNjcm9sbGJhci5rZXlTY3JvbGwoZXZlbnQpO1xuICAgICAgICAgICAgaWYgKF90aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgICAgIF90aGlzLmhTY3JvbGxiYXIua2V5U2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgICAgLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAgICAgICAua2V5ZG93bih0aGlzLmVsZW1lbnRLZXlkb3duKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUtleWJvYXJkU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgICAucmVtb3ZlQXR0cigndGFiaW5kZXgnKVxuICAgICAgICAgIC51bmJpbmQoXCJrZXlkb3duXCIsIHRoaXMuZWxlbWVudEtleWRvd24pO1xuICAgICAgfSxcblxuICAgICAgYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm9uQ3VzdG9tU2Nyb2xsKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQub24oXCJjdXN0b21TY3JvbGxcIiwgdGhpcy5vcHRpb25zLm9uQ3VzdG9tU2Nyb2xsKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHZhciBTY3JvbGxiYXIgPSBmdW5jdGlvbiAoc2Nyb2xsYWJsZSwgc2l6aW5nKSB7XG4gICAgICB0aGlzLnNjcm9sbGFibGUgPSBzY3JvbGxhYmxlO1xuICAgICAgdGhpcy5zaXppbmcgPSBzaXppbmdcbiAgICAgIHRoaXMuJHNjcm9sbEJhciA9IHRoaXMuc2l6aW5nLnNjcm9sbEJhcih0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQpO1xuICAgICAgdGhpcy4kdGh1bWIgPSB0aGlzLiRzY3JvbGxCYXIuZmluZChcIi50aHVtYlwiKTtcbiAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24oMCwgMCk7XG4gICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgICAgdGhpcy5pbml0TW91c2VNb3ZlU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmluaXRNb3VzZVdoZWVsU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmluaXRUb3VjaFNjcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0TW91c2VDbGlja1Njcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0V2luZG93UmVzaXplKCk7XG4gICAgfVxuXG4gICAgU2Nyb2xsYmFyLnByb3RvdHlwZSA9IHtcblxuICAgICAgcmVzaXplOiBmdW5jdGlvbiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQuaGVpZ2h0KHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudC5oZWlnaHQoKSk7XG4gICAgICAgIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCwgdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQpKTtcbiAgICAgICAgdGhpcy52aWV3UG9ydFNpemUgPSB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQpO1xuICAgICAgICB0aGlzLm92ZXJ2aWV3U2l6ZSA9IHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldyk7XG4gICAgICAgIHRoaXMucmF0aW8gPSB0aGlzLnZpZXdQb3J0U2l6ZSAvIHRoaXMub3ZlcnZpZXdTaXplO1xuICAgICAgICB0aGlzLnNpemluZy5zaXplKHRoaXMuJHNjcm9sbEJhciwgdGhpcy52aWV3UG9ydFNpemUpO1xuICAgICAgICB0aGlzLnRodW1iU2l6ZSA9IHRoaXMuY2FsY3VsYXRlVGh1bWJTaXplKCk7XG4gICAgICAgIHRoaXMuc2l6aW5nLnNpemUodGhpcy4kdGh1bWIsIHRoaXMudGh1bWJTaXplKTtcbiAgICAgICAgdGhpcy5tYXhUaHVtYlBvc2l0aW9uID0gdGhpcy5jYWxjdWxhdGVNYXhUaHVtYlBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMuY2FsY3VsYXRlTWF4T3ZlcnZpZXdQb3NpdGlvbigpO1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSAodGhpcy5vdmVydmlld1NpemUgPiB0aGlzLnZpZXdQb3J0U2l6ZSk7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFBlcmNlbnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSAwLjA7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZWQpXG4gICAgICAgICAgdGhpcy5yZXNjcm9sbChrZWVwUG9zaXRpb24pO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgdGhpcy4kc2Nyb2xsQmFyLnRvZ2dsZSh0aGlzLmVuYWJsZWQpO1xuICAgICAgfSxcblxuICAgICAgY2FsY3VsYXRlVGh1bWJTaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBmaXhlZFNpemUgPSB0aGlzLnNpemluZy5maXhlZFRodW1iU2l6ZSh0aGlzLnNjcm9sbGFibGUub3B0aW9ucylcbiAgICAgICAgdmFyIHNpemU7XG4gICAgICAgIGlmIChmaXhlZFNpemUpXG4gICAgICAgICAgc2l6ZSA9IGZpeGVkU2l6ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNpemUgPSB0aGlzLnJhdGlvICogdGhpcy52aWV3UG9ydFNpemVcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KHNpemUsIHRoaXMuc2l6aW5nLm1pblNpemUodGhpcy4kdGh1bWIpKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy4kdGh1bWIubW91c2Vkb3duKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGlmIChfdGhpcy5lbmFibGVkKVxuICAgICAgICAgICAgX3RoaXMuc3RhcnRNb3VzZU1vdmVTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kb2N1bWVudE1vdXNldXAgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBfdGhpcy5zdG9wTW91c2VNb3ZlU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgfTtcbiAgICAgICAgJChkb2N1bWVudCkubW91c2V1cCh0aGlzLmRvY3VtZW50TW91c2V1cCk7XG4gICAgICAgIHRoaXMuZG9jdW1lbnRNb3VzZW1vdmUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBfdGhpcy5tb3VzZU1vdmVTY3JvbGwoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICAkKGRvY3VtZW50KS5tb3VzZW1vdmUodGhpcy5kb2N1bWVudE1vdXNlbW92ZSk7XG4gICAgICAgIHRoaXMuJHRodW1iLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZU1vdXNlTW92ZVNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiR0aHVtYi51bmJpbmQoKTtcbiAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKFwibW91c2V1cFwiLCB0aGlzLmRvY3VtZW50TW91c2V1cCk7XG4gICAgICAgICQoZG9jdW1lbnQpLnVuYmluZChcIm1vdXNlbW92ZVwiLCB0aGlzLmRvY3VtZW50TW91c2Vtb3ZlKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRNb3VzZVdoZWVsU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudC5tb3VzZXdoZWVsKGZ1bmN0aW9uIChldmVudCwgZGVsdGEsIGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgICAgaWYgKF90aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5tb3VzZVdoZWVsU2Nyb2xsKGRlbHRhWCwgZGVsdGFZKSkge1xuICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlTW91c2VXaGVlbFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQudW5iaW5kKFwibW91c2V3aGVlbFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgdGhpcy5lbGVtZW50VG91Y2hzdGFydCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLmVuYWJsZWQpXG4gICAgICAgICAgICAgIF90aGlzLnN0YXJ0VG91Y2hTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0uYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdGhpcy5lbGVtZW50VG91Y2hzdGFydCk7XG4gICAgICAgICAgdGhpcy5kb2N1bWVudFRvdWNobW92ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgX3RoaXMudG91Y2hTY3JvbGwoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIHRoaXMuZG9jdW1lbnRUb3VjaG1vdmUpO1xuICAgICAgICAgIHRoaXMuZWxlbWVudFRvdWNoZW5kID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBfdGhpcy5zdG9wVG91Y2hTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0uYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRoaXMuZWxlbWVudFRvdWNoZW5kKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlVG91Y2hTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdGhpcy5lbGVtZW50VG91Y2hzdGFydCk7XG4gICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLmRvY3VtZW50VG91Y2htb3ZlKTtcbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRoaXMuZWxlbWVudFRvdWNoZW5kKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaW5pdE1vdXNlQ2xpY2tTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5zY3JvbGxCYXJDbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIF90aGlzLm1vdXNlQ2xpY2tTY3JvbGwoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLiRzY3JvbGxCYXIuY2xpY2sodGhpcy5zY3JvbGxCYXJDbGljayk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVNb3VzZUNsaWNrU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJHNjcm9sbEJhci51bmJpbmQoXCJjbGlja1wiLCB0aGlzLnNjcm9sbEJhckNsaWNrKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRXaW5kb3dSZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLnVwZGF0ZU9uV2luZG93UmVzaXplKSB7XG4gICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICB0aGlzLndpbmRvd1Jlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLnJlc2l6ZSgpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZSh0aGlzLndpbmRvd1Jlc2l6ZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVdpbmRvd1Jlc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHdpbmRvdykudW5iaW5kKFwicmVzaXplXCIsIHRoaXMud2luZG93UmVzaXplKTtcbiAgICAgIH0sXG5cbiAgICAgIGlzS2V5U2Nyb2xsaW5nOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmtleVNjcm9sbERlbHRhKGtleSkgIT0gbnVsbDtcbiAgICAgIH0sXG5cbiAgICAgIGtleVNjcm9sbERlbHRhOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGZvciAodmFyIHNjcm9sbGluZ0tleSBpbiB0aGlzLnNpemluZy5zY3JvbGxpbmdLZXlzKVxuICAgICAgICAgIGlmIChzY3JvbGxpbmdLZXkgPT0ga2V5KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2l6aW5nLnNjcm9sbGluZ0tleXNba2V5XSh0aGlzLnZpZXdQb3J0U2l6ZSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSxcblxuICAgICAgc3RhcnRNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0aGlzLm1vdXNlTW92ZVNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICQoXCJodG1sXCIpLmFkZENsYXNzKFwibm90LXNlbGVjdGFibGVcIik7XG4gICAgICAgIHRoaXMuc2V0VW5zZWxlY3RhYmxlKCQoXCJodG1sXCIpLCBcIm9uXCIpO1xuICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50KTtcbiAgICAgIH0sXG5cbiAgICAgIHN0b3BNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0aGlzLm1vdXNlTW92ZVNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAkKFwiaHRtbFwiKS5yZW1vdmVDbGFzcyhcIm5vdC1zZWxlY3RhYmxlXCIpO1xuICAgICAgICB0aGlzLnNldFVuc2VsZWN0YWJsZSgkKFwiaHRtbFwiKSwgbnVsbCk7XG4gICAgICB9LFxuXG4gICAgICBzZXRVbnNlbGVjdGFibGU6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZSkge1xuICAgICAgICBpZiAoZWxlbWVudC5hdHRyKFwidW5zZWxlY3RhYmxlXCIpICE9IHZhbHVlKSB7XG4gICAgICAgICAgZWxlbWVudC5hdHRyKFwidW5zZWxlY3RhYmxlXCIsIHZhbHVlKTtcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJzpub3QoaW5wdXQpJykuYXR0cigndW5zZWxlY3RhYmxlJywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBtb3VzZU1vdmVTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAodGhpcy5tb3VzZU1vdmVTY3JvbGxpbmcpIHtcbiAgICAgICAgICB2YXIgZGVsdGEgPSB0aGlzLnNpemluZy5tb3VzZURlbHRhKHRoaXMuc2Nyb2xsRXZlbnQsIGV2ZW50KTtcbiAgICAgICAgICB0aGlzLnNjcm9sbFRodW1iQnkoZGVsdGEpO1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsRXZlbnQoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBzdGFydFRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsRXZlbnQoZXZlbnQudG91Y2hlc1swXSk7XG4gICAgICAgICAgdGhpcy50b3VjaFNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHRvdWNoU2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudG91Y2hTY3JvbGxpbmcgJiYgZXZlbnQudG91Y2hlcyAmJiBldmVudC50b3VjaGVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgdmFyIGRlbHRhID0gLXRoaXMuc2l6aW5nLm1vdXNlRGVsdGEodGhpcy5zY3JvbGxFdmVudCwgZXZlbnQudG91Y2hlc1swXSkgKiB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy5zd2lwZVNwZWVkO1xuICAgICAgICAgIHZhciBzY3JvbGxlZCA9IHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeShkZWx0YSk7XG4gICAgICAgICAgaWYgKHNjcm9sbGVkKSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50LnRvdWNoZXNbMF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc3RvcFRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy50b3VjaFNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlV2hlZWxTY3JvbGw6IGZ1bmN0aW9uIChkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICB2YXIgZGVsdGEgPSAtdGhpcy5zaXppbmcud2hlZWxEZWx0YShkZWx0YVgsIGRlbHRhWSkgKiB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy53aGVlbFNwZWVkO1xuICAgICAgICBpZiAoZGVsdGEgIT0gMClcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxPdmVydmlld0J5KGRlbHRhKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlQ2xpY2tTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgZGVsdGEgPSB0aGlzLnZpZXdQb3J0U2l6ZSAtIDIwO1xuICAgICAgICBpZiAoZXZlbnRbXCJwYWdlXCIgKyB0aGlzLnNpemluZy5zY3JvbGxBeGlzKCldIDwgdGhpcy4kdGh1bWIub2Zmc2V0KClbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldKVxuICAgICAgICAvLyBtb3VzZSBjbGljayBvdmVyIHRodW1iXG4gICAgICAgICAgZGVsdGEgPSAtZGVsdGE7XG4gICAgICAgIHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeShkZWx0YSk7XG4gICAgICB9LFxuXG4gICAgICBrZXlTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIga2V5RG93biA9IGV2ZW50LndoaWNoO1xuICAgICAgICBpZiAodGhpcy5lbmFibGVkICYmIHRoaXMuaXNLZXlTY3JvbGxpbmcoa2V5RG93bikpIHtcbiAgICAgICAgICBpZiAodGhpcy5zY3JvbGxPdmVydmlld0J5KHRoaXMua2V5U2Nyb2xsRGVsdGEoa2V5RG93bikpKVxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVGh1bWJCeTogZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy50aHVtYlBvc2l0aW9uKCk7XG4gICAgICAgIHRodW1iUG9zaXRpb24gKz0gZGVsdGE7XG4gICAgICAgIHRodW1iUG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uT3JNYXgodGh1bWJQb3NpdGlvbiwgdGhpcy5tYXhUaHVtYlBvc2l0aW9uKTtcbiAgICAgICAgdmFyIG9sZFNjcm9sbFBlcmNlbnQgPSB0aGlzLnNjcm9sbFBlcmNlbnQ7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IHRodW1iUG9zaXRpb24gLyB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gKHRodW1iUG9zaXRpb24gKiB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24pIC8gdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICBpZiAob2xkU2Nyb2xsUGVyY2VudCAhPSB0aGlzLnNjcm9sbFBlcmNlbnQpIHtcbiAgICAgICAgICB0aGlzLnRyaWdnZXJDdXN0b21TY3JvbGwob2xkU2Nyb2xsUGVyY2VudCk7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcblxuICAgICAgdGh1bWJQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kdGh1bWIucG9zaXRpb24oKVt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV07XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxPdmVydmlld0J5OiBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICAgICAgdmFyIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLm92ZXJ2aWV3UG9zaXRpb24oKSArIGRlbHRhO1xuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxPdmVydmlld1RvKG92ZXJ2aWV3UG9zaXRpb24sIGZhbHNlKTtcbiAgICAgIH0sXG5cbiAgICAgIG92ZXJ2aWV3UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIC10aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3LnBvc2l0aW9uKClbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsT3ZlcnZpZXdUbzogZnVuY3Rpb24gKG92ZXJ2aWV3UG9zaXRpb24sIGFuaW1hdGUpIHtcbiAgICAgICAgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25Pck1heChvdmVydmlld1Bvc2l0aW9uLCB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24pO1xuICAgICAgICB2YXIgb2xkU2Nyb2xsUGVyY2VudCA9IHRoaXMuc2Nyb2xsUGVyY2VudDtcbiAgICAgICAgdGhpcy5zY3JvbGxQZXJjZW50ID0gb3ZlcnZpZXdQb3NpdGlvbiAvIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbjtcbiAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgIGlmIChhbmltYXRlKVxuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb25XaXRoQW5pbWF0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgaWYgKG9sZFNjcm9sbFBlcmNlbnQgIT0gdGhpcy5zY3JvbGxQZXJjZW50KSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tU2Nyb2xsKG9sZFNjcm9sbFBlcmNlbnQpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuXG4gICAgICBwb3NpdGlvbk9yTWF4OiBmdW5jdGlvbiAocCwgbWF4KSB7XG4gICAgICAgIGlmIChwIDwgMClcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgZWxzZSBpZiAocCA+IG1heClcbiAgICAgICAgICByZXR1cm4gbWF4O1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIHA7XG4gICAgICB9LFxuXG4gICAgICB0cmlnZ2VyQ3VzdG9tU2Nyb2xsOiBmdW5jdGlvbiAob2xkU2Nyb2xsUGVyY2VudCkge1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQudHJpZ2dlcihcImN1c3RvbVNjcm9sbFwiLCB7XG4gICAgICAgICAgICBzY3JvbGxBeGlzOiB0aGlzLnNpemluZy5zY3JvbGxBeGlzKCksXG4gICAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuc2l6aW5nLnNjcm9sbERpcmVjdGlvbihvbGRTY3JvbGxQZXJjZW50LCB0aGlzLnNjcm9sbFBlcmNlbnQpLFxuICAgICAgICAgICAgc2Nyb2xsUGVyY2VudDogdGhpcy5zY3JvbGxQZXJjZW50ICogMTAwXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSxcblxuICAgICAgcmVzY3JvbGw6IGZ1bmN0aW9uIChrZWVwUG9zaXRpb24pIHtcbiAgICAgICAgaWYgKGtlZXBQb3NpdGlvbikge1xuICAgICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gdGhpcy5wb3NpdGlvbk9yTWF4KHRoaXMub3ZlcnZpZXdQb3NpdGlvbigpLCB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24pO1xuICAgICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IG92ZXJ2aWV3UG9zaXRpb24gLyB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb247XG4gICAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB2YXIgdGh1bWJQb3NpdGlvbiA9IHRoaXMuc2Nyb2xsUGVyY2VudCAqIHRoaXMubWF4VGh1bWJQb3NpdGlvbjtcbiAgICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMuc2Nyb2xsUGVyY2VudCAqIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbjtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBzZXRTY3JvbGxQb3NpdGlvbjogZnVuY3Rpb24gKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy4kdGh1bWIuY3NzKHRoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpLCB0aHVtYlBvc2l0aW9uICsgXCJweFwiKTtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldy5jc3ModGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCksIC1vdmVydmlld1Bvc2l0aW9uICsgXCJweFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIHNldFNjcm9sbFBvc2l0aW9uV2l0aEFuaW1hdGlvbjogZnVuY3Rpb24gKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pIHtcbiAgICAgICAgdmFyIHRodW1iQW5pbWF0aW9uT3B0cyA9IHt9O1xuICAgICAgICB2YXIgb3ZlcnZpZXdBbmltYXRpb25PcHRzID0ge307XG4gICAgICAgIHRodW1iQW5pbWF0aW9uT3B0c1t0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0gPSB0aHVtYlBvc2l0aW9uICsgXCJweFwiO1xuICAgICAgICB0aGlzLiR0aHVtYi5hbmltYXRlKHRodW1iQW5pbWF0aW9uT3B0cywgdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMuYW5pbWF0aW9uU3BlZWQpO1xuICAgICAgICBvdmVydmlld0FuaW1hdGlvbk9wdHNbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldID0gLW92ZXJ2aWV3UG9zaXRpb24gKyBcInB4XCI7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcuYW5pbWF0ZShvdmVydmlld0FuaW1hdGlvbk9wdHMsIHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLmFuaW1hdGlvblNwZWVkKTtcbiAgICAgIH0sXG5cbiAgICAgIGNhbGN1bGF0ZU1heFRodW1iUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6aW5nLnNpemUodGhpcy4kc2Nyb2xsQmFyKSAtIHRoaXMudGh1bWJTaXplO1xuICAgICAgfSxcblxuICAgICAgY2FsY3VsYXRlTWF4T3ZlcnZpZXdQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3KSAtIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCk7XG4gICAgICB9LFxuXG4gICAgICBzZXRTY3JvbGxFdmVudDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBhdHRyID0gXCJwYWdlXCIgKyB0aGlzLnNpemluZy5zY3JvbGxBeGlzKCk7XG4gICAgICAgIGlmICghdGhpcy5zY3JvbGxFdmVudCB8fCB0aGlzLnNjcm9sbEV2ZW50W2F0dHJdICE9IGV2ZW50W2F0dHJdKVxuICAgICAgICAgIHRoaXMuc2Nyb2xsRXZlbnQgPSB7cGFnZVg6IGV2ZW50LnBhZ2VYLCBwYWdlWTogZXZlbnQucGFnZVl9O1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVG9FbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgICBpZiAodGhpcy5zaXppbmcuaXNJbnNpZGUoJGVsZW1lbnQsIHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcpICYmICF0aGlzLnNpemluZy5pc0luc2lkZSgkZWxlbWVudCwgdGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCkpIHtcbiAgICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICAgIHZhciBvdmVydmlld09mZnNldCA9IHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcub2Zmc2V0KCk7XG4gICAgICAgICAgdmFyIHZpZXdQb3J0T2Zmc2V0ID0gdGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydC5vZmZzZXQoKTtcbiAgICAgICAgICB0aGlzLnNjcm9sbE92ZXJ2aWV3VG8oZWxlbWVudE9mZnNldFt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0gLSBvdmVydmlld09mZnNldFt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0sIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVNb3VzZU1vdmVTY3JvbGxpbmcoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVNb3VzZVdoZWVsU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlVG91Y2hTY3JvbGxpbmcoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVNb3VzZUNsaWNrU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlV2luZG93UmVzaXplKCk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgSFNpemluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9XG5cbiAgICBIU2l6aW5nLnByb3RvdHlwZSA9IHtcbiAgICAgIHNpemU6IGZ1bmN0aW9uICgkZWwsIGFyZykge1xuICAgICAgICBpZiAoYXJnKVxuICAgICAgICAgIHJldHVybiAkZWwud2lkdGgoYXJnKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkZWwud2lkdGgoKTtcbiAgICAgIH0sXG5cbiAgICAgIG1pblNpemU6IGZ1bmN0aW9uICgkZWwpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KCRlbC5jc3MoXCJtaW4td2lkdGhcIikpIHx8IDA7XG4gICAgICB9LFxuXG4gICAgICBmaXhlZFRodW1iU2l6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZml4ZWRUaHVtYldpZHRoO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsQmFyOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiAkZWwuZmluZChcIi5zY3JvbGwtYmFyLmhvcml6b250YWxcIik7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZURlbHRhOiBmdW5jdGlvbiAoZXZlbnQxLCBldmVudDIpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50Mi5wYWdlWCAtIGV2ZW50MS5wYWdlWDtcbiAgICAgIH0sXG5cbiAgICAgIG9mZnNldENvbXBvbmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJsZWZ0XCI7XG4gICAgICB9LFxuXG4gICAgICB3aGVlbERlbHRhOiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgcmV0dXJuIGRlbHRhWDtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEF4aXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWFwiO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsRGlyZWN0aW9uOiBmdW5jdGlvbiAob2xkUGVyY2VudCwgbmV3UGVyY2VudCkge1xuICAgICAgICByZXR1cm4gb2xkUGVyY2VudCA8IG5ld1BlcmNlbnQgPyBcInJpZ2h0XCIgOiBcImxlZnRcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbGluZ0tleXM6IHtcbiAgICAgICAgMzc6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gLTEwOyAvL2Fycm93IGxlZnRcbiAgICAgICAgfSxcbiAgICAgICAgMzk6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gMTA7IC8vYXJyb3cgcmlnaHRcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaXNJbnNpZGU6IGZ1bmN0aW9uIChlbGVtZW50LCB3cmFwcGluZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgdmFyICR3cmFwcGluZ0VsZW1lbnQgPSAkKHdyYXBwaW5nRWxlbWVudCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciB3cmFwcGluZ0VsZW1lbnRPZmZzZXQgPSAkd3JhcHBpbmdFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICByZXR1cm4gKGVsZW1lbnRPZmZzZXQubGVmdCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQubGVmdCkgJiZcbiAgICAgICAgICAoZWxlbWVudE9mZnNldC5sZWZ0ICsgJGVsZW1lbnQud2lkdGgoKSA8PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQubGVmdCArICR3cmFwcGluZ0VsZW1lbnQud2lkdGgoKSk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgVlNpemluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9XG5cbiAgICBWU2l6aW5nLnByb3RvdHlwZSA9IHtcblxuICAgICAgc2l6ZTogZnVuY3Rpb24gKCRlbCwgYXJnKSB7XG4gICAgICAgIGlmIChhcmcpXG4gICAgICAgICAgcmV0dXJuICRlbC5oZWlnaHQoYXJnKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkZWwuaGVpZ2h0KCk7XG4gICAgICB9LFxuXG4gICAgICBtaW5TaXplOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludCgkZWwuY3NzKFwibWluLWhlaWdodFwiKSkgfHwgMDtcbiAgICAgIH0sXG5cbiAgICAgIGZpeGVkVGh1bWJTaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5maXhlZFRodW1iSGVpZ2h0O1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsQmFyOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiAkZWwuZmluZChcIi5zY3JvbGwtYmFyLnZlcnRpY2FsXCIpO1xuICAgICAgfSxcblxuICAgICAgbW91c2VEZWx0YTogZnVuY3Rpb24gKGV2ZW50MSwgZXZlbnQyKSB7XG4gICAgICAgIHJldHVybiBldmVudDIucGFnZVkgLSBldmVudDEucGFnZVk7XG4gICAgICB9LFxuXG4gICAgICBvZmZzZXRDb21wb25lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwidG9wXCI7XG4gICAgICB9LFxuXG4gICAgICB3aGVlbERlbHRhOiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgcmV0dXJuIGRlbHRhWTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEF4aXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWVwiO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsRGlyZWN0aW9uOiBmdW5jdGlvbiAob2xkUGVyY2VudCwgbmV3UGVyY2VudCkge1xuICAgICAgICByZXR1cm4gb2xkUGVyY2VudCA8IG5ld1BlcmNlbnQgPyBcImRvd25cIiA6IFwidXBcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbGluZ0tleXM6IHtcbiAgICAgICAgMzg6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gLTEwOyAvL2Fycm93IHVwXG4gICAgICAgIH0sXG4gICAgICAgIDQwOiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIDEwOyAvL2Fycm93IGRvd25cbiAgICAgICAgfSxcbiAgICAgICAgMzM6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gLSh2aWV3UG9ydFNpemUgLSAyMCk7IC8vcGFnZSB1cFxuICAgICAgICB9LFxuICAgICAgICAzNDogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiB2aWV3UG9ydFNpemUgLSAyMDsgLy9wYWdlIGRvd25cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaXNJbnNpZGU6IGZ1bmN0aW9uIChlbGVtZW50LCB3cmFwcGluZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgdmFyICR3cmFwcGluZ0VsZW1lbnQgPSAkKHdyYXBwaW5nRWxlbWVudCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciB3cmFwcGluZ0VsZW1lbnRPZmZzZXQgPSAkd3JhcHBpbmdFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICByZXR1cm4gKGVsZW1lbnRPZmZzZXQudG9wID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3ApICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQudG9wICsgJGVsZW1lbnQuaGVpZ2h0KCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LnRvcCArICR3cmFwcGluZ0VsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSB1bmRlZmluZWQpXG4gICAgICAgIG9wdGlvbnMgPSBkZWZhdWx0T3B0aW9ucztcbiAgICAgIGlmICh0eXBlb2Yob3B0aW9ucykgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB2YXIgc2Nyb2xsYWJsZSA9ICQodGhpcykuZGF0YShcInNjcm9sbGFibGVcIik7XG4gICAgICAgIGlmIChzY3JvbGxhYmxlKVxuICAgICAgICAgIHNjcm9sbGFibGVbb3B0aW9uc10oYXJncyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2Yob3B0aW9ucykgPT0gXCJvYmplY3RcIikge1xuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICBuZXcgU2Nyb2xsYWJsZSgkKHRoaXMpLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgXCJJbnZhbGlkIHR5cGUgb2Ygb3B0aW9uc1wiO1xuICAgIH0pO1xuXG4gIH1cbiAgO1xuXG59KVxuICAoalF1ZXJ5KTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgdmFyIHR5cGVzID0gWydET01Nb3VzZVNjcm9sbCcsICdtb3VzZXdoZWVsJ107XG5cbiAgaWYgKCQuZXZlbnQuZml4SG9va3MpIHtcbiAgICBmb3IgKHZhciBpID0gdHlwZXMubGVuZ3RoOyBpOykge1xuICAgICAgJC5ldmVudC5maXhIb29rc1sgdHlwZXNbLS1pXSBdID0gJC5ldmVudC5tb3VzZUhvb2tzO1xuICAgIH1cbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5tb3VzZXdoZWVsID0ge1xuICAgIHNldHVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSB0eXBlcy5sZW5ndGg7IGk7KSB7XG4gICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHR5cGVzWy0taV0sIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vbm1vdXNld2hlZWwgPSBoYW5kbGVyO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB0ZWFyZG93bjogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBmb3IgKHZhciBpID0gdHlwZXMubGVuZ3RoOyBpOykge1xuICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlc1stLWldLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25tb3VzZXdoZWVsID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJC5mbi5leHRlbmQoe1xuICAgIG1vdXNld2hlZWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgcmV0dXJuIGZuID8gdGhpcy5iaW5kKFwibW91c2V3aGVlbFwiLCBmbikgOiB0aGlzLnRyaWdnZXIoXCJtb3VzZXdoZWVsXCIpO1xuICAgIH0sXG5cbiAgICB1bm1vdXNld2hlZWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgcmV0dXJuIHRoaXMudW5iaW5kKFwibW91c2V3aGVlbFwiLCBmbik7XG4gICAgfVxuICB9KTtcblxuXG4gIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcbiAgICB2YXIgb3JnRXZlbnQgPSBldmVudCB8fCB3aW5kb3cuZXZlbnQsIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGRlbHRhID0gMCwgcmV0dXJuVmFsdWUgPSB0cnVlLCBkZWx0YVggPSAwLCBkZWx0YVkgPSAwO1xuICAgIGV2ZW50ID0gJC5ldmVudC5maXgob3JnRXZlbnQpO1xuICAgIGV2ZW50LnR5cGUgPSBcIm1vdXNld2hlZWxcIjtcblxuICAgIC8vIE9sZCBzY2hvb2wgc2Nyb2xsd2hlZWwgZGVsdGFcbiAgICBpZiAob3JnRXZlbnQud2hlZWxEZWx0YSkge1xuICAgICAgZGVsdGEgPSBvcmdFdmVudC53aGVlbERlbHRhIC8gMTIwO1xuICAgIH1cbiAgICBpZiAob3JnRXZlbnQuZGV0YWlsKSB7XG4gICAgICBkZWx0YSA9IC1vcmdFdmVudC5kZXRhaWwgLyAzO1xuICAgIH1cblxuICAgIC8vIE5ldyBzY2hvb2wgbXVsdGlkaW1lbnNpb25hbCBzY3JvbGwgKHRvdWNocGFkcykgZGVsdGFzXG4gICAgZGVsdGFZID0gZGVsdGE7XG5cbiAgICAvLyBHZWNrb1xuICAgIGlmIChvcmdFdmVudC5heGlzICE9PSB1bmRlZmluZWQgJiYgb3JnRXZlbnQuYXhpcyA9PT0gb3JnRXZlbnQuSE9SSVpPTlRBTF9BWElTKSB7XG4gICAgICBkZWx0YVkgPSAwO1xuICAgICAgZGVsdGFYID0gZGVsdGE7XG4gICAgfVxuXG4gICAgLy8gV2Via2l0XG4gICAgaWYgKG9yZ0V2ZW50LndoZWVsRGVsdGFZICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlbHRhWSA9IG9yZ0V2ZW50LndoZWVsRGVsdGFZIC8gMTIwO1xuICAgIH1cbiAgICBpZiAob3JnRXZlbnQud2hlZWxEZWx0YVggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZGVsdGFYID0gb3JnRXZlbnQud2hlZWxEZWx0YVggLyAxMjA7XG4gICAgfVxuXG4gICAgLy8gQWRkIGV2ZW50IGFuZCBkZWx0YSB0byB0aGUgZnJvbnQgb2YgdGhlIGFyZ3VtZW50c1xuICAgIGFyZ3MudW5zaGlmdChldmVudCwgZGVsdGEsIGRlbHRhWCwgZGVsdGFZKTtcblxuICAgIHJldHVybiAoJC5ldmVudC5kaXNwYXRjaCB8fCAkLmV2ZW50LmhhbmRsZSkuYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxufSkoalF1ZXJ5KTtcbiIsIi8vIFN0b3JhZ2UgY2FjaGUuXHJcbnZhciBjYWNoZSA9IHt9O1xyXG4vLyBUaGUgc3RvcmUgaGFuZGxpbmcgZXhwaXJhdGlvbiBvZiBkYXRhLlxyXG52YXIgZXhwaXJlc1N0b3JlID0gbmV3IFN0b3JlKHtcclxuXHRuYW1lc3BhY2U6ICdfX3N0b3JhZ2Utd3JhcHBlcjpleHBpcmVzJ1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBTdG9yYWdlIHdyYXBwZXIgZm9yIG1ha2luZyByb3V0aW5lIHN0b3JhZ2UgY2FsbHMgc3VwZXIgZWFzeS5cclxuICogQGNsYXNzIFN0b3JlXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdICAgICAgICAgICAgICAgICAgICAgVGhlIG9wdGlvbnMgZm9yIHRoZSBzdG9yZS4gT3B0aW9ucyBub3Qgb3ZlcnJpZGRlbiB3aWxsIHVzZSB0aGUgZGVmYXVsdHMuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBbb3B0aW9ucy5uYW1lc3BhY2U9JyddICAgICAgICBTZWUge3sjY3Jvc3NMaW5rIFwiU3RvcmUvc2V0TmFtZXNwYWNlXCJ9fVN0b3JlI3NldE5hbWVzcGFjZXt7L2Nyb3NzTGlua319XHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBbb3B0aW9ucy5zdG9yYWdlVHlwZT0nbG9jYWwnXSBTZWUge3sjY3Jvc3NMaW5rIFwiU3RvcmUvc2V0U3RvcmFnZVR5cGVcIn19U3RvcmUjc2V0U3RvcmFnZVR5cGV7ey9jcm9zc0xpbmt9fVxyXG4gKi9cclxuZnVuY3Rpb24gU3RvcmUob3B0aW9ucykge1xyXG5cdHZhciBzZXR0aW5ncyA9IHtcclxuXHRcdG5hbWVzcGFjZTogJycsXHJcblx0XHRzdG9yYWdlVHlwZTogJ2xvY2FsJ1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIHN0b3JhZ2UgbmFtZXNwYWNlLlxyXG5cdCAqIEBtZXRob2Qgc2V0TmFtZXNwYWNlXHJcblx0ICogQHBhcmFtIHtzdHJpbmd8ZmFsc2V8bnVsbH0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgdG8gd29yayB1bmRlci4gVG8gdXNlIG5vIG5hbWVzcGFjZSAoZS5nLiBnbG9iYWwgbmFtZXNwYWNlKSwgcGFzcyBpbiBgZmFsc2VgIG9yIGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcuXHJcblx0ICovXHJcblx0dGhpcy5zZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XHJcblx0XHR2YXIgdmFsaWROYW1lc3BhY2UgPSAvXltcXHctOl0rJC87XHJcblx0XHQvLyBObyBuYW1lc3BhY2UuXHJcblx0XHRpZiAobmFtZXNwYWNlID09PSBmYWxzZSB8fCBuYW1lc3BhY2UgPT0gbnVsbCB8fCBuYW1lc3BhY2UgPT09ICcnKSB7XHJcblx0XHRcdHNldHRpbmdzLm5hbWVzcGFjZSA9ICcnO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mIG5hbWVzcGFjZSAhPT0gJ3N0cmluZycgfHwgIXZhbGlkTmFtZXNwYWNlLnRlc3QobmFtZXNwYWNlKSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbmFtZXNwYWNlLicpO1xyXG5cdFx0fVxyXG5cdFx0c2V0dGluZ3MubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGN1cnJlbnQgc3RvcmFnZSBuYW1lc3BhY2UuXHJcblx0ICogQG1ldGhvZCBnZXROYW1lc3BhY2VcclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuXHQgKi9cclxuXHR0aGlzLmdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChpbmNsdWRlU2VwYXJhdG9yKSB7XHJcblx0XHRpZiAoaW5jbHVkZVNlcGFyYXRvciAmJiBzZXR0aW5ncy5uYW1lc3BhY2UgIT09ICcnKSB7XHJcblx0XHRcdHJldHVybiBzZXR0aW5ncy5uYW1lc3BhY2UgKyAnOic7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc2V0dGluZ3MubmFtZXNwYWNlO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgdHlwZSBvZiBzdG9yYWdlIHRvIHVzZS5cclxuXHQgKiBAbWV0aG9kIHNldFN0b3JhZ2VUeXBlXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgVGhlIHR5cGUgb2Ygc3RvcmFnZSB0byB1c2UuIFVzZSBgc2Vzc2lvbmAgZm9yIGBzZXNzaW9uU3RvcmFnZWAgYW5kIGBsb2NhbGAgZm9yIGBsb2NhbFN0b3JhZ2VgLlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0U3RvcmFnZVR5cGUgPSBmdW5jdGlvbiAodHlwZSkge1xyXG5cdFx0aWYgKFsnc2Vzc2lvbicsICdsb2NhbCddLmluZGV4T2YodHlwZSkgPCAwKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdG9yYWdlIHR5cGUuJyk7XHJcblx0XHR9XHJcblx0XHRzZXR0aW5ncy5zdG9yYWdlVHlwZSA9IHR5cGU7XHJcblx0fTtcclxuXHQvKipcclxuXHQgKiBHZXQgdGhlIHR5cGUgb2Ygc3RvcmFnZSBiZWluZyB1c2VkLlxyXG5cdCAqIEBtZXRob2QgZ2V0U3RvcmFnZVR5cGVcclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB0eXBlIG9mIHN0b3JhZ2UgYmVpbmcgdXNlZC5cclxuXHQgKi9cclxuXHR0aGlzLmdldFN0b3JhZ2VUeXBlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHNldHRpbmdzLnN0b3JhZ2VUeXBlO1xyXG5cdH07XHJcblxyXG5cdC8vIE92ZXJyaWRlIGRlZmF1bHQgc2V0dGluZ3MuXHJcblx0aWYgKG9wdGlvbnMpIHtcclxuXHRcdGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XHJcblx0XHRcdHN3aXRjaCAoa2V5KSB7XHJcblx0XHRcdFx0Y2FzZSAnbmFtZXNwYWNlJzpcclxuXHRcdFx0XHRcdHRoaXMuc2V0TmFtZXNwYWNlKG9wdGlvbnNba2V5XSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRjYXNlICdzdG9yYWdlVHlwZSc6XHJcblx0XHRcdFx0XHR0aGlzLnNldFN0b3JhZ2VUeXBlKG9wdGlvbnNba2V5XSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGFjdHVhbCBoYW5kbGVyIHRvIHVzZVxyXG4gKiBAbWV0aG9kIGdldFN0b3JhZ2VIYW5kbGVyXHJcbiAqIEByZXR1cm4ge21peGVkfSBUaGUgc3RvcmFnZSBoYW5kbGVyLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldFN0b3JhZ2VIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBoYW5kbGVycyA9IHtcclxuXHRcdCdsb2NhbCc6IGxvY2FsU3RvcmFnZSxcclxuXHRcdCdzZXNzaW9uJzogc2Vzc2lvblN0b3JhZ2VcclxuXHR9O1xyXG5cdHJldHVybiBoYW5kbGVyc1t0aGlzLmdldFN0b3JhZ2VUeXBlKCldO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgZnVsbCBzdG9yYWdlIG5hbWUgZm9yIGEga2V5LCBpbmNsdWRpbmcgdGhlIG5hbWVzcGFjZSwgaWYgYW55LlxyXG4gKiBAbWV0aG9kIGdldFN0b3JhZ2VLZXlcclxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkgVGhlIHN0b3JhZ2Uga2V5IG5hbWUuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gICAgIFRoZSBmdWxsIHN0b3JhZ2UgbmFtZSB0aGF0IGlzIHVzZWQgYnkgdGhlIHN0b3JhZ2UgbWV0aG9kcy5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXRTdG9yYWdlS2V5ID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdGlmICgha2V5IHx8IHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleS5sZW5ndGggPCAxKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0tleSBtdXN0IGJlIGEgc3RyaW5nLicpO1xyXG5cdH1cclxuXHRyZXR1cm4gdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkgKyBrZXk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0b3JhZ2UgaXRlbSBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBnZXRcclxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkgICAgICAgICAgVGhlIGtleSB0aGF0IHRoZSBkYXRhIGNhbiBiZSBhY2Nlc3NlZCB1bmRlci5cclxuICogQHBhcmFtICB7bWl4ZWR9ICBkZWZhdWx0VmFsdWUgVGhlIGRlZmF1bHQgdmFsdWUgdG8gcmV0dXJuIGluIGNhc2UgdGhlIHN0b3JhZ2UgdmFsdWUgaXMgbm90IHNldCBvciBgbnVsbGAuXHJcbiAqIEByZXR1cm4ge21peGVkfSAgICAgICAgICAgICAgIFRoZSBkYXRhIGZvciB0aGUgc3RvcmFnZS5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5LCBkZWZhdWx0VmFsdWUpIHtcclxuXHQvLyBQcmV2ZW50IHJlY3Vyc2lvbi4gT25seSBjaGVjayBleHBpcmUgZGF0ZSBpZiBpdCBpc24ndCBjYWxsZWQgZnJvbSBgZXhwaXJlc1N0b3JlYC5cclxuXHRpZiAodGhpcyAhPT0gZXhwaXJlc1N0b3JlKSB7XHJcblx0XHQvLyBDaGVjayBpZiBrZXkgaXMgZXhwaXJlZC5cclxuXHRcdHZhciBleHBpcmVEYXRlID0gZXhwaXJlc1N0b3JlLmdldCh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcblx0XHRpZiAoZXhwaXJlRGF0ZSAhPT0gbnVsbCAmJiBleHBpcmVEYXRlLmdldFRpbWUoKSA8IERhdGUubm93KCkpIHtcclxuXHRcdFx0Ly8gRXhwaXJlZCwgcmVtb3ZlIGl0LlxyXG5cdFx0XHR0aGlzLnJlbW92ZShrZXkpO1xyXG5cdFx0XHRleHBpcmVzU3RvcmUucmVtb3ZlKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIENhY2hlZCwgcmVhZCBmcm9tIG1lbW9yeS5cclxuXHRpZiAoY2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldICE9IG51bGwpIHtcclxuXHRcdHJldHVybiBjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV07XHJcblx0fVxyXG5cclxuXHR2YXIgdmFsID0gdGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLmdldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG5cclxuXHQvLyBWYWx1ZSBkb2Vzbid0IGV4aXN0IGFuZCB3ZSBoYXZlIGEgZGVmYXVsdCwgcmV0dXJuIGRlZmF1bHQuXHJcblx0aWYgKHZhbCA9PT0gbnVsbCAmJiB0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHR9XHJcblxyXG5cdC8vIE9ubHkgcHJlLXByb2Nlc3Mgc3RyaW5ncy5cclxuXHRpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdC8vIEhhbmRsZSBSZWdFeHBzLlxyXG5cdFx0aWYgKHZhbC5pbmRleE9mKCd+UmVnRXhwOicpID09PSAwKSB7XHJcblx0XHRcdHZhciBtYXRjaGVzID0gL15+UmVnRXhwOihbZ2ltXSo/KTooLiopLy5leGVjKHZhbCk7XHJcblx0XHRcdHZhbCA9IG5ldyBSZWdFeHAobWF0Y2hlc1syXSwgbWF0Y2hlc1sxXSk7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgRGF0ZXMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfkRhdGU6JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gbmV3IERhdGUodmFsLnJlcGxhY2UoL15+RGF0ZTovLCAnJykpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIG51bWJlcnMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfk51bWJlcjonKSA9PT0gMCkge1xyXG5cdFx0XHR2YWwgPSBwYXJzZUludCh2YWwucmVwbGFjZSgvXn5OdW1iZXI6LywgJycpLCAxMCk7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgYm9vbGVhbnMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfkJvb2xlYW46JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gdmFsLnJlcGxhY2UoL15+Qm9vbGVhbjovLCAnJykgPT09ICd0cnVlJztcclxuXHRcdH1cclxuXHRcdC8vIEhhbmRsZSBvYmplY3RzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35KU09OOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IHZhbC5yZXBsYWNlKC9efkpTT046LywgJycpO1xyXG5cdFx0XHQvLyBUcnkgcGFyc2luZyBpdC5cclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHR2YWwgPSBKU09OLnBhcnNlKHZhbCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gUGFyc2luZyB3ZW50IHdyb25nIChpbnZhbGlkIEpTT04pLCByZXR1cm4gZGVmYXVsdCBvciBudWxsLlxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFJldHVybiBpdC5cclxuXHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSB2YWw7XHJcblx0cmV0dXJuIHZhbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGEgc3RvcmFnZSBpdGVtIG9uIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBzZXRcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAga2V5ICAgICAgIFRoZSBrZXkgdGhhdCB0aGUgZGF0YSBjYW4gYmUgYWNjZXNzZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICAgICAgIHZhbCAgICAgICBUaGUgdmFsdWUgdG8gc3RvcmUuIE1heSBiZSB0aGUgZm9sbG93aW5nIHR5cGVzIG9mIGRhdGE6IGBSZWdFeHBgLCBgRGF0ZWAsIGBPYmplY3RgLCBgU3RyaW5nYCwgYEJvb2xlYW5gLCBgTnVtYmVyYFxyXG4gKiBAcGFyYW0ge0RhdGV8bnVtYmVyfSBbZXhwaXJlc10gVGhlIGRhdGUgaW4gdGhlIGZ1dHVyZSB0byBleHBpcmUsIG9yIHJlbGF0aXZlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZnJvbSBgRGF0ZSNub3dgIHRvIGV4cGlyZS5cclxuICpcclxuICogTm90ZTogVGhpcyBjb252ZXJ0cyBzcGVjaWFsIGRhdGEgdHlwZXMgdGhhdCBub3JtYWxseSBjYW4ndCBiZSBzdG9yZWQgaW4gdGhlIGZvbGxvd2luZyB3YXk6XHJcbiAqIFxyXG4gKiAtIGBSZWdFeHBgOiBwcmVmaXhlZCB3aXRoIHR5cGUsIGZsYWdzIHN0b3JlZCwgYW5kIHNvdXJjZSBzdG9yZWQgYXMgc3RyaW5nLlxyXG4gKiAtIGBEYXRlYDogcHJlZml4ZWQgd2l0aCB0eXBlLCBzdG9yZWQgYXMgc3RyaW5nIHVzaW5nIGBEYXRlI3RvU3RyaW5nYC5cclxuICogLSBgT2JqZWN0YDogcHJlZml4ZWQgd2l0aCBcIkpTT05cIiBpbmRpY2F0b3IsIHN0b3JlZCBhcyBzdHJpbmcgdXNpbmcgYEpTT04jc3RyaW5naWZ5YC5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWwsIGV4cGlyZXMpIHtcclxuXHR2YXIgcGFyc2VkVmFsID0gbnVsbDtcclxuXHQvLyBIYW5kbGUgUmVnRXhwcy5cclxuXHRpZiAodmFsIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcblx0XHR2YXIgZmxhZ3MgPSBbXHJcblx0XHRcdHZhbC5nbG9iYWwgPyAnZycgOiAnJyxcclxuXHRcdFx0dmFsLmlnbm9yZUNhc2UgPyAnaScgOiAnJyxcclxuXHRcdFx0dmFsLm11bHRpbGluZSA/ICdtJyA6ICcnLFxyXG5cdFx0XS5qb2luKCcnKTtcclxuXHRcdHBhcnNlZFZhbCA9ICd+UmVnRXhwOicgKyBmbGFncyArICc6JyArIHZhbC5zb3VyY2U7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBEYXRlcy5cclxuXHRlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkRhdGU6JyArIHZhbC50b1N0cmluZygpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgb2JqZWN0cy5cclxuXHRlbHNlIGlmICh2YWwgPT09IE9iamVjdCh2YWwpKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkpTT046JyArIEpTT04uc3RyaW5naWZ5KHZhbCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBudW1iZXJzLlxyXG5cdGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfk51bWJlcjonICsgdmFsLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBib29sZWFucy5cclxuXHRlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnYm9vbGVhbicpIHtcclxuXHRcdHBhcnNlZFZhbCA9ICd+Qm9vbGVhbjonICsgdmFsLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBzdHJpbmdzLlxyXG5cdGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRwYXJzZWRWYWwgPSB2YWw7XHJcblx0fVxyXG5cdC8vIFRocm93IGlmIHdlIGRvbid0IGtub3cgd2hhdCBpdCBpcy5cclxuXHRlbHNlIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIHN0b3JlIHRoaXMgdmFsdWU7IHdyb25nIHZhbHVlIHR5cGUuJyk7XHJcblx0fVxyXG5cdC8vIFNldCBleHBpcmUgZGF0ZSBpZiBuZWVkZWQuXHJcblx0aWYgKHR5cGVvZiBleHBpcmVzICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0Ly8gQ29udmVydCB0byBhIHJlbGF0aXZlIGRhdGUuXHJcblx0XHRpZiAodHlwZW9mIGV4cGlyZXMgPT09ICdudW1iZXInKSB7XHJcblx0XHRcdGV4cGlyZXMgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgZXhwaXJlcyk7XHJcblx0XHR9XHJcblx0XHQvLyBNYWtlIHN1cmUgaXQgaXMgYSBkYXRlLlxyXG5cdFx0aWYgKGV4cGlyZXMgaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRcdGV4cGlyZXNTdG9yZS5zZXQodGhpcy5nZXRTdG9yYWdlS2V5KGtleSksIGV4cGlyZXMpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignS2V5IGV4cGlyZSBtdXN0IGJlIGEgdmFsaWQgZGF0ZSBvciB0aW1lc3RhbXAuJyk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vIFNhdmUgaXQuXHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gdmFsO1xyXG5cdHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5zZXRJdGVtKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpLCBwYXJzZWRWYWwpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYWxsIGRhdGEgZm9yIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBnZXRBbGxcclxuICogQHJldHVybiB7b2JqZWN0fSBBbiBvYmplY3QgY29udGFpbmluZyBhbGwgZGF0YSBpbiB0aGUgZm9ybSBvZiBge3RoZUtleTogdGhlRGF0YX1gIHdoZXJlIGB0aGVEYXRhYCBpcyBwYXJzZWQgdXNpbmcge3sjY3Jvc3NMaW5rIFwiU3RvcmUvZ2V0XCJ9fVN0b3JlI2dldHt7L2Nyb3NzTGlua319LlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIga2V5cyA9IHRoaXMubGlzdEtleXMoKTtcclxuXHR2YXIgZGF0YSA9IHt9O1xyXG5cdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRkYXRhW2tleV0gPSB0aGlzLmdldChrZXkpO1xyXG5cdH0sIHRoaXMpO1xyXG5cdHJldHVybiBkYXRhO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExpc3QgYWxsIGtleXMgdGhhdCBhcmUgdGllZCB0byB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgbGlzdEtleXNcclxuICogQHJldHVybiB7YXJyYXl9IFRoZSBzdG9yYWdlIGtleXMuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUubGlzdEtleXMgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGtleXMgPSBbXTtcclxuXHR2YXIga2V5ID0gbnVsbDtcclxuXHR2YXIgc3RvcmFnZUxlbmd0aCA9IHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5sZW5ndGg7XHJcblx0dmFyIHByZWZpeCA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkpO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc3RvcmFnZUxlbmd0aDsgaSsrKSB7XHJcblx0XHRrZXkgPSB0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkua2V5KGkpXHJcblx0XHRpZiAocHJlZml4LnRlc3Qoa2V5KSkge1xyXG5cdFx0XHRrZXlzLnB1c2goa2V5LnJlcGxhY2UocHJlZml4LCAnJykpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4ga2V5cztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgc3BlY2lmaWMga2V5IGFuZCBkYXRhIGZyb20gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIHJlbW92ZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIHRoZSBkYXRhIGZvci5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5KSB7XHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gbnVsbDtcclxuXHR0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkucmVtb3ZlSXRlbSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbGwgZGF0YSBhbmQga2V5cyBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCByZW1vdmVBbGxcclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XHJcblx0dGhpcy5saXN0S2V5cygpLmZvckVhY2godGhpcy5yZW1vdmUsIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgbmFtZXNwYWNlZCBpdGVtcyBmcm9tIHRoZSBjYWNoZSBzbyB5b3VyIG5leHQge3sjY3Jvc3NMaW5rIFwiU3RvcmUvZ2V0XCJ9fVN0b3JlI2dldHt7L2Nyb3NzTGlua319IHdpbGwgYmUgZnJlc2ggZnJvbSB0aGUgc3RvcmFnZS5cclxuICogQG1ldGhvZCBmcmVzaGVuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byByZW1vdmUgdGhlIGNhY2hlIGRhdGEgZm9yLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmZyZXNoZW4gPSBmdW5jdGlvbiAoa2V5KSB7XHJcblx0dmFyIGtleXMgPSBrZXkgPyBba2V5XSA6IHRoaXMubGlzdEtleXMoKTtcclxuXHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gbnVsbDtcclxuXHR9LCB0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNaWdyYXRlIGRhdGEgZnJvbSBhIGRpZmZlcmVudCBuYW1lc3BhY2UgdG8gY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgbWlncmF0ZVxyXG4gKiBAcGFyYW0ge29iamVjdH0gICBtaWdyYXRpb24gICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBtaWdyYXRpb24gb2JqZWN0LlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24udG9LZXkgICAgICAgICAgICAgICAgICAgIFRoZSBrZXkgbmFtZSB1bmRlciB5b3VyIGN1cnJlbnQgbmFtZXNwYWNlIHRoZSBvbGQgZGF0YSBzaG91bGQgY2hhbmdlIHRvLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24uZnJvbU5hbWVzcGFjZSAgICAgICAgICAgIFRoZSBvbGQgbmFtZXNwYWNlIHRoYXQgdGhlIG9sZCBrZXkgYmVsb25ncyB0by5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbWlncmF0aW9uLmZyb21LZXkgICAgICAgICAgICAgICAgICBUaGUgb2xkIGtleSBuYW1lIHRvIG1pZ3JhdGUgZnJvbS5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgW21pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGVdICAgICAgICBUaGUgc3RvcmFnZSB0eXBlIHRvIG1pZ3JhdGUgZnJvbS4gRGVmYXVsdHMgdG8gc2FtZSB0eXBlIGFzIHdoZXJlIHlvdSBhcmUgbWlncmF0aW5nIHRvLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICBbbWlncmF0aW9uLmtlZXBPbGREYXRhPWZhbHNlXSAgICAgIFdoZXRoZXIgb2xkIGRhdGEgc2hvdWxkIGJlIGtlcHQgYWZ0ZXIgaXQgaGFzIGJlZW4gbWlncmF0ZWQuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gIFttaWdyYXRpb24ub3ZlcndyaXRlTmV3RGF0YT1mYWxzZV0gV2hldGhlciBvbGQgZGF0YSBzaG91bGQgb3ZlcndyaXRlIGN1cnJlbnRseSBzdG9yZWQgZGF0YSBpZiBpdCBleGlzdHMuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFttaWdyYXRpb24udHJhbnNmb3JtXSAgICAgICAgICAgICAgVGhlIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIG9sZCBrZXkgZGF0YSB0aHJvdWdoIGJlZm9yZSBtaWdyYXRpbmcuXHJcbiAqIEBleGFtcGxlXHJcbiAqIFxyXG4gKiAgICAgdmFyIFN0b3JlID0gcmVxdWlyZSgnc3RvcmFnZS13cmFwcGVyJyk7XHJcbiAqICAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG4gKiAgICAgICAgIG5hbWVzcGFjZTogJ215TmV3QXBwJ1xyXG4gKiAgICAgfSk7XHJcbiAqXHJcbiAqICAgICAvLyBNaWdyYXRlIGZyb20gdGhlIG9sZCBhcHAuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ25ldy1rZXknLFxyXG4gKiAgICAgICAgIGZyb21OYW1lc3BhY2U6ICdteU9sZEFwcCcsXHJcbiAqICAgICAgICAgZnJvbUtleTogJ29sZC1rZXknXHJcbiAqICAgICB9KTtcclxuICogICAgIFxyXG4gKiAgICAgLy8gTWlncmF0ZSBmcm9tIGdsb2JhbCBkYXRhLiBVc2VmdWwgd2hlbiBtb3ZpbmcgZnJvbSBvdGhlciBzdG9yYWdlIHdyYXBwZXJzIG9yIHJlZ3VsYXIgb2wnIGBsb2NhbFN0b3JhZ2VgLlxyXG4gKiAgICAgc3RvcmUubWlncmF0ZSh7XHJcbiAqICAgICAgICAgdG9LZXk6ICdvdGhlci1uZXcta2V5JyxcclxuICogICAgICAgICBmcm9tTmFtZXNwYWNlOiAnJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb3RoZXItb2xkLWtleS1vbi1nbG9iYWwnXHJcbiAqICAgICB9KTtcclxuICogICAgIFxyXG4gKiAgICAgLy8gTWlncmF0ZSBzb21lIEpTT04gZGF0YSB0aGF0IHdhcyBzdG9yZWQgYXMgYSBzdHJpbmcuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ25ldy1qc29uLWtleScsXHJcbiAqICAgICAgICAgZnJvbU5hbWVzcGFjZTogJ215T2xkQXBwJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb2xkLWpzb24ta2V5JyxcclxuICogICAgICAgICAvLyBUcnkgY29udmVydGluZyBzb21lIG9sZCBKU09OIGRhdGEuXHJcbiAqICAgICAgICAgdHJhbnNmb3JtOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gKiAgICAgICAgICAgICB0cnkge1xyXG4gKiAgICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XHJcbiAqICAgICAgICAgICAgIH1cclxuICogICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICogICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gKiAgICAgICAgICAgICB9XHJcbiAqICAgICAgICAgfVxyXG4gKiAgICAgfSk7XHJcbiAqL1xyXG5cclxuU3RvcmUucHJvdG90eXBlLm1pZ3JhdGUgPSBmdW5jdGlvbiAobWlncmF0aW9uKSB7XHJcblx0Ly8gU2F2ZSBvdXIgY3VycmVudCBuYW1lc3BhY2UuXHJcblx0dmFyIHRvTmFtZXNwYWNlID0gdGhpcy5nZXROYW1lc3BhY2UoKTtcclxuXHR2YXIgdG9TdG9yYWdlVHlwZSA9IHRoaXMuZ2V0U3RvcmFnZVR5cGUoKTtcclxuXHJcblx0Ly8gQ3JlYXRlIGEgdGVtcG9yYXJ5IHN0b3JlIHRvIGF2b2lkIGNoYW5naW5nIG5hbWVzcGFjZSBkdXJpbmcgYWN0dWFsIGdldC9zZXRzLlxyXG5cdHZhciBzdG9yZSA9IG5ldyBTdG9yZSh7XHJcblx0XHRuYW1lc3BhY2U6IHRvTmFtZXNwYWNlLFxyXG5cdFx0c3RvcmFnZVR5cGU6IHRvU3RvcmFnZVR5cGVcclxuXHR9KTtcclxuXHJcblx0dmFyIGRhdGEgPSBudWxsO1xyXG5cclxuXHQvLyBHZXQgZGF0YSBmcm9tIG9sZCBuYW1lc3BhY2UuXHJcblx0c3RvcmUuc2V0TmFtZXNwYWNlKG1pZ3JhdGlvbi5mcm9tTmFtZXNwYWNlKTtcclxuXHRpZiAodHlwZW9mIG1pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGUgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRzdG9yZS5zZXRTdG9yYWdlVHlwZShtaWdyYXRpb24uZnJvbVN0b3JhZ2VUeXBlKTtcclxuXHR9XHJcblx0ZGF0YSA9IHN0b3JlLmdldChtaWdyYXRpb24uZnJvbUtleSk7XHJcblxyXG5cdC8vIFJlbW92ZSBvbGQgaWYgbmVlZGVkLlxyXG5cdGlmICghbWlncmF0aW9uLmtlZXBPbGREYXRhKSB7XHJcblx0XHRzdG9yZS5yZW1vdmUobWlncmF0aW9uLmZyb21LZXkpO1xyXG5cdH1cclxuXHRcclxuXHQvLyBObyBkYXRhLCBpZ25vcmUgdGhpcyBtaWdyYXRpb24uXHJcblx0aWYgKGRhdGEgPT09IG51bGwpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8vIFRyYW5zZm9ybSBkYXRhIGlmIG5lZWRlZC5cclxuXHRpZiAodHlwZW9mIG1pZ3JhdGlvbi50cmFuc2Zvcm0gPT09ICdmdW5jdGlvbicpIHtcclxuXHRcdGRhdGEgPSBtaWdyYXRpb24udHJhbnNmb3JtKGRhdGEpO1xyXG5cdH1cclxuXHRlbHNlIGlmICh0eXBlb2YgbWlncmF0aW9uLnRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0cmFuc2Zvcm0gY2FsbGJhY2suJyk7XHJcblx0fVxyXG5cclxuXHQvLyBHbyBiYWNrIHRvIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG5cdHN0b3JlLnNldE5hbWVzcGFjZSh0b05hbWVzcGFjZSk7XHJcblx0c3RvcmUuc2V0U3RvcmFnZVR5cGUodG9TdG9yYWdlVHlwZSk7XHJcblxyXG5cdC8vIE9ubHkgb3ZlcndyaXRlIG5ldyBkYXRhIGlmIGl0IGRvZXNuJ3QgZXhpc3Qgb3IgaXQncyByZXF1ZXN0ZWQuXHJcblx0aWYgKHN0b3JlLmdldChtaWdyYXRpb24udG9LZXkpID09PSBudWxsIHx8IG1pZ3JhdGlvbi5vdmVyd3JpdGVOZXdEYXRhKSB7XHJcblx0XHRzdG9yZS5zZXQobWlncmF0aW9uLnRvS2V5LCBkYXRhKTtcclxuXHR9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHN1YnN0b3JlIHRoYXQgaXMgbmVzdGVkIGluIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBjcmVhdGVTdWJzdG9yZVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVzcGFjZSBUaGUgc3Vic3RvcmUncyBuYW1lc3BhY2UuXHJcbiAqIEByZXR1cm4ge1N0b3JlfSAgICAgICAgICAgIFRoZSBzdWJzdG9yZS5cclxuICogQGV4YW1wbGVcclxuICogXHJcbiAqICAgICB2YXIgU3RvcmUgPSByZXF1aXJlKCdzdG9yYWdlLXdyYXBwZXInKTtcclxuICogICAgIC8vIENyZWF0ZSBtYWluIHN0b3JlLlxyXG4gKiAgICAgdmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuICogICAgICAgICBuYW1lc3BhY2U6ICdteWFwcCdcclxuICogICAgIH0pO1xyXG4gKlxyXG4gKiAgICAgLy8gQ3JlYXRlIHN1YnN0b3JlLlxyXG4gKiAgICAgdmFyIHN1YnN0b3JlID0gc3RvcmUuY3JlYXRlU3Vic3RvcmUoJ3RoaW5ncycpO1xyXG4gKiAgICAgc3Vic3RvcmUuc2V0KCdmb28nLCAnYmFyJyk7XHJcbiAqXHJcbiAqICAgICBzdWJzdG9yZS5nZXQoJ2ZvbycpID09PSBzdG9yZS5nZXQoJ3RoaW5nczpmb28nKTtcclxuICogICAgIC8vIHRydWVcclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5jcmVhdGVTdWJzdG9yZSA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHRyZXR1cm4gbmV3IFN0b3JlKHtcclxuXHRcdG5hbWVzcGFjZTogdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkgKyBuYW1lc3BhY2UsXHJcblx0XHRzdG9yYWdlVHlwZTogdGhpcy5nZXRTdG9yYWdlVHlwZSgpXHJcblx0fSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0b3JlO1xyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcblx0XCJuYW1lXCI6IFwidHdpdGNoLWNoYXQtZW1vdGVzXCIsXHJcblx0XCJ2ZXJzaW9uXCI6IFwiMS4wLjNcIixcclxuXHRcImhvbWVwYWdlXCI6IFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9cIixcclxuXHRcImJ1Z3NcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvaXNzdWVzXCIsXHJcblx0XCJhdXRob3JcIjogXCJSeWFuIENoYXRoYW0gPHJ5YW4uYi5jaGF0aGFtQGdtYWlsLmNvbT4gKGh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjKVwiLFxyXG5cdFwicmVwb3NpdG9yeVwiOiB7XHJcblx0XHRcInR5cGVcIjogXCJnaXRcIixcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2NsZXR1c2MvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzLmdpdFwiXHJcblx0fSxcclxuXHRcInVzZXJzY3JpcHRcIjoge1xyXG5cdFx0XCJuYW1lXCI6IFwiVHdpdGNoIENoYXQgRW1vdGVzXCIsXHJcblx0XHRcIm5hbWVzcGFjZVwiOiBcIiNDbGV0dXNcIixcclxuXHRcdFwidmVyc2lvblwiOiBcInt7e3BrZy52ZXJzaW9ufX19XCIsXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IFwiQWRkcyBhIGJ1dHRvbiB0byBUd2l0Y2ggdGhhdCBhbGxvd3MgeW91IHRvIFxcXCJjbGljay10by1pbnNlcnRcXFwiIGFuIGVtb3RlLlwiLFxyXG5cdFx0XCJjb3B5cmlnaHRcIjogXCIyMDExKywge3t7cGtnLmF1dGhvcn19fVwiLFxyXG5cdFx0XCJhdXRob3JcIjogXCJ7e3twa2cuYXV0aG9yfX19XCIsXHJcblx0XHRcImljb25cIjogXCJodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIucGhwP2dyYXZhdGFyX2lkPTY4NzVlODNhYTZjNTYzNzkwY2IyZGE5MTRhYWJhOGIzJnI9UEcmcz00OCZkZWZhdWx0PWlkZW50aWNvblwiLFxyXG5cdFx0XCJsaWNlbnNlXCI6IFtcclxuXHRcdFx0XCJNSVQ7IGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcIixcclxuXHRcdFx0XCJDQyBCWS1OQy1TQSAzLjA7IGh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LW5jLXNhLzMuMC9cIlxyXG5cdFx0XSxcclxuXHRcdFwiaG9tZXBhZ2VcIjogXCJ7e3twa2cuaG9tZXBhZ2V9fX1cIixcclxuXHRcdFwic3VwcG9ydFVSTFwiOiBcInt7e3BrZy5idWdzfX19XCIsXHJcblx0XHRcImNvbnRyaWJ1dGlvblVSTFwiOiBcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvI2RvbmF0ZVwiLFxyXG5cdFx0XCJncmFudFwiOiBcIm5vbmVcIixcclxuXHRcdFwiaW5jbHVkZVwiOiBcImh0dHA6Ly8qLnR3aXRjaC50di8qXCIsXHJcblx0XHRcImV4Y2x1ZGVcIjogW1xyXG5cdFx0XHRcImh0dHA6Ly9hcGkudHdpdGNoLnR2LypcIixcclxuXHRcdFx0XCJodHRwOi8vY2hhdGRlcG90LnR3aXRjaC50di8qXCJcclxuXHRcdF1cclxuXHR9LFxyXG5cdFwic2NyaXB0c1wiOiB7XHJcblx0XHRcImluc3RhbGxcIjogXCJuYXBhXCJcclxuXHR9LFxyXG5cdFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcclxuXHRcdFwiYnJvd3Nlci1zeW5jXCI6IFwiXjEuMy4yXCIsXHJcblx0XHRcImJyb3dzZXJpZnlcIjogXCJeNS45LjFcIixcclxuXHRcdFwiZ3VscFwiOiBcIl4zLjguM1wiLFxyXG5cdFx0XCJndWxwLWF1dG9wcmVmaXhlclwiOiBcIjAuMC44XCIsXHJcblx0XHRcImd1bHAtYmVhdXRpZnlcIjogXCIxLjEuMFwiLFxyXG5cdFx0XCJndWxwLWNoYW5nZWRcIjogXCJeMC40LjFcIixcclxuXHRcdFwiZ3VscC1jb25jYXRcIjogXCJeMi4yLjBcIixcclxuXHRcdFwiZ3VscC1jb25mbGljdFwiOiBcIl4wLjEuMlwiLFxyXG5cdFx0XCJndWxwLWNzcy1iYXNlNjRcIjogXCJeMS4xLjBcIixcclxuXHRcdFwiZ3VscC1jc3MyanNcIjogXCJeMS4wLjJcIixcclxuXHRcdFwiZ3VscC1oZWFkZXJcIjogXCJeMS4wLjJcIixcclxuXHRcdFwiZ3VscC1ob2dhbi1jb21waWxlXCI6IFwiXjAuMi4xXCIsXHJcblx0XHRcImd1bHAtbWluaWZ5LWNzc1wiOiBcIl4wLjMuNVwiLFxyXG5cdFx0XCJndWxwLW5vdGlmeVwiOiBcIl4xLjQuMVwiLFxyXG5cdFx0XCJndWxwLXJlbmFtZVwiOiBcIl4xLjIuMFwiLFxyXG5cdFx0XCJndWxwLXVnbGlmeVwiOiBcIl4wLjMuMVwiLFxyXG5cdFx0XCJndWxwLXV0aWxcIjogXCJeMy4wLjBcIixcclxuXHRcdFwiaG9nYW4uanNcIjogXCJeMy4wLjJcIixcclxuXHRcdFwianF1ZXJ5LXVpXCI6IFwiXjEuMTAuNVwiLFxyXG5cdFx0XCJuYXBhXCI6IFwiXjAuNC4xXCIsXHJcblx0XHRcInByZXR0eS1ocnRpbWVcIjogXCJeMC4yLjFcIixcclxuXHRcdFwidmlueWwtbWFwXCI6IFwiXjEuMC4xXCIsXHJcblx0XHRcInZpbnlsLXNvdXJjZS1zdHJlYW1cIjogXCJeMC4xLjFcIixcclxuXHRcdFwid2F0Y2hpZnlcIjogXCJeMS4wLjFcIixcclxuXHRcdFwic3RvcmFnZS13cmFwcGVyXCI6IFwiY2xldHVzYy9zdG9yYWdlLXdyYXBwZXIjdjAuMS4xXCJcclxuXHR9LFxyXG5cdFwibmFwYVwiOiB7XHJcblx0XHRcImpxdWVyeS1jdXN0b20tc2Nyb2xsYmFyXCI6IFwibXp1YmFsYS9qcXVlcnktY3VzdG9tLXNjcm9sbGJhciMwLjUuNVwiXHJcblx0fVxyXG59XHJcbiIsInZhciBhcGkgPSB7fTtcclxudmFyIHByZWZpeCA9ICdbRW1vdGUgTWVudV0gJztcclxudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuXHJcbmFwaS5sb2cgPSBmdW5jdGlvbiAoKSB7XHJcblx0aWYgKHR5cGVvZiBjb25zb2xlLmxvZyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0YXJndW1lbnRzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpLm1hcChmdW5jdGlvbiAoYXJnKSB7XHJcblx0XHRpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZyk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gYXJnO1xyXG5cdH0pO1xyXG5cdGFyZ3VtZW50cy51bnNoaWZ0KHByZWZpeCk7XHJcblx0Y29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcclxufTtcclxuXHJcbmFwaS5kZWJ1ZyA9IGZ1bmN0aW9uICgpIHtcclxuXHRpZiAoIXN0b3JhZ2UuZ2xvYmFsLmdldCgnZGVidWdNZXNzYWdlc0VuYWJsZWQnLCBmYWxzZSkpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0YXJndW1lbnRzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cdGFyZ3VtZW50cy51bnNoaWZ0KCdbREVCVUddICcpO1xyXG5cdGFwaS5sb2cuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XHJcbiIsInZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG52YXIgYXBpID0ge307XHJcblxyXG5hcGkudG9nZ2xlRGVidWcgPSBmdW5jdGlvbiAoZm9yY2VkKSB7XHJcblx0aWYgKHR5cGVvZiBmb3JjZWQgPT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRmb3JjZWQgPSAhc3RvcmFnZS5nbG9iYWwuZ2V0KCdkZWJ1Z01lc3NhZ2VzRW5hYmxlZCcsIGZhbHNlKTtcclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHRmb3JjZWQgPSAhIWZvcmNlZDtcclxuXHR9XHJcblx0c3RvcmFnZS5nbG9iYWwuc2V0KCdkZWJ1Z01lc3NhZ2VzRW5hYmxlZCcsIGZvcmNlZCk7XHJcblx0bG9nZ2VyLmxvZygnRGVidWcgbWVzc2FnZXMgYXJlIG5vdyAnICsgKGZvcmNlZCA/ICdlbmFibGVkJyA6ICdkaXNhYmxlZCcpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXBpO1xyXG4iLCJ2YXIgU3RvcmUgPSByZXF1aXJlKCdzdG9yYWdlLXdyYXBwZXInKTtcclxudmFyIHN0b3JhZ2UgPSB7fTtcclxuXHJcbi8vIEdlbmVyYWwgc3RvcmFnZS5cclxuc3RvcmFnZS5nbG9iYWwgPSBuZXcgU3RvcmUoe1xyXG5cdG5hbWVzcGFjZTogJ2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCdcclxufSk7XHJcblxyXG4vLyBFbW90ZSB2aXNpYmlsaXR5IHN0b3JhZ2UuXHJcbnN0b3JhZ2UudmlzaWJpbGl0eSA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCd2aXNpYmlsaXR5Jyk7XHJcbi8vIEVtb3RlIHN0YXJyZWQgc3RvcmFnZS5cclxuc3RvcmFnZS5zdGFycmVkID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ3N0YXJyZWQnKTtcclxuLy8gRGlzcGxheSBuYW1lIHN0b3JhZ2UuXHJcbnN0b3JhZ2UuZGlzcGxheU5hbWVzID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ2Rpc3BsYXlOYW1lcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzdG9yYWdlO1xyXG4iLCJ2YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi4vLi4vYnVpbGQvdGVtcGxhdGVzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGRhdGEgPSB7fTtcclxuXHR2YXIga2V5ID0gbnVsbDtcclxuXHJcblx0Ly8gQ29udmVydCB0ZW1wbGF0ZXMgdG8gdGhlaXIgc2hvcnRlciBcInJlbmRlclwiIGZvcm0uXHJcblx0Zm9yIChrZXkgaW4gdGVtcGxhdGVzKSB7XHJcblx0XHRpZiAoIXRlbXBsYXRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0fVxyXG5cdFx0ZGF0YVtrZXldID0gcmVuZGVyKGtleSk7XHJcblx0fVxyXG5cclxuXHQvLyBTaG9ydGN1dCB0aGUgcmVuZGVyIGZ1bmN0aW9uLiBBbGwgdGVtcGxhdGVzIHdpbGwgYmUgcGFzc2VkIGluIGFzIHBhcnRpYWxzIGJ5IGRlZmF1bHQuXHJcblx0ZnVuY3Rpb24gcmVuZGVyKHRlbXBsYXRlKSB7XHJcblx0XHR0ZW1wbGF0ZSA9IHRlbXBsYXRlc1t0ZW1wbGF0ZV07XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscyB8fCB0ZW1wbGF0ZXMsIGluZGVudCk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRhdGE7XHJcbn0pKCk7XHJcbiIsInZhciBhcGkgPSB3aW5kb3cuVHdpdGNoLmFwaTtcclxuXHJcbmZ1bmN0aW9uIGdldEJhZGdlcyh1c2VybmFtZSwgY2FsbGJhY2spIHtcclxuXHQvLyBOb3RlOiBub3QgYSBkb2N1bWVudGVkIEFQSSBlbmRwb2ludC5cclxuXHRhcGkuZ2V0KCdjaGF0LycgKyB1c2VybmFtZSArICcvYmFkZ2VzJylcclxuXHRcdC5kb25lKGZ1bmN0aW9uIChhcGkpIHtcclxuXHRcdFx0Y2FsbGJhY2soYXBpKTtcclxuXHRcdH0pXHJcblx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGNhbGxiYWNrKHt9KTtcclxuXHRcdH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRVc2VyKHVzZXJuYW1lLCBjYWxsYmFjaykge1xyXG5cdC8vIE5vdGU6IG5vdCBhIGRvY3VtZW50ZWQgQVBJIGVuZHBvaW50LlxyXG5cdGFwaS5nZXQoJ3VzZXJzLycgKyB1c2VybmFtZSlcclxuXHRcdC5kb25lKGZ1bmN0aW9uIChhcGkpIHtcclxuXHRcdFx0Y2FsbGJhY2soYXBpKTtcclxuXHRcdH0pXHJcblx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGNhbGxiYWNrKHt9KTtcclxuXHRcdH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRUaWNrZXRzKGNhbGxiYWNrKSB7XHJcblx0Ly8gTm90ZTogbm90IGEgZG9jdW1lbnRlZCBBUEkgZW5kcG9pbnQuXHJcblx0YXBpLmdldChcclxuXHRcdCcvYXBpL3VzZXJzLzpsb2dpbi90aWNrZXRzJyxcclxuXHRcdHtcclxuXHRcdFx0b2Zmc2V0OiAwLFxyXG5cdFx0XHRsaW1pdDogMTAwLFxyXG5cdFx0XHR1bmVuZGVkOiB0cnVlXHJcblx0XHR9XHJcblx0KVxyXG5cdFx0LmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0XHRjYWxsYmFjayhhcGkudGlja2V0cyB8fCBbXSk7XHJcblx0XHR9KVxyXG5cdFx0LmZhaWwoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRjYWxsYmFjayhbXSk7XHJcblx0XHR9KTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblx0Z2V0QmFkZ2VzOiBnZXRCYWRnZXMsXHJcblx0Z2V0VGlja2V0czogZ2V0VGlja2V0cyxcclxuXHRnZXRVc2VyOiBnZXRVc2VyXHJcbn07XHJcbiIsIihmdW5jdGlvbiAoJCkge1xyXG5cdCQuZm4ucmVzaXphYmxlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRcdHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHtcclxuXHRcdFx0YWxzb1Jlc2l6ZTogbnVsbCxcclxuXHRcdFx0YWxzb1Jlc2l6ZVR5cGU6ICdib3RoJywgLy8gYGhlaWdodGAsIGB3aWR0aGAsIGBib3RoYFxyXG5cdFx0XHRjb250YWlubWVudDogbnVsbCxcclxuXHRcdFx0Y3JlYXRlOiBudWxsLFxyXG5cdFx0XHRkZXN0cm95OiBudWxsLFxyXG5cdFx0XHRoYW5kbGU6ICcucmVzaXplLWhhbmRsZScsXHJcblx0XHRcdG1heEhlaWdodDogOTk5OSxcclxuXHRcdFx0bWF4V2lkdGg6IDk5OTksXHJcblx0XHRcdG1pbkhlaWdodDogMCxcclxuXHRcdFx0bWluV2lkdGg6IDAsXHJcblx0XHRcdHJlc2l6ZTogbnVsbCxcclxuXHRcdFx0cmVzaXplT25jZTogbnVsbCxcclxuXHRcdFx0c25hcFNpemU6IDEsXHJcblx0XHRcdHN0YXJ0OiBudWxsLFxyXG5cdFx0XHRzdG9wOiBudWxsXHJcblx0XHR9LCBvcHRpb25zKTtcclxuXHJcblx0XHRzZXR0aW5ncy5lbGVtZW50ID0gJCh0aGlzKTtcclxuXHJcblx0XHRmdW5jdGlvbiByZWNhbGN1bGF0ZVNpemUoZXZ0KSB7XHJcblx0XHRcdHZhciBkYXRhID0gZXZ0LmRhdGEsXHJcblx0XHRcdFx0cmVzaXplZCA9IHt9O1xyXG5cdFx0XHRkYXRhLmRpZmZYID0gTWF0aC5yb3VuZCgoZXZ0LnBhZ2VYIC0gZGF0YS5wYWdlWCkgLyBzZXR0aW5ncy5zbmFwU2l6ZSkgKiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHRcdFx0ZGF0YS5kaWZmWSA9IE1hdGgucm91bmQoKGV2dC5wYWdlWSAtIGRhdGEucGFnZVkpIC8gc2V0dGluZ3Muc25hcFNpemUpICogc2V0dGluZ3Muc25hcFNpemU7XHJcblx0XHRcdGlmIChNYXRoLmFicyhkYXRhLmRpZmZYKSA+IDAgfHwgTWF0aC5hYnMoZGF0YS5kaWZmWSkgPiAwKSB7XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoKSAhPT0gZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZICYmXHJcblx0XHRcdFx0XHRkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgPj0gc2V0dGluZ3MubWluSGVpZ2h0ICYmXHJcblx0XHRcdFx0XHRkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgPD0gc2V0dGluZ3MubWF4SGVpZ2h0ICYmXHJcblx0XHRcdFx0XHQoc2V0dGluZ3MuY29udGFpbm1lbnQgPyBkYXRhLm91dGVySGVpZ2h0ICsgZGF0YS5kaWZmWSArIGRhdGEub2Zmc2V0LnRvcCA8PSBzZXR0aW5ncy5jb250YWlubWVudC5vZmZzZXQoKS50b3AgKyBzZXR0aW5ncy5jb250YWlubWVudC5vdXRlckhlaWdodCgpIDogdHJ1ZSlcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSk7XHJcblx0XHRcdFx0XHRyZXNpemVkLmhlaWdodCA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQud2lkdGgoKSAhPT0gZGF0YS53aWR0aCArIGRhdGEuZGlmZlggJiZcclxuXHRcdFx0XHRcdGRhdGEud2lkdGggKyBkYXRhLmRpZmZYID49IHNldHRpbmdzLm1pbldpZHRoICYmXHJcblx0XHRcdFx0XHRkYXRhLndpZHRoICsgZGF0YS5kaWZmWCA8PSBzZXR0aW5ncy5tYXhXaWR0aCAmJlxyXG5cdFx0XHRcdFx0KHNldHRpbmdzLmNvbnRhaW5tZW50ID8gZGF0YS5vdXRlcldpZHRoICsgZGF0YS5kaWZmWCArIGRhdGEub2Zmc2V0LmxlZnQgPD0gc2V0dGluZ3MuY29udGFpbm1lbnQub2Zmc2V0KCkubGVmdCArIHNldHRpbmdzLmNvbnRhaW5tZW50Lm91dGVyV2lkdGgoKSA6IHRydWUpXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LndpZHRoKGRhdGEud2lkdGggKyBkYXRhLmRpZmZYKTtcclxuXHRcdFx0XHRcdHJlc2l6ZWQud2lkdGggPSB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAocmVzaXplZC5oZWlnaHQgfHwgcmVzaXplZC53aWR0aCkge1xyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLnJlc2l6ZU9uY2UpIHtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplT25jZS5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKGV2dC5kYXRhKTtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplT25jZSA9IG51bGw7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MucmVzaXplKSB7XHJcblx0XHRcdFx0XHRcdHNldHRpbmdzLnJlc2l6ZS5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKGV2dC5kYXRhKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5hbHNvUmVzaXplKSB7XHJcblx0XHRcdFx0XHRcdGlmIChyZXNpemVkLmhlaWdodCAmJiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdoZWlnaHQnIHx8IHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnYm90aCcpKSB7XHJcblx0XHRcdFx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZS5oZWlnaHQoZGF0YS5hbHNvUmVzaXplSGVpZ2h0ICsgZGF0YS5kaWZmWSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0aWYgKHJlc2l6ZWQud2lkdGggJiYgKHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnd2lkdGgnIHx8IHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnYm90aCcpKSB7XHJcblx0XHRcdFx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZS53aWR0aChkYXRhLmFsc29SZXNpemVXaWR0aCArIGRhdGEuZGlmZlgpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gc3RhcnQoZXZ0KSB7XHJcblx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRpZiAoc2V0dGluZ3Muc3RhcnQpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5zdGFydC5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIGRhdGEgPSB7XHJcblx0XHRcdFx0YWxzb1Jlc2l6ZUhlaWdodDogc2V0dGluZ3MuYWxzb1Jlc2l6ZSA/IHNldHRpbmdzLmFsc29SZXNpemUuaGVpZ2h0KCkgOiAwLFxyXG5cdFx0XHRcdGFsc29SZXNpemVXaWR0aDogc2V0dGluZ3MuYWxzb1Jlc2l6ZSA/IHNldHRpbmdzLmFsc29SZXNpemUud2lkdGgoKSA6IDAsXHJcblx0XHRcdFx0aGVpZ2h0OiBzZXR0aW5ncy5lbGVtZW50LmhlaWdodCgpLFxyXG5cdFx0XHRcdG9mZnNldDogc2V0dGluZ3MuZWxlbWVudC5vZmZzZXQoKSxcclxuXHRcdFx0XHRvdXRlckhlaWdodDogc2V0dGluZ3MuZWxlbWVudC5vdXRlckhlaWdodCgpLFxyXG5cdFx0XHRcdG91dGVyV2lkdGg6IHNldHRpbmdzLmVsZW1lbnQub3V0ZXJXaWR0aCgpLFxyXG5cdFx0XHRcdHBhZ2VYOiBldnQucGFnZVgsXHJcblx0XHRcdFx0cGFnZVk6IGV2dC5wYWdlWSxcclxuXHRcdFx0XHR3aWR0aDogc2V0dGluZ3MuZWxlbWVudC53aWR0aCgpXHJcblx0XHRcdH07XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZW1vdmUnLCAnKicsIGRhdGEsIHJlY2FsY3VsYXRlU2l6ZSk7XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwJywgJyonLCBzdG9wKTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBzdG9wKCkge1xyXG5cdFx0XHRpZiAoc2V0dGluZ3Muc3RvcCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLnN0b3AuYmluZChzZXR0aW5ncy5lbGVtZW50KSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2Vtb3ZlJywgJyonLCByZWNhbGN1bGF0ZVNpemUpO1xyXG5cdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCAnKicsIHN0b3ApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChzZXR0aW5ncy5oYW5kbGUpIHtcclxuXHRcdFx0aWYgKHNldHRpbmdzLmFsc29SZXNpemUgJiYgWydib3RoJywgJ2hlaWdodCcsICd3aWR0aCddLmluZGV4T2Yoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUpID49IDApIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplID0gJChzZXR0aW5ncy5hbHNvUmVzaXplKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoc2V0dGluZ3MuY29udGFpbm1lbnQpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5jb250YWlubWVudCA9ICQoc2V0dGluZ3MuY29udGFpbm1lbnQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHNldHRpbmdzLmhhbmRsZSA9ICQoc2V0dGluZ3MuaGFuZGxlKTtcclxuXHRcdFx0c2V0dGluZ3Muc25hcFNpemUgPSBzZXR0aW5ncy5zbmFwU2l6ZSA8IDEgPyAxIDogc2V0dGluZ3Muc25hcFNpemU7XHJcblxyXG5cdFx0XHRpZiAob3B0aW9ucyA9PT0gJ2Rlc3Ryb3knKSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuaGFuZGxlLm9mZignbW91c2Vkb3duJywgc3RhcnQpO1xyXG5cclxuXHRcdFx0XHRpZiAoc2V0dGluZ3MuZGVzdHJveSkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZGVzdHJveS5iaW5kKHRoaXMpKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzZXR0aW5ncy5oYW5kbGUub24oJ21vdXNlZG93bicsIHN0YXJ0KTtcclxuXHJcblx0XHRcdGlmIChzZXR0aW5ncy5jcmVhdGUpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5jcmVhdGUuYmluZCh0aGlzKSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9O1xyXG59KShqUXVlcnkpO1xyXG4iXX0=
