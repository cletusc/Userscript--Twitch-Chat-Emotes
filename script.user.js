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
var Store = require('storage-wrapper');

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

// Setup storage.
var storage = {};
storage.global = new Store({
	namespace: 'emote-menu-for-twitch'
});
storage.popularity = storage.global.createSubstore('popularity')

// Migrate old keys.
storage.global.migrate({
	fromNamespace: '',
	fromKey: 'emote-popularity-tracking',
	toKey: '_migrate',
	// overwriteNewData: true,
	// keepOldData: true,
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
		storage.popularity.removeAll();
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
		var aGet = storage.popularity.get(a.text, 0);
		var bGet = storage.popularity.get(b.text, 0);
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
			// Determine if emote is from a third-party addon.
			emote.isThirdParty = url.parse(emote.image.url).hostname !== 'static-cdn.jtvnw.net';
			
			emotes.usable.push(emote);
		}
	});
}

/**
 * Inserts an emote into the chat box.
 * @param {string} text The text of the emote (e.g. "Kappa").
 */
function insertEmoteText(text) {
	storage.popularity.set(text, storage.popularity.get(text, 0) + 1);
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
			var badge = emotes.subscriptions.badges[emote.channel] || emote.badge || 'https://static-cdn.jtvnw.net/jtv_user_pictures/subscriber-star.png';
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
			text: emote.text,
			thirdParty: emote.isThirdParty
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

},{"../build/styles":2,"../package.json":12,"./modules/templates":13,"./plugins/resizable":14,"jquery-custom-scrollbar/jquery.custom-scrollbar":10,"storage-wrapper":11,"url":8}],2:[function(require,module,exports){
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
"#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;margin-left:7px}#emote-menu-button.active{border-radius:2px;background-color:rgba(128,128,128,.5)}.emote-menu{padding:5px;z-index:1000;display:none;background-color:#202020}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-popular{height:38px}.emote-menu .draggable{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px)}.emote-menu .group-header{border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;background-image:-webkit-linear-gradient(bottom,transparent,rgba(0,0,0,.5));background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center}.emote-menu .group-header img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:32px;height:32px;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu .emote div{max-width:32px;max-height:32px;background-repeat:no-repeat;background-size:contain;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;padding:5px 0 2px;margin-top:5px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5;background-size:contain!important}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-home{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNjQiDQogICBoZWlnaHQ9IjY0Ig0KICAgdmlld0JveD0iMCAwIDY0IDY0Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhMzAwMSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczI5OTkiIC8+DQo8cGF0aA0KICAgZD0ibSA1Ny4wNjIsMzEuMzk4IGMgMC45MzIsLTEuMDI1IDAuODQyLC0yLjU5NiAtMC4yMDEsLTMuNTA4IEwgMzMuODg0LDcuNzg1IEMgMzIuODQxLDYuODczIDMxLjE2OSw2Ljg5MiAzMC4xNDgsNy44MjggTCA3LjA5MywyOC45NjIgYyAtMS4wMjEsMC45MzYgLTEuMDcxLDIuNTA1IC0wLjExMSwzLjUwMyBsIDAuNTc4LDAuNjAyIGMgMC45NTksMC45OTggMi41MDksMS4xMTcgMy40NiwwLjI2NSBsIDEuNzIzLC0xLjU0MyB2IDIyLjU5IGMgMCwxLjM4NiAxLjEyMywyLjUwOCAyLjUwOCwyLjUwOCBoIDguOTg3IGMgMS4zODUsMCAyLjUwOCwtMS4xMjIgMi41MDgsLTIuNTA4IFYgMzguNTc1IGggMTEuNDYzIHYgMTUuODA0IGMgLTAuMDIsMS4zODUgMC45NzEsMi41MDcgMi4zNTYsMi41MDcgaCA5LjUyNCBjIDEuMzg1LDAgMi41MDgsLTEuMTIyIDIuNTA4LC0yLjUwOCBWIDMyLjEwNyBjIDAsMCAwLjQ3NiwwLjQxNyAxLjA2MywwLjkzMyAwLjU4NiwwLjUxNSAxLjgxNywwLjEwMiAyLjc0OSwtMC45MjQgbCAwLjY1MywtMC43MTggeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%}.emote-menu .icon-resize-handle{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgdmlld0JveD0iMCAwIDE2IDE2Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhNDM1NyI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczQzNTUiIC8+DQo8cGF0aA0KICAgZD0iTSAxMy41LDggQyAxMy4yMjUsOCAxMyw4LjIyNCAxMyw4LjUgdiAzLjc5MyBMIDMuNzA3LDMgSCA3LjUgQyA3Ljc3NiwzIDgsMi43NzYgOCwyLjUgOCwyLjIyNCA3Ljc3NiwyIDcuNSwyIGggLTUgTCAyLjMwOSwyLjAzOSAyLjE1LDIuMTQ0IDIuMTQ2LDIuMTQ2IDIuMTQzLDIuMTUyIDIuMDM5LDIuMzA5IDIsMi41IHYgNSBDIDIsNy43NzYgMi4yMjQsOCAyLjUsOCAyLjc3Niw4IDMsNy43NzYgMyw3LjUgViAzLjcwNyBMIDEyLjI5MywxMyBIIDguNSBDIDguMjI0LDEzIDgsMTMuMjI1IDgsMTMuNSA4LDEzLjc3NSA4LjIyNCwxNCA4LjUsMTQgaCA1IGwgMC4xOTEsLTAuMDM5IGMgMC4xMjEsLTAuMDUxIDAuMjIsLTAuMTQ4IDAuMjcsLTAuMjcgTCAxNCwxMy41MDIgViA4LjUgQyAxNCw4LjIyNCAxMy43NzUsOCAxMy41LDggeiINCiAgIGlkPSJwYXRoNDM1MSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%;cursor:nwse-resize!important}.emote-menu .icon-pin{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgaWQ9InN2ZzMwMDUiPg0KICA8bWV0YWRhdGENCiAgICAgaWQ9Im1ldGFkYXRhMzAyMyI+DQogICAgPHJkZjpSREY+DQogICAgICA8Y2M6V29yaw0KICAgICAgICAgcmRmOmFib3V0PSIiPg0KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4NCiAgICAgICAgPGRjOnR5cGUNCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4NCiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+DQogICAgICA8L2NjOldvcms+DQogICAgPC9yZGY6UkRGPg0KICA8L21ldGFkYXRhPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczMwMjEiIC8+DQogIDxnDQogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzkzMDc4MiwwLDAsMC43OTMwNzgyLC0yLjE3MDk4NSwtODE0LjY5Mjk5KSINCiAgICAgaWQ9ImczMDA3Ij4NCiAgICA8Zw0KICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTEsMC43MDcxMSwtMC43MDcxMSwwLjcwNzExLDczNy43MDc1NSwyOTUuNDg4MDgpIg0KICAgICAgIGlkPSJnMzAwOSI+DQogICAgICA8Zw0KICAgICAgICAgaWQ9ImczNzU1Ij4NCiAgICAgICAgPHBhdGgNCiAgICAgICAgICAgZD0iTSA5Ljc4MTI1LDAgQyA5LjQ3NDA1NjIsMC42ODkxMTIgOS41MjA2OCwxLjUyMzA4NTMgOS4zMTI1LDIuMTg3NSBMIDQuOTM3NSw2LjU5Mzc1IEMgMy45NTg5NjA4LDYuNDI5NDgzIDIuOTQ3NzU0OCw2LjUzMjc4OTkgMiw2LjgxMjUgTCA1LjAzMTI1LDkuODQzNzUgMC41NjI1LDE0LjMxMjUgMCwxNiBDIDAuNTY5Mjk2MjgsMTUuNzk1NjI2IDEuMTY3NzM3OCwxNS42NDAyMzcgMS43MTg3NSwxNS40MDYyNSBMIDYuMTU2MjUsMTAuOTY4NzUgOS4xODc1LDE0IGMgMC4yNzk2ODIzLC0wLjk0Nzc4MyAwLjM4MzE1MjgsLTEuOTU4OTM3IDAuMjE4NzUsLTIuOTM3NSAxLjUwMDAxMSwtMS40ODk1Nzk4IDMuMDAwMDAxLC0yLjk3OTE1OSA0LjUsLTQuNDY4NzUgMC42MDExMDIsLTAuMDMxMzYxIDEuODIyMTM4LC0wLjA5NjEzNyAyLC0wLjQ2ODc1IEMgMTMuODc5ODkyLDQuMDY5NDgwMyAxMS44NDI4NjUsMi4wMjAyMjgyIDkuNzgxMjUsMCB6Ig0KICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg5MTU5Mzc0LC0wLjg5MTU5Mzc0LDAuODkxNTkzNzQsMC44OTE1OTM3NCwtMi4yNjU1LDEwMzcuMTM0NSkiDQogICAgICAgICAgIGlkPSJwYXRoMzAxMSINCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K) no-repeat 50%;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu .icon-pin:hover,.emote-menu.pinned .icon-pin{-webkit-transform:rotate(-45deg);-ms-transform:rotate(-45deg);transform:rotate(-45deg);opacity:1}.emote-menu .scrollable.default-skin{padding-right:0;padding-bottom:0}.emote-menu .scrollable.default-skin .scroll-bar .thumb{background-color:#555;opacity:.2;z-index:1}"));

},{}],3:[function(require,module,exports){
module.exports = (function() {
    var Hogan = require('hogan.js/lib/template.js');
    var templates = {};
    templates['emote'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote");if(t.s(t.f("thirdParty",c,p,1),c,p,0,32,44,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" third-party");});c.pop();}t.b("\" data-emote=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" title=\"");t.b(t.v(t.f("text",c,p,0)));if(t.s(t.f("thirdParty",c,p,1),c,p,0,113,136,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" (from 3rd party addon)");});c.pop();}t.b("\">\r");t.b("\n" + i);t.b("	<div style=\"background-image: url(");t.b(t.t(t.d("image.url",c,p,0)));t.b("); height: ");t.b(t.t(t.d("image.height",c,p,0)));t.b("px; width: ");t.b(t.t(t.d("image.width",c,p,0)));t.b("px\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button glyph-only float-left\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteGroupHeader'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");if(t.s(t.f("isAddonHeader",c,p,1),c,p,0,18,218,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("	<div class=\"group-header addon-emotes-header\" title=\"Below are emotes added by an addon. Only those who also have the same addon installed can see these emotes in chat.\">\r");t.b("\n" + i);t.b("		Addon Emotes\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);});c.pop();}t.b("\r");t.b("\n" + i);if(!t.s(t.f("isAddonHeader",c,p,1),c,p,1,0,0,"")){t.b("	<div class=\"group-header\" data-emote-channel=\"");t.b(t.v(t.f("channel",c,p,0)));t.b("\"><img src=\"");t.b(t.v(t.f("badge",c,p,0)));t.b("\" />");t.b(t.v(t.f("channel",c,p,0)));t.b("</div>\r");t.b("\n" + i);};return t.fl(); },partials: {}, subs: {  }});
    templates['menu'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote-menu dropmenu\" id=\"emote-menu-for-twitch\">\r");t.b("\n" + i);t.b("	<div class=\"draggable\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"group-header\">All Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container scrollable\" id=\"all-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"group-header\">Popular Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container single-row\" id=\"popular-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"footer\">\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-home\" href=\"http://cletusc.github.io/Userscript--Twitch-Chat-Emotes\" target=\"_blank\" title=\"Visit the homepage where you can donate, post a review, or contact the developer\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-pin\" data-command=\"toggle-pinned\" title=\"Pin/unpin the emote menu to the screen\"></a>\r");t.b("\n" + i);t.b("		<a title=\"Reset the popularity of the emotes back to default\" data-command=\"reset-popularity\">Reset Popularity</a>\r");t.b("\n" + i);t.b("		<a class=\"pull-right icon icon-resize-handle\" data-command=\"resize-handle\"></a>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
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
	// Handle simple types.
	else if (['string', 'boolean', 'number'].indexOf(typeof val) >= 0) {
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
		"storage-wrapper": "cletusc/storage-wrapper#0.x"
	},
	"napa": {
		"jquery-custom-scrollbar": "mzubala/jquery-custom-scrollbar#0.5.5"
	}
}

},{}],13:[function(require,module,exports){
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

},{"../../build/templates":3}],14:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxVc2Vyc1xcQ2xldHVzXFxQcm9qZWN0c1xcVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIi4vc3JjL3NjcmlwdC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvYnVpbGQvc3R5bGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wdW55Y29kZS9wdW55Y29kZS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3F1ZXJ5c3RyaW5nLWVzMy9kZWNvZGUuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2luZGV4LmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXJsL3VybC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2hvZ2FuLmpzL2xpYi90ZW1wbGF0ZS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2pxdWVyeS1jdXN0b20tc2Nyb2xsYmFyL2pxdWVyeS5jdXN0b20tc2Nyb2xsYmFyLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvc3RvcmFnZS13cmFwcGVyL2luZGV4LmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9wYWNrYWdlLmpzb24iLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL3RlbXBsYXRlcy5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL3BsdWdpbnMvcmVzaXphYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25zQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6d0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuL21vZHVsZXMvdGVtcGxhdGVzJyk7XHJcbnZhciBwa2cgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKTtcclxudmFyIFN0b3JlID0gcmVxdWlyZSgnc3RvcmFnZS13cmFwcGVyJyk7XHJcblxyXG52YXIgJCA9IG51bGw7XHJcbnZhciBqUXVlcnkgPSBudWxsO1xyXG5cclxuLy8gU2NyaXB0LXdpZGUgdmFyaWFibGVzLlxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbnZhciB1cmwgPSByZXF1aXJlKCd1cmwnKTtcclxudmFyIGVtb3RlcyA9IHtcclxuXHR1c2FibGU6IFtdLFxyXG5cdGdldCByYXcoKSB7XHJcblx0XHRpZiAod2luZG93LkFwcCkge1xyXG5cdFx0XHRyZXR1cm4gd2luZG93LkFwcC5fX2NvbnRhaW5lcl9fLmxvb2t1cCgnY29udHJvbGxlcjplbW90aWNvbnMnKS5nZXQoJ2Vtb3RpY29ucycpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIFtdO1xyXG5cdH0sXHJcblx0c3Vic2NyaXB0aW9uczoge1xyXG5cdFx0YmFkZ2VzOiB7fSxcclxuXHRcdGVtb3Rlczoge31cclxuXHR9XHJcbn07XHJcbnZhciBpc0luaXRpYXRlZCA9IGZhbHNlO1xyXG5cclxuLy8gU2V0dXAgc3RvcmFnZS5cclxudmFyIHN0b3JhZ2UgPSB7fTtcclxuc3RvcmFnZS5nbG9iYWwgPSBuZXcgU3RvcmUoe1xyXG5cdG5hbWVzcGFjZTogJ2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCdcclxufSk7XHJcbnN0b3JhZ2UucG9wdWxhcml0eSA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCdwb3B1bGFyaXR5JylcclxuXHJcbi8vIE1pZ3JhdGUgb2xkIGtleXMuXHJcbnN0b3JhZ2UuZ2xvYmFsLm1pZ3JhdGUoe1xyXG5cdGZyb21OYW1lc3BhY2U6ICcnLFxyXG5cdGZyb21LZXk6ICdlbW90ZS1wb3B1bGFyaXR5LXRyYWNraW5nJyxcclxuXHR0b0tleTogJ19taWdyYXRlJyxcclxuXHQvLyBvdmVyd3JpdGVOZXdEYXRhOiB0cnVlLFxyXG5cdC8vIGtlZXBPbGREYXRhOiB0cnVlLFxyXG5cdHRyYW5zZm9ybTogZnVuY3Rpb24gKGRhdGEpIHtcclxuXHRcdHRyeSB7XHJcblx0XHRcdGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xyXG5cdFx0fVxyXG5cdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0ZGF0YSA9IHt9O1xyXG5cdFx0fVxyXG5cdFx0Zm9yICh2YXIga2V5IGluIGRhdGEpIHtcclxuXHRcdFx0aWYgKCFkYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRzdG9yYWdlLnBvcHVsYXJpdHkuc2V0KGtleSwgTnVtYmVyKGRhdGFba2V5XSkpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGRhdGE7XHJcblx0fVxyXG59KTtcclxuXHJcbi8vIERPTSBlbGVtZW50cy5cclxudmFyIGVsZW1lbnRzID0ge1xyXG5cdC8vIFRoZSBidXR0b24gdG8gc2VuZCBhIGNoYXQgbWVzc2FnZS5cclxuXHRjaGF0QnV0dG9uOiBudWxsLFxyXG5cdC8vIFRoZSBhcmVhIHdoZXJlIGFsbCBjaGF0IG1lc3NhZ2VzIGFyZSBjb250YWluZWQuXHJcblx0Y2hhdENvbnRhaW5lcjogbnVsbCxcclxuXHQvLyBUaGUgaW5wdXQgZmllbGQgZm9yIGNoYXQgbWVzc2FnZXMuXHJcblx0Y2hhdEJveDogbnVsbCxcclxuXHQvLyBUaGUgYnV0dG9uIHVzZWQgdG8gc2hvdyB0aGUgbWVudS5cclxuXHRtZW51QnV0dG9uOiBudWxsLFxyXG5cdC8vIFRoZSBtZW51IHRoYXQgY29udGFpbnMgYWxsIGVtb3Rlcy5cclxuXHRtZW51OiBudWxsXHJcbn07XHJcblxyXG52YXIgU0NSSVBUX05BTUUgPSBwa2cudXNlcnNjcmlwdC5uYW1lO1xyXG52YXIgTUVTU0FHRVMgPSB7XHJcblx0Tk9fQ0hBVF9FTEVNRU5UOiAnVGhlcmUgaXMgbm8gY2hhdCBlbGVtZW50IG9uIHRoZSBwYWdlLCB1bmFibGUgdG8gY29udGludWUuJyxcclxuXHRPQkpFQ1RTX05PVF9MT0FERUQ6ICdOZWVkZWQgb2JqZWN0cyBoYXZlblxcJ3QgbG9hZGVkIHlldC4nLFxyXG5cdFRJTUVPVVRfU0NSSVBUX0xPQUQ6ICdTY3JpcHQgdG9vayB0b28gbG9uZyB0byBsb2FkLiBSZWZyZXNoIHRvIHRyeSBhZ2Fpbi4nXHJcbn07XHJcblxyXG52YXIgaGVscGVycyA9IHtcclxuXHR1c2VyOiB7XHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrIGlmIHVzZXIgaXMgbG9nZ2VkIGluLCBhbmQgcHJvbXB0cyB0aGVtIHRvIGlmIHRoZXkgYXJlbid0LlxyXG5cdFx0ICogQHJldHVybiB7Ym9vbGVhbn0gYHRydWVgIGlmIGxvZ2dlZCBpbiwgYGZhbHNlYCBpZiBsb2dnZWQgb3V0LlxyXG5cdFx0ICovXHJcblx0XHRsb2dpbjogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQvLyBDaGVjayBpZiBsb2dnZWQgaW4gYWxyZWFkeS5cclxuXHRcdFx0aWYgKHdpbmRvdy5Ud2l0Y2ggJiYgd2luZG93LlR3aXRjaC51c2VyLmlzTG9nZ2VkSW4oKSkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIE5vdCBsb2dnZWQgaW4sIGNhbGwgVHdpdGNoJ3MgbG9naW4gbWV0aG9kLlxyXG5cdFx0XHQkLmxvZ2luKCk7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcdFxyXG5cdFx0fVxyXG5cdH1cclxufTtcclxuXHJcbi8vIFF1aWNrIG1hbmlwdWxhdGlvbiBvZiBzY3JpcHQtd2lkZSB2YXJpYWJsZXMuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8vIFByZWZpeCBhbGwgbWVzc2FnZXMgd2l0aCBzY3JpcHQgbmFtZS5cclxuZm9yICh2YXIgbWVzc2FnZSBpbiBNRVNTQUdFUykge1xyXG5cdGlmIChNRVNTQUdFUy5oYXNPd25Qcm9wZXJ0eShtZXNzYWdlKSkge1xyXG5cdFx0TUVTU0FHRVNbbWVzc2FnZV0gPSAnWycgKyBTQ1JJUFRfTkFNRSArICddOiAnICsgTUVTU0FHRVNbbWVzc2FnZV07XHJcblx0fVxyXG59XHJcblxyXG4vLyBPbmx5IGVuYWJsZSBzY3JpcHQgaWYgd2UgaGF2ZSB0aGUgcmlnaHQgdmFyaWFibGVzLlxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4oZnVuY3Rpb24gaW5pdCh0aW1lKSB7XHJcblx0JCA9IGpRdWVyeSA9IHdpbmRvdy5qUXVlcnk7XHJcblx0dmFyIHJvdXRlcyA9IHdpbmRvdy5BcHAgJiYgKHdpbmRvdy5BcHAuQ2hhbm5lbFJvdXRlIHx8IHdpbmRvdy5BcHAuQ2hhdFJvdXRlKTtcclxuXHR2YXIgb2JqZWN0c0xvYWRlZCA9IChcclxuXHRcdHdpbmRvdy5Ud2l0Y2ggIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0KFxyXG5cdFx0XHR3aW5kb3cuQXBwICE9PSB1bmRlZmluZWQgJiZcclxuXHRcdFx0d2luZG93LkFwcC5fX2NvbnRhaW5lcl9fICE9PSB1bmRlZmluZWQgJiZcclxuXHRcdFx0d2luZG93LkFwcC5fX2NvbnRhaW5lcl9fLmxvb2t1cCgnY29udHJvbGxlcjplbW90aWNvbnMnKS5nZXQoJ2Vtb3RpY29ucycpICE9PSB1bmRlZmluZWQgJiZcclxuXHRcdFx0d2luZG93LkFwcC5fX2NvbnRhaW5lcl9fLmxvb2t1cCgnY29udHJvbGxlcjplbW90aWNvbnMnKS5nZXQoJ2Vtb3RpY29ucycpLmxlbmd0aFxyXG5cdFx0KSAmJlxyXG5cdFx0alF1ZXJ5ICE9PSB1bmRlZmluZWQgJiZcclxuXHRcdC8vIENoYXQgYnV0dG9uLlxyXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NoYXRfc3BlYWssIC5zZW5kLWNoYXQtYnV0dG9uJylcclxuXHQpO1xyXG5cdGlmICghaXNJbml0aWF0ZWQgJiYgcm91dGVzKSB7XHJcblx0XHR2YXIgYWN0aXZhdGUgPSB7XHJcblx0XHRcdGFjdGl2YXRlOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0dGhpcy5fc3VwZXIoKTtcclxuXHRcdFx0XHRpbml0KDUwKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHRpZiAod2luZG93LkFwcC5DaGFubmVsUm91dGUpIHtcclxuXHRcdFx0d2luZG93LkFwcC5DaGFubmVsUm91dGUucmVvcGVuKGFjdGl2YXRlKTtcclxuXHRcdFx0aXNJbml0aWF0ZWQgPSB0cnVlO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHdpbmRvdy5BcHAuQ2hhdFJvdXRlKSB7XHJcblx0XHRcdHdpbmRvdy5BcHAuQ2hhdFJvdXRlLnJlb3BlbihhY3RpdmF0ZSk7XHJcblx0XHRcdGlzSW5pdGlhdGVkID0gdHJ1ZTtcclxuXHRcdH1cclxuXHR9XHJcblx0aWYgKCFvYmplY3RzTG9hZGVkIHx8ICFyb3V0ZXMpIHtcclxuXHRcdC8vIEVycm9ycyBpbiBhcHByb3hpbWF0ZWx5IDEwMjQwMG1zLlxyXG5cdFx0aWYgKHRpbWUgPj0gNjAwMDApIHtcclxuXHRcdFx0Y29uc29sZS5lcnJvcihNRVNTQUdFUy5USU1FT1VUX1NDUklQVF9MT0FEKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRpbWUgPj0gMTAwMDApIHtcclxuXHRcdFx0aWYgKCFvYmplY3RzTG9hZGVkKSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKE1FU1NBR0VTLk9CSkVDVFNfTk9UX0xPQURFRCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHNldFRpbWVvdXQoaW5pdCwgdGltZSwgdGltZSAqIDIpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRzZXR1cCgpO1xyXG59KSg1MCk7XHJcblxyXG4vLyBTdGFydCBvZiBmdW5jdGlvbnMuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLyoqXHJcbiAqIFJ1bnMgaW5pdGlhbCBzZXR1cCBvZiBET00gYW5kIHZhcmlhYmxlcy5cclxuICovXHJcbmZ1bmN0aW9uIHNldHVwKCkge1xyXG5cdC8vIExvYWQgQ1NTLlxyXG5cdHJlcXVpcmUoJy4uL2J1aWxkL3N0eWxlcycpO1xyXG5cdC8vIExvYWQgalF1ZXJ5IHBsdWdpbnMuXHJcblx0cmVxdWlyZSgnLi9wbHVnaW5zL3Jlc2l6YWJsZScpO1xyXG5cdHJlcXVpcmUoJ2pxdWVyeS1jdXN0b20tc2Nyb2xsYmFyL2pxdWVyeS5jdXN0b20tc2Nyb2xsYmFyJyk7XHJcblx0XHJcblx0ZWxlbWVudHMuY2hhdEJ1dHRvbiA9ICQoJy5zZW5kLWNoYXQtYnV0dG9uJyk7XHJcblx0ZWxlbWVudHMuY2hhdEJveCA9ICQoJy5jaGF0LWludGVyZmFjZSB0ZXh0YXJlYScpO1xyXG5cdGVsZW1lbnRzLmNoYXRDb250YWluZXIgPSAkKCcuY2hhdC1tZXNzYWdlcycpO1xyXG5cclxuXHQvLyBObyBjaGF0LCBqdXN0IGV4aXQuXHJcblx0aWYgKCFlbGVtZW50cy5jaGF0QnV0dG9uLmxlbmd0aCkge1xyXG5cdFx0Y29uc29sZS53YXJuKE1FU1NBR0VTLk5PX0NIQVRfRUxFTUVOVCk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHRjcmVhdGVNZW51RWxlbWVudHMoKTtcclxuXHRiaW5kTGlzdGVuZXJzKCk7XHJcblxyXG5cdC8vIEdldCBhY3RpdmUgc3Vic2NyaXB0aW9ucy5cclxuXHR3aW5kb3cuVHdpdGNoLmFwaS5nZXQoXHJcblx0XHQnL2FwaS91c2Vycy86bG9naW4vdGlja2V0cycsXHJcblx0XHR7XHJcblx0XHRcdG9mZnNldDogMCxcclxuXHRcdFx0bGltaXQ6IDEwMCxcclxuXHRcdFx0dW5lbmRlZDogdHJ1ZVxyXG5cdFx0fVxyXG5cdCkuZG9uZShmdW5jdGlvbiAoYXBpKSB7XHJcblx0XHRhcGkudGlja2V0cy5mb3JFYWNoKGZ1bmN0aW9uICh0aWNrZXQpIHtcclxuXHRcdFx0Ly8gR2V0IHN1YnNjcmlwdGlvbnMgd2l0aCBlbW90ZXMuXHJcblx0XHRcdGlmICh0aWNrZXQucHJvZHVjdC5lbW90aWNvbnMgJiYgdGlja2V0LnByb2R1Y3QuZW1vdGljb25zLmxlbmd0aCkge1xyXG5cdFx0XHRcdHZhciBiYWRnZSA9IHRpY2tldC5wcm9kdWN0LmZlYXR1cmVzLmJhZGdlO1xyXG5cdFx0XHRcdHZhciBjaGFubmVsID0gdGlja2V0LnByb2R1Y3Qub3duZXJfbmFtZTtcclxuXHRcdFx0XHQvLyBBZGQgY2hhbm5lbCBiYWRnZXMuXHJcblx0XHRcdFx0aWYgKGJhZGdlKSB7XHJcblx0XHRcdFx0XHRiYWRnZSA9ICdodHRwOi8vc3RhdGljLWNkbi5qdHZudy5uZXQvanR2X3VzZXJfcGljdHVyZXMvJyArIFtiYWRnZS5wcmVmaXgsIGJhZGdlLm93bmVyLCBiYWRnZS50eXBlLCBiYWRnZS51aWQsIGJhZGdlLnNpemVzWzBdXS5qb2luKCctJykgKyAnLicgKyBiYWRnZS5mb3JtYXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0YmFkZ2UgPSAnaHR0cHM6Ly9zdGF0aWMtY2RuLmp0dm53Lm5ldC9qdHZfdXNlcl9waWN0dXJlcy9zdWJzY3JpYmVyLXN0YXIucG5nJztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZW1vdGVzLnN1YnNjcmlwdGlvbnMuYmFkZ2VzW2NoYW5uZWxdID0gYmFkZ2U7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Ly8gQWRkIGVtb3RlcyBjaGFubmVsLlxyXG5cdFx0XHRcdHRpY2tldC5wcm9kdWN0LmVtb3RpY29ucy5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0XHRcdFx0ZW1vdGVzLnN1YnNjcmlwdGlvbnMuZW1vdGVzW2dldEVtb3RlRnJvbVJlZ0V4KG5ldyBSZWdFeHAoZW1vdGUucmVnZXgpKV0gPSB7XHJcblx0XHRcdFx0XHRcdGNoYW5uZWw6IGNoYW5uZWwsXHJcblx0XHRcdFx0XHRcdHVybDogZW1vdGUudXJsXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHR9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgdGhlIGluaXRpYWwgbWVudSBlbGVtZW50c1xyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlTWVudUVsZW1lbnRzKCkge1xyXG5cdC8vIFJlbW92ZSBtZW51IGJ1dHRvbiBpZiBmb3VuZC5cclxuXHRlbGVtZW50cy5tZW51QnV0dG9uID0gJCgnI2Vtb3RlLW1lbnUtYnV0dG9uJyk7XHJcblx0aWYgKGVsZW1lbnRzLm1lbnVCdXR0b24ubGVuZ3RoKSB7XHJcblx0XHRlbGVtZW50cy5tZW51QnV0dG9uLnJlbW92ZSgpO1xyXG5cdH1cclxuXHQvLyBDcmVhdGUgbWVudSBidXR0b24uXHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbiA9ICQodGVtcGxhdGVzLmVtb3RlQnV0dG9uKCkpO1xyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24uaW5zZXJ0QmVmb3JlKGVsZW1lbnRzLmNoYXRCdXR0b24pO1xyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24uaGlkZSgpO1xyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24uZmFkZUluKCk7XHJcblxyXG5cdC8vIFJlbW92ZSBtZW51IGlmIGZvdW5kLlxyXG5cdGVsZW1lbnRzLm1lbnUgPSAkKCcjZW1vdGUtbWVudS1mb3ItdHdpdGNoJyk7XHJcblx0aWYgKGVsZW1lbnRzLm1lbnUubGVuZ3RoKSB7XHJcblx0XHRlbGVtZW50cy5tZW51LnJlbW92ZSgpO1xyXG5cdH1cclxuXHQvLyBDcmVhdGUgbWVudS5cclxuXHRlbGVtZW50cy5tZW51ID0gJCh0ZW1wbGF0ZXMubWVudSgpKTtcclxuXHRlbGVtZW50cy5tZW51LmFwcGVuZFRvKGRvY3VtZW50LmJvZHkpO1xyXG59XHJcblxyXG4vKipcclxuICogQmluZCBldmVudCBsaXN0ZW5lcnMuXHJcbiAqL1xyXG5mdW5jdGlvbiBiaW5kTGlzdGVuZXJzKCkge1xyXG5cclxuXHRmdW5jdGlvbiB0b2dnbGVNZW51KCkge1xyXG5cdFx0Ly8gTWVudSBzaG93biwgaGlkZSBpdC5cclxuXHRcdGlmIChlbGVtZW50cy5tZW51LmlzKCc6dmlzaWJsZScpKSB7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuaGlkZSgpO1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LnJlbW92ZUNsYXNzKCdwaW5uZWQnKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcblx0XHR9XHJcblx0XHQvLyBNZW51IGhpZGRlbiwgc2hvdyBpdC5cclxuXHRcdGVsc2UgaWYgKGhlbHBlcnMudXNlci5sb2dpbigpKSB7XHJcblx0XHRcdHBvcHVsYXRlRW1vdGVzTWVudSgpO1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LnNob3coKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5hZGRDbGFzcygnYWN0aXZlJyk7XHJcblxyXG5cdFx0XHQkKGRvY3VtZW50KS5vbignbW91c2V1cCcsIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKTtcclxuXHJcblx0XHRcdC8vIE1lbnUgbW92ZWQsIG1vdmUgaXQgYmFjay5cclxuXHRcdFx0aWYgKGVsZW1lbnRzLm1lbnUuaGFzQ2xhc3MoJ21vdmVkJykpIHtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51Lm9mZnNldChKU09OLnBhcnNlKGVsZW1lbnRzLm1lbnUuYXR0cignZGF0YS1vZmZzZXQnKSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIE5ldmVyIG1vdmVkLCBtYWtlIGl0IHRoZSBzYW1lIHNpemUgYXMgdGhlIGNoYXQgd2luZG93LlxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHR2YXIgZGlmZiA9IGVsZW1lbnRzLm1lbnUuaGVpZ2h0KCkgLSBlbGVtZW50cy5tZW51LmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykuaGVpZ2h0KCk7XHJcblx0XHRcdFx0Ly8gQWRqdXN0IHRoZSBzaXplIGFuZCBwb3NpdGlvbiBvZiB0aGUgcG9wdXAuXHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5oZWlnaHQoZWxlbWVudHMuY2hhdENvbnRhaW5lci5vdXRlckhlaWdodCgpIC0gKGVsZW1lbnRzLm1lbnUub3V0ZXJIZWlnaHQoKSAtIGVsZW1lbnRzLm1lbnUuaGVpZ2h0KCkpKTtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LndpZHRoKGVsZW1lbnRzLmNoYXRDb250YWluZXIub3V0ZXJXaWR0aCgpIC0gKGVsZW1lbnRzLm1lbnUub3V0ZXJXaWR0aCgpIC0gZWxlbWVudHMubWVudS53aWR0aCgpKSk7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5vZmZzZXQoZWxlbWVudHMuY2hhdENvbnRhaW5lci5vZmZzZXQoKSk7XHJcblx0XHRcdFx0Ly8gRml4IGAuZW1vdGVzLWFsbGAgaGVpZ2h0LlxyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKS5oZWlnaHQoZWxlbWVudHMubWVudS5oZWlnaHQoKSAtIGRpZmYpO1xyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKS53aWR0aChlbGVtZW50cy5tZW51LndpZHRoKCkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIFJlY2FsY3VsYXRlIGFueSBzY3JvbGwgYmFycy5cclxuXHRcdFx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcigncmVzaXplJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gY2hlY2tGb3JDbGlja091dHNpZGUoZSkge1xyXG5cdFx0XHQvLyBOb3Qgb3V0c2lkZSBvZiB0aGUgbWVudSwgaWdub3JlIHRoZSBjbGljay5cclxuXHRcdFx0aWYgKCQoZS50YXJnZXQpLmlzKCcjZW1vdGUtbWVudS1mb3ItdHdpdGNoLCAjZW1vdGUtbWVudS1mb3ItdHdpdGNoIConKSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBDbGlja2VkIG9uIHRoZSBtZW51IGJ1dHRvbiwganVzdCByZW1vdmUgdGhlIGxpc3RlbmVyIGFuZCBsZXQgdGhlIG5vcm1hbCBsaXN0ZW5lciBoYW5kbGUgaXQuXHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5pcygnOnZpc2libGUnKSB8fCAkKGUudGFyZ2V0KS5pcygnI2Vtb3RlLW1lbnUtYnV0dG9uLCAjZW1vdGUtbWVudS1idXR0b24gKicpKSB7XHJcblx0XHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgY2hlY2tGb3JDbGlja091dHNpZGUpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBDbGlja2VkIG91dHNpZGUsIG1ha2Ugc3VyZSB0aGUgbWVudSBpc24ndCBwaW5uZWQuXHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5oYXNDbGFzcygncGlubmVkJykpIHtcclxuXHRcdFx0XHQvLyBNZW51IHdhc24ndCBwaW5uZWQsIHJlbW92ZSBsaXN0ZW5lci5cclxuXHRcdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCBjaGVja0ZvckNsaWNrT3V0c2lkZSk7XHJcblx0XHRcdFx0dG9nZ2xlTWVudSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBUb2dnbGUgbWVudS5cclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLm9uKCdjbGljaycsIHRvZ2dsZU1lbnUpO1xyXG5cclxuXHQvLyBNYWtlIGRyYWdnYWJsZS5cclxuXHRlbGVtZW50cy5tZW51LmRyYWdnYWJsZSh7XHJcblx0XHRoYW5kbGU6ICcuZHJhZ2dhYmxlJyxcclxuXHRcdHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdtb3ZlZCcpO1xyXG5cdFx0fSxcclxuXHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5hdHRyKCdkYXRhLW9mZnNldCcsIEpTT04uc3RyaW5naWZ5KGVsZW1lbnRzLm1lbnUub2Zmc2V0KCkpKTtcclxuXHRcdH0sXHJcblx0XHRjb250YWlubWVudDogJChkb2N1bWVudC5ib2R5KVxyXG5cdH0pO1xyXG5cclxuXHRlbGVtZW50cy5tZW51LnJlc2l6YWJsZSh7XHJcblx0XHRoYW5kbGU6ICdbZGF0YS1jb21tYW5kPVwicmVzaXplLWhhbmRsZVwiXScsXHJcblx0XHRyZXNpemU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Ly8gUmVjYWxjdWxhdGUgYW55IHNjcm9sbCBiYXJzLlxyXG5cdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJykuY3VzdG9tU2Nyb2xsYmFyKCdyZXNpemUnKTtcclxuXHRcdH0sXHJcblx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdtb3ZlZCcpO1xyXG5cdFx0fSxcclxuXHRcdGFsc29SZXNpemU6IGVsZW1lbnRzLm1lbnUuZmluZCgnLnNjcm9sbGFibGUnKSxcclxuXHRcdGNvbnRhaW5tZW50OiAkKGRvY3VtZW50LmJvZHkpLFxyXG5cdFx0bWluSGVpZ2h0OiAxODAsXHJcblx0XHRtaW5XaWR0aDogMjAwXHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSB0aGUgcG9wdWxhcml0eSByZXNldC5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJyZXNldC1wb3B1bGFyaXR5XCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0c3RvcmFnZS5wb3B1bGFyaXR5LnJlbW92ZUFsbCgpO1xyXG5cdFx0cG9wdWxhdGVFbW90ZXNNZW51KCk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBtZW51IHBpbm5pbmcuXHJcblx0ZWxlbWVudHMubWVudS5maW5kKCdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLXBpbm5lZFwiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGVsZW1lbnRzLm1lbnUudG9nZ2xlQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgZW1vdGUgY2xpY2tpbmcgKGRlbGVnYXRlZCkuXHJcblx0ZWxlbWVudHMubWVudS5vbignY2xpY2snLCAnLmVtb3RlJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0aW5zZXJ0RW1vdGVUZXh0KCQodGhpcykuYXR0cignZGF0YS1lbW90ZScpKTtcclxuXHR9KTtcclxuXHJcblx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcih7XHJcblx0XHRza2luOiAnZGVmYXVsdC1za2luJyxcclxuXHRcdGhTY3JvbGw6IGZhbHNlLFxyXG5cdFx0cHJldmVudERlZmF1bHRTY3JvbGw6IHRydWVcclxuXHR9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFBvcHVsYXRlcyB0aGUgcG9wdXAgbWVudSB3aXRoIGN1cnJlbnQgZW1vdGUgZGF0YS5cclxuICovXHJcbmZ1bmN0aW9uIHBvcHVsYXRlRW1vdGVzTWVudSgpIHtcclxuXHR2YXIgY29udGFpbmVyO1xyXG5cclxuXHRyZWZyZXNoVXNhYmxlRW1vdGVzKCk7XHJcblxyXG5cdC8vIEFkZCBwb3B1bGFyIGVtb3Rlcy5cclxuXHRjb250YWluZXIgPSBlbGVtZW50cy5tZW51LmZpbmQoJyNwb3B1bGFyLWVtb3Rlcy1ncm91cCcpO1xyXG5cdGNvbnRhaW5lci5odG1sKCcnKTtcclxuXHRlbW90ZXMudXNhYmxlLnNvcnQoc29ydEJ5UG9wdWxhcml0eSk7XHJcblx0ZW1vdGVzLnVzYWJsZS5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0Y3JlYXRlRW1vdGUoZW1vdGUsIGNvbnRhaW5lcik7XHJcblx0fSk7XHJcblxyXG5cdC8vIEFkZCBhbGwgZW1vdGVzLlxyXG5cdGNvbnRhaW5lciA9IGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKTtcclxuXHRpZiAoY29udGFpbmVyLmZpbmQoJy5vdmVydmlldycpLmxlbmd0aCkge1xyXG5cdFx0Y29udGFpbmVyID0gY29udGFpbmVyLmZpbmQoJy5vdmVydmlldycpO1xyXG5cdH1cclxuXHRjb250YWluZXIuaHRtbCgnJyk7XHJcblx0ZW1vdGVzLnVzYWJsZS5zb3J0KHNvcnRCeVNldCk7XHJcblx0ZW1vdGVzLnVzYWJsZS5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0Y3JlYXRlRW1vdGUoZW1vdGUsIGNvbnRhaW5lciwgdHJ1ZSk7XHJcblx0fSk7XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgcG9wdWxhcml0eTogbW9zdCB1c2VkIC0+IGxlYXN0IHVzZWRcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBzb3J0QnlQb3B1bGFyaXR5KGEsIGIpIHtcclxuXHRcdHZhciBhR2V0ID0gc3RvcmFnZS5wb3B1bGFyaXR5LmdldChhLnRleHQsIDApO1xyXG5cdFx0dmFyIGJHZXQgPSBzdG9yYWdlLnBvcHVsYXJpdHkuZ2V0KGIudGV4dCwgMCk7XHJcblx0XHRpZiAoYUdldCA8IGJHZXQpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAoYUdldCA+IGJHZXQpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHNvcnRCeU5vcm1hbChhLCBiKTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgYWxwaGFudW1lcmljIGluIHRoaXMgb3JkZXI6IHN5bWJvbHMgLT4gbnVtYmVycyAtPiBBYUJiLi4uIC0+IG51bWJlcnNcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBzb3J0QnlOb3JtYWwoYSwgYil7XHJcblx0XHRhID0gYS50ZXh0O1xyXG5cdFx0YiA9IGIudGV4dDtcclxuXHRcdGlmIChhLnRvTG93ZXJDYXNlKCkgPCBiLnRvTG93ZXJDYXNlKCkpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGEudG9Mb3dlckNhc2UoKSA+IGIudG9Mb3dlckNhc2UoKSkge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdGlmIChhIDwgYikge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYSA+IGIpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNvcnQgYnkgZW1vdGljb24gc2V0OiBiYXNpYyBzbWlsZXlzIC0+IG5vIHNldCAtPiBzdWJzY3JpcHRpb24gZW1vdGVzXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gc29ydEJ5U2V0KGEsIGIpe1xyXG5cdFx0Ly8gT3ZlcnJpZGUgZm9yIHR1cmJvIGVtb3Rlcy5cclxuXHRcdGlmIChcclxuXHRcdFx0KGEuY2hhbm5lbCAmJiBhLmNoYW5uZWwgPT09ICdUd2l0Y2ggVHVyYm8nKSAmJlxyXG5cdFx0XHQoIWIuY2hhbm5lbCB8fCAoYi5jaGFubmVsICYmIGIuY2hhbm5lbCAhPT0gJ1R3aXRjaCBUdXJibycpKVxyXG5cdFx0KSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdGlmIChcclxuXHRcdFx0KGIuY2hhbm5lbCAmJiBiLmNoYW5uZWwgPT09ICdUd2l0Y2ggVHVyYm8nKSAmJlxyXG5cdFx0XHQoIWEuY2hhbm5lbCB8fCAoYS5jaGFubmVsICYmIGEuY2hhbm5lbCAhPT0gJ1R3aXRjaCBUdXJibycpKVxyXG5cdFx0KSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0Ly8gT3ZlcnJpZGUgZm9yIGJhc2ljIGVtb3Rlcy5cclxuXHRcdHZhciBiYXNpY0Vtb3RlcyA9IFsnOignLCAnOiknLCAnOi8nLCAnOkQnLCAnOm8nLCAnOnAnLCAnOnonLCAnOyknLCAnO3AnLCAnPDMnLCAnPignLCAnQiknLCAnUiknLCAnb19vJywgJyMvJywgJzo3JywgJzo+JywgJzpTJywgJzxdJ107XHJcblx0XHRpZiAoYmFzaWNFbW90ZXMuaW5kZXhPZihhLnRleHQpID49IDAgJiZcdGJhc2ljRW1vdGVzLmluZGV4T2YoYi50ZXh0KSA8IDApIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGJhc2ljRW1vdGVzLmluZGV4T2YoYi50ZXh0KSA+PSAwICYmXHRiYXNpY0Vtb3Rlcy5pbmRleE9mKGEudGV4dCkgPCAwKSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0Ly8gU29ydCBieSBjaGFubmVsIG5hbWUuXHJcblx0XHRpZiAoYS5jaGFubmVsICYmICFiLmNoYW5uZWwpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHRpZiAoYi5jaGFubmVsICYmICFhLmNoYW5uZWwpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGEuY2hhbm5lbCAmJiBiLmNoYW5uZWwpIHtcclxuXHRcdFx0Ly8gRm9yY2UgYWRkb24gZW1vdGUgZ3JvdXBzIGJlbG93IHN0YW5kYXJkIFR3aXRjaCBncm91cHMuXHJcblx0XHRcdGlmIChlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbYS5jaGFubmVsXSAmJiAhZW1vdGVzLnN1YnNjcmlwdGlvbnMuYmFkZ2VzW2IuY2hhbm5lbF0pIHtcclxuXHRcdFx0XHRyZXR1cm4gLTE7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1tiLmNoYW5uZWxdICYmICFlbW90ZXMuc3Vic2NyaXB0aW9ucy5iYWRnZXNbYS5jaGFubmVsXSkge1xyXG5cdFx0XHRcdHJldHVybiAxO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgY2hhbm5lbFNvcnQgPSBzb3J0QnlOb3JtYWwoe3RleHQ6IGEuY2hhbm5lbH0sIHt0ZXh0OiBiLmNoYW5uZWx9KTtcclxuXHRcdFx0dmFyIG5vcm1hbFNvcnQgPSBzb3J0QnlOb3JtYWwoYSwgYik7XHJcblx0XHRcdGlmIChjaGFubmVsU29ydCA9PT0gMCkge1xyXG5cdFx0XHRcdHJldHVybiBub3JtYWxTb3J0O1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBjaGFubmVsU29ydDtcclxuXHRcdH1cclxuXHRcdC8vIEdldCBpdCBiYWNrIHRvIGEgc3RhYmxlIHNvcnQuXHJcblx0XHRyZXR1cm4gc29ydEJ5Tm9ybWFsKGEsIGIpO1xyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlZnJlc2hlcyB0aGUgdXNhYmxlIGVtb3Rlcy4gQW4gZW1vdGUgaXMgZGVlbWVkIHVzYWJsZSBpZiBpdCBlaXRoZXIgaGFzIG5vIHNldCBvciB0aGUgc2V0IGlzIGluIHlvdXIgdXNlciBpbmZvLiBGb3IgdHVyYm8gc2V0cywgaXQgd2lsbCB1c2UgdGhlIHR1cmJvIGlmIGluIHlvdXIgdXNlciBpbmZvLCBvdGhlcndpc2UgZmFsbCBiYWNrIHRvIGRlZmF1bHQuXHJcbiAqL1xyXG5mdW5jdGlvbiByZWZyZXNoVXNhYmxlRW1vdGVzKCkge1xyXG5cdGVtb3Rlcy51c2FibGUgPSBbXTtcclxuXHRlbW90ZXMucmF3LmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHQvLyBBbGxvdyBoaWRpbmcgb2YgZW1vdGVzIGZyb20gdGhlIG1lbnUuXHJcblx0XHRpZiAoZW1vdGUuaGlkZGVuKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGlmICghZW1vdGUudGV4dCkge1xyXG5cdFx0XHRlbW90ZS50ZXh0ID0gZ2V0RW1vdGVGcm9tUmVnRXgoZW1vdGUucmVnZXgpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSkge1xyXG5cdFx0XHRlbW90ZS5jaGFubmVsID0gZW1vdGVzLnN1YnNjcmlwdGlvbnMuZW1vdGVzW2Vtb3RlLnRleHRdLmNoYW5uZWw7XHJcblx0XHR9XHJcblx0XHR2YXIgZGVmYXVsdEltYWdlO1xyXG5cdFx0ZW1vdGUuaW1hZ2VzLnNvbWUoZnVuY3Rpb24gKGltYWdlKSB7XHJcblx0XHRcdGlmIChpbWFnZS5lbW90aWNvbl9zZXQgPT09IG51bGwpIHtcclxuXHRcdFx0XHRkZWZhdWx0SW1hZ2UgPSBpbWFnZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoXHJcblx0XHRcdFx0Ly8gSW1hZ2UgaXMgdGhlIHNhbWUgVVJMIGFzIHRoZSBzdWJzY3JpcHRpb24gZW1vdGUuXHJcblx0XHRcdFx0KGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XSAmJiBpbWFnZS51cmwgPT09IGVtb3Rlcy5zdWJzY3JpcHRpb25zLmVtb3Rlc1tlbW90ZS50ZXh0XS51cmwpIHx8XHJcblx0XHRcdFx0Ly8gRW1vdGUgaXMgZm9yY2VkIHRvIHNob3cuXHJcblx0XHRcdFx0ZW1vdGUuaGlkZGVuID09PSBmYWxzZVxyXG5cdFx0XHQpIHtcclxuXHRcdFx0XHRlbW90ZS5pbWFnZSA9IGltYWdlO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdGVtb3RlLmltYWdlID0gZW1vdGUuaW1hZ2UgfHwgZGVmYXVsdEltYWdlO1xyXG5cclxuXHRcdC8vIE9ubHkgYWRkIHRoZSBlbW90ZSBpZiB0aGVyZSBpcyBhIFVSTC5cclxuXHRcdGlmIChlbW90ZS5pbWFnZSAmJiBlbW90ZS5pbWFnZS51cmwgIT09IG51bGwpIHtcclxuXHRcdFx0Ly8gRGV0ZXJtaW5lIGlmIGVtb3RlIGlzIGZyb20gYSB0aGlyZC1wYXJ0eSBhZGRvbi5cclxuXHRcdFx0ZW1vdGUuaXNUaGlyZFBhcnR5ID0gdXJsLnBhcnNlKGVtb3RlLmltYWdlLnVybCkuaG9zdG5hbWUgIT09ICdzdGF0aWMtY2RuLmp0dm53Lm5ldCc7XHJcblx0XHRcdFxyXG5cdFx0XHRlbW90ZXMudXNhYmxlLnB1c2goZW1vdGUpO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG59XHJcblxyXG4vKipcclxuICogSW5zZXJ0cyBhbiBlbW90ZSBpbnRvIHRoZSBjaGF0IGJveC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgVGhlIHRleHQgb2YgdGhlIGVtb3RlIChlLmcuIFwiS2FwcGFcIikuXHJcbiAqL1xyXG5mdW5jdGlvbiBpbnNlcnRFbW90ZVRleHQodGV4dCkge1xyXG5cdHN0b3JhZ2UucG9wdWxhcml0eS5zZXQodGV4dCwgc3RvcmFnZS5wb3B1bGFyaXR5LmdldCh0ZXh0LCAwKSArIDEpO1xyXG5cdC8vIEdldCBpbnB1dC5cclxuXHR2YXIgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjaGF0X3RleHRfaW5wdXQsIC5jaGF0LWludGVyZmFjZSB0ZXh0YXJlYScpO1xyXG5cclxuXHQvLyBJbnNlcnQgYXQgY3Vyc29yIC8gcmVwbGFjZSBzZWxlY3Rpb24uXHJcblx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Db2RlX3NuaXBwZXRzL01pc2NlbGxhbmVvdXNcclxuXHR2YXIgc2VsZWN0aW9uRW5kID0gZWxlbWVudC5zZWxlY3Rpb25TdGFydCArIHRleHQubGVuZ3RoO1xyXG5cdHZhciBjdXJyZW50VmFsdWUgPSBlbGVtZW50LnZhbHVlO1xyXG5cdHZhciBiZWZvcmVUZXh0ID0gY3VycmVudFZhbHVlLnN1YnN0cmluZygwLCBlbGVtZW50LnNlbGVjdGlvblN0YXJ0KTtcclxuXHR2YXIgYWZ0ZXJUZXh0ID0gY3VycmVudFZhbHVlLnN1YnN0cmluZyhlbGVtZW50LnNlbGVjdGlvbkVuZCwgY3VycmVudFZhbHVlLmxlbmd0aCk7XHJcblx0Ly8gU21hcnQgcGFkZGluZywgb25seSBwdXQgc3BhY2UgYXQgc3RhcnQgaWYgbmVlZGVkLlxyXG5cdGlmIChcclxuXHRcdGJlZm9yZVRleHQgIT09ICcnICYmXHJcblx0XHRiZWZvcmVUZXh0LnN1YnN0cigtMSkgIT09ICcgJ1xyXG5cdCkge1xyXG5cdFx0dGV4dCA9ICcgJyArIHRleHQ7XHJcblx0fVxyXG5cdC8vIEFsd2F5cyBwdXQgc3BhY2UgYXQgZW5kLlxyXG5cdHRleHQgPSBiZWZvcmVUZXh0ICsgdGV4dCArICcgJyArIGFmdGVyVGV4dDtcclxuXHQvLyBTZXQgdGhlIHRleHQuXHJcblx0d2luZG93LkFwcC5fX2NvbnRhaW5lcl9fLmxvb2t1cCgnY29udHJvbGxlcjpjaGF0JykuZ2V0KCdjdXJyZW50Um9vbScpLnNldCgnbWVzc2FnZVRvU2VuZCcsIHRleHQpO1xyXG5cdGVsZW1lbnQuZm9jdXMoKTtcclxuXHQvLyBQdXQgY3Vyc29yIGF0IGVuZC5cclxuXHRzZWxlY3Rpb25FbmQgPSBlbGVtZW50LnNlbGVjdGlvblN0YXJ0ICsgdGV4dC5sZW5ndGg7XHJcblx0ZWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZShzZWxlY3Rpb25FbmQsIHNlbGVjdGlvbkVuZCk7XHJcblxyXG5cdC8vIENsb3NlIHBvcHVwIGlmIGl0IGhhc24ndCBiZWVuIG1vdmVkIGJ5IHRoZSB1c2VyLlxyXG5cdGlmICghZWxlbWVudHMubWVudS5oYXNDbGFzcygncGlubmVkJykpIHtcclxuXHRcdGVsZW1lbnRzLm1lbnVCdXR0b24uY2xpY2soKTtcclxuXHR9XHJcblx0Ly8gUmUtcG9wdWxhdGUgYXMgaXQgaXMgc3RpbGwgb3Blbi5cclxuXHRlbHNlIHtcclxuXHRcdHBvcHVsYXRlRW1vdGVzTWVudSgpO1xyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgdGhlIGVtb3RlIGVsZW1lbnQgYW5kIGxpc3RlbnMgZm9yIGEgY2xpY2sgZXZlbnQgdGhhdCB3aWxsIGFkZCB0aGUgZW1vdGUgdGV4dCB0byB0aGUgY2hhdC5cclxuICogQHBhcmFtIHtvYmplY3R9ICBlbW90ZSAgICAgIFRoZSBlbW90ZSB0aGF0IHlvdSB3YW50IHRvIGFkZC4gVGhpcyBvYmplY3Qgc2hvdWxkIGJlIG9uZSBjb21pbmcgZnJvbSBgZW1vdGVzYC5cclxuICogQHBhcmFtIHtlbGVtZW50fSBjb250YWluZXIgIFRoZSBIVE1MIGVsZW1lbnQgdGhhdCB0aGUgZW1vdGUgc2hvdWxkIGJlIGFwcGVuZGVkIHRvLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHNob3dIZWFkZXIgV2hldGhlciBhIGhlYWRlciBzaG91bGRiZSBjcmVhdGVkIGlmIGZvdW5kLiBPbmx5IGNyZWF0ZXMgdGhlIGhlYWRlciBvbmNlLlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlRW1vdGUoZW1vdGUsIGNvbnRhaW5lciwgc2hvd0hlYWRlcikge1xyXG5cdC8vIEVtb3RlIG5vdCB1c2FibGUgb3Igbm8gY29udGFpbmVyLCBjYW4ndCBhZGQuXHJcblx0aWYgKCFlbW90ZSB8fCAhZW1vdGUuaW1hZ2UgfHwgIWNvbnRhaW5lci5sZW5ndGgpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0aWYgKHNob3dIZWFkZXIpIHtcclxuXHRcdGlmIChlbW90ZS5jaGFubmVsICYmIGVtb3RlLmNoYW5uZWwgIT09ICdUd2l0Y2ggVHVyYm8nKSB7XHJcblx0XHRcdHZhciBiYWRnZSA9IGVtb3Rlcy5zdWJzY3JpcHRpb25zLmJhZGdlc1tlbW90ZS5jaGFubmVsXSB8fCBlbW90ZS5iYWRnZSB8fCAnaHR0cHM6Ly9zdGF0aWMtY2RuLmp0dm53Lm5ldC9qdHZfdXNlcl9waWN0dXJlcy9zdWJzY3JpYmVyLXN0YXIucG5nJztcclxuXHRcdFx0aWYgKCFlbGVtZW50cy5tZW51LmZpbmQoJy5ncm91cC1oZWFkZXJbZGF0YS1lbW90ZS1jaGFubmVsPVwiJyArIGVtb3RlLmNoYW5uZWwgKyAnXCJdJykubGVuZ3RoKSB7XHJcblx0XHRcdFx0Y29udGFpbmVyLmFwcGVuZChcclxuXHRcdFx0XHRcdCQodGVtcGxhdGVzLmVtb3RlR3JvdXBIZWFkZXIoe1xyXG5cdFx0XHRcdFx0XHRiYWRnZTogYmFkZ2UsXHJcblx0XHRcdFx0XHRcdGNoYW5uZWw6IGVtb3RlLmNoYW5uZWxcclxuXHRcdFx0XHRcdH0pKVxyXG5cdFx0XHRcdCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGNvbnRhaW5lci5hcHBlbmQoXHJcblx0XHQkKHRlbXBsYXRlcy5lbW90ZSh7XHJcblx0XHRcdGltYWdlOiBlbW90ZS5pbWFnZSxcclxuXHRcdFx0dGV4dDogZW1vdGUudGV4dCxcclxuXHRcdFx0dGhpcmRQYXJ0eTogZW1vdGUuaXNUaGlyZFBhcnR5XHJcblx0XHR9KSlcclxuXHQpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgdXNhYmxlIGVtb3RlIHRleHQgZnJvbSBhIHJlZ2V4LlxyXG4gKiBAYXR0cmlidXRlIGh0dHA6Ly91c2Vyc2NyaXB0cy5vcmcvc2NyaXB0cy9zaG93LzE2MDE4MyAoYWRhcHRpb24pXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRFbW90ZUZyb21SZWdFeChyZWdleCkge1xyXG5cdGlmICh0eXBlb2YgcmVnZXggPT09ICdzdHJpbmcnKSB7XHJcblx0XHRyZWdleCA9IG5ldyBSZWdFeHAocmVnZXgpO1xyXG5cdH1cclxuXHRyZXR1cm4gZGVjb2RlVVJJKHJlZ2V4LnNvdXJjZSlcclxuXHRcdC5yZXBsYWNlKCcmZ3RcXFxcOycsICc+JykgLy8gcmlnaHQgYW5nbGUgYnJhY2tldFxyXG5cdFx0LnJlcGxhY2UoJyZsdFxcXFw7JywgJzwnKSAvLyBsZWZ0IGFuZ2xlIGJyYWNrZXRcclxuXHRcdC5yZXBsYWNlKC9cXChcXD8hW14pXSpcXCkvZywgJycpIC8vIHJlbW92ZSBuZWdhdGl2ZSBncm91cFxyXG5cdFx0LnJlcGxhY2UoL1xcKChbXnxdKSpcXHw/W14pXSpcXCkvZywgJyQxJykgLy8gcGljayBmaXJzdCBvcHRpb24gZnJvbSBhIGdyb3VwXHJcblx0XHQucmVwbGFjZSgvXFxbKFtefF0pKlxcfD9bXlxcXV0qXFxdL2csICckMScpIC8vIHBpY2sgZmlyc3QgY2hhcmFjdGVyIGZyb20gYSBjaGFyYWN0ZXIgZ3JvdXBcclxuXHRcdC5yZXBsYWNlKC9bXlxcXFxdXFw/L2csICcnKSAvLyByZW1vdmUgb3B0aW9uYWwgY2hhcnNcclxuXHRcdC5yZXBsYWNlKC9eXFxcXGJ8XFxcXGIkL2csICcnKSAvLyByZW1vdmUgYm91bmRhcmllc1xyXG5cdFx0LnJlcGxhY2UoL1xcXFwvZywgJycpOyAvLyB1bmVzY2FwZVxyXG59XHJcbiIsIihmdW5jdGlvbiAoZG9jLCBjc3NUZXh0KSB7XG4gICAgdmFyIHN0eWxlRWwgPSBkb2MuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG4gICAgaWYgKHN0eWxlRWwuc3R5bGVTaGVldCkge1xuICAgICAgICBpZiAoIXN0eWxlRWwuc3R5bGVTaGVldC5kaXNhYmxlZCkge1xuICAgICAgICAgICAgc3R5bGVFbC5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3NUZXh0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0eWxlRWwuaW5uZXJIVE1MID0gY3NzVGV4dDtcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlKSB7XG4gICAgICAgICAgICBzdHlsZUVsLmlubmVyVGV4dCA9IGNzc1RleHQ7XG4gICAgICAgIH1cbiAgICB9XG59KGRvY3VtZW50LCBcIi8qKlxcblwiICtcblwiICogTWluaWZpZWQgc3R5bGUuXFxuXCIgK1xuXCIgKiBPcmlnaW5hbCBmaWxlbmFtZTogXFxcXG5vZGVfbW9kdWxlc1xcXFxqcXVlcnktY3VzdG9tLXNjcm9sbGJhclxcXFxqcXVlcnkuY3VzdG9tLXNjcm9sbGJhci5jc3NcXG5cIiArXG5cIiAqL1xcblwiICtcblwiLnNjcm9sbGFibGV7cG9zaXRpb246cmVsYXRpdmV9LnNjcm9sbGFibGU6Zm9jdXN7b3V0bGluZTowfS5zY3JvbGxhYmxlIC52aWV3cG9ydHtwb3NpdGlvbjpyZWxhdGl2ZTtvdmVyZmxvdzpoaWRkZW59LnNjcm9sbGFibGUgLnZpZXdwb3J0IC5vdmVydmlld3twb3NpdGlvbjphYnNvbHV0ZX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhcntkaXNwbGF5Om5vbmV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIudmVydGljYWx7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDtoZWlnaHQ6MTAwJX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci5ob3Jpem9udGFse3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjEwMCV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIgLnRodW1ie3Bvc2l0aW9uOmFic29sdXRlfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyLnZlcnRpY2FsIC50aHVtYnt3aWR0aDoxMDAlO21pbi1oZWlnaHQ6MTBweH0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci5ob3Jpem9udGFsIC50aHVtYntoZWlnaHQ6MTAwJTttaW4td2lkdGg6MTBweDtsZWZ0OjB9Lm5vdC1zZWxlY3RhYmxley13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTsta2h0bWwtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZX0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW57cGFkZGluZy1yaWdodDoxMHB4O3BhZGRpbmctYm90dG9tOjZweH0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXIudmVydGljYWx7d2lkdGg6NnB4fS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFse2hlaWdodDo2cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOiMwMDA7b3BhY2l0eTouNDtib3JkZXItcmFkaXVzOjNweDstbW96LWJvcmRlci1yYWRpdXM6NHB4Oy13ZWJraXQtYm9yZGVyLXJhZGl1czo0cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyOmhvdmVyIC50aHVtYntvcGFjaXR5Oi42fS5zY3JvbGxhYmxlLmdyYXktc2tpbntwYWRkaW5nLXJpZ2h0OjE3cHh9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFye2JvcmRlcjoxcHggc29saWQgZ3JheTtiYWNrZ3JvdW5kLWNvbG9yOiNkM2QzZDN9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOmdyYXl9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyOmhvdmVyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOiMwMDB9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2Fse3dpZHRoOjEwcHh9LnNjcm9sbGFibGUuZ3JheS1za2luIC5zY3JvbGwtYmFyLmhvcml6b250YWx7aGVpZ2h0OjEwcHg7bWFyZ2luLXRvcDoycHh9LnNjcm9sbGFibGUubW9kZXJuLXNraW57cGFkZGluZy1yaWdodDoxN3B4fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFye2JvcmRlcjoxcHggc29saWQgZ3JheTtib3JkZXItcmFkaXVzOjRweDstbW96LWJvcmRlci1yYWRpdXM6NHB4Oy13ZWJraXQtYm9yZGVyLXJhZGl1czo0cHg7Ym94LXNoYWRvdzppbnNldCAwIDAgNXB4ICM4ODh9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6Izk1YWFiZjtib3JkZXItcmFkaXVzOjRweDstbW96LWJvcmRlci1yYWRpdXM6NHB4Oy13ZWJraXQtYm9yZGVyLXJhZGl1czo0cHg7Ym9yZGVyOjFweCBzb2xpZCAjNTM2OTg0fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2FsIC50aHVtYnt3aWR0aDo4cHg7YmFja2dyb3VuZDotd2Via2l0LWdyYWRpZW50KGxpbmVhcixsZWZ0IHRvcCxyaWdodCB0b3AsY29sb3Itc3RvcCgwJSwjOTVhYWJmKSxjb2xvci1zdG9wKDEwMCUsIzU0NzA5MikpO2JhY2tncm91bmQ6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQobGVmdCwjOTVhYWJmIDAsIzU0NzA5MiAxMDAlKTtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwjOTVhYWJmIDAsIzU0NzA5MiAxMDAlKTstbXMtZmlsdGVyOlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuZ3JhZGllbnQoIHN0YXJ0Q29sb3JzdHI9JyM5NWFhYmYnLCBlbmRDb2xvcnN0cj0nIzU0NzA5MicsR3JhZGllbnRUeXBlPTEgKVxcXCJ9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIuaG9yaXpvbnRhbCAudGh1bWJ7aGVpZ2h0OjhweDtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgjOTVhYWJmLCM1NDcwOTIpO2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQoIzk1YWFiZiwjNTQ3MDkyKTstbXMtZmlsdGVyOlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuZ3JhZGllbnQoIHN0YXJ0Q29sb3JzdHI9JyM5NWFhYmYnLCBlbmRDb2xvcnN0cj0nIzU0NzA5MicsR3JhZGllbnRUeXBlPTAgKVxcXCJ9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIudmVydGljYWx7d2lkdGg6MTBweH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFse2hlaWdodDoxMHB4O21hcmdpbi10b3A6MnB4fVxcblwiICtcblwiLyoqXFxuXCIgK1xuXCIgKiBNaW5pZmllZCBzdHlsZS5cXG5cIiArXG5cIiAqIE9yaWdpbmFsIGZpbGVuYW1lOiBcXFxcc3JjXFxcXHN0eWxlc1xcXFxzdHlsZS5jc3NcXG5cIiArXG5cIiAqL1xcblwiICtcblwiI2Vtb3RlLW1lbnUtYnV0dG9ue2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQklBQUFBUUNBWUFBQUFiQmk5Y0FBQUFBWE5TUjBJQXJzNGM2UUFBQUFSblFVMUJBQUN4and2OFlRVUFBQUFKY0VoWmN3QUFEc01BQUE3REFjZHZxR1FBQUFLVVNVUkJWRGhQZlpUTmkxSlJHTVp2TUlzV1VadHM1U0lYRllLMENNRS9JR2doeFZDN1dVb1UxTkJpeEkrbVJTRDRNUXpteHppS08zWFVCaFJtVUdaS2RCRzQwWEVHVTZkMEdGR1pjVDRxeFcxaGk3Znp2TndacUt3REQ1ejd2cy92dWVlZWUrNlZNSnhPNXdVaGhkdnRmdUh6K1Q0dExTMk5oZWdmR3NNREx4aXdISUloTGk1N1BKNzVWQ3IxWTM5L240YkRJWTFHbzRsQ0R4NTR3WUNWWXpqb1ZqUWEvZHh1dHlmQ2t3U3ZZSnBnT1NRZjcwOHR1QmExeVdSeS9MK1YvQ2w0d1lCRmhoVHhmTGh1bS9lc2lpSjF1MTJLUkNKa3NWaG9mWDJkVGs1T3prSE1VVU1QSG5qQjJGNTVWcEVoUGRlL0xieDhGcUJFSWtIcGRKb01CZ05wdFZyUzZYUlVxVlRPZzdhM3QybG1ab2IwZWoycDFXcjJnZ0dMRE9uSjNRU1pINGNvSG8vVHlzb0toeWdVQ3RKb05GUXNGbWt3R0xBd1I3aFNxU1NWU3NWZU1HQ1JJVDI5RjZmWEppOFh5K1V5bWMxbW1wNmVKb2ZEUWZWNm5VNVBUMW1ZMisxMjd1SHhTcVVTaDRGRmhoUUx2cnZ0Y3JtK1lwa0hCd2RVclZacGEydUxhclVhZFRvZE9qdzhaR0dPR25yd3dBc0dMREx3MWk0dUxyelJZZU9PajQ5cGIyK1BkbmQzcWRWcThTdEdBSVE1YW8xR2d6M3dnZ0dMREQ0QzRpemNFY1dmUjBkSGJNcmxjclN4c2NHYmpWQUlLOGxtczdTNXVjbUIvWDZmWHo5WURzRVFGemRqc1ZpdDJXenlxYzFrTXJ3ZlZxdVZqRVlqemMzTmtjbGtJcHZOUm10cmEreUJWekFmQlh0RGp1R2dTOEZnY0ZiYzhRdnVoak5TS0JRb0ZBcVI2TEZFbi9MNVBQZmdnWGQ1ZVhrV3JCekRRZEMxUUNCZ0ZvZXV0N096dy90eUJwMkZRemhQd3RPRkZ3elkzNFlvNEE5d1JYemREOExoY0U0OHduY0U5bm85RnVhb2lkNTc0YmtQTHhnWi8zdUk1cFRRVmZGbFAvTDcvV21oYjdKU1hxLzNJWHJ3eUhaNVNOSXZHQ25xeWgrSjcrZ0FBQUFBU1VWT1JLNUNZSUk9KSFpbXBvcnRhbnQ7YmFja2dyb3VuZC1wb3NpdGlvbjo1MCU7YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2N1cnNvcjpwb2ludGVyO21hcmdpbi1sZWZ0OjdweH0jZW1vdGUtbWVudS1idXR0b24uYWN0aXZle2JvcmRlci1yYWRpdXM6MnB4O2JhY2tncm91bmQtY29sb3I6cmdiYSgxMjgsMTI4LDEyOCwuNSl9LmVtb3RlLW1lbnV7cGFkZGluZzo1cHg7ei1pbmRleDoxMDAwO2Rpc3BsYXk6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOiMyMDIwMjB9LmVtb3RlLW1lbnUgYXtjb2xvcjojZmZmfS5lbW90ZS1tZW51IGE6aG92ZXJ7Y3Vyc29yOnBvaW50ZXI7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTtjb2xvcjojY2NjfS5lbW90ZS1tZW51IC5lbW90ZXMtcG9wdWxhcntoZWlnaHQ6MzhweH0uZW1vdGUtbWVudSAuZHJhZ2dhYmxle2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1yZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSAxMHB4KTtiYWNrZ3JvdW5kLWltYWdlOnJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDEwcHgpO2N1cnNvcjptb3ZlO2hlaWdodDo3cHg7bWFyZ2luLWJvdHRvbTozcHh9LmVtb3RlLW1lbnUgLmRyYWdnYWJsZTpob3ZlcntiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtcmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDEwcHgpO2JhY2tncm91bmQtaW1hZ2U6cmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDEwcHgpfS5lbW90ZS1tZW51IC5ncm91cC1oZWFkZXJ7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQoYm90dG9tLHRyYW5zcGFyZW50LHJnYmEoMCwwLDAsLjUpKTtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCh0byB0b3AsdHJhbnNwYXJlbnQscmdiYSgwLDAsMCwuNSkpO3BhZGRpbmc6MnB4O2NvbG9yOiNkZGQ7dGV4dC1hbGlnbjpjZW50ZXJ9LmVtb3RlLW1lbnUgLmdyb3VwLWhlYWRlciBpbWd7bWFyZ2luLXJpZ2h0OjhweH0uZW1vdGUtbWVudSAuZW1vdGV7ZGlzcGxheTppbmxpbmUtYmxvY2s7cGFkZGluZzoycHg7bWFyZ2luOjFweDtjdXJzb3I6cG9pbnRlcjtib3JkZXItcmFkaXVzOjVweDt0ZXh0LWFsaWduOmNlbnRlcjtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDozMnB4O2hlaWdodDozMnB4Oy13ZWJraXQtdHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZX0uZW1vdGUtbWVudSAuZW1vdGUgZGl2e21heC13aWR0aDozMnB4O21heC1oZWlnaHQ6MzJweDtiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7YmFja2dyb3VuZC1zaXplOmNvbnRhaW47bWFyZ2luOmF1dG87cG9zaXRpb246YWJzb2x1dGU7dG9wOjA7Ym90dG9tOjA7bGVmdDowO3JpZ2h0OjB9LmVtb3RlLW1lbnUgLnNpbmdsZS1yb3d7b3ZlcmZsb3c6aGlkZGVuO2hlaWdodDozN3B4fS5lbW90ZS1tZW51IC5zaW5nbGUtcm93IC5lbW90ZXtkaXNwbGF5OmlubGluZS1ibG9jazttYXJnaW4tYm90dG9tOjEwMHB4fS5lbW90ZS1tZW51IC5lbW90ZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsLjEpfS5lbW90ZS1tZW51IC5wdWxsLWxlZnR7ZmxvYXQ6bGVmdH0uZW1vdGUtbWVudSAucHVsbC1yaWdodHtmbG9hdDpyaWdodH0uZW1vdGUtbWVudSAuZm9vdGVye3RleHQtYWxpZ246Y2VudGVyO2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDA7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA1KSBpbnNldDtwYWRkaW5nOjVweCAwIDJweDttYXJnaW4tdG9wOjVweH0uZW1vdGUtbWVudSAuZm9vdGVyIC5wdWxsLWxlZnR7bWFyZ2luLXJpZ2h0OjVweH0uZW1vdGUtbWVudSAuZm9vdGVyIC5wdWxsLXJpZ2h0e21hcmdpbi1sZWZ0OjVweH0uZW1vdGUtbWVudSAuaWNvbntoZWlnaHQ6MTZweDt3aWR0aDoxNnB4O29wYWNpdHk6LjU7YmFja2dyb3VuZC1zaXplOmNvbnRhaW4haW1wb3J0YW50fS5lbW90ZS1tZW51IC5pY29uOmhvdmVye29wYWNpdHk6MX0uZW1vdGUtbWVudSAuaWNvbi1ob21le2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTmpRaURRb2dJQ0JvWldsbmFIUTlJalkwSWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURZMElEWTBJZzBLSUNBZ2FXUTlJa05oY0dGZk1TSU5DaUFnSUhodGJEcHpjR0ZqWlQwaWNISmxjMlZ5ZG1VaVBqeHRaWFJoWkdGMFlRMEtJQ0FnYVdROUltMWxkR0ZrWVhSaE16QXdNU0krUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6STVPVGtpSUM4K0RRbzhjR0YwYUEwS0lDQWdaRDBpYlNBMU55NHdOaklzTXpFdU16azRJR01nTUM0NU16SXNMVEV1TURJMUlEQXVPRFF5TEMweUxqVTVOaUF0TUM0eU1ERXNMVE11TlRBNElFd2dNek11T0RnMExEY3VOemcxSUVNZ016SXVPRFF4TERZdU9EY3pJRE14TGpFMk9TdzJMamc1TWlBek1DNHhORGdzTnk0NE1qZ2dUQ0EzTGpBNU15d3lPQzQ1TmpJZ1l5QXRNUzR3TWpFc01DNDVNellnTFRFdU1EY3hMREl1TlRBMUlDMHdMakV4TVN3ekxqVXdNeUJzSURBdU5UYzRMREF1TmpBeUlHTWdNQzQ1TlRrc01DNDVPVGdnTWk0MU1Ea3NNUzR4TVRjZ015NDBOaXd3TGpJMk5TQnNJREV1TnpJekxDMHhMalUwTXlCMklESXlMalU1SUdNZ01Dd3hMak00TmlBeExqRXlNeXd5TGpVd09DQXlMalV3T0N3eUxqVXdPQ0JvSURndU9UZzNJR01nTVM0ek9EVXNNQ0F5TGpVd09Dd3RNUzR4TWpJZ01pNDFNRGdzTFRJdU5UQTRJRllnTXpndU5UYzFJR2dnTVRFdU5EWXpJSFlnTVRVdU9EQTBJR01nTFRBdU1ESXNNUzR6T0RVZ01DNDVOekVzTWk0MU1EY2dNaTR6TlRZc01pNDFNRGNnYUNBNUxqVXlOQ0JqSURFdU16ZzFMREFnTWk0MU1EZ3NMVEV1TVRJeUlESXVOVEE0TEMweUxqVXdPQ0JXSURNeUxqRXdOeUJqSURBc01DQXdMalEzTml3d0xqUXhOeUF4TGpBMk15d3dMamt6TXlBd0xqVTROaXd3TGpVeE5TQXhMamd4Tnl3d0xqRXdNaUF5TGpjME9Td3RNQzQ1TWpRZ2JDQXdMalkxTXl3dE1DNDNNVGdnZWlJTkNpQWdJR2xrUFNKd1lYUm9Nams1TlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptWm1abVk3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejQ9KSBuby1yZXBlYXQgNTAlfS5lbW90ZS1tZW51IC5pY29uLXJlc2l6ZS1oYW5kbGV7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVFlpRFFvZ0lDQm9aV2xuYUhROUlqRTJJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJREUySURFMklnMEtJQ0FnYVdROUlrTmhjR0ZmTVNJTkNpQWdJSGh0YkRwemNHRmpaVDBpY0hKbGMyVnlkbVVpUGp4dFpYUmhaR0YwWVEwS0lDQWdhV1E5SW0xbGRHRmtZWFJoTkRNMU55SStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pRek5UVWlJQzgrRFFvOGNHRjBhQTBLSUNBZ1pEMGlUU0F4TXk0MUxEZ2dReUF4TXk0eU1qVXNPQ0F4TXl3NExqSXlOQ0F4TXl3NExqVWdkaUF6TGpjNU15Qk1JRE11TnpBM0xETWdTQ0EzTGpVZ1F5QTNMamMzTml3eklEZ3NNaTQzTnpZZ09Dd3lMalVnT0N3eUxqSXlOQ0EzTGpjM05pd3lJRGN1TlN3eUlHZ2dMVFVnVENBeUxqTXdPU3d5TGpBek9TQXlMakUxTERJdU1UUTBJREl1TVRRMkxESXVNVFEySURJdU1UUXpMREl1TVRVeUlESXVNRE01TERJdU16QTVJRElzTWk0MUlIWWdOU0JESURJc055NDNOellnTWk0eU1qUXNPQ0F5TGpVc09DQXlMamMzTml3NElETXNOeTQzTnpZZ015dzNMalVnVmlBekxqY3dOeUJNSURFeUxqSTVNeXd4TXlCSUlEZ3VOU0JESURndU1qSTBMREV6SURnc01UTXVNakkxSURnc01UTXVOU0E0TERFekxqYzNOU0E0TGpJeU5Dd3hOQ0E0TGpVc01UUWdhQ0ExSUd3Z01DNHhPVEVzTFRBdU1ETTVJR01nTUM0eE1qRXNMVEF1TURVeElEQXVNaklzTFRBdU1UUTRJREF1TWpjc0xUQXVNamNnVENBeE5Dd3hNeTQxTURJZ1ZpQTRMalVnUXlBeE5DdzRMakl5TkNBeE15NDNOelVzT0NBeE15NDFMRGdnZWlJTkNpQWdJR2xrUFNKd1lYUm9ORE0xTVNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptWm1abVk3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejQ9KSBuby1yZXBlYXQgNTAlO2N1cnNvcjpud3NlLXJlc2l6ZSFpbXBvcnRhbnR9LmVtb3RlLW1lbnUgLmljb24tcGlue2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTVRZaURRb2dJQ0JvWldsbmFIUTlJakUySWcwS0lDQWdhV1E5SW5OMlp6TXdNRFVpUGcwS0lDQThiV1YwWVdSaGRHRU5DaUFnSUNBZ2FXUTlJbTFsZEdGa1lYUmhNekF5TXlJK0RRb2dJQ0FnUEhKa1pqcFNSRVkrRFFvZ0lDQWdJQ0E4WTJNNlYyOXlhdzBLSUNBZ0lDQWdJQ0FnY21SbU9tRmliM1YwUFNJaVBnMEtJQ0FnSUNBZ0lDQThaR002Wm05eWJXRjBQbWx0WVdkbEwzTjJaeXQ0Yld3OEwyUmpPbVp2Y20xaGRENE5DaUFnSUNBZ0lDQWdQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJQ0FnY21SbU9uSmxjMjkxY21ObFBTSm9kSFJ3T2k4dmNIVnliQzV2Y21jdlpHTXZaR050YVhSNWNHVXZVM1JwYkd4SmJXRm5aU0lnTHo0TkNpQWdJQ0FnSUNBZ1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStEUW9nSUNBZ0lDQThMMk5qT2xkdmNtcytEUW9nSUNBZ1BDOXlaR1k2VWtSR1BnMEtJQ0E4TDIxbGRHRmtZWFJoUGcwS0lDQThaR1ZtY3cwS0lDQWdJQ0JwWkQwaVpHVm1jek13TWpFaUlDOCtEUW9nSUR4bkRRb2dJQ0FnSUhSeVlXNXpabTl5YlQwaWJXRjBjbWw0S0RBdU56a3pNRGM0TWl3d0xEQXNNQzQzT1RNd056Z3lMQzB5TGpFM01EazROU3d0T0RFMExqWTVNams1S1NJTkNpQWdJQ0FnYVdROUltY3pNREEzSWo0TkNpQWdJQ0E4WncwS0lDQWdJQ0FnSUhSeVlXNXpabTl5YlQwaWJXRjBjbWw0S0RBdU56QTNNVEVzTUM0M01EY3hNU3d0TUM0M01EY3hNU3d3TGpjd056RXhMRGN6Tnk0M01EYzFOU3d5T1RVdU5EZzRNRGdwSWcwS0lDQWdJQ0FnSUdsa1BTSm5NekF3T1NJK0RRb2dJQ0FnSUNBOFp3MEtJQ0FnSUNBZ0lDQWdhV1E5SW1jek56VTFJajROQ2lBZ0lDQWdJQ0FnUEhCaGRHZ05DaUFnSUNBZ0lDQWdJQ0FnWkQwaVRTQTVMamM0TVRJMUxEQWdReUE1TGpRM05EQTFOaklzTUM0Mk9Ea3hNVElnT1M0MU1qQTJPQ3d4TGpVeU16QTROVE1nT1M0ek1USTFMREl1TVRnM05TQk1JRFF1T1RNM05TdzJMalU1TXpjMUlFTWdNeTQ1TlRnNU5qQTRMRFl1TkRJNU5EZ3pJREl1T1RRM056VTBPQ3cyTGpVek1qYzRPVGtnTWl3MkxqZ3hNalVnVENBMUxqQXpNVEkxTERrdU9EUXpOelVnTUM0MU5qSTFMREUwTGpNeE1qVWdNQ3d4TmlCRElEQXVOVFk1TWprMk1qZ3NNVFV1TnprMU5qSTJJREV1TVRZM056TTNPQ3d4TlM0Mk5EQXlNemNnTVM0M01UZzNOU3d4TlM0ME1EWXlOU0JNSURZdU1UVTJNalVzTVRBdU9UWTROelVnT1M0eE9EYzFMREUwSUdNZ01DNHlOemsyT0RJekxDMHdMamswTnpjNE15QXdMak00TXpFMU1qZ3NMVEV1T1RVNE9UTTNJREF1TWpFNE56VXNMVEl1T1RNM05TQXhMalV3TURBeE1Td3RNUzQwT0RrMU56azRJRE11TURBd01EQXhMQzB5TGprM09URTFPU0EwTGpVc0xUUXVORFk0TnpVZ01DNDJNREV4TURJc0xUQXVNRE14TXpZeElERXVPREl5TVRNNExDMHdMakE1TmpFek55QXlMQzB3TGpRMk9EYzFJRU1nTVRNdU9EYzVPRGt5TERRdU1EWTVORGd3TXlBeE1TNDROREk0TmpVc01pNHdNakF5TWpneUlEa3VOemd4TWpVc01DQjZJZzBLSUNBZ0lDQWdJQ0FnSUNCMGNtRnVjMlp2Y20wOUltMWhkSEpwZUNnd0xqZzVNVFU1TXpjMExDMHdMamc1TVRVNU16YzBMREF1T0RreE5Ua3pOelFzTUM0NE9URTFPVE0zTkN3dE1pNHlOalUxTERFd016Y3VNVE0wTlNraURRb2dJQ0FnSUNBZ0lDQWdJR2xrUFNKd1lYUm9NekF4TVNJTkNpQWdJQ0FnSUNBZ0lDQWdjM1I1YkdVOUltWnBiR3c2STJabVptWm1aanRtYVd4c0xXOXdZV05wZEhrNk1TSWdMejROQ2lBZ0lDQWdJRHd2Wno0TkNpQWdJQ0E4TDJjK0RRb2dJRHd2Wno0TkNqd3ZjM1puUGcwSykgbm8tcmVwZWF0IDUwJTstd2Via2l0LXRyYW5zaXRpb246YWxsIC4yNXMgZWFzZTt0cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2V9LmVtb3RlLW1lbnUgLmljb24tcGluOmhvdmVyLC5lbW90ZS1tZW51LnBpbm5lZCAuaWNvbi1waW57LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7LW1zLXRyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTt0cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7b3BhY2l0eToxfS5lbW90ZS1tZW51IC5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbntwYWRkaW5nLXJpZ2h0OjA7cGFkZGluZy1ib3R0b206MH0uZW1vdGUtbWVudSAuc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6IzU1NTtvcGFjaXR5Oi4yO3otaW5kZXg6MX1cIikpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIEhvZ2FuID0gcmVxdWlyZSgnaG9nYW4uanMvbGliL3RlbXBsYXRlLmpzJyk7XG4gICAgdmFyIHRlbXBsYXRlcyA9IHt9O1xuICAgIHRlbXBsYXRlc1snZW1vdGUnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZW1vdGVcIik7aWYodC5zKHQuZihcInRoaXJkUGFydHlcIixjLHAsMSksYyxwLDAsMzIsNDQsXCJ7eyB9fVwiKSl7dC5ycyhjLHAsZnVuY3Rpb24oYyxwLHQpe3QuYihcIiB0aGlyZC1wYXJ0eVwiKTt9KTtjLnBvcCgpO310LmIoXCJcXFwiIGRhdGEtZW1vdGU9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiIHRpdGxlPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7aWYodC5zKHQuZihcInRoaXJkUGFydHlcIixjLHAsMSksYyxwLDAsMTEzLDEzNixcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIChmcm9tIDNyZCBwYXJ0eSBhZGRvbilcIik7fSk7Yy5wb3AoKTt9dC5iKFwiXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgc3R5bGU9XFxcImJhY2tncm91bmQtaW1hZ2U6IHVybChcIik7dC5iKHQudCh0LmQoXCJpbWFnZS51cmxcIixjLHAsMCkpKTt0LmIoXCIpOyBoZWlnaHQ6IFwiKTt0LmIodC50KHQuZChcImltYWdlLmhlaWdodFwiLGMscCwwKSkpO3QuYihcInB4OyB3aWR0aDogXCIpO3QuYih0LnQodC5kKFwiaW1hZ2Uud2lkdGhcIixjLHAsMCkpKTt0LmIoXCJweFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVCdXR0b24nXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGJ1dHRvbiBjbGFzcz1cXFwiYnV0dG9uIGdseXBoLW9ubHkgZmxvYXQtbGVmdFxcXCIgdGl0bGU9XFxcIkVtb3RlIE1lbnVcXFwiIGlkPVxcXCJlbW90ZS1tZW51LWJ1dHRvblxcXCI+PC9idXR0b24+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVHcm91cEhlYWRlciddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTtpZih0LnModC5mKFwiaXNBZGRvbkhlYWRlclwiLGMscCwxKSxjLHAsMCwxOCwyMTgsXCJ7eyB9fVwiKSl7dC5ycyhjLHAsZnVuY3Rpb24oYyxwLHQpe3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyIGFkZG9uLWVtb3Rlcy1oZWFkZXJcXFwiIHRpdGxlPVxcXCJCZWxvdyBhcmUgZW1vdGVzIGFkZGVkIGJ5IGFuIGFkZG9uLiBPbmx5IHRob3NlIHdobyBhbHNvIGhhdmUgdGhlIHNhbWUgYWRkb24gaW5zdGFsbGVkIGNhbiBzZWUgdGhlc2UgZW1vdGVzIGluIGNoYXQuXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0QWRkb24gRW1vdGVzXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt9KTtjLnBvcCgpO310LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTtpZighdC5zKHQuZihcImlzQWRkb25IZWFkZXJcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImdyb3VwLWhlYWRlclxcXCIgZGF0YS1lbW90ZS1jaGFubmVsPVxcXCJcIik7dC5iKHQudih0LmYoXCJjaGFubmVsXCIsYyxwLDApKSk7dC5iKFwiXFxcIj48aW1nIHNyYz1cXFwiXCIpO3QuYih0LnYodC5mKFwiYmFkZ2VcIixjLHAsMCkpKTt0LmIoXCJcXFwiIC8+XCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO307cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ21lbnUnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZW1vdGUtbWVudSBkcm9wbWVudVxcXCIgaWQ9XFxcImVtb3RlLW1lbnUtZm9yLXR3aXRjaFxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJkcmFnZ2FibGVcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyXFxcIj5BbGwgRW1vdGVzPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1jb250YWluZXIgc2Nyb2xsYWJsZVxcXCIgaWQ9XFxcImFsbC1lbW90ZXMtZ3JvdXBcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyXFxcIj5Qb3B1bGFyIEVtb3RlczwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtY29udGFpbmVyIHNpbmdsZS1yb3dcXFwiIGlkPVxcXCJwb3B1bGFyLWVtb3Rlcy1ncm91cFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJmb290ZXJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8YSBjbGFzcz1cXFwicHVsbC1sZWZ0IGljb24gaWNvbi1ob21lXFxcIiBocmVmPVxcXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgdGl0bGU9XFxcIlZpc2l0IHRoZSBob21lcGFnZSB3aGVyZSB5b3UgY2FuIGRvbmF0ZSwgcG9zdCBhIHJldmlldywgb3IgY29udGFjdCB0aGUgZGV2ZWxvcGVyXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLWxlZnQgaWNvbiBpY29uLXBpblxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtcGlubmVkXFxcIiB0aXRsZT1cXFwiUGluL3VucGluIHRoZSBlbW90ZSBtZW51IHRvIHRoZSBzY3JlZW5cXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGEgdGl0bGU9XFxcIlJlc2V0IHRoZSBwb3B1bGFyaXR5IG9mIHRoZSBlbW90ZXMgYmFjayB0byBkZWZhdWx0XFxcIiBkYXRhLWNvbW1hbmQ9XFxcInJlc2V0LXBvcHVsYXJpdHlcXFwiPlJlc2V0IFBvcHVsYXJpdHk8L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLXJpZ2h0IGljb24gaWNvbi1yZXNpemUtaGFuZGxlXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInJlc2l6ZS1oYW5kbGVcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ25ld3NNZXNzYWdlJ10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjxkaXYgY2xhc3M9XFxcInR3aXRjaC1jaGF0LWVtb3Rlcy1uZXdzXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFtcIik7dC5iKHQudih0LmYoXCJzY3JpcHROYW1lXCIsYyxwLDApKSk7dC5iKFwiXSBOZXdzOiBcIik7dC5iKHQudCh0LmYoXCJtZXNzYWdlXCIsYyxwLDApKSk7dC5iKFwiICg8YSBocmVmPVxcXCIjXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInR3aXRjaC1jaGF0LWVtb3RlczpkaXNtaXNzLW5ld3NcXFwiIGRhdGEtbmV3cy1pZD1cXFwiXCIpO3QuYih0LnYodC5mKFwiaWRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPkRpc21pc3M8L2E+KVxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICByZXR1cm4gdGVtcGxhdGVzO1xufSkoKTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKiEgaHR0cDovL210aHMuYmUvcHVueWNvZGUgdjEuMi40IGJ5IEBtYXRoaWFzICovXG47KGZ1bmN0aW9uKHJvb3QpIHtcblxuXHQvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGVzICovXG5cdHZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHM7XG5cdHZhciBmcmVlTW9kdWxlID0gdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiZcblx0XHRtb2R1bGUuZXhwb3J0cyA9PSBmcmVlRXhwb3J0cyAmJiBtb2R1bGU7XG5cdHZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWw7XG5cdGlmIChmcmVlR2xvYmFsLmdsb2JhbCA9PT0gZnJlZUdsb2JhbCB8fCBmcmVlR2xvYmFsLndpbmRvdyA9PT0gZnJlZUdsb2JhbCkge1xuXHRcdHJvb3QgPSBmcmVlR2xvYmFsO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBgcHVueWNvZGVgIG9iamVjdC5cblx0ICogQG5hbWUgcHVueWNvZGVcblx0ICogQHR5cGUgT2JqZWN0XG5cdCAqL1xuXHR2YXIgcHVueWNvZGUsXG5cblx0LyoqIEhpZ2hlc3QgcG9zaXRpdmUgc2lnbmVkIDMyLWJpdCBmbG9hdCB2YWx1ZSAqL1xuXHRtYXhJbnQgPSAyMTQ3NDgzNjQ3LCAvLyBha2EuIDB4N0ZGRkZGRkYgb3IgMl4zMS0xXG5cblx0LyoqIEJvb3RzdHJpbmcgcGFyYW1ldGVycyAqL1xuXHRiYXNlID0gMzYsXG5cdHRNaW4gPSAxLFxuXHR0TWF4ID0gMjYsXG5cdHNrZXcgPSAzOCxcblx0ZGFtcCA9IDcwMCxcblx0aW5pdGlhbEJpYXMgPSA3Mixcblx0aW5pdGlhbE4gPSAxMjgsIC8vIDB4ODBcblx0ZGVsaW1pdGVyID0gJy0nLCAvLyAnXFx4MkQnXG5cblx0LyoqIFJlZ3VsYXIgZXhwcmVzc2lvbnMgKi9cblx0cmVnZXhQdW55Y29kZSA9IC9eeG4tLS8sXG5cdHJlZ2V4Tm9uQVNDSUkgPSAvW14gLX5dLywgLy8gdW5wcmludGFibGUgQVNDSUkgY2hhcnMgKyBub24tQVNDSUkgY2hhcnNcblx0cmVnZXhTZXBhcmF0b3JzID0gL1xceDJFfFxcdTMwMDJ8XFx1RkYwRXxcXHVGRjYxL2csIC8vIFJGQyAzNDkwIHNlcGFyYXRvcnNcblxuXHQvKiogRXJyb3IgbWVzc2FnZXMgKi9cblx0ZXJyb3JzID0ge1xuXHRcdCdvdmVyZmxvdyc6ICdPdmVyZmxvdzogaW5wdXQgbmVlZHMgd2lkZXIgaW50ZWdlcnMgdG8gcHJvY2VzcycsXG5cdFx0J25vdC1iYXNpYyc6ICdJbGxlZ2FsIGlucHV0ID49IDB4ODAgKG5vdCBhIGJhc2ljIGNvZGUgcG9pbnQpJyxcblx0XHQnaW52YWxpZC1pbnB1dCc6ICdJbnZhbGlkIGlucHV0J1xuXHR9LFxuXG5cdC8qKiBDb252ZW5pZW5jZSBzaG9ydGN1dHMgKi9cblx0YmFzZU1pbnVzVE1pbiA9IGJhc2UgLSB0TWluLFxuXHRmbG9vciA9IE1hdGguZmxvb3IsXG5cdHN0cmluZ0Zyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUsXG5cblx0LyoqIFRlbXBvcmFyeSB2YXJpYWJsZSAqL1xuXHRrZXk7XG5cblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblx0LyoqXG5cdCAqIEEgZ2VuZXJpYyBlcnJvciB1dGlsaXR5IGZ1bmN0aW9uLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBUaGUgZXJyb3IgdHlwZS5cblx0ICogQHJldHVybnMge0Vycm9yfSBUaHJvd3MgYSBgUmFuZ2VFcnJvcmAgd2l0aCB0aGUgYXBwbGljYWJsZSBlcnJvciBtZXNzYWdlLlxuXHQgKi9cblx0ZnVuY3Rpb24gZXJyb3IodHlwZSkge1xuXHRcdHRocm93IFJhbmdlRXJyb3IoZXJyb3JzW3R5cGVdKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBIGdlbmVyaWMgYEFycmF5I21hcGAgdXRpbGl0eSBmdW5jdGlvbi5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5IGFycmF5XG5cdCAqIGl0ZW0uXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgYXJyYXkgb2YgdmFsdWVzIHJldHVybmVkIGJ5IHRoZSBjYWxsYmFjayBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIG1hcChhcnJheSwgZm4pIHtcblx0XHR2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXHRcdHdoaWxlIChsZW5ndGgtLSkge1xuXHRcdFx0YXJyYXlbbGVuZ3RoXSA9IGZuKGFycmF5W2xlbmd0aF0pO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJyYXk7XG5cdH1cblxuXHQvKipcblx0ICogQSBzaW1wbGUgYEFycmF5I21hcGAtbGlrZSB3cmFwcGVyIHRvIHdvcmsgd2l0aCBkb21haW4gbmFtZSBzdHJpbmdzLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBkb21haW4gbmFtZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5XG5cdCAqIGNoYXJhY3Rlci5cblx0ICogQHJldHVybnMge0FycmF5fSBBIG5ldyBzdHJpbmcgb2YgY2hhcmFjdGVycyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2tcblx0ICogZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBtYXBEb21haW4oc3RyaW5nLCBmbikge1xuXHRcdHJldHVybiBtYXAoc3RyaW5nLnNwbGl0KHJlZ2V4U2VwYXJhdG9ycyksIGZuKS5qb2luKCcuJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhbiBhcnJheSBjb250YWluaW5nIHRoZSBudW1lcmljIGNvZGUgcG9pbnRzIG9mIGVhY2ggVW5pY29kZVxuXHQgKiBjaGFyYWN0ZXIgaW4gdGhlIHN0cmluZy4gV2hpbGUgSmF2YVNjcmlwdCB1c2VzIFVDUy0yIGludGVybmFsbHksXG5cdCAqIHRoaXMgZnVuY3Rpb24gd2lsbCBjb252ZXJ0IGEgcGFpciBvZiBzdXJyb2dhdGUgaGFsdmVzIChlYWNoIG9mIHdoaWNoXG5cdCAqIFVDUy0yIGV4cG9zZXMgYXMgc2VwYXJhdGUgY2hhcmFjdGVycykgaW50byBhIHNpbmdsZSBjb2RlIHBvaW50LFxuXHQgKiBtYXRjaGluZyBVVEYtMTYuXG5cdCAqIEBzZWUgYHB1bnljb2RlLnVjczIuZW5jb2RlYFxuXHQgKiBAc2VlIDxodHRwOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nPlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGUudWNzMlxuXHQgKiBAbmFtZSBkZWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0cmluZyBUaGUgVW5pY29kZSBpbnB1dCBzdHJpbmcgKFVDUy0yKS5cblx0ICogQHJldHVybnMge0FycmF5fSBUaGUgbmV3IGFycmF5IG9mIGNvZGUgcG9pbnRzLlxuXHQgKi9cblx0ZnVuY3Rpb24gdWNzMmRlY29kZShzdHJpbmcpIHtcblx0XHR2YXIgb3V0cHV0ID0gW10sXG5cdFx0ICAgIGNvdW50ZXIgPSAwLFxuXHRcdCAgICBsZW5ndGggPSBzdHJpbmcubGVuZ3RoLFxuXHRcdCAgICB2YWx1ZSxcblx0XHQgICAgZXh0cmE7XG5cdFx0d2hpbGUgKGNvdW50ZXIgPCBsZW5ndGgpIHtcblx0XHRcdHZhbHVlID0gc3RyaW5nLmNoYXJDb2RlQXQoY291bnRlcisrKTtcblx0XHRcdGlmICh2YWx1ZSA+PSAweEQ4MDAgJiYgdmFsdWUgPD0gMHhEQkZGICYmIGNvdW50ZXIgPCBsZW5ndGgpIHtcblx0XHRcdFx0Ly8gaGlnaCBzdXJyb2dhdGUsIGFuZCB0aGVyZSBpcyBhIG5leHQgY2hhcmFjdGVyXG5cdFx0XHRcdGV4dHJhID0gc3RyaW5nLmNoYXJDb2RlQXQoY291bnRlcisrKTtcblx0XHRcdFx0aWYgKChleHRyYSAmIDB4RkMwMCkgPT0gMHhEQzAwKSB7IC8vIGxvdyBzdXJyb2dhdGVcblx0XHRcdFx0XHRvdXRwdXQucHVzaCgoKHZhbHVlICYgMHgzRkYpIDw8IDEwKSArIChleHRyYSAmIDB4M0ZGKSArIDB4MTAwMDApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIHVubWF0Y2hlZCBzdXJyb2dhdGU7IG9ubHkgYXBwZW5kIHRoaXMgY29kZSB1bml0LCBpbiBjYXNlIHRoZSBuZXh0XG5cdFx0XHRcdFx0Ly8gY29kZSB1bml0IGlzIHRoZSBoaWdoIHN1cnJvZ2F0ZSBvZiBhIHN1cnJvZ2F0ZSBwYWlyXG5cdFx0XHRcdFx0b3V0cHV0LnB1c2godmFsdWUpO1xuXHRcdFx0XHRcdGNvdW50ZXItLTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0b3V0cHV0LnB1c2godmFsdWUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gb3V0cHV0O1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYSBzdHJpbmcgYmFzZWQgb24gYW4gYXJyYXkgb2YgbnVtZXJpYyBjb2RlIHBvaW50cy5cblx0ICogQHNlZSBgcHVueWNvZGUudWNzMi5kZWNvZGVgXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG5cdCAqIEBuYW1lIGVuY29kZVxuXHQgKiBAcGFyYW0ge0FycmF5fSBjb2RlUG9pbnRzIFRoZSBhcnJheSBvZiBudW1lcmljIGNvZGUgcG9pbnRzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgbmV3IFVuaWNvZGUgc3RyaW5nIChVQ1MtMikuXG5cdCAqL1xuXHRmdW5jdGlvbiB1Y3MyZW5jb2RlKGFycmF5KSB7XG5cdFx0cmV0dXJuIG1hcChhcnJheSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdHZhciBvdXRwdXQgPSAnJztcblx0XHRcdGlmICh2YWx1ZSA+IDB4RkZGRikge1xuXHRcdFx0XHR2YWx1ZSAtPSAweDEwMDAwO1xuXHRcdFx0XHRvdXRwdXQgKz0gc3RyaW5nRnJvbUNoYXJDb2RlKHZhbHVlID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKTtcblx0XHRcdFx0dmFsdWUgPSAweERDMDAgfCB2YWx1ZSAmIDB4M0ZGO1xuXHRcdFx0fVxuXHRcdFx0b3V0cHV0ICs9IHN0cmluZ0Zyb21DaGFyQ29kZSh2YWx1ZSk7XG5cdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdH0pLmpvaW4oJycpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgYmFzaWMgY29kZSBwb2ludCBpbnRvIGEgZGlnaXQvaW50ZWdlci5cblx0ICogQHNlZSBgZGlnaXRUb0Jhc2ljKClgXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlUG9pbnQgVGhlIGJhc2ljIG51bWVyaWMgY29kZSBwb2ludCB2YWx1ZS5cblx0ICogQHJldHVybnMge051bWJlcn0gVGhlIG51bWVyaWMgdmFsdWUgb2YgYSBiYXNpYyBjb2RlIHBvaW50IChmb3IgdXNlIGluXG5cdCAqIHJlcHJlc2VudGluZyBpbnRlZ2VycykgaW4gdGhlIHJhbmdlIGAwYCB0byBgYmFzZSAtIDFgLCBvciBgYmFzZWAgaWZcblx0ICogdGhlIGNvZGUgcG9pbnQgZG9lcyBub3QgcmVwcmVzZW50IGEgdmFsdWUuXG5cdCAqL1xuXHRmdW5jdGlvbiBiYXNpY1RvRGlnaXQoY29kZVBvaW50KSB7XG5cdFx0aWYgKGNvZGVQb2ludCAtIDQ4IDwgMTApIHtcblx0XHRcdHJldHVybiBjb2RlUG9pbnQgLSAyMjtcblx0XHR9XG5cdFx0aWYgKGNvZGVQb2ludCAtIDY1IDwgMjYpIHtcblx0XHRcdHJldHVybiBjb2RlUG9pbnQgLSA2NTtcblx0XHR9XG5cdFx0aWYgKGNvZGVQb2ludCAtIDk3IDwgMjYpIHtcblx0XHRcdHJldHVybiBjb2RlUG9pbnQgLSA5Nztcblx0XHR9XG5cdFx0cmV0dXJuIGJhc2U7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBkaWdpdC9pbnRlZ2VyIGludG8gYSBiYXNpYyBjb2RlIHBvaW50LlxuXHQgKiBAc2VlIGBiYXNpY1RvRGlnaXQoKWBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGRpZ2l0IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludC5cblx0ICogQHJldHVybnMge051bWJlcn0gVGhlIGJhc2ljIGNvZGUgcG9pbnQgd2hvc2UgdmFsdWUgKHdoZW4gdXNlZCBmb3Jcblx0ICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpcyBgZGlnaXRgLCB3aGljaCBuZWVkcyB0byBiZSBpbiB0aGUgcmFuZ2Vcblx0ICogYDBgIHRvIGBiYXNlIC0gMWAuIElmIGBmbGFnYCBpcyBub24temVybywgdGhlIHVwcGVyY2FzZSBmb3JtIGlzXG5cdCAqIHVzZWQ7IGVsc2UsIHRoZSBsb3dlcmNhc2UgZm9ybSBpcyB1c2VkLiBUaGUgYmVoYXZpb3IgaXMgdW5kZWZpbmVkXG5cdCAqIGlmIGBmbGFnYCBpcyBub24temVybyBhbmQgYGRpZ2l0YCBoYXMgbm8gdXBwZXJjYXNlIGZvcm0uXG5cdCAqL1xuXHRmdW5jdGlvbiBkaWdpdFRvQmFzaWMoZGlnaXQsIGZsYWcpIHtcblx0XHQvLyAgMC4uMjUgbWFwIHRvIEFTQ0lJIGEuLnogb3IgQS4uWlxuXHRcdC8vIDI2Li4zNSBtYXAgdG8gQVNDSUkgMC4uOVxuXHRcdHJldHVybiBkaWdpdCArIDIyICsgNzUgKiAoZGlnaXQgPCAyNikgLSAoKGZsYWcgIT0gMCkgPDwgNSk7XG5cdH1cblxuXHQvKipcblx0ICogQmlhcyBhZGFwdGF0aW9uIGZ1bmN0aW9uIGFzIHBlciBzZWN0aW9uIDMuNCBvZiBSRkMgMzQ5Mi5cblx0ICogaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzQ5MiNzZWN0aW9uLTMuNFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWRhcHQoZGVsdGEsIG51bVBvaW50cywgZmlyc3RUaW1lKSB7XG5cdFx0dmFyIGsgPSAwO1xuXHRcdGRlbHRhID0gZmlyc3RUaW1lID8gZmxvb3IoZGVsdGEgLyBkYW1wKSA6IGRlbHRhID4+IDE7XG5cdFx0ZGVsdGEgKz0gZmxvb3IoZGVsdGEgLyBudW1Qb2ludHMpO1xuXHRcdGZvciAoLyogbm8gaW5pdGlhbGl6YXRpb24gKi87IGRlbHRhID4gYmFzZU1pbnVzVE1pbiAqIHRNYXggPj4gMTsgayArPSBiYXNlKSB7XG5cdFx0XHRkZWx0YSA9IGZsb29yKGRlbHRhIC8gYmFzZU1pbnVzVE1pbik7XG5cdFx0fVxuXHRcdHJldHVybiBmbG9vcihrICsgKGJhc2VNaW51c1RNaW4gKyAxKSAqIGRlbHRhIC8gKGRlbHRhICsgc2tldykpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scyB0byBhIHN0cmluZyBvZiBVbmljb2RlXG5cdCAqIHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGRlY29kZShpbnB1dCkge1xuXHRcdC8vIERvbid0IHVzZSBVQ1MtMlxuXHRcdHZhciBvdXRwdXQgPSBbXSxcblx0XHQgICAgaW5wdXRMZW5ndGggPSBpbnB1dC5sZW5ndGgsXG5cdFx0ICAgIG91dCxcblx0XHQgICAgaSA9IDAsXG5cdFx0ICAgIG4gPSBpbml0aWFsTixcblx0XHQgICAgYmlhcyA9IGluaXRpYWxCaWFzLFxuXHRcdCAgICBiYXNpYyxcblx0XHQgICAgaixcblx0XHQgICAgaW5kZXgsXG5cdFx0ICAgIG9sZGksXG5cdFx0ICAgIHcsXG5cdFx0ICAgIGssXG5cdFx0ICAgIGRpZ2l0LFxuXHRcdCAgICB0LFxuXHRcdCAgICAvKiogQ2FjaGVkIGNhbGN1bGF0aW9uIHJlc3VsdHMgKi9cblx0XHQgICAgYmFzZU1pbnVzVDtcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHM6IGxldCBgYmFzaWNgIGJlIHRoZSBudW1iZXIgb2YgaW5wdXQgY29kZVxuXHRcdC8vIHBvaW50cyBiZWZvcmUgdGhlIGxhc3QgZGVsaW1pdGVyLCBvciBgMGAgaWYgdGhlcmUgaXMgbm9uZSwgdGhlbiBjb3B5XG5cdFx0Ly8gdGhlIGZpcnN0IGJhc2ljIGNvZGUgcG9pbnRzIHRvIHRoZSBvdXRwdXQuXG5cblx0XHRiYXNpYyA9IGlucHV0Lmxhc3RJbmRleE9mKGRlbGltaXRlcik7XG5cdFx0aWYgKGJhc2ljIDwgMCkge1xuXHRcdFx0YmFzaWMgPSAwO1xuXHRcdH1cblxuXHRcdGZvciAoaiA9IDA7IGogPCBiYXNpYzsgKytqKSB7XG5cdFx0XHQvLyBpZiBpdCdzIG5vdCBhIGJhc2ljIGNvZGUgcG9pbnRcblx0XHRcdGlmIChpbnB1dC5jaGFyQ29kZUF0KGopID49IDB4ODApIHtcblx0XHRcdFx0ZXJyb3IoJ25vdC1iYXNpYycpO1xuXHRcdFx0fVxuXHRcdFx0b3V0cHV0LnB1c2goaW5wdXQuY2hhckNvZGVBdChqKSk7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBkZWNvZGluZyBsb29wOiBzdGFydCBqdXN0IGFmdGVyIHRoZSBsYXN0IGRlbGltaXRlciBpZiBhbnkgYmFzaWMgY29kZVxuXHRcdC8vIHBvaW50cyB3ZXJlIGNvcGllZDsgc3RhcnQgYXQgdGhlIGJlZ2lubmluZyBvdGhlcndpc2UuXG5cblx0XHRmb3IgKGluZGV4ID0gYmFzaWMgPiAwID8gYmFzaWMgKyAxIDogMDsgaW5kZXggPCBpbnB1dExlbmd0aDsgLyogbm8gZmluYWwgZXhwcmVzc2lvbiAqLykge1xuXG5cdFx0XHQvLyBgaW5kZXhgIGlzIHRoZSBpbmRleCBvZiB0aGUgbmV4dCBjaGFyYWN0ZXIgdG8gYmUgY29uc3VtZWQuXG5cdFx0XHQvLyBEZWNvZGUgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlciBpbnRvIGBkZWx0YWAsXG5cdFx0XHQvLyB3aGljaCBnZXRzIGFkZGVkIHRvIGBpYC4gVGhlIG92ZXJmbG93IGNoZWNraW5nIGlzIGVhc2llclxuXHRcdFx0Ly8gaWYgd2UgaW5jcmVhc2UgYGlgIGFzIHdlIGdvLCB0aGVuIHN1YnRyYWN0IG9mZiBpdHMgc3RhcnRpbmdcblx0XHRcdC8vIHZhbHVlIGF0IHRoZSBlbmQgdG8gb2J0YWluIGBkZWx0YWAuXG5cdFx0XHRmb3IgKG9sZGkgPSBpLCB3ID0gMSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cblx0XHRcdFx0aWYgKGluZGV4ID49IGlucHV0TGVuZ3RoKSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ2ludmFsaWQtaW5wdXQnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRpZ2l0ID0gYmFzaWNUb0RpZ2l0KGlucHV0LmNoYXJDb2RlQXQoaW5kZXgrKykpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA+PSBiYXNlIHx8IGRpZ2l0ID4gZmxvb3IoKG1heEludCAtIGkpIC8gdykpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGkgKz0gZGlnaXQgKiB3O1xuXHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblxuXHRcdFx0XHRpZiAoZGlnaXQgPCB0KSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRiYXNlTWludXNUID0gYmFzZSAtIHQ7XG5cdFx0XHRcdGlmICh3ID4gZmxvb3IobWF4SW50IC8gYmFzZU1pbnVzVCkpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHcgKj0gYmFzZU1pbnVzVDtcblxuXHRcdFx0fVxuXG5cdFx0XHRvdXQgPSBvdXRwdXQubGVuZ3RoICsgMTtcblx0XHRcdGJpYXMgPSBhZGFwdChpIC0gb2xkaSwgb3V0LCBvbGRpID09IDApO1xuXG5cdFx0XHQvLyBgaWAgd2FzIHN1cHBvc2VkIHRvIHdyYXAgYXJvdW5kIGZyb20gYG91dGAgdG8gYDBgLFxuXHRcdFx0Ly8gaW5jcmVtZW50aW5nIGBuYCBlYWNoIHRpbWUsIHNvIHdlJ2xsIGZpeCB0aGF0IG5vdzpcblx0XHRcdGlmIChmbG9vcihpIC8gb3V0KSA+IG1heEludCAtIG4pIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdG4gKz0gZmxvb3IoaSAvIG91dCk7XG5cdFx0XHRpICU9IG91dDtcblxuXHRcdFx0Ly8gSW5zZXJ0IGBuYCBhdCBwb3NpdGlvbiBgaWAgb2YgdGhlIG91dHB1dFxuXHRcdFx0b3V0cHV0LnNwbGljZShpKyssIDAsIG4pO1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVjczJlbmNvZGUob3V0cHV0KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMgdG8gYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seVxuXHQgKiBzeW1ib2xzLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgcmVzdWx0aW5nIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqL1xuXHRmdW5jdGlvbiBlbmNvZGUoaW5wdXQpIHtcblx0XHR2YXIgbixcblx0XHQgICAgZGVsdGEsXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50LFxuXHRcdCAgICBiYXNpY0xlbmd0aCxcblx0XHQgICAgYmlhcyxcblx0XHQgICAgaixcblx0XHQgICAgbSxcblx0XHQgICAgcSxcblx0XHQgICAgayxcblx0XHQgICAgdCxcblx0XHQgICAgY3VycmVudFZhbHVlLFxuXHRcdCAgICBvdXRwdXQgPSBbXSxcblx0XHQgICAgLyoqIGBpbnB1dExlbmd0aGAgd2lsbCBob2xkIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgaW4gYGlucHV0YC4gKi9cblx0XHQgICAgaW5wdXRMZW5ndGgsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsXG5cdFx0ICAgIGJhc2VNaW51c1QsXG5cdFx0ICAgIHFNaW51c1Q7XG5cblx0XHQvLyBDb252ZXJ0IHRoZSBpbnB1dCBpbiBVQ1MtMiB0byBVbmljb2RlXG5cdFx0aW5wdXQgPSB1Y3MyZGVjb2RlKGlucHV0KTtcblxuXHRcdC8vIENhY2hlIHRoZSBsZW5ndGhcblx0XHRpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aDtcblxuXHRcdC8vIEluaXRpYWxpemUgdGhlIHN0YXRlXG5cdFx0biA9IGluaXRpYWxOO1xuXHRcdGRlbHRhID0gMDtcblx0XHRiaWFzID0gaW5pdGlhbEJpYXM7XG5cblx0XHQvLyBIYW5kbGUgdGhlIGJhc2ljIGNvZGUgcG9pbnRzXG5cdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdGN1cnJlbnRWYWx1ZSA9IGlucHV0W2pdO1xuXHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IDB4ODApIHtcblx0XHRcdFx0b3V0cHV0LnB1c2goc3RyaW5nRnJvbUNoYXJDb2RlKGN1cnJlbnRWYWx1ZSkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGhhbmRsZWRDUENvdW50ID0gYmFzaWNMZW5ndGggPSBvdXRwdXQubGVuZ3RoO1xuXG5cdFx0Ly8gYGhhbmRsZWRDUENvdW50YCBpcyB0aGUgbnVtYmVyIG9mIGNvZGUgcG9pbnRzIHRoYXQgaGF2ZSBiZWVuIGhhbmRsZWQ7XG5cdFx0Ly8gYGJhc2ljTGVuZ3RoYCBpcyB0aGUgbnVtYmVyIG9mIGJhc2ljIGNvZGUgcG9pbnRzLlxuXG5cdFx0Ly8gRmluaXNoIHRoZSBiYXNpYyBzdHJpbmcgLSBpZiBpdCBpcyBub3QgZW1wdHkgLSB3aXRoIGEgZGVsaW1pdGVyXG5cdFx0aWYgKGJhc2ljTGVuZ3RoKSB7XG5cdFx0XHRvdXRwdXQucHVzaChkZWxpbWl0ZXIpO1xuXHRcdH1cblxuXHRcdC8vIE1haW4gZW5jb2RpbmcgbG9vcDpcblx0XHR3aGlsZSAoaGFuZGxlZENQQ291bnQgPCBpbnB1dExlbmd0aCkge1xuXG5cdFx0XHQvLyBBbGwgbm9uLWJhc2ljIGNvZGUgcG9pbnRzIDwgbiBoYXZlIGJlZW4gaGFuZGxlZCBhbHJlYWR5LiBGaW5kIHRoZSBuZXh0XG5cdFx0XHQvLyBsYXJnZXIgb25lOlxuXHRcdFx0Zm9yIChtID0gbWF4SW50LCBqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRcdGlmIChjdXJyZW50VmFsdWUgPj0gbiAmJiBjdXJyZW50VmFsdWUgPCBtKSB7XG5cdFx0XHRcdFx0bSA9IGN1cnJlbnRWYWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJbmNyZWFzZSBgZGVsdGFgIGVub3VnaCB0byBhZHZhbmNlIHRoZSBkZWNvZGVyJ3MgPG4saT4gc3RhdGUgdG8gPG0sMD4sXG5cdFx0XHQvLyBidXQgZ3VhcmQgYWdhaW5zdCBvdmVyZmxvd1xuXHRcdFx0aGFuZGxlZENQQ291bnRQbHVzT25lID0gaGFuZGxlZENQQ291bnQgKyAxO1xuXHRcdFx0aWYgKG0gLSBuID4gZmxvb3IoKG1heEludCAtIGRlbHRhKSAvIGhhbmRsZWRDUENvdW50UGx1c09uZSkpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGRlbHRhICs9IChtIC0gbikgKiBoYW5kbGVkQ1BDb3VudFBsdXNPbmU7XG5cdFx0XHRuID0gbTtcblxuXHRcdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IG4gJiYgKytkZWx0YSA+IG1heEludCkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA9PSBuKSB7XG5cdFx0XHRcdFx0Ly8gUmVwcmVzZW50IGRlbHRhIGFzIGEgZ2VuZXJhbGl6ZWQgdmFyaWFibGUtbGVuZ3RoIGludGVnZXJcblx0XHRcdFx0XHRmb3IgKHEgPSBkZWx0YSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cdFx0XHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblx0XHRcdFx0XHRcdGlmIChxIDwgdCkge1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHFNaW51c1QgPSBxIC0gdDtcblx0XHRcdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0XHRcdG91dHB1dC5wdXNoKFxuXHRcdFx0XHRcdFx0XHRzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHQgKyBxTWludXNUICUgYmFzZU1pbnVzVCwgMCkpXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cSA9IGZsb29yKHFNaW51c1QgLyBiYXNlTWludXNUKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHEsIDApKSk7XG5cdFx0XHRcdFx0YmlhcyA9IGFkYXB0KGRlbHRhLCBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsIGhhbmRsZWRDUENvdW50ID09IGJhc2ljTGVuZ3RoKTtcblx0XHRcdFx0XHRkZWx0YSA9IDA7XG5cdFx0XHRcdFx0KytoYW5kbGVkQ1BDb3VudDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQrK2RlbHRhO1xuXHRcdFx0KytuO1xuXG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgZG9tYWluIG5hbWUgdG8gVW5pY29kZS4gT25seSB0aGVcblx0ICogUHVueWNvZGVkIHBhcnRzIG9mIHRoZSBkb21haW4gbmFtZSB3aWxsIGJlIGNvbnZlcnRlZCwgaS5lLiBpdCBkb2Vzbid0XG5cdCAqIG1hdHRlciBpZiB5b3UgY2FsbCBpdCBvbiBhIHN0cmluZyB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gY29udmVydGVkIHRvXG5cdCAqIFVuaWNvZGUuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBQdW55Y29kZSBkb21haW4gbmFtZSB0byBjb252ZXJ0IHRvIFVuaWNvZGUuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBVbmljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBQdW55Y29kZVxuXHQgKiBzdHJpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b1VuaWNvZGUoZG9tYWluKSB7XG5cdFx0cmV0dXJuIG1hcERvbWFpbihkb21haW4sIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdFx0cmV0dXJuIHJlZ2V4UHVueWNvZGUudGVzdChzdHJpbmcpXG5cdFx0XHRcdD8gZGVjb2RlKHN0cmluZy5zbGljZSg0KS50b0xvd2VyQ2FzZSgpKVxuXHRcdFx0XHQ6IHN0cmluZztcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFVuaWNvZGUgc3RyaW5nIHJlcHJlc2VudGluZyBhIGRvbWFpbiBuYW1lIHRvIFB1bnljb2RlLiBPbmx5IHRoZVxuXHQgKiBub24tQVNDSUkgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLCBpLmUuIGl0IGRvZXNuJ3Rcblx0ICogbWF0dGVyIGlmIHlvdSBjYWxsIGl0IHdpdGggYSBkb21haW4gdGhhdCdzIGFscmVhZHkgaW4gQVNDSUkuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZG9tYWluIFRoZSBkb21haW4gbmFtZSB0byBjb252ZXJ0LCBhcyBhIFVuaWNvZGUgc3RyaW5nLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgUHVueWNvZGUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIGRvbWFpbiBuYW1lLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9BU0NJSShkb21haW4pIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGRvbWFpbiwgZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRyZXR1cm4gcmVnZXhOb25BU0NJSS50ZXN0KHN0cmluZylcblx0XHRcdFx0PyAneG4tLScgKyBlbmNvZGUoc3RyaW5nKVxuXHRcdFx0XHQ6IHN0cmluZztcblx0XHR9KTtcblx0fVxuXG5cdC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG5cdC8qKiBEZWZpbmUgdGhlIHB1YmxpYyBBUEkgKi9cblx0cHVueWNvZGUgPSB7XG5cdFx0LyoqXG5cdFx0ICogQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBjdXJyZW50IFB1bnljb2RlLmpzIHZlcnNpb24gbnVtYmVyLlxuXHRcdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHRcdCAqIEB0eXBlIFN0cmluZ1xuXHRcdCAqL1xuXHRcdCd2ZXJzaW9uJzogJzEuMi40Jyxcblx0XHQvKipcblx0XHQgKiBBbiBvYmplY3Qgb2YgbWV0aG9kcyB0byBjb252ZXJ0IGZyb20gSmF2YVNjcmlwdCdzIGludGVybmFsIGNoYXJhY3RlclxuXHRcdCAqIHJlcHJlc2VudGF0aW9uIChVQ1MtMikgdG8gVW5pY29kZSBjb2RlIHBvaW50cywgYW5kIGJhY2suXG5cdFx0ICogQHNlZSA8aHR0cDovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBPYmplY3Rcblx0XHQgKi9cblx0XHQndWNzMic6IHtcblx0XHRcdCdkZWNvZGUnOiB1Y3MyZGVjb2RlLFxuXHRcdFx0J2VuY29kZSc6IHVjczJlbmNvZGVcblx0XHR9LFxuXHRcdCdkZWNvZGUnOiBkZWNvZGUsXG5cdFx0J2VuY29kZSc6IGVuY29kZSxcblx0XHQndG9BU0NJSSc6IHRvQVNDSUksXG5cdFx0J3RvVW5pY29kZSc6IHRvVW5pY29kZVxuXHR9O1xuXG5cdC8qKiBFeHBvc2UgYHB1bnljb2RlYCAqL1xuXHQvLyBTb21lIEFNRCBidWlsZCBvcHRpbWl6ZXJzLCBsaWtlIHIuanMsIGNoZWNrIGZvciBzcGVjaWZpYyBjb25kaXRpb24gcGF0dGVybnNcblx0Ly8gbGlrZSB0aGUgZm9sbG93aW5nOlxuXHRpZiAoXG5cdFx0dHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmXG5cdFx0dHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcgJiZcblx0XHRkZWZpbmUuYW1kXG5cdCkge1xuXHRcdGRlZmluZSgncHVueWNvZGUnLCBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBwdW55Y29kZTtcblx0XHR9KTtcblx0fSBlbHNlIGlmIChmcmVlRXhwb3J0cyAmJiAhZnJlZUV4cG9ydHMubm9kZVR5cGUpIHtcblx0XHRpZiAoZnJlZU1vZHVsZSkgeyAvLyBpbiBOb2RlLmpzIG9yIFJpbmdvSlMgdjAuOC4wK1xuXHRcdFx0ZnJlZU1vZHVsZS5leHBvcnRzID0gcHVueWNvZGU7XG5cdFx0fSBlbHNlIHsgLy8gaW4gTmFyd2hhbCBvciBSaW5nb0pTIHYwLjcuMC1cblx0XHRcdGZvciAoa2V5IGluIHB1bnljb2RlKSB7XG5cdFx0XHRcdHB1bnljb2RlLmhhc093blByb3BlcnR5KGtleSkgJiYgKGZyZWVFeHBvcnRzW2tleV0gPSBwdW55Y29kZVtrZXldKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7IC8vIGluIFJoaW5vIG9yIGEgd2ViIGJyb3dzZXJcblx0XHRyb290LnB1bnljb2RlID0gcHVueWNvZGU7XG5cdH1cblxufSh0aGlzKSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIElmIG9iai5oYXNPd25Qcm9wZXJ0eSBoYXMgYmVlbiBvdmVycmlkZGVuLCB0aGVuIGNhbGxpbmdcbi8vIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSB3aWxsIGJyZWFrLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvaXNzdWVzLzE3MDdcbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocXMsIHNlcCwgZXEsIG9wdGlvbnMpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIHZhciBvYmogPSB7fTtcblxuICBpZiAodHlwZW9mIHFzICE9PSAnc3RyaW5nJyB8fCBxcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IC9cXCsvZztcbiAgcXMgPSBxcy5zcGxpdChzZXApO1xuXG4gIHZhciBtYXhLZXlzID0gMTAwMDtcbiAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMubWF4S2V5cyA9PT0gJ251bWJlcicpIHtcbiAgICBtYXhLZXlzID0gb3B0aW9ucy5tYXhLZXlzO1xuICB9XG5cbiAgdmFyIGxlbiA9IHFzLmxlbmd0aDtcbiAgLy8gbWF4S2V5cyA8PSAwIG1lYW5zIHRoYXQgd2Ugc2hvdWxkIG5vdCBsaW1pdCBrZXlzIGNvdW50XG4gIGlmIChtYXhLZXlzID4gMCAmJiBsZW4gPiBtYXhLZXlzKSB7XG4gICAgbGVuID0gbWF4S2V5cztcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgeCA9IHFzW2ldLnJlcGxhY2UocmVnZXhwLCAnJTIwJyksXG4gICAgICAgIGlkeCA9IHguaW5kZXhPZihlcSksXG4gICAgICAgIGtzdHIsIHZzdHIsIGssIHY7XG5cbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGtzdHIgPSB4LnN1YnN0cigwLCBpZHgpO1xuICAgICAgdnN0ciA9IHguc3Vic3RyKGlkeCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrc3RyID0geDtcbiAgICAgIHZzdHIgPSAnJztcbiAgICB9XG5cbiAgICBrID0gZGVjb2RlVVJJQ29tcG9uZW50KGtzdHIpO1xuICAgIHYgPSBkZWNvZGVVUklDb21wb25lbnQodnN0cik7XG5cbiAgICBpZiAoIWhhc093blByb3BlcnR5KG9iaiwgaykpIHtcbiAgICAgIG9ialtrXSA9IHY7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgIG9ialtrXS5wdXNoKHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmpba10gPSBbb2JqW2tdLCB2XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RyaW5naWZ5UHJpbWl0aXZlID0gZnVuY3Rpb24odikge1xuICBzd2l0Y2ggKHR5cGVvZiB2KSB7XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiB2O1xuXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICByZXR1cm4gdiA/ICd0cnVlJyA6ICdmYWxzZSc7XG5cbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgcmV0dXJuIGlzRmluaXRlKHYpID8gdiA6ICcnO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnJztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIHNlcCwgZXEsIG5hbWUpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICBvYmogPSB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gbWFwKG9iamVjdEtleXMob2JqKSwgZnVuY3Rpb24oaykge1xuICAgICAgdmFyIGtzID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShrKSkgKyBlcTtcbiAgICAgIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgICAgcmV0dXJuIG1hcChvYmpba10sIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKHYpKTtcbiAgICAgICAgfSkuam9pbihzZXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmpba10pKTtcbiAgICAgIH1cbiAgICB9KS5qb2luKHNlcCk7XG5cbiAgfVxuXG4gIGlmICghbmFtZSkgcmV0dXJuICcnO1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShuYW1lKSkgKyBlcSArXG4gICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9iaikpO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbmZ1bmN0aW9uIG1hcCAoeHMsIGYpIHtcbiAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmKTtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzLnB1c2goZih4c1tpXSwgaSkpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4gcmVzO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5kZWNvZGUgPSBleHBvcnRzLnBhcnNlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbmV4cG9ydHMuZW5jb2RlID0gZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2VuY29kZScpO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBwdW55Y29kZSA9IHJlcXVpcmUoJ3B1bnljb2RlJyk7XG5cbmV4cG9ydHMucGFyc2UgPSB1cmxQYXJzZTtcbmV4cG9ydHMucmVzb2x2ZSA9IHVybFJlc29sdmU7XG5leHBvcnRzLnJlc29sdmVPYmplY3QgPSB1cmxSZXNvbHZlT2JqZWN0O1xuZXhwb3J0cy5mb3JtYXQgPSB1cmxGb3JtYXQ7XG5cbmV4cG9ydHMuVXJsID0gVXJsO1xuXG5mdW5jdGlvbiBVcmwoKSB7XG4gIHRoaXMucHJvdG9jb2wgPSBudWxsO1xuICB0aGlzLnNsYXNoZXMgPSBudWxsO1xuICB0aGlzLmF1dGggPSBudWxsO1xuICB0aGlzLmhvc3QgPSBudWxsO1xuICB0aGlzLnBvcnQgPSBudWxsO1xuICB0aGlzLmhvc3RuYW1lID0gbnVsbDtcbiAgdGhpcy5oYXNoID0gbnVsbDtcbiAgdGhpcy5zZWFyY2ggPSBudWxsO1xuICB0aGlzLnF1ZXJ5ID0gbnVsbDtcbiAgdGhpcy5wYXRobmFtZSA9IG51bGw7XG4gIHRoaXMucGF0aCA9IG51bGw7XG4gIHRoaXMuaHJlZiA9IG51bGw7XG59XG5cbi8vIFJlZmVyZW5jZTogUkZDIDM5ODYsIFJGQyAxODA4LCBSRkMgMjM5NlxuXG4vLyBkZWZpbmUgdGhlc2UgaGVyZSBzbyBhdCBsZWFzdCB0aGV5IG9ubHkgaGF2ZSB0byBiZVxuLy8gY29tcGlsZWQgb25jZSBvbiB0aGUgZmlyc3QgbW9kdWxlIGxvYWQuXG52YXIgcHJvdG9jb2xQYXR0ZXJuID0gL14oW2EtejAtOS4rLV0rOikvaSxcbiAgICBwb3J0UGF0dGVybiA9IC86WzAtOV0qJC8sXG5cbiAgICAvLyBSRkMgMjM5NjogY2hhcmFjdGVycyByZXNlcnZlZCBmb3IgZGVsaW1pdGluZyBVUkxzLlxuICAgIC8vIFdlIGFjdHVhbGx5IGp1c3QgYXV0by1lc2NhcGUgdGhlc2UuXG4gICAgZGVsaW1zID0gWyc8JywgJz4nLCAnXCInLCAnYCcsICcgJywgJ1xccicsICdcXG4nLCAnXFx0J10sXG5cbiAgICAvLyBSRkMgMjM5NjogY2hhcmFjdGVycyBub3QgYWxsb3dlZCBmb3IgdmFyaW91cyByZWFzb25zLlxuICAgIHVud2lzZSA9IFsneycsICd9JywgJ3wnLCAnXFxcXCcsICdeJywgJ2AnXS5jb25jYXQoZGVsaW1zKSxcblxuICAgIC8vIEFsbG93ZWQgYnkgUkZDcywgYnV0IGNhdXNlIG9mIFhTUyBhdHRhY2tzLiAgQWx3YXlzIGVzY2FwZSB0aGVzZS5cbiAgICBhdXRvRXNjYXBlID0gWydcXCcnXS5jb25jYXQodW53aXNlKSxcbiAgICAvLyBDaGFyYWN0ZXJzIHRoYXQgYXJlIG5ldmVyIGV2ZXIgYWxsb3dlZCBpbiBhIGhvc3RuYW1lLlxuICAgIC8vIE5vdGUgdGhhdCBhbnkgaW52YWxpZCBjaGFycyBhcmUgYWxzbyBoYW5kbGVkLCBidXQgdGhlc2VcbiAgICAvLyBhcmUgdGhlIG9uZXMgdGhhdCBhcmUgKmV4cGVjdGVkKiB0byBiZSBzZWVuLCBzbyB3ZSBmYXN0LXBhdGhcbiAgICAvLyB0aGVtLlxuICAgIG5vbkhvc3RDaGFycyA9IFsnJScsICcvJywgJz8nLCAnOycsICcjJ10uY29uY2F0KGF1dG9Fc2NhcGUpLFxuICAgIGhvc3RFbmRpbmdDaGFycyA9IFsnLycsICc/JywgJyMnXSxcbiAgICBob3N0bmFtZU1heExlbiA9IDI1NSxcbiAgICBob3N0bmFtZVBhcnRQYXR0ZXJuID0gL15bYS16MC05QS1aXy1dezAsNjN9JC8sXG4gICAgaG9zdG5hbWVQYXJ0U3RhcnQgPSAvXihbYS16MC05QS1aXy1dezAsNjN9KSguKikkLyxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBjYW4gYWxsb3cgXCJ1bnNhZmVcIiBhbmQgXCJ1bndpc2VcIiBjaGFycy5cbiAgICB1bnNhZmVQcm90b2NvbCA9IHtcbiAgICAgICdqYXZhc2NyaXB0JzogdHJ1ZSxcbiAgICAgICdqYXZhc2NyaXB0Oic6IHRydWVcbiAgICB9LFxuICAgIC8vIHByb3RvY29scyB0aGF0IG5ldmVyIGhhdmUgYSBob3N0bmFtZS5cbiAgICBob3N0bGVzc1Byb3RvY29sID0ge1xuICAgICAgJ2phdmFzY3JpcHQnOiB0cnVlLFxuICAgICAgJ2phdmFzY3JpcHQ6JzogdHJ1ZVxuICAgIH0sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgYWx3YXlzIGNvbnRhaW4gYSAvLyBiaXQuXG4gICAgc2xhc2hlZFByb3RvY29sID0ge1xuICAgICAgJ2h0dHAnOiB0cnVlLFxuICAgICAgJ2h0dHBzJzogdHJ1ZSxcbiAgICAgICdmdHAnOiB0cnVlLFxuICAgICAgJ2dvcGhlcic6IHRydWUsXG4gICAgICAnZmlsZSc6IHRydWUsXG4gICAgICAnaHR0cDonOiB0cnVlLFxuICAgICAgJ2h0dHBzOic6IHRydWUsXG4gICAgICAnZnRwOic6IHRydWUsXG4gICAgICAnZ29waGVyOic6IHRydWUsXG4gICAgICAnZmlsZTonOiB0cnVlXG4gICAgfSxcbiAgICBxdWVyeXN0cmluZyA9IHJlcXVpcmUoJ3F1ZXJ5c3RyaW5nJyk7XG5cbmZ1bmN0aW9uIHVybFBhcnNlKHVybCwgcGFyc2VRdWVyeVN0cmluZywgc2xhc2hlc0Rlbm90ZUhvc3QpIHtcbiAgaWYgKHVybCAmJiBpc09iamVjdCh1cmwpICYmIHVybCBpbnN0YW5jZW9mIFVybCkgcmV0dXJuIHVybDtcblxuICB2YXIgdSA9IG5ldyBVcmw7XG4gIHUucGFyc2UodXJsLCBwYXJzZVF1ZXJ5U3RyaW5nLCBzbGFzaGVzRGVub3RlSG9zdCk7XG4gIHJldHVybiB1O1xufVxuXG5VcmwucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24odXJsLCBwYXJzZVF1ZXJ5U3RyaW5nLCBzbGFzaGVzRGVub3RlSG9zdCkge1xuICBpZiAoIWlzU3RyaW5nKHVybCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUGFyYW1ldGVyICd1cmwnIG11c3QgYmUgYSBzdHJpbmcsIG5vdCBcIiArIHR5cGVvZiB1cmwpO1xuICB9XG5cbiAgdmFyIHJlc3QgPSB1cmw7XG5cbiAgLy8gdHJpbSBiZWZvcmUgcHJvY2VlZGluZy5cbiAgLy8gVGhpcyBpcyB0byBzdXBwb3J0IHBhcnNlIHN0dWZmIGxpa2UgXCIgIGh0dHA6Ly9mb28uY29tICBcXG5cIlxuICByZXN0ID0gcmVzdC50cmltKCk7XG5cbiAgdmFyIHByb3RvID0gcHJvdG9jb2xQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gIGlmIChwcm90bykge1xuICAgIHByb3RvID0gcHJvdG9bMF07XG4gICAgdmFyIGxvd2VyUHJvdG8gPSBwcm90by50b0xvd2VyQ2FzZSgpO1xuICAgIHRoaXMucHJvdG9jb2wgPSBsb3dlclByb3RvO1xuICAgIHJlc3QgPSByZXN0LnN1YnN0cihwcm90by5sZW5ndGgpO1xuICB9XG5cbiAgLy8gZmlndXJlIG91dCBpZiBpdCdzIGdvdCBhIGhvc3RcbiAgLy8gdXNlckBzZXJ2ZXIgaXMgKmFsd2F5cyogaW50ZXJwcmV0ZWQgYXMgYSBob3N0bmFtZSwgYW5kIHVybFxuICAvLyByZXNvbHV0aW9uIHdpbGwgdHJlYXQgLy9mb28vYmFyIGFzIGhvc3Q9Zm9vLHBhdGg9YmFyIGJlY2F1c2UgdGhhdCdzXG4gIC8vIGhvdyB0aGUgYnJvd3NlciByZXNvbHZlcyByZWxhdGl2ZSBVUkxzLlxuICBpZiAoc2xhc2hlc0Rlbm90ZUhvc3QgfHwgcHJvdG8gfHwgcmVzdC5tYXRjaCgvXlxcL1xcL1teQFxcL10rQFteQFxcL10rLykpIHtcbiAgICB2YXIgc2xhc2hlcyA9IHJlc3Quc3Vic3RyKDAsIDIpID09PSAnLy8nO1xuICAgIGlmIChzbGFzaGVzICYmICEocHJvdG8gJiYgaG9zdGxlc3NQcm90b2NvbFtwcm90b10pKSB7XG4gICAgICByZXN0ID0gcmVzdC5zdWJzdHIoMik7XG4gICAgICB0aGlzLnNsYXNoZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaG9zdGxlc3NQcm90b2NvbFtwcm90b10gJiZcbiAgICAgIChzbGFzaGVzIHx8IChwcm90byAmJiAhc2xhc2hlZFByb3RvY29sW3Byb3RvXSkpKSB7XG5cbiAgICAvLyB0aGVyZSdzIGEgaG9zdG5hbWUuXG4gICAgLy8gdGhlIGZpcnN0IGluc3RhbmNlIG9mIC8sID8sIDssIG9yICMgZW5kcyB0aGUgaG9zdC5cbiAgICAvL1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIEAgaW4gdGhlIGhvc3RuYW1lLCB0aGVuIG5vbi1ob3N0IGNoYXJzICphcmUqIGFsbG93ZWRcbiAgICAvLyB0byB0aGUgbGVmdCBvZiB0aGUgbGFzdCBAIHNpZ24sIHVubGVzcyBzb21lIGhvc3QtZW5kaW5nIGNoYXJhY3RlclxuICAgIC8vIGNvbWVzICpiZWZvcmUqIHRoZSBALXNpZ24uXG4gICAgLy8gVVJMcyBhcmUgb2Jub3hpb3VzLlxuICAgIC8vXG4gICAgLy8gZXg6XG4gICAgLy8gaHR0cDovL2FAYkBjLyA9PiB1c2VyOmFAYiBob3N0OmNcbiAgICAvLyBodHRwOi8vYUBiP0BjID0+IHVzZXI6YSBob3N0OmMgcGF0aDovP0BjXG5cbiAgICAvLyB2MC4xMiBUT0RPKGlzYWFjcyk6IFRoaXMgaXMgbm90IHF1aXRlIGhvdyBDaHJvbWUgZG9lcyB0aGluZ3MuXG4gICAgLy8gUmV2aWV3IG91ciB0ZXN0IGNhc2UgYWdhaW5zdCBicm93c2VycyBtb3JlIGNvbXByZWhlbnNpdmVseS5cblxuICAgIC8vIGZpbmQgdGhlIGZpcnN0IGluc3RhbmNlIG9mIGFueSBob3N0RW5kaW5nQ2hhcnNcbiAgICB2YXIgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaG9zdEVuZGluZ0NoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaGVjID0gcmVzdC5pbmRleE9mKGhvc3RFbmRpbmdDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpXG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgfVxuXG4gICAgLy8gYXQgdGhpcyBwb2ludCwgZWl0aGVyIHdlIGhhdmUgYW4gZXhwbGljaXQgcG9pbnQgd2hlcmUgdGhlXG4gICAgLy8gYXV0aCBwb3J0aW9uIGNhbm5vdCBnbyBwYXN0LCBvciB0aGUgbGFzdCBAIGNoYXIgaXMgdGhlIGRlY2lkZXIuXG4gICAgdmFyIGF1dGgsIGF0U2lnbjtcbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIGF0U2lnbiBjYW4gYmUgYW55d2hlcmUuXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGF0U2lnbiBtdXN0IGJlIGluIGF1dGggcG9ydGlvbi5cbiAgICAgIC8vIGh0dHA6Ly9hQGIvY0BkID0+IGhvc3Q6YiBhdXRoOmEgcGF0aDovY0BkXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJywgaG9zdEVuZCk7XG4gICAgfVxuXG4gICAgLy8gTm93IHdlIGhhdmUgYSBwb3J0aW9uIHdoaWNoIGlzIGRlZmluaXRlbHkgdGhlIGF1dGguXG4gICAgLy8gUHVsbCB0aGF0IG9mZi5cbiAgICBpZiAoYXRTaWduICE9PSAtMSkge1xuICAgICAgYXV0aCA9IHJlc3Quc2xpY2UoMCwgYXRTaWduKTtcbiAgICAgIHJlc3QgPSByZXN0LnNsaWNlKGF0U2lnbiArIDEpO1xuICAgICAgdGhpcy5hdXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KGF1dGgpO1xuICAgIH1cblxuICAgIC8vIHRoZSBob3N0IGlzIHRoZSByZW1haW5pbmcgdG8gdGhlIGxlZnQgb2YgdGhlIGZpcnN0IG5vbi1ob3N0IGNoYXJcbiAgICBob3N0RW5kID0gLTE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub25Ib3N0Q2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBoZWMgPSByZXN0LmluZGV4T2Yobm9uSG9zdENoYXJzW2ldKTtcbiAgICAgIGlmIChoZWMgIT09IC0xICYmIChob3N0RW5kID09PSAtMSB8fCBoZWMgPCBob3N0RW5kKSlcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICB9XG4gICAgLy8gaWYgd2Ugc3RpbGwgaGF2ZSBub3QgaGl0IGl0LCB0aGVuIHRoZSBlbnRpcmUgdGhpbmcgaXMgYSBob3N0LlxuICAgIGlmIChob3N0RW5kID09PSAtMSlcbiAgICAgIGhvc3RFbmQgPSByZXN0Lmxlbmd0aDtcblxuICAgIHRoaXMuaG9zdCA9IHJlc3Quc2xpY2UoMCwgaG9zdEVuZCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoaG9zdEVuZCk7XG5cbiAgICAvLyBwdWxsIG91dCBwb3J0LlxuICAgIHRoaXMucGFyc2VIb3N0KCk7XG5cbiAgICAvLyB3ZSd2ZSBpbmRpY2F0ZWQgdGhhdCB0aGVyZSBpcyBhIGhvc3RuYW1lLFxuICAgIC8vIHNvIGV2ZW4gaWYgaXQncyBlbXB0eSwgaXQgaGFzIHRvIGJlIHByZXNlbnQuXG4gICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUgfHwgJyc7XG5cbiAgICAvLyBpZiBob3N0bmFtZSBiZWdpbnMgd2l0aCBbIGFuZCBlbmRzIHdpdGggXVxuICAgIC8vIGFzc3VtZSB0aGF0IGl0J3MgYW4gSVB2NiBhZGRyZXNzLlxuICAgIHZhciBpcHY2SG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lWzBdID09PSAnWycgJiZcbiAgICAgICAgdGhpcy5ob3N0bmFtZVt0aGlzLmhvc3RuYW1lLmxlbmd0aCAtIDFdID09PSAnXSc7XG5cbiAgICAvLyB2YWxpZGF0ZSBhIGxpdHRsZS5cbiAgICBpZiAoIWlwdjZIb3N0bmFtZSkge1xuICAgICAgdmFyIGhvc3RwYXJ0cyA9IHRoaXMuaG9zdG5hbWUuc3BsaXQoL1xcLi8pO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBob3N0cGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBwYXJ0ID0gaG9zdHBhcnRzW2ldO1xuICAgICAgICBpZiAoIXBhcnQpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIXBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICB2YXIgbmV3cGFydCA9ICcnO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwLCBrID0gcGFydC5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChwYXJ0LmNoYXJDb2RlQXQoaikgPiAxMjcpIHtcbiAgICAgICAgICAgICAgLy8gd2UgcmVwbGFjZSBub24tQVNDSUkgY2hhciB3aXRoIGEgdGVtcG9yYXJ5IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgIC8vIHdlIG5lZWQgdGhpcyB0byBtYWtlIHN1cmUgc2l6ZSBvZiBob3N0bmFtZSBpcyBub3RcbiAgICAgICAgICAgICAgLy8gYnJva2VuIGJ5IHJlcGxhY2luZyBub24tQVNDSUkgYnkgbm90aGluZ1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9ICd4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gcGFydFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gd2UgdGVzdCBhZ2FpbiB3aXRoIEFTQ0lJIGNoYXIgb25seVxuICAgICAgICAgIGlmICghbmV3cGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFydHMgPSBob3N0cGFydHMuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB2YXIgbm90SG9zdCA9IGhvc3RwYXJ0cy5zbGljZShpICsgMSk7XG4gICAgICAgICAgICB2YXIgYml0ID0gcGFydC5tYXRjaChob3N0bmFtZVBhcnRTdGFydCk7XG4gICAgICAgICAgICBpZiAoYml0KSB7XG4gICAgICAgICAgICAgIHZhbGlkUGFydHMucHVzaChiaXRbMV0pO1xuICAgICAgICAgICAgICBub3RIb3N0LnVuc2hpZnQoYml0WzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3RIb3N0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXN0ID0gJy8nICsgbm90SG9zdC5qb2luKCcuJykgKyByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ob3N0bmFtZSA9IHZhbGlkUGFydHMuam9pbignLicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaG9zdG5hbWUubGVuZ3RoID4gaG9zdG5hbWVNYXhMZW4pIHtcbiAgICAgIHRoaXMuaG9zdG5hbWUgPSAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaG9zdG5hbWVzIGFyZSBhbHdheXMgbG93ZXIgY2FzZS5cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKCFpcHY2SG9zdG5hbWUpIHtcbiAgICAgIC8vIElETkEgU3VwcG9ydDogUmV0dXJucyBhIHB1bnkgY29kZWQgcmVwcmVzZW50YXRpb24gb2YgXCJkb21haW5cIi5cbiAgICAgIC8vIEl0IG9ubHkgY29udmVydHMgdGhlIHBhcnQgb2YgdGhlIGRvbWFpbiBuYW1lIHRoYXRcbiAgICAgIC8vIGhhcyBub24gQVNDSUkgY2hhcmFjdGVycy4gSS5lLiBpdCBkb3NlbnQgbWF0dGVyIGlmXG4gICAgICAvLyB5b3UgY2FsbCBpdCB3aXRoIGEgZG9tYWluIHRoYXQgYWxyZWFkeSBpcyBpbiBBU0NJSS5cbiAgICAgIHZhciBkb21haW5BcnJheSA9IHRoaXMuaG9zdG5hbWUuc3BsaXQoJy4nKTtcbiAgICAgIHZhciBuZXdPdXQgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZG9tYWluQXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHMgPSBkb21haW5BcnJheVtpXTtcbiAgICAgICAgbmV3T3V0LnB1c2gocy5tYXRjaCgvW15BLVphLXowLTlfLV0vKSA/XG4gICAgICAgICAgICAneG4tLScgKyBwdW55Y29kZS5lbmNvZGUocykgOiBzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSBuZXdPdXQuam9pbignLicpO1xuICAgIH1cblxuICAgIHZhciBwID0gdGhpcy5wb3J0ID8gJzonICsgdGhpcy5wb3J0IDogJyc7XG4gICAgdmFyIGggPSB0aGlzLmhvc3RuYW1lIHx8ICcnO1xuICAgIHRoaXMuaG9zdCA9IGggKyBwO1xuICAgIHRoaXMuaHJlZiArPSB0aGlzLmhvc3Q7XG5cbiAgICAvLyBzdHJpcCBbIGFuZCBdIGZyb20gdGhlIGhvc3RuYW1lXG4gICAgLy8gdGhlIGhvc3QgZmllbGQgc3RpbGwgcmV0YWlucyB0aGVtLCB0aG91Z2hcbiAgICBpZiAoaXB2Nkhvc3RuYW1lKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS5zdWJzdHIoMSwgdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIGlmIChyZXN0WzBdICE9PSAnLycpIHtcbiAgICAgICAgcmVzdCA9ICcvJyArIHJlc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gbm93IHJlc3QgaXMgc2V0IHRvIHRoZSBwb3N0LWhvc3Qgc3R1ZmYuXG4gIC8vIGNob3Agb2ZmIGFueSBkZWxpbSBjaGFycy5cbiAgaWYgKCF1bnNhZmVQcm90b2NvbFtsb3dlclByb3RvXSkge1xuXG4gICAgLy8gRmlyc3QsIG1ha2UgMTAwJSBzdXJlIHRoYXQgYW55IFwiYXV0b0VzY2FwZVwiIGNoYXJzIGdldFxuICAgIC8vIGVzY2FwZWQsIGV2ZW4gaWYgZW5jb2RlVVJJQ29tcG9uZW50IGRvZXNuJ3QgdGhpbmsgdGhleVxuICAgIC8vIG5lZWQgdG8gYmUuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdXRvRXNjYXBlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGFlID0gYXV0b0VzY2FwZVtpXTtcbiAgICAgIHZhciBlc2MgPSBlbmNvZGVVUklDb21wb25lbnQoYWUpO1xuICAgICAgaWYgKGVzYyA9PT0gYWUpIHtcbiAgICAgICAgZXNjID0gZXNjYXBlKGFlKTtcbiAgICAgIH1cbiAgICAgIHJlc3QgPSByZXN0LnNwbGl0KGFlKS5qb2luKGVzYyk7XG4gICAgfVxuICB9XG5cblxuICAvLyBjaG9wIG9mZiBmcm9tIHRoZSB0YWlsIGZpcnN0LlxuICB2YXIgaGFzaCA9IHJlc3QuaW5kZXhPZignIycpO1xuICBpZiAoaGFzaCAhPT0gLTEpIHtcbiAgICAvLyBnb3QgYSBmcmFnbWVudCBzdHJpbmcuXG4gICAgdGhpcy5oYXNoID0gcmVzdC5zdWJzdHIoaGFzaCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgaGFzaCk7XG4gIH1cbiAgdmFyIHFtID0gcmVzdC5pbmRleE9mKCc/Jyk7XG4gIGlmIChxbSAhPT0gLTEpIHtcbiAgICB0aGlzLnNlYXJjaCA9IHJlc3Quc3Vic3RyKHFtKTtcbiAgICB0aGlzLnF1ZXJ5ID0gcmVzdC5zdWJzdHIocW0gKyAxKTtcbiAgICBpZiAocGFyc2VRdWVyeVN0cmluZykge1xuICAgICAgdGhpcy5xdWVyeSA9IHF1ZXJ5c3RyaW5nLnBhcnNlKHRoaXMucXVlcnkpO1xuICAgIH1cbiAgICByZXN0ID0gcmVzdC5zbGljZSgwLCBxbSk7XG4gIH0gZWxzZSBpZiAocGFyc2VRdWVyeVN0cmluZykge1xuICAgIC8vIG5vIHF1ZXJ5IHN0cmluZywgYnV0IHBhcnNlUXVlcnlTdHJpbmcgc3RpbGwgcmVxdWVzdGVkXG4gICAgdGhpcy5zZWFyY2ggPSAnJztcbiAgICB0aGlzLnF1ZXJ5ID0ge307XG4gIH1cbiAgaWYgKHJlc3QpIHRoaXMucGF0aG5hbWUgPSByZXN0O1xuICBpZiAoc2xhc2hlZFByb3RvY29sW2xvd2VyUHJvdG9dICYmXG4gICAgICB0aGlzLmhvc3RuYW1lICYmICF0aGlzLnBhdGhuYW1lKSB7XG4gICAgdGhpcy5wYXRobmFtZSA9ICcvJztcbiAgfVxuXG4gIC8vdG8gc3VwcG9ydCBodHRwLnJlcXVlc3RcbiAgaWYgKHRoaXMucGF0aG5hbWUgfHwgdGhpcy5zZWFyY2gpIHtcbiAgICB2YXIgcCA9IHRoaXMucGF0aG5hbWUgfHwgJyc7XG4gICAgdmFyIHMgPSB0aGlzLnNlYXJjaCB8fCAnJztcbiAgICB0aGlzLnBhdGggPSBwICsgcztcbiAgfVxuXG4gIC8vIGZpbmFsbHksIHJlY29uc3RydWN0IHRoZSBocmVmIGJhc2VkIG9uIHdoYXQgaGFzIGJlZW4gdmFsaWRhdGVkLlxuICB0aGlzLmhyZWYgPSB0aGlzLmZvcm1hdCgpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGZvcm1hdCBhIHBhcnNlZCBvYmplY3QgaW50byBhIHVybCBzdHJpbmdcbmZ1bmN0aW9uIHVybEZvcm1hdChvYmopIHtcbiAgLy8gZW5zdXJlIGl0J3MgYW4gb2JqZWN0LCBhbmQgbm90IGEgc3RyaW5nIHVybC5cbiAgLy8gSWYgaXQncyBhbiBvYmosIHRoaXMgaXMgYSBuby1vcC5cbiAgLy8gdGhpcyB3YXksIHlvdSBjYW4gY2FsbCB1cmxfZm9ybWF0KCkgb24gc3RyaW5nc1xuICAvLyB0byBjbGVhbiB1cCBwb3RlbnRpYWxseSB3b25reSB1cmxzLlxuICBpZiAoaXNTdHJpbmcob2JqKSkgb2JqID0gdXJsUGFyc2Uob2JqKTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgVXJsKSkgcmV0dXJuIFVybC5wcm90b3R5cGUuZm9ybWF0LmNhbGwob2JqKTtcbiAgcmV0dXJuIG9iai5mb3JtYXQoKTtcbn1cblxuVXJsLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGF1dGggPSB0aGlzLmF1dGggfHwgJyc7XG4gIGlmIChhdXRoKSB7XG4gICAgYXV0aCA9IGVuY29kZVVSSUNvbXBvbmVudChhdXRoKTtcbiAgICBhdXRoID0gYXV0aC5yZXBsYWNlKC8lM0EvaSwgJzonKTtcbiAgICBhdXRoICs9ICdAJztcbiAgfVxuXG4gIHZhciBwcm90b2NvbCA9IHRoaXMucHJvdG9jb2wgfHwgJycsXG4gICAgICBwYXRobmFtZSA9IHRoaXMucGF0aG5hbWUgfHwgJycsXG4gICAgICBoYXNoID0gdGhpcy5oYXNoIHx8ICcnLFxuICAgICAgaG9zdCA9IGZhbHNlLFxuICAgICAgcXVlcnkgPSAnJztcblxuICBpZiAodGhpcy5ob3N0KSB7XG4gICAgaG9zdCA9IGF1dGggKyB0aGlzLmhvc3Q7XG4gIH0gZWxzZSBpZiAodGhpcy5ob3N0bmFtZSkge1xuICAgIGhvc3QgPSBhdXRoICsgKHRoaXMuaG9zdG5hbWUuaW5kZXhPZignOicpID09PSAtMSA/XG4gICAgICAgIHRoaXMuaG9zdG5hbWUgOlxuICAgICAgICAnWycgKyB0aGlzLmhvc3RuYW1lICsgJ10nKTtcbiAgICBpZiAodGhpcy5wb3J0KSB7XG4gICAgICBob3N0ICs9ICc6JyArIHRoaXMucG9ydDtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5xdWVyeSAmJlxuICAgICAgaXNPYmplY3QodGhpcy5xdWVyeSkgJiZcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMucXVlcnkpLmxlbmd0aCkge1xuICAgIHF1ZXJ5ID0gcXVlcnlzdHJpbmcuc3RyaW5naWZ5KHRoaXMucXVlcnkpO1xuICB9XG5cbiAgdmFyIHNlYXJjaCA9IHRoaXMuc2VhcmNoIHx8IChxdWVyeSAmJiAoJz8nICsgcXVlcnkpKSB8fCAnJztcblxuICBpZiAocHJvdG9jb2wgJiYgcHJvdG9jb2wuc3Vic3RyKC0xKSAhPT0gJzonKSBwcm90b2NvbCArPSAnOic7XG5cbiAgLy8gb25seSB0aGUgc2xhc2hlZFByb3RvY29scyBnZXQgdGhlIC8vLiAgTm90IG1haWx0bzosIHhtcHA6LCBldGMuXG4gIC8vIHVubGVzcyB0aGV5IGhhZCB0aGVtIHRvIGJlZ2luIHdpdGguXG4gIGlmICh0aGlzLnNsYXNoZXMgfHxcbiAgICAgICghcHJvdG9jb2wgfHwgc2xhc2hlZFByb3RvY29sW3Byb3RvY29sXSkgJiYgaG9zdCAhPT0gZmFsc2UpIHtcbiAgICBob3N0ID0gJy8vJyArIChob3N0IHx8ICcnKTtcbiAgICBpZiAocGF0aG5hbWUgJiYgcGF0aG5hbWUuY2hhckF0KDApICE9PSAnLycpIHBhdGhuYW1lID0gJy8nICsgcGF0aG5hbWU7XG4gIH0gZWxzZSBpZiAoIWhvc3QpIHtcbiAgICBob3N0ID0gJyc7XG4gIH1cblxuICBpZiAoaGFzaCAmJiBoYXNoLmNoYXJBdCgwKSAhPT0gJyMnKSBoYXNoID0gJyMnICsgaGFzaDtcbiAgaWYgKHNlYXJjaCAmJiBzZWFyY2guY2hhckF0KDApICE9PSAnPycpIHNlYXJjaCA9ICc/JyArIHNlYXJjaDtcblxuICBwYXRobmFtZSA9IHBhdGhuYW1lLnJlcGxhY2UoL1s/I10vZywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KG1hdGNoKTtcbiAgfSk7XG4gIHNlYXJjaCA9IHNlYXJjaC5yZXBsYWNlKCcjJywgJyUyMycpO1xuXG4gIHJldHVybiBwcm90b2NvbCArIGhvc3QgKyBwYXRobmFtZSArIHNlYXJjaCArIGhhc2g7XG59O1xuXG5mdW5jdGlvbiB1cmxSZXNvbHZlKHNvdXJjZSwgcmVsYXRpdmUpIHtcbiAgcmV0dXJuIHVybFBhcnNlKHNvdXJjZSwgZmFsc2UsIHRydWUpLnJlc29sdmUocmVsYXRpdmUpO1xufVxuXG5VcmwucHJvdG90eXBlLnJlc29sdmUgPSBmdW5jdGlvbihyZWxhdGl2ZSkge1xuICByZXR1cm4gdGhpcy5yZXNvbHZlT2JqZWN0KHVybFBhcnNlKHJlbGF0aXZlLCBmYWxzZSwgdHJ1ZSkpLmZvcm1hdCgpO1xufTtcblxuZnVuY3Rpb24gdXJsUmVzb2x2ZU9iamVjdChzb3VyY2UsIHJlbGF0aXZlKSB7XG4gIGlmICghc291cmNlKSByZXR1cm4gcmVsYXRpdmU7XG4gIHJldHVybiB1cmxQYXJzZShzb3VyY2UsIGZhbHNlLCB0cnVlKS5yZXNvbHZlT2JqZWN0KHJlbGF0aXZlKTtcbn1cblxuVXJsLnByb3RvdHlwZS5yZXNvbHZlT2JqZWN0ID0gZnVuY3Rpb24ocmVsYXRpdmUpIHtcbiAgaWYgKGlzU3RyaW5nKHJlbGF0aXZlKSkge1xuICAgIHZhciByZWwgPSBuZXcgVXJsKCk7XG4gICAgcmVsLnBhcnNlKHJlbGF0aXZlLCBmYWxzZSwgdHJ1ZSk7XG4gICAgcmVsYXRpdmUgPSByZWw7XG4gIH1cblxuICB2YXIgcmVzdWx0ID0gbmV3IFVybCgpO1xuICBPYmplY3Qua2V5cyh0aGlzKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICByZXN1bHRba10gPSB0aGlzW2tdO1xuICB9LCB0aGlzKTtcblxuICAvLyBoYXNoIGlzIGFsd2F5cyBvdmVycmlkZGVuLCBubyBtYXR0ZXIgd2hhdC5cbiAgLy8gZXZlbiBocmVmPVwiXCIgd2lsbCByZW1vdmUgaXQuXG4gIHJlc3VsdC5oYXNoID0gcmVsYXRpdmUuaGFzaDtcblxuICAvLyBpZiB0aGUgcmVsYXRpdmUgdXJsIGlzIGVtcHR5LCB0aGVuIHRoZXJlJ3Mgbm90aGluZyBsZWZ0IHRvIGRvIGhlcmUuXG4gIGlmIChyZWxhdGl2ZS5ocmVmID09PSAnJykge1xuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBocmVmcyBsaWtlIC8vZm9vL2JhciBhbHdheXMgY3V0IHRvIHRoZSBwcm90b2NvbC5cbiAgaWYgKHJlbGF0aXZlLnNsYXNoZXMgJiYgIXJlbGF0aXZlLnByb3RvY29sKSB7XG4gICAgLy8gdGFrZSBldmVyeXRoaW5nIGV4Y2VwdCB0aGUgcHJvdG9jb2wgZnJvbSByZWxhdGl2ZVxuICAgIE9iamVjdC5rZXlzKHJlbGF0aXZlKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIGlmIChrICE9PSAncHJvdG9jb2wnKVxuICAgICAgICByZXN1bHRba10gPSByZWxhdGl2ZVtrXTtcbiAgICB9KTtcblxuICAgIC8vdXJsUGFyc2UgYXBwZW5kcyB0cmFpbGluZyAvIHRvIHVybHMgbGlrZSBodHRwOi8vd3d3LmV4YW1wbGUuY29tXG4gICAgaWYgKHNsYXNoZWRQcm90b2NvbFtyZXN1bHQucHJvdG9jb2xdICYmXG4gICAgICAgIHJlc3VsdC5ob3N0bmFtZSAmJiAhcmVzdWx0LnBhdGhuYW1lKSB7XG4gICAgICByZXN1bHQucGF0aCA9IHJlc3VsdC5wYXRobmFtZSA9ICcvJztcbiAgICB9XG5cbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaWYgKHJlbGF0aXZlLnByb3RvY29sICYmIHJlbGF0aXZlLnByb3RvY29sICE9PSByZXN1bHQucHJvdG9jb2wpIHtcbiAgICAvLyBpZiBpdCdzIGEga25vd24gdXJsIHByb3RvY29sLCB0aGVuIGNoYW5naW5nXG4gICAgLy8gdGhlIHByb3RvY29sIGRvZXMgd2VpcmQgdGhpbmdzXG4gICAgLy8gZmlyc3QsIGlmIGl0J3Mgbm90IGZpbGU6LCB0aGVuIHdlIE1VU1QgaGF2ZSBhIGhvc3QsXG4gICAgLy8gYW5kIGlmIHRoZXJlIHdhcyBhIHBhdGhcbiAgICAvLyB0byBiZWdpbiB3aXRoLCB0aGVuIHdlIE1VU1QgaGF2ZSBhIHBhdGguXG4gICAgLy8gaWYgaXQgaXMgZmlsZTosIHRoZW4gdGhlIGhvc3QgaXMgZHJvcHBlZCxcbiAgICAvLyBiZWNhdXNlIHRoYXQncyBrbm93biB0byBiZSBob3N0bGVzcy5cbiAgICAvLyBhbnl0aGluZyBlbHNlIGlzIGFzc3VtZWQgdG8gYmUgYWJzb2x1dGUuXG4gICAgaWYgKCFzbGFzaGVkUHJvdG9jb2xbcmVsYXRpdmUucHJvdG9jb2xdKSB7XG4gICAgICBPYmplY3Qua2V5cyhyZWxhdGl2ZSkuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICAgIHJlc3VsdFtrXSA9IHJlbGF0aXZlW2tdO1xuICAgICAgfSk7XG4gICAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVzdWx0LnByb3RvY29sID0gcmVsYXRpdmUucHJvdG9jb2w7XG4gICAgaWYgKCFyZWxhdGl2ZS5ob3N0ICYmICFob3N0bGVzc1Byb3RvY29sW3JlbGF0aXZlLnByb3RvY29sXSkge1xuICAgICAgdmFyIHJlbFBhdGggPSAocmVsYXRpdmUucGF0aG5hbWUgfHwgJycpLnNwbGl0KCcvJyk7XG4gICAgICB3aGlsZSAocmVsUGF0aC5sZW5ndGggJiYgIShyZWxhdGl2ZS5ob3N0ID0gcmVsUGF0aC5zaGlmdCgpKSk7XG4gICAgICBpZiAoIXJlbGF0aXZlLmhvc3QpIHJlbGF0aXZlLmhvc3QgPSAnJztcbiAgICAgIGlmICghcmVsYXRpdmUuaG9zdG5hbWUpIHJlbGF0aXZlLmhvc3RuYW1lID0gJyc7XG4gICAgICBpZiAocmVsUGF0aFswXSAhPT0gJycpIHJlbFBhdGgudW5zaGlmdCgnJyk7XG4gICAgICBpZiAocmVsUGF0aC5sZW5ndGggPCAyKSByZWxQYXRoLnVuc2hpZnQoJycpO1xuICAgICAgcmVzdWx0LnBhdGhuYW1lID0gcmVsUGF0aC5qb2luKCcvJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRobmFtZSA9IHJlbGF0aXZlLnBhdGhuYW1lO1xuICAgIH1cbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICAgIHJlc3VsdC5ob3N0ID0gcmVsYXRpdmUuaG9zdCB8fCAnJztcbiAgICByZXN1bHQuYXV0aCA9IHJlbGF0aXZlLmF1dGg7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gcmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdDtcbiAgICByZXN1bHQucG9ydCA9IHJlbGF0aXZlLnBvcnQ7XG4gICAgLy8gdG8gc3VwcG9ydCBodHRwLnJlcXVlc3RcbiAgICBpZiAocmVzdWx0LnBhdGhuYW1lIHx8IHJlc3VsdC5zZWFyY2gpIHtcbiAgICAgIHZhciBwID0gcmVzdWx0LnBhdGhuYW1lIHx8ICcnO1xuICAgICAgdmFyIHMgPSByZXN1bHQuc2VhcmNoIHx8ICcnO1xuICAgICAgcmVzdWx0LnBhdGggPSBwICsgcztcbiAgICB9XG4gICAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICB2YXIgaXNTb3VyY2VBYnMgPSAocmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJyksXG4gICAgICBpc1JlbEFicyA9IChcbiAgICAgICAgICByZWxhdGl2ZS5ob3N0IHx8XG4gICAgICAgICAgcmVsYXRpdmUucGF0aG5hbWUgJiYgcmVsYXRpdmUucGF0aG5hbWUuY2hhckF0KDApID09PSAnLydcbiAgICAgICksXG4gICAgICBtdXN0RW5kQWJzID0gKGlzUmVsQWJzIHx8IGlzU291cmNlQWJzIHx8XG4gICAgICAgICAgICAgICAgICAgIChyZXN1bHQuaG9zdCAmJiByZWxhdGl2ZS5wYXRobmFtZSkpLFxuICAgICAgcmVtb3ZlQWxsRG90cyA9IG11c3RFbmRBYnMsXG4gICAgICBzcmNQYXRoID0gcmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5zcGxpdCgnLycpIHx8IFtdLFxuICAgICAgcmVsUGF0aCA9IHJlbGF0aXZlLnBhdGhuYW1lICYmIHJlbGF0aXZlLnBhdGhuYW1lLnNwbGl0KCcvJykgfHwgW10sXG4gICAgICBwc3ljaG90aWMgPSByZXN1bHQucHJvdG9jb2wgJiYgIXNsYXNoZWRQcm90b2NvbFtyZXN1bHQucHJvdG9jb2xdO1xuXG4gIC8vIGlmIHRoZSB1cmwgaXMgYSBub24tc2xhc2hlZCB1cmwsIHRoZW4gcmVsYXRpdmVcbiAgLy8gbGlua3MgbGlrZSAuLi8uLiBzaG91bGQgYmUgYWJsZVxuICAvLyB0byBjcmF3bCB1cCB0byB0aGUgaG9zdG5hbWUsIGFzIHdlbGwuICBUaGlzIGlzIHN0cmFuZ2UuXG4gIC8vIHJlc3VsdC5wcm90b2NvbCBoYXMgYWxyZWFkeSBiZWVuIHNldCBieSBub3cuXG4gIC8vIExhdGVyIG9uLCBwdXQgdGhlIGZpcnN0IHBhdGggcGFydCBpbnRvIHRoZSBob3N0IGZpZWxkLlxuICBpZiAocHN5Y2hvdGljKSB7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gJyc7XG4gICAgcmVzdWx0LnBvcnQgPSBudWxsO1xuICAgIGlmIChyZXN1bHQuaG9zdCkge1xuICAgICAgaWYgKHNyY1BhdGhbMF0gPT09ICcnKSBzcmNQYXRoWzBdID0gcmVzdWx0Lmhvc3Q7XG4gICAgICBlbHNlIHNyY1BhdGgudW5zaGlmdChyZXN1bHQuaG9zdCk7XG4gICAgfVxuICAgIHJlc3VsdC5ob3N0ID0gJyc7XG4gICAgaWYgKHJlbGF0aXZlLnByb3RvY29sKSB7XG4gICAgICByZWxhdGl2ZS5ob3N0bmFtZSA9IG51bGw7XG4gICAgICByZWxhdGl2ZS5wb3J0ID0gbnVsbDtcbiAgICAgIGlmIChyZWxhdGl2ZS5ob3N0KSB7XG4gICAgICAgIGlmIChyZWxQYXRoWzBdID09PSAnJykgcmVsUGF0aFswXSA9IHJlbGF0aXZlLmhvc3Q7XG4gICAgICAgIGVsc2UgcmVsUGF0aC51bnNoaWZ0KHJlbGF0aXZlLmhvc3QpO1xuICAgICAgfVxuICAgICAgcmVsYXRpdmUuaG9zdCA9IG51bGw7XG4gICAgfVxuICAgIG11c3RFbmRBYnMgPSBtdXN0RW5kQWJzICYmIChyZWxQYXRoWzBdID09PSAnJyB8fCBzcmNQYXRoWzBdID09PSAnJyk7XG4gIH1cblxuICBpZiAoaXNSZWxBYnMpIHtcbiAgICAvLyBpdCdzIGFic29sdXRlLlxuICAgIHJlc3VsdC5ob3N0ID0gKHJlbGF0aXZlLmhvc3QgfHwgcmVsYXRpdmUuaG9zdCA9PT0gJycpID9cbiAgICAgICAgICAgICAgICAgIHJlbGF0aXZlLmhvc3QgOiByZXN1bHQuaG9zdDtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSAocmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdG5hbWUgPT09ICcnKSA/XG4gICAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUuaG9zdG5hbWUgOiByZXN1bHQuaG9zdG5hbWU7XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICBzcmNQYXRoID0gcmVsUGF0aDtcbiAgICAvLyBmYWxsIHRocm91Z2ggdG8gdGhlIGRvdC1oYW5kbGluZyBiZWxvdy5cbiAgfSBlbHNlIGlmIChyZWxQYXRoLmxlbmd0aCkge1xuICAgIC8vIGl0J3MgcmVsYXRpdmVcbiAgICAvLyB0aHJvdyBhd2F5IHRoZSBleGlzdGluZyBmaWxlLCBhbmQgdGFrZSB0aGUgbmV3IHBhdGggaW5zdGVhZC5cbiAgICBpZiAoIXNyY1BhdGgpIHNyY1BhdGggPSBbXTtcbiAgICBzcmNQYXRoLnBvcCgpO1xuICAgIHNyY1BhdGggPSBzcmNQYXRoLmNvbmNhdChyZWxQYXRoKTtcbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICB9IGVsc2UgaWYgKCFpc051bGxPclVuZGVmaW5lZChyZWxhdGl2ZS5zZWFyY2gpKSB7XG4gICAgLy8ganVzdCBwdWxsIG91dCB0aGUgc2VhcmNoLlxuICAgIC8vIGxpa2UgaHJlZj0nP2ZvbycuXG4gICAgLy8gUHV0IHRoaXMgYWZ0ZXIgdGhlIG90aGVyIHR3byBjYXNlcyBiZWNhdXNlIGl0IHNpbXBsaWZpZXMgdGhlIGJvb2xlYW5zXG4gICAgaWYgKHBzeWNob3RpYykge1xuICAgICAgcmVzdWx0Lmhvc3RuYW1lID0gcmVzdWx0Lmhvc3QgPSBzcmNQYXRoLnNoaWZ0KCk7XG4gICAgICAvL29jY2F0aW9uYWx5IHRoZSBhdXRoIGNhbiBnZXQgc3R1Y2sgb25seSBpbiBob3N0XG4gICAgICAvL3RoaXMgZXNwZWNpYWx5IGhhcHBlbnMgaW4gY2FzZXMgbGlrZVxuICAgICAgLy91cmwucmVzb2x2ZU9iamVjdCgnbWFpbHRvOmxvY2FsMUBkb21haW4xJywgJ2xvY2FsMkBkb21haW4yJylcbiAgICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ob3N0LnNwbGl0KCdAJykgOiBmYWxzZTtcbiAgICAgIGlmIChhdXRoSW5Ib3N0KSB7XG4gICAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgICByZXN1bHQuaG9zdCA9IHJlc3VsdC5ob3N0bmFtZSA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKCFpc051bGwocmVzdWx0LnBhdGhuYW1lKSB8fCAhaXNOdWxsKHJlc3VsdC5zZWFyY2gpKSB7XG4gICAgICByZXN1bHQucGF0aCA9IChyZXN1bHQucGF0aG5hbWUgPyByZXN1bHQucGF0aG5hbWUgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgICAocmVzdWx0LnNlYXJjaCA/IHJlc3VsdC5zZWFyY2ggOiAnJyk7XG4gICAgfVxuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpZiAoIXNyY1BhdGgubGVuZ3RoKSB7XG4gICAgLy8gbm8gcGF0aCBhdCBhbGwuICBlYXN5LlxuICAgIC8vIHdlJ3ZlIGFscmVhZHkgaGFuZGxlZCB0aGUgb3RoZXIgc3R1ZmYgYWJvdmUuXG4gICAgcmVzdWx0LnBhdGhuYW1lID0gbnVsbDtcbiAgICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKHJlc3VsdC5zZWFyY2gpIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gJy8nICsgcmVzdWx0LnNlYXJjaDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnBhdGggPSBudWxsO1xuICAgIH1cbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gaWYgYSB1cmwgRU5EcyBpbiAuIG9yIC4uLCB0aGVuIGl0IG11c3QgZ2V0IGEgdHJhaWxpbmcgc2xhc2guXG4gIC8vIGhvd2V2ZXIsIGlmIGl0IGVuZHMgaW4gYW55dGhpbmcgZWxzZSBub24tc2xhc2h5LFxuICAvLyB0aGVuIGl0IG11c3QgTk9UIGdldCBhIHRyYWlsaW5nIHNsYXNoLlxuICB2YXIgbGFzdCA9IHNyY1BhdGguc2xpY2UoLTEpWzBdO1xuICB2YXIgaGFzVHJhaWxpbmdTbGFzaCA9IChcbiAgICAgIChyZXN1bHQuaG9zdCB8fCByZWxhdGl2ZS5ob3N0KSAmJiAobGFzdCA9PT0gJy4nIHx8IGxhc3QgPT09ICcuLicpIHx8XG4gICAgICBsYXN0ID09PSAnJyk7XG5cbiAgLy8gc3RyaXAgc2luZ2xlIGRvdHMsIHJlc29sdmUgZG91YmxlIGRvdHMgdG8gcGFyZW50IGRpclxuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gc3JjUGF0aC5sZW5ndGg7IGkgPj0gMDsgaS0tKSB7XG4gICAgbGFzdCA9IHNyY1BhdGhbaV07XG4gICAgaWYgKGxhc3QgPT0gJy4nKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoIW11c3RFbmRBYnMgJiYgIXJlbW92ZUFsbERvdHMpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHNyY1BhdGgudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICBpZiAobXVzdEVuZEFicyAmJiBzcmNQYXRoWzBdICE9PSAnJyAmJlxuICAgICAgKCFzcmNQYXRoWzBdIHx8IHNyY1BhdGhbMF0uY2hhckF0KDApICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC51bnNoaWZ0KCcnKTtcbiAgfVxuXG4gIGlmIChoYXNUcmFpbGluZ1NsYXNoICYmIChzcmNQYXRoLmpvaW4oJy8nKS5zdWJzdHIoLTEpICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC5wdXNoKCcnKTtcbiAgfVxuXG4gIHZhciBpc0Fic29sdXRlID0gc3JjUGF0aFswXSA9PT0gJycgfHxcbiAgICAgIChzcmNQYXRoWzBdICYmIHNyY1BhdGhbMF0uY2hhckF0KDApID09PSAnLycpO1xuXG4gIC8vIHB1dCB0aGUgaG9zdCBiYWNrXG4gIGlmIChwc3ljaG90aWMpIHtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IGlzQWJzb2x1dGUgPyAnJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNQYXRoLmxlbmd0aCA/IHNyY1BhdGguc2hpZnQoKSA6ICcnO1xuICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAvL3RoaXMgZXNwZWNpYWx5IGhhcHBlbnMgaW4gY2FzZXMgbGlrZVxuICAgIC8vdXJsLnJlc29sdmVPYmplY3QoJ21haWx0bzpsb2NhbDFAZG9tYWluMScsICdsb2NhbDJAZG9tYWluMicpXG4gICAgdmFyIGF1dGhJbkhvc3QgPSByZXN1bHQuaG9zdCAmJiByZXN1bHQuaG9zdC5pbmRleE9mKCdAJykgPiAwID9cbiAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ob3N0LnNwbGl0KCdAJykgOiBmYWxzZTtcbiAgICBpZiAoYXV0aEluSG9zdCkge1xuICAgICAgcmVzdWx0LmF1dGggPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgICByZXN1bHQuaG9zdCA9IHJlc3VsdC5ob3N0bmFtZSA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICB9XG4gIH1cblxuICBtdXN0RW5kQWJzID0gbXVzdEVuZEFicyB8fCAocmVzdWx0Lmhvc3QgJiYgc3JjUGF0aC5sZW5ndGgpO1xuXG4gIGlmIChtdXN0RW5kQWJzICYmICFpc0Fic29sdXRlKSB7XG4gICAgc3JjUGF0aC51bnNoaWZ0KCcnKTtcbiAgfVxuXG4gIGlmICghc3JjUGF0aC5sZW5ndGgpIHtcbiAgICByZXN1bHQucGF0aG5hbWUgPSBudWxsO1xuICAgIHJlc3VsdC5wYXRoID0gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICByZXN1bHQucGF0aG5hbWUgPSBzcmNQYXRoLmpvaW4oJy8nKTtcbiAgfVxuXG4gIC8vdG8gc3VwcG9ydCByZXF1ZXN0Lmh0dHBcbiAgaWYgKCFpc051bGwocmVzdWx0LnBhdGhuYW1lKSB8fCAhaXNOdWxsKHJlc3VsdC5zZWFyY2gpKSB7XG4gICAgcmVzdWx0LnBhdGggPSAocmVzdWx0LnBhdGhuYW1lID8gcmVzdWx0LnBhdGhuYW1lIDogJycpICtcbiAgICAgICAgICAgICAgICAgIChyZXN1bHQuc2VhcmNoID8gcmVzdWx0LnNlYXJjaCA6ICcnKTtcbiAgfVxuICByZXN1bHQuYXV0aCA9IHJlbGF0aXZlLmF1dGggfHwgcmVzdWx0LmF1dGg7XG4gIHJlc3VsdC5zbGFzaGVzID0gcmVzdWx0LnNsYXNoZXMgfHwgcmVsYXRpdmUuc2xhc2hlcztcbiAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5VcmwucHJvdG90eXBlLnBhcnNlSG9zdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaG9zdCA9IHRoaXMuaG9zdDtcbiAgdmFyIHBvcnQgPSBwb3J0UGF0dGVybi5leGVjKGhvc3QpO1xuICBpZiAocG9ydCkge1xuICAgIHBvcnQgPSBwb3J0WzBdO1xuICAgIGlmIChwb3J0ICE9PSAnOicpIHtcbiAgICAgIHRoaXMucG9ydCA9IHBvcnQuc3Vic3RyKDEpO1xuICAgIH1cbiAgICBob3N0ID0gaG9zdC5zdWJzdHIoMCwgaG9zdC5sZW5ndGggLSBwb3J0Lmxlbmd0aCk7XG4gIH1cbiAgaWYgKGhvc3QpIHRoaXMuaG9zdG5hbWUgPSBob3N0O1xufTtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSBcInN0cmluZ1wiO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiAgYXJnID09IG51bGw7XG59XG4iLCIvKlxuICogIENvcHlyaWdodCAyMDExIFR3aXR0ZXIsIEluYy5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBIb2dhbiA9IHt9O1xuXG4oZnVuY3Rpb24gKEhvZ2FuKSB7XG4gIEhvZ2FuLlRlbXBsYXRlID0gZnVuY3Rpb24gKGNvZGVPYmosIHRleHQsIGNvbXBpbGVyLCBvcHRpb25zKSB7XG4gICAgY29kZU9iaiA9IGNvZGVPYmogfHwge307XG4gICAgdGhpcy5yID0gY29kZU9iai5jb2RlIHx8IHRoaXMucjtcbiAgICB0aGlzLmMgPSBjb21waWxlcjtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMudGV4dCA9IHRleHQgfHwgJyc7XG4gICAgdGhpcy5wYXJ0aWFscyA9IGNvZGVPYmoucGFydGlhbHMgfHwge307XG4gICAgdGhpcy5zdWJzID0gY29kZU9iai5zdWJzIHx8IHt9O1xuICAgIHRoaXMuYnVmID0gJyc7XG4gIH1cblxuICBIb2dhbi5UZW1wbGF0ZS5wcm90b3R5cGUgPSB7XG4gICAgLy8gcmVuZGVyOiByZXBsYWNlZCBieSBnZW5lcmF0ZWQgY29kZS5cbiAgICByOiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkgeyByZXR1cm4gJyc7IH0sXG5cbiAgICAvLyB2YXJpYWJsZSBlc2NhcGluZ1xuICAgIHY6IGhvZ2FuRXNjYXBlLFxuXG4gICAgLy8gdHJpcGxlIHN0YWNoZVxuICAgIHQ6IGNvZXJjZVRvU3RyaW5nLFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgcmV0dXJuIHRoaXMucmkoW2NvbnRleHRdLCBwYXJ0aWFscyB8fCB7fSwgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gcmVuZGVyIGludGVybmFsIC0tIGEgaG9vayBmb3Igb3ZlcnJpZGVzIHRoYXQgY2F0Y2hlcyBwYXJ0aWFscyB0b29cbiAgICByaTogZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnIoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCk7XG4gICAgfSxcblxuICAgIC8vIGVuc3VyZVBhcnRpYWxcbiAgICBlcDogZnVuY3Rpb24oc3ltYm9sLCBwYXJ0aWFscykge1xuICAgICAgdmFyIHBhcnRpYWwgPSB0aGlzLnBhcnRpYWxzW3N5bWJvbF07XG5cbiAgICAgIC8vIGNoZWNrIHRvIHNlZSB0aGF0IGlmIHdlJ3ZlIGluc3RhbnRpYXRlZCB0aGlzIHBhcnRpYWwgYmVmb3JlXG4gICAgICB2YXIgdGVtcGxhdGUgPSBwYXJ0aWFsc1twYXJ0aWFsLm5hbWVdO1xuICAgICAgaWYgKHBhcnRpYWwuaW5zdGFuY2UgJiYgcGFydGlhbC5iYXNlID09IHRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsLmluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRlbXBsYXRlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICghdGhpcy5jKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gY29tcGlsZXIgYXZhaWxhYmxlLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuYy5jb21waWxlKHRlbXBsYXRlLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSB1c2UgdGhpcyB0byBjaGVjayB3aGV0aGVyIHRoZSBwYXJ0aWFscyBkaWN0aW9uYXJ5IGhhcyBjaGFuZ2VkXG4gICAgICB0aGlzLnBhcnRpYWxzW3N5bWJvbF0uYmFzZSA9IHRlbXBsYXRlO1xuXG4gICAgICBpZiAocGFydGlhbC5zdWJzKSB7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBjb25zaWRlciBwYXJlbnQgdGVtcGxhdGUgbm93XG4gICAgICAgIGlmICghcGFydGlhbHMuc3RhY2tUZXh0KSBwYXJ0aWFscy5zdGFja1RleHQgPSB7fTtcbiAgICAgICAgZm9yIChrZXkgaW4gcGFydGlhbC5zdWJzKSB7XG4gICAgICAgICAgaWYgKCFwYXJ0aWFscy5zdGFja1RleHRba2V5XSkge1xuICAgICAgICAgICAgcGFydGlhbHMuc3RhY2tUZXh0W2tleV0gPSAodGhpcy5hY3RpdmVTdWIgIT09IHVuZGVmaW5lZCAmJiBwYXJ0aWFscy5zdGFja1RleHRbdGhpcy5hY3RpdmVTdWJdKSA/IHBhcnRpYWxzLnN0YWNrVGV4dFt0aGlzLmFjdGl2ZVN1Yl0gOiB0aGlzLnRleHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gY3JlYXRlU3BlY2lhbGl6ZWRQYXJ0aWFsKHRlbXBsYXRlLCBwYXJ0aWFsLnN1YnMsIHBhcnRpYWwucGFydGlhbHMsXG4gICAgICAgICAgdGhpcy5zdGFja1N1YnMsIHRoaXMuc3RhY2tQYXJ0aWFscywgcGFydGlhbHMuc3RhY2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGFydGlhbHNbc3ltYm9sXS5pbnN0YW5jZSA9IHRlbXBsYXRlO1xuXG4gICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfSxcblxuICAgIC8vIHRyaWVzIHRvIGZpbmQgYSBwYXJ0aWFsIGluIHRoZSBjdXJyZW50IHNjb3BlIGFuZCByZW5kZXIgaXRcbiAgICBycDogZnVuY3Rpb24oc3ltYm9sLCBjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICB2YXIgcGFydGlhbCA9IHRoaXMuZXAoc3ltYm9sLCBwYXJ0aWFscyk7XG4gICAgICBpZiAoIXBhcnRpYWwpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGFydGlhbC5yaShjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gcmVuZGVyIGEgc2VjdGlvblxuICAgIHJzOiBmdW5jdGlvbihjb250ZXh0LCBwYXJ0aWFscywgc2VjdGlvbikge1xuICAgICAgdmFyIHRhaWwgPSBjb250ZXh0W2NvbnRleHQubGVuZ3RoIC0gMV07XG5cbiAgICAgIGlmICghaXNBcnJheSh0YWlsKSkge1xuICAgICAgICBzZWN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhaWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29udGV4dC5wdXNoKHRhaWxbaV0pO1xuICAgICAgICBzZWN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzKTtcbiAgICAgICAgY29udGV4dC5wb3AoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gbWF5YmUgc3RhcnQgYSBzZWN0aW9uXG4gICAgczogZnVuY3Rpb24odmFsLCBjdHgsIHBhcnRpYWxzLCBpbnZlcnRlZCwgc3RhcnQsIGVuZCwgdGFncykge1xuICAgICAgdmFyIHBhc3M7XG5cbiAgICAgIGlmIChpc0FycmF5KHZhbCkgJiYgdmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gdGhpcy5tcyh2YWwsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKTtcbiAgICAgIH1cblxuICAgICAgcGFzcyA9ICEhdmFsO1xuXG4gICAgICBpZiAoIWludmVydGVkICYmIHBhc3MgJiYgY3R4KSB7XG4gICAgICAgIGN0eC5wdXNoKCh0eXBlb2YgdmFsID09ICdvYmplY3QnKSA/IHZhbCA6IGN0eFtjdHgubGVuZ3RoIC0gMV0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGFzcztcbiAgICB9LFxuXG4gICAgLy8gZmluZCB2YWx1ZXMgd2l0aCBkb3R0ZWQgbmFtZXNcbiAgICBkOiBmdW5jdGlvbihrZXksIGN0eCwgcGFydGlhbHMsIHJldHVybkZvdW5kKSB7XG4gICAgICB2YXIgZm91bmQsXG4gICAgICAgICAgbmFtZXMgPSBrZXkuc3BsaXQoJy4nKSxcbiAgICAgICAgICB2YWwgPSB0aGlzLmYobmFtZXNbMF0sIGN0eCwgcGFydGlhbHMsIHJldHVybkZvdW5kKSxcbiAgICAgICAgICBkb01vZGVsR2V0ID0gdGhpcy5vcHRpb25zLm1vZGVsR2V0LFxuICAgICAgICAgIGN4ID0gbnVsbDtcblxuICAgICAgaWYgKGtleSA9PT0gJy4nICYmIGlzQXJyYXkoY3R4W2N0eC5sZW5ndGggLSAyXSkpIHtcbiAgICAgICAgdmFsID0gY3R4W2N0eC5sZW5ndGggLSAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmb3VuZCA9IGZpbmRJblNjb3BlKG5hbWVzW2ldLCB2YWwsIGRvTW9kZWxHZXQpO1xuICAgICAgICAgIGlmIChmb3VuZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjeCA9IHZhbDtcbiAgICAgICAgICAgIHZhbCA9IGZvdW5kO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWwgPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHJldHVybkZvdW5kICYmICF2YWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJldHVybkZvdW5kICYmIHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjdHgucHVzaChjeCk7XG4gICAgICAgIHZhbCA9IHRoaXMubXYodmFsLCBjdHgsIHBhcnRpYWxzKTtcbiAgICAgICAgY3R4LnBvcCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICAvLyBmaW5kIHZhbHVlcyB3aXRoIG5vcm1hbCBuYW1lc1xuICAgIGY6IGZ1bmN0aW9uKGtleSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpIHtcbiAgICAgIHZhciB2YWwgPSBmYWxzZSxcbiAgICAgICAgICB2ID0gbnVsbCxcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlLFxuICAgICAgICAgIGRvTW9kZWxHZXQgPSB0aGlzLm9wdGlvbnMubW9kZWxHZXQ7XG5cbiAgICAgIGZvciAodmFyIGkgPSBjdHgubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgdiA9IGN0eFtpXTtcbiAgICAgICAgdmFsID0gZmluZEluU2NvcGUoa2V5LCB2LCBkb01vZGVsR2V0KTtcbiAgICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgcmV0dXJuIChyZXR1cm5Gb3VuZCkgPyBmYWxzZSA6IFwiXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmV0dXJuRm91bmQgJiYgdHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbCA9IHRoaXMubXYodmFsLCBjdHgsIHBhcnRpYWxzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgLy8gaGlnaGVyIG9yZGVyIHRlbXBsYXRlc1xuICAgIGxzOiBmdW5jdGlvbihmdW5jLCBjeCwgcGFydGlhbHMsIHRleHQsIHRhZ3MpIHtcbiAgICAgIHZhciBvbGRUYWdzID0gdGhpcy5vcHRpb25zLmRlbGltaXRlcnM7XG5cbiAgICAgIHRoaXMub3B0aW9ucy5kZWxpbWl0ZXJzID0gdGFncztcbiAgICAgIHRoaXMuYih0aGlzLmN0KGNvZXJjZVRvU3RyaW5nKGZ1bmMuY2FsbChjeCwgdGV4dCkpLCBjeCwgcGFydGlhbHMpKTtcbiAgICAgIHRoaXMub3B0aW9ucy5kZWxpbWl0ZXJzID0gb2xkVGFncztcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBjb21waWxlIHRleHRcbiAgICBjdDogZnVuY3Rpb24odGV4dCwgY3gsIHBhcnRpYWxzKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmRpc2FibGVMYW1iZGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdMYW1iZGEgZmVhdHVyZXMgZGlzYWJsZWQuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5jLmNvbXBpbGUodGV4dCwgdGhpcy5vcHRpb25zKS5yZW5kZXIoY3gsIHBhcnRpYWxzKTtcbiAgICB9LFxuXG4gICAgLy8gdGVtcGxhdGUgcmVzdWx0IGJ1ZmZlcmluZ1xuICAgIGI6IGZ1bmN0aW9uKHMpIHsgdGhpcy5idWYgKz0gczsgfSxcblxuICAgIGZsOiBmdW5jdGlvbigpIHsgdmFyIHIgPSB0aGlzLmJ1ZjsgdGhpcy5idWYgPSAnJzsgcmV0dXJuIHI7IH0sXG5cbiAgICAvLyBtZXRob2QgcmVwbGFjZSBzZWN0aW9uXG4gICAgbXM6IGZ1bmN0aW9uKGZ1bmMsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKSB7XG4gICAgICB2YXIgdGV4dFNvdXJjZSxcbiAgICAgICAgICBjeCA9IGN0eFtjdHgubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5jYWxsKGN4KTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoaW52ZXJ0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0ZXh0U291cmNlID0gKHRoaXMuYWN0aXZlU3ViICYmIHRoaXMuc3Vic1RleHQgJiYgdGhpcy5zdWJzVGV4dFt0aGlzLmFjdGl2ZVN1Yl0pID8gdGhpcy5zdWJzVGV4dFt0aGlzLmFjdGl2ZVN1Yl0gOiB0aGlzLnRleHQ7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubHMocmVzdWx0LCBjeCwgcGFydGlhbHMsIHRleHRTb3VyY2Uuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpLCB0YWdzKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvLyBtZXRob2QgcmVwbGFjZSB2YXJpYWJsZVxuICAgIG12OiBmdW5jdGlvbihmdW5jLCBjdHgsIHBhcnRpYWxzKSB7XG4gICAgICB2YXIgY3ggPSBjdHhbY3R4Lmxlbmd0aCAtIDFdO1xuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuY2FsbChjeCk7XG5cbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3QoY29lcmNlVG9TdHJpbmcocmVzdWx0LmNhbGwoY3gpKSwgY3gsIHBhcnRpYWxzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgc3ViOiBmdW5jdGlvbihuYW1lLCBjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICB2YXIgZiA9IHRoaXMuc3Vic1tuYW1lXTtcbiAgICAgIGlmIChmKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlU3ViID0gbmFtZTtcbiAgICAgICAgZihjb250ZXh0LCBwYXJ0aWFscywgdGhpcywgaW5kZW50KTtcbiAgICAgICAgdGhpcy5hY3RpdmVTdWIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfTtcblxuICAvL0ZpbmQgYSBrZXkgaW4gYW4gb2JqZWN0XG4gIGZ1bmN0aW9uIGZpbmRJblNjb3BlKGtleSwgc2NvcGUsIGRvTW9kZWxHZXQpIHtcbiAgICB2YXIgdmFsO1xuXG4gICAgaWYgKHNjb3BlICYmIHR5cGVvZiBzY29wZSA9PSAnb2JqZWN0Jykge1xuXG4gICAgICBpZiAoc2NvcGVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhbCA9IHNjb3BlW2tleV07XG5cbiAgICAgIC8vIHRyeSBsb29rdXAgd2l0aCBnZXQgZm9yIGJhY2tib25lIG9yIHNpbWlsYXIgbW9kZWwgZGF0YVxuICAgICAgfSBlbHNlIGlmIChkb01vZGVsR2V0ICYmIHNjb3BlLmdldCAmJiB0eXBlb2Ygc2NvcGUuZ2V0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gc2NvcGUuZ2V0KGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNwZWNpYWxpemVkUGFydGlhbChpbnN0YW5jZSwgc3VicywgcGFydGlhbHMsIHN0YWNrU3Vicywgc3RhY2tQYXJ0aWFscywgc3RhY2tUZXh0KSB7XG4gICAgZnVuY3Rpb24gUGFydGlhbFRlbXBsYXRlKCkge307XG4gICAgUGFydGlhbFRlbXBsYXRlLnByb3RvdHlwZSA9IGluc3RhbmNlO1xuICAgIGZ1bmN0aW9uIFN1YnN0aXR1dGlvbnMoKSB7fTtcbiAgICBTdWJzdGl0dXRpb25zLnByb3RvdHlwZSA9IGluc3RhbmNlLnN1YnM7XG4gICAgdmFyIGtleTtcbiAgICB2YXIgcGFydGlhbCA9IG5ldyBQYXJ0aWFsVGVtcGxhdGUoKTtcbiAgICBwYXJ0aWFsLnN1YnMgPSBuZXcgU3Vic3RpdHV0aW9ucygpO1xuICAgIHBhcnRpYWwuc3Vic1RleHQgPSB7fTsgIC8vaGVoZS4gc3Vic3RleHQuXG4gICAgcGFydGlhbC5idWYgPSAnJztcblxuICAgIHN0YWNrU3VicyA9IHN0YWNrU3VicyB8fCB7fTtcbiAgICBwYXJ0aWFsLnN0YWNrU3VicyA9IHN0YWNrU3VicztcbiAgICBwYXJ0aWFsLnN1YnNUZXh0ID0gc3RhY2tUZXh0O1xuICAgIGZvciAoa2V5IGluIHN1YnMpIHtcbiAgICAgIGlmICghc3RhY2tTdWJzW2tleV0pIHN0YWNrU3Vic1trZXldID0gc3Vic1trZXldO1xuICAgIH1cbiAgICBmb3IgKGtleSBpbiBzdGFja1N1YnMpIHtcbiAgICAgIHBhcnRpYWwuc3Vic1trZXldID0gc3RhY2tTdWJzW2tleV07XG4gICAgfVxuXG4gICAgc3RhY2tQYXJ0aWFscyA9IHN0YWNrUGFydGlhbHMgfHwge307XG4gICAgcGFydGlhbC5zdGFja1BhcnRpYWxzID0gc3RhY2tQYXJ0aWFscztcbiAgICBmb3IgKGtleSBpbiBwYXJ0aWFscykge1xuICAgICAgaWYgKCFzdGFja1BhcnRpYWxzW2tleV0pIHN0YWNrUGFydGlhbHNba2V5XSA9IHBhcnRpYWxzW2tleV07XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHN0YWNrUGFydGlhbHMpIHtcbiAgICAgIHBhcnRpYWwucGFydGlhbHNba2V5XSA9IHN0YWNrUGFydGlhbHNba2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFydGlhbDtcbiAgfVxuXG4gIHZhciByQW1wID0gLyYvZyxcbiAgICAgIHJMdCA9IC88L2csXG4gICAgICByR3QgPSAvPi9nLFxuICAgICAgckFwb3MgPSAvXFwnL2csXG4gICAgICByUXVvdCA9IC9cXFwiL2csXG4gICAgICBoQ2hhcnMgPSAvWyY8PlxcXCJcXCddLztcblxuICBmdW5jdGlvbiBjb2VyY2VUb1N0cmluZyh2YWwpIHtcbiAgICByZXR1cm4gU3RyaW5nKCh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpID8gJycgOiB2YWwpO1xuICB9XG5cbiAgZnVuY3Rpb24gaG9nYW5Fc2NhcGUoc3RyKSB7XG4gICAgc3RyID0gY29lcmNlVG9TdHJpbmcoc3RyKTtcbiAgICByZXR1cm4gaENoYXJzLnRlc3Qoc3RyKSA/XG4gICAgICBzdHJcbiAgICAgICAgLnJlcGxhY2UockFtcCwgJyZhbXA7JylcbiAgICAgICAgLnJlcGxhY2Uockx0LCAnJmx0OycpXG4gICAgICAgIC5yZXBsYWNlKHJHdCwgJyZndDsnKVxuICAgICAgICAucmVwbGFjZShyQXBvcywgJyYjMzk7JylcbiAgICAgICAgLnJlcGxhY2UoclF1b3QsICcmcXVvdDsnKSA6XG4gICAgICBzdHI7XG4gIH1cblxuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24oYSkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbn0pKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiBIb2dhbik7XG4iLCIoZnVuY3Rpb24gKCQpIHtcblxuICAkLmZuLmN1c3RvbVNjcm9sbGJhciA9IGZ1bmN0aW9uIChvcHRpb25zLCBhcmdzKSB7XG5cbiAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICBza2luOiB1bmRlZmluZWQsXG4gICAgICBoU2Nyb2xsOiB0cnVlLFxuICAgICAgdlNjcm9sbDogdHJ1ZSxcbiAgICAgIHVwZGF0ZU9uV2luZG93UmVzaXplOiBmYWxzZSxcbiAgICAgIGFuaW1hdGlvblNwZWVkOiAzMDAsXG4gICAgICBvbkN1c3RvbVNjcm9sbDogdW5kZWZpbmVkLFxuICAgICAgc3dpcGVTcGVlZDogMSxcbiAgICAgIHdoZWVsU3BlZWQ6IDQwLFxuICAgICAgZml4ZWRUaHVtYldpZHRoOiB1bmRlZmluZWQsXG4gICAgICBmaXhlZFRodW1iSGVpZ2h0OiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICB2YXIgU2Nyb2xsYWJsZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICB0aGlzLmFkZFNjcm9sbGFibGVDbGFzcygpO1xuICAgICAgdGhpcy5hZGRTa2luQ2xhc3MoKTtcbiAgICAgIHRoaXMuYWRkU2Nyb2xsQmFyQ29tcG9uZW50cygpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy52U2Nyb2xsKVxuICAgICAgICB0aGlzLnZTY3JvbGxiYXIgPSBuZXcgU2Nyb2xsYmFyKHRoaXMsIG5ldyBWU2l6aW5nKCkpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5oU2Nyb2xsKVxuICAgICAgICB0aGlzLmhTY3JvbGxiYXIgPSBuZXcgU2Nyb2xsYmFyKHRoaXMsIG5ldyBIU2l6aW5nKCkpO1xuICAgICAgdGhpcy4kZWxlbWVudC5kYXRhKFwic2Nyb2xsYWJsZVwiLCB0aGlzKTtcbiAgICAgIHRoaXMuaW5pdEtleWJvYXJkU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9XG5cbiAgICBTY3JvbGxhYmxlLnByb3RvdHlwZSA9IHtcblxuICAgICAgYWRkU2Nyb2xsYWJsZUNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy4kZWxlbWVudC5oYXNDbGFzcyhcInNjcm9sbGFibGVcIikpIHtcbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGVBZGRlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyhcInNjcm9sbGFibGVcIik7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNjcm9sbGFibGVDbGFzczogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxhYmxlQWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhcInNjcm9sbGFibGVcIik7XG4gICAgICB9LFxuXG4gICAgICBhZGRTa2luQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZih0aGlzLm9wdGlvbnMuc2tpbikgPT0gXCJzdHJpbmdcIiAmJiAhdGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLm9wdGlvbnMuc2tpbikpIHtcbiAgICAgICAgICB0aGlzLnNraW5DbGFzc0FkZGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5za2luKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlU2tpbkNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNraW5DbGFzc0FkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLnNraW4pO1xuICAgICAgfSxcblxuICAgICAgYWRkU2Nyb2xsQmFyQ29tcG9uZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmFzc2lnblZpZXdQb3J0KCk7XG4gICAgICAgIGlmICh0aGlzLiR2aWV3UG9ydC5sZW5ndGggPT0gMCkge1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQud3JhcElubmVyKFwiPGRpdiBjbGFzcz1cXFwidmlld3BvcnRcXFwiIC8+XCIpO1xuICAgICAgICAgIHRoaXMuYXNzaWduVmlld1BvcnQoKTtcbiAgICAgICAgICB0aGlzLnZpZXdQb3J0QWRkZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXNzaWduT3ZlcnZpZXcoKTtcbiAgICAgICAgaWYgKHRoaXMuJG92ZXJ2aWV3Lmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy4kdmlld1BvcnQud3JhcElubmVyKFwiPGRpdiBjbGFzcz1cXFwib3ZlcnZpZXdcXFwiIC8+XCIpO1xuICAgICAgICAgIHRoaXMuYXNzaWduT3ZlcnZpZXcoKTtcbiAgICAgICAgICB0aGlzLm92ZXJ2aWV3QWRkZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsQmFyKFwidmVydGljYWxcIiwgXCJwcmVwZW5kXCIpO1xuICAgICAgICB0aGlzLmFkZFNjcm9sbEJhcihcImhvcml6b250YWxcIiwgXCJhcHBlbmRcIik7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTY3JvbGxiYXJDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsYmFyKFwidmVydGljYWxcIik7XG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsYmFyKFwiaG9yaXpvbnRhbFwiKTtcbiAgICAgICAgaWYgKHRoaXMub3ZlcnZpZXdBZGRlZClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnVud3JhcCgpO1xuICAgICAgICBpZiAodGhpcy52aWV3UG9ydEFkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudW53cmFwKCk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTY3JvbGxiYXI6IGZ1bmN0aW9uIChvcmllbnRhdGlvbikge1xuICAgICAgICBpZiAodGhpc1tvcmllbnRhdGlvbiArIFwiU2Nyb2xsYmFyQWRkZWRcIl0pXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5maW5kKFwiLnNjcm9sbC1iYXIuXCIgKyBvcmllbnRhdGlvbikucmVtb3ZlKCk7XG4gICAgICB9LFxuXG4gICAgICBhc3NpZ25WaWV3UG9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiR2aWV3UG9ydCA9IHRoaXMuJGVsZW1lbnQuZmluZChcIi52aWV3cG9ydFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIGFzc2lnbk92ZXJ2aWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJG92ZXJ2aWV3ID0gdGhpcy4kdmlld1BvcnQuZmluZChcIi5vdmVydmlld1wiKTtcbiAgICAgIH0sXG5cbiAgICAgIGFkZFNjcm9sbEJhcjogZnVuY3Rpb24gKG9yaWVudGF0aW9uLCBmdW4pIHtcbiAgICAgICAgaWYgKHRoaXMuJGVsZW1lbnQuZmluZChcIi5zY3JvbGwtYmFyLlwiICsgb3JpZW50YXRpb24pLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudFtmdW5dKFwiPGRpdiBjbGFzcz0nc2Nyb2xsLWJhciBcIiArIG9yaWVudGF0aW9uICsgXCInPjxkaXYgY2xhc3M9J3RodW1iJz48L2Rpdj48L2Rpdj5cIilcbiAgICAgICAgICB0aGlzW29yaWVudGF0aW9uICsgXCJTY3JvbGxiYXJBZGRlZFwiXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKGtlZXBQb3NpdGlvbikge1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5yZXNpemUoa2VlcFBvc2l0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIucmVzaXplKGtlZXBQb3NpdGlvbik7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUbzogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIuc2Nyb2xsVG9FbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICBpZiAodGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMuaFNjcm9sbGJhci5zY3JvbGxUb0VsZW1lbnQoZWxlbWVudCk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb1hZOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB0aGlzLnNjcm9sbFRvWCh4KTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb1koeSk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb1g6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnNjcm9sbE92ZXJ2aWV3VG8oeCwgdHJ1ZSk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb1k6IGZ1bmN0aW9uICh5KSB7XG4gICAgICAgIGlmICh0aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy52U2Nyb2xsYmFyLnNjcm9sbE92ZXJ2aWV3VG8oeSwgdHJ1ZSk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxhYmxlQ2xhc3MoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTa2luQ2xhc3MoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxiYXJDb21wb25lbnRzKCk7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQuZGF0YShcInNjcm9sbGFibGVcIiwgbnVsbCk7XG4gICAgICAgIHRoaXMucmVtb3ZlS2V5Ym9hcmRTY3JvbGxpbmcoKTtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnJlbW92ZSgpO1xuICAgICAgfSxcblxuICAgICAgc2V0QW5pbWF0aW9uU3BlZWQ6IGZ1bmN0aW9uIChzcGVlZCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uU3BlZWQgPSBzcGVlZDtcbiAgICAgIH0sXG5cbiAgICAgIGlzSW5zaWRlOiBmdW5jdGlvbiAoZWxlbWVudCwgd3JhcHBpbmdFbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHZhciAkd3JhcHBpbmdFbGVtZW50ID0gJCh3cmFwcGluZ0VsZW1lbnQpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgd3JhcHBpbmdFbGVtZW50T2Zmc2V0ID0gJHdyYXBwaW5nRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50T2Zmc2V0LnRvcCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQudG9wKSAmJiAoZWxlbWVudE9mZnNldC5sZWZ0ID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC5sZWZ0KSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LnRvcCArICRlbGVtZW50LmhlaWdodCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3AgKyAkd3JhcHBpbmdFbGVtZW50LmhlaWdodCgpKSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LmxlZnQgKyAkZWxlbWVudC53aWR0aCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC5sZWZ0ICsgJHdyYXBwaW5nRWxlbWVudC53aWR0aCgpKVxuICAgICAgfSxcblxuICAgICAgaW5pdEtleWJvYXJkU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50S2V5ZG93biA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBfdGhpcy4kZWxlbWVudFswXSkge1xuICAgICAgICAgICAgaWYgKF90aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgICAgIF90aGlzLnZTY3JvbGxiYXIua2V5U2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgICAgIGlmIChfdGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgICAgICBfdGhpcy5oU2Nyb2xsYmFyLmtleVNjcm9sbChldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAgIC5hdHRyKCd0YWJpbmRleCcsICctMScpXG4gICAgICAgICAgLmtleWRvd24odGhpcy5lbGVtZW50S2V5ZG93bik7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVLZXlib2FyZFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgICAgLnJlbW92ZUF0dHIoJ3RhYmluZGV4JylcbiAgICAgICAgICAudW5iaW5kKFwia2V5ZG93blwiLCB0aGlzLmVsZW1lbnRLZXlkb3duKTtcbiAgICAgIH0sXG5cbiAgICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5vbkN1c3RvbVNjcm9sbClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKFwiY3VzdG9tU2Nyb2xsXCIsIHRoaXMub3B0aW9ucy5vbkN1c3RvbVNjcm9sbCk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgU2Nyb2xsYmFyID0gZnVuY3Rpb24gKHNjcm9sbGFibGUsIHNpemluZykge1xuICAgICAgdGhpcy5zY3JvbGxhYmxlID0gc2Nyb2xsYWJsZTtcbiAgICAgIHRoaXMuc2l6aW5nID0gc2l6aW5nXG4gICAgICB0aGlzLiRzY3JvbGxCYXIgPSB0aGlzLnNpemluZy5zY3JvbGxCYXIodGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50KTtcbiAgICAgIHRoaXMuJHRodW1iID0gdGhpcy4kc2Nyb2xsQmFyLmZpbmQoXCIudGh1bWJcIik7XG4gICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKDAsIDApO1xuICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICAgIHRoaXMuaW5pdE1vdXNlTW92ZVNjcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0TW91c2VXaGVlbFNjcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0VG91Y2hTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuaW5pdE1vdXNlQ2xpY2tTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuaW5pdFdpbmRvd1Jlc2l6ZSgpO1xuICAgIH1cblxuICAgIFNjcm9sbGJhci5wcm90b3R5cGUgPSB7XG5cbiAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKGtlZXBQb3NpdGlvbikge1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0LmhlaWdodCh0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgICB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQsIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50KSk7XG4gICAgICAgIHRoaXMudmlld1BvcnRTaXplID0gdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0KTtcbiAgICAgICAgdGhpcy5vdmVydmlld1NpemUgPSB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcpO1xuICAgICAgICB0aGlzLnJhdGlvID0gdGhpcy52aWV3UG9ydFNpemUgLyB0aGlzLm92ZXJ2aWV3U2l6ZTtcbiAgICAgICAgdGhpcy5zaXppbmcuc2l6ZSh0aGlzLiRzY3JvbGxCYXIsIHRoaXMudmlld1BvcnRTaXplKTtcbiAgICAgICAgdGhpcy50aHVtYlNpemUgPSB0aGlzLmNhbGN1bGF0ZVRodW1iU2l6ZSgpO1xuICAgICAgICB0aGlzLnNpemluZy5zaXplKHRoaXMuJHRodW1iLCB0aGlzLnRodW1iU2l6ZSk7XG4gICAgICAgIHRoaXMubWF4VGh1bWJQb3NpdGlvbiA9IHRoaXMuY2FsY3VsYXRlTWF4VGh1bWJQb3NpdGlvbigpO1xuICAgICAgICB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLmNhbGN1bGF0ZU1heE92ZXJ2aWV3UG9zaXRpb24oKTtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gKHRoaXMub3ZlcnZpZXdTaXplID4gdGhpcy52aWV3UG9ydFNpemUpO1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxQZXJjZW50ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgdGhpcy5zY3JvbGxQZXJjZW50ID0gMC4wO1xuICAgICAgICBpZiAodGhpcy5lbmFibGVkKVxuICAgICAgICAgIHRoaXMucmVzY3JvbGwoa2VlcFBvc2l0aW9uKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHRoaXMuJHNjcm9sbEJhci50b2dnbGUodGhpcy5lbmFibGVkKTtcbiAgICAgIH0sXG5cbiAgICAgIGNhbGN1bGF0ZVRodW1iU2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZml4ZWRTaXplID0gdGhpcy5zaXppbmcuZml4ZWRUaHVtYlNpemUodGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMpXG4gICAgICAgIHZhciBzaXplO1xuICAgICAgICBpZiAoZml4ZWRTaXplKVxuICAgICAgICAgIHNpemUgPSBmaXhlZFNpemU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzaXplID0gdGhpcy5yYXRpbyAqIHRoaXMudmlld1BvcnRTaXplXG4gICAgICAgIHJldHVybiBNYXRoLm1heChzaXplLCB0aGlzLnNpemluZy5taW5TaXplKHRoaXMuJHRodW1iKSk7XG4gICAgICB9LFxuXG4gICAgICBpbml0TW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuJHRodW1iLm1vdXNlZG93bihmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuZW5hYmxlZClcbiAgICAgICAgICAgIF90aGlzLnN0YXJ0TW91c2VNb3ZlU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZG9jdW1lbnRNb3VzZXVwID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgX3RoaXMuc3RvcE1vdXNlTW92ZVNjcm9sbGluZyhldmVudCk7XG4gICAgICAgIH07XG4gICAgICAgICQoZG9jdW1lbnQpLm1vdXNldXAodGhpcy5kb2N1bWVudE1vdXNldXApO1xuICAgICAgICB0aGlzLmRvY3VtZW50TW91c2Vtb3ZlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgX3RoaXMubW91c2VNb3ZlU2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgfTtcbiAgICAgICAgJChkb2N1bWVudCkubW91c2Vtb3ZlKHRoaXMuZG9jdW1lbnRNb3VzZW1vdmUpO1xuICAgICAgICB0aGlzLiR0aHVtYi5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kdGh1bWIudW5iaW5kKCk7XG4gICAgICAgICQoZG9jdW1lbnQpLnVuYmluZChcIm1vdXNldXBcIiwgdGhpcy5kb2N1bWVudE1vdXNldXApO1xuICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoXCJtb3VzZW1vdmVcIiwgdGhpcy5kb2N1bWVudE1vdXNlbW92ZSk7XG4gICAgICB9LFxuXG4gICAgICBpbml0TW91c2VXaGVlbFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQubW91c2V3aGVlbChmdW5jdGlvbiAoZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICAgIGlmIChfdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMubW91c2VXaGVlbFNjcm9sbChkZWx0YVgsIGRlbHRhWSkpIHtcbiAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZU1vdXNlV2hlZWxTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50LnVuYmluZChcIm1vdXNld2hlZWxcIik7XG4gICAgICB9LFxuXG4gICAgICBpbml0VG91Y2hTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgIHRoaXMuZWxlbWVudFRvdWNoc3RhcnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5lbmFibGVkKVxuICAgICAgICAgICAgICBfdGhpcy5zdGFydFRvdWNoU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIHRoaXMuZWxlbWVudFRvdWNoc3RhcnQpO1xuICAgICAgICAgIHRoaXMuZG9jdW1lbnRUb3VjaG1vdmUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIF90aGlzLnRvdWNoU2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLmRvY3VtZW50VG91Y2htb3ZlKTtcbiAgICAgICAgICB0aGlzLmVsZW1lbnRUb3VjaGVuZCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgX3RoaXMuc3RvcFRvdWNoU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLmVsZW1lbnRUb3VjaGVuZCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIHRoaXMuZWxlbWVudFRvdWNoc3RhcnQpO1xuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5kb2N1bWVudFRvdWNobW92ZSk7XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLmVsZW1lbnRUb3VjaGVuZCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGluaXRNb3VzZUNsaWNrU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2Nyb2xsQmFyQ2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBfdGhpcy5tb3VzZUNsaWNrU2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy4kc2Nyb2xsQmFyLmNsaWNrKHRoaXMuc2Nyb2xsQmFyQ2xpY2spO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlTW91c2VDbGlja1Njcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRzY3JvbGxCYXIudW5iaW5kKFwiY2xpY2tcIiwgdGhpcy5zY3JvbGxCYXJDbGljayk7XG4gICAgICB9LFxuXG4gICAgICBpbml0V2luZG93UmVzaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbGFibGUub3B0aW9ucy51cGRhdGVPbldpbmRvd1Jlc2l6ZSkge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgdGhpcy53aW5kb3dSZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5yZXNpemUoKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgICQod2luZG93KS5yZXNpemUodGhpcy53aW5kb3dSZXNpemUpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVXaW5kb3dSZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh3aW5kb3cpLnVuYmluZChcInJlc2l6ZVwiLCB0aGlzLndpbmRvd1Jlc2l6ZSk7XG4gICAgICB9LFxuXG4gICAgICBpc0tleVNjcm9sbGluZzogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5rZXlTY3JvbGxEZWx0YShrZXkpICE9IG51bGw7XG4gICAgICB9LFxuXG4gICAgICBrZXlTY3JvbGxEZWx0YTogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBmb3IgKHZhciBzY3JvbGxpbmdLZXkgaW4gdGhpcy5zaXppbmcuc2Nyb2xsaW5nS2V5cylcbiAgICAgICAgICBpZiAoc2Nyb2xsaW5nS2V5ID09IGtleSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNpemluZy5zY3JvbGxpbmdLZXlzW2tleV0odGhpcy52aWV3UG9ydFNpemUpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sXG5cbiAgICAgIHN0YXJ0TW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZU1vdmVTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICAkKFwiaHRtbFwiKS5hZGRDbGFzcyhcIm5vdC1zZWxlY3RhYmxlXCIpO1xuICAgICAgICB0aGlzLnNldFVuc2VsZWN0YWJsZSgkKFwiaHRtbFwiKSwgXCJvblwiKTtcbiAgICAgICAgdGhpcy5zZXRTY3JvbGxFdmVudChldmVudCk7XG4gICAgICB9LFxuXG4gICAgICBzdG9wTW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZU1vdmVTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgJChcImh0bWxcIikucmVtb3ZlQ2xhc3MoXCJub3Qtc2VsZWN0YWJsZVwiKTtcbiAgICAgICAgdGhpcy5zZXRVbnNlbGVjdGFibGUoJChcImh0bWxcIiksIG51bGwpO1xuICAgICAgfSxcblxuICAgICAgc2V0VW5zZWxlY3RhYmxlOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYXR0cihcInVuc2VsZWN0YWJsZVwiKSAhPSB2YWx1ZSkge1xuICAgICAgICAgIGVsZW1lbnQuYXR0cihcInVuc2VsZWN0YWJsZVwiLCB2YWx1ZSk7XG4gICAgICAgICAgZWxlbWVudC5maW5kKCc6bm90KGlucHV0KScpLmF0dHIoJ3Vuc2VsZWN0YWJsZScsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgbW91c2VNb3ZlU2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMubW91c2VNb3ZlU2Nyb2xsaW5nKSB7XG4gICAgICAgICAgdmFyIGRlbHRhID0gdGhpcy5zaXppbmcubW91c2VEZWx0YSh0aGlzLnNjcm9sbEV2ZW50LCBldmVudCk7XG4gICAgICAgICAgdGhpcy5zY3JvbGxUaHVtYkJ5KGRlbHRhKTtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc3RhcnRUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC50b3VjaGVzICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50LnRvdWNoZXNbMF0pO1xuICAgICAgICAgIHRoaXMudG91Y2hTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICB0b3VjaFNjcm9sbDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnRvdWNoU2Nyb2xsaW5nICYmIGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgIHZhciBkZWx0YSA9IC10aGlzLnNpemluZy5tb3VzZURlbHRhKHRoaXMuc2Nyb2xsRXZlbnQsIGV2ZW50LnRvdWNoZXNbMF0pICogdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMuc3dpcGVTcGVlZDtcbiAgICAgICAgICB2YXIgc2Nyb2xsZWQgPSB0aGlzLnNjcm9sbE92ZXJ2aWV3QnkoZGVsdGEpO1xuICAgICAgICAgIGlmIChzY3JvbGxlZCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5zZXRTY3JvbGxFdmVudChldmVudC50b3VjaGVzWzBdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHN0b3BUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHRoaXMudG91Y2hTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZVdoZWVsU2Nyb2xsOiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gLXRoaXMuc2l6aW5nLndoZWVsRGVsdGEoZGVsdGFYLCBkZWx0YVkpICogdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMud2hlZWxTcGVlZDtcbiAgICAgICAgaWYgKGRlbHRhICE9IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeShkZWx0YSk7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZUNsaWNrU2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gdGhpcy52aWV3UG9ydFNpemUgLSAyMDtcbiAgICAgICAgaWYgKGV2ZW50W1wicGFnZVwiICsgdGhpcy5zaXppbmcuc2Nyb2xsQXhpcygpXSA8IHRoaXMuJHRodW1iLm9mZnNldCgpW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXSlcbiAgICAgICAgLy8gbW91c2UgY2xpY2sgb3ZlciB0aHVtYlxuICAgICAgICAgIGRlbHRhID0gLWRlbHRhO1xuICAgICAgICB0aGlzLnNjcm9sbE92ZXJ2aWV3QnkoZGVsdGEpO1xuICAgICAgfSxcblxuICAgICAga2V5U2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGtleURvd24gPSBldmVudC53aGljaDtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlZCAmJiB0aGlzLmlzS2V5U2Nyb2xsaW5nKGtleURvd24pKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeSh0aGlzLmtleVNjcm9sbERlbHRhKGtleURvd24pKSlcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRodW1iQnk6IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgICAgICB2YXIgdGh1bWJQb3NpdGlvbiA9IHRoaXMudGh1bWJQb3NpdGlvbigpO1xuICAgICAgICB0aHVtYlBvc2l0aW9uICs9IGRlbHRhO1xuICAgICAgICB0aHVtYlBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbk9yTWF4KHRodW1iUG9zaXRpb24sIHRoaXMubWF4VGh1bWJQb3NpdGlvbik7XG4gICAgICAgIHZhciBvbGRTY3JvbGxQZXJjZW50ID0gdGhpcy5zY3JvbGxQZXJjZW50O1xuICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSB0aHVtYlBvc2l0aW9uIC8gdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9ICh0aHVtYlBvc2l0aW9uICogdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uKSAvIHRoaXMubWF4VGh1bWJQb3NpdGlvbjtcbiAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgaWYgKG9sZFNjcm9sbFBlcmNlbnQgIT0gdGhpcy5zY3JvbGxQZXJjZW50KSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tU2Nyb2xsKG9sZFNjcm9sbFBlcmNlbnQpO1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG5cbiAgICAgIHRodW1iUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHRodW1iLnBvc2l0aW9uKClbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsT3ZlcnZpZXdCeTogZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gdGhpcy5vdmVydmlld1Bvc2l0aW9uKCkgKyBkZWx0YTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsT3ZlcnZpZXdUbyhvdmVydmlld1Bvc2l0aW9uLCBmYWxzZSk7XG4gICAgICB9LFxuXG4gICAgICBvdmVydmlld1Bvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAtdGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldy5wb3NpdGlvbigpW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbE92ZXJ2aWV3VG86IGZ1bmN0aW9uIChvdmVydmlld1Bvc2l0aW9uLCBhbmltYXRlKSB7XG4gICAgICAgIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uT3JNYXgob3ZlcnZpZXdQb3NpdGlvbiwgdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uKTtcbiAgICAgICAgdmFyIG9sZFNjcm9sbFBlcmNlbnQgPSB0aGlzLnNjcm9sbFBlcmNlbnQ7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IG92ZXJ2aWV3UG9zaXRpb24gLyB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb247XG4gICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy5zY3JvbGxQZXJjZW50ICogdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICBpZiAoYW5pbWF0ZSlcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uV2l0aEFuaW1hdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24ob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbik7XG4gICAgICAgIGlmIChvbGRTY3JvbGxQZXJjZW50ICE9IHRoaXMuc2Nyb2xsUGVyY2VudCkge1xuICAgICAgICAgIHRoaXMudHJpZ2dlckN1c3RvbVNjcm9sbChvbGRTY3JvbGxQZXJjZW50KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcblxuICAgICAgcG9zaXRpb25Pck1heDogZnVuY3Rpb24gKHAsIG1heCkge1xuICAgICAgICBpZiAocCA8IDApXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIGVsc2UgaWYgKHAgPiBtYXgpXG4gICAgICAgICAgcmV0dXJuIG1heDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBwO1xuICAgICAgfSxcblxuICAgICAgdHJpZ2dlckN1c3RvbVNjcm9sbDogZnVuY3Rpb24gKG9sZFNjcm9sbFBlcmNlbnQpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50LnRyaWdnZXIoXCJjdXN0b21TY3JvbGxcIiwge1xuICAgICAgICAgICAgc2Nyb2xsQXhpczogdGhpcy5zaXppbmcuc2Nyb2xsQXhpcygpLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLnNpemluZy5zY3JvbGxEaXJlY3Rpb24ob2xkU2Nyb2xsUGVyY2VudCwgdGhpcy5zY3JvbGxQZXJjZW50KSxcbiAgICAgICAgICAgIHNjcm9sbFBlcmNlbnQ6IHRoaXMuc2Nyb2xsUGVyY2VudCAqIDEwMFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlc2Nyb2xsOiBmdW5jdGlvbiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgIGlmIChrZWVwUG9zaXRpb24pIHtcbiAgICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25Pck1heCh0aGlzLm92ZXJ2aWV3UG9zaXRpb24oKSwgdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uKTtcbiAgICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSBvdmVydmlld1Bvc2l0aW9uIC8gdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uO1xuICAgICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy5zY3JvbGxQZXJjZW50ICogdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24ob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgICAgdmFyIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb247XG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc2V0U2Nyb2xsUG9zaXRpb246IGZ1bmN0aW9uIChvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMuJHRodW1iLmNzcyh0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKSwgdGh1bWJQb3NpdGlvbiArIFwicHhcIik7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcuY3NzKHRoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpLCAtb3ZlcnZpZXdQb3NpdGlvbiArIFwicHhcIik7XG4gICAgICB9LFxuXG4gICAgICBzZXRTY3JvbGxQb3NpdGlvbldpdGhBbmltYXRpb246IGZ1bmN0aW9uIChvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKSB7XG4gICAgICAgIHZhciB0aHVtYkFuaW1hdGlvbk9wdHMgPSB7fTtcbiAgICAgICAgdmFyIG92ZXJ2aWV3QW5pbWF0aW9uT3B0cyA9IHt9O1xuICAgICAgICB0aHVtYkFuaW1hdGlvbk9wdHNbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldID0gdGh1bWJQb3NpdGlvbiArIFwicHhcIjtcbiAgICAgICAgdGhpcy4kdGh1bWIuYW5pbWF0ZSh0aHVtYkFuaW1hdGlvbk9wdHMsIHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLmFuaW1hdGlvblNwZWVkKTtcbiAgICAgICAgb3ZlcnZpZXdBbmltYXRpb25PcHRzW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXSA9IC1vdmVydmlld1Bvc2l0aW9uICsgXCJweFwiO1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3LmFuaW1hdGUob3ZlcnZpZXdBbmltYXRpb25PcHRzLCB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy5hbmltYXRpb25TcGVlZCk7XG4gICAgICB9LFxuXG4gICAgICBjYWxjdWxhdGVNYXhUaHVtYlBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpemluZy5zaXplKHRoaXMuJHNjcm9sbEJhcikgLSB0aGlzLnRodW1iU2l6ZTtcbiAgICAgIH0sXG5cbiAgICAgIGNhbGN1bGF0ZU1heE92ZXJ2aWV3UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldykgLSB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQpO1xuICAgICAgfSxcblxuICAgICAgc2V0U2Nyb2xsRXZlbnQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgYXR0ciA9IFwicGFnZVwiICsgdGhpcy5zaXppbmcuc2Nyb2xsQXhpcygpO1xuICAgICAgICBpZiAoIXRoaXMuc2Nyb2xsRXZlbnQgfHwgdGhpcy5zY3JvbGxFdmVudFthdHRyXSAhPSBldmVudFthdHRyXSlcbiAgICAgICAgICB0aGlzLnNjcm9sbEV2ZW50ID0ge3BhZ2VYOiBldmVudC5wYWdlWCwgcGFnZVk6IGV2ZW50LnBhZ2VZfTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvRWxlbWVudDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgaWYgKHRoaXMuc2l6aW5nLmlzSW5zaWRlKCRlbGVtZW50LCB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3KSAmJiAhdGhpcy5zaXppbmcuaXNJbnNpZGUoJGVsZW1lbnQsIHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQpKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAkZWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICB2YXIgb3ZlcnZpZXdPZmZzZXQgPSB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3Lm9mZnNldCgpO1xuICAgICAgICAgIHZhciB2aWV3UG9ydE9mZnNldCA9IHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQub2Zmc2V0KCk7XG4gICAgICAgICAgdGhpcy5zY3JvbGxPdmVydmlld1RvKGVsZW1lbnRPZmZzZXRbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldIC0gb3ZlcnZpZXdPZmZzZXRbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTW91c2VNb3ZlU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlTW91c2VXaGVlbFNjcm9sbGluZygpO1xuICAgICAgICB0aGlzLnJlbW92ZVRvdWNoU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlTW91c2VDbGlja1Njcm9sbGluZygpO1xuICAgICAgICB0aGlzLnJlbW92ZVdpbmRvd1Jlc2l6ZSgpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIEhTaXppbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgfVxuXG4gICAgSFNpemluZy5wcm90b3R5cGUgPSB7XG4gICAgICBzaXplOiBmdW5jdGlvbiAoJGVsLCBhcmcpIHtcbiAgICAgICAgaWYgKGFyZylcbiAgICAgICAgICByZXR1cm4gJGVsLndpZHRoKGFyZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJGVsLndpZHRoKCk7XG4gICAgICB9LFxuXG4gICAgICBtaW5TaXplOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludCgkZWwuY3NzKFwibWluLXdpZHRoXCIpKSB8fCAwO1xuICAgICAgfSxcblxuICAgICAgZml4ZWRUaHVtYlNpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmZpeGVkVGh1bWJXaWR0aDtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEJhcjogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gJGVsLmZpbmQoXCIuc2Nyb2xsLWJhci5ob3Jpem9udGFsXCIpO1xuICAgICAgfSxcblxuICAgICAgbW91c2VEZWx0YTogZnVuY3Rpb24gKGV2ZW50MSwgZXZlbnQyKSB7XG4gICAgICAgIHJldHVybiBldmVudDIucGFnZVggLSBldmVudDEucGFnZVg7XG4gICAgICB9LFxuXG4gICAgICBvZmZzZXRDb21wb25lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwibGVmdFwiO1xuICAgICAgfSxcblxuICAgICAgd2hlZWxEZWx0YTogZnVuY3Rpb24gKGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIHJldHVybiBkZWx0YVg7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxBeGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIlhcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbERpcmVjdGlvbjogZnVuY3Rpb24gKG9sZFBlcmNlbnQsIG5ld1BlcmNlbnQpIHtcbiAgICAgICAgcmV0dXJuIG9sZFBlcmNlbnQgPCBuZXdQZXJjZW50ID8gXCJyaWdodFwiIDogXCJsZWZ0XCI7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxpbmdLZXlzOiB7XG4gICAgICAgIDM3OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIC0xMDsgLy9hcnJvdyBsZWZ0XG4gICAgICAgIH0sXG4gICAgICAgIDM5OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIDEwOyAvL2Fycm93IHJpZ2h0XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGlzSW5zaWRlOiBmdW5jdGlvbiAoZWxlbWVudCwgd3JhcHBpbmdFbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHZhciAkd3JhcHBpbmdFbGVtZW50ID0gJCh3cmFwcGluZ0VsZW1lbnQpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgd3JhcHBpbmdFbGVtZW50T2Zmc2V0ID0gJHdyYXBwaW5nRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50T2Zmc2V0LmxlZnQgPj0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQpICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQubGVmdCArICRlbGVtZW50LndpZHRoKCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQgKyAkd3JhcHBpbmdFbGVtZW50LndpZHRoKCkpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIFZTaXppbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgfVxuXG4gICAgVlNpemluZy5wcm90b3R5cGUgPSB7XG5cbiAgICAgIHNpemU6IGZ1bmN0aW9uICgkZWwsIGFyZykge1xuICAgICAgICBpZiAoYXJnKVxuICAgICAgICAgIHJldHVybiAkZWwuaGVpZ2h0KGFyZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJGVsLmhlaWdodCgpO1xuICAgICAgfSxcblxuICAgICAgbWluU2l6ZTogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoJGVsLmNzcyhcIm1pbi1oZWlnaHRcIikpIHx8IDA7XG4gICAgICB9LFxuXG4gICAgICBmaXhlZFRodW1iU2l6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZml4ZWRUaHVtYkhlaWdodDtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEJhcjogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gJGVsLmZpbmQoXCIuc2Nyb2xsLWJhci52ZXJ0aWNhbFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlRGVsdGE6IGZ1bmN0aW9uIChldmVudDEsIGV2ZW50Mikge1xuICAgICAgICByZXR1cm4gZXZlbnQyLnBhZ2VZIC0gZXZlbnQxLnBhZ2VZO1xuICAgICAgfSxcblxuICAgICAgb2Zmc2V0Q29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcInRvcFwiO1xuICAgICAgfSxcblxuICAgICAgd2hlZWxEZWx0YTogZnVuY3Rpb24gKGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIHJldHVybiBkZWx0YVk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxBeGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIllcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbERpcmVjdGlvbjogZnVuY3Rpb24gKG9sZFBlcmNlbnQsIG5ld1BlcmNlbnQpIHtcbiAgICAgICAgcmV0dXJuIG9sZFBlcmNlbnQgPCBuZXdQZXJjZW50ID8gXCJkb3duXCIgOiBcInVwXCI7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxpbmdLZXlzOiB7XG4gICAgICAgIDM4OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIC0xMDsgLy9hcnJvdyB1cFxuICAgICAgICB9LFxuICAgICAgICA0MDogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiAxMDsgLy9hcnJvdyBkb3duXG4gICAgICAgIH0sXG4gICAgICAgIDMzOiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIC0odmlld1BvcnRTaXplIC0gMjApOyAvL3BhZ2UgdXBcbiAgICAgICAgfSxcbiAgICAgICAgMzQ6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gdmlld1BvcnRTaXplIC0gMjA7IC8vcGFnZSBkb3duXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGlzSW5zaWRlOiBmdW5jdGlvbiAoZWxlbWVudCwgd3JhcHBpbmdFbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHZhciAkd3JhcHBpbmdFbGVtZW50ID0gJCh3cmFwcGluZ0VsZW1lbnQpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgd3JhcHBpbmdFbGVtZW50T2Zmc2V0ID0gJHdyYXBwaW5nRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50T2Zmc2V0LnRvcCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQudG9wKSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LnRvcCArICRlbGVtZW50LmhlaWdodCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3AgKyAkd3JhcHBpbmdFbGVtZW50LmhlaWdodCgpKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gdW5kZWZpbmVkKVxuICAgICAgICBvcHRpb25zID0gZGVmYXVsdE9wdGlvbnM7XG4gICAgICBpZiAodHlwZW9mKG9wdGlvbnMpID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdmFyIHNjcm9sbGFibGUgPSAkKHRoaXMpLmRhdGEoXCJzY3JvbGxhYmxlXCIpO1xuICAgICAgICBpZiAoc2Nyb2xsYWJsZSlcbiAgICAgICAgICBzY3JvbGxhYmxlW29wdGlvbnNdKGFyZ3MpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHlwZW9mKG9wdGlvbnMpID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgbmV3IFNjcm9sbGFibGUoJCh0aGlzKSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IFwiSW52YWxpZCB0eXBlIG9mIG9wdGlvbnNcIjtcbiAgICB9KTtcblxuICB9XG4gIDtcblxufSlcbiAgKGpRdWVyeSk7XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIHZhciB0eXBlcyA9IFsnRE9NTW91c2VTY3JvbGwnLCAnbW91c2V3aGVlbCddO1xuXG4gIGlmICgkLmV2ZW50LmZpeEhvb2tzKSB7XG4gICAgZm9yICh2YXIgaSA9IHR5cGVzLmxlbmd0aDsgaTspIHtcbiAgICAgICQuZXZlbnQuZml4SG9va3NbIHR5cGVzWy0taV0gXSA9ICQuZXZlbnQubW91c2VIb29rcztcbiAgICB9XG4gIH1cblxuICAkLmV2ZW50LnNwZWNpYWwubW91c2V3aGVlbCA9IHtcbiAgICBzZXR1cDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBmb3IgKHZhciBpID0gdHlwZXMubGVuZ3RoOyBpOykge1xuICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0eXBlc1stLWldLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25tb3VzZXdoZWVsID0gaGFuZGxlcjtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdGVhcmRvd246IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHR5cGVzLmxlbmd0aDsgaTspIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZXNbLS1pXSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9ubW91c2V3aGVlbCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICQuZm4uZXh0ZW5kKHtcbiAgICBtb3VzZXdoZWVsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHJldHVybiBmbiA/IHRoaXMuYmluZChcIm1vdXNld2hlZWxcIiwgZm4pIDogdGhpcy50cmlnZ2VyKFwibW91c2V3aGVlbFwiKTtcbiAgICB9LFxuXG4gICAgdW5tb3VzZXdoZWVsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHJldHVybiB0aGlzLnVuYmluZChcIm1vdXNld2hlZWxcIiwgZm4pO1xuICAgIH1cbiAgfSk7XG5cblxuICBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XG4gICAgdmFyIG9yZ0V2ZW50ID0gZXZlbnQgfHwgd2luZG93LmV2ZW50LCBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBkZWx0YSA9IDAsIHJldHVyblZhbHVlID0gdHJ1ZSwgZGVsdGFYID0gMCwgZGVsdGFZID0gMDtcbiAgICBldmVudCA9ICQuZXZlbnQuZml4KG9yZ0V2ZW50KTtcbiAgICBldmVudC50eXBlID0gXCJtb3VzZXdoZWVsXCI7XG5cbiAgICAvLyBPbGQgc2Nob29sIHNjcm9sbHdoZWVsIGRlbHRhXG4gICAgaWYgKG9yZ0V2ZW50LndoZWVsRGVsdGEpIHtcbiAgICAgIGRlbHRhID0gb3JnRXZlbnQud2hlZWxEZWx0YSAvIDEyMDtcbiAgICB9XG4gICAgaWYgKG9yZ0V2ZW50LmRldGFpbCkge1xuICAgICAgZGVsdGEgPSAtb3JnRXZlbnQuZGV0YWlsIC8gMztcbiAgICB9XG5cbiAgICAvLyBOZXcgc2Nob29sIG11bHRpZGltZW5zaW9uYWwgc2Nyb2xsICh0b3VjaHBhZHMpIGRlbHRhc1xuICAgIGRlbHRhWSA9IGRlbHRhO1xuXG4gICAgLy8gR2Vja29cbiAgICBpZiAob3JnRXZlbnQuYXhpcyAhPT0gdW5kZWZpbmVkICYmIG9yZ0V2ZW50LmF4aXMgPT09IG9yZ0V2ZW50LkhPUklaT05UQUxfQVhJUykge1xuICAgICAgZGVsdGFZID0gMDtcbiAgICAgIGRlbHRhWCA9IGRlbHRhO1xuICAgIH1cblxuICAgIC8vIFdlYmtpdFxuICAgIGlmIChvcmdFdmVudC53aGVlbERlbHRhWSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkZWx0YVkgPSBvcmdFdmVudC53aGVlbERlbHRhWSAvIDEyMDtcbiAgICB9XG4gICAgaWYgKG9yZ0V2ZW50LndoZWVsRGVsdGFYICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlbHRhWCA9IG9yZ0V2ZW50LndoZWVsRGVsdGFYIC8gMTIwO1xuICAgIH1cblxuICAgIC8vIEFkZCBldmVudCBhbmQgZGVsdGEgdG8gdGhlIGZyb250IG9mIHRoZSBhcmd1bWVudHNcbiAgICBhcmdzLnVuc2hpZnQoZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICByZXR1cm4gKCQuZXZlbnQuZGlzcGF0Y2ggfHwgJC5ldmVudC5oYW5kbGUpLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbn0pKGpRdWVyeSk7XG4iLCIvLyBTdG9yYWdlIGNhY2hlLlxyXG52YXIgY2FjaGUgPSB7fTtcclxuLy8gVGhlIHN0b3JlIGhhbmRsaW5nIGV4cGlyYXRpb24gb2YgZGF0YS5cclxudmFyIGV4cGlyZXNTdG9yZSA9IG5ldyBTdG9yZSh7XHJcblx0bmFtZXNwYWNlOiAnX19zdG9yYWdlLXdyYXBwZXI6ZXhwaXJlcydcclxufSk7XHJcblxyXG4vKipcclxuICogU3RvcmFnZSB3cmFwcGVyIGZvciBtYWtpbmcgcm91dGluZSBzdG9yYWdlIGNhbGxzIHN1cGVyIGVhc3kuXHJcbiAqIEBjbGFzcyBTdG9yZVxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAgICAgICAgICAgICAgICAgICAgIFRoZSBvcHRpb25zIGZvciB0aGUgc3RvcmUuIE9wdGlvbnMgbm90IG92ZXJyaWRkZW4gd2lsbCB1c2UgdGhlIGRlZmF1bHRzLlxyXG4gKiBAcGFyYW0ge21peGVkfSAgW29wdGlvbnMubmFtZXNwYWNlPScnXSAgICAgICAgU2VlIHt7I2Nyb3NzTGluayBcIlN0b3JlL3NldE5hbWVzcGFjZVwifX1TdG9yZSNzZXROYW1lc3BhY2V7ey9jcm9zc0xpbmt9fVxyXG4gKiBAcGFyYW0ge21peGVkfSAgW29wdGlvbnMuc3RvcmFnZVR5cGU9J2xvY2FsJ10gU2VlIHt7I2Nyb3NzTGluayBcIlN0b3JlL3NldFN0b3JhZ2VUeXBlXCJ9fVN0b3JlI3NldFN0b3JhZ2VUeXBle3svY3Jvc3NMaW5rfX1cclxuICovXHJcbmZ1bmN0aW9uIFN0b3JlKG9wdGlvbnMpIHtcclxuXHR2YXIgc2V0dGluZ3MgPSB7XHJcblx0XHRuYW1lc3BhY2U6ICcnLFxyXG5cdFx0c3RvcmFnZVR5cGU6ICdsb2NhbCdcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBzdG9yYWdlIG5hbWVzcGFjZS5cclxuXHQgKiBAbWV0aG9kIHNldE5hbWVzcGFjZVxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfGZhbHNlfG51bGx9IG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIHRvIHdvcmsgdW5kZXIuIFRvIHVzZSBubyBuYW1lc3BhY2UgKGUuZy4gZ2xvYmFsIG5hbWVzcGFjZSksIHBhc3MgaW4gYGZhbHNlYCBvciBgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nLlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0TmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cdFx0dmFyIHZhbGlkTmFtZXNwYWNlID0gL15bXFx3LTpdKyQvO1xyXG5cdFx0Ly8gTm8gbmFtZXNwYWNlLlxyXG5cdFx0aWYgKG5hbWVzcGFjZSA9PT0gZmFsc2UgfHwgbmFtZXNwYWNlID09IG51bGwgfHwgbmFtZXNwYWNlID09PSAnJykge1xyXG5cdFx0XHRzZXR0aW5ncy5uYW1lc3BhY2UgPSAnJztcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHR5cGVvZiBuYW1lc3BhY2UgIT09ICdzdHJpbmcnIHx8ICF2YWxpZE5hbWVzcGFjZS50ZXN0KG5hbWVzcGFjZSkpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5hbWVzcGFjZS4nKTtcclxuXHRcdH1cclxuXHRcdHNldHRpbmdzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBjdXJyZW50IHN0b3JhZ2UgbmFtZXNwYWNlLlxyXG5cdCAqIEBtZXRob2QgZ2V0TmFtZXNwYWNlXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3VycmVudCBuYW1lc3BhY2UuXHJcblx0ICovXHJcblx0dGhpcy5nZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAoaW5jbHVkZVNlcGFyYXRvcikge1xyXG5cdFx0aWYgKGluY2x1ZGVTZXBhcmF0b3IgJiYgc2V0dGluZ3MubmFtZXNwYWNlICE9PSAnJykge1xyXG5cdFx0XHRyZXR1cm4gc2V0dGluZ3MubmFtZXNwYWNlICsgJzonO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHNldHRpbmdzLm5hbWVzcGFjZTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIHR5cGUgb2Ygc3RvcmFnZSB0byB1c2UuXHJcblx0ICogQG1ldGhvZCBzZXRTdG9yYWdlVHlwZVxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIFRoZSB0eXBlIG9mIHN0b3JhZ2UgdG8gdXNlLiBVc2UgYHNlc3Npb25gIGZvciBgc2Vzc2lvblN0b3JhZ2VgIGFuZCBgbG9jYWxgIGZvciBgbG9jYWxTdG9yYWdlYC5cclxuXHQgKi9cclxuXHR0aGlzLnNldFN0b3JhZ2VUeXBlID0gZnVuY3Rpb24gKHR5cGUpIHtcclxuXHRcdGlmIChbJ3Nlc3Npb24nLCAnbG9jYWwnXS5pbmRleE9mKHR5cGUpIDwgMCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RvcmFnZSB0eXBlLicpO1xyXG5cdFx0fVxyXG5cdFx0c2V0dGluZ3Muc3RvcmFnZVR5cGUgPSB0eXBlO1xyXG5cdH07XHJcblx0LyoqXHJcblx0ICogR2V0IHRoZSB0eXBlIG9mIHN0b3JhZ2UgYmVpbmcgdXNlZC5cclxuXHQgKiBAbWV0aG9kIGdldFN0b3JhZ2VUeXBlXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgdHlwZSBvZiBzdG9yYWdlIGJlaW5nIHVzZWQuXHJcblx0ICovXHJcblx0dGhpcy5nZXRTdG9yYWdlVHlwZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBzZXR0aW5ncy5zdG9yYWdlVHlwZTtcclxuXHR9O1xyXG5cclxuXHQvLyBPdmVycmlkZSBkZWZhdWx0IHNldHRpbmdzLlxyXG5cdGlmIChvcHRpb25zKSB7XHJcblx0XHRmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xyXG5cdFx0XHRzd2l0Y2ggKGtleSkge1xyXG5cdFx0XHRcdGNhc2UgJ25hbWVzcGFjZSc6XHJcblx0XHRcdFx0XHR0aGlzLnNldE5hbWVzcGFjZShvcHRpb25zW2tleV0pO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAnc3RvcmFnZVR5cGUnOlxyXG5cdFx0XHRcdFx0dGhpcy5zZXRTdG9yYWdlVHlwZShvcHRpb25zW2tleV0pO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBhY3R1YWwgaGFuZGxlciB0byB1c2VcclxuICogQG1ldGhvZCBnZXRTdG9yYWdlSGFuZGxlclxyXG4gKiBAcmV0dXJuIHttaXhlZH0gVGhlIHN0b3JhZ2UgaGFuZGxlci5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXRTdG9yYWdlSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgaGFuZGxlcnMgPSB7XHJcblx0XHQnbG9jYWwnOiBsb2NhbFN0b3JhZ2UsXHJcblx0XHQnc2Vzc2lvbic6IHNlc3Npb25TdG9yYWdlXHJcblx0fTtcclxuXHRyZXR1cm4gaGFuZGxlcnNbdGhpcy5nZXRTdG9yYWdlVHlwZSgpXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGZ1bGwgc3RvcmFnZSBuYW1lIGZvciBhIGtleSwgaW5jbHVkaW5nIHRoZSBuYW1lc3BhY2UsIGlmIGFueS5cclxuICogQG1ldGhvZCBnZXRTdG9yYWdlS2V5XHJcbiAqIEBwYXJhbSAge3N0cmluZ30ga2V5IFRoZSBzdG9yYWdlIGtleSBuYW1lLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICBUaGUgZnVsbCBzdG9yYWdlIG5hbWUgdGhhdCBpcyB1c2VkIGJ5IHRoZSBzdG9yYWdlIG1ldGhvZHMuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZ2V0U3RvcmFnZUtleSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHRpZiAoIWtleSB8fCB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkubGVuZ3RoIDwgMSkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdLZXkgbXVzdCBiZSBhIHN0cmluZy4nKTtcclxuXHR9XHJcblx0cmV0dXJuIHRoaXMuZ2V0TmFtZXNwYWNlKHRydWUpICsga2V5O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yYWdlIGl0ZW0gZnJvbSB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgZ2V0XHJcbiAqIEBwYXJhbSAge3N0cmluZ30ga2V5ICAgICAgICAgIFRoZSBrZXkgdGhhdCB0aGUgZGF0YSBjYW4gYmUgYWNjZXNzZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSAge21peGVkfSAgZGVmYXVsdFZhbHVlIFRoZSBkZWZhdWx0IHZhbHVlIHRvIHJldHVybiBpbiBjYXNlIHRoZSBzdG9yYWdlIHZhbHVlIGlzIG5vdCBzZXQgb3IgYG51bGxgLlxyXG4gKiBAcmV0dXJuIHttaXhlZH0gICAgICAgICAgICAgICBUaGUgZGF0YSBmb3IgdGhlIHN0b3JhZ2UuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSwgZGVmYXVsdFZhbHVlKSB7XHJcblx0Ly8gUHJldmVudCByZWN1cnNpb24uIE9ubHkgY2hlY2sgZXhwaXJlIGRhdGUgaWYgaXQgaXNuJ3QgY2FsbGVkIGZyb20gYGV4cGlyZXNTdG9yZWAuXHJcblx0aWYgKHRoaXMgIT09IGV4cGlyZXNTdG9yZSkge1xyXG5cdFx0Ly8gQ2hlY2sgaWYga2V5IGlzIGV4cGlyZWQuXHJcblx0XHR2YXIgZXhwaXJlRGF0ZSA9IGV4cGlyZXNTdG9yZS5nZXQodGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG5cdFx0aWYgKGV4cGlyZURhdGUgIT09IG51bGwgJiYgZXhwaXJlRGF0ZS5nZXRUaW1lKCkgPCBEYXRlLm5vdygpKSB7XHJcblx0XHRcdC8vIEV4cGlyZWQsIHJlbW92ZSBpdC5cclxuXHRcdFx0dGhpcy5yZW1vdmUoa2V5KTtcclxuXHRcdFx0ZXhwaXJlc1N0b3JlLnJlbW92ZSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBDYWNoZWQsIHJlYWQgZnJvbSBtZW1vcnkuXHJcblx0aWYgKGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSAhPSBudWxsKSB7XHJcblx0XHRyZXR1cm4gY2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldO1xyXG5cdH1cclxuXHJcblx0dmFyIHZhbCA9IHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5nZXRJdGVtKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxuXHJcblx0Ly8gVmFsdWUgZG9lc24ndCBleGlzdCBhbmQgd2UgaGF2ZSBhIGRlZmF1bHQsIHJldHVybiBkZWZhdWx0LlxyXG5cdGlmICh2YWwgPT09IG51bGwgJiYgdHlwZW9mIGRlZmF1bHRWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHJldHVybiBkZWZhdWx0VmFsdWU7XHJcblx0fVxyXG5cclxuXHQvLyBPbmx5IHByZS1wcm9jZXNzIHN0cmluZ3MuXHJcblx0aWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XHJcblx0XHQvLyBIYW5kbGUgUmVnRXhwcy5cclxuXHRcdGlmICh2YWwuaW5kZXhPZignflJlZ0V4cDonKSA9PT0gMCkge1xyXG5cdFx0XHR2YXIgbWF0Y2hlcyA9IC9eflJlZ0V4cDooW2dpbV0qPyk6KC4qKS8uZXhlYyh2YWwpO1xyXG5cdFx0XHR2YWwgPSBuZXcgUmVnRXhwKG1hdGNoZXNbMl0sIG1hdGNoZXNbMV0pO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIERhdGVzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35EYXRlOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IG5ldyBEYXRlKHZhbC5yZXBsYWNlKC9efkRhdGU6LywgJycpKTtcclxuXHRcdH1cclxuXHRcdC8vIEhhbmRsZSBvYmplY3RzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35KU09OOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IHZhbC5yZXBsYWNlKC9efkpTT046LywgJycpO1xyXG5cdFx0XHQvLyBUcnkgcGFyc2luZyBpdC5cclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHR2YWwgPSBKU09OLnBhcnNlKHZhbCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gUGFyc2luZyB3ZW50IHdyb25nIChpbnZhbGlkIEpTT04pLCByZXR1cm4gZGVmYXVsdCBvciBudWxsLlxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFJldHVybiBpdC5cclxuXHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSB2YWw7XHJcblx0cmV0dXJuIHZhbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGEgc3RvcmFnZSBpdGVtIG9uIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBzZXRcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAga2V5ICAgICAgIFRoZSBrZXkgdGhhdCB0aGUgZGF0YSBjYW4gYmUgYWNjZXNzZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICAgICAgIHZhbCAgICAgICBUaGUgdmFsdWUgdG8gc3RvcmUuIE1heSBiZSB0aGUgZm9sbG93aW5nIHR5cGVzIG9mIGRhdGE6IGBSZWdFeHBgLCBgRGF0ZWAsIGBPYmplY3RgLCBgU3RyaW5nYCwgYEJvb2xlYW5gLCBgTnVtYmVyYFxyXG4gKiBAcGFyYW0ge0RhdGV8bnVtYmVyfSBbZXhwaXJlc10gVGhlIGRhdGUgaW4gdGhlIGZ1dHVyZSB0byBleHBpcmUsIG9yIHJlbGF0aXZlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZnJvbSBgRGF0ZSNub3dgIHRvIGV4cGlyZS5cclxuICpcclxuICogTm90ZTogVGhpcyBjb252ZXJ0cyBzcGVjaWFsIGRhdGEgdHlwZXMgdGhhdCBub3JtYWxseSBjYW4ndCBiZSBzdG9yZWQgaW4gdGhlIGZvbGxvd2luZyB3YXk6XHJcbiAqIFxyXG4gKiAtIGBSZWdFeHBgOiBwcmVmaXhlZCB3aXRoIHR5cGUsIGZsYWdzIHN0b3JlZCwgYW5kIHNvdXJjZSBzdG9yZWQgYXMgc3RyaW5nLlxyXG4gKiAtIGBEYXRlYDogcHJlZml4ZWQgd2l0aCB0eXBlLCBzdG9yZWQgYXMgc3RyaW5nIHVzaW5nIGBEYXRlI3RvU3RyaW5nYC5cclxuICogLSBgT2JqZWN0YDogcHJlZml4ZWQgd2l0aCBcIkpTT05cIiBpbmRpY2F0b3IsIHN0b3JlZCBhcyBzdHJpbmcgdXNpbmcgYEpTT04jc3RyaW5naWZ5YC5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWwsIGV4cGlyZXMpIHtcclxuXHR2YXIgcGFyc2VkVmFsID0gbnVsbDtcclxuXHQvLyBIYW5kbGUgUmVnRXhwcy5cclxuXHRpZiAodmFsIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcblx0XHR2YXIgZmxhZ3MgPSBbXHJcblx0XHRcdHZhbC5nbG9iYWwgPyAnZycgOiAnJyxcclxuXHRcdFx0dmFsLmlnbm9yZUNhc2UgPyAnaScgOiAnJyxcclxuXHRcdFx0dmFsLm11bHRpbGluZSA/ICdtJyA6ICcnLFxyXG5cdFx0XS5qb2luKCcnKTtcclxuXHRcdHBhcnNlZFZhbCA9ICd+UmVnRXhwOicgKyBmbGFncyArICc6JyArIHZhbC5zb3VyY2U7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBEYXRlcy5cclxuXHRlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkRhdGU6JyArIHZhbC50b1N0cmluZygpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgb2JqZWN0cy5cclxuXHRlbHNlIGlmICh2YWwgPT09IE9iamVjdCh2YWwpKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkpTT046JyArIEpTT04uc3RyaW5naWZ5KHZhbCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBzaW1wbGUgdHlwZXMuXHJcblx0ZWxzZSBpZiAoWydzdHJpbmcnLCAnYm9vbGVhbicsICdudW1iZXInXS5pbmRleE9mKHR5cGVvZiB2YWwpID49IDApIHtcclxuXHRcdHBhcnNlZFZhbCA9IHZhbDtcclxuXHR9XHJcblx0Ly8gVGhyb3cgaWYgd2UgZG9uJ3Qga25vdyB3aGF0IGl0IGlzLlxyXG5cdGVsc2Uge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gc3RvcmUgdGhpcyB2YWx1ZTsgd3JvbmcgdmFsdWUgdHlwZS4nKTtcclxuXHR9XHJcblx0Ly8gU2V0IGV4cGlyZSBkYXRlIGlmIG5lZWRlZC5cclxuXHRpZiAodHlwZW9mIGV4cGlyZXMgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHQvLyBDb252ZXJ0IHRvIGEgcmVsYXRpdmUgZGF0ZS5cclxuXHRcdGlmICh0eXBlb2YgZXhwaXJlcyA9PT0gJ251bWJlcicpIHtcclxuXHRcdFx0ZXhwaXJlcyA9IG5ldyBEYXRlKERhdGUubm93KCkgKyBleHBpcmVzKTtcclxuXHRcdH1cclxuXHRcdC8vIE1ha2Ugc3VyZSBpdCBpcyBhIGRhdGUuXHJcblx0XHRpZiAoZXhwaXJlcyBpbnN0YW5jZW9mIERhdGUpIHtcclxuXHRcdFx0ZXhwaXJlc1N0b3JlLnNldCh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSwgZXhwaXJlcyk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdLZXkgZXhwaXJlIG11c3QgYmUgYSB2YWxpZCBkYXRlIG9yIHRpbWVzdGFtcC4nKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Ly8gU2F2ZSBpdC5cclxuXHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSB2YWw7XHJcblx0dGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLnNldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KGtleSksIHBhcnNlZFZhbCk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBhbGwgZGF0YSBmb3IgdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIGdldEFsbFxyXG4gKiBAcmV0dXJuIHtvYmplY3R9IEFuIG9iamVjdCBjb250YWluaW5nIGFsbCBkYXRhIGluIHRoZSBmb3JtIG9mIGB7dGhlS2V5OiB0aGVEYXRhfWAgd2hlcmUgYHRoZURhdGFgIGlzIHBhcnNlZCB1c2luZyB7eyNjcm9zc0xpbmsgXCJTdG9yZS9nZXRcIn19U3RvcmUjZ2V0e3svY3Jvc3NMaW5rfX0uXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBrZXlzID0gdGhpcy5saXN0S2V5cygpO1xyXG5cdHZhciBkYXRhID0ge307XHJcblx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdGRhdGFba2V5XSA9IHRoaXMuZ2V0KGtleSk7XHJcblx0fSwgdGhpcyk7XHJcblx0cmV0dXJuIGRhdGE7XHJcbn07XHJcblxyXG4vKipcclxuICogTGlzdCBhbGwga2V5cyB0aGF0IGFyZSB0aWVkIHRvIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBsaXN0S2V5c1xyXG4gKiBAcmV0dXJuIHthcnJheX0gVGhlIHN0b3JhZ2Uga2V5cy5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5saXN0S2V5cyA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIga2V5cyA9IFtdO1xyXG5cdHZhciBrZXkgPSBudWxsO1xyXG5cdHZhciBzdG9yYWdlTGVuZ3RoID0gdGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLmxlbmd0aDtcclxuXHR2YXIgcHJlZml4ID0gbmV3IFJlZ0V4cCgnXicgKyB0aGlzLmdldE5hbWVzcGFjZSh0cnVlKSk7XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzdG9yYWdlTGVuZ3RoOyBpKyspIHtcclxuXHRcdGtleSA9IHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5rZXkoaSlcclxuXHRcdGlmIChwcmVmaXgudGVzdChrZXkpKSB7XHJcblx0XHRcdGtleXMucHVzaChrZXkucmVwbGFjZShwcmVmaXgsICcnKSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiBrZXlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSBzcGVjaWZpYyBrZXkgYW5kIGRhdGEgZnJvbSB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgcmVtb3ZlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byByZW1vdmUgdGhlIGRhdGEgZm9yLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSBudWxsO1xyXG5cdHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5yZW1vdmVJdGVtKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBkYXRhIGFuZCBrZXlzIGZyb20gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIHJlbW92ZUFsbFxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHR0aGlzLmxpc3RLZXlzKCkuZm9yRWFjaCh0aGlzLnJlbW92ZSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBuYW1lc3BhY2VkIGl0ZW1zIGZyb20gdGhlIGNhY2hlIHNvIHlvdXIgbmV4dCB7eyNjcm9zc0xpbmsgXCJTdG9yZS9nZXRcIn19U3RvcmUjZ2V0e3svY3Jvc3NMaW5rfX0gd2lsbCBiZSBmcmVzaCBmcm9tIHRoZSBzdG9yYWdlLlxyXG4gKiBAbWV0aG9kIGZyZXNoZW5cclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIHJlbW92ZSB0aGUgY2FjaGUgZGF0YSBmb3IuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZnJlc2hlbiA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHR2YXIga2V5cyA9IGtleSA/IFtrZXldIDogdGhpcy5saXN0S2V5cygpO1xyXG5cdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSBudWxsO1xyXG5cdH0sIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1pZ3JhdGUgZGF0YSBmcm9tIGEgZGlmZmVyZW50IG5hbWVzcGFjZSB0byBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBtaWdyYXRlXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSAgIG1pZ3JhdGlvbiAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIG1pZ3JhdGlvbiBvYmplY3QuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG1pZ3JhdGlvbi50b0tleSAgICAgICAgICAgICAgICAgICAgVGhlIGtleSBuYW1lIHVuZGVyIHlvdXIgY3VycmVudCBuYW1lc3BhY2UgdGhlIG9sZCBkYXRhIHNob3VsZCBjaGFuZ2UgdG8uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG1pZ3JhdGlvbi5mcm9tTmFtZXNwYWNlICAgICAgICAgICAgVGhlIG9sZCBuYW1lc3BhY2UgdGhhdCB0aGUgb2xkIGtleSBiZWxvbmdzIHRvLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24uZnJvbUtleSAgICAgICAgICAgICAgICAgIFRoZSBvbGQga2V5IG5hbWUgdG8gbWlncmF0ZSBmcm9tLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBbbWlncmF0aW9uLmZyb21TdG9yYWdlVHlwZV0gICAgICAgIFRoZSBzdG9yYWdlIHR5cGUgdG8gbWlncmF0ZSBmcm9tLiBEZWZhdWx0cyB0byBzYW1lIHR5cGUgYXMgd2hlcmUgeW91IGFyZSBtaWdyYXRpbmcgdG8uXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gIFttaWdyYXRpb24ua2VlcE9sZERhdGE9ZmFsc2VdICAgICAgV2hldGhlciBvbGQgZGF0YSBzaG91bGQgYmUga2VwdCBhZnRlciBpdCBoYXMgYmVlbiBtaWdyYXRlZC5cclxuICogQHBhcmFtIHtib29sZWFufSAgW21pZ3JhdGlvbi5vdmVyd3JpdGVOZXdEYXRhPWZhbHNlXSBXaGV0aGVyIG9sZCBkYXRhIHNob3VsZCBvdmVyd3JpdGUgY3VycmVudGx5IHN0b3JlZCBkYXRhIGlmIGl0IGV4aXN0cy5cclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW21pZ3JhdGlvbi50cmFuc2Zvcm1dICAgICAgICAgICAgICBUaGUgZnVuY3Rpb24gdG8gcGFzcyB0aGUgb2xkIGtleSBkYXRhIHRocm91Z2ggYmVmb3JlIG1pZ3JhdGluZy5cclxuICogQGV4YW1wbGVcclxuICogXHJcbiAqICAgICB2YXIgU3RvcmUgPSByZXF1aXJlKCdzdG9yYWdlLXdyYXBwZXInKTtcclxuICogICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yZSh7XHJcbiAqICAgICAgICAgbmFtZXNwYWNlOiAnbXlOZXdBcHAnXHJcbiAqICAgICB9KTtcclxuICpcclxuICogICAgIC8vIE1pZ3JhdGUgZnJvbSB0aGUgb2xkIGFwcC5cclxuICogICAgIHN0b3JlLm1pZ3JhdGUoe1xyXG4gKiAgICAgICAgIHRvS2V5OiAnbmV3LWtleScsXHJcbiAqICAgICAgICAgZnJvbU5hbWVzcGFjZTogJ215T2xkQXBwJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb2xkLWtleSdcclxuICogICAgIH0pO1xyXG4gKiAgICAgXHJcbiAqICAgICAvLyBNaWdyYXRlIGZyb20gZ2xvYmFsIGRhdGEuIFVzZWZ1bCB3aGVuIG1vdmluZyBmcm9tIG90aGVyIHN0b3JhZ2Ugd3JhcHBlcnMgb3IgcmVndWxhciBvbCcgYGxvY2FsU3RvcmFnZWAuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ290aGVyLW5ldy1rZXknLFxyXG4gKiAgICAgICAgIGZyb21OYW1lc3BhY2U6ICcnLFxyXG4gKiAgICAgICAgIGZyb21LZXk6ICdvdGhlci1vbGQta2V5LW9uLWdsb2JhbCdcclxuICogICAgIH0pO1xyXG4gKiAgICAgXHJcbiAqICAgICAvLyBNaWdyYXRlIHNvbWUgSlNPTiBkYXRhIHRoYXQgd2FzIHN0b3JlZCBhcyBhIHN0cmluZy5cclxuICogICAgIHN0b3JlLm1pZ3JhdGUoe1xyXG4gKiAgICAgICAgIHRvS2V5OiAnbmV3LWpzb24ta2V5JyxcclxuICogICAgICAgICBmcm9tTmFtZXNwYWNlOiAnbXlPbGRBcHAnLFxyXG4gKiAgICAgICAgIGZyb21LZXk6ICdvbGQtanNvbi1rZXknLFxyXG4gKiAgICAgICAgIC8vIFRyeSBjb252ZXJ0aW5nIHNvbWUgb2xkIEpTT04gZGF0YS5cclxuICogICAgICAgICB0cmFuc2Zvcm06IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAqICAgICAgICAgICAgIHRyeSB7XHJcbiAqICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcclxuICogICAgICAgICAgICAgfVxyXG4gKiAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gKiAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAqICAgICAgICAgICAgIH1cclxuICogICAgICAgICB9XHJcbiAqICAgICB9KTtcclxuICovXHJcblxyXG5TdG9yZS5wcm90b3R5cGUubWlncmF0ZSA9IGZ1bmN0aW9uIChtaWdyYXRpb24pIHtcclxuXHQvLyBTYXZlIG91ciBjdXJyZW50IG5hbWVzcGFjZS5cclxuXHR2YXIgdG9OYW1lc3BhY2UgPSB0aGlzLmdldE5hbWVzcGFjZSgpO1xyXG5cdHZhciB0b1N0b3JhZ2VUeXBlID0gdGhpcy5nZXRTdG9yYWdlVHlwZSgpO1xyXG5cclxuXHQvLyBDcmVhdGUgYSB0ZW1wb3Jhcnkgc3RvcmUgdG8gYXZvaWQgY2hhbmdpbmcgbmFtZXNwYWNlIGR1cmluZyBhY3R1YWwgZ2V0L3NldHMuXHJcblx0dmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuXHRcdG5hbWVzcGFjZTogdG9OYW1lc3BhY2UsXHJcblx0XHRzdG9yYWdlVHlwZTogdG9TdG9yYWdlVHlwZVxyXG5cdH0pO1xyXG5cclxuXHR2YXIgZGF0YSA9IG51bGw7XHJcblxyXG5cdC8vIEdldCBkYXRhIGZyb20gb2xkIG5hbWVzcGFjZS5cclxuXHRzdG9yZS5zZXROYW1lc3BhY2UobWlncmF0aW9uLmZyb21OYW1lc3BhY2UpO1xyXG5cdGlmICh0eXBlb2YgbWlncmF0aW9uLmZyb21TdG9yYWdlVHlwZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHN0b3JlLnNldFN0b3JhZ2VUeXBlKG1pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGUpO1xyXG5cdH1cclxuXHRkYXRhID0gc3RvcmUuZ2V0KG1pZ3JhdGlvbi5mcm9tS2V5KTtcclxuXHJcblx0Ly8gUmVtb3ZlIG9sZCBpZiBuZWVkZWQuXHJcblx0aWYgKCFtaWdyYXRpb24ua2VlcE9sZERhdGEpIHtcclxuXHRcdHN0b3JlLnJlbW92ZShtaWdyYXRpb24uZnJvbUtleSk7XHJcblx0fVxyXG5cdFxyXG5cdC8vIE5vIGRhdGEsIGlnbm9yZSB0aGlzIG1pZ3JhdGlvbi5cclxuXHRpZiAoZGF0YSA9PT0gbnVsbCkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Ly8gVHJhbnNmb3JtIGRhdGEgaWYgbmVlZGVkLlxyXG5cdGlmICh0eXBlb2YgbWlncmF0aW9uLnRyYW5zZm9ybSA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0ZGF0YSA9IG1pZ3JhdGlvbi50cmFuc2Zvcm0oZGF0YSk7XHJcblx0fVxyXG5cdGVsc2UgaWYgKHR5cGVvZiBtaWdyYXRpb24udHJhbnNmb3JtICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRyYW5zZm9ybSBjYWxsYmFjay4nKTtcclxuXHR9XHJcblxyXG5cdC8vIEdvIGJhY2sgdG8gY3VycmVudCBuYW1lc3BhY2UuXHJcblx0c3RvcmUuc2V0TmFtZXNwYWNlKHRvTmFtZXNwYWNlKTtcclxuXHRzdG9yZS5zZXRTdG9yYWdlVHlwZSh0b1N0b3JhZ2VUeXBlKTtcclxuXHJcblx0Ly8gT25seSBvdmVyd3JpdGUgbmV3IGRhdGEgaWYgaXQgZG9lc24ndCBleGlzdCBvciBpdCdzIHJlcXVlc3RlZC5cclxuXHRpZiAoc3RvcmUuZ2V0KG1pZ3JhdGlvbi50b0tleSkgPT09IG51bGwgfHwgbWlncmF0aW9uLm92ZXJ3cml0ZU5ld0RhdGEpIHtcclxuXHRcdHN0b3JlLnNldChtaWdyYXRpb24udG9LZXksIGRhdGEpO1xyXG5cdH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgc3Vic3RvcmUgdGhhdCBpcyBuZXN0ZWQgaW4gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIGNyZWF0ZVN1YnN0b3JlXHJcbiAqIEBwYXJhbSAge3N0cmluZ30gbmFtZXNwYWNlIFRoZSBzdWJzdG9yZSdzIG5hbWVzcGFjZS5cclxuICogQHJldHVybiB7U3RvcmV9ICAgICAgICAgICAgVGhlIHN1YnN0b3JlLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBcclxuICogICAgIHZhciBTdG9yZSA9IHJlcXVpcmUoJ3N0b3JhZ2Utd3JhcHBlcicpO1xyXG4gKiAgICAgLy8gQ3JlYXRlIG1haW4gc3RvcmUuXHJcbiAqICAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG4gKiAgICAgICAgIG5hbWVzcGFjZTogJ215YXBwJ1xyXG4gKiAgICAgfSk7XHJcbiAqXHJcbiAqICAgICAvLyBDcmVhdGUgc3Vic3RvcmUuXHJcbiAqICAgICB2YXIgc3Vic3RvcmUgPSBzdG9yZS5jcmVhdGVTdWJzdG9yZSgndGhpbmdzJyk7XHJcbiAqICAgICBzdWJzdG9yZS5zZXQoJ2ZvbycsICdiYXInKTtcclxuICpcclxuICogICAgIHN1YnN0b3JlLmdldCgnZm9vJykgPT09IHN0b3JlLmdldCgndGhpbmdzOmZvbycpO1xyXG4gKiAgICAgLy8gdHJ1ZVxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmNyZWF0ZVN1YnN0b3JlID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cdHJldHVybiBuZXcgU3RvcmUoe1xyXG5cdFx0bmFtZXNwYWNlOiB0aGlzLmdldE5hbWVzcGFjZSh0cnVlKSArIG5hbWVzcGFjZSxcclxuXHRcdHN0b3JhZ2VUeXBlOiB0aGlzLmdldFN0b3JhZ2VUeXBlKClcclxuXHR9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3RvcmU7XHJcbiIsIm1vZHVsZS5leHBvcnRzPXtcclxuXHRcIm5hbWVcIjogXCJ0d2l0Y2gtY2hhdC1lbW90ZXNcIixcclxuXHRcInZlcnNpb25cIjogXCIwLjYuNFwiLFxyXG5cdFwiaG9tZXBhZ2VcIjogXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL1wiLFxyXG5cdFwiYnVnc1wiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9pc3N1ZXNcIixcclxuXHRcImF1dGhvclwiOiBcIlJ5YW4gQ2hhdGhhbSA8cnlhbi5iLmNoYXRoYW1AZ21haWwuY29tPiAoaHR0cHM6Ly9naXRodWIuY29tL2NsZXR1c2MpXCIsXHJcblx0XCJyZXBvc2l0b3J5XCI6IHtcclxuXHRcdFwidHlwZVwiOiBcImdpdFwiLFxyXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMuZ2l0XCJcclxuXHR9LFxyXG5cdFwidXNlcnNjcmlwdFwiOiB7XHJcblx0XHRcIm5hbWVcIjogXCJUd2l0Y2ggQ2hhdCBFbW90ZXNcIixcclxuXHRcdFwibmFtZXNwYWNlXCI6IFwiI0NsZXR1c1wiLFxyXG5cdFx0XCJ2ZXJzaW9uXCI6IFwie3t7cGtnLnZlcnNpb259fX1cIixcclxuXHRcdFwiZGVzY3JpcHRpb25cIjogXCJBZGRzIGEgYnV0dG9uIHRvIFR3aXRjaCB0aGF0IGFsbG93cyB5b3UgdG8gXFxcImNsaWNrLXRvLWluc2VydFxcXCIgYW4gZW1vdGUuXCIsXHJcblx0XHRcImNvcHlyaWdodFwiOiBcIjIwMTErLCB7e3twa2cuYXV0aG9yfX19XCIsXHJcblx0XHRcImF1dGhvclwiOiBcInt7e3BrZy5hdXRob3J9fX1cIixcclxuXHRcdFwiaWNvblwiOiBcImh0dHA6Ly93d3cuZ3JhdmF0YXIuY29tL2F2YXRhci5waHA/Z3JhdmF0YXJfaWQ9Njg3NWU4M2FhNmM1NjM3OTBjYjJkYTkxNGFhYmE4YjMmcj1QRyZzPTQ4JmRlZmF1bHQ9aWRlbnRpY29uXCIsXHJcblx0XHRcImxpY2Vuc2VcIjogW1xyXG5cdFx0XHRcIk1JVDsgaHR0cDovL29wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL01JVFwiLFxyXG5cdFx0XHRcIkNDIEJZLU5DLVNBIDMuMDsgaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktbmMtc2EvMy4wL1wiXHJcblx0XHRdLFxyXG5cdFx0XCJob21lcGFnZVwiOiBcInt7e3BrZy5ob21lcGFnZX19fVwiLFxyXG5cdFx0XCJzdXBwb3J0VVJMXCI6IFwie3t7cGtnLmJ1Z3N9fX1cIixcclxuXHRcdFwiY29udHJpYnV0aW9uVVJMXCI6IFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy8jZG9uYXRlXCIsXHJcblx0XHRcImdyYW50XCI6IFwibm9uZVwiLFxyXG5cdFx0XCJpbmNsdWRlXCI6IFwiaHR0cDovLyoudHdpdGNoLnR2LypcIixcclxuXHRcdFwiZXhjbHVkZVwiOiBbXHJcblx0XHRcdFwiaHR0cDovL2FwaS50d2l0Y2gudHYvKlwiLFxyXG5cdFx0XHRcImh0dHA6Ly9jaGF0ZGVwb3QudHdpdGNoLnR2LypcIixcclxuXHRcdFx0XCJodHRwOi8vKi50d2l0Y2gudHYvKi9wcm9maWxlKlwiXHJcblx0XHRdXHJcblx0fSxcclxuXHRcInNjcmlwdHNcIjoge1xyXG5cdFx0XCJpbnN0YWxsXCI6IFwibmFwYVwiXHJcblx0fSxcclxuXHRcImRldkRlcGVuZGVuY2llc1wiOiB7XHJcblx0XHRcImJyb3dzZXItc3luY1wiOiBcIl4xLjMuMlwiLFxyXG5cdFx0XCJicm93c2VyaWZ5XCI6IFwiXjUuOS4xXCIsXHJcblx0XHRcImd1bHBcIjogXCJeMy44LjNcIixcclxuXHRcdFwiZ3VscC1hdXRvcHJlZml4ZXJcIjogXCIwLjAuOFwiLFxyXG5cdFx0XCJndWxwLWJlYXV0aWZ5XCI6IFwiMS4xLjBcIixcclxuXHRcdFwiZ3VscC1jaGFuZ2VkXCI6IFwiXjAuNC4xXCIsXHJcblx0XHRcImd1bHAtY29uY2F0XCI6IFwiXjIuMi4wXCIsXHJcblx0XHRcImd1bHAtY29uZmxpY3RcIjogXCJeMC4xLjJcIixcclxuXHRcdFwiZ3VscC1jc3MtYmFzZTY0XCI6IFwiXjEuMS4wXCIsXHJcblx0XHRcImd1bHAtY3NzMmpzXCI6IFwiXjEuMC4yXCIsXHJcblx0XHRcImd1bHAtaGVhZGVyXCI6IFwiXjEuMC4yXCIsXHJcblx0XHRcImd1bHAtaG9nYW4tY29tcGlsZVwiOiBcIl4wLjIuMVwiLFxyXG5cdFx0XCJndWxwLW1pbmlmeS1jc3NcIjogXCJeMC4zLjVcIixcclxuXHRcdFwiZ3VscC1ub3RpZnlcIjogXCJeMS40LjFcIixcclxuXHRcdFwiZ3VscC1yZW5hbWVcIjogXCJeMS4yLjBcIixcclxuXHRcdFwiZ3VscC11Z2xpZnlcIjogXCJeMC4zLjFcIixcclxuXHRcdFwiZ3VscC11dGlsXCI6IFwiXjMuMC4wXCIsXHJcblx0XHRcImhvZ2FuLmpzXCI6IFwiXjMuMC4yXCIsXHJcblx0XHRcImpxdWVyeS11aVwiOiBcIl4xLjEwLjVcIixcclxuXHRcdFwibmFwYVwiOiBcIl4wLjQuMVwiLFxyXG5cdFx0XCJwcmV0dHktaHJ0aW1lXCI6IFwiXjAuMi4xXCIsXHJcblx0XHRcInZpbnlsLW1hcFwiOiBcIl4xLjAuMVwiLFxyXG5cdFx0XCJ2aW55bC1zb3VyY2Utc3RyZWFtXCI6IFwiXjAuMS4xXCIsXHJcblx0XHRcIndhdGNoaWZ5XCI6IFwiXjEuMC4xXCIsXHJcblx0XHRcInN0b3JhZ2Utd3JhcHBlclwiOiBcImNsZXR1c2Mvc3RvcmFnZS13cmFwcGVyIzAueFwiXHJcblx0fSxcclxuXHRcIm5hcGFcIjoge1xyXG5cdFx0XCJqcXVlcnktY3VzdG9tLXNjcm9sbGJhclwiOiBcIm16dWJhbGEvanF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXIjMC41LjVcIlxyXG5cdH1cclxufVxyXG4iLCJ2YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi4vLi4vYnVpbGQvdGVtcGxhdGVzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGRhdGEgPSB7fTtcclxuXHR2YXIga2V5ID0gbnVsbDtcclxuXHJcblx0Ly8gQ29udmVydCB0ZW1wbGF0ZXMgdG8gdGhlaXIgc2hvcnRlciBcInJlbmRlclwiIGZvcm0uXHJcblx0Zm9yIChrZXkgaW4gdGVtcGxhdGVzKSB7XHJcblx0XHRpZiAoIXRlbXBsYXRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0fVxyXG5cdFx0ZGF0YVtrZXldID0gcmVuZGVyKGtleSk7XHJcblx0fVxyXG5cclxuXHQvLyBTaG9ydGN1dCB0aGUgcmVuZGVyIGZ1bmN0aW9uLiBBbGwgdGVtcGxhdGVzIHdpbGwgYmUgcGFzc2VkIGluIGFzIHBhcnRpYWxzIGJ5IGRlZmF1bHQuXHJcblx0ZnVuY3Rpb24gcmVuZGVyKHRlbXBsYXRlKSB7XHJcblx0XHR0ZW1wbGF0ZSA9IHRlbXBsYXRlc1t0ZW1wbGF0ZV07XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscyB8fCB0ZW1wbGF0ZXMsIGluZGVudCk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRhdGE7XHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbiAoJCkge1xyXG5cdCQuZm4ucmVzaXphYmxlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRcdHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHtcclxuXHRcdFx0YWxzb1Jlc2l6ZTogbnVsbCxcclxuXHRcdFx0YWxzb1Jlc2l6ZVR5cGU6ICdib3RoJywgLy8gYGhlaWdodGAsIGB3aWR0aGAsIGBib3RoYFxyXG5cdFx0XHRjb250YWlubWVudDogbnVsbCxcclxuXHRcdFx0Y3JlYXRlOiBudWxsLFxyXG5cdFx0XHRkZXN0cm95OiBudWxsLFxyXG5cdFx0XHRoYW5kbGU6ICcucmVzaXplLWhhbmRsZScsXHJcblx0XHRcdG1heEhlaWdodDogOTk5OSxcclxuXHRcdFx0bWF4V2lkdGg6IDk5OTksXHJcblx0XHRcdG1pbkhlaWdodDogMCxcclxuXHRcdFx0bWluV2lkdGg6IDAsXHJcblx0XHRcdHJlc2l6ZTogbnVsbCxcclxuXHRcdFx0cmVzaXplT25jZTogbnVsbCxcclxuXHRcdFx0c25hcFNpemU6IDEsXHJcblx0XHRcdHN0YXJ0OiBudWxsLFxyXG5cdFx0XHRzdG9wOiBudWxsXHJcblx0XHR9LCBvcHRpb25zKTtcclxuXHJcblx0XHRzZXR0aW5ncy5lbGVtZW50ID0gJCh0aGlzKTtcclxuXHJcblx0XHRmdW5jdGlvbiByZWNhbGN1bGF0ZVNpemUoZXZ0KSB7XHJcblx0XHRcdHZhciBkYXRhID0gZXZ0LmRhdGEsXHJcblx0XHRcdFx0cmVzaXplZCA9IHt9O1xyXG5cdFx0XHRkYXRhLmRpZmZYID0gTWF0aC5yb3VuZCgoZXZ0LnBhZ2VYIC0gZGF0YS5wYWdlWCkgLyBzZXR0aW5ncy5zbmFwU2l6ZSkgKiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHRcdFx0ZGF0YS5kaWZmWSA9IE1hdGgucm91bmQoKGV2dC5wYWdlWSAtIGRhdGEucGFnZVkpIC8gc2V0dGluZ3Muc25hcFNpemUpICogc2V0dGluZ3Muc25hcFNpemU7XHJcblx0XHRcdGlmIChNYXRoLmFicyhkYXRhLmRpZmZYKSA+IDAgfHwgTWF0aC5hYnMoZGF0YS5kaWZmWSkgPiAwKSB7XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoKSAhPT0gZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZICYmXHJcblx0XHRcdFx0XHRkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgPj0gc2V0dGluZ3MubWluSGVpZ2h0ICYmXHJcblx0XHRcdFx0XHRkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgPD0gc2V0dGluZ3MubWF4SGVpZ2h0ICYmXHJcblx0XHRcdFx0XHQoc2V0dGluZ3MuY29udGFpbm1lbnQgPyBkYXRhLm91dGVySGVpZ2h0ICsgZGF0YS5kaWZmWSArIGRhdGEub2Zmc2V0LnRvcCA8PSBzZXR0aW5ncy5jb250YWlubWVudC5vZmZzZXQoKS50b3AgKyBzZXR0aW5ncy5jb250YWlubWVudC5vdXRlckhlaWdodCgpIDogdHJ1ZSlcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSk7XHJcblx0XHRcdFx0XHRyZXNpemVkLmhlaWdodCA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQud2lkdGgoKSAhPT0gZGF0YS53aWR0aCArIGRhdGEuZGlmZlggJiZcclxuXHRcdFx0XHRcdGRhdGEud2lkdGggKyBkYXRhLmRpZmZYID49IHNldHRpbmdzLm1pbldpZHRoICYmXHJcblx0XHRcdFx0XHRkYXRhLndpZHRoICsgZGF0YS5kaWZmWCA8PSBzZXR0aW5ncy5tYXhXaWR0aCAmJlxyXG5cdFx0XHRcdFx0KHNldHRpbmdzLmNvbnRhaW5tZW50ID8gZGF0YS5vdXRlcldpZHRoICsgZGF0YS5kaWZmWCArIGRhdGEub2Zmc2V0LmxlZnQgPD0gc2V0dGluZ3MuY29udGFpbm1lbnQub2Zmc2V0KCkubGVmdCArIHNldHRpbmdzLmNvbnRhaW5tZW50Lm91dGVyV2lkdGgoKSA6IHRydWUpXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LndpZHRoKGRhdGEud2lkdGggKyBkYXRhLmRpZmZYKTtcclxuXHRcdFx0XHRcdHJlc2l6ZWQud2lkdGggPSB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAocmVzaXplZC5oZWlnaHQgfHwgcmVzaXplZC53aWR0aCkge1xyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLnJlc2l6ZU9uY2UpIHtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplT25jZS5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKGV2dC5kYXRhKTtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplT25jZSA9IG51bGw7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MucmVzaXplKSB7XHJcblx0XHRcdFx0XHRcdHNldHRpbmdzLnJlc2l6ZS5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKGV2dC5kYXRhKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5hbHNvUmVzaXplKSB7XHJcblx0XHRcdFx0XHRcdGlmIChyZXNpemVkLmhlaWdodCAmJiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdoZWlnaHQnIHx8IHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnYm90aCcpKSB7XHJcblx0XHRcdFx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZS5oZWlnaHQoZGF0YS5hbHNvUmVzaXplSGVpZ2h0ICsgZGF0YS5kaWZmWSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0aWYgKHJlc2l6ZWQud2lkdGggJiYgKHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnd2lkdGgnIHx8IHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnYm90aCcpKSB7XHJcblx0XHRcdFx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZS53aWR0aChkYXRhLmFsc29SZXNpemVXaWR0aCArIGRhdGEuZGlmZlgpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gc3RhcnQoZXZ0KSB7XHJcblx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRpZiAoc2V0dGluZ3Muc3RhcnQpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5zdGFydC5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIGRhdGEgPSB7XHJcblx0XHRcdFx0YWxzb1Jlc2l6ZUhlaWdodDogc2V0dGluZ3MuYWxzb1Jlc2l6ZSA/IHNldHRpbmdzLmFsc29SZXNpemUuaGVpZ2h0KCkgOiAwLFxyXG5cdFx0XHRcdGFsc29SZXNpemVXaWR0aDogc2V0dGluZ3MuYWxzb1Jlc2l6ZSA/IHNldHRpbmdzLmFsc29SZXNpemUud2lkdGgoKSA6IDAsXHJcblx0XHRcdFx0aGVpZ2h0OiBzZXR0aW5ncy5lbGVtZW50LmhlaWdodCgpLFxyXG5cdFx0XHRcdG9mZnNldDogc2V0dGluZ3MuZWxlbWVudC5vZmZzZXQoKSxcclxuXHRcdFx0XHRvdXRlckhlaWdodDogc2V0dGluZ3MuZWxlbWVudC5vdXRlckhlaWdodCgpLFxyXG5cdFx0XHRcdG91dGVyV2lkdGg6IHNldHRpbmdzLmVsZW1lbnQub3V0ZXJXaWR0aCgpLFxyXG5cdFx0XHRcdHBhZ2VYOiBldnQucGFnZVgsXHJcblx0XHRcdFx0cGFnZVk6IGV2dC5wYWdlWSxcclxuXHRcdFx0XHR3aWR0aDogc2V0dGluZ3MuZWxlbWVudC53aWR0aCgpXHJcblx0XHRcdH07XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZW1vdmUnLCAnKicsIGRhdGEsIHJlY2FsY3VsYXRlU2l6ZSk7XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwJywgJyonLCBzdG9wKTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBzdG9wKCkge1xyXG5cdFx0XHRpZiAoc2V0dGluZ3Muc3RvcCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLnN0b3AuYmluZChzZXR0aW5ncy5lbGVtZW50KSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2Vtb3ZlJywgJyonLCByZWNhbGN1bGF0ZVNpemUpO1xyXG5cdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCAnKicsIHN0b3ApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChzZXR0aW5ncy5oYW5kbGUpIHtcclxuXHRcdFx0aWYgKHNldHRpbmdzLmFsc29SZXNpemUgJiYgWydib3RoJywgJ2hlaWdodCcsICd3aWR0aCddLmluZGV4T2Yoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUpID49IDApIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplID0gJChzZXR0aW5ncy5hbHNvUmVzaXplKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoc2V0dGluZ3MuY29udGFpbm1lbnQpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5jb250YWlubWVudCA9ICQoc2V0dGluZ3MuY29udGFpbm1lbnQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHNldHRpbmdzLmhhbmRsZSA9ICQoc2V0dGluZ3MuaGFuZGxlKTtcclxuXHRcdFx0c2V0dGluZ3Muc25hcFNpemUgPSBzZXR0aW5ncy5zbmFwU2l6ZSA8IDEgPyAxIDogc2V0dGluZ3Muc25hcFNpemU7XHJcblxyXG5cdFx0XHRpZiAob3B0aW9ucyA9PT0gJ2Rlc3Ryb3knKSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuaGFuZGxlLm9mZignbW91c2Vkb3duJywgc3RhcnQpO1xyXG5cclxuXHRcdFx0XHRpZiAoc2V0dGluZ3MuZGVzdHJveSkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZGVzdHJveS5iaW5kKHRoaXMpKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzZXR0aW5ncy5oYW5kbGUub24oJ21vdXNlZG93bicsIHN0YXJ0KTtcclxuXHJcblx0XHRcdGlmIChzZXR0aW5ncy5jcmVhdGUpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5jcmVhdGUuYmluZCh0aGlzKSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9O1xyXG59KShqUXVlcnkpO1xyXG4iXX0=
