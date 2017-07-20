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
		twitchApi.get(
			'chat/' + username + '/badges',
			{api_version: 3}
		)
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
	twitchApi.get(
		'users/' + username,
		{api_version: 3}
	)
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
			unended: true,
			api_version: 3
		}
	)
		.done(function (api) {
			callback(api.tickets || []);
		})
		.fail(function () {
			callback([]);
		});
};

api.getEmotes = function (callback) {
	twitchApi.get(
		'users/:login/emotes',
		{api_version: 3}
	)
		.done(function (response) {
			if (!response || !response.emoticon_sets) {
				logger.debug('getEmotes emoticon_sets empty');
				callback({});
				return;
			}

			callback(response.emoticon_sets);
		})
		.fail(function () {
			logger.debug('getEmotes API call failed');
			callback({});
		});
};

module.exports = api;
