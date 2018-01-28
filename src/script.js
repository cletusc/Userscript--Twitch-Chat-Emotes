var pkg = require('../package.json');
var publicApi = require('./modules/public-api');
var logger = require('./modules/logger');
var emotes = require('./modules/emotes');
var ui = require('./modules/ui');
var $ = require('jquery');

logger.log('(v'+ pkg.version + ') Initial load on ' + location.href);

// init modules
ui.init();
emotes.init();

// Expose public api.		
if (typeof window.emoteMenu === 'undefined') {		
	window.emoteMenu = publicApi;		
}

