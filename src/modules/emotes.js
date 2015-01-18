var storage = require('./storage');
var logger = require('./logger');
var api = {};
var emoteGetters = {};

api.getEmotes = function () {
	var ember = require('./ember-api');

	var emotes = [];
	var emotesStored = [];

	// Parse the native emotes.
	var raw = ember.get('controller:chat', 'currentRoom.tmiSession._emotesParser.emoticonRegexToIds') || {};
	Object.keys(raw).forEach(function (key) {
		var emote = raw[key];
		emote.url = 'http://static-cdn.jtvnw.net/emoticons/v1/' + emote.id + '/1.0';
		emote.text = emote.isRegex ? getEmoteFromRegEx(key) : key;

		parse(emote, false);
	});

	// Parse the custom emotes provided by third party addons.
	Object.keys(emoteGetters).forEach(function (name) {
		var getterEmotes = null;
		try {
			getterEmotes = emoteGetters[name]();
		}
		catch (err) {
			logger.debug('Emote getter `' + name + '` failed unexpectedly.', err.toString());
			return;
		}

		if (!Array.isArray(getterEmotes)) {
			logger.debug('Emote getter `' + name + '` failed to return a usable array.');
			return;
		}
		getterEmotes.forEach(function (emote) {
			parse(emote, true);
		});
	});

	function parse(emote, isThirdParty) {
		// Ignore emotes that were forced hidden, don't have URLs, or don't have text.
		if (emote.hidden || !emote.url || !emote.text) {
			return;
		}
		var parsed = {}
		parsed.text = emote.text;
		parsed.url = emote.url;
		parsed.channel = emote.channel || api.getChannel(parsed.text);
		parsed.badge = emote.badge || api.getBadge(parsed.channel);
		parsed.hidden = emote.hidden;
		// Determine if emote is from a third-party addon.
		parsed.isThirdParty = isThirdParty;
		// Determine if emote is hidden by user.
		parsed.isVisible = storage.visibility.get('channel-' + parsed.channel, true) && storage.visibility.get(parsed.text, true);
		// Get starred status.
		parsed.isStarred = storage.starred.get(parsed.text, false);
		
		// Override emotes if they've been stored.
		var storedIndex = emotesStored.indexOf(parsed.text);
		if (storedIndex === -1) {
			emotes.push(parsed);
			emotesStored.push(parsed.text);
		}
		else {
			emotes[storedIndex] = parsed;
		}
	}

	return emotes;
};

// Badges.
var badges = {};
api.getBadge = function (channel) {
	if (badges[channel]) {
		return badges[channel];
	}
	return '';
};
api.addBadge = function (channel, badge) {
	badges[channel] = badge;
}

// Channels.
var channels = {};
api.getChannel = function (text) {
	if (channels[text]) {
		return channels[text];
	}
	return '';
};
api.addChannel = function (text, channel) {
	channels[text] = channel;
};

api.init = function () {
	var ember = require('./ember-api');
	var twitchApi = require('./twitch-api');

	logger.debug('Tickets call started.');
	// Get active subscriptions.
	twitchApi.getTickets(function (tickets) {
		logger.debug('Tickets loaded.', tickets);

		tickets.forEach(function (ticket) {
			var product = ticket.product;
			var channel = product.owner_name || product.short_name;
			
			// Get subscriptions with emotes only.
			if (!product.emoticons || !product.emoticons.length) {
				return;
			}

			// Get channels.
			product.emoticons.forEach(function (emote) {
				api.addChannel(getEmoteFromRegEx(emote.regex), channel);
			});

			// Get badges.
			twitchApi.getBadges(channel, function (badges) {
				if (channel === 'turbo') {
					api.addBadge(channel, badges.turbo.image);
				}
				else if (badges.subscriber && badges.subscriber.image) {
					api.addBadge(channel, badges.subscriber.image);
				}
			});

			// Get display name.
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
		});
	});
};

api.registerGetter = function (name, getter) {
	if (typeof name !== 'string') {
		throw new Error('Name must be a string.');
	}
	if (emoteGetters[name]) {
		throw new Error('Getter already exists.');
	}
	if (typeof getter !== 'function') {
		throw new Error('Getter must be a function.');
	}
	logger.debug('Getter registered: ' + name);
	emoteGetters[name] = getter;
};

api.deregisterGetter = function (name) {
	logger.debug('Getter unregistered: ' + name);
	delete emoteGetters[name];
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

/**
 * Gets the emote sets for the currently logged in user.
 * @return {array} The emote sets.
 */
function getEmoteSets() {
	var ember = require('./ember-api');
	var sets = [];
	try {
		sets = ember.get('controller:chat', 'currentRoom.tmiRoom').getEmotes(window.Twitch.user.login());
		sets = sets.filter(function (val) {
			return typeof val === 'number' && val >= 0;
		});

		logger.debug('Emoticon sets retrieved.', sets);
		return sets;
	}
	catch (err) {
		logger.debug('Emote sets failed.', err);
		return [];
	}
}

// Temporary hardcoding of turbo emotes. See issue #72.
api.addChannel('duDudu', 'turbo');
api.addChannel('KappaHD', 'turbo');
api.addChannel('MiniK', 'turbo');
api.addChannel('PraiseIt', 'turbo');
api.addChannel('riPepperonis', 'turbo');

module.exports = api;
