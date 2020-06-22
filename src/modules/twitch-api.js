var $ = require('jquery');
var cookies = require('browser-cookies');
var logger = require('./logger');
var api = {};

var TWITCH_GRAPHQL_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
var TWITCH_GRAPHQL_ENDPOINT = 'https://gql.twitch.tv/gql';

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

	var query = '\
		query UserEmotes {\
			currentUser {\
				emoteSets {\
					emotes {\
						id,\
						token\
					},\
					id,\
					owner {\
						displayName\
					}\
				}\
			}\
		}\
	';

	$.ajax({
		url: TWITCH_GRAPHQL_ENDPOINT,
		method: 'POST',
		data: JSON.stringify({query: query}),
		dataType: 'json',
		timeout: 30000,
		headers: {
			'Client-ID': TWITCH_GRAPHQL_CLIENT_ID,
			'Authorization': 'OAuth ' + user.authToken
		},
		success: function (data) {
			callback((data.data && data.data.currentUser && data.data.currentUser.emoteSets) || []);
		},
		error: function () {
			callback({});
		}
	});
};

module.exports = api;
