// This script was generated using an automated build script.
// See project build guide linked at {{pkg.homepage}} for more info.

// Start wrapper.
(function wrapper(window, injectNeeded, undefined) {
	'use strict';

	// Script injection if needed.
	if (injectNeeded) {
		var script = document.createElement('script');
		script.textContent = '(' + wrapper + ')(window, false)';
		document.body.appendChild(script);
		document.body.removeChild(script);
		return;
	}

// Start vendor JS.
{{{vendorJS}}}
// End vendor JS.

	// Template files.
	var templates = (function () {
		// Start templates.
{{{templates}}}
		// End templates.
		
		var data = {};
		var key = null;

		// Convert templates to their shorter "render" form.
		for (key in templates) {
			if (!templates.hasOwnProperty(key)) {
				continue;
			}
			data[key] = render(key);
		}

		// Shortcut the render function. All templates will be passed in as partials by default.
		function render(template) {
			template = templates[template];
			return function (context, partials, indent) {
				return template.render(context, partials || templates, indent);
			};
		}

		return data;
	})();

	// The package.json.
	var pkg = {{{pkgJSON}}};
	var $ = null;
	var jQuery = null;

	// Start script.
{{{script}}}
	// End script.

	function loadjQueryPlugins() {
		$ = jQuery = window.jQuery;

		// Start jQuery plugins.
{{{jQueryPlugins}}}
		// End jQuery plugins.
	}

// End wrapper.
})(this.unsafeWindow || window, window.chrome ? true : false);
