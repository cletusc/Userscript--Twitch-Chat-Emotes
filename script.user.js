// ==UserScript==
// @name Twitch Chat Emotes
// @namespace #Cletus
// @version 2.1.3
// @description Adds a button to Twitch that allows you to "click-to-insert" an emote.
// @copyright 2011+, Ryan Chatham <ryan.b.chatham@gmail.com> (https://github.com/cletusc)
// @author Ryan Chatham <ryan.b.chatham@gmail.com> (https://github.com/cletusc)
// @icon http://www.gravatar.com/avatar.php?gravatar_id=6875e83aa6c563790cb2da914aaba8b3&r=PG&s=48&default=identicon
// @license MIT; http://opensource.org/licenses/MIT
// @license CC BY-NC-SA 3.0; http://creativecommons.org/licenses/by-nc-sa/3.0/
// @homepage http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/
// @supportURL https://github.com/cletusc/Userscript--Twitch-Chat-Emotes/issues
// @contributionURL http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/#donate
// @grant none
// @include http://*.twitch.tv/*
// @include https://*.twitch.tv/*
// @exclude http://api.twitch.tv/*
// @exclude https://api.twitch.tv/*
// @exclude http://tmi.twitch.tv/*
// @exclude https://tmi.twitch.tv/*
// @exclude http://*.twitch.tv/*/dashboard
// @exclude https://*.twitch.tv/*/dashboard
// @exclude http://chatdepot.twitch.tv/*
// @exclude https://chatdepot.twitch.tv/*
// @exclude http://im.twitch.tv/*
// @exclude https://im.twitch.tv/*
// @exclude http://platform.twitter.com/*
// @exclude https://platform.twitter.com/*
// @exclude http://www.facebook.com/*
// @exclude https://www.facebook.com/*
// ==/UserScript==

/* Script compiled using build script. Script uses Browserify for CommonJS modules. */

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var pkg = require('../package.json');
var publicApi = require('./modules/public-api');
var ember = require('./modules/ember-api');
var logger = require('./modules/logger');
var emotes = require('./modules/emotes');
var ui = require('./modules/ui');

logger.log('(v'+ pkg.version + ') Initial load on ' + location.href);

// Only enable script if we have the right variables.
//---------------------------------------------------
var initTimer = 0;
(function init(time) {	
	if (!time) {
		time = 0;
	}

	var objectsLoaded = (
		window.Twitch !== undefined &&
		window.jQuery !== undefined &&
		ember.isLoaded()
	);
	if (!objectsLoaded) {
		// Stops trying after 10 minutes.
		if (initTimer >= 600000) {
			logger.log('Taking too long to load, stopping. Refresh the page to try again. (' + initTimer + 'ms)');
			return;
		}

		// Give an update every 10 seconds.
		if (initTimer % 10000) {
			logger.debug('Still waiting for objects to load. (' + initTimer + 'ms)');
		}

		// Bump time up after 1s to reduce possible lag.
		time = time >= 1000 ? 1000 : time + 25;
		initTimer += time;

		setTimeout(init, time, time);
		return;
	}
	
	// Expose public api.
	if (typeof window.emoteMenu === 'undefined') {
		window.emoteMenu = publicApi;
	}

	ember.hook('route:channel', activate, deactivate);
	ember.hook('route:chat', activate, deactivate);

	activate();
})();

function activate() {
	ui.init();
	emotes.init();
}
function deactivate() {
	ui.hideMenu();
}

},{"../package.json":7,"./modules/ember-api":8,"./modules/emotes":9,"./modules/logger":10,"./modules/public-api":11,"./modules/ui":15}],2:[function(require,module,exports){
(function (doc, cssText) {
    var id = "emote-menu-for-twitch-styles";
    var styleEl = doc.getElementById(id);
    if (!styleEl) {
        styleEl = doc.createElement("style");
        styleEl.id = id;
        doc.getElementsByTagName("head")[0].appendChild(styleEl);
    }
    if (styleEl.styleSheet) {
        if (!styleEl.styleSheet.disabled) {
            styleEl.styleSheet.cssText = cssText;
        }
    } else {
        try {
            styleEl.innerHTML = cssText;
        } catch (ignore) {
            styleEl.innerText = cssText;
        }
    }
}(document, "/**\n" +
" * Minified style.\n" +
" * Original filename: \\node_modules\\jquery.scrollbar\\jquery.scrollbar.css\n" +
" */\n" +
".scroll-wrapper{overflow:hidden!important;padding:0!important;position:relative}.scroll-wrapper>.scroll-content{border:none!important;-moz-box-sizing:content-box!important;box-sizing:content-box!important;height:auto;left:0;margin:0;max-height:none!important;max-width:none!important;overflow:scroll!important;padding:0;position:relative!important;top:0;width:auto!important}.scroll-wrapper>.scroll-content::-webkit-scrollbar{height:0;width:0}.scroll-element{display:none}.scroll-element,.scroll-element div{-moz-box-sizing:content-box;box-sizing:content-box}.scroll-element.scroll-x.scroll-scrollx_visible,.scroll-element.scroll-y.scroll-scrolly_visible{display:block}.scroll-element .scroll-arrow,.scroll-element .scroll-bar{cursor:default}.scroll-textarea{border:1px solid #ccc;border-top-color:#999}.scroll-textarea>.scroll-content{overflow:hidden!important}.scroll-textarea>.scroll-content>textarea{border:none!important;-moz-box-sizing:border-box;box-sizing:border-box;height:100%!important;margin:0;max-height:none!important;max-width:none!important;overflow:scroll!important;outline:0;padding:2px;position:relative!important;top:0;width:100%!important}.scroll-textarea>.scroll-content>textarea::-webkit-scrollbar{height:0;width:0}.scrollbar-inner>.scroll-element,.scrollbar-inner>.scroll-element div{border:none;margin:0;padding:0;position:absolute;z-index:10}.scrollbar-inner>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-inner>.scroll-element.scroll-x{bottom:2px;height:8px;left:0;width:100%}.scrollbar-inner>.scroll-element.scroll-y{height:100%;right:2px;top:0;width:8px}.scrollbar-inner>.scroll-element .scroll-element_outer{overflow:hidden}.scrollbar-inner>.scroll-element .scroll-bar,.scrollbar-inner>.scroll-element .scroll-element_outer,.scrollbar-inner>.scroll-element .scroll-element_track{border-radius:8px}.scrollbar-inner>.scroll-element .scroll-bar,.scrollbar-inner>.scroll-element .scroll-element_track{-ms-filter:\"progid:DXImageTransform.Microsoft.Alpha(Opacity=40)\";filter:alpha(opacity=40);opacity:.4}.scrollbar-inner>.scroll-element .scroll-element_track{background-color:#e0e0e0}.scrollbar-inner>.scroll-element .scroll-bar{background-color:#c2c2c2}.scrollbar-inner>.scroll-element.scroll-draggable .scroll-bar,.scrollbar-inner>.scroll-element:hover .scroll-bar{background-color:#919191}.scrollbar-inner>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-12px}.scrollbar-inner>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-12px}.scrollbar-inner>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-12px}.scrollbar-inner>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-12px}.scrollbar-outer>.scroll-element,.scrollbar-outer>.scroll-element div{border:none;margin:0;padding:0;position:absolute;z-index:10}.scrollbar-outer>.scroll-element{background-color:#fff}.scrollbar-outer>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-outer>.scroll-element.scroll-x{bottom:0;height:12px;left:0;width:100%}.scrollbar-outer>.scroll-element.scroll-y{height:100%;right:0;top:0;width:12px}.scrollbar-outer>.scroll-element.scroll-x .scroll-element_outer{height:8px;top:2px}.scrollbar-outer>.scroll-element.scroll-y .scroll-element_outer{left:2px;width:8px}.scrollbar-outer>.scroll-element .scroll-element_outer{overflow:hidden}.scrollbar-outer>.scroll-element .scroll-element_track{background-color:#eee}.scrollbar-outer>.scroll-element .scroll-bar,.scrollbar-outer>.scroll-element .scroll-element_outer,.scrollbar-outer>.scroll-element .scroll-element_track{border-radius:8px}.scrollbar-outer>.scroll-element .scroll-bar{background-color:#d9d9d9}.scrollbar-outer>.scroll-element .scroll-bar:hover{background-color:#c2c2c2}.scrollbar-outer>.scroll-element.scroll-draggable .scroll-bar{background-color:#919191}.scrollbar-outer>.scroll-content.scroll-scrolly_visible{left:-12px;margin-left:12px}.scrollbar-outer>.scroll-content.scroll-scrollx_visible{top:-12px;margin-top:12px}.scrollbar-outer>.scroll-element.scroll-x .scroll-bar{min-width:10px}.scrollbar-outer>.scroll-element.scroll-y .scroll-bar{min-height:10px}.scrollbar-outer>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-14px}.scrollbar-outer>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-14px}.scrollbar-outer>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-14px}.scrollbar-outer>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-14px}.scrollbar-macosx>.scroll-element,.scrollbar-macosx>.scroll-element div{background:0 0;border:none;margin:0;padding:0;position:absolute;z-index:10}.scrollbar-macosx>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-macosx>.scroll-element .scroll-element_track{display:none}.scrollbar-macosx>.scroll-element .scroll-bar{background-color:#6C6E71;display:block;-ms-filter:\"progid:DXImageTransform.Microsoft.Alpha(Opacity=0)\";filter:alpha(opacity=0);opacity:0;border-radius:7px;transition:opacity .2s linear}.scrollbar-macosx:hover>.scroll-element .scroll-bar,.scrollbar-macosx>.scroll-element.scroll-draggable .scroll-bar{-ms-filter:\"progid:DXImageTransform.Microsoft.Alpha(Opacity=70)\";filter:alpha(opacity=70);opacity:.7}.scrollbar-macosx>.scroll-element.scroll-x{bottom:0;height:0;left:0;min-width:100%;overflow:visible;width:100%}.scrollbar-macosx>.scroll-element.scroll-y{height:100%;min-height:100%;right:0;top:0;width:0}.scrollbar-macosx>.scroll-element.scroll-x .scroll-bar{height:7px;min-width:10px;top:-9px}.scrollbar-macosx>.scroll-element.scroll-y .scroll-bar{left:-9px;min-height:10px;width:7px}.scrollbar-macosx>.scroll-element.scroll-x .scroll-element_outer{left:2px}.scrollbar-macosx>.scroll-element.scroll-x .scroll-element_size{left:-4px}.scrollbar-macosx>.scroll-element.scroll-y .scroll-element_outer{top:2px}.scrollbar-macosx>.scroll-element.scroll-y .scroll-element_size{top:-4px}.scrollbar-macosx>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-11px}.scrollbar-macosx>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-11px}.scrollbar-light>.scroll-element,.scrollbar-light>.scroll-element div{border:none;margin:0;overflow:hidden;padding:0;position:absolute;z-index:10}.scrollbar-light>.scroll-element{background-color:#fff}.scrollbar-light>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-light>.scroll-element .scroll-element_outer{border-radius:10px}.scrollbar-light>.scroll-element .scroll-element_size{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDEgMSIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkLXVjZ2ctZ2VuZXJhdGVkIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2RiZGJkYiIgc3RvcC1vcGFjaXR5PSIxIi8+CiAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlOGU4ZTgiIHN0b3Atb3BhY2l0eT0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0idXJsKCNncmFkLXVjZ2ctZ2VuZXJhdGVkKSIgLz4KPC9zdmc+);background:linear-gradient(to right,#dbdbdb 0,#e8e8e8 100%);border-radius:10px}.scrollbar-light>.scroll-element.scroll-x{bottom:0;height:17px;left:0;min-width:100%;width:100%}.scrollbar-light>.scroll-element.scroll-y{height:100%;min-height:100%;right:0;top:0;width:17px}.scrollbar-light>.scroll-element .scroll-bar{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDEgMSIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkLXVjZ2ctZ2VuZXJhdGVkIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZlZmVmZSIgc3RvcC1vcGFjaXR5PSIxIi8+CiAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmNWY1ZjUiIHN0b3Atb3BhY2l0eT0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0idXJsKCNncmFkLXVjZ2ctZ2VuZXJhdGVkKSIgLz4KPC9zdmc+);background:linear-gradient(to right,#fefefe 0,#f5f5f5 100%);border:1px solid #dbdbdb;border-radius:10px}.scrollbar-light>.scroll-content.scroll-scrolly_visible{left:-17px;margin-left:17px}.scrollbar-light>.scroll-content.scroll-scrollx_visible{top:-17px;margin-top:17px}.scrollbar-light>.scroll-element.scroll-x .scroll-bar{height:10px;min-width:10px;top:0}.scrollbar-light>.scroll-element.scroll-y .scroll-bar{left:0;min-height:10px;width:10px}.scrollbar-light>.scroll-element.scroll-x .scroll-element_outer{height:12px;left:2px;top:2px}.scrollbar-light>.scroll-element.scroll-x .scroll-element_size{left:-4px}.scrollbar-light>.scroll-element.scroll-y .scroll-element_outer{left:2px;top:2px;width:12px}.scrollbar-light>.scroll-element.scroll-y .scroll-element_size{top:-4px}.scrollbar-light>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-19px}.scrollbar-light>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-19px}.scrollbar-light>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-19px}.scrollbar-light>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-19px}.scrollbar-rail>.scroll-element,.scrollbar-rail>.scroll-element div{border:none;margin:0;overflow:hidden;padding:0;position:absolute;z-index:10}.scrollbar-rail>.scroll-element{background-color:#fff}.scrollbar-rail>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-rail>.scroll-element .scroll-element_size{background-color:#999;background-color:rgba(0,0,0,.3)}.scrollbar-rail>.scroll-element .scroll-element_outer:hover .scroll-element_size{background-color:#666;background-color:rgba(0,0,0,.5)}.scrollbar-rail>.scroll-element.scroll-x{bottom:0;height:12px;left:0;min-width:100%;padding:3px 0 2px;width:100%}.scrollbar-rail>.scroll-element.scroll-y{height:100%;min-height:100%;padding:0 2px 0 3px;right:0;top:0;width:12px}.scrollbar-rail>.scroll-element .scroll-bar{background-color:#d0b9a0;border-radius:2px;box-shadow:1px 1px 3px rgba(0,0,0,.5)}.scrollbar-rail>.scroll-element .scroll-element_outer:hover .scroll-bar{box-shadow:1px 1px 3px rgba(0,0,0,.6)}.scrollbar-rail>.scroll-content.scroll-scrolly_visible{left:-17px;margin-left:17px}.scrollbar-rail>.scroll-content.scroll-scrollx_visible{margin-top:17px;top:-17px}.scrollbar-rail>.scroll-element.scroll-x .scroll-bar{height:10px;min-width:10px;top:1px}.scrollbar-rail>.scroll-element.scroll-y .scroll-bar{left:1px;min-height:10px;width:10px}.scrollbar-rail>.scroll-element.scroll-x .scroll-element_outer{height:15px;left:5px}.scrollbar-rail>.scroll-element.scroll-x .scroll-element_size{height:2px;left:-10px;top:5px}.scrollbar-rail>.scroll-element.scroll-y .scroll-element_outer{top:5px;width:15px}.scrollbar-rail>.scroll-element.scroll-y .scroll-element_size{left:5px;top:-10px;width:2px}.scrollbar-rail>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-25px}.scrollbar-rail>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-25px}.scrollbar-rail>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-25px}.scrollbar-rail>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-25px}.scrollbar-dynamic>.scroll-element,.scrollbar-dynamic>.scroll-element div{background:0 0;border:none;margin:0;padding:0;position:absolute;z-index:10}.scrollbar-dynamic>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-dynamic>.scroll-element.scroll-x{bottom:2px;height:7px;left:0;min-width:100%;width:100%}.scrollbar-dynamic>.scroll-element.scroll-y{height:100%;min-height:100%;right:2px;top:0;width:7px}.scrollbar-dynamic>.scroll-element .scroll-element_outer{opacity:.3;border-radius:12px}.scrollbar-dynamic>.scroll-element .scroll-element_size{background-color:#ccc;opacity:0;border-radius:12px;transition:opacity .2s}.scrollbar-dynamic>.scroll-element .scroll-bar{background-color:#6c6e71;border-radius:7px}.scrollbar-dynamic>.scroll-element.scroll-x .scroll-bar{bottom:0;height:7px;min-width:24px;top:auto}.scrollbar-dynamic>.scroll-element.scroll-y .scroll-bar{left:auto;min-height:24px;right:0;width:7px}.scrollbar-dynamic>.scroll-element.scroll-x .scroll-element_outer{bottom:0;top:auto;left:2px;transition:height .2s}.scrollbar-dynamic>.scroll-element.scroll-y .scroll-element_outer{left:auto;right:0;top:2px;transition:width .2s}.scrollbar-dynamic>.scroll-element.scroll-x .scroll-element_size{left:-4px}.scrollbar-dynamic>.scroll-element.scroll-y .scroll-element_size{top:-4px}.scrollbar-dynamic>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-11px}.scrollbar-dynamic>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-11px}.scrollbar-dynamic>.scroll-element.scroll-draggable .scroll-element_outer,.scrollbar-dynamic>.scroll-element:hover .scroll-element_outer{overflow:hidden;-ms-filter:\"progid:DXImageTransform.Microsoft.Alpha(Opacity=70)\";filter:alpha(opacity=70);opacity:.7}.scrollbar-dynamic>.scroll-element.scroll-draggable .scroll-element_outer .scroll-element_size,.scrollbar-dynamic>.scroll-element:hover .scroll-element_outer .scroll-element_size{opacity:1}.scrollbar-dynamic>.scroll-element.scroll-draggable .scroll-element_outer .scroll-bar,.scrollbar-dynamic>.scroll-element:hover .scroll-element_outer .scroll-bar{height:100%;width:100%;border-radius:12px}.scrollbar-dynamic>.scroll-element.scroll-x.scroll-draggable .scroll-element_outer,.scrollbar-dynamic>.scroll-element.scroll-x:hover .scroll-element_outer{height:20px;min-height:7px}.scrollbar-dynamic>.scroll-element.scroll-y.scroll-draggable .scroll-element_outer,.scrollbar-dynamic>.scroll-element.scroll-y:hover .scroll-element_outer{min-width:7px;width:20px}.scrollbar-chrome>.scroll-element,.scrollbar-chrome>.scroll-element div{border:none;margin:0;overflow:hidden;padding:0;position:absolute;z-index:10}.scrollbar-chrome>.scroll-element{background-color:#fff}.scrollbar-chrome>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-chrome>.scroll-element .scroll-element_track{background:#f1f1f1;border:1px solid #dbdbdb}.scrollbar-chrome>.scroll-element.scroll-x{bottom:0;height:16px;left:0;min-width:100%;width:100%}.scrollbar-chrome>.scroll-element.scroll-y{height:100%;min-height:100%;right:0;top:0;width:16px}.scrollbar-chrome>.scroll-element .scroll-bar{background-color:#d9d9d9;border:1px solid #bdbdbd;cursor:default;border-radius:2px}.scrollbar-chrome>.scroll-element .scroll-bar:hover{background-color:#c2c2c2;border-color:#a9a9a9}.scrollbar-chrome>.scroll-element.scroll-draggable .scroll-bar{background-color:#919191;border-color:#7e7e7e}.scrollbar-chrome>.scroll-content.scroll-scrolly_visible{left:-16px;margin-left:16px}.scrollbar-chrome>.scroll-content.scroll-scrollx_visible{top:-16px;margin-top:16px}.scrollbar-chrome>.scroll-element.scroll-x .scroll-bar{height:8px;min-width:10px;top:3px}.scrollbar-chrome>.scroll-element.scroll-y .scroll-bar{left:3px;min-height:10px;width:8px}.scrollbar-chrome>.scroll-element.scroll-x .scroll-element_outer{border-left:1px solid #dbdbdb}.scrollbar-chrome>.scroll-element.scroll-x .scroll-element_track{height:14px;left:-3px}.scrollbar-chrome>.scroll-element.scroll-x .scroll-element_size{height:14px;left:-4px}.scrollbar-chrome>.scroll-element.scroll-y .scroll-element_outer{border-top:1px solid #dbdbdb}.scrollbar-chrome>.scroll-element.scroll-y .scroll-element_track{top:-3px;width:14px}.scrollbar-chrome>.scroll-element.scroll-y .scroll-element_size{top:-4px;width:14px}.scrollbar-chrome>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-19px}.scrollbar-chrome>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-19px}.scrollbar-chrome>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-19px}.scrollbar-chrome>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-19px}\n" +
"/**\n" +
" * Minified style.\n" +
" * Original filename: \\src\\styles\\style.css\n" +
" */\n" +
"@-webkit-keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;height:30px;width:30px}#emote-menu-button:focus{box-shadow:none}#emote-menu-button.active{box-shadow:0 0 6px 0 #7d5bbe,inset 0 0 0 1px rgba(100,65,164,.5)}.emote-menu{padding:5px;z-index:1000;display:none;background-color:#202020;position:absolute}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-starred{height:38px}.emote-menu .draggable{background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px)}.emote-menu .header-info{border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center;position:relative}.emote-menu .header-info img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:30px;height:30px;transition:all .25s ease;border:1px solid transparent}.emote-menu.editing .emote{cursor:auto}.emote-menu .emote img{max-width:100%;max-height:100%;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row .emote-container{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;padding:5px 0 2px;margin-top:5px;height:18px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5;background-size:contain!important}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-home{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNjQiDQogICBoZWlnaHQ9IjY0Ig0KICAgdmlld0JveD0iMCAwIDY0IDY0Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhMzAwMSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczI5OTkiIC8+DQo8cGF0aA0KICAgZD0ibSA1Ny4wNjIsMzEuMzk4IGMgMC45MzIsLTEuMDI1IDAuODQyLC0yLjU5NiAtMC4yMDEsLTMuNTA4IEwgMzMuODg0LDcuNzg1IEMgMzIuODQxLDYuODczIDMxLjE2OSw2Ljg5MiAzMC4xNDgsNy44MjggTCA3LjA5MywyOC45NjIgYyAtMS4wMjEsMC45MzYgLTEuMDcxLDIuNTA1IC0wLjExMSwzLjUwMyBsIDAuNTc4LDAuNjAyIGMgMC45NTksMC45OTggMi41MDksMS4xMTcgMy40NiwwLjI2NSBsIDEuNzIzLC0xLjU0MyB2IDIyLjU5IGMgMCwxLjM4NiAxLjEyMywyLjUwOCAyLjUwOCwyLjUwOCBoIDguOTg3IGMgMS4zODUsMCAyLjUwOCwtMS4xMjIgMi41MDgsLTIuNTA4IFYgMzguNTc1IGggMTEuNDYzIHYgMTUuODA0IGMgLTAuMDIsMS4zODUgMC45NzEsMi41MDcgMi4zNTYsMi41MDcgaCA5LjUyNCBjIDEuMzg1LDAgMi41MDgsLTEuMTIyIDIuNTA4LC0yLjUwOCBWIDMyLjEwNyBjIDAsMCAwLjQ3NiwwLjQxNyAxLjA2MywwLjkzMyAwLjU4NiwwLjUxNSAxLjgxNywwLjEwMiAyLjc0OSwtMC45MjQgbCAwLjY1MywtMC43MTggeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) 50% no-repeat}.emote-menu .icon-gear{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMjEuNTkiDQogICBoZWlnaHQ9IjIxLjEzNjk5OSINCiAgIHZpZXdCb3g9IjAgMCAyMS41OSAyMS4xMzciDQogICBpZD0iQ2FwYV8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGEzOSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczM3IiAvPg0KPHBhdGgNCiAgIGQ9Ik0gMTguNjIyLDguMTQ1IDE4LjA3Nyw2Ljg1IGMgMCwwIDEuMjY4LC0yLjg2MSAxLjE1NiwtMi45NzEgTCAxNy41NTQsMi4yNCBDIDE3LjQzOCwyLjEyNyAxNC41NzYsMy40MzMgMTQuNTc2LDMuNDMzIEwgMTMuMjU2LDIuOSBDIDEzLjI1NiwyLjkgMTIuMDksMCAxMS45MywwIEggOS41NjEgQyA5LjM5NiwwIDguMzE3LDIuOTA2IDguMzE3LDIuOTA2IEwgNi45OTksMy40NDEgYyAwLDAgLTIuOTIyLC0xLjI0MiAtMy4wMzQsLTEuMTMxIEwgMi4yODksMy45NTEgQyAyLjE3Myw0LjA2NCAzLjUwNyw2Ljg2NyAzLjUwNyw2Ljg2NyBMIDIuOTYyLDguMTYgQyAyLjk2Miw4LjE2IDAsOS4zMDEgMCw5LjQ1NSB2IDIuMzIyIGMgMCwwLjE2MiAyLjk2OSwxLjIxOSAyLjk2OSwxLjIxOSBsIDAuNTQ1LDEuMjkxIGMgMCwwIC0xLjI2OCwyLjg1OSAtMS4xNTcsMi45NjkgbCAxLjY3OCwxLjY0MyBjIDAuMTE0LDAuMTExIDIuOTc3LC0xLjE5NSAyLjk3NywtMS4xOTUgbCAxLjMyMSwwLjUzNSBjIDAsMCAxLjE2NiwyLjg5OCAxLjMyNywyLjg5OCBoIDIuMzY5IGMgMC4xNjQsMCAxLjI0NCwtMi45MDYgMS4yNDQsLTIuOTA2IGwgMS4zMjIsLTAuNTM1IGMgMCwwIDIuOTE2LDEuMjQyIDMuMDI5LDEuMTMzIGwgMS42NzgsLTEuNjQxIGMgMC4xMTcsLTAuMTE1IC0xLjIyLC0yLjkxNiAtMS4yMiwtMi45MTYgbCAwLjU0NCwtMS4yOTMgYyAwLDAgMi45NjMsLTEuMTQzIDIuOTYzLC0xLjI5OSBWIDkuMzYgQyAyMS41OSw5LjE5OSAxOC42MjIsOC4xNDUgMTguNjIyLDguMTQ1IHogbSAtNC4zNjYsMi40MjMgYyAwLDEuODY3IC0xLjU1MywzLjM4NyAtMy40NjEsMy4zODcgLTEuOTA2LDAgLTMuNDYxLC0xLjUyIC0zLjQ2MSwtMy4zODcgMCwtMS44NjcgMS41NTUsLTMuMzg1IDMuNDYxLC0zLjM4NSAxLjkwOSwwLjAwMSAzLjQ2MSwxLjUxOCAzLjQ2MSwzLjM4NSB6Ig0KICAgaWQ9InBhdGgzIg0KICAgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgLz4NCjxnDQogICBpZD0iZzUiPg0KPC9nPg0KPGcNCiAgIGlkPSJnNyI+DQo8L2c+DQo8Zw0KICAgaWQ9Imc5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzExIj4NCjwvZz4NCjxnDQogICBpZD0iZzEzIj4NCjwvZz4NCjxnDQogICBpZD0iZzE1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzIxIj4NCjwvZz4NCjxnDQogICBpZD0iZzIzIj4NCjwvZz4NCjxnDQogICBpZD0iZzI1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzMxIj4NCjwvZz4NCjxnDQogICBpZD0iZzMzIj4NCjwvZz4NCjwvc3ZnPg0K) 50% no-repeat}.emote-menu.editing .icon-gear{-webkit-animation:spin 4s linear infinite;animation:spin 4s linear infinite}.emote-menu .icon-resize-handle{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgdmlld0JveD0iMCAwIDE2IDE2Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhNDM1NyI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczQzNTUiIC8+DQo8cGF0aA0KICAgZD0iTSAxMy41LDggQyAxMy4yMjUsOCAxMyw4LjIyNCAxMyw4LjUgdiAzLjc5MyBMIDMuNzA3LDMgSCA3LjUgQyA3Ljc3NiwzIDgsMi43NzYgOCwyLjUgOCwyLjIyNCA3Ljc3NiwyIDcuNSwyIGggLTUgTCAyLjMwOSwyLjAzOSAyLjE1LDIuMTQ0IDIuMTQ2LDIuMTQ2IDIuMTQzLDIuMTUyIDIuMDM5LDIuMzA5IDIsMi41IHYgNSBDIDIsNy43NzYgMi4yMjQsOCAyLjUsOCAyLjc3Niw4IDMsNy43NzYgMyw3LjUgViAzLjcwNyBMIDEyLjI5MywxMyBIIDguNSBDIDguMjI0LDEzIDgsMTMuMjI1IDgsMTMuNSA4LDEzLjc3NSA4LjIyNCwxNCA4LjUsMTQgaCA1IGwgMC4xOTEsLTAuMDM5IGMgMC4xMjEsLTAuMDUxIDAuMjIsLTAuMTQ4IDAuMjcsLTAuMjcgTCAxNCwxMy41MDIgViA4LjUgQyAxNCw4LjIyNCAxMy43NzUsOCAxMy41LDggeiINCiAgIGlkPSJwYXRoNDM1MSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) 50% no-repeat;cursor:nwse-resize!important}.emote-menu .icon-pin{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgaWQ9InN2ZzMwMDUiPg0KICA8bWV0YWRhdGENCiAgICAgaWQ9Im1ldGFkYXRhMzAyMyI+DQogICAgPHJkZjpSREY+DQogICAgICA8Y2M6V29yaw0KICAgICAgICAgcmRmOmFib3V0PSIiPg0KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4NCiAgICAgICAgPGRjOnR5cGUNCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4NCiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+DQogICAgICA8L2NjOldvcms+DQogICAgPC9yZGY6UkRGPg0KICA8L21ldGFkYXRhPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczMwMjEiIC8+DQogIDxnDQogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzkzMDc4MiwwLDAsMC43OTMwNzgyLC0yLjE3MDk4NSwtODE0LjY5Mjk5KSINCiAgICAgaWQ9ImczMDA3Ij4NCiAgICA8Zw0KICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTEsMC43MDcxMSwtMC43MDcxMSwwLjcwNzExLDczNy43MDc1NSwyOTUuNDg4MDgpIg0KICAgICAgIGlkPSJnMzAwOSI+DQogICAgICA8Zw0KICAgICAgICAgaWQ9ImczNzU1Ij4NCiAgICAgICAgPHBhdGgNCiAgICAgICAgICAgZD0iTSA5Ljc4MTI1LDAgQyA5LjQ3NDA1NjIsMC42ODkxMTIgOS41MjA2OCwxLjUyMzA4NTMgOS4zMTI1LDIuMTg3NSBMIDQuOTM3NSw2LjU5Mzc1IEMgMy45NTg5NjA4LDYuNDI5NDgzIDIuOTQ3NzU0OCw2LjUzMjc4OTkgMiw2LjgxMjUgTCA1LjAzMTI1LDkuODQzNzUgMC41NjI1LDE0LjMxMjUgMCwxNiBDIDAuNTY5Mjk2MjgsMTUuNzk1NjI2IDEuMTY3NzM3OCwxNS42NDAyMzcgMS43MTg3NSwxNS40MDYyNSBMIDYuMTU2MjUsMTAuOTY4NzUgOS4xODc1LDE0IGMgMC4yNzk2ODIzLC0wLjk0Nzc4MyAwLjM4MzE1MjgsLTEuOTU4OTM3IDAuMjE4NzUsLTIuOTM3NSAxLjUwMDAxMSwtMS40ODk1Nzk4IDMuMDAwMDAxLC0yLjk3OTE1OSA0LjUsLTQuNDY4NzUgMC42MDExMDIsLTAuMDMxMzYxIDEuODIyMTM4LC0wLjA5NjEzNyAyLC0wLjQ2ODc1IEMgMTMuODc5ODkyLDQuMDY5NDgwMyAxMS44NDI4NjUsMi4wMjAyMjgyIDkuNzgxMjUsMCB6Ig0KICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg5MTU5Mzc0LC0wLjg5MTU5Mzc0LDAuODkxNTkzNzQsMC44OTE1OTM3NCwtMi4yNjU1LDEwMzcuMTM0NSkiDQogICAgICAgICAgIGlkPSJwYXRoMzAxMSINCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K) 50% no-repeat;transition:all .25s ease}.emote-menu .icon-pin:hover,.emote-menu.pinned .icon-pin{-webkit-transform:rotate(-45deg);transform:rotate(-45deg);opacity:1}.emote-menu .edit-tool{background-position:50%;background-repeat:no-repeat;background-size:14px;border-radius:4px;border:1px solid #000;cursor:pointer;display:none;height:14px;opacity:.25;position:absolute;transition:all .25s ease;width:14px;z-index:1}.emote-menu .edit-tool:hover,.emote-menu .emote:hover .edit-tool{opacity:1}.emote-menu .edit-visibility{background-color:#00c800;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGE5Ij48cmRmOlJERj48Y2M6V29yaw0KICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQ0KICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz48ZGM6dGl0bGU+PC9kYzp0aXRsZT48L2NjOldvcms+PC9yZGY6UkRGPjwvbWV0YWRhdGE+PGRlZnMNCiAgIGlkPSJkZWZzNyIgLz4NCjxwYXRoDQogICBkPSJNIDk3Ljk2NCw0Ni41NDggQyA5Ny4wOTgsNDUuNTI4IDc2LjQyNywyMS42MDMgNTAsMjEuNjAzIGMgLTI2LjQyNywwIC00Ny4wOTgsMjMuOTI1IC00Ny45NjUsMjQuOTQ2IC0xLjcwMSwyIC0xLjcwMSw0LjkwMiAxMGUtNCw2LjkwMyAwLjg2NiwxLjAyIDIxLjUzNywyNC45NDUgNDcuOTY0LDI0Ljk0NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMiAxLjcwMSwtNC45MDIgLTAuMDAxLC02LjkwMyB6IE0gNTguMDczLDM1Ljk3NSBjIDEuNzc3LC0wLjk3IDQuMjU1LDAuMTQzIDUuNTM0LDIuNDg1IDEuMjc5LDIuMzQzIDAuODc1LDUuMDI5IC0wLjkwMiw1Ljk5OSAtMS43NzcsMC45NzEgLTQuMjU1LC0wLjE0MyAtNS41MzUsLTIuNDg1IC0xLjI3OSwtMi4zNDMgLTAuODc1LC01LjAyOSAwLjkwMywtNS45OTkgeiBNIDUwLDY5LjcyOSBDIDMxLjU0LDY5LjcyOSAxNi4wMDUsNTUuNTUzIDEwLjYyOCw1MCAxNC4yNTksNDYuMjQ5IDIyLjUyNiwzOC41NzEgMzMuMTk1LDMzLjk3OSAzMS4xMTQsMzcuMTQ1IDI5Ljg5NCw0MC45MjggMjkuODk0LDQ1IGMgMCwxMS4xMDQgOS4wMDEsMjAuMTA1IDIwLjEwNSwyMC4xMDUgMTEuMTA0LDAgMjAuMTA2LC05LjAwMSAyMC4xMDYsLTIwLjEwNSAwLC00LjA3MiAtMS4yMTksLTcuODU1IC0zLjMsLTExLjAyMSBDIDc3LjQ3NCwzOC41NzIgODUuNzQxLDQ2LjI1IDg5LjM3Miw1MCA4My45OTUsNTUuNTU1IDY4LjQ2LDY5LjcyOSA1MCw2OS43MjkgeiINCiAgIGlkPSJwYXRoMyIgLz4NCjwvc3ZnPg==)}.emote-menu .edit-starred{background-color:#323232;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNjY2NjY2M7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote>.edit-visibility{bottom:auto;left:auto;right:0;top:0}.emote-menu .emote>.edit-starred{bottom:auto;left:0;right:auto;top:0}.emote-menu .header-info>.edit-tool{margin-left:5px}.emote-menu.editing .edit-tool{display:inline-block}.emote-menu .emote-menu-hidden .edit-visibility{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8zIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGExNSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczEzIiAvPg0KPGcNCiAgIGlkPSJnMyI+DQoJPHBhdGgNCiAgIGQ9Ik0gNzAuMDgyLDQ1LjQ3NSA1MC40NzQsNjUuMDgyIEMgNjEuMTk4LDY0LjgzMSA2OS44MzEsNTYuMTk3IDcwLjA4Miw0NS40NzUgeiINCiAgIGlkPSJwYXRoNSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTcuOTY0LDQ2LjU0OCBjIC0wLjQ1LC0wLjUyOSAtNi4yNDUsLTcuMjMgLTE1LjQwMywtMTMuNTU0IGwgLTYuMiw2LjIgQyA4Mi4zNTEsNDMuMTQ4IDg2LjkyLDQ3LjQ2OSA4OS4zNzIsNTAgODMuOTk1LDU1LjU1NSA2OC40Niw2OS43MjkgNTAsNjkuNzI5IGMgLTEuMzM0LDAgLTIuNjUxLC0wLjA4MiAtMy45NTIsLTAuMjIyIGwgLTcuNDM5LDcuNDM5IGMgMy42MzksMC45MDkgNy40NDksMS40NSAxMS4zOTEsMS40NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMS45OTkgMS43MDEsLTQuOTAxIC0wLjAwMSwtNi45MDIgeiINCiAgIGlkPSJwYXRoNyINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTEuNDExLDE2LjY2IGMgMCwtMC4yNjYgLTAuMTA1LC0wLjUyIC0wLjI5MywtMC43MDcgbCAtNy4wNzEsLTcuMDcgYyAtMC4zOTEsLTAuMzkxIC0xLjAyMywtMC4zOTEgLTEuNDE0LDAgTCA2Ni44MDQsMjQuNzExIEMgNjEuNjAyLDIyLjgxOCA1NS45NDksMjEuNjAzIDUwLDIxLjYwMyBjIC0yNi40MjcsMCAtNDcuMDk4LDIzLjkyNiAtNDcuOTY1LDI0Ljk0NiAtMS43MDEsMiAtMS43MDEsNC45MDIgMTBlLTQsNi45MDMgMC41MTcsMC42MDcgOC4wODMsOS4zNTQgMTkuNzA3LDE2LjMyIEwgOC44ODMsODIuNjMyIEMgOC42OTUsODIuODIgOC41OSw4My4wNzMgOC41OSw4My4zMzkgYyAwLDAuMjY2IDAuMTA1LDAuNTIgMC4yOTMsMC43MDcgbCA3LjA3MSw3LjA3IGMgMC4xOTUsMC4xOTUgMC40NTEsMC4yOTMgMC43MDcsMC4yOTMgMC4yNTYsMCAwLjUxMiwtMC4wOTggMC43MDcsLTAuMjkzIGwgNzMuNzUsLTczLjc1IGMgMC4xODcsLTAuMTg2IDAuMjkzLC0wLjQ0IDAuMjkzLC0wLjcwNiB6IE0gMTAuNjI4LDUwIEMgMTQuMjU5LDQ2LjI0OSAyMi41MjYsMzguNTcxIDMzLjE5NSwzMy45NzkgMzEuMTE0LDM3LjE0NSAyOS44OTQsNDAuOTI4IDI5Ljg5NCw0NSBjIDAsNC42NjUgMS42MDEsOC45NDUgNC4yNywxMi4zNTEgTCAyOC4wNCw2My40NzUgQyAxOS44ODgsNTguOTU1IDEzLjY0OSw1My4xMiAxMC42MjgsNTAgeiINCiAgIGlkPSJwYXRoOSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQo8L2c+DQo8L3N2Zz4NCg==);background-color:red}.emote-menu .emote-menu-starred .edit-starred{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmNjMDA7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote.emote-menu-starred{border-color:rgba(200,200,0,.5)}.emote-menu .emote.emote-menu-hidden{border-color:rgba(255,0,0,.5)}.emote-menu #starred-emotes-group .emote:not(.emote-menu-starred),.emote-menu:not(.editing) .emote-menu-hidden{display:none}.emote-menu:not(.editing) #starred-emotes-group .emote-menu-starred{border-color:transparent}.emote-menu #starred-emotes-group{text-align:center;color:#646464}.emote-menu #starred-emotes-group:empty:before{content:\"Use the edit mode to star an emote!\";position:relative;top:8px}.emote-menu .scrollable{height:calc(100% - 101px);overflow-y:auto}.emote-menu .sticky{position:absolute;bottom:0;width:100%}.emote-menu .emote-menu-inner{position:relative;max-height:100%;height:100%}"));

},{}],3:[function(require,module,exports){
module.exports = (function() {
    var Hogan = require('hogan.js/lib/template.js');
    var templates = {};
    templates['emote'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote");if(t.s(t.f("thirdParty",c,p,1),c,p,0,32,44,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" third-party");});c.pop();}if(!t.s(t.f("isVisible",c,p,1),c,p,1,0,0,"")){t.b(" emote-menu-hidden");};if(t.s(t.f("isStarred",c,p,1),c,p,0,119,138,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" emote-menu-starred");});c.pop();}t.b("\" data-emote=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" title=\"");t.b(t.v(t.f("text",c,p,0)));if(t.s(t.f("thirdParty",c,p,1),c,p,0,206,229,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" (from 3rd party addon)");});c.pop();}t.b("\">\r");t.b("\n" + i);t.b("	<img src=\"");t.b(t.t(t.f("url",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-starred\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-starred\" title=\"Star/unstar emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-visibility\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button button--icon-only float-left\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteGroupHeader'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"group-header\" data-emote-channel=\"");t.b(t.v(t.f("channel",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div class=\"header-info\">\r");t.b("\n" + i);t.b("		<img src=\"");t.b(t.v(t.f("badge",c,p,0)));t.b("\" />\r");t.b("\n" + i);t.b("		");t.b(t.v(t.f("channelDisplayName",c,p,0)));t.b("\r");t.b("\n" + i);t.b("		<div class=\"edit-tool edit-visibility\" data-which=\"channel-");t.b(t.v(t.f("channel",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show current emotes for ");t.b(t.v(t.f("channelDisplayName",c,p,0)));t.b(" (note: new emotes will still show up if they are added)\"></div>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("	<div class=\"emote-container\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['menu'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote-menu\" id=\"emote-menu-for-twitch\">\r");t.b("\n" + i);t.b("	<div class=\"emote-menu-inner\">\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("		<div class=\"draggable\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("		<div class=\"scrollable scrollbar-macosx\">\r");t.b("\n" + i);t.b("			<div class=\"group-container\" id=\"all-emotes-group\"></div>\r");t.b("\n" + i);t.b("		</div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("		<div class=\"sticky\">\r");t.b("\n" + i);t.b("			<div class=\"group-header single-row\" id=\"starred-emotes-group\">\r");t.b("\n" + i);t.b("				<div class=\"header-info\">Favorite Emotes</div>\r");t.b("\n" + i);t.b("				<div class=\"emote-container\"></div>\r");t.b("\n" + i);t.b("			</div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("			<div class=\"footer\">\r");t.b("\n" + i);t.b("				<a class=\"pull-left icon icon-home\" href=\"http://cletusc.github.io/Userscript--Twitch-Chat-Emotes\" target=\"_blank\" title=\"Visit the homepage where you can donate, post a review, or contact the developer\"></a>\r");t.b("\n" + i);t.b("				<a class=\"pull-left icon icon-gear\" data-command=\"toggle-editing\" title=\"Toggle edit mode\"></a>\r");t.b("\n" + i);t.b("				<a class=\"pull-right icon icon-resize-handle\" data-command=\"resize-handle\"></a>\r");t.b("\n" + i);t.b("				<a class=\"pull-right icon icon-pin\" data-command=\"toggle-pinned\" title=\"Pin/unpin the emote menu to the screen\"></a>\r");t.b("\n" + i);t.b("			</div>\r");t.b("\n" + i);t.b("		</div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['newsMessage'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("\r");t.b("\n" + i);t.b("<div class=\"twitch-chat-emotes-news\">\r");t.b("\n" + i);t.b("	[");t.b(t.v(t.f("scriptName",c,p,0)));t.b("] News: ");t.b(t.t(t.f("message",c,p,0)));t.b(" (<a href=\"#\" data-command=\"twitch-chat-emotes:dismiss-news\" data-news-id=\"");t.b(t.v(t.f("id",c,p,0)));t.b("\">Dismiss</a>)\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    return templates;
})();
},{"hogan.js/lib/template.js":4}],4:[function(require,module,exports){
/*
 *  Copyright 2011 Twitter, Inc.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var Hogan = {};

(function (Hogan) {
  Hogan.Template = function (codeObj, text, compiler, options) {
    codeObj = codeObj || {};
    this.r = codeObj.code || this.r;
    this.c = compiler;
    this.options = options || {};
    this.text = text || '';
    this.partials = codeObj.partials || {};
    this.subs = codeObj.subs || {};
    this.buf = '';
  }

  Hogan.Template.prototype = {
    // render: replaced by generated code.
    r: function (context, partials, indent) { return ''; },

    // variable escaping
    v: hoganEscape,

    // triple stache
    t: coerceToString,

    render: function render(context, partials, indent) {
      return this.ri([context], partials || {}, indent);
    },

    // render internal -- a hook for overrides that catches partials too
    ri: function (context, partials, indent) {
      return this.r(context, partials, indent);
    },

    // ensurePartial
    ep: function(symbol, partials) {
      var partial = this.partials[symbol];

      // check to see that if we've instantiated this partial before
      var template = partials[partial.name];
      if (partial.instance && partial.base == template) {
        return partial.instance;
      }

      if (typeof template == 'string') {
        if (!this.c) {
          throw new Error("No compiler available.");
        }
        template = this.c.compile(template, this.options);
      }

      if (!template) {
        return null;
      }

      // We use this to check whether the partials dictionary has changed
      this.partials[symbol].base = template;

      if (partial.subs) {
        // Make sure we consider parent template now
        if (!partials.stackText) partials.stackText = {};
        for (key in partial.subs) {
          if (!partials.stackText[key]) {
            partials.stackText[key] = (this.activeSub !== undefined && partials.stackText[this.activeSub]) ? partials.stackText[this.activeSub] : this.text;
          }
        }
        template = createSpecializedPartial(template, partial.subs, partial.partials,
          this.stackSubs, this.stackPartials, partials.stackText);
      }
      this.partials[symbol].instance = template;

      return template;
    },

    // tries to find a partial in the current scope and render it
    rp: function(symbol, context, partials, indent) {
      var partial = this.ep(symbol, partials);
      if (!partial) {
        return '';
      }

      return partial.ri(context, partials, indent);
    },

    // render a section
    rs: function(context, partials, section) {
      var tail = context[context.length - 1];

      if (!isArray(tail)) {
        section(context, partials, this);
        return;
      }

      for (var i = 0; i < tail.length; i++) {
        context.push(tail[i]);
        section(context, partials, this);
        context.pop();
      }
    },

    // maybe start a section
    s: function(val, ctx, partials, inverted, start, end, tags) {
      var pass;

      if (isArray(val) && val.length === 0) {
        return false;
      }

      if (typeof val == 'function') {
        val = this.ms(val, ctx, partials, inverted, start, end, tags);
      }

      pass = !!val;

      if (!inverted && pass && ctx) {
        ctx.push((typeof val == 'object') ? val : ctx[ctx.length - 1]);
      }

      return pass;
    },

    // find values with dotted names
    d: function(key, ctx, partials, returnFound) {
      var found,
          names = key.split('.'),
          val = this.f(names[0], ctx, partials, returnFound),
          doModelGet = this.options.modelGet,
          cx = null;

      if (key === '.' && isArray(ctx[ctx.length - 2])) {
        val = ctx[ctx.length - 1];
      } else {
        for (var i = 1; i < names.length; i++) {
          found = findInScope(names[i], val, doModelGet);
          if (found !== undefined) {
            cx = val;
            val = found;
          } else {
            val = '';
          }
        }
      }

      if (returnFound && !val) {
        return false;
      }

      if (!returnFound && typeof val == 'function') {
        ctx.push(cx);
        val = this.mv(val, ctx, partials);
        ctx.pop();
      }

      return val;
    },

    // find values with normal names
    f: function(key, ctx, partials, returnFound) {
      var val = false,
          v = null,
          found = false,
          doModelGet = this.options.modelGet;

      for (var i = ctx.length - 1; i >= 0; i--) {
        v = ctx[i];
        val = findInScope(key, v, doModelGet);
        if (val !== undefined) {
          found = true;
          break;
        }
      }

      if (!found) {
        return (returnFound) ? false : "";
      }

      if (!returnFound && typeof val == 'function') {
        val = this.mv(val, ctx, partials);
      }

      return val;
    },

    // higher order templates
    ls: function(func, cx, partials, text, tags) {
      var oldTags = this.options.delimiters;

      this.options.delimiters = tags;
      this.b(this.ct(coerceToString(func.call(cx, text)), cx, partials));
      this.options.delimiters = oldTags;

      return false;
    },

    // compile text
    ct: function(text, cx, partials) {
      if (this.options.disableLambda) {
        throw new Error('Lambda features disabled.');
      }
      return this.c.compile(text, this.options).render(cx, partials);
    },

    // template result buffering
    b: function(s) { this.buf += s; },

    fl: function() { var r = this.buf; this.buf = ''; return r; },

    // method replace section
    ms: function(func, ctx, partials, inverted, start, end, tags) {
      var textSource,
          cx = ctx[ctx.length - 1],
          result = func.call(cx);

      if (typeof result == 'function') {
        if (inverted) {
          return true;
        } else {
          textSource = (this.activeSub && this.subsText && this.subsText[this.activeSub]) ? this.subsText[this.activeSub] : this.text;
          return this.ls(result, cx, partials, textSource.substring(start, end), tags);
        }
      }

      return result;
    },

    // method replace variable
    mv: function(func, ctx, partials) {
      var cx = ctx[ctx.length - 1];
      var result = func.call(cx);

      if (typeof result == 'function') {
        return this.ct(coerceToString(result.call(cx)), cx, partials);
      }

      return result;
    },

    sub: function(name, context, partials, indent) {
      var f = this.subs[name];
      if (f) {
        this.activeSub = name;
        f(context, partials, this, indent);
        this.activeSub = false;
      }
    }

  };

  //Find a key in an object
  function findInScope(key, scope, doModelGet) {
    var val;

    if (scope && typeof scope == 'object') {

      if (scope[key] !== undefined) {
        val = scope[key];

      // try lookup with get for backbone or similar model data
      } else if (doModelGet && scope.get && typeof scope.get == 'function') {
        val = scope.get(key);
      }
    }

    return val;
  }

  function createSpecializedPartial(instance, subs, partials, stackSubs, stackPartials, stackText) {
    function PartialTemplate() {};
    PartialTemplate.prototype = instance;
    function Substitutions() {};
    Substitutions.prototype = instance.subs;
    var key;
    var partial = new PartialTemplate();
    partial.subs = new Substitutions();
    partial.subsText = {};  //hehe. substext.
    partial.buf = '';

    stackSubs = stackSubs || {};
    partial.stackSubs = stackSubs;
    partial.subsText = stackText;
    for (key in subs) {
      if (!stackSubs[key]) stackSubs[key] = subs[key];
    }
    for (key in stackSubs) {
      partial.subs[key] = stackSubs[key];
    }

    stackPartials = stackPartials || {};
    partial.stackPartials = stackPartials;
    for (key in partials) {
      if (!stackPartials[key]) stackPartials[key] = partials[key];
    }
    for (key in stackPartials) {
      partial.partials[key] = stackPartials[key];
    }

    return partial;
  }

  var rAmp = /&/g,
      rLt = /</g,
      rGt = />/g,
      rApos = /\'/g,
      rQuot = /\"/g,
      hChars = /[&<>\"\']/;

  function coerceToString(val) {
    return String((val === null || val === undefined) ? '' : val);
  }

  function hoganEscape(str) {
    str = coerceToString(str);
    return hChars.test(str) ?
      str
        .replace(rAmp, '&amp;')
        .replace(rLt, '&lt;')
        .replace(rGt, '&gt;')
        .replace(rApos, '&#39;')
        .replace(rQuot, '&quot;') :
      str;
  }

  var isArray = Array.isArray || function(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
  };

})(typeof exports !== 'undefined' ? exports : Hogan);

},{}],5:[function(require,module,exports){
/**
 * jQuery CSS Customizable Scrollbar
 *
 * Copyright 2014, Yuriy Khabarov
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * If you found bug, please contact me via email <13real008@gmail.com>
 *
 * @author Yuriy Khabarov aka Gromo
 * @version 0.2.6
 * @url https://github.com/gromo/jquery.scrollbar/
 *
 */
(function(e,t,n){"use strict";function h(t){if(o.webkit&&!t){return{height:0,width:0}}if(!o.data.outer){var n={border:"none","box-sizing":"content-box",height:"200px",margin:"0",padding:"0",width:"200px"};o.data.inner=e("<div>").css(e.extend({},n));o.data.outer=e("<div>").css(e.extend({left:"-1000px",overflow:"scroll",position:"absolute",top:"-1000px"},n)).append(o.data.inner).appendTo("body")}o.data.outer.scrollLeft(1e3).scrollTop(1e3);return{height:Math.ceil(o.data.outer.offset().top-o.data.inner.offset().top||0),width:Math.ceil(o.data.outer.offset().left-o.data.inner.offset().left||0)}}function p(n,r){e(t).on({"blur.scrollbar":function(){e(t).add("body").off(".scrollbar");n&&n()},"dragstart.scrollbar":function(e){e.preventDefault();return false},"mouseup.scrollbar":function(){e(t).add("body").off(".scrollbar");n&&n()}});e("body").on({"selectstart.scrollbar":function(e){e.preventDefault();return false}});r&&r.preventDefault();return false}function d(){var e=h(true);return!(e.height||e.width)}function v(e){var t=e.originalEvent;if(t.axis&&t.axis===t.HORIZONTAL_AXIS)return false;if(t.wheelDeltaX)return false;return true}var r=false;var i=1,s="px";var o={data:{},macosx:n.navigator.platform.toLowerCase().indexOf("mac")!==-1,mobile:/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(n.navigator.userAgent),overlay:null,scroll:null,scrolls:[],webkit:/WebKit/.test(n.navigator.userAgent),log:r?function(t,r){var i=t;if(r&&typeof t!="string"){i=[];e.each(t,function(e,t){i.push('"'+e+'": '+t)});i=i.join(", ")}if(n.console&&n.console.log){n.console.log(i)}else{alert(i)}}:function(){}};var u={autoScrollSize:true,autoUpdate:true,debug:false,disableBodyScroll:false,duration:200,ignoreMobile:true,ignoreOverlay:true,scrollStep:30,showArrows:false,stepScrolling:true,type:"simple",scrollx:null,scrolly:null,onDestroy:null,onInit:null,onScroll:null,onUpdate:null};var a=function(t,r){if(!o.scroll){o.log("Init jQuery Scrollbar v0.2.6");o.overlay=d();o.scroll=h();c();e(n).resize(function(){var e=false;if(o.scroll&&(o.scroll.height||o.scroll.width)){var t=h();if(t.height!=o.scroll.height||t.width!=o.scroll.width){o.scroll=t;e=true}}c(e)})}this.container=t;this.options=e.extend({},u,n.jQueryScrollbarOptions||{});this.scrollTo=null;this.scrollx={};this.scrolly={};this.init(r)};a.prototype={destroy:function(){if(!this.wrapper){return}var n=this.container.scrollLeft();var r=this.container.scrollTop();this.container.insertBefore(this.wrapper).css({height:"",margin:""}).removeClass("scroll-content").removeClass("scroll-scrollx_visible").removeClass("scroll-scrolly_visible").off(".scrollbar").scrollLeft(n).scrollTop(r);this.scrollx.scrollbar.removeClass("scroll-scrollx_visible").find("div").andSelf().off(".scrollbar");this.scrolly.scrollbar.removeClass("scroll-scrolly_visible").find("div").andSelf().off(".scrollbar");this.wrapper.remove();e(t).add("body").off(".scrollbar");if(e.isFunction(this.options.onDestroy))this.options.onDestroy.apply(this,[this.container])},getScrollbar:function(t){var n=this.options["scroll"+t];var r={advanced:'<div class="scroll-element_corner"></div>'+'<div class="scroll-arrow scroll-arrow_less"></div>'+'<div class="scroll-arrow scroll-arrow_more"></div>'+'<div class="scroll-element_outer">'+'    <div class="scroll-element_size"></div>'+'    <div class="scroll-element_inner-wrapper">'+'        <div class="scroll-element_inner scroll-element_track">'+'            <div class="scroll-element_inner-bottom"></div>'+"        </div>"+"    </div>"+'    <div class="scroll-bar">'+'        <div class="scroll-bar_body">'+'            <div class="scroll-bar_body-inner"></div>'+"        </div>"+'        <div class="scroll-bar_bottom"></div>'+'        <div class="scroll-bar_center"></div>'+"    </div>"+"</div>",simple:'<div class="scroll-element_outer">'+'    <div class="scroll-element_size"></div>'+'    <div class="scroll-element_track"></div>'+'    <div class="scroll-bar"></div>'+"</div>"};var i=r[this.options.type]?this.options.type:"advanced";if(n){if(typeof n=="string"){n=e(n).appendTo(this.wrapper)}else{n=e(n)}}else{n=e("<div>").addClass("scroll-element").html(r[i]).appendTo(this.wrapper)}if(this.options.showArrows){n.addClass("scroll-element_arrows_visible")}return n.addClass("scroll-"+t)},init:function(n){var r=this;var u=this.container;var a=this.containerWrapper||u;var f=e.extend(this.options,n||{});var l={x:this.scrollx,y:this.scrolly};var c=this.wrapper;var h={scrollLeft:u.scrollLeft(),scrollTop:u.scrollTop()};if(o.mobile&&f.ignoreMobile||o.overlay&&f.ignoreOverlay||o.macosx&&!o.webkit){return false}if(!c){this.wrapper=c=e("<div>").addClass("scroll-wrapper").addClass(u.attr("class")).css("position",u.css("position")=="absolute"?"absolute":"relative").insertBefore(u).append(u);if(u.is("textarea")){this.containerWrapper=a=e("<div>").insertBefore(u).append(u);c.addClass("scroll-textarea")}a.addClass("scroll-content").css({height:"","margin-bottom":o.scroll.height*-1+s,"margin-right":o.scroll.width*-1+s});u.on("scroll.scrollbar",function(t){if(e.isFunction(f.onScroll)){f.onScroll.call(r,{maxScroll:l.y.maxScrollOffset,scroll:u.scrollTop(),size:l.y.size,visible:l.y.visible},{maxScroll:l.x.maxScrollOffset,scroll:u.scrollLeft(),size:l.x.size,visible:l.x.visible})}l.x.isVisible&&l.x.scroller.css("left",u.scrollLeft()*l.x.kx+s);l.y.isVisible&&l.y.scroller.css("top",u.scrollTop()*l.y.kx+s)});c.on("scroll",function(){c.scrollTop(0).scrollLeft(0)});if(f.disableBodyScroll){var d=function(e){v(e)?l.y.isVisible&&l.y.mousewheel(e):l.x.isVisible&&l.x.mousewheel(e)};c.on({"MozMousePixelScroll.scrollbar":d,"mousewheel.scrollbar":d});if(o.mobile){c.on("touchstart.scrollbar",function(n){var r=n.originalEvent.touches&&n.originalEvent.touches[0]||n;var i={pageX:r.pageX,pageY:r.pageY};var s={left:u.scrollLeft(),top:u.scrollTop()};e(t).on({"touchmove.scrollbar":function(e){var t=e.originalEvent.targetTouches&&e.originalEvent.targetTouches[0]||e;u.scrollLeft(s.left+i.pageX-t.pageX);u.scrollTop(s.top+i.pageY-t.pageY);e.preventDefault()},"touchend.scrollbar":function(){e(t).off(".scrollbar")}})})}}if(e.isFunction(f.onInit))f.onInit.apply(this,[u])}else{a.css({height:"","margin-bottom":o.scroll.height*-1+s,"margin-right":o.scroll.width*-1+s})}e.each(l,function(n,s){var o=null;var a=1;var c=n=="x"?"scrollLeft":"scrollTop";var h=f.scrollStep;var d=function(){var e=u[c]();u[c](e+h);if(a==1&&e+h>=m)e=u[c]();if(a==-1&&e+h<=m)e=u[c]();if(u[c]()==e&&o){o()}};var m=0;if(!s.scrollbar){s.scrollbar=r.getScrollbar(n);s.scroller=s.scrollbar.find(".scroll-bar");s.mousewheel=function(e){if(!s.isVisible||n=="x"&&v(e)){return true}if(n=="y"&&!v(e)){l.x.mousewheel(e);return true}var t=e.originalEvent.wheelDelta*-1||e.originalEvent.detail;var i=s.size-s.visible-s.offset;if(!(m<=0&&t<0||m>=i&&t>0)){m=m+t;if(m<0)m=0;if(m>i)m=i;r.scrollTo=r.scrollTo||{};r.scrollTo[c]=m;setTimeout(function(){if(r.scrollTo){u.stop().animate(r.scrollTo,240,"linear",function(){m=u[c]()});r.scrollTo=null}},1)}e.preventDefault();return false};s.scrollbar.on({"MozMousePixelScroll.scrollbar":s.mousewheel,"mousewheel.scrollbar":s.mousewheel,"mouseenter.scrollbar":function(){m=u[c]()}});s.scrollbar.find(".scroll-arrow, .scroll-element_track").on("mousedown.scrollbar",function(t){if(t.which!=i)return true;a=1;var l={eventOffset:t[n=="x"?"pageX":"pageY"],maxScrollValue:s.size-s.visible-s.offset,scrollbarOffset:s.scroller.offset()[n=="x"?"left":"top"],scrollbarSize:s.scroller[n=="x"?"outerWidth":"outerHeight"]()};var v=0,g=0;if(e(this).hasClass("scroll-arrow")){a=e(this).hasClass("scroll-arrow_more")?1:-1;h=f.scrollStep*a;m=a>0?l.maxScrollValue:0}else{a=l.eventOffset>l.scrollbarOffset+l.scrollbarSize?1:l.eventOffset<l.scrollbarOffset?-1:0;h=Math.round(s.visible*.75)*a;m=l.eventOffset-l.scrollbarOffset-(f.stepScrolling?a==1?l.scrollbarSize:0:Math.round(l.scrollbarSize/2));m=u[c]()+m/s.kx}r.scrollTo=r.scrollTo||{};r.scrollTo[c]=f.stepScrolling?u[c]()+h:m;if(f.stepScrolling){o=function(){m=u[c]();clearInterval(g);clearTimeout(v);v=0;g=0};v=setTimeout(function(){g=setInterval(d,40)},f.duration+100)}setTimeout(function(){if(r.scrollTo){u.animate(r.scrollTo,f.duration);r.scrollTo=null}},1);return p(o,t)});s.scroller.on("mousedown.scrollbar",function(r){if(r.which!=i)return true;var o=r[n=="x"?"pageX":"pageY"];var a=u[c]();s.scrollbar.addClass("scroll-draggable");e(t).on("mousemove.scrollbar",function(e){var t=parseInt((e[n=="x"?"pageX":"pageY"]-o)/s.kx,10);u[c](a+t)});return p(function(){s.scrollbar.removeClass("scroll-draggable");m=u[c]()},r)})}});e.each(l,function(e,t){var n="scroll-scroll"+e+"_visible";var r=e=="x"?l.y:l.x;t.scrollbar.removeClass(n);r.scrollbar.removeClass(n);a.removeClass(n)});e.each(l,function(t,n){e.extend(n,t=="x"?{offset:parseInt(u.css("left"),10)||0,size:u.prop("scrollWidth"),visible:c.width()}:{offset:parseInt(u.css("top"),10)||0,size:u.prop("scrollHeight"),visible:c.height()})});var m=function(t,n){var r="scroll-scroll"+t+"_visible";var i=t=="x"?l.y:l.x;var f=parseInt(u.css(t=="x"?"left":"top"),10)||0;var h=n.size;var p=n.visible+f;n.isVisible=h-p>1;if(n.isVisible){n.scrollbar.addClass(r);i.scrollbar.addClass(r);a.addClass(r)}else{n.scrollbar.removeClass(r);i.scrollbar.removeClass(r);a.removeClass(r)}if(t=="y"&&(n.isVisible||n.size<n.visible)){a.css("height",p+o.scroll.height+s)}if(l.x.size!=u.prop("scrollWidth")||l.y.size!=u.prop("scrollHeight")||l.x.visible!=c.width()||l.y.visible!=c.height()||l.x.offset!=(parseInt(u.css("left"),10)||0)||l.y.offset!=(parseInt(u.css("top"),10)||0)){e.each(l,function(t,n){e.extend(n,t=="x"?{offset:parseInt(u.css("left"),10)||0,size:u.prop("scrollWidth"),visible:c.width()}:{offset:parseInt(u.css("top"),10)||0,size:u.prop("scrollHeight"),visible:c.height()})});m(t=="x"?"y":"x",i)}};e.each(l,m);if(e.isFunction(f.onUpdate))f.onUpdate.apply(this,[u]);e.each(l,function(e,t){var n=e=="x"?"left":"top";var r=e=="x"?"outerWidth":"outerHeight";var i=e=="x"?"width":"height";var o=parseInt(u.css(n),10)||0;var a=t.size;var l=t.visible+o;var c=t.scrollbar.find(".scroll-element_size");c=c[r]()+(parseInt(c.css(n),10)||0);if(f.autoScrollSize){t.scrollbarSize=parseInt(c*l/a,10);t.scroller.css(i,t.scrollbarSize+s)}t.scrollbarSize=t.scroller[r]();t.kx=(c-t.scrollbarSize)/(a-l)||1;t.maxScrollOffset=a-l});u.scrollLeft(h.scrollLeft).scrollTop(h.scrollTop).trigger("scroll")}};e.fn.scrollbar=function(t,n){var r=this;if(t==="get")r=null;this.each(function(){var i=e(this);if(i.hasClass("scroll-wrapper")||i.get(0).nodeName=="body"){return true}var s=i.data("scrollbar");if(s){if(t==="get"){r=s;return false}var u=typeof t=="string"&&s[t]?t:"init";s[u].apply(s,e.isArray(n)?n:[]);if(t==="destroy"){i.removeData("scrollbar");while(e.inArray(s,o.scrolls)>=0)o.scrolls.splice(e.inArray(s,o.scrolls),1)}}else{if(typeof t!="string"){s=new a(i,t);i.data("scrollbar",s);o.scrolls.push(s)}}return true});return r};e.fn.scrollbar.options=u;if(n.angular){(function(e){var t=e.module("jQueryScrollbar",[]);t.directive("jqueryScrollbar",function(){return{link:function(e,t){t.scrollbar(e.options).on("$destroy",function(){t.scrollbar("destroy")})},restring:"AC",scope:{options:"=jqueryScrollbar"}}})})(n.angular)}var f=0,l=0;var c=function(e){var t,n,i,s,u,a,h;for(t=0;t<o.scrolls.length;t++){s=o.scrolls[t];n=s.container;i=s.options;u=s.wrapper;a=s.scrollx;h=s.scrolly;if(e||i.autoUpdate&&u&&u.is(":visible")&&(n.prop("scrollWidth")!=a.size||n.prop("scrollHeight")!=h.size||u.width()!=a.visible||u.height()!=h.visible)){s.init();if(r){o.log({scrollHeight:n.prop("scrollHeight")+":"+s.scrolly.size,scrollWidth:n.prop("scrollWidth")+":"+s.scrollx.size,visibleHeight:u.height()+":"+s.scrolly.visible,visibleWidth:u.width()+":"+s.scrollx.visible},true);l++}}}if(r&&l>10){o.log("Scroll updates exceed 10");c=function(){}}else{clearTimeout(f);f=setTimeout(c,300)}}})(jQuery,document,window);
},{}],6:[function(require,module,exports){
// Storage cache.
var cache = {};
// The store handling expiration of data.
var expiresStore = new Store({
	namespace: '__storage-wrapper:expires'
});

/**
 * Storage wrapper for making routine storage calls super easy.
 * @class Store
 * @constructor
 * @param {object} [options]                     The options for the store. Options not overridden will use the defaults.
 * @param {mixed}  [options.namespace='']        See {{#crossLink "Store/setNamespace"}}Store#setNamespace{{/crossLink}}
 * @param {mixed}  [options.storageType='local'] See {{#crossLink "Store/setStorageType"}}Store#setStorageType{{/crossLink}}
 */
function Store(options) {
	var settings = {
		namespace: '',
		storageType: 'local'
	};

	/**
	 * Sets the storage namespace.
	 * @method setNamespace
	 * @param {string|false|null} namespace The namespace to work under. To use no namespace (e.g. global namespace), pass in `false` or `null` or an empty string.
	 */
	this.setNamespace = function (namespace) {
		var validNamespace = /^[\w-:]+$/;
		// No namespace.
		if (namespace === false || namespace == null || namespace === '') {
			settings.namespace = '';
			return;
		}
		if (typeof namespace !== 'string' || !validNamespace.test(namespace)) {
			throw new Error('Invalid namespace.');
		}
		settings.namespace = namespace;
	};

	/**
	 * Gets the current storage namespace.
	 * @method getNamespace
	 * @return {string} The current namespace.
	 */
	this.getNamespace = function (includeSeparator) {
		if (includeSeparator && settings.namespace !== '') {
			return settings.namespace + ':';
		}
		return settings.namespace;
	}

	/**
	 * Sets the type of storage to use.
	 * @method setStorageType
	 * @param {string} type The type of storage to use. Use `session` for `sessionStorage` and `local` for `localStorage`.
	 */
	this.setStorageType = function (type) {
		if (['session', 'local'].indexOf(type) < 0) {
			throw new Error('Invalid storage type.');
		}
		settings.storageType = type;
	};
	/**
	 * Get the type of storage being used.
	 * @method getStorageType
	 * @return {string} The type of storage being used.
	 */
	this.getStorageType = function () {
		return settings.storageType;
	};

	// Override default settings.
	if (options) {
		for (var key in options) {
			switch (key) {
				case 'namespace':
					this.setNamespace(options[key]);
					break;
				case 'storageType':
					this.setStorageType(options[key]);
					break;
			}
		}
	}
}

/**
 * Gets the actual handler to use
 * @method getStorageHandler
 * @return {mixed} The storage handler.
 */
Store.prototype.getStorageHandler = function () {
	var handlers = {
		'local': localStorage,
		'session': sessionStorage
	};
	return handlers[this.getStorageType()];
}

/**
 * Gets the full storage name for a key, including the namespace, if any.
 * @method getStorageKey
 * @param  {string} key The storage key name.
 * @return {string}     The full storage name that is used by the storage methods.
 */
Store.prototype.getStorageKey = function (key) {
	if (!key || typeof key !== 'string' || key.length < 1) {
		throw new Error('Key must be a string.');
	}
	return this.getNamespace(true) + key;
};

/**
 * Gets a storage item from the current namespace.
 * @method get
 * @param  {string} key          The key that the data can be accessed under.
 * @param  {mixed}  defaultValue The default value to return in case the storage value is not set or `null`.
 * @return {mixed}               The data for the storage.
 */
Store.prototype.get = function (key, defaultValue) {
	// Prevent recursion. Only check expire date if it isn't called from `expiresStore`.
	if (this !== expiresStore) {
		// Check if key is expired.
		var expireDate = expiresStore.get(this.getStorageKey(key));
		if (expireDate !== null && expireDate.getTime() < Date.now()) {
			// Expired, remove it.
			this.remove(key);
			expiresStore.remove(this.getStorageKey(key));
		}
	}

	// Cached, read from memory.
	if (cache[this.getStorageKey(key)] != null) {
		return cache[this.getStorageKey(key)];
	}

	var val = this.getStorageHandler().getItem(this.getStorageKey(key));

	// Value doesn't exist and we have a default, return default.
	if (val === null && typeof defaultValue !== 'undefined') {
		return defaultValue;
	}

	// Only pre-process strings.
	if (typeof val === 'string') {
		// Handle RegExps.
		if (val.indexOf('~RegExp:') === 0) {
			var matches = /^~RegExp:([gim]*?):(.*)/.exec(val);
			val = new RegExp(matches[2], matches[1]);
		}
		// Handle Dates.
		else if (val.indexOf('~Date:') === 0) {
			val = new Date(val.replace(/^~Date:/, ''));
		}
		// Handle numbers.
		else if (val.indexOf('~Number:') === 0) {
			val = parseInt(val.replace(/^~Number:/, ''), 10);
		}
		// Handle booleans.
		else if (val.indexOf('~Boolean:') === 0) {
			val = val.replace(/^~Boolean:/, '') === 'true';
		}
		// Handle objects.
		else if (val.indexOf('~JSON:') === 0) {
			val = val.replace(/^~JSON:/, '');
			// Try parsing it.
			try {
				val = JSON.parse(val);
			}
			// Parsing went wrong (invalid JSON), return default or null.
			catch (e) {
				if (typeof defaultValue !== 'undefined') {
					return defaultValue;
				}
				return null;
			}
		}
	}

	// Return it.
	cache[this.getStorageKey(key)] = val;
	return val;
};

/**
 * Sets a storage item on the current namespace.
 * @method set
 * @param {string}      key       The key that the data can be accessed under.
 * @param {mixed}       val       The value to store. May be the following types of data: `RegExp`, `Date`, `Object`, `String`, `Boolean`, `Number`
 * @param {Date|number} [expires] The date in the future to expire, or relative number of milliseconds from `Date#now` to expire.
 *
 * Note: This converts special data types that normally can't be stored in the following way:
 * 
 * - `RegExp`: prefixed with type, flags stored, and source stored as string.
 * - `Date`: prefixed with type, stored as string using `Date#toString`.
 * - `Object`: prefixed with "JSON" indicator, stored as string using `JSON#stringify`.
 */
Store.prototype.set = function (key, val, expires) {
	var parsedVal = null;
	// Handle RegExps.
	if (val instanceof RegExp) {
		var flags = [
			val.global ? 'g' : '',
			val.ignoreCase ? 'i' : '',
			val.multiline ? 'm' : '',
		].join('');
		parsedVal = '~RegExp:' + flags + ':' + val.source;
	}
	// Handle Dates.
	else if (val instanceof Date) {
		parsedVal = '~Date:' + val.toString();
	}
	// Handle objects.
	else if (val === Object(val)) {
		parsedVal = '~JSON:' + JSON.stringify(val);
	}
	// Handle numbers.
	else if (typeof val === 'number') {
		parsedVal = '~Number:' + val.toString();
	}
	// Handle booleans.
	else if (typeof val === 'boolean') {
		parsedVal = '~Boolean:' + val.toString();
	}
	// Handle strings.
	else if (typeof val === 'string') {
		parsedVal = val;
	}
	// Throw if we don't know what it is.
	else {
		throw new Error('Unable to store this value; wrong value type.');
	}
	// Set expire date if needed.
	if (typeof expires !== 'undefined') {
		// Convert to a relative date.
		if (typeof expires === 'number') {
			expires = new Date(Date.now() + expires);
		}
		// Make sure it is a date.
		if (expires instanceof Date) {
			expiresStore.set(this.getStorageKey(key), expires);
		}
		else {
			throw new Error('Key expire must be a valid date or timestamp.');
		}
	}
	// Save it.
	cache[this.getStorageKey(key)] = val;
	this.getStorageHandler().setItem(this.getStorageKey(key), parsedVal);
};

/**
 * Gets all data for the current namespace.
 * @method getAll
 * @return {object} An object containing all data in the form of `{theKey: theData}` where `theData` is parsed using {{#crossLink "Store/get"}}Store#get{{/crossLink}}.
 */
Store.prototype.getAll = function () {
	var keys = this.listKeys();
	var data = {};
	keys.forEach(function (key) {
		data[key] = this.get(key);
	}, this);
	return data;
};

/**
 * List all keys that are tied to the current namespace.
 * @method listKeys
 * @return {array} The storage keys.
 */
Store.prototype.listKeys = function () {
	var keys = [];
	var key = null;
	var storageLength = this.getStorageHandler().length;
	var prefix = new RegExp('^' + this.getNamespace(true));
	for (var i = 0; i < storageLength; i++) {
		key = this.getStorageHandler().key(i)
		if (prefix.test(key)) {
			keys.push(key.replace(prefix, ''));
		}
	}
	return keys;
};

/**
 * Removes a specific key and data from the current namespace.
 * @method remove
 * @param {string} key The key to remove the data for.
 */
Store.prototype.remove = function (key) {
	cache[this.getStorageKey(key)] = null;
	this.getStorageHandler().removeItem(this.getStorageKey(key));
};

/**
 * Removes all data and keys from the current namespace.
 * @method removeAll
 */
Store.prototype.removeAll = function () {
	this.listKeys().forEach(this.remove, this);
};

/**
 * Removes namespaced items from the cache so your next {{#crossLink "Store/get"}}Store#get{{/crossLink}} will be fresh from the storage.
 * @method freshen
 * @param {string} key The key to remove the cache data for.
 */
Store.prototype.freshen = function (key) {
	var keys = key ? [key] : this.listKeys();
	keys.forEach(function (key) {
		cache[this.getStorageKey(key)] = null;
	}, this);
};

/**
 * Migrate data from a different namespace to current namespace.
 * @method migrate
 * @param {object}   migration                          The migration object.
 * @param {string}   migration.toKey                    The key name under your current namespace the old data should change to.
 * @param {string}   migration.fromNamespace            The old namespace that the old key belongs to.
 * @param {string}   migration.fromKey                  The old key name to migrate from.
 * @param {string}   [migration.fromStorageType]        The storage type to migrate from. Defaults to same type as where you are migrating to.
 * @param {boolean}  [migration.keepOldData=false]      Whether old data should be kept after it has been migrated.
 * @param {boolean}  [migration.overwriteNewData=false] Whether old data should overwrite currently stored data if it exists.
 * @param {function} [migration.transform]              The function to pass the old key data through before migrating.
 * @example
 * 
 *     var Store = require('storage-wrapper');
 *     var store = new Store({
 *         namespace: 'myNewApp'
 *     });
 *
 *     // Migrate from the old app.
 *     store.migrate({
 *         toKey: 'new-key',
 *         fromNamespace: 'myOldApp',
 *         fromKey: 'old-key'
 *     });
 *     
 *     // Migrate from global data. Useful when moving from other storage wrappers or regular ol' `localStorage`.
 *     store.migrate({
 *         toKey: 'other-new-key',
 *         fromNamespace: '',
 *         fromKey: 'other-old-key-on-global'
 *     });
 *     
 *     // Migrate some JSON data that was stored as a string.
 *     store.migrate({
 *         toKey: 'new-json-key',
 *         fromNamespace: 'myOldApp',
 *         fromKey: 'old-json-key',
 *         // Try converting some old JSON data.
 *         transform: function (data) {
 *             try {
 *                 return JSON.parse(data);
 *             }
 *             catch (e) {
 *                 return data;
 *             }
 *         }
 *     });
 */

Store.prototype.migrate = function (migration) {
	// Save our current namespace.
	var toNamespace = this.getNamespace();
	var toStorageType = this.getStorageType();

	// Create a temporary store to avoid changing namespace during actual get/sets.
	var store = new Store({
		namespace: toNamespace,
		storageType: toStorageType
	});

	var data = null;

	// Get data from old namespace.
	store.setNamespace(migration.fromNamespace);
	if (typeof migration.fromStorageType !== 'undefined') {
		store.setStorageType(migration.fromStorageType);
	}
	data = store.get(migration.fromKey);

	// Remove old if needed.
	if (!migration.keepOldData) {
		store.remove(migration.fromKey);
	}
	
	// No data, ignore this migration.
	if (data === null) {
		return;
	}

	// Transform data if needed.
	if (typeof migration.transform === 'function') {
		data = migration.transform(data);
	}
	else if (typeof migration.transform !== 'undefined') {
		throw new Error('Invalid transform callback.');
	}

	// Go back to current namespace.
	store.setNamespace(toNamespace);
	store.setStorageType(toStorageType);

	// Only overwrite new data if it doesn't exist or it's requested.
	if (store.get(migration.toKey) === null || migration.overwriteNewData) {
		store.set(migration.toKey, data);
	}
};

/**
 * Creates a substore that is nested in the current namespace.
 * @method createSubstore
 * @param  {string} namespace The substore's namespace.
 * @return {Store}            The substore.
 * @example
 * 
 *     var Store = require('storage-wrapper');
 *     // Create main store.
 *     var store = new Store({
 *         namespace: 'myapp'
 *     });
 *
 *     // Create substore.
 *     var substore = store.createSubstore('things');
 *     substore.set('foo', 'bar');
 *
 *     substore.get('foo') === store.get('things:foo');
 *     // true
 */
Store.prototype.createSubstore = function (namespace) {
	return new Store({
		namespace: this.getNamespace(true) + namespace,
		storageType: this.getStorageType()
	});
};

module.exports = Store;

},{}],7:[function(require,module,exports){
module.exports={
  "name": "twitch-chat-emotes",
  "version": "2.1.3",
  "homepage": "http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/",
  "bugs": "https://github.com/cletusc/Userscript--Twitch-Chat-Emotes/issues",
  "author": "Ryan Chatham <ryan.b.chatham@gmail.com> (https://github.com/cletusc)",
  "repository": {
    "type": "git",
    "url": "https://github.com/cletusc/Userscript--Twitch-Chat-Emotes.git"
  },
  "userscript": {
    "name": "Twitch Chat Emotes",
    "namespace": "#Cletus",
    "version": "{{{pkg.version}}}",
    "description": "Adds a button to Twitch that allows you to \"click-to-insert\" an emote.",
    "copyright": "2011+, {{{pkg.author}}}",
    "author": "{{{pkg.author}}}",
    "icon": "http://www.gravatar.com/avatar.php?gravatar_id=6875e83aa6c563790cb2da914aaba8b3&r=PG&s=48&default=identicon",
    "license": [
      "MIT; http://opensource.org/licenses/MIT",
      "CC BY-NC-SA 3.0; http://creativecommons.org/licenses/by-nc-sa/3.0/"
    ],
    "homepage": "{{{pkg.homepage}}}",
    "supportURL": "{{{pkg.bugs}}}",
    "contributionURL": "http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/#donate",
    "grant": "none",
    "include": [
      "http://*.twitch.tv/*",
      "https://*.twitch.tv/*"
    ],
    "exclude": [
      "http://api.twitch.tv/*",
      "https://api.twitch.tv/*",
      "http://tmi.twitch.tv/*",
      "https://tmi.twitch.tv/*",
      "http://*.twitch.tv/*/dashboard",
      "https://*.twitch.tv/*/dashboard",
      "http://chatdepot.twitch.tv/*",
      "https://chatdepot.twitch.tv/*",
      "http://im.twitch.tv/*",
      "https://im.twitch.tv/*",
      "http://platform.twitter.com/*",
      "https://platform.twitter.com/*",
      "http://www.facebook.com/*",
      "https://www.facebook.com/*"
    ]
  },
  "devDependencies": {
    "browser-sync": "^1.3.2",
    "browserify": "^5.9.1",
    "generate-userscript-header": "^1.0.0",
    "gulp": "^3.8.3",
    "gulp-autoprefixer": "0.0.8",
    "gulp-beautify": "1.1.0",
    "gulp-changed": "^0.4.1",
    "gulp-concat": "^2.2.0",
    "gulp-conflict": "^0.1.2",
    "gulp-css-base64": "^1.1.0",
    "gulp-css2js": "^1.0.2",
    "gulp-header": "^1.0.2",
    "gulp-hogan-compile": "^0.2.1",
    "gulp-minify-css": "^0.3.5",
    "gulp-notify": "^1.4.1",
    "gulp-rename": "^1.2.0",
    "gulp-uglify": "^0.3.1",
    "gulp-util": "^3.0.0",
    "hogan.js": "^3.0.2",
    "jquery-ui": "^1.10.5",
    "jquery.scrollbar": "^0.2.7",
    "pretty-hrtime": "^0.2.1",
    "storage-wrapper": "cletusc/storage-wrapper#v0.1.1",
    "vinyl-map": "^1.0.1",
    "vinyl-source-stream": "^0.1.1",
    "watchify": "^1.0.1"
  }
}

},{}],8:[function(require,module,exports){
var logger = require('./logger');
var api = {};
var ember = null;
var hookedFactories = {};

api.getEmber = function () {
	if (ember) {
		return ember;
	}
	if (window.App && window.App.__container__) {
		ember = window.App.__container__;
		return ember;
	}
	return false;
};

api.isLoaded = function () {
	return Boolean(api.getEmber());
};

api.lookup = function (lookupFactory) {
	if (!api.isLoaded()) {
		logger.debug('Factory lookup failure, Ember not loaded.');
		return false;
	}
	return api.getEmber().lookup(lookupFactory);
};

api.hook = function (lookupFactory, activateCb, deactivateCb) {
	if (!api.isLoaded()) {
		logger.debug('Factory hook failure, Ember not loaded.');
		return false;
	}
	if (hookedFactories[lookupFactory]) {
		logger.debug('Factory already hooked: ' + lookupFactory);
		return true;
	}
	var reopenOptions = {};
	var factory = api.lookup(lookupFactory);

	if (!factory) {
		logger.debug('Factory hook failure, factory not found: ' + lookupFactory);
		return false;
	}

	if (activateCb) {
		reopenOptions.activate = function () {
			this._super();
			activateCb.call(this);
			logger.debug('Hook run on activate: ' + lookupFactory);
		};
	}
	if (deactivateCb) {
		reopenOptions.deactivate = function () {
			this._super();
			deactivateCb.call(this);
			logger.debug('Hook run on deactivate: ' + lookupFactory);
		};
	}

	try {
		factory.reopen(reopenOptions);
		hookedFactories[lookupFactory] = true;
		logger.debug('Factory hooked: ' + lookupFactory);
		return true;
	}
	catch (err) {
		logger.debug('Factory hook failure, unexpected error: ' + lookupFactory);
		logger.debug(err);
		return false;
	}
};

api.get = function (lookupFactory, property) {
	if (!api.isLoaded()) {
		logger.debug('Factory get failure, Ember not loaded.');
		return false;
	}
	var properties = property.split('.');
	var getter = api.lookup(lookupFactory);

	properties.some(function (property) {
		// If getter fails, just exit, otherwise, keep looping.
		if (typeof getter.get === 'function' && typeof getter.get(property) !== 'undefined') {
			getter = getter.get(property);
		}
		else if (typeof getter[property] !== 'undefined') {
			getter = getter[property];
		}
		else {
			getter = null;
			return true;
		}
	});

	return getter;
};

module.exports = api;

},{"./logger":10}],9:[function(require,module,exports){
var storage = require('./storage');
var logger = require('./logger');
var ui = require('./ui');
var api = {};
var emoteStore = new EmoteStore();
var $ = window.jQuery;

/**
 * The entire emote storing system.
 */
function EmoteStore() {
	var getters = {};
	var nativeEmotes = {};
	var hasInitialized = false;

	/**
	 * Get a list of usable emoticons.
	 * @param  {function} [filters]       A filter method to limit what emotes are returned. Passed to Array#filter.
	 * @param  {function|string} [sortBy] How the emotes should be sorted. `function` will be passed to sort via Array#sort. `'channel'` sorts by channel name, globals first. All other values (or omitted) sort alphanumerically.
	 * @param  {string} [returnType]      `'object'` will return in object format, e.g. `{'Kappa': Emote(...), ...}`. All other values (or omitted) return an array format, e.g. `[Emote(...), ...]`.
	 * @return {object|array}             See `returnType` param.
	 */
	this.getEmotes = function (filters, sortBy, returnType) {
		var twitchApi = require('./twitch-api');

		// Get native emotes.
		var emotes = $.extend({}, nativeEmotes);

		// Parse the custom emotes provided by third party addons.
		Object.keys(getters).forEach(function (getterName) {
			// Try the getter.
			var results = null;
			try {
				results = getters[getterName]();
			}
			catch (err) {
				logger.debug('Emote getter `' + getterName + '` failed unexpectedly, skipping.', err.toString());
				return;
			}
			if (!Array.isArray(results)) {
				logger.debug('Emote getter `' + getterName + '` must return an array, skipping.');
				return;
			}

			// Override natives and previous getters.
			results.forEach(function (emote) {
				try {
					// Create the emote.
					var instance = new Emote(emote);

					// Force the getter.
					instance.setGetterName(getterName);

					// Force emotes without channels to the getter's name.
					if (!emote.channel) {
						instance.setChannelName(getterName);
					}

					// Add/override it.
					emotes[instance.getText()] = instance;
				}
				catch (err) {
					logger.debug('Emote parsing for getter `' + getterName + '` failed, skipping.', err.toString(), emote);
				}
			});
		});

		// Covert to array.
		emotes = Object.keys(emotes).map(function (emote) {
			return emotes[emote];
		});

		// Filter results.
		if (typeof filters === 'function') {
			emotes = emotes.filter(filters);
		}
		
		// Return as an object if requested.
		if (returnType === 'object') {
			var asObject = {};
			emotes.forEach(function (emote) {
				asObject[emote.getText()] = emote;
			});
			return asObject;
		}

		// Sort results.
		if (typeof sortBy === 'function') {
			emotes.sort(sortBy);
		}
		else if (sortBy === 'channel') {
			emotes.sort(sorting.allEmotesCategory);
		}
		else {
			emotes.sort(sorting.byText);
		}

		// Return the emotes in array format.
		return emotes;
	};

	/**
	 * Registers a 3rd party emote hook.
	 * @param  {string} name   The name of the 3rd party registering the hook.
	 * @param  {function} getter The function called when looking for emotes. Must return an array of emote objects, e.g. `[emote, ...]`. See Emote class.
	 */
	this.registerGetter = function (name, getter) {
		if (typeof name !== 'string') {
			throw new Error('Name must be a string.');
		}
		if (getters[name]) {
			throw new Error('Getter already exists.');
		}
		if (typeof getter !== 'function') {
			throw new Error('Getter must be a function.');
		}
		logger.debug('Getter registered: ' + name);
		getters[name] = getter;
		ui.updateEmotes();
	};

	/**
	 * Registers a 3rd party emote hook.
	 * @param  {string} name   The name of the 3rd party hook to deregister.
	 */
	this.deregisterGetter = function (name) {
		logger.debug('Getter unregistered: ' + name);
		delete getters[name];
		ui.updateEmotes();
	};

	/**
	 * Initializes the raw data from the API endpoints. Should be called at load and/or whenever the API may have changed. Populates internal objects with updated data.
	 */
	this.init = function () {
		if (hasInitialized) {
			logger.debug('Already initialized EmoteStore, stopping init.');
			return;
		}

		logger.debug('Starting initialization.');

		var twitchApi = require('./twitch-api');
		var self = this;

		// Hash of emote set to forced channel.
		var forcedSetsToChannels = {
			// Globals.
			0: '~global',
			// Bubble emotes.
			33: 'turbo',
			// Monkey emotes.
			42: 'turbo',
			// Hidden turbo emotes.
			457: 'turbo',
			793: 'turbo',
			19151: 'twitch_prime',
			19194: 'twitch_prime'

		};

		logger.debug('Initializing emote set change listener.');

		twitchApi.onEmotesChange(function (emoteSets) {
			logger.debug('Parsing emote sets.');

			Object.keys(emoteSets).forEach(function (set) {
				var emotes = emoteSets[set];
				set = Number(set);
				emotes.forEach(function (emote) {
					// Set some required info.
					emote.url = '//static-cdn.jtvnw.net/emoticons/v1/' + emote.id + '/1.0';
					emote.text = getEmoteFromRegEx(emote.code);
					emote.set = set;

					// Hardcode the channels of certain sets.
					if (forcedSetsToChannels[set]) {
						emote.channel = forcedSetsToChannels[set];
					}

					var instance = new Emote(emote);

					// Save the emote for use later.
					nativeEmotes[emote.text] = instance;
				});
			});

			logger.debug('Loading subscription data.');

			// Get active subscriptions to find the channels.
			twitchApi.getTickets(function (tickets) {
				// Instances from each channel to preload channel data.
				var deferredChannelGets = {};

				logger.debug('Tickets loaded from the API.', tickets);
				tickets.forEach(function (ticket) {
					var product = ticket.product;
					var channel = product.owner_name || product.short_name;

					// Get subscriptions with emotes only.
					if (!product.emoticons || !product.emoticons.length) {
						return;
					}
					
					// Set the channel on the emotes.
					product.emoticons.forEach(function (emote) {
						var instance = nativeEmotes[getEmoteFromRegEx(emote.regex)];
						instance.setChannelName(channel);

						// Save instance for later, but only one instance per channel.
						if (!deferredChannelGets[channel]) {
							deferredChannelGets[channel] = instance;
						}
					});
				});

				// Preload channel data.
				Object.keys(deferredChannelGets).forEach(function (key) {
					var instance = deferredChannelGets[key];
					instance.getChannelBadge();
					instance.getChannelDisplayName();
				});
				ui.updateEmotes();
			});
			ui.updateEmotes();
		}, true);

		hasInitialized = true;
		logger.debug('Finished EmoteStore initialization.');
	};
};

/**
 * Gets a specific emote, if available.
 * @param  {string}     text The text of the emote to get.
 * @return {Emote|null}      The Emote instance of the emote or `null` if it couldn't be found.
 */
EmoteStore.prototype.getEmote = function (text) {
	return this.getEmotes(null, null, 'object')[text] || null;
};

/**
 * Emote object.
 * @param {object} details              Object describing the emote.
 * @param {string} details.text         The text to use in the chat box when emote is clicked.
 * @param {string} details.url          The URL of the image for the emote.
 * @param {string} [details.badge]      The URL of the badge for the emote.
 * @param {string} [details.channel]    The channel the emote should be categorized under.
 * @param {string} [details.getterName] The 3rd party getter that registered the emote. Used internally only.
 */
function Emote(details) {
	var text = null;
	var url = null;
	var getterName = null;
	var channel = {
		name: null,
		displayName: null,
		badge: null
	};

	/**
	 * Gets the text of the emote.
	 * @return {string} The emote text.
	 */
	this.getText = function () {
		return text;
	};

	/**
	 * Sets the text of the emote.
	 * @param {string} theText The text to set.
	 */
	this.setText = function (theText) {
		if (typeof theText !== 'string' || theText.length < 1) {
			throw new Error('Invalid text');
		}
		text = theText;
	};

	/**
	 * Gets the getter name this emote belongs to.
	 * @return {string} The getter's name.
	 */
	this.getGetterName = function () {
		return getterName;
	};

	/**
	 * Sets the getter name this emote belongs to.
	 * @param {string} theGetterName The getter's name.
	 */
	this.setGetterName = function (theGetterName) {
		if (typeof theGetterName !== 'string' || theGetterName.length < 1) {
			throw new Error('Invalid getter name');
		}
		getterName = theGetterName;
	};

	/**
	 * Gets the emote's image URL.
	 * @return {string} The emote image URL.
	 */
	this.getUrl = function () {
		return url;
	};
	/**
	 * Sets the emote's image URL.
	 * @param {string} theUrl The image URL to set.
	 */
	this.setUrl = function (theUrl) {
		if (typeof theUrl !== 'string' || theUrl.length < 1) {
			throw new Error('Invalid URL');
		}
		url = theUrl;
	};

	/**
	 * Gets the emote's channel name.
	 * @return {string} The emote's channel or an empty string if it doesn't have one.
	 */
	this.getChannelName = function () {
		if (!channel.name) {
			channel.name = storage.channelNames.get(this.getText());
		}
		return channel.name || '';
	};
	/**
	 * Sets the emote's channel name.
	 * @param {string} theChannel The channel name to set.
	 */
	this.setChannelName = function (theChannel) {
		if (typeof theChannel !== 'string' || theChannel.length < 1) {
			throw new Error('Invalid channel');
		}

		// Only save the channel to storage if it's dynamic.
		if (theChannel !== '~global' && theChannel !== 'turbo' && theChannel !== 'twitch_prime') {
			storage.channelNames.set(this.getText(), theChannel);
		}
		channel.name = theChannel;
	};

	/**
	 * Gets the emote channel's badge image URL.
	 * @return {string|null} The URL of the badge image for the emote's channel or `null` if it doesn't have a channel.
	 */
	this.getChannelBadge = function () {
		var twitchApi = require('./twitch-api');
		var channelName = this.getChannelName();
		var defaultBadge = '//static-cdn.jtvnw.net/jtv_user_pictures/subscriber-star.png';

		// No channel.
		if (!channelName) {
			return null;
		}

		// Give globals a default badge.
		if (channelName === '~global') {
			return '/favicon.ico';
		}

		// Already have one preset.
		if (channel.badge) {
			return channel.badge;
		}

		// Check storage.
		channel.badge = storage.badges.get(channelName);
		if (channel.badge !== null) {
			return channel.badge;
		}

		// Set default until API returns something.
		channel.badge = defaultBadge;

		// Get from API.
		logger.debug('Getting fresh badge for: ' + channelName);
		twitchApi.getBadges(channelName, function (badges) {
			var badge = null;

			// Save turbo badge while we are here.
			if (badges.turbo && badges.turbo.image) {
				badge = badges.turbo.image;
				storage.badges.set('turbo', badge, 86400000);

				// Turbo is actually what we wanted, so we are done.
				if (channelName === 'turbo') {
					channel.badge = badge;
					return;
				}
			}

			// Save turbo badge while we are here.
			if (badges.premium && badges.premium.image) {
				badge = badges.premium.image;
				storage.badges.set('twitch_prime', badge, 86400000);

				// Turbo is actually what we wanted, so we are done.
				if (channelName === 'twitch_prime') {
					channel.badge = badge;
					return;
				}
			}

			// Save subscriber badge in storage.
			if (badges.subscriber && badges.subscriber.image) {
				channel.badge = badges.subscriber.image;
				storage.badges.set(channelName, channel.badge, 86400000);
				ui.updateEmotes();
			}
			// No subscriber badge.
			else {
				channel.badge = defaultBadge;
				logger.debug('Failed to get subscriber badge for: ' + channelName);
			}
		});
		
		return channel.badge || defaultBadge;
	};

	/**
	 * Sets the emote's channel badge image URL.
	 * @param {string} theBadge The badge image URL to set.
	 */
	this.setChannelBadge = function (theBadge) {
		if (typeof theBadge !== 'string' || theBadge.length < 1) {
			throw new Error('Invalid badge');
		}
		channel.badge = theBadge;
	};

	/**
	 * Get a channel's display name.
	 * @return {string} The channel's display name. May be equivalent to the channel the first time the API needs to be called.
	 */
	this.getChannelDisplayName = function () {
		var twitchApi = require('./twitch-api');
		var channelName = this.getChannelName();
		var self = this;

		var forcedChannelToDisplayNames = {
			'~global': 'Global',
			'turbo': 'Twitch Turbo',
			'twitch_prime': 'Twitch Prime'
		};

		// No channel.
		if (!channelName) {
			return '';
		}

		// Forced display name.
		if (forcedChannelToDisplayNames[channelName]) {
			return forcedChannelToDisplayNames[channelName];
		}

		// Already have one preset.
		if (channel.displayName) {
			return channel.displayName;
		}

		// Look for obvious bad channel names that shouldn't hit the API or storage. Use channel name instead.
		if (/[^a-z0-9_]/.test(channelName)) {
			logger.debug('Unable to get display name due to obvious non-standard channel name for: ' + channelName);
			return channelName;
		}

		// Check storage.
		channel.displayName = storage.displayNames.get(channelName);
		if (channel.displayName !== null) {
			return channel.displayName;
		}
		// Get from API.
		else {
			// Set default until API returns something.
			channel.displayName = channelName;

			logger.debug('Getting fresh display name for: ' + channelName);
			twitchApi.getUser(channelName, function (user) {
				if (!user || !user.display_name) {
					logger.debug('Failed to get display name for: ' + channelName);
					return;
				}

				// Save it.
				self.setChannelDisplayName(user.display_name);
				ui.updateEmotes();
			});
		}
		
		return channel.displayName;
	};

	/**
	 * Sets the emote's channel badge image URL.
	 * @param {string} theBadge The badge image URL to set.
	 */
	this.setChannelDisplayName = function (displayName) {
		if (typeof displayName !== 'string' || displayName.length < 1) {
			throw new Error('Invalid displayName');
		}
		channel.displayName = displayName;
		storage.displayNames.set(this.getChannelName(), displayName, 86400000);
	};

	/**
	 * Initialize the details.
	 */
	
	// Required fields.
	this.setText(details.text);
	this.setUrl(details.url);

	// Optional fields.
	if (details.getterName) {
		this.setGetterName(details.getterName);
	}
	if (details.channel) {
		this.setChannelName(details.channel);
	}
	if (details.channelDisplayName) {
		this.setChannelDisplayName(details.channelDisplayName);
	}
	if (details.badge) {
		this.setChannelBadge(details.badge);
	}
};

/**
 * State changers.
 */

/**
 * Toggle whether an emote should be a favorite.
 * @param {boolean} [force] `true` forces the emote to be a favorite, `false` forces the emote to not be a favorite.
 */
Emote.prototype.toggleFavorite = function (force) {
	if (typeof force !== 'undefined') {
		storage.starred.set(this.getText(), !!force);
		return;
	}
	storage.starred.set(this.getText(), !this.isFavorite());
};

/**
 * Toggle whether an emote should be visible out of editing mode.
 * @param {boolean} [force] `true` forces the emote to be visible, `false` forces the emote to be hidden.
 */
Emote.prototype.toggleVisibility = function (force) {
	if (typeof force !== 'undefined') {
		storage.visibility.set(this.getText(), !!force);
		return;
	}
	storage.visibility.set(this.getText(), !this.isVisible());
};

/**
 * State getters.
 */

/**
 * Whether the emote is from a 3rd party.
 * @return {boolean} Whether the emote is from a 3rd party.
 */
Emote.prototype.isThirdParty = function () {
	return !!this.getGetterName();
};

/**
 * Whether the emote was favorited.
 * @return {boolean} Whether the emote was favorited.
 */
Emote.prototype.isFavorite = function () {
	return storage.starred.get(this.getText(), false);
};

/**
 * Whether the emote is visible outside of editing mode.
 * @return {boolean} Whether the emote is visible outside of editing mode.
 */
Emote.prototype.isVisible = function () {
	return storage.visibility.get(this.getText(), true);
};

/**
 * Whether the emote is considered a simple smiley.
 * @return {boolean} Whether the emote is considered a simple smiley.
 */
Emote.prototype.isSmiley = function () {
	// The basic smiley emotes.
	var emotes = [':(', ':)', ':/', ':\\', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o', 'O_O', '#/', ':7', ':>', ':S', '<]'];
	return emotes.indexOf(this.getText()) !== -1;
};

/**
 * Property getters/setters.
 */

/**
 * Gets the usable emote text from a regex.
 */
function getEmoteFromRegEx(regex) {
	if (typeof regex === 'string') {
		regex = new RegExp(regex);
	}
	if (!regex) {
		throw new Error('`regex` must be a RegExp string or object.');
	}

	return decodeURI(regex.source)

		// Replace HTML entity brackets with actual brackets.
		.replace('&gt\\;', '>')
		.replace('&lt\\;', '<')

		// Remove negative groups.
		//
		// /
		//   \(\?!              // (?!
		//   [^)]*              // any amount of characters that are not )
		//   \)                 // )
		// /g
		.replace(/\(\?![^)]*\)/g, '')

		// Pick first option from a group.
		//
		// /
		//   \(                 // (
		//   ([^|])*            // any amount of characters that are not |
		//   \|?                // an optional | character
		//   [^)]*              // any amount of characters that are not )
		//   \)                 // )
		// /g
		.replace(/\(([^|])*\|?[^)]*\)/g, '$1')

		// Pick first character from a character group.
		//
		// /
		//   \[                 // [
		//   ([^|\]\[])*        // any amount of characters that are not |, [, or ]
		//   \|?                // an optional | character
		//   [^\]]*             // any amount of characters that are not [, or ]
		//   \]                 // ]
		// /g
		.replace(/\[([^|\]\[])*\|?[^\]\[]*\]/g, '$1')

		// Remove optional characters.
		//
		// /
		//   [^\\]              // any character that is not \
		//   \?                 // ?
		// /g
		.replace(/[^\\]\?/g, '')

		// Remove boundaries at beginning and end.
		.replace(/^\\b|\\b$/g, '') 

		// Unescape only single backslash, not multiple.
		//
		// /
		//   \\                 // \
		//   (?!\\)             // look-ahead, any character that isn't \
		// /g
		.replace(/\\(?!\\)/g, '');
}

var sorting = {};

/**
 * Sort by alphanumeric in this order: symbols -> numbers -> AaBb... -> numbers
 */
sorting.byText = function (a, b) {
	textA = a.getText().toLowerCase();
	textB = b.getText().toLowerCase();

	if (textA < textB) {
		return -1;
	}
	if (textA > textB) {
		return 1;
	}
	return 0;
}

/**
 * Basic smilies before non-basic smilies.
 */
sorting.bySmiley = function (a, b) {
	if (a.isSmiley() &&	!b.isSmiley()) {
		return -1;
	}
	if (b.isSmiley() &&	!a.isSmiley()) {
		return 1;
	}
	return 0;
};

/**
 * Globals before subscription emotes, subscriptions in alphabetical order.
 */
sorting.byChannelName = function (a, b) {
	var channelA = a.getChannelName();
	var channelB = b.getChannelName();

	// Both don't have channels.
	if (!channelA && !channelB) {
		return 0;
	}

	// "A" has channel, "B" doesn't.
	if (channelA && !channelB) {
		return 1;
	}
	// "B" has channel, "A" doesn't.
	if (channelB && !channelA) {
		return -1;
	}

	channelA = channelA.toLowerCase();
	channelB = channelB.toLowerCase();

	if (channelA < channelB) {
		return -1;
	}
	if (channelB > channelA) {
		return 1;
	}

	// All the same
	return 0;
};

/**
 * The general sort order for the all emotes category.
 * Smileys -> Channel grouping -> alphanumeric
 */
sorting.allEmotesCategory = function (a, b) {
	var bySmiley = sorting.bySmiley(a, b);
	var byChannelName  = sorting.byChannelName(a, b);
	var byText = sorting.byText(a, b);

	if (bySmiley !== 0) {
		return bySmiley;
	}
	if (byChannelName !== 0) {
		return byChannelName;
	}
	return byText;
};

module.exports = emoteStore;

},{"./logger":10,"./storage":12,"./twitch-api":14,"./ui":15}],10:[function(require,module,exports){
var api = {};
var instance = '[instance ' + (Math.floor(Math.random() * (999 - 100)) + 100) + '] ';
var prefix = '[Emote Menu] ';
var storage = require('./storage');

api.log = function () {
	if (typeof console.log === 'undefined') {
		return;
	}
	arguments = [].slice.call(arguments).map(function (arg) {
		if (typeof arg !== 'string') {
			return JSON.stringify(arg);
		}
		return arg;
	});
	if (storage.global.get('debugMessagesEnabled', false)) {
		arguments.unshift(instance);
	}
	arguments.unshift(prefix);
	console.log.apply(console, arguments);
};

api.debug = function () {
	if (!storage.global.get('debugMessagesEnabled', false)) {
		return;
	}
	arguments = [].slice.call(arguments);
	arguments.unshift('[DEBUG] ');
	api.log.apply(null, arguments);
}

module.exports = api;

},{"./storage":12}],11:[function(require,module,exports){
var storage = require('./storage');
var logger = require('./logger');
var emotes = require('./emotes');
var api = {};

api.toggleDebug = function (forced) {
	if (typeof forced === 'undefined') {
		forced = !storage.global.get('debugMessagesEnabled', false);
	}
	else {
		forced = !!forced;
	}
	storage.global.set('debugMessagesEnabled', forced);
	logger.log('Debug messages are now ' + (forced ? 'enabled' : 'disabled'));
};

api.registerEmoteGetter = emotes.registerGetter;
api.deregisterEmoteGetter = emotes.deregisterGetter;

module.exports = api;

},{"./emotes":9,"./logger":10,"./storage":12}],12:[function(require,module,exports){
var Store = require('storage-wrapper');
var storage = {};

// General storage.
storage.global = new Store({
	namespace: 'emote-menu-for-twitch'
});

// Emote visibility storage.
storage.visibility = storage.global.createSubstore('visibility');
// Emote starred storage.
storage.starred = storage.global.createSubstore('starred');
// Display name storage.
storage.displayNames = storage.global.createSubstore('displayNames');
// Channel name storage.
storage.channelNames = storage.global.createSubstore('channelNames');
// Badges storage.
storage.badges = storage.global.createSubstore('badges');

module.exports = storage;

},{"storage-wrapper":6}],13:[function(require,module,exports){
var templates = require('../../build/templates');

module.exports = (function () {
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

},{"../../build/templates":3}],14:[function(require,module,exports){
var twitchApi = window.Twitch.api;
var jQuery = window.jQuery;
var logger = require('./logger');
var api = {};

api.getBadges = function (username, callback) {
	if (
		[
			'~global',
			'turbo',
			'twitch_prime'
		].indexOf(username) > -1
	) {
		if (!jQuery) {
			callback({});
		}
		// Note: not a documented API endpoint.
		jQuery.getJSON('https://badges.twitch.tv/v1/badges/global/display')
			.done(function (api) {
				var badges = {
					turbo: {
						image: api.badge_sets.turbo.versions['1'].image_url_1x
					},
					premium: {
						image: api.badge_sets.premium.versions['1'].image_url_1x
					}
				};
				callback(badges);
			})
			.fail(function () {
				callback({});
			});
	}
	else {
		twitchApi.get('chat/' + username + '/badges')
			.done(function (api) {
				callback(api);
			})
			.fail(function () {
				callback({});
			});
	}
};

api.getUser = function (username, callback) {
	// Note: not a documented API endpoint.
	twitchApi.get('users/' + username)
		.done(function (api) {
			callback(api);
		})
		.fail(function () {
			callback({});
		});
};

api.getTickets = function (callback) {
	// Note: not a documented API endpoint.
	twitchApi.get(
		'/api/users/:login/tickets',
		{
			offset: 0,
			limit: 100,
			unended: true
		}
	)
		.done(function (api) {
			callback(api.tickets || []);
		})
		.fail(function () {
			callback([]);
		});
};

api.onEmotesChange = function (callback, immediate) {
	logger.debug('onEmotesChange called.');
	var ember = require('./ember-api');
	var session = ember.get('controller:chat', 'currentRoom.tmiRoom.session');
	var response = null;

	if (typeof callback !== 'function') {
		throw new Error('`callback` must be a function.');
	}

	// No parser or no emotes loaded yet, try again.
	if (!session) {
		logger.debug('onEmotesChange session missing, trying again.');
		setTimeout(api.onEmotesChange, 100, callback, immediate);
		return;
	}

	// Call the callback immediately on registering.
	if (immediate) {
		response = session.getEmotes();
		if (!response || !response.emoticon_sets) {
			logger.debug('onEmotesChange no emoticon_sets, trying again.');
			setTimeout(api.onEmotesChange, 100, callback, immediate);
			return;
		}

		logger.debug('onEmotesChange callback called immediately.');
		callback(response.emoticon_sets);
	}

	// Listen for the event.
	session._emotesParser.on('emotes_changed', function (response) {
		logger.debug('onEmotesChange callback called while listening.');
		callback(response.emoticon_sets);
	});

	logger.debug('Registered listener for emote changes.');
};

module.exports = api;

},{"./ember-api":8,"./logger":10}],15:[function(require,module,exports){
var api = {};
var $ = jQuery = window.jQuery;
var templates = require('./templates');
var storage = require('./storage');
var emotes = require('./emotes');
var logger = require('./logger');

var theMenu = new UIMenu();
var theMenuButton = new UIMenuButton();

api.init = function () {
	// Load CSS.
	require('../../build/styles');

	// Load jQuery plugins.
	require('../plugins/resizable');
	require('jquery.scrollbar');

	theMenuButton.init();
	theMenu.init();
};

api.hideMenu = function () {
	if (theMenu.dom && theMenu.dom.length) {
		theMenu.toggleDisplay(false);
	}
};

api.updateEmotes = function () {
	theMenu.updateEmotes();
}

function UIMenuButton() {
	this.dom = null;
}

UIMenuButton.prototype.init = function (timesFailed) {
	var self = this;
	var chatButton = $('.send-chat-button, .chat-buttons-container button');
	var failCounter = timesFailed || 0;
	this.dom = $('#emote-menu-button');

	// Element already exists.
	if (this.dom.length) {
		logger.debug('MenuButton already exists, stopping init.');
		return this;
	}

	if (!chatButton.length) {
		failCounter += 1;
		if (failCounter === 1) {
			logger.log('MenuButton container missing, trying again.');
		}
		if (failCounter >= 10) {
			logger.log('MenuButton container missing, MenuButton unable to be added, stopping init.');
			return this;
		}
		setTimeout(function () {
			self.init(failCounter);
		}, 1000);
		return this;
	}

	// Create element.
	this.dom = $(templates.emoteButton());
	this.dom.insertBefore(chatButton);

	// Hide then fade it in.
	this.dom.hide();
	this.dom.fadeIn();

	// Enable clicking.
	this.dom.on('click', function () {
		theMenu.toggleDisplay();
	});

	return this;
};

UIMenuButton.prototype.toggleDisplay = function (forced) {
	var state = typeof forced !== 'undefined' ? !!forced : !this.isVisible();
	if (state) {
		this.dom.addClass('active');
		return this;
	}
	this.dom.removeClass('active');

	return this;
};

UIMenuButton.prototype.isVisible = function () {
	return this.dom.hasClass('active');
};

function UIMenu() {
	this.dom = null;
	this.groups = {};
	this.emotes = [];
	this.offset = null;
	this.favorites = null;
}

UIMenu.prototype.init = function () {
	var logger = require('./logger');
	var self = this;

	this.dom = $('#emote-menu-for-twitch');

	// Element already exists.
	if (this.dom.length) {
		return this;
	}

	// Create element.
	this.dom = $(templates.menu());
	$(document.body).append(this.dom);

	this.favorites = new UIFavoritesGroup();

	// Enable dragging.
	this.dom.draggable({
		handle: '.draggable',
		start: function () {
			self.togglePinned(true);
			self.toggleMovement(true);
		},
		stop: function () {
			self.offset = self.dom.offset();
		},
		containment: $(document.body)
	});

	// Enable resizing.
	this.dom.resizable({
		handle: '[data-command="resize-handle"]',
		stop: function () {
			self.togglePinned(true);
			self.toggleMovement(true);
		},
		alsoResize: self.dom.find('.scrollable'),
		containment: $(document.body),
		minHeight: 180,
		minWidth: 200
	});

	// Enable pinning.
	this.dom.find('[data-command="toggle-pinned"]').on('click', function () {
		self.togglePinned();
	});

	// Enable editing.
	this.dom.find('[data-command="toggle-editing"]').on('click', function () {
		self.toggleEditing();
	});

	this.dom.find('.scrollable').scrollbar()

	this.updateEmotes();

	return this;
};

UIMenu.prototype._detectOutsideClick = function (event) {
	// Not outside of the menu, ignore the click.
	if ($(event.target).is('#emote-menu-for-twitch, #emote-menu-for-twitch *')) {
		return;
	}

	// Clicked on the menu button, just remove the listener and let the normal listener handle it.
	if (!this.isVisible() || $(event.target).is('#emote-menu-button, #emote-menu-button *')) {
		$(document).off('mouseup', this._detectOutsideClick.bind(this));
		return;
	}

	// Clicked outside, make sure the menu isn't pinned.
	if (!this.isPinned()) {
		// Menu wasn't pinned, remove listener.
		$(document).off('mouseup', this._detectOutsideClick.bind(this));
		this.toggleDisplay();
	}
};

UIMenu.prototype.toggleDisplay = function (forced) {
	var state = typeof forced !== 'undefined' ? !!forced : !this.isVisible();
	var loggedIn = window.Twitch && window.Twitch.user.isLoggedIn();

	// Menu should be shown.
	if (state) {
		// Check if user is logged in.
		if (!loggedIn) {
			// Call native login form.
			$.login();
			return this;
		}

		this.updateEmotes();
		this.dom.show();

		// Menu moved, move it back.
		if (this.hasMoved()) {
			this.dom.offset(this.offset);
		}
		// Never moved, make it the same size as the chat window.
		else {
			var chatContainer = $('.chat-messages');
			
			// Adjust the size to be the same as the chat container.
			this.dom.height(chatContainer.outerHeight() - (this.dom.outerHeight() - this.dom.height()));
			this.dom.width(chatContainer.outerWidth() - (this.dom.outerWidth() - this.dom.width()));

			// Adjust the offset to be the same as the chat container.
			this.offset = chatContainer.offset();
			this.dom.offset(this.offset);
		}

		// Listen for outside click.
		$(document).on('mouseup', this._detectOutsideClick.bind(this));
	}
	// Menu should be hidden.
	else {
		this.dom.hide();
		this.toggleEditing(false);
		this.togglePinned(false);
	}

	// Also toggle the menu button.
	theMenuButton.toggleDisplay(this.isVisible());

	return this;
};

UIMenu.prototype.isVisible = function () {
	return this.dom.is(':visible');
};

UIMenu.prototype.updateEmotes = function (which) {
	var emote = which ? this.getEmote(which) : null;
	var favoriteEmote = emote ? this.favorites.getEmote(which) : null;
	if (emote) {
		emote.update();
		if (favoriteEmote) {
			favoriteEmote.update();
		}
		return this;
	}
	var emotes = require('./emotes');
	var theEmotes = emotes.getEmotes();
	var theEmotesKeys = [];
	var self = this;

	theEmotes.forEach(function (emoteInstance) {
		self.addEmote(emoteInstance);
		theEmotesKeys.push(emoteInstance.getText());
	});

	// Difference the emotes and remove all non-valid emotes.
	this.emotes.forEach(function (oldEmote) {
		var text = oldEmote.getText()
		if (theEmotesKeys.indexOf(text) < 0) {
			logger.debug('Emote difference found, removing emote from UI: ' + text);
			self.removeEmote(text);
		}
	});

	// Save the emotes for next differencing.
	this.emotes = theEmotes;

	//Update groups.
	Object.keys(this.groups).forEach(function (group) {
		self.getGroup(group).init();
	});

	return this;
};

UIMenu.prototype.toggleEditing = function (forced) {
	var state = typeof forced !== 'undefined' ? !!forced : !this.isEditing();
	this.dom.toggleClass('editing', state);
	return this;
};

UIMenu.prototype.isEditing = function () {
	return this.dom.hasClass('editing');
};

UIMenu.prototype.togglePinned = function (forced) {
	var state = typeof forced !== 'undefined' ? !!forced : !this.isPinned();
	this.dom.toggleClass('pinned', state);
	return this;
};

UIMenu.prototype.isPinned = function () {
	return this.dom.hasClass('pinned');
};

UIMenu.prototype.toggleMovement = function (forced) {
	var state = typeof forced !== 'undefined' ? !!forced : !this.hasMoved();
	this.dom.toggleClass('moved', state);
	return this;
};

UIMenu.prototype.hasMoved = function () {
	return this.dom.hasClass('moved');
};

UIMenu.prototype.addGroup = function (emoteInstance) {
	var channel = emoteInstance.getChannelName();
	var self = this;

	// Already added, don't add again.
	if (this.getGroup(channel)) {
		return this;
	}

	// Add to current menu groups.
	var group = new UIGroup(emoteInstance);
	this.groups[channel] = group;

	// Sort group names, get index of where this group should go.
	var keys = Object.keys(this.groups);
	keys.sort(function (a, b) {
		// Get the instances.
		a = self.groups[a].emoteInstance;
		b = self.groups[b].emoteInstance;

		// Get the channel name.
		var aChannel = a.getChannelName();
		var bChannel = b.getChannelName();

		// Get the channel display name.
		a = a.getChannelDisplayName().toLowerCase();
		b = b.getChannelDisplayName().toLowerCase();

		// Prime goes first, always.
		if (aChannel === 'twitch_prime' && bChannel !== 'twitch_prime') {
			return -1;
		}
		if (bChannel === 'twitch_prime' && aChannel !== 'twitch_prime') {
			return 1;
		}

		// Turbo goes after Prime, always.
		if (aChannel === 'turbo' && bChannel !== 'turbo') {
			return -1;
		}
		if (bChannel === 'turbo' && aChannel !== 'turbo') {
			return 1;
		}

		// Global goes after Turbo, always.
		if (aChannel === '~global' && bChannel !== '~global') {
			return -1;
		}
		if (bChannel === '~global' && aChannel !== '~global') {
			return 1;
		}

		// A goes first.
		if (a < b) {
			return -1;
		}
		// B goest first.
		if (a > b) {
			return 1;
		}
		// Both the same, doesn't matter.
		return 0;
	});

	var index = keys.indexOf(channel);

	// First in the sort, place at the beginning of the menu.
	if (index === 0) {
		group.dom.prependTo(this.dom.find('#all-emotes-group'));
	}
	// Insert after the previous group in the sort.
	else {
		group.dom.insertAfter(this.getGroup(keys[index - 1]).dom);
	}

	return group;
};

UIMenu.prototype.getGroup = function (name) {
	return this.groups[name] || null;
};

UIMenu.prototype.addEmote = function (emoteInstance) {
	// Get the group, or add if needed.
	var group = this.getGroup(emoteInstance.getChannelName()) || this.addGroup(emoteInstance);

	group.addEmote(emoteInstance);
	group.toggleDisplay(group.isVisible(), true);

	this.favorites.addEmote(emoteInstance);

	return this;
};

UIMenu.prototype.removeEmote = function (name) {
	var self = this;
	Object.keys(this.groups).forEach(function (groupName) {
		self.groups[groupName].removeEmote(name);
	});
	this.favorites.removeEmote(name);

	return this;
};

UIMenu.prototype.getEmote = function (name) {
	var groupName = null;
	var group = null;
	var emote = null;

	for (groupName in this.groups) {
		group = this.groups[groupName];
		emote = group.getEmote(name);

		if (emote) {
			return emote;
		}
	}

	return null;
};

function UIGroup(emoteInstance) {
	this.dom = null;
	this.emotes = {};
	this.emoteInstance = emoteInstance;

	this.init();
}

UIGroup.prototype.init = function () {
	var self = this;
	var emoteInstance = this.emoteInstance;

	// First init, create new DOM.
	if (this.dom === null) {
		this.dom = $(templates.emoteGroupHeader({
			badge: emoteInstance.getChannelBadge(),
			channel: emoteInstance.getChannelName(),
			channelDisplayName: emoteInstance.getChannelDisplayName()
		}));
	}
	// Update DOM instead.
	else {
		this.dom.find('.header-info').replaceWith(
			$(templates.emoteGroupHeader({
				badge: emoteInstance.getChannelBadge(),
				channel: emoteInstance.getChannelName(),
				channelDisplayName: emoteInstance.getChannelDisplayName()
			}))
			.find('.header-info')
		);
	}

	// Enable emote hiding.
	this.dom.find('.header-info [data-command="toggle-visibility"]').on('click', function () {
		if (!theMenu.isEditing()) {
			return;
		}
		self.toggleDisplay();
	});

	this.toggleDisplay(this.isVisible(), true);
};

UIGroup.prototype.toggleDisplay = function (forced, skipUpdatingEmoteDisplay) {
	var self = this;
	var state = typeof forced !== 'undefined' ? !forced : this.isVisible();

	this.dom.toggleClass('emote-menu-hidden', state);

	// Update the display of all emotes.
	if (!skipUpdatingEmoteDisplay) {
		Object.keys(this.emotes).forEach(function (emoteName) {
			self.emotes[emoteName].toggleDisplay(!state);
			theMenu.updateEmotes(self.emotes[emoteName].instance.getText());
		});
	}

	return this;
};

UIGroup.prototype.isVisible = function () {
	var self = this;

	// If any emote is visible, the group should be visible.
	return Object.keys(this.emotes).some(function (emoteName) {
		return self.emotes[emoteName].isVisible();
	});
};

UIGroup.prototype.addEmote = function (emoteInstance) {
	var self = this;
	var emote = this.getEmote(emoteInstance.getText());

	// Already added, update instead.
	if (emote) {
		emote.update();
		return this;
	}

	// Add to current emotes.
	emote = new UIEmote(emoteInstance);
	this.emotes[emoteInstance.getText()] = emote;

	var keys = Object.keys(this.emotes);

	keys.sort(function (a, b) {
		// Get the emote instances.
		a = self.emotes[a].instance;
		b = self.emotes[b].instance;

		// A is a smiley, B isn't. A goes first.
		if (a.isSmiley() &&	!b.isSmiley()) {
			return -1;
		}
		// B is a smiley, A isn't. B goes first.
		if (b.isSmiley() &&	!a.isSmiley()) {
			return 1;
		}

		// Get the text of the emotes.
		a = a.getText().toLowerCase();
		b = b.getText().toLowerCase();

		// A goes first.
		if (a < b) {
			return -1;
		}
		// B goest first.
		if (a > b) {
			return 1;
		}
		// Both the same, doesn't matter.
		return 0;
	});

	var index = keys.indexOf(emoteInstance.getText());

	// First in the sort, place at the beginning of the group.
	if (index === 0) {
		emote.dom.prependTo(this.dom.find('.emote-container'));
	}
	// Insert after the previous emote in the sort.
	else {
		emote.dom.insertAfter(this.getEmote(keys[index - 1]).dom);
	}

	return this;
};

UIGroup.prototype.getEmote = function (name) {
	return this.emotes[name] || null;
};

UIGroup.prototype.removeEmote = function (name) {
	var emote = this.getEmote(name);
	if (!emote) {
		return this;
	}
	emote.dom.remove();
	delete this.emotes[name];

	return this;
};

function UIFavoritesGroup() {
	this.dom = $('#starred-emotes-group');
	this.emotes = {};
}

UIFavoritesGroup.prototype.addEmote = UIGroup.prototype.addEmote;
UIFavoritesGroup.prototype.getEmote = UIGroup.prototype.getEmote;
UIFavoritesGroup.prototype.removeEmote = UIGroup.prototype.removeEmote;

function UIEmote(emoteInstance) {
	this.dom = null;
	this.instance = emoteInstance;
	this.init();
}

UIEmote.prototype.init = function () {
	var self = this;

	// Create element.
	this.dom = $(templates.emote({
		url: this.instance.getUrl(),
		text: this.instance.getText(),
		thirdParty: this.instance.isThirdParty(),
		isVisible: this.instance.isVisible(),
		isStarred: this.instance.isFavorite()
	}));

	// Enable clicking.
	this.dom.on('click', function () {
		if (!theMenu.isEditing()) {
			self.addToChat();

			// Close the menu if not pinned.
			if (!theMenu.isPinned()) {
				theMenu.toggleDisplay();
			}
		}
	});

	// Enable emote hiding.
	this.dom.find('[data-command="toggle-visibility"]').on('click', function () {
		if (!theMenu.isEditing()) {
			return;
		}
		self.toggleDisplay();
		theMenu.updateEmotes(self.instance.getText());
	});

	// Enable emote favoriting.
	this.dom.find('[data-command="toggle-starred"]').on('click', function () {
		if (!theMenu.isEditing()) {
			return;
		}
		self.toggleFavorite();
		theMenu.updateEmotes(self.instance.getText());
	});

	return this;
};

UIEmote.prototype.toggleDisplay = function (forced, skipInstanceUpdate) {
	var state = typeof forced !== 'undefined' ? !forced : this.isVisible();
	this.dom.toggleClass('emote-menu-hidden', state);
	if (!skipInstanceUpdate) {
		this.instance.toggleVisibility(!state);
	}

	var group = this.getGroup();
	group.toggleDisplay(group.isVisible(), true);

	return this;
};

UIEmote.prototype.isVisible = function () {
	return !this.dom.hasClass('emote-menu-hidden');
};

UIEmote.prototype.toggleFavorite = function (forced, skipInstanceUpdate) {
	var state = typeof forced !== 'undefined' ? !!forced : !this.isFavorite();
	this.dom.toggleClass('emote-menu-starred', state);
	if (!skipInstanceUpdate) {
		this.instance.toggleFavorite(state);
	}
	return this;
};

UIEmote.prototype.isFavorite = function () {
	return this.dom.hasClass('emote-menu-starred');
};

UIEmote.prototype.addToChat = function () {
	var ember = require('./ember-api');
	// Get textarea element.
	var element = $('.chat-interface textarea').get(0);
	var text = this.instance.getText();

	// Insert at cursor / replace selection.
	// https://developer.mozilla.org/en-US/docs/Code_snippets/Miscellaneous
	var selectionEnd = element.selectionStart + text.length;
	var currentValue = element.value;
	var beforeText = currentValue.substring(0, element.selectionStart);
	var afterText = currentValue.substring(element.selectionEnd, currentValue.length);
	// Smart padding, only put space at start if needed.
	if (
		beforeText !== '' &&
		beforeText.substr(-1) !== ' '
	) {
		text = ' ' + text;
	}
	// Always put space at end.
	text = beforeText + text + ' ' + afterText;
	// Set the text.
	ember.get('controller:chat', 'currentRoom').set('messageToSend', text);
	element.focus();
	// Put cursor at end.
	selectionEnd = element.selectionStart + text.length;
	element.setSelectionRange(selectionEnd, selectionEnd);

	return this;
};

UIEmote.prototype.getGroup = function () {
	return theMenu.getGroup(this.instance.getChannelName());
};

UIEmote.prototype.update = function () {
	this.toggleDisplay(this.instance.isVisible(), true);
	this.toggleFavorite(this.instance.isFavorite(), true);
};

module.exports = api;

},{"../../build/styles":2,"../plugins/resizable":16,"./ember-api":8,"./emotes":9,"./logger":10,"./storage":12,"./templates":13,"jquery.scrollbar":5}],16:[function(require,module,exports){
(function ($) {
	$.fn.resizable = function (options) {
		var settings = $.extend({
			alsoResize: null,
			alsoResizeType: 'both', // `height`, `width`, `both`
			containment: null,
			create: null,
			destroy: null,
			handle: '.resize-handle',
			maxHeight: 9999,
			maxWidth: 9999,
			minHeight: 0,
			minWidth: 0,
			resize: null,
			resizeOnce: null,
			snapSize: 1,
			start: null,
			stop: null
		}, options);

		settings.element = $(this);

		function recalculateSize(evt) {
			var data = evt.data,
				resized = {};
			data.diffX = Math.round((evt.pageX - data.pageX) / settings.snapSize) * settings.snapSize;
			data.diffY = Math.round((evt.pageY - data.pageY) / settings.snapSize) * settings.snapSize;
			if (Math.abs(data.diffX) > 0 || Math.abs(data.diffY) > 0) {
				if (
					settings.element.height() !== data.height + data.diffY &&
					data.height + data.diffY >= settings.minHeight &&
					data.height + data.diffY <= settings.maxHeight &&
					(settings.containment ? data.outerHeight + data.diffY + data.offset.top <= settings.containment.offset().top + settings.containment.outerHeight() : true)
				) {
					settings.element.height(data.height + data.diffY);
					resized.height = true;
				}
				if (
					settings.element.width() !== data.width + data.diffX &&
					data.width + data.diffX >= settings.minWidth &&
					data.width + data.diffX <= settings.maxWidth &&
					(settings.containment ? data.outerWidth + data.diffX + data.offset.left <= settings.containment.offset().left + settings.containment.outerWidth() : true)
				) {
					settings.element.width(data.width + data.diffX);
					resized.width = true;
				}
				if (resized.height || resized.width) {
					if (settings.resizeOnce) {
						settings.resizeOnce.bind(settings.element)(evt.data);
						settings.resizeOnce = null;
					}
					if (settings.resize) {
						settings.resize.bind(settings.element)(evt.data);
					}
					if (settings.alsoResize) {
						if (resized.height && (settings.alsoResizeType === 'height' || settings.alsoResizeType === 'both')) {
							settings.alsoResize.height(data.alsoResizeHeight + data.diffY);
						}
						if (resized.width && (settings.alsoResizeType === 'width' || settings.alsoResizeType === 'both')) {
							settings.alsoResize.width(data.alsoResizeWidth + data.diffX);
						}
					}
				}
			}
		}

		function start(evt) {
			evt.preventDefault();
			if (settings.start) {
				settings.start.bind(settings.element)();
			}
			var data = {
				alsoResizeHeight: settings.alsoResize ? settings.alsoResize.height() : 0,
				alsoResizeWidth: settings.alsoResize ? settings.alsoResize.width() : 0,
				height: settings.element.height(),
				offset: settings.element.offset(),
				outerHeight: settings.element.outerHeight(),
				outerWidth: settings.element.outerWidth(),
				pageX: evt.pageX,
				pageY: evt.pageY,
				width: settings.element.width()
			};
			$(document).on('mousemove', '*', data, recalculateSize);
			$(document).on('mouseup', '*', stop);
		}

		function stop() {
			if (settings.stop) {
				settings.stop.bind(settings.element)();
			}
			$(document).off('mousemove', '*', recalculateSize);
			$(document).off('mouseup', '*', stop);
		}

		if (settings.handle) {
			if (settings.alsoResize && ['both', 'height', 'width'].indexOf(settings.alsoResizeType) >= 0) {
				settings.alsoResize = $(settings.alsoResize);
			}
			if (settings.containment) {
				settings.containment = $(settings.containment);
			}
			settings.handle = $(settings.handle);
			settings.snapSize = settings.snapSize < 1 ? 1 : settings.snapSize;

			if (options === 'destroy') {
				settings.handle.off('mousedown', start);

				if (settings.destroy) {
					settings.destroy.bind(this)();
				}
				return this;
			}

			settings.handle.on('mousedown', start);

			if (settings.create) {
				settings.create.bind(this)();
			}
		}
		return this;
	};
})(jQuery);

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiLi9zcmMvc2NyaXB0LmpzIiwiQzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC9zdHlsZXMuanMiLCJDOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL2J1aWxkL3RlbXBsYXRlcy5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2hvZ2FuLmpzL2xpYi90ZW1wbGF0ZS5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2pxdWVyeS5zY3JvbGxiYXIvanF1ZXJ5LnNjcm9sbGJhci5taW4uanMiLCJDOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9zdG9yYWdlLXdyYXBwZXIvaW5kZXguanMiLCJDOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3BhY2thZ2UuanNvbiIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvZW1iZXItYXBpLmpzIiwiQzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy9lbW90ZXMuanMiLCJDOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL2xvZ2dlci5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvcHVibGljLWFwaS5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvc3RvcmFnZS5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvdGVtcGxhdGVzLmpzIiwiQzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy90d2l0Y2gtYXBpLmpzIiwiQzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy91aS5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL3BsdWdpbnMvcmVzaXphYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy91QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwa2cgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKTtcclxudmFyIHB1YmxpY0FwaSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9wdWJsaWMtYXBpJyk7XHJcbnZhciBlbWJlciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9lbWJlci1hcGknKTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnZXInKTtcclxudmFyIGVtb3RlcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9lbW90ZXMnKTtcclxudmFyIHVpID0gcmVxdWlyZSgnLi9tb2R1bGVzL3VpJyk7XHJcblxyXG5sb2dnZXIubG9nKCcodicrIHBrZy52ZXJzaW9uICsgJykgSW5pdGlhbCBsb2FkIG9uICcgKyBsb2NhdGlvbi5ocmVmKTtcclxuXHJcbi8vIE9ubHkgZW5hYmxlIHNjcmlwdCBpZiB3ZSBoYXZlIHRoZSByaWdodCB2YXJpYWJsZXMuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbnZhciBpbml0VGltZXIgPSAwO1xyXG4oZnVuY3Rpb24gaW5pdCh0aW1lKSB7XHRcclxuXHRpZiAoIXRpbWUpIHtcclxuXHRcdHRpbWUgPSAwO1xyXG5cdH1cclxuXHJcblx0dmFyIG9iamVjdHNMb2FkZWQgPSAoXHJcblx0XHR3aW5kb3cuVHdpdGNoICE9PSB1bmRlZmluZWQgJiZcclxuXHRcdHdpbmRvdy5qUXVlcnkgIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0ZW1iZXIuaXNMb2FkZWQoKVxyXG5cdCk7XHJcblx0aWYgKCFvYmplY3RzTG9hZGVkKSB7XHJcblx0XHQvLyBTdG9wcyB0cnlpbmcgYWZ0ZXIgMTAgbWludXRlcy5cclxuXHRcdGlmIChpbml0VGltZXIgPj0gNjAwMDAwKSB7XHJcblx0XHRcdGxvZ2dlci5sb2coJ1Rha2luZyB0b28gbG9uZyB0byBsb2FkLCBzdG9wcGluZy4gUmVmcmVzaCB0aGUgcGFnZSB0byB0cnkgYWdhaW4uICgnICsgaW5pdFRpbWVyICsgJ21zKScpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gR2l2ZSBhbiB1cGRhdGUgZXZlcnkgMTAgc2Vjb25kcy5cclxuXHRcdGlmIChpbml0VGltZXIgJSAxMDAwMCkge1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ1N0aWxsIHdhaXRpbmcgZm9yIG9iamVjdHMgdG8gbG9hZC4gKCcgKyBpbml0VGltZXIgKyAnbXMpJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gQnVtcCB0aW1lIHVwIGFmdGVyIDFzIHRvIHJlZHVjZSBwb3NzaWJsZSBsYWcuXHJcblx0XHR0aW1lID0gdGltZSA+PSAxMDAwID8gMTAwMCA6IHRpbWUgKyAyNTtcclxuXHRcdGluaXRUaW1lciArPSB0aW1lO1xyXG5cclxuXHRcdHNldFRpbWVvdXQoaW5pdCwgdGltZSwgdGltZSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG5cdC8vIEV4cG9zZSBwdWJsaWMgYXBpLlxyXG5cdGlmICh0eXBlb2Ygd2luZG93LmVtb3RlTWVudSA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHdpbmRvdy5lbW90ZU1lbnUgPSBwdWJsaWNBcGk7XHJcblx0fVxyXG5cclxuXHRlbWJlci5ob29rKCdyb3V0ZTpjaGFubmVsJywgYWN0aXZhdGUsIGRlYWN0aXZhdGUpO1xyXG5cdGVtYmVyLmhvb2soJ3JvdXRlOmNoYXQnLCBhY3RpdmF0ZSwgZGVhY3RpdmF0ZSk7XHJcblxyXG5cdGFjdGl2YXRlKCk7XHJcbn0pKCk7XHJcblxyXG5mdW5jdGlvbiBhY3RpdmF0ZSgpIHtcclxuXHR1aS5pbml0KCk7XHJcblx0ZW1vdGVzLmluaXQoKTtcclxufVxyXG5mdW5jdGlvbiBkZWFjdGl2YXRlKCkge1xyXG5cdHVpLmhpZGVNZW51KCk7XHJcbn1cclxuIiwiKGZ1bmN0aW9uIChkb2MsIGNzc1RleHQpIHtcbiAgICB2YXIgaWQgPSBcImVtb3RlLW1lbnUtZm9yLXR3aXRjaC1zdHlsZXNcIjtcbiAgICB2YXIgc3R5bGVFbCA9IGRvYy5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgaWYgKCFzdHlsZUVsKSB7XG4gICAgICAgIHN0eWxlRWwgPSBkb2MuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgICBzdHlsZUVsLmlkID0gaWQ7XG4gICAgICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG4gICAgfVxuICAgIGlmIChzdHlsZUVsLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgaWYgKCFzdHlsZUVsLnN0eWxlU2hlZXQuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIHN0eWxlRWwuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzVGV4dDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdHlsZUVsLmlubmVySFRNTCA9IGNzc1RleHQ7XG4gICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge1xuICAgICAgICAgICAgc3R5bGVFbC5pbm5lclRleHQgPSBjc3NUZXh0O1xuICAgICAgICB9XG4gICAgfVxufShkb2N1bWVudCwgXCIvKipcXG5cIiArXG5cIiAqIE1pbmlmaWVkIHN0eWxlLlxcblwiICtcblwiICogT3JpZ2luYWwgZmlsZW5hbWU6IFxcXFxub2RlX21vZHVsZXNcXFxcanF1ZXJ5LnNjcm9sbGJhclxcXFxqcXVlcnkuc2Nyb2xsYmFyLmNzc1xcblwiICtcblwiICovXFxuXCIgK1xuXCIuc2Nyb2xsLXdyYXBwZXJ7b3ZlcmZsb3c6aGlkZGVuIWltcG9ydGFudDtwYWRkaW5nOjAhaW1wb3J0YW50O3Bvc2l0aW9uOnJlbGF0aXZlfS5zY3JvbGwtd3JhcHBlcj4uc2Nyb2xsLWNvbnRlbnR7Ym9yZGVyOm5vbmUhaW1wb3J0YW50Oy1tb3otYm94LXNpemluZzpjb250ZW50LWJveCFpbXBvcnRhbnQ7Ym94LXNpemluZzpjb250ZW50LWJveCFpbXBvcnRhbnQ7aGVpZ2h0OmF1dG87bGVmdDowO21hcmdpbjowO21heC1oZWlnaHQ6bm9uZSFpbXBvcnRhbnQ7bWF4LXdpZHRoOm5vbmUhaW1wb3J0YW50O292ZXJmbG93OnNjcm9sbCFpbXBvcnRhbnQ7cGFkZGluZzowO3Bvc2l0aW9uOnJlbGF0aXZlIWltcG9ydGFudDt0b3A6MDt3aWR0aDphdXRvIWltcG9ydGFudH0uc2Nyb2xsLXdyYXBwZXI+LnNjcm9sbC1jb250ZW50Ojotd2Via2l0LXNjcm9sbGJhcntoZWlnaHQ6MDt3aWR0aDowfS5zY3JvbGwtZWxlbWVudHtkaXNwbGF5Om5vbmV9LnNjcm9sbC1lbGVtZW50LC5zY3JvbGwtZWxlbWVudCBkaXZ7LW1vei1ib3gtc2l6aW5nOmNvbnRlbnQtYm94O2JveC1zaXppbmc6Y29udGVudC1ib3h9LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUsLnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx5X3Zpc2libGV7ZGlzcGxheTpibG9ja30uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1hcnJvdywuc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXJ7Y3Vyc29yOmRlZmF1bHR9LnNjcm9sbC10ZXh0YXJlYXtib3JkZXI6MXB4IHNvbGlkICNjY2M7Ym9yZGVyLXRvcC1jb2xvcjojOTk5fS5zY3JvbGwtdGV4dGFyZWE+LnNjcm9sbC1jb250ZW50e292ZXJmbG93OmhpZGRlbiFpbXBvcnRhbnR9LnNjcm9sbC10ZXh0YXJlYT4uc2Nyb2xsLWNvbnRlbnQ+dGV4dGFyZWF7Ym9yZGVyOm5vbmUhaW1wb3J0YW50Oy1tb3otYm94LXNpemluZzpib3JkZXItYm94O2JveC1zaXppbmc6Ym9yZGVyLWJveDtoZWlnaHQ6MTAwJSFpbXBvcnRhbnQ7bWFyZ2luOjA7bWF4LWhlaWdodDpub25lIWltcG9ydGFudDttYXgtd2lkdGg6bm9uZSFpbXBvcnRhbnQ7b3ZlcmZsb3c6c2Nyb2xsIWltcG9ydGFudDtvdXRsaW5lOjA7cGFkZGluZzoycHg7cG9zaXRpb246cmVsYXRpdmUhaW1wb3J0YW50O3RvcDowO3dpZHRoOjEwMCUhaW1wb3J0YW50fS5zY3JvbGwtdGV4dGFyZWE+LnNjcm9sbC1jb250ZW50PnRleHRhcmVhOjotd2Via2l0LXNjcm9sbGJhcntoZWlnaHQ6MDt3aWR0aDowfS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50LC5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IGRpdntib3JkZXI6bm9uZTttYXJnaW46MDtwYWRkaW5nOjA7cG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMH0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudCBkaXZ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteHtib3R0b206MnB4O2hlaWdodDo4cHg7bGVmdDowO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXl7aGVpZ2h0OjEwMCU7cmlnaHQ6MnB4O3RvcDowO3dpZHRoOjhweH0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7b3ZlcmZsb3c6aGlkZGVufS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFyLC5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlciwuc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7Ym9yZGVyLXJhZGl1czo4cHh9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXIsLnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X3RyYWNrey1tcy1maWx0ZXI6XFxcInByb2dpZDpEWEltYWdlVHJhbnNmb3JtLk1pY3Jvc29mdC5BbHBoYShPcGFjaXR5PTQwKVxcXCI7ZmlsdGVyOmFscGhhKG9wYWNpdHk9NDApO29wYWNpdHk6LjR9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X3RyYWNre2JhY2tncm91bmQtY29sb3I6I2UwZTBlMH0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNjMmMyYzJ9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLWRyYWdnYWJsZSAuc2Nyb2xsLWJhciwuc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudDpob3ZlciAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiM5MTkxOTF9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7bGVmdDotMTJweH0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3t0b3A6LTEycHh9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi0xMnB4fS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi0xMnB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LC5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50IGRpdntib3JkZXI6bm9uZTttYXJnaW46MDtwYWRkaW5nOjA7cG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQgZGl2e2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7bGVmdDowO3RvcDowO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXh7Ym90dG9tOjA7aGVpZ2h0OjEycHg7bGVmdDowO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXl7aGVpZ2h0OjEwMCU7cmlnaHQ6MDt0b3A6MDt3aWR0aDoxMnB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtZWxlbWVudF9vdXRlcntoZWlnaHQ6OHB4O3RvcDoycHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X291dGVye2xlZnQ6MnB4O3dpZHRoOjhweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7b3ZlcmZsb3c6aGlkZGVufS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF90cmFja3tiYWNrZ3JvdW5kLWNvbG9yOiNlZWV9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXIsLnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X291dGVyLC5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF90cmFja3tib3JkZXItcmFkaXVzOjhweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNkOWQ5ZDl9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXI6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojYzJjMmMyfS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1iYXJ7YmFja2dyb3VuZC1jb2xvcjojOTE5MTkxfS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1jb250ZW50LnNjcm9sbC1zY3JvbGx5X3Zpc2libGV7bGVmdDotMTJweDttYXJnaW4tbGVmdDoxMnB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1jb250ZW50LnNjcm9sbC1zY3JvbGx4X3Zpc2libGV7dG9wOi0xMnB4O21hcmdpbi10b3A6MTJweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWJhcnttaW4td2lkdGg6MTBweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWJhcnttaW4taGVpZ2h0OjEwcHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7bGVmdDotMTRweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3t0b3A6LTE0cHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi0xNHB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi0xNHB4fS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudCwuc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQgZGl2e2JhY2tncm91bmQ6MCAwO2JvcmRlcjpub25lO21hcmdpbjowO3BhZGRpbmc6MDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwfS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudCBkaXZ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X3RyYWNre2Rpc3BsYXk6bm9uZX0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXJ7YmFja2dyb3VuZC1jb2xvcjojNkM2RTcxO2Rpc3BsYXk6YmxvY2s7LW1zLWZpbHRlcjpcXFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkFscGhhKE9wYWNpdHk9MClcXFwiO2ZpbHRlcjphbHBoYShvcGFjaXR5PTApO29wYWNpdHk6MDtib3JkZXItcmFkaXVzOjdweDt0cmFuc2l0aW9uOm9wYWNpdHkgLjJzIGxpbmVhcn0uc2Nyb2xsYmFyLW1hY29zeDpob3Zlcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXIsLnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1iYXJ7LW1zLWZpbHRlcjpcXFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkFscGhhKE9wYWNpdHk9NzApXFxcIjtmaWx0ZXI6YWxwaGEob3BhY2l0eT03MCk7b3BhY2l0eTouN30uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXh7Ym90dG9tOjA7aGVpZ2h0OjA7bGVmdDowO21pbi13aWR0aDoxMDAlO292ZXJmbG93OnZpc2libGU7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXl7aGVpZ2h0OjEwMCU7bWluLWhlaWdodDoxMDAlO3JpZ2h0OjA7dG9wOjA7d2lkdGg6MH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1iYXJ7aGVpZ2h0OjdweDttaW4td2lkdGg6MTBweDt0b3A6LTlweH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1iYXJ7bGVmdDotOXB4O21pbi1oZWlnaHQ6MTBweDt3aWR0aDo3cHh9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtZWxlbWVudF9vdXRlcntsZWZ0OjJweH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDotNHB4fS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7dG9wOjJweH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi00cHh9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx5X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDotMTFweH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTExcHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQgZGl2e2JvcmRlcjpub25lO21hcmdpbjowO292ZXJmbG93OmhpZGRlbjtwYWRkaW5nOjA7cG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQgZGl2e2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7bGVmdDowO3RvcDowO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X291dGVye2JvcmRlci1yYWRpdXM6MTBweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQS9QZ284YzNabklIaHRiRzV6UFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnlJZ2QybGtkR2c5SWpFd01DVWlJR2hsYVdkb2REMGlNVEF3SlNJZ2RtbGxkMEp2ZUQwaU1DQXdJREVnTVNJZ2NISmxjMlZ5ZG1WQmMzQmxZM1JTWVhScGJ6MGlibTl1WlNJK0NpQWdQR3hwYm1WaGNrZHlZV1JwWlc1MElHbGtQU0puY21Ga0xYVmpaMmN0WjJWdVpYSmhkR1ZrSWlCbmNtRmthV1Z1ZEZWdWFYUnpQU0oxYzJWeVUzQmhZMlZQYmxWelpTSWdlREU5SWpBbElpQjVNVDBpTUNVaUlIZ3lQU0l4TURBbElpQjVNajBpTUNVaVBnb2dJQ0FnUEhOMGIzQWdiMlptYzJWMFBTSXdKU0lnYzNSdmNDMWpiMnh2Y2owaUkyUmlaR0prWWlJZ2MzUnZjQzF2Y0dGamFYUjVQU0l4SWk4K0NpQWdJQ0E4YzNSdmNDQnZabVp6WlhROUlqRXdNQ1VpSUhOMGIzQXRZMjlzYjNJOUlpTmxPR1U0WlRnaUlITjBiM0F0YjNCaFkybDBlVDBpTVNJdlBnb2dJRHd2YkdsdVpXRnlSM0poWkdsbGJuUStDaUFnUEhKbFkzUWdlRDBpTUNJZ2VUMGlNQ0lnZDJsa2RHZzlJakVpSUdobGFXZG9kRDBpTVNJZ1ptbHNiRDBpZFhKc0tDTm5jbUZrTFhWaloyY3RaMlZ1WlhKaGRHVmtLU0lnTHo0S1BDOXpkbWMrKTtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwjZGJkYmRiIDAsI2U4ZThlOCAxMDAlKTtib3JkZXItcmFkaXVzOjEwcHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXh7Ym90dG9tOjA7aGVpZ2h0OjE3cHg7bGVmdDowO21pbi13aWR0aDoxMDAlO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXl7aGVpZ2h0OjEwMCU7bWluLWhlaWdodDoxMDAlO3JpZ2h0OjA7dG9wOjA7d2lkdGg6MTdweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQS9QZ284YzNabklIaHRiRzV6UFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnlJZ2QybGtkR2c5SWpFd01DVWlJR2hsYVdkb2REMGlNVEF3SlNJZ2RtbGxkMEp2ZUQwaU1DQXdJREVnTVNJZ2NISmxjMlZ5ZG1WQmMzQmxZM1JTWVhScGJ6MGlibTl1WlNJK0NpQWdQR3hwYm1WaGNrZHlZV1JwWlc1MElHbGtQU0puY21Ga0xYVmpaMmN0WjJWdVpYSmhkR1ZrSWlCbmNtRmthV1Z1ZEZWdWFYUnpQU0oxYzJWeVUzQmhZMlZQYmxWelpTSWdlREU5SWpBbElpQjVNVDBpTUNVaUlIZ3lQU0l4TURBbElpQjVNajBpTUNVaVBnb2dJQ0FnUEhOMGIzQWdiMlptYzJWMFBTSXdKU0lnYzNSdmNDMWpiMnh2Y2owaUkyWmxabVZtWlNJZ2MzUnZjQzF2Y0dGamFYUjVQU0l4SWk4K0NpQWdJQ0E4YzNSdmNDQnZabVp6WlhROUlqRXdNQ1VpSUhOMGIzQXRZMjlzYjNJOUlpTm1OV1kxWmpVaUlITjBiM0F0YjNCaFkybDBlVDBpTVNJdlBnb2dJRHd2YkdsdVpXRnlSM0poWkdsbGJuUStDaUFnUEhKbFkzUWdlRDBpTUNJZ2VUMGlNQ0lnZDJsa2RHZzlJakVpSUdobGFXZG9kRDBpTVNJZ1ptbHNiRDBpZFhKc0tDTm5jbUZrTFhWaloyY3RaMlZ1WlhKaGRHVmtLU0lnTHo0S1BDOXpkbWMrKTtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwjZmVmZWZlIDAsI2Y1ZjVmNSAxMDAlKTtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJhZGl1czoxMHB4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1jb250ZW50LnNjcm9sbC1zY3JvbGx5X3Zpc2libGV7bGVmdDotMTdweDttYXJnaW4tbGVmdDoxN3B4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1jb250ZW50LnNjcm9sbC1zY3JvbGx4X3Zpc2libGV7dG9wOi0xN3B4O21hcmdpbi10b3A6MTdweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWJhcntoZWlnaHQ6MTBweDttaW4td2lkdGg6MTBweDt0b3A6MH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWJhcntsZWZ0OjA7bWluLWhlaWdodDoxMHB4O3dpZHRoOjEwcHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X291dGVye2hlaWdodDoxMnB4O2xlZnQ6MnB4O3RvcDoycHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDotNHB4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9vdXRlcntsZWZ0OjJweDt0b3A6MnB4O3dpZHRoOjEycHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi00cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi0xOXB4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi0xOXB4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx5X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3RyYWNre2xlZnQ6LTE5cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7dG9wOi0xOXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudCBkaXZ7Ym9yZGVyOm5vbmU7bWFyZ2luOjA7b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwfS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnR7YmFja2dyb3VuZC1jb2xvcjojZmZmfS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQgZGl2e2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7bGVmdDowO3RvcDowO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtiYWNrZ3JvdW5kLWNvbG9yOiM5OTk7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLC4zKX0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlcjpob3ZlciAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtiYWNrZ3JvdW5kLWNvbG9yOiM2NjY7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLC41KX0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14e2JvdHRvbTowO2hlaWdodDoxMnB4O2xlZnQ6MDttaW4td2lkdGg6MTAwJTtwYWRkaW5nOjNweCAwIDJweDt3aWR0aDoxMDAlfS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXl7aGVpZ2h0OjEwMCU7bWluLWhlaWdodDoxMDAlO3BhZGRpbmc6MCAycHggMCAzcHg7cmlnaHQ6MDt0b3A6MDt3aWR0aDoxMnB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZDBiOWEwO2JvcmRlci1yYWRpdXM6MnB4O2JveC1zaGFkb3c6MXB4IDFweCAzcHggcmdiYSgwLDAsMCwuNSl9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXI6aG92ZXIgLnNjcm9sbC1iYXJ7Ym94LXNoYWRvdzoxcHggMXB4IDNweCByZ2JhKDAsMCwwLC42KX0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1jb250ZW50LnNjcm9sbC1zY3JvbGx5X3Zpc2libGV7bGVmdDotMTdweDttYXJnaW4tbGVmdDoxN3B4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZXttYXJnaW4tdG9wOjE3cHg7dG9wOi0xN3B4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1iYXJ7aGVpZ2h0OjEwcHg7bWluLXdpZHRoOjEwcHg7dG9wOjFweH0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtYmFye2xlZnQ6MXB4O21pbi1oZWlnaHQ6MTBweDt3aWR0aDoxMHB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X291dGVye2hlaWdodDoxNXB4O2xlZnQ6NXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X3NpemV7aGVpZ2h0OjJweDtsZWZ0Oi0xMHB4O3RvcDo1cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7dG9wOjVweDt3aWR0aDoxNXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDo1cHg7dG9wOi0xMHB4O3dpZHRoOjJweH0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx5X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDotMjVweH0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi0yNXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7bGVmdDotMjVweH0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3RyYWNre3RvcDotMjVweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LC5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQgZGl2e2JhY2tncm91bmQ6MCAwO2JvcmRlcjpub25lO21hcmdpbjowO3BhZGRpbmc6MDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwfS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQgZGl2e2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7bGVmdDowO3RvcDowO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteHtib3R0b206MnB4O2hlaWdodDo3cHg7bGVmdDowO21pbi13aWR0aDoxMDAlO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteXtoZWlnaHQ6MTAwJTttaW4taGVpZ2h0OjEwMCU7cmlnaHQ6MnB4O3RvcDowO3dpZHRoOjdweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlcntvcGFjaXR5Oi4zO2JvcmRlci1yYWRpdXM6MTJweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9zaXple2JhY2tncm91bmQtY29sb3I6I2NjYztvcGFjaXR5OjA7Ym9yZGVyLXJhZGl1czoxMnB4O3RyYW5zaXRpb246b3BhY2l0eSAuMnN9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiM2YzZlNzE7Ym9yZGVyLXJhZGl1czo3cHh9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWJhcntib3R0b206MDtoZWlnaHQ6N3B4O21pbi13aWR0aDoyNHB4O3RvcDphdXRvfS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1iYXJ7bGVmdDphdXRvO21pbi1oZWlnaHQ6MjRweDtyaWdodDowO3dpZHRoOjdweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtZWxlbWVudF9vdXRlcntib3R0b206MDt0b3A6YXV0bztsZWZ0OjJweDt0cmFuc2l0aW9uOmhlaWdodCAuMnN9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7bGVmdDphdXRvO3JpZ2h0OjA7dG9wOjJweDt0cmFuc2l0aW9uOndpZHRoIC4yc30uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTRweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9zaXple3RvcDotNHB4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi0xMXB4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTExcHh9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwtZHJhZ2dhYmxlIC5zY3JvbGwtZWxlbWVudF9vdXRlciwuc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50OmhvdmVyIC5zY3JvbGwtZWxlbWVudF9vdXRlcntvdmVyZmxvdzpoaWRkZW47LW1zLWZpbHRlcjpcXFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkFscGhhKE9wYWNpdHk9NzApXFxcIjtmaWx0ZXI6YWxwaGEob3BhY2l0eT03MCk7b3BhY2l0eTouN30uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1lbGVtZW50X291dGVyIC5zY3JvbGwtZWxlbWVudF9zaXplLC5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQ6aG92ZXIgLnNjcm9sbC1lbGVtZW50X291dGVyIC5zY3JvbGwtZWxlbWVudF9zaXple29wYWNpdHk6MX0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1lbGVtZW50X291dGVyIC5zY3JvbGwtYmFyLC5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQ6aG92ZXIgLnNjcm9sbC1lbGVtZW50X291dGVyIC5zY3JvbGwtYmFye2hlaWdodDoxMDAlO3dpZHRoOjEwMCU7Ym9yZGVyLXJhZGl1czoxMnB4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLWRyYWdnYWJsZSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXIsLnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteDpob3ZlciAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7aGVpZ2h0OjIwcHg7bWluLWhlaWdodDo3cHh9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtZHJhZ2dhYmxlIC5zY3JvbGwtZWxlbWVudF9vdXRlciwuc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15OmhvdmVyIC5zY3JvbGwtZWxlbWVudF9vdXRlcnttaW4td2lkdGg6N3B4O3dpZHRoOjIwcHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LC5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudCBkaXZ7Ym9yZGVyOm5vbmU7bWFyZ2luOjA7b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwfS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50IGRpdntkaXNwbGF5OmJsb2NrO2hlaWdodDoxMDAlO2xlZnQ6MDt0b3A6MDt3aWR0aDoxMDAlfS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7YmFja2dyb3VuZDojZjFmMWYxO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYn0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXh7Ym90dG9tOjA7aGVpZ2h0OjE2cHg7bGVmdDowO21pbi13aWR0aDoxMDAlO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15e2hlaWdodDoxMDAlO21pbi1oZWlnaHQ6MTAwJTtyaWdodDowO3RvcDowO3dpZHRoOjE2cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFye2JhY2tncm91bmQtY29sb3I6I2Q5ZDlkOTtib3JkZXI6MXB4IHNvbGlkICNiZGJkYmQ7Y3Vyc29yOmRlZmF1bHQ7Ym9yZGVyLXJhZGl1czoycHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFyOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2MyYzJjMjtib3JkZXItY29sb3I6I2E5YTlhOX0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLWRyYWdnYWJsZSAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiM5MTkxOTE7Ym9yZGVyLWNvbG9yOiM3ZTdlN2V9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1jb250ZW50LnNjcm9sbC1zY3JvbGx5X3Zpc2libGV7bGVmdDotMTZweDttYXJnaW4tbGVmdDoxNnB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtY29udGVudC5zY3JvbGwtc2Nyb2xseF92aXNpYmxle3RvcDotMTZweDttYXJnaW4tdG9wOjE2cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtYmFye2hlaWdodDo4cHg7bWluLXdpZHRoOjEwcHg7dG9wOjNweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1iYXJ7bGVmdDozcHg7bWluLWhlaWdodDoxMHB4O3dpZHRoOjhweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X291dGVye2JvcmRlci1sZWZ0OjFweCBzb2xpZCAjZGJkYmRifS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7aGVpZ2h0OjE0cHg7bGVmdDotM3B4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtoZWlnaHQ6MTRweDtsZWZ0Oi00cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9vdXRlcntib3JkZXItdG9wOjFweCBzb2xpZCAjZGJkYmRifS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7dG9wOi0zcHg7d2lkdGg6MTRweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi00cHg7d2lkdGg6MTRweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi0xOXB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple3RvcDotMTlweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7bGVmdDotMTlweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7dG9wOi0xOXB4fVxcblwiICtcblwiLyoqXFxuXCIgK1xuXCIgKiBNaW5pZmllZCBzdHlsZS5cXG5cIiArXG5cIiAqIE9yaWdpbmFsIGZpbGVuYW1lOiBcXFxcc3JjXFxcXHN0eWxlc1xcXFxzdHlsZS5jc3NcXG5cIiArXG5cIiAqL1xcblwiICtcblwiQC13ZWJraXQta2V5ZnJhbWVzIHNwaW57MTAwJXstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKTt0cmFuc2Zvcm06cm90YXRlKDM2MGRlZyl9fUBrZXlmcmFtZXMgc3BpbnsxMDAley13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpO3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKX19I2Vtb3RlLW1lbnUtYnV0dG9ue2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQklBQUFBUUNBWUFBQUFiQmk5Y0FBQUFBWE5TUjBJQXJzNGM2UUFBQUFSblFVMUJBQUN4and2OFlRVUFBQUFKY0VoWmN3QUFEc01BQUE3REFjZHZxR1FBQUFLVVNVUkJWRGhQZlpUTmkxSlJHTVp2TUlzV1VadHM1U0lYRllLMENNRS9JR2doeFZDN1dVb1UxTkJpeEkrbVJTRDRNUXpteHppS08zWFVCaFJtVUdaS2RCRzQwWEVHVTZkMEdGR1pjVDRxeFcxaGk3Znp2TndacUt3REQ1ejd2cy92dWVlZWUrNlZNSnhPNXdVaGhkdnRmdUh6K1Q0dExTMk5oZWdmR3NNREx4aXdISUloTGk1N1BKNzVWQ3IxWTM5L240YkRJWTFHbzRsQ0R4NTR3WUNWWXpqb1ZqUWEvZHh1dHlmQ2t3U3ZZSnBnT1NRZjcwOHR1QmExeVdSeS9MK1YvQ2w0d1lCRmhoVHhmTGh1bS9lc2lpSjF1MTJLUkNKa3NWaG9mWDJkVGs1T3prSE1VVU1QSG5qQjJGNTVWcEVoUGRlL0xieDhGcUJFSWtIcGRKb01CZ05wdFZyUzZYUlVxVlRPZzdhM3QybG1ab2IwZWoycDFXcjJnZ0dMRE9uSjNRU1pINGNvSG8vVHlzb0toeWdVQ3RKb05GUXNGbWt3R0xBd1I3aFNxU1NWU3NWZU1HQ1JJVDI5RjZmWEppOFh5K1V5bWMxbW1wNmVKb2ZEUWZWNm5VNVBUMW1ZMisxMjd1SHhTcVVTaDRGRmhoUUx2cnZ0Y3JtK1lwa0hCd2RVclZacGEydUxhclVhZFRvZE9qdzhaR0dPR25yd3dBc0dMREx3MWk0dUxyelJZZU9PajQ5cGIyK1BkbmQzcWRWcThTdEdBSVE1YW8xR2d6M3dnZ0dMREQ0QzRpemNFY1dmUjBkSGJNcmxjclN4c2NHYmpWQUlLOGxtczdTNXVjbUIvWDZmWHo5WURzRVFGemRqc1ZpdDJXenlxYzFrTXJ3ZlZxdVZqRVlqemMzTmtjbGtJcHZOUm10cmEreUJWekFmQlh0RGp1R2dTOEZnY0ZiYzhRdnVoak5TS0JRb0ZBcVI2TEZFbi9MNVBQZmdnWGQ1ZVhrV3JCekRRZEMxUUNCZ0ZvZXV0N096dy90eUJwMkZRemhQd3RPRkZ3elkzNFlvNEE5d1JYemREOExoY0U0OHduY0U5bm85RnVhb2lkNTc0YmtQTHhnWi8zdUk1cFRRVmZGbFAvTDcvV21oYjdKU1hxLzNJWHJ3eUhaNVNOSXZHQ25xeWgrSjcrZ0FBQUFBU1VWT1JLNUNZSUk9KSFpbXBvcnRhbnQ7YmFja2dyb3VuZC1wb3NpdGlvbjo1MCU7YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2N1cnNvcjpwb2ludGVyO2hlaWdodDozMHB4O3dpZHRoOjMwcHh9I2Vtb3RlLW1lbnUtYnV0dG9uOmZvY3Vze2JveC1zaGFkb3c6bm9uZX0jZW1vdGUtbWVudS1idXR0b24uYWN0aXZle2JveC1zaGFkb3c6MCAwIDZweCAwICM3ZDViYmUsaW5zZXQgMCAwIDAgMXB4IHJnYmEoMTAwLDY1LDE2NCwuNSl9LmVtb3RlLW1lbnV7cGFkZGluZzo1cHg7ei1pbmRleDoxMDAwO2Rpc3BsYXk6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOiMyMDIwMjA7cG9zaXRpb246YWJzb2x1dGV9LmVtb3RlLW1lbnUgYXtjb2xvcjojZmZmfS5lbW90ZS1tZW51IGE6aG92ZXJ7Y3Vyc29yOnBvaW50ZXI7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZTtjb2xvcjojY2NjfS5lbW90ZS1tZW51IC5lbW90ZXMtc3RhcnJlZHtoZWlnaHQ6MzhweH0uZW1vdGUtbWVudSAuZHJhZ2dhYmxle2JhY2tncm91bmQtaW1hZ2U6cmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgMTBweCk7Y3Vyc29yOm1vdmU7aGVpZ2h0OjdweDttYXJnaW4tYm90dG9tOjNweH0uZW1vdGUtbWVudSAuZHJhZ2dhYmxlOmhvdmVye2JhY2tncm91bmQtaW1hZ2U6cmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDEwcHgpfS5lbW90ZS1tZW51IC5oZWFkZXItaW5mb3tib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwO2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LC4wNSkgaW5zZXQ7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQodG8gdG9wLHRyYW5zcGFyZW50LHJnYmEoMCwwLDAsLjUpKTtwYWRkaW5nOjJweDtjb2xvcjojZGRkO3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOnJlbGF0aXZlfS5lbW90ZS1tZW51IC5oZWFkZXItaW5mbyBpbWd7bWFyZ2luLXJpZ2h0OjhweH0uZW1vdGUtbWVudSAuZW1vdGV7ZGlzcGxheTppbmxpbmUtYmxvY2s7cGFkZGluZzoycHg7bWFyZ2luOjFweDtjdXJzb3I6cG9pbnRlcjtib3JkZXItcmFkaXVzOjVweDt0ZXh0LWFsaWduOmNlbnRlcjtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDozMHB4O2hlaWdodDozMHB4O3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZTtib3JkZXI6MXB4IHNvbGlkIHRyYW5zcGFyZW50fS5lbW90ZS1tZW51LmVkaXRpbmcgLmVtb3Rle2N1cnNvcjphdXRvfS5lbW90ZS1tZW51IC5lbW90ZSBpbWd7bWF4LXdpZHRoOjEwMCU7bWF4LWhlaWdodDoxMDAlO21hcmdpbjphdXRvO3Bvc2l0aW9uOmFic29sdXRlO3RvcDowO2JvdHRvbTowO2xlZnQ6MDtyaWdodDowfS5lbW90ZS1tZW51IC5zaW5nbGUtcm93IC5lbW90ZS1jb250YWluZXJ7b3ZlcmZsb3c6aGlkZGVuO2hlaWdodDozN3B4fS5lbW90ZS1tZW51IC5zaW5nbGUtcm93IC5lbW90ZXtkaXNwbGF5OmlubGluZS1ibG9jazttYXJnaW4tYm90dG9tOjEwMHB4fS5lbW90ZS1tZW51IC5lbW90ZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsLjEpfS5lbW90ZS1tZW51IC5wdWxsLWxlZnR7ZmxvYXQ6bGVmdH0uZW1vdGUtbWVudSAucHVsbC1yaWdodHtmbG9hdDpyaWdodH0uZW1vdGUtbWVudSAuZm9vdGVye3RleHQtYWxpZ246Y2VudGVyO2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDA7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA1KSBpbnNldDtwYWRkaW5nOjVweCAwIDJweDttYXJnaW4tdG9wOjVweDtoZWlnaHQ6MThweH0uZW1vdGUtbWVudSAuZm9vdGVyIC5wdWxsLWxlZnR7bWFyZ2luLXJpZ2h0OjVweH0uZW1vdGUtbWVudSAuZm9vdGVyIC5wdWxsLXJpZ2h0e21hcmdpbi1sZWZ0OjVweH0uZW1vdGUtbWVudSAuaWNvbntoZWlnaHQ6MTZweDt3aWR0aDoxNnB4O29wYWNpdHk6LjU7YmFja2dyb3VuZC1zaXplOmNvbnRhaW4haW1wb3J0YW50fS5lbW90ZS1tZW51IC5pY29uOmhvdmVye29wYWNpdHk6MX0uZW1vdGUtbWVudSAuaWNvbi1ob21le2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTmpRaURRb2dJQ0JvWldsbmFIUTlJalkwSWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURZMElEWTBJZzBLSUNBZ2FXUTlJa05oY0dGZk1TSU5DaUFnSUhodGJEcHpjR0ZqWlQwaWNISmxjMlZ5ZG1VaVBqeHRaWFJoWkdGMFlRMEtJQ0FnYVdROUltMWxkR0ZrWVhSaE16QXdNU0krUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6STVPVGtpSUM4K0RRbzhjR0YwYUEwS0lDQWdaRDBpYlNBMU55NHdOaklzTXpFdU16azRJR01nTUM0NU16SXNMVEV1TURJMUlEQXVPRFF5TEMweUxqVTVOaUF0TUM0eU1ERXNMVE11TlRBNElFd2dNek11T0RnMExEY3VOemcxSUVNZ016SXVPRFF4TERZdU9EY3pJRE14TGpFMk9TdzJMamc1TWlBek1DNHhORGdzTnk0NE1qZ2dUQ0EzTGpBNU15d3lPQzQ1TmpJZ1l5QXRNUzR3TWpFc01DNDVNellnTFRFdU1EY3hMREl1TlRBMUlDMHdMakV4TVN3ekxqVXdNeUJzSURBdU5UYzRMREF1TmpBeUlHTWdNQzQ1TlRrc01DNDVPVGdnTWk0MU1Ea3NNUzR4TVRjZ015NDBOaXd3TGpJMk5TQnNJREV1TnpJekxDMHhMalUwTXlCMklESXlMalU1SUdNZ01Dd3hMak00TmlBeExqRXlNeXd5TGpVd09DQXlMalV3T0N3eUxqVXdPQ0JvSURndU9UZzNJR01nTVM0ek9EVXNNQ0F5TGpVd09Dd3RNUzR4TWpJZ01pNDFNRGdzTFRJdU5UQTRJRllnTXpndU5UYzFJR2dnTVRFdU5EWXpJSFlnTVRVdU9EQTBJR01nTFRBdU1ESXNNUzR6T0RVZ01DNDVOekVzTWk0MU1EY2dNaTR6TlRZc01pNDFNRGNnYUNBNUxqVXlOQ0JqSURFdU16ZzFMREFnTWk0MU1EZ3NMVEV1TVRJeUlESXVOVEE0TEMweUxqVXdPQ0JXSURNeUxqRXdOeUJqSURBc01DQXdMalEzTml3d0xqUXhOeUF4TGpBMk15d3dMamt6TXlBd0xqVTROaXd3TGpVeE5TQXhMamd4Tnl3d0xqRXdNaUF5TGpjME9Td3RNQzQ1TWpRZ2JDQXdMalkxTXl3dE1DNDNNVGdnZWlJTkNpQWdJR2xrUFNKd1lYUm9Nams1TlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptWm1abVk3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejQ9KSA1MCUgbm8tcmVwZWF0fS5lbW90ZS1tZW51IC5pY29uLWdlYXJ7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNakV1TlRraURRb2dJQ0JvWldsbmFIUTlJakl4TGpFek5qazVPU0lOQ2lBZ0lIWnBaWGRDYjNnOUlqQWdNQ0F5TVM0MU9TQXlNUzR4TXpjaURRb2dJQ0JwWkQwaVEyRndZVjh4SWcwS0lDQWdlRzFzT25Od1lXTmxQU0p3Y21WelpYSjJaU0krUEcxbGRHRmtZWFJoRFFvZ0lDQnBaRDBpYldWMFlXUmhkR0V6T1NJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jek0zSWlBdlBnMEtQSEJoZEdnTkNpQWdJR1E5SWswZ01UZ3VOakl5TERndU1UUTFJREU0TGpBM055dzJMamcxSUdNZ01Dd3dJREV1TWpZNExDMHlMamcyTVNBeExqRTFOaXd0TWk0NU56RWdUQ0F4Tnk0MU5UUXNNaTR5TkNCRElERTNMalF6T0N3eUxqRXlOeUF4TkM0MU56WXNNeTQwTXpNZ01UUXVOVGMyTERNdU5ETXpJRXdnTVRNdU1qVTJMREl1T1NCRElERXpMakkxTml3eUxqa2dNVEl1TURrc01DQXhNUzQ1TXl3d0lFZ2dPUzQxTmpFZ1F5QTVMak01Tml3d0lEZ3VNekUzTERJdU9UQTJJRGd1TXpFM0xESXVPVEEySUV3Z05pNDVPVGtzTXk0ME5ERWdZeUF3TERBZ0xUSXVPVEl5TEMweExqSTBNaUF0TXk0d016UXNMVEV1TVRNeElFd2dNaTR5T0Rrc015NDVOVEVnUXlBeUxqRTNNeXcwTGpBMk5DQXpMalV3Tnl3MkxqZzJOeUF6TGpVd055dzJMamcyTnlCTUlESXVPVFl5TERndU1UWWdReUF5TGprMk1pdzRMakUySURBc09TNHpNREVnTUN3NUxqUTFOU0IySURJdU16SXlJR01nTUN3d0xqRTJNaUF5TGprMk9Td3hMakl4T1NBeUxqazJPU3d4TGpJeE9TQnNJREF1TlRRMUxERXVNamt4SUdNZ01Dd3dJQzB4TGpJMk9Dd3lMamcxT1NBdE1TNHhOVGNzTWk0NU5qa2diQ0F4TGpZM09Dd3hMalkwTXlCaklEQXVNVEUwTERBdU1URXhJREl1T1RjM0xDMHhMakU1TlNBeUxqazNOeXd0TVM0eE9UVWdiQ0F4TGpNeU1Td3dMalV6TlNCaklEQXNNQ0F4TGpFMk5pd3lMamc1T0NBeExqTXlOeXd5TGpnNU9DQm9JREl1TXpZNUlHTWdNQzR4TmpRc01DQXhMakkwTkN3dE1pNDVNRFlnTVM0eU5EUXNMVEl1T1RBMklHd2dNUzR6TWpJc0xUQXVOVE0xSUdNZ01Dd3dJREl1T1RFMkxERXVNalF5SURNdU1ESTVMREV1TVRNeklHd2dNUzQyTnpnc0xURXVOalF4SUdNZ01DNHhNVGNzTFRBdU1URTFJQzB4TGpJeUxDMHlMamt4TmlBdE1TNHlNaXd0TWk0NU1UWWdiQ0F3TGpVME5Dd3RNUzR5T1RNZ1l5QXdMREFnTWk0NU5qTXNMVEV1TVRReklESXVPVFl6TEMweExqSTVPU0JXSURrdU16WWdReUF5TVM0MU9TdzVMakU1T1NBeE9DNDJNaklzT0M0eE5EVWdNVGd1TmpJeUxEZ3VNVFExSUhvZ2JTQXROQzR6TmpZc01pNDBNak1nWXlBd0xERXVPRFkzSUMweExqVTFNeXd6TGpNNE55QXRNeTQwTmpFc015NHpPRGNnTFRFdU9UQTJMREFnTFRNdU5EWXhMQzB4TGpVeUlDMHpMalEyTVN3dE15NHpPRGNnTUN3dE1TNDROamNnTVM0MU5UVXNMVE11TXpnMUlETXVORFl4TEMwekxqTTROU0F4TGprd09Td3dMakF3TVNBekxqUTJNU3d4TGpVeE9DQXpMalEyTVN3ekxqTTROU0I2SWcwS0lDQWdhV1E5SW5CaGRHZ3pJZzBLSUNBZ2MzUjViR1U5SW1acGJHdzZJMFpHUmtaR1JpSWdMejROQ2p4bkRRb2dJQ0JwWkQwaVp6VWlQZzBLUEM5blBnMEtQR2NOQ2lBZ0lHbGtQU0puTnlJK0RRbzhMMmMrRFFvOFp3MEtJQ0FnYVdROUltYzVJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFeElqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekV6SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RTFJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFM0lqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekU1SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6SXhJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJeklqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekkxSWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6STNJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJNUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaek14SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6TXpJajROQ2p3dlp6NE5Dand2YzNablBnMEspIDUwJSBuby1yZXBlYXR9LmVtb3RlLW1lbnUuZWRpdGluZyAuaWNvbi1nZWFyey13ZWJraXQtYW5pbWF0aW9uOnNwaW4gNHMgbGluZWFyIGluZmluaXRlO2FuaW1hdGlvbjpzcGluIDRzIGxpbmVhciBpbmZpbml0ZX0uZW1vdGUtbWVudSAuaWNvbi1yZXNpemUtaGFuZGxle2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTVRZaURRb2dJQ0JvWldsbmFIUTlJakUySWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURFMklERTJJZzBLSUNBZ2FXUTlJa05oY0dGZk1TSU5DaUFnSUhodGJEcHpjR0ZqWlQwaWNISmxjMlZ5ZG1VaVBqeHRaWFJoWkdGMFlRMEtJQ0FnYVdROUltMWxkR0ZrWVhSaE5ETTFOeUkrUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6UXpOVFVpSUM4K0RRbzhjR0YwYUEwS0lDQWdaRDBpVFNBeE15NDFMRGdnUXlBeE15NHlNalVzT0NBeE15dzRMakl5TkNBeE15dzRMalVnZGlBekxqYzVNeUJNSURNdU56QTNMRE1nU0NBM0xqVWdReUEzTGpjM05pd3pJRGdzTWk0M056WWdPQ3d5TGpVZ09Dd3lMakl5TkNBM0xqYzNOaXd5SURjdU5Td3lJR2dnTFRVZ1RDQXlMak13T1N3eUxqQXpPU0F5TGpFMUxESXVNVFEwSURJdU1UUTJMREl1TVRRMklESXVNVFF6TERJdU1UVXlJREl1TURNNUxESXVNekE1SURJc01pNDFJSFlnTlNCRElESXNOeTQzTnpZZ01pNHlNalFzT0NBeUxqVXNPQ0F5TGpjM05pdzRJRE1zTnk0M056WWdNeXczTGpVZ1ZpQXpMamN3TnlCTUlERXlMakk1TXl3eE15QklJRGd1TlNCRElEZ3VNakkwTERFeklEZ3NNVE11TWpJMUlEZ3NNVE11TlNBNExERXpMamMzTlNBNExqSXlOQ3d4TkNBNExqVXNNVFFnYUNBMUlHd2dNQzR4T1RFc0xUQXVNRE01SUdNZ01DNHhNakVzTFRBdU1EVXhJREF1TWpJc0xUQXVNVFE0SURBdU1qY3NMVEF1TWpjZ1RDQXhOQ3d4TXk0MU1ESWdWaUE0TGpVZ1F5QXhOQ3c0TGpJeU5DQXhNeTQzTnpVc09DQXhNeTQxTERnZ2VpSU5DaUFnSUdsa1BTSndZWFJvTkRNMU1TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTm1abVptWm1ZN1ptbHNiQzF2Y0dGamFYUjVPakVpSUM4K0RRbzhMM04yWno0PSkgNTAlIG5vLXJlcGVhdDtjdXJzb3I6bndzZS1yZXNpemUhaW1wb3J0YW50fS5lbW90ZS1tZW51IC5pY29uLXBpbntiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UWWlEUW9nSUNCb1pXbG5hSFE5SWpFMklnMEtJQ0FnYVdROUluTjJaek13TURVaVBnMEtJQ0E4YldWMFlXUmhkR0VOQ2lBZ0lDQWdhV1E5SW0xbGRHRmtZWFJoTXpBeU15SStEUW9nSUNBZ1BISmtaanBTUkVZK0RRb2dJQ0FnSUNBOFkyTTZWMjl5YXcwS0lDQWdJQ0FnSUNBZ2NtUm1PbUZpYjNWMFBTSWlQZzBLSUNBZ0lDQWdJQ0E4WkdNNlptOXliV0YwUG1sdFlXZGxMM04yWnl0NGJXdzhMMlJqT21admNtMWhkRDROQ2lBZ0lDQWdJQ0FnUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUNBZ2NtUm1PbkpsYzI5MWNtTmxQU0pvZEhSd09pOHZjSFZ5YkM1dmNtY3ZaR012WkdOdGFYUjVjR1V2VTNScGJHeEpiV0ZuWlNJZ0x6NE5DaUFnSUNBZ0lDQWdQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrRFFvZ0lDQWdJQ0E4TDJOak9sZHZjbXMrRFFvZ0lDQWdQQzl5WkdZNlVrUkdQZzBLSUNBOEwyMWxkR0ZrWVhSaFBnMEtJQ0E4WkdWbWN3MEtJQ0FnSUNCcFpEMGlaR1ZtY3pNd01qRWlJQzgrRFFvZ0lEeG5EUW9nSUNBZ0lIUnlZVzV6Wm05eWJUMGliV0YwY21sNEtEQXVOemt6TURjNE1pd3dMREFzTUM0M09UTXdOemd5TEMweUxqRTNNRGs0TlN3dE9ERTBMalk1TWprNUtTSU5DaUFnSUNBZ2FXUTlJbWN6TURBM0lqNE5DaUFnSUNBOFp3MEtJQ0FnSUNBZ0lIUnlZVzV6Wm05eWJUMGliV0YwY21sNEtEQXVOekEzTVRFc01DNDNNRGN4TVN3dE1DNDNNRGN4TVN3d0xqY3dOekV4TERjek55NDNNRGMxTlN3eU9UVXVORGc0TURncElnMEtJQ0FnSUNBZ0lHbGtQU0puTXpBd09TSStEUW9nSUNBZ0lDQThadzBLSUNBZ0lDQWdJQ0FnYVdROUltY3pOelUxSWo0TkNpQWdJQ0FnSUNBZ1BIQmhkR2dOQ2lBZ0lDQWdJQ0FnSUNBZ1pEMGlUU0E1TGpjNE1USTFMREFnUXlBNUxqUTNOREExTmpJc01DNDJPRGt4TVRJZ09TNDFNakEyT0N3eExqVXlNekE0TlRNZ09TNHpNVEkxTERJdU1UZzNOU0JNSURRdU9UTTNOU3cyTGpVNU16YzFJRU1nTXk0NU5UZzVOakE0TERZdU5ESTVORGd6SURJdU9UUTNOelUwT0N3MkxqVXpNamM0T1RrZ01pdzJMamd4TWpVZ1RDQTFMakF6TVRJMUxEa3VPRFF6TnpVZ01DNDFOakkxTERFMExqTXhNalVnTUN3eE5pQkRJREF1TlRZNU1qazJNamdzTVRVdU56azFOakkySURFdU1UWTNOek0zT0N3eE5TNDJOREF5TXpjZ01TNDNNVGczTlN3eE5TNDBNRFl5TlNCTUlEWXVNVFUyTWpVc01UQXVPVFk0TnpVZ09TNHhPRGMxTERFMElHTWdNQzR5TnprMk9ESXpMQzB3TGprME56YzRNeUF3TGpNNE16RTFNamdzTFRFdU9UVTRPVE0zSURBdU1qRTROelVzTFRJdU9UTTNOU0F4TGpVd01EQXhNU3d0TVM0ME9EazFOems0SURNdU1EQXdNREF4TEMweUxqazNPVEUxT1NBMExqVXNMVFF1TkRZNE56VWdNQzQyTURFeE1ESXNMVEF1TURNeE16WXhJREV1T0RJeU1UTTRMQzB3TGpBNU5qRXpOeUF5TEMwd0xqUTJPRGMxSUVNZ01UTXVPRGM1T0RreUxEUXVNRFk1TkRnd015QXhNUzQ0TkRJNE5qVXNNaTR3TWpBeU1qZ3lJRGt1TnpneE1qVXNNQ0I2SWcwS0lDQWdJQ0FnSUNBZ0lDQjBjbUZ1YzJadmNtMDlJbTFoZEhKcGVDZ3dMamc1TVRVNU16YzBMQzB3TGpnNU1UVTVNemMwTERBdU9Ea3hOVGt6TnpRc01DNDRPVEUxT1RNM05Dd3RNaTR5TmpVMUxERXdNemN1TVRNME5Ta2lEUW9nSUNBZ0lDQWdJQ0FnSUdsa1BTSndZWFJvTXpBeE1TSU5DaUFnSUNBZ0lDQWdJQ0FnYzNSNWJHVTlJbVpwYkd3NkkyWm1abVptWmp0bWFXeHNMVzl3WVdOcGRIazZNU0lnTHo0TkNpQWdJQ0FnSUR3dlp6NE5DaUFnSUNBOEwyYytEUW9nSUR3dlp6NE5Dand2YzNablBnMEspIDUwJSBuby1yZXBlYXQ7dHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlfS5lbW90ZS1tZW51IC5pY29uLXBpbjpob3ZlciwuZW1vdGUtbWVudS5waW5uZWQgLmljb24tcGluey13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3RyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTtvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLmVkaXQtdG9vbHtiYWNrZ3JvdW5kLXBvc2l0aW9uOjUwJTtiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7YmFja2dyb3VuZC1zaXplOjE0cHg7Ym9yZGVyLXJhZGl1czo0cHg7Ym9yZGVyOjFweCBzb2xpZCAjMDAwO2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6bm9uZTtoZWlnaHQ6MTRweDtvcGFjaXR5Oi4yNTtwb3NpdGlvbjphYnNvbHV0ZTt0cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7d2lkdGg6MTRweDt6LWluZGV4OjF9LmVtb3RlLW1lbnUgLmVkaXQtdG9vbDpob3ZlciwuZW1vdGUtbWVudSAuZW1vdGU6aG92ZXIgLmVkaXQtdG9vbHtvcGFjaXR5OjF9LmVtb3RlLW1lbnUgLmVkaXQtdmlzaWJpbGl0eXtiYWNrZ3JvdW5kLWNvbG9yOiMwMGM4MDA7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVEF3SWcwS0lDQWdhR1ZwWjJoMFBTSXhNREFpRFFvZ0lDQjJhV1YzUW05NFBTSXdJREFnTVRBd0lERXdNQ0lOQ2lBZ0lHbGtQU0pNWVhsbGNsOHhJZzBLSUNBZ2VHMXNPbk53WVdObFBTSndjbVZ6WlhKMlpTSStQRzFsZEdGa1lYUmhEUW9nSUNCcFpEMGliV1YwWVdSaGRHRTVJajQ4Y21SbU9sSkVSajQ4WTJNNlYyOXlhdzBLSUNBZ0lDQWdJSEprWmpwaFltOTFkRDBpSWo0OFpHTTZabTl5YldGMFBtbHRZV2RsTDNOMlp5dDRiV3c4TDJSak9tWnZjbTFoZEQ0OFpHTTZkSGx3WlEwS0lDQWdJQ0FnSUNBZ2NtUm1PbkpsYzI5MWNtTmxQU0pvZEhSd09pOHZjSFZ5YkM1dmNtY3ZaR012WkdOdGFYUjVjR1V2VTNScGJHeEpiV0ZuWlNJZ0x6NDhaR002ZEdsMGJHVStQQzlrWXpwMGFYUnNaVDQ4TDJOak9sZHZjbXMrUEM5eVpHWTZVa1JHUGp3dmJXVjBZV1JoZEdFK1BHUmxabk1OQ2lBZ0lHbGtQU0prWldaek55SWdMejROQ2p4d1lYUm9EUW9nSUNCa1BTSk5JRGszTGprMk5DdzBOaTQxTkRnZ1F5QTVOeTR3T1Rnc05EVXVOVEk0SURjMkxqUXlOeXd5TVM0Mk1ETWdOVEFzTWpFdU5qQXpJR01nTFRJMkxqUXlOeXd3SUMwME55NHdPVGdzTWpNdU9USTFJQzAwTnk0NU5qVXNNalF1T1RRMklDMHhMamN3TVN3eUlDMHhMamN3TVN3MExqa3dNaUF4TUdVdE5DdzJMamt3TXlBd0xqZzJOaXd4TGpBeUlESXhMalV6Tnl3eU5DNDVORFVnTkRjdU9UWTBMREkwTGprME5TQXlOaTQwTWpjc01DQTBOeTR3T1Rnc0xUSXpMamt5TmlBME55NDVOalVzTFRJMExqazBOaUF4TGpjd01Td3RNaUF4TGpjd01Td3ROQzQ1TURJZ0xUQXVNREF4TEMwMkxqa3dNeUI2SUUwZ05UZ3VNRGN6TERNMUxqazNOU0JqSURFdU56YzNMQzB3TGprM0lEUXVNalUxTERBdU1UUXpJRFV1TlRNMExESXVORGcxSURFdU1qYzVMREl1TXpReklEQXVPRGMxTERVdU1ESTVJQzB3TGprd01pdzFMams1T1NBdE1TNDNOemNzTUM0NU56RWdMVFF1TWpVMUxDMHdMakUwTXlBdE5TNDFNelVzTFRJdU5EZzFJQzB4TGpJM09Td3RNaTR6TkRNZ0xUQXVPRGMxTEMwMUxqQXlPU0F3TGprd015d3ROUzQ1T1RrZ2VpQk5JRFV3TERZNUxqY3lPU0JESURNeExqVTBMRFk1TGpjeU9TQXhOaTR3TURVc05UVXVOVFV6SURFd0xqWXlPQ3cxTUNBeE5DNHlOVGtzTkRZdU1qUTVJREl5TGpVeU5pd3pPQzQxTnpFZ016TXVNVGsxTERNekxqazNPU0F6TVM0eE1UUXNNemN1TVRRMUlESTVMamc1TkN3ME1DNDVNamdnTWprdU9EazBMRFExSUdNZ01Dd3hNUzR4TURRZ09TNHdNREVzTWpBdU1UQTFJREl3TGpFd05Td3lNQzR4TURVZ01URXVNVEEwTERBZ01qQXVNVEEyTEMwNUxqQXdNU0F5TUM0eE1EWXNMVEl3TGpFd05TQXdMQzAwTGpBM01pQXRNUzR5TVRrc0xUY3VPRFUxSUMwekxqTXNMVEV4TGpBeU1TQkRJRGMzTGpRM05Dd3pPQzQxTnpJZ09EVXVOelF4TERRMkxqSTFJRGc1TGpNM01pdzFNQ0E0TXk0NU9UVXNOVFV1TlRVMUlEWTRMalEyTERZNUxqY3lPU0ExTUN3Mk9TNDNNamtnZWlJTkNpQWdJR2xrUFNKd1lYUm9NeUlnTHo0TkNqd3ZjM1puUGc9PSl9LmVtb3RlLW1lbnUgLmVkaXQtc3RhcnJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMzMjMyMzI7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlOVEFpRFFvZ0lDQm9aV2xuYUhROUlqVXdJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJRFV3SURVd0lnMEtJQ0FnYVdROUlreGhlV1Z5WHpFaURRb2dJQ0I0Yld3NmMzQmhZMlU5SW5CeVpYTmxjblpsSWo0OGJXVjBZV1JoZEdFTkNpQWdJR2xrUFNKdFpYUmhaR0YwWVRNd01ERWlQanh5WkdZNlVrUkdQanhqWXpwWGIzSnJEUW9nSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGp4a1l6cG1iM0p0WVhRK2FXMWhaMlV2YzNabkszaHRiRHd2WkdNNlptOXliV0YwUGp4a1l6cDBlWEJsRFFvZ0lDQWdJQ0FnSUNCeVpHWTZjbVZ6YjNWeVkyVTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlrWTIxcGRIbHdaUzlUZEdsc2JFbHRZV2RsSWlBdlBqeGtZenAwYVhSc1pUNDhMMlJqT25ScGRHeGxQand2WTJNNlYyOXlhejQ4TDNKa1pqcFNSRVkrUEM5dFpYUmhaR0YwWVQ0OFpHVm1jdzBLSUNBZ2FXUTlJbVJsWm5NeU9UazVJaUF2UGcwS1BIQmhkR2dOQ2lBZ0lHUTlJbTBnTkRNdU1EUXNNakl1TmprMklDMDNMalUyT0N3M0xqTTNOeUF4TGpjNE55d3hNQzQwTVRjZ1l5QXdMakV5Tnl3d0xqYzFJQzB3TGpFNE1pd3hMalV3T1NBdE1DNDNPVGNzTVM0NU5UY2dMVEF1TXpRNExEQXVNalV6SUMwd0xqYzJNaXd3TGpNNE1pQXRNUzR4TnpZc01DNHpPRElnTFRBdU16RTRMREFnTFRBdU5qTTRMQzB3TGpBM05pQXRNQzQ1TXpFc0xUQXVNak1nVENBeU5Td3pOeTQyT0RFZ01UVXVOalExTERReUxqVTVPU0JqSUMwd0xqWTNOQ3d3TGpNMU5TQXRNUzQwT1N3d0xqSTVOU0F0TWk0eE1EY3NMVEF1TVRVeElFTWdNVEl1T1RJekxEUXlJREV5TGpZeE5DdzBNUzR5TkRJZ01USXVOelF6TERRd0xqUTVNU0JNSURFMExqVXpMRE13TGpBM05DQTJMamsyTWl3eU1pNDJPVGNnUXlBMkxqUXhOU3d5TWk0eE5qWWdOaTR5TWpFc01qRXVNemN4SURZdU5EVTBMREl3TGpZME55QTJMalk1TERFNUxqa3lNeUEzTGpNeE5Td3hPUzR6T1RZZ09DNHdOamtzTVRrdU1qZzJJR3dnTVRBdU5EVTVMQzB4TGpVeU1TQTBMalk0TEMwNUxqUTNPQ0JESURJekxqVTBNeXczTGpZd015QXlOQzR5TXprc055NHhOekVnTWpVc055NHhOekVnWXlBd0xqYzJNeXd3SURFdU5EVTJMREF1TkRNeUlERXVOemt6TERFdU1URTFJR3dnTkM0Mk56a3NPUzQwTnpnZ01UQXVORFl4TERFdU5USXhJR01nTUM0M05USXNNQzR4TURrZ01TNHpOemtzTUM0Mk16Y2dNUzQyTVRJc01TNHpOakVnTUM0eU16Y3NNQzQzTWpRZ01DNHdNemdzTVM0MU1Ua2dMVEF1TlRBMUxESXVNRFVnZWlJTkNpQWdJR2xrUFNKd1lYUm9Nams1TlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lOalkyTmpZMk03Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejROQ2c9PSl9LmVtb3RlLW1lbnUgLmVtb3RlPi5lZGl0LXZpc2liaWxpdHl7Ym90dG9tOmF1dG87bGVmdDphdXRvO3JpZ2h0OjA7dG9wOjB9LmVtb3RlLW1lbnUgLmVtb3RlPi5lZGl0LXN0YXJyZWR7Ym90dG9tOmF1dG87bGVmdDowO3JpZ2h0OmF1dG87dG9wOjB9LmVtb3RlLW1lbnUgLmhlYWRlci1pbmZvPi5lZGl0LXRvb2x7bWFyZ2luLWxlZnQ6NXB4fS5lbW90ZS1tZW51LmVkaXRpbmcgLmVkaXQtdG9vbHtkaXNwbGF5OmlubGluZS1ibG9ja30uZW1vdGUtbWVudSAuZW1vdGUtbWVudS1oaWRkZW4gLmVkaXQtdmlzaWJpbGl0eXtiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UQXdJZzBLSUNBZ2FHVnBaMmgwUFNJeE1EQWlEUW9nSUNCMmFXVjNRbTk0UFNJd0lEQWdNVEF3SURFd01DSU5DaUFnSUdsa1BTSk1ZWGxsY2w4eklnMEtJQ0FnZUcxc09uTndZV05sUFNKd2NtVnpaWEoyWlNJK1BHMWxkR0ZrWVhSaERRb2dJQ0JwWkQwaWJXVjBZV1JoZEdFeE5TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pFeklpQXZQZzBLUEdjTkNpQWdJR2xrUFNKbk15SStEUW9KUEhCaGRHZ05DaUFnSUdROUlrMGdOekF1TURneUxEUTFMalEzTlNBMU1DNDBOelFzTmpVdU1EZ3lJRU1nTmpFdU1UazRMRFkwTGpnek1TQTJPUzQ0TXpFc05UWXVNVGszSURjd0xqQTRNaXcwTlM0ME56VWdlaUlOQ2lBZ0lHbGtQU0p3WVhSb05TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTkdSa1pHUmtZaUlDOCtEUW9KUEhCaGRHZ05DaUFnSUdROUltMGdPVGN1T1RZMExEUTJMalUwT0NCaklDMHdMalExTEMwd0xqVXlPU0F0Tmk0eU5EVXNMVGN1TWpNZ0xURTFMalF3TXl3dE1UTXVOVFUwSUd3Z0xUWXVNaXcyTGpJZ1F5QTRNaTR6TlRFc05ETXVNVFE0SURnMkxqa3lMRFEzTGpRMk9TQTRPUzR6TnpJc05UQWdPRE11T1RrMUxEVTFMalUxTlNBMk9DNDBOaXcyT1M0M01qa2dOVEFzTmprdU56STVJR01nTFRFdU16TTBMREFnTFRJdU5qVXhMQzB3TGpBNE1pQXRNeTQ1TlRJc0xUQXVNakl5SUd3Z0xUY3VORE01TERjdU5ETTVJR01nTXk0Mk16a3NNQzQ1TURrZ055NDBORGtzTVM0ME5TQXhNUzR6T1RFc01TNDBOU0F5Tmk0ME1qY3NNQ0EwTnk0d09UZ3NMVEl6TGpreU5pQTBOeTQ1TmpVc0xUSTBMamswTmlBeExqY3dNU3d0TVM0NU9Ua2dNUzQzTURFc0xUUXVPVEF4SUMwd0xqQXdNU3d0Tmk0NU1ESWdlaUlOQ2lBZ0lHbGtQU0p3WVhSb055SU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTkdSa1pHUmtZaUlDOCtEUW9KUEhCaGRHZ05DaUFnSUdROUltMGdPVEV1TkRFeExERTJMalkySUdNZ01Dd3RNQzR5TmpZZ0xUQXVNVEExTEMwd0xqVXlJQzB3TGpJNU15d3RNQzQzTURjZ2JDQXROeTR3TnpFc0xUY3VNRGNnWXlBdE1DNHpPVEVzTFRBdU16a3hJQzB4TGpBeU15d3RNQzR6T1RFZ0xURXVOREUwTERBZ1RDQTJOaTQ0TURRc01qUXVOekV4SUVNZ05qRXVOakF5TERJeUxqZ3hPQ0ExTlM0NU5Ea3NNakV1TmpBeklEVXdMREl4TGpZd015QmpJQzB5Tmk0ME1qY3NNQ0F0TkRjdU1EazRMREl6TGpreU5pQXRORGN1T1RZMUxESTBMamswTmlBdE1TNDNNREVzTWlBdE1TNDNNREVzTkM0NU1ESWdNVEJsTFRRc05pNDVNRE1nTUM0MU1UY3NNQzQyTURjZ09DNHdPRE1zT1M0ek5UUWdNVGt1TnpBM0xERTJMak15SUV3Z09DNDRPRE1zT0RJdU5qTXlJRU1nT0M0Mk9UVXNPREl1T0RJZ09DNDFPU3c0TXk0d056TWdPQzQxT1N3NE15NHpNemtnWXlBd0xEQXVNalkySURBdU1UQTFMREF1TlRJZ01DNHlPVE1zTUM0M01EY2diQ0EzTGpBM01TdzNMakEzSUdNZ01DNHhPVFVzTUM0eE9UVWdNQzQwTlRFc01DNHlPVE1nTUM0M01EY3NNQzR5T1RNZ01DNHlOVFlzTUNBd0xqVXhNaXd0TUM0d09UZ2dNQzQzTURjc0xUQXVNamt6SUd3Z056TXVOelVzTFRjekxqYzFJR01nTUM0eE9EY3NMVEF1TVRnMklEQXVNamt6TEMwd0xqUTBJREF1TWprekxDMHdMamN3TmlCNklFMGdNVEF1TmpJNExEVXdJRU1nTVRRdU1qVTVMRFEyTGpJME9TQXlNaTQxTWpZc016Z3VOVGN4SURNekxqRTVOU3d6TXk0NU56a2dNekV1TVRFMExETTNMakUwTlNBeU9TNDRPVFFzTkRBdU9USTRJREk1TGpnNU5DdzBOU0JqSURBc05DNDJOalVnTVM0Mk1ERXNPQzQ1TkRVZ05DNHlOeXd4TWk0ek5URWdUQ0F5T0M0d05DdzJNeTQwTnpVZ1F5QXhPUzQ0T0Rnc05UZ3VPVFUxSURFekxqWTBPU3cxTXk0eE1pQXhNQzQyTWpnc05UQWdlaUlOQ2lBZ0lHbGtQU0p3WVhSb09TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTkdSa1pHUmtZaUlDOCtEUW84TDJjK0RRbzhMM04yWno0TkNnPT0pO2JhY2tncm91bmQtY29sb3I6cmVkfS5lbW90ZS1tZW51IC5lbW90ZS1tZW51LXN0YXJyZWQgLmVkaXQtc3RhcnJlZHtiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU5UQWlEUW9nSUNCb1pXbG5hSFE5SWpVd0lnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lEVXdJRFV3SWcwS0lDQWdhV1E5SWt4aGVXVnlYekVpRFFvZ0lDQjRiV3c2YzNCaFkyVTlJbkJ5WlhObGNuWmxJajQ4YldWMFlXUmhkR0VOQ2lBZ0lHbGtQU0p0WlhSaFpHRjBZVE13TURFaVBqeHlaR1k2VWtSR1BqeGpZenBYYjNKckRRb2dJQ0FnSUNBZ2NtUm1PbUZpYjNWMFBTSWlQanhrWXpwbWIzSnRZWFErYVcxaFoyVXZjM1puSzNodGJEd3ZaR002Wm05eWJXRjBQanhrWXpwMGVYQmxEUW9nSUNBZ0lDQWdJQ0J5WkdZNmNtVnpiM1Z5WTJVOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWtZMjFwZEhsd1pTOVRkR2xzYkVsdFlXZGxJaUF2UGp4a1l6cDBhWFJzWlQ0OEwyUmpPblJwZEd4bFBqd3ZZMk02VjI5eWF6NDhMM0prWmpwU1JFWStQQzl0WlhSaFpHRjBZVDQ4WkdWbWN3MEtJQ0FnYVdROUltUmxabk15T1RrNUlpQXZQZzBLUEhCaGRHZ05DaUFnSUdROUltMGdORE11TURRc01qSXVOamsySUMwM0xqVTJPQ3czTGpNM055QXhMamM0Tnl3eE1DNDBNVGNnWXlBd0xqRXlOeXd3TGpjMUlDMHdMakU0TWl3eExqVXdPU0F0TUM0M09UY3NNUzQ1TlRjZ0xUQXVNelE0TERBdU1qVXpJQzB3TGpjMk1pd3dMak00TWlBdE1TNHhOellzTUM0ek9ESWdMVEF1TXpFNExEQWdMVEF1TmpNNExDMHdMakEzTmlBdE1DNDVNekVzTFRBdU1qTWdUQ0F5TlN3ek55NDJPREVnTVRVdU5qUTFMRFF5TGpVNU9TQmpJQzB3TGpZM05Dd3dMak0xTlNBdE1TNDBPU3d3TGpJNU5TQXRNaTR4TURjc0xUQXVNVFV4SUVNZ01USXVPVEl6TERReUlERXlMall4TkN3ME1TNHlORElnTVRJdU56UXpMRFF3TGpRNU1TQk1JREUwTGpVekxETXdMakEzTkNBMkxqazJNaXd5TWk0Mk9UY2dReUEyTGpReE5Td3lNaTR4TmpZZ05pNHlNakVzTWpFdU16Y3hJRFl1TkRVMExESXdMalkwTnlBMkxqWTVMREU1TGpreU15QTNMak14TlN3eE9TNHpPVFlnT0M0d05qa3NNVGt1TWpnMklHd2dNVEF1TkRVNUxDMHhMalV5TVNBMExqWTRMQzA1TGpRM09DQkRJREl6TGpVME15dzNMall3TXlBeU5DNHlNemtzTnk0eE56RWdNalVzTnk0eE56RWdZeUF3TGpjMk15d3dJREV1TkRVMkxEQXVORE15SURFdU56a3pMREV1TVRFMUlHd2dOQzQyTnprc09TNDBOemdnTVRBdU5EWXhMREV1TlRJeElHTWdNQzQzTlRJc01DNHhNRGtnTVM0ek56a3NNQzQyTXpjZ01TNDJNVElzTVM0ek5qRWdNQzR5TXpjc01DNDNNalFnTUM0d016Z3NNUzQxTVRrZ0xUQXVOVEExTERJdU1EVWdlaUlOQ2lBZ0lHbGtQU0p3WVhSb01qazVOU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1Oak1EQTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6NE5DZz09KX0uZW1vdGUtbWVudSAuZW1vdGUuZW1vdGUtbWVudS1zdGFycmVke2JvcmRlci1jb2xvcjpyZ2JhKDIwMCwyMDAsMCwuNSl9LmVtb3RlLW1lbnUgLmVtb3RlLmVtb3RlLW1lbnUtaGlkZGVue2JvcmRlci1jb2xvcjpyZ2JhKDI1NSwwLDAsLjUpfS5lbW90ZS1tZW51ICNzdGFycmVkLWVtb3Rlcy1ncm91cCAuZW1vdGU6bm90KC5lbW90ZS1tZW51LXN0YXJyZWQpLC5lbW90ZS1tZW51Om5vdCguZWRpdGluZykgLmVtb3RlLW1lbnUtaGlkZGVue2Rpc3BsYXk6bm9uZX0uZW1vdGUtbWVudTpub3QoLmVkaXRpbmcpICNzdGFycmVkLWVtb3Rlcy1ncm91cCAuZW1vdGUtbWVudS1zdGFycmVke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudH0uZW1vdGUtbWVudSAjc3RhcnJlZC1lbW90ZXMtZ3JvdXB7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6IzY0NjQ2NH0uZW1vdGUtbWVudSAjc3RhcnJlZC1lbW90ZXMtZ3JvdXA6ZW1wdHk6YmVmb3Jle2NvbnRlbnQ6XFxcIlVzZSB0aGUgZWRpdCBtb2RlIHRvIHN0YXIgYW4gZW1vdGUhXFxcIjtwb3NpdGlvbjpyZWxhdGl2ZTt0b3A6OHB4fS5lbW90ZS1tZW51IC5zY3JvbGxhYmxle2hlaWdodDpjYWxjKDEwMCUgLSAxMDFweCk7b3ZlcmZsb3cteTphdXRvfS5lbW90ZS1tZW51IC5zdGlja3l7cG9zaXRpb246YWJzb2x1dGU7Ym90dG9tOjA7d2lkdGg6MTAwJX0uZW1vdGUtbWVudSAuZW1vdGUtbWVudS1pbm5lcntwb3NpdGlvbjpyZWxhdGl2ZTttYXgtaGVpZ2h0OjEwMCU7aGVpZ2h0OjEwMCV9XCIpKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBIb2dhbiA9IHJlcXVpcmUoJ2hvZ2FuLmpzL2xpYi90ZW1wbGF0ZS5qcycpO1xuICAgIHZhciB0ZW1wbGF0ZXMgPSB7fTtcbiAgICB0ZW1wbGF0ZXNbJ2Vtb3RlJ10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIjxkaXYgY2xhc3M9XFxcImVtb3RlXCIpO2lmKHQucyh0LmYoXCJ0aGlyZFBhcnR5XCIsYyxwLDEpLGMscCwwLDMyLDQ0LFwie3sgfX1cIikpe3QucnMoYyxwLGZ1bmN0aW9uKGMscCx0KXt0LmIoXCIgdGhpcmQtcGFydHlcIik7fSk7Yy5wb3AoKTt9aWYoIXQucyh0LmYoXCJpc1Zpc2libGVcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXt0LmIoXCIgZW1vdGUtbWVudS1oaWRkZW5cIik7fTtpZih0LnModC5mKFwiaXNTdGFycmVkXCIsYyxwLDEpLGMscCwwLDExOSwxMzgsXCJ7eyB9fVwiKSl7dC5ycyhjLHAsZnVuY3Rpb24oYyxwLHQpe3QuYihcIiBlbW90ZS1tZW51LXN0YXJyZWRcIik7fSk7Yy5wb3AoKTt9dC5iKFwiXFxcIiBkYXRhLWVtb3RlPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIiB0aXRsZT1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO2lmKHQucyh0LmYoXCJ0aGlyZFBhcnR5XCIsYyxwLDEpLGMscCwwLDIwNiwyMjksXCJ7eyB9fVwiKSl7dC5ycyhjLHAsZnVuY3Rpb24oYyxwLHQpe3QuYihcIiAoZnJvbSAzcmQgcGFydHkgYWRkb24pXCIpO30pO2MucG9wKCk7fXQuYihcIlxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8aW1nIHNyYz1cXFwiXCIpO3QuYih0LnQodC5mKFwidXJsXCIsYyxwLDApKSk7dC5iKFwiXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImVkaXQtdG9vbCBlZGl0LXN0YXJyZWRcXFwiIGRhdGEtd2hpY2g9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLXN0YXJyZWRcXFwiIHRpdGxlPVxcXCJTdGFyL3Vuc3RhciBlbW90ZTogXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJlZGl0LXRvb2wgZWRpdC12aXNpYmlsaXR5XFxcIiBkYXRhLXdoaWNoPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS12aXNpYmlsaXR5XFxcIiB0aXRsZT1cXFwiSGlkZS9zaG93IGVtb3RlOiBcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWydlbW90ZUJ1dHRvbiddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8YnV0dG9uIGNsYXNzPVxcXCJidXR0b24gYnV0dG9uLS1pY29uLW9ubHkgZmxvYXQtbGVmdFxcXCIgdGl0bGU9XFxcIkVtb3RlIE1lbnVcXFwiIGlkPVxcXCJlbW90ZS1tZW51LWJ1dHRvblxcXCI+PC9idXR0b24+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVHcm91cEhlYWRlciddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJncm91cC1oZWFkZXJcXFwiIGRhdGEtZW1vdGUtY2hhbm5lbD1cXFwiXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIlxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXItaW5mb1xcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxpbWcgc3JjPVxcXCJcIik7dC5iKHQudih0LmYoXCJiYWRnZVwiLGMscCwwKSkpO3QuYihcIlxcXCIgLz5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbERpc3BsYXlOYW1lXCIsYyxwLDApKSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcImVkaXQtdG9vbCBlZGl0LXZpc2liaWxpdHlcXFwiIGRhdGEtd2hpY2g9XFxcImNoYW5uZWwtXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIlxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtdmlzaWJpbGl0eVxcXCIgdGl0bGU9XFxcIkhpZGUvc2hvdyBjdXJyZW50IGVtb3RlcyBmb3IgXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbERpc3BsYXlOYW1lXCIsYyxwLDApKSk7dC5iKFwiIChub3RlOiBuZXcgZW1vdGVzIHdpbGwgc3RpbGwgc2hvdyB1cCBpZiB0aGV5IGFyZSBhZGRlZClcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJlbW90ZS1jb250YWluZXJcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ21lbnUnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZW1vdGUtbWVudVxcXCIgaWQ9XFxcImVtb3RlLW1lbnUtZm9yLXR3aXRjaFxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJlbW90ZS1tZW51LWlubmVyXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGRpdiBjbGFzcz1cXFwiZHJhZ2dhYmxlXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PGRpdiBjbGFzcz1cXFwic2Nyb2xsYWJsZSBzY3JvbGxiYXItbWFjb3N4XFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJncm91cC1jb250YWluZXJcXFwiIGlkPVxcXCJhbGwtZW1vdGVzLWdyb3VwXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcInN0aWNreVxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyIHNpbmdsZS1yb3dcXFwiIGlkPVxcXCJzdGFycmVkLWVtb3Rlcy1ncm91cFxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXItaW5mb1xcXCI+RmF2b3JpdGUgRW1vdGVzPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJlbW90ZS1jb250YWluZXJcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdDxkaXYgY2xhc3M9XFxcImZvb3RlclxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFx0XHQ8YSBjbGFzcz1cXFwicHVsbC1sZWZ0IGljb24gaWNvbi1ob21lXFxcIiBocmVmPVxcXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgdGl0bGU9XFxcIlZpc2l0IHRoZSBob21lcGFnZSB3aGVyZSB5b3UgY2FuIGRvbmF0ZSwgcG9zdCBhIHJldmlldywgb3IgY29udGFjdCB0aGUgZGV2ZWxvcGVyXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFx0XHQ8YSBjbGFzcz1cXFwicHVsbC1sZWZ0IGljb24gaWNvbi1nZWFyXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS1lZGl0aW5nXFxcIiB0aXRsZT1cXFwiVG9nZ2xlIGVkaXQgbW9kZVxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGEgY2xhc3M9XFxcInB1bGwtcmlnaHQgaWNvbiBpY29uLXJlc2l6ZS1oYW5kbGVcXFwiIGRhdGEtY29tbWFuZD1cXFwicmVzaXplLWhhbmRsZVxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGEgY2xhc3M9XFxcInB1bGwtcmlnaHQgaWNvbiBpY29uLXBpblxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtcGlubmVkXFxcIiB0aXRsZT1cXFwiUGluL3VucGluIHRoZSBlbW90ZSBtZW51IHRvIHRoZSBzY3JlZW5cXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHQ8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWyduZXdzTWVzc2FnZSddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJ0d2l0Y2gtY2hhdC1lbW90ZXMtbmV3c1xcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRbXCIpO3QuYih0LnYodC5mKFwic2NyaXB0TmFtZVwiLGMscCwwKSkpO3QuYihcIl0gTmV3czogXCIpO3QuYih0LnQodC5mKFwibWVzc2FnZVwiLGMscCwwKSkpO3QuYihcIiAoPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS1jb21tYW5kPVxcXCJ0d2l0Y2gtY2hhdC1lbW90ZXM6ZGlzbWlzcy1uZXdzXFxcIiBkYXRhLW5ld3MtaWQ9XFxcIlwiKTt0LmIodC52KHQuZihcImlkXCIsYyxwLDApKSk7dC5iKFwiXFxcIj5EaXNtaXNzPC9hPilcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgcmV0dXJuIHRlbXBsYXRlcztcbn0pKCk7IiwiLypcbiAqICBDb3B5cmlnaHQgMjAxMSBUd2l0dGVyLCBJbmMuXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgSG9nYW4gPSB7fTtcblxuKGZ1bmN0aW9uIChIb2dhbikge1xuICBIb2dhbi5UZW1wbGF0ZSA9IGZ1bmN0aW9uIChjb2RlT2JqLCB0ZXh0LCBjb21waWxlciwgb3B0aW9ucykge1xuICAgIGNvZGVPYmogPSBjb2RlT2JqIHx8IHt9O1xuICAgIHRoaXMuciA9IGNvZGVPYmouY29kZSB8fCB0aGlzLnI7XG4gICAgdGhpcy5jID0gY29tcGlsZXI7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLnRleHQgPSB0ZXh0IHx8ICcnO1xuICAgIHRoaXMucGFydGlhbHMgPSBjb2RlT2JqLnBhcnRpYWxzIHx8IHt9O1xuICAgIHRoaXMuc3VicyA9IGNvZGVPYmouc3VicyB8fCB7fTtcbiAgICB0aGlzLmJ1ZiA9ICcnO1xuICB9XG5cbiAgSG9nYW4uVGVtcGxhdGUucHJvdG90eXBlID0ge1xuICAgIC8vIHJlbmRlcjogcmVwbGFjZWQgYnkgZ2VuZXJhdGVkIGNvZGUuXG4gICAgcjogZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHsgcmV0dXJuICcnOyB9LFxuXG4gICAgLy8gdmFyaWFibGUgZXNjYXBpbmdcbiAgICB2OiBob2dhbkVzY2FwZSxcblxuICAgIC8vIHRyaXBsZSBzdGFjaGVcbiAgICB0OiBjb2VyY2VUb1N0cmluZyxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnJpKFtjb250ZXh0XSwgcGFydGlhbHMgfHwge30sIGluZGVudCk7XG4gICAgfSxcblxuICAgIC8vIHJlbmRlciBpbnRlcm5hbCAtLSBhIGhvb2sgZm9yIG92ZXJyaWRlcyB0aGF0IGNhdGNoZXMgcGFydGlhbHMgdG9vXG4gICAgcmk6IGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5yKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyBlbnN1cmVQYXJ0aWFsXG4gICAgZXA6IGZ1bmN0aW9uKHN5bWJvbCwgcGFydGlhbHMpIHtcbiAgICAgIHZhciBwYXJ0aWFsID0gdGhpcy5wYXJ0aWFsc1tzeW1ib2xdO1xuXG4gICAgICAvLyBjaGVjayB0byBzZWUgdGhhdCBpZiB3ZSd2ZSBpbnN0YW50aWF0ZWQgdGhpcyBwYXJ0aWFsIGJlZm9yZVxuICAgICAgdmFyIHRlbXBsYXRlID0gcGFydGlhbHNbcGFydGlhbC5uYW1lXTtcbiAgICAgIGlmIChwYXJ0aWFsLmluc3RhbmNlICYmIHBhcnRpYWwuYmFzZSA9PSB0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gcGFydGlhbC5pbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0ZW1wbGF0ZSA9PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoIXRoaXMuYykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNvbXBpbGVyIGF2YWlsYWJsZS5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgPSB0aGlzLmMuY29tcGlsZSh0ZW1wbGF0ZSwgdGhpcy5vcHRpb25zKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgdXNlIHRoaXMgdG8gY2hlY2sgd2hldGhlciB0aGUgcGFydGlhbHMgZGljdGlvbmFyeSBoYXMgY2hhbmdlZFxuICAgICAgdGhpcy5wYXJ0aWFsc1tzeW1ib2xdLmJhc2UgPSB0ZW1wbGF0ZTtcblxuICAgICAgaWYgKHBhcnRpYWwuc3Vicykge1xuICAgICAgICAvLyBNYWtlIHN1cmUgd2UgY29uc2lkZXIgcGFyZW50IHRlbXBsYXRlIG5vd1xuICAgICAgICBpZiAoIXBhcnRpYWxzLnN0YWNrVGV4dCkgcGFydGlhbHMuc3RhY2tUZXh0ID0ge307XG4gICAgICAgIGZvciAoa2V5IGluIHBhcnRpYWwuc3Vicykge1xuICAgICAgICAgIGlmICghcGFydGlhbHMuc3RhY2tUZXh0W2tleV0pIHtcbiAgICAgICAgICAgIHBhcnRpYWxzLnN0YWNrVGV4dFtrZXldID0gKHRoaXMuYWN0aXZlU3ViICE9PSB1bmRlZmluZWQgJiYgcGFydGlhbHMuc3RhY2tUZXh0W3RoaXMuYWN0aXZlU3ViXSkgPyBwYXJ0aWFscy5zdGFja1RleHRbdGhpcy5hY3RpdmVTdWJdIDogdGhpcy50ZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0ZW1wbGF0ZSA9IGNyZWF0ZVNwZWNpYWxpemVkUGFydGlhbCh0ZW1wbGF0ZSwgcGFydGlhbC5zdWJzLCBwYXJ0aWFsLnBhcnRpYWxzLFxuICAgICAgICAgIHRoaXMuc3RhY2tTdWJzLCB0aGlzLnN0YWNrUGFydGlhbHMsIHBhcnRpYWxzLnN0YWNrVGV4dCk7XG4gICAgICB9XG4gICAgICB0aGlzLnBhcnRpYWxzW3N5bWJvbF0uaW5zdGFuY2UgPSB0ZW1wbGF0ZTtcblxuICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH0sXG5cbiAgICAvLyB0cmllcyB0byBmaW5kIGEgcGFydGlhbCBpbiB0aGUgY3VycmVudCBzY29wZSBhbmQgcmVuZGVyIGl0XG4gICAgcnA6IGZ1bmN0aW9uKHN5bWJvbCwgY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgdmFyIHBhcnRpYWwgPSB0aGlzLmVwKHN5bWJvbCwgcGFydGlhbHMpO1xuICAgICAgaWYgKCFwYXJ0aWFsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhcnRpYWwucmkoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCk7XG4gICAgfSxcblxuICAgIC8vIHJlbmRlciBhIHNlY3Rpb25cbiAgICByczogZnVuY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHNlY3Rpb24pIHtcbiAgICAgIHZhciB0YWlsID0gY29udGV4dFtjb250ZXh0Lmxlbmd0aCAtIDFdO1xuXG4gICAgICBpZiAoIWlzQXJyYXkodGFpbCkpIHtcbiAgICAgICAgc2VjdGlvbihjb250ZXh0LCBwYXJ0aWFscywgdGhpcyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YWlsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnRleHQucHVzaCh0YWlsW2ldKTtcbiAgICAgICAgc2VjdGlvbihjb250ZXh0LCBwYXJ0aWFscywgdGhpcyk7XG4gICAgICAgIGNvbnRleHQucG9wKCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIG1heWJlIHN0YXJ0IGEgc2VjdGlvblxuICAgIHM6IGZ1bmN0aW9uKHZhbCwgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpIHtcbiAgICAgIHZhciBwYXNzO1xuXG4gICAgICBpZiAoaXNBcnJheSh2YWwpICYmIHZhbC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbCA9IHRoaXMubXModmFsLCBjdHgsIHBhcnRpYWxzLCBpbnZlcnRlZCwgc3RhcnQsIGVuZCwgdGFncyk7XG4gICAgICB9XG5cbiAgICAgIHBhc3MgPSAhIXZhbDtcblxuICAgICAgaWYgKCFpbnZlcnRlZCAmJiBwYXNzICYmIGN0eCkge1xuICAgICAgICBjdHgucHVzaCgodHlwZW9mIHZhbCA9PSAnb2JqZWN0JykgPyB2YWwgOiBjdHhbY3R4Lmxlbmd0aCAtIDFdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhc3M7XG4gICAgfSxcblxuICAgIC8vIGZpbmQgdmFsdWVzIHdpdGggZG90dGVkIG5hbWVzXG4gICAgZDogZnVuY3Rpb24oa2V5LCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCkge1xuICAgICAgdmFyIGZvdW5kLFxuICAgICAgICAgIG5hbWVzID0ga2V5LnNwbGl0KCcuJyksXG4gICAgICAgICAgdmFsID0gdGhpcy5mKG5hbWVzWzBdLCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCksXG4gICAgICAgICAgZG9Nb2RlbEdldCA9IHRoaXMub3B0aW9ucy5tb2RlbEdldCxcbiAgICAgICAgICBjeCA9IG51bGw7XG5cbiAgICAgIGlmIChrZXkgPT09ICcuJyAmJiBpc0FycmF5KGN0eFtjdHgubGVuZ3RoIC0gMl0pKSB7XG4gICAgICAgIHZhbCA9IGN0eFtjdHgubGVuZ3RoIC0gMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZm91bmQgPSBmaW5kSW5TY29wZShuYW1lc1tpXSwgdmFsLCBkb01vZGVsR2V0KTtcbiAgICAgICAgICBpZiAoZm91bmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY3ggPSB2YWw7XG4gICAgICAgICAgICB2YWwgPSBmb3VuZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsID0gJyc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXR1cm5Gb3VuZCAmJiAhdmFsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXR1cm5Gb3VuZCAmJiB0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY3R4LnB1c2goY3gpO1xuICAgICAgICB2YWwgPSB0aGlzLm12KHZhbCwgY3R4LCBwYXJ0aWFscyk7XG4gICAgICAgIGN0eC5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LFxuXG4gICAgLy8gZmluZCB2YWx1ZXMgd2l0aCBub3JtYWwgbmFtZXNcbiAgICBmOiBmdW5jdGlvbihrZXksIGN0eCwgcGFydGlhbHMsIHJldHVybkZvdW5kKSB7XG4gICAgICB2YXIgdmFsID0gZmFsc2UsXG4gICAgICAgICAgdiA9IG51bGwsXG4gICAgICAgICAgZm91bmQgPSBmYWxzZSxcbiAgICAgICAgICBkb01vZGVsR2V0ID0gdGhpcy5vcHRpb25zLm1vZGVsR2V0O1xuXG4gICAgICBmb3IgKHZhciBpID0gY3R4Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHYgPSBjdHhbaV07XG4gICAgICAgIHZhbCA9IGZpbmRJblNjb3BlKGtleSwgdiwgZG9Nb2RlbEdldCk7XG4gICAgICAgIGlmICh2YWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIHJldHVybiAocmV0dXJuRm91bmQpID8gZmFsc2UgOiBcIlwiO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXJldHVybkZvdW5kICYmIHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSB0aGlzLm12KHZhbCwgY3R4LCBwYXJ0aWFscyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIGhpZ2hlciBvcmRlciB0ZW1wbGF0ZXNcbiAgICBsczogZnVuY3Rpb24oZnVuYywgY3gsIHBhcnRpYWxzLCB0ZXh0LCB0YWdzKSB7XG4gICAgICB2YXIgb2xkVGFncyA9IHRoaXMub3B0aW9ucy5kZWxpbWl0ZXJzO1xuXG4gICAgICB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycyA9IHRhZ3M7XG4gICAgICB0aGlzLmIodGhpcy5jdChjb2VyY2VUb1N0cmluZyhmdW5jLmNhbGwoY3gsIHRleHQpKSwgY3gsIHBhcnRpYWxzKSk7XG4gICAgICB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycyA9IG9sZFRhZ3M7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gY29tcGlsZSB0ZXh0XG4gICAgY3Q6IGZ1bmN0aW9uKHRleHQsIGN4LCBwYXJ0aWFscykge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXNhYmxlTGFtYmRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTGFtYmRhIGZlYXR1cmVzIGRpc2FibGVkLicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYy5jb21waWxlKHRleHQsIHRoaXMub3B0aW9ucykucmVuZGVyKGN4LCBwYXJ0aWFscyk7XG4gICAgfSxcblxuICAgIC8vIHRlbXBsYXRlIHJlc3VsdCBidWZmZXJpbmdcbiAgICBiOiBmdW5jdGlvbihzKSB7IHRoaXMuYnVmICs9IHM7IH0sXG5cbiAgICBmbDogZnVuY3Rpb24oKSB7IHZhciByID0gdGhpcy5idWY7IHRoaXMuYnVmID0gJyc7IHJldHVybiByOyB9LFxuXG4gICAgLy8gbWV0aG9kIHJlcGxhY2Ugc2VjdGlvblxuICAgIG1zOiBmdW5jdGlvbihmdW5jLCBjdHgsIHBhcnRpYWxzLCBpbnZlcnRlZCwgc3RhcnQsIGVuZCwgdGFncykge1xuICAgICAgdmFyIHRleHRTb3VyY2UsXG4gICAgICAgICAgY3ggPSBjdHhbY3R4Lmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuY2FsbChjeCk7XG5cbiAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgaWYgKGludmVydGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGV4dFNvdXJjZSA9ICh0aGlzLmFjdGl2ZVN1YiAmJiB0aGlzLnN1YnNUZXh0ICYmIHRoaXMuc3Vic1RleHRbdGhpcy5hY3RpdmVTdWJdKSA/IHRoaXMuc3Vic1RleHRbdGhpcy5hY3RpdmVTdWJdIDogdGhpcy50ZXh0O1xuICAgICAgICAgIHJldHVybiB0aGlzLmxzKHJlc3VsdCwgY3gsIHBhcnRpYWxzLCB0ZXh0U291cmNlLnN1YnN0cmluZyhzdGFydCwgZW5kKSwgdGFncyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLy8gbWV0aG9kIHJlcGxhY2UgdmFyaWFibGVcbiAgICBtdjogZnVuY3Rpb24oZnVuYywgY3R4LCBwYXJ0aWFscykge1xuICAgICAgdmFyIGN4ID0gY3R4W2N0eC5sZW5ndGggLSAxXTtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmNhbGwoY3gpO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmN0KGNvZXJjZVRvU3RyaW5nKHJlc3VsdC5jYWxsKGN4KSksIGN4LCBwYXJ0aWFscyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIHN1YjogZnVuY3Rpb24obmFtZSwgY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgdmFyIGYgPSB0aGlzLnN1YnNbbmFtZV07XG4gICAgICBpZiAoZikge1xuICAgICAgICB0aGlzLmFjdGl2ZVN1YiA9IG5hbWU7XG4gICAgICAgIGYoY29udGV4dCwgcGFydGlhbHMsIHRoaXMsIGluZGVudCk7XG4gICAgICAgIHRoaXMuYWN0aXZlU3ViID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gIH07XG5cbiAgLy9GaW5kIGEga2V5IGluIGFuIG9iamVjdFxuICBmdW5jdGlvbiBmaW5kSW5TY29wZShrZXksIHNjb3BlLCBkb01vZGVsR2V0KSB7XG4gICAgdmFyIHZhbDtcblxuICAgIGlmIChzY29wZSAmJiB0eXBlb2Ygc2NvcGUgPT0gJ29iamVjdCcpIHtcblxuICAgICAgaWYgKHNjb3BlW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YWwgPSBzY29wZVtrZXldO1xuXG4gICAgICAvLyB0cnkgbG9va3VwIHdpdGggZ2V0IGZvciBiYWNrYm9uZSBvciBzaW1pbGFyIG1vZGVsIGRhdGFcbiAgICAgIH0gZWxzZSBpZiAoZG9Nb2RlbEdldCAmJiBzY29wZS5nZXQgJiYgdHlwZW9mIHNjb3BlLmdldCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbCA9IHNjb3BlLmdldChrZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWw7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTcGVjaWFsaXplZFBhcnRpYWwoaW5zdGFuY2UsIHN1YnMsIHBhcnRpYWxzLCBzdGFja1N1YnMsIHN0YWNrUGFydGlhbHMsIHN0YWNrVGV4dCkge1xuICAgIGZ1bmN0aW9uIFBhcnRpYWxUZW1wbGF0ZSgpIHt9O1xuICAgIFBhcnRpYWxUZW1wbGF0ZS5wcm90b3R5cGUgPSBpbnN0YW5jZTtcbiAgICBmdW5jdGlvbiBTdWJzdGl0dXRpb25zKCkge307XG4gICAgU3Vic3RpdHV0aW9ucy5wcm90b3R5cGUgPSBpbnN0YW5jZS5zdWJzO1xuICAgIHZhciBrZXk7XG4gICAgdmFyIHBhcnRpYWwgPSBuZXcgUGFydGlhbFRlbXBsYXRlKCk7XG4gICAgcGFydGlhbC5zdWJzID0gbmV3IFN1YnN0aXR1dGlvbnMoKTtcbiAgICBwYXJ0aWFsLnN1YnNUZXh0ID0ge307ICAvL2hlaGUuIHN1YnN0ZXh0LlxuICAgIHBhcnRpYWwuYnVmID0gJyc7XG5cbiAgICBzdGFja1N1YnMgPSBzdGFja1N1YnMgfHwge307XG4gICAgcGFydGlhbC5zdGFja1N1YnMgPSBzdGFja1N1YnM7XG4gICAgcGFydGlhbC5zdWJzVGV4dCA9IHN0YWNrVGV4dDtcbiAgICBmb3IgKGtleSBpbiBzdWJzKSB7XG4gICAgICBpZiAoIXN0YWNrU3Vic1trZXldKSBzdGFja1N1YnNba2V5XSA9IHN1YnNba2V5XTtcbiAgICB9XG4gICAgZm9yIChrZXkgaW4gc3RhY2tTdWJzKSB7XG4gICAgICBwYXJ0aWFsLnN1YnNba2V5XSA9IHN0YWNrU3Vic1trZXldO1xuICAgIH1cblxuICAgIHN0YWNrUGFydGlhbHMgPSBzdGFja1BhcnRpYWxzIHx8IHt9O1xuICAgIHBhcnRpYWwuc3RhY2tQYXJ0aWFscyA9IHN0YWNrUGFydGlhbHM7XG4gICAgZm9yIChrZXkgaW4gcGFydGlhbHMpIHtcbiAgICAgIGlmICghc3RhY2tQYXJ0aWFsc1trZXldKSBzdGFja1BhcnRpYWxzW2tleV0gPSBwYXJ0aWFsc1trZXldO1xuICAgIH1cbiAgICBmb3IgKGtleSBpbiBzdGFja1BhcnRpYWxzKSB7XG4gICAgICBwYXJ0aWFsLnBhcnRpYWxzW2tleV0gPSBzdGFja1BhcnRpYWxzW2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnRpYWw7XG4gIH1cblxuICB2YXIgckFtcCA9IC8mL2csXG4gICAgICByTHQgPSAvPC9nLFxuICAgICAgckd0ID0gLz4vZyxcbiAgICAgIHJBcG9zID0gL1xcJy9nLFxuICAgICAgclF1b3QgPSAvXFxcIi9nLFxuICAgICAgaENoYXJzID0gL1smPD5cXFwiXFwnXS87XG5cbiAgZnVuY3Rpb24gY29lcmNlVG9TdHJpbmcodmFsKSB7XG4gICAgcmV0dXJuIFN0cmluZygodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSA/ICcnIDogdmFsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhvZ2FuRXNjYXBlKHN0cikge1xuICAgIHN0ciA9IGNvZXJjZVRvU3RyaW5nKHN0cik7XG4gICAgcmV0dXJuIGhDaGFycy50ZXN0KHN0cikgP1xuICAgICAgc3RyXG4gICAgICAgIC5yZXBsYWNlKHJBbXAsICcmYW1wOycpXG4gICAgICAgIC5yZXBsYWNlKHJMdCwgJyZsdDsnKVxuICAgICAgICAucmVwbGFjZShyR3QsICcmZ3Q7JylcbiAgICAgICAgLnJlcGxhY2UockFwb3MsICcmIzM5OycpXG4gICAgICAgIC5yZXBsYWNlKHJRdW90LCAnJnF1b3Q7JykgOlxuICAgICAgc3RyO1xuICB9XG5cbiAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKGEpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG59KSh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgPyBleHBvcnRzIDogSG9nYW4pO1xuIiwiLyoqXG4gKiBqUXVlcnkgQ1NTIEN1c3RvbWl6YWJsZSBTY3JvbGxiYXJcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNCwgWXVyaXkgS2hhYmFyb3ZcbiAqIER1YWwgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBvciBHUEwgVmVyc2lvbiAyIGxpY2Vuc2VzLlxuICpcbiAqIElmIHlvdSBmb3VuZCBidWcsIHBsZWFzZSBjb250YWN0IG1lIHZpYSBlbWFpbCA8MTNyZWFsMDA4QGdtYWlsLmNvbT5cbiAqXG4gKiBAYXV0aG9yIFl1cml5IEtoYWJhcm92IGFrYSBHcm9tb1xuICogQHZlcnNpb24gMC4yLjZcbiAqIEB1cmwgaHR0cHM6Ly9naXRodWIuY29tL2dyb21vL2pxdWVyeS5zY3JvbGxiYXIvXG4gKlxuICovXG4oZnVuY3Rpb24oZSx0LG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGgodCl7aWYoby53ZWJraXQmJiF0KXtyZXR1cm57aGVpZ2h0OjAsd2lkdGg6MH19aWYoIW8uZGF0YS5vdXRlcil7dmFyIG49e2JvcmRlcjpcIm5vbmVcIixcImJveC1zaXppbmdcIjpcImNvbnRlbnQtYm94XCIsaGVpZ2h0OlwiMjAwcHhcIixtYXJnaW46XCIwXCIscGFkZGluZzpcIjBcIix3aWR0aDpcIjIwMHB4XCJ9O28uZGF0YS5pbm5lcj1lKFwiPGRpdj5cIikuY3NzKGUuZXh0ZW5kKHt9LG4pKTtvLmRhdGEub3V0ZXI9ZShcIjxkaXY+XCIpLmNzcyhlLmV4dGVuZCh7bGVmdDpcIi0xMDAwcHhcIixvdmVyZmxvdzpcInNjcm9sbFwiLHBvc2l0aW9uOlwiYWJzb2x1dGVcIix0b3A6XCItMTAwMHB4XCJ9LG4pKS5hcHBlbmQoby5kYXRhLmlubmVyKS5hcHBlbmRUbyhcImJvZHlcIil9by5kYXRhLm91dGVyLnNjcm9sbExlZnQoMWUzKS5zY3JvbGxUb3AoMWUzKTtyZXR1cm57aGVpZ2h0Ok1hdGguY2VpbChvLmRhdGEub3V0ZXIub2Zmc2V0KCkudG9wLW8uZGF0YS5pbm5lci5vZmZzZXQoKS50b3B8fDApLHdpZHRoOk1hdGguY2VpbChvLmRhdGEub3V0ZXIub2Zmc2V0KCkubGVmdC1vLmRhdGEuaW5uZXIub2Zmc2V0KCkubGVmdHx8MCl9fWZ1bmN0aW9uIHAobixyKXtlKHQpLm9uKHtcImJsdXIuc2Nyb2xsYmFyXCI6ZnVuY3Rpb24oKXtlKHQpLmFkZChcImJvZHlcIikub2ZmKFwiLnNjcm9sbGJhclwiKTtuJiZuKCl9LFwiZHJhZ3N0YXJ0LnNjcm9sbGJhclwiOmZ1bmN0aW9uKGUpe2UucHJldmVudERlZmF1bHQoKTtyZXR1cm4gZmFsc2V9LFwibW91c2V1cC5zY3JvbGxiYXJcIjpmdW5jdGlvbigpe2UodCkuYWRkKFwiYm9keVwiKS5vZmYoXCIuc2Nyb2xsYmFyXCIpO24mJm4oKX19KTtlKFwiYm9keVwiKS5vbih7XCJzZWxlY3RzdGFydC5zY3JvbGxiYXJcIjpmdW5jdGlvbihlKXtlLnByZXZlbnREZWZhdWx0KCk7cmV0dXJuIGZhbHNlfX0pO3ImJnIucHJldmVudERlZmF1bHQoKTtyZXR1cm4gZmFsc2V9ZnVuY3Rpb24gZCgpe3ZhciBlPWgodHJ1ZSk7cmV0dXJuIShlLmhlaWdodHx8ZS53aWR0aCl9ZnVuY3Rpb24gdihlKXt2YXIgdD1lLm9yaWdpbmFsRXZlbnQ7aWYodC5heGlzJiZ0LmF4aXM9PT10LkhPUklaT05UQUxfQVhJUylyZXR1cm4gZmFsc2U7aWYodC53aGVlbERlbHRhWClyZXR1cm4gZmFsc2U7cmV0dXJuIHRydWV9dmFyIHI9ZmFsc2U7dmFyIGk9MSxzPVwicHhcIjt2YXIgbz17ZGF0YTp7fSxtYWNvc3g6bi5uYXZpZ2F0b3IucGxhdGZvcm0udG9Mb3dlckNhc2UoKS5pbmRleE9mKFwibWFjXCIpIT09LTEsbW9iaWxlOi9BbmRyb2lkfHdlYk9TfGlQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeS9pLnRlc3Qobi5uYXZpZ2F0b3IudXNlckFnZW50KSxvdmVybGF5Om51bGwsc2Nyb2xsOm51bGwsc2Nyb2xsczpbXSx3ZWJraXQ6L1dlYktpdC8udGVzdChuLm5hdmlnYXRvci51c2VyQWdlbnQpLGxvZzpyP2Z1bmN0aW9uKHQscil7dmFyIGk9dDtpZihyJiZ0eXBlb2YgdCE9XCJzdHJpbmdcIil7aT1bXTtlLmVhY2godCxmdW5jdGlvbihlLHQpe2kucHVzaCgnXCInK2UrJ1wiOiAnK3QpfSk7aT1pLmpvaW4oXCIsIFwiKX1pZihuLmNvbnNvbGUmJm4uY29uc29sZS5sb2cpe24uY29uc29sZS5sb2coaSl9ZWxzZXthbGVydChpKX19OmZ1bmN0aW9uKCl7fX07dmFyIHU9e2F1dG9TY3JvbGxTaXplOnRydWUsYXV0b1VwZGF0ZTp0cnVlLGRlYnVnOmZhbHNlLGRpc2FibGVCb2R5U2Nyb2xsOmZhbHNlLGR1cmF0aW9uOjIwMCxpZ25vcmVNb2JpbGU6dHJ1ZSxpZ25vcmVPdmVybGF5OnRydWUsc2Nyb2xsU3RlcDozMCxzaG93QXJyb3dzOmZhbHNlLHN0ZXBTY3JvbGxpbmc6dHJ1ZSx0eXBlOlwic2ltcGxlXCIsc2Nyb2xseDpudWxsLHNjcm9sbHk6bnVsbCxvbkRlc3Ryb3k6bnVsbCxvbkluaXQ6bnVsbCxvblNjcm9sbDpudWxsLG9uVXBkYXRlOm51bGx9O3ZhciBhPWZ1bmN0aW9uKHQscil7aWYoIW8uc2Nyb2xsKXtvLmxvZyhcIkluaXQgalF1ZXJ5IFNjcm9sbGJhciB2MC4yLjZcIik7by5vdmVybGF5PWQoKTtvLnNjcm9sbD1oKCk7YygpO2UobikucmVzaXplKGZ1bmN0aW9uKCl7dmFyIGU9ZmFsc2U7aWYoby5zY3JvbGwmJihvLnNjcm9sbC5oZWlnaHR8fG8uc2Nyb2xsLndpZHRoKSl7dmFyIHQ9aCgpO2lmKHQuaGVpZ2h0IT1vLnNjcm9sbC5oZWlnaHR8fHQud2lkdGghPW8uc2Nyb2xsLndpZHRoKXtvLnNjcm9sbD10O2U9dHJ1ZX19YyhlKX0pfXRoaXMuY29udGFpbmVyPXQ7dGhpcy5vcHRpb25zPWUuZXh0ZW5kKHt9LHUsbi5qUXVlcnlTY3JvbGxiYXJPcHRpb25zfHx7fSk7dGhpcy5zY3JvbGxUbz1udWxsO3RoaXMuc2Nyb2xseD17fTt0aGlzLnNjcm9sbHk9e307dGhpcy5pbml0KHIpfTthLnByb3RvdHlwZT17ZGVzdHJveTpmdW5jdGlvbigpe2lmKCF0aGlzLndyYXBwZXIpe3JldHVybn12YXIgbj10aGlzLmNvbnRhaW5lci5zY3JvbGxMZWZ0KCk7dmFyIHI9dGhpcy5jb250YWluZXIuc2Nyb2xsVG9wKCk7dGhpcy5jb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMud3JhcHBlcikuY3NzKHtoZWlnaHQ6XCJcIixtYXJnaW46XCJcIn0pLnJlbW92ZUNsYXNzKFwic2Nyb2xsLWNvbnRlbnRcIikucmVtb3ZlQ2xhc3MoXCJzY3JvbGwtc2Nyb2xseF92aXNpYmxlXCIpLnJlbW92ZUNsYXNzKFwic2Nyb2xsLXNjcm9sbHlfdmlzaWJsZVwiKS5vZmYoXCIuc2Nyb2xsYmFyXCIpLnNjcm9sbExlZnQobikuc2Nyb2xsVG9wKHIpO3RoaXMuc2Nyb2xseC5zY3JvbGxiYXIucmVtb3ZlQ2xhc3MoXCJzY3JvbGwtc2Nyb2xseF92aXNpYmxlXCIpLmZpbmQoXCJkaXZcIikuYW5kU2VsZigpLm9mZihcIi5zY3JvbGxiYXJcIik7dGhpcy5zY3JvbGx5LnNjcm9sbGJhci5yZW1vdmVDbGFzcyhcInNjcm9sbC1zY3JvbGx5X3Zpc2libGVcIikuZmluZChcImRpdlwiKS5hbmRTZWxmKCkub2ZmKFwiLnNjcm9sbGJhclwiKTt0aGlzLndyYXBwZXIucmVtb3ZlKCk7ZSh0KS5hZGQoXCJib2R5XCIpLm9mZihcIi5zY3JvbGxiYXJcIik7aWYoZS5pc0Z1bmN0aW9uKHRoaXMub3B0aW9ucy5vbkRlc3Ryb3kpKXRoaXMub3B0aW9ucy5vbkRlc3Ryb3kuYXBwbHkodGhpcyxbdGhpcy5jb250YWluZXJdKX0sZ2V0U2Nyb2xsYmFyOmZ1bmN0aW9uKHQpe3ZhciBuPXRoaXMub3B0aW9uc1tcInNjcm9sbFwiK3RdO3ZhciByPXthZHZhbmNlZDonPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X2Nvcm5lclwiPjwvZGl2PicrJzxkaXYgY2xhc3M9XCJzY3JvbGwtYXJyb3cgc2Nyb2xsLWFycm93X2xlc3NcIj48L2Rpdj4nKyc8ZGl2IGNsYXNzPVwic2Nyb2xsLWFycm93IHNjcm9sbC1hcnJvd19tb3JlXCI+PC9kaXY+JysnPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X291dGVyXCI+JysnICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9zaXplXCI+PC9kaXY+JysnICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9pbm5lci13cmFwcGVyXCI+JysnICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfaW5uZXIgc2Nyb2xsLWVsZW1lbnRfdHJhY2tcIj4nKycgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfaW5uZXItYm90dG9tXCI+PC9kaXY+JytcIiAgICAgICAgPC9kaXY+XCIrXCIgICAgPC9kaXY+XCIrJyAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWJhclwiPicrJyAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJfYm9keVwiPicrJyAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtYmFyX2JvZHktaW5uZXJcIj48L2Rpdj4nK1wiICAgICAgICA8L2Rpdj5cIisnICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWJhcl9ib3R0b21cIj48L2Rpdj4nKycgICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtYmFyX2NlbnRlclwiPjwvZGl2PicrXCIgICAgPC9kaXY+XCIrXCI8L2Rpdj5cIixzaW1wbGU6JzxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9vdXRlclwiPicrJyAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfc2l6ZVwiPjwvZGl2PicrJyAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfdHJhY2tcIj48L2Rpdj4nKycgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJcIj48L2Rpdj4nK1wiPC9kaXY+XCJ9O3ZhciBpPXJbdGhpcy5vcHRpb25zLnR5cGVdP3RoaXMub3B0aW9ucy50eXBlOlwiYWR2YW5jZWRcIjtpZihuKXtpZih0eXBlb2Ygbj09XCJzdHJpbmdcIil7bj1lKG4pLmFwcGVuZFRvKHRoaXMud3JhcHBlcil9ZWxzZXtuPWUobil9fWVsc2V7bj1lKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJzY3JvbGwtZWxlbWVudFwiKS5odG1sKHJbaV0pLmFwcGVuZFRvKHRoaXMud3JhcHBlcil9aWYodGhpcy5vcHRpb25zLnNob3dBcnJvd3Mpe24uYWRkQ2xhc3MoXCJzY3JvbGwtZWxlbWVudF9hcnJvd3NfdmlzaWJsZVwiKX1yZXR1cm4gbi5hZGRDbGFzcyhcInNjcm9sbC1cIit0KX0saW5pdDpmdW5jdGlvbihuKXt2YXIgcj10aGlzO3ZhciB1PXRoaXMuY29udGFpbmVyO3ZhciBhPXRoaXMuY29udGFpbmVyV3JhcHBlcnx8dTt2YXIgZj1lLmV4dGVuZCh0aGlzLm9wdGlvbnMsbnx8e30pO3ZhciBsPXt4OnRoaXMuc2Nyb2xseCx5OnRoaXMuc2Nyb2xseX07dmFyIGM9dGhpcy53cmFwcGVyO3ZhciBoPXtzY3JvbGxMZWZ0OnUuc2Nyb2xsTGVmdCgpLHNjcm9sbFRvcDp1LnNjcm9sbFRvcCgpfTtpZihvLm1vYmlsZSYmZi5pZ25vcmVNb2JpbGV8fG8ub3ZlcmxheSYmZi5pZ25vcmVPdmVybGF5fHxvLm1hY29zeCYmIW8ud2Via2l0KXtyZXR1cm4gZmFsc2V9aWYoIWMpe3RoaXMud3JhcHBlcj1jPWUoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcInNjcm9sbC13cmFwcGVyXCIpLmFkZENsYXNzKHUuYXR0cihcImNsYXNzXCIpKS5jc3MoXCJwb3NpdGlvblwiLHUuY3NzKFwicG9zaXRpb25cIik9PVwiYWJzb2x1dGVcIj9cImFic29sdXRlXCI6XCJyZWxhdGl2ZVwiKS5pbnNlcnRCZWZvcmUodSkuYXBwZW5kKHUpO2lmKHUuaXMoXCJ0ZXh0YXJlYVwiKSl7dGhpcy5jb250YWluZXJXcmFwcGVyPWE9ZShcIjxkaXY+XCIpLmluc2VydEJlZm9yZSh1KS5hcHBlbmQodSk7Yy5hZGRDbGFzcyhcInNjcm9sbC10ZXh0YXJlYVwiKX1hLmFkZENsYXNzKFwic2Nyb2xsLWNvbnRlbnRcIikuY3NzKHtoZWlnaHQ6XCJcIixcIm1hcmdpbi1ib3R0b21cIjpvLnNjcm9sbC5oZWlnaHQqLTErcyxcIm1hcmdpbi1yaWdodFwiOm8uc2Nyb2xsLndpZHRoKi0xK3N9KTt1Lm9uKFwic2Nyb2xsLnNjcm9sbGJhclwiLGZ1bmN0aW9uKHQpe2lmKGUuaXNGdW5jdGlvbihmLm9uU2Nyb2xsKSl7Zi5vblNjcm9sbC5jYWxsKHIse21heFNjcm9sbDpsLnkubWF4U2Nyb2xsT2Zmc2V0LHNjcm9sbDp1LnNjcm9sbFRvcCgpLHNpemU6bC55LnNpemUsdmlzaWJsZTpsLnkudmlzaWJsZX0se21heFNjcm9sbDpsLngubWF4U2Nyb2xsT2Zmc2V0LHNjcm9sbDp1LnNjcm9sbExlZnQoKSxzaXplOmwueC5zaXplLHZpc2libGU6bC54LnZpc2libGV9KX1sLnguaXNWaXNpYmxlJiZsLnguc2Nyb2xsZXIuY3NzKFwibGVmdFwiLHUuc2Nyb2xsTGVmdCgpKmwueC5reCtzKTtsLnkuaXNWaXNpYmxlJiZsLnkuc2Nyb2xsZXIuY3NzKFwidG9wXCIsdS5zY3JvbGxUb3AoKSpsLnkua3grcyl9KTtjLm9uKFwic2Nyb2xsXCIsZnVuY3Rpb24oKXtjLnNjcm9sbFRvcCgwKS5zY3JvbGxMZWZ0KDApfSk7aWYoZi5kaXNhYmxlQm9keVNjcm9sbCl7dmFyIGQ9ZnVuY3Rpb24oZSl7dihlKT9sLnkuaXNWaXNpYmxlJiZsLnkubW91c2V3aGVlbChlKTpsLnguaXNWaXNpYmxlJiZsLngubW91c2V3aGVlbChlKX07Yy5vbih7XCJNb3pNb3VzZVBpeGVsU2Nyb2xsLnNjcm9sbGJhclwiOmQsXCJtb3VzZXdoZWVsLnNjcm9sbGJhclwiOmR9KTtpZihvLm1vYmlsZSl7Yy5vbihcInRvdWNoc3RhcnQuc2Nyb2xsYmFyXCIsZnVuY3Rpb24obil7dmFyIHI9bi5vcmlnaW5hbEV2ZW50LnRvdWNoZXMmJm4ub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdfHxuO3ZhciBpPXtwYWdlWDpyLnBhZ2VYLHBhZ2VZOnIucGFnZVl9O3ZhciBzPXtsZWZ0OnUuc2Nyb2xsTGVmdCgpLHRvcDp1LnNjcm9sbFRvcCgpfTtlKHQpLm9uKHtcInRvdWNobW92ZS5zY3JvbGxiYXJcIjpmdW5jdGlvbihlKXt2YXIgdD1lLm9yaWdpbmFsRXZlbnQudGFyZ2V0VG91Y2hlcyYmZS5vcmlnaW5hbEV2ZW50LnRhcmdldFRvdWNoZXNbMF18fGU7dS5zY3JvbGxMZWZ0KHMubGVmdCtpLnBhZ2VYLXQucGFnZVgpO3Uuc2Nyb2xsVG9wKHMudG9wK2kucGFnZVktdC5wYWdlWSk7ZS5wcmV2ZW50RGVmYXVsdCgpfSxcInRvdWNoZW5kLnNjcm9sbGJhclwiOmZ1bmN0aW9uKCl7ZSh0KS5vZmYoXCIuc2Nyb2xsYmFyXCIpfX0pfSl9fWlmKGUuaXNGdW5jdGlvbihmLm9uSW5pdCkpZi5vbkluaXQuYXBwbHkodGhpcyxbdV0pfWVsc2V7YS5jc3Moe2hlaWdodDpcIlwiLFwibWFyZ2luLWJvdHRvbVwiOm8uc2Nyb2xsLmhlaWdodCotMStzLFwibWFyZ2luLXJpZ2h0XCI6by5zY3JvbGwud2lkdGgqLTErc30pfWUuZWFjaChsLGZ1bmN0aW9uKG4scyl7dmFyIG89bnVsbDt2YXIgYT0xO3ZhciBjPW49PVwieFwiP1wic2Nyb2xsTGVmdFwiOlwic2Nyb2xsVG9wXCI7dmFyIGg9Zi5zY3JvbGxTdGVwO3ZhciBkPWZ1bmN0aW9uKCl7dmFyIGU9dVtjXSgpO3VbY10oZStoKTtpZihhPT0xJiZlK2g+PW0pZT11W2NdKCk7aWYoYT09LTEmJmUraDw9bSllPXVbY10oKTtpZih1W2NdKCk9PWUmJm8pe28oKX19O3ZhciBtPTA7aWYoIXMuc2Nyb2xsYmFyKXtzLnNjcm9sbGJhcj1yLmdldFNjcm9sbGJhcihuKTtzLnNjcm9sbGVyPXMuc2Nyb2xsYmFyLmZpbmQoXCIuc2Nyb2xsLWJhclwiKTtzLm1vdXNld2hlZWw9ZnVuY3Rpb24oZSl7aWYoIXMuaXNWaXNpYmxlfHxuPT1cInhcIiYmdihlKSl7cmV0dXJuIHRydWV9aWYobj09XCJ5XCImJiF2KGUpKXtsLngubW91c2V3aGVlbChlKTtyZXR1cm4gdHJ1ZX12YXIgdD1lLm9yaWdpbmFsRXZlbnQud2hlZWxEZWx0YSotMXx8ZS5vcmlnaW5hbEV2ZW50LmRldGFpbDt2YXIgaT1zLnNpemUtcy52aXNpYmxlLXMub2Zmc2V0O2lmKCEobTw9MCYmdDwwfHxtPj1pJiZ0PjApKXttPW0rdDtpZihtPDApbT0wO2lmKG0+aSltPWk7ci5zY3JvbGxUbz1yLnNjcm9sbFRvfHx7fTtyLnNjcm9sbFRvW2NdPW07c2V0VGltZW91dChmdW5jdGlvbigpe2lmKHIuc2Nyb2xsVG8pe3Uuc3RvcCgpLmFuaW1hdGUoci5zY3JvbGxUbywyNDAsXCJsaW5lYXJcIixmdW5jdGlvbigpe209dVtjXSgpfSk7ci5zY3JvbGxUbz1udWxsfX0sMSl9ZS5wcmV2ZW50RGVmYXVsdCgpO3JldHVybiBmYWxzZX07cy5zY3JvbGxiYXIub24oe1wiTW96TW91c2VQaXhlbFNjcm9sbC5zY3JvbGxiYXJcIjpzLm1vdXNld2hlZWwsXCJtb3VzZXdoZWVsLnNjcm9sbGJhclwiOnMubW91c2V3aGVlbCxcIm1vdXNlZW50ZXIuc2Nyb2xsYmFyXCI6ZnVuY3Rpb24oKXttPXVbY10oKX19KTtzLnNjcm9sbGJhci5maW5kKFwiLnNjcm9sbC1hcnJvdywgLnNjcm9sbC1lbGVtZW50X3RyYWNrXCIpLm9uKFwibW91c2Vkb3duLnNjcm9sbGJhclwiLGZ1bmN0aW9uKHQpe2lmKHQud2hpY2ghPWkpcmV0dXJuIHRydWU7YT0xO3ZhciBsPXtldmVudE9mZnNldDp0W249PVwieFwiP1wicGFnZVhcIjpcInBhZ2VZXCJdLG1heFNjcm9sbFZhbHVlOnMuc2l6ZS1zLnZpc2libGUtcy5vZmZzZXQsc2Nyb2xsYmFyT2Zmc2V0OnMuc2Nyb2xsZXIub2Zmc2V0KClbbj09XCJ4XCI/XCJsZWZ0XCI6XCJ0b3BcIl0sc2Nyb2xsYmFyU2l6ZTpzLnNjcm9sbGVyW249PVwieFwiP1wib3V0ZXJXaWR0aFwiOlwib3V0ZXJIZWlnaHRcIl0oKX07dmFyIHY9MCxnPTA7aWYoZSh0aGlzKS5oYXNDbGFzcyhcInNjcm9sbC1hcnJvd1wiKSl7YT1lKHRoaXMpLmhhc0NsYXNzKFwic2Nyb2xsLWFycm93X21vcmVcIik/MTotMTtoPWYuc2Nyb2xsU3RlcCphO209YT4wP2wubWF4U2Nyb2xsVmFsdWU6MH1lbHNle2E9bC5ldmVudE9mZnNldD5sLnNjcm9sbGJhck9mZnNldCtsLnNjcm9sbGJhclNpemU/MTpsLmV2ZW50T2Zmc2V0PGwuc2Nyb2xsYmFyT2Zmc2V0Py0xOjA7aD1NYXRoLnJvdW5kKHMudmlzaWJsZSouNzUpKmE7bT1sLmV2ZW50T2Zmc2V0LWwuc2Nyb2xsYmFyT2Zmc2V0LShmLnN0ZXBTY3JvbGxpbmc/YT09MT9sLnNjcm9sbGJhclNpemU6MDpNYXRoLnJvdW5kKGwuc2Nyb2xsYmFyU2l6ZS8yKSk7bT11W2NdKCkrbS9zLmt4fXIuc2Nyb2xsVG89ci5zY3JvbGxUb3x8e307ci5zY3JvbGxUb1tjXT1mLnN0ZXBTY3JvbGxpbmc/dVtjXSgpK2g6bTtpZihmLnN0ZXBTY3JvbGxpbmcpe289ZnVuY3Rpb24oKXttPXVbY10oKTtjbGVhckludGVydmFsKGcpO2NsZWFyVGltZW91dCh2KTt2PTA7Zz0wfTt2PXNldFRpbWVvdXQoZnVuY3Rpb24oKXtnPXNldEludGVydmFsKGQsNDApfSxmLmR1cmF0aW9uKzEwMCl9c2V0VGltZW91dChmdW5jdGlvbigpe2lmKHIuc2Nyb2xsVG8pe3UuYW5pbWF0ZShyLnNjcm9sbFRvLGYuZHVyYXRpb24pO3Iuc2Nyb2xsVG89bnVsbH19LDEpO3JldHVybiBwKG8sdCl9KTtzLnNjcm9sbGVyLm9uKFwibW91c2Vkb3duLnNjcm9sbGJhclwiLGZ1bmN0aW9uKHIpe2lmKHIud2hpY2ghPWkpcmV0dXJuIHRydWU7dmFyIG89cltuPT1cInhcIj9cInBhZ2VYXCI6XCJwYWdlWVwiXTt2YXIgYT11W2NdKCk7cy5zY3JvbGxiYXIuYWRkQ2xhc3MoXCJzY3JvbGwtZHJhZ2dhYmxlXCIpO2UodCkub24oXCJtb3VzZW1vdmUuc2Nyb2xsYmFyXCIsZnVuY3Rpb24oZSl7dmFyIHQ9cGFyc2VJbnQoKGVbbj09XCJ4XCI/XCJwYWdlWFwiOlwicGFnZVlcIl0tbykvcy5reCwxMCk7dVtjXShhK3QpfSk7cmV0dXJuIHAoZnVuY3Rpb24oKXtzLnNjcm9sbGJhci5yZW1vdmVDbGFzcyhcInNjcm9sbC1kcmFnZ2FibGVcIik7bT11W2NdKCl9LHIpfSl9fSk7ZS5lYWNoKGwsZnVuY3Rpb24oZSx0KXt2YXIgbj1cInNjcm9sbC1zY3JvbGxcIitlK1wiX3Zpc2libGVcIjt2YXIgcj1lPT1cInhcIj9sLnk6bC54O3Quc2Nyb2xsYmFyLnJlbW92ZUNsYXNzKG4pO3Iuc2Nyb2xsYmFyLnJlbW92ZUNsYXNzKG4pO2EucmVtb3ZlQ2xhc3Mobil9KTtlLmVhY2gobCxmdW5jdGlvbih0LG4pe2UuZXh0ZW5kKG4sdD09XCJ4XCI/e29mZnNldDpwYXJzZUludCh1LmNzcyhcImxlZnRcIiksMTApfHwwLHNpemU6dS5wcm9wKFwic2Nyb2xsV2lkdGhcIiksdmlzaWJsZTpjLndpZHRoKCl9OntvZmZzZXQ6cGFyc2VJbnQodS5jc3MoXCJ0b3BcIiksMTApfHwwLHNpemU6dS5wcm9wKFwic2Nyb2xsSGVpZ2h0XCIpLHZpc2libGU6Yy5oZWlnaHQoKX0pfSk7dmFyIG09ZnVuY3Rpb24odCxuKXt2YXIgcj1cInNjcm9sbC1zY3JvbGxcIit0K1wiX3Zpc2libGVcIjt2YXIgaT10PT1cInhcIj9sLnk6bC54O3ZhciBmPXBhcnNlSW50KHUuY3NzKHQ9PVwieFwiP1wibGVmdFwiOlwidG9wXCIpLDEwKXx8MDt2YXIgaD1uLnNpemU7dmFyIHA9bi52aXNpYmxlK2Y7bi5pc1Zpc2libGU9aC1wPjE7aWYobi5pc1Zpc2libGUpe24uc2Nyb2xsYmFyLmFkZENsYXNzKHIpO2kuc2Nyb2xsYmFyLmFkZENsYXNzKHIpO2EuYWRkQ2xhc3Mocil9ZWxzZXtuLnNjcm9sbGJhci5yZW1vdmVDbGFzcyhyKTtpLnNjcm9sbGJhci5yZW1vdmVDbGFzcyhyKTthLnJlbW92ZUNsYXNzKHIpfWlmKHQ9PVwieVwiJiYobi5pc1Zpc2libGV8fG4uc2l6ZTxuLnZpc2libGUpKXthLmNzcyhcImhlaWdodFwiLHArby5zY3JvbGwuaGVpZ2h0K3MpfWlmKGwueC5zaXplIT11LnByb3AoXCJzY3JvbGxXaWR0aFwiKXx8bC55LnNpemUhPXUucHJvcChcInNjcm9sbEhlaWdodFwiKXx8bC54LnZpc2libGUhPWMud2lkdGgoKXx8bC55LnZpc2libGUhPWMuaGVpZ2h0KCl8fGwueC5vZmZzZXQhPShwYXJzZUludCh1LmNzcyhcImxlZnRcIiksMTApfHwwKXx8bC55Lm9mZnNldCE9KHBhcnNlSW50KHUuY3NzKFwidG9wXCIpLDEwKXx8MCkpe2UuZWFjaChsLGZ1bmN0aW9uKHQsbil7ZS5leHRlbmQobix0PT1cInhcIj97b2Zmc2V0OnBhcnNlSW50KHUuY3NzKFwibGVmdFwiKSwxMCl8fDAsc2l6ZTp1LnByb3AoXCJzY3JvbGxXaWR0aFwiKSx2aXNpYmxlOmMud2lkdGgoKX06e29mZnNldDpwYXJzZUludCh1LmNzcyhcInRvcFwiKSwxMCl8fDAsc2l6ZTp1LnByb3AoXCJzY3JvbGxIZWlnaHRcIiksdmlzaWJsZTpjLmhlaWdodCgpfSl9KTttKHQ9PVwieFwiP1wieVwiOlwieFwiLGkpfX07ZS5lYWNoKGwsbSk7aWYoZS5pc0Z1bmN0aW9uKGYub25VcGRhdGUpKWYub25VcGRhdGUuYXBwbHkodGhpcyxbdV0pO2UuZWFjaChsLGZ1bmN0aW9uKGUsdCl7dmFyIG49ZT09XCJ4XCI/XCJsZWZ0XCI6XCJ0b3BcIjt2YXIgcj1lPT1cInhcIj9cIm91dGVyV2lkdGhcIjpcIm91dGVySGVpZ2h0XCI7dmFyIGk9ZT09XCJ4XCI/XCJ3aWR0aFwiOlwiaGVpZ2h0XCI7dmFyIG89cGFyc2VJbnQodS5jc3MobiksMTApfHwwO3ZhciBhPXQuc2l6ZTt2YXIgbD10LnZpc2libGUrbzt2YXIgYz10LnNjcm9sbGJhci5maW5kKFwiLnNjcm9sbC1lbGVtZW50X3NpemVcIik7Yz1jW3JdKCkrKHBhcnNlSW50KGMuY3NzKG4pLDEwKXx8MCk7aWYoZi5hdXRvU2Nyb2xsU2l6ZSl7dC5zY3JvbGxiYXJTaXplPXBhcnNlSW50KGMqbC9hLDEwKTt0LnNjcm9sbGVyLmNzcyhpLHQuc2Nyb2xsYmFyU2l6ZStzKX10LnNjcm9sbGJhclNpemU9dC5zY3JvbGxlcltyXSgpO3Qua3g9KGMtdC5zY3JvbGxiYXJTaXplKS8oYS1sKXx8MTt0Lm1heFNjcm9sbE9mZnNldD1hLWx9KTt1LnNjcm9sbExlZnQoaC5zY3JvbGxMZWZ0KS5zY3JvbGxUb3AoaC5zY3JvbGxUb3ApLnRyaWdnZXIoXCJzY3JvbGxcIil9fTtlLmZuLnNjcm9sbGJhcj1mdW5jdGlvbih0LG4pe3ZhciByPXRoaXM7aWYodD09PVwiZ2V0XCIpcj1udWxsO3RoaXMuZWFjaChmdW5jdGlvbigpe3ZhciBpPWUodGhpcyk7aWYoaS5oYXNDbGFzcyhcInNjcm9sbC13cmFwcGVyXCIpfHxpLmdldCgwKS5ub2RlTmFtZT09XCJib2R5XCIpe3JldHVybiB0cnVlfXZhciBzPWkuZGF0YShcInNjcm9sbGJhclwiKTtpZihzKXtpZih0PT09XCJnZXRcIil7cj1zO3JldHVybiBmYWxzZX12YXIgdT10eXBlb2YgdD09XCJzdHJpbmdcIiYmc1t0XT90OlwiaW5pdFwiO3NbdV0uYXBwbHkocyxlLmlzQXJyYXkobik/bjpbXSk7aWYodD09PVwiZGVzdHJveVwiKXtpLnJlbW92ZURhdGEoXCJzY3JvbGxiYXJcIik7d2hpbGUoZS5pbkFycmF5KHMsby5zY3JvbGxzKT49MClvLnNjcm9sbHMuc3BsaWNlKGUuaW5BcnJheShzLG8uc2Nyb2xscyksMSl9fWVsc2V7aWYodHlwZW9mIHQhPVwic3RyaW5nXCIpe3M9bmV3IGEoaSx0KTtpLmRhdGEoXCJzY3JvbGxiYXJcIixzKTtvLnNjcm9sbHMucHVzaChzKX19cmV0dXJuIHRydWV9KTtyZXR1cm4gcn07ZS5mbi5zY3JvbGxiYXIub3B0aW9ucz11O2lmKG4uYW5ndWxhcil7KGZ1bmN0aW9uKGUpe3ZhciB0PWUubW9kdWxlKFwialF1ZXJ5U2Nyb2xsYmFyXCIsW10pO3QuZGlyZWN0aXZlKFwianF1ZXJ5U2Nyb2xsYmFyXCIsZnVuY3Rpb24oKXtyZXR1cm57bGluazpmdW5jdGlvbihlLHQpe3Quc2Nyb2xsYmFyKGUub3B0aW9ucykub24oXCIkZGVzdHJveVwiLGZ1bmN0aW9uKCl7dC5zY3JvbGxiYXIoXCJkZXN0cm95XCIpfSl9LHJlc3RyaW5nOlwiQUNcIixzY29wZTp7b3B0aW9uczpcIj1qcXVlcnlTY3JvbGxiYXJcIn19fSl9KShuLmFuZ3VsYXIpfXZhciBmPTAsbD0wO3ZhciBjPWZ1bmN0aW9uKGUpe3ZhciB0LG4saSxzLHUsYSxoO2Zvcih0PTA7dDxvLnNjcm9sbHMubGVuZ3RoO3QrKyl7cz1vLnNjcm9sbHNbdF07bj1zLmNvbnRhaW5lcjtpPXMub3B0aW9uczt1PXMud3JhcHBlcjthPXMuc2Nyb2xseDtoPXMuc2Nyb2xseTtpZihlfHxpLmF1dG9VcGRhdGUmJnUmJnUuaXMoXCI6dmlzaWJsZVwiKSYmKG4ucHJvcChcInNjcm9sbFdpZHRoXCIpIT1hLnNpemV8fG4ucHJvcChcInNjcm9sbEhlaWdodFwiKSE9aC5zaXplfHx1LndpZHRoKCkhPWEudmlzaWJsZXx8dS5oZWlnaHQoKSE9aC52aXNpYmxlKSl7cy5pbml0KCk7aWYocil7by5sb2coe3Njcm9sbEhlaWdodDpuLnByb3AoXCJzY3JvbGxIZWlnaHRcIikrXCI6XCIrcy5zY3JvbGx5LnNpemUsc2Nyb2xsV2lkdGg6bi5wcm9wKFwic2Nyb2xsV2lkdGhcIikrXCI6XCIrcy5zY3JvbGx4LnNpemUsdmlzaWJsZUhlaWdodDp1LmhlaWdodCgpK1wiOlwiK3Muc2Nyb2xseS52aXNpYmxlLHZpc2libGVXaWR0aDp1LndpZHRoKCkrXCI6XCIrcy5zY3JvbGx4LnZpc2libGV9LHRydWUpO2wrK319fWlmKHImJmw+MTApe28ubG9nKFwiU2Nyb2xsIHVwZGF0ZXMgZXhjZWVkIDEwXCIpO2M9ZnVuY3Rpb24oKXt9fWVsc2V7Y2xlYXJUaW1lb3V0KGYpO2Y9c2V0VGltZW91dChjLDMwMCl9fX0pKGpRdWVyeSxkb2N1bWVudCx3aW5kb3cpOyIsIi8vIFN0b3JhZ2UgY2FjaGUuXHJcbnZhciBjYWNoZSA9IHt9O1xyXG4vLyBUaGUgc3RvcmUgaGFuZGxpbmcgZXhwaXJhdGlvbiBvZiBkYXRhLlxyXG52YXIgZXhwaXJlc1N0b3JlID0gbmV3IFN0b3JlKHtcclxuXHRuYW1lc3BhY2U6ICdfX3N0b3JhZ2Utd3JhcHBlcjpleHBpcmVzJ1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBTdG9yYWdlIHdyYXBwZXIgZm9yIG1ha2luZyByb3V0aW5lIHN0b3JhZ2UgY2FsbHMgc3VwZXIgZWFzeS5cclxuICogQGNsYXNzIFN0b3JlXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdICAgICAgICAgICAgICAgICAgICAgVGhlIG9wdGlvbnMgZm9yIHRoZSBzdG9yZS4gT3B0aW9ucyBub3Qgb3ZlcnJpZGRlbiB3aWxsIHVzZSB0aGUgZGVmYXVsdHMuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBbb3B0aW9ucy5uYW1lc3BhY2U9JyddICAgICAgICBTZWUge3sjY3Jvc3NMaW5rIFwiU3RvcmUvc2V0TmFtZXNwYWNlXCJ9fVN0b3JlI3NldE5hbWVzcGFjZXt7L2Nyb3NzTGlua319XHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBbb3B0aW9ucy5zdG9yYWdlVHlwZT0nbG9jYWwnXSBTZWUge3sjY3Jvc3NMaW5rIFwiU3RvcmUvc2V0U3RvcmFnZVR5cGVcIn19U3RvcmUjc2V0U3RvcmFnZVR5cGV7ey9jcm9zc0xpbmt9fVxyXG4gKi9cclxuZnVuY3Rpb24gU3RvcmUob3B0aW9ucykge1xyXG5cdHZhciBzZXR0aW5ncyA9IHtcclxuXHRcdG5hbWVzcGFjZTogJycsXHJcblx0XHRzdG9yYWdlVHlwZTogJ2xvY2FsJ1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIHN0b3JhZ2UgbmFtZXNwYWNlLlxyXG5cdCAqIEBtZXRob2Qgc2V0TmFtZXNwYWNlXHJcblx0ICogQHBhcmFtIHtzdHJpbmd8ZmFsc2V8bnVsbH0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgdG8gd29yayB1bmRlci4gVG8gdXNlIG5vIG5hbWVzcGFjZSAoZS5nLiBnbG9iYWwgbmFtZXNwYWNlKSwgcGFzcyBpbiBgZmFsc2VgIG9yIGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcuXHJcblx0ICovXHJcblx0dGhpcy5zZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XHJcblx0XHR2YXIgdmFsaWROYW1lc3BhY2UgPSAvXltcXHctOl0rJC87XHJcblx0XHQvLyBObyBuYW1lc3BhY2UuXHJcblx0XHRpZiAobmFtZXNwYWNlID09PSBmYWxzZSB8fCBuYW1lc3BhY2UgPT0gbnVsbCB8fCBuYW1lc3BhY2UgPT09ICcnKSB7XHJcblx0XHRcdHNldHRpbmdzLm5hbWVzcGFjZSA9ICcnO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mIG5hbWVzcGFjZSAhPT0gJ3N0cmluZycgfHwgIXZhbGlkTmFtZXNwYWNlLnRlc3QobmFtZXNwYWNlKSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbmFtZXNwYWNlLicpO1xyXG5cdFx0fVxyXG5cdFx0c2V0dGluZ3MubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGN1cnJlbnQgc3RvcmFnZSBuYW1lc3BhY2UuXHJcblx0ICogQG1ldGhvZCBnZXROYW1lc3BhY2VcclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuXHQgKi9cclxuXHR0aGlzLmdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChpbmNsdWRlU2VwYXJhdG9yKSB7XHJcblx0XHRpZiAoaW5jbHVkZVNlcGFyYXRvciAmJiBzZXR0aW5ncy5uYW1lc3BhY2UgIT09ICcnKSB7XHJcblx0XHRcdHJldHVybiBzZXR0aW5ncy5uYW1lc3BhY2UgKyAnOic7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc2V0dGluZ3MubmFtZXNwYWNlO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgdHlwZSBvZiBzdG9yYWdlIHRvIHVzZS5cclxuXHQgKiBAbWV0aG9kIHNldFN0b3JhZ2VUeXBlXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgVGhlIHR5cGUgb2Ygc3RvcmFnZSB0byB1c2UuIFVzZSBgc2Vzc2lvbmAgZm9yIGBzZXNzaW9uU3RvcmFnZWAgYW5kIGBsb2NhbGAgZm9yIGBsb2NhbFN0b3JhZ2VgLlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0U3RvcmFnZVR5cGUgPSBmdW5jdGlvbiAodHlwZSkge1xyXG5cdFx0aWYgKFsnc2Vzc2lvbicsICdsb2NhbCddLmluZGV4T2YodHlwZSkgPCAwKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdG9yYWdlIHR5cGUuJyk7XHJcblx0XHR9XHJcblx0XHRzZXR0aW5ncy5zdG9yYWdlVHlwZSA9IHR5cGU7XHJcblx0fTtcclxuXHQvKipcclxuXHQgKiBHZXQgdGhlIHR5cGUgb2Ygc3RvcmFnZSBiZWluZyB1c2VkLlxyXG5cdCAqIEBtZXRob2QgZ2V0U3RvcmFnZVR5cGVcclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB0eXBlIG9mIHN0b3JhZ2UgYmVpbmcgdXNlZC5cclxuXHQgKi9cclxuXHR0aGlzLmdldFN0b3JhZ2VUeXBlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHNldHRpbmdzLnN0b3JhZ2VUeXBlO1xyXG5cdH07XHJcblxyXG5cdC8vIE92ZXJyaWRlIGRlZmF1bHQgc2V0dGluZ3MuXHJcblx0aWYgKG9wdGlvbnMpIHtcclxuXHRcdGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XHJcblx0XHRcdHN3aXRjaCAoa2V5KSB7XHJcblx0XHRcdFx0Y2FzZSAnbmFtZXNwYWNlJzpcclxuXHRcdFx0XHRcdHRoaXMuc2V0TmFtZXNwYWNlKG9wdGlvbnNba2V5XSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRjYXNlICdzdG9yYWdlVHlwZSc6XHJcblx0XHRcdFx0XHR0aGlzLnNldFN0b3JhZ2VUeXBlKG9wdGlvbnNba2V5XSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGFjdHVhbCBoYW5kbGVyIHRvIHVzZVxyXG4gKiBAbWV0aG9kIGdldFN0b3JhZ2VIYW5kbGVyXHJcbiAqIEByZXR1cm4ge21peGVkfSBUaGUgc3RvcmFnZSBoYW5kbGVyLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldFN0b3JhZ2VIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBoYW5kbGVycyA9IHtcclxuXHRcdCdsb2NhbCc6IGxvY2FsU3RvcmFnZSxcclxuXHRcdCdzZXNzaW9uJzogc2Vzc2lvblN0b3JhZ2VcclxuXHR9O1xyXG5cdHJldHVybiBoYW5kbGVyc1t0aGlzLmdldFN0b3JhZ2VUeXBlKCldO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgZnVsbCBzdG9yYWdlIG5hbWUgZm9yIGEga2V5LCBpbmNsdWRpbmcgdGhlIG5hbWVzcGFjZSwgaWYgYW55LlxyXG4gKiBAbWV0aG9kIGdldFN0b3JhZ2VLZXlcclxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkgVGhlIHN0b3JhZ2Uga2V5IG5hbWUuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gICAgIFRoZSBmdWxsIHN0b3JhZ2UgbmFtZSB0aGF0IGlzIHVzZWQgYnkgdGhlIHN0b3JhZ2UgbWV0aG9kcy5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXRTdG9yYWdlS2V5ID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdGlmICgha2V5IHx8IHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleS5sZW5ndGggPCAxKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0tleSBtdXN0IGJlIGEgc3RyaW5nLicpO1xyXG5cdH1cclxuXHRyZXR1cm4gdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkgKyBrZXk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0b3JhZ2UgaXRlbSBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBnZXRcclxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkgICAgICAgICAgVGhlIGtleSB0aGF0IHRoZSBkYXRhIGNhbiBiZSBhY2Nlc3NlZCB1bmRlci5cclxuICogQHBhcmFtICB7bWl4ZWR9ICBkZWZhdWx0VmFsdWUgVGhlIGRlZmF1bHQgdmFsdWUgdG8gcmV0dXJuIGluIGNhc2UgdGhlIHN0b3JhZ2UgdmFsdWUgaXMgbm90IHNldCBvciBgbnVsbGAuXHJcbiAqIEByZXR1cm4ge21peGVkfSAgICAgICAgICAgICAgIFRoZSBkYXRhIGZvciB0aGUgc3RvcmFnZS5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5LCBkZWZhdWx0VmFsdWUpIHtcclxuXHQvLyBQcmV2ZW50IHJlY3Vyc2lvbi4gT25seSBjaGVjayBleHBpcmUgZGF0ZSBpZiBpdCBpc24ndCBjYWxsZWQgZnJvbSBgZXhwaXJlc1N0b3JlYC5cclxuXHRpZiAodGhpcyAhPT0gZXhwaXJlc1N0b3JlKSB7XHJcblx0XHQvLyBDaGVjayBpZiBrZXkgaXMgZXhwaXJlZC5cclxuXHRcdHZhciBleHBpcmVEYXRlID0gZXhwaXJlc1N0b3JlLmdldCh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcblx0XHRpZiAoZXhwaXJlRGF0ZSAhPT0gbnVsbCAmJiBleHBpcmVEYXRlLmdldFRpbWUoKSA8IERhdGUubm93KCkpIHtcclxuXHRcdFx0Ly8gRXhwaXJlZCwgcmVtb3ZlIGl0LlxyXG5cdFx0XHR0aGlzLnJlbW92ZShrZXkpO1xyXG5cdFx0XHRleHBpcmVzU3RvcmUucmVtb3ZlKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIENhY2hlZCwgcmVhZCBmcm9tIG1lbW9yeS5cclxuXHRpZiAoY2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldICE9IG51bGwpIHtcclxuXHRcdHJldHVybiBjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV07XHJcblx0fVxyXG5cclxuXHR2YXIgdmFsID0gdGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLmdldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG5cclxuXHQvLyBWYWx1ZSBkb2Vzbid0IGV4aXN0IGFuZCB3ZSBoYXZlIGEgZGVmYXVsdCwgcmV0dXJuIGRlZmF1bHQuXHJcblx0aWYgKHZhbCA9PT0gbnVsbCAmJiB0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHR9XHJcblxyXG5cdC8vIE9ubHkgcHJlLXByb2Nlc3Mgc3RyaW5ncy5cclxuXHRpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdC8vIEhhbmRsZSBSZWdFeHBzLlxyXG5cdFx0aWYgKHZhbC5pbmRleE9mKCd+UmVnRXhwOicpID09PSAwKSB7XHJcblx0XHRcdHZhciBtYXRjaGVzID0gL15+UmVnRXhwOihbZ2ltXSo/KTooLiopLy5leGVjKHZhbCk7XHJcblx0XHRcdHZhbCA9IG5ldyBSZWdFeHAobWF0Y2hlc1syXSwgbWF0Y2hlc1sxXSk7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgRGF0ZXMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfkRhdGU6JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gbmV3IERhdGUodmFsLnJlcGxhY2UoL15+RGF0ZTovLCAnJykpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIG51bWJlcnMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfk51bWJlcjonKSA9PT0gMCkge1xyXG5cdFx0XHR2YWwgPSBwYXJzZUludCh2YWwucmVwbGFjZSgvXn5OdW1iZXI6LywgJycpLCAxMCk7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgYm9vbGVhbnMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfkJvb2xlYW46JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gdmFsLnJlcGxhY2UoL15+Qm9vbGVhbjovLCAnJykgPT09ICd0cnVlJztcclxuXHRcdH1cclxuXHRcdC8vIEhhbmRsZSBvYmplY3RzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35KU09OOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IHZhbC5yZXBsYWNlKC9efkpTT046LywgJycpO1xyXG5cdFx0XHQvLyBUcnkgcGFyc2luZyBpdC5cclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHR2YWwgPSBKU09OLnBhcnNlKHZhbCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gUGFyc2luZyB3ZW50IHdyb25nIChpbnZhbGlkIEpTT04pLCByZXR1cm4gZGVmYXVsdCBvciBudWxsLlxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFJldHVybiBpdC5cclxuXHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSB2YWw7XHJcblx0cmV0dXJuIHZhbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGEgc3RvcmFnZSBpdGVtIG9uIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBzZXRcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAga2V5ICAgICAgIFRoZSBrZXkgdGhhdCB0aGUgZGF0YSBjYW4gYmUgYWNjZXNzZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICAgICAgIHZhbCAgICAgICBUaGUgdmFsdWUgdG8gc3RvcmUuIE1heSBiZSB0aGUgZm9sbG93aW5nIHR5cGVzIG9mIGRhdGE6IGBSZWdFeHBgLCBgRGF0ZWAsIGBPYmplY3RgLCBgU3RyaW5nYCwgYEJvb2xlYW5gLCBgTnVtYmVyYFxyXG4gKiBAcGFyYW0ge0RhdGV8bnVtYmVyfSBbZXhwaXJlc10gVGhlIGRhdGUgaW4gdGhlIGZ1dHVyZSB0byBleHBpcmUsIG9yIHJlbGF0aXZlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZnJvbSBgRGF0ZSNub3dgIHRvIGV4cGlyZS5cclxuICpcclxuICogTm90ZTogVGhpcyBjb252ZXJ0cyBzcGVjaWFsIGRhdGEgdHlwZXMgdGhhdCBub3JtYWxseSBjYW4ndCBiZSBzdG9yZWQgaW4gdGhlIGZvbGxvd2luZyB3YXk6XHJcbiAqIFxyXG4gKiAtIGBSZWdFeHBgOiBwcmVmaXhlZCB3aXRoIHR5cGUsIGZsYWdzIHN0b3JlZCwgYW5kIHNvdXJjZSBzdG9yZWQgYXMgc3RyaW5nLlxyXG4gKiAtIGBEYXRlYDogcHJlZml4ZWQgd2l0aCB0eXBlLCBzdG9yZWQgYXMgc3RyaW5nIHVzaW5nIGBEYXRlI3RvU3RyaW5nYC5cclxuICogLSBgT2JqZWN0YDogcHJlZml4ZWQgd2l0aCBcIkpTT05cIiBpbmRpY2F0b3IsIHN0b3JlZCBhcyBzdHJpbmcgdXNpbmcgYEpTT04jc3RyaW5naWZ5YC5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWwsIGV4cGlyZXMpIHtcclxuXHR2YXIgcGFyc2VkVmFsID0gbnVsbDtcclxuXHQvLyBIYW5kbGUgUmVnRXhwcy5cclxuXHRpZiAodmFsIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcblx0XHR2YXIgZmxhZ3MgPSBbXHJcblx0XHRcdHZhbC5nbG9iYWwgPyAnZycgOiAnJyxcclxuXHRcdFx0dmFsLmlnbm9yZUNhc2UgPyAnaScgOiAnJyxcclxuXHRcdFx0dmFsLm11bHRpbGluZSA/ICdtJyA6ICcnLFxyXG5cdFx0XS5qb2luKCcnKTtcclxuXHRcdHBhcnNlZFZhbCA9ICd+UmVnRXhwOicgKyBmbGFncyArICc6JyArIHZhbC5zb3VyY2U7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBEYXRlcy5cclxuXHRlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkRhdGU6JyArIHZhbC50b1N0cmluZygpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgb2JqZWN0cy5cclxuXHRlbHNlIGlmICh2YWwgPT09IE9iamVjdCh2YWwpKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkpTT046JyArIEpTT04uc3RyaW5naWZ5KHZhbCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBudW1iZXJzLlxyXG5cdGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfk51bWJlcjonICsgdmFsLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBib29sZWFucy5cclxuXHRlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnYm9vbGVhbicpIHtcclxuXHRcdHBhcnNlZFZhbCA9ICd+Qm9vbGVhbjonICsgdmFsLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBzdHJpbmdzLlxyXG5cdGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRwYXJzZWRWYWwgPSB2YWw7XHJcblx0fVxyXG5cdC8vIFRocm93IGlmIHdlIGRvbid0IGtub3cgd2hhdCBpdCBpcy5cclxuXHRlbHNlIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIHN0b3JlIHRoaXMgdmFsdWU7IHdyb25nIHZhbHVlIHR5cGUuJyk7XHJcblx0fVxyXG5cdC8vIFNldCBleHBpcmUgZGF0ZSBpZiBuZWVkZWQuXHJcblx0aWYgKHR5cGVvZiBleHBpcmVzICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0Ly8gQ29udmVydCB0byBhIHJlbGF0aXZlIGRhdGUuXHJcblx0XHRpZiAodHlwZW9mIGV4cGlyZXMgPT09ICdudW1iZXInKSB7XHJcblx0XHRcdGV4cGlyZXMgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgZXhwaXJlcyk7XHJcblx0XHR9XHJcblx0XHQvLyBNYWtlIHN1cmUgaXQgaXMgYSBkYXRlLlxyXG5cdFx0aWYgKGV4cGlyZXMgaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRcdGV4cGlyZXNTdG9yZS5zZXQodGhpcy5nZXRTdG9yYWdlS2V5KGtleSksIGV4cGlyZXMpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignS2V5IGV4cGlyZSBtdXN0IGJlIGEgdmFsaWQgZGF0ZSBvciB0aW1lc3RhbXAuJyk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vIFNhdmUgaXQuXHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gdmFsO1xyXG5cdHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5zZXRJdGVtKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpLCBwYXJzZWRWYWwpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYWxsIGRhdGEgZm9yIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBnZXRBbGxcclxuICogQHJldHVybiB7b2JqZWN0fSBBbiBvYmplY3QgY29udGFpbmluZyBhbGwgZGF0YSBpbiB0aGUgZm9ybSBvZiBge3RoZUtleTogdGhlRGF0YX1gIHdoZXJlIGB0aGVEYXRhYCBpcyBwYXJzZWQgdXNpbmcge3sjY3Jvc3NMaW5rIFwiU3RvcmUvZ2V0XCJ9fVN0b3JlI2dldHt7L2Nyb3NzTGlua319LlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIga2V5cyA9IHRoaXMubGlzdEtleXMoKTtcclxuXHR2YXIgZGF0YSA9IHt9O1xyXG5cdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRkYXRhW2tleV0gPSB0aGlzLmdldChrZXkpO1xyXG5cdH0sIHRoaXMpO1xyXG5cdHJldHVybiBkYXRhO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExpc3QgYWxsIGtleXMgdGhhdCBhcmUgdGllZCB0byB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgbGlzdEtleXNcclxuICogQHJldHVybiB7YXJyYXl9IFRoZSBzdG9yYWdlIGtleXMuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUubGlzdEtleXMgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGtleXMgPSBbXTtcclxuXHR2YXIga2V5ID0gbnVsbDtcclxuXHR2YXIgc3RvcmFnZUxlbmd0aCA9IHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5sZW5ndGg7XHJcblx0dmFyIHByZWZpeCA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkpO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc3RvcmFnZUxlbmd0aDsgaSsrKSB7XHJcblx0XHRrZXkgPSB0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkua2V5KGkpXHJcblx0XHRpZiAocHJlZml4LnRlc3Qoa2V5KSkge1xyXG5cdFx0XHRrZXlzLnB1c2goa2V5LnJlcGxhY2UocHJlZml4LCAnJykpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4ga2V5cztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgc3BlY2lmaWMga2V5IGFuZCBkYXRhIGZyb20gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIHJlbW92ZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIHRoZSBkYXRhIGZvci5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5KSB7XHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gbnVsbDtcclxuXHR0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkucmVtb3ZlSXRlbSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbGwgZGF0YSBhbmQga2V5cyBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCByZW1vdmVBbGxcclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XHJcblx0dGhpcy5saXN0S2V5cygpLmZvckVhY2godGhpcy5yZW1vdmUsIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgbmFtZXNwYWNlZCBpdGVtcyBmcm9tIHRoZSBjYWNoZSBzbyB5b3VyIG5leHQge3sjY3Jvc3NMaW5rIFwiU3RvcmUvZ2V0XCJ9fVN0b3JlI2dldHt7L2Nyb3NzTGlua319IHdpbGwgYmUgZnJlc2ggZnJvbSB0aGUgc3RvcmFnZS5cclxuICogQG1ldGhvZCBmcmVzaGVuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byByZW1vdmUgdGhlIGNhY2hlIGRhdGEgZm9yLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmZyZXNoZW4gPSBmdW5jdGlvbiAoa2V5KSB7XHJcblx0dmFyIGtleXMgPSBrZXkgPyBba2V5XSA6IHRoaXMubGlzdEtleXMoKTtcclxuXHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gbnVsbDtcclxuXHR9LCB0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNaWdyYXRlIGRhdGEgZnJvbSBhIGRpZmZlcmVudCBuYW1lc3BhY2UgdG8gY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgbWlncmF0ZVxyXG4gKiBAcGFyYW0ge29iamVjdH0gICBtaWdyYXRpb24gICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBtaWdyYXRpb24gb2JqZWN0LlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24udG9LZXkgICAgICAgICAgICAgICAgICAgIFRoZSBrZXkgbmFtZSB1bmRlciB5b3VyIGN1cnJlbnQgbmFtZXNwYWNlIHRoZSBvbGQgZGF0YSBzaG91bGQgY2hhbmdlIHRvLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24uZnJvbU5hbWVzcGFjZSAgICAgICAgICAgIFRoZSBvbGQgbmFtZXNwYWNlIHRoYXQgdGhlIG9sZCBrZXkgYmVsb25ncyB0by5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbWlncmF0aW9uLmZyb21LZXkgICAgICAgICAgICAgICAgICBUaGUgb2xkIGtleSBuYW1lIHRvIG1pZ3JhdGUgZnJvbS5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgW21pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGVdICAgICAgICBUaGUgc3RvcmFnZSB0eXBlIHRvIG1pZ3JhdGUgZnJvbS4gRGVmYXVsdHMgdG8gc2FtZSB0eXBlIGFzIHdoZXJlIHlvdSBhcmUgbWlncmF0aW5nIHRvLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICBbbWlncmF0aW9uLmtlZXBPbGREYXRhPWZhbHNlXSAgICAgIFdoZXRoZXIgb2xkIGRhdGEgc2hvdWxkIGJlIGtlcHQgYWZ0ZXIgaXQgaGFzIGJlZW4gbWlncmF0ZWQuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gIFttaWdyYXRpb24ub3ZlcndyaXRlTmV3RGF0YT1mYWxzZV0gV2hldGhlciBvbGQgZGF0YSBzaG91bGQgb3ZlcndyaXRlIGN1cnJlbnRseSBzdG9yZWQgZGF0YSBpZiBpdCBleGlzdHMuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFttaWdyYXRpb24udHJhbnNmb3JtXSAgICAgICAgICAgICAgVGhlIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIG9sZCBrZXkgZGF0YSB0aHJvdWdoIGJlZm9yZSBtaWdyYXRpbmcuXHJcbiAqIEBleGFtcGxlXHJcbiAqIFxyXG4gKiAgICAgdmFyIFN0b3JlID0gcmVxdWlyZSgnc3RvcmFnZS13cmFwcGVyJyk7XHJcbiAqICAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG4gKiAgICAgICAgIG5hbWVzcGFjZTogJ215TmV3QXBwJ1xyXG4gKiAgICAgfSk7XHJcbiAqXHJcbiAqICAgICAvLyBNaWdyYXRlIGZyb20gdGhlIG9sZCBhcHAuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ25ldy1rZXknLFxyXG4gKiAgICAgICAgIGZyb21OYW1lc3BhY2U6ICdteU9sZEFwcCcsXHJcbiAqICAgICAgICAgZnJvbUtleTogJ29sZC1rZXknXHJcbiAqICAgICB9KTtcclxuICogICAgIFxyXG4gKiAgICAgLy8gTWlncmF0ZSBmcm9tIGdsb2JhbCBkYXRhLiBVc2VmdWwgd2hlbiBtb3ZpbmcgZnJvbSBvdGhlciBzdG9yYWdlIHdyYXBwZXJzIG9yIHJlZ3VsYXIgb2wnIGBsb2NhbFN0b3JhZ2VgLlxyXG4gKiAgICAgc3RvcmUubWlncmF0ZSh7XHJcbiAqICAgICAgICAgdG9LZXk6ICdvdGhlci1uZXcta2V5JyxcclxuICogICAgICAgICBmcm9tTmFtZXNwYWNlOiAnJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb3RoZXItb2xkLWtleS1vbi1nbG9iYWwnXHJcbiAqICAgICB9KTtcclxuICogICAgIFxyXG4gKiAgICAgLy8gTWlncmF0ZSBzb21lIEpTT04gZGF0YSB0aGF0IHdhcyBzdG9yZWQgYXMgYSBzdHJpbmcuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ25ldy1qc29uLWtleScsXHJcbiAqICAgICAgICAgZnJvbU5hbWVzcGFjZTogJ215T2xkQXBwJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb2xkLWpzb24ta2V5JyxcclxuICogICAgICAgICAvLyBUcnkgY29udmVydGluZyBzb21lIG9sZCBKU09OIGRhdGEuXHJcbiAqICAgICAgICAgdHJhbnNmb3JtOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gKiAgICAgICAgICAgICB0cnkge1xyXG4gKiAgICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XHJcbiAqICAgICAgICAgICAgIH1cclxuICogICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICogICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gKiAgICAgICAgICAgICB9XHJcbiAqICAgICAgICAgfVxyXG4gKiAgICAgfSk7XHJcbiAqL1xyXG5cclxuU3RvcmUucHJvdG90eXBlLm1pZ3JhdGUgPSBmdW5jdGlvbiAobWlncmF0aW9uKSB7XHJcblx0Ly8gU2F2ZSBvdXIgY3VycmVudCBuYW1lc3BhY2UuXHJcblx0dmFyIHRvTmFtZXNwYWNlID0gdGhpcy5nZXROYW1lc3BhY2UoKTtcclxuXHR2YXIgdG9TdG9yYWdlVHlwZSA9IHRoaXMuZ2V0U3RvcmFnZVR5cGUoKTtcclxuXHJcblx0Ly8gQ3JlYXRlIGEgdGVtcG9yYXJ5IHN0b3JlIHRvIGF2b2lkIGNoYW5naW5nIG5hbWVzcGFjZSBkdXJpbmcgYWN0dWFsIGdldC9zZXRzLlxyXG5cdHZhciBzdG9yZSA9IG5ldyBTdG9yZSh7XHJcblx0XHRuYW1lc3BhY2U6IHRvTmFtZXNwYWNlLFxyXG5cdFx0c3RvcmFnZVR5cGU6IHRvU3RvcmFnZVR5cGVcclxuXHR9KTtcclxuXHJcblx0dmFyIGRhdGEgPSBudWxsO1xyXG5cclxuXHQvLyBHZXQgZGF0YSBmcm9tIG9sZCBuYW1lc3BhY2UuXHJcblx0c3RvcmUuc2V0TmFtZXNwYWNlKG1pZ3JhdGlvbi5mcm9tTmFtZXNwYWNlKTtcclxuXHRpZiAodHlwZW9mIG1pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGUgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRzdG9yZS5zZXRTdG9yYWdlVHlwZShtaWdyYXRpb24uZnJvbVN0b3JhZ2VUeXBlKTtcclxuXHR9XHJcblx0ZGF0YSA9IHN0b3JlLmdldChtaWdyYXRpb24uZnJvbUtleSk7XHJcblxyXG5cdC8vIFJlbW92ZSBvbGQgaWYgbmVlZGVkLlxyXG5cdGlmICghbWlncmF0aW9uLmtlZXBPbGREYXRhKSB7XHJcblx0XHRzdG9yZS5yZW1vdmUobWlncmF0aW9uLmZyb21LZXkpO1xyXG5cdH1cclxuXHRcclxuXHQvLyBObyBkYXRhLCBpZ25vcmUgdGhpcyBtaWdyYXRpb24uXHJcblx0aWYgKGRhdGEgPT09IG51bGwpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8vIFRyYW5zZm9ybSBkYXRhIGlmIG5lZWRlZC5cclxuXHRpZiAodHlwZW9mIG1pZ3JhdGlvbi50cmFuc2Zvcm0gPT09ICdmdW5jdGlvbicpIHtcclxuXHRcdGRhdGEgPSBtaWdyYXRpb24udHJhbnNmb3JtKGRhdGEpO1xyXG5cdH1cclxuXHRlbHNlIGlmICh0eXBlb2YgbWlncmF0aW9uLnRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0cmFuc2Zvcm0gY2FsbGJhY2suJyk7XHJcblx0fVxyXG5cclxuXHQvLyBHbyBiYWNrIHRvIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG5cdHN0b3JlLnNldE5hbWVzcGFjZSh0b05hbWVzcGFjZSk7XHJcblx0c3RvcmUuc2V0U3RvcmFnZVR5cGUodG9TdG9yYWdlVHlwZSk7XHJcblxyXG5cdC8vIE9ubHkgb3ZlcndyaXRlIG5ldyBkYXRhIGlmIGl0IGRvZXNuJ3QgZXhpc3Qgb3IgaXQncyByZXF1ZXN0ZWQuXHJcblx0aWYgKHN0b3JlLmdldChtaWdyYXRpb24udG9LZXkpID09PSBudWxsIHx8IG1pZ3JhdGlvbi5vdmVyd3JpdGVOZXdEYXRhKSB7XHJcblx0XHRzdG9yZS5zZXQobWlncmF0aW9uLnRvS2V5LCBkYXRhKTtcclxuXHR9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHN1YnN0b3JlIHRoYXQgaXMgbmVzdGVkIGluIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBjcmVhdGVTdWJzdG9yZVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVzcGFjZSBUaGUgc3Vic3RvcmUncyBuYW1lc3BhY2UuXHJcbiAqIEByZXR1cm4ge1N0b3JlfSAgICAgICAgICAgIFRoZSBzdWJzdG9yZS5cclxuICogQGV4YW1wbGVcclxuICogXHJcbiAqICAgICB2YXIgU3RvcmUgPSByZXF1aXJlKCdzdG9yYWdlLXdyYXBwZXInKTtcclxuICogICAgIC8vIENyZWF0ZSBtYWluIHN0b3JlLlxyXG4gKiAgICAgdmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuICogICAgICAgICBuYW1lc3BhY2U6ICdteWFwcCdcclxuICogICAgIH0pO1xyXG4gKlxyXG4gKiAgICAgLy8gQ3JlYXRlIHN1YnN0b3JlLlxyXG4gKiAgICAgdmFyIHN1YnN0b3JlID0gc3RvcmUuY3JlYXRlU3Vic3RvcmUoJ3RoaW5ncycpO1xyXG4gKiAgICAgc3Vic3RvcmUuc2V0KCdmb28nLCAnYmFyJyk7XHJcbiAqXHJcbiAqICAgICBzdWJzdG9yZS5nZXQoJ2ZvbycpID09PSBzdG9yZS5nZXQoJ3RoaW5nczpmb28nKTtcclxuICogICAgIC8vIHRydWVcclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5jcmVhdGVTdWJzdG9yZSA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHRyZXR1cm4gbmV3IFN0b3JlKHtcclxuXHRcdG5hbWVzcGFjZTogdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkgKyBuYW1lc3BhY2UsXHJcblx0XHRzdG9yYWdlVHlwZTogdGhpcy5nZXRTdG9yYWdlVHlwZSgpXHJcblx0fSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0b3JlO1xyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcbiAgXCJuYW1lXCI6IFwidHdpdGNoLWNoYXQtZW1vdGVzXCIsXHJcbiAgXCJ2ZXJzaW9uXCI6IFwiMi4xLjNcIixcclxuICBcImhvbWVwYWdlXCI6IFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9cIixcclxuICBcImJ1Z3NcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvaXNzdWVzXCIsXHJcbiAgXCJhdXRob3JcIjogXCJSeWFuIENoYXRoYW0gPHJ5YW4uYi5jaGF0aGFtQGdtYWlsLmNvbT4gKGh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjKVwiLFxyXG4gIFwicmVwb3NpdG9yeVwiOiB7XHJcbiAgICBcInR5cGVcIjogXCJnaXRcIixcclxuICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2NsZXR1c2MvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzLmdpdFwiXHJcbiAgfSxcclxuICBcInVzZXJzY3JpcHRcIjoge1xyXG4gICAgXCJuYW1lXCI6IFwiVHdpdGNoIENoYXQgRW1vdGVzXCIsXHJcbiAgICBcIm5hbWVzcGFjZVwiOiBcIiNDbGV0dXNcIixcclxuICAgIFwidmVyc2lvblwiOiBcInt7e3BrZy52ZXJzaW9ufX19XCIsXHJcbiAgICBcImRlc2NyaXB0aW9uXCI6IFwiQWRkcyBhIGJ1dHRvbiB0byBUd2l0Y2ggdGhhdCBhbGxvd3MgeW91IHRvIFxcXCJjbGljay10by1pbnNlcnRcXFwiIGFuIGVtb3RlLlwiLFxyXG4gICAgXCJjb3B5cmlnaHRcIjogXCIyMDExKywge3t7cGtnLmF1dGhvcn19fVwiLFxyXG4gICAgXCJhdXRob3JcIjogXCJ7e3twa2cuYXV0aG9yfX19XCIsXHJcbiAgICBcImljb25cIjogXCJodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIucGhwP2dyYXZhdGFyX2lkPTY4NzVlODNhYTZjNTYzNzkwY2IyZGE5MTRhYWJhOGIzJnI9UEcmcz00OCZkZWZhdWx0PWlkZW50aWNvblwiLFxyXG4gICAgXCJsaWNlbnNlXCI6IFtcclxuICAgICAgXCJNSVQ7IGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcIixcclxuICAgICAgXCJDQyBCWS1OQy1TQSAzLjA7IGh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LW5jLXNhLzMuMC9cIlxyXG4gICAgXSxcclxuICAgIFwiaG9tZXBhZ2VcIjogXCJ7e3twa2cuaG9tZXBhZ2V9fX1cIixcclxuICAgIFwic3VwcG9ydFVSTFwiOiBcInt7e3BrZy5idWdzfX19XCIsXHJcbiAgICBcImNvbnRyaWJ1dGlvblVSTFwiOiBcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvI2RvbmF0ZVwiLFxyXG4gICAgXCJncmFudFwiOiBcIm5vbmVcIixcclxuICAgIFwiaW5jbHVkZVwiOiBbXHJcbiAgICAgIFwiaHR0cDovLyoudHdpdGNoLnR2LypcIixcclxuICAgICAgXCJodHRwczovLyoudHdpdGNoLnR2LypcIlxyXG4gICAgXSxcclxuICAgIFwiZXhjbHVkZVwiOiBbXHJcbiAgICAgIFwiaHR0cDovL2FwaS50d2l0Y2gudHYvKlwiLFxyXG4gICAgICBcImh0dHBzOi8vYXBpLnR3aXRjaC50di8qXCIsXHJcbiAgICAgIFwiaHR0cDovL3RtaS50d2l0Y2gudHYvKlwiLFxyXG4gICAgICBcImh0dHBzOi8vdG1pLnR3aXRjaC50di8qXCIsXHJcbiAgICAgIFwiaHR0cDovLyoudHdpdGNoLnR2LyovZGFzaGJvYXJkXCIsXHJcbiAgICAgIFwiaHR0cHM6Ly8qLnR3aXRjaC50di8qL2Rhc2hib2FyZFwiLFxyXG4gICAgICBcImh0dHA6Ly9jaGF0ZGVwb3QudHdpdGNoLnR2LypcIixcclxuICAgICAgXCJodHRwczovL2NoYXRkZXBvdC50d2l0Y2gudHYvKlwiLFxyXG4gICAgICBcImh0dHA6Ly9pbS50d2l0Y2gudHYvKlwiLFxyXG4gICAgICBcImh0dHBzOi8vaW0udHdpdGNoLnR2LypcIixcclxuICAgICAgXCJodHRwOi8vcGxhdGZvcm0udHdpdHRlci5jb20vKlwiLFxyXG4gICAgICBcImh0dHBzOi8vcGxhdGZvcm0udHdpdHRlci5jb20vKlwiLFxyXG4gICAgICBcImh0dHA6Ly93d3cuZmFjZWJvb2suY29tLypcIixcclxuICAgICAgXCJodHRwczovL3d3dy5mYWNlYm9vay5jb20vKlwiXHJcbiAgICBdXHJcbiAgfSxcclxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XHJcbiAgICBcImJyb3dzZXItc3luY1wiOiBcIl4xLjMuMlwiLFxyXG4gICAgXCJicm93c2VyaWZ5XCI6IFwiXjUuOS4xXCIsXHJcbiAgICBcImdlbmVyYXRlLXVzZXJzY3JpcHQtaGVhZGVyXCI6IFwiXjEuMC4wXCIsXHJcbiAgICBcImd1bHBcIjogXCJeMy44LjNcIixcclxuICAgIFwiZ3VscC1hdXRvcHJlZml4ZXJcIjogXCIwLjAuOFwiLFxyXG4gICAgXCJndWxwLWJlYXV0aWZ5XCI6IFwiMS4xLjBcIixcclxuICAgIFwiZ3VscC1jaGFuZ2VkXCI6IFwiXjAuNC4xXCIsXHJcbiAgICBcImd1bHAtY29uY2F0XCI6IFwiXjIuMi4wXCIsXHJcbiAgICBcImd1bHAtY29uZmxpY3RcIjogXCJeMC4xLjJcIixcclxuICAgIFwiZ3VscC1jc3MtYmFzZTY0XCI6IFwiXjEuMS4wXCIsXHJcbiAgICBcImd1bHAtY3NzMmpzXCI6IFwiXjEuMC4yXCIsXHJcbiAgICBcImd1bHAtaGVhZGVyXCI6IFwiXjEuMC4yXCIsXHJcbiAgICBcImd1bHAtaG9nYW4tY29tcGlsZVwiOiBcIl4wLjIuMVwiLFxyXG4gICAgXCJndWxwLW1pbmlmeS1jc3NcIjogXCJeMC4zLjVcIixcclxuICAgIFwiZ3VscC1ub3RpZnlcIjogXCJeMS40LjFcIixcclxuICAgIFwiZ3VscC1yZW5hbWVcIjogXCJeMS4yLjBcIixcclxuICAgIFwiZ3VscC11Z2xpZnlcIjogXCJeMC4zLjFcIixcclxuICAgIFwiZ3VscC11dGlsXCI6IFwiXjMuMC4wXCIsXHJcbiAgICBcImhvZ2FuLmpzXCI6IFwiXjMuMC4yXCIsXHJcbiAgICBcImpxdWVyeS11aVwiOiBcIl4xLjEwLjVcIixcclxuICAgIFwianF1ZXJ5LnNjcm9sbGJhclwiOiBcIl4wLjIuN1wiLFxyXG4gICAgXCJwcmV0dHktaHJ0aW1lXCI6IFwiXjAuMi4xXCIsXHJcbiAgICBcInN0b3JhZ2Utd3JhcHBlclwiOiBcImNsZXR1c2Mvc3RvcmFnZS13cmFwcGVyI3YwLjEuMVwiLFxyXG4gICAgXCJ2aW55bC1tYXBcIjogXCJeMS4wLjFcIixcclxuICAgIFwidmlueWwtc291cmNlLXN0cmVhbVwiOiBcIl4wLjEuMVwiLFxyXG4gICAgXCJ3YXRjaGlmeVwiOiBcIl4xLjAuMVwiXHJcbiAgfVxyXG59XHJcbiIsInZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG52YXIgYXBpID0ge307XHJcbnZhciBlbWJlciA9IG51bGw7XHJcbnZhciBob29rZWRGYWN0b3JpZXMgPSB7fTtcclxuXHJcbmFwaS5nZXRFbWJlciA9IGZ1bmN0aW9uICgpIHtcclxuXHRpZiAoZW1iZXIpIHtcclxuXHRcdHJldHVybiBlbWJlcjtcclxuXHR9XHJcblx0aWYgKHdpbmRvdy5BcHAgJiYgd2luZG93LkFwcC5fX2NvbnRhaW5lcl9fKSB7XHJcblx0XHRlbWJlciA9IHdpbmRvdy5BcHAuX19jb250YWluZXJfXztcclxuXHRcdHJldHVybiBlbWJlcjtcclxuXHR9XHJcblx0cmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxuYXBpLmlzTG9hZGVkID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiBCb29sZWFuKGFwaS5nZXRFbWJlcigpKTtcclxufTtcclxuXHJcbmFwaS5sb29rdXAgPSBmdW5jdGlvbiAobG9va3VwRmFjdG9yeSkge1xyXG5cdGlmICghYXBpLmlzTG9hZGVkKCkpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmFjdG9yeSBsb29rdXAgZmFpbHVyZSwgRW1iZXIgbm90IGxvYWRlZC4nKTtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblx0cmV0dXJuIGFwaS5nZXRFbWJlcigpLmxvb2t1cChsb29rdXBGYWN0b3J5KTtcclxufTtcclxuXHJcbmFwaS5ob29rID0gZnVuY3Rpb24gKGxvb2t1cEZhY3RvcnksIGFjdGl2YXRlQ2IsIGRlYWN0aXZhdGVDYikge1xyXG5cdGlmICghYXBpLmlzTG9hZGVkKCkpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmFjdG9yeSBob29rIGZhaWx1cmUsIEVtYmVyIG5vdCBsb2FkZWQuJyk7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cdGlmIChob29rZWRGYWN0b3JpZXNbbG9va3VwRmFjdG9yeV0pIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmFjdG9yeSBhbHJlYWR5IGhvb2tlZDogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdHZhciByZW9wZW5PcHRpb25zID0ge307XHJcblx0dmFyIGZhY3RvcnkgPSBhcGkubG9va3VwKGxvb2t1cEZhY3RvcnkpO1xyXG5cclxuXHRpZiAoIWZhY3RvcnkpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmFjdG9yeSBob29rIGZhaWx1cmUsIGZhY3Rvcnkgbm90IGZvdW5kOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cclxuXHRpZiAoYWN0aXZhdGVDYikge1xyXG5cdFx0cmVvcGVuT3B0aW9ucy5hY3RpdmF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0dGhpcy5fc3VwZXIoKTtcclxuXHRcdFx0YWN0aXZhdGVDYi5jYWxsKHRoaXMpO1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ0hvb2sgcnVuIG9uIGFjdGl2YXRlOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHRpZiAoZGVhY3RpdmF0ZUNiKSB7XHJcblx0XHRyZW9wZW5PcHRpb25zLmRlYWN0aXZhdGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHRoaXMuX3N1cGVyKCk7XHJcblx0XHRcdGRlYWN0aXZhdGVDYi5jYWxsKHRoaXMpO1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ0hvb2sgcnVuIG9uIGRlYWN0aXZhdGU6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdH07XHJcblx0fVxyXG5cclxuXHR0cnkge1xyXG5cdFx0ZmFjdG9yeS5yZW9wZW4ocmVvcGVuT3B0aW9ucyk7XHJcblx0XHRob29rZWRGYWN0b3JpZXNbbG9va3VwRmFjdG9yeV0gPSB0cnVlO1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGYWN0b3J5IGhvb2tlZDogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdGNhdGNoIChlcnIpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmFjdG9yeSBob29rIGZhaWx1cmUsIHVuZXhwZWN0ZWQgZXJyb3I6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdGxvZ2dlci5kZWJ1ZyhlcnIpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxufTtcclxuXHJcbmFwaS5nZXQgPSBmdW5jdGlvbiAobG9va3VwRmFjdG9yeSwgcHJvcGVydHkpIHtcclxuXHRpZiAoIWFwaS5pc0xvYWRlZCgpKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgZ2V0IGZhaWx1cmUsIEVtYmVyIG5vdCBsb2FkZWQuJyk7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cdHZhciBwcm9wZXJ0aWVzID0gcHJvcGVydHkuc3BsaXQoJy4nKTtcclxuXHR2YXIgZ2V0dGVyID0gYXBpLmxvb2t1cChsb29rdXBGYWN0b3J5KTtcclxuXHJcblx0cHJvcGVydGllcy5zb21lKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xyXG5cdFx0Ly8gSWYgZ2V0dGVyIGZhaWxzLCBqdXN0IGV4aXQsIG90aGVyd2lzZSwga2VlcCBsb29waW5nLlxyXG5cdFx0aWYgKHR5cGVvZiBnZXR0ZXIuZ2V0ID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBnZXR0ZXIuZ2V0KHByb3BlcnR5KSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdFx0Z2V0dGVyID0gZ2V0dGVyLmdldChwcm9wZXJ0eSk7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0eXBlb2YgZ2V0dGVyW3Byb3BlcnR5XSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdFx0Z2V0dGVyID0gZ2V0dGVyW3Byb3BlcnR5XTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRnZXR0ZXIgPSBudWxsO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIGdldHRlcjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXBpO1xyXG4iLCJ2YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKTtcclxudmFyIHVpID0gcmVxdWlyZSgnLi91aScpO1xyXG52YXIgYXBpID0ge307XHJcbnZhciBlbW90ZVN0b3JlID0gbmV3IEVtb3RlU3RvcmUoKTtcclxudmFyICQgPSB3aW5kb3cualF1ZXJ5O1xyXG5cclxuLyoqXHJcbiAqIFRoZSBlbnRpcmUgZW1vdGUgc3RvcmluZyBzeXN0ZW0uXHJcbiAqL1xyXG5mdW5jdGlvbiBFbW90ZVN0b3JlKCkge1xyXG5cdHZhciBnZXR0ZXJzID0ge307XHJcblx0dmFyIG5hdGl2ZUVtb3RlcyA9IHt9O1xyXG5cdHZhciBoYXNJbml0aWFsaXplZCA9IGZhbHNlO1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXQgYSBsaXN0IG9mIHVzYWJsZSBlbW90aWNvbnMuXHJcblx0ICogQHBhcmFtICB7ZnVuY3Rpb259IFtmaWx0ZXJzXSAgICAgICBBIGZpbHRlciBtZXRob2QgdG8gbGltaXQgd2hhdCBlbW90ZXMgYXJlIHJldHVybmVkLiBQYXNzZWQgdG8gQXJyYXkjZmlsdGVyLlxyXG5cdCAqIEBwYXJhbSAge2Z1bmN0aW9ufHN0cmluZ30gW3NvcnRCeV0gSG93IHRoZSBlbW90ZXMgc2hvdWxkIGJlIHNvcnRlZC4gYGZ1bmN0aW9uYCB3aWxsIGJlIHBhc3NlZCB0byBzb3J0IHZpYSBBcnJheSNzb3J0LiBgJ2NoYW5uZWwnYCBzb3J0cyBieSBjaGFubmVsIG5hbWUsIGdsb2JhbHMgZmlyc3QuIEFsbCBvdGhlciB2YWx1ZXMgKG9yIG9taXR0ZWQpIHNvcnQgYWxwaGFudW1lcmljYWxseS5cclxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IFtyZXR1cm5UeXBlXSAgICAgIGAnb2JqZWN0J2Agd2lsbCByZXR1cm4gaW4gb2JqZWN0IGZvcm1hdCwgZS5nLiBgeydLYXBwYSc6IEVtb3RlKC4uLiksIC4uLn1gLiBBbGwgb3RoZXIgdmFsdWVzIChvciBvbWl0dGVkKSByZXR1cm4gYW4gYXJyYXkgZm9ybWF0LCBlLmcuIGBbRW1vdGUoLi4uKSwgLi4uXWAuXHJcblx0ICogQHJldHVybiB7b2JqZWN0fGFycmF5fSAgICAgICAgICAgICBTZWUgYHJldHVyblR5cGVgIHBhcmFtLlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0RW1vdGVzID0gZnVuY3Rpb24gKGZpbHRlcnMsIHNvcnRCeSwgcmV0dXJuVHlwZSkge1xyXG5cdFx0dmFyIHR3aXRjaEFwaSA9IHJlcXVpcmUoJy4vdHdpdGNoLWFwaScpO1xyXG5cclxuXHRcdC8vIEdldCBuYXRpdmUgZW1vdGVzLlxyXG5cdFx0dmFyIGVtb3RlcyA9ICQuZXh0ZW5kKHt9LCBuYXRpdmVFbW90ZXMpO1xyXG5cclxuXHRcdC8vIFBhcnNlIHRoZSBjdXN0b20gZW1vdGVzIHByb3ZpZGVkIGJ5IHRoaXJkIHBhcnR5IGFkZG9ucy5cclxuXHRcdE9iamVjdC5rZXlzKGdldHRlcnMpLmZvckVhY2goZnVuY3Rpb24gKGdldHRlck5hbWUpIHtcclxuXHRcdFx0Ly8gVHJ5IHRoZSBnZXR0ZXIuXHJcblx0XHRcdHZhciByZXN1bHRzID0gbnVsbDtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRyZXN1bHRzID0gZ2V0dGVyc1tnZXR0ZXJOYW1lXSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlcnIpIHtcclxuXHRcdFx0XHRsb2dnZXIuZGVidWcoJ0Vtb3RlIGdldHRlciBgJyArIGdldHRlck5hbWUgKyAnYCBmYWlsZWQgdW5leHBlY3RlZGx5LCBza2lwcGluZy4nLCBlcnIudG9TdHJpbmcoKSk7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghQXJyYXkuaXNBcnJheShyZXN1bHRzKSkge1xyXG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZygnRW1vdGUgZ2V0dGVyIGAnICsgZ2V0dGVyTmFtZSArICdgIG11c3QgcmV0dXJuIGFuIGFycmF5LCBza2lwcGluZy4nKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIE92ZXJyaWRlIG5hdGl2ZXMgYW5kIHByZXZpb3VzIGdldHRlcnMuXHJcblx0XHRcdHJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly8gQ3JlYXRlIHRoZSBlbW90ZS5cclxuXHRcdFx0XHRcdHZhciBpbnN0YW5jZSA9IG5ldyBFbW90ZShlbW90ZSk7XHJcblxyXG5cdFx0XHRcdFx0Ly8gRm9yY2UgdGhlIGdldHRlci5cclxuXHRcdFx0XHRcdGluc3RhbmNlLnNldEdldHRlck5hbWUoZ2V0dGVyTmFtZSk7XHJcblxyXG5cdFx0XHRcdFx0Ly8gRm9yY2UgZW1vdGVzIHdpdGhvdXQgY2hhbm5lbHMgdG8gdGhlIGdldHRlcidzIG5hbWUuXHJcblx0XHRcdFx0XHRpZiAoIWVtb3RlLmNoYW5uZWwpIHtcclxuXHRcdFx0XHRcdFx0aW5zdGFuY2Uuc2V0Q2hhbm5lbE5hbWUoZ2V0dGVyTmFtZSk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Ly8gQWRkL292ZXJyaWRlIGl0LlxyXG5cdFx0XHRcdFx0ZW1vdGVzW2luc3RhbmNlLmdldFRleHQoKV0gPSBpbnN0YW5jZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdFbW90ZSBwYXJzaW5nIGZvciBnZXR0ZXIgYCcgKyBnZXR0ZXJOYW1lICsgJ2AgZmFpbGVkLCBza2lwcGluZy4nLCBlcnIudG9TdHJpbmcoKSwgZW1vdGUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBDb3ZlcnQgdG8gYXJyYXkuXHJcblx0XHRlbW90ZXMgPSBPYmplY3Qua2V5cyhlbW90ZXMpLm1hcChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0cmV0dXJuIGVtb3Rlc1tlbW90ZV07XHJcblx0XHR9KTtcclxuXHJcblx0XHQvLyBGaWx0ZXIgcmVzdWx0cy5cclxuXHRcdGlmICh0eXBlb2YgZmlsdGVycyA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRlbW90ZXMgPSBlbW90ZXMuZmlsdGVyKGZpbHRlcnMpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHQvLyBSZXR1cm4gYXMgYW4gb2JqZWN0IGlmIHJlcXVlc3RlZC5cclxuXHRcdGlmIChyZXR1cm5UeXBlID09PSAnb2JqZWN0Jykge1xyXG5cdFx0XHR2YXIgYXNPYmplY3QgPSB7fTtcclxuXHRcdFx0ZW1vdGVzLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRcdFx0YXNPYmplY3RbZW1vdGUuZ2V0VGV4dCgpXSA9IGVtb3RlO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIGFzT2JqZWN0O1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFNvcnQgcmVzdWx0cy5cclxuXHRcdGlmICh0eXBlb2Ygc29ydEJ5ID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdGVtb3Rlcy5zb3J0KHNvcnRCeSk7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmIChzb3J0QnkgPT09ICdjaGFubmVsJykge1xyXG5cdFx0XHRlbW90ZXMuc29ydChzb3J0aW5nLmFsbEVtb3Rlc0NhdGVnb3J5KTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRlbW90ZXMuc29ydChzb3J0aW5nLmJ5VGV4dCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gUmV0dXJuIHRoZSBlbW90ZXMgaW4gYXJyYXkgZm9ybWF0LlxyXG5cdFx0cmV0dXJuIGVtb3RlcztcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBSZWdpc3RlcnMgYSAzcmQgcGFydHkgZW1vdGUgaG9vay5cclxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWUgICBUaGUgbmFtZSBvZiB0aGUgM3JkIHBhcnR5IHJlZ2lzdGVyaW5nIHRoZSBob29rLlxyXG5cdCAqIEBwYXJhbSAge2Z1bmN0aW9ufSBnZXR0ZXIgVGhlIGZ1bmN0aW9uIGNhbGxlZCB3aGVuIGxvb2tpbmcgZm9yIGVtb3Rlcy4gTXVzdCByZXR1cm4gYW4gYXJyYXkgb2YgZW1vdGUgb2JqZWN0cywgZS5nLiBgW2Vtb3RlLCAuLi5dYC4gU2VlIEVtb3RlIGNsYXNzLlxyXG5cdCAqL1xyXG5cdHRoaXMucmVnaXN0ZXJHZXR0ZXIgPSBmdW5jdGlvbiAobmFtZSwgZ2V0dGVyKSB7XHJcblx0XHRpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignTmFtZSBtdXN0IGJlIGEgc3RyaW5nLicpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGdldHRlcnNbbmFtZV0pIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdHZXR0ZXIgYWxyZWFkeSBleGlzdHMuJyk7XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mIGdldHRlciAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0dldHRlciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XHJcblx0XHR9XHJcblx0XHRsb2dnZXIuZGVidWcoJ0dldHRlciByZWdpc3RlcmVkOiAnICsgbmFtZSk7XHJcblx0XHRnZXR0ZXJzW25hbWVdID0gZ2V0dGVyO1xyXG5cdFx0dWkudXBkYXRlRW1vdGVzKCk7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogUmVnaXN0ZXJzIGEgM3JkIHBhcnR5IGVtb3RlIGhvb2suXHJcblx0ICogQHBhcmFtICB7c3RyaW5nfSBuYW1lICAgVGhlIG5hbWUgb2YgdGhlIDNyZCBwYXJ0eSBob29rIHRvIGRlcmVnaXN0ZXIuXHJcblx0ICovXHJcblx0dGhpcy5kZXJlZ2lzdGVyR2V0dGVyID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnR2V0dGVyIHVucmVnaXN0ZXJlZDogJyArIG5hbWUpO1xyXG5cdFx0ZGVsZXRlIGdldHRlcnNbbmFtZV07XHJcblx0XHR1aS51cGRhdGVFbW90ZXMoKTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBJbml0aWFsaXplcyB0aGUgcmF3IGRhdGEgZnJvbSB0aGUgQVBJIGVuZHBvaW50cy4gU2hvdWxkIGJlIGNhbGxlZCBhdCBsb2FkIGFuZC9vciB3aGVuZXZlciB0aGUgQVBJIG1heSBoYXZlIGNoYW5nZWQuIFBvcHVsYXRlcyBpbnRlcm5hbCBvYmplY3RzIHdpdGggdXBkYXRlZCBkYXRhLlxyXG5cdCAqL1xyXG5cdHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmIChoYXNJbml0aWFsaXplZCkge1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ0FscmVhZHkgaW5pdGlhbGl6ZWQgRW1vdGVTdG9yZSwgc3RvcHBpbmcgaW5pdC4nKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxvZ2dlci5kZWJ1ZygnU3RhcnRpbmcgaW5pdGlhbGl6YXRpb24uJyk7XHJcblxyXG5cdFx0dmFyIHR3aXRjaEFwaSA9IHJlcXVpcmUoJy4vdHdpdGNoLWFwaScpO1xyXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRcdC8vIEhhc2ggb2YgZW1vdGUgc2V0IHRvIGZvcmNlZCBjaGFubmVsLlxyXG5cdFx0dmFyIGZvcmNlZFNldHNUb0NoYW5uZWxzID0ge1xyXG5cdFx0XHQvLyBHbG9iYWxzLlxyXG5cdFx0XHQwOiAnfmdsb2JhbCcsXHJcblx0XHRcdC8vIEJ1YmJsZSBlbW90ZXMuXHJcblx0XHRcdDMzOiAndHVyYm8nLFxyXG5cdFx0XHQvLyBNb25rZXkgZW1vdGVzLlxyXG5cdFx0XHQ0MjogJ3R1cmJvJyxcclxuXHRcdFx0Ly8gSGlkZGVuIHR1cmJvIGVtb3Rlcy5cclxuXHRcdFx0NDU3OiAndHVyYm8nLFxyXG5cdFx0XHQ3OTM6ICd0dXJibycsXHJcblx0XHRcdDE5MTUxOiAndHdpdGNoX3ByaW1lJyxcclxuXHRcdFx0MTkxOTQ6ICd0d2l0Y2hfcHJpbWUnXHJcblxyXG5cdFx0fTtcclxuXHJcblx0XHRsb2dnZXIuZGVidWcoJ0luaXRpYWxpemluZyBlbW90ZSBzZXQgY2hhbmdlIGxpc3RlbmVyLicpO1xyXG5cclxuXHRcdHR3aXRjaEFwaS5vbkVtb3Rlc0NoYW5nZShmdW5jdGlvbiAoZW1vdGVTZXRzKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnUGFyc2luZyBlbW90ZSBzZXRzLicpO1xyXG5cclxuXHRcdFx0T2JqZWN0LmtleXMoZW1vdGVTZXRzKS5mb3JFYWNoKGZ1bmN0aW9uIChzZXQpIHtcclxuXHRcdFx0XHR2YXIgZW1vdGVzID0gZW1vdGVTZXRzW3NldF07XHJcblx0XHRcdFx0c2V0ID0gTnVtYmVyKHNldCk7XHJcblx0XHRcdFx0ZW1vdGVzLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRcdFx0XHQvLyBTZXQgc29tZSByZXF1aXJlZCBpbmZvLlxyXG5cdFx0XHRcdFx0ZW1vdGUudXJsID0gJy8vc3RhdGljLWNkbi5qdHZudy5uZXQvZW1vdGljb25zL3YxLycgKyBlbW90ZS5pZCArICcvMS4wJztcclxuXHRcdFx0XHRcdGVtb3RlLnRleHQgPSBnZXRFbW90ZUZyb21SZWdFeChlbW90ZS5jb2RlKTtcclxuXHRcdFx0XHRcdGVtb3RlLnNldCA9IHNldDtcclxuXHJcblx0XHRcdFx0XHQvLyBIYXJkY29kZSB0aGUgY2hhbm5lbHMgb2YgY2VydGFpbiBzZXRzLlxyXG5cdFx0XHRcdFx0aWYgKGZvcmNlZFNldHNUb0NoYW5uZWxzW3NldF0pIHtcclxuXHRcdFx0XHRcdFx0ZW1vdGUuY2hhbm5lbCA9IGZvcmNlZFNldHNUb0NoYW5uZWxzW3NldF07XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0dmFyIGluc3RhbmNlID0gbmV3IEVtb3RlKGVtb3RlKTtcclxuXHJcblx0XHRcdFx0XHQvLyBTYXZlIHRoZSBlbW90ZSBmb3IgdXNlIGxhdGVyLlxyXG5cdFx0XHRcdFx0bmF0aXZlRW1vdGVzW2Vtb3RlLnRleHRdID0gaW5zdGFuY2U7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdMb2FkaW5nIHN1YnNjcmlwdGlvbiBkYXRhLicpO1xyXG5cclxuXHRcdFx0Ly8gR2V0IGFjdGl2ZSBzdWJzY3JpcHRpb25zIHRvIGZpbmQgdGhlIGNoYW5uZWxzLlxyXG5cdFx0XHR0d2l0Y2hBcGkuZ2V0VGlja2V0cyhmdW5jdGlvbiAodGlja2V0cykge1xyXG5cdFx0XHRcdC8vIEluc3RhbmNlcyBmcm9tIGVhY2ggY2hhbm5lbCB0byBwcmVsb2FkIGNoYW5uZWwgZGF0YS5cclxuXHRcdFx0XHR2YXIgZGVmZXJyZWRDaGFubmVsR2V0cyA9IHt9O1xyXG5cclxuXHRcdFx0XHRsb2dnZXIuZGVidWcoJ1RpY2tldHMgbG9hZGVkIGZyb20gdGhlIEFQSS4nLCB0aWNrZXRzKTtcclxuXHRcdFx0XHR0aWNrZXRzLmZvckVhY2goZnVuY3Rpb24gKHRpY2tldCkge1xyXG5cdFx0XHRcdFx0dmFyIHByb2R1Y3QgPSB0aWNrZXQucHJvZHVjdDtcclxuXHRcdFx0XHRcdHZhciBjaGFubmVsID0gcHJvZHVjdC5vd25lcl9uYW1lIHx8IHByb2R1Y3Quc2hvcnRfbmFtZTtcclxuXHJcblx0XHRcdFx0XHQvLyBHZXQgc3Vic2NyaXB0aW9ucyB3aXRoIGVtb3RlcyBvbmx5LlxyXG5cdFx0XHRcdFx0aWYgKCFwcm9kdWN0LmVtb3RpY29ucyB8fCAhcHJvZHVjdC5lbW90aWNvbnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Ly8gU2V0IHRoZSBjaGFubmVsIG9uIHRoZSBlbW90ZXMuXHJcblx0XHRcdFx0XHRwcm9kdWN0LmVtb3RpY29ucy5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0XHRcdFx0XHR2YXIgaW5zdGFuY2UgPSBuYXRpdmVFbW90ZXNbZ2V0RW1vdGVGcm9tUmVnRXgoZW1vdGUucmVnZXgpXTtcclxuXHRcdFx0XHRcdFx0aW5zdGFuY2Uuc2V0Q2hhbm5lbE5hbWUoY2hhbm5lbCk7XHJcblxyXG5cdFx0XHRcdFx0XHQvLyBTYXZlIGluc3RhbmNlIGZvciBsYXRlciwgYnV0IG9ubHkgb25lIGluc3RhbmNlIHBlciBjaGFubmVsLlxyXG5cdFx0XHRcdFx0XHRpZiAoIWRlZmVycmVkQ2hhbm5lbEdldHNbY2hhbm5lbF0pIHtcclxuXHRcdFx0XHRcdFx0XHRkZWZlcnJlZENoYW5uZWxHZXRzW2NoYW5uZWxdID0gaW5zdGFuY2U7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHQvLyBQcmVsb2FkIGNoYW5uZWwgZGF0YS5cclxuXHRcdFx0XHRPYmplY3Qua2V5cyhkZWZlcnJlZENoYW5uZWxHZXRzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdFx0XHRcdHZhciBpbnN0YW5jZSA9IGRlZmVycmVkQ2hhbm5lbEdldHNba2V5XTtcclxuXHRcdFx0XHRcdGluc3RhbmNlLmdldENoYW5uZWxCYWRnZSgpO1xyXG5cdFx0XHRcdFx0aW5zdGFuY2UuZ2V0Q2hhbm5lbERpc3BsYXlOYW1lKCk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0dWkudXBkYXRlRW1vdGVzKCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHR1aS51cGRhdGVFbW90ZXMoKTtcclxuXHRcdH0sIHRydWUpO1xyXG5cclxuXHRcdGhhc0luaXRpYWxpemVkID0gdHJ1ZTtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmluaXNoZWQgRW1vdGVTdG9yZSBpbml0aWFsaXphdGlvbi4nKTtcclxuXHR9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzcGVjaWZpYyBlbW90ZSwgaWYgYXZhaWxhYmxlLlxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBlbW90ZSB0byBnZXQuXHJcbiAqIEByZXR1cm4ge0Vtb3RlfG51bGx9ICAgICAgVGhlIEVtb3RlIGluc3RhbmNlIG9mIHRoZSBlbW90ZSBvciBgbnVsbGAgaWYgaXQgY291bGRuJ3QgYmUgZm91bmQuXHJcbiAqL1xyXG5FbW90ZVN0b3JlLnByb3RvdHlwZS5nZXRFbW90ZSA9IGZ1bmN0aW9uICh0ZXh0KSB7XHJcblx0cmV0dXJuIHRoaXMuZ2V0RW1vdGVzKG51bGwsIG51bGwsICdvYmplY3QnKVt0ZXh0XSB8fCBudWxsO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVtb3RlIG9iamVjdC5cclxuICogQHBhcmFtIHtvYmplY3R9IGRldGFpbHMgICAgICAgICAgICAgIE9iamVjdCBkZXNjcmliaW5nIHRoZSBlbW90ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGRldGFpbHMudGV4dCAgICAgICAgIFRoZSB0ZXh0IHRvIHVzZSBpbiB0aGUgY2hhdCBib3ggd2hlbiBlbW90ZSBpcyBjbGlja2VkLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGV0YWlscy51cmwgICAgICAgICAgVGhlIFVSTCBvZiB0aGUgaW1hZ2UgZm9yIHRoZSBlbW90ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IFtkZXRhaWxzLmJhZGdlXSAgICAgIFRoZSBVUkwgb2YgdGhlIGJhZGdlIGZvciB0aGUgZW1vdGUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZGV0YWlscy5jaGFubmVsXSAgICBUaGUgY2hhbm5lbCB0aGUgZW1vdGUgc2hvdWxkIGJlIGNhdGVnb3JpemVkIHVuZGVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RldGFpbHMuZ2V0dGVyTmFtZV0gVGhlIDNyZCBwYXJ0eSBnZXR0ZXIgdGhhdCByZWdpc3RlcmVkIHRoZSBlbW90ZS4gVXNlZCBpbnRlcm5hbGx5IG9ubHkuXHJcbiAqL1xyXG5mdW5jdGlvbiBFbW90ZShkZXRhaWxzKSB7XHJcblx0dmFyIHRleHQgPSBudWxsO1xyXG5cdHZhciB1cmwgPSBudWxsO1xyXG5cdHZhciBnZXR0ZXJOYW1lID0gbnVsbDtcclxuXHR2YXIgY2hhbm5lbCA9IHtcclxuXHRcdG5hbWU6IG51bGwsXHJcblx0XHRkaXNwbGF5TmFtZTogbnVsbCxcclxuXHRcdGJhZGdlOiBudWxsXHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0cyB0aGUgdGV4dCBvZiB0aGUgZW1vdGUuXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgZW1vdGUgdGV4dC5cclxuXHQgKi9cclxuXHR0aGlzLmdldFRleHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGV4dDtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSB0ZXh0IG9mIHRoZSBlbW90ZS5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlVGV4dCBUaGUgdGV4dCB0byBzZXQuXHJcblx0ICovXHJcblx0dGhpcy5zZXRUZXh0ID0gZnVuY3Rpb24gKHRoZVRleHQpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlVGV4dCAhPT0gJ3N0cmluZycgfHwgdGhlVGV4dC5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0ZXh0Jyk7XHJcblx0XHR9XHJcblx0XHR0ZXh0ID0gdGhlVGV4dDtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBnZXR0ZXIgbmFtZSB0aGlzIGVtb3RlIGJlbG9uZ3MgdG8uXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgZ2V0dGVyJ3MgbmFtZS5cclxuXHQgKi9cclxuXHR0aGlzLmdldEdldHRlck5hbWUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gZ2V0dGVyTmFtZTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBnZXR0ZXIgbmFtZSB0aGlzIGVtb3RlIGJlbG9uZ3MgdG8uXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRoZUdldHRlck5hbWUgVGhlIGdldHRlcidzIG5hbWUuXHJcblx0ICovXHJcblx0dGhpcy5zZXRHZXR0ZXJOYW1lID0gZnVuY3Rpb24gKHRoZUdldHRlck5hbWUpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlR2V0dGVyTmFtZSAhPT0gJ3N0cmluZycgfHwgdGhlR2V0dGVyTmFtZS5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBnZXR0ZXIgbmFtZScpO1xyXG5cdFx0fVxyXG5cdFx0Z2V0dGVyTmFtZSA9IHRoZUdldHRlck5hbWU7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0cyB0aGUgZW1vdGUncyBpbWFnZSBVUkwuXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgZW1vdGUgaW1hZ2UgVVJMLlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0VXJsID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHVybDtcclxuXHR9O1xyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIGVtb3RlJ3MgaW1hZ2UgVVJMLlxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0aGVVcmwgVGhlIGltYWdlIFVSTCB0byBzZXQuXHJcblx0ICovXHJcblx0dGhpcy5zZXRVcmwgPSBmdW5jdGlvbiAodGhlVXJsKSB7XHJcblx0XHRpZiAodHlwZW9mIHRoZVVybCAhPT0gJ3N0cmluZycgfHwgdGhlVXJsLmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFVSTCcpO1xyXG5cdFx0fVxyXG5cdFx0dXJsID0gdGhlVXJsO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGVtb3RlJ3MgY2hhbm5lbCBuYW1lLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGVtb3RlJ3MgY2hhbm5lbCBvciBhbiBlbXB0eSBzdHJpbmcgaWYgaXQgZG9lc24ndCBoYXZlIG9uZS5cclxuXHQgKi9cclxuXHR0aGlzLmdldENoYW5uZWxOYW1lID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCFjaGFubmVsLm5hbWUpIHtcclxuXHRcdFx0Y2hhbm5lbC5uYW1lID0gc3RvcmFnZS5jaGFubmVsTmFtZXMuZ2V0KHRoaXMuZ2V0VGV4dCgpKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBjaGFubmVsLm5hbWUgfHwgJyc7XHJcblx0fTtcclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBlbW90ZSdzIGNoYW5uZWwgbmFtZS5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlQ2hhbm5lbCBUaGUgY2hhbm5lbCBuYW1lIHRvIHNldC5cclxuXHQgKi9cclxuXHR0aGlzLnNldENoYW5uZWxOYW1lID0gZnVuY3Rpb24gKHRoZUNoYW5uZWwpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlQ2hhbm5lbCAhPT0gJ3N0cmluZycgfHwgdGhlQ2hhbm5lbC5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaGFubmVsJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gT25seSBzYXZlIHRoZSBjaGFubmVsIHRvIHN0b3JhZ2UgaWYgaXQncyBkeW5hbWljLlxyXG5cdFx0aWYgKHRoZUNoYW5uZWwgIT09ICd+Z2xvYmFsJyAmJiB0aGVDaGFubmVsICE9PSAndHVyYm8nICYmIHRoZUNoYW5uZWwgIT09ICd0d2l0Y2hfcHJpbWUnKSB7XHJcblx0XHRcdHN0b3JhZ2UuY2hhbm5lbE5hbWVzLnNldCh0aGlzLmdldFRleHQoKSwgdGhlQ2hhbm5lbCk7XHJcblx0XHR9XHJcblx0XHRjaGFubmVsLm5hbWUgPSB0aGVDaGFubmVsO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGVtb3RlIGNoYW5uZWwncyBiYWRnZSBpbWFnZSBVUkwuXHJcblx0ICogQHJldHVybiB7c3RyaW5nfG51bGx9IFRoZSBVUkwgb2YgdGhlIGJhZGdlIGltYWdlIGZvciB0aGUgZW1vdGUncyBjaGFubmVsIG9yIGBudWxsYCBpZiBpdCBkb2Vzbid0IGhhdmUgYSBjaGFubmVsLlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0Q2hhbm5lbEJhZGdlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHR3aXRjaEFwaSA9IHJlcXVpcmUoJy4vdHdpdGNoLWFwaScpO1xyXG5cdFx0dmFyIGNoYW5uZWxOYW1lID0gdGhpcy5nZXRDaGFubmVsTmFtZSgpO1xyXG5cdFx0dmFyIGRlZmF1bHRCYWRnZSA9ICcvL3N0YXRpYy1jZG4uanR2bncubmV0L2p0dl91c2VyX3BpY3R1cmVzL3N1YnNjcmliZXItc3Rhci5wbmcnO1xyXG5cclxuXHRcdC8vIE5vIGNoYW5uZWwuXHJcblx0XHRpZiAoIWNoYW5uZWxOYW1lKSB7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdpdmUgZ2xvYmFscyBhIGRlZmF1bHQgYmFkZ2UuXHJcblx0XHRpZiAoY2hhbm5lbE5hbWUgPT09ICd+Z2xvYmFsJykge1xyXG5cdFx0XHRyZXR1cm4gJy9mYXZpY29uLmljbyc7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gQWxyZWFkeSBoYXZlIG9uZSBwcmVzZXQuXHJcblx0XHRpZiAoY2hhbm5lbC5iYWRnZSkge1xyXG5cdFx0XHRyZXR1cm4gY2hhbm5lbC5iYWRnZTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBDaGVjayBzdG9yYWdlLlxyXG5cdFx0Y2hhbm5lbC5iYWRnZSA9IHN0b3JhZ2UuYmFkZ2VzLmdldChjaGFubmVsTmFtZSk7XHJcblx0XHRpZiAoY2hhbm5lbC5iYWRnZSAhPT0gbnVsbCkge1xyXG5cdFx0XHRyZXR1cm4gY2hhbm5lbC5iYWRnZTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBTZXQgZGVmYXVsdCB1bnRpbCBBUEkgcmV0dXJucyBzb21ldGhpbmcuXHJcblx0XHRjaGFubmVsLmJhZGdlID0gZGVmYXVsdEJhZGdlO1xyXG5cclxuXHRcdC8vIEdldCBmcm9tIEFQSS5cclxuXHRcdGxvZ2dlci5kZWJ1ZygnR2V0dGluZyBmcmVzaCBiYWRnZSBmb3I6ICcgKyBjaGFubmVsTmFtZSk7XHJcblx0XHR0d2l0Y2hBcGkuZ2V0QmFkZ2VzKGNoYW5uZWxOYW1lLCBmdW5jdGlvbiAoYmFkZ2VzKSB7XHJcblx0XHRcdHZhciBiYWRnZSA9IG51bGw7XHJcblxyXG5cdFx0XHQvLyBTYXZlIHR1cmJvIGJhZGdlIHdoaWxlIHdlIGFyZSBoZXJlLlxyXG5cdFx0XHRpZiAoYmFkZ2VzLnR1cmJvICYmIGJhZGdlcy50dXJiby5pbWFnZSkge1xyXG5cdFx0XHRcdGJhZGdlID0gYmFkZ2VzLnR1cmJvLmltYWdlO1xyXG5cdFx0XHRcdHN0b3JhZ2UuYmFkZ2VzLnNldCgndHVyYm8nLCBiYWRnZSwgODY0MDAwMDApO1xyXG5cclxuXHRcdFx0XHQvLyBUdXJibyBpcyBhY3R1YWxseSB3aGF0IHdlIHdhbnRlZCwgc28gd2UgYXJlIGRvbmUuXHJcblx0XHRcdFx0aWYgKGNoYW5uZWxOYW1lID09PSAndHVyYm8nKSB7XHJcblx0XHRcdFx0XHRjaGFubmVsLmJhZGdlID0gYmFkZ2U7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBTYXZlIHR1cmJvIGJhZGdlIHdoaWxlIHdlIGFyZSBoZXJlLlxyXG5cdFx0XHRpZiAoYmFkZ2VzLnByZW1pdW0gJiYgYmFkZ2VzLnByZW1pdW0uaW1hZ2UpIHtcclxuXHRcdFx0XHRiYWRnZSA9IGJhZGdlcy5wcmVtaXVtLmltYWdlO1xyXG5cdFx0XHRcdHN0b3JhZ2UuYmFkZ2VzLnNldCgndHdpdGNoX3ByaW1lJywgYmFkZ2UsIDg2NDAwMDAwKTtcclxuXHJcblx0XHRcdFx0Ly8gVHVyYm8gaXMgYWN0dWFsbHkgd2hhdCB3ZSB3YW50ZWQsIHNvIHdlIGFyZSBkb25lLlxyXG5cdFx0XHRcdGlmIChjaGFubmVsTmFtZSA9PT0gJ3R3aXRjaF9wcmltZScpIHtcclxuXHRcdFx0XHRcdGNoYW5uZWwuYmFkZ2UgPSBiYWRnZTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIFNhdmUgc3Vic2NyaWJlciBiYWRnZSBpbiBzdG9yYWdlLlxyXG5cdFx0XHRpZiAoYmFkZ2VzLnN1YnNjcmliZXIgJiYgYmFkZ2VzLnN1YnNjcmliZXIuaW1hZ2UpIHtcclxuXHRcdFx0XHRjaGFubmVsLmJhZGdlID0gYmFkZ2VzLnN1YnNjcmliZXIuaW1hZ2U7XHJcblx0XHRcdFx0c3RvcmFnZS5iYWRnZXMuc2V0KGNoYW5uZWxOYW1lLCBjaGFubmVsLmJhZGdlLCA4NjQwMDAwMCk7XHJcblx0XHRcdFx0dWkudXBkYXRlRW1vdGVzKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gTm8gc3Vic2NyaWJlciBiYWRnZS5cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y2hhbm5lbC5iYWRnZSA9IGRlZmF1bHRCYWRnZTtcclxuXHRcdFx0XHRsb2dnZXIuZGVidWcoJ0ZhaWxlZCB0byBnZXQgc3Vic2NyaWJlciBiYWRnZSBmb3I6ICcgKyBjaGFubmVsTmFtZSk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gY2hhbm5lbC5iYWRnZSB8fCBkZWZhdWx0QmFkZ2U7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgZW1vdGUncyBjaGFubmVsIGJhZGdlIGltYWdlIFVSTC5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlQmFkZ2UgVGhlIGJhZGdlIGltYWdlIFVSTCB0byBzZXQuXHJcblx0ICovXHJcblx0dGhpcy5zZXRDaGFubmVsQmFkZ2UgPSBmdW5jdGlvbiAodGhlQmFkZ2UpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlQmFkZ2UgIT09ICdzdHJpbmcnIHx8IHRoZUJhZGdlLmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhZGdlJyk7XHJcblx0XHR9XHJcblx0XHRjaGFubmVsLmJhZGdlID0gdGhlQmFkZ2U7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0IGEgY2hhbm5lbCdzIGRpc3BsYXkgbmFtZS5cclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjaGFubmVsJ3MgZGlzcGxheSBuYW1lLiBNYXkgYmUgZXF1aXZhbGVudCB0byB0aGUgY2hhbm5lbCB0aGUgZmlyc3QgdGltZSB0aGUgQVBJIG5lZWRzIHRvIGJlIGNhbGxlZC5cclxuXHQgKi9cclxuXHR0aGlzLmdldENoYW5uZWxEaXNwbGF5TmFtZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL3R3aXRjaC1hcGknKTtcclxuXHRcdHZhciBjaGFubmVsTmFtZSA9IHRoaXMuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHRcdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0XHR2YXIgZm9yY2VkQ2hhbm5lbFRvRGlzcGxheU5hbWVzID0ge1xyXG5cdFx0XHQnfmdsb2JhbCc6ICdHbG9iYWwnLFxyXG5cdFx0XHQndHVyYm8nOiAnVHdpdGNoIFR1cmJvJyxcclxuXHRcdFx0J3R3aXRjaF9wcmltZSc6ICdUd2l0Y2ggUHJpbWUnXHJcblx0XHR9O1xyXG5cclxuXHRcdC8vIE5vIGNoYW5uZWwuXHJcblx0XHRpZiAoIWNoYW5uZWxOYW1lKSB7XHJcblx0XHRcdHJldHVybiAnJztcclxuXHRcdH1cclxuXHJcblx0XHQvLyBGb3JjZWQgZGlzcGxheSBuYW1lLlxyXG5cdFx0aWYgKGZvcmNlZENoYW5uZWxUb0Rpc3BsYXlOYW1lc1tjaGFubmVsTmFtZV0pIHtcclxuXHRcdFx0cmV0dXJuIGZvcmNlZENoYW5uZWxUb0Rpc3BsYXlOYW1lc1tjaGFubmVsTmFtZV07XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gQWxyZWFkeSBoYXZlIG9uZSBwcmVzZXQuXHJcblx0XHRpZiAoY2hhbm5lbC5kaXNwbGF5TmFtZSkge1xyXG5cdFx0XHRyZXR1cm4gY2hhbm5lbC5kaXNwbGF5TmFtZTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBMb29rIGZvciBvYnZpb3VzIGJhZCBjaGFubmVsIG5hbWVzIHRoYXQgc2hvdWxkbid0IGhpdCB0aGUgQVBJIG9yIHN0b3JhZ2UuIFVzZSBjaGFubmVsIG5hbWUgaW5zdGVhZC5cclxuXHRcdGlmICgvW15hLXowLTlfXS8udGVzdChjaGFubmVsTmFtZSkpIHtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdVbmFibGUgdG8gZ2V0IGRpc3BsYXkgbmFtZSBkdWUgdG8gb2J2aW91cyBub24tc3RhbmRhcmQgY2hhbm5lbCBuYW1lIGZvcjogJyArIGNoYW5uZWxOYW1lKTtcclxuXHRcdFx0cmV0dXJuIGNoYW5uZWxOYW1lO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIENoZWNrIHN0b3JhZ2UuXHJcblx0XHRjaGFubmVsLmRpc3BsYXlOYW1lID0gc3RvcmFnZS5kaXNwbGF5TmFtZXMuZ2V0KGNoYW5uZWxOYW1lKTtcclxuXHRcdGlmIChjaGFubmVsLmRpc3BsYXlOYW1lICE9PSBudWxsKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmRpc3BsYXlOYW1lO1xyXG5cdFx0fVxyXG5cdFx0Ly8gR2V0IGZyb20gQVBJLlxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdC8vIFNldCBkZWZhdWx0IHVudGlsIEFQSSByZXR1cm5zIHNvbWV0aGluZy5cclxuXHRcdFx0Y2hhbm5lbC5kaXNwbGF5TmFtZSA9IGNoYW5uZWxOYW1lO1xyXG5cclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdHZXR0aW5nIGZyZXNoIGRpc3BsYXkgbmFtZSBmb3I6ICcgKyBjaGFubmVsTmFtZSk7XHJcblx0XHRcdHR3aXRjaEFwaS5nZXRVc2VyKGNoYW5uZWxOYW1lLCBmdW5jdGlvbiAodXNlcikge1xyXG5cdFx0XHRcdGlmICghdXNlciB8fCAhdXNlci5kaXNwbGF5X25hbWUpIHtcclxuXHRcdFx0XHRcdGxvZ2dlci5kZWJ1ZygnRmFpbGVkIHRvIGdldCBkaXNwbGF5IG5hbWUgZm9yOiAnICsgY2hhbm5lbE5hbWUpO1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly8gU2F2ZSBpdC5cclxuXHRcdFx0XHRzZWxmLnNldENoYW5uZWxEaXNwbGF5TmFtZSh1c2VyLmRpc3BsYXlfbmFtZSk7XHJcblx0XHRcdFx0dWkudXBkYXRlRW1vdGVzKCk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRyZXR1cm4gY2hhbm5lbC5kaXNwbGF5TmFtZTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBlbW90ZSdzIGNoYW5uZWwgYmFkZ2UgaW1hZ2UgVVJMLlxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0aGVCYWRnZSBUaGUgYmFkZ2UgaW1hZ2UgVVJMIHRvIHNldC5cclxuXHQgKi9cclxuXHR0aGlzLnNldENoYW5uZWxEaXNwbGF5TmFtZSA9IGZ1bmN0aW9uIChkaXNwbGF5TmFtZSkge1xyXG5cdFx0aWYgKHR5cGVvZiBkaXNwbGF5TmFtZSAhPT0gJ3N0cmluZycgfHwgZGlzcGxheU5hbWUubGVuZ3RoIDwgMSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZGlzcGxheU5hbWUnKTtcclxuXHRcdH1cclxuXHRcdGNoYW5uZWwuZGlzcGxheU5hbWUgPSBkaXNwbGF5TmFtZTtcclxuXHRcdHN0b3JhZ2UuZGlzcGxheU5hbWVzLnNldCh0aGlzLmdldENoYW5uZWxOYW1lKCksIGRpc3BsYXlOYW1lLCA4NjQwMDAwMCk7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogSW5pdGlhbGl6ZSB0aGUgZGV0YWlscy5cclxuXHQgKi9cclxuXHRcclxuXHQvLyBSZXF1aXJlZCBmaWVsZHMuXHJcblx0dGhpcy5zZXRUZXh0KGRldGFpbHMudGV4dCk7XHJcblx0dGhpcy5zZXRVcmwoZGV0YWlscy51cmwpO1xyXG5cclxuXHQvLyBPcHRpb25hbCBmaWVsZHMuXHJcblx0aWYgKGRldGFpbHMuZ2V0dGVyTmFtZSkge1xyXG5cdFx0dGhpcy5zZXRHZXR0ZXJOYW1lKGRldGFpbHMuZ2V0dGVyTmFtZSk7XHJcblx0fVxyXG5cdGlmIChkZXRhaWxzLmNoYW5uZWwpIHtcclxuXHRcdHRoaXMuc2V0Q2hhbm5lbE5hbWUoZGV0YWlscy5jaGFubmVsKTtcclxuXHR9XHJcblx0aWYgKGRldGFpbHMuY2hhbm5lbERpc3BsYXlOYW1lKSB7XHJcblx0XHR0aGlzLnNldENoYW5uZWxEaXNwbGF5TmFtZShkZXRhaWxzLmNoYW5uZWxEaXNwbGF5TmFtZSk7XHJcblx0fVxyXG5cdGlmIChkZXRhaWxzLmJhZGdlKSB7XHJcblx0XHR0aGlzLnNldENoYW5uZWxCYWRnZShkZXRhaWxzLmJhZGdlKTtcclxuXHR9XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhdGUgY2hhbmdlcnMuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFRvZ2dsZSB3aGV0aGVyIGFuIGVtb3RlIHNob3VsZCBiZSBhIGZhdm9yaXRlLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZV0gYHRydWVgIGZvcmNlcyB0aGUgZW1vdGUgdG8gYmUgYSBmYXZvcml0ZSwgYGZhbHNlYCBmb3JjZXMgdGhlIGVtb3RlIHRvIG5vdCBiZSBhIGZhdm9yaXRlLlxyXG4gKi9cclxuRW1vdGUucHJvdG90eXBlLnRvZ2dsZUZhdm9yaXRlID0gZnVuY3Rpb24gKGZvcmNlKSB7XHJcblx0aWYgKHR5cGVvZiBmb3JjZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHN0b3JhZ2Uuc3RhcnJlZC5zZXQodGhpcy5nZXRUZXh0KCksICEhZm9yY2UpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRzdG9yYWdlLnN0YXJyZWQuc2V0KHRoaXMuZ2V0VGV4dCgpLCAhdGhpcy5pc0Zhdm9yaXRlKCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRvZ2dsZSB3aGV0aGVyIGFuIGVtb3RlIHNob3VsZCBiZSB2aXNpYmxlIG91dCBvZiBlZGl0aW5nIG1vZGUuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBgdHJ1ZWAgZm9yY2VzIHRoZSBlbW90ZSB0byBiZSB2aXNpYmxlLCBgZmFsc2VgIGZvcmNlcyB0aGUgZW1vdGUgdG8gYmUgaGlkZGVuLlxyXG4gKi9cclxuRW1vdGUucHJvdG90eXBlLnRvZ2dsZVZpc2liaWxpdHkgPSBmdW5jdGlvbiAoZm9yY2UpIHtcclxuXHRpZiAodHlwZW9mIGZvcmNlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0c3RvcmFnZS52aXNpYmlsaXR5LnNldCh0aGlzLmdldFRleHQoKSwgISFmb3JjZSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHN0b3JhZ2UudmlzaWJpbGl0eS5zZXQodGhpcy5nZXRUZXh0KCksICF0aGlzLmlzVmlzaWJsZSgpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGF0ZSBnZXR0ZXJzLlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHRoZSBlbW90ZSBpcyBmcm9tIGEgM3JkIHBhcnR5LlxyXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBlbW90ZSBpcyBmcm9tIGEgM3JkIHBhcnR5LlxyXG4gKi9cclxuRW1vdGUucHJvdG90eXBlLmlzVGhpcmRQYXJ0eSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gISF0aGlzLmdldEdldHRlck5hbWUoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHRoZSBlbW90ZSB3YXMgZmF2b3JpdGVkLlxyXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBlbW90ZSB3YXMgZmF2b3JpdGVkLlxyXG4gKi9cclxuRW1vdGUucHJvdG90eXBlLmlzRmF2b3JpdGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHN0b3JhZ2Uuc3RhcnJlZC5nZXQodGhpcy5nZXRUZXh0KCksIGZhbHNlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHRoZSBlbW90ZSBpcyB2aXNpYmxlIG91dHNpZGUgb2YgZWRpdGluZyBtb2RlLlxyXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBlbW90ZSBpcyB2aXNpYmxlIG91dHNpZGUgb2YgZWRpdGluZyBtb2RlLlxyXG4gKi9cclxuRW1vdGUucHJvdG90eXBlLmlzVmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gc3RvcmFnZS52aXNpYmlsaXR5LmdldCh0aGlzLmdldFRleHQoKSwgdHJ1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV2hldGhlciB0aGUgZW1vdGUgaXMgY29uc2lkZXJlZCBhIHNpbXBsZSBzbWlsZXkuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIGlzIGNvbnNpZGVyZWQgYSBzaW1wbGUgc21pbGV5LlxyXG4gKi9cclxuRW1vdGUucHJvdG90eXBlLmlzU21pbGV5ID0gZnVuY3Rpb24gKCkge1xyXG5cdC8vIFRoZSBiYXNpYyBzbWlsZXkgZW1vdGVzLlxyXG5cdHZhciBlbW90ZXMgPSBbJzooJywgJzopJywgJzovJywgJzpcXFxcJywgJzpEJywgJzpvJywgJzpwJywgJzp6JywgJzspJywgJztwJywgJzwzJywgJz4oJywgJ0IpJywgJ1IpJywgJ29fbycsICdPX08nLCAnIy8nLCAnOjcnLCAnOj4nLCAnOlMnLCAnPF0nXTtcclxuXHRyZXR1cm4gZW1vdGVzLmluZGV4T2YodGhpcy5nZXRUZXh0KCkpICE9PSAtMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQcm9wZXJ0eSBnZXR0ZXJzL3NldHRlcnMuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIHVzYWJsZSBlbW90ZSB0ZXh0IGZyb20gYSByZWdleC5cclxuICovXHJcbmZ1bmN0aW9uIGdldEVtb3RlRnJvbVJlZ0V4KHJlZ2V4KSB7XHJcblx0aWYgKHR5cGVvZiByZWdleCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleCk7XHJcblx0fVxyXG5cdGlmICghcmVnZXgpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignYHJlZ2V4YCBtdXN0IGJlIGEgUmVnRXhwIHN0cmluZyBvciBvYmplY3QuJyk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZGVjb2RlVVJJKHJlZ2V4LnNvdXJjZSlcclxuXHJcblx0XHQvLyBSZXBsYWNlIEhUTUwgZW50aXR5IGJyYWNrZXRzIHdpdGggYWN0dWFsIGJyYWNrZXRzLlxyXG5cdFx0LnJlcGxhY2UoJyZndFxcXFw7JywgJz4nKVxyXG5cdFx0LnJlcGxhY2UoJyZsdFxcXFw7JywgJzwnKVxyXG5cclxuXHRcdC8vIFJlbW92ZSBuZWdhdGl2ZSBncm91cHMuXHJcblx0XHQvL1xyXG5cdFx0Ly8gL1xyXG5cdFx0Ly8gICBcXChcXD8hICAgICAgICAgICAgICAvLyAoPyFcclxuXHRcdC8vICAgW14pXSogICAgICAgICAgICAgIC8vIGFueSBhbW91bnQgb2YgY2hhcmFjdGVycyB0aGF0IGFyZSBub3QgKVxyXG5cdFx0Ly8gICBcXCkgICAgICAgICAgICAgICAgIC8vIClcclxuXHRcdC8vIC9nXHJcblx0XHQucmVwbGFjZSgvXFwoXFw/IVteKV0qXFwpL2csICcnKVxyXG5cclxuXHRcdC8vIFBpY2sgZmlyc3Qgb3B0aW9uIGZyb20gYSBncm91cC5cclxuXHRcdC8vXHJcblx0XHQvLyAvXHJcblx0XHQvLyAgIFxcKCAgICAgICAgICAgICAgICAgLy8gKFxyXG5cdFx0Ly8gICAoW158XSkqICAgICAgICAgICAgLy8gYW55IGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCB8XHJcblx0XHQvLyAgIFxcfD8gICAgICAgICAgICAgICAgLy8gYW4gb3B0aW9uYWwgfCBjaGFyYWN0ZXJcclxuXHRcdC8vICAgW14pXSogICAgICAgICAgICAgIC8vIGFueSBhbW91bnQgb2YgY2hhcmFjdGVycyB0aGF0IGFyZSBub3QgKVxyXG5cdFx0Ly8gICBcXCkgICAgICAgICAgICAgICAgIC8vIClcclxuXHRcdC8vIC9nXHJcblx0XHQucmVwbGFjZSgvXFwoKFtefF0pKlxcfD9bXildKlxcKS9nLCAnJDEnKVxyXG5cclxuXHRcdC8vIFBpY2sgZmlyc3QgY2hhcmFjdGVyIGZyb20gYSBjaGFyYWN0ZXIgZ3JvdXAuXHJcblx0XHQvL1xyXG5cdFx0Ly8gL1xyXG5cdFx0Ly8gICBcXFsgICAgICAgICAgICAgICAgIC8vIFtcclxuXHRcdC8vICAgKFtefFxcXVxcW10pKiAgICAgICAgLy8gYW55IGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCB8LCBbLCBvciBdXHJcblx0XHQvLyAgIFxcfD8gICAgICAgICAgICAgICAgLy8gYW4gb3B0aW9uYWwgfCBjaGFyYWN0ZXJcclxuXHRcdC8vICAgW15cXF1dKiAgICAgICAgICAgICAvLyBhbnkgYW1vdW50IG9mIGNoYXJhY3RlcnMgdGhhdCBhcmUgbm90IFssIG9yIF1cclxuXHRcdC8vICAgXFxdICAgICAgICAgICAgICAgICAvLyBdXHJcblx0XHQvLyAvZ1xyXG5cdFx0LnJlcGxhY2UoL1xcWyhbXnxcXF1cXFtdKSpcXHw/W15cXF1cXFtdKlxcXS9nLCAnJDEnKVxyXG5cclxuXHRcdC8vIFJlbW92ZSBvcHRpb25hbCBjaGFyYWN0ZXJzLlxyXG5cdFx0Ly9cclxuXHRcdC8vIC9cclxuXHRcdC8vICAgW15cXFxcXSAgICAgICAgICAgICAgLy8gYW55IGNoYXJhY3RlciB0aGF0IGlzIG5vdCBcXFxyXG5cdFx0Ly8gICBcXD8gICAgICAgICAgICAgICAgIC8vID9cclxuXHRcdC8vIC9nXHJcblx0XHQucmVwbGFjZSgvW15cXFxcXVxcPy9nLCAnJylcclxuXHJcblx0XHQvLyBSZW1vdmUgYm91bmRhcmllcyBhdCBiZWdpbm5pbmcgYW5kIGVuZC5cclxuXHRcdC5yZXBsYWNlKC9eXFxcXGJ8XFxcXGIkL2csICcnKSBcclxuXHJcblx0XHQvLyBVbmVzY2FwZSBvbmx5IHNpbmdsZSBiYWNrc2xhc2gsIG5vdCBtdWx0aXBsZS5cclxuXHRcdC8vXHJcblx0XHQvLyAvXHJcblx0XHQvLyAgIFxcXFwgICAgICAgICAgICAgICAgIC8vIFxcXHJcblx0XHQvLyAgICg/IVxcXFwpICAgICAgICAgICAgIC8vIGxvb2stYWhlYWQsIGFueSBjaGFyYWN0ZXIgdGhhdCBpc24ndCBcXFxyXG5cdFx0Ly8gL2dcclxuXHRcdC5yZXBsYWNlKC9cXFxcKD8hXFxcXCkvZywgJycpO1xyXG59XHJcblxyXG52YXIgc29ydGluZyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIFNvcnQgYnkgYWxwaGFudW1lcmljIGluIHRoaXMgb3JkZXI6IHN5bWJvbHMgLT4gbnVtYmVycyAtPiBBYUJiLi4uIC0+IG51bWJlcnNcclxuICovXHJcbnNvcnRpbmcuYnlUZXh0ID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuXHR0ZXh0QSA9IGEuZ2V0VGV4dCgpLnRvTG93ZXJDYXNlKCk7XHJcblx0dGV4dEIgPSBiLmdldFRleHQoKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuXHRpZiAodGV4dEEgPCB0ZXh0Qikge1xyXG5cdFx0cmV0dXJuIC0xO1xyXG5cdH1cclxuXHRpZiAodGV4dEEgPiB0ZXh0Qikge1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cdHJldHVybiAwO1xyXG59XHJcblxyXG4vKipcclxuICogQmFzaWMgc21pbGllcyBiZWZvcmUgbm9uLWJhc2ljIHNtaWxpZXMuXHJcbiAqL1xyXG5zb3J0aW5nLmJ5U21pbGV5ID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuXHRpZiAoYS5pc1NtaWxleSgpICYmXHQhYi5pc1NtaWxleSgpKSB7XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fVxyXG5cdGlmIChiLmlzU21pbGV5KCkgJiZcdCFhLmlzU21pbGV5KCkpIHtcclxuXHRcdHJldHVybiAxO1xyXG5cdH1cclxuXHRyZXR1cm4gMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHbG9iYWxzIGJlZm9yZSBzdWJzY3JpcHRpb24gZW1vdGVzLCBzdWJzY3JpcHRpb25zIGluIGFscGhhYmV0aWNhbCBvcmRlci5cclxuICovXHJcbnNvcnRpbmcuYnlDaGFubmVsTmFtZSA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcblx0dmFyIGNoYW5uZWxBID0gYS5nZXRDaGFubmVsTmFtZSgpO1xyXG5cdHZhciBjaGFubmVsQiA9IGIuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHJcblx0Ly8gQm90aCBkb24ndCBoYXZlIGNoYW5uZWxzLlxyXG5cdGlmICghY2hhbm5lbEEgJiYgIWNoYW5uZWxCKSB7XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdC8vIFwiQVwiIGhhcyBjaGFubmVsLCBcIkJcIiBkb2Vzbid0LlxyXG5cdGlmIChjaGFubmVsQSAmJiAhY2hhbm5lbEIpIHtcclxuXHRcdHJldHVybiAxO1xyXG5cdH1cclxuXHQvLyBcIkJcIiBoYXMgY2hhbm5lbCwgXCJBXCIgZG9lc24ndC5cclxuXHRpZiAoY2hhbm5lbEIgJiYgIWNoYW5uZWxBKSB7XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fVxyXG5cclxuXHRjaGFubmVsQSA9IGNoYW5uZWxBLnRvTG93ZXJDYXNlKCk7XHJcblx0Y2hhbm5lbEIgPSBjaGFubmVsQi50b0xvd2VyQ2FzZSgpO1xyXG5cclxuXHRpZiAoY2hhbm5lbEEgPCBjaGFubmVsQikge1xyXG5cdFx0cmV0dXJuIC0xO1xyXG5cdH1cclxuXHRpZiAoY2hhbm5lbEIgPiBjaGFubmVsQSkge1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cclxuXHQvLyBBbGwgdGhlIHNhbWVcclxuXHRyZXR1cm4gMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgZ2VuZXJhbCBzb3J0IG9yZGVyIGZvciB0aGUgYWxsIGVtb3RlcyBjYXRlZ29yeS5cclxuICogU21pbGV5cyAtPiBDaGFubmVsIGdyb3VwaW5nIC0+IGFscGhhbnVtZXJpY1xyXG4gKi9cclxuc29ydGluZy5hbGxFbW90ZXNDYXRlZ29yeSA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcblx0dmFyIGJ5U21pbGV5ID0gc29ydGluZy5ieVNtaWxleShhLCBiKTtcclxuXHR2YXIgYnlDaGFubmVsTmFtZSAgPSBzb3J0aW5nLmJ5Q2hhbm5lbE5hbWUoYSwgYik7XHJcblx0dmFyIGJ5VGV4dCA9IHNvcnRpbmcuYnlUZXh0KGEsIGIpO1xyXG5cclxuXHRpZiAoYnlTbWlsZXkgIT09IDApIHtcclxuXHRcdHJldHVybiBieVNtaWxleTtcclxuXHR9XHJcblx0aWYgKGJ5Q2hhbm5lbE5hbWUgIT09IDApIHtcclxuXHRcdHJldHVybiBieUNoYW5uZWxOYW1lO1xyXG5cdH1cclxuXHRyZXR1cm4gYnlUZXh0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBlbW90ZVN0b3JlO1xyXG4iLCJ2YXIgYXBpID0ge307XHJcbnZhciBpbnN0YW5jZSA9ICdbaW5zdGFuY2UgJyArIChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoOTk5IC0gMTAwKSkgKyAxMDApICsgJ10gJztcclxudmFyIHByZWZpeCA9ICdbRW1vdGUgTWVudV0gJztcclxudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuXHJcbmFwaS5sb2cgPSBmdW5jdGlvbiAoKSB7XHJcblx0aWYgKHR5cGVvZiBjb25zb2xlLmxvZyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0YXJndW1lbnRzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpLm1hcChmdW5jdGlvbiAoYXJnKSB7XHJcblx0XHRpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZyk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gYXJnO1xyXG5cdH0pO1xyXG5cdGlmIChzdG9yYWdlLmdsb2JhbC5nZXQoJ2RlYnVnTWVzc2FnZXNFbmFibGVkJywgZmFsc2UpKSB7XHJcblx0XHRhcmd1bWVudHMudW5zaGlmdChpbnN0YW5jZSk7XHJcblx0fVxyXG5cdGFyZ3VtZW50cy51bnNoaWZ0KHByZWZpeCk7XHJcblx0Y29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcclxufTtcclxuXHJcbmFwaS5kZWJ1ZyA9IGZ1bmN0aW9uICgpIHtcclxuXHRpZiAoIXN0b3JhZ2UuZ2xvYmFsLmdldCgnZGVidWdNZXNzYWdlc0VuYWJsZWQnLCBmYWxzZSkpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0YXJndW1lbnRzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cdGFyZ3VtZW50cy51bnNoaWZ0KCdbREVCVUddICcpO1xyXG5cdGFwaS5sb2cuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XHJcbiIsInZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG52YXIgZW1vdGVzID0gcmVxdWlyZSgnLi9lbW90ZXMnKTtcclxudmFyIGFwaSA9IHt9O1xyXG5cclxuYXBpLnRvZ2dsZURlYnVnID0gZnVuY3Rpb24gKGZvcmNlZCkge1xyXG5cdGlmICh0eXBlb2YgZm9yY2VkID09PSAndW5kZWZpbmVkJykge1xyXG5cdFx0Zm9yY2VkID0gIXN0b3JhZ2UuZ2xvYmFsLmdldCgnZGVidWdNZXNzYWdlc0VuYWJsZWQnLCBmYWxzZSk7XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0Zm9yY2VkID0gISFmb3JjZWQ7XHJcblx0fVxyXG5cdHN0b3JhZ2UuZ2xvYmFsLnNldCgnZGVidWdNZXNzYWdlc0VuYWJsZWQnLCBmb3JjZWQpO1xyXG5cdGxvZ2dlci5sb2coJ0RlYnVnIG1lc3NhZ2VzIGFyZSBub3cgJyArIChmb3JjZWQgPyAnZW5hYmxlZCcgOiAnZGlzYWJsZWQnKSk7XHJcbn07XHJcblxyXG5hcGkucmVnaXN0ZXJFbW90ZUdldHRlciA9IGVtb3Rlcy5yZWdpc3RlckdldHRlcjtcclxuYXBpLmRlcmVnaXN0ZXJFbW90ZUdldHRlciA9IGVtb3Rlcy5kZXJlZ2lzdGVyR2V0dGVyO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XHJcbiIsInZhciBTdG9yZSA9IHJlcXVpcmUoJ3N0b3JhZ2Utd3JhcHBlcicpO1xyXG52YXIgc3RvcmFnZSA9IHt9O1xyXG5cclxuLy8gR2VuZXJhbCBzdG9yYWdlLlxyXG5zdG9yYWdlLmdsb2JhbCA9IG5ldyBTdG9yZSh7XHJcblx0bmFtZXNwYWNlOiAnZW1vdGUtbWVudS1mb3ItdHdpdGNoJ1xyXG59KTtcclxuXHJcbi8vIEVtb3RlIHZpc2liaWxpdHkgc3RvcmFnZS5cclxuc3RvcmFnZS52aXNpYmlsaXR5ID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ3Zpc2liaWxpdHknKTtcclxuLy8gRW1vdGUgc3RhcnJlZCBzdG9yYWdlLlxyXG5zdG9yYWdlLnN0YXJyZWQgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgnc3RhcnJlZCcpO1xyXG4vLyBEaXNwbGF5IG5hbWUgc3RvcmFnZS5cclxuc3RvcmFnZS5kaXNwbGF5TmFtZXMgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgnZGlzcGxheU5hbWVzJyk7XHJcbi8vIENoYW5uZWwgbmFtZSBzdG9yYWdlLlxyXG5zdG9yYWdlLmNoYW5uZWxOYW1lcyA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCdjaGFubmVsTmFtZXMnKTtcclxuLy8gQmFkZ2VzIHN0b3JhZ2UuXHJcbnN0b3JhZ2UuYmFkZ2VzID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ2JhZGdlcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzdG9yYWdlO1xyXG4iLCJ2YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi4vLi4vYnVpbGQvdGVtcGxhdGVzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGRhdGEgPSB7fTtcclxuXHR2YXIga2V5ID0gbnVsbDtcclxuXHJcblx0Ly8gQ29udmVydCB0ZW1wbGF0ZXMgdG8gdGhlaXIgc2hvcnRlciBcInJlbmRlclwiIGZvcm0uXHJcblx0Zm9yIChrZXkgaW4gdGVtcGxhdGVzKSB7XHJcblx0XHRpZiAoIXRlbXBsYXRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0fVxyXG5cdFx0ZGF0YVtrZXldID0gcmVuZGVyKGtleSk7XHJcblx0fVxyXG5cclxuXHQvLyBTaG9ydGN1dCB0aGUgcmVuZGVyIGZ1bmN0aW9uLiBBbGwgdGVtcGxhdGVzIHdpbGwgYmUgcGFzc2VkIGluIGFzIHBhcnRpYWxzIGJ5IGRlZmF1bHQuXHJcblx0ZnVuY3Rpb24gcmVuZGVyKHRlbXBsYXRlKSB7XHJcblx0XHR0ZW1wbGF0ZSA9IHRlbXBsYXRlc1t0ZW1wbGF0ZV07XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcclxuXHRcdFx0cmV0dXJuIHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscyB8fCB0ZW1wbGF0ZXMsIGluZGVudCk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRhdGE7XHJcbn0pKCk7XHJcbiIsInZhciB0d2l0Y2hBcGkgPSB3aW5kb3cuVHdpdGNoLmFwaTtcclxudmFyIGpRdWVyeSA9IHdpbmRvdy5qUXVlcnk7XHJcbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG52YXIgYXBpID0ge307XHJcblxyXG5hcGkuZ2V0QmFkZ2VzID0gZnVuY3Rpb24gKHVzZXJuYW1lLCBjYWxsYmFjaykge1xyXG5cdGlmIChcclxuXHRcdFtcclxuXHRcdFx0J35nbG9iYWwnLFxyXG5cdFx0XHQndHVyYm8nLFxyXG5cdFx0XHQndHdpdGNoX3ByaW1lJ1xyXG5cdFx0XS5pbmRleE9mKHVzZXJuYW1lKSA+IC0xXHJcblx0KSB7XHJcblx0XHRpZiAoIWpRdWVyeSkge1xyXG5cdFx0XHRjYWxsYmFjayh7fSk7XHJcblx0XHR9XHJcblx0XHQvLyBOb3RlOiBub3QgYSBkb2N1bWVudGVkIEFQSSBlbmRwb2ludC5cclxuXHRcdGpRdWVyeS5nZXRKU09OKCdodHRwczovL2JhZGdlcy50d2l0Y2gudHYvdjEvYmFkZ2VzL2dsb2JhbC9kaXNwbGF5JylcclxuXHRcdFx0LmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0XHRcdHZhciBiYWRnZXMgPSB7XHJcblx0XHRcdFx0XHR0dXJibzoge1xyXG5cdFx0XHRcdFx0XHRpbWFnZTogYXBpLmJhZGdlX3NldHMudHVyYm8udmVyc2lvbnNbJzEnXS5pbWFnZV91cmxfMXhcclxuXHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRwcmVtaXVtOiB7XHJcblx0XHRcdFx0XHRcdGltYWdlOiBhcGkuYmFkZ2Vfc2V0cy5wcmVtaXVtLnZlcnNpb25zWycxJ10uaW1hZ2VfdXJsXzF4XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRjYWxsYmFjayhiYWRnZXMpO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0Y2FsbGJhY2soe30pO1xyXG5cdFx0XHR9KTtcclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHR0d2l0Y2hBcGkuZ2V0KCdjaGF0LycgKyB1c2VybmFtZSArICcvYmFkZ2VzJylcclxuXHRcdFx0LmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0XHRcdGNhbGxiYWNrKGFwaSk7XHJcblx0XHRcdH0pXHJcblx0XHRcdC5mYWlsKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRjYWxsYmFjayh7fSk7XHJcblx0XHRcdH0pO1xyXG5cdH1cclxufTtcclxuXHJcbmFwaS5nZXRVc2VyID0gZnVuY3Rpb24gKHVzZXJuYW1lLCBjYWxsYmFjaykge1xyXG5cdC8vIE5vdGU6IG5vdCBhIGRvY3VtZW50ZWQgQVBJIGVuZHBvaW50LlxyXG5cdHR3aXRjaEFwaS5nZXQoJ3VzZXJzLycgKyB1c2VybmFtZSlcclxuXHRcdC5kb25lKGZ1bmN0aW9uIChhcGkpIHtcclxuXHRcdFx0Y2FsbGJhY2soYXBpKTtcclxuXHRcdH0pXHJcblx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGNhbGxiYWNrKHt9KTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxuYXBpLmdldFRpY2tldHMgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuXHQvLyBOb3RlOiBub3QgYSBkb2N1bWVudGVkIEFQSSBlbmRwb2ludC5cclxuXHR0d2l0Y2hBcGkuZ2V0KFxyXG5cdFx0Jy9hcGkvdXNlcnMvOmxvZ2luL3RpY2tldHMnLFxyXG5cdFx0e1xyXG5cdFx0XHRvZmZzZXQ6IDAsXHJcblx0XHRcdGxpbWl0OiAxMDAsXHJcblx0XHRcdHVuZW5kZWQ6IHRydWVcclxuXHRcdH1cclxuXHQpXHJcblx0XHQuZG9uZShmdW5jdGlvbiAoYXBpKSB7XHJcblx0XHRcdGNhbGxiYWNrKGFwaS50aWNrZXRzIHx8IFtdKTtcclxuXHRcdH0pXHJcblx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGNhbGxiYWNrKFtdKTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxuYXBpLm9uRW1vdGVzQ2hhbmdlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBpbW1lZGlhdGUpIHtcclxuXHRsb2dnZXIuZGVidWcoJ29uRW1vdGVzQ2hhbmdlIGNhbGxlZC4nKTtcclxuXHR2YXIgZW1iZXIgPSByZXF1aXJlKCcuL2VtYmVyLWFwaScpO1xyXG5cdHZhciBzZXNzaW9uID0gZW1iZXIuZ2V0KCdjb250cm9sbGVyOmNoYXQnLCAnY3VycmVudFJvb20udG1pUm9vbS5zZXNzaW9uJyk7XHJcblx0dmFyIHJlc3BvbnNlID0gbnVsbDtcclxuXHJcblx0aWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdgY2FsbGJhY2tgIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcclxuXHR9XHJcblxyXG5cdC8vIE5vIHBhcnNlciBvciBubyBlbW90ZXMgbG9hZGVkIHlldCwgdHJ5IGFnYWluLlxyXG5cdGlmICghc2Vzc2lvbikge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdvbkVtb3Rlc0NoYW5nZSBzZXNzaW9uIG1pc3NpbmcsIHRyeWluZyBhZ2Fpbi4nKTtcclxuXHRcdHNldFRpbWVvdXQoYXBpLm9uRW1vdGVzQ2hhbmdlLCAxMDAsIGNhbGxiYWNrLCBpbW1lZGlhdGUpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Ly8gQ2FsbCB0aGUgY2FsbGJhY2sgaW1tZWRpYXRlbHkgb24gcmVnaXN0ZXJpbmcuXHJcblx0aWYgKGltbWVkaWF0ZSkge1xyXG5cdFx0cmVzcG9uc2UgPSBzZXNzaW9uLmdldEVtb3RlcygpO1xyXG5cdFx0aWYgKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UuZW1vdGljb25fc2V0cykge1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ29uRW1vdGVzQ2hhbmdlIG5vIGVtb3RpY29uX3NldHMsIHRyeWluZyBhZ2Fpbi4nKTtcclxuXHRcdFx0c2V0VGltZW91dChhcGkub25FbW90ZXNDaGFuZ2UsIDEwMCwgY2FsbGJhY2ssIGltbWVkaWF0ZSk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsb2dnZXIuZGVidWcoJ29uRW1vdGVzQ2hhbmdlIGNhbGxiYWNrIGNhbGxlZCBpbW1lZGlhdGVseS4nKTtcclxuXHRcdGNhbGxiYWNrKHJlc3BvbnNlLmVtb3RpY29uX3NldHMpO1xyXG5cdH1cclxuXHJcblx0Ly8gTGlzdGVuIGZvciB0aGUgZXZlbnQuXHJcblx0c2Vzc2lvbi5fZW1vdGVzUGFyc2VyLm9uKCdlbW90ZXNfY2hhbmdlZCcsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdvbkVtb3Rlc0NoYW5nZSBjYWxsYmFjayBjYWxsZWQgd2hpbGUgbGlzdGVuaW5nLicpO1xyXG5cdFx0Y2FsbGJhY2socmVzcG9uc2UuZW1vdGljb25fc2V0cyk7XHJcblx0fSk7XHJcblxyXG5cdGxvZ2dlci5kZWJ1ZygnUmVnaXN0ZXJlZCBsaXN0ZW5lciBmb3IgZW1vdGUgY2hhbmdlcy4nKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXBpO1xyXG4iLCJ2YXIgYXBpID0ge307XHJcbnZhciAkID0galF1ZXJ5ID0gd2luZG93LmpRdWVyeTtcclxudmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XHJcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcbnZhciBlbW90ZXMgPSByZXF1aXJlKCcuL2Vtb3RlcycpO1xyXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKTtcclxuXHJcbnZhciB0aGVNZW51ID0gbmV3IFVJTWVudSgpO1xyXG52YXIgdGhlTWVudUJ1dHRvbiA9IG5ldyBVSU1lbnVCdXR0b24oKTtcclxuXHJcbmFwaS5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG5cdC8vIExvYWQgQ1NTLlxyXG5cdHJlcXVpcmUoJy4uLy4uL2J1aWxkL3N0eWxlcycpO1xyXG5cclxuXHQvLyBMb2FkIGpRdWVyeSBwbHVnaW5zLlxyXG5cdHJlcXVpcmUoJy4uL3BsdWdpbnMvcmVzaXphYmxlJyk7XHJcblx0cmVxdWlyZSgnanF1ZXJ5LnNjcm9sbGJhcicpO1xyXG5cclxuXHR0aGVNZW51QnV0dG9uLmluaXQoKTtcclxuXHR0aGVNZW51LmluaXQoKTtcclxufTtcclxuXHJcbmFwaS5oaWRlTWVudSA9IGZ1bmN0aW9uICgpIHtcclxuXHRpZiAodGhlTWVudS5kb20gJiYgdGhlTWVudS5kb20ubGVuZ3RoKSB7XHJcblx0XHR0aGVNZW51LnRvZ2dsZURpc3BsYXkoZmFsc2UpO1xyXG5cdH1cclxufTtcclxuXHJcbmFwaS51cGRhdGVFbW90ZXMgPSBmdW5jdGlvbiAoKSB7XHJcblx0dGhlTWVudS51cGRhdGVFbW90ZXMoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gVUlNZW51QnV0dG9uKCkge1xyXG5cdHRoaXMuZG9tID0gbnVsbDtcclxufVxyXG5cclxuVUlNZW51QnV0dG9uLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKHRpbWVzRmFpbGVkKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBjaGF0QnV0dG9uID0gJCgnLnNlbmQtY2hhdC1idXR0b24sIC5jaGF0LWJ1dHRvbnMtY29udGFpbmVyIGJ1dHRvbicpO1xyXG5cdHZhciBmYWlsQ291bnRlciA9IHRpbWVzRmFpbGVkIHx8IDA7XHJcblx0dGhpcy5kb20gPSAkKCcjZW1vdGUtbWVudS1idXR0b24nKTtcclxuXHJcblx0Ly8gRWxlbWVudCBhbHJlYWR5IGV4aXN0cy5cclxuXHRpZiAodGhpcy5kb20ubGVuZ3RoKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ01lbnVCdXR0b24gYWxyZWFkeSBleGlzdHMsIHN0b3BwaW5nIGluaXQuJyk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGlmICghY2hhdEJ1dHRvbi5sZW5ndGgpIHtcclxuXHRcdGZhaWxDb3VudGVyICs9IDE7XHJcblx0XHRpZiAoZmFpbENvdW50ZXIgPT09IDEpIHtcclxuXHRcdFx0bG9nZ2VyLmxvZygnTWVudUJ1dHRvbiBjb250YWluZXIgbWlzc2luZywgdHJ5aW5nIGFnYWluLicpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGZhaWxDb3VudGVyID49IDEwKSB7XHJcblx0XHRcdGxvZ2dlci5sb2coJ01lbnVCdXR0b24gY29udGFpbmVyIG1pc3NpbmcsIE1lbnVCdXR0b24gdW5hYmxlIHRvIGJlIGFkZGVkLCBzdG9wcGluZyBpbml0LicpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRzZWxmLmluaXQoZmFpbENvdW50ZXIpO1xyXG5cdFx0fSwgMTAwMCk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdC8vIENyZWF0ZSBlbGVtZW50LlxyXG5cdHRoaXMuZG9tID0gJCh0ZW1wbGF0ZXMuZW1vdGVCdXR0b24oKSk7XHJcblx0dGhpcy5kb20uaW5zZXJ0QmVmb3JlKGNoYXRCdXR0b24pO1xyXG5cclxuXHQvLyBIaWRlIHRoZW4gZmFkZSBpdCBpbi5cclxuXHR0aGlzLmRvbS5oaWRlKCk7XHJcblx0dGhpcy5kb20uZmFkZUluKCk7XHJcblxyXG5cdC8vIEVuYWJsZSBjbGlja2luZy5cclxuXHR0aGlzLmRvbS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHR0aGVNZW51LnRvZ2dsZURpc3BsYXkoKTtcclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSU1lbnVCdXR0b24ucHJvdG90eXBlLnRvZ2dsZURpc3BsYXkgPSBmdW5jdGlvbiAoZm9yY2VkKSB7XHJcblx0dmFyIHN0YXRlID0gdHlwZW9mIGZvcmNlZCAhPT0gJ3VuZGVmaW5lZCcgPyAhIWZvcmNlZCA6ICF0aGlzLmlzVmlzaWJsZSgpO1xyXG5cdGlmIChzdGF0ZSkge1xyXG5cdFx0dGhpcy5kb20uYWRkQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cdHRoaXMuZG9tLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSU1lbnVCdXR0b24ucHJvdG90eXBlLmlzVmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gdGhpcy5kb20uaGFzQ2xhc3MoJ2FjdGl2ZScpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVUlNZW51KCkge1xyXG5cdHRoaXMuZG9tID0gbnVsbDtcclxuXHR0aGlzLmdyb3VwcyA9IHt9O1xyXG5cdHRoaXMuZW1vdGVzID0gW107XHJcblx0dGhpcy5vZmZzZXQgPSBudWxsO1xyXG5cdHRoaXMuZmF2b3JpdGVzID0gbnVsbDtcclxufVxyXG5cclxuVUlNZW51LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0dGhpcy5kb20gPSAkKCcjZW1vdGUtbWVudS1mb3ItdHdpdGNoJyk7XHJcblxyXG5cdC8vIEVsZW1lbnQgYWxyZWFkeSBleGlzdHMuXHJcblx0aWYgKHRoaXMuZG9tLmxlbmd0aCkge1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHQvLyBDcmVhdGUgZWxlbWVudC5cclxuXHR0aGlzLmRvbSA9ICQodGVtcGxhdGVzLm1lbnUoKSk7XHJcblx0JChkb2N1bWVudC5ib2R5KS5hcHBlbmQodGhpcy5kb20pO1xyXG5cclxuXHR0aGlzLmZhdm9yaXRlcyA9IG5ldyBVSUZhdm9yaXRlc0dyb3VwKCk7XHJcblxyXG5cdC8vIEVuYWJsZSBkcmFnZ2luZy5cclxuXHR0aGlzLmRvbS5kcmFnZ2FibGUoe1xyXG5cdFx0aGFuZGxlOiAnLmRyYWdnYWJsZScsXHJcblx0XHRzdGFydDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRzZWxmLnRvZ2dsZVBpbm5lZCh0cnVlKTtcclxuXHRcdFx0c2VsZi50b2dnbGVNb3ZlbWVudCh0cnVlKTtcclxuXHRcdH0sXHJcblx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHNlbGYub2Zmc2V0ID0gc2VsZi5kb20ub2Zmc2V0KCk7XHJcblx0XHR9LFxyXG5cdFx0Y29udGFpbm1lbnQ6ICQoZG9jdW1lbnQuYm9keSlcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIHJlc2l6aW5nLlxyXG5cdHRoaXMuZG9tLnJlc2l6YWJsZSh7XHJcblx0XHRoYW5kbGU6ICdbZGF0YS1jb21tYW5kPVwicmVzaXplLWhhbmRsZVwiXScsXHJcblx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHNlbGYudG9nZ2xlUGlubmVkKHRydWUpO1xyXG5cdFx0XHRzZWxmLnRvZ2dsZU1vdmVtZW50KHRydWUpO1xyXG5cdFx0fSxcclxuXHRcdGFsc29SZXNpemU6IHNlbGYuZG9tLmZpbmQoJy5zY3JvbGxhYmxlJyksXHJcblx0XHRjb250YWlubWVudDogJChkb2N1bWVudC5ib2R5KSxcclxuXHRcdG1pbkhlaWdodDogMTgwLFxyXG5cdFx0bWluV2lkdGg6IDIwMFxyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgcGlubmluZy5cclxuXHR0aGlzLmRvbS5maW5kKCdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLXBpbm5lZFwiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdHNlbGYudG9nZ2xlUGlubmVkKCk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBlZGl0aW5nLlxyXG5cdHRoaXMuZG9tLmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtZWRpdGluZ1wiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdHNlbGYudG9nZ2xlRWRpdGluZygpO1xyXG5cdH0pO1xyXG5cclxuXHR0aGlzLmRvbS5maW5kKCcuc2Nyb2xsYWJsZScpLnNjcm9sbGJhcigpXHJcblxyXG5cdHRoaXMudXBkYXRlRW1vdGVzKCk7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5fZGV0ZWN0T3V0c2lkZUNsaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcblx0Ly8gTm90IG91dHNpZGUgb2YgdGhlIG1lbnUsIGlnbm9yZSB0aGUgY2xpY2suXHJcblx0aWYgKCQoZXZlbnQudGFyZ2V0KS5pcygnI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCwgI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCAqJykpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8vIENsaWNrZWQgb24gdGhlIG1lbnUgYnV0dG9uLCBqdXN0IHJlbW92ZSB0aGUgbGlzdGVuZXIgYW5kIGxldCB0aGUgbm9ybWFsIGxpc3RlbmVyIGhhbmRsZSBpdC5cclxuXHRpZiAoIXRoaXMuaXNWaXNpYmxlKCkgfHwgJChldmVudC50YXJnZXQpLmlzKCcjZW1vdGUtbWVudS1idXR0b24sICNlbW90ZS1tZW51LWJ1dHRvbiAqJykpIHtcclxuXHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsIHRoaXMuX2RldGVjdE91dHNpZGVDbGljay5iaW5kKHRoaXMpKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8vIENsaWNrZWQgb3V0c2lkZSwgbWFrZSBzdXJlIHRoZSBtZW51IGlzbid0IHBpbm5lZC5cclxuXHRpZiAoIXRoaXMuaXNQaW5uZWQoKSkge1xyXG5cdFx0Ly8gTWVudSB3YXNuJ3QgcGlubmVkLCByZW1vdmUgbGlzdGVuZXIuXHJcblx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCB0aGlzLl9kZXRlY3RPdXRzaWRlQ2xpY2suYmluZCh0aGlzKSk7XHJcblx0XHR0aGlzLnRvZ2dsZURpc3BsYXkoKTtcclxuXHR9XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLnRvZ2dsZURpc3BsYXkgPSBmdW5jdGlvbiAoZm9yY2VkKSB7XHJcblx0dmFyIHN0YXRlID0gdHlwZW9mIGZvcmNlZCAhPT0gJ3VuZGVmaW5lZCcgPyAhIWZvcmNlZCA6ICF0aGlzLmlzVmlzaWJsZSgpO1xyXG5cdHZhciBsb2dnZWRJbiA9IHdpbmRvdy5Ud2l0Y2ggJiYgd2luZG93LlR3aXRjaC51c2VyLmlzTG9nZ2VkSW4oKTtcclxuXHJcblx0Ly8gTWVudSBzaG91bGQgYmUgc2hvd24uXHJcblx0aWYgKHN0YXRlKSB7XHJcblx0XHQvLyBDaGVjayBpZiB1c2VyIGlzIGxvZ2dlZCBpbi5cclxuXHRcdGlmICghbG9nZ2VkSW4pIHtcclxuXHRcdFx0Ly8gQ2FsbCBuYXRpdmUgbG9naW4gZm9ybS5cclxuXHRcdFx0JC5sb2dpbigpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLnVwZGF0ZUVtb3RlcygpO1xyXG5cdFx0dGhpcy5kb20uc2hvdygpO1xyXG5cclxuXHRcdC8vIE1lbnUgbW92ZWQsIG1vdmUgaXQgYmFjay5cclxuXHRcdGlmICh0aGlzLmhhc01vdmVkKCkpIHtcclxuXHRcdFx0dGhpcy5kb20ub2Zmc2V0KHRoaXMub2Zmc2V0KTtcclxuXHRcdH1cclxuXHRcdC8vIE5ldmVyIG1vdmVkLCBtYWtlIGl0IHRoZSBzYW1lIHNpemUgYXMgdGhlIGNoYXQgd2luZG93LlxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHZhciBjaGF0Q29udGFpbmVyID0gJCgnLmNoYXQtbWVzc2FnZXMnKTtcclxuXHRcdFx0XHJcblx0XHRcdC8vIEFkanVzdCB0aGUgc2l6ZSB0byBiZSB0aGUgc2FtZSBhcyB0aGUgY2hhdCBjb250YWluZXIuXHJcblx0XHRcdHRoaXMuZG9tLmhlaWdodChjaGF0Q29udGFpbmVyLm91dGVySGVpZ2h0KCkgLSAodGhpcy5kb20ub3V0ZXJIZWlnaHQoKSAtIHRoaXMuZG9tLmhlaWdodCgpKSk7XHJcblx0XHRcdHRoaXMuZG9tLndpZHRoKGNoYXRDb250YWluZXIub3V0ZXJXaWR0aCgpIC0gKHRoaXMuZG9tLm91dGVyV2lkdGgoKSAtIHRoaXMuZG9tLndpZHRoKCkpKTtcclxuXHJcblx0XHRcdC8vIEFkanVzdCB0aGUgb2Zmc2V0IHRvIGJlIHRoZSBzYW1lIGFzIHRoZSBjaGF0IGNvbnRhaW5lci5cclxuXHRcdFx0dGhpcy5vZmZzZXQgPSBjaGF0Q29udGFpbmVyLm9mZnNldCgpO1xyXG5cdFx0XHR0aGlzLmRvbS5vZmZzZXQodGhpcy5vZmZzZXQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIExpc3RlbiBmb3Igb3V0c2lkZSBjbGljay5cclxuXHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwJywgdGhpcy5fZGV0ZWN0T3V0c2lkZUNsaWNrLmJpbmQodGhpcykpO1xyXG5cdH1cclxuXHQvLyBNZW51IHNob3VsZCBiZSBoaWRkZW4uXHJcblx0ZWxzZSB7XHJcblx0XHR0aGlzLmRvbS5oaWRlKCk7XHJcblx0XHR0aGlzLnRvZ2dsZUVkaXRpbmcoZmFsc2UpO1xyXG5cdFx0dGhpcy50b2dnbGVQaW5uZWQoZmFsc2UpO1xyXG5cdH1cclxuXHJcblx0Ly8gQWxzbyB0b2dnbGUgdGhlIG1lbnUgYnV0dG9uLlxyXG5cdHRoZU1lbnVCdXR0b24udG9nZ2xlRGlzcGxheSh0aGlzLmlzVmlzaWJsZSgpKTtcclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLmlzVmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gdGhpcy5kb20uaXMoJzp2aXNpYmxlJyk7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLnVwZGF0ZUVtb3RlcyA9IGZ1bmN0aW9uICh3aGljaCkge1xyXG5cdHZhciBlbW90ZSA9IHdoaWNoID8gdGhpcy5nZXRFbW90ZSh3aGljaCkgOiBudWxsO1xyXG5cdHZhciBmYXZvcml0ZUVtb3RlID0gZW1vdGUgPyB0aGlzLmZhdm9yaXRlcy5nZXRFbW90ZSh3aGljaCkgOiBudWxsO1xyXG5cdGlmIChlbW90ZSkge1xyXG5cdFx0ZW1vdGUudXBkYXRlKCk7XHJcblx0XHRpZiAoZmF2b3JpdGVFbW90ZSkge1xyXG5cdFx0XHRmYXZvcml0ZUVtb3RlLnVwZGF0ZSgpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cdHZhciBlbW90ZXMgPSByZXF1aXJlKCcuL2Vtb3RlcycpO1xyXG5cdHZhciB0aGVFbW90ZXMgPSBlbW90ZXMuZ2V0RW1vdGVzKCk7XHJcblx0dmFyIHRoZUVtb3Rlc0tleXMgPSBbXTtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdHRoZUVtb3Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZUluc3RhbmNlKSB7XHJcblx0XHRzZWxmLmFkZEVtb3RlKGVtb3RlSW5zdGFuY2UpO1xyXG5cdFx0dGhlRW1vdGVzS2V5cy5wdXNoKGVtb3RlSW5zdGFuY2UuZ2V0VGV4dCgpKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRGlmZmVyZW5jZSB0aGUgZW1vdGVzIGFuZCByZW1vdmUgYWxsIG5vbi12YWxpZCBlbW90ZXMuXHJcblx0dGhpcy5lbW90ZXMuZm9yRWFjaChmdW5jdGlvbiAob2xkRW1vdGUpIHtcclxuXHRcdHZhciB0ZXh0ID0gb2xkRW1vdGUuZ2V0VGV4dCgpXHJcblx0XHRpZiAodGhlRW1vdGVzS2V5cy5pbmRleE9mKHRleHQpIDwgMCkge1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ0Vtb3RlIGRpZmZlcmVuY2UgZm91bmQsIHJlbW92aW5nIGVtb3RlIGZyb20gVUk6ICcgKyB0ZXh0KTtcclxuXHRcdFx0c2VsZi5yZW1vdmVFbW90ZSh0ZXh0KTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0Ly8gU2F2ZSB0aGUgZW1vdGVzIGZvciBuZXh0IGRpZmZlcmVuY2luZy5cclxuXHR0aGlzLmVtb3RlcyA9IHRoZUVtb3RlcztcclxuXHJcblx0Ly9VcGRhdGUgZ3JvdXBzLlxyXG5cdE9iamVjdC5rZXlzKHRoaXMuZ3JvdXBzKS5mb3JFYWNoKGZ1bmN0aW9uIChncm91cCkge1xyXG5cdFx0c2VsZi5nZXRHcm91cChncm91cCkuaW5pdCgpO1xyXG5cdH0pO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUudG9nZ2xlRWRpdGluZyA9IGZ1bmN0aW9uIChmb3JjZWQpIHtcclxuXHR2YXIgc3RhdGUgPSB0eXBlb2YgZm9yY2VkICE9PSAndW5kZWZpbmVkJyA/ICEhZm9yY2VkIDogIXRoaXMuaXNFZGl0aW5nKCk7XHJcblx0dGhpcy5kb20udG9nZ2xlQ2xhc3MoJ2VkaXRpbmcnLCBzdGF0ZSk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLmlzRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gdGhpcy5kb20uaGFzQ2xhc3MoJ2VkaXRpbmcnKTtcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUudG9nZ2xlUGlubmVkID0gZnVuY3Rpb24gKGZvcmNlZCkge1xyXG5cdHZhciBzdGF0ZSA9IHR5cGVvZiBmb3JjZWQgIT09ICd1bmRlZmluZWQnID8gISFmb3JjZWQgOiAhdGhpcy5pc1Bpbm5lZCgpO1xyXG5cdHRoaXMuZG9tLnRvZ2dsZUNsYXNzKCdwaW5uZWQnLCBzdGF0ZSk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLmlzUGlubmVkID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmRvbS5oYXNDbGFzcygncGlubmVkJyk7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLnRvZ2dsZU1vdmVtZW50ID0gZnVuY3Rpb24gKGZvcmNlZCkge1xyXG5cdHZhciBzdGF0ZSA9IHR5cGVvZiBmb3JjZWQgIT09ICd1bmRlZmluZWQnID8gISFmb3JjZWQgOiAhdGhpcy5oYXNNb3ZlZCgpO1xyXG5cdHRoaXMuZG9tLnRvZ2dsZUNsYXNzKCdtb3ZlZCcsIHN0YXRlKTtcclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuaGFzTW92ZWQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMuZG9tLmhhc0NsYXNzKCdtb3ZlZCcpO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5hZGRHcm91cCA9IGZ1bmN0aW9uIChlbW90ZUluc3RhbmNlKSB7XHJcblx0dmFyIGNoYW5uZWwgPSBlbW90ZUluc3RhbmNlLmdldENoYW5uZWxOYW1lKCk7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHQvLyBBbHJlYWR5IGFkZGVkLCBkb24ndCBhZGQgYWdhaW4uXHJcblx0aWYgKHRoaXMuZ2V0R3JvdXAoY2hhbm5lbCkpIHtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0Ly8gQWRkIHRvIGN1cnJlbnQgbWVudSBncm91cHMuXHJcblx0dmFyIGdyb3VwID0gbmV3IFVJR3JvdXAoZW1vdGVJbnN0YW5jZSk7XHJcblx0dGhpcy5ncm91cHNbY2hhbm5lbF0gPSBncm91cDtcclxuXHJcblx0Ly8gU29ydCBncm91cCBuYW1lcywgZ2V0IGluZGV4IG9mIHdoZXJlIHRoaXMgZ3JvdXAgc2hvdWxkIGdvLlxyXG5cdHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcy5ncm91cHMpO1xyXG5cdGtleXMuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG5cdFx0Ly8gR2V0IHRoZSBpbnN0YW5jZXMuXHJcblx0XHRhID0gc2VsZi5ncm91cHNbYV0uZW1vdGVJbnN0YW5jZTtcclxuXHRcdGIgPSBzZWxmLmdyb3Vwc1tiXS5lbW90ZUluc3RhbmNlO1xyXG5cclxuXHRcdC8vIEdldCB0aGUgY2hhbm5lbCBuYW1lLlxyXG5cdFx0dmFyIGFDaGFubmVsID0gYS5nZXRDaGFubmVsTmFtZSgpO1xyXG5cdFx0dmFyIGJDaGFubmVsID0gYi5nZXRDaGFubmVsTmFtZSgpO1xyXG5cclxuXHRcdC8vIEdldCB0aGUgY2hhbm5lbCBkaXNwbGF5IG5hbWUuXHJcblx0XHRhID0gYS5nZXRDaGFubmVsRGlzcGxheU5hbWUoKS50b0xvd2VyQ2FzZSgpO1xyXG5cdFx0YiA9IGIuZ2V0Q2hhbm5lbERpc3BsYXlOYW1lKCkudG9Mb3dlckNhc2UoKTtcclxuXHJcblx0XHQvLyBQcmltZSBnb2VzIGZpcnN0LCBhbHdheXMuXHJcblx0XHRpZiAoYUNoYW5uZWwgPT09ICd0d2l0Y2hfcHJpbWUnICYmIGJDaGFubmVsICE9PSAndHdpdGNoX3ByaW1lJykge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYkNoYW5uZWwgPT09ICd0d2l0Y2hfcHJpbWUnICYmIGFDaGFubmVsICE9PSAndHdpdGNoX3ByaW1lJykge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBUdXJibyBnb2VzIGFmdGVyIFByaW1lLCBhbHdheXMuXHJcblx0XHRpZiAoYUNoYW5uZWwgPT09ICd0dXJibycgJiYgYkNoYW5uZWwgIT09ICd0dXJibycpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGJDaGFubmVsID09PSAndHVyYm8nICYmIGFDaGFubmVsICE9PSAndHVyYm8nKSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdsb2JhbCBnb2VzIGFmdGVyIFR1cmJvLCBhbHdheXMuXHJcblx0XHRpZiAoYUNoYW5uZWwgPT09ICd+Z2xvYmFsJyAmJiBiQ2hhbm5lbCAhPT0gJ35nbG9iYWwnKSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdGlmIChiQ2hhbm5lbCA9PT0gJ35nbG9iYWwnICYmIGFDaGFubmVsICE9PSAnfmdsb2JhbCcpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gQSBnb2VzIGZpcnN0LlxyXG5cdFx0aWYgKGEgPCBiKSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdC8vIEIgZ29lc3QgZmlyc3QuXHJcblx0XHRpZiAoYSA+IGIpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHQvLyBCb3RoIHRoZSBzYW1lLCBkb2Vzbid0IG1hdHRlci5cclxuXHRcdHJldHVybiAwO1xyXG5cdH0pO1xyXG5cclxuXHR2YXIgaW5kZXggPSBrZXlzLmluZGV4T2YoY2hhbm5lbCk7XHJcblxyXG5cdC8vIEZpcnN0IGluIHRoZSBzb3J0LCBwbGFjZSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBtZW51LlxyXG5cdGlmIChpbmRleCA9PT0gMCkge1xyXG5cdFx0Z3JvdXAuZG9tLnByZXBlbmRUbyh0aGlzLmRvbS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpKTtcclxuXHR9XHJcblx0Ly8gSW5zZXJ0IGFmdGVyIHRoZSBwcmV2aW91cyBncm91cCBpbiB0aGUgc29ydC5cclxuXHRlbHNlIHtcclxuXHRcdGdyb3VwLmRvbS5pbnNlcnRBZnRlcih0aGlzLmdldEdyb3VwKGtleXNbaW5kZXggLSAxXSkuZG9tKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBncm91cDtcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuZ2V0R3JvdXAgPSBmdW5jdGlvbiAobmFtZSkge1xyXG5cdHJldHVybiB0aGlzLmdyb3Vwc1tuYW1lXSB8fCBudWxsO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5hZGRFbW90ZSA9IGZ1bmN0aW9uIChlbW90ZUluc3RhbmNlKSB7XHJcblx0Ly8gR2V0IHRoZSBncm91cCwgb3IgYWRkIGlmIG5lZWRlZC5cclxuXHR2YXIgZ3JvdXAgPSB0aGlzLmdldEdyb3VwKGVtb3RlSW5zdGFuY2UuZ2V0Q2hhbm5lbE5hbWUoKSkgfHwgdGhpcy5hZGRHcm91cChlbW90ZUluc3RhbmNlKTtcclxuXHJcblx0Z3JvdXAuYWRkRW1vdGUoZW1vdGVJbnN0YW5jZSk7XHJcblx0Z3JvdXAudG9nZ2xlRGlzcGxheShncm91cC5pc1Zpc2libGUoKSwgdHJ1ZSk7XHJcblxyXG5cdHRoaXMuZmF2b3JpdGVzLmFkZEVtb3RlKGVtb3RlSW5zdGFuY2UpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUucmVtb3ZlRW1vdGUgPSBmdW5jdGlvbiAobmFtZSkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHRPYmplY3Qua2V5cyh0aGlzLmdyb3VwcykuZm9yRWFjaChmdW5jdGlvbiAoZ3JvdXBOYW1lKSB7XHJcblx0XHRzZWxmLmdyb3Vwc1tncm91cE5hbWVdLnJlbW92ZUVtb3RlKG5hbWUpO1xyXG5cdH0pO1xyXG5cdHRoaXMuZmF2b3JpdGVzLnJlbW92ZUVtb3RlKG5hbWUpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuZ2V0RW1vdGUgPSBmdW5jdGlvbiAobmFtZSkge1xyXG5cdHZhciBncm91cE5hbWUgPSBudWxsO1xyXG5cdHZhciBncm91cCA9IG51bGw7XHJcblx0dmFyIGVtb3RlID0gbnVsbDtcclxuXHJcblx0Zm9yIChncm91cE5hbWUgaW4gdGhpcy5ncm91cHMpIHtcclxuXHRcdGdyb3VwID0gdGhpcy5ncm91cHNbZ3JvdXBOYW1lXTtcclxuXHRcdGVtb3RlID0gZ3JvdXAuZ2V0RW1vdGUobmFtZSk7XHJcblxyXG5cdFx0aWYgKGVtb3RlKSB7XHJcblx0XHRcdHJldHVybiBlbW90ZTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBudWxsO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVUlHcm91cChlbW90ZUluc3RhbmNlKSB7XHJcblx0dGhpcy5kb20gPSBudWxsO1xyXG5cdHRoaXMuZW1vdGVzID0ge307XHJcblx0dGhpcy5lbW90ZUluc3RhbmNlID0gZW1vdGVJbnN0YW5jZTtcclxuXHJcblx0dGhpcy5pbml0KCk7XHJcbn1cclxuXHJcblVJR3JvdXAucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBlbW90ZUluc3RhbmNlID0gdGhpcy5lbW90ZUluc3RhbmNlO1xyXG5cclxuXHQvLyBGaXJzdCBpbml0LCBjcmVhdGUgbmV3IERPTS5cclxuXHRpZiAodGhpcy5kb20gPT09IG51bGwpIHtcclxuXHRcdHRoaXMuZG9tID0gJCh0ZW1wbGF0ZXMuZW1vdGVHcm91cEhlYWRlcih7XHJcblx0XHRcdGJhZGdlOiBlbW90ZUluc3RhbmNlLmdldENoYW5uZWxCYWRnZSgpLFxyXG5cdFx0XHRjaGFubmVsOiBlbW90ZUluc3RhbmNlLmdldENoYW5uZWxOYW1lKCksXHJcblx0XHRcdGNoYW5uZWxEaXNwbGF5TmFtZTogZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsRGlzcGxheU5hbWUoKVxyXG5cdFx0fSkpO1xyXG5cdH1cclxuXHQvLyBVcGRhdGUgRE9NIGluc3RlYWQuXHJcblx0ZWxzZSB7XHJcblx0XHR0aGlzLmRvbS5maW5kKCcuaGVhZGVyLWluZm8nKS5yZXBsYWNlV2l0aChcclxuXHRcdFx0JCh0ZW1wbGF0ZXMuZW1vdGVHcm91cEhlYWRlcih7XHJcblx0XHRcdFx0YmFkZ2U6IGVtb3RlSW5zdGFuY2UuZ2V0Q2hhbm5lbEJhZGdlKCksXHJcblx0XHRcdFx0Y2hhbm5lbDogZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsTmFtZSgpLFxyXG5cdFx0XHRcdGNoYW5uZWxEaXNwbGF5TmFtZTogZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsRGlzcGxheU5hbWUoKVxyXG5cdFx0XHR9KSlcclxuXHRcdFx0LmZpbmQoJy5oZWFkZXItaW5mbycpXHJcblx0XHQpO1xyXG5cdH1cclxuXHJcblx0Ly8gRW5hYmxlIGVtb3RlIGhpZGluZy5cclxuXHR0aGlzLmRvbS5maW5kKCcuaGVhZGVyLWluZm8gW2RhdGEtY29tbWFuZD1cInRvZ2dsZS12aXNpYmlsaXR5XCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCF0aGVNZW51LmlzRWRpdGluZygpKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdHNlbGYudG9nZ2xlRGlzcGxheSgpO1xyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnRvZ2dsZURpc3BsYXkodGhpcy5pc1Zpc2libGUoKSwgdHJ1ZSk7XHJcbn07XHJcblxyXG5VSUdyb3VwLnByb3RvdHlwZS50b2dnbGVEaXNwbGF5ID0gZnVuY3Rpb24gKGZvcmNlZCwgc2tpcFVwZGF0aW5nRW1vdGVEaXNwbGF5KSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBzdGF0ZSA9IHR5cGVvZiBmb3JjZWQgIT09ICd1bmRlZmluZWQnID8gIWZvcmNlZCA6IHRoaXMuaXNWaXNpYmxlKCk7XHJcblxyXG5cdHRoaXMuZG9tLnRvZ2dsZUNsYXNzKCdlbW90ZS1tZW51LWhpZGRlbicsIHN0YXRlKTtcclxuXHJcblx0Ly8gVXBkYXRlIHRoZSBkaXNwbGF5IG9mIGFsbCBlbW90ZXMuXHJcblx0aWYgKCFza2lwVXBkYXRpbmdFbW90ZURpc3BsYXkpIHtcclxuXHRcdE9iamVjdC5rZXlzKHRoaXMuZW1vdGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZU5hbWUpIHtcclxuXHRcdFx0c2VsZi5lbW90ZXNbZW1vdGVOYW1lXS50b2dnbGVEaXNwbGF5KCFzdGF0ZSk7XHJcblx0XHRcdHRoZU1lbnUudXBkYXRlRW1vdGVzKHNlbGYuZW1vdGVzW2Vtb3RlTmFtZV0uaW5zdGFuY2UuZ2V0VGV4dCgpKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSUdyb3VwLnByb3RvdHlwZS5pc1Zpc2libGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHQvLyBJZiBhbnkgZW1vdGUgaXMgdmlzaWJsZSwgdGhlIGdyb3VwIHNob3VsZCBiZSB2aXNpYmxlLlxyXG5cdHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmVtb3Rlcykuc29tZShmdW5jdGlvbiAoZW1vdGVOYW1lKSB7XHJcblx0XHRyZXR1cm4gc2VsZi5lbW90ZXNbZW1vdGVOYW1lXS5pc1Zpc2libGUoKTtcclxuXHR9KTtcclxufTtcclxuXHJcblVJR3JvdXAucHJvdG90eXBlLmFkZEVtb3RlID0gZnVuY3Rpb24gKGVtb3RlSW5zdGFuY2UpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0dmFyIGVtb3RlID0gdGhpcy5nZXRFbW90ZShlbW90ZUluc3RhbmNlLmdldFRleHQoKSk7XHJcblxyXG5cdC8vIEFscmVhZHkgYWRkZWQsIHVwZGF0ZSBpbnN0ZWFkLlxyXG5cdGlmIChlbW90ZSkge1xyXG5cdFx0ZW1vdGUudXBkYXRlKCk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdC8vIEFkZCB0byBjdXJyZW50IGVtb3Rlcy5cclxuXHRlbW90ZSA9IG5ldyBVSUVtb3RlKGVtb3RlSW5zdGFuY2UpO1xyXG5cdHRoaXMuZW1vdGVzW2Vtb3RlSW5zdGFuY2UuZ2V0VGV4dCgpXSA9IGVtb3RlO1xyXG5cclxuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuZW1vdGVzKTtcclxuXHJcblx0a2V5cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcblx0XHQvLyBHZXQgdGhlIGVtb3RlIGluc3RhbmNlcy5cclxuXHRcdGEgPSBzZWxmLmVtb3Rlc1thXS5pbnN0YW5jZTtcclxuXHRcdGIgPSBzZWxmLmVtb3Rlc1tiXS5pbnN0YW5jZTtcclxuXHJcblx0XHQvLyBBIGlzIGEgc21pbGV5LCBCIGlzbid0LiBBIGdvZXMgZmlyc3QuXHJcblx0XHRpZiAoYS5pc1NtaWxleSgpICYmXHQhYi5pc1NtaWxleSgpKSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdC8vIEIgaXMgYSBzbWlsZXksIEEgaXNuJ3QuIEIgZ29lcyBmaXJzdC5cclxuXHRcdGlmIChiLmlzU21pbGV5KCkgJiZcdCFhLmlzU21pbGV5KCkpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gR2V0IHRoZSB0ZXh0IG9mIHRoZSBlbW90ZXMuXHJcblx0XHRhID0gYS5nZXRUZXh0KCkudG9Mb3dlckNhc2UoKTtcclxuXHRcdGIgPSBiLmdldFRleHQoKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuXHRcdC8vIEEgZ29lcyBmaXJzdC5cclxuXHRcdGlmIChhIDwgYikge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHQvLyBCIGdvZXN0IGZpcnN0LlxyXG5cdFx0aWYgKGEgPiBiKSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0Ly8gQm90aCB0aGUgc2FtZSwgZG9lc24ndCBtYXR0ZXIuXHJcblx0XHRyZXR1cm4gMDtcclxuXHR9KTtcclxuXHJcblx0dmFyIGluZGV4ID0ga2V5cy5pbmRleE9mKGVtb3RlSW5zdGFuY2UuZ2V0VGV4dCgpKTtcclxuXHJcblx0Ly8gRmlyc3QgaW4gdGhlIHNvcnQsIHBsYWNlIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGdyb3VwLlxyXG5cdGlmIChpbmRleCA9PT0gMCkge1xyXG5cdFx0ZW1vdGUuZG9tLnByZXBlbmRUbyh0aGlzLmRvbS5maW5kKCcuZW1vdGUtY29udGFpbmVyJykpO1xyXG5cdH1cclxuXHQvLyBJbnNlcnQgYWZ0ZXIgdGhlIHByZXZpb3VzIGVtb3RlIGluIHRoZSBzb3J0LlxyXG5cdGVsc2Uge1xyXG5cdFx0ZW1vdGUuZG9tLmluc2VydEFmdGVyKHRoaXMuZ2V0RW1vdGUoa2V5c1tpbmRleCAtIDFdKS5kb20pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSUdyb3VwLnByb3RvdHlwZS5nZXRFbW90ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0cmV0dXJuIHRoaXMuZW1vdGVzW25hbWVdIHx8IG51bGw7XHJcbn07XHJcblxyXG5VSUdyb3VwLnByb3RvdHlwZS5yZW1vdmVFbW90ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0dmFyIGVtb3RlID0gdGhpcy5nZXRFbW90ZShuYW1lKTtcclxuXHRpZiAoIWVtb3RlKSB7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblx0ZW1vdGUuZG9tLnJlbW92ZSgpO1xyXG5cdGRlbGV0ZSB0aGlzLmVtb3Rlc1tuYW1lXTtcclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBVSUZhdm9yaXRlc0dyb3VwKCkge1xyXG5cdHRoaXMuZG9tID0gJCgnI3N0YXJyZWQtZW1vdGVzLWdyb3VwJyk7XHJcblx0dGhpcy5lbW90ZXMgPSB7fTtcclxufVxyXG5cclxuVUlGYXZvcml0ZXNHcm91cC5wcm90b3R5cGUuYWRkRW1vdGUgPSBVSUdyb3VwLnByb3RvdHlwZS5hZGRFbW90ZTtcclxuVUlGYXZvcml0ZXNHcm91cC5wcm90b3R5cGUuZ2V0RW1vdGUgPSBVSUdyb3VwLnByb3RvdHlwZS5nZXRFbW90ZTtcclxuVUlGYXZvcml0ZXNHcm91cC5wcm90b3R5cGUucmVtb3ZlRW1vdGUgPSBVSUdyb3VwLnByb3RvdHlwZS5yZW1vdmVFbW90ZTtcclxuXHJcbmZ1bmN0aW9uIFVJRW1vdGUoZW1vdGVJbnN0YW5jZSkge1xyXG5cdHRoaXMuZG9tID0gbnVsbDtcclxuXHR0aGlzLmluc3RhbmNlID0gZW1vdGVJbnN0YW5jZTtcclxuXHR0aGlzLmluaXQoKTtcclxufVxyXG5cclxuVUlFbW90ZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdC8vIENyZWF0ZSBlbGVtZW50LlxyXG5cdHRoaXMuZG9tID0gJCh0ZW1wbGF0ZXMuZW1vdGUoe1xyXG5cdFx0dXJsOiB0aGlzLmluc3RhbmNlLmdldFVybCgpLFxyXG5cdFx0dGV4dDogdGhpcy5pbnN0YW5jZS5nZXRUZXh0KCksXHJcblx0XHR0aGlyZFBhcnR5OiB0aGlzLmluc3RhbmNlLmlzVGhpcmRQYXJ0eSgpLFxyXG5cdFx0aXNWaXNpYmxlOiB0aGlzLmluc3RhbmNlLmlzVmlzaWJsZSgpLFxyXG5cdFx0aXNTdGFycmVkOiB0aGlzLmluc3RhbmNlLmlzRmF2b3JpdGUoKVxyXG5cdH0pKTtcclxuXHJcblx0Ly8gRW5hYmxlIGNsaWNraW5nLlxyXG5cdHRoaXMuZG9tLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghdGhlTWVudS5pc0VkaXRpbmcoKSkge1xyXG5cdFx0XHRzZWxmLmFkZFRvQ2hhdCgpO1xyXG5cclxuXHRcdFx0Ly8gQ2xvc2UgdGhlIG1lbnUgaWYgbm90IHBpbm5lZC5cclxuXHRcdFx0aWYgKCF0aGVNZW51LmlzUGlubmVkKCkpIHtcclxuXHRcdFx0XHR0aGVNZW51LnRvZ2dsZURpc3BsYXkoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgZW1vdGUgaGlkaW5nLlxyXG5cdHRoaXMuZG9tLmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtdmlzaWJpbGl0eVwiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghdGhlTWVudS5pc0VkaXRpbmcoKSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRzZWxmLnRvZ2dsZURpc3BsYXkoKTtcclxuXHRcdHRoZU1lbnUudXBkYXRlRW1vdGVzKHNlbGYuaW5zdGFuY2UuZ2V0VGV4dCgpKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIGVtb3RlIGZhdm9yaXRpbmcuXHJcblx0dGhpcy5kb20uZmluZCgnW2RhdGEtY29tbWFuZD1cInRvZ2dsZS1zdGFycmVkXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCF0aGVNZW51LmlzRWRpdGluZygpKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdHNlbGYudG9nZ2xlRmF2b3JpdGUoKTtcclxuXHRcdHRoZU1lbnUudXBkYXRlRW1vdGVzKHNlbGYuaW5zdGFuY2UuZ2V0VGV4dCgpKTtcclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSUVtb3RlLnByb3RvdHlwZS50b2dnbGVEaXNwbGF5ID0gZnVuY3Rpb24gKGZvcmNlZCwgc2tpcEluc3RhbmNlVXBkYXRlKSB7XHJcblx0dmFyIHN0YXRlID0gdHlwZW9mIGZvcmNlZCAhPT0gJ3VuZGVmaW5lZCcgPyAhZm9yY2VkIDogdGhpcy5pc1Zpc2libGUoKTtcclxuXHR0aGlzLmRvbS50b2dnbGVDbGFzcygnZW1vdGUtbWVudS1oaWRkZW4nLCBzdGF0ZSk7XHJcblx0aWYgKCFza2lwSW5zdGFuY2VVcGRhdGUpIHtcclxuXHRcdHRoaXMuaW5zdGFuY2UudG9nZ2xlVmlzaWJpbGl0eSghc3RhdGUpO1xyXG5cdH1cclxuXHJcblx0dmFyIGdyb3VwID0gdGhpcy5nZXRHcm91cCgpO1xyXG5cdGdyb3VwLnRvZ2dsZURpc3BsYXkoZ3JvdXAuaXNWaXNpYmxlKCksIHRydWUpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLmlzVmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gIXRoaXMuZG9tLmhhc0NsYXNzKCdlbW90ZS1tZW51LWhpZGRlbicpO1xyXG59O1xyXG5cclxuVUlFbW90ZS5wcm90b3R5cGUudG9nZ2xlRmF2b3JpdGUgPSBmdW5jdGlvbiAoZm9yY2VkLCBza2lwSW5zdGFuY2VVcGRhdGUpIHtcclxuXHR2YXIgc3RhdGUgPSB0eXBlb2YgZm9yY2VkICE9PSAndW5kZWZpbmVkJyA/ICEhZm9yY2VkIDogIXRoaXMuaXNGYXZvcml0ZSgpO1xyXG5cdHRoaXMuZG9tLnRvZ2dsZUNsYXNzKCdlbW90ZS1tZW51LXN0YXJyZWQnLCBzdGF0ZSk7XHJcblx0aWYgKCFza2lwSW5zdGFuY2VVcGRhdGUpIHtcclxuXHRcdHRoaXMuaW5zdGFuY2UudG9nZ2xlRmF2b3JpdGUoc3RhdGUpO1xyXG5cdH1cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLmlzRmF2b3JpdGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMuZG9tLmhhc0NsYXNzKCdlbW90ZS1tZW51LXN0YXJyZWQnKTtcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLmFkZFRvQ2hhdCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgZW1iZXIgPSByZXF1aXJlKCcuL2VtYmVyLWFwaScpO1xyXG5cdC8vIEdldCB0ZXh0YXJlYSBlbGVtZW50LlxyXG5cdHZhciBlbGVtZW50ID0gJCgnLmNoYXQtaW50ZXJmYWNlIHRleHRhcmVhJykuZ2V0KDApO1xyXG5cdHZhciB0ZXh0ID0gdGhpcy5pbnN0YW5jZS5nZXRUZXh0KCk7XHJcblxyXG5cdC8vIEluc2VydCBhdCBjdXJzb3IgLyByZXBsYWNlIHNlbGVjdGlvbi5cclxuXHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0NvZGVfc25pcHBldHMvTWlzY2VsbGFuZW91c1xyXG5cdHZhciBzZWxlY3Rpb25FbmQgPSBlbGVtZW50LnNlbGVjdGlvblN0YXJ0ICsgdGV4dC5sZW5ndGg7XHJcblx0dmFyIGN1cnJlbnRWYWx1ZSA9IGVsZW1lbnQudmFsdWU7XHJcblx0dmFyIGJlZm9yZVRleHQgPSBjdXJyZW50VmFsdWUuc3Vic3RyaW5nKDAsIGVsZW1lbnQuc2VsZWN0aW9uU3RhcnQpO1xyXG5cdHZhciBhZnRlclRleHQgPSBjdXJyZW50VmFsdWUuc3Vic3RyaW5nKGVsZW1lbnQuc2VsZWN0aW9uRW5kLCBjdXJyZW50VmFsdWUubGVuZ3RoKTtcclxuXHQvLyBTbWFydCBwYWRkaW5nLCBvbmx5IHB1dCBzcGFjZSBhdCBzdGFydCBpZiBuZWVkZWQuXHJcblx0aWYgKFxyXG5cdFx0YmVmb3JlVGV4dCAhPT0gJycgJiZcclxuXHRcdGJlZm9yZVRleHQuc3Vic3RyKC0xKSAhPT0gJyAnXHJcblx0KSB7XHJcblx0XHR0ZXh0ID0gJyAnICsgdGV4dDtcclxuXHR9XHJcblx0Ly8gQWx3YXlzIHB1dCBzcGFjZSBhdCBlbmQuXHJcblx0dGV4dCA9IGJlZm9yZVRleHQgKyB0ZXh0ICsgJyAnICsgYWZ0ZXJUZXh0O1xyXG5cdC8vIFNldCB0aGUgdGV4dC5cclxuXHRlbWJlci5nZXQoJ2NvbnRyb2xsZXI6Y2hhdCcsICdjdXJyZW50Um9vbScpLnNldCgnbWVzc2FnZVRvU2VuZCcsIHRleHQpO1xyXG5cdGVsZW1lbnQuZm9jdXMoKTtcclxuXHQvLyBQdXQgY3Vyc29yIGF0IGVuZC5cclxuXHRzZWxlY3Rpb25FbmQgPSBlbGVtZW50LnNlbGVjdGlvblN0YXJ0ICsgdGV4dC5sZW5ndGg7XHJcblx0ZWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZShzZWxlY3Rpb25FbmQsIHNlbGVjdGlvbkVuZCk7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlFbW90ZS5wcm90b3R5cGUuZ2V0R3JvdXAgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoZU1lbnUuZ2V0R3JvdXAodGhpcy5pbnN0YW5jZS5nZXRDaGFubmVsTmFtZSgpKTtcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHR0aGlzLnRvZ2dsZURpc3BsYXkodGhpcy5pbnN0YW5jZS5pc1Zpc2libGUoKSwgdHJ1ZSk7XHJcblx0dGhpcy50b2dnbGVGYXZvcml0ZSh0aGlzLmluc3RhbmNlLmlzRmF2b3JpdGUoKSwgdHJ1ZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwiKGZ1bmN0aW9uICgkKSB7XHJcblx0JC5mbi5yZXNpemFibGUgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cdFx0dmFyIHNldHRpbmdzID0gJC5leHRlbmQoe1xyXG5cdFx0XHRhbHNvUmVzaXplOiBudWxsLFxyXG5cdFx0XHRhbHNvUmVzaXplVHlwZTogJ2JvdGgnLCAvLyBgaGVpZ2h0YCwgYHdpZHRoYCwgYGJvdGhgXHJcblx0XHRcdGNvbnRhaW5tZW50OiBudWxsLFxyXG5cdFx0XHRjcmVhdGU6IG51bGwsXHJcblx0XHRcdGRlc3Ryb3k6IG51bGwsXHJcblx0XHRcdGhhbmRsZTogJy5yZXNpemUtaGFuZGxlJyxcclxuXHRcdFx0bWF4SGVpZ2h0OiA5OTk5LFxyXG5cdFx0XHRtYXhXaWR0aDogOTk5OSxcclxuXHRcdFx0bWluSGVpZ2h0OiAwLFxyXG5cdFx0XHRtaW5XaWR0aDogMCxcclxuXHRcdFx0cmVzaXplOiBudWxsLFxyXG5cdFx0XHRyZXNpemVPbmNlOiBudWxsLFxyXG5cdFx0XHRzbmFwU2l6ZTogMSxcclxuXHRcdFx0c3RhcnQ6IG51bGwsXHJcblx0XHRcdHN0b3A6IG51bGxcclxuXHRcdH0sIG9wdGlvbnMpO1xyXG5cclxuXHRcdHNldHRpbmdzLmVsZW1lbnQgPSAkKHRoaXMpO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHJlY2FsY3VsYXRlU2l6ZShldnQpIHtcclxuXHRcdFx0dmFyIGRhdGEgPSBldnQuZGF0YSxcclxuXHRcdFx0XHRyZXNpemVkID0ge307XHJcblx0XHRcdGRhdGEuZGlmZlggPSBNYXRoLnJvdW5kKChldnQucGFnZVggLSBkYXRhLnBhZ2VYKSAvIHNldHRpbmdzLnNuYXBTaXplKSAqIHNldHRpbmdzLnNuYXBTaXplO1xyXG5cdFx0XHRkYXRhLmRpZmZZID0gTWF0aC5yb3VuZCgoZXZ0LnBhZ2VZIC0gZGF0YS5wYWdlWSkgLyBzZXR0aW5ncy5zbmFwU2l6ZSkgKiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHRcdFx0aWYgKE1hdGguYWJzKGRhdGEuZGlmZlgpID4gMCB8fCBNYXRoLmFicyhkYXRhLmRpZmZZKSA+IDApIHtcclxuXHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LmhlaWdodCgpICE9PSBkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgJiZcclxuXHRcdFx0XHRcdGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSA+PSBzZXR0aW5ncy5taW5IZWlnaHQgJiZcclxuXHRcdFx0XHRcdGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSA8PSBzZXR0aW5ncy5tYXhIZWlnaHQgJiZcclxuXHRcdFx0XHRcdChzZXR0aW5ncy5jb250YWlubWVudCA/IGRhdGEub3V0ZXJIZWlnaHQgKyBkYXRhLmRpZmZZICsgZGF0YS5vZmZzZXQudG9wIDw9IHNldHRpbmdzLmNvbnRhaW5tZW50Lm9mZnNldCgpLnRvcCArIHNldHRpbmdzLmNvbnRhaW5tZW50Lm91dGVySGVpZ2h0KCkgOiB0cnVlKVxyXG5cdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZKTtcclxuXHRcdFx0XHRcdHJlc2l6ZWQuaGVpZ2h0ID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC53aWR0aCgpICE9PSBkYXRhLndpZHRoICsgZGF0YS5kaWZmWCAmJlxyXG5cdFx0XHRcdFx0ZGF0YS53aWR0aCArIGRhdGEuZGlmZlggPj0gc2V0dGluZ3MubWluV2lkdGggJiZcclxuXHRcdFx0XHRcdGRhdGEud2lkdGggKyBkYXRhLmRpZmZYIDw9IHNldHRpbmdzLm1heFdpZHRoICYmXHJcblx0XHRcdFx0XHQoc2V0dGluZ3MuY29udGFpbm1lbnQgPyBkYXRhLm91dGVyV2lkdGggKyBkYXRhLmRpZmZYICsgZGF0YS5vZmZzZXQubGVmdCA8PSBzZXR0aW5ncy5jb250YWlubWVudC5vZmZzZXQoKS5sZWZ0ICsgc2V0dGluZ3MuY29udGFpbm1lbnQub3V0ZXJXaWR0aCgpIDogdHJ1ZSlcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQud2lkdGgoZGF0YS53aWR0aCArIGRhdGEuZGlmZlgpO1xyXG5cdFx0XHRcdFx0cmVzaXplZC53aWR0aCA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChyZXNpemVkLmhlaWdodCB8fCByZXNpemVkLndpZHRoKSB7XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MucmVzaXplT25jZSkge1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemVPbmNlLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoZXZ0LmRhdGEpO1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemVPbmNlID0gbnVsbDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5yZXNpemUpIHtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoZXZ0LmRhdGEpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLmFsc29SZXNpemUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHJlc2l6ZWQuaGVpZ2h0ICYmIChzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ2hlaWdodCcgfHwgc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdib3RoJykpIHtcclxuXHRcdFx0XHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplLmhlaWdodChkYXRhLmFsc29SZXNpemVIZWlnaHQgKyBkYXRhLmRpZmZZKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAocmVzaXplZC53aWR0aCAmJiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICd3aWR0aCcgfHwgc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdib3RoJykpIHtcclxuXHRcdFx0XHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplLndpZHRoKGRhdGEuYWxzb1Jlc2l6ZVdpZHRoICsgZGF0YS5kaWZmWCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBzdGFydChldnQpIHtcclxuXHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5zdGFydCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLnN0YXJ0LmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgZGF0YSA9IHtcclxuXHRcdFx0XHRhbHNvUmVzaXplSGVpZ2h0OiBzZXR0aW5ncy5hbHNvUmVzaXplID8gc2V0dGluZ3MuYWxzb1Jlc2l6ZS5oZWlnaHQoKSA6IDAsXHJcblx0XHRcdFx0YWxzb1Jlc2l6ZVdpZHRoOiBzZXR0aW5ncy5hbHNvUmVzaXplID8gc2V0dGluZ3MuYWxzb1Jlc2l6ZS53aWR0aCgpIDogMCxcclxuXHRcdFx0XHRoZWlnaHQ6IHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KCksXHJcblx0XHRcdFx0b2Zmc2V0OiBzZXR0aW5ncy5lbGVtZW50Lm9mZnNldCgpLFxyXG5cdFx0XHRcdG91dGVySGVpZ2h0OiBzZXR0aW5ncy5lbGVtZW50Lm91dGVySGVpZ2h0KCksXHJcblx0XHRcdFx0b3V0ZXJXaWR0aDogc2V0dGluZ3MuZWxlbWVudC5vdXRlcldpZHRoKCksXHJcblx0XHRcdFx0cGFnZVg6IGV2dC5wYWdlWCxcclxuXHRcdFx0XHRwYWdlWTogZXZ0LnBhZ2VZLFxyXG5cdFx0XHRcdHdpZHRoOiBzZXR0aW5ncy5lbGVtZW50LndpZHRoKClcclxuXHRcdFx0fTtcclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNlbW92ZScsICcqJywgZGF0YSwgcmVjYWxjdWxhdGVTaXplKTtcclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNldXAnLCAnKicsIHN0b3ApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHN0b3AoKSB7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5zdG9wKSB7XHJcblx0XHRcdFx0c2V0dGluZ3Muc3RvcC5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUnLCAnKicsIHJlY2FsY3VsYXRlU2l6ZSk7XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsICcqJywgc3RvcCk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHNldHRpbmdzLmhhbmRsZSkge1xyXG5cdFx0XHRpZiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZSAmJiBbJ2JvdGgnLCAnaGVpZ2h0JywgJ3dpZHRoJ10uaW5kZXhPZihzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSkgPj0gMCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmFsc29SZXNpemUgPSAkKHNldHRpbmdzLmFsc29SZXNpemUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChzZXR0aW5ncy5jb250YWlubWVudCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmNvbnRhaW5tZW50ID0gJChzZXR0aW5ncy5jb250YWlubWVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0c2V0dGluZ3MuaGFuZGxlID0gJChzZXR0aW5ncy5oYW5kbGUpO1xyXG5cdFx0XHRzZXR0aW5ncy5zbmFwU2l6ZSA9IHNldHRpbmdzLnNuYXBTaXplIDwgMSA/IDEgOiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHJcblx0XHRcdGlmIChvcHRpb25zID09PSAnZGVzdHJveScpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5oYW5kbGUub2ZmKCdtb3VzZWRvd24nLCBzdGFydCk7XHJcblxyXG5cdFx0XHRcdGlmIChzZXR0aW5ncy5kZXN0cm95KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5kZXN0cm95LmJpbmQodGhpcykoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNldHRpbmdzLmhhbmRsZS5vbignbW91c2Vkb3duJywgc3RhcnQpO1xyXG5cclxuXHRcdFx0aWYgKHNldHRpbmdzLmNyZWF0ZSkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmNyZWF0ZS5iaW5kKHRoaXMpKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH07XHJcbn0pKGpRdWVyeSk7XHJcbiJdfQ==
