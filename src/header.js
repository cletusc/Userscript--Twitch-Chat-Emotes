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
