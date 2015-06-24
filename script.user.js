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
		if (emote.getChannelName() && !emote.isSmiley()) {
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

		logger.debug('Initializing emote set change listener.');

		twitchApi.onEmotesChange(function (emoteSets) {
			logger.debug('Parsing emote sets.');

			Object.keys(emoteSets).forEach(function (set) {
				var emotes = emoteSets[set];
				emotes.forEach(function (emote) {
					// Set some required info.
					emote.url = 'http://static-cdn.jtvnw.net/emoticons/v1/' + emote.id + '/1.0';
					emote.text = getEmoteFromRegEx(emote.code);
					emote.set = set;

					// Force turbo channel for easter-egg sets.
					if (['457', '793'].indexOf(set) >= 0) {
						emote.channel = 'turbo';
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

	// No channel.
	if (!channelName) {
		return null;
	}

	// Check storage.
	displayName = storage.displayNames.get(channelName);
	if (displayName !== null) {
		return displayName;
	}

	// Turbo-specific display name.
	if (channelName === 'turbo') {
		displayName = 'Turbo';
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
 * @attribute http://userscripts.org/scripts/show/160183 (adaption)
 */
function getEmoteFromRegEx(regex) {
	if (typeof regex === 'string') {
		regex = new RegExp(regex);
	}
	if (!regex) {
		throw new Error('`regex` must be a RegExp string or object.');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxVc2Vyc1xcQ2xldHVzXFxQcm9qZWN0c1xcVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIi4vc3JjL3NjcmlwdC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvYnVpbGQvc3R5bGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9ob2dhbi5qcy9saWIvdGVtcGxhdGUuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9qcXVlcnktY3VzdG9tLXNjcm9sbGJhci9qcXVlcnkuY3VzdG9tLXNjcm9sbGJhci5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL3N0b3JhZ2Utd3JhcHBlci9pbmRleC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvcGFja2FnZS5qc29uIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy9lbWJlci1hcGkuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL2Vtb3Rlcy5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvbG9nZ2VyLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy9wdWJsaWMtYXBpLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy9zdG9yYWdlLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL3R3aXRjaC1hcGkuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9wbHVnaW5zL3Jlc2l6YWJsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDendCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2psQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi9tb2R1bGVzL3RlbXBsYXRlcycpO1xyXG52YXIgcGtnID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJyk7XHJcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9tb2R1bGVzL3N0b3JhZ2UnKTtcclxudmFyIHB1YmxpY0FwaSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9wdWJsaWMtYXBpJyk7XHJcbnZhciBlbWJlciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9lbWJlci1hcGknKTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnZXInKTtcclxuXHJcbnZhciAkID0gbnVsbDtcclxudmFyIGpRdWVyeSA9IG51bGw7XHJcblxyXG4vLyBFeHBvc2UgcHVibGljIGFwaS5cclxuaWYgKHR5cGVvZiB3aW5kb3cuZW1vdGVNZW51ID09PSAndW5kZWZpbmVkJykge1xyXG5cdHdpbmRvdy5lbW90ZU1lbnUgPSBwdWJsaWNBcGk7XHJcbn1cclxuXHJcbi8vIFNjcmlwdC13aWRlIHZhcmlhYmxlcy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4vLyBET00gZWxlbWVudHMuXHJcbnZhciBlbGVtZW50cyA9IHtcclxuXHQvLyBUaGUgYnV0dG9uIHRvIHNlbmQgYSBjaGF0IG1lc3NhZ2UuXHJcblx0Y2hhdEJ1dHRvbjogbnVsbCxcclxuXHQvLyBUaGUgYXJlYSB3aGVyZSBhbGwgY2hhdCBtZXNzYWdlcyBhcmUgY29udGFpbmVkLlxyXG5cdGNoYXRDb250YWluZXI6IG51bGwsXHJcblx0Ly8gVGhlIGlucHV0IGZpZWxkIGZvciBjaGF0IG1lc3NhZ2VzLlxyXG5cdGNoYXRCb3g6IG51bGwsXHJcblx0Ly8gVGhlIGJ1dHRvbiB1c2VkIHRvIHNob3cgdGhlIG1lbnUuXHJcblx0bWVudUJ1dHRvbjogbnVsbCxcclxuXHQvLyBUaGUgbWVudSB0aGF0IGNvbnRhaW5zIGFsbCBlbW90ZXMuXHJcblx0bWVudTogbnVsbFxyXG59O1xyXG5cclxudmFyIGhlbHBlcnMgPSB7XHJcblx0dXNlcjoge1xyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVjayBpZiB1c2VyIGlzIGxvZ2dlZCBpbiwgYW5kIHByb21wdHMgdGhlbSB0byBpZiB0aGV5IGFyZW4ndC5cclxuXHRcdCAqIEByZXR1cm4ge2Jvb2xlYW59IGB0cnVlYCBpZiBsb2dnZWQgaW4sIGBmYWxzZWAgaWYgbG9nZ2VkIG91dC5cclxuXHRcdCAqL1xyXG5cdFx0bG9naW46IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Ly8gQ2hlY2sgaWYgbG9nZ2VkIGluIGFscmVhZHkuXHJcblx0XHRcdGlmICh3aW5kb3cuVHdpdGNoICYmIHdpbmRvdy5Ud2l0Y2gudXNlci5pc0xvZ2dlZEluKCkpIHtcclxuXHRcdFx0XHRsb2dnZXIuZGVidWcoJ1VzZXIgaXMgbG9nZ2VkIGluLicpO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIE5vdCBsb2dnZWQgaW4sIGNhbGwgVHdpdGNoJ3MgbG9naW4gbWV0aG9kLlxyXG5cdFx0XHQkLmxvZ2luKCk7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnVXNlciBpcyBub3QgbG9nZ2VkIGluLCBzaG93IHRoZSBsb2dpbiBzY3JlZW4uJyk7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHR9XHJcbn07XHJcblxyXG5sb2dnZXIubG9nKCdJbml0aWFsIGxvYWQgb24gJyArIGxvY2F0aW9uLmhyZWYpO1xyXG5cclxuLy8gT25seSBlbmFibGUgc2NyaXB0IGlmIHdlIGhhdmUgdGhlIHJpZ2h0IHZhcmlhYmxlcy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxudmFyIGluaXRUaW1lciA9IDA7XHJcbihmdW5jdGlvbiBpbml0KHRpbWUpIHtcclxuXHQvLyBEb24ndCBydW4gaW4gYW4gaWZyYW1lLlxyXG5cdGlmICh3aW5kb3cuZnJhbWVFbGVtZW50KSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG5cdGlmICghdGltZSkge1xyXG5cdFx0dGltZSA9IDA7XHJcblx0fVxyXG5cclxuXHQkID0galF1ZXJ5ID0gd2luZG93LmpRdWVyeTtcclxuXHR2YXIgb2JqZWN0c0xvYWRlZCA9IChcclxuXHRcdHdpbmRvdy5Ud2l0Y2ggIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0ZW1iZXIuaXNMb2FkZWQoKSAmJlxyXG5cdFx0alF1ZXJ5ICE9PSB1bmRlZmluZWQgJiZcclxuXHRcdCQoJy5zZW5kLWNoYXQtYnV0dG9uJykubGVuZ3RoXHJcblx0KTtcclxuXHRpZiAoIW9iamVjdHNMb2FkZWQpIHtcclxuXHRcdC8vIFN0b3BzIHRyeWluZyBhZnRlciAxMCBtaW51dGVzLlxyXG5cdFx0aWYgKGluaXRUaW1lciA+PSA2MDAwMDApIHtcclxuXHRcdFx0bG9nZ2VyLmxvZygnVGFraW5nIHRvbyBsb25nIHRvIGxvYWQsIHN0b3BwaW5nLiBSZWZyZXNoIHRoZSBwYWdlIHRvIHRyeSBhZ2Fpbi4gKCcgKyBpbml0VGltZXIgKyAnbXMpJyk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHaXZlIGFuIHVwZGF0ZSBldmVyeSAxMCBzZWNvbmRzLlxyXG5cdFx0aWYgKGluaXRUaW1lciAlIDEwMDAwKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnU3RpbGwgd2FpdGluZyBmb3Igb2JqZWN0cyB0byBsb2FkLiAoJyArIGluaXRUaW1lciArICdtcyknKTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBCdW1wIHRpbWUgdXAgYWZ0ZXIgMXMgdG8gcmVkdWNlIHBvc3NpYmxlIGxhZy5cclxuXHRcdHRpbWUgPSB0aW1lID49IDEwMDAgPyAxMDAwIDogdGltZSArIDI1O1xyXG5cdFx0aW5pdFRpbWVyICs9IHRpbWU7XHJcblxyXG5cdFx0c2V0VGltZW91dChpbml0LCB0aW1lLCB0aW1lKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XHJcblx0XHQvLyBSZW1vdmUgbWVudSBmcm9tIHNjcmVlbiB3aGVuIHJlZGlyZWN0aW5nLlxyXG5cdFx0aWYgKGVsZW1lbnRzLm1lbnUpIHtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5oaWRlKCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdGVtYmVyLmhvb2soJ3JvdXRlOmNoYW5uZWwnLCBpbml0LCBkZWFjdGl2YXRlKTtcclxuXHRlbWJlci5ob29rKCdyb3V0ZTpjaGF0JywgaW5pdCwgZGVhY3RpdmF0ZSk7XHJcblxyXG5cdHNldHVwKCk7XHJcbn0pKCk7XHJcblxyXG4vLyBTdGFydCBvZiBmdW5jdGlvbnMuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLyoqXHJcbiAqIFJ1bnMgaW5pdGlhbCBzZXR1cCBvZiBET00gYW5kIHZhcmlhYmxlcy5cclxuICovXHJcbmZ1bmN0aW9uIHNldHVwKCkge1xyXG5cdHZhciBlbW90ZXMgPSByZXF1aXJlKCcuL21vZHVsZXMvZW1vdGVzJyk7XHJcblx0bG9nZ2VyLmRlYnVnKCdSdW5uaW5nIHNldHVwLi4uJyk7XHJcblx0Ly8gTG9hZCBDU1MuXHJcblx0cmVxdWlyZSgnLi4vYnVpbGQvc3R5bGVzJyk7XHJcblx0Ly8gTG9hZCBqUXVlcnkgcGx1Z2lucy5cclxuXHRyZXF1aXJlKCcuL3BsdWdpbnMvcmVzaXphYmxlJyk7XHJcblx0cmVxdWlyZSgnanF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXIvanF1ZXJ5LmN1c3RvbS1zY3JvbGxiYXInKTtcclxuXHRcclxuXHRlbGVtZW50cy5jaGF0QnV0dG9uID0gJCgnLnNlbmQtY2hhdC1idXR0b24nKTtcclxuXHRlbGVtZW50cy5jaGF0Qm94ID0gJCgnLmNoYXQtaW50ZXJmYWNlIHRleHRhcmVhJyk7XHJcblx0ZWxlbWVudHMuY2hhdENvbnRhaW5lciA9ICQoJy5jaGF0LW1lc3NhZ2VzJyk7XHJcblxyXG5cdGNyZWF0ZU1lbnVFbGVtZW50cygpO1xyXG5cdGJpbmRMaXN0ZW5lcnMoKTtcclxuXHRlbW90ZXMuaW5pdCgpO1xyXG59XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0aGUgaW5pdGlhbCBtZW51IGVsZW1lbnRzXHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVNZW51RWxlbWVudHMoKSB7XHJcblx0Ly8gUmVtb3ZlIG1lbnUgYnV0dG9uIGlmIGZvdW5kLlxyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24gPSAkKCcjZW1vdGUtbWVudS1idXR0b24nKTtcclxuXHRpZiAoZWxlbWVudHMubWVudUJ1dHRvbi5sZW5ndGgpIHtcclxuXHRcdGVsZW1lbnRzLm1lbnVCdXR0b24ucmVtb3ZlKCk7XHJcblx0fVxyXG5cdC8vIENyZWF0ZSBtZW51IGJ1dHRvbi5cclxuXHRlbGVtZW50cy5tZW51QnV0dG9uID0gJCh0ZW1wbGF0ZXMuZW1vdGVCdXR0b24oKSk7XHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbi5pbnNlcnRCZWZvcmUoZWxlbWVudHMuY2hhdEJ1dHRvbik7XHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbi5oaWRlKCk7XHJcblx0ZWxlbWVudHMubWVudUJ1dHRvbi5mYWRlSW4oKTtcclxuXHJcblx0Ly8gUmVtb3ZlIG1lbnUgaWYgZm91bmQuXHJcblx0ZWxlbWVudHMubWVudSA9ICQoJyNlbW90ZS1tZW51LWZvci10d2l0Y2gnKTtcclxuXHRpZiAoZWxlbWVudHMubWVudS5sZW5ndGgpIHtcclxuXHRcdGVsZW1lbnRzLm1lbnUucmVtb3ZlKCk7XHJcblx0fVxyXG5cdC8vIENyZWF0ZSBtZW51LlxyXG5cdGVsZW1lbnRzLm1lbnUgPSAkKHRlbXBsYXRlcy5tZW51KCkpO1xyXG5cdGVsZW1lbnRzLm1lbnUuYXBwZW5kVG8oZG9jdW1lbnQuYm9keSk7XHJcblxyXG5cdGxvZ2dlci5kZWJ1ZygnQ3JlYXRlZCBtZW51IGVsZW1lbnRzLicpO1xyXG59XHJcblxyXG4vKipcclxuICogQmluZCBldmVudCBsaXN0ZW5lcnMuXHJcbiAqL1xyXG5mdW5jdGlvbiBiaW5kTGlzdGVuZXJzKCkge1xyXG5cclxuXHRmdW5jdGlvbiB0b2dnbGVNZW51KCkge1xyXG5cdFx0Ly8gTWVudSBzaG93biwgaGlkZSBpdC5cclxuXHRcdGlmIChlbGVtZW50cy5tZW51LmlzKCc6dmlzaWJsZScpKSB7XHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuaGlkZSgpO1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LnJlbW92ZUNsYXNzKCdwaW5uZWQnKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudS5yZW1vdmVDbGFzcygnZWRpdGluZycpO1xyXG5cdFx0XHRlbGVtZW50cy5tZW51QnV0dG9uLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuXHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnTWVudSBoaWRkZW4uJyk7XHJcblx0XHR9XHJcblx0XHQvLyBNZW51IGhpZGRlbiwgc2hvdyBpdC5cclxuXHRcdGVsc2UgaWYgKGhlbHBlcnMudXNlci5sb2dpbigpKSB7XHJcblx0XHRcdHBvcHVsYXRlRW1vdGVzTWVudSgpO1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LnNob3coKTtcclxuXHRcdFx0ZWxlbWVudHMubWVudUJ1dHRvbi5hZGRDbGFzcygnYWN0aXZlJyk7XHJcblxyXG5cdFx0XHQkKGRvY3VtZW50KS5vbignbW91c2V1cCcsIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKTtcclxuXHJcblx0XHRcdC8vIE1lbnUgbW92ZWQsIG1vdmUgaXQgYmFjay5cclxuXHRcdFx0aWYgKGVsZW1lbnRzLm1lbnUuaGFzQ2xhc3MoJ21vdmVkJykpIHtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51Lm9mZnNldChKU09OLnBhcnNlKGVsZW1lbnRzLm1lbnUuYXR0cignZGF0YS1vZmZzZXQnKSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIE5ldmVyIG1vdmVkLCBtYWtlIGl0IHRoZSBzYW1lIHNpemUgYXMgdGhlIGNoYXQgd2luZG93LlxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHR2YXIgZGlmZiA9IGVsZW1lbnRzLm1lbnUuaGVpZ2h0KCkgLSBlbGVtZW50cy5tZW51LmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykuaGVpZ2h0KCk7XHJcblx0XHRcdFx0Ly8gQWRqdXN0IHRoZSBzaXplIGFuZCBwb3NpdGlvbiBvZiB0aGUgcG9wdXAuXHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5oZWlnaHQoZWxlbWVudHMuY2hhdENvbnRhaW5lci5vdXRlckhlaWdodCgpIC0gKGVsZW1lbnRzLm1lbnUub3V0ZXJIZWlnaHQoKSAtIGVsZW1lbnRzLm1lbnUuaGVpZ2h0KCkpKTtcclxuXHRcdFx0XHRlbGVtZW50cy5tZW51LndpZHRoKGVsZW1lbnRzLmNoYXRDb250YWluZXIub3V0ZXJXaWR0aCgpIC0gKGVsZW1lbnRzLm1lbnUub3V0ZXJXaWR0aCgpIC0gZWxlbWVudHMubWVudS53aWR0aCgpKSk7XHJcblx0XHRcdFx0ZWxlbWVudHMubWVudS5vZmZzZXQoZWxlbWVudHMuY2hhdENvbnRhaW5lci5vZmZzZXQoKSk7XHJcblx0XHRcdFx0Ly8gRml4IGAuZW1vdGVzLWFsbGAgaGVpZ2h0LlxyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKS5oZWlnaHQoZWxlbWVudHMubWVudS5oZWlnaHQoKSAtIGRpZmYpO1xyXG5cdFx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnI2FsbC1lbW90ZXMtZ3JvdXAnKS53aWR0aChlbGVtZW50cy5tZW51LndpZHRoKCkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIFJlY2FsY3VsYXRlIGFueSBzY3JvbGwgYmFycy5cclxuXHRcdFx0ZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLmN1c3RvbVNjcm9sbGJhcigncmVzaXplJyk7XHJcblxyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ01lbnUgdmlzaWJsZS4nKTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBjaGVja0ZvckNsaWNrT3V0c2lkZShlKSB7XHJcblx0XHRcdC8vIE5vdCBvdXRzaWRlIG9mIHRoZSBtZW51LCBpZ25vcmUgdGhlIGNsaWNrLlxyXG5cdFx0XHRpZiAoJChlLnRhcmdldCkuaXMoJyNlbW90ZS1tZW51LWZvci10d2l0Y2gsICNlbW90ZS1tZW51LWZvci10d2l0Y2ggKicpKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIENsaWNrZWQgb24gdGhlIG1lbnUgYnV0dG9uLCBqdXN0IHJlbW92ZSB0aGUgbGlzdGVuZXIgYW5kIGxldCB0aGUgbm9ybWFsIGxpc3RlbmVyIGhhbmRsZSBpdC5cclxuXHRcdFx0aWYgKCFlbGVtZW50cy5tZW51LmlzKCc6dmlzaWJsZScpIHx8ICQoZS50YXJnZXQpLmlzKCcjZW1vdGUtbWVudS1idXR0b24sICNlbW90ZS1tZW51LWJ1dHRvbiAqJykpIHtcclxuXHRcdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCBjaGVja0ZvckNsaWNrT3V0c2lkZSk7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIENsaWNrZWQgb3V0c2lkZSwgbWFrZSBzdXJlIHRoZSBtZW51IGlzbid0IHBpbm5lZC5cclxuXHRcdFx0aWYgKCFlbGVtZW50cy5tZW51Lmhhc0NsYXNzKCdwaW5uZWQnKSkge1xyXG5cdFx0XHRcdC8vIE1lbnUgd2Fzbid0IHBpbm5lZCwgcmVtb3ZlIGxpc3RlbmVyLlxyXG5cdFx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsIGNoZWNrRm9yQ2xpY2tPdXRzaWRlKTtcclxuXHRcdFx0XHR0b2dnbGVNZW51KCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFRvZ2dsZSBtZW51LlxyXG5cdGVsZW1lbnRzLm1lbnVCdXR0b24ub24oJ2NsaWNrJywgdG9nZ2xlTWVudSk7XHJcblxyXG5cdC8vIE1ha2UgZHJhZ2dhYmxlLlxyXG5cdGVsZW1lbnRzLm1lbnUuZHJhZ2dhYmxlKHtcclxuXHRcdGhhbmRsZTogJy5kcmFnZ2FibGUnLFxyXG5cdFx0c3RhcnQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JCh0aGlzKS5hZGRDbGFzcygncGlubmVkJyk7XHJcblx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ21vdmVkJyk7XHJcblx0XHR9LFxyXG5cdFx0c3RvcDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRlbGVtZW50cy5tZW51LmF0dHIoJ2RhdGEtb2Zmc2V0JywgSlNPTi5zdHJpbmdpZnkoZWxlbWVudHMubWVudS5vZmZzZXQoKSkpO1xyXG5cdFx0fSxcclxuXHRcdGNvbnRhaW5tZW50OiAkKGRvY3VtZW50LmJvZHkpXHJcblx0fSk7XHJcblxyXG5cdGVsZW1lbnRzLm1lbnUucmVzaXphYmxlKHtcclxuXHRcdGhhbmRsZTogJ1tkYXRhLWNvbW1hbmQ9XCJyZXNpemUtaGFuZGxlXCJdJyxcclxuXHRcdHJlc2l6ZTogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHQvLyBSZWNhbGN1bGF0ZSBhbnkgc2Nyb2xsIGJhcnMuXHJcblx0XHRcdGVsZW1lbnRzLm1lbnUuZmluZCgnLnNjcm9sbGFibGUnKS5jdXN0b21TY3JvbGxiYXIoJ3Jlc2l6ZScpO1xyXG5cdFx0fSxcclxuXHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0JCh0aGlzKS5hZGRDbGFzcygncGlubmVkJyk7XHJcblx0XHRcdCQodGhpcykuYWRkQ2xhc3MoJ21vdmVkJyk7XHJcblx0XHR9LFxyXG5cdFx0YWxzb1Jlc2l6ZTogZWxlbWVudHMubWVudS5maW5kKCcuc2Nyb2xsYWJsZScpLFxyXG5cdFx0Y29udGFpbm1lbnQ6ICQoZG9jdW1lbnQuYm9keSksXHJcblx0XHRtaW5IZWlnaHQ6IDE4MCxcclxuXHRcdG1pbldpZHRoOiAyMDBcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIG1lbnUgcGlubmluZy5cclxuXHRlbGVtZW50cy5tZW51LmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtcGlubmVkXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0ZWxlbWVudHMubWVudS50b2dnbGVDbGFzcygncGlubmVkJyk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBtZW51IGVkaXRpbmcuXHJcblx0ZWxlbWVudHMubWVudS5maW5kKCdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLWVkaXRpbmdcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRlbGVtZW50cy5tZW51LnRvZ2dsZUNsYXNzKCdlZGl0aW5nJyk7XHJcblx0XHQvLyBSZWNhbGN1bGF0ZSBhbnkgc2Nyb2xsIGJhcnMuXHJcblx0XHRlbGVtZW50cy5tZW51LmZpbmQoJy5zY3JvbGxhYmxlJykuY3VzdG9tU2Nyb2xsYmFyKCdyZXNpemUnKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIGVtb3RlIGNsaWNraW5nIChkZWxlZ2F0ZWQpLlxyXG5cdGVsZW1lbnRzLm1lbnUub24oJ2NsaWNrJywgJy5lbW90ZScsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmIChlbGVtZW50cy5tZW51LmlzKCcuZWRpdGluZycpKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGluc2VydEVtb3RlVGV4dCgkKHRoaXMpLmF0dHIoJ2RhdGEtZW1vdGUnKSk7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0NsaWNrZWQgZW1vdGU6ICcgKyAkKHRoaXMpLmF0dHIoJ2RhdGEtZW1vdGUnKSk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBlbW90ZSBoaWRpbmcgKGRlbGVnYXRlZCkuXHJcblx0ZWxlbWVudHMubWVudS5vbignY2xpY2snLCAnW2RhdGEtY29tbWFuZD1cInRvZ2dsZS12aXNpYmlsaXR5XCJdJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0Ly8gTWFrZSBzdXJlIHdlIGFyZSBpbiBlZGl0IG1vZGUuXHJcblx0XHRpZiAoIWVsZW1lbnRzLm1lbnUuaXMoJy5lZGl0aW5nJykpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0dmFyIHdoaWNoID0gJCh0aGlzKS5hdHRyKCdkYXRhLXdoaWNoJyk7XHJcblx0XHR2YXIgaXNWaXNpYmxlID0gc3RvcmFnZS52aXNpYmlsaXR5LmdldCh3aGljaCwgdHJ1ZSk7XHJcblx0XHQvLyBUb2dnbGUgdmlzaWJpbGl0eS5cclxuXHRcdHN0b3JhZ2UudmlzaWJpbGl0eS5zZXQod2hpY2gsICFpc1Zpc2libGUpO1xyXG5cdFx0cG9wdWxhdGVFbW90ZXNNZW51KCk7XHJcblxyXG5cdFx0bG9nZ2VyLmRlYnVnKCdTZXQgaGlkZGVuIGVtb3RlLicsIHtcclxuXHRcdFx0d2hpY2g6IHdoaWNoLFxyXG5cdFx0XHRpc1Zpc2libGU6ICFpc1Zpc2libGVcclxuXHRcdH0pO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgZW1vdGUgc3RhcnJpbmcgKGRlbGVnYXRlZCkuXHJcblx0ZWxlbWVudHMubWVudS5vbignY2xpY2snLCAnW2RhdGEtY29tbWFuZD1cInRvZ2dsZS1zdGFycmVkXCJdJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0Ly8gTWFrZSBzdXJlIHdlIGFyZSBpbiBlZGl0IG1vZGUuXHJcblx0XHRpZiAoIWVsZW1lbnRzLm1lbnUuaXMoJy5lZGl0aW5nJykpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0dmFyIHdoaWNoID0gJCh0aGlzKS5hdHRyKCdkYXRhLXdoaWNoJyk7XHJcblx0XHR2YXIgaXNTdGFycmVkID0gc3RvcmFnZS5zdGFycmVkLmdldCh3aGljaCwgZmFsc2UpO1xyXG5cdFx0Ly8gVG9nZ2xlIHN0YXIuXHJcblx0XHRzdG9yYWdlLnN0YXJyZWQuc2V0KHdoaWNoLCAhaXNTdGFycmVkKTtcclxuXHRcdHBvcHVsYXRlRW1vdGVzTWVudSgpO1xyXG5cclxuXHRcdGxvZ2dlci5kZWJ1ZygnU2V0IHN0YXJyZWQgZW1vdGUuJywge1xyXG5cdFx0XHR3aGljaDogd2hpY2gsXHJcblx0XHRcdGlzU3RhcnJlZDogIWlzU3RhcnJlZFxyXG5cdFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdGVsZW1lbnRzLm1lbnUuZmluZCgnLnNjcm9sbGFibGUnKS5jdXN0b21TY3JvbGxiYXIoe1xyXG5cdFx0c2tpbjogJ2RlZmF1bHQtc2tpbicsXHJcblx0XHRoU2Nyb2xsOiBmYWxzZSxcclxuXHRcdHByZXZlbnREZWZhdWx0U2Nyb2xsOiB0cnVlXHJcblx0fSk7XHJcblxyXG5cdGxvZ2dlci5kZWJ1ZygnQm91bmRlZCBldmVudCBsaXN0ZW5lcnMuJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQb3B1bGF0ZXMgdGhlIHBvcHVwIG1lbnUgd2l0aCBjdXJyZW50IGVtb3RlIGRhdGEuXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3B1bGF0ZUVtb3Rlc01lbnUoKSB7XHJcblx0dmFyIGVtb3RlcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9lbW90ZXMnKTtcclxuXHR2YXIgY29udGFpbmVyID0gbnVsbDtcclxuXHJcblx0Ly8gQWRkIHN0YXJyZWQgZW1vdGVzLlxyXG5cdGNvbnRhaW5lciA9IGVsZW1lbnRzLm1lbnUuZmluZCgnI3N0YXJyZWQtZW1vdGVzLWdyb3VwJyk7XHJcblx0Y29udGFpbmVyLmh0bWwoJycpO1xyXG5cdGVtb3Rlcy5nZXRFbW90ZXMoXHJcblx0XHRmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0cmV0dXJuIGVtb3RlLmlzRmF2b3JpdGUoKTtcclxuXHRcdH0sXHJcblx0XHQnZGVmYXVsdCdcclxuXHQpLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRjcmVhdGVFbW90ZShlbW90ZSwgY29udGFpbmVyKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gQWRkIGFsbCBlbW90ZXMuXHJcblx0Y29udGFpbmVyID0gZWxlbWVudHMubWVudS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpO1xyXG5cdGlmIChjb250YWluZXIuZmluZCgnLm92ZXJ2aWV3JykubGVuZ3RoKSB7XHJcblx0XHRjb250YWluZXIgPSBjb250YWluZXIuZmluZCgnLm92ZXJ2aWV3Jyk7XHJcblx0fVxyXG5cdGNvbnRhaW5lci5odG1sKCcnKTtcclxuXHRlbW90ZXMuZ2V0RW1vdGVzKG51bGwsICdjaGFubmVsJykuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdGNyZWF0ZUVtb3RlKGVtb3RlLCBjb250YWluZXIsIHRydWUpO1xyXG5cdH0pO1xyXG59XHJcblxyXG4vKipcclxuICogSW5zZXJ0cyBhbiBlbW90ZSBpbnRvIHRoZSBjaGF0IGJveC5cclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgVGhlIHRleHQgb2YgdGhlIGVtb3RlIChlLmcuIFwiS2FwcGFcIikuXHJcbiAqL1xyXG5mdW5jdGlvbiBpbnNlcnRFbW90ZVRleHQodGV4dCkge1xyXG5cdC8vIEdldCBpbnB1dC5cclxuXHR2YXIgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjaGF0X3RleHRfaW5wdXQsIC5jaGF0LWludGVyZmFjZSB0ZXh0YXJlYScpO1xyXG5cclxuXHQvLyBJbnNlcnQgYXQgY3Vyc29yIC8gcmVwbGFjZSBzZWxlY3Rpb24uXHJcblx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Db2RlX3NuaXBwZXRzL01pc2NlbGxhbmVvdXNcclxuXHR2YXIgc2VsZWN0aW9uRW5kID0gZWxlbWVudC5zZWxlY3Rpb25TdGFydCArIHRleHQubGVuZ3RoO1xyXG5cdHZhciBjdXJyZW50VmFsdWUgPSBlbGVtZW50LnZhbHVlO1xyXG5cdHZhciBiZWZvcmVUZXh0ID0gY3VycmVudFZhbHVlLnN1YnN0cmluZygwLCBlbGVtZW50LnNlbGVjdGlvblN0YXJ0KTtcclxuXHR2YXIgYWZ0ZXJUZXh0ID0gY3VycmVudFZhbHVlLnN1YnN0cmluZyhlbGVtZW50LnNlbGVjdGlvbkVuZCwgY3VycmVudFZhbHVlLmxlbmd0aCk7XHJcblx0Ly8gU21hcnQgcGFkZGluZywgb25seSBwdXQgc3BhY2UgYXQgc3RhcnQgaWYgbmVlZGVkLlxyXG5cdGlmIChcclxuXHRcdGJlZm9yZVRleHQgIT09ICcnICYmXHJcblx0XHRiZWZvcmVUZXh0LnN1YnN0cigtMSkgIT09ICcgJ1xyXG5cdCkge1xyXG5cdFx0dGV4dCA9ICcgJyArIHRleHQ7XHJcblx0fVxyXG5cdC8vIEFsd2F5cyBwdXQgc3BhY2UgYXQgZW5kLlxyXG5cdHRleHQgPSBiZWZvcmVUZXh0ICsgdGV4dCArICcgJyArIGFmdGVyVGV4dDtcclxuXHQvLyBTZXQgdGhlIHRleHQuXHJcblx0ZW1iZXIuZ2V0KCdjb250cm9sbGVyOmNoYXQnLCAnY3VycmVudFJvb20nKS5zZXQoJ21lc3NhZ2VUb1NlbmQnLCB0ZXh0KTtcclxuXHRlbGVtZW50LmZvY3VzKCk7XHJcblx0Ly8gUHV0IGN1cnNvciBhdCBlbmQuXHJcblx0c2VsZWN0aW9uRW5kID0gZWxlbWVudC5zZWxlY3Rpb25TdGFydCArIHRleHQubGVuZ3RoO1xyXG5cdGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0aW9uRW5kLCBzZWxlY3Rpb25FbmQpO1xyXG5cclxuXHQvLyBDbG9zZSBwb3B1cCBpZiBpdCBoYXNuJ3QgYmVlbiBtb3ZlZCBieSB0aGUgdXNlci5cclxuXHRpZiAoIWVsZW1lbnRzLm1lbnUuaGFzQ2xhc3MoJ3Bpbm5lZCcpKSB7XHJcblx0XHRlbGVtZW50cy5tZW51QnV0dG9uLmNsaWNrKCk7XHJcblx0fVxyXG5cdC8vIFJlLXBvcHVsYXRlIGFzIGl0IGlzIHN0aWxsIG9wZW4uXHJcblx0ZWxzZSB7XHJcblx0XHRwb3B1bGF0ZUVtb3Rlc01lbnUoKTtcclxuXHR9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBlbW90ZSBlbGVtZW50IGFuZCBsaXN0ZW5zIGZvciBhIGNsaWNrIGV2ZW50IHRoYXQgd2lsbCBhZGQgdGhlIGVtb3RlIHRleHQgdG8gdGhlIGNoYXQuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSAgZW1vdGUgICAgICBUaGUgZW1vdGUgdGhhdCB5b3Ugd2FudCB0byBhZGQuIFRoaXMgb2JqZWN0IHNob3VsZCBiZSBvbmUgY29taW5nIGZyb20gYGVtb3Rlc2AuXHJcbiAqIEBwYXJhbSB7ZWxlbWVudH0gY29udGFpbmVyICBUaGUgSFRNTCBlbGVtZW50IHRoYXQgdGhlIGVtb3RlIHNob3VsZCBiZSBhcHBlbmRlZCB0by5cclxuICogQHBhcmFtIHtib29sZWFufSBzaG93SGVhZGVyIFdoZXRoZXIgYSBoZWFkZXIgc2hvdWxkYmUgY3JlYXRlZCBpZiBmb3VuZC4gT25seSBjcmVhdGVzIHRoZSBoZWFkZXIgb25jZS5cclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZUVtb3RlKGVtb3RlLCBjb250YWluZXIsIHNob3dIZWFkZXIpIHtcclxuXHQvLyBObyBjb250YWluZXIsIGNhbid0IGFkZC5cclxuXHRpZiAoIWNvbnRhaW5lci5sZW5ndGgpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0aWYgKHNob3dIZWFkZXIpIHtcclxuXHRcdGlmIChlbW90ZS5nZXRDaGFubmVsTmFtZSgpICYmICFlbW90ZS5pc1NtaWxleSgpKSB7XHJcblx0XHRcdGlmICghZWxlbWVudHMubWVudS5maW5kKCcuZ3JvdXAtaGVhZGVyW2RhdGEtZW1vdGUtY2hhbm5lbD1cIicgKyBlbW90ZS5nZXRDaGFubmVsTmFtZSgpICsgJ1wiXScpLmxlbmd0aCkge1xyXG5cdFx0XHRcdGNvbnRhaW5lci5hcHBlbmQoXHJcblx0XHRcdFx0XHQkKHRlbXBsYXRlcy5lbW90ZUdyb3VwSGVhZGVyKHtcclxuXHRcdFx0XHRcdFx0YmFkZ2U6IGVtb3RlLmdldENoYW5uZWxCYWRnZSgpLFxyXG5cdFx0XHRcdFx0XHRjaGFubmVsOiBlbW90ZS5nZXRDaGFubmVsTmFtZSgpLFxyXG5cdFx0XHRcdFx0XHRjaGFubmVsRGlzcGxheU5hbWU6IGVtb3RlLmdldENoYW5uZWxEaXNwbGF5TmFtZSgpLFxyXG5cdFx0XHRcdFx0XHRpc1Zpc2libGU6IHN0b3JhZ2UudmlzaWJpbGl0eS5nZXQoJ2NoYW5uZWwtJyArIGVtb3RlLmdldENoYW5uZWxOYW1lKCksIHRydWUpXHJcblx0XHRcdFx0XHR9KSlcclxuXHRcdFx0XHQpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgY2hhbm5lbENvbnRhaW5lciA9IGNvbnRhaW5lci5maW5kKCcuZ3JvdXAtaGVhZGVyW2RhdGEtZW1vdGUtY2hhbm5lbD1cIicgKyBlbW90ZS5nZXRDaGFubmVsTmFtZSgpICsgJ1wiXScpO1xyXG5cdGlmIChjaGFubmVsQ29udGFpbmVyLmxlbmd0aCkge1xyXG5cdFx0Y29udGFpbmVyID0gY2hhbm5lbENvbnRhaW5lcjtcclxuXHR9XHJcblx0Y29udGFpbmVyLmFwcGVuZChcclxuXHRcdCQodGVtcGxhdGVzLmVtb3RlKHtcclxuXHRcdFx0dXJsOiBlbW90ZS5nZXRVcmwoKSxcclxuXHRcdFx0dGV4dDogZW1vdGUuZ2V0VGV4dCgpLFxyXG5cdFx0XHR0aGlyZFBhcnR5OiBlbW90ZS5pc1RoaXJkUGFydHkoKSxcclxuXHRcdFx0aXNWaXNpYmxlOiBlbW90ZS5pc1Zpc2libGUoKSxcclxuXHRcdFx0aXNTdGFycmVkOiBlbW90ZS5pc0Zhdm9yaXRlKClcclxuXHRcdH0pKVxyXG5cdCk7XHJcbn1cclxuIiwiKGZ1bmN0aW9uIChkb2MsIGNzc1RleHQpIHtcbiAgICB2YXIgaWQgPSBcImVtb3RlLW1lbnUtZm9yLXR3aXRjaC1zdHlsZXNcIjtcbiAgICB2YXIgc3R5bGVFbCA9IGRvYy5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKCFzdHlsZUVsKSB7XG4gICAgICAgIHN0eWxlRWwgPSBkb2MuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgICBzdHlsZUVsLmlkID0gaWQ7XG4gICAgICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG4gICAgfVxuICAgIGlmIChzdHlsZUVsLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgaWYgKCFzdHlsZUVsLnN0eWxlU2hlZXQuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIHN0eWxlRWwuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzVGV4dDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdHlsZUVsLmlubmVySFRNTCA9IGNzc1RleHQ7XG4gICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge1xuICAgICAgICAgICAgc3R5bGVFbC5pbm5lclRleHQgPSBjc3NUZXh0O1xuICAgICAgICB9XG4gICAgfVxufShkb2N1bWVudCwgXCIvKipcXG5cIiArXG5cIiAqIE1pbmlmaWVkIHN0eWxlLlxcblwiICtcblwiICogT3JpZ2luYWwgZmlsZW5hbWU6IFxcXFxub2RlX21vZHVsZXNcXFxcanF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXJcXFxcanF1ZXJ5LmN1c3RvbS1zY3JvbGxiYXIuY3NzXFxuXCIgK1xuXCIgKi9cXG5cIiArXG5cIi5zY3JvbGxhYmxle3Bvc2l0aW9uOnJlbGF0aXZlfS5zY3JvbGxhYmxlOmZvY3Vze291dGxpbmU6MH0uc2Nyb2xsYWJsZSAudmlld3BvcnR7cG9zaXRpb246cmVsYXRpdmU7b3ZlcmZsb3c6aGlkZGVufS5zY3JvbGxhYmxlIC52aWV3cG9ydCAub3ZlcnZpZXd7cG9zaXRpb246YWJzb2x1dGV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXJ7ZGlzcGxheTpub25lfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyLnZlcnRpY2Fse3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7aGVpZ2h0OjEwMCV9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIuaG9yaXpvbnRhbHtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxMDAlfS5zY3JvbGxhYmxlIC5zY3JvbGwtYmFyIC50aHVtYntwb3NpdGlvbjphYnNvbHV0ZX0uc2Nyb2xsYWJsZSAuc2Nyb2xsLWJhci52ZXJ0aWNhbCAudGh1bWJ7d2lkdGg6MTAwJTttaW4taGVpZ2h0OjEwcHh9LnNjcm9sbGFibGUgLnNjcm9sbC1iYXIuaG9yaXpvbnRhbCAudGh1bWJ7aGVpZ2h0OjEwMCU7bWluLXdpZHRoOjEwcHg7bGVmdDowfS5ub3Qtc2VsZWN0YWJsZXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LWtodG1sLXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmV9LnNjcm9sbGFibGUuZGVmYXVsdC1za2lue3BhZGRpbmctcmlnaHQ6MTBweDtwYWRkaW5nLWJvdHRvbTo2cHh9LnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2Fse3dpZHRoOjZweH0uc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW4gLnNjcm9sbC1iYXIuaG9yaXpvbnRhbHtoZWlnaHQ6NnB4fS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojMDAwO29wYWNpdHk6LjQ7Ym9yZGVyLXJhZGl1czozcHg7LW1vei1ib3JkZXItcmFkaXVzOjRweDstd2Via2l0LWJvcmRlci1yYWRpdXM6NHB4fS5zY3JvbGxhYmxlLmRlZmF1bHQtc2tpbiAuc2Nyb2xsLWJhcjpob3ZlciAudGh1bWJ7b3BhY2l0eTouNn0uc2Nyb2xsYWJsZS5ncmF5LXNraW57cGFkZGluZy1yaWdodDoxN3B4fS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhcntib3JkZXI6MXB4IHNvbGlkIGdyYXk7YmFja2dyb3VuZC1jb2xvcjojZDNkM2QzfS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjpncmF5fS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhcjpob3ZlciAudGh1bWJ7YmFja2dyb3VuZC1jb2xvcjojMDAwfS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhci52ZXJ0aWNhbHt3aWR0aDoxMHB4fS5zY3JvbGxhYmxlLmdyYXktc2tpbiAuc2Nyb2xsLWJhci5ob3Jpem9udGFse2hlaWdodDoxMHB4O21hcmdpbi10b3A6MnB4fS5zY3JvbGxhYmxlLm1vZGVybi1za2lue3BhZGRpbmctcmlnaHQ6MTdweH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhcntib3JkZXI6MXB4IHNvbGlkIGdyYXk7Ym9yZGVyLXJhZGl1czo0cHg7LW1vei1ib3JkZXItcmFkaXVzOjRweDstd2Via2l0LWJvcmRlci1yYWRpdXM6NHB4O2JveC1zaGFkb3c6aW5zZXQgMCAwIDVweCAjODg4fS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOiM5NWFhYmY7Ym9yZGVyLXJhZGl1czo0cHg7LW1vei1ib3JkZXItcmFkaXVzOjRweDstd2Via2l0LWJvcmRlci1yYWRpdXM6NHB4O2JvcmRlcjoxcHggc29saWQgIzUzNjk4NH0uc2Nyb2xsYWJsZS5tb2Rlcm4tc2tpbiAuc2Nyb2xsLWJhci52ZXJ0aWNhbCAudGh1bWJ7d2lkdGg6OHB4O2JhY2tncm91bmQ6LXdlYmtpdC1ncmFkaWVudChsaW5lYXIsbGVmdCB0b3AscmlnaHQgdG9wLGNvbG9yLXN0b3AoMCUsIzk1YWFiZiksY29sb3Itc3RvcCgxMDAlLCM1NDcwOTIpKTtiYWNrZ3JvdW5kOi13ZWJraXQtbGluZWFyLWdyYWRpZW50KGxlZnQsIzk1YWFiZiAwLCM1NDcwOTIgMTAwJSk7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIzk1YWFiZiAwLCM1NDcwOTIgMTAwJSk7LW1zLWZpbHRlcjpcXFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LmdyYWRpZW50KCBzdGFydENvbG9yc3RyPScjOTVhYWJmJywgZW5kQ29sb3JzdHI9JyM1NDcwOTInLEdyYWRpZW50VHlwZT0xIClcXFwifS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyLmhvcml6b250YWwgLnRodW1ie2hlaWdodDo4cHg7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoIzk1YWFiZiwjNTQ3MDkyKTtiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtbGluZWFyLWdyYWRpZW50KCM5NWFhYmYsIzU0NzA5Mik7LW1zLWZpbHRlcjpcXFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LmdyYWRpZW50KCBzdGFydENvbG9yc3RyPScjOTVhYWJmJywgZW5kQ29sb3JzdHI9JyM1NDcwOTInLEdyYWRpZW50VHlwZT0wIClcXFwifS5zY3JvbGxhYmxlLm1vZGVybi1za2luIC5zY3JvbGwtYmFyLnZlcnRpY2Fse3dpZHRoOjEwcHh9LnNjcm9sbGFibGUubW9kZXJuLXNraW4gLnNjcm9sbC1iYXIuaG9yaXpvbnRhbHtoZWlnaHQ6MTBweDttYXJnaW4tdG9wOjJweH1cXG5cIiArXG5cIi8qKlxcblwiICtcblwiICogTWluaWZpZWQgc3R5bGUuXFxuXCIgK1xuXCIgKiBPcmlnaW5hbCBmaWxlbmFtZTogXFxcXHNyY1xcXFxzdHlsZXNcXFxcc3R5bGUuY3NzXFxuXCIgK1xuXCIgKi9cXG5cIiArXG5cIkAtd2Via2l0LWtleWZyYW1lcyBzcGluezEwMCV7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpfX1Aa2V5ZnJhbWVzIHNwaW57MTAwJXstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKTt0cmFuc2Zvcm06cm90YXRlKDM2MGRlZyl9fSNlbW90ZS1tZW51LWJ1dHRvbntiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJJQUFBQVFDQVlBQUFBYkJpOWNBQUFBQVhOU1IwSUFyczRjNlFBQUFBUm5RVTFCQUFDeGp3djhZUVVBQUFBSmNFaFpjd0FBRHNNQUFBN0RBY2R2cUdRQUFBS1VTVVJCVkRoUGZaVE5pMUpSR01adk1Jc1dVWnRzNVNJWEZZSzBDTUUvSUdnaHhWQzdXVW9VMU5CaXhJK21SU0Q0TVF6bXh6aUtPM1hVQmhSbVVHWktkQkc0MFhFR1U2ZDBHRkdaY1Q0cXhXMWhpN2Z6dk53WnFLd0RENXo3dnMvdnVlZWVlKzZWTUp4TzV3VWhoZHZ0ZnVIeitUNHRMUzJOaGVnZkdzTURMeGl3SElJaExpNTdQSjc1VkNyMVkzOS9uNGJESVkxR280bENEeDU0d1lDVll6am9WalFhL2R4dXR5ZkNrd1N2WUpwZ09TUWY3MDh0dUJhMXlXUnkvTCtWL0NsNHdZQkZoaFR4ZkxodW0vZXNpaUoxdTEyS1JDSmtzVmhvZlgyZFRrNU96a0hNVVVNUEhuakIyRjU1VnBFaFBkZS9MYng4RnFCRUlrSHBkSm9NQmdOcHRWclM2WFJVcVZUT2c3YTN0MmxtWm9iMGVqMnAxV3IyZ2dHTERPbkozUVNaSDRjb0hvL1R5c29LaHlnVUN0Sm9ORlFzRm1rd0dMQXdSN2hTcVNTVlNzVmVNR0NSSVQyOUY2ZlhKaThYeStVeW1jMW1tcDZlSm9mRFFmVjZuVTVQVDFtWTIrMTI3dUh4U3FVU2g0RkZoaFFMdnJ2dGNybStZcGtIQndkVXJWWnBhMnVMYXJVYWRUb2RPanc4WkdHT0ducnd3QXNHTERMdzFpNHVMcnpSWWVPT2o0OXBiMitQZG5kM3FkVnE4U3RHQUlRNWFvMUdnejN3Z2dHTERENEM0aXpjRWNXZlIwZEhiTXJsY3JTeHNjR2JqVkFJSzhsbXM3UzV1Y21CL1g2Zlh6OVlEc0VRRnpkanNWaXQyV3p5cWMxa01yd2ZWcXVWakVZanpjM05rY2xrSXB2TlJtdHJhK3lCVnpBZkJYdERqdUdnUzhGZ2NGYmM4UXZ1aGpOU0tCUW9GQXFSNkxGRW4vTDVQUGZnZ1hkNWVYa1dyQnpEUWRDMVFDQmdGb2V1dDdPencvdHlCcDJGUXpoUHd0T0ZGd3pZMzRZbzRBOXdSWHpkRDhMaGNFNDh3bmNFOW5vOUZ1YW9pZDU3NGJrUEx4Z1ovM3VJNXBUUVZmRmxQL0w3L1dtaGI3SlNYcS8zSVhyd3lIWjVTTkl2R0NucXloK0o3K2dBQUFBQVNVVk9SSzVDWUlJPSkhaW1wb3J0YW50O2JhY2tncm91bmQtcG9zaXRpb246NTAlO2JhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tbGVmdDo3cHh9I2Vtb3RlLW1lbnUtYnV0dG9uLmFjdGl2ZXtib3JkZXItcmFkaXVzOjJweDtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTI4LDEyOCwxMjgsLjUpfS5lbW90ZS1tZW51e3BhZGRpbmc6NXB4O3otaW5kZXg6MTAwMDtkaXNwbGF5Om5vbmU7YmFja2dyb3VuZC1jb2xvcjojMjAyMDIwfS5lbW90ZS1tZW51IGF7Y29sb3I6I2ZmZn0uZW1vdGUtbWVudSBhOmhvdmVye2N1cnNvcjpwb2ludGVyO3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmU7Y29sb3I6I2NjY30uZW1vdGUtbWVudSAuZW1vdGVzLXN0YXJyZWR7aGVpZ2h0OjM4cHh9LmVtb3RlLW1lbnUgLmRyYWdnYWJsZXtiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtcmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgMTBweCk7YmFja2dyb3VuZC1pbWFnZTpyZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSAxMHB4KTtjdXJzb3I6bW92ZTtoZWlnaHQ6N3B4O21hcmdpbi1ib3R0b206M3B4fS5lbW90ZS1tZW51IC5kcmFnZ2FibGU6aG92ZXJ7YmFja2dyb3VuZC1pbWFnZTotd2Via2l0LXJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSAxMHB4KTtiYWNrZ3JvdW5kLWltYWdlOnJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSAxMHB4KX0uZW1vdGUtbWVudSAuaGVhZGVyLWluZm97Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQoYm90dG9tLHRyYW5zcGFyZW50LHJnYmEoMCwwLDAsLjUpKTtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCh0byB0b3AsdHJhbnNwYXJlbnQscmdiYSgwLDAsMCwuNSkpO3BhZGRpbmc6MnB4O2NvbG9yOiNkZGQ7dGV4dC1hbGlnbjpjZW50ZXI7cG9zaXRpb246cmVsYXRpdmV9LmVtb3RlLW1lbnUgLmhlYWRlci1pbmZvIGltZ3ttYXJnaW4tcmlnaHQ6OHB4fS5lbW90ZS1tZW51IC5lbW90ZXtkaXNwbGF5OmlubGluZS1ibG9jaztwYWRkaW5nOjJweDttYXJnaW46MXB4O2N1cnNvcjpwb2ludGVyO2JvcmRlci1yYWRpdXM6NXB4O3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjMwcHg7aGVpZ2h0OjMwcHg7LXdlYmtpdC10cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7dHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO2JvcmRlcjoxcHggc29saWQgdHJhbnNwYXJlbnR9LmVtb3RlLW1lbnUuZWRpdGluZyAuZW1vdGV7Y3Vyc29yOmF1dG99LmVtb3RlLW1lbnUgLmVtb3RlIGltZ3ttYXgtd2lkdGg6MTAwJTttYXgtaGVpZ2h0OjEwMCU7bWFyZ2luOmF1dG87cG9zaXRpb246YWJzb2x1dGU7dG9wOjA7Ym90dG9tOjA7bGVmdDowO3JpZ2h0OjB9LmVtb3RlLW1lbnUgLnNpbmdsZS1yb3d7b3ZlcmZsb3c6aGlkZGVuO2hlaWdodDozN3B4fS5lbW90ZS1tZW51IC5zaW5nbGUtcm93IC5lbW90ZXtkaXNwbGF5OmlubGluZS1ibG9jazttYXJnaW4tYm90dG9tOjEwMHB4fS5lbW90ZS1tZW51IC5lbW90ZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsLjEpfS5lbW90ZS1tZW51IC5wdWxsLWxlZnR7ZmxvYXQ6bGVmdH0uZW1vdGUtbWVudSAucHVsbC1yaWdodHtmbG9hdDpyaWdodH0uZW1vdGUtbWVudSAuZm9vdGVye3RleHQtYWxpZ246Y2VudGVyO2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDA7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA1KSBpbnNldDtwYWRkaW5nOjVweCAwIDJweDttYXJnaW4tdG9wOjVweDtoZWlnaHQ6MThweH0uZW1vdGUtbWVudSAuZm9vdGVyIC5wdWxsLWxlZnR7bWFyZ2luLXJpZ2h0OjVweH0uZW1vdGUtbWVudSAuZm9vdGVyIC5wdWxsLXJpZ2h0e21hcmdpbi1sZWZ0OjVweH0uZW1vdGUtbWVudSAuaWNvbntoZWlnaHQ6MTZweDt3aWR0aDoxNnB4O29wYWNpdHk6LjU7YmFja2dyb3VuZC1zaXplOmNvbnRhaW4haW1wb3J0YW50fS5lbW90ZS1tZW51IC5pY29uOmhvdmVye29wYWNpdHk6MX0uZW1vdGUtbWVudSAuaWNvbi1ob21le2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTmpRaURRb2dJQ0JvWldsbmFIUTlJalkwSWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURZMElEWTBJZzBLSUNBZ2FXUTlJa05oY0dGZk1TSU5DaUFnSUhodGJEcHpjR0ZqWlQwaWNISmxjMlZ5ZG1VaVBqeHRaWFJoWkdGMFlRMEtJQ0FnYVdROUltMWxkR0ZrWVhSaE16QXdNU0krUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6STVPVGtpSUM4K0RRbzhjR0YwYUEwS0lDQWdaRDBpYlNBMU55NHdOaklzTXpFdU16azRJR01nTUM0NU16SXNMVEV1TURJMUlEQXVPRFF5TEMweUxqVTVOaUF0TUM0eU1ERXNMVE11TlRBNElFd2dNek11T0RnMExEY3VOemcxSUVNZ016SXVPRFF4TERZdU9EY3pJRE14TGpFMk9TdzJMamc1TWlBek1DNHhORGdzTnk0NE1qZ2dUQ0EzTGpBNU15d3lPQzQ1TmpJZ1l5QXRNUzR3TWpFc01DNDVNellnTFRFdU1EY3hMREl1TlRBMUlDMHdMakV4TVN3ekxqVXdNeUJzSURBdU5UYzRMREF1TmpBeUlHTWdNQzQ1TlRrc01DNDVPVGdnTWk0MU1Ea3NNUzR4TVRjZ015NDBOaXd3TGpJMk5TQnNJREV1TnpJekxDMHhMalUwTXlCMklESXlMalU1SUdNZ01Dd3hMak00TmlBeExqRXlNeXd5TGpVd09DQXlMalV3T0N3eUxqVXdPQ0JvSURndU9UZzNJR01nTVM0ek9EVXNNQ0F5TGpVd09Dd3RNUzR4TWpJZ01pNDFNRGdzTFRJdU5UQTRJRllnTXpndU5UYzFJR2dnTVRFdU5EWXpJSFlnTVRVdU9EQTBJR01nTFRBdU1ESXNNUzR6T0RVZ01DNDVOekVzTWk0MU1EY2dNaTR6TlRZc01pNDFNRGNnYUNBNUxqVXlOQ0JqSURFdU16ZzFMREFnTWk0MU1EZ3NMVEV1TVRJeUlESXVOVEE0TEMweUxqVXdPQ0JXSURNeUxqRXdOeUJqSURBc01DQXdMalEzTml3d0xqUXhOeUF4TGpBMk15d3dMamt6TXlBd0xqVTROaXd3TGpVeE5TQXhMamd4Tnl3d0xqRXdNaUF5TGpjME9Td3RNQzQ1TWpRZ2JDQXdMalkxTXl3dE1DNDNNVGdnZWlJTkNpQWdJR2xrUFNKd1lYUm9Nams1TlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptWm1abVk3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejQ9KSBuby1yZXBlYXQgNTAlfS5lbW90ZS1tZW51IC5pY29uLWdlYXJ7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNakV1TlRraURRb2dJQ0JvWldsbmFIUTlJakl4TGpFek5qazVPU0lOQ2lBZ0lIWnBaWGRDYjNnOUlqQWdNQ0F5TVM0MU9TQXlNUzR4TXpjaURRb2dJQ0JwWkQwaVEyRndZVjh4SWcwS0lDQWdlRzFzT25Od1lXTmxQU0p3Y21WelpYSjJaU0krUEcxbGRHRmtZWFJoRFFvZ0lDQnBaRDBpYldWMFlXUmhkR0V6T1NJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jek0zSWlBdlBnMEtQSEJoZEdnTkNpQWdJR1E5SWswZ01UZ3VOakl5TERndU1UUTFJREU0TGpBM055dzJMamcxSUdNZ01Dd3dJREV1TWpZNExDMHlMamcyTVNBeExqRTFOaXd0TWk0NU56RWdUQ0F4Tnk0MU5UUXNNaTR5TkNCRElERTNMalF6T0N3eUxqRXlOeUF4TkM0MU56WXNNeTQwTXpNZ01UUXVOVGMyTERNdU5ETXpJRXdnTVRNdU1qVTJMREl1T1NCRElERXpMakkxTml3eUxqa2dNVEl1TURrc01DQXhNUzQ1TXl3d0lFZ2dPUzQxTmpFZ1F5QTVMak01Tml3d0lEZ3VNekUzTERJdU9UQTJJRGd1TXpFM0xESXVPVEEySUV3Z05pNDVPVGtzTXk0ME5ERWdZeUF3TERBZ0xUSXVPVEl5TEMweExqSTBNaUF0TXk0d016UXNMVEV1TVRNeElFd2dNaTR5T0Rrc015NDVOVEVnUXlBeUxqRTNNeXcwTGpBMk5DQXpMalV3Tnl3MkxqZzJOeUF6TGpVd055dzJMamcyTnlCTUlESXVPVFl5TERndU1UWWdReUF5TGprMk1pdzRMakUySURBc09TNHpNREVnTUN3NUxqUTFOU0IySURJdU16SXlJR01nTUN3d0xqRTJNaUF5TGprMk9Td3hMakl4T1NBeUxqazJPU3d4TGpJeE9TQnNJREF1TlRRMUxERXVNamt4SUdNZ01Dd3dJQzB4TGpJMk9Dd3lMamcxT1NBdE1TNHhOVGNzTWk0NU5qa2diQ0F4TGpZM09Dd3hMalkwTXlCaklEQXVNVEUwTERBdU1URXhJREl1T1RjM0xDMHhMakU1TlNBeUxqazNOeXd0TVM0eE9UVWdiQ0F4TGpNeU1Td3dMalV6TlNCaklEQXNNQ0F4TGpFMk5pd3lMamc1T0NBeExqTXlOeXd5TGpnNU9DQm9JREl1TXpZNUlHTWdNQzR4TmpRc01DQXhMakkwTkN3dE1pNDVNRFlnTVM0eU5EUXNMVEl1T1RBMklHd2dNUzR6TWpJc0xUQXVOVE0xSUdNZ01Dd3dJREl1T1RFMkxERXVNalF5SURNdU1ESTVMREV1TVRNeklHd2dNUzQyTnpnc0xURXVOalF4SUdNZ01DNHhNVGNzTFRBdU1URTFJQzB4TGpJeUxDMHlMamt4TmlBdE1TNHlNaXd0TWk0NU1UWWdiQ0F3TGpVME5Dd3RNUzR5T1RNZ1l5QXdMREFnTWk0NU5qTXNMVEV1TVRReklESXVPVFl6TEMweExqSTVPU0JXSURrdU16WWdReUF5TVM0MU9TdzVMakU1T1NBeE9DNDJNaklzT0M0eE5EVWdNVGd1TmpJeUxEZ3VNVFExSUhvZ2JTQXROQzR6TmpZc01pNDBNak1nWXlBd0xERXVPRFkzSUMweExqVTFNeXd6TGpNNE55QXRNeTQwTmpFc015NHpPRGNnTFRFdU9UQTJMREFnTFRNdU5EWXhMQzB4TGpVeUlDMHpMalEyTVN3dE15NHpPRGNnTUN3dE1TNDROamNnTVM0MU5UVXNMVE11TXpnMUlETXVORFl4TEMwekxqTTROU0F4TGprd09Td3dMakF3TVNBekxqUTJNU3d4TGpVeE9DQXpMalEyTVN3ekxqTTROU0I2SWcwS0lDQWdhV1E5SW5CaGRHZ3pJZzBLSUNBZ2MzUjViR1U5SW1acGJHdzZJMFpHUmtaR1JpSWdMejROQ2p4bkRRb2dJQ0JwWkQwaVp6VWlQZzBLUEM5blBnMEtQR2NOQ2lBZ0lHbGtQU0puTnlJK0RRbzhMMmMrRFFvOFp3MEtJQ0FnYVdROUltYzVJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFeElqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekV6SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RTFJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFM0lqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekU1SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6SXhJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJeklqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekkxSWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6STNJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJNUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaek14SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6TXpJajROQ2p3dlp6NE5Dand2YzNablBnMEspIG5vLXJlcGVhdCA1MCV9LmVtb3RlLW1lbnUuZWRpdGluZyAuaWNvbi1nZWFyey13ZWJraXQtYW5pbWF0aW9uOnNwaW4gNHMgbGluZWFyIGluZmluaXRlO2FuaW1hdGlvbjpzcGluIDRzIGxpbmVhciBpbmZpbml0ZX0uZW1vdGUtbWVudSAuaWNvbi1yZXNpemUtaGFuZGxle2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTVRZaURRb2dJQ0JvWldsbmFIUTlJakUySWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURFMklERTJJZzBLSUNBZ2FXUTlJa05oY0dGZk1TSU5DaUFnSUhodGJEcHpjR0ZqWlQwaWNISmxjMlZ5ZG1VaVBqeHRaWFJoWkdGMFlRMEtJQ0FnYVdROUltMWxkR0ZrWVhSaE5ETTFOeUkrUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6UXpOVFVpSUM4K0RRbzhjR0YwYUEwS0lDQWdaRDBpVFNBeE15NDFMRGdnUXlBeE15NHlNalVzT0NBeE15dzRMakl5TkNBeE15dzRMalVnZGlBekxqYzVNeUJNSURNdU56QTNMRE1nU0NBM0xqVWdReUEzTGpjM05pd3pJRGdzTWk0M056WWdPQ3d5TGpVZ09Dd3lMakl5TkNBM0xqYzNOaXd5SURjdU5Td3lJR2dnTFRVZ1RDQXlMak13T1N3eUxqQXpPU0F5TGpFMUxESXVNVFEwSURJdU1UUTJMREl1TVRRMklESXVNVFF6TERJdU1UVXlJREl1TURNNUxESXVNekE1SURJc01pNDFJSFlnTlNCRElESXNOeTQzTnpZZ01pNHlNalFzT0NBeUxqVXNPQ0F5TGpjM05pdzRJRE1zTnk0M056WWdNeXczTGpVZ1ZpQXpMamN3TnlCTUlERXlMakk1TXl3eE15QklJRGd1TlNCRElEZ3VNakkwTERFeklEZ3NNVE11TWpJMUlEZ3NNVE11TlNBNExERXpMamMzTlNBNExqSXlOQ3d4TkNBNExqVXNNVFFnYUNBMUlHd2dNQzR4T1RFc0xUQXVNRE01SUdNZ01DNHhNakVzTFRBdU1EVXhJREF1TWpJc0xUQXVNVFE0SURBdU1qY3NMVEF1TWpjZ1RDQXhOQ3d4TXk0MU1ESWdWaUE0TGpVZ1F5QXhOQ3c0TGpJeU5DQXhNeTQzTnpVc09DQXhNeTQxTERnZ2VpSU5DaUFnSUdsa1BTSndZWFJvTkRNMU1TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTm1abVptWm1ZN1ptbHNiQzF2Y0dGamFYUjVPakVpSUM4K0RRbzhMM04yWno0PSkgbm8tcmVwZWF0IDUwJTtjdXJzb3I6bndzZS1yZXNpemUhaW1wb3J0YW50fS5lbW90ZS1tZW51IC5pY29uLXBpbntiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UWWlEUW9nSUNCb1pXbG5hSFE5SWpFMklnMEtJQ0FnYVdROUluTjJaek13TURVaVBnMEtJQ0E4YldWMFlXUmhkR0VOQ2lBZ0lDQWdhV1E5SW0xbGRHRmtZWFJoTXpBeU15SStEUW9nSUNBZ1BISmtaanBTUkVZK0RRb2dJQ0FnSUNBOFkyTTZWMjl5YXcwS0lDQWdJQ0FnSUNBZ2NtUm1PbUZpYjNWMFBTSWlQZzBLSUNBZ0lDQWdJQ0E4WkdNNlptOXliV0YwUG1sdFlXZGxMM04yWnl0NGJXdzhMMlJqT21admNtMWhkRDROQ2lBZ0lDQWdJQ0FnUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUNBZ2NtUm1PbkpsYzI5MWNtTmxQU0pvZEhSd09pOHZjSFZ5YkM1dmNtY3ZaR012WkdOdGFYUjVjR1V2VTNScGJHeEpiV0ZuWlNJZ0x6NE5DaUFnSUNBZ0lDQWdQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrRFFvZ0lDQWdJQ0E4TDJOak9sZHZjbXMrRFFvZ0lDQWdQQzl5WkdZNlVrUkdQZzBLSUNBOEwyMWxkR0ZrWVhSaFBnMEtJQ0E4WkdWbWN3MEtJQ0FnSUNCcFpEMGlaR1ZtY3pNd01qRWlJQzgrRFFvZ0lEeG5EUW9nSUNBZ0lIUnlZVzV6Wm05eWJUMGliV0YwY21sNEtEQXVOemt6TURjNE1pd3dMREFzTUM0M09UTXdOemd5TEMweUxqRTNNRGs0TlN3dE9ERTBMalk1TWprNUtTSU5DaUFnSUNBZ2FXUTlJbWN6TURBM0lqNE5DaUFnSUNBOFp3MEtJQ0FnSUNBZ0lIUnlZVzV6Wm05eWJUMGliV0YwY21sNEtEQXVOekEzTVRFc01DNDNNRGN4TVN3dE1DNDNNRGN4TVN3d0xqY3dOekV4TERjek55NDNNRGMxTlN3eU9UVXVORGc0TURncElnMEtJQ0FnSUNBZ0lHbGtQU0puTXpBd09TSStEUW9nSUNBZ0lDQThadzBLSUNBZ0lDQWdJQ0FnYVdROUltY3pOelUxSWo0TkNpQWdJQ0FnSUNBZ1BIQmhkR2dOQ2lBZ0lDQWdJQ0FnSUNBZ1pEMGlUU0E1TGpjNE1USTFMREFnUXlBNUxqUTNOREExTmpJc01DNDJPRGt4TVRJZ09TNDFNakEyT0N3eExqVXlNekE0TlRNZ09TNHpNVEkxTERJdU1UZzNOU0JNSURRdU9UTTNOU3cyTGpVNU16YzFJRU1nTXk0NU5UZzVOakE0TERZdU5ESTVORGd6SURJdU9UUTNOelUwT0N3MkxqVXpNamM0T1RrZ01pdzJMamd4TWpVZ1RDQTFMakF6TVRJMUxEa3VPRFF6TnpVZ01DNDFOakkxTERFMExqTXhNalVnTUN3eE5pQkRJREF1TlRZNU1qazJNamdzTVRVdU56azFOakkySURFdU1UWTNOek0zT0N3eE5TNDJOREF5TXpjZ01TNDNNVGczTlN3eE5TNDBNRFl5TlNCTUlEWXVNVFUyTWpVc01UQXVPVFk0TnpVZ09TNHhPRGMxTERFMElHTWdNQzR5TnprMk9ESXpMQzB3TGprME56YzRNeUF3TGpNNE16RTFNamdzTFRFdU9UVTRPVE0zSURBdU1qRTROelVzTFRJdU9UTTNOU0F4TGpVd01EQXhNU3d0TVM0ME9EazFOems0SURNdU1EQXdNREF4TEMweUxqazNPVEUxT1NBMExqVXNMVFF1TkRZNE56VWdNQzQyTURFeE1ESXNMVEF1TURNeE16WXhJREV1T0RJeU1UTTRMQzB3TGpBNU5qRXpOeUF5TEMwd0xqUTJPRGMxSUVNZ01UTXVPRGM1T0RreUxEUXVNRFk1TkRnd015QXhNUzQ0TkRJNE5qVXNNaTR3TWpBeU1qZ3lJRGt1TnpneE1qVXNNQ0I2SWcwS0lDQWdJQ0FnSUNBZ0lDQjBjbUZ1YzJadmNtMDlJbTFoZEhKcGVDZ3dMamc1TVRVNU16YzBMQzB3TGpnNU1UVTVNemMwTERBdU9Ea3hOVGt6TnpRc01DNDRPVEUxT1RNM05Dd3RNaTR5TmpVMUxERXdNemN1TVRNME5Ta2lEUW9nSUNBZ0lDQWdJQ0FnSUdsa1BTSndZWFJvTXpBeE1TSU5DaUFnSUNBZ0lDQWdJQ0FnYzNSNWJHVTlJbVpwYkd3NkkyWm1abVptWmp0bWFXeHNMVzl3WVdOcGRIazZNU0lnTHo0TkNpQWdJQ0FnSUR3dlp6NE5DaUFnSUNBOEwyYytEUW9nSUR3dlp6NE5Dand2YzNablBnMEspIG5vLXJlcGVhdCA1MCU7LXdlYmtpdC10cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7dHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlfS5lbW90ZS1tZW51IC5pY29uLXBpbjpob3ZlciwuZW1vdGUtbWVudS5waW5uZWQgLmljb24tcGluey13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpOy1tcy10cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO29wYWNpdHk6MX0uZW1vdGUtbWVudSAuc2Nyb2xsYWJsZS5kZWZhdWx0LXNraW57cGFkZGluZy1yaWdodDowO3BhZGRpbmctYm90dG9tOjB9LmVtb3RlLW1lbnUgLnNjcm9sbGFibGUuZGVmYXVsdC1za2luIC5zY3JvbGwtYmFyIC50aHVtYntiYWNrZ3JvdW5kLWNvbG9yOiM1NTU7b3BhY2l0eTouMjt6LWluZGV4OjF9LmVtb3RlLW1lbnUgLmVkaXQtdG9vbHtiYWNrZ3JvdW5kLXBvc2l0aW9uOjUwJTtiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7YmFja2dyb3VuZC1zaXplOjE0cHg7Ym9yZGVyLXJhZGl1czo0cHg7Ym9yZGVyOjFweCBzb2xpZCAjMDAwO2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6bm9uZTtoZWlnaHQ6MTRweDtvcGFjaXR5Oi4yNTtwb3NpdGlvbjphYnNvbHV0ZTstd2Via2l0LXRyYW5zaXRpb246YWxsIC4yNXMgZWFzZTt0cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7d2lkdGg6MTRweDt6LWluZGV4OjF9LmVtb3RlLW1lbnUgLmVkaXQtdG9vbDpob3ZlciwuZW1vdGUtbWVudSAuZW1vdGU6aG92ZXIgLmVkaXQtdG9vbHtvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLmVkaXQtdmlzaWJpbGl0eXtiYWNrZ3JvdW5kLWNvbG9yOiMwMGM4MDA7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVEF3SWcwS0lDQWdhR1ZwWjJoMFBTSXhNREFpRFFvZ0lDQjJhV1YzUW05NFBTSXdJREFnTVRBd0lERXdNQ0lOQ2lBZ0lHbGtQU0pNWVhsbGNsOHhJZzBLSUNBZ2VHMXNPbk53WVdObFBTSndjbVZ6WlhKMlpTSStQRzFsZEdGa1lYUmhEUW9nSUNCcFpEMGliV1YwWVdSaGRHRTVJajQ4Y21SbU9sSkVSajQ4WTJNNlYyOXlhdzBLSUNBZ0lDQWdJSEprWmpwaFltOTFkRDBpSWo0OFpHTTZabTl5YldGMFBtbHRZV2RsTDNOMlp5dDRiV3c4TDJSak9tWnZjbTFoZEQ0OFpHTTZkSGx3WlEwS0lDQWdJQ0FnSUNBZ2NtUm1PbkpsYzI5MWNtTmxQU0pvZEhSd09pOHZjSFZ5YkM1dmNtY3ZaR012WkdOdGFYUjVjR1V2VTNScGJHeEpiV0ZuWlNJZ0x6NDhaR002ZEdsMGJHVStQQzlrWXpwMGFYUnNaVDQ4TDJOak9sZHZjbXMrUEM5eVpHWTZVa1JHUGp3dmJXVjBZV1JoZEdFK1BHUmxabk1OQ2lBZ0lHbGtQU0prWldaek55SWdMejROQ2p4d1lYUm9EUW9nSUNCa1BTSk5JRGszTGprMk5DdzBOaTQxTkRnZ1F5QTVOeTR3T1Rnc05EVXVOVEk0SURjMkxqUXlOeXd5TVM0Mk1ETWdOVEFzTWpFdU5qQXpJR01nTFRJMkxqUXlOeXd3SUMwME55NHdPVGdzTWpNdU9USTFJQzAwTnk0NU5qVXNNalF1T1RRMklDMHhMamN3TVN3eUlDMHhMamN3TVN3MExqa3dNaUF4TUdVdE5DdzJMamt3TXlBd0xqZzJOaXd4TGpBeUlESXhMalV6Tnl3eU5DNDVORFVnTkRjdU9UWTBMREkwTGprME5TQXlOaTQwTWpjc01DQTBOeTR3T1Rnc0xUSXpMamt5TmlBME55NDVOalVzTFRJMExqazBOaUF4TGpjd01Td3RNaUF4TGpjd01Td3ROQzQ1TURJZ0xUQXVNREF4TEMwMkxqa3dNeUI2SUUwZ05UZ3VNRGN6TERNMUxqazNOU0JqSURFdU56YzNMQzB3TGprM0lEUXVNalUxTERBdU1UUXpJRFV1TlRNMExESXVORGcxSURFdU1qYzVMREl1TXpReklEQXVPRGMxTERVdU1ESTVJQzB3TGprd01pdzFMams1T1NBdE1TNDNOemNzTUM0NU56RWdMVFF1TWpVMUxDMHdMakUwTXlBdE5TNDFNelVzTFRJdU5EZzFJQzB4TGpJM09Td3RNaTR6TkRNZ0xUQXVPRGMxTEMwMUxqQXlPU0F3TGprd015d3ROUzQ1T1RrZ2VpQk5JRFV3TERZNUxqY3lPU0JESURNeExqVTBMRFk1TGpjeU9TQXhOaTR3TURVc05UVXVOVFV6SURFd0xqWXlPQ3cxTUNBeE5DNHlOVGtzTkRZdU1qUTVJREl5TGpVeU5pd3pPQzQxTnpFZ016TXVNVGsxTERNekxqazNPU0F6TVM0eE1UUXNNemN1TVRRMUlESTVMamc1TkN3ME1DNDVNamdnTWprdU9EazBMRFExSUdNZ01Dd3hNUzR4TURRZ09TNHdNREVzTWpBdU1UQTFJREl3TGpFd05Td3lNQzR4TURVZ01URXVNVEEwTERBZ01qQXVNVEEyTEMwNUxqQXdNU0F5TUM0eE1EWXNMVEl3TGpFd05TQXdMQzAwTGpBM01pQXRNUzR5TVRrc0xUY3VPRFUxSUMwekxqTXNMVEV4TGpBeU1TQkRJRGMzTGpRM05Dd3pPQzQxTnpJZ09EVXVOelF4TERRMkxqSTFJRGc1TGpNM01pdzFNQ0E0TXk0NU9UVXNOVFV1TlRVMUlEWTRMalEyTERZNUxqY3lPU0ExTUN3Mk9TNDNNamtnZWlJTkNpQWdJR2xrUFNKd1lYUm9NeUlnTHo0TkNqd3ZjM1puUGc9PSl9LmVtb3RlLW1lbnUgLmVkaXQtc3RhcnJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMzMjMyMzI7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlOVEFpRFFvZ0lDQm9aV2xuYUhROUlqVXdJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJRFV3SURVd0lnMEtJQ0FnYVdROUlreGhlV1Z5WHpFaURRb2dJQ0I0Yld3NmMzQmhZMlU5SW5CeVpYTmxjblpsSWo0OGJXVjBZV1JoZEdFTkNpQWdJR2xrUFNKdFpYUmhaR0YwWVRNd01ERWlQanh5WkdZNlVrUkdQanhqWXpwWGIzSnJEUW9nSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGp4a1l6cG1iM0p0WVhRK2FXMWhaMlV2YzNabkszaHRiRHd2WkdNNlptOXliV0YwUGp4a1l6cDBlWEJsRFFvZ0lDQWdJQ0FnSUNCeVpHWTZjbVZ6YjNWeVkyVTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlrWTIxcGRIbHdaUzlUZEdsc2JFbHRZV2RsSWlBdlBqeGtZenAwYVhSc1pUNDhMMlJqT25ScGRHeGxQand2WTJNNlYyOXlhejQ4TDNKa1pqcFNSRVkrUEM5dFpYUmhaR0YwWVQ0OFpHVm1jdzBLSUNBZ2FXUTlJbVJsWm5NeU9UazVJaUF2UGcwS1BIQmhkR2dOQ2lBZ0lHUTlJbTBnTkRNdU1EUXNNakl1TmprMklDMDNMalUyT0N3M0xqTTNOeUF4TGpjNE55d3hNQzQwTVRjZ1l5QXdMakV5Tnl3d0xqYzFJQzB3TGpFNE1pd3hMalV3T1NBdE1DNDNPVGNzTVM0NU5UY2dMVEF1TXpRNExEQXVNalV6SUMwd0xqYzJNaXd3TGpNNE1pQXRNUzR4TnpZc01DNHpPRElnTFRBdU16RTRMREFnTFRBdU5qTTRMQzB3TGpBM05pQXRNQzQ1TXpFc0xUQXVNak1nVENBeU5Td3pOeTQyT0RFZ01UVXVOalExTERReUxqVTVPU0JqSUMwd0xqWTNOQ3d3TGpNMU5TQXRNUzQwT1N3d0xqSTVOU0F0TWk0eE1EY3NMVEF1TVRVeElFTWdNVEl1T1RJekxEUXlJREV5TGpZeE5DdzBNUzR5TkRJZ01USXVOelF6TERRd0xqUTVNU0JNSURFMExqVXpMRE13TGpBM05DQTJMamsyTWl3eU1pNDJPVGNnUXlBMkxqUXhOU3d5TWk0eE5qWWdOaTR5TWpFc01qRXVNemN4SURZdU5EVTBMREl3TGpZME55QTJMalk1TERFNUxqa3lNeUEzTGpNeE5Td3hPUzR6T1RZZ09DNHdOamtzTVRrdU1qZzJJR3dnTVRBdU5EVTVMQzB4TGpVeU1TQTBMalk0TEMwNUxqUTNPQ0JESURJekxqVTBNeXczTGpZd015QXlOQzR5TXprc055NHhOekVnTWpVc055NHhOekVnWXlBd0xqYzJNeXd3SURFdU5EVTJMREF1TkRNeUlERXVOemt6TERFdU1URTFJR3dnTkM0Mk56a3NPUzQwTnpnZ01UQXVORFl4TERFdU5USXhJR01nTUM0M05USXNNQzR4TURrZ01TNHpOemtzTUM0Mk16Y2dNUzQyTVRJc01TNHpOakVnTUM0eU16Y3NNQzQzTWpRZ01DNHdNemdzTVM0MU1Ua2dMVEF1TlRBMUxESXVNRFVnZWlJTkNpQWdJR2xrUFNKd1lYUm9Nams1TlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lOalkyTmpZMk03Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejROQ2c9PSl9LmVtb3RlLW1lbnUgLmVtb3RlPi5lZGl0LXZpc2liaWxpdHl7Ym90dG9tOmF1dG87bGVmdDphdXRvO3JpZ2h0OjA7dG9wOjB9LmVtb3RlLW1lbnUgLmVtb3RlPi5lZGl0LXN0YXJyZWR7Ym90dG9tOmF1dG87bGVmdDowO3JpZ2h0OmF1dG87dG9wOjB9LmVtb3RlLW1lbnUgLmhlYWRlci1pbmZvPi5lZGl0LXRvb2x7bWFyZ2luLWxlZnQ6NXB4fS5lbW90ZS1tZW51LmVkaXRpbmcgLmVkaXQtdG9vbHtkaXNwbGF5OmlubGluZS1ibG9ja30uZW1vdGUtbWVudSAuZW1vdGUtbWVudS1oaWRkZW4gLmVkaXQtdmlzaWJpbGl0eXtiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UQXdJZzBLSUNBZ2FHVnBaMmgwUFNJeE1EQWlEUW9nSUNCMmFXVjNRbTk0UFNJd0lEQWdNVEF3SURFd01DSU5DaUFnSUdsa1BTSk1ZWGxsY2w4eklnMEtJQ0FnZUcxc09uTndZV05sUFNKd2NtVnpaWEoyWlNJK1BHMWxkR0ZrWVhSaERRb2dJQ0JwWkQwaWJXVjBZV1JoZEdFeE5TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pFeklpQXZQZzBLUEdjTkNpQWdJR2xrUFNKbk15SStEUW9KUEhCaGRHZ05DaUFnSUdROUlrMGdOekF1TURneUxEUTFMalEzTlNBMU1DNDBOelFzTmpVdU1EZ3lJRU1nTmpFdU1UazRMRFkwTGpnek1TQTJPUzQ0TXpFc05UWXVNVGszSURjd0xqQTRNaXcwTlM0ME56VWdlaUlOQ2lBZ0lHbGtQU0p3WVhSb05TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTkdSa1pHUmtZaUlDOCtEUW9KUEhCaGRHZ05DaUFnSUdROUltMGdPVGN1T1RZMExEUTJMalUwT0NCaklDMHdMalExTEMwd0xqVXlPU0F0Tmk0eU5EVXNMVGN1TWpNZ0xURTFMalF3TXl3dE1UTXVOVFUwSUd3Z0xUWXVNaXcyTGpJZ1F5QTRNaTR6TlRFc05ETXVNVFE0SURnMkxqa3lMRFEzTGpRMk9TQTRPUzR6TnpJc05UQWdPRE11T1RrMUxEVTFMalUxTlNBMk9DNDBOaXcyT1M0M01qa2dOVEFzTmprdU56STVJR01nTFRFdU16TTBMREFnTFRJdU5qVXhMQzB3TGpBNE1pQXRNeTQ1TlRJc0xUQXVNakl5SUd3Z0xUY3VORE01TERjdU5ETTVJR01nTXk0Mk16a3NNQzQ1TURrZ055NDBORGtzTVM0ME5TQXhNUzR6T1RFc01TNDBOU0F5Tmk0ME1qY3NNQ0EwTnk0d09UZ3NMVEl6TGpreU5pQTBOeTQ1TmpVc0xUSTBMamswTmlBeExqY3dNU3d0TVM0NU9Ua2dNUzQzTURFc0xUUXVPVEF4SUMwd0xqQXdNU3d0Tmk0NU1ESWdlaUlOQ2lBZ0lHbGtQU0p3WVhSb055SU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTkdSa1pHUmtZaUlDOCtEUW9KUEhCaGRHZ05DaUFnSUdROUltMGdPVEV1TkRFeExERTJMalkySUdNZ01Dd3RNQzR5TmpZZ0xUQXVNVEExTEMwd0xqVXlJQzB3TGpJNU15d3RNQzQzTURjZ2JDQXROeTR3TnpFc0xUY3VNRGNnWXlBdE1DNHpPVEVzTFRBdU16a3hJQzB4TGpBeU15d3RNQzR6T1RFZ0xURXVOREUwTERBZ1RDQTJOaTQ0TURRc01qUXVOekV4SUVNZ05qRXVOakF5TERJeUxqZ3hPQ0ExTlM0NU5Ea3NNakV1TmpBeklEVXdMREl4TGpZd015QmpJQzB5Tmk0ME1qY3NNQ0F0TkRjdU1EazRMREl6TGpreU5pQXRORGN1T1RZMUxESTBMamswTmlBdE1TNDNNREVzTWlBdE1TNDNNREVzTkM0NU1ESWdNVEJsTFRRc05pNDVNRE1nTUM0MU1UY3NNQzQyTURjZ09DNHdPRE1zT1M0ek5UUWdNVGt1TnpBM0xERTJMak15SUV3Z09DNDRPRE1zT0RJdU5qTXlJRU1nT0M0Mk9UVXNPREl1T0RJZ09DNDFPU3c0TXk0d056TWdPQzQxT1N3NE15NHpNemtnWXlBd0xEQXVNalkySURBdU1UQTFMREF1TlRJZ01DNHlPVE1zTUM0M01EY2diQ0EzTGpBM01TdzNMakEzSUdNZ01DNHhPVFVzTUM0eE9UVWdNQzQwTlRFc01DNHlPVE1nTUM0M01EY3NNQzR5T1RNZ01DNHlOVFlzTUNBd0xqVXhNaXd0TUM0d09UZ2dNQzQzTURjc0xUQXVNamt6SUd3Z056TXVOelVzTFRjekxqYzFJR01nTUM0eE9EY3NMVEF1TVRnMklEQXVNamt6TEMwd0xqUTBJREF1TWprekxDMHdMamN3TmlCNklFMGdNVEF1TmpJNExEVXdJRU1nTVRRdU1qVTVMRFEyTGpJME9TQXlNaTQxTWpZc016Z3VOVGN4SURNekxqRTVOU3d6TXk0NU56a2dNekV1TVRFMExETTNMakUwTlNBeU9TNDRPVFFzTkRBdU9USTRJREk1TGpnNU5DdzBOU0JqSURBc05DNDJOalVnTVM0Mk1ERXNPQzQ1TkRVZ05DNHlOeXd4TWk0ek5URWdUQ0F5T0M0d05DdzJNeTQwTnpVZ1F5QXhPUzQ0T0Rnc05UZ3VPVFUxSURFekxqWTBPU3cxTXk0eE1pQXhNQzQyTWpnc05UQWdlaUlOQ2lBZ0lHbGtQU0p3WVhSb09TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTkdSa1pHUmtZaUlDOCtEUW84TDJjK0RRbzhMM04yWno0TkNnPT0pO2JhY2tncm91bmQtY29sb3I6cmVkfS5lbW90ZS1tZW51IC5lbW90ZS1tZW51LXN0YXJyZWQgLmVkaXQtc3RhcnJlZHtiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU5UQWlEUW9nSUNCb1pXbG5hSFE5SWpVd0lnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lEVXdJRFV3SWcwS0lDQWdhV1E5SWt4aGVXVnlYekVpRFFvZ0lDQjRiV3c2YzNCaFkyVTlJbkJ5WlhObGNuWmxJajQ4YldWMFlXUmhkR0VOQ2lBZ0lHbGtQU0p0WlhSaFpHRjBZVE13TURFaVBqeHlaR1k2VWtSR1BqeGpZenBYYjNKckRRb2dJQ0FnSUNBZ2NtUm1PbUZpYjNWMFBTSWlQanhrWXpwbWIzSnRZWFErYVcxaFoyVXZjM1puSzNodGJEd3ZaR002Wm05eWJXRjBQanhrWXpwMGVYQmxEUW9nSUNBZ0lDQWdJQ0J5WkdZNmNtVnpiM1Z5WTJVOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWtZMjFwZEhsd1pTOVRkR2xzYkVsdFlXZGxJaUF2UGp4a1l6cDBhWFJzWlQ0OEwyUmpPblJwZEd4bFBqd3ZZMk02VjI5eWF6NDhMM0prWmpwU1JFWStQQzl0WlhSaFpHRjBZVDQ4WkdWbWN3MEtJQ0FnYVdROUltUmxabk15T1RrNUlpQXZQZzBLUEhCaGRHZ05DaUFnSUdROUltMGdORE11TURRc01qSXVOamsySUMwM0xqVTJPQ3czTGpNM055QXhMamM0Tnl3eE1DNDBNVGNnWXlBd0xqRXlOeXd3TGpjMUlDMHdMakU0TWl3eExqVXdPU0F0TUM0M09UY3NNUzQ1TlRjZ0xUQXVNelE0TERBdU1qVXpJQzB3TGpjMk1pd3dMak00TWlBdE1TNHhOellzTUM0ek9ESWdMVEF1TXpFNExEQWdMVEF1TmpNNExDMHdMakEzTmlBdE1DNDVNekVzTFRBdU1qTWdUQ0F5TlN3ek55NDJPREVnTVRVdU5qUTFMRFF5TGpVNU9TQmpJQzB3TGpZM05Dd3dMak0xTlNBdE1TNDBPU3d3TGpJNU5TQXRNaTR4TURjc0xUQXVNVFV4SUVNZ01USXVPVEl6TERReUlERXlMall4TkN3ME1TNHlORElnTVRJdU56UXpMRFF3TGpRNU1TQk1JREUwTGpVekxETXdMakEzTkNBMkxqazJNaXd5TWk0Mk9UY2dReUEyTGpReE5Td3lNaTR4TmpZZ05pNHlNakVzTWpFdU16Y3hJRFl1TkRVMExESXdMalkwTnlBMkxqWTVMREU1TGpreU15QTNMak14TlN3eE9TNHpPVFlnT0M0d05qa3NNVGt1TWpnMklHd2dNVEF1TkRVNUxDMHhMalV5TVNBMExqWTRMQzA1TGpRM09DQkRJREl6TGpVME15dzNMall3TXlBeU5DNHlNemtzTnk0eE56RWdNalVzTnk0eE56RWdZeUF3TGpjMk15d3dJREV1TkRVMkxEQXVORE15SURFdU56a3pMREV1TVRFMUlHd2dOQzQyTnprc09TNDBOemdnTVRBdU5EWXhMREV1TlRJeElHTWdNQzQzTlRJc01DNHhNRGtnTVM0ek56a3NNQzQyTXpjZ01TNDJNVElzTVM0ek5qRWdNQzR5TXpjc01DNDNNalFnTUM0d016Z3NNUzQxTVRrZ0xUQXVOVEExTERJdU1EVWdlaUlOQ2lBZ0lHbGtQU0p3WVhSb01qazVOU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1Oak1EQTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6NE5DZz09KX0uZW1vdGUtbWVudSAuZW1vdGUuZW1vdGUtbWVudS1zdGFycmVke2JvcmRlci1jb2xvcjpyZ2JhKDIwMCwyMDAsMCwuNSl9LmVtb3RlLW1lbnUgLmVtb3RlLmVtb3RlLW1lbnUtaGlkZGVue2JvcmRlci1jb2xvcjpyZ2JhKDI1NSwwLDAsLjUpfS5lbW90ZS1tZW51Om5vdCguZWRpdGluZykgLmVtb3RlLW1lbnUtaGlkZGVue2Rpc3BsYXk6bm9uZX0uZW1vdGUtbWVudTpub3QoLmVkaXRpbmcpICNzdGFycmVkLWVtb3Rlcy1ncm91cCAuZW1vdGUtbWVudS1zdGFycmVke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudH0uZW1vdGUtbWVudSAjc3RhcnJlZC1lbW90ZXMtZ3JvdXB7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6IzY0NjQ2NH0uZW1vdGUtbWVudSAjc3RhcnJlZC1lbW90ZXMtZ3JvdXA6ZW1wdHk6YmVmb3Jle2NvbnRlbnQ6XFxcIlVzZSB0aGUgZWRpdCBtb2RlIHRvIHN0YXIgYW4gZW1vdGUhXFxcIjtwb3NpdGlvbjpyZWxhdGl2ZTt0b3A6OHB4fVwiKSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgSG9nYW4gPSByZXF1aXJlKCdob2dhbi5qcy9saWIvdGVtcGxhdGUuanMnKTtcbiAgICB2YXIgdGVtcGxhdGVzID0ge307XG4gICAgdGVtcGxhdGVzWydlbW90ZSddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJlbW90ZVwiKTtpZih0LnModC5mKFwidGhpcmRQYXJ0eVwiLGMscCwxKSxjLHAsMCwzMiw0NCxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIHRoaXJkLXBhcnR5XCIpO30pO2MucG9wKCk7fWlmKCF0LnModC5mKFwiaXNWaXNpYmxlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7dC5iKFwiIGVtb3RlLW1lbnUtaGlkZGVuXCIpO307aWYodC5zKHQuZihcImlzU3RhcnJlZFwiLGMscCwxKSxjLHAsMCwxMTksMTM4LFwie3sgfX1cIikpe3QucnMoYyxwLGZ1bmN0aW9uKGMscCx0KXt0LmIoXCIgZW1vdGUtbWVudS1zdGFycmVkXCIpO30pO2MucG9wKCk7fXQuYihcIlxcXCIgZGF0YS1lbW90ZT1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCIgdGl0bGU9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTtpZih0LnModC5mKFwidGhpcmRQYXJ0eVwiLGMscCwxKSxjLHAsMCwyMDYsMjI5LFwie3sgfX1cIikpe3QucnMoYyxwLGZ1bmN0aW9uKGMscCx0KXt0LmIoXCIgKGZyb20gM3JkIHBhcnR5IGFkZG9uKVwiKTt9KTtjLnBvcCgpO310LmIoXCJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGltZyBzcmM9XFxcIlwiKTt0LmIodC50KHQuZihcInVybFwiLGMscCwwKSkpO3QuYihcIlxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJlZGl0LXRvb2wgZWRpdC1zdGFycmVkXFxcIiBkYXRhLXdoaWNoPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS1zdGFycmVkXFxcIiB0aXRsZT1cXFwiU3Rhci91bnN0YXIgZW1vdGU6IFwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZWRpdC10b29sIGVkaXQtdmlzaWJpbGl0eVxcXCIgZGF0YS13aGljaD1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtdmlzaWJpbGl0eVxcXCIgdGl0bGU9XFxcIkhpZGUvc2hvdyBlbW90ZTogXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVCdXR0b24nXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGJ1dHRvbiBjbGFzcz1cXFwiYnV0dG9uIGdseXBoLW9ubHkgZmxvYXQtbGVmdFxcXCIgdGl0bGU9XFxcIkVtb3RlIE1lbnVcXFwiIGlkPVxcXCJlbW90ZS1tZW51LWJ1dHRvblxcXCI+PC9idXR0b24+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVHcm91cEhlYWRlciddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJncm91cC1oZWFkZXJcIik7aWYoIXQucyh0LmYoXCJpc1Zpc2libGVcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXt0LmIoXCIgZW1vdGUtbWVudS1oaWRkZW5cIik7fTt0LmIoXCJcXFwiIGRhdGEtZW1vdGUtY2hhbm5lbD1cXFwiXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIlxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXItaW5mb1xcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxpbWcgc3JjPVxcXCJcIik7dC5iKHQudih0LmYoXCJiYWRnZVwiLGMscCwwKSkpO3QuYihcIlxcXCIgLz5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbERpc3BsYXlOYW1lXCIsYyxwLDApKSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcImVkaXQtdG9vbCBlZGl0LXZpc2liaWxpdHlcXFwiIGRhdGEtd2hpY2g9XFxcImNoYW5uZWwtXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIlxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtdmlzaWJpbGl0eVxcXCIgdGl0bGU9XFxcIkhpZGUvc2hvdyBhbGwgZW1vdGVzIGZvciBcIik7dC5iKHQudih0LmYoXCJjaGFubmVsXCIsYyxwLDApKSk7dC5iKFwiXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ21lbnUnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZW1vdGUtbWVudVxcXCIgaWQ9XFxcImVtb3RlLW1lbnUtZm9yLXR3aXRjaFxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJkcmFnZ2FibGVcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiaGVhZGVyLWluZm9cXFwiPkFsbCBFbW90ZXM8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImdyb3VwLWNvbnRhaW5lciBzY3JvbGxhYmxlXFxcIiBpZD1cXFwiYWxsLWVtb3Rlcy1ncm91cFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXItaW5mb1xcXCI+RmF2b3JpdGUgRW1vdGVzPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1jb250YWluZXIgc2luZ2xlLXJvd1xcXCIgaWQ9XFxcInN0YXJyZWQtZW1vdGVzLWdyb3VwXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImZvb3RlclxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxhIGNsYXNzPVxcXCJwdWxsLWxlZnQgaWNvbiBpY29uLWhvbWVcXFwiIGhyZWY9XFxcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXNcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIiB0aXRsZT1cXFwiVmlzaXQgdGhlIGhvbWVwYWdlIHdoZXJlIHlvdSBjYW4gZG9uYXRlLCBwb3N0IGEgcmV2aWV3LCBvciBjb250YWN0IHRoZSBkZXZlbG9wZXJcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGEgY2xhc3M9XFxcInB1bGwtbGVmdCBpY29uIGljb24tZ2VhclxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtZWRpdGluZ1xcXCIgdGl0bGU9XFxcIlRvZ2dsZSBlZGl0IG1vZGVcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGEgY2xhc3M9XFxcInB1bGwtcmlnaHQgaWNvbiBpY29uLXJlc2l6ZS1oYW5kbGVcXFwiIGRhdGEtY29tbWFuZD1cXFwicmVzaXplLWhhbmRsZVxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8YSBjbGFzcz1cXFwicHVsbC1yaWdodCBpY29uIGljb24tcGluXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS1waW5uZWRcXFwiIHRpdGxlPVxcXCJQaW4vdW5waW4gdGhlIGVtb3RlIG1lbnUgdG8gdGhlIHNjcmVlblxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snbmV3c01lc3NhZ2UnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPGRpdiBjbGFzcz1cXFwidHdpdGNoLWNoYXQtZW1vdGVzLW5ld3NcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0W1wiKTt0LmIodC52KHQuZihcInNjcmlwdE5hbWVcIixjLHAsMCkpKTt0LmIoXCJdIE5ld3M6IFwiKTt0LmIodC50KHQuZihcIm1lc3NhZ2VcIixjLHAsMCkpKTt0LmIoXCIgKDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtY29tbWFuZD1cXFwidHdpdGNoLWNoYXQtZW1vdGVzOmRpc21pc3MtbmV3c1xcXCIgZGF0YS1uZXdzLWlkPVxcXCJcIik7dC5iKHQudih0LmYoXCJpZFwiLGMscCwwKSkpO3QuYihcIlxcXCI+RGlzbWlzczwvYT4pXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHJldHVybiB0ZW1wbGF0ZXM7XG59KSgpOyIsIi8qXG4gKiAgQ29weXJpZ2h0IDIwMTEgVHdpdHRlciwgSW5jLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEhvZ2FuID0ge307XG5cbihmdW5jdGlvbiAoSG9nYW4pIHtcbiAgSG9nYW4uVGVtcGxhdGUgPSBmdW5jdGlvbiAoY29kZU9iaiwgdGV4dCwgY29tcGlsZXIsIG9wdGlvbnMpIHtcbiAgICBjb2RlT2JqID0gY29kZU9iaiB8fCB7fTtcbiAgICB0aGlzLnIgPSBjb2RlT2JqLmNvZGUgfHwgdGhpcy5yO1xuICAgIHRoaXMuYyA9IGNvbXBpbGVyO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy50ZXh0ID0gdGV4dCB8fCAnJztcbiAgICB0aGlzLnBhcnRpYWxzID0gY29kZU9iai5wYXJ0aWFscyB8fCB7fTtcbiAgICB0aGlzLnN1YnMgPSBjb2RlT2JqLnN1YnMgfHwge307XG4gICAgdGhpcy5idWYgPSAnJztcbiAgfVxuXG4gIEhvZ2FuLlRlbXBsYXRlLnByb3RvdHlwZSA9IHtcbiAgICAvLyByZW5kZXI6IHJlcGxhY2VkIGJ5IGdlbmVyYXRlZCBjb2RlLlxuICAgIHI6IGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7IHJldHVybiAnJzsgfSxcblxuICAgIC8vIHZhcmlhYmxlIGVzY2FwaW5nXG4gICAgdjogaG9nYW5Fc2NhcGUsXG5cbiAgICAvLyB0cmlwbGUgc3RhY2hlXG4gICAgdDogY29lcmNlVG9TdHJpbmcsXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5yaShbY29udGV4dF0sIHBhcnRpYWxzIHx8IHt9LCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgaW50ZXJuYWwgLS0gYSBob29rIGZvciBvdmVycmlkZXMgdGhhdCBjYXRjaGVzIHBhcnRpYWxzIHRvb1xuICAgIHJpOiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgcmV0dXJuIHRoaXMucihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gZW5zdXJlUGFydGlhbFxuICAgIGVwOiBmdW5jdGlvbihzeW1ib2wsIHBhcnRpYWxzKSB7XG4gICAgICB2YXIgcGFydGlhbCA9IHRoaXMucGFydGlhbHNbc3ltYm9sXTtcblxuICAgICAgLy8gY2hlY2sgdG8gc2VlIHRoYXQgaWYgd2UndmUgaW5zdGFudGlhdGVkIHRoaXMgcGFydGlhbCBiZWZvcmVcbiAgICAgIHZhciB0ZW1wbGF0ZSA9IHBhcnRpYWxzW3BhcnRpYWwubmFtZV07XG4gICAgICBpZiAocGFydGlhbC5pbnN0YW5jZSAmJiBwYXJ0aWFsLmJhc2UgPT0gdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWwuaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGVtcGxhdGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKCF0aGlzLmMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBjb21waWxlciBhdmFpbGFibGUuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gdGhpcy5jLmNvbXBpbGUodGVtcGxhdGUsIHRoaXMub3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHVzZSB0aGlzIHRvIGNoZWNrIHdoZXRoZXIgdGhlIHBhcnRpYWxzIGRpY3Rpb25hcnkgaGFzIGNoYW5nZWRcbiAgICAgIHRoaXMucGFydGlhbHNbc3ltYm9sXS5iYXNlID0gdGVtcGxhdGU7XG5cbiAgICAgIGlmIChwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGNvbnNpZGVyIHBhcmVudCB0ZW1wbGF0ZSBub3dcbiAgICAgICAgaWYgKCFwYXJ0aWFscy5zdGFja1RleHQpIHBhcnRpYWxzLnN0YWNrVGV4dCA9IHt9O1xuICAgICAgICBmb3IgKGtleSBpbiBwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgICBpZiAoIXBhcnRpYWxzLnN0YWNrVGV4dFtrZXldKSB7XG4gICAgICAgICAgICBwYXJ0aWFscy5zdGFja1RleHRba2V5XSA9ICh0aGlzLmFjdGl2ZVN1YiAhPT0gdW5kZWZpbmVkICYmIHBhcnRpYWxzLnN0YWNrVGV4dFt0aGlzLmFjdGl2ZVN1Yl0pID8gcGFydGlhbHMuc3RhY2tUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgPSBjcmVhdGVTcGVjaWFsaXplZFBhcnRpYWwodGVtcGxhdGUsIHBhcnRpYWwuc3VicywgcGFydGlhbC5wYXJ0aWFscyxcbiAgICAgICAgICB0aGlzLnN0YWNrU3VicywgdGhpcy5zdGFja1BhcnRpYWxzLCBwYXJ0aWFscy5zdGFja1RleHQpO1xuICAgICAgfVxuICAgICAgdGhpcy5wYXJ0aWFsc1tzeW1ib2xdLmluc3RhbmNlID0gdGVtcGxhdGU7XG5cbiAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9LFxuXG4gICAgLy8gdHJpZXMgdG8gZmluZCBhIHBhcnRpYWwgaW4gdGhlIGN1cnJlbnQgc2NvcGUgYW5kIHJlbmRlciBpdFxuICAgIHJwOiBmdW5jdGlvbihzeW1ib2wsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBwYXJ0aWFsID0gdGhpcy5lcChzeW1ib2wsIHBhcnRpYWxzKTtcbiAgICAgIGlmICghcGFydGlhbCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXJ0aWFsLnJpKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgYSBzZWN0aW9uXG4gICAgcnM6IGZ1bmN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCBzZWN0aW9uKSB7XG4gICAgICB2YXIgdGFpbCA9IGNvbnRleHRbY29udGV4dC5sZW5ndGggLSAxXTtcblxuICAgICAgaWYgKCFpc0FycmF5KHRhaWwpKSB7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFpbC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb250ZXh0LnB1c2godGFpbFtpXSk7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICBjb250ZXh0LnBvcCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBtYXliZSBzdGFydCBhIHNlY3Rpb25cbiAgICBzOiBmdW5jdGlvbih2YWwsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKSB7XG4gICAgICB2YXIgcGFzcztcblxuICAgICAgaWYgKGlzQXJyYXkodmFsKSAmJiB2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSB0aGlzLm1zKHZhbCwgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpO1xuICAgICAgfVxuXG4gICAgICBwYXNzID0gISF2YWw7XG5cbiAgICAgIGlmICghaW52ZXJ0ZWQgJiYgcGFzcyAmJiBjdHgpIHtcbiAgICAgICAgY3R4LnB1c2goKHR5cGVvZiB2YWwgPT0gJ29iamVjdCcpID8gdmFsIDogY3R4W2N0eC5sZW5ndGggLSAxXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXNzO1xuICAgIH0sXG5cbiAgICAvLyBmaW5kIHZhbHVlcyB3aXRoIGRvdHRlZCBuYW1lc1xuICAgIGQ6IGZ1bmN0aW9uKGtleSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpIHtcbiAgICAgIHZhciBmb3VuZCxcbiAgICAgICAgICBuYW1lcyA9IGtleS5zcGxpdCgnLicpLFxuICAgICAgICAgIHZhbCA9IHRoaXMuZihuYW1lc1swXSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpLFxuICAgICAgICAgIGRvTW9kZWxHZXQgPSB0aGlzLm9wdGlvbnMubW9kZWxHZXQsXG4gICAgICAgICAgY3ggPSBudWxsO1xuXG4gICAgICBpZiAoa2V5ID09PSAnLicgJiYgaXNBcnJheShjdHhbY3R4Lmxlbmd0aCAtIDJdKSkge1xuICAgICAgICB2YWwgPSBjdHhbY3R4Lmxlbmd0aCAtIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZvdW5kID0gZmluZEluU2NvcGUobmFtZXNbaV0sIHZhbCwgZG9Nb2RlbEdldCk7XG4gICAgICAgICAgaWYgKGZvdW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGN4ID0gdmFsO1xuICAgICAgICAgICAgdmFsID0gZm91bmQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbCA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmV0dXJuRm91bmQgJiYgIXZhbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmV0dXJuRm91bmQgJiYgdHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGN0eC5wdXNoKGN4KTtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgICBjdHgucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIGZpbmQgdmFsdWVzIHdpdGggbm9ybWFsIG5hbWVzXG4gICAgZjogZnVuY3Rpb24oa2V5LCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCkge1xuICAgICAgdmFyIHZhbCA9IGZhbHNlLFxuICAgICAgICAgIHYgPSBudWxsLFxuICAgICAgICAgIGZvdW5kID0gZmFsc2UsXG4gICAgICAgICAgZG9Nb2RlbEdldCA9IHRoaXMub3B0aW9ucy5tb2RlbEdldDtcblxuICAgICAgZm9yICh2YXIgaSA9IGN0eC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICB2ID0gY3R4W2ldO1xuICAgICAgICB2YWwgPSBmaW5kSW5TY29wZShrZXksIHYsIGRvTW9kZWxHZXQpO1xuICAgICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICByZXR1cm4gKHJldHVybkZvdW5kKSA/IGZhbHNlIDogXCJcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXR1cm5Gb3VuZCAmJiB0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICAvLyBoaWdoZXIgb3JkZXIgdGVtcGxhdGVzXG4gICAgbHM6IGZ1bmN0aW9uKGZ1bmMsIGN4LCBwYXJ0aWFscywgdGV4dCwgdGFncykge1xuICAgICAgdmFyIG9sZFRhZ3MgPSB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycztcblxuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSB0YWdzO1xuICAgICAgdGhpcy5iKHRoaXMuY3QoY29lcmNlVG9TdHJpbmcoZnVuYy5jYWxsKGN4LCB0ZXh0KSksIGN4LCBwYXJ0aWFscykpO1xuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSBvbGRUYWdzO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8vIGNvbXBpbGUgdGV4dFxuICAgIGN0OiBmdW5jdGlvbih0ZXh0LCBjeCwgcGFydGlhbHMpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlzYWJsZUxhbWJkYSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xhbWJkYSBmZWF0dXJlcyBkaXNhYmxlZC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmMuY29tcGlsZSh0ZXh0LCB0aGlzLm9wdGlvbnMpLnJlbmRlcihjeCwgcGFydGlhbHMpO1xuICAgIH0sXG5cbiAgICAvLyB0ZW1wbGF0ZSByZXN1bHQgYnVmZmVyaW5nXG4gICAgYjogZnVuY3Rpb24ocykgeyB0aGlzLmJ1ZiArPSBzOyB9LFxuXG4gICAgZmw6IGZ1bmN0aW9uKCkgeyB2YXIgciA9IHRoaXMuYnVmOyB0aGlzLmJ1ZiA9ICcnOyByZXR1cm4gcjsgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHNlY3Rpb25cbiAgICBtczogZnVuY3Rpb24oZnVuYywgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpIHtcbiAgICAgIHZhciB0ZXh0U291cmNlLFxuICAgICAgICAgIGN4ID0gY3R4W2N0eC5sZW5ndGggLSAxXSxcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmNhbGwoY3gpO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmIChpbnZlcnRlZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRleHRTb3VyY2UgPSAodGhpcy5hY3RpdmVTdWIgJiYgdGhpcy5zdWJzVGV4dCAmJiB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSkgPyB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICByZXR1cm4gdGhpcy5scyhyZXN1bHQsIGN4LCBwYXJ0aWFscywgdGV4dFNvdXJjZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCksIHRhZ3MpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHZhcmlhYmxlXG4gICAgbXY6IGZ1bmN0aW9uKGZ1bmMsIGN0eCwgcGFydGlhbHMpIHtcbiAgICAgIHZhciBjeCA9IGN0eFtjdHgubGVuZ3RoIC0gMV07XG4gICAgICB2YXIgcmVzdWx0ID0gZnVuYy5jYWxsKGN4KTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gdGhpcy5jdChjb2VyY2VUb1N0cmluZyhyZXN1bHQuY2FsbChjeCkpLCBjeCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICBzdWI6IGZ1bmN0aW9uKG5hbWUsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBmID0gdGhpcy5zdWJzW25hbWVdO1xuICAgICAgaWYgKGYpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVTdWIgPSBuYW1lO1xuICAgICAgICBmKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzLCBpbmRlbnQpO1xuICAgICAgICB0aGlzLmFjdGl2ZVN1YiA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICB9O1xuXG4gIC8vRmluZCBhIGtleSBpbiBhbiBvYmplY3RcbiAgZnVuY3Rpb24gZmluZEluU2NvcGUoa2V5LCBzY29wZSwgZG9Nb2RlbEdldCkge1xuICAgIHZhciB2YWw7XG5cbiAgICBpZiAoc2NvcGUgJiYgdHlwZW9mIHNjb3BlID09ICdvYmplY3QnKSB7XG5cbiAgICAgIGlmIChzY29wZVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFsID0gc2NvcGVba2V5XTtcblxuICAgICAgLy8gdHJ5IGxvb2t1cCB3aXRoIGdldCBmb3IgYmFja2JvbmUgb3Igc2ltaWxhciBtb2RlbCBkYXRhXG4gICAgICB9IGVsc2UgaWYgKGRvTW9kZWxHZXQgJiYgc2NvcGUuZ2V0ICYmIHR5cGVvZiBzY29wZS5nZXQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSBzY29wZS5nZXQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3BlY2lhbGl6ZWRQYXJ0aWFsKGluc3RhbmNlLCBzdWJzLCBwYXJ0aWFscywgc3RhY2tTdWJzLCBzdGFja1BhcnRpYWxzLCBzdGFja1RleHQpIHtcbiAgICBmdW5jdGlvbiBQYXJ0aWFsVGVtcGxhdGUoKSB7fTtcbiAgICBQYXJ0aWFsVGVtcGxhdGUucHJvdG90eXBlID0gaW5zdGFuY2U7XG4gICAgZnVuY3Rpb24gU3Vic3RpdHV0aW9ucygpIHt9O1xuICAgIFN1YnN0aXR1dGlvbnMucHJvdG90eXBlID0gaW5zdGFuY2Uuc3VicztcbiAgICB2YXIga2V5O1xuICAgIHZhciBwYXJ0aWFsID0gbmV3IFBhcnRpYWxUZW1wbGF0ZSgpO1xuICAgIHBhcnRpYWwuc3VicyA9IG5ldyBTdWJzdGl0dXRpb25zKCk7XG4gICAgcGFydGlhbC5zdWJzVGV4dCA9IHt9OyAgLy9oZWhlLiBzdWJzdGV4dC5cbiAgICBwYXJ0aWFsLmJ1ZiA9ICcnO1xuXG4gICAgc3RhY2tTdWJzID0gc3RhY2tTdWJzIHx8IHt9O1xuICAgIHBhcnRpYWwuc3RhY2tTdWJzID0gc3RhY2tTdWJzO1xuICAgIHBhcnRpYWwuc3Vic1RleHQgPSBzdGFja1RleHQ7XG4gICAgZm9yIChrZXkgaW4gc3Vicykge1xuICAgICAgaWYgKCFzdGFja1N1YnNba2V5XSkgc3RhY2tTdWJzW2tleV0gPSBzdWJzW2tleV07XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHN0YWNrU3Vicykge1xuICAgICAgcGFydGlhbC5zdWJzW2tleV0gPSBzdGFja1N1YnNba2V5XTtcbiAgICB9XG5cbiAgICBzdGFja1BhcnRpYWxzID0gc3RhY2tQYXJ0aWFscyB8fCB7fTtcbiAgICBwYXJ0aWFsLnN0YWNrUGFydGlhbHMgPSBzdGFja1BhcnRpYWxzO1xuICAgIGZvciAoa2V5IGluIHBhcnRpYWxzKSB7XG4gICAgICBpZiAoIXN0YWNrUGFydGlhbHNba2V5XSkgc3RhY2tQYXJ0aWFsc1trZXldID0gcGFydGlhbHNba2V5XTtcbiAgICB9XG4gICAgZm9yIChrZXkgaW4gc3RhY2tQYXJ0aWFscykge1xuICAgICAgcGFydGlhbC5wYXJ0aWFsc1trZXldID0gc3RhY2tQYXJ0aWFsc1trZXldO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJ0aWFsO1xuICB9XG5cbiAgdmFyIHJBbXAgPSAvJi9nLFxuICAgICAgckx0ID0gLzwvZyxcbiAgICAgIHJHdCA9IC8+L2csXG4gICAgICByQXBvcyA9IC9cXCcvZyxcbiAgICAgIHJRdW90ID0gL1xcXCIvZyxcbiAgICAgIGhDaGFycyA9IC9bJjw+XFxcIlxcJ10vO1xuXG4gIGZ1bmN0aW9uIGNvZXJjZVRvU3RyaW5nKHZhbCkge1xuICAgIHJldHVybiBTdHJpbmcoKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHZhbCk7XG4gIH1cblxuICBmdW5jdGlvbiBob2dhbkVzY2FwZShzdHIpIHtcbiAgICBzdHIgPSBjb2VyY2VUb1N0cmluZyhzdHIpO1xuICAgIHJldHVybiBoQ2hhcnMudGVzdChzdHIpID9cbiAgICAgIHN0clxuICAgICAgICAucmVwbGFjZShyQW1wLCAnJmFtcDsnKVxuICAgICAgICAucmVwbGFjZShyTHQsICcmbHQ7JylcbiAgICAgICAgLnJlcGxhY2Uockd0LCAnJmd0OycpXG4gICAgICAgIC5yZXBsYWNlKHJBcG9zLCAnJiMzOTsnKVxuICAgICAgICAucmVwbGFjZShyUXVvdCwgJyZxdW90OycpIDpcbiAgICAgIHN0cjtcbiAgfVxuXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihhKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxufSkodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnID8gZXhwb3J0cyA6IEhvZ2FuKTtcbiIsIihmdW5jdGlvbiAoJCkge1xuXG4gICQuZm4uY3VzdG9tU2Nyb2xsYmFyID0gZnVuY3Rpb24gKG9wdGlvbnMsIGFyZ3MpIHtcblxuICAgIHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIHNraW46IHVuZGVmaW5lZCxcbiAgICAgIGhTY3JvbGw6IHRydWUsXG4gICAgICB2U2Nyb2xsOiB0cnVlLFxuICAgICAgdXBkYXRlT25XaW5kb3dSZXNpemU6IGZhbHNlLFxuICAgICAgYW5pbWF0aW9uU3BlZWQ6IDMwMCxcbiAgICAgIG9uQ3VzdG9tU2Nyb2xsOiB1bmRlZmluZWQsXG4gICAgICBzd2lwZVNwZWVkOiAxLFxuICAgICAgd2hlZWxTcGVlZDogNDAsXG4gICAgICBmaXhlZFRodW1iV2lkdGg6IHVuZGVmaW5lZCxcbiAgICAgIGZpeGVkVGh1bWJIZWlnaHQ6IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIHZhciBTY3JvbGxhYmxlID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgIHRoaXMuYWRkU2Nyb2xsYWJsZUNsYXNzKCk7XG4gICAgICB0aGlzLmFkZFNraW5DbGFzcygpO1xuICAgICAgdGhpcy5hZGRTY3JvbGxCYXJDb21wb25lbnRzKCk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnZTY3JvbGwpXG4gICAgICAgIHRoaXMudlNjcm9sbGJhciA9IG5ldyBTY3JvbGxiYXIodGhpcywgbmV3IFZTaXppbmcoKSk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmhTY3JvbGwpXG4gICAgICAgIHRoaXMuaFNjcm9sbGJhciA9IG5ldyBTY3JvbGxiYXIodGhpcywgbmV3IEhTaXppbmcoKSk7XG4gICAgICB0aGlzLiRlbGVtZW50LmRhdGEoXCJzY3JvbGxhYmxlXCIsIHRoaXMpO1xuICAgICAgdGhpcy5pbml0S2V5Ym9hcmRTY3JvbGxpbmcoKTtcbiAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH1cblxuICAgIFNjcm9sbGFibGUucHJvdG90eXBlID0ge1xuXG4gICAgICBhZGRTY3JvbGxhYmxlQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKFwic2Nyb2xsYWJsZVwiKSkge1xuICAgICAgICAgIHRoaXMuc2Nyb2xsYWJsZUFkZGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKFwic2Nyb2xsYWJsZVwiKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlU2Nyb2xsYWJsZUNsYXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbGFibGVBZGRlZClcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKFwic2Nyb2xsYWJsZVwiKTtcbiAgICAgIH0sXG5cbiAgICAgIGFkZFNraW5DbGFzczogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHlwZW9mKHRoaXMub3B0aW9ucy5za2luKSA9PSBcInN0cmluZ1wiICYmICF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5za2luKSkge1xuICAgICAgICAgIHRoaXMuc2tpbkNsYXNzQWRkZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnNraW4pO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVTa2luQ2xhc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2tpbkNsYXNzQWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuc2tpbik7XG4gICAgICB9LFxuXG4gICAgICBhZGRTY3JvbGxCYXJDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYXNzaWduVmlld1BvcnQoKTtcbiAgICAgICAgaWYgKHRoaXMuJHZpZXdQb3J0Lmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgdGhpcy4kZWxlbWVudC53cmFwSW5uZXIoXCI8ZGl2IGNsYXNzPVxcXCJ2aWV3cG9ydFxcXCIgLz5cIik7XG4gICAgICAgICAgdGhpcy5hc3NpZ25WaWV3UG9ydCgpO1xuICAgICAgICAgIHRoaXMudmlld1BvcnRBZGRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hc3NpZ25PdmVydmlldygpO1xuICAgICAgICBpZiAodGhpcy4kb3ZlcnZpZXcubGVuZ3RoID09IDApIHtcbiAgICAgICAgICB0aGlzLiR2aWV3UG9ydC53cmFwSW5uZXIoXCI8ZGl2IGNsYXNzPVxcXCJvdmVydmlld1xcXCIgLz5cIik7XG4gICAgICAgICAgdGhpcy5hc3NpZ25PdmVydmlldygpO1xuICAgICAgICAgIHRoaXMub3ZlcnZpZXdBZGRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGRTY3JvbGxCYXIoXCJ2ZXJ0aWNhbFwiLCBcInByZXBlbmRcIik7XG4gICAgICAgIHRoaXMuYWRkU2Nyb2xsQmFyKFwiaG9yaXpvbnRhbFwiLCBcImFwcGVuZFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNjcm9sbGJhckNvbXBvbmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxiYXIoXCJ2ZXJ0aWNhbFwiKTtcbiAgICAgICAgdGhpcy5yZW1vdmVTY3JvbGxiYXIoXCJob3Jpem9udGFsXCIpO1xuICAgICAgICBpZiAodGhpcy5vdmVydmlld0FkZGVkKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQudW53cmFwKCk7XG4gICAgICAgIGlmICh0aGlzLnZpZXdQb3J0QWRkZWQpXG4gICAgICAgICAgdGhpcy4kZWxlbWVudC51bndyYXAoKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVNjcm9sbGJhcjogZnVuY3Rpb24gKG9yaWVudGF0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzW29yaWVudGF0aW9uICsgXCJTY3JvbGxiYXJBZGRlZFwiXSlcbiAgICAgICAgICB0aGlzLiRlbGVtZW50LmZpbmQoXCIuc2Nyb2xsLWJhci5cIiArIG9yaWVudGF0aW9uKS5yZW1vdmUoKTtcbiAgICAgIH0sXG5cbiAgICAgIGFzc2lnblZpZXdQb3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJHZpZXdQb3J0ID0gdGhpcy4kZWxlbWVudC5maW5kKFwiLnZpZXdwb3J0XCIpO1xuICAgICAgfSxcblxuICAgICAgYXNzaWduT3ZlcnZpZXc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kb3ZlcnZpZXcgPSB0aGlzLiR2aWV3UG9ydC5maW5kKFwiLm92ZXJ2aWV3XCIpO1xuICAgICAgfSxcblxuICAgICAgYWRkU2Nyb2xsQmFyOiBmdW5jdGlvbiAob3JpZW50YXRpb24sIGZ1bikge1xuICAgICAgICBpZiAodGhpcy4kZWxlbWVudC5maW5kKFwiLnNjcm9sbC1iYXIuXCIgKyBvcmllbnRhdGlvbikubGVuZ3RoID09IDApIHtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50W2Z1bl0oXCI8ZGl2IGNsYXNzPSdzY3JvbGwtYmFyIFwiICsgb3JpZW50YXRpb24gKyBcIic+PGRpdiBjbGFzcz0ndGh1bWInPjwvZGl2PjwvZGl2PlwiKVxuICAgICAgICAgIHRoaXNbb3JpZW50YXRpb24gKyBcIlNjcm9sbGJhckFkZGVkXCJdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVzaXplOiBmdW5jdGlvbiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzLnZTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy52U2Nyb2xsYmFyLnJlc2l6ZShrZWVwUG9zaXRpb24pO1xuICAgICAgICBpZiAodGhpcy5oU2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMuaFNjcm9sbGJhci5yZXNpemUoa2VlcFBvc2l0aW9uKTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5zY3JvbGxUb0VsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIGlmICh0aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgdGhpcy5oU2Nyb2xsYmFyLnNjcm9sbFRvRWxlbWVudChlbGVtZW50KTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvWFk6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9YKHgpO1xuICAgICAgICB0aGlzLnNjcm9sbFRvWSh5KTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvWDogZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIuc2Nyb2xsT3ZlcnZpZXdUbyh4LCB0cnVlKTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbFRvWTogZnVuY3Rpb24gKHkpIHtcbiAgICAgICAgaWYgKHRoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLnZTY3JvbGxiYXIuc2Nyb2xsT3ZlcnZpZXdUbyh5LCB0cnVlKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbGFibGVDbGFzcygpO1xuICAgICAgICB0aGlzLnJlbW92ZVNraW5DbGFzcygpO1xuICAgICAgICB0aGlzLnJlbW92ZVNjcm9sbGJhckNvbXBvbmVudHMoKTtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5kYXRhKFwic2Nyb2xsYWJsZVwiLCBudWxsKTtcbiAgICAgICAgdGhpcy5yZW1vdmVLZXlib2FyZFNjcm9sbGluZygpO1xuICAgICAgICBpZiAodGhpcy52U2Nyb2xsYmFyKVxuICAgICAgICAgIHRoaXMudlNjcm9sbGJhci5yZW1vdmUoKTtcbiAgICAgICAgaWYgKHRoaXMuaFNjcm9sbGJhcilcbiAgICAgICAgICB0aGlzLmhTY3JvbGxiYXIucmVtb3ZlKCk7XG4gICAgICB9LFxuXG4gICAgICBzZXRBbmltYXRpb25TcGVlZDogZnVuY3Rpb24gKHNwZWVkKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5hbmltYXRpb25TcGVlZCA9IHNwZWVkO1xuICAgICAgfSxcblxuICAgICAgaXNJbnNpZGU6IGZ1bmN0aW9uIChlbGVtZW50LCB3cmFwcGluZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgdmFyICR3cmFwcGluZ0VsZW1lbnQgPSAkKHdyYXBwaW5nRWxlbWVudCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciB3cmFwcGluZ0VsZW1lbnRPZmZzZXQgPSAkd3JhcHBpbmdFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICByZXR1cm4gKGVsZW1lbnRPZmZzZXQudG9wID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3ApICYmIChlbGVtZW50T2Zmc2V0LmxlZnQgPj0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQpICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQudG9wICsgJGVsZW1lbnQuaGVpZ2h0KCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LnRvcCArICR3cmFwcGluZ0VsZW1lbnQuaGVpZ2h0KCkpICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQubGVmdCArICRlbGVtZW50LndpZHRoKCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LmxlZnQgKyAkd3JhcHBpbmdFbGVtZW50LndpZHRoKCkpXG4gICAgICB9LFxuXG4gICAgICBpbml0S2V5Ym9hcmRTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB0aGlzLmVsZW1lbnRLZXlkb3duID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgaWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IF90aGlzLiRlbGVtZW50WzBdKSB7XG4gICAgICAgICAgICBpZiAoX3RoaXMudlNjcm9sbGJhcilcbiAgICAgICAgICAgICAgX3RoaXMudlNjcm9sbGJhci5rZXlTY3JvbGwoZXZlbnQpO1xuICAgICAgICAgICAgaWYgKF90aGlzLmhTY3JvbGxiYXIpXG4gICAgICAgICAgICAgIF90aGlzLmhTY3JvbGxiYXIua2V5U2Nyb2xsKGV2ZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiRlbGVtZW50XG4gICAgICAgICAgLmF0dHIoJ3RhYmluZGV4JywgJy0xJylcbiAgICAgICAgICAua2V5ZG93bih0aGlzLmVsZW1lbnRLZXlkb3duKTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZUtleWJvYXJkU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgICAucmVtb3ZlQXR0cigndGFiaW5kZXgnKVxuICAgICAgICAgIC51bmJpbmQoXCJrZXlkb3duXCIsIHRoaXMuZWxlbWVudEtleWRvd24pO1xuICAgICAgfSxcblxuICAgICAgYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm9uQ3VzdG9tU2Nyb2xsKVxuICAgICAgICAgIHRoaXMuJGVsZW1lbnQub24oXCJjdXN0b21TY3JvbGxcIiwgdGhpcy5vcHRpb25zLm9uQ3VzdG9tU2Nyb2xsKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHZhciBTY3JvbGxiYXIgPSBmdW5jdGlvbiAoc2Nyb2xsYWJsZSwgc2l6aW5nKSB7XG4gICAgICB0aGlzLnNjcm9sbGFibGUgPSBzY3JvbGxhYmxlO1xuICAgICAgdGhpcy5zaXppbmcgPSBzaXppbmdcbiAgICAgIHRoaXMuJHNjcm9sbEJhciA9IHRoaXMuc2l6aW5nLnNjcm9sbEJhcih0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQpO1xuICAgICAgdGhpcy4kdGh1bWIgPSB0aGlzLiRzY3JvbGxCYXIuZmluZChcIi50aHVtYlwiKTtcbiAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb24oMCwgMCk7XG4gICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgICAgdGhpcy5pbml0TW91c2VNb3ZlU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmluaXRNb3VzZVdoZWVsU2Nyb2xsaW5nKCk7XG4gICAgICB0aGlzLmluaXRUb3VjaFNjcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0TW91c2VDbGlja1Njcm9sbGluZygpO1xuICAgICAgdGhpcy5pbml0V2luZG93UmVzaXplKCk7XG4gICAgfVxuXG4gICAgU2Nyb2xsYmFyLnByb3RvdHlwZSA9IHtcblxuICAgICAgcmVzaXplOiBmdW5jdGlvbiAoa2VlcFBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQuaGVpZ2h0KHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudC5oZWlnaHQoKSk7XG4gICAgICAgIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCwgdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQpKTtcbiAgICAgICAgdGhpcy52aWV3UG9ydFNpemUgPSB0aGlzLnNpemluZy5zaXplKHRoaXMuc2Nyb2xsYWJsZS4kdmlld1BvcnQpO1xuICAgICAgICB0aGlzLm92ZXJ2aWV3U2l6ZSA9IHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldyk7XG4gICAgICAgIHRoaXMucmF0aW8gPSB0aGlzLnZpZXdQb3J0U2l6ZSAvIHRoaXMub3ZlcnZpZXdTaXplO1xuICAgICAgICB0aGlzLnNpemluZy5zaXplKHRoaXMuJHNjcm9sbEJhciwgdGhpcy52aWV3UG9ydFNpemUpO1xuICAgICAgICB0aGlzLnRodW1iU2l6ZSA9IHRoaXMuY2FsY3VsYXRlVGh1bWJTaXplKCk7XG4gICAgICAgIHRoaXMuc2l6aW5nLnNpemUodGhpcy4kdGh1bWIsIHRoaXMudGh1bWJTaXplKTtcbiAgICAgICAgdGhpcy5tYXhUaHVtYlBvc2l0aW9uID0gdGhpcy5jYWxjdWxhdGVNYXhUaHVtYlBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMuY2FsY3VsYXRlTWF4T3ZlcnZpZXdQb3NpdGlvbigpO1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSAodGhpcy5vdmVydmlld1NpemUgPiB0aGlzLnZpZXdQb3J0U2l6ZSk7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbFBlcmNlbnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICB0aGlzLnNjcm9sbFBlcmNlbnQgPSAwLjA7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZWQpXG4gICAgICAgICAgdGhpcy5yZXNjcm9sbChrZWVwUG9zaXRpb24pO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgdGhpcy4kc2Nyb2xsQmFyLnRvZ2dsZSh0aGlzLmVuYWJsZWQpO1xuICAgICAgfSxcblxuICAgICAgY2FsY3VsYXRlVGh1bWJTaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBmaXhlZFNpemUgPSB0aGlzLnNpemluZy5maXhlZFRodW1iU2l6ZSh0aGlzLnNjcm9sbGFibGUub3B0aW9ucylcbiAgICAgICAgdmFyIHNpemU7XG4gICAgICAgIGlmIChmaXhlZFNpemUpXG4gICAgICAgICAgc2l6ZSA9IGZpeGVkU2l6ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNpemUgPSB0aGlzLnJhdGlvICogdGhpcy52aWV3UG9ydFNpemVcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KHNpemUsIHRoaXMuc2l6aW5nLm1pblNpemUodGhpcy4kdGh1bWIpKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy4kdGh1bWIubW91c2Vkb3duKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGlmIChfdGhpcy5lbmFibGVkKVxuICAgICAgICAgICAgX3RoaXMuc3RhcnRNb3VzZU1vdmVTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kb2N1bWVudE1vdXNldXAgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBfdGhpcy5zdG9wTW91c2VNb3ZlU2Nyb2xsaW5nKGV2ZW50KTtcbiAgICAgICAgfTtcbiAgICAgICAgJChkb2N1bWVudCkubW91c2V1cCh0aGlzLmRvY3VtZW50TW91c2V1cCk7XG4gICAgICAgIHRoaXMuZG9jdW1lbnRNb3VzZW1vdmUgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICBfdGhpcy5tb3VzZU1vdmVTY3JvbGwoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICAkKGRvY3VtZW50KS5tb3VzZW1vdmUodGhpcy5kb2N1bWVudE1vdXNlbW92ZSk7XG4gICAgICAgIHRoaXMuJHRodW1iLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZU1vdXNlTW92ZVNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiR0aHVtYi51bmJpbmQoKTtcbiAgICAgICAgJChkb2N1bWVudCkudW5iaW5kKFwibW91c2V1cFwiLCB0aGlzLmRvY3VtZW50TW91c2V1cCk7XG4gICAgICAgICQoZG9jdW1lbnQpLnVuYmluZChcIm1vdXNlbW92ZVwiLCB0aGlzLmRvY3VtZW50TW91c2Vtb3ZlKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRNb3VzZVdoZWVsU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kZWxlbWVudC5tb3VzZXdoZWVsKGZ1bmN0aW9uIChldmVudCwgZGVsdGEsIGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgICAgICAgaWYgKF90aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5tb3VzZVdoZWVsU2Nyb2xsKGRlbHRhWCwgZGVsdGFZKSkge1xuICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgcmVtb3ZlTW91c2VXaGVlbFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQudW5iaW5kKFwibW91c2V3aGVlbFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRUb3VjaFNjcm9sbGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgdGhpcy5lbGVtZW50VG91Y2hzdGFydCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLmVuYWJsZWQpXG4gICAgICAgICAgICAgIF90aGlzLnN0YXJ0VG91Y2hTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0uYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdGhpcy5lbGVtZW50VG91Y2hzdGFydCk7XG4gICAgICAgICAgdGhpcy5kb2N1bWVudFRvdWNobW92ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgX3RoaXMudG91Y2hTY3JvbGwoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIHRoaXMuZG9jdW1lbnRUb3VjaG1vdmUpO1xuICAgICAgICAgIHRoaXMuZWxlbWVudFRvdWNoZW5kID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBfdGhpcy5zdG9wVG91Y2hTY3JvbGxpbmcoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0uYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRoaXMuZWxlbWVudFRvdWNoZW5kKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgcmVtb3ZlVG91Y2hTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgdGhpcy5lbGVtZW50VG91Y2hzdGFydCk7XG4gICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLmRvY3VtZW50VG91Y2htb3ZlKTtcbiAgICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnRbMF0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIHRoaXMuZWxlbWVudFRvdWNoZW5kKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaW5pdE1vdXNlQ2xpY2tTY3JvbGxpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5zY3JvbGxCYXJDbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgIF90aGlzLm1vdXNlQ2xpY2tTY3JvbGwoZXZlbnQpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLiRzY3JvbGxCYXIuY2xpY2sodGhpcy5zY3JvbGxCYXJDbGljayk7XG4gICAgICB9LFxuXG4gICAgICByZW1vdmVNb3VzZUNsaWNrU2Nyb2xsaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJHNjcm9sbEJhci51bmJpbmQoXCJjbGlja1wiLCB0aGlzLnNjcm9sbEJhckNsaWNrKTtcbiAgICAgIH0sXG5cbiAgICAgIGluaXRXaW5kb3dSZXNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLnVwZGF0ZU9uV2luZG93UmVzaXplKSB7XG4gICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICB0aGlzLndpbmRvd1Jlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLnJlc2l6ZSgpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZSh0aGlzLndpbmRvd1Jlc2l6ZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHJlbW92ZVdpbmRvd1Jlc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHdpbmRvdykudW5iaW5kKFwicmVzaXplXCIsIHRoaXMud2luZG93UmVzaXplKTtcbiAgICAgIH0sXG5cbiAgICAgIGlzS2V5U2Nyb2xsaW5nOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmtleVNjcm9sbERlbHRhKGtleSkgIT0gbnVsbDtcbiAgICAgIH0sXG5cbiAgICAgIGtleVNjcm9sbERlbHRhOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGZvciAodmFyIHNjcm9sbGluZ0tleSBpbiB0aGlzLnNpemluZy5zY3JvbGxpbmdLZXlzKVxuICAgICAgICAgIGlmIChzY3JvbGxpbmdLZXkgPT0ga2V5KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2l6aW5nLnNjcm9sbGluZ0tleXNba2V5XSh0aGlzLnZpZXdQb3J0U2l6ZSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSxcblxuICAgICAgc3RhcnRNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0aGlzLm1vdXNlTW92ZVNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICQoXCJodG1sXCIpLmFkZENsYXNzKFwibm90LXNlbGVjdGFibGVcIik7XG4gICAgICAgIHRoaXMuc2V0VW5zZWxlY3RhYmxlKCQoXCJodG1sXCIpLCBcIm9uXCIpO1xuICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50KTtcbiAgICAgIH0sXG5cbiAgICAgIHN0b3BNb3VzZU1vdmVTY3JvbGxpbmc6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0aGlzLm1vdXNlTW92ZVNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICAkKFwiaHRtbFwiKS5yZW1vdmVDbGFzcyhcIm5vdC1zZWxlY3RhYmxlXCIpO1xuICAgICAgICB0aGlzLnNldFVuc2VsZWN0YWJsZSgkKFwiaHRtbFwiKSwgbnVsbCk7XG4gICAgICB9LFxuXG4gICAgICBzZXRVbnNlbGVjdGFibGU6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZSkge1xuICAgICAgICBpZiAoZWxlbWVudC5hdHRyKFwidW5zZWxlY3RhYmxlXCIpICE9IHZhbHVlKSB7XG4gICAgICAgICAgZWxlbWVudC5hdHRyKFwidW5zZWxlY3RhYmxlXCIsIHZhbHVlKTtcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJzpub3QoaW5wdXQpJykuYXR0cigndW5zZWxlY3RhYmxlJywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBtb3VzZU1vdmVTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAodGhpcy5tb3VzZU1vdmVTY3JvbGxpbmcpIHtcbiAgICAgICAgICB2YXIgZGVsdGEgPSB0aGlzLnNpemluZy5tb3VzZURlbHRhKHRoaXMuc2Nyb2xsRXZlbnQsIGV2ZW50KTtcbiAgICAgICAgICB0aGlzLnNjcm9sbFRodW1iQnkoZGVsdGEpO1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsRXZlbnQoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBzdGFydFRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LnRvdWNoZXMgJiYgZXZlbnQudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsRXZlbnQoZXZlbnQudG91Y2hlc1swXSk7XG4gICAgICAgICAgdGhpcy50b3VjaFNjcm9sbGluZyA9IHRydWU7XG4gICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICAgIHRvdWNoU2Nyb2xsOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMudG91Y2hTY3JvbGxpbmcgJiYgZXZlbnQudG91Y2hlcyAmJiBldmVudC50b3VjaGVzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgdmFyIGRlbHRhID0gLXRoaXMuc2l6aW5nLm1vdXNlRGVsdGEodGhpcy5zY3JvbGxFdmVudCwgZXZlbnQudG91Y2hlc1swXSkgKiB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy5zd2lwZVNwZWVkO1xuICAgICAgICAgIHZhciBzY3JvbGxlZCA9IHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeShkZWx0YSk7XG4gICAgICAgICAgaWYgKHNjcm9sbGVkKSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnNldFNjcm9sbEV2ZW50KGV2ZW50LnRvdWNoZXNbMF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc3RvcFRvdWNoU2Nyb2xsaW5nOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdGhpcy50b3VjaFNjcm9sbGluZyA9IGZhbHNlO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlV2hlZWxTY3JvbGw6IGZ1bmN0aW9uIChkZWx0YVgsIGRlbHRhWSkge1xuICAgICAgICB2YXIgZGVsdGEgPSAtdGhpcy5zaXppbmcud2hlZWxEZWx0YShkZWx0YVgsIGRlbHRhWSkgKiB0aGlzLnNjcm9sbGFibGUub3B0aW9ucy53aGVlbFNwZWVkO1xuICAgICAgICBpZiAoZGVsdGEgIT0gMClcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxPdmVydmlld0J5KGRlbHRhKTtcbiAgICAgIH0sXG5cbiAgICAgIG1vdXNlQ2xpY2tTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgZGVsdGEgPSB0aGlzLnZpZXdQb3J0U2l6ZSAtIDIwO1xuICAgICAgICBpZiAoZXZlbnRbXCJwYWdlXCIgKyB0aGlzLnNpemluZy5zY3JvbGxBeGlzKCldIDwgdGhpcy4kdGh1bWIub2Zmc2V0KClbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldKVxuICAgICAgICAvLyBtb3VzZSBjbGljayBvdmVyIHRodW1iXG4gICAgICAgICAgZGVsdGEgPSAtZGVsdGE7XG4gICAgICAgIHRoaXMuc2Nyb2xsT3ZlcnZpZXdCeShkZWx0YSk7XG4gICAgICB9LFxuXG4gICAgICBrZXlTY3JvbGw6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIga2V5RG93biA9IGV2ZW50LndoaWNoO1xuICAgICAgICBpZiAodGhpcy5lbmFibGVkICYmIHRoaXMuaXNLZXlTY3JvbGxpbmcoa2V5RG93bikpIHtcbiAgICAgICAgICBpZiAodGhpcy5zY3JvbGxPdmVydmlld0J5KHRoaXMua2V5U2Nyb2xsRGVsdGEoa2V5RG93bikpKVxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVGh1bWJCeTogZnVuY3Rpb24gKGRlbHRhKSB7XG4gICAgICAgIHZhciB0aHVtYlBvc2l0aW9uID0gdGhpcy50aHVtYlBvc2l0aW9uKCk7XG4gICAgICAgIHRodW1iUG9zaXRpb24gKz0gZGVsdGE7XG4gICAgICAgIHRodW1iUG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uT3JNYXgodGh1bWJQb3NpdGlvbiwgdGhpcy5tYXhUaHVtYlBvc2l0aW9uKTtcbiAgICAgICAgdmFyIG9sZFNjcm9sbFBlcmNlbnQgPSB0aGlzLnNjcm9sbFBlcmNlbnQ7XG4gICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IHRodW1iUG9zaXRpb24gLyB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gKHRodW1iUG9zaXRpb24gKiB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24pIC8gdGhpcy5tYXhUaHVtYlBvc2l0aW9uO1xuICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICBpZiAob2xkU2Nyb2xsUGVyY2VudCAhPSB0aGlzLnNjcm9sbFBlcmNlbnQpIHtcbiAgICAgICAgICB0aGlzLnRyaWdnZXJDdXN0b21TY3JvbGwob2xkU2Nyb2xsUGVyY2VudCk7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcblxuICAgICAgdGh1bWJQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kdGh1bWIucG9zaXRpb24oKVt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV07XG4gICAgICB9LFxuXG4gICAgICBzY3JvbGxPdmVydmlld0J5OiBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICAgICAgdmFyIG92ZXJ2aWV3UG9zaXRpb24gPSB0aGlzLm92ZXJ2aWV3UG9zaXRpb24oKSArIGRlbHRhO1xuICAgICAgICByZXR1cm4gdGhpcy5zY3JvbGxPdmVydmlld1RvKG92ZXJ2aWV3UG9zaXRpb24sIGZhbHNlKTtcbiAgICAgIH0sXG5cbiAgICAgIG92ZXJ2aWV3UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIC10aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3LnBvc2l0aW9uKClbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsT3ZlcnZpZXdUbzogZnVuY3Rpb24gKG92ZXJ2aWV3UG9zaXRpb24sIGFuaW1hdGUpIHtcbiAgICAgICAgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMucG9zaXRpb25Pck1heChvdmVydmlld1Bvc2l0aW9uLCB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24pO1xuICAgICAgICB2YXIgb2xkU2Nyb2xsUGVyY2VudCA9IHRoaXMuc2Nyb2xsUGVyY2VudDtcbiAgICAgICAgdGhpcy5zY3JvbGxQZXJjZW50ID0gb3ZlcnZpZXdQb3NpdGlvbiAvIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbjtcbiAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgIGlmIChhbmltYXRlKVxuICAgICAgICAgIHRoaXMuc2V0U2Nyb2xsUG9zaXRpb25XaXRoQW5pbWF0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgaWYgKG9sZFNjcm9sbFBlcmNlbnQgIT0gdGhpcy5zY3JvbGxQZXJjZW50KSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyQ3VzdG9tU2Nyb2xsKG9sZFNjcm9sbFBlcmNlbnQpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuXG4gICAgICBwb3NpdGlvbk9yTWF4OiBmdW5jdGlvbiAocCwgbWF4KSB7XG4gICAgICAgIGlmIChwIDwgMClcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgZWxzZSBpZiAocCA+IG1heClcbiAgICAgICAgICByZXR1cm4gbWF4O1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIHA7XG4gICAgICB9LFxuXG4gICAgICB0cmlnZ2VyQ3VzdG9tU2Nyb2xsOiBmdW5jdGlvbiAob2xkU2Nyb2xsUGVyY2VudCkge1xuICAgICAgICB0aGlzLnNjcm9sbGFibGUuJGVsZW1lbnQudHJpZ2dlcihcImN1c3RvbVNjcm9sbFwiLCB7XG4gICAgICAgICAgICBzY3JvbGxBeGlzOiB0aGlzLnNpemluZy5zY3JvbGxBeGlzKCksXG4gICAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuc2l6aW5nLnNjcm9sbERpcmVjdGlvbihvbGRTY3JvbGxQZXJjZW50LCB0aGlzLnNjcm9sbFBlcmNlbnQpLFxuICAgICAgICAgICAgc2Nyb2xsUGVyY2VudDogdGhpcy5zY3JvbGxQZXJjZW50ICogMTAwXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfSxcblxuICAgICAgcmVzY3JvbGw6IGZ1bmN0aW9uIChrZWVwUG9zaXRpb24pIHtcbiAgICAgICAgaWYgKGtlZXBQb3NpdGlvbikge1xuICAgICAgICAgIHZhciBvdmVydmlld1Bvc2l0aW9uID0gdGhpcy5wb3NpdGlvbk9yTWF4KHRoaXMub3ZlcnZpZXdQb3NpdGlvbigpLCB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb24pO1xuICAgICAgICAgIHRoaXMuc2Nyb2xsUGVyY2VudCA9IG92ZXJ2aWV3UG9zaXRpb24gLyB0aGlzLm1heE92ZXJ2aWV3UG9zaXRpb247XG4gICAgICAgICAgdmFyIHRodW1iUG9zaXRpb24gPSB0aGlzLnNjcm9sbFBlcmNlbnQgKiB0aGlzLm1heFRodW1iUG9zaXRpb247XG4gICAgICAgICAgdGhpcy5zZXRTY3JvbGxQb3NpdGlvbihvdmVydmlld1Bvc2l0aW9uLCB0aHVtYlBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB2YXIgdGh1bWJQb3NpdGlvbiA9IHRoaXMuc2Nyb2xsUGVyY2VudCAqIHRoaXMubWF4VGh1bWJQb3NpdGlvbjtcbiAgICAgICAgICB2YXIgb3ZlcnZpZXdQb3NpdGlvbiA9IHRoaXMuc2Nyb2xsUGVyY2VudCAqIHRoaXMubWF4T3ZlcnZpZXdQb3NpdGlvbjtcbiAgICAgICAgICB0aGlzLnNldFNjcm9sbFBvc2l0aW9uKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBzZXRTY3JvbGxQb3NpdGlvbjogZnVuY3Rpb24gKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pIHtcbiAgICAgICAgdGhpcy4kdGh1bWIuY3NzKHRoaXMuc2l6aW5nLm9mZnNldENvbXBvbmVudCgpLCB0aHVtYlBvc2l0aW9uICsgXCJweFwiKTtcbiAgICAgICAgdGhpcy5zY3JvbGxhYmxlLiRvdmVydmlldy5jc3ModGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCksIC1vdmVydmlld1Bvc2l0aW9uICsgXCJweFwiKTtcbiAgICAgIH0sXG5cbiAgICAgIHNldFNjcm9sbFBvc2l0aW9uV2l0aEFuaW1hdGlvbjogZnVuY3Rpb24gKG92ZXJ2aWV3UG9zaXRpb24sIHRodW1iUG9zaXRpb24pIHtcbiAgICAgICAgdmFyIHRodW1iQW5pbWF0aW9uT3B0cyA9IHt9O1xuICAgICAgICB2YXIgb3ZlcnZpZXdBbmltYXRpb25PcHRzID0ge307XG4gICAgICAgIHRodW1iQW5pbWF0aW9uT3B0c1t0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0gPSB0aHVtYlBvc2l0aW9uICsgXCJweFwiO1xuICAgICAgICB0aGlzLiR0aHVtYi5hbmltYXRlKHRodW1iQW5pbWF0aW9uT3B0cywgdGhpcy5zY3JvbGxhYmxlLm9wdGlvbnMuYW5pbWF0aW9uU3BlZWQpO1xuICAgICAgICBvdmVydmlld0FuaW1hdGlvbk9wdHNbdGhpcy5zaXppbmcub2Zmc2V0Q29tcG9uZW50KCldID0gLW92ZXJ2aWV3UG9zaXRpb24gKyBcInB4XCI7XG4gICAgICAgIHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcuYW5pbWF0ZShvdmVydmlld0FuaW1hdGlvbk9wdHMsIHRoaXMuc2Nyb2xsYWJsZS5vcHRpb25zLmFuaW1hdGlvblNwZWVkKTtcbiAgICAgIH0sXG5cbiAgICAgIGNhbGN1bGF0ZU1heFRodW1iUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6aW5nLnNpemUodGhpcy4kc2Nyb2xsQmFyKSAtIHRoaXMudGh1bWJTaXplO1xuICAgICAgfSxcblxuICAgICAgY2FsY3VsYXRlTWF4T3ZlcnZpZXdQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaXppbmcuc2l6ZSh0aGlzLnNjcm9sbGFibGUuJG92ZXJ2aWV3KSAtIHRoaXMuc2l6aW5nLnNpemUodGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCk7XG4gICAgICB9LFxuXG4gICAgICBzZXRTY3JvbGxFdmVudDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBhdHRyID0gXCJwYWdlXCIgKyB0aGlzLnNpemluZy5zY3JvbGxBeGlzKCk7XG4gICAgICAgIGlmICghdGhpcy5zY3JvbGxFdmVudCB8fCB0aGlzLnNjcm9sbEV2ZW50W2F0dHJdICE9IGV2ZW50W2F0dHJdKVxuICAgICAgICAgIHRoaXMuc2Nyb2xsRXZlbnQgPSB7cGFnZVg6IGV2ZW50LnBhZ2VYLCBwYWdlWTogZXZlbnQucGFnZVl9O1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsVG9FbGVtZW50OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgICBpZiAodGhpcy5zaXppbmcuaXNJbnNpZGUoJGVsZW1lbnQsIHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcpICYmICF0aGlzLnNpemluZy5pc0luc2lkZSgkZWxlbWVudCwgdGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydCkpIHtcbiAgICAgICAgICB2YXIgZWxlbWVudE9mZnNldCA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICAgIHZhciBvdmVydmlld09mZnNldCA9IHRoaXMuc2Nyb2xsYWJsZS4kb3ZlcnZpZXcub2Zmc2V0KCk7XG4gICAgICAgICAgdmFyIHZpZXdQb3J0T2Zmc2V0ID0gdGhpcy5zY3JvbGxhYmxlLiR2aWV3UG9ydC5vZmZzZXQoKTtcbiAgICAgICAgICB0aGlzLnNjcm9sbE92ZXJ2aWV3VG8oZWxlbWVudE9mZnNldFt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0gLSBvdmVydmlld09mZnNldFt0aGlzLnNpemluZy5vZmZzZXRDb21wb25lbnQoKV0sIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVNb3VzZU1vdmVTY3JvbGxpbmcoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVNb3VzZVdoZWVsU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlVG91Y2hTY3JvbGxpbmcoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVNb3VzZUNsaWNrU2Nyb2xsaW5nKCk7XG4gICAgICAgIHRoaXMucmVtb3ZlV2luZG93UmVzaXplKCk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgSFNpemluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9XG5cbiAgICBIU2l6aW5nLnByb3RvdHlwZSA9IHtcbiAgICAgIHNpemU6IGZ1bmN0aW9uICgkZWwsIGFyZykge1xuICAgICAgICBpZiAoYXJnKVxuICAgICAgICAgIHJldHVybiAkZWwud2lkdGgoYXJnKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkZWwud2lkdGgoKTtcbiAgICAgIH0sXG5cbiAgICAgIG1pblNpemU6IGZ1bmN0aW9uICgkZWwpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KCRlbC5jc3MoXCJtaW4td2lkdGhcIikpIHx8IDA7XG4gICAgICB9LFxuXG4gICAgICBmaXhlZFRodW1iU2l6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZml4ZWRUaHVtYldpZHRoO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsQmFyOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiAkZWwuZmluZChcIi5zY3JvbGwtYmFyLmhvcml6b250YWxcIik7XG4gICAgICB9LFxuXG4gICAgICBtb3VzZURlbHRhOiBmdW5jdGlvbiAoZXZlbnQxLCBldmVudDIpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50Mi5wYWdlWCAtIGV2ZW50MS5wYWdlWDtcbiAgICAgIH0sXG5cbiAgICAgIG9mZnNldENvbXBvbmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXCJsZWZ0XCI7XG4gICAgICB9LFxuXG4gICAgICB3aGVlbERlbHRhOiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgcmV0dXJuIGRlbHRhWDtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEF4aXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWFwiO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsRGlyZWN0aW9uOiBmdW5jdGlvbiAob2xkUGVyY2VudCwgbmV3UGVyY2VudCkge1xuICAgICAgICByZXR1cm4gb2xkUGVyY2VudCA8IG5ld1BlcmNlbnQgPyBcInJpZ2h0XCIgOiBcImxlZnRcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbGluZ0tleXM6IHtcbiAgICAgICAgMzc6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gLTEwOyAvL2Fycm93IGxlZnRcbiAgICAgICAgfSxcbiAgICAgICAgMzk6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gMTA7IC8vYXJyb3cgcmlnaHRcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaXNJbnNpZGU6IGZ1bmN0aW9uIChlbGVtZW50LCB3cmFwcGluZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgdmFyICR3cmFwcGluZ0VsZW1lbnQgPSAkKHdyYXBwaW5nRWxlbWVudCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciB3cmFwcGluZ0VsZW1lbnRPZmZzZXQgPSAkd3JhcHBpbmdFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICByZXR1cm4gKGVsZW1lbnRPZmZzZXQubGVmdCA+PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQubGVmdCkgJiZcbiAgICAgICAgICAoZWxlbWVudE9mZnNldC5sZWZ0ICsgJGVsZW1lbnQud2lkdGgoKSA8PSB3cmFwcGluZ0VsZW1lbnRPZmZzZXQubGVmdCArICR3cmFwcGluZ0VsZW1lbnQud2lkdGgoKSk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICB2YXIgVlNpemluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB9XG5cbiAgICBWU2l6aW5nLnByb3RvdHlwZSA9IHtcblxuICAgICAgc2l6ZTogZnVuY3Rpb24gKCRlbCwgYXJnKSB7XG4gICAgICAgIGlmIChhcmcpXG4gICAgICAgICAgcmV0dXJuICRlbC5oZWlnaHQoYXJnKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiAkZWwuaGVpZ2h0KCk7XG4gICAgICB9LFxuXG4gICAgICBtaW5TaXplOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludCgkZWwuY3NzKFwibWluLWhlaWdodFwiKSkgfHwgMDtcbiAgICAgIH0sXG5cbiAgICAgIGZpeGVkVGh1bWJTaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5maXhlZFRodW1iSGVpZ2h0O1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsQmFyOiBmdW5jdGlvbiAoJGVsKSB7XG4gICAgICAgIHJldHVybiAkZWwuZmluZChcIi5zY3JvbGwtYmFyLnZlcnRpY2FsXCIpO1xuICAgICAgfSxcblxuICAgICAgbW91c2VEZWx0YTogZnVuY3Rpb24gKGV2ZW50MSwgZXZlbnQyKSB7XG4gICAgICAgIHJldHVybiBldmVudDIucGFnZVkgLSBldmVudDEucGFnZVk7XG4gICAgICB9LFxuXG4gICAgICBvZmZzZXRDb21wb25lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwidG9wXCI7XG4gICAgICB9LFxuXG4gICAgICB3aGVlbERlbHRhOiBmdW5jdGlvbiAoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICAgICAgcmV0dXJuIGRlbHRhWTtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbEF4aXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiWVwiO1xuICAgICAgfSxcblxuICAgICAgc2Nyb2xsRGlyZWN0aW9uOiBmdW5jdGlvbiAob2xkUGVyY2VudCwgbmV3UGVyY2VudCkge1xuICAgICAgICByZXR1cm4gb2xkUGVyY2VudCA8IG5ld1BlcmNlbnQgPyBcImRvd25cIiA6IFwidXBcIjtcbiAgICAgIH0sXG5cbiAgICAgIHNjcm9sbGluZ0tleXM6IHtcbiAgICAgICAgMzg6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gLTEwOyAvL2Fycm93IHVwXG4gICAgICAgIH0sXG4gICAgICAgIDQwOiBmdW5jdGlvbiAodmlld1BvcnRTaXplKSB7XG4gICAgICAgICAgcmV0dXJuIDEwOyAvL2Fycm93IGRvd25cbiAgICAgICAgfSxcbiAgICAgICAgMzM6IGZ1bmN0aW9uICh2aWV3UG9ydFNpemUpIHtcbiAgICAgICAgICByZXR1cm4gLSh2aWV3UG9ydFNpemUgLSAyMCk7IC8vcGFnZSB1cFxuICAgICAgICB9LFxuICAgICAgICAzNDogZnVuY3Rpb24gKHZpZXdQb3J0U2l6ZSkge1xuICAgICAgICAgIHJldHVybiB2aWV3UG9ydFNpemUgLSAyMDsgLy9wYWdlIGRvd25cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaXNJbnNpZGU6IGZ1bmN0aW9uIChlbGVtZW50LCB3cmFwcGluZ0VsZW1lbnQpIHtcbiAgICAgICAgdmFyICRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICAgICAgdmFyICR3cmFwcGluZ0VsZW1lbnQgPSAkKHdyYXBwaW5nRWxlbWVudCk7XG4gICAgICAgIHZhciBlbGVtZW50T2Zmc2V0ID0gJGVsZW1lbnQub2Zmc2V0KCk7XG4gICAgICAgIHZhciB3cmFwcGluZ0VsZW1lbnRPZmZzZXQgPSAkd3JhcHBpbmdFbGVtZW50Lm9mZnNldCgpO1xuICAgICAgICByZXR1cm4gKGVsZW1lbnRPZmZzZXQudG9wID49IHdyYXBwaW5nRWxlbWVudE9mZnNldC50b3ApICYmXG4gICAgICAgICAgKGVsZW1lbnRPZmZzZXQudG9wICsgJGVsZW1lbnQuaGVpZ2h0KCkgPD0gd3JhcHBpbmdFbGVtZW50T2Zmc2V0LnRvcCArICR3cmFwcGluZ0VsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PSB1bmRlZmluZWQpXG4gICAgICAgIG9wdGlvbnMgPSBkZWZhdWx0T3B0aW9ucztcbiAgICAgIGlmICh0eXBlb2Yob3B0aW9ucykgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB2YXIgc2Nyb2xsYWJsZSA9ICQodGhpcykuZGF0YShcInNjcm9sbGFibGVcIik7XG4gICAgICAgIGlmIChzY3JvbGxhYmxlKVxuICAgICAgICAgIHNjcm9sbGFibGVbb3B0aW9uc10oYXJncyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2Yob3B0aW9ucykgPT0gXCJvYmplY3RcIikge1xuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQoZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICBuZXcgU2Nyb2xsYWJsZSgkKHRoaXMpLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgXCJJbnZhbGlkIHR5cGUgb2Ygb3B0aW9uc1wiO1xuICAgIH0pO1xuXG4gIH1cbiAgO1xuXG59KVxuICAoalF1ZXJ5KTtcblxuKGZ1bmN0aW9uICgkKSB7XG5cbiAgdmFyIHR5cGVzID0gWydET01Nb3VzZVNjcm9sbCcsICdtb3VzZXdoZWVsJ107XG5cbiAgaWYgKCQuZXZlbnQuZml4SG9va3MpIHtcbiAgICBmb3IgKHZhciBpID0gdHlwZXMubGVuZ3RoOyBpOykge1xuICAgICAgJC5ldmVudC5maXhIb29rc1sgdHlwZXNbLS1pXSBdID0gJC5ldmVudC5tb3VzZUhvb2tzO1xuICAgIH1cbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5tb3VzZXdoZWVsID0ge1xuICAgIHNldHVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSB0eXBlcy5sZW5ndGg7IGk7KSB7XG4gICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKHR5cGVzWy0taV0sIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vbm1vdXNld2hlZWwgPSBoYW5kbGVyO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB0ZWFyZG93bjogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICBmb3IgKHZhciBpID0gdHlwZXMubGVuZ3RoOyBpOykge1xuICAgICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlc1stLWldLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25tb3VzZXdoZWVsID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJC5mbi5leHRlbmQoe1xuICAgIG1vdXNld2hlZWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgcmV0dXJuIGZuID8gdGhpcy5iaW5kKFwibW91c2V3aGVlbFwiLCBmbikgOiB0aGlzLnRyaWdnZXIoXCJtb3VzZXdoZWVsXCIpO1xuICAgIH0sXG5cbiAgICB1bm1vdXNld2hlZWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgcmV0dXJuIHRoaXMudW5iaW5kKFwibW91c2V3aGVlbFwiLCBmbik7XG4gICAgfVxuICB9KTtcblxuXG4gIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcbiAgICB2YXIgb3JnRXZlbnQgPSBldmVudCB8fCB3aW5kb3cuZXZlbnQsIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGRlbHRhID0gMCwgcmV0dXJuVmFsdWUgPSB0cnVlLCBkZWx0YVggPSAwLCBkZWx0YVkgPSAwO1xuICAgIGV2ZW50ID0gJC5ldmVudC5maXgob3JnRXZlbnQpO1xuICAgIGV2ZW50LnR5cGUgPSBcIm1vdXNld2hlZWxcIjtcblxuICAgIC8vIE9sZCBzY2hvb2wgc2Nyb2xsd2hlZWwgZGVsdGFcbiAgICBpZiAob3JnRXZlbnQud2hlZWxEZWx0YSkge1xuICAgICAgZGVsdGEgPSBvcmdFdmVudC53aGVlbERlbHRhIC8gMTIwO1xuICAgIH1cbiAgICBpZiAob3JnRXZlbnQuZGV0YWlsKSB7XG4gICAgICBkZWx0YSA9IC1vcmdFdmVudC5kZXRhaWwgLyAzO1xuICAgIH1cblxuICAgIC8vIE5ldyBzY2hvb2wgbXVsdGlkaW1lbnNpb25hbCBzY3JvbGwgKHRvdWNocGFkcykgZGVsdGFzXG4gICAgZGVsdGFZID0gZGVsdGE7XG5cbiAgICAvLyBHZWNrb1xuICAgIGlmIChvcmdFdmVudC5heGlzICE9PSB1bmRlZmluZWQgJiYgb3JnRXZlbnQuYXhpcyA9PT0gb3JnRXZlbnQuSE9SSVpPTlRBTF9BWElTKSB7XG4gICAgICBkZWx0YVkgPSAwO1xuICAgICAgZGVsdGFYID0gZGVsdGE7XG4gICAgfVxuXG4gICAgLy8gV2Via2l0XG4gICAgaWYgKG9yZ0V2ZW50LndoZWVsRGVsdGFZICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlbHRhWSA9IG9yZ0V2ZW50LndoZWVsRGVsdGFZIC8gMTIwO1xuICAgIH1cbiAgICBpZiAob3JnRXZlbnQud2hlZWxEZWx0YVggIT09IHVuZGVmaW5lZCkge1xuICAgICAgZGVsdGFYID0gb3JnRXZlbnQud2hlZWxEZWx0YVggLyAxMjA7XG4gICAgfVxuXG4gICAgLy8gQWRkIGV2ZW50IGFuZCBkZWx0YSB0byB0aGUgZnJvbnQgb2YgdGhlIGFyZ3VtZW50c1xuICAgIGFyZ3MudW5zaGlmdChldmVudCwgZGVsdGEsIGRlbHRhWCwgZGVsdGFZKTtcblxuICAgIHJldHVybiAoJC5ldmVudC5kaXNwYXRjaCB8fCAkLmV2ZW50LmhhbmRsZSkuYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxufSkoalF1ZXJ5KTtcbiIsIi8vIFN0b3JhZ2UgY2FjaGUuXHJcbnZhciBjYWNoZSA9IHt9O1xyXG4vLyBUaGUgc3RvcmUgaGFuZGxpbmcgZXhwaXJhdGlvbiBvZiBkYXRhLlxyXG52YXIgZXhwaXJlc1N0b3JlID0gbmV3IFN0b3JlKHtcclxuXHRuYW1lc3BhY2U6ICdfX3N0b3JhZ2Utd3JhcHBlcjpleHBpcmVzJ1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBTdG9yYWdlIHdyYXBwZXIgZm9yIG1ha2luZyByb3V0aW5lIHN0b3JhZ2UgY2FsbHMgc3VwZXIgZWFzeS5cclxuICogQGNsYXNzIFN0b3JlXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdICAgICAgICAgICAgICAgICAgICAgVGhlIG9wdGlvbnMgZm9yIHRoZSBzdG9yZS4gT3B0aW9ucyBub3Qgb3ZlcnJpZGRlbiB3aWxsIHVzZSB0aGUgZGVmYXVsdHMuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBbb3B0aW9ucy5uYW1lc3BhY2U9JyddICAgICAgICBTZWUge3sjY3Jvc3NMaW5rIFwiU3RvcmUvc2V0TmFtZXNwYWNlXCJ9fVN0b3JlI3NldE5hbWVzcGFjZXt7L2Nyb3NzTGlua319XHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBbb3B0aW9ucy5zdG9yYWdlVHlwZT0nbG9jYWwnXSBTZWUge3sjY3Jvc3NMaW5rIFwiU3RvcmUvc2V0U3RvcmFnZVR5cGVcIn19U3RvcmUjc2V0U3RvcmFnZVR5cGV7ey9jcm9zc0xpbmt9fVxyXG4gKi9cclxuZnVuY3Rpb24gU3RvcmUob3B0aW9ucykge1xyXG5cdHZhciBzZXR0aW5ncyA9IHtcclxuXHRcdG5hbWVzcGFjZTogJycsXHJcblx0XHRzdG9yYWdlVHlwZTogJ2xvY2FsJ1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIHN0b3JhZ2UgbmFtZXNwYWNlLlxyXG5cdCAqIEBtZXRob2Qgc2V0TmFtZXNwYWNlXHJcblx0ICogQHBhcmFtIHtzdHJpbmd8ZmFsc2V8bnVsbH0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgdG8gd29yayB1bmRlci4gVG8gdXNlIG5vIG5hbWVzcGFjZSAoZS5nLiBnbG9iYWwgbmFtZXNwYWNlKSwgcGFzcyBpbiBgZmFsc2VgIG9yIGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcuXHJcblx0ICovXHJcblx0dGhpcy5zZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XHJcblx0XHR2YXIgdmFsaWROYW1lc3BhY2UgPSAvXltcXHctOl0rJC87XHJcblx0XHQvLyBObyBuYW1lc3BhY2UuXHJcblx0XHRpZiAobmFtZXNwYWNlID09PSBmYWxzZSB8fCBuYW1lc3BhY2UgPT0gbnVsbCB8fCBuYW1lc3BhY2UgPT09ICcnKSB7XHJcblx0XHRcdHNldHRpbmdzLm5hbWVzcGFjZSA9ICcnO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mIG5hbWVzcGFjZSAhPT0gJ3N0cmluZycgfHwgIXZhbGlkTmFtZXNwYWNlLnRlc3QobmFtZXNwYWNlKSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbmFtZXNwYWNlLicpO1xyXG5cdFx0fVxyXG5cdFx0c2V0dGluZ3MubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGN1cnJlbnQgc3RvcmFnZSBuYW1lc3BhY2UuXHJcblx0ICogQG1ldGhvZCBnZXROYW1lc3BhY2VcclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuXHQgKi9cclxuXHR0aGlzLmdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChpbmNsdWRlU2VwYXJhdG9yKSB7XHJcblx0XHRpZiAoaW5jbHVkZVNlcGFyYXRvciAmJiBzZXR0aW5ncy5uYW1lc3BhY2UgIT09ICcnKSB7XHJcblx0XHRcdHJldHVybiBzZXR0aW5ncy5uYW1lc3BhY2UgKyAnOic7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc2V0dGluZ3MubmFtZXNwYWNlO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgdHlwZSBvZiBzdG9yYWdlIHRvIHVzZS5cclxuXHQgKiBAbWV0aG9kIHNldFN0b3JhZ2VUeXBlXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgVGhlIHR5cGUgb2Ygc3RvcmFnZSB0byB1c2UuIFVzZSBgc2Vzc2lvbmAgZm9yIGBzZXNzaW9uU3RvcmFnZWAgYW5kIGBsb2NhbGAgZm9yIGBsb2NhbFN0b3JhZ2VgLlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0U3RvcmFnZVR5cGUgPSBmdW5jdGlvbiAodHlwZSkge1xyXG5cdFx0aWYgKFsnc2Vzc2lvbicsICdsb2NhbCddLmluZGV4T2YodHlwZSkgPCAwKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdG9yYWdlIHR5cGUuJyk7XHJcblx0XHR9XHJcblx0XHRzZXR0aW5ncy5zdG9yYWdlVHlwZSA9IHR5cGU7XHJcblx0fTtcclxuXHQvKipcclxuXHQgKiBHZXQgdGhlIHR5cGUgb2Ygc3RvcmFnZSBiZWluZyB1c2VkLlxyXG5cdCAqIEBtZXRob2QgZ2V0U3RvcmFnZVR5cGVcclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB0eXBlIG9mIHN0b3JhZ2UgYmVpbmcgdXNlZC5cclxuXHQgKi9cclxuXHR0aGlzLmdldFN0b3JhZ2VUeXBlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHNldHRpbmdzLnN0b3JhZ2VUeXBlO1xyXG5cdH07XHJcblxyXG5cdC8vIE92ZXJyaWRlIGRlZmF1bHQgc2V0dGluZ3MuXHJcblx0aWYgKG9wdGlvbnMpIHtcclxuXHRcdGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XHJcblx0XHRcdHN3aXRjaCAoa2V5KSB7XHJcblx0XHRcdFx0Y2FzZSAnbmFtZXNwYWNlJzpcclxuXHRcdFx0XHRcdHRoaXMuc2V0TmFtZXNwYWNlKG9wdGlvbnNba2V5XSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRjYXNlICdzdG9yYWdlVHlwZSc6XHJcblx0XHRcdFx0XHR0aGlzLnNldFN0b3JhZ2VUeXBlKG9wdGlvbnNba2V5XSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGFjdHVhbCBoYW5kbGVyIHRvIHVzZVxyXG4gKiBAbWV0aG9kIGdldFN0b3JhZ2VIYW5kbGVyXHJcbiAqIEByZXR1cm4ge21peGVkfSBUaGUgc3RvcmFnZSBoYW5kbGVyLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldFN0b3JhZ2VIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBoYW5kbGVycyA9IHtcclxuXHRcdCdsb2NhbCc6IGxvY2FsU3RvcmFnZSxcclxuXHRcdCdzZXNzaW9uJzogc2Vzc2lvblN0b3JhZ2VcclxuXHR9O1xyXG5cdHJldHVybiBoYW5kbGVyc1t0aGlzLmdldFN0b3JhZ2VUeXBlKCldO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgZnVsbCBzdG9yYWdlIG5hbWUgZm9yIGEga2V5LCBpbmNsdWRpbmcgdGhlIG5hbWVzcGFjZSwgaWYgYW55LlxyXG4gKiBAbWV0aG9kIGdldFN0b3JhZ2VLZXlcclxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkgVGhlIHN0b3JhZ2Uga2V5IG5hbWUuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gICAgIFRoZSBmdWxsIHN0b3JhZ2UgbmFtZSB0aGF0IGlzIHVzZWQgYnkgdGhlIHN0b3JhZ2UgbWV0aG9kcy5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXRTdG9yYWdlS2V5ID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdGlmICgha2V5IHx8IHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleS5sZW5ndGggPCAxKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0tleSBtdXN0IGJlIGEgc3RyaW5nLicpO1xyXG5cdH1cclxuXHRyZXR1cm4gdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkgKyBrZXk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0b3JhZ2UgaXRlbSBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBnZXRcclxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkgICAgICAgICAgVGhlIGtleSB0aGF0IHRoZSBkYXRhIGNhbiBiZSBhY2Nlc3NlZCB1bmRlci5cclxuICogQHBhcmFtICB7bWl4ZWR9ICBkZWZhdWx0VmFsdWUgVGhlIGRlZmF1bHQgdmFsdWUgdG8gcmV0dXJuIGluIGNhc2UgdGhlIHN0b3JhZ2UgdmFsdWUgaXMgbm90IHNldCBvciBgbnVsbGAuXHJcbiAqIEByZXR1cm4ge21peGVkfSAgICAgICAgICAgICAgIFRoZSBkYXRhIGZvciB0aGUgc3RvcmFnZS5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5LCBkZWZhdWx0VmFsdWUpIHtcclxuXHQvLyBQcmV2ZW50IHJlY3Vyc2lvbi4gT25seSBjaGVjayBleHBpcmUgZGF0ZSBpZiBpdCBpc24ndCBjYWxsZWQgZnJvbSBgZXhwaXJlc1N0b3JlYC5cclxuXHRpZiAodGhpcyAhPT0gZXhwaXJlc1N0b3JlKSB7XHJcblx0XHQvLyBDaGVjayBpZiBrZXkgaXMgZXhwaXJlZC5cclxuXHRcdHZhciBleHBpcmVEYXRlID0gZXhwaXJlc1N0b3JlLmdldCh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcblx0XHRpZiAoZXhwaXJlRGF0ZSAhPT0gbnVsbCAmJiBleHBpcmVEYXRlLmdldFRpbWUoKSA8IERhdGUubm93KCkpIHtcclxuXHRcdFx0Ly8gRXhwaXJlZCwgcmVtb3ZlIGl0LlxyXG5cdFx0XHR0aGlzLnJlbW92ZShrZXkpO1xyXG5cdFx0XHRleHBpcmVzU3RvcmUucmVtb3ZlKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIENhY2hlZCwgcmVhZCBmcm9tIG1lbW9yeS5cclxuXHRpZiAoY2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldICE9IG51bGwpIHtcclxuXHRcdHJldHVybiBjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV07XHJcblx0fVxyXG5cclxuXHR2YXIgdmFsID0gdGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLmdldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG5cclxuXHQvLyBWYWx1ZSBkb2Vzbid0IGV4aXN0IGFuZCB3ZSBoYXZlIGEgZGVmYXVsdCwgcmV0dXJuIGRlZmF1bHQuXHJcblx0aWYgKHZhbCA9PT0gbnVsbCAmJiB0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHR9XHJcblxyXG5cdC8vIE9ubHkgcHJlLXByb2Nlc3Mgc3RyaW5ncy5cclxuXHRpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdC8vIEhhbmRsZSBSZWdFeHBzLlxyXG5cdFx0aWYgKHZhbC5pbmRleE9mKCd+UmVnRXhwOicpID09PSAwKSB7XHJcblx0XHRcdHZhciBtYXRjaGVzID0gL15+UmVnRXhwOihbZ2ltXSo/KTooLiopLy5leGVjKHZhbCk7XHJcblx0XHRcdHZhbCA9IG5ldyBSZWdFeHAobWF0Y2hlc1syXSwgbWF0Y2hlc1sxXSk7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgRGF0ZXMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfkRhdGU6JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gbmV3IERhdGUodmFsLnJlcGxhY2UoL15+RGF0ZTovLCAnJykpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIG51bWJlcnMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfk51bWJlcjonKSA9PT0gMCkge1xyXG5cdFx0XHR2YWwgPSBwYXJzZUludCh2YWwucmVwbGFjZSgvXn5OdW1iZXI6LywgJycpLCAxMCk7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgYm9vbGVhbnMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfkJvb2xlYW46JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gdmFsLnJlcGxhY2UoL15+Qm9vbGVhbjovLCAnJykgPT09ICd0cnVlJztcclxuXHRcdH1cclxuXHRcdC8vIEhhbmRsZSBvYmplY3RzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35KU09OOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IHZhbC5yZXBsYWNlKC9efkpTT046LywgJycpO1xyXG5cdFx0XHQvLyBUcnkgcGFyc2luZyBpdC5cclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHR2YWwgPSBKU09OLnBhcnNlKHZhbCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gUGFyc2luZyB3ZW50IHdyb25nIChpbnZhbGlkIEpTT04pLCByZXR1cm4gZGVmYXVsdCBvciBudWxsLlxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFJldHVybiBpdC5cclxuXHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSB2YWw7XHJcblx0cmV0dXJuIHZhbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGEgc3RvcmFnZSBpdGVtIG9uIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBzZXRcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAga2V5ICAgICAgIFRoZSBrZXkgdGhhdCB0aGUgZGF0YSBjYW4gYmUgYWNjZXNzZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICAgICAgIHZhbCAgICAgICBUaGUgdmFsdWUgdG8gc3RvcmUuIE1heSBiZSB0aGUgZm9sbG93aW5nIHR5cGVzIG9mIGRhdGE6IGBSZWdFeHBgLCBgRGF0ZWAsIGBPYmplY3RgLCBgU3RyaW5nYCwgYEJvb2xlYW5gLCBgTnVtYmVyYFxyXG4gKiBAcGFyYW0ge0RhdGV8bnVtYmVyfSBbZXhwaXJlc10gVGhlIGRhdGUgaW4gdGhlIGZ1dHVyZSB0byBleHBpcmUsIG9yIHJlbGF0aXZlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZnJvbSBgRGF0ZSNub3dgIHRvIGV4cGlyZS5cclxuICpcclxuICogTm90ZTogVGhpcyBjb252ZXJ0cyBzcGVjaWFsIGRhdGEgdHlwZXMgdGhhdCBub3JtYWxseSBjYW4ndCBiZSBzdG9yZWQgaW4gdGhlIGZvbGxvd2luZyB3YXk6XHJcbiAqIFxyXG4gKiAtIGBSZWdFeHBgOiBwcmVmaXhlZCB3aXRoIHR5cGUsIGZsYWdzIHN0b3JlZCwgYW5kIHNvdXJjZSBzdG9yZWQgYXMgc3RyaW5nLlxyXG4gKiAtIGBEYXRlYDogcHJlZml4ZWQgd2l0aCB0eXBlLCBzdG9yZWQgYXMgc3RyaW5nIHVzaW5nIGBEYXRlI3RvU3RyaW5nYC5cclxuICogLSBgT2JqZWN0YDogcHJlZml4ZWQgd2l0aCBcIkpTT05cIiBpbmRpY2F0b3IsIHN0b3JlZCBhcyBzdHJpbmcgdXNpbmcgYEpTT04jc3RyaW5naWZ5YC5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWwsIGV4cGlyZXMpIHtcclxuXHR2YXIgcGFyc2VkVmFsID0gbnVsbDtcclxuXHQvLyBIYW5kbGUgUmVnRXhwcy5cclxuXHRpZiAodmFsIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcblx0XHR2YXIgZmxhZ3MgPSBbXHJcblx0XHRcdHZhbC5nbG9iYWwgPyAnZycgOiAnJyxcclxuXHRcdFx0dmFsLmlnbm9yZUNhc2UgPyAnaScgOiAnJyxcclxuXHRcdFx0dmFsLm11bHRpbGluZSA/ICdtJyA6ICcnLFxyXG5cdFx0XS5qb2luKCcnKTtcclxuXHRcdHBhcnNlZFZhbCA9ICd+UmVnRXhwOicgKyBmbGFncyArICc6JyArIHZhbC5zb3VyY2U7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBEYXRlcy5cclxuXHRlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkRhdGU6JyArIHZhbC50b1N0cmluZygpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgb2JqZWN0cy5cclxuXHRlbHNlIGlmICh2YWwgPT09IE9iamVjdCh2YWwpKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkpTT046JyArIEpTT04uc3RyaW5naWZ5KHZhbCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBudW1iZXJzLlxyXG5cdGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfk51bWJlcjonICsgdmFsLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBib29sZWFucy5cclxuXHRlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnYm9vbGVhbicpIHtcclxuXHRcdHBhcnNlZFZhbCA9ICd+Qm9vbGVhbjonICsgdmFsLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBzdHJpbmdzLlxyXG5cdGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRwYXJzZWRWYWwgPSB2YWw7XHJcblx0fVxyXG5cdC8vIFRocm93IGlmIHdlIGRvbid0IGtub3cgd2hhdCBpdCBpcy5cclxuXHRlbHNlIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIHN0b3JlIHRoaXMgdmFsdWU7IHdyb25nIHZhbHVlIHR5cGUuJyk7XHJcblx0fVxyXG5cdC8vIFNldCBleHBpcmUgZGF0ZSBpZiBuZWVkZWQuXHJcblx0aWYgKHR5cGVvZiBleHBpcmVzICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0Ly8gQ29udmVydCB0byBhIHJlbGF0aXZlIGRhdGUuXHJcblx0XHRpZiAodHlwZW9mIGV4cGlyZXMgPT09ICdudW1iZXInKSB7XHJcblx0XHRcdGV4cGlyZXMgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgZXhwaXJlcyk7XHJcblx0XHR9XHJcblx0XHQvLyBNYWtlIHN1cmUgaXQgaXMgYSBkYXRlLlxyXG5cdFx0aWYgKGV4cGlyZXMgaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRcdGV4cGlyZXNTdG9yZS5zZXQodGhpcy5nZXRTdG9yYWdlS2V5KGtleSksIGV4cGlyZXMpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignS2V5IGV4cGlyZSBtdXN0IGJlIGEgdmFsaWQgZGF0ZSBvciB0aW1lc3RhbXAuJyk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vIFNhdmUgaXQuXHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gdmFsO1xyXG5cdHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5zZXRJdGVtKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpLCBwYXJzZWRWYWwpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYWxsIGRhdGEgZm9yIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBnZXRBbGxcclxuICogQHJldHVybiB7b2JqZWN0fSBBbiBvYmplY3QgY29udGFpbmluZyBhbGwgZGF0YSBpbiB0aGUgZm9ybSBvZiBge3RoZUtleTogdGhlRGF0YX1gIHdoZXJlIGB0aGVEYXRhYCBpcyBwYXJzZWQgdXNpbmcge3sjY3Jvc3NMaW5rIFwiU3RvcmUvZ2V0XCJ9fVN0b3JlI2dldHt7L2Nyb3NzTGlua319LlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIga2V5cyA9IHRoaXMubGlzdEtleXMoKTtcclxuXHR2YXIgZGF0YSA9IHt9O1xyXG5cdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRkYXRhW2tleV0gPSB0aGlzLmdldChrZXkpO1xyXG5cdH0sIHRoaXMpO1xyXG5cdHJldHVybiBkYXRhO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExpc3QgYWxsIGtleXMgdGhhdCBhcmUgdGllZCB0byB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgbGlzdEtleXNcclxuICogQHJldHVybiB7YXJyYXl9IFRoZSBzdG9yYWdlIGtleXMuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUubGlzdEtleXMgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGtleXMgPSBbXTtcclxuXHR2YXIga2V5ID0gbnVsbDtcclxuXHR2YXIgc3RvcmFnZUxlbmd0aCA9IHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5sZW5ndGg7XHJcblx0dmFyIHByZWZpeCA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkpO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc3RvcmFnZUxlbmd0aDsgaSsrKSB7XHJcblx0XHRrZXkgPSB0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkua2V5KGkpXHJcblx0XHRpZiAocHJlZml4LnRlc3Qoa2V5KSkge1xyXG5cdFx0XHRrZXlzLnB1c2goa2V5LnJlcGxhY2UocHJlZml4LCAnJykpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4ga2V5cztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgc3BlY2lmaWMga2V5IGFuZCBkYXRhIGZyb20gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIHJlbW92ZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIHRoZSBkYXRhIGZvci5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5KSB7XHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gbnVsbDtcclxuXHR0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkucmVtb3ZlSXRlbSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbGwgZGF0YSBhbmQga2V5cyBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCByZW1vdmVBbGxcclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XHJcblx0dGhpcy5saXN0S2V5cygpLmZvckVhY2godGhpcy5yZW1vdmUsIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgbmFtZXNwYWNlZCBpdGVtcyBmcm9tIHRoZSBjYWNoZSBzbyB5b3VyIG5leHQge3sjY3Jvc3NMaW5rIFwiU3RvcmUvZ2V0XCJ9fVN0b3JlI2dldHt7L2Nyb3NzTGlua319IHdpbGwgYmUgZnJlc2ggZnJvbSB0aGUgc3RvcmFnZS5cclxuICogQG1ldGhvZCBmcmVzaGVuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byByZW1vdmUgdGhlIGNhY2hlIGRhdGEgZm9yLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmZyZXNoZW4gPSBmdW5jdGlvbiAoa2V5KSB7XHJcblx0dmFyIGtleXMgPSBrZXkgPyBba2V5XSA6IHRoaXMubGlzdEtleXMoKTtcclxuXHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gbnVsbDtcclxuXHR9LCB0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNaWdyYXRlIGRhdGEgZnJvbSBhIGRpZmZlcmVudCBuYW1lc3BhY2UgdG8gY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgbWlncmF0ZVxyXG4gKiBAcGFyYW0ge29iamVjdH0gICBtaWdyYXRpb24gICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBtaWdyYXRpb24gb2JqZWN0LlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24udG9LZXkgICAgICAgICAgICAgICAgICAgIFRoZSBrZXkgbmFtZSB1bmRlciB5b3VyIGN1cnJlbnQgbmFtZXNwYWNlIHRoZSBvbGQgZGF0YSBzaG91bGQgY2hhbmdlIHRvLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24uZnJvbU5hbWVzcGFjZSAgICAgICAgICAgIFRoZSBvbGQgbmFtZXNwYWNlIHRoYXQgdGhlIG9sZCBrZXkgYmVsb25ncyB0by5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbWlncmF0aW9uLmZyb21LZXkgICAgICAgICAgICAgICAgICBUaGUgb2xkIGtleSBuYW1lIHRvIG1pZ3JhdGUgZnJvbS5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgW21pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGVdICAgICAgICBUaGUgc3RvcmFnZSB0eXBlIHRvIG1pZ3JhdGUgZnJvbS4gRGVmYXVsdHMgdG8gc2FtZSB0eXBlIGFzIHdoZXJlIHlvdSBhcmUgbWlncmF0aW5nIHRvLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICBbbWlncmF0aW9uLmtlZXBPbGREYXRhPWZhbHNlXSAgICAgIFdoZXRoZXIgb2xkIGRhdGEgc2hvdWxkIGJlIGtlcHQgYWZ0ZXIgaXQgaGFzIGJlZW4gbWlncmF0ZWQuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gIFttaWdyYXRpb24ub3ZlcndyaXRlTmV3RGF0YT1mYWxzZV0gV2hldGhlciBvbGQgZGF0YSBzaG91bGQgb3ZlcndyaXRlIGN1cnJlbnRseSBzdG9yZWQgZGF0YSBpZiBpdCBleGlzdHMuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFttaWdyYXRpb24udHJhbnNmb3JtXSAgICAgICAgICAgICAgVGhlIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIG9sZCBrZXkgZGF0YSB0aHJvdWdoIGJlZm9yZSBtaWdyYXRpbmcuXHJcbiAqIEBleGFtcGxlXHJcbiAqIFxyXG4gKiAgICAgdmFyIFN0b3JlID0gcmVxdWlyZSgnc3RvcmFnZS13cmFwcGVyJyk7XHJcbiAqICAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG4gKiAgICAgICAgIG5hbWVzcGFjZTogJ215TmV3QXBwJ1xyXG4gKiAgICAgfSk7XHJcbiAqXHJcbiAqICAgICAvLyBNaWdyYXRlIGZyb20gdGhlIG9sZCBhcHAuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ25ldy1rZXknLFxyXG4gKiAgICAgICAgIGZyb21OYW1lc3BhY2U6ICdteU9sZEFwcCcsXHJcbiAqICAgICAgICAgZnJvbUtleTogJ29sZC1rZXknXHJcbiAqICAgICB9KTtcclxuICogICAgIFxyXG4gKiAgICAgLy8gTWlncmF0ZSBmcm9tIGdsb2JhbCBkYXRhLiBVc2VmdWwgd2hlbiBtb3ZpbmcgZnJvbSBvdGhlciBzdG9yYWdlIHdyYXBwZXJzIG9yIHJlZ3VsYXIgb2wnIGBsb2NhbFN0b3JhZ2VgLlxyXG4gKiAgICAgc3RvcmUubWlncmF0ZSh7XHJcbiAqICAgICAgICAgdG9LZXk6ICdvdGhlci1uZXcta2V5JyxcclxuICogICAgICAgICBmcm9tTmFtZXNwYWNlOiAnJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb3RoZXItb2xkLWtleS1vbi1nbG9iYWwnXHJcbiAqICAgICB9KTtcclxuICogICAgIFxyXG4gKiAgICAgLy8gTWlncmF0ZSBzb21lIEpTT04gZGF0YSB0aGF0IHdhcyBzdG9yZWQgYXMgYSBzdHJpbmcuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ25ldy1qc29uLWtleScsXHJcbiAqICAgICAgICAgZnJvbU5hbWVzcGFjZTogJ215T2xkQXBwJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb2xkLWpzb24ta2V5JyxcclxuICogICAgICAgICAvLyBUcnkgY29udmVydGluZyBzb21lIG9sZCBKU09OIGRhdGEuXHJcbiAqICAgICAgICAgdHJhbnNmb3JtOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gKiAgICAgICAgICAgICB0cnkge1xyXG4gKiAgICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XHJcbiAqICAgICAgICAgICAgIH1cclxuICogICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICogICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gKiAgICAgICAgICAgICB9XHJcbiAqICAgICAgICAgfVxyXG4gKiAgICAgfSk7XHJcbiAqL1xyXG5cclxuU3RvcmUucHJvdG90eXBlLm1pZ3JhdGUgPSBmdW5jdGlvbiAobWlncmF0aW9uKSB7XHJcblx0Ly8gU2F2ZSBvdXIgY3VycmVudCBuYW1lc3BhY2UuXHJcblx0dmFyIHRvTmFtZXNwYWNlID0gdGhpcy5nZXROYW1lc3BhY2UoKTtcclxuXHR2YXIgdG9TdG9yYWdlVHlwZSA9IHRoaXMuZ2V0U3RvcmFnZVR5cGUoKTtcclxuXHJcblx0Ly8gQ3JlYXRlIGEgdGVtcG9yYXJ5IHN0b3JlIHRvIGF2b2lkIGNoYW5naW5nIG5hbWVzcGFjZSBkdXJpbmcgYWN0dWFsIGdldC9zZXRzLlxyXG5cdHZhciBzdG9yZSA9IG5ldyBTdG9yZSh7XHJcblx0XHRuYW1lc3BhY2U6IHRvTmFtZXNwYWNlLFxyXG5cdFx0c3RvcmFnZVR5cGU6IHRvU3RvcmFnZVR5cGVcclxuXHR9KTtcclxuXHJcblx0dmFyIGRhdGEgPSBudWxsO1xyXG5cclxuXHQvLyBHZXQgZGF0YSBmcm9tIG9sZCBuYW1lc3BhY2UuXHJcblx0c3RvcmUuc2V0TmFtZXNwYWNlKG1pZ3JhdGlvbi5mcm9tTmFtZXNwYWNlKTtcclxuXHRpZiAodHlwZW9mIG1pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGUgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRzdG9yZS5zZXRTdG9yYWdlVHlwZShtaWdyYXRpb24uZnJvbVN0b3JhZ2VUeXBlKTtcclxuXHR9XHJcblx0ZGF0YSA9IHN0b3JlLmdldChtaWdyYXRpb24uZnJvbUtleSk7XHJcblxyXG5cdC8vIFJlbW92ZSBvbGQgaWYgbmVlZGVkLlxyXG5cdGlmICghbWlncmF0aW9uLmtlZXBPbGREYXRhKSB7XHJcblx0XHRzdG9yZS5yZW1vdmUobWlncmF0aW9uLmZyb21LZXkpO1xyXG5cdH1cclxuXHRcclxuXHQvLyBObyBkYXRhLCBpZ25vcmUgdGhpcyBtaWdyYXRpb24uXHJcblx0aWYgKGRhdGEgPT09IG51bGwpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8vIFRyYW5zZm9ybSBkYXRhIGlmIG5lZWRlZC5cclxuXHRpZiAodHlwZW9mIG1pZ3JhdGlvbi50cmFuc2Zvcm0gPT09ICdmdW5jdGlvbicpIHtcclxuXHRcdGRhdGEgPSBtaWdyYXRpb24udHJhbnNmb3JtKGRhdGEpO1xyXG5cdH1cclxuXHRlbHNlIGlmICh0eXBlb2YgbWlncmF0aW9uLnRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0cmFuc2Zvcm0gY2FsbGJhY2suJyk7XHJcblx0fVxyXG5cclxuXHQvLyBHbyBiYWNrIHRvIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG5cdHN0b3JlLnNldE5hbWVzcGFjZSh0b05hbWVzcGFjZSk7XHJcblx0c3RvcmUuc2V0U3RvcmFnZVR5cGUodG9TdG9yYWdlVHlwZSk7XHJcblxyXG5cdC8vIE9ubHkgb3ZlcndyaXRlIG5ldyBkYXRhIGlmIGl0IGRvZXNuJ3QgZXhpc3Qgb3IgaXQncyByZXF1ZXN0ZWQuXHJcblx0aWYgKHN0b3JlLmdldChtaWdyYXRpb24udG9LZXkpID09PSBudWxsIHx8IG1pZ3JhdGlvbi5vdmVyd3JpdGVOZXdEYXRhKSB7XHJcblx0XHRzdG9yZS5zZXQobWlncmF0aW9uLnRvS2V5LCBkYXRhKTtcclxuXHR9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHN1YnN0b3JlIHRoYXQgaXMgbmVzdGVkIGluIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBjcmVhdGVTdWJzdG9yZVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVzcGFjZSBUaGUgc3Vic3RvcmUncyBuYW1lc3BhY2UuXHJcbiAqIEByZXR1cm4ge1N0b3JlfSAgICAgICAgICAgIFRoZSBzdWJzdG9yZS5cclxuICogQGV4YW1wbGVcclxuICogXHJcbiAqICAgICB2YXIgU3RvcmUgPSByZXF1aXJlKCdzdG9yYWdlLXdyYXBwZXInKTtcclxuICogICAgIC8vIENyZWF0ZSBtYWluIHN0b3JlLlxyXG4gKiAgICAgdmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuICogICAgICAgICBuYW1lc3BhY2U6ICdteWFwcCdcclxuICogICAgIH0pO1xyXG4gKlxyXG4gKiAgICAgLy8gQ3JlYXRlIHN1YnN0b3JlLlxyXG4gKiAgICAgdmFyIHN1YnN0b3JlID0gc3RvcmUuY3JlYXRlU3Vic3RvcmUoJ3RoaW5ncycpO1xyXG4gKiAgICAgc3Vic3RvcmUuc2V0KCdmb28nLCAnYmFyJyk7XHJcbiAqXHJcbiAqICAgICBzdWJzdG9yZS5nZXQoJ2ZvbycpID09PSBzdG9yZS5nZXQoJ3RoaW5nczpmb28nKTtcclxuICogICAgIC8vIHRydWVcclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5jcmVhdGVTdWJzdG9yZSA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHRyZXR1cm4gbmV3IFN0b3JlKHtcclxuXHRcdG5hbWVzcGFjZTogdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkgKyBuYW1lc3BhY2UsXHJcblx0XHRzdG9yYWdlVHlwZTogdGhpcy5nZXRTdG9yYWdlVHlwZSgpXHJcblx0fSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0b3JlO1xyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcblx0XCJuYW1lXCI6IFwidHdpdGNoLWNoYXQtZW1vdGVzXCIsXHJcblx0XCJ2ZXJzaW9uXCI6IFwiMS4xLjBcIixcclxuXHRcImhvbWVwYWdlXCI6IFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9cIixcclxuXHRcImJ1Z3NcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvaXNzdWVzXCIsXHJcblx0XCJhdXRob3JcIjogXCJSeWFuIENoYXRoYW0gPHJ5YW4uYi5jaGF0aGFtQGdtYWlsLmNvbT4gKGh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjKVwiLFxyXG5cdFwicmVwb3NpdG9yeVwiOiB7XHJcblx0XHRcInR5cGVcIjogXCJnaXRcIixcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2NsZXR1c2MvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzLmdpdFwiXHJcblx0fSxcclxuXHRcInVzZXJzY3JpcHRcIjoge1xyXG5cdFx0XCJuYW1lXCI6IFwiVHdpdGNoIENoYXQgRW1vdGVzXCIsXHJcblx0XHRcIm5hbWVzcGFjZVwiOiBcIiNDbGV0dXNcIixcclxuXHRcdFwidmVyc2lvblwiOiBcInt7e3BrZy52ZXJzaW9ufX19XCIsXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IFwiQWRkcyBhIGJ1dHRvbiB0byBUd2l0Y2ggdGhhdCBhbGxvd3MgeW91IHRvIFxcXCJjbGljay10by1pbnNlcnRcXFwiIGFuIGVtb3RlLlwiLFxyXG5cdFx0XCJjb3B5cmlnaHRcIjogXCIyMDExKywge3t7cGtnLmF1dGhvcn19fVwiLFxyXG5cdFx0XCJhdXRob3JcIjogXCJ7e3twa2cuYXV0aG9yfX19XCIsXHJcblx0XHRcImljb25cIjogXCJodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIucGhwP2dyYXZhdGFyX2lkPTY4NzVlODNhYTZjNTYzNzkwY2IyZGE5MTRhYWJhOGIzJnI9UEcmcz00OCZkZWZhdWx0PWlkZW50aWNvblwiLFxyXG5cdFx0XCJsaWNlbnNlXCI6IFtcclxuXHRcdFx0XCJNSVQ7IGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcIixcclxuXHRcdFx0XCJDQyBCWS1OQy1TQSAzLjA7IGh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LW5jLXNhLzMuMC9cIlxyXG5cdFx0XSxcclxuXHRcdFwiaG9tZXBhZ2VcIjogXCJ7e3twa2cuaG9tZXBhZ2V9fX1cIixcclxuXHRcdFwic3VwcG9ydFVSTFwiOiBcInt7e3BrZy5idWdzfX19XCIsXHJcblx0XHRcImNvbnRyaWJ1dGlvblVSTFwiOiBcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvI2RvbmF0ZVwiLFxyXG5cdFx0XCJncmFudFwiOiBcIm5vbmVcIixcclxuXHRcdFwiaW5jbHVkZVwiOiBcImh0dHA6Ly8qLnR3aXRjaC50di8qXCIsXHJcblx0XHRcImV4Y2x1ZGVcIjogW1xyXG5cdFx0XHRcImh0dHA6Ly9hcGkudHdpdGNoLnR2LypcIixcclxuXHRcdFx0XCJodHRwOi8vdG1pLnR3aXRjaC50di8qXCIsXHJcblx0XHRcdFwiaHR0cDovL2NoYXRkZXBvdC50d2l0Y2gudHYvKlwiXHJcblx0XHRdXHJcblx0fSxcclxuXHRcInNjcmlwdHNcIjoge1xyXG5cdFx0XCJpbnN0YWxsXCI6IFwibmFwYVwiXHJcblx0fSxcclxuXHRcImRldkRlcGVuZGVuY2llc1wiOiB7XHJcblx0XHRcImJyb3dzZXItc3luY1wiOiBcIl4xLjMuMlwiLFxyXG5cdFx0XCJicm93c2VyaWZ5XCI6IFwiXjUuOS4xXCIsXHJcblx0XHRcImd1bHBcIjogXCJeMy44LjNcIixcclxuXHRcdFwiZ3VscC1hdXRvcHJlZml4ZXJcIjogXCIwLjAuOFwiLFxyXG5cdFx0XCJndWxwLWJlYXV0aWZ5XCI6IFwiMS4xLjBcIixcclxuXHRcdFwiZ3VscC1jaGFuZ2VkXCI6IFwiXjAuNC4xXCIsXHJcblx0XHRcImd1bHAtY29uY2F0XCI6IFwiXjIuMi4wXCIsXHJcblx0XHRcImd1bHAtY29uZmxpY3RcIjogXCJeMC4xLjJcIixcclxuXHRcdFwiZ3VscC1jc3MtYmFzZTY0XCI6IFwiXjEuMS4wXCIsXHJcblx0XHRcImd1bHAtY3NzMmpzXCI6IFwiXjEuMC4yXCIsXHJcblx0XHRcImd1bHAtaGVhZGVyXCI6IFwiXjEuMC4yXCIsXHJcblx0XHRcImd1bHAtaG9nYW4tY29tcGlsZVwiOiBcIl4wLjIuMVwiLFxyXG5cdFx0XCJndWxwLW1pbmlmeS1jc3NcIjogXCJeMC4zLjVcIixcclxuXHRcdFwiZ3VscC1ub3RpZnlcIjogXCJeMS40LjFcIixcclxuXHRcdFwiZ3VscC1yZW5hbWVcIjogXCJeMS4yLjBcIixcclxuXHRcdFwiZ3VscC11Z2xpZnlcIjogXCJeMC4zLjFcIixcclxuXHRcdFwiZ3VscC11dGlsXCI6IFwiXjMuMC4wXCIsXHJcblx0XHRcImhvZ2FuLmpzXCI6IFwiXjMuMC4yXCIsXHJcblx0XHRcImpxdWVyeS11aVwiOiBcIl4xLjEwLjVcIixcclxuXHRcdFwibmFwYVwiOiBcIl4wLjQuMVwiLFxyXG5cdFx0XCJwcmV0dHktaHJ0aW1lXCI6IFwiXjAuMi4xXCIsXHJcblx0XHRcInZpbnlsLW1hcFwiOiBcIl4xLjAuMVwiLFxyXG5cdFx0XCJ2aW55bC1zb3VyY2Utc3RyZWFtXCI6IFwiXjAuMS4xXCIsXHJcblx0XHRcIndhdGNoaWZ5XCI6IFwiXjEuMC4xXCIsXHJcblx0XHRcInN0b3JhZ2Utd3JhcHBlclwiOiBcImNsZXR1c2Mvc3RvcmFnZS13cmFwcGVyI3YwLjEuMVwiXHJcblx0fSxcclxuXHRcIm5hcGFcIjoge1xyXG5cdFx0XCJqcXVlcnktY3VzdG9tLXNjcm9sbGJhclwiOiBcIm16dWJhbGEvanF1ZXJ5LWN1c3RvbS1zY3JvbGxiYXIjMC41LjVcIlxyXG5cdH1cclxufVxyXG4iLCJ2YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKTtcclxudmFyIGFwaSA9IHt9O1xyXG52YXIgZW1iZXIgPSBudWxsO1xyXG52YXIgaG9va2VkRmFjdG9yaWVzID0ge307XHJcblxyXG5hcGkuZ2V0RW1iZXIgPSBmdW5jdGlvbiAoKSB7XHJcblx0aWYgKGVtYmVyKSB7XHJcblx0XHRyZXR1cm4gZW1iZXI7XHJcblx0fVxyXG5cdGlmICh3aW5kb3cuQXBwICYmIHdpbmRvdy5BcHAuX19jb250YWluZXJfXykge1xyXG5cdFx0ZW1iZXIgPSB3aW5kb3cuQXBwLl9fY29udGFpbmVyX187XHJcblx0XHRyZXR1cm4gZW1iZXI7XHJcblx0fVxyXG5cdHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbmFwaS5pc0xvYWRlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gQm9vbGVhbihhcGkuZ2V0RW1iZXIoKSk7XHJcbn07XHJcblxyXG5hcGkubG9va3VwID0gZnVuY3Rpb24gKGxvb2t1cEZhY3RvcnkpIHtcclxuXHRpZiAoIWFwaS5pc0xvYWRlZCgpKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgbG9va3VwIGZhaWx1cmUsIEVtYmVyIG5vdCBsb2FkZWQuJyk7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cdHJldHVybiBhcGkuZ2V0RW1iZXIoKS5sb29rdXAobG9va3VwRmFjdG9yeSk7XHJcbn07XHJcblxyXG5hcGkuaG9vayA9IGZ1bmN0aW9uIChsb29rdXBGYWN0b3J5LCBhY3RpdmF0ZUNiLCBkZWFjdGl2YXRlQ2IpIHtcclxuXHRpZiAoIWFwaS5pc0xvYWRlZCgpKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9vayBmYWlsdXJlLCBFbWJlciBub3QgbG9hZGVkLicpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHRpZiAoaG9va2VkRmFjdG9yaWVzW2xvb2t1cEZhY3RvcnldKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgYWxyZWFkeSBob29rZWQ6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHR2YXIgcmVvcGVuT3B0aW9ucyA9IHt9O1xyXG5cdHZhciBmYWN0b3J5ID0gYXBpLmxvb2t1cChsb29rdXBGYWN0b3J5KTtcclxuXHJcblx0aWYgKCFmYWN0b3J5KSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9vayBmYWlsdXJlLCBmYWN0b3J5IG5vdCBmb3VuZDogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHJcblx0aWYgKGFjdGl2YXRlQ2IpIHtcclxuXHRcdHJlb3Blbk9wdGlvbnMuYWN0aXZhdGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHRoaXMuX3N1cGVyKCk7XHJcblx0XHRcdGFjdGl2YXRlQ2IuY2FsbCh0aGlzKTtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdIb29rIHJ1biBvbiBhY3RpdmF0ZTogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0fTtcclxuXHR9XHJcblx0aWYgKGRlYWN0aXZhdGVDYikge1xyXG5cdFx0cmVvcGVuT3B0aW9ucy5kZWFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHR0aGlzLl9zdXBlcigpO1xyXG5cdFx0XHRkZWFjdGl2YXRlQ2IuY2FsbCh0aGlzKTtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdIb29rIHJ1biBvbiBkZWFjdGl2YXRlOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0dHJ5IHtcclxuXHRcdGZhY3RvcnkucmVvcGVuKHJlb3Blbk9wdGlvbnMpO1xyXG5cdFx0aG9va2VkRmFjdG9yaWVzW2xvb2t1cEZhY3RvcnldID0gdHJ1ZTtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmFjdG9yeSBob29rZWQ6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHRjYXRjaCAoZXJyKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9vayBmYWlsdXJlLCB1bmV4cGVjdGVkIGVycm9yOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHRsb2dnZXIuZGVidWcoZXJyKTtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcbn07XHJcblxyXG5hcGkuZ2V0ID0gZnVuY3Rpb24gKGxvb2t1cEZhY3RvcnksIHByb3BlcnR5KSB7XHJcblx0aWYgKCFhcGkuaXNMb2FkZWQoKSkge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGYWN0b3J5IGdldCBmYWlsdXJlLCBFbWJlciBub3QgbG9hZGVkLicpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHR2YXIgcHJvcGVydGllcyA9IHByb3BlcnR5LnNwbGl0KCcuJyk7XHJcblx0dmFyIGdldHRlciA9IGFwaS5sb29rdXAobG9va3VwRmFjdG9yeSk7XHJcblxyXG5cdHByb3BlcnRpZXMuc29tZShmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuXHRcdC8vIElmIGdldHRlciBmYWlscywganVzdCBleGl0LCBvdGhlcndpc2UsIGtlZXAgbG9vcGluZy5cclxuXHRcdGlmICh0eXBlb2YgZ2V0dGVyLmdldCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZ2V0dGVyLmdldChwcm9wZXJ0eSkgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdGdldHRlciA9IGdldHRlci5nZXQocHJvcGVydHkpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIGdldHRlcltwcm9wZXJ0eV0gIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdGdldHRlciA9IGdldHRlcltwcm9wZXJ0eV07XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Z2V0dGVyID0gbnVsbDtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBnZXR0ZXI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwidmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XHJcbnZhciBhcGkgPSB7fTtcclxudmFyIGVtb3RlU3RvcmUgPSBuZXcgRW1vdGVTdG9yZSgpO1xyXG52YXIgJCA9IHdpbmRvdy5qUXVlcnk7XHJcblxyXG4vKipcclxuICogVGhlIGVudGlyZSBlbW90ZSBzdG9yaW5nIHN5c3RlbS5cclxuICovXHJcbmZ1bmN0aW9uIEVtb3RlU3RvcmUoKSB7XHJcblx0dmFyIGdldHRlcnMgPSB7fTtcclxuXHR2YXIgbmF0aXZlRW1vdGVzID0ge307XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldCBhIGxpc3Qgb2YgdXNhYmxlIGVtb3RpY29ucy5cclxuXHQgKiBAcGFyYW0gIHtmdW5jdGlvbn0gW2ZpbHRlcnNdICAgICAgIEEgZmlsdGVyIG1ldGhvZCB0byBsaW1pdCB3aGF0IGVtb3RlcyBhcmUgcmV0dXJuZWQuIFBhc3NlZCB0byBBcnJheSNmaWx0ZXIuXHJcblx0ICogQHBhcmFtICB7ZnVuY3Rpb258c3RyaW5nfSBbc29ydEJ5XSBIb3cgdGhlIGVtb3RlcyBzaG91bGQgYmUgc29ydGVkLiBgZnVuY3Rpb25gIHdpbGwgYmUgcGFzc2VkIHRvIHNvcnQgdmlhIEFycmF5I3NvcnQuIGAnY2hhbm5lbCdgIHNvcnRzIGJ5IGNoYW5uZWwgbmFtZSwgZ2xvYmFscyBmaXJzdC4gQWxsIG90aGVyIHZhbHVlcyAob3Igb21pdHRlZCkgc29ydCBhbHBoYW51bWVyaWNhbGx5LlxyXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gW3JldHVyblR5cGVdICAgICAgYCdvYmplY3QnYCB3aWxsIHJldHVybiBpbiBvYmplY3QgZm9ybWF0LCBlLmcuIGB7J0thcHBhJzogRW1vdGUoLi4uKSwgLi4ufWAuIEFsbCBvdGhlciB2YWx1ZXMgKG9yIG9taXR0ZWQpIHJldHVybiBhbiBhcnJheSBmb3JtYXQsIGUuZy4gYFtFbW90ZSguLi4pLCAuLi5dYC5cclxuXHQgKiBAcmV0dXJuIHtvYmplY3R8YXJyYXl9ICAgICAgICAgICAgIFNlZSBgcmV0dXJuVHlwZWAgcGFyYW0uXHJcblx0ICovXHJcblx0dGhpcy5nZXRFbW90ZXMgPSBmdW5jdGlvbiAoZmlsdGVycywgc29ydEJ5LCByZXR1cm5UeXBlKSB7XHJcblx0XHR2YXIgdHdpdGNoQXBpID0gcmVxdWlyZSgnLi90d2l0Y2gtYXBpJyk7XHJcblxyXG5cdFx0Ly8gR2V0IG5hdGl2ZSBlbW90ZXMuXHJcblx0XHR2YXIgZW1vdGVzID0gJC5leHRlbmQoe30sIG5hdGl2ZUVtb3Rlcyk7XHJcblxyXG5cdFx0Ly8gUGFyc2UgdGhlIGN1c3RvbSBlbW90ZXMgcHJvdmlkZWQgYnkgdGhpcmQgcGFydHkgYWRkb25zLlxyXG5cdFx0T2JqZWN0LmtleXMoZ2V0dGVycykuZm9yRWFjaChmdW5jdGlvbiAoZ2V0dGVyTmFtZSkge1xyXG5cdFx0XHQvLyBUcnkgdGhlIGdldHRlci5cclxuXHRcdFx0dmFyIHJlc3VsdHMgPSBudWxsO1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHJlc3VsdHMgPSBnZXR0ZXJzW2dldHRlck5hbWVdKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZygnRW1vdGUgZ2V0dGVyIGAnICsgZ2V0dGVyTmFtZSArICdgIGZhaWxlZCB1bmV4cGVjdGVkbHksIHNraXBwaW5nLicsIGVyci50b1N0cmluZygpKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHJlc3VsdHMpKSB7XHJcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdFbW90ZSBnZXR0ZXIgYCcgKyBnZXR0ZXJOYW1lICsgJ2AgbXVzdCByZXR1cm4gYW4gYXJyYXksIHNraXBwaW5nLicpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gT3ZlcnJpZGUgbmF0aXZlcyBhbmQgcHJldmlvdXMgZ2V0dGVycy5cclxuXHRcdFx0cmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvLyBDcmVhdGUgdGhlIGVtb3RlLlxyXG5cdFx0XHRcdFx0dmFyIGluc3RhbmNlID0gbmV3IEVtb3RlKGVtb3RlKTtcclxuXHJcblx0XHRcdFx0XHQvLyBGb3JjZSB0aGUgZ2V0dGVyLlxyXG5cdFx0XHRcdFx0aW5zdGFuY2Uuc2V0R2V0dGVyTmFtZShnZXR0ZXJOYW1lKTtcclxuXHJcblx0XHRcdFx0XHQvLyBGb3JjZSBlbW90ZXMgd2l0aG91dCBjaGFubmVscyB0byB0aGUgZ2V0dGVyJ3MgbmFtZS5cclxuXHRcdFx0XHRcdGlmICghZW1vdGUuY2hhbm5lbCkge1xyXG5cdFx0XHRcdFx0XHRpbnN0YW5jZS5zZXRDaGFubmVsTmFtZShnZXR0ZXJOYW1lKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHQvLyBBZGQvb3ZlcnJpZGUgaXQuXHJcblx0XHRcdFx0XHRlbW90ZXNbaW5zdGFuY2UuZ2V0VGV4dCgpXSA9IGluc3RhbmNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZXJyKSB7XHJcblx0XHRcdFx0XHRsb2dnZXIuZGVidWcoJ0Vtb3RlIHBhcnNpbmcgZm9yIGdldHRlciBgJyArIGdldHRlck5hbWUgKyAnYCBmYWlsZWQsIHNraXBwaW5nLicsIGVyci50b1N0cmluZygpLCBlbW90ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIENvdmVydCB0byBhcnJheS5cclxuXHRcdGVtb3RlcyA9IE9iamVjdC5rZXlzKGVtb3RlcykubWFwKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0XHRyZXR1cm4gZW1vdGVzW2Vtb3RlXTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIEZpbHRlciByZXN1bHRzLlxyXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXJzID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdGVtb3RlcyA9IGVtb3Rlcy5maWx0ZXIoZmlsdGVycyk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdC8vIFJldHVybiBhcyBhbiBvYmplY3QgaWYgcmVxdWVzdGVkLlxyXG5cdFx0aWYgKHJldHVyblR5cGUgPT09ICdvYmplY3QnKSB7XHJcblx0XHRcdHZhciBhc09iamVjdCA9IHt9O1xyXG5cdFx0XHRlbW90ZXMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRhc09iamVjdFtlbW90ZS5nZXRUZXh0KCldID0gZW1vdGU7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gYXNPYmplY3Q7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gU29ydCByZXN1bHRzLlxyXG5cdFx0aWYgKHR5cGVvZiBzb3J0QnkgPT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0ZW1vdGVzLnNvcnQoc29ydEJ5KTtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHNvcnRCeSA9PT0gJ2NoYW5uZWwnKSB7XHJcblx0XHRcdGVtb3Rlcy5zb3J0KHNvcnRpbmcuYWxsRW1vdGVzQ2F0ZWdvcnkpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGVtb3Rlcy5zb3J0KHNvcnRpbmcuYnlUZXh0KTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBSZXR1cm4gdGhlIGVtb3RlcyBpbiBhcnJheSBmb3JtYXQuXHJcblx0XHRyZXR1cm4gZW1vdGVzO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFJlZ2lzdGVycyBhIDNyZCBwYXJ0eSBlbW90ZSBob29rLlxyXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gbmFtZSAgIFRoZSBuYW1lIG9mIHRoZSAzcmQgcGFydHkgcmVnaXN0ZXJpbmcgdGhlIGhvb2suXHJcblx0ICogQHBhcmFtICB7ZnVuY3Rpb259IGdldHRlciBUaGUgZnVuY3Rpb24gY2FsbGVkIHdoZW4gbG9va2luZyBmb3IgZW1vdGVzLiBNdXN0IHJldHVybiBhbiBhcnJheSBvZiBlbW90ZSBvYmplY3RzLCBlLmcuIGBbZW1vdGUsIC4uLl1gLiBTZWUgRW1vdGUgY2xhc3MuXHJcblx0ICovXHJcblx0dGhpcy5yZWdpc3RlckdldHRlciA9IGZ1bmN0aW9uIChuYW1lLCBnZXR0ZXIpIHtcclxuXHRcdGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdOYW1lIG11c3QgYmUgYSBzdHJpbmcuJyk7XHJcblx0XHR9XHJcblx0XHRpZiAoZ2V0dGVyc1tuYW1lXSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0dldHRlciBhbHJlYWR5IGV4aXN0cy4nKTtcclxuXHRcdH1cclxuXHRcdGlmICh0eXBlb2YgZ2V0dGVyICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignR2V0dGVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcclxuXHRcdH1cclxuXHRcdGxvZ2dlci5kZWJ1ZygnR2V0dGVyIHJlZ2lzdGVyZWQ6ICcgKyBuYW1lKTtcclxuXHRcdGdldHRlcnNbbmFtZV0gPSBnZXR0ZXI7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogUmVnaXN0ZXJzIGEgM3JkIHBhcnR5IGVtb3RlIGhvb2suXHJcblx0ICogQHBhcmFtICB7c3RyaW5nfSBuYW1lICAgVGhlIG5hbWUgb2YgdGhlIDNyZCBwYXJ0eSBob29rIHRvIGRlcmVnaXN0ZXIuXHJcblx0ICovXHJcblx0dGhpcy5kZXJlZ2lzdGVyR2V0dGVyID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnR2V0dGVyIHVucmVnaXN0ZXJlZDogJyArIG5hbWUpO1xyXG5cdFx0ZGVsZXRlIGdldHRlcnNbbmFtZV07XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogSW5pdGlhbGl6ZXMgdGhlIHJhdyBkYXRhIGZyb20gdGhlIEFQSSBlbmRwb2ludHMuIFNob3VsZCBiZSBjYWxsZWQgYXQgbG9hZCBhbmQvb3Igd2hlbmV2ZXIgdGhlIEFQSSBtYXkgaGF2ZSBjaGFuZ2VkLiBQb3B1bGF0ZXMgaW50ZXJuYWwgb2JqZWN0cyB3aXRoIHVwZGF0ZWQgZGF0YS5cclxuXHQgKi9cclxuXHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ1N0YXJ0aW5nIGluaXRpYWxpemF0aW9uLicpO1xyXG5cclxuXHRcdHZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL3R3aXRjaC1hcGknKTtcclxuXHRcdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0XHRsb2dnZXIuZGVidWcoJ0luaXRpYWxpemluZyBlbW90ZSBzZXQgY2hhbmdlIGxpc3RlbmVyLicpO1xyXG5cclxuXHRcdHR3aXRjaEFwaS5vbkVtb3Rlc0NoYW5nZShmdW5jdGlvbiAoZW1vdGVTZXRzKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnUGFyc2luZyBlbW90ZSBzZXRzLicpO1xyXG5cclxuXHRcdFx0T2JqZWN0LmtleXMoZW1vdGVTZXRzKS5mb3JFYWNoKGZ1bmN0aW9uIChzZXQpIHtcclxuXHRcdFx0XHR2YXIgZW1vdGVzID0gZW1vdGVTZXRzW3NldF07XHJcblx0XHRcdFx0ZW1vdGVzLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRcdFx0XHQvLyBTZXQgc29tZSByZXF1aXJlZCBpbmZvLlxyXG5cdFx0XHRcdFx0ZW1vdGUudXJsID0gJ2h0dHA6Ly9zdGF0aWMtY2RuLmp0dm53Lm5ldC9lbW90aWNvbnMvdjEvJyArIGVtb3RlLmlkICsgJy8xLjAnO1xyXG5cdFx0XHRcdFx0ZW1vdGUudGV4dCA9IGdldEVtb3RlRnJvbVJlZ0V4KGVtb3RlLmNvZGUpO1xyXG5cdFx0XHRcdFx0ZW1vdGUuc2V0ID0gc2V0O1xyXG5cclxuXHRcdFx0XHRcdC8vIEZvcmNlIHR1cmJvIGNoYW5uZWwgZm9yIGVhc3Rlci1lZ2cgc2V0cy5cclxuXHRcdFx0XHRcdGlmIChbJzQ1NycsICc3OTMnXS5pbmRleE9mKHNldCkgPj0gMCkge1xyXG5cdFx0XHRcdFx0XHRlbW90ZS5jaGFubmVsID0gJ3R1cmJvJztcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR2YXIgaW5zdGFuY2UgPSBuZXcgRW1vdGUoZW1vdGUpO1xyXG5cclxuXHRcdFx0XHRcdC8vIFNhdmUgdGhlIGVtb3RlIGZvciB1c2UgbGF0ZXIuXHJcblx0XHRcdFx0XHRuYXRpdmVFbW90ZXNbZW1vdGUudGV4dF0gPSBpbnN0YW5jZTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ0xvYWRpbmcgc3Vic2NyaXB0aW9uIGRhdGEuJyk7XHJcblxyXG5cdFx0XHQvLyBHZXQgYWN0aXZlIHN1YnNjcmlwdGlvbnMgdG8gZmluZCB0aGUgY2hhbm5lbHMuXHJcblx0XHRcdHR3aXRjaEFwaS5nZXRUaWNrZXRzKGZ1bmN0aW9uICh0aWNrZXRzKSB7XHJcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdUaWNrZXRzIGxvYWRlZCBmcm9tIHRoZSBBUEkuJywgdGlja2V0cyk7XHJcblx0XHRcdFx0dGlja2V0cy5mb3JFYWNoKGZ1bmN0aW9uICh0aWNrZXQpIHtcclxuXHRcdFx0XHRcdHZhciBwcm9kdWN0ID0gdGlja2V0LnByb2R1Y3Q7XHJcblx0XHRcdFx0XHR2YXIgY2hhbm5lbCA9IHByb2R1Y3Qub3duZXJfbmFtZSB8fCBwcm9kdWN0LnNob3J0X25hbWU7XHJcblxyXG5cdFx0XHRcdFx0Ly8gR2V0IHN1YnNjcmlwdGlvbnMgd2l0aCBlbW90ZXMgb25seS5cclxuXHRcdFx0XHRcdGlmICghcHJvZHVjdC5lbW90aWNvbnMgfHwgIXByb2R1Y3QuZW1vdGljb25zLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdC8vIFNldCB0aGUgY2hhbm5lbCBvbiB0aGUgZW1vdGVzLlxyXG5cdFx0XHRcdFx0cHJvZHVjdC5lbW90aWNvbnMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGluc3RhbmNlID0gbmF0aXZlRW1vdGVzW2dldEVtb3RlRnJvbVJlZ0V4KGVtb3RlLnJlZ2V4KV07XHJcblx0XHRcdFx0XHRcdGluc3RhbmNlLnNldENoYW5uZWxOYW1lKGNoYW5uZWwpO1xyXG5cdFx0XHRcdFx0XHRpbnN0YW5jZS5nZXRDaGFubmVsQmFkZ2UoKTtcclxuXHRcdFx0XHRcdFx0aW5zdGFuY2UuZ2V0Q2hhbm5lbERpc3BsYXlOYW1lKCk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9LCB0cnVlKTtcclxuXHR9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzcGVjaWZpYyBlbW90ZSwgaWYgYXZhaWxhYmxlLlxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSB0byBnZXQuXHJcbiAqIEByZXR1cm4ge0Vtb3RlfG51bGx9ICAgICAgVGhlIEVtb3RlIGluc3RhbmNlIG9mIHRoZSBlbW90ZSBvciBgbnVsbGAgaWYgaXQgY291bGRuJ3QgYmUgZm91bmQuXHJcbiAqL1xyXG5FbW90ZVN0b3JlLnByb3RvdHlwZS5nZXRFbW90ZSA9IGZ1bmN0aW9uICh0ZXh0KSB7XHJcblx0cmV0dXJuIHRoaXMuZ2V0RW1vdGVzKG51bGwsIG51bGwsICdvYmplY3QnKVt0ZXh0XSB8fCBudWxsO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVtb3RlIG9iamVjdC5cclxuICogQHBhcmFtIHtvYmplY3R9IGRldGFpbHMgICAgICAgICAgICAgIE9iamVjdCBkZXNjcmliaW5nIHRoZSBlbW90ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGRldGFpbHMudGV4dCAgICAgICAgIFRoZSB0ZXh0IHRvIHVzZSBpbiB0aGUgY2hhdCBib3ggd2hlbiBlbW90ZSBpcyBjbGlja2VkLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGV0YWlscy51cmwgICAgICAgICAgVGhlIFVSTCBvZiB0aGUgaW1hZ2UgZm9yIHRoZSBlbW90ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IFtkZXRhaWxzLmJhZGdlXSAgICAgIFRoZSBVUkwgb2YgdGhlIGJhZGdlIGZvciB0aGUgZW1vdGUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZGV0YWlscy5jaGFubmVsXSAgICBUaGUgY2hhbm5lbCB0aGUgZW1vdGUgc2hvdWxkIGJlIGNhdGVnb3JpemVkIHVuZGVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RldGFpbHMuZ2V0dGVyTmFtZV0gVGhlIDNyZCBwYXJ0eSBnZXR0ZXIgdGhhdCByZWdpc3RlcmVkIHRoZSBlbW90ZS4gVXNlZCBpbnRlcm5hbGx5IG9ubHkuXHJcbiAqL1xyXG5mdW5jdGlvbiBFbW90ZShkZXRhaWxzKSB7XHJcblx0dmFyIHRleHQgPSBudWxsO1xyXG5cdHZhciB1cmwgPSBudWxsO1xyXG5cdHZhciBnZXR0ZXJOYW1lID0gbnVsbDtcclxuXHR2YXIgY2hhbm5lbCA9IHtcclxuXHRcdG5hbWU6IG51bGwsXHJcblx0XHRiYWRnZTogbnVsbFxyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIHRleHQgb2YgdGhlIGVtb3RlLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGVtb3RlIHRleHQuXHJcblx0ICovXHJcblx0dGhpcy5nZXRUZXh0ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHRleHQ7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgdGV4dCBvZiB0aGUgZW1vdGUuXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRoZVRleHQgVGhlIHRleHQgdG8gc2V0LlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0VGV4dCA9IGZ1bmN0aW9uICh0aGVUZXh0KSB7XHJcblx0XHRpZiAodHlwZW9mIHRoZVRleHQgIT09ICdzdHJpbmcnIHx8IHRoZVRleHQubGVuZ3RoIDwgMSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdGV4dCcpO1xyXG5cdFx0fVxyXG5cdFx0dGV4dCA9IHRoZVRleHQ7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0cyB0aGUgZ2V0dGVyIG5hbWUgdGhpcyBlbW90ZSBiZWxvbmdzIHRvLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGdldHRlcidzIG5hbWUuXHJcblx0ICovXHJcblx0dGhpcy5nZXRHZXR0ZXJOYW1lID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIGdldHRlck5hbWU7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgZ2V0dGVyIG5hbWUgdGhpcyBlbW90ZSBiZWxvbmdzIHRvLlxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0aGVHZXR0ZXJOYW1lIFRoZSBnZXR0ZXIncyBuYW1lLlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0R2V0dGVyTmFtZSA9IGZ1bmN0aW9uICh0aGVHZXR0ZXJOYW1lKSB7XHJcblx0XHRpZiAodHlwZW9mIHRoZUdldHRlck5hbWUgIT09ICdzdHJpbmcnIHx8IHRoZUdldHRlck5hbWUubGVuZ3RoIDwgMSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZ2V0dGVyIG5hbWUnKTtcclxuXHRcdH1cclxuXHRcdGdldHRlck5hbWUgPSB0aGVHZXR0ZXJOYW1lO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGVtb3RlJ3MgaW1hZ2UgVVJMLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGVtb3RlIGltYWdlIFVSTC5cclxuXHQgKi9cclxuXHR0aGlzLmdldFVybCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB1cmw7XHJcblx0fTtcclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBlbW90ZSdzIGltYWdlIFVSTC5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlVXJsIFRoZSBpbWFnZSBVUkwgdG8gc2V0LlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0VXJsID0gZnVuY3Rpb24gKHRoZVVybCkge1xyXG5cdFx0aWYgKHR5cGVvZiB0aGVVcmwgIT09ICdzdHJpbmcnIHx8IHRoZVVybC5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBVUkwnKTtcclxuXHRcdH1cclxuXHRcdHVybCA9IHRoZVVybDtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBlbW90ZSdzIGNoYW5uZWwgbmFtZS5cclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH0gVGhlIGVtb3RlJ3MgY2hhbm5lbCBvciBgbnVsbGAgaWYgaXQgZG9lc24ndCBoYXZlIG9uZS5cclxuXHQgKi9cclxuXHR0aGlzLmdldENoYW5uZWxOYW1lID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCFjaGFubmVsLm5hbWUpIHtcclxuXHRcdFx0Y2hhbm5lbC5uYW1lID0gc3RvcmFnZS5jaGFubmVsTmFtZXMuZ2V0KHRoaXMuZ2V0VGV4dCgpKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBjaGFubmVsLm5hbWU7XHJcblx0fTtcclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBlbW90ZSdzIGNoYW5uZWwgbmFtZS5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlQ2hhbm5lbCBUaGUgY2hhbm5lbCBuYW1lIHRvIHNldC5cclxuXHQgKi9cclxuXHR0aGlzLnNldENoYW5uZWxOYW1lID0gZnVuY3Rpb24gKHRoZUNoYW5uZWwpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlQ2hhbm5lbCAhPT0gJ3N0cmluZycgfHwgdGhlQ2hhbm5lbC5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaGFubmVsJyk7XHJcblx0XHR9XHJcblx0XHRzdG9yYWdlLmNoYW5uZWxOYW1lcy5zZXQodGhpcy5nZXRUZXh0KCksIHRoZUNoYW5uZWwpO1xyXG5cdFx0Y2hhbm5lbC5uYW1lID0gdGhlQ2hhbm5lbDtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBlbW90ZSBjaGFubmVsJ3MgYmFkZ2UgaW1hZ2UgVVJMLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ3xudWxsfSBUaGUgVVJMIG9mIHRoZSBiYWRnZSBpbWFnZSBmb3IgdGhlIGVtb3RlJ3MgY2hhbm5lbCBvciBgbnVsbGAgaWYgaXQgZG9lc24ndCBoYXZlIGEgY2hhbm5lbC5cclxuXHQgKi9cclxuXHR0aGlzLmdldENoYW5uZWxCYWRnZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL3R3aXRjaC1hcGknKTtcclxuXHRcdHZhciBjaGFubmVsTmFtZSA9IHRoaXMuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHJcblx0XHQvLyBObyBjaGFubmVsLlxyXG5cdFx0aWYgKCFjaGFubmVsTmFtZSkge1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBBbHJlYWR5IGhhdmUgb25lIHByZXNldC5cclxuXHRcdGlmIChjaGFubmVsLmJhZGdlKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmJhZGdlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIENoZWNrIHN0b3JhZ2UuXHJcblx0XHRjaGFubmVsLmJhZGdlID0gc3RvcmFnZS5iYWRnZXMuZ2V0KGNoYW5uZWxOYW1lKTtcclxuXHRcdGlmIChjaGFubmVsLmJhZGdlICE9PSBudWxsKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmJhZGdlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCBmcm9tIEFQSS5cclxuXHRcdHR3aXRjaEFwaS5nZXRCYWRnZXMoY2hhbm5lbE5hbWUsIGZ1bmN0aW9uIChiYWRnZXMpIHtcclxuXHRcdFx0dmFyIGJhZGdlID0gbnVsbDtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdHZXR0aW5nIGZyZXNoIGJhZGdlIGZvciB1c2VyJywgY2hhbm5lbE5hbWUsIGJhZGdlcyk7XHJcblxyXG5cdFx0XHQvLyBTYXZlIHR1cmJvIGJhZGdlIHdoaWxlIHdlIGFyZSBoZXJlLlxyXG5cdFx0XHRpZiAoYmFkZ2VzLnR1cmJvICYmIGJhZGdlcy50dXJiby5pbWFnZSkge1xyXG5cdFx0XHRcdGJhZGdlID0gYmFkZ2VzLnR1cmJvLmltYWdlO1xyXG5cdFx0XHRcdHN0b3JhZ2UuYmFkZ2VzLnNldCgndHVyYm8nLCBiYWRnZSwgODY0MDAwMDApO1xyXG5cclxuXHRcdFx0XHQvLyBUdXJibyBpcyBhY3R1YWxseSB3aGF0IHdlIHdhbnRlZCwgc28gd2UgYXJlIGRvbmUuXHJcblx0XHRcdFx0aWYgKGNoYW5uZWxOYW1lID09PSAndHVyYm8nKSB7XHJcblx0XHRcdFx0XHRjaGFubmVsLmJhZGdlID0gYmFkZ2U7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBTYXZlIHN1YnNjcmliZXIgYmFkZ2UgaW4gc3RvcmFnZS5cclxuXHRcdFx0aWYgKGJhZGdlcy5zdWJzY3JpYmVyICYmIGJhZGdlcy5zdWJzY3JpYmVyLmltYWdlKSB7XHJcblx0XHRcdFx0Y2hhbm5lbC5iYWRnZSA9IGJhZGdlcy5zdWJzY3JpYmVyLmltYWdlO1xyXG5cdFx0XHRcdHN0b3JhZ2UuYmFkZ2VzLnNldChjaGFubmVsTmFtZSwgY2hhbm5lbC5iYWRnZSwgODY0MDAwMDApO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIE5vIHN1YnNjcmliZXIgYmFkZ2UuXHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZygnRmFpbGVkIHRvIGdldCBzdWJzY3JpYmVyIGJhZGdlLicsIGNoYW5uZWxOYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRcclxuXHRcdHJldHVybiBjaGFubmVsLmJhZGdlIHx8ICdodHRwOi8vc3RhdGljLWNkbi5qdHZudy5uZXQvanR2X3VzZXJfcGljdHVyZXMvc3Vic2NyaWJlci1zdGFyLnBuZyc7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgZW1vdGUncyBjaGFubmVsIGJhZGdlIGltYWdlIFVSTC5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlQmFkZ2UgVGhlIGJhZGdlIGltYWdlIFVSTCB0byBzZXQuXHJcblx0ICovXHJcblx0dGhpcy5zZXRDaGFubmVsQmFkZ2UgPSBmdW5jdGlvbiAodGhlQmFkZ2UpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlQmFkZ2UgIT09ICdzdHJpbmcnIHx8IHRoZUJhZGdlLmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhZGdlJyk7XHJcblx0XHR9XHJcblx0XHRjaGFubmVsLmJhZGdlID0gdGhlQmFkZ2U7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogSW5pdGlhbGl6ZSB0aGUgZGV0YWlscy5cclxuXHQgKi9cclxuXHRcclxuXHQvLyBSZXF1aXJlZCBmaWVsZHMuXHJcblx0dGhpcy5zZXRUZXh0KGRldGFpbHMudGV4dCk7XHJcblx0dGhpcy5zZXRVcmwoZGV0YWlscy51cmwpO1xyXG5cclxuXHQvLyBPcHRpb25hbCBmaWVsZHMuXHJcblx0aWYgKGRldGFpbHMuZ2V0dGVyTmFtZSkge1xyXG5cdFx0dGhpcy5zZXRHZXR0ZXJOYW1lKGRldGFpbHMuZ2V0dGVyTmFtZSk7XHJcblx0fVxyXG5cdGlmIChkZXRhaWxzLmNoYW5uZWwpIHtcclxuXHRcdHRoaXMuc2V0Q2hhbm5lbE5hbWUoZGV0YWlscy5jaGFubmVsKTtcclxuXHR9XHJcblx0aWYgKGRldGFpbHMuYmFkZ2UpIHtcclxuXHRcdHRoaXMuc2V0Q2hhbm5lbEJhZGdlKGRldGFpbHMuYmFkZ2UpO1xyXG5cdH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGF0ZSBjaGFuZ2Vycy5cclxuICovXHJcblxyXG4vKipcclxuICogVG9nZ2xlIHdoZXRoZXIgYW4gZW1vdGUgc2hvdWxkIGJlIGEgZmF2b3JpdGUuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBgdHJ1ZWAgZm9yY2VzIHRoZSBlbW90ZSB0byBiZSBhIGZhdm9yaXRlLCBgZmFsc2VgIGZvcmNlcyB0aGUgZW1vdGUgdG8gbm90IGJlIGEgZmF2b3JpdGUuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUudG9nZ2xlRmF2b3JpdGUgPSBmdW5jdGlvbiAoZm9yY2UpIHtcclxuXHRpZiAodHlwZW9mIGZvcmNlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0c3RvcmFnZS5zdGFycmVkLnNldCh0aGlzLmdldFRleHQoKSwgISFmb3JjZSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHN0b3JhZ2Uuc3RhcnJlZC5zZXQodGhpcy5nZXRUZXh0KCksICF0aGlzLmlzRmF2b3JpdGUoKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogVG9nZ2xlIHdoZXRoZXIgYW4gZW1vdGUgc2hvdWxkIGJlIHZpc2libGUgb3V0IG9mIGVkaXRpbmcgbW9kZS5cclxuICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIGB0cnVlYCBmb3JjZXMgdGhlIGVtb3RlIHRvIGJlIHZpc2libGUsIGBmYWxzZWAgZm9yY2VzIHRoZSBlbW90ZSB0byBiZSBoaWRkZW4uXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUudG9nZ2xlVmlzaWJpbGl0eSA9IGZ1bmN0aW9uIChmb3JjZSkge1xyXG5cdGlmICh0eXBlb2YgZm9yY2UgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRzdG9yYWdlLnZpc2liaWxpdHkuc2V0KHRoaXMuZ2V0VGV4dCgpLCAhIWZvcmNlKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0c3RvcmFnZS52aXNpYmlsaXR5LnNldCh0aGlzLmdldFRleHQoKSwgIXRoaXMuaXNWaXNpYmxlKCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXRlIGdldHRlcnMuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIGlzIGZyb20gYSAzcmQgcGFydHkuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIGlzIGZyb20gYSAzcmQgcGFydHkuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNUaGlyZFBhcnR5ID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiAhIXRoaXMuZ2V0R2V0dGVyTmFtZSgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIHdhcyBmYXZvcml0ZWQuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIHdhcyBmYXZvcml0ZWQuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNGYXZvcml0ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gc3RvcmFnZS5zdGFycmVkLmdldCh0aGlzLmdldFRleHQoKSwgZmFsc2UpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIGlzIHZpc2libGUgb3V0c2lkZSBvZiBlZGl0aW5nIG1vZGUuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIGlzIHZpc2libGUgb3V0c2lkZSBvZiBlZGl0aW5nIG1vZGUuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KHRoaXMuZ2V0VGV4dCgpLCB0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHRoZSBlbW90ZSBpcyBjb25zaWRlcmVkIGEgc2ltcGxlIHNtaWxleS5cclxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZW1vdGUgaXMgY29uc2lkZXJlZCBhIHNpbXBsZSBzbWlsZXkuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNTbWlsZXkgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gVGhlIGJhc2ljIHNtaWxleSBlbW90ZXMuXHJcblx0dmFyIGVtb3RlcyA9IFsnOignLCAnOiknLCAnOi8nLCAnOkQnLCAnOm8nLCAnOnAnLCAnOnonLCAnOyknLCAnO3AnLCAnPDMnLCAnPignLCAnQiknLCAnUiknLCAnb19vJywgJyMvJywgJzo3JywgJzo+JywgJzpTJywgJzxdJ107XHJcblx0cmV0dXJuIGVtb3Rlcy5pbmRleE9mKHRoaXMuZ2V0VGV4dCgpKSAhPT0gLTE7XHJcbn07XHJcblxyXG4vKipcclxuICogUHJvcGVydHkgZ2V0dGVycy9zZXR0ZXJzLlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBHZXQgYSBjaGFubmVsJ3MgZGlzcGxheSBuYW1lLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjaGFubmVsJ3MgZGlzcGxheSBuYW1lLiBNYXkgYmUgZXF1aXZhbGVudCB0byB0aGUgY2hhbm5lbCB0aGUgZmlyc3QgdGltZSB0aGUgQVBJIG5lZWRzIHRvIGJlIGNhbGxlZC5cclxuICovXHJcbkVtb3RlLnByb3RvdHlwZS5nZXRDaGFubmVsRGlzcGxheU5hbWUgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHR3aXRjaEFwaSA9IHJlcXVpcmUoJy4vdHdpdGNoLWFwaScpO1xyXG5cdHZhciBjaGFubmVsTmFtZSA9IHRoaXMuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHR2YXIgZGlzcGxheU5hbWUgPSBudWxsO1xyXG5cclxuXHQvLyBObyBjaGFubmVsLlxyXG5cdGlmICghY2hhbm5lbE5hbWUpIHtcclxuXHRcdHJldHVybiBudWxsO1xyXG5cdH1cclxuXHJcblx0Ly8gQ2hlY2sgc3RvcmFnZS5cclxuXHRkaXNwbGF5TmFtZSA9IHN0b3JhZ2UuZGlzcGxheU5hbWVzLmdldChjaGFubmVsTmFtZSk7XHJcblx0aWYgKGRpc3BsYXlOYW1lICE9PSBudWxsKSB7XHJcblx0XHRyZXR1cm4gZGlzcGxheU5hbWU7XHJcblx0fVxyXG5cclxuXHQvLyBUdXJiby1zcGVjaWZpYyBkaXNwbGF5IG5hbWUuXHJcblx0aWYgKGNoYW5uZWxOYW1lID09PSAndHVyYm8nKSB7XHJcblx0XHRkaXNwbGF5TmFtZSA9ICdUdXJibyc7XHJcblx0fVxyXG5cdC8vIEdldCBmcm9tIEFQSS5cclxuXHRlbHNlIHtcclxuXHRcdHR3aXRjaEFwaS5nZXRVc2VyKGNoYW5uZWxOYW1lLCBmdW5jdGlvbiAodXNlcikge1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ0dldHRpbmcgZnJlc2ggZGlzcGxheSBuYW1lIGZvciB1c2VyJywgdXNlcik7XHJcblx0XHRcdGRpc3BsYXlOYW1lID0gdXNlci5kaXNwbGF5X25hbWU7XHJcblx0XHRcdC8vIFNhdmUgaW4gc3RvcmFnZS5cclxuXHRcdFx0c3RvcmFnZS5kaXNwbGF5TmFtZXMuc2V0KGNoYW5uZWxOYW1lLCBkaXNwbGF5TmFtZSwgODY0MDAwMDApO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdFxyXG5cdHJldHVybiBkaXNwbGF5TmFtZSB8fCBjaGFubmVsTmFtZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSB1c2FibGUgZW1vdGUgdGV4dCBmcm9tIGEgcmVnZXguXHJcbiAqIEBhdHRyaWJ1dGUgaHR0cDovL3VzZXJzY3JpcHRzLm9yZy9zY3JpcHRzL3Nob3cvMTYwMTgzIChhZGFwdGlvbilcclxuICovXHJcbmZ1bmN0aW9uIGdldEVtb3RlRnJvbVJlZ0V4KHJlZ2V4KSB7XHJcblx0aWYgKHR5cGVvZiByZWdleCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleCk7XHJcblx0fVxyXG5cdGlmICghcmVnZXgpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignYHJlZ2V4YCBtdXN0IGJlIGEgUmVnRXhwIHN0cmluZyBvciBvYmplY3QuJyk7XHJcblx0fVxyXG5cdHJldHVybiBkZWNvZGVVUkkocmVnZXguc291cmNlKVxyXG5cdFx0LnJlcGxhY2UoJyZndFxcXFw7JywgJz4nKSAvLyByaWdodCBhbmdsZSBicmFja2V0XHJcblx0XHQucmVwbGFjZSgnJmx0XFxcXDsnLCAnPCcpIC8vIGxlZnQgYW5nbGUgYnJhY2tldFxyXG5cdFx0LnJlcGxhY2UoL1xcKFxcPyFbXildKlxcKS9nLCAnJykgLy8gcmVtb3ZlIG5lZ2F0aXZlIGdyb3VwXHJcblx0XHQucmVwbGFjZSgvXFwoKFtefF0pKlxcfD9bXildKlxcKS9nLCAnJDEnKSAvLyBwaWNrIGZpcnN0IG9wdGlvbiBmcm9tIGEgZ3JvdXBcclxuXHRcdC5yZXBsYWNlKC9cXFsoW158XSkqXFx8P1teXFxdXSpcXF0vZywgJyQxJykgLy8gcGljayBmaXJzdCBjaGFyYWN0ZXIgZnJvbSBhIGNoYXJhY3RlciBncm91cFxyXG5cdFx0LnJlcGxhY2UoL1teXFxcXF1cXD8vZywgJycpIC8vIHJlbW92ZSBvcHRpb25hbCBjaGFyc1xyXG5cdFx0LnJlcGxhY2UoL15cXFxcYnxcXFxcYiQvZywgJycpIC8vIHJlbW92ZSBib3VuZGFyaWVzXHJcblx0XHQucmVwbGFjZSgvXFxcXC9nLCAnJyk7IC8vIHVuZXNjYXBlXHJcbn1cclxuXHJcbnZhciBzb3J0aW5nID0ge307XHJcblxyXG4vKipcclxuICogU29ydCBieSBhbHBoYW51bWVyaWMgaW4gdGhpcyBvcmRlcjogc3ltYm9scyAtPiBudW1iZXJzIC0+IEFhQmIuLi4gLT4gbnVtYmVyc1xyXG4gKi9cclxuc29ydGluZy5ieVRleHQgPSBmdW5jdGlvbiAoYSwgYikge1xyXG5cdHRleHRBID0gYS5nZXRUZXh0KCkudG9Mb3dlckNhc2UoKTtcclxuXHR0ZXh0QiA9IGIuZ2V0VGV4dCgpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdGlmICh0ZXh0QSA8IHRleHRCKSB7XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fVxyXG5cdGlmICh0ZXh0QSA+IHRleHRCKSB7XHJcblx0XHRyZXR1cm4gMTtcclxuXHR9XHJcblx0cmV0dXJuIDA7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBCYXNpYyBzbWlsaWVzIGJlZm9yZSBub24tYmFzaWMgc21pbGllcy5cclxuICovXHJcbnNvcnRpbmcuYnlTbWlsZXkgPSBmdW5jdGlvbiAoYSwgYikge1xyXG5cdGlmIChhLmlzU21pbGV5KCkgJiZcdCFiLmlzU21pbGV5KCkpIHtcclxuXHRcdHJldHVybiAtMTtcclxuXHR9XHJcblx0aWYgKGIuaXNTbWlsZXkoKSAmJlx0IWEuaXNTbWlsZXkoKSkge1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cdHJldHVybiAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdsb2JhbHMgYmVmb3JlIHN1YnNjcmlwdGlvbiBlbW90ZXMsIHN1YnNjcmlwdGlvbnMgaW4gYWxwaGFiZXRpY2FsIG9yZGVyLlxyXG4gKi9cclxuc29ydGluZy5ieUNoYW5uZWxOYW1lID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuXHR2YXIgY2hhbm5lbEEgPSBhLmdldENoYW5uZWxOYW1lKCk7XHJcblx0dmFyIGNoYW5uZWxCID0gYi5nZXRDaGFubmVsTmFtZSgpO1xyXG5cclxuXHQvLyBCb3RoIGRvbid0IGhhdmUgY2hhbm5lbHMuXHJcblx0aWYgKCFjaGFubmVsQSAmJiAhY2hhbm5lbEIpIHtcclxuXHRcdHJldHVybiAwO1xyXG5cdH1cclxuXHJcblx0Ly8gXCJBXCIgaGFzIGNoYW5uZWwsIFwiQlwiIGRvZXNuJ3QuXHJcblx0aWYgKGNoYW5uZWxBICYmICFjaGFubmVsQikge1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cdC8vIFwiQlwiIGhhcyBjaGFubmVsLCBcIkFcIiBkb2Vzbid0LlxyXG5cdGlmIChjaGFubmVsQiAmJiAhY2hhbm5lbEEpIHtcclxuXHRcdHJldHVybiAtMTtcclxuXHR9XHJcblxyXG5cdGNoYW5uZWxBID0gY2hhbm5lbEEudG9Mb3dlckNhc2UoKTtcclxuXHRjaGFubmVsQiA9IGNoYW5uZWxCLnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdGlmIChjaGFubmVsQSA8IGNoYW5uZWxCKSB7XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fVxyXG5cdGlmIChjaGFubmVsQiA+IGNoYW5uZWxBKSB7XHJcblx0XHRyZXR1cm4gMTtcclxuXHR9XHJcblxyXG5cdC8vIEFsbCB0aGUgc2FtZVxyXG5cdHJldHVybiAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoZSBnZW5lcmFsIHNvcnQgb3JkZXIgZm9yIHRoZSBhbGwgZW1vdGVzIGNhdGVnb3J5LlxyXG4gKiBTbWlsZXlzIC0+IENoYW5uZWwgZ3JvdXBpbmcgLT4gYWxwaGFudW1lcmljXHJcbiAqL1xyXG5zb3J0aW5nLmFsbEVtb3Rlc0NhdGVnb3J5ID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuXHR2YXIgYnlTbWlsZXkgPSBzb3J0aW5nLmJ5U21pbGV5KGEsIGIpO1xyXG5cdHZhciBieUNoYW5uZWxOYW1lICA9IHNvcnRpbmcuYnlDaGFubmVsTmFtZShhLCBiKTtcclxuXHR2YXIgYnlUZXh0ID0gc29ydGluZy5ieVRleHQoYSwgYik7XHJcblxyXG5cdGlmIChieVNtaWxleSAhPT0gMCkge1xyXG5cdFx0cmV0dXJuIGJ5U21pbGV5O1xyXG5cdH1cclxuXHRpZiAoYnlDaGFubmVsTmFtZSAhPT0gMCkge1xyXG5cdFx0cmV0dXJuIGJ5Q2hhbm5lbE5hbWU7XHJcblx0fVxyXG5cdHJldHVybiBieVRleHQ7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGVtb3RlU3RvcmU7XHJcbiIsInZhciBhcGkgPSB7fTtcclxudmFyIHByZWZpeCA9ICdbRW1vdGUgTWVudV0gJztcclxudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuXHJcbmFwaS5sb2cgPSBmdW5jdGlvbiAoKSB7XHJcblx0aWYgKHR5cGVvZiBjb25zb2xlLmxvZyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0YXJndW1lbnRzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpLm1hcChmdW5jdGlvbiAoYXJnKSB7XHJcblx0XHRpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZyk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gYXJnO1xyXG5cdH0pO1xyXG5cdGFyZ3VtZW50cy51bnNoaWZ0KHByZWZpeCk7XHJcblx0Y29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcclxufTtcclxuXHJcbmFwaS5kZWJ1ZyA9IGZ1bmN0aW9uICgpIHtcclxuXHRpZiAoIXN0b3JhZ2UuZ2xvYmFsLmdldCgnZGVidWdNZXNzYWdlc0VuYWJsZWQnLCBmYWxzZSkpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0YXJndW1lbnRzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cdGFyZ3VtZW50cy51bnNoaWZ0KCdbREVCVUddICcpO1xyXG5cdGFwaS5sb2cuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XHJcbiIsInZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG52YXIgZW1vdGVzID0gcmVxdWlyZSgnLi9lbW90ZXMnKTtcclxudmFyIGFwaSA9IHt9O1xyXG5cclxuYXBpLnRvZ2dsZURlYnVnID0gZnVuY3Rpb24gKGZvcmNlZCkge1xyXG5cdGlmICh0eXBlb2YgZm9yY2VkID09PSAndW5kZWZpbmVkJykge1xyXG5cdFx0Zm9yY2VkID0gIXN0b3JhZ2UuZ2xvYmFsLmdldCgnZGVidWdNZXNzYWdlc0VuYWJsZWQnLCBmYWxzZSk7XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0Zm9yY2VkID0gISFmb3JjZWQ7XHJcblx0fVxyXG5cdHN0b3JhZ2UuZ2xvYmFsLnNldCgnZGVidWdNZXNzYWdlc0VuYWJsZWQnLCBmb3JjZWQpO1xyXG5cdGxvZ2dlci5sb2coJ0RlYnVnIG1lc3NhZ2VzIGFyZSBub3cgJyArIChmb3JjZWQgPyAnZW5hYmxlZCcgOiAnZGlzYWJsZWQnKSk7XHJcbn07XHJcblxyXG5hcGkucmVnaXN0ZXJFbW90ZUdldHRlciA9IGVtb3Rlcy5yZWdpc3RlckdldHRlcjtcclxuYXBpLmRlcmVnaXN0ZXJFbW90ZUdldHRlciA9IGVtb3Rlcy5kZXJlZ2lzdGVyR2V0dGVyO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XHJcbiIsInZhciBTdG9yZSA9IHJlcXVpcmUoJ3N0b3JhZ2Utd3JhcHBlcicpO1xyXG52YXIgc3RvcmFnZSA9IHt9O1xyXG5cclxuLy8gR2VuZXJhbCBzdG9yYWdlLlxyXG5zdG9yYWdlLmdsb2JhbCA9IG5ldyBTdG9yZSh7XHJcblx0bmFtZXNwYWNlOiAnZW1vdGUtbWVudS1mb3ItdHdpdGNoJ1xyXG59KTtcclxuXHJcbi8vIEVtb3RlIHZpc2liaWxpdHkgc3RvcmFnZS5cclxuc3RvcmFnZS52aXNpYmlsaXR5ID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ3Zpc2liaWxpdHknKTtcclxuLy8gRW1vdGUgc3RhcnJlZCBzdG9yYWdlLlxyXG5zdG9yYWdlLnN0YXJyZWQgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgnc3RhcnJlZCcpO1xyXG4vLyBEaXNwbGF5IG5hbWUgc3RvcmFnZS5cclxuc3RvcmFnZS5kaXNwbGF5TmFtZXMgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgnZGlzcGxheU5hbWVzJyk7XHJcbi8vIENoYW5uZWwgbmFtZSBzdG9yYWdlLlxyXG5zdG9yYWdlLmNoYW5uZWxOYW1lcyA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCdjaGFubmVsTmFtZXMnKTtcclxuLy8gQmFkZ2VzIHN0b3JhZ2UuXHJcbnN0b3JhZ2UuYmFkZ2VzID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ2JhZGdlcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzdG9yYWdlO1xyXG4iLCJ2YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi4vLi4vYnVpbGQvdGVtcGxhdGVzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGRhdGEgPSB7fTtcclxuXHR2YXIga2V5ID0gbnVsbDtcclxuXHJcblx0Ly8gQ29udmVydCB0ZW1wbGF0ZXMgdG8gdGhlaXIgc2hvcnRlciBcInJlbmRlclwiIGZvcm0uXHJcblx0Zm9yIChrZXkgaW4gdGVtcGxhdGVzKSB7XHJcblx0XHRpZiAoIXRlbXBsYXRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0fVxyXG5cdFx0ZGF0YVtrZXldID0gcmVuZGVyKGtleSk7XHJcblx0fVxyXG5cclxuXHQvLyBTaG9ydGN1dCB0aGUgcmVuZGVyIGZ1bmN0aW9uLiBBbGwgdGVtcGxhdGVzIHdpbGwgYmUgcGFzc2VkIGluIGFzIHBhcnRpYWxzIGJ5IGRlZmF1bHQuXHJcblx0ZnVuY3Rpb24gcmVuZGVyKHRlbXBsYXRlKSB7XHJcblx0XHR0ZW1wbGF0ZSA9IHRlbXBsYXRlc1t0ZW1wbGF0ZV07XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscyB8fCB0ZW1wbGF0ZXMsIGluZGVudCk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRhdGE7XHJcbn0pKCk7XHJcbiIsInZhciB0d2l0Y2hBcGkgPSB3aW5kb3cuVHdpdGNoLmFwaTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XHJcbnZhciBhcGkgPSB7fTtcclxuXHJcbmFwaS5nZXRCYWRnZXMgPSBmdW5jdGlvbiAodXNlcm5hbWUsIGNhbGxiYWNrKSB7XHJcblx0Ly8gTm90ZTogbm90IGEgZG9jdW1lbnRlZCBBUEkgZW5kcG9pbnQuXHJcblx0dHdpdGNoQXBpLmdldCgnY2hhdC8nICsgdXNlcm5hbWUgKyAnL2JhZGdlcycpXHJcblx0XHQuZG9uZShmdW5jdGlvbiAoYXBpKSB7XHJcblx0XHRcdGNhbGxiYWNrKGFwaSk7XHJcblx0XHR9KVxyXG5cdFx0LmZhaWwoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRjYWxsYmFjayh7fSk7XHJcblx0XHR9KTtcclxufTtcclxuXHJcbmFwaS5nZXRVc2VyID0gZnVuY3Rpb24gKHVzZXJuYW1lLCBjYWxsYmFjaykge1xyXG5cdC8vIE5vdGU6IG5vdCBhIGRvY3VtZW50ZWQgQVBJIGVuZHBvaW50LlxyXG5cdHR3aXRjaEFwaS5nZXQoJ3VzZXJzLycgKyB1c2VybmFtZSlcclxuXHRcdC5kb25lKGZ1bmN0aW9uIChhcGkpIHtcclxuXHRcdFx0Y2FsbGJhY2soYXBpKTtcclxuXHRcdH0pXHJcblx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGNhbGxiYWNrKHt9KTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxuYXBpLmdldFRpY2tldHMgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuXHQvLyBOb3RlOiBub3QgYSBkb2N1bWVudGVkIEFQSSBlbmRwb2ludC5cclxuXHR0d2l0Y2hBcGkuZ2V0KFxyXG5cdFx0Jy9hcGkvdXNlcnMvOmxvZ2luL3RpY2tldHMnLFxyXG5cdFx0e1xyXG5cdFx0XHRvZmZzZXQ6IDAsXHJcblx0XHRcdGxpbWl0OiAxMDAsXHJcblx0XHRcdHVuZW5kZWQ6IHRydWVcclxuXHRcdH1cclxuXHQpXHJcblx0XHQuZG9uZShmdW5jdGlvbiAoYXBpKSB7XHJcblx0XHRcdGNhbGxiYWNrKGFwaS50aWNrZXRzIHx8IFtdKTtcclxuXHRcdH0pXHJcblx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGNhbGxiYWNrKFtdKTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxuYXBpLm9uRW1vdGVzQ2hhbmdlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBpbW1lZGlhdGUpIHtcclxuXHR2YXIgZW1iZXIgPSByZXF1aXJlKCcuL2VtYmVyLWFwaScpO1xyXG5cdHZhciBzZXNzaW9uID0gZW1iZXIuZ2V0KCdjb250cm9sbGVyOmNoYXQnLCAnY3VycmVudFJvb20udG1pUm9vbS5zZXNzaW9uJyk7XHJcblx0dmFyIHJlc3BvbnNlID0gbnVsbDtcclxuXHJcblx0aWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdgY2FsbGJhY2tgIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcclxuXHR9XHJcblxyXG5cdC8vIE5vIHBhcnNlciBvciBubyBlbW90ZXMgbG9hZGVkIHlldCwgdHJ5IGFnYWluLlxyXG5cdGlmICghc2Vzc2lvbikge1xyXG5cdFx0c2V0VGltZW91dChhcGkub25FbW90ZXNDaGFuZ2UsIDEwMCwgY2FsbGJhY2ssIGltbWVkaWF0ZSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHQvLyBDYWxsIHRoZSBjYWxsYmFjayBpbW1lZGlhdGVseSBvbiByZWdpc3RlcmluZy5cclxuXHRpZiAoaW1tZWRpYXRlKSB7XHJcblx0XHRyZXNwb25zZSA9IHNlc3Npb24uZ2V0RW1vdGVzKCk7XHJcblx0XHRpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5lbW90aWNvbl9zZXRzKSB7XHJcblx0XHRcdHNldFRpbWVvdXQoYXBpLm9uRW1vdGVzQ2hhbmdlLCAxMDAsIGNhbGxiYWNrLCBpbW1lZGlhdGUpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0Y2FsbGJhY2socmVzcG9uc2UuZW1vdGljb25fc2V0cyk7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0NhbGxlZCBlbW90ZSBjaGFuZ2UgaGFuZGxlciBpbW1lZGlhdGVseS4nKTtcclxuXHR9XHJcblxyXG5cdC8vIExpc3RlbiBmb3IgdGhlIGV2ZW50LlxyXG5cdHNlc3Npb24uX2Vtb3Rlc1BhcnNlci5vbignZW1vdGVzX2NoYW5nZWQnLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuXHRcdGNhbGxiYWNrKHJlc3BvbnNlLmVtb3RpY29uX3NldHMpO1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdDYWxsZWQgZW1vdGUgY2hhbmdlIGhhbmRsZXIuJylcclxuXHR9KTtcclxuXHRsb2dnZXIuZGVidWcoJ1JlZ2lzdGVyZWQgbGlzdGVuZXIgZm9yIGVtb3RlIGNoYW5nZXMuJyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwiKGZ1bmN0aW9uICgkKSB7XHJcblx0JC5mbi5yZXNpemFibGUgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cdFx0dmFyIHNldHRpbmdzID0gJC5leHRlbmQoe1xyXG5cdFx0XHRhbHNvUmVzaXplOiBudWxsLFxyXG5cdFx0XHRhbHNvUmVzaXplVHlwZTogJ2JvdGgnLCAvLyBgaGVpZ2h0YCwgYHdpZHRoYCwgYGJvdGhgXHJcblx0XHRcdGNvbnRhaW5tZW50OiBudWxsLFxyXG5cdFx0XHRjcmVhdGU6IG51bGwsXHJcblx0XHRcdGRlc3Ryb3k6IG51bGwsXHJcblx0XHRcdGhhbmRsZTogJy5yZXNpemUtaGFuZGxlJyxcclxuXHRcdFx0bWF4SGVpZ2h0OiA5OTk5LFxyXG5cdFx0XHRtYXhXaWR0aDogOTk5OSxcclxuXHRcdFx0bWluSGVpZ2h0OiAwLFxyXG5cdFx0XHRtaW5XaWR0aDogMCxcclxuXHRcdFx0cmVzaXplOiBudWxsLFxyXG5cdFx0XHRyZXNpemVPbmNlOiBudWxsLFxyXG5cdFx0XHRzbmFwU2l6ZTogMSxcclxuXHRcdFx0c3RhcnQ6IG51bGwsXHJcblx0XHRcdHN0b3A6IG51bGxcclxuXHRcdH0sIG9wdGlvbnMpO1xyXG5cclxuXHRcdHNldHRpbmdzLmVsZW1lbnQgPSAkKHRoaXMpO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHJlY2FsY3VsYXRlU2l6ZShldnQpIHtcclxuXHRcdFx0dmFyIGRhdGEgPSBldnQuZGF0YSxcclxuXHRcdFx0XHRyZXNpemVkID0ge307XHJcblx0XHRcdGRhdGEuZGlmZlggPSBNYXRoLnJvdW5kKChldnQucGFnZVggLSBkYXRhLnBhZ2VYKSAvIHNldHRpbmdzLnNuYXBTaXplKSAqIHNldHRpbmdzLnNuYXBTaXplO1xyXG5cdFx0XHRkYXRhLmRpZmZZID0gTWF0aC5yb3VuZCgoZXZ0LnBhZ2VZIC0gZGF0YS5wYWdlWSkgLyBzZXR0aW5ncy5zbmFwU2l6ZSkgKiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHRcdFx0aWYgKE1hdGguYWJzKGRhdGEuZGlmZlgpID4gMCB8fCBNYXRoLmFicyhkYXRhLmRpZmZZKSA+IDApIHtcclxuXHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LmhlaWdodCgpICE9PSBkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgJiZcclxuXHRcdFx0XHRcdGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSA+PSBzZXR0aW5ncy5taW5IZWlnaHQgJiZcclxuXHRcdFx0XHRcdGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSA8PSBzZXR0aW5ncy5tYXhIZWlnaHQgJiZcclxuXHRcdFx0XHRcdChzZXR0aW5ncy5jb250YWlubWVudCA/IGRhdGEub3V0ZXJIZWlnaHQgKyBkYXRhLmRpZmZZICsgZGF0YS5vZmZzZXQudG9wIDw9IHNldHRpbmdzLmNvbnRhaW5tZW50Lm9mZnNldCgpLnRvcCArIHNldHRpbmdzLmNvbnRhaW5tZW50Lm91dGVySGVpZ2h0KCkgOiB0cnVlKVxyXG5cdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZKTtcclxuXHRcdFx0XHRcdHJlc2l6ZWQuaGVpZ2h0ID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC53aWR0aCgpICE9PSBkYXRhLndpZHRoICsgZGF0YS5kaWZmWCAmJlxyXG5cdFx0XHRcdFx0ZGF0YS53aWR0aCArIGRhdGEuZGlmZlggPj0gc2V0dGluZ3MubWluV2lkdGggJiZcclxuXHRcdFx0XHRcdGRhdGEud2lkdGggKyBkYXRhLmRpZmZYIDw9IHNldHRpbmdzLm1heFdpZHRoICYmXHJcblx0XHRcdFx0XHQoc2V0dGluZ3MuY29udGFpbm1lbnQgPyBkYXRhLm91dGVyV2lkdGggKyBkYXRhLmRpZmZYICsgZGF0YS5vZmZzZXQubGVmdCA8PSBzZXR0aW5ncy5jb250YWlubWVudC5vZmZzZXQoKS5sZWZ0ICsgc2V0dGluZ3MuY29udGFpbm1lbnQub3V0ZXJXaWR0aCgpIDogdHJ1ZSlcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQud2lkdGgoZGF0YS53aWR0aCArIGRhdGEuZGlmZlgpO1xyXG5cdFx0XHRcdFx0cmVzaXplZC53aWR0aCA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChyZXNpemVkLmhlaWdodCB8fCByZXNpemVkLndpZHRoKSB7XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MucmVzaXplT25jZSkge1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemVPbmNlLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoZXZ0LmRhdGEpO1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemVPbmNlID0gbnVsbDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5yZXNpemUpIHtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoZXZ0LmRhdGEpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLmFsc29SZXNpemUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHJlc2l6ZWQuaGVpZ2h0ICYmIChzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ2hlaWdodCcgfHwgc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdib3RoJykpIHtcclxuXHRcdFx0XHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplLmhlaWdodChkYXRhLmFsc29SZXNpemVIZWlnaHQgKyBkYXRhLmRpZmZZKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAocmVzaXplZC53aWR0aCAmJiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICd3aWR0aCcgfHwgc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdib3RoJykpIHtcclxuXHRcdFx0XHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplLndpZHRoKGRhdGEuYWxzb1Jlc2l6ZVdpZHRoICsgZGF0YS5kaWZmWCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBzdGFydChldnQpIHtcclxuXHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5zdGFydCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLnN0YXJ0LmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgZGF0YSA9IHtcclxuXHRcdFx0XHRhbHNvUmVzaXplSGVpZ2h0OiBzZXR0aW5ncy5hbHNvUmVzaXplID8gc2V0dGluZ3MuYWxzb1Jlc2l6ZS5oZWlnaHQoKSA6IDAsXHJcblx0XHRcdFx0YWxzb1Jlc2l6ZVdpZHRoOiBzZXR0aW5ncy5hbHNvUmVzaXplID8gc2V0dGluZ3MuYWxzb1Jlc2l6ZS53aWR0aCgpIDogMCxcclxuXHRcdFx0XHRoZWlnaHQ6IHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KCksXHJcblx0XHRcdFx0b2Zmc2V0OiBzZXR0aW5ncy5lbGVtZW50Lm9mZnNldCgpLFxyXG5cdFx0XHRcdG91dGVySGVpZ2h0OiBzZXR0aW5ncy5lbGVtZW50Lm91dGVySGVpZ2h0KCksXHJcblx0XHRcdFx0b3V0ZXJXaWR0aDogc2V0dGluZ3MuZWxlbWVudC5vdXRlcldpZHRoKCksXHJcblx0XHRcdFx0cGFnZVg6IGV2dC5wYWdlWCxcclxuXHRcdFx0XHRwYWdlWTogZXZ0LnBhZ2VZLFxyXG5cdFx0XHRcdHdpZHRoOiBzZXR0aW5ncy5lbGVtZW50LndpZHRoKClcclxuXHRcdFx0fTtcclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNlbW92ZScsICcqJywgZGF0YSwgcmVjYWxjdWxhdGVTaXplKTtcclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNldXAnLCAnKicsIHN0b3ApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHN0b3AoKSB7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5zdG9wKSB7XHJcblx0XHRcdFx0c2V0dGluZ3Muc3RvcC5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUnLCAnKicsIHJlY2FsY3VsYXRlU2l6ZSk7XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsICcqJywgc3RvcCk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHNldHRpbmdzLmhhbmRsZSkge1xyXG5cdFx0XHRpZiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZSAmJiBbJ2JvdGgnLCAnaGVpZ2h0JywgJ3dpZHRoJ10uaW5kZXhPZihzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSkgPj0gMCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmFsc29SZXNpemUgPSAkKHNldHRpbmdzLmFsc29SZXNpemUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChzZXR0aW5ncy5jb250YWlubWVudCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmNvbnRhaW5tZW50ID0gJChzZXR0aW5ncy5jb250YWlubWVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0c2V0dGluZ3MuaGFuZGxlID0gJChzZXR0aW5ncy5oYW5kbGUpO1xyXG5cdFx0XHRzZXR0aW5ncy5zbmFwU2l6ZSA9IHNldHRpbmdzLnNuYXBTaXplIDwgMSA/IDEgOiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHJcblx0XHRcdGlmIChvcHRpb25zID09PSAnZGVzdHJveScpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5oYW5kbGUub2ZmKCdtb3VzZWRvd24nLCBzdGFydCk7XHJcblxyXG5cdFx0XHRcdGlmIChzZXR0aW5ncy5kZXN0cm95KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5kZXN0cm95LmJpbmQodGhpcykoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNldHRpbmdzLmhhbmRsZS5vbignbW91c2Vkb3duJywgc3RhcnQpO1xyXG5cclxuXHRcdFx0aWYgKHNldHRpbmdzLmNyZWF0ZSkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmNyZWF0ZS5iaW5kKHRoaXMpKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH07XHJcbn0pKGpRdWVyeSk7XHJcbiJdfQ==
