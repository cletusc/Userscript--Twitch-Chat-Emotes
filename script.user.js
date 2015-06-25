// ==UserScript==
// @name Twitch Chat Emotes
// @namespace #Cletus
// @version 1.1.0
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
// @exclude http://tmi.twitch.tv/*
// @exclude http://chatdepot.twitch.tv/*
// ==/UserScript==

/* Script compiled using build script. Script uses Browserify for CommonJS modules. */

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var templates = require('./modules/templates');
var pkg = require('../package.json');
var storage = require('./modules/storage');
var publicApi = require('./modules/public-api');
var ember = require('./modules/ember-api');
var logger = require('./modules/logger');

var $ = null;
var jQuery = null;

// Expose public api.
if (typeof window.emoteMenu === 'undefined') {
	window.emoteMenu = publicApi;
}

// Script-wide variables.
//-----------------------
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
		}
	}
};

logger.log('Initial load on ' + location.href);

// Only enable script if we have the right variables.
//---------------------------------------------------
var initTimer = 0;
(function init(time) {
	// Don't run in an iframe.
	if (window.frameElement) {
		return;
	}
	
	if (!time) {
		time = 0;
	}

	$ = jQuery = window.jQuery;
	var objectsLoaded = (
		window.Twitch !== undefined &&
		ember.isLoaded() &&
		jQuery !== undefined &&
		$('.send-chat-button').length
	);
	if (!objectsLoaded) {
		// Stops trying after 10 minutes.
		if (initTimer >= 600000) {
			logger.log('Taking too long to load, stopping. Refresh the page to try again. (' + initTimer + 'ms)');
			return;
		}

		// Give an update every 10 seconds.
		if (initTimer % 10000) {
			logger.debug('Still waiting for objects to load. (' + initTimer + 'ms)');
		}

		// Bump time up after 1s to reduce possible lag.
		time = time >= 1000 ? 1000 : time + 25;
		initTimer += time;

		setTimeout(init, time, time);
		return;
	}

	function deactivate() {
		// Remove menu from screen when redirecting.
		if (elements.menu) {
			elements.menu.hide();
		}
	}
	ember.hook('route:channel', init, deactivate);
	ember.hook('route:chat', init, deactivate);

	setup();
})();

// Start of functions.
//--------------------
/**
 * Runs initial setup of DOM and variables.
 */
function setup() {
	var emotes = require('./modules/emotes');
	logger.debug('Running setup...');
	// Load CSS.
	require('../build/styles');
	// Load jQuery plugins.
	require('./plugins/resizable');
	require('jquery-custom-scrollbar/jquery.custom-scrollbar');
	
	elements.chatButton = $('.send-chat-button');
	elements.chatBox = $('.chat-interface textarea');
	elements.chatContainer = $('.chat-messages');

	createMenuElements();
	bindListeners();
	emotes.init();
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
	var emotes = require('./modules/emotes');
	var container = null;

	// Add starred emotes.
	container = elements.menu.find('#starred-emotes-group');
	container.html('');
	emotes.getEmotes(
		function (emote) {
			return emote.isFavorite();
		},
		'default'
	).forEach(function (emote) {
		createEmote(emote, container);
	});

	// Add all emotes.
	container = elements.menu.find('#all-emotes-group');
	if (container.find('.overview').length) {
		container = container.find('.overview');
	}
	container.html('');
	emotes.getEmotes(null, 'channel').forEach(function (emote) {
		createEmote(emote, container, true);
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
	ember.get('controller:chat', 'currentRoom').set('messageToSend', text);
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
	// No container, can't add.
	if (!container.length) {
		return;
	}
	if (showHeader) {
		if (emote.getChannelName()) {
			if (!elements.menu.find('.group-header[data-emote-channel="' + emote.getChannelName() + '"]').length) {
				container.append(
					$(templates.emoteGroupHeader({
						badge: emote.getChannelBadge(),
						channel: emote.getChannelName(),
						channelDisplayName: emote.getChannelDisplayName(),
						isVisible: storage.visibility.get('channel-' + emote.getChannelName(), true)
					}))
				);
			}
		}
	}

	var channelContainer = container.find('.group-header[data-emote-channel="' + emote.getChannelName() + '"]');
	if (channelContainer.length) {
		container = channelContainer;
	}
	container.append(
		$(templates.emote({
			url: emote.getUrl(),
			text: emote.getText(),
			thirdParty: emote.isThirdParty(),
			isVisible: emote.isVisible(),
			isStarred: emote.isFavorite()
		}))
	);
}

},{"../build/styles":2,"../package.json":7,"./modules/ember-api":8,"./modules/emotes":9,"./modules/logger":10,"./modules/public-api":11,"./modules/storage":12,"./modules/templates":13,"./plugins/resizable":15,"jquery-custom-scrollbar/jquery.custom-scrollbar":5}],2:[function(require,module,exports){
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
"@-webkit-keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;margin-left:7px}#emote-menu-button.active{border-radius:2px;background-color:rgba(128,128,128,.5)}.emote-menu{padding:5px;z-index:1000;display:none;background-color:#202020}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-starred{height:38px}.emote-menu .draggable{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px)}.emote-menu .header-info{border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;background-image:-webkit-linear-gradient(bottom,transparent,rgba(0,0,0,.5));background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center;position:relative}.emote-menu .header-info img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:30px;height:30px;-webkit-transition:all .25s ease;transition:all .25s ease;border:1px solid transparent}.emote-menu.editing .emote{cursor:auto}.emote-menu .emote img{max-width:100%;max-height:100%;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;padding:5px 0 2px;margin-top:5px;height:18px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5;background-size:contain!important}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-home{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNjQiDQogICBoZWlnaHQ9IjY0Ig0KICAgdmlld0JveD0iMCAwIDY0IDY0Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhMzAwMSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczI5OTkiIC8+DQo8cGF0aA0KICAgZD0ibSA1Ny4wNjIsMzEuMzk4IGMgMC45MzIsLTEuMDI1IDAuODQyLC0yLjU5NiAtMC4yMDEsLTMuNTA4IEwgMzMuODg0LDcuNzg1IEMgMzIuODQxLDYuODczIDMxLjE2OSw2Ljg5MiAzMC4xNDgsNy44MjggTCA3LjA5MywyOC45NjIgYyAtMS4wMjEsMC45MzYgLTEuMDcxLDIuNTA1IC0wLjExMSwzLjUwMyBsIDAuNTc4LDAuNjAyIGMgMC45NTksMC45OTggMi41MDksMS4xMTcgMy40NiwwLjI2NSBsIDEuNzIzLC0xLjU0MyB2IDIyLjU5IGMgMCwxLjM4NiAxLjEyMywyLjUwOCAyLjUwOCwyLjUwOCBoIDguOTg3IGMgMS4zODUsMCAyLjUwOCwtMS4xMjIgMi41MDgsLTIuNTA4IFYgMzguNTc1IGggMTEuNDYzIHYgMTUuODA0IGMgLTAuMDIsMS4zODUgMC45NzEsMi41MDcgMi4zNTYsMi41MDcgaCA5LjUyNCBjIDEuMzg1LDAgMi41MDgsLTEuMTIyIDIuNTA4LC0yLjUwOCBWIDMyLjEwNyBjIDAsMCAwLjQ3NiwwLjQxNyAxLjA2MywwLjkzMyAwLjU4NiwwLjUxNSAxLjgxNywwLjEwMiAyLjc0OSwtMC45MjQgbCAwLjY1MywtMC43MTggeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%}.emote-menu .icon-gear{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMjEuNTkiDQogICBoZWlnaHQ9IjIxLjEzNjk5OSINCiAgIHZpZXdCb3g9IjAgMCAyMS41OSAyMS4xMzciDQogICBpZD0iQ2FwYV8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGEzOSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczM3IiAvPg0KPHBhdGgNCiAgIGQ9Ik0gMTguNjIyLDguMTQ1IDE4LjA3Nyw2Ljg1IGMgMCwwIDEuMjY4LC0yLjg2MSAxLjE1NiwtMi45NzEgTCAxNy41NTQsMi4yNCBDIDE3LjQzOCwyLjEyNyAxNC41NzYsMy40MzMgMTQuNTc2LDMuNDMzIEwgMTMuMjU2LDIuOSBDIDEzLjI1NiwyLjkgMTIuMDksMCAxMS45MywwIEggOS41NjEgQyA5LjM5NiwwIDguMzE3LDIuOTA2IDguMzE3LDIuOTA2IEwgNi45OTksMy40NDEgYyAwLDAgLTIuOTIyLC0xLjI0MiAtMy4wMzQsLTEuMTMxIEwgMi4yODksMy45NTEgQyAyLjE3Myw0LjA2NCAzLjUwNyw2Ljg2NyAzLjUwNyw2Ljg2NyBMIDIuOTYyLDguMTYgQyAyLjk2Miw4LjE2IDAsOS4zMDEgMCw5LjQ1NSB2IDIuMzIyIGMgMCwwLjE2MiAyLjk2OSwxLjIxOSAyLjk2OSwxLjIxOSBsIDAuNTQ1LDEuMjkxIGMgMCwwIC0xLjI2OCwyLjg1OSAtMS4xNTcsMi45NjkgbCAxLjY3OCwxLjY0MyBjIDAuMTE0LDAuMTExIDIuOTc3LC0xLjE5NSAyLjk3NywtMS4xOTUgbCAxLjMyMSwwLjUzNSBjIDAsMCAxLjE2NiwyLjg5OCAxLjMyNywyLjg5OCBoIDIuMzY5IGMgMC4xNjQsMCAxLjI0NCwtMi45MDYgMS4yNDQsLTIuOTA2IGwgMS4zMjIsLTAuNTM1IGMgMCwwIDIuOTE2LDEuMjQyIDMuMDI5LDEuMTMzIGwgMS42NzgsLTEuNjQxIGMgMC4xMTcsLTAuMTE1IC0xLjIyLC0yLjkxNiAtMS4yMiwtMi45MTYgbCAwLjU0NCwtMS4yOTMgYyAwLDAgMi45NjMsLTEuMTQzIDIuOTYzLC0xLjI5OSBWIDkuMzYgQyAyMS41OSw5LjE5OSAxOC42MjIsOC4xNDUgMTguNjIyLDguMTQ1IHogbSAtNC4zNjYsMi40MjMgYyAwLDEuODY3IC0xLjU1MywzLjM4NyAtMy40NjEsMy4zODcgLTEuOTA2LDAgLTMuNDYxLC0xLjUyIC0zLjQ2MSwtMy4zODcgMCwtMS44NjcgMS41NTUsLTMuMzg1IDMuNDYxLC0zLjM4NSAxLjkwOSwwLjAwMSAzLjQ2MSwxLjUxOCAzLjQ2MSwzLjM4NSB6Ig0KICAgaWQ9InBhdGgzIg0KICAgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgLz4NCjxnDQogICBpZD0iZzUiPg0KPC9nPg0KPGcNCiAgIGlkPSJnNyI+DQo8L2c+DQo8Zw0KICAgaWQ9Imc5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzExIj4NCjwvZz4NCjxnDQogICBpZD0iZzEzIj4NCjwvZz4NCjxnDQogICBpZD0iZzE1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzIxIj4NCjwvZz4NCjxnDQogICBpZD0iZzIzIj4NCjwvZz4NCjxnDQogICBpZD0iZzI1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzMxIj4NCjwvZz4NCjxnDQogICBpZD0iZzMzIj4NCjwvZz4NCjwvc3ZnPg0K) no-repeat 50%}.emote-menu.editing .icon-gear{-webkit-animation:spin 4s linear infinite;animation:spin 4s linear infinite}.emote-menu .icon-resize-handle{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgdmlld0JveD0iMCAwIDE2IDE2Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhNDM1NyI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczQzNTUiIC8+DQo8cGF0aA0KICAgZD0iTSAxMy41LDggQyAxMy4yMjUsOCAxMyw4LjIyNCAxMyw4LjUgdiAzLjc5MyBMIDMuNzA3LDMgSCA3LjUgQyA3Ljc3NiwzIDgsMi43NzYgOCwyLjUgOCwyLjIyNCA3Ljc3NiwyIDcuNSwyIGggLTUgTCAyLjMwOSwyLjAzOSAyLjE1LDIuMTQ0IDIuMTQ2LDIuMTQ2IDIuMTQzLDIuMTUyIDIuMDM5LDIuMzA5IDIsMi41IHYgNSBDIDIsNy43NzYgMi4yMjQsOCAyLjUsOCAyLjc3Niw4IDMsNy43NzYgMyw3LjUgViAzLjcwNyBMIDEyLjI5MywxMyBIIDguNSBDIDguMjI0LDEzIDgsMTMuMjI1IDgsMTMuNSA4LDEzLjc3NSA4LjIyNCwxNCA4LjUsMTQgaCA1IGwgMC4xOTEsLTAuMDM5IGMgMC4xMjEsLTAuMDUxIDAuMjIsLTAuMTQ4IDAuMjcsLTAuMjcgTCAxNCwxMy41MDIgViA4LjUgQyAxNCw4LjIyNCAxMy43NzUsOCAxMy41LDggeiINCiAgIGlkPSJwYXRoNDM1MSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%;cursor:nwse-resize!important}.emote-menu .icon-pin{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgaWQ9InN2ZzMwMDUiPg0KICA8bWV0YWRhdGENCiAgICAgaWQ9Im1ldGFkYXRhMzAyMyI+DQogICAgPHJkZjpSREY+DQogICAgICA8Y2M6V29yaw0KICAgICAgICAgcmRmOmFib3V0PSIiPg0KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4NCiAgICAgICAgPGRjOnR5cGUNCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4NCiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+DQogICAgICA8L2NjOldvcms+DQogICAgPC9yZGY6UkRGPg0KICA8L21ldGFkYXRhPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczMwMjEiIC8+DQogIDxnDQogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzkzMDc4MiwwLDAsMC43OTMwNzgyLC0yLjE3MDk4NSwtODE0LjY5Mjk5KSINCiAgICAgaWQ9ImczMDA3Ij4NCiAgICA8Zw0KICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTEsMC43MDcxMSwtMC43MDcxMSwwLjcwNzExLDczNy43MDc1NSwyOTUuNDg4MDgpIg0KICAgICAgIGlkPSJnMzAwOSI+DQogICAgICA8Zw0KICAgICAgICAgaWQ9ImczNzU1Ij4NCiAgICAgICAgPHBhdGgNCiAgICAgICAgICAgZD0iTSA5Ljc4MTI1LDAgQyA5LjQ3NDA1NjIsMC42ODkxMTIgOS41MjA2OCwxLjUyMzA4NTMgOS4zMTI1LDIuMTg3NSBMIDQuOTM3NSw2LjU5Mzc1IEMgMy45NTg5NjA4LDYuNDI5NDgzIDIuOTQ3NzU0OCw2LjUzMjc4OTkgMiw2LjgxMjUgTCA1LjAzMTI1LDkuODQzNzUgMC41NjI1LDE0LjMxMjUgMCwxNiBDIDAuNTY5Mjk2MjgsMTUuNzk1NjI2IDEuMTY3NzM3OCwxNS42NDAyMzcgMS43MTg3NSwxNS40MDYyNSBMIDYuMTU2MjUsMTAuOTY4NzUgOS4xODc1LDE0IGMgMC4yNzk2ODIzLC0wLjk0Nzc4MyAwLjM4MzE1MjgsLTEuOTU4OTM3IDAuMjE4NzUsLTIuOTM3NSAxLjUwMDAxMSwtMS40ODk1Nzk4IDMuMDAwMDAxLC0yLjk3OTE1OSA0LjUsLTQuNDY4NzUgMC42MDExMDIsLTAuMDMxMzYxIDEuODIyMTM4LC0wLjA5NjEzNyAyLC0wLjQ2ODc1IEMgMTMuODc5ODkyLDQuMDY5NDgwMyAxMS44NDI4NjUsMi4wMjAyMjgyIDkuNzgxMjUsMCB6Ig0KICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg5MTU5Mzc0LC0wLjg5MTU5Mzc0LDAuODkxNTkzNzQsMC44OTE1OTM3NCwtMi4yNjU1LDEwMzcuMTM0NSkiDQogICAgICAgICAgIGlkPSJwYXRoMzAxMSINCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K) no-repeat 50%;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu .icon-pin:hover,.emote-menu.pinned .icon-pin{-webkit-transform:rotate(-45deg);-ms-transform:rotate(-45deg);transform:rotate(-45deg);opacity:1}.emote-menu .scrollable.default-skin{padding-right:0;padding-bottom:0}.emote-menu .scrollable.default-skin .scroll-bar .thumb{background-color:#555;opacity:.2;z-index:1}.emote-menu .edit-tool{background-position:50%;background-repeat:no-repeat;background-size:14px;border-radius:4px;border:1px solid #000;cursor:pointer;display:none;height:14px;opacity:.25;position:absolute;-webkit-transition:all .25s ease;transition:all .25s ease;width:14px;z-index:1}.emote-menu .edit-tool:hover,.emote-menu .emote:hover .edit-tool{opacity:1}.emote-menu .edit-visibility{background-color:#00c800;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGE5Ij48cmRmOlJERj48Y2M6V29yaw0KICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQ0KICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz48ZGM6dGl0bGU+PC9kYzp0aXRsZT48L2NjOldvcms+PC9yZGY6UkRGPjwvbWV0YWRhdGE+PGRlZnMNCiAgIGlkPSJkZWZzNyIgLz4NCjxwYXRoDQogICBkPSJNIDk3Ljk2NCw0Ni41NDggQyA5Ny4wOTgsNDUuNTI4IDc2LjQyNywyMS42MDMgNTAsMjEuNjAzIGMgLTI2LjQyNywwIC00Ny4wOTgsMjMuOTI1IC00Ny45NjUsMjQuOTQ2IC0xLjcwMSwyIC0xLjcwMSw0LjkwMiAxMGUtNCw2LjkwMyAwLjg2NiwxLjAyIDIxLjUzNywyNC45NDUgNDcuOTY0LDI0Ljk0NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMiAxLjcwMSwtNC45MDIgLTAuMDAxLC02LjkwMyB6IE0gNTguMDczLDM1Ljk3NSBjIDEuNzc3LC0wLjk3IDQuMjU1LDAuMTQzIDUuNTM0LDIuNDg1IDEuMjc5LDIuMzQzIDAuODc1LDUuMDI5IC0wLjkwMiw1Ljk5OSAtMS43NzcsMC45NzEgLTQuMjU1LC0wLjE0MyAtNS41MzUsLTIuNDg1IC0xLjI3OSwtMi4zNDMgLTAuODc1LC01LjAyOSAwLjkwMywtNS45OTkgeiBNIDUwLDY5LjcyOSBDIDMxLjU0LDY5LjcyOSAxNi4wMDUsNTUuNTUzIDEwLjYyOCw1MCAxNC4yNTksNDYuMjQ5IDIyLjUyNiwzOC41NzEgMzMuMTk1LDMzLjk3OSAzMS4xMTQsMzcuMTQ1IDI5Ljg5NCw0MC45MjggMjkuODk0LDQ1IGMgMCwxMS4xMDQgOS4wMDEsMjAuMTA1IDIwLjEwNSwyMC4xMDUgMTEuMTA0LDAgMjAuMTA2LC05LjAwMSAyMC4xMDYsLTIwLjEwNSAwLC00LjA3MiAtMS4yMTksLTcuODU1IC0zLjMsLTExLjAyMSBDIDc3LjQ3NCwzOC41NzIgODUuNzQxLDQ2LjI1IDg5LjM3Miw1MCA4My45OTUsNTUuNTU1IDY4LjQ2LDY5LjcyOSA1MCw2OS43MjkgeiINCiAgIGlkPSJwYXRoMyIgLz4NCjwvc3ZnPg==)}.emote-menu .edit-starred{background-color:#323232;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNjY2NjY2M7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote>.edit-visibility{bottom:auto;left:auto;right:0;top:0}.emote-menu .emote>.edit-starred{bottom:auto;left:0;right:auto;top:0}.emote-menu .header-info>.edit-tool{margin-left:5px}.emote-menu.editing .edit-tool{display:inline-block}.emote-menu .emote-menu-hidden .edit-visibility{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8zIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGExNSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczEzIiAvPg0KPGcNCiAgIGlkPSJnMyI+DQoJPHBhdGgNCiAgIGQ9Ik0gNzAuMDgyLDQ1LjQ3NSA1MC40NzQsNjUuMDgyIEMgNjEuMTk4LDY0LjgzMSA2OS44MzEsNTYuMTk3IDcwLjA4Miw0NS40NzUgeiINCiAgIGlkPSJwYXRoNSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTcuOTY0LDQ2LjU0OCBjIC0wLjQ1LC0wLjUyOSAtNi4yNDUsLTcuMjMgLTE1LjQwMywtMTMuNTU0IGwgLTYuMiw2LjIgQyA4Mi4zNTEsNDMuMTQ4IDg2LjkyLDQ3LjQ2OSA4OS4zNzIsNTAgODMuOTk1LDU1LjU1NSA2OC40Niw2OS43MjkgNTAsNjkuNzI5IGMgLTEuMzM0LDAgLTIuNjUxLC0wLjA4MiAtMy45NTIsLTAuMjIyIGwgLTcuNDM5LDcuNDM5IGMgMy42MzksMC45MDkgNy40NDksMS40NSAxMS4zOTEsMS40NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMS45OTkgMS43MDEsLTQuOTAxIC0wLjAwMSwtNi45MDIgeiINCiAgIGlkPSJwYXRoNyINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTEuNDExLDE2LjY2IGMgMCwtMC4yNjYgLTAuMTA1LC0wLjUyIC0wLjI5MywtMC43MDcgbCAtNy4wNzEsLTcuMDcgYyAtMC4zOTEsLTAuMzkxIC0xLjAyMywtMC4zOTEgLTEuNDE0LDAgTCA2Ni44MDQsMjQuNzExIEMgNjEuNjAyLDIyLjgxOCA1NS45NDksMjEuNjAzIDUwLDIxLjYwMyBjIC0yNi40MjcsMCAtNDcuMDk4LDIzLjkyNiAtNDcuOTY1LDI0Ljk0NiAtMS43MDEsMiAtMS43MDEsNC45MDIgMTBlLTQsNi45MDMgMC41MTcsMC42MDcgOC4wODMsOS4zNTQgMTkuNzA3LDE2LjMyIEwgOC44ODMsODIuNjMyIEMgOC42OTUsODIuODIgOC41OSw4My4wNzMgOC41OSw4My4zMzkgYyAwLDAuMjY2IDAuMTA1LDAuNTIgMC4yOTMsMC43MDcgbCA3LjA3MSw3LjA3IGMgMC4xOTUsMC4xOTUgMC40NTEsMC4yOTMgMC43MDcsMC4yOTMgMC4yNTYsMCAwLjUxMiwtMC4wOTggMC43MDcsLTAuMjkzIGwgNzMuNzUsLTczLjc1IGMgMC4xODcsLTAuMTg2IDAuMjkzLC0wLjQ0IDAuMjkzLC0wLjcwNiB6IE0gMTAuNjI4LDUwIEMgMTQuMjU5LDQ2LjI0OSAyMi41MjYsMzguNTcxIDMzLjE5NSwzMy45NzkgMzEuMTE0LDM3LjE0NSAyOS44OTQsNDAuOTI4IDI5Ljg5NCw0NSBjIDAsNC42NjUgMS42MDEsOC45NDUgNC4yNywxMi4zNTEgTCAyOC4wNCw2My40NzUgQyAxOS44ODgsNTguOTU1IDEzLjY0OSw1My4xMiAxMC42MjgsNTAgeiINCiAgIGlkPSJwYXRoOSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQo8L2c+DQo8L3N2Zz4NCg==);background-color:red}.emote-menu .emote-menu-starred .edit-starred{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmNjMDA7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote.emote-menu-starred{border-color:rgba(200,200,0,.5)}.emote-menu .emote.emote-menu-hidden{border-color:rgba(255,0,0,.5)}.emote-menu:not(.editing) .emote-menu-hidden{display:none}.emote-menu:not(.editing) #starred-emotes-group .emote-menu-starred{border-color:transparent}.emote-menu #starred-emotes-group{text-align:center;color:#646464}.emote-menu #starred-emotes-group:empty:before{content:\"Use the edit mode to star an emote!\";position:relative;top:8px}"));

},{}],3:[function(require,module,exports){
module.exports = (function() {
    var Hogan = require('hogan.js/lib/template.js');
    var templates = {};
    templates['emote'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote");if(t.s(t.f("thirdParty",c,p,1),c,p,0,32,44,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" third-party");});c.pop();}if(!t.s(t.f("isVisible",c,p,1),c,p,1,0,0,"")){t.b(" emote-menu-hidden");};if(t.s(t.f("isStarred",c,p,1),c,p,0,119,138,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" emote-menu-starred");});c.pop();}t.b("\" data-emote=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" title=\"");t.b(t.v(t.f("text",c,p,0)));if(t.s(t.f("thirdParty",c,p,1),c,p,0,206,229,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" (from 3rd party addon)");});c.pop();}t.b("\">\r");t.b("\n" + i);t.b("	<img src=\"");t.b(t.t(t.f("url",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-starred\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-starred\" title=\"Star/unstar emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-visibility\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button glyph-only float-left\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteGroupHeader'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"group-header");if(!t.s(t.f("isVisible",c,p,1),c,p,1,0,0,"")){t.b(" emote-menu-hidden");};t.b("\" data-emote-channel=\"");t.b(t.v(t.f("channel",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div class=\"header-info\">\r");t.b("\n" + i);t.b("		<img src=\"");t.b(t.v(t.f("badge",c,p,0)));t.b("\" />\r");t.b("\n" + i);t.b("		");t.b(t.v(t.f("channelDisplayName",c,p,0)));t.b("\r");t.b("\n" + i);t.b("		<div class=\"edit-tool edit-visibility\" data-which=\"channel-");t.b(t.v(t.f("channel",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show all emotes for ");t.b(t.v(t.f("channel",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['menu'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote-menu\" id=\"emote-menu-for-twitch\">\r");t.b("\n" + i);t.b("	<div class=\"draggable\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"header-info\">All Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container scrollable\" id=\"all-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"header-info\">Favorite Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container single-row\" id=\"starred-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"footer\">\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-home\" href=\"http://cletusc.github.io/Userscript--Twitch-Chat-Emotes\" target=\"_blank\" title=\"Visit the homepage where you can donate, post a review, or contact the developer\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-gear\" data-command=\"toggle-editing\" title=\"Toggle edit mode\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-right icon icon-resize-handle\" data-command=\"resize-handle\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-right icon icon-pin\" data-command=\"toggle-pinned\" title=\"Pin/unpin the emote menu to the screen\"></a>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
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

},{}],7:[function(require,module,exports){
module.exports={
	"name": "twitch-chat-emotes",
	"version": "1.1.0",
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
			"http://tmi.twitch.tv/*",
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

},{}],8:[function(require,module,exports){
var logger = require('./logger');
var api = {};
var ember = null;
var hookedFactories = {};

api.getEmber = function () {
	if (ember) {
		return ember;
	}
	if (window.App && window.App.__container__) {
		ember = window.App.__container__;
		return ember;
	}
	return false;
};

api.isLoaded = function () {
	return Boolean(api.getEmber());
};

api.lookup = function (lookupFactory) {
	if (!api.isLoaded()) {
		logger.debug('Factory lookup failure, Ember not loaded.');
		return false;
	}
	return api.getEmber().lookup(lookupFactory);
};

api.hook = function (lookupFactory, activateCb, deactivateCb) {
	if (!api.isLoaded()) {
		logger.debug('Factory hook failure, Ember not loaded.');
		return false;
	}
	if (hookedFactories[lookupFactory]) {
		logger.debug('Factory already hooked: ' + lookupFactory);
		return true;
	}
	var reopenOptions = {};
	var factory = api.lookup(lookupFactory);

	if (!factory) {
		logger.debug('Factory hook failure, factory not found: ' + lookupFactory);
		return false;
	}

	if (activateCb) {
		reopenOptions.activate = function () {
			this._super();
			activateCb.call(this);
			logger.debug('Hook run on activate: ' + lookupFactory);
		};
	}
	if (deactivateCb) {
		reopenOptions.deactivate = function () {
			this._super();
			deactivateCb.call(this);
			logger.debug('Hook run on deactivate: ' + lookupFactory);
		};
	}

	try {
		factory.reopen(reopenOptions);
		hookedFactories[lookupFactory] = true;
		logger.debug('Factory hooked: ' + lookupFactory);
		return true;
	}
	catch (err) {
		logger.debug('Factory hook failure, unexpected error: ' + lookupFactory);
		logger.debug(err);
		return false;
	}
};

api.get = function (lookupFactory, property) {
	if (!api.isLoaded()) {
		logger.debug('Factory get failure, Ember not loaded.');
		return false;
	}
	var properties = property.split('.');
	var getter = api.lookup(lookupFactory);

	properties.some(function (property) {
		// If getter fails, just exit, otherwise, keep looping.
		if (typeof getter.get === 'function' && typeof getter.get(property) !== 'undefined') {
			getter = getter.get(property);
		}
		else if (typeof getter[property] !== 'undefined') {
			getter = getter[property];
		}
		else {
			getter = null;
			return true;
		}
	});

	return getter;
};

module.exports = api;

},{"./logger":10}],9:[function(require,module,exports){
var storage = require('./storage');
var logger = require('./logger');
var api = {};
var emoteStore = new EmoteStore();
var $ = window.jQuery;

/**
 * The entire emote storing system.
 */
function EmoteStore() {
	var getters = {};
	var nativeEmotes = {};

	/**
	 * Get a list of usable emoticons.
	 * @param  {function} [filters]       A filter method to limit what emotes are returned. Passed to Array#filter.
	 * @param  {function|string} [sortBy] How the emotes should be sorted. `function` will be passed to sort via Array#sort. `'channel'` sorts by channel name, globals first. All other values (or omitted) sort alphanumerically.
	 * @param  {string} [returnType]      `'object'` will return in object format, e.g. `{'Kappa': Emote(...), ...}`. All other values (or omitted) return an array format, e.g. `[Emote(...), ...]`.
	 * @return {object|array}             See `returnType` param.
	 */
	this.getEmotes = function (filters, sortBy, returnType) {
		var twitchApi = require('./twitch-api');

		// Get native emotes.
		var emotes = $.extend({}, nativeEmotes);

		// Parse the custom emotes provided by third party addons.
		Object.keys(getters).forEach(function (getterName) {
			// Try the getter.
			var results = null;
			try {
				results = getters[getterName]();
			}
			catch (err) {
				logger.debug('Emote getter `' + getterName + '` failed unexpectedly, skipping.', err.toString());
				return;
			}
			if (!Array.isArray(results)) {
				logger.debug('Emote getter `' + getterName + '` must return an array, skipping.');
				return;
			}

			// Override natives and previous getters.
			results.forEach(function (emote) {
				try {
					// Create the emote.
					var instance = new Emote(emote);

					// Force the getter.
					instance.setGetterName(getterName);

					// Force emotes without channels to the getter's name.
					if (!emote.channel) {
						instance.setChannelName(getterName);
					}

					// Add/override it.
					emotes[instance.getText()] = instance;
				}
				catch (err) {
					logger.debug('Emote parsing for getter `' + getterName + '` failed, skipping.', err.toString(), emote);
				}
			});
		});

		// Covert to array.
		emotes = Object.keys(emotes).map(function (emote) {
			return emotes[emote];
		});

		// Filter results.
		if (typeof filters === 'function') {
			emotes = emotes.filter(filters);
		}
		
		// Return as an object if requested.
		if (returnType === 'object') {
			var asObject = {};
			emotes.forEach(function (emote) {
				asObject[emote.getText()] = emote;
			});
			return asObject;
		}

		// Sort results.
		if (typeof sortBy === 'function') {
			emotes.sort(sortBy);
		}
		else if (sortBy === 'channel') {
			emotes.sort(sorting.allEmotesCategory);
		}
		else {
			emotes.sort(sorting.byText);
		}

		// Return the emotes in array format.
		return emotes;
	};

	/**
	 * Registers a 3rd party emote hook.
	 * @param  {string} name   The name of the 3rd party registering the hook.
	 * @param  {function} getter The function called when looking for emotes. Must return an array of emote objects, e.g. `[emote, ...]`. See Emote class.
	 */
	this.registerGetter = function (name, getter) {
		if (typeof name !== 'string') {
			throw new Error('Name must be a string.');
		}
		if (getters[name]) {
			throw new Error('Getter already exists.');
		}
		if (typeof getter !== 'function') {
			throw new Error('Getter must be a function.');
		}
		logger.debug('Getter registered: ' + name);
		getters[name] = getter;
	};

	/**
	 * Registers a 3rd party emote hook.
	 * @param  {string} name   The name of the 3rd party hook to deregister.
	 */
	this.deregisterGetter = function (name) {
		logger.debug('Getter unregistered: ' + name);
		delete getters[name];
	};

	/**
	 * Initializes the raw data from the API endpoints. Should be called at load and/or whenever the API may have changed. Populates internal objects with updated data.
	 */
	this.init = function () {
		logger.debug('Starting initialization.');

		var twitchApi = require('./twitch-api');
		var self = this;

		// Hash of emote set to forced channel.
		var forcedSetsToChannels = {
			// Globals.
			0: '~global',
			// Bubble emotes.
			33: 'turbo',
			// Monkey emotes.
			42: 'turbo',
			// Hidden turbo emotes.
			457: 'turbo',
			793: 'turbo'
		};

		logger.debug('Initializing emote set change listener.');

		twitchApi.onEmotesChange(function (emoteSets) {
			logger.debug('Parsing emote sets.');

			Object.keys(emoteSets).forEach(function (set) {
				var emotes = emoteSets[set];
				set = Number(set);
				emotes.forEach(function (emote) {
					// Set some required info.
					emote.url = 'http://static-cdn.jtvnw.net/emoticons/v1/' + emote.id + '/1.0';
					emote.text = getEmoteFromRegEx(emote.code);
					emote.set = set;

					// Hardcode the channels of certain sets.
					if (forcedSetsToChannels[set]) {
						emote.channel = forcedSetsToChannels[set];
					}

					var instance = new Emote(emote);

					// Save the emote for use later.
					nativeEmotes[emote.text] = instance;
				});
			});

			logger.debug('Loading subscription data.');

			// Get active subscriptions to find the channels.
			twitchApi.getTickets(function (tickets) {
				logger.debug('Tickets loaded from the API.', tickets);
				tickets.forEach(function (ticket) {
					var product = ticket.product;
					var channel = product.owner_name || product.short_name;

					// Get subscriptions with emotes only.
					if (!product.emoticons || !product.emoticons.length) {
						return;
					}
					
					// Set the channel on the emotes.
					product.emoticons.forEach(function (emote) {
						var instance = nativeEmotes[getEmoteFromRegEx(emote.regex)];
						instance.setChannelName(channel);
						instance.getChannelBadge();
						instance.getChannelDisplayName();
					});
				});
			});
		}, true);
	};
};

/**
 * Gets a specific emote, if available.
 * @param  {string}     text The text of the emote to get.
 * @return {Emote|null}      The Emote instance of the emote or `null` if it couldn't be found.
 */
EmoteStore.prototype.getEmote = function (text) {
	return this.getEmotes(null, null, 'object')[text] || null;
};

/**
 * Emote object.
 * @param {object} details              Object describing the emote.
 * @param {string} details.text         The text to use in the chat box when emote is clicked.
 * @param {string} details.url          The URL of the image for the emote.
 * @param {string} [details.badge]      The URL of the badge for the emote.
 * @param {string} [details.channel]    The channel the emote should be categorized under.
 * @param {string} [details.getterName] The 3rd party getter that registered the emote. Used internally only.
 */
function Emote(details) {
	var text = null;
	var url = null;
	var getterName = null;
	var channel = {
		name: null,
		badge: null
	};

	/**
	 * Gets the text of the emote.
	 * @return {string} The emote text.
	 */
	this.getText = function () {
		return text;
	};

	/**
	 * Sets the text of the emote.
	 * @param {string} theText The text to set.
	 */
	this.setText = function (theText) {
		if (typeof theText !== 'string' || theText.length < 1) {
			throw new Error('Invalid text');
		}
		text = theText;
	};

	/**
	 * Gets the getter name this emote belongs to.
	 * @return {string} The getter's name.
	 */
	this.getGetterName = function () {
		return getterName;
	};

	/**
	 * Sets the getter name this emote belongs to.
	 * @param {string} theGetterName The getter's name.
	 */
	this.setGetterName = function (theGetterName) {
		if (typeof theGetterName !== 'string' || theGetterName.length < 1) {
			throw new Error('Invalid getter name');
		}
		getterName = theGetterName;
	};

	/**
	 * Gets the emote's image URL.
	 * @return {string} The emote image URL.
	 */
	this.getUrl = function () {
		return url;
	};
	/**
	 * Sets the emote's image URL.
	 * @param {string} theUrl The image URL to set.
	 */
	this.setUrl = function (theUrl) {
		if (typeof theUrl !== 'string' || theUrl.length < 1) {
			throw new Error('Invalid URL');
		}
		url = theUrl;
	};

	/**
	 * Gets the emote's channel name.
	 * @return {string|null} The emote's channel or `null` if it doesn't have one.
	 */
	this.getChannelName = function () {
		if (!channel.name) {
			channel.name = storage.channelNames.get(this.getText());
		}
		return channel.name;
	};
	/**
	 * Sets the emote's channel name.
	 * @param {string} theChannel The channel name to set.
	 */
	this.setChannelName = function (theChannel) {
		if (typeof theChannel !== 'string' || theChannel.length < 1) {
			throw new Error('Invalid channel');
		}
		storage.channelNames.set(this.getText(), theChannel);
		channel.name = theChannel;
	};

	/**
	 * Gets the emote channel's badge image URL.
	 * @return {string|null} The URL of the badge image for the emote's channel or `null` if it doesn't have a channel.
	 */
	this.getChannelBadge = function () {
		var twitchApi = require('./twitch-api');
		var channelName = this.getChannelName();

		// No channel.
		if (!channelName) {
			return null;
		}

		// Already have one preset.
		if (channel.badge) {
			return channel.badge;
		}

		// Check storage.
		channel.badge = storage.badges.get(channelName);
		if (channel.badge !== null) {
			return channel.badge;
		}

		// Get from API.
		twitchApi.getBadges(channelName, function (badges) {
			var badge = null;
			logger.debug('Getting fresh badge for user', channelName, badges);

			// Save turbo badge while we are here.
			if (badges.turbo && badges.turbo.image) {
				badge = badges.turbo.image;
				storage.badges.set('turbo', badge, 86400000);

				// Turbo is actually what we wanted, so we are done.
				if (channelName === 'turbo') {
					channel.badge = badge;
					return;
				}
			}

			// Save subscriber badge in storage.
			if (badges.subscriber && badges.subscriber.image) {
				channel.badge = badges.subscriber.image;
				storage.badges.set(channelName, channel.badge, 86400000);
			}
			// No subscriber badge.
			else {
				logger.debug('Failed to get subscriber badge.', channelName);
			}
		});
		
		return channel.badge || 'http://static-cdn.jtvnw.net/jtv_user_pictures/subscriber-star.png';
	};

	/**
	 * Sets the emote's channel badge image URL.
	 * @param {string} theBadge The badge image URL to set.
	 */
	this.setChannelBadge = function (theBadge) {
		if (typeof theBadge !== 'string' || theBadge.length < 1) {
			throw new Error('Invalid badge');
		}
		channel.badge = theBadge;
	};

	/**
	 * Initialize the details.
	 */
	
	// Required fields.
	this.setText(details.text);
	this.setUrl(details.url);

	// Optional fields.
	if (details.getterName) {
		this.setGetterName(details.getterName);
	}
	if (details.channel) {
		this.setChannelName(details.channel);
	}
	if (details.badge) {
		this.setChannelBadge(details.badge);
	}
};

/**
 * State changers.
 */

/**
 * Toggle whether an emote should be a favorite.
 * @param {boolean} [force] `true` forces the emote to be a favorite, `false` forces the emote to not be a favorite.
 */
Emote.prototype.toggleFavorite = function (force) {
	if (typeof force !== 'undefined') {
		storage.starred.set(this.getText(), !!force);
		return;
	}
	storage.starred.set(this.getText(), !this.isFavorite());
};

/**
 * Toggle whether an emote should be visible out of editing mode.
 * @param {boolean} [force] `true` forces the emote to be visible, `false` forces the emote to be hidden.
 */
Emote.prototype.toggleVisibility = function (force) {
	if (typeof force !== 'undefined') {
		storage.visibility.set(this.getText(), !!force);
		return;
	}
	storage.visibility.set(this.getText(), !this.isVisible());
};

/**
 * State getters.
 */

/**
 * Whether the emote is from a 3rd party.
 * @return {boolean} Whether the emote is from a 3rd party.
 */
Emote.prototype.isThirdParty = function () {
	return !!this.getGetterName();
};

/**
 * Whether the emote was favorited.
 * @return {boolean} Whether the emote was favorited.
 */
Emote.prototype.isFavorite = function () {
	return storage.starred.get(this.getText(), false);
};

/**
 * Whether the emote is visible outside of editing mode.
 * @return {boolean} Whether the emote is visible outside of editing mode.
 */
Emote.prototype.isVisible = function () {
	return storage.visibility.get(this.getText(), true);
};

/**
 * Whether the emote is considered a simple smiley.
 * @return {boolean} Whether the emote is considered a simple smiley.
 */
Emote.prototype.isSmiley = function () {
	// The basic smiley emotes.
	var emotes = [':(', ':)', ':/', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o', '#/', ':7', ':>', ':S', '<]'];
	return emotes.indexOf(this.getText()) !== -1;
};

/**
 * Property getters/setters.
 */

/**
 * Get a channel's display name.
 * @return {string} The channel's display name. May be equivalent to the channel the first time the API needs to be called.
 */
Emote.prototype.getChannelDisplayName = function () {
	var twitchApi = require('./twitch-api');
	var channelName = this.getChannelName();
	var displayName = null;

	var forcedChannelToDisplayNames = {
		'~global': 'Global',
		'turbo': 'Turbo'
	};

	// No channel.
	if (!channelName) {
		return null;
	}

	// Forced display name.
	if (forcedChannelToDisplayNames[channelName]) {
		return forcedChannelToDisplayNames[channelName];
	}

	// Check storage.
	displayName = storage.displayNames.get(channelName);
	if (displayName !== null) {
		return displayName;
	}
	// Get from API.
	else {
		twitchApi.getUser(channelName, function (user) {
			logger.debug('Getting fresh display name for user', user);
			displayName = user.display_name;
			// Save in storage.
			storage.displayNames.set(channelName, displayName, 86400000);
		});
	}
	
	return displayName || channelName;
};

/**
 * Gets the usable emote text from a regex.
 */
function getEmoteFromRegEx(regex) {
	if (typeof regex === 'string') {
		regex = new RegExp(regex);
	}
	if (!regex) {
		throw new Error('`regex` must be a RegExp string or object.');
	}

	return decodeURI(regex.source)

		// Replace HTML entity brackets with actual brackets.
		.replace('&gt\\;', '>')
		.replace('&lt\\;', '<')

		// Remove negative groups.
		//
		// /
		//   \(\?!              // (?!
		//   [^)]*              // any amount of characters that are not )
		//   \)                 // )
		// /g
		.replace(/\(\?![^)]*\)/g, '')

		// Pick first option from a group.
		//
		// /
		//   \(                 // (
		//   ([^|])*            // any amount of characters that are not |
		//   \|?                // an optional | character
		//   [^)]*              // any amount of characters that are not )
		//   \)                 // )
		// /g
		.replace(/\(([^|])*\|?[^)]*\)/g, '$1')

		// Pick first character from a character group.
		//
		// /
		//   \[                 // [
		//   ([^|])*            // any amount of characters that are not |
		//   \|?                // an optional | character
		//   [^\]]*             // any amount of characters that are not ]
		//   \]                 // ]
		// /g
		.replace(/\[([^|])*\|?[^\]]*\]/g, '$1')

		// Remove optional characters.
		//
		// /
		//   [^\\]              // any character that is not \
		//   \?                 // ?
		// /g
		.replace(/[^\\]\?/g, '')

		// Remove boundaries at beginning and end.
		.replace(/^\\b|\\b$/g, '') 

		// Unescape only single backslash, not multiple.
		//
		// /
		//   \\                 // \
		//   (?!\\)             // look-ahead, any character that isn't \
		// /g
		.replace(/\\(?!\\)/g, '');
}

var sorting = {};

/**
 * Sort by alphanumeric in this order: symbols -> numbers -> AaBb... -> numbers
 */
sorting.byText = function (a, b) {
	textA = a.getText().toLowerCase();
	textB = b.getText().toLowerCase();

	if (textA < textB) {
		return -1;
	}
	if (textA > textB) {
		return 1;
	}
	return 0;
}

/**
 * Basic smilies before non-basic smilies.
 */
sorting.bySmiley = function (a, b) {
	if (a.isSmiley() &&	!b.isSmiley()) {
		return -1;
	}
	if (b.isSmiley() &&	!a.isSmiley()) {
		return 1;
	}
	return 0;
};

/**
 * Globals before subscription emotes, subscriptions in alphabetical order.
 */
sorting.byChannelName = function (a, b) {
	var channelA = a.getChannelName();
	var channelB = b.getChannelName();

	// Both don't have channels.
	if (!channelA && !channelB) {
		return 0;
	}

	// "A" has channel, "B" doesn't.
	if (channelA && !channelB) {
		return 1;
	}
	// "B" has channel, "A" doesn't.
	if (channelB && !channelA) {
		return -1;
	}

	channelA = channelA.toLowerCase();
	channelB = channelB.toLowerCase();

	if (channelA < channelB) {
		return -1;
	}
	if (channelB > channelA) {
		return 1;
	}

	// All the same
	return 0;
};

/**
 * The general sort order for the all emotes category.
 * Smileys -> Channel grouping -> alphanumeric
 */
sorting.allEmotesCategory = function (a, b) {
	var bySmiley = sorting.bySmiley(a, b);
	var byChannelName  = sorting.byChannelName(a, b);
	var byText = sorting.byText(a, b);

	if (bySmiley !== 0) {
		return bySmiley;
	}
	if (byChannelName !== 0) {
		return byChannelName;
	}
	return byText;
};

module.exports = emoteStore;

},{"./logger":10,"./storage":12,"./twitch-api":14}],10:[function(require,module,exports){
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

},{"./storage":12}],11:[function(require,module,exports){
var storage = require('./storage');
var logger = require('./logger');
var emotes = require('./emotes');
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

api.registerEmoteGetter = emotes.registerGetter;
api.deregisterEmoteGetter = emotes.deregisterGetter;

module.exports = api;

},{"./emotes":9,"./logger":10,"./storage":12}],12:[function(require,module,exports){
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
// Channel name storage.
storage.channelNames = storage.global.createSubstore('channelNames');
// Badges storage.
storage.badges = storage.global.createSubstore('badges');

module.exports = storage;

},{"storage-wrapper":6}],13:[function(require,module,exports){
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
var twitchApi = window.Twitch.api;
var logger = require('./logger');
var api = {};

api.getBadges = function (username, callback) {
	// Note: not a documented API endpoint.
	twitchApi.get('chat/' + username + '/badges')
		.done(function (api) {
			callback(api);
		})
		.fail(function () {
			callback({});
		});
};

api.getUser = function (username, callback) {
	// Note: not a documented API endpoint.
	twitchApi.get('users/' + username)
		.done(function (api) {
			callback(api);
		})
		.fail(function () {
			callback({});
		});
};

api.getTickets = function (callback) {
	// Note: not a documented API endpoint.
	twitchApi.get(
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
};

api.onEmotesChange = function (callback, immediate) {
	var ember = require('./ember-api');
	var session = ember.get('controller:chat', 'currentRoom.tmiRoom.session');
	var response = null;

	if (typeof callback !== 'function') {
		throw new Error('`callback` must be a function.');
	}

	// No parser or no emotes loaded yet, try again.
	if (!session) {
		setTimeout(api.onEmotesChange, 100, callback, immediate);
		return;
	}

	// Call the callback immediately on registering.
	if (immediate) {
		response = session.getEmotes();
		if (!response || !response.emoticon_sets) {
			setTimeout(api.onEmotesChange, 100, callback, immediate);
			return;
		}

		callback(response.emoticon_sets);
		logger.debug('Called emote change handler immediately.');
	}

	// Listen for the event.
	session._emotesParser.on('emotes_changed', function (response) {
		callback(response.emoticon_sets);
		logger.debug('Called emote change handler.')
	});
	logger.debug('Registered listener for emote changes.');
};

module.exports = api;

},{"./ember-api":8,"./logger":10}],15:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxVc2Vyc1xcQ2xldHVzXFxQcm9qZWN0c1xcVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIi4vc3JjL3NjcmlwdC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvYnVpbGQvc3R5bGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9ob2dhbi5qcy9saWIvdGVtcGxhdGUuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9qcXVlcnktY3VzdG9tLXNjcm9sbGJhci9qcXVlcnkuY3VzdG9tLXNjcm9sbGJhci5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL3N0b3JhZ2Utd3JhcHBlci9pbmRleC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvcGFja2FnZS5qc29uIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy9lbWJlci1hcGkuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL2Vtb3Rlcy5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvbG9nZ2VyLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy9wdWJsaWMtYXBpLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy9zdG9yYWdlLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL3R3aXRjaC1hcGkuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9wbHVnaW5zL3Jlc2l6YWJsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDendCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNscEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy90ZW1wbGF0ZXMnKTtcclxudmFyIHBrZyA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xyXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9zdG9yYWdlJyk7XHJcbnZhciBwdWJsaWNBcGkgPSByZXF1aXJlKCcuL21vZHVsZXMvcHVibGljLWFwaScpO1xyXG52YXIgZW1iZXIgPSByZXF1aXJlKCcuL21vZHVsZXMvZW1iZXItYXBpJyk7XHJcbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuL21vZHVsZXMvbG9nZ2VyJyk7XHJcblxyXG52YXIgJCA9IG51bGw7XHJcbnZhciBqUXVlcnkgPSBudWxsO1xyXG5cclxuLy8gRXhwb3NlIHB1YmxpYyBhcGkuXHJcbmlmICh0eXBlb2Ygd2luZG93LmVtb3RlTWVudSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuXHR3aW5kb3cuZW1vdGVNZW51ID0gcHVibGljQXBpO1xyXG59XHJcblxyXG4vLyBTY3JpcHQtd2lkZSB2YXJpYWJsZXMuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gRE9NIGVsZW1lbnRzLlxyXG52YXIgZWxlbWVudHMgPSB7XHJcblx0Ly8gVGhlIGJ1dHRvbiB0byBzZW5kIGEgY2hhdCBtZXNzYWdlLlxyXG5cdGNoYXRCdXR0b246IG51bGwsXHJcblx0Ly8gVGhlIGFyZWEgd2hlcmUgYWxsIGNoYXQgbWVzc2FnZXMgYXJlIGNvbnRhaW5lZC5cclxuXHRjaGF0Q29udGFpbmVyOiBudWxsLFxyXG5cdC8vIFRoZSBpbnB1dCBmaWVsZCBmb3IgY2hhdCBtZXNzYWdlcy5cclxuXHRjaGF0Qm94OiBudWxsLFxyXG5cdC8vIFRoZSBidXR0b24gdXNlZCB0byBzaG93IHRoZSBtZW51LlxyXG5cdG1lbnVCdXR0b246IG51bGwsXHJcblx0Ly8gVGhlIG1lbnUgdGhhdCBjb250YWlucyBhbGwgZW1vdGVzLlxyXG5cdG1lbnU6IG51bGxcclxufTtcclxuXHJcbnZhciBoZWxwZXJzID0ge1xyXG5cdHVzZXI6IHtcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2sgaWYgdXNlciBpcyBsb2dnZWQgaW4sIGFuZCBwcm9tcHRzIHRoZW0gdG8gaWYgdGhleSBhcmVuJ3QuXHJcblx0XHQgKiBAcmV0dXJuIHtib29sZWFufSBgdHJ1ZWAgaWYgbG9nZ2VkIGluLCBgZmFsc2VgIGlmIGxvZ2dlZCBvdXQuXHJcblx0XHQgKi9cclxuXHRcdGxvZ2luOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdC8vIENoZWNrIGlmIGxvZ2dlZCBpbiBhbHJlYWR5LlxyXG5cdFx0XHRpZiAod2luZG93LlR3aXRjaCAmJiB3aW5kb3cuVHdpdGNoLnVzZXIuaXNMb2dnZWRJbigpKSB7XHJcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdVc2VyIGlzIGxvZ2dlZCBpbi4nKTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBOb3QgbG9nZ2VkIGluLCBjYWxsIFR3aXRjaCdzIGxvZ2luIG1ldGhvZC5cclxuXHRcdFx0JC5sb2dpbigpO1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ1VzZXIgaXMgbm90IGxvZ2dlZCBpbiwgc2hvdyB0aGUgbG9naW4gc2NyZWVuLicpO1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblx0fVxyXG59O1xyXG5cclxubG9nZ2VyLmxvZygnSW5pdGlhbCBsb2FkIG9uICcgKyBsb2NhdGlvbi5ocmVmKTtcclxuXHJcbi8vIE9ubHkgZW5hYmxlIHNjcmlwdCBpZiB3ZSBoYXZlIHRoZSByaWdodCB2YXJpYWJsZXMuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbnZhciBpbml0VGltZXIgPSAwO1xyXG4oZnVuY3Rpb24gaW5pdCh0aW1lKSB7XHJcblx0Ly8gRG9uJ3QgcnVuIGluIGFuIGlmcmFtZS5cclxuXHRpZiAod2luZG93LmZyYW1lRWxlbWVudCkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRcclxuXHRpZiAoIXRpbWUpIHtcclxuXHRcdHRpbWUgPSAwO1xyXG5cdH1cclxuXHJcblx0JCA9IGpRdWVyeSA9IHdpbmRvdy5qUXVlcnk7XHJcblx0dmFyIG9iamVjdHNMb2FkZWQgPSAoXHJcblx0XHR3aW5kb3cuVHdpdGNoICE9PSB1bmRlZmluZWQgJiZcclxuXHRcdGVtYmVyLmlzTG9hZGVkKCkgJiZcclxuXHRcdGpRdWVyeSAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHQkKCcuc2VuZC1jaGF0LWJ1dHRvbicpLmxlbmd0aFxyXG5cdCk7XHJcblx0aWYgKCFvYmplY3RzTG9hZGVkKSB7XHJcblx0XHQvLyBTdG9wcyB0cnlpbmcgYWZ0ZXIgMTAgbWludXRlcy5cclxuXHRcdGlmIChpbml0VGltZXIgPj0gNjAwMDAwKSB7XHJcblx0XHRcdGxvZ2dlci5sb2coJ1Rha2luZyB0b28gbG9uZyB0byBsb2FkLCBzdG9wcGluZy4gUmVmcmVzaCB0aGUgcGFnZSB0byB0cnkgYWdhaW4uICgnICsgaW5pdFRpbWVyICsgJ21zKScpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gR2l2ZSBhbiB1cGRhdGUgZXZlcnkgMTAgc2Vjb25kcy5cclxuXHRcdGlmIChpbml0VGltZXIgJSAxMDAwMCkge1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ1N0aWxsIHdhaXRpbmcgZm9yIG9iamVjdHMgdG8gbG9hZC4gKCcgKyBpbml0VGltZXIgKyAnbXMpJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gQnVtcCB0aW1lIHVwIGFmdGVyIDFzIHRvIHJlZHVjZSBwb3NzaWJsZSBsYWcuXHJcblx0XHR0aW1lID0gdGltZSA+PSAxMDAwID8gMTAwMCA6IHRpbWUgKyAyNTtcclxuXHRcdGluaXRUaW1lciArPSB0aW1lO1xyXG5cclxuXHRcdHNldFRpbWVvdXQoaW5pdCwgdGltZSwgdGltZSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBkZWFjdGl2YXRlKCkge1xyXG5cdFx0Ly8gUmVtb3ZlIG1lbnUgZnJvbSBzY3JlZW4gd2hlbiByZWRpcmVjdGluZy5cclxuXHRcdGlmIChlbGVtZW50cy5tZW51KSB7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuaGlkZSgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRlbWJlci5ob29rKCdyb3V0ZTpjaGFubmVsJywgaW5pdCwgZGVhY3RpdmF0ZSk7XHJcblx0ZW1iZXIuaG9vaygncm91dGU6Y2hhdCcsIGluaXQsIGRlYWN0aXZhdGUpO1xyXG5cclxuXHRzZXR1cCgpO1xyXG59KSgpO1xyXG5cclxuLy8gU3RhcnQgb2YgZnVuY3Rpb25zLlxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbi8qKlxyXG4gKiBSdW5zIGluaXRpYWwgc2V0dXAgb2YgRE9NIGFuZCB2YXJpYWJsZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzZXR1cCgpIHtcclxuXHR2YXIgZW1vdGVzID0gcmVxdWlyZSgnLi9tb2R1bGVzL2Vtb3RlcycpO1xyXG5cdGxvZ2dlci5kZWJ1ZygnUnVubmluZyBzZXR1cC4uLicpO1xyXG5cdC8vIExvYWQgQ1NTLlxyXG5cdHJlcXVpcmUoJy4uL2J1aWxkL3N0eWxlcycpO1xyXG5cdC8vIExvYWQgalF1ZXJ5IHBsdWdpbnMuXHJcblx0cmVxdWlyZSgnLi9wbHVnaW5zL3Jlc2l6YWJsZScpO1xyXG5cdHJlcXVpcmUoJ2pxdWVyeS1jdXN0b20tc2Nyb2xsYmFyL2pxdWVyeS5jdXN0b20tc2Nyb2xsYmFyJyk7XHJcblx0XHJcblx0ZWxlbWVudHMuY2hhdEJ1dHRvbiA9ICQoJy5zZW5kLWNoYXQtYnV0dG9uJyk7XHJcblx0ZWxlbWVudHMuY2hhdEJveCA9ICQoJy5jaGF0LWludGVyZmFjZSB0ZXh0YXJlYScpO1xyXG5cdGVsZW1lbnRzLmNoYXRDb250YWluZXIgPSAkKCcuY2hhdC1tZXNzYWdlcycpO1xyXG5cclxuXHRjcmVhdGVNZW51RWxlbWVudHMoKTtcclxuXHRiaW5kTGlzdGVuZXJzKCk7XHJcblx0ZW1vdGVzLmluaXQoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgdGhlIGluaXRpYWwgbWVudSBlbGVtZW50c1xyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlTWVudUVsZW1lbnRzKCkge1xyXG5cdC8vIFJlbW92ZSBtZW51IGJ1dHRvbiBpZiBmb3VuZC5cclxuXHRlbGVtZW50cy5tZW51QnV0dG9uID0gJCgnI2Vtb3RlLW1lbnUtYnV0dG9uJyk7XHJcblx0aWYgKGVsZW1lbnRzLm1lbnVCdXR0b24ubGVuZ3RoKSB7XHJcblx0XHRlbGVtZW50cy5tZW51QnV0dG9uLnJlbW92ZSgpO1xyXG5cdH1cclxuXHQvLyBDcmVhdGUgbWVudSBidXR0b24uXHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbiA9ICQodGVtcGxhdGVzLmVtb3RlQnV0dG9uKCkpO1xyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24uaW5zZXJ0QmVmb3JlKGVsZW1lbnRzLmNoYXRCdXR0b24pO1xyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24uaGlkZSgpO1xyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24uZmFkZUluKCk7XHJcblxyXG5cdC8vIFJlbW92ZSBtZW51IGlmIGZvdW5kLlxyXG5cdGVsZW1lbnRzLm1lbnUgPSAkKCcjZW1vdGUtbWVudS1mb3ItdHdpdGNoJyk7XHJcblx0aWYgKGVsZW1lbnRzLm1lbnUubGVuZ3RoKSB7XHJcblx0XHRlbGVtZW50cy5tZW51LnJlbW92ZSgpO1xyXG5cdH1cclxuXHQvLyBDcmVhdGUgbWVudS5cclxuXHRlbGVtZW50cy5tZW51ID0gJCh0ZW1wbGF0ZXMubWVudSgpKTtcclxuXHRlbGVtZW50cy5tZW51LmFwcGVuZFRvKGRvY3VtZW50LmJvZHkpO1xyXG5cclxuXHRsb2dnZXIuZGVidWcoJ0NyZWF0ZWQgbWVudSBlbGVtZW50cy4nKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEJpbmQgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gYmluZExpc3RlbmVycygpIHtcclxuXHJcblx0ZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcclxuXHRcdC8vIE1lbnUgc2hvd24sIGhpZGUgaXQuXHJcblx0XHRpZiAoZWxlbWVudHMubWVudS5pcygnOnZpc2libGUnKSkge1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LmhpZGUoKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5yZW1vdmVDbGFzcygncGlubmVkJyk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUucmVtb3ZlQ2xhc3MoJ2VkaXRpbmcnKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcblxyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ01lbnUgaGlkZGVuLicpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gTWVudSBoaWRkZW4sIHNob3cgaXQuXHJcblx0XHRlbHNlIGlmIChoZWxwZXJzLnVzZXIubG9naW4oKSkge1xyXG5cdFx0XHRwb3B1bGF0ZUVtb3Rlc01lbnUoKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5zaG93KCk7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnVCdXR0b24uYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNldXAnLCBjaGVja0ZvckNsaWNrT3V0c2lkZSk7XHJcblxyXG5cdFx0XHQvLyBNZW51IG1vdmVkLCBtb3ZlIGl0IGJhY2suXHJcblx0XHRcdGlmIChlbGVtZW50cy5tZW51Lmhhc0NsYXNzKCdtb3ZlZCcpKSB7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5vZmZzZXQoSlNPTi5wYXJzZShlbGVtZW50cy5tZW51LmF0dHIoJ2RhdGEtb2Zmc2V0JykpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBOZXZlciBtb3ZlZCwgbWFrZSBpdCB0aGUgc2FtZSBzaXplIGFzIHRoZSBjaGF0IHdpbmRvdy5cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0dmFyIGRpZmYgPSBlbGVtZW50cy5tZW51LmhlaWdodCgpIC0gZWxlbWVudHMubWVudS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpLmhlaWdodCgpO1xyXG5cdFx0XHRcdC8vIEFkanVzdCB0aGUgc2l6ZSBhbmQgcG9zaXRpb24gb2YgdGhlIHBvcHVwLlxyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUuaGVpZ2h0KGVsZW1lbnRzLmNoYXRDb250YWluZXIub3V0ZXJIZWlnaHQoKSAtIChlbGVtZW50cy5tZW51Lm91dGVySGVpZ2h0KCkgLSBlbGVtZW50cy5tZW51LmhlaWdodCgpKSk7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS53aWR0aChlbGVtZW50cy5jaGF0Q29udGFpbmVyLm91dGVyV2lkdGgoKSAtIChlbGVtZW50cy5tZW51Lm91dGVyV2lkdGgoKSAtIGVsZW1lbnRzLm1lbnUud2lkdGgoKSkpO1xyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUub2Zmc2V0KGVsZW1lbnRzLmNoYXRDb250YWluZXIub2Zmc2V0KCkpO1xyXG5cdFx0XHRcdC8vIEZpeCBgLmVtb3Rlcy1hbGxgIGhlaWdodC5cclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykuaGVpZ2h0KGVsZW1lbnRzLm1lbnUuaGVpZ2h0KCkgLSBkaWZmKTtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykud2lkdGgoZWxlbWVudHMubWVudS53aWR0aCgpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBSZWNhbGN1bGF0ZSBhbnkgc2Nyb2xsIGJhcnMuXHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnLnNjcm9sbGFibGUnKS5jdXN0b21TY3JvbGxiYXIoJ3Jlc2l6ZScpO1xyXG5cclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdNZW51IHZpc2libGUuJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gY2hlY2tGb3JDbGlja091dHNpZGUoZSkge1xyXG5cdFx0XHQvLyBOb3Qgb3V0c2lkZSBvZiB0aGUgbWVudSwgaWdub3JlIHRoZSBjbGljay5cclxuXHRcdFx0aWYgKCQoZS50YXJnZXQpLmlzKCcjZW1vdGUtbWVudS1mb3ItdHdpdGNoLCAjZW1vdGUtbWVudS1mb3ItdHdpdGNoIConKSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBDbGlja2VkIG9uIHRoZSBtZW51IGJ1dHRvbiwganVzdCByZW1vdmUgdGhlIGxpc3RlbmVyIGFuZCBsZXQgdGhlIG5vcm1hbCBsaXN0ZW5lciBoYW5kbGUgaXQuXHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5pcygnOnZpc2libGUnKSB8fCAkKGUudGFyZ2V0KS5pcygnI2Vtb3RlLW1lbnUtYnV0dG9uLCAjZW1vdGUtbWVudS1idXR0b24gKicpKSB7XHJcblx0XHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgY2hlY2tGb3JDbGlja091dHNpZGUpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBDbGlja2VkIG91dHNpZGUsIG1ha2Ugc3VyZSB0aGUgbWVudSBpc24ndCBwaW5uZWQuXHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5oYXNDbGFzcygncGlubmVkJykpIHtcclxuXHRcdFx0XHQvLyBNZW51IHdhc24ndCBwaW5uZWQsIHJlbW92ZSBsaXN0ZW5lci5cclxuXHRcdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCBjaGVja0ZvckNsaWNrT3V0c2lkZSk7XHJcblx0XHRcdFx0dG9nZ2xlTWVudSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBUb2dnbGUgbWVudS5cclxuXHRlbGVtZW50cy5tZW51QnV0dG9uLm9uKCdjbGljaycsIHRvZ2dsZU1lbnUpO1xyXG5cclxuXHQvLyBNYWtlIGRyYWdnYWJsZS5cclxuXHRlbGVtZW50cy5tZW51LmRyYWdnYWJsZSh7XHJcblx0XHRoYW5kbGU6ICcuZHJhZ2dhYmxlJyxcclxuXHRcdHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdtb3ZlZCcpO1xyXG5cdFx0fSxcclxuXHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5hdHRyKCdkYXRhLW9mZnNldCcsIEpTT04uc3RyaW5naWZ5KGVsZW1lbnRzLm1lbnUub2Zmc2V0KCkpKTtcclxuXHRcdH0sXHJcblx0XHRjb250YWlubWVudDogJChkb2N1bWVudC5ib2R5KVxyXG5cdH0pO1xyXG5cclxuXHRlbGVtZW50cy5tZW51LnJlc2l6YWJsZSh7XHJcblx0XHRoYW5kbGU6ICdbZGF0YS1jb21tYW5kPVwicmVzaXplLWhhbmRsZVwiXScsXHJcblx0XHRyZXNpemU6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Ly8gUmVjYWxjdWxhdGUgYW55IHNjcm9sbCBiYXJzLlxyXG5cdFx0XHRlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJykuY3VzdG9tU2Nyb2xsYmFyKCdyZXNpemUnKTtcclxuXHRcdH0sXHJcblx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdFx0XHQkKHRoaXMpLmFkZENsYXNzKCdtb3ZlZCcpO1xyXG5cdFx0fSxcclxuXHRcdGFsc29SZXNpemU6IGVsZW1lbnRzLm1lbnUuZmluZCgnLnNjcm9sbGFibGUnKSxcclxuXHRcdGNvbnRhaW5tZW50OiAkKGRvY3VtZW50LmJvZHkpLFxyXG5cdFx0bWluSGVpZ2h0OiAxODAsXHJcblx0XHRtaW5XaWR0aDogMjAwXHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBtZW51IHBpbm5pbmcuXHJcblx0ZWxlbWVudHMubWVudS5maW5kKCdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLXBpbm5lZFwiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGVsZW1lbnRzLm1lbnUudG9nZ2xlQ2xhc3MoJ3Bpbm5lZCcpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgbWVudSBlZGl0aW5nLlxyXG5cdGVsZW1lbnRzLm1lbnUuZmluZCgnW2RhdGEtY29tbWFuZD1cInRvZ2dsZS1lZGl0aW5nXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0ZWxlbWVudHMubWVudS50b2dnbGVDbGFzcygnZWRpdGluZycpO1xyXG5cdFx0Ly8gUmVjYWxjdWxhdGUgYW55IHNjcm9sbCBiYXJzLlxyXG5cdFx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcigncmVzaXplJyk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBlbW90ZSBjbGlja2luZyAoZGVsZWdhdGVkKS5cclxuXHRlbGVtZW50cy5tZW51Lm9uKCdjbGljaycsICcuZW1vdGUnLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoZWxlbWVudHMubWVudS5pcygnLmVkaXRpbmcnKSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpbnNlcnRFbW90ZVRleHQoJCh0aGlzKS5hdHRyKCdkYXRhLWVtb3RlJykpO1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdDbGlja2VkIGVtb3RlOiAnICsgJCh0aGlzKS5hdHRyKCdkYXRhLWVtb3RlJykpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgZW1vdGUgaGlkaW5nIChkZWxlZ2F0ZWQpLlxyXG5cdGVsZW1lbnRzLm1lbnUub24oJ2NsaWNrJywgJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtdmlzaWJpbGl0eVwiXScsIGZ1bmN0aW9uICgpIHtcclxuXHRcdC8vIE1ha2Ugc3VyZSB3ZSBhcmUgaW4gZWRpdCBtb2RlLlxyXG5cdFx0aWYgKCFlbGVtZW50cy5tZW51LmlzKCcuZWRpdGluZycpKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdHZhciB3aGljaCA9ICQodGhpcykuYXR0cignZGF0YS13aGljaCcpO1xyXG5cdFx0dmFyIGlzVmlzaWJsZSA9IHN0b3JhZ2UudmlzaWJpbGl0eS5nZXQod2hpY2gsIHRydWUpO1xyXG5cdFx0Ly8gVG9nZ2xlIHZpc2liaWxpdHkuXHJcblx0XHRzdG9yYWdlLnZpc2liaWxpdHkuc2V0KHdoaWNoLCAhaXNWaXNpYmxlKTtcclxuXHRcdHBvcHVsYXRlRW1vdGVzTWVudSgpO1xyXG5cclxuXHRcdGxvZ2dlci5kZWJ1ZygnU2V0IGhpZGRlbiBlbW90ZS4nLCB7XHJcblx0XHRcdHdoaWNoOiB3aGljaCxcclxuXHRcdFx0aXNWaXNpYmxlOiAhaXNWaXNpYmxlXHJcblx0XHR9KTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIGVtb3RlIHN0YXJyaW5nIChkZWxlZ2F0ZWQpLlxyXG5cdGVsZW1lbnRzLm1lbnUub24oJ2NsaWNrJywgJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtc3RhcnJlZFwiXScsIGZ1bmN0aW9uICgpIHtcclxuXHRcdC8vIE1ha2Ugc3VyZSB3ZSBhcmUgaW4gZWRpdCBtb2RlLlxyXG5cdFx0aWYgKCFlbGVtZW50cy5tZW51LmlzKCcuZWRpdGluZycpKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdHZhciB3aGljaCA9ICQodGhpcykuYXR0cignZGF0YS13aGljaCcpO1xyXG5cdFx0dmFyIGlzU3RhcnJlZCA9IHN0b3JhZ2Uuc3RhcnJlZC5nZXQod2hpY2gsIGZhbHNlKTtcclxuXHRcdC8vIFRvZ2dsZSBzdGFyLlxyXG5cdFx0c3RvcmFnZS5zdGFycmVkLnNldCh3aGljaCwgIWlzU3RhcnJlZCk7XHJcblx0XHRwb3B1bGF0ZUVtb3Rlc01lbnUoKTtcclxuXHJcblx0XHRsb2dnZXIuZGVidWcoJ1NldCBzdGFycmVkIGVtb3RlLicsIHtcclxuXHRcdFx0d2hpY2g6IHdoaWNoLFxyXG5cdFx0XHRpc1N0YXJyZWQ6ICFpc1N0YXJyZWRcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJykuY3VzdG9tU2Nyb2xsYmFyKHtcclxuXHRcdHNraW46ICdkZWZhdWx0LXNraW4nLFxyXG5cdFx0aFNjcm9sbDogZmFsc2UsXHJcblx0XHRwcmV2ZW50RGVmYXVsdFNjcm9sbDogdHJ1ZVxyXG5cdH0pO1xyXG5cclxuXHRsb2dnZXIuZGVidWcoJ0JvdW5kZWQgZXZlbnQgbGlzdGVuZXJzLicpO1xyXG59XHJcblxyXG4vKipcclxuICogUG9wdWxhdGVzIHRoZSBwb3B1cCBtZW51IHdpdGggY3VycmVudCBlbW90ZSBkYXRhLlxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdWxhdGVFbW90ZXNNZW51KCkge1xyXG5cdHZhciBlbW90ZXMgPSByZXF1aXJlKCcuL21vZHVsZXMvZW1vdGVzJyk7XHJcblx0dmFyIGNvbnRhaW5lciA9IG51bGw7XHJcblxyXG5cdC8vIEFkZCBzdGFycmVkIGVtb3Rlcy5cclxuXHRjb250YWluZXIgPSBlbGVtZW50cy5tZW51LmZpbmQoJyNzdGFycmVkLWVtb3Rlcy1ncm91cCcpO1xyXG5cdGNvbnRhaW5lci5odG1sKCcnKTtcclxuXHRlbW90ZXMuZ2V0RW1vdGVzKFxyXG5cdFx0ZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRcdHJldHVybiBlbW90ZS5pc0Zhdm9yaXRlKCk7XHJcblx0XHR9LFxyXG5cdFx0J2RlZmF1bHQnXHJcblx0KS5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0Y3JlYXRlRW1vdGUoZW1vdGUsIGNvbnRhaW5lcik7XHJcblx0fSk7XHJcblxyXG5cdC8vIEFkZCBhbGwgZW1vdGVzLlxyXG5cdGNvbnRhaW5lciA9IGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKTtcclxuXHRpZiAoY29udGFpbmVyLmZpbmQoJy5vdmVydmlldycpLmxlbmd0aCkge1xyXG5cdFx0Y29udGFpbmVyID0gY29udGFpbmVyLmZpbmQoJy5vdmVydmlldycpO1xyXG5cdH1cclxuXHRjb250YWluZXIuaHRtbCgnJyk7XHJcblx0ZW1vdGVzLmdldEVtb3RlcyhudWxsLCAnY2hhbm5lbCcpLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyLCB0cnVlKTtcclxuXHR9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEluc2VydHMgYW4gZW1vdGUgaW50byB0aGUgY2hhdCBib3guXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSAoZS5nLiBcIkthcHBhXCIpLlxyXG4gKi9cclxuZnVuY3Rpb24gaW5zZXJ0RW1vdGVUZXh0KHRleHQpIHtcclxuXHQvLyBHZXQgaW5wdXQuXHJcblx0dmFyIGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2hhdF90ZXh0X2lucHV0LCAuY2hhdC1pbnRlcmZhY2UgdGV4dGFyZWEnKTtcclxuXHJcblx0Ly8gSW5zZXJ0IGF0IGN1cnNvciAvIHJlcGxhY2Ugc2VsZWN0aW9uLlxyXG5cdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvQ29kZV9zbmlwcGV0cy9NaXNjZWxsYW5lb3VzXHJcblx0dmFyIHNlbGVjdGlvbkVuZCA9IGVsZW1lbnQuc2VsZWN0aW9uU3RhcnQgKyB0ZXh0Lmxlbmd0aDtcclxuXHR2YXIgY3VycmVudFZhbHVlID0gZWxlbWVudC52YWx1ZTtcclxuXHR2YXIgYmVmb3JlVGV4dCA9IGN1cnJlbnRWYWx1ZS5zdWJzdHJpbmcoMCwgZWxlbWVudC5zZWxlY3Rpb25TdGFydCk7XHJcblx0dmFyIGFmdGVyVGV4dCA9IGN1cnJlbnRWYWx1ZS5zdWJzdHJpbmcoZWxlbWVudC5zZWxlY3Rpb25FbmQsIGN1cnJlbnRWYWx1ZS5sZW5ndGgpO1xyXG5cdC8vIFNtYXJ0IHBhZGRpbmcsIG9ubHkgcHV0IHNwYWNlIGF0IHN0YXJ0IGlmIG5lZWRlZC5cclxuXHRpZiAoXHJcblx0XHRiZWZvcmVUZXh0ICE9PSAnJyAmJlxyXG5cdFx0YmVmb3JlVGV4dC5zdWJzdHIoLTEpICE9PSAnICdcclxuXHQpIHtcclxuXHRcdHRleHQgPSAnICcgKyB0ZXh0O1xyXG5cdH1cclxuXHQvLyBBbHdheXMgcHV0IHNwYWNlIGF0IGVuZC5cclxuXHR0ZXh0ID0gYmVmb3JlVGV4dCArIHRleHQgKyAnICcgKyBhZnRlclRleHQ7XHJcblx0Ly8gU2V0IHRoZSB0ZXh0LlxyXG5cdGVtYmVyLmdldCgnY29udHJvbGxlcjpjaGF0JywgJ2N1cnJlbnRSb29tJykuc2V0KCdtZXNzYWdlVG9TZW5kJywgdGV4dCk7XHJcblx0ZWxlbWVudC5mb2N1cygpO1xyXG5cdC8vIFB1dCBjdXJzb3IgYXQgZW5kLlxyXG5cdHNlbGVjdGlvbkVuZCA9IGVsZW1lbnQuc2VsZWN0aW9uU3RhcnQgKyB0ZXh0Lmxlbmd0aDtcclxuXHRlbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKHNlbGVjdGlvbkVuZCwgc2VsZWN0aW9uRW5kKTtcclxuXHJcblx0Ly8gQ2xvc2UgcG9wdXAgaWYgaXQgaGFzbid0IGJlZW4gbW92ZWQgYnkgdGhlIHVzZXIuXHJcblx0aWYgKCFlbGVtZW50cy5tZW51Lmhhc0NsYXNzKCdwaW5uZWQnKSkge1xyXG5cdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5jbGljaygpO1xyXG5cdH1cclxuXHQvLyBSZS1wb3B1bGF0ZSBhcyBpdCBpcyBzdGlsbCBvcGVuLlxyXG5cdGVsc2Uge1xyXG5cdFx0cG9wdWxhdGVFbW90ZXNNZW51KCk7XHJcblx0fVxyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgZW1vdGUgZWxlbWVudCBhbmQgbGlzdGVucyBmb3IgYSBjbGljayBldmVudCB0aGF0IHdpbGwgYWRkIHRoZSBlbW90ZSB0ZXh0IHRvIHRoZSBjaGF0LlxyXG4gKiBAcGFyYW0ge29iamVjdH0gIGVtb3RlICAgICAgVGhlIGVtb3RlIHRoYXQgeW91IHdhbnQgdG8gYWRkLiBUaGlzIG9iamVjdCBzaG91bGQgYmUgb25lIGNvbWluZyBmcm9tIGBlbW90ZXNgLlxyXG4gKiBAcGFyYW0ge2VsZW1lbnR9IGNvbnRhaW5lciAgVGhlIEhUTUwgZWxlbWVudCB0aGF0IHRoZSBlbW90ZSBzaG91bGQgYmUgYXBwZW5kZWQgdG8uXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc2hvd0hlYWRlciBXaGV0aGVyIGEgaGVhZGVyIHNob3VsZGJlIGNyZWF0ZWQgaWYgZm91bmQuIE9ubHkgY3JlYXRlcyB0aGUgaGVhZGVyIG9uY2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyLCBzaG93SGVhZGVyKSB7XHJcblx0Ly8gTm8gY29udGFpbmVyLCBjYW4ndCBhZGQuXHJcblx0aWYgKCFjb250YWluZXIubGVuZ3RoKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdGlmIChzaG93SGVhZGVyKSB7XHJcblx0XHRpZiAoZW1vdGUuZ2V0Q2hhbm5lbE5hbWUoKSkge1xyXG5cdFx0XHRpZiAoIWVsZW1lbnRzLm1lbnUuZmluZCgnLmdyb3VwLWhlYWRlcltkYXRhLWVtb3RlLWNoYW5uZWw9XCInICsgZW1vdGUuZ2V0Q2hhbm5lbE5hbWUoKSArICdcIl0nKS5sZW5ndGgpIHtcclxuXHRcdFx0XHRjb250YWluZXIuYXBwZW5kKFxyXG5cdFx0XHRcdFx0JCh0ZW1wbGF0ZXMuZW1vdGVHcm91cEhlYWRlcih7XHJcblx0XHRcdFx0XHRcdGJhZGdlOiBlbW90ZS5nZXRDaGFubmVsQmFkZ2UoKSxcclxuXHRcdFx0XHRcdFx0Y2hhbm5lbDogZW1vdGUuZ2V0Q2hhbm5lbE5hbWUoKSxcclxuXHRcdFx0XHRcdFx0Y2hhbm5lbERpc3BsYXlOYW1lOiBlbW90ZS5nZXRDaGFubmVsRGlzcGxheU5hbWUoKSxcclxuXHRcdFx0XHRcdFx0aXNWaXNpYmxlOiBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KCdjaGFubmVsLScgKyBlbW90ZS5nZXRDaGFubmVsTmFtZSgpLCB0cnVlKVxyXG5cdFx0XHRcdFx0fSkpXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGNoYW5uZWxDb250YWluZXIgPSBjb250YWluZXIuZmluZCgnLmdyb3VwLWhlYWRlcltkYXRhLWVtb3RlLWNoYW5uZWw9XCInICsgZW1vdGUuZ2V0Q2hhbm5lbE5hbWUoKSArICdcIl0nKTtcclxuXHRpZiAoY2hhbm5lbENvbnRhaW5lci5sZW5ndGgpIHtcclxuXHRcdGNvbnRhaW5lciA9IGNoYW5uZWxDb250YWluZXI7XHJcblx0fVxyXG5cdGNvbnRhaW5lci5hcHBlbmQoXHJcblx0XHQkKHRlbXBsYXRlcy5lbW90ZSh7XHJcblx0XHRcdHVybDogZW1vdGUuZ2V0VXJsKCksXHJcblx0XHRcdHRleHQ6IGVtb3RlLmdldFRleHQoKSxcclxuXHRcdFx0dGhpcmRQYXJ0eTogZW1vdGUuaXNUaGlyZFBhcnR5KCksXHJcblx0XHRcdGlzVmlzaWJsZTogZW1vdGUuaXNWaXNpYmxlKCksXHJcblx0XHRcdGlzU3RhcnJlZDogZW1vdGUuaXNGYXZvcml0ZSgpXHJcblx0XHR9KSlcclxuXHQpO1xyXG59XHJcbiIsIihmdW5jdGlvbiAoZG9jLCBjc3NUZXh0KSB7XG4gICAgdmFyIGlkID0gXCJlbW90ZS1tZW51LWZvci10d2l0Y2gtc3R5bGVzXCI7XG4gICAgdmFyIHN0eWxlRWwgPSBkb2MuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIGlmICghc3R5bGVFbCkge1xuICAgICAgICBzdHlsZUVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgICAgc3R5bGVFbC5pZCA9IGlkO1xuICAgICAgICBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdLmFwcGVuZENoaWxkKHN0eWxlRWwpO1xuICAgIH1cbiAgICBpZiAoc3R5bGVFbC5zdHlsZVNoZWV0KSB7XG4gICAgICAgIGlmICghc3R5bGVFbC5zdHlsZVNoZWV0LmRpc2FibGVkKSB7XG4gICAgICAgICAgICBzdHlsZUVsLnN0eWxlU2hlZXQuY3NzVGV4dCA9IGNzc1RleHQ7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3R5bGVFbC5pbm5lckhUTUwgPSBjc3NUZXh0O1xuICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHtcbiAgICAgICAgICAgIHN0eWxlRWwuaW5uZXJUZXh0ID0gY3NzVGV4dDtcbiAgICAgICAgfVxuICAgIH1cbn0oZG9jdW1lbnQsIFwiLyoqXFxuXCIgK1xuXCIgKiBNaW5pZmllZCBzdHlsZS5cXG5cIiArXG5cIiAqIE9yaWdpbmFsIGZpbGVuYW1lOiBcXFxcbm9kZV9tb2R1bGVzXFxcXGpxdWVyeS1jdXN0b20tc2Nyb2xsYmFyXFxcXGpxdWVyeS5jdXN0b20tc2Nyb2xsYmFyLmNzc1xcblwiICtcblwiICovXFxuXCIgK1xuXCIuc2Nyb2xsYWJsZXtwb3NpdGlvbjpyZWxhdGl2ZX0uc2Nyb2xsYWJsZTpmb2N1c3tvdXRsaW5lOjB9LnNjcm9sbGFibGUgLnZpZXdwb3J0e3Bvc2l0aW9uOnJlbGF0aXZlO292ZXJmbG93OmhpZGRlbn0uc2Nyb2xsYWJsZSAudmlld3BvcnQgLm92ZXJ2aWV3e3Bvc2l0aW9uOmFic29sdXRlfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFye2Rpc3BsYXk6bm9uZX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci52ZXJ0aWNhbHtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO2hlaWdodDoxMDAlfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyLmhvcml6b250YWx7cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MTAwJX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhciAudGh1bWJ7cG9zaXRpb246YWJzb2x1dGV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIudmVydGljYWwgLnRodW1ie3dpZHRoOjEwMCU7bWluLWhlaWdodDoxMHB4fS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyLmhvcml6b250YWwgLnRodW1ie2hlaWdodDoxMDAlO21pbi13aWR0aDoxMHB4O2xlZnQ6MH0ubm90LXNlbGVjdGFibGV7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1raHRtbC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lfS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbntwYWRkaW5nLXJpZ2h0OjEwcHg7cGFkZGluZy1ib3R0b206NnB4fS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhci52ZXJ0aWNhbHt3aWR0aDo2cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyLmhvcml6b250YWx7aGVpZ2h0OjZweH0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6IzAwMDtvcGFjaXR5Oi40O2JvcmRlci1yYWRpdXM6M3B4Oy1tb3otYm9yZGVyLXJhZGl1czo0cHg7LXdlYmtpdC1ib3JkZXItcmFkaXVzOjRweH0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXI6aG92ZXIgLnRodW1ie29wYWNpdHk6LjZ9LnNjcm9sbGFibGUuZ3JheS1za2lue3BhZGRpbmctcmlnaHQ6MTdweH0uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXJ7Ym9yZGVyOjFweCBzb2xpZCBncmF5O2JhY2tncm91bmQtY29sb3I6I2QzZDNkM30uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6Z3JheX0uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXI6aG92ZXIgLnRodW1ie2JhY2tncm91bmQtY29sb3I6IzAwMH0uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXIudmVydGljYWx7d2lkdGg6MTBweH0uc2Nyb2xsYWJsZS5ncmF5LXNraW4gLnNjcm9sbC1iYXIuaG9yaXpvbnRhbHtoZWlnaHQ6MTBweDttYXJnaW4tdG9wOjJweH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbntwYWRkaW5nLXJpZ2h0OjE3cHh9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXJ7Ym9yZGVyOjFweCBzb2xpZCBncmF5O2JvcmRlci1yYWRpdXM6NHB4Oy1tb3otYm9yZGVyLXJhZGl1czo0cHg7LXdlYmtpdC1ib3JkZXItcmFkaXVzOjRweDtib3gtc2hhZG93Omluc2V0IDAgMCA1cHggIzg4OH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojOTVhYWJmO2JvcmRlci1yYWRpdXM6NHB4Oy1tb3otYm9yZGVyLXJhZGl1czo0cHg7LXdlYmtpdC1ib3JkZXItcmFkaXVzOjRweDtib3JkZXI6MXB4IHNvbGlkICM1MzY5ODR9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIudmVydGljYWwgLnRodW1ie3dpZHRoOjhweDtiYWNrZ3JvdW5kOi13ZWJraXQtZ3JhZGllbnQobGluZWFyLGxlZnQgdG9wLHJpZ2h0IHRvcCxjb2xvci1zdG9wKDAlLCM5NWFhYmYpLGNvbG9yLXN0b3AoMTAwJSwjNTQ3MDkyKSk7YmFja2dyb3VuZDotd2Via2l0LWxpbmVhci1ncmFkaWVudChsZWZ0LCM5NWFhYmYgMCwjNTQ3MDkyIDEwMCUpO2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCM5NWFhYmYgMCwjNTQ3MDkyIDEwMCUpOy1tcy1maWx0ZXI6XFxcInByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5ncmFkaWVudCggc3RhcnRDb2xvcnN0cj0nIzk1YWFiZicsIGVuZENvbG9yc3RyPScjNTQ3MDkyJyxHcmFkaWVudFR5cGU9MSApXFxcIn0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFsIC50aHVtYntoZWlnaHQ6OHB4O2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KCM5NWFhYmYsIzU0NzA5Mik7YmFja2dyb3VuZC1pbWFnZTotd2Via2l0LWxpbmVhci1ncmFkaWVudCgjOTVhYWJmLCM1NDcwOTIpOy1tcy1maWx0ZXI6XFxcInByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5ncmFkaWVudCggc3RhcnRDb2xvcnN0cj0nIzk1YWFiZicsIGVuZENvbG9yc3RyPScjNTQ3MDkyJyxHcmFkaWVudFR5cGU9MCApXFxcIn0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhci52ZXJ0aWNhbHt3aWR0aDoxMHB4fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyLmhvcml6b250YWx7aGVpZ2h0OjEwcHg7bWFyZ2luLXRvcDoycHh9XFxuXCIgK1xuXCIvKipcXG5cIiArXG5cIiAqIE1pbmlmaWVkIHN0eWxlLlxcblwiICtcblwiICogT3JpZ2luYWwgZmlsZW5hbWU6IFxcXFxzcmNcXFxcc3R5bGVzXFxcXHN0eWxlLmNzc1xcblwiICtcblwiICovXFxuXCIgK1xuXCJALXdlYmtpdC1rZXlmcmFtZXMgc3BpbnsxMDAley13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpO3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKX19QGtleWZyYW1lcyBzcGluezEwMCV7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpfX0jZW1vdGUtbWVudS1idXR0b257YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCSUFBQUFRQ0FZQUFBQWJCaTljQUFBQUFYTlNSMElBcnM0YzZRQUFBQVJuUVUxQkFBQ3hqd3Y4WVFVQUFBQUpjRWhaY3dBQURzTUFBQTdEQWNkdnFHUUFBQUtVU1VSQlZEaFBmWlROaTFKUkdNWnZNSXNXVVp0czVTSVhGWUswQ01FL0lHZ2h4VkM3V1VvVTFOQml4SSttUlNENE1Rem14emlLTzNYVUJoUm1VR1pLZEJHNDBYRUdVNmQwR0ZHWmNUNHF4VzFoaTdmenZOd1pxS3dERDV6N3ZzL3Z1ZWVlZSs2Vk1KeE81d1VoaGR2dGZ1SHorVDR0TFMyTmhlZ2ZHc01ETHhpd0hJSWhMaTU3UEo3NVZDcjFZMzkvbjRiRElZMUdvNGxDRHg1NHdZQ1ZZempvVmpRYS9keHV0eWZDa3dTdllKcGdPU1FmNzA4dHVCYTF5V1J5L0wrVi9DbDR3WUJGaGhUeGZMaHVtL2VzaWlKMXUxMktSQ0prc1Zob2ZYMmRUazVPemtITVVVTVBIbmpCMkY1NVZwRWhQZGUvTGJ4OEZxQkVJa0hwZEpvTUJnTnB0VnJTNlhSVXFWVE9nN2EzdDJsbVpvYjBlajJwMVdyMmdnR0xET25KM1FTWkg0Y29Iby9UeXNvS2h5Z1VDdEpvTkZRc0Zta3dHTEF3UjdoU3FTU1ZTc1ZlTUdDUklUMjlGNmZYSmk4WHkrVXltYzFtbXA2ZUpvZkRRZlY2blU1UFQxbVkyKzEyN3VIeFNxVVNoNEZGaGhRTHZydnRjcm0rWXBrSEJ3ZFVyVlpwYTJ1TGFyVWFkVG9kT2p3OFpHR09HbnJ3d0FzR0xETHcxaTR1THJ6UlllT09qNDlwYjIrUGRuZDNxZFZxOFN0R0FJUTVhbzFHZ3ozd2dnR0xERDRDNGl6Y0VjV2ZSMGRIYk1ybGNyU3hzY0dialZBSUs4bG1zN1M1dWNtQi9YNmZYejlZRHNFUUZ6ZGpzVml0Mld6eXFjMWtNcndmVnF1VmpFWWp6YzNOa2Nsa0lwdk5SbXRyYSt5QlZ6QWZCWHREanVHZ1M4RmdjRmJjOFF2dWhqTlNLQlFvRkFxUjZMRkVuL0w1UFBmZ2dYZDVlWGtXckJ6RFFkQzFRQ0JnRm9ldXQ3T3p3L3R5QnAyRlF6aFB3dE9GRnd6WTM0WW80QTl3Ulh6ZEQ4TGhjRTQ4d25jRTlubzlGdWFvaWQ1NzRia1BMeGdaLzN1STVwVFFWZkZsUC9MNy9XbWhiN0pTWHEvM0lYcnd5SFo1U05JdkdDbnF5aCtKNytnQUFBQUFTVVZPUks1Q1lJST0pIWltcG9ydGFudDtiYWNrZ3JvdW5kLXBvc2l0aW9uOjUwJTtiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7Y3Vyc29yOnBvaW50ZXI7bWFyZ2luLWxlZnQ6N3B4fSNlbW90ZS1tZW51LWJ1dHRvbi5hY3RpdmV7Ym9yZGVyLXJhZGl1czoycHg7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEyOCwxMjgsMTI4LC41KX0uZW1vdGUtbWVudXtwYWRkaW5nOjVweDt6LWluZGV4OjEwMDA7ZGlzcGxheTpub25lO2JhY2tncm91bmQtY29sb3I6IzIwMjAyMH0uZW1vdGUtbWVudSBhe2NvbG9yOiNmZmZ9LmVtb3RlLW1lbnUgYTpob3ZlcntjdXJzb3I6cG9pbnRlcjt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO2NvbG9yOiNjY2N9LmVtb3RlLW1lbnUgLmVtb3Rlcy1zdGFycmVke2hlaWdodDozOHB4fS5lbW90ZS1tZW51IC5kcmFnZ2FibGV7YmFja2dyb3VuZC1pbWFnZTotd2Via2l0LXJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDEwcHgpO2JhY2tncm91bmQtaW1hZ2U6cmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgMTBweCk7Y3Vyc29yOm1vdmU7aGVpZ2h0OjdweDttYXJnaW4tYm90dG9tOjNweH0uZW1vdGUtbWVudSAuZHJhZ2dhYmxlOmhvdmVye2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1yZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgMTBweCk7YmFja2dyb3VuZC1pbWFnZTpyZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgMTBweCl9LmVtb3RlLW1lbnUgLmhlYWRlci1pbmZve2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDA7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA1KSBpbnNldDtiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtbGluZWFyLWdyYWRpZW50KGJvdHRvbSx0cmFuc3BhcmVudCxyZ2JhKDAsMCwwLC41KSk7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQodG8gdG9wLHRyYW5zcGFyZW50LHJnYmEoMCwwLDAsLjUpKTtwYWRkaW5nOjJweDtjb2xvcjojZGRkO3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOnJlbGF0aXZlfS5lbW90ZS1tZW51IC5oZWFkZXItaW5mbyBpbWd7bWFyZ2luLXJpZ2h0OjhweH0uZW1vdGUtbWVudSAuZW1vdGV7ZGlzcGxheTppbmxpbmUtYmxvY2s7cGFkZGluZzoycHg7bWFyZ2luOjFweDtjdXJzb3I6cG9pbnRlcjtib3JkZXItcmFkaXVzOjVweDt0ZXh0LWFsaWduOmNlbnRlcjtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDozMHB4O2hlaWdodDozMHB4Oy13ZWJraXQtdHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZTtib3JkZXI6MXB4IHNvbGlkIHRyYW5zcGFyZW50fS5lbW90ZS1tZW51LmVkaXRpbmcgLmVtb3Rle2N1cnNvcjphdXRvfS5lbW90ZS1tZW51IC5lbW90ZSBpbWd7bWF4LXdpZHRoOjEwMCU7bWF4LWhlaWdodDoxMDAlO21hcmdpbjphdXRvO3Bvc2l0aW9uOmFic29sdXRlO3RvcDowO2JvdHRvbTowO2xlZnQ6MDtyaWdodDowfS5lbW90ZS1tZW51IC5zaW5nbGUtcm93e292ZXJmbG93OmhpZGRlbjtoZWlnaHQ6MzdweH0uZW1vdGUtbWVudSAuc2luZ2xlLXJvdyAuZW1vdGV7ZGlzcGxheTppbmxpbmUtYmxvY2s7bWFyZ2luLWJvdHRvbToxMDBweH0uZW1vdGUtbWVudSAuZW1vdGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LC4xKX0uZW1vdGUtbWVudSAucHVsbC1sZWZ0e2Zsb2F0OmxlZnR9LmVtb3RlLW1lbnUgLnB1bGwtcmlnaHR7ZmxvYXQ6cmlnaHR9LmVtb3RlLW1lbnUgLmZvb3Rlcnt0ZXh0LWFsaWduOmNlbnRlcjtib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwO2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LC4wNSkgaW5zZXQ7cGFkZGluZzo1cHggMCAycHg7bWFyZ2luLXRvcDo1cHg7aGVpZ2h0OjE4cHh9LmVtb3RlLW1lbnUgLmZvb3RlciAucHVsbC1sZWZ0e21hcmdpbi1yaWdodDo1cHh9LmVtb3RlLW1lbnUgLmZvb3RlciAucHVsbC1yaWdodHttYXJnaW4tbGVmdDo1cHh9LmVtb3RlLW1lbnUgLmljb257aGVpZ2h0OjE2cHg7d2lkdGg6MTZweDtvcGFjaXR5Oi41O2JhY2tncm91bmQtc2l6ZTpjb250YWluIWltcG9ydGFudH0uZW1vdGUtbWVudSAuaWNvbjpob3ZlcntvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLmljb24taG9tZXtiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU5qUWlEUW9nSUNCb1pXbG5hSFE5SWpZMElnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lEWTBJRFkwSWcwS0lDQWdhV1E5SWtOaGNHRmZNU0lOQ2lBZ0lIaHRiRHB6Y0dGalpUMGljSEpsYzJWeWRtVWlQanh0WlhSaFpHRjBZUTBLSUNBZ2FXUTlJbTFsZEdGa1lYUmhNekF3TVNJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jekk1T1RraUlDOCtEUW84Y0dGMGFBMEtJQ0FnWkQwaWJTQTFOeTR3TmpJc016RXVNems0SUdNZ01DNDVNeklzTFRFdU1ESTFJREF1T0RReUxDMHlMalU1TmlBdE1DNHlNREVzTFRNdU5UQTRJRXdnTXpNdU9EZzBMRGN1TnpnMUlFTWdNekl1T0RReExEWXVPRGN6SURNeExqRTJPU3cyTGpnNU1pQXpNQzR4TkRnc055NDRNamdnVENBM0xqQTVNeXd5T0M0NU5qSWdZeUF0TVM0d01qRXNNQzQ1TXpZZ0xURXVNRGN4TERJdU5UQTFJQzB3TGpFeE1Td3pMalV3TXlCc0lEQXVOVGM0TERBdU5qQXlJR01nTUM0NU5Ua3NNQzQ1T1RnZ01pNDFNRGtzTVM0eE1UY2dNeTQwTml3d0xqSTJOU0JzSURFdU56SXpMQzB4TGpVME15QjJJREl5TGpVNUlHTWdNQ3d4TGpNNE5pQXhMakV5TXl3eUxqVXdPQ0F5TGpVd09Dd3lMalV3T0NCb0lEZ3VPVGczSUdNZ01TNHpPRFVzTUNBeUxqVXdPQ3d0TVM0eE1qSWdNaTQxTURnc0xUSXVOVEE0SUZZZ016Z3VOVGMxSUdnZ01URXVORFl6SUhZZ01UVXVPREEwSUdNZ0xUQXVNRElzTVM0ek9EVWdNQzQ1TnpFc01pNDFNRGNnTWk0ek5UWXNNaTQxTURjZ2FDQTVMalV5TkNCaklERXVNemcxTERBZ01pNDFNRGdzTFRFdU1USXlJREl1TlRBNExDMHlMalV3T0NCV0lETXlMakV3TnlCaklEQXNNQ0F3TGpRM05pd3dMalF4TnlBeExqQTJNeXd3TGprek15QXdMalU0Tml3d0xqVXhOU0F4TGpneE55d3dMakV3TWlBeUxqYzBPU3d0TUM0NU1qUWdiQ0F3TGpZMU15d3RNQzQzTVRnZ2VpSU5DaUFnSUdsa1BTSndZWFJvTWprNU5TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTm1abVptWm1ZN1ptbHNiQzF2Y0dGamFYUjVPakVpSUM4K0RRbzhMM04yWno0PSkgbm8tcmVwZWF0IDUwJX0uZW1vdGUtbWVudSAuaWNvbi1nZWFye2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTWpFdU5Ua2lEUW9nSUNCb1pXbG5hSFE5SWpJeExqRXpOams1T1NJTkNpQWdJSFpwWlhkQ2IzZzlJakFnTUNBeU1TNDFPU0F5TVM0eE16Y2lEUW9nSUNCcFpEMGlRMkZ3WVY4eElnMEtJQ0FnZUcxc09uTndZV05sUFNKd2NtVnpaWEoyWlNJK1BHMWxkR0ZrWVhSaERRb2dJQ0JwWkQwaWJXVjBZV1JoZEdFek9TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pNM0lpQXZQZzBLUEhCaGRHZ05DaUFnSUdROUlrMGdNVGd1TmpJeUxEZ3VNVFExSURFNExqQTNOeXcyTGpnMUlHTWdNQ3d3SURFdU1qWTRMQzB5TGpnMk1TQXhMakUxTml3dE1pNDVOekVnVENBeE55NDFOVFFzTWk0eU5DQkRJREUzTGpRek9Dd3lMakV5TnlBeE5DNDFOellzTXk0ME16TWdNVFF1TlRjMkxETXVORE16SUV3Z01UTXVNalUyTERJdU9TQkRJREV6TGpJMU5pd3lMamtnTVRJdU1Ea3NNQ0F4TVM0NU15d3dJRWdnT1M0MU5qRWdReUE1TGpNNU5pd3dJRGd1TXpFM0xESXVPVEEySURndU16RTNMREl1T1RBMklFd2dOaTQ1T1Rrc015NDBOREVnWXlBd0xEQWdMVEl1T1RJeUxDMHhMakkwTWlBdE15NHdNelFzTFRFdU1UTXhJRXdnTWk0eU9Ea3NNeTQ1TlRFZ1F5QXlMakUzTXl3MExqQTJOQ0F6TGpVd055dzJMamcyTnlBekxqVXdOeXcyTGpnMk55Qk1JREl1T1RZeUxEZ3VNVFlnUXlBeUxqazJNaXc0TGpFMklEQXNPUzR6TURFZ01DdzVMalExTlNCMklESXVNekl5SUdNZ01Dd3dMakUyTWlBeUxqazJPU3d4TGpJeE9TQXlMamsyT1N3eExqSXhPU0JzSURBdU5UUTFMREV1TWpreElHTWdNQ3d3SUMweExqSTJPQ3d5TGpnMU9TQXRNUzR4TlRjc01pNDVOamtnYkNBeExqWTNPQ3d4TGpZME15QmpJREF1TVRFMExEQXVNVEV4SURJdU9UYzNMQzB4TGpFNU5TQXlMamszTnl3dE1TNHhPVFVnYkNBeExqTXlNU3d3TGpVek5TQmpJREFzTUNBeExqRTJOaXd5TGpnNU9DQXhMak15Tnl3eUxqZzVPQ0JvSURJdU16WTVJR01nTUM0eE5qUXNNQ0F4TGpJME5Dd3RNaTQ1TURZZ01TNHlORFFzTFRJdU9UQTJJR3dnTVM0ek1qSXNMVEF1TlRNMUlHTWdNQ3d3SURJdU9URTJMREV1TWpReUlETXVNREk1TERFdU1UTXpJR3dnTVM0Mk56Z3NMVEV1TmpReElHTWdNQzR4TVRjc0xUQXVNVEUxSUMweExqSXlMQzB5TGpreE5pQXRNUzR5TWl3dE1pNDVNVFlnYkNBd0xqVTBOQ3d0TVM0eU9UTWdZeUF3TERBZ01pNDVOak1zTFRFdU1UUXpJREl1T1RZekxDMHhMakk1T1NCV0lEa3VNellnUXlBeU1TNDFPU3c1TGpFNU9TQXhPQzQyTWpJc09DNHhORFVnTVRndU5qSXlMRGd1TVRRMUlIb2diU0F0TkM0ek5qWXNNaTQwTWpNZ1l5QXdMREV1T0RZM0lDMHhMalUxTXl3ekxqTTROeUF0TXk0ME5qRXNNeTR6T0RjZ0xURXVPVEEyTERBZ0xUTXVORFl4TEMweExqVXlJQzB6TGpRMk1Td3RNeTR6T0RjZ01Dd3RNUzQ0TmpjZ01TNDFOVFVzTFRNdU16ZzFJRE11TkRZeExDMHpMak00TlNBeExqa3dPU3d3TGpBd01TQXpMalEyTVN3eExqVXhPQ0F6TGpRMk1Td3pMak00TlNCNklnMEtJQ0FnYVdROUluQmhkR2d6SWcwS0lDQWdjM1I1YkdVOUltWnBiR3c2STBaR1JrWkdSaUlnTHo0TkNqeG5EUW9nSUNCcFpEMGlaelVpUGcwS1BDOW5QZzBLUEdjTkNpQWdJR2xrUFNKbk55SStEUW84TDJjK0RRbzhadzBLSUNBZ2FXUTlJbWM1SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RXhJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFeklqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekUxSWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RTNJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFNUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekl4SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6SXpJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJMUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekkzSWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6STVJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpNeElqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaek16SWo0TkNqd3ZaejROQ2p3dmMzWm5QZzBLKSBuby1yZXBlYXQgNTAlfS5lbW90ZS1tZW51LmVkaXRpbmcgLmljb24tZ2Vhcnstd2Via2l0LWFuaW1hdGlvbjpzcGluIDRzIGxpbmVhciBpbmZpbml0ZTthbmltYXRpb246c3BpbiA0cyBsaW5lYXIgaW5maW5pdGV9LmVtb3RlLW1lbnUgLmljb24tcmVzaXplLWhhbmRsZXtiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UWWlEUW9nSUNCb1pXbG5hSFE5SWpFMklnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lERTJJREUySWcwS0lDQWdhV1E5SWtOaGNHRmZNU0lOQ2lBZ0lIaHRiRHB6Y0dGalpUMGljSEpsYzJWeWRtVWlQanh0WlhSaFpHRjBZUTBLSUNBZ2FXUTlJbTFsZEdGa1lYUmhORE0xTnlJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jelF6TlRVaUlDOCtEUW84Y0dGMGFBMEtJQ0FnWkQwaVRTQXhNeTQxTERnZ1F5QXhNeTR5TWpVc09DQXhNeXc0TGpJeU5DQXhNeXc0TGpVZ2RpQXpMamM1TXlCTUlETXVOekEzTERNZ1NDQTNMalVnUXlBM0xqYzNOaXd6SURnc01pNDNOellnT0N3eUxqVWdPQ3d5TGpJeU5DQTNMamMzTml3eUlEY3VOU3d5SUdnZ0xUVWdUQ0F5TGpNd09Td3lMakF6T1NBeUxqRTFMREl1TVRRMElESXVNVFEyTERJdU1UUTJJREl1TVRRekxESXVNVFV5SURJdU1ETTVMREl1TXpBNUlESXNNaTQxSUhZZ05TQkRJRElzTnk0M056WWdNaTR5TWpRc09DQXlMalVzT0NBeUxqYzNOaXc0SURNc055NDNOellnTXl3M0xqVWdWaUF6TGpjd055Qk1JREV5TGpJNU15d3hNeUJJSURndU5TQkRJRGd1TWpJMExERXpJRGdzTVRNdU1qSTFJRGdzTVRNdU5TQTRMREV6TGpjM05TQTRMakl5TkN3eE5DQTRMalVzTVRRZ2FDQTFJR3dnTUM0eE9URXNMVEF1TURNNUlHTWdNQzR4TWpFc0xUQXVNRFV4SURBdU1qSXNMVEF1TVRRNElEQXVNamNzTFRBdU1qY2dUQ0F4TkN3eE15NDFNRElnVmlBNExqVWdReUF4TkN3NExqSXlOQ0F4TXk0M056VXNPQ0F4TXk0MUxEZ2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb05ETTFNU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1abVptWTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6ND0pIG5vLXJlcGVhdCA1MCU7Y3Vyc29yOm53c2UtcmVzaXplIWltcG9ydGFudH0uZW1vdGUtbWVudSAuaWNvbi1waW57YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVFlpRFFvZ0lDQm9aV2xuYUhROUlqRTJJZzBLSUNBZ2FXUTlJbk4yWnpNd01EVWlQZzBLSUNBOGJXVjBZV1JoZEdFTkNpQWdJQ0FnYVdROUltMWxkR0ZrWVhSaE16QXlNeUkrRFFvZ0lDQWdQSEprWmpwU1JFWStEUW9nSUNBZ0lDQThZMk02VjI5eWF3MEtJQ0FnSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGcwS0lDQWdJQ0FnSUNBOFpHTTZabTl5YldGMFBtbHRZV2RsTDNOMlp5dDRiV3c4TDJSak9tWnZjbTFoZEQ0TkNpQWdJQ0FnSUNBZ1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lDQWdjbVJtT25KbGMyOTFjbU5sUFNKb2RIUndPaTh2Y0hWeWJDNXZjbWN2WkdNdlpHTnRhWFI1Y0dVdlUzUnBiR3hKYldGblpTSWdMejROQ2lBZ0lDQWdJQ0FnUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK0RRb2dJQ0FnSUNBOEwyTmpPbGR2Y21zK0RRb2dJQ0FnUEM5eVpHWTZVa1JHUGcwS0lDQThMMjFsZEdGa1lYUmhQZzBLSUNBOFpHVm1jdzBLSUNBZ0lDQnBaRDBpWkdWbWN6TXdNakVpSUM4K0RRb2dJRHhuRFFvZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1Tnprek1EYzRNaXd3TERBc01DNDNPVE13TnpneUxDMHlMakUzTURrNE5Td3RPREUwTGpZNU1qazVLU0lOQ2lBZ0lDQWdhV1E5SW1jek1EQTNJajROQ2lBZ0lDQThadzBLSUNBZ0lDQWdJSFJ5WVc1elptOXliVDBpYldGMGNtbDRLREF1TnpBM01URXNNQzQzTURjeE1Td3RNQzQzTURjeE1Td3dMamN3TnpFeExEY3pOeTQzTURjMU5Td3lPVFV1TkRnNE1EZ3BJZzBLSUNBZ0lDQWdJR2xrUFNKbk16QXdPU0krRFFvZ0lDQWdJQ0E4WncwS0lDQWdJQ0FnSUNBZ2FXUTlJbWN6TnpVMUlqNE5DaUFnSUNBZ0lDQWdQSEJoZEdnTkNpQWdJQ0FnSUNBZ0lDQWdaRDBpVFNBNUxqYzRNVEkxTERBZ1F5QTVMalEzTkRBMU5qSXNNQzQyT0RreE1USWdPUzQxTWpBMk9Dd3hMalV5TXpBNE5UTWdPUzR6TVRJMUxESXVNVGczTlNCTUlEUXVPVE0zTlN3MkxqVTVNemMxSUVNZ015NDVOVGc1TmpBNExEWXVOREk1TkRneklESXVPVFEzTnpVME9DdzJMalV6TWpjNE9Ua2dNaXcyTGpneE1qVWdUQ0ExTGpBek1USTFMRGt1T0RRek56VWdNQzQxTmpJMUxERTBMak14TWpVZ01Dd3hOaUJESURBdU5UWTVNamsyTWpnc01UVXVOemsxTmpJMklERXVNVFkzTnpNM09Dd3hOUzQyTkRBeU16Y2dNUzQzTVRnM05Td3hOUzQwTURZeU5TQk1JRFl1TVRVMk1qVXNNVEF1T1RZNE56VWdPUzR4T0RjMUxERTBJR01nTUM0eU56azJPREl6TEMwd0xqazBOemM0TXlBd0xqTTRNekUxTWpnc0xURXVPVFU0T1RNM0lEQXVNakU0TnpVc0xUSXVPVE0zTlNBeExqVXdNREF4TVN3dE1TNDBPRGsxTnprNElETXVNREF3TURBeExDMHlMamszT1RFMU9TQTBMalVzTFRRdU5EWTROelVnTUM0Mk1ERXhNRElzTFRBdU1ETXhNell4SURFdU9ESXlNVE00TEMwd0xqQTVOakV6TnlBeUxDMHdMalEyT0RjMUlFTWdNVE11T0RjNU9Ea3lMRFF1TURZNU5EZ3dNeUF4TVM0NE5ESTROalVzTWk0d01qQXlNamd5SURrdU56Z3hNalVzTUNCNklnMEtJQ0FnSUNBZ0lDQWdJQ0IwY21GdWMyWnZjbTA5SW0xaGRISnBlQ2d3TGpnNU1UVTVNemMwTEMwd0xqZzVNVFU1TXpjMExEQXVPRGt4TlRrek56UXNNQzQ0T1RFMU9UTTNOQ3d0TWk0eU5qVTFMREV3TXpjdU1UTTBOU2tpRFFvZ0lDQWdJQ0FnSUNBZ0lHbGtQU0p3WVhSb016QXhNU0lOQ2lBZ0lDQWdJQ0FnSUNBZ2MzUjViR1U5SW1acGJHdzZJMlptWm1abVpqdG1hV3hzTFc5d1lXTnBkSGs2TVNJZ0x6NE5DaUFnSUNBZ0lEd3ZaejROQ2lBZ0lDQThMMmMrRFFvZ0lEd3ZaejROQ2p3dmMzWm5QZzBLKSBuby1yZXBlYXQgNTAlOy13ZWJraXQtdHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZX0uZW1vdGUtbWVudSAuaWNvbi1waW46aG92ZXIsLmVtb3RlLW1lbnUucGlubmVkIC5pY29uLXBpbnstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTstbXMtdHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3RyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTtvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLnNjcm9sbGFibGUuZGVmYXVsdC1za2lue3BhZGRpbmctcmlnaHQ6MDtwYWRkaW5nLWJvdHRvbTowfS5lbW90ZS1tZW51IC5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojNTU1O29wYWNpdHk6LjI7ei1pbmRleDoxfS5lbW90ZS1tZW51IC5lZGl0LXRvb2x7YmFja2dyb3VuZC1wb3NpdGlvbjo1MCU7YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2JhY2tncm91bmQtc2l6ZToxNHB4O2JvcmRlci1yYWRpdXM6NHB4O2JvcmRlcjoxcHggc29saWQgIzAwMDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5Om5vbmU7aGVpZ2h0OjE0cHg7b3BhY2l0eTouMjU7cG9zaXRpb246YWJzb2x1dGU7LXdlYmtpdC10cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7dHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3dpZHRoOjE0cHg7ei1pbmRleDoxfS5lbW90ZS1tZW51IC5lZGl0LXRvb2w6aG92ZXIsLmVtb3RlLW1lbnUgLmVtb3RlOmhvdmVyIC5lZGl0LXRvb2x7b3BhY2l0eToxfS5lbW90ZS1tZW51IC5lZGl0LXZpc2liaWxpdHl7YmFja2dyb3VuZC1jb2xvcjojMDBjODAwO2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTVRBd0lnMEtJQ0FnYUdWcFoyaDBQU0l4TURBaURRb2dJQ0IyYVdWM1FtOTRQU0l3SURBZ01UQXdJREV3TUNJTkNpQWdJR2xrUFNKTVlYbGxjbDh4SWcwS0lDQWdlRzFzT25Od1lXTmxQU0p3Y21WelpYSjJaU0krUEcxbGRHRmtZWFJoRFFvZ0lDQnBaRDBpYldWMFlXUmhkR0U1SWo0OGNtUm1PbEpFUmo0OFkyTTZWMjl5YXcwS0lDQWdJQ0FnSUhKa1pqcGhZbTkxZEQwaUlqNDhaR002Wm05eWJXRjBQbWx0WVdkbEwzTjJaeXQ0Yld3OEwyUmpPbVp2Y20xaGRENDhaR002ZEhsd1pRMEtJQ0FnSUNBZ0lDQWdjbVJtT25KbGMyOTFjbU5sUFNKb2RIUndPaTh2Y0hWeWJDNXZjbWN2WkdNdlpHTnRhWFI1Y0dVdlUzUnBiR3hKYldGblpTSWdMejQ4WkdNNmRHbDBiR1UrUEM5a1l6cDBhWFJzWlQ0OEwyTmpPbGR2Y21zK1BDOXlaR1k2VWtSR1Bqd3ZiV1YwWVdSaGRHRStQR1JsWm5NTkNpQWdJR2xrUFNKa1pXWnpOeUlnTHo0TkNqeHdZWFJvRFFvZ0lDQmtQU0pOSURrM0xqazJOQ3cwTmk0MU5EZ2dReUE1Tnk0d09UZ3NORFV1TlRJNElEYzJMalF5Tnl3eU1TNDJNRE1nTlRBc01qRXVOakF6SUdNZ0xUSTJMalF5Tnl3d0lDMDBOeTR3T1Rnc01qTXVPVEkxSUMwME55NDVOalVzTWpRdU9UUTJJQzB4TGpjd01Td3lJQzB4TGpjd01TdzBMamt3TWlBeE1HVXROQ3cyTGprd015QXdMamcyTml3eExqQXlJREl4TGpVek55d3lOQzQ1TkRVZ05EY3VPVFkwTERJMExqazBOU0F5Tmk0ME1qY3NNQ0EwTnk0d09UZ3NMVEl6TGpreU5pQTBOeTQ1TmpVc0xUSTBMamswTmlBeExqY3dNU3d0TWlBeExqY3dNU3d0TkM0NU1ESWdMVEF1TURBeExDMDJMamt3TXlCNklFMGdOVGd1TURjekxETTFMamszTlNCaklERXVOemMzTEMwd0xqazNJRFF1TWpVMUxEQXVNVFF6SURVdU5UTTBMREl1TkRnMUlERXVNamM1TERJdU16UXpJREF1T0RjMUxEVXVNREk1SUMwd0xqa3dNaXcxTGprNU9TQXRNUzQzTnpjc01DNDVOekVnTFRRdU1qVTFMQzB3TGpFME15QXROUzQxTXpVc0xUSXVORGcxSUMweExqSTNPU3d0TWk0ek5ETWdMVEF1T0RjMUxDMDFMakF5T1NBd0xqa3dNeXd0TlM0NU9Ua2dlaUJOSURVd0xEWTVMamN5T1NCRElETXhMalUwTERZNUxqY3lPU0F4Tmk0d01EVXNOVFV1TlRVeklERXdMall5T0N3MU1DQXhOQzR5TlRrc05EWXVNalE1SURJeUxqVXlOaXd6T0M0MU56RWdNek11TVRrMUxETXpMamszT1NBek1TNHhNVFFzTXpjdU1UUTFJREk1TGpnNU5DdzBNQzQ1TWpnZ01qa3VPRGswTERRMUlHTWdNQ3d4TVM0eE1EUWdPUzR3TURFc01qQXVNVEExSURJd0xqRXdOU3d5TUM0eE1EVWdNVEV1TVRBMExEQWdNakF1TVRBMkxDMDVMakF3TVNBeU1DNHhNRFlzTFRJd0xqRXdOU0F3TEMwMExqQTNNaUF0TVM0eU1Ua3NMVGN1T0RVMUlDMHpMak1zTFRFeExqQXlNU0JESURjM0xqUTNOQ3d6T0M0MU56SWdPRFV1TnpReExEUTJMakkxSURnNUxqTTNNaXcxTUNBNE15NDVPVFVzTlRVdU5UVTFJRFk0TGpRMkxEWTVMamN5T1NBMU1DdzJPUzQzTWprZ2VpSU5DaUFnSUdsa1BTSndZWFJvTXlJZ0x6NE5Dand2YzNablBnPT0pfS5lbW90ZS1tZW51IC5lZGl0LXN0YXJyZWR7YmFja2dyb3VuZC1jb2xvcjojMzIzMjMyO2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTlRBaURRb2dJQ0JvWldsbmFIUTlJalV3SWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURVd0lEVXdJZzBLSUNBZ2FXUTlJa3hoZVdWeVh6RWlEUW9nSUNCNGJXdzZjM0JoWTJVOUluQnlaWE5sY25abElqNDhiV1YwWVdSaGRHRU5DaUFnSUdsa1BTSnRaWFJoWkdGMFlUTXdNREVpUGp4eVpHWTZVa1JHUGp4all6cFhiM0pyRFFvZ0lDQWdJQ0FnY21SbU9tRmliM1YwUFNJaVBqeGtZenBtYjNKdFlYUSthVzFoWjJVdmMzWm5LM2h0YkR3dlpHTTZabTl5YldGMFBqeGtZenAwZVhCbERRb2dJQ0FnSUNBZ0lDQnlaR1k2Y21WemIzVnlZMlU5SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5a1kyMXBkSGx3WlM5VGRHbHNiRWx0WVdkbElpQXZQanhrWXpwMGFYUnNaVDQ4TDJSak9uUnBkR3hsUGp3dlkyTTZWMjl5YXo0OEwzSmtaanBTUkVZK1BDOXRaWFJoWkdGMFlUNDhaR1ZtY3cwS0lDQWdhV1E5SW1SbFpuTXlPVGs1SWlBdlBnMEtQSEJoZEdnTkNpQWdJR1E5SW0wZ05ETXVNRFFzTWpJdU5qazJJQzAzTGpVMk9DdzNMak0zTnlBeExqYzROeXd4TUM0ME1UY2dZeUF3TGpFeU55d3dMamMxSUMwd0xqRTRNaXd4TGpVd09TQXRNQzQzT1Rjc01TNDVOVGNnTFRBdU16UTRMREF1TWpVeklDMHdMamMyTWl3d0xqTTRNaUF0TVM0eE56WXNNQzR6T0RJZ0xUQXVNekU0TERBZ0xUQXVOak00TEMwd0xqQTNOaUF0TUM0NU16RXNMVEF1TWpNZ1RDQXlOU3d6Tnk0Mk9ERWdNVFV1TmpRMUxEUXlMalU1T1NCaklDMHdMalkzTkN3d0xqTTFOU0F0TVM0ME9Td3dMakk1TlNBdE1pNHhNRGNzTFRBdU1UVXhJRU1nTVRJdU9USXpMRFF5SURFeUxqWXhOQ3cwTVM0eU5ESWdNVEl1TnpRekxEUXdMalE1TVNCTUlERTBMalV6TERNd0xqQTNOQ0EyTGprMk1pd3lNaTQyT1RjZ1F5QTJMalF4TlN3eU1pNHhOallnTmk0eU1qRXNNakV1TXpjeElEWXVORFUwTERJd0xqWTBOeUEyTGpZNUxERTVMamt5TXlBM0xqTXhOU3d4T1M0ek9UWWdPQzR3Tmprc01Ua3VNamcySUd3Z01UQXVORFU1TEMweExqVXlNU0EwTGpZNExDMDVMalEzT0NCRElESXpMalUwTXl3M0xqWXdNeUF5TkM0eU16a3NOeTR4TnpFZ01qVXNOeTR4TnpFZ1l5QXdMamMyTXl3d0lERXVORFUyTERBdU5ETXlJREV1TnprekxERXVNVEUxSUd3Z05DNDJOemtzT1M0ME56Z2dNVEF1TkRZeExERXVOVEl4SUdNZ01DNDNOVElzTUM0eE1Ea2dNUzR6Tnprc01DNDJNemNnTVM0Mk1USXNNUzR6TmpFZ01DNHlNemNzTUM0M01qUWdNQzR3TXpnc01TNDFNVGtnTFRBdU5UQTFMREl1TURVZ2VpSU5DaUFnSUdsa1BTSndZWFJvTWprNU5TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTmpZMk5qWTJNN1ptbHNiQzF2Y0dGamFYUjVPakVpSUM4K0RRbzhMM04yWno0TkNnPT0pfS5lbW90ZS1tZW51IC5lbW90ZT4uZWRpdC12aXNpYmlsaXR5e2JvdHRvbTphdXRvO2xlZnQ6YXV0bztyaWdodDowO3RvcDowfS5lbW90ZS1tZW51IC5lbW90ZT4uZWRpdC1zdGFycmVke2JvdHRvbTphdXRvO2xlZnQ6MDtyaWdodDphdXRvO3RvcDowfS5lbW90ZS1tZW51IC5oZWFkZXItaW5mbz4uZWRpdC10b29se21hcmdpbi1sZWZ0OjVweH0uZW1vdGUtbWVudS5lZGl0aW5nIC5lZGl0LXRvb2x7ZGlzcGxheTppbmxpbmUtYmxvY2t9LmVtb3RlLW1lbnUgLmVtb3RlLW1lbnUtaGlkZGVuIC5lZGl0LXZpc2liaWxpdHl7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVEF3SWcwS0lDQWdhR1ZwWjJoMFBTSXhNREFpRFFvZ0lDQjJhV1YzUW05NFBTSXdJREFnTVRBd0lERXdNQ0lOQ2lBZ0lHbGtQU0pNWVhsbGNsOHpJZzBLSUNBZ2VHMXNPbk53WVdObFBTSndjbVZ6WlhKMlpTSStQRzFsZEdGa1lYUmhEUW9nSUNCcFpEMGliV1YwWVdSaGRHRXhOU0krUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6RXpJaUF2UGcwS1BHY05DaUFnSUdsa1BTSm5NeUkrRFFvSlBIQmhkR2dOQ2lBZ0lHUTlJazBnTnpBdU1EZ3lMRFExTGpRM05TQTFNQzQwTnpRc05qVXVNRGd5SUVNZ05qRXVNVGs0TERZMExqZ3pNU0EyT1M0NE16RXNOVFl1TVRrM0lEY3dMakE0TWl3ME5TNDBOelVnZWlJTkNpQWdJR2xrUFNKd1lYUm9OU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5HUmtaR1JrWWlJQzgrRFFvSlBIQmhkR2dOQ2lBZ0lHUTlJbTBnT1RjdU9UWTBMRFEyTGpVME9DQmpJQzB3TGpRMUxDMHdMalV5T1NBdE5pNHlORFVzTFRjdU1qTWdMVEUxTGpRd015d3RNVE11TlRVMElHd2dMVFl1TWl3MkxqSWdReUE0TWk0ek5URXNORE11TVRRNElEZzJMamt5TERRM0xqUTJPU0E0T1M0ek56SXNOVEFnT0RNdU9UazFMRFUxTGpVMU5TQTJPQzQwTml3Mk9TNDNNamtnTlRBc05qa3VOekk1SUdNZ0xURXVNek0wTERBZ0xUSXVOalV4TEMwd0xqQTRNaUF0TXk0NU5USXNMVEF1TWpJeUlHd2dMVGN1TkRNNUxEY3VORE01SUdNZ015NDJNemtzTUM0NU1Ea2dOeTQwTkRrc01TNDBOU0F4TVM0ek9URXNNUzQwTlNBeU5pNDBNamNzTUNBME55NHdPVGdzTFRJekxqa3lOaUEwTnk0NU5qVXNMVEkwTGprME5pQXhMamN3TVN3dE1TNDVPVGtnTVM0M01ERXNMVFF1T1RBeElDMHdMakF3TVN3dE5pNDVNRElnZWlJTkNpQWdJR2xrUFNKd1lYUm9OeUlOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5HUmtaR1JrWWlJQzgrRFFvSlBIQmhkR2dOQ2lBZ0lHUTlJbTBnT1RFdU5ERXhMREUyTGpZMklHTWdNQ3d0TUM0eU5qWWdMVEF1TVRBMUxDMHdMalV5SUMwd0xqSTVNeXd0TUM0M01EY2diQ0F0Tnk0d056RXNMVGN1TURjZ1l5QXRNQzR6T1RFc0xUQXVNemt4SUMweExqQXlNeXd0TUM0ek9URWdMVEV1TkRFMExEQWdUQ0EyTmk0NE1EUXNNalF1TnpFeElFTWdOakV1TmpBeUxESXlMamd4T0NBMU5TNDVORGtzTWpFdU5qQXpJRFV3TERJeExqWXdNeUJqSUMweU5pNDBNamNzTUNBdE5EY3VNRGs0TERJekxqa3lOaUF0TkRjdU9UWTFMREkwTGprME5pQXRNUzQzTURFc01pQXRNUzQzTURFc05DNDVNRElnTVRCbExUUXNOaTQ1TURNZ01DNDFNVGNzTUM0Mk1EY2dPQzR3T0RNc09TNHpOVFFnTVRrdU56QTNMREUyTGpNeUlFd2dPQzQ0T0RNc09ESXVOak15SUVNZ09DNDJPVFVzT0RJdU9ESWdPQzQxT1N3NE15NHdOek1nT0M0MU9TdzRNeTR6TXprZ1l5QXdMREF1TWpZMklEQXVNVEExTERBdU5USWdNQzR5T1RNc01DNDNNRGNnYkNBM0xqQTNNU3czTGpBM0lHTWdNQzR4T1RVc01DNHhPVFVnTUM0ME5URXNNQzR5T1RNZ01DNDNNRGNzTUM0eU9UTWdNQzR5TlRZc01DQXdMalV4TWl3dE1DNHdPVGdnTUM0M01EY3NMVEF1TWpreklHd2dOek11TnpVc0xUY3pMamMxSUdNZ01DNHhPRGNzTFRBdU1UZzJJREF1TWprekxDMHdMalEwSURBdU1qa3pMQzB3TGpjd05pQjZJRTBnTVRBdU5qSTRMRFV3SUVNZ01UUXVNalU1TERRMkxqSTBPU0F5TWk0MU1qWXNNemd1TlRjeElETXpMakU1TlN3ek15NDVOemtnTXpFdU1URTBMRE0zTGpFME5TQXlPUzQ0T1RRc05EQXVPVEk0SURJNUxqZzVOQ3cwTlNCaklEQXNOQzQyTmpVZ01TNDJNREVzT0M0NU5EVWdOQzR5Tnl3eE1pNHpOVEVnVENBeU9DNHdOQ3cyTXk0ME56VWdReUF4T1M0NE9EZ3NOVGd1T1RVMUlERXpMalkwT1N3MU15NHhNaUF4TUM0Mk1qZ3NOVEFnZWlJTkNpQWdJR2xrUFNKd1lYUm9PU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5HUmtaR1JrWWlJQzgrRFFvOEwyYytEUW84TDNOMlp6NE5DZz09KTtiYWNrZ3JvdW5kLWNvbG9yOnJlZH0uZW1vdGUtbWVudSAuZW1vdGUtbWVudS1zdGFycmVkIC5lZGl0LXN0YXJyZWR7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlOVEFpRFFvZ0lDQm9aV2xuYUhROUlqVXdJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJRFV3SURVd0lnMEtJQ0FnYVdROUlreGhlV1Z5WHpFaURRb2dJQ0I0Yld3NmMzQmhZMlU5SW5CeVpYTmxjblpsSWo0OGJXVjBZV1JoZEdFTkNpQWdJR2xrUFNKdFpYUmhaR0YwWVRNd01ERWlQanh5WkdZNlVrUkdQanhqWXpwWGIzSnJEUW9nSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGp4a1l6cG1iM0p0WVhRK2FXMWhaMlV2YzNabkszaHRiRHd2WkdNNlptOXliV0YwUGp4a1l6cDBlWEJsRFFvZ0lDQWdJQ0FnSUNCeVpHWTZjbVZ6YjNWeVkyVTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlrWTIxcGRIbHdaUzlUZEdsc2JFbHRZV2RsSWlBdlBqeGtZenAwYVhSc1pUNDhMMlJqT25ScGRHeGxQand2WTJNNlYyOXlhejQ4TDNKa1pqcFNSRVkrUEM5dFpYUmhaR0YwWVQ0OFpHVm1jdzBLSUNBZ2FXUTlJbVJsWm5NeU9UazVJaUF2UGcwS1BIQmhkR2dOQ2lBZ0lHUTlJbTBnTkRNdU1EUXNNakl1TmprMklDMDNMalUyT0N3M0xqTTNOeUF4TGpjNE55d3hNQzQwTVRjZ1l5QXdMakV5Tnl3d0xqYzFJQzB3TGpFNE1pd3hMalV3T1NBdE1DNDNPVGNzTVM0NU5UY2dMVEF1TXpRNExEQXVNalV6SUMwd0xqYzJNaXd3TGpNNE1pQXRNUzR4TnpZc01DNHpPRElnTFRBdU16RTRMREFnTFRBdU5qTTRMQzB3TGpBM05pQXRNQzQ1TXpFc0xUQXVNak1nVENBeU5Td3pOeTQyT0RFZ01UVXVOalExTERReUxqVTVPU0JqSUMwd0xqWTNOQ3d3TGpNMU5TQXRNUzQwT1N3d0xqSTVOU0F0TWk0eE1EY3NMVEF1TVRVeElFTWdNVEl1T1RJekxEUXlJREV5TGpZeE5DdzBNUzR5TkRJZ01USXVOelF6TERRd0xqUTVNU0JNSURFMExqVXpMRE13TGpBM05DQTJMamsyTWl3eU1pNDJPVGNnUXlBMkxqUXhOU3d5TWk0eE5qWWdOaTR5TWpFc01qRXVNemN4SURZdU5EVTBMREl3TGpZME55QTJMalk1TERFNUxqa3lNeUEzTGpNeE5Td3hPUzR6T1RZZ09DNHdOamtzTVRrdU1qZzJJR3dnTVRBdU5EVTVMQzB4TGpVeU1TQTBMalk0TEMwNUxqUTNPQ0JESURJekxqVTBNeXczTGpZd015QXlOQzR5TXprc055NHhOekVnTWpVc055NHhOekVnWXlBd0xqYzJNeXd3SURFdU5EVTJMREF1TkRNeUlERXVOemt6TERFdU1URTFJR3dnTkM0Mk56a3NPUzQwTnpnZ01UQXVORFl4TERFdU5USXhJR01nTUM0M05USXNNQzR4TURrZ01TNHpOemtzTUM0Mk16Y2dNUzQyTVRJc01TNHpOakVnTUM0eU16Y3NNQzQzTWpRZ01DNHdNemdzTVM0MU1Ua2dMVEF1TlRBMUxESXVNRFVnZWlJTkNpQWdJR2xrUFNKd1lYUm9Nams1TlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptTmpNREE3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejROQ2c9PSl9LmVtb3RlLW1lbnUgLmVtb3RlLmVtb3RlLW1lbnUtc3RhcnJlZHtib3JkZXItY29sb3I6cmdiYSgyMDAsMjAwLDAsLjUpfS5lbW90ZS1tZW51IC5lbW90ZS5lbW90ZS1tZW51LWhpZGRlbntib3JkZXItY29sb3I6cmdiYSgyNTUsMCwwLC41KX0uZW1vdGUtbWVudTpub3QoLmVkaXRpbmcpIC5lbW90ZS1tZW51LWhpZGRlbntkaXNwbGF5Om5vbmV9LmVtb3RlLW1lbnU6bm90KC5lZGl0aW5nKSAjc3RhcnJlZC1lbW90ZXMtZ3JvdXAgLmVtb3RlLW1lbnUtc3RhcnJlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnR9LmVtb3RlLW1lbnUgI3N0YXJyZWQtZW1vdGVzLWdyb3Vwe3RleHQtYWxpZ246Y2VudGVyO2NvbG9yOiM2NDY0NjR9LmVtb3RlLW1lbnUgI3N0YXJyZWQtZW1vdGVzLWdyb3VwOmVtcHR5OmJlZm9yZXtjb250ZW50OlxcXCJVc2UgdGhlIGVkaXQgbW9kZSB0byBzdGFyIGFuIGVtb3RlIVxcXCI7cG9zaXRpb246cmVsYXRpdmU7dG9wOjhweH1cIikpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIEhvZ2FuID0gcmVxdWlyZSgnaG9nYW4uanMvbGliL3RlbXBsYXRlLmpzJyk7XG4gICAgdmFyIHRlbXBsYXRlcyA9IHt9O1xuICAgIHRlbXBsYXRlc1snZW1vdGUnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZW1vdGVcIik7aWYodC5zKHQuZihcInRoaXJkUGFydHlcIixjLHAsMSksYyxwLDAsMzIsNDQsXCJ7eyB9fVwiKSl7dC5ycyhjLHAsZnVuY3Rpb24oYyxwLHQpe3QuYihcIiB0aGlyZC1wYXJ0eVwiKTt9KTtjLnBvcCgpO31pZighdC5zKHQuZihcImlzVmlzaWJsZVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe3QuYihcIiBlbW90ZS1tZW51LWhpZGRlblwiKTt9O2lmKHQucyh0LmYoXCJpc1N0YXJyZWRcIixjLHAsMSksYyxwLDAsMTE5LDEzOCxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIGVtb3RlLW1lbnUtc3RhcnJlZFwiKTt9KTtjLnBvcCgpO310LmIoXCJcXFwiIGRhdGEtZW1vdGU9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiIHRpdGxlPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7aWYodC5zKHQuZihcInRoaXJkUGFydHlcIixjLHAsMSksYyxwLDAsMjA2LDIyOSxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIChmcm9tIDNyZCBwYXJ0eSBhZGRvbilcIik7fSk7Yy5wb3AoKTt9dC5iKFwiXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxpbWcgc3JjPVxcXCJcIik7dC5iKHQudCh0LmYoXCJ1cmxcIixjLHAsMCkpKTt0LmIoXCJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZWRpdC10b29sIGVkaXQtc3RhcnJlZFxcXCIgZGF0YS13aGljaD1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtc3RhcnJlZFxcXCIgdGl0bGU9XFxcIlN0YXIvdW5zdGFyIGVtb3RlOiBcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImVkaXQtdG9vbCBlZGl0LXZpc2liaWxpdHlcXFwiIGRhdGEtd2hpY2g9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLXZpc2liaWxpdHlcXFwiIHRpdGxlPVxcXCJIaWRlL3Nob3cgZW1vdGU6IFwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ2Vtb3RlQnV0dG9uJ10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIjxidXR0b24gY2xhc3M9XFxcImJ1dHRvbiBnbHlwaC1vbmx5IGZsb2F0LWxlZnRcXFwiIHRpdGxlPVxcXCJFbW90ZSBNZW51XFxcIiBpZD1cXFwiZW1vdGUtbWVudS1idXR0b25cXFwiPjwvYnV0dG9uPlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ2Vtb3RlR3JvdXBIZWFkZXInXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyXCIpO2lmKCF0LnModC5mKFwiaXNWaXNpYmxlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7dC5iKFwiIGVtb3RlLW1lbnUtaGlkZGVuXCIpO307dC5iKFwiXFxcIiBkYXRhLWVtb3RlLWNoYW5uZWw9XFxcIlwiKTt0LmIodC52KHQuZihcImNoYW5uZWxcIixjLHAsMCkpKTt0LmIoXCJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiaGVhZGVyLWluZm9cXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8aW1nIHNyYz1cXFwiXCIpO3QuYih0LnYodC5mKFwiYmFkZ2VcIixjLHAsMCkpKTt0LmIoXCJcXFwiIC8+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFwiKTt0LmIodC52KHQuZihcImNoYW5uZWxEaXNwbGF5TmFtZVwiLGMscCwwKSkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8ZGl2IGNsYXNzPVxcXCJlZGl0LXRvb2wgZWRpdC12aXNpYmlsaXR5XFxcIiBkYXRhLXdoaWNoPVxcXCJjaGFubmVsLVwiKTt0LmIodC52KHQuZihcImNoYW5uZWxcIixjLHAsMCkpKTt0LmIoXCJcXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLXZpc2liaWxpdHlcXFwiIHRpdGxlPVxcXCJIaWRlL3Nob3cgYWxsIGVtb3RlcyBmb3IgXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIlxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWydtZW51J10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIjxkaXYgY2xhc3M9XFxcImVtb3RlLW1lbnVcXFwiIGlkPVxcXCJlbW90ZS1tZW51LWZvci10d2l0Y2hcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZHJhZ2dhYmxlXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImhlYWRlci1pbmZvXFxcIj5BbGwgRW1vdGVzPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1jb250YWluZXIgc2Nyb2xsYWJsZVxcXCIgaWQ9XFxcImFsbC1lbW90ZXMtZ3JvdXBcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiaGVhZGVyLWluZm9cXFwiPkZhdm9yaXRlIEVtb3RlczwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtY29udGFpbmVyIHNpbmdsZS1yb3dcXFwiIGlkPVxcXCJzdGFycmVkLWVtb3Rlcy1ncm91cFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJmb290ZXJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8YSBjbGFzcz1cXFwicHVsbC1sZWZ0IGljb24gaWNvbi1ob21lXFxcIiBocmVmPVxcXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgdGl0bGU9XFxcIlZpc2l0IHRoZSBob21lcGFnZSB3aGVyZSB5b3UgY2FuIGRvbmF0ZSwgcG9zdCBhIHJldmlldywgb3IgY29udGFjdCB0aGUgZGV2ZWxvcGVyXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLWxlZnQgaWNvbiBpY29uLWdlYXJcXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLWVkaXRpbmdcXFwiIHRpdGxlPVxcXCJUb2dnbGUgZWRpdCBtb2RlXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLXJpZ2h0IGljb24gaWNvbi1yZXNpemUtaGFuZGxlXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInJlc2l6ZS1oYW5kbGVcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGEgY2xhc3M9XFxcInB1bGwtcmlnaHQgaWNvbiBpY29uLXBpblxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtcGlubmVkXFxcIiB0aXRsZT1cXFwiUGluL3VucGluIHRoZSBlbW90ZSBtZW51IHRvIHRoZSBzY3JlZW5cXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ25ld3NNZXNzYWdlJ10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjxkaXYgY2xhc3M9XFxcInR3aXRjaC1jaGF0LWVtb3Rlcy1uZXdzXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFtcIik7dC5iKHQudih0LmYoXCJzY3JpcHROYW1lXCIsYyxwLDApKSk7dC5iKFwiXSBOZXdzOiBcIik7dC5iKHQudCh0LmYoXCJtZXNzYWdlXCIsYyxwLDApKSk7dC5iKFwiICg8YSBocmVmPVxcXCIjXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInR3aXRjaC1jaGF0LWVtb3RlczpkaXNtaXNzLW5ld3NcXFwiIGRhdGEtbmV3cy1pZD1cXFwiXCIpO3QuYih0LnYodC5mKFwiaWRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPkRpc21pc3M8L2E+KVxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICByZXR1cm4gdGVtcGxhdGVzO1xufSkoKTsiLCIvKlxuICogIENvcHlyaWdodCAyMDExIFR3aXR0ZXIsIEluYy5cbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBIb2dhbiA9IHt9O1xuXG4oZnVuY3Rpb24gKEhvZ2FuKSB7XG4gIEhvZ2FuLlRlbXBsYXRlID0gZnVuY3Rpb24gKGNvZGVPYmosIHRleHQsIGNvbXBpbGVyLCBvcHRpb25zKSB7XG4gICAgY29kZU9iaiA9IGNvZGVPYmogfHwge307XG4gICAgdGhpcy5yID0gY29kZU9iai5jb2RlIHx8IHRoaXMucjtcbiAgICB0aGlzLmMgPSBjb21waWxlcjtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMudGV4dCA9IHRleHQgfHwgJyc7XG4gICAgdGhpcy5wYXJ0aWFscyA9IGNvZGVPYmoucGFydGlhbHMgfHwge307XG4gICAgdGhpcy5zdWJzID0gY29kZU9iai5zdWJzIHx8IHt9O1xuICAgIHRoaXMuYnVmID0gJyc7XG4gIH1cblxuICBIb2dhbi5UZW1wbGF0ZS5wcm90b3R5cGUgPSB7XG4gICAgLy8gcmVuZGVyOiByZXBsYWNlZCBieSBnZW5lcmF0ZWQgY29kZS5cbiAgICByOiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkgeyByZXR1cm4gJyc7IH0sXG5cbiAgICAvLyB2YXJpYWJsZSBlc2NhcGluZ1xuICAgIHY6IGhvZ2FuRXNjYXBlLFxuXG4gICAgLy8gdHJpcGxlIHN0YWNoZVxuICAgIHQ6IGNvZXJjZVRvU3RyaW5nLFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgcmV0dXJuIHRoaXMucmkoW2NvbnRleHRdLCBwYXJ0aWFscyB8fCB7fSwgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gcmVuZGVyIGludGVybmFsIC0tIGEgaG9vayBmb3Igb3ZlcnJpZGVzIHRoYXQgY2F0Y2hlcyBwYXJ0aWFscyB0b29cbiAgICByaTogZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnIoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCk7XG4gICAgfSxcblxuICAgIC8vIGVuc3VyZVBhcnRpYWxcbiAgICBlcDogZnVuY3Rpb24oc3ltYm9sLCBwYXJ0aWFscykge1xuICAgICAgdmFyIHBhcnRpYWwgPSB0aGlzLnBhcnRpYWxzW3N5bWJvbF07XG5cbiAgICAgIC8vIGNoZWNrIHRvIHNlZSB0aGF0IGlmIHdlJ3ZlIGluc3RhbnRpYXRlZCB0aGlzIHBhcnRpYWwgYmVmb3JlXG4gICAgICB2YXIgdGVtcGxhdGUgPSBwYXJ0aWFsc1twYXJ0aWFsLm5hbWVdO1xuICAgICAgaWYgKHBhcnRpYWwuaW5zdGFuY2UgJiYgcGFydGlhbC5iYXNlID09IHRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiBwYXJ0aWFsLmluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRlbXBsYXRlID09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICghdGhpcy5jKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gY29tcGlsZXIgYXZhaWxhYmxlLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSA9IHRoaXMuYy5jb21waWxlKHRlbXBsYXRlLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSB1c2UgdGhpcyB0byBjaGVjayB3aGV0aGVyIHRoZSBwYXJ0aWFscyBkaWN0aW9uYXJ5IGhhcyBjaGFuZ2VkXG4gICAgICB0aGlzLnBhcnRpYWxzW3N5bWJvbF0uYmFzZSA9IHRlbXBsYXRlO1xuXG4gICAgICBpZiAocGFydGlhbC5zdWJzKSB7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBjb25zaWRlciBwYXJlbnQgdGVtcGxhdGUgbm93XG4gICAgICAgIGlmICghcGFydGlhbHMuc3RhY2tUZXh0KSBwYXJ0aWFscy5zdGFja1RleHQgPSB7fTtcbiAgICAgICAgZm9yIChrZXkgaW4gcGFydGlhbC5zdWJzKSB7XG4gICAgICAgICAgaWYgKCFwYXJ0aWFscy5zdGFja1RleHRba2V5XSkge1xuICAgICAgICAgICAgcGFydGlhbHMuc3RhY2tUZXh0W2tleV0gPSAodGhpcy5hY3RpdmVTdWIgIT09IHVuZGVmaW5lZCAmJiBwYXJ0aWFscy5zdGFja1RleHRbdGhpcy5hY3RpdmVTdWJdKSA/IHBhcnRpYWxzLnN0YWNrVGV4dFt0aGlzLmFjdGl2ZVN1Yl0gOiB0aGlzLnRleHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gY3JlYXRlU3BlY2lhbGl6ZWRQYXJ0aWFsKHRlbXBsYXRlLCBwYXJ0aWFsLnN1YnMsIHBhcnRpYWwucGFydGlhbHMsXG4gICAgICAgICAgdGhpcy5zdGFja1N1YnMsIHRoaXMuc3RhY2tQYXJ0aWFscywgcGFydGlhbHMuc3RhY2tUZXh0KTtcbiAgICAgIH1cbiAgICAgIHRoaXMucGFydGlhbHNbc3ltYm9sXS5pbnN0YW5jZSA9IHRlbXBsYXRlO1xuXG4gICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfSxcblxuICAgIC8vIHRyaWVzIHRvIGZpbmQgYSBwYXJ0aWFsIGluIHRoZSBjdXJyZW50IHNjb3BlIGFuZCByZW5kZXIgaXRcbiAgICBycDogZnVuY3Rpb24oc3ltYm9sLCBjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICB2YXIgcGFydGlhbCA9IHRoaXMuZXAoc3ltYm9sLCBwYXJ0aWFscyk7XG4gICAgICBpZiAoIXBhcnRpYWwpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGFydGlhbC5yaShjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gcmVuZGVyIGEgc2VjdGlvblxuICAgIHJzOiBmdW5jdGlvbihjb250ZXh0LCBwYXJ0aWFscywgc2VjdGlvbikge1xuICAgICAgdmFyIHRhaWwgPSBjb250ZXh0W2NvbnRleHQubGVuZ3RoIC0gMV07XG5cbiAgICAgIGlmICghaXNBcnJheSh0YWlsKSkge1xuICAgICAgICBzZWN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhaWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29udGV4dC5wdXNoKHRhaWxbaV0pO1xuICAgICAgICBzZWN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzKTtcbiAgICAgICAgY29udGV4dC5wb3AoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gbWF5YmUgc3RhcnQgYSBzZWN0aW9uXG4gICAgczogZnVuY3Rpb24odmFsLCBjdHgsIHBhcnRpYWxzLCBpbnZlcnRlZCwgc3RhcnQsIGVuZCwgdGFncykge1xuICAgICAgdmFyIHBhc3M7XG5cbiAgICAgIGlmIChpc0FycmF5KHZhbCkgJiYgdmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gdGhpcy5tcyh2YWwsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKTtcbiAgICAgIH1cblxuICAgICAgcGFzcyA9ICEhdmFsO1xuXG4gICAgICBpZiAoIWludmVydGVkICYmIHBhc3MgJiYgY3R4KSB7XG4gICAgICAgIGN0eC5wdXNoKCh0eXBlb2YgdmFsID09ICdvYmplY3QnKSA/IHZhbCA6IGN0eFtjdHgubGVuZ3RoIC0gMV0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGFzcztcbiAgICB9LFxuXG4gICAgLy8gZmluZCB2YWx1ZXMgd2l0aCBkb3R0ZWQgbmFtZXNcbiAgICBkOiBmdW5jdGlvbihrZXksIGN0eCwgcGFydGlhbHMsIHJldHVybkZvdW5kKSB7XG4gICAgICB2YXIgZm91bmQsXG4gICAgICAgICAgbmFtZXMgPSBrZXkuc3BsaXQoJy4nKSxcbiAgICAgICAgICB2YWwgPSB0aGlzLmYobmFtZXNbMF0sIGN0eCwgcGFydGlhbHMsIHJldHVybkZvdW5kKSxcbiAgICAgICAgICBkb01vZGVsR2V0ID0gdGhpcy5vcHRpb25zLm1vZGVsR2V0LFxuICAgICAgICAgIGN4ID0gbnVsbDtcblxuICAgICAgaWYgKGtleSA9PT0gJy4nICYmIGlzQXJyYXkoY3R4W2N0eC5sZW5ndGggLSAyXSkpIHtcbiAgICAgICAgdmFsID0gY3R4W2N0eC5sZW5ndGggLSAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmb3VuZCA9IGZpbmRJblNjb3BlKG5hbWVzW2ldLCB2YWwsIGRvTW9kZWxHZXQpO1xuICAgICAgICAgIGlmIChmb3VuZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjeCA9IHZhbDtcbiAgICAgICAgICAgIHZhbCA9IGZvdW5kO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWwgPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHJldHVybkZvdW5kICYmICF2YWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJldHVybkZvdW5kICYmIHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjdHgucHVzaChjeCk7XG4gICAgICAgIHZhbCA9IHRoaXMubXYodmFsLCBjdHgsIHBhcnRpYWxzKTtcbiAgICAgICAgY3R4LnBvcCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICAvLyBmaW5kIHZhbHVlcyB3aXRoIG5vcm1hbCBuYW1lc1xuICAgIGY6IGZ1bmN0aW9uKGtleSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpIHtcbiAgICAgIHZhciB2YWwgPSBmYWxzZSxcbiAgICAgICAgICB2ID0gbnVsbCxcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlLFxuICAgICAgICAgIGRvTW9kZWxHZXQgPSB0aGlzLm9wdGlvbnMubW9kZWxHZXQ7XG5cbiAgICAgIGZvciAodmFyIGkgPSBjdHgubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgdiA9IGN0eFtpXTtcbiAgICAgICAgdmFsID0gZmluZEluU2NvcGUoa2V5LCB2LCBkb01vZGVsR2V0KTtcbiAgICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgcmV0dXJuIChyZXR1cm5Gb3VuZCkgPyBmYWxzZSA6IFwiXCI7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmV0dXJuRm91bmQgJiYgdHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbCA9IHRoaXMubXYodmFsLCBjdHgsIHBhcnRpYWxzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgLy8gaGlnaGVyIG9yZGVyIHRlbXBsYXRlc1xuICAgIGxzOiBmdW5jdGlvbihmdW5jLCBjeCwgcGFydGlhbHMsIHRleHQsIHRhZ3MpIHtcbiAgICAgIHZhciBvbGRUYWdzID0gdGhpcy5vcHRpb25zLmRlbGltaXRlcnM7XG5cbiAgICAgIHRoaXMub3B0aW9ucy5kZWxpbWl0ZXJzID0gdGFncztcbiAgICAgIHRoaXMuYih0aGlzLmN0KGNvZXJjZVRvU3RyaW5nKGZ1bmMuY2FsbChjeCwgdGV4dCkpLCBjeCwgcGFydGlhbHMpKTtcbiAgICAgIHRoaXMub3B0aW9ucy5kZWxpbWl0ZXJzID0gb2xkVGFncztcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBjb21waWxlIHRleHRcbiAgICBjdDogZnVuY3Rpb24odGV4dCwgY3gsIHBhcnRpYWxzKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmRpc2FibGVMYW1iZGEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdMYW1iZGEgZmVhdHVyZXMgZGlzYWJsZWQuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5jLmNvbXBpbGUodGV4dCwgdGhpcy5vcHRpb25zKS5yZW5kZXIoY3gsIHBhcnRpYWxzKTtcbiAgICB9LFxuXG4gICAgLy8gdGVtcGxhdGUgcmVzdWx0IGJ1ZmZlcmluZ1xuICAgIGI6IGZ1bmN0aW9uKHMpIHsgdGhpcy5idWYgKz0gczsgfSxcblxuICAgIGZsOiBmdW5jdGlvbigpIHsgdmFyIHIgPSB0aGlzLmJ1ZjsgdGhpcy5idWYgPSAnJzsgcmV0dXJuIHI7IH0sXG5cbiAgICAvLyBtZXRob2QgcmVwbGFjZSBzZWN0aW9uXG4gICAgbXM6IGZ1bmN0aW9uKGZ1bmMsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKSB7XG4gICAgICB2YXIgdGV4dFNvdXJjZSxcbiAgICAgICAgICBjeCA9IGN0eFtjdHgubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5jYWxsKGN4KTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAoaW52ZXJ0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0ZXh0U291cmNlID0gKHRoaXMuYWN0aXZlU3ViICYmIHRoaXMuc3Vic1RleHQgJiYgdGhpcy5zdWJzVGV4dFt0aGlzLmFjdGl2ZVN1Yl0pID8gdGhpcy5zdWJzVGV4dFt0aGlzLmFjdGl2ZVN1Yl0gOiB0aGlzLnRleHQ7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubHMocmVzdWx0LCBjeCwgcGFydGlhbHMsIHRleHRTb3VyY2Uuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpLCB0YWdzKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvLyBtZXRob2QgcmVwbGFjZSB2YXJpYWJsZVxuICAgIG12OiBmdW5jdGlvbihmdW5jLCBjdHgsIHBhcnRpYWxzKSB7XG4gICAgICB2YXIgY3ggPSBjdHhbY3R4Lmxlbmd0aCAtIDFdO1xuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuY2FsbChjeCk7XG5cbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3QoY29lcmNlVG9TdHJpbmcocmVzdWx0LmNhbGwoY3gpKSwgY3gsIHBhcnRpYWxzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgc3ViOiBmdW5jdGlvbihuYW1lLCBjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICB2YXIgZiA9IHRoaXMuc3Vic1tuYW1lXTtcbiAgICAgIGlmIChmKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlU3ViID0gbmFtZTtcbiAgICAgICAgZihjb250ZXh0LCBwYXJ0aWFscywgdGhpcywgaW5kZW50KTtcbiAgICAgICAgdGhpcy5hY3RpdmVTdWIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfTtcblxuICAvL0ZpbmQgYSBrZXkgaW4gYW4gb2JqZWN0XG4gIGZ1bmN0aW9uIGZpbmRJblNjb3BlKGtleSwgc2NvcGUsIGRvTW9kZWxHZXQpIHtcbiAgICB2YXIgdmFsO1xuXG4gICAgaWYgKHNjb3BlICYmIHR5cGVvZiBzY29wZSA9PSAnb2JqZWN0Jykge1xuXG4gICAgICBpZiAoc2NvcGVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhbCA9IHNjb3BlW2tleV07XG5cbiAgICAgIC8vIHRyeSBsb29rdXAgd2l0aCBnZXQgZm9yIGJhY2tib25lIG9yIHNpbWlsYXIgbW9kZWwgZGF0YVxuICAgICAgfSBlbHNlIGlmIChkb01vZGVsR2V0ICYmIHNjb3BlLmdldCAmJiB0eXBlb2Ygc2NvcGUuZ2V0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gc2NvcGUuZ2V0KGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNwZWNpYWxpemVkUGFydGlhbChpbnN0YW5jZSwgc3VicywgcGFydGlhbHMsIHN0YWNrU3Vicywgc3RhY2tQYXJ0aWFscywgc3RhY2tUZXh0KSB7XG4gICAgZnVuY3Rpb24gUGFydGlhbFRlbXBsYXRlKCkge307XG4gICAgUGFydGlhbFRlbXBsYXRlLnByb3RvdHlwZSA9IGluc3RhbmNlO1xuICAgIGZ1bmN0aW9uIFN1YnN0aXR1dGlvbnMoKSB7fTtcbiAgICBTdWJzdGl0dXRpb25zLnByb3RvdHlwZSA9IGluc3RhbmNlLnN1YnM7XG4gICAgdmFyIGtleTtcbiAgICB2YXIgcGFydGlhbCA9IG5ldyBQYXJ0aWFsVGVtcGxhdGUoKTtcbiAgICBwYXJ0aWFsLnN1YnMgPSBuZXcgU3Vic3RpdHV0aW9ucygpO1xuICAgIHBhcnRpYWwuc3Vic1RleHQgPSB7fTsgIC8vaGVoZS4gc3Vic3RleHQuXG4gICAgcGFydGlhbC5idWYgPSAnJztcblxuICAgIHN0YWNrU3VicyA9IHN0YWNrU3VicyB8fCB7fTtcbiAgICBwYXJ0aWFsLnN0YWNrU3VicyA9IHN0YWNrU3VicztcbiAgICBwYXJ0aWFsLnN1YnNUZXh0ID0gc3RhY2tUZXh0O1xuICAgIGZvciAoa2V5IGluIHN1YnMpIHtcbiAgICAgIGlmICghc3RhY2tTdWJzW2tleV0pIHN0YWNrU3Vic1trZXldID0gc3Vic1trZXldO1xuICAgIH1cbiAgICBmb3IgKGtleSBpbiBzdGFja1N1YnMpIHtcbiAgICAgIHBhcnRpYWwuc3Vic1trZXldID0gc3RhY2tTdWJzW2tleV07XG4gICAgfVxuXG4gICAgc3RhY2tQYXJ0aWFscyA9IHN0YWNrUGFydGlhbHMgfHwge307XG4gICAgcGFydGlhbC5zdGFja1BhcnRpYWxzID0gc3RhY2tQYXJ0aWFscztcbiAgICBmb3IgKGtleSBpbiBwYXJ0aWFscykge1xuICAgICAgaWYgKCFzdGFja1BhcnRpYWxzW2tleV0pIHN0YWNrUGFydGlhbHNba2V5XSA9IHBhcnRpYWxzW2tleV07XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHN0YWNrUGFydGlhbHMpIHtcbiAgICAgIHBhcnRpYWwucGFydGlhbHNba2V5XSA9IHN0YWNrUGFydGlhbHNba2V5XTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFydGlhbDtcbiAgfVxuXG4gIHZhciByQW1wID0gLyYvZyxcbiAgICAgIHJMdCA9IC88L2csXG4gICAgICByR3QgPSAvPi9nLFxuICAgICAgckFwb3MgPSAvXFwnL2csXG4gICAgICByUXVvdCA9IC9cXFwiL2csXG4gICAgICBoQ2hhcnMgPSAvWyY8PlxcXCJcXCddLztcblxuICBmdW5jdGlvbiBjb2VyY2VUb1N0cmluZyh2YWwpIHtcbiAgICByZXR1cm4gU3RyaW5nKCh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpID8gJycgOiB2YWwpO1xuICB9XG5cbiAgZnVuY3Rpb24gaG9nYW5Fc2NhcGUoc3RyKSB7XG4gICAgc3RyID0gY29lcmNlVG9TdHJpbmcoc3RyKTtcbiAgICByZXR1cm4gaENoYXJzLnRlc3Qoc3RyKSA/XG4gICAgICBzdHJcbiAgICAgICAgLnJlcGxhY2UockFtcCwgJyZhbXA7JylcbiAgICAgICAgLnJlcGxhY2Uockx0LCAnJmx0OycpXG4gICAgICAgIC5yZXBsYWNlKHJHdCwgJyZndDsnKVxuICAgICAgICAucmVwbGFjZShyQXBvcywgJyYjMzk7JylcbiAgICAgICAgLnJlcGxhY2UoclF1b3QsICcmcXVvdDsnKSA6XG4gICAgICBzdHI7XG4gIH1cblxuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24oYSkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbn0pKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiBIb2dhbik7XG4iLCIoZnVuY3Rpb24gKCQpIHtcblxuICAkLmZuLmN1c3RvbVNjcm9sbGJhciA9IGZ1bmN0aW9uIChvcHRpb25zLCBhcmdzKSB7XG5cbiAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICBza2luOiB1bmRlZmluZWQsXG4gICAgICBoU2Nyb2xsOiB0cnVlLFxuICAgICAgdlNjcm9sbDogdHJ1ZSxcbiAgICAgIHVwZGF0ZU9uV2luZG93UmVzaXplOiBmYWxzZSxcbiAgICAgIGFuaW1hdGlvblNwZWVkOiAzMDAsXG4gICAgICBvbkN1c3RvbVNjcm9sbDogdW5kZWZpbmVkLFxuICAgICAgc3dpcGVTcGVlZDogMSxcbiAgICAgIHdoZWVsU3BlZWQ6IDQwLFxuICAgICAgZml4ZWRUaHVtYldpZHRoOiB1bmRlZmluZWQsXG4gICAgICBmaXhlZFRodW1iSGVpZ2h0OiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICB2YXIgU2Nyb2xsYWJsZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICB0aGlzLmFkZFNjcm9sbGFibGVDbGFzcygpO1xuICAgICAgdGhpcy5hZGRTa2luQ2xhc3MoKTtcbiAgICAgIHRoaXMuYWRkU2Nyb2xsQmFyQ29tcG9uZW50cygpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy52U2Nyb2xsKVxuICAgICAgICB0aGlzLnZTY3JvbGxiYXIgPSBuZXcgU2Nyb2xsYmFyKHRoaXMsIG5ldyBWU2l6aW5nKCkpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5oU2Nyb2xsKVxuICAgICAgICB0aGlzLmhTY3JvbGxiYXIgPSBuZXcgU2Nyb2xsYmFyKHRoaXMsIG5ldyBIU2l6aW5nKCkpO1xuICAgICAgdGhpcy4kZWxlbWVudC5kYXRhKFwic2Nyb2xsYWJsZVwiLCB0aGlzKTtcbiAgICAgIHRoaXMuaW5pdEtleWJvYXJkU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9XG5cbiAgICBTY3JvbGxhYmxlLnByb3RvdHlwZSA9IHtcblxuICAgICAgYWRkU2Nyb2xsYWJsZUNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy4kZWxlbWVudC5oYXNDbGFzcyhcInNjcm9sbGFibGVcIikpIHtcbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGVBZGRlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyhcInNjcm9sbGFibGVcIik7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNjcm9sbGFibGVDbGFzczogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxhYmxlQWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhcInNjcm9sbGFibGVcIik7XG4gICAgICB9LFxuXG4gICAgICBhZGRTa2luQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZih0aGlzLm9wdGlvbnMuc2tpbikgPT0gXCJzdHJpbmdcIiAmJiAhdGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLm9wdGlvbnMuc2tpbikpIHtcbiAgICAgICAgICB0aGlzLnNraW5DbGFzc0FkZGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5za2luKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlU2tpbkNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNraW5DbGFzc0FkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLnNraW4pO1xuICAgICAgfSxcblxuICAgICAgYWRkU2Nyb2xsQmFyQ29tcG9uZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmFzc2lnblZpZXdQb3J0KCk7XG4gICAgICAgIGlmICh0aGlzLiR2aWV3UG9ydC5sZW5ndGggPT0gMCkge1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQud3JhcElubmVyKFwiPGRpdiBjbGFzcz1cXFwidmlld3BvcnRcXFwiIC8+XCIpO1xuICAgICAgICAgIHRoaXMuYXNzaWduVmlld1BvcnQoKTtcbiAgICAgICAgICB0aGlzLnZpZXdQb3J0QWRkZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXNzaWduT3ZlcnZpZXcoKTtcbiAgICAgICAgaWYgKHRoaXMuJG92ZXJ2aWV3Lmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy4kdmlld1BvcnQud3JhcElubmVyKFwiPGRpdiBjbGFzcz1cXFwib3ZlcnZpZXdcXFwiIC8+XCIpO1xuICAgICAgICAgIHRoaXMuYXNzaWduT3ZlcnZpZXcoKTtcbiAgICAgICAgICB0aGlzLm92ZXJ2aWV3QWRkZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsQmFyKFwidmVydGljYWxcIiwgXCJwcmVwZW5kXCIpO1xuICAgICAgICB0aGlzLmFkZFNjcm9sbEJhcihcImhvcml6b250YWxcIiwgXCJhcHBlbmRcIik7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTY3JvbGxiYXJDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsYmFyKFwidmVydGljYWxcIik7XG4gICAgICAgIHRoaXMucmVtb3ZlU2Nyb2xsYmFyKFwiaG9yaXpvbnRhbFwiKTtcbiAgICAgICAgaWYgKHRoaXMub3ZlcnZpZXdBZGRlZClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnVud3JhcCgpO1xuICAgICAgICBpZiAodGhpcy52aWV3UG9ydEFkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudW53cmFwKCk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTY3JvbGxiYXI6IGZ1bmN0aW9uIChvcmllbnRhdGlvbikge1xuICAgICAgICBpZiAodGhpc1tvcmllbnRhdGlvbiArIFwiU2Nyb2xsYmFyQWRkZWRcIl0pXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5maW5kKFwiLnNjcm9sbC1iYXIuXCIgKyBvcmllbnRhdGlvbikucmVtb3ZlKCk7XG4gICAgICB9LFxuXG4gICAgICBhc3NpZ25WaWV3UG9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiR2aWV3UG9ydCA9IHRoaXMuJGVsZW1lbnQuZmluZChcIi52aWV3cG9ydFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIGFzc2lnbk92ZXJ2aWV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJG92ZXJ2aWV3ID0gdGhpcy4kdmlld1BvcnQuZmluZChcIi5vdmVydmlld1wiKTtcbiAgICAgIH0sXG5cbiAgICAgIGFkZFNjcm9sbEJhcjogZnVuY3Rpb24gKG9yaWVudGF0aW9uLCBmdW4pIHtcbiAgICAgICAgaWYgKHRoaXMuJGVsZW1lbnQuZmluZChcIi5zY3JvbGwtYmFyLlwiICsgb3JpZW50YXRpb24pLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudFtmdW5dKFwiPGRpdiBjbGFzcz0nc2Nyb2xsLWJhciBcIiArIG9yaWVudGF0aW9uICsgXCInPjxkaXYgY2xhc3M9J3RodW1iJz48L2Rpdj48L2Rpdj5cIilcbiAgICAgICAgICB0aGlzW29yaWVudGF0aW9uICsgXCJTY3JvbGxiYXJBZGRlZFwiXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKGtlZXBQb3NpdGlvbikge1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5yZXNpemUoa2VlcFBvc2l0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIucmVzaXplKGtlZXBQb3NpdGlvbik7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUbzogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIuc2Nyb2xsVG9FbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICBpZiAodGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMuaFNjcm9sbGJhci5zY3JvbGxUb0VsZW1lbnQoZWxlbWVudCk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb1hZOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB0aGlzLnNjcm9sbFRvWCh4KTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb1koeSk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb1g6IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnNjcm9sbE92ZXJ2aWV3VG8oeCwgdHJ1ZSk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxUb1k6IGZ1bmN0aW9uICh5KSB7XG4gICAgICAgIGlmICh0aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy52U2Nyb2xsYmFyLnNjcm9sbE92ZXJ2aWV3VG8oeSwgdHJ1ZSk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxhYmxlQ2xhc3MoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTa2luQ2xhc3MoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxiYXJDb21wb25lbnRzKCk7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQuZGF0YShcInNjcm9sbGFibGVcIiwgbnVsbCk7XG4gICAgICAgIHRoaXMucmVtb3ZlS2V5Ym9hcmRTY3JvbGxpbmcoKTtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnJlbW92ZSgpO1xuICAgICAgfSxcblxuICAgICAgc2V0QW5pbWF0aW9uU3BlZWQ6IGZ1bmN0aW9uIChzcGVlZCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uU3BlZWQgPSBzcGVlZDtcbiAgICAgIH0sXG5cbiAgICAgIGlzSW5zaWRlOiBmdW5jdGlvbiAoZWxlbWVudCwgd3JhcHBpbmdFbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHZhciAkd3JhcHBpbmdFbGVtZW50ID0gJCh3cmFwcGluZ0VsZW1lbnQpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgd3JhcHBpbmdFbGVtZW50T2Zmc2V0ID0gJHdyYXBwaW5nRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50T2Zmc2V0LnRvcCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQudG9wKSAmJiAoZWxlbWVudE9mZnNldC5sZWZ0ID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC5sZWZ0KSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LnRvcCArICRlbGVtZW50LmhlaWdodCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3AgKyAkd3JhcHBpbmdFbGVtZW50LmhlaWdodCgpKSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LmxlZnQgKyAkZWxlbWVudC53aWR0aCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC5sZWZ0ICsgJHdyYXBwaW5nRWxlbWVudC53aWR0aCgpKVxuICAgICAgfSxcblxuICAgICAgaW5pdEtleWJvYXJkU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50S2V5ZG93biA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBfdGhpcy4kZWxlbWVudFswXSkge1xuICAgICAgICAgICAgaWYgKF90aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgICAgIF90aGlzLnZTY3JvbGxiYXIua2V5U2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgICAgIGlmIChfdGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgICAgICBfdGhpcy5oU2Nyb2xsYmFyLmtleVNjcm9sbChldmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAgIC5hdHRyKCd0YWJpbmRleCcsICctMScpXG4gICAgICAgICAgLmtleWRvd24odGhpcy5lbGVtZW50S2V5ZG93bik7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVLZXlib2FyZFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgICAgLnJlbW92ZUF0dHIoJ3RhYmluZGV4JylcbiAgICAgICAgICAudW5iaW5kKFwia2V5ZG93blwiLCB0aGlzLmVsZW1lbnRLZXlkb3duKTtcbiAgICAgIH0sXG5cbiAgICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5vbkN1c3RvbVNjcm9sbClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKFwiY3VzdG9tU2Nyb2xsXCIsIHRoaXMub3B0aW9ucy5vbkN1c3RvbVNjcm9sbCk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgU2Nyb2xsYmFyID0gZnVuY3Rpb24gKHNjcm9sbGFibGUsIHNpemluZykge1xuICAgICAgdGhpcy5zY3JvbGxhYmxlID0gc2Nyb2xsYWJsZTtcbiAgICAgIHRoaXMuc2l6aW5nID0gc2l6aW5nXG4gICAgICB0aGlzLiRzY3JvbGxCYXIgPSB0aGlzLnNpemluZy5zY3JvbGxCYXIodGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50KTtcbiAgICAgIHRoaXMuJHRodW1iID0gdGhpcy4kc2Nyb2xsQmFyLmZpbmQoXCIudGh1bWJcIik7XG4gICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKDAsIDApO1xuICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICAgIHRoaXMuaW5pdE1vdXNlTW92ZVNjcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0TW91c2VXaGVlbFNjcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0VG91Y2hTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuaW5pdE1vdXNlQ2xpY2tTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuaW5pdFdpbmRvd1Jlc2l6ZSgpO1xuICAgIH1cblxuICAgIFNjcm9sbGJhci5wcm90b3R5cGUgPSB7XG5cbiAgICAgIHJlc2l6ZTogZnVuY3Rpb24gKGtlZXBQb3NpdGlvbikge1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0LmhlaWdodCh0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgICB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQsIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50KSk7XG4gICAgICAgIHRoaXMudmlld1BvcnRTaXplID0gdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJHZpZXdQb3J0KTtcbiAgICAgICAgdGhpcy5vdmVydmlld1NpemUgPSB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcpO1xuICAgICAgICB0aGlzLnJhdGlvID0gdGhpcy52aWV3UG9ydFNpemUgLyB0aGlzLm92ZXJ2aWV3U2l6ZTtcbiAgICAgICAgdGhpcy5zaXppbmcuc2l6ZSh0aGlzLiRzY3JvbGxCYXIsIHRoaXMudmlld1BvcnRTaXplKTtcbiAgICAgICAgdGhpcy50aHVtYlNpemUgPSB0aGlzLmNhbGN1bGF0ZVRodW1iU2l6ZSgpO1xuICAgICAgICB0aGlzLnNpemluZy5zaXplKHRoaXMuJHRodW1iLCB0aGlzLnRodW1iU2l6ZSk7XG4gICAgICAgIHRoaXMubWF4VGh1bWJQb3NpdGlvbiA9IHRoaXMuY2FsY3VsYXRlTWF4VGh1bWJQb3NpdGlvbigpO1xuICAgICAgICB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLmNhbGN1bGF0ZU1heE92ZXJ2aWV3UG9zaXRpb24oKTtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gKHRoaXMub3ZlcnZpZXdTaXplID4gdGhpcy52aWV3UG9ydFNpemUpO1xuICAgICAgICBpZiAodGhpcy5zY3JvbGxQZXJjZW50ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgdGhpcy5zY3JvbGxQZXJjZW50ID0gMC4wO1xuICAgICAgICBpZiAodGhpcy5lbmFibGVkKVxuICAgICAgICAgIHRoaXMucmVzY3JvbGwoa2VlcFBvc2l0aW9uKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHRoaXMuJHNjcm9sbEJhci50b2dnbGUodGhpcy5lbmFibGVkKTtcbiAgICAgIH0sXG5cbiAgICAgIGNhbGN1bGF0ZVRodW1iU2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZml4ZWRTaXplID0gdGhpcy5zaXppbmcuZml4ZWRUaHVtYlNpemUodGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMpXG4gICAgICAgIHZhciBzaXplO1xuICAgICAgICBpZiAoZml4ZWRTaXplKVxuICAgICAgICAgIHNpemUgPSBmaXhlZFNpemU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzaXplID0gdGhpcy5yYXRpbyAqIHRoaXMudmlld1BvcnRTaXplXG4gICAgICAgIHJldHVybiBNYXRoLm1heChzaXplLCB0aGlzLnNpemluZy5taW5TaXplKHRoaXMuJHRodW1iKSk7XG4gICAgICB9LFxuXG4gICAgICBpbml0TW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuJHRodW1iLm1vdXNlZG93bihmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuZW5hYmxlZClcbiAgICAgICAgICAgIF90aGlzLnN0YXJ0TW91c2VNb3ZlU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZG9jdW1lbnRNb3VzZXVwID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgX3RoaXMuc3RvcE1vdXNlTW92ZVNjcm9sbGluZyhldmVudCk7XG4gICAgICAgIH07XG4gICAgICAgICQoZG9jdW1lbnQpLm1vdXNldXAodGhpcy5kb2N1bWVudE1vdXNldXApO1xuICAgICAgICB0aGlzLmRvY3VtZW50TW91c2Vtb3ZlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgX3RoaXMubW91c2VNb3ZlU2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgfTtcbiAgICAgICAgJChkb2N1bWVudCkubW91c2Vtb3ZlKHRoaXMuZG9jdW1lbnRNb3VzZW1vdmUpO1xuICAgICAgICB0aGlzLiR0aHVtYi5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kdGh1bWIudW5iaW5kKCk7XG4gICAgICAgICQoZG9jdW1lbnQpLnVuYmluZChcIm1vdXNldXBcIiwgdGhpcy5kb2N1bWVudE1vdXNldXApO1xuICAgICAgICAkKGRvY3VtZW50KS51bmJpbmQoXCJtb3VzZW1vdmVcIiwgdGhpcy5kb2N1bWVudE1vdXNlbW92ZSk7XG4gICAgICB9LFxuXG4gICAgICBpbml0TW91c2VXaGVlbFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQubW91c2V3aGVlbChmdW5jdGlvbiAoZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICAgIGlmIChfdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMubW91c2VXaGVlbFNjcm9sbChkZWx0YVgsIGRlbHRhWSkpIHtcbiAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZU1vdXNlV2hlZWxTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50LnVuYmluZChcIm1vdXNld2hlZWxcIik7XG4gICAgICB9LFxuXG4gICAgICBpbml0VG91Y2hTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgIHRoaXMuZWxlbWVudFRvdWNoc3RhcnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5lbmFibGVkKVxuICAgICAgICAgICAgICBfdGhpcy5zdGFydFRvdWNoU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIHRoaXMuZWxlbWVudFRvdWNoc3RhcnQpO1xuICAgICAgICAgIHRoaXMuZG9jdW1lbnRUb3VjaG1vdmUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIF90aGlzLnRvdWNoU2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLmRvY3VtZW50VG91Y2htb3ZlKTtcbiAgICAgICAgICB0aGlzLmVsZW1lbnRUb3VjaGVuZCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgX3RoaXMuc3RvcFRvdWNoU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLmVsZW1lbnRUb3VjaGVuZCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIHRoaXMuZWxlbWVudFRvdWNoc3RhcnQpO1xuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5kb2N1bWVudFRvdWNobW92ZSk7XG4gICAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50WzBdLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCB0aGlzLmVsZW1lbnRUb3VjaGVuZCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGluaXRNb3VzZUNsaWNrU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2Nyb2xsQmFyQ2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBfdGhpcy5tb3VzZUNsaWNrU2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy4kc2Nyb2xsQmFyLmNsaWNrKHRoaXMuc2Nyb2xsQmFyQ2xpY2spO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlTW91c2VDbGlja1Njcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRzY3JvbGxCYXIudW5iaW5kKFwiY2xpY2tcIiwgdGhpcy5zY3JvbGxCYXJDbGljayk7XG4gICAgICB9LFxuXG4gICAgICBpbml0V2luZG93UmVzaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbGFibGUub3B0aW9ucy51cGRhdGVPbldpbmRvd1Jlc2l6ZSkge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgdGhpcy53aW5kb3dSZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5yZXNpemUoKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgICQod2luZG93KS5yZXNpemUodGhpcy53aW5kb3dSZXNpemUpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVXaW5kb3dSZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh3aW5kb3cpLnVuYmluZChcInJlc2l6ZVwiLCB0aGlzLndpbmRvd1Jlc2l6ZSk7XG4gICAgICB9LFxuXG4gICAgICBpc0tleVNjcm9sbGluZzogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5rZXlTY3JvbGxEZWx0YShrZXkpICE9IG51bGw7XG4gICAgICB9LFxuXG4gICAgICBrZXlTY3JvbGxEZWx0YTogZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBmb3IgKHZhciBzY3JvbGxpbmdLZXkgaW4gdGhpcy5zaXppbmcuc2Nyb2xsaW5nS2V5cylcbiAgICAgICAgICBpZiAoc2Nyb2xsaW5nS2V5ID09IGtleSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNpemluZy5zY3JvbGxpbmdLZXlzW2tleV0odGhpcy52aWV3UG9ydFNpemUpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sXG5cbiAgICAgIHN0YXJ0TW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZU1vdmVTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICAkKFwiaHRtbFwiKS5hZGRDbGFzcyhcIm5vdC1zZWxlY3RhYmxlXCIpO1xuICAgICAgICB0aGlzLnNldFVuc2VsZWN0YWJsZSgkKFwiaHRtbFwiKSwgXCJvblwiKTtcbiAgICAgICAgdGhpcy5zZXRTY3JvbGxFdmVudChldmVudCk7XG4gICAgICB9LFxuXG4gICAgICBzdG9wTW91c2VNb3ZlU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5tb3VzZU1vdmVTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgJChcImh0bWxcIikucmVtb3ZlQ2xhc3MoXCJub3Qtc2VsZWN0YWJsZVwiKTtcbiAgICAgICAgdGhpcy5zZXRVbnNlbGVjdGFibGUoJChcImh0bWxcIiksIG51bGwpO1xuICAgICAgfSxcblxuICAgICAgc2V0VW5zZWxlY3RhYmxlOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuYXR0cihcInVuc2VsZWN0YWJsZVwiKSAhPSB2YWx1ZSkge1xuICAgICAgICAgIGVsZW1lbnQuYXR0cihcInVuc2VsZWN0YWJsZVwiLCB2YWx1ZSk7XG4gICAgICAgICAgZWxlbWVudC5maW5kKCc6bm90KGlucHV0KScpLmF0dHIoJ3Vuc2VsZWN0YWJsZScsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgbW91c2VNb3ZlU2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMubW91c2VNb3ZlU2Nyb2xsaW5nKSB7XG4gICAgICAgICAgdmFyIGRlbHRhID0gdGhpcy5zaXppbmcubW91c2VEZWx0YSh0aGlzLnNjcm9sbEV2ZW50LCBldmVudCk7XG4gICAgICAgICAgdGhpcy5zY3JvbGxUaHVtYkJ5KGRlbHRhKTtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc3RhcnRUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC50b3VjaGVzICYmIGV2ZW50LnRvdWNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50LnRvdWNoZXNbMF0pO1xuICAgICAgICAgIHRoaXMudG91Y2hTY3JvbGxpbmcgPSB0cnVlO1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICB0b3VjaFNjcm9sbDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnRvdWNoU2Nyb2xsaW5nICYmIGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgIHZhciBkZWx0YSA9IC10aGlzLnNpemluZy5tb3VzZURlbHRhKHRoaXMuc2Nyb2xsRXZlbnQsIGV2ZW50LnRvdWNoZXNbMF0pICogdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMuc3dpcGVTcGVlZDtcbiAgICAgICAgICB2YXIgc2Nyb2xsZWQgPSB0aGlzLnNjcm9sbE92ZXJ2aWV3QnkoZGVsdGEpO1xuICAgICAgICAgIGlmIChzY3JvbGxlZCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy5zZXRTY3JvbGxFdmVudChldmVudC50b3VjaGVzWzBdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHN0b3BUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHRoaXMudG91Y2hTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZVdoZWVsU2Nyb2xsOiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gLXRoaXMuc2l6aW5nLndoZWVsRGVsdGEoZGVsdGFYLCBkZWx0YVkpICogdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMud2hlZWxTcGVlZDtcbiAgICAgICAgaWYgKGRlbHRhICE9IDApXG4gICAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeShkZWx0YSk7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZUNsaWNrU2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gdGhpcy52aWV3UG9ydFNpemUgLSAyMDtcbiAgICAgICAgaWYgKGV2ZW50W1wicGFnZVwiICsgdGhpcy5zaXppbmcuc2Nyb2xsQXhpcygpXSA8IHRoaXMuJHRodW1iLm9mZnNldCgpW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXSlcbiAgICAgICAgLy8gbW91c2UgY2xpY2sgb3ZlciB0aHVtYlxuICAgICAgICAgIGRlbHRhID0gLWRlbHRhO1xuICAgICAgICB0aGlzLnNjcm9sbE92ZXJ2aWV3QnkoZGVsdGEpO1xuICAgICAgfSxcblxuICAgICAga2V5U2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGtleURvd24gPSBldmVudC53aGljaDtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlZCAmJiB0aGlzLmlzS2V5U2Nyb2xsaW5nKGtleURvd24pKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeSh0aGlzLmtleVNjcm9sbERlbHRhKGtleURvd24pKSlcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRodW1iQnk6IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgICAgICB2YXIgdGh1bWJQb3NpdGlvbiA9IHRoaXMudGh1bWJQb3NpdGlvbigpO1xuICAgICAgICB0aHVtYlBvc2l0aW9uICs9IGRlbHRhO1xuICAgICAgICB0aHVtYlBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbk9yTWF4KHRodW1iUG9zaXRpb24sIHRoaXMubWF4VGh1bWJQb3NpdGlvbik7XG4gICAgICAgIHZhciBvbGRTY3JvbGxQZXJjZW50ID0gdGhpcy5zY3JvbGxQZXJjZW50O1xuICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSB0aHVtYlBvc2l0aW9uIC8gdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9ICh0aHVtYlBvc2l0aW9uICogdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uKSAvIHRoaXMubWF4VGh1bWJQb3NpdGlvbjtcbiAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgaWYgKG9sZFNjcm9sbFBlcmNlbnQgIT0gdGhpcy5zY3JvbGxQZXJjZW50KSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tU2Nyb2xsKG9sZFNjcm9sbFBlcmNlbnQpO1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG5cbiAgICAgIHRodW1iUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHRodW1iLnBvc2l0aW9uKClbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsT3ZlcnZpZXdCeTogZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gdGhpcy5vdmVydmlld1Bvc2l0aW9uKCkgKyBkZWx0YTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Nyb2xsT3ZlcnZpZXdUbyhvdmVydmlld1Bvc2l0aW9uLCBmYWxzZSk7XG4gICAgICB9LFxuXG4gICAgICBvdmVydmlld1Bvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAtdGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldy5wb3NpdGlvbigpW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbE92ZXJ2aWV3VG86IGZ1bmN0aW9uIChvdmVydmlld1Bvc2l0aW9uLCBhbmltYXRlKSB7XG4gICAgICAgIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uT3JNYXgob3ZlcnZpZXdQb3NpdGlvbiwgdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uKTtcbiAgICAgICAgdmFyIG9sZFNjcm9sbFBlcmNlbnQgPSB0aGlzLnNjcm9sbFBlcmNlbnQ7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IG92ZXJ2aWV3UG9zaXRpb24gLyB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb247XG4gICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy5zY3JvbGxQZXJjZW50ICogdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICBpZiAoYW5pbWF0ZSlcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uV2l0aEFuaW1hdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24ob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbik7XG4gICAgICAgIGlmIChvbGRTY3JvbGxQZXJjZW50ICE9IHRoaXMuc2Nyb2xsUGVyY2VudCkge1xuICAgICAgICAgIHRoaXMudHJpZ2dlckN1c3RvbVNjcm9sbChvbGRTY3JvbGxQZXJjZW50KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcblxuICAgICAgcG9zaXRpb25Pck1heDogZnVuY3Rpb24gKHAsIG1heCkge1xuICAgICAgICBpZiAocCA8IDApXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIGVsc2UgaWYgKHAgPiBtYXgpXG4gICAgICAgICAgcmV0dXJuIG1heDtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBwO1xuICAgICAgfSxcblxuICAgICAgdHJpZ2dlckN1c3RvbVNjcm9sbDogZnVuY3Rpb24gKG9sZFNjcm9sbFBlcmNlbnQpIHtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRlbGVtZW50LnRyaWdnZXIoXCJjdXN0b21TY3JvbGxcIiwge1xuICAgICAgICAgICAgc2Nyb2xsQXhpczogdGhpcy5zaXppbmcuc2Nyb2xsQXhpcygpLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLnNpemluZy5zY3JvbGxEaXJlY3Rpb24ob2xkU2Nyb2xsUGVyY2VudCwgdGhpcy5zY3JvbGxQZXJjZW50KSxcbiAgICAgICAgICAgIHNjcm9sbFBlcmNlbnQ6IHRoaXMuc2Nyb2xsUGVyY2VudCAqIDEwMFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlc2Nyb2xsOiBmdW5jdGlvbiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgIGlmIChrZWVwUG9zaXRpb24pIHtcbiAgICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25Pck1heCh0aGlzLm92ZXJ2aWV3UG9zaXRpb24oKSwgdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uKTtcbiAgICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSBvdmVydmlld1Bvc2l0aW9uIC8gdGhpcy5tYXhPdmVydmlld1Bvc2l0aW9uO1xuICAgICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy5zY3JvbGxQZXJjZW50ICogdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24ob3ZlcnZpZXdQb3NpdGlvbiwgdGh1bWJQb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgICAgdmFyIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb247XG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc2V0U2Nyb2xsUG9zaXRpb246IGZ1bmN0aW9uIChvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMuJHRodW1iLmNzcyh0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKSwgdGh1bWJQb3NpdGlvbiArIFwicHhcIik7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcuY3NzKHRoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpLCAtb3ZlcnZpZXdQb3NpdGlvbiArIFwicHhcIik7XG4gICAgICB9LFxuXG4gICAgICBzZXRTY3JvbGxQb3NpdGlvbldpdGhBbmltYXRpb246IGZ1bmN0aW9uIChvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKSB7XG4gICAgICAgIHZhciB0aHVtYkFuaW1hdGlvbk9wdHMgPSB7fTtcbiAgICAgICAgdmFyIG92ZXJ2aWV3QW5pbWF0aW9uT3B0cyA9IHt9O1xuICAgICAgICB0aHVtYkFuaW1hdGlvbk9wdHNbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldID0gdGh1bWJQb3NpdGlvbiArIFwicHhcIjtcbiAgICAgICAgdGhpcy4kdGh1bWIuYW5pbWF0ZSh0aHVtYkFuaW1hdGlvbk9wdHMsIHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLmFuaW1hdGlvblNwZWVkKTtcbiAgICAgICAgb3ZlcnZpZXdBbmltYXRpb25PcHRzW3RoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpXSA9IC1vdmVydmlld1Bvc2l0aW9uICsgXCJweFwiO1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3LmFuaW1hdGUob3ZlcnZpZXdBbmltYXRpb25PcHRzLCB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy5hbmltYXRpb25TcGVlZCk7XG4gICAgICB9LFxuXG4gICAgICBjYWxjdWxhdGVNYXhUaHVtYlBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNpemluZy5zaXplKHRoaXMuJHNjcm9sbEJhcikgLSB0aGlzLnRodW1iU2l6ZTtcbiAgICAgIH0sXG5cbiAgICAgIGNhbGN1bGF0ZU1heE92ZXJ2aWV3UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldykgLSB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQpO1xuICAgICAgfSxcblxuICAgICAgc2V0U2Nyb2xsRXZlbnQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgYXR0ciA9IFwicGFnZVwiICsgdGhpcy5zaXppbmcuc2Nyb2xsQXhpcygpO1xuICAgICAgICBpZiAoIXRoaXMuc2Nyb2xsRXZlbnQgfHwgdGhpcy5zY3JvbGxFdmVudFthdHRyXSAhPSBldmVudFthdHRyXSlcbiAgICAgICAgICB0aGlzLnNjcm9sbEV2ZW50ID0ge3BhZ2VYOiBldmVudC5wYWdlWCwgcGFnZVk6IGV2ZW50LnBhZ2VZfTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvRWxlbWVudDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgaWYgKHRoaXMuc2l6aW5nLmlzSW5zaWRlKCRlbGVtZW50LCB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3KSAmJiAhdGhpcy5zaXppbmcuaXNJbnNpZGUoJGVsZW1lbnQsIHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQpKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAkZWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgICB2YXIgb3ZlcnZpZXdPZmZzZXQgPSB0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3Lm9mZnNldCgpO1xuICAgICAgICAgIHZhciB2aWV3UG9ydE9mZnNldCA9IHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQub2Zmc2V0KCk7XG4gICAgICAgICAgdGhpcy5zY3JvbGxPdmVydmlld1RvKGVsZW1lbnRPZmZzZXRbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldIC0gb3ZlcnZpZXdPZmZzZXRbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlTW91c2VNb3ZlU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlTW91c2VXaGVlbFNjcm9sbGluZygpO1xuICAgICAgICB0aGlzLnJlbW92ZVRvdWNoU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlTW91c2VDbGlja1Njcm9sbGluZygpO1xuICAgICAgICB0aGlzLnJlbW92ZVdpbmRvd1Jlc2l6ZSgpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIEhTaXppbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgfVxuXG4gICAgSFNpemluZy5wcm90b3R5cGUgPSB7XG4gICAgICBzaXplOiBmdW5jdGlvbiAoJGVsLCBhcmcpIHtcbiAgICAgICAgaWYgKGFyZylcbiAgICAgICAgICByZXR1cm4gJGVsLndpZHRoKGFyZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJGVsLndpZHRoKCk7XG4gICAgICB9LFxuXG4gICAgICBtaW5TaXplOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludCgkZWwuY3NzKFwibWluLXdpZHRoXCIpKSB8fCAwO1xuICAgICAgfSxcblxuICAgICAgZml4ZWRUaHVtYlNpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmZpeGVkVGh1bWJXaWR0aDtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEJhcjogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gJGVsLmZpbmQoXCIuc2Nyb2xsLWJhci5ob3Jpem9udGFsXCIpO1xuICAgICAgfSxcblxuICAgICAgbW91c2VEZWx0YTogZnVuY3Rpb24gKGV2ZW50MSwgZXZlbnQyKSB7XG4gICAgICAgIHJldHVybiBldmVudDIucGFnZVggLSBldmVudDEucGFnZVg7XG4gICAgICB9LFxuXG4gICAgICBvZmZzZXRDb21wb25lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwibGVmdFwiO1xuICAgICAgfSxcblxuICAgICAgd2hlZWxEZWx0YTogZnVuY3Rpb24gKGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIHJldHVybiBkZWx0YVg7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxBeGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIlhcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbERpcmVjdGlvbjogZnVuY3Rpb24gKG9sZFBlcmNlbnQsIG5ld1BlcmNlbnQpIHtcbiAgICAgICAgcmV0dXJuIG9sZFBlcmNlbnQgPCBuZXdQZXJjZW50ID8gXCJyaWdodFwiIDogXCJsZWZ0XCI7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxpbmdLZXlzOiB7XG4gICAgICAgIDM3OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIC0xMDsgLy9hcnJvdyBsZWZ0XG4gICAgICAgIH0sXG4gICAgICAgIDM5OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIDEwOyAvL2Fycm93IHJpZ2h0XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGlzSW5zaWRlOiBmdW5jdGlvbiAoZWxlbWVudCwgd3JhcHBpbmdFbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHZhciAkd3JhcHBpbmdFbGVtZW50ID0gJCh3cmFwcGluZ0VsZW1lbnQpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgd3JhcHBpbmdFbGVtZW50T2Zmc2V0ID0gJHdyYXBwaW5nRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50T2Zmc2V0LmxlZnQgPj0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQpICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQubGVmdCArICRlbGVtZW50LndpZHRoKCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQgKyAkd3JhcHBpbmdFbGVtZW50LndpZHRoKCkpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgdmFyIFZTaXppbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgfVxuXG4gICAgVlNpemluZy5wcm90b3R5cGUgPSB7XG5cbiAgICAgIHNpemU6IGZ1bmN0aW9uICgkZWwsIGFyZykge1xuICAgICAgICBpZiAoYXJnKVxuICAgICAgICAgIHJldHVybiAkZWwuaGVpZ2h0KGFyZyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gJGVsLmhlaWdodCgpO1xuICAgICAgfSxcblxuICAgICAgbWluU2l6ZTogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoJGVsLmNzcyhcIm1pbi1oZWlnaHRcIikpIHx8IDA7XG4gICAgICB9LFxuXG4gICAgICBmaXhlZFRodW1iU2l6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZml4ZWRUaHVtYkhlaWdodDtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEJhcjogZnVuY3Rpb24gKCRlbCkge1xuICAgICAgICByZXR1cm4gJGVsLmZpbmQoXCIuc2Nyb2xsLWJhci52ZXJ0aWNhbFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlRGVsdGE6IGZ1bmN0aW9uIChldmVudDEsIGV2ZW50Mikge1xuICAgICAgICByZXR1cm4gZXZlbnQyLnBhZ2VZIC0gZXZlbnQxLnBhZ2VZO1xuICAgICAgfSxcblxuICAgICAgb2Zmc2V0Q29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcInRvcFwiO1xuICAgICAgfSxcblxuICAgICAgd2hlZWxEZWx0YTogZnVuY3Rpb24gKGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgIHJldHVybiBkZWx0YVk7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxBeGlzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIllcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbERpcmVjdGlvbjogZnVuY3Rpb24gKG9sZFBlcmNlbnQsIG5ld1BlcmNlbnQpIHtcbiAgICAgICAgcmV0dXJuIG9sZFBlcmNlbnQgPCBuZXdQZXJjZW50ID8gXCJkb3duXCIgOiBcInVwXCI7XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxpbmdLZXlzOiB7XG4gICAgICAgIDM4OiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIC0xMDsgLy9hcnJvdyB1cFxuICAgICAgICB9LFxuICAgICAgICA0MDogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiAxMDsgLy9hcnJvdyBkb3duXG4gICAgICAgIH0sXG4gICAgICAgIDMzOiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIC0odmlld1BvcnRTaXplIC0gMjApOyAvL3BhZ2UgdXBcbiAgICAgICAgfSxcbiAgICAgICAgMzQ6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gdmlld1BvcnRTaXplIC0gMjA7IC8vcGFnZSBkb3duXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIGlzSW5zaWRlOiBmdW5jdGlvbiAoZWxlbWVudCwgd3JhcHBpbmdFbGVtZW50KSB7XG4gICAgICAgIHZhciAkZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHZhciAkd3JhcHBpbmdFbGVtZW50ID0gJCh3cmFwcGluZ0VsZW1lbnQpO1xuICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICB2YXIgd3JhcHBpbmdFbGVtZW50T2Zmc2V0ID0gJHdyYXBwaW5nRWxlbWVudC5vZmZzZXQoKTtcbiAgICAgICAgcmV0dXJuIChlbGVtZW50T2Zmc2V0LnRvcCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQudG9wKSAmJlxuICAgICAgICAgIChlbGVtZW50T2Zmc2V0LnRvcCArICRlbGVtZW50LmhlaWdodCgpIDw9IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3AgKyAkd3JhcHBpbmdFbGVtZW50LmhlaWdodCgpKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG9wdGlvbnMgPT0gdW5kZWZpbmVkKVxuICAgICAgICBvcHRpb25zID0gZGVmYXVsdE9wdGlvbnM7XG4gICAgICBpZiAodHlwZW9mKG9wdGlvbnMpID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdmFyIHNjcm9sbGFibGUgPSAkKHRoaXMpLmRhdGEoXCJzY3JvbGxhYmxlXCIpO1xuICAgICAgICBpZiAoc2Nyb2xsYWJsZSlcbiAgICAgICAgICBzY3JvbGxhYmxlW29wdGlvbnNdKGFyZ3MpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHlwZW9mKG9wdGlvbnMpID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgbmV3IFNjcm9sbGFibGUoJCh0aGlzKSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IFwiSW52YWxpZCB0eXBlIG9mIG9wdGlvbnNcIjtcbiAgICB9KTtcblxuICB9XG4gIDtcblxufSlcbiAgKGpRdWVyeSk7XG5cbihmdW5jdGlvbiAoJCkge1xuXG4gIHZhciB0eXBlcyA9IFsnRE9NTW91c2VTY3JvbGwnLCAnbW91c2V3aGVlbCddO1xuXG4gIGlmICgkLmV2ZW50LmZpeEhvb2tzKSB7XG4gICAgZm9yICh2YXIgaSA9IHR5cGVzLmxlbmd0aDsgaTspIHtcbiAgICAgICQuZXZlbnQuZml4SG9va3NbIHR5cGVzWy0taV0gXSA9ICQuZXZlbnQubW91c2VIb29rcztcbiAgICB9XG4gIH1cblxuICAkLmV2ZW50LnNwZWNpYWwubW91c2V3aGVlbCA9IHtcbiAgICBzZXR1cDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBmb3IgKHZhciBpID0gdHlwZXMubGVuZ3RoOyBpOykge1xuICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcih0eXBlc1stLWldLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25tb3VzZXdoZWVsID0gaGFuZGxlcjtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdGVhcmRvd246IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IHR5cGVzLmxlbmd0aDsgaTspIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZXNbLS1pXSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9ubW91c2V3aGVlbCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICQuZm4uZXh0ZW5kKHtcbiAgICBtb3VzZXdoZWVsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHJldHVybiBmbiA/IHRoaXMuYmluZChcIm1vdXNld2hlZWxcIiwgZm4pIDogdGhpcy50cmlnZ2VyKFwibW91c2V3aGVlbFwiKTtcbiAgICB9LFxuXG4gICAgdW5tb3VzZXdoZWVsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHJldHVybiB0aGlzLnVuYmluZChcIm1vdXNld2hlZWxcIiwgZm4pO1xuICAgIH1cbiAgfSk7XG5cblxuICBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XG4gICAgdmFyIG9yZ0V2ZW50ID0gZXZlbnQgfHwgd2luZG93LmV2ZW50LCBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBkZWx0YSA9IDAsIHJldHVyblZhbHVlID0gdHJ1ZSwgZGVsdGFYID0gMCwgZGVsdGFZID0gMDtcbiAgICBldmVudCA9ICQuZXZlbnQuZml4KG9yZ0V2ZW50KTtcbiAgICBldmVudC50eXBlID0gXCJtb3VzZXdoZWVsXCI7XG5cbiAgICAvLyBPbGQgc2Nob29sIHNjcm9sbHdoZWVsIGRlbHRhXG4gICAgaWYgKG9yZ0V2ZW50LndoZWVsRGVsdGEpIHtcbiAgICAgIGRlbHRhID0gb3JnRXZlbnQud2hlZWxEZWx0YSAvIDEyMDtcbiAgICB9XG4gICAgaWYgKG9yZ0V2ZW50LmRldGFpbCkge1xuICAgICAgZGVsdGEgPSAtb3JnRXZlbnQuZGV0YWlsIC8gMztcbiAgICB9XG5cbiAgICAvLyBOZXcgc2Nob29sIG11bHRpZGltZW5zaW9uYWwgc2Nyb2xsICh0b3VjaHBhZHMpIGRlbHRhc1xuICAgIGRlbHRhWSA9IGRlbHRhO1xuXG4gICAgLy8gR2Vja29cbiAgICBpZiAob3JnRXZlbnQuYXhpcyAhPT0gdW5kZWZpbmVkICYmIG9yZ0V2ZW50LmF4aXMgPT09IG9yZ0V2ZW50LkhPUklaT05UQUxfQVhJUykge1xuICAgICAgZGVsdGFZID0gMDtcbiAgICAgIGRlbHRhWCA9IGRlbHRhO1xuICAgIH1cblxuICAgIC8vIFdlYmtpdFxuICAgIGlmIChvcmdFdmVudC53aGVlbERlbHRhWSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkZWx0YVkgPSBvcmdFdmVudC53aGVlbERlbHRhWSAvIDEyMDtcbiAgICB9XG4gICAgaWYgKG9yZ0V2ZW50LndoZWVsRGVsdGFYICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlbHRhWCA9IG9yZ0V2ZW50LndoZWVsRGVsdGFYIC8gMTIwO1xuICAgIH1cblxuICAgIC8vIEFkZCBldmVudCBhbmQgZGVsdGEgdG8gdGhlIGZyb250IG9mIHRoZSBhcmd1bWVudHNcbiAgICBhcmdzLnVuc2hpZnQoZXZlbnQsIGRlbHRhLCBkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICByZXR1cm4gKCQuZXZlbnQuZGlzcGF0Y2ggfHwgJC5ldmVudC5oYW5kbGUpLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbn0pKGpRdWVyeSk7XG4iLCIvLyBTdG9yYWdlIGNhY2hlLlxyXG52YXIgY2FjaGUgPSB7fTtcclxuLy8gVGhlIHN0b3JlIGhhbmRsaW5nIGV4cGlyYXRpb24gb2YgZGF0YS5cclxudmFyIGV4cGlyZXNTdG9yZSA9IG5ldyBTdG9yZSh7XHJcblx0bmFtZXNwYWNlOiAnX19zdG9yYWdlLXdyYXBwZXI6ZXhwaXJlcydcclxufSk7XHJcblxyXG4vKipcclxuICogU3RvcmFnZSB3cmFwcGVyIGZvciBtYWtpbmcgcm91dGluZSBzdG9yYWdlIGNhbGxzIHN1cGVyIGVhc3kuXHJcbiAqIEBjbGFzcyBTdG9yZVxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAgICAgICAgICAgICAgICAgICAgIFRoZSBvcHRpb25zIGZvciB0aGUgc3RvcmUuIE9wdGlvbnMgbm90IG92ZXJyaWRkZW4gd2lsbCB1c2UgdGhlIGRlZmF1bHRzLlxyXG4gKiBAcGFyYW0ge21peGVkfSAgW29wdGlvbnMubmFtZXNwYWNlPScnXSAgICAgICAgU2VlIHt7I2Nyb3NzTGluayBcIlN0b3JlL3NldE5hbWVzcGFjZVwifX1TdG9yZSNzZXROYW1lc3BhY2V7ey9jcm9zc0xpbmt9fVxyXG4gKiBAcGFyYW0ge21peGVkfSAgW29wdGlvbnMuc3RvcmFnZVR5cGU9J2xvY2FsJ10gU2VlIHt7I2Nyb3NzTGluayBcIlN0b3JlL3NldFN0b3JhZ2VUeXBlXCJ9fVN0b3JlI3NldFN0b3JhZ2VUeXBle3svY3Jvc3NMaW5rfX1cclxuICovXHJcbmZ1bmN0aW9uIFN0b3JlKG9wdGlvbnMpIHtcclxuXHR2YXIgc2V0dGluZ3MgPSB7XHJcblx0XHRuYW1lc3BhY2U6ICcnLFxyXG5cdFx0c3RvcmFnZVR5cGU6ICdsb2NhbCdcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBzdG9yYWdlIG5hbWVzcGFjZS5cclxuXHQgKiBAbWV0aG9kIHNldE5hbWVzcGFjZVxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfGZhbHNlfG51bGx9IG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIHRvIHdvcmsgdW5kZXIuIFRvIHVzZSBubyBuYW1lc3BhY2UgKGUuZy4gZ2xvYmFsIG5hbWVzcGFjZSksIHBhc3MgaW4gYGZhbHNlYCBvciBgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nLlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0TmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cdFx0dmFyIHZhbGlkTmFtZXNwYWNlID0gL15bXFx3LTpdKyQvO1xyXG5cdFx0Ly8gTm8gbmFtZXNwYWNlLlxyXG5cdFx0aWYgKG5hbWVzcGFjZSA9PT0gZmFsc2UgfHwgbmFtZXNwYWNlID09IG51bGwgfHwgbmFtZXNwYWNlID09PSAnJykge1xyXG5cdFx0XHRzZXR0aW5ncy5uYW1lc3BhY2UgPSAnJztcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHR5cGVvZiBuYW1lc3BhY2UgIT09ICdzdHJpbmcnIHx8ICF2YWxpZE5hbWVzcGFjZS50ZXN0KG5hbWVzcGFjZSkpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5hbWVzcGFjZS4nKTtcclxuXHRcdH1cclxuXHRcdHNldHRpbmdzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBjdXJyZW50IHN0b3JhZ2UgbmFtZXNwYWNlLlxyXG5cdCAqIEBtZXRob2QgZ2V0TmFtZXNwYWNlXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3VycmVudCBuYW1lc3BhY2UuXHJcblx0ICovXHJcblx0dGhpcy5nZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAoaW5jbHVkZVNlcGFyYXRvcikge1xyXG5cdFx0aWYgKGluY2x1ZGVTZXBhcmF0b3IgJiYgc2V0dGluZ3MubmFtZXNwYWNlICE9PSAnJykge1xyXG5cdFx0XHRyZXR1cm4gc2V0dGluZ3MubmFtZXNwYWNlICsgJzonO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHNldHRpbmdzLm5hbWVzcGFjZTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIHR5cGUgb2Ygc3RvcmFnZSB0byB1c2UuXHJcblx0ICogQG1ldGhvZCBzZXRTdG9yYWdlVHlwZVxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIFRoZSB0eXBlIG9mIHN0b3JhZ2UgdG8gdXNlLiBVc2UgYHNlc3Npb25gIGZvciBgc2Vzc2lvblN0b3JhZ2VgIGFuZCBgbG9jYWxgIGZvciBgbG9jYWxTdG9yYWdlYC5cclxuXHQgKi9cclxuXHR0aGlzLnNldFN0b3JhZ2VUeXBlID0gZnVuY3Rpb24gKHR5cGUpIHtcclxuXHRcdGlmIChbJ3Nlc3Npb24nLCAnbG9jYWwnXS5pbmRleE9mKHR5cGUpIDwgMCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RvcmFnZSB0eXBlLicpO1xyXG5cdFx0fVxyXG5cdFx0c2V0dGluZ3Muc3RvcmFnZVR5cGUgPSB0eXBlO1xyXG5cdH07XHJcblx0LyoqXHJcblx0ICogR2V0IHRoZSB0eXBlIG9mIHN0b3JhZ2UgYmVpbmcgdXNlZC5cclxuXHQgKiBAbWV0aG9kIGdldFN0b3JhZ2VUeXBlXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgdHlwZSBvZiBzdG9yYWdlIGJlaW5nIHVzZWQuXHJcblx0ICovXHJcblx0dGhpcy5nZXRTdG9yYWdlVHlwZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBzZXR0aW5ncy5zdG9yYWdlVHlwZTtcclxuXHR9O1xyXG5cclxuXHQvLyBPdmVycmlkZSBkZWZhdWx0IHNldHRpbmdzLlxyXG5cdGlmIChvcHRpb25zKSB7XHJcblx0XHRmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xyXG5cdFx0XHRzd2l0Y2ggKGtleSkge1xyXG5cdFx0XHRcdGNhc2UgJ25hbWVzcGFjZSc6XHJcblx0XHRcdFx0XHR0aGlzLnNldE5hbWVzcGFjZShvcHRpb25zW2tleV0pO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAnc3RvcmFnZVR5cGUnOlxyXG5cdFx0XHRcdFx0dGhpcy5zZXRTdG9yYWdlVHlwZShvcHRpb25zW2tleV0pO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBhY3R1YWwgaGFuZGxlciB0byB1c2VcclxuICogQG1ldGhvZCBnZXRTdG9yYWdlSGFuZGxlclxyXG4gKiBAcmV0dXJuIHttaXhlZH0gVGhlIHN0b3JhZ2UgaGFuZGxlci5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXRTdG9yYWdlSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgaGFuZGxlcnMgPSB7XHJcblx0XHQnbG9jYWwnOiBsb2NhbFN0b3JhZ2UsXHJcblx0XHQnc2Vzc2lvbic6IHNlc3Npb25TdG9yYWdlXHJcblx0fTtcclxuXHRyZXR1cm4gaGFuZGxlcnNbdGhpcy5nZXRTdG9yYWdlVHlwZSgpXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGZ1bGwgc3RvcmFnZSBuYW1lIGZvciBhIGtleSwgaW5jbHVkaW5nIHRoZSBuYW1lc3BhY2UsIGlmIGFueS5cclxuICogQG1ldGhvZCBnZXRTdG9yYWdlS2V5XHJcbiAqIEBwYXJhbSAge3N0cmluZ30ga2V5IFRoZSBzdG9yYWdlIGtleSBuYW1lLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICBUaGUgZnVsbCBzdG9yYWdlIG5hbWUgdGhhdCBpcyB1c2VkIGJ5IHRoZSBzdG9yYWdlIG1ldGhvZHMuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZ2V0U3RvcmFnZUtleSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHRpZiAoIWtleSB8fCB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkubGVuZ3RoIDwgMSkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdLZXkgbXVzdCBiZSBhIHN0cmluZy4nKTtcclxuXHR9XHJcblx0cmV0dXJuIHRoaXMuZ2V0TmFtZXNwYWNlKHRydWUpICsga2V5O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yYWdlIGl0ZW0gZnJvbSB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgZ2V0XHJcbiAqIEBwYXJhbSAge3N0cmluZ30ga2V5ICAgICAgICAgIFRoZSBrZXkgdGhhdCB0aGUgZGF0YSBjYW4gYmUgYWNjZXNzZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSAge21peGVkfSAgZGVmYXVsdFZhbHVlIFRoZSBkZWZhdWx0IHZhbHVlIHRvIHJldHVybiBpbiBjYXNlIHRoZSBzdG9yYWdlIHZhbHVlIGlzIG5vdCBzZXQgb3IgYG51bGxgLlxyXG4gKiBAcmV0dXJuIHttaXhlZH0gICAgICAgICAgICAgICBUaGUgZGF0YSBmb3IgdGhlIHN0b3JhZ2UuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSwgZGVmYXVsdFZhbHVlKSB7XHJcblx0Ly8gUHJldmVudCByZWN1cnNpb24uIE9ubHkgY2hlY2sgZXhwaXJlIGRhdGUgaWYgaXQgaXNuJ3QgY2FsbGVkIGZyb20gYGV4cGlyZXNTdG9yZWAuXHJcblx0aWYgKHRoaXMgIT09IGV4cGlyZXNTdG9yZSkge1xyXG5cdFx0Ly8gQ2hlY2sgaWYga2V5IGlzIGV4cGlyZWQuXHJcblx0XHR2YXIgZXhwaXJlRGF0ZSA9IGV4cGlyZXNTdG9yZS5nZXQodGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG5cdFx0aWYgKGV4cGlyZURhdGUgIT09IG51bGwgJiYgZXhwaXJlRGF0ZS5nZXRUaW1lKCkgPCBEYXRlLm5vdygpKSB7XHJcblx0XHRcdC8vIEV4cGlyZWQsIHJlbW92ZSBpdC5cclxuXHRcdFx0dGhpcy5yZW1vdmUoa2V5KTtcclxuXHRcdFx0ZXhwaXJlc1N0b3JlLnJlbW92ZSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBDYWNoZWQsIHJlYWQgZnJvbSBtZW1vcnkuXHJcblx0aWYgKGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSAhPSBudWxsKSB7XHJcblx0XHRyZXR1cm4gY2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldO1xyXG5cdH1cclxuXHJcblx0dmFyIHZhbCA9IHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5nZXRJdGVtKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxuXHJcblx0Ly8gVmFsdWUgZG9lc24ndCBleGlzdCBhbmQgd2UgaGF2ZSBhIGRlZmF1bHQsIHJldHVybiBkZWZhdWx0LlxyXG5cdGlmICh2YWwgPT09IG51bGwgJiYgdHlwZW9mIGRlZmF1bHRWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHJldHVybiBkZWZhdWx0VmFsdWU7XHJcblx0fVxyXG5cclxuXHQvLyBPbmx5IHByZS1wcm9jZXNzIHN0cmluZ3MuXHJcblx0aWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XHJcblx0XHQvLyBIYW5kbGUgUmVnRXhwcy5cclxuXHRcdGlmICh2YWwuaW5kZXhPZignflJlZ0V4cDonKSA9PT0gMCkge1xyXG5cdFx0XHR2YXIgbWF0Y2hlcyA9IC9eflJlZ0V4cDooW2dpbV0qPyk6KC4qKS8uZXhlYyh2YWwpO1xyXG5cdFx0XHR2YWwgPSBuZXcgUmVnRXhwKG1hdGNoZXNbMl0sIG1hdGNoZXNbMV0pO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIERhdGVzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35EYXRlOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IG5ldyBEYXRlKHZhbC5yZXBsYWNlKC9efkRhdGU6LywgJycpKTtcclxuXHRcdH1cclxuXHRcdC8vIEhhbmRsZSBudW1iZXJzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35OdW1iZXI6JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gcGFyc2VJbnQodmFsLnJlcGxhY2UoL15+TnVtYmVyOi8sICcnKSwgMTApO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIGJvb2xlYW5zLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35Cb29sZWFuOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IHZhbC5yZXBsYWNlKC9efkJvb2xlYW46LywgJycpID09PSAndHJ1ZSc7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgb2JqZWN0cy5cclxuXHRcdGVsc2UgaWYgKHZhbC5pbmRleE9mKCd+SlNPTjonKSA9PT0gMCkge1xyXG5cdFx0XHR2YWwgPSB2YWwucmVwbGFjZSgvXn5KU09OOi8sICcnKTtcclxuXHRcdFx0Ly8gVHJ5IHBhcnNpbmcgaXQuXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0dmFsID0gSlNPTi5wYXJzZSh2YWwpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIFBhcnNpbmcgd2VudCB3cm9uZyAoaW52YWxpZCBKU09OKSwgcmV0dXJuIGRlZmF1bHQgb3IgbnVsbC5cclxuXHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGRlZmF1bHRWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdFx0XHRcdHJldHVybiBkZWZhdWx0VmFsdWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBSZXR1cm4gaXQuXHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gdmFsO1xyXG5cdHJldHVybiB2YWw7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyBhIHN0b3JhZ2UgaXRlbSBvbiB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2Qgc2V0XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgIGtleSAgICAgICBUaGUga2V5IHRoYXQgdGhlIGRhdGEgY2FuIGJlIGFjY2Vzc2VkIHVuZGVyLlxyXG4gKiBAcGFyYW0ge21peGVkfSAgICAgICB2YWwgICAgICAgVGhlIHZhbHVlIHRvIHN0b3JlLiBNYXkgYmUgdGhlIGZvbGxvd2luZyB0eXBlcyBvZiBkYXRhOiBgUmVnRXhwYCwgYERhdGVgLCBgT2JqZWN0YCwgYFN0cmluZ2AsIGBCb29sZWFuYCwgYE51bWJlcmBcclxuICogQHBhcmFtIHtEYXRlfG51bWJlcn0gW2V4cGlyZXNdIFRoZSBkYXRlIGluIHRoZSBmdXR1cmUgdG8gZXhwaXJlLCBvciByZWxhdGl2ZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGZyb20gYERhdGUjbm93YCB0byBleHBpcmUuXHJcbiAqXHJcbiAqIE5vdGU6IFRoaXMgY29udmVydHMgc3BlY2lhbCBkYXRhIHR5cGVzIHRoYXQgbm9ybWFsbHkgY2FuJ3QgYmUgc3RvcmVkIGluIHRoZSBmb2xsb3dpbmcgd2F5OlxyXG4gKiBcclxuICogLSBgUmVnRXhwYDogcHJlZml4ZWQgd2l0aCB0eXBlLCBmbGFncyBzdG9yZWQsIGFuZCBzb3VyY2Ugc3RvcmVkIGFzIHN0cmluZy5cclxuICogLSBgRGF0ZWA6IHByZWZpeGVkIHdpdGggdHlwZSwgc3RvcmVkIGFzIHN0cmluZyB1c2luZyBgRGF0ZSN0b1N0cmluZ2AuXHJcbiAqIC0gYE9iamVjdGA6IHByZWZpeGVkIHdpdGggXCJKU09OXCIgaW5kaWNhdG9yLCBzdG9yZWQgYXMgc3RyaW5nIHVzaW5nIGBKU09OI3N0cmluZ2lmeWAuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsLCBleHBpcmVzKSB7XHJcblx0dmFyIHBhcnNlZFZhbCA9IG51bGw7XHJcblx0Ly8gSGFuZGxlIFJlZ0V4cHMuXHJcblx0aWYgKHZhbCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xyXG5cdFx0dmFyIGZsYWdzID0gW1xyXG5cdFx0XHR2YWwuZ2xvYmFsID8gJ2cnIDogJycsXHJcblx0XHRcdHZhbC5pZ25vcmVDYXNlID8gJ2knIDogJycsXHJcblx0XHRcdHZhbC5tdWx0aWxpbmUgPyAnbScgOiAnJyxcclxuXHRcdF0uam9pbignJyk7XHJcblx0XHRwYXJzZWRWYWwgPSAnflJlZ0V4cDonICsgZmxhZ3MgKyAnOicgKyB2YWwuc291cmNlO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgRGF0ZXMuXHJcblx0ZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkge1xyXG5cdFx0cGFyc2VkVmFsID0gJ35EYXRlOicgKyB2YWwudG9TdHJpbmcoKTtcclxuXHR9XHJcblx0Ly8gSGFuZGxlIG9iamVjdHMuXHJcblx0ZWxzZSBpZiAodmFsID09PSBPYmplY3QodmFsKSkge1xyXG5cdFx0cGFyc2VkVmFsID0gJ35KU09OOicgKyBKU09OLnN0cmluZ2lmeSh2YWwpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgbnVtYmVycy5cclxuXHRlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xyXG5cdFx0cGFyc2VkVmFsID0gJ35OdW1iZXI6JyArIHZhbC50b1N0cmluZygpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgYm9vbGVhbnMuXHJcblx0ZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ2Jvb2xlYW4nKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkJvb2xlYW46JyArIHZhbC50b1N0cmluZygpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgc3RyaW5ncy5cclxuXHRlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xyXG5cdFx0cGFyc2VkVmFsID0gdmFsO1xyXG5cdH1cclxuXHQvLyBUaHJvdyBpZiB3ZSBkb24ndCBrbm93IHdoYXQgaXQgaXMuXHJcblx0ZWxzZSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBzdG9yZSB0aGlzIHZhbHVlOyB3cm9uZyB2YWx1ZSB0eXBlLicpO1xyXG5cdH1cclxuXHQvLyBTZXQgZXhwaXJlIGRhdGUgaWYgbmVlZGVkLlxyXG5cdGlmICh0eXBlb2YgZXhwaXJlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdC8vIENvbnZlcnQgdG8gYSByZWxhdGl2ZSBkYXRlLlxyXG5cdFx0aWYgKHR5cGVvZiBleHBpcmVzID09PSAnbnVtYmVyJykge1xyXG5cdFx0XHRleHBpcmVzID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIGV4cGlyZXMpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gTWFrZSBzdXJlIGl0IGlzIGEgZGF0ZS5cclxuXHRcdGlmIChleHBpcmVzIGluc3RhbmNlb2YgRGF0ZSkge1xyXG5cdFx0XHRleHBpcmVzU3RvcmUuc2V0KHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpLCBleHBpcmVzKTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0tleSBleHBpcmUgbXVzdCBiZSBhIHZhbGlkIGRhdGUgb3IgdGltZXN0YW1wLicpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvLyBTYXZlIGl0LlxyXG5cdGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSA9IHZhbDtcclxuXHR0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkuc2V0SXRlbSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSwgcGFyc2VkVmFsKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGFsbCBkYXRhIGZvciB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgZ2V0QWxsXHJcbiAqIEByZXR1cm4ge29iamVjdH0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgYWxsIGRhdGEgaW4gdGhlIGZvcm0gb2YgYHt0aGVLZXk6IHRoZURhdGF9YCB3aGVyZSBgdGhlRGF0YWAgaXMgcGFyc2VkIHVzaW5nIHt7I2Nyb3NzTGluayBcIlN0b3JlL2dldFwifX1TdG9yZSNnZXR7ey9jcm9zc0xpbmt9fS5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGtleXMgPSB0aGlzLmxpc3RLZXlzKCk7XHJcblx0dmFyIGRhdGEgPSB7fTtcclxuXHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0ZGF0YVtrZXldID0gdGhpcy5nZXQoa2V5KTtcclxuXHR9LCB0aGlzKTtcclxuXHRyZXR1cm4gZGF0YTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMaXN0IGFsbCBrZXlzIHRoYXQgYXJlIHRpZWQgdG8gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIGxpc3RLZXlzXHJcbiAqIEByZXR1cm4ge2FycmF5fSBUaGUgc3RvcmFnZSBrZXlzLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmxpc3RLZXlzID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBrZXlzID0gW107XHJcblx0dmFyIGtleSA9IG51bGw7XHJcblx0dmFyIHN0b3JhZ2VMZW5ndGggPSB0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkubGVuZ3RoO1xyXG5cdHZhciBwcmVmaXggPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMuZ2V0TmFtZXNwYWNlKHRydWUpKTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHN0b3JhZ2VMZW5ndGg7IGkrKykge1xyXG5cdFx0a2V5ID0gdGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLmtleShpKVxyXG5cdFx0aWYgKHByZWZpeC50ZXN0KGtleSkpIHtcclxuXHRcdFx0a2V5cy5wdXNoKGtleS5yZXBsYWNlKHByZWZpeCwgJycpKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIGtleXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHNwZWNpZmljIGtleSBhbmQgZGF0YSBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCByZW1vdmVcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIHJlbW92ZSB0aGUgZGF0YSBmb3IuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSA9IG51bGw7XHJcblx0dGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLnJlbW92ZUl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYWxsIGRhdGEgYW5kIGtleXMgZnJvbSB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgcmVtb3ZlQWxsXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUucmVtb3ZlQWxsID0gZnVuY3Rpb24gKCkge1xyXG5cdHRoaXMubGlzdEtleXMoKS5mb3JFYWNoKHRoaXMucmVtb3ZlLCB0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIG5hbWVzcGFjZWQgaXRlbXMgZnJvbSB0aGUgY2FjaGUgc28geW91ciBuZXh0IHt7I2Nyb3NzTGluayBcIlN0b3JlL2dldFwifX1TdG9yZSNnZXR7ey9jcm9zc0xpbmt9fSB3aWxsIGJlIGZyZXNoIGZyb20gdGhlIHN0b3JhZ2UuXHJcbiAqIEBtZXRob2QgZnJlc2hlblxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIHRoZSBjYWNoZSBkYXRhIGZvci5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5mcmVzaGVuID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdHZhciBrZXlzID0ga2V5ID8gW2tleV0gOiB0aGlzLmxpc3RLZXlzKCk7XHJcblx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSA9IG51bGw7XHJcblx0fSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogTWlncmF0ZSBkYXRhIGZyb20gYSBkaWZmZXJlbnQgbmFtZXNwYWNlIHRvIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIG1pZ3JhdGVcclxuICogQHBhcmFtIHtvYmplY3R9ICAgbWlncmF0aW9uICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgbWlncmF0aW9uIG9iamVjdC5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbWlncmF0aW9uLnRvS2V5ICAgICAgICAgICAgICAgICAgICBUaGUga2V5IG5hbWUgdW5kZXIgeW91ciBjdXJyZW50IG5hbWVzcGFjZSB0aGUgb2xkIGRhdGEgc2hvdWxkIGNoYW5nZSB0by5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbWlncmF0aW9uLmZyb21OYW1lc3BhY2UgICAgICAgICAgICBUaGUgb2xkIG5hbWVzcGFjZSB0aGF0IHRoZSBvbGQga2V5IGJlbG9uZ3MgdG8uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG1pZ3JhdGlvbi5mcm9tS2V5ICAgICAgICAgICAgICAgICAgVGhlIG9sZCBrZXkgbmFtZSB0byBtaWdyYXRlIGZyb20uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIFttaWdyYXRpb24uZnJvbVN0b3JhZ2VUeXBlXSAgICAgICAgVGhlIHN0b3JhZ2UgdHlwZSB0byBtaWdyYXRlIGZyb20uIERlZmF1bHRzIHRvIHNhbWUgdHlwZSBhcyB3aGVyZSB5b3UgYXJlIG1pZ3JhdGluZyB0by5cclxuICogQHBhcmFtIHtib29sZWFufSAgW21pZ3JhdGlvbi5rZWVwT2xkRGF0YT1mYWxzZV0gICAgICBXaGV0aGVyIG9sZCBkYXRhIHNob3VsZCBiZSBrZXB0IGFmdGVyIGl0IGhhcyBiZWVuIG1pZ3JhdGVkLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICBbbWlncmF0aW9uLm92ZXJ3cml0ZU5ld0RhdGE9ZmFsc2VdIFdoZXRoZXIgb2xkIGRhdGEgc2hvdWxkIG92ZXJ3cml0ZSBjdXJyZW50bHkgc3RvcmVkIGRhdGEgaWYgaXQgZXhpc3RzLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbbWlncmF0aW9uLnRyYW5zZm9ybV0gICAgICAgICAgICAgIFRoZSBmdW5jdGlvbiB0byBwYXNzIHRoZSBvbGQga2V5IGRhdGEgdGhyb3VnaCBiZWZvcmUgbWlncmF0aW5nLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBcclxuICogICAgIHZhciBTdG9yZSA9IHJlcXVpcmUoJ3N0b3JhZ2Utd3JhcHBlcicpO1xyXG4gKiAgICAgdmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuICogICAgICAgICBuYW1lc3BhY2U6ICdteU5ld0FwcCdcclxuICogICAgIH0pO1xyXG4gKlxyXG4gKiAgICAgLy8gTWlncmF0ZSBmcm9tIHRoZSBvbGQgYXBwLlxyXG4gKiAgICAgc3RvcmUubWlncmF0ZSh7XHJcbiAqICAgICAgICAgdG9LZXk6ICduZXcta2V5JyxcclxuICogICAgICAgICBmcm9tTmFtZXNwYWNlOiAnbXlPbGRBcHAnLFxyXG4gKiAgICAgICAgIGZyb21LZXk6ICdvbGQta2V5J1xyXG4gKiAgICAgfSk7XHJcbiAqICAgICBcclxuICogICAgIC8vIE1pZ3JhdGUgZnJvbSBnbG9iYWwgZGF0YS4gVXNlZnVsIHdoZW4gbW92aW5nIGZyb20gb3RoZXIgc3RvcmFnZSB3cmFwcGVycyBvciByZWd1bGFyIG9sJyBgbG9jYWxTdG9yYWdlYC5cclxuICogICAgIHN0b3JlLm1pZ3JhdGUoe1xyXG4gKiAgICAgICAgIHRvS2V5OiAnb3RoZXItbmV3LWtleScsXHJcbiAqICAgICAgICAgZnJvbU5hbWVzcGFjZTogJycsXHJcbiAqICAgICAgICAgZnJvbUtleTogJ290aGVyLW9sZC1rZXktb24tZ2xvYmFsJ1xyXG4gKiAgICAgfSk7XHJcbiAqICAgICBcclxuICogICAgIC8vIE1pZ3JhdGUgc29tZSBKU09OIGRhdGEgdGhhdCB3YXMgc3RvcmVkIGFzIGEgc3RyaW5nLlxyXG4gKiAgICAgc3RvcmUubWlncmF0ZSh7XHJcbiAqICAgICAgICAgdG9LZXk6ICduZXctanNvbi1rZXknLFxyXG4gKiAgICAgICAgIGZyb21OYW1lc3BhY2U6ICdteU9sZEFwcCcsXHJcbiAqICAgICAgICAgZnJvbUtleTogJ29sZC1qc29uLWtleScsXHJcbiAqICAgICAgICAgLy8gVHJ5IGNvbnZlcnRpbmcgc29tZSBvbGQgSlNPTiBkYXRhLlxyXG4gKiAgICAgICAgIHRyYW5zZm9ybTogZnVuY3Rpb24gKGRhdGEpIHtcclxuICogICAgICAgICAgICAgdHJ5IHtcclxuICogICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpO1xyXG4gKiAgICAgICAgICAgICB9XHJcbiAqICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAqICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICogICAgICAgICAgICAgfVxyXG4gKiAgICAgICAgIH1cclxuICogICAgIH0pO1xyXG4gKi9cclxuXHJcblN0b3JlLnByb3RvdHlwZS5taWdyYXRlID0gZnVuY3Rpb24gKG1pZ3JhdGlvbikge1xyXG5cdC8vIFNhdmUgb3VyIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG5cdHZhciB0b05hbWVzcGFjZSA9IHRoaXMuZ2V0TmFtZXNwYWNlKCk7XHJcblx0dmFyIHRvU3RvcmFnZVR5cGUgPSB0aGlzLmdldFN0b3JhZ2VUeXBlKCk7XHJcblxyXG5cdC8vIENyZWF0ZSBhIHRlbXBvcmFyeSBzdG9yZSB0byBhdm9pZCBjaGFuZ2luZyBuYW1lc3BhY2UgZHVyaW5nIGFjdHVhbCBnZXQvc2V0cy5cclxuXHR2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG5cdFx0bmFtZXNwYWNlOiB0b05hbWVzcGFjZSxcclxuXHRcdHN0b3JhZ2VUeXBlOiB0b1N0b3JhZ2VUeXBlXHJcblx0fSk7XHJcblxyXG5cdHZhciBkYXRhID0gbnVsbDtcclxuXHJcblx0Ly8gR2V0IGRhdGEgZnJvbSBvbGQgbmFtZXNwYWNlLlxyXG5cdHN0b3JlLnNldE5hbWVzcGFjZShtaWdyYXRpb24uZnJvbU5hbWVzcGFjZSk7XHJcblx0aWYgKHR5cGVvZiBtaWdyYXRpb24uZnJvbVN0b3JhZ2VUeXBlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0c3RvcmUuc2V0U3RvcmFnZVR5cGUobWlncmF0aW9uLmZyb21TdG9yYWdlVHlwZSk7XHJcblx0fVxyXG5cdGRhdGEgPSBzdG9yZS5nZXQobWlncmF0aW9uLmZyb21LZXkpO1xyXG5cclxuXHQvLyBSZW1vdmUgb2xkIGlmIG5lZWRlZC5cclxuXHRpZiAoIW1pZ3JhdGlvbi5rZWVwT2xkRGF0YSkge1xyXG5cdFx0c3RvcmUucmVtb3ZlKG1pZ3JhdGlvbi5mcm9tS2V5KTtcclxuXHR9XHJcblx0XHJcblx0Ly8gTm8gZGF0YSwgaWdub3JlIHRoaXMgbWlncmF0aW9uLlxyXG5cdGlmIChkYXRhID09PSBudWxsKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHQvLyBUcmFuc2Zvcm0gZGF0YSBpZiBuZWVkZWQuXHJcblx0aWYgKHR5cGVvZiBtaWdyYXRpb24udHJhbnNmb3JtID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRkYXRhID0gbWlncmF0aW9uLnRyYW5zZm9ybShkYXRhKTtcclxuXHR9XHJcblx0ZWxzZSBpZiAodHlwZW9mIG1pZ3JhdGlvbi50cmFuc2Zvcm0gIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdHJhbnNmb3JtIGNhbGxiYWNrLicpO1xyXG5cdH1cclxuXHJcblx0Ly8gR28gYmFjayB0byBjdXJyZW50IG5hbWVzcGFjZS5cclxuXHRzdG9yZS5zZXROYW1lc3BhY2UodG9OYW1lc3BhY2UpO1xyXG5cdHN0b3JlLnNldFN0b3JhZ2VUeXBlKHRvU3RvcmFnZVR5cGUpO1xyXG5cclxuXHQvLyBPbmx5IG92ZXJ3cml0ZSBuZXcgZGF0YSBpZiBpdCBkb2Vzbid0IGV4aXN0IG9yIGl0J3MgcmVxdWVzdGVkLlxyXG5cdGlmIChzdG9yZS5nZXQobWlncmF0aW9uLnRvS2V5KSA9PT0gbnVsbCB8fCBtaWdyYXRpb24ub3ZlcndyaXRlTmV3RGF0YSkge1xyXG5cdFx0c3RvcmUuc2V0KG1pZ3JhdGlvbi50b0tleSwgZGF0YSk7XHJcblx0fVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBzdWJzdG9yZSB0aGF0IGlzIG5lc3RlZCBpbiB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgY3JlYXRlU3Vic3RvcmVcclxuICogQHBhcmFtICB7c3RyaW5nfSBuYW1lc3BhY2UgVGhlIHN1YnN0b3JlJ3MgbmFtZXNwYWNlLlxyXG4gKiBAcmV0dXJuIHtTdG9yZX0gICAgICAgICAgICBUaGUgc3Vic3RvcmUuXHJcbiAqIEBleGFtcGxlXHJcbiAqIFxyXG4gKiAgICAgdmFyIFN0b3JlID0gcmVxdWlyZSgnc3RvcmFnZS13cmFwcGVyJyk7XHJcbiAqICAgICAvLyBDcmVhdGUgbWFpbiBzdG9yZS5cclxuICogICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yZSh7XHJcbiAqICAgICAgICAgbmFtZXNwYWNlOiAnbXlhcHAnXHJcbiAqICAgICB9KTtcclxuICpcclxuICogICAgIC8vIENyZWF0ZSBzdWJzdG9yZS5cclxuICogICAgIHZhciBzdWJzdG9yZSA9IHN0b3JlLmNyZWF0ZVN1YnN0b3JlKCd0aGluZ3MnKTtcclxuICogICAgIHN1YnN0b3JlLnNldCgnZm9vJywgJ2JhcicpO1xyXG4gKlxyXG4gKiAgICAgc3Vic3RvcmUuZ2V0KCdmb28nKSA9PT0gc3RvcmUuZ2V0KCd0aGluZ3M6Zm9vJyk7XHJcbiAqICAgICAvLyB0cnVlXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuY3JlYXRlU3Vic3RvcmUgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XHJcblx0cmV0dXJuIG5ldyBTdG9yZSh7XHJcblx0XHRuYW1lc3BhY2U6IHRoaXMuZ2V0TmFtZXNwYWNlKHRydWUpICsgbmFtZXNwYWNlLFxyXG5cdFx0c3RvcmFnZVR5cGU6IHRoaXMuZ2V0U3RvcmFnZVR5cGUoKVxyXG5cdH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdG9yZTtcclxuIiwibW9kdWxlLmV4cG9ydHM9e1xyXG5cdFwibmFtZVwiOiBcInR3aXRjaC1jaGF0LWVtb3Rlc1wiLFxyXG5cdFwidmVyc2lvblwiOiBcIjEuMS4wXCIsXHJcblx0XCJob21lcGFnZVwiOiBcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvXCIsXHJcblx0XCJidWdzXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2NsZXR1c2MvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL2lzc3Vlc1wiLFxyXG5cdFwiYXV0aG9yXCI6IFwiUnlhbiBDaGF0aGFtIDxyeWFuLmIuY2hhdGhhbUBnbWFpbC5jb20+IChodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYylcIixcclxuXHRcInJlcG9zaXRvcnlcIjoge1xyXG5cdFx0XCJ0eXBlXCI6IFwiZ2l0XCIsXHJcblx0XHRcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy5naXRcIlxyXG5cdH0sXHJcblx0XCJ1c2Vyc2NyaXB0XCI6IHtcclxuXHRcdFwibmFtZVwiOiBcIlR3aXRjaCBDaGF0IEVtb3Rlc1wiLFxyXG5cdFx0XCJuYW1lc3BhY2VcIjogXCIjQ2xldHVzXCIsXHJcblx0XHRcInZlcnNpb25cIjogXCJ7e3twa2cudmVyc2lvbn19fVwiLFxyXG5cdFx0XCJkZXNjcmlwdGlvblwiOiBcIkFkZHMgYSBidXR0b24gdG8gVHdpdGNoIHRoYXQgYWxsb3dzIHlvdSB0byBcXFwiY2xpY2stdG8taW5zZXJ0XFxcIiBhbiBlbW90ZS5cIixcclxuXHRcdFwiY29weXJpZ2h0XCI6IFwiMjAxMSssIHt7e3BrZy5hdXRob3J9fX1cIixcclxuXHRcdFwiYXV0aG9yXCI6IFwie3t7cGtnLmF1dGhvcn19fVwiLFxyXG5cdFx0XCJpY29uXCI6IFwiaHR0cDovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyLnBocD9ncmF2YXRhcl9pZD02ODc1ZTgzYWE2YzU2Mzc5MGNiMmRhOTE0YWFiYThiMyZyPVBHJnM9NDgmZGVmYXVsdD1pZGVudGljb25cIixcclxuXHRcdFwibGljZW5zZVwiOiBbXHJcblx0XHRcdFwiTUlUOyBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXCIsXHJcblx0XHRcdFwiQ0MgQlktTkMtU0EgMy4wOyBodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1uYy1zYS8zLjAvXCJcclxuXHRcdF0sXHJcblx0XHRcImhvbWVwYWdlXCI6IFwie3t7cGtnLmhvbWVwYWdlfX19XCIsXHJcblx0XHRcInN1cHBvcnRVUkxcIjogXCJ7e3twa2cuYnVnc319fVwiLFxyXG5cdFx0XCJjb250cmlidXRpb25VUkxcIjogXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzLyNkb25hdGVcIixcclxuXHRcdFwiZ3JhbnRcIjogXCJub25lXCIsXHJcblx0XHRcImluY2x1ZGVcIjogXCJodHRwOi8vKi50d2l0Y2gudHYvKlwiLFxyXG5cdFx0XCJleGNsdWRlXCI6IFtcclxuXHRcdFx0XCJodHRwOi8vYXBpLnR3aXRjaC50di8qXCIsXHJcblx0XHRcdFwiaHR0cDovL3RtaS50d2l0Y2gudHYvKlwiLFxyXG5cdFx0XHRcImh0dHA6Ly9jaGF0ZGVwb3QudHdpdGNoLnR2LypcIlxyXG5cdFx0XVxyXG5cdH0sXHJcblx0XCJzY3JpcHRzXCI6IHtcclxuXHRcdFwiaW5zdGFsbFwiOiBcIm5hcGFcIlxyXG5cdH0sXHJcblx0XCJkZXZEZXBlbmRlbmNpZXNcIjoge1xyXG5cdFx0XCJicm93c2VyLXN5bmNcIjogXCJeMS4zLjJcIixcclxuXHRcdFwiYnJvd3NlcmlmeVwiOiBcIl41LjkuMVwiLFxyXG5cdFx0XCJndWxwXCI6IFwiXjMuOC4zXCIsXHJcblx0XHRcImd1bHAtYXV0b3ByZWZpeGVyXCI6IFwiMC4wLjhcIixcclxuXHRcdFwiZ3VscC1iZWF1dGlmeVwiOiBcIjEuMS4wXCIsXHJcblx0XHRcImd1bHAtY2hhbmdlZFwiOiBcIl4wLjQuMVwiLFxyXG5cdFx0XCJndWxwLWNvbmNhdFwiOiBcIl4yLjIuMFwiLFxyXG5cdFx0XCJndWxwLWNvbmZsaWN0XCI6IFwiXjAuMS4yXCIsXHJcblx0XHRcImd1bHAtY3NzLWJhc2U2NFwiOiBcIl4xLjEuMFwiLFxyXG5cdFx0XCJndWxwLWNzczJqc1wiOiBcIl4xLjAuMlwiLFxyXG5cdFx0XCJndWxwLWhlYWRlclwiOiBcIl4xLjAuMlwiLFxyXG5cdFx0XCJndWxwLWhvZ2FuLWNvbXBpbGVcIjogXCJeMC4yLjFcIixcclxuXHRcdFwiZ3VscC1taW5pZnktY3NzXCI6IFwiXjAuMy41XCIsXHJcblx0XHRcImd1bHAtbm90aWZ5XCI6IFwiXjEuNC4xXCIsXHJcblx0XHRcImd1bHAtcmVuYW1lXCI6IFwiXjEuMi4wXCIsXHJcblx0XHRcImd1bHAtdWdsaWZ5XCI6IFwiXjAuMy4xXCIsXHJcblx0XHRcImd1bHAtdXRpbFwiOiBcIl4zLjAuMFwiLFxyXG5cdFx0XCJob2dhbi5qc1wiOiBcIl4zLjAuMlwiLFxyXG5cdFx0XCJqcXVlcnktdWlcIjogXCJeMS4xMC41XCIsXHJcblx0XHRcIm5hcGFcIjogXCJeMC40LjFcIixcclxuXHRcdFwicHJldHR5LWhydGltZVwiOiBcIl4wLjIuMVwiLFxyXG5cdFx0XCJ2aW55bC1tYXBcIjogXCJeMS4wLjFcIixcclxuXHRcdFwidmlueWwtc291cmNlLXN0cmVhbVwiOiBcIl4wLjEuMVwiLFxyXG5cdFx0XCJ3YXRjaGlmeVwiOiBcIl4xLjAuMVwiLFxyXG5cdFx0XCJzdG9yYWdlLXdyYXBwZXJcIjogXCJjbGV0dXNjL3N0b3JhZ2Utd3JhcHBlciN2MC4xLjFcIlxyXG5cdH0sXHJcblx0XCJuYXBhXCI6IHtcclxuXHRcdFwianF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXJcIjogXCJtenViYWxhL2pxdWVyeS1jdXN0b20tc2Nyb2xsYmFyIzAuNS41XCJcclxuXHR9XHJcbn1cclxuIiwidmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XHJcbnZhciBhcGkgPSB7fTtcclxudmFyIGVtYmVyID0gbnVsbDtcclxudmFyIGhvb2tlZEZhY3RvcmllcyA9IHt9O1xyXG5cclxuYXBpLmdldEVtYmVyID0gZnVuY3Rpb24gKCkge1xyXG5cdGlmIChlbWJlcikge1xyXG5cdFx0cmV0dXJuIGVtYmVyO1xyXG5cdH1cclxuXHRpZiAod2luZG93LkFwcCAmJiB3aW5kb3cuQXBwLl9fY29udGFpbmVyX18pIHtcclxuXHRcdGVtYmVyID0gd2luZG93LkFwcC5fX2NvbnRhaW5lcl9fO1xyXG5cdFx0cmV0dXJuIGVtYmVyO1xyXG5cdH1cclxuXHRyZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5hcGkuaXNMb2FkZWQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIEJvb2xlYW4oYXBpLmdldEVtYmVyKCkpO1xyXG59O1xyXG5cclxuYXBpLmxvb2t1cCA9IGZ1bmN0aW9uIChsb29rdXBGYWN0b3J5KSB7XHJcblx0aWYgKCFhcGkuaXNMb2FkZWQoKSkge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGYWN0b3J5IGxvb2t1cCBmYWlsdXJlLCBFbWJlciBub3QgbG9hZGVkLicpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHRyZXR1cm4gYXBpLmdldEVtYmVyKCkubG9va3VwKGxvb2t1cEZhY3RvcnkpO1xyXG59O1xyXG5cclxuYXBpLmhvb2sgPSBmdW5jdGlvbiAobG9va3VwRmFjdG9yeSwgYWN0aXZhdGVDYiwgZGVhY3RpdmF0ZUNiKSB7XHJcblx0aWYgKCFhcGkuaXNMb2FkZWQoKSkge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGYWN0b3J5IGhvb2sgZmFpbHVyZSwgRW1iZXIgbm90IGxvYWRlZC4nKTtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblx0aWYgKGhvb2tlZEZhY3Rvcmllc1tsb29rdXBGYWN0b3J5XSkge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGYWN0b3J5IGFscmVhZHkgaG9va2VkOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblx0dmFyIHJlb3Blbk9wdGlvbnMgPSB7fTtcclxuXHR2YXIgZmFjdG9yeSA9IGFwaS5sb29rdXAobG9va3VwRmFjdG9yeSk7XHJcblxyXG5cdGlmICghZmFjdG9yeSkge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGYWN0b3J5IGhvb2sgZmFpbHVyZSwgZmFjdG9yeSBub3QgZm91bmQ6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblxyXG5cdGlmIChhY3RpdmF0ZUNiKSB7XHJcblx0XHRyZW9wZW5PcHRpb25zLmFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHR0aGlzLl9zdXBlcigpO1xyXG5cdFx0XHRhY3RpdmF0ZUNiLmNhbGwodGhpcyk7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnSG9vayBydW4gb24gYWN0aXZhdGU6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdH07XHJcblx0fVxyXG5cdGlmIChkZWFjdGl2YXRlQ2IpIHtcclxuXHRcdHJlb3Blbk9wdGlvbnMuZGVhY3RpdmF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0dGhpcy5fc3VwZXIoKTtcclxuXHRcdFx0ZGVhY3RpdmF0ZUNiLmNhbGwodGhpcyk7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnSG9vayBydW4gb24gZGVhY3RpdmF0ZTogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0fTtcclxuXHR9XHJcblxyXG5cdHRyeSB7XHJcblx0XHRmYWN0b3J5LnJlb3BlbihyZW9wZW5PcHRpb25zKTtcclxuXHRcdGhvb2tlZEZhY3Rvcmllc1tsb29rdXBGYWN0b3J5XSA9IHRydWU7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9va2VkOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblx0Y2F0Y2ggKGVycikge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGYWN0b3J5IGhvb2sgZmFpbHVyZSwgdW5leHBlY3RlZCBlcnJvcjogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0bG9nZ2VyLmRlYnVnKGVycik7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG59O1xyXG5cclxuYXBpLmdldCA9IGZ1bmN0aW9uIChsb29rdXBGYWN0b3J5LCBwcm9wZXJ0eSkge1xyXG5cdGlmICghYXBpLmlzTG9hZGVkKCkpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmFjdG9yeSBnZXQgZmFpbHVyZSwgRW1iZXIgbm90IGxvYWRlZC4nKTtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblx0dmFyIHByb3BlcnRpZXMgPSBwcm9wZXJ0eS5zcGxpdCgnLicpO1xyXG5cdHZhciBnZXR0ZXIgPSBhcGkubG9va3VwKGxvb2t1cEZhY3RvcnkpO1xyXG5cclxuXHRwcm9wZXJ0aWVzLnNvbWUoZnVuY3Rpb24gKHByb3BlcnR5KSB7XHJcblx0XHQvLyBJZiBnZXR0ZXIgZmFpbHMsIGp1c3QgZXhpdCwgb3RoZXJ3aXNlLCBrZWVwIGxvb3BpbmcuXHJcblx0XHRpZiAodHlwZW9mIGdldHRlci5nZXQgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGdldHRlci5nZXQocHJvcGVydHkpICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0XHRnZXR0ZXIgPSBnZXR0ZXIuZ2V0KHByb3BlcnR5KTtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHR5cGVvZiBnZXR0ZXJbcHJvcGVydHldICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0XHRnZXR0ZXIgPSBnZXR0ZXJbcHJvcGVydHldO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGdldHRlciA9IG51bGw7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHRyZXR1cm4gZ2V0dGVyO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XHJcbiIsInZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG52YXIgYXBpID0ge307XHJcbnZhciBlbW90ZVN0b3JlID0gbmV3IEVtb3RlU3RvcmUoKTtcclxudmFyICQgPSB3aW5kb3cualF1ZXJ5O1xyXG5cclxuLyoqXHJcbiAqIFRoZSBlbnRpcmUgZW1vdGUgc3RvcmluZyBzeXN0ZW0uXHJcbiAqL1xyXG5mdW5jdGlvbiBFbW90ZVN0b3JlKCkge1xyXG5cdHZhciBnZXR0ZXJzID0ge307XHJcblx0dmFyIG5hdGl2ZUVtb3RlcyA9IHt9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXQgYSBsaXN0IG9mIHVzYWJsZSBlbW90aWNvbnMuXHJcblx0ICogQHBhcmFtICB7ZnVuY3Rpb259IFtmaWx0ZXJzXSAgICAgICBBIGZpbHRlciBtZXRob2QgdG8gbGltaXQgd2hhdCBlbW90ZXMgYXJlIHJldHVybmVkLiBQYXNzZWQgdG8gQXJyYXkjZmlsdGVyLlxyXG5cdCAqIEBwYXJhbSAge2Z1bmN0aW9ufHN0cmluZ30gW3NvcnRCeV0gSG93IHRoZSBlbW90ZXMgc2hvdWxkIGJlIHNvcnRlZC4gYGZ1bmN0aW9uYCB3aWxsIGJlIHBhc3NlZCB0byBzb3J0IHZpYSBBcnJheSNzb3J0LiBgJ2NoYW5uZWwnYCBzb3J0cyBieSBjaGFubmVsIG5hbWUsIGdsb2JhbHMgZmlyc3QuIEFsbCBvdGhlciB2YWx1ZXMgKG9yIG9taXR0ZWQpIHNvcnQgYWxwaGFudW1lcmljYWxseS5cclxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IFtyZXR1cm5UeXBlXSAgICAgIGAnb2JqZWN0J2Agd2lsbCByZXR1cm4gaW4gb2JqZWN0IGZvcm1hdCwgZS5nLiBgeydLYXBwYSc6IEVtb3RlKC4uLiksIC4uLn1gLiBBbGwgb3RoZXIgdmFsdWVzIChvciBvbWl0dGVkKSByZXR1cm4gYW4gYXJyYXkgZm9ybWF0LCBlLmcuIGBbRW1vdGUoLi4uKSwgLi4uXWAuXHJcblx0ICogQHJldHVybiB7b2JqZWN0fGFycmF5fSAgICAgICAgICAgICBTZWUgYHJldHVyblR5cGVgIHBhcmFtLlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0RW1vdGVzID0gZnVuY3Rpb24gKGZpbHRlcnMsIHNvcnRCeSwgcmV0dXJuVHlwZSkge1xyXG5cdFx0dmFyIHR3aXRjaEFwaSA9IHJlcXVpcmUoJy4vdHdpdGNoLWFwaScpO1xyXG5cclxuXHRcdC8vIEdldCBuYXRpdmUgZW1vdGVzLlxyXG5cdFx0dmFyIGVtb3RlcyA9ICQuZXh0ZW5kKHt9LCBuYXRpdmVFbW90ZXMpO1xyXG5cclxuXHRcdC8vIFBhcnNlIHRoZSBjdXN0b20gZW1vdGVzIHByb3ZpZGVkIGJ5IHRoaXJkIHBhcnR5IGFkZG9ucy5cclxuXHRcdE9iamVjdC5rZXlzKGdldHRlcnMpLmZvckVhY2goZnVuY3Rpb24gKGdldHRlck5hbWUpIHtcclxuXHRcdFx0Ly8gVHJ5IHRoZSBnZXR0ZXIuXHJcblx0XHRcdHZhciByZXN1bHRzID0gbnVsbDtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRyZXN1bHRzID0gZ2V0dGVyc1tnZXR0ZXJOYW1lXSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlcnIpIHtcclxuXHRcdFx0XHRsb2dnZXIuZGVidWcoJ0Vtb3RlIGdldHRlciBgJyArIGdldHRlck5hbWUgKyAnYCBmYWlsZWQgdW5leHBlY3RlZGx5LCBza2lwcGluZy4nLCBlcnIudG9TdHJpbmcoKSk7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheShyZXN1bHRzKSkge1xyXG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZygnRW1vdGUgZ2V0dGVyIGAnICsgZ2V0dGVyTmFtZSArICdgIG11c3QgcmV0dXJuIGFuIGFycmF5LCBza2lwcGluZy4nKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIE92ZXJyaWRlIG5hdGl2ZXMgYW5kIHByZXZpb3VzIGdldHRlcnMuXHJcblx0XHRcdHJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly8gQ3JlYXRlIHRoZSBlbW90ZS5cclxuXHRcdFx0XHRcdHZhciBpbnN0YW5jZSA9IG5ldyBFbW90ZShlbW90ZSk7XHJcblxyXG5cdFx0XHRcdFx0Ly8gRm9yY2UgdGhlIGdldHRlci5cclxuXHRcdFx0XHRcdGluc3RhbmNlLnNldEdldHRlck5hbWUoZ2V0dGVyTmFtZSk7XHJcblxyXG5cdFx0XHRcdFx0Ly8gRm9yY2UgZW1vdGVzIHdpdGhvdXQgY2hhbm5lbHMgdG8gdGhlIGdldHRlcidzIG5hbWUuXHJcblx0XHRcdFx0XHRpZiAoIWVtb3RlLmNoYW5uZWwpIHtcclxuXHRcdFx0XHRcdFx0aW5zdGFuY2Uuc2V0Q2hhbm5lbE5hbWUoZ2V0dGVyTmFtZSk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Ly8gQWRkL292ZXJyaWRlIGl0LlxyXG5cdFx0XHRcdFx0ZW1vdGVzW2luc3RhbmNlLmdldFRleHQoKV0gPSBpbnN0YW5jZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdFbW90ZSBwYXJzaW5nIGZvciBnZXR0ZXIgYCcgKyBnZXR0ZXJOYW1lICsgJ2AgZmFpbGVkLCBza2lwcGluZy4nLCBlcnIudG9TdHJpbmcoKSwgZW1vdGUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBDb3ZlcnQgdG8gYXJyYXkuXHJcblx0XHRlbW90ZXMgPSBPYmplY3Qua2V5cyhlbW90ZXMpLm1hcChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0cmV0dXJuIGVtb3Rlc1tlbW90ZV07XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBGaWx0ZXIgcmVzdWx0cy5cclxuXHRcdGlmICh0eXBlb2YgZmlsdGVycyA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRlbW90ZXMgPSBlbW90ZXMuZmlsdGVyKGZpbHRlcnMpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBSZXR1cm4gYXMgYW4gb2JqZWN0IGlmIHJlcXVlc3RlZC5cclxuXHRcdGlmIChyZXR1cm5UeXBlID09PSAnb2JqZWN0Jykge1xyXG5cdFx0XHR2YXIgYXNPYmplY3QgPSB7fTtcclxuXHRcdFx0ZW1vdGVzLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRcdFx0YXNPYmplY3RbZW1vdGUuZ2V0VGV4dCgpXSA9IGVtb3RlO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIGFzT2JqZWN0O1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFNvcnQgcmVzdWx0cy5cclxuXHRcdGlmICh0eXBlb2Ygc29ydEJ5ID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdGVtb3Rlcy5zb3J0KHNvcnRCeSk7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmIChzb3J0QnkgPT09ICdjaGFubmVsJykge1xyXG5cdFx0XHRlbW90ZXMuc29ydChzb3J0aW5nLmFsbEVtb3Rlc0NhdGVnb3J5KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRlbW90ZXMuc29ydChzb3J0aW5nLmJ5VGV4dCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gUmV0dXJuIHRoZSBlbW90ZXMgaW4gYXJyYXkgZm9ybWF0LlxyXG5cdFx0cmV0dXJuIGVtb3RlcztcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBSZWdpc3RlcnMgYSAzcmQgcGFydHkgZW1vdGUgaG9vay5cclxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWUgICBUaGUgbmFtZSBvZiB0aGUgM3JkIHBhcnR5IHJlZ2lzdGVyaW5nIHRoZSBob29rLlxyXG5cdCAqIEBwYXJhbSAge2Z1bmN0aW9ufSBnZXR0ZXIgVGhlIGZ1bmN0aW9uIGNhbGxlZCB3aGVuIGxvb2tpbmcgZm9yIGVtb3Rlcy4gTXVzdCByZXR1cm4gYW4gYXJyYXkgb2YgZW1vdGUgb2JqZWN0cywgZS5nLiBgW2Vtb3RlLCAuLi5dYC4gU2VlIEVtb3RlIGNsYXNzLlxyXG5cdCAqL1xyXG5cdHRoaXMucmVnaXN0ZXJHZXR0ZXIgPSBmdW5jdGlvbiAobmFtZSwgZ2V0dGVyKSB7XHJcblx0XHRpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignTmFtZSBtdXN0IGJlIGEgc3RyaW5nLicpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGdldHRlcnNbbmFtZV0pIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdHZXR0ZXIgYWxyZWFkeSBleGlzdHMuJyk7XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mIGdldHRlciAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0dldHRlciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XHJcblx0XHR9XHJcblx0XHRsb2dnZXIuZGVidWcoJ0dldHRlciByZWdpc3RlcmVkOiAnICsgbmFtZSk7XHJcblx0XHRnZXR0ZXJzW25hbWVdID0gZ2V0dGVyO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFJlZ2lzdGVycyBhIDNyZCBwYXJ0eSBlbW90ZSBob29rLlxyXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gbmFtZSAgIFRoZSBuYW1lIG9mIHRoZSAzcmQgcGFydHkgaG9vayB0byBkZXJlZ2lzdGVyLlxyXG5cdCAqL1xyXG5cdHRoaXMuZGVyZWdpc3RlckdldHRlciA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0dldHRlciB1bnJlZ2lzdGVyZWQ6ICcgKyBuYW1lKTtcclxuXHRcdGRlbGV0ZSBnZXR0ZXJzW25hbWVdO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEluaXRpYWxpemVzIHRoZSByYXcgZGF0YSBmcm9tIHRoZSBBUEkgZW5kcG9pbnRzLiBTaG91bGQgYmUgY2FsbGVkIGF0IGxvYWQgYW5kL29yIHdoZW5ldmVyIHRoZSBBUEkgbWF5IGhhdmUgY2hhbmdlZC4gUG9wdWxhdGVzIGludGVybmFsIG9iamVjdHMgd2l0aCB1cGRhdGVkIGRhdGEuXHJcblx0ICovXHJcblx0dGhpcy5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdTdGFydGluZyBpbml0aWFsaXphdGlvbi4nKTtcclxuXHJcblx0XHR2YXIgdHdpdGNoQXBpID0gcmVxdWlyZSgnLi90d2l0Y2gtYXBpJyk7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdFx0Ly8gSGFzaCBvZiBlbW90ZSBzZXQgdG8gZm9yY2VkIGNoYW5uZWwuXHJcblx0XHR2YXIgZm9yY2VkU2V0c1RvQ2hhbm5lbHMgPSB7XHJcblx0XHRcdC8vIEdsb2JhbHMuXHJcblx0XHRcdDA6ICd+Z2xvYmFsJyxcclxuXHRcdFx0Ly8gQnViYmxlIGVtb3Rlcy5cclxuXHRcdFx0MzM6ICd0dXJibycsXHJcblx0XHRcdC8vIE1vbmtleSBlbW90ZXMuXHJcblx0XHRcdDQyOiAndHVyYm8nLFxyXG5cdFx0XHQvLyBIaWRkZW4gdHVyYm8gZW1vdGVzLlxyXG5cdFx0XHQ0NTc6ICd0dXJibycsXHJcblx0XHRcdDc5MzogJ3R1cmJvJ1xyXG5cdFx0fTtcclxuXHJcblx0XHRsb2dnZXIuZGVidWcoJ0luaXRpYWxpemluZyBlbW90ZSBzZXQgY2hhbmdlIGxpc3RlbmVyLicpO1xyXG5cclxuXHRcdHR3aXRjaEFwaS5vbkVtb3Rlc0NoYW5nZShmdW5jdGlvbiAoZW1vdGVTZXRzKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnUGFyc2luZyBlbW90ZSBzZXRzLicpO1xyXG5cclxuXHRcdFx0T2JqZWN0LmtleXMoZW1vdGVTZXRzKS5mb3JFYWNoKGZ1bmN0aW9uIChzZXQpIHtcclxuXHRcdFx0XHR2YXIgZW1vdGVzID0gZW1vdGVTZXRzW3NldF07XHJcblx0XHRcdFx0c2V0ID0gTnVtYmVyKHNldCk7XHJcblx0XHRcdFx0ZW1vdGVzLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRcdFx0XHQvLyBTZXQgc29tZSByZXF1aXJlZCBpbmZvLlxyXG5cdFx0XHRcdFx0ZW1vdGUudXJsID0gJ2h0dHA6Ly9zdGF0aWMtY2RuLmp0dm53Lm5ldC9lbW90aWNvbnMvdjEvJyArIGVtb3RlLmlkICsgJy8xLjAnO1xyXG5cdFx0XHRcdFx0ZW1vdGUudGV4dCA9IGdldEVtb3RlRnJvbVJlZ0V4KGVtb3RlLmNvZGUpO1xyXG5cdFx0XHRcdFx0ZW1vdGUuc2V0ID0gc2V0O1xyXG5cclxuXHRcdFx0XHRcdC8vIEhhcmRjb2RlIHRoZSBjaGFubmVscyBvZiBjZXJ0YWluIHNldHMuXHJcblx0XHRcdFx0XHRpZiAoZm9yY2VkU2V0c1RvQ2hhbm5lbHNbc2V0XSkge1xyXG5cdFx0XHRcdFx0XHRlbW90ZS5jaGFubmVsID0gZm9yY2VkU2V0c1RvQ2hhbm5lbHNbc2V0XTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR2YXIgaW5zdGFuY2UgPSBuZXcgRW1vdGUoZW1vdGUpO1xyXG5cclxuXHRcdFx0XHRcdC8vIFNhdmUgdGhlIGVtb3RlIGZvciB1c2UgbGF0ZXIuXHJcblx0XHRcdFx0XHRuYXRpdmVFbW90ZXNbZW1vdGUudGV4dF0gPSBpbnN0YW5jZTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ0xvYWRpbmcgc3Vic2NyaXB0aW9uIGRhdGEuJyk7XHJcblxyXG5cdFx0XHQvLyBHZXQgYWN0aXZlIHN1YnNjcmlwdGlvbnMgdG8gZmluZCB0aGUgY2hhbm5lbHMuXHJcblx0XHRcdHR3aXRjaEFwaS5nZXRUaWNrZXRzKGZ1bmN0aW9uICh0aWNrZXRzKSB7XHJcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdUaWNrZXRzIGxvYWRlZCBmcm9tIHRoZSBBUEkuJywgdGlja2V0cyk7XHJcblx0XHRcdFx0dGlja2V0cy5mb3JFYWNoKGZ1bmN0aW9uICh0aWNrZXQpIHtcclxuXHRcdFx0XHRcdHZhciBwcm9kdWN0ID0gdGlja2V0LnByb2R1Y3Q7XHJcblx0XHRcdFx0XHR2YXIgY2hhbm5lbCA9IHByb2R1Y3Qub3duZXJfbmFtZSB8fCBwcm9kdWN0LnNob3J0X25hbWU7XHJcblxyXG5cdFx0XHRcdFx0Ly8gR2V0IHN1YnNjcmlwdGlvbnMgd2l0aCBlbW90ZXMgb25seS5cclxuXHRcdFx0XHRcdGlmICghcHJvZHVjdC5lbW90aWNvbnMgfHwgIXByb2R1Y3QuZW1vdGljb25zLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdC8vIFNldCB0aGUgY2hhbm5lbCBvbiB0aGUgZW1vdGVzLlxyXG5cdFx0XHRcdFx0cHJvZHVjdC5lbW90aWNvbnMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGluc3RhbmNlID0gbmF0aXZlRW1vdGVzW2dldEVtb3RlRnJvbVJlZ0V4KGVtb3RlLnJlZ2V4KV07XHJcblx0XHRcdFx0XHRcdGluc3RhbmNlLnNldENoYW5uZWxOYW1lKGNoYW5uZWwpO1xyXG5cdFx0XHRcdFx0XHRpbnN0YW5jZS5nZXRDaGFubmVsQmFkZ2UoKTtcclxuXHRcdFx0XHRcdFx0aW5zdGFuY2UuZ2V0Q2hhbm5lbERpc3BsYXlOYW1lKCk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LCB0cnVlKTtcclxuXHR9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzcGVjaWZpYyBlbW90ZSwgaWYgYXZhaWxhYmxlLlxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSB0byBnZXQuXHJcbiAqIEByZXR1cm4ge0Vtb3RlfG51bGx9ICAgICAgVGhlIEVtb3RlIGluc3RhbmNlIG9mIHRoZSBlbW90ZSBvciBgbnVsbGAgaWYgaXQgY291bGRuJ3QgYmUgZm91bmQuXHJcbiAqL1xyXG5FbW90ZVN0b3JlLnByb3RvdHlwZS5nZXRFbW90ZSA9IGZ1bmN0aW9uICh0ZXh0KSB7XHJcblx0cmV0dXJuIHRoaXMuZ2V0RW1vdGVzKG51bGwsIG51bGwsICdvYmplY3QnKVt0ZXh0XSB8fCBudWxsO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVtb3RlIG9iamVjdC5cclxuICogQHBhcmFtIHtvYmplY3R9IGRldGFpbHMgICAgICAgICAgICAgIE9iamVjdCBkZXNjcmliaW5nIHRoZSBlbW90ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGRldGFpbHMudGV4dCAgICAgICAgIFRoZSB0ZXh0IHRvIHVzZSBpbiB0aGUgY2hhdCBib3ggd2hlbiBlbW90ZSBpcyBjbGlja2VkLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGV0YWlscy51cmwgICAgICAgICAgVGhlIFVSTCBvZiB0aGUgaW1hZ2UgZm9yIHRoZSBlbW90ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IFtkZXRhaWxzLmJhZGdlXSAgICAgIFRoZSBVUkwgb2YgdGhlIGJhZGdlIGZvciB0aGUgZW1vdGUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZGV0YWlscy5jaGFubmVsXSAgICBUaGUgY2hhbm5lbCB0aGUgZW1vdGUgc2hvdWxkIGJlIGNhdGVnb3JpemVkIHVuZGVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RldGFpbHMuZ2V0dGVyTmFtZV0gVGhlIDNyZCBwYXJ0eSBnZXR0ZXIgdGhhdCByZWdpc3RlcmVkIHRoZSBlbW90ZS4gVXNlZCBpbnRlcm5hbGx5IG9ubHkuXHJcbiAqL1xyXG5mdW5jdGlvbiBFbW90ZShkZXRhaWxzKSB7XHJcblx0dmFyIHRleHQgPSBudWxsO1xyXG5cdHZhciB1cmwgPSBudWxsO1xyXG5cdHZhciBnZXR0ZXJOYW1lID0gbnVsbDtcclxuXHR2YXIgY2hhbm5lbCA9IHtcclxuXHRcdG5hbWU6IG51bGwsXHJcblx0XHRiYWRnZTogbnVsbFxyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIHRleHQgb2YgdGhlIGVtb3RlLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGVtb3RlIHRleHQuXHJcblx0ICovXHJcblx0dGhpcy5nZXRUZXh0ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRleHQ7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgdGV4dCBvZiB0aGUgZW1vdGUuXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRoZVRleHQgVGhlIHRleHQgdG8gc2V0LlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0VGV4dCA9IGZ1bmN0aW9uICh0aGVUZXh0KSB7XHJcblx0XHRpZiAodHlwZW9mIHRoZVRleHQgIT09ICdzdHJpbmcnIHx8IHRoZVRleHQubGVuZ3RoIDwgMSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdGV4dCcpO1xyXG5cdFx0fVxyXG5cdFx0dGV4dCA9IHRoZVRleHQ7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0cyB0aGUgZ2V0dGVyIG5hbWUgdGhpcyBlbW90ZSBiZWxvbmdzIHRvLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGdldHRlcidzIG5hbWUuXHJcblx0ICovXHJcblx0dGhpcy5nZXRHZXR0ZXJOYW1lID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIGdldHRlck5hbWU7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgZ2V0dGVyIG5hbWUgdGhpcyBlbW90ZSBiZWxvbmdzIHRvLlxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0aGVHZXR0ZXJOYW1lIFRoZSBnZXR0ZXIncyBuYW1lLlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0R2V0dGVyTmFtZSA9IGZ1bmN0aW9uICh0aGVHZXR0ZXJOYW1lKSB7XHJcblx0XHRpZiAodHlwZW9mIHRoZUdldHRlck5hbWUgIT09ICdzdHJpbmcnIHx8IHRoZUdldHRlck5hbWUubGVuZ3RoIDwgMSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZ2V0dGVyIG5hbWUnKTtcclxuXHRcdH1cclxuXHRcdGdldHRlck5hbWUgPSB0aGVHZXR0ZXJOYW1lO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGVtb3RlJ3MgaW1hZ2UgVVJMLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGVtb3RlIGltYWdlIFVSTC5cclxuXHQgKi9cclxuXHR0aGlzLmdldFVybCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB1cmw7XHJcblx0fTtcclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBlbW90ZSdzIGltYWdlIFVSTC5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlVXJsIFRoZSBpbWFnZSBVUkwgdG8gc2V0LlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0VXJsID0gZnVuY3Rpb24gKHRoZVVybCkge1xyXG5cdFx0aWYgKHR5cGVvZiB0aGVVcmwgIT09ICdzdHJpbmcnIHx8IHRoZVVybC5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBVUkwnKTtcclxuXHRcdH1cclxuXHRcdHVybCA9IHRoZVVybDtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBlbW90ZSdzIGNoYW5uZWwgbmFtZS5cclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH0gVGhlIGVtb3RlJ3MgY2hhbm5lbCBvciBgbnVsbGAgaWYgaXQgZG9lc24ndCBoYXZlIG9uZS5cclxuXHQgKi9cclxuXHR0aGlzLmdldENoYW5uZWxOYW1lID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCFjaGFubmVsLm5hbWUpIHtcclxuXHRcdFx0Y2hhbm5lbC5uYW1lID0gc3RvcmFnZS5jaGFubmVsTmFtZXMuZ2V0KHRoaXMuZ2V0VGV4dCgpKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBjaGFubmVsLm5hbWU7XHJcblx0fTtcclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBlbW90ZSdzIGNoYW5uZWwgbmFtZS5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlQ2hhbm5lbCBUaGUgY2hhbm5lbCBuYW1lIHRvIHNldC5cclxuXHQgKi9cclxuXHR0aGlzLnNldENoYW5uZWxOYW1lID0gZnVuY3Rpb24gKHRoZUNoYW5uZWwpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlQ2hhbm5lbCAhPT0gJ3N0cmluZycgfHwgdGhlQ2hhbm5lbC5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaGFubmVsJyk7XHJcblx0XHR9XHJcblx0XHRzdG9yYWdlLmNoYW5uZWxOYW1lcy5zZXQodGhpcy5nZXRUZXh0KCksIHRoZUNoYW5uZWwpO1xyXG5cdFx0Y2hhbm5lbC5uYW1lID0gdGhlQ2hhbm5lbDtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBlbW90ZSBjaGFubmVsJ3MgYmFkZ2UgaW1hZ2UgVVJMLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ3xudWxsfSBUaGUgVVJMIG9mIHRoZSBiYWRnZSBpbWFnZSBmb3IgdGhlIGVtb3RlJ3MgY2hhbm5lbCBvciBgbnVsbGAgaWYgaXQgZG9lc24ndCBoYXZlIGEgY2hhbm5lbC5cclxuXHQgKi9cclxuXHR0aGlzLmdldENoYW5uZWxCYWRnZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL3R3aXRjaC1hcGknKTtcclxuXHRcdHZhciBjaGFubmVsTmFtZSA9IHRoaXMuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHJcblx0XHQvLyBObyBjaGFubmVsLlxyXG5cdFx0aWYgKCFjaGFubmVsTmFtZSkge1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBBbHJlYWR5IGhhdmUgb25lIHByZXNldC5cclxuXHRcdGlmIChjaGFubmVsLmJhZGdlKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmJhZGdlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIENoZWNrIHN0b3JhZ2UuXHJcblx0XHRjaGFubmVsLmJhZGdlID0gc3RvcmFnZS5iYWRnZXMuZ2V0KGNoYW5uZWxOYW1lKTtcclxuXHRcdGlmIChjaGFubmVsLmJhZGdlICE9PSBudWxsKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmJhZGdlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCBmcm9tIEFQSS5cclxuXHRcdHR3aXRjaEFwaS5nZXRCYWRnZXMoY2hhbm5lbE5hbWUsIGZ1bmN0aW9uIChiYWRnZXMpIHtcclxuXHRcdFx0dmFyIGJhZGdlID0gbnVsbDtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdHZXR0aW5nIGZyZXNoIGJhZGdlIGZvciB1c2VyJywgY2hhbm5lbE5hbWUsIGJhZGdlcyk7XHJcblxyXG5cdFx0XHQvLyBTYXZlIHR1cmJvIGJhZGdlIHdoaWxlIHdlIGFyZSBoZXJlLlxyXG5cdFx0XHRpZiAoYmFkZ2VzLnR1cmJvICYmIGJhZGdlcy50dXJiby5pbWFnZSkge1xyXG5cdFx0XHRcdGJhZGdlID0gYmFkZ2VzLnR1cmJvLmltYWdlO1xyXG5cdFx0XHRcdHN0b3JhZ2UuYmFkZ2VzLnNldCgndHVyYm8nLCBiYWRnZSwgODY0MDAwMDApO1xyXG5cclxuXHRcdFx0XHQvLyBUdXJibyBpcyBhY3R1YWxseSB3aGF0IHdlIHdhbnRlZCwgc28gd2UgYXJlIGRvbmUuXHJcblx0XHRcdFx0aWYgKGNoYW5uZWxOYW1lID09PSAndHVyYm8nKSB7XHJcblx0XHRcdFx0XHRjaGFubmVsLmJhZGdlID0gYmFkZ2U7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBTYXZlIHN1YnNjcmliZXIgYmFkZ2UgaW4gc3RvcmFnZS5cclxuXHRcdFx0aWYgKGJhZGdlcy5zdWJzY3JpYmVyICYmIGJhZGdlcy5zdWJzY3JpYmVyLmltYWdlKSB7XHJcblx0XHRcdFx0Y2hhbm5lbC5iYWRnZSA9IGJhZGdlcy5zdWJzY3JpYmVyLmltYWdlO1xyXG5cdFx0XHRcdHN0b3JhZ2UuYmFkZ2VzLnNldChjaGFubmVsTmFtZSwgY2hhbm5lbC5iYWRnZSwgODY0MDAwMDApO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIE5vIHN1YnNjcmliZXIgYmFkZ2UuXHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZygnRmFpbGVkIHRvIGdldCBzdWJzY3JpYmVyIGJhZGdlLicsIGNoYW5uZWxOYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRcclxuXHRcdHJldHVybiBjaGFubmVsLmJhZGdlIHx8ICdodHRwOi8vc3RhdGljLWNkbi5qdHZudy5uZXQvanR2X3VzZXJfcGljdHVyZXMvc3Vic2NyaWJlci1zdGFyLnBuZyc7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgZW1vdGUncyBjaGFubmVsIGJhZGdlIGltYWdlIFVSTC5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlQmFkZ2UgVGhlIGJhZGdlIGltYWdlIFVSTCB0byBzZXQuXHJcblx0ICovXHJcblx0dGhpcy5zZXRDaGFubmVsQmFkZ2UgPSBmdW5jdGlvbiAodGhlQmFkZ2UpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlQmFkZ2UgIT09ICdzdHJpbmcnIHx8IHRoZUJhZGdlLmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhZGdlJyk7XHJcblx0XHR9XHJcblx0XHRjaGFubmVsLmJhZGdlID0gdGhlQmFkZ2U7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogSW5pdGlhbGl6ZSB0aGUgZGV0YWlscy5cclxuXHQgKi9cclxuXHRcclxuXHQvLyBSZXF1aXJlZCBmaWVsZHMuXHJcblx0dGhpcy5zZXRUZXh0KGRldGFpbHMudGV4dCk7XHJcblx0dGhpcy5zZXRVcmwoZGV0YWlscy51cmwpO1xyXG5cclxuXHQvLyBPcHRpb25hbCBmaWVsZHMuXHJcblx0aWYgKGRldGFpbHMuZ2V0dGVyTmFtZSkge1xyXG5cdFx0dGhpcy5zZXRHZXR0ZXJOYW1lKGRldGFpbHMuZ2V0dGVyTmFtZSk7XHJcblx0fVxyXG5cdGlmIChkZXRhaWxzLmNoYW5uZWwpIHtcclxuXHRcdHRoaXMuc2V0Q2hhbm5lbE5hbWUoZGV0YWlscy5jaGFubmVsKTtcclxuXHR9XHJcblx0aWYgKGRldGFpbHMuYmFkZ2UpIHtcclxuXHRcdHRoaXMuc2V0Q2hhbm5lbEJhZGdlKGRldGFpbHMuYmFkZ2UpO1xyXG5cdH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGF0ZSBjaGFuZ2Vycy5cclxuICovXHJcblxyXG4vKipcclxuICogVG9nZ2xlIHdoZXRoZXIgYW4gZW1vdGUgc2hvdWxkIGJlIGEgZmF2b3JpdGUuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBgdHJ1ZWAgZm9yY2VzIHRoZSBlbW90ZSB0byBiZSBhIGZhdm9yaXRlLCBgZmFsc2VgIGZvcmNlcyB0aGUgZW1vdGUgdG8gbm90IGJlIGEgZmF2b3JpdGUuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUudG9nZ2xlRmF2b3JpdGUgPSBmdW5jdGlvbiAoZm9yY2UpIHtcclxuXHRpZiAodHlwZW9mIGZvcmNlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0c3RvcmFnZS5zdGFycmVkLnNldCh0aGlzLmdldFRleHQoKSwgISFmb3JjZSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHN0b3JhZ2Uuc3RhcnJlZC5zZXQodGhpcy5nZXRUZXh0KCksICF0aGlzLmlzRmF2b3JpdGUoKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogVG9nZ2xlIHdoZXRoZXIgYW4gZW1vdGUgc2hvdWxkIGJlIHZpc2libGUgb3V0IG9mIGVkaXRpbmcgbW9kZS5cclxuICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIGB0cnVlYCBmb3JjZXMgdGhlIGVtb3RlIHRvIGJlIHZpc2libGUsIGBmYWxzZWAgZm9yY2VzIHRoZSBlbW90ZSB0byBiZSBoaWRkZW4uXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUudG9nZ2xlVmlzaWJpbGl0eSA9IGZ1bmN0aW9uIChmb3JjZSkge1xyXG5cdGlmICh0eXBlb2YgZm9yY2UgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRzdG9yYWdlLnZpc2liaWxpdHkuc2V0KHRoaXMuZ2V0VGV4dCgpLCAhIWZvcmNlKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0c3RvcmFnZS52aXNpYmlsaXR5LnNldCh0aGlzLmdldFRleHQoKSwgIXRoaXMuaXNWaXNpYmxlKCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXRlIGdldHRlcnMuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIGlzIGZyb20gYSAzcmQgcGFydHkuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIGlzIGZyb20gYSAzcmQgcGFydHkuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNUaGlyZFBhcnR5ID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiAhIXRoaXMuZ2V0R2V0dGVyTmFtZSgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIHdhcyBmYXZvcml0ZWQuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIHdhcyBmYXZvcml0ZWQuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNGYXZvcml0ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gc3RvcmFnZS5zdGFycmVkLmdldCh0aGlzLmdldFRleHQoKSwgZmFsc2UpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIGlzIHZpc2libGUgb3V0c2lkZSBvZiBlZGl0aW5nIG1vZGUuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIGlzIHZpc2libGUgb3V0c2lkZSBvZiBlZGl0aW5nIG1vZGUuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KHRoaXMuZ2V0VGV4dCgpLCB0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHRoZSBlbW90ZSBpcyBjb25zaWRlcmVkIGEgc2ltcGxlIHNtaWxleS5cclxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZW1vdGUgaXMgY29uc2lkZXJlZCBhIHNpbXBsZSBzbWlsZXkuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNTbWlsZXkgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gVGhlIGJhc2ljIHNtaWxleSBlbW90ZXMuXHJcblx0dmFyIGVtb3RlcyA9IFsnOignLCAnOiknLCAnOi8nLCAnOkQnLCAnOm8nLCAnOnAnLCAnOnonLCAnOyknLCAnO3AnLCAnPDMnLCAnPignLCAnQiknLCAnUiknLCAnb19vJywgJyMvJywgJzo3JywgJzo+JywgJzpTJywgJzxdJ107XHJcblx0cmV0dXJuIGVtb3Rlcy5pbmRleE9mKHRoaXMuZ2V0VGV4dCgpKSAhPT0gLTE7XHJcbn07XHJcblxyXG4vKipcclxuICogUHJvcGVydHkgZ2V0dGVycy9zZXR0ZXJzLlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBHZXQgYSBjaGFubmVsJ3MgZGlzcGxheSBuYW1lLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjaGFubmVsJ3MgZGlzcGxheSBuYW1lLiBNYXkgYmUgZXF1aXZhbGVudCB0byB0aGUgY2hhbm5lbCB0aGUgZmlyc3QgdGltZSB0aGUgQVBJIG5lZWRzIHRvIGJlIGNhbGxlZC5cclxuICovXHJcbkVtb3RlLnByb3RvdHlwZS5nZXRDaGFubmVsRGlzcGxheU5hbWUgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHR3aXRjaEFwaSA9IHJlcXVpcmUoJy4vdHdpdGNoLWFwaScpO1xyXG5cdHZhciBjaGFubmVsTmFtZSA9IHRoaXMuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHR2YXIgZGlzcGxheU5hbWUgPSBudWxsO1xyXG5cclxuXHR2YXIgZm9yY2VkQ2hhbm5lbFRvRGlzcGxheU5hbWVzID0ge1xyXG5cdFx0J35nbG9iYWwnOiAnR2xvYmFsJyxcclxuXHRcdCd0dXJibyc6ICdUdXJibydcclxuXHR9O1xyXG5cclxuXHQvLyBObyBjaGFubmVsLlxyXG5cdGlmICghY2hhbm5lbE5hbWUpIHtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH1cclxuXHJcblx0Ly8gRm9yY2VkIGRpc3BsYXkgbmFtZS5cclxuXHRpZiAoZm9yY2VkQ2hhbm5lbFRvRGlzcGxheU5hbWVzW2NoYW5uZWxOYW1lXSkge1xyXG5cdFx0cmV0dXJuIGZvcmNlZENoYW5uZWxUb0Rpc3BsYXlOYW1lc1tjaGFubmVsTmFtZV07XHJcblx0fVxyXG5cclxuXHQvLyBDaGVjayBzdG9yYWdlLlxyXG5cdGRpc3BsYXlOYW1lID0gc3RvcmFnZS5kaXNwbGF5TmFtZXMuZ2V0KGNoYW5uZWxOYW1lKTtcclxuXHRpZiAoZGlzcGxheU5hbWUgIT09IG51bGwpIHtcclxuXHRcdHJldHVybiBkaXNwbGF5TmFtZTtcclxuXHR9XHJcblx0Ly8gR2V0IGZyb20gQVBJLlxyXG5cdGVsc2Uge1xyXG5cdFx0dHdpdGNoQXBpLmdldFVzZXIoY2hhbm5lbE5hbWUsIGZ1bmN0aW9uICh1c2VyKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnR2V0dGluZyBmcmVzaCBkaXNwbGF5IG5hbWUgZm9yIHVzZXInLCB1c2VyKTtcclxuXHRcdFx0ZGlzcGxheU5hbWUgPSB1c2VyLmRpc3BsYXlfbmFtZTtcclxuXHRcdFx0Ly8gU2F2ZSBpbiBzdG9yYWdlLlxyXG5cdFx0XHRzdG9yYWdlLmRpc3BsYXlOYW1lcy5zZXQoY2hhbm5lbE5hbWUsIGRpc3BsYXlOYW1lLCA4NjQwMDAwMCk7XHJcblx0XHR9KTtcclxuXHR9XHJcblx0XHJcblx0cmV0dXJuIGRpc3BsYXlOYW1lIHx8IGNoYW5uZWxOYW1lO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIHVzYWJsZSBlbW90ZSB0ZXh0IGZyb20gYSByZWdleC5cclxuICovXHJcbmZ1bmN0aW9uIGdldEVtb3RlRnJvbVJlZ0V4KHJlZ2V4KSB7XHJcblx0aWYgKHR5cGVvZiByZWdleCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleCk7XHJcblx0fVxyXG5cdGlmICghcmVnZXgpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignYHJlZ2V4YCBtdXN0IGJlIGEgUmVnRXhwIHN0cmluZyBvciBvYmplY3QuJyk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZGVjb2RlVVJJKHJlZ2V4LnNvdXJjZSlcclxuXHJcblx0XHQvLyBSZXBsYWNlIEhUTUwgZW50aXR5IGJyYWNrZXRzIHdpdGggYWN0dWFsIGJyYWNrZXRzLlxyXG5cdFx0LnJlcGxhY2UoJyZndFxcXFw7JywgJz4nKVxyXG5cdFx0LnJlcGxhY2UoJyZsdFxcXFw7JywgJzwnKVxyXG5cclxuXHRcdC8vIFJlbW92ZSBuZWdhdGl2ZSBncm91cHMuXHJcblx0XHQvL1xyXG5cdFx0Ly8gL1xyXG5cdFx0Ly8gICBcXChcXD8hICAgICAgICAgICAgICAvLyAoPyFcclxuXHRcdC8vICAgW14pXSogICAgICAgICAgICAgIC8vIGFueSBhbW91bnQgb2YgY2hhcmFjdGVycyB0aGF0IGFyZSBub3QgKVxyXG5cdFx0Ly8gICBcXCkgICAgICAgICAgICAgICAgIC8vIClcclxuXHRcdC8vIC9nXHJcblx0XHQucmVwbGFjZSgvXFwoXFw/IVteKV0qXFwpL2csICcnKVxyXG5cclxuXHRcdC8vIFBpY2sgZmlyc3Qgb3B0aW9uIGZyb20gYSBncm91cC5cclxuXHRcdC8vXHJcblx0XHQvLyAvXHJcblx0XHQvLyAgIFxcKCAgICAgICAgICAgICAgICAgLy8gKFxyXG5cdFx0Ly8gICAoW158XSkqICAgICAgICAgICAgLy8gYW55IGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCB8XHJcblx0XHQvLyAgIFxcfD8gICAgICAgICAgICAgICAgLy8gYW4gb3B0aW9uYWwgfCBjaGFyYWN0ZXJcclxuXHRcdC8vICAgW14pXSogICAgICAgICAgICAgIC8vIGFueSBhbW91bnQgb2YgY2hhcmFjdGVycyB0aGF0IGFyZSBub3QgKVxyXG5cdFx0Ly8gICBcXCkgICAgICAgICAgICAgICAgIC8vIClcclxuXHRcdC8vIC9nXHJcblx0XHQucmVwbGFjZSgvXFwoKFtefF0pKlxcfD9bXildKlxcKS9nLCAnJDEnKVxyXG5cclxuXHRcdC8vIFBpY2sgZmlyc3QgY2hhcmFjdGVyIGZyb20gYSBjaGFyYWN0ZXIgZ3JvdXAuXHJcblx0XHQvL1xyXG5cdFx0Ly8gL1xyXG5cdFx0Ly8gICBcXFsgICAgICAgICAgICAgICAgIC8vIFtcclxuXHRcdC8vICAgKFtefF0pKiAgICAgICAgICAgIC8vIGFueSBhbW91bnQgb2YgY2hhcmFjdGVycyB0aGF0IGFyZSBub3QgfFxyXG5cdFx0Ly8gICBcXHw/ICAgICAgICAgICAgICAgIC8vIGFuIG9wdGlvbmFsIHwgY2hhcmFjdGVyXHJcblx0XHQvLyAgIFteXFxdXSogICAgICAgICAgICAgLy8gYW55IGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCBdXHJcblx0XHQvLyAgIFxcXSAgICAgICAgICAgICAgICAgLy8gXVxyXG5cdFx0Ly8gL2dcclxuXHRcdC5yZXBsYWNlKC9cXFsoW158XSkqXFx8P1teXFxdXSpcXF0vZywgJyQxJylcclxuXHJcblx0XHQvLyBSZW1vdmUgb3B0aW9uYWwgY2hhcmFjdGVycy5cclxuXHRcdC8vXHJcblx0XHQvLyAvXHJcblx0XHQvLyAgIFteXFxcXF0gICAgICAgICAgICAgIC8vIGFueSBjaGFyYWN0ZXIgdGhhdCBpcyBub3QgXFxcclxuXHRcdC8vICAgXFw/ICAgICAgICAgICAgICAgICAvLyA/XHJcblx0XHQvLyAvZ1xyXG5cdFx0LnJlcGxhY2UoL1teXFxcXF1cXD8vZywgJycpXHJcblxyXG5cdFx0Ly8gUmVtb3ZlIGJvdW5kYXJpZXMgYXQgYmVnaW5uaW5nIGFuZCBlbmQuXHJcblx0XHQucmVwbGFjZSgvXlxcXFxifFxcXFxiJC9nLCAnJykgXHJcblxyXG5cdFx0Ly8gVW5lc2NhcGUgb25seSBzaW5nbGUgYmFja3NsYXNoLCBub3QgbXVsdGlwbGUuXHJcblx0XHQvL1xyXG5cdFx0Ly8gL1xyXG5cdFx0Ly8gICBcXFxcICAgICAgICAgICAgICAgICAvLyBcXFxyXG5cdFx0Ly8gICAoPyFcXFxcKSAgICAgICAgICAgICAvLyBsb29rLWFoZWFkLCBhbnkgY2hhcmFjdGVyIHRoYXQgaXNuJ3QgXFxcclxuXHRcdC8vIC9nXHJcblx0XHQucmVwbGFjZSgvXFxcXCg/IVxcXFwpL2csICcnKTtcclxufVxyXG5cclxudmFyIHNvcnRpbmcgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBTb3J0IGJ5IGFscGhhbnVtZXJpYyBpbiB0aGlzIG9yZGVyOiBzeW1ib2xzIC0+IG51bWJlcnMgLT4gQWFCYi4uLiAtPiBudW1iZXJzXHJcbiAqL1xyXG5zb3J0aW5nLmJ5VGV4dCA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcblx0dGV4dEEgPSBhLmdldFRleHQoKS50b0xvd2VyQ2FzZSgpO1xyXG5cdHRleHRCID0gYi5nZXRUZXh0KCkudG9Mb3dlckNhc2UoKTtcclxuXHJcblx0aWYgKHRleHRBIDwgdGV4dEIpIHtcclxuXHRcdHJldHVybiAtMTtcclxuXHR9XHJcblx0aWYgKHRleHRBID4gdGV4dEIpIHtcclxuXHRcdHJldHVybiAxO1xyXG5cdH1cclxuXHRyZXR1cm4gMDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEJhc2ljIHNtaWxpZXMgYmVmb3JlIG5vbi1iYXNpYyBzbWlsaWVzLlxyXG4gKi9cclxuc29ydGluZy5ieVNtaWxleSA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcblx0aWYgKGEuaXNTbWlsZXkoKSAmJlx0IWIuaXNTbWlsZXkoKSkge1xyXG5cdFx0cmV0dXJuIC0xO1xyXG5cdH1cclxuXHRpZiAoYi5pc1NtaWxleSgpICYmXHQhYS5pc1NtaWxleSgpKSB7XHJcblx0XHRyZXR1cm4gMTtcclxuXHR9XHJcblx0cmV0dXJuIDA7XHJcbn07XHJcblxyXG4vKipcclxuICogR2xvYmFscyBiZWZvcmUgc3Vic2NyaXB0aW9uIGVtb3Rlcywgc3Vic2NyaXB0aW9ucyBpbiBhbHBoYWJldGljYWwgb3JkZXIuXHJcbiAqL1xyXG5zb3J0aW5nLmJ5Q2hhbm5lbE5hbWUgPSBmdW5jdGlvbiAoYSwgYikge1xyXG5cdHZhciBjaGFubmVsQSA9IGEuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHR2YXIgY2hhbm5lbEIgPSBiLmdldENoYW5uZWxOYW1lKCk7XHJcblxyXG5cdC8vIEJvdGggZG9uJ3QgaGF2ZSBjaGFubmVscy5cclxuXHRpZiAoIWNoYW5uZWxBICYmICFjaGFubmVsQikge1xyXG5cdFx0cmV0dXJuIDA7XHJcblx0fVxyXG5cclxuXHQvLyBcIkFcIiBoYXMgY2hhbm5lbCwgXCJCXCIgZG9lc24ndC5cclxuXHRpZiAoY2hhbm5lbEEgJiYgIWNoYW5uZWxCKSB7XHJcblx0XHRyZXR1cm4gMTtcclxuXHR9XHJcblx0Ly8gXCJCXCIgaGFzIGNoYW5uZWwsIFwiQVwiIGRvZXNuJ3QuXHJcblx0aWYgKGNoYW5uZWxCICYmICFjaGFubmVsQSkge1xyXG5cdFx0cmV0dXJuIC0xO1xyXG5cdH1cclxuXHJcblx0Y2hhbm5lbEEgPSBjaGFubmVsQS50b0xvd2VyQ2FzZSgpO1xyXG5cdGNoYW5uZWxCID0gY2hhbm5lbEIudG9Mb3dlckNhc2UoKTtcclxuXHJcblx0aWYgKGNoYW5uZWxBIDwgY2hhbm5lbEIpIHtcclxuXHRcdHJldHVybiAtMTtcclxuXHR9XHJcblx0aWYgKGNoYW5uZWxCID4gY2hhbm5lbEEpIHtcclxuXHRcdHJldHVybiAxO1xyXG5cdH1cclxuXHJcblx0Ly8gQWxsIHRoZSBzYW1lXHJcblx0cmV0dXJuIDA7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhlIGdlbmVyYWwgc29ydCBvcmRlciBmb3IgdGhlIGFsbCBlbW90ZXMgY2F0ZWdvcnkuXHJcbiAqIFNtaWxleXMgLT4gQ2hhbm5lbCBncm91cGluZyAtPiBhbHBoYW51bWVyaWNcclxuICovXHJcbnNvcnRpbmcuYWxsRW1vdGVzQ2F0ZWdvcnkgPSBmdW5jdGlvbiAoYSwgYikge1xyXG5cdHZhciBieVNtaWxleSA9IHNvcnRpbmcuYnlTbWlsZXkoYSwgYik7XHJcblx0dmFyIGJ5Q2hhbm5lbE5hbWUgID0gc29ydGluZy5ieUNoYW5uZWxOYW1lKGEsIGIpO1xyXG5cdHZhciBieVRleHQgPSBzb3J0aW5nLmJ5VGV4dChhLCBiKTtcclxuXHJcblx0aWYgKGJ5U21pbGV5ICE9PSAwKSB7XHJcblx0XHRyZXR1cm4gYnlTbWlsZXk7XHJcblx0fVxyXG5cdGlmIChieUNoYW5uZWxOYW1lICE9PSAwKSB7XHJcblx0XHRyZXR1cm4gYnlDaGFubmVsTmFtZTtcclxuXHR9XHJcblx0cmV0dXJuIGJ5VGV4dDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZW1vdGVTdG9yZTtcclxuIiwidmFyIGFwaSA9IHt9O1xyXG52YXIgcHJlZml4ID0gJ1tFbW90ZSBNZW51XSAnO1xyXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG5cclxuYXBpLmxvZyA9IGZ1bmN0aW9uICgpIHtcclxuXHRpZiAodHlwZW9mIGNvbnNvbGUubG9nID09PSAndW5kZWZpbmVkJykge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRhcmd1bWVudHMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykubWFwKGZ1bmN0aW9uIChhcmcpIHtcclxuXHRcdGlmICh0eXBlb2YgYXJnICE9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBhcmc7XHJcblx0fSk7XHJcblx0YXJndW1lbnRzLnVuc2hpZnQocHJlZml4KTtcclxuXHRjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxuYXBpLmRlYnVnID0gZnVuY3Rpb24gKCkge1xyXG5cdGlmICghc3RvcmFnZS5nbG9iYWwuZ2V0KCdkZWJ1Z01lc3NhZ2VzRW5hYmxlZCcsIGZhbHNlKSkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRhcmd1bWVudHMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcblx0YXJndW1lbnRzLnVuc2hpZnQoJ1tERUJVR10gJyk7XHJcblx0YXBpLmxvZy5hcHBseShudWxsLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwidmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XHJcbnZhciBlbW90ZXMgPSByZXF1aXJlKCcuL2Vtb3RlcycpO1xyXG52YXIgYXBpID0ge307XHJcblxyXG5hcGkudG9nZ2xlRGVidWcgPSBmdW5jdGlvbiAoZm9yY2VkKSB7XHJcblx0aWYgKHR5cGVvZiBmb3JjZWQgPT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRmb3JjZWQgPSAhc3RvcmFnZS5nbG9iYWwuZ2V0KCdkZWJ1Z01lc3NhZ2VzRW5hYmxlZCcsIGZhbHNlKTtcclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHRmb3JjZWQgPSAhIWZvcmNlZDtcclxuXHR9XHJcblx0c3RvcmFnZS5nbG9iYWwuc2V0KCdkZWJ1Z01lc3NhZ2VzRW5hYmxlZCcsIGZvcmNlZCk7XHJcblx0bG9nZ2VyLmxvZygnRGVidWcgbWVzc2FnZXMgYXJlIG5vdyAnICsgKGZvcmNlZCA/ICdlbmFibGVkJyA6ICdkaXNhYmxlZCcpKTtcclxufTtcclxuXHJcbmFwaS5yZWdpc3RlckVtb3RlR2V0dGVyID0gZW1vdGVzLnJlZ2lzdGVyR2V0dGVyO1xyXG5hcGkuZGVyZWdpc3RlckVtb3RlR2V0dGVyID0gZW1vdGVzLmRlcmVnaXN0ZXJHZXR0ZXI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwidmFyIFN0b3JlID0gcmVxdWlyZSgnc3RvcmFnZS13cmFwcGVyJyk7XHJcbnZhciBzdG9yYWdlID0ge307XHJcblxyXG4vLyBHZW5lcmFsIHN0b3JhZ2UuXHJcbnN0b3JhZ2UuZ2xvYmFsID0gbmV3IFN0b3JlKHtcclxuXHRuYW1lc3BhY2U6ICdlbW90ZS1tZW51LWZvci10d2l0Y2gnXHJcbn0pO1xyXG5cclxuLy8gRW1vdGUgdmlzaWJpbGl0eSBzdG9yYWdlLlxyXG5zdG9yYWdlLnZpc2liaWxpdHkgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgndmlzaWJpbGl0eScpO1xyXG4vLyBFbW90ZSBzdGFycmVkIHN0b3JhZ2UuXHJcbnN0b3JhZ2Uuc3RhcnJlZCA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCdzdGFycmVkJyk7XHJcbi8vIERpc3BsYXkgbmFtZSBzdG9yYWdlLlxyXG5zdG9yYWdlLmRpc3BsYXlOYW1lcyA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCdkaXNwbGF5TmFtZXMnKTtcclxuLy8gQ2hhbm5lbCBuYW1lIHN0b3JhZ2UuXHJcbnN0b3JhZ2UuY2hhbm5lbE5hbWVzID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ2NoYW5uZWxOYW1lcycpO1xyXG4vLyBCYWRnZXMgc3RvcmFnZS5cclxuc3RvcmFnZS5iYWRnZXMgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgnYmFkZ2VzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHN0b3JhZ2U7XHJcbiIsInZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuLi8uLi9idWlsZC90ZW1wbGF0ZXMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgZGF0YSA9IHt9O1xyXG5cdHZhciBrZXkgPSBudWxsO1xyXG5cclxuXHQvLyBDb252ZXJ0IHRlbXBsYXRlcyB0byB0aGVpciBzaG9ydGVyIFwicmVuZGVyXCIgZm9ybS5cclxuXHRmb3IgKGtleSBpbiB0ZW1wbGF0ZXMpIHtcclxuXHRcdGlmICghdGVtcGxhdGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHRcdFx0Y29udGludWU7XHJcblx0XHR9XHJcblx0XHRkYXRhW2tleV0gPSByZW5kZXIoa2V5KTtcclxuXHR9XHJcblxyXG5cdC8vIFNob3J0Y3V0IHRoZSByZW5kZXIgZnVuY3Rpb24uIEFsbCB0ZW1wbGF0ZXMgd2lsbCBiZSBwYXNzZWQgaW4gYXMgcGFydGlhbHMgYnkgZGVmYXVsdC5cclxuXHRmdW5jdGlvbiByZW5kZXIodGVtcGxhdGUpIHtcclxuXHRcdHRlbXBsYXRlID0gdGVtcGxhdGVzW3RlbXBsYXRlXTtcclxuXHRcdHJldHVybiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzIHx8IHRlbXBsYXRlcywgaW5kZW50KTtcclxuXHRcdH07XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZGF0YTtcclxufSkoKTtcclxuIiwidmFyIHR3aXRjaEFwaSA9IHdpbmRvdy5Ud2l0Y2guYXBpO1xyXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKTtcclxudmFyIGFwaSA9IHt9O1xyXG5cclxuYXBpLmdldEJhZGdlcyA9IGZ1bmN0aW9uICh1c2VybmFtZSwgY2FsbGJhY2spIHtcclxuXHQvLyBOb3RlOiBub3QgYSBkb2N1bWVudGVkIEFQSSBlbmRwb2ludC5cclxuXHR0d2l0Y2hBcGkuZ2V0KCdjaGF0LycgKyB1c2VybmFtZSArICcvYmFkZ2VzJylcclxuXHRcdC5kb25lKGZ1bmN0aW9uIChhcGkpIHtcclxuXHRcdFx0Y2FsbGJhY2soYXBpKTtcclxuXHRcdH0pXHJcblx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGNhbGxiYWNrKHt9KTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxuYXBpLmdldFVzZXIgPSBmdW5jdGlvbiAodXNlcm5hbWUsIGNhbGxiYWNrKSB7XHJcblx0Ly8gTm90ZTogbm90IGEgZG9jdW1lbnRlZCBBUEkgZW5kcG9pbnQuXHJcblx0dHdpdGNoQXBpLmdldCgndXNlcnMvJyArIHVzZXJuYW1lKVxyXG5cdFx0LmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0XHRjYWxsYmFjayhhcGkpO1xyXG5cdFx0fSlcclxuXHRcdC5mYWlsKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Y2FsbGJhY2soe30pO1xyXG5cdFx0fSk7XHJcbn07XHJcblxyXG5hcGkuZ2V0VGlja2V0cyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG5cdC8vIE5vdGU6IG5vdCBhIGRvY3VtZW50ZWQgQVBJIGVuZHBvaW50LlxyXG5cdHR3aXRjaEFwaS5nZXQoXHJcblx0XHQnL2FwaS91c2Vycy86bG9naW4vdGlja2V0cycsXHJcblx0XHR7XHJcblx0XHRcdG9mZnNldDogMCxcclxuXHRcdFx0bGltaXQ6IDEwMCxcclxuXHRcdFx0dW5lbmRlZDogdHJ1ZVxyXG5cdFx0fVxyXG5cdClcclxuXHRcdC5kb25lKGZ1bmN0aW9uIChhcGkpIHtcclxuXHRcdFx0Y2FsbGJhY2soYXBpLnRpY2tldHMgfHwgW10pO1xyXG5cdFx0fSlcclxuXHRcdC5mYWlsKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Y2FsbGJhY2soW10pO1xyXG5cdFx0fSk7XHJcbn07XHJcblxyXG5hcGkub25FbW90ZXNDaGFuZ2UgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGltbWVkaWF0ZSkge1xyXG5cdHZhciBlbWJlciA9IHJlcXVpcmUoJy4vZW1iZXItYXBpJyk7XHJcblx0dmFyIHNlc3Npb24gPSBlbWJlci5nZXQoJ2NvbnRyb2xsZXI6Y2hhdCcsICdjdXJyZW50Um9vbS50bWlSb29tLnNlc3Npb24nKTtcclxuXHR2YXIgcmVzcG9uc2UgPSBudWxsO1xyXG5cclxuXHRpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ2BjYWxsYmFja2AgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG5cdH1cclxuXHJcblx0Ly8gTm8gcGFyc2VyIG9yIG5vIGVtb3RlcyBsb2FkZWQgeWV0LCB0cnkgYWdhaW4uXHJcblx0aWYgKCFzZXNzaW9uKSB7XHJcblx0XHRzZXRUaW1lb3V0KGFwaS5vbkVtb3Rlc0NoYW5nZSwgMTAwLCBjYWxsYmFjaywgaW1tZWRpYXRlKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8vIENhbGwgdGhlIGNhbGxiYWNrIGltbWVkaWF0ZWx5IG9uIHJlZ2lzdGVyaW5nLlxyXG5cdGlmIChpbW1lZGlhdGUpIHtcclxuXHRcdHJlc3BvbnNlID0gc2Vzc2lvbi5nZXRFbW90ZXMoKTtcclxuXHRcdGlmICghcmVzcG9uc2UgfHwgIXJlc3BvbnNlLmVtb3RpY29uX3NldHMpIHtcclxuXHRcdFx0c2V0VGltZW91dChhcGkub25FbW90ZXNDaGFuZ2UsIDEwMCwgY2FsbGJhY2ssIGltbWVkaWF0ZSk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRjYWxsYmFjayhyZXNwb25zZS5lbW90aWNvbl9zZXRzKTtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnQ2FsbGVkIGVtb3RlIGNoYW5nZSBoYW5kbGVyIGltbWVkaWF0ZWx5LicpO1xyXG5cdH1cclxuXHJcblx0Ly8gTGlzdGVuIGZvciB0aGUgZXZlbnQuXHJcblx0c2Vzc2lvbi5fZW1vdGVzUGFyc2VyLm9uKCdlbW90ZXNfY2hhbmdlZCcsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG5cdFx0Y2FsbGJhY2socmVzcG9uc2UuZW1vdGljb25fc2V0cyk7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0NhbGxlZCBlbW90ZSBjaGFuZ2UgaGFuZGxlci4nKVxyXG5cdH0pO1xyXG5cdGxvZ2dlci5kZWJ1ZygnUmVnaXN0ZXJlZCBsaXN0ZW5lciBmb3IgZW1vdGUgY2hhbmdlcy4nKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXBpO1xyXG4iLCIoZnVuY3Rpb24gKCQpIHtcclxuXHQkLmZuLnJlc2l6YWJsZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0XHR2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7XHJcblx0XHRcdGFsc29SZXNpemU6IG51bGwsXHJcblx0XHRcdGFsc29SZXNpemVUeXBlOiAnYm90aCcsIC8vIGBoZWlnaHRgLCBgd2lkdGhgLCBgYm90aGBcclxuXHRcdFx0Y29udGFpbm1lbnQ6IG51bGwsXHJcblx0XHRcdGNyZWF0ZTogbnVsbCxcclxuXHRcdFx0ZGVzdHJveTogbnVsbCxcclxuXHRcdFx0aGFuZGxlOiAnLnJlc2l6ZS1oYW5kbGUnLFxyXG5cdFx0XHRtYXhIZWlnaHQ6IDk5OTksXHJcblx0XHRcdG1heFdpZHRoOiA5OTk5LFxyXG5cdFx0XHRtaW5IZWlnaHQ6IDAsXHJcblx0XHRcdG1pbldpZHRoOiAwLFxyXG5cdFx0XHRyZXNpemU6IG51bGwsXHJcblx0XHRcdHJlc2l6ZU9uY2U6IG51bGwsXHJcblx0XHRcdHNuYXBTaXplOiAxLFxyXG5cdFx0XHRzdGFydDogbnVsbCxcclxuXHRcdFx0c3RvcDogbnVsbFxyXG5cdFx0fSwgb3B0aW9ucyk7XHJcblxyXG5cdFx0c2V0dGluZ3MuZWxlbWVudCA9ICQodGhpcyk7XHJcblxyXG5cdFx0ZnVuY3Rpb24gcmVjYWxjdWxhdGVTaXplKGV2dCkge1xyXG5cdFx0XHR2YXIgZGF0YSA9IGV2dC5kYXRhLFxyXG5cdFx0XHRcdHJlc2l6ZWQgPSB7fTtcclxuXHRcdFx0ZGF0YS5kaWZmWCA9IE1hdGgucm91bmQoKGV2dC5wYWdlWCAtIGRhdGEucGFnZVgpIC8gc2V0dGluZ3Muc25hcFNpemUpICogc2V0dGluZ3Muc25hcFNpemU7XHJcblx0XHRcdGRhdGEuZGlmZlkgPSBNYXRoLnJvdW5kKChldnQucGFnZVkgLSBkYXRhLnBhZ2VZKSAvIHNldHRpbmdzLnNuYXBTaXplKSAqIHNldHRpbmdzLnNuYXBTaXplO1xyXG5cdFx0XHRpZiAoTWF0aC5hYnMoZGF0YS5kaWZmWCkgPiAwIHx8IE1hdGguYWJzKGRhdGEuZGlmZlkpID4gMCkge1xyXG5cdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KCkgIT09IGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSAmJlxyXG5cdFx0XHRcdFx0ZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZID49IHNldHRpbmdzLm1pbkhlaWdodCAmJlxyXG5cdFx0XHRcdFx0ZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZIDw9IHNldHRpbmdzLm1heEhlaWdodCAmJlxyXG5cdFx0XHRcdFx0KHNldHRpbmdzLmNvbnRhaW5tZW50ID8gZGF0YS5vdXRlckhlaWdodCArIGRhdGEuZGlmZlkgKyBkYXRhLm9mZnNldC50b3AgPD0gc2V0dGluZ3MuY29udGFpbm1lbnQub2Zmc2V0KCkudG9wICsgc2V0dGluZ3MuY29udGFpbm1lbnQub3V0ZXJIZWlnaHQoKSA6IHRydWUpXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LmhlaWdodChkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkpO1xyXG5cdFx0XHRcdFx0cmVzaXplZC5oZWlnaHQgPSB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LndpZHRoKCkgIT09IGRhdGEud2lkdGggKyBkYXRhLmRpZmZYICYmXHJcblx0XHRcdFx0XHRkYXRhLndpZHRoICsgZGF0YS5kaWZmWCA+PSBzZXR0aW5ncy5taW5XaWR0aCAmJlxyXG5cdFx0XHRcdFx0ZGF0YS53aWR0aCArIGRhdGEuZGlmZlggPD0gc2V0dGluZ3MubWF4V2lkdGggJiZcclxuXHRcdFx0XHRcdChzZXR0aW5ncy5jb250YWlubWVudCA/IGRhdGEub3V0ZXJXaWR0aCArIGRhdGEuZGlmZlggKyBkYXRhLm9mZnNldC5sZWZ0IDw9IHNldHRpbmdzLmNvbnRhaW5tZW50Lm9mZnNldCgpLmxlZnQgKyBzZXR0aW5ncy5jb250YWlubWVudC5vdXRlcldpZHRoKCkgOiB0cnVlKVxyXG5cdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC53aWR0aChkYXRhLndpZHRoICsgZGF0YS5kaWZmWCk7XHJcblx0XHRcdFx0XHRyZXNpemVkLndpZHRoID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHJlc2l6ZWQuaGVpZ2h0IHx8IHJlc2l6ZWQud2lkdGgpIHtcclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5yZXNpemVPbmNlKSB7XHJcblx0XHRcdFx0XHRcdHNldHRpbmdzLnJlc2l6ZU9uY2UuYmluZChzZXR0aW5ncy5lbGVtZW50KShldnQuZGF0YSk7XHJcblx0XHRcdFx0XHRcdHNldHRpbmdzLnJlc2l6ZU9uY2UgPSBudWxsO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLnJlc2l6ZSkge1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemUuYmluZChzZXR0aW5ncy5lbGVtZW50KShldnQuZGF0YSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZSkge1xyXG5cdFx0XHRcdFx0XHRpZiAocmVzaXplZC5oZWlnaHQgJiYgKHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnaGVpZ2h0JyB8fCBzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ2JvdGgnKSkge1xyXG5cdFx0XHRcdFx0XHRcdHNldHRpbmdzLmFsc29SZXNpemUuaGVpZ2h0KGRhdGEuYWxzb1Jlc2l6ZUhlaWdodCArIGRhdGEuZGlmZlkpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGlmIChyZXNpemVkLndpZHRoICYmIChzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ3dpZHRoJyB8fCBzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ2JvdGgnKSkge1xyXG5cdFx0XHRcdFx0XHRcdHNldHRpbmdzLmFsc29SZXNpemUud2lkdGgoZGF0YS5hbHNvUmVzaXplV2lkdGggKyBkYXRhLmRpZmZYKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHN0YXJ0KGV2dCkge1xyXG5cdFx0XHRldnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0aWYgKHNldHRpbmdzLnN0YXJ0KSB7XHJcblx0XHRcdFx0c2V0dGluZ3Muc3RhcnQuYmluZChzZXR0aW5ncy5lbGVtZW50KSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHZhciBkYXRhID0ge1xyXG5cdFx0XHRcdGFsc29SZXNpemVIZWlnaHQ6IHNldHRpbmdzLmFsc29SZXNpemUgPyBzZXR0aW5ncy5hbHNvUmVzaXplLmhlaWdodCgpIDogMCxcclxuXHRcdFx0XHRhbHNvUmVzaXplV2lkdGg6IHNldHRpbmdzLmFsc29SZXNpemUgPyBzZXR0aW5ncy5hbHNvUmVzaXplLndpZHRoKCkgOiAwLFxyXG5cdFx0XHRcdGhlaWdodDogc2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoKSxcclxuXHRcdFx0XHRvZmZzZXQ6IHNldHRpbmdzLmVsZW1lbnQub2Zmc2V0KCksXHJcblx0XHRcdFx0b3V0ZXJIZWlnaHQ6IHNldHRpbmdzLmVsZW1lbnQub3V0ZXJIZWlnaHQoKSxcclxuXHRcdFx0XHRvdXRlcldpZHRoOiBzZXR0aW5ncy5lbGVtZW50Lm91dGVyV2lkdGgoKSxcclxuXHRcdFx0XHRwYWdlWDogZXZ0LnBhZ2VYLFxyXG5cdFx0XHRcdHBhZ2VZOiBldnQucGFnZVksXHJcblx0XHRcdFx0d2lkdGg6IHNldHRpbmdzLmVsZW1lbnQud2lkdGgoKVxyXG5cdFx0XHR9O1xyXG5cdFx0XHQkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlJywgJyonLCBkYXRhLCByZWNhbGN1bGF0ZVNpemUpO1xyXG5cdFx0XHQkKGRvY3VtZW50KS5vbignbW91c2V1cCcsICcqJywgc3RvcCk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gc3RvcCgpIHtcclxuXHRcdFx0aWYgKHNldHRpbmdzLnN0b3ApIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5zdG9wLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZScsICcqJywgcmVjYWxjdWxhdGVTaXplKTtcclxuXHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgJyonLCBzdG9wKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoc2V0dGluZ3MuaGFuZGxlKSB7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5hbHNvUmVzaXplICYmIFsnYm90aCcsICdoZWlnaHQnLCAnd2lkdGgnXS5pbmRleE9mKHNldHRpbmdzLmFsc29SZXNpemVUeXBlKSA+PSAwKSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZSA9ICQoc2V0dGluZ3MuYWxzb1Jlc2l6ZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHNldHRpbmdzLmNvbnRhaW5tZW50KSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuY29udGFpbm1lbnQgPSAkKHNldHRpbmdzLmNvbnRhaW5tZW50KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRzZXR0aW5ncy5oYW5kbGUgPSAkKHNldHRpbmdzLmhhbmRsZSk7XHJcblx0XHRcdHNldHRpbmdzLnNuYXBTaXplID0gc2V0dGluZ3Muc25hcFNpemUgPCAxID8gMSA6IHNldHRpbmdzLnNuYXBTaXplO1xyXG5cclxuXHRcdFx0aWYgKG9wdGlvbnMgPT09ICdkZXN0cm95Jykge1xyXG5cdFx0XHRcdHNldHRpbmdzLmhhbmRsZS5vZmYoJ21vdXNlZG93bicsIHN0YXJ0KTtcclxuXHJcblx0XHRcdFx0aWYgKHNldHRpbmdzLmRlc3Ryb3kpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmRlc3Ryb3kuYmluZCh0aGlzKSgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0c2V0dGluZ3MuaGFuZGxlLm9uKCdtb3VzZWRvd24nLCBzdGFydCk7XHJcblxyXG5cdFx0XHRpZiAoc2V0dGluZ3MuY3JlYXRlKSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuY3JlYXRlLmJpbmQodGhpcykoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcclxufSkoalF1ZXJ5KTtcclxuIl19
