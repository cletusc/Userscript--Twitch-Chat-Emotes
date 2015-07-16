// ==UserScript==
// @name Twitch Chat Emotes
// @namespace #Cletus
// @version 1.1.1
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
// @exclude http://api.twitch.tv/*
// @exclude http://tmi.twitch.tv/*
// @exclude http://chatdepot.twitch.tv/*
// ==/UserScript==

/* Script compiled using build script. Script uses Browserify for CommonJS modules. */

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var pkg = require('../package.json');
var publicApi = require('./modules/public-api');
var ember = require('./modules/ember-api');
var logger = require('./modules/logger');
var emotes = require('./modules/emotes');
var ui = require('./modules/ui');

logger.log('Initial load on ' + location.href);

// Only enable script if we have the right variables.
//---------------------------------------------------
var initTimer = 0;
(function init(time) {
	// Don't run in an iframe.
	if (window.frameElement) {
		return;
	}
	
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
	emotes.init();
	ui.init();
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
".scroll-wrapper{overflow:hidden!important;padding:0!important;position:relative}.scroll-wrapper>.scroll-content{border:none!important;-moz-box-sizing:content-box!important;box-sizing:content-box!important;height:auto;left:0;margin:0;max-height:none!important;max-width:none!important;overflow:scroll!important;padding:0;position:relative!important;top:0;width:auto!important}.scroll-wrapper>.scroll-content::-webkit-scrollbar{height:0;width:0}.scroll-element{display:none}.scroll-element,.scroll-element div{-moz-box-sizing:content-box;box-sizing:content-box}.scroll-element.scroll-x.scroll-scrollx_visible,.scroll-element.scroll-y.scroll-scrolly_visible{display:block}.scroll-element .scroll-arrow,.scroll-element .scroll-bar{cursor:default}.scroll-textarea{border:1px solid #ccc;border-top-color:#999}.scroll-textarea>.scroll-content{overflow:hidden!important}.scroll-textarea>.scroll-content>textarea{border:none!important;-moz-box-sizing:border-box;box-sizing:border-box;height:100%!important;margin:0;max-height:none!important;max-width:none!important;overflow:scroll!important;outline:0;padding:2px;position:relative!important;top:0;width:100%!important}.scroll-textarea>.scroll-content>textarea::-webkit-scrollbar{height:0;width:0}.scrollbar-inner>.scroll-element,.scrollbar-inner>.scroll-element div{border:none;margin:0;padding:0;position:absolute;z-index:10}.scrollbar-inner>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-inner>.scroll-element.scroll-x{bottom:2px;height:8px;left:0;width:100%}.scrollbar-inner>.scroll-element.scroll-y{height:100%;right:2px;top:0;width:8px}.scrollbar-inner>.scroll-element .scroll-element_outer{overflow:hidden}.scrollbar-inner>.scroll-element .scroll-bar,.scrollbar-inner>.scroll-element .scroll-element_outer,.scrollbar-inner>.scroll-element .scroll-element_track{border-radius:8px}.scrollbar-inner>.scroll-element .scroll-bar,.scrollbar-inner>.scroll-element .scroll-element_track{-ms-filter:\"alpha(Opacity=40)\";filter:alpha(opacity=40);opacity:.4}.scrollbar-inner>.scroll-element .scroll-element_track{background-color:#e0e0e0}.scrollbar-inner>.scroll-element .scroll-bar{background-color:#c2c2c2}.scrollbar-inner>.scroll-element.scroll-draggable .scroll-bar,.scrollbar-inner>.scroll-element:hover .scroll-bar{background-color:#919191}.scrollbar-inner>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-12px}.scrollbar-inner>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-12px}.scrollbar-inner>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-12px}.scrollbar-inner>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-12px}.scrollbar-outer>.scroll-element,.scrollbar-outer>.scroll-element div{border:none;margin:0;padding:0;position:absolute;z-index:10}.scrollbar-outer>.scroll-element{background-color:#fff}.scrollbar-outer>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-outer>.scroll-element.scroll-x{bottom:0;height:12px;left:0;width:100%}.scrollbar-outer>.scroll-element.scroll-y{height:100%;right:0;top:0;width:12px}.scrollbar-outer>.scroll-element.scroll-x .scroll-element_outer{height:8px;top:2px}.scrollbar-outer>.scroll-element.scroll-y .scroll-element_outer{left:2px;width:8px}.scrollbar-outer>.scroll-element .scroll-element_outer{overflow:hidden}.scrollbar-outer>.scroll-element .scroll-element_track{background-color:#eee}.scrollbar-outer>.scroll-element .scroll-bar,.scrollbar-outer>.scroll-element .scroll-element_outer,.scrollbar-outer>.scroll-element .scroll-element_track{border-radius:8px}.scrollbar-outer>.scroll-element .scroll-bar{background-color:#d9d9d9}.scrollbar-outer>.scroll-element .scroll-bar:hover{background-color:#c2c2c2}.scrollbar-outer>.scroll-element.scroll-draggable .scroll-bar{background-color:#919191}.scrollbar-outer>.scroll-content.scroll-scrolly_visible{left:-12px;margin-left:12px}.scrollbar-outer>.scroll-content.scroll-scrollx_visible{top:-12px;margin-top:12px}.scrollbar-outer>.scroll-element.scroll-x .scroll-bar{min-width:10px}.scrollbar-outer>.scroll-element.scroll-y .scroll-bar{min-height:10px}.scrollbar-outer>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-14px}.scrollbar-outer>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-14px}.scrollbar-outer>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-14px}.scrollbar-outer>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-14px}.scrollbar-macosx>.scroll-element,.scrollbar-macosx>.scroll-element div{background:0 0;border:none;margin:0;padding:0;position:absolute;z-index:10}.scrollbar-macosx>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-macosx>.scroll-element .scroll-element_track{display:none}.scrollbar-macosx>.scroll-element .scroll-bar{background-color:#6C6E71;display:block;-ms-filter:\"alpha(Opacity=0)\";filter:alpha(opacity=0);opacity:0;border-radius:7px;-webkit-transition:opacity .2s linear;transition:opacity .2s linear}.scrollbar-macosx:hover>.scroll-element .scroll-bar,.scrollbar-macosx>.scroll-element.scroll-draggable .scroll-bar{-ms-filter:\"alpha(Opacity=70)\";filter:alpha(opacity=70);opacity:.7}.scrollbar-macosx>.scroll-element.scroll-x{bottom:0;height:0;left:0;min-width:100%;overflow:visible;width:100%}.scrollbar-macosx>.scroll-element.scroll-y{height:100%;min-height:100%;right:0;top:0;width:0}.scrollbar-macosx>.scroll-element.scroll-x .scroll-bar{height:7px;min-width:10px;top:-9px}.scrollbar-macosx>.scroll-element.scroll-y .scroll-bar{left:-9px;min-height:10px;width:7px}.scrollbar-macosx>.scroll-element.scroll-x .scroll-element_outer{left:2px}.scrollbar-macosx>.scroll-element.scroll-x .scroll-element_size{left:-4px}.scrollbar-macosx>.scroll-element.scroll-y .scroll-element_outer{top:2px}.scrollbar-macosx>.scroll-element.scroll-y .scroll-element_size{top:-4px}.scrollbar-macosx>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-11px}.scrollbar-macosx>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-11px}.scrollbar-light>.scroll-element,.scrollbar-light>.scroll-element div{border:none;margin:0;overflow:hidden;padding:0;position:absolute;z-index:10}.scrollbar-light>.scroll-element{background-color:#fff}.scrollbar-light>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-light>.scroll-element .scroll-element_outer{border-radius:10px}.scrollbar-light>.scroll-element .scroll-element_size{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDEgMSIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkLXVjZ2ctZ2VuZXJhdGVkIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2RiZGJkYiIgc3RvcC1vcGFjaXR5PSIxIi8+CiAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlOGU4ZTgiIHN0b3Atb3BhY2l0eT0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0idXJsKCNncmFkLXVjZ2ctZ2VuZXJhdGVkKSIgLz4KPC9zdmc+);background:-webkit-gradient(linear,left top,right top,color-stop(0%,#dbdbdb),color-stop(100%,#e8e8e8));background:-webkit-linear-gradient(left,#dbdbdb 0,#e8e8e8 100%);background:linear-gradient(to right,#dbdbdb 0,#e8e8e8 100%);border-radius:10px}.scrollbar-light>.scroll-element.scroll-x{bottom:0;height:17px;left:0;min-width:100%;width:100%}.scrollbar-light>.scroll-element.scroll-y{height:100%;min-height:100%;right:0;top:0;width:17px}.scrollbar-light>.scroll-element .scroll-bar{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pgo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDEgMSIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkLXVjZ2ctZ2VuZXJhdGVkIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZlZmVmZSIgc3RvcC1vcGFjaXR5PSIxIi8+CiAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmNWY1ZjUiIHN0b3Atb3BhY2l0eT0iMSIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0idXJsKCNncmFkLXVjZ2ctZ2VuZXJhdGVkKSIgLz4KPC9zdmc+);background:-webkit-gradient(linear,left top,right top,color-stop(0%,#fefefe),color-stop(100%,#f5f5f5));background:-webkit-linear-gradient(left,#fefefe 0,#f5f5f5 100%);background:linear-gradient(to right,#fefefe 0,#f5f5f5 100%);border:1px solid #dbdbdb;border-radius:10px}.scrollbar-light>.scroll-content.scroll-scrolly_visible{left:-17px;margin-left:17px}.scrollbar-light>.scroll-content.scroll-scrollx_visible{top:-17px;margin-top:17px}.scrollbar-light>.scroll-element.scroll-x .scroll-bar{height:10px;min-width:10px;top:0}.scrollbar-light>.scroll-element.scroll-y .scroll-bar{left:0;min-height:10px;width:10px}.scrollbar-light>.scroll-element.scroll-x .scroll-element_outer{height:12px;left:2px;top:2px}.scrollbar-light>.scroll-element.scroll-x .scroll-element_size{left:-4px}.scrollbar-light>.scroll-element.scroll-y .scroll-element_outer{left:2px;top:2px;width:12px}.scrollbar-light>.scroll-element.scroll-y .scroll-element_size{top:-4px}.scrollbar-light>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-19px}.scrollbar-light>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-19px}.scrollbar-light>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-19px}.scrollbar-light>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-19px}.scrollbar-rail>.scroll-element,.scrollbar-rail>.scroll-element div{border:none;margin:0;overflow:hidden;padding:0;position:absolute;z-index:10}.scrollbar-rail>.scroll-element{background-color:#fff}.scrollbar-rail>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-rail>.scroll-element .scroll-element_size{background-color:#999;background-color:rgba(0,0,0,.3)}.scrollbar-rail>.scroll-element .scroll-element_outer:hover .scroll-element_size{background-color:#666;background-color:rgba(0,0,0,.5)}.scrollbar-rail>.scroll-element.scroll-x{bottom:0;height:12px;left:0;min-width:100%;padding:3px 0 2px;width:100%}.scrollbar-rail>.scroll-element.scroll-y{height:100%;min-height:100%;padding:0 2px 0 3px;right:0;top:0;width:12px}.scrollbar-rail>.scroll-element .scroll-bar{background-color:#d0b9a0;border-radius:2px;box-shadow:1px 1px 3px rgba(0,0,0,.5)}.scrollbar-rail>.scroll-element .scroll-element_outer:hover .scroll-bar{box-shadow:1px 1px 3px rgba(0,0,0,.6)}.scrollbar-rail>.scroll-content.scroll-scrolly_visible{left:-17px;margin-left:17px}.scrollbar-rail>.scroll-content.scroll-scrollx_visible{margin-top:17px;top:-17px}.scrollbar-rail>.scroll-element.scroll-x .scroll-bar{height:10px;min-width:10px;top:1px}.scrollbar-rail>.scroll-element.scroll-y .scroll-bar{left:1px;min-height:10px;width:10px}.scrollbar-rail>.scroll-element.scroll-x .scroll-element_outer{height:15px;left:5px}.scrollbar-rail>.scroll-element.scroll-x .scroll-element_size{height:2px;left:-10px;top:5px}.scrollbar-rail>.scroll-element.scroll-y .scroll-element_outer{top:5px;width:15px}.scrollbar-rail>.scroll-element.scroll-y .scroll-element_size{left:5px;top:-10px;width:2px}.scrollbar-rail>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-25px}.scrollbar-rail>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-25px}.scrollbar-rail>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-25px}.scrollbar-rail>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-25px}.scrollbar-dynamic>.scroll-element,.scrollbar-dynamic>.scroll-element div{background:0 0;border:none;margin:0;padding:0;position:absolute;z-index:10}.scrollbar-dynamic>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-dynamic>.scroll-element.scroll-x{bottom:2px;height:7px;left:0;min-width:100%;width:100%}.scrollbar-dynamic>.scroll-element.scroll-y{height:100%;min-height:100%;right:2px;top:0;width:7px}.scrollbar-dynamic>.scroll-element .scroll-element_outer{opacity:.3;border-radius:12px}.scrollbar-dynamic>.scroll-element .scroll-element_size{background-color:#ccc;opacity:0;border-radius:12px;-webkit-transition:opacity .2s;transition:opacity .2s}.scrollbar-dynamic>.scroll-element .scroll-bar{background-color:#6c6e71;border-radius:7px}.scrollbar-dynamic>.scroll-element.scroll-x .scroll-bar{bottom:0;height:7px;min-width:24px;top:auto}.scrollbar-dynamic>.scroll-element.scroll-y .scroll-bar{left:auto;min-height:24px;right:0;width:7px}.scrollbar-dynamic>.scroll-element.scroll-x .scroll-element_outer{bottom:0;top:auto;left:2px;-webkit-transition:height .2s;transition:height .2s}.scrollbar-dynamic>.scroll-element.scroll-y .scroll-element_outer{left:auto;right:0;top:2px;-webkit-transition:width .2s;transition:width .2s}.scrollbar-dynamic>.scroll-element.scroll-x .scroll-element_size{left:-4px}.scrollbar-dynamic>.scroll-element.scroll-y .scroll-element_size{top:-4px}.scrollbar-dynamic>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-11px}.scrollbar-dynamic>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-11px}.scrollbar-dynamic>.scroll-element.scroll-draggable .scroll-element_outer,.scrollbar-dynamic>.scroll-element:hover .scroll-element_outer{overflow:hidden;-ms-filter:\"alpha(Opacity=70)\";filter:alpha(opacity=70);opacity:.7}.scrollbar-dynamic>.scroll-element.scroll-draggable .scroll-element_outer .scroll-element_size,.scrollbar-dynamic>.scroll-element:hover .scroll-element_outer .scroll-element_size{opacity:1}.scrollbar-dynamic>.scroll-element.scroll-draggable .scroll-element_outer .scroll-bar,.scrollbar-dynamic>.scroll-element:hover .scroll-element_outer .scroll-bar{height:100%;width:100%;border-radius:12px}.scrollbar-dynamic>.scroll-element.scroll-x.scroll-draggable .scroll-element_outer,.scrollbar-dynamic>.scroll-element.scroll-x:hover .scroll-element_outer{height:20px;min-height:7px}.scrollbar-dynamic>.scroll-element.scroll-y.scroll-draggable .scroll-element_outer,.scrollbar-dynamic>.scroll-element.scroll-y:hover .scroll-element_outer{min-width:7px;width:20px}.scrollbar-chrome>.scroll-element,.scrollbar-chrome>.scroll-element div{border:none;margin:0;overflow:hidden;padding:0;position:absolute;z-index:10}.scrollbar-chrome>.scroll-element{background-color:#fff}.scrollbar-chrome>.scroll-element div{display:block;height:100%;left:0;top:0;width:100%}.scrollbar-chrome>.scroll-element .scroll-element_track{background:#f1f1f1;border:1px solid #dbdbdb}.scrollbar-chrome>.scroll-element.scroll-x{bottom:0;height:16px;left:0;min-width:100%;width:100%}.scrollbar-chrome>.scroll-element.scroll-y{height:100%;min-height:100%;right:0;top:0;width:16px}.scrollbar-chrome>.scroll-element .scroll-bar{background-color:#d9d9d9;border:1px solid #bdbdbd;cursor:default;border-radius:2px}.scrollbar-chrome>.scroll-element .scroll-bar:hover{background-color:#c2c2c2;border-color:#a9a9a9}.scrollbar-chrome>.scroll-element.scroll-draggable .scroll-bar{background-color:#919191;border-color:#7e7e7e}.scrollbar-chrome>.scroll-content.scroll-scrolly_visible{left:-16px;margin-left:16px}.scrollbar-chrome>.scroll-content.scroll-scrollx_visible{top:-16px;margin-top:16px}.scrollbar-chrome>.scroll-element.scroll-x .scroll-bar{height:8px;min-width:10px;top:3px}.scrollbar-chrome>.scroll-element.scroll-y .scroll-bar{left:3px;min-height:10px;width:8px}.scrollbar-chrome>.scroll-element.scroll-x .scroll-element_outer{border-left:1px solid #dbdbdb}.scrollbar-chrome>.scroll-element.scroll-x .scroll-element_track{height:14px;left:-3px}.scrollbar-chrome>.scroll-element.scroll-x .scroll-element_size{height:14px;left:-4px}.scrollbar-chrome>.scroll-element.scroll-y .scroll-element_outer{border-top:1px solid #dbdbdb}.scrollbar-chrome>.scroll-element.scroll-y .scroll-element_track{top:-3px;width:14px}.scrollbar-chrome>.scroll-element.scroll-y .scroll-element_size{top:-4px;width:14px}.scrollbar-chrome>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_size{left:-19px}.scrollbar-chrome>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_size{top:-19px}.scrollbar-chrome>.scroll-element.scroll-x.scroll-scrolly_visible .scroll-element_track{left:-19px}.scrollbar-chrome>.scroll-element.scroll-y.scroll-scrollx_visible .scroll-element_track{top:-19px}\n" +
"/**\n" +
" * Minified style.\n" +
" * Original filename: \\src\\styles\\style.css\n" +
" */\n" +
"@-webkit-keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes spin{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;margin-left:7px}#emote-menu-button.active{border-radius:2px;background-color:rgba(128,128,128,.5)}.emote-menu{padding:5px;z-index:1000;display:none;background-color:#202020;position:relative}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-starred{height:38px}.emote-menu .draggable{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px)}.emote-menu .header-info{border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;background-image:-webkit-linear-gradient(bottom,transparent,rgba(0,0,0,.5));background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center;position:relative}.emote-menu .header-info img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:30px;height:30px;-webkit-transition:all .25s ease;transition:all .25s ease;border:1px solid transparent}.emote-menu.editing .emote{cursor:auto}.emote-menu .emote img{max-width:100%;max-height:100%;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row .emote-container{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;padding:5px 0 2px;margin-top:5px;height:18px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5;background-size:contain!important}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-home{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNjQiDQogICBoZWlnaHQ9IjY0Ig0KICAgdmlld0JveD0iMCAwIDY0IDY0Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhMzAwMSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczI5OTkiIC8+DQo8cGF0aA0KICAgZD0ibSA1Ny4wNjIsMzEuMzk4IGMgMC45MzIsLTEuMDI1IDAuODQyLC0yLjU5NiAtMC4yMDEsLTMuNTA4IEwgMzMuODg0LDcuNzg1IEMgMzIuODQxLDYuODczIDMxLjE2OSw2Ljg5MiAzMC4xNDgsNy44MjggTCA3LjA5MywyOC45NjIgYyAtMS4wMjEsMC45MzYgLTEuMDcxLDIuNTA1IC0wLjExMSwzLjUwMyBsIDAuNTc4LDAuNjAyIGMgMC45NTksMC45OTggMi41MDksMS4xMTcgMy40NiwwLjI2NSBsIDEuNzIzLC0xLjU0MyB2IDIyLjU5IGMgMCwxLjM4NiAxLjEyMywyLjUwOCAyLjUwOCwyLjUwOCBoIDguOTg3IGMgMS4zODUsMCAyLjUwOCwtMS4xMjIgMi41MDgsLTIuNTA4IFYgMzguNTc1IGggMTEuNDYzIHYgMTUuODA0IGMgLTAuMDIsMS4zODUgMC45NzEsMi41MDcgMi4zNTYsMi41MDcgaCA5LjUyNCBjIDEuMzg1LDAgMi41MDgsLTEuMTIyIDIuNTA4LC0yLjUwOCBWIDMyLjEwNyBjIDAsMCAwLjQ3NiwwLjQxNyAxLjA2MywwLjkzMyAwLjU4NiwwLjUxNSAxLjgxNywwLjEwMiAyLjc0OSwtMC45MjQgbCAwLjY1MywtMC43MTggeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%}.emote-menu .icon-gear{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMjEuNTkiDQogICBoZWlnaHQ9IjIxLjEzNjk5OSINCiAgIHZpZXdCb3g9IjAgMCAyMS41OSAyMS4xMzciDQogICBpZD0iQ2FwYV8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGEzOSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczM3IiAvPg0KPHBhdGgNCiAgIGQ9Ik0gMTguNjIyLDguMTQ1IDE4LjA3Nyw2Ljg1IGMgMCwwIDEuMjY4LC0yLjg2MSAxLjE1NiwtMi45NzEgTCAxNy41NTQsMi4yNCBDIDE3LjQzOCwyLjEyNyAxNC41NzYsMy40MzMgMTQuNTc2LDMuNDMzIEwgMTMuMjU2LDIuOSBDIDEzLjI1NiwyLjkgMTIuMDksMCAxMS45MywwIEggOS41NjEgQyA5LjM5NiwwIDguMzE3LDIuOTA2IDguMzE3LDIuOTA2IEwgNi45OTksMy40NDEgYyAwLDAgLTIuOTIyLC0xLjI0MiAtMy4wMzQsLTEuMTMxIEwgMi4yODksMy45NTEgQyAyLjE3Myw0LjA2NCAzLjUwNyw2Ljg2NyAzLjUwNyw2Ljg2NyBMIDIuOTYyLDguMTYgQyAyLjk2Miw4LjE2IDAsOS4zMDEgMCw5LjQ1NSB2IDIuMzIyIGMgMCwwLjE2MiAyLjk2OSwxLjIxOSAyLjk2OSwxLjIxOSBsIDAuNTQ1LDEuMjkxIGMgMCwwIC0xLjI2OCwyLjg1OSAtMS4xNTcsMi45NjkgbCAxLjY3OCwxLjY0MyBjIDAuMTE0LDAuMTExIDIuOTc3LC0xLjE5NSAyLjk3NywtMS4xOTUgbCAxLjMyMSwwLjUzNSBjIDAsMCAxLjE2NiwyLjg5OCAxLjMyNywyLjg5OCBoIDIuMzY5IGMgMC4xNjQsMCAxLjI0NCwtMi45MDYgMS4yNDQsLTIuOTA2IGwgMS4zMjIsLTAuNTM1IGMgMCwwIDIuOTE2LDEuMjQyIDMuMDI5LDEuMTMzIGwgMS42NzgsLTEuNjQxIGMgMC4xMTcsLTAuMTE1IC0xLjIyLC0yLjkxNiAtMS4yMiwtMi45MTYgbCAwLjU0NCwtMS4yOTMgYyAwLDAgMi45NjMsLTEuMTQzIDIuOTYzLC0xLjI5OSBWIDkuMzYgQyAyMS41OSw5LjE5OSAxOC42MjIsOC4xNDUgMTguNjIyLDguMTQ1IHogbSAtNC4zNjYsMi40MjMgYyAwLDEuODY3IC0xLjU1MywzLjM4NyAtMy40NjEsMy4zODcgLTEuOTA2LDAgLTMuNDYxLC0xLjUyIC0zLjQ2MSwtMy4zODcgMCwtMS44NjcgMS41NTUsLTMuMzg1IDMuNDYxLC0zLjM4NSAxLjkwOSwwLjAwMSAzLjQ2MSwxLjUxOCAzLjQ2MSwzLjM4NSB6Ig0KICAgaWQ9InBhdGgzIg0KICAgc3R5bGU9ImZpbGw6I0ZGRkZGRiIgLz4NCjxnDQogICBpZD0iZzUiPg0KPC9nPg0KPGcNCiAgIGlkPSJnNyI+DQo8L2c+DQo8Zw0KICAgaWQ9Imc5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzExIj4NCjwvZz4NCjxnDQogICBpZD0iZzEzIj4NCjwvZz4NCjxnDQogICBpZD0iZzE1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzE5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzIxIj4NCjwvZz4NCjxnDQogICBpZD0iZzIzIj4NCjwvZz4NCjxnDQogICBpZD0iZzI1Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI3Ij4NCjwvZz4NCjxnDQogICBpZD0iZzI5Ij4NCjwvZz4NCjxnDQogICBpZD0iZzMxIj4NCjwvZz4NCjxnDQogICBpZD0iZzMzIj4NCjwvZz4NCjwvc3ZnPg0K) no-repeat 50%}.emote-menu.editing .icon-gear{-webkit-animation:spin 4s linear infinite;animation:spin 4s linear infinite}.emote-menu .icon-resize-handle{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgdmlld0JveD0iMCAwIDE2IDE2Ig0KICAgaWQ9IkNhcGFfMSINCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiPjxtZXRhZGF0YQ0KICAgaWQ9Im1ldGFkYXRhNDM1NyI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczQzNTUiIC8+DQo8cGF0aA0KICAgZD0iTSAxMy41LDggQyAxMy4yMjUsOCAxMyw4LjIyNCAxMyw4LjUgdiAzLjc5MyBMIDMuNzA3LDMgSCA3LjUgQyA3Ljc3NiwzIDgsMi43NzYgOCwyLjUgOCwyLjIyNCA3Ljc3NiwyIDcuNSwyIGggLTUgTCAyLjMwOSwyLjAzOSAyLjE1LDIuMTQ0IDIuMTQ2LDIuMTQ2IDIuMTQzLDIuMTUyIDIuMDM5LDIuMzA5IDIsMi41IHYgNSBDIDIsNy43NzYgMi4yMjQsOCAyLjUsOCAyLjc3Niw4IDMsNy43NzYgMyw3LjUgViAzLjcwNyBMIDEyLjI5MywxMyBIIDguNSBDIDguMjI0LDEzIDgsMTMuMjI1IDgsMTMuNSA4LDEzLjc3NSA4LjIyNCwxNCA4LjUsMTQgaCA1IGwgMC4xOTEsLTAuMDM5IGMgMC4xMjEsLTAuMDUxIDAuMjIsLTAuMTQ4IDAuMjcsLTAuMjcgTCAxNCwxMy41MDIgViA4LjUgQyAxNCw4LjIyNCAxMy43NzUsOCAxMy41LDggeiINCiAgIGlkPSJwYXRoNDM1MSINCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4=) no-repeat 50%;cursor:nwse-resize!important}.emote-menu .icon-pin{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTYiDQogICBoZWlnaHQ9IjE2Ig0KICAgaWQ9InN2ZzMwMDUiPg0KICA8bWV0YWRhdGENCiAgICAgaWQ9Im1ldGFkYXRhMzAyMyI+DQogICAgPHJkZjpSREY+DQogICAgICA8Y2M6V29yaw0KICAgICAgICAgcmRmOmFib3V0PSIiPg0KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4NCiAgICAgICAgPGRjOnR5cGUNCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4NCiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+DQogICAgICA8L2NjOldvcms+DQogICAgPC9yZGY6UkRGPg0KICA8L21ldGFkYXRhPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczMwMjEiIC8+DQogIDxnDQogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzkzMDc4MiwwLDAsMC43OTMwNzgyLC0yLjE3MDk4NSwtODE0LjY5Mjk5KSINCiAgICAgaWQ9ImczMDA3Ij4NCiAgICA8Zw0KICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3MTEsMC43MDcxMSwtMC43MDcxMSwwLjcwNzExLDczNy43MDc1NSwyOTUuNDg4MDgpIg0KICAgICAgIGlkPSJnMzAwOSI+DQogICAgICA8Zw0KICAgICAgICAgaWQ9ImczNzU1Ij4NCiAgICAgICAgPHBhdGgNCiAgICAgICAgICAgZD0iTSA5Ljc4MTI1LDAgQyA5LjQ3NDA1NjIsMC42ODkxMTIgOS41MjA2OCwxLjUyMzA4NTMgOS4zMTI1LDIuMTg3NSBMIDQuOTM3NSw2LjU5Mzc1IEMgMy45NTg5NjA4LDYuNDI5NDgzIDIuOTQ3NzU0OCw2LjUzMjc4OTkgMiw2LjgxMjUgTCA1LjAzMTI1LDkuODQzNzUgMC41NjI1LDE0LjMxMjUgMCwxNiBDIDAuNTY5Mjk2MjgsMTUuNzk1NjI2IDEuMTY3NzM3OCwxNS42NDAyMzcgMS43MTg3NSwxNS40MDYyNSBMIDYuMTU2MjUsMTAuOTY4NzUgOS4xODc1LDE0IGMgMC4yNzk2ODIzLC0wLjk0Nzc4MyAwLjM4MzE1MjgsLTEuOTU4OTM3IDAuMjE4NzUsLTIuOTM3NSAxLjUwMDAxMSwtMS40ODk1Nzk4IDMuMDAwMDAxLC0yLjk3OTE1OSA0LjUsLTQuNDY4NzUgMC42MDExMDIsLTAuMDMxMzYxIDEuODIyMTM4LC0wLjA5NjEzNyAyLC0wLjQ2ODc1IEMgMTMuODc5ODkyLDQuMDY5NDgwMyAxMS44NDI4NjUsMi4wMjAyMjgyIDkuNzgxMjUsMCB6Ig0KICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg5MTU5Mzc0LC0wLjg5MTU5Mzc0LDAuODkxNTkzNzQsMC44OTE1OTM3NCwtMi4yNjU1LDEwMzcuMTM0NSkiDQogICAgICAgICAgIGlkPSJwYXRoMzAxMSINCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4NCiAgICAgIDwvZz4NCiAgICA8L2c+DQogIDwvZz4NCjwvc3ZnPg0K) no-repeat 50%;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu .icon-pin:hover,.emote-menu.pinned .icon-pin{-webkit-transform:rotate(-45deg);-ms-transform:rotate(-45deg);transform:rotate(-45deg);opacity:1}.emote-menu .edit-tool{background-position:50%;background-repeat:no-repeat;background-size:14px;border-radius:4px;border:1px solid #000;cursor:pointer;display:none;height:14px;opacity:.25;position:absolute;-webkit-transition:all .25s ease;transition:all .25s ease;width:14px;z-index:1}.emote-menu .edit-tool:hover,.emote-menu .emote:hover .edit-tool{opacity:1}.emote-menu .edit-visibility{background-color:#00c800;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8xIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGE5Ij48cmRmOlJERj48Y2M6V29yaw0KICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQ0KICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz48ZGM6dGl0bGU+PC9kYzp0aXRsZT48L2NjOldvcms+PC9yZGY6UkRGPjwvbWV0YWRhdGE+PGRlZnMNCiAgIGlkPSJkZWZzNyIgLz4NCjxwYXRoDQogICBkPSJNIDk3Ljk2NCw0Ni41NDggQyA5Ny4wOTgsNDUuNTI4IDc2LjQyNywyMS42MDMgNTAsMjEuNjAzIGMgLTI2LjQyNywwIC00Ny4wOTgsMjMuOTI1IC00Ny45NjUsMjQuOTQ2IC0xLjcwMSwyIC0xLjcwMSw0LjkwMiAxMGUtNCw2LjkwMyAwLjg2NiwxLjAyIDIxLjUzNywyNC45NDUgNDcuOTY0LDI0Ljk0NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMiAxLjcwMSwtNC45MDIgLTAuMDAxLC02LjkwMyB6IE0gNTguMDczLDM1Ljk3NSBjIDEuNzc3LC0wLjk3IDQuMjU1LDAuMTQzIDUuNTM0LDIuNDg1IDEuMjc5LDIuMzQzIDAuODc1LDUuMDI5IC0wLjkwMiw1Ljk5OSAtMS43NzcsMC45NzEgLTQuMjU1LC0wLjE0MyAtNS41MzUsLTIuNDg1IC0xLjI3OSwtMi4zNDMgLTAuODc1LC01LjAyOSAwLjkwMywtNS45OTkgeiBNIDUwLDY5LjcyOSBDIDMxLjU0LDY5LjcyOSAxNi4wMDUsNTUuNTUzIDEwLjYyOCw1MCAxNC4yNTksNDYuMjQ5IDIyLjUyNiwzOC41NzEgMzMuMTk1LDMzLjk3OSAzMS4xMTQsMzcuMTQ1IDI5Ljg5NCw0MC45MjggMjkuODk0LDQ1IGMgMCwxMS4xMDQgOS4wMDEsMjAuMTA1IDIwLjEwNSwyMC4xMDUgMTEuMTA0LDAgMjAuMTA2LC05LjAwMSAyMC4xMDYsLTIwLjEwNSAwLC00LjA3MiAtMS4yMTksLTcuODU1IC0zLjMsLTExLjAyMSBDIDc3LjQ3NCwzOC41NzIgODUuNzQxLDQ2LjI1IDg5LjM3Miw1MCA4My45OTUsNTUuNTU1IDY4LjQ2LDY5LjcyOSA1MCw2OS43MjkgeiINCiAgIGlkPSJwYXRoMyIgLz4NCjwvc3ZnPg==)}.emote-menu .edit-starred{background-color:#323232;background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNjY2NjY2M7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote>.edit-visibility{bottom:auto;left:auto;right:0;top:0}.emote-menu .emote>.edit-starred{bottom:auto;left:0;right:auto;top:0}.emote-menu .header-info>.edit-tool{margin-left:5px}.emote-menu.editing .edit-tool{display:inline-block}.emote-menu .emote-menu-hidden .edit-visibility{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iMTAwIg0KICAgaGVpZ2h0PSIxMDAiDQogICB2aWV3Qm94PSIwIDAgMTAwIDEwMCINCiAgIGlkPSJMYXllcl8zIg0KICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PG1ldGFkYXRhDQogICBpZD0ibWV0YWRhdGExNSI+PHJkZjpSREY+PGNjOldvcmsNCiAgICAgICByZGY6YWJvdXQ9IiI+PGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+PGRjOnR5cGUNCiAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PGRjOnRpdGxlPjwvZGM6dGl0bGU+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxkZWZzDQogICBpZD0iZGVmczEzIiAvPg0KPGcNCiAgIGlkPSJnMyI+DQoJPHBhdGgNCiAgIGQ9Ik0gNzAuMDgyLDQ1LjQ3NSA1MC40NzQsNjUuMDgyIEMgNjEuMTk4LDY0LjgzMSA2OS44MzEsNTYuMTk3IDcwLjA4Miw0NS40NzUgeiINCiAgIGlkPSJwYXRoNSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTcuOTY0LDQ2LjU0OCBjIC0wLjQ1LC0wLjUyOSAtNi4yNDUsLTcuMjMgLTE1LjQwMywtMTMuNTU0IGwgLTYuMiw2LjIgQyA4Mi4zNTEsNDMuMTQ4IDg2LjkyLDQ3LjQ2OSA4OS4zNzIsNTAgODMuOTk1LDU1LjU1NSA2OC40Niw2OS43MjkgNTAsNjkuNzI5IGMgLTEuMzM0LDAgLTIuNjUxLC0wLjA4MiAtMy45NTIsLTAuMjIyIGwgLTcuNDM5LDcuNDM5IGMgMy42MzksMC45MDkgNy40NDksMS40NSAxMS4zOTEsMS40NSAyNi40MjcsMCA0Ny4wOTgsLTIzLjkyNiA0Ny45NjUsLTI0Ljk0NiAxLjcwMSwtMS45OTkgMS43MDEsLTQuOTAxIC0wLjAwMSwtNi45MDIgeiINCiAgIGlkPSJwYXRoNyINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQoJPHBhdGgNCiAgIGQ9Im0gOTEuNDExLDE2LjY2IGMgMCwtMC4yNjYgLTAuMTA1LC0wLjUyIC0wLjI5MywtMC43MDcgbCAtNy4wNzEsLTcuMDcgYyAtMC4zOTEsLTAuMzkxIC0xLjAyMywtMC4zOTEgLTEuNDE0LDAgTCA2Ni44MDQsMjQuNzExIEMgNjEuNjAyLDIyLjgxOCA1NS45NDksMjEuNjAzIDUwLDIxLjYwMyBjIC0yNi40MjcsMCAtNDcuMDk4LDIzLjkyNiAtNDcuOTY1LDI0Ljk0NiAtMS43MDEsMiAtMS43MDEsNC45MDIgMTBlLTQsNi45MDMgMC41MTcsMC42MDcgOC4wODMsOS4zNTQgMTkuNzA3LDE2LjMyIEwgOC44ODMsODIuNjMyIEMgOC42OTUsODIuODIgOC41OSw4My4wNzMgOC41OSw4My4zMzkgYyAwLDAuMjY2IDAuMTA1LDAuNTIgMC4yOTMsMC43MDcgbCA3LjA3MSw3LjA3IGMgMC4xOTUsMC4xOTUgMC40NTEsMC4yOTMgMC43MDcsMC4yOTMgMC4yNTYsMCAwLjUxMiwtMC4wOTggMC43MDcsLTAuMjkzIGwgNzMuNzUsLTczLjc1IGMgMC4xODcsLTAuMTg2IDAuMjkzLC0wLjQ0IDAuMjkzLC0wLjcwNiB6IE0gMTAuNjI4LDUwIEMgMTQuMjU5LDQ2LjI0OSAyMi41MjYsMzguNTcxIDMzLjE5NSwzMy45NzkgMzEuMTE0LDM3LjE0NSAyOS44OTQsNDAuOTI4IDI5Ljg5NCw0NSBjIDAsNC42NjUgMS42MDEsOC45NDUgNC4yNywxMi4zNTEgTCAyOC4wNCw2My40NzUgQyAxOS44ODgsNTguOTU1IDEzLjY0OSw1My4xMiAxMC42MjgsNTAgeiINCiAgIGlkPSJwYXRoOSINCiAgIHN0eWxlPSJmaWxsOiNGRkZGRkYiIC8+DQo8L2c+DQo8L3N2Zz4NCg==);background-color:red}.emote-menu .emote-menu-starred .edit-starred{background-image:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIENyZWF0ZWQgd2l0aCBJbmtzY2FwZSAoaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvKSAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB2ZXJzaW9uPSIxLjEiDQogICB3aWR0aD0iNTAiDQogICBoZWlnaHQ9IjUwIg0KICAgdmlld0JveD0iMCAwIDUwIDUwIg0KICAgaWQ9IkxheWVyXzEiDQogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGENCiAgIGlkPSJtZXRhZGF0YTMwMDEiPjxyZGY6UkRGPjxjYzpXb3JrDQogICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlDQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcw0KICAgaWQ9ImRlZnMyOTk5IiAvPg0KPHBhdGgNCiAgIGQ9Im0gNDMuMDQsMjIuNjk2IC03LjU2OCw3LjM3NyAxLjc4NywxMC40MTcgYyAwLjEyNywwLjc1IC0wLjE4MiwxLjUwOSAtMC43OTcsMS45NTcgLTAuMzQ4LDAuMjUzIC0wLjc2MiwwLjM4MiAtMS4xNzYsMC4zODIgLTAuMzE4LDAgLTAuNjM4LC0wLjA3NiAtMC45MzEsLTAuMjMgTCAyNSwzNy42ODEgMTUuNjQ1LDQyLjU5OSBjIC0wLjY3NCwwLjM1NSAtMS40OSwwLjI5NSAtMi4xMDcsLTAuMTUxIEMgMTIuOTIzLDQyIDEyLjYxNCw0MS4yNDIgMTIuNzQzLDQwLjQ5MSBMIDE0LjUzLDMwLjA3NCA2Ljk2MiwyMi42OTcgQyA2LjQxNSwyMi4xNjYgNi4yMjEsMjEuMzcxIDYuNDU0LDIwLjY0NyA2LjY5LDE5LjkyMyA3LjMxNSwxOS4zOTYgOC4wNjksMTkuMjg2IGwgMTAuNDU5LC0xLjUyMSA0LjY4LC05LjQ3OCBDIDIzLjU0Myw3LjYwMyAyNC4yMzksNy4xNzEgMjUsNy4xNzEgYyAwLjc2MywwIDEuNDU2LDAuNDMyIDEuNzkzLDEuMTE1IGwgNC42NzksOS40NzggMTAuNDYxLDEuNTIxIGMgMC43NTIsMC4xMDkgMS4zNzksMC42MzcgMS42MTIsMS4zNjEgMC4yMzcsMC43MjQgMC4wMzgsMS41MTkgLTAuNTA1LDIuMDUgeiINCiAgIGlkPSJwYXRoMjk5NSINCiAgIHN0eWxlPSJmaWxsOiNmZmNjMDA7ZmlsbC1vcGFjaXR5OjEiIC8+DQo8L3N2Zz4NCg==)}.emote-menu .emote.emote-menu-starred{border-color:rgba(200,200,0,.5)}.emote-menu .emote.emote-menu-hidden{border-color:rgba(255,0,0,.5)}.emote-menu #starred-emotes-group .emote:not(.emote-menu-starred),.emote-menu:not(.editing) .emote-menu-hidden{display:none}.emote-menu:not(.editing) #starred-emotes-group .emote-menu-starred{border-color:transparent}.emote-menu #starred-emotes-group{text-align:center;color:#646464}.emote-menu #starred-emotes-group:empty:before{content:\"Use the edit mode to star an emote!\";position:relative;top:8px}.emote-menu .scrollable{height:calc(100% - 101px);overflow-y:auto}.emote-menu .sticky{position:absolute;bottom:0;width:100%}.emote-menu .emote-menu-inner{position:relative;max-height:100%;height:100%}"));

},{}],3:[function(require,module,exports){
module.exports = (function() {
    var Hogan = require('hogan.js/lib/template.js');
    var templates = {};
    templates['emote'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote");if(t.s(t.f("thirdParty",c,p,1),c,p,0,32,44,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" third-party");});c.pop();}if(!t.s(t.f("isVisible",c,p,1),c,p,1,0,0,"")){t.b(" emote-menu-hidden");};if(t.s(t.f("isStarred",c,p,1),c,p,0,119,138,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" emote-menu-starred");});c.pop();}t.b("\" data-emote=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" title=\"");t.b(t.v(t.f("text",c,p,0)));if(t.s(t.f("thirdParty",c,p,1),c,p,0,206,229,"{{ }}")){t.rs(c,p,function(c,p,t){t.b(" (from 3rd party addon)");});c.pop();}t.b("\">\r");t.b("\n" + i);t.b("	<img src=\"");t.b(t.t(t.f("url",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-starred\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-starred\" title=\"Star/unstar emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("	<div class=\"edit-tool edit-visibility\" data-which=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show emote: ");t.b(t.v(t.f("text",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button glyph-only float-left\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteGroupHeader'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"group-header\" data-emote-channel=\"");t.b(t.v(t.f("channel",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div class=\"header-info\">\r");t.b("\n" + i);t.b("		<img src=\"");t.b(t.v(t.f("badge",c,p,0)));t.b("\" />\r");t.b("\n" + i);t.b("		");t.b(t.v(t.f("channelDisplayName",c,p,0)));t.b("\r");t.b("\n" + i);t.b("		<div class=\"edit-tool edit-visibility\" data-which=\"channel-");t.b(t.v(t.f("channel",c,p,0)));t.b("\" data-command=\"toggle-visibility\" title=\"Hide/show all emotes for ");t.b(t.v(t.f("channel",c,p,0)));t.b("\"></div>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("	<div class=\"emote-container\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
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
	"version": "1.1.1",
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
		"include": "http://*.twitch.tv/*",
		"exclude": [
			"http://api.twitch.tv/*",
			"http://tmi.twitch.tv/*",
			"http://chatdepot.twitch.tv/*"
		]
	},
	"scripts": {
		"install": "napa"
	},
	"devDependencies": {
		"browser-sync": "^1.3.2",
		"browserify": "^5.9.1",
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
		"pretty-hrtime": "^0.2.1",
		"vinyl-map": "^1.0.1",
		"vinyl-source-stream": "^0.1.1",
		"watchify": "^1.0.1",
		"storage-wrapper": "cletusc/storage-wrapper#v0.1.1",
		"jquery.scrollbar": "gromo/jquery.scrollbar#0.2.7"
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
var api = {};
var emoteStore = new EmoteStore();
var $ = window.jQuery;

/**
 * The entire emote storing system.
 */
function EmoteStore() {
	var getters = {};
	var nativeEmotes = {};

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
	};

	/**
	 * Registers a 3rd party emote hook.
	 * @param  {string} name   The name of the 3rd party hook to deregister.
	 */
	this.deregisterGetter = function (name) {
		logger.debug('Getter unregistered: ' + name);
		delete getters[name];
	};

	/**
	 * Initializes the raw data from the API endpoints. Should be called at load and/or whenever the API may have changed. Populates internal objects with updated data.
	 */
	this.init = function () {
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
					emote.url = 'http://static-cdn.jtvnw.net/emoticons/v1/' + emote.id + '/1.0';
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
			});
		}, true);
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
		var defaultBadge = 'http://static-cdn.jtvnw.net/jtv_user_pictures/subscriber-star.png';

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

		// Get from API.
		twitchApi.getBadges(channelName, function (badges) {
			var badge = null;
			logger.debug('Getting fresh badge for user', channelName, badges);

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
			}
			// No subscriber badge.
			else {
				logger.debug('Failed to get subscriber badge.', channelName);
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
	var emotes = [':(', ':)', ':/', ':\\', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o', '#/', ':7', ':>', ':S', '<]'];
	return emotes.indexOf(this.getText()) !== -1;
};

/**
 * Property getters/setters.
 */

/**
 * Get a channel's display name.
 * @return {string} The channel's display name. May be equivalent to the channel the first time the API needs to be called.
 */
Emote.prototype.getChannelDisplayName = function () {
	var twitchApi = require('./twitch-api');
	var channelName = this.getChannelName();
	var displayName = null;

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

	// Check storage.
	displayName = storage.displayNames.get(channelName);
	if (displayName !== null) {
		return displayName;
	}
	// Get from API.
	else {
		twitchApi.getUser(channelName, function (user) {
			logger.debug('Getting fresh display name for user', user);
			displayName = user.display_name;
			// Save in storage.
			storage.displayNames.set(channelName, displayName, 86400000);
		});
	}
	
	return displayName || channelName;
};

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
		//   ([^|])*            // any amount of characters that are not |
		//   \|?                // an optional | character
		//   [^\]]*             // any amount of characters that are not ]
		//   \]                 // ]
		// /g
		.replace(/\[([^|])*\|?[^\]]*\]/g, '$1')

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

},{"./logger":10,"./storage":12,"./twitch-api":14}],10:[function(require,module,exports){
var api = {};
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
	var ember = require('./ember-api');
	var session = ember.get('controller:chat', 'currentRoom.tmiRoom.session');
	var response = null;

	if (typeof callback !== 'function') {
		throw new Error('`callback` must be a function.');
	}

	// No parser or no emotes loaded yet, try again.
	if (!session) {
		setTimeout(api.onEmotesChange, 100, callback, immediate);
		return;
	}

	// Call the callback immediately on registering.
	if (immediate) {
		response = session.getEmotes();
		if (!response || !response.emoticon_sets) {
			setTimeout(api.onEmotesChange, 100, callback, immediate);
			return;
		}

		callback(response.emoticon_sets);
		logger.debug('Called emote change handler immediately.');
	}

	// Listen for the event.
	session._emotesParser.on('emotes_changed', function (response) {
		callback(response.emoticon_sets);
		logger.debug('Called emote change handler.')
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

function UIMenuButton() {
	this.dom = null;
}

UIMenuButton.prototype.init = function () {
	var chatButton = $('.send-chat-button');
	
	this.dom = $('#emote-menu-button');

	// Element already exists.
	if (this.dom.length) {
		logger.debug('MenuButton already exists, stopping init.');
		return this;
	}

	if (!chatButton.length) {
		setTimeout(this.init, 1000);
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
	this.emotes = {};
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
	var self = this;
	emotes.getEmotes().forEach(function (emoteInstance) {
		self.addEmote(emoteInstance);
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

	var self = this;

	this.dom = $(templates.emoteGroupHeader({
		badge: emoteInstance.getChannelBadge(),
		channel: emoteInstance.getChannelName(),
		channelDisplayName: emoteInstance.getChannelDisplayName()
	}));

	// Enable emote hiding.
	this.dom.find('[data-command="toggle-visibility"]').on('click', function () {
		if (!theMenu.isEditing()) {
			return;
		}
		self.toggleDisplay();
	});

	this.toggleDisplay(this.isVisible(), true);
}

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxVc2Vyc1xcQ2xldHVzXFxQcm9qZWN0c1xcVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIi4vc3JjL3NjcmlwdC5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvYnVpbGQvc3R5bGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9idWlsZC90ZW1wbGF0ZXMuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9ob2dhbi5qcy9saWIvdGVtcGxhdGUuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL25vZGVfbW9kdWxlcy9qcXVlcnkuc2Nyb2xsYmFyL2pxdWVyeS5zY3JvbGxiYXIubWluLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9ub2RlX21vZHVsZXMvc3RvcmFnZS13cmFwcGVyL2luZGV4LmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9wYWNrYWdlLmpzb24iLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL2VtYmVyLWFwaS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvZW1vdGVzLmpzIiwiYzovVXNlcnMvQ2xldHVzL1Byb2plY3RzL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9zcmMvbW9kdWxlcy9sb2dnZXIuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL3B1YmxpYy1hcGkuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL3N0b3JhZ2UuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9tb2R1bGVzL3RlbXBsYXRlcy5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvdHdpdGNoLWFwaS5qcyIsImM6L1VzZXJzL0NsZXR1cy9Qcm9qZWN0cy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvc3JjL21vZHVsZXMvdWkuanMiLCJjOi9Vc2Vycy9DbGV0dXMvUHJvamVjdHMvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzL3NyYy9wbHVnaW5zL3Jlc2l6YWJsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2YkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25uQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwa2cgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKTtcclxudmFyIHB1YmxpY0FwaSA9IHJlcXVpcmUoJy4vbW9kdWxlcy9wdWJsaWMtYXBpJyk7XHJcbnZhciBlbWJlciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9lbWJlci1hcGknKTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbW9kdWxlcy9sb2dnZXInKTtcclxudmFyIGVtb3RlcyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9lbW90ZXMnKTtcclxudmFyIHVpID0gcmVxdWlyZSgnLi9tb2R1bGVzL3VpJyk7XHJcblxyXG5sb2dnZXIubG9nKCdJbml0aWFsIGxvYWQgb24gJyArIGxvY2F0aW9uLmhyZWYpO1xyXG5cclxuLy8gT25seSBlbmFibGUgc2NyaXB0IGlmIHdlIGhhdmUgdGhlIHJpZ2h0IHZhcmlhYmxlcy5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxudmFyIGluaXRUaW1lciA9IDA7XHJcbihmdW5jdGlvbiBpbml0KHRpbWUpIHtcclxuXHQvLyBEb24ndCBydW4gaW4gYW4gaWZyYW1lLlxyXG5cdGlmICh3aW5kb3cuZnJhbWVFbGVtZW50KSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdFxyXG5cdGlmICghdGltZSkge1xyXG5cdFx0dGltZSA9IDA7XHJcblx0fVxyXG5cclxuXHR2YXIgb2JqZWN0c0xvYWRlZCA9IChcclxuXHRcdHdpbmRvdy5Ud2l0Y2ggIT09IHVuZGVmaW5lZCAmJlxyXG5cdFx0d2luZG93LmpRdWVyeSAhPT0gdW5kZWZpbmVkICYmXHJcblx0XHRlbWJlci5pc0xvYWRlZCgpXHJcblx0KTtcclxuXHRpZiAoIW9iamVjdHNMb2FkZWQpIHtcclxuXHRcdC8vIFN0b3BzIHRyeWluZyBhZnRlciAxMCBtaW51dGVzLlxyXG5cdFx0aWYgKGluaXRUaW1lciA+PSA2MDAwMDApIHtcclxuXHRcdFx0bG9nZ2VyLmxvZygnVGFraW5nIHRvbyBsb25nIHRvIGxvYWQsIHN0b3BwaW5nLiBSZWZyZXNoIHRoZSBwYWdlIHRvIHRyeSBhZ2Fpbi4gKCcgKyBpbml0VGltZXIgKyAnbXMpJyk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHaXZlIGFuIHVwZGF0ZSBldmVyeSAxMCBzZWNvbmRzLlxyXG5cdFx0aWYgKGluaXRUaW1lciAlIDEwMDAwKSB7XHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnU3RpbGwgd2FpdGluZyBmb3Igb2JqZWN0cyB0byBsb2FkLiAoJyArIGluaXRUaW1lciArICdtcyknKTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBCdW1wIHRpbWUgdXAgYWZ0ZXIgMXMgdG8gcmVkdWNlIHBvc3NpYmxlIGxhZy5cclxuXHRcdHRpbWUgPSB0aW1lID49IDEwMDAgPyAxMDAwIDogdGltZSArIDI1O1xyXG5cdFx0aW5pdFRpbWVyICs9IHRpbWU7XHJcblxyXG5cdFx0c2V0VGltZW91dChpbml0LCB0aW1lLCB0aW1lKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0XHJcblx0Ly8gRXhwb3NlIHB1YmxpYyBhcGkuXHJcblx0aWYgKHR5cGVvZiB3aW5kb3cuZW1vdGVNZW51ID09PSAndW5kZWZpbmVkJykge1xyXG5cdFx0d2luZG93LmVtb3RlTWVudSA9IHB1YmxpY0FwaTtcclxuXHR9XHJcblxyXG5cdGVtYmVyLmhvb2soJ3JvdXRlOmNoYW5uZWwnLCBhY3RpdmF0ZSwgZGVhY3RpdmF0ZSk7XHJcblx0ZW1iZXIuaG9vaygncm91dGU6Y2hhdCcsIGFjdGl2YXRlLCBkZWFjdGl2YXRlKTtcclxuXHJcblx0YWN0aXZhdGUoKTtcclxufSkoKTtcclxuXHJcbmZ1bmN0aW9uIGFjdGl2YXRlKCkge1xyXG5cdGVtb3Rlcy5pbml0KCk7XHJcblx0dWkuaW5pdCgpO1xyXG59XHJcbmZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XHJcblx0dWkuaGlkZU1lbnUoKTtcclxufVxyXG4iLCIoZnVuY3Rpb24gKGRvYywgY3NzVGV4dCkge1xuICAgIHZhciBpZCA9IFwiZW1vdGUtbWVudS1mb3ItdHdpdGNoLXN0eWxlc1wiO1xuICAgIHZhciBzdHlsZUVsID0gZG9jLmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICBpZiAoIXN0eWxlRWwpIHtcbiAgICAgICAgc3R5bGVFbCA9IGRvYy5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICAgIHN0eWxlRWwuaWQgPSBpZDtcbiAgICAgICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXS5hcHBlbmRDaGlsZChzdHlsZUVsKTtcbiAgICB9XG4gICAgaWYgKHN0eWxlRWwuc3R5bGVTaGVldCkge1xuICAgICAgICBpZiAoIXN0eWxlRWwuc3R5bGVTaGVldC5kaXNhYmxlZCkge1xuICAgICAgICAgICAgc3R5bGVFbC5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3NUZXh0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0eWxlRWwuaW5uZXJIVE1MID0gY3NzVGV4dDtcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlKSB7XG4gICAgICAgICAgICBzdHlsZUVsLmlubmVyVGV4dCA9IGNzc1RleHQ7XG4gICAgICAgIH1cbiAgICB9XG59KGRvY3VtZW50LCBcIi8qKlxcblwiICtcblwiICogTWluaWZpZWQgc3R5bGUuXFxuXCIgK1xuXCIgKiBPcmlnaW5hbCBmaWxlbmFtZTogXFxcXG5vZGVfbW9kdWxlc1xcXFxqcXVlcnkuc2Nyb2xsYmFyXFxcXGpxdWVyeS5zY3JvbGxiYXIuY3NzXFxuXCIgK1xuXCIgKi9cXG5cIiArXG5cIi5zY3JvbGwtd3JhcHBlcntvdmVyZmxvdzpoaWRkZW4haW1wb3J0YW50O3BhZGRpbmc6MCFpbXBvcnRhbnQ7cG9zaXRpb246cmVsYXRpdmV9LnNjcm9sbC13cmFwcGVyPi5zY3JvbGwtY29udGVudHtib3JkZXI6bm9uZSFpbXBvcnRhbnQ7LW1vei1ib3gtc2l6aW5nOmNvbnRlbnQtYm94IWltcG9ydGFudDtib3gtc2l6aW5nOmNvbnRlbnQtYm94IWltcG9ydGFudDtoZWlnaHQ6YXV0bztsZWZ0OjA7bWFyZ2luOjA7bWF4LWhlaWdodDpub25lIWltcG9ydGFudDttYXgtd2lkdGg6bm9uZSFpbXBvcnRhbnQ7b3ZlcmZsb3c6c2Nyb2xsIWltcG9ydGFudDtwYWRkaW5nOjA7cG9zaXRpb246cmVsYXRpdmUhaW1wb3J0YW50O3RvcDowO3dpZHRoOmF1dG8haW1wb3J0YW50fS5zY3JvbGwtd3JhcHBlcj4uc2Nyb2xsLWNvbnRlbnQ6Oi13ZWJraXQtc2Nyb2xsYmFye2hlaWdodDowO3dpZHRoOjB9LnNjcm9sbC1lbGVtZW50e2Rpc3BsYXk6bm9uZX0uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbC1lbGVtZW50IGRpdnstbW96LWJveC1zaXppbmc6Y29udGVudC1ib3g7Ym94LXNpemluZzpjb250ZW50LWJveH0uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSwuc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZXtkaXNwbGF5OmJsb2NrfS5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWFycm93LC5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntjdXJzb3I6ZGVmYXVsdH0uc2Nyb2xsLXRleHRhcmVhe2JvcmRlcjoxcHggc29saWQgI2NjYztib3JkZXItdG9wLWNvbG9yOiM5OTl9LnNjcm9sbC10ZXh0YXJlYT4uc2Nyb2xsLWNvbnRlbnR7b3ZlcmZsb3c6aGlkZGVuIWltcG9ydGFudH0uc2Nyb2xsLXRleHRhcmVhPi5zY3JvbGwtY29udGVudD50ZXh0YXJlYXtib3JkZXI6bm9uZSFpbXBvcnRhbnQ7LW1vei1ib3gtc2l6aW5nOmJvcmRlci1ib3g7Ym94LXNpemluZzpib3JkZXItYm94O2hlaWdodDoxMDAlIWltcG9ydGFudDttYXJnaW46MDttYXgtaGVpZ2h0Om5vbmUhaW1wb3J0YW50O21heC13aWR0aDpub25lIWltcG9ydGFudDtvdmVyZmxvdzpzY3JvbGwhaW1wb3J0YW50O291dGxpbmU6MDtwYWRkaW5nOjJweDtwb3NpdGlvbjpyZWxhdGl2ZSFpbXBvcnRhbnQ7dG9wOjA7d2lkdGg6MTAwJSFpbXBvcnRhbnR9LnNjcm9sbC10ZXh0YXJlYT4uc2Nyb2xsLWNvbnRlbnQ+dGV4dGFyZWE6Oi13ZWJraXQtc2Nyb2xsYmFye2hlaWdodDowO3dpZHRoOjB9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgZGl2e2JvcmRlcjpub25lO21hcmdpbjowO3BhZGRpbmc6MDtwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwfS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IGRpdntkaXNwbGF5OmJsb2NrO2hlaWdodDoxMDAlO2xlZnQ6MDt0b3A6MDt3aWR0aDoxMDAlfS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14e2JvdHRvbToycHg7aGVpZ2h0OjhweDtsZWZ0OjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteXtoZWlnaHQ6MTAwJTtyaWdodDoycHg7dG9wOjA7d2lkdGg6OHB4fS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlcntvdmVyZmxvdzpoaWRkZW59LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXIsLnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X291dGVyLC5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF90cmFja3tib3JkZXItcmFkaXVzOjhweH0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhciwuc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7LW1zLWZpbHRlcjpcXFwiYWxwaGEoT3BhY2l0eT00MClcXFwiO2ZpbHRlcjphbHBoYShvcGFjaXR5PTQwKTtvcGFjaXR5Oi40fS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF90cmFja3tiYWNrZ3JvdW5kLWNvbG9yOiNlMGUwZTB9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXJ7YmFja2dyb3VuZC1jb2xvcjojYzJjMmMyfS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1iYXIsLnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQ6aG92ZXIgLnNjcm9sbC1iYXJ7YmFja2dyb3VuZC1jb2xvcjojOTE5MTkxfS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx5X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3RyYWNre2xlZnQ6LTEycHh9LnNjcm9sbGJhci1pbm5lcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7dG9wOi0xMnB4fS5zY3JvbGxiYXItaW5uZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx5X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDotMTJweH0uc2Nyb2xsYmFyLWlubmVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple3RvcDotMTJweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCwuc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCBkaXZ7Ym9yZGVyOm5vbmU7bWFyZ2luOjA7cGFkZGluZzowO3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTB9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnR7YmFja2dyb3VuZC1jb2xvcjojZmZmfS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50IGRpdntkaXNwbGF5OmJsb2NrO2hlaWdodDoxMDAlO2xlZnQ6MDt0b3A6MDt3aWR0aDoxMDAlfS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14e2JvdHRvbTowO2hlaWdodDoxMnB4O2xlZnQ6MDt3aWR0aDoxMDAlfS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15e2hlaWdodDoxMDAlO3JpZ2h0OjA7dG9wOjA7d2lkdGg6MTJweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7aGVpZ2h0OjhweDt0b3A6MnB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9vdXRlcntsZWZ0OjJweDt3aWR0aDo4cHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X291dGVye292ZXJmbG93OmhpZGRlbn0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7YmFja2dyb3VuZC1jb2xvcjojZWVlfS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFyLC5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlciwuc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7Ym9yZGVyLXJhZGl1czo4cHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZDlkOWQ5fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFyOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2MyYzJjMn0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwtZHJhZ2dhYmxlIC5zY3JvbGwtYmFye2JhY2tncm91bmQtY29sb3I6IzkxOTE5MX0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtY29udGVudC5zY3JvbGwtc2Nyb2xseV92aXNpYmxle2xlZnQ6LTEycHg7bWFyZ2luLWxlZnQ6MTJweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtY29udGVudC5zY3JvbGwtc2Nyb2xseF92aXNpYmxle3RvcDotMTJweDttYXJnaW4tdG9wOjEycHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1iYXJ7bWluLXdpZHRoOjEwcHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1iYXJ7bWluLWhlaWdodDoxMHB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx5X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3RyYWNre2xlZnQ6LTE0cHh9LnNjcm9sbGJhci1vdXRlcj4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7dG9wOi0xNHB4fS5zY3JvbGxiYXItb3V0ZXI+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx5X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDotMTRweH0uc2Nyb2xsYmFyLW91dGVyPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple3RvcDotMTRweH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50IGRpdntiYWNrZ3JvdW5kOjAgMDtib3JkZXI6bm9uZTttYXJnaW46MDtwYWRkaW5nOjA7cG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQgZGl2e2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7bGVmdDowO3RvcDowO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF90cmFja3tkaXNwbGF5Om5vbmV9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtYmFye2JhY2tncm91bmQtY29sb3I6IzZDNkU3MTtkaXNwbGF5OmJsb2NrOy1tcy1maWx0ZXI6XFxcImFscGhhKE9wYWNpdHk9MClcXFwiO2ZpbHRlcjphbHBoYShvcGFjaXR5PTApO29wYWNpdHk6MDtib3JkZXItcmFkaXVzOjdweDstd2Via2l0LXRyYW5zaXRpb246b3BhY2l0eSAuMnMgbGluZWFyO3RyYW5zaXRpb246b3BhY2l0eSAuMnMgbGluZWFyfS5zY3JvbGxiYXItbWFjb3N4OmhvdmVyPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhciwuc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLWRyYWdnYWJsZSAuc2Nyb2xsLWJhcnstbXMtZmlsdGVyOlxcXCJhbHBoYShPcGFjaXR5PTcwKVxcXCI7ZmlsdGVyOmFscGhhKG9wYWNpdHk9NzApO29wYWNpdHk6Ljd9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14e2JvdHRvbTowO2hlaWdodDowO2xlZnQ6MDttaW4td2lkdGg6MTAwJTtvdmVyZmxvdzp2aXNpYmxlO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15e2hlaWdodDoxMDAlO21pbi1oZWlnaHQ6MTAwJTtyaWdodDowO3RvcDowO3dpZHRoOjB9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtYmFye2hlaWdodDo3cHg7bWluLXdpZHRoOjEwcHg7dG9wOi05cHh9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtYmFye2xlZnQ6LTlweDttaW4taGVpZ2h0OjEwcHg7d2lkdGg6N3B4fS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7bGVmdDoycHh9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTRweH0uc2Nyb2xsYmFyLW1hY29zeD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X291dGVye3RvcDoycHh9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9zaXple3RvcDotNHB4fS5zY3JvbGxiYXItbWFjb3N4Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTExcHh9LnNjcm9sbGJhci1tYWNvc3g+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi0xMXB4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50LC5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50IGRpdntib3JkZXI6bm9uZTttYXJnaW46MDtvdmVyZmxvdzpoaWRkZW47cGFkZGluZzowO3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTB9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnR7YmFja2dyb3VuZC1jb2xvcjojZmZmfS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50IGRpdntkaXNwbGF5OmJsb2NrO2hlaWdodDoxMDAlO2xlZnQ6MDt0b3A6MDt3aWR0aDoxMDAlfS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlcntib3JkZXItcmFkaXVzOjEwcHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X3NpemV7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUEvUGdvOGMzWm5JSGh0Ykc1elBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHlNREF3TDNOMlp5SWdkMmxrZEdnOUlqRXdNQ1VpSUdobGFXZG9kRDBpTVRBd0pTSWdkbWxsZDBKdmVEMGlNQ0F3SURFZ01TSWdjSEpsYzJWeWRtVkJjM0JsWTNSU1lYUnBiejBpYm05dVpTSStDaUFnUEd4cGJtVmhja2R5WVdScFpXNTBJR2xrUFNKbmNtRmtMWFZqWjJjdFoyVnVaWEpoZEdWa0lpQm5jbUZrYVdWdWRGVnVhWFJ6UFNKMWMyVnlVM0JoWTJWUGJsVnpaU0lnZURFOUlqQWxJaUI1TVQwaU1DVWlJSGd5UFNJeE1EQWxJaUI1TWowaU1DVWlQZ29nSUNBZ1BITjBiM0FnYjJabWMyVjBQU0l3SlNJZ2MzUnZjQzFqYjJ4dmNqMGlJMlJpWkdKa1lpSWdjM1J2Y0MxdmNHRmphWFI1UFNJeElpOCtDaUFnSUNBOGMzUnZjQ0J2Wm1aelpYUTlJakV3TUNVaUlITjBiM0F0WTI5c2IzSTlJaU5sT0dVNFpUZ2lJSE4wYjNBdGIzQmhZMmwwZVQwaU1TSXZQZ29nSUR3dmJHbHVaV0Z5UjNKaFpHbGxiblErQ2lBZ1BISmxZM1FnZUQwaU1DSWdlVDBpTUNJZ2QybGtkR2c5SWpFaUlHaGxhV2RvZEQwaU1TSWdabWxzYkQwaWRYSnNLQ05uY21Ga0xYVmpaMmN0WjJWdVpYSmhkR1ZrS1NJZ0x6NEtQQzl6ZG1jKyk7YmFja2dyb3VuZDotd2Via2l0LWdyYWRpZW50KGxpbmVhcixsZWZ0IHRvcCxyaWdodCB0b3AsY29sb3Itc3RvcCgwJSwjZGJkYmRiKSxjb2xvci1zdG9wKDEwMCUsI2U4ZThlOCkpO2JhY2tncm91bmQ6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQobGVmdCwjZGJkYmRiIDAsI2U4ZThlOCAxMDAlKTtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwjZGJkYmRiIDAsI2U4ZThlOCAxMDAlKTtib3JkZXItcmFkaXVzOjEwcHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXh7Ym90dG9tOjA7aGVpZ2h0OjE3cHg7bGVmdDowO21pbi13aWR0aDoxMDAlO3dpZHRoOjEwMCV9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXl7aGVpZ2h0OjEwMCU7bWluLWhlaWdodDoxMDAlO3JpZ2h0OjA7dG9wOjA7d2lkdGg6MTdweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQS9QZ284YzNabklIaHRiRzV6UFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnlJZ2QybGtkR2c5SWpFd01DVWlJR2hsYVdkb2REMGlNVEF3SlNJZ2RtbGxkMEp2ZUQwaU1DQXdJREVnTVNJZ2NISmxjMlZ5ZG1WQmMzQmxZM1JTWVhScGJ6MGlibTl1WlNJK0NpQWdQR3hwYm1WaGNrZHlZV1JwWlc1MElHbGtQU0puY21Ga0xYVmpaMmN0WjJWdVpYSmhkR1ZrSWlCbmNtRmthV1Z1ZEZWdWFYUnpQU0oxYzJWeVUzQmhZMlZQYmxWelpTSWdlREU5SWpBbElpQjVNVDBpTUNVaUlIZ3lQU0l4TURBbElpQjVNajBpTUNVaVBnb2dJQ0FnUEhOMGIzQWdiMlptYzJWMFBTSXdKU0lnYzNSdmNDMWpiMnh2Y2owaUkyWmxabVZtWlNJZ2MzUnZjQzF2Y0dGamFYUjVQU0l4SWk4K0NpQWdJQ0E4YzNSdmNDQnZabVp6WlhROUlqRXdNQ1VpSUhOMGIzQXRZMjlzYjNJOUlpTm1OV1kxWmpVaUlITjBiM0F0YjNCaFkybDBlVDBpTVNJdlBnb2dJRHd2YkdsdVpXRnlSM0poWkdsbGJuUStDaUFnUEhKbFkzUWdlRDBpTUNJZ2VUMGlNQ0lnZDJsa2RHZzlJakVpSUdobGFXZG9kRDBpTVNJZ1ptbHNiRDBpZFhKc0tDTm5jbUZrTFhWaloyY3RaMlZ1WlhKaGRHVmtLU0lnTHo0S1BDOXpkbWMrKTtiYWNrZ3JvdW5kOi13ZWJraXQtZ3JhZGllbnQobGluZWFyLGxlZnQgdG9wLHJpZ2h0IHRvcCxjb2xvci1zdG9wKDAlLCNmZWZlZmUpLGNvbG9yLXN0b3AoMTAwJSwjZjVmNWY1KSk7YmFja2dyb3VuZDotd2Via2l0LWxpbmVhci1ncmFkaWVudChsZWZ0LCNmZWZlZmUgMCwjZjVmNWY1IDEwMCUpO2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCNmZWZlZmUgMCwjZjVmNWY1IDEwMCUpO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjEwcHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZXtsZWZ0Oi0xN3B4O21hcmdpbi1sZWZ0OjE3cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZXt0b3A6LTE3cHg7bWFyZ2luLXRvcDoxN3B4fS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtYmFye2hlaWdodDoxMHB4O21pbi13aWR0aDoxMHB4O3RvcDowfS5zY3JvbGxiYXItbGlnaHQ+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtYmFye2xlZnQ6MDttaW4taGVpZ2h0OjEwcHg7d2lkdGg6MTBweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7aGVpZ2h0OjEycHg7bGVmdDoycHg7dG9wOjJweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi00cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X291dGVye2xlZnQ6MnB4O3RvcDoycHg7d2lkdGg6MTJweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTRweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTE5cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTE5cHh9LnNjcm9sbGJhci1saWdodD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7bGVmdDotMTlweH0uc2Nyb2xsYmFyLWxpZ2h0Pi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3t0b3A6LTE5cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudCwuc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50IGRpdntib3JkZXI6bm9uZTttYXJnaW46MDtvdmVyZmxvdzpoaWRkZW47cGFkZGluZzowO3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTB9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudCBkaXZ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9zaXple2JhY2tncm91bmQtY29sb3I6Izk5OTtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsLjMpfS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X291dGVyOmhvdmVyIC5zY3JvbGwtZWxlbWVudF9zaXple2JhY2tncm91bmQtY29sb3I6IzY2NjtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsLjUpfS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXh7Ym90dG9tOjA7aGVpZ2h0OjEycHg7bGVmdDowO21pbi13aWR0aDoxMDAlO3BhZGRpbmc6M3B4IDAgMnB4O3dpZHRoOjEwMCV9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteXtoZWlnaHQ6MTAwJTttaW4taGVpZ2h0OjEwMCU7cGFkZGluZzowIDJweCAwIDNweDtyaWdodDowO3RvcDowO3dpZHRoOjEycHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNkMGI5YTA7Ym9yZGVyLXJhZGl1czoycHg7Ym94LXNoYWRvdzoxcHggMXB4IDNweCByZ2JhKDAsMCwwLC41KX0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50IC5zY3JvbGwtZWxlbWVudF9vdXRlcjpob3ZlciAuc2Nyb2xsLWJhcntib3gtc2hhZG93OjFweCAxcHggM3B4IHJnYmEoMCwwLDAsLjYpfS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZXtsZWZ0Oi0xN3B4O21hcmdpbi1sZWZ0OjE3cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtY29udGVudC5zY3JvbGwtc2Nyb2xseF92aXNpYmxle21hcmdpbi10b3A6MTdweDt0b3A6LTE3cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWJhcntoZWlnaHQ6MTBweDttaW4td2lkdGg6MTBweDt0b3A6MXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1iYXJ7bGVmdDoxcHg7bWluLWhlaWdodDoxMHB4O3dpZHRoOjEwcHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7aGVpZ2h0OjE1cHg7bGVmdDo1cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtoZWlnaHQ6MnB4O2xlZnQ6LTEwcHg7dG9wOjVweH0uc2Nyb2xsYmFyLXJhaWw+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9vdXRlcnt0b3A6NXB4O3dpZHRoOjE1cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0OjVweDt0b3A6LTEwcHg7d2lkdGg6MnB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXguc2Nyb2xsLXNjcm9sbHlfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtsZWZ0Oi0yNXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTI1cHh9LnNjcm9sbGJhci1yYWlsPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF90cmFja3tsZWZ0Oi0yNXB4fS5zY3JvbGxiYXItcmFpbD4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfdHJhY2t7dG9wOi0yNXB4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQsLnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudCBkaXZ7YmFja2dyb3VuZDowIDA7Ym9yZGVyOm5vbmU7bWFyZ2luOjA7cGFkZGluZzowO3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTB9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudCBkaXZ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14e2JvdHRvbToycHg7aGVpZ2h0OjdweDtsZWZ0OjA7bWluLXdpZHRoOjEwMCU7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15e2hlaWdodDoxMDAlO21pbi1oZWlnaHQ6MTAwJTtyaWdodDoycHg7dG9wOjA7d2lkdGg6N3B4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X291dGVye29wYWNpdHk6LjM7Ym9yZGVyLXJhZGl1czoxMnB4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X3NpemV7YmFja2dyb3VuZC1jb2xvcjojY2NjO29wYWNpdHk6MDtib3JkZXItcmFkaXVzOjEycHg7LXdlYmtpdC10cmFuc2l0aW9uOm9wYWNpdHkgLjJzO3RyYW5zaXRpb246b3BhY2l0eSAuMnN9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiM2YzZlNzE7Ym9yZGVyLXJhZGl1czo3cHh9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWJhcntib3R0b206MDtoZWlnaHQ6N3B4O21pbi13aWR0aDoyNHB4O3RvcDphdXRvfS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1iYXJ7bGVmdDphdXRvO21pbi1oZWlnaHQ6MjRweDtyaWdodDowO3dpZHRoOjdweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtZWxlbWVudF9vdXRlcntib3R0b206MDt0b3A6YXV0bztsZWZ0OjJweDstd2Via2l0LXRyYW5zaXRpb246aGVpZ2h0IC4yczt0cmFuc2l0aW9uOmhlaWdodCAuMnN9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7bGVmdDphdXRvO3JpZ2h0OjA7dG9wOjJweDstd2Via2l0LXRyYW5zaXRpb246d2lkdGggLjJzO3RyYW5zaXRpb246d2lkdGggLjJzfS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDotNHB4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X3NpemV7dG9wOi00cHh9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteC5zY3JvbGwtc2Nyb2xseV92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple2xlZnQ6LTExcHh9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteS5zY3JvbGwtc2Nyb2xseF92aXNpYmxlIC5zY3JvbGwtZWxlbWVudF9zaXple3RvcDotMTFweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1lbGVtZW50X291dGVyLC5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQ6aG92ZXIgLnNjcm9sbC1lbGVtZW50X291dGVye292ZXJmbG93OmhpZGRlbjstbXMtZmlsdGVyOlxcXCJhbHBoYShPcGFjaXR5PTcwKVxcXCI7ZmlsdGVyOmFscGhhKG9wYWNpdHk9NzApO29wYWNpdHk6Ljd9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwtZHJhZ2dhYmxlIC5zY3JvbGwtZWxlbWVudF9vdXRlciAuc2Nyb2xsLWVsZW1lbnRfc2l6ZSwuc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50OmhvdmVyIC5zY3JvbGwtZWxlbWVudF9vdXRlciAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXtvcGFjaXR5OjF9LnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwtZHJhZ2dhYmxlIC5zY3JvbGwtZWxlbWVudF9vdXRlciAuc2Nyb2xsLWJhciwuc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50OmhvdmVyIC5zY3JvbGwtZWxlbWVudF9vdXRlciAuc2Nyb2xsLWJhcntoZWlnaHQ6MTAwJTt3aWR0aDoxMDAlO2JvcmRlci1yYWRpdXM6MTJweH0uc2Nyb2xsYmFyLWR5bmFtaWM+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1lbGVtZW50X291dGVyLC5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXg6aG92ZXIgLnNjcm9sbC1lbGVtZW50X291dGVye2hlaWdodDoyMHB4O21pbi1oZWlnaHQ6N3B4fS5zY3JvbGxiYXItZHluYW1pYz4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLWRyYWdnYWJsZSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXIsLnNjcm9sbGJhci1keW5hbWljPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteTpob3ZlciAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7bWluLXdpZHRoOjdweDt3aWR0aDoyMHB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudCwuc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQgZGl2e2JvcmRlcjpub25lO21hcmdpbjowO292ZXJmbG93OmhpZGRlbjtwYWRkaW5nOjA7cG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnR7YmFja2dyb3VuZC1jb2xvcjojZmZmfS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudCBkaXZ7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtsZWZ0OjA7dG9wOjA7d2lkdGg6MTAwJX0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQgLnNjcm9sbC1lbGVtZW50X3RyYWNre2JhY2tncm91bmQ6I2YxZjFmMTtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGJ9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14e2JvdHRvbTowO2hlaWdodDoxNnB4O2xlZnQ6MDttaW4td2lkdGg6MTAwJTt3aWR0aDoxMDAlfS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteXtoZWlnaHQ6MTAwJTttaW4taGVpZ2h0OjEwMCU7cmlnaHQ6MDt0b3A6MDt3aWR0aDoxNnB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNkOWQ5ZDk7Ym9yZGVyOjFweCBzb2xpZCAjYmRiZGJkO2N1cnNvcjpkZWZhdWx0O2JvcmRlci1yYWRpdXM6MnB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudCAuc2Nyb2xsLWJhcjpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNjMmMyYzI7Ym9yZGVyLWNvbG9yOiNhOWE5YTl9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC1kcmFnZ2FibGUgLnNjcm9sbC1iYXJ7YmFja2dyb3VuZC1jb2xvcjojOTE5MTkxO2JvcmRlci1jb2xvcjojN2U3ZTdlfS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtY29udGVudC5zY3JvbGwtc2Nyb2xseV92aXNpYmxle2xlZnQ6LTE2cHg7bWFyZ2luLWxlZnQ6MTZweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWNvbnRlbnQuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZXt0b3A6LTE2cHg7bWFyZ2luLXRvcDoxNnB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteCAuc2Nyb2xsLWJhcntoZWlnaHQ6OHB4O21pbi13aWR0aDoxMHB4O3RvcDozcHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtYmFye2xlZnQ6M3B4O21pbi1oZWlnaHQ6MTBweDt3aWR0aDo4cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14IC5zY3JvbGwtZWxlbWVudF9vdXRlcntib3JkZXItbGVmdDoxcHggc29saWQgI2RiZGJkYn0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X3RyYWNre2hlaWdodDoxNHB4O2xlZnQ6LTNweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXggLnNjcm9sbC1lbGVtZW50X3NpemV7aGVpZ2h0OjE0cHg7bGVmdDotNHB4fS5zY3JvbGxiYXItY2hyb21lPi5zY3JvbGwtZWxlbWVudC5zY3JvbGwteSAuc2Nyb2xsLWVsZW1lbnRfb3V0ZXJ7Ym9yZGVyLXRvcDoxcHggc29saWQgI2RiZGJkYn0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkgLnNjcm9sbC1lbGVtZW50X3RyYWNre3RvcDotM3B4O3dpZHRoOjE0cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15IC5zY3JvbGwtZWxlbWVudF9zaXple3RvcDotNHB4O3dpZHRoOjE0cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx5X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3NpemV7bGVmdDotMTlweH0uc2Nyb2xsYmFyLWNocm9tZT4uc2Nyb2xsLWVsZW1lbnQuc2Nyb2xsLXkuc2Nyb2xsLXNjcm9sbHhfdmlzaWJsZSAuc2Nyb2xsLWVsZW1lbnRfc2l6ZXt0b3A6LTE5cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC14LnNjcm9sbC1zY3JvbGx5X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3RyYWNre2xlZnQ6LTE5cHh9LnNjcm9sbGJhci1jaHJvbWU+LnNjcm9sbC1lbGVtZW50LnNjcm9sbC15LnNjcm9sbC1zY3JvbGx4X3Zpc2libGUgLnNjcm9sbC1lbGVtZW50X3RyYWNre3RvcDotMTlweH1cXG5cIiArXG5cIi8qKlxcblwiICtcblwiICogTWluaWZpZWQgc3R5bGUuXFxuXCIgK1xuXCIgKiBPcmlnaW5hbCBmaWxlbmFtZTogXFxcXHNyY1xcXFxzdHlsZXNcXFxcc3R5bGUuY3NzXFxuXCIgK1xuXCIgKi9cXG5cIiArXG5cIkAtd2Via2l0LWtleWZyYW1lcyBzcGluezEwMCV7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDM2MGRlZyk7dHJhbnNmb3JtOnJvdGF0ZSgzNjBkZWcpfX1Aa2V5ZnJhbWVzIHNwaW57MTAwJXstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKTt0cmFuc2Zvcm06cm90YXRlKDM2MGRlZyl9fSNlbW90ZS1tZW51LWJ1dHRvbntiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUJJQUFBQVFDQVlBQUFBYkJpOWNBQUFBQVhOU1IwSUFyczRjNlFBQUFBUm5RVTFCQUFDeGp3djhZUVVBQUFBSmNFaFpjd0FBRHNNQUFBN0RBY2R2cUdRQUFBS1VTVVJCVkRoUGZaVE5pMUpSR01adk1Jc1dVWnRzNVNJWEZZSzBDTUUvSUdnaHhWQzdXVW9VMU5CaXhJK21SU0Q0TVF6bXh6aUtPM1hVQmhSbVVHWktkQkc0MFhFR1U2ZDBHRkdaY1Q0cXhXMWhpN2Z6dk53WnFLd0RENXo3dnMvdnVlZWVlKzZWTUp4TzV3VWhoZHZ0ZnVIeitUNHRMUzJOaGVnZkdzTURMeGl3SElJaExpNTdQSjc1VkNyMVkzOS9uNGJESVkxR280bENEeDU0d1lDVll6am9WalFhL2R4dXR5ZkNrd1N2WUpwZ09TUWY3MDh0dUJhMXlXUnkvTCtWL0NsNHdZQkZoaFR4ZkxodW0vZXNpaUoxdTEyS1JDSmtzVmhvZlgyZFRrNU96a0hNVVVNUEhuakIyRjU1VnBFaFBkZS9MYng4RnFCRUlrSHBkSm9NQmdOcHRWclM2WFJVcVZUT2c3YTN0MmxtWm9iMGVqMnAxV3IyZ2dHTERPbkozUVNaSDRjb0hvL1R5c29LaHlnVUN0Sm9ORlFzRm1rd0dMQXdSN2hTcVNTVlNzVmVNR0NSSVQyOUY2ZlhKaThYeStVeW1jMW1tcDZlSm9mRFFmVjZuVTVQVDFtWTIrMTI3dUh4U3FVU2g0RkZoaFFMdnJ2dGNybStZcGtIQndkVXJWWnBhMnVMYXJVYWRUb2RPanc4WkdHT0ducnd3QXNHTERMdzFpNHVMcnpSWWVPT2o0OXBiMitQZG5kM3FkVnE4U3RHQUlRNWFvMUdnejN3Z2dHTERENEM0aXpjRWNXZlIwZEhiTXJsY3JTeHNjR2JqVkFJSzhsbXM3UzV1Y21CL1g2Zlh6OVlEc0VRRnpkanNWaXQyV3p5cWMxa01yd2ZWcXVWakVZanpjM05rY2xrSXB2TlJtdHJhK3lCVnpBZkJYdERqdUdnUzhGZ2NGYmM4UXZ1aGpOU0tCUW9GQXFSNkxGRW4vTDVQUGZnZ1hkNWVYa1dyQnpEUWRDMVFDQmdGb2V1dDdPencvdHlCcDJGUXpoUHd0T0ZGd3pZMzRZbzRBOXdSWHpkRDhMaGNFNDh3bmNFOW5vOUZ1YW9pZDU3NGJrUEx4Z1ovM3VJNXBUUVZmRmxQL0w3L1dtaGI3SlNYcS8zSVhyd3lIWjVTTkl2R0NucXloK0o3K2dBQUFBQVNVVk9SSzVDWUlJPSkhaW1wb3J0YW50O2JhY2tncm91bmQtcG9zaXRpb246NTAlO2JhY2tncm91bmQtcmVwZWF0Om5vLXJlcGVhdDtjdXJzb3I6cG9pbnRlcjttYXJnaW4tbGVmdDo3cHh9I2Vtb3RlLW1lbnUtYnV0dG9uLmFjdGl2ZXtib3JkZXItcmFkaXVzOjJweDtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTI4LDEyOCwxMjgsLjUpfS5lbW90ZS1tZW51e3BhZGRpbmc6NXB4O3otaW5kZXg6MTAwMDtkaXNwbGF5Om5vbmU7YmFja2dyb3VuZC1jb2xvcjojMjAyMDIwO3Bvc2l0aW9uOnJlbGF0aXZlfS5lbW90ZS1tZW51IGF7Y29sb3I6I2ZmZn0uZW1vdGUtbWVudSBhOmhvdmVye2N1cnNvcjpwb2ludGVyO3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmU7Y29sb3I6I2NjY30uZW1vdGUtbWVudSAuZW1vdGVzLXN0YXJyZWR7aGVpZ2h0OjM4cHh9LmVtb3RlLW1lbnUgLmRyYWdnYWJsZXtiYWNrZ3JvdW5kLWltYWdlOi13ZWJraXQtcmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZyx0cmFuc3BhcmVudCx0cmFuc3BhcmVudCA1cHgscmdiYSgyNTUsMjU1LDI1NSwuMDUpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgMTBweCk7YmFja2dyb3VuZC1pbWFnZTpyZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KDQ1ZGVnLHRyYW5zcGFyZW50LHRyYW5zcGFyZW50IDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4wNSkgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjA1KSAxMHB4KTtjdXJzb3I6bW92ZTtoZWlnaHQ6N3B4O21hcmdpbi1ib3R0b206M3B4fS5lbW90ZS1tZW51IC5kcmFnZ2FibGU6aG92ZXJ7YmFja2dyb3VuZC1pbWFnZTotd2Via2l0LXJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSAxMHB4KTtiYWNrZ3JvdW5kLWltYWdlOnJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsdHJhbnNwYXJlbnQsdHJhbnNwYXJlbnQgNXB4LHJnYmEoMjU1LDI1NSwyNTUsLjEpIDVweCxyZ2JhKDI1NSwyNTUsMjU1LC4xKSAxMHB4KX0uZW1vdGUtbWVudSAuaGVhZGVyLWluZm97Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O2JhY2tncm91bmQtaW1hZ2U6LXdlYmtpdC1saW5lYXItZ3JhZGllbnQoYm90dG9tLHRyYW5zcGFyZW50LHJnYmEoMCwwLDAsLjUpKTtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCh0byB0b3AsdHJhbnNwYXJlbnQscmdiYSgwLDAsMCwuNSkpO3BhZGRpbmc6MnB4O2NvbG9yOiNkZGQ7dGV4dC1hbGlnbjpjZW50ZXI7cG9zaXRpb246cmVsYXRpdmV9LmVtb3RlLW1lbnUgLmhlYWRlci1pbmZvIGltZ3ttYXJnaW4tcmlnaHQ6OHB4fS5lbW90ZS1tZW51IC5lbW90ZXtkaXNwbGF5OmlubGluZS1ibG9jaztwYWRkaW5nOjJweDttYXJnaW46MXB4O2N1cnNvcjpwb2ludGVyO2JvcmRlci1yYWRpdXM6NXB4O3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjMwcHg7aGVpZ2h0OjMwcHg7LXdlYmtpdC10cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7dHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO2JvcmRlcjoxcHggc29saWQgdHJhbnNwYXJlbnR9LmVtb3RlLW1lbnUuZWRpdGluZyAuZW1vdGV7Y3Vyc29yOmF1dG99LmVtb3RlLW1lbnUgLmVtb3RlIGltZ3ttYXgtd2lkdGg6MTAwJTttYXgtaGVpZ2h0OjEwMCU7bWFyZ2luOmF1dG87cG9zaXRpb246YWJzb2x1dGU7dG9wOjA7Ym90dG9tOjA7bGVmdDowO3JpZ2h0OjB9LmVtb3RlLW1lbnUgLnNpbmdsZS1yb3cgLmVtb3RlLWNvbnRhaW5lcntvdmVyZmxvdzpoaWRkZW47aGVpZ2h0OjM3cHh9LmVtb3RlLW1lbnUgLnNpbmdsZS1yb3cgLmVtb3Rle2Rpc3BsYXk6aW5saW5lLWJsb2NrO21hcmdpbi1ib3R0b206MTAwcHh9LmVtb3RlLW1lbnUgLmVtb3RlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwuMSl9LmVtb3RlLW1lbnUgLnB1bGwtbGVmdHtmbG9hdDpsZWZ0fS5lbW90ZS1tZW51IC5wdWxsLXJpZ2h0e2Zsb2F0OnJpZ2h0fS5lbW90ZS1tZW51IC5mb290ZXJ7dGV4dC1hbGlnbjpjZW50ZXI7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMDtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwuMDUpIGluc2V0O3BhZGRpbmc6NXB4IDAgMnB4O21hcmdpbi10b3A6NXB4O2hlaWdodDoxOHB4fS5lbW90ZS1tZW51IC5mb290ZXIgLnB1bGwtbGVmdHttYXJnaW4tcmlnaHQ6NXB4fS5lbW90ZS1tZW51IC5mb290ZXIgLnB1bGwtcmlnaHR7bWFyZ2luLWxlZnQ6NXB4fS5lbW90ZS1tZW51IC5pY29ue2hlaWdodDoxNnB4O3dpZHRoOjE2cHg7b3BhY2l0eTouNTtiYWNrZ3JvdW5kLXNpemU6Y29udGFpbiFpbXBvcnRhbnR9LmVtb3RlLW1lbnUgLmljb246aG92ZXJ7b3BhY2l0eToxfS5lbW90ZS1tZW51IC5pY29uLWhvbWV7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlOalFpRFFvZ0lDQm9aV2xuYUhROUlqWTBJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJRFkwSURZMElnMEtJQ0FnYVdROUlrTmhjR0ZmTVNJTkNpQWdJSGh0YkRwemNHRmpaVDBpY0hKbGMyVnlkbVVpUGp4dFpYUmhaR0YwWVEwS0lDQWdhV1E5SW0xbGRHRmtZWFJoTXpBd01TSStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pJNU9Ua2lJQzgrRFFvOGNHRjBhQTBLSUNBZ1pEMGliU0ExTnk0d05qSXNNekV1TXprNElHTWdNQzQ1TXpJc0xURXVNREkxSURBdU9EUXlMQzB5TGpVNU5pQXRNQzR5TURFc0xUTXVOVEE0SUV3Z016TXVPRGcwTERjdU56ZzFJRU1nTXpJdU9EUXhMRFl1T0RjeklETXhMakUyT1N3MkxqZzVNaUF6TUM0eE5EZ3NOeTQ0TWpnZ1RDQTNMakE1TXl3eU9DNDVOaklnWXlBdE1TNHdNakVzTUM0NU16WWdMVEV1TURjeExESXVOVEExSUMwd0xqRXhNU3d6TGpVd015QnNJREF1TlRjNExEQXVOakF5SUdNZ01DNDVOVGtzTUM0NU9UZ2dNaTQxTURrc01TNHhNVGNnTXk0ME5pd3dMakkyTlNCc0lERXVOekl6TEMweExqVTBNeUIySURJeUxqVTVJR01nTUN3eExqTTROaUF4TGpFeU15d3lMalV3T0NBeUxqVXdPQ3d5TGpVd09DQm9JRGd1T1RnM0lHTWdNUzR6T0RVc01DQXlMalV3T0N3dE1TNHhNaklnTWk0MU1EZ3NMVEl1TlRBNElGWWdNemd1TlRjMUlHZ2dNVEV1TkRZeklIWWdNVFV1T0RBMElHTWdMVEF1TURJc01TNHpPRFVnTUM0NU56RXNNaTQxTURjZ01pNHpOVFlzTWk0MU1EY2dhQ0E1TGpVeU5DQmpJREV1TXpnMUxEQWdNaTQxTURnc0xURXVNVEl5SURJdU5UQTRMQzB5TGpVd09DQldJRE15TGpFd055QmpJREFzTUNBd0xqUTNOaXd3TGpReE55QXhMakEyTXl3d0xqa3pNeUF3TGpVNE5pd3dMalV4TlNBeExqZ3hOeXd3TGpFd01pQXlMamMwT1N3dE1DNDVNalFnYkNBd0xqWTFNeXd0TUM0M01UZ2dlaUlOQ2lBZ0lHbGtQU0p3WVhSb01qazVOU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5tWm1abVptWTdabWxzYkMxdmNHRmphWFI1T2pFaUlDOCtEUW84TDNOMlp6ND0pIG5vLXJlcGVhdCA1MCV9LmVtb3RlLW1lbnUgLmljb24tZ2VhcntiYWNrZ3JvdW5kOnVybChkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0RRbzhJUzB0SUVOeVpXRjBaV1FnZDJsMGFDQkpibXR6WTJGd1pTQW9hSFIwY0RvdkwzZDNkeTVwYm10elkyRndaUzV2Y21jdktTQXRMVDROQ2cwS1BITjJadzBLSUNBZ2VHMXNibk02WkdNOUltaDBkSEE2THk5d2RYSnNMbTl5Wnk5a1l5OWxiR1Z0Wlc1MGN5OHhMakV2SWcwS0lDQWdlRzFzYm5NNlkyTTlJbWgwZEhBNkx5OWpjbVZoZEdsMlpXTnZiVzF2Ym5NdWIzSm5MMjV6SXlJTkNpQWdJSGh0Ykc1ek9uSmtaajBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TVRrNU9TOHdNaTh5TWkxeVpHWXRjM2x1ZEdGNExXNXpJeUlOQ2lBZ0lIaHRiRzV6T25OMlp6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjJaWEp6YVc5dVBTSXhMakVpRFFvZ0lDQjNhV1IwYUQwaU1qRXVOVGtpRFFvZ0lDQm9aV2xuYUhROUlqSXhMakV6TmprNU9TSU5DaUFnSUhacFpYZENiM2c5SWpBZ01DQXlNUzQxT1NBeU1TNHhNemNpRFFvZ0lDQnBaRDBpUTJGd1lWOHhJZzBLSUNBZ2VHMXNPbk53WVdObFBTSndjbVZ6WlhKMlpTSStQRzFsZEdGa1lYUmhEUW9nSUNCcFpEMGliV1YwWVdSaGRHRXpPU0krUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6TTNJaUF2UGcwS1BIQmhkR2dOQ2lBZ0lHUTlJazBnTVRndU5qSXlMRGd1TVRRMUlERTRMakEzTnl3MkxqZzFJR01nTUN3d0lERXVNalk0TEMweUxqZzJNU0F4TGpFMU5pd3RNaTQ1TnpFZ1RDQXhOeTQxTlRRc01pNHlOQ0JESURFM0xqUXpPQ3d5TGpFeU55QXhOQzQxTnpZc015NDBNek1nTVRRdU5UYzJMRE11TkRNeklFd2dNVE11TWpVMkxESXVPU0JESURFekxqSTFOaXd5TGprZ01USXVNRGtzTUNBeE1TNDVNeXd3SUVnZ09TNDFOakVnUXlBNUxqTTVOaXd3SURndU16RTNMREl1T1RBMklEZ3VNekUzTERJdU9UQTJJRXdnTmk0NU9Ua3NNeTQwTkRFZ1l5QXdMREFnTFRJdU9USXlMQzB4TGpJME1pQXRNeTR3TXpRc0xURXVNVE14SUV3Z01pNHlPRGtzTXk0NU5URWdReUF5TGpFM015dzBMakEyTkNBekxqVXdOeXcyTGpnMk55QXpMalV3Tnl3MkxqZzJOeUJNSURJdU9UWXlMRGd1TVRZZ1F5QXlMamsyTWl3NExqRTJJREFzT1M0ek1ERWdNQ3c1TGpRMU5TQjJJREl1TXpJeUlHTWdNQ3d3TGpFMk1pQXlMamsyT1N3eExqSXhPU0F5TGprMk9Td3hMakl4T1NCc0lEQXVOVFExTERFdU1qa3hJR01nTUN3d0lDMHhMakkyT0N3eUxqZzFPU0F0TVM0eE5UY3NNaTQ1TmprZ2JDQXhMalkzT0N3eExqWTBNeUJqSURBdU1URTBMREF1TVRFeElESXVPVGMzTEMweExqRTVOU0F5TGprM055d3RNUzR4T1RVZ2JDQXhMak15TVN3d0xqVXpOU0JqSURBc01DQXhMakUyTml3eUxqZzVPQ0F4TGpNeU55d3lMamc1T0NCb0lESXVNelk1SUdNZ01DNHhOalFzTUNBeExqSTBOQ3d0TWk0NU1EWWdNUzR5TkRRc0xUSXVPVEEySUd3Z01TNHpNaklzTFRBdU5UTTFJR01nTUN3d0lESXVPVEUyTERFdU1qUXlJRE11TURJNUxERXVNVE16SUd3Z01TNDJOemdzTFRFdU5qUXhJR01nTUM0eE1UY3NMVEF1TVRFMUlDMHhMakl5TEMweUxqa3hOaUF0TVM0eU1pd3RNaTQ1TVRZZ2JDQXdMalUwTkN3dE1TNHlPVE1nWXlBd0xEQWdNaTQ1TmpNc0xURXVNVFF6SURJdU9UWXpMQzB4TGpJNU9TQldJRGt1TXpZZ1F5QXlNUzQxT1N3NUxqRTVPU0F4T0M0Mk1qSXNPQzR4TkRVZ01UZ3VOakl5TERndU1UUTFJSG9nYlNBdE5DNHpOallzTWk0ME1qTWdZeUF3TERFdU9EWTNJQzB4TGpVMU15d3pMak00TnlBdE15NDBOakVzTXk0ek9EY2dMVEV1T1RBMkxEQWdMVE11TkRZeExDMHhMalV5SUMwekxqUTJNU3d0TXk0ek9EY2dNQ3d0TVM0NE5qY2dNUzQxTlRVc0xUTXVNemcxSURNdU5EWXhMQzB6TGpNNE5TQXhMamt3T1N3d0xqQXdNU0F6TGpRMk1Td3hMalV4T0NBekxqUTJNU3d6TGpNNE5TQjZJZzBLSUNBZ2FXUTlJbkJoZEdneklnMEtJQ0FnYzNSNWJHVTlJbVpwYkd3NkkwWkdSa1pHUmlJZ0x6NE5DanhuRFFvZ0lDQnBaRDBpWnpVaVBnMEtQQzluUGcwS1BHY05DaUFnSUdsa1BTSm5OeUkrRFFvOEwyYytEUW84WncwS0lDQWdhV1E5SW1jNUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekV4SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RXpJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpFMUlqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekUzSWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6RTVJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJeElqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekl6SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6STFJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpJM0lqNE5Dand2Wno0TkNqeG5EUW9nSUNCcFpEMGlaekk1SWo0TkNqd3ZaejROQ2p4bkRRb2dJQ0JwWkQwaVp6TXhJajROQ2p3dlp6NE5DanhuRFFvZ0lDQnBaRDBpWnpNeklqNE5Dand2Wno0TkNqd3ZjM1puUGcwSykgbm8tcmVwZWF0IDUwJX0uZW1vdGUtbWVudS5lZGl0aW5nIC5pY29uLWdlYXJ7LXdlYmtpdC1hbmltYXRpb246c3BpbiA0cyBsaW5lYXIgaW5maW5pdGU7YW5pbWF0aW9uOnNwaW4gNHMgbGluZWFyIGluZmluaXRlfS5lbW90ZS1tZW51IC5pY29uLXJlc2l6ZS1oYW5kbGV7YmFja2dyb3VuZDp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVFlpRFFvZ0lDQm9aV2xuYUhROUlqRTJJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJREUySURFMklnMEtJQ0FnYVdROUlrTmhjR0ZmTVNJTkNpQWdJSGh0YkRwemNHRmpaVDBpY0hKbGMyVnlkbVVpUGp4dFpYUmhaR0YwWVEwS0lDQWdhV1E5SW0xbGRHRmtZWFJoTkRNMU55SStQSEprWmpwU1JFWStQR05qT2xkdmNtc05DaUFnSUNBZ0lDQnlaR1k2WVdKdmRYUTlJaUkrUEdSak9tWnZjbTFoZEQ1cGJXRm5aUzl6ZG1jcmVHMXNQQzlrWXpwbWIzSnRZWFErUEdSak9uUjVjR1VOQ2lBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStQQzlqWXpwWGIzSnJQand2Y21SbU9sSkVSajQ4TDIxbGRHRmtZWFJoUGp4a1pXWnpEUW9nSUNCcFpEMGlaR1ZtY3pRek5UVWlJQzgrRFFvOGNHRjBhQTBLSUNBZ1pEMGlUU0F4TXk0MUxEZ2dReUF4TXk0eU1qVXNPQ0F4TXl3NExqSXlOQ0F4TXl3NExqVWdkaUF6TGpjNU15Qk1JRE11TnpBM0xETWdTQ0EzTGpVZ1F5QTNMamMzTml3eklEZ3NNaTQzTnpZZ09Dd3lMalVnT0N3eUxqSXlOQ0EzTGpjM05pd3lJRGN1TlN3eUlHZ2dMVFVnVENBeUxqTXdPU3d5TGpBek9TQXlMakUxTERJdU1UUTBJREl1TVRRMkxESXVNVFEySURJdU1UUXpMREl1TVRVeUlESXVNRE01TERJdU16QTVJRElzTWk0MUlIWWdOU0JESURJc055NDNOellnTWk0eU1qUXNPQ0F5TGpVc09DQXlMamMzTml3NElETXNOeTQzTnpZZ015dzNMalVnVmlBekxqY3dOeUJNSURFeUxqSTVNeXd4TXlCSUlEZ3VOU0JESURndU1qSTBMREV6SURnc01UTXVNakkxSURnc01UTXVOU0E0TERFekxqYzNOU0E0TGpJeU5Dd3hOQ0E0TGpVc01UUWdhQ0ExSUd3Z01DNHhPVEVzTFRBdU1ETTVJR01nTUM0eE1qRXNMVEF1TURVeElEQXVNaklzTFRBdU1UUTRJREF1TWpjc0xUQXVNamNnVENBeE5Dd3hNeTQxTURJZ1ZpQTRMalVnUXlBeE5DdzRMakl5TkNBeE15NDNOelVzT0NBeE15NDFMRGdnZWlJTkNpQWdJR2xrUFNKd1lYUm9ORE0xTVNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptWm1abVk3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejQ9KSBuby1yZXBlYXQgNTAlO2N1cnNvcjpud3NlLXJlc2l6ZSFpbXBvcnRhbnR9LmVtb3RlLW1lbnUgLmljb24tcGlue2JhY2tncm91bmQ6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTVRZaURRb2dJQ0JvWldsbmFIUTlJakUySWcwS0lDQWdhV1E5SW5OMlp6TXdNRFVpUGcwS0lDQThiV1YwWVdSaGRHRU5DaUFnSUNBZ2FXUTlJbTFsZEdGa1lYUmhNekF5TXlJK0RRb2dJQ0FnUEhKa1pqcFNSRVkrRFFvZ0lDQWdJQ0E4WTJNNlYyOXlhdzBLSUNBZ0lDQWdJQ0FnY21SbU9tRmliM1YwUFNJaVBnMEtJQ0FnSUNBZ0lDQThaR002Wm05eWJXRjBQbWx0WVdkbEwzTjJaeXQ0Yld3OEwyUmpPbVp2Y20xaGRENE5DaUFnSUNBZ0lDQWdQR1JqT25SNWNHVU5DaUFnSUNBZ0lDQWdJQ0FnY21SbU9uSmxjMjkxY21ObFBTSm9kSFJ3T2k4dmNIVnliQzV2Y21jdlpHTXZaR050YVhSNWNHVXZVM1JwYkd4SmJXRm5aU0lnTHo0TkNpQWdJQ0FnSUNBZ1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStEUW9nSUNBZ0lDQThMMk5qT2xkdmNtcytEUW9nSUNBZ1BDOXlaR1k2VWtSR1BnMEtJQ0E4TDIxbGRHRmtZWFJoUGcwS0lDQThaR1ZtY3cwS0lDQWdJQ0JwWkQwaVpHVm1jek13TWpFaUlDOCtEUW9nSUR4bkRRb2dJQ0FnSUhSeVlXNXpabTl5YlQwaWJXRjBjbWw0S0RBdU56a3pNRGM0TWl3d0xEQXNNQzQzT1RNd056Z3lMQzB5TGpFM01EazROU3d0T0RFMExqWTVNams1S1NJTkNpQWdJQ0FnYVdROUltY3pNREEzSWo0TkNpQWdJQ0E4WncwS0lDQWdJQ0FnSUhSeVlXNXpabTl5YlQwaWJXRjBjbWw0S0RBdU56QTNNVEVzTUM0M01EY3hNU3d0TUM0M01EY3hNU3d3TGpjd056RXhMRGN6Tnk0M01EYzFOU3d5T1RVdU5EZzRNRGdwSWcwS0lDQWdJQ0FnSUdsa1BTSm5NekF3T1NJK0RRb2dJQ0FnSUNBOFp3MEtJQ0FnSUNBZ0lDQWdhV1E5SW1jek56VTFJajROQ2lBZ0lDQWdJQ0FnUEhCaGRHZ05DaUFnSUNBZ0lDQWdJQ0FnWkQwaVRTQTVMamM0TVRJMUxEQWdReUE1TGpRM05EQTFOaklzTUM0Mk9Ea3hNVElnT1M0MU1qQTJPQ3d4TGpVeU16QTROVE1nT1M0ek1USTFMREl1TVRnM05TQk1JRFF1T1RNM05TdzJMalU1TXpjMUlFTWdNeTQ1TlRnNU5qQTRMRFl1TkRJNU5EZ3pJREl1T1RRM056VTBPQ3cyTGpVek1qYzRPVGtnTWl3MkxqZ3hNalVnVENBMUxqQXpNVEkxTERrdU9EUXpOelVnTUM0MU5qSTFMREUwTGpNeE1qVWdNQ3d4TmlCRElEQXVOVFk1TWprMk1qZ3NNVFV1TnprMU5qSTJJREV1TVRZM056TTNPQ3d4TlM0Mk5EQXlNemNnTVM0M01UZzNOU3d4TlM0ME1EWXlOU0JNSURZdU1UVTJNalVzTVRBdU9UWTROelVnT1M0eE9EYzFMREUwSUdNZ01DNHlOemsyT0RJekxDMHdMamswTnpjNE15QXdMak00TXpFMU1qZ3NMVEV1T1RVNE9UTTNJREF1TWpFNE56VXNMVEl1T1RNM05TQXhMalV3TURBeE1Td3RNUzQwT0RrMU56azRJRE11TURBd01EQXhMQzB5TGprM09URTFPU0EwTGpVc0xUUXVORFk0TnpVZ01DNDJNREV4TURJc0xUQXVNRE14TXpZeElERXVPREl5TVRNNExDMHdMakE1TmpFek55QXlMQzB3TGpRMk9EYzFJRU1nTVRNdU9EYzVPRGt5TERRdU1EWTVORGd3TXlBeE1TNDROREk0TmpVc01pNHdNakF5TWpneUlEa3VOemd4TWpVc01DQjZJZzBLSUNBZ0lDQWdJQ0FnSUNCMGNtRnVjMlp2Y20wOUltMWhkSEpwZUNnd0xqZzVNVFU1TXpjMExDMHdMamc1TVRVNU16YzBMREF1T0RreE5Ua3pOelFzTUM0NE9URTFPVE0zTkN3dE1pNHlOalUxTERFd016Y3VNVE0wTlNraURRb2dJQ0FnSUNBZ0lDQWdJR2xrUFNKd1lYUm9NekF4TVNJTkNpQWdJQ0FnSUNBZ0lDQWdjM1I1YkdVOUltWnBiR3c2STJabVptWm1aanRtYVd4c0xXOXdZV05wZEhrNk1TSWdMejROQ2lBZ0lDQWdJRHd2Wno0TkNpQWdJQ0E4TDJjK0RRb2dJRHd2Wno0TkNqd3ZjM1puUGcwSykgbm8tcmVwZWF0IDUwJTstd2Via2l0LXRyYW5zaXRpb246YWxsIC4yNXMgZWFzZTt0cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2V9LmVtb3RlLW1lbnUgLmljb24tcGluOmhvdmVyLC5lbW90ZS1tZW51LnBpbm5lZCAuaWNvbi1waW57LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7LW1zLXRyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTt0cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7b3BhY2l0eToxfS5lbW90ZS1tZW51IC5lZGl0LXRvb2x7YmFja2dyb3VuZC1wb3NpdGlvbjo1MCU7YmFja2dyb3VuZC1yZXBlYXQ6bm8tcmVwZWF0O2JhY2tncm91bmQtc2l6ZToxNHB4O2JvcmRlci1yYWRpdXM6NHB4O2JvcmRlcjoxcHggc29saWQgIzAwMDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5Om5vbmU7aGVpZ2h0OjE0cHg7b3BhY2l0eTouMjU7cG9zaXRpb246YWJzb2x1dGU7LXdlYmtpdC10cmFuc2l0aW9uOmFsbCAuMjVzIGVhc2U7dHJhbnNpdGlvbjphbGwgLjI1cyBlYXNlO3dpZHRoOjE0cHg7ei1pbmRleDoxfS5lbW90ZS1tZW51IC5lZGl0LXRvb2w6aG92ZXIsLmVtb3RlLW1lbnUgLmVtb3RlOmhvdmVyIC5lZGl0LXRvb2x7b3BhY2l0eToxfS5lbW90ZS1tZW51IC5lZGl0LXZpc2liaWxpdHl7YmFja2dyb3VuZC1jb2xvcjojMDBjODAwO2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTVRBd0lnMEtJQ0FnYUdWcFoyaDBQU0l4TURBaURRb2dJQ0IyYVdWM1FtOTRQU0l3SURBZ01UQXdJREV3TUNJTkNpQWdJR2xrUFNKTVlYbGxjbDh4SWcwS0lDQWdlRzFzT25Od1lXTmxQU0p3Y21WelpYSjJaU0krUEcxbGRHRmtZWFJoRFFvZ0lDQnBaRDBpYldWMFlXUmhkR0U1SWo0OGNtUm1PbEpFUmo0OFkyTTZWMjl5YXcwS0lDQWdJQ0FnSUhKa1pqcGhZbTkxZEQwaUlqNDhaR002Wm05eWJXRjBQbWx0WVdkbEwzTjJaeXQ0Yld3OEwyUmpPbVp2Y20xaGRENDhaR002ZEhsd1pRMEtJQ0FnSUNBZ0lDQWdjbVJtT25KbGMyOTFjbU5sUFNKb2RIUndPaTh2Y0hWeWJDNXZjbWN2WkdNdlpHTnRhWFI1Y0dVdlUzUnBiR3hKYldGblpTSWdMejQ4WkdNNmRHbDBiR1UrUEM5a1l6cDBhWFJzWlQ0OEwyTmpPbGR2Y21zK1BDOXlaR1k2VWtSR1Bqd3ZiV1YwWVdSaGRHRStQR1JsWm5NTkNpQWdJR2xrUFNKa1pXWnpOeUlnTHo0TkNqeHdZWFJvRFFvZ0lDQmtQU0pOSURrM0xqazJOQ3cwTmk0MU5EZ2dReUE1Tnk0d09UZ3NORFV1TlRJNElEYzJMalF5Tnl3eU1TNDJNRE1nTlRBc01qRXVOakF6SUdNZ0xUSTJMalF5Tnl3d0lDMDBOeTR3T1Rnc01qTXVPVEkxSUMwME55NDVOalVzTWpRdU9UUTJJQzB4TGpjd01Td3lJQzB4TGpjd01TdzBMamt3TWlBeE1HVXROQ3cyTGprd015QXdMamcyTml3eExqQXlJREl4TGpVek55d3lOQzQ1TkRVZ05EY3VPVFkwTERJMExqazBOU0F5Tmk0ME1qY3NNQ0EwTnk0d09UZ3NMVEl6TGpreU5pQTBOeTQ1TmpVc0xUSTBMamswTmlBeExqY3dNU3d0TWlBeExqY3dNU3d0TkM0NU1ESWdMVEF1TURBeExDMDJMamt3TXlCNklFMGdOVGd1TURjekxETTFMamszTlNCaklERXVOemMzTEMwd0xqazNJRFF1TWpVMUxEQXVNVFF6SURVdU5UTTBMREl1TkRnMUlERXVNamM1TERJdU16UXpJREF1T0RjMUxEVXVNREk1SUMwd0xqa3dNaXcxTGprNU9TQXRNUzQzTnpjc01DNDVOekVnTFRRdU1qVTFMQzB3TGpFME15QXROUzQxTXpVc0xUSXVORGcxSUMweExqSTNPU3d0TWk0ek5ETWdMVEF1T0RjMUxDMDFMakF5T1NBd0xqa3dNeXd0TlM0NU9Ua2dlaUJOSURVd0xEWTVMamN5T1NCRElETXhMalUwTERZNUxqY3lPU0F4Tmk0d01EVXNOVFV1TlRVeklERXdMall5T0N3MU1DQXhOQzR5TlRrc05EWXVNalE1SURJeUxqVXlOaXd6T0M0MU56RWdNek11TVRrMUxETXpMamszT1NBek1TNHhNVFFzTXpjdU1UUTFJREk1TGpnNU5DdzBNQzQ1TWpnZ01qa3VPRGswTERRMUlHTWdNQ3d4TVM0eE1EUWdPUzR3TURFc01qQXVNVEExSURJd0xqRXdOU3d5TUM0eE1EVWdNVEV1TVRBMExEQWdNakF1TVRBMkxDMDVMakF3TVNBeU1DNHhNRFlzTFRJd0xqRXdOU0F3TEMwMExqQTNNaUF0TVM0eU1Ua3NMVGN1T0RVMUlDMHpMak1zTFRFeExqQXlNU0JESURjM0xqUTNOQ3d6T0M0MU56SWdPRFV1TnpReExEUTJMakkxSURnNUxqTTNNaXcxTUNBNE15NDVPVFVzTlRVdU5UVTFJRFk0TGpRMkxEWTVMamN5T1NBMU1DdzJPUzQzTWprZ2VpSU5DaUFnSUdsa1BTSndZWFJvTXlJZ0x6NE5Dand2YzNablBnPT0pfS5lbW90ZS1tZW51IC5lZGl0LXN0YXJyZWR7YmFja2dyb3VuZC1jb2xvcjojMzIzMjMyO2JhY2tncm91bmQtaW1hZ2U6dXJsKGRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrRFFvOElTMHRJRU55WldGMFpXUWdkMmwwYUNCSmJtdHpZMkZ3WlNBb2FIUjBjRG92TDNkM2R5NXBibXR6WTJGd1pTNXZjbWN2S1NBdExUNE5DZzBLUEhOMlp3MEtJQ0FnZUcxc2JuTTZaR005SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5bGJHVnRaVzUwY3k4eExqRXZJZzBLSUNBZ2VHMXNibk02WTJNOUltaDBkSEE2THk5amNtVmhkR2wyWldOdmJXMXZibk11YjNKbkwyNXpJeUlOQ2lBZ0lIaHRiRzV6T25Ka1pqMGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M4d01pOHlNaTF5WkdZdGMzbHVkR0Y0TFc1ekl5SU5DaUFnSUhodGJHNXpPbk4yWnowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0I0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lEUW9nSUNCMlpYSnphVzl1UFNJeExqRWlEUW9nSUNCM2FXUjBhRDBpTlRBaURRb2dJQ0JvWldsbmFIUTlJalV3SWcwS0lDQWdkbWxsZDBKdmVEMGlNQ0F3SURVd0lEVXdJZzBLSUNBZ2FXUTlJa3hoZVdWeVh6RWlEUW9nSUNCNGJXdzZjM0JoWTJVOUluQnlaWE5sY25abElqNDhiV1YwWVdSaGRHRU5DaUFnSUdsa1BTSnRaWFJoWkdGMFlUTXdNREVpUGp4eVpHWTZVa1JHUGp4all6cFhiM0pyRFFvZ0lDQWdJQ0FnY21SbU9tRmliM1YwUFNJaVBqeGtZenBtYjNKdFlYUSthVzFoWjJVdmMzWm5LM2h0YkR3dlpHTTZabTl5YldGMFBqeGtZenAwZVhCbERRb2dJQ0FnSUNBZ0lDQnlaR1k2Y21WemIzVnlZMlU5SW1oMGRIQTZMeTl3ZFhKc0xtOXlaeTlrWXk5a1kyMXBkSGx3WlM5VGRHbHNiRWx0WVdkbElpQXZQanhrWXpwMGFYUnNaVDQ4TDJSak9uUnBkR3hsUGp3dlkyTTZWMjl5YXo0OEwzSmtaanBTUkVZK1BDOXRaWFJoWkdGMFlUNDhaR1ZtY3cwS0lDQWdhV1E5SW1SbFpuTXlPVGs1SWlBdlBnMEtQSEJoZEdnTkNpQWdJR1E5SW0wZ05ETXVNRFFzTWpJdU5qazJJQzAzTGpVMk9DdzNMak0zTnlBeExqYzROeXd4TUM0ME1UY2dZeUF3TGpFeU55d3dMamMxSUMwd0xqRTRNaXd4TGpVd09TQXRNQzQzT1Rjc01TNDVOVGNnTFRBdU16UTRMREF1TWpVeklDMHdMamMyTWl3d0xqTTRNaUF0TVM0eE56WXNNQzR6T0RJZ0xUQXVNekU0TERBZ0xUQXVOak00TEMwd0xqQTNOaUF0TUM0NU16RXNMVEF1TWpNZ1RDQXlOU3d6Tnk0Mk9ERWdNVFV1TmpRMUxEUXlMalU1T1NCaklDMHdMalkzTkN3d0xqTTFOU0F0TVM0ME9Td3dMakk1TlNBdE1pNHhNRGNzTFRBdU1UVXhJRU1nTVRJdU9USXpMRFF5SURFeUxqWXhOQ3cwTVM0eU5ESWdNVEl1TnpRekxEUXdMalE1TVNCTUlERTBMalV6TERNd0xqQTNOQ0EyTGprMk1pd3lNaTQyT1RjZ1F5QTJMalF4TlN3eU1pNHhOallnTmk0eU1qRXNNakV1TXpjeElEWXVORFUwTERJd0xqWTBOeUEyTGpZNUxERTVMamt5TXlBM0xqTXhOU3d4T1M0ek9UWWdPQzR3Tmprc01Ua3VNamcySUd3Z01UQXVORFU1TEMweExqVXlNU0EwTGpZNExDMDVMalEzT0NCRElESXpMalUwTXl3M0xqWXdNeUF5TkM0eU16a3NOeTR4TnpFZ01qVXNOeTR4TnpFZ1l5QXdMamMyTXl3d0lERXVORFUyTERBdU5ETXlJREV1TnprekxERXVNVEUxSUd3Z05DNDJOemtzT1M0ME56Z2dNVEF1TkRZeExERXVOVEl4SUdNZ01DNDNOVElzTUM0eE1Ea2dNUzR6Tnprc01DNDJNemNnTVM0Mk1USXNNUzR6TmpFZ01DNHlNemNzTUM0M01qUWdNQzR3TXpnc01TNDFNVGtnTFRBdU5UQTFMREl1TURVZ2VpSU5DaUFnSUdsa1BTSndZWFJvTWprNU5TSU5DaUFnSUhOMGVXeGxQU0ptYVd4c09pTmpZMk5qWTJNN1ptbHNiQzF2Y0dGamFYUjVPakVpSUM4K0RRbzhMM04yWno0TkNnPT0pfS5lbW90ZS1tZW51IC5lbW90ZT4uZWRpdC12aXNpYmlsaXR5e2JvdHRvbTphdXRvO2xlZnQ6YXV0bztyaWdodDowO3RvcDowfS5lbW90ZS1tZW51IC5lbW90ZT4uZWRpdC1zdGFycmVke2JvdHRvbTphdXRvO2xlZnQ6MDtyaWdodDphdXRvO3RvcDowfS5lbW90ZS1tZW51IC5oZWFkZXItaW5mbz4uZWRpdC10b29se21hcmdpbi1sZWZ0OjVweH0uZW1vdGUtbWVudS5lZGl0aW5nIC5lZGl0LXRvb2x7ZGlzcGxheTppbmxpbmUtYmxvY2t9LmVtb3RlLW1lbnUgLmVtb3RlLW1lbnUtaGlkZGVuIC5lZGl0LXZpc2liaWxpdHl7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlNVEF3SWcwS0lDQWdhR1ZwWjJoMFBTSXhNREFpRFFvZ0lDQjJhV1YzUW05NFBTSXdJREFnTVRBd0lERXdNQ0lOQ2lBZ0lHbGtQU0pNWVhsbGNsOHpJZzBLSUNBZ2VHMXNPbk53WVdObFBTSndjbVZ6WlhKMlpTSStQRzFsZEdGa1lYUmhEUW9nSUNCcFpEMGliV1YwWVdSaGRHRXhOU0krUEhKa1pqcFNSRVkrUEdOak9sZHZjbXNOQ2lBZ0lDQWdJQ0J5WkdZNllXSnZkWFE5SWlJK1BHUmpPbVp2Y20xaGRENXBiV0ZuWlM5emRtY3JlRzFzUEM5a1l6cG1iM0p0WVhRK1BHUmpPblI1Y0dVTkNpQWdJQ0FnSUNBZ0lISmtaanB5WlhOdmRYSmpaVDBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJSamJXbDBlWEJsTDFOMGFXeHNTVzFoWjJVaUlDOCtQR1JqT25ScGRHeGxQand2WkdNNmRHbDBiR1UrUEM5all6cFhiM0pyUGp3dmNtUm1PbEpFUmo0OEwyMWxkR0ZrWVhSaFBqeGtaV1p6RFFvZ0lDQnBaRDBpWkdWbWN6RXpJaUF2UGcwS1BHY05DaUFnSUdsa1BTSm5NeUkrRFFvSlBIQmhkR2dOQ2lBZ0lHUTlJazBnTnpBdU1EZ3lMRFExTGpRM05TQTFNQzQwTnpRc05qVXVNRGd5SUVNZ05qRXVNVGs0TERZMExqZ3pNU0EyT1M0NE16RXNOVFl1TVRrM0lEY3dMakE0TWl3ME5TNDBOelVnZWlJTkNpQWdJR2xrUFNKd1lYUm9OU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5HUmtaR1JrWWlJQzgrRFFvSlBIQmhkR2dOQ2lBZ0lHUTlJbTBnT1RjdU9UWTBMRFEyTGpVME9DQmpJQzB3TGpRMUxDMHdMalV5T1NBdE5pNHlORFVzTFRjdU1qTWdMVEUxTGpRd015d3RNVE11TlRVMElHd2dMVFl1TWl3MkxqSWdReUE0TWk0ek5URXNORE11TVRRNElEZzJMamt5TERRM0xqUTJPU0E0T1M0ek56SXNOVEFnT0RNdU9UazFMRFUxTGpVMU5TQTJPQzQwTml3Mk9TNDNNamtnTlRBc05qa3VOekk1SUdNZ0xURXVNek0wTERBZ0xUSXVOalV4TEMwd0xqQTRNaUF0TXk0NU5USXNMVEF1TWpJeUlHd2dMVGN1TkRNNUxEY3VORE01SUdNZ015NDJNemtzTUM0NU1Ea2dOeTQwTkRrc01TNDBOU0F4TVM0ek9URXNNUzQwTlNBeU5pNDBNamNzTUNBME55NHdPVGdzTFRJekxqa3lOaUEwTnk0NU5qVXNMVEkwTGprME5pQXhMamN3TVN3dE1TNDVPVGtnTVM0M01ERXNMVFF1T1RBeElDMHdMakF3TVN3dE5pNDVNRElnZWlJTkNpQWdJR2xrUFNKd1lYUm9OeUlOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5HUmtaR1JrWWlJQzgrRFFvSlBIQmhkR2dOQ2lBZ0lHUTlJbTBnT1RFdU5ERXhMREUyTGpZMklHTWdNQ3d0TUM0eU5qWWdMVEF1TVRBMUxDMHdMalV5SUMwd0xqSTVNeXd0TUM0M01EY2diQ0F0Tnk0d056RXNMVGN1TURjZ1l5QXRNQzR6T1RFc0xUQXVNemt4SUMweExqQXlNeXd0TUM0ek9URWdMVEV1TkRFMExEQWdUQ0EyTmk0NE1EUXNNalF1TnpFeElFTWdOakV1TmpBeUxESXlMamd4T0NBMU5TNDVORGtzTWpFdU5qQXpJRFV3TERJeExqWXdNeUJqSUMweU5pNDBNamNzTUNBdE5EY3VNRGs0TERJekxqa3lOaUF0TkRjdU9UWTFMREkwTGprME5pQXRNUzQzTURFc01pQXRNUzQzTURFc05DNDVNRElnTVRCbExUUXNOaTQ1TURNZ01DNDFNVGNzTUM0Mk1EY2dPQzR3T0RNc09TNHpOVFFnTVRrdU56QTNMREUyTGpNeUlFd2dPQzQ0T0RNc09ESXVOak15SUVNZ09DNDJPVFVzT0RJdU9ESWdPQzQxT1N3NE15NHdOek1nT0M0MU9TdzRNeTR6TXprZ1l5QXdMREF1TWpZMklEQXVNVEExTERBdU5USWdNQzR5T1RNc01DNDNNRGNnYkNBM0xqQTNNU3czTGpBM0lHTWdNQzR4T1RVc01DNHhPVFVnTUM0ME5URXNNQzR5T1RNZ01DNDNNRGNzTUM0eU9UTWdNQzR5TlRZc01DQXdMalV4TWl3dE1DNHdPVGdnTUM0M01EY3NMVEF1TWpreklHd2dOek11TnpVc0xUY3pMamMxSUdNZ01DNHhPRGNzTFRBdU1UZzJJREF1TWprekxDMHdMalEwSURBdU1qa3pMQzB3TGpjd05pQjZJRTBnTVRBdU5qSTRMRFV3SUVNZ01UUXVNalU1TERRMkxqSTBPU0F5TWk0MU1qWXNNemd1TlRjeElETXpMakU1TlN3ek15NDVOemtnTXpFdU1URTBMRE0zTGpFME5TQXlPUzQ0T1RRc05EQXVPVEk0SURJNUxqZzVOQ3cwTlNCaklEQXNOQzQyTmpVZ01TNDJNREVzT0M0NU5EVWdOQzR5Tnl3eE1pNHpOVEVnVENBeU9DNHdOQ3cyTXk0ME56VWdReUF4T1M0NE9EZ3NOVGd1T1RVMUlERXpMalkwT1N3MU15NHhNaUF4TUM0Mk1qZ3NOVEFnZWlJTkNpQWdJR2xrUFNKd1lYUm9PU0lOQ2lBZ0lITjBlV3hsUFNKbWFXeHNPaU5HUmtaR1JrWWlJQzgrRFFvOEwyYytEUW84TDNOMlp6NE5DZz09KTtiYWNrZ3JvdW5kLWNvbG9yOnJlZH0uZW1vdGUtbWVudSAuZW1vdGUtbWVudS1zdGFycmVkIC5lZGl0LXN0YXJyZWR7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQRDk0Yld3Z2RtVnljMmx2YmowaU1TNHdJaUJsYm1OdlpHbHVaejBpVlZSR0xUZ2lJSE4wWVc1a1lXeHZibVU5SW01dklqOCtEUW84SVMwdElFTnlaV0YwWldRZ2QybDBhQ0JKYm10elkyRndaU0FvYUhSMGNEb3ZMM2QzZHk1cGJtdHpZMkZ3WlM1dmNtY3ZLU0F0TFQ0TkNnMEtQSE4yWncwS0lDQWdlRzFzYm5NNlpHTTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlsYkdWdFpXNTBjeTh4TGpFdklnMEtJQ0FnZUcxc2JuTTZZMk05SW1oMGRIQTZMeTlqY21WaGRHbDJaV052YlcxdmJuTXViM0puTDI1ekl5SU5DaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJTkNpQWdJSGh0Ykc1ek9uTjJaejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpRFFvZ0lDQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaURRb2dJQ0IyWlhKemFXOXVQU0l4TGpFaURRb2dJQ0IzYVdSMGFEMGlOVEFpRFFvZ0lDQm9aV2xuYUhROUlqVXdJZzBLSUNBZ2RtbGxkMEp2ZUQwaU1DQXdJRFV3SURVd0lnMEtJQ0FnYVdROUlreGhlV1Z5WHpFaURRb2dJQ0I0Yld3NmMzQmhZMlU5SW5CeVpYTmxjblpsSWo0OGJXVjBZV1JoZEdFTkNpQWdJR2xrUFNKdFpYUmhaR0YwWVRNd01ERWlQanh5WkdZNlVrUkdQanhqWXpwWGIzSnJEUW9nSUNBZ0lDQWdjbVJtT21GaWIzVjBQU0lpUGp4a1l6cG1iM0p0WVhRK2FXMWhaMlV2YzNabkszaHRiRHd2WkdNNlptOXliV0YwUGp4a1l6cDBlWEJsRFFvZ0lDQWdJQ0FnSUNCeVpHWTZjbVZ6YjNWeVkyVTlJbWgwZEhBNkx5OXdkWEpzTG05eVp5OWtZeTlrWTIxcGRIbHdaUzlUZEdsc2JFbHRZV2RsSWlBdlBqeGtZenAwYVhSc1pUNDhMMlJqT25ScGRHeGxQand2WTJNNlYyOXlhejQ4TDNKa1pqcFNSRVkrUEM5dFpYUmhaR0YwWVQ0OFpHVm1jdzBLSUNBZ2FXUTlJbVJsWm5NeU9UazVJaUF2UGcwS1BIQmhkR2dOQ2lBZ0lHUTlJbTBnTkRNdU1EUXNNakl1TmprMklDMDNMalUyT0N3M0xqTTNOeUF4TGpjNE55d3hNQzQwTVRjZ1l5QXdMakV5Tnl3d0xqYzFJQzB3TGpFNE1pd3hMalV3T1NBdE1DNDNPVGNzTVM0NU5UY2dMVEF1TXpRNExEQXVNalV6SUMwd0xqYzJNaXd3TGpNNE1pQXRNUzR4TnpZc01DNHpPRElnTFRBdU16RTRMREFnTFRBdU5qTTRMQzB3TGpBM05pQXRNQzQ1TXpFc0xUQXVNak1nVENBeU5Td3pOeTQyT0RFZ01UVXVOalExTERReUxqVTVPU0JqSUMwd0xqWTNOQ3d3TGpNMU5TQXRNUzQwT1N3d0xqSTVOU0F0TWk0eE1EY3NMVEF1TVRVeElFTWdNVEl1T1RJekxEUXlJREV5TGpZeE5DdzBNUzR5TkRJZ01USXVOelF6TERRd0xqUTVNU0JNSURFMExqVXpMRE13TGpBM05DQTJMamsyTWl3eU1pNDJPVGNnUXlBMkxqUXhOU3d5TWk0eE5qWWdOaTR5TWpFc01qRXVNemN4SURZdU5EVTBMREl3TGpZME55QTJMalk1TERFNUxqa3lNeUEzTGpNeE5Td3hPUzR6T1RZZ09DNHdOamtzTVRrdU1qZzJJR3dnTVRBdU5EVTVMQzB4TGpVeU1TQTBMalk0TEMwNUxqUTNPQ0JESURJekxqVTBNeXczTGpZd015QXlOQzR5TXprc055NHhOekVnTWpVc055NHhOekVnWXlBd0xqYzJNeXd3SURFdU5EVTJMREF1TkRNeUlERXVOemt6TERFdU1URTFJR3dnTkM0Mk56a3NPUzQwTnpnZ01UQXVORFl4TERFdU5USXhJR01nTUM0M05USXNNQzR4TURrZ01TNHpOemtzTUM0Mk16Y2dNUzQyTVRJc01TNHpOakVnTUM0eU16Y3NNQzQzTWpRZ01DNHdNemdzTVM0MU1Ua2dMVEF1TlRBMUxESXVNRFVnZWlJTkNpQWdJR2xrUFNKd1lYUm9Nams1TlNJTkNpQWdJSE4wZVd4bFBTSm1hV3hzT2lObVptTmpNREE3Wm1sc2JDMXZjR0ZqYVhSNU9qRWlJQzgrRFFvOEwzTjJaejROQ2c9PSl9LmVtb3RlLW1lbnUgLmVtb3RlLmVtb3RlLW1lbnUtc3RhcnJlZHtib3JkZXItY29sb3I6cmdiYSgyMDAsMjAwLDAsLjUpfS5lbW90ZS1tZW51IC5lbW90ZS5lbW90ZS1tZW51LWhpZGRlbntib3JkZXItY29sb3I6cmdiYSgyNTUsMCwwLC41KX0uZW1vdGUtbWVudSAjc3RhcnJlZC1lbW90ZXMtZ3JvdXAgLmVtb3RlOm5vdCguZW1vdGUtbWVudS1zdGFycmVkKSwuZW1vdGUtbWVudTpub3QoLmVkaXRpbmcpIC5lbW90ZS1tZW51LWhpZGRlbntkaXNwbGF5Om5vbmV9LmVtb3RlLW1lbnU6bm90KC5lZGl0aW5nKSAjc3RhcnJlZC1lbW90ZXMtZ3JvdXAgLmVtb3RlLW1lbnUtc3RhcnJlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnR9LmVtb3RlLW1lbnUgI3N0YXJyZWQtZW1vdGVzLWdyb3Vwe3RleHQtYWxpZ246Y2VudGVyO2NvbG9yOiM2NDY0NjR9LmVtb3RlLW1lbnUgI3N0YXJyZWQtZW1vdGVzLWdyb3VwOmVtcHR5OmJlZm9yZXtjb250ZW50OlxcXCJVc2UgdGhlIGVkaXQgbW9kZSB0byBzdGFyIGFuIGVtb3RlIVxcXCI7cG9zaXRpb246cmVsYXRpdmU7dG9wOjhweH0uZW1vdGUtbWVudSAuc2Nyb2xsYWJsZXtoZWlnaHQ6Y2FsYygxMDAlIC0gMTAxcHgpO292ZXJmbG93LXk6YXV0b30uZW1vdGUtbWVudSAuc3RpY2t5e3Bvc2l0aW9uOmFic29sdXRlO2JvdHRvbTowO3dpZHRoOjEwMCV9LmVtb3RlLW1lbnUgLmVtb3RlLW1lbnUtaW5uZXJ7cG9zaXRpb246cmVsYXRpdmU7bWF4LWhlaWdodDoxMDAlO2hlaWdodDoxMDAlfVwiKSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgICB2YXIgSG9nYW4gPSByZXF1aXJlKCdob2dhbi5qcy9saWIvdGVtcGxhdGUuanMnKTtcbiAgICB2YXIgdGVtcGxhdGVzID0ge307XG4gICAgdGVtcGxhdGVzWydlbW90ZSddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJlbW90ZVwiKTtpZih0LnModC5mKFwidGhpcmRQYXJ0eVwiLGMscCwxKSxjLHAsMCwzMiw0NCxcInt7IH19XCIpKXt0LnJzKGMscCxmdW5jdGlvbihjLHAsdCl7dC5iKFwiIHRoaXJkLXBhcnR5XCIpO30pO2MucG9wKCk7fWlmKCF0LnModC5mKFwiaXNWaXNpYmxlXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7dC5iKFwiIGVtb3RlLW1lbnUtaGlkZGVuXCIpO307aWYodC5zKHQuZihcImlzU3RhcnJlZFwiLGMscCwxKSxjLHAsMCwxMTksMTM4LFwie3sgfX1cIikpe3QucnMoYyxwLGZ1bmN0aW9uKGMscCx0KXt0LmIoXCIgZW1vdGUtbWVudS1zdGFycmVkXCIpO30pO2MucG9wKCk7fXQuYihcIlxcXCIgZGF0YS1lbW90ZT1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCIgdGl0bGU9XFxcIlwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTtpZih0LnModC5mKFwidGhpcmRQYXJ0eVwiLGMscCwxKSxjLHAsMCwyMDYsMjI5LFwie3sgfX1cIikpe3QucnMoYyxwLGZ1bmN0aW9uKGMscCx0KXt0LmIoXCIgKGZyb20gM3JkIHBhcnR5IGFkZG9uKVwiKTt9KTtjLnBvcCgpO310LmIoXCJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGltZyBzcmM9XFxcIlwiKTt0LmIodC50KHQuZihcInVybFwiLGMscCwwKSkpO3QuYihcIlxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJlZGl0LXRvb2wgZWRpdC1zdGFycmVkXFxcIiBkYXRhLXdoaWNoPVxcXCJcIik7dC5iKHQudih0LmYoXCJ0ZXh0XCIsYyxwLDApKSk7dC5iKFwiXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInRvZ2dsZS1zdGFycmVkXFxcIiB0aXRsZT1cXFwiU3Rhci91bnN0YXIgZW1vdGU6IFwiKTt0LmIodC52KHQuZihcInRleHRcIixjLHAsMCkpKTt0LmIoXCJcXFwiPjwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZWRpdC10b29sIGVkaXQtdmlzaWJpbGl0eVxcXCIgZGF0YS13aGljaD1cXFwiXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtdmlzaWJpbGl0eVxcXCIgdGl0bGU9XFxcIkhpZGUvc2hvdyBlbW90ZTogXCIpO3QuYih0LnYodC5mKFwidGV4dFwiLGMscCwwKSkpO3QuYihcIlxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVCdXR0b24nXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiPGJ1dHRvbiBjbGFzcz1cXFwiYnV0dG9uIGdseXBoLW9ubHkgZmxvYXQtbGVmdFxcXCIgdGl0bGU9XFxcIkVtb3RlIE1lbnVcXFwiIGlkPVxcXCJlbW90ZS1tZW51LWJ1dHRvblxcXCI+PC9idXR0b24+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snZW1vdGVHcm91cEhlYWRlciddID0gbmV3IEhvZ2FuLlRlbXBsYXRlKHtjb2RlOiBmdW5jdGlvbiAoYyxwLGkpIHsgdmFyIHQ9dGhpczt0LmIoaT1pfHxcIlwiKTt0LmIoXCI8ZGl2IGNsYXNzPVxcXCJncm91cC1oZWFkZXJcXFwiIGRhdGEtZW1vdGUtY2hhbm5lbD1cXFwiXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIlxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXItaW5mb1xcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxpbWcgc3JjPVxcXCJcIik7dC5iKHQudih0LmYoXCJiYWRnZVwiLGMscCwwKSkpO3QuYihcIlxcXCIgLz5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbERpc3BsYXlOYW1lXCIsYyxwLDApKSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcImVkaXQtdG9vbCBlZGl0LXZpc2liaWxpdHlcXFwiIGRhdGEtd2hpY2g9XFxcImNoYW5uZWwtXCIpO3QuYih0LnYodC5mKFwiY2hhbm5lbFwiLGMscCwwKSkpO3QuYihcIlxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtdmlzaWJpbGl0eVxcXCIgdGl0bGU9XFxcIkhpZGUvc2hvdyBhbGwgZW1vdGVzIGZvciBcIik7dC5iKHQudih0LmYoXCJjaGFubmVsXCIsYyxwLDApKSk7dC5iKFwiXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZW1vdGUtY29udGFpbmVyXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCI8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIpO3JldHVybiB0LmZsKCk7IH0scGFydGlhbHM6IHt9LCBzdWJzOiB7ICB9fSk7XG4gICAgdGVtcGxhdGVzWydtZW51J10gPSBuZXcgSG9nYW4uVGVtcGxhdGUoe2NvZGU6IGZ1bmN0aW9uIChjLHAsaSkgeyB2YXIgdD10aGlzO3QuYihpPWl8fFwiXCIpO3QuYihcIjxkaXYgY2xhc3M9XFxcImVtb3RlLW1lbnVcXFwiIGlkPVxcXCJlbW90ZS1tZW51LWZvci10d2l0Y2hcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PGRpdiBjbGFzcz1cXFwiZW1vdGUtbWVudS1pbm5lclxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcImRyYWdnYWJsZVxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDxkaXYgY2xhc3M9XFxcInNjcm9sbGFibGUgc2Nyb2xsYmFyLW1hY29zeFxcXCI+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFx0PGRpdiBjbGFzcz1cXFwiZ3JvdXAtY29udGFpbmVyXFxcIiBpZD1cXFwiYWxsLWVtb3Rlcy1ncm91cFxcXCI+PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHQ8ZGl2IGNsYXNzPVxcXCJzdGlja3lcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdDxkaXYgY2xhc3M9XFxcImdyb3VwLWhlYWRlciBzaW5nbGUtcm93XFxcIiBpZD1cXFwic3RhcnJlZC1lbW90ZXMtZ3JvdXBcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiaGVhZGVyLWluZm9cXFwiPkZhdm9yaXRlIEVtb3RlczwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGRpdiBjbGFzcz1cXFwiZW1vdGUtY29udGFpbmVyXFxcIj48L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHQ8L2Rpdj5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHQ8ZGl2IGNsYXNzPVxcXCJmb290ZXJcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGEgY2xhc3M9XFxcInB1bGwtbGVmdCBpY29uIGljb24taG9tZVxcXCIgaHJlZj1cXFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlc1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiIHRpdGxlPVxcXCJWaXNpdCB0aGUgaG9tZXBhZ2Ugd2hlcmUgeW91IGNhbiBkb25hdGUsIHBvc3QgYSByZXZpZXcsIG9yIGNvbnRhY3QgdGhlIGRldmVsb3BlclxcXCI+PC9hPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0XHRcdFx0PGEgY2xhc3M9XFxcInB1bGwtbGVmdCBpY29uIGljb24tZ2VhclxcXCIgZGF0YS1jb21tYW5kPVxcXCJ0b2dnbGUtZWRpdGluZ1xcXCIgdGl0bGU9XFxcIlRvZ2dsZSBlZGl0IG1vZGVcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHRcdDxhIGNsYXNzPVxcXCJwdWxsLXJpZ2h0IGljb24gaWNvbi1yZXNpemUtaGFuZGxlXFxcIiBkYXRhLWNvbW1hbmQ9XFxcInJlc2l6ZS1oYW5kbGVcXFwiPjwvYT5cXHJcIik7dC5iKFwiXFxuXCIgKyBpKTt0LmIoXCJcdFx0XHRcdDxhIGNsYXNzPVxcXCJwdWxsLXJpZ2h0IGljb24gaWNvbi1waW5cXFwiIGRhdGEtY29tbWFuZD1cXFwidG9nZ2xlLXBpbm5lZFxcXCIgdGl0bGU9XFxcIlBpbi91bnBpbiB0aGUgZW1vdGUgbWVudSB0byB0aGUgc2NyZWVuXFxcIj48L2E+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdFx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiXHRcdDwvZGl2PlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0PC9kaXY+XFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHRlbXBsYXRlc1snbmV3c01lc3NhZ2UnXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZSh7Y29kZTogZnVuY3Rpb24gKGMscCxpKSB7IHZhciB0PXRoaXM7dC5iKGk9aXx8XCJcIik7dC5iKFwiXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPGRpdiBjbGFzcz1cXFwidHdpdGNoLWNoYXQtZW1vdGVzLW5ld3NcXFwiPlxcclwiKTt0LmIoXCJcXG5cIiArIGkpO3QuYihcIlx0W1wiKTt0LmIodC52KHQuZihcInNjcmlwdE5hbWVcIixjLHAsMCkpKTt0LmIoXCJdIE5ld3M6IFwiKTt0LmIodC50KHQuZihcIm1lc3NhZ2VcIixjLHAsMCkpKTt0LmIoXCIgKDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtY29tbWFuZD1cXFwidHdpdGNoLWNoYXQtZW1vdGVzOmRpc21pc3MtbmV3c1xcXCIgZGF0YS1uZXdzLWlkPVxcXCJcIik7dC5iKHQudih0LmYoXCJpZFwiLGMscCwwKSkpO3QuYihcIlxcXCI+RGlzbWlzczwvYT4pXFxyXCIpO3QuYihcIlxcblwiICsgaSk7dC5iKFwiPC9kaXY+XFxyXCIpO3QuYihcIlxcblwiKTtyZXR1cm4gdC5mbCgpOyB9LHBhcnRpYWxzOiB7fSwgc3ViczogeyAgfX0pO1xuICAgIHJldHVybiB0ZW1wbGF0ZXM7XG59KSgpOyIsIi8qXG4gKiAgQ29weXJpZ2h0IDIwMTEgVHdpdHRlciwgSW5jLlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIEhvZ2FuID0ge307XG5cbihmdW5jdGlvbiAoSG9nYW4pIHtcbiAgSG9nYW4uVGVtcGxhdGUgPSBmdW5jdGlvbiAoY29kZU9iaiwgdGV4dCwgY29tcGlsZXIsIG9wdGlvbnMpIHtcbiAgICBjb2RlT2JqID0gY29kZU9iaiB8fCB7fTtcbiAgICB0aGlzLnIgPSBjb2RlT2JqLmNvZGUgfHwgdGhpcy5yO1xuICAgIHRoaXMuYyA9IGNvbXBpbGVyO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy50ZXh0ID0gdGV4dCB8fCAnJztcbiAgICB0aGlzLnBhcnRpYWxzID0gY29kZU9iai5wYXJ0aWFscyB8fCB7fTtcbiAgICB0aGlzLnN1YnMgPSBjb2RlT2JqLnN1YnMgfHwge307XG4gICAgdGhpcy5idWYgPSAnJztcbiAgfVxuXG4gIEhvZ2FuLlRlbXBsYXRlLnByb3RvdHlwZSA9IHtcbiAgICAvLyByZW5kZXI6IHJlcGxhY2VkIGJ5IGdlbmVyYXRlZCBjb2RlLlxuICAgIHI6IGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7IHJldHVybiAnJzsgfSxcblxuICAgIC8vIHZhcmlhYmxlIGVzY2FwaW5nXG4gICAgdjogaG9nYW5Fc2NhcGUsXG5cbiAgICAvLyB0cmlwbGUgc3RhY2hlXG4gICAgdDogY29lcmNlVG9TdHJpbmcsXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5yaShbY29udGV4dF0sIHBhcnRpYWxzIHx8IHt9LCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgaW50ZXJuYWwgLS0gYSBob29rIGZvciBvdmVycmlkZXMgdGhhdCBjYXRjaGVzIHBhcnRpYWxzIHRvb1xuICAgIHJpOiBmdW5jdGlvbiAoY29udGV4dCwgcGFydGlhbHMsIGluZGVudCkge1xuICAgICAgcmV0dXJuIHRoaXMucihjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KTtcbiAgICB9LFxuXG4gICAgLy8gZW5zdXJlUGFydGlhbFxuICAgIGVwOiBmdW5jdGlvbihzeW1ib2wsIHBhcnRpYWxzKSB7XG4gICAgICB2YXIgcGFydGlhbCA9IHRoaXMucGFydGlhbHNbc3ltYm9sXTtcblxuICAgICAgLy8gY2hlY2sgdG8gc2VlIHRoYXQgaWYgd2UndmUgaW5zdGFudGlhdGVkIHRoaXMgcGFydGlhbCBiZWZvcmVcbiAgICAgIHZhciB0ZW1wbGF0ZSA9IHBhcnRpYWxzW3BhcnRpYWwubmFtZV07XG4gICAgICBpZiAocGFydGlhbC5pbnN0YW5jZSAmJiBwYXJ0aWFsLmJhc2UgPT0gdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIHBhcnRpYWwuaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGVtcGxhdGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKCF0aGlzLmMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBjb21waWxlciBhdmFpbGFibGUuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRlbXBsYXRlID0gdGhpcy5jLmNvbXBpbGUodGVtcGxhdGUsIHRoaXMub3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHVzZSB0aGlzIHRvIGNoZWNrIHdoZXRoZXIgdGhlIHBhcnRpYWxzIGRpY3Rpb25hcnkgaGFzIGNoYW5nZWRcbiAgICAgIHRoaXMucGFydGlhbHNbc3ltYm9sXS5iYXNlID0gdGVtcGxhdGU7XG5cbiAgICAgIGlmIChwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGNvbnNpZGVyIHBhcmVudCB0ZW1wbGF0ZSBub3dcbiAgICAgICAgaWYgKCFwYXJ0aWFscy5zdGFja1RleHQpIHBhcnRpYWxzLnN0YWNrVGV4dCA9IHt9O1xuICAgICAgICBmb3IgKGtleSBpbiBwYXJ0aWFsLnN1YnMpIHtcbiAgICAgICAgICBpZiAoIXBhcnRpYWxzLnN0YWNrVGV4dFtrZXldKSB7XG4gICAgICAgICAgICBwYXJ0aWFscy5zdGFja1RleHRba2V5XSA9ICh0aGlzLmFjdGl2ZVN1YiAhPT0gdW5kZWZpbmVkICYmIHBhcnRpYWxzLnN0YWNrVGV4dFt0aGlzLmFjdGl2ZVN1Yl0pID8gcGFydGlhbHMuc3RhY2tUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGVtcGxhdGUgPSBjcmVhdGVTcGVjaWFsaXplZFBhcnRpYWwodGVtcGxhdGUsIHBhcnRpYWwuc3VicywgcGFydGlhbC5wYXJ0aWFscyxcbiAgICAgICAgICB0aGlzLnN0YWNrU3VicywgdGhpcy5zdGFja1BhcnRpYWxzLCBwYXJ0aWFscy5zdGFja1RleHQpO1xuICAgICAgfVxuICAgICAgdGhpcy5wYXJ0aWFsc1tzeW1ib2xdLmluc3RhbmNlID0gdGVtcGxhdGU7XG5cbiAgICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgICB9LFxuXG4gICAgLy8gdHJpZXMgdG8gZmluZCBhIHBhcnRpYWwgaW4gdGhlIGN1cnJlbnQgc2NvcGUgYW5kIHJlbmRlciBpdFxuICAgIHJwOiBmdW5jdGlvbihzeW1ib2wsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBwYXJ0aWFsID0gdGhpcy5lcChzeW1ib2wsIHBhcnRpYWxzKTtcbiAgICAgIGlmICghcGFydGlhbCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXJ0aWFsLnJpKGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpO1xuICAgIH0sXG5cbiAgICAvLyByZW5kZXIgYSBzZWN0aW9uXG4gICAgcnM6IGZ1bmN0aW9uKGNvbnRleHQsIHBhcnRpYWxzLCBzZWN0aW9uKSB7XG4gICAgICB2YXIgdGFpbCA9IGNvbnRleHRbY29udGV4dC5sZW5ndGggLSAxXTtcblxuICAgICAgaWYgKCFpc0FycmF5KHRhaWwpKSB7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGFpbC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb250ZXh0LnB1c2godGFpbFtpXSk7XG4gICAgICAgIHNlY3Rpb24oY29udGV4dCwgcGFydGlhbHMsIHRoaXMpO1xuICAgICAgICBjb250ZXh0LnBvcCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBtYXliZSBzdGFydCBhIHNlY3Rpb25cbiAgICBzOiBmdW5jdGlvbih2YWwsIGN0eCwgcGFydGlhbHMsIGludmVydGVkLCBzdGFydCwgZW5kLCB0YWdzKSB7XG4gICAgICB2YXIgcGFzcztcblxuICAgICAgaWYgKGlzQXJyYXkodmFsKSAmJiB2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB2YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSB0aGlzLm1zKHZhbCwgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpO1xuICAgICAgfVxuXG4gICAgICBwYXNzID0gISF2YWw7XG5cbiAgICAgIGlmICghaW52ZXJ0ZWQgJiYgcGFzcyAmJiBjdHgpIHtcbiAgICAgICAgY3R4LnB1c2goKHR5cGVvZiB2YWwgPT0gJ29iamVjdCcpID8gdmFsIDogY3R4W2N0eC5sZW5ndGggLSAxXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXNzO1xuICAgIH0sXG5cbiAgICAvLyBmaW5kIHZhbHVlcyB3aXRoIGRvdHRlZCBuYW1lc1xuICAgIGQ6IGZ1bmN0aW9uKGtleSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpIHtcbiAgICAgIHZhciBmb3VuZCxcbiAgICAgICAgICBuYW1lcyA9IGtleS5zcGxpdCgnLicpLFxuICAgICAgICAgIHZhbCA9IHRoaXMuZihuYW1lc1swXSwgY3R4LCBwYXJ0aWFscywgcmV0dXJuRm91bmQpLFxuICAgICAgICAgIGRvTW9kZWxHZXQgPSB0aGlzLm9wdGlvbnMubW9kZWxHZXQsXG4gICAgICAgICAgY3ggPSBudWxsO1xuXG4gICAgICBpZiAoa2V5ID09PSAnLicgJiYgaXNBcnJheShjdHhbY3R4Lmxlbmd0aCAtIDJdKSkge1xuICAgICAgICB2YWwgPSBjdHhbY3R4Lmxlbmd0aCAtIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZvdW5kID0gZmluZEluU2NvcGUobmFtZXNbaV0sIHZhbCwgZG9Nb2RlbEdldCk7XG4gICAgICAgICAgaWYgKGZvdW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGN4ID0gdmFsO1xuICAgICAgICAgICAgdmFsID0gZm91bmQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbCA9ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmV0dXJuRm91bmQgJiYgIXZhbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghcmV0dXJuRm91bmQgJiYgdHlwZW9mIHZhbCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGN0eC5wdXNoKGN4KTtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgICBjdHgucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfSxcblxuICAgIC8vIGZpbmQgdmFsdWVzIHdpdGggbm9ybWFsIG5hbWVzXG4gICAgZjogZnVuY3Rpb24oa2V5LCBjdHgsIHBhcnRpYWxzLCByZXR1cm5Gb3VuZCkge1xuICAgICAgdmFyIHZhbCA9IGZhbHNlLFxuICAgICAgICAgIHYgPSBudWxsLFxuICAgICAgICAgIGZvdW5kID0gZmFsc2UsXG4gICAgICAgICAgZG9Nb2RlbEdldCA9IHRoaXMub3B0aW9ucy5tb2RlbEdldDtcblxuICAgICAgZm9yICh2YXIgaSA9IGN0eC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICB2ID0gY3R4W2ldO1xuICAgICAgICB2YWwgPSBmaW5kSW5TY29wZShrZXksIHYsIGRvTW9kZWxHZXQpO1xuICAgICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICByZXR1cm4gKHJldHVybkZvdW5kKSA/IGZhbHNlIDogXCJcIjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZXR1cm5Gb3VuZCAmJiB0eXBlb2YgdmFsID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsID0gdGhpcy5tdih2YWwsIGN0eCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sXG5cbiAgICAvLyBoaWdoZXIgb3JkZXIgdGVtcGxhdGVzXG4gICAgbHM6IGZ1bmN0aW9uKGZ1bmMsIGN4LCBwYXJ0aWFscywgdGV4dCwgdGFncykge1xuICAgICAgdmFyIG9sZFRhZ3MgPSB0aGlzLm9wdGlvbnMuZGVsaW1pdGVycztcblxuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSB0YWdzO1xuICAgICAgdGhpcy5iKHRoaXMuY3QoY29lcmNlVG9TdHJpbmcoZnVuYy5jYWxsKGN4LCB0ZXh0KSksIGN4LCBwYXJ0aWFscykpO1xuICAgICAgdGhpcy5vcHRpb25zLmRlbGltaXRlcnMgPSBvbGRUYWdzO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8vIGNvbXBpbGUgdGV4dFxuICAgIGN0OiBmdW5jdGlvbih0ZXh0LCBjeCwgcGFydGlhbHMpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlzYWJsZUxhbWJkYSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xhbWJkYSBmZWF0dXJlcyBkaXNhYmxlZC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmMuY29tcGlsZSh0ZXh0LCB0aGlzLm9wdGlvbnMpLnJlbmRlcihjeCwgcGFydGlhbHMpO1xuICAgIH0sXG5cbiAgICAvLyB0ZW1wbGF0ZSByZXN1bHQgYnVmZmVyaW5nXG4gICAgYjogZnVuY3Rpb24ocykgeyB0aGlzLmJ1ZiArPSBzOyB9LFxuXG4gICAgZmw6IGZ1bmN0aW9uKCkgeyB2YXIgciA9IHRoaXMuYnVmOyB0aGlzLmJ1ZiA9ICcnOyByZXR1cm4gcjsgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHNlY3Rpb25cbiAgICBtczogZnVuY3Rpb24oZnVuYywgY3R4LCBwYXJ0aWFscywgaW52ZXJ0ZWQsIHN0YXJ0LCBlbmQsIHRhZ3MpIHtcbiAgICAgIHZhciB0ZXh0U291cmNlLFxuICAgICAgICAgIGN4ID0gY3R4W2N0eC5sZW5ndGggLSAxXSxcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmNhbGwoY3gpO1xuXG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGlmIChpbnZlcnRlZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRleHRTb3VyY2UgPSAodGhpcy5hY3RpdmVTdWIgJiYgdGhpcy5zdWJzVGV4dCAmJiB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSkgPyB0aGlzLnN1YnNUZXh0W3RoaXMuYWN0aXZlU3ViXSA6IHRoaXMudGV4dDtcbiAgICAgICAgICByZXR1cm4gdGhpcy5scyhyZXN1bHQsIGN4LCBwYXJ0aWFscywgdGV4dFNvdXJjZS5zdWJzdHJpbmcoc3RhcnQsIGVuZCksIHRhZ3MpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8vIG1ldGhvZCByZXBsYWNlIHZhcmlhYmxlXG4gICAgbXY6IGZ1bmN0aW9uKGZ1bmMsIGN0eCwgcGFydGlhbHMpIHtcbiAgICAgIHZhciBjeCA9IGN0eFtjdHgubGVuZ3RoIC0gMV07XG4gICAgICB2YXIgcmVzdWx0ID0gZnVuYy5jYWxsKGN4KTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gdGhpcy5jdChjb2VyY2VUb1N0cmluZyhyZXN1bHQuY2FsbChjeCkpLCBjeCwgcGFydGlhbHMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICBzdWI6IGZ1bmN0aW9uKG5hbWUsIGNvbnRleHQsIHBhcnRpYWxzLCBpbmRlbnQpIHtcbiAgICAgIHZhciBmID0gdGhpcy5zdWJzW25hbWVdO1xuICAgICAgaWYgKGYpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVTdWIgPSBuYW1lO1xuICAgICAgICBmKGNvbnRleHQsIHBhcnRpYWxzLCB0aGlzLCBpbmRlbnQpO1xuICAgICAgICB0aGlzLmFjdGl2ZVN1YiA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICB9O1xuXG4gIC8vRmluZCBhIGtleSBpbiBhbiBvYmplY3RcbiAgZnVuY3Rpb24gZmluZEluU2NvcGUoa2V5LCBzY29wZSwgZG9Nb2RlbEdldCkge1xuICAgIHZhciB2YWw7XG5cbiAgICBpZiAoc2NvcGUgJiYgdHlwZW9mIHNjb3BlID09ICdvYmplY3QnKSB7XG5cbiAgICAgIGlmIChzY29wZVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFsID0gc2NvcGVba2V5XTtcblxuICAgICAgLy8gdHJ5IGxvb2t1cCB3aXRoIGdldCBmb3IgYmFja2JvbmUgb3Igc2ltaWxhciBtb2RlbCBkYXRhXG4gICAgICB9IGVsc2UgaWYgKGRvTW9kZWxHZXQgJiYgc2NvcGUuZ2V0ICYmIHR5cGVvZiBzY29wZS5nZXQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWwgPSBzY29wZS5nZXQoa2V5KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3BlY2lhbGl6ZWRQYXJ0aWFsKGluc3RhbmNlLCBzdWJzLCBwYXJ0aWFscywgc3RhY2tTdWJzLCBzdGFja1BhcnRpYWxzLCBzdGFja1RleHQpIHtcbiAgICBmdW5jdGlvbiBQYXJ0aWFsVGVtcGxhdGUoKSB7fTtcbiAgICBQYXJ0aWFsVGVtcGxhdGUucHJvdG90eXBlID0gaW5zdGFuY2U7XG4gICAgZnVuY3Rpb24gU3Vic3RpdHV0aW9ucygpIHt9O1xuICAgIFN1YnN0aXR1dGlvbnMucHJvdG90eXBlID0gaW5zdGFuY2Uuc3VicztcbiAgICB2YXIga2V5O1xuICAgIHZhciBwYXJ0aWFsID0gbmV3IFBhcnRpYWxUZW1wbGF0ZSgpO1xuICAgIHBhcnRpYWwuc3VicyA9IG5ldyBTdWJzdGl0dXRpb25zKCk7XG4gICAgcGFydGlhbC5zdWJzVGV4dCA9IHt9OyAgLy9oZWhlLiBzdWJzdGV4dC5cbiAgICBwYXJ0aWFsLmJ1ZiA9ICcnO1xuXG4gICAgc3RhY2tTdWJzID0gc3RhY2tTdWJzIHx8IHt9O1xuICAgIHBhcnRpYWwuc3RhY2tTdWJzID0gc3RhY2tTdWJzO1xuICAgIHBhcnRpYWwuc3Vic1RleHQgPSBzdGFja1RleHQ7XG4gICAgZm9yIChrZXkgaW4gc3Vicykge1xuICAgICAgaWYgKCFzdGFja1N1YnNba2V5XSkgc3RhY2tTdWJzW2tleV0gPSBzdWJzW2tleV07XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHN0YWNrU3Vicykge1xuICAgICAgcGFydGlhbC5zdWJzW2tleV0gPSBzdGFja1N1YnNba2V5XTtcbiAgICB9XG5cbiAgICBzdGFja1BhcnRpYWxzID0gc3RhY2tQYXJ0aWFscyB8fCB7fTtcbiAgICBwYXJ0aWFsLnN0YWNrUGFydGlhbHMgPSBzdGFja1BhcnRpYWxzO1xuICAgIGZvciAoa2V5IGluIHBhcnRpYWxzKSB7XG4gICAgICBpZiAoIXN0YWNrUGFydGlhbHNba2V5XSkgc3RhY2tQYXJ0aWFsc1trZXldID0gcGFydGlhbHNba2V5XTtcbiAgICB9XG4gICAgZm9yIChrZXkgaW4gc3RhY2tQYXJ0aWFscykge1xuICAgICAgcGFydGlhbC5wYXJ0aWFsc1trZXldID0gc3RhY2tQYXJ0aWFsc1trZXldO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJ0aWFsO1xuICB9XG5cbiAgdmFyIHJBbXAgPSAvJi9nLFxuICAgICAgckx0ID0gLzwvZyxcbiAgICAgIHJHdCA9IC8+L2csXG4gICAgICByQXBvcyA9IC9cXCcvZyxcbiAgICAgIHJRdW90ID0gL1xcXCIvZyxcbiAgICAgIGhDaGFycyA9IC9bJjw+XFxcIlxcJ10vO1xuXG4gIGZ1bmN0aW9uIGNvZXJjZVRvU3RyaW5nKHZhbCkge1xuICAgIHJldHVybiBTdHJpbmcoKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkgPyAnJyA6IHZhbCk7XG4gIH1cblxuICBmdW5jdGlvbiBob2dhbkVzY2FwZShzdHIpIHtcbiAgICBzdHIgPSBjb2VyY2VUb1N0cmluZyhzdHIpO1xuICAgIHJldHVybiBoQ2hhcnMudGVzdChzdHIpID9cbiAgICAgIHN0clxuICAgICAgICAucmVwbGFjZShyQW1wLCAnJmFtcDsnKVxuICAgICAgICAucmVwbGFjZShyTHQsICcmbHQ7JylcbiAgICAgICAgLnJlcGxhY2Uockd0LCAnJmd0OycpXG4gICAgICAgIC5yZXBsYWNlKHJBcG9zLCAnJiMzOTsnKVxuICAgICAgICAucmVwbGFjZShyUXVvdCwgJyZxdW90OycpIDpcbiAgICAgIHN0cjtcbiAgfVxuXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihhKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxufSkodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnID8gZXhwb3J0cyA6IEhvZ2FuKTtcbiIsIi8qKlxyXG4gKiBqUXVlcnkgQ1NTIEN1c3RvbWl6YWJsZSBTY3JvbGxiYXJcclxuICpcclxuICogQ29weXJpZ2h0IDIwMTQsIFl1cml5IEtoYWJhcm92XHJcbiAqIER1YWwgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBvciBHUEwgVmVyc2lvbiAyIGxpY2Vuc2VzLlxyXG4gKlxyXG4gKiBJZiB5b3UgZm91bmQgYnVnLCBwbGVhc2UgY29udGFjdCBtZSB2aWEgZW1haWwgPDEzcmVhbDAwOEBnbWFpbC5jb20+XHJcbiAqXHJcbiAqIEBhdXRob3IgWXVyaXkgS2hhYmFyb3YgYWthIEdyb21vXHJcbiAqIEB2ZXJzaW9uIDAuMi42XHJcbiAqIEB1cmwgaHR0cHM6Ly9naXRodWIuY29tL2dyb21vL2pxdWVyeS5zY3JvbGxiYXIvXHJcbiAqXHJcbiAqL1xyXG4oZnVuY3Rpb24oZSx0LG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGgodCl7aWYoby53ZWJraXQmJiF0KXtyZXR1cm57aGVpZ2h0OjAsd2lkdGg6MH19aWYoIW8uZGF0YS5vdXRlcil7dmFyIG49e2JvcmRlcjpcIm5vbmVcIixcImJveC1zaXppbmdcIjpcImNvbnRlbnQtYm94XCIsaGVpZ2h0OlwiMjAwcHhcIixtYXJnaW46XCIwXCIscGFkZGluZzpcIjBcIix3aWR0aDpcIjIwMHB4XCJ9O28uZGF0YS5pbm5lcj1lKFwiPGRpdj5cIikuY3NzKGUuZXh0ZW5kKHt9LG4pKTtvLmRhdGEub3V0ZXI9ZShcIjxkaXY+XCIpLmNzcyhlLmV4dGVuZCh7bGVmdDpcIi0xMDAwcHhcIixvdmVyZmxvdzpcInNjcm9sbFwiLHBvc2l0aW9uOlwiYWJzb2x1dGVcIix0b3A6XCItMTAwMHB4XCJ9LG4pKS5hcHBlbmQoby5kYXRhLmlubmVyKS5hcHBlbmRUbyhcImJvZHlcIil9by5kYXRhLm91dGVyLnNjcm9sbExlZnQoMWUzKS5zY3JvbGxUb3AoMWUzKTtyZXR1cm57aGVpZ2h0Ok1hdGguY2VpbChvLmRhdGEub3V0ZXIub2Zmc2V0KCkudG9wLW8uZGF0YS5pbm5lci5vZmZzZXQoKS50b3B8fDApLHdpZHRoOk1hdGguY2VpbChvLmRhdGEub3V0ZXIub2Zmc2V0KCkubGVmdC1vLmRhdGEuaW5uZXIub2Zmc2V0KCkubGVmdHx8MCl9fWZ1bmN0aW9uIHAobixyKXtlKHQpLm9uKHtcImJsdXIuc2Nyb2xsYmFyXCI6ZnVuY3Rpb24oKXtlKHQpLmFkZChcImJvZHlcIikub2ZmKFwiLnNjcm9sbGJhclwiKTtuJiZuKCl9LFwiZHJhZ3N0YXJ0LnNjcm9sbGJhclwiOmZ1bmN0aW9uKGUpe2UucHJldmVudERlZmF1bHQoKTtyZXR1cm4gZmFsc2V9LFwibW91c2V1cC5zY3JvbGxiYXJcIjpmdW5jdGlvbigpe2UodCkuYWRkKFwiYm9keVwiKS5vZmYoXCIuc2Nyb2xsYmFyXCIpO24mJm4oKX19KTtlKFwiYm9keVwiKS5vbih7XCJzZWxlY3RzdGFydC5zY3JvbGxiYXJcIjpmdW5jdGlvbihlKXtlLnByZXZlbnREZWZhdWx0KCk7cmV0dXJuIGZhbHNlfX0pO3ImJnIucHJldmVudERlZmF1bHQoKTtyZXR1cm4gZmFsc2V9ZnVuY3Rpb24gZCgpe3ZhciBlPWgodHJ1ZSk7cmV0dXJuIShlLmhlaWdodHx8ZS53aWR0aCl9ZnVuY3Rpb24gdihlKXt2YXIgdD1lLm9yaWdpbmFsRXZlbnQ7aWYodC5heGlzJiZ0LmF4aXM9PT10LkhPUklaT05UQUxfQVhJUylyZXR1cm4gZmFsc2U7aWYodC53aGVlbERlbHRhWClyZXR1cm4gZmFsc2U7cmV0dXJuIHRydWV9dmFyIHI9ZmFsc2U7dmFyIGk9MSxzPVwicHhcIjt2YXIgbz17ZGF0YTp7fSxtYWNvc3g6bi5uYXZpZ2F0b3IucGxhdGZvcm0udG9Mb3dlckNhc2UoKS5pbmRleE9mKFwibWFjXCIpIT09LTEsbW9iaWxlOi9BbmRyb2lkfHdlYk9TfGlQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeS9pLnRlc3Qobi5uYXZpZ2F0b3IudXNlckFnZW50KSxvdmVybGF5Om51bGwsc2Nyb2xsOm51bGwsc2Nyb2xsczpbXSx3ZWJraXQ6L1dlYktpdC8udGVzdChuLm5hdmlnYXRvci51c2VyQWdlbnQpLGxvZzpyP2Z1bmN0aW9uKHQscil7dmFyIGk9dDtpZihyJiZ0eXBlb2YgdCE9XCJzdHJpbmdcIil7aT1bXTtlLmVhY2godCxmdW5jdGlvbihlLHQpe2kucHVzaCgnXCInK2UrJ1wiOiAnK3QpfSk7aT1pLmpvaW4oXCIsIFwiKX1pZihuLmNvbnNvbGUmJm4uY29uc29sZS5sb2cpe24uY29uc29sZS5sb2coaSl9ZWxzZXthbGVydChpKX19OmZ1bmN0aW9uKCl7fX07dmFyIHU9e2F1dG9TY3JvbGxTaXplOnRydWUsYXV0b1VwZGF0ZTp0cnVlLGRlYnVnOmZhbHNlLGRpc2FibGVCb2R5U2Nyb2xsOmZhbHNlLGR1cmF0aW9uOjIwMCxpZ25vcmVNb2JpbGU6dHJ1ZSxpZ25vcmVPdmVybGF5OnRydWUsc2Nyb2xsU3RlcDozMCxzaG93QXJyb3dzOmZhbHNlLHN0ZXBTY3JvbGxpbmc6dHJ1ZSx0eXBlOlwic2ltcGxlXCIsc2Nyb2xseDpudWxsLHNjcm9sbHk6bnVsbCxvbkRlc3Ryb3k6bnVsbCxvbkluaXQ6bnVsbCxvblNjcm9sbDpudWxsLG9uVXBkYXRlOm51bGx9O3ZhciBhPWZ1bmN0aW9uKHQscil7aWYoIW8uc2Nyb2xsKXtvLmxvZyhcIkluaXQgalF1ZXJ5IFNjcm9sbGJhciB2MC4yLjZcIik7by5vdmVybGF5PWQoKTtvLnNjcm9sbD1oKCk7YygpO2UobikucmVzaXplKGZ1bmN0aW9uKCl7dmFyIGU9ZmFsc2U7aWYoby5zY3JvbGwmJihvLnNjcm9sbC5oZWlnaHR8fG8uc2Nyb2xsLndpZHRoKSl7dmFyIHQ9aCgpO2lmKHQuaGVpZ2h0IT1vLnNjcm9sbC5oZWlnaHR8fHQud2lkdGghPW8uc2Nyb2xsLndpZHRoKXtvLnNjcm9sbD10O2U9dHJ1ZX19YyhlKX0pfXRoaXMuY29udGFpbmVyPXQ7dGhpcy5vcHRpb25zPWUuZXh0ZW5kKHt9LHUsbi5qUXVlcnlTY3JvbGxiYXJPcHRpb25zfHx7fSk7dGhpcy5zY3JvbGxUbz1udWxsO3RoaXMuc2Nyb2xseD17fTt0aGlzLnNjcm9sbHk9e307dGhpcy5pbml0KHIpfTthLnByb3RvdHlwZT17ZGVzdHJveTpmdW5jdGlvbigpe2lmKCF0aGlzLndyYXBwZXIpe3JldHVybn12YXIgbj10aGlzLmNvbnRhaW5lci5zY3JvbGxMZWZ0KCk7dmFyIHI9dGhpcy5jb250YWluZXIuc2Nyb2xsVG9wKCk7dGhpcy5jb250YWluZXIuaW5zZXJ0QmVmb3JlKHRoaXMud3JhcHBlcikuY3NzKHtoZWlnaHQ6XCJcIixtYXJnaW46XCJcIn0pLnJlbW92ZUNsYXNzKFwic2Nyb2xsLWNvbnRlbnRcIikucmVtb3ZlQ2xhc3MoXCJzY3JvbGwtc2Nyb2xseF92aXNpYmxlXCIpLnJlbW92ZUNsYXNzKFwic2Nyb2xsLXNjcm9sbHlfdmlzaWJsZVwiKS5vZmYoXCIuc2Nyb2xsYmFyXCIpLnNjcm9sbExlZnQobikuc2Nyb2xsVG9wKHIpO3RoaXMuc2Nyb2xseC5zY3JvbGxiYXIucmVtb3ZlQ2xhc3MoXCJzY3JvbGwtc2Nyb2xseF92aXNpYmxlXCIpLmZpbmQoXCJkaXZcIikuYW5kU2VsZigpLm9mZihcIi5zY3JvbGxiYXJcIik7dGhpcy5zY3JvbGx5LnNjcm9sbGJhci5yZW1vdmVDbGFzcyhcInNjcm9sbC1zY3JvbGx5X3Zpc2libGVcIikuZmluZChcImRpdlwiKS5hbmRTZWxmKCkub2ZmKFwiLnNjcm9sbGJhclwiKTt0aGlzLndyYXBwZXIucmVtb3ZlKCk7ZSh0KS5hZGQoXCJib2R5XCIpLm9mZihcIi5zY3JvbGxiYXJcIik7aWYoZS5pc0Z1bmN0aW9uKHRoaXMub3B0aW9ucy5vbkRlc3Ryb3kpKXRoaXMub3B0aW9ucy5vbkRlc3Ryb3kuYXBwbHkodGhpcyxbdGhpcy5jb250YWluZXJdKX0sZ2V0U2Nyb2xsYmFyOmZ1bmN0aW9uKHQpe3ZhciBuPXRoaXMub3B0aW9uc1tcInNjcm9sbFwiK3RdO3ZhciByPXthZHZhbmNlZDonPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X2Nvcm5lclwiPjwvZGl2PicrJzxkaXYgY2xhc3M9XCJzY3JvbGwtYXJyb3cgc2Nyb2xsLWFycm93X2xlc3NcIj48L2Rpdj4nKyc8ZGl2IGNsYXNzPVwic2Nyb2xsLWFycm93IHNjcm9sbC1hcnJvd19tb3JlXCI+PC9kaXY+JysnPGRpdiBjbGFzcz1cInNjcm9sbC1lbGVtZW50X291dGVyXCI+JysnICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9zaXplXCI+PC9kaXY+JysnICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9pbm5lci13cmFwcGVyXCI+JysnICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfaW5uZXIgc2Nyb2xsLWVsZW1lbnRfdHJhY2tcIj4nKycgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfaW5uZXItYm90dG9tXCI+PC9kaXY+JytcIiAgICAgICAgPC9kaXY+XCIrXCIgICAgPC9kaXY+XCIrJyAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWJhclwiPicrJyAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJfYm9keVwiPicrJyAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtYmFyX2JvZHktaW5uZXJcIj48L2Rpdj4nK1wiICAgICAgICA8L2Rpdj5cIisnICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWJhcl9ib3R0b21cIj48L2Rpdj4nKycgICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtYmFyX2NlbnRlclwiPjwvZGl2PicrXCIgICAgPC9kaXY+XCIrXCI8L2Rpdj5cIixzaW1wbGU6JzxkaXYgY2xhc3M9XCJzY3JvbGwtZWxlbWVudF9vdXRlclwiPicrJyAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfc2l6ZVwiPjwvZGl2PicrJyAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsLWVsZW1lbnRfdHJhY2tcIj48L2Rpdj4nKycgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1iYXJcIj48L2Rpdj4nK1wiPC9kaXY+XCJ9O3ZhciBpPXJbdGhpcy5vcHRpb25zLnR5cGVdP3RoaXMub3B0aW9ucy50eXBlOlwiYWR2YW5jZWRcIjtpZihuKXtpZih0eXBlb2Ygbj09XCJzdHJpbmdcIil7bj1lKG4pLmFwcGVuZFRvKHRoaXMud3JhcHBlcil9ZWxzZXtuPWUobil9fWVsc2V7bj1lKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJzY3JvbGwtZWxlbWVudFwiKS5odG1sKHJbaV0pLmFwcGVuZFRvKHRoaXMud3JhcHBlcil9aWYodGhpcy5vcHRpb25zLnNob3dBcnJvd3Mpe24uYWRkQ2xhc3MoXCJzY3JvbGwtZWxlbWVudF9hcnJvd3NfdmlzaWJsZVwiKX1yZXR1cm4gbi5hZGRDbGFzcyhcInNjcm9sbC1cIit0KX0saW5pdDpmdW5jdGlvbihuKXt2YXIgcj10aGlzO3ZhciB1PXRoaXMuY29udGFpbmVyO3ZhciBhPXRoaXMuY29udGFpbmVyV3JhcHBlcnx8dTt2YXIgZj1lLmV4dGVuZCh0aGlzLm9wdGlvbnMsbnx8e30pO3ZhciBsPXt4OnRoaXMuc2Nyb2xseCx5OnRoaXMuc2Nyb2xseX07dmFyIGM9dGhpcy53cmFwcGVyO3ZhciBoPXtzY3JvbGxMZWZ0OnUuc2Nyb2xsTGVmdCgpLHNjcm9sbFRvcDp1LnNjcm9sbFRvcCgpfTtpZihvLm1vYmlsZSYmZi5pZ25vcmVNb2JpbGV8fG8ub3ZlcmxheSYmZi5pZ25vcmVPdmVybGF5fHxvLm1hY29zeCYmIW8ud2Via2l0KXtyZXR1cm4gZmFsc2V9aWYoIWMpe3RoaXMud3JhcHBlcj1jPWUoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcInNjcm9sbC13cmFwcGVyXCIpLmFkZENsYXNzKHUuYXR0cihcImNsYXNzXCIpKS5jc3MoXCJwb3NpdGlvblwiLHUuY3NzKFwicG9zaXRpb25cIik9PVwiYWJzb2x1dGVcIj9cImFic29sdXRlXCI6XCJyZWxhdGl2ZVwiKS5pbnNlcnRCZWZvcmUodSkuYXBwZW5kKHUpO2lmKHUuaXMoXCJ0ZXh0YXJlYVwiKSl7dGhpcy5jb250YWluZXJXcmFwcGVyPWE9ZShcIjxkaXY+XCIpLmluc2VydEJlZm9yZSh1KS5hcHBlbmQodSk7Yy5hZGRDbGFzcyhcInNjcm9sbC10ZXh0YXJlYVwiKX1hLmFkZENsYXNzKFwic2Nyb2xsLWNvbnRlbnRcIikuY3NzKHtoZWlnaHQ6XCJcIixcIm1hcmdpbi1ib3R0b21cIjpvLnNjcm9sbC5oZWlnaHQqLTErcyxcIm1hcmdpbi1yaWdodFwiOm8uc2Nyb2xsLndpZHRoKi0xK3N9KTt1Lm9uKFwic2Nyb2xsLnNjcm9sbGJhclwiLGZ1bmN0aW9uKHQpe2lmKGUuaXNGdW5jdGlvbihmLm9uU2Nyb2xsKSl7Zi5vblNjcm9sbC5jYWxsKHIse21heFNjcm9sbDpsLnkubWF4U2Nyb2xsT2Zmc2V0LHNjcm9sbDp1LnNjcm9sbFRvcCgpLHNpemU6bC55LnNpemUsdmlzaWJsZTpsLnkudmlzaWJsZX0se21heFNjcm9sbDpsLngubWF4U2Nyb2xsT2Zmc2V0LHNjcm9sbDp1LnNjcm9sbExlZnQoKSxzaXplOmwueC5zaXplLHZpc2libGU6bC54LnZpc2libGV9KX1sLnguaXNWaXNpYmxlJiZsLnguc2Nyb2xsZXIuY3NzKFwibGVmdFwiLHUuc2Nyb2xsTGVmdCgpKmwueC5reCtzKTtsLnkuaXNWaXNpYmxlJiZsLnkuc2Nyb2xsZXIuY3NzKFwidG9wXCIsdS5zY3JvbGxUb3AoKSpsLnkua3grcyl9KTtjLm9uKFwic2Nyb2xsXCIsZnVuY3Rpb24oKXtjLnNjcm9sbFRvcCgwKS5zY3JvbGxMZWZ0KDApfSk7aWYoZi5kaXNhYmxlQm9keVNjcm9sbCl7dmFyIGQ9ZnVuY3Rpb24oZSl7dihlKT9sLnkuaXNWaXNpYmxlJiZsLnkubW91c2V3aGVlbChlKTpsLnguaXNWaXNpYmxlJiZsLngubW91c2V3aGVlbChlKX07Yy5vbih7XCJNb3pNb3VzZVBpeGVsU2Nyb2xsLnNjcm9sbGJhclwiOmQsXCJtb3VzZXdoZWVsLnNjcm9sbGJhclwiOmR9KTtpZihvLm1vYmlsZSl7Yy5vbihcInRvdWNoc3RhcnQuc2Nyb2xsYmFyXCIsZnVuY3Rpb24obil7dmFyIHI9bi5vcmlnaW5hbEV2ZW50LnRvdWNoZXMmJm4ub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdfHxuO3ZhciBpPXtwYWdlWDpyLnBhZ2VYLHBhZ2VZOnIucGFnZVl9O3ZhciBzPXtsZWZ0OnUuc2Nyb2xsTGVmdCgpLHRvcDp1LnNjcm9sbFRvcCgpfTtlKHQpLm9uKHtcInRvdWNobW92ZS5zY3JvbGxiYXJcIjpmdW5jdGlvbihlKXt2YXIgdD1lLm9yaWdpbmFsRXZlbnQudGFyZ2V0VG91Y2hlcyYmZS5vcmlnaW5hbEV2ZW50LnRhcmdldFRvdWNoZXNbMF18fGU7dS5zY3JvbGxMZWZ0KHMubGVmdCtpLnBhZ2VYLXQucGFnZVgpO3Uuc2Nyb2xsVG9wKHMudG9wK2kucGFnZVktdC5wYWdlWSk7ZS5wcmV2ZW50RGVmYXVsdCgpfSxcInRvdWNoZW5kLnNjcm9sbGJhclwiOmZ1bmN0aW9uKCl7ZSh0KS5vZmYoXCIuc2Nyb2xsYmFyXCIpfX0pfSl9fWlmKGUuaXNGdW5jdGlvbihmLm9uSW5pdCkpZi5vbkluaXQuYXBwbHkodGhpcyxbdV0pfWVsc2V7YS5jc3Moe2hlaWdodDpcIlwiLFwibWFyZ2luLWJvdHRvbVwiOm8uc2Nyb2xsLmhlaWdodCotMStzLFwibWFyZ2luLXJpZ2h0XCI6by5zY3JvbGwud2lkdGgqLTErc30pfWUuZWFjaChsLGZ1bmN0aW9uKG4scyl7dmFyIG89bnVsbDt2YXIgYT0xO3ZhciBjPW49PVwieFwiP1wic2Nyb2xsTGVmdFwiOlwic2Nyb2xsVG9wXCI7dmFyIGg9Zi5zY3JvbGxTdGVwO3ZhciBkPWZ1bmN0aW9uKCl7dmFyIGU9dVtjXSgpO3VbY10oZStoKTtpZihhPT0xJiZlK2g+PW0pZT11W2NdKCk7aWYoYT09LTEmJmUraDw9bSllPXVbY10oKTtpZih1W2NdKCk9PWUmJm8pe28oKX19O3ZhciBtPTA7aWYoIXMuc2Nyb2xsYmFyKXtzLnNjcm9sbGJhcj1yLmdldFNjcm9sbGJhcihuKTtzLnNjcm9sbGVyPXMuc2Nyb2xsYmFyLmZpbmQoXCIuc2Nyb2xsLWJhclwiKTtzLm1vdXNld2hlZWw9ZnVuY3Rpb24oZSl7aWYoIXMuaXNWaXNpYmxlfHxuPT1cInhcIiYmdihlKSl7cmV0dXJuIHRydWV9aWYobj09XCJ5XCImJiF2KGUpKXtsLngubW91c2V3aGVlbChlKTtyZXR1cm4gdHJ1ZX12YXIgdD1lLm9yaWdpbmFsRXZlbnQud2hlZWxEZWx0YSotMXx8ZS5vcmlnaW5hbEV2ZW50LmRldGFpbDt2YXIgaT1zLnNpemUtcy52aXNpYmxlLXMub2Zmc2V0O2lmKCEobTw9MCYmdDwwfHxtPj1pJiZ0PjApKXttPW0rdDtpZihtPDApbT0wO2lmKG0+aSltPWk7ci5zY3JvbGxUbz1yLnNjcm9sbFRvfHx7fTtyLnNjcm9sbFRvW2NdPW07c2V0VGltZW91dChmdW5jdGlvbigpe2lmKHIuc2Nyb2xsVG8pe3Uuc3RvcCgpLmFuaW1hdGUoci5zY3JvbGxUbywyNDAsXCJsaW5lYXJcIixmdW5jdGlvbigpe209dVtjXSgpfSk7ci5zY3JvbGxUbz1udWxsfX0sMSl9ZS5wcmV2ZW50RGVmYXVsdCgpO3JldHVybiBmYWxzZX07cy5zY3JvbGxiYXIub24oe1wiTW96TW91c2VQaXhlbFNjcm9sbC5zY3JvbGxiYXJcIjpzLm1vdXNld2hlZWwsXCJtb3VzZXdoZWVsLnNjcm9sbGJhclwiOnMubW91c2V3aGVlbCxcIm1vdXNlZW50ZXIuc2Nyb2xsYmFyXCI6ZnVuY3Rpb24oKXttPXVbY10oKX19KTtzLnNjcm9sbGJhci5maW5kKFwiLnNjcm9sbC1hcnJvdywgLnNjcm9sbC1lbGVtZW50X3RyYWNrXCIpLm9uKFwibW91c2Vkb3duLnNjcm9sbGJhclwiLGZ1bmN0aW9uKHQpe2lmKHQud2hpY2ghPWkpcmV0dXJuIHRydWU7YT0xO3ZhciBsPXtldmVudE9mZnNldDp0W249PVwieFwiP1wicGFnZVhcIjpcInBhZ2VZXCJdLG1heFNjcm9sbFZhbHVlOnMuc2l6ZS1zLnZpc2libGUtcy5vZmZzZXQsc2Nyb2xsYmFyT2Zmc2V0OnMuc2Nyb2xsZXIub2Zmc2V0KClbbj09XCJ4XCI/XCJsZWZ0XCI6XCJ0b3BcIl0sc2Nyb2xsYmFyU2l6ZTpzLnNjcm9sbGVyW249PVwieFwiP1wib3V0ZXJXaWR0aFwiOlwib3V0ZXJIZWlnaHRcIl0oKX07dmFyIHY9MCxnPTA7aWYoZSh0aGlzKS5oYXNDbGFzcyhcInNjcm9sbC1hcnJvd1wiKSl7YT1lKHRoaXMpLmhhc0NsYXNzKFwic2Nyb2xsLWFycm93X21vcmVcIik/MTotMTtoPWYuc2Nyb2xsU3RlcCphO209YT4wP2wubWF4U2Nyb2xsVmFsdWU6MH1lbHNle2E9bC5ldmVudE9mZnNldD5sLnNjcm9sbGJhck9mZnNldCtsLnNjcm9sbGJhclNpemU/MTpsLmV2ZW50T2Zmc2V0PGwuc2Nyb2xsYmFyT2Zmc2V0Py0xOjA7aD1NYXRoLnJvdW5kKHMudmlzaWJsZSouNzUpKmE7bT1sLmV2ZW50T2Zmc2V0LWwuc2Nyb2xsYmFyT2Zmc2V0LShmLnN0ZXBTY3JvbGxpbmc/YT09MT9sLnNjcm9sbGJhclNpemU6MDpNYXRoLnJvdW5kKGwuc2Nyb2xsYmFyU2l6ZS8yKSk7bT11W2NdKCkrbS9zLmt4fXIuc2Nyb2xsVG89ci5zY3JvbGxUb3x8e307ci5zY3JvbGxUb1tjXT1mLnN0ZXBTY3JvbGxpbmc/dVtjXSgpK2g6bTtpZihmLnN0ZXBTY3JvbGxpbmcpe289ZnVuY3Rpb24oKXttPXVbY10oKTtjbGVhckludGVydmFsKGcpO2NsZWFyVGltZW91dCh2KTt2PTA7Zz0wfTt2PXNldFRpbWVvdXQoZnVuY3Rpb24oKXtnPXNldEludGVydmFsKGQsNDApfSxmLmR1cmF0aW9uKzEwMCl9c2V0VGltZW91dChmdW5jdGlvbigpe2lmKHIuc2Nyb2xsVG8pe3UuYW5pbWF0ZShyLnNjcm9sbFRvLGYuZHVyYXRpb24pO3Iuc2Nyb2xsVG89bnVsbH19LDEpO3JldHVybiBwKG8sdCl9KTtzLnNjcm9sbGVyLm9uKFwibW91c2Vkb3duLnNjcm9sbGJhclwiLGZ1bmN0aW9uKHIpe2lmKHIud2hpY2ghPWkpcmV0dXJuIHRydWU7dmFyIG89cltuPT1cInhcIj9cInBhZ2VYXCI6XCJwYWdlWVwiXTt2YXIgYT11W2NdKCk7cy5zY3JvbGxiYXIuYWRkQ2xhc3MoXCJzY3JvbGwtZHJhZ2dhYmxlXCIpO2UodCkub24oXCJtb3VzZW1vdmUuc2Nyb2xsYmFyXCIsZnVuY3Rpb24oZSl7dmFyIHQ9cGFyc2VJbnQoKGVbbj09XCJ4XCI/XCJwYWdlWFwiOlwicGFnZVlcIl0tbykvcy5reCwxMCk7dVtjXShhK3QpfSk7cmV0dXJuIHAoZnVuY3Rpb24oKXtzLnNjcm9sbGJhci5yZW1vdmVDbGFzcyhcInNjcm9sbC1kcmFnZ2FibGVcIik7bT11W2NdKCl9LHIpfSl9fSk7ZS5lYWNoKGwsZnVuY3Rpb24oZSx0KXt2YXIgbj1cInNjcm9sbC1zY3JvbGxcIitlK1wiX3Zpc2libGVcIjt2YXIgcj1lPT1cInhcIj9sLnk6bC54O3Quc2Nyb2xsYmFyLnJlbW92ZUNsYXNzKG4pO3Iuc2Nyb2xsYmFyLnJlbW92ZUNsYXNzKG4pO2EucmVtb3ZlQ2xhc3Mobil9KTtlLmVhY2gobCxmdW5jdGlvbih0LG4pe2UuZXh0ZW5kKG4sdD09XCJ4XCI/e29mZnNldDpwYXJzZUludCh1LmNzcyhcImxlZnRcIiksMTApfHwwLHNpemU6dS5wcm9wKFwic2Nyb2xsV2lkdGhcIiksdmlzaWJsZTpjLndpZHRoKCl9OntvZmZzZXQ6cGFyc2VJbnQodS5jc3MoXCJ0b3BcIiksMTApfHwwLHNpemU6dS5wcm9wKFwic2Nyb2xsSGVpZ2h0XCIpLHZpc2libGU6Yy5oZWlnaHQoKX0pfSk7dmFyIG09ZnVuY3Rpb24odCxuKXt2YXIgcj1cInNjcm9sbC1zY3JvbGxcIit0K1wiX3Zpc2libGVcIjt2YXIgaT10PT1cInhcIj9sLnk6bC54O3ZhciBmPXBhcnNlSW50KHUuY3NzKHQ9PVwieFwiP1wibGVmdFwiOlwidG9wXCIpLDEwKXx8MDt2YXIgaD1uLnNpemU7dmFyIHA9bi52aXNpYmxlK2Y7bi5pc1Zpc2libGU9aC1wPjE7aWYobi5pc1Zpc2libGUpe24uc2Nyb2xsYmFyLmFkZENsYXNzKHIpO2kuc2Nyb2xsYmFyLmFkZENsYXNzKHIpO2EuYWRkQ2xhc3Mocil9ZWxzZXtuLnNjcm9sbGJhci5yZW1vdmVDbGFzcyhyKTtpLnNjcm9sbGJhci5yZW1vdmVDbGFzcyhyKTthLnJlbW92ZUNsYXNzKHIpfWlmKHQ9PVwieVwiJiYobi5pc1Zpc2libGV8fG4uc2l6ZTxuLnZpc2libGUpKXthLmNzcyhcImhlaWdodFwiLHArby5zY3JvbGwuaGVpZ2h0K3MpfWlmKGwueC5zaXplIT11LnByb3AoXCJzY3JvbGxXaWR0aFwiKXx8bC55LnNpemUhPXUucHJvcChcInNjcm9sbEhlaWdodFwiKXx8bC54LnZpc2libGUhPWMud2lkdGgoKXx8bC55LnZpc2libGUhPWMuaGVpZ2h0KCl8fGwueC5vZmZzZXQhPShwYXJzZUludCh1LmNzcyhcImxlZnRcIiksMTApfHwwKXx8bC55Lm9mZnNldCE9KHBhcnNlSW50KHUuY3NzKFwidG9wXCIpLDEwKXx8MCkpe2UuZWFjaChsLGZ1bmN0aW9uKHQsbil7ZS5leHRlbmQobix0PT1cInhcIj97b2Zmc2V0OnBhcnNlSW50KHUuY3NzKFwibGVmdFwiKSwxMCl8fDAsc2l6ZTp1LnByb3AoXCJzY3JvbGxXaWR0aFwiKSx2aXNpYmxlOmMud2lkdGgoKX06e29mZnNldDpwYXJzZUludCh1LmNzcyhcInRvcFwiKSwxMCl8fDAsc2l6ZTp1LnByb3AoXCJzY3JvbGxIZWlnaHRcIiksdmlzaWJsZTpjLmhlaWdodCgpfSl9KTttKHQ9PVwieFwiP1wieVwiOlwieFwiLGkpfX07ZS5lYWNoKGwsbSk7aWYoZS5pc0Z1bmN0aW9uKGYub25VcGRhdGUpKWYub25VcGRhdGUuYXBwbHkodGhpcyxbdV0pO2UuZWFjaChsLGZ1bmN0aW9uKGUsdCl7dmFyIG49ZT09XCJ4XCI/XCJsZWZ0XCI6XCJ0b3BcIjt2YXIgcj1lPT1cInhcIj9cIm91dGVyV2lkdGhcIjpcIm91dGVySGVpZ2h0XCI7dmFyIGk9ZT09XCJ4XCI/XCJ3aWR0aFwiOlwiaGVpZ2h0XCI7dmFyIG89cGFyc2VJbnQodS5jc3MobiksMTApfHwwO3ZhciBhPXQuc2l6ZTt2YXIgbD10LnZpc2libGUrbzt2YXIgYz10LnNjcm9sbGJhci5maW5kKFwiLnNjcm9sbC1lbGVtZW50X3NpemVcIik7Yz1jW3JdKCkrKHBhcnNlSW50KGMuY3NzKG4pLDEwKXx8MCk7aWYoZi5hdXRvU2Nyb2xsU2l6ZSl7dC5zY3JvbGxiYXJTaXplPXBhcnNlSW50KGMqbC9hLDEwKTt0LnNjcm9sbGVyLmNzcyhpLHQuc2Nyb2xsYmFyU2l6ZStzKX10LnNjcm9sbGJhclNpemU9dC5zY3JvbGxlcltyXSgpO3Qua3g9KGMtdC5zY3JvbGxiYXJTaXplKS8oYS1sKXx8MTt0Lm1heFNjcm9sbE9mZnNldD1hLWx9KTt1LnNjcm9sbExlZnQoaC5zY3JvbGxMZWZ0KS5zY3JvbGxUb3AoaC5zY3JvbGxUb3ApLnRyaWdnZXIoXCJzY3JvbGxcIil9fTtlLmZuLnNjcm9sbGJhcj1mdW5jdGlvbih0LG4pe3ZhciByPXRoaXM7aWYodD09PVwiZ2V0XCIpcj1udWxsO3RoaXMuZWFjaChmdW5jdGlvbigpe3ZhciBpPWUodGhpcyk7aWYoaS5oYXNDbGFzcyhcInNjcm9sbC13cmFwcGVyXCIpfHxpLmdldCgwKS5ub2RlTmFtZT09XCJib2R5XCIpe3JldHVybiB0cnVlfXZhciBzPWkuZGF0YShcInNjcm9sbGJhclwiKTtpZihzKXtpZih0PT09XCJnZXRcIil7cj1zO3JldHVybiBmYWxzZX12YXIgdT10eXBlb2YgdD09XCJzdHJpbmdcIiYmc1t0XT90OlwiaW5pdFwiO3NbdV0uYXBwbHkocyxlLmlzQXJyYXkobik/bjpbXSk7aWYodD09PVwiZGVzdHJveVwiKXtpLnJlbW92ZURhdGEoXCJzY3JvbGxiYXJcIik7d2hpbGUoZS5pbkFycmF5KHMsby5zY3JvbGxzKT49MClvLnNjcm9sbHMuc3BsaWNlKGUuaW5BcnJheShzLG8uc2Nyb2xscyksMSl9fWVsc2V7aWYodHlwZW9mIHQhPVwic3RyaW5nXCIpe3M9bmV3IGEoaSx0KTtpLmRhdGEoXCJzY3JvbGxiYXJcIixzKTtvLnNjcm9sbHMucHVzaChzKX19cmV0dXJuIHRydWV9KTtyZXR1cm4gcn07ZS5mbi5zY3JvbGxiYXIub3B0aW9ucz11O2lmKG4uYW5ndWxhcil7KGZ1bmN0aW9uKGUpe3ZhciB0PWUubW9kdWxlKFwialF1ZXJ5U2Nyb2xsYmFyXCIsW10pO3QuZGlyZWN0aXZlKFwianF1ZXJ5U2Nyb2xsYmFyXCIsZnVuY3Rpb24oKXtyZXR1cm57bGluazpmdW5jdGlvbihlLHQpe3Quc2Nyb2xsYmFyKGUub3B0aW9ucykub24oXCIkZGVzdHJveVwiLGZ1bmN0aW9uKCl7dC5zY3JvbGxiYXIoXCJkZXN0cm95XCIpfSl9LHJlc3RyaW5nOlwiQUNcIixzY29wZTp7b3B0aW9uczpcIj1qcXVlcnlTY3JvbGxiYXJcIn19fSl9KShuLmFuZ3VsYXIpfXZhciBmPTAsbD0wO3ZhciBjPWZ1bmN0aW9uKGUpe3ZhciB0LG4saSxzLHUsYSxoO2Zvcih0PTA7dDxvLnNjcm9sbHMubGVuZ3RoO3QrKyl7cz1vLnNjcm9sbHNbdF07bj1zLmNvbnRhaW5lcjtpPXMub3B0aW9uczt1PXMud3JhcHBlcjthPXMuc2Nyb2xseDtoPXMuc2Nyb2xseTtpZihlfHxpLmF1dG9VcGRhdGUmJnUmJnUuaXMoXCI6dmlzaWJsZVwiKSYmKG4ucHJvcChcInNjcm9sbFdpZHRoXCIpIT1hLnNpemV8fG4ucHJvcChcInNjcm9sbEhlaWdodFwiKSE9aC5zaXplfHx1LndpZHRoKCkhPWEudmlzaWJsZXx8dS5oZWlnaHQoKSE9aC52aXNpYmxlKSl7cy5pbml0KCk7aWYocil7by5sb2coe3Njcm9sbEhlaWdodDpuLnByb3AoXCJzY3JvbGxIZWlnaHRcIikrXCI6XCIrcy5zY3JvbGx5LnNpemUsc2Nyb2xsV2lkdGg6bi5wcm9wKFwic2Nyb2xsV2lkdGhcIikrXCI6XCIrcy5zY3JvbGx4LnNpemUsdmlzaWJsZUhlaWdodDp1LmhlaWdodCgpK1wiOlwiK3Muc2Nyb2xseS52aXNpYmxlLHZpc2libGVXaWR0aDp1LndpZHRoKCkrXCI6XCIrcy5zY3JvbGx4LnZpc2libGV9LHRydWUpO2wrK319fWlmKHImJmw+MTApe28ubG9nKFwiU2Nyb2xsIHVwZGF0ZXMgZXhjZWVkIDEwXCIpO2M9ZnVuY3Rpb24oKXt9fWVsc2V7Y2xlYXJUaW1lb3V0KGYpO2Y9c2V0VGltZW91dChjLDMwMCl9fX0pKGpRdWVyeSxkb2N1bWVudCx3aW5kb3cpOyIsIi8vIFN0b3JhZ2UgY2FjaGUuXHJcbnZhciBjYWNoZSA9IHt9O1xyXG4vLyBUaGUgc3RvcmUgaGFuZGxpbmcgZXhwaXJhdGlvbiBvZiBkYXRhLlxyXG52YXIgZXhwaXJlc1N0b3JlID0gbmV3IFN0b3JlKHtcclxuXHRuYW1lc3BhY2U6ICdfX3N0b3JhZ2Utd3JhcHBlcjpleHBpcmVzJ1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBTdG9yYWdlIHdyYXBwZXIgZm9yIG1ha2luZyByb3V0aW5lIHN0b3JhZ2UgY2FsbHMgc3VwZXIgZWFzeS5cclxuICogQGNsYXNzIFN0b3JlXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdICAgICAgICAgICAgICAgICAgICAgVGhlIG9wdGlvbnMgZm9yIHRoZSBzdG9yZS4gT3B0aW9ucyBub3Qgb3ZlcnJpZGRlbiB3aWxsIHVzZSB0aGUgZGVmYXVsdHMuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBbb3B0aW9ucy5uYW1lc3BhY2U9JyddICAgICAgICBTZWUge3sjY3Jvc3NMaW5rIFwiU3RvcmUvc2V0TmFtZXNwYWNlXCJ9fVN0b3JlI3NldE5hbWVzcGFjZXt7L2Nyb3NzTGlua319XHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICBbb3B0aW9ucy5zdG9yYWdlVHlwZT0nbG9jYWwnXSBTZWUge3sjY3Jvc3NMaW5rIFwiU3RvcmUvc2V0U3RvcmFnZVR5cGVcIn19U3RvcmUjc2V0U3RvcmFnZVR5cGV7ey9jcm9zc0xpbmt9fVxyXG4gKi9cclxuZnVuY3Rpb24gU3RvcmUob3B0aW9ucykge1xyXG5cdHZhciBzZXR0aW5ncyA9IHtcclxuXHRcdG5hbWVzcGFjZTogJycsXHJcblx0XHRzdG9yYWdlVHlwZTogJ2xvY2FsJ1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIHN0b3JhZ2UgbmFtZXNwYWNlLlxyXG5cdCAqIEBtZXRob2Qgc2V0TmFtZXNwYWNlXHJcblx0ICogQHBhcmFtIHtzdHJpbmd8ZmFsc2V8bnVsbH0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2UgdG8gd29yayB1bmRlci4gVG8gdXNlIG5vIG5hbWVzcGFjZSAoZS5nLiBnbG9iYWwgbmFtZXNwYWNlKSwgcGFzcyBpbiBgZmFsc2VgIG9yIGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcuXHJcblx0ICovXHJcblx0dGhpcy5zZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZXNwYWNlKSB7XHJcblx0XHR2YXIgdmFsaWROYW1lc3BhY2UgPSAvXltcXHctOl0rJC87XHJcblx0XHQvLyBObyBuYW1lc3BhY2UuXHJcblx0XHRpZiAobmFtZXNwYWNlID09PSBmYWxzZSB8fCBuYW1lc3BhY2UgPT0gbnVsbCB8fCBuYW1lc3BhY2UgPT09ICcnKSB7XHJcblx0XHRcdHNldHRpbmdzLm5hbWVzcGFjZSA9ICcnO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpZiAodHlwZW9mIG5hbWVzcGFjZSAhPT0gJ3N0cmluZycgfHwgIXZhbGlkTmFtZXNwYWNlLnRlc3QobmFtZXNwYWNlKSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbmFtZXNwYWNlLicpO1xyXG5cdFx0fVxyXG5cdFx0c2V0dGluZ3MubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGN1cnJlbnQgc3RvcmFnZSBuYW1lc3BhY2UuXHJcblx0ICogQG1ldGhvZCBnZXROYW1lc3BhY2VcclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuXHQgKi9cclxuXHR0aGlzLmdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChpbmNsdWRlU2VwYXJhdG9yKSB7XHJcblx0XHRpZiAoaW5jbHVkZVNlcGFyYXRvciAmJiBzZXR0aW5ncy5uYW1lc3BhY2UgIT09ICcnKSB7XHJcblx0XHRcdHJldHVybiBzZXR0aW5ncy5uYW1lc3BhY2UgKyAnOic7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc2V0dGluZ3MubmFtZXNwYWNlO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogU2V0cyB0aGUgdHlwZSBvZiBzdG9yYWdlIHRvIHVzZS5cclxuXHQgKiBAbWV0aG9kIHNldFN0b3JhZ2VUeXBlXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgVGhlIHR5cGUgb2Ygc3RvcmFnZSB0byB1c2UuIFVzZSBgc2Vzc2lvbmAgZm9yIGBzZXNzaW9uU3RvcmFnZWAgYW5kIGBsb2NhbGAgZm9yIGBsb2NhbFN0b3JhZ2VgLlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0U3RvcmFnZVR5cGUgPSBmdW5jdGlvbiAodHlwZSkge1xyXG5cdFx0aWYgKFsnc2Vzc2lvbicsICdsb2NhbCddLmluZGV4T2YodHlwZSkgPCAwKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdG9yYWdlIHR5cGUuJyk7XHJcblx0XHR9XHJcblx0XHRzZXR0aW5ncy5zdG9yYWdlVHlwZSA9IHR5cGU7XHJcblx0fTtcclxuXHQvKipcclxuXHQgKiBHZXQgdGhlIHR5cGUgb2Ygc3RvcmFnZSBiZWluZyB1c2VkLlxyXG5cdCAqIEBtZXRob2QgZ2V0U3RvcmFnZVR5cGVcclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB0eXBlIG9mIHN0b3JhZ2UgYmVpbmcgdXNlZC5cclxuXHQgKi9cclxuXHR0aGlzLmdldFN0b3JhZ2VUeXBlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHNldHRpbmdzLnN0b3JhZ2VUeXBlO1xyXG5cdH07XHJcblxyXG5cdC8vIE92ZXJyaWRlIGRlZmF1bHQgc2V0dGluZ3MuXHJcblx0aWYgKG9wdGlvbnMpIHtcclxuXHRcdGZvciAodmFyIGtleSBpbiBvcHRpb25zKSB7XHJcblx0XHRcdHN3aXRjaCAoa2V5KSB7XHJcblx0XHRcdFx0Y2FzZSAnbmFtZXNwYWNlJzpcclxuXHRcdFx0XHRcdHRoaXMuc2V0TmFtZXNwYWNlKG9wdGlvbnNba2V5XSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRjYXNlICdzdG9yYWdlVHlwZSc6XHJcblx0XHRcdFx0XHR0aGlzLnNldFN0b3JhZ2VUeXBlKG9wdGlvbnNba2V5XSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGFjdHVhbCBoYW5kbGVyIHRvIHVzZVxyXG4gKiBAbWV0aG9kIGdldFN0b3JhZ2VIYW5kbGVyXHJcbiAqIEByZXR1cm4ge21peGVkfSBUaGUgc3RvcmFnZSBoYW5kbGVyLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldFN0b3JhZ2VIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBoYW5kbGVycyA9IHtcclxuXHRcdCdsb2NhbCc6IGxvY2FsU3RvcmFnZSxcclxuXHRcdCdzZXNzaW9uJzogc2Vzc2lvblN0b3JhZ2VcclxuXHR9O1xyXG5cdHJldHVybiBoYW5kbGVyc1t0aGlzLmdldFN0b3JhZ2VUeXBlKCldO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgZnVsbCBzdG9yYWdlIG5hbWUgZm9yIGEga2V5LCBpbmNsdWRpbmcgdGhlIG5hbWVzcGFjZSwgaWYgYW55LlxyXG4gKiBAbWV0aG9kIGdldFN0b3JhZ2VLZXlcclxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkgVGhlIHN0b3JhZ2Uga2V5IG5hbWUuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gICAgIFRoZSBmdWxsIHN0b3JhZ2UgbmFtZSB0aGF0IGlzIHVzZWQgYnkgdGhlIHN0b3JhZ2UgbWV0aG9kcy5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXRTdG9yYWdlS2V5ID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdGlmICgha2V5IHx8IHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnIHx8IGtleS5sZW5ndGggPCAxKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0tleSBtdXN0IGJlIGEgc3RyaW5nLicpO1xyXG5cdH1cclxuXHRyZXR1cm4gdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkgKyBrZXk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0b3JhZ2UgaXRlbSBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBnZXRcclxuICogQHBhcmFtICB7c3RyaW5nfSBrZXkgICAgICAgICAgVGhlIGtleSB0aGF0IHRoZSBkYXRhIGNhbiBiZSBhY2Nlc3NlZCB1bmRlci5cclxuICogQHBhcmFtICB7bWl4ZWR9ICBkZWZhdWx0VmFsdWUgVGhlIGRlZmF1bHQgdmFsdWUgdG8gcmV0dXJuIGluIGNhc2UgdGhlIHN0b3JhZ2UgdmFsdWUgaXMgbm90IHNldCBvciBgbnVsbGAuXHJcbiAqIEByZXR1cm4ge21peGVkfSAgICAgICAgICAgICAgIFRoZSBkYXRhIGZvciB0aGUgc3RvcmFnZS5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5LCBkZWZhdWx0VmFsdWUpIHtcclxuXHQvLyBQcmV2ZW50IHJlY3Vyc2lvbi4gT25seSBjaGVjayBleHBpcmUgZGF0ZSBpZiBpdCBpc24ndCBjYWxsZWQgZnJvbSBgZXhwaXJlc1N0b3JlYC5cclxuXHRpZiAodGhpcyAhPT0gZXhwaXJlc1N0b3JlKSB7XHJcblx0XHQvLyBDaGVjayBpZiBrZXkgaXMgZXhwaXJlZC5cclxuXHRcdHZhciBleHBpcmVEYXRlID0gZXhwaXJlc1N0b3JlLmdldCh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcblx0XHRpZiAoZXhwaXJlRGF0ZSAhPT0gbnVsbCAmJiBleHBpcmVEYXRlLmdldFRpbWUoKSA8IERhdGUubm93KCkpIHtcclxuXHRcdFx0Ly8gRXhwaXJlZCwgcmVtb3ZlIGl0LlxyXG5cdFx0XHR0aGlzLnJlbW92ZShrZXkpO1xyXG5cdFx0XHRleHBpcmVzU3RvcmUucmVtb3ZlKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIENhY2hlZCwgcmVhZCBmcm9tIG1lbW9yeS5cclxuXHRpZiAoY2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldICE9IG51bGwpIHtcclxuXHRcdHJldHVybiBjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV07XHJcblx0fVxyXG5cclxuXHR2YXIgdmFsID0gdGhpcy5nZXRTdG9yYWdlSGFuZGxlcigpLmdldEl0ZW0odGhpcy5nZXRTdG9yYWdlS2V5KGtleSkpO1xyXG5cclxuXHQvLyBWYWx1ZSBkb2Vzbid0IGV4aXN0IGFuZCB3ZSBoYXZlIGEgZGVmYXVsdCwgcmV0dXJuIGRlZmF1bHQuXHJcblx0aWYgKHZhbCA9PT0gbnVsbCAmJiB0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHR9XHJcblxyXG5cdC8vIE9ubHkgcHJlLXByb2Nlc3Mgc3RyaW5ncy5cclxuXHRpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcclxuXHRcdC8vIEhhbmRsZSBSZWdFeHBzLlxyXG5cdFx0aWYgKHZhbC5pbmRleE9mKCd+UmVnRXhwOicpID09PSAwKSB7XHJcblx0XHRcdHZhciBtYXRjaGVzID0gL15+UmVnRXhwOihbZ2ltXSo/KTooLiopLy5leGVjKHZhbCk7XHJcblx0XHRcdHZhbCA9IG5ldyBSZWdFeHAobWF0Y2hlc1syXSwgbWF0Y2hlc1sxXSk7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgRGF0ZXMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfkRhdGU6JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gbmV3IERhdGUodmFsLnJlcGxhY2UoL15+RGF0ZTovLCAnJykpO1xyXG5cdFx0fVxyXG5cdFx0Ly8gSGFuZGxlIG51bWJlcnMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfk51bWJlcjonKSA9PT0gMCkge1xyXG5cdFx0XHR2YWwgPSBwYXJzZUludCh2YWwucmVwbGFjZSgvXn5OdW1iZXI6LywgJycpLCAxMCk7XHJcblx0XHR9XHJcblx0XHQvLyBIYW5kbGUgYm9vbGVhbnMuXHJcblx0XHRlbHNlIGlmICh2YWwuaW5kZXhPZignfkJvb2xlYW46JykgPT09IDApIHtcclxuXHRcdFx0dmFsID0gdmFsLnJlcGxhY2UoL15+Qm9vbGVhbjovLCAnJykgPT09ICd0cnVlJztcclxuXHRcdH1cclxuXHRcdC8vIEhhbmRsZSBvYmplY3RzLlxyXG5cdFx0ZWxzZSBpZiAodmFsLmluZGV4T2YoJ35KU09OOicpID09PSAwKSB7XHJcblx0XHRcdHZhbCA9IHZhbC5yZXBsYWNlKC9efkpTT046LywgJycpO1xyXG5cdFx0XHQvLyBUcnkgcGFyc2luZyBpdC5cclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHR2YWwgPSBKU09OLnBhcnNlKHZhbCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gUGFyc2luZyB3ZW50IHdyb25nIChpbnZhbGlkIEpTT04pLCByZXR1cm4gZGVmYXVsdCBvciBudWxsLlxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgZGVmYXVsdFZhbHVlICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFJldHVybiBpdC5cclxuXHRjYWNoZVt0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KV0gPSB2YWw7XHJcblx0cmV0dXJuIHZhbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGEgc3RvcmFnZSBpdGVtIG9uIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBzZXRcclxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAga2V5ICAgICAgIFRoZSBrZXkgdGhhdCB0aGUgZGF0YSBjYW4gYmUgYWNjZXNzZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9ICAgICAgIHZhbCAgICAgICBUaGUgdmFsdWUgdG8gc3RvcmUuIE1heSBiZSB0aGUgZm9sbG93aW5nIHR5cGVzIG9mIGRhdGE6IGBSZWdFeHBgLCBgRGF0ZWAsIGBPYmplY3RgLCBgU3RyaW5nYCwgYEJvb2xlYW5gLCBgTnVtYmVyYFxyXG4gKiBAcGFyYW0ge0RhdGV8bnVtYmVyfSBbZXhwaXJlc10gVGhlIGRhdGUgaW4gdGhlIGZ1dHVyZSB0byBleHBpcmUsIG9yIHJlbGF0aXZlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZnJvbSBgRGF0ZSNub3dgIHRvIGV4cGlyZS5cclxuICpcclxuICogTm90ZTogVGhpcyBjb252ZXJ0cyBzcGVjaWFsIGRhdGEgdHlwZXMgdGhhdCBub3JtYWxseSBjYW4ndCBiZSBzdG9yZWQgaW4gdGhlIGZvbGxvd2luZyB3YXk6XHJcbiAqIFxyXG4gKiAtIGBSZWdFeHBgOiBwcmVmaXhlZCB3aXRoIHR5cGUsIGZsYWdzIHN0b3JlZCwgYW5kIHNvdXJjZSBzdG9yZWQgYXMgc3RyaW5nLlxyXG4gKiAtIGBEYXRlYDogcHJlZml4ZWQgd2l0aCB0eXBlLCBzdG9yZWQgYXMgc3RyaW5nIHVzaW5nIGBEYXRlI3RvU3RyaW5nYC5cclxuICogLSBgT2JqZWN0YDogcHJlZml4ZWQgd2l0aCBcIkpTT05cIiBpbmRpY2F0b3IsIHN0b3JlZCBhcyBzdHJpbmcgdXNpbmcgYEpTT04jc3RyaW5naWZ5YC5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWwsIGV4cGlyZXMpIHtcclxuXHR2YXIgcGFyc2VkVmFsID0gbnVsbDtcclxuXHQvLyBIYW5kbGUgUmVnRXhwcy5cclxuXHRpZiAodmFsIGluc3RhbmNlb2YgUmVnRXhwKSB7XHJcblx0XHR2YXIgZmxhZ3MgPSBbXHJcblx0XHRcdHZhbC5nbG9iYWwgPyAnZycgOiAnJyxcclxuXHRcdFx0dmFsLmlnbm9yZUNhc2UgPyAnaScgOiAnJyxcclxuXHRcdFx0dmFsLm11bHRpbGluZSA/ICdtJyA6ICcnLFxyXG5cdFx0XS5qb2luKCcnKTtcclxuXHRcdHBhcnNlZFZhbCA9ICd+UmVnRXhwOicgKyBmbGFncyArICc6JyArIHZhbC5zb3VyY2U7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBEYXRlcy5cclxuXHRlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkRhdGU6JyArIHZhbC50b1N0cmluZygpO1xyXG5cdH1cclxuXHQvLyBIYW5kbGUgb2JqZWN0cy5cclxuXHRlbHNlIGlmICh2YWwgPT09IE9iamVjdCh2YWwpKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfkpTT046JyArIEpTT04uc3RyaW5naWZ5KHZhbCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBudW1iZXJzLlxyXG5cdGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XHJcblx0XHRwYXJzZWRWYWwgPSAnfk51bWJlcjonICsgdmFsLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBib29sZWFucy5cclxuXHRlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnYm9vbGVhbicpIHtcclxuXHRcdHBhcnNlZFZhbCA9ICd+Qm9vbGVhbjonICsgdmFsLnRvU3RyaW5nKCk7XHJcblx0fVxyXG5cdC8vIEhhbmRsZSBzdHJpbmdzLlxyXG5cdGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRwYXJzZWRWYWwgPSB2YWw7XHJcblx0fVxyXG5cdC8vIFRocm93IGlmIHdlIGRvbid0IGtub3cgd2hhdCBpdCBpcy5cclxuXHRlbHNlIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIHN0b3JlIHRoaXMgdmFsdWU7IHdyb25nIHZhbHVlIHR5cGUuJyk7XHJcblx0fVxyXG5cdC8vIFNldCBleHBpcmUgZGF0ZSBpZiBuZWVkZWQuXHJcblx0aWYgKHR5cGVvZiBleHBpcmVzICE9PSAndW5kZWZpbmVkJykge1xyXG5cdFx0Ly8gQ29udmVydCB0byBhIHJlbGF0aXZlIGRhdGUuXHJcblx0XHRpZiAodHlwZW9mIGV4cGlyZXMgPT09ICdudW1iZXInKSB7XHJcblx0XHRcdGV4cGlyZXMgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgZXhwaXJlcyk7XHJcblx0XHR9XHJcblx0XHQvLyBNYWtlIHN1cmUgaXQgaXMgYSBkYXRlLlxyXG5cdFx0aWYgKGV4cGlyZXMgaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRcdGV4cGlyZXNTdG9yZS5zZXQodGhpcy5nZXRTdG9yYWdlS2V5KGtleSksIGV4cGlyZXMpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignS2V5IGV4cGlyZSBtdXN0IGJlIGEgdmFsaWQgZGF0ZSBvciB0aW1lc3RhbXAuJyk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vIFNhdmUgaXQuXHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gdmFsO1xyXG5cdHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5zZXRJdGVtKHRoaXMuZ2V0U3RvcmFnZUtleShrZXkpLCBwYXJzZWRWYWwpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYWxsIGRhdGEgZm9yIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBnZXRBbGxcclxuICogQHJldHVybiB7b2JqZWN0fSBBbiBvYmplY3QgY29udGFpbmluZyBhbGwgZGF0YSBpbiB0aGUgZm9ybSBvZiBge3RoZUtleTogdGhlRGF0YX1gIHdoZXJlIGB0aGVEYXRhYCBpcyBwYXJzZWQgdXNpbmcge3sjY3Jvc3NMaW5rIFwiU3RvcmUvZ2V0XCJ9fVN0b3JlI2dldHt7L2Nyb3NzTGlua319LlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIga2V5cyA9IHRoaXMubGlzdEtleXMoKTtcclxuXHR2YXIgZGF0YSA9IHt9O1xyXG5cdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRkYXRhW2tleV0gPSB0aGlzLmdldChrZXkpO1xyXG5cdH0sIHRoaXMpO1xyXG5cdHJldHVybiBkYXRhO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExpc3QgYWxsIGtleXMgdGhhdCBhcmUgdGllZCB0byB0aGUgY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgbGlzdEtleXNcclxuICogQHJldHVybiB7YXJyYXl9IFRoZSBzdG9yYWdlIGtleXMuXHJcbiAqL1xyXG5TdG9yZS5wcm90b3R5cGUubGlzdEtleXMgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGtleXMgPSBbXTtcclxuXHR2YXIga2V5ID0gbnVsbDtcclxuXHR2YXIgc3RvcmFnZUxlbmd0aCA9IHRoaXMuZ2V0U3RvcmFnZUhhbmRsZXIoKS5sZW5ndGg7XHJcblx0dmFyIHByZWZpeCA9IG5ldyBSZWdFeHAoJ14nICsgdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkpO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc3RvcmFnZUxlbmd0aDsgaSsrKSB7XHJcblx0XHRrZXkgPSB0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkua2V5KGkpXHJcblx0XHRpZiAocHJlZml4LnRlc3Qoa2V5KSkge1xyXG5cdFx0XHRrZXlzLnB1c2goa2V5LnJlcGxhY2UocHJlZml4LCAnJykpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4ga2V5cztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgc3BlY2lmaWMga2V5IGFuZCBkYXRhIGZyb20gdGhlIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG4gKiBAbWV0aG9kIHJlbW92ZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgdG8gcmVtb3ZlIHRoZSBkYXRhIGZvci5cclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoa2V5KSB7XHJcblx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gbnVsbDtcclxuXHR0aGlzLmdldFN0b3JhZ2VIYW5kbGVyKCkucmVtb3ZlSXRlbSh0aGlzLmdldFN0b3JhZ2VLZXkoa2V5KSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbGwgZGF0YSBhbmQga2V5cyBmcm9tIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCByZW1vdmVBbGxcclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XHJcblx0dGhpcy5saXN0S2V5cygpLmZvckVhY2godGhpcy5yZW1vdmUsIHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgbmFtZXNwYWNlZCBpdGVtcyBmcm9tIHRoZSBjYWNoZSBzbyB5b3VyIG5leHQge3sjY3Jvc3NMaW5rIFwiU3RvcmUvZ2V0XCJ9fVN0b3JlI2dldHt7L2Nyb3NzTGlua319IHdpbGwgYmUgZnJlc2ggZnJvbSB0aGUgc3RvcmFnZS5cclxuICogQG1ldGhvZCBmcmVzaGVuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSB0byByZW1vdmUgdGhlIGNhY2hlIGRhdGEgZm9yLlxyXG4gKi9cclxuU3RvcmUucHJvdG90eXBlLmZyZXNoZW4gPSBmdW5jdGlvbiAoa2V5KSB7XHJcblx0dmFyIGtleXMgPSBrZXkgPyBba2V5XSA6IHRoaXMubGlzdEtleXMoKTtcclxuXHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0Y2FjaGVbdGhpcy5nZXRTdG9yYWdlS2V5KGtleSldID0gbnVsbDtcclxuXHR9LCB0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNaWdyYXRlIGRhdGEgZnJvbSBhIGRpZmZlcmVudCBuYW1lc3BhY2UgdG8gY3VycmVudCBuYW1lc3BhY2UuXHJcbiAqIEBtZXRob2QgbWlncmF0ZVxyXG4gKiBAcGFyYW0ge29iamVjdH0gICBtaWdyYXRpb24gICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBtaWdyYXRpb24gb2JqZWN0LlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24udG9LZXkgICAgICAgICAgICAgICAgICAgIFRoZSBrZXkgbmFtZSB1bmRlciB5b3VyIGN1cnJlbnQgbmFtZXNwYWNlIHRoZSBvbGQgZGF0YSBzaG91bGQgY2hhbmdlIHRvLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gICBtaWdyYXRpb24uZnJvbU5hbWVzcGFjZSAgICAgICAgICAgIFRoZSBvbGQgbmFtZXNwYWNlIHRoYXQgdGhlIG9sZCBrZXkgYmVsb25ncyB0by5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgbWlncmF0aW9uLmZyb21LZXkgICAgICAgICAgICAgICAgICBUaGUgb2xkIGtleSBuYW1lIHRvIG1pZ3JhdGUgZnJvbS5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgW21pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGVdICAgICAgICBUaGUgc3RvcmFnZSB0eXBlIHRvIG1pZ3JhdGUgZnJvbS4gRGVmYXVsdHMgdG8gc2FtZSB0eXBlIGFzIHdoZXJlIHlvdSBhcmUgbWlncmF0aW5nIHRvLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59ICBbbWlncmF0aW9uLmtlZXBPbGREYXRhPWZhbHNlXSAgICAgIFdoZXRoZXIgb2xkIGRhdGEgc2hvdWxkIGJlIGtlcHQgYWZ0ZXIgaXQgaGFzIGJlZW4gbWlncmF0ZWQuXHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gIFttaWdyYXRpb24ub3ZlcndyaXRlTmV3RGF0YT1mYWxzZV0gV2hldGhlciBvbGQgZGF0YSBzaG91bGQgb3ZlcndyaXRlIGN1cnJlbnRseSBzdG9yZWQgZGF0YSBpZiBpdCBleGlzdHMuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFttaWdyYXRpb24udHJhbnNmb3JtXSAgICAgICAgICAgICAgVGhlIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIG9sZCBrZXkgZGF0YSB0aHJvdWdoIGJlZm9yZSBtaWdyYXRpbmcuXHJcbiAqIEBleGFtcGxlXHJcbiAqIFxyXG4gKiAgICAgdmFyIFN0b3JlID0gcmVxdWlyZSgnc3RvcmFnZS13cmFwcGVyJyk7XHJcbiAqICAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG4gKiAgICAgICAgIG5hbWVzcGFjZTogJ215TmV3QXBwJ1xyXG4gKiAgICAgfSk7XHJcbiAqXHJcbiAqICAgICAvLyBNaWdyYXRlIGZyb20gdGhlIG9sZCBhcHAuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ25ldy1rZXknLFxyXG4gKiAgICAgICAgIGZyb21OYW1lc3BhY2U6ICdteU9sZEFwcCcsXHJcbiAqICAgICAgICAgZnJvbUtleTogJ29sZC1rZXknXHJcbiAqICAgICB9KTtcclxuICogICAgIFxyXG4gKiAgICAgLy8gTWlncmF0ZSBmcm9tIGdsb2JhbCBkYXRhLiBVc2VmdWwgd2hlbiBtb3ZpbmcgZnJvbSBvdGhlciBzdG9yYWdlIHdyYXBwZXJzIG9yIHJlZ3VsYXIgb2wnIGBsb2NhbFN0b3JhZ2VgLlxyXG4gKiAgICAgc3RvcmUubWlncmF0ZSh7XHJcbiAqICAgICAgICAgdG9LZXk6ICdvdGhlci1uZXcta2V5JyxcclxuICogICAgICAgICBmcm9tTmFtZXNwYWNlOiAnJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb3RoZXItb2xkLWtleS1vbi1nbG9iYWwnXHJcbiAqICAgICB9KTtcclxuICogICAgIFxyXG4gKiAgICAgLy8gTWlncmF0ZSBzb21lIEpTT04gZGF0YSB0aGF0IHdhcyBzdG9yZWQgYXMgYSBzdHJpbmcuXHJcbiAqICAgICBzdG9yZS5taWdyYXRlKHtcclxuICogICAgICAgICB0b0tleTogJ25ldy1qc29uLWtleScsXHJcbiAqICAgICAgICAgZnJvbU5hbWVzcGFjZTogJ215T2xkQXBwJyxcclxuICogICAgICAgICBmcm9tS2V5OiAnb2xkLWpzb24ta2V5JyxcclxuICogICAgICAgICAvLyBUcnkgY29udmVydGluZyBzb21lIG9sZCBKU09OIGRhdGEuXHJcbiAqICAgICAgICAgdHJhbnNmb3JtOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gKiAgICAgICAgICAgICB0cnkge1xyXG4gKiAgICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XHJcbiAqICAgICAgICAgICAgIH1cclxuICogICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICogICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gKiAgICAgICAgICAgICB9XHJcbiAqICAgICAgICAgfVxyXG4gKiAgICAgfSk7XHJcbiAqL1xyXG5cclxuU3RvcmUucHJvdG90eXBlLm1pZ3JhdGUgPSBmdW5jdGlvbiAobWlncmF0aW9uKSB7XHJcblx0Ly8gU2F2ZSBvdXIgY3VycmVudCBuYW1lc3BhY2UuXHJcblx0dmFyIHRvTmFtZXNwYWNlID0gdGhpcy5nZXROYW1lc3BhY2UoKTtcclxuXHR2YXIgdG9TdG9yYWdlVHlwZSA9IHRoaXMuZ2V0U3RvcmFnZVR5cGUoKTtcclxuXHJcblx0Ly8gQ3JlYXRlIGEgdGVtcG9yYXJ5IHN0b3JlIHRvIGF2b2lkIGNoYW5naW5nIG5hbWVzcGFjZSBkdXJpbmcgYWN0dWFsIGdldC9zZXRzLlxyXG5cdHZhciBzdG9yZSA9IG5ldyBTdG9yZSh7XHJcblx0XHRuYW1lc3BhY2U6IHRvTmFtZXNwYWNlLFxyXG5cdFx0c3RvcmFnZVR5cGU6IHRvU3RvcmFnZVR5cGVcclxuXHR9KTtcclxuXHJcblx0dmFyIGRhdGEgPSBudWxsO1xyXG5cclxuXHQvLyBHZXQgZGF0YSBmcm9tIG9sZCBuYW1lc3BhY2UuXHJcblx0c3RvcmUuc2V0TmFtZXNwYWNlKG1pZ3JhdGlvbi5mcm9tTmFtZXNwYWNlKTtcclxuXHRpZiAodHlwZW9mIG1pZ3JhdGlvbi5mcm9tU3RvcmFnZVR5cGUgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRzdG9yZS5zZXRTdG9yYWdlVHlwZShtaWdyYXRpb24uZnJvbVN0b3JhZ2VUeXBlKTtcclxuXHR9XHJcblx0ZGF0YSA9IHN0b3JlLmdldChtaWdyYXRpb24uZnJvbUtleSk7XHJcblxyXG5cdC8vIFJlbW92ZSBvbGQgaWYgbmVlZGVkLlxyXG5cdGlmICghbWlncmF0aW9uLmtlZXBPbGREYXRhKSB7XHJcblx0XHRzdG9yZS5yZW1vdmUobWlncmF0aW9uLmZyb21LZXkpO1xyXG5cdH1cclxuXHRcclxuXHQvLyBObyBkYXRhLCBpZ25vcmUgdGhpcyBtaWdyYXRpb24uXHJcblx0aWYgKGRhdGEgPT09IG51bGwpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8vIFRyYW5zZm9ybSBkYXRhIGlmIG5lZWRlZC5cclxuXHRpZiAodHlwZW9mIG1pZ3JhdGlvbi50cmFuc2Zvcm0gPT09ICdmdW5jdGlvbicpIHtcclxuXHRcdGRhdGEgPSBtaWdyYXRpb24udHJhbnNmb3JtKGRhdGEpO1xyXG5cdH1cclxuXHRlbHNlIGlmICh0eXBlb2YgbWlncmF0aW9uLnRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0cmFuc2Zvcm0gY2FsbGJhY2suJyk7XHJcblx0fVxyXG5cclxuXHQvLyBHbyBiYWNrIHRvIGN1cnJlbnQgbmFtZXNwYWNlLlxyXG5cdHN0b3JlLnNldE5hbWVzcGFjZSh0b05hbWVzcGFjZSk7XHJcblx0c3RvcmUuc2V0U3RvcmFnZVR5cGUodG9TdG9yYWdlVHlwZSk7XHJcblxyXG5cdC8vIE9ubHkgb3ZlcndyaXRlIG5ldyBkYXRhIGlmIGl0IGRvZXNuJ3QgZXhpc3Qgb3IgaXQncyByZXF1ZXN0ZWQuXHJcblx0aWYgKHN0b3JlLmdldChtaWdyYXRpb24udG9LZXkpID09PSBudWxsIHx8IG1pZ3JhdGlvbi5vdmVyd3JpdGVOZXdEYXRhKSB7XHJcblx0XHRzdG9yZS5zZXQobWlncmF0aW9uLnRvS2V5LCBkYXRhKTtcclxuXHR9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHN1YnN0b3JlIHRoYXQgaXMgbmVzdGVkIGluIHRoZSBjdXJyZW50IG5hbWVzcGFjZS5cclxuICogQG1ldGhvZCBjcmVhdGVTdWJzdG9yZVxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9IG5hbWVzcGFjZSBUaGUgc3Vic3RvcmUncyBuYW1lc3BhY2UuXHJcbiAqIEByZXR1cm4ge1N0b3JlfSAgICAgICAgICAgIFRoZSBzdWJzdG9yZS5cclxuICogQGV4YW1wbGVcclxuICogXHJcbiAqICAgICB2YXIgU3RvcmUgPSByZXF1aXJlKCdzdG9yYWdlLXdyYXBwZXInKTtcclxuICogICAgIC8vIENyZWF0ZSBtYWluIHN0b3JlLlxyXG4gKiAgICAgdmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuICogICAgICAgICBuYW1lc3BhY2U6ICdteWFwcCdcclxuICogICAgIH0pO1xyXG4gKlxyXG4gKiAgICAgLy8gQ3JlYXRlIHN1YnN0b3JlLlxyXG4gKiAgICAgdmFyIHN1YnN0b3JlID0gc3RvcmUuY3JlYXRlU3Vic3RvcmUoJ3RoaW5ncycpO1xyXG4gKiAgICAgc3Vic3RvcmUuc2V0KCdmb28nLCAnYmFyJyk7XHJcbiAqXHJcbiAqICAgICBzdWJzdG9yZS5nZXQoJ2ZvbycpID09PSBzdG9yZS5nZXQoJ3RoaW5nczpmb28nKTtcclxuICogICAgIC8vIHRydWVcclxuICovXHJcblN0b3JlLnByb3RvdHlwZS5jcmVhdGVTdWJzdG9yZSA9IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcclxuXHRyZXR1cm4gbmV3IFN0b3JlKHtcclxuXHRcdG5hbWVzcGFjZTogdGhpcy5nZXROYW1lc3BhY2UodHJ1ZSkgKyBuYW1lc3BhY2UsXHJcblx0XHRzdG9yYWdlVHlwZTogdGhpcy5nZXRTdG9yYWdlVHlwZSgpXHJcblx0fSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFN0b3JlO1xyXG4iLCJtb2R1bGUuZXhwb3J0cz17XHJcblx0XCJuYW1lXCI6IFwidHdpdGNoLWNoYXQtZW1vdGVzXCIsXHJcblx0XCJ2ZXJzaW9uXCI6IFwiMS4xLjFcIixcclxuXHRcImhvbWVwYWdlXCI6IFwiaHR0cDovL2NsZXR1c2MuZ2l0aHViLmlvL1VzZXJzY3JpcHQtLVR3aXRjaC1DaGF0LUVtb3Rlcy9cIixcclxuXHRcImJ1Z3NcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY2xldHVzYy9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvaXNzdWVzXCIsXHJcblx0XCJhdXRob3JcIjogXCJSeWFuIENoYXRoYW0gPHJ5YW4uYi5jaGF0aGFtQGdtYWlsLmNvbT4gKGh0dHBzOi8vZ2l0aHViLmNvbS9jbGV0dXNjKVwiLFxyXG5cdFwicmVwb3NpdG9yeVwiOiB7XHJcblx0XHRcInR5cGVcIjogXCJnaXRcIixcclxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2NsZXR1c2MvVXNlcnNjcmlwdC0tVHdpdGNoLUNoYXQtRW1vdGVzLmdpdFwiXHJcblx0fSxcclxuXHRcInVzZXJzY3JpcHRcIjoge1xyXG5cdFx0XCJuYW1lXCI6IFwiVHdpdGNoIENoYXQgRW1vdGVzXCIsXHJcblx0XHRcIm5hbWVzcGFjZVwiOiBcIiNDbGV0dXNcIixcclxuXHRcdFwidmVyc2lvblwiOiBcInt7e3BrZy52ZXJzaW9ufX19XCIsXHJcblx0XHRcImRlc2NyaXB0aW9uXCI6IFwiQWRkcyBhIGJ1dHRvbiB0byBUd2l0Y2ggdGhhdCBhbGxvd3MgeW91IHRvIFxcXCJjbGljay10by1pbnNlcnRcXFwiIGFuIGVtb3RlLlwiLFxyXG5cdFx0XCJjb3B5cmlnaHRcIjogXCIyMDExKywge3t7cGtnLmF1dGhvcn19fVwiLFxyXG5cdFx0XCJhdXRob3JcIjogXCJ7e3twa2cuYXV0aG9yfX19XCIsXHJcblx0XHRcImljb25cIjogXCJodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIucGhwP2dyYXZhdGFyX2lkPTY4NzVlODNhYTZjNTYzNzkwY2IyZGE5MTRhYWJhOGIzJnI9UEcmcz00OCZkZWZhdWx0PWlkZW50aWNvblwiLFxyXG5cdFx0XCJsaWNlbnNlXCI6IFtcclxuXHRcdFx0XCJNSVQ7IGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcIixcclxuXHRcdFx0XCJDQyBCWS1OQy1TQSAzLjA7IGh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL2xpY2Vuc2VzL2J5LW5jLXNhLzMuMC9cIlxyXG5cdFx0XSxcclxuXHRcdFwiaG9tZXBhZ2VcIjogXCJ7e3twa2cuaG9tZXBhZ2V9fX1cIixcclxuXHRcdFwic3VwcG9ydFVSTFwiOiBcInt7e3BrZy5idWdzfX19XCIsXHJcblx0XHRcImNvbnRyaWJ1dGlvblVSTFwiOiBcImh0dHA6Ly9jbGV0dXNjLmdpdGh1Yi5pby9Vc2Vyc2NyaXB0LS1Ud2l0Y2gtQ2hhdC1FbW90ZXMvI2RvbmF0ZVwiLFxyXG5cdFx0XCJncmFudFwiOiBcIm5vbmVcIixcclxuXHRcdFwiaW5jbHVkZVwiOiBcImh0dHA6Ly8qLnR3aXRjaC50di8qXCIsXHJcblx0XHRcImV4Y2x1ZGVcIjogW1xyXG5cdFx0XHRcImh0dHA6Ly9hcGkudHdpdGNoLnR2LypcIixcclxuXHRcdFx0XCJodHRwOi8vdG1pLnR3aXRjaC50di8qXCIsXHJcblx0XHRcdFwiaHR0cDovL2NoYXRkZXBvdC50d2l0Y2gudHYvKlwiXHJcblx0XHRdXHJcblx0fSxcclxuXHRcInNjcmlwdHNcIjoge1xyXG5cdFx0XCJpbnN0YWxsXCI6IFwibmFwYVwiXHJcblx0fSxcclxuXHRcImRldkRlcGVuZGVuY2llc1wiOiB7XHJcblx0XHRcImJyb3dzZXItc3luY1wiOiBcIl4xLjMuMlwiLFxyXG5cdFx0XCJicm93c2VyaWZ5XCI6IFwiXjUuOS4xXCIsXHJcblx0XHRcImd1bHBcIjogXCJeMy44LjNcIixcclxuXHRcdFwiZ3VscC1hdXRvcHJlZml4ZXJcIjogXCIwLjAuOFwiLFxyXG5cdFx0XCJndWxwLWJlYXV0aWZ5XCI6IFwiMS4xLjBcIixcclxuXHRcdFwiZ3VscC1jaGFuZ2VkXCI6IFwiXjAuNC4xXCIsXHJcblx0XHRcImd1bHAtY29uY2F0XCI6IFwiXjIuMi4wXCIsXHJcblx0XHRcImd1bHAtY29uZmxpY3RcIjogXCJeMC4xLjJcIixcclxuXHRcdFwiZ3VscC1jc3MtYmFzZTY0XCI6IFwiXjEuMS4wXCIsXHJcblx0XHRcImd1bHAtY3NzMmpzXCI6IFwiXjEuMC4yXCIsXHJcblx0XHRcImd1bHAtaGVhZGVyXCI6IFwiXjEuMC4yXCIsXHJcblx0XHRcImd1bHAtaG9nYW4tY29tcGlsZVwiOiBcIl4wLjIuMVwiLFxyXG5cdFx0XCJndWxwLW1pbmlmeS1jc3NcIjogXCJeMC4zLjVcIixcclxuXHRcdFwiZ3VscC1ub3RpZnlcIjogXCJeMS40LjFcIixcclxuXHRcdFwiZ3VscC1yZW5hbWVcIjogXCJeMS4yLjBcIixcclxuXHRcdFwiZ3VscC11Z2xpZnlcIjogXCJeMC4zLjFcIixcclxuXHRcdFwiZ3VscC11dGlsXCI6IFwiXjMuMC4wXCIsXHJcblx0XHRcImhvZ2FuLmpzXCI6IFwiXjMuMC4yXCIsXHJcblx0XHRcImpxdWVyeS11aVwiOiBcIl4xLjEwLjVcIixcclxuXHRcdFwicHJldHR5LWhydGltZVwiOiBcIl4wLjIuMVwiLFxyXG5cdFx0XCJ2aW55bC1tYXBcIjogXCJeMS4wLjFcIixcclxuXHRcdFwidmlueWwtc291cmNlLXN0cmVhbVwiOiBcIl4wLjEuMVwiLFxyXG5cdFx0XCJ3YXRjaGlmeVwiOiBcIl4xLjAuMVwiLFxyXG5cdFx0XCJzdG9yYWdlLXdyYXBwZXJcIjogXCJjbGV0dXNjL3N0b3JhZ2Utd3JhcHBlciN2MC4xLjFcIixcclxuXHRcdFwianF1ZXJ5LnNjcm9sbGJhclwiOiBcImdyb21vL2pxdWVyeS5zY3JvbGxiYXIjMC4yLjdcIlxyXG5cdH1cclxufVxyXG4iLCJ2YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKTtcclxudmFyIGFwaSA9IHt9O1xyXG52YXIgZW1iZXIgPSBudWxsO1xyXG52YXIgaG9va2VkRmFjdG9yaWVzID0ge307XHJcblxyXG5hcGkuZ2V0RW1iZXIgPSBmdW5jdGlvbiAoKSB7XHJcblx0aWYgKGVtYmVyKSB7XHJcblx0XHRyZXR1cm4gZW1iZXI7XHJcblx0fVxyXG5cdGlmICh3aW5kb3cuQXBwICYmIHdpbmRvdy5BcHAuX19jb250YWluZXJfXykge1xyXG5cdFx0ZW1iZXIgPSB3aW5kb3cuQXBwLl9fY29udGFpbmVyX187XHJcblx0XHRyZXR1cm4gZW1iZXI7XHJcblx0fVxyXG5cdHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbmFwaS5pc0xvYWRlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gQm9vbGVhbihhcGkuZ2V0RW1iZXIoKSk7XHJcbn07XHJcblxyXG5hcGkubG9va3VwID0gZnVuY3Rpb24gKGxvb2t1cEZhY3RvcnkpIHtcclxuXHRpZiAoIWFwaS5pc0xvYWRlZCgpKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgbG9va3VwIGZhaWx1cmUsIEVtYmVyIG5vdCBsb2FkZWQuJyk7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cdHJldHVybiBhcGkuZ2V0RW1iZXIoKS5sb29rdXAobG9va3VwRmFjdG9yeSk7XHJcbn07XHJcblxyXG5hcGkuaG9vayA9IGZ1bmN0aW9uIChsb29rdXBGYWN0b3J5LCBhY3RpdmF0ZUNiLCBkZWFjdGl2YXRlQ2IpIHtcclxuXHRpZiAoIWFwaS5pc0xvYWRlZCgpKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9vayBmYWlsdXJlLCBFbWJlciBub3QgbG9hZGVkLicpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHRpZiAoaG9va2VkRmFjdG9yaWVzW2xvb2t1cEZhY3RvcnldKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgYWxyZWFkeSBob29rZWQ6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHR2YXIgcmVvcGVuT3B0aW9ucyA9IHt9O1xyXG5cdHZhciBmYWN0b3J5ID0gYXBpLmxvb2t1cChsb29rdXBGYWN0b3J5KTtcclxuXHJcblx0aWYgKCFmYWN0b3J5KSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9vayBmYWlsdXJlLCBmYWN0b3J5IG5vdCBmb3VuZDogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHJcblx0aWYgKGFjdGl2YXRlQ2IpIHtcclxuXHRcdHJlb3Blbk9wdGlvbnMuYWN0aXZhdGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdHRoaXMuX3N1cGVyKCk7XHJcblx0XHRcdGFjdGl2YXRlQ2IuY2FsbCh0aGlzKTtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdIb29rIHJ1biBvbiBhY3RpdmF0ZTogJyArIGxvb2t1cEZhY3RvcnkpO1xyXG5cdFx0fTtcclxuXHR9XHJcblx0aWYgKGRlYWN0aXZhdGVDYikge1xyXG5cdFx0cmVvcGVuT3B0aW9ucy5kZWFjdGl2YXRlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHR0aGlzLl9zdXBlcigpO1xyXG5cdFx0XHRkZWFjdGl2YXRlQ2IuY2FsbCh0aGlzKTtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdIb29rIHJ1biBvbiBkZWFjdGl2YXRlOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0dHJ5IHtcclxuXHRcdGZhY3RvcnkucmVvcGVuKHJlb3Blbk9wdGlvbnMpO1xyXG5cdFx0aG9va2VkRmFjdG9yaWVzW2xvb2t1cEZhY3RvcnldID0gdHJ1ZTtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnRmFjdG9yeSBob29rZWQ6ICcgKyBsb29rdXBGYWN0b3J5KTtcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHRjYXRjaCAoZXJyKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ0ZhY3RvcnkgaG9vayBmYWlsdXJlLCB1bmV4cGVjdGVkIGVycm9yOiAnICsgbG9va3VwRmFjdG9yeSk7XHJcblx0XHRsb2dnZXIuZGVidWcoZXJyKTtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcbn07XHJcblxyXG5hcGkuZ2V0ID0gZnVuY3Rpb24gKGxvb2t1cEZhY3RvcnksIHByb3BlcnR5KSB7XHJcblx0aWYgKCFhcGkuaXNMb2FkZWQoKSkge1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdGYWN0b3J5IGdldCBmYWlsdXJlLCBFbWJlciBub3QgbG9hZGVkLicpO1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHR2YXIgcHJvcGVydGllcyA9IHByb3BlcnR5LnNwbGl0KCcuJyk7XHJcblx0dmFyIGdldHRlciA9IGFwaS5sb29rdXAobG9va3VwRmFjdG9yeSk7XHJcblxyXG5cdHByb3BlcnRpZXMuc29tZShmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuXHRcdC8vIElmIGdldHRlciBmYWlscywganVzdCBleGl0LCBvdGhlcndpc2UsIGtlZXAgbG9vcGluZy5cclxuXHRcdGlmICh0eXBlb2YgZ2V0dGVyLmdldCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZ2V0dGVyLmdldChwcm9wZXJ0eSkgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdGdldHRlciA9IGdldHRlci5nZXQocHJvcGVydHkpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIGdldHRlcltwcm9wZXJ0eV0gIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRcdGdldHRlciA9IGdldHRlcltwcm9wZXJ0eV07XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Z2V0dGVyID0gbnVsbDtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiBnZXR0ZXI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFwaTtcclxuIiwidmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJy4vbG9nZ2VyJyk7XHJcbnZhciBhcGkgPSB7fTtcclxudmFyIGVtb3RlU3RvcmUgPSBuZXcgRW1vdGVTdG9yZSgpO1xyXG52YXIgJCA9IHdpbmRvdy5qUXVlcnk7XHJcblxyXG4vKipcclxuICogVGhlIGVudGlyZSBlbW90ZSBzdG9yaW5nIHN5c3RlbS5cclxuICovXHJcbmZ1bmN0aW9uIEVtb3RlU3RvcmUoKSB7XHJcblx0dmFyIGdldHRlcnMgPSB7fTtcclxuXHR2YXIgbmF0aXZlRW1vdGVzID0ge307XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldCBhIGxpc3Qgb2YgdXNhYmxlIGVtb3RpY29ucy5cclxuXHQgKiBAcGFyYW0gIHtmdW5jdGlvbn0gW2ZpbHRlcnNdICAgICAgIEEgZmlsdGVyIG1ldGhvZCB0byBsaW1pdCB3aGF0IGVtb3RlcyBhcmUgcmV0dXJuZWQuIFBhc3NlZCB0byBBcnJheSNmaWx0ZXIuXHJcblx0ICogQHBhcmFtICB7ZnVuY3Rpb258c3RyaW5nfSBbc29ydEJ5XSBIb3cgdGhlIGVtb3RlcyBzaG91bGQgYmUgc29ydGVkLiBgZnVuY3Rpb25gIHdpbGwgYmUgcGFzc2VkIHRvIHNvcnQgdmlhIEFycmF5I3NvcnQuIGAnY2hhbm5lbCdgIHNvcnRzIGJ5IGNoYW5uZWwgbmFtZSwgZ2xvYmFscyBmaXJzdC4gQWxsIG90aGVyIHZhbHVlcyAob3Igb21pdHRlZCkgc29ydCBhbHBoYW51bWVyaWNhbGx5LlxyXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gW3JldHVyblR5cGVdICAgICAgYCdvYmplY3QnYCB3aWxsIHJldHVybiBpbiBvYmplY3QgZm9ybWF0LCBlLmcuIGB7J0thcHBhJzogRW1vdGUoLi4uKSwgLi4ufWAuIEFsbCBvdGhlciB2YWx1ZXMgKG9yIG9taXR0ZWQpIHJldHVybiBhbiBhcnJheSBmb3JtYXQsIGUuZy4gYFtFbW90ZSguLi4pLCAuLi5dYC5cclxuXHQgKiBAcmV0dXJuIHtvYmplY3R8YXJyYXl9ICAgICAgICAgICAgIFNlZSBgcmV0dXJuVHlwZWAgcGFyYW0uXHJcblx0ICovXHJcblx0dGhpcy5nZXRFbW90ZXMgPSBmdW5jdGlvbiAoZmlsdGVycywgc29ydEJ5LCByZXR1cm5UeXBlKSB7XHJcblx0XHR2YXIgdHdpdGNoQXBpID0gcmVxdWlyZSgnLi90d2l0Y2gtYXBpJyk7XHJcblxyXG5cdFx0Ly8gR2V0IG5hdGl2ZSBlbW90ZXMuXHJcblx0XHR2YXIgZW1vdGVzID0gJC5leHRlbmQoe30sIG5hdGl2ZUVtb3Rlcyk7XHJcblxyXG5cdFx0Ly8gUGFyc2UgdGhlIGN1c3RvbSBlbW90ZXMgcHJvdmlkZWQgYnkgdGhpcmQgcGFydHkgYWRkb25zLlxyXG5cdFx0T2JqZWN0LmtleXMoZ2V0dGVycykuZm9yRWFjaChmdW5jdGlvbiAoZ2V0dGVyTmFtZSkge1xyXG5cdFx0XHQvLyBUcnkgdGhlIGdldHRlci5cclxuXHRcdFx0dmFyIHJlc3VsdHMgPSBudWxsO1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHJlc3VsdHMgPSBnZXR0ZXJzW2dldHRlck5hbWVdKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZygnRW1vdGUgZ2V0dGVyIGAnICsgZ2V0dGVyTmFtZSArICdgIGZhaWxlZCB1bmV4cGVjdGVkbHksIHNraXBwaW5nLicsIGVyci50b1N0cmluZygpKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHJlc3VsdHMpKSB7XHJcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdFbW90ZSBnZXR0ZXIgYCcgKyBnZXR0ZXJOYW1lICsgJ2AgbXVzdCByZXR1cm4gYW4gYXJyYXksIHNraXBwaW5nLicpO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gT3ZlcnJpZGUgbmF0aXZlcyBhbmQgcHJldmlvdXMgZ2V0dGVycy5cclxuXHRcdFx0cmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvLyBDcmVhdGUgdGhlIGVtb3RlLlxyXG5cdFx0XHRcdFx0dmFyIGluc3RhbmNlID0gbmV3IEVtb3RlKGVtb3RlKTtcclxuXHJcblx0XHRcdFx0XHQvLyBGb3JjZSB0aGUgZ2V0dGVyLlxyXG5cdFx0XHRcdFx0aW5zdGFuY2Uuc2V0R2V0dGVyTmFtZShnZXR0ZXJOYW1lKTtcclxuXHJcblx0XHRcdFx0XHQvLyBGb3JjZSBlbW90ZXMgd2l0aG91dCBjaGFubmVscyB0byB0aGUgZ2V0dGVyJ3MgbmFtZS5cclxuXHRcdFx0XHRcdGlmICghZW1vdGUuY2hhbm5lbCkge1xyXG5cdFx0XHRcdFx0XHRpbnN0YW5jZS5zZXRDaGFubmVsTmFtZShnZXR0ZXJOYW1lKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHQvLyBBZGQvb3ZlcnJpZGUgaXQuXHJcblx0XHRcdFx0XHRlbW90ZXNbaW5zdGFuY2UuZ2V0VGV4dCgpXSA9IGluc3RhbmNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZXJyKSB7XHJcblx0XHRcdFx0XHRsb2dnZXIuZGVidWcoJ0Vtb3RlIHBhcnNpbmcgZm9yIGdldHRlciBgJyArIGdldHRlck5hbWUgKyAnYCBmYWlsZWQsIHNraXBwaW5nLicsIGVyci50b1N0cmluZygpLCBlbW90ZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIENvdmVydCB0byBhcnJheS5cclxuXHRcdGVtb3RlcyA9IE9iamVjdC5rZXlzKGVtb3RlcykubWFwKGZ1bmN0aW9uIChlbW90ZSkge1xyXG5cdFx0XHRyZXR1cm4gZW1vdGVzW2Vtb3RlXTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdC8vIEZpbHRlciByZXN1bHRzLlxyXG5cdFx0aWYgKHR5cGVvZiBmaWx0ZXJzID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdGVtb3RlcyA9IGVtb3Rlcy5maWx0ZXIoZmlsdGVycyk7XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdC8vIFJldHVybiBhcyBhbiBvYmplY3QgaWYgcmVxdWVzdGVkLlxyXG5cdFx0aWYgKHJldHVyblR5cGUgPT09ICdvYmplY3QnKSB7XHJcblx0XHRcdHZhciBhc09iamVjdCA9IHt9O1xyXG5cdFx0XHRlbW90ZXMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRhc09iamVjdFtlbW90ZS5nZXRUZXh0KCldID0gZW1vdGU7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gYXNPYmplY3Q7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gU29ydCByZXN1bHRzLlxyXG5cdFx0aWYgKHR5cGVvZiBzb3J0QnkgPT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0ZW1vdGVzLnNvcnQoc29ydEJ5KTtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHNvcnRCeSA9PT0gJ2NoYW5uZWwnKSB7XHJcblx0XHRcdGVtb3Rlcy5zb3J0KHNvcnRpbmcuYWxsRW1vdGVzQ2F0ZWdvcnkpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGVtb3Rlcy5zb3J0KHNvcnRpbmcuYnlUZXh0KTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBSZXR1cm4gdGhlIGVtb3RlcyBpbiBhcnJheSBmb3JtYXQuXHJcblx0XHRyZXR1cm4gZW1vdGVzO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIFJlZ2lzdGVycyBhIDNyZCBwYXJ0eSBlbW90ZSBob29rLlxyXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gbmFtZSAgIFRoZSBuYW1lIG9mIHRoZSAzcmQgcGFydHkgcmVnaXN0ZXJpbmcgdGhlIGhvb2suXHJcblx0ICogQHBhcmFtICB7ZnVuY3Rpb259IGdldHRlciBUaGUgZnVuY3Rpb24gY2FsbGVkIHdoZW4gbG9va2luZyBmb3IgZW1vdGVzLiBNdXN0IHJldHVybiBhbiBhcnJheSBvZiBlbW90ZSBvYmplY3RzLCBlLmcuIGBbZW1vdGUsIC4uLl1gLiBTZWUgRW1vdGUgY2xhc3MuXHJcblx0ICovXHJcblx0dGhpcy5yZWdpc3RlckdldHRlciA9IGZ1bmN0aW9uIChuYW1lLCBnZXR0ZXIpIHtcclxuXHRcdGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdOYW1lIG11c3QgYmUgYSBzdHJpbmcuJyk7XHJcblx0XHR9XHJcblx0XHRpZiAoZ2V0dGVyc1tuYW1lXSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0dldHRlciBhbHJlYWR5IGV4aXN0cy4nKTtcclxuXHRcdH1cclxuXHRcdGlmICh0eXBlb2YgZ2V0dGVyICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignR2V0dGVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcclxuXHRcdH1cclxuXHRcdGxvZ2dlci5kZWJ1ZygnR2V0dGVyIHJlZ2lzdGVyZWQ6ICcgKyBuYW1lKTtcclxuXHRcdGdldHRlcnNbbmFtZV0gPSBnZXR0ZXI7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogUmVnaXN0ZXJzIGEgM3JkIHBhcnR5IGVtb3RlIGhvb2suXHJcblx0ICogQHBhcmFtICB7c3RyaW5nfSBuYW1lICAgVGhlIG5hbWUgb2YgdGhlIDNyZCBwYXJ0eSBob29rIHRvIGRlcmVnaXN0ZXIuXHJcblx0ICovXHJcblx0dGhpcy5kZXJlZ2lzdGVyR2V0dGVyID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnR2V0dGVyIHVucmVnaXN0ZXJlZDogJyArIG5hbWUpO1xyXG5cdFx0ZGVsZXRlIGdldHRlcnNbbmFtZV07XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogSW5pdGlhbGl6ZXMgdGhlIHJhdyBkYXRhIGZyb20gdGhlIEFQSSBlbmRwb2ludHMuIFNob3VsZCBiZSBjYWxsZWQgYXQgbG9hZCBhbmQvb3Igd2hlbmV2ZXIgdGhlIEFQSSBtYXkgaGF2ZSBjaGFuZ2VkLiBQb3B1bGF0ZXMgaW50ZXJuYWwgb2JqZWN0cyB3aXRoIHVwZGF0ZWQgZGF0YS5cclxuXHQgKi9cclxuXHR0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRsb2dnZXIuZGVidWcoJ1N0YXJ0aW5nIGluaXRpYWxpemF0aW9uLicpO1xyXG5cclxuXHRcdHZhciB0d2l0Y2hBcGkgPSByZXF1aXJlKCcuL3R3aXRjaC1hcGknKTtcclxuXHRcdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0XHQvLyBIYXNoIG9mIGVtb3RlIHNldCB0byBmb3JjZWQgY2hhbm5lbC5cclxuXHRcdHZhciBmb3JjZWRTZXRzVG9DaGFubmVscyA9IHtcclxuXHRcdFx0Ly8gR2xvYmFscy5cclxuXHRcdFx0MDogJ35nbG9iYWwnLFxyXG5cdFx0XHQvLyBCdWJibGUgZW1vdGVzLlxyXG5cdFx0XHQzMzogJ3R1cmJvJyxcclxuXHRcdFx0Ly8gTW9ua2V5IGVtb3Rlcy5cclxuXHRcdFx0NDI6ICd0dXJibycsXHJcblx0XHRcdC8vIEhpZGRlbiB0dXJibyBlbW90ZXMuXHJcblx0XHRcdDQ1NzogJ3R1cmJvJyxcclxuXHRcdFx0NzkzOiAndHVyYm8nXHJcblx0XHR9O1xyXG5cclxuXHRcdGxvZ2dlci5kZWJ1ZygnSW5pdGlhbGl6aW5nIGVtb3RlIHNldCBjaGFuZ2UgbGlzdGVuZXIuJyk7XHJcblxyXG5cdFx0dHdpdGNoQXBpLm9uRW1vdGVzQ2hhbmdlKGZ1bmN0aW9uIChlbW90ZVNldHMpIHtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdQYXJzaW5nIGVtb3RlIHNldHMuJyk7XHJcblxyXG5cdFx0XHRPYmplY3Qua2V5cyhlbW90ZVNldHMpLmZvckVhY2goZnVuY3Rpb24gKHNldCkge1xyXG5cdFx0XHRcdHZhciBlbW90ZXMgPSBlbW90ZVNldHNbc2V0XTtcclxuXHRcdFx0XHRzZXQgPSBOdW1iZXIoc2V0KTtcclxuXHRcdFx0XHRlbW90ZXMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRcdC8vIFNldCBzb21lIHJlcXVpcmVkIGluZm8uXHJcblx0XHRcdFx0XHRlbW90ZS51cmwgPSAnaHR0cDovL3N0YXRpYy1jZG4uanR2bncubmV0L2Vtb3RpY29ucy92MS8nICsgZW1vdGUuaWQgKyAnLzEuMCc7XHJcblx0XHRcdFx0XHRlbW90ZS50ZXh0ID0gZ2V0RW1vdGVGcm9tUmVnRXgoZW1vdGUuY29kZSk7XHJcblx0XHRcdFx0XHRlbW90ZS5zZXQgPSBzZXQ7XHJcblxyXG5cdFx0XHRcdFx0Ly8gSGFyZGNvZGUgdGhlIGNoYW5uZWxzIG9mIGNlcnRhaW4gc2V0cy5cclxuXHRcdFx0XHRcdGlmIChmb3JjZWRTZXRzVG9DaGFubmVsc1tzZXRdKSB7XHJcblx0XHRcdFx0XHRcdGVtb3RlLmNoYW5uZWwgPSBmb3JjZWRTZXRzVG9DaGFubmVsc1tzZXRdO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdHZhciBpbnN0YW5jZSA9IG5ldyBFbW90ZShlbW90ZSk7XHJcblxyXG5cdFx0XHRcdFx0Ly8gU2F2ZSB0aGUgZW1vdGUgZm9yIHVzZSBsYXRlci5cclxuXHRcdFx0XHRcdG5hdGl2ZUVtb3Rlc1tlbW90ZS50ZXh0XSA9IGluc3RhbmNlO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGxvZ2dlci5kZWJ1ZygnTG9hZGluZyBzdWJzY3JpcHRpb24gZGF0YS4nKTtcclxuXHJcblx0XHRcdC8vIEdldCBhY3RpdmUgc3Vic2NyaXB0aW9ucyB0byBmaW5kIHRoZSBjaGFubmVscy5cclxuXHRcdFx0dHdpdGNoQXBpLmdldFRpY2tldHMoZnVuY3Rpb24gKHRpY2tldHMpIHtcclxuXHRcdFx0XHQvLyBJbnN0YW5jZXMgZnJvbSBlYWNoIGNoYW5uZWwgdG8gcHJlbG9hZCBjaGFubmVsIGRhdGEuXHJcblx0XHRcdFx0dmFyIGRlZmVycmVkQ2hhbm5lbEdldHMgPSB7fTtcclxuXHJcblx0XHRcdFx0bG9nZ2VyLmRlYnVnKCdUaWNrZXRzIGxvYWRlZCBmcm9tIHRoZSBBUEkuJywgdGlja2V0cyk7XHJcblx0XHRcdFx0dGlja2V0cy5mb3JFYWNoKGZ1bmN0aW9uICh0aWNrZXQpIHtcclxuXHRcdFx0XHRcdHZhciBwcm9kdWN0ID0gdGlja2V0LnByb2R1Y3Q7XHJcblx0XHRcdFx0XHR2YXIgY2hhbm5lbCA9IHByb2R1Y3Qub3duZXJfbmFtZSB8fCBwcm9kdWN0LnNob3J0X25hbWU7XHJcblxyXG5cdFx0XHRcdFx0Ly8gR2V0IHN1YnNjcmlwdGlvbnMgd2l0aCBlbW90ZXMgb25seS5cclxuXHRcdFx0XHRcdGlmICghcHJvZHVjdC5lbW90aWNvbnMgfHwgIXByb2R1Y3QuZW1vdGljb25zLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdC8vIFNldCB0aGUgY2hhbm5lbCBvbiB0aGUgZW1vdGVzLlxyXG5cdFx0XHRcdFx0cHJvZHVjdC5lbW90aWNvbnMuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGUpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGluc3RhbmNlID0gbmF0aXZlRW1vdGVzW2dldEVtb3RlRnJvbVJlZ0V4KGVtb3RlLnJlZ2V4KV07XHJcblx0XHRcdFx0XHRcdGluc3RhbmNlLnNldENoYW5uZWxOYW1lKGNoYW5uZWwpO1xyXG5cclxuXHRcdFx0XHRcdFx0Ly8gU2F2ZSBpbnN0YW5jZSBmb3IgbGF0ZXIsIGJ1dCBvbmx5IG9uZSBpbnN0YW5jZSBwZXIgY2hhbm5lbC5cclxuXHRcdFx0XHRcdFx0aWYgKCFkZWZlcnJlZENoYW5uZWxHZXRzW2NoYW5uZWxdKSB7XHJcblx0XHRcdFx0XHRcdFx0ZGVmZXJyZWRDaGFubmVsR2V0c1tjaGFubmVsXSA9IGluc3RhbmNlO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0Ly8gUHJlbG9hZCBjaGFubmVsIGRhdGEuXHJcblx0XHRcdFx0T2JqZWN0LmtleXMoZGVmZXJyZWRDaGFubmVsR2V0cykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XHJcblx0XHRcdFx0XHR2YXIgaW5zdGFuY2UgPSBkZWZlcnJlZENoYW5uZWxHZXRzW2tleV07XHJcblx0XHRcdFx0XHRpbnN0YW5jZS5nZXRDaGFubmVsQmFkZ2UoKTtcclxuXHRcdFx0XHRcdGluc3RhbmNlLmdldENoYW5uZWxEaXNwbGF5TmFtZSgpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0sIHRydWUpO1xyXG5cdH07XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyBhIHNwZWNpZmljIGVtb3RlLCBpZiBhdmFpbGFibGUuXHJcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgIHRleHQgVGhlIHRleHQgb2YgdGhlIGVtb3RlIHRvIGdldC5cclxuICogQHJldHVybiB7RW1vdGV8bnVsbH0gICAgICBUaGUgRW1vdGUgaW5zdGFuY2Ugb2YgdGhlIGVtb3RlIG9yIGBudWxsYCBpZiBpdCBjb3VsZG4ndCBiZSBmb3VuZC5cclxuICovXHJcbkVtb3RlU3RvcmUucHJvdG90eXBlLmdldEVtb3RlID0gZnVuY3Rpb24gKHRleHQpIHtcclxuXHRyZXR1cm4gdGhpcy5nZXRFbW90ZXMobnVsbCwgbnVsbCwgJ29iamVjdCcpW3RleHRdIHx8IG51bGw7XHJcbn07XHJcblxyXG4vKipcclxuICogRW1vdGUgb2JqZWN0LlxyXG4gKiBAcGFyYW0ge29iamVjdH0gZGV0YWlscyAgICAgICAgICAgICAgT2JqZWN0IGRlc2NyaWJpbmcgdGhlIGVtb3RlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGV0YWlscy50ZXh0ICAgICAgICAgVGhlIHRleHQgdG8gdXNlIGluIHRoZSBjaGF0IGJveCB3aGVuIGVtb3RlIGlzIGNsaWNrZWQuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkZXRhaWxzLnVybCAgICAgICAgICBUaGUgVVJMIG9mIHRoZSBpbWFnZSBmb3IgdGhlIGVtb3RlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RldGFpbHMuYmFkZ2VdICAgICAgVGhlIFVSTCBvZiB0aGUgYmFkZ2UgZm9yIHRoZSBlbW90ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IFtkZXRhaWxzLmNoYW5uZWxdICAgIFRoZSBjaGFubmVsIHRoZSBlbW90ZSBzaG91bGQgYmUgY2F0ZWdvcml6ZWQgdW5kZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZGV0YWlscy5nZXR0ZXJOYW1lXSBUaGUgM3JkIHBhcnR5IGdldHRlciB0aGF0IHJlZ2lzdGVyZWQgdGhlIGVtb3RlLiBVc2VkIGludGVybmFsbHkgb25seS5cclxuICovXHJcbmZ1bmN0aW9uIEVtb3RlKGRldGFpbHMpIHtcclxuXHR2YXIgdGV4dCA9IG51bGw7XHJcblx0dmFyIHVybCA9IG51bGw7XHJcblx0dmFyIGdldHRlck5hbWUgPSBudWxsO1xyXG5cdHZhciBjaGFubmVsID0ge1xyXG5cdFx0bmFtZTogbnVsbCxcclxuXHRcdGJhZGdlOiBudWxsXHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0cyB0aGUgdGV4dCBvZiB0aGUgZW1vdGUuXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgZW1vdGUgdGV4dC5cclxuXHQgKi9cclxuXHR0aGlzLmdldFRleHQgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gdGV4dDtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSB0ZXh0IG9mIHRoZSBlbW90ZS5cclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGhlVGV4dCBUaGUgdGV4dCB0byBzZXQuXHJcblx0ICovXHJcblx0dGhpcy5zZXRUZXh0ID0gZnVuY3Rpb24gKHRoZVRleHQpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlVGV4dCAhPT0gJ3N0cmluZycgfHwgdGhlVGV4dC5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0ZXh0Jyk7XHJcblx0XHR9XHJcblx0XHR0ZXh0ID0gdGhlVGV4dDtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBHZXRzIHRoZSBnZXR0ZXIgbmFtZSB0aGlzIGVtb3RlIGJlbG9uZ3MgdG8uXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgZ2V0dGVyJ3MgbmFtZS5cclxuXHQgKi9cclxuXHR0aGlzLmdldEdldHRlck5hbWUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gZ2V0dGVyTmFtZTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBnZXR0ZXIgbmFtZSB0aGlzIGVtb3RlIGJlbG9uZ3MgdG8uXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHRoZUdldHRlck5hbWUgVGhlIGdldHRlcidzIG5hbWUuXHJcblx0ICovXHJcblx0dGhpcy5zZXRHZXR0ZXJOYW1lID0gZnVuY3Rpb24gKHRoZUdldHRlck5hbWUpIHtcclxuXHRcdGlmICh0eXBlb2YgdGhlR2V0dGVyTmFtZSAhPT0gJ3N0cmluZycgfHwgdGhlR2V0dGVyTmFtZS5sZW5ndGggPCAxKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBnZXR0ZXIgbmFtZScpO1xyXG5cdFx0fVxyXG5cdFx0Z2V0dGVyTmFtZSA9IHRoZUdldHRlck5hbWU7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0cyB0aGUgZW1vdGUncyBpbWFnZSBVUkwuXHJcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgZW1vdGUgaW1hZ2UgVVJMLlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0VXJsID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuIHVybDtcclxuXHR9O1xyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIGVtb3RlJ3MgaW1hZ2UgVVJMLlxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0aGVVcmwgVGhlIGltYWdlIFVSTCB0byBzZXQuXHJcblx0ICovXHJcblx0dGhpcy5zZXRVcmwgPSBmdW5jdGlvbiAodGhlVXJsKSB7XHJcblx0XHRpZiAodHlwZW9mIHRoZVVybCAhPT0gJ3N0cmluZycgfHwgdGhlVXJsLmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFVSTCcpO1xyXG5cdFx0fVxyXG5cdFx0dXJsID0gdGhlVXJsO1xyXG5cdH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIEdldHMgdGhlIGVtb3RlJ3MgY2hhbm5lbCBuYW1lLlxyXG5cdCAqIEByZXR1cm4ge3N0cmluZ3xudWxsfSBUaGUgZW1vdGUncyBjaGFubmVsIG9yIGBudWxsYCBpZiBpdCBkb2Vzbid0IGhhdmUgb25lLlxyXG5cdCAqL1xyXG5cdHRoaXMuZ2V0Q2hhbm5lbE5hbWUgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIWNoYW5uZWwubmFtZSkge1xyXG5cdFx0XHRjaGFubmVsLm5hbWUgPSBzdG9yYWdlLmNoYW5uZWxOYW1lcy5nZXQodGhpcy5nZXRUZXh0KCkpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGNoYW5uZWwubmFtZTtcclxuXHR9O1xyXG5cdC8qKlxyXG5cdCAqIFNldHMgdGhlIGVtb3RlJ3MgY2hhbm5lbCBuYW1lLlxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0aGVDaGFubmVsIFRoZSBjaGFubmVsIG5hbWUgdG8gc2V0LlxyXG5cdCAqL1xyXG5cdHRoaXMuc2V0Q2hhbm5lbE5hbWUgPSBmdW5jdGlvbiAodGhlQ2hhbm5lbCkge1xyXG5cdFx0aWYgKHR5cGVvZiB0aGVDaGFubmVsICE9PSAnc3RyaW5nJyB8fCB0aGVDaGFubmVsLmxlbmd0aCA8IDEpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNoYW5uZWwnKTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBPbmx5IHNhdmUgdGhlIGNoYW5uZWwgdG8gc3RvcmFnZSBpZiBpdCdzIGR5bmFtaWMuXHJcblx0XHRpZiAodGhlQ2hhbm5lbCAhPT0gJ35nbG9iYWwnICYmIHRoZUNoYW5uZWwgIT09ICd0dXJibycpIHtcclxuXHRcdFx0c3RvcmFnZS5jaGFubmVsTmFtZXMuc2V0KHRoaXMuZ2V0VGV4dCgpLCB0aGVDaGFubmVsKTtcclxuXHRcdH1cclxuXHRcdGNoYW5uZWwubmFtZSA9IHRoZUNoYW5uZWw7XHJcblx0fTtcclxuXHJcblx0LyoqXHJcblx0ICogR2V0cyB0aGUgZW1vdGUgY2hhbm5lbCdzIGJhZGdlIGltYWdlIFVSTC5cclxuXHQgKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH0gVGhlIFVSTCBvZiB0aGUgYmFkZ2UgaW1hZ2UgZm9yIHRoZSBlbW90ZSdzIGNoYW5uZWwgb3IgYG51bGxgIGlmIGl0IGRvZXNuJ3QgaGF2ZSBhIGNoYW5uZWwuXHJcblx0ICovXHJcblx0dGhpcy5nZXRDaGFubmVsQmFkZ2UgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgdHdpdGNoQXBpID0gcmVxdWlyZSgnLi90d2l0Y2gtYXBpJyk7XHJcblx0XHR2YXIgY2hhbm5lbE5hbWUgPSB0aGlzLmdldENoYW5uZWxOYW1lKCk7XHJcblx0XHR2YXIgZGVmYXVsdEJhZGdlID0gJ2h0dHA6Ly9zdGF0aWMtY2RuLmp0dm53Lm5ldC9qdHZfdXNlcl9waWN0dXJlcy9zdWJzY3JpYmVyLXN0YXIucG5nJztcclxuXHJcblx0XHQvLyBObyBjaGFubmVsLlxyXG5cdFx0aWYgKCFjaGFubmVsTmFtZSkge1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHaXZlIGdsb2JhbHMgYSBkZWZhdWx0IGJhZGdlLlxyXG5cdFx0aWYgKGNoYW5uZWxOYW1lID09PSAnfmdsb2JhbCcpIHtcclxuXHRcdFx0cmV0dXJuIGRlZmF1bHRCYWRnZTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBBbHJlYWR5IGhhdmUgb25lIHByZXNldC5cclxuXHRcdGlmIChjaGFubmVsLmJhZGdlKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmJhZGdlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIENoZWNrIHN0b3JhZ2UuXHJcblx0XHRjaGFubmVsLmJhZGdlID0gc3RvcmFnZS5iYWRnZXMuZ2V0KGNoYW5uZWxOYW1lKTtcclxuXHRcdGlmIChjaGFubmVsLmJhZGdlICE9PSBudWxsKSB7XHJcblx0XHRcdHJldHVybiBjaGFubmVsLmJhZGdlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCBmcm9tIEFQSS5cclxuXHRcdHR3aXRjaEFwaS5nZXRCYWRnZXMoY2hhbm5lbE5hbWUsIGZ1bmN0aW9uIChiYWRnZXMpIHtcclxuXHRcdFx0dmFyIGJhZGdlID0gbnVsbDtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdHZXR0aW5nIGZyZXNoIGJhZGdlIGZvciB1c2VyJywgY2hhbm5lbE5hbWUsIGJhZGdlcyk7XHJcblxyXG5cdFx0XHQvLyBTYXZlIHR1cmJvIGJhZGdlIHdoaWxlIHdlIGFyZSBoZXJlLlxyXG5cdFx0XHRpZiAoYmFkZ2VzLnR1cmJvICYmIGJhZGdlcy50dXJiby5pbWFnZSkge1xyXG5cdFx0XHRcdGJhZGdlID0gYmFkZ2VzLnR1cmJvLmltYWdlO1xyXG5cdFx0XHRcdHN0b3JhZ2UuYmFkZ2VzLnNldCgndHVyYm8nLCBiYWRnZSwgODY0MDAwMDApO1xyXG5cclxuXHRcdFx0XHQvLyBUdXJibyBpcyBhY3R1YWxseSB3aGF0IHdlIHdhbnRlZCwgc28gd2UgYXJlIGRvbmUuXHJcblx0XHRcdFx0aWYgKGNoYW5uZWxOYW1lID09PSAndHVyYm8nKSB7XHJcblx0XHRcdFx0XHRjaGFubmVsLmJhZGdlID0gYmFkZ2U7XHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBTYXZlIHN1YnNjcmliZXIgYmFkZ2UgaW4gc3RvcmFnZS5cclxuXHRcdFx0aWYgKGJhZGdlcy5zdWJzY3JpYmVyICYmIGJhZGdlcy5zdWJzY3JpYmVyLmltYWdlKSB7XHJcblx0XHRcdFx0Y2hhbm5lbC5iYWRnZSA9IGJhZGdlcy5zdWJzY3JpYmVyLmltYWdlO1xyXG5cdFx0XHRcdHN0b3JhZ2UuYmFkZ2VzLnNldChjaGFubmVsTmFtZSwgY2hhbm5lbC5iYWRnZSwgODY0MDAwMDApO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIE5vIHN1YnNjcmliZXIgYmFkZ2UuXHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZygnRmFpbGVkIHRvIGdldCBzdWJzY3JpYmVyIGJhZGdlLicsIGNoYW5uZWxOYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRcclxuXHRcdHJldHVybiBjaGFubmVsLmJhZGdlIHx8IGRlZmF1bHRCYWRnZTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBTZXRzIHRoZSBlbW90ZSdzIGNoYW5uZWwgYmFkZ2UgaW1hZ2UgVVJMLlxyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0aGVCYWRnZSBUaGUgYmFkZ2UgaW1hZ2UgVVJMIHRvIHNldC5cclxuXHQgKi9cclxuXHR0aGlzLnNldENoYW5uZWxCYWRnZSA9IGZ1bmN0aW9uICh0aGVCYWRnZSkge1xyXG5cdFx0aWYgKHR5cGVvZiB0aGVCYWRnZSAhPT0gJ3N0cmluZycgfHwgdGhlQmFkZ2UubGVuZ3RoIDwgMSkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYmFkZ2UnKTtcclxuXHRcdH1cclxuXHRcdGNoYW5uZWwuYmFkZ2UgPSB0aGVCYWRnZTtcclxuXHR9O1xyXG5cclxuXHQvKipcclxuXHQgKiBJbml0aWFsaXplIHRoZSBkZXRhaWxzLlxyXG5cdCAqL1xyXG5cdFxyXG5cdC8vIFJlcXVpcmVkIGZpZWxkcy5cclxuXHR0aGlzLnNldFRleHQoZGV0YWlscy50ZXh0KTtcclxuXHR0aGlzLnNldFVybChkZXRhaWxzLnVybCk7XHJcblxyXG5cdC8vIE9wdGlvbmFsIGZpZWxkcy5cclxuXHRpZiAoZGV0YWlscy5nZXR0ZXJOYW1lKSB7XHJcblx0XHR0aGlzLnNldEdldHRlck5hbWUoZGV0YWlscy5nZXR0ZXJOYW1lKTtcclxuXHR9XHJcblx0aWYgKGRldGFpbHMuY2hhbm5lbCkge1xyXG5cdFx0dGhpcy5zZXRDaGFubmVsTmFtZShkZXRhaWxzLmNoYW5uZWwpO1xyXG5cdH1cclxuXHRpZiAoZGV0YWlscy5iYWRnZSkge1xyXG5cdFx0dGhpcy5zZXRDaGFubmVsQmFkZ2UoZGV0YWlscy5iYWRnZSk7XHJcblx0fVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXRlIGNoYW5nZXJzLlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBUb2dnbGUgd2hldGhlciBhbiBlbW90ZSBzaG91bGQgYmUgYSBmYXZvcml0ZS5cclxuICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIGB0cnVlYCBmb3JjZXMgdGhlIGVtb3RlIHRvIGJlIGEgZmF2b3JpdGUsIGBmYWxzZWAgZm9yY2VzIHRoZSBlbW90ZSB0byBub3QgYmUgYSBmYXZvcml0ZS5cclxuICovXHJcbkVtb3RlLnByb3RvdHlwZS50b2dnbGVGYXZvcml0ZSA9IGZ1bmN0aW9uIChmb3JjZSkge1xyXG5cdGlmICh0eXBlb2YgZm9yY2UgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRzdG9yYWdlLnN0YXJyZWQuc2V0KHRoaXMuZ2V0VGV4dCgpLCAhIWZvcmNlKTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblx0c3RvcmFnZS5zdGFycmVkLnNldCh0aGlzLmdldFRleHQoKSwgIXRoaXMuaXNGYXZvcml0ZSgpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUb2dnbGUgd2hldGhlciBhbiBlbW90ZSBzaG91bGQgYmUgdmlzaWJsZSBvdXQgb2YgZWRpdGluZyBtb2RlLlxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZV0gYHRydWVgIGZvcmNlcyB0aGUgZW1vdGUgdG8gYmUgdmlzaWJsZSwgYGZhbHNlYCBmb3JjZXMgdGhlIGVtb3RlIHRvIGJlIGhpZGRlbi5cclxuICovXHJcbkVtb3RlLnByb3RvdHlwZS50b2dnbGVWaXNpYmlsaXR5ID0gZnVuY3Rpb24gKGZvcmNlKSB7XHJcblx0aWYgKHR5cGVvZiBmb3JjZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdHN0b3JhZ2UudmlzaWJpbGl0eS5zZXQodGhpcy5nZXRUZXh0KCksICEhZm9yY2UpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHRzdG9yYWdlLnZpc2liaWxpdHkuc2V0KHRoaXMuZ2V0VGV4dCgpLCAhdGhpcy5pc1Zpc2libGUoKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhdGUgZ2V0dGVycy5cclxuICovXHJcblxyXG4vKipcclxuICogV2hldGhlciB0aGUgZW1vdGUgaXMgZnJvbSBhIDNyZCBwYXJ0eS5cclxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZW1vdGUgaXMgZnJvbSBhIDNyZCBwYXJ0eS5cclxuICovXHJcbkVtb3RlLnByb3RvdHlwZS5pc1RoaXJkUGFydHkgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuICEhdGhpcy5nZXRHZXR0ZXJOYW1lKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogV2hldGhlciB0aGUgZW1vdGUgd2FzIGZhdm9yaXRlZC5cclxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZW1vdGUgd2FzIGZhdm9yaXRlZC5cclxuICovXHJcbkVtb3RlLnByb3RvdHlwZS5pc0Zhdm9yaXRlID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiBzdG9yYWdlLnN0YXJyZWQuZ2V0KHRoaXMuZ2V0VGV4dCgpLCBmYWxzZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogV2hldGhlciB0aGUgZW1vdGUgaXMgdmlzaWJsZSBvdXRzaWRlIG9mIGVkaXRpbmcgbW9kZS5cclxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgZW1vdGUgaXMgdmlzaWJsZSBvdXRzaWRlIG9mIGVkaXRpbmcgbW9kZS5cclxuICovXHJcbkVtb3RlLnByb3RvdHlwZS5pc1Zpc2libGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHN0b3JhZ2UudmlzaWJpbGl0eS5nZXQodGhpcy5nZXRUZXh0KCksIHRydWUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFdoZXRoZXIgdGhlIGVtb3RlIGlzIGNvbnNpZGVyZWQgYSBzaW1wbGUgc21pbGV5LlxyXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBlbW90ZSBpcyBjb25zaWRlcmVkIGEgc2ltcGxlIHNtaWxleS5cclxuICovXHJcbkVtb3RlLnByb3RvdHlwZS5pc1NtaWxleSA9IGZ1bmN0aW9uICgpIHtcclxuXHQvLyBUaGUgYmFzaWMgc21pbGV5IGVtb3Rlcy5cclxuXHR2YXIgZW1vdGVzID0gWyc6KCcsICc6KScsICc6LycsICc6XFxcXCcsICc6RCcsICc6bycsICc6cCcsICc6eicsICc7KScsICc7cCcsICc8MycsICc+KCcsICdCKScsICdSKScsICdvX28nLCAnIy8nLCAnOjcnLCAnOj4nLCAnOlMnLCAnPF0nXTtcclxuXHRyZXR1cm4gZW1vdGVzLmluZGV4T2YodGhpcy5nZXRUZXh0KCkpICE9PSAtMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQcm9wZXJ0eSBnZXR0ZXJzL3NldHRlcnMuXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEdldCBhIGNoYW5uZWwncyBkaXNwbGF5IG5hbWUuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGNoYW5uZWwncyBkaXNwbGF5IG5hbWUuIE1heSBiZSBlcXVpdmFsZW50IHRvIHRoZSBjaGFubmVsIHRoZSBmaXJzdCB0aW1lIHRoZSBBUEkgbmVlZHMgdG8gYmUgY2FsbGVkLlxyXG4gKi9cclxuRW1vdGUucHJvdG90eXBlLmdldENoYW5uZWxEaXNwbGF5TmFtZSA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgdHdpdGNoQXBpID0gcmVxdWlyZSgnLi90d2l0Y2gtYXBpJyk7XHJcblx0dmFyIGNoYW5uZWxOYW1lID0gdGhpcy5nZXRDaGFubmVsTmFtZSgpO1xyXG5cdHZhciBkaXNwbGF5TmFtZSA9IG51bGw7XHJcblxyXG5cdHZhciBmb3JjZWRDaGFubmVsVG9EaXNwbGF5TmFtZXMgPSB7XHJcblx0XHQnfmdsb2JhbCc6ICdHbG9iYWwnLFxyXG5cdFx0J3R1cmJvJzogJ1R1cmJvJ1xyXG5cdH07XHJcblxyXG5cdC8vIE5vIGNoYW5uZWwuXHJcblx0aWYgKCFjaGFubmVsTmFtZSkge1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG5cclxuXHQvLyBGb3JjZWQgZGlzcGxheSBuYW1lLlxyXG5cdGlmIChmb3JjZWRDaGFubmVsVG9EaXNwbGF5TmFtZXNbY2hhbm5lbE5hbWVdKSB7XHJcblx0XHRyZXR1cm4gZm9yY2VkQ2hhbm5lbFRvRGlzcGxheU5hbWVzW2NoYW5uZWxOYW1lXTtcclxuXHR9XHJcblxyXG5cdC8vIENoZWNrIHN0b3JhZ2UuXHJcblx0ZGlzcGxheU5hbWUgPSBzdG9yYWdlLmRpc3BsYXlOYW1lcy5nZXQoY2hhbm5lbE5hbWUpO1xyXG5cdGlmIChkaXNwbGF5TmFtZSAhPT0gbnVsbCkge1xyXG5cdFx0cmV0dXJuIGRpc3BsYXlOYW1lO1xyXG5cdH1cclxuXHQvLyBHZXQgZnJvbSBBUEkuXHJcblx0ZWxzZSB7XHJcblx0XHR0d2l0Y2hBcGkuZ2V0VXNlcihjaGFubmVsTmFtZSwgZnVuY3Rpb24gKHVzZXIpIHtcclxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdHZXR0aW5nIGZyZXNoIGRpc3BsYXkgbmFtZSBmb3IgdXNlcicsIHVzZXIpO1xyXG5cdFx0XHRkaXNwbGF5TmFtZSA9IHVzZXIuZGlzcGxheV9uYW1lO1xyXG5cdFx0XHQvLyBTYXZlIGluIHN0b3JhZ2UuXHJcblx0XHRcdHN0b3JhZ2UuZGlzcGxheU5hbWVzLnNldChjaGFubmVsTmFtZSwgZGlzcGxheU5hbWUsIDg2NDAwMDAwKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHRcclxuXHRyZXR1cm4gZGlzcGxheU5hbWUgfHwgY2hhbm5lbE5hbWU7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgdXNhYmxlIGVtb3RlIHRleHQgZnJvbSBhIHJlZ2V4LlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RW1vdGVGcm9tUmVnRXgocmVnZXgpIHtcclxuXHRpZiAodHlwZW9mIHJlZ2V4ID09PSAnc3RyaW5nJykge1xyXG5cdFx0cmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4KTtcclxuXHR9XHJcblx0aWYgKCFyZWdleCkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdgcmVnZXhgIG11c3QgYmUgYSBSZWdFeHAgc3RyaW5nIG9yIG9iamVjdC4nKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBkZWNvZGVVUkkocmVnZXguc291cmNlKVxyXG5cclxuXHRcdC8vIFJlcGxhY2UgSFRNTCBlbnRpdHkgYnJhY2tldHMgd2l0aCBhY3R1YWwgYnJhY2tldHMuXHJcblx0XHQucmVwbGFjZSgnJmd0XFxcXDsnLCAnPicpXHJcblx0XHQucmVwbGFjZSgnJmx0XFxcXDsnLCAnPCcpXHJcblxyXG5cdFx0Ly8gUmVtb3ZlIG5lZ2F0aXZlIGdyb3Vwcy5cclxuXHRcdC8vXHJcblx0XHQvLyAvXHJcblx0XHQvLyAgIFxcKFxcPyEgICAgICAgICAgICAgIC8vICg/IVxyXG5cdFx0Ly8gICBbXildKiAgICAgICAgICAgICAgLy8gYW55IGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCApXHJcblx0XHQvLyAgIFxcKSAgICAgICAgICAgICAgICAgLy8gKVxyXG5cdFx0Ly8gL2dcclxuXHRcdC5yZXBsYWNlKC9cXChcXD8hW14pXSpcXCkvZywgJycpXHJcblxyXG5cdFx0Ly8gUGljayBmaXJzdCBvcHRpb24gZnJvbSBhIGdyb3VwLlxyXG5cdFx0Ly9cclxuXHRcdC8vIC9cclxuXHRcdC8vICAgXFwoICAgICAgICAgICAgICAgICAvLyAoXHJcblx0XHQvLyAgIChbXnxdKSogICAgICAgICAgICAvLyBhbnkgYW1vdW50IG9mIGNoYXJhY3RlcnMgdGhhdCBhcmUgbm90IHxcclxuXHRcdC8vICAgXFx8PyAgICAgICAgICAgICAgICAvLyBhbiBvcHRpb25hbCB8IGNoYXJhY3RlclxyXG5cdFx0Ly8gICBbXildKiAgICAgICAgICAgICAgLy8gYW55IGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCApXHJcblx0XHQvLyAgIFxcKSAgICAgICAgICAgICAgICAgLy8gKVxyXG5cdFx0Ly8gL2dcclxuXHRcdC5yZXBsYWNlKC9cXCgoW158XSkqXFx8P1teKV0qXFwpL2csICckMScpXHJcblxyXG5cdFx0Ly8gUGljayBmaXJzdCBjaGFyYWN0ZXIgZnJvbSBhIGNoYXJhY3RlciBncm91cC5cclxuXHRcdC8vXHJcblx0XHQvLyAvXHJcblx0XHQvLyAgIFxcWyAgICAgICAgICAgICAgICAgLy8gW1xyXG5cdFx0Ly8gICAoW158XSkqICAgICAgICAgICAgLy8gYW55IGFtb3VudCBvZiBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vdCB8XHJcblx0XHQvLyAgIFxcfD8gICAgICAgICAgICAgICAgLy8gYW4gb3B0aW9uYWwgfCBjaGFyYWN0ZXJcclxuXHRcdC8vICAgW15cXF1dKiAgICAgICAgICAgICAvLyBhbnkgYW1vdW50IG9mIGNoYXJhY3RlcnMgdGhhdCBhcmUgbm90IF1cclxuXHRcdC8vICAgXFxdICAgICAgICAgICAgICAgICAvLyBdXHJcblx0XHQvLyAvZ1xyXG5cdFx0LnJlcGxhY2UoL1xcWyhbXnxdKSpcXHw/W15cXF1dKlxcXS9nLCAnJDEnKVxyXG5cclxuXHRcdC8vIFJlbW92ZSBvcHRpb25hbCBjaGFyYWN0ZXJzLlxyXG5cdFx0Ly9cclxuXHRcdC8vIC9cclxuXHRcdC8vICAgW15cXFxcXSAgICAgICAgICAgICAgLy8gYW55IGNoYXJhY3RlciB0aGF0IGlzIG5vdCBcXFxyXG5cdFx0Ly8gICBcXD8gICAgICAgICAgICAgICAgIC8vID9cclxuXHRcdC8vIC9nXHJcblx0XHQucmVwbGFjZSgvW15cXFxcXVxcPy9nLCAnJylcclxuXHJcblx0XHQvLyBSZW1vdmUgYm91bmRhcmllcyBhdCBiZWdpbm5pbmcgYW5kIGVuZC5cclxuXHRcdC5yZXBsYWNlKC9eXFxcXGJ8XFxcXGIkL2csICcnKSBcclxuXHJcblx0XHQvLyBVbmVzY2FwZSBvbmx5IHNpbmdsZSBiYWNrc2xhc2gsIG5vdCBtdWx0aXBsZS5cclxuXHRcdC8vXHJcblx0XHQvLyAvXHJcblx0XHQvLyAgIFxcXFwgICAgICAgICAgICAgICAgIC8vIFxcXHJcblx0XHQvLyAgICg/IVxcXFwpICAgICAgICAgICAgIC8vIGxvb2stYWhlYWQsIGFueSBjaGFyYWN0ZXIgdGhhdCBpc24ndCBcXFxyXG5cdFx0Ly8gL2dcclxuXHRcdC5yZXBsYWNlKC9cXFxcKD8hXFxcXCkvZywgJycpO1xyXG59XHJcblxyXG52YXIgc29ydGluZyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIFNvcnQgYnkgYWxwaGFudW1lcmljIGluIHRoaXMgb3JkZXI6IHN5bWJvbHMgLT4gbnVtYmVycyAtPiBBYUJiLi4uIC0+IG51bWJlcnNcclxuICovXHJcbnNvcnRpbmcuYnlUZXh0ID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuXHR0ZXh0QSA9IGEuZ2V0VGV4dCgpLnRvTG93ZXJDYXNlKCk7XHJcblx0dGV4dEIgPSBiLmdldFRleHQoKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuXHRpZiAodGV4dEEgPCB0ZXh0Qikge1xyXG5cdFx0cmV0dXJuIC0xO1xyXG5cdH1cclxuXHRpZiAodGV4dEEgPiB0ZXh0Qikge1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cdHJldHVybiAwO1xyXG59XHJcblxyXG4vKipcclxuICogQmFzaWMgc21pbGllcyBiZWZvcmUgbm9uLWJhc2ljIHNtaWxpZXMuXHJcbiAqL1xyXG5zb3J0aW5nLmJ5U21pbGV5ID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuXHRpZiAoYS5pc1NtaWxleSgpICYmXHQhYi5pc1NtaWxleSgpKSB7XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fVxyXG5cdGlmIChiLmlzU21pbGV5KCkgJiZcdCFhLmlzU21pbGV5KCkpIHtcclxuXHRcdHJldHVybiAxO1xyXG5cdH1cclxuXHRyZXR1cm4gMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHbG9iYWxzIGJlZm9yZSBzdWJzY3JpcHRpb24gZW1vdGVzLCBzdWJzY3JpcHRpb25zIGluIGFscGhhYmV0aWNhbCBvcmRlci5cclxuICovXHJcbnNvcnRpbmcuYnlDaGFubmVsTmFtZSA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcblx0dmFyIGNoYW5uZWxBID0gYS5nZXRDaGFubmVsTmFtZSgpO1xyXG5cdHZhciBjaGFubmVsQiA9IGIuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHJcblx0Ly8gQm90aCBkb24ndCBoYXZlIGNoYW5uZWxzLlxyXG5cdGlmICghY2hhbm5lbEEgJiYgIWNoYW5uZWxCKSB7XHJcblx0XHRyZXR1cm4gMDtcclxuXHR9XHJcblxyXG5cdC8vIFwiQVwiIGhhcyBjaGFubmVsLCBcIkJcIiBkb2Vzbid0LlxyXG5cdGlmIChjaGFubmVsQSAmJiAhY2hhbm5lbEIpIHtcclxuXHRcdHJldHVybiAxO1xyXG5cdH1cclxuXHQvLyBcIkJcIiBoYXMgY2hhbm5lbCwgXCJBXCIgZG9lc24ndC5cclxuXHRpZiAoY2hhbm5lbEIgJiYgIWNoYW5uZWxBKSB7XHJcblx0XHRyZXR1cm4gLTE7XHJcblx0fVxyXG5cclxuXHRjaGFubmVsQSA9IGNoYW5uZWxBLnRvTG93ZXJDYXNlKCk7XHJcblx0Y2hhbm5lbEIgPSBjaGFubmVsQi50b0xvd2VyQ2FzZSgpO1xyXG5cclxuXHRpZiAoY2hhbm5lbEEgPCBjaGFubmVsQikge1xyXG5cdFx0cmV0dXJuIC0xO1xyXG5cdH1cclxuXHRpZiAoY2hhbm5lbEIgPiBjaGFubmVsQSkge1xyXG5cdFx0cmV0dXJuIDE7XHJcblx0fVxyXG5cclxuXHQvLyBBbGwgdGhlIHNhbWVcclxuXHRyZXR1cm4gMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgZ2VuZXJhbCBzb3J0IG9yZGVyIGZvciB0aGUgYWxsIGVtb3RlcyBjYXRlZ29yeS5cclxuICogU21pbGV5cyAtPiBDaGFubmVsIGdyb3VwaW5nIC0+IGFscGhhbnVtZXJpY1xyXG4gKi9cclxuc29ydGluZy5hbGxFbW90ZXNDYXRlZ29yeSA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcblx0dmFyIGJ5U21pbGV5ID0gc29ydGluZy5ieVNtaWxleShhLCBiKTtcclxuXHR2YXIgYnlDaGFubmVsTmFtZSAgPSBzb3J0aW5nLmJ5Q2hhbm5lbE5hbWUoYSwgYik7XHJcblx0dmFyIGJ5VGV4dCA9IHNvcnRpbmcuYnlUZXh0KGEsIGIpO1xyXG5cclxuXHRpZiAoYnlTbWlsZXkgIT09IDApIHtcclxuXHRcdHJldHVybiBieVNtaWxleTtcclxuXHR9XHJcblx0aWYgKGJ5Q2hhbm5lbE5hbWUgIT09IDApIHtcclxuXHRcdHJldHVybiBieUNoYW5uZWxOYW1lO1xyXG5cdH1cclxuXHRyZXR1cm4gYnlUZXh0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBlbW90ZVN0b3JlO1xyXG4iLCJ2YXIgYXBpID0ge307XHJcbnZhciBwcmVmaXggPSAnW0Vtb3RlIE1lbnVdICc7XHJcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcblxyXG5hcGkubG9nID0gZnVuY3Rpb24gKCkge1xyXG5cdGlmICh0eXBlb2YgY29uc29sZS5sb2cgPT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdGFyZ3VtZW50cyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5tYXAoZnVuY3Rpb24gKGFyZykge1xyXG5cdFx0aWYgKHR5cGVvZiBhcmcgIT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdHJldHVybiBKU09OLnN0cmluZ2lmeShhcmcpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGFyZztcclxuXHR9KTtcclxuXHRhcmd1bWVudHMudW5zaGlmdChwcmVmaXgpO1xyXG5cdGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5hcGkuZGVidWcgPSBmdW5jdGlvbiAoKSB7XHJcblx0aWYgKCFzdG9yYWdlLmdsb2JhbC5nZXQoJ2RlYnVnTWVzc2FnZXNFbmFibGVkJywgZmFsc2UpKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdGFyZ3VtZW50cyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuXHRhcmd1bWVudHMudW5zaGlmdCgnW0RFQlVHXSAnKTtcclxuXHRhcGkubG9nLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXBpO1xyXG4iLCJ2YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKTtcclxudmFyIGVtb3RlcyA9IHJlcXVpcmUoJy4vZW1vdGVzJyk7XHJcbnZhciBhcGkgPSB7fTtcclxuXHJcbmFwaS50b2dnbGVEZWJ1ZyA9IGZ1bmN0aW9uIChmb3JjZWQpIHtcclxuXHRpZiAodHlwZW9mIGZvcmNlZCA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuXHRcdGZvcmNlZCA9ICFzdG9yYWdlLmdsb2JhbC5nZXQoJ2RlYnVnTWVzc2FnZXNFbmFibGVkJywgZmFsc2UpO1xyXG5cdH1cclxuXHRlbHNlIHtcclxuXHRcdGZvcmNlZCA9ICEhZm9yY2VkO1xyXG5cdH1cclxuXHRzdG9yYWdlLmdsb2JhbC5zZXQoJ2RlYnVnTWVzc2FnZXNFbmFibGVkJywgZm9yY2VkKTtcclxuXHRsb2dnZXIubG9nKCdEZWJ1ZyBtZXNzYWdlcyBhcmUgbm93ICcgKyAoZm9yY2VkID8gJ2VuYWJsZWQnIDogJ2Rpc2FibGVkJykpO1xyXG59O1xyXG5cclxuYXBpLnJlZ2lzdGVyRW1vdGVHZXR0ZXIgPSBlbW90ZXMucmVnaXN0ZXJHZXR0ZXI7XHJcbmFwaS5kZXJlZ2lzdGVyRW1vdGVHZXR0ZXIgPSBlbW90ZXMuZGVyZWdpc3RlckdldHRlcjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYXBpO1xyXG4iLCJ2YXIgU3RvcmUgPSByZXF1aXJlKCdzdG9yYWdlLXdyYXBwZXInKTtcclxudmFyIHN0b3JhZ2UgPSB7fTtcclxuXHJcbi8vIEdlbmVyYWwgc3RvcmFnZS5cclxuc3RvcmFnZS5nbG9iYWwgPSBuZXcgU3RvcmUoe1xyXG5cdG5hbWVzcGFjZTogJ2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCdcclxufSk7XHJcblxyXG4vLyBFbW90ZSB2aXNpYmlsaXR5IHN0b3JhZ2UuXHJcbnN0b3JhZ2UudmlzaWJpbGl0eSA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCd2aXNpYmlsaXR5Jyk7XHJcbi8vIEVtb3RlIHN0YXJyZWQgc3RvcmFnZS5cclxuc3RvcmFnZS5zdGFycmVkID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ3N0YXJyZWQnKTtcclxuLy8gRGlzcGxheSBuYW1lIHN0b3JhZ2UuXHJcbnN0b3JhZ2UuZGlzcGxheU5hbWVzID0gc3RvcmFnZS5nbG9iYWwuY3JlYXRlU3Vic3RvcmUoJ2Rpc3BsYXlOYW1lcycpO1xyXG4vLyBDaGFubmVsIG5hbWUgc3RvcmFnZS5cclxuc3RvcmFnZS5jaGFubmVsTmFtZXMgPSBzdG9yYWdlLmdsb2JhbC5jcmVhdGVTdWJzdG9yZSgnY2hhbm5lbE5hbWVzJyk7XHJcbi8vIEJhZGdlcyBzdG9yYWdlLlxyXG5zdG9yYWdlLmJhZGdlcyA9IHN0b3JhZ2UuZ2xvYmFsLmNyZWF0ZVN1YnN0b3JlKCdiYWRnZXMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc3RvcmFnZTtcclxuIiwidmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4uLy4uL2J1aWxkL3RlbXBsYXRlcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xyXG5cdHZhciBkYXRhID0ge307XHJcblx0dmFyIGtleSA9IG51bGw7XHJcblxyXG5cdC8vIENvbnZlcnQgdGVtcGxhdGVzIHRvIHRoZWlyIHNob3J0ZXIgXCJyZW5kZXJcIiBmb3JtLlxyXG5cdGZvciAoa2V5IGluIHRlbXBsYXRlcykge1xyXG5cdFx0aWYgKCF0ZW1wbGF0ZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cdFx0XHRjb250aW51ZTtcclxuXHRcdH1cclxuXHRcdGRhdGFba2V5XSA9IHJlbmRlcihrZXkpO1xyXG5cdH1cclxuXHJcblx0Ly8gU2hvcnRjdXQgdGhlIHJlbmRlciBmdW5jdGlvbi4gQWxsIHRlbXBsYXRlcyB3aWxsIGJlIHBhc3NlZCBpbiBhcyBwYXJ0aWFscyBieSBkZWZhdWx0LlxyXG5cdGZ1bmN0aW9uIHJlbmRlcih0ZW1wbGF0ZSkge1xyXG5cdFx0dGVtcGxhdGUgPSB0ZW1wbGF0ZXNbdGVtcGxhdGVdO1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChjb250ZXh0LCBwYXJ0aWFscywgaW5kZW50KSB7XHJcblx0XHRcdHJldHVybiB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgcGFydGlhbHMgfHwgdGVtcGxhdGVzLCBpbmRlbnQpO1xyXG5cdFx0fTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBkYXRhO1xyXG59KSgpO1xyXG4iLCJ2YXIgdHdpdGNoQXBpID0gd2luZG93LlR3aXRjaC5hcGk7XHJcbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG52YXIgYXBpID0ge307XHJcblxyXG5hcGkuZ2V0QmFkZ2VzID0gZnVuY3Rpb24gKHVzZXJuYW1lLCBjYWxsYmFjaykge1xyXG5cdC8vIE5vdGU6IG5vdCBhIGRvY3VtZW50ZWQgQVBJIGVuZHBvaW50LlxyXG5cdHR3aXRjaEFwaS5nZXQoJ2NoYXQvJyArIHVzZXJuYW1lICsgJy9iYWRnZXMnKVxyXG5cdFx0LmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0XHRjYWxsYmFjayhhcGkpO1xyXG5cdFx0fSlcclxuXHRcdC5mYWlsKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Y2FsbGJhY2soe30pO1xyXG5cdFx0fSk7XHJcbn07XHJcblxyXG5hcGkuZ2V0VXNlciA9IGZ1bmN0aW9uICh1c2VybmFtZSwgY2FsbGJhY2spIHtcclxuXHQvLyBOb3RlOiBub3QgYSBkb2N1bWVudGVkIEFQSSBlbmRwb2ludC5cclxuXHR0d2l0Y2hBcGkuZ2V0KCd1c2Vycy8nICsgdXNlcm5hbWUpXHJcblx0XHQuZG9uZShmdW5jdGlvbiAoYXBpKSB7XHJcblx0XHRcdGNhbGxiYWNrKGFwaSk7XHJcblx0XHR9KVxyXG5cdFx0LmZhaWwoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRjYWxsYmFjayh7fSk7XHJcblx0XHR9KTtcclxufTtcclxuXHJcbmFwaS5nZXRUaWNrZXRzID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcblx0Ly8gTm90ZTogbm90IGEgZG9jdW1lbnRlZCBBUEkgZW5kcG9pbnQuXHJcblx0dHdpdGNoQXBpLmdldChcclxuXHRcdCcvYXBpL3VzZXJzLzpsb2dpbi90aWNrZXRzJyxcclxuXHRcdHtcclxuXHRcdFx0b2Zmc2V0OiAwLFxyXG5cdFx0XHRsaW1pdDogMTAwLFxyXG5cdFx0XHR1bmVuZGVkOiB0cnVlXHJcblx0XHR9XHJcblx0KVxyXG5cdFx0LmRvbmUoZnVuY3Rpb24gKGFwaSkge1xyXG5cdFx0XHRjYWxsYmFjayhhcGkudGlja2V0cyB8fCBbXSk7XHJcblx0XHR9KVxyXG5cdFx0LmZhaWwoZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRjYWxsYmFjayhbXSk7XHJcblx0XHR9KTtcclxufTtcclxuXHJcbmFwaS5vbkVtb3Rlc0NoYW5nZSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgaW1tZWRpYXRlKSB7XHJcblx0dmFyIGVtYmVyID0gcmVxdWlyZSgnLi9lbWJlci1hcGknKTtcclxuXHR2YXIgc2Vzc2lvbiA9IGVtYmVyLmdldCgnY29udHJvbGxlcjpjaGF0JywgJ2N1cnJlbnRSb29tLnRtaVJvb20uc2Vzc2lvbicpO1xyXG5cdHZhciByZXNwb25zZSA9IG51bGw7XHJcblxyXG5cdGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignYGNhbGxiYWNrYCBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XHJcblx0fVxyXG5cclxuXHQvLyBObyBwYXJzZXIgb3Igbm8gZW1vdGVzIGxvYWRlZCB5ZXQsIHRyeSBhZ2Fpbi5cclxuXHRpZiAoIXNlc3Npb24pIHtcclxuXHRcdHNldFRpbWVvdXQoYXBpLm9uRW1vdGVzQ2hhbmdlLCAxMDAsIGNhbGxiYWNrLCBpbW1lZGlhdGUpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Ly8gQ2FsbCB0aGUgY2FsbGJhY2sgaW1tZWRpYXRlbHkgb24gcmVnaXN0ZXJpbmcuXHJcblx0aWYgKGltbWVkaWF0ZSkge1xyXG5cdFx0cmVzcG9uc2UgPSBzZXNzaW9uLmdldEVtb3RlcygpO1xyXG5cdFx0aWYgKCFyZXNwb25zZSB8fCAhcmVzcG9uc2UuZW1vdGljb25fc2V0cykge1xyXG5cdFx0XHRzZXRUaW1lb3V0KGFwaS5vbkVtb3Rlc0NoYW5nZSwgMTAwLCBjYWxsYmFjaywgaW1tZWRpYXRlKTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNhbGxiYWNrKHJlc3BvbnNlLmVtb3RpY29uX3NldHMpO1xyXG5cdFx0bG9nZ2VyLmRlYnVnKCdDYWxsZWQgZW1vdGUgY2hhbmdlIGhhbmRsZXIgaW1tZWRpYXRlbHkuJyk7XHJcblx0fVxyXG5cclxuXHQvLyBMaXN0ZW4gZm9yIHRoZSBldmVudC5cclxuXHRzZXNzaW9uLl9lbW90ZXNQYXJzZXIub24oJ2Vtb3Rlc19jaGFuZ2VkJywgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcblx0XHRjYWxsYmFjayhyZXNwb25zZS5lbW90aWNvbl9zZXRzKTtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnQ2FsbGVkIGVtb3RlIGNoYW5nZSBoYW5kbGVyLicpXHJcblx0fSk7XHJcblx0bG9nZ2VyLmRlYnVnKCdSZWdpc3RlcmVkIGxpc3RlbmVyIGZvciBlbW90ZSBjaGFuZ2VzLicpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XHJcbiIsInZhciBhcGkgPSB7fTtcclxudmFyICQgPSBqUXVlcnkgPSB3aW5kb3cualF1ZXJ5O1xyXG52YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcclxudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxudmFyIGVtb3RlcyA9IHJlcXVpcmUoJy4vZW1vdGVzJyk7XHJcbnZhciBsb2dnZXIgPSByZXF1aXJlKCcuL2xvZ2dlcicpO1xyXG5cclxudmFyIHRoZU1lbnUgPSBuZXcgVUlNZW51KCk7XHJcbnZhciB0aGVNZW51QnV0dG9uID0gbmV3IFVJTWVudUJ1dHRvbigpO1xyXG5cclxuYXBpLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gTG9hZCBDU1MuXHJcblx0cmVxdWlyZSgnLi4vLi4vYnVpbGQvc3R5bGVzJyk7XHJcblxyXG5cdC8vIExvYWQgalF1ZXJ5IHBsdWdpbnMuXHJcblx0cmVxdWlyZSgnLi4vcGx1Z2lucy9yZXNpemFibGUnKTtcclxuXHRyZXF1aXJlKCdqcXVlcnkuc2Nyb2xsYmFyJyk7XHJcblxyXG5cdHRoZU1lbnVCdXR0b24uaW5pdCgpO1xyXG5cdHRoZU1lbnUuaW5pdCgpO1xyXG59O1xyXG5cclxuYXBpLmhpZGVNZW51ID0gZnVuY3Rpb24gKCkge1xyXG5cdGlmICh0aGVNZW51LmRvbSAmJiB0aGVNZW51LmRvbS5sZW5ndGgpIHtcclxuXHRcdHRoZU1lbnUudG9nZ2xlRGlzcGxheShmYWxzZSk7XHJcblx0fVxyXG59O1xyXG5cclxuZnVuY3Rpb24gVUlNZW51QnV0dG9uKCkge1xyXG5cdHRoaXMuZG9tID0gbnVsbDtcclxufVxyXG5cclxuVUlNZW51QnV0dG9uLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBjaGF0QnV0dG9uID0gJCgnLnNlbmQtY2hhdC1idXR0b24nKTtcclxuXHRcclxuXHR0aGlzLmRvbSA9ICQoJyNlbW90ZS1tZW51LWJ1dHRvbicpO1xyXG5cclxuXHQvLyBFbGVtZW50IGFscmVhZHkgZXhpc3RzLlxyXG5cdGlmICh0aGlzLmRvbS5sZW5ndGgpIHtcclxuXHRcdGxvZ2dlci5kZWJ1ZygnTWVudUJ1dHRvbiBhbHJlYWR5IGV4aXN0cywgc3RvcHBpbmcgaW5pdC4nKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0aWYgKCFjaGF0QnV0dG9uLmxlbmd0aCkge1xyXG5cdFx0c2V0VGltZW91dCh0aGlzLmluaXQsIDEwMDApO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHQvLyBDcmVhdGUgZWxlbWVudC5cclxuXHR0aGlzLmRvbSA9ICQodGVtcGxhdGVzLmVtb3RlQnV0dG9uKCkpO1xyXG5cdHRoaXMuZG9tLmluc2VydEJlZm9yZShjaGF0QnV0dG9uKTtcclxuXHJcblx0Ly8gSGlkZSB0aGVuIGZhZGUgaXQgaW4uXHJcblx0dGhpcy5kb20uaGlkZSgpO1xyXG5cdHRoaXMuZG9tLmZhZGVJbigpO1xyXG5cclxuXHQvLyBFbmFibGUgY2xpY2tpbmcuXHJcblx0dGhpcy5kb20ub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0dGhlTWVudS50b2dnbGVEaXNwbGF5KCk7XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlNZW51QnV0dG9uLnByb3RvdHlwZS50b2dnbGVEaXNwbGF5ID0gZnVuY3Rpb24gKGZvcmNlZCkge1xyXG5cdHZhciBzdGF0ZSA9IHR5cGVvZiBmb3JjZWQgIT09ICd1bmRlZmluZWQnID8gISFmb3JjZWQgOiAhdGhpcy5pc1Zpc2libGUoKTtcclxuXHRpZiAoc3RhdGUpIHtcclxuXHRcdHRoaXMuZG9tLmFkZENsYXNzKCdhY3RpdmUnKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHR0aGlzLmRvbS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlNZW51QnV0dG9uLnByb3RvdHlwZS5pc1Zpc2libGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMuZG9tLmhhc0NsYXNzKCdhY3RpdmUnKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFVJTWVudSgpIHtcclxuXHR0aGlzLmRvbSA9IG51bGw7XHJcblx0dGhpcy5ncm91cHMgPSB7fTtcclxuXHR0aGlzLmVtb3RlcyA9IHt9O1xyXG5cdHRoaXMub2Zmc2V0ID0gbnVsbDtcclxuXHR0aGlzLmZhdm9yaXRlcyA9IG51bGw7XHJcbn1cclxuXHJcblVJTWVudS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgbG9nZ2VyID0gcmVxdWlyZSgnLi9sb2dnZXInKTtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdHRoaXMuZG9tID0gJCgnI2Vtb3RlLW1lbnUtZm9yLXR3aXRjaCcpO1xyXG5cclxuXHQvLyBFbGVtZW50IGFscmVhZHkgZXhpc3RzLlxyXG5cdGlmICh0aGlzLmRvbS5sZW5ndGgpIHtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0Ly8gQ3JlYXRlIGVsZW1lbnQuXHJcblx0dGhpcy5kb20gPSAkKHRlbXBsYXRlcy5tZW51KCkpO1xyXG5cdCQoZG9jdW1lbnQuYm9keSkuYXBwZW5kKHRoaXMuZG9tKTtcclxuXHJcblx0dGhpcy5mYXZvcml0ZXMgPSBuZXcgVUlGYXZvcml0ZXNHcm91cCgpO1xyXG5cclxuXHQvLyBFbmFibGUgZHJhZ2dpbmcuXHJcblx0dGhpcy5kb20uZHJhZ2dhYmxlKHtcclxuXHRcdGhhbmRsZTogJy5kcmFnZ2FibGUnLFxyXG5cdFx0c3RhcnQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0c2VsZi50b2dnbGVQaW5uZWQodHJ1ZSk7XHJcblx0XHRcdHNlbGYudG9nZ2xlTW92ZW1lbnQodHJ1ZSk7XHJcblx0XHR9LFxyXG5cdFx0c3RvcDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRzZWxmLm9mZnNldCA9IHNlbGYuZG9tLm9mZnNldCgpO1xyXG5cdFx0fSxcclxuXHRcdGNvbnRhaW5tZW50OiAkKGRvY3VtZW50LmJvZHkpXHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSByZXNpemluZy5cclxuXHR0aGlzLmRvbS5yZXNpemFibGUoe1xyXG5cdFx0aGFuZGxlOiAnW2RhdGEtY29tbWFuZD1cInJlc2l6ZS1oYW5kbGVcIl0nLFxyXG5cdFx0c3RvcDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRzZWxmLnRvZ2dsZVBpbm5lZCh0cnVlKTtcclxuXHRcdFx0c2VsZi50b2dnbGVNb3ZlbWVudCh0cnVlKTtcclxuXHRcdH0sXHJcblx0XHRhbHNvUmVzaXplOiBzZWxmLmRvbS5maW5kKCcuc2Nyb2xsYWJsZScpLFxyXG5cdFx0Y29udGFpbm1lbnQ6ICQoZG9jdW1lbnQuYm9keSksXHJcblx0XHRtaW5IZWlnaHQ6IDE4MCxcclxuXHRcdG1pbldpZHRoOiAyMDBcclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIHBpbm5pbmcuXHJcblx0dGhpcy5kb20uZmluZCgnW2RhdGEtY29tbWFuZD1cInRvZ2dsZS1waW5uZWRcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRzZWxmLnRvZ2dsZVBpbm5lZCgpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBFbmFibGUgZWRpdGluZy5cclxuXHR0aGlzLmRvbS5maW5kKCdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLWVkaXRpbmdcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRzZWxmLnRvZ2dsZUVkaXRpbmcoKTtcclxuXHR9KTtcclxuXHJcblx0dGhpcy5kb20uZmluZCgnLnNjcm9sbGFibGUnKS5zY3JvbGxiYXIoKVxyXG5cclxuXHR0aGlzLnVwZGF0ZUVtb3RlcygpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuX2RldGVjdE91dHNpZGVDbGljayA9IGZ1bmN0aW9uIChldmVudCkge1xyXG5cdC8vIE5vdCBvdXRzaWRlIG9mIHRoZSBtZW51LCBpZ25vcmUgdGhlIGNsaWNrLlxyXG5cdGlmICgkKGV2ZW50LnRhcmdldCkuaXMoJyNlbW90ZS1tZW51LWZvci10d2l0Y2gsICNlbW90ZS1tZW51LWZvci10d2l0Y2ggKicpKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHQvLyBDbGlja2VkIG9uIHRoZSBtZW51IGJ1dHRvbiwganVzdCByZW1vdmUgdGhlIGxpc3RlbmVyIGFuZCBsZXQgdGhlIG5vcm1hbCBsaXN0ZW5lciBoYW5kbGUgaXQuXHJcblx0aWYgKCF0aGlzLmlzVmlzaWJsZSgpIHx8ICQoZXZlbnQudGFyZ2V0KS5pcygnI2Vtb3RlLW1lbnUtYnV0dG9uLCAjZW1vdGUtbWVudS1idXR0b24gKicpKSB7XHJcblx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCB0aGlzLl9kZXRlY3RPdXRzaWRlQ2xpY2suYmluZCh0aGlzKSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHQvLyBDbGlja2VkIG91dHNpZGUsIG1ha2Ugc3VyZSB0aGUgbWVudSBpc24ndCBwaW5uZWQuXHJcblx0aWYgKCF0aGlzLmlzUGlubmVkKCkpIHtcclxuXHRcdC8vIE1lbnUgd2Fzbid0IHBpbm5lZCwgcmVtb3ZlIGxpc3RlbmVyLlxyXG5cdFx0JChkb2N1bWVudCkub2ZmKCdtb3VzZXVwJywgdGhpcy5fZGV0ZWN0T3V0c2lkZUNsaWNrLmJpbmQodGhpcykpO1xyXG5cdFx0dGhpcy50b2dnbGVEaXNwbGF5KCk7XHJcblx0fVxyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS50b2dnbGVEaXNwbGF5ID0gZnVuY3Rpb24gKGZvcmNlZCkge1xyXG5cdHZhciBzdGF0ZSA9IHR5cGVvZiBmb3JjZWQgIT09ICd1bmRlZmluZWQnID8gISFmb3JjZWQgOiAhdGhpcy5pc1Zpc2libGUoKTtcclxuXHR2YXIgbG9nZ2VkSW4gPSB3aW5kb3cuVHdpdGNoICYmIHdpbmRvdy5Ud2l0Y2gudXNlci5pc0xvZ2dlZEluKCk7XHJcblxyXG5cdC8vIE1lbnUgc2hvdWxkIGJlIHNob3duLlxyXG5cdGlmIChzdGF0ZSkge1xyXG5cdFx0Ly8gQ2hlY2sgaWYgdXNlciBpcyBsb2dnZWQgaW4uXHJcblx0XHRpZiAoIWxvZ2dlZEluKSB7XHJcblx0XHRcdC8vIENhbGwgbmF0aXZlIGxvZ2luIGZvcm0uXHJcblx0XHRcdCQubG9naW4oKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy51cGRhdGVFbW90ZXMoKTtcclxuXHRcdHRoaXMuZG9tLnNob3coKTtcclxuXHJcblx0XHQvLyBNZW51IG1vdmVkLCBtb3ZlIGl0IGJhY2suXHJcblx0XHRpZiAodGhpcy5oYXNNb3ZlZCgpKSB7XHJcblx0XHRcdHRoaXMuZG9tLm9mZnNldCh0aGlzLm9mZnNldCk7XHJcblx0XHR9XHJcblx0XHQvLyBOZXZlciBtb3ZlZCwgbWFrZSBpdCB0aGUgc2FtZSBzaXplIGFzIHRoZSBjaGF0IHdpbmRvdy5cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR2YXIgY2hhdENvbnRhaW5lciA9ICQoJy5jaGF0LW1lc3NhZ2VzJyk7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBBZGp1c3QgdGhlIHNpemUgdG8gYmUgdGhlIHNhbWUgYXMgdGhlIGNoYXQgY29udGFpbmVyLlxyXG5cdFx0XHR0aGlzLmRvbS5oZWlnaHQoY2hhdENvbnRhaW5lci5vdXRlckhlaWdodCgpIC0gKHRoaXMuZG9tLm91dGVySGVpZ2h0KCkgLSB0aGlzLmRvbS5oZWlnaHQoKSkpO1xyXG5cdFx0XHR0aGlzLmRvbS53aWR0aChjaGF0Q29udGFpbmVyLm91dGVyV2lkdGgoKSAtICh0aGlzLmRvbS5vdXRlcldpZHRoKCkgLSB0aGlzLmRvbS53aWR0aCgpKSk7XHJcblxyXG5cdFx0XHQvLyBBZGp1c3QgdGhlIG9mZnNldCB0byBiZSB0aGUgc2FtZSBhcyB0aGUgY2hhdCBjb250YWluZXIuXHJcblx0XHRcdHRoaXMub2Zmc2V0ID0gY2hhdENvbnRhaW5lci5vZmZzZXQoKTtcclxuXHRcdFx0dGhpcy5kb20ub2Zmc2V0KHRoaXMub2Zmc2V0KTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBMaXN0ZW4gZm9yIG91dHNpZGUgY2xpY2suXHJcblx0XHQkKGRvY3VtZW50KS5vbignbW91c2V1cCcsIHRoaXMuX2RldGVjdE91dHNpZGVDbGljay5iaW5kKHRoaXMpKTtcclxuXHR9XHJcblx0Ly8gTWVudSBzaG91bGQgYmUgaGlkZGVuLlxyXG5cdGVsc2Uge1xyXG5cdFx0dGhpcy5kb20uaGlkZSgpO1xyXG5cdFx0dGhpcy50b2dnbGVFZGl0aW5nKGZhbHNlKTtcclxuXHRcdHRoaXMudG9nZ2xlUGlubmVkKGZhbHNlKTtcclxuXHR9XHJcblxyXG5cdC8vIEFsc28gdG9nZ2xlIHRoZSBtZW51IGJ1dHRvbi5cclxuXHR0aGVNZW51QnV0dG9uLnRvZ2dsZURpc3BsYXkodGhpcy5pc1Zpc2libGUoKSk7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5pc1Zpc2libGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMuZG9tLmlzKCc6dmlzaWJsZScpO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS51cGRhdGVFbW90ZXMgPSBmdW5jdGlvbiAod2hpY2gpIHtcclxuXHR2YXIgZW1vdGUgPSB3aGljaCA/IHRoaXMuZ2V0RW1vdGUod2hpY2gpIDogbnVsbDtcclxuXHR2YXIgZmF2b3JpdGVFbW90ZSA9IGVtb3RlID8gdGhpcy5mYXZvcml0ZXMuZ2V0RW1vdGUod2hpY2gpIDogbnVsbDtcclxuXHRpZiAoZW1vdGUpIHtcclxuXHRcdGVtb3RlLnVwZGF0ZSgpO1xyXG5cdFx0aWYgKGZhdm9yaXRlRW1vdGUpIHtcclxuXHRcdFx0ZmF2b3JpdGVFbW90ZS51cGRhdGUoKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHR2YXIgZW1vdGVzID0gcmVxdWlyZSgnLi9lbW90ZXMnKTtcclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblx0ZW1vdGVzLmdldEVtb3RlcygpLmZvckVhY2goZnVuY3Rpb24gKGVtb3RlSW5zdGFuY2UpIHtcclxuXHRcdHNlbGYuYWRkRW1vdGUoZW1vdGVJbnN0YW5jZSk7XHJcblx0fSk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLnRvZ2dsZUVkaXRpbmcgPSBmdW5jdGlvbiAoZm9yY2VkKSB7XHJcblx0dmFyIHN0YXRlID0gdHlwZW9mIGZvcmNlZCAhPT0gJ3VuZGVmaW5lZCcgPyAhIWZvcmNlZCA6ICF0aGlzLmlzRWRpdGluZygpO1xyXG5cdHRoaXMuZG9tLnRvZ2dsZUNsYXNzKCdlZGl0aW5nJywgc3RhdGUpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5pc0VkaXRpbmcgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMuZG9tLmhhc0NsYXNzKCdlZGl0aW5nJyk7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLnRvZ2dsZVBpbm5lZCA9IGZ1bmN0aW9uIChmb3JjZWQpIHtcclxuXHR2YXIgc3RhdGUgPSB0eXBlb2YgZm9yY2VkICE9PSAndW5kZWZpbmVkJyA/ICEhZm9yY2VkIDogIXRoaXMuaXNQaW5uZWQoKTtcclxuXHR0aGlzLmRvbS50b2dnbGVDbGFzcygncGlubmVkJywgc3RhdGUpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5pc1Bpbm5lZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gdGhpcy5kb20uaGFzQ2xhc3MoJ3Bpbm5lZCcpO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS50b2dnbGVNb3ZlbWVudCA9IGZ1bmN0aW9uIChmb3JjZWQpIHtcclxuXHR2YXIgc3RhdGUgPSB0eXBlb2YgZm9yY2VkICE9PSAndW5kZWZpbmVkJyA/ICEhZm9yY2VkIDogIXRoaXMuaGFzTW92ZWQoKTtcclxuXHR0aGlzLmRvbS50b2dnbGVDbGFzcygnbW92ZWQnLCBzdGF0ZSk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLmhhc01vdmVkID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmRvbS5oYXNDbGFzcygnbW92ZWQnKTtcclxufTtcclxuXHJcblVJTWVudS5wcm90b3R5cGUuYWRkR3JvdXAgPSBmdW5jdGlvbiAoZW1vdGVJbnN0YW5jZSkge1xyXG5cdHZhciBjaGFubmVsID0gZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsTmFtZSgpO1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0Ly8gQWxyZWFkeSBhZGRlZCwgZG9uJ3QgYWRkIGFnYWluLlxyXG5cdGlmICh0aGlzLmdldEdyb3VwKGNoYW5uZWwpKSB7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdC8vIEFkZCB0byBjdXJyZW50IG1lbnUgZ3JvdXBzLlxyXG5cdHZhciBncm91cCA9IG5ldyBVSUdyb3VwKGVtb3RlSW5zdGFuY2UpO1xyXG5cdHRoaXMuZ3JvdXBzW2NoYW5uZWxdID0gZ3JvdXA7XHJcblxyXG5cdC8vIFNvcnQgZ3JvdXAgbmFtZXMsIGdldCBpbmRleCBvZiB3aGVyZSB0aGlzIGdyb3VwIHNob3VsZCBnby5cclxuXHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuZ3JvdXBzKTtcclxuXHRrZXlzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuXHRcdC8vIEdldCB0aGUgaW5zdGFuY2VzLlxyXG5cdFx0YSA9IHNlbGYuZ3JvdXBzW2FdLmVtb3RlSW5zdGFuY2U7XHJcblx0XHRiID0gc2VsZi5ncm91cHNbYl0uZW1vdGVJbnN0YW5jZTtcclxuXHJcblx0XHQvLyBHZXQgdGhlIGNoYW5uZWwgbmFtZS5cclxuXHRcdHZhciBhQ2hhbm5lbCA9IGEuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHRcdHZhciBiQ2hhbm5lbCA9IGIuZ2V0Q2hhbm5lbE5hbWUoKTtcclxuXHJcblx0XHQvLyBHZXQgdGhlIGNoYW5uZWwgZGlzcGxheSBuYW1lLlxyXG5cdFx0YSA9IGEuZ2V0Q2hhbm5lbERpc3BsYXlOYW1lKCkudG9Mb3dlckNhc2UoKTtcclxuXHRcdGIgPSBiLmdldENoYW5uZWxEaXNwbGF5TmFtZSgpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdFx0Ly8gVHVyYm8gZ29lcyBmaXJzdCwgYWx3YXlzLlxyXG5cdFx0aWYgKGFDaGFubmVsID09PSAndHVyYm8nICYmIGJDaGFubmVsICE9PSAndHVyYm8nKSB7XHJcblx0XHRcdHJldHVybiAtMTtcclxuXHRcdH1cclxuXHRcdGlmIChiQ2hhbm5lbCA9PT0gJ3R1cmJvJyAmJiBhQ2hhbm5lbCAhPT0gJ3R1cmJvJykge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHbG9iYWwgZ29lcyBzZWNvbmQsIGFsd2F5cy5cclxuXHRcdGlmIChhQ2hhbm5lbCA9PT0gJ35nbG9iYWwnICYmIGJDaGFubmVsICE9PSAnfmdsb2JhbCcpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0aWYgKGJDaGFubmVsID09PSAnfmdsb2JhbCcgJiYgYUNoYW5uZWwgIT09ICd+Z2xvYmFsJykge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBBIGdvZXMgZmlyc3QuXHJcblx0XHRpZiAoYSA8IGIpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0Ly8gQiBnb2VzdCBmaXJzdC5cclxuXHRcdGlmIChhID4gYikge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdC8vIEJvdGggdGhlIHNhbWUsIGRvZXNuJ3QgbWF0dGVyLlxyXG5cdFx0cmV0dXJuIDA7XHJcblx0fSk7XHJcblxyXG5cdHZhciBpbmRleCA9IGtleXMuaW5kZXhPZihjaGFubmVsKTtcclxuXHJcblx0Ly8gRmlyc3QgaW4gdGhlIHNvcnQsIHBsYWNlIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1lbnUuXHJcblx0aWYgKGluZGV4ID09PSAwKSB7XHJcblx0XHRncm91cC5kb20ucHJlcGVuZFRvKHRoaXMuZG9tLmZpbmQoJyNhbGwtZW1vdGVzLWdyb3VwJykpO1xyXG5cdH1cclxuXHQvLyBJbnNlcnQgYWZ0ZXIgdGhlIHByZXZpb3VzIGdyb3VwIGluIHRoZSBzb3J0LlxyXG5cdGVsc2Uge1xyXG5cdFx0Z3JvdXAuZG9tLmluc2VydEFmdGVyKHRoaXMuZ2V0R3JvdXAoa2V5c1tpbmRleCAtIDFdKS5kb20pO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGdyb3VwO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5nZXRHcm91cCA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0cmV0dXJuIHRoaXMuZ3JvdXBzW25hbWVdIHx8IG51bGw7XHJcbn07XHJcblxyXG5VSU1lbnUucHJvdG90eXBlLmFkZEVtb3RlID0gZnVuY3Rpb24gKGVtb3RlSW5zdGFuY2UpIHtcclxuXHQvLyBHZXQgdGhlIGdyb3VwLCBvciBhZGQgaWYgbmVlZGVkLlxyXG5cdHZhciBncm91cCA9IHRoaXMuZ2V0R3JvdXAoZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsTmFtZSgpKSB8fCB0aGlzLmFkZEdyb3VwKGVtb3RlSW5zdGFuY2UpO1xyXG5cclxuXHRncm91cC5hZGRFbW90ZShlbW90ZUluc3RhbmNlKTtcclxuXHRncm91cC50b2dnbGVEaXNwbGF5KGdyb3VwLmlzVmlzaWJsZSgpLCB0cnVlKTtcclxuXHJcblx0dGhpcy5mYXZvcml0ZXMuYWRkRW1vdGUoZW1vdGVJbnN0YW5jZSk7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlNZW51LnByb3RvdHlwZS5nZXRFbW90ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0dmFyIGdyb3VwTmFtZSA9IG51bGw7XHJcblx0dmFyIGdyb3VwID0gbnVsbDtcclxuXHR2YXIgZW1vdGUgPSBudWxsO1xyXG5cclxuXHRmb3IgKGdyb3VwTmFtZSBpbiB0aGlzLmdyb3Vwcykge1xyXG5cdFx0Z3JvdXAgPSB0aGlzLmdyb3Vwc1tncm91cE5hbWVdO1xyXG5cdFx0ZW1vdGUgPSBncm91cC5nZXRFbW90ZShuYW1lKTtcclxuXHJcblx0XHRpZiAoZW1vdGUpIHtcclxuXHRcdFx0cmV0dXJuIGVtb3RlO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBVSUdyb3VwKGVtb3RlSW5zdGFuY2UpIHtcclxuXHR0aGlzLmRvbSA9IG51bGw7XHJcblx0dGhpcy5lbW90ZXMgPSB7fTtcclxuXHR0aGlzLmVtb3RlSW5zdGFuY2UgPSBlbW90ZUluc3RhbmNlO1xyXG5cclxuXHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdHRoaXMuZG9tID0gJCh0ZW1wbGF0ZXMuZW1vdGVHcm91cEhlYWRlcih7XHJcblx0XHRiYWRnZTogZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsQmFkZ2UoKSxcclxuXHRcdGNoYW5uZWw6IGVtb3RlSW5zdGFuY2UuZ2V0Q2hhbm5lbE5hbWUoKSxcclxuXHRcdGNoYW5uZWxEaXNwbGF5TmFtZTogZW1vdGVJbnN0YW5jZS5nZXRDaGFubmVsRGlzcGxheU5hbWUoKVxyXG5cdH0pKTtcclxuXHJcblx0Ly8gRW5hYmxlIGVtb3RlIGhpZGluZy5cclxuXHR0aGlzLmRvbS5maW5kKCdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLXZpc2liaWxpdHlcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoZU1lbnUuaXNFZGl0aW5nKCkpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0c2VsZi50b2dnbGVEaXNwbGF5KCk7XHJcblx0fSk7XHJcblxyXG5cdHRoaXMudG9nZ2xlRGlzcGxheSh0aGlzLmlzVmlzaWJsZSgpLCB0cnVlKTtcclxufVxyXG5cclxuVUlHcm91cC5wcm90b3R5cGUudG9nZ2xlRGlzcGxheSA9IGZ1bmN0aW9uIChmb3JjZWQsIHNraXBVcGRhdGluZ0Vtb3RlRGlzcGxheSkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHR2YXIgc3RhdGUgPSB0eXBlb2YgZm9yY2VkICE9PSAndW5kZWZpbmVkJyA/ICFmb3JjZWQgOiB0aGlzLmlzVmlzaWJsZSgpO1xyXG5cclxuXHR0aGlzLmRvbS50b2dnbGVDbGFzcygnZW1vdGUtbWVudS1oaWRkZW4nLCBzdGF0ZSk7XHJcblxyXG5cdC8vIFVwZGF0ZSB0aGUgZGlzcGxheSBvZiBhbGwgZW1vdGVzLlxyXG5cdGlmICghc2tpcFVwZGF0aW5nRW1vdGVEaXNwbGF5KSB7XHJcblx0XHRPYmplY3Qua2V5cyh0aGlzLmVtb3RlcykuZm9yRWFjaChmdW5jdGlvbiAoZW1vdGVOYW1lKSB7XHJcblx0XHRcdHNlbGYuZW1vdGVzW2Vtb3RlTmFtZV0udG9nZ2xlRGlzcGxheSghc3RhdGUpO1xyXG5cdFx0XHR0aGVNZW51LnVwZGF0ZUVtb3RlcyhzZWxmLmVtb3Rlc1tlbW90ZU5hbWVdLmluc3RhbmNlLmdldFRleHQoKSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlHcm91cC5wcm90b3R5cGUuaXNWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xyXG5cdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0Ly8gSWYgYW55IGVtb3RlIGlzIHZpc2libGUsIHRoZSBncm91cCBzaG91bGQgYmUgdmlzaWJsZS5cclxuXHRyZXR1cm4gT2JqZWN0LmtleXModGhpcy5lbW90ZXMpLnNvbWUoZnVuY3Rpb24gKGVtb3RlTmFtZSkge1xyXG5cdFx0cmV0dXJuIHNlbGYuZW1vdGVzW2Vtb3RlTmFtZV0uaXNWaXNpYmxlKCk7XHJcblx0fSk7XHJcbn07XHJcblxyXG5VSUdyb3VwLnByb3RvdHlwZS5hZGRFbW90ZSA9IGZ1bmN0aW9uIChlbW90ZUluc3RhbmNlKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cdHZhciBlbW90ZSA9IHRoaXMuZ2V0RW1vdGUoZW1vdGVJbnN0YW5jZS5nZXRUZXh0KCkpO1xyXG5cclxuXHQvLyBBbHJlYWR5IGFkZGVkLCB1cGRhdGUgaW5zdGVhZC5cclxuXHRpZiAoZW1vdGUpIHtcclxuXHRcdGVtb3RlLnVwZGF0ZSgpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHQvLyBBZGQgdG8gY3VycmVudCBlbW90ZXMuXHJcblx0ZW1vdGUgPSBuZXcgVUlFbW90ZShlbW90ZUluc3RhbmNlKTtcclxuXHR0aGlzLmVtb3Rlc1tlbW90ZUluc3RhbmNlLmdldFRleHQoKV0gPSBlbW90ZTtcclxuXHJcblx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLmVtb3Rlcyk7XHJcblxyXG5cdGtleXMuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG5cdFx0Ly8gR2V0IHRoZSBlbW90ZSBpbnN0YW5jZXMuXHJcblx0XHRhID0gc2VsZi5lbW90ZXNbYV0uaW5zdGFuY2U7XHJcblx0XHRiID0gc2VsZi5lbW90ZXNbYl0uaW5zdGFuY2U7XHJcblxyXG5cdFx0Ly8gQSBpcyBhIHNtaWxleSwgQiBpc24ndC4gQSBnb2VzIGZpcnN0LlxyXG5cdFx0aWYgKGEuaXNTbWlsZXkoKSAmJlx0IWIuaXNTbWlsZXkoKSkge1xyXG5cdFx0XHRyZXR1cm4gLTE7XHJcblx0XHR9XHJcblx0XHQvLyBCIGlzIGEgc21pbGV5LCBBIGlzbid0LiBCIGdvZXMgZmlyc3QuXHJcblx0XHRpZiAoYi5pc1NtaWxleSgpICYmXHQhYS5pc1NtaWxleSgpKSB7XHJcblx0XHRcdHJldHVybiAxO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCB0aGUgdGV4dCBvZiB0aGUgZW1vdGVzLlxyXG5cdFx0YSA9IGEuZ2V0VGV4dCgpLnRvTG93ZXJDYXNlKCk7XHJcblx0XHRiID0gYi5nZXRUZXh0KCkudG9Mb3dlckNhc2UoKTtcclxuXHJcblx0XHQvLyBBIGdvZXMgZmlyc3QuXHJcblx0XHRpZiAoYSA8IGIpIHtcclxuXHRcdFx0cmV0dXJuIC0xO1xyXG5cdFx0fVxyXG5cdFx0Ly8gQiBnb2VzdCBmaXJzdC5cclxuXHRcdGlmIChhID4gYikge1xyXG5cdFx0XHRyZXR1cm4gMTtcclxuXHRcdH1cclxuXHRcdC8vIEJvdGggdGhlIHNhbWUsIGRvZXNuJ3QgbWF0dGVyLlxyXG5cdFx0cmV0dXJuIDA7XHJcblx0fSk7XHJcblxyXG5cdHZhciBpbmRleCA9IGtleXMuaW5kZXhPZihlbW90ZUluc3RhbmNlLmdldFRleHQoKSk7XHJcblxyXG5cdC8vIEZpcnN0IGluIHRoZSBzb3J0LCBwbGFjZSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBncm91cC5cclxuXHRpZiAoaW5kZXggPT09IDApIHtcclxuXHRcdGVtb3RlLmRvbS5wcmVwZW5kVG8odGhpcy5kb20uZmluZCgnLmVtb3RlLWNvbnRhaW5lcicpKTtcclxuXHR9XHJcblx0Ly8gSW5zZXJ0IGFmdGVyIHRoZSBwcmV2aW91cyBlbW90ZSBpbiB0aGUgc29ydC5cclxuXHRlbHNlIHtcclxuXHRcdGVtb3RlLmRvbS5pbnNlcnRBZnRlcih0aGlzLmdldEVtb3RlKGtleXNbaW5kZXggLSAxXSkuZG9tKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlHcm91cC5wcm90b3R5cGUuZ2V0RW1vdGUgPSBmdW5jdGlvbiAobmFtZSkge1xyXG5cdHJldHVybiB0aGlzLmVtb3Rlc1tuYW1lXSB8fCBudWxsO1xyXG59O1xyXG5cclxuVUlHcm91cC5wcm90b3R5cGUucmVtb3ZlRW1vdGUgPSBmdW5jdGlvbiAobmFtZSkge1xyXG5cdHZhciBlbW90ZSA9IHRoaXMuZ2V0RW1vdGUobmFtZSk7XHJcblx0aWYgKCFlbW90ZSkge1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cdGVtb3RlLmRvbS5yZW1vdmUoKTtcclxuXHRkZWxldGUgdGhpcy5lbW90ZXNbbmFtZV07XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gVUlGYXZvcml0ZXNHcm91cCgpIHtcclxuXHR0aGlzLmRvbSA9ICQoJyNzdGFycmVkLWVtb3Rlcy1ncm91cCcpO1xyXG5cdHRoaXMuZW1vdGVzID0ge307XHJcbn1cclxuXHJcblVJRmF2b3JpdGVzR3JvdXAucHJvdG90eXBlLmFkZEVtb3RlID0gVUlHcm91cC5wcm90b3R5cGUuYWRkRW1vdGU7XHJcblVJRmF2b3JpdGVzR3JvdXAucHJvdG90eXBlLmdldEVtb3RlID0gVUlHcm91cC5wcm90b3R5cGUuZ2V0RW1vdGU7XHJcblVJRmF2b3JpdGVzR3JvdXAucHJvdG90eXBlLnJlbW92ZUVtb3RlID0gVUlHcm91cC5wcm90b3R5cGUucmVtb3ZlRW1vdGU7XHJcblxyXG5mdW5jdGlvbiBVSUVtb3RlKGVtb3RlSW5zdGFuY2UpIHtcclxuXHR0aGlzLmRvbSA9IG51bGw7XHJcblx0dGhpcy5pbnN0YW5jZSA9IGVtb3RlSW5zdGFuY2U7XHJcblx0dGhpcy5pbml0KCk7XHJcbn1cclxuXHJcblVJRW1vdGUucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHQvLyBDcmVhdGUgZWxlbWVudC5cclxuXHR0aGlzLmRvbSA9ICQodGVtcGxhdGVzLmVtb3RlKHtcclxuXHRcdHVybDogdGhpcy5pbnN0YW5jZS5nZXRVcmwoKSxcclxuXHRcdHRleHQ6IHRoaXMuaW5zdGFuY2UuZ2V0VGV4dCgpLFxyXG5cdFx0dGhpcmRQYXJ0eTogdGhpcy5pbnN0YW5jZS5pc1RoaXJkUGFydHkoKSxcclxuXHRcdGlzVmlzaWJsZTogdGhpcy5pbnN0YW5jZS5pc1Zpc2libGUoKSxcclxuXHRcdGlzU3RhcnJlZDogdGhpcy5pbnN0YW5jZS5pc0Zhdm9yaXRlKClcclxuXHR9KSk7XHJcblxyXG5cdC8vIEVuYWJsZSBjbGlja2luZy5cclxuXHR0aGlzLmRvbS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoZU1lbnUuaXNFZGl0aW5nKCkpIHtcclxuXHRcdFx0c2VsZi5hZGRUb0NoYXQoKTtcclxuXHJcblx0XHRcdC8vIENsb3NlIHRoZSBtZW51IGlmIG5vdCBwaW5uZWQuXHJcblx0XHRcdGlmICghdGhlTWVudS5pc1Bpbm5lZCgpKSB7XHJcblx0XHRcdFx0dGhlTWVudS50b2dnbGVEaXNwbGF5KCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KTtcclxuXHJcblx0Ly8gRW5hYmxlIGVtb3RlIGhpZGluZy5cclxuXHR0aGlzLmRvbS5maW5kKCdbZGF0YS1jb21tYW5kPVwidG9nZ2xlLXZpc2liaWxpdHlcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoIXRoZU1lbnUuaXNFZGl0aW5nKCkpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0c2VsZi50b2dnbGVEaXNwbGF5KCk7XHJcblx0XHR0aGVNZW51LnVwZGF0ZUVtb3RlcyhzZWxmLmluc3RhbmNlLmdldFRleHQoKSk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEVuYWJsZSBlbW90ZSBmYXZvcml0aW5nLlxyXG5cdHRoaXMuZG9tLmZpbmQoJ1tkYXRhLWNvbW1hbmQ9XCJ0b2dnbGUtc3RhcnJlZFwiXScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmICghdGhlTWVudS5pc0VkaXRpbmcoKSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRzZWxmLnRvZ2dsZUZhdm9yaXRlKCk7XHJcblx0XHR0aGVNZW51LnVwZGF0ZUVtb3RlcyhzZWxmLmluc3RhbmNlLmdldFRleHQoKSk7XHJcblx0fSk7XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuVUlFbW90ZS5wcm90b3R5cGUudG9nZ2xlRGlzcGxheSA9IGZ1bmN0aW9uIChmb3JjZWQsIHNraXBJbnN0YW5jZVVwZGF0ZSkge1xyXG5cdHZhciBzdGF0ZSA9IHR5cGVvZiBmb3JjZWQgIT09ICd1bmRlZmluZWQnID8gIWZvcmNlZCA6IHRoaXMuaXNWaXNpYmxlKCk7XHJcblx0dGhpcy5kb20udG9nZ2xlQ2xhc3MoJ2Vtb3RlLW1lbnUtaGlkZGVuJywgc3RhdGUpO1xyXG5cdGlmICghc2tpcEluc3RhbmNlVXBkYXRlKSB7XHJcblx0XHR0aGlzLmluc3RhbmNlLnRvZ2dsZVZpc2liaWxpdHkoIXN0YXRlKTtcclxuXHR9XHJcblxyXG5cdHZhciBncm91cCA9IHRoaXMuZ2V0R3JvdXAoKTtcclxuXHRncm91cC50b2dnbGVEaXNwbGF5KGdyb3VwLmlzVmlzaWJsZSgpLCB0cnVlKTtcclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSUVtb3RlLnByb3RvdHlwZS5pc1Zpc2libGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuICF0aGlzLmRvbS5oYXNDbGFzcygnZW1vdGUtbWVudS1oaWRkZW4nKTtcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLnRvZ2dsZUZhdm9yaXRlID0gZnVuY3Rpb24gKGZvcmNlZCwgc2tpcEluc3RhbmNlVXBkYXRlKSB7XHJcblx0dmFyIHN0YXRlID0gdHlwZW9mIGZvcmNlZCAhPT0gJ3VuZGVmaW5lZCcgPyAhIWZvcmNlZCA6ICF0aGlzLmlzRmF2b3JpdGUoKTtcclxuXHR0aGlzLmRvbS50b2dnbGVDbGFzcygnZW1vdGUtbWVudS1zdGFycmVkJywgc3RhdGUpO1xyXG5cdGlmICghc2tpcEluc3RhbmNlVXBkYXRlKSB7XHJcblx0XHR0aGlzLmluc3RhbmNlLnRvZ2dsZUZhdm9yaXRlKHN0YXRlKTtcclxuXHR9XHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG5VSUVtb3RlLnByb3RvdHlwZS5pc0Zhdm9yaXRlID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGlzLmRvbS5oYXNDbGFzcygnZW1vdGUtbWVudS1zdGFycmVkJyk7XHJcbn07XHJcblxyXG5VSUVtb3RlLnByb3RvdHlwZS5hZGRUb0NoYXQgPSBmdW5jdGlvbiAoKSB7XHJcblx0dmFyIGVtYmVyID0gcmVxdWlyZSgnLi9lbWJlci1hcGknKTtcclxuXHQvLyBHZXQgdGV4dGFyZWEgZWxlbWVudC5cclxuXHR2YXIgZWxlbWVudCA9ICQoJy5jaGF0LWludGVyZmFjZSB0ZXh0YXJlYScpLmdldCgwKTtcclxuXHR2YXIgdGV4dCA9IHRoaXMuaW5zdGFuY2UuZ2V0VGV4dCgpO1xyXG5cclxuXHQvLyBJbnNlcnQgYXQgY3Vyc29yIC8gcmVwbGFjZSBzZWxlY3Rpb24uXHJcblx0Ly8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Db2RlX3NuaXBwZXRzL01pc2NlbGxhbmVvdXNcclxuXHR2YXIgc2VsZWN0aW9uRW5kID0gZWxlbWVudC5zZWxlY3Rpb25TdGFydCArIHRleHQubGVuZ3RoO1xyXG5cdHZhciBjdXJyZW50VmFsdWUgPSBlbGVtZW50LnZhbHVlO1xyXG5cdHZhciBiZWZvcmVUZXh0ID0gY3VycmVudFZhbHVlLnN1YnN0cmluZygwLCBlbGVtZW50LnNlbGVjdGlvblN0YXJ0KTtcclxuXHR2YXIgYWZ0ZXJUZXh0ID0gY3VycmVudFZhbHVlLnN1YnN0cmluZyhlbGVtZW50LnNlbGVjdGlvbkVuZCwgY3VycmVudFZhbHVlLmxlbmd0aCk7XHJcblx0Ly8gU21hcnQgcGFkZGluZywgb25seSBwdXQgc3BhY2UgYXQgc3RhcnQgaWYgbmVlZGVkLlxyXG5cdGlmIChcclxuXHRcdGJlZm9yZVRleHQgIT09ICcnICYmXHJcblx0XHRiZWZvcmVUZXh0LnN1YnN0cigtMSkgIT09ICcgJ1xyXG5cdCkge1xyXG5cdFx0dGV4dCA9ICcgJyArIHRleHQ7XHJcblx0fVxyXG5cdC8vIEFsd2F5cyBwdXQgc3BhY2UgYXQgZW5kLlxyXG5cdHRleHQgPSBiZWZvcmVUZXh0ICsgdGV4dCArICcgJyArIGFmdGVyVGV4dDtcclxuXHQvLyBTZXQgdGhlIHRleHQuXHJcblx0ZW1iZXIuZ2V0KCdjb250cm9sbGVyOmNoYXQnLCAnY3VycmVudFJvb20nKS5zZXQoJ21lc3NhZ2VUb1NlbmQnLCB0ZXh0KTtcclxuXHRlbGVtZW50LmZvY3VzKCk7XHJcblx0Ly8gUHV0IGN1cnNvciBhdCBlbmQuXHJcblx0c2VsZWN0aW9uRW5kID0gZWxlbWVudC5zZWxlY3Rpb25TdGFydCArIHRleHQubGVuZ3RoO1xyXG5cdGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0aW9uRW5kLCBzZWxlY3Rpb25FbmQpO1xyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcblVJRW1vdGUucHJvdG90eXBlLmdldEdyb3VwID0gZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiB0aGVNZW51LmdldEdyb3VwKHRoaXMuaW5zdGFuY2UuZ2V0Q2hhbm5lbE5hbWUoKSk7XHJcbn07XHJcblxyXG5VSUVtb3RlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoKSB7XHJcblx0dGhpcy50b2dnbGVEaXNwbGF5KHRoaXMuaW5zdGFuY2UuaXNWaXNpYmxlKCksIHRydWUpO1xyXG5cdHRoaXMudG9nZ2xlRmF2b3JpdGUodGhpcy5pbnN0YW5jZS5pc0Zhdm9yaXRlKCksIHRydWUpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhcGk7XHJcbiIsIihmdW5jdGlvbiAoJCkge1xyXG5cdCQuZm4ucmVzaXphYmxlID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHRcdHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHtcclxuXHRcdFx0YWxzb1Jlc2l6ZTogbnVsbCxcclxuXHRcdFx0YWxzb1Jlc2l6ZVR5cGU6ICdib3RoJywgLy8gYGhlaWdodGAsIGB3aWR0aGAsIGBib3RoYFxyXG5cdFx0XHRjb250YWlubWVudDogbnVsbCxcclxuXHRcdFx0Y3JlYXRlOiBudWxsLFxyXG5cdFx0XHRkZXN0cm95OiBudWxsLFxyXG5cdFx0XHRoYW5kbGU6ICcucmVzaXplLWhhbmRsZScsXHJcblx0XHRcdG1heEhlaWdodDogOTk5OSxcclxuXHRcdFx0bWF4V2lkdGg6IDk5OTksXHJcblx0XHRcdG1pbkhlaWdodDogMCxcclxuXHRcdFx0bWluV2lkdGg6IDAsXHJcblx0XHRcdHJlc2l6ZTogbnVsbCxcclxuXHRcdFx0cmVzaXplT25jZTogbnVsbCxcclxuXHRcdFx0c25hcFNpemU6IDEsXHJcblx0XHRcdHN0YXJ0OiBudWxsLFxyXG5cdFx0XHRzdG9wOiBudWxsXHJcblx0XHR9LCBvcHRpb25zKTtcclxuXHJcblx0XHRzZXR0aW5ncy5lbGVtZW50ID0gJCh0aGlzKTtcclxuXHJcblx0XHRmdW5jdGlvbiByZWNhbGN1bGF0ZVNpemUoZXZ0KSB7XHJcblx0XHRcdHZhciBkYXRhID0gZXZ0LmRhdGEsXHJcblx0XHRcdFx0cmVzaXplZCA9IHt9O1xyXG5cdFx0XHRkYXRhLmRpZmZYID0gTWF0aC5yb3VuZCgoZXZ0LnBhZ2VYIC0gZGF0YS5wYWdlWCkgLyBzZXR0aW5ncy5zbmFwU2l6ZSkgKiBzZXR0aW5ncy5zbmFwU2l6ZTtcclxuXHRcdFx0ZGF0YS5kaWZmWSA9IE1hdGgucm91bmQoKGV2dC5wYWdlWSAtIGRhdGEucGFnZVkpIC8gc2V0dGluZ3Muc25hcFNpemUpICogc2V0dGluZ3Muc25hcFNpemU7XHJcblx0XHRcdGlmIChNYXRoLmFicyhkYXRhLmRpZmZYKSA+IDAgfHwgTWF0aC5hYnMoZGF0YS5kaWZmWSkgPiAwKSB7XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZWxlbWVudC5oZWlnaHQoKSAhPT0gZGF0YS5oZWlnaHQgKyBkYXRhLmRpZmZZICYmXHJcblx0XHRcdFx0XHRkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgPj0gc2V0dGluZ3MubWluSGVpZ2h0ICYmXHJcblx0XHRcdFx0XHRkYXRhLmhlaWdodCArIGRhdGEuZGlmZlkgPD0gc2V0dGluZ3MubWF4SGVpZ2h0ICYmXHJcblx0XHRcdFx0XHQoc2V0dGluZ3MuY29udGFpbm1lbnQgPyBkYXRhLm91dGVySGVpZ2h0ICsgZGF0YS5kaWZmWSArIGRhdGEub2Zmc2V0LnRvcCA8PSBzZXR0aW5ncy5jb250YWlubWVudC5vZmZzZXQoKS50b3AgKyBzZXR0aW5ncy5jb250YWlubWVudC5vdXRlckhlaWdodCgpIDogdHJ1ZSlcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQuaGVpZ2h0KGRhdGEuaGVpZ2h0ICsgZGF0YS5kaWZmWSk7XHJcblx0XHRcdFx0XHRyZXNpemVkLmhlaWdodCA9IHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdHNldHRpbmdzLmVsZW1lbnQud2lkdGgoKSAhPT0gZGF0YS53aWR0aCArIGRhdGEuZGlmZlggJiZcclxuXHRcdFx0XHRcdGRhdGEud2lkdGggKyBkYXRhLmRpZmZYID49IHNldHRpbmdzLm1pbldpZHRoICYmXHJcblx0XHRcdFx0XHRkYXRhLndpZHRoICsgZGF0YS5kaWZmWCA8PSBzZXR0aW5ncy5tYXhXaWR0aCAmJlxyXG5cdFx0XHRcdFx0KHNldHRpbmdzLmNvbnRhaW5tZW50ID8gZGF0YS5vdXRlcldpZHRoICsgZGF0YS5kaWZmWCArIGRhdGEub2Zmc2V0LmxlZnQgPD0gc2V0dGluZ3MuY29udGFpbm1lbnQub2Zmc2V0KCkubGVmdCArIHNldHRpbmdzLmNvbnRhaW5tZW50Lm91dGVyV2lkdGgoKSA6IHRydWUpXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRzZXR0aW5ncy5lbGVtZW50LndpZHRoKGRhdGEud2lkdGggKyBkYXRhLmRpZmZYKTtcclxuXHRcdFx0XHRcdHJlc2l6ZWQud2lkdGggPSB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAocmVzaXplZC5oZWlnaHQgfHwgcmVzaXplZC53aWR0aCkge1xyXG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzLnJlc2l6ZU9uY2UpIHtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplT25jZS5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKGV2dC5kYXRhKTtcclxuXHRcdFx0XHRcdFx0c2V0dGluZ3MucmVzaXplT25jZSA9IG51bGw7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRpZiAoc2V0dGluZ3MucmVzaXplKSB7XHJcblx0XHRcdFx0XHRcdHNldHRpbmdzLnJlc2l6ZS5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKGV2dC5kYXRhKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGlmIChzZXR0aW5ncy5hbHNvUmVzaXplKSB7XHJcblx0XHRcdFx0XHRcdGlmIChyZXNpemVkLmhlaWdodCAmJiAoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUgPT09ICdoZWlnaHQnIHx8IHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnYm90aCcpKSB7XHJcblx0XHRcdFx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZS5oZWlnaHQoZGF0YS5hbHNvUmVzaXplSGVpZ2h0ICsgZGF0YS5kaWZmWSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0aWYgKHJlc2l6ZWQud2lkdGggJiYgKHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnd2lkdGgnIHx8IHNldHRpbmdzLmFsc29SZXNpemVUeXBlID09PSAnYm90aCcpKSB7XHJcblx0XHRcdFx0XHRcdFx0c2V0dGluZ3MuYWxzb1Jlc2l6ZS53aWR0aChkYXRhLmFsc29SZXNpemVXaWR0aCArIGRhdGEuZGlmZlgpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gc3RhcnQoZXZ0KSB7XHJcblx0XHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRpZiAoc2V0dGluZ3Muc3RhcnQpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5zdGFydC5iaW5kKHNldHRpbmdzLmVsZW1lbnQpKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0dmFyIGRhdGEgPSB7XHJcblx0XHRcdFx0YWxzb1Jlc2l6ZUhlaWdodDogc2V0dGluZ3MuYWxzb1Jlc2l6ZSA/IHNldHRpbmdzLmFsc29SZXNpemUuaGVpZ2h0KCkgOiAwLFxyXG5cdFx0XHRcdGFsc29SZXNpemVXaWR0aDogc2V0dGluZ3MuYWxzb1Jlc2l6ZSA/IHNldHRpbmdzLmFsc29SZXNpemUud2lkdGgoKSA6IDAsXHJcblx0XHRcdFx0aGVpZ2h0OiBzZXR0aW5ncy5lbGVtZW50LmhlaWdodCgpLFxyXG5cdFx0XHRcdG9mZnNldDogc2V0dGluZ3MuZWxlbWVudC5vZmZzZXQoKSxcclxuXHRcdFx0XHRvdXRlckhlaWdodDogc2V0dGluZ3MuZWxlbWVudC5vdXRlckhlaWdodCgpLFxyXG5cdFx0XHRcdG91dGVyV2lkdGg6IHNldHRpbmdzLmVsZW1lbnQub3V0ZXJXaWR0aCgpLFxyXG5cdFx0XHRcdHBhZ2VYOiBldnQucGFnZVgsXHJcblx0XHRcdFx0cGFnZVk6IGV2dC5wYWdlWSxcclxuXHRcdFx0XHR3aWR0aDogc2V0dGluZ3MuZWxlbWVudC53aWR0aCgpXHJcblx0XHRcdH07XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZW1vdmUnLCAnKicsIGRhdGEsIHJlY2FsY3VsYXRlU2l6ZSk7XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwJywgJyonLCBzdG9wKTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBzdG9wKCkge1xyXG5cdFx0XHRpZiAoc2V0dGluZ3Muc3RvcCkge1xyXG5cdFx0XHRcdHNldHRpbmdzLnN0b3AuYmluZChzZXR0aW5ncy5lbGVtZW50KSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdCQoZG9jdW1lbnQpLm9mZignbW91c2Vtb3ZlJywgJyonLCByZWNhbGN1bGF0ZVNpemUpO1xyXG5cdFx0XHQkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCAnKicsIHN0b3ApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChzZXR0aW5ncy5oYW5kbGUpIHtcclxuXHRcdFx0aWYgKHNldHRpbmdzLmFsc29SZXNpemUgJiYgWydib3RoJywgJ2hlaWdodCcsICd3aWR0aCddLmluZGV4T2Yoc2V0dGluZ3MuYWxzb1Jlc2l6ZVR5cGUpID49IDApIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5hbHNvUmVzaXplID0gJChzZXR0aW5ncy5hbHNvUmVzaXplKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoc2V0dGluZ3MuY29udGFpbm1lbnQpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5jb250YWlubWVudCA9ICQoc2V0dGluZ3MuY29udGFpbm1lbnQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHNldHRpbmdzLmhhbmRsZSA9ICQoc2V0dGluZ3MuaGFuZGxlKTtcclxuXHRcdFx0c2V0dGluZ3Muc25hcFNpemUgPSBzZXR0aW5ncy5zbmFwU2l6ZSA8IDEgPyAxIDogc2V0dGluZ3Muc25hcFNpemU7XHJcblxyXG5cdFx0XHRpZiAob3B0aW9ucyA9PT0gJ2Rlc3Ryb3knKSB7XHJcblx0XHRcdFx0c2V0dGluZ3MuaGFuZGxlLm9mZignbW91c2Vkb3duJywgc3RhcnQpO1xyXG5cclxuXHRcdFx0XHRpZiAoc2V0dGluZ3MuZGVzdHJveSkge1xyXG5cdFx0XHRcdFx0c2V0dGluZ3MuZGVzdHJveS5iaW5kKHRoaXMpKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzZXR0aW5ncy5oYW5kbGUub24oJ21vdXNlZG93bicsIHN0YXJ0KTtcclxuXHJcblx0XHRcdGlmIChzZXR0aW5ncy5jcmVhdGUpIHtcclxuXHRcdFx0XHRzZXR0aW5ncy5jcmVhdGUuYmluZCh0aGlzKSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9O1xyXG59KShqUXVlcnkpO1xyXG4iXX0=
