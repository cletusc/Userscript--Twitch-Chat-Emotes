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
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button glyph-only float-left\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxVc2Vyc1xcQ2xldHVzXFxQcm9qZWN0c1xcVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIi4vc3JjL3NjcmlwdC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvYnVpbGQvc3R5bGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9ob2dhbi5qcy9saWIvdGVtcGxhdGUuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9qcXVlcnktY3VzdG9tLXNjcm9sbGJhci9qcXVlcnkuY3VzdG9tLXNjcm9sbGJhci5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvcGFja2FnZS5qc29uIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9wbHVnaW5zL3Jlc2l6YWJsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1c0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3p3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy90ZW1wbGF0ZXMnKTtcclxudmFyIHBrZyA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xyXG52YXIgJCA9IG51bGw7XHJcbnZhciBqUXVlcnkgPSBudWxsO1xyXG5cclxuLy8gU2NyaXB0LXdpZGUgdmFyaWFibGVzLlxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbnZhciBlbW90ZXMgPSB7XHJcblx0dXNhYmxlOiBbXSxcclxuXHRnZXQgcmF3KCkge1xyXG5cdFx0aWYgKHdpbmRvdy5BcHApIHtcclxuXHRcdFx0cmV0dXJuIHdpbmRvdy5BcHAuX19jb250YWluZXJfXy5sb29rdXAoJ2NvbnRyb2xsZXI6ZW1vdGljb25zJykuZ2V0KCdlbW90aWNvbnMnKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBbXTtcclxuXHR9LFxyXG5cdHN1YnNjcmlwdGlvbnM6IHtcclxuXHRcdGJhZGdlczoge30sXHJcblx0XHRlbW90ZXM6IHt9XHJcblx0fVxyXG59O1xyXG52YXIgZW1vdGVQb3B1bGFyaXR5ID0gZmFsc2U7XHJcbnZhciBpc0luaXRpYXRlZCA9IGZhbHNlO1xyXG5cclxuLy8gRE9NIGVsZW1lbnRzLlxyXG52YXIgZWxlbWVudHMgPSB7XHJcblx0Ly8gVGhlIGJ1dHRvbiB0byBzZW5kIGEgY2hhdCBtZXNzYWdlLlxyXG5cdGNoYXRCdXR0b246IG51bGwsXHJcblx0Ly8gVGhlIGFyZWEgd2hlcmUgYWxsIGNoYXQgbWVzc2FnZXMgYXJlIGNvbnRhaW5lZC5cclxuXHRjaGF0Q29udGFpbmVyOiBudWxsLFxyXG5cdC8vIFRoZSBpbnB1dCBmaWVsZCBmb3IgY2hhdCBtZXNzYWdlcy5cclxuXHRjaGF0Qm94OiBudWxsLFxyXG5cdC8vIFRoZSBidXR0b24gdXNlZCB0byBzaG93IHRoZSBtZW51LlxyXG5cdG1lbnVCdXR0b246IG51bGwsXHJcblx0Ly8gVGhlIG1lbnUgdGhhdCBjb250YWlucyBhbGwgZW1vdGVzLlxyXG5cdG1lbnU6IG51bGxcclxufTtcclxuXHJcbnZhciBTQ1JJUFRfTkFNRSA9IHBrZy51c2Vyc2NyaXB0Lm5hbWU7XHJcbnZhciBNRVNTQUdFUyA9IHtcclxuXHROT19DSEFUX0VMRU1FTlQ6ICdUaGVyZSBpcyBubyBjaGF0IGVsZW1lbnQgb24gdGhlIHBhZ2UsIHVuYWJsZSB0byBjb250aW51ZS4nLFxyXG5cdE9CSkVDVFNfTk9UX0xPQURFRDogJ05lZWRlZCBvYmplY3RzIGhhdmVuXFwndCBsb2FkZWQgeWV0LicsXHJcblx0VElNRU9VVF9TQ1JJUFRfTE9BRDogJ1NjcmlwdCB0b29rIHRvbyBsb25nIHRvIGxvYWQuIFJlZnJlc2ggdG8gdHJ5IGFnYWluLidcclxufTtcclxuXHJcbnZhciBoZWxwZXJzID0ge1xyXG5cdHVzZXI6IHtcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2sgaWYgdXNlciBpcyBsb2dnZWQgaW4sIGFuZCBwcm9tcHRzIHRoZW0gdG8gaWYgdGhleSBhcmVuJ3QuXHJcblx0XHQgKiBAcmV0dXJuIHtib29sZWFufSBgdHJ1ZWAgaWYgbG9nZ2VkIGluLCBgZmFsc2VgIGlmIGxvZ2dlZCBvdXQuXHJcblx0XHQgKi9cclxuXHRcdGxvZ2luOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdC8vIENoZWNrIGlmIGxvZ2dlZCBpbiBhbHJlYWR5LlxyXG5cdFx0XHRpZiAod2luZG93LlR3aXRjaCAmJiB3aW5kb3cuVHdpdGNoLnVzZXIuaXNMb2dnZWRJbigpKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gTm90IGxvZ2dlZCBpbiwgY2FsbCBUd2l0Y2gncyBsb2dpbiBtZXRob2QuXHJcblx0XHRcdCQubG9naW4oKTtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1x0XHJcblx0XHR9XHJcblx0fVxyXG59O1xyXG5cclxuLy8gUXVpY2sgbWFuaXB1bGF0aW9uIG9mIHNjcmlwdC13aWRlIHZhcmlhYmxlcy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gUHJlZml4IGFsbCBtZXNzYWdlcyB3aXRoIHNjcmlwdCBuYW1lLlxyXG5mb3IgKHZhciBtZXNzYWdlIGluIE1FU1NBR0VTKSB7XHJcblx0aWYgKE1FU1NBR0VTLmhhc093blByb3BlcnR5KG1lc3NhZ2UpKSB7XHJcblx0XHRNRVNTQUdFU1ttZXNzYWdlXSA9ICdbJyArIFNDUklQVF9OQU1FICsgJ106ICcgKyBNRVNTQUdFU1ttZXNzYWdlXTtcclxuXHR9XHJcbn1cclxuXHJcbi8vIE9ubHkgZW5hYmxlIHNjcmlwdCBpZiB3ZSBoYXZlIHRoZSByaWdodCB2YXJpYWJsZXMuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbihmdW5jdGlvbiBpbml0KHRpbWUpIHtcclxuXHQkID0galF1ZXJ5ID0gd2luZG93LmpRdWVyeTtcclxuXHR2YXIgcm91dGVzID0gd2luZG93LkFwcCAmJiAod2luZG93LkFwcC5DaGFubmVsUm91dGUgfHwgd2luZG93LkFwcC5DaGF0Um91dGUpO1xyXG5cdHZhciBvYmplY3RzTG9hZGVkID0gKFxyXG5cdFx0d2luZG93LlR3aXRjaCAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHQoXHJcblx0XHRcdHdpbmRvdy5BcHAgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0XHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18gIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0XHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdjb250cm9sbGVyOmVtb3RpY29ucycpLmdldCgnZW1vdGljb25zJykgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0XHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdjb250cm9sbGVyOmVtb3RpY29ucycpLmdldCgnZW1vdGljb25zJykubGVuZ3RoXHJcblx0XHQpICYmXHJcblx0XHRqUXVlcnkgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0Ly8gQ2hhdCBidXR0b24uXHJcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2hhdF9zcGVhaywgLnNlbmQtY2hhdC1idXR0b24nKVxyXG5cdCk7XHJcblx0aWYgKCFpc0luaXRpYXRlZCAmJiByb3V0ZXMpIHtcclxuXHRcdHZhciBhY3RpdmF0ZSA9IHtcclxuXHRcdFx0YWN0aXZhdGU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHR0aGlzLl9zdXBlcigpO1xyXG5cdFx0XHRcdGluaXQoNTApO1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cclxuXHRcdGlmICh3aW5kb3cuQXBwLkNoYW5uZWxSb3V0ZSkge1xyXG5cdFx0XHR3aW5kb3cuQXBwLkNoYW5uZWxSb3V0ZS5yZW9wZW4oYWN0aXZhdGUpO1xyXG5cdFx0XHRpc0luaXRpYXRlZCA9IHRydWU7XHJcblx0XHR9XHJcblx0XHRpZiAod2luZG93LkFwcC5DaGF0Um91dGUpIHtcclxuXHRcdFx0d2luZG93LkFwcC5DaGF0Um91dGUucmVvcGVuKGFjdGl2YXRlKTtcclxuXHRcdFx0aXNJbml0aWF0ZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRpZiAoIW9iamVjdHNMb2FkZWQgfHwgIXJvdXRlcykge1xyXG5cdFx0Ly8gRXJyb3JzIGluIGFwcHJveGltYXRlbHkgMTAyNDAwbXMuXHJcblx0XHRpZiAodGltZSA+PSA2MDAwMCkge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKE1FU1NBR0VTLlRJTUVPVVRfU0NSSVBUX0xPQUQpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpZiAodGltZSA+PSAxMDAwMCkge1xyXG5cdFx0XHRpZiAoIW9iamVjdHNMb2FkZWQpIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oTUVTU0FHRVMuT0JKRUNUU19OT1RfTE9BREVEKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0c2V0VGltZW91dChpbml0LCB0aW1lLCB0aW1lICogMik7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHNldHVwKCk7XHJcbn0pKDUwKTtcclxuXHJcbi8vIFN0YXJ0IG9mIGZ1bmN0aW9ucy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vKipcclxuICogUnVucyBpbml0aWFsIHNldHVwIG9mIERPTSBhbmQgdmFyaWFibGVzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcblx0Ly8gTG9hZCBDU1MuXHJcblx0cmVxdWlyZSgnLi4vYnVpbGQvc3R5bGVzJyk7XHJcblx0Ly8gTG9hZCBqUXVlcnkgcGx1Z2lucy5cclxuXHRyZXF1aXJlKCcuL3BsdWdpbnMvcmVzaXphYmxlJyk7XHJcblx0cmVxdWlyZSgnanF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXIvanF1ZXJ5LmN1c3RvbS1zY3JvbGxiYXInKTtcclxuXHRcclxuXHRlbGVtZW50cy5jaGF0QnV0dG9uID0gJCgnLnNlbmQtY2hhdC1idXR0b24nKTtcclxuXHRlbGVtZW50cy5jaGF0Qm94ID0gJCgnLmNoYXQtaW50ZXJmYWNlIHRleHRhcmVhJyk7XHJcblx0ZWxlbWVudHMuY2hhdENvbnRhaW5lciA9ICQoJy5jaGF0LW1lc3NhZ2VzJyk7XHJcblxyXG5cdC8vIE5vIGNoYXQsIGp1c3QgZXhpdC5cclxuXHRpZiAoIWVsZW1lbnRzLmNoYXRCdXR0b24ubGVuZ3RoKSB7XHJcblx0XHRjb25zb2xlLndhcm4oTUVTU0FHRVMuTk9fQ0hBVF9FTEVNRU5UKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdGNyZWF0ZU1lbnVFbGVtZW50cygpO1xyXG5cdGJpbmRMaXN0ZW5lcnMoKTtcclxuXHRzaG93TmV3cygpO1xyXG5cclxuXHQvLyBHZXQgYWN0aXZlIHN1YnNjcmlwdGlvbnMuXHJcblx0d2luZG93LlR3aXRjaC5hcGkuZ2V0KFxyXG5cdFx0Jy9hcGkvdXNlcnMvOmxvZ2luL3RpY2tldHMnLFxyXG5cdFx0e1xyXG5cdFx0XHRvZmZzZXQ6IDAsXHJcblx0XHRcdGxpbWl0OiAxMDAsXHJcblx0XHRcdHVuZW5kZWQ6IHRydWVcclxuXHRcdH1cclxuXHQpLmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0YXBpLnRpY2tldHMuZm9yRWFjaChmdW5jdGlvbiAodGlja2V0KSB7XHJcblx0XHRcdC8vIEdldCBzdWJzY3JpcHRpb25zIHdpdGggZW1vdGVzLlxyXG5cdFx0XHRpZiAodGlja2V0LnByb2R1Y3QuZW1vdGljb25zICYmIHRpY2tldC5wcm9kdWN0LmVtb3RpY29ucy5sZW5ndGgpIHtcclxuXHRcdFx0XHR2YXIgYmFkZ2UgPSB0aWNrZXQucHJvZHVjdC5mZWF0dXJlcy5iYWRnZTtcclxuXHRcdFx0XHR2YXIgY2hhbm5lbCA9IHRpY2tldC5wcm9kdWN0Lm93bmVyX25hbWU7XHJcblx0XHRcdFx0Ly8gQWRkIGNoYW5uZWwgYmFkZ2VzLlxyXG5cdFx0XHRcdGlmIChiYWRnZSkge1xyXG5cdFx0XHRcdFx0YmFkZ2UgPSAnaHR0cDovL3N0YXRpYy1jZG4uanR2bncubmV0L2p0dl91c2VyX3BpY3R1cmVzLycgKyBbYmFkZ2UucHJlZml4LCBiYWRnZS5vd25lciwgYmFkZ2UudHlwZSwgYmFkZ2UudWlkLCBiYWRnZS5zaXplc1swXV0uam9pbignLScpICsgJy4nICsgYmFkZ2UuZm9ybWF0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGJhZGdlID0gJ2h0dHBzOi8vc3RhdGljLWNkbi5qdHZudy5uZXQvanR2X3VzZXJfcGljdHVyZXMvc3Vic2NyaWJlci1zdGFyLnBuZyc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1tjaGFubmVsXSA9IGJhZGdlO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdC8vIEFkZCBlbW90ZXMgY2hhbm5lbC5cclxuXHRcdFx0XHR0aWNrZXQucHJvZHVjdC5lbW90aWNvbnMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRcdGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tnZXRFbW90ZUZyb21SZWdFeChuZXcgUmVnRXhwKGVtb3RlLnJlZ2V4KSldID0ge1xyXG5cdFx0XHRcdFx0XHRjaGFubmVsOiBjaGFubmVsLFxyXG5cdFx0XHRcdFx0XHR1cmw6IGVtb3RlLnVybFxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBpbml0aWFsIG1lbnUgZWxlbWVudHNcclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZU1lbnVFbGVtZW50cygpIHtcclxuXHQvLyBSZW1vdmUgbWVudSBidXR0b24gaWYgZm91bmQuXHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbiA9ICQoJyNlbW90ZS1tZW51LWJ1dHRvbicpO1xyXG5cdGlmIChlbGVtZW50cy5tZW51QnV0dG9uLmxlbmd0aCkge1xyXG5cdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5yZW1vdmUoKTtcclxuXHR9XHJcblx0Ly8gQ3JlYXRlIG1lbnUgYnV0dG9uLlxyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24gPSAkKHRlbXBsYXRlcy5lbW90ZUJ1dHRvbigpKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmluc2VydEJlZm9yZShlbGVtZW50cy5jaGF0QnV0dG9uKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmhpZGUoKTtcclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLmZhZGVJbigpO1xyXG5cclxuXHQvLyBSZW1vdmUgbWVudSBpZiBmb3VuZC5cclxuXHRlbGVtZW50cy5tZW51ID0gJCgnI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCcpO1xyXG5cdGlmIChlbGVtZW50cy5tZW51Lmxlbmd0aCkge1xyXG5cdFx0ZWxlbWVudHMubWVudS5yZW1vdmUoKTtcclxuXHR9XHJcblx0Ly8gQ3JlYXRlIG1lbnUuXHJcblx0ZWxlbWVudHMubWVudSA9ICQodGVtcGxhdGVzLm1lbnUoKSk7XHJcblx0ZWxlbWVudHMubWVudS5hcHBlbmRUbyhkb2N1bWVudC5ib2R5KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEJpbmQgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gYmluZExpc3RlbmVycygpIHtcclxuXHJcblx0ZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcclxuXHRcdC8vIE1lbnUgc2hvd24sIGhpZGUgaXQuXHJcblx0XHRpZiAoZWxlbWVudHMubWVudS5pcygnOnZpc2libGUnKSkge1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LmhpZGUoKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5yZW1vdmVDbGFzcygncGlubmVkJyk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnVCdXR0b24ucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gTWVudSBoaWRkZW4sIHNob3cgaXQuXHJcblx0XHRlbHNlIGlmIChoZWxwZXJzLnVzZXIubG9naW4oKSkge1xyXG5cdFx0XHRwb3B1bGF0ZUVtb3Rlc01lbnUoKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5zaG93KCk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnVCdXR0b24uYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNldXAnLCBjaGVja0ZvckNsaWNrT3V0c2lkZSk7XHJcblxyXG5cdFx0XHQvLyBNZW51IG1vdmVkLCBtb3ZlIGl0IGJhY2suXHJcblx0XHRcdGlmIChlbGVtZW50cy5tZW51Lmhhc0NsYXNzKCdtb3ZlZCcpKSB7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5vZmZzZXQoSlNPTi5wYXJzZShlbGVtZW50cy5tZW51LmF0dHIoJ2RhdGEtb2Zmc2V0JykpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBOZXZlciBtb3ZlZCwgbWFrZSBpdCB0aGUgc2FtZSBzaXplIGFzIHRoZSBjaGF0IHdpbmRvdy5cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0dmFyIGRpZmYgPSBlbGVtZW50cy5tZW51LmhlaWdodCgpIC0gZWxlbWVudHMubWVudS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpLmhlaWdodCgpO1xyXG5cdFx0XHRcdC8vIEFkanVzdCB0aGUgc2l6ZSBhbmQgcG9zaXRpb24gb2YgdGhlIHBvcHVwLlxyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUuaGVpZ2h0KGVsZW1lbnRzLmNoYXRDb250YWluZXIub3V0ZXJIZWlnaHQoKSAtIChlbGVtZW50cy5tZW51Lm91dGVySGVpZ2h0KCkgLSBlbGVtZW50cy5tZW51LmhlaWdodCgpKSk7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS53aWR0aChlbGVtZW50cy5jaGF0Q29udGFpbmVyLm91dGVyV2lkdGgoKSAtIChlbGVtZW50cy5tZW51Lm91dGVyV2lkdGgoKSAtIGVsZW1lbnRzLm1lbnUud2lkdGgoKSkpO1xyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUub2Zmc2V0KGVsZW1lbnRzLmNoYXRDb250YWluZXIub2Zmc2V0KCkpO1xyXG5cdFx0XHRcdC8vIEZpeCBgLmVtb3Rlcy1hbGxgIGhlaWdodC5cclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykuaGVpZ2h0KGVsZW1lbnRzLm1lbnUuaGVpZ2h0KCkgLSBkaWZmKTtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykud2lkdGgoZWxlbWVudHMubWVudS53aWR0aCgpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBSZWNhbGN1bGF0ZSBhbnkgc2Nyb2xsIGJhcnMuXHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnLnNjcm9sbGFibGUnKS5jdXN0b21TY3JvbGxiYXIoJ3Jlc2l6ZScpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKGUpIHtcclxuXHRcdFx0Ly8gTm90IG91dHNpZGUgb2YgdGhlIG1lbnUsIGlnbm9yZSB0aGUgY2xpY2suXHJcblx0XHRcdGlmICgkKGUudGFyZ2V0KS5pcygnI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCwgI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCAqJykpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gQ2xpY2tlZCBvbiB0aGUgbWVudSBidXR0b24sIGp1c3QgcmVtb3ZlIHRoZSBsaXN0ZW5lciBhbmQgbGV0IHRoZSBub3JtYWwgbGlzdGVuZXIgaGFuZGxlIGl0LlxyXG5cdFx0XHRpZiAoIWVsZW1lbnRzLm1lbnUuaXMoJzp2aXNpYmxlJykgfHwgJChlLnRhcmdldCkuaXMoJyNlbW90ZS1tZW51LWJ1dHRvbiwgI2Vtb3RlLW1lbnUtYnV0dG9uIConKSkge1xyXG5cdFx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gQ2xpY2tlZCBvdXRzaWRlLCBtYWtlIHN1cmUgdGhlIG1lbnUgaXNuJ3QgcGlubmVkLlxyXG5cdFx0XHRpZiAoIWVsZW1lbnRzLm1lbnUuaGFzQ2xhc3MoJ3Bpbm5lZCcpKSB7XHJcblx0XHRcdFx0Ly8gTWVudSB3YXNuJ3QgcGlubmVkLCByZW1vdmUgbGlzdGVuZXIuXHJcblx0XHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgY2hlY2tGb3JDbGlja091dHNpZGUpO1xyXG5cdFx0XHRcdHRvZ2dsZU1lbnUoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gVG9nZ2xlIG1lbnUuXHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbi5vbignY2xpY2snLCB0b2dnbGVNZW51KTtcclxuXHJcblx0Ly8gTWFrZSBkcmFnZ2FibGUuXHJcblx0ZWxlbWVudHMubWVudS5kcmFnZ2FibGUoe1xyXG5cdFx0aGFuZGxlOiAnLmRyYWdnYWJsZScsXHJcblx0XHRzdGFydDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdwaW5uZWQnKTtcclxuXHRcdFx0JCh0aGlzKS5hZGRDbGFzcygnbW92ZWQnKTtcclxuXHRcdH0sXHJcblx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuYXR0cignZGF0YS1vZmZzZXQnLCBKU09OLnN0cmluZ2lmeShlbGVtZW50cy5tZW51Lm9mZnNldCgpKSk7XHJcblx0XHR9LFxyXG5cdFx0Y29udGFpbm1lbnQ6ICQoZG9jdW1lbnQuYm9keSlcclxuXHR9KTtcclxuXHJcblx0ZWxlbWVudHMubWVudS5yZXNpemFibGUoe1xyXG5cdFx0aGFuZGxlOiAnW2RhdGEtY29tbWFuZD1cInJlc2l6ZS1oYW5kbGVcIl0nLFxyXG5cdFx0cmVzaXplOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdC8vIFJlY2FsY3VsYXRlIGFueSBzY3JvbGwgYmFycy5cclxuXHRcdFx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcigncmVzaXplJyk7XHJcblx0XHR9LFxyXG5cdFx0c3RvcDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdwaW5uZWQnKTtcclxuXHRcdFx0JCh0aGlzKS5hZGRDbGFzcygnbW92ZWQnKTtcclxuXHRcdH0sXHJcblx0XHRhbHNvUmVzaXplOiBlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJyksXHJcblx0XHRjb250YWlubWVudDogJChkb2N1bWVudC5ib2R5KSxcclxuXHRcdG1pbkhlaWdodDogMTgwLFxyXG5cdFx0bWluV2lkdGg6IDIwMFxyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgdGhlIHBvcHVsYXJpdHkgcmVzZXQuXHJcblx0ZWxlbWVudHMubWVudS5maW5kKCdbZGF0YS1jb21tYW5kPVwicmVzZXQtcG9wdWxhcml0eVwiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGVtb3RlUG9wdWxhcml0eUNsZWFyKCk7XHJcblx0XHRwb3B1bGF0ZUVtb3Rlc01lbnUoKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIG1lbnUgcGlubmluZy5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtcGlubmVkXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0ZWxlbWVudHMubWVudS50b2dnbGVDbGFzcygncGlubmVkJyk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBlbW90ZSBjbGlja2luZyAoZGVsZWdhdGVkKS5cclxuXHRlbGVtZW50cy5tZW51Lm9uKCdjbGljaycsICcuZW1vdGUnLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRpbnNlcnRFbW90ZVRleHQoJCh0aGlzKS5hdHRyKCdkYXRhLWVtb3RlJykpO1xyXG5cdH0pO1xyXG5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJykuY3VzdG9tU2Nyb2xsYmFyKHtcclxuXHRcdHNraW46ICdkZWZhdWx0LXNraW4nLFxyXG5cdFx0aFNjcm9sbDogZmFsc2UsXHJcblx0XHRwcmV2ZW50RGVmYXVsdFNjcm9sbDogdHJ1ZVxyXG5cdH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUG9wdWxhdGVzIHRoZSBwb3B1cCBtZW51IHdpdGggY3VycmVudCBlbW90ZSBkYXRhLlxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdWxhdGVFbW90ZXNNZW51KCkge1xyXG5cdHZhciBjb250YWluZXI7XHJcblxyXG5cdHJlZnJlc2hVc2FibGVFbW90ZXMoKTtcclxuXHJcblx0Ly8gQWRkIHBvcHVsYXIgZW1vdGVzLlxyXG5cdGNvbnRhaW5lciA9IGVsZW1lbnRzLm1lbnUuZmluZCgnI3BvcHVsYXItZW1vdGVzLWdyb3VwJyk7XHJcblx0Y29udGFpbmVyLmh0bWwoJycpO1xyXG5cdGVtb3Rlcy51c2FibGUuc29ydChzb3J0QnlQb3B1bGFyaXR5KTtcclxuXHRlbW90ZXMudXNhYmxlLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gQWRkIGFsbCBlbW90ZXMuXHJcblx0Y29udGFpbmVyID0gZWxlbWVudHMubWVudS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpO1xyXG5cdGlmIChjb250YWluZXIuZmluZCgnLm92ZXJ2aWV3JykubGVuZ3RoKSB7XHJcblx0XHRjb250YWluZXIgPSBjb250YWluZXIuZmluZCgnLm92ZXJ2aWV3Jyk7XHJcblx0fVxyXG5cdGNvbnRhaW5lci5odG1sKCcnKTtcclxuXHRlbW90ZXMudXNhYmxlLnNvcnQoc29ydEJ5U2V0KTtcclxuXHRlbW90ZXMudXNhYmxlLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyLCB0cnVlKTtcclxuXHR9KTtcclxuXHJcblx0LyoqXHJcblx0ICogU29ydCBieSBwb3B1bGFyaXR5OiBtb3N0IHVzZWQgLT4gbGVhc3QgdXNlZFxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIHNvcnRCeVBvcHVsYXJpdHkoYSwgYikge1xyXG5cdFx0dmFyIGFHZXQgPSBlbW90ZVBvcHVsYXJpdHlHZXQoYS50ZXh0KTtcclxuXHRcdHZhciBiR2V0ID0gZW1vdGVQb3B1bGFyaXR5R2V0KGIudGV4dCk7XHJcblx0XHR2YXIgYU51bWJlciA9IHR5cGVvZiBhR2V0ID09PSAnbnVtYmVyJztcclxuXHRcdHZhciBiTnVtYmVyID0gdHlwZW9mIGJHZXQgPT09ICdudW1iZXInO1xyXG5cdFx0aWYgKGFOdW1iZXIgJiYgIWJOdW1iZXIpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGJOdW1iZXIgJiYgIWFOdW1iZXIpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAoYUdldCA8IGJHZXQpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAoYUdldCA+IGJHZXQpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHNvcnRCeU5vcm1hbChhLCBiKTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgYWxwaGFudW1lcmljIGluIHRoaXMgb3JkZXI6IHN5bWJvbHMgLT4gbnVtYmVycyAtPiBBYUJiLi4uIC0+IG51bWJlcnNcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBzb3J0QnlOb3JtYWwoYSwgYil7XHJcblx0XHRhID0gYS50ZXh0O1xyXG5cdFx0YiA9IGIudGV4dDtcclxuXHRcdGlmIChhLnRvTG93ZXJDYXNlKCkgPCBiLnRvTG93ZXJDYXNlKCkpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGEudG9Mb3dlckNhc2UoKSA+IGIudG9Mb3dlckNhc2UoKSkge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdGlmIChhIDwgYikge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYSA+IGIpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgZW1vdGljb24gc2V0OiBiYXNpYyBzbWlsZXlzIC0+IG5vIHNldCAtPiBzdWJzY3JpcHRpb24gZW1vdGVzXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gc29ydEJ5U2V0KGEsIGIpe1xyXG5cdFx0Ly8gT3ZlcnJpZGUgZm9yIHR1cmJvIGVtb3Rlcy5cclxuXHRcdGlmIChcclxuXHRcdFx0KGEuY2hhbm5lbCAmJiBhLmNoYW5uZWwgPT09ICdUd2l0Y2ggVHVyYm8nKSAmJlxyXG5cdFx0XHQoIWIuY2hhbm5lbCB8fCAoYi5jaGFubmVsICYmIGIuY2hhbm5lbCAhPT0gJ1R3aXRjaCBUdXJibycpKVxyXG5cdFx0KSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdGlmIChcclxuXHRcdFx0KGIuY2hhbm5lbCAmJiBiLmNoYW5uZWwgPT09ICdUd2l0Y2ggVHVyYm8nKSAmJlxyXG5cdFx0XHQoIWEuY2hhbm5lbCB8fCAoYS5jaGFubmVsICYmIGEuY2hhbm5lbCAhPT0gJ1R3aXRjaCBUdXJibycpKVxyXG5cdFx0KSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0Ly8gT3ZlcnJpZGUgZm9yIGJhc2ljIGVtb3Rlcy5cclxuXHRcdHZhciBiYXNpY0Vtb3RlcyA9IFsnOignLCAnOiknLCAnOi8nLCAnOkQnLCAnOm8nLCAnOnAnLCAnOnonLCAnOyknLCAnO3AnLCAnPDMnLCAnPignLCAnQiknLCAnUiknLCAnb19vJywgJyMvJywgJzo3JywgJzo+JywgJzpTJywgJzxdJ107XHJcblx0XHRpZiAoYmFzaWNFbW90ZXMuaW5kZXhPZihhLnRleHQpID49IDAgJiZcdGJhc2ljRW1vdGVzLmluZGV4T2YoYi50ZXh0KSA8IDApIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGJhc2ljRW1vdGVzLmluZGV4T2YoYi50ZXh0KSA+PSAwICYmXHRiYXNpY0Vtb3Rlcy5pbmRleE9mKGEudGV4dCkgPCAwKSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0Ly8gU29ydCBieSBjaGFubmVsIG5hbWUuXHJcblx0XHRpZiAoYS5jaGFubmVsICYmICFiLmNoYW5uZWwpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAoYi5jaGFubmVsICYmICFhLmNoYW5uZWwpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGEuY2hhbm5lbCAmJiBiLmNoYW5uZWwpIHtcclxuXHRcdFx0Ly8gRm9yY2UgYWRkb24gZW1vdGUgZ3JvdXBzIGJlbG93IHN0YW5kYXJkIFR3aXRjaCBncm91cHMuXHJcblx0XHRcdGlmIChlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbYS5jaGFubmVsXSAmJiAhZW1vdGVzLnN1YnNjcmlwdGlvbnMuYmFkZ2VzW2IuY2hhbm5lbF0pIHtcclxuXHRcdFx0XHRyZXR1cm4gLTE7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1tiLmNoYW5uZWxdICYmICFlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbYS5jaGFubmVsXSkge1xyXG5cdFx0XHRcdHJldHVybiAxO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgY2hhbm5lbFNvcnQgPSBzb3J0QnlOb3JtYWwoe3RleHQ6IGEuY2hhbm5lbH0sIHt0ZXh0OiBiLmNoYW5uZWx9KTtcclxuXHRcdFx0dmFyIG5vcm1hbFNvcnQgPSBzb3J0QnlOb3JtYWwoYSwgYik7XHJcblx0XHRcdGlmIChjaGFubmVsU29ydCA9PT0gMCkge1xyXG5cdFx0XHRcdHJldHVybiBub3JtYWxTb3J0O1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBjaGFubmVsU29ydDtcclxuXHRcdH1cclxuXHRcdC8vIEdldCBpdCBiYWNrIHRvIGEgc3RhYmxlIHNvcnQuXHJcblx0XHRyZXR1cm4gc29ydEJ5Tm9ybWFsKGEsIGIpO1xyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlZnJlc2hlcyB0aGUgdXNhYmxlIGVtb3Rlcy4gQW4gZW1vdGUgaXMgZGVlbWVkIHVzYWJsZSBpZiBpdCBlaXRoZXIgaGFzIG5vIHNldCBvciB0aGUgc2V0IGlzIGluIHlvdXIgdXNlciBpbmZvLiBGb3IgdHVyYm8gc2V0cywgaXQgd2lsbCB1c2UgdGhlIHR1cmJvIGlmIGluIHlvdXIgdXNlciBpbmZvLCBvdGhlcndpc2UgZmFsbCBiYWNrIHRvIGRlZmF1bHQuXHJcbiAqL1xyXG5mdW5jdGlvbiByZWZyZXNoVXNhYmxlRW1vdGVzKCkge1xyXG5cdGVtb3Rlcy51c2FibGUgPSBbXTtcclxuXHRlbW90ZXMucmF3LmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHQvLyBBbGxvdyBoaWRpbmcgb2YgZW1vdGVzIGZyb20gdGhlIG1lbnUuXHJcblx0XHRpZiAoZW1vdGUuaGlkZGVuKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGlmICghZW1vdGUudGV4dCkge1xyXG5cdFx0XHRlbW90ZS50ZXh0ID0gZ2V0RW1vdGVGcm9tUmVnRXgoZW1vdGUucmVnZXgpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSkge1xyXG5cdFx0XHRlbW90ZS5jaGFubmVsID0gZW1vdGVzLnN1YnNjcmlwdGlvbnMuZW1vdGVzW2Vtb3RlLnRleHRdLmNoYW5uZWw7XHJcblx0XHR9XHJcblx0XHR2YXIgZGVmYXVsdEltYWdlO1xyXG5cdFx0ZW1vdGUuaW1hZ2VzLnNvbWUoZnVuY3Rpb24gKGltYWdlKSB7XHJcblx0XHRcdGlmIChpbWFnZS5lbW90aWNvbl9zZXQgPT09IG51bGwpIHtcclxuXHRcdFx0XHRkZWZhdWx0SW1hZ2UgPSBpbWFnZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoXHJcblx0XHRcdFx0Ly8gSW1hZ2UgaXMgdGhlIHNhbWUgVVJMIGFzIHRoZSBzdWJzY3JpcHRpb24gZW1vdGUuXHJcblx0XHRcdFx0KGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSAmJiBpbWFnZS51cmwgPT09IGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XS51cmwpIHx8XHJcblx0XHRcdFx0Ly8gRW1vdGUgaXMgZm9yY2VkIHRvIHNob3cuXHJcblx0XHRcdFx0ZW1vdGUuaGlkZGVuID09PSBmYWxzZVxyXG5cdFx0XHQpIHtcclxuXHRcdFx0XHRlbW90ZS5pbWFnZSA9IGltYWdlO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdGVtb3RlLmltYWdlID0gZW1vdGUuaW1hZ2UgfHwgZGVmYXVsdEltYWdlO1xyXG5cclxuXHRcdC8vIE9ubHkgYWRkIHRoZSBlbW90ZSBpZiB0aGVyZSBpcyBhIFVSTC5cclxuXHRcdGlmIChlbW90ZS5pbWFnZSAmJiBlbW90ZS5pbWFnZS51cmwgIT09IG51bGwpIHtcclxuXHRcdFx0ZW1vdGVzLnVzYWJsZS5wdXNoKGVtb3RlKTtcclxuXHRcdH1cclxuXHR9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFkZHMgLyBzZXRzIHBvcHVsYXJpdHkgb2YgYW4gZW1vdGUuIE5vdGU6IHNhdmVzIHBvcHVsYXJpdHkgZGF0YSB0byBzdG9yYWdlIGVhY2ggdGltZSB0aGlzIGlzIGNhbGxlZC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgICAgICAgICAgVGhlIHRleHQgb2YgdGhlIGVtb3RlIChlLmcuIFwiS2FwcGFcIikuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbZm9yY2VBbW91bnRdIFRoZSBhbW91bnQgb2YgcG9wdWxhcml0eSB0byBmb3JjZSB0aGUgZW1vdGUgdG8gaGF2ZS4gSWYgbm90IHNwZWNpZmljZWQsIHBvcHVsYXJpdHkgd2lsbCBpbmNyZWFzZSBieSAxLlxyXG4gKi9cclxuZnVuY3Rpb24gZW1vdGVQb3B1bGFyaXR5QWRkKHRleHQsIGZvcmNlQW1vdW50KSB7XHJcblx0ZW1vdGVQb3B1bGFyaXR5SW5pdCgpO1xyXG5cdGlmIChlbW90ZVBvcHVsYXJpdHlbdGV4dF0gPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5W3RleHRdID0gMDtcclxuXHR9XHJcblx0aWYgKHR5cGVvZiBmb3JjZUFtb3VudCA9PT0gJ251bWJlcicgJiYgZm9yY2VBbW91bnQgPj0gMCkge1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5W3RleHRdID0gZm9yY2VBbW91bnQ7XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5W3RleHRdKys7XHJcblx0fVxyXG5cdHNldFNldHRpbmcoJ2Vtb3RlLXBvcHVsYXJpdHktdHJhY2tpbmcnLCBKU09OLnN0cmluZ2lmeShlbW90ZVBvcHVsYXJpdHkpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGN1cnJlbnQgcG9wdWxhcml0eSBvZiBhbiBlbW90ZS5cclxuICogQHBhcmFtICB7c3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSAoZS5nLiBcIkthcHBhXCIpLlxyXG4gKiBAcmV0dXJuIHtudW1iZXJ9ICAgICAgVGhlIGFtb3VudCBvZiBwb3B1bGFyaXR5LiBQb3NzaWJsZSB0byBiZSAwIGlmIGl0IGhhcyBiZWVuIGZvcmNlZC5cclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgIGBmYWxzZWAgaWYgdGhlIGVtb3RlIGlzIG5vdCBpbiB0aGUgcG9wdWxhcml0eSB0cmFja2luZyBkYXRhIChuZXZlciBiZWVuIGFkZGVkIGJ5IGBlbW90ZVBvcHVsYXJpdHlBZGRgKS5cclxuICovXHJcbmZ1bmN0aW9uIGVtb3RlUG9wdWxhcml0eUdldCh0ZXh0KSB7XHJcblx0ZW1vdGVQb3B1bGFyaXR5SW5pdCgpO1xyXG5cdGlmICh0eXBlb2YgZW1vdGVQb3B1bGFyaXR5W3RleHRdID09PSAnbnVtYmVyJyAmJiBlbW90ZVBvcHVsYXJpdHlbdGV4dF0gPj0gMCkge1xyXG5cdFx0cmV0dXJuIGVtb3RlUG9wdWxhcml0eVt0ZXh0XTtcclxuXHR9XHJcblx0cmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vKipcclxuICogQ2xlYXJzIHRoZSBjdXJyZW50IGVtb3RlIHBvcHVsYXJpdHkgdHJhY2tpbmcgZGF0YS5cclxuICovXHJcbmZ1bmN0aW9uIGVtb3RlUG9wdWxhcml0eUNsZWFyKCkge1xyXG5cdGRlbGV0ZVNldHRpbmcoJ2Vtb3RlLXBvcHVsYXJpdHktdHJhY2tpbmcnKTtcclxuXHRlbW90ZVBvcHVsYXJpdHkgPSBmYWxzZTtcclxuXHRlbW90ZVBvcHVsYXJpdHlJbml0KCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbml0aWF0ZXMgdGhlIHBvcHVsYXJpdHkgdHJhY2tpbmcuIFRoaXMgd2lsbCBwdWxsIGRhdGEgZnJvbSBzdG9yYWdlLCBvciBpZiBub25lIGV4aXN0cywgc2V0IHNvbWUgY29tbW9uIGRlZmF1bHRzLlxyXG4gKi9cclxuZnVuY3Rpb24gZW1vdGVQb3B1bGFyaXR5SW5pdCgpIHtcclxuXHRpZiAoIWVtb3RlUG9wdWxhcml0eSkge1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5ID0gSlNPTi5wYXJzZShnZXRTZXR0aW5nKCdlbW90ZS1wb3B1bGFyaXR5LXRyYWNraW5nJywgJ3t9JykpO1xyXG5cdFx0ZW1vdGVQb3B1bGFyaXR5QWRkKCdCaWJsZVRodW1wJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ0RhbnNHYW1lJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ0ZhaWxGaXNoJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ0thcHBhJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ0tyZXlnYXNtJywgMCk7XHJcblx0XHRlbW90ZVBvcHVsYXJpdHlBZGQoJ1N3aWZ0UmFnZScsIDApO1xyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEluc2VydHMgYW4gZW1vdGUgaW50byB0aGUgY2hhdCBib3guXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSAoZS5nLiBcIkthcHBhXCIpLlxyXG4gKi9cclxuZnVuY3Rpb24gaW5zZXJ0RW1vdGVUZXh0KHRleHQpIHtcclxuXHRlbW90ZVBvcHVsYXJpdHlBZGQodGV4dCk7XHJcblx0Ly8gR2V0IGlucHV0LlxyXG5cdHZhciBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NoYXRfdGV4dF9pbnB1dCwgLmNoYXQtaW50ZXJmYWNlIHRleHRhcmVhJyk7XHJcblxyXG5cdC8vIEluc2VydCBhdCBjdXJzb3IgLyByZXBsYWNlIHNlbGVjdGlvbi5cclxuXHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0NvZGVfc25pcHBldHMvTWlzY2VsbGFuZW91c1xyXG5cdHZhciBzZWxlY3Rpb25FbmQgPSBlbGVtZW50LnNlbGVjdGlvblN0YXJ0ICsgdGV4dC5sZW5ndGg7XHJcblx0dmFyIGN1cnJlbnRWYWx1ZSA9IGVsZW1lbnQudmFsdWU7XHJcblx0dmFyIGJlZm9yZVRleHQgPSBjdXJyZW50VmFsdWUuc3Vic3RyaW5nKDAsIGVsZW1lbnQuc2VsZWN0aW9uU3RhcnQpO1xyXG5cdHZhciBhZnRlclRleHQgPSBjdXJyZW50VmFsdWUuc3Vic3RyaW5nKGVsZW1lbnQuc2VsZWN0aW9uRW5kLCBjdXJyZW50VmFsdWUubGVuZ3RoKTtcclxuXHQvLyBTbWFydCBwYWRkaW5nLCBvbmx5IHB1dCBzcGFjZSBhdCBzdGFydCBpZiBuZWVkZWQuXHJcblx0aWYgKFxyXG5cdFx0YmVmb3JlVGV4dCAhPT0gJycgJiZcclxuXHRcdGJlZm9yZVRleHQuc3Vic3RyKC0xKSAhPT0gJyAnXHJcblx0KSB7XHJcblx0XHR0ZXh0ID0gJyAnICsgdGV4dDtcclxuXHR9XHJcblx0Ly8gQWx3YXlzIHB1dCBzcGFjZSBhdCBlbmQuXHJcblx0dGV4dCA9IGJlZm9yZVRleHQgKyB0ZXh0ICsgJyAnICsgYWZ0ZXJUZXh0O1xyXG5cdC8vIFNldCB0aGUgdGV4dC5cclxuXHR3aW5kb3cuQXBwLl9fY29udGFpbmVyX18ubG9va3VwKCdjb250cm9sbGVyOmNoYXQnKS5nZXQoJ2N1cnJlbnRSb29tJykuc2V0KCdtZXNzYWdlVG9TZW5kJywgdGV4dCk7XHJcblx0ZWxlbWVudC5mb2N1cygpO1xyXG5cdC8vIFB1dCBjdXJzb3IgYXQgZW5kLlxyXG5cdHNlbGVjdGlvbkVuZCA9IGVsZW1lbnQuc2VsZWN0aW9uU3RhcnQgKyB0ZXh0Lmxlbmd0aDtcclxuXHRlbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKHNlbGVjdGlvbkVuZCwgc2VsZWN0aW9uRW5kKTtcclxuXHJcblx0Ly8gQ2xvc2UgcG9wdXAgaWYgaXQgaGFzbid0IGJlZW4gbW92ZWQgYnkgdGhlIHVzZXIuXHJcblx0aWYgKCFlbGVtZW50cy5tZW51Lmhhc0NsYXNzKCdwaW5uZWQnKSkge1xyXG5cdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5jbGljaygpO1xyXG5cdH1cclxuXHQvLyBSZS1wb3B1bGF0ZSBhcyBpdCBpcyBzdGlsbCBvcGVuLlxyXG5cdGVsc2Uge1xyXG5cdFx0cG9wdWxhdGVFbW90ZXNNZW51KCk7XHJcblx0fVxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgZW1vdGUgZWxlbWVudCBhbmQgbGlzdGVucyBmb3IgYSBjbGljayBldmVudCB0aGF0IHdpbGwgYWRkIHRoZSBlbW90ZSB0ZXh0IHRvIHRoZSBjaGF0LlxyXG4gKiBAcGFyYW0ge29iamVjdH0gIGVtb3RlICAgICAgVGhlIGVtb3RlIHRoYXQgeW91IHdhbnQgdG8gYWRkLiBUaGlzIG9iamVjdCBzaG91bGQgYmUgb25lIGNvbWluZyBmcm9tIGBlbW90ZXNgLlxyXG4gKiBAcGFyYW0ge2VsZW1lbnR9IGNvbnRhaW5lciAgVGhlIEhUTUwgZWxlbWVudCB0aGF0IHRoZSBlbW90ZSBzaG91bGQgYmUgYXBwZW5kZWQgdG8uXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc2hvd0hlYWRlciBXaGV0aGVyIGEgaGVhZGVyIHNob3VsZGJlIGNyZWF0ZWQgaWYgZm91bmQuIE9ubHkgY3JlYXRlcyB0aGUgaGVhZGVyIG9uY2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyLCBzaG93SGVhZGVyKSB7XHJcblx0Ly8gRW1vdGUgbm90IHVzYWJsZSBvciBubyBjb250YWluZXIsIGNhbid0IGFkZC5cclxuXHRpZiAoIWVtb3RlIHx8ICFlbW90ZS5pbWFnZSB8fCAhY29udGFpbmVyLmxlbmd0aCkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRpZiAoc2hvd0hlYWRlcikge1xyXG5cdFx0aWYgKGVtb3RlLmNoYW5uZWwgJiYgZW1vdGUuY2hhbm5lbCAhPT0gJ1R3aXRjaCBUdXJibycpIHtcclxuXHRcdFx0dmFyIGJhZGdlID0gZW1vdGVzLnN1YnNjcmlwdGlvbnMuYmFkZ2VzW2Vtb3RlLmNoYW5uZWxdIHx8IGVtb3RlLmJhZGdlO1xyXG5cdFx0XHQvLyBBZGQgbm90aWNlIGFib3V0IGFkZG9uIGVtb3Rlcy5cclxuXHRcdFx0aWYgKCFlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbZW1vdGUuY2hhbm5lbF0gJiYgIWVsZW1lbnRzLm1lbnUuZmluZCgnLmdyb3VwLWhlYWRlci5hZGRvbi1lbW90ZXMtaGVhZGVyJykubGVuZ3RoKSB7XHJcblx0XHRcdFx0Y29udGFpbmVyLmFwcGVuZChcclxuXHRcdFx0XHRcdCQodGVtcGxhdGVzLmVtb3RlR3JvdXBIZWFkZXIoe1xyXG5cdFx0XHRcdFx0XHRpc0FkZG9uSGVhZGVyOiB0cnVlXHJcblx0XHRcdFx0XHR9KSlcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5maW5kKCcuZ3JvdXAtaGVhZGVyW2RhdGEtZW1vdGUtY2hhbm5lbD1cIicgKyBlbW90ZS5jaGFubmVsICsgJ1wiXScpLmxlbmd0aCkge1xyXG5cdFx0XHRcdGNvbnRhaW5lci5hcHBlbmQoXHJcblx0XHRcdFx0XHQkKHRlbXBsYXRlcy5lbW90ZUdyb3VwSGVhZGVyKHtcclxuXHRcdFx0XHRcdFx0YmFkZ2U6IGJhZGdlLFxyXG5cdFx0XHRcdFx0XHRjaGFubmVsOiBlbW90ZS5jaGFubmVsXHJcblx0XHRcdFx0XHR9KSlcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRjb250YWluZXIuYXBwZW5kKFxyXG5cdFx0JCh0ZW1wbGF0ZXMuZW1vdGUoe1xyXG5cdFx0XHRpbWFnZTogZW1vdGUuaW1hZ2UsXHJcblx0XHRcdHRleHQ6IGVtb3RlLnRleHRcclxuXHRcdH0pKVxyXG5cdCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTaG93IGxhdGVzdCBuZXdzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2hvd05ld3MoKSB7XHJcblx0dmFyIGRpc21pc3NlZE5ld3MgPSBKU09OLnBhcnNlKGdldFNldHRpbmcoJ3R3aXRjaC1jaGF0LWVtb3RlczpkaXNtaXNzZWQtbmV3cycsICdbXScpKTtcclxuXHR2YXIgY2FjaGVkTmV3cyA9IEpTT04ucGFyc2UoZ2V0U2V0dGluZygndHdpdGNoLWNoYXQtZW1vdGVzOmNhY2hlZC1uZXdzJywgJ3t9JykpO1xyXG5cdC8vIE9ubHkgcG9sbCBuZXdzIGZlZWQgb25jZSBwZXIgZGF5LlxyXG5cdGlmIChEYXRlLm5vdygpIC0gZ2V0U2V0dGluZygndHdpdGNoLWNoYXQtZW1vdGVzOm5ld3MtZGF0ZScsIDApID4gODY0MDAwMDApIHtcclxuXHRcdCQuYWpheCgnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9jbGV0dXNjL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9jb250ZW50cy9uZXdzLmpzb24nLCB7XHJcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXHJcblx0XHRcdGhlYWRlcnM6IHtcclxuXHRcdFx0XHQnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL3ZuZC5naXRodWIudjMucmF3K2pzb24nLFxyXG5cdFx0XHRcdCdVc2VyLUFnZW50JzogJ2NsZXR1c2MvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzJ1xyXG5cdFx0XHR9XHJcblx0XHR9KS5kb25lKGZ1bmN0aW9uIChkYXRhKSB7XHJcblx0XHRcdGNhY2hlZE5ld3MgPSBkYXRhIHx8IGNhY2hlZE5ld3M7XHJcblx0XHRcdHNldFNldHRpbmcoJ3R3aXRjaC1jaGF0LWVtb3RlczpjYWNoZWQtbmV3cycsIEpTT04uc3RyaW5naWZ5KGNhY2hlZE5ld3MpKTtcclxuXHRcdH0pLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGhhbmRsZU5ld3NGZWVkKCk7XHJcblx0XHRcdHNldFNldHRpbmcoJ3R3aXRjaC1jaGF0LWVtb3RlczpuZXdzLWRhdGUnLCBEYXRlLm5vdygpKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHRlbHNlIHtcclxuXHRcdGhhbmRsZU5ld3NGZWVkKCk7XHJcblx0fVxyXG5cclxuXHQvLyBIYW5kbGVzIGRpc3BsYXlpbmcgb2YgbmV3cyBmZWVkLlxyXG5cdGZ1bmN0aW9uIGhhbmRsZU5ld3NGZWVkKCkge1xyXG5cdFx0Zm9yICh2YXIgbmV3c0lkIGluIGNhY2hlZE5ld3MpIHtcclxuXHRcdFx0aWYgKGNhY2hlZE5ld3MuaGFzT3duUHJvcGVydHkobmV3c0lkKSAmJiBkaXNtaXNzZWROZXdzLmluZGV4T2YobmV3c0lkKSA9PT0gLTEpIHtcclxuXHRcdFx0XHQvLyBUT0RPICM0M1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQkKCcjY2hhdF9saW5lcywgLmNoYXQtbWVzc2FnZXMnKS5vbignY2xpY2snLCAnYVtkYXRhLWNvbW1hbmQ9XCJ0d2l0Y2gtY2hhdC1lbW90ZXM6ZGlzbWlzcy1uZXdzXCJdJywgZnVuY3Rpb24gKGV2dCkge1xyXG5cdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0ZGlzbWlzc2VkTmV3cy5wdXNoKCQodGhpcykuZGF0YSgnbmV3cy1pZCcpKTtcclxuXHRcdFx0c2V0U2V0dGluZygndHdpdGNoLWNoYXQtZW1vdGVzOmRpc21pc3NlZC1uZXdzJywgSlNPTi5zdHJpbmdpZnkoZGlzbWlzc2VkTmV3cykpO1xyXG5cdFx0XHQkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLnJlbW92ZSgpO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgdXNhYmxlIGVtb3RlIHRleHQgZnJvbSBhIHJlZ2V4LlxyXG4gKiBAYXR0cmlidXRlIGh0dHA6Ly91c2Vyc2NyaXB0cy5vcmcvc2NyaXB0cy9zaG93LzE2MDE4MyAoYWRhcHRpb24pXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRFbW90ZUZyb21SZWdFeChyZWdleCkge1xyXG5cdGlmICh0eXBlb2YgcmVnZXggPT09ICdzdHJpbmcnKSB7XHJcblx0XHRyZWdleCA9IG5ldyBSZWdFeHAocmVnZXgpO1xyXG5cdH1cclxuXHRyZXR1cm4gZGVjb2RlVVJJKHJlZ2V4LnNvdXJjZSlcclxuXHRcdC5yZXBsYWNlKCcmZ3RcXFxcOycsICc+JykgLy8gcmlnaHQgYW5nbGUgYnJhY2tldFxyXG5cdFx0LnJlcGxhY2UoJyZsdFxcXFw7JywgJzwnKSAvLyBsZWZ0IGFuZ2xlIGJyYWNrZXRcclxuXHRcdC5yZXBsYWNlKC9cXChcXD8hW14pXSpcXCkvZywgJycpIC8vIHJlbW92ZSBuZWdhdGl2ZSBncm91cFxyXG5cdFx0LnJlcGxhY2UoL1xcKChbXnxdKSpcXHw/W14pXSpcXCkvZywgJyQxJykgLy8gcGljayBmaXJzdCBvcHRpb24gZnJvbSBhIGdyb3VwXHJcblx0XHQucmVwbGFjZSgvXFxbKFtefF0pKlxcfD9bXlxcXV0qXFxdL2csICckMScpIC8vIHBpY2sgZmlyc3QgY2hhcmFjdGVyIGZyb20gYSBjaGFyYWN0ZXIgZ3JvdXBcclxuXHRcdC5yZXBsYWNlKC9bXlxcXFxdXFw/L2csICcnKSAvLyByZW1vdmUgb3B0aW9uYWwgY2hhcnNcclxuXHRcdC5yZXBsYWNlKC9eXFxcXGJ8XFxcXGIkL2csICcnKSAvLyByZW1vdmUgYm91bmRhcmllc1xyXG5cdFx0LnJlcGxhY2UoL1xcXFwvZywgJycpOyAvLyB1bmVzY2FwZVxyXG59XHJcblxyXG4vLyBHZW5lcmljIGZ1bmN0aW9ucy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8qKlxyXG4gKiBHZXRzIGEgc3RvcmFnZSB2YWx1ZS5cclxuICogQHBhcmFtICB7c3RyaW5nfSBhS2V5ICAgICBUaGUga2V5IHlvdSB3YW50IHRvIGdldC5cclxuICogQHBhcmFtICB7bWl4ZWR9ICBhRGVmYXVsdCBUaGUgZGVmYXVsdCB2YWx1ZSB0byByZXR1cm4gaWYgdGhlcmUgaXNuJ3QgYW55dGhpbmcgaW4gc3RvcmFnZS5cclxuICogQHJldHVybiB7bWl4ZWR9ICAgICAgICAgICBUaGUgdmFsdWUgaW4gc3RvcmFnZSBvciBgYURlZmF1bHRgIGlmIHRoZXJlIGlzbid0IGFueXRoaW5nIGluIHN0b3JhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTZXR0aW5nKGFLZXksIGFEZWZhdWx0KSB7XHJcblx0dmFyIHZhbCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGFLZXkpO1xyXG5cdGlmICh2YWwgPT09IG51bGwgJiYgdHlwZW9mIGFEZWZhdWx0ICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0cmV0dXJuIGFEZWZhdWx0O1xyXG5cdH1cclxuXHRyZXR1cm4gdmFsO1xyXG59XHJcbi8qKlxyXG4gKiBTZXRzIGEgc3RvcmFnZSB2YWx1ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGFLZXkgVGhlIGtleSB5b3Ugd2FudCB0byBzZXQuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBhVmFsIFRoZSB2YWx1ZSB5b3Ugd2FudCB0byBzdG9yZS5cclxuICovXHJcbmZ1bmN0aW9uIHNldFNldHRpbmcoYUtleSwgYVZhbCkge1xyXG5cdGxvY2FsU3RvcmFnZS5zZXRJdGVtKGFLZXksIGFWYWwpO1xyXG59XHJcblxyXG4vKipcclxuICogRGVsZXRlcyBhIHN0b3JhZ2Uga2V5LlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gYUtleSBUaGUga2V5IHlvdSB3YW50IHRvIHNldC5cclxuICovXHJcbmZ1bmN0aW9uIGRlbGV0ZVNldHRpbmcoYUtleSkge1xyXG5cdGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGFLZXkpO1xyXG59XHJcbiIsIihmdW5jdGlvbiAoZG9jLCBjc3NUZXh0KSB7XG4gICAgdmFyIHN0eWxlRWwgPSBkb2MuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG4gICAgaWYgKHN0eWxlRWwuc3R5bGVTaGVldCkge1xuICAgICAgICBpZiAoIXN0eWxlRWwuc3R5bGVTaGVldC5kaXNhYmxlZCkge1xuICAgICAgICAgICAgc3R5bGVFbC5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3NUZXh0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0eWxlRWwuaW5uZXJIVE1MID0gY3NzVGV4dDtcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlKSB7XG4gICAgICAgICAgICBzdHlsZUVsLmlubmVyVGV4dCA9IGNzc1RleHQ7XG4gICAgICAgIH1cbiAgICB9XG59KGRvY3VtZW50LCBcIi8qKlxcblwiICtcblwiICogTWluaWZpZWQgc3R5bGUuXFxuXCIgK1xuXCIgKiBPcmlnaW5hbCBmaWxlbmFtZTogXFxcXG5vZGVfbW9kdWxlc1xcXFxqcXVlcnktY3VzdG9tLXNjcm9sbGJhclxcXFxqcXVlcnkuY3VzdG9tLXNjcm9sbGJhci5jc3NcXG5cIiArXG5cIiAqL1xcblwiICtcblwiLnNjcm9sbGFibGV7cG9zaXRpb246cmVsYXRpdmV9LnNjcm9sbGFibGU6Zm9jdXN7b3V0bGluZTowfS5zY3JvbGxhYmxlIC52aWV3cG9ydHtwb3NpdGlvbjpyZWxhdGl2ZTtvdmVyZmxvdzpoaWRkZW59LnNjcm9sbGFibGUgLnZpZXdwb3J0IC5vdmVydmlld3twb3NpdGlvbjphYnNvbHV0ZX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhcntkaXNwbGF5Om5vbmV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIudmVydGljYWx7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDtoZWlnaHQ6MTAwJX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci5ob3Jpem9udGFse3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjEwMCV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIgLnRodW1ie3Bvc2l0aW9uOmFic29sdXRlfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyLnZlcnRpY2FsIC50aHVtYnt3aWR0aDoxMDAlO21pbi1oZWlnaHQ6MTBweH0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci5ob3Jpem9udGFsIC50aHVtYntoZWlnaHQ6MTAwJTttaW4td2lkdGg6MTBweDtsZWZ0OjB9Lm5vdC1zZWxlY3RhYmxley13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTsta2h0bWwtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZX0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW57cGFkZGluZy1yaWdodDoxMHB4O3BhZGRpbmctYm90dG9tOjZweH0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXIudmVydGljYWx7d2lkdGg6NnB4fS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFse2hlaWdodDo2cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOiMwMDA7b3BhY2l0eTouNDtib3JkZXItcmFkaXVzOjNweDstbW96LWJvcmRlci1yYWRpdXM6NHB4Oy13ZWJraXQtYm9yZGVyLXJhZGl1czo0cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyOmhvdmVyIC50aHVtYntvcGFjaXR5Oi42fS5zY3JvbGxhYmxlLmdyYXktc2tpbntwYWRkaW5nLXJpZ2h0OjE3cHh9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFye2JvcmRlcjoxcHggc29saWQgZ3JheTtiYWNrZ3JvdW5kLWNvbG9yOiNkM2QzZDN9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOmdyYXl9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyOmhvdmVyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOiMwMDB9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2Fse3dpZHRoOjEwcHh9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyLmhvcml6b250YWx7aGVpZ2h0OjEwcHg7bWFyZ2luLXRvcDoycHh9LnNjcm9sbGFibGUubW9kZXJuLXNraW57cGFkZGluZy1yaWdodDoxN3B4fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFye2JvcmRlcjoxcHggc29saWQgZ3JheTtib3JkZXItcmFkaXVzOjRweDstbW96LWJvcmRlci1yYWRpdXM6NHB4Oy13ZWJraXQtYm9yZGVyLXJhZGl1czo0cHg7Ym94LXNoYWRvdzppbnNldCAwIDAgNXB4ICM4ODh9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6Izk1YWFiZjtib3JkZXItcmFkaXVzOjRweDstbW96LWJvcmRlci1yYWRpdXM6NHB4Oy13ZWJraXQtYm9yZGVyLXJhZGl1czo0cHg7Ym9yZGVyOjFweCBzb2xpZCAjNTM2OTg0fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2FsIC50aHVtYnt3aWR0aDo4cHg7YmFja2dyb3VuZDotd2Via2l0LWdyYWRpZW50KGxpbmVhcixsZWZ0IHRvcCxyaWdodCB0b3AsY29sb3Itc3RvcCgwJSwjOTVhYWJmKSxjb2xvci1zdG9wKDEwMCUsIzU0NzA5MikpO2JhY2tncm91bmQ6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQobGVmdCwjOTVhYWJmIDAsIzU0NzA5MiAxMDAlKTtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwjOTVhYWJmIDAsIzU0NzA5MiAxMDAlKTstbXMtZmlsdGVyOlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuZ3JhZGllbnQoIHN0YXJ0Q29sb3JzdHI9JyM5NWFhYmYnLCBlbmRDb2xvcnN0cj0nIzU0NzA5MicsR3JhZGllbnRUeXBlPTEgKVxcXCJ9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIuaG9yaXpvbnRhbCAudGh1bWJ7aGVpZ2h0OjhweDtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgjOTVhYWJmLCM1NDcwOTIpO2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQoIzk1YWFiZiwjNTQ3MDkyKTstbXMtZmlsdGVyOlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuZ3JhZGllbnQoIHN0YXJ0Q29sb3JzdHI9JyM5NWFhYmYnLCBlbmRDb2xvcnN0cj0nIzU0NzA5MicsR3JhZGllbnRUeXBlPTAgKVxcXCJ9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIudmVydGljYWx7d2lkdGg6MTBweH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFse2hlaWdodDoxMHB4O21hcmdpbi10b3A6MnB4fVxcblwiICtcblwiLyoqXFxuXCIgK1xuXCIgKiBNaW5pZmllZCBzdHlsZS5cXG5cIiArXG5cIiAqIE9yaWdpbmFsIGZpbGVuYW1lOiBcXFxcc3JjXFxcXHN0eWxlc1xcXFxzdHlsZS5jc3NcXG5cIiArXG5cIiAqL1xcblwiICtcblwiI2Vtb3RlLW1lbnUtYnV0dG9ue2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQklBQUFBUUNBWUFBQUFiQmk5Y0FBQUFBWE5TUjBJQXJzNGM2UUFBQUFSblFVMUJBQUN4and2OFlRVUFBQUFKY0VoWmN3QUFEc01BQUE3REFjZHZxR1FBQUFLVVNVUkJWRGhQZlpUTmkxSlJHTVp2TUlzV1VadHM1U0lYRllLMENNRS9JR2doeFZDN1dVb1UxTkJpeEkrbVJTRDRNUXpteHppS08zWFVCaFJtVUdaS2RCRzQwWEVHVTZkMEdGR1pjVDRxeFcxaGk3Znp2TndacUt3REQ1ejd2cy92dWVlZWUrNlZNSnhPNXdVaGhkdnRmdUh6K1Q0dExTMk5oZWdmR3NNREx4aXdISUloTGk1N1BKNzVWQ3IxWTM5L240YkRJWTFHbzRsQ0R4NTR3WUNWWXpqb1ZqUWEvZHh1dHlmQ2t3U3ZZSnBnT1NRZjcwOHR1QmExeVdSeS9MK1YvQ2w0d1lCRmhoVHhmTGh1bS9lc2lpSjF1MTJLUkNKa3NWaG9mWDJkVGs1T3prSE1VVU1QSG5qQjJGNTVWcEVoUGRlL0xieDhGcUJFSWtIcGRKb01CZ05wdFZyUzZYUlVxVlRPZzdhM3QybG1ab2IwZWoycDFXcjJnZ0dMRE9uSjNRU1pINGNvSG8vVHlzb0toeWdVQ3RKb05GUXNGbWt3R0xBd1I3aFNxU1NWU3NWZU1HQ1JJVDI5RjZmWEppOFh5K1V5bWMxbW1wNmVKb2ZEUWZWNm5VNVBUMW1ZMisxMjd1SHhTcVVTaDRGRmhoUUx2cnZ0Y3JtK1lwa0hCd2RVclZacGEydUxhclVhZFRvZE9qdzhaR0dPR25yd3dBc0dMREx3MWk0dUxyelJZZU9PajQ5cGIyK1BkbmQzcWRWcThTdEdBSVE1YW8xR2d6M3dnZ0dMREQ0QzRpemNFY1dmUjBkSGJNcmxjclN4c2NHYmpWQUlLOGxtczdTNXVjbUIvWDZmWHo5WURzRVFGemRqc1ZpdDJXenlxYzFrTXJ3ZlZxdVZqRVlqemMzTmtjbGtJcHZOUm10cmEreUJWekFmQlh0RGp1R2dTOEZnY0ZiYzhRdnVoak5TS0JRb0ZBcVI2TEZFbi9MNVBQZmdnWGQ1ZVhrV3JCekRRZEMxUUNCZ0ZvZXV0N096dy90eUJwMkZRemhQd3RPRkZ3elkzNFlvNEE5d1JYemREOExoY0U0OHduY0U5bm85RnVhb2lkNTc0YmtQTHhnWi8zdUk1cFRRVmZGbFAvTDcvV21oYjdKU1hxLzNJWHJ3eUhaNVNOSXZHQ25xeWgrSjcrZ0FBQUFBU1VWT1JLNUNZSUk9KSFpbXBvcnRhbnQ7YmFja2dyb3VuZC1wb3NpdGlvbjo1MCU7YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2N1cnNvcjpwb2ludGVyO21hcmdpbi1sZWZ0OjdweH0jZW1vdGUtbWVudS1idXR0b24uYWN0aXZle2JvcmRlci1yYWRpdXM6MnB4O2JhY2tncm91bmQtY29sb3I6cmdiYSgxMjgsMTI4LDEyOCwuNSl9LmVtb3RlLW1lbnV7cGFkZGluZzo1cHg7ei1pbmRleDoxMDAwO2Rpc3BsYXk6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOiMyMDIwMjB9LmVtb3RlLW1lbnUgYXtjb2xvcjojZmZmfS5lbW90ZS1tZW51IGE6aG92ZXJ7Y3Vyc29yOnBvaW50ZXI7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTtjb2xvcjojY2NjfS5lbW90ZS1tZW51IC5lbW90ZXMtcG9wdWxhcntoZWlnaHQ6MzhweH0uZW1vdGUtbWVudSAuZHJhZ2dhYmxle2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1yZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSAxMHB4KTtiYWNrZ3JvdW5kLWltYWdlOnJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDEwcHgpO2N1cnNvcjptb3ZlO2hlaWdodDo3cHg7bWFyZ2luLWJvdHRvbTozcHh9LmVtb3RlLW1lbnUgLmRyYWdnYWJsZTpob3ZlcntiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtcmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDEwcHgpO2JhY2tncm91bmQtaW1hZ2U6cmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDEwcHgpfS5lbW90ZS1tZW51IC5ncm91cC1oZWFkZXJ7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQoYm90dG9tLHRyYW5zcGFyZW50LHJnYmEoMCwwLDAsLjUpKTtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCh0byB0b3AsdHJhbnNwYXJlbnQscmdiYSgwLDAsMCwuNSkpO3BhZGRpbmc6MnB4O2NvbG9yOiNkZGQ7dGV4dC1hbGlnbjpjZW50ZXJ9LmVtb3RlLW1lbnUgLmdyb3VwLWhlYWRlciBpbWd7bWFyZ2luLXJpZ2h0OjhweH0uZW1vdGUtbWVudSAuZW1vdGV7ZGlzcGxheTppbmxpbmUtYmxvY2s7cGFkZGluZzoycHg7bWFyZ2luOjFweDtjdXJzb3I6cG9pbnRlcjtib3JkZXItcmFkaXVzOjVweDt0ZXh0LWFsaWduOmNlbnRlcjtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDozMnB4O2hlaWdodDozMnB4fS5lbW90ZS1tZW51IC5lbW90ZSBkaXZ7bWF4LXdpZHRoOjMycHg7bWF4LWhlaWdodDozMnB4O2JhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdDtiYWNrZ3JvdW5kLXNpemU6Y29udGFpbjttYXJnaW46YXV0bztwb3NpdGlvbjphYnNvbHV0ZTt0b3A6MDtib3R0b206MDtsZWZ0OjA7cmlnaHQ6MH0uZW1vdGUtbWVudSAuc2luZ2xlLXJvd3tvdmVyZmxvdzpoaWRkZW47aGVpZ2h0OjM3cHh9LmVtb3RlLW1lbnUgLnNpbmdsZS1yb3cgLmVtb3Rle2Rpc3BsYXk6aW5saW5lLWJsb2NrO21hcmdpbi1ib3R0b206MTAwcHh9LmVtb3RlLW1lbnUgLmVtb3RlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwuMSl9LmVtb3RlLW1lbnUgLnB1bGwtbGVmdHtmbG9hdDpsZWZ0fS5lbW90ZS1tZW51IC5wdWxsLXJpZ2h0e2Zsb2F0OnJpZ2h0fS5lbW90ZS1tZW51IC5mb290ZXJ7dGV4dC1hbGlnbjpjZW50ZXI7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O3BhZGRpbmc6NXB4IDAgMnB4O21hcmdpbi10b3A6NXB4fS5lbW90ZS1tZW51IC5mb290ZXIgLnB1bGwtbGVmdHttYXJnaW4tcmlnaHQ6NXB4fS5lbW90ZS1tZW51IC5mb290ZXIgLnB1bGwtcmlnaHR7bWFyZ2luLWxlZnQ6NXB4fS5lbW90ZS1tZW51IC5pY29ue2hlaWdodDoxNnB4O3dpZHRoOjE2cHg7b3BhY2l0eTouNTtiYWNrZ3JvdW5kLXNpemU6Y29udGFpbiFpbXBvcnRhbnR9LmVtb3RlLW1lbnUgLmljb246aG92ZXJ7b3BhY2l0eToxfS5lbW90ZS1tZW51IC5pY29uLWhvbWV7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlOalFpRFFvZ0lDQm9aV2xuYUhROUlqWTBJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJRFkwSURZMElnMEtJQ0FnYVdROUlrTmhjR0ZmTVNJTkNpQWdJSGh0YkRwemNHRmpaVDBpY0hKbGMyVnlkbVVpUGp4dFpYUmhaR0YwWVEwS0lDQWdhV1E5SW0xbGRHRmtZWFJoTXpBd01TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pJNU9Ua2lJQzgrRFFvOGNHRjBhQTBLSUNBZ1pEMGliU0ExTnk0d05qSXNNekV1TXprNElHTWdNQzQ1TXpJc0xURXVNREkxSURBdU9EUXlMQzB5TGpVNU5pQXRNQzR5TURFc0xUTXVOVEE0SUV3Z016TXVPRGcwTERjdU56ZzFJRU1nTXpJdU9EUXhMRFl1T0RjeklETXhMakUyT1N3MkxqZzVNaUF6TUM0eE5EZ3NOeTQ0TWpnZ1RDQTNMakE1TXl3eU9DNDVOaklnWXlBdE1TNHdNakVzTUM0NU16WWdMVEV1TURjeExESXVOVEExSUMwd0xqRXhNU3d6TGpVd015QnNJREF1TlRjNExEQXVOakF5SUdNZ01DNDVOVGtzTUM0NU9UZ2dNaTQxTURrc01TNHhNVGNnTXk0ME5pd3dMakkyTlNCc0lERXVOekl6TEMweExqVTBNeUIySURJeUxqVTVJR01nTUN3eExqTTROaUF4TGpFeU15d3lMalV3T0NBeUxqVXdPQ3d5TGpVd09DQm9JRGd1T1RnM0lHTWdNUzR6T0RVc01DQXlMalV3T0N3dE1TNHhNaklnTWk0MU1EZ3NMVEl1TlRBNElGWWdNemd1TlRjMUlHZ2dNVEV1TkRZeklIWWdNVFV1T0RBMElHTWdMVEF1TURJc01TNHpPRFVnTUM0NU56RXNNaTQxTURjZ01pNHpOVFlzTWk0MU1EY2dhQ0E1TGpVeU5DQmpJREV1TXpnMUxEQWdNaTQxTURnc0xURXVNVEl5SURJdU5UQTRMQzB5TGpVd09DQldJRE15TGpFd055QmpJREFzTUNBd0xqUTNOaXd3TGpReE55QXhMakEyTXl3d0xqa3pNeUF3TGpVNE5pd3dMalV4TlNBeExqZ3hOeXd3TGpFd01pQXlMamMwT1N3dE1DNDVNalFnYkNBd0xqWTFNeXd0TUM0M01UZ2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb01qazVOU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1abVptWTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6ND0pIG5vLXJlcGVhdCA1MCV9LmVtb3RlLW1lbnUgLmljb24tcmVzaXplLWhhbmRsZXtiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UWWlEUW9nSUNCb1pXbG5hSFE5SWpFMklnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lERTJJREUySWcwS0lDQWdhV1E5SWtOaGNHRmZNU0lOQ2lBZ0lIaHRiRHB6Y0dGalpUMGljSEpsYzJWeWRtVWlQanh0WlhSaFpHRjBZUTBLSUNBZ2FXUTlJbTFsZEdGa1lYUmhORE0xTnlJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jelF6TlRVaUlDOCtEUW84Y0dGMGFBMEtJQ0FnWkQwaVRTQXhNeTQxTERnZ1F5QXhNeTR5TWpVc09DQXhNeXc0TGpJeU5DQXhNeXc0TGpVZ2RpQXpMamM1TXlCTUlETXVOekEzTERNZ1NDQTNMalVnUXlBM0xqYzNOaXd6SURnc01pNDNOellnT0N3eUxqVWdPQ3d5TGpJeU5DQTNMamMzTml3eUlEY3VOU3d5SUdnZ0xUVWdUQ0F5TGpNd09Td3lMakF6T1NBeUxqRTFMREl1TVRRMElESXVNVFEyTERJdU1UUTJJREl1TVRRekxESXVNVFV5SURJdU1ETTVMREl1TXpBNUlESXNNaTQxSUhZZ05TQkRJRElzTnk0M056WWdNaTR5TWpRc09DQXlMalVzT0NBeUxqYzNOaXc0SURNc055NDNOellnTXl3M0xqVWdWaUF6TGpjd055Qk1JREV5TGpJNU15d3hNeUJJSURndU5TQkRJRGd1TWpJMExERXpJRGdzTVRNdU1qSTFJRGdzTVRNdU5TQTRMREV6TGpjM05TQTRMakl5TkN3eE5DQTRMalVzTVRRZ2FDQTFJR3dnTUM0eE9URXNMVEF1TURNNUlHTWdNQzR4TWpFc0xUQXVNRFV4SURBdU1qSXNMVEF1TVRRNElEQXVNamNzTFRBdU1qY2dUQ0F4TkN3eE15NDFNRElnVmlBNExqVWdReUF4TkN3NExqSXlOQ0F4TXk0M056VXNPQ0F4TXk0MUxEZ2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb05ETTFNU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1abVptWTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6ND0pIG5vLXJlcGVhdCA1MCU7Y3Vyc29yOm53c2UtcmVzaXplIWltcG9ydGFudH0uZW1vdGUtbWVudSAuaWNvbi1waW57YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVFlpRFFvZ0lDQm9aV2xuYUhROUlqRTJJZzBLSUNBZ2FXUTlJbk4yWnpNd01EVWlQZzBLSUNBOGJXVjBZV1JoZEdFTkNpQWdJQ0FnYVdROUltMWxkR0ZrWVhSaE16QXlNeUkrRFFvZ0lDQWdQSEprWmpwU1JFWStEUW9nSUNBZ0lDQThZMk02VjI5eWF3MEtJQ0FnSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGcwS0lDQWdJQ0FnSUNBOFpHTTZabTl5YldGMFBtbHRZV2RsTDNOMlp5dDRiV3c4TDJSak9tWnZjbTFoZEQ0TkNpQWdJQ0FnSUNBZ1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lDQWdjbVJtT25KbGMyOTFjbU5sUFNKb2RIUndPaTh2Y0hWeWJDNXZjbWN2WkdNdlpHTnRhWFI1Y0dVdlUzUnBiR3hKYldGblpTSWdMejROQ2lBZ0lDQWdJQ0FnUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK0RRb2dJQ0FnSUNBOEwyTmpPbGR2Y21zK0RRb2dJQ0FnUEM5eVpHWTZVa1JHUGcwS0lDQThMMjFsZEdGa1lYUmhQZzBLSUNBOFpHVm1jdzBLSUNBZ0lDQnBaRDBpWkdWbWN6TXdNakVpSUM4K0RRb2dJRHhuRFFvZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1Tnprek1EYzRNaXd3TERBc01DNDNPVE13TnpneUxDMHlMakUzTURrNE5Td3RPREUwTGpZNU1qazVLU0lOQ2lBZ0lDQWdhV1E5SW1jek1EQTNJajROQ2lBZ0lDQThadzBLSUNBZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1TnpBM01URXNNQzQzTURjeE1Td3RNQzQzTURjeE1Td3dMamN3TnpFeExEY3pOeTQzTURjMU5Td3lPVFV1TkRnNE1EZ3BJZzBLSUNBZ0lDQWdJR2xrUFNKbk16QXdPU0krRFFvZ0lDQWdJQ0E4WncwS0lDQWdJQ0FnSUNBZ2FXUTlJbWN6TnpVMUlqNE5DaUFnSUNBZ0lDQWdQSEJoZEdnTkNpQWdJQ0FnSUNBZ0lDQWdaRDBpVFNBNUxqYzRNVEkxTERBZ1F5QTVMalEzTkRBMU5qSXNNQzQyT0RreE1USWdPUzQxTWpBMk9Dd3hMalV5TXpBNE5UTWdPUzR6TVRJMUxESXVNVGczTlNCTUlEUXVPVE0zTlN3MkxqVTVNemMxSUVNZ015NDVOVGc1TmpBNExEWXVOREk1TkRneklESXVPVFEzTnpVME9DdzJMalV6TWpjNE9Ua2dNaXcyTGpneE1qVWdUQ0ExTGpBek1USTFMRGt1T0RRek56VWdNQzQxTmpJMUxERTBMak14TWpVZ01Dd3hOaUJESURBdU5UWTVNamsyTWpnc01UVXVOemsxTmpJMklERXVNVFkzTnpNM09Dd3hOUzQyTkRBeU16Y2dNUzQzTVRnM05Td3hOUzQwTURZeU5TQk1JRFl1TVRVMk1qVXNNVEF1T1RZNE56VWdPUzR4T0RjMUxERTBJR01nTUM0eU56azJPREl6TEMwd0xqazBOemM0TXlBd0xqTTRNekUxTWpnc0xURXVPVFU0T1RNM0lEQXVNakU0TnpVc0xUSXVPVE0zTlNBeExqVXdNREF4TVN3dE1TNDBPRGsxTnprNElETXVNREF3TURBeExDMHlMamszT1RFMU9TQTBMalVzTFRRdU5EWTROelVnTUM0Mk1ERXhNRElzTFRBdU1ETXhNell4SURFdU9ESXlNVE00TEMwd0xqQTVOakV6TnlBeUxDMHdMalEyT0RjMUlFTWdNVE11T0RjNU9Ea3lMRFF1TURZNU5EZ3dNeUF4TVM0NE5ESTROalVzTWk0d01qQXlNamd5SURrdU56Z3hNalVzTUNCNklnMEtJQ0FnSUNBZ0lDQWdJQ0IwY21GdWMyWnZjbTA5SW0xaGRISnBlQ2d3TGpnNU1UVTVNemMwTEMwd0xqZzVNVFU1TXpjMExEQXVPRGt4TlRrek56UXNNQzQ0T1RFMU9UTTNOQ3d0TWk0eU5qVTFMREV3TXpjdU1UTTBOU2tpRFFvZ0lDQWdJQ0FnSUNBZ0lHbGtQU0p3WVhSb016QXhNU0lOQ2lBZ0lDQWdJQ0FnSUNBZ2MzUjViR1U5SW1acGJHdzZJMlptWm1abVpqdG1hV3hzTFc5d1lXTnBkSGs2TVNJZ0x6NE5DaUFnSUNBZ0lEd3ZaejROQ2lBZ0lDQThMMmMrRFFvZ0lEd3ZaejROQ2p3dmMzWm5QZzBLKSBuby1yZXBlYXQgNTAlOy13ZWJraXQtdHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZX0uZW1vdGUtbWVudSAuaWNvbi1waW46aG92ZXIsLmVtb3RlLW1lbnUucGlubmVkIC5pY29uLXBpbnstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTstbXMtdHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3RyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTtvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLnNjcm9sbGFibGUuZGVmYXVsdC1za2lue3BhZGRpbmctcmlnaHQ6MDtwYWRkaW5nLWJvdHRvbTowfS5lbW90ZS1tZW51IC5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojNTU1O29wYWNpdHk6LjI7ei1pbmRleDoxfVwiKSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgSG9nYW4gPSByZXF1aXJlKCdob2dhbi5qcy9saWIvdGVtcGxhdGUuanMnKTtcbiAgICB2YXIgdGVtcGxhdGVzID0ge307XG4gICAgdGVtcGxhdGVzWydlbW90ZSddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJlbW90ZVxcXCIgZGF0YS1lbW90ZT1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCIgdGl0bGU9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBzdHlsZT1cXFwiYmFja2dyb3VuZC1pbWFnZTogdXJsKFwiKTt0LmIodC50KHQuZChcImltYWdlLnVybFwiLGMscCwwKSkpO3QuYihcIik7IGhlaWdodDogXCIpO3QuYih0LnQodC5kKFwiaW1hZ2UuaGVpZ2h0XCIsYyxwLDApKSk7dC5iKFwicHg7IHdpZHRoOiBcIik7dC5iKHQudCh0LmQoXCJpbWFnZS53aWR0aFwiLGMscCwwKSkpO3QuYihcInB4XFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWydlbW90ZUJ1dHRvbiddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8YnV0dG9uIGNsYXNzPVxcXCJidXR0b24gZ2x5cGgtb25seSBmbG9hdC1sZWZ0XFxcIiB0aXRsZT1cXFwiRW1vdGUgTWVudVxcXCIgaWQ9XFxcImVtb3RlLW1lbnUtYnV0dG9uXFxcIj48L2J1dHRvbj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWydlbW90ZUdyb3VwSGVhZGVyJ10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO2lmKHQucyh0LmYoXCJpc0FkZG9uSGVhZGVyXCIsYyxwLDEpLGMscCwwLDE4LDIxOCxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1oZWFkZXIgYWRkb24tZW1vdGVzLWhlYWRlclxcXCIgdGl0bGU9XFxcIkJlbG93IGFyZSBlbW90ZXMgYWRkZWQgYnkgYW4gYWRkb24uIE9ubHkgdGhvc2Ugd2hvIGFsc28gaGF2ZSB0aGUgc2FtZSBhZGRvbiBpbnN0YWxsZWQgY2FuIHNlZSB0aGVzZSBlbW90ZXMgaW4gY2hhdC5cXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRBZGRvbiBFbW90ZXNcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO30pO2MucG9wKCk7fXQuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO2lmKCF0LnModC5mKFwiaXNBZGRvbkhlYWRlclwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyXFxcIiBkYXRhLWVtb3RlLWNoYW5uZWw9XFxcIlwiKTt0LmIodC52KHQuZihcImNoYW5uZWxcIixjLHAsMCkpKTt0LmIoXCJcXFwiPjxpbWcgc3JjPVxcXCJcIik7dC5iKHQudih0LmYoXCJiYWRnZVwiLGMscCwwKSkpO3QuYihcIlxcXCIgLz5cIik7dC5iKHQudih0LmYoXCJjaGFubmVsXCIsYyxwLDApKSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7fTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snbWVudSddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJlbW90ZS1tZW51IGRyb3BtZW51XFxcIiBpZD1cXFwiZW1vdGUtbWVudS1mb3ItdHdpdGNoXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImRyYWdnYWJsZVxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1oZWFkZXJcXFwiPkFsbCBFbW90ZXM8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImdyb3VwLWNvbnRhaW5lciBzY3JvbGxhYmxlXFxcIiBpZD1cXFwiYWxsLWVtb3Rlcy1ncm91cFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1oZWFkZXJcXFwiPlBvcHVsYXIgRW1vdGVzPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1jb250YWluZXIgc2luZ2xlLXJvd1xcXCIgaWQ9XFxcInBvcHVsYXItZW1vdGVzLWdyb3VwXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImZvb3RlclxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLWxlZnQgaWNvbiBpY29uLWhvbWVcXFwiIGhyZWY9XFxcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXNcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIiB0aXRsZT1cXFwiVmlzaXQgdGhlIGhvbWVwYWdlIHdoZXJlIHlvdSBjYW4gZG9uYXRlLCBwb3N0IGEgcmV2aWV3LCBvciBjb250YWN0IHRoZSBkZXZlbG9wZXJcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGEgY2xhc3M9XFxcInB1bGwtbGVmdCBpY29uIGljb24tcGluXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS1waW5uZWRcXFwiIHRpdGxlPVxcXCJQaW4vdW5waW4gdGhlIGVtb3RlIG1lbnUgdG8gdGhlIHNjcmVlblxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8YSB0aXRsZT1cXFwiUmVzZXQgdGhlIHBvcHVsYXJpdHkgb2YgdGhlIGVtb3RlcyBiYWNrIHRvIGRlZmF1bHRcXFwiIGRhdGEtY29tbWFuZD1cXFwicmVzZXQtcG9wdWxhcml0eVxcXCI+UmVzZXQgUG9wdWxhcml0eTwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGEgY2xhc3M9XFxcInB1bGwtcmlnaHQgaWNvbiBpY29uLXJlc2l6ZS1oYW5kbGVcXFwiIGRhdGEtY29tbWFuZD1cXFwicmVzaXplLWhhbmRsZVxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snbmV3c01lc3NhZ2UnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPGRpdiBjbGFzcz1cXFwidHdpdGNoLWNoYXQtZW1vdGVzLW5ld3NcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0W1wiKTt0LmIodC52KHQuZihcInNjcmlwdE5hbWVcIixjLHAsMCkpKTt0LmIoXCJdIE5ld3M6IFwiKTt0LmIodC50KHQuZihcIm1lc3NhZ2VcIixjLHAsMCkpKTt0LmIoXCIgKDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtY29tbWFuZD1cXFwidHdpdGNoLWNoYXQtZW1vdGVzOmRpc21pc3MtbmV3c1xcXCIgZGF0YS1uZXdzLWlkPVxcXCJcIik7dC5iKHQudih0LmYoXCJpZFwiLGMscCwwKSkpO3QuYihcIlxcXCI+RGlzbWlzczwvYT4pXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHJldHVybiB0ZW1wbGF0ZXM7XG59KSgpOyIsIi8qXG4gKiAgQ29weXJpZ2h0IDIwMTEgVHdpdHRlciwgSW5jLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEhvZ2FuID0ge307XG5cbihmdW5jdGlvbiAoSG9nYW4pIHtcbiAgSG9nYW4uVGVtcGxhdGUgPSBmdW5jdGlvbiAoY29kZU9iaiwgdGV4dCwgY29tcGlsZXIsIG9wdGlvbnMpIHtcbiAgICBjb2RlT2JqID0gY29kZU9iaiB8fCB7fTtcbiAgICB0aGlzLnIgPSBjb2RlT2JqLmNvZGUgfHwgdGhpcy5yO1xuICAgIHRoaXMuYyA9IGNvbXBpbGVyO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy50ZXh0ID0gdGV4dCB8fCAnJztcbiAgICB0aGlzLnBhcnRpYWxzID0gY29kZU9iai5wYXJ0aWFscyB8fCB7fTtcbiAgICB0aGlzLnN1YnMgPSBjb2RlT2JqLnN1YnMgfHwge307XG4gICAgdGhpcy5idWYgPSAnJztcbiAgfVxuXG4gIEhvZ2FuLlRlbXBsYXRlLnByb3RvdHlwZSA9IHtcbiAgICAvLyByZW5kZXI6IHJlcGxhY2VkIGJ5IGdlbmVyYXRlZCBjb2RlLlxuICAgIHI6IGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7IHJldHVybiAnJzsgfSxcblxuICAgIC8vIHZhcmlhYmxlIGVzY2FwaW5nXG4gICAgdjogaG9nYW5Fc2NhcGUsXG5cbiAgICAvLyB0cmlwbGUgc3RhY2hlXG4gICAgdDogY29lcmNlVG9TdHJpbmcsXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5yaShbY29udGV4dF0sIHBhcnRpYWxzIHx8IHt9LCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgaW50ZXJuYWwgLS0gYSBob29rIGZvciBvdmVycmlkZXMgdGhhdCBjYXRjaGVzIHBhcnRpYWxzIHRvb1xuICAgIHJpOiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgcmV0dXJuIHRoaXMucihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gZW5zdXJlUGFydGlhbFxuICAgIGVwOiBmdW5jdGlvbihzeW1ib2wsIHBhcnRpYWxzKSB7XG4gICAgICB2YXIgcGFydGlhbCA9IHRoaXMucGFydGlhbHNbc3ltYm9sXTtcblxuICAgICAgLy8gY2hlY2sgdG8gc2VlIHRoYXQgaWYgd2UndmUgaW5zdGFudGlhdGVkIHRoaXMgcGFydGlhbCBiZWZvcmVcbiAgICAgIHZhciB0ZW1wbGF0ZSA9IHBhcnRpYWxzW3BhcnRpYWwubmFtZV07XG4gICAgICBpZiAocGFydGlhbC5pbnN0YW5jZSAmJiBwYXJ0aWFsLmJhc2UgPT0gdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWwuaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGVtcGxhdGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKCF0aGlzLmMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBjb21waWxlciBhdmFpbGFibGUuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gdGhpcy5jLmNvbXBpbGUodGVtcGxhdGUsIHRoaXMub3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHVzZSB0aGlzIHRvIGNoZWNrIHdoZXRoZXIgdGhlIHBhcnRpYWxzIGRpY3Rpb25hcnkgaGFzIGNoYW5nZWRcbiAgICAgIHRoaXMucGFydGlhbHNbc3ltYm9sXS5iYXNlID0gdGVtcGxhdGU7XG5cbiAgICAgIGlmIChwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGNvbnNpZGVyIHBhcmVudCB0ZW1wbGF0ZSBub3dcbiAgICAgICAgaWYgKCFwYXJ0aWFscy5zdGFja1RleHQpIHBhcnRpYWxzLnN0YWNrVGV4dCA9IHt9O1xuICAgICAgICBmb3IgKGtleSBpbiBwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgICBpZiAoIXBhcnRpYWxzLnN0YWNrVGV4dFtrZXldKSB7XG4gICAgICAgICAgICBwYXJ0aWFscy5zdGFja1RleHRba2V5XSA9ICh0aGlzLmFjdGl2ZVN1YiAhPT0gdW5kZWZpbmVkICYmIHBhcnRpYWxzLnN0YWNrVGV4dFt0aGlzLmFjdGl2ZVN1Yl0pID8gcGFydGlhbHMuc3RhY2tUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgPSBjcmVhdGVTcGVjaWFsaXplZFBhcnRpYWwodGVtcGxhdGUsIHBhcnRpYWwuc3VicywgcGFydGlhbC5wYXJ0aWFscyxcbiAgICAgICAgICB0aGlzLnN0YWNrU3VicywgdGhpcy5zdGFja1BhcnRpYWxzLCBwYXJ0aWFscy5zdGFja1RleHQpO1xuICAgICAgfVxuICAgICAgdGhpcy5wYXJ0aWFsc1tzeW1ib2xdLmluc3RhbmNlID0gdGVtcGxhdGU7XG5cbiAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9LFxuXG4gICAgLy8gdHJpZXMgdG8gZmluZCBhIHBhcnRpYWwgaW4gdGhlIGN1cnJlbnQgc2NvcGUgYW5kIHJlbmRlciBpdFxuICAgIHJwOiBmdW5jdGlvbihzeW1ib2wsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBwYXJ0aWFsID0gdGhpcy5lcChzeW1ib2wsIHBhcnRpYWxzKTtcbiAgICAgIGlmICghcGFydGlhbCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXJ0aWFsLnJpKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgYSBzZWN0aW9uXG4gICAgcnM6IGZ1bmN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCBzZWN0aW9uKSB7XG4gICAgICB2YXIgdGFpbCA9IGNvbnRleHRbY29udGV4dC5sZW5ndGggLSAxXTtcblxuICAgICAgaWYgKCFpc0FycmF5KHRhaWwpKSB7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFpbC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb250ZXh0LnB1c2godGFpbFtpXSk7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICBjb250ZXh0LnBvcCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBtYXliZSBzdGFydCBhIHNlY3Rpb25cbiAgICBzOiBmdW5jdGlvbih2YWwsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKSB7XG4gICAgICB2YXIgcGFzcztcblxuICAgICAgaWYgKGlzQXJyYXkodmFsKSAmJiB2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSB0aGlzLm1zKHZhbCwgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpO1xuICAgICAgfVxuXG4gICAgICBwYXNzID0gISF2YWw7XG5cbiAgICAgIGlmICghaW52ZXJ0ZWQgJiYgcGFzcyAmJiBjdHgpIHtcbiAgICAgICAgY3R4LnB1c2goKHR5cGVvZiB2YWwgPT0gJ29iamVjdCcpID8gdmFsIDogY3R4W2N0eC5sZW5ndGggLSAxXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXNzO1xuICAgIH0sXG5cbiAgICAvLyBmaW5kIHZhbHVlcyB3aXRoIGRvdHRlZCBuYW1lc1xuICAgIGQ6IGZ1bmN0aW9uKGtleSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpIHtcbiAgICAgIHZhciBmb3VuZCxcbiAgICAgICAgICBuYW1lcyA9IGtleS5zcGxpdCgnLicpLFxuICAgICAgICAgIHZhbCA9IHRoaXMuZihuYW1lc1swXSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpLFxuICAgICAgICAgIGRvTW9kZWxHZXQgPSB0aGlzLm9wdGlvbnMubW9kZWxHZXQsXG4gICAgICAgICAgY3ggPSBudWxsO1xuXG4gICAgICBpZiAoa2V5ID09PSAnLicgJiYgaXNBcnJheShjdHhbY3R4Lmxlbmd0aCAtIDJdKSkge1xuICAgICAgICB2YWwgPSBjdHhbY3R4Lmxlbmd0aCAtIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZvdW5kID0gZmluZEluU2NvcGUobmFtZXNbaV0sIHZhbCwgZG9Nb2RlbEdldCk7XG4gICAgICAgICAgaWYgKGZvdW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGN4ID0gdmFsO1xuICAgICAgICAgICAgdmFsID0gZm91bmQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbCA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmV0dXJuRm91bmQgJiYgIXZhbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmV0dXJuRm91bmQgJiYgdHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGN0eC5wdXNoKGN4KTtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgICBjdHgucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIGZpbmQgdmFsdWVzIHdpdGggbm9ybWFsIG5hbWVzXG4gICAgZjogZnVuY3Rpb24oa2V5LCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCkge1xuICAgICAgdmFyIHZhbCA9IGZhbHNlLFxuICAgICAgICAgIHYgPSBudWxsLFxuICAgICAgICAgIGZvdW5kID0gZmFsc2UsXG4gICAgICAgICAgZG9Nb2RlbEdldCA9IHRoaXMub3B0aW9ucy5tb2RlbEdldDtcblxuICAgICAgZm9yICh2YXIgaSA9IGN0eC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICB2ID0gY3R4W2ldO1xuICAgICAgICB2YWwgPSBmaW5kSW5TY29wZShrZXksIHYsIGRvTW9kZWxHZXQpO1xuICAgICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICByZXR1cm4gKHJldHVybkZvdW5kKSA/IGZhbHNlIDogXCJcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXR1cm5Gb3VuZCAmJiB0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICAvLyBoaWdoZXIgb3JkZXIgdGVtcGxhdGVzXG4gICAgbHM6IGZ1bmN0aW9uKGZ1bmMsIGN4LCBwYXJ0aWFscywgdGV4dCwgdGFncykge1xuICAgICAgdmFyIG9sZFRhZ3MgPSB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycztcblxuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSB0YWdzO1xuICAgICAgdGhpcy5iKHRoaXMuY3QoY29lcmNlVG9TdHJpbmcoZnVuYy5jYWxsKGN4LCB0ZXh0KSksIGN4LCBwYXJ0aWFscykpO1xuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSBvbGRUYWdzO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8vIGNvbXBpbGUgdGV4dFxuICAgIGN0OiBmdW5jdGlvbih0ZXh0LCBjeCwgcGFydGlhbHMpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlzYWJsZUxhbWJkYSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xhbWJkYSBmZWF0dXJlcyBkaXNhYmxlZC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmMuY29tcGlsZSh0ZXh0LCB0aGlzLm9wdGlvbnMpLnJlbmRlcihjeCwgcGFydGlhbHMpO1xuICAgIH0sXG5cbiAgICAvLyB0ZW1wbGF0ZSByZXN1bHQgYnVmZmVyaW5nXG4gICAgYjogZnVuY3Rpb24ocykgeyB0aGlzLmJ1ZiArPSBzOyB9LFxuXG4gICAgZmw6IGZ1bmN0aW9uKCkgeyB2YXIgciA9IHRoaXMuYnVmOyB0aGlzLmJ1ZiA9ICcnOyByZXR1cm4gcjsgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHNlY3Rpb25cbiAgICBtczogZnVuY3Rpb24oZnVuYywgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpIHtcbiAgICAgIHZhciB0ZXh0U291cmNlLFxuICAgICAgICAgIGN4ID0gY3R4W2N0eC5sZW5ndGggLSAxXSxcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmNhbGwoY3gpO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmIChpbnZlcnRlZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRleHRTb3VyY2UgPSAodGhpcy5hY3RpdmVTdWIgJiYgdGhpcy5zdWJzVGV4dCAmJiB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSkgPyB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICByZXR1cm4gdGhpcy5scyhyZXN1bHQsIGN4LCBwYXJ0aWFscywgdGV4dFNvdXJjZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCksIHRhZ3MpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHZhcmlhYmxlXG4gICAgbXY6IGZ1bmN0aW9uKGZ1bmMsIGN0eCwgcGFydGlhbHMpIHtcbiAgICAgIHZhciBjeCA9IGN0eFtjdHgubGVuZ3RoIC0gMV07XG4gICAgICB2YXIgcmVzdWx0ID0gZnVuYy5jYWxsKGN4KTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gdGhpcy5jdChjb2VyY2VUb1N0cmluZyhyZXN1bHQuY2FsbChjeCkpLCBjeCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICBzdWI6IGZ1bmN0aW9uKG5hbWUsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBmID0gdGhpcy5zdWJzW25hbWVdO1xuICAgICAgaWYgKGYpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVTdWIgPSBuYW1lO1xuICAgICAgICBmKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzLCBpbmRlbnQpO1xuICAgICAgICB0aGlzLmFjdGl2ZVN1YiA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICB9O1xuXG4gIC8vRmluZCBhIGtleSBpbiBhbiBvYmplY3RcbiAgZnVuY3Rpb24gZmluZEluU2NvcGUoa2V5LCBzY29wZSwgZG9Nb2RlbEdldCkge1xuICAgIHZhciB2YWw7XG5cbiAgICBpZiAoc2NvcGUgJiYgdHlwZW9mIHNjb3BlID09ICdvYmplY3QnKSB7XG5cbiAgICAgIGlmIChzY29wZVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFsID0gc2NvcGVba2V5XTtcblxuICAgICAgLy8gdHJ5IGxvb2t1cCB3aXRoIGdldCBmb3IgYmFja2JvbmUgb3Igc2ltaWxhciBtb2RlbCBkYXRhXG4gICAgICB9IGVsc2UgaWYgKGRvTW9kZWxHZXQgJiYgc2NvcGUuZ2V0ICYmIHR5cGVvZiBzY29wZS5nZXQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSBzY29wZS5nZXQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3BlY2lhbGl6ZWRQYXJ0aWFsKGluc3RhbmNlLCBzdWJzLCBwYXJ0aWFscywgc3RhY2tTdWJzLCBzdGFja1BhcnRpYWxzLCBzdGFja1RleHQpIHtcbiAgICBmdW5jdGlvbiBQYXJ0aWFsVGVtcGxhdGUoKSB7fTtcbiAgICBQYXJ0aWFsVGVtcGxhdGUucHJvdG90eXBlID0gaW5zdGFuY2U7XG4gICAgZnVuY3Rpb24gU3Vic3RpdHV0aW9ucygpIHt9O1xuICAgIFN1YnN0aXR1dGlvbnMucHJvdG90eXBlID0gaW5zdGFuY2Uuc3VicztcbiAgICB2YXIga2V5O1xuICAgIHZhciBwYXJ0aWFsID0gbmV3IFBhcnRpYWxUZW1wbGF0ZSgpO1xuICAgIHBhcnRpYWwuc3VicyA9IG5ldyBTdWJzdGl0dXRpb25zKCk7XG4gICAgcGFydGlhbC5zdWJzVGV4dCA9IHt9OyAgLy9oZWhlLiBzdWJzdGV4dC5cbiAgICBwYXJ0aWFsLmJ1ZiA9ICcnO1xuXG4gICAgc3RhY2tTdWJzID0gc3RhY2tTdWJzIHx8IHt9O1xuICAgIHBhcnRpYWwuc3RhY2tTdWJzID0gc3RhY2tTdWJzO1xuICAgIHBhcnRpYWwuc3Vic1RleHQgPSBzdGFja1RleHQ7XG4gICAgZm9yIChrZXkgaW4gc3Vicykge1xuICAgICAgaWYgKCFzdGFja1N1YnNba2V5XSkgc3RhY2tTdWJzW2tleV0gPSBzdWJzW2tleV07XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHN0YWNrU3Vicykge1xuICAgICAgcGFydGlhbC5zdWJzW2tleV0gPSBzdGFja1N1YnNba2V5XTtcbiAgICB9XG5cbiAgICBzdGFja1BhcnRpYWxzID0gc3RhY2tQYXJ0aWFscyB8fCB7fTtcbiAgICBwYXJ0aWFsLnN0YWNrUGFydGlhbHMgPSBzdGFja1BhcnRpYWxzO1xuICAgIGZvciAoa2V5IGluIHBhcnRpYWxzKSB7XG4gICAgICBpZiAoIXN0YWNrUGFydGlhbHNba2V5XSkgc3RhY2tQYXJ0aWFsc1trZXldID0gcGFydGlhbHNba2V5XTtcbiAgICB9XG4gICAgZm9yIChrZXkgaW4gc3RhY2tQYXJ0aWFscykge1xuICAgICAgcGFydGlhbC5wYXJ0aWFsc1trZXldID0gc3RhY2tQYXJ0aWFsc1trZXldO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJ0aWFsO1xuICB9XG5cbiAgdmFyIHJBbXAgPSAvJi9nLFxuICAgICAgckx0ID0gLzwvZyxcbiAgICAgIHJHdCA9IC8+L2csXG4gICAgICByQXBvcyA9IC9cXCcvZyxcbiAgICAgIHJRdW90ID0gL1xcXCIvZyxcbiAgICAgIGhDaGFycyA9IC9bJjw+XFxcIlxcJ10vO1xuXG4gIGZ1bmN0aW9uIGNvZXJjZVRvU3RyaW5nKHZhbCkge1xuICAgIHJldHVybiBTdHJpbmcoKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHZhbCk7XG4gIH1cblxuICBmdW5jdGlvbiBob2dhbkVzY2FwZShzdHIpIHtcbiAgICBzdHIgPSBjb2VyY2VUb1N0cmluZyhzdHIpO1xuICAgIHJldHVybiBoQ2hhcnMudGVzdChzdHIpID9cbiAgICAgIHN0clxuICAgICAgICAucmVwbGFjZShyQW1wLCAnJmFtcDsnKVxuICAgICAgICAucmVwbGFjZShyTHQsICcmbHQ7JylcbiAgICAgICAgLnJlcGxhY2Uockd0LCAnJmd0OycpXG4gICAgICAgIC5yZXBsYWNlKHJBcG9zLCAnJiMzOTsnKVxuICAgICAgICAucmVwbGFjZShyUXVvdCwgJyZxdW90OycpIDpcbiAgICAgIHN0cjtcbiAgfVxuXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihhKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxufSkodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnID8gZXhwb3J0cyA6IEhvZ2FuKTtcbiIsIihmdW5jdGlvbiAoJCkge1xuXG4gICQuZm4uY3VzdG9tU2Nyb2xsYmFyID0gZnVuY3Rpb24gKG9wdGlvbnMsIGFyZ3MpIHtcblxuICAgIHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIHNraW46IHVuZGVmaW5lZCxcbiAgICAgIGhTY3JvbGw6IHRydWUsXG4gICAgICB2U2Nyb2xsOiB0cnVlLFxuICAgICAgdXBkYXRlT25XaW5kb3dSZXNpemU6IGZhbHNlLFxuICAgICAgYW5pbWF0aW9uU3BlZWQ6IDMwMCxcbiAgICAgIG9uQ3VzdG9tU2Nyb2xsOiB1bmRlZmluZWQsXG4gICAgICBzd2lwZVNwZWVkOiAxLFxuICAgICAgd2hlZWxTcGVlZDogNDAsXG4gICAgICBmaXhlZFRodW1iV2lkdGg6IHVuZGVmaW5lZCxcbiAgICAgIGZpeGVkVGh1bWJIZWlnaHQ6IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIHZhciBTY3JvbGxhYmxlID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgIHRoaXMuYWRkU2Nyb2xsYWJsZUNsYXNzKCk7XG4gICAgICB0aGlzLmFkZFNraW5DbGFzcygpO1xuICAgICAgdGhpcy5hZGRTY3JvbGxCYXJDb21wb25lbnRzKCk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnZTY3JvbGwpXG4gICAgICAgIHRoaXMudlNjcm9sbGJhciA9IG5ldyBTY3JvbGxiYXIodGhpcywgbmV3IFZTaXppbmcoKSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmhTY3JvbGwpXG4gICAgICAgIHRoaXMuaFNjcm9sbGJhciA9IG5ldyBTY3JvbGxiYXIodGhpcywgbmV3IEhTaXppbmcoKSk7XG4gICAgICB0aGlzLiRlbGVtZW50LmRhdGEoXCJzY3JvbGxhYmxlXCIsIHRoaXMpO1xuICAgICAgdGhpcy5pbml0S2V5Ym9hcmRTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH1cblxuICAgIFNjcm9sbGFibGUucHJvdG90eXBlID0ge1xuXG4gICAgICBhZGRTY3JvbGxhYmxlQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKFwic2Nyb2xsYWJsZVwiKSkge1xuICAgICAgICAgIHRoaXMuc2Nyb2xsYWJsZUFkZGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKFwic2Nyb2xsYWJsZVwiKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlU2Nyb2xsYWJsZUNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbGFibGVBZGRlZClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKFwic2Nyb2xsYWJsZVwiKTtcbiAgICAgIH0sXG5cbiAgICAgIGFkZFNraW5DbGFzczogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHlwZW9mKHRoaXMub3B0aW9ucy5za2luKSA9PSBcInN0cmluZ1wiICYmICF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5za2luKSkge1xuICAgICAgICAgIHRoaXMuc2tpbkNsYXNzQWRkZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnNraW4pO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTa2luQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2tpbkNsYXNzQWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuc2tpbik7XG4gICAgICB9LFxuXG4gICAgICBhZGRTY3JvbGxCYXJDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYXNzaWduVmlld1BvcnQoKTtcbiAgICAgICAgaWYgKHRoaXMuJHZpZXdQb3J0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC53cmFwSW5uZXIoXCI8ZGl2IGNsYXNzPVxcXCJ2aWV3cG9ydFxcXCIgLz5cIik7XG4gICAgICAgICAgdGhpcy5hc3NpZ25WaWV3UG9ydCgpO1xuICAgICAgICAgIHRoaXMudmlld1BvcnRBZGRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hc3NpZ25PdmVydmlldygpO1xuICAgICAgICBpZiAodGhpcy4kb3ZlcnZpZXcubGVuZ3RoID09IDApIHtcbiAgICAgICAgICB0aGlzLiR2aWV3UG9ydC53cmFwSW5uZXIoXCI8ZGl2IGNsYXNzPVxcXCJvdmVydmlld1xcXCIgLz5cIik7XG4gICAgICAgICAgdGhpcy5hc3NpZ25PdmVydmlldygpO1xuICAgICAgICAgIHRoaXMub3ZlcnZpZXdBZGRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGRTY3JvbGxCYXIoXCJ2ZXJ0aWNhbFwiLCBcInByZXBlbmRcIik7XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsQmFyKFwiaG9yaXpvbnRhbFwiLCBcImFwcGVuZFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNjcm9sbGJhckNvbXBvbmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxiYXIoXCJ2ZXJ0aWNhbFwiKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxiYXIoXCJob3Jpem9udGFsXCIpO1xuICAgICAgICBpZiAodGhpcy5vdmVydmlld0FkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudW53cmFwKCk7XG4gICAgICAgIGlmICh0aGlzLnZpZXdQb3J0QWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC51bndyYXAoKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNjcm9sbGJhcjogZnVuY3Rpb24gKG9yaWVudGF0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzW29yaWVudGF0aW9uICsgXCJTY3JvbGxiYXJBZGRlZFwiXSlcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LmZpbmQoXCIuc2Nyb2xsLWJhci5cIiArIG9yaWVudGF0aW9uKS5yZW1vdmUoKTtcbiAgICAgIH0sXG5cbiAgICAgIGFzc2lnblZpZXdQb3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJHZpZXdQb3J0ID0gdGhpcy4kZWxlbWVudC5maW5kKFwiLnZpZXdwb3J0XCIpO1xuICAgICAgfSxcblxuICAgICAgYXNzaWduT3ZlcnZpZXc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kb3ZlcnZpZXcgPSB0aGlzLiR2aWV3UG9ydC5maW5kKFwiLm92ZXJ2aWV3XCIpO1xuICAgICAgfSxcblxuICAgICAgYWRkU2Nyb2xsQmFyOiBmdW5jdGlvbiAob3JpZW50YXRpb24sIGZ1bikge1xuICAgICAgICBpZiAodGhpcy4kZWxlbWVudC5maW5kKFwiLnNjcm9sbC1iYXIuXCIgKyBvcmllbnRhdGlvbikubGVuZ3RoID09IDApIHtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50W2Z1bl0oXCI8ZGl2IGNsYXNzPSdzY3JvbGwtYmFyIFwiICsgb3JpZW50YXRpb24gKyBcIic+PGRpdiBjbGFzcz0ndGh1bWInPjwvZGl2PjwvZGl2PlwiKVxuICAgICAgICAgIHRoaXNbb3JpZW50YXRpb24gKyBcIlNjcm9sbGJhckFkZGVkXCJdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVzaXplOiBmdW5jdGlvbiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy52U2Nyb2xsYmFyLnJlc2l6ZShrZWVwUG9zaXRpb24pO1xuICAgICAgICBpZiAodGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMuaFNjcm9sbGJhci5yZXNpemUoa2VlcFBvc2l0aW9uKTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5zY3JvbGxUb0VsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnNjcm9sbFRvRWxlbWVudChlbGVtZW50KTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvWFk6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9YKHgpO1xuICAgICAgICB0aGlzLnNjcm9sbFRvWSh5KTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvWDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIuc2Nyb2xsT3ZlcnZpZXdUbyh4LCB0cnVlKTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvWTogZnVuY3Rpb24gKHkpIHtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIuc2Nyb2xsT3ZlcnZpZXdUbyh5LCB0cnVlKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbGFibGVDbGFzcygpO1xuICAgICAgICB0aGlzLnJlbW92ZVNraW5DbGFzcygpO1xuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbGJhckNvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5kYXRhKFwic2Nyb2xsYWJsZVwiLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVLZXlib2FyZFNjcm9sbGluZygpO1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5yZW1vdmUoKTtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICB9LFxuXG4gICAgICBzZXRBbmltYXRpb25TcGVlZDogZnVuY3Rpb24gKHNwZWVkKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5hbmltYXRpb25TcGVlZCA9IHNwZWVkO1xuICAgICAgfSxcblxuICAgICAgaXNJbnNpZGU6IGZ1bmN0aW9uIChlbGVtZW50LCB3cmFwcGluZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgdmFyICR3cmFwcGluZ0VsZW1lbnQgPSAkKHdyYXBwaW5nRWxlbWVudCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciB3cmFwcGluZ0VsZW1lbnRPZmZzZXQgPSAkd3JhcHBpbmdFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICByZXR1cm4gKGVsZW1lbnRPZmZzZXQudG9wID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3ApICYmIChlbGVtZW50T2Zmc2V0LmxlZnQgPj0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQpICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQudG9wICsgJGVsZW1lbnQuaGVpZ2h0KCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LnRvcCArICR3cmFwcGluZ0VsZW1lbnQuaGVpZ2h0KCkpICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQubGVmdCArICRlbGVtZW50LndpZHRoKCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQgKyAkd3JhcHBpbmdFbGVtZW50LndpZHRoKCkpXG4gICAgICB9LFxuXG4gICAgICBpbml0S2V5Ym9hcmRTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB0aGlzLmVsZW1lbnRLZXlkb3duID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IF90aGlzLiRlbGVtZW50WzBdKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICAgICAgX3RoaXMudlNjcm9sbGJhci5rZXlTY3JvbGwoZXZlbnQpO1xuICAgICAgICAgICAgaWYgKF90aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgICAgIF90aGlzLmhTY3JvbGxiYXIua2V5U2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgICAgLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAgICAgICAua2V5ZG93bih0aGlzLmVsZW1lbnRLZXlkb3duKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUtleWJvYXJkU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgICAucmVtb3ZlQXR0cigndGFiaW5kZXgnKVxuICAgICAgICAgIC51bmJpbmQoXCJrZXlkb3duXCIsIHRoaXMuZWxlbWVudEtleWRvd24pO1xuICAgICAgfSxcblxuICAgICAgYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm9uQ3VzdG9tU2Nyb2xsKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQub24oXCJjdXN0b21TY3JvbGxcIiwgdGhpcy5vcHRpb25zLm9uQ3VzdG9tU2Nyb2xsKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHZhciBTY3JvbGxiYXIgPSBmdW5jdGlvbiAoc2Nyb2xsYWJsZSwgc2l6aW5nKSB7XG4gICAgICB0aGlzLnNjcm9sbGFibGUgPSBzY3JvbGxhYmxlO1xuICAgICAgdGhpcy5zaXppbmcgPSBzaXppbmdcbiAgICAgIHRoaXMuJHNjcm9sbEJhciA9IHRoaXMuc2l6aW5nLnNjcm9sbEJhcih0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQpO1xuICAgICAgdGhpcy4kdGh1bWIgPSB0aGlzLiRzY3JvbGxCYXIuZmluZChcIi50aHVtYlwiKTtcbiAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24oMCwgMCk7XG4gICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgICAgdGhpcy5pbml0TW91c2VNb3ZlU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmluaXRNb3VzZVdoZWVsU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmluaXRUb3VjaFNjcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0TW91c2VDbGlja1Njcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0V2luZG93UmVzaXplKCk7XG4gICAgfVxuXG4gICAgU2Nyb2xsYmFyLnByb3RvdHlwZSA9IHtcblxuICAgICAgcmVzaXplOiBmdW5jdGlvbiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQuaGVpZ2h0KHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudC5oZWlnaHQoKSk7XG4gICAgICAgIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCwgdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQpKTtcbiAgICAgICAgdGhpcy52aWV3UG9ydFNpemUgPSB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQpO1xuICAgICAgICB0aGlzLm92ZXJ2aWV3U2l6ZSA9IHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldyk7XG4gICAgICAgIHRoaXMucmF0aW8gPSB0aGlzLnZpZXdQb3J0U2l6ZSAvIHRoaXMub3ZlcnZpZXdTaXplO1xuICAgICAgICB0aGlzLnNpemluZy5zaXplKHRoaXMuJHNjcm9sbEJhciwgdGhpcy52aWV3UG9ydFNpemUpO1xuICAgICAgICB0aGlzLnRodW1iU2l6ZSA9IHRoaXMuY2FsY3VsYXRlVGh1bWJTaXplKCk7XG4gICAgICAgIHRoaXMuc2l6aW5nLnNpemUodGhpcy4kdGh1bWIsIHRoaXMudGh1bWJTaXplKTtcbiAgICAgICAgdGhpcy5tYXhUaHVtYlBvc2l0aW9uID0gdGhpcy5jYWxjdWxhdGVNYXhUaHVtYlBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMuY2FsY3VsYXRlTWF4T3ZlcnZpZXdQb3NpdGlvbigpO1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSAodGhpcy5vdmVydmlld1NpemUgPiB0aGlzLnZpZXdQb3J0U2l6ZSk7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFBlcmNlbnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSAwLjA7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZWQpXG4gICAgICAgICAgdGhpcy5yZXNjcm9sbChrZWVwUG9zaXRpb24pO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgdGhpcy4kc2Nyb2xsQmFyLnRvZ2dsZSh0aGlzLmVuYWJsZWQpO1xuICAgICAgfSxcblxuICAgICAgY2FsY3VsYXRlVGh1bWJTaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBmaXhlZFNpemUgPSB0aGlzLnNpemluZy5maXhlZFRodW1iU2l6ZSh0aGlzLnNjcm9sbGFibGUub3B0aW9ucylcbiAgICAgICAgdmFyIHNpemU7XG4gICAgICAgIGlmIChmaXhlZFNpemUpXG4gICAgICAgICAgc2l6ZSA9IGZpeGVkU2l6ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNpemUgPSB0aGlzLnJhdGlvICogdGhpcy52aWV3UG9ydFNpemVcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KHNpemUsIHRoaXMuc2l6aW5nLm1pblNpemUodGhpcy4kdGh1bWIpKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy4kdGh1bWIubW91c2Vkb3duKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGlmIChfdGhpcy5lbmFibGVkKVxuICAgICAgICAgICAgX3RoaXMuc3RhcnRNb3VzZU1vdmVTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kb2N1bWVudE1vdXNldXAgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBfdGhpcy5zdG9wTW91c2VNb3ZlU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgfTtcbiAgICAgICAgJChkb2N1bWVudCkubW91c2V1cCh0aGlzLmRvY3VtZW50TW91c2V1cCk7XG4gICAgICAgIHRoaXMuZG9jdW1lbnRNb3VzZW1vdmUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBfdGhpcy5tb3VzZU1vdmVTY3JvbGwoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICAkKGRvY3VtZW50KS5tb3VzZW1vdmUodGhpcy5kb2N1bWVudE1vdXNlbW92ZSk7XG4gICAgICAgIHRoaXMuJHRodW1iLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZU1vdXNlTW92ZVNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiR0aHVtYi51bmJpbmQoKTtcbiAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKFwibW91c2V1cFwiLCB0aGlzLmRvY3VtZW50TW91c2V1cCk7XG4gICAgICAgICQoZG9jdW1lbnQpLnVuYmluZChcIm1vdXNlbW92ZVwiLCB0aGlzLmRvY3VtZW50TW91c2Vtb3ZlKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRNb3VzZVdoZWVsU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudC5tb3VzZXdoZWVsKGZ1bmN0aW9uIChldmVudCwgZGVsdGEsIGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgICAgaWYgKF90aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5tb3VzZVdoZWVsU2Nyb2xsKGRlbHRhWCwgZGVsdGFZKSkge1xuICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlTW91c2VXaGVlbFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQudW5iaW5kKFwibW91c2V3aGVlbFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgdGhpcy5lbGVtZW50VG91Y2hzdGFydCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLmVuYWJsZWQpXG4gICAgICAgICAgICAgIF90aGlzLnN0YXJ0VG91Y2hTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0uYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdGhpcy5lbGVtZW50VG91Y2hzdGFydCk7XG4gICAgICAgICAgdGhpcy5kb2N1bWVudFRvdWNobW92ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgX3RoaXMudG91Y2hTY3JvbGwoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIHRoaXMuZG9jdW1lbnRUb3VjaG1vdmUpO1xuICAgICAgICAgIHRoaXMuZWxlbWVudFRvdWNoZW5kID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBfdGhpcy5zdG9wVG91Y2hTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0uYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRoaXMuZWxlbWVudFRvdWNoZW5kKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlVG91Y2hTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdGhpcy5lbGVtZW50VG91Y2hzdGFydCk7XG4gICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLmRvY3VtZW50VG91Y2htb3ZlKTtcbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRoaXMuZWxlbWVudFRvdWNoZW5kKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaW5pdE1vdXNlQ2xpY2tTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5zY3JvbGxCYXJDbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIF90aGlzLm1vdXNlQ2xpY2tTY3JvbGwoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLiRzY3JvbGxCYXIuY2xpY2sodGhpcy5zY3JvbGxCYXJDbGljayk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVNb3VzZUNsaWNrU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJHNjcm9sbEJhci51bmJpbmQoXCJjbGlja1wiLCB0aGlzLnNjcm9sbEJhckNsaWNrKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRXaW5kb3dSZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLnVwZGF0ZU9uV2luZG93UmVzaXplKSB7XG4gICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICB0aGlzLndpbmRvd1Jlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLnJlc2l6ZSgpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZSh0aGlzLndpbmRvd1Jlc2l6ZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVdpbmRvd1Jlc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHdpbmRvdykudW5iaW5kKFwicmVzaXplXCIsIHRoaXMud2luZG93UmVzaXplKTtcbiAgICAgIH0sXG5cbiAgICAgIGlzS2V5U2Nyb2xsaW5nOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmtleVNjcm9sbERlbHRhKGtleSkgIT0gbnVsbDtcbiAgICAgIH0sXG5cbiAgICAgIGtleVNjcm9sbERlbHRhOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGZvciAodmFyIHNjcm9sbGluZ0tleSBpbiB0aGlzLnNpemluZy5zY3JvbGxpbmdLZXlzKVxuICAgICAgICAgIGlmIChzY3JvbGxpbmdLZXkgPT0ga2V5KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2l6aW5nLnNjcm9sbGluZ0tleXNba2V5XSh0aGlzLnZpZXdQb3J0U2l6ZSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSxcblxuICAgICAgc3RhcnRNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0aGlzLm1vdXNlTW92ZVNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICQoXCJodG1sXCIpLmFkZENsYXNzKFwibm90LXNlbGVjdGFibGVcIik7XG4gICAgICAgIHRoaXMuc2V0VW5zZWxlY3RhYmxlKCQoXCJodG1sXCIpLCBcIm9uXCIpO1xuICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50KTtcbiAgICAgIH0sXG5cbiAgICAgIHN0b3BNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0aGlzLm1vdXNlTW92ZVNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAkKFwiaHRtbFwiKS5yZW1vdmVDbGFzcyhcIm5vdC1zZWxlY3RhYmxlXCIpO1xuICAgICAgICB0aGlzLnNldFVuc2VsZWN0YWJsZSgkKFwiaHRtbFwiKSwgbnVsbCk7XG4gICAgICB9LFxuXG4gICAgICBzZXRVbnNlbGVjdGFibGU6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZSkge1xuICAgICAgICBpZiAoZWxlbWVudC5hdHRyKFwidW5zZWxlY3RhYmxlXCIpICE9IHZhbHVlKSB7XG4gICAgICAgICAgZWxlbWVudC5hdHRyKFwidW5zZWxlY3RhYmxlXCIsIHZhbHVlKTtcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJzpub3QoaW5wdXQpJykuYXR0cigndW5zZWxlY3RhYmxlJywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBtb3VzZU1vdmVTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAodGhpcy5tb3VzZU1vdmVTY3JvbGxpbmcpIHtcbiAgICAgICAgICB2YXIgZGVsdGEgPSB0aGlzLnNpemluZy5tb3VzZURlbHRhKHRoaXMuc2Nyb2xsRXZlbnQsIGV2ZW50KTtcbiAgICAgICAgICB0aGlzLnNjcm9sbFRodW1iQnkoZGVsdGEpO1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsRXZlbnQoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBzdGFydFRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsRXZlbnQoZXZlbnQudG91Y2hlc1swXSk7XG4gICAgICAgICAgdGhpcy50b3VjaFNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHRvdWNoU2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudG91Y2hTY3JvbGxpbmcgJiYgZXZlbnQudG91Y2hlcyAmJiBldmVudC50b3VjaGVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgdmFyIGRlbHRhID0gLXRoaXMuc2l6aW5nLm1vdXNlRGVsdGEodGhpcy5zY3JvbGxFdmVudCwgZXZlbnQudG91Y2hlc1swXSkgKiB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy5zd2lwZVNwZWVkO1xuICAgICAgICAgIHZhciBzY3JvbGxlZCA9IHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeShkZWx0YSk7XG4gICAgICAgICAgaWYgKHNjcm9sbGVkKSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50LnRvdWNoZXNbMF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc3RvcFRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy50b3VjaFNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlV2hlZWxTY3JvbGw6IGZ1bmN0aW9uIChkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICB2YXIgZGVsdGEgPSAtdGhpcy5zaXppbmcud2hlZWxEZWx0YShkZWx0YVgsIGRlbHRhWSkgKiB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy53aGVlbFNwZWVkO1xuICAgICAgICBpZiAoZGVsdGEgIT0gMClcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxPdmVydmlld0J5KGRlbHRhKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlQ2xpY2tTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgZGVsdGEgPSB0aGlzLnZpZXdQb3J0U2l6ZSAtIDIwO1xuICAgICAgICBpZiAoZXZlbnRbXCJwYWdlXCIgKyB0aGlzLnNpemluZy5zY3JvbGxBeGlzKCldIDwgdGhpcy4kdGh1bWIub2Zmc2V0KClbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldKVxuICAgICAgICAvLyBtb3VzZSBjbGljayBvdmVyIHRodW1iXG4gICAgICAgICAgZGVsdGEgPSAtZGVsdGE7XG4gICAgICAgIHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeShkZWx0YSk7XG4gICAgICB9LFxuXG4gICAgICBrZXlTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIga2V5RG93biA9IGV2ZW50LndoaWNoO1xuICAgICAgICBpZiAodGhpcy5lbmFibGVkICYmIHRoaXMuaXNLZXlTY3JvbGxpbmcoa2V5RG93bikpIHtcbiAgICAgICAgICBpZiAodGhpcy5zY3JvbGxPdmVydmlld0J5KHRoaXMua2V5U2Nyb2xsRGVsdGEoa2V5RG93bikpKVxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVGh1bWJCeTogZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy50aHVtYlBvc2l0aW9uKCk7XG4gICAgICAgIHRodW1iUG9zaXRpb24gKz0gZGVsdGE7XG4gICAgICAgIHRodW1iUG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uT3JNYXgodGh1bWJQb3NpdGlvbiwgdGhpcy5tYXhUaHVtYlBvc2l0aW9uKTtcbiAgICAgICAgdmFyIG9sZFNjcm9sbFBlcmNlbnQgPSB0aGlzLnNjcm9sbFBlcmNlbnQ7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IHRodW1iUG9zaXRpb24gLyB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gKHRodW1iUG9zaXRpb24gKiB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24pIC8gdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICBpZiAob2xkU2Nyb2xsUGVyY2VudCAhPSB0aGlzLnNjcm9sbFBlcmNlbnQpIHtcbiAgICAgICAgICB0aGlzLnRyaWdnZXJDdXN0b21TY3JvbGwob2xkU2Nyb2xsUGVyY2VudCk7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcblxuICAgICAgdGh1bWJQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kdGh1bWIucG9zaXRpb24oKVt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV07XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxPdmVydmlld0J5OiBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICAgICAgdmFyIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLm92ZXJ2aWV3UG9zaXRpb24oKSArIGRlbHRhO1xuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxPdmVydmlld1RvKG92ZXJ2aWV3UG9zaXRpb24sIGZhbHNlKTtcbiAgICAgIH0sXG5cbiAgICAgIG92ZXJ2aWV3UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIC10aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3LnBvc2l0aW9uKClbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsT3ZlcnZpZXdUbzogZnVuY3Rpb24gKG92ZXJ2aWV3UG9zaXRpb24sIGFuaW1hdGUpIHtcbiAgICAgICAgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25Pck1heChvdmVydmlld1Bvc2l0aW9uLCB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24pO1xuICAgICAgICB2YXIgb2xkU2Nyb2xsUGVyY2VudCA9IHRoaXMuc2Nyb2xsUGVyY2VudDtcbiAgICAgICAgdGhpcy5zY3JvbGxQZXJjZW50ID0gb3ZlcnZpZXdQb3NpdGlvbiAvIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbjtcbiAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgIGlmIChhbmltYXRlKVxuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb25XaXRoQW5pbWF0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgaWYgKG9sZFNjcm9sbFBlcmNlbnQgIT0gdGhpcy5zY3JvbGxQZXJjZW50KSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tU2Nyb2xsKG9sZFNjcm9sbFBlcmNlbnQpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuXG4gICAgICBwb3NpdGlvbk9yTWF4OiBmdW5jdGlvbiAocCwgbWF4KSB7XG4gICAgICAgIGlmIChwIDwgMClcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgZWxzZSBpZiAocCA+IG1heClcbiAgICAgICAgICByZXR1cm4gbWF4O1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIHA7XG4gICAgICB9LFxuXG4gICAgICB0cmlnZ2VyQ3VzdG9tU2Nyb2xsOiBmdW5jdGlvbiAob2xkU2Nyb2xsUGVyY2VudCkge1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQudHJpZ2dlcihcImN1c3RvbVNjcm9sbFwiLCB7XG4gICAgICAgICAgICBzY3JvbGxBeGlzOiB0aGlzLnNpemluZy5zY3JvbGxBeGlzKCksXG4gICAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuc2l6aW5nLnNjcm9sbERpcmVjdGlvbihvbGRTY3JvbGxQZXJjZW50LCB0aGlzLnNjcm9sbFBlcmNlbnQpLFxuICAgICAgICAgICAgc2Nyb2xsUGVyY2VudDogdGhpcy5zY3JvbGxQZXJjZW50ICogMTAwXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSxcblxuICAgICAgcmVzY3JvbGw6IGZ1bmN0aW9uIChrZWVwUG9zaXRpb24pIHtcbiAgICAgICAgaWYgKGtlZXBQb3NpdGlvbikge1xuICAgICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gdGhpcy5wb3NpdGlvbk9yTWF4KHRoaXMub3ZlcnZpZXdQb3NpdGlvbigpLCB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24pO1xuICAgICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IG92ZXJ2aWV3UG9zaXRpb24gLyB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb247XG4gICAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB2YXIgdGh1bWJQb3NpdGlvbiA9IHRoaXMuc2Nyb2xsUGVyY2VudCAqIHRoaXMubWF4VGh1bWJQb3NpdGlvbjtcbiAgICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMuc2Nyb2xsUGVyY2VudCAqIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbjtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBzZXRTY3JvbGxQb3NpdGlvbjogZnVuY3Rpb24gKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy4kdGh1bWIuY3NzKHRoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpLCB0aHVtYlBvc2l0aW9uICsgXCJweFwiKTtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldy5jc3ModGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCksIC1vdmVydmlld1Bvc2l0aW9uICsgXCJweFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIHNldFNjcm9sbFBvc2l0aW9uV2l0aEFuaW1hdGlvbjogZnVuY3Rpb24gKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pIHtcbiAgICAgICAgdmFyIHRodW1iQW5pbWF0aW9uT3B0cyA9IHt9O1xuICAgICAgICB2YXIgb3ZlcnZpZXdBbmltYXRpb25PcHRzID0ge307XG4gICAgICAgIHRodW1iQW5pbWF0aW9uT3B0c1t0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0gPSB0aHVtYlBvc2l0aW9uICsgXCJweFwiO1xuICAgICAgICB0aGlzLiR0aHVtYi5hbmltYXRlKHRodW1iQW5pbWF0aW9uT3B0cywgdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMuYW5pbWF0aW9uU3BlZWQpO1xuICAgICAgICBvdmVydmlld0FuaW1hdGlvbk9wdHNbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldID0gLW92ZXJ2aWV3UG9zaXRpb24gKyBcInB4XCI7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcuYW5pbWF0ZShvdmVydmlld0FuaW1hdGlvbk9wdHMsIHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLmFuaW1hdGlvblNwZWVkKTtcbiAgICAgIH0sXG5cbiAgICAgIGNhbGN1bGF0ZU1heFRodW1iUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6aW5nLnNpemUodGhpcy4kc2Nyb2xsQmFyKSAtIHRoaXMudGh1bWJTaXplO1xuICAgICAgfSxcblxuICAgICAgY2FsY3VsYXRlTWF4T3ZlcnZpZXdQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3KSAtIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCk7XG4gICAgICB9LFxuXG4gICAgICBzZXRTY3JvbGxFdmVudDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBhdHRyID0gXCJwYWdlXCIgKyB0aGlzLnNpemluZy5zY3JvbGxBeGlzKCk7XG4gICAgICAgIGlmICghdGhpcy5zY3JvbGxFdmVudCB8fCB0aGlzLnNjcm9sbEV2ZW50W2F0dHJdICE9IGV2ZW50W2F0dHJdKVxuICAgICAgICAgIHRoaXMuc2Nyb2xsRXZlbnQgPSB7cGFnZVg6IGV2ZW50LnBhZ2VYLCBwYWdlWTogZXZlbnQucGFnZVl9O1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVG9FbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgICBpZiAodGhpcy5zaXppbmcuaXNJbnNpZGUoJGVsZW1lbnQsIHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcpICYmICF0aGlzLnNpemluZy5pc0luc2lkZSgkZWxlbWVudCwgdGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCkpIHtcbiAgICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICAgIHZhciBvdmVydmlld09mZnNldCA9IHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcub2Zmc2V0KCk7XG4gICAgICAgICAgdmFyIHZpZXdQb3J0T2Zmc2V0ID0gdGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydC5vZmZzZXQoKTtcbiAgICAgICAgICB0aGlzLnNjcm9sbE92ZXJ2aWV3VG8oZWxlbWVudE9mZnNldFt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0gLSBvdmVydmlld09mZnNldFt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0sIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVNb3VzZU1vdmVTY3JvbGxpbmcoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVNb3VzZVdoZWVsU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlVG91Y2hTY3JvbGxpbmcoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVNb3VzZUNsaWNrU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlV2luZG93UmVzaXplKCk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgSFNpemluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9XG5cbiAgICBIU2l6aW5nLnByb3RvdHlwZSA9IHtcbiAgICAgIHNpemU6IGZ1bmN0aW9uICgkZWwsIGFyZykge1xuICAgICAgICBpZiAoYXJnKVxuICAgICAgICAgIHJldHVybiAkZWwud2lkdGgoYXJnKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkZWwud2lkdGgoKTtcbiAgICAgIH0sXG5cbiAgICAgIG1pblNpemU6IGZ1bmN0aW9uICgkZWwpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KCRlbC5jc3MoXCJtaW4td2lkdGhcIikpIHx8IDA7XG4gICAgICB9LFxuXG4gICAgICBmaXhlZFRodW1iU2l6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZml4ZWRUaHVtYldpZHRoO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsQmFyOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiAkZWwuZmluZChcIi5zY3JvbGwtYmFyLmhvcml6b250YWxcIik7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZURlbHRhOiBmdW5jdGlvbiAoZXZlbnQxLCBldmVudDIpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50Mi5wYWdlWCAtIGV2ZW50MS5wYWdlWDtcbiAgICAgIH0sXG5cbiAgICAgIG9mZnNldENvbXBvbmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJsZWZ0XCI7XG4gICAgICB9LFxuXG4gICAgICB3aGVlbERlbHRhOiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgcmV0dXJuIGRlbHRhWDtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEF4aXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWFwiO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsRGlyZWN0aW9uOiBmdW5jdGlvbiAob2xkUGVyY2VudCwgbmV3UGVyY2VudCkge1xuICAgICAgICByZXR1cm4gb2xkUGVyY2VudCA8IG5ld1BlcmNlbnQgPyBcInJpZ2h0XCIgOiBcImxlZnRcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbGluZ0tleXM6IHtcbiAgICAgICAgMzc6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gLTEwOyAvL2Fycm93IGxlZnRcbiAgICAgICAgfSxcbiAgICAgICAgMzk6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gMTA7IC8vYXJyb3cgcmlnaHRcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaXNJbnNpZGU6IGZ1bmN0aW9uIChlbGVtZW50LCB3cmFwcGluZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgdmFyICR3cmFwcGluZ0VsZW1lbnQgPSAkKHdyYXBwaW5nRWxlbWVudCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciB3cmFwcGluZ0VsZW1lbnRPZmZzZXQgPSAkd3JhcHBpbmdFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICByZXR1cm4gKGVsZW1lbnRPZmZzZXQubGVmdCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQubGVmdCkgJiZcbiAgICAgICAgICAoZWxlbWVudE9mZnNldC5sZWZ0ICsgJGVsZW1lbnQud2lkdGgoKSA8PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQubGVmdCArICR3cmFwcGluZ0VsZW1lbnQud2lkdGgoKSk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgVlNpemluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9XG5cbiAgICBWU2l6aW5nLnByb3RvdHlwZSA9IHtcblxuICAgICAgc2l6ZTogZnVuY3Rpb24gKCRlbCwgYXJnKSB7XG4gICAgICAgIGlmIChhcmcpXG4gICAgICAgICAgcmV0dXJuICRlbC5oZWlnaHQoYXJnKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkZWwuaGVpZ2h0KCk7XG4gICAgICB9LFxuXG4gICAgICBtaW5TaXplOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludCgkZWwuY3NzKFwibWluLWhlaWdodFwiKSkgfHwgMDtcbiAgICAgIH0sXG5cbiAgICAgIGZpeGVkVGh1bWJTaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5maXhlZFRodW1iSGVpZ2h0O1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsQmFyOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiAkZWwuZmluZChcIi5zY3JvbGwtYmFyLnZlcnRpY2FsXCIpO1xuICAgICAgfSxcblxuICAgICAgbW91c2VEZWx0YTogZnVuY3Rpb24gKGV2ZW50MSwgZXZlbnQyKSB7XG4gICAgICAgIHJldHVybiBldmVudDIucGFnZVkgLSBldmVudDEucGFnZVk7XG4gICAgICB9LFxuXG4gICAgICBvZmZzZXRDb21wb25lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwidG9wXCI7XG4gICAgICB9LFxuXG4gICAgICB3aGVlbERlbHRhOiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgcmV0dXJuIGRlbHRhWTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEF4aXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWVwiO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsRGlyZWN0aW9uOiBmdW5jdGlvbiAob2xkUGVyY2VudCwgbmV3UGVyY2VudCkge1xuICAgICAgICByZXR1cm4gb2xkUGVyY2VudCA8IG5ld1BlcmNlbnQgPyBcImRvd25cIiA6IFwidXBcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbGluZ0tleXM6IHtcbiAgICAgICAgMzg6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gLTEwOyAvL2Fycm93IHVwXG4gICAgICAgIH0sXG4gICAgICAgIDQwOiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIDEwOyAvL2Fycm93IGRvd25cbiAgICAgICAgfSxcbiAgICAgICAgMzM6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gLSh2aWV3UG9ydFNpemUgLSAyMCk7IC8vcGFnZSB1cFxuICAgICAgICB9LFxuICAgICAgICAzNDogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiB2aWV3UG9ydFNpemUgLSAyMDsgLy9wYWdlIGRvd25cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaXNJbnNpZGU6IGZ1bmN0aW9uIChlbGVtZW50LCB3cmFwcGluZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgdmFyICR3cmFwcGluZ0VsZW1lbnQgPSAkKHdyYXBwaW5nRWxlbWVudCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciB3cmFwcGluZ0VsZW1lbnRPZmZzZXQgPSAkd3JhcHBpbmdFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICByZXR1cm4gKGVsZW1lbnRPZmZzZXQudG9wID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3ApICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQudG9wICsgJGVsZW1lbnQuaGVpZ2h0KCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LnRvcCArICR3cmFwcGluZ0VsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSB1bmRlZmluZWQpXG4gICAgICAgIG9wdGlvbnMgPSBkZWZhdWx0T3B0aW9ucztcbiAgICAgIGlmICh0eXBlb2Yob3B0aW9ucykgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB2YXIgc2Nyb2xsYWJsZSA9ICQodGhpcykuZGF0YShcInNjcm9sbGFibGVcIik7XG4gICAgICAgIGlmIChzY3JvbGxhYmxlKVxuICAgICAgICAgIHNjcm9sbGFibGVbb3B0aW9uc10oYXJncyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2Yob3B0aW9ucykgPT0gXCJvYmplY3RcIikge1xuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICBuZXcgU2Nyb2xsYWJsZSgkKHRoaXMpLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgXCJJbnZhbGlkIHR5cGUgb2Ygb3B0aW9uc1wiO1xuICAgIH0pO1xuXG4gIH1cbiAgO1xuXG59KVxuICAoalF1ZXJ5KTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgdmFyIHR5cGVzID0gWydET01Nb3VzZVNjcm9sbCcsICdtb3VzZXdoZWVsJ107XG5cbiAgaWYgKCQuZXZlbnQuZml4SG9va3MpIHtcbiAgICBmb3IgKHZhciBpID0gdHlwZXMubGVuZ3RoOyBpOykge1xuICAgICAgJC5ldmVudC5maXhIb29rc1sgdHlwZXNbLS1pXSBdID0gJC5ldmVudC5tb3VzZUhvb2tzO1xuICAgIH1cbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5tb3VzZXdoZWVsID0ge1xuICAgIHNldHVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSB0eXBlcy5sZW5ndGg7IGk7KSB7XG4gICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHR5cGVzWy0taV0sIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vbm1vdXNld2hlZWwgPSBoYW5kbGVyO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB0ZWFyZG93bjogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBmb3IgKHZhciBpID0gdHlwZXMubGVuZ3RoOyBpOykge1xuICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlc1stLWldLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25tb3VzZXdoZWVsID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJC5mbi5leHRlbmQoe1xuICAgIG1vdXNld2hlZWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgcmV0dXJuIGZuID8gdGhpcy5iaW5kKFwibW91c2V3aGVlbFwiLCBmbikgOiB0aGlzLnRyaWdnZXIoXCJtb3VzZXdoZWVsXCIpO1xuICAgIH0sXG5cbiAgICB1bm1vdXNld2hlZWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgcmV0dXJuIHRoaXMudW5iaW5kKFwibW91c2V3aGVlbFwiLCBmbik7XG4gICAgfVxuICB9KTtcblxuXG4gIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcbiAgICB2YXIgb3JnRXZlbnQgPSBldmVudCB8fCB3aW5kb3cuZXZlbnQsIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGRlbHRhID0gMCwgcmV0dXJuVmFsdWUgPSB0cnVlLCBkZWx0YVggPSAwLCBkZWx0YVkgPSAwO1xuICAgIGV2ZW50ID0gJC5ldmVudC5maXgob3JnRXZlbnQpO1xuICAgIGV2ZW50LnR5cGUgPSBcIm1vdXNld2hlZWxcIjtcblxuICAgIC8vIE9sZCBzY2hvb2wgc2Nyb2xsd2hlZWwgZGVsdGFcbiAgICBpZiAob3JnRXZlbnQud2hlZWxEZWx0YSkge1xuICAgICAgZGVsdGEgPSBvcmdFdmVudC53aGVlbERlbHRhIC8gMTIwO1xuICAgIH1cbiAgICBpZiAob3JnRXZlbnQuZGV0YWlsKSB7XG4gICAgICBkZWx0YSA9IC1vcmdFdmVudC5kZXRhaWwgLyAzO1xuICAgIH1cblxuICAgIC8vIE5ldyBzY2hvb2wgbXVsdGlkaW1lbnNpb25hbCBzY3JvbGwgKHRvdWNocGFkcykgZGVsdGFzXG4gICAgZGVsdGFZID0gZGVsdGE7XG5cbiAgICAvLyBHZWNrb1xuICAgIGlmIChvcmdFdmVudC5heGlzICE9PSB1bmRlZmluZWQgJiYgb3JnRXZlbnQuYXhpcyA9PT0gb3JnRXZlbnQuSE9SSVpPTlRBTF9BWElTKSB7XG4gICAgICBkZWx0YVkgPSAwO1xuICAgICAgZGVsdGFYID0gZGVsdGE7XG4gICAgfVxuXG4gICAgLy8gV2Via2l0XG4gICAgaWYgKG9yZ0V2ZW50LndoZWVsRGVsdGFZICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlbHRhWSA9IG9yZ0V2ZW50LndoZWVsRGVsdGFZIC8gMTIwO1xuICAgIH1cbiAgICBpZiAob3JnRXZlbnQud2hlZWxEZWx0YVggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZGVsdGFYID0gb3JnRXZlbnQud2hlZWxEZWx0YVggLyAxMjA7XG4gICAgfVxuXG4gICAgLy8gQWRkIGV2ZW50IGFuZCBkZWx0YSB0byB0aGUgZnJvbnQgb2YgdGhlIGFyZ3VtZW50c1xuICAgIGFyZ3MudW5zaGlmdChldmVudCwgZGVsdGEsIGRlbHRhWCwgZGVsdGFZKTtcblxuICAgIHJldHVybiAoJC5ldmVudC5kaXNwYXRjaCB8fCAkLmV2ZW50LmhhbmRsZSkuYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxufSkoalF1ZXJ5KTtcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuXHRcIm5hbWVcIjogXCJ0d2l0Y2gtY2hhdC1lbW90ZXNcIixcclxuXHRcInZlcnNpb25cIjogXCIwLjYuNFwiLFxyXG5cdFwiaG9tZXBhZ2VcIjogXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL1wiLFxyXG5cdFwiYnVnc1wiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9pc3N1ZXNcIixcclxuXHRcImF1dGhvclwiOiBcIlJ5YW4gQ2hhdGhhbSA8cnlhbi5iLmNoYXRoYW1AZ21haWwuY29tPiAoaHR0cHM6Ly9naXRodWIuY29tL2NsZXR1c2MpXCIsXHJcblx0XCJyZXBvc2l0b3J5XCI6IHtcclxuXHRcdFwidHlwZVwiOiBcImdpdFwiLFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMuZ2l0XCJcclxuXHR9LFxyXG5cdFwidXNlcnNjcmlwdFwiOiB7XHJcblx0XHRcIm5hbWVcIjogXCJUd2l0Y2ggQ2hhdCBFbW90ZXNcIixcclxuXHRcdFwibmFtZXNwYWNlXCI6IFwiI0NsZXR1c1wiLFxyXG5cdFx0XCJ2ZXJzaW9uXCI6IFwie3t7cGtnLnZlcnNpb259fX1cIixcclxuXHRcdFwiZGVzY3JpcHRpb25cIjogXCJBZGRzIGEgYnV0dG9uIHRvIFR3aXRjaCB0aGF0IGFsbG93cyB5b3UgdG8gXFxcImNsaWNrLXRvLWluc2VydFxcXCIgYW4gZW1vdGUuXCIsXHJcblx0XHRcImNvcHlyaWdodFwiOiBcIjIwMTErLCB7e3twa2cuYXV0aG9yfX19XCIsXHJcblx0XHRcImF1dGhvclwiOiBcInt7e3BrZy5hdXRob3J9fX1cIixcclxuXHRcdFwiaWNvblwiOiBcImh0dHA6Ly93d3cuZ3JhdmF0YXIuY29tL2F2YXRhci5waHA/Z3JhdmF0YXJfaWQ9Njg3NWU4M2FhNmM1NjM3OTBjYjJkYTkxNGFhYmE4YjMmcj1QRyZzPTQ4JmRlZmF1bHQ9aWRlbnRpY29uXCIsXHJcblx0XHRcImxpY2Vuc2VcIjogW1xyXG5cdFx0XHRcIk1JVDsgaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFwiLFxyXG5cdFx0XHRcIkNDIEJZLU5DLVNBIDMuMDsgaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktbmMtc2EvMy4wL1wiXHJcblx0XHRdLFxyXG5cdFx0XCJob21lcGFnZVwiOiBcInt7e3BrZy5ob21lcGFnZX19fVwiLFxyXG5cdFx0XCJzdXBwb3J0VVJMXCI6IFwie3t7cGtnLmJ1Z3N9fX1cIixcclxuXHRcdFwiY29udHJpYnV0aW9uVVJMXCI6IFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy8jZG9uYXRlXCIsXHJcblx0XHRcImdyYW50XCI6IFwibm9uZVwiLFxyXG5cdFx0XCJpbmNsdWRlXCI6IFwiaHR0cDovLyoudHdpdGNoLnR2LypcIixcclxuXHRcdFwiZXhjbHVkZVwiOiBbXHJcblx0XHRcdFwiaHR0cDovL2FwaS50d2l0Y2gudHYvKlwiLFxyXG5cdFx0XHRcImh0dHA6Ly9jaGF0ZGVwb3QudHdpdGNoLnR2LypcIixcclxuXHRcdFx0XCJodHRwOi8vKi50d2l0Y2gudHYvKi9wcm9maWxlKlwiXHJcblx0XHRdXHJcblx0fSxcclxuXHRcInNjcmlwdHNcIjoge1xyXG5cdFx0XCJpbnN0YWxsXCI6IFwibmFwYVwiXHJcblx0fSxcclxuXHRcImRldkRlcGVuZGVuY2llc1wiOiB7XHJcblx0XHRcImJyb3dzZXItc3luY1wiOiBcIl4xLjMuMlwiLFxyXG5cdFx0XCJicm93c2VyaWZ5XCI6IFwiXjUuOS4xXCIsXHJcblx0XHRcImd1bHBcIjogXCJeMy44LjNcIixcclxuXHRcdFwiZ3VscC1hdXRvcHJlZml4ZXJcIjogXCIwLjAuOFwiLFxyXG5cdFx0XCJndWxwLWJlYXV0aWZ5XCI6IFwiMS4xLjBcIixcclxuXHRcdFwiZ3VscC1jaGFuZ2VkXCI6IFwiXjAuNC4xXCIsXHJcblx0XHRcImd1bHAtY29uY2F0XCI6IFwiXjIuMi4wXCIsXHJcblx0XHRcImd1bHAtY29uZmxpY3RcIjogXCJeMC4xLjJcIixcclxuXHRcdFwiZ3VscC1jc3MtYmFzZTY0XCI6IFwiXjEuMS4wXCIsXHJcblx0XHRcImd1bHAtY3NzMmpzXCI6IFwiXjEuMC4yXCIsXHJcblx0XHRcImd1bHAtaGVhZGVyXCI6IFwiXjEuMC4yXCIsXHJcblx0XHRcImd1bHAtaG9nYW4tY29tcGlsZVwiOiBcIl4wLjIuMVwiLFxyXG5cdFx0XCJndWxwLW1pbmlmeS1jc3NcIjogXCJeMC4zLjVcIixcclxuXHRcdFwiZ3VscC1ub3RpZnlcIjogXCJeMS40LjFcIixcclxuXHRcdFwiZ3VscC1yZW5hbWVcIjogXCJeMS4yLjBcIixcclxuXHRcdFwiZ3VscC11Z2xpZnlcIjogXCJeMC4zLjFcIixcclxuXHRcdFwiZ3VscC11dGlsXCI6IFwiXjMuMC4wXCIsXHJcblx0XHRcImhvZ2FuLmpzXCI6IFwiXjMuMC4yXCIsXHJcblx0XHRcImpxdWVyeS11aVwiOiBcIl4xLjEwLjVcIixcclxuXHRcdFwibmFwYVwiOiBcIl4wLjQuMVwiLFxyXG5cdFx0XCJwcmV0dHktaHJ0aW1lXCI6IFwiXjAuMi4xXCIsXHJcblx0XHRcInZpbnlsLW1hcFwiOiBcIl4xLjAuMVwiLFxyXG5cdFx0XCJ2aW55bC1zb3VyY2Utc3RyZWFtXCI6IFwiXjAuMS4xXCIsXHJcblx0XHRcIndhdGNoaWZ5XCI6IFwiXjEuMC4xXCJcclxuXHR9LFxyXG5cdFwibmFwYVwiOiB7XHJcblx0XHRcImpxdWVyeS1jdXN0b20tc2Nyb2xsYmFyXCI6IFwibXp1YmFsYS9qcXVlcnktY3VzdG9tLXNjcm9sbGJhciMwLjUuNVwiXHJcblx0fVxyXG59XHJcbiIsInZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuLi8uLi9idWlsZC90ZW1wbGF0ZXMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgZGF0YSA9IHt9O1xyXG5cdHZhciBrZXkgPSBudWxsO1xyXG5cclxuXHQvLyBDb252ZXJ0IHRlbXBsYXRlcyB0byB0aGVpciBzaG9ydGVyIFwicmVuZGVyXCIgZm9ybS5cclxuXHRmb3IgKGtleSBpbiB0ZW1wbGF0ZXMpIHtcclxuXHRcdGlmICghdGVtcGxhdGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHRcdFx0Y29udGludWU7XHJcblx0XHR9XHJcblx0XHRkYXRhW2tleV0gPSByZW5kZXIoa2V5KTtcclxuXHR9XHJcblxyXG5cdC8vIFNob3J0Y3V0IHRoZSByZW5kZXIgZnVuY3Rpb24uIEFsbCB0ZW1wbGF0ZXMgd2lsbCBiZSBwYXNzZWQgaW4gYXMgcGFydGlhbHMgYnkgZGVmYXVsdC5cclxuXHRmdW5jdGlvbiByZW5kZXIodGVtcGxhdGUpIHtcclxuXHRcdHRlbXBsYXRlID0gdGVtcGxhdGVzW3RlbXBsYXRlXTtcclxuXHRcdHJldHVybiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzIHx8IHRlbXBsYXRlcywgaW5kZW50KTtcclxuXHRcdH07XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZGF0YTtcclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uICgkKSB7XHJcblx0JC5mbi5yZXNpemFibGUgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cdFx0dmFyIHNldHRpbmdzID0gJC5leHRlbmQoe1xyXG5cdFx0XHRhbHNvUmVzaXplOiBudWxsLFxyXG5cdFx0XHRhbHNvUmVzaXplVHlwZTogJ2JvdGgnLCAvLyBgaGVpZ2h0YCwgYHdpZHRoYCwgYGJvdGhgXHJcblx0XHRcdGNvbnRhaW5tZW50OiBudWxsLFxyXG5cdFx0XHRjcmVhdGU6IG51bGwsXHJcblx0XHRcdGRlc3Ryb3k6IG51bGwsXHJcblx0XHRcdGhhbmRsZTogJy5yZXNpemUtaGFuZGxlJyxcclxuXHRcdFx0bWF4SGVpZ2h0OiA5OTk5LFxyXG5cdFx0XHRtYXhXaWR0aDogOTk5OSxcclxuXHRcdFx0bWluSGVpZ2h0OiAwLFxyXG5cdFx0XHRtaW5XaWR0aDogMCxcclxuXHRcdFx0cmVzaXplOiBudWxsLFxyXG5cdFx0XHRyZXNpemVPbmNlOiBudWxsLFxyXG5cdFx0XHRzbmFwU2l6ZTogMSxcclxuXHRcdFx0c3RhcnQ6IG51bGwsXHJcblx0XHRcdHN0b3A6IG51bGxcclxuXHRcdH0sIG9wdGlvbnMpO1xyXG5cclxuXHRcdHNldHRpbmdzLmVsZW1lbnQgPSAkKHRoaXMpO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHJlY2FsY3VsYXRlU2l6ZShldnQpIHtcclxuXHRcdFx0dmFyIGRhdGEgPSBldnQuZGF0YSxcclxuXHRcdFx0XHRyZXNpemVkID0ge307XHJcblx0XHRcdGRhdGEuZGlmZlggPSBNYXRoLnJvdW5kKChldnQucGFnZVggLSBkYXRhLnBhZ2VYKSAvIHNldHRpbmdzLnNuYXBTaXplKSAqIHNldHRpbmdzLnNuYXBTaXplO1xyXG5cdFx0XHRkYXRhLmRpZmZZID0gTWF0aC5yb3VuZCgoZXZ0LnBhZ2VZIC0gZGF0YS5wYWdlWSkgLyBzZXR0aW5ncy5zbmFwU2l6ZSkgKiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHRcdFx0aWYgKE1hdGguYWJzKGRhdGEuZGlmZlgpID4gMCB8fCBNYXRoLmFicyhkYXRhLmRpZmZZKSA+IDApIHtcclxuXHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LmhlaWdodCgpICE9PSBkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgJiZcclxuXHRcdFx0XHRcdGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSA+PSBzZXR0aW5ncy5taW5IZWlnaHQgJiZcclxuXHRcdFx0XHRcdGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSA8PSBzZXR0aW5ncy5tYXhIZWlnaHQgJiZcclxuXHRcdFx0XHRcdChzZXR0aW5ncy5jb250YWlubWVudCA/IGRhdGEub3V0ZXJIZWlnaHQgKyBkYXRhLmRpZmZZICsgZGF0YS5vZmZzZXQudG9wIDw9IHNldHRpbmdzLmNvbnRhaW5tZW50Lm9mZnNldCgpLnRvcCArIHNldHRpbmdzLmNvbnRhaW5tZW50Lm91dGVySGVpZ2h0KCkgOiB0cnVlKVxyXG5cdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZKTtcclxuXHRcdFx0XHRcdHJlc2l6ZWQuaGVpZ2h0ID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC53aWR0aCgpICE9PSBkYXRhLndpZHRoICsgZGF0YS5kaWZmWCAmJlxyXG5cdFx0XHRcdFx0ZGF0YS53aWR0aCArIGRhdGEuZGlmZlggPj0gc2V0dGluZ3MubWluV2lkdGggJiZcclxuXHRcdFx0XHRcdGRhdGEud2lkdGggKyBkYXRhLmRpZmZYIDw9IHNldHRpbmdzLm1heFdpZHRoICYmXHJcblx0XHRcdFx0XHQoc2V0dGluZ3MuY29udGFpbm1lbnQgPyBkYXRhLm91dGVyV2lkdGggKyBkYXRhLmRpZmZYICsgZGF0YS5vZmZzZXQubGVmdCA8PSBzZXR0aW5ncy5jb250YWlubWVudC5vZmZzZXQoKS5sZWZ0ICsgc2V0dGluZ3MuY29udGFpbm1lbnQub3V0ZXJXaWR0aCgpIDogdHJ1ZSlcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQud2lkdGgoZGF0YS53aWR0aCArIGRhdGEuZGlmZlgpO1xyXG5cdFx0XHRcdFx0cmVzaXplZC53aWR0aCA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChyZXNpemVkLmhlaWdodCB8fCByZXNpemVkLndpZHRoKSB7XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MucmVzaXplT25jZSkge1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemVPbmNlLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoZXZ0LmRhdGEpO1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemVPbmNlID0gbnVsbDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5yZXNpemUpIHtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoZXZ0LmRhdGEpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLmFsc29SZXNpemUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHJlc2l6ZWQuaGVpZ2h0ICYmIChzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ2hlaWdodCcgfHwgc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdib3RoJykpIHtcclxuXHRcdFx0XHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplLmhlaWdodChkYXRhLmFsc29SZXNpemVIZWlnaHQgKyBkYXRhLmRpZmZZKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAocmVzaXplZC53aWR0aCAmJiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICd3aWR0aCcgfHwgc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdib3RoJykpIHtcclxuXHRcdFx0XHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplLndpZHRoKGRhdGEuYWxzb1Jlc2l6ZVdpZHRoICsgZGF0YS5kaWZmWCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBzdGFydChldnQpIHtcclxuXHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5zdGFydCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLnN0YXJ0LmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgZGF0YSA9IHtcclxuXHRcdFx0XHRhbHNvUmVzaXplSGVpZ2h0OiBzZXR0aW5ncy5hbHNvUmVzaXplID8gc2V0dGluZ3MuYWxzb1Jlc2l6ZS5oZWlnaHQoKSA6IDAsXHJcblx0XHRcdFx0YWxzb1Jlc2l6ZVdpZHRoOiBzZXR0aW5ncy5hbHNvUmVzaXplID8gc2V0dGluZ3MuYWxzb1Jlc2l6ZS53aWR0aCgpIDogMCxcclxuXHRcdFx0XHRoZWlnaHQ6IHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KCksXHJcblx0XHRcdFx0b2Zmc2V0OiBzZXR0aW5ncy5lbGVtZW50Lm9mZnNldCgpLFxyXG5cdFx0XHRcdG91dGVySGVpZ2h0OiBzZXR0aW5ncy5lbGVtZW50Lm91dGVySGVpZ2h0KCksXHJcblx0XHRcdFx0b3V0ZXJXaWR0aDogc2V0dGluZ3MuZWxlbWVudC5vdXRlcldpZHRoKCksXHJcblx0XHRcdFx0cGFnZVg6IGV2dC5wYWdlWCxcclxuXHRcdFx0XHRwYWdlWTogZXZ0LnBhZ2VZLFxyXG5cdFx0XHRcdHdpZHRoOiBzZXR0aW5ncy5lbGVtZW50LndpZHRoKClcclxuXHRcdFx0fTtcclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNlbW92ZScsICcqJywgZGF0YSwgcmVjYWxjdWxhdGVTaXplKTtcclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNldXAnLCAnKicsIHN0b3ApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHN0b3AoKSB7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5zdG9wKSB7XHJcblx0XHRcdFx0c2V0dGluZ3Muc3RvcC5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUnLCAnKicsIHJlY2FsY3VsYXRlU2l6ZSk7XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsICcqJywgc3RvcCk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHNldHRpbmdzLmhhbmRsZSkge1xyXG5cdFx0XHRpZiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZSAmJiBbJ2JvdGgnLCAnaGVpZ2h0JywgJ3dpZHRoJ10uaW5kZXhPZihzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSkgPj0gMCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmFsc29SZXNpemUgPSAkKHNldHRpbmdzLmFsc29SZXNpemUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChzZXR0aW5ncy5jb250YWlubWVudCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmNvbnRhaW5tZW50ID0gJChzZXR0aW5ncy5jb250YWlubWVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0c2V0dGluZ3MuaGFuZGxlID0gJChzZXR0aW5ncy5oYW5kbGUpO1xyXG5cdFx0XHRzZXR0aW5ncy5zbmFwU2l6ZSA9IHNldHRpbmdzLnNuYXBTaXplIDwgMSA/IDEgOiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHJcblx0XHRcdGlmIChvcHRpb25zID09PSAnZGVzdHJveScpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5oYW5kbGUub2ZmKCdtb3VzZWRvd24nLCBzdGFydCk7XHJcblxyXG5cdFx0XHRcdGlmIChzZXR0aW5ncy5kZXN0cm95KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5kZXN0cm95LmJpbmQodGhpcykoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNldHRpbmdzLmhhbmRsZS5vbignbW91c2Vkb3duJywgc3RhcnQpO1xyXG5cclxuXHRcdFx0aWYgKHNldHRpbmdzLmNyZWF0ZSkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmNyZWF0ZS5iaW5kKHRoaXMpKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH07XHJcbn0pKGpRdWVyeSk7XHJcbiJdfQ==
