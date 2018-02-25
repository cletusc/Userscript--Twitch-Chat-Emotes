var $ = require('jquery');
var cookies = require('browser-cookies');
var logger = require('./logger');
var api = {};

var TWITCH_API_ENDPOINT = 'https://api.twitch.tv/v5';
var TWITCH_SITE_API_ENDPOINT = 'https://api.twitch.tv/api';

var user;

try {
	user = JSON.parse(decodeURIComponent(cookies.get('twilight-user')));
} catch (_) {
	logger.log('Error grabbing user from cookie');
}

api.getReactInstance = function (element) {
	var key;
	for (key in element) {
		if (key.substr(0, 24) === '__reactInternalInstance$') {
			return element[key];
		}
	}
	return null;
};

api.getUserEmotes = function (callback) {
	if (!user) {
		return callback({});
	}

	$.ajax({
		url: TWITCH_API_ENDPOINT + '/users/' + user.id + '/emotes',
		method: 'GET',
		dataType: 'json',
		timeout: 30000,
		headers: {
			'Authorization': 'OAuth ' + user.authToken
		},
		success: function (data) {
			callback(data.emoticon_sets || {});
		},
		error: function () {
			callback({});
		}
	});
};

api.getEmoteSets = function (callback) {
	if (!user) {
		return callback({});
	}

	$.ajax({
		url: TWITCH_SITE_API_ENDPOINT + '/users/' + user.login + '/tickets?limit=100&with_gift_data=true',
		method: 'GET',
		dataType: 'json',
		timeout: 30000,
		headers: {
			'Authorization': 'OAuth ' + user.authToken
		},
		success: function (data) {
			var setsToChannels = {};

			data.tickets.forEach(function (ticket) {
				var product = ticket.product;
				if (!product || !product.partner_login || !product.features || !product.features.emoticon_set_ids) {
					return;
				}

				product.features.emoticon_set_ids.forEach(function (setId) {
					setsToChannels[setId] = product.partner_login;
				});
			});

			callback(setsToChannels);
		},
		error: function () {
			callback({});
		}
	});
};

module.exports = api;
