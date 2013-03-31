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
// @version         0.2.7
// ==/UserScript==

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
	};

// Only enable script if we have the right variables.
//---------------------------------------------------
(function init() {
	if (
		!window.PP ||
		!window.Twitch ||
		!window.CurrentChat ||
		window.CurrentChat.last_sender === false ||
		!window.$j
	) {
		setTimeout(init, 50);
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
	
	// Adjust the height of the popup, requires special handling due to scrolling element.
	var height = window.$j('#chat_emote_dropmenu').outerHeight() - window.$j('#chat_emote_dropmenu .emotes-all').outerHeight();
	height = window.$j('#chat_lines').height() - height;
	window.$j('#chat_emote_dropmenu .emotes-all').height(height);
	
	// Adjust the width and position of the popup.
	window.$j('#chat_emote_dropmenu')
		.width(window.$j('#chat_lines').width() - 23)
		.offset(window.$j('#chat_lines').offset());
	
	
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
	// User info.
	userInfo.name = window.PP.login;
	userInfo.displayName = window.PP.display_name;
	(function checkEmoteSets(count) {
		if (count > 20) {
			userInfo.emoteSets = [];
			return;
		}
		if (window.CurrentChat.user_to_emote_sets[userInfo.name] === undefined) {
			setTimeout(function () {
				checkEmoteSets(++count);
			}, 50);
		}
		else {
			userInfo.emoteSets = window.CurrentChat.user_to_emote_sets[userInfo.name];
		}
	})(0);
	userInfo.emoteSets = window.CurrentChat.user_to_emote_sets[userInfo.name] || [];
	
	// Create button element.
	//-----------------------
	var button = document.createElement('a');
	button.id = 'chat_emote_dropmenu_button';
	button.className = 'dropdown_glyph';
	button.innerHTML = '<span>emotes</span>';
	var chatButton = document.querySelector('#chat_speak');
	if (chatButton) {
		chatButton.parentNode.insertBefore(button, chatButton);
		window.$j('#chat_emote_dropmenu_button').hide();
		if (chatButton.classList.contains('cap')) {
			window.$j('#control_input').animate({'margin-right': '175px'});
			window.$j('#control_buttons').css('width', '175px');
			window.$j('#chat_speak').animate({'margin-right': '51px'}, {
				complete: function () {
					window.$j('#chat_speak').css('margin-right', '5px');
					window.$j('#chat_emote_dropmenu_button').css('margin-right', '5px').fadeIn();
				}
			});
		}
		else {
			window.$j(chatButton).css('float', 'right').animate({'width': '128px'}, {
				complete: function () {
					window.$j('#chat_emote_dropmenu_button').fadeIn();
				}
			});
		}
	}
	else {
		// No chat, just exit.
		return;
	}
	
	// Create popup element.
	//----------------------
	var popup = document.createElement('div');
	popup.id = 'chat_emote_dropmenu';
	popup.className = 'dropmenu';
	popup.innerHTML = ''+
		'<h4>Popular <small id="emotes-popularity-reset">reset</small>'+
		'</h4>'+
		'<div class="scroll emotes-popular">'+
		'	<div class="scroll-content emotes-container"></div>'+
		'</div>'+
		'<h4>All</h4>'+
		'<div class="scroll scroll-dark emotes-all">'+
		'	<div class="scroll-content-contain">'+
		'		<div class="scroll-content emotes-container"></div>'+
		'	</div>'+
		'</div>';
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
	var buttonDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAQCAYAAADwMZRfAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAOtJREFUOE+NkLERgzAMRdkgS2QGpvAYqVNRpmMDimyRo2YiVqBz/ncknSTIAXfvwPL/L467WmtgGIYeTGA5gPM+d8ICgdc4jvUM5nzPC3oG5nk+RUR2IpNg43NU+AfzQYLnfvUUCvPsmaSU8lYJjlmxbm9fynPm2WsS/jduqoTfipfkuUja3VDy5EIluqlrJc91zX63bVs4yVVUwn67E3zYnVyFefbsYvHcMFx9IEvzjHn2TCKneaTQDr/HvHZNQrC5+vARIlx9L0hgLxIKv+zKDeZ8L0gIA6CdKMN5FpCw8IhsAou8d+UftfsCjtrm7yD1aJgAAAAASUVORK5CYII=';
	// Add main style.
	addStyle([		
		'#chat_emote_dropmenu_button span {',
		'	background: url("' + buttonDataUrl + '") no-repeat 50% 50%;',
		'	cursor: pointer;',
		'}',
		'#chat_emote_dropmenu {',
		'	padding: 5px 0 5px 5px;',
		'}',
		'#chat_emote_dropmenu h4 small {',
		'	font-size: 70%;',
		'	font-weight: normal;',
		'	margin-left: 10px;',
		'	vertical-align: middle;',
		'	cursor: pointer;',
		'}',
		'#chat_emote_dropmenu .emotes-popular {',
		'	height: 48px;',
		'}',
		'#chat_emote_dropmenu .scroll.emotes-all {',
		'	height: 300px;', // Note: .scroll MUST have a height otherwise scroll bar breaks.
		'}',
		'#chat_emote_dropmenu .scroll-scrollbar .drag-handle {',
		'	opacity: 0.7;',
		'}',
		'#chat_emote_dropmenu .userscript_emoticon {',
		'	display: inline-block;',
		'	padding: 5px;',
		'	margin: 1px;',
		'	cursor: pointer;',
		'	border-radius: 5px;',
		'	text-align: center;',
		'}',
		'#chat_emote_dropmenu .userscript_emoticon .emoticon {',
		'	min-height: 35px;',
		'	min-width: 39px;',
		'	margin: 0 !important;',
		'}',
		'#chat_emote_dropmenu .userscript_emoticon:hover {',
		'	background-color: rgba(255, 255, 255, 0.1);',
		'}',
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
	window.$j('#chat_emote_dropmenu_button').popup(window.$j('#chat_emote_dropmenu'), {
		above: !0
	});
	
	// Repopulate emotes.
	window.$j('#chat_emote_dropmenu_button').on('click', populateEmotes);
	
	// Enable the popularity reset.
	window.$j('#emotes-popularity-reset').on('click', function () {
		emotePopularityClear();
		populateEmotes();
	});
	
	// TODO: Implement customScroll if it doesn't exist (popout/embed do not work).
	// Create custom scroll bar.
	window.$j('#chat_emote_dropmenu .scroll.emotes-all').customScroll();
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
	localStorage.setItem('emote-popularity-tracking', JSON.stringify(emotePopularity));
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
	window.$j('#chat_text_input').click();
	// TODO: Remove legacy localStorage names upon next major version.
	localStorage.removeItem('emote-popularity-tracking');
	localStorage.removeItem('emote-frequency-tracking'); // Legacy
	emotePopularity = false;
	emotePopularityInit();
}

/**
 * Initiates the popularity tracking. This will pull data from storage, or if none exists, set some common defaults.
 */
function emotePopularityInit() {
	if (!emotePopularity) {
		// TODO: Remove legacy localStorage names upon next major version.
		var settings = localStorage.getItem('emote-popularity-tracking') ||
			localStorage.getItem('emote-frequency-tracking'); // Legacy
		if (settings != null) {
			emotePopularity = JSON.parse(settings);
		}
		else {
			emotePopularity = {};
			emotePopularityAdd('BibleThump', 0);
			emotePopularityAdd('DansGame', 0);
			emotePopularityAdd('FailFish', 0);
			emotePopularityAdd('Kappa', 0);
			emotePopularityAdd('Kreygasm', 0);
			emotePopularityAdd('SwiftRage', 0);
		}
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
	// Simulate click to close popup.
	window.$j(element).click();
	
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

})(unsafeWindow || window);
