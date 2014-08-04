module.exports = function (filename) {
	var fs = require('fs');
	if (!fs.existsSync(filename)) {
		return false;
	}
	return JSON.parse(fs.readFileSync(filename, 'utf8'));
};
