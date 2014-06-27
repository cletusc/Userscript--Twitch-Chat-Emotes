/**
 * These files will be included in the script in the order that they appear in the arrays.
 * You may use globbing patterns in any of the paths.
 */
module.exports = {
	// Javascript files included above all other code, but within our wrapper.
	vendorJS: [
		'node_modules/hogan.js/lib/template.js'
	],
	// Javascript files included only after jQuery is found.
	jQueryPlugins: [
		'node_modules/jquery-custom-scrollbar/jquery.custom-scrollbar.js',
		'src/plugins/*.js'
	],
	// CSS files.
	CSS: [
		'node_modules/jquery-custom-scrollbar/jquery.custom-scrollbar.css',
		'src/styles/style.css'
	],
	templates: [
		'src/templates/*.html',
		'build/styles.css'
	]
};
