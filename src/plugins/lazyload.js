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

function isAlreadyInView(root, el) {
	var rootRect = root.getBoundingClientRect && root.getBoundingClientRect();
	if (!rootRect) return false;

	var elemRect = el.getBoundingClientRect && el.getBoundingClientRect();
	if (!elemRect) return false;

	return elemRect.top > rootRect.top && elemRect.bottom < rootRect.bottom;
}

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

LazyLoad.prototype.init = function () {
	/* Without observers load everything and bail out early. */
	if (!window.IntersectionObserver) {
		this.loadImages();
		return;
	}

	var observerConfig = {
		root: this.root,
		rootMargin: "25px",
		threshold: [0.00, 0.25, 0.50, 0.75, 1.00]
	};

	this.observer = new IntersectionObserver(function(entries) {
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			if (entry.intersectionRatio <= 0) {
				return;
			}

			this.observer.unobserve(entry.target);
			this.loadImage(entry.target);
		}
	}.bind(this), observerConfig);

	for (var i = 0; i < this.images.length; i++) {
		var image = this.images[i];
		this.observer.observe(image);
	}
};

LazyLoad.prototype.loadAndDestroy = function () {
	if (!this.settings) {
		return;
	}
	this.loadImages();
	this.destroy();
};

LazyLoad.prototype.loadImages = function () {
	if (!this.settings) {
		return;
	}

	for (var i = 0; i < this.images.length; i++) {
		var image = this.images[i];
		this.loadImage(image);
	}
};

LazyLoad.prototype.loadVisibleImages = function () {
	for (var i = 0; i < this.images.length; i++) {
		var image = this.images[i];
		if (isAlreadyInView(this.root, image)) {
			this.loadImage(image);
		}
	}
}

LazyLoad.prototype.loadImage = function (image) {
	if (!this.settings) {
		return;
	}

	var src = image.getAttribute(this.settings.src);
	var srcset = image.getAttribute(this.settings.srcset);
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
};

LazyLoad.prototype.destroy = function () {
	if (!this.settings) {
		return;
	}
	if (this.observer) {
		this.observer.disconnect();
	}
	this.settings = null;
};

module.exports = LazyLoad;
