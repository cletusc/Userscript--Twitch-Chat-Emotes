var Store = require('storage-wrapper');
var storage = {};

// General storage.
storage.global = new Store({
	namespace: 'emote-menu-for-twitch'
});

// Emote popularity storage.
storage.popularity = storage.global.createSubstore('popularity');
// Emote visibility storage.
storage.visibility = storage.global.createSubstore('visibility');

// Migrate old keys.
storage.global.migrate({
	fromNamespace: '',
	fromKey: 'emote-popularity-tracking',
	toKey: '_migrate',
	transform: function (data) {
		try {
			data = JSON.parse(data);
		}
		catch (e) {
			data = {};
		}
		for (var key in data) {
			if (!data.hasOwnProperty(key)) {
				continue;
			}
			storage.popularity.set(key, Number(data[key]));
		}
		return data;
	}
});

module.exports = storage;
