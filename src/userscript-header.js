<% if (_.isObject(pkg.userscript)) {
	var output = [];
	output.push('// ==UserScript==');
	_.forOwn(pkg.userscript, function (val, key) {
		if (_.isArray(val)) {
			_.forEach(val, function (nestedVal) {
				output.push('// @' + key + ' ' + nestedVal);
			});
		}
		else {
			output.push('// @' + key + ' ' + val);
		}
	});
	output.push('// ==/UserScript==');
	output = output.join('\n'); %><%= output %><%
} %>
