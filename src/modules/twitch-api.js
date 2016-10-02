var twitchApi = window.Twitch.api;
var jQuery = window.jQuery;
var logger = require('./logger');
var api = {};

api.getBadges = function (username, callback) {
	if (
		[
			'~global',
			'turbo',
			'twitch_prime'
		].indexOf(username) > -1
	) {
		if (!jQuery) {
			callback({});
		}
		// Note: not a documented API endpoint.
		jQuery.getJSON('https://badges.twitch.tv/v1/badges/global/display')
			.done(function (api) {
				var badges = {
					turbo: {
						image: api.badge_sets.turbo.versions['1'].image_url_1x
					},
					premium: {
						image: api.badge_sets.premium.versions['1'].image_url_1x
					}
				};
				callback(badges);
			})
			.fail(function () {
				callback({});
			});
	}
	else {
		twitchApi.get('chat/' + username + '/badges')
			.done(function (api) {
				callback(api);
			})
			.fail(function () {
				callback({});
			});
	}
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
	logger.debug('onEmotesChange called.');
	var ember = require('./ember-api');
	var session = ember.get('controller:chat', 'currentRoom.tmiRoom.session');
	var response = null;

	if (typeof callback !== 'function') {
		throw new Error('`callback` must be a function.');
	}

	// No parser or no emotes loaded yet, try again.
	if (!session) {
		logger.debug('onEmotesChange session missing, trying again.');
		setTimeout(api.onEmotesChange, 100, callback, immediate);
		return;
	}

	// Call the callback immediately on registering.
	if (immediate) {
		response = session.getEmotes();
		if (!response || !response.emoticon_sets) {
			logger.debug('onEmotesChange no emoticon_sets, trying again.');
			setTimeout(api.onEmotesChange, 100, callback, immediate);
			return;
		}

		logger.debug('onEmotesChange callback called immediately.');
		callback(response.emoticon_sets);
	}

	// Listen for the event.
	session._emotesParser.on('emotes_changed', function (response) {
		logger.debug('onEmotesChange callback called while listening.');
		callback(response.emoticon_sets);
	});

	logger.debug('Registered listener for emote changes.');
};

module.exports = api;
