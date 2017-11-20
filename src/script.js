var pkg = require('../package.json');
var publicApi = require('./modules/public-api');
var logger = require('./modules/logger');
var emotes = require('./modules/emotes');
var ui = require('./modules/ui');
var $ = require('jquery');

logger.log('(v'+ pkg.version + ') Initial load on ' + location.href);

// Expose public api.		
if (typeof window.emoteMenu === 'undefined') {		
	window.emoteMenu = publicApi;		
}

// lol this is stupid.. i know
var chatSettingsButton;
setInterval(function () {
	var newChatSettingsButton = $('.chat-input button[data-a-target="chat-settings"]')[0];

	if (newChatSettingsButton && chatSettingsButton !== newChatSettingsButton) {
		chatSettingsButton = newChatSettingsButton;
		activate();
	} else if (!newChatSettingsButton) {
		deactivate();
	}
}, 1000);

function activate() {
	ui.init();
	emotes.init();
}

function deactivate() {
	ui.hideMenu();
}
