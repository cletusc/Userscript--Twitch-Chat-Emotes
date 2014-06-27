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
		},
		emotePopularity = false,
		isInitiated = false,

		elemChatButton,
		elemChatButtonsContainer,
		elemChatInput,
		elemEmoteButton,
		elemEmoteMenu,

		SCRIPT_NAME = pkg.userscript.name,
		DEBUG = location.hash === '#' + pkg.name + '-debug',
		MESSAGES = {
			ALREADY_RUNNING: 'There is already an instance of this script running, cancelling this instance.',
			NO_CHAT_ELEMENT: 'There is no chat element on the page, unable to continue.',
			NOT_LOGGED_IN: 'You are not logged in, please log in first before using the emote menu.',
			OBJECTS_NOT_LOADED: 'Needed objects haven\'t loaded yet.',
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
		var	loggedIn = window.Twitch && window.Twitch.user.isLoggedIn(),
			routes = window.App && (window.App.ChannelRoute || window.App.ChatRoute),
			objectsLoaded = (
				window.Twitch !== undefined &&
				(
					window.App !== undefined &&
					window.App.__container__ !== undefined &&
					window.App.__container__.lookup('controller:emoticons').get('emoticons') !== undefined &&
					window.App.__container__.lookup('controller:emoticons').get('emoticons').length
				) &&
				window.jQuery !== undefined &&
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
		if (document.querySelector('#emote-menu-for-twitch')) {
			console.warn(MESSAGES.ALREADY_RUNNING);
			return;
		}
		console.log('objectsLoaded: ' + objectsLoaded);
		if (!objectsLoaded || !loggedIn || !routes) {
			// Errors in approximately 102400ms.
			if (time >= 60000) {
				console.error(MESSAGES.TIMEOUT_SCRIPT_LOAD);
				return;
			}
			if (time >= 10000) {
				if (!loggedIn) {
					console.error(MESSAGES.NOT_LOGGED_IN);
					return;
				}
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
		loadjQueryPlugins();

		elemChatButton = $('.send-chat-button');
		elemChatButtonsContainer = $('.chat-buttons-container .chat-option-buttons');
		elemChatInput = $('.chat-interface textarea');

		// No chat, just exit.
		if (!elemChatButton.length) {
			console.warn(MESSAGES.NO_CHAT_ELEMENT);
			return;
		}

		createMenuElements();
		addStyle(templates.styles());
		bindListeners();
		showNews();

		// Get active subscriptions.
		window.Twitch.api.get("/api/users/:login/tickets").done(function (api) {
			debug(api, 'Response from `/api/user/:login/tickets`.', true);
			api.tickets.forEach(function (ticket) {
				// Get subscriptions with emotes.
				if (ticket.product.emoticons && ticket.product.emoticons.length) {
					var badge = ticket.product.features.badge,
						channel = ticket.product.owner_name;
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
		elemEmoteButton = $(templates.emoteButton());
		elemEmoteButton.appendTo(elemChatButtonsContainer);
		elemEmoteButton.hide();

		// Only correct styling for non-BetterTTV.
		if (window.BetterTTV) {
			elemEmoteButton.fadeIn();
		}
		else {
			elemChatButton.animate({'left': '121px'}, {
				complete: function () {
					elemEmoteButton.fadeIn();
				}
			});
		}

		// Create emote menu.
		elemEmoteMenu = $(templates.menu());
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
			if (elemEmoteMenu.is(':visible')) {
				$(this).addClass('active');
				if (elemEmoteMenu.hasClass('not_default_location')) {
					elemEmoteMenu.offset(JSON.parse(elemEmoteMenu.attr('data-offset')));
				}
				else {
					var diff = elemEmoteMenu.height() - elemEmoteMenu.find('#all-emotes-group').height();
					var elemChatLines = $('.chat-messages');

					// Adjust the size and position of the popup.
					elemEmoteMenu.height(elemChatLines.outerHeight() - (elemEmoteMenu.outerHeight() - elemEmoteMenu.height()));
					elemEmoteMenu.width(elemChatLines.outerWidth() - (elemEmoteMenu.outerWidth() - elemEmoteMenu.width()));
					elemEmoteMenu.offset(elemChatLines.offset());
					// Fix `.emotes-all` height.
					elemEmoteMenu.find('#all-emotes-group').height(elemEmoteMenu.height() - diff);
					elemEmoteMenu.find('#all-emotes-group').width(elemEmoteMenu.width());
					// Recalculate any scroll bars.
					elemEmoteMenu.find('.scrollable').customScrollbar('resize');
				}
			}
			else {
				$(this).removeClass('active');
			}
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
			handle: '.draggable',
			start: function () {
				$(this).addClass('has_moved');
				$(this).addClass('not_default_location');
			},
			stop: function () {
				elemEmoteMenu.attr('data-offset', JSON.stringify(elemEmoteMenu.offset()));
			},
			containment: $(document.body)
		});

		elemEmoteMenu.resizable({
			handle: '[data-command="resize-handle"]',
			resize: function () {
				$(this).addClass('has_moved');
				$(this).addClass('not_default_location');
				// Recalculate any scroll bars.
				elemEmoteMenu.find('.scrollable').customScrollbar('resize');
			},
			alsoResize: elemEmoteMenu.find('.scrollable'),
			containment: $(document.body),
			minHeight: 180,
			minWidth: 200
		});

		// Enable the popularity reset.
		elemEmoteMenu.find('[data-command="reset-popularity"]').on('click', function () {
			emotePopularityClear();
			populateEmotesMenu();
		});

		// Enable the popular emotes location changing button.
		elemEmoteMenu.find('[data-command="toggle-popular-emote-location"]').on('click', function () {
			var current = +getSetting('emote-popular-on-top', 0);
			setSetting('emote-popular-on-top', current ? 0 : 1);
			fixPopularEmotesLocation(!current);
		});

		// Enable emote clicking (delegated).
		elemEmoteMenu.on('click', '.emote', function () {
			insertEmoteText($(this).attr('data-emote'));
		});

		elemEmoteMenu.find('.scrollable').customScrollbar({
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

		fixPopularEmotesLocation(+getSetting('emote-popular-on-top', false));
		refreshUsableEmotes();

		// Add popular emotes.
		container = elemEmoteMenu.find('#popular-emotes-group');
		container.html('');
		emotes.usable.sort(sortByPopularity);
		emotes.usable.forEach(function (emote) {
			createEmote(emote, container);
		});

		// Add all emotes.
		container = elemEmoteMenu.find('#all-emotes-group');
		if (container.find('.overview').length) {
			container = container.find('.overview');
		}
		container.html('');
		emotes.usable.sort(sortBySet);
		emotes.usable.forEach(function (emote) {
			createEmote(emote, container, true);
		});

		// Recalculate any scroll bars.
		elemEmoteMenu.find('.scrollable').customScrollbar('resize');

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
			var basicEmotes = [':(', ':)', ':/', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o'];
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

				var channelSort = sortByNormal({text: a.channel}, {text: b.channel}),
					normalSort = sortByNormal(a, b);
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
	 * Moves the popular emotes based on whether it should be on top.
	 * @param  {boolean} onTop Should the popular emotes be on top? `true` = on top, `false` = on bottom.
	 */
	function fixPopularEmotesLocation(onTop) {
		var body = elemEmoteMenu.find('#popular-emotes-group'),
			header = body.prev(),
			all = elemEmoteMenu.find('#all-emotes-group'),
			icon = elemEmoteMenu.find('.icon-popular-emotes-location');
		if (onTop) {
			header.insertBefore(all.prev());
			body.insertBefore(all.prev());
			icon.removeClass('popular-on-bottom');
		}
		else {
			body.insertAfter(all);
			header.insertAfter(all);
			icon.addClass('popular-on-bottom');
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
				if (emotes.subscriptions.emotes[emote.text] && image.url === emotes.subscriptions.emotes[emote.text].url) {
					emote.image = image;
					return true;
				}
			});
			emote.image = emote.image || defaultImage;
			// Fix missing image.html on new layout.
			if (emote.image && !emote.image.html) {
				emote.image.html = '<img src="' + emote.image.url + '">';
			}

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
				if (!emotes.subscriptions.badges[emote.channel] && !elemEmoteMenu.find('.group-header.addon-emotes-header').length) {
					container.append(
						$(templates.emoteGroupHeader({
							isAddonHeader: true
						}))
					);
				}
				if (!elemEmoteMenu.find('.group-header[data-emote-channel="' + emote.channel + '"]').length) {
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
				image: emote.image.html,
				text: emote.text
			}))
		);
	}

	/**
	 * Show latest news.
	 */
	function showNews() {
		var dismissedNews = JSON.parse(getSetting('twitch-chat-emotes:dismissed-news', '[]')),
			cachedNews = JSON.parse(getSetting('twitch-chat-emotes:cached-news', '{}'));
		// Only poll news feed once per day.
		if (DEBUG || Date.now() - getSetting('twitch-chat-emotes:news-date', 0) > 86400000) {
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

	/**
	 * Logs a message only when global `DEBUG` is true.
	 * @param {mixed}   obj                 The object to log.
	 * @param {string}  [description = '']  The message describing the debug.
	 * @param {boolean} [stringify = false] Whether `obj` should be passed through `JSON.stringify`.
	 */
	function debug(obj, description, stringify) {
		if (DEBUG) {
			console.log('[DEBUG][' + (SCRIPT_NAME || 'UNKNOWN SCRIPT') + ']: ' + (description || ''), (stringify ? JSON.stringify(obj) : obj));
		}
	}
