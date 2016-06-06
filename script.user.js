// ==UserScript==
// @name Twitch Chat Emotes
// @namespace #Cletus
// @version 2.1.1
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
"@-webkit-keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;margin-left:7px}#emote-menu-button.active{border-radius:2px;background-color:rgba(128,128,128,.5)}.emote-menu{padding:5px;z-index:1000;display:none;background-color:#202020;position:relative}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-starred{height:38px}.emote-menu .draggable{background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px)}.emote-menu .header-info{border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center;position:relative}.emote-menu .header-info img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:30px;height:30px;transition:all .25s ease;border:1px solid transparent}.emote-menu.editing .emote{cursor:auto}.emote-menu .emote img{max-width:100%;max-height:100%;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row .emote-container{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;padding:5px 0 2px;margin-top:5px;height:18px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5;background-size:contain!important}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-home{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNjQiDQogICBoZWlnaHQ9IjY0Ig0KICAgdmlld0JveD0iMCAwIDY0IDY0Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhMzAwMSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczI5OTkiIC8+DQo8cGF0aA0KICAgZD0ibSA1Ny4wNjIsMzEuMzk4IGMgMC45MzIsLTEuMDI1IDAuODQyLC0yLjU5NiAtMC4yMDEsLTMuNTA4IEwgMzMuODg0LDcuNzg1IEMgMzIuODQxLDYuODczIDMxLjE2OSw2Ljg5MiAzMC4xNDgsNy44MjggTCA3LjA5MywyOC45NjIgYyAtMS4wMjEsMC45MzYgLTEuMDcxLDIuNTA1IC0wLjExMSwzLjUwMyBsIDAuNTc4LDAuNjAyIGMgMC45NTksMC45OTggMi41MDksMS4xMTcgMy40NiwwLjI2NSBsIDEuNzIzLC0xLjU0MyB2IDIyLjU5IGMgMCwxLjM4NiAxLjEyMywyLjUwOCAyLjUwOCwyLjUwOCBoIDguOTg3IGMgMS4zODUsMCAyLjUwOCwtMS4xMjIgMi41MDgsLTIuNTA4IFYgMzguNTc1IGggMTEuNDYzIHYgMTUuODA0IGMgLTAuMDIsMS4zODUgMC45NzEsMi41MDcgMi4zNTYsMi41MDcgaCA5LjUyNCBjIDEuMzg1LDAgMi41MDgsLTEuMTIyIDIuNTA4LC0yLjUwOCBWIDMyLjEwNyBjIDAsMCAwLjQ3NiwwLjQxNyAxLjA2MywwLjkzMyAwLjU4NiwwLjUxNSAxLjgxNywwLjEwMiAyLjc0OSwtMC45MjQgbCAwLjY1MywtMC43MTggeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) 50% no-repeat}.emote-menu .icon-gear{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMjEuNTkiDQogICBoZWlnaHQ9IjIxLjEzNjk5OSINCiAgIHZpZXdCb3g9IjAgMCAyMS41OSAyMS4xMzciDQogICBpZD0iQ2FwYV8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGEzOSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczM3IiAvPg0KPHBhdGgNCiAgIGQ9Ik0gMTguNjIyLDguMTQ1IDE4LjA3Nyw2Ljg1IGMgMCwwIDEuMjY4LC0yLjg2MSAxLjE1NiwtMi45NzEgTCAxNy41NTQsMi4yNCBDIDE3LjQzOCwyLjEyNyAxNC41NzYsMy40MzMgMTQuNTc2LDMuNDMzIEwgMTMuMjU2LDIuOSBDIDEzLjI1NiwyLjkgMTIuMDksMCAxMS45MywwIEggOS41NjEgQyA5LjM5NiwwIDguMzE3LDIuOTA2IDguMzE3LDIuOTA2IEwgNi45OTksMy40NDEgYyAwLDAgLTIuOTIyLC0xLjI0MiAtMy4wMzQsLTEuMTMxIEwgMi4yODksMy45NTEgQyAyLjE3Myw0LjA2NCAzLjUwNyw2Ljg2NyAzLjUwNyw2Ljg2NyBMIDIuOTYyLDguMTYgQyAyLjk2Miw4LjE2IDAsOS4zMDEgMCw5LjQ1NSB2IDIuMzIyIGMgMCwwLjE2MiAyLjk2OSwxLjIxOSAyLjk2OSwxLjIxOSBsIDAuNTQ1LDEuMjkxIGMgMCwwIC0xLjI2OCwyLjg1OSAtMS4xNTcsMi45NjkgbCAxLjY3OCwxLjY0MyBjIDAuMTE0LDAuMTExIDIuOTc3LC0xLjE5NSAyLjk3NywtMS4xOTUgbCAxLjMyMSwwLjUzNSBjIDAsMCAxLjE2NiwyLjg5OCAxLjMyNywyLjg5OCBoIDIuMzY5IGMgMC4xNjQsMCAxLjI0NCwtMi45MDYgMS4yNDQsLTIuOTA2IGwgMS4zMjIsLTAuNTM1IGMgMCwwIDIuOTE2LDEuMjQyIDMuMDI5LDEuMTMzIGwgMS42NzgsLTEuNjQxIGMgMC4xMTcsLTAuMTE1IC0xLjIyLC0yLjkxNiAtMS4yMiwtMi45MTYgbCAwLjU0NCwtMS4yOTMgYyAwLDAgMi45NjMsLTEuMTQzIDIuOTYzLC0xLjI5OSBWIDkuMzYgQyAyMS41OSw5LjE5OSAxOC42MjIsOC4xNDUgMTguNjIyLDguMTQ1IHogbSAtNC4zNjYsMi40MjMgYyAwLDEuODY3IC0xLjU1MywzLjM4NyAtMy40NjEsMy4zODcgLTEuOTA2LDAgLTMuNDYxLC0xLjUyIC0zLjQ2MSwtMy4zODcgMCwtMS44NjcgMS41NTUsLTMuMzg1IDMuNDYxLC0zLjM4NSAxLjkwOSwwLjAwMSAzLjQ2MSwxLjUxOCAzLjQ2MSwzLjM4NSB6Ig0KICAgaWQ9InBhdGgzIg0KICAgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgLz4NCjxnDQogICBpZD0iZzUiPg0KPC9nPg0KPGcNCiAgIGlkPSJnNyI+DQo8L2c+DQo8Zw0KICAgaWQ9Imc5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzExIj4NCjwvZz4NCjxnDQogICBpZD0iZzEzIj4NCjwvZz4NCjxnDQogICBpZD0iZzE1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzIxIj4NCjwvZz4NCjxnDQogICBpZD0iZzIzIj4NCjwvZz4NCjxnDQogICBpZD0iZzI1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzMxIj4NCjwvZz4NCjxnDQogICBpZD0iZzMzIj4NCjwvZz4NCjwvc3ZnPg0K) 50% no-repeat}.emote-menu.editing .icon-gear{-webkit-animation:spin 4s linear infinite;animation:spin 4s linear infinite}.emote-menu .icon-resize-handle{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgdmlld0JveD0iMCAwIDE2IDE2Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhNDM1NyI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczQzNTUiIC8+DQo8cGF0aA0KICAgZD0iTSAxMy41LDggQyAxMy4yMjUsOCAxMyw4LjIyNCAxMyw4LjUgdiAzLjc5MyBMIDMuNzA3LDMgSCA3LjUgQyA3Ljc3NiwzIDgsMi43NzYgOCwyLjUgOCwyLjIyNCA3Ljc3NiwyIDcuNSwyIGggLTUgTCAyLjMwOSwyLjAzOSAyLjE1LDIuMTQ0IDIuMTQ2LDIuMTQ2IDIuMTQzLDIuMTUyIDIuMDM5LDIuMzA5IDIsMi41IHYgNSBDIDIsNy43NzYgMi4yMjQsOCAyLjUsOCAyLjc3Niw4IDMsNy43NzYgMyw3LjUgViAzLjcwNyBMIDEyLjI5MywxMyBIIDguNSBDIDguMjI0LDEzIDgsMTMuMjI1IDgsMTMuNSA4LDEzLjc3NSA4LjIyNCwxNCA4LjUsMTQgaCA1IGwgMC4xOTEsLTAuMDM5IGMgMC4xMjEsLTAuMDUxIDAuMjIsLTAuMTQ4IDAuMjcsLTAuMjcgTCAxNCwxMy41MDIgViA4LjUgQyAxNCw4LjIyNCAxMy43NzUsOCAxMy41LDggeiINCiAgIGlkPSJwYXRoNDM1MSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) 50% no-repeat;cursor:nwse-resize!important}.emote-menu .icon-pin{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgaWQ9InN2ZzMwMDUiPg0KICA8bWV0YWRhdGENCiAgICAgaWQ9Im1ldGFkYXRhMzAyMyI+DQogICAgPHJkZjpSREY+DQogICAgICA8Y2M6V29yaw0KICAgICAgICAgcmRmOmFib3V0PSIiPg0KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4NCiAgICAgICAgPGRjOnR5cGUNCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4NCiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+DQogICAgICA8L2NjOldvcms+DQogICAgPC9yZGY6UkRGPg0KICA8L21ldGFkYXRhPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczMwMjEiIC8+DQogIDxnDQogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzkzMDc4MiwwLDAsMC43OTMwNzgyLC0yLjE3MDk4NSwtODE0LjY5Mjk5KSINCiAgICAgaWQ9ImczMDA3Ij4NCiAgICA8Zw0KICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTEsMC43MDcxMSwtMC43MDcxMSwwLjcwNzExLDczNy43MDc1NSwyOTUuNDg4MDgpIg0KICAgICAgIGlkPSJnMzAwOSI+DQogICAgICA8Zw0KICAgICAgICAgaWQ9ImczNzU1Ij4NCiAgICAgICAgPHBhdGgNCiAgICAgICAgICAgZD0iTSA5Ljc4MTI1LDAgQyA5LjQ3NDA1NjIsMC42ODkxMTIgOS41MjA2OCwxLjUyMzA4NTMgOS4zMTI1LDIuMTg3NSBMIDQuOTM3NSw2LjU5Mzc1IEMgMy45NTg5NjA4LDYuNDI5NDgzIDIuOTQ3NzU0OCw2LjUzMjc4OTkgMiw2LjgxMjUgTCA1LjAzMTI1LDkuODQzNzUgMC41NjI1LDE0LjMxMjUgMCwxNiBDIDAuNTY5Mjk2MjgsMTUuNzk1NjI2IDEuMTY3NzM3OCwxNS42NDAyMzcgMS43MTg3NSwxNS40MDYyNSBMIDYuMTU2MjUsMTAuOTY4NzUgOS4xODc1LDE0IGMgMC4yNzk2ODIzLC0wLjk0Nzc4MyAwLjM4MzE1MjgsLTEuOTU4OTM3IDAuMjE4NzUsLTIuOTM3NSAxLjUwMDAxMSwtMS40ODk1Nzk4IDMuMDAwMDAxLC0yLjk3OTE1OSA0LjUsLTQuNDY4NzUgMC42MDExMDIsLTAuMDMxMzYxIDEuODIyMTM4LC0wLjA5NjEzNyAyLC0wLjQ2ODc1IEMgMTMuODc5ODkyLDQuMDY5NDgwMyAxMS44NDI4NjUsMi4wMjAyMjgyIDkuNzgxMjUsMCB6Ig0KICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg5MTU5Mzc0LC0wLjg5MTU5Mzc0LDAuODkxNTkzNzQsMC44OTE1OTM3NCwtMi4yNjU1LDEwMzcuMTM0NSkiDQogICAgICAgICAgIGlkPSJwYXRoMzAxMSINCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K) 50% no-repeat;transition:all .25s ease}.emote-menu .icon-pin:hover,.emote-menu.pinned .icon-pin{-webkit-transform:rotate(-45deg);transform:rotate(-45deg);opacity:1}.emote-menu .edit-tool{background-position:50%;background-repeat:no-repeat;background-size:14px;border-radius:4px;border:1px solid #000;cursor:pointer;display:none;height:14px;opacity:.25;position:absolute;transition:all .25s ease;width:14px;z-index:1}.emote-menu .edit-tool:hover,.emote-menu .emote:hover .edit-tool{opacity:1}.emote-menu .edit-visibility{background-color:#00c800;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGE5Ij48cmRmOlJERj48Y2M6V29yaw0KICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQ0KICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz48ZGM6dGl0bGU+PC9kYzp0aXRsZT48L2NjOldvcms+PC9yZGY6UkRGPjwvbWV0YWRhdGE+PGRlZnMNCiAgIGlkPSJkZWZzNyIgLz4NCjxwYXRoDQogICBkPSJNIDk3Ljk2NCw0Ni41NDggQyA5Ny4wOTgsNDUuNTI4IDc2LjQyNywyMS42MDMgNTAsMjEuNjAzIGMgLTI2LjQyNywwIC00Ny4wOTgsMjMuOTI1IC00Ny45NjUsMjQuOTQ2IC0xLjcwMSwyIC0xLjcwMSw0LjkwMiAxMGUtNCw2LjkwMyAwLjg2NiwxLjAyIDIxLjUzNywyNC45NDUgNDcuOTY0LDI0Ljk0NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMiAxLjcwMSwtNC45MDIgLTAuMDAxLC02LjkwMyB6IE0gNTguMDczLDM1Ljk3NSBjIDEuNzc3LC0wLjk3IDQuMjU1LDAuMTQzIDUuNTM0LDIuNDg1IDEuMjc5LDIuMzQzIDAuODc1LDUuMDI5IC0wLjkwMiw1Ljk5OSAtMS43NzcsMC45NzEgLTQuMjU1LC0wLjE0MyAtNS41MzUsLTIuNDg1IC0xLjI3OSwtMi4zNDMgLTAuODc1LC01LjAyOSAwLjkwMywtNS45OTkgeiBNIDUwLDY5LjcyOSBDIDMxLjU0LDY5LjcyOSAxNi4wMDUsNTUuNTUzIDEwLjYyOCw1MCAxNC4yNTksNDYuMjQ5IDIyLjUyNiwzOC41NzEgMzMuMTk1LDMzLjk3OSAzMS4xMTQsMzcuMTQ1IDI5Ljg5NCw0MC45MjggMjkuODk0LDQ1IGMgMCwxMS4xMDQgOS4wMDEsMjAuMTA1IDIwLjEwNSwyMC4xMDUgMTEuMTA0LDAgMjAuMTA2LC05LjAwMSAyMC4xMDYsLTIwLjEwNSAwLC00LjA3MiAtMS4yMTksLTcuODU1IC0zLjMsLTExLjAyMSBDIDc3LjQ3NCwzOC41NzIgODUuNzQxLDQ2LjI1IDg5LjM3Miw1MCA4My45OTUsNTUuNTU1IDY4LjQ2LDY5LjcyOSA1MCw2OS43MjkgeiINCiAgIGlkPSJwYXRoMyIgLz4NCjwvc3ZnPg==)}.emote-menu .edit-starred{background-color:#323232;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNjY2NjY2M7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote>.edit-visibility{bottom:auto;left:auto;right:0;top:0}.emote-menu .emote>.edit-starred{bottom:auto;left:0;right:auto;top:0}.emote-menu .header-info>.edit-tool{margin-left:5px}.emote-menu.editing .edit-tool{display:inline-block}.emote-menu .emote-menu-hidden .edit-visibility{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8zIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGExNSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczEzIiAvPg0KPGcNCiAgIGlkPSJnMyI+DQoJPHBhdGgNCiAgIGQ9Ik0gNzAuMDgyLDQ1LjQ3NSA1MC40NzQsNjUuMDgyIEMgNjEuMTk4LDY0LjgzMSA2OS44MzEsNTYuMTk3IDcwLjA4Miw0NS40NzUgeiINCiAgIGlkPSJwYXRoNSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTcuOTY0LDQ2LjU0OCBjIC0wLjQ1LC0wLjUyOSAtNi4yNDUsLTcuMjMgLTE1LjQwMywtMTMuNTU0IGwgLTYuMiw2LjIgQyA4Mi4zNTEsNDMuMTQ4IDg2LjkyLDQ3LjQ2OSA4OS4zNzIsNTAgODMuOTk1LDU1LjU1NSA2OC40Niw2OS43MjkgNTAsNjkuNzI5IGMgLTEuMzM0LDAgLTIuNjUxLC0wLjA4MiAtMy45NTIsLTAuMjIyIGwgLTcuNDM5LDcuNDM5IGMgMy42MzksMC45MDkgNy40NDksMS40NSAxMS4zOTEsMS40NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMS45OTkgMS43MDEsLTQuOTAxIC0wLjAwMSwtNi45MDIgeiINCiAgIGlkPSJwYXRoNyINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTEuNDExLDE2LjY2IGMgMCwtMC4yNjYgLTAuMTA1LC0wLjUyIC0wLjI5MywtMC43MDcgbCAtNy4wNzEsLTcuMDcgYyAtMC4zOTEsLTAuMzkxIC0xLjAyMywtMC4zOTEgLTEuNDE0LDAgTCA2Ni44MDQsMjQuNzExIEMgNjEuNjAyLDIyLjgxOCA1NS45NDksMjEuNjAzIDUwLDIxLjYwMyBjIC0yNi40MjcsMCAtNDcuMDk4LDIzLjkyNiAtNDcuOTY1LDI0Ljk0NiAtMS43MDEsMiAtMS43MDEsNC45MDIgMTBlLTQsNi45MDMgMC41MTcsMC42MDcgOC4wODMsOS4zNTQgMTkuNzA3LDE2LjMyIEwgOC44ODMsODIuNjMyIEMgOC42OTUsODIuODIgOC41OSw4My4wNzMgOC41OSw4My4zMzkgYyAwLDAuMjY2IDAuMTA1LDAuNTIgMC4yOTMsMC43MDcgbCA3LjA3MSw3LjA3IGMgMC4xOTUsMC4xOTUgMC40NTEsMC4yOTMgMC43MDcsMC4yOTMgMC4yNTYsMCAwLjUxMiwtMC4wOTggMC43MDcsLTAuMjkzIGwgNzMuNzUsLTczLjc1IGMgMC4xODcsLTAuMTg2IDAuMjkzLC0wLjQ0IDAuMjkzLC0wLjcwNiB6IE0gMTAuNjI4LDUwIEMgMTQuMjU5LDQ2LjI0OSAyMi41MjYsMzguNTcxIDMzLjE5NSwzMy45NzkgMzEuMTE0LDM3LjE0NSAyOS44OTQsNDAuOTI4IDI5Ljg5NCw0NSBjIDAsNC42NjUgMS42MDEsOC45NDUgNC4yNywxMi4zNTEgTCAyOC4wNCw2My40NzUgQyAxOS44ODgsNTguOTU1IDEzLjY0OSw1My4xMiAxMC42MjgsNTAgeiINCiAgIGlkPSJwYXRoOSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQo8L2c+DQo8L3N2Zz4NCg==);background-color:red}.emote-menu .emote-menu-starred .edit-starred{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmNjMDA7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote.emote-menu-starred{border-color:rgba(200,200,0,.5)}.emote-menu .emote.emote-menu-hidden{border-color:rgba(255,0,0,.5)}.emote-menu #starred-emotes-group .emote:not(.emote-menu-starred),.emote-menu:not(.editing) .emote-menu-hidden{display:none}.emote-menu:not(.editing) #starred-emotes-group .emote-menu-starred{border-color:transparent}.emote-menu #starred-emotes-group{text-align:center;color:#646464}.emote-menu #starred-emotes-group:empty:before{content:\"Use the edit mode to star an emote!\";position:relative;top:8px}.emote-menu .scrollable{height:calc(100% - 101px);overflow-y:auto}.emote-menu .sticky{position:absolute;bottom:0;width:100%}.emote-menu .emote-menu-inner{position:relative;max-height:100%;height:100%}"));

},{}],3:[function(require,module,exports){
module.exports = (function() {
    var Hogan = require('hogan.js/lib/template.js');
    var templates = {};
    templates['emote'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote");if(t.s(t.f("thirdParty",c,p,1),c,p,0,32,44,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" third-party");});c.pop();}if(!t.s(t.f("isVisible",c,p,1),c,p,1,0,0,"")){t.b(" emote-menu-hidden");};if(t.s(t.f("isStarred",c,p,1),c,p,0,119,138,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" emote-menu-starred");});c.pop();}t.b("\" data-emote=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" title=\"");t.b(t.v(t.f("text",c,p,0)));if(t.s(t.f("thirdParty",c,p,1),c,p,0,206,229,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" (from 3rd party addon)");});c.pop();}t.b("\">\r");t.b("\n" + i);t.b("	<img src=\"");t.b(t.t(t.f("url",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-starred\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-starred\" title=\"Star/unstar emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-visibility\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button glyph-only float-left\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
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
  "version": "2.1.1",
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
			793: 'turbo'
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
	 * @return {string|null} The emote's channel or `null` if it doesn't have one.
	 */
	this.getChannelName = function () {
		if (!channel.name) {
			channel.name = storage.channelNames.get(this.getText());
		}
		return channel.name;
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
		if (theChannel !== '~global' && theChannel !== 'turbo') {
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
			return defaultBadge;
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
			'turbo': 'Turbo'
		};

		// No channel.
		if (!channelName) {
			return null;
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
var logger = require('./logger');
var api = {};

api.getBadges = function (username, callback) {
	// Note: not a documented API endpoint.
	twitchApi.get('chat/' + username + '/badges')
		.done(function (api) {
			callback(api);
		})
		.fail(function () {
			callback({});
		});
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

		// Turbo goes first, always.
		if (aChannel === 'turbo' && bChannel !== 'turbo') {
			return -1;
		}
		if (bChannel === 'turbo' && aChannel !== 'turbo') {
			return 1;
		}

		// Global goes second, always.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiLi9zcmMvc2NyaXB0LmpzIiwiQzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC9zdHlsZXMuanMiLCJDOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL2J1aWxkL3RlbXBsYXRlcy5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2hvZ2FuLmpzL2xpYi90ZW1wbGF0ZS5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvbm9kZV9tb2R1bGVzL2pxdWVyeS5zY3JvbGxiYXIvanF1ZXJ5LnNjcm9sbGJhci5taW4uanMiLCJDOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9zdG9yYWdlLXdyYXBwZXIvaW5kZXguanMiLCJDOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3BhY2thZ2UuanNvbiIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvZW1iZXItYXBpLmpzIiwiQzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy9lbW90ZXMuanMiLCJDOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL2xvZ2dlci5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvcHVibGljLWFwaS5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvc3RvcmFnZS5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvdGVtcGxhdGVzLmpzIiwiQzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy90d2l0Y2gtYXBpLmpzIiwiQzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy91aS5qcyIsIkM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL3BsdWdpbnMvcmVzaXphYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcnJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHBrZyA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xyXG52YXIgcHVibGljQXBpID0gcmVxdWlyZSgnLi9tb2R1bGVzL3B1YmxpYy1hcGknKTtcclxudmFyIGVtYmVyID0gcmVxdWlyZSgnLi9tb2R1bGVzL2VtYmVyLWFwaScpO1xyXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9tb2R1bGVzL2xvZ2dlcicpO1xyXG52YXIgZW1vdGVzID0gcmVxdWlyZSgnLi9tb2R1bGVzL2Vtb3RlcycpO1xyXG52YXIgdWkgPSByZXF1aXJlKCcuL21vZHVsZXMvdWknKTtcclxuXHJcbmxvZ2dlci5sb2coJyh2JysgcGtnLnZlcnNpb24gKyAnKSBJbml0aWFsIGxvYWQgb24gJyArIGxvY2F0aW9uLmhyZWYpO1xyXG5cclxuLy8gT25seSBlbmFibGUgc2NyaXB0IGlmIHdlIGhhdmUgdGhlIHJpZ2h0IHZhcmlhYmxlcy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxudmFyIGluaXRUaW1lciA9IDA7XHJcbihmdW5jdGlvbiBpbml0KHRpbWUpIHtcdFxyXG5cdGlmICghdGltZSkge1xyXG5cdFx0dGltZSA9IDA7XHJcblx0fVxyXG5cclxuXHR2YXIgb2JqZWN0c0xvYWRlZCA9IChcclxuXHRcdHdpbmRvdy5Ud2l0Y2ggIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0d2luZG93LmpRdWVyeSAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHRlbWJlci5pc0xvYWRlZCgpXHJcblx0KTtcclxuXHRpZiAoIW9iamVjdHNMb2FkZWQpIHtcclxuXHRcdC8vIFN0b3BzIHRyeWluZyBhZnRlciAxMCBtaW51dGVzLlxyXG5cdFx0aWYgKGluaXRUaW1lciA+PSA2MDAwMDApIHtcclxuXHRcdFx0bG9nZ2VyLmxvZygnVGFraW5nIHRvbyBsb25nIHRvIGxvYWQsIHN0b3BwaW5nLiBSZWZyZXNoIHRoZSBwYWdlIHRvIHRyeSBhZ2Fpbi4gKCcgKyBpbml0VGltZXIgKyAnbXMpJyk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHaXZlIGFuIHVwZGF0ZSBldmVyeSAxMCBzZWNvbmRzLlxyXG5cdFx0aWYgKGluaXRUaW1lciAlIDEwMDAwKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnU3RpbGwgd2FpdGluZyBmb3Igb2JqZWN0cyB0byBsb2FkLiAoJyArIGluaXRUaW1lciArICdtcyknKTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBCdW1wIHRpbWUgdXAgYWZ0ZXIgMXMgdG8gcmVkdWNlIHBvc3NpYmxlIGxhZy5cclxuXHRcdHRpbWUgPSB0aW1lID49IDEwMDAgPyAxMDAwIDogdGltZSArIDI1O1xyXG5cdFx0aW5pdFRpbWVyICs9IHRpbWU7XHJcblxyXG5cdFx0c2V0VGltZW91dChpbml0LCB0aW1lLCB0aW1lKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0XHJcblx0Ly8gRXhwb3NlIHB1YmxpYyBhcGkuXHJcblx0aWYgKHR5cGVvZiB3aW5kb3cuZW1vdGVNZW51ID09PSAndW5kZWZpbmVkJykge1xyXG5cdFx0d2luZG93LmVtb3RlTWVudSA9IHB1YmxpY0FwaTtcclxuXHR9XHJcblxyXG5cdGVtYmVyLmhvb2soJ3JvdXRlOmNoYW5uZWwnLCBhY3RpdmF0ZSwgZGVhY3RpdmF0ZSk7XHJcblx0ZW1iZXIuaG9vaygncm91dGU6Y2hhdCcsIGFjdGl2YXRlLCBkZWFjdGl2YXRlKTtcclxuXHJcblx0YWN0aXZhdGUoKTtcclxufSkoKTtcclxuXHJcbmZ1bmN0aW9uIGFjdGl2YXRlKCkge1xyXG5cdHVpLmluaXQoKTtcclxuXHRlbW90ZXMuaW5pdCgpO1xyXG59XHJcbmZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XHJcblx0dWkuaGlkZU1lbnUoKTtcclxufVxyXG4iLCIoZnVuY3Rpb24gKGRvYywgY3NzVGV4dCkge1xuICAgIHZhciBpZCA9IFwiZW1vdGUtbWVudS1mb3ItdHdpdGNoLXN0eWxlc1wiO1xuICAgIHZhciBzdHlsZUVsID0gZG9jLmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICBpZiAoIXN0eWxlRWwpIHtcbiAgICAgICAgc3R5bGVFbCA9IGRvYy5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICAgIHN0eWxlRWwuaWQgPSBpZDtcbiAgICAgICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChzdHlsZUVsKTtcbiAgICB9XG4gICAgaWYgKHN0eWxlRWwuc3R5bGVTaGVldCkge1xuICAgICAgICBpZiAoIXN0eWxlRWwuc3R5bGVTaGVldC5kaXNhYmxlZCkge1xuICAgICAgICAgICAgc3R5bGVFbC5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3NUZXh0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0eWxlRWwuaW5uZXJIVE1MID0gY3NzVGV4dDtcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlKSB7XG4gICAgICAgICAgICBzdHlsZUVsLmlubmVyVGV4dCA9IGNzc1RleHQ7XG4gICAgICAgIH1cbiAgICB9XG59KGRvY3VtZW50LCBcIi8qKlxcblwiICtcblwiICogTWluaWZpZWQgc3R5bGUuXFxuXCIgK1xuXCIgKiBPcmlnaW5hbCBmaWxlbmFtZTogXFxcXG5vZGVfbW9kdWxlc1xcXFxqcXVlcnkuc2Nyb2xsYmFyXFxcXGpxdWVyeS5zY3JvbGxiYXIuY3NzXFxuXCIgK1xuXCIgKi9cXG5cIiArXG5cIi5zY3JvbGwtd3JhcHBlcntvdmVyZmxvdzpoaWRkZW4haW1wb3J0YW50O3BhZGRpbmc6MCFpbXBvcnRhbnQ7cG9zaXRpb246cmVsYXRpdmV9LnNjcm9sbC13cmFwcGVyPi5zY3JvbGwtY29udGVudHtib3JkZXI6bm9uZSFpbXBvcnRhbnQ7LW1vei1ib3gtc2l6aW5nOmNvbnRlbnQtYm94IWltcG9ydGFudDtib3gtc2l6aW5nOmNvbnRlbnQtYm94IWltcG9ydGFudDtoZWlnaHQ6YXV0bztsZWZ0OjA7bWFyZ2luOjA7bWF4LWhlaWdodDpub25lIWltcG9ydGFudDttYXgtd2lkdGg6bm9uZSFpbXBvcnRhbnQ7b3ZlcmZsb3c6c2Nyb2xsIWltcG9ydGFudDtwYWRkaW5nOjA7cG9zaXRpb246cmVsYXRpdmUhaW1wb3J0YW50O3RvcDowO3dpZHRoOmF1dG8haW1wb3J0YW50fS5zY3JvbGwtd3JhcHBlcj4uc2Nyb2xsLWNvbnRlbnQ6Oi13ZWJraXQtc2Nyb2xsYmFye2hlaWdodDowO3dpZHRoOjB9LnNjcm9sbC1lbGVtZW50e2Rpc3BsYXk6bm9uZX0uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbC1lbGVtZW50IGRpdnstbW96LWJveC1zaXppbmc6Y29udGVudC1ib3g7Ym94LXNpemluZzpjb250ZW50LWJveH0uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSwuc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZXtkaXNwbGF5OmJsb2NrfS5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWFycm93LC5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntjdXJzb3I6ZGVmYXVsdH0uc2Nyb2xsLXRleHRhcmVhe2JvcmRlcjoxcHggc29saWQgI2NjYztib3JkZXItdG9wLWNvbG9yOiM5OTl9LnNjcm9sbC10ZXh0YXJlYT4uc2Nyb2xsLWNvbnRlbnR7b3ZlcmZsb3c6aGlkZGVuIWltcG9ydGFudH0uc2Nyb2xsLXRleHRhcmVhPi5zY3JvbGwtY29udGVudD50ZXh0YXJlYXtib3JkZXI6bm9uZSFpbXBvcnRhbnQ7LW1vei1ib3gtc2l6aW5nOmJvcmRlci1ib3g7Ym94LXNpemluZzpib3JkZXItYm94O2hlaWdodDoxMDAlIWltcG9ydGFudDttYXJnaW46MDttYXgtaGVpZ2h0Om5vbmUhaW1wb3J0YW50O21heC13aWR0aDpub25lIWltcG9ydGFudDtvdmVyZmxvdzpzY3JvbGwhaW1wb3J0YW50O291dGxpbmU6MDtwYWRkaW5nOjJweDtwb3NpdGlvbjpyZWxhdGl2ZSFpbXBvcnRhbnQ7dG9wOjA7d2lkdGg6MTAwJSFpbXBvcnRhbnR9LnNjcm9sbC10ZXh0YXJlYT4uc2Nyb2xsLWNvbnRlbnQ+dGV4dGFyZWE6Oi13ZWJraXQtc2Nyb2xsYmFye2hlaWdodDowO3dpZHRoOjB9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgZGl2e2JvcmRlcjpub25lO21hcmdpbjowO3BhZGRpbmc6MDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwfS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IGRpdntkaXNwbGF5OmJsb2NrO2hlaWdodDoxMDAlO2xlZnQ6MDt0b3A6MDt3aWR0aDoxMDAlfS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14e2JvdHRvbToycHg7aGVpZ2h0OjhweDtsZWZ0OjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteXtoZWlnaHQ6MTAwJTtyaWdodDoycHg7dG9wOjA7d2lkdGg6OHB4fS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlcntvdmVyZmxvdzpoaWRkZW59LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXIsLnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X291dGVyLC5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF90cmFja3tib3JkZXItcmFkaXVzOjhweH0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhciwuc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7LW1zLWZpbHRlcjpcXFwicHJvZ2lkOkRYSW1hZ2VUcmFuc2Zvcm0uTWljcm9zb2Z0LkFscGhhKE9wYWNpdHk9NDApXFxcIjtmaWx0ZXI6YWxwaGEob3BhY2l0eT00MCk7b3BhY2l0eTouNH0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7YmFja2dyb3VuZC1jb2xvcjojZTBlMGUwfS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFye2JhY2tncm91bmQtY29sb3I6I2MyYzJjMn0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwtZHJhZ2dhYmxlIC5zY3JvbGwtYmFyLC5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50OmhvdmVyIC5zY3JvbGwtYmFye2JhY2tncm91bmQtY29sb3I6IzkxOTE5MX0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3tsZWZ0Oi0xMnB4fS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3RyYWNre3RvcDotMTJweH0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTEycHh9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTEycHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQgZGl2e2JvcmRlcjpub25lO21hcmdpbjowO3BhZGRpbmc6MDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwfS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50e2JhY2tncm91bmQtY29sb3I6I2ZmZn0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCBkaXZ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteHtib3R0b206MDtoZWlnaHQ6MTJweDtsZWZ0OjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteXtoZWlnaHQ6MTAwJTtyaWdodDowO3RvcDowO3dpZHRoOjEycHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X291dGVye2hlaWdodDo4cHg7dG9wOjJweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7bGVmdDoycHg7d2lkdGg6OHB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlcntvdmVyZmxvdzpoaWRkZW59LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X3RyYWNre2JhY2tncm91bmQtY29sb3I6I2VlZX0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhciwuc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXIsLnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X3RyYWNre2JvcmRlci1yYWRpdXM6OHB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFye2JhY2tncm91bmQtY29sb3I6I2Q5ZDlkOX0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcjpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNjMmMyYzJ9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLWRyYWdnYWJsZSAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiM5MTkxOTF9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZXtsZWZ0Oi0xMnB4O21hcmdpbi1sZWZ0OjEycHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZXt0b3A6LTEycHg7bWFyZ2luLXRvcDoxMnB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtYmFye21pbi13aWR0aDoxMHB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtYmFye21pbi1oZWlnaHQ6MTBweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3tsZWZ0Oi0xNHB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3RyYWNre3RvcDotMTRweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTE0cHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTE0cHh9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LC5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudCBkaXZ7YmFja2dyb3VuZDowIDA7Ym9yZGVyOm5vbmU7bWFyZ2luOjA7cGFkZGluZzowO3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTB9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50IGRpdntkaXNwbGF5OmJsb2NrO2hlaWdodDoxMDAlO2xlZnQ6MDt0b3A6MDt3aWR0aDoxMDAlfS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7ZGlzcGxheTpub25lfS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiM2QzZFNzE7ZGlzcGxheTpibG9jazstbXMtZmlsdGVyOlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQWxwaGEoT3BhY2l0eT0wKVxcXCI7ZmlsdGVyOmFscGhhKG9wYWNpdHk9MCk7b3BhY2l0eTowO2JvcmRlci1yYWRpdXM6N3B4O3RyYW5zaXRpb246b3BhY2l0eSAuMnMgbGluZWFyfS5zY3JvbGxiYXItbWFjb3N4OmhvdmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhciwuc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLWRyYWdnYWJsZSAuc2Nyb2xsLWJhcnstbXMtZmlsdGVyOlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQWxwaGEoT3BhY2l0eT03MClcXFwiO2ZpbHRlcjphbHBoYShvcGFjaXR5PTcwKTtvcGFjaXR5Oi43fS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteHtib3R0b206MDtoZWlnaHQ6MDtsZWZ0OjA7bWluLXdpZHRoOjEwMCU7b3ZlcmZsb3c6dmlzaWJsZTt3aWR0aDoxMDAlfS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteXtoZWlnaHQ6MTAwJTttaW4taGVpZ2h0OjEwMCU7cmlnaHQ6MDt0b3A6MDt3aWR0aDowfS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWJhcntoZWlnaHQ6N3B4O21pbi13aWR0aDoxMHB4O3RvcDotOXB4fS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWJhcntsZWZ0Oi05cHg7bWluLWhlaWdodDoxMHB4O3dpZHRoOjdweH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X291dGVye2xlZnQ6MnB4fS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi00cHh9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9vdXRlcnt0b3A6MnB4fS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTRweH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi0xMXB4fS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple3RvcDotMTFweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudCwuc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudCBkaXZ7Ym9yZGVyOm5vbmU7bWFyZ2luOjA7b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwfS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50e2JhY2tncm91bmQtY29sb3I6I2ZmZn0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudCBkaXZ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7Ym9yZGVyLXJhZGl1czoxMHB4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9zaXple2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlBL1BnbzhjM1puSUhodGJHNXpQU0pvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh5TURBd0wzTjJaeUlnZDJsa2RHZzlJakV3TUNVaUlHaGxhV2RvZEQwaU1UQXdKU0lnZG1sbGQwSnZlRDBpTUNBd0lERWdNU0lnY0hKbGMyVnlkbVZCYzNCbFkzUlNZWFJwYnowaWJtOXVaU0krQ2lBZ1BHeHBibVZoY2tkeVlXUnBaVzUwSUdsa1BTSm5jbUZrTFhWaloyY3RaMlZ1WlhKaGRHVmtJaUJuY21Ga2FXVnVkRlZ1YVhSelBTSjFjMlZ5VTNCaFkyVlBibFZ6WlNJZ2VERTlJakFsSWlCNU1UMGlNQ1VpSUhneVBTSXhNREFsSWlCNU1qMGlNQ1VpUGdvZ0lDQWdQSE4wYjNBZ2IyWm1jMlYwUFNJd0pTSWdjM1J2Y0MxamIyeHZjajBpSTJSaVpHSmtZaUlnYzNSdmNDMXZjR0ZqYVhSNVBTSXhJaTgrQ2lBZ0lDQThjM1J2Y0NCdlptWnpaWFE5SWpFd01DVWlJSE4wYjNBdFkyOXNiM0k5SWlObE9HVTRaVGdpSUhOMGIzQXRiM0JoWTJsMGVUMGlNU0l2UGdvZ0lEd3ZiR2x1WldGeVIzSmhaR2xsYm5RK0NpQWdQSEpsWTNRZ2VEMGlNQ0lnZVQwaU1DSWdkMmxrZEdnOUlqRWlJR2hsYVdkb2REMGlNU0lnWm1sc2JEMGlkWEpzS0NObmNtRmtMWFZqWjJjdFoyVnVaWEpoZEdWa0tTSWdMejRLUEM5emRtYyspO2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCNkYmRiZGIgMCwjZThlOGU4IDEwMCUpO2JvcmRlci1yYWRpdXM6MTBweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteHtib3R0b206MDtoZWlnaHQ6MTdweDtsZWZ0OjA7bWluLXdpZHRoOjEwMCU7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteXtoZWlnaHQ6MTAwJTttaW4taGVpZ2h0OjEwMCU7cmlnaHQ6MDt0b3A6MDt3aWR0aDoxN3B4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFye2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlBL1BnbzhjM1puSUhodGJHNXpQU0pvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh5TURBd0wzTjJaeUlnZDJsa2RHZzlJakV3TUNVaUlHaGxhV2RvZEQwaU1UQXdKU0lnZG1sbGQwSnZlRDBpTUNBd0lERWdNU0lnY0hKbGMyVnlkbVZCYzNCbFkzUlNZWFJwYnowaWJtOXVaU0krQ2lBZ1BHeHBibVZoY2tkeVlXUnBaVzUwSUdsa1BTSm5jbUZrTFhWaloyY3RaMlZ1WlhKaGRHVmtJaUJuY21Ga2FXVnVkRlZ1YVhSelBTSjFjMlZ5VTNCaFkyVlBibFZ6WlNJZ2VERTlJakFsSWlCNU1UMGlNQ1VpSUhneVBTSXhNREFsSWlCNU1qMGlNQ1VpUGdvZ0lDQWdQSE4wYjNBZ2IyWm1jMlYwUFNJd0pTSWdjM1J2Y0MxamIyeHZjajBpSTJabFptVm1aU0lnYzNSdmNDMXZjR0ZqYVhSNVBTSXhJaTgrQ2lBZ0lDQThjM1J2Y0NCdlptWnpaWFE5SWpFd01DVWlJSE4wYjNBdFkyOXNiM0k5SWlObU5XWTFaalVpSUhOMGIzQXRiM0JoWTJsMGVUMGlNU0l2UGdvZ0lEd3ZiR2x1WldGeVIzSmhaR2xsYm5RK0NpQWdQSEpsWTNRZ2VEMGlNQ0lnZVQwaU1DSWdkMmxrZEdnOUlqRWlJR2hsYVdkb2REMGlNU0lnWm1sc2JEMGlkWEpzS0NObmNtRmtMWFZqWjJjdFoyVnVaWEpoZEdWa0tTSWdMejRLUEM5emRtYyspO2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCNmZWZlZmUgMCwjZjVmNWY1IDEwMCUpO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjEwcHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZXtsZWZ0Oi0xN3B4O21hcmdpbi1sZWZ0OjE3cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZXt0b3A6LTE3cHg7bWFyZ2luLXRvcDoxN3B4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtYmFye2hlaWdodDoxMHB4O21pbi13aWR0aDoxMHB4O3RvcDowfS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtYmFye2xlZnQ6MDttaW4taGVpZ2h0OjEwcHg7d2lkdGg6MTBweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7aGVpZ2h0OjEycHg7bGVmdDoycHg7dG9wOjJweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi00cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X291dGVye2xlZnQ6MnB4O3RvcDoycHg7d2lkdGg6MTJweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTRweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTE5cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTE5cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7bGVmdDotMTlweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3t0b3A6LTE5cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudCwuc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50IGRpdntib3JkZXI6bm9uZTttYXJnaW46MDtvdmVyZmxvdzpoaWRkZW47cGFkZGluZzowO3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTB9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudCBkaXZ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9zaXple2JhY2tncm91bmQtY29sb3I6Izk5OTtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsLjMpfS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X291dGVyOmhvdmVyIC5zY3JvbGwtZWxlbWVudF9zaXple2JhY2tncm91bmQtY29sb3I6IzY2NjtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsLjUpfS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXh7Ym90dG9tOjA7aGVpZ2h0OjEycHg7bGVmdDowO21pbi13aWR0aDoxMDAlO3BhZGRpbmc6M3B4IDAgMnB4O3dpZHRoOjEwMCV9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteXtoZWlnaHQ6MTAwJTttaW4taGVpZ2h0OjEwMCU7cGFkZGluZzowIDJweCAwIDNweDtyaWdodDowO3RvcDowO3dpZHRoOjEycHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNkMGI5YTA7Ym9yZGVyLXJhZGl1czoycHg7Ym94LXNoYWRvdzoxcHggMXB4IDNweCByZ2JhKDAsMCwwLC41KX0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlcjpob3ZlciAuc2Nyb2xsLWJhcntib3gtc2hhZG93OjFweCAxcHggM3B4IHJnYmEoMCwwLDAsLjYpfS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZXtsZWZ0Oi0xN3B4O21hcmdpbi1sZWZ0OjE3cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtY29udGVudC5zY3JvbGwtc2Nyb2xseF92aXNpYmxle21hcmdpbi10b3A6MTdweDt0b3A6LTE3cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWJhcntoZWlnaHQ6MTBweDttaW4td2lkdGg6MTBweDt0b3A6MXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1iYXJ7bGVmdDoxcHg7bWluLWhlaWdodDoxMHB4O3dpZHRoOjEwcHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7aGVpZ2h0OjE1cHg7bGVmdDo1cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtoZWlnaHQ6MnB4O2xlZnQ6LTEwcHg7dG9wOjVweH0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9vdXRlcnt0b3A6NXB4O3dpZHRoOjE1cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0OjVweDt0b3A6LTEwcHg7d2lkdGg6MnB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi0yNXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTI1cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3tsZWZ0Oi0yNXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7dG9wOi0yNXB4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudCBkaXZ7YmFja2dyb3VuZDowIDA7Ym9yZGVyOm5vbmU7bWFyZ2luOjA7cGFkZGluZzowO3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTB9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudCBkaXZ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14e2JvdHRvbToycHg7aGVpZ2h0OjdweDtsZWZ0OjA7bWluLXdpZHRoOjEwMCU7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15e2hlaWdodDoxMDAlO21pbi1oZWlnaHQ6MTAwJTtyaWdodDoycHg7dG9wOjA7d2lkdGg6N3B4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X291dGVye29wYWNpdHk6LjM7Ym9yZGVyLXJhZGl1czoxMnB4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X3NpemV7YmFja2dyb3VuZC1jb2xvcjojY2NjO29wYWNpdHk6MDtib3JkZXItcmFkaXVzOjEycHg7dHJhbnNpdGlvbjpvcGFjaXR5IC4yc30uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFye2JhY2tncm91bmQtY29sb3I6IzZjNmU3MTtib3JkZXItcmFkaXVzOjdweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtYmFye2JvdHRvbTowO2hlaWdodDo3cHg7bWluLXdpZHRoOjI0cHg7dG9wOmF1dG99LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWJhcntsZWZ0OmF1dG87bWluLWhlaWdodDoyNHB4O3JpZ2h0OjA7d2lkdGg6N3B4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X291dGVye2JvdHRvbTowO3RvcDphdXRvO2xlZnQ6MnB4O3RyYW5zaXRpb246aGVpZ2h0IC4yc30uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9vdXRlcntsZWZ0OmF1dG87cmlnaHQ6MDt0b3A6MnB4O3RyYW5zaXRpb246d2lkdGggLjJzfS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDotNHB4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi00cHh9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTExcHh9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple3RvcDotMTFweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1lbGVtZW50X291dGVyLC5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQ6aG92ZXIgLnNjcm9sbC1lbGVtZW50X291dGVye292ZXJmbG93OmhpZGRlbjstbXMtZmlsdGVyOlxcXCJwcm9naWQ6RFhJbWFnZVRyYW5zZm9ybS5NaWNyb3NvZnQuQWxwaGEoT3BhY2l0eT03MClcXFwiO2ZpbHRlcjphbHBoYShvcGFjaXR5PTcwKTtvcGFjaXR5Oi43fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLWRyYWdnYWJsZSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXIgLnNjcm9sbC1lbGVtZW50X3NpemUsLnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudDpob3ZlciAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXIgLnNjcm9sbC1lbGVtZW50X3NpemV7b3BhY2l0eToxfS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLWRyYWdnYWJsZSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXIgLnNjcm9sbC1iYXIsLnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudDpob3ZlciAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXIgLnNjcm9sbC1iYXJ7aGVpZ2h0OjEwMCU7d2lkdGg6MTAwJTtib3JkZXItcmFkaXVzOjEycHh9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtZHJhZ2dhYmxlIC5zY3JvbGwtZWxlbWVudF9vdXRlciwuc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14OmhvdmVyIC5zY3JvbGwtZWxlbWVudF9vdXRlcntoZWlnaHQ6MjBweDttaW4taGVpZ2h0OjdweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1lbGVtZW50X291dGVyLC5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXk6aG92ZXIgLnNjcm9sbC1lbGVtZW50X291dGVye21pbi13aWR0aDo3cHg7d2lkdGg6MjBweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50IGRpdntib3JkZXI6bm9uZTttYXJnaW46MDtvdmVyZmxvdzpoaWRkZW47cGFkZGluZzowO3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTB9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50e2JhY2tncm91bmQtY29sb3I6I2ZmZn0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQgZGl2e2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7bGVmdDowO3RvcDowO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF90cmFja3tiYWNrZ3JvdW5kOiNmMWYxZjE7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRifS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteHtib3R0b206MDtoZWlnaHQ6MTZweDtsZWZ0OjA7bWluLXdpZHRoOjEwMCU7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXl7aGVpZ2h0OjEwMCU7bWluLWhlaWdodDoxMDAlO3JpZ2h0OjA7dG9wOjA7d2lkdGg6MTZweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZDlkOWQ5O2JvcmRlcjoxcHggc29saWQgI2JkYmRiZDtjdXJzb3I6ZGVmYXVsdDtib3JkZXItcmFkaXVzOjJweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXI6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojYzJjMmMyO2JvcmRlci1jb2xvcjojYTlhOWE5fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwtZHJhZ2dhYmxlIC5zY3JvbGwtYmFye2JhY2tncm91bmQtY29sb3I6IzkxOTE5MTtib3JkZXItY29sb3I6IzdlN2U3ZX0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZXtsZWZ0Oi0xNnB4O21hcmdpbi1sZWZ0OjE2cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1jb250ZW50LnNjcm9sbC1zY3JvbGx4X3Zpc2libGV7dG9wOi0xNnB4O21hcmdpbi10b3A6MTZweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1iYXJ7aGVpZ2h0OjhweDttaW4td2lkdGg6MTBweDt0b3A6M3B4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWJhcntsZWZ0OjNweDttaW4taGVpZ2h0OjEwcHg7d2lkdGg6OHB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7Ym9yZGVyLWxlZnQ6MXB4IHNvbGlkICNkYmRiZGJ9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtZWxlbWVudF90cmFja3toZWlnaHQ6MTRweDtsZWZ0Oi0zcHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtZWxlbWVudF9zaXple2hlaWdodDoxNHB4O2xlZnQ6LTRweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X291dGVye2JvcmRlci10b3A6MXB4IHNvbGlkICNkYmRiZGJ9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF90cmFja3t0b3A6LTNweDt3aWR0aDoxNHB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTRweDt3aWR0aDoxNHB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTE5cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi0xOXB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3tsZWZ0Oi0xOXB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3t0b3A6LTE5cHh9XFxuXCIgK1xuXCIvKipcXG5cIiArXG5cIiAqIE1pbmlmaWVkIHN0eWxlLlxcblwiICtcblwiICogT3JpZ2luYWwgZmlsZW5hbWU6IFxcXFxzcmNcXFxcc3R5bGVzXFxcXHN0eWxlLmNzc1xcblwiICtcblwiICovXFxuXCIgK1xuXCJALXdlYmtpdC1rZXlmcmFtZXMgc3BpbnsxMDAley13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpO3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKX19QGtleWZyYW1lcyBzcGluezEwMCV7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpfX0jZW1vdGUtbWVudS1idXR0b257YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCSUFBQUFRQ0FZQUFBQWJCaTljQUFBQUFYTlNSMElBcnM0YzZRQUFBQVJuUVUxQkFBQ3hqd3Y4WVFVQUFBQUpjRWhaY3dBQURzTUFBQTdEQWNkdnFHUUFBQUtVU1VSQlZEaFBmWlROaTFKUkdNWnZNSXNXVVp0czVTSVhGWUswQ01FL0lHZ2h4VkM3V1VvVTFOQml4SSttUlNENE1Rem14emlLTzNYVUJoUm1VR1pLZEJHNDBYRUdVNmQwR0ZHWmNUNHF4VzFoaTdmenZOd1pxS3dERDV6N3ZzL3Z1ZWVlZSs2Vk1KeE81d1VoaGR2dGZ1SHorVDR0TFMyTmhlZ2ZHc01ETHhpd0hJSWhMaTU3UEo3NVZDcjFZMzkvbjRiRElZMUdvNGxDRHg1NHdZQ1ZZempvVmpRYS9keHV0eWZDa3dTdllKcGdPU1FmNzA4dHVCYTF5V1J5L0wrVi9DbDR3WUJGaGhUeGZMaHVtL2VzaWlKMXUxMktSQ0prc1Zob2ZYMmRUazVPemtITVVVTVBIbmpCMkY1NVZwRWhQZGUvTGJ4OEZxQkVJa0hwZEpvTUJnTnB0VnJTNlhSVXFWVE9nN2EzdDJsbVpvYjBlajJwMVdyMmdnR0xET25KM1FTWkg0Y29Iby9UeXNvS2h5Z1VDdEpvTkZRc0Zta3dHTEF3UjdoU3FTU1ZTc1ZlTUdDUklUMjlGNmZYSmk4WHkrVXltYzFtbXA2ZUpvZkRRZlY2blU1UFQxbVkyKzEyN3VIeFNxVVNoNEZGaGhRTHZydnRjcm0rWXBrSEJ3ZFVyVlpwYTJ1TGFyVWFkVG9kT2p3OFpHR09HbnJ3d0FzR0xETHcxaTR1THJ6UlllT09qNDlwYjIrUGRuZDNxZFZxOFN0R0FJUTVhbzFHZ3ozd2dnR0xERDRDNGl6Y0VjV2ZSMGRIYk1ybGNyU3hzY0dialZBSUs4bG1zN1M1dWNtQi9YNmZYejlZRHNFUUZ6ZGpzVml0Mld6eXFjMWtNcndmVnF1VmpFWWp6YzNOa2Nsa0lwdk5SbXRyYSt5QlZ6QWZCWHREanVHZ1M4RmdjRmJjOFF2dWhqTlNLQlFvRkFxUjZMRkVuL0w1UFBmZ2dYZDVlWGtXckJ6RFFkQzFRQ0JnRm9ldXQ3T3p3L3R5QnAyRlF6aFB3dE9GRnd6WTM0WW80QTl3Ulh6ZEQ4TGhjRTQ4d25jRTlubzlGdWFvaWQ1NzRia1BMeGdaLzN1STVwVFFWZkZsUC9MNy9XbWhiN0pTWHEvM0lYcnd5SFo1U05JdkdDbnF5aCtKNytnQUFBQUFTVVZPUks1Q1lJST0pIWltcG9ydGFudDtiYWNrZ3JvdW5kLXBvc2l0aW9uOjUwJTtiYWNrZ3JvdW5kLXJlcGVhdDpuby1yZXBlYXQ7Y3Vyc29yOnBvaW50ZXI7bWFyZ2luLWxlZnQ6N3B4fSNlbW90ZS1tZW51LWJ1dHRvbi5hY3RpdmV7Ym9yZGVyLXJhZGl1czoycHg7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEyOCwxMjgsMTI4LC41KX0uZW1vdGUtbWVudXtwYWRkaW5nOjVweDt6LWluZGV4OjEwMDA7ZGlzcGxheTpub25lO2JhY2tncm91bmQtY29sb3I6IzIwMjAyMDtwb3NpdGlvbjpyZWxhdGl2ZX0uZW1vdGUtbWVudSBhe2NvbG9yOiNmZmZ9LmVtb3RlLW1lbnUgYTpob3ZlcntjdXJzb3I6cG9pbnRlcjt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO2NvbG9yOiNjY2N9LmVtb3RlLW1lbnUgLmVtb3Rlcy1zdGFycmVke2hlaWdodDozOHB4fS5lbW90ZS1tZW51IC5kcmFnZ2FibGV7YmFja2dyb3VuZC1pbWFnZTpyZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSAxMHB4KTtjdXJzb3I6bW92ZTtoZWlnaHQ6N3B4O21hcmdpbi1ib3R0b206M3B4fS5lbW90ZS1tZW51IC5kcmFnZ2FibGU6aG92ZXJ7YmFja2dyb3VuZC1pbWFnZTpyZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMSkgMTBweCl9LmVtb3RlLW1lbnUgLmhlYWRlci1pbmZve2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDA7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsLjA1KSBpbnNldDtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCh0byB0b3AsdHJhbnNwYXJlbnQscmdiYSgwLDAsMCwuNSkpO3BhZGRpbmc6MnB4O2NvbG9yOiNkZGQ7dGV4dC1hbGlnbjpjZW50ZXI7cG9zaXRpb246cmVsYXRpdmV9LmVtb3RlLW1lbnUgLmhlYWRlci1pbmZvIGltZ3ttYXJnaW4tcmlnaHQ6OHB4fS5lbW90ZS1tZW51IC5lbW90ZXtkaXNwbGF5OmlubGluZS1ibG9jaztwYWRkaW5nOjJweDttYXJnaW46MXB4O2N1cnNvcjpwb2ludGVyO2JvcmRlci1yYWRpdXM6NXB4O3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjMwcHg7aGVpZ2h0OjMwcHg7dHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO2JvcmRlcjoxcHggc29saWQgdHJhbnNwYXJlbnR9LmVtb3RlLW1lbnUuZWRpdGluZyAuZW1vdGV7Y3Vyc29yOmF1dG99LmVtb3RlLW1lbnUgLmVtb3RlIGltZ3ttYXgtd2lkdGg6MTAwJTttYXgtaGVpZ2h0OjEwMCU7bWFyZ2luOmF1dG87cG9zaXRpb246YWJzb2x1dGU7dG9wOjA7Ym90dG9tOjA7bGVmdDowO3JpZ2h0OjB9LmVtb3RlLW1lbnUgLnNpbmdsZS1yb3cgLmVtb3RlLWNvbnRhaW5lcntvdmVyZmxvdzpoaWRkZW47aGVpZ2h0OjM3cHh9LmVtb3RlLW1lbnUgLnNpbmdsZS1yb3cgLmVtb3Rle2Rpc3BsYXk6aW5saW5lLWJsb2NrO21hcmdpbi1ib3R0b206MTAwcHh9LmVtb3RlLW1lbnUgLmVtb3RlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwuMSl9LmVtb3RlLW1lbnUgLnB1bGwtbGVmdHtmbG9hdDpsZWZ0fS5lbW90ZS1tZW51IC5wdWxsLXJpZ2h0e2Zsb2F0OnJpZ2h0fS5lbW90ZS1tZW51IC5mb290ZXJ7dGV4dC1hbGlnbjpjZW50ZXI7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O3BhZGRpbmc6NXB4IDAgMnB4O21hcmdpbi10b3A6NXB4O2hlaWdodDoxOHB4fS5lbW90ZS1tZW51IC5mb290ZXIgLnB1bGwtbGVmdHttYXJnaW4tcmlnaHQ6NXB4fS5lbW90ZS1tZW51IC5mb290ZXIgLnB1bGwtcmlnaHR7bWFyZ2luLWxlZnQ6NXB4fS5lbW90ZS1tZW51IC5pY29ue2hlaWdodDoxNnB4O3dpZHRoOjE2cHg7b3BhY2l0eTouNTtiYWNrZ3JvdW5kLXNpemU6Y29udGFpbiFpbXBvcnRhbnR9LmVtb3RlLW1lbnUgLmljb246aG92ZXJ7b3BhY2l0eToxfS5lbW90ZS1tZW51IC5pY29uLWhvbWV7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlOalFpRFFvZ0lDQm9aV2xuYUhROUlqWTBJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJRFkwSURZMElnMEtJQ0FnYVdROUlrTmhjR0ZmTVNJTkNpQWdJSGh0YkRwemNHRmpaVDBpY0hKbGMyVnlkbVVpUGp4dFpYUmhaR0YwWVEwS0lDQWdhV1E5SW0xbGRHRmtZWFJoTXpBd01TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pJNU9Ua2lJQzgrRFFvOGNHRjBhQTBLSUNBZ1pEMGliU0ExTnk0d05qSXNNekV1TXprNElHTWdNQzQ1TXpJc0xURXVNREkxSURBdU9EUXlMQzB5TGpVNU5pQXRNQzR5TURFc0xUTXVOVEE0SUV3Z016TXVPRGcwTERjdU56ZzFJRU1nTXpJdU9EUXhMRFl1T0RjeklETXhMakUyT1N3MkxqZzVNaUF6TUM0eE5EZ3NOeTQ0TWpnZ1RDQTNMakE1TXl3eU9DNDVOaklnWXlBdE1TNHdNakVzTUM0NU16WWdMVEV1TURjeExESXVOVEExSUMwd0xqRXhNU3d6TGpVd015QnNJREF1TlRjNExEQXVOakF5SUdNZ01DNDVOVGtzTUM0NU9UZ2dNaTQxTURrc01TNHhNVGNnTXk0ME5pd3dMakkyTlNCc0lERXVOekl6TEMweExqVTBNeUIySURJeUxqVTVJR01nTUN3eExqTTROaUF4TGpFeU15d3lMalV3T0NBeUxqVXdPQ3d5TGpVd09DQm9JRGd1T1RnM0lHTWdNUzR6T0RVc01DQXlMalV3T0N3dE1TNHhNaklnTWk0MU1EZ3NMVEl1TlRBNElGWWdNemd1TlRjMUlHZ2dNVEV1TkRZeklIWWdNVFV1T0RBMElHTWdMVEF1TURJc01TNHpPRFVnTUM0NU56RXNNaTQxTURjZ01pNHpOVFlzTWk0MU1EY2dhQ0E1TGpVeU5DQmpJREV1TXpnMUxEQWdNaTQxTURnc0xURXVNVEl5SURJdU5UQTRMQzB5TGpVd09DQldJRE15TGpFd055QmpJREFzTUNBd0xqUTNOaXd3TGpReE55QXhMakEyTXl3d0xqa3pNeUF3TGpVNE5pd3dMalV4TlNBeExqZ3hOeXd3TGpFd01pQXlMamMwT1N3dE1DNDVNalFnYkNBd0xqWTFNeXd0TUM0M01UZ2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb01qazVOU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1abVptWTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6ND0pIDUwJSBuby1yZXBlYXR9LmVtb3RlLW1lbnUgLmljb24tZ2VhcntiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1qRXVOVGtpRFFvZ0lDQm9aV2xuYUhROUlqSXhMakV6TmprNU9TSU5DaUFnSUhacFpYZENiM2c5SWpBZ01DQXlNUzQxT1NBeU1TNHhNemNpRFFvZ0lDQnBaRDBpUTJGd1lWOHhJZzBLSUNBZ2VHMXNPbk53WVdObFBTSndjbVZ6WlhKMlpTSStQRzFsZEdGa1lYUmhEUW9nSUNCcFpEMGliV1YwWVdSaGRHRXpPU0krUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6TTNJaUF2UGcwS1BIQmhkR2dOQ2lBZ0lHUTlJazBnTVRndU5qSXlMRGd1TVRRMUlERTRMakEzTnl3MkxqZzFJR01nTUN3d0lERXVNalk0TEMweUxqZzJNU0F4TGpFMU5pd3RNaTQ1TnpFZ1RDQXhOeTQxTlRRc01pNHlOQ0JESURFM0xqUXpPQ3d5TGpFeU55QXhOQzQxTnpZc015NDBNek1nTVRRdU5UYzJMRE11TkRNeklFd2dNVE11TWpVMkxESXVPU0JESURFekxqSTFOaXd5TGprZ01USXVNRGtzTUNBeE1TNDVNeXd3SUVnZ09TNDFOakVnUXlBNUxqTTVOaXd3SURndU16RTNMREl1T1RBMklEZ3VNekUzTERJdU9UQTJJRXdnTmk0NU9Ua3NNeTQwTkRFZ1l5QXdMREFnTFRJdU9USXlMQzB4TGpJME1pQXRNeTR3TXpRc0xURXVNVE14SUV3Z01pNHlPRGtzTXk0NU5URWdReUF5TGpFM015dzBMakEyTkNBekxqVXdOeXcyTGpnMk55QXpMalV3Tnl3MkxqZzJOeUJNSURJdU9UWXlMRGd1TVRZZ1F5QXlMamsyTWl3NExqRTJJREFzT1M0ek1ERWdNQ3c1TGpRMU5TQjJJREl1TXpJeUlHTWdNQ3d3TGpFMk1pQXlMamsyT1N3eExqSXhPU0F5TGprMk9Td3hMakl4T1NCc0lEQXVOVFExTERFdU1qa3hJR01nTUN3d0lDMHhMakkyT0N3eUxqZzFPU0F0TVM0eE5UY3NNaTQ1TmprZ2JDQXhMalkzT0N3eExqWTBNeUJqSURBdU1URTBMREF1TVRFeElESXVPVGMzTEMweExqRTVOU0F5TGprM055d3RNUzR4T1RVZ2JDQXhMak15TVN3d0xqVXpOU0JqSURBc01DQXhMakUyTml3eUxqZzVPQ0F4TGpNeU55d3lMamc1T0NCb0lESXVNelk1SUdNZ01DNHhOalFzTUNBeExqSTBOQ3d0TWk0NU1EWWdNUzR5TkRRc0xUSXVPVEEySUd3Z01TNHpNaklzTFRBdU5UTTFJR01nTUN3d0lESXVPVEUyTERFdU1qUXlJRE11TURJNUxERXVNVE16SUd3Z01TNDJOemdzTFRFdU5qUXhJR01nTUM0eE1UY3NMVEF1TVRFMUlDMHhMakl5TEMweUxqa3hOaUF0TVM0eU1pd3RNaTQ1TVRZZ2JDQXdMalUwTkN3dE1TNHlPVE1nWXlBd0xEQWdNaTQ1TmpNc0xURXVNVFF6SURJdU9UWXpMQzB4TGpJNU9TQldJRGt1TXpZZ1F5QXlNUzQxT1N3NUxqRTVPU0F4T0M0Mk1qSXNPQzR4TkRVZ01UZ3VOakl5TERndU1UUTFJSG9nYlNBdE5DNHpOallzTWk0ME1qTWdZeUF3TERFdU9EWTNJQzB4TGpVMU15d3pMak00TnlBdE15NDBOakVzTXk0ek9EY2dMVEV1T1RBMkxEQWdMVE11TkRZeExDMHhMalV5SUMwekxqUTJNU3d0TXk0ek9EY2dNQ3d0TVM0NE5qY2dNUzQxTlRVc0xUTXVNemcxSURNdU5EWXhMQzB6TGpNNE5TQXhMamt3T1N3d0xqQXdNU0F6TGpRMk1Td3hMalV4T0NBekxqUTJNU3d6TGpNNE5TQjZJZzBLSUNBZ2FXUTlJbkJoZEdneklnMEtJQ0FnYzNSNWJHVTlJbVpwYkd3NkkwWkdSa1pHUmlJZ0x6NE5DanhuRFFvZ0lDQnBaRDBpWnpVaVBnMEtQQzluUGcwS1BHY05DaUFnSUdsa1BTSm5OeUkrRFFvOEwyYytEUW84WncwS0lDQWdhV1E5SW1jNUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekV4SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RXpJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFMUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekUzSWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RTVJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJeElqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekl6SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6STFJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJM0lqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekk1SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6TXhJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpNeklqNE5Dand2Wno0TkNqd3ZjM1puUGcwSykgNTAlIG5vLXJlcGVhdH0uZW1vdGUtbWVudS5lZGl0aW5nIC5pY29uLWdlYXJ7LXdlYmtpdC1hbmltYXRpb246c3BpbiA0cyBsaW5lYXIgaW5maW5pdGU7YW5pbWF0aW9uOnNwaW4gNHMgbGluZWFyIGluZmluaXRlfS5lbW90ZS1tZW51IC5pY29uLXJlc2l6ZS1oYW5kbGV7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVFlpRFFvZ0lDQm9aV2xuYUhROUlqRTJJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJREUySURFMklnMEtJQ0FnYVdROUlrTmhjR0ZmTVNJTkNpQWdJSGh0YkRwemNHRmpaVDBpY0hKbGMyVnlkbVVpUGp4dFpYUmhaR0YwWVEwS0lDQWdhV1E5SW0xbGRHRmtZWFJoTkRNMU55SStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pRek5UVWlJQzgrRFFvOGNHRjBhQTBLSUNBZ1pEMGlUU0F4TXk0MUxEZ2dReUF4TXk0eU1qVXNPQ0F4TXl3NExqSXlOQ0F4TXl3NExqVWdkaUF6TGpjNU15Qk1JRE11TnpBM0xETWdTQ0EzTGpVZ1F5QTNMamMzTml3eklEZ3NNaTQzTnpZZ09Dd3lMalVnT0N3eUxqSXlOQ0EzTGpjM05pd3lJRGN1TlN3eUlHZ2dMVFVnVENBeUxqTXdPU3d5TGpBek9TQXlMakUxTERJdU1UUTBJREl1TVRRMkxESXVNVFEySURJdU1UUXpMREl1TVRVeUlESXVNRE01TERJdU16QTVJRElzTWk0MUlIWWdOU0JESURJc055NDNOellnTWk0eU1qUXNPQ0F5TGpVc09DQXlMamMzTml3NElETXNOeTQzTnpZZ015dzNMalVnVmlBekxqY3dOeUJNSURFeUxqSTVNeXd4TXlCSUlEZ3VOU0JESURndU1qSTBMREV6SURnc01UTXVNakkxSURnc01UTXVOU0E0TERFekxqYzNOU0E0TGpJeU5Dd3hOQ0E0TGpVc01UUWdhQ0ExSUd3Z01DNHhPVEVzTFRBdU1ETTVJR01nTUM0eE1qRXNMVEF1TURVeElEQXVNaklzTFRBdU1UUTRJREF1TWpjc0xUQXVNamNnVENBeE5Dd3hNeTQxTURJZ1ZpQTRMalVnUXlBeE5DdzRMakl5TkNBeE15NDNOelVzT0NBeE15NDFMRGdnZWlJTkNpQWdJR2xrUFNKd1lYUm9ORE0xTVNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptWm1abVk3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejQ9KSA1MCUgbm8tcmVwZWF0O2N1cnNvcjpud3NlLXJlc2l6ZSFpbXBvcnRhbnR9LmVtb3RlLW1lbnUgLmljb24tcGlue2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTVRZaURRb2dJQ0JvWldsbmFIUTlJakUySWcwS0lDQWdhV1E5SW5OMlp6TXdNRFVpUGcwS0lDQThiV1YwWVdSaGRHRU5DaUFnSUNBZ2FXUTlJbTFsZEdGa1lYUmhNekF5TXlJK0RRb2dJQ0FnUEhKa1pqcFNSRVkrRFFvZ0lDQWdJQ0E4WTJNNlYyOXlhdzBLSUNBZ0lDQWdJQ0FnY21SbU9tRmliM1YwUFNJaVBnMEtJQ0FnSUNBZ0lDQThaR002Wm05eWJXRjBQbWx0WVdkbEwzTjJaeXQ0Yld3OEwyUmpPbVp2Y20xaGRENE5DaUFnSUNBZ0lDQWdQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJQ0FnY21SbU9uSmxjMjkxY21ObFBTSm9kSFJ3T2k4dmNIVnliQzV2Y21jdlpHTXZaR050YVhSNWNHVXZVM1JwYkd4SmJXRm5aU0lnTHo0TkNpQWdJQ0FnSUNBZ1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStEUW9nSUNBZ0lDQThMMk5qT2xkdmNtcytEUW9nSUNBZ1BDOXlaR1k2VWtSR1BnMEtJQ0E4TDIxbGRHRmtZWFJoUGcwS0lDQThaR1ZtY3cwS0lDQWdJQ0JwWkQwaVpHVm1jek13TWpFaUlDOCtEUW9nSUR4bkRRb2dJQ0FnSUhSeVlXNXpabTl5YlQwaWJXRjBjbWw0S0RBdU56a3pNRGM0TWl3d0xEQXNNQzQzT1RNd056Z3lMQzB5TGpFM01EazROU3d0T0RFMExqWTVNams1S1NJTkNpQWdJQ0FnYVdROUltY3pNREEzSWo0TkNpQWdJQ0E4WncwS0lDQWdJQ0FnSUhSeVlXNXpabTl5YlQwaWJXRjBjbWw0S0RBdU56QTNNVEVzTUM0M01EY3hNU3d0TUM0M01EY3hNU3d3TGpjd056RXhMRGN6Tnk0M01EYzFOU3d5T1RVdU5EZzRNRGdwSWcwS0lDQWdJQ0FnSUdsa1BTSm5NekF3T1NJK0RRb2dJQ0FnSUNBOFp3MEtJQ0FnSUNBZ0lDQWdhV1E5SW1jek56VTFJajROQ2lBZ0lDQWdJQ0FnUEhCaGRHZ05DaUFnSUNBZ0lDQWdJQ0FnWkQwaVRTQTVMamM0TVRJMUxEQWdReUE1TGpRM05EQTFOaklzTUM0Mk9Ea3hNVElnT1M0MU1qQTJPQ3d4TGpVeU16QTROVE1nT1M0ek1USTFMREl1TVRnM05TQk1JRFF1T1RNM05TdzJMalU1TXpjMUlFTWdNeTQ1TlRnNU5qQTRMRFl1TkRJNU5EZ3pJREl1T1RRM056VTBPQ3cyTGpVek1qYzRPVGtnTWl3MkxqZ3hNalVnVENBMUxqQXpNVEkxTERrdU9EUXpOelVnTUM0MU5qSTFMREUwTGpNeE1qVWdNQ3d4TmlCRElEQXVOVFk1TWprMk1qZ3NNVFV1TnprMU5qSTJJREV1TVRZM056TTNPQ3d4TlM0Mk5EQXlNemNnTVM0M01UZzNOU3d4TlM0ME1EWXlOU0JNSURZdU1UVTJNalVzTVRBdU9UWTROelVnT1M0eE9EYzFMREUwSUdNZ01DNHlOemsyT0RJekxDMHdMamswTnpjNE15QXdMak00TXpFMU1qZ3NMVEV1T1RVNE9UTTNJREF1TWpFNE56VXNMVEl1T1RNM05TQXhMalV3TURBeE1Td3RNUzQwT0RrMU56azRJRE11TURBd01EQXhMQzB5TGprM09URTFPU0EwTGpVc0xUUXVORFk0TnpVZ01DNDJNREV4TURJc0xUQXVNRE14TXpZeElERXVPREl5TVRNNExDMHdMakE1TmpFek55QXlMQzB3TGpRMk9EYzFJRU1nTVRNdU9EYzVPRGt5TERRdU1EWTVORGd3TXlBeE1TNDROREk0TmpVc01pNHdNakF5TWpneUlEa3VOemd4TWpVc01DQjZJZzBLSUNBZ0lDQWdJQ0FnSUNCMGNtRnVjMlp2Y20wOUltMWhkSEpwZUNnd0xqZzVNVFU1TXpjMExDMHdMamc1TVRVNU16YzBMREF1T0RreE5Ua3pOelFzTUM0NE9URTFPVE0zTkN3dE1pNHlOalUxTERFd016Y3VNVE0wTlNraURRb2dJQ0FnSUNBZ0lDQWdJR2xrUFNKd1lYUm9NekF4TVNJTkNpQWdJQ0FnSUNBZ0lDQWdjM1I1YkdVOUltWnBiR3c2STJabVptWm1aanRtYVd4c0xXOXdZV05wZEhrNk1TSWdMejROQ2lBZ0lDQWdJRHd2Wno0TkNpQWdJQ0E4TDJjK0RRb2dJRHd2Wno0TkNqd3ZjM1puUGcwSykgNTAlIG5vLXJlcGVhdDt0cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2V9LmVtb3RlLW1lbnUgLmljb24tcGluOmhvdmVyLC5lbW90ZS1tZW51LnBpbm5lZCAuaWNvbi1waW57LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO29wYWNpdHk6MX0uZW1vdGUtbWVudSAuZWRpdC10b29se2JhY2tncm91bmQtcG9zaXRpb246NTAlO2JhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdDtiYWNrZ3JvdW5kLXNpemU6MTRweDtib3JkZXItcmFkaXVzOjRweDtib3JkZXI6MXB4IHNvbGlkICMwMDA7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpub25lO2hlaWdodDoxNHB4O29wYWNpdHk6LjI1O3Bvc2l0aW9uOmFic29sdXRlO3RyYW5zaXRpb246YWxsIC4yNXMgZWFzZTt3aWR0aDoxNHB4O3otaW5kZXg6MX0uZW1vdGUtbWVudSAuZWRpdC10b29sOmhvdmVyLC5lbW90ZS1tZW51IC5lbW90ZTpob3ZlciAuZWRpdC10b29se29wYWNpdHk6MX0uZW1vdGUtbWVudSAuZWRpdC12aXNpYmlsaXR5e2JhY2tncm91bmQtY29sb3I6IzAwYzgwMDtiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1UQXdJZzBLSUNBZ2FHVnBaMmgwUFNJeE1EQWlEUW9nSUNCMmFXVjNRbTk0UFNJd0lEQWdNVEF3SURFd01DSU5DaUFnSUdsa1BTSk1ZWGxsY2w4eElnMEtJQ0FnZUcxc09uTndZV05sUFNKd2NtVnpaWEoyWlNJK1BHMWxkR0ZrWVhSaERRb2dJQ0JwWkQwaWJXVjBZV1JoZEdFNUlqNDhjbVJtT2xKRVJqNDhZMk02VjI5eWF3MEtJQ0FnSUNBZ0lISmtaanBoWW05MWREMGlJajQ4WkdNNlptOXliV0YwUG1sdFlXZGxMM04yWnl0NGJXdzhMMlJqT21admNtMWhkRDQ4WkdNNmRIbHdaUTBLSUNBZ0lDQWdJQ0FnY21SbU9uSmxjMjkxY21ObFBTSm9kSFJ3T2k4dmNIVnliQzV2Y21jdlpHTXZaR050YVhSNWNHVXZVM1JwYkd4SmJXRm5aU0lnTHo0OFpHTTZkR2wwYkdVK1BDOWtZenAwYVhSc1pUNDhMMk5qT2xkdmNtcytQQzl5WkdZNlVrUkdQand2YldWMFlXUmhkR0UrUEdSbFpuTU5DaUFnSUdsa1BTSmtaV1p6TnlJZ0x6NE5Danh3WVhSb0RRb2dJQ0JrUFNKTklEazNMamsyTkN3ME5pNDFORGdnUXlBNU55NHdPVGdzTkRVdU5USTRJRGMyTGpReU55d3lNUzQyTURNZ05UQXNNakV1TmpBeklHTWdMVEkyTGpReU55d3dJQzAwTnk0d09UZ3NNak11T1RJMUlDMDBOeTQ1TmpVc01qUXVPVFEySUMweExqY3dNU3d5SUMweExqY3dNU3cwTGprd01pQXhNR1V0TkN3Mkxqa3dNeUF3TGpnMk5pd3hMakF5SURJeExqVXpOeXd5TkM0NU5EVWdORGN1T1RZMExESTBMamswTlNBeU5pNDBNamNzTUNBME55NHdPVGdzTFRJekxqa3lOaUEwTnk0NU5qVXNMVEkwTGprME5pQXhMamN3TVN3dE1pQXhMamN3TVN3dE5DNDVNRElnTFRBdU1EQXhMQzAyTGprd015QjZJRTBnTlRndU1EY3pMRE0xTGprM05TQmpJREV1TnpjM0xDMHdMamszSURRdU1qVTFMREF1TVRReklEVXVOVE0wTERJdU5EZzFJREV1TWpjNUxESXVNelF6SURBdU9EYzFMRFV1TURJNUlDMHdMamt3TWl3MUxqazVPU0F0TVM0M056Y3NNQzQ1TnpFZ0xUUXVNalUxTEMwd0xqRTBNeUF0TlM0MU16VXNMVEl1TkRnMUlDMHhMakkzT1N3dE1pNHpORE1nTFRBdU9EYzFMQzAxTGpBeU9TQXdMamt3TXl3dE5TNDVPVGtnZWlCTklEVXdMRFk1TGpjeU9TQkRJRE14TGpVMExEWTVMamN5T1NBeE5pNHdNRFVzTlRVdU5UVXpJREV3TGpZeU9DdzFNQ0F4TkM0eU5Ua3NORFl1TWpRNUlESXlMalV5Tml3ek9DNDFOekVnTXpNdU1UazFMRE16TGprM09TQXpNUzR4TVRRc016Y3VNVFExSURJNUxqZzVOQ3cwTUM0NU1qZ2dNamt1T0RrMExEUTFJR01nTUN3eE1TNHhNRFFnT1M0d01ERXNNakF1TVRBMUlESXdMakV3TlN3eU1DNHhNRFVnTVRFdU1UQTBMREFnTWpBdU1UQTJMQzA1TGpBd01TQXlNQzR4TURZc0xUSXdMakV3TlNBd0xDMDBMakEzTWlBdE1TNHlNVGtzTFRjdU9EVTFJQzB6TGpNc0xURXhMakF5TVNCRElEYzNMalEzTkN3ek9DNDFOeklnT0RVdU56UXhMRFEyTGpJMUlEZzVMak0zTWl3MU1DQTRNeTQ1T1RVc05UVXVOVFUxSURZNExqUTJMRFk1TGpjeU9TQTFNQ3cyT1M0M01qa2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb015SWdMejROQ2p3dmMzWm5QZz09KX0uZW1vdGUtbWVudSAuZWRpdC1zdGFycmVke2JhY2tncm91bmQtY29sb3I6IzMyMzIzMjtiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU5UQWlEUW9nSUNCb1pXbG5hSFE5SWpVd0lnMEtJQ0FnZG1sbGQwSnZlRDBpTUNBd0lEVXdJRFV3SWcwS0lDQWdhV1E5SWt4aGVXVnlYekVpRFFvZ0lDQjRiV3c2YzNCaFkyVTlJbkJ5WlhObGNuWmxJajQ4YldWMFlXUmhkR0VOQ2lBZ0lHbGtQU0p0WlhSaFpHRjBZVE13TURFaVBqeHlaR1k2VWtSR1BqeGpZenBYYjNKckRRb2dJQ0FnSUNBZ2NtUm1PbUZpYjNWMFBTSWlQanhrWXpwbWIzSnRZWFErYVcxaFoyVXZjM1puSzNodGJEd3ZaR002Wm05eWJXRjBQanhrWXpwMGVYQmxEUW9nSUNBZ0lDQWdJQ0J5WkdZNmNtVnpiM1Z5WTJVOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWtZMjFwZEhsd1pTOVRkR2xzYkVsdFlXZGxJaUF2UGp4a1l6cDBhWFJzWlQ0OEwyUmpPblJwZEd4bFBqd3ZZMk02VjI5eWF6NDhMM0prWmpwU1JFWStQQzl0WlhSaFpHRjBZVDQ4WkdWbWN3MEtJQ0FnYVdROUltUmxabk15T1RrNUlpQXZQZzBLUEhCaGRHZ05DaUFnSUdROUltMGdORE11TURRc01qSXVOamsySUMwM0xqVTJPQ3czTGpNM055QXhMamM0Tnl3eE1DNDBNVGNnWXlBd0xqRXlOeXd3TGpjMUlDMHdMakU0TWl3eExqVXdPU0F0TUM0M09UY3NNUzQ1TlRjZ0xUQXVNelE0TERBdU1qVXpJQzB3TGpjMk1pd3dMak00TWlBdE1TNHhOellzTUM0ek9ESWdMVEF1TXpFNExEQWdMVEF1TmpNNExDMHdMakEzTmlBdE1DNDVNekVzTFRBdU1qTWdUQ0F5TlN3ek55NDJPREVnTVRVdU5qUTFMRFF5TGpVNU9TQmpJQzB3TGpZM05Dd3dMak0xTlNBdE1TNDBPU3d3TGpJNU5TQXRNaTR4TURjc0xUQXVNVFV4SUVNZ01USXVPVEl6TERReUlERXlMall4TkN3ME1TNHlORElnTVRJdU56UXpMRFF3TGpRNU1TQk1JREUwTGpVekxETXdMakEzTkNBMkxqazJNaXd5TWk0Mk9UY2dReUEyTGpReE5Td3lNaTR4TmpZZ05pNHlNakVzTWpFdU16Y3hJRFl1TkRVMExESXdMalkwTnlBMkxqWTVMREU1TGpreU15QTNMak14TlN3eE9TNHpPVFlnT0M0d05qa3NNVGt1TWpnMklHd2dNVEF1TkRVNUxDMHhMalV5TVNBMExqWTRMQzA1TGpRM09DQkRJREl6TGpVME15dzNMall3TXlBeU5DNHlNemtzTnk0eE56RWdNalVzTnk0eE56RWdZeUF3TGpjMk15d3dJREV1TkRVMkxEQXVORE15SURFdU56a3pMREV1TVRFMUlHd2dOQzQyTnprc09TNDBOemdnTVRBdU5EWXhMREV1TlRJeElHTWdNQzQzTlRJc01DNHhNRGtnTVM0ek56a3NNQzQyTXpjZ01TNDJNVElzTVM0ek5qRWdNQzR5TXpjc01DNDNNalFnTUM0d016Z3NNUzQxTVRrZ0xUQXVOVEExTERJdU1EVWdlaUlOQ2lBZ0lHbGtQU0p3WVhSb01qazVOU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5qWTJOalkyTTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6NE5DZz09KX0uZW1vdGUtbWVudSAuZW1vdGU+LmVkaXQtdmlzaWJpbGl0eXtib3R0b206YXV0bztsZWZ0OmF1dG87cmlnaHQ6MDt0b3A6MH0uZW1vdGUtbWVudSAuZW1vdGU+LmVkaXQtc3RhcnJlZHtib3R0b206YXV0bztsZWZ0OjA7cmlnaHQ6YXV0bzt0b3A6MH0uZW1vdGUtbWVudSAuaGVhZGVyLWluZm8+LmVkaXQtdG9vbHttYXJnaW4tbGVmdDo1cHh9LmVtb3RlLW1lbnUuZWRpdGluZyAuZWRpdC10b29se2Rpc3BsYXk6aW5saW5lLWJsb2NrfS5lbW90ZS1tZW51IC5lbW90ZS1tZW51LWhpZGRlbiAuZWRpdC12aXNpYmlsaXR5e2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTVRBd0lnMEtJQ0FnYUdWcFoyaDBQU0l4TURBaURRb2dJQ0IyYVdWM1FtOTRQU0l3SURBZ01UQXdJREV3TUNJTkNpQWdJR2xrUFNKTVlYbGxjbDh6SWcwS0lDQWdlRzFzT25Od1lXTmxQU0p3Y21WelpYSjJaU0krUEcxbGRHRmtZWFJoRFFvZ0lDQnBaRDBpYldWMFlXUmhkR0V4TlNJK1BISmtaanBTUkVZK1BHTmpPbGR2Y21zTkNpQWdJQ0FnSUNCeVpHWTZZV0p2ZFhROUlpSStQR1JqT21admNtMWhkRDVwYldGblpTOXpkbWNyZUcxc1BDOWtZenBtYjNKdFlYUStQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK1BDOWpZenBYYjNKclBqd3ZjbVJtT2xKRVJqNDhMMjFsZEdGa1lYUmhQanhrWldaekRRb2dJQ0JwWkQwaVpHVm1jekV6SWlBdlBnMEtQR2NOQ2lBZ0lHbGtQU0puTXlJK0RRb0pQSEJoZEdnTkNpQWdJR1E5SWswZ056QXVNRGd5TERRMUxqUTNOU0ExTUM0ME56UXNOalV1TURneUlFTWdOakV1TVRrNExEWTBMamd6TVNBMk9TNDRNekVzTlRZdU1UazNJRGN3TGpBNE1pdzBOUzQwTnpVZ2VpSU5DaUFnSUdsa1BTSndZWFJvTlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lOR1JrWkdSa1lpSUM4K0RRb0pQSEJoZEdnTkNpQWdJR1E5SW0wZ09UY3VPVFkwTERRMkxqVTBPQ0JqSUMwd0xqUTFMQzB3TGpVeU9TQXROaTR5TkRVc0xUY3VNak1nTFRFMUxqUXdNeXd0TVRNdU5UVTBJR3dnTFRZdU1pdzJMaklnUXlBNE1pNHpOVEVzTkRNdU1UUTRJRGcyTGpreUxEUTNMalEyT1NBNE9TNHpOeklzTlRBZ09ETXVPVGsxTERVMUxqVTFOU0EyT0M0ME5pdzJPUzQzTWprZ05UQXNOamt1TnpJNUlHTWdMVEV1TXpNMExEQWdMVEl1TmpVeExDMHdMakE0TWlBdE15NDVOVElzTFRBdU1qSXlJR3dnTFRjdU5ETTVMRGN1TkRNNUlHTWdNeTQyTXprc01DNDVNRGtnTnk0ME5Ea3NNUzQwTlNBeE1TNHpPVEVzTVM0ME5TQXlOaTQwTWpjc01DQTBOeTR3T1Rnc0xUSXpMamt5TmlBME55NDVOalVzTFRJMExqazBOaUF4TGpjd01Td3RNUzQ1T1RrZ01TNDNNREVzTFRRdU9UQXhJQzB3TGpBd01Td3ROaTQ1TURJZ2VpSU5DaUFnSUdsa1BTSndZWFJvTnlJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lOR1JrWkdSa1lpSUM4K0RRb0pQSEJoZEdnTkNpQWdJR1E5SW0wZ09URXVOREV4TERFMkxqWTJJR01nTUN3dE1DNHlOallnTFRBdU1UQTFMQzB3TGpVeUlDMHdMakk1TXl3dE1DNDNNRGNnYkNBdE55NHdOekVzTFRjdU1EY2dZeUF0TUM0ek9URXNMVEF1TXpreElDMHhMakF5TXl3dE1DNHpPVEVnTFRFdU5ERTBMREFnVENBMk5pNDRNRFFzTWpRdU56RXhJRU1nTmpFdU5qQXlMREl5TGpneE9DQTFOUzQ1TkRrc01qRXVOakF6SURVd0xESXhMall3TXlCaklDMHlOaTQwTWpjc01DQXRORGN1TURrNExESXpMamt5TmlBdE5EY3VPVFkxTERJMExqazBOaUF0TVM0M01ERXNNaUF0TVM0M01ERXNOQzQ1TURJZ01UQmxMVFFzTmk0NU1ETWdNQzQxTVRjc01DNDJNRGNnT0M0d09ETXNPUzR6TlRRZ01Ua3VOekEzTERFMkxqTXlJRXdnT0M0NE9ETXNPREl1TmpNeUlFTWdPQzQyT1RVc09ESXVPRElnT0M0MU9TdzRNeTR3TnpNZ09DNDFPU3c0TXk0ek16a2dZeUF3TERBdU1qWTJJREF1TVRBMUxEQXVOVElnTUM0eU9UTXNNQzQzTURjZ2JDQTNMakEzTVN3M0xqQTNJR01nTUM0eE9UVXNNQzR4T1RVZ01DNDBOVEVzTUM0eU9UTWdNQzQzTURjc01DNHlPVE1nTUM0eU5UWXNNQ0F3TGpVeE1pd3RNQzR3T1RnZ01DNDNNRGNzTFRBdU1qa3pJR3dnTnpNdU56VXNMVGN6TGpjMUlHTWdNQzR4T0Rjc0xUQXVNVGcySURBdU1qa3pMQzB3TGpRMElEQXVNamt6TEMwd0xqY3dOaUI2SUUwZ01UQXVOakk0TERVd0lFTWdNVFF1TWpVNUxEUTJMakkwT1NBeU1pNDFNallzTXpndU5UY3hJRE16TGpFNU5Td3pNeTQ1TnprZ016RXVNVEUwTERNM0xqRTBOU0F5T1M0NE9UUXNOREF1T1RJNElESTVMamc1TkN3ME5TQmpJREFzTkM0Mk5qVWdNUzQyTURFc09DNDVORFVnTkM0eU55d3hNaTR6TlRFZ1RDQXlPQzR3TkN3Mk15NDBOelVnUXlBeE9TNDRPRGdzTlRndU9UVTFJREV6TGpZME9TdzFNeTR4TWlBeE1DNDJNamdzTlRBZ2VpSU5DaUFnSUdsa1BTSndZWFJvT1NJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lOR1JrWkdSa1lpSUM4K0RRbzhMMmMrRFFvOEwzTjJaejROQ2c9PSk7YmFja2dyb3VuZC1jb2xvcjpyZWR9LmVtb3RlLW1lbnUgLmVtb3RlLW1lbnUtc3RhcnJlZCAuZWRpdC1zdGFycmVke2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTlRBaURRb2dJQ0JvWldsbmFIUTlJalV3SWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURVd0lEVXdJZzBLSUNBZ2FXUTlJa3hoZVdWeVh6RWlEUW9nSUNCNGJXdzZjM0JoWTJVOUluQnlaWE5sY25abElqNDhiV1YwWVdSaGRHRU5DaUFnSUdsa1BTSnRaWFJoWkdGMFlUTXdNREVpUGp4eVpHWTZVa1JHUGp4all6cFhiM0pyRFFvZ0lDQWdJQ0FnY21SbU9tRmliM1YwUFNJaVBqeGtZenBtYjNKdFlYUSthVzFoWjJVdmMzWm5LM2h0YkR3dlpHTTZabTl5YldGMFBqeGtZenAwZVhCbERRb2dJQ0FnSUNBZ0lDQnlaR1k2Y21WemIzVnlZMlU5SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5a1kyMXBkSGx3WlM5VGRHbHNiRWx0WVdkbElpQXZQanhrWXpwMGFYUnNaVDQ4TDJSak9uUnBkR3hsUGp3dlkyTTZWMjl5YXo0OEwzSmtaanBTUkVZK1BDOXRaWFJoWkdGMFlUNDhaR1ZtY3cwS0lDQWdhV1E5SW1SbFpuTXlPVGs1SWlBdlBnMEtQSEJoZEdnTkNpQWdJR1E5SW0wZ05ETXVNRFFzTWpJdU5qazJJQzAzTGpVMk9DdzNMak0zTnlBeExqYzROeXd4TUM0ME1UY2dZeUF3TGpFeU55d3dMamMxSUMwd0xqRTRNaXd4TGpVd09TQXRNQzQzT1Rjc01TNDVOVGNnTFRBdU16UTRMREF1TWpVeklDMHdMamMyTWl3d0xqTTRNaUF0TVM0eE56WXNNQzR6T0RJZ0xUQXVNekU0TERBZ0xUQXVOak00TEMwd0xqQTNOaUF0TUM0NU16RXNMVEF1TWpNZ1RDQXlOU3d6Tnk0Mk9ERWdNVFV1TmpRMUxEUXlMalU1T1NCaklDMHdMalkzTkN3d0xqTTFOU0F0TVM0ME9Td3dMakk1TlNBdE1pNHhNRGNzTFRBdU1UVXhJRU1nTVRJdU9USXpMRFF5SURFeUxqWXhOQ3cwTVM0eU5ESWdNVEl1TnpRekxEUXdMalE1TVNCTUlERTBMalV6TERNd0xqQTNOQ0EyTGprMk1pd3lNaTQyT1RjZ1F5QTJMalF4TlN3eU1pNHhOallnTmk0eU1qRXNNakV1TXpjeElEWXVORFUwTERJd0xqWTBOeUEyTGpZNUxERTVMamt5TXlBM0xqTXhOU3d4T1M0ek9UWWdPQzR3Tmprc01Ua3VNamcySUd3Z01UQXVORFU1TEMweExqVXlNU0EwTGpZNExDMDVMalEzT0NCRElESXpMalUwTXl3M0xqWXdNeUF5TkM0eU16a3NOeTR4TnpFZ01qVXNOeTR4TnpFZ1l5QXdMamMyTXl3d0lERXVORFUyTERBdU5ETXlJREV1TnprekxERXVNVEUxSUd3Z05DNDJOemtzT1M0ME56Z2dNVEF1TkRZeExERXVOVEl4SUdNZ01DNDNOVElzTUM0eE1Ea2dNUzR6Tnprc01DNDJNemNnTVM0Mk1USXNNUzR6TmpFZ01DNHlNemNzTUM0M01qUWdNQzR3TXpnc01TNDFNVGtnTFRBdU5UQTFMREl1TURVZ2VpSU5DaUFnSUdsa1BTSndZWFJvTWprNU5TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTm1abU5qTURBN1ptbHNiQzF2Y0dGamFYUjVPakVpSUM4K0RRbzhMM04yWno0TkNnPT0pfS5lbW90ZS1tZW51IC5lbW90ZS5lbW90ZS1tZW51LXN0YXJyZWR7Ym9yZGVyLWNvbG9yOnJnYmEoMjAwLDIwMCwwLC41KX0uZW1vdGUtbWVudSAuZW1vdGUuZW1vdGUtbWVudS1oaWRkZW57Ym9yZGVyLWNvbG9yOnJnYmEoMjU1LDAsMCwuNSl9LmVtb3RlLW1lbnUgI3N0YXJyZWQtZW1vdGVzLWdyb3VwIC5lbW90ZTpub3QoLmVtb3RlLW1lbnUtc3RhcnJlZCksLmVtb3RlLW1lbnU6bm90KC5lZGl0aW5nKSAuZW1vdGUtbWVudS1oaWRkZW57ZGlzcGxheTpub25lfS5lbW90ZS1tZW51Om5vdCguZWRpdGluZykgI3N0YXJyZWQtZW1vdGVzLWdyb3VwIC5lbW90ZS1tZW51LXN0YXJyZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50fS5lbW90ZS1tZW51ICNzdGFycmVkLWVtb3Rlcy1ncm91cHt0ZXh0LWFsaWduOmNlbnRlcjtjb2xvcjojNjQ2NDY0fS5lbW90ZS1tZW51ICNzdGFycmVkLWVtb3Rlcy1ncm91cDplbXB0eTpiZWZvcmV7Y29udGVudDpcXFwiVXNlIHRoZSBlZGl0IG1vZGUgdG8gc3RhciBhbiBlbW90ZSFcXFwiO3Bvc2l0aW9uOnJlbGF0aXZlO3RvcDo4cHh9LmVtb3RlLW1lbnUgLnNjcm9sbGFibGV7aGVpZ2h0OmNhbGMoMTAwJSAtIDEwMXB4KTtvdmVyZmxvdy15OmF1dG99LmVtb3RlLW1lbnUgLnN0aWNreXtwb3NpdGlvbjphYnNvbHV0ZTtib3R0b206MDt3aWR0aDoxMDAlfS5lbW90ZS1tZW51IC5lbW90ZS1tZW51LWlubmVye3Bvc2l0aW9uOnJlbGF0aXZlO21heC1oZWlnaHQ6MTAwJTtoZWlnaHQ6MTAwJX1cIikpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIEhvZ2FuID0gcmVxdWlyZSgnaG9nYW4uanMvbGliL3RlbXBsYXRlLmpzJyk7XG4gICAgdmFyIHRlbXBsYXRlcyA9IHt9O1xuICAgIHRlbXBsYXRlc1snZW1vdGUnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZW1vdGVcIik7aWYodC5zKHQuZihcInRoaXJkUGFydHlcIixjLHAsMSksYyxwLDAsMzIsNDQsXCJ7eyB9fVwiKSl7dC5ycyhjLHAsZnVuY3Rpb24oYyxwLHQpe3QuYihcIiB0aGlyZC1wYXJ0eVwiKTt9KTtjLnBvcCgpO31pZighdC5zKHQuZihcImlzVmlzaWJsZVwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe3QuYihcIiBlbW90ZS1tZW51LWhpZGRlblwiKTt9O2lmKHQucyh0LmYoXCJpc1N0YXJyZWRcIixjLHAsMSksYyxwLDAsMTE5LDEzOCxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIGVtb3RlLW1lbnUtc3RhcnJlZFwiKTt9KTtjLnBvcCgpO310LmIoXCJcXFwiIGRhdGEtZW1vdGU9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiIHRpdGxlPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7aWYodC5zKHQuZihcInRoaXJkUGFydHlcIixjLHAsMSksYyxwLDAsMjA2LDIyOSxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIChmcm9tIDNyZCBwYXJ0eSBhZGRvbilcIik7fSk7Yy5wb3AoKTt9dC5iKFwiXFxcIj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxpbWcgc3JjPVxcXCJcIik7dC5iKHQudCh0LmYoXCJ1cmxcIixjLHAsMCkpKTt0LmIoXCJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZWRpdC10b29sIGVkaXQtc3RhcnJlZFxcXCIgZGF0YS13aGljaD1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtc3RhcnJlZFxcXCIgdGl0bGU9XFxcIlN0YXIvdW5zdGFyIGVtb3RlOiBcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDxkaXYgY2xhc3M9XFxcImVkaXQtdG9vbCBlZGl0LXZpc2liaWxpdHlcXFwiIGRhdGEtd2hpY2g9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLXZpc2liaWxpdHlcXFwiIHRpdGxlPVxcXCJIaWRlL3Nob3cgZW1vdGU6IFwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ2Vtb3RlQnV0dG9uJ10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIjxidXR0b24gY2xhc3M9XFxcImJ1dHRvbiBnbHlwaC1vbmx5IGZsb2F0LWxlZnRcXFwiIHRpdGxlPVxcXCJFbW90ZSBNZW51XFxcIiBpZD1cXFwiZW1vdGUtbWVudS1idXR0b25cXFwiPjwvYnV0dG9uPlxcclwiKTt0LmIoXCJcXG5cIik7cmV0dXJuIHQuZmwoKTsgfSxwYXJ0aWFsczoge30sIHN1YnM6IHsgIH19KTtcbiAgICB0ZW1wbGF0ZXNbJ2Vtb3RlR3JvdXBIZWFkZXInXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGRpdiBjbGFzcz1cXFwiZ3JvdXAtaGVhZGVyXFxcIiBkYXRhLWVtb3RlLWNoYW5uZWw9XFxcIlwiKTt0LmIodC52KHQuZihcImNoYW5uZWxcIixjLHAsMCkpKTt0LmIoXCJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiaGVhZGVyLWluZm9cXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8aW1nIHNyYz1cXFwiXCIpO3QuYih0LnYodC5mKFwiYmFkZ2VcIixjLHAsMCkpKTt0LmIoXCJcXFwiIC8+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFwiKTt0LmIodC52KHQuZihcImNoYW5uZWxEaXNwbGF5TmFtZVwiLGMscCwwKSkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8ZGl2IGNsYXNzPVxcXCJlZGl0LXRvb2wgZWRpdC12aXNpYmlsaXR5XFxcIiBkYXRhLXdoaWNoPVxcXCJjaGFubmVsLVwiKTt0LmIodC52KHQuZihcImNoYW5uZWxcIixjLHAsMCkpKTt0LmIoXCJcXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLXZpc2liaWxpdHlcXFwiIHRpdGxlPVxcXCJIaWRlL3Nob3cgY3VycmVudCBlbW90ZXMgZm9yIFwiKTt0LmIodC52KHQuZihcImNoYW5uZWxEaXNwbGF5TmFtZVwiLGMscCwwKSkpO3QuYihcIiAobm90ZTogbmV3IGVtb3RlcyB3aWxsIHN0aWxsIHNob3cgdXAgaWYgdGhleSBhcmUgYWRkZWQpXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZW1vdGUtY29udGFpbmVyXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWydtZW51J10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIjxkaXYgY2xhc3M9XFxcImVtb3RlLW1lbnVcXFwiIGlkPVxcXCJlbW90ZS1tZW51LWZvci10d2l0Y2hcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZW1vdGUtbWVudS1pbm5lclxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcImRyYWdnYWJsZVxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcInNjcm9sbGFibGUgc2Nyb2xsYmFyLW1hY29zeFxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtY29udGFpbmVyXFxcIiBpZD1cXFwiYWxsLWVtb3Rlcy1ncm91cFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8ZGl2IGNsYXNzPVxcXCJzdGlja3lcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdDxkaXYgY2xhc3M9XFxcImdyb3VwLWhlYWRlciBzaW5nbGUtcm93XFxcIiBpZD1cXFwic3RhcnJlZC1lbW90ZXMtZ3JvdXBcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiaGVhZGVyLWluZm9cXFwiPkZhdm9yaXRlIEVtb3RlczwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiZW1vdGUtY29udGFpbmVyXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHQ8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJmb290ZXJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGEgY2xhc3M9XFxcInB1bGwtbGVmdCBpY29uIGljb24taG9tZVxcXCIgaHJlZj1cXFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlc1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiIHRpdGxlPVxcXCJWaXNpdCB0aGUgaG9tZXBhZ2Ugd2hlcmUgeW91IGNhbiBkb25hdGUsIHBvc3QgYSByZXZpZXcsIG9yIGNvbnRhY3QgdGhlIGRldmVsb3BlclxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGEgY2xhc3M9XFxcInB1bGwtbGVmdCBpY29uIGljb24tZ2VhclxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtZWRpdGluZ1xcXCIgdGl0bGU9XFxcIlRvZ2dsZSBlZGl0IG1vZGVcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHRcdDxhIGNsYXNzPVxcXCJwdWxsLXJpZ2h0IGljb24gaWNvbi1yZXNpemUtaGFuZGxlXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInJlc2l6ZS1oYW5kbGVcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHRcdDxhIGNsYXNzPVxcXCJwdWxsLXJpZ2h0IGljb24gaWNvbi1waW5cXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLXBpbm5lZFxcXCIgdGl0bGU9XFxcIlBpbi91bnBpbiB0aGUgZW1vdGUgbWVudSB0byB0aGUgc2NyZWVuXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snbmV3c01lc3NhZ2UnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPGRpdiBjbGFzcz1cXFwidHdpdGNoLWNoYXQtZW1vdGVzLW5ld3NcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0W1wiKTt0LmIodC52KHQuZihcInNjcmlwdE5hbWVcIixjLHAsMCkpKTt0LmIoXCJdIE5ld3M6IFwiKTt0LmIodC50KHQuZihcIm1lc3NhZ2VcIixjLHAsMCkpKTt0LmIoXCIgKDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtY29tbWFuZD1cXFwidHdpdGNoLWNoYXQtZW1vdGVzOmRpc21pc3MtbmV3c1xcXCIgZGF0YS1uZXdzLWlkPVxcXCJcIik7dC5iKHQudih0LmYoXCJpZFwiLGMscCwwKSkpO3QuYihcIlxcXCI+RGlzbWlzczwvYT4pXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHJldHVybiB0ZW1wbGF0ZXM7XG59KSgpOyIsIi8qXG4gKiAgQ29weXJpZ2h0IDIwMTEgVHdpdHRlciwgSW5jLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEhvZ2FuID0ge307XG5cbihmdW5jdGlvbiAoSG9nYW4pIHtcbiAgSG9nYW4uVGVtcGxhdGUgPSBmdW5jdGlvbiAoY29kZU9iaiwgdGV4dCwgY29tcGlsZXIsIG9wdGlvbnMpIHtcbiAgICBjb2RlT2JqID0gY29kZU9iaiB8fCB7fTtcbiAgICB0aGlzLnIgPSBjb2RlT2JqLmNvZGUgfHwgdGhpcy5yO1xuICAgIHRoaXMuYyA9IGNvbXBpbGVyO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy50ZXh0ID0gdGV4dCB8fCAnJztcbiAgICB0aGlzLnBhcnRpYWxzID0gY29kZU9iai5wYXJ0aWFscyB8fCB7fTtcbiAgICB0aGlzLnN1YnMgPSBjb2RlT2JqLnN1YnMgfHwge307XG4gICAgdGhpcy5idWYgPSAnJztcbiAgfVxuXG4gIEhvZ2FuLlRlbXBsYXRlLnByb3RvdHlwZSA9IHtcbiAgICAvLyByZW5kZXI6IHJlcGxhY2VkIGJ5IGdlbmVyYXRlZCBjb2RlLlxuICAgIHI6IGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7IHJldHVybiAnJzsgfSxcblxuICAgIC8vIHZhcmlhYmxlIGVzY2FwaW5nXG4gICAgdjogaG9nYW5Fc2NhcGUsXG5cbiAgICAvLyB0cmlwbGUgc3RhY2hlXG4gICAgdDogY29lcmNlVG9TdHJpbmcsXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5yaShbY29udGV4dF0sIHBhcnRpYWxzIHx8IHt9LCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgaW50ZXJuYWwgLS0gYSBob29rIGZvciBvdmVycmlkZXMgdGhhdCBjYXRjaGVzIHBhcnRpYWxzIHRvb1xuICAgIHJpOiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgcmV0dXJuIHRoaXMucihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gZW5zdXJlUGFydGlhbFxuICAgIGVwOiBmdW5jdGlvbihzeW1ib2wsIHBhcnRpYWxzKSB7XG4gICAgICB2YXIgcGFydGlhbCA9IHRoaXMucGFydGlhbHNbc3ltYm9sXTtcblxuICAgICAgLy8gY2hlY2sgdG8gc2VlIHRoYXQgaWYgd2UndmUgaW5zdGFudGlhdGVkIHRoaXMgcGFydGlhbCBiZWZvcmVcbiAgICAgIHZhciB0ZW1wbGF0ZSA9IHBhcnRpYWxzW3BhcnRpYWwubmFtZV07XG4gICAgICBpZiAocGFydGlhbC5pbnN0YW5jZSAmJiBwYXJ0aWFsLmJhc2UgPT0gdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWwuaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGVtcGxhdGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKCF0aGlzLmMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBjb21waWxlciBhdmFpbGFibGUuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gdGhpcy5jLmNvbXBpbGUodGVtcGxhdGUsIHRoaXMub3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHVzZSB0aGlzIHRvIGNoZWNrIHdoZXRoZXIgdGhlIHBhcnRpYWxzIGRpY3Rpb25hcnkgaGFzIGNoYW5nZWRcbiAgICAgIHRoaXMucGFydGlhbHNbc3ltYm9sXS5iYXNlID0gdGVtcGxhdGU7XG5cbiAgICAgIGlmIChwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGNvbnNpZGVyIHBhcmVudCB0ZW1wbGF0ZSBub3dcbiAgICAgICAgaWYgKCFwYXJ0aWFscy5zdGFja1RleHQpIHBhcnRpYWxzLnN0YWNrVGV4dCA9IHt9O1xuICAgICAgICBmb3IgKGtleSBpbiBwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgICBpZiAoIXBhcnRpYWxzLnN0YWNrVGV4dFtrZXldKSB7XG4gICAgICAgICAgICBwYXJ0aWFscy5zdGFja1RleHRba2V5XSA9ICh0aGlzLmFjdGl2ZVN1YiAhPT0gdW5kZWZpbmVkICYmIHBhcnRpYWxzLnN0YWNrVGV4dFt0aGlzLmFjdGl2ZVN1Yl0pID8gcGFydGlhbHMuc3RhY2tUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgPSBjcmVhdGVTcGVjaWFsaXplZFBhcnRpYWwodGVtcGxhdGUsIHBhcnRpYWwuc3VicywgcGFydGlhbC5wYXJ0aWFscyxcbiAgICAgICAgICB0aGlzLnN0YWNrU3VicywgdGhpcy5zdGFja1BhcnRpYWxzLCBwYXJ0aWFscy5zdGFja1RleHQpO1xuICAgICAgfVxuICAgICAgdGhpcy5wYXJ0aWFsc1tzeW1ib2xdLmluc3RhbmNlID0gdGVtcGxhdGU7XG5cbiAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9LFxuXG4gICAgLy8gdHJpZXMgdG8gZmluZCBhIHBhcnRpYWwgaW4gdGhlIGN1cnJlbnQgc2NvcGUgYW5kIHJlbmRlciBpdFxuICAgIHJwOiBmdW5jdGlvbihzeW1ib2wsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBwYXJ0aWFsID0gdGhpcy5lcChzeW1ib2wsIHBhcnRpYWxzKTtcbiAgICAgIGlmICghcGFydGlhbCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXJ0aWFsLnJpKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgYSBzZWN0aW9uXG4gICAgcnM6IGZ1bmN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCBzZWN0aW9uKSB7XG4gICAgICB2YXIgdGFpbCA9IGNvbnRleHRbY29udGV4dC5sZW5ndGggLSAxXTtcblxuICAgICAgaWYgKCFpc0FycmF5KHRhaWwpKSB7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFpbC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb250ZXh0LnB1c2godGFpbFtpXSk7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICBjb250ZXh0LnBvcCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBtYXliZSBzdGFydCBhIHNlY3Rpb25cbiAgICBzOiBmdW5jdGlvbih2YWwsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKSB7XG4gICAgICB2YXIgcGFzcztcblxuICAgICAgaWYgKGlzQXJyYXkodmFsKSAmJiB2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSB0aGlzLm1zKHZhbCwgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpO1xuICAgICAgfVxuXG4gICAgICBwYXNzID0gISF2YWw7XG5cbiAgICAgIGlmICghaW52ZXJ0ZWQgJiYgcGFzcyAmJiBjdHgpIHtcbiAgICAgICAgY3R4LnB1c2goKHR5cGVvZiB2YWwgPT0gJ29iamVjdCcpID8gdmFsIDogY3R4W2N0eC5sZW5ndGggLSAxXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXNzO1xuICAgIH0sXG5cbiAgICAvLyBmaW5kIHZhbHVlcyB3aXRoIGRvdHRlZCBuYW1lc1xuICAgIGQ6IGZ1bmN0aW9uKGtleSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpIHtcbiAgICAgIHZhciBmb3VuZCxcbiAgICAgICAgICBuYW1lcyA9IGtleS5zcGxpdCgnLicpLFxuICAgICAgICAgIHZhbCA9IHRoaXMuZihuYW1lc1swXSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpLFxuICAgICAgICAgIGRvTW9kZWxHZXQgPSB0aGlzLm9wdGlvbnMubW9kZWxHZXQsXG4gICAgICAgICAgY3ggPSBudWxsO1xuXG4gICAgICBpZiAoa2V5ID09PSAnLicgJiYgaXNBcnJheShjdHhbY3R4Lmxlbmd0aCAtIDJdKSkge1xuICAgICAgICB2YWwgPSBjdHhbY3R4Lmxlbmd0aCAtIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZvdW5kID0gZmluZEluU2NvcGUobmFtZXNbaV0sIHZhbCwgZG9Nb2RlbEdldCk7XG4gICAgICAgICAgaWYgKGZvdW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGN4ID0gdmFsO1xuICAgICAgICAgICAgdmFsID0gZm91bmQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbCA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmV0dXJuRm91bmQgJiYgIXZhbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmV0dXJuRm91bmQgJiYgdHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGN0eC5wdXNoKGN4KTtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgICBjdHgucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIGZpbmQgdmFsdWVzIHdpdGggbm9ybWFsIG5hbWVzXG4gICAgZjogZnVuY3Rpb24oa2V5LCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCkge1xuICAgICAgdmFyIHZhbCA9IGZhbHNlLFxuICAgICAgICAgIHYgPSBudWxsLFxuICAgICAgICAgIGZvdW5kID0gZmFsc2UsXG4gICAgICAgICAgZG9Nb2RlbEdldCA9IHRoaXMub3B0aW9ucy5tb2RlbEdldDtcblxuICAgICAgZm9yICh2YXIgaSA9IGN0eC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICB2ID0gY3R4W2ldO1xuICAgICAgICB2YWwgPSBmaW5kSW5TY29wZShrZXksIHYsIGRvTW9kZWxHZXQpO1xuICAgICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICByZXR1cm4gKHJldHVybkZvdW5kKSA/IGZhbHNlIDogXCJcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXR1cm5Gb3VuZCAmJiB0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICAvLyBoaWdoZXIgb3JkZXIgdGVtcGxhdGVzXG4gICAgbHM6IGZ1bmN0aW9uKGZ1bmMsIGN4LCBwYXJ0aWFscywgdGV4dCwgdGFncykge1xuICAgICAgdmFyIG9sZFRhZ3MgPSB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycztcblxuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSB0YWdzO1xuICAgICAgdGhpcy5iKHRoaXMuY3QoY29lcmNlVG9TdHJpbmcoZnVuYy5jYWxsKGN4LCB0ZXh0KSksIGN4LCBwYXJ0aWFscykpO1xuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSBvbGRUYWdzO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8vIGNvbXBpbGUgdGV4dFxuICAgIGN0OiBmdW5jdGlvbih0ZXh0LCBjeCwgcGFydGlhbHMpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlzYWJsZUxhbWJkYSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xhbWJkYSBmZWF0dXJlcyBkaXNhYmxlZC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmMuY29tcGlsZSh0ZXh0LCB0aGlzLm9wdGlvbnMpLnJlbmRlcihjeCwgcGFydGlhbHMpO1xuICAgIH0sXG5cbiAgICAvLyB0ZW1wbGF0ZSByZXN1bHQgYnVmZmVyaW5nXG4gICAgYjogZnVuY3Rpb24ocykgeyB0aGlzLmJ1ZiArPSBzOyB9LFxuXG4gICAgZmw6IGZ1bmN0aW9uKCkgeyB2YXIgciA9IHRoaXMuYnVmOyB0aGlzLmJ1ZiA9ICcnOyByZXR1cm4gcjsgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHNlY3Rpb25cbiAgICBtczogZnVuY3Rpb24oZnVuYywgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpIHtcbiAgICAgIHZhciB0ZXh0U291cmNlLFxuICAgICAgICAgIGN4ID0gY3R4W2N0eC5sZW5ndGggLSAxXSxcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmNhbGwoY3gpO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmIChpbnZlcnRlZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRleHRTb3VyY2UgPSAodGhpcy5hY3RpdmVTdWIgJiYgdGhpcy5zdWJzVGV4dCAmJiB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSkgPyB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICByZXR1cm4gdGhpcy5scyhyZXN1bHQsIGN4LCBwYXJ0aWFscywgdGV4dFNvdXJjZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCksIHRhZ3MpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHZhcmlhYmxlXG4gICAgbXY6IGZ1bmN0aW9uKGZ1bmMsIGN0eCwgcGFydGlhbHMpIHtcbiAgICAgIHZhciBjeCA9IGN0eFtjdHgubGVuZ3RoIC0gMV07XG4gICAgICB2YXIgcmVzdWx0ID0gZnVuYy5jYWxsKGN4KTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gdGhpcy5jdChjb2VyY2VUb1N0cmluZyhyZXN1bHQuY2FsbChjeCkpLCBjeCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICBzdWI6IGZ1bmN0aW9uKG5hbWUsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBmID0gdGhpcy5zdWJzW25hbWVdO1xuICAgICAgaWYgKGYpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVTdWIgPSBuYW1lO1xuICAgICAgICBmKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzLCBpbmRlbnQpO1xuICAgICAgICB0aGlzLmFjdGl2ZVN1YiA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICB9O1xuXG4gIC8vRmluZCBhIGtleSBpbiBhbiBvYmplY3RcbiAgZnVuY3Rpb24gZmluZEluU2NvcGUoa2V5LCBzY29wZSwgZG9Nb2RlbEdldCkge1xuICAgIHZhciB2YWw7XG5cbiAgICBpZiAoc2NvcGUgJiYgdHlwZW9mIHNjb3BlID09ICdvYmplY3QnKSB7XG5cbiAgICAgIGlmIChzY29wZVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFsID0gc2NvcGVba2V5XTtcblxuICAgICAgLy8gdHJ5IGxvb2t1cCB3aXRoIGdldCBmb3IgYmFja2JvbmUgb3Igc2ltaWxhciBtb2RlbCBkYXRhXG4gICAgICB9IGVsc2UgaWYgKGRvTW9kZWxHZXQgJiYgc2NvcGUuZ2V0ICYmIHR5cGVvZiBzY29wZS5nZXQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSBzY29wZS5nZXQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3BlY2lhbGl6ZWRQYXJ0aWFsKGluc3RhbmNlLCBzdWJzLCBwYXJ0aWFscywgc3RhY2tTdWJzLCBzdGFja1BhcnRpYWxzLCBzdGFja1RleHQpIHtcbiAgICBmdW5jdGlvbiBQYXJ0aWFsVGVtcGxhdGUoKSB7fTtcbiAgICBQYXJ0aWFsVGVtcGxhdGUucHJvdG90eXBlID0gaW5zdGFuY2U7XG4gICAgZnVuY3Rpb24gU3Vic3RpdHV0aW9ucygpIHt9O1xuICAgIFN1YnN0aXR1dGlvbnMucHJvdG90eXBlID0gaW5zdGFuY2Uuc3VicztcbiAgICB2YXIga2V5O1xuICAgIHZhciBwYXJ0aWFsID0gbmV3IFBhcnRpYWxUZW1wbGF0ZSgpO1xuICAgIHBhcnRpYWwuc3VicyA9IG5ldyBTdWJzdGl0dXRpb25zKCk7XG4gICAgcGFydGlhbC5zdWJzVGV4dCA9IHt9OyAgLy9oZWhlLiBzdWJzdGV4dC5cbiAgICBwYXJ0aWFsLmJ1ZiA9ICcnO1xuXG4gICAgc3RhY2tTdWJzID0gc3RhY2tTdWJzIHx8IHt9O1xuICAgIHBhcnRpYWwuc3RhY2tTdWJzID0gc3RhY2tTdWJzO1xuICAgIHBhcnRpYWwuc3Vic1RleHQgPSBzdGFja1RleHQ7XG4gICAgZm9yIChrZXkgaW4gc3Vicykge1xuICAgICAgaWYgKCFzdGFja1N1YnNba2V5XSkgc3RhY2tTdWJzW2tleV0gPSBzdWJzW2tleV07XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHN0YWNrU3Vicykge1xuICAgICAgcGFydGlhbC5zdWJzW2tleV0gPSBzdGFja1N1YnNba2V5XTtcbiAgICB9XG5cbiAgICBzdGFja1BhcnRpYWxzID0gc3RhY2tQYXJ0aWFscyB8fCB7fTtcbiAgICBwYXJ0aWFsLnN0YWNrUGFydGlhbHMgPSBzdGFja1BhcnRpYWxzO1xuICAgIGZvciAoa2V5IGluIHBhcnRpYWxzKSB7XG4gICAgICBpZiAoIXN0YWNrUGFydGlhbHNba2V5XSkgc3RhY2tQYXJ0aWFsc1trZXldID0gcGFydGlhbHNba2V5XTtcbiAgICB9XG4gICAgZm9yIChrZXkgaW4gc3RhY2tQYXJ0aWFscykge1xuICAgICAgcGFydGlhbC5wYXJ0aWFsc1trZXldID0gc3RhY2tQYXJ0aWFsc1trZXldO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJ0aWFsO1xuICB9XG5cbiAgdmFyIHJBbXAgPSAvJi9nLFxuICAgICAgckx0ID0gLzwvZyxcbiAgICAgIHJHdCA9IC8+L2csXG4gICAgICByQXBvcyA9IC9cXCcvZyxcbiAgICAgIHJRdW90ID0gL1xcXCIvZyxcbiAgICAgIGhDaGFycyA9IC9bJjw+XFxcIlxcJ10vO1xuXG4gIGZ1bmN0aW9uIGNvZXJjZVRvU3RyaW5nKHZhbCkge1xuICAgIHJldHVybiBTdHJpbmcoKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHZhbCk7XG4gIH1cblxuICBmdW5jdGlvbiBob2dhbkVzY2FwZShzdHIpIHtcbiAgICBzdHIgPSBjb2VyY2VUb1N0cmluZyhzdHIpO1xuICAgIHJldHVybiBoQ2hhcnMudGVzdChzdHIpID9cbiAgICAgIHN0clxuICAgICAgICAucmVwbGFjZShyQW1wLCAnJmFtcDsnKVxuICAgICAgICAucmVwbGFjZShyTHQsICcmbHQ7JylcbiAgICAgICAgLnJlcGxhY2Uockd0LCAnJmd0OycpXG4gICAgICAgIC5yZXBsYWNlKHJBcG9zLCAnJiMzOTsnKVxuICAgICAgICAucmVwbGFjZShyUXVvdCwgJyZxdW90OycpIDpcbiAgICAgIHN0cjtcbiAgfVxuXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihhKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxufSkodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnID8gZXhwb3J0cyA6IEhvZ2FuKTtcbiIsIi8qKlxuICogalF1ZXJ5IENTUyBDdXN0b21pemFibGUgU2Nyb2xsYmFyXG4gKlxuICogQ29weXJpZ2h0IDIwMTQsIFl1cml5IEtoYWJhcm92XG4gKiBEdWFsIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgb3IgR1BMIFZlcnNpb24gMiBsaWNlbnNlcy5cbiAqXG4gKiBJZiB5b3UgZm91bmQgYnVnLCBwbGVhc2UgY29udGFjdCBtZSB2aWEgZW1haWwgPDEzcmVhbDAwOEBnbWFpbC5jb20+XG4gKlxuICogQGF1dGhvciBZdXJpeSBLaGFiYXJvdiBha2EgR3JvbW9cbiAqIEB2ZXJzaW9uIDAuMi42XG4gKiBAdXJsIGh0dHBzOi8vZ2l0aHViLmNvbS9ncm9tby9qcXVlcnkuc2Nyb2xsYmFyL1xuICpcbiAqL1xuKGZ1bmN0aW9uKGUsdCxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBoKHQpe2lmKG8ud2Via2l0JiYhdCl7cmV0dXJue2hlaWdodDowLHdpZHRoOjB9fWlmKCFvLmRhdGEub3V0ZXIpe3ZhciBuPXtib3JkZXI6XCJub25lXCIsXCJib3gtc2l6aW5nXCI6XCJjb250ZW50LWJveFwiLGhlaWdodDpcIjIwMHB4XCIsbWFyZ2luOlwiMFwiLHBhZGRpbmc6XCIwXCIsd2lkdGg6XCIyMDBweFwifTtvLmRhdGEuaW5uZXI9ZShcIjxkaXY+XCIpLmNzcyhlLmV4dGVuZCh7fSxuKSk7by5kYXRhLm91dGVyPWUoXCI8ZGl2PlwiKS5jc3MoZS5leHRlbmQoe2xlZnQ6XCItMTAwMHB4XCIsb3ZlcmZsb3c6XCJzY3JvbGxcIixwb3NpdGlvbjpcImFic29sdXRlXCIsdG9wOlwiLTEwMDBweFwifSxuKSkuYXBwZW5kKG8uZGF0YS5pbm5lcikuYXBwZW5kVG8oXCJib2R5XCIpfW8uZGF0YS5vdXRlci5zY3JvbGxMZWZ0KDFlMykuc2Nyb2xsVG9wKDFlMyk7cmV0dXJue2hlaWdodDpNYXRoLmNlaWwoby5kYXRhLm91dGVyLm9mZnNldCgpLnRvcC1vLmRhdGEuaW5uZXIub2Zmc2V0KCkudG9wfHwwKSx3aWR0aDpNYXRoLmNlaWwoby5kYXRhLm91dGVyLm9mZnNldCgpLmxlZnQtby5kYXRhLmlubmVyLm9mZnNldCgpLmxlZnR8fDApfX1mdW5jdGlvbiBwKG4scil7ZSh0KS5vbih7XCJibHVyLnNjcm9sbGJhclwiOmZ1bmN0aW9uKCl7ZSh0KS5hZGQoXCJib2R5XCIpLm9mZihcIi5zY3JvbGxiYXJcIik7biYmbigpfSxcImRyYWdzdGFydC5zY3JvbGxiYXJcIjpmdW5jdGlvbihlKXtlLnByZXZlbnREZWZhdWx0KCk7cmV0dXJuIGZhbHNlfSxcIm1vdXNldXAuc2Nyb2xsYmFyXCI6ZnVuY3Rpb24oKXtlKHQpLmFkZChcImJvZHlcIikub2ZmKFwiLnNjcm9sbGJhclwiKTtuJiZuKCl9fSk7ZShcImJvZHlcIikub24oe1wic2VsZWN0c3RhcnQuc2Nyb2xsYmFyXCI6ZnVuY3Rpb24oZSl7ZS5wcmV2ZW50RGVmYXVsdCgpO3JldHVybiBmYWxzZX19KTtyJiZyLnByZXZlbnREZWZhdWx0KCk7cmV0dXJuIGZhbHNlfWZ1bmN0aW9uIGQoKXt2YXIgZT1oKHRydWUpO3JldHVybiEoZS5oZWlnaHR8fGUud2lkdGgpfWZ1bmN0aW9uIHYoZSl7dmFyIHQ9ZS5vcmlnaW5hbEV2ZW50O2lmKHQuYXhpcyYmdC5heGlzPT09dC5IT1JJWk9OVEFMX0FYSVMpcmV0dXJuIGZhbHNlO2lmKHQud2hlZWxEZWx0YVgpcmV0dXJuIGZhbHNlO3JldHVybiB0cnVlfXZhciByPWZhbHNlO3ZhciBpPTEscz1cInB4XCI7dmFyIG89e2RhdGE6e30sbWFjb3N4Om4ubmF2aWdhdG9yLnBsYXRmb3JtLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcIm1hY1wiKSE9PS0xLG1vYmlsZTovQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnkvaS50ZXN0KG4ubmF2aWdhdG9yLnVzZXJBZ2VudCksb3ZlcmxheTpudWxsLHNjcm9sbDpudWxsLHNjcm9sbHM6W10sd2Via2l0Oi9XZWJLaXQvLnRlc3Qobi5uYXZpZ2F0b3IudXNlckFnZW50KSxsb2c6cj9mdW5jdGlvbih0LHIpe3ZhciBpPXQ7aWYociYmdHlwZW9mIHQhPVwic3RyaW5nXCIpe2k9W107ZS5lYWNoKHQsZnVuY3Rpb24oZSx0KXtpLnB1c2goJ1wiJytlKydcIjogJyt0KX0pO2k9aS5qb2luKFwiLCBcIil9aWYobi5jb25zb2xlJiZuLmNvbnNvbGUubG9nKXtuLmNvbnNvbGUubG9nKGkpfWVsc2V7YWxlcnQoaSl9fTpmdW5jdGlvbigpe319O3ZhciB1PXthdXRvU2Nyb2xsU2l6ZTp0cnVlLGF1dG9VcGRhdGU6dHJ1ZSxkZWJ1ZzpmYWxzZSxkaXNhYmxlQm9keVNjcm9sbDpmYWxzZSxkdXJhdGlvbjoyMDAsaWdub3JlTW9iaWxlOnRydWUsaWdub3JlT3ZlcmxheTp0cnVlLHNjcm9sbFN0ZXA6MzAsc2hvd0Fycm93czpmYWxzZSxzdGVwU2Nyb2xsaW5nOnRydWUsdHlwZTpcInNpbXBsZVwiLHNjcm9sbHg6bnVsbCxzY3JvbGx5Om51bGwsb25EZXN0cm95Om51bGwsb25Jbml0Om51bGwsb25TY3JvbGw6bnVsbCxvblVwZGF0ZTpudWxsfTt2YXIgYT1mdW5jdGlvbih0LHIpe2lmKCFvLnNjcm9sbCl7by5sb2coXCJJbml0IGpRdWVyeSBTY3JvbGxiYXIgdjAuMi42XCIpO28ub3ZlcmxheT1kKCk7by5zY3JvbGw9aCgpO2MoKTtlKG4pLnJlc2l6ZShmdW5jdGlvbigpe3ZhciBlPWZhbHNlO2lmKG8uc2Nyb2xsJiYoby5zY3JvbGwuaGVpZ2h0fHxvLnNjcm9sbC53aWR0aCkpe3ZhciB0PWgoKTtpZih0LmhlaWdodCE9by5zY3JvbGwuaGVpZ2h0fHx0LndpZHRoIT1vLnNjcm9sbC53aWR0aCl7by5zY3JvbGw9dDtlPXRydWV9fWMoZSl9KX10aGlzLmNvbnRhaW5lcj10O3RoaXMub3B0aW9ucz1lLmV4dGVuZCh7fSx1LG4ualF1ZXJ5U2Nyb2xsYmFyT3B0aW9uc3x8e30pO3RoaXMuc2Nyb2xsVG89bnVsbDt0aGlzLnNjcm9sbHg9e307dGhpcy5zY3JvbGx5PXt9O3RoaXMuaW5pdChyKX07YS5wcm90b3R5cGU9e2Rlc3Ryb3k6ZnVuY3Rpb24oKXtpZighdGhpcy53cmFwcGVyKXtyZXR1cm59dmFyIG49dGhpcy5jb250YWluZXIuc2Nyb2xsTGVmdCgpO3ZhciByPXRoaXMuY29udGFpbmVyLnNjcm9sbFRvcCgpO3RoaXMuY29udGFpbmVyLmluc2VydEJlZm9yZSh0aGlzLndyYXBwZXIpLmNzcyh7aGVpZ2h0OlwiXCIsbWFyZ2luOlwiXCJ9KS5yZW1vdmVDbGFzcyhcInNjcm9sbC1jb250ZW50XCIpLnJlbW92ZUNsYXNzKFwic2Nyb2xsLXNjcm9sbHhfdmlzaWJsZVwiKS5yZW1vdmVDbGFzcyhcInNjcm9sbC1zY3JvbGx5X3Zpc2libGVcIikub2ZmKFwiLnNjcm9sbGJhclwiKS5zY3JvbGxMZWZ0KG4pLnNjcm9sbFRvcChyKTt0aGlzLnNjcm9sbHguc2Nyb2xsYmFyLnJlbW92ZUNsYXNzKFwic2Nyb2xsLXNjcm9sbHhfdmlzaWJsZVwiKS5maW5kKFwiZGl2XCIpLmFuZFNlbGYoKS5vZmYoXCIuc2Nyb2xsYmFyXCIpO3RoaXMuc2Nyb2xseS5zY3JvbGxiYXIucmVtb3ZlQ2xhc3MoXCJzY3JvbGwtc2Nyb2xseV92aXNpYmxlXCIpLmZpbmQoXCJkaXZcIikuYW5kU2VsZigpLm9mZihcIi5zY3JvbGxiYXJcIik7dGhpcy53cmFwcGVyLnJlbW92ZSgpO2UodCkuYWRkKFwiYm9keVwiKS5vZmYoXCIuc2Nyb2xsYmFyXCIpO2lmKGUuaXNGdW5jdGlvbih0aGlzLm9wdGlvbnMub25EZXN0cm95KSl0aGlzLm9wdGlvbnMub25EZXN0cm95LmFwcGx5KHRoaXMsW3RoaXMuY29udGFpbmVyXSl9LGdldFNjcm9sbGJhcjpmdW5jdGlvbih0KXt2YXIgbj10aGlzLm9wdGlvbnNbXCJzY3JvbGxcIit0XTt2YXIgcj17YWR2YW5jZWQ6JzxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9jb3JuZXJcIj48L2Rpdj4nKyc8ZGl2IGNsYXNzPVwic2Nyb2xsLWFycm93IHNjcm9sbC1hcnJvd19sZXNzXCI+PC9kaXY+JysnPGRpdiBjbGFzcz1cInNjcm9sbC1hcnJvdyBzY3JvbGwtYXJyb3dfbW9yZVwiPjwvZGl2PicrJzxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9vdXRlclwiPicrJyAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfc2l6ZVwiPjwvZGl2PicrJyAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfaW5uZXItd3JhcHBlclwiPicrJyAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X2lubmVyIHNjcm9sbC1lbGVtZW50X3RyYWNrXCI+JysnICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X2lubmVyLWJvdHRvbVwiPjwvZGl2PicrXCIgICAgICAgIDwvZGl2PlwiK1wiICAgIDwvZGl2PlwiKycgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJcIj4nKycgICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtYmFyX2JvZHlcIj4nKycgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWJhcl9ib2R5LWlubmVyXCI+PC9kaXY+JytcIiAgICAgICAgPC9kaXY+XCIrJyAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJfYm90dG9tXCI+PC9kaXY+JysnICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWJhcl9jZW50ZXJcIj48L2Rpdj4nK1wiICAgIDwvZGl2PlwiK1wiPC9kaXY+XCIsc2ltcGxlOic8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfb3V0ZXJcIj4nKycgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X3NpemVcIj48L2Rpdj4nKycgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X3RyYWNrXCI+PC9kaXY+JysnICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtYmFyXCI+PC9kaXY+JytcIjwvZGl2PlwifTt2YXIgaT1yW3RoaXMub3B0aW9ucy50eXBlXT90aGlzLm9wdGlvbnMudHlwZTpcImFkdmFuY2VkXCI7aWYobil7aWYodHlwZW9mIG49PVwic3RyaW5nXCIpe249ZShuKS5hcHBlbmRUbyh0aGlzLndyYXBwZXIpfWVsc2V7bj1lKG4pfX1lbHNle249ZShcIjxkaXY+XCIpLmFkZENsYXNzKFwic2Nyb2xsLWVsZW1lbnRcIikuaHRtbChyW2ldKS5hcHBlbmRUbyh0aGlzLndyYXBwZXIpfWlmKHRoaXMub3B0aW9ucy5zaG93QXJyb3dzKXtuLmFkZENsYXNzKFwic2Nyb2xsLWVsZW1lbnRfYXJyb3dzX3Zpc2libGVcIil9cmV0dXJuIG4uYWRkQ2xhc3MoXCJzY3JvbGwtXCIrdCl9LGluaXQ6ZnVuY3Rpb24obil7dmFyIHI9dGhpczt2YXIgdT10aGlzLmNvbnRhaW5lcjt2YXIgYT10aGlzLmNvbnRhaW5lcldyYXBwZXJ8fHU7dmFyIGY9ZS5leHRlbmQodGhpcy5vcHRpb25zLG58fHt9KTt2YXIgbD17eDp0aGlzLnNjcm9sbHgseTp0aGlzLnNjcm9sbHl9O3ZhciBjPXRoaXMud3JhcHBlcjt2YXIgaD17c2Nyb2xsTGVmdDp1LnNjcm9sbExlZnQoKSxzY3JvbGxUb3A6dS5zY3JvbGxUb3AoKX07aWYoby5tb2JpbGUmJmYuaWdub3JlTW9iaWxlfHxvLm92ZXJsYXkmJmYuaWdub3JlT3ZlcmxheXx8by5tYWNvc3gmJiFvLndlYmtpdCl7cmV0dXJuIGZhbHNlfWlmKCFjKXt0aGlzLndyYXBwZXI9Yz1lKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJzY3JvbGwtd3JhcHBlclwiKS5hZGRDbGFzcyh1LmF0dHIoXCJjbGFzc1wiKSkuY3NzKFwicG9zaXRpb25cIix1LmNzcyhcInBvc2l0aW9uXCIpPT1cImFic29sdXRlXCI/XCJhYnNvbHV0ZVwiOlwicmVsYXRpdmVcIikuaW5zZXJ0QmVmb3JlKHUpLmFwcGVuZCh1KTtpZih1LmlzKFwidGV4dGFyZWFcIikpe3RoaXMuY29udGFpbmVyV3JhcHBlcj1hPWUoXCI8ZGl2PlwiKS5pbnNlcnRCZWZvcmUodSkuYXBwZW5kKHUpO2MuYWRkQ2xhc3MoXCJzY3JvbGwtdGV4dGFyZWFcIil9YS5hZGRDbGFzcyhcInNjcm9sbC1jb250ZW50XCIpLmNzcyh7aGVpZ2h0OlwiXCIsXCJtYXJnaW4tYm90dG9tXCI6by5zY3JvbGwuaGVpZ2h0Ki0xK3MsXCJtYXJnaW4tcmlnaHRcIjpvLnNjcm9sbC53aWR0aCotMStzfSk7dS5vbihcInNjcm9sbC5zY3JvbGxiYXJcIixmdW5jdGlvbih0KXtpZihlLmlzRnVuY3Rpb24oZi5vblNjcm9sbCkpe2Yub25TY3JvbGwuY2FsbChyLHttYXhTY3JvbGw6bC55Lm1heFNjcm9sbE9mZnNldCxzY3JvbGw6dS5zY3JvbGxUb3AoKSxzaXplOmwueS5zaXplLHZpc2libGU6bC55LnZpc2libGV9LHttYXhTY3JvbGw6bC54Lm1heFNjcm9sbE9mZnNldCxzY3JvbGw6dS5zY3JvbGxMZWZ0KCksc2l6ZTpsLnguc2l6ZSx2aXNpYmxlOmwueC52aXNpYmxlfSl9bC54LmlzVmlzaWJsZSYmbC54LnNjcm9sbGVyLmNzcyhcImxlZnRcIix1LnNjcm9sbExlZnQoKSpsLngua3grcyk7bC55LmlzVmlzaWJsZSYmbC55LnNjcm9sbGVyLmNzcyhcInRvcFwiLHUuc2Nyb2xsVG9wKCkqbC55Lmt4K3MpfSk7Yy5vbihcInNjcm9sbFwiLGZ1bmN0aW9uKCl7Yy5zY3JvbGxUb3AoMCkuc2Nyb2xsTGVmdCgwKX0pO2lmKGYuZGlzYWJsZUJvZHlTY3JvbGwpe3ZhciBkPWZ1bmN0aW9uKGUpe3YoZSk/bC55LmlzVmlzaWJsZSYmbC55Lm1vdXNld2hlZWwoZSk6bC54LmlzVmlzaWJsZSYmbC54Lm1vdXNld2hlZWwoZSl9O2Mub24oe1wiTW96TW91c2VQaXhlbFNjcm9sbC5zY3JvbGxiYXJcIjpkLFwibW91c2V3aGVlbC5zY3JvbGxiYXJcIjpkfSk7aWYoby5tb2JpbGUpe2Mub24oXCJ0b3VjaHN0YXJ0LnNjcm9sbGJhclwiLGZ1bmN0aW9uKG4pe3ZhciByPW4ub3JpZ2luYWxFdmVudC50b3VjaGVzJiZuLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXXx8bjt2YXIgaT17cGFnZVg6ci5wYWdlWCxwYWdlWTpyLnBhZ2VZfTt2YXIgcz17bGVmdDp1LnNjcm9sbExlZnQoKSx0b3A6dS5zY3JvbGxUb3AoKX07ZSh0KS5vbih7XCJ0b3VjaG1vdmUuc2Nyb2xsYmFyXCI6ZnVuY3Rpb24oZSl7dmFyIHQ9ZS5vcmlnaW5hbEV2ZW50LnRhcmdldFRvdWNoZXMmJmUub3JpZ2luYWxFdmVudC50YXJnZXRUb3VjaGVzWzBdfHxlO3Uuc2Nyb2xsTGVmdChzLmxlZnQraS5wYWdlWC10LnBhZ2VYKTt1LnNjcm9sbFRvcChzLnRvcCtpLnBhZ2VZLXQucGFnZVkpO2UucHJldmVudERlZmF1bHQoKX0sXCJ0b3VjaGVuZC5zY3JvbGxiYXJcIjpmdW5jdGlvbigpe2UodCkub2ZmKFwiLnNjcm9sbGJhclwiKX19KX0pfX1pZihlLmlzRnVuY3Rpb24oZi5vbkluaXQpKWYub25Jbml0LmFwcGx5KHRoaXMsW3VdKX1lbHNle2EuY3NzKHtoZWlnaHQ6XCJcIixcIm1hcmdpbi1ib3R0b21cIjpvLnNjcm9sbC5oZWlnaHQqLTErcyxcIm1hcmdpbi1yaWdodFwiOm8uc2Nyb2xsLndpZHRoKi0xK3N9KX1lLmVhY2gobCxmdW5jdGlvbihuLHMpe3ZhciBvPW51bGw7dmFyIGE9MTt2YXIgYz1uPT1cInhcIj9cInNjcm9sbExlZnRcIjpcInNjcm9sbFRvcFwiO3ZhciBoPWYuc2Nyb2xsU3RlcDt2YXIgZD1mdW5jdGlvbigpe3ZhciBlPXVbY10oKTt1W2NdKGUraCk7aWYoYT09MSYmZStoPj1tKWU9dVtjXSgpO2lmKGE9PS0xJiZlK2g8PW0pZT11W2NdKCk7aWYodVtjXSgpPT1lJiZvKXtvKCl9fTt2YXIgbT0wO2lmKCFzLnNjcm9sbGJhcil7cy5zY3JvbGxiYXI9ci5nZXRTY3JvbGxiYXIobik7cy5zY3JvbGxlcj1zLnNjcm9sbGJhci5maW5kKFwiLnNjcm9sbC1iYXJcIik7cy5tb3VzZXdoZWVsPWZ1bmN0aW9uKGUpe2lmKCFzLmlzVmlzaWJsZXx8bj09XCJ4XCImJnYoZSkpe3JldHVybiB0cnVlfWlmKG49PVwieVwiJiYhdihlKSl7bC54Lm1vdXNld2hlZWwoZSk7cmV0dXJuIHRydWV9dmFyIHQ9ZS5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGEqLTF8fGUub3JpZ2luYWxFdmVudC5kZXRhaWw7dmFyIGk9cy5zaXplLXMudmlzaWJsZS1zLm9mZnNldDtpZighKG08PTAmJnQ8MHx8bT49aSYmdD4wKSl7bT1tK3Q7aWYobTwwKW09MDtpZihtPmkpbT1pO3Iuc2Nyb2xsVG89ci5zY3JvbGxUb3x8e307ci5zY3JvbGxUb1tjXT1tO3NldFRpbWVvdXQoZnVuY3Rpb24oKXtpZihyLnNjcm9sbFRvKXt1LnN0b3AoKS5hbmltYXRlKHIuc2Nyb2xsVG8sMjQwLFwibGluZWFyXCIsZnVuY3Rpb24oKXttPXVbY10oKX0pO3Iuc2Nyb2xsVG89bnVsbH19LDEpfWUucHJldmVudERlZmF1bHQoKTtyZXR1cm4gZmFsc2V9O3Muc2Nyb2xsYmFyLm9uKHtcIk1vek1vdXNlUGl4ZWxTY3JvbGwuc2Nyb2xsYmFyXCI6cy5tb3VzZXdoZWVsLFwibW91c2V3aGVlbC5zY3JvbGxiYXJcIjpzLm1vdXNld2hlZWwsXCJtb3VzZWVudGVyLnNjcm9sbGJhclwiOmZ1bmN0aW9uKCl7bT11W2NdKCl9fSk7cy5zY3JvbGxiYXIuZmluZChcIi5zY3JvbGwtYXJyb3csIC5zY3JvbGwtZWxlbWVudF90cmFja1wiKS5vbihcIm1vdXNlZG93bi5zY3JvbGxiYXJcIixmdW5jdGlvbih0KXtpZih0LndoaWNoIT1pKXJldHVybiB0cnVlO2E9MTt2YXIgbD17ZXZlbnRPZmZzZXQ6dFtuPT1cInhcIj9cInBhZ2VYXCI6XCJwYWdlWVwiXSxtYXhTY3JvbGxWYWx1ZTpzLnNpemUtcy52aXNpYmxlLXMub2Zmc2V0LHNjcm9sbGJhck9mZnNldDpzLnNjcm9sbGVyLm9mZnNldCgpW249PVwieFwiP1wibGVmdFwiOlwidG9wXCJdLHNjcm9sbGJhclNpemU6cy5zY3JvbGxlcltuPT1cInhcIj9cIm91dGVyV2lkdGhcIjpcIm91dGVySGVpZ2h0XCJdKCl9O3ZhciB2PTAsZz0wO2lmKGUodGhpcykuaGFzQ2xhc3MoXCJzY3JvbGwtYXJyb3dcIikpe2E9ZSh0aGlzKS5oYXNDbGFzcyhcInNjcm9sbC1hcnJvd19tb3JlXCIpPzE6LTE7aD1mLnNjcm9sbFN0ZXAqYTttPWE+MD9sLm1heFNjcm9sbFZhbHVlOjB9ZWxzZXthPWwuZXZlbnRPZmZzZXQ+bC5zY3JvbGxiYXJPZmZzZXQrbC5zY3JvbGxiYXJTaXplPzE6bC5ldmVudE9mZnNldDxsLnNjcm9sbGJhck9mZnNldD8tMTowO2g9TWF0aC5yb3VuZChzLnZpc2libGUqLjc1KSphO209bC5ldmVudE9mZnNldC1sLnNjcm9sbGJhck9mZnNldC0oZi5zdGVwU2Nyb2xsaW5nP2E9PTE/bC5zY3JvbGxiYXJTaXplOjA6TWF0aC5yb3VuZChsLnNjcm9sbGJhclNpemUvMikpO209dVtjXSgpK20vcy5reH1yLnNjcm9sbFRvPXIuc2Nyb2xsVG98fHt9O3Iuc2Nyb2xsVG9bY109Zi5zdGVwU2Nyb2xsaW5nP3VbY10oKStoOm07aWYoZi5zdGVwU2Nyb2xsaW5nKXtvPWZ1bmN0aW9uKCl7bT11W2NdKCk7Y2xlYXJJbnRlcnZhbChnKTtjbGVhclRpbWVvdXQodik7dj0wO2c9MH07dj1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Zz1zZXRJbnRlcnZhbChkLDQwKX0sZi5kdXJhdGlvbisxMDApfXNldFRpbWVvdXQoZnVuY3Rpb24oKXtpZihyLnNjcm9sbFRvKXt1LmFuaW1hdGUoci5zY3JvbGxUbyxmLmR1cmF0aW9uKTtyLnNjcm9sbFRvPW51bGx9fSwxKTtyZXR1cm4gcChvLHQpfSk7cy5zY3JvbGxlci5vbihcIm1vdXNlZG93bi5zY3JvbGxiYXJcIixmdW5jdGlvbihyKXtpZihyLndoaWNoIT1pKXJldHVybiB0cnVlO3ZhciBvPXJbbj09XCJ4XCI/XCJwYWdlWFwiOlwicGFnZVlcIl07dmFyIGE9dVtjXSgpO3Muc2Nyb2xsYmFyLmFkZENsYXNzKFwic2Nyb2xsLWRyYWdnYWJsZVwiKTtlKHQpLm9uKFwibW91c2Vtb3ZlLnNjcm9sbGJhclwiLGZ1bmN0aW9uKGUpe3ZhciB0PXBhcnNlSW50KChlW249PVwieFwiP1wicGFnZVhcIjpcInBhZ2VZXCJdLW8pL3Mua3gsMTApO3VbY10oYSt0KX0pO3JldHVybiBwKGZ1bmN0aW9uKCl7cy5zY3JvbGxiYXIucmVtb3ZlQ2xhc3MoXCJzY3JvbGwtZHJhZ2dhYmxlXCIpO209dVtjXSgpfSxyKX0pfX0pO2UuZWFjaChsLGZ1bmN0aW9uKGUsdCl7dmFyIG49XCJzY3JvbGwtc2Nyb2xsXCIrZStcIl92aXNpYmxlXCI7dmFyIHI9ZT09XCJ4XCI/bC55OmwueDt0LnNjcm9sbGJhci5yZW1vdmVDbGFzcyhuKTtyLnNjcm9sbGJhci5yZW1vdmVDbGFzcyhuKTthLnJlbW92ZUNsYXNzKG4pfSk7ZS5lYWNoKGwsZnVuY3Rpb24odCxuKXtlLmV4dGVuZChuLHQ9PVwieFwiP3tvZmZzZXQ6cGFyc2VJbnQodS5jc3MoXCJsZWZ0XCIpLDEwKXx8MCxzaXplOnUucHJvcChcInNjcm9sbFdpZHRoXCIpLHZpc2libGU6Yy53aWR0aCgpfTp7b2Zmc2V0OnBhcnNlSW50KHUuY3NzKFwidG9wXCIpLDEwKXx8MCxzaXplOnUucHJvcChcInNjcm9sbEhlaWdodFwiKSx2aXNpYmxlOmMuaGVpZ2h0KCl9KX0pO3ZhciBtPWZ1bmN0aW9uKHQsbil7dmFyIHI9XCJzY3JvbGwtc2Nyb2xsXCIrdCtcIl92aXNpYmxlXCI7dmFyIGk9dD09XCJ4XCI/bC55OmwueDt2YXIgZj1wYXJzZUludCh1LmNzcyh0PT1cInhcIj9cImxlZnRcIjpcInRvcFwiKSwxMCl8fDA7dmFyIGg9bi5zaXplO3ZhciBwPW4udmlzaWJsZStmO24uaXNWaXNpYmxlPWgtcD4xO2lmKG4uaXNWaXNpYmxlKXtuLnNjcm9sbGJhci5hZGRDbGFzcyhyKTtpLnNjcm9sbGJhci5hZGRDbGFzcyhyKTthLmFkZENsYXNzKHIpfWVsc2V7bi5zY3JvbGxiYXIucmVtb3ZlQ2xhc3Mocik7aS5zY3JvbGxiYXIucmVtb3ZlQ2xhc3Mocik7YS5yZW1vdmVDbGFzcyhyKX1pZih0PT1cInlcIiYmKG4uaXNWaXNpYmxlfHxuLnNpemU8bi52aXNpYmxlKSl7YS5jc3MoXCJoZWlnaHRcIixwK28uc2Nyb2xsLmhlaWdodCtzKX1pZihsLnguc2l6ZSE9dS5wcm9wKFwic2Nyb2xsV2lkdGhcIil8fGwueS5zaXplIT11LnByb3AoXCJzY3JvbGxIZWlnaHRcIil8fGwueC52aXNpYmxlIT1jLndpZHRoKCl8fGwueS52aXNpYmxlIT1jLmhlaWdodCgpfHxsLngub2Zmc2V0IT0ocGFyc2VJbnQodS5jc3MoXCJsZWZ0XCIpLDEwKXx8MCl8fGwueS5vZmZzZXQhPShwYXJzZUludCh1LmNzcyhcInRvcFwiKSwxMCl8fDApKXtlLmVhY2gobCxmdW5jdGlvbih0LG4pe2UuZXh0ZW5kKG4sdD09XCJ4XCI/e29mZnNldDpwYXJzZUludCh1LmNzcyhcImxlZnRcIiksMTApfHwwLHNpemU6dS5wcm9wKFwic2Nyb2xsV2lkdGhcIiksdmlzaWJsZTpjLndpZHRoKCl9OntvZmZzZXQ6cGFyc2VJbnQodS5jc3MoXCJ0b3BcIiksMTApfHwwLHNpemU6dS5wcm9wKFwic2Nyb2xsSGVpZ2h0XCIpLHZpc2libGU6Yy5oZWlnaHQoKX0pfSk7bSh0PT1cInhcIj9cInlcIjpcInhcIixpKX19O2UuZWFjaChsLG0pO2lmKGUuaXNGdW5jdGlvbihmLm9uVXBkYXRlKSlmLm9uVXBkYXRlLmFwcGx5KHRoaXMsW3VdKTtlLmVhY2gobCxmdW5jdGlvbihlLHQpe3ZhciBuPWU9PVwieFwiP1wibGVmdFwiOlwidG9wXCI7dmFyIHI9ZT09XCJ4XCI/XCJvdXRlcldpZHRoXCI6XCJvdXRlckhlaWdodFwiO3ZhciBpPWU9PVwieFwiP1wid2lkdGhcIjpcImhlaWdodFwiO3ZhciBvPXBhcnNlSW50KHUuY3NzKG4pLDEwKXx8MDt2YXIgYT10LnNpemU7dmFyIGw9dC52aXNpYmxlK287dmFyIGM9dC5zY3JvbGxiYXIuZmluZChcIi5zY3JvbGwtZWxlbWVudF9zaXplXCIpO2M9Y1tyXSgpKyhwYXJzZUludChjLmNzcyhuKSwxMCl8fDApO2lmKGYuYXV0b1Njcm9sbFNpemUpe3Quc2Nyb2xsYmFyU2l6ZT1wYXJzZUludChjKmwvYSwxMCk7dC5zY3JvbGxlci5jc3MoaSx0LnNjcm9sbGJhclNpemUrcyl9dC5zY3JvbGxiYXJTaXplPXQuc2Nyb2xsZXJbcl0oKTt0Lmt4PShjLXQuc2Nyb2xsYmFyU2l6ZSkvKGEtbCl8fDE7dC5tYXhTY3JvbGxPZmZzZXQ9YS1sfSk7dS5zY3JvbGxMZWZ0KGguc2Nyb2xsTGVmdCkuc2Nyb2xsVG9wKGguc2Nyb2xsVG9wKS50cmlnZ2VyKFwic2Nyb2xsXCIpfX07ZS5mbi5zY3JvbGxiYXI9ZnVuY3Rpb24odCxuKXt2YXIgcj10aGlzO2lmKHQ9PT1cImdldFwiKXI9bnVsbDt0aGlzLmVhY2goZnVuY3Rpb24oKXt2YXIgaT1lKHRoaXMpO2lmKGkuaGFzQ2xhc3MoXCJzY3JvbGwtd3JhcHBlclwiKXx8aS5nZXQoMCkubm9kZU5hbWU9PVwiYm9keVwiKXtyZXR1cm4gdHJ1ZX12YXIgcz1pLmRhdGEoXCJzY3JvbGxiYXJcIik7aWYocyl7aWYodD09PVwiZ2V0XCIpe3I9cztyZXR1cm4gZmFsc2V9dmFyIHU9dHlwZW9mIHQ9PVwic3RyaW5nXCImJnNbdF0/dDpcImluaXRcIjtzW3VdLmFwcGx5KHMsZS5pc0FycmF5KG4pP246W10pO2lmKHQ9PT1cImRlc3Ryb3lcIil7aS5yZW1vdmVEYXRhKFwic2Nyb2xsYmFyXCIpO3doaWxlKGUuaW5BcnJheShzLG8uc2Nyb2xscyk+PTApby5zY3JvbGxzLnNwbGljZShlLmluQXJyYXkocyxvLnNjcm9sbHMpLDEpfX1lbHNle2lmKHR5cGVvZiB0IT1cInN0cmluZ1wiKXtzPW5ldyBhKGksdCk7aS5kYXRhKFwic2Nyb2xsYmFyXCIscyk7by5zY3JvbGxzLnB1c2gocyl9fXJldHVybiB0cnVlfSk7cmV0dXJuIHJ9O2UuZm4uc2Nyb2xsYmFyLm9wdGlvbnM9dTtpZihuLmFuZ3VsYXIpeyhmdW5jdGlvbihlKXt2YXIgdD1lLm1vZHVsZShcImpRdWVyeVNjcm9sbGJhclwiLFtdKTt0LmRpcmVjdGl2ZShcImpxdWVyeVNjcm9sbGJhclwiLGZ1bmN0aW9uKCl7cmV0dXJue2xpbms6ZnVuY3Rpb24oZSx0KXt0LnNjcm9sbGJhcihlLm9wdGlvbnMpLm9uKFwiJGRlc3Ryb3lcIixmdW5jdGlvbigpe3Quc2Nyb2xsYmFyKFwiZGVzdHJveVwiKX0pfSxyZXN0cmluZzpcIkFDXCIsc2NvcGU6e29wdGlvbnM6XCI9anF1ZXJ5U2Nyb2xsYmFyXCJ9fX0pfSkobi5hbmd1bGFyKX12YXIgZj0wLGw9MDt2YXIgYz1mdW5jdGlvbihlKXt2YXIgdCxuLGkscyx1LGEsaDtmb3IodD0wO3Q8by5zY3JvbGxzLmxlbmd0aDt0Kyspe3M9by5zY3JvbGxzW3RdO249cy5jb250YWluZXI7aT1zLm9wdGlvbnM7dT1zLndyYXBwZXI7YT1zLnNjcm9sbHg7aD1zLnNjcm9sbHk7aWYoZXx8aS5hdXRvVXBkYXRlJiZ1JiZ1LmlzKFwiOnZpc2libGVcIikmJihuLnByb3AoXCJzY3JvbGxXaWR0aFwiKSE9YS5zaXplfHxuLnByb3AoXCJzY3JvbGxIZWlnaHRcIikhPWguc2l6ZXx8dS53aWR0aCgpIT1hLnZpc2libGV8fHUuaGVpZ2h0KCkhPWgudmlzaWJsZSkpe3MuaW5pdCgpO2lmKHIpe28ubG9nKHtzY3JvbGxIZWlnaHQ6bi5wcm9wKFwic2Nyb2xsSGVpZ2h0XCIpK1wiOlwiK3Muc2Nyb2xseS5zaXplLHNjcm9sbFdpZHRoOm4ucHJvcChcInNjcm9sbFdpZHRoXCIpK1wiOlwiK3Muc2Nyb2xseC5zaXplLHZpc2libGVIZWlnaHQ6dS5oZWlnaHQoKStcIjpcIitzLnNjcm9sbHkudmlzaWJsZSx2aXNpYmxlV2lkdGg6dS53aWR0aCgpK1wiOlwiK3Muc2Nyb2xseC52aXNpYmxlfSx0cnVlKTtsKyt9fX1pZihyJiZsPjEwKXtvLmxvZyhcIlNjcm9sbCB1cGRhdGVzIGV4Y2VlZCAxMFwiKTtjPWZ1bmN0aW9uKCl7fX1lbHNle2NsZWFyVGltZW91dChmKTtmPXNldFRpbWVvdXQoYywzMDApfX19KShqUXVlcnksZG9jdW1lbnQsd2luZG93KTsiLCIvLyBTdG9yYWdlIGNhY2hlLlxyXG52YXIgY2FjaGUgPSB7fTtcclxuLy8gVGhlIHN0b3JlIGhhbmRsaW5nIGV4cGlyYXRpb24gb2YgZGF0YS5cclxudmFyIGV4cGlyZXNTdG9yZSA9IG5ldyBTdG9yZSh7XHJcblx0bmFtZXNwYWNlOiAnX19zdG9yYWdlLXdyYXBwZXI6ZXhwaXJlcydcclxufSk7XHJcblxyXG4vKipcclxuICogU3RvcmFnZSB3cmFwcGVyIGZvciBtYWtpbmcgcm91dGluZSBzdG9yYWdlIGNhbGxzIHN1cGVyIGVhc3kuXHJcbiAqIEBjbGFzcyBTdG9yZVxyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSAgICAgICAgICAgICAgICAgICAgIFRoZSBvcHRpb25zIGZvciB0aGUgc3RvcmUuIE9wdGlvbnMgbm90IG92ZXJyaWRkZW4gd2lsbCB1c2UgdGhlIGRlZmF1bHRzLlxyXG4gKiBAcGFyYW0ge21peGVkfSAgW29wdGlvbnMubmFtZXNwYWNlPScnXSAgICAgICAgU2VlIHt7I2Nyb3NzTGluayBcIlN0b3JlL3NldE5hbWVzcGFjZVwifX1TdG9yZSNzZXROYW1lc3BhY2V7ey9jcm9zc0xpbmt9fVxyXG4gKiBAcGFyYW0ge21peGVkfSAgW29wdGlvbnMuc3RvcmFnZVR5cGU9J2xvY2FsJ10gU2VlIHt7I2Nyb3NzTGluayBcIlN0b3JlL3NldFN0b3JhZ2VUeXBlXCJ9fVN0b3JlI3NldFN0b3JhZ2VUeXBle3svY3Jvc3NMaW5rfX1cclxuICovXHJcbmZ1bmN0aW9uIFN0b3JlKG9wdGlvbnMpIHtcclxuXHR2YXIgc2V0dGluZ3MgPSB7XHJcblx0XHRuYW1lc3BhY2U6ICcnLFxyXG5cdFx0c3RvcmFnZVR5cGU6ICdsb2NhbCdcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBzdG9yYWdlIG5hbWVzcGFjZS5cclxuXHQgKiBAbWV0aG9kIHNldE5hbWVzcGFjZVxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfGZhbHNlfG51bGx9IG5hbWVzcGFjZSBUaGUgbmFtZXNwYWNlIHRvIHdvcmsgdW5kZXIuIFRvIHVzZSBubyBuYW1lc3BhY2UgKGUuZy4gZ2xvYmFsIG5hbWVzcGFjZSksIHBhc3MgaW4gYGZhbHNlYCBvciBgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nLlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0TmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xyXG5cdFx0dmFyIHZhbGlkTmFtZXNwYWNlID0gL15bXFx3LTpdKyQvO1xyXG5cdFx0Ly8gTm8gbmFtZXNwYWNlLlxyXG5cdFx0aWYgKG5hbWVzcGFjZSA9PT0gZmFsc2UgfHwgbmFtZXNwYWNlID09IG51bGwgfHwgbmFtZXNwYWNlID09PSAnJykge1xyXG5cdFx0XHRzZXR0aW5ncy5uYW1lc3BhY2UgPSAnJztcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHR5cGVvZiBuYW1lc3BhY2UgIT09ICdzdHJpbmcnIHx8ICF2YWxpZE5hbWVzcGFjZS50ZXN0KG5hbWVzcGFjZSkpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5hbWVzcGFjZS4nKTtcclxuXHRcdH1cclxuXHRcdHNldHRpbmdzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBjdXJyZW50IHN0b3JhZ2UgbmFtZXNwYWNlLlxyXG5cdCAqIEBtZXRob2QgZ2V0TmFtZXNwYWNlXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgY3VycmVudCBuYW1lc3BhY2UuXHJcblx0ICovXHJcblx0dGhpcy5nZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAoaW5jbHVkZVNlcGFyYXRvcikge1xyXG5cdFx0aWYgKGluY2x1ZGVTZXBhcmF0b3IgJiYgc2V0dGluZ3MubmFtZXNwYWNlICE9PSAnJykge1xyXG5cdFx0XHRyZXR1cm4gc2V0dGluZ3MubmFtZXNwYWNlICsgJzonO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHNldHRpbmdzLm5hbWVzcGFjZTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIHR5cGUgb2Ygc3RvcmFnZSB0byB1c2UuXHJcblx0ICogQG1ldGhvZCBzZXRTdG9yYWdlVHlwZVxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIFRoZSB0eXBlIG9mIHN0b3JhZ2UgdG8gdXNlLiBVc2UgYHNlc3Npb25gIGZvciBgc2Vzc2lvblN0b3JhZ2VgIGFuZCBgbG9jYWxgIGZvciBgbG9jYWxTdG9yYWdlYC5cclxuXHQgKi9cclxuXHR0aGlzLnNldFN0b3JhZ2VUeXBlID0gZnVuY3Rpb24gKHR5cGUpIHtcclxuXHRcdGlmIChbJ3Nlc3Npb24nLCAnbG9jYWwnXS5pbmRleE9mKHR5cGUpIDwgMCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RvcmFnZSB0eXBlLicpO1xyXG5cdFx0fVxyXG5cdFx0c2V0dGluZ3Muc3RvcmFnZVR5cGUgPSB0eXBlO1xyXG5cdH07XHJcblx0LyoqXHJcblx0ICogR2V0IHRoZSB0eXBlIG9mIHN0b3JhZ2UgYmVpbmcgdXNlZC5cclxuXHQgKiBAbWV0aG9kIGdldFN0b3JhZ2VUeXBlXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgdHlwZSBvZiBzdG9yYWdlIGJlaW5nIHVzZWQuXHJcblx0ICovXHJcblx0dGhpcy5nZXRTdG9yYWdlVHlwZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBzZXR0aW5ncy5zdG9yYWdlVHlwZTtcclxuXHR9O1xyXG5cclxuXHQvLyBPdmVycmlkZSBkZWZhdWx0IHNldHRpbmdzLlxyXG5cdGlmIChvcHRpb25zKSB7XHJcblx0XHRmb3IgKHZhciBrZXkgaW4gb3B0aW9ucykge1xyXG5cdFx0XHRzd2l0Y2ggKGtleSkge1xyXG5cdFx0XHRcdGNhc2UgJ25hbWVzcGFjZSc6XHJcblx0XHRcdFx0XHR0aGlzLnNldE5hbWVzcGFjZShvcHRpb25zW2tleV0pO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0Y2FzZSAnc3RvcmFnZVR5cGUnOlxyXG5cdFx0XHRcdFx0dGhpcy5zZXRTdG9yYWdlVHlwZShvcHRpb25zW2tleV0pO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBhY3R1YWwgaGFuZGxlciB0byB1c2VcclxuICogQG1ldGhvZCBnZXRTdG9yYWdlSGFuZGxlclxyXG4gKiBAcmV0dXJuIHttaXhlZH0gVGhlIHN0b3JhZ2UgaGFuZGxlci5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXRTdG9yYWdlSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgaGFuZGxlcnMgPSB7XHJcblx0XHQnbG9jYWwnOiBsb2NhbFN0b3JhZ2UsXHJcblx0XHQnc2Vzc2lvbic6IHNlc3Npb25TdG9yYWdlXHJcblx0fTtcclxuXHRyZXR1cm4gaGFuZGxlcnNbdGhpcy5nZXRTdG9yYWdlVHlwZSgpXTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGZ1bGwgc3RvcmFnZSBuYW1lIGZvciBhIGtleSwgaW5jbHVkaW5nIHRoZSBuYW1lc3BhY2UsIGlmIGFueS5cclxuICogQG1ldGhvZCBnZXRTdG9yYWdlS2V5XHJcbiAqIEBwYXJhbSAge3N0cmluZ30ga2V5IFRoZSBzdG9yYWdlIGtleSBuYW1lLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICBUaGUgZnVsbCBzdG9yYWdlIG5hbWUgdGhhdCBpcyB1c2VkIGJ5IHRoZSBzdG9yYWdlIG1ldGhvZHMuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZ2V0U3RvcmFnZUtleSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHRpZiAoIWtleSB8fCB0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyB8fCBrZXkubGVuZ3RoIDwgMSkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdLZXkgbXVzdCBiZSBhIHN0cmluZy4nKTtcclxuXHR9XHJcblx0cmV0dXJuIHRoaXMuZ2V0TmFtZXNwYWNlKHRydWUpICsga2V5O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yYWdlIGl0ZW0gZnJvbSB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgZ2V0XHJcbiAqIEBwYXJhbSAge3N0cmluZ30ga2V5ICAgICAgICAgIFRoZSBrZXkgdGhhdCB0aGUgZGF0YSBjYW4gYmUgYWNjZXNzZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSAge21peGVkfSAgZGVmYXVsdFZhbHVlIFRoZSBkZWZhdWx0IHZhbHVlIHRvIHJldHVybiBpbiBjYXNlIHRoZSBzdG9yYWdlIHZhbHVlIGlzIG5vdCBzZXQgb3IgYG51bGxgLlxyXG4gKiBAcmV0dXJuIHttaXhlZH0gICAgICAgICAgICAgICBUaGUgZGF0YSBmb3IgdGhlIHN0b3JhZ2UuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSwgZGVmYXVsdFZhbHVlKSB7XHJcblx0Ly8gUHJldmVudCByZWN1cnNpb24uIE9ubHkgY2hlY2sgZXhwaXJlIGRhdGUgaWYgaXQgaXNuJ3QgY2FsbGVkIGZyb20gYGV4cGlyZXNTdG9yZWAuXHJcblx0aWYgKHRoaXMgIT09IGV4cGlyZXNTdG9yZSkge1xyXG5cdFx0Ly8gQ2hlY2sgaWYga2V5IGlzIGV4cGlyZWQuXHJcblx0XHR2YXIgZXhwaXJlRGF0ZSA9IGV4cGlyZXNTdG9yZS5nZXQodGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG5cdFx0aWYgKGV4cGlyZURhdGUgIT09IG51bGwgJiYgZXhwaXJlRGF0ZS5nZXRUaW1lKCkgPCBEYXRlLm5vdygpKSB7XHJcblx0XHRcdC8vIEV4cGlyZWQsIHJlbW92ZSBpdC5cclxuXHRcdFx0dGhpcy5yZW1vdmUoa2V5KTtcclxuXHRcdFx0ZXhwaXJlc1N0b3JlLnJlbW92ZSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBDYWNoZWQsIHJlYWQgZnJvbSBtZW1vcnkuXHJcblx0aWYgKGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSAhPSBudWxsKSB7XHJcblx0XHRyZXR1cm4gY2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldO1xyXG5cdH1cclxuXHJcblx0dmFyIHZhbCA9IHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5nZXRJdGVtKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxuXHJcblx0Ly8gVmFsdWUgZG9lc24ndCBleGlzdCBhbmQgd2UgaGF2ZSBhIGRlZmF1bHQsIHJldHVybiBkZWZhdWx0LlxyXG5cdGlmICh2YWwgPT09IG51bGwgJiYgdHlwZW9mIGRlZmF1bHRWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHJldHVybiBkZWZhdWx0VmFsdWU7XHJcblx0fVxyXG5cclxuXHQvLyBPbmx5IHByZS1wcm9jZXNzIHN0cmluZ3MuXHJcblx0aWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XHJcblx0XHQvLyBIYW5kbGUgUmVnRXhwcy5cclxuXHRcdGlmICh2YWwuaW5kZXhPZignflJlZ0V4cDonKSA9PT0gMCkge1xyXG5cdFx0XHR2YXIgbWF0Y2hlcyA9IC9eflJlZ0V4cDooW2dpbV0qPyk6KC4qKS8uZXhlYyh2YWwpO1xyXG5cdFx0XHR2YWwgPSBuZXcgUmVnRXhwKG1hdGNoZXNbMl0sIG1hdGNoZXNbMV0pO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIERhdGVzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35EYXRlOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IG5ldyBEYXRlKHZhbC5yZXBsYWNlKC9efkRhdGU6LywgJycpKTtcclxuXHRcdH1cclxuXHRcdC8vIEhhbmRsZSBudW1iZXJzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35OdW1iZXI6JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gcGFyc2VJbnQodmFsLnJlcGxhY2UoL15+TnVtYmVyOi8sICcnKSwgMTApO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIGJvb2xlYW5zLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35Cb29sZWFuOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IHZhbC5yZXBsYWNlKC9efkJvb2xlYW46LywgJycpID09PSAndHJ1ZSc7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgb2JqZWN0cy5cclxuXHRcdGVsc2UgaWYgKHZhbC5pbmRleE9mKCd+SlNPTjonKSA9PT0gMCkge1xyXG5cdFx0XHR2YWwgPSB2YWwucmVwbGFjZSgvXn5KU09OOi8sICcnKTtcclxuXHRcdFx0Ly8gVHJ5IHBhcnNpbmcgaXQuXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0dmFsID0gSlNPTi5wYXJzZSh2YWwpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIFBhcnNpbmcgd2VudCB3cm9uZyAoaW52YWxpZCBKU09OKSwgcmV0dXJuIGRlZmF1bHQgb3IgbnVsbC5cclxuXHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGRlZmF1bHRWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdFx0XHRcdHJldHVybiBkZWZhdWx0VmFsdWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBSZXR1cm4gaXQuXHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gdmFsO1xyXG5cdHJldHVybiB2YWw7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyBhIHN0b3JhZ2UgaXRlbSBvbiB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2Qgc2V0XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgICAgIGtleSAgICAgICBUaGUga2V5IHRoYXQgdGhlIGRhdGEgY2FuIGJlIGFjY2Vzc2VkIHVuZGVyLlxyXG4gKiBAcGFyYW0ge21peGVkfSAgICAgICB2YWwgICAgICAgVGhlIHZhbHVlIHRvIHN0b3JlLiBNYXkgYmUgdGhlIGZvbGxvd2luZyB0eXBlcyBvZiBkYXRhOiBgUmVnRXhwYCwgYERhdGVgLCBgT2JqZWN0YCwgYFN0cmluZ2AsIGBCb29sZWFuYCwgYE51bWJlcmBcclxuICogQHBhcmFtIHtEYXRlfG51bWJlcn0gW2V4cGlyZXNdIFRoZSBkYXRlIGluIHRoZSBmdXR1cmUgdG8gZXhwaXJlLCBvciByZWxhdGl2ZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGZyb20gYERhdGUjbm93YCB0byBleHBpcmUuXHJcbiAqXHJcbiAqIE5vdGU6IFRoaXMgY29udmVydHMgc3BlY2lhbCBkYXRhIHR5cGVzIHRoYXQgbm9ybWFsbHkgY2FuJ3QgYmUgc3RvcmVkIGluIHRoZSBmb2xsb3dpbmcgd2F5OlxyXG4gKiBcclxuICogLSBgUmVnRXhwYDogcHJlZml4ZWQgd2l0aCB0eXBlLCBmbGFncyBzdG9yZWQsIGFuZCBzb3VyY2Ugc3RvcmVkIGFzIHN0cmluZy5cclxuICogLSBgRGF0ZWA6IHByZWZpeGVkIHdpdGggdHlwZSwgc3RvcmVkIGFzIHN0cmluZyB1c2luZyBgRGF0ZSN0b1N0cmluZ2AuXHJcbiAqIC0gYE9iamVjdGA6IHByZWZpeGVkIHdpdGggXCJKU09OXCIgaW5kaWNhdG9yLCBzdG9yZWQgYXMgc3RyaW5nIHVzaW5nIGBKU09OI3N0cmluZ2lmeWAuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsLCBleHBpcmVzKSB7XHJcblx0dmFyIHBhcnNlZFZhbCA9IG51bGw7XHJcblx0Ly8gSGFuZGxlIFJlZ0V4cHMuXHJcblx0aWYgKHZhbCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xyXG5cdFx0dmFyIGZsYWdzID0gW1xyXG5cdFx0XHR2YWwuZ2xvYmFsID8gJ2cnIDogJycsXHJcblx0XHRcdHZhbC5pZ25vcmVDYXNlID8gJ2knIDogJycsXHJcblx0XHRcdHZhbC5tdWx0aWxpbmUgPyAnbScgOiAnJyxcclxuXHRcdF0uam9pbignJyk7XHJcblx0XHRwYXJzZWRWYWwgPSAnflJlZ0V4cDonICsgZmxhZ3MgKyAnOicgKyB2YWwuc291cmNlO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgRGF0ZXMuXHJcblx0ZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkge1xyXG5cdFx0cGFyc2VkVmFsID0gJ35EYXRlOicgKyB2YWwudG9TdHJpbmcoKTtcclxuXHR9XHJcblx0Ly8gSGFuZGxlIG9iamVjdHMuXHJcblx0ZWxzZSBpZiAodmFsID09PSBPYmplY3QodmFsKSkge1xyXG5cdFx0cGFyc2VkVmFsID0gJ35KU09OOicgKyBKU09OLnN0cmluZ2lmeSh2YWwpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgbnVtYmVycy5cclxuXHRlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xyXG5cdFx0cGFyc2VkVmFsID0gJ35OdW1iZXI6JyArIHZhbC50b1N0cmluZygpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgYm9vbGVhbnMuXHJcblx0ZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ2Jvb2xlYW4nKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkJvb2xlYW46JyArIHZhbC50b1N0cmluZygpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgc3RyaW5ncy5cclxuXHRlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xyXG5cdFx0cGFyc2VkVmFsID0gdmFsO1xyXG5cdH1cclxuXHQvLyBUaHJvdyBpZiB3ZSBkb24ndCBrbm93IHdoYXQgaXQgaXMuXHJcblx0ZWxzZSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBzdG9yZSB0aGlzIHZhbHVlOyB3cm9uZyB2YWx1ZSB0eXBlLicpO1xyXG5cdH1cclxuXHQvLyBTZXQgZXhwaXJlIGRhdGUgaWYgbmVlZGVkLlxyXG5cdGlmICh0eXBlb2YgZXhwaXJlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdC8vIENvbnZlcnQgdG8gYSByZWxhdGl2ZSBkYXRlLlxyXG5cdFx0aWYgKHR5cGVvZiBleHBpcmVzID09PSAnbnVtYmVyJykge1xyXG5cdFx0XHRleHBpcmVzID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIGV4cGlyZXMpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gTWFrZSBzdXJlIGl0IGlzIGEgZGF0ZS5cclxuXHRcdGlmIChleHBpcmVzIGluc3RhbmNlb2YgRGF0ZSkge1xyXG5cdFx0XHRleHBpcmVzU3RvcmUuc2V0KHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpLCBleHBpcmVzKTtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0tleSBleHBpcmUgbXVzdCBiZSBhIHZhbGlkIGRhdGUgb3IgdGltZXN0YW1wLicpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvLyBTYXZlIGl0LlxyXG5cdGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSA9IHZhbDtcclxuXHR0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkuc2V0SXRlbSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSwgcGFyc2VkVmFsKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGFsbCBkYXRhIGZvciB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgZ2V0QWxsXHJcbiAqIEByZXR1cm4ge29iamVjdH0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgYWxsIGRhdGEgaW4gdGhlIGZvcm0gb2YgYHt0aGVLZXk6IHRoZURhdGF9YCB3aGVyZSBgdGhlRGF0YWAgaXMgcGFyc2VkIHVzaW5nIHt7I2Nyb3NzTGluayBcIlN0b3JlL2dldFwifX1TdG9yZSNnZXR7ey9jcm9zc0xpbmt9fS5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGtleXMgPSB0aGlzLmxpc3RLZXlzKCk7XHJcblx0dmFyIGRhdGEgPSB7fTtcclxuXHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0ZGF0YVtrZXldID0gdGhpcy5nZXQoa2V5KTtcclxuXHR9LCB0aGlzKTtcclxuXHRyZXR1cm4gZGF0YTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBMaXN0IGFsbCBrZXlzIHRoYXQgYXJlIHRpZWQgdG8gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIGxpc3RLZXlzXHJcbiAqIEByZXR1cm4ge2FycmF5fSBUaGUgc3RvcmFnZSBrZXlzLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmxpc3RLZXlzID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBrZXlzID0gW107XHJcblx0dmFyIGtleSA9IG51bGw7XHJcblx0dmFyIHN0b3JhZ2VMZW5ndGggPSB0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkubGVuZ3RoO1xyXG5cdHZhciBwcmVmaXggPSBuZXcgUmVnRXhwKCdeJyArIHRoaXMuZ2V0TmFtZXNwYWNlKHRydWUpKTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHN0b3JhZ2VMZW5ndGg7IGkrKykge1xyXG5cdFx0a2V5ID0gdGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLmtleShpKVxyXG5cdFx0aWYgKHByZWZpeC50ZXN0KGtleSkpIHtcclxuXHRcdFx0a2V5cy5wdXNoKGtleS5yZXBsYWNlKHByZWZpeCwgJycpKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIGtleXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHNwZWNpZmljIGtleSBhbmQgZGF0YSBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCByZW1vdmVcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IHRvIHJlbW92ZSB0aGUgZGF0YSBmb3IuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSA9IG51bGw7XHJcblx0dGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLnJlbW92ZUl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYWxsIGRhdGEgYW5kIGtleXMgZnJvbSB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgcmVtb3ZlQWxsXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUucmVtb3ZlQWxsID0gZnVuY3Rpb24gKCkge1xyXG5cdHRoaXMubGlzdEtleXMoKS5mb3JFYWNoKHRoaXMucmVtb3ZlLCB0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIG5hbWVzcGFjZWQgaXRlbXMgZnJvbSB0aGUgY2FjaGUgc28geW91ciBuZXh0IHt7I2Nyb3NzTGluayBcIlN0b3JlL2dldFwifX1TdG9yZSNnZXR7ey9jcm9zc0xpbmt9fSB3aWxsIGJlIGZyZXNoIGZyb20gdGhlIHN0b3JhZ2UuXHJcbiAqIEBtZXRob2QgZnJlc2hlblxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIHRoZSBjYWNoZSBkYXRhIGZvci5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5mcmVzaGVuID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdHZhciBrZXlzID0ga2V5ID8gW2tleV0gOiB0aGlzLmxpc3RLZXlzKCk7XHJcblx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdGNhY2hlW3RoaXMuZ2V0U3RvcmFnZUtleShrZXkpXSA9IG51bGw7XHJcblx0fSwgdGhpcyk7XHJcbn07XHJcblxyXG4vKipcclxuICogTWlncmF0ZSBkYXRhIGZyb20gYSBkaWZmZXJlbnQgbmFtZXNwYWNlIHRvIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIG1pZ3JhdGVcclxuICogQHBhcmFtIHtvYmplY3R9ICAgbWlncmF0aW9uICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgbWlncmF0aW9uIG9iamVjdC5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbWlncmF0aW9uLnRvS2V5ICAgICAgICAgICAgICAgICAgICBUaGUga2V5IG5hbWUgdW5kZXIgeW91ciBjdXJyZW50IG5hbWVzcGFjZSB0aGUgb2xkIGRhdGEgc2hvdWxkIGNoYW5nZSB0by5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbWlncmF0aW9uLmZyb21OYW1lc3BhY2UgICAgICAgICAgICBUaGUgb2xkIG5hbWVzcGFjZSB0aGF0IHRoZSBvbGQga2V5IGJlbG9uZ3MgdG8uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIG1pZ3JhdGlvbi5mcm9tS2V5ICAgICAgICAgICAgICAgICAgVGhlIG9sZCBrZXkgbmFtZSB0byBtaWdyYXRlIGZyb20uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSAgIFttaWdyYXRpb24uZnJvbVN0b3JhZ2VUeXBlXSAgICAgICAgVGhlIHN0b3JhZ2UgdHlwZSB0byBtaWdyYXRlIGZyb20uIERlZmF1bHRzIHRvIHNhbWUgdHlwZSBhcyB3aGVyZSB5b3UgYXJlIG1pZ3JhdGluZyB0by5cclxuICogQHBhcmFtIHtib29sZWFufSAgW21pZ3JhdGlvbi5rZWVwT2xkRGF0YT1mYWxzZV0gICAgICBXaGV0aGVyIG9sZCBkYXRhIHNob3VsZCBiZSBrZXB0IGFmdGVyIGl0IGhhcyBiZWVuIG1pZ3JhdGVkLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICBbbWlncmF0aW9uLm92ZXJ3cml0ZU5ld0RhdGE9ZmFsc2VdIFdoZXRoZXIgb2xkIGRhdGEgc2hvdWxkIG92ZXJ3cml0ZSBjdXJyZW50bHkgc3RvcmVkIGRhdGEgaWYgaXQgZXhpc3RzLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbbWlncmF0aW9uLnRyYW5zZm9ybV0gICAgICAgICAgICAgIFRoZSBmdW5jdGlvbiB0byBwYXNzIHRoZSBvbGQga2V5IGRhdGEgdGhyb3VnaCBiZWZvcmUgbWlncmF0aW5nLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBcclxuICogICAgIHZhciBTdG9yZSA9IHJlcXVpcmUoJ3N0b3JhZ2Utd3JhcHBlcicpO1xyXG4gKiAgICAgdmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuICogICAgICAgICBuYW1lc3BhY2U6ICdteU5ld0FwcCdcclxuICogICAgIH0pO1xyXG4gKlxyXG4gKiAgICAgLy8gTWlncmF0ZSBmcm9tIHRoZSBvbGQgYXBwLlxyXG4gKiAgICAgc3RvcmUubWlncmF0ZSh7XHJcbiAqICAgICAgICAgdG9LZXk6ICduZXcta2V5JyxcclxuICogICAgICAgICBmcm9tTmFtZXNwYWNlOiAnbXlPbGRBcHAnLFxyXG4gKiAgICAgICAgIGZyb21LZXk6ICdvbGQta2V5J1xyXG4gKiAgICAgfSk7XHJcbiAqICAgICBcclxuICogICAgIC8vIE1pZ3JhdGUgZnJvbSBnbG9iYWwgZGF0YS4gVXNlZnVsIHdoZW4gbW92aW5nIGZyb20gb3RoZXIgc3RvcmFnZSB3cmFwcGVycyBvciByZWd1bGFyIG9sJyBgbG9jYWxTdG9yYWdlYC5cclxuICogICAgIHN0b3JlLm1pZ3JhdGUoe1xyXG4gKiAgICAgICAgIHRvS2V5OiAnb3RoZXItbmV3LWtleScsXHJcbiAqICAgICAgICAgZnJvbU5hbWVzcGFjZTogJycsXHJcbiAqICAgICAgICAgZnJvbUtleTogJ290aGVyLW9sZC1rZXktb24tZ2xvYmFsJ1xyXG4gKiAgICAgfSk7XHJcbiAqICAgICBcclxuICogICAgIC8vIE1pZ3JhdGUgc29tZSBKU09OIGRhdGEgdGhhdCB3YXMgc3RvcmVkIGFzIGEgc3RyaW5nLlxyXG4gKiAgICAgc3RvcmUubWlncmF0ZSh7XHJcbiAqICAgICAgICAgdG9LZXk6ICduZXctanNvbi1rZXknLFxyXG4gKiAgICAgICAgIGZyb21OYW1lc3BhY2U6ICdteU9sZEFwcCcsXHJcbiAqICAgICAgICAgZnJvbUtleTogJ29sZC1qc29uLWtleScsXHJcbiAqICAgICAgICAgLy8gVHJ5IGNvbnZlcnRpbmcgc29tZSBvbGQgSlNPTiBkYXRhLlxyXG4gKiAgICAgICAgIHRyYW5zZm9ybTogZnVuY3Rpb24gKGRhdGEpIHtcclxuICogICAgICAgICAgICAgdHJ5IHtcclxuICogICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpO1xyXG4gKiAgICAgICAgICAgICB9XHJcbiAqICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAqICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICogICAgICAgICAgICAgfVxyXG4gKiAgICAgICAgIH1cclxuICogICAgIH0pO1xyXG4gKi9cclxuXHJcblN0b3JlLnByb3RvdHlwZS5taWdyYXRlID0gZnVuY3Rpb24gKG1pZ3JhdGlvbikge1xyXG5cdC8vIFNhdmUgb3VyIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG5cdHZhciB0b05hbWVzcGFjZSA9IHRoaXMuZ2V0TmFtZXNwYWNlKCk7XHJcblx0dmFyIHRvU3RvcmFnZVR5cGUgPSB0aGlzLmdldFN0b3JhZ2VUeXBlKCk7XHJcblxyXG5cdC8vIENyZWF0ZSBhIHRlbXBvcmFyeSBzdG9yZSB0byBhdm9pZCBjaGFuZ2luZyBuYW1lc3BhY2UgZHVyaW5nIGFjdHVhbCBnZXQvc2V0cy5cclxuXHR2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG5cdFx0bmFtZXNwYWNlOiB0b05hbWVzcGFjZSxcclxuXHRcdHN0b3JhZ2VUeXBlOiB0b1N0b3JhZ2VUeXBlXHJcblx0fSk7XHJcblxyXG5cdHZhciBkYXRhID0gbnVsbDtcclxuXHJcblx0Ly8gR2V0IGRhdGEgZnJvbSBvbGQgbmFtZXNwYWNlLlxyXG5cdHN0b3JlLnNldE5hbWVzcGFjZShtaWdyYXRpb24uZnJvbU5hbWVzcGFjZSk7XHJcblx0aWYgKHR5cGVvZiBtaWdyYXRpb24uZnJvbVN0b3JhZ2VUeXBlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0c3RvcmUuc2V0U3RvcmFnZVR5cGUobWlncmF0aW9uLmZyb21TdG9yYWdlVHlwZSk7XHJcblx0fVxyXG5cdGRhdGEgPSBzdG9yZS5nZXQobWlncmF0aW9uLmZyb21LZXkpO1xyXG5cclxuXHQvLyBSZW1vdmUgb2xkIGlmIG5lZWRlZC5cclxuXHRpZiAoIW1pZ3JhdGlvbi5rZWVwT2xkRGF0YSkge1xyXG5cdFx0c3RvcmUucmVtb3ZlKG1pZ3JhdGlvbi5mcm9tS2V5KTtcclxuXHR9XHJcblx0XHJcblx0Ly8gTm8gZGF0YSwgaWdub3JlIHRoaXMgbWlncmF0aW9uLlxyXG5cdGlmIChkYXRhID09PSBudWxsKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHQvLyBUcmFuc2Zvcm0gZGF0YSBpZiBuZWVkZWQuXHJcblx0aWYgKHR5cGVvZiBtaWdyYXRpb24udHJhbnNmb3JtID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRkYXRhID0gbWlncmF0aW9uLnRyYW5zZm9ybShkYXRhKTtcclxuXHR9XHJcblx0ZWxzZSBpZiAodHlwZW9mIG1pZ3JhdGlvbi50cmFuc2Zvcm0gIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdHJhbnNmb3JtIGNhbGxiYWNrLicpO1xyXG5cdH1cclxuXHJcblx0Ly8gR28gYmFjayB0byBjdXJyZW50IG5hbWVzcGFjZS5cclxuXHRzdG9yZS5zZXROYW1lc3BhY2UodG9OYW1lc3BhY2UpO1xyXG5cdHN0b3JlLnNldFN0b3JhZ2VUeXBlKHRvU3RvcmFnZVR5cGUpO1xyXG5cclxuXHQvLyBPbmx5IG92ZXJ3cml0ZSBuZXcgZGF0YSBpZiBpdCBkb2Vzbid0IGV4aXN0IG9yIGl0J3MgcmVxdWVzdGVkLlxyXG5cdGlmIChzdG9yZS5nZXQobWlncmF0aW9uLnRvS2V5KSA9PT0gbnVsbCB8fCBtaWdyYXRpb24ub3ZlcndyaXRlTmV3RGF0YSkge1xyXG5cdFx0c3RvcmUuc2V0KG1pZ3JhdGlvbi50b0tleSwgZGF0YSk7XHJcblx0fVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBzdWJzdG9yZSB0aGF0IGlzIG5lc3RlZCBpbiB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgY3JlYXRlU3Vic3RvcmVcclxuICogQHBhcmFtICB7c3RyaW5nfSBuYW1lc3BhY2UgVGhlIHN1YnN0b3JlJ3MgbmFtZXNwYWNlLlxyXG4gKiBAcmV0dXJuIHtTdG9yZX0gICAgICAgICAgICBUaGUgc3Vic3RvcmUuXHJcbiAqIEBleGFtcGxlXHJcbiAqIFxyXG4gKiAgICAgdmFyIFN0b3JlID0gcmVxdWlyZSgnc3RvcmFnZS13cmFwcGVyJyk7XHJcbiAqICAgICAvLyBDcmVhdGUgbWFpbiBzdG9yZS5cclxuICogICAgIHZhciBzdG9yZSA9IG5ldyBTdG9yZSh7XHJcbiAqICAgICAgICAgbmFtZXNwYWNlOiAnbXlhcHAnXHJcbiAqICAgICB9KTtcclxuICpcclxuICogICAgIC8vIENyZWF0ZSBzdWJzdG9yZS5cclxuICogICAgIHZhciBzdWJzdG9yZSA9IHN0b3JlLmNyZWF0ZVN1YnN0b3JlKCd0aGluZ3MnKTtcclxuICogICAgIHN1YnN0b3JlLnNldCgnZm9vJywgJ2JhcicpO1xyXG4gKlxyXG4gKiAgICAgc3Vic3RvcmUuZ2V0KCdmb28nKSA9PT0gc3RvcmUuZ2V0KCd0aGluZ3M6Zm9vJyk7XHJcbiAqICAgICAvLyB0cnVlXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUuY3JlYXRlU3Vic3RvcmUgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XHJcblx0cmV0dXJuIG5ldyBTdG9yZSh7XHJcblx0XHRuYW1lc3BhY2U6IHRoaXMuZ2V0TmFtZXNwYWNlKHRydWUpICsgbmFtZXNwYWNlLFxyXG5cdFx0c3RvcmFnZVR5cGU6IHRoaXMuZ2V0U3RvcmFnZVR5cGUoKVxyXG5cdH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTdG9yZTtcclxuIiwibW9kdWxlLmV4cG9ydHM9e1xyXG4gIFwibmFtZVwiOiBcInR3aXRjaC1jaGF0LWVtb3Rlc1wiLFxyXG4gIFwidmVyc2lvblwiOiBcIjIuMS4xXCIsXHJcbiAgXCJob21lcGFnZVwiOiBcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvXCIsXHJcbiAgXCJidWdzXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2NsZXR1c2MvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL2lzc3Vlc1wiLFxyXG4gIFwiYXV0aG9yXCI6IFwiUnlhbiBDaGF0aGFtIDxyeWFuLmIuY2hhdGhhbUBnbWFpbC5jb20+IChodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYylcIixcclxuICBcInJlcG9zaXRvcnlcIjoge1xyXG4gICAgXCJ0eXBlXCI6IFwiZ2l0XCIsXHJcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy5naXRcIlxyXG4gIH0sXHJcbiAgXCJ1c2Vyc2NyaXB0XCI6IHtcclxuICAgIFwibmFtZVwiOiBcIlR3aXRjaCBDaGF0IEVtb3Rlc1wiLFxyXG4gICAgXCJuYW1lc3BhY2VcIjogXCIjQ2xldHVzXCIsXHJcbiAgICBcInZlcnNpb25cIjogXCJ7e3twa2cudmVyc2lvbn19fVwiLFxyXG4gICAgXCJkZXNjcmlwdGlvblwiOiBcIkFkZHMgYSBidXR0b24gdG8gVHdpdGNoIHRoYXQgYWxsb3dzIHlvdSB0byBcXFwiY2xpY2stdG8taW5zZXJ0XFxcIiBhbiBlbW90ZS5cIixcclxuICAgIFwiY29weXJpZ2h0XCI6IFwiMjAxMSssIHt7e3BrZy5hdXRob3J9fX1cIixcclxuICAgIFwiYXV0aG9yXCI6IFwie3t7cGtnLmF1dGhvcn19fVwiLFxyXG4gICAgXCJpY29uXCI6IFwiaHR0cDovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyLnBocD9ncmF2YXRhcl9pZD02ODc1ZTgzYWE2YzU2Mzc5MGNiMmRhOTE0YWFiYThiMyZyPVBHJnM9NDgmZGVmYXVsdD1pZGVudGljb25cIixcclxuICAgIFwibGljZW5zZVwiOiBbXHJcbiAgICAgIFwiTUlUOyBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvTUlUXCIsXHJcbiAgICAgIFwiQ0MgQlktTkMtU0EgMy4wOyBodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1uYy1zYS8zLjAvXCJcclxuICAgIF0sXHJcbiAgICBcImhvbWVwYWdlXCI6IFwie3t7cGtnLmhvbWVwYWdlfX19XCIsXHJcbiAgICBcInN1cHBvcnRVUkxcIjogXCJ7e3twa2cuYnVnc319fVwiLFxyXG4gICAgXCJjb250cmlidXRpb25VUkxcIjogXCJodHRwOi8vY2xldHVzYy5naXRodWIuaW8vVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzLyNkb25hdGVcIixcclxuICAgIFwiZ3JhbnRcIjogXCJub25lXCIsXHJcbiAgICBcImluY2x1ZGVcIjogW1xyXG4gICAgICBcImh0dHA6Ly8qLnR3aXRjaC50di8qXCIsXHJcbiAgICAgIFwiaHR0cHM6Ly8qLnR3aXRjaC50di8qXCJcclxuICAgIF0sXHJcbiAgICBcImV4Y2x1ZGVcIjogW1xyXG4gICAgICBcImh0dHA6Ly9hcGkudHdpdGNoLnR2LypcIixcclxuICAgICAgXCJodHRwczovL2FwaS50d2l0Y2gudHYvKlwiLFxyXG4gICAgICBcImh0dHA6Ly90bWkudHdpdGNoLnR2LypcIixcclxuICAgICAgXCJodHRwczovL3RtaS50d2l0Y2gudHYvKlwiLFxyXG4gICAgICBcImh0dHA6Ly8qLnR3aXRjaC50di8qL2Rhc2hib2FyZFwiLFxyXG4gICAgICBcImh0dHBzOi8vKi50d2l0Y2gudHYvKi9kYXNoYm9hcmRcIixcclxuICAgICAgXCJodHRwOi8vY2hhdGRlcG90LnR3aXRjaC50di8qXCIsXHJcbiAgICAgIFwiaHR0cHM6Ly9jaGF0ZGVwb3QudHdpdGNoLnR2LypcIixcclxuICAgICAgXCJodHRwOi8vaW0udHdpdGNoLnR2LypcIixcclxuICAgICAgXCJodHRwczovL2ltLnR3aXRjaC50di8qXCIsXHJcbiAgICAgIFwiaHR0cDovL3BsYXRmb3JtLnR3aXR0ZXIuY29tLypcIixcclxuICAgICAgXCJodHRwczovL3BsYXRmb3JtLnR3aXR0ZXIuY29tLypcIixcclxuICAgICAgXCJodHRwOi8vd3d3LmZhY2Vib29rLmNvbS8qXCIsXHJcbiAgICAgIFwiaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tLypcIlxyXG4gICAgXVxyXG4gIH0sXHJcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xyXG4gICAgXCJicm93c2VyLXN5bmNcIjogXCJeMS4zLjJcIixcclxuICAgIFwiYnJvd3NlcmlmeVwiOiBcIl41LjkuMVwiLFxyXG4gICAgXCJnZW5lcmF0ZS11c2Vyc2NyaXB0LWhlYWRlclwiOiBcIl4xLjAuMFwiLFxyXG4gICAgXCJndWxwXCI6IFwiXjMuOC4zXCIsXHJcbiAgICBcImd1bHAtYXV0b3ByZWZpeGVyXCI6IFwiMC4wLjhcIixcclxuICAgIFwiZ3VscC1iZWF1dGlmeVwiOiBcIjEuMS4wXCIsXHJcbiAgICBcImd1bHAtY2hhbmdlZFwiOiBcIl4wLjQuMVwiLFxyXG4gICAgXCJndWxwLWNvbmNhdFwiOiBcIl4yLjIuMFwiLFxyXG4gICAgXCJndWxwLWNvbmZsaWN0XCI6IFwiXjAuMS4yXCIsXHJcbiAgICBcImd1bHAtY3NzLWJhc2U2NFwiOiBcIl4xLjEuMFwiLFxyXG4gICAgXCJndWxwLWNzczJqc1wiOiBcIl4xLjAuMlwiLFxyXG4gICAgXCJndWxwLWhlYWRlclwiOiBcIl4xLjAuMlwiLFxyXG4gICAgXCJndWxwLWhvZ2FuLWNvbXBpbGVcIjogXCJeMC4yLjFcIixcclxuICAgIFwiZ3VscC1taW5pZnktY3NzXCI6IFwiXjAuMy41XCIsXHJcbiAgICBcImd1bHAtbm90aWZ5XCI6IFwiXjEuNC4xXCIsXHJcbiAgICBcImd1bHAtcmVuYW1lXCI6IFwiXjEuMi4wXCIsXHJcbiAgICBcImd1bHAtdWdsaWZ5XCI6IFwiXjAuMy4xXCIsXHJcbiAgICBcImd1bHAtdXRpbFwiOiBcIl4zLjAuMFwiLFxyXG4gICAgXCJob2dhbi5qc1wiOiBcIl4zLjAuMlwiLFxyXG4gICAgXCJqcXVlcnktdWlcIjogXCJeMS4xMC41XCIsXHJcbiAgICBcImpxdWVyeS5zY3JvbGxiYXJcIjogXCJeMC4yLjdcIixcclxuICAgIFwicHJldHR5LWhydGltZVwiOiBcIl4wLjIuMVwiLFxyXG4gICAgXCJzdG9yYWdlLXdyYXBwZXJcIjogXCJjbGV0dXNjL3N0b3JhZ2Utd3JhcHBlciN2MC4xLjFcIixcclxuICAgIFwidmlueWwtbWFwXCI6IFwiXjEuMC4xXCIsXHJcbiAgICBcInZpbnlsLXNvdXJjZS1zdHJlYW1cIjogXCJeMC4xLjFcIixcclxuICAgIFwid2F0Y2hpZnlcIjogXCJeMS4wLjFcIlxyXG4gIH1cclxufVxyXG4iLCJ2YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKTtcclxudmFyIGFwaSA9IHt9O1xyXG52YXIgZW1iZXIgPSBudWxsO1xyXG52YXIgaG9va2VkRmFjdG9yaWVzID0ge307XHJcblxyXG5hcGkuZ2V0RW1iZXIgPSBmdW5jdGlvbiAoKSB7XHJcblx0aWYgKGVtYmVyKSB7XHJcblx0XHRyZXR1cm4gZW1iZXI7XHJcblx0fVxyXG5cdGlmICh3aW5kb3cuQXBwICYmIHdpbmRvdy5BcHAuX19jb250YWluZXJfXykge1xyXG5cdFx0ZW1iZXIgPSB3aW5kb3cuQXBwLl9fY29udGFpbmVyX187XHJcblx0XHRyZXR1cm4gZW1iZXI7XHJcblx0fVxyXG5cdHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbmFwaS5pc0xvYWRlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gQm9vbGVhbihhcGkuZ2V0RW1iZXIoKSk7XHJcbn07XHJcblxyXG5hcGkubG9va3VwID0gZnVuY3Rpb24gKGxvb2t1cEZhY3RvcnkpIHtcclxuXHRpZiAoIWFwaS5pc0xvYWRlZCgpKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgbG9va3VwIGZhaWx1cmUsIEVtYmVyIG5vdCBsb2FkZWQuJyk7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cdHJldHVybiBhcGkuZ2V0RW1iZXIoKS5sb29rdXAobG9va3VwRmFjdG9yeSk7XHJcbn07XHJcblxyXG5hcGkuaG9vayA9IGZ1bmN0aW9uIChsb29rdXBGYWN0b3J5LCBhY3RpdmF0ZUNiLCBkZWFjdGl2YXRlQ2IpIHtcclxuXHRpZiAoIWFwaS5pc0xvYWRlZCgpKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9vayBmYWlsdXJlLCBFbWJlciBub3QgbG9hZGVkLicpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHRpZiAoaG9va2VkRmFjdG9yaWVzW2xvb2t1cEZhY3RvcnldKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgYWxyZWFkeSBob29rZWQ6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHR2YXIgcmVvcGVuT3B0aW9ucyA9IHt9O1xyXG5cdHZhciBmYWN0b3J5ID0gYXBpLmxvb2t1cChsb29rdXBGYWN0b3J5KTtcclxuXHJcblx0aWYgKCFmYWN0b3J5KSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9vayBmYWlsdXJlLCBmYWN0b3J5IG5vdCBmb3VuZDogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHJcblx0aWYgKGFjdGl2YXRlQ2IpIHtcclxuXHRcdHJlb3Blbk9wdGlvbnMuYWN0aXZhdGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHRoaXMuX3N1cGVyKCk7XHJcblx0XHRcdGFjdGl2YXRlQ2IuY2FsbCh0aGlzKTtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdIb29rIHJ1biBvbiBhY3RpdmF0ZTogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0fTtcclxuXHR9XHJcblx0aWYgKGRlYWN0aXZhdGVDYikge1xyXG5cdFx0cmVvcGVuT3B0aW9ucy5kZWFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHR0aGlzLl9zdXBlcigpO1xyXG5cdFx0XHRkZWFjdGl2YXRlQ2IuY2FsbCh0aGlzKTtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdIb29rIHJ1biBvbiBkZWFjdGl2YXRlOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0dHJ5IHtcclxuXHRcdGZhY3RvcnkucmVvcGVuKHJlb3Blbk9wdGlvbnMpO1xyXG5cdFx0aG9va2VkRmFjdG9yaWVzW2xvb2t1cEZhY3RvcnldID0gdHJ1ZTtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmFjdG9yeSBob29rZWQ6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHRjYXRjaCAoZXJyKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9vayBmYWlsdXJlLCB1bmV4cGVjdGVkIGVycm9yOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHRsb2dnZXIuZGVidWcoZXJyKTtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcbn07XHJcblxyXG5hcGkuZ2V0ID0gZnVuY3Rpb24gKGxvb2t1cEZhY3RvcnksIHByb3BlcnR5KSB7XHJcblx0aWYgKCFhcGkuaXNMb2FkZWQoKSkge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGYWN0b3J5IGdldCBmYWlsdXJlLCBFbWJlciBub3QgbG9hZGVkLicpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHR2YXIgcHJvcGVydGllcyA9IHByb3BlcnR5LnNwbGl0KCcuJyk7XHJcblx0dmFyIGdldHRlciA9IGFwaS5sb29rdXAobG9va3VwRmFjdG9yeSk7XHJcblxyXG5cdHByb3BlcnRpZXMuc29tZShmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuXHRcdC8vIElmIGdldHRlciBmYWlscywganVzdCBleGl0LCBvdGhlcndpc2UsIGtlZXAgbG9vcGluZy5cclxuXHRcdGlmICh0eXBlb2YgZ2V0dGVyLmdldCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZ2V0dGVyLmdldChwcm9wZXJ0eSkgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdGdldHRlciA9IGdldHRlci5nZXQocHJvcGVydHkpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIGdldHRlcltwcm9wZXJ0eV0gIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdGdldHRlciA9IGdldHRlcltwcm9wZXJ0eV07XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Z2V0dGVyID0gbnVsbDtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBnZXR0ZXI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwidmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XHJcbnZhciB1aSA9IHJlcXVpcmUoJy4vdWknKTtcclxudmFyIGFwaSA9IHt9O1xyXG52YXIgZW1vdGVTdG9yZSA9IG5ldyBFbW90ZVN0b3JlKCk7XHJcbnZhciAkID0gd2luZG93LmpRdWVyeTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgZW50aXJlIGVtb3RlIHN0b3Jpbmcgc3lzdGVtLlxyXG4gKi9cclxuZnVuY3Rpb24gRW1vdGVTdG9yZSgpIHtcclxuXHR2YXIgZ2V0dGVycyA9IHt9O1xyXG5cdHZhciBuYXRpdmVFbW90ZXMgPSB7fTtcclxuXHR2YXIgaGFzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0IGEgbGlzdCBvZiB1c2FibGUgZW1vdGljb25zLlxyXG5cdCAqIEBwYXJhbSAge2Z1bmN0aW9ufSBbZmlsdGVyc10gICAgICAgQSBmaWx0ZXIgbWV0aG9kIHRvIGxpbWl0IHdoYXQgZW1vdGVzIGFyZSByZXR1cm5lZC4gUGFzc2VkIHRvIEFycmF5I2ZpbHRlci5cclxuXHQgKiBAcGFyYW0gIHtmdW5jdGlvbnxzdHJpbmd9IFtzb3J0QnldIEhvdyB0aGUgZW1vdGVzIHNob3VsZCBiZSBzb3J0ZWQuIGBmdW5jdGlvbmAgd2lsbCBiZSBwYXNzZWQgdG8gc29ydCB2aWEgQXJyYXkjc29ydC4gYCdjaGFubmVsJ2Agc29ydHMgYnkgY2hhbm5lbCBuYW1lLCBnbG9iYWxzIGZpcnN0LiBBbGwgb3RoZXIgdmFsdWVzIChvciBvbWl0dGVkKSBzb3J0IGFscGhhbnVtZXJpY2FsbHkuXHJcblx0ICogQHBhcmFtICB7c3RyaW5nfSBbcmV0dXJuVHlwZV0gICAgICBgJ29iamVjdCdgIHdpbGwgcmV0dXJuIGluIG9iamVjdCBmb3JtYXQsIGUuZy4gYHsnS2FwcGEnOiBFbW90ZSguLi4pLCAuLi59YC4gQWxsIG90aGVyIHZhbHVlcyAob3Igb21pdHRlZCkgcmV0dXJuIGFuIGFycmF5IGZvcm1hdCwgZS5nLiBgW0Vtb3RlKC4uLiksIC4uLl1gLlxyXG5cdCAqIEByZXR1cm4ge29iamVjdHxhcnJheX0gICAgICAgICAgICAgU2VlIGByZXR1cm5UeXBlYCBwYXJhbS5cclxuXHQgKi9cclxuXHR0aGlzLmdldEVtb3RlcyA9IGZ1bmN0aW9uIChmaWx0ZXJzLCBzb3J0QnksIHJldHVyblR5cGUpIHtcclxuXHRcdHZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL3R3aXRjaC1hcGknKTtcclxuXHJcblx0XHQvLyBHZXQgbmF0aXZlIGVtb3Rlcy5cclxuXHRcdHZhciBlbW90ZXMgPSAkLmV4dGVuZCh7fSwgbmF0aXZlRW1vdGVzKTtcclxuXHJcblx0XHQvLyBQYXJzZSB0aGUgY3VzdG9tIGVtb3RlcyBwcm92aWRlZCBieSB0aGlyZCBwYXJ0eSBhZGRvbnMuXHJcblx0XHRPYmplY3Qua2V5cyhnZXR0ZXJzKS5mb3JFYWNoKGZ1bmN0aW9uIChnZXR0ZXJOYW1lKSB7XHJcblx0XHRcdC8vIFRyeSB0aGUgZ2V0dGVyLlxyXG5cdFx0XHR2YXIgcmVzdWx0cyA9IG51bGw7XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0cmVzdWx0cyA9IGdldHRlcnNbZ2V0dGVyTmFtZV0oKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaCAoZXJyKSB7XHJcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdFbW90ZSBnZXR0ZXIgYCcgKyBnZXR0ZXJOYW1lICsgJ2AgZmFpbGVkIHVuZXhwZWN0ZWRseSwgc2tpcHBpbmcuJywgZXJyLnRvU3RyaW5nKCkpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkocmVzdWx0cykpIHtcclxuXHRcdFx0XHRsb2dnZXIuZGVidWcoJ0Vtb3RlIGdldHRlciBgJyArIGdldHRlck5hbWUgKyAnYCBtdXN0IHJldHVybiBhbiBhcnJheSwgc2tpcHBpbmcuJyk7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBPdmVycmlkZSBuYXRpdmVzIGFuZCBwcmV2aW91cyBnZXR0ZXJzLlxyXG5cdFx0XHRyZXN1bHRzLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdC8vIENyZWF0ZSB0aGUgZW1vdGUuXHJcblx0XHRcdFx0XHR2YXIgaW5zdGFuY2UgPSBuZXcgRW1vdGUoZW1vdGUpO1xyXG5cclxuXHRcdFx0XHRcdC8vIEZvcmNlIHRoZSBnZXR0ZXIuXHJcblx0XHRcdFx0XHRpbnN0YW5jZS5zZXRHZXR0ZXJOYW1lKGdldHRlck5hbWUpO1xyXG5cclxuXHRcdFx0XHRcdC8vIEZvcmNlIGVtb3RlcyB3aXRob3V0IGNoYW5uZWxzIHRvIHRoZSBnZXR0ZXIncyBuYW1lLlxyXG5cdFx0XHRcdFx0aWYgKCFlbW90ZS5jaGFubmVsKSB7XHJcblx0XHRcdFx0XHRcdGluc3RhbmNlLnNldENoYW5uZWxOYW1lKGdldHRlck5hbWUpO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdC8vIEFkZC9vdmVycmlkZSBpdC5cclxuXHRcdFx0XHRcdGVtb3Rlc1tpbnN0YW5jZS5nZXRUZXh0KCldID0gaW5zdGFuY2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhdGNoIChlcnIpIHtcclxuXHRcdFx0XHRcdGxvZ2dlci5kZWJ1ZygnRW1vdGUgcGFyc2luZyBmb3IgZ2V0dGVyIGAnICsgZ2V0dGVyTmFtZSArICdgIGZhaWxlZCwgc2tpcHBpbmcuJywgZXJyLnRvU3RyaW5nKCksIGVtb3RlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gQ292ZXJ0IHRvIGFycmF5LlxyXG5cdFx0ZW1vdGVzID0gT2JqZWN0LmtleXMoZW1vdGVzKS5tYXAoZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRcdHJldHVybiBlbW90ZXNbZW1vdGVdO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gRmlsdGVyIHJlc3VsdHMuXHJcblx0XHRpZiAodHlwZW9mIGZpbHRlcnMgPT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0ZW1vdGVzID0gZW1vdGVzLmZpbHRlcihmaWx0ZXJzKTtcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Ly8gUmV0dXJuIGFzIGFuIG9iamVjdCBpZiByZXF1ZXN0ZWQuXHJcblx0XHRpZiAocmV0dXJuVHlwZSA9PT0gJ29iamVjdCcpIHtcclxuXHRcdFx0dmFyIGFzT2JqZWN0ID0ge307XHJcblx0XHRcdGVtb3Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0XHRcdGFzT2JqZWN0W2Vtb3RlLmdldFRleHQoKV0gPSBlbW90ZTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBhc09iamVjdDtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBTb3J0IHJlc3VsdHMuXHJcblx0XHRpZiAodHlwZW9mIHNvcnRCeSA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRlbW90ZXMuc29ydChzb3J0QnkpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAoc29ydEJ5ID09PSAnY2hhbm5lbCcpIHtcclxuXHRcdFx0ZW1vdGVzLnNvcnQoc29ydGluZy5hbGxFbW90ZXNDYXRlZ29yeSk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0ZW1vdGVzLnNvcnQoc29ydGluZy5ieVRleHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFJldHVybiB0aGUgZW1vdGVzIGluIGFycmF5IGZvcm1hdC5cclxuXHRcdHJldHVybiBlbW90ZXM7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogUmVnaXN0ZXJzIGEgM3JkIHBhcnR5IGVtb3RlIGhvb2suXHJcblx0ICogQHBhcmFtICB7c3RyaW5nfSBuYW1lICAgVGhlIG5hbWUgb2YgdGhlIDNyZCBwYXJ0eSByZWdpc3RlcmluZyB0aGUgaG9vay5cclxuXHQgKiBAcGFyYW0gIHtmdW5jdGlvbn0gZ2V0dGVyIFRoZSBmdW5jdGlvbiBjYWxsZWQgd2hlbiBsb29raW5nIGZvciBlbW90ZXMuIE11c3QgcmV0dXJuIGFuIGFycmF5IG9mIGVtb3RlIG9iamVjdHMsIGUuZy4gYFtlbW90ZSwgLi4uXWAuIFNlZSBFbW90ZSBjbGFzcy5cclxuXHQgKi9cclxuXHR0aGlzLnJlZ2lzdGVyR2V0dGVyID0gZnVuY3Rpb24gKG5hbWUsIGdldHRlcikge1xyXG5cdFx0aWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ05hbWUgbXVzdCBiZSBhIHN0cmluZy4nKTtcclxuXHRcdH1cclxuXHRcdGlmIChnZXR0ZXJzW25hbWVdKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignR2V0dGVyIGFscmVhZHkgZXhpc3RzLicpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHR5cGVvZiBnZXR0ZXIgIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdHZXR0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG5cdFx0fVxyXG5cdFx0bG9nZ2VyLmRlYnVnKCdHZXR0ZXIgcmVnaXN0ZXJlZDogJyArIG5hbWUpO1xyXG5cdFx0Z2V0dGVyc1tuYW1lXSA9IGdldHRlcjtcclxuXHRcdHVpLnVwZGF0ZUVtb3RlcygpO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFJlZ2lzdGVycyBhIDNyZCBwYXJ0eSBlbW90ZSBob29rLlxyXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gbmFtZSAgIFRoZSBuYW1lIG9mIHRoZSAzcmQgcGFydHkgaG9vayB0byBkZXJlZ2lzdGVyLlxyXG5cdCAqL1xyXG5cdHRoaXMuZGVyZWdpc3RlckdldHRlciA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0dldHRlciB1bnJlZ2lzdGVyZWQ6ICcgKyBuYW1lKTtcclxuXHRcdGRlbGV0ZSBnZXR0ZXJzW25hbWVdO1xyXG5cdFx0dWkudXBkYXRlRW1vdGVzKCk7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogSW5pdGlhbGl6ZXMgdGhlIHJhdyBkYXRhIGZyb20gdGhlIEFQSSBlbmRwb2ludHMuIFNob3VsZCBiZSBjYWxsZWQgYXQgbG9hZCBhbmQvb3Igd2hlbmV2ZXIgdGhlIEFQSSBtYXkgaGF2ZSBjaGFuZ2VkLiBQb3B1bGF0ZXMgaW50ZXJuYWwgb2JqZWN0cyB3aXRoIHVwZGF0ZWQgZGF0YS5cclxuXHQgKi9cclxuXHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoaGFzSW5pdGlhbGl6ZWQpIHtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdBbHJlYWR5IGluaXRpYWxpemVkIEVtb3RlU3RvcmUsIHN0b3BwaW5nIGluaXQuJyk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsb2dnZXIuZGVidWcoJ1N0YXJ0aW5nIGluaXRpYWxpemF0aW9uLicpO1xyXG5cclxuXHRcdHZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL3R3aXRjaC1hcGknKTtcclxuXHRcdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0XHQvLyBIYXNoIG9mIGVtb3RlIHNldCB0byBmb3JjZWQgY2hhbm5lbC5cclxuXHRcdHZhciBmb3JjZWRTZXRzVG9DaGFubmVscyA9IHtcclxuXHRcdFx0Ly8gR2xvYmFscy5cclxuXHRcdFx0MDogJ35nbG9iYWwnLFxyXG5cdFx0XHQvLyBCdWJibGUgZW1vdGVzLlxyXG5cdFx0XHQzMzogJ3R1cmJvJyxcclxuXHRcdFx0Ly8gTW9ua2V5IGVtb3Rlcy5cclxuXHRcdFx0NDI6ICd0dXJibycsXHJcblx0XHRcdC8vIEhpZGRlbiB0dXJibyBlbW90ZXMuXHJcblx0XHRcdDQ1NzogJ3R1cmJvJyxcclxuXHRcdFx0NzkzOiAndHVyYm8nXHJcblx0XHR9O1xyXG5cclxuXHRcdGxvZ2dlci5kZWJ1ZygnSW5pdGlhbGl6aW5nIGVtb3RlIHNldCBjaGFuZ2UgbGlzdGVuZXIuJyk7XHJcblxyXG5cdFx0dHdpdGNoQXBpLm9uRW1vdGVzQ2hhbmdlKGZ1bmN0aW9uIChlbW90ZVNldHMpIHtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdQYXJzaW5nIGVtb3RlIHNldHMuJyk7XHJcblxyXG5cdFx0XHRPYmplY3Qua2V5cyhlbW90ZVNldHMpLmZvckVhY2goZnVuY3Rpb24gKHNldCkge1xyXG5cdFx0XHRcdHZhciBlbW90ZXMgPSBlbW90ZVNldHNbc2V0XTtcclxuXHRcdFx0XHRzZXQgPSBOdW1iZXIoc2V0KTtcclxuXHRcdFx0XHRlbW90ZXMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRcdC8vIFNldCBzb21lIHJlcXVpcmVkIGluZm8uXHJcblx0XHRcdFx0XHRlbW90ZS51cmwgPSAnLy9zdGF0aWMtY2RuLmp0dm53Lm5ldC9lbW90aWNvbnMvdjEvJyArIGVtb3RlLmlkICsgJy8xLjAnO1xyXG5cdFx0XHRcdFx0ZW1vdGUudGV4dCA9IGdldEVtb3RlRnJvbVJlZ0V4KGVtb3RlLmNvZGUpO1xyXG5cdFx0XHRcdFx0ZW1vdGUuc2V0ID0gc2V0O1xyXG5cclxuXHRcdFx0XHRcdC8vIEhhcmRjb2RlIHRoZSBjaGFubmVscyBvZiBjZXJ0YWluIHNldHMuXHJcblx0XHRcdFx0XHRpZiAoZm9yY2VkU2V0c1RvQ2hhbm5lbHNbc2V0XSkge1xyXG5cdFx0XHRcdFx0XHRlbW90ZS5jaGFubmVsID0gZm9yY2VkU2V0c1RvQ2hhbm5lbHNbc2V0XTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHR2YXIgaW5zdGFuY2UgPSBuZXcgRW1vdGUoZW1vdGUpO1xyXG5cclxuXHRcdFx0XHRcdC8vIFNhdmUgdGhlIGVtb3RlIGZvciB1c2UgbGF0ZXIuXHJcblx0XHRcdFx0XHRuYXRpdmVFbW90ZXNbZW1vdGUudGV4dF0gPSBpbnN0YW5jZTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ0xvYWRpbmcgc3Vic2NyaXB0aW9uIGRhdGEuJyk7XHJcblxyXG5cdFx0XHQvLyBHZXQgYWN0aXZlIHN1YnNjcmlwdGlvbnMgdG8gZmluZCB0aGUgY2hhbm5lbHMuXHJcblx0XHRcdHR3aXRjaEFwaS5nZXRUaWNrZXRzKGZ1bmN0aW9uICh0aWNrZXRzKSB7XHJcblx0XHRcdFx0Ly8gSW5zdGFuY2VzIGZyb20gZWFjaCBjaGFubmVsIHRvIHByZWxvYWQgY2hhbm5lbCBkYXRhLlxyXG5cdFx0XHRcdHZhciBkZWZlcnJlZENoYW5uZWxHZXRzID0ge307XHJcblxyXG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZygnVGlja2V0cyBsb2FkZWQgZnJvbSB0aGUgQVBJLicsIHRpY2tldHMpO1xyXG5cdFx0XHRcdHRpY2tldHMuZm9yRWFjaChmdW5jdGlvbiAodGlja2V0KSB7XHJcblx0XHRcdFx0XHR2YXIgcHJvZHVjdCA9IHRpY2tldC5wcm9kdWN0O1xyXG5cdFx0XHRcdFx0dmFyIGNoYW5uZWwgPSBwcm9kdWN0Lm93bmVyX25hbWUgfHwgcHJvZHVjdC5zaG9ydF9uYW1lO1xyXG5cclxuXHRcdFx0XHRcdC8vIEdldCBzdWJzY3JpcHRpb25zIHdpdGggZW1vdGVzIG9ubHkuXHJcblx0XHRcdFx0XHRpZiAoIXByb2R1Y3QuZW1vdGljb25zIHx8ICFwcm9kdWN0LmVtb3RpY29ucy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQvLyBTZXQgdGhlIGNoYW5uZWwgb24gdGhlIGVtb3Rlcy5cclxuXHRcdFx0XHRcdHByb2R1Y3QuZW1vdGljb25zLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlKSB7XHJcblx0XHRcdFx0XHRcdHZhciBpbnN0YW5jZSA9IG5hdGl2ZUVtb3Rlc1tnZXRFbW90ZUZyb21SZWdFeChlbW90ZS5yZWdleCldO1xyXG5cdFx0XHRcdFx0XHRpbnN0YW5jZS5zZXRDaGFubmVsTmFtZShjaGFubmVsKTtcclxuXHJcblx0XHRcdFx0XHRcdC8vIFNhdmUgaW5zdGFuY2UgZm9yIGxhdGVyLCBidXQgb25seSBvbmUgaW5zdGFuY2UgcGVyIGNoYW5uZWwuXHJcblx0XHRcdFx0XHRcdGlmICghZGVmZXJyZWRDaGFubmVsR2V0c1tjaGFubmVsXSkge1xyXG5cdFx0XHRcdFx0XHRcdGRlZmVycmVkQ2hhbm5lbEdldHNbY2hhbm5lbF0gPSBpbnN0YW5jZTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRcdC8vIFByZWxvYWQgY2hhbm5lbCBkYXRhLlxyXG5cdFx0XHRcdE9iamVjdC5rZXlzKGRlZmVycmVkQ2hhbm5lbEdldHMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0XHRcdFx0dmFyIGluc3RhbmNlID0gZGVmZXJyZWRDaGFubmVsR2V0c1trZXldO1xyXG5cdFx0XHRcdFx0aW5zdGFuY2UuZ2V0Q2hhbm5lbEJhZGdlKCk7XHJcblx0XHRcdFx0XHRpbnN0YW5jZS5nZXRDaGFubmVsRGlzcGxheU5hbWUoKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR1aS51cGRhdGVFbW90ZXMoKTtcclxuXHRcdFx0fSk7XHJcblx0XHRcdHVpLnVwZGF0ZUVtb3RlcygpO1xyXG5cdFx0fSwgdHJ1ZSk7XHJcblxyXG5cdFx0aGFzSW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGaW5pc2hlZCBFbW90ZVN0b3JlIGluaXRpYWxpemF0aW9uLicpO1xyXG5cdH07XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBhIHNwZWNpZmljIGVtb3RlLCBpZiBhdmFpbGFibGUuXHJcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgIHRleHQgVGhlIHRleHQgb2YgdGhlIGVtb3RlIHRvIGdldC5cclxuICogQHJldHVybiB7RW1vdGV8bnVsbH0gICAgICBUaGUgRW1vdGUgaW5zdGFuY2Ugb2YgdGhlIGVtb3RlIG9yIGBudWxsYCBpZiBpdCBjb3VsZG4ndCBiZSBmb3VuZC5cclxuICovXHJcbkVtb3RlU3RvcmUucHJvdG90eXBlLmdldEVtb3RlID0gZnVuY3Rpb24gKHRleHQpIHtcclxuXHRyZXR1cm4gdGhpcy5nZXRFbW90ZXMobnVsbCwgbnVsbCwgJ29iamVjdCcpW3RleHRdIHx8IG51bGw7XHJcbn07XHJcblxyXG4vKipcclxuICogRW1vdGUgb2JqZWN0LlxyXG4gKiBAcGFyYW0ge29iamVjdH0gZGV0YWlscyAgICAgICAgICAgICAgT2JqZWN0IGRlc2NyaWJpbmcgdGhlIGVtb3RlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGV0YWlscy50ZXh0ICAgICAgICAgVGhlIHRleHQgdG8gdXNlIGluIHRoZSBjaGF0IGJveCB3aGVuIGVtb3RlIGlzIGNsaWNrZWQuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZXRhaWxzLnVybCAgICAgICAgICBUaGUgVVJMIG9mIHRoZSBpbWFnZSBmb3IgdGhlIGVtb3RlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RldGFpbHMuYmFkZ2VdICAgICAgVGhlIFVSTCBvZiB0aGUgYmFkZ2UgZm9yIHRoZSBlbW90ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IFtkZXRhaWxzLmNoYW5uZWxdICAgIFRoZSBjaGFubmVsIHRoZSBlbW90ZSBzaG91bGQgYmUgY2F0ZWdvcml6ZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZGV0YWlscy5nZXR0ZXJOYW1lXSBUaGUgM3JkIHBhcnR5IGdldHRlciB0aGF0IHJlZ2lzdGVyZWQgdGhlIGVtb3RlLiBVc2VkIGludGVybmFsbHkgb25seS5cclxuICovXHJcbmZ1bmN0aW9uIEVtb3RlKGRldGFpbHMpIHtcclxuXHR2YXIgdGV4dCA9IG51bGw7XHJcblx0dmFyIHVybCA9IG51bGw7XHJcblx0dmFyIGdldHRlck5hbWUgPSBudWxsO1xyXG5cdHZhciBjaGFubmVsID0ge1xyXG5cdFx0bmFtZTogbnVsbCxcclxuXHRcdGRpc3BsYXlOYW1lOiBudWxsLFxyXG5cdFx0YmFkZ2U6IG51bGxcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSB0ZXh0IG9mIHRoZSBlbW90ZS5cclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBlbW90ZSB0ZXh0LlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0VGV4dCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiB0ZXh0O1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIHRleHQgb2YgdGhlIGVtb3RlLlxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0aGVUZXh0IFRoZSB0ZXh0IHRvIHNldC5cclxuXHQgKi9cclxuXHR0aGlzLnNldFRleHQgPSBmdW5jdGlvbiAodGhlVGV4dCkge1xyXG5cdFx0aWYgKHR5cGVvZiB0aGVUZXh0ICE9PSAnc3RyaW5nJyB8fCB0aGVUZXh0Lmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRleHQnKTtcclxuXHRcdH1cclxuXHRcdHRleHQgPSB0aGVUZXh0O1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGdldHRlciBuYW1lIHRoaXMgZW1vdGUgYmVsb25ncyB0by5cclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBnZXR0ZXIncyBuYW1lLlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0R2V0dGVyTmFtZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBnZXR0ZXJOYW1lO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIGdldHRlciBuYW1lIHRoaXMgZW1vdGUgYmVsb25ncyB0by5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlR2V0dGVyTmFtZSBUaGUgZ2V0dGVyJ3MgbmFtZS5cclxuXHQgKi9cclxuXHR0aGlzLnNldEdldHRlck5hbWUgPSBmdW5jdGlvbiAodGhlR2V0dGVyTmFtZSkge1xyXG5cdFx0aWYgKHR5cGVvZiB0aGVHZXR0ZXJOYW1lICE9PSAnc3RyaW5nJyB8fCB0aGVHZXR0ZXJOYW1lLmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGdldHRlciBuYW1lJyk7XHJcblx0XHR9XHJcblx0XHRnZXR0ZXJOYW1lID0gdGhlR2V0dGVyTmFtZTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBlbW90ZSdzIGltYWdlIFVSTC5cclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBlbW90ZSBpbWFnZSBVUkwuXHJcblx0ICovXHJcblx0dGhpcy5nZXRVcmwgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdXJsO1xyXG5cdH07XHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgZW1vdGUncyBpbWFnZSBVUkwuXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRoZVVybCBUaGUgaW1hZ2UgVVJMIHRvIHNldC5cclxuXHQgKi9cclxuXHR0aGlzLnNldFVybCA9IGZ1bmN0aW9uICh0aGVVcmwpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlVXJsICE9PSAnc3RyaW5nJyB8fCB0aGVVcmwubGVuZ3RoIDwgMSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgVVJMJyk7XHJcblx0XHR9XHJcblx0XHR1cmwgPSB0aGVVcmw7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0cyB0aGUgZW1vdGUncyBjaGFubmVsIG5hbWUuXHJcblx0ICogQHJldHVybiB7c3RyaW5nfG51bGx9IFRoZSBlbW90ZSdzIGNoYW5uZWwgb3IgYG51bGxgIGlmIGl0IGRvZXNuJ3QgaGF2ZSBvbmUuXHJcblx0ICovXHJcblx0dGhpcy5nZXRDaGFubmVsTmFtZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghY2hhbm5lbC5uYW1lKSB7XHJcblx0XHRcdGNoYW5uZWwubmFtZSA9IHN0b3JhZ2UuY2hhbm5lbE5hbWVzLmdldCh0aGlzLmdldFRleHQoKSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gY2hhbm5lbC5uYW1lO1xyXG5cdH07XHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgZW1vdGUncyBjaGFubmVsIG5hbWUuXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRoZUNoYW5uZWwgVGhlIGNoYW5uZWwgbmFtZSB0byBzZXQuXHJcblx0ICovXHJcblx0dGhpcy5zZXRDaGFubmVsTmFtZSA9IGZ1bmN0aW9uICh0aGVDaGFubmVsKSB7XHJcblx0XHRpZiAodHlwZW9mIHRoZUNoYW5uZWwgIT09ICdzdHJpbmcnIHx8IHRoZUNoYW5uZWwubGVuZ3RoIDwgMSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2hhbm5lbCcpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIE9ubHkgc2F2ZSB0aGUgY2hhbm5lbCB0byBzdG9yYWdlIGlmIGl0J3MgZHluYW1pYy5cclxuXHRcdGlmICh0aGVDaGFubmVsICE9PSAnfmdsb2JhbCcgJiYgdGhlQ2hhbm5lbCAhPT0gJ3R1cmJvJykge1xyXG5cdFx0XHRzdG9yYWdlLmNoYW5uZWxOYW1lcy5zZXQodGhpcy5nZXRUZXh0KCksIHRoZUNoYW5uZWwpO1xyXG5cdFx0fVxyXG5cdFx0Y2hhbm5lbC5uYW1lID0gdGhlQ2hhbm5lbDtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBlbW90ZSBjaGFubmVsJ3MgYmFkZ2UgaW1hZ2UgVVJMLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ3xudWxsfSBUaGUgVVJMIG9mIHRoZSBiYWRnZSBpbWFnZSBmb3IgdGhlIGVtb3RlJ3MgY2hhbm5lbCBvciBgbnVsbGAgaWYgaXQgZG9lc24ndCBoYXZlIGEgY2hhbm5lbC5cclxuXHQgKi9cclxuXHR0aGlzLmdldENoYW5uZWxCYWRnZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL3R3aXRjaC1hcGknKTtcclxuXHRcdHZhciBjaGFubmVsTmFtZSA9IHRoaXMuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHRcdHZhciBkZWZhdWx0QmFkZ2UgPSAnLy9zdGF0aWMtY2RuLmp0dm53Lm5ldC9qdHZfdXNlcl9waWN0dXJlcy9zdWJzY3JpYmVyLXN0YXIucG5nJztcclxuXHJcblx0XHQvLyBObyBjaGFubmVsLlxyXG5cdFx0aWYgKCFjaGFubmVsTmFtZSkge1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHaXZlIGdsb2JhbHMgYSBkZWZhdWx0IGJhZGdlLlxyXG5cdFx0aWYgKGNoYW5uZWxOYW1lID09PSAnfmdsb2JhbCcpIHtcclxuXHRcdFx0cmV0dXJuIGRlZmF1bHRCYWRnZTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBBbHJlYWR5IGhhdmUgb25lIHByZXNldC5cclxuXHRcdGlmIChjaGFubmVsLmJhZGdlKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmJhZGdlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIENoZWNrIHN0b3JhZ2UuXHJcblx0XHRjaGFubmVsLmJhZGdlID0gc3RvcmFnZS5iYWRnZXMuZ2V0KGNoYW5uZWxOYW1lKTtcclxuXHRcdGlmIChjaGFubmVsLmJhZGdlICE9PSBudWxsKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmJhZGdlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFNldCBkZWZhdWx0IHVudGlsIEFQSSByZXR1cm5zIHNvbWV0aGluZy5cclxuXHRcdGNoYW5uZWwuYmFkZ2UgPSBkZWZhdWx0QmFkZ2U7XHJcblxyXG5cdFx0Ly8gR2V0IGZyb20gQVBJLlxyXG5cdFx0bG9nZ2VyLmRlYnVnKCdHZXR0aW5nIGZyZXNoIGJhZGdlIGZvcjogJyArIGNoYW5uZWxOYW1lKTtcclxuXHRcdHR3aXRjaEFwaS5nZXRCYWRnZXMoY2hhbm5lbE5hbWUsIGZ1bmN0aW9uIChiYWRnZXMpIHtcclxuXHRcdFx0dmFyIGJhZGdlID0gbnVsbDtcclxuXHJcblx0XHRcdC8vIFNhdmUgdHVyYm8gYmFkZ2Ugd2hpbGUgd2UgYXJlIGhlcmUuXHJcblx0XHRcdGlmIChiYWRnZXMudHVyYm8gJiYgYmFkZ2VzLnR1cmJvLmltYWdlKSB7XHJcblx0XHRcdFx0YmFkZ2UgPSBiYWRnZXMudHVyYm8uaW1hZ2U7XHJcblx0XHRcdFx0c3RvcmFnZS5iYWRnZXMuc2V0KCd0dXJibycsIGJhZGdlLCA4NjQwMDAwMCk7XHJcblxyXG5cdFx0XHRcdC8vIFR1cmJvIGlzIGFjdHVhbGx5IHdoYXQgd2Ugd2FudGVkLCBzbyB3ZSBhcmUgZG9uZS5cclxuXHRcdFx0XHRpZiAoY2hhbm5lbE5hbWUgPT09ICd0dXJibycpIHtcclxuXHRcdFx0XHRcdGNoYW5uZWwuYmFkZ2UgPSBiYWRnZTtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIFNhdmUgc3Vic2NyaWJlciBiYWRnZSBpbiBzdG9yYWdlLlxyXG5cdFx0XHRpZiAoYmFkZ2VzLnN1YnNjcmliZXIgJiYgYmFkZ2VzLnN1YnNjcmliZXIuaW1hZ2UpIHtcclxuXHRcdFx0XHRjaGFubmVsLmJhZGdlID0gYmFkZ2VzLnN1YnNjcmliZXIuaW1hZ2U7XHJcblx0XHRcdFx0c3RvcmFnZS5iYWRnZXMuc2V0KGNoYW5uZWxOYW1lLCBjaGFubmVsLmJhZGdlLCA4NjQwMDAwMCk7XHJcblx0XHRcdFx0dWkudXBkYXRlRW1vdGVzKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gTm8gc3Vic2NyaWJlciBiYWRnZS5cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y2hhbm5lbC5iYWRnZSA9IGRlZmF1bHRCYWRnZTtcclxuXHRcdFx0XHRsb2dnZXIuZGVidWcoJ0ZhaWxlZCB0byBnZXQgc3Vic2NyaWJlciBiYWRnZSBmb3I6ICcgKyBjaGFubmVsTmFtZSk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gY2hhbm5lbC5iYWRnZSB8fCBkZWZhdWx0QmFkZ2U7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgZW1vdGUncyBjaGFubmVsIGJhZGdlIGltYWdlIFVSTC5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlQmFkZ2UgVGhlIGJhZGdlIGltYWdlIFVSTCB0byBzZXQuXHJcblx0ICovXHJcblx0dGhpcy5zZXRDaGFubmVsQmFkZ2UgPSBmdW5jdGlvbiAodGhlQmFkZ2UpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlQmFkZ2UgIT09ICdzdHJpbmcnIHx8IHRoZUJhZGdlLmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhZGdlJyk7XHJcblx0XHR9XHJcblx0XHRjaGFubmVsLmJhZGdlID0gdGhlQmFkZ2U7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0IGEgY2hhbm5lbCdzIGRpc3BsYXkgbmFtZS5cclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjaGFubmVsJ3MgZGlzcGxheSBuYW1lLiBNYXkgYmUgZXF1aXZhbGVudCB0byB0aGUgY2hhbm5lbCB0aGUgZmlyc3QgdGltZSB0aGUgQVBJIG5lZWRzIHRvIGJlIGNhbGxlZC5cclxuXHQgKi9cclxuXHR0aGlzLmdldENoYW5uZWxEaXNwbGF5TmFtZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL3R3aXRjaC1hcGknKTtcclxuXHRcdHZhciBjaGFubmVsTmFtZSA9IHRoaXMuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHRcdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0XHR2YXIgZm9yY2VkQ2hhbm5lbFRvRGlzcGxheU5hbWVzID0ge1xyXG5cdFx0XHQnfmdsb2JhbCc6ICdHbG9iYWwnLFxyXG5cdFx0XHQndHVyYm8nOiAnVHVyYm8nXHJcblx0XHR9O1xyXG5cclxuXHRcdC8vIE5vIGNoYW5uZWwuXHJcblx0XHRpZiAoIWNoYW5uZWxOYW1lKSB7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEZvcmNlZCBkaXNwbGF5IG5hbWUuXHJcblx0XHRpZiAoZm9yY2VkQ2hhbm5lbFRvRGlzcGxheU5hbWVzW2NoYW5uZWxOYW1lXSkge1xyXG5cdFx0XHRyZXR1cm4gZm9yY2VkQ2hhbm5lbFRvRGlzcGxheU5hbWVzW2NoYW5uZWxOYW1lXTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBBbHJlYWR5IGhhdmUgb25lIHByZXNldC5cclxuXHRcdGlmIChjaGFubmVsLmRpc3BsYXlOYW1lKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmRpc3BsYXlOYW1lO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIExvb2sgZm9yIG9idmlvdXMgYmFkIGNoYW5uZWwgbmFtZXMgdGhhdCBzaG91bGRuJ3QgaGl0IHRoZSBBUEkgb3Igc3RvcmFnZS4gVXNlIGNoYW5uZWwgbmFtZSBpbnN0ZWFkLlxyXG5cdFx0aWYgKC9bXmEtejAtOV9dLy50ZXN0KGNoYW5uZWxOYW1lKSkge1xyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ1VuYWJsZSB0byBnZXQgZGlzcGxheSBuYW1lIGR1ZSB0byBvYnZpb3VzIG5vbi1zdGFuZGFyZCBjaGFubmVsIG5hbWUgZm9yOiAnICsgY2hhbm5lbE5hbWUpO1xyXG5cdFx0XHRyZXR1cm4gY2hhbm5lbE5hbWU7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gQ2hlY2sgc3RvcmFnZS5cclxuXHRcdGNoYW5uZWwuZGlzcGxheU5hbWUgPSBzdG9yYWdlLmRpc3BsYXlOYW1lcy5nZXQoY2hhbm5lbE5hbWUpO1xyXG5cdFx0aWYgKGNoYW5uZWwuZGlzcGxheU5hbWUgIT09IG51bGwpIHtcclxuXHRcdFx0cmV0dXJuIGNoYW5uZWwuZGlzcGxheU5hbWU7XHJcblx0XHR9XHJcblx0XHQvLyBHZXQgZnJvbSBBUEkuXHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Ly8gU2V0IGRlZmF1bHQgdW50aWwgQVBJIHJldHVybnMgc29tZXRoaW5nLlxyXG5cdFx0XHRjaGFubmVsLmRpc3BsYXlOYW1lID0gY2hhbm5lbE5hbWU7XHJcblxyXG5cdFx0XHRsb2dnZXIuZGVidWcoJ0dldHRpbmcgZnJlc2ggZGlzcGxheSBuYW1lIGZvcjogJyArIGNoYW5uZWxOYW1lKTtcclxuXHRcdFx0dHdpdGNoQXBpLmdldFVzZXIoY2hhbm5lbE5hbWUsIGZ1bmN0aW9uICh1c2VyKSB7XHJcblx0XHRcdFx0aWYgKCF1c2VyIHx8ICF1c2VyLmRpc3BsYXlfbmFtZSkge1xyXG5cdFx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdGYWlsZWQgdG8gZ2V0IGRpc3BsYXkgbmFtZSBmb3I6ICcgKyBjaGFubmVsTmFtZSk7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvLyBTYXZlIGl0LlxyXG5cdFx0XHRcdHNlbGYuc2V0Q2hhbm5lbERpc3BsYXlOYW1lKHVzZXIuZGlzcGxheV9uYW1lKTtcclxuXHRcdFx0XHR1aS51cGRhdGVFbW90ZXMoKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdHJldHVybiBjaGFubmVsLmRpc3BsYXlOYW1lO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIGVtb3RlJ3MgY2hhbm5lbCBiYWRnZSBpbWFnZSBVUkwuXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRoZUJhZGdlIFRoZSBiYWRnZSBpbWFnZSBVUkwgdG8gc2V0LlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0Q2hhbm5lbERpc3BsYXlOYW1lID0gZnVuY3Rpb24gKGRpc3BsYXlOYW1lKSB7XHJcblx0XHRpZiAodHlwZW9mIGRpc3BsYXlOYW1lICE9PSAnc3RyaW5nJyB8fCBkaXNwbGF5TmFtZS5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBkaXNwbGF5TmFtZScpO1xyXG5cdFx0fVxyXG5cdFx0Y2hhbm5lbC5kaXNwbGF5TmFtZSA9IGRpc3BsYXlOYW1lO1xyXG5cdFx0c3RvcmFnZS5kaXNwbGF5TmFtZXMuc2V0KHRoaXMuZ2V0Q2hhbm5lbE5hbWUoKSwgZGlzcGxheU5hbWUsIDg2NDAwMDAwKTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBJbml0aWFsaXplIHRoZSBkZXRhaWxzLlxyXG5cdCAqL1xyXG5cdFxyXG5cdC8vIFJlcXVpcmVkIGZpZWxkcy5cclxuXHR0aGlzLnNldFRleHQoZGV0YWlscy50ZXh0KTtcclxuXHR0aGlzLnNldFVybChkZXRhaWxzLnVybCk7XHJcblxyXG5cdC8vIE9wdGlvbmFsIGZpZWxkcy5cclxuXHRpZiAoZGV0YWlscy5nZXR0ZXJOYW1lKSB7XHJcblx0XHR0aGlzLnNldEdldHRlck5hbWUoZGV0YWlscy5nZXR0ZXJOYW1lKTtcclxuXHR9XHJcblx0aWYgKGRldGFpbHMuY2hhbm5lbCkge1xyXG5cdFx0dGhpcy5zZXRDaGFubmVsTmFtZShkZXRhaWxzLmNoYW5uZWwpO1xyXG5cdH1cclxuXHRpZiAoZGV0YWlscy5jaGFubmVsRGlzcGxheU5hbWUpIHtcclxuXHRcdHRoaXMuc2V0Q2hhbm5lbERpc3BsYXlOYW1lKGRldGFpbHMuY2hhbm5lbERpc3BsYXlOYW1lKTtcclxuXHR9XHJcblx0aWYgKGRldGFpbHMuYmFkZ2UpIHtcclxuXHRcdHRoaXMuc2V0Q2hhbm5lbEJhZGdlKGRldGFpbHMuYmFkZ2UpO1xyXG5cdH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGF0ZSBjaGFuZ2Vycy5cclxuICovXHJcblxyXG4vKipcclxuICogVG9nZ2xlIHdoZXRoZXIgYW4gZW1vdGUgc2hvdWxkIGJlIGEgZmF2b3JpdGUuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBgdHJ1ZWAgZm9yY2VzIHRoZSBlbW90ZSB0byBiZSBhIGZhdm9yaXRlLCBgZmFsc2VgIGZvcmNlcyB0aGUgZW1vdGUgdG8gbm90IGJlIGEgZmF2b3JpdGUuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUudG9nZ2xlRmF2b3JpdGUgPSBmdW5jdGlvbiAoZm9yY2UpIHtcclxuXHRpZiAodHlwZW9mIGZvcmNlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0c3RvcmFnZS5zdGFycmVkLnNldCh0aGlzLmdldFRleHQoKSwgISFmb3JjZSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdHN0b3JhZ2Uuc3RhcnJlZC5zZXQodGhpcy5nZXRUZXh0KCksICF0aGlzLmlzRmF2b3JpdGUoKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogVG9nZ2xlIHdoZXRoZXIgYW4gZW1vdGUgc2hvdWxkIGJlIHZpc2libGUgb3V0IG9mIGVkaXRpbmcgbW9kZS5cclxuICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIGB0cnVlYCBmb3JjZXMgdGhlIGVtb3RlIHRvIGJlIHZpc2libGUsIGBmYWxzZWAgZm9yY2VzIHRoZSBlbW90ZSB0byBiZSBoaWRkZW4uXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUudG9nZ2xlVmlzaWJpbGl0eSA9IGZ1bmN0aW9uIChmb3JjZSkge1xyXG5cdGlmICh0eXBlb2YgZm9yY2UgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRzdG9yYWdlLnZpc2liaWxpdHkuc2V0KHRoaXMuZ2V0VGV4dCgpLCAhIWZvcmNlKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0c3RvcmFnZS52aXNpYmlsaXR5LnNldCh0aGlzLmdldFRleHQoKSwgIXRoaXMuaXNWaXNpYmxlKCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXRlIGdldHRlcnMuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIGlzIGZyb20gYSAzcmQgcGFydHkuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIGlzIGZyb20gYSAzcmQgcGFydHkuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNUaGlyZFBhcnR5ID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiAhIXRoaXMuZ2V0R2V0dGVyTmFtZSgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIHdhcyBmYXZvcml0ZWQuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIHdhcyBmYXZvcml0ZWQuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNGYXZvcml0ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gc3RvcmFnZS5zdGFycmVkLmdldCh0aGlzLmdldFRleHQoKSwgZmFsc2UpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIGlzIHZpc2libGUgb3V0c2lkZSBvZiBlZGl0aW5nIG1vZGUuXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGVtb3RlIGlzIHZpc2libGUgb3V0c2lkZSBvZiBlZGl0aW5nIG1vZGUuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiBzdG9yYWdlLnZpc2liaWxpdHkuZ2V0KHRoaXMuZ2V0VGV4dCgpLCB0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHRoZSBlbW90ZSBpcyBjb25zaWRlcmVkIGEgc2ltcGxlIHNtaWxleS5cclxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZW1vdGUgaXMgY29uc2lkZXJlZCBhIHNpbXBsZSBzbWlsZXkuXHJcbiAqL1xyXG5FbW90ZS5wcm90b3R5cGUuaXNTbWlsZXkgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gVGhlIGJhc2ljIHNtaWxleSBlbW90ZXMuXHJcblx0dmFyIGVtb3RlcyA9IFsnOignLCAnOiknLCAnOi8nLCAnOlxcXFwnLCAnOkQnLCAnOm8nLCAnOnAnLCAnOnonLCAnOyknLCAnO3AnLCAnPDMnLCAnPignLCAnQiknLCAnUiknLCAnb19vJywgJ09fTycsICcjLycsICc6NycsICc6PicsICc6UycsICc8XSddO1xyXG5cdHJldHVybiBlbW90ZXMuaW5kZXhPZih0aGlzLmdldFRleHQoKSkgIT09IC0xO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFByb3BlcnR5IGdldHRlcnMvc2V0dGVycy5cclxuICovXHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgdXNhYmxlIGVtb3RlIHRleHQgZnJvbSBhIHJlZ2V4LlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RW1vdGVGcm9tUmVnRXgocmVnZXgpIHtcclxuXHRpZiAodHlwZW9mIHJlZ2V4ID09PSAnc3RyaW5nJykge1xyXG5cdFx0cmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4KTtcclxuXHR9XHJcblx0aWYgKCFyZWdleCkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdgcmVnZXhgIG11c3QgYmUgYSBSZWdFeHAgc3RyaW5nIG9yIG9iamVjdC4nKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBkZWNvZGVVUkkocmVnZXguc291cmNlKVxyXG5cclxuXHRcdC8vIFJlcGxhY2UgSFRNTCBlbnRpdHkgYnJhY2tldHMgd2l0aCBhY3R1YWwgYnJhY2tldHMuXHJcblx0XHQucmVwbGFjZSgnJmd0XFxcXDsnLCAnPicpXHJcblx0XHQucmVwbGFjZSgnJmx0XFxcXDsnLCAnPCcpXHJcblxyXG5cdFx0Ly8gUmVtb3ZlIG5lZ2F0aXZlIGdyb3Vwcy5cclxuXHRcdC8vXHJcblx0XHQvLyAvXHJcblx0XHQvLyAgIFxcKFxcPyEgICAgICAgICAgICAgIC8vICg/IVxyXG5cdFx0Ly8gICBbXildKiAgICAgICAgICAgICAgLy8gYW55IGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCApXHJcblx0XHQvLyAgIFxcKSAgICAgICAgICAgICAgICAgLy8gKVxyXG5cdFx0Ly8gL2dcclxuXHRcdC5yZXBsYWNlKC9cXChcXD8hW14pXSpcXCkvZywgJycpXHJcblxyXG5cdFx0Ly8gUGljayBmaXJzdCBvcHRpb24gZnJvbSBhIGdyb3VwLlxyXG5cdFx0Ly9cclxuXHRcdC8vIC9cclxuXHRcdC8vICAgXFwoICAgICAgICAgICAgICAgICAvLyAoXHJcblx0XHQvLyAgIChbXnxdKSogICAgICAgICAgICAvLyBhbnkgYW1vdW50IG9mIGNoYXJhY3RlcnMgdGhhdCBhcmUgbm90IHxcclxuXHRcdC8vICAgXFx8PyAgICAgICAgICAgICAgICAvLyBhbiBvcHRpb25hbCB8IGNoYXJhY3RlclxyXG5cdFx0Ly8gICBbXildKiAgICAgICAgICAgICAgLy8gYW55IGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCApXHJcblx0XHQvLyAgIFxcKSAgICAgICAgICAgICAgICAgLy8gKVxyXG5cdFx0Ly8gL2dcclxuXHRcdC5yZXBsYWNlKC9cXCgoW158XSkqXFx8P1teKV0qXFwpL2csICckMScpXHJcblxyXG5cdFx0Ly8gUGljayBmaXJzdCBjaGFyYWN0ZXIgZnJvbSBhIGNoYXJhY3RlciBncm91cC5cclxuXHRcdC8vXHJcblx0XHQvLyAvXHJcblx0XHQvLyAgIFxcWyAgICAgICAgICAgICAgICAgLy8gW1xyXG5cdFx0Ly8gICAoW158XFxdXFxbXSkqICAgICAgICAvLyBhbnkgYW1vdW50IG9mIGNoYXJhY3RlcnMgdGhhdCBhcmUgbm90IHwsIFssIG9yIF1cclxuXHRcdC8vICAgXFx8PyAgICAgICAgICAgICAgICAvLyBhbiBvcHRpb25hbCB8IGNoYXJhY3RlclxyXG5cdFx0Ly8gICBbXlxcXV0qICAgICAgICAgICAgIC8vIGFueSBhbW91bnQgb2YgY2hhcmFjdGVycyB0aGF0IGFyZSBub3QgWywgb3IgXVxyXG5cdFx0Ly8gICBcXF0gICAgICAgICAgICAgICAgIC8vIF1cclxuXHRcdC8vIC9nXHJcblx0XHQucmVwbGFjZSgvXFxbKFtefFxcXVxcW10pKlxcfD9bXlxcXVxcW10qXFxdL2csICckMScpXHJcblxyXG5cdFx0Ly8gUmVtb3ZlIG9wdGlvbmFsIGNoYXJhY3RlcnMuXHJcblx0XHQvL1xyXG5cdFx0Ly8gL1xyXG5cdFx0Ly8gICBbXlxcXFxdICAgICAgICAgICAgICAvLyBhbnkgY2hhcmFjdGVyIHRoYXQgaXMgbm90IFxcXHJcblx0XHQvLyAgIFxcPyAgICAgICAgICAgICAgICAgLy8gP1xyXG5cdFx0Ly8gL2dcclxuXHRcdC5yZXBsYWNlKC9bXlxcXFxdXFw/L2csICcnKVxyXG5cclxuXHRcdC8vIFJlbW92ZSBib3VuZGFyaWVzIGF0IGJlZ2lubmluZyBhbmQgZW5kLlxyXG5cdFx0LnJlcGxhY2UoL15cXFxcYnxcXFxcYiQvZywgJycpIFxyXG5cclxuXHRcdC8vIFVuZXNjYXBlIG9ubHkgc2luZ2xlIGJhY2tzbGFzaCwgbm90IG11bHRpcGxlLlxyXG5cdFx0Ly9cclxuXHRcdC8vIC9cclxuXHRcdC8vICAgXFxcXCAgICAgICAgICAgICAgICAgLy8gXFxcclxuXHRcdC8vICAgKD8hXFxcXCkgICAgICAgICAgICAgLy8gbG9vay1haGVhZCwgYW55IGNoYXJhY3RlciB0aGF0IGlzbid0IFxcXHJcblx0XHQvLyAvZ1xyXG5cdFx0LnJlcGxhY2UoL1xcXFwoPyFcXFxcKS9nLCAnJyk7XHJcbn1cclxuXHJcbnZhciBzb3J0aW5nID0ge307XHJcblxyXG4vKipcclxuICogU29ydCBieSBhbHBoYW51bWVyaWMgaW4gdGhpcyBvcmRlcjogc3ltYm9scyAtPiBudW1iZXJzIC0+IEFhQmIuLi4gLT4gbnVtYmVyc1xyXG4gKi9cclxuc29ydGluZy5ieVRleHQgPSBmdW5jdGlvbiAoYSwgYikge1xyXG5cdHRleHRBID0gYS5nZXRUZXh0KCkudG9Mb3dlckNhc2UoKTtcclxuXHR0ZXh0QiA9IGIuZ2V0VGV4dCgpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdGlmICh0ZXh0QSA8IHRleHRCKSB7XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fVxyXG5cdGlmICh0ZXh0QSA+IHRleHRCKSB7XHJcblx0XHRyZXR1cm4gMTtcclxuXHR9XHJcblx0cmV0dXJuIDA7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBCYXNpYyBzbWlsaWVzIGJlZm9yZSBub24tYmFzaWMgc21pbGllcy5cclxuICovXHJcbnNvcnRpbmcuYnlTbWlsZXkgPSBmdW5jdGlvbiAoYSwgYikge1xyXG5cdGlmIChhLmlzU21pbGV5KCkgJiZcdCFiLmlzU21pbGV5KCkpIHtcclxuXHRcdHJldHVybiAtMTtcclxuXHR9XHJcblx0aWYgKGIuaXNTbWlsZXkoKSAmJlx0IWEuaXNTbWlsZXkoKSkge1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cdHJldHVybiAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdsb2JhbHMgYmVmb3JlIHN1YnNjcmlwdGlvbiBlbW90ZXMsIHN1YnNjcmlwdGlvbnMgaW4gYWxwaGFiZXRpY2FsIG9yZGVyLlxyXG4gKi9cclxuc29ydGluZy5ieUNoYW5uZWxOYW1lID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuXHR2YXIgY2hhbm5lbEEgPSBhLmdldENoYW5uZWxOYW1lKCk7XHJcblx0dmFyIGNoYW5uZWxCID0gYi5nZXRDaGFubmVsTmFtZSgpO1xyXG5cclxuXHQvLyBCb3RoIGRvbid0IGhhdmUgY2hhbm5lbHMuXHJcblx0aWYgKCFjaGFubmVsQSAmJiAhY2hhbm5lbEIpIHtcclxuXHRcdHJldHVybiAwO1xyXG5cdH1cclxuXHJcblx0Ly8gXCJBXCIgaGFzIGNoYW5uZWwsIFwiQlwiIGRvZXNuJ3QuXHJcblx0aWYgKGNoYW5uZWxBICYmICFjaGFubmVsQikge1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cdC8vIFwiQlwiIGhhcyBjaGFubmVsLCBcIkFcIiBkb2Vzbid0LlxyXG5cdGlmIChjaGFubmVsQiAmJiAhY2hhbm5lbEEpIHtcclxuXHRcdHJldHVybiAtMTtcclxuXHR9XHJcblxyXG5cdGNoYW5uZWxBID0gY2hhbm5lbEEudG9Mb3dlckNhc2UoKTtcclxuXHRjaGFubmVsQiA9IGNoYW5uZWxCLnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdGlmIChjaGFubmVsQSA8IGNoYW5uZWxCKSB7XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fVxyXG5cdGlmIChjaGFubmVsQiA+IGNoYW5uZWxBKSB7XHJcblx0XHRyZXR1cm4gMTtcclxuXHR9XHJcblxyXG5cdC8vIEFsbCB0aGUgc2FtZVxyXG5cdHJldHVybiAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRoZSBnZW5lcmFsIHNvcnQgb3JkZXIgZm9yIHRoZSBhbGwgZW1vdGVzIGNhdGVnb3J5LlxyXG4gKiBTbWlsZXlzIC0+IENoYW5uZWwgZ3JvdXBpbmcgLT4gYWxwaGFudW1lcmljXHJcbiAqL1xyXG5zb3J0aW5nLmFsbEVtb3Rlc0NhdGVnb3J5ID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuXHR2YXIgYnlTbWlsZXkgPSBzb3J0aW5nLmJ5U21pbGV5KGEsIGIpO1xyXG5cdHZhciBieUNoYW5uZWxOYW1lICA9IHNvcnRpbmcuYnlDaGFubmVsTmFtZShhLCBiKTtcclxuXHR2YXIgYnlUZXh0ID0gc29ydGluZy5ieVRleHQoYSwgYik7XHJcblxyXG5cdGlmIChieVNtaWxleSAhPT0gMCkge1xyXG5cdFx0cmV0dXJuIGJ5U21pbGV5O1xyXG5cdH1cclxuXHRpZiAoYnlDaGFubmVsTmFtZSAhPT0gMCkge1xyXG5cdFx0cmV0dXJuIGJ5Q2hhbm5lbE5hbWU7XHJcblx0fVxyXG5cdHJldHVybiBieVRleHQ7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGVtb3RlU3RvcmU7XHJcbiIsInZhciBhcGkgPSB7fTtcclxudmFyIGluc3RhbmNlID0gJ1tpbnN0YW5jZSAnICsgKE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICg5OTkgLSAxMDApKSArIDEwMCkgKyAnXSAnO1xyXG52YXIgcHJlZml4ID0gJ1tFbW90ZSBNZW51XSAnO1xyXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG5cclxuYXBpLmxvZyA9IGZ1bmN0aW9uICgpIHtcclxuXHRpZiAodHlwZW9mIGNvbnNvbGUubG9nID09PSAndW5kZWZpbmVkJykge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRhcmd1bWVudHMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykubWFwKGZ1bmN0aW9uIChhcmcpIHtcclxuXHRcdGlmICh0eXBlb2YgYXJnICE9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBhcmc7XHJcblx0fSk7XHJcblx0aWYgKHN0b3JhZ2UuZ2xvYmFsLmdldCgnZGVidWdNZXNzYWdlc0VuYWJsZWQnLCBmYWxzZSkpIHtcclxuXHRcdGFyZ3VtZW50cy51bnNoaWZ0KGluc3RhbmNlKTtcclxuXHR9XHJcblx0YXJndW1lbnRzLnVuc2hpZnQocHJlZml4KTtcclxuXHRjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxuYXBpLmRlYnVnID0gZnVuY3Rpb24gKCkge1xyXG5cdGlmICghc3RvcmFnZS5nbG9iYWwuZ2V0KCdkZWJ1Z01lc3NhZ2VzRW5hYmxlZCcsIGZhbHNlKSkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRhcmd1bWVudHMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcblx0YXJndW1lbnRzLnVuc2hpZnQoJ1tERUJVR10gJyk7XHJcblx0YXBpLmxvZy5hcHBseShudWxsLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwidmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XHJcbnZhciBlbW90ZXMgPSByZXF1aXJlKCcuL2Vtb3RlcycpO1xyXG52YXIgYXBpID0ge307XHJcblxyXG5hcGkudG9nZ2xlRGVidWcgPSBmdW5jdGlvbiAoZm9yY2VkKSB7XHJcblx0aWYgKHR5cGVvZiBmb3JjZWQgPT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRmb3JjZWQgPSAhc3RvcmFnZS5nbG9iYWwuZ2V0KCdkZWJ1Z01lc3NhZ2VzRW5hYmxlZCcsIGZhbHNlKTtcclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHRmb3JjZWQgPSAhIWZvcmNlZDtcclxuXHR9XHJcblx0c3RvcmFnZS5nbG9iYWwuc2V0KCdkZWJ1Z01lc3NhZ2VzRW5hYmxlZCcsIGZvcmNlZCk7XHJcblx0bG9nZ2VyLmxvZygnRGVidWcgbWVzc2FnZXMgYXJlIG5vdyAnICsgKGZvcmNlZCA/ICdlbmFibGVkJyA6ICdkaXNhYmxlZCcpKTtcclxufTtcclxuXHJcbmFwaS5yZWdpc3RlckVtb3RlR2V0dGVyID0gZW1vdGVzLnJlZ2lzdGVyR2V0dGVyO1xyXG5hcGkuZGVyZWdpc3RlckVtb3RlR2V0dGVyID0gZW1vdGVzLmRlcmVnaXN0ZXJHZXR0ZXI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwidmFyIFN0b3JlID0gcmVxdWlyZSgnc3RvcmFnZS13cmFwcGVyJyk7XHJcbnZhciBzdG9yYWdlID0ge307XHJcblxyXG4vLyBHZW5lcmFsIHN0b3JhZ2UuXHJcbnN0b3JhZ2UuZ2xvYmFsID0gbmV3IFN0b3JlKHtcclxuXHRuYW1lc3BhY2U6ICdlbW90ZS1tZW51LWZvci10d2l0Y2gnXHJcbn0pO1xyXG5cclxuLy8gRW1vdGUgdmlzaWJpbGl0eSBzdG9yYWdlLlxyXG5zdG9yYWdlLnZpc2liaWxpdHkgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgndmlzaWJpbGl0eScpO1xyXG4vLyBFbW90ZSBzdGFycmVkIHN0b3JhZ2UuXHJcbnN0b3JhZ2Uuc3RhcnJlZCA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCdzdGFycmVkJyk7XHJcbi8vIERpc3BsYXkgbmFtZSBzdG9yYWdlLlxyXG5zdG9yYWdlLmRpc3BsYXlOYW1lcyA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCdkaXNwbGF5TmFtZXMnKTtcclxuLy8gQ2hhbm5lbCBuYW1lIHN0b3JhZ2UuXHJcbnN0b3JhZ2UuY2hhbm5lbE5hbWVzID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ2NoYW5uZWxOYW1lcycpO1xyXG4vLyBCYWRnZXMgc3RvcmFnZS5cclxuc3RvcmFnZS5iYWRnZXMgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgnYmFkZ2VzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHN0b3JhZ2U7XHJcbiIsInZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuLi8uLi9idWlsZC90ZW1wbGF0ZXMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgZGF0YSA9IHt9O1xyXG5cdHZhciBrZXkgPSBudWxsO1xyXG5cclxuXHQvLyBDb252ZXJ0IHRlbXBsYXRlcyB0byB0aGVpciBzaG9ydGVyIFwicmVuZGVyXCIgZm9ybS5cclxuXHRmb3IgKGtleSBpbiB0ZW1wbGF0ZXMpIHtcclxuXHRcdGlmICghdGVtcGxhdGVzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHRcdFx0Y29udGludWU7XHJcblx0XHR9XHJcblx0XHRkYXRhW2tleV0gPSByZW5kZXIoa2V5KTtcclxuXHR9XHJcblxyXG5cdC8vIFNob3J0Y3V0IHRoZSByZW5kZXIgZnVuY3Rpb24uIEFsbCB0ZW1wbGF0ZXMgd2lsbCBiZSBwYXNzZWQgaW4gYXMgcGFydGlhbHMgYnkgZGVmYXVsdC5cclxuXHRmdW5jdGlvbiByZW5kZXIodGVtcGxhdGUpIHtcclxuXHRcdHRlbXBsYXRlID0gdGVtcGxhdGVzW3RlbXBsYXRlXTtcclxuXHRcdHJldHVybiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xyXG5cdFx0XHRyZXR1cm4gdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzIHx8IHRlbXBsYXRlcywgaW5kZW50KTtcclxuXHRcdH07XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZGF0YTtcclxufSkoKTtcclxuIiwidmFyIHR3aXRjaEFwaSA9IHdpbmRvdy5Ud2l0Y2guYXBpO1xyXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKTtcclxudmFyIGFwaSA9IHt9O1xyXG5cclxuYXBpLmdldEJhZGdlcyA9IGZ1bmN0aW9uICh1c2VybmFtZSwgY2FsbGJhY2spIHtcclxuXHQvLyBOb3RlOiBub3QgYSBkb2N1bWVudGVkIEFQSSBlbmRwb2ludC5cclxuXHR0d2l0Y2hBcGkuZ2V0KCdjaGF0LycgKyB1c2VybmFtZSArICcvYmFkZ2VzJylcclxuXHRcdC5kb25lKGZ1bmN0aW9uIChhcGkpIHtcclxuXHRcdFx0Y2FsbGJhY2soYXBpKTtcclxuXHRcdH0pXHJcblx0XHQuZmFpbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGNhbGxiYWNrKHt9KTtcclxuXHRcdH0pO1xyXG59O1xyXG5cclxuYXBpLmdldFVzZXIgPSBmdW5jdGlvbiAodXNlcm5hbWUsIGNhbGxiYWNrKSB7XHJcblx0Ly8gTm90ZTogbm90IGEgZG9jdW1lbnRlZCBBUEkgZW5kcG9pbnQuXHJcblx0dHdpdGNoQXBpLmdldCgndXNlcnMvJyArIHVzZXJuYW1lKVxyXG5cdFx0LmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0XHRjYWxsYmFjayhhcGkpO1xyXG5cdFx0fSlcclxuXHRcdC5mYWlsKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Y2FsbGJhY2soe30pO1xyXG5cdFx0fSk7XHJcbn07XHJcblxyXG5hcGkuZ2V0VGlja2V0cyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG5cdC8vIE5vdGU6IG5vdCBhIGRvY3VtZW50ZWQgQVBJIGVuZHBvaW50LlxyXG5cdHR3aXRjaEFwaS5nZXQoXHJcblx0XHQnL2FwaS91c2Vycy86bG9naW4vdGlja2V0cycsXHJcblx0XHR7XHJcblx0XHRcdG9mZnNldDogMCxcclxuXHRcdFx0bGltaXQ6IDEwMCxcclxuXHRcdFx0dW5lbmRlZDogdHJ1ZVxyXG5cdFx0fVxyXG5cdClcclxuXHRcdC5kb25lKGZ1bmN0aW9uIChhcGkpIHtcclxuXHRcdFx0Y2FsbGJhY2soYXBpLnRpY2tldHMgfHwgW10pO1xyXG5cdFx0fSlcclxuXHRcdC5mYWlsKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Y2FsbGJhY2soW10pO1xyXG5cdFx0fSk7XHJcbn07XHJcblxyXG5hcGkub25FbW90ZXNDaGFuZ2UgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGltbWVkaWF0ZSkge1xyXG5cdGxvZ2dlci5kZWJ1Zygnb25FbW90ZXNDaGFuZ2UgY2FsbGVkLicpO1xyXG5cdHZhciBlbWJlciA9IHJlcXVpcmUoJy4vZW1iZXItYXBpJyk7XHJcblx0dmFyIHNlc3Npb24gPSBlbWJlci5nZXQoJ2NvbnRyb2xsZXI6Y2hhdCcsICdjdXJyZW50Um9vbS50bWlSb29tLnNlc3Npb24nKTtcclxuXHR2YXIgcmVzcG9uc2UgPSBudWxsO1xyXG5cclxuXHRpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ2BjYWxsYmFja2AgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG5cdH1cclxuXHJcblx0Ly8gTm8gcGFyc2VyIG9yIG5vIGVtb3RlcyBsb2FkZWQgeWV0LCB0cnkgYWdhaW4uXHJcblx0aWYgKCFzZXNzaW9uKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ29uRW1vdGVzQ2hhbmdlIHNlc3Npb24gbWlzc2luZywgdHJ5aW5nIGFnYWluLicpO1xyXG5cdFx0c2V0VGltZW91dChhcGkub25FbW90ZXNDaGFuZ2UsIDEwMCwgY2FsbGJhY2ssIGltbWVkaWF0ZSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHQvLyBDYWxsIHRoZSBjYWxsYmFjayBpbW1lZGlhdGVseSBvbiByZWdpc3RlcmluZy5cclxuXHRpZiAoaW1tZWRpYXRlKSB7XHJcblx0XHRyZXNwb25zZSA9IHNlc3Npb24uZ2V0RW1vdGVzKCk7XHJcblx0XHRpZiAoIXJlc3BvbnNlIHx8ICFyZXNwb25zZS5lbW90aWNvbl9zZXRzKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1Zygnb25FbW90ZXNDaGFuZ2Ugbm8gZW1vdGljb25fc2V0cywgdHJ5aW5nIGFnYWluLicpO1xyXG5cdFx0XHRzZXRUaW1lb3V0KGFwaS5vbkVtb3Rlc0NoYW5nZSwgMTAwLCBjYWxsYmFjaywgaW1tZWRpYXRlKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxvZ2dlci5kZWJ1Zygnb25FbW90ZXNDaGFuZ2UgY2FsbGJhY2sgY2FsbGVkIGltbWVkaWF0ZWx5LicpO1xyXG5cdFx0Y2FsbGJhY2socmVzcG9uc2UuZW1vdGljb25fc2V0cyk7XHJcblx0fVxyXG5cclxuXHQvLyBMaXN0ZW4gZm9yIHRoZSBldmVudC5cclxuXHRzZXNzaW9uLl9lbW90ZXNQYXJzZXIub24oJ2Vtb3Rlc19jaGFuZ2VkJywgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ29uRW1vdGVzQ2hhbmdlIGNhbGxiYWNrIGNhbGxlZCB3aGlsZSBsaXN0ZW5pbmcuJyk7XHJcblx0XHRjYWxsYmFjayhyZXNwb25zZS5lbW90aWNvbl9zZXRzKTtcclxuXHR9KTtcclxuXHJcblx0bG9nZ2VyLmRlYnVnKCdSZWdpc3RlcmVkIGxpc3RlbmVyIGZvciBlbW90ZSBjaGFuZ2VzLicpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XHJcbiIsInZhciBhcGkgPSB7fTtcclxudmFyICQgPSBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xyXG52YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcclxudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxudmFyIGVtb3RlcyA9IHJlcXVpcmUoJy4vZW1vdGVzJyk7XHJcbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG5cclxudmFyIHRoZU1lbnUgPSBuZXcgVUlNZW51KCk7XHJcbnZhciB0aGVNZW51QnV0dG9uID0gbmV3IFVJTWVudUJ1dHRvbigpO1xyXG5cclxuYXBpLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gTG9hZCBDU1MuXHJcblx0cmVxdWlyZSgnLi4vLi4vYnVpbGQvc3R5bGVzJyk7XHJcblxyXG5cdC8vIExvYWQgalF1ZXJ5IHBsdWdpbnMuXHJcblx0cmVxdWlyZSgnLi4vcGx1Z2lucy9yZXNpemFibGUnKTtcclxuXHRyZXF1aXJlKCdqcXVlcnkuc2Nyb2xsYmFyJyk7XHJcblxyXG5cdHRoZU1lbnVCdXR0b24uaW5pdCgpO1xyXG5cdHRoZU1lbnUuaW5pdCgpO1xyXG59O1xyXG5cclxuYXBpLmhpZGVNZW51ID0gZnVuY3Rpb24gKCkge1xyXG5cdGlmICh0aGVNZW51LmRvbSAmJiB0aGVNZW51LmRvbS5sZW5ndGgpIHtcclxuXHRcdHRoZU1lbnUudG9nZ2xlRGlzcGxheShmYWxzZSk7XHJcblx0fVxyXG59O1xyXG5cclxuYXBpLnVwZGF0ZUVtb3RlcyA9IGZ1bmN0aW9uICgpIHtcclxuXHR0aGVNZW51LnVwZGF0ZUVtb3RlcygpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBVSU1lbnVCdXR0b24oKSB7XHJcblx0dGhpcy5kb20gPSBudWxsO1xyXG59XHJcblxyXG5VSU1lbnVCdXR0b24ucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAodGltZXNGYWlsZWQpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0dmFyIGNoYXRCdXR0b24gPSAkKCcuc2VuZC1jaGF0LWJ1dHRvbiwgLmNoYXQtYnV0dG9ucy1jb250YWluZXIgYnV0dG9uJyk7XHJcblx0dmFyIGZhaWxDb3VudGVyID0gdGltZXNGYWlsZWQgfHwgMDtcclxuXHR0aGlzLmRvbSA9ICQoJyNlbW90ZS1tZW51LWJ1dHRvbicpO1xyXG5cclxuXHQvLyBFbGVtZW50IGFscmVhZHkgZXhpc3RzLlxyXG5cdGlmICh0aGlzLmRvbS5sZW5ndGgpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnTWVudUJ1dHRvbiBhbHJlYWR5IGV4aXN0cywgc3RvcHBpbmcgaW5pdC4nKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0aWYgKCFjaGF0QnV0dG9uLmxlbmd0aCkge1xyXG5cdFx0ZmFpbENvdW50ZXIgKz0gMTtcclxuXHRcdGlmIChmYWlsQ291bnRlciA9PT0gMSkge1xyXG5cdFx0XHRsb2dnZXIubG9nKCdNZW51QnV0dG9uIGNvbnRhaW5lciBtaXNzaW5nLCB0cnlpbmcgYWdhaW4uJyk7XHJcblx0XHR9XHJcblx0XHRpZiAoZmFpbENvdW50ZXIgPj0gMTApIHtcclxuXHRcdFx0bG9nZ2VyLmxvZygnTWVudUJ1dHRvbiBjb250YWluZXIgbWlzc2luZywgTWVudUJ1dHRvbiB1bmFibGUgdG8gYmUgYWRkZWQsIHN0b3BwaW5nIGluaXQuJyk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHNlbGYuaW5pdChmYWlsQ291bnRlcik7XHJcblx0XHR9LCAxMDAwKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0Ly8gQ3JlYXRlIGVsZW1lbnQuXHJcblx0dGhpcy5kb20gPSAkKHRlbXBsYXRlcy5lbW90ZUJ1dHRvbigpKTtcclxuXHR0aGlzLmRvbS5pbnNlcnRCZWZvcmUoY2hhdEJ1dHRvbik7XHJcblxyXG5cdC8vIEhpZGUgdGhlbiBmYWRlIGl0IGluLlxyXG5cdHRoaXMuZG9tLmhpZGUoKTtcclxuXHR0aGlzLmRvbS5mYWRlSW4oKTtcclxuXHJcblx0Ly8gRW5hYmxlIGNsaWNraW5nLlxyXG5cdHRoaXMuZG9tLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdHRoZU1lbnUudG9nZ2xlRGlzcGxheSgpO1xyXG5cdH0pO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudUJ1dHRvbi5wcm90b3R5cGUudG9nZ2xlRGlzcGxheSA9IGZ1bmN0aW9uIChmb3JjZWQpIHtcclxuXHR2YXIgc3RhdGUgPSB0eXBlb2YgZm9yY2VkICE9PSAndW5kZWZpbmVkJyA/ICEhZm9yY2VkIDogIXRoaXMuaXNWaXNpYmxlKCk7XHJcblx0aWYgKHN0YXRlKSB7XHJcblx0XHR0aGlzLmRvbS5hZGRDbGFzcygnYWN0aXZlJyk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblx0dGhpcy5kb20ucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudUJ1dHRvbi5wcm90b3R5cGUuaXNWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmRvbS5oYXNDbGFzcygnYWN0aXZlJyk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBVSU1lbnUoKSB7XHJcblx0dGhpcy5kb20gPSBudWxsO1xyXG5cdHRoaXMuZ3JvdXBzID0ge307XHJcblx0dGhpcy5lbW90ZXMgPSBbXTtcclxuXHR0aGlzLm9mZnNldCA9IG51bGw7XHJcblx0dGhpcy5mYXZvcml0ZXMgPSBudWxsO1xyXG59XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHR0aGlzLmRvbSA9ICQoJyNlbW90ZS1tZW51LWZvci10d2l0Y2gnKTtcclxuXHJcblx0Ly8gRWxlbWVudCBhbHJlYWR5IGV4aXN0cy5cclxuXHRpZiAodGhpcy5kb20ubGVuZ3RoKSB7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdC8vIENyZWF0ZSBlbGVtZW50LlxyXG5cdHRoaXMuZG9tID0gJCh0ZW1wbGF0ZXMubWVudSgpKTtcclxuXHQkKGRvY3VtZW50LmJvZHkpLmFwcGVuZCh0aGlzLmRvbSk7XHJcblxyXG5cdHRoaXMuZmF2b3JpdGVzID0gbmV3IFVJRmF2b3JpdGVzR3JvdXAoKTtcclxuXHJcblx0Ly8gRW5hYmxlIGRyYWdnaW5nLlxyXG5cdHRoaXMuZG9tLmRyYWdnYWJsZSh7XHJcblx0XHRoYW5kbGU6ICcuZHJhZ2dhYmxlJyxcclxuXHRcdHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHNlbGYudG9nZ2xlUGlubmVkKHRydWUpO1xyXG5cdFx0XHRzZWxmLnRvZ2dsZU1vdmVtZW50KHRydWUpO1xyXG5cdFx0fSxcclxuXHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0c2VsZi5vZmZzZXQgPSBzZWxmLmRvbS5vZmZzZXQoKTtcclxuXHRcdH0sXHJcblx0XHRjb250YWlubWVudDogJChkb2N1bWVudC5ib2R5KVxyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgcmVzaXppbmcuXHJcblx0dGhpcy5kb20ucmVzaXphYmxlKHtcclxuXHRcdGhhbmRsZTogJ1tkYXRhLWNvbW1hbmQ9XCJyZXNpemUtaGFuZGxlXCJdJyxcclxuXHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0c2VsZi50b2dnbGVQaW5uZWQodHJ1ZSk7XHJcblx0XHRcdHNlbGYudG9nZ2xlTW92ZW1lbnQodHJ1ZSk7XHJcblx0XHR9LFxyXG5cdFx0YWxzb1Jlc2l6ZTogc2VsZi5kb20uZmluZCgnLnNjcm9sbGFibGUnKSxcclxuXHRcdGNvbnRhaW5tZW50OiAkKGRvY3VtZW50LmJvZHkpLFxyXG5cdFx0bWluSGVpZ2h0OiAxODAsXHJcblx0XHRtaW5XaWR0aDogMjAwXHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBwaW5uaW5nLlxyXG5cdHRoaXMuZG9tLmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtcGlubmVkXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0c2VsZi50b2dnbGVQaW5uZWQoKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIGVkaXRpbmcuXHJcblx0dGhpcy5kb20uZmluZCgnW2RhdGEtY29tbWFuZD1cInRvZ2dsZS1lZGl0aW5nXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0c2VsZi50b2dnbGVFZGl0aW5nKCk7XHJcblx0fSk7XHJcblxyXG5cdHRoaXMuZG9tLmZpbmQoJy5zY3JvbGxhYmxlJykuc2Nyb2xsYmFyKClcclxuXHJcblx0dGhpcy51cGRhdGVFbW90ZXMoKTtcclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLl9kZXRlY3RPdXRzaWRlQ2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuXHQvLyBOb3Qgb3V0c2lkZSBvZiB0aGUgbWVudSwgaWdub3JlIHRoZSBjbGljay5cclxuXHRpZiAoJChldmVudC50YXJnZXQpLmlzKCcjZW1vdGUtbWVudS1mb3ItdHdpdGNoLCAjZW1vdGUtbWVudS1mb3ItdHdpdGNoIConKSkge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Ly8gQ2xpY2tlZCBvbiB0aGUgbWVudSBidXR0b24sIGp1c3QgcmVtb3ZlIHRoZSBsaXN0ZW5lciBhbmQgbGV0IHRoZSBub3JtYWwgbGlzdGVuZXIgaGFuZGxlIGl0LlxyXG5cdGlmICghdGhpcy5pc1Zpc2libGUoKSB8fCAkKGV2ZW50LnRhcmdldCkuaXMoJyNlbW90ZS1tZW51LWJ1dHRvbiwgI2Vtb3RlLW1lbnUtYnV0dG9uIConKSkge1xyXG5cdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgdGhpcy5fZGV0ZWN0T3V0c2lkZUNsaWNrLmJpbmQodGhpcykpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Ly8gQ2xpY2tlZCBvdXRzaWRlLCBtYWtlIHN1cmUgdGhlIG1lbnUgaXNuJ3QgcGlubmVkLlxyXG5cdGlmICghdGhpcy5pc1Bpbm5lZCgpKSB7XHJcblx0XHQvLyBNZW51IHdhc24ndCBwaW5uZWQsIHJlbW92ZSBsaXN0ZW5lci5cclxuXHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsIHRoaXMuX2RldGVjdE91dHNpZGVDbGljay5iaW5kKHRoaXMpKTtcclxuXHRcdHRoaXMudG9nZ2xlRGlzcGxheSgpO1xyXG5cdH1cclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUudG9nZ2xlRGlzcGxheSA9IGZ1bmN0aW9uIChmb3JjZWQpIHtcclxuXHR2YXIgc3RhdGUgPSB0eXBlb2YgZm9yY2VkICE9PSAndW5kZWZpbmVkJyA/ICEhZm9yY2VkIDogIXRoaXMuaXNWaXNpYmxlKCk7XHJcblx0dmFyIGxvZ2dlZEluID0gd2luZG93LlR3aXRjaCAmJiB3aW5kb3cuVHdpdGNoLnVzZXIuaXNMb2dnZWRJbigpO1xyXG5cclxuXHQvLyBNZW51IHNob3VsZCBiZSBzaG93bi5cclxuXHRpZiAoc3RhdGUpIHtcclxuXHRcdC8vIENoZWNrIGlmIHVzZXIgaXMgbG9nZ2VkIGluLlxyXG5cdFx0aWYgKCFsb2dnZWRJbikge1xyXG5cdFx0XHQvLyBDYWxsIG5hdGl2ZSBsb2dpbiBmb3JtLlxyXG5cdFx0XHQkLmxvZ2luKCk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMudXBkYXRlRW1vdGVzKCk7XHJcblx0XHR0aGlzLmRvbS5zaG93KCk7XHJcblxyXG5cdFx0Ly8gTWVudSBtb3ZlZCwgbW92ZSBpdCBiYWNrLlxyXG5cdFx0aWYgKHRoaXMuaGFzTW92ZWQoKSkge1xyXG5cdFx0XHR0aGlzLmRvbS5vZmZzZXQodGhpcy5vZmZzZXQpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gTmV2ZXIgbW92ZWQsIG1ha2UgaXQgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgY2hhdCB3aW5kb3cuXHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dmFyIGNoYXRDb250YWluZXIgPSAkKCcuY2hhdC1tZXNzYWdlcycpO1xyXG5cdFx0XHRcclxuXHRcdFx0Ly8gQWRqdXN0IHRoZSBzaXplIHRvIGJlIHRoZSBzYW1lIGFzIHRoZSBjaGF0IGNvbnRhaW5lci5cclxuXHRcdFx0dGhpcy5kb20uaGVpZ2h0KGNoYXRDb250YWluZXIub3V0ZXJIZWlnaHQoKSAtICh0aGlzLmRvbS5vdXRlckhlaWdodCgpIC0gdGhpcy5kb20uaGVpZ2h0KCkpKTtcclxuXHRcdFx0dGhpcy5kb20ud2lkdGgoY2hhdENvbnRhaW5lci5vdXRlcldpZHRoKCkgLSAodGhpcy5kb20ub3V0ZXJXaWR0aCgpIC0gdGhpcy5kb20ud2lkdGgoKSkpO1xyXG5cclxuXHRcdFx0Ly8gQWRqdXN0IHRoZSBvZmZzZXQgdG8gYmUgdGhlIHNhbWUgYXMgdGhlIGNoYXQgY29udGFpbmVyLlxyXG5cdFx0XHR0aGlzLm9mZnNldCA9IGNoYXRDb250YWluZXIub2Zmc2V0KCk7XHJcblx0XHRcdHRoaXMuZG9tLm9mZnNldCh0aGlzLm9mZnNldCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gTGlzdGVuIGZvciBvdXRzaWRlIGNsaWNrLlxyXG5cdFx0JChkb2N1bWVudCkub24oJ21vdXNldXAnLCB0aGlzLl9kZXRlY3RPdXRzaWRlQ2xpY2suYmluZCh0aGlzKSk7XHJcblx0fVxyXG5cdC8vIE1lbnUgc2hvdWxkIGJlIGhpZGRlbi5cclxuXHRlbHNlIHtcclxuXHRcdHRoaXMuZG9tLmhpZGUoKTtcclxuXHRcdHRoaXMudG9nZ2xlRWRpdGluZyhmYWxzZSk7XHJcblx0XHR0aGlzLnRvZ2dsZVBpbm5lZChmYWxzZSk7XHJcblx0fVxyXG5cclxuXHQvLyBBbHNvIHRvZ2dsZSB0aGUgbWVudSBidXR0b24uXHJcblx0dGhlTWVudUJ1dHRvbi50b2dnbGVEaXNwbGF5KHRoaXMuaXNWaXNpYmxlKCkpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuaXNWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmRvbS5pcygnOnZpc2libGUnKTtcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUudXBkYXRlRW1vdGVzID0gZnVuY3Rpb24gKHdoaWNoKSB7XHJcblx0dmFyIGVtb3RlID0gd2hpY2ggPyB0aGlzLmdldEVtb3RlKHdoaWNoKSA6IG51bGw7XHJcblx0dmFyIGZhdm9yaXRlRW1vdGUgPSBlbW90ZSA/IHRoaXMuZmF2b3JpdGVzLmdldEVtb3RlKHdoaWNoKSA6IG51bGw7XHJcblx0aWYgKGVtb3RlKSB7XHJcblx0XHRlbW90ZS51cGRhdGUoKTtcclxuXHRcdGlmIChmYXZvcml0ZUVtb3RlKSB7XHJcblx0XHRcdGZhdm9yaXRlRW1vdGUudXBkYXRlKCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblx0dmFyIGVtb3RlcyA9IHJlcXVpcmUoJy4vZW1vdGVzJyk7XHJcblx0dmFyIHRoZUVtb3RlcyA9IGVtb3Rlcy5nZXRFbW90ZXMoKTtcclxuXHR2YXIgdGhlRW1vdGVzS2V5cyA9IFtdO1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0dGhlRW1vdGVzLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlSW5zdGFuY2UpIHtcclxuXHRcdHNlbGYuYWRkRW1vdGUoZW1vdGVJbnN0YW5jZSk7XHJcblx0XHR0aGVFbW90ZXNLZXlzLnB1c2goZW1vdGVJbnN0YW5jZS5nZXRUZXh0KCkpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBEaWZmZXJlbmNlIHRoZSBlbW90ZXMgYW5kIHJlbW92ZSBhbGwgbm9uLXZhbGlkIGVtb3Rlcy5cclxuXHR0aGlzLmVtb3Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChvbGRFbW90ZSkge1xyXG5cdFx0dmFyIHRleHQgPSBvbGRFbW90ZS5nZXRUZXh0KClcclxuXHRcdGlmICh0aGVFbW90ZXNLZXlzLmluZGV4T2YodGV4dCkgPCAwKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnRW1vdGUgZGlmZmVyZW5jZSBmb3VuZCwgcmVtb3ZpbmcgZW1vdGUgZnJvbSBVSTogJyArIHRleHQpO1xyXG5cdFx0XHRzZWxmLnJlbW92ZUVtb3RlKHRleHQpO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHQvLyBTYXZlIHRoZSBlbW90ZXMgZm9yIG5leHQgZGlmZmVyZW5jaW5nLlxyXG5cdHRoaXMuZW1vdGVzID0gdGhlRW1vdGVzO1xyXG5cclxuXHQvL1VwZGF0ZSBncm91cHMuXHJcblx0T2JqZWN0LmtleXModGhpcy5ncm91cHMpLmZvckVhY2goZnVuY3Rpb24gKGdyb3VwKSB7XHJcblx0XHRzZWxmLmdldEdyb3VwKGdyb3VwKS5pbml0KCk7XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS50b2dnbGVFZGl0aW5nID0gZnVuY3Rpb24gKGZvcmNlZCkge1xyXG5cdHZhciBzdGF0ZSA9IHR5cGVvZiBmb3JjZWQgIT09ICd1bmRlZmluZWQnID8gISFmb3JjZWQgOiAhdGhpcy5pc0VkaXRpbmcoKTtcclxuXHR0aGlzLmRvbS50b2dnbGVDbGFzcygnZWRpdGluZycsIHN0YXRlKTtcclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuaXNFZGl0aW5nID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmRvbS5oYXNDbGFzcygnZWRpdGluZycpO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS50b2dnbGVQaW5uZWQgPSBmdW5jdGlvbiAoZm9yY2VkKSB7XHJcblx0dmFyIHN0YXRlID0gdHlwZW9mIGZvcmNlZCAhPT0gJ3VuZGVmaW5lZCcgPyAhIWZvcmNlZCA6ICF0aGlzLmlzUGlubmVkKCk7XHJcblx0dGhpcy5kb20udG9nZ2xlQ2xhc3MoJ3Bpbm5lZCcsIHN0YXRlKTtcclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuaXNQaW5uZWQgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMuZG9tLmhhc0NsYXNzKCdwaW5uZWQnKTtcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUudG9nZ2xlTW92ZW1lbnQgPSBmdW5jdGlvbiAoZm9yY2VkKSB7XHJcblx0dmFyIHN0YXRlID0gdHlwZW9mIGZvcmNlZCAhPT0gJ3VuZGVmaW5lZCcgPyAhIWZvcmNlZCA6ICF0aGlzLmhhc01vdmVkKCk7XHJcblx0dGhpcy5kb20udG9nZ2xlQ2xhc3MoJ21vdmVkJywgc3RhdGUpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5oYXNNb3ZlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gdGhpcy5kb20uaGFzQ2xhc3MoJ21vdmVkJyk7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLmFkZEdyb3VwID0gZnVuY3Rpb24gKGVtb3RlSW5zdGFuY2UpIHtcclxuXHR2YXIgY2hhbm5lbCA9IGVtb3RlSW5zdGFuY2UuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdC8vIEFscmVhZHkgYWRkZWQsIGRvbid0IGFkZCBhZ2Fpbi5cclxuXHRpZiAodGhpcy5nZXRHcm91cChjaGFubmVsKSkge1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHQvLyBBZGQgdG8gY3VycmVudCBtZW51IGdyb3Vwcy5cclxuXHR2YXIgZ3JvdXAgPSBuZXcgVUlHcm91cChlbW90ZUluc3RhbmNlKTtcclxuXHR0aGlzLmdyb3Vwc1tjaGFubmVsXSA9IGdyb3VwO1xyXG5cclxuXHQvLyBTb3J0IGdyb3VwIG5hbWVzLCBnZXQgaW5kZXggb2Ygd2hlcmUgdGhpcyBncm91cCBzaG91bGQgZ28uXHJcblx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLmdyb3Vwcyk7XHJcblx0a2V5cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcblx0XHQvLyBHZXQgdGhlIGluc3RhbmNlcy5cclxuXHRcdGEgPSBzZWxmLmdyb3Vwc1thXS5lbW90ZUluc3RhbmNlO1xyXG5cdFx0YiA9IHNlbGYuZ3JvdXBzW2JdLmVtb3RlSW5zdGFuY2U7XHJcblxyXG5cdFx0Ly8gR2V0IHRoZSBjaGFubmVsIG5hbWUuXHJcblx0XHR2YXIgYUNoYW5uZWwgPSBhLmdldENoYW5uZWxOYW1lKCk7XHJcblx0XHR2YXIgYkNoYW5uZWwgPSBiLmdldENoYW5uZWxOYW1lKCk7XHJcblxyXG5cdFx0Ly8gR2V0IHRoZSBjaGFubmVsIGRpc3BsYXkgbmFtZS5cclxuXHRcdGEgPSBhLmdldENoYW5uZWxEaXNwbGF5TmFtZSgpLnRvTG93ZXJDYXNlKCk7XHJcblx0XHRiID0gYi5nZXRDaGFubmVsRGlzcGxheU5hbWUoKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuXHRcdC8vIFR1cmJvIGdvZXMgZmlyc3QsIGFsd2F5cy5cclxuXHRcdGlmIChhQ2hhbm5lbCA9PT0gJ3R1cmJvJyAmJiBiQ2hhbm5lbCAhPT0gJ3R1cmJvJykge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHRpZiAoYkNoYW5uZWwgPT09ICd0dXJibycgJiYgYUNoYW5uZWwgIT09ICd0dXJibycpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gR2xvYmFsIGdvZXMgc2Vjb25kLCBhbHdheXMuXHJcblx0XHRpZiAoYUNoYW5uZWwgPT09ICd+Z2xvYmFsJyAmJiBiQ2hhbm5lbCAhPT0gJ35nbG9iYWwnKSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdGlmIChiQ2hhbm5lbCA9PT0gJ35nbG9iYWwnICYmIGFDaGFubmVsICE9PSAnfmdsb2JhbCcpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gQSBnb2VzIGZpcnN0LlxyXG5cdFx0aWYgKGEgPCBiKSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdC8vIEIgZ29lc3QgZmlyc3QuXHJcblx0XHRpZiAoYSA+IGIpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblx0XHQvLyBCb3RoIHRoZSBzYW1lLCBkb2Vzbid0IG1hdHRlci5cclxuXHRcdHJldHVybiAwO1xyXG5cdH0pO1xyXG5cclxuXHR2YXIgaW5kZXggPSBrZXlzLmluZGV4T2YoY2hhbm5lbCk7XHJcblxyXG5cdC8vIEZpcnN0IGluIHRoZSBzb3J0LCBwbGFjZSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBtZW51LlxyXG5cdGlmIChpbmRleCA9PT0gMCkge1xyXG5cdFx0Z3JvdXAuZG9tLnByZXBlbmRUbyh0aGlzLmRvbS5maW5kKCcjYWxsLWVtb3Rlcy1ncm91cCcpKTtcclxuXHR9XHJcblx0Ly8gSW5zZXJ0IGFmdGVyIHRoZSBwcmV2aW91cyBncm91cCBpbiB0aGUgc29ydC5cclxuXHRlbHNlIHtcclxuXHRcdGdyb3VwLmRvbS5pbnNlcnRBZnRlcih0aGlzLmdldEdyb3VwKGtleXNbaW5kZXggLSAxXSkuZG9tKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBncm91cDtcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuZ2V0R3JvdXAgPSBmdW5jdGlvbiAobmFtZSkge1xyXG5cdHJldHVybiB0aGlzLmdyb3Vwc1tuYW1lXSB8fCBudWxsO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5hZGRFbW90ZSA9IGZ1bmN0aW9uIChlbW90ZUluc3RhbmNlKSB7XHJcblx0Ly8gR2V0IHRoZSBncm91cCwgb3IgYWRkIGlmIG5lZWRlZC5cclxuXHR2YXIgZ3JvdXAgPSB0aGlzLmdldEdyb3VwKGVtb3RlSW5zdGFuY2UuZ2V0Q2hhbm5lbE5hbWUoKSkgfHwgdGhpcy5hZGRHcm91cChlbW90ZUluc3RhbmNlKTtcclxuXHJcblx0Z3JvdXAuYWRkRW1vdGUoZW1vdGVJbnN0YW5jZSk7XHJcblx0Z3JvdXAudG9nZ2xlRGlzcGxheShncm91cC5pc1Zpc2libGUoKSwgdHJ1ZSk7XHJcblxyXG5cdHRoaXMuZmF2b3JpdGVzLmFkZEVtb3RlKGVtb3RlSW5zdGFuY2UpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUucmVtb3ZlRW1vdGUgPSBmdW5jdGlvbiAobmFtZSkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHRPYmplY3Qua2V5cyh0aGlzLmdyb3VwcykuZm9yRWFjaChmdW5jdGlvbiAoZ3JvdXBOYW1lKSB7XHJcblx0XHRzZWxmLmdyb3Vwc1tncm91cE5hbWVdLnJlbW92ZUVtb3RlKG5hbWUpO1xyXG5cdH0pO1xyXG5cdHRoaXMuZmF2b3JpdGVzLnJlbW92ZUVtb3RlKG5hbWUpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuZ2V0RW1vdGUgPSBmdW5jdGlvbiAobmFtZSkge1xyXG5cdHZhciBncm91cE5hbWUgPSBudWxsO1xyXG5cdHZhciBncm91cCA9IG51bGw7XHJcblx0dmFyIGVtb3RlID0gbnVsbDtcclxuXHJcblx0Zm9yIChncm91cE5hbWUgaW4gdGhpcy5ncm91cHMpIHtcclxuXHRcdGdyb3VwID0gdGhpcy5ncm91cHNbZ3JvdXBOYW1lXTtcclxuXHRcdGVtb3RlID0gZ3JvdXAuZ2V0RW1vdGUobmFtZSk7XHJcblxyXG5cdFx0aWYgKGVtb3RlKSB7XHJcblx0XHRcdHJldHVybiBlbW90ZTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBudWxsO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVUlHcm91cChlbW90ZUluc3RhbmNlKSB7XHJcblx0dGhpcy5kb20gPSBudWxsO1xyXG5cdHRoaXMuZW1vdGVzID0ge307XHJcblx0dGhpcy5lbW90ZUluc3RhbmNlID0gZW1vdGVJbnN0YW5jZTtcclxuXHJcblx0dGhpcy5pbml0KCk7XHJcbn1cclxuXHJcblVJR3JvdXAucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBlbW90ZUluc3RhbmNlID0gdGhpcy5lbW90ZUluc3RhbmNlO1xyXG5cclxuXHQvLyBGaXJzdCBpbml0LCBjcmVhdGUgbmV3IERPTS5cclxuXHRpZiAodGhpcy5kb20gPT09IG51bGwpIHtcclxuXHRcdHRoaXMuZG9tID0gJCh0ZW1wbGF0ZXMuZW1vdGVHcm91cEhlYWRlcih7XHJcblx0XHRcdGJhZGdlOiBlbW90ZUluc3RhbmNlLmdldENoYW5uZWxCYWRnZSgpLFxyXG5cdFx0XHRjaGFubmVsOiBlbW90ZUluc3RhbmNlLmdldENoYW5uZWxOYW1lKCksXHJcblx0XHRcdGNoYW5uZWxEaXNwbGF5TmFtZTogZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsRGlzcGxheU5hbWUoKVxyXG5cdFx0fSkpO1xyXG5cdH1cclxuXHQvLyBVcGRhdGUgRE9NIGluc3RlYWQuXHJcblx0ZWxzZSB7XHJcblx0XHR0aGlzLmRvbS5maW5kKCcuaGVhZGVyLWluZm8nKS5yZXBsYWNlV2l0aChcclxuXHRcdFx0JCh0ZW1wbGF0ZXMuZW1vdGVHcm91cEhlYWRlcih7XHJcblx0XHRcdFx0YmFkZ2U6IGVtb3RlSW5zdGFuY2UuZ2V0Q2hhbm5lbEJhZGdlKCksXHJcblx0XHRcdFx0Y2hhbm5lbDogZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsTmFtZSgpLFxyXG5cdFx0XHRcdGNoYW5uZWxEaXNwbGF5TmFtZTogZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsRGlzcGxheU5hbWUoKVxyXG5cdFx0XHR9KSlcclxuXHRcdFx0LmZpbmQoJy5oZWFkZXItaW5mbycpXHJcblx0XHQpO1xyXG5cdH1cclxuXHJcblx0Ly8gRW5hYmxlIGVtb3RlIGhpZGluZy5cclxuXHR0aGlzLmRvbS5maW5kKCcuaGVhZGVyLWluZm8gW2RhdGEtY29tbWFuZD1cInRvZ2dsZS12aXNpYmlsaXR5XCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCF0aGVNZW51LmlzRWRpdGluZygpKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdHNlbGYudG9nZ2xlRGlzcGxheSgpO1xyXG5cdH0pO1xyXG5cclxuXHR0aGlzLnRvZ2dsZURpc3BsYXkodGhpcy5pc1Zpc2libGUoKSwgdHJ1ZSk7XHJcbn07XHJcblxyXG5VSUdyb3VwLnByb3RvdHlwZS50b2dnbGVEaXNwbGF5ID0gZnVuY3Rpb24gKGZvcmNlZCwgc2tpcFVwZGF0aW5nRW1vdGVEaXNwbGF5KSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBzdGF0ZSA9IHR5cGVvZiBmb3JjZWQgIT09ICd1bmRlZmluZWQnID8gIWZvcmNlZCA6IHRoaXMuaXNWaXNpYmxlKCk7XHJcblxyXG5cdHRoaXMuZG9tLnRvZ2dsZUNsYXNzKCdlbW90ZS1tZW51LWhpZGRlbicsIHN0YXRlKTtcclxuXHJcblx0Ly8gVXBkYXRlIHRoZSBkaXNwbGF5IG9mIGFsbCBlbW90ZXMuXHJcblx0aWYgKCFza2lwVXBkYXRpbmdFbW90ZURpc3BsYXkpIHtcclxuXHRcdE9iamVjdC5rZXlzKHRoaXMuZW1vdGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZU5hbWUpIHtcclxuXHRcdFx0c2VsZi5lbW90ZXNbZW1vdGVOYW1lXS50b2dnbGVEaXNwbGF5KCFzdGF0ZSk7XHJcblx0XHRcdHRoZU1lbnUudXBkYXRlRW1vdGVzKHNlbGYuZW1vdGVzW2Vtb3RlTmFtZV0uaW5zdGFuY2UuZ2V0VGV4dCgpKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSUdyb3VwLnByb3RvdHlwZS5pc1Zpc2libGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHQvLyBJZiBhbnkgZW1vdGUgaXMgdmlzaWJsZSwgdGhlIGdyb3VwIHNob3VsZCBiZSB2aXNpYmxlLlxyXG5cdHJldHVybiBPYmplY3Qua2V5cyh0aGlzLmVtb3Rlcykuc29tZShmdW5jdGlvbiAoZW1vdGVOYW1lKSB7XHJcblx0XHRyZXR1cm4gc2VsZi5lbW90ZXNbZW1vdGVOYW1lXS5pc1Zpc2libGUoKTtcclxuXHR9KTtcclxufTtcclxuXHJcblVJR3JvdXAucHJvdG90eXBlLmFkZEVtb3RlID0gZnVuY3Rpb24gKGVtb3RlSW5zdGFuY2UpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0dmFyIGVtb3RlID0gdGhpcy5nZXRFbW90ZShlbW90ZUluc3RhbmNlLmdldFRleHQoKSk7XHJcblxyXG5cdC8vIEFscmVhZHkgYWRkZWQsIHVwZGF0ZSBpbnN0ZWFkLlxyXG5cdGlmIChlbW90ZSkge1xyXG5cdFx0ZW1vdGUudXBkYXRlKCk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdC8vIEFkZCB0byBjdXJyZW50IGVtb3Rlcy5cclxuXHRlbW90ZSA9IG5ldyBVSUVtb3RlKGVtb3RlSW5zdGFuY2UpO1xyXG5cdHRoaXMuZW1vdGVzW2Vtb3RlSW5zdGFuY2UuZ2V0VGV4dCgpXSA9IGVtb3RlO1xyXG5cclxuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuZW1vdGVzKTtcclxuXHJcblx0a2V5cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcblx0XHQvLyBHZXQgdGhlIGVtb3RlIGluc3RhbmNlcy5cclxuXHRcdGEgPSBzZWxmLmVtb3Rlc1thXS5pbnN0YW5jZTtcclxuXHRcdGIgPSBzZWxmLmVtb3Rlc1tiXS5pbnN0YW5jZTtcclxuXHJcblx0XHQvLyBBIGlzIGEgc21pbGV5LCBCIGlzbid0LiBBIGdvZXMgZmlyc3QuXHJcblx0XHRpZiAoYS5pc1NtaWxleSgpICYmXHQhYi5pc1NtaWxleSgpKSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdC8vIEIgaXMgYSBzbWlsZXksIEEgaXNuJ3QuIEIgZ29lcyBmaXJzdC5cclxuXHRcdGlmIChiLmlzU21pbGV5KCkgJiZcdCFhLmlzU21pbGV5KCkpIHtcclxuXHRcdFx0cmV0dXJuIDE7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gR2V0IHRoZSB0ZXh0IG9mIHRoZSBlbW90ZXMuXHJcblx0XHRhID0gYS5nZXRUZXh0KCkudG9Mb3dlckNhc2UoKTtcclxuXHRcdGIgPSBiLmdldFRleHQoKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuXHRcdC8vIEEgZ29lcyBmaXJzdC5cclxuXHRcdGlmIChhIDwgYikge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHQvLyBCIGdvZXN0IGZpcnN0LlxyXG5cdFx0aWYgKGEgPiBiKSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cdFx0Ly8gQm90aCB0aGUgc2FtZSwgZG9lc24ndCBtYXR0ZXIuXHJcblx0XHRyZXR1cm4gMDtcclxuXHR9KTtcclxuXHJcblx0dmFyIGluZGV4ID0ga2V5cy5pbmRleE9mKGVtb3RlSW5zdGFuY2UuZ2V0VGV4dCgpKTtcclxuXHJcblx0Ly8gRmlyc3QgaW4gdGhlIHNvcnQsIHBsYWNlIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGdyb3VwLlxyXG5cdGlmIChpbmRleCA9PT0gMCkge1xyXG5cdFx0ZW1vdGUuZG9tLnByZXBlbmRUbyh0aGlzLmRvbS5maW5kKCcuZW1vdGUtY29udGFpbmVyJykpO1xyXG5cdH1cclxuXHQvLyBJbnNlcnQgYWZ0ZXIgdGhlIHByZXZpb3VzIGVtb3RlIGluIHRoZSBzb3J0LlxyXG5cdGVsc2Uge1xyXG5cdFx0ZW1vdGUuZG9tLmluc2VydEFmdGVyKHRoaXMuZ2V0RW1vdGUoa2V5c1tpbmRleCAtIDFdKS5kb20pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSUdyb3VwLnByb3RvdHlwZS5nZXRFbW90ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0cmV0dXJuIHRoaXMuZW1vdGVzW25hbWVdIHx8IG51bGw7XHJcbn07XHJcblxyXG5VSUdyb3VwLnByb3RvdHlwZS5yZW1vdmVFbW90ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0dmFyIGVtb3RlID0gdGhpcy5nZXRFbW90ZShuYW1lKTtcclxuXHRpZiAoIWVtb3RlKSB7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblx0ZW1vdGUuZG9tLnJlbW92ZSgpO1xyXG5cdGRlbGV0ZSB0aGlzLmVtb3Rlc1tuYW1lXTtcclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBVSUZhdm9yaXRlc0dyb3VwKCkge1xyXG5cdHRoaXMuZG9tID0gJCgnI3N0YXJyZWQtZW1vdGVzLWdyb3VwJyk7XHJcblx0dGhpcy5lbW90ZXMgPSB7fTtcclxufVxyXG5cclxuVUlGYXZvcml0ZXNHcm91cC5wcm90b3R5cGUuYWRkRW1vdGUgPSBVSUdyb3VwLnByb3RvdHlwZS5hZGRFbW90ZTtcclxuVUlGYXZvcml0ZXNHcm91cC5wcm90b3R5cGUuZ2V0RW1vdGUgPSBVSUdyb3VwLnByb3RvdHlwZS5nZXRFbW90ZTtcclxuVUlGYXZvcml0ZXNHcm91cC5wcm90b3R5cGUucmVtb3ZlRW1vdGUgPSBVSUdyb3VwLnByb3RvdHlwZS5yZW1vdmVFbW90ZTtcclxuXHJcbmZ1bmN0aW9uIFVJRW1vdGUoZW1vdGVJbnN0YW5jZSkge1xyXG5cdHRoaXMuZG9tID0gbnVsbDtcclxuXHR0aGlzLmluc3RhbmNlID0gZW1vdGVJbnN0YW5jZTtcclxuXHR0aGlzLmluaXQoKTtcclxufVxyXG5cclxuVUlFbW90ZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdC8vIENyZWF0ZSBlbGVtZW50LlxyXG5cdHRoaXMuZG9tID0gJCh0ZW1wbGF0ZXMuZW1vdGUoe1xyXG5cdFx0dXJsOiB0aGlzLmluc3RhbmNlLmdldFVybCgpLFxyXG5cdFx0dGV4dDogdGhpcy5pbnN0YW5jZS5nZXRUZXh0KCksXHJcblx0XHR0aGlyZFBhcnR5OiB0aGlzLmluc3RhbmNlLmlzVGhpcmRQYXJ0eSgpLFxyXG5cdFx0aXNWaXNpYmxlOiB0aGlzLmluc3RhbmNlLmlzVmlzaWJsZSgpLFxyXG5cdFx0aXNTdGFycmVkOiB0aGlzLmluc3RhbmNlLmlzRmF2b3JpdGUoKVxyXG5cdH0pKTtcclxuXHJcblx0Ly8gRW5hYmxlIGNsaWNraW5nLlxyXG5cdHRoaXMuZG9tLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghdGhlTWVudS5pc0VkaXRpbmcoKSkge1xyXG5cdFx0XHRzZWxmLmFkZFRvQ2hhdCgpO1xyXG5cclxuXHRcdFx0Ly8gQ2xvc2UgdGhlIG1lbnUgaWYgbm90IHBpbm5lZC5cclxuXHRcdFx0aWYgKCF0aGVNZW51LmlzUGlubmVkKCkpIHtcclxuXHRcdFx0XHR0aGVNZW51LnRvZ2dsZURpc3BsYXkoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgZW1vdGUgaGlkaW5nLlxyXG5cdHRoaXMuZG9tLmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtdmlzaWJpbGl0eVwiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghdGhlTWVudS5pc0VkaXRpbmcoKSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRzZWxmLnRvZ2dsZURpc3BsYXkoKTtcclxuXHRcdHRoZU1lbnUudXBkYXRlRW1vdGVzKHNlbGYuaW5zdGFuY2UuZ2V0VGV4dCgpKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIGVtb3RlIGZhdm9yaXRpbmcuXHJcblx0dGhpcy5kb20uZmluZCgnW2RhdGEtY29tbWFuZD1cInRvZ2dsZS1zdGFycmVkXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKCF0aGVNZW51LmlzRWRpdGluZygpKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdHNlbGYudG9nZ2xlRmF2b3JpdGUoKTtcclxuXHRcdHRoZU1lbnUudXBkYXRlRW1vdGVzKHNlbGYuaW5zdGFuY2UuZ2V0VGV4dCgpKTtcclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSUVtb3RlLnByb3RvdHlwZS50b2dnbGVEaXNwbGF5ID0gZnVuY3Rpb24gKGZvcmNlZCwgc2tpcEluc3RhbmNlVXBkYXRlKSB7XHJcblx0dmFyIHN0YXRlID0gdHlwZW9mIGZvcmNlZCAhPT0gJ3VuZGVmaW5lZCcgPyAhZm9yY2VkIDogdGhpcy5pc1Zpc2libGUoKTtcclxuXHR0aGlzLmRvbS50b2dnbGVDbGFzcygnZW1vdGUtbWVudS1oaWRkZW4nLCBzdGF0ZSk7XHJcblx0aWYgKCFza2lwSW5zdGFuY2VVcGRhdGUpIHtcclxuXHRcdHRoaXMuaW5zdGFuY2UudG9nZ2xlVmlzaWJpbGl0eSghc3RhdGUpO1xyXG5cdH1cclxuXHJcblx0dmFyIGdyb3VwID0gdGhpcy5nZXRHcm91cCgpO1xyXG5cdGdyb3VwLnRvZ2dsZURpc3BsYXkoZ3JvdXAuaXNWaXNpYmxlKCksIHRydWUpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLmlzVmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gIXRoaXMuZG9tLmhhc0NsYXNzKCdlbW90ZS1tZW51LWhpZGRlbicpO1xyXG59O1xyXG5cclxuVUlFbW90ZS5wcm90b3R5cGUudG9nZ2xlRmF2b3JpdGUgPSBmdW5jdGlvbiAoZm9yY2VkLCBza2lwSW5zdGFuY2VVcGRhdGUpIHtcclxuXHR2YXIgc3RhdGUgPSB0eXBlb2YgZm9yY2VkICE9PSAndW5kZWZpbmVkJyA/ICEhZm9yY2VkIDogIXRoaXMuaXNGYXZvcml0ZSgpO1xyXG5cdHRoaXMuZG9tLnRvZ2dsZUNsYXNzKCdlbW90ZS1tZW51LXN0YXJyZWQnLCBzdGF0ZSk7XHJcblx0aWYgKCFza2lwSW5zdGFuY2VVcGRhdGUpIHtcclxuXHRcdHRoaXMuaW5zdGFuY2UudG9nZ2xlRmF2b3JpdGUoc3RhdGUpO1xyXG5cdH1cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLmlzRmF2b3JpdGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMuZG9tLmhhc0NsYXNzKCdlbW90ZS1tZW51LXN0YXJyZWQnKTtcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLmFkZFRvQ2hhdCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgZW1iZXIgPSByZXF1aXJlKCcuL2VtYmVyLWFwaScpO1xyXG5cdC8vIEdldCB0ZXh0YXJlYSBlbGVtZW50LlxyXG5cdHZhciBlbGVtZW50ID0gJCgnLmNoYXQtaW50ZXJmYWNlIHRleHRhcmVhJykuZ2V0KDApO1xyXG5cdHZhciB0ZXh0ID0gdGhpcy5pbnN0YW5jZS5nZXRUZXh0KCk7XHJcblxyXG5cdC8vIEluc2VydCBhdCBjdXJzb3IgLyByZXBsYWNlIHNlbGVjdGlvbi5cclxuXHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0NvZGVfc25pcHBldHMvTWlzY2VsbGFuZW91c1xyXG5cdHZhciBzZWxlY3Rpb25FbmQgPSBlbGVtZW50LnNlbGVjdGlvblN0YXJ0ICsgdGV4dC5sZW5ndGg7XHJcblx0dmFyIGN1cnJlbnRWYWx1ZSA9IGVsZW1lbnQudmFsdWU7XHJcblx0dmFyIGJlZm9yZVRleHQgPSBjdXJyZW50VmFsdWUuc3Vic3RyaW5nKDAsIGVsZW1lbnQuc2VsZWN0aW9uU3RhcnQpO1xyXG5cdHZhciBhZnRlclRleHQgPSBjdXJyZW50VmFsdWUuc3Vic3RyaW5nKGVsZW1lbnQuc2VsZWN0aW9uRW5kLCBjdXJyZW50VmFsdWUubGVuZ3RoKTtcclxuXHQvLyBTbWFydCBwYWRkaW5nLCBvbmx5IHB1dCBzcGFjZSBhdCBzdGFydCBpZiBuZWVkZWQuXHJcblx0aWYgKFxyXG5cdFx0YmVmb3JlVGV4dCAhPT0gJycgJiZcclxuXHRcdGJlZm9yZVRleHQuc3Vic3RyKC0xKSAhPT0gJyAnXHJcblx0KSB7XHJcblx0XHR0ZXh0ID0gJyAnICsgdGV4dDtcclxuXHR9XHJcblx0Ly8gQWx3YXlzIHB1dCBzcGFjZSBhdCBlbmQuXHJcblx0dGV4dCA9IGJlZm9yZVRleHQgKyB0ZXh0ICsgJyAnICsgYWZ0ZXJUZXh0O1xyXG5cdC8vIFNldCB0aGUgdGV4dC5cclxuXHRlbWJlci5nZXQoJ2NvbnRyb2xsZXI6Y2hhdCcsICdjdXJyZW50Um9vbScpLnNldCgnbWVzc2FnZVRvU2VuZCcsIHRleHQpO1xyXG5cdGVsZW1lbnQuZm9jdXMoKTtcclxuXHQvLyBQdXQgY3Vyc29yIGF0IGVuZC5cclxuXHRzZWxlY3Rpb25FbmQgPSBlbGVtZW50LnNlbGVjdGlvblN0YXJ0ICsgdGV4dC5sZW5ndGg7XHJcblx0ZWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZShzZWxlY3Rpb25FbmQsIHNlbGVjdGlvbkVuZCk7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlFbW90ZS5wcm90b3R5cGUuZ2V0R3JvdXAgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoZU1lbnUuZ2V0R3JvdXAodGhpcy5pbnN0YW5jZS5nZXRDaGFubmVsTmFtZSgpKTtcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuXHR0aGlzLnRvZ2dsZURpc3BsYXkodGhpcy5pbnN0YW5jZS5pc1Zpc2libGUoKSwgdHJ1ZSk7XHJcblx0dGhpcy50b2dnbGVGYXZvcml0ZSh0aGlzLmluc3RhbmNlLmlzRmF2b3JpdGUoKSwgdHJ1ZSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwiKGZ1bmN0aW9uICgkKSB7XHJcblx0JC5mbi5yZXNpemFibGUgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cdFx0dmFyIHNldHRpbmdzID0gJC5leHRlbmQoe1xyXG5cdFx0XHRhbHNvUmVzaXplOiBudWxsLFxyXG5cdFx0XHRhbHNvUmVzaXplVHlwZTogJ2JvdGgnLCAvLyBgaGVpZ2h0YCwgYHdpZHRoYCwgYGJvdGhgXHJcblx0XHRcdGNvbnRhaW5tZW50OiBudWxsLFxyXG5cdFx0XHRjcmVhdGU6IG51bGwsXHJcblx0XHRcdGRlc3Ryb3k6IG51bGwsXHJcblx0XHRcdGhhbmRsZTogJy5yZXNpemUtaGFuZGxlJyxcclxuXHRcdFx0bWF4SGVpZ2h0OiA5OTk5LFxyXG5cdFx0XHRtYXhXaWR0aDogOTk5OSxcclxuXHRcdFx0bWluSGVpZ2h0OiAwLFxyXG5cdFx0XHRtaW5XaWR0aDogMCxcclxuXHRcdFx0cmVzaXplOiBudWxsLFxyXG5cdFx0XHRyZXNpemVPbmNlOiBudWxsLFxyXG5cdFx0XHRzbmFwU2l6ZTogMSxcclxuXHRcdFx0c3RhcnQ6IG51bGwsXHJcblx0XHRcdHN0b3A6IG51bGxcclxuXHRcdH0sIG9wdGlvbnMpO1xyXG5cclxuXHRcdHNldHRpbmdzLmVsZW1lbnQgPSAkKHRoaXMpO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHJlY2FsY3VsYXRlU2l6ZShldnQpIHtcclxuXHRcdFx0dmFyIGRhdGEgPSBldnQuZGF0YSxcclxuXHRcdFx0XHRyZXNpemVkID0ge307XHJcblx0XHRcdGRhdGEuZGlmZlggPSBNYXRoLnJvdW5kKChldnQucGFnZVggLSBkYXRhLnBhZ2VYKSAvIHNldHRpbmdzLnNuYXBTaXplKSAqIHNldHRpbmdzLnNuYXBTaXplO1xyXG5cdFx0XHRkYXRhLmRpZmZZID0gTWF0aC5yb3VuZCgoZXZ0LnBhZ2VZIC0gZGF0YS5wYWdlWSkgLyBzZXR0aW5ncy5zbmFwU2l6ZSkgKiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHRcdFx0aWYgKE1hdGguYWJzKGRhdGEuZGlmZlgpID4gMCB8fCBNYXRoLmFicyhkYXRhLmRpZmZZKSA+IDApIHtcclxuXHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LmhlaWdodCgpICE9PSBkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgJiZcclxuXHRcdFx0XHRcdGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSA+PSBzZXR0aW5ncy5taW5IZWlnaHQgJiZcclxuXHRcdFx0XHRcdGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSA8PSBzZXR0aW5ncy5tYXhIZWlnaHQgJiZcclxuXHRcdFx0XHRcdChzZXR0aW5ncy5jb250YWlubWVudCA/IGRhdGEub3V0ZXJIZWlnaHQgKyBkYXRhLmRpZmZZICsgZGF0YS5vZmZzZXQudG9wIDw9IHNldHRpbmdzLmNvbnRhaW5tZW50Lm9mZnNldCgpLnRvcCArIHNldHRpbmdzLmNvbnRhaW5tZW50Lm91dGVySGVpZ2h0KCkgOiB0cnVlKVxyXG5cdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZKTtcclxuXHRcdFx0XHRcdHJlc2l6ZWQuaGVpZ2h0ID0gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC53aWR0aCgpICE9PSBkYXRhLndpZHRoICsgZGF0YS5kaWZmWCAmJlxyXG5cdFx0XHRcdFx0ZGF0YS53aWR0aCArIGRhdGEuZGlmZlggPj0gc2V0dGluZ3MubWluV2lkdGggJiZcclxuXHRcdFx0XHRcdGRhdGEud2lkdGggKyBkYXRhLmRpZmZYIDw9IHNldHRpbmdzLm1heFdpZHRoICYmXHJcblx0XHRcdFx0XHQoc2V0dGluZ3MuY29udGFpbm1lbnQgPyBkYXRhLm91dGVyV2lkdGggKyBkYXRhLmRpZmZYICsgZGF0YS5vZmZzZXQubGVmdCA8PSBzZXR0aW5ncy5jb250YWlubWVudC5vZmZzZXQoKS5sZWZ0ICsgc2V0dGluZ3MuY29udGFpbm1lbnQub3V0ZXJXaWR0aCgpIDogdHJ1ZSlcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQud2lkdGgoZGF0YS53aWR0aCArIGRhdGEuZGlmZlgpO1xyXG5cdFx0XHRcdFx0cmVzaXplZC53aWR0aCA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChyZXNpemVkLmhlaWdodCB8fCByZXNpemVkLndpZHRoKSB7XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MucmVzaXplT25jZSkge1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemVPbmNlLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoZXZ0LmRhdGEpO1xyXG5cdFx0XHRcdFx0XHRzZXR0aW5ncy5yZXNpemVPbmNlID0gbnVsbDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5yZXNpemUpIHtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplLmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoZXZ0LmRhdGEpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLmFsc29SZXNpemUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHJlc2l6ZWQuaGVpZ2h0ICYmIChzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSA9PT0gJ2hlaWdodCcgfHwgc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdib3RoJykpIHtcclxuXHRcdFx0XHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplLmhlaWdodChkYXRhLmFsc29SZXNpemVIZWlnaHQgKyBkYXRhLmRpZmZZKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAocmVzaXplZC53aWR0aCAmJiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICd3aWR0aCcgfHwgc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdib3RoJykpIHtcclxuXHRcdFx0XHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplLndpZHRoKGRhdGEuYWxzb1Jlc2l6ZVdpZHRoICsgZGF0YS5kaWZmWCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBzdGFydChldnQpIHtcclxuXHRcdFx0ZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5zdGFydCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLnN0YXJ0LmJpbmQoc2V0dGluZ3MuZWxlbWVudCkoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR2YXIgZGF0YSA9IHtcclxuXHRcdFx0XHRhbHNvUmVzaXplSGVpZ2h0OiBzZXR0aW5ncy5hbHNvUmVzaXplID8gc2V0dGluZ3MuYWxzb1Jlc2l6ZS5oZWlnaHQoKSA6IDAsXHJcblx0XHRcdFx0YWxzb1Jlc2l6ZVdpZHRoOiBzZXR0aW5ncy5hbHNvUmVzaXplID8gc2V0dGluZ3MuYWxzb1Jlc2l6ZS53aWR0aCgpIDogMCxcclxuXHRcdFx0XHRoZWlnaHQ6IHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KCksXHJcblx0XHRcdFx0b2Zmc2V0OiBzZXR0aW5ncy5lbGVtZW50Lm9mZnNldCgpLFxyXG5cdFx0XHRcdG91dGVySGVpZ2h0OiBzZXR0aW5ncy5lbGVtZW50Lm91dGVySGVpZ2h0KCksXHJcblx0XHRcdFx0b3V0ZXJXaWR0aDogc2V0dGluZ3MuZWxlbWVudC5vdXRlcldpZHRoKCksXHJcblx0XHRcdFx0cGFnZVg6IGV2dC5wYWdlWCxcclxuXHRcdFx0XHRwYWdlWTogZXZ0LnBhZ2VZLFxyXG5cdFx0XHRcdHdpZHRoOiBzZXR0aW5ncy5lbGVtZW50LndpZHRoKClcclxuXHRcdFx0fTtcclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNlbW92ZScsICcqJywgZGF0YSwgcmVjYWxjdWxhdGVTaXplKTtcclxuXHRcdFx0JChkb2N1bWVudCkub24oJ21vdXNldXAnLCAnKicsIHN0b3ApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHN0b3AoKSB7XHJcblx0XHRcdGlmIChzZXR0aW5ncy5zdG9wKSB7XHJcblx0XHRcdFx0c2V0dGluZ3Muc3RvcC5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZW1vdmUnLCAnKicsIHJlY2FsY3VsYXRlU2l6ZSk7XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2V1cCcsICcqJywgc3RvcCk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHNldHRpbmdzLmhhbmRsZSkge1xyXG5cdFx0XHRpZiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZSAmJiBbJ2JvdGgnLCAnaGVpZ2h0JywgJ3dpZHRoJ10uaW5kZXhPZihzZXR0aW5ncy5hbHNvUmVzaXplVHlwZSkgPj0gMCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmFsc29SZXNpemUgPSAkKHNldHRpbmdzLmFsc29SZXNpemUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChzZXR0aW5ncy5jb250YWlubWVudCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmNvbnRhaW5tZW50ID0gJChzZXR0aW5ncy5jb250YWlubWVudCk7XHJcblx0XHRcdH1cclxuXHRcdFx0c2V0dGluZ3MuaGFuZGxlID0gJChzZXR0aW5ncy5oYW5kbGUpO1xyXG5cdFx0XHRzZXR0aW5ncy5zbmFwU2l6ZSA9IHNldHRpbmdzLnNuYXBTaXplIDwgMSA/IDEgOiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHJcblx0XHRcdGlmIChvcHRpb25zID09PSAnZGVzdHJveScpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5oYW5kbGUub2ZmKCdtb3VzZWRvd24nLCBzdGFydCk7XHJcblxyXG5cdFx0XHRcdGlmIChzZXR0aW5ncy5kZXN0cm95KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5kZXN0cm95LmJpbmQodGhpcykoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHNldHRpbmdzLmhhbmRsZS5vbignbW91c2Vkb3duJywgc3RhcnQpO1xyXG5cclxuXHRcdFx0aWYgKHNldHRpbmdzLmNyZWF0ZSkge1xyXG5cdFx0XHRcdHNldHRpbmdzLmNyZWF0ZS5iaW5kKHRoaXMpKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH07XHJcbn0pKGpRdWVyeSk7XHJcbiJdfQ==
