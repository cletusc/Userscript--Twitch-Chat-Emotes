// ==UserScript==
// @name Twitch Chat Emotes
// @namespace #Cletus
// @version 0.6.3
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
var $ = null;
var jQuery = null;

// Script-wide variables.
//-----------------------
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
var emotePopularity = false;
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
	showNews();

	// Get active subscriptions.
	window.Twitch.api.get(
		'/api/users/:login/tickets',
		{
			offset: 0,
			limit: 100,
			unended: true
		}
	).done(function (api) {
		api.tickets.forEach(function (ticket) {
			// Get subscriptions with emotes.
			if (ticket.product.emoticons && ticket.product.emoticons.length) {
				var badge = ticket.product.features.badge;
				var channel = ticket.product.owner_name;
				// Add channel badges.
				if (badge) {
					badge = 'http://static-cdn.jtvnw.net/jtv_user_pictures/' + [badge.prefix, badge.owner, badge.type, badge.uid, badge.sizes[0]].join('-') + '.' + badge.format;
				}
				else {
					badge = 'https://static-cdn.jtvnw.net/jtv_user_pictures/subscriber-star.png';
				}
				emotes.subscriptions.badges[channel] = badge;
				
				// Add emotes channel.
				ticket.product.emoticons.forEach(function (emote) {
					emotes.subscriptions.emotes[getEmoteFromRegEx(new RegExp(emote.regex))] = {
						channel: channel,
						url: emote.url
					};
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
		emotePopularityClear();
		populateEmotesMenu();
	});

	// Enable menu pinning.
	elements.menu.find('[data-command="toggle-pinned"]').on('click', function () {
		elements.menu.toggleClass('pinned');
	});

	// Enable emote clicking (delegated).
	elements.menu.on('click', '.emote', function () {
		insertEmoteText($(this).attr('data-emote'));
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
		var aGet = emotePopularityGet(a.text);
		var bGet = emotePopularityGet(b.text);
		var aNumber = typeof aGet === 'number';
		var bNumber = typeof bGet === 'number';
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
		// Override for turbo emotes.
		if (
			(a.channel && a.channel === 'Twitch Turbo') &&
			(!b.channel || (b.channel && b.channel !== 'Twitch Turbo'))
		) {
			return -1;
		}
		if (
			(b.channel && b.channel === 'Twitch Turbo') &&
			(!a.channel || (a.channel && a.channel !== 'Twitch Turbo'))
		) {
			return 1;
		}
		// Override for basic emotes.
		var basicEmotes = [':(', ':)', ':/', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o', '#/', ':7', ':>', ':S', '<]'];
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
				// Emote is forced to show.
				emote.hidden === false
			) {
				emote.image = image;
				return true;
			}
		});
		emote.image = emote.image || defaultImage;

		// Only add the emote if there is a URL.
		if (emote.image && emote.image.url !== null) {
			emotes.usable.push(emote);
		}
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
		if (emote.channel && emote.channel !== 'Twitch Turbo') {
			var badge = emotes.subscriptions.badges[emote.channel] || emote.badge;
			// Add notice about addon emotes.
			if (!emotes.subscriptions.badges[emote.channel] && !elements.menu.find('.group-header.addon-emotes-header').length) {
				container.append(
					$(templates.emoteGroupHeader({
						isAddonHeader: true
					}))
				);
			}
			if (!elements.menu.find('.group-header[data-emote-channel="' + emote.channel + '"]').length) {
				container.append(
					$(templates.emoteGroupHeader({
						badge: badge,
						channel: emote.channel
					}))
				);
			}
		}
	}

	container.append(
		$(templates.emote({
			image: emote.image,
			text: emote.text
		}))
	);
}

/**
 * Show latest news.
 */
function showNews() {
	var dismissedNews = JSON.parse(getSetting('twitch-chat-emotes:dismissed-news', '[]'));
	var cachedNews = JSON.parse(getSetting('twitch-chat-emotes:cached-news', '{}'));
	// Only poll news feed once per day.
	if (Date.now() - getSetting('twitch-chat-emotes:news-date', 0) > 86400000) {
		$.ajax('https://api.github.com/repos/cletusc/Userscript--Twitch-Chat-Emotes/contents/news.json', {
			dataType: 'json',
			headers: {
				'Accept': 'application/vnd.github.v3.raw+json',
				'User-Agent': 'cletusc/Userscript--Twitch-Chat-Emotes'
			}
		}).done(function (data) {
			cachedNews = data || cachedNews;
			setSetting('twitch-chat-emotes:cached-news', JSON.stringify(cachedNews));
		}).always(function () {
			handleNewsFeed();
			setSetting('twitch-chat-emotes:news-date', Date.now());
		});
	}
	else {
		handleNewsFeed();
	}

	// Handles displaying of news feed.
	function handleNewsFeed() {
		for (var newsId in cachedNews) {
			if (cachedNews.hasOwnProperty(newsId) && dismissedNews.indexOf(newsId) === -1) {
				// TODO #43
			}
		}
		$('#chat_lines, .chat-messages').on('click', 'a[data-command="twitch-chat-emotes:dismiss-news"]', function (evt) {
			evt.preventDefault();
			dismissedNews.push($(this).data('news-id'));
			setSetting('twitch-chat-emotes:dismissed-news', JSON.stringify(dismissedNews));
			$(this).parent().parent().remove();
		});
	}
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

// Generic functions.
//-------------------
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

},{"../build/styles":2,"../package.json":6,"./modules/templates":7,"./plugins/resizable":8,"jquery-custom-scrollbar/jquery.custom-scrollbar":5}],2:[function(require,module,exports){
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
"#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;margin-left:7px}#emote-menu-button.active{border-radius:2px;background-color:rgba(128,128,128,.5)}.emote-menu{padding:5px;z-index:1000;display:none;background-color:#202020}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-popular{height:38px}.emote-menu .draggable{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px)}.emote-menu .group-header{border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;background-image:-webkit-linear-gradient(bottom,transparent,rgba(0,0,0,.5));background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center}.emote-menu .group-header img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:32px;height:32px}.emote-menu .emote div{max-width:32px;max-height:32px;background-repeat:no-repeat;background-size:contain;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;padding:5px 0 2px;margin-top:5px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5;background-size:contain!important}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-home{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNjQiDQogICBoZWlnaHQ9IjY0Ig0KICAgdmlld0JveD0iMCAwIDY0IDY0Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhMzAwMSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczI5OTkiIC8+DQo8cGF0aA0KICAgZD0ibSA1Ny4wNjIsMzEuMzk4IGMgMC45MzIsLTEuMDI1IDAuODQyLC0yLjU5NiAtMC4yMDEsLTMuNTA4IEwgMzMuODg0LDcuNzg1IEMgMzIuODQxLDYuODczIDMxLjE2OSw2Ljg5MiAzMC4xNDgsNy44MjggTCA3LjA5MywyOC45NjIgYyAtMS4wMjEsMC45MzYgLTEuMDcxLDIuNTA1IC0wLjExMSwzLjUwMyBsIDAuNTc4LDAuNjAyIGMgMC45NTksMC45OTggMi41MDksMS4xMTcgMy40NiwwLjI2NSBsIDEuNzIzLC0xLjU0MyB2IDIyLjU5IGMgMCwxLjM4NiAxLjEyMywyLjUwOCAyLjUwOCwyLjUwOCBoIDguOTg3IGMgMS4zODUsMCAyLjUwOCwtMS4xMjIgMi41MDgsLTIuNTA4IFYgMzguNTc1IGggMTEuNDYzIHYgMTUuODA0IGMgLTAuMDIsMS4zODUgMC45NzEsMi41MDcgMi4zNTYsMi41MDcgaCA5LjUyNCBjIDEuMzg1LDAgMi41MDgsLTEuMTIyIDIuNTA4LC0yLjUwOCBWIDMyLjEwNyBjIDAsMCAwLjQ3NiwwLjQxNyAxLjA2MywwLjkzMyAwLjU4NiwwLjUxNSAxLjgxNywwLjEwMiAyLjc0OSwtMC45MjQgbCAwLjY1MywtMC43MTggeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%}.emote-menu .icon-resize-handle{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgdmlld0JveD0iMCAwIDE2IDE2Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhNDM1NyI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczQzNTUiIC8+DQo8cGF0aA0KICAgZD0iTSAxMy41LDggQyAxMy4yMjUsOCAxMyw4LjIyNCAxMyw4LjUgdiAzLjc5MyBMIDMuNzA3LDMgSCA3LjUgQyA3Ljc3NiwzIDgsMi43NzYgOCwyLjUgOCwyLjIyNCA3Ljc3NiwyIDcuNSwyIGggLTUgTCAyLjMwOSwyLjAzOSAyLjE1LDIuMTQ0IDIuMTQ2LDIuMTQ2IDIuMTQzLDIuMTUyIDIuMDM5LDIuMzA5IDIsMi41IHYgNSBDIDIsNy43NzYgMi4yMjQsOCAyLjUsOCAyLjc3Niw4IDMsNy43NzYgMyw3LjUgViAzLjcwNyBMIDEyLjI5MywxMyBIIDguNSBDIDguMjI0LDEzIDgsMTMuMjI1IDgsMTMuNSA4LDEzLjc3NSA4LjIyNCwxNCA4LjUsMTQgaCA1IGwgMC4xOTEsLTAuMDM5IGMgMC4xMjEsLTAuMDUxIDAuMjIsLTAuMTQ4IDAuMjcsLTAuMjcgTCAxNCwxMy41MDIgViA4LjUgQyAxNCw4LjIyNCAxMy43NzUsOCAxMy41LDggeiINCiAgIGlkPSJwYXRoNDM1MSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%;cursor:nwse-resize!important}.emote-menu .icon-pin{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgaWQ9InN2ZzMwMDUiPg0KICA8bWV0YWRhdGENCiAgICAgaWQ9Im1ldGFkYXRhMzAyMyI+DQogICAgPHJkZjpSREY+DQogICAgICA8Y2M6V29yaw0KICAgICAgICAgcmRmOmFib3V0PSIiPg0KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4NCiAgICAgICAgPGRjOnR5cGUNCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4NCiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+DQogICAgICA8L2NjOldvcms+DQogICAgPC9yZGY6UkRGPg0KICA8L21ldGFkYXRhPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczMwMjEiIC8+DQogIDxnDQogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzkzMDc4MiwwLDAsMC43OTMwNzgyLC0yLjE3MDk4NSwtODE0LjY5Mjk5KSINCiAgICAgaWQ9ImczMDA3Ij4NCiAgICA8Zw0KICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTEsMC43MDcxMSwtMC43MDcxMSwwLjcwNzExLDczNy43MDc1NSwyOTUuNDg4MDgpIg0KICAgICAgIGlkPSJnMzAwOSI+DQogICAgICA8Zw0KICAgICAgICAgaWQ9ImczNzU1Ij4NCiAgICAgICAgPHBhdGgNCiAgICAgICAgICAgZD0iTSA5Ljc4MTI1LDAgQyA5LjQ3NDA1NjIsMC42ODkxMTIgOS41MjA2OCwxLjUyMzA4NTMgOS4zMTI1LDIuMTg3NSBMIDQuOTM3NSw2LjU5Mzc1IEMgMy45NTg5NjA4LDYuNDI5NDgzIDIuOTQ3NzU0OCw2LjUzMjc4OTkgMiw2LjgxMjUgTCA1LjAzMTI1LDkuODQzNzUgMC41NjI1LDE0LjMxMjUgMCwxNiBDIDAuNTY5Mjk2MjgsMTUuNzk1NjI2IDEuMTY3NzM3OCwxNS42NDAyMzcgMS43MTg3NSwxNS40MDYyNSBMIDYuMTU2MjUsMTAuOTY4NzUgOS4xODc1LDE0IGMgMC4yNzk2ODIzLC0wLjk0Nzc4MyAwLjM4MzE1MjgsLTEuOTU4OTM3IDAuMjE4NzUsLTIuOTM3NSAxLjUwMDAxMSwtMS40ODk1Nzk4IDMuMDAwMDAxLC0yLjk3OTE1OSA0LjUsLTQuNDY4NzUgMC42MDExMDIsLTAuMDMxMzYxIDEuODIyMTM4LC0wLjA5NjEzNyAyLC0wLjQ2ODc1IEMgMTMuODc5ODkyLDQuMDY5NDgwMyAxMS44NDI4NjUsMi4wMjAyMjgyIDkuNzgxMjUsMCB6Ig0KICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg5MTU5Mzc0LC0wLjg5MTU5Mzc0LDAuODkxNTkzNzQsMC44OTE1OTM3NCwtMi4yNjU1LDEwMzcuMTM0NSkiDQogICAgICAgICAgIGlkPSJwYXRoMzAxMSINCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K) no-repeat 50%;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu .icon-pin:hover,.emote-menu.pinned .icon-pin{-webkit-transform:rotate(-45deg);-ms-transform:rotate(-45deg);transform:rotate(-45deg);opacity:1}.emote-menu .scrollable.default-skin{padding-right:0;padding-bottom:0}.emote-menu .scrollable.default-skin .scroll-bar .thumb{background-color:#555;opacity:.2;z-index:1}"));

},{}],3:[function(require,module,exports){
module.exports = (function() {
    var Hogan = require('hogan.js/lib/template.js');
    var templates = {};
    templates['emote'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote\" data-emote=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" title=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div style=\"background-image: url(");t.b(t.t(t.d("image.url",c,p,0)));t.b("); height: ");t.b(t.t(t.d("image.height",c,p,0)));t.b("px; width: ");t.b(t.t(t.d("image.width",c,p,0)));t.b("px\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button glyph-only\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteGroupHeader'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");if(t.s(t.f("isAddonHeader",c,p,1),c,p,0,18,218,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("	<div class=\"group-header addon-emotes-header\" title=\"Below are emotes added by an addon. Only those who also have the same addon installed can see these emotes in chat.\">\r");t.b("\n" + i);t.b("		Addon Emotes\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);});c.pop();}t.b("\r");t.b("\n" + i);if(!t.s(t.f("isAddonHeader",c,p,1),c,p,1,0,0,"")){t.b("	<div class=\"group-header\" data-emote-channel=\"");t.b(t.v(t.f("channel",c,p,0)));t.b("\"><img src=\"");t.b(t.v(t.f("badge",c,p,0)));t.b("\" />");t.b(t.v(t.f("channel",c,p,0)));t.b("</div>\r");t.b("\n" + i);};return t.fl(); },partials: {}, subs: {  }});
    templates['menu'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote-menu dropmenu\" id=\"emote-menu-for-twitch\">\r");t.b("\n" + i);t.b("	<div class=\"draggable\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"group-header\">All Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container scrollable\" id=\"all-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"group-header\">Popular Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container single-row\" id=\"popular-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"footer\">\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-home\" href=\"http://cletusc.github.io/Userscript--Twitch-Chat-Emotes\" target=\"_blank\" title=\"Visit the homepage where you can donate, post a review, or contact the developer\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-pin\" data-command=\"toggle-pinned\" title=\"Pin/unpin the emote menu to the screen\"></a>\r");t.b("\n" + i);t.b("		<a title=\"Reset the popularity of the emotes back to default\" data-command=\"reset-popularity\">Reset Popularity</a>\r");t.b("\n" + i);t.b("		<a class=\"pull-right icon icon-resize-handle\" data-command=\"resize-handle\"></a>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['newsMessage'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("\r");t.b("\n" + i);t.b("<div class=\"twitch-chat-emotes-news\">\r");t.b("\n" + i);t.b("	[");t.b(t.v(t.f("scriptName",c,p,0)));t.b("] News: ");t.b(t.t(t.f("message",c,p,0)));t.b(" (<a href=\"#\" data-command=\"twitch-chat-emotes:dismiss-news\" data-news-id=\"");t.b(t.v(t.f("id",c,p,0)));t.b("\">Dismiss</a>)\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    return templates;
})();
},{"hogan.js/lib/template.js":4}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
module.exports={
	"name": "twitch-chat-emotes",
	"version": "0.6.3",
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
		"watchify": "^1.0.1"
	},
	"napa": {
		"jquery-custom-scrollbar": "mzubala/jquery-custom-scrollbar#0.5.5"
	}
}

},{}],7:[function(require,module,exports){
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

},{"../../build/templates":3}],8:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxVc2Vyc1xcQ2xldHVzXFxQcm9qZWN0c1xcVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIi4vc3JjL3NjcmlwdC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvYnVpbGQvc3R5bGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9ob2dhbi5qcy9saWIvdGVtcGxhdGUuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9qcXVlcnktY3VzdG9tLXNjcm9sbGJhci9qcXVlcnkuY3VzdG9tLXNjcm9sbGJhci5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvcGFja2FnZS5qc29uIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9wbHVnaW5zL3Jlc2l6YWJsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1c0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3p3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy90ZW1wbGF0ZXMnKTtcclxudmFyIHBrZyA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xyXG52YXIgJCA9IG51bGw7XHJcbnZhciBqUXVlcnkgPSBudWxsO1xyXG5cclxuLy8gU2NyaXB0LXdpZGUgdmFyaWFibGVzLlxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbnZhciBlbW90ZXMgPSB7XHJcblx0dXNhYmxlOiBbXSxcclxuXHRnZXQgcmF3KCkge1xyXG5cdFx0aWYgKHdpbmRvdy5BcHApIHtcclxuXHRcdFx0cmV0dXJuIHdpbmRvdy5BcHAuX19jb250YWluZXJfXy5sb29rdXAoJ2NvbnRyb2xsZXI6ZW1vdGljb25zJykuZ2V0KCdlbW90aWNvbnMnKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBbXTtcclxuXHR9LFxyXG5cdHN1YnNjcmlwdGlvbnM6IHtcclxuXHRcdGJhZGdlczoge30sXHJcblx0XHRlbW90ZXM6IHt9XHJcblx0fVxyXG59O1xyXG52YXIgZW1vdGVQb3B1bGFyaXR5ID0gZmFsc2U7XHJcbnZhciBpc0luaXRpYXRlZCA9IGZhbHNlO1xyXG5cclxuLy8gRE9NIGVsZW1lbnRzLlxyXG52YXIgZWxlbWVudHMgPSB7XHJcblx0Ly8gVGhlIGJ1dHRvbiB0byBzZW5kIGEgY2hhdCBtZXNzYWdlLlxyXG5cdGNoYXRCdXR0b246IG51bGwsXHJcblx0Ly8gVGhlIGFyZWEgd2hlcmUgYWxsIGNoYXQgbWVzc2FnZXMgYXJlIGNvbnRhaW5lZC5cclxuXHRjaGF0Q29udGFpbmVyOiBudWxsLFxyXG5cdC8vIFRoZSBpbnB1dCBmaWVsZCBmb3IgY2hhdCBtZXNzYWdlcy5cclxuXHRjaGF0Qm94OiBudWxsLFxyXG5cdC8vIFRoZSBidXR0b24gdXNlZCB0byBzaG93IHRoZSBtZW51LlxyXG5cdG1lbnVCdXR0b246IG51bGwsXHJcblx0Ly8gVGhlIG1lbnUgdGhhdCBjb250YWlucyBhbGwgZW1vdGVzLlxyXG5cdG1lbnU6IG51bGxcclxufTtcclxuXHJcbnZhciBTQ1JJUFRfTkFNRSA9IHBrZy51c2Vyc2NyaXB0Lm5hbWU7XHJcbnZhciBNRVNTQUdFUyA9IHtcclxuXHROT19DSEFUX0VMRU1FTlQ6ICdUaGVyZSBpcyBubyBjaGF0IGVsZW1lbnQgb24gdGhlIHBhZ2UsIHVuYWJsZSB0byBjb250aW51ZS4nLFxyXG5cdE9CSkVDVFNfTk9UX0xPQURFRDogJ05lZWRlZCBvYmplY3RzIGhhdmVuXFwndCBsb2FkZWQgeWV0LicsXHJcblx0VElNRU9VVF9TQ1JJUFRfTE9BRDogJ1NjcmlwdCB0b29rIHRvbyBsb25nIHRvIGxvYWQuIFJlZnJlc2ggdG8gdHJ5IGFnYWluLidcclxufTtcclxuXHJcbnZhciBoZWxwZXJzID0ge1xyXG5cdHVzZXI6IHtcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2sgaWYgdXNlciBpcyBsb2dnZWQgaW4sIGFuZCBwcm9tcHRzIHRoZW0gdG8gaWYgdGhleSBhcmVuJ3QuXHJcblx0XHQgKiBAcmV0dXJuIHtib29sZWFufSBgdHJ1ZWAgaWYgbG9nZ2VkIGluLCBgZmFsc2VgIGlmIGxvZ2dlZCBvdXQuXHJcblx0XHQgKi9cclxuXHRcdGxvZ2luOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdC8vIENoZWNrIGlmIGxvZ2dlZCBpbiBhbHJlYWR5LlxyXG5cdFx0XHRpZiAod2luZG93LlR3aXRjaCAmJiB3aW5kb3cuVHdpdGNoLnVzZXIuaXNMb2dnZWRJbigpKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gTm90IGxvZ2dlZCBpbiwgY2FsbCBUd2l0Y2gncyBsb2dpbiBtZXRob2QuXHJcblx0XHRcdCQubG9naW4oKTtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1x0XHJcblx0XHR9XHJcblx0fVxyXG59O1xyXG5cclxuLy8gUXVpY2sgbWFuaXB1bGF0aW9uIG9mIHNjcmlwdC13aWRlIHZhcmlhYmxlcy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gUHJlZml4IGFsbCBtZXNzYWdlcyB3aXRoIHNjcmlwdCBuYW1lLlxyXG5mb3IgKHZhciBtZXNzYWdlIGluIE1FU1NBR0VTKSB7XHJcblx0aWYgKE1FU1NBR0VTLmhhc093blByb3BlcnR5KG1lc3NhZ2UpKSB7XHJcblx0XHRNRVNTQUdFU1ttZXNzYWdlXSA9ICdbJyArIFNDUklQVF9OQU1FICsgJ106ICcgKyBNRVNTQUdFU1ttZXNzYWdlXTtcclxuXHR9XHJcbn1cclxuXHJcbi8vIE9ubHkgZW5hYmxlIHNjcmlwdCBpZiB3ZSBoYXZlIHRoZSByaWdodCB2YXJpYWJsZXMuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbihmdW5jdGlvbiBpbml0KHRpbWUpIHtcclxuXHQkID0galF1ZXJ5ID0gd2luZG93LmpRdWVyeTtcclxuXHR2YXIgcm91dGVzID0gd2luZG93LkFwcCAmJiAod2luZG93LkFwcC5DaGFubmVsUm91dGUgfHwgd2luZG93LkFwcC5DaGF0Um91dGUpO1xyXG5cdHZhciBvYmplY3RzTG9hZGVkID0gKFxyXG5cdFx0d2luZG93LlR3aXRjaCAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHQoXHJcblx0XHRcdHdpbmRvdy5BcHAgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0XHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18gIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0XHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdjb250cm9sbGVyOmVtb3RpY29ucycpLmdldCgnZW1vdGljb25zJykgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0XHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdjb250cm9sbGVyOmVtb3RpY29ucycpLmdldCgnZW1vdGljb25zJykubGVuZ3RoXHJcblx0XHQpICYmXHJcblx0XHRqUXVlcnkgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0Ly8gQ2hhdCBidXR0b24uXHJcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2hhdF9zcGVhaywgLnNlbmQtY2hhdC1idXR0b24nKVxyXG5cdCk7XHJcblx0aWYgKCFpc0luaXRpYXRlZCAmJiByb3V0ZXMpIHtcclxuXHRcdHZhciBhY3RpdmF0ZSA9IHtcclxuXHRcdFx0YWN0aXZhdGU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR0aGlzLl9zdXBlcigpO1xyXG5cdFx0XHRcdGluaXQoNTApO1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdGlmICh3aW5kb3cuQXBwLkNoYW5uZWxSb3V0ZSkge1xyXG5cdFx0XHR3aW5kb3cuQXBwLkNoYW5uZWxSb3V0ZS5yZW9wZW4oYWN0aXZhdGUpO1xyXG5cdFx0XHRpc0luaXRpYXRlZCA9IHRydWU7XHJcblx0XHR9XHJcblx0XHRpZiAod2luZG93LkFwcC5DaGF0Um91dGUpIHtcclxuXHRcdFx0d2luZG93LkFwcC5DaGF0Um91dGUucmVvcGVuKGFjdGl2YXRlKTtcclxuXHRcdFx0aXNJbml0aWF0ZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRpZiAoIW9iamVjdHNMb2FkZWQgfHwgIXJvdXRlcykge1xyXG5cdFx0Ly8gRXJyb3JzIGluIGFwcHJveGltYXRlbHkgMTAyNDAwbXMuXHJcblx0XHRpZiAodGltZSA+PSA2MDAwMCkge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKE1FU1NBR0VTLlRJTUVPVVRfU0NSSVBUX0xPQUQpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpZiAodGltZSA+PSAxMDAwMCkge1xyXG5cdFx0XHRpZiAoIW9iamVjdHNMb2FkZWQpIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oTUVTU0FHRVMuT0JKRUNUU19OT1RfTE9BREVEKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0c2V0VGltZW91dChpbml0LCB0aW1lLCB0aW1lICogMik7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHNldHVwKCk7XHJcbn0pKDUwKTtcclxuXHJcbi8vIFN0YXJ0IG9mIGZ1bmN0aW9ucy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vKipcclxuICogUnVucyBpbml0aWFsIHNldHVwIG9mIERPTSBhbmQgdmFyaWFibGVzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcblx0Ly8gTG9hZCBDU1MuXHJcblx0cmVxdWlyZSgnLi4vYnVpbGQvc3R5bGVzJyk7XHJcblx0Ly8gTG9hZCBqUXVlcnkgcGx1Z2lucy5cclxuXHRyZXF1aXJlKCcuL3BsdWdpbnMvcmVzaXphYmxlJyk7XHJcblx0cmVxdWlyZSgnanF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXIvanF1ZXJ5LmN1c3RvbS1zY3JvbGxiYXInKTtcclxuXHRcclxuXHRlbGVtZW50cy5jaGF0QnV0dG9uID0gJCgnLnNlbmQtY2hhdC1idXR0b24nKTtcclxuXHRlbGVtZW50cy5jaGF0Qm94ID0gJCgnLmNoYXQtaW50ZXJmYWNlIHRleHRhcmVhJyk7XHJcblx0ZWxlbWVudHMuY2hhdENvbnRhaW5lciA9ICQoJy5jaGF0LW1lc3NhZ2VzJyk7XHJcblxyXG5cdC8vIE5vIGNoYXQsIGp1c3QgZXhpdC5cclxuXHRpZiAoIWVsZW1lbnRzLmNoYXRCdXR0b24ubGVuZ3RoKSB7XHJcblx0XHRjb25zb2xlLndhcm4oTUVTU0FHRVMuTk9fQ0hBVF9FTEVNRU5UKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdGNyZWF0ZU1lbnVFbGVtZW50cygpO1xyXG5cdGJpbmRMaXN0ZW5lcnMoKTtcclxuXHRzaG93TmV3cygpO1xyXG5cclxuXHQvLyBHZXQgYWN0aXZlIHN1YnNjcmlwdGlvbnMuXHJcblx0d2luZG93LlR3aXRjaC5hcGkuZ2V0KFxyXG5cdFx0Jy9hcGkvdXNlcnMvOmxvZ2luL3RpY2tldHMnLFxyXG5cdFx0e1xyXG5cdFx0XHRvZmZzZXQ6IDAsXHJcblx0XHRcdGxpbWl0OiAxMDAsXHJcblx0XHRcdHVuZW5kZWQ6IHRydWVcclxuXHRcdH1cclxuXHQpLmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0YXBpLnRpY2tldHMuZm9yRWFjaChmdW5jdGlvbiAodGlja2V0KSB7XHJcblx0XHRcdC8vIEdldCBzdWJzY3JpcHRpb25zIHdpdGggZW1vdGVzLlxyXG5cdFx0XHRpZiAodGlja2V0LnByb2R1Y3QuZW1vdGljb25zICYmIHRpY2tldC5wcm9kdWN0LmVtb3RpY29ucy5sZW5ndGgpIHtcclxuXHRcdFx0XHR2YXIgYmFkZ2UgPSB0aWNrZXQucHJvZHVjdC5mZWF0dXJlcy5iYWRnZTtcclxuXHRcdFx0XHR2YXIgY2hhbm5lbCA9IHRpY2tldC5wcm9kdWN0Lm93bmVyX25hbWU7XHJcblx0XHRcdFx0Ly8gQWRkIGNoYW5uZWwgYmFkZ2VzLlxyXG5cdFx0XHRcdGlmIChiYWRnZSkge1xyXG5cdFx0XHRcdFx0YmFkZ2UgPSAnaHR0cDovL3N0YXRpYy1jZG4uanR2bncubmV0L2p0dl91c2VyX3BpY3R1cmVzLycgKyBbYmFkZ2UucHJlZml4LCBiYWRnZS5vd25lciwgYmFkZ2UudHlwZSwgYmFkZ2UudWlkLCBiYWRnZS5zaXplc1swXV0uam9pbignLScpICsgJy4nICsgYmFkZ2UuZm9ybWF0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGJhZGdlID0gJ2h0dHBzOi8vc3RhdGljLWNkbi5qdHZudy5uZXQvanR2X3VzZXJfcGljdHVyZXMvc3Vic2NyaWJlci1zdGFyLnBuZyc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1tjaGFubmVsXSA9IGJhZGdlO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdC8vIEFkZCBlbW90ZXMgY2hhbm5lbC5cclxuXHRcdFx0XHR0aWNrZXQucHJvZHVjdC5lbW90aWNvbnMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRcdGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tnZXRFbW90ZUZyb21SZWdFeChuZXcgUmVnRXhwKGVtb3RlLnJlZ2V4KSldID0ge1xyXG5cdFx0XHRcdFx0XHRjaGFubmVsOiBjaGFubmVsLFxyXG5cdFx0XHRcdFx0XHR1cmw6IGVtb3RlLnVybFxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBpbml0aWFsIG1lbnUgZWxlbWVudHNcclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZU1lbnVFbGVtZW50cygpIHtcclxuXHQvLyBSZW1vdmUgbWVudSBidXR0b24gaWYgZm91bmQuXHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbiA9ICQoJyNlbW90ZS1tZW51LWJ1dHRvbicpO1xyXG5cdGlmIChlbGVtZW50cy5tZW51QnV0dG9uLmxlbmd0aCkge1xyXG5cdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5yZW1vdmUoKTtcclxuXHR9XHJcblx0Ly8gQ3JlYXRlIG1lbnUgYnV0dG9uLlxyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24gPSAkKHRlbXBsYXRlcy5lbW90ZUJ1dHRvbigpKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmluc2VydEJlZm9yZShlbGVtZW50cy5jaGF0QnV0dG9uKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmhpZGUoKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmZhZGVJbigpO1xyXG5cclxuXHQvLyBSZW1vdmUgbWVudSBpZiBmb3VuZC5cclxuXHRlbGVtZW50cy5tZW51ID0gJCgnI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCcpO1xyXG5cdGlmIChlbGVtZW50cy5tZW51Lmxlbmd0aCkge1xyXG5cdFx0ZWxlbWVudHMubWVudS5yZW1vdmUoKTtcclxuXHR9XHJcblx0Ly8gQ3JlYXRlIG1lbnUuXHJcblx0ZWxlbWVudHMubWVudSA9ICQodGVtcGxhdGVzLm1lbnUoKSk7XHJcblx0ZWxlbWVudHMubWVudS5hcHBlbmRUbyhkb2N1bWVudC5ib2R5KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEJpbmQgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gYmluZExpc3RlbmVycygpIHtcclxuXHJcblx0ZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcclxuXHRcdC8vIE1lbnUgc2hvd24sIGhpZGUgaXQuXHJcblx0XHRpZiAoZWxlbWVudHMubWVudS5pcygnOnZpc2libGUnKSkge1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LmhpZGUoKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5yZW1vdmVDbGFzcygncGlubmVkJyk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnVCdXR0b24ucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gTWVudSBoaWRkZW4sIHNob3cgaXQuXHJcblx0XHRlbHNlIGlmIChoZWxwZXJzLnVzZXIubG9naW4oKSkge1xyXG5cdFx0XHRwb3B1bGF0ZUVtb3Rlc01lbnUoKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5zaG93KCk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnVCdXR0b24uYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNldXAnLCBjaGVja0ZvckNsaWNrT3V0c2lkZSk7XHJcblxyXG5cdFx0XHQvLyBNZW51IG1vdmVkLCBtb3ZlIGl0IGJhY2suXHJcblx0XHRcdGlmIChlbGVtZW50cy5tZW51Lmhhc0NsYXNzKCdtb3ZlZCcpKSB7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5vZmZzZXQoSlNPTi5wYXJzZShlbGVtZW50cy5tZW51LmF0dHIoJ2RhdGEtb2Zmc2V0JykpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBOZXZlciBtb3ZlZCwgbWFrZSBpdCB0aGUgc2FtZSBzaXplIGFzIHRoZSBjaGF0IHdpbmRvdy5cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0dmFyIGRpZmYgPSBlbGVtZW50cy5tZW51LmhlaWdodCgpIC0gZWxlbWVudHMubWVudS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpLmhlaWdodCgpO1xyXG5cdFx0XHRcdC8vIEFkanVzdCB0aGUgc2l6ZSBhbmQgcG9zaXRpb24gb2YgdGhlIHBvcHVwLlxyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUuaGVpZ2h0KGVsZW1lbnRzLmNoYXRDb250YWluZXIub3V0ZXJIZWlnaHQoKSAtIChlbGVtZW50cy5tZW51Lm91dGVySGVpZ2h0KCkgLSBlbGVtZW50cy5tZW51LmhlaWdodCgpKSk7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS53aWR0aChlbGVtZW50cy5jaGF0Q29udGFpbmVyLm91dGVyV2lkdGgoKSAtIChlbGVtZW50cy5tZW51Lm91dGVyV2lkdGgoKSAtIGVsZW1lbnRzLm1lbnUud2lkdGgoKSkpO1xyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUub2Zmc2V0KGVsZW1lbnRzLmNoYXRDb250YWluZXIub2Zmc2V0KCkpO1xyXG5cdFx0XHRcdC8vIEZpeCBgLmVtb3Rlcy1hbGxgIGhlaWdodC5cclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykuaGVpZ2h0KGVsZW1lbnRzLm1lbnUuaGVpZ2h0KCkgLSBkaWZmKTtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykud2lkdGgoZWxlbWVudHMubWVudS53aWR0aCgpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBSZWNhbGN1bGF0ZSBhbnkgc2Nyb2xsIGJhcnMuXHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnLnNjcm9sbGFibGUnKS5jdXN0b21TY3JvbGxiYXIoJ3Jlc2l6ZScpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKGUpIHtcclxuXHRcdFx0Ly8gTm90IG91dHNpZGUgb2YgdGhlIG1lbnUsIGlnbm9yZSB0aGUgY2xpY2suXHJcblx0XHRcdGlmICgkKGUudGFyZ2V0KS5pcygnI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCwgI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCAqJykpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gQ2xpY2tlZCBvbiB0aGUgbWVudSBidXR0b24sIGp1c3QgcmVtb3ZlIHRoZSBsaXN0ZW5lciBhbmQgbGV0IHRoZSBub3JtYWwgbGlzdGVuZXIgaGFuZGxlIGl0LlxyXG5cdFx0XHRpZiAoIWVsZW1lbnRzLm1lbnUuaXMoJzp2aXNpYmxlJykgfHwgJChlLnRhcmdldCkuaXMoJyNlbW90ZS1tZW51LWJ1dHRvbiwgI2Vtb3RlLW1lbnUtYnV0dG9uIConKSkge1xyXG5cdFx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gQ2xpY2tlZCBvdXRzaWRlLCBtYWtlIHN1cmUgdGhlIG1lbnUgaXNuJ3QgcGlubmVkLlxyXG5cdFx0XHRpZiAoIWVsZW1lbnRzLm1lbnUuaGFzQ2xhc3MoJ3Bpbm5lZCcpKSB7XHJcblx0XHRcdFx0Ly8gTWVudSB3YXNuJ3QgcGlubmVkLCByZW1vdmUgbGlzdGVuZXIuXHJcblx0XHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgY2hlY2tGb3JDbGlja091dHNpZGUpO1xyXG5cdFx0XHRcdHRvZ2dsZU1lbnUoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gVG9nZ2xlIG1lbnUuXHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbi5vbignY2xpY2snLCB0b2dnbGVNZW51KTtcclxuXHJcblx0Ly8gTWFrZSBkcmFnZ2FibGUuXHJcblx0ZWxlbWVudHMubWVudS5kcmFnZ2FibGUoe1xyXG5cdFx0aGFuZGxlOiAnLmRyYWdnYWJsZScsXHJcblx0XHRzdGFydDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdwaW5uZWQnKTtcclxuXHRcdFx0JCh0aGlzKS5hZGRDbGFzcygnbW92ZWQnKTtcclxuXHRcdH0sXHJcblx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuYXR0cignZGF0YS1vZmZzZXQnLCBKU09OLnN0cmluZ2lmeShlbGVtZW50cy5tZW51Lm9mZnNldCgpKSk7XHJcblx0XHR9LFxyXG5cdFx0Y29udGFpbm1lbnQ6ICQoZG9jdW1lbnQuYm9keSlcclxuXHR9KTtcclxuXHJcblx0ZWxlbWVudHMubWVudS5yZXNpemFibGUoe1xyXG5cdFx0aGFuZGxlOiAnW2RhdGEtY29tbWFuZD1cInJlc2l6ZS1oYW5kbGVcIl0nLFxyXG5cdFx0cmVzaXplOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdC8vIFJlY2FsY3VsYXRlIGFueSBzY3JvbGwgYmFycy5cclxuXHRcdFx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcigncmVzaXplJyk7XHJcblx0XHR9LFxyXG5cdFx0c3RvcDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdwaW5uZWQnKTtcclxuXHRcdFx0JCh0aGlzKS5hZGRDbGFzcygnbW92ZWQnKTtcclxuXHRcdH0sXHJcblx0XHRhbHNvUmVzaXplOiBlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJyksXHJcblx0XHRjb250YWlubWVudDogJChkb2N1bWVudC5ib2R5KSxcclxuXHRcdG1pbkhlaWdodDogMTgwLFxyXG5cdFx0bWluV2lkdGg6IDIwMFxyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgdGhlIHBvcHVsYXJpdHkgcmVzZXQuXHJcblx0ZWxlbWVudHMubWVudS5maW5kKCdbZGF0YS1jb21tYW5kPVwicmVzZXQtcG9wdWxhcml0eVwiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGVtb3RlUG9wdWxhcml0eUNsZWFyKCk7XHJcblx0XHRwb3B1bGF0ZUVtb3Rlc01lbnUoKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIG1lbnUgcGlubmluZy5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtcGlubmVkXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0ZWxlbWVudHMubWVudS50b2dnbGVDbGFzcygncGlubmVkJyk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBlbW90ZSBjbGlja2luZyAoZGVsZWdhdGVkKS5cclxuXHRlbGVtZW50cy5tZW51Lm9uKCdjbGljaycsICcuZW1vdGUnLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRpbnNlcnRFbW90ZVRleHQoJCh0aGlzKS5hdHRyKCdkYXRhLWVtb3RlJykpO1xyXG5cdH0pO1xyXG5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJykuY3VzdG9tU2Nyb2xsYmFyKHtcclxuXHRcdHNraW46ICdkZWZhdWx0LXNraW4nLFxyXG5cdFx0aFNjcm9sbDogZmFsc2UsXHJcblx0XHRwcmV2ZW50RGVmYXVsdFNjcm9sbDogdHJ1ZVxyXG5cdH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUG9wdWxhdGVzIHRoZSBwb3B1cCBtZW51IHdpdGggY3VycmVudCBlbW90ZSBkYXRhLlxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdWxhdGVFbW90ZXNNZW51KCkge1xyXG5cdHZhciBjb250YWluZXI7XHJcblxyXG5cdHJlZnJlc2hVc2FibGVFbW90ZXMoKTtcclxuXHJcblx0Ly8gQWRkIHBvcHVsYXIgZW1vdGVzLlxyXG5cdGNvbnRhaW5lciA9IGVsZW1lbnRzLm1lbnUuZmluZCgnI3BvcHVsYXItZW1vdGVzLWdyb3VwJyk7XHJcblx0Y29udGFpbmVyLmh0bWwoJycpO1xyXG5cdGVtb3Rlcy51c2FibGUuc29ydChzb3J0QnlQb3B1bGFyaXR5KTtcclxuXHRlbW90ZXMudXNhYmxlLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gQWRkIGFsbCBlbW90ZXMuXHJcblx0Y29udGFpbmVyID0gZWxlbWVudHMubWVudS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpO1xyXG5cdGlmIChjb250YWluZXIuZmluZCgnLm92ZXJ2aWV3JykubGVuZ3RoKSB7XHJcblx0XHRjb250YWluZXIgPSBjb250YWluZXIuZmluZCgnLm92ZXJ2aWV3Jyk7XHJcblx0fVxyXG5cdGNvbnRhaW5lci5odG1sKCcnKTtcclxuXHRlbW90ZXMudXNhYmxlLnNvcnQoc29ydEJ5U2V0KTtcclxuXHRlbW90ZXMudXNhYmxlLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyLCB0cnVlKTtcclxuXHR9KTtcclxuXHJcblx0LyoqXHJcblx0ICogU29ydCBieSBwb3B1bGFyaXR5OiBtb3N0IHVzZWQgLT4gbGVhc3QgdXNlZFxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHNvcnRCeVBvcHVsYXJpdHkoYSwgYikge1xyXG5cdFx0dmFyIGFHZXQgPSBlbW90ZVBvcHVsYXJpdHlHZXQoYS50ZXh0KTtcclxuXHRcdHZhciBiR2V0ID0gZW1vdGVQb3B1bGFyaXR5R2V0KGIudGV4dCk7XHJcblx0XHR2YXIgYU51bWJlciA9IHR5cGVvZiBhR2V0ID09PSAnbnVtYmVyJztcclxuXHRcdHZhciBiTnVtYmVyID0gdHlwZW9mIGJHZXQgPT09ICdudW1iZXInO1xyXG5cdFx0aWYgKGFOdW1iZXIgJiYgIWJOdW1iZXIpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGJOdW1iZXIgJiYgIWFOdW1iZXIpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAoYUdldCA8IGJHZXQpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAoYUdldCA+IGJHZXQpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHNvcnRCeU5vcm1hbChhLCBiKTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgYWxwaGFudW1lcmljIGluIHRoaXMgb3JkZXI6IHN5bWJvbHMgLT4gbnVtYmVycyAtPiBBYUJiLi4uIC0+IG51bWJlcnNcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBzb3J0QnlOb3JtYWwoYSwgYil7XHJcblx0XHRhID0gYS50ZXh0O1xyXG5cdFx0YiA9IGIudGV4dDtcclxuXHRcdGlmIChhLnRvTG93ZXJDYXNlKCkgPCBiLnRvTG93ZXJDYXNlKCkpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGEudG9Mb3dlckNhc2UoKSA+IGIudG9Mb3dlckNhc2UoKSkge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdGlmIChhIDwgYikge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYSA+IGIpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgZW1vdGljb24gc2V0OiBiYXNpYyBzbWlsZXlzIC0+IG5vIHNldCAtPiBzdWJzY3JpcHRpb24gZW1vdGVzXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gc29ydEJ5U2V0KGEsIGIpe1xyXG5cdFx0Ly8gT3ZlcnJpZGUgZm9yIHR1cmJvIGVtb3Rlcy5cclxuXHRcdGlmIChcclxuXHRcdFx0KGEuY2hhbm5lbCAmJiBhLmNoYW5uZWwgPT09ICdUd2l0Y2ggVHVyYm8nKSAmJlxyXG5cdFx0XHQoIWIuY2hhbm5lbCB8fCAoYi5jaGFubmVsICYmIGIuY2hhbm5lbCAhPT0gJ1R3aXRjaCBUdXJibycpKVxyXG5cdFx0KSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdGlmIChcclxuXHRcdFx0KGIuY2hhbm5lbCAmJiBiLmNoYW5uZWwgPT09ICdUd2l0Y2ggVHVyYm8nKSAmJlxyXG5cdFx0XHQoIWEuY2hhbm5lbCB8fCAoYS5jaGFubmVsICYmIGEuY2hhbm5lbCAhPT0gJ1R3aXRjaCBUdXJibycpKVxyXG5cdFx0KSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0Ly8gT3ZlcnJpZGUgZm9yIGJhc2ljIGVtb3Rlcy5cclxuXHRcdHZhciBiYXNpY0Vtb3RlcyA9IFsnOignLCAnOiknLCAnOi8nLCAnOkQnLCAnOm8nLCAnOnAnLCAnOnonLCAnOyknLCAnO3AnLCAnPDMnLCAnPignLCAnQiknLCAnUiknLCAnb19vJywgJyMvJywgJzo3JywgJzo+JywgJzpTJywgJzxdJ107XHJcblx0XHRpZiAoYmFzaWNFbW90ZXMuaW5kZXhPZihhLnRleHQpID49IDAgJiZcdGJhc2ljRW1vdGVzLmluZGV4T2YoYi50ZXh0KSA8IDApIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGJhc2ljRW1vdGVzLmluZGV4T2YoYi50ZXh0KSA+PSAwICYmXHRiYXNpY0Vtb3Rlcy5pbmRleE9mKGEudGV4dCkgPCAwKSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0Ly8gU29ydCBieSBjaGFubmVsIG5hbWUuXHJcblx0XHRpZiAoYS5jaGFubmVsICYmICFiLmNoYW5uZWwpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAoYi5jaGFubmVsICYmICFhLmNoYW5uZWwpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGEuY2hhbm5lbCAmJiBiLmNoYW5uZWwpIHtcclxuXHRcdFx0Ly8gRm9yY2UgYWRkb24gZW1vdGUgZ3JvdXBzIGJlbG93IHN0YW5kYXJkIFR3aXRjaCBncm91cHMuXHJcblx0XHRcdGlmIChlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbYS5jaGFubmVsXSAmJiAhZW1vdGVzLnN1YnNjcmlwdGlvbnMuYmFkZ2VzW2IuY2hhbm5lbF0pIHtcclxuXHRcdFx0XHRyZXR1cm4gLTE7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1tiLmNoYW5uZWxdICYmICFlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbYS5jaGFubmVsXSkge1xyXG5cdFx0XHRcdHJldHVybiAxO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgY2hhbm5lbFNvcnQgPSBzb3J0QnlOb3JtYWwoe3RleHQ6IGEuY2hhbm5lbH0sIHt0ZXh0OiBiLmNoYW5uZWx9KTtcclxuXHRcdFx0dmFyIG5vcm1hbFNvcnQgPSBzb3J0QnlOb3JtYWwoYSwgYik7XHJcblx0XHRcdGlmIChjaGFubmVsU29ydCA9PT0gMCkge1xyXG5cdFx0XHRcdHJldHVybiBub3JtYWxTb3J0O1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBjaGFubmVsU29ydDtcclxuXHRcdH1cclxuXHRcdC8vIEdldCBpdCBiYWNrIHRvIGEgc3RhYmxlIHNvcnQuXHJcblx0XHRyZXR1cm4gc29ydEJ5Tm9ybWFsKGEsIGIpO1xyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlZnJlc2hlcyB0aGUgdXNhYmxlIGVtb3Rlcy4gQW4gZW1vdGUgaXMgZGVlbWVkIHVzYWJsZSBpZiBpdCBlaXRoZXIgaGFzIG5vIHNldCBvciB0aGUgc2V0IGlzIGluIHlvdXIgdXNlciBpbmZvLiBGb3IgdHVyYm8gc2V0cywgaXQgd2lsbCB1c2UgdGhlIHR1cmJvIGlmIGluIHlvdXIgdXNlciBpbmZvLCBvdGhlcndpc2UgZmFsbCBiYWNrIHRvIGRlZmF1bHQuXHJcbiAqL1xyXG5mdW5jdGlvbiByZWZyZXNoVXNhYmxlRW1vdGVzKCkge1xyXG5cdGVtb3Rlcy51c2FibGUgPSBbXTtcclxuXHRlbW90ZXMucmF3LmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHQvLyBBbGxvdyBoaWRpbmcgb2YgZW1vdGVzIGZyb20gdGhlIG1lbnUuXHJcblx0XHRpZiAoZW1vdGUuaGlkZGVuKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGlmICghZW1vdGUudGV4dCkge1xyXG5cdFx0XHRlbW90ZS50ZXh0ID0gZ2V0RW1vdGVGcm9tUmVnRXgoZW1vdGUucmVnZXgpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSkge1xyXG5cdFx0XHRlbW90ZS5jaGFubmVsID0gZW1vdGVzLnN1YnNjcmlwdGlvbnMuZW1vdGVzW2Vtb3RlLnRleHRdLmNoYW5uZWw7XHJcblx0XHR9XHJcblx0XHR2YXIgZGVmYXVsdEltYWdlO1xyXG5cdFx0ZW1vdGUuaW1hZ2VzLnNvbWUoZnVuY3Rpb24gKGltYWdlKSB7XHJcblx0XHRcdGlmIChpbWFnZS5lbW90aWNvbl9zZXQgPT09IG51bGwpIHtcclxuXHRcdFx0XHRkZWZhdWx0SW1hZ2UgPSBpbWFnZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoXHJcblx0XHRcdFx0Ly8gSW1hZ2UgaXMgdGhlIHNhbWUgVVJMIGFzIHRoZSBzdWJzY3JpcHRpb24gZW1vdGUuXHJcblx0XHRcdFx0KGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSAmJiBpbWFnZS51cmwgPT09IGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XS51cmwpIHx8XHJcblx0XHRcdFx0Ly8gRW1vdGUgaXMgZm9yY2VkIHRvIHNob3cuXHJcblx0XHRcdFx0ZW1vdGUuaGlkZGVuID09PSBmYWxzZVxyXG5cdFx0XHQpIHtcclxuXHRcdFx0XHRlbW90ZS5pbWFnZSA9IGltYWdlO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdGVtb3RlLmltYWdlID0gZW1vdGUuaW1hZ2UgfHwgZGVmYXVsdEltYWdlO1xyXG5cclxuXHRcdC8vIE9ubHkgYWRkIHRoZSBlbW90ZSBpZiB0aGVyZSBpcyBhIFVSTC5cclxuXHRcdGlmIChlbW90ZS5pbWFnZSAmJiBlbW90ZS5pbWFnZS51cmwgIT09IG51bGwpIHtcclxuXHRcdFx0ZW1vdGVzLnVzYWJsZS5wdXNoKGVtb3RlKTtcclxuXHRcdH1cclxuXHR9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZHMgLyBzZXRzIHBvcHVsYXJpdHkgb2YgYW4gZW1vdGUuIE5vdGU6IHNhdmVzIHBvcHVsYXJpdHkgZGF0YSB0byBzdG9yYWdlIGVhY2ggdGltZSB0aGlzIGlzIGNhbGxlZC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgICAgICAgICAgVGhlIHRleHQgb2YgdGhlIGVtb3RlIChlLmcuIFwiS2FwcGFcIikuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbZm9yY2VBbW91bnRdIFRoZSBhbW91bnQgb2YgcG9wdWxhcml0eSB0byBmb3JjZSB0aGUgZW1vdGUgdG8gaGF2ZS4gSWYgbm90IHNwZWNpZmljZWQsIHBvcHVsYXJpdHkgd2lsbCBpbmNyZWFzZSBieSAxLlxyXG4gKi9cclxuZnVuY3Rpb24gZW1vdGVQb3B1bGFyaXR5QWRkKHRleHQsIGZvcmNlQW1vdW50KSB7XHJcblx0ZW1vdGVQb3B1bGFyaXR5SW5pdCgpO1xyXG5cdGlmIChlbW90ZVBvcHVsYXJpdHlbdGV4dF0gPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5W3RleHRdID0gMDtcclxuXHR9XHJcblx0aWYgKHR5cGVvZiBmb3JjZUFtb3VudCA9PT0gJ251bWJlcicgJiYgZm9yY2VBbW91bnQgPj0gMCkge1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5W3RleHRdID0gZm9yY2VBbW91bnQ7XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5W3RleHRdKys7XHJcblx0fVxyXG5cdHNldFNldHRpbmcoJ2Vtb3RlLXBvcHVsYXJpdHktdHJhY2tpbmcnLCBKU09OLnN0cmluZ2lmeShlbW90ZVBvcHVsYXJpdHkpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGN1cnJlbnQgcG9wdWxhcml0eSBvZiBhbiBlbW90ZS5cclxuICogQHBhcmFtICB7c3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSAoZS5nLiBcIkthcHBhXCIpLlxyXG4gKiBAcmV0dXJuIHtudW1iZXJ9ICAgICAgVGhlIGFtb3VudCBvZiBwb3B1bGFyaXR5LiBQb3NzaWJsZSB0byBiZSAwIGlmIGl0IGhhcyBiZWVuIGZvcmNlZC5cclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgIGBmYWxzZWAgaWYgdGhlIGVtb3RlIGlzIG5vdCBpbiB0aGUgcG9wdWxhcml0eSB0cmFja2luZyBkYXRhIChuZXZlciBiZWVuIGFkZGVkIGJ5IGBlbW90ZVBvcHVsYXJpdHlBZGRgKS5cclxuICovXHJcbmZ1bmN0aW9uIGVtb3RlUG9wdWxhcml0eUdldCh0ZXh0KSB7XHJcblx0ZW1vdGVQb3B1bGFyaXR5SW5pdCgpO1xyXG5cdGlmICh0eXBlb2YgZW1vdGVQb3B1bGFyaXR5W3RleHRdID09PSAnbnVtYmVyJyAmJiBlbW90ZVBvcHVsYXJpdHlbdGV4dF0gPj0gMCkge1xyXG5cdFx0cmV0dXJuIGVtb3RlUG9wdWxhcml0eVt0ZXh0XTtcclxuXHR9XHJcblx0cmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vKipcclxuICogQ2xlYXJzIHRoZSBjdXJyZW50IGVtb3RlIHBvcHVsYXJpdHkgdHJhY2tpbmcgZGF0YS5cclxuICovXHJcbmZ1bmN0aW9uIGVtb3RlUG9wdWxhcml0eUNsZWFyKCkge1xyXG5cdGRlbGV0ZVNldHRpbmcoJ2Vtb3RlLXBvcHVsYXJpdHktdHJhY2tpbmcnKTtcclxuXHRlbW90ZVBvcHVsYXJpdHkgPSBmYWxzZTtcclxuXHRlbW90ZVBvcHVsYXJpdHlJbml0KCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbml0aWF0ZXMgdGhlIHBvcHVsYXJpdHkgdHJhY2tpbmcuIFRoaXMgd2lsbCBwdWxsIGRhdGEgZnJvbSBzdG9yYWdlLCBvciBpZiBub25lIGV4aXN0cywgc2V0IHNvbWUgY29tbW9uIGRlZmF1bHRzLlxyXG4gKi9cclxuZnVuY3Rpb24gZW1vdGVQb3B1bGFyaXR5SW5pdCgpIHtcclxuXHRpZiAoIWVtb3RlUG9wdWxhcml0eSkge1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5ID0gSlNPTi5wYXJzZShnZXRTZXR0aW5nKCdlbW90ZS1wb3B1bGFyaXR5LXRyYWNraW5nJywgJ3t9JykpO1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5QWRkKCdCaWJsZVRodW1wJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ0RhbnNHYW1lJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ0ZhaWxGaXNoJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ0thcHBhJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ0tyZXlnYXNtJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ1N3aWZ0UmFnZScsIDApO1xyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEluc2VydHMgYW4gZW1vdGUgaW50byB0aGUgY2hhdCBib3guXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSAoZS5nLiBcIkthcHBhXCIpLlxyXG4gKi9cclxuZnVuY3Rpb24gaW5zZXJ0RW1vdGVUZXh0KHRleHQpIHtcclxuXHRlbW90ZVBvcHVsYXJpdHlBZGQodGV4dCk7XHJcblx0Ly8gR2V0IGlucHV0LlxyXG5cdHZhciBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NoYXRfdGV4dF9pbnB1dCwgLmNoYXQtaW50ZXJmYWNlIHRleHRhcmVhJyk7XHJcblxyXG5cdC8vIEluc2VydCBhdCBjdXJzb3IgLyByZXBsYWNlIHNlbGVjdGlvbi5cclxuXHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0NvZGVfc25pcHBldHMvTWlzY2VsbGFuZW91c1xyXG5cdHZhciBzZWxlY3Rpb25FbmQgPSBlbGVtZW50LnNlbGVjdGlvblN0YXJ0ICsgdGV4dC5sZW5ndGg7XHJcblx0dmFyIGN1cnJlbnRWYWx1ZSA9IGVsZW1lbnQudmFsdWU7XHJcblx0dmFyIGJlZm9yZVRleHQgPSBjdXJyZW50VmFsdWUuc3Vic3RyaW5nKDAsIGVsZW1lbnQuc2VsZWN0aW9uU3RhcnQpO1xyXG5cdHZhciBhZnRlclRleHQgPSBjdXJyZW50VmFsdWUuc3Vic3RyaW5nKGVsZW1lbnQuc2VsZWN0aW9uRW5kLCBjdXJyZW50VmFsdWUubGVuZ3RoKTtcclxuXHQvLyBTbWFydCBwYWRkaW5nLCBvbmx5IHB1dCBzcGFjZSBhdCBzdGFydCBpZiBuZWVkZWQuXHJcblx0aWYgKFxyXG5cdFx0YmVmb3JlVGV4dCAhPT0gJycgJiZcclxuXHRcdGJlZm9yZVRleHQuc3Vic3RyKC0xKSAhPT0gJyAnXHJcblx0KSB7XHJcblx0XHR0ZXh0ID0gJyAnICsgdGV4dDtcclxuXHR9XHJcblx0Ly8gQWx3YXlzIHB1dCBzcGFjZSBhdCBlbmQuXHJcblx0dGV4dCA9IGJlZm9yZVRleHQgKyB0ZXh0ICsgJyAnICsgYWZ0ZXJUZXh0O1xyXG5cdC8vIFNldCB0aGUgdGV4dC5cclxuXHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdjb250cm9sbGVyOmNoYXQnKS5nZXQoJ2N1cnJlbnRSb29tJykuc2V0KCdtZXNzYWdlVG9TZW5kJywgdGV4dCk7XHJcblx0ZWxlbWVudC5mb2N1cygpO1xyXG5cdC8vIFB1dCBjdXJzb3IgYXQgZW5kLlxyXG5cdHNlbGVjdGlvbkVuZCA9IGVsZW1lbnQuc2VsZWN0aW9uU3RhcnQgKyB0ZXh0Lmxlbmd0aDtcclxuXHRlbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKHNlbGVjdGlvbkVuZCwgc2VsZWN0aW9uRW5kKTtcclxuXHJcblx0Ly8gQ2xvc2UgcG9wdXAgaWYgaXQgaGFzbid0IGJlZW4gbW92ZWQgYnkgdGhlIHVzZXIuXHJcblx0aWYgKCFlbGVtZW50cy5tZW51Lmhhc0NsYXNzKCdwaW5uZWQnKSkge1xyXG5cdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5jbGljaygpO1xyXG5cdH1cclxuXHQvLyBSZS1wb3B1bGF0ZSBhcyBpdCBpcyBzdGlsbCBvcGVuLlxyXG5cdGVsc2Uge1xyXG5cdFx0cG9wdWxhdGVFbW90ZXNNZW51KCk7XHJcblx0fVxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgZW1vdGUgZWxlbWVudCBhbmQgbGlzdGVucyBmb3IgYSBjbGljayBldmVudCB0aGF0IHdpbGwgYWRkIHRoZSBlbW90ZSB0ZXh0IHRvIHRoZSBjaGF0LlxyXG4gKiBAcGFyYW0ge29iamVjdH0gIGVtb3RlICAgICAgVGhlIGVtb3RlIHRoYXQgeW91IHdhbnQgdG8gYWRkLiBUaGlzIG9iamVjdCBzaG91bGQgYmUgb25lIGNvbWluZyBmcm9tIGBlbW90ZXNgLlxyXG4gKiBAcGFyYW0ge2VsZW1lbnR9IGNvbnRhaW5lciAgVGhlIEhUTUwgZWxlbWVudCB0aGF0IHRoZSBlbW90ZSBzaG91bGQgYmUgYXBwZW5kZWQgdG8uXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc2hvd0hlYWRlciBXaGV0aGVyIGEgaGVhZGVyIHNob3VsZGJlIGNyZWF0ZWQgaWYgZm91bmQuIE9ubHkgY3JlYXRlcyB0aGUgaGVhZGVyIG9uY2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyLCBzaG93SGVhZGVyKSB7XHJcblx0Ly8gRW1vdGUgbm90IHVzYWJsZSBvciBubyBjb250YWluZXIsIGNhbid0IGFkZC5cclxuXHRpZiAoIWVtb3RlIHx8ICFlbW90ZS5pbWFnZSB8fCAhY29udGFpbmVyLmxlbmd0aCkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRpZiAoc2hvd0hlYWRlcikge1xyXG5cdFx0aWYgKGVtb3RlLmNoYW5uZWwgJiYgZW1vdGUuY2hhbm5lbCAhPT0gJ1R3aXRjaCBUdXJibycpIHtcclxuXHRcdFx0dmFyIGJhZGdlID0gZW1vdGVzLnN1YnNjcmlwdGlvbnMuYmFkZ2VzW2Vtb3RlLmNoYW5uZWxdIHx8IGVtb3RlLmJhZGdlO1xyXG5cdFx0XHQvLyBBZGQgbm90aWNlIGFib3V0IGFkZG9uIGVtb3Rlcy5cclxuXHRcdFx0aWYgKCFlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbZW1vdGUuY2hhbm5lbF0gJiYgIWVsZW1lbnRzLm1lbnUuZmluZCgnLmdyb3VwLWhlYWRlci5hZGRvbi1lbW90ZXMtaGVhZGVyJykubGVuZ3RoKSB7XHJcblx0XHRcdFx0Y29udGFpbmVyLmFwcGVuZChcclxuXHRcdFx0XHRcdCQodGVtcGxhdGVzLmVtb3RlR3JvdXBIZWFkZXIoe1xyXG5cdFx0XHRcdFx0XHRpc0FkZG9uSGVhZGVyOiB0cnVlXHJcblx0XHRcdFx0XHR9KSlcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5maW5kKCcuZ3JvdXAtaGVhZGVyW2RhdGEtZW1vdGUtY2hhbm5lbD1cIicgKyBlbW90ZS5jaGFubmVsICsgJ1wiXScpLmxlbmd0aCkge1xyXG5cdFx0XHRcdGNvbnRhaW5lci5hcHBlbmQoXHJcblx0XHRcdFx0XHQkKHRlbXBsYXRlcy5lbW90ZUdyb3VwSGVhZGVyKHtcclxuXHRcdFx0XHRcdFx0YmFkZ2U6IGJhZGdlLFxyXG5cdFx0XHRcdFx0XHRjaGFubmVsOiBlbW90ZS5jaGFubmVsXHJcblx0XHRcdFx0XHR9KSlcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRjb250YWluZXIuYXBwZW5kKFxyXG5cdFx0JCh0ZW1wbGF0ZXMuZW1vdGUoe1xyXG5cdFx0XHRpbWFnZTogZW1vdGUuaW1hZ2UsXHJcblx0XHRcdHRleHQ6IGVtb3RlLnRleHRcclxuXHRcdH0pKVxyXG5cdCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTaG93IGxhdGVzdCBuZXdzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2hvd05ld3MoKSB7XHJcblx0dmFyIGRpc21pc3NlZE5ld3MgPSBKU09OLnBhcnNlKGdldFNldHRpbmcoJ3R3aXRjaC1jaGF0LWVtb3RlczpkaXNtaXNzZWQtbmV3cycsICdbXScpKTtcclxuXHR2YXIgY2FjaGVkTmV3cyA9IEpTT04ucGFyc2UoZ2V0U2V0dGluZygndHdpdGNoLWNoYXQtZW1vdGVzOmNhY2hlZC1uZXdzJywgJ3t9JykpO1xyXG5cdC8vIE9ubHkgcG9sbCBuZXdzIGZlZWQgb25jZSBwZXIgZGF5LlxyXG5cdGlmIChEYXRlLm5vdygpIC0gZ2V0U2V0dGluZygndHdpdGNoLWNoYXQtZW1vdGVzOm5ld3MtZGF0ZScsIDApID4gODY0MDAwMDApIHtcclxuXHRcdCQuYWpheCgnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9jbGV0dXNjL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9jb250ZW50cy9uZXdzLmpzb24nLCB7XHJcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXHJcblx0XHRcdGhlYWRlcnM6IHtcclxuXHRcdFx0XHQnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL3ZuZC5naXRodWIudjMucmF3K2pzb24nLFxyXG5cdFx0XHRcdCdVc2VyLUFnZW50JzogJ2NsZXR1c2MvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzJ1xyXG5cdFx0XHR9XHJcblx0XHR9KS5kb25lKGZ1bmN0aW9uIChkYXRhKSB7XHJcblx0XHRcdGNhY2hlZE5ld3MgPSBkYXRhIHx8IGNhY2hlZE5ld3M7XHJcblx0XHRcdHNldFNldHRpbmcoJ3R3aXRjaC1jaGF0LWVtb3RlczpjYWNoZWQtbmV3cycsIEpTT04uc3RyaW5naWZ5KGNhY2hlZE5ld3MpKTtcclxuXHRcdH0pLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGhhbmRsZU5ld3NGZWVkKCk7XHJcblx0XHRcdHNldFNldHRpbmcoJ3R3aXRjaC1jaGF0LWVtb3RlczpuZXdzLWRhdGUnLCBEYXRlLm5vdygpKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHRlbHNlIHtcclxuXHRcdGhhbmRsZU5ld3NGZWVkKCk7XHJcblx0fVxyXG5cclxuXHQvLyBIYW5kbGVzIGRpc3BsYXlpbmcgb2YgbmV3cyBmZWVkLlxyXG5cdGZ1bmN0aW9uIGhhbmRsZU5ld3NGZWVkKCkge1xyXG5cdFx0Zm9yICh2YXIgbmV3c0lkIGluIGNhY2hlZE5ld3MpIHtcclxuXHRcdFx0aWYgKGNhY2hlZE5ld3MuaGFzT3duUHJvcGVydHkobmV3c0lkKSAmJiBkaXNtaXNzZWROZXdzLmluZGV4T2YobmV3c0lkKSA9PT0gLTEpIHtcclxuXHRcdFx0XHQvLyBUT0RPICM0M1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQkKCcjY2hhdF9saW5lcywgLmNoYXQtbWVzc2FnZXMnKS5vbignY2xpY2snLCAnYVtkYXRhLWNvbW1hbmQ9XCJ0d2l0Y2gtY2hhdC1lbW90ZXM6ZGlzbWlzcy1uZXdzXCJdJywgZnVuY3Rpb24gKGV2dCkge1xyXG5cdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0ZGlzbWlzc2VkTmV3cy5wdXNoKCQodGhpcykuZGF0YSgnbmV3cy1pZCcpKTtcclxuXHRcdFx0c2V0U2V0dGluZygndHdpdGNoLWNoYXQtZW1vdGVzOmRpc21pc3NlZC1uZXdzJywgSlNPTi5zdHJpbmdpZnkoZGlzbWlzc2VkTmV3cykpO1xyXG5cdFx0XHQkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLnJlbW92ZSgpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgdXNhYmxlIGVtb3RlIHRleHQgZnJvbSBhIHJlZ2V4LlxyXG4gKiBAYXR0cmlidXRlIGh0dHA6Ly91c2Vyc2NyaXB0cy5vcmcvc2NyaXB0cy9zaG93LzE2MDE4MyAoYWRhcHRpb24pXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRFbW90ZUZyb21SZWdFeChyZWdleCkge1xyXG5cdGlmICh0eXBlb2YgcmVnZXggPT09ICdzdHJpbmcnKSB7XHJcblx0XHRyZWdleCA9IG5ldyBSZWdFeHAocmVnZXgpO1xyXG5cdH1cclxuXHRyZXR1cm4gZGVjb2RlVVJJKHJlZ2V4LnNvdXJjZSlcclxuXHRcdC5yZXBsYWNlKCcmZ3RcXFxcOycsICc+JykgLy8gcmlnaHQgYW5nbGUgYnJhY2tldFxyXG5cdFx0LnJlcGxhY2UoJyZsdFxcXFw7JywgJzwnKSAvLyBsZWZ0IGFuZ2xlIGJyYWNrZXRcclxuXHRcdC5yZXBsYWNlKC9cXChcXD8hW14pXSpcXCkvZywgJycpIC8vIHJlbW92ZSBuZWdhdGl2ZSBncm91cFxyXG5cdFx0LnJlcGxhY2UoL1xcKChbXnxdKSpcXHw/W14pXSpcXCkvZywgJyQxJykgLy8gcGljayBmaXJzdCBvcHRpb24gZnJvbSBhIGdyb3VwXHJcblx0XHQucmVwbGFjZSgvXFxbKFtefF0pKlxcfD9bXlxcXV0qXFxdL2csICckMScpIC8vIHBpY2sgZmlyc3QgY2hhcmFjdGVyIGZyb20gYSBjaGFyYWN0ZXIgZ3JvdXBcclxuXHRcdC5yZXBsYWNlKC9bXlxcXFxdXFw/L2csICcnKSAvLyByZW1vdmUgb3B0aW9uYWwgY2hhcnNcclxuXHRcdC5yZXBsYWNlKC9eXFxcXGJ8XFxcXGIkL2csICcnKSAvLyByZW1vdmUgYm91bmRhcmllc1xyXG5cdFx0LnJlcGxhY2UoL1xcXFwvZywgJycpOyAvLyB1bmVzY2FwZVxyXG59XHJcblxyXG4vLyBHZW5lcmljIGZ1bmN0aW9ucy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8qKlxyXG4gKiBHZXRzIGEgc3RvcmFnZSB2YWx1ZS5cclxuICogQHBhcmFtICB7c3RyaW5nfSBhS2V5ICAgICBUaGUga2V5IHlvdSB3YW50IHRvIGdldC5cclxuICogQHBhcmFtICB7bWl4ZWR9ICBhRGVmYXVsdCBUaGUgZGVmYXVsdCB2YWx1ZSB0byByZXR1cm4gaWYgdGhlcmUgaXNuJ3QgYW55dGhpbmcgaW4gc3RvcmFnZS5cclxuICogQHJldHVybiB7bWl4ZWR9ICAgICAgICAgICBUaGUgdmFsdWUgaW4gc3RvcmFnZSBvciBgYURlZmF1bHRgIGlmIHRoZXJlIGlzbid0IGFueXRoaW5nIGluIHN0b3JhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTZXR0aW5nKGFLZXksIGFEZWZhdWx0KSB7XHJcblx0dmFyIHZhbCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGFLZXkpO1xyXG5cdGlmICh2YWwgPT09IG51bGwgJiYgdHlwZW9mIGFEZWZhdWx0ICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0cmV0dXJuIGFEZWZhdWx0O1xyXG5cdH1cclxuXHRyZXR1cm4gdmFsO1xyXG59XHJcbi8qKlxyXG4gKiBTZXRzIGEgc3RvcmFnZSB2YWx1ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGFLZXkgVGhlIGtleSB5b3Ugd2FudCB0byBzZXQuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBhVmFsIFRoZSB2YWx1ZSB5b3Ugd2FudCB0byBzdG9yZS5cclxuICovXHJcbmZ1bmN0aW9uIHNldFNldHRpbmcoYUtleSwgYVZhbCkge1xyXG5cdGxvY2FsU3RvcmFnZS5zZXRJdGVtKGFLZXksIGFWYWwpO1xyXG59XHJcblxyXG4vKipcclxuICogRGVsZXRlcyBhIHN0b3JhZ2Uga2V5LlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYUtleSBUaGUga2V5IHlvdSB3YW50IHRvIHNldC5cclxuICovXHJcbmZ1bmN0aW9uIGRlbGV0ZVNldHRpbmcoYUtleSkge1xyXG5cdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGFLZXkpO1xyXG59XHJcbiIsIihmdW5jdGlvbiAoZG9jLCBjc3NUZXh0KSB7XG4gICAgdmFyIHN0eWxlRWwgPSBkb2MuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG4gICAgaWYgKHN0eWxlRWwuc3R5bGVTaGVldCkge1xuICAgICAgICBpZiAoIXN0eWxlRWwuc3R5bGVTaGVldC5kaXNhYmxlZCkge1xuICAgICAgICAgICAgc3R5bGVFbC5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3NUZXh0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0eWxlRWwuaW5uZXJIVE1MID0gY3NzVGV4dDtcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlKSB7XG4gICAgICAgICAgICBzdHlsZUVsLmlubmVyVGV4dCA9IGNzc1RleHQ7XG4gICAgICAgIH1cbiAgICB9XG59KGRvY3VtZW50LCBcIi8qKlxcblwiICtcblwiICogTWluaWZpZWQgc3R5bGUuXFxuXCIgK1xuXCIgKiBPcmlnaW5hbCBmaWxlbmFtZTogXFxcXG5vZGVfbW9kdWxlc1xcXFxqcXVlcnktY3VzdG9tLXNjcm9sbGJhclxcXFxqcXVlcnkuY3VzdG9tLXNjcm9sbGJhci5jc3NcXG5cIiArXG5cIiAqL1xcblwiICtcblwiLnNjcm9sbGFibGV7cG9zaXRpb246cmVsYXRpdmV9LnNjcm9sbGFibGU6Zm9jdXN7b3V0bGluZTowfS5zY3JvbGxhYmxlIC52aWV3cG9ydHtwb3NpdGlvbjpyZWxhdGl2ZTtvdmVyZmxvdzpoaWRkZW59LnNjcm9sbGFibGUgLnZpZXdwb3J0IC5vdmVydmlld3twb3NpdGlvbjphYnNvbHV0ZX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhcntkaXNwbGF5Om5vbmV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIudmVydGljYWx7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDtoZWlnaHQ6MTAwJX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci5ob3Jpem9udGFse3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjEwMCV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIgLnRodW1ie3Bvc2l0aW9uOmFic29sdXRlfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyLnZlcnRpY2FsIC50aHVtYnt3aWR0aDoxMDAlO21pbi1oZWlnaHQ6MTBweH0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci5ob3Jpem9udGFsIC50aHVtYntoZWlnaHQ6MTAwJTttaW4td2lkdGg6MTBweDtsZWZ0OjB9Lm5vdC1zZWxlY3RhYmxley13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTsta2h0bWwtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZX0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW57cGFkZGluZy1yaWdodDoxMHB4O3BhZGRpbmctYm90dG9tOjZweH0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXIudmVydGljYWx7d2lkdGg6NnB4fS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFse2hlaWdodDo2cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOiMwMDA7b3BhY2l0eTouNDtib3JkZXItcmFkaXVzOjNweDstbW96LWJvcmRlci1yYWRpdXM6NHB4Oy13ZWJraXQtYm9yZGVyLXJhZGl1czo0cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyOmhvdmVyIC50aHVtYntvcGFjaXR5Oi42fS5zY3JvbGxhYmxlLmdyYXktc2tpbntwYWRkaW5nLXJpZ2h0OjE3cHh9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFye2JvcmRlcjoxcHggc29saWQgZ3JheTtiYWNrZ3JvdW5kLWNvbG9yOiNkM2QzZDN9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOmdyYXl9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyOmhvdmVyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOiMwMDB9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2Fse3dpZHRoOjEwcHh9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyLmhvcml6b250YWx7aGVpZ2h0OjEwcHg7bWFyZ2luLXRvcDoycHh9LnNjcm9sbGFibGUubW9kZXJuLXNraW57cGFkZGluZy1yaWdodDoxN3B4fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFye2JvcmRlcjoxcHggc29saWQgZ3JheTtib3JkZXItcmFkaXVzOjRweDstbW96LWJvcmRlci1yYWRpdXM6NHB4Oy13ZWJraXQtYm9yZGVyLXJhZGl1czo0cHg7Ym94LXNoYWRvdzppbnNldCAwIDAgNXB4ICM4ODh9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6Izk1YWFiZjtib3JkZXItcmFkaXVzOjRweDstbW96LWJvcmRlci1yYWRpdXM6NHB4Oy13ZWJraXQtYm9yZGVyLXJhZGl1czo0cHg7Ym9yZGVyOjFweCBzb2xpZCAjNTM2OTg0fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2FsIC50aHVtYnt3aWR0aDo4cHg7YmFja2dyb3VuZDotd2Via2l0LWdyYWRpZW50KGxpbmVhcixsZWZ0IHRvcCxyaWdodCB0b3AsY29sb3Itc3RvcCgwJSwjOTVhYWJmKSxjb2xvci1zdG9wKDEwMCUsIzU0NzA5MikpO2JhY2tncm91bmQ6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQobGVmdCwjOTVhYWJmIDAsIzU0NzA5MiAxMDAlKTtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwjOTVhYWJmIDAsIzU0NzA5MiAxMDAlKTstbXMtZmlsdGVyOlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuZ3JhZGllbnQoIHN0YXJ0Q29sb3JzdHI9JyM5NWFhYmYnLCBlbmRDb2xvcnN0cj0nIzU0NzA5MicsR3JhZGllbnRUeXBlPTEgKVxcXCJ9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIuaG9yaXpvbnRhbCAudGh1bWJ7aGVpZ2h0OjhweDtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgjOTVhYWJmLCM1NDcwOTIpO2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQoIzk1YWFiZiwjNTQ3MDkyKTstbXMtZmlsdGVyOlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuZ3JhZGllbnQoIHN0YXJ0Q29sb3JzdHI9JyM5NWFhYmYnLCBlbmRDb2xvcnN0cj0nIzU0NzA5MicsR3JhZGllbnRUeXBlPTAgKVxcXCJ9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIudmVydGljYWx7d2lkdGg6MTBweH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFse2hlaWdodDoxMHB4O21hcmdpbi10b3A6MnB4fVxcblwiICtcblwiLyoqXFxuXCIgK1xuXCIgKiBNaW5pZmllZCBzdHlsZS5cXG5cIiArXG5cIiAqIE9yaWdpbmFsIGZpbGVuYW1lOiBcXFxcc3JjXFxcXHN0eWxlc1xcXFxzdHlsZS5jc3NcXG5cIiArXG5cIiAqL1xcblwiICtcblwiI2Vtb3RlLW1lbnUtYnV0dG9ue2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQklBQUFBUUNBWUFBQUFiQmk5Y0FBQUFBWE5TUjBJQXJzNGM2UUFBQUFSblFVMUJBQUN4and2OFlRVUFBQUFKY0VoWmN3QUFEc01BQUE3REFjZHZxR1FBQUFLVVNVUkJWRGhQZlpUTmkxSlJHTVp2TUlzV1VadHM1U0lYRllLMENNRS9JR2doeFZDN1dVb1UxTkJpeEkrbVJTRDRNUXpteHppS08zWFVCaFJtVUdaS2RCRzQwWEVHVTZkMEdGR1pjVDRxeFcxaGk3Znp2TndacUt3REQ1ejd2cy92dWVlZWUrNlZNSnhPNXdVaGhkdnRmdUh6K1Q0dExTMk5oZWdmR3NNREx4aXdISUloTGk1N1BKNzVWQ3IxWTM5L240YkRJWTFHbzRsQ0R4NTR3WUNWWXpqb1ZqUWEvZHh1dHlmQ2t3U3ZZSnBnT1NRZjcwOHR1QmExeVdSeS9MK1YvQ2w0d1lCRmhoVHhmTGh1bS9lc2lpSjF1MTJLUkNKa3NWaG9mWDJkVGs1T3prSE1VVU1QSG5qQjJGNTVWcEVoUGRlL0xieDhGcUJFSWtIcGRKb01CZ05wdFZyUzZYUlVxVlRPZzdhM3QybG1ab2IwZWoycDFXcjJnZ0dMRE9uSjNRU1pINGNvSG8vVHlzb0toeWdVQ3RKb05GUXNGbWt3R0xBd1I3aFNxU1NWU3NWZU1HQ1JJVDI5RjZmWEppOFh5K1V5bWMxbW1wNmVKb2ZEUWZWNm5VNVBUMW1ZMisxMjd1SHhTcVVTaDRGRmhoUUx2cnZ0Y3JtK1lwa0hCd2RVclZacGEydUxhclVhZFRvZE9qdzhaR0dPR25yd3dBc0dMREx3MWk0dUxyelJZZU9PajQ5cGIyK1BkbmQzcWRWcThTdEdBSVE1YW8xR2d6M3dnZ0dMREQ0QzRpemNFY1dmUjBkSGJNcmxjclN4c2NHYmpWQUlLOGxtczdTNXVjbUIvWDZmWHo5WURzRVFGemRqc1ZpdDJXenlxYzFrTXJ3ZlZxdVZqRVlqemMzTmtjbGtJcHZOUm10cmEreUJWekFmQlh0RGp1R2dTOEZnY0ZiYzhRdnVoak5TS0JRb0ZBcVI2TEZFbi9MNVBQZmdnWGQ1ZVhrV3JCekRRZEMxUUNCZ0ZvZXV0N096dy90eUJwMkZRemhQd3RPRkZ3elkzNFlvNEE5d1JYemREOExoY0U0OHduY0U5bm85RnVhb2lkNTc0YmtQTHhnWi8zdUk1cFRRVmZGbFAvTDcvV21oYjdKU1hxLzNJWHJ3eUhaNVNOSXZHQ25xeWgrSjcrZ0FBQUFBU1VWT1JLNUNZSUk9KSFpbXBvcnRhbnQ7YmFja2dyb3VuZC1wb3NpdGlvbjo1MCU7YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2N1cnNvcjpwb2ludGVyO21hcmdpbi1sZWZ0OjdweH0jZW1vdGUtbWVudS1idXR0b24uYWN0aXZle2JvcmRlci1yYWRpdXM6MnB4O2JhY2tncm91bmQtY29sb3I6cmdiYSgxMjgsMTI4LDEyOCwuNSl9LmVtb3RlLW1lbnV7cGFkZGluZzo1cHg7ei1pbmRleDoxMDAwO2Rpc3BsYXk6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOiMyMDIwMjB9LmVtb3RlLW1lbnUgYXtjb2xvcjojZmZmfS5lbW90ZS1tZW51IGE6aG92ZXJ7Y3Vyc29yOnBvaW50ZXI7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTtjb2xvcjojY2NjfS5lbW90ZS1tZW51IC5lbW90ZXMtcG9wdWxhcntoZWlnaHQ6MzhweH0uZW1vdGUtbWVudSAuZHJhZ2dhYmxle2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1yZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSAxMHB4KTtiYWNrZ3JvdW5kLWltYWdlOnJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDEwcHgpO2N1cnNvcjptb3ZlO2hlaWdodDo3cHg7bWFyZ2luLWJvdHRvbTozcHh9LmVtb3RlLW1lbnUgLmRyYWdnYWJsZTpob3ZlcntiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtcmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDEwcHgpO2JhY2tncm91bmQtaW1hZ2U6cmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDEwcHgpfS5lbW90ZS1tZW51IC5ncm91cC1oZWFkZXJ7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQoYm90dG9tLHRyYW5zcGFyZW50LHJnYmEoMCwwLDAsLjUpKTtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCh0byB0b3AsdHJhbnNwYXJlbnQscmdiYSgwLDAsMCwuNSkpO3BhZGRpbmc6MnB4O2NvbG9yOiNkZGQ7dGV4dC1hbGlnbjpjZW50ZXJ9LmVtb3RlLW1lbnUgLmdyb3VwLWhlYWRlciBpbWd7bWFyZ2luLXJpZ2h0OjhweH0uZW1vdGUtbWVudSAuZW1vdGV7ZGlzcGxheTppbmxpbmUtYmxvY2s7cGFkZGluZzoycHg7bWFyZ2luOjFweDtjdXJzb3I6cG9pbnRlcjtib3JkZXItcmFkaXVzOjVweDt0ZXh0LWFsaWduOmNlbnRlcjtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDozMnB4O2hlaWdodDozMnB4fS5lbW90ZS1tZW51IC5lbW90ZSBkaXZ7bWF4LXdpZHRoOjMycHg7bWF4LWhlaWdodDozMnB4O2JhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdDtiYWNrZ3JvdW5kLXNpemU6Y29udGFpbjttYXJnaW46YXV0bztwb3NpdGlvbjphYnNvbHV0ZTt0b3A6MDtib3R0b206MDtsZWZ0OjA7cmlnaHQ6MH0uZW1vdGUtbWVudSAuc2luZ2xlLXJvd3tvdmVyZmxvdzpoaWRkZW47aGVpZ2h0OjM3cHh9LmVtb3RlLW1lbnUgLnNpbmdsZS1yb3cgLmVtb3Rle2Rpc3BsYXk6aW5saW5lLWJsb2NrO21hcmdpbi1ib3R0b206MTAwcHh9LmVtb3RlLW1lbnUgLmVtb3RlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwuMSl9LmVtb3RlLW1lbnUgLnB1bGwtbGVmdHtmbG9hdDpsZWZ0fS5lbW90ZS1tZW51IC5wdWxsLXJpZ2h0e2Zsb2F0OnJpZ2h0fS5lbW90ZS1tZW51IC5mb290ZXJ7dGV4dC1hbGlnbjpjZW50ZXI7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O3BhZGRpbmc6NXB4IDAgMnB4O21hcmdpbi10b3A6NXB4fS5lbW90ZS1tZW51IC5mb290ZXIgLnB1bGwtbGVmdHttYXJnaW4tcmlnaHQ6NXB4fS5lbW90ZS1tZW51IC5mb290ZXIgLnB1bGwtcmlnaHR7bWFyZ2luLWxlZnQ6NXB4fS5lbW90ZS1tZW51IC5pY29ue2hlaWdodDoxNnB4O3dpZHRoOjE2cHg7b3BhY2l0eTouNTtiYWNrZ3JvdW5kLXNpemU6Y29udGFpbiFpbXBvcnRhbnR9LmVtb3RlLW1lbnUgLmljb246aG92ZXJ7b3BhY2l0eToxfS5lbW90ZS1tZW51IC5pY29uLWhvbWV7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlOalFpRFFvZ0lDQm9aV2xuYUhROUlqWTBJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJRFkwSURZMElnMEtJQ0FnYVdROUlrTmhjR0ZmTVNJTkNpQWdJSGh0YkRwemNHRmpaVDBpY0hKbGMyVnlkbVVpUGp4dFpYUmhaR0YwWVEwS0lDQWdhV1E5SW0xbGRHRmtZWFJoTXpBd01TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pJNU9Ua2lJQzgrRFFvOGNHRjBhQTBLSUNBZ1pEMGliU0ExTnk0d05qSXNNekV1TXprNElHTWdNQzQ1TXpJc0xURXVNREkxSURBdU9EUXlMQzB5TGpVNU5pQXRNQzR5TURFc0xUTXVOVEE0SUV3Z016TXVPRGcwTERjdU56ZzFJRU1nTXpJdU9EUXhMRFl1T0RjeklETXhMakUyT1N3MkxqZzVNaUF6TUM0eE5EZ3NOeTQ0TWpnZ1RDQTNMakE1TXl3eU9DNDVOaklnWXlBdE1TNHdNakVzTUM0NU16WWdMVEV1TURjeExESXVOVEExSUMwd0xqRXhNU3d6TGpVd015QnNJREF1TlRjNExEQXVOakF5SUdNZ01DNDVOVGtzTUM0NU9UZ2dNaTQxTURrc01TNHhNVGNnTXk0ME5pd3dMakkyTlNCc0lERXVOekl6TEMweExqVTBNeUIySURJeUxqVTVJR01nTUN3eExqTTROaUF4TGpFeU15d3lMalV3T0NBeUxqVXdPQ3d5TGpVd09DQm9JRGd1T1RnM0lHTWdNUzR6T0RVc01DQXlMalV3T0N3dE1TNHhNaklnTWk0MU1EZ3NMVEl1TlRBNElGWWdNemd1TlRjMUlHZ2dNVEV1TkRZeklIWWdNVFV1T0RBMElHTWdMVEF1TURJc01TNHpPRFVnTUM0NU56RXNNaTQxTURjZ01pNHpOVFlzTWk0MU1EY2dhQ0E1TGpVeU5DQmpJREV1TXpnMUxEQWdNaTQxTURnc0xURXVNVEl5SURJdU5UQTRMQzB5TGpVd09DQldJRE15TGpFd055QmpJREFzTUNBd0xqUTNOaXd3TGpReE55QXhMakEyTXl3d0xqa3pNeUF3TGpVNE5pd3dMalV4TlNBeExqZ3hOeXd3TGpFd01pQXlMamMwT1N3dE1DNDVNalFnYkNBd0xqWTFNeXd0TUM0M01UZ2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb01qazVOU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1abVptWTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6ND0pIG5vLXJlcGVhdCA1MCV9LmVtb3RlLW1lbnUgLmljb24tcmVzaXplLWhhbmRsZXtiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UWWlEUW9nSUNCb1pXbG5hSFE5SWpFMklnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lERTJJREUySWcwS0lDQWdhV1E5SWtOaGNHRmZNU0lOQ2lBZ0lIaHRiRHB6Y0dGalpUMGljSEpsYzJWeWRtVWlQanh0WlhSaFpHRjBZUTBLSUNBZ2FXUTlJbTFsZEdGa1lYUmhORE0xTnlJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jelF6TlRVaUlDOCtEUW84Y0dGMGFBMEtJQ0FnWkQwaVRTQXhNeTQxTERnZ1F5QXhNeTR5TWpVc09DQXhNeXc0TGpJeU5DQXhNeXc0TGpVZ2RpQXpMamM1TXlCTUlETXVOekEzTERNZ1NDQTNMalVnUXlBM0xqYzNOaXd6SURnc01pNDNOellnT0N3eUxqVWdPQ3d5TGpJeU5DQTNMamMzTml3eUlEY3VOU3d5SUdnZ0xUVWdUQ0F5TGpNd09Td3lMakF6T1NBeUxqRTFMREl1TVRRMElESXVNVFEyTERJdU1UUTJJREl1TVRRekxESXVNVFV5SURJdU1ETTVMREl1TXpBNUlESXNNaTQxSUhZZ05TQkRJRElzTnk0M056WWdNaTR5TWpRc09DQXlMalVzT0NBeUxqYzNOaXc0SURNc055NDNOellnTXl3M0xqVWdWaUF6TGpjd055Qk1JREV5TGpJNU15d3hNeUJJSURndU5TQkRJRGd1TWpJMExERXpJRGdzTVRNdU1qSTFJRGdzTVRNdU5TQTRMREV6TGpjM05TQTRMakl5TkN3eE5DQTRMalVzTVRRZ2FDQTFJR3dnTUM0eE9URXNMVEF1TURNNUlHTWdNQzR4TWpFc0xUQXVNRFV4SURBdU1qSXNMVEF1TVRRNElEQXVNamNzTFRBdU1qY2dUQ0F4TkN3eE15NDFNRElnVmlBNExqVWdReUF4TkN3NExqSXlOQ0F4TXk0M056VXNPQ0F4TXk0MUxEZ2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb05ETTFNU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1abVptWTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6ND0pIG5vLXJlcGVhdCA1MCU7Y3Vyc29yOm53c2UtcmVzaXplIWltcG9ydGFudH0uZW1vdGUtbWVudSAuaWNvbi1waW57YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVFlpRFFvZ0lDQm9aV2xuYUhROUlqRTJJZzBLSUNBZ2FXUTlJbk4yWnpNd01EVWlQZzBLSUNBOGJXVjBZV1JoZEdFTkNpQWdJQ0FnYVdROUltMWxkR0ZrWVhSaE16QXlNeUkrRFFvZ0lDQWdQSEprWmpwU1JFWStEUW9nSUNBZ0lDQThZMk02VjI5eWF3MEtJQ0FnSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGcwS0lDQWdJQ0FnSUNBOFpHTTZabTl5YldGMFBtbHRZV2RsTDNOMlp5dDRiV3c4TDJSak9tWnZjbTFoZEQ0TkNpQWdJQ0FnSUNBZ1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lDQWdjbVJtT25KbGMyOTFjbU5sUFNKb2RIUndPaTh2Y0hWeWJDNXZjbWN2WkdNdlpHTnRhWFI1Y0dVdlUzUnBiR3hKYldGblpTSWdMejROQ2lBZ0lDQWdJQ0FnUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK0RRb2dJQ0FnSUNBOEwyTmpPbGR2Y21zK0RRb2dJQ0FnUEM5eVpHWTZVa1JHUGcwS0lDQThMMjFsZEdGa1lYUmhQZzBLSUNBOFpHVm1jdzBLSUNBZ0lDQnBaRDBpWkdWbWN6TXdNakVpSUM4K0RRb2dJRHhuRFFvZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1Tnprek1EYzRNaXd3TERBc01DNDNPVE13TnpneUxDMHlMakUzTURrNE5Td3RPREUwTGpZNU1qazVLU0lOQ2lBZ0lDQWdhV1E5SW1jek1EQTNJajROQ2lBZ0lDQThadzBLSUNBZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1TnpBM01URXNNQzQzTURjeE1Td3RNQzQzTURjeE1Td3dMamN3TnpFeExEY3pOeTQzTURjMU5Td3lPVFV1TkRnNE1EZ3BJZzBLSUNBZ0lDQWdJR2xrUFNKbk16QXdPU0krRFFvZ0lDQWdJQ0E4WncwS0lDQWdJQ0FnSUNBZ2FXUTlJbWN6TnpVMUlqNE5DaUFnSUNBZ0lDQWdQSEJoZEdnTkNpQWdJQ0FnSUNBZ0lDQWdaRDBpVFNBNUxqYzRNVEkxTERBZ1F5QTVMalEzTkRBMU5qSXNNQzQyT0RreE1USWdPUzQxTWpBMk9Dd3hMalV5TXpBNE5UTWdPUzR6TVRJMUxESXVNVGczTlNCTUlEUXVPVE0zTlN3MkxqVTVNemMxSUVNZ015NDVOVGc1TmpBNExEWXVOREk1TkRneklESXVPVFEzTnpVME9DdzJMalV6TWpjNE9Ua2dNaXcyTGpneE1qVWdUQ0ExTGpBek1USTFMRGt1T0RRek56VWdNQzQxTmpJMUxERTBMak14TWpVZ01Dd3hOaUJESURBdU5UWTVNamsyTWpnc01UVXVOemsxTmpJMklERXVNVFkzTnpNM09Dd3hOUzQyTkRBeU16Y2dNUzQzTVRnM05Td3hOUzQwTURZeU5TQk1JRFl1TVRVMk1qVXNNVEF1T1RZNE56VWdPUzR4T0RjMUxERTBJR01nTUM0eU56azJPREl6TEMwd0xqazBOemM0TXlBd0xqTTRNekUxTWpnc0xURXVPVFU0T1RNM0lEQXVNakU0TnpVc0xUSXVPVE0zTlNBeExqVXdNREF4TVN3dE1TNDBPRGsxTnprNElETXVNREF3TURBeExDMHlMamszT1RFMU9TQTBMalVzTFRRdU5EWTROelVnTUM0Mk1ERXhNRElzTFRBdU1ETXhNell4SURFdU9ESXlNVE00TEMwd0xqQTVOakV6TnlBeUxDMHdMalEyT0RjMUlFTWdNVE11T0RjNU9Ea3lMRFF1TURZNU5EZ3dNeUF4TVM0NE5ESTROalVzTWk0d01qQXlNamd5SURrdU56Z3hNalVzTUNCNklnMEtJQ0FnSUNBZ0lDQWdJQ0IwY21GdWMyWnZjbTA5SW0xaGRISnBlQ2d3TGpnNU1UVTVNemMwTEMwd0xqZzVNVFU1TXpjMExEQXVPRGt4TlRrek56UXNNQzQ0T1RFMU9UTTNOQ3d0TWk0eU5qVTFMREV3TXpjdU1UTTBOU2tpRFFvZ0lDQWdJQ0FnSUNBZ0lHbGtQU0p3WVhSb016QXhNU0lOQ2lBZ0lDQWdJQ0FnSUNBZ2MzUjViR1U5SW1acGJHdzZJMlptWm1abVpqdG1hV3hzTFc5d1lXTnBkSGs2TVNJZ0x6NE5DaUFnSUNBZ0lEd3ZaejROQ2lBZ0lDQThMMmMrRFFvZ0lEd3ZaejROQ2p3dmMzWm5QZzBLKSBuby1yZXBlYXQgNTAlOy13ZWJraXQtdHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZX0uZW1vdGUtbWVudSAuaWNvbi1waW46aG92ZXIsLmVtb3RlLW1lbnUucGlubmVkIC5pY29uLXBpbnstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTstbXMtdHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3RyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTtvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLnNjcm9sbGFibGUuZGVmYXVsdC1za2lue3BhZGRpbmctcmlnaHQ6MDtwYWRkaW5nLWJvdHRvbTowfS5lbW90ZS1tZW51IC5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojNTU1O29wYWNpdHk6LjI7ei1pbmRleDoxfVwiKSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgSG9nYW4gPSByZXF1aXJlKCdob2dhbi5qcy9saWIvdGVtcGxhdGUuanMnKTtcbiAgICB2YXIgdGVtcGxhdGVzID0ge307XG4gICAgdGVtcGxhdGVzWydlbW90ZSddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJlbW90ZVxcXCIgZGF0YS1lbW90ZT1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCIgdGl0bGU9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBzdHlsZT1cXFwiYmFja2dyb3VuZC1pbWFnZTogdXJsKFwiKTt0LmIodC50KHQuZChcImltYWdlLnVybFwiLGMscCwwKSkpO3QuYihcIik7IGhlaWdodDogXCIpO3QuYih0LnQodC5kKFwiaW1hZ2UuaGVpZ2h0XCIsYyxwLDApKSk7dC5iKFwicHg7IHdpZHRoOiBcIik7dC5iKHQudCh0LmQoXCJpbWFnZS53aWR0aFwiLGMscCwwKSkpO3QuYihcInB4XFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWydlbW90ZUJ1dHRvbiddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8YnV0dG9uIGNsYXNzPVxcXCJidXR0b24gZ2x5cGgtb25seVxcXCIgdGl0bGU9XFxcIkVtb3RlIE1lbnVcXFwiIGlkPVxcXCJlbW90ZS1tZW51LWJ1dHRvblxcXCI+PC9idXR0b24+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVHcm91cEhlYWRlciddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTtpZih0LnModC5mKFwiaXNBZGRvbkhlYWRlclwiLGMscCwxKSxjLHAsMCwxOCwyMTgsXCJ7eyB9fVwiKSl7dC5ycyhjLHAsZnVuY3Rpb24oYyxwLHQpe3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyIGFkZG9uLWVtb3Rlcy1oZWFkZXJcXFwiIHRpdGxlPVxcXCJCZWxvdyBhcmUgZW1vdGVzIGFkZGVkIGJ5IGFuIGFkZG9uLiBPbmx5IHRob3NlIHdobyBhbHNvIGhhdmUgdGhlIHNhbWUgYWRkb24gaW5zdGFsbGVkIGNhbiBzZWUgdGhlc2UgZW1vdGVzIGluIGNoYXQuXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0QWRkb24gRW1vdGVzXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt9KTtjLnBvcCgpO310LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTtpZighdC5zKHQuZihcImlzQWRkb25IZWFkZXJcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImdyb3VwLWhlYWRlclxcXCIgZGF0YS1lbW90ZS1jaGFubmVsPVxcXCJcIik7dC5iKHQudih0LmYoXCJjaGFubmVsXCIsYyxwLDApKSk7dC5iKFwiXFxcIj48aW1nIHNyYz1cXFwiXCIpO3QuYih0LnYodC5mKFwiYmFkZ2VcIixjLHAsMCkpKTt0LmIoXCJcXFwiIC8+XCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO307cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ21lbnUnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZW1vdGUtbWVudSBkcm9wbWVudVxcXCIgaWQ9XFxcImVtb3RlLW1lbnUtZm9yLXR3aXRjaFxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJkcmFnZ2FibGVcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyXFxcIj5BbGwgRW1vdGVzPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1jb250YWluZXIgc2Nyb2xsYWJsZVxcXCIgaWQ9XFxcImFsbC1lbW90ZXMtZ3JvdXBcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyXFxcIj5Qb3B1bGFyIEVtb3RlczwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtY29udGFpbmVyIHNpbmdsZS1yb3dcXFwiIGlkPVxcXCJwb3B1bGFyLWVtb3Rlcy1ncm91cFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJmb290ZXJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8YSBjbGFzcz1cXFwicHVsbC1sZWZ0IGljb24gaWNvbi1ob21lXFxcIiBocmVmPVxcXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgdGl0bGU9XFxcIlZpc2l0IHRoZSBob21lcGFnZSB3aGVyZSB5b3UgY2FuIGRvbmF0ZSwgcG9zdCBhIHJldmlldywgb3IgY29udGFjdCB0aGUgZGV2ZWxvcGVyXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLWxlZnQgaWNvbiBpY29uLXBpblxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtcGlubmVkXFxcIiB0aXRsZT1cXFwiUGluL3VucGluIHRoZSBlbW90ZSBtZW51IHRvIHRoZSBzY3JlZW5cXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGEgdGl0bGU9XFxcIlJlc2V0IHRoZSBwb3B1bGFyaXR5IG9mIHRoZSBlbW90ZXMgYmFjayB0byBkZWZhdWx0XFxcIiBkYXRhLWNvbW1hbmQ9XFxcInJlc2V0LXBvcHVsYXJpdHlcXFwiPlJlc2V0IFBvcHVsYXJpdHk8L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLXJpZ2h0IGljb24gaWNvbi1yZXNpemUtaGFuZGxlXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInJlc2l6ZS1oYW5kbGVcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ25ld3NNZXNzYWdlJ10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjxkaXYgY2xhc3M9XFxcInR3aXRjaC1jaGF0LWVtb3Rlcy1uZXdzXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFtcIik7dC5iKHQudih0LmYoXCJzY3JpcHROYW1lXCIsYyxwLDApKSk7dC5iKFwiXSBOZXdzOiBcIik7dC5iKHQudCh0LmYoXCJtZXNzYWdlXCIsYyxwLDApKSk7dC5iKFwiICg8YSBocmVmPVxcXCIjXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInR3aXRjaC1jaGF0LWVtb3RlczpkaXNtaXNzLW5ld3NcXFwiIGRhdGEtbmV3cy1pZD1cXFwiXCIpO3QuYih0LnYodC5mKFwiaWRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPkRpc21pc3M8L2E+KVxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICByZXR1cm4gdGVtcGxhdGVzO1xufSkoKTsiLCIvKlxuICogIENvcHlyaWdodCAyMDExIFR3aXR0ZXIsIEluYy5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBIb2dhbiA9IHt9O1xuXG4oZnVuY3Rpb24gKEhvZ2FuKSB7XG4gIEhvZ2FuLlRlbXBsYXRlID0gZnVuY3Rpb24gKGNvZGVPYmosIHRleHQsIGNvbXBpbGVyLCBvcHRpb25zKSB7XG4gICAgY29kZU9iaiA9IGNvZGVPYmogfHwge307XG4gICAgdGhpcy5yID0gY29kZU9iai5jb2RlIHx8IHRoaXMucjtcbiAgICB0aGlzLmMgPSBjb21waWxlcjtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMudGV4dCA9IHRleHQgfHwgJyc7XG4gICAgdGhpcy5wYXJ0aWFscyA9IGNvZGVPYmoucGFydGlhbHMgfHwge307XG4gICAgdGhpcy5zdWJzID0gY29kZU9iai5zdWJzIHx8IHt9O1xuICAgIHRoaXMuYnVmID0gJyc7XG4gIH1cblxuICBIb2dhbi5UZW1wbGF0ZS5wcm90b3R5cGUgPSB7XG4gICAgLy8gcmVuZGVyOiByZXBsYWNlZCBieSBnZW5lcmF0ZWQgY29kZS5cbiAgICByOiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkgeyByZXR1cm4gJyc7IH0sXG5cbiAgICAvLyB2YXJpYWJsZSBlc2NhcGluZ1xuICAgIHY6IGhvZ2FuRXNjYXBlLFxuXG4gICAgLy8gdHJpcGxlIHN0YWNoZVxuICAgIHQ6IGNvZXJjZVRvU3RyaW5nLFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgcmV0dXJuIHRoaXMucmkoW2NvbnRleHRdLCBwYXJ0aWFscyB8fCB7fSwgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gcmVuZGVyIGludGVybmFsIC0tIGEgaG9vayBmb3Igb3ZlcnJpZGVzIHRoYXQgY2F0Y2hlcyBwYXJ0aWFscyB0b29cbiAgICByaTogZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnIoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCk7XG4gICAgfSxcblxuICAgIC8vIGVuc3VyZVBhcnRpYWxcbiAgICBlcDogZnVuY3Rpb24oc3ltYm9sLCBwYXJ0aWFscykge1xuICAgICAgdmFyIHBhcnRpYWwgPSB0aGlzLnBhcnRpYWxzW3N5bWJvbF07XG5cbiAgICAgIC8vIGNoZWNrIHRvIHNlZSB0aGF0IGlmIHdlJ3ZlIGluc3RhbnRpYXRlZCB0aGlzIHBhcnRpYWwgYmVmb3JlXG4gICAgICB2YXIgdGVtcGxhdGUgPSBwYXJ0aWFsc1twYXJ0aWFsLm5hbWVdO1xuICAgICAgaWYgKHBhcnRpYWwuaW5zdGFuY2UgJiYgcGFydGlhbC5iYXNlID09IHRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsLmluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRlbXBsYXRlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICghdGhpcy5jKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gY29tcGlsZXIgYXZhaWxhYmxlLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuYy5jb21waWxlKHRlbXBsYXRlLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSB1c2UgdGhpcyB0byBjaGVjayB3aGV0aGVyIHRoZSBwYXJ0aWFscyBkaWN0aW9uYXJ5IGhhcyBjaGFuZ2VkXG4gICAgICB0aGlzLnBhcnRpYWxzW3N5bWJvbF0uYmFzZSA9IHRlbXBsYXRlO1xuXG4gICAgICBpZiAocGFydGlhbC5zdWJzKSB7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBjb25zaWRlciBwYXJlbnQgdGVtcGxhdGUgbm93XG4gICAgICAgIGlmICghcGFydGlhbHMuc3RhY2tUZXh0KSBwYXJ0aWFscy5zdGFja1RleHQgPSB7fTtcbiAgICAgICAgZm9yIChrZXkgaW4gcGFydGlhbC5zdWJzKSB7XG4gICAgICAgICAgaWYgKCFwYXJ0aWFscy5zdGFja1RleHRba2V5XSkge1xuICAgICAgICAgICAgcGFydGlhbHMuc3RhY2tUZXh0W2tleV0gPSAodGhpcy5hY3RpdmVTdWIgIT09IHVuZGVmaW5lZCAmJiBwYXJ0aWFscy5zdGFja1RleHRbdGhpcy5hY3RpdmVTdWJdKSA/IHBhcnRpYWxzLnN0YWNrVGV4dFt0aGlzLmFjdGl2ZVN1Yl0gOiB0aGlzLnRleHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gY3JlYXRlU3BlY2lhbGl6ZWRQYXJ0aWFsKHRlbXBsYXRlLCBwYXJ0aWFsLnN1YnMsIHBhcnRpYWwucGFydGlhbHMsXG4gICAgICAgICAgdGhpcy5zdGFja1N1YnMsIHRoaXMuc3RhY2tQYXJ0aWFscywgcGFydGlhbHMuc3RhY2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGFydGlhbHNbc3ltYm9sXS5pbnN0YW5jZSA9IHRlbXBsYXRlO1xuXG4gICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfSxcblxuICAgIC8vIHRyaWVzIHRvIGZpbmQgYSBwYXJ0aWFsIGluIHRoZSBjdXJyZW50IHNjb3BlIGFuZCByZW5kZXIgaXRcbiAgICBycDogZnVuY3Rpb24oc3ltYm9sLCBjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICB2YXIgcGFydGlhbCA9IHRoaXMuZXAoc3ltYm9sLCBwYXJ0aWFscyk7XG4gICAgICBpZiAoIXBhcnRpYWwpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGFydGlhbC5yaShjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gcmVuZGVyIGEgc2VjdGlvblxuICAgIHJzOiBmdW5jdGlvbihjb250ZXh0LCBwYXJ0aWFscywgc2VjdGlvbikge1xuICAgICAgdmFyIHRhaWwgPSBjb250ZXh0W2NvbnRleHQubGVuZ3RoIC0gMV07XG5cbiAgICAgIGlmICghaXNBcnJheSh0YWlsKSkge1xuICAgICAgICBzZWN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhaWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29udGV4dC5wdXNoKHRhaWxbaV0pO1xuICAgICAgICBzZWN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzKTtcbiAgICAgICAgY29udGV4dC5wb3AoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gbWF5YmUgc3RhcnQgYSBzZWN0aW9uXG4gICAgczogZnVuY3Rpb24odmFsLCBjdHgsIHBhcnRpYWxzLCBpbnZlcnRlZCwgc3RhcnQsIGVuZCwgdGFncykge1xuICAgICAgdmFyIHBhc3M7XG5cbiAgICAgIGlmIChpc0FycmF5KHZhbCkgJiYgdmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gdGhpcy5tcyh2YWwsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKTtcbiAgICAgIH1cblxuICAgICAgcGFzcyA9ICEhdmFsO1xuXG4gICAgICBpZiAoIWludmVydGVkICYmIHBhc3MgJiYgY3R4KSB7XG4gICAgICAgIGN0eC5wdXNoKCh0eXBlb2YgdmFsID09ICdvYmplY3QnKSA/IHZhbCA6IGN0eFtjdHgubGVuZ3RoIC0gMV0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGFzcztcbiAgICB9LFxuXG4gICAgLy8gZmluZCB2YWx1ZXMgd2l0aCBkb3R0ZWQgbmFtZXNcbiAgICBkOiBmdW5jdGlvbihrZXksIGN0eCwgcGFydGlhbHMsIHJldHVybkZvdW5kKSB7XG4gICAgICB2YXIgZm91bmQsXG4gICAgICAgICAgbmFtZXMgPSBrZXkuc3BsaXQoJy4nKSxcbiAgICAgICAgICB2YWwgPSB0aGlzLmYobmFtZXNbMF0sIGN0eCwgcGFydGlhbHMsIHJldHVybkZvdW5kKSxcbiAgICAgICAgICBkb01vZGVsR2V0ID0gdGhpcy5vcHRpb25zLm1vZGVsR2V0LFxuICAgICAgICAgIGN4ID0gbnVsbDtcblxuICAgICAgaWYgKGtleSA9PT0gJy4nICYmIGlzQXJyYXkoY3R4W2N0eC5sZW5ndGggLSAyXSkpIHtcbiAgICAgICAgdmFsID0gY3R4W2N0eC5sZW5ndGggLSAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmb3VuZCA9IGZpbmRJblNjb3BlKG5hbWVzW2ldLCB2YWwsIGRvTW9kZWxHZXQpO1xuICAgICAgICAgIGlmIChmb3VuZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjeCA9IHZhbDtcbiAgICAgICAgICAgIHZhbCA9IGZvdW5kO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWwgPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHJldHVybkZvdW5kICYmICF2YWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJldHVybkZvdW5kICYmIHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjdHgucHVzaChjeCk7XG4gICAgICAgIHZhbCA9IHRoaXMubXYodmFsLCBjdHgsIHBhcnRpYWxzKTtcbiAgICAgICAgY3R4LnBvcCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICAvLyBmaW5kIHZhbHVlcyB3aXRoIG5vcm1hbCBuYW1lc1xuICAgIGY6IGZ1bmN0aW9uKGtleSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpIHtcbiAgICAgIHZhciB2YWwgPSBmYWxzZSxcbiAgICAgICAgICB2ID0gbnVsbCxcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlLFxuICAgICAgICAgIGRvTW9kZWxHZXQgPSB0aGlzLm9wdGlvbnMubW9kZWxHZXQ7XG5cbiAgICAgIGZvciAodmFyIGkgPSBjdHgubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgdiA9IGN0eFtpXTtcbiAgICAgICAgdmFsID0gZmluZEluU2NvcGUoa2V5LCB2LCBkb01vZGVsR2V0KTtcbiAgICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgcmV0dXJuIChyZXR1cm5Gb3VuZCkgPyBmYWxzZSA6IFwiXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmV0dXJuRm91bmQgJiYgdHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbCA9IHRoaXMubXYodmFsLCBjdHgsIHBhcnRpYWxzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgLy8gaGlnaGVyIG9yZGVyIHRlbXBsYXRlc1xuICAgIGxzOiBmdW5jdGlvbihmdW5jLCBjeCwgcGFydGlhbHMsIHRleHQsIHRhZ3MpIHtcbiAgICAgIHZhciBvbGRUYWdzID0gdGhpcy5vcHRpb25zLmRlbGltaXRlcnM7XG5cbiAgICAgIHRoaXMub3B0aW9ucy5kZWxpbWl0ZXJzID0gdGFncztcbiAgICAgIHRoaXMuYih0aGlzLmN0KGNvZXJjZVRvU3RyaW5nKGZ1bmMuY2FsbChjeCwgdGV4dCkpLCBjeCwgcGFydGlhbHMpKTtcbiAgICAgIHRoaXMub3B0aW9ucy5kZWxpbWl0ZXJzID0gb2xkVGFncztcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBjb21waWxlIHRleHRcbiAgICBjdDogZnVuY3Rpb24odGV4dCwgY3gsIHBhcnRpYWxzKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmRpc2FibGVMYW1iZGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdMYW1iZGEgZmVhdHVyZXMgZGlzYWJsZWQuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5jLmNvbXBpbGUodGV4dCwgdGhpcy5vcHRpb25zKS5yZW5kZXIoY3gsIHBhcnRpYWxzKTtcbiAgICB9LFxuXG4gICAgLy8gdGVtcGxhdGUgcmVzdWx0IGJ1ZmZlcmluZ1xuICAgIGI6IGZ1bmN0aW9uKHMpIHsgdGhpcy5idWYgKz0gczsgfSxcblxuICAgIGZsOiBmdW5jdGlvbigpIHsgdmFyIHIgPSB0aGlzLmJ1ZjsgdGhpcy5idWYgPSAnJzsgcmV0dXJuIHI7IH0sXG5cbiAgICAvLyBtZXRob2QgcmVwbGFjZSBzZWN0aW9uXG4gICAgbXM6IGZ1bmN0aW9uKGZ1bmMsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKSB7XG4gICAgICB2YXIgdGV4dFNvdXJjZSxcbiAgICAgICAgICBjeCA9IGN0eFtjdHgubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5jYWxsKGN4KTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoaW52ZXJ0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0ZXh0U291cmNlID0gKHRoaXMuYWN0aXZlU3ViICYmIHRoaXMuc3Vic1RleHQgJiYgdGhpcy5zdWJzVGV4dFt0aGlzLmFjdGl2ZVN1Yl0pID8gdGhpcy5zdWJzVGV4dFt0aGlzLmFjdGl2ZVN1Yl0gOiB0aGlzLnRleHQ7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubHMocmVzdWx0LCBjeCwgcGFydGlhbHMsIHRleHRTb3VyY2Uuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpLCB0YWdzKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvLyBtZXRob2QgcmVwbGFjZSB2YXJpYWJsZVxuICAgIG12OiBmdW5jdGlvbihmdW5jLCBjdHgsIHBhcnRpYWxzKSB7XG4gICAgICB2YXIgY3ggPSBjdHhbY3R4Lmxlbmd0aCAtIDFdO1xuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuY2FsbChjeCk7XG5cbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3QoY29lcmNlVG9TdHJpbmcocmVzdWx0LmNhbGwoY3gpKSwgY3gsIHBhcnRpYWxzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgc3ViOiBmdW5jdGlvbihuYW1lLCBjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICB2YXIgZiA9IHRoaXMuc3Vic1tuYW1lXTtcbiAgICAgIGlmIChmKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlU3ViID0gbmFtZTtcbiAgICAgICAgZihjb250ZXh0LCBwYXJ0aWFscywgdGhpcywgaW5kZW50KTtcbiAgICAgICAgdGhpcy5hY3RpdmVTdWIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfTtcblxuICAvL0ZpbmQgYSBrZXkgaW4gYW4gb2JqZWN0XG4gIGZ1bmN0aW9uIGZpbmRJblNjb3BlKGtleSwgc2NvcGUsIGRvTW9kZWxHZXQpIHtcbiAgICB2YXIgdmFsO1xuXG4gICAgaWYgKHNjb3BlICYmIHR5cGVvZiBzY29wZSA9PSAnb2JqZWN0Jykge1xuXG4gICAgICBpZiAoc2NvcGVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhbCA9IHNjb3BlW2tleV07XG5cbiAgICAgIC8vIHRyeSBsb29rdXAgd2l0aCBnZXQgZm9yIGJhY2tib25lIG9yIHNpbWlsYXIgbW9kZWwgZGF0YVxuICAgICAgfSBlbHNlIGlmIChkb01vZGVsR2V0ICYmIHNjb3BlLmdldCAmJiB0eXBlb2Ygc2NvcGUuZ2V0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gc2NvcGUuZ2V0KGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNwZWNpYWxpemVkUGFydGlhbChpbnN0YW5jZSwgc3VicywgcGFydGlhbHMsIHN0YWNrU3Vicywgc3RhY2tQYXJ0aWFscywgc3RhY2tUZXh0KSB7XG4gICAgZnVuY3Rpb24gUGFydGlhbFRlbXBsYXRlKCkge307XG4gICAgUGFydGlhbFRlbXBsYXRlLnByb3RvdHlwZSA9IGluc3RhbmNlO1xuICAgIGZ1bmN0aW9uIFN1YnN0aXR1dGlvbnMoKSB7fTtcbiAgICBTdWJzdGl0dXRpb25zLnByb3RvdHlwZSA9IGluc3RhbmNlLnN1YnM7XG4gICAgdmFyIGtleTtcbiAgICB2YXIgcGFydGlhbCA9IG5ldyBQYXJ0aWFsVGVtcGxhdGUoKTtcbiAgICBwYXJ0aWFsLnN1YnMgPSBuZXcgU3Vic3RpdHV0aW9ucygpO1xuICAgIHBhcnRpYWwuc3Vic1RleHQgPSB7fTsgIC8vaGVoZS4gc3Vic3RleHQuXG4gICAgcGFydGlhbC5idWYgPSAnJztcblxuICAgIHN0YWNrU3VicyA9IHN0YWNrU3VicyB8fCB7fTtcbiAgICBwYXJ0aWFsLnN0YWNrU3VicyA9IHN0YWNrU3VicztcbiAgICBwYXJ0aWFsLnN1YnNUZXh0ID0gc3RhY2tUZXh0O1xuICAgIGZvciAoa2V5IGluIHN1YnMpIHtcbiAgICAgIGlmICghc3RhY2tTdWJzW2tleV0pIHN0YWNrU3Vic1trZXldID0gc3Vic1trZXldO1xuICAgIH1cbiAgICBmb3IgKGtleSBpbiBzdGFja1N1YnMpIHtcbiAgICAgIHBhcnRpYWwuc3Vic1trZXldID0gc3RhY2tTdWJzW2tleV07XG4gICAgfVxuXG4gICAgc3RhY2tQYXJ0aWFscyA9IHN0YWNrUGFydGlhbHMgfHwge307XG4gICAgcGFydGlhbC5zdGFja1BhcnRpYWxzID0gc3RhY2tQYXJ0aWFscztcbiAgICBmb3IgKGtleSBpbiBwYXJ0aWFscykge1xuICAgICAgaWYgKCFzdGFja1BhcnRpYWxzW2tleV0pIHN0YWNrUGFydGlhbHNba2V5XSA9IHBhcnRpYWxzW2tleV07XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHN0YWNrUGFydGlhbHMpIHtcbiAgICAgIHBhcnRpYWwucGFydGlhbHNba2V5XSA9IHN0YWNrUGFydGlhbHNba2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFydGlhbDtcbiAgfVxuXG4gIHZhciByQW1wID0gLyYvZyxcbiAgICAgIHJMdCA9IC88L2csXG4gICAgICByR3QgPSAvPi9nLFxuICAgICAgckFwb3MgPSAvXFwnL2csXG4gICAgICByUXVvdCA9IC9cXFwiL2csXG4gICAgICBoQ2hhcnMgPSAvWyY8PlxcXCJcXCddLztcblxuICBmdW5jdGlvbiBjb2VyY2VUb1N0cmluZyh2YWwpIHtcbiAgICByZXR1cm4gU3RyaW5nKCh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpID8gJycgOiB2YWwpO1xuICB9XG5cbiAgZnVuY3Rpb24gaG9nYW5Fc2NhcGUoc3RyKSB7XG4gICAgc3RyID0gY29lcmNlVG9TdHJpbmcoc3RyKTtcbiAgICByZXR1cm4gaENoYXJzLnRlc3Qoc3RyKSA/XG4gICAgICBzdHJcbiAgICAgICAgLnJlcGxhY2UockFtcCwgJyZhbXA7JylcbiAgICAgICAgLnJlcGxhY2Uockx0LCAnJmx0OycpXG4gICAgICAgIC5yZXBsYWNlKHJHdCwgJyZndDsnKVxuICAgICAgICAucmVwbGFjZShyQXBvcywgJyYjMzk7JylcbiAgICAgICAgLnJlcGxhY2UoclF1b3QsICcmcXVvdDsnKSA6XG4gICAgICBzdHI7XG4gIH1cblxuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24oYSkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbn0pKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiBIb2dhbik7XG4iLCIoZnVuY3Rpb24gKCQpIHtcblxuICAkLmZuLmN1c3RvbVNjcm9sbGJhciA9IGZ1bmN0aW9uIChvcHRpb25zLCBhcmdzKSB7XG5cbiAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICBza2luOiB1bmRlZmluZWQsXG4gICAgICBoU2Nyb2xsOiB0cnVlLFxuICAgICAgdlNjcm9sbDogdHJ1ZSxcbiAgICAgIHVwZGF0ZU9uV2luZG93UmVzaXplOiBmYWxzZSxcbiAgICAgIGFuaW1hdGlvblNwZWVkOiAzMDAsXG4gICAgICBvbkN1c3RvbVNjcm9sbDogdW5kZWZpbmVkLFxuICAgICAgc3dpcGVTcGVlZDogMSxcbiAgICAgIHdoZWVsU3BlZWQ6IDQwLFxuICAgICAgZml4ZWRUaHVtYldpZHRoOiB1bmRlZmluZWQsXG4gICAgICBmaXhlZFRodW1iSGVpZ2h0OiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICB2YXIgU2Nyb2xsYWJsZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICB0aGlzLmFkZFNjcm9sbGFibGVDbGFzcygpO1xuICAgICAgdGhpcy5hZGRTa2luQ2xhc3MoKTtcbiAgICAgIHRoaXMuYWRkU2Nyb2xsQmFyQ29tcG9uZW50cygpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy52U2Nyb2xsKVxuICAgICAgICB0aGlzLnZTY3JvbGxiYXIgPSBuZXcgU2Nyb2xsYmFyKHRoaXMsIG5ldyBWU2l6aW5nKCkpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5oU2Nyb2xsKVxuICAgICAgICB0aGlzLmhTY3JvbGxiYXIgPSBuZXcgU2Nyb2xsYmFyKHRoaXMsIG5ldyBIU2l6aW5nKCkpO1xuICAgICAgdGhpcy4kZWxlbWVudC5kYXRhKFwic2Nyb2xsYWJsZVwiLCB0aGlzKTtcbiAgICAgIHRoaXMuaW5pdEtleWJvYXJkU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9XG5cbiAgICBTY3JvbGxhYmxlLnByb3RvdHlwZSA9IHtcblxuICAgICAgYWRkU2Nyb2xsYWJsZUNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy4kZWxlbWVudC5oYXNDbGFzcyhcInNjcm9sbGFibGVcIikpIHtcbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGVBZGRlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyhcInNjcm9sbGFibGVcIik7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNjcm9sbGFibGVDbGFzczogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxhYmxlQWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhcInNjcm9sbGFibGVcIik7XG4gICAgICB9LFxuXG4gICAgICBhZGRTa2luQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZih0aGlzLm9wdGlvbnMuc2tpbikgPT0gXCJzdHJpbmdcIiAmJiAhdGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLm9wdGlvbnMuc2tpbikpIHtcbiAgICAgICAgICB0aGlzLnNraW5DbGFzc0FkZGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5za2luKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlU2tpbkNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNraW5DbGFzc0FkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLnNraW4pO1xuICAgICAgfSxcblxuICAgICAgYWRkU2Nyb2xsQmFyQ29tcG9uZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmFzc2lnblZpZXdQb3J0KCk7XG4gICAgICAgIGlmICh0aGlzLiR2aWV3UG9ydC5sZW5ndGggPT0gMCkge1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQud3JhcElubmVyKFwiPGRpdiBjbGFzcz1cXFwidmlld3BvcnRcXFwiIC8+XCIpO1xuICAgICAgICAgIHRoaXMuYXNzaWduVmlld1BvcnQoKTtcbiAgICAgICAgICB0aGlzLnZpZXdQb3J0QWRkZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXNzaWduT3ZlcnZpZXcoKTtcbiAgICAgICAgaWYgKHRoaXMuJG92ZXJ2aWV3Lmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy4kdmlld1BvcnQud3JhcElubmVyKFwiPGRpdiBjbGFzcz1cXFwib3ZlcnZpZXdcXFwiIC8+XCIpO1xuICAgICAgICAgIHRoaXMuYXNzaWduT3ZlcnZpZXcoKTtcbiAgICAgICAgICB0aGlzLm92ZXJ2aWV3QWRkZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsQmFyKFwidmVydGljYWxcIiwgXCJwcmVwZW5kXCIpO1xuICAgICAgICB0aGlzLmFkZFNjcm9sbEJhcihcImhvcml6b250YWxcIiwgXCJhcHBlbmRcIik7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTY3JvbGxiYXJDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsYmFyKFwidmVydGljYWxcIik7XG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsYmFyKFwiaG9yaXpvbnRhbFwiKTtcbiAgICAgICAgaWYgKHRoaXMub3ZlcnZpZXdBZGRlZClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnVud3JhcCgpO1xuICAgICAgICBpZiAodGhpcy52aWV3UG9ydEFkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudW53cmFwKCk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTY3JvbGxiYXI6IGZ1bmN0aW9uIChvcmllbnRhdGlvbikge1xuICAgICAgICBpZiAodGhpc1tvcmllbnRhdGlvbiArIFwiU2Nyb2xsYmFyQWRkZWRcIl0pXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5maW5kKFwiLnNjcm9sbC1iYXIuXCIgKyBvcmllbnRhdGlvbikucmVtb3ZlKCk7XG4gICAgICB9LFxuXG4gICAgICBhc3NpZ25WaWV3UG9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiR2aWV3UG9ydCA9IHRoaXMuJGVsZW1lbnQuZmluZChcIi52aWV3cG9ydFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIGFzc2lnbk92ZXJ2aWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJG92ZXJ2aWV3ID0gdGhpcy4kdmlld1BvcnQuZmluZChcIi5vdmVydmlld1wiKTtcbiAgICAgIH0sXG5cbiAgICAgIGFkZFNjcm9sbEJhcjogZnVuY3Rpb24gKG9yaWVudGF0aW9uLCBmdW4pIHtcbiAgICAgICAgaWYgKHRoaXMuJGVsZW1lbnQuZmluZChcIi5zY3JvbGwtYmFyLlwiICsgb3JpZW50YXRpb24pLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudFtmdW5dKFwiPGRpdiBjbGFzcz0nc2Nyb2xsLWJhciBcIiArIG9yaWVudGF0aW9uICsgXCInPjxkaXYgY2xhc3M9J3RodW1iJz48L2Rpdj48L2Rpdj5cIilcbiAgICAgICAgICB0aGlzW29yaWVudGF0aW9uICsgXCJTY3JvbGxiYXJBZGRlZFwiXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKGtlZXBQb3NpdGlvbikge1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5yZXNpemUoa2VlcFBvc2l0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIucmVzaXplKGtlZXBQb3NpdGlvbik7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUbzogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIuc2Nyb2xsVG9FbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICBpZiAodGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMuaFNjcm9sbGJhci5zY3JvbGxUb0VsZW1lbnQoZWxlbWVudCk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb1hZOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB0aGlzLnNjcm9sbFRvWCh4KTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb1koeSk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb1g6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnNjcm9sbE92ZXJ2aWV3VG8oeCwgdHJ1ZSk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb1k6IGZ1bmN0aW9uICh5KSB7XG4gICAgICAgIGlmICh0aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy52U2Nyb2xsYmFyLnNjcm9sbE92ZXJ2aWV3VG8oeSwgdHJ1ZSk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxhYmxlQ2xhc3MoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTa2luQ2xhc3MoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxiYXJDb21wb25lbnRzKCk7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQuZGF0YShcInNjcm9sbGFibGVcIiwgbnVsbCk7XG4gICAgICAgIHRoaXMucmVtb3ZlS2V5Ym9hcmRTY3JvbGxpbmcoKTtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnJlbW92ZSgpO1xuICAgICAgfSxcblxuICAgICAgc2V0QW5pbWF0aW9uU3BlZWQ6IGZ1bmN0aW9uIChzcGVlZCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uU3BlZWQgPSBzcGVlZDtcbiAgICAgIH0sXG5cbiAgICAgIGlzSW5zaWRlOiBmdW5jdGlvbiAoZWxlbWVudCwgd3JhcHBpbmdFbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHZhciAkd3JhcHBpbmdFbGVtZW50ID0gJCh3cmFwcGluZ0VsZW1lbnQpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgd3JhcHBpbmdFbGVtZW50T2Zmc2V0ID0gJHdyYXBwaW5nRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50T2Zmc2V0LnRvcCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQudG9wKSAmJiAoZWxlbWVudE9mZnNldC5sZWZ0ID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC5sZWZ0KSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LnRvcCArICRlbGVtZW50LmhlaWdodCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3AgKyAkd3JhcHBpbmdFbGVtZW50LmhlaWdodCgpKSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LmxlZnQgKyAkZWxlbWVudC53aWR0aCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC5sZWZ0ICsgJHdyYXBwaW5nRWxlbWVudC53aWR0aCgpKVxuICAgICAgfSxcblxuICAgICAgaW5pdEtleWJvYXJkU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50S2V5ZG93biA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBfdGhpcy4kZWxlbWVudFswXSkge1xuICAgICAgICAgICAgaWYgKF90aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgICAgIF90aGlzLnZTY3JvbGxiYXIua2V5U2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgICAgIGlmIChfdGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgICAgICBfdGhpcy5oU2Nyb2xsYmFyLmtleVNjcm9sbChldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAgIC5hdHRyKCd0YWJpbmRleCcsICctMScpXG4gICAgICAgICAgLmtleWRvd24odGhpcy5lbGVtZW50S2V5ZG93bik7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVLZXlib2FyZFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgICAgLnJlbW92ZUF0dHIoJ3RhYmluZGV4JylcbiAgICAgICAgICAudW5iaW5kKFwia2V5ZG93blwiLCB0aGlzLmVsZW1lbnRLZXlkb3duKTtcbiAgICAgIH0sXG5cbiAgICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5vbkN1c3RvbVNjcm9sbClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKFwiY3VzdG9tU2Nyb2xsXCIsIHRoaXMub3B0aW9ucy5vbkN1c3RvbVNjcm9sbCk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgU2Nyb2xsYmFyID0gZnVuY3Rpb24gKHNjcm9sbGFibGUsIHNpemluZykge1xuICAgICAgdGhpcy5zY3JvbGxhYmxlID0gc2Nyb2xsYWJsZTtcbiAgICAgIHRoaXMuc2l6aW5nID0gc2l6aW5nXG4gICAgICB0aGlzLiRzY3JvbGxCYXIgPSB0aGlzLnNpemluZy5zY3JvbGxCYXIodGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50KTtcbiAgICAgIHRoaXMuJHRodW1iID0gdGhpcy4kc2Nyb2xsQmFyLmZpbmQoXCIudGh1bWJcIik7XG4gICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKDAsIDApO1xuICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICAgIHRoaXMuaW5pdE1vdXNlTW92ZVNjcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0TW91c2VXaGVlbFNjcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0VG91Y2hTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuaW5pdE1vdXNlQ2xpY2tTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuaW5pdFdpbmRvd1Jlc2l6ZSgpO1xuICAgIH1cblxuICAgIFNjcm9sbGJhci5wcm90b3R5cGUgPSB7XG5cbiAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKGtlZXBQb3NpdGlvbikge1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0LmhlaWdodCh0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgICB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQsIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50KSk7XG4gICAgICAgIHRoaXMudmlld1BvcnRTaXplID0gdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0KTtcbiAgICAgICAgdGhpcy5vdmVydmlld1NpemUgPSB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcpO1xuICAgICAgICB0aGlzLnJhdGlvID0gdGhpcy52aWV3UG9ydFNpemUgLyB0aGlzLm92ZXJ2aWV3U2l6ZTtcbiAgICAgICAgdGhpcy5zaXppbmcuc2l6ZSh0aGlzLiRzY3JvbGxCYXIsIHRoaXMudmlld1BvcnRTaXplKTtcbiAgICAgICAgdGhpcy50aHVtYlNpemUgPSB0aGlzLmNhbGN1bGF0ZVRodW1iU2l6ZSgpO1xuICAgICAgICB0aGlzLnNpemluZy5zaXplKHRoaXMuJHRodW1iLCB0aGlzLnRodW1iU2l6ZSk7XG4gICAgICAgIHRoaXMubWF4VGh1bWJQb3NpdGlvbiA9IHRoaXMuY2FsY3VsYXRlTWF4VGh1bWJQb3NpdGlvbigpO1xuICAgICAgICB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLmNhbGN1bGF0ZU1heE92ZXJ2aWV3UG9zaXRpb24oKTtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gKHRoaXMub3ZlcnZpZXdTaXplID4gdGhpcy52aWV3UG9ydFNpemUpO1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxQZXJjZW50ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgdGhpcy5zY3JvbGxQZXJjZW50ID0gMC4wO1xuICAgICAgICBpZiAodGhpcy5lbmFibGVkKVxuICAgICAgICAgIHRoaXMucmVzY3JvbGwoa2VlcFBvc2l0aW9uKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHRoaXMuJHNjcm9sbEJhci50b2dnbGUodGhpcy5lbmFibGVkKTtcbiAgICAgIH0sXG5cbiAgICAgIGNhbGN1bGF0ZVRodW1iU2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZml4ZWRTaXplID0gdGhpcy5zaXppbmcuZml4ZWRUaHVtYlNpemUodGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMpXG4gICAgICAgIHZhciBzaXplO1xuICAgICAgICBpZiAoZml4ZWRTaXplKVxuICAgICAgICAgIHNpemUgPSBmaXhlZFNpemU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzaXplID0gdGhpcy5yYXRpbyAqIHRoaXMudmlld1BvcnRTaXplXG4gICAgICAgIHJldHVybiBNYXRoLm1heChzaXplLCB0aGlzLnNpemluZy5taW5TaXplKHRoaXMuJHRodW1iKSk7XG4gICAgICB9LFxuXG4gICAgICBpbml0TW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuJHRodW1iLm1vdXNlZG93bihmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuZW5hYmxlZClcbiAgICAgICAgICAgIF90aGlzLnN0YXJ0TW91c2VNb3ZlU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZG9jdW1lbnRNb3VzZXVwID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgX3RoaXMuc3RvcE1vdXNlTW92ZVNjcm9sbGluZyhldmVudCk7XG4gICAgICAgIH07XG4gICAgICAgICQoZG9jdW1lbnQpLm1vdXNldXAodGhpcy5kb2N1bWVudE1vdXNldXApO1xuICAgICAgICB0aGlzLmRvY3VtZW50TW91c2Vtb3ZlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgX3RoaXMubW91c2VNb3ZlU2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgfTtcbiAgICAgICAgJChkb2N1bWVudCkubW91c2Vtb3ZlKHRoaXMuZG9jdW1lbnRNb3VzZW1vdmUpO1xuICAgICAgICB0aGlzLiR0aHVtYi5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kdGh1bWIudW5iaW5kKCk7XG4gICAgICAgICQoZG9jdW1lbnQpLnVuYmluZChcIm1vdXNldXBcIiwgdGhpcy5kb2N1bWVudE1vdXNldXApO1xuICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoXCJtb3VzZW1vdmVcIiwgdGhpcy5kb2N1bWVudE1vdXNlbW92ZSk7XG4gICAgICB9LFxuXG4gICAgICBpbml0TW91c2VXaGVlbFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQubW91c2V3aGVlbChmdW5jdGlvbiAoZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICAgIGlmIChfdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMubW91c2VXaGVlbFNjcm9sbChkZWx0YVgsIGRlbHRhWSkpIHtcbiAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZU1vdXNlV2hlZWxTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50LnVuYmluZChcIm1vdXNld2hlZWxcIik7XG4gICAgICB9LFxuXG4gICAgICBpbml0VG91Y2hTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgIHRoaXMuZWxlbWVudFRvdWNoc3RhcnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5lbmFibGVkKVxuICAgICAgICAgICAgICBfdGhpcy5zdGFydFRvdWNoU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIHRoaXMuZWxlbWVudFRvdWNoc3RhcnQpO1xuICAgICAgICAgIHRoaXMuZG9jdW1lbnRUb3VjaG1vdmUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIF90aGlzLnRvdWNoU2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLmRvY3VtZW50VG91Y2htb3ZlKTtcbiAgICAgICAgICB0aGlzLmVsZW1lbnRUb3VjaGVuZCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgX3RoaXMuc3RvcFRvdWNoU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLmVsZW1lbnRUb3VjaGVuZCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIHRoaXMuZWxlbWVudFRvdWNoc3RhcnQpO1xuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5kb2N1bWVudFRvdWNobW92ZSk7XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLmVsZW1lbnRUb3VjaGVuZCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGluaXRNb3VzZUNsaWNrU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2Nyb2xsQmFyQ2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBfdGhpcy5tb3VzZUNsaWNrU2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy4kc2Nyb2xsQmFyLmNsaWNrKHRoaXMuc2Nyb2xsQmFyQ2xpY2spO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlTW91c2VDbGlja1Njcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRzY3JvbGxCYXIudW5iaW5kKFwiY2xpY2tcIiwgdGhpcy5zY3JvbGxCYXJDbGljayk7XG4gICAgICB9LFxuXG4gICAgICBpbml0V2luZG93UmVzaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbGFibGUub3B0aW9ucy51cGRhdGVPbldpbmRvd1Jlc2l6ZSkge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgdGhpcy53aW5kb3dSZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5yZXNpemUoKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgICQod2luZG93KS5yZXNpemUodGhpcy53aW5kb3dSZXNpemUpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVXaW5kb3dSZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh3aW5kb3cpLnVuYmluZChcInJlc2l6ZVwiLCB0aGlzLndpbmRvd1Jlc2l6ZSk7XG4gICAgICB9LFxuXG4gICAgICBpc0tleVNjcm9sbGluZzogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5rZXlTY3JvbGxEZWx0YShrZXkpICE9IG51bGw7XG4gICAgICB9LFxuXG4gICAgICBrZXlTY3JvbGxEZWx0YTogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBmb3IgKHZhciBzY3JvbGxpbmdLZXkgaW4gdGhpcy5zaXppbmcuc2Nyb2xsaW5nS2V5cylcbiAgICAgICAgICBpZiAoc2Nyb2xsaW5nS2V5ID09IGtleSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNpemluZy5zY3JvbGxpbmdLZXlzW2tleV0odGhpcy52aWV3UG9ydFNpemUpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sXG5cbiAgICAgIHN0YXJ0TW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZU1vdmVTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICAkKFwiaHRtbFwiKS5hZGRDbGFzcyhcIm5vdC1zZWxlY3RhYmxlXCIpO1xuICAgICAgICB0aGlzLnNldFVuc2VsZWN0YWJsZSgkKFwiaHRtbFwiKSwgXCJvblwiKTtcbiAgICAgICAgdGhpcy5zZXRTY3JvbGxFdmVudChldmVudCk7XG4gICAgICB9LFxuXG4gICAgICBzdG9wTW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZU1vdmVTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgJChcImh0bWxcIikucmVtb3ZlQ2xhc3MoXCJub3Qtc2VsZWN0YWJsZVwiKTtcbiAgICAgICAgdGhpcy5zZXRVbnNlbGVjdGFibGUoJChcImh0bWxcIiksIG51bGwpO1xuICAgICAgfSxcblxuICAgICAgc2V0VW5zZWxlY3RhYmxlOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYXR0cihcInVuc2VsZWN0YWJsZVwiKSAhPSB2YWx1ZSkge1xuICAgICAgICAgIGVsZW1lbnQuYXR0cihcInVuc2VsZWN0YWJsZVwiLCB2YWx1ZSk7XG4gICAgICAgICAgZWxlbWVudC5maW5kKCc6bm90KGlucHV0KScpLmF0dHIoJ3Vuc2VsZWN0YWJsZScsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgbW91c2VNb3ZlU2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMubW91c2VNb3ZlU2Nyb2xsaW5nKSB7XG4gICAgICAgICAgdmFyIGRlbHRhID0gdGhpcy5zaXppbmcubW91c2VEZWx0YSh0aGlzLnNjcm9sbEV2ZW50LCBldmVudCk7XG4gICAgICAgICAgdGhpcy5zY3JvbGxUaHVtYkJ5KGRlbHRhKTtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc3RhcnRUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC50b3VjaGVzICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50LnRvdWNoZXNbMF0pO1xuICAgICAgICAgIHRoaXMudG91Y2hTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICB0b3VjaFNjcm9sbDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnRvdWNoU2Nyb2xsaW5nICYmIGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgIHZhciBkZWx0YSA9IC10aGlzLnNpemluZy5tb3VzZURlbHRhKHRoaXMuc2Nyb2xsRXZlbnQsIGV2ZW50LnRvdWNoZXNbMF0pICogdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMuc3dpcGVTcGVlZDtcbiAgICAgICAgICB2YXIgc2Nyb2xsZWQgPSB0aGlzLnNjcm9sbE92ZXJ2aWV3QnkoZGVsdGEpO1xuICAgICAgICAgIGlmIChzY3JvbGxlZCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5zZXRTY3JvbGxFdmVudChldmVudC50b3VjaGVzWzBdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHN0b3BUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHRoaXMudG91Y2hTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZVdoZWVsU2Nyb2xsOiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gLXRoaXMuc2l6aW5nLndoZWVsRGVsdGEoZGVsdGFYLCBkZWx0YVkpICogdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMud2hlZWxTcGVlZDtcbiAgICAgICAgaWYgKGRlbHRhICE9IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeShkZWx0YSk7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZUNsaWNrU2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gdGhpcy52aWV3UG9ydFNpemUgLSAyMDtcbiAgICAgICAgaWYgKGV2ZW50W1wicGFnZVwiICsgdGhpcy5zaXppbmcuc2Nyb2xsQXhpcygpXSA8IHRoaXMuJHRodW1iLm9mZnNldCgpW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXSlcbiAgICAgICAgLy8gbW91c2UgY2xpY2sgb3ZlciB0aHVtYlxuICAgICAgICAgIGRlbHRhID0gLWRlbHRhO1xuICAgICAgICB0aGlzLnNjcm9sbE92ZXJ2aWV3QnkoZGVsdGEpO1xuICAgICAgfSxcblxuICAgICAga2V5U2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGtleURvd24gPSBldmVudC53aGljaDtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlZCAmJiB0aGlzLmlzS2V5U2Nyb2xsaW5nKGtleURvd24pKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeSh0aGlzLmtleVNjcm9sbERlbHRhKGtleURvd24pKSlcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRodW1iQnk6IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgICAgICB2YXIgdGh1bWJQb3NpdGlvbiA9IHRoaXMudGh1bWJQb3NpdGlvbigpO1xuICAgICAgICB0aHVtYlBvc2l0aW9uICs9IGRlbHRhO1xuICAgICAgICB0aHVtYlBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbk9yTWF4KHRodW1iUG9zaXRpb24sIHRoaXMubWF4VGh1bWJQb3NpdGlvbik7XG4gICAgICAgIHZhciBvbGRTY3JvbGxQZXJjZW50ID0gdGhpcy5zY3JvbGxQZXJjZW50O1xuICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSB0aHVtYlBvc2l0aW9uIC8gdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9ICh0aHVtYlBvc2l0aW9uICogdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uKSAvIHRoaXMubWF4VGh1bWJQb3NpdGlvbjtcbiAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgaWYgKG9sZFNjcm9sbFBlcmNlbnQgIT0gdGhpcy5zY3JvbGxQZXJjZW50KSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tU2Nyb2xsKG9sZFNjcm9sbFBlcmNlbnQpO1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG5cbiAgICAgIHRodW1iUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHRodW1iLnBvc2l0aW9uKClbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsT3ZlcnZpZXdCeTogZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gdGhpcy5vdmVydmlld1Bvc2l0aW9uKCkgKyBkZWx0YTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsT3ZlcnZpZXdUbyhvdmVydmlld1Bvc2l0aW9uLCBmYWxzZSk7XG4gICAgICB9LFxuXG4gICAgICBvdmVydmlld1Bvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAtdGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldy5wb3NpdGlvbigpW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbE92ZXJ2aWV3VG86IGZ1bmN0aW9uIChvdmVydmlld1Bvc2l0aW9uLCBhbmltYXRlKSB7XG4gICAgICAgIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uT3JNYXgob3ZlcnZpZXdQb3NpdGlvbiwgdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uKTtcbiAgICAgICAgdmFyIG9sZFNjcm9sbFBlcmNlbnQgPSB0aGlzLnNjcm9sbFBlcmNlbnQ7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IG92ZXJ2aWV3UG9zaXRpb24gLyB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb247XG4gICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy5zY3JvbGxQZXJjZW50ICogdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICBpZiAoYW5pbWF0ZSlcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uV2l0aEFuaW1hdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24ob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbik7XG4gICAgICAgIGlmIChvbGRTY3JvbGxQZXJjZW50ICE9IHRoaXMuc2Nyb2xsUGVyY2VudCkge1xuICAgICAgICAgIHRoaXMudHJpZ2dlckN1c3RvbVNjcm9sbChvbGRTY3JvbGxQZXJjZW50KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcblxuICAgICAgcG9zaXRpb25Pck1heDogZnVuY3Rpb24gKHAsIG1heCkge1xuICAgICAgICBpZiAocCA8IDApXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIGVsc2UgaWYgKHAgPiBtYXgpXG4gICAgICAgICAgcmV0dXJuIG1heDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBwO1xuICAgICAgfSxcblxuICAgICAgdHJpZ2dlckN1c3RvbVNjcm9sbDogZnVuY3Rpb24gKG9sZFNjcm9sbFBlcmNlbnQpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50LnRyaWdnZXIoXCJjdXN0b21TY3JvbGxcIiwge1xuICAgICAgICAgICAgc2Nyb2xsQXhpczogdGhpcy5zaXppbmcuc2Nyb2xsQXhpcygpLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLnNpemluZy5zY3JvbGxEaXJlY3Rpb24ob2xkU2Nyb2xsUGVyY2VudCwgdGhpcy5zY3JvbGxQZXJjZW50KSxcbiAgICAgICAgICAgIHNjcm9sbFBlcmNlbnQ6IHRoaXMuc2Nyb2xsUGVyY2VudCAqIDEwMFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlc2Nyb2xsOiBmdW5jdGlvbiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgIGlmIChrZWVwUG9zaXRpb24pIHtcbiAgICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25Pck1heCh0aGlzLm92ZXJ2aWV3UG9zaXRpb24oKSwgdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uKTtcbiAgICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSBvdmVydmlld1Bvc2l0aW9uIC8gdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uO1xuICAgICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy5zY3JvbGxQZXJjZW50ICogdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24ob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgICAgdmFyIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb247XG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc2V0U2Nyb2xsUG9zaXRpb246IGZ1bmN0aW9uIChvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMuJHRodW1iLmNzcyh0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKSwgdGh1bWJQb3NpdGlvbiArIFwicHhcIik7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcuY3NzKHRoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpLCAtb3ZlcnZpZXdQb3NpdGlvbiArIFwicHhcIik7XG4gICAgICB9LFxuXG4gICAgICBzZXRTY3JvbGxQb3NpdGlvbldpdGhBbmltYXRpb246IGZ1bmN0aW9uIChvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKSB7XG4gICAgICAgIHZhciB0aHVtYkFuaW1hdGlvbk9wdHMgPSB7fTtcbiAgICAgICAgdmFyIG92ZXJ2aWV3QW5pbWF0aW9uT3B0cyA9IHt9O1xuICAgICAgICB0aHVtYkFuaW1hdGlvbk9wdHNbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldID0gdGh1bWJQb3NpdGlvbiArIFwicHhcIjtcbiAgICAgICAgdGhpcy4kdGh1bWIuYW5pbWF0ZSh0aHVtYkFuaW1hdGlvbk9wdHMsIHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLmFuaW1hdGlvblNwZWVkKTtcbiAgICAgICAgb3ZlcnZpZXdBbmltYXRpb25PcHRzW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXSA9IC1vdmVydmlld1Bvc2l0aW9uICsgXCJweFwiO1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3LmFuaW1hdGUob3ZlcnZpZXdBbmltYXRpb25PcHRzLCB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy5hbmltYXRpb25TcGVlZCk7XG4gICAgICB9LFxuXG4gICAgICBjYWxjdWxhdGVNYXhUaHVtYlBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpemluZy5zaXplKHRoaXMuJHNjcm9sbEJhcikgLSB0aGlzLnRodW1iU2l6ZTtcbiAgICAgIH0sXG5cbiAgICAgIGNhbGN1bGF0ZU1heE92ZXJ2aWV3UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldykgLSB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQpO1xuICAgICAgfSxcblxuICAgICAgc2V0U2Nyb2xsRXZlbnQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgYXR0ciA9IFwicGFnZVwiICsgdGhpcy5zaXppbmcuc2Nyb2xsQXhpcygpO1xuICAgICAgICBpZiAoIXRoaXMuc2Nyb2xsRXZlbnQgfHwgdGhpcy5zY3JvbGxFdmVudFthdHRyXSAhPSBldmVudFthdHRyXSlcbiAgICAgICAgICB0aGlzLnNjcm9sbEV2ZW50ID0ge3BhZ2VYOiBldmVudC5wYWdlWCwgcGFnZVk6IGV2ZW50LnBhZ2VZfTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvRWxlbWVudDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgaWYgKHRoaXMuc2l6aW5nLmlzSW5zaWRlKCRlbGVtZW50LCB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3KSAmJiAhdGhpcy5zaXppbmcuaXNJbnNpZGUoJGVsZW1lbnQsIHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQpKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAkZWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICB2YXIgb3ZlcnZpZXdPZmZzZXQgPSB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3Lm9mZnNldCgpO1xuICAgICAgICAgIHZhciB2aWV3UG9ydE9mZnNldCA9IHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQub2Zmc2V0KCk7XG4gICAgICAgICAgdGhpcy5zY3JvbGxPdmVydmlld1RvKGVsZW1lbnRPZmZzZXRbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldIC0gb3ZlcnZpZXdPZmZzZXRbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTW91c2VNb3ZlU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlTW91c2VXaGVlbFNjcm9sbGluZygpO1xuICAgICAgICB0aGlzLnJlbW92ZVRvdWNoU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlTW91c2VDbGlja1Njcm9sbGluZygpO1xuICAgICAgICB0aGlzLnJlbW92ZVdpbmRvd1Jlc2l6ZSgpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIEhTaXppbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgfVxuXG4gICAgSFNpemluZy5wcm90b3R5cGUgPSB7XG4gICAgICBzaXplOiBmdW5jdGlvbiAoJGVsLCBhcmcpIHtcbiAgICAgICAgaWYgKGFyZylcbiAgICAgICAgICByZXR1cm4gJGVsLndpZHRoKGFyZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJGVsLndpZHRoKCk7XG4gICAgICB9LFxuXG4gICAgICBtaW5TaXplOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludCgkZWwuY3NzKFwibWluLXdpZHRoXCIpKSB8fCAwO1xuICAgICAgfSxcblxuICAgICAgZml4ZWRUaHVtYlNpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmZpeGVkVGh1bWJXaWR0aDtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEJhcjogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gJGVsLmZpbmQoXCIuc2Nyb2xsLWJhci5ob3Jpem9udGFsXCIpO1xuICAgICAgfSxcblxuICAgICAgbW91c2VEZWx0YTogZnVuY3Rpb24gKGV2ZW50MSwgZXZlbnQyKSB7XG4gICAgICAgIHJldHVybiBldmVudDIucGFnZVggLSBldmVudDEucGFnZVg7XG4gICAgICB9LFxuXG4gICAgICBvZmZzZXRDb21wb25lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwibGVmdFwiO1xuICAgICAgfSxcblxuICAgICAgd2hlZWxEZWx0YTogZnVuY3Rpb24gKGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIHJldHVybiBkZWx0YVg7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxBeGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIlhcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbERpcmVjdGlvbjogZnVuY3Rpb24gKG9sZFBlcmNlbnQsIG5ld1BlcmNlbnQpIHtcbiAgICAgICAgcmV0dXJuIG9sZFBlcmNlbnQgPCBuZXdQZXJjZW50ID8gXCJyaWdodFwiIDogXCJsZWZ0XCI7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxpbmdLZXlzOiB7XG4gICAgICAgIDM3OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIC0xMDsgLy9hcnJvdyBsZWZ0XG4gICAgICAgIH0sXG4gICAgICAgIDM5OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIDEwOyAvL2Fycm93IHJpZ2h0XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGlzSW5zaWRlOiBmdW5jdGlvbiAoZWxlbWVudCwgd3JhcHBpbmdFbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHZhciAkd3JhcHBpbmdFbGVtZW50ID0gJCh3cmFwcGluZ0VsZW1lbnQpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgd3JhcHBpbmdFbGVtZW50T2Zmc2V0ID0gJHdyYXBwaW5nRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50T2Zmc2V0LmxlZnQgPj0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQpICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQubGVmdCArICRlbGVtZW50LndpZHRoKCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQgKyAkd3JhcHBpbmdFbGVtZW50LndpZHRoKCkpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIFZTaXppbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgfVxuXG4gICAgVlNpemluZy5wcm90b3R5cGUgPSB7XG5cbiAgICAgIHNpemU6IGZ1bmN0aW9uICgkZWwsIGFyZykge1xuICAgICAgICBpZiAoYXJnKVxuICAgICAgICAgIHJldHVybiAkZWwuaGVpZ2h0KGFyZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJGVsLmhlaWdodCgpO1xuICAgICAgfSxcblxuICAgICAgbWluU2l6ZTogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoJGVsLmNzcyhcIm1pbi1oZWlnaHRcIikpIHx8IDA7XG4gICAgICB9LFxuXG4gICAgICBmaXhlZFRodW1iU2l6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZml4ZWRUaHVtYkhlaWdodDtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEJhcjogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gJGVsLmZpbmQoXCIuc2Nyb2xsLWJhci52ZXJ0aWNhbFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlRGVsdGE6IGZ1bmN0aW9uIChldmVudDEsIGV2ZW50Mikge1xuICAgICAgICByZXR1cm4gZXZlbnQyLnBhZ2VZIC0gZXZlbnQxLnBhZ2VZO1xuICAgICAgfSxcblxuICAgICAgb2Zmc2V0Q29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcInRvcFwiO1xuICAgICAgfSxcblxuICAgICAgd2hlZWxEZWx0YTogZnVuY3Rpb24gKGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIHJldHVybiBkZWx0YVk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxBeGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIllcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbERpcmVjdGlvbjogZnVuY3Rpb24gKG9sZFBlcmNlbnQsIG5ld1BlcmNlbnQpIHtcbiAgICAgICAgcmV0dXJuIG9sZFBlcmNlbnQgPCBuZXdQZXJjZW50ID8gXCJkb3duXCIgOiBcInVwXCI7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxpbmdLZXlzOiB7XG4gICAgICAgIDM4OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIC0xMDsgLy9hcnJvdyB1cFxuICAgICAgICB9LFxuICAgICAgICA0MDogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiAxMDsgLy9hcnJvdyBkb3duXG4gICAgICAgIH0sXG4gICAgICAgIDMzOiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIC0odmlld1BvcnRTaXplIC0gMjApOyAvL3BhZ2UgdXBcbiAgICAgICAgfSxcbiAgICAgICAgMzQ6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gdmlld1BvcnRTaXplIC0gMjA7IC8vcGFnZSBkb3duXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGlzSW5zaWRlOiBmdW5jdGlvbiAoZWxlbWVudCwgd3JhcHBpbmdFbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHZhciAkd3JhcHBpbmdFbGVtZW50ID0gJCh3cmFwcGluZ0VsZW1lbnQpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgd3JhcHBpbmdFbGVtZW50T2Zmc2V0ID0gJHdyYXBwaW5nRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50T2Zmc2V0LnRvcCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQudG9wKSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LnRvcCArICRlbGVtZW50LmhlaWdodCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3AgKyAkd3JhcHBpbmdFbGVtZW50LmhlaWdodCgpKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gdW5kZWZpbmVkKVxuICAgICAgICBvcHRpb25zID0gZGVmYXVsdE9wdGlvbnM7XG4gICAgICBpZiAodHlwZW9mKG9wdGlvbnMpID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdmFyIHNjcm9sbGFibGUgPSAkKHRoaXMpLmRhdGEoXCJzY3JvbGxhYmxlXCIpO1xuICAgICAgICBpZiAoc2Nyb2xsYWJsZSlcbiAgICAgICAgICBzY3JvbGxhYmxlW29wdGlvbnNdKGFyZ3MpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHlwZW9mKG9wdGlvbnMpID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgbmV3IFNjcm9sbGFibGUoJCh0aGlzKSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IFwiSW52YWxpZCB0eXBlIG9mIG9wdGlvbnNcIjtcbiAgICB9KTtcblxuICB9XG4gIDtcblxufSlcbiAgKGpRdWVyeSk7XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIHZhciB0eXBlcyA9IFsnRE9NTW91c2VTY3JvbGwnLCAnbW91c2V3aGVlbCddO1xuXG4gIGlmICgkLmV2ZW50LmZpeEhvb2tzKSB7XG4gICAgZm9yICh2YXIgaSA9IHR5cGVzLmxlbmd0aDsgaTspIHtcbiAgICAgICQuZXZlbnQuZml4SG9va3NbIHR5cGVzWy0taV0gXSA9ICQuZXZlbnQubW91c2VIb29rcztcbiAgICB9XG4gIH1cblxuICAkLmV2ZW50LnNwZWNpYWwubW91c2V3aGVlbCA9IHtcbiAgICBzZXR1cDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBmb3IgKHZhciBpID0gdHlwZXMubGVuZ3RoOyBpOykge1xuICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0eXBlc1stLWldLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25tb3VzZXdoZWVsID0gaGFuZGxlcjtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdGVhcmRvd246IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHR5cGVzLmxlbmd0aDsgaTspIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZXNbLS1pXSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9ubW91c2V3aGVlbCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICQuZm4uZXh0ZW5kKHtcbiAgICBtb3VzZXdoZWVsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHJldHVybiBmbiA/IHRoaXMuYmluZChcIm1vdXNld2hlZWxcIiwgZm4pIDogdGhpcy50cmlnZ2VyKFwibW91c2V3aGVlbFwiKTtcbiAgICB9LFxuXG4gICAgdW5tb3VzZXdoZWVsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHJldHVybiB0aGlzLnVuYmluZChcIm1vdXNld2hlZWxcIiwgZm4pO1xuICAgIH1cbiAgfSk7XG5cblxuICBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XG4gICAgdmFyIG9yZ0V2ZW50ID0gZXZlbnQgfHwgd2luZG93LmV2ZW50LCBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBkZWx0YSA9IDAsIHJldHVyblZhbHVlID0gdHJ1ZSwgZGVsdGFYID0gMCwgZGVsdGFZID0gMDtcbiAgICBldmVudCA9ICQuZXZlbnQuZml4KG9yZ0V2ZW50KTtcbiAgICBldmVudC50eXBlID0gXCJtb3VzZXdoZWVsXCI7XG5cbiAgICAvLyBPbGQgc2Nob29sIHNjcm9sbHdoZWVsIGRlbHRhXG4gICAgaWYgKG9yZ0V2ZW50LndoZWVsRGVsdGEpIHtcbiAgICAgIGRlbHRhID0gb3JnRXZlbnQud2hlZWxEZWx0YSAvIDEyMDtcbiAgICB9XG4gICAgaWYgKG9yZ0V2ZW50LmRldGFpbCkge1xuICAgICAgZGVsdGEgPSAtb3JnRXZlbnQuZGV0YWlsIC8gMztcbiAgICB9XG5cbiAgICAvLyBOZXcgc2Nob29sIG11bHRpZGltZW5zaW9uYWwgc2Nyb2xsICh0b3VjaHBhZHMpIGRlbHRhc1xuICAgIGRlbHRhWSA9IGRlbHRhO1xuXG4gICAgLy8gR2Vja29cbiAgICBpZiAob3JnRXZlbnQuYXhpcyAhPT0gdW5kZWZpbmVkICYmIG9yZ0V2ZW50LmF4aXMgPT09IG9yZ0V2ZW50LkhPUklaT05UQUxfQVhJUykge1xuICAgICAgZGVsdGFZID0gMDtcbiAgICAgIGRlbHRhWCA9IGRlbHRhO1xuICAgIH1cblxuICAgIC8vIFdlYmtpdFxuICAgIGlmIChvcmdFdmVudC53aGVlbERlbHRhWSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkZWx0YVkgPSBvcmdFdmVudC53aGVlbERlbHRhWSAvIDEyMDtcbiAgICB9XG4gICAgaWYgKG9yZ0V2ZW50LndoZWVsRGVsdGFYICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlbHRhWCA9IG9yZ0V2ZW50LndoZWVsRGVsdGFYIC8gMTIwO1xuICAgIH1cblxuICAgIC8vIEFkZCBldmVudCBhbmQgZGVsdGEgdG8gdGhlIGZyb250IG9mIHRoZSBhcmd1bWVudHNcbiAgICBhcmdzLnVuc2hpZnQoZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICByZXR1cm4gKCQuZXZlbnQuZGlzcGF0Y2ggfHwgJC5ldmVudC5oYW5kbGUpLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbn0pKGpRdWVyeSk7XG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcblx0XCJuYW1lXCI6IFwidHdpdGNoLWNoYXQtZW1vdGVzXCIsXHJcblx0XCJ2ZXJzaW9uXCI6IFwiMC42LjNcIixcclxuXHRcImhvbWVwYWdlXCI6IFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9cIixcclxuXHRcImJ1Z3NcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvaXNzdWVzXCIsXHJcblx0XCJhdXRob3JcIjogXCJSeWFuIENoYXRoYW0gPHJ5YW4uYi5jaGF0aGFtQGdtYWlsLmNvbT4gKGh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjKVwiLFxyXG5cdFwicmVwb3NpdG9yeVwiOiB7XHJcblx0XHRcInR5cGVcIjogXCJnaXRcIixcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2NsZXR1c2MvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzLmdpdFwiXHJcblx0fSxcclxuXHRcInVzZXJzY3JpcHRcIjoge1xyXG5cdFx0XCJuYW1lXCI6IFwiVHdpdGNoIENoYXQgRW1vdGVzXCIsXHJcblx0XHRcIm5hbWVzcGFjZVwiOiBcIiNDbGV0dXNcIixcclxuXHRcdFwidmVyc2lvblwiOiBcInt7e3BrZy52ZXJzaW9ufX19XCIsXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IFwiQWRkcyBhIGJ1dHRvbiB0byBUd2l0Y2ggdGhhdCBhbGxvd3MgeW91IHRvIFxcXCJjbGljay10by1pbnNlcnRcXFwiIGFuIGVtb3RlLlwiLFxyXG5cdFx0XCJjb3B5cmlnaHRcIjogXCIyMDExKywge3t7cGtnLmF1dGhvcn19fVwiLFxyXG5cdFx0XCJhdXRob3JcIjogXCJ7e3twa2cuYXV0aG9yfX19XCIsXHJcblx0XHRcImljb25cIjogXCJodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIucGhwP2dyYXZhdGFyX2lkPTY4NzVlODNhYTZjNTYzNzkwY2IyZGE5MTRhYWJhOGIzJnI9UEcmcz00OCZkZWZhdWx0PWlkZW50aWNvblwiLFxyXG5cdFx0XCJsaWNlbnNlXCI6IFtcclxuXHRcdFx0XCJNSVQ7IGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcIixcclxuXHRcdFx0XCJDQyBCWS1OQy1TQSAzLjA7IGh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LW5jLXNhLzMuMC9cIlxyXG5cdFx0XSxcclxuXHRcdFwiaG9tZXBhZ2VcIjogXCJ7e3twa2cuaG9tZXBhZ2V9fX1cIixcclxuXHRcdFwic3VwcG9ydFVSTFwiOiBcInt7e3BrZy5idWdzfX19XCIsXHJcblx0XHRcImNvbnRyaWJ1dGlvblVSTFwiOiBcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvI2RvbmF0ZVwiLFxyXG5cdFx0XCJncmFudFwiOiBcIm5vbmVcIixcclxuXHRcdFwiaW5jbHVkZVwiOiBcImh0dHA6Ly8qLnR3aXRjaC50di8qXCIsXHJcblx0XHRcImV4Y2x1ZGVcIjogW1xyXG5cdFx0XHRcImh0dHA6Ly9hcGkudHdpdGNoLnR2LypcIixcclxuXHRcdFx0XCJodHRwOi8vY2hhdGRlcG90LnR3aXRjaC50di8qXCIsXHJcblx0XHRcdFwiaHR0cDovLyoudHdpdGNoLnR2LyovcHJvZmlsZSpcIlxyXG5cdFx0XVxyXG5cdH0sXHJcblx0XCJzY3JpcHRzXCI6IHtcclxuXHRcdFwiaW5zdGFsbFwiOiBcIm5hcGFcIlxyXG5cdH0sXHJcblx0XCJkZXZEZXBlbmRlbmNpZXNcIjoge1xyXG5cdFx0XCJicm93c2VyLXN5bmNcIjogXCJeMS4zLjJcIixcclxuXHRcdFwiYnJvd3NlcmlmeVwiOiBcIl41LjkuMVwiLFxyXG5cdFx0XCJndWxwXCI6IFwiXjMuOC4zXCIsXHJcblx0XHRcImd1bHAtYXV0b3ByZWZpeGVyXCI6IFwiMC4wLjhcIixcclxuXHRcdFwiZ3VscC1iZWF1dGlmeVwiOiBcIjEuMS4wXCIsXHJcblx0XHRcImd1bHAtY2hhbmdlZFwiOiBcIl4wLjQuMVwiLFxyXG5cdFx0XCJndWxwLWNvbmNhdFwiOiBcIl4yLjIuMFwiLFxyXG5cdFx0XCJndWxwLWNvbmZsaWN0XCI6IFwiXjAuMS4yXCIsXHJcblx0XHRcImd1bHAtY3NzLWJhc2U2NFwiOiBcIl4xLjEuMFwiLFxyXG5cdFx0XCJndWxwLWNzczJqc1wiOiBcIl4xLjAuMlwiLFxyXG5cdFx0XCJndWxwLWhlYWRlclwiOiBcIl4xLjAuMlwiLFxyXG5cdFx0XCJndWxwLWhvZ2FuLWNvbXBpbGVcIjogXCJeMC4yLjFcIixcclxuXHRcdFwiZ3VscC1taW5pZnktY3NzXCI6IFwiXjAuMy41XCIsXHJcblx0XHRcImd1bHAtbm90aWZ5XCI6IFwiXjEuNC4xXCIsXHJcblx0XHRcImd1bHAtcmVuYW1lXCI6IFwiXjEuMi4wXCIsXHJcblx0XHRcImd1bHAtdWdsaWZ5XCI6IFwiXjAuMy4xXCIsXHJcblx0XHRcImd1bHAtdXRpbFwiOiBcIl4zLjAuMFwiLFxyXG5cdFx0XCJob2dhbi5qc1wiOiBcIl4zLjAuMlwiLFxyXG5cdFx0XCJqcXVlcnktdWlcIjogXCJeMS4xMC41XCIsXHJcblx0XHRcIm5hcGFcIjogXCJeMC40LjFcIixcclxuXHRcdFwicHJldHR5LWhydGltZVwiOiBcIl4wLjIuMVwiLFxyXG5cdFx0XCJ2aW55bC1tYXBcIjogXCJeMS4wLjFcIixcclxuXHRcdFwidmlueWwtc291cmNlLXN0cmVhbVwiOiBcIl4wLjEuMVwiLFxyXG5cdFx0XCJ3YXRjaGlmeVwiOiBcIl4xLjAuMVwiXHJcblx0fSxcclxuXHRcIm5hcGFcIjoge1xyXG5cdFx0XCJqcXVlcnktY3VzdG9tLXNjcm9sbGJhclwiOiBcIm16dWJhbGEvanF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXIjMC41LjVcIlxyXG5cdH1cclxufVxyXG4iLCJ2YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi4vLi4vYnVpbGQvdGVtcGxhdGVzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGRhdGEgPSB7fTtcclxuXHR2YXIga2V5ID0gbnVsbDtcclxuXHJcblx0Ly8gQ29udmVydCB0ZW1wbGF0ZXMgdG8gdGhlaXIgc2hvcnRlciBcInJlbmRlclwiIGZvcm0uXHJcblx0Zm9yIChrZXkgaW4gdGVtcGxhdGVzKSB7XHJcblx0XHRpZiAoIXRlbXBsYXRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0fVxyXG5cdFx0ZGF0YVtrZXldID0gcmVuZGVyKGtleSk7XHJcblx0fVxyXG5cclxuXHQvLyBTaG9ydGN1dCB0aGUgcmVuZGVyIGZ1bmN0aW9uLiBBbGwgdGVtcGxhdGVzIHdpbGwgYmUgcGFzc2VkIGluIGFzIHBhcnRpYWxzIGJ5IGRlZmF1bHQuXHJcblx0ZnVuY3Rpb24gcmVuZGVyKHRlbXBsYXRlKSB7XHJcblx0XHR0ZW1wbGF0ZSA9IHRlbXBsYXRlc1t0ZW1wbGF0ZV07XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscyB8fCB0ZW1wbGF0ZXMsIGluZGVudCk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRhdGE7XHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbiAoJCkge1xyXG5cdCQuZm4ucmVzaXphYmxlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRcdHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHtcclxuXHRcdFx0YWxzb1Jlc2l6ZTogbnVsbCxcclxuXHRcdFx0YWxzb1Jlc2l6ZVR5cGU6ICdib3RoJywgLy8gYGhlaWdodGAsIGB3aWR0aGAsIGBib3RoYFxyXG5cdFx0XHRjb250YWlubWVudDogbnVsbCxcclxuXHRcdFx0Y3JlYXRlOiBudWxsLFxyXG5cdFx0XHRkZXN0cm95OiBudWxsLFxyXG5cdFx0XHRoYW5kbGU6ICcucmVzaXplLWhhbmRsZScsXHJcblx0XHRcdG1heEhlaWdodDogOTk5OSxcclxuXHRcdFx0bWF4V2lkdGg6IDk5OTksXHJcblx0XHRcdG1pbkhlaWdodDogMCxcclxuXHRcdFx0bWluV2lkdGg6IDAsXHJcblx0XHRcdHJlc2l6ZTogbnVsbCxcclxuXHRcdFx0cmVzaXplT25jZTogbnVsbCxcclxuXHRcdFx0c25hcFNpemU6IDEsXHJcblx0XHRcdHN0YXJ0OiBudWxsLFxyXG5cdFx0XHRzdG9wOiBudWxsXHJcblx0XHR9LCBvcHRpb25zKTtcclxuXHJcblx0XHRzZXR0aW5ncy5lbGVtZW50ID0gJCh0aGlzKTtcclxuXHJcblx0XHRmdW5jdGlvbiByZWNhbGN1bGF0ZVNpemUoZXZ0KSB7XHJcblx0XHRcdHZhciBkYXRhID0gZXZ0LmRhdGEsXHJcblx0XHRcdFx0cmVzaXplZCA9IHt9O1xyXG5cdFx0XHRkYXRhLmRpZmZYID0gTWF0aC5yb3VuZCgoZXZ0LnBhZ2VYIC0gZGF0YS5wYWdlWCkgLyBzZXR0aW5ncy5zbmFwU2l6ZSkgKiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHRcdFx0ZGF0YS5kaWZmWSA9IE1hdGgucm91bmQoKGV2dC5wYWdlWSAtIGRhdGEucGFnZVkpIC8gc2V0dGluZ3Muc25hcFNpemUpICogc2V0dGluZ3Muc25hcFNpemU7XHJcblx0XHRcdGlmIChNYXRoLmFicyhkYXRhLmRpZmZYKSA+IDAgfHwgTWF0aC5hYnMoZGF0YS5kaWZmWSkgPiAwKSB7XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoKSAhPT0gZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZICYmXHJcblx0XHRcdFx0XHRkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgPj0gc2V0dGluZ3MubWluSGVpZ2h0ICYmXHJcblx0XHRcdFx0XHRkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgPD0gc2V0dGluZ3MubWF4SGVpZ2h0ICYmXHJcblx0XHRcdFx0XHQoc2V0dGluZ3MuY29udGFpbm1lbnQgPyBkYXRhLm91dGVySGVpZ2h0ICsgZGF0YS5kaWZmWSArIGRhdGEub2Zmc2V0LnRvcCA8PSBzZXR0aW5ncy5jb250YWlubWVudC5vZmZzZXQoKS50b3AgKyBzZXR0aW5ncy5jb250YWlubWVudC5vdXRlckhlaWdodCgpIDogdHJ1ZSlcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSk7XHJcblx0XHRcdFx0XHRyZXNpemVkLmhlaWdodCA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQud2lkdGgoKSAhPT0gZGF0YS53aWR0aCArIGRhdGEuZGlmZlggJiZcclxuXHRcdFx0XHRcdGRhdGEud2lkdGggKyBkYXRhLmRpZmZYID49IHNldHRpbmdzLm1pbldpZHRoICYmXHJcblx0XHRcdFx0XHRkYXRhLndpZHRoICsgZGF0YS5kaWZmWCA8PSBzZXR0aW5ncy5tYXhXaWR0aCAmJlxyXG5cdFx0XHRcdFx0KHNldHRpbmdzLmNvbnRhaW5tZW50ID8gZGF0YS5vdXRlcldpZHRoICsgZGF0YS5kaWZmWCArIGRhdGEub2Zmc2V0LmxlZnQgPD0gc2V0dGluZ3MuY29udGFpbm1lbnQub2Zmc2V0KCkubGVmdCArIHNldHRpbmdzLmNvbnRhaW5tZW50Lm91dGVyV2lkdGgoKSA6IHRydWUpXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LndpZHRoKGRhdGEud2lkdGggKyBkYXRhLmRpZmZYKTtcclxuXHRcdFx0XHRcdHJlc2l6ZWQud2lkdGggPSB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAocmVzaXplZC5oZWlnaHQgfHwgcmVzaXplZC53aWR0aCkge1xyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLnJlc2l6ZU9uY2UpIHtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplT25jZS5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKGV2dC5kYXRhKTtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplT25jZSA9IG51bGw7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MucmVzaXplKSB7XHJcblx0XHRcdFx0XHRcdHNldHRpbmdzLnJlc2l6ZS5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKGV2dC5kYXRhKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5hbHNvUmVzaXplKSB7XHJcblx0XHRcdFx0XHRcdGlmIChyZXNpemVkLmhlaWdodCAmJiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdoZWlnaHQnIHx8IHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnYm90aCcpKSB7XHJcblx0XHRcdFx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZS5oZWlnaHQoZGF0YS5hbHNvUmVzaXplSGVpZ2h0ICsgZGF0YS5kaWZmWSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0aWYgKHJlc2l6ZWQud2lkdGggJiYgKHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnd2lkdGgnIHx8IHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnYm90aCcpKSB7XHJcblx0XHRcdFx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZS53aWR0aChkYXRhLmFsc29SZXNpemVXaWR0aCArIGRhdGEuZGlmZlgpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gc3RhcnQoZXZ0KSB7XHJcblx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRpZiAoc2V0dGluZ3Muc3RhcnQpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5zdGFydC5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIGRhdGEgPSB7XHJcblx0XHRcdFx0YWxzb1Jlc2l6ZUhlaWdodDogc2V0dGluZ3MuYWxzb1Jlc2l6ZSA/IHNldHRpbmdzLmFsc29SZXNpemUuaGVpZ2h0KCkgOiAwLFxyXG5cdFx0XHRcdGFsc29SZXNpemVXaWR0aDogc2V0dGluZ3MuYWxzb1Jlc2l6ZSA/IHNldHRpbmdzLmFsc29SZXNpemUud2lkdGgoKSA6IDAsXHJcblx0XHRcdFx0aGVpZ2h0OiBzZXR0aW5ncy5lbGVtZW50LmhlaWdodCgpLFxyXG5cdFx0XHRcdG9mZnNldDogc2V0dGluZ3MuZWxlbWVudC5vZmZzZXQoKSxcclxuXHRcdFx0XHRvdXRlckhlaWdodDogc2V0dGluZ3MuZWxlbWVudC5vdXRlckhlaWdodCgpLFxyXG5cdFx0XHRcdG91dGVyV2lkdGg6IHNldHRpbmdzLmVsZW1lbnQub3V0ZXJXaWR0aCgpLFxyXG5cdFx0XHRcdHBhZ2VYOiBldnQucGFnZVgsXHJcblx0XHRcdFx0cGFnZVk6IGV2dC5wYWdlWSxcclxuXHRcdFx0XHR3aWR0aDogc2V0dGluZ3MuZWxlbWVudC53aWR0aCgpXHJcblx0XHRcdH07XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZW1vdmUnLCAnKicsIGRhdGEsIHJlY2FsY3VsYXRlU2l6ZSk7XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwJywgJyonLCBzdG9wKTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBzdG9wKCkge1xyXG5cdFx0XHRpZiAoc2V0dGluZ3Muc3RvcCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLnN0b3AuYmluZChzZXR0aW5ncy5lbGVtZW50KSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2Vtb3ZlJywgJyonLCByZWNhbGN1bGF0ZVNpemUpO1xyXG5cdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCAnKicsIHN0b3ApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChzZXR0aW5ncy5oYW5kbGUpIHtcclxuXHRcdFx0aWYgKHNldHRpbmdzLmFsc29SZXNpemUgJiYgWydib3RoJywgJ2hlaWdodCcsICd3aWR0aCddLmluZGV4T2Yoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUpID49IDApIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplID0gJChzZXR0aW5ncy5hbHNvUmVzaXplKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoc2V0dGluZ3MuY29udGFpbm1lbnQpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5jb250YWlubWVudCA9ICQoc2V0dGluZ3MuY29udGFpbm1lbnQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHNldHRpbmdzLmhhbmRsZSA9ICQoc2V0dGluZ3MuaGFuZGxlKTtcclxuXHRcdFx0c2V0dGluZ3Muc25hcFNpemUgPSBzZXR0aW5ncy5zbmFwU2l6ZSA8IDEgPyAxIDogc2V0dGluZ3Muc25hcFNpemU7XHJcblxyXG5cdFx0XHRpZiAob3B0aW9ucyA9PT0gJ2Rlc3Ryb3knKSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuaGFuZGxlLm9mZignbW91c2Vkb3duJywgc3RhcnQpO1xyXG5cclxuXHRcdFx0XHRpZiAoc2V0dGluZ3MuZGVzdHJveSkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZGVzdHJveS5iaW5kKHRoaXMpKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzZXR0aW5ncy5oYW5kbGUub24oJ21vdXNlZG93bicsIHN0YXJ0KTtcclxuXHJcblx0XHRcdGlmIChzZXR0aW5ncy5jcmVhdGUpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5jcmVhdGUuYmluZCh0aGlzKSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9O1xyXG59KShqUXVlcnkpO1xyXG4iXX0=
