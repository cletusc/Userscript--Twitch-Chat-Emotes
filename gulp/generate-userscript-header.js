/**
 * Generates the userscript metadata block.
 * @param  {object} userscript The object containing the userscript data.
 * @param  {object} context    The data used to parse values with mustache. Use {{{yourKey}}} in the data to parse.
 * @return {string}            The finalized metadata block.
 *
 * Example usage:
 * 
 * generateUserscriptHeader({
 *     'name': 'ACME Userscript Maker',
 *     'namespace': 'http://example.com/',
 *     'author': '{{{pkg.author}}}',
 *     'homepage': '{{{pkg.homepage}}}',
 *     'grant': 'none',
 *     'include': [
 *         'http://google.com/*',
 *         'https://google.com/*'
 *     ]
 * }, {
 *     pkg: {
 *         author: 'John Doe',
 *         homepage: 'http://example.com/johndoe'
 *     }
 * });
 * 
 * Example return:
 * 
 * // ==UserScript==
 * // @name ACME Userscript Maker
 * // @namespace http://example.com/
 * // @author John Doe
 * // @homepage http://example.com/johndoe
 * // @grant none
 * // @include http://google.com/*
 * // @include https://google.com/*
 * // ==/UserScript==
 * 
 */

var hogan = require('hogan.js');

function generateUserscriptHeader(userscript, context) {
	var header = [];
	var key = null;
	var data = null;

	header.push('// ==UserScript==');
	for (key in userscript) {
		if (!userscript.hasOwnProperty(key)) {
			continue;
		}

		data = userscript[key];
		if (Array.isArray(data)) {
			data.forEach(function (value) {
				pushLine(key, value);
			});
		}
		else {
			pushLine(key, data);
		}   
	}
	header.push('// ==/UserScript==');

	function pushLine(key, value) {
		header.push('// @' + key + ' ' + hogan.compile(value).render(context));
	}

	return header.join('\n') + '\n\n';
};

module.exports = generateUserscriptHeader;
