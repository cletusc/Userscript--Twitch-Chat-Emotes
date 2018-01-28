/*!
 * Lazy Load - JavaScript plugin for lazy loading images
 *
 * Copyright (c) 2007-2017 Mika Tuupola
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   https://appelsiini.net/projects/lazyload
 *
 * Version: 2.0.0-beta.2
 *
 */

var defaults = {
	src: "data-src",
	srcset: "data-srcset",
	selector: ".lazyload"
};

function LazyLoad(root, options) {
	this.settings = Object.assign(defaults, options || {});
	this.root = root;
	this.images = document.querySelectorAll(this.settings.selector);
	this.observer = null;
	this.init();
}

LazyLoad.prototype.init = function() {
	/* Without observers load everything and bail out early. */
	if (!window.IntersectionObserver) {
		this.loadImages();
		return;
	}

	var self = this;
	var observerConfig = {
		root: this.root,
		rootMargin: "0px",
		threshold: 0
	};

	this.observer = new IntersectionObserver(function(entries) {
		entries.forEach(function (entry) {
			if (entry.isIntersecting) {
				self.observer.unobserve(entry.target);
				var src = entry.target.getAttribute(self.settings.src);
				var srcset = entry.target.getAttribute(self.settings.srcset);
				if ("img" === entry.target.tagName.toLowerCase()) {
					if (src) {
						entry.target.src = src;
					}
					if (srcset) {
						entry.target.srcset = srcset;
					}
				} else {
					entry.target.style.backgroundImage = "url(" + src + ")";
				}
			}
		});
	}, observerConfig);

	this.images.forEach(function (image) {
		self.observer.observe(image);
	});
};

LazyLoad.prototype.loadAndDestroy = function () {
	if (!this.settings) { return; }
	this.loadImages();
	this.destroy();
};

LazyLoad.prototype.loadImages = function () {
	if (!this.settings) { return; }

	var self = this;
	this.images.forEach(function (image) {
		var src = image.getAttribute(self.settings.src);
		var srcset = image.getAttribute(self.settings.srcset);
		if ("img" === image.tagName.toLowerCase()) {
			if (src) {
				image.src = src;
			}
			if (srcset) {
				image.srcset = srcset;
			}
		} else {
			image.style.backgroundImage = "url(" + src + ")";
		}
	});
};

LazyLoad.prototype.destroy = function () {
	if (!this.settings) { return; }
	this.observer.disconnect();
	this.settings = null;
};

module.exports = LazyLoad;
