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
// @version         0.3.1
// ==/UserScript==

// Compatibility with Opera.
if (window.opera && !window.unsafeWindow) {window.unsafeWindow = false;}

// Start wrapper.
(function (window, undefined) {

// Script-wide variables.
//-----------------------
var emotes = [],
	emoteListeners = [],
	emotePopularity = false,
	userInfo = {
		emoteSets: [],
		name: '',
		displayName: ''
	},
	$,
	jQuery,
	MESSAGES = {
		NO_CHAT_LOAD: 'Unable to add emotes button for some reason, stopping.',
		EMOTES_NOT_LOADED: 'Emotes aren\'t loaded from the API yet, try again.',
		NO_CHAT_ELEMENT: 'There is no chat element on the page, unable to continue.',
		NOT_LOGGED_IN: 'You are not logged in, please log in first.'
	};

// Only enable script if we have the right variables.
//---------------------------------------------------
(function init(time) {
	if (!time) {
		var time = 0;
	}
	else if (time >= 10000) {
		// Taking too much time, error out.
		console.error(
			MESSAGES.NO_CHAT_LOAD,
			'[PP: ' + (window.PP !== undefined),
			' / Logged in: ' + (window.PP ? window.PP.login !== '' : false),
			' / Twitch Object: ' + (window.Twitch !== undefined),
			' / Chat Object: ' + (window.CurrentChat !== undefined),
			' / Chat Loaded: ' + (window.CurrentChat ? window.CurrentChat.last_sender !== false : false),
			' / jQuery: ' + (window.$j !== undefined),
			' / userAgent: ' + navigator.userAgent + ']'
		);
		return;
	}
	if (
		!window.PP ||
		window.PP.login === '' ||
		!window.Twitch ||
		!window.CurrentChat ||
		window.CurrentChat.last_sender === false ||
		!window.$j
	) {
		setTimeout(init, 50, (time + 50));
		return;
	}
	setup();
})();

// Start of functions.
//--------------------
/**
 * Populates the popup menu with current emote data.
 */
function populateEmotes() {
	if (emotes.length < 1) {
		console.warn(MESSAGES.EMOTES_NOT_LOADED);
		setTimeout(populateEmotes, 50);
		return;
	}
	// Remove old listeners.
	emoteListeners.forEach(function (listener) {
		listener.element.removeEventListener(listener.type, listener.func, false);
	});
	emoteListeners = [];
	var container = false;

	// Get container for popular emotes.
	container = document.querySelector('#chat_emote_dropmenu .emotes-popular .emotes-container');
	// Remove old emotes.
	container.innerHTML = '';
	emotes.sort(sortByNormal);
	emotes.sort(sortByPopularity);
	emotes.forEach(function (emote) {
		addEmote(emote, container);
	});
	
	// Get container for all emotes.
	container = document.querySelector('#chat_emote_dropmenu .emotes-all .emotes-container');
	// Remove old emotes.
	container.innerHTML = '';
	// Add all emotes.
	emotes.sort(sortByNormal);
	emotes.sort(sortBySet);
	emotes.forEach(function (emote) {
		addEmote(emote, container);
	});
	
	var chatEmoteDropmenu = $('#chat_emote_dropmenu'),
		chatLines = $('#chat_lines');
	// Only adjust dimensions if the menu hasn't been moved.
	if (!chatEmoteDropmenu.hasClass('has_moved')) {
		// Adjust the height of the popup, requires special handling due to scrolling element.
		var height = chatEmoteDropmenu.outerHeight() - chatEmoteDropmenu.find('.emotes-all').outerHeight();
		height = chatLines.height() - height;
		chatEmoteDropmenu.find('.emotes-all').height(height);
		
		// Adjust the width and position of the popup.
		chatEmoteDropmenu
			.width($('#speak').outerWidth() - 12)
			.offset(chatLines.offset());
	}
	
	/**
	 * Adds the emote to document and listens for a click event that will add the emote text to the chat.
	 * @param [object] The emote that you want to add.
	 * @param [element] The HTML element that the emote should be appended to.
	 */
	function addEmote(emote, container) {
		// Emote not usable or no container, can't add.
		if (!emote || !emote.image || !container) {
			return;
		}
		
		// Create element.
		var element = document.createElement('div');
		element.className = 'userscript_emoticon';
		element.innerHTML = emote.image.html;
		element.dataset.emote = emote.text;
		if (emote.image.emoticon_set) {
			element.dataset.emoteSet = emote.image.emoticon_set;
		}
		element.title = emote.text;
		container.appendChild(element);
		
		// Add listeners.
		var listener = {
			'element': element,
			'func': function () {
				insertEmote(emote.text);
			},
			'type': 'click'
		};
		listener.element.addEventListener(listener.type, listener.func, false);
		emoteListeners.push(listener);
	}
	
	/**
	 * Sort by popularity: most used -> least used
	 */
	function sortByPopularity(a, b) {
		var aGet = emotePopularityGet(a.text),
			bGet = emotePopularityGet(b.text),
			aNumber = typeof aGet == 'number',
			bNumber = typeof bGet == 'number';
		if (aNumber && !bNumber) return -1;
		if (bNumber && !aNumber) return 1;
		if (aGet < bGet) return 1;
		if (aGet > bGet) return -1;
		return 0;
	}
	
	/**
	 * Sort by alphanumeric in this order: symbols -> numbers -> AaBb... -> numbers
	 */
	function sortByNormal(a, b){
		a = a.text;
		b = b.text;
		var aTest = /[\W]/.test(a);
		var bTest = /[\W]/.test(b);
		if (aTest && !bTest) return -1;
		if (bTest && !aTest) return 1;
		if (a.toLowerCase() < b.toLowerCase()) return -1;
		if (a.toLowerCase() > b.toLowerCase()) return 1;
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	}
	
	/**
	 * Sort by emoticon set: basic smileys -> no set -> set 0-9...
	 */
	function sortBySet(a, b){
		if (a.image && !b.image) return 1;
		if (b.image && !a.image) return -1;
		if (a.image && b.image) {
			// Override for turbo emotes.
			if ((a.image.emoticon_set == 33 || a.image.emoticon_set == 42) && (b.image.emoticon_set != 33 && b.image.emoticon_set != 42)) return -1;
			if ((b.image.emoticon_set == 33 || b.image.emoticon_set == 42) && (a.image.emoticon_set != 33 && a.image.emoticon_set != 42)) return 1;
			// Override for basic emotes.
			var basicEmotes = [':(', ':)', ':/', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o'];
			if (basicEmotes.indexOf(a.text) >= 0 && basicEmotes.indexOf(b.text) < 0) return -1;
			if (basicEmotes.indexOf(b.text) >= 0 && basicEmotes.indexOf(a.text) < 0) return 1;
			// Sort by set number.
			if (a.image.emoticon_set < b.image.emoticon_set) return -1;
			if (a.image.emoticon_set > b.image.emoticon_set) return 1;
		}
		return 0;
	}
}

/**
 * Runs all setup procedures listed:
 * - Populate script-wide variables.
 * - Create button element.
 * - Create popup element.
 * - Get current emotes from API.
 * - Add styles.
 * - Create listeners.
 */
function setup() {
	// Populate script-wide variables.
	//--------------------------------
	// jQuery
	$ = jQuery = window.$j;
	
	// User info.
	userInfo.name = window.PP.login;
	userInfo.displayName = window.PP.display_name;
	userInfo.emoteSets = [];
	(function checkEmoteSets(time) {
		if (time >= 20000) {
			userInfo.emoteSets = [];
		}
		else if (window.CurrentChat.user_to_emote_sets[userInfo.name] === undefined) {
			setTimeout(checkEmoteSets, 50, time + 50);
			return;
		}
		else {
			userInfo.emoteSets = window.CurrentChat.user_to_emote_sets[userInfo.name];
		}
	})(0);
	
	// Create button element.
	//-----------------------
	var button = document.createElement('a');
	button.id = 'chat_emote_dropmenu_button';
	button.className = 'dropdown_glyph';
	button.innerHTML = '<span>emotes</span>';
	var chatButton = document.querySelector('#chat_speak');
	if (chatButton) {
		chatButton.parentNode.insertBefore(button, chatButton);
		$('#chat_emote_dropmenu_button').hide();
		if (chatButton.classList.contains('cap')) {
			$('#control_input').animate({'margin-right': '175px'});
			$('#control_buttons').css('width', '175px');
			$('#chat_speak').animate({'margin-right': '51px'}, {
				complete: function () {
					$('#chat_speak').css('margin-right', '5px');
					$('#chat_emote_dropmenu_button').css('margin-right', '5px').fadeIn();
				}
			});
		}
		else {
			$(chatButton).css('float', 'right').animate({'width': '128px'}, {
				complete: function () {
					$('#chat_emote_dropmenu_button').fadeIn();
				}
			});
		}
	}
	else {
		// No chat, just exit.
		console.warn(MESSAGES.NO_CHAT_ELEMENT);
		return;
	}
	
	// Create popup element.
	//----------------------
	var popup = document.createElement('div');
	popup.id = 'chat_emote_dropmenu';
	popup.className = 'dropmenu';
	popup.innerHTML = [
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
	].join('\n');
	document.body.appendChild(popup);
	
	// Get current emotes from API.
	//-----------------------------
	window.Twitch.api.get("chat/emoticons").done(function (a) {
		var c = 0;
		a.emoticons.forEach(function (emote) {
			// Taken from http://userscripts.org/scripts/show/160183
			emote.text = unescape(emote.regex)
					.replace('&gt\\;', '>') // right angle bracket
					.replace('&lt\\;', '<') // left angle bracket
					.replace(/\(\?![^)]*\)/g, '') // remove negative group
					.replace(/\(([^|])*\|?[^)]*\)/g, '$1') // pick first option from a group
					.replace(/\[([^|])*\|?[^\]]*\]/g, '$1') // pick first character from a character group
					.replace(/[^\\]\?/g, '') // remove optional chars
					.replace(/\\/g, ''); // unescape
			emote.regex = RegExp(emote.regex, "g");
			
			var imageDefault = false;
			emote.images.forEach(function (image) {
				c += 1;
				image.html = window.ich["chat-emoticon"]({
					id: c
				}).prop("outerHTML");
				
				// Check if emoticon is usable.
				if (image.emoticon_set == null) {
					imageDefault = image;
				}
				if (userInfo.emoteSets.indexOf(image.emoticon_set) >= 0) {
					emote.image = image;
				}
			});
			
			// No emotes from sets.
			if (!emote.image) {
				// Use the non-set emote if available.
				if (imageDefault) {
					emote.image = imageDefault;
				}
			}
			
			emotes.push(emote);
		});
		addSetStyles();
		populateEmotes();
	});
	
	// Add styles.
	//------------
	var icons = {
		dropmenuButton: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAQCAYAAADwMZRfAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAOtJREFUOE+NkLERgzAMRdkgS2QGpvAYqVNRpmMDimyRo2YiVqBz/ncknSTIAXfvwPL/L467WmtgGIYeTGA5gPM+d8ICgdc4jvUM5nzPC3oG5nk+RUR2IpNg43NU+AfzQYLnfvUUCvPsmaSU8lYJjlmxbm9fynPm2WsS/jduqoTfipfkuUja3VDy5EIluqlrJc91zX63bVs4yVVUwn67E3zYnVyFefbsYvHcMFx9IEvzjHn2TCKneaTQDr/HvHZNQrC5+vARIlx9L0hgLxIKv+zKDeZ8L0gIA6CdKMN5FpCw8IhsAou8d+UftfsCjtrm7yD1aJgAAAAASUVORK5CYII=',
		resizeHandle: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAX0lEQVQ4T6WPUQ7AIAhDPfpuzuyHxpGK7SR5IVYeCS0irqChAw0daOhAQwcaijyAfShARv1aMOWOfcJHBnmgIsvo8glMRkkLtnLneEIpg3U4c5LRtycoMqpcMIaLd7QXl2chH51cR7QAAAAASUVORK5CYII=',
		// Inverted color to suit dark theme and resized to 16x16.
		// @attribution Github, Inc. (https://github.com/github/media/blob/master/octocats/blacktocats.ai)
		github: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiIAAC4iAari3ZIAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAWpJREFUOE+F0ssrRGEYx/EZBhs2ssHCrCasFf4DFiKyERuytRMZESl3WxsbK0s2FlKKxkIJOyRpEgtyv19yfH/H87qm86tPvee9POd5z0zodzzPK8I4NnFuNjCKmG37GxbTMYEXrKMb9aYHKviMYaTZsY8wocPzOEENbOUrzIWhYmeYQ8SW/MUxnKICekMhNJ+FTBvraiOohK414A7HoNbqUAvlCcd4NRprj1KFBmhPVAWGsAXXYlCqkYJt9KnAGvrhxkFJWOe66ooGaq8REdwgKBdQBy1IqsARmqArqFhQktC5VhxosIpBa2sKQZm0vfrPLGmg++uD5KAYKvhflpGNVOwjrgIFeEAbZhFFGXbhkkAJwvZ2tX+HPD1rohdXtnAI/axvcPE/nO0thT52p39Y4UEtzeAS7SjHI1zUYQaacY1p+AU/w4SKxHEPfRP9A1003sEt9IKfh7+HxXx0YRF7ZgEdyLVtllDoHUPsDkVplXakAAAAAElFTkSuQmCC'
	};
	// Add main style.
	addStyle([		
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
	].join('\n'));
	
	// Add style for set-unique background colors.
	function addSetStyles() {
		var css = [],
			sets = {};
		emotes.forEach(function (emote) {
			if (emote.image && emote.image.emoticon_set) {
				sets[emote.image.emoticon_set] = '#chat_emote_dropmenu .userscript_emoticon[data-emote-set="' + emote.image.emoticon_set + '"] { background-color: hsla(' + (emote.image.emoticon_set * 90) + ', 100%, 50%, 0.1) !important; }';
				sets[emote.image.emoticon_set] += '#chat_emote_dropmenu .userscript_emoticon[data-emote-set="' + emote.image.emoticon_set + '"]:hover { background-color: hsla(' + (emote.image.emoticon_set * 90) + ', 100%, 50%, 0.2) !important; }';
			}
		});
		for (var set in sets) {
			css.push(sets[set]);
		}
		addStyle(css.join('\n'));
	}
	// TODO: Fix emotes on black background, substitute out for fixed ones.
	// TODO: Consider contacting Twitch to fix emotes on their end.
	// Add style to fix white-background emotes.
	var fixedEmotes = {
		'DansGame': 'http://i.imgur.com/qonn0aV.png'
	};
	var css = [];
	for (var emote in fixedEmotes) {
		css.push('#chat_emote_dropmenu .userscript_emoticon[data-emote="' + emote + '"] .emoticon { background-image: url("' + fixedEmotes[emote] + '") !important; }');
	}
	addStyle(css.join('\n'));

	// Create listeners.
	//------------------
	// Popup on click.
	$('#chat_emote_dropmenu_button').popup('click_to_close', $('#chat_emote_dropmenu'), {
		above: !0
	});
	
	// Restore outside clicks to close popup, but only when it hasn't been moved.
	$('#chat_emote_dropmenu').on('clickoutside', function () {
		if (!$(this).hasClass('has_moved') && $(this).is(':visible')) {
			$('#chat_emote_dropmenu_button').click();
		}
	});
	
	// Make draggable.
	$('#chat_emote_dropmenu').draggable({
		handle: 'h4.draggable',
		start: function () {
			$(this).addClass('has_moved')
		}
	});
	
	// Make resizable.
    var originalX, originalY, originalWidth, originalHeight,
        chatEmoteDropmenu = $('#chat_emote_dropmenu'),
        chatEmoteAll = chatEmoteDropmenu.find('.emotes-all');
    function adjustSize(evt) {
    	    console.log(evt);
		    var diffX = evt.pageX - originalX,
		        diffY = evt.pageY - originalY;
		    chatEmoteDropmenu.width(originalWidth + diffX);
		    chatEmoteAll.height(originalHeight + diffY);
		    
    }
	$('#chat_emote_dropmenu .resize-handle').on('mousedown', function (evt) {
		// Prevent text selection.
		evt.preventDefault();
		$('#chat_emote_dropmenu').addClass('has_moved');
		console.log(evt);
		originalX = evt.pageX;
		originalY = evt.pageY;
		originalWidth = chatEmoteDropmenu.width();
		originalHeight = chatEmoteAll.height();
		
		$(document).on('mousemove', '*', adjustSize);
	});
	$(document).on('mouseup', function () {
		$(document).off('mousemove', '*', adjustSize);
	});
	
	// Repopulate emotes.
	$('#chat_emote_dropmenu_button').on('click', function () {
		$('#chat_emote_dropmenu').removeClass('has_moved');
		$(this).toggleClass('toggled');
		populateEmotes();
	});
	
	// Enable the popularity reset.
	$('#chat_emote_dropmenu .dropmenu_alt_section a.reset').on('click', function () {
		emotePopularityClear();
		populateEmotes();
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
	$('#chat_emote_dropmenu .scroll.emotes-all').TrackpadScrollEmulator();
}

/**
 * Adds / sets popularity of an emote. Note: saves popularity data to storage each time this is called.
 * @param text [string] The text of the emote (e.g. "Kappa").
 * @param forceAmount [number, optional] The amount of popularity to force the emote to have. If not specificed, popularity will increase by 1.
 */
function emotePopularityAdd(text, forceAmount) {
	emotePopularityInit();
	if (emotePopularity[text] === undefined) {
		emotePopularity[text] = 0;
	}
	if (typeof forceAmount == 'number' && forceAmount >= 0) {
		emotePopularity[text] = forceAmount;
	}
	else {
		emotePopularity[text] += 1;
	}
	setSetting('emote-popularity-tracking', JSON.stringify(emotePopularity));
}

/**
 * Gets the current popularity of an emote.
 * @param text [string] The text of the emote (e.g. "Kappa").
 * @return [number] The amount of popularity. Possible to be 0 if it has been forced.
 * @return [boolean] `false` if the emote is not in the popularity tracking data (never been added by `emotePopularityAdd`).
 */
function emotePopularityGet(text) {
	emotePopularityInit();
	if (typeof emotePopularity[text] == 'number' && emotePopularity[text] >= 0) {
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
 * @param text [string] The text of the emote (e.g. "Kappa").
 */
function insertEmote(text) {
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
	if (beforeText != '' && beforeText.substr(-1) != ' ') {
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
	if (!$('#chat_emote_dropmenu').hasClass('has_moved')) {
		$('#chat_emote_dropmenu_button').click();
	}
	// Re-populate as it is still open.
	else {
		populateEmotes();
	}
}

/**
 * Adds a stylesheet to the document.
 * @param text [string] The styles to be added.
 */
function addStyle(text) {
	var style = document.createElement('style');
	style.textContent = text;
	document.querySelector('head').appendChild(style);
}

// Generic functions.
//-------------------
/**
 * Gets a storage value.
 * @param aKey [string] The key you want to get.
 * @param aDefault [mixed] The default value to return if there isn't anything in storage.
 * @return The value in storage or `aDefault` if there isn't anything in storage.
 */
function getSetting(aKey, aDefault) {
	var val = localStorage.getItem(aKey)
	if (val === null && typeof aDefault != 'undefined') {
		return aDefault;
	}
	return val;
}
/**
 * Sets a storage value.
 * @param aKey [string] The key you want to set.
 * @param aVal [mixed] The value you want to store.
 */
function setSetting(aKey, aVal) {
	localStorage.setItem(aKey, aVal);
}

/**
 * Deletes a storage key.
 * @param aKey [string] The key you want to set.
 */
function deleteSetting(aKey) {
	localStorage.removeItem(aKey);
}

// End wrapper.
})(unsafeWindow || window);
