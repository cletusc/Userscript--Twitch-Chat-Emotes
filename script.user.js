// ==UserScript==
// @name Twitch Chat Emotes
// @namespace #Cletus
// @version 0.6.3
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
// @exclude http://chatdepot.twitch.tv/*
// @exclude http://*.twitch.tv/*/profile*
// ==/UserScript==

// This script was generated using an automated build script.
// See project build guide linked at http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/ for more info.

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
/**
 * Minified file. Third-party version information can be found in /package.json.
 * Original filename: \node_modules\hogan.js\lib\template.js
 */
var Hogan={};!function(t){function i(t,i,s){var e;return i&&"object"==typeof i&&(void 0!==i[t]?e=i[t]:s&&i.get&&"function"==typeof i.get&&(e=i.get(t))),e}function s(t,i,s,e,n,r){function o(){}function u(){}o.prototype=t,u.prototype=t.subs;var a,c=new o;c.subs=new u,c.subsText={},c.buf="",e=e||{},c.stackSubs=e,c.subsText=r;for(a in i)e[a]||(e[a]=i[a]);for(a in e)c.subs[a]=e[a];n=n||{},c.stackPartials=n;for(a in s)n[a]||(n[a]=s[a]);for(a in n)c.partials[a]=n[a];return c}function e(t){return String(null===t||void 0===t?"":t)}function n(t){return t=e(t),h.test(t)?t.replace(r,"&amp;").replace(o,"&lt;").replace(u,"&gt;").replace(a,"&#39;").replace(c,"&quot;"):t}t.Template=function(t,i,s,e){t=t||{},this.r=t.code||this.r,this.c=s,this.options=e||{},this.text=i||"",this.partials=t.partials||{},this.subs=t.subs||{},this.buf=""},t.Template.prototype={r:function(){return""},v:n,t:e,render:function(t,i,s){return this.ri([t],i||{},s)},ri:function(t,i,s){return this.r(t,i,s)},ep:function(t,i){var e=this.partials[t],n=i[e.name];if(e.instance&&e.base==n)return e.instance;if("string"==typeof n){if(!this.c)throw new Error("No compiler available.");n=this.c.compile(n,this.options)}if(!n)return null;if(this.partials[t].base=n,e.subs){i.stackText||(i.stackText={});for(key in e.subs)i.stackText[key]||(i.stackText[key]=void 0!==this.activeSub&&i.stackText[this.activeSub]?i.stackText[this.activeSub]:this.text);n=s(n,e.subs,e.partials,this.stackSubs,this.stackPartials,i.stackText)}return this.partials[t].instance=n,n},rp:function(t,i,s,e){var n=this.ep(t,s);return n?n.ri(i,s,e):""},rs:function(t,i,s){var e=t[t.length-1];if(!f(e))return void s(t,i,this);for(var n=0;n<e.length;n++)t.push(e[n]),s(t,i,this),t.pop()},s:function(t,i,s,e,n,r,o){var u;return f(t)&&0===t.length?!1:("function"==typeof t&&(t=this.ms(t,i,s,e,n,r,o)),u=!!t,!e&&u&&i&&i.push("object"==typeof t?t:i[i.length-1]),u)},d:function(t,s,e,n){var r,o=t.split("."),u=this.f(o[0],s,e,n),a=this.options.modelGet,c=null;if("."===t&&f(s[s.length-2]))u=s[s.length-1];else for(var h=1;h<o.length;h++)r=i(o[h],u,a),void 0!==r?(c=u,u=r):u="";return n&&!u?!1:(n||"function"!=typeof u||(s.push(c),u=this.mv(u,s,e),s.pop()),u)},f:function(t,s,e,n){for(var r=!1,o=null,u=!1,a=this.options.modelGet,c=s.length-1;c>=0;c--)if(o=s[c],r=i(t,o,a),void 0!==r){u=!0;break}return u?(n||"function"!=typeof r||(r=this.mv(r,s,e)),r):n?!1:""},ls:function(t,i,s,n,r){var o=this.options.delimiters;return this.options.delimiters=r,this.b(this.ct(e(t.call(i,n)),i,s)),this.options.delimiters=o,!1},ct:function(t,i,s){if(this.options.disableLambda)throw new Error("Lambda features disabled.");return this.c.compile(t,this.options).render(i,s)},b:function(t){this.buf+=t},fl:function(){var t=this.buf;return this.buf="",t},ms:function(t,i,s,e,n,r,o){var u,a=i[i.length-1],c=t.call(a);return"function"==typeof c?e?!0:(u=this.activeSub&&this.subsText&&this.subsText[this.activeSub]?this.subsText[this.activeSub]:this.text,this.ls(c,a,s,u.substring(n,r),o)):c},mv:function(t,i,s){var n=i[i.length-1],r=t.call(n);return"function"==typeof r?this.ct(e(r.call(n)),n,s):r},sub:function(t,i,s,e){var n=this.subs[t];n&&(this.activeSub=t,n(i,s,this,e),this.activeSub=!1)}};var r=/&/g,o=/</g,u=/>/g,a=/\'/g,c=/\"/g,h=/[&<>\"\']/,f=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)}}("undefined"!=typeof exports?exports:Hogan);
// End vendor JS.

	// Template files.
	var templates = (function () {
		// Start templates.
    var templates = {};
    templates['emote'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote\" data-emote=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\" title=\"");t.b(t.v(t.f("text",c,p,0)));t.b("\">\r");t.b("\n" + i);t.b("	<div style=\"background-image: url(");t.b(t.t(t.d("image.url",c,p,0)));t.b("); height: ");t.b(t.t(t.d("image.height",c,p,0)));t.b("px; width: ");t.b(t.t(t.d("image.width",c,p,0)));t.b("px\"></div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteButton'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<button class=\"button glyph-only\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['emoteGroupHeader'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");if(t.s(t.f("isAddonHeader",c,p,1),c,p,0,18,218,"{{ }}")){t.rs(c,p,function(c,p,t){t.b("	<div class=\"group-header addon-emotes-header\" title=\"Below are emotes added by an addon. Only those who also have the same addon installed can see these emotes in chat.\">\r");t.b("\n" + i);t.b("		Addon Emotes\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);});c.pop();}t.b("\r");t.b("\n" + i);if(!t.s(t.f("isAddonHeader",c,p,1),c,p,1,0,0,"")){t.b("	<div class=\"group-header\" data-emote-channel=\"");t.b(t.v(t.f("channel",c,p,0)));t.b("\"><img src=\"");t.b(t.v(t.f("badge",c,p,0)));t.b("\" />");t.b(t.v(t.f("channel",c,p,0)));t.b("</div>\r");t.b("\n" + i);};return t.fl(); },partials: {}, subs: {  }});
    templates['menu'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("<div class=\"emote-menu dropmenu\" id=\"emote-menu-for-twitch\">\r");t.b("\n" + i);t.b("	<div class=\"draggable\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"group-header\">All Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container scrollable\" id=\"all-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"group-header\">Popular Emotes</div>\r");t.b("\n" + i);t.b("	<div class=\"group-container single-row\" id=\"popular-emotes-group\"></div>\r");t.b("\n" + i);t.b("\r");t.b("\n" + i);t.b("	<div class=\"footer\">\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-home\" href=\"http://cletusc.github.io/Userscript--Twitch-Chat-Emotes\" target=\"_blank\" title=\"Visit the homepage where you can donate, post a review, or contact the developer\"></a>\r");t.b("\n" + i);t.b("		<a class=\"pull-left icon icon-pin\" data-command=\"toggle-pinned\" title=\"Pin/unpin the emote menu to the screen\"></a>\r");t.b("\n" + i);t.b("		<a title=\"Reset the popularity of the emotes back to default\" data-command=\"reset-popularity\">Reset Popularity</a>\r");t.b("\n" + i);t.b("		<a class=\"pull-right icon icon-resize-handle\" data-command=\"resize-handle\"></a>\r");t.b("\n" + i);t.b("	</div>\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['newsMessage'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("\r");t.b("\n" + i);t.b("<div class=\"twitch-chat-emotes-news\">\r");t.b("\n" + i);t.b("	[");t.b(t.v(t.f("scriptName",c,p,0)));t.b("] News: ");t.b(t.t(t.f("message",c,p,0)));t.b(" (<a href=\"#\" data-command=\"twitch-chat-emotes:dismiss-news\" data-news-id=\"");t.b(t.v(t.f("id",c,p,0)));t.b("\">Dismiss</a>)\r");t.b("\n" + i);t.b("</div>\r");t.b("\n");return t.fl(); },partials: {}, subs: {  }});
    templates['styles'] = new Hogan.Template({code: function (c,p,i) { var t=this;t.b(i=i||"");t.b("/**");t.b("\n" + i);t.b(" * Minified file. Third-party version information can be found in /package.json.");t.b("\n" + i);t.b(" * Original filename: \\node_modules\\jquery-custom-scrollbar\\jquery.custom-scrollbar.css");t.b("\n" + i);t.b(" */");t.b("\n" + i);t.b(".scrollable{position:relative}.scrollable:focus{outline:0}.scrollable .viewport{position:relative;overflow:hidden}.scrollable .viewport .overview{position:absolute}.scrollable .scroll-bar{display:none}.scrollable .scroll-bar.vertical{position:absolute;right:0;height:100%}.scrollable .scroll-bar.horizontal{position:relative;width:100%}.scrollable .scroll-bar .thumb{position:absolute}.scrollable .scroll-bar.vertical .thumb{width:100%;min-height:10px}.scrollable .scroll-bar.horizontal .thumb{height:100%;min-width:10px;left:0}.not-selectable{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.scrollable.default-skin{padding-right:10px;padding-bottom:6px}.scrollable.default-skin .scroll-bar.vertical{width:6px}.scrollable.default-skin .scroll-bar.horizontal{height:6px}.scrollable.default-skin .scroll-bar .thumb{background-color:#000;opacity:.4;border-radius:3px;-moz-border-radius:4px;-webkit-border-radius:4px}.scrollable.default-skin .scroll-bar:hover .thumb{opacity:.6}.scrollable.gray-skin{padding-right:17px}.scrollable.gray-skin .scroll-bar{border:1px solid gray;background-color:#d3d3d3}.scrollable.gray-skin .scroll-bar .thumb{background-color:gray}.scrollable.gray-skin .scroll-bar:hover .thumb{background-color:#000}.scrollable.gray-skin .scroll-bar.vertical{width:10px}.scrollable.gray-skin .scroll-bar.horizontal{height:10px;margin-top:2px}.scrollable.modern-skin{padding-right:17px}.scrollable.modern-skin .scroll-bar{border:1px solid gray;border-radius:4px;-moz-border-radius:4px;-webkit-border-radius:4px;-webkit-box-shadow:inset 0 0 5px #888;box-shadow:inset 0 0 5px #888}.scrollable.modern-skin .scroll-bar .thumb{background-color:#95aabf;border-radius:4px;-moz-border-radius:4px;-webkit-border-radius:4px;border:1px solid #536984}.scrollable.modern-skin .scroll-bar.vertical .thumb{width:8px;background:-webkit-gradient(linear,left top,right top,color-stop(0%,#95aabf),color-stop(100%,#547092));background:-webkit-linear-gradient(left,#95aabf 0,#547092 100%);background:-webkit-gradient(linear,left top,right top,from(#95aabf),to(#547092));background:linear-gradient(to right,#95aabf 0,#547092 100%);-ms-filter:\"progid:DXImageTransform.Microsoft.gradient( startColorstr='#95aabf', endColorstr='#547092',GradientType=1 )\"}.scrollable.modern-skin .scroll-bar.horizontal .thumb{height:8px;background-image:-webkit-gradient(linear,left top,left bottom,from(#95aabf),to(#547092));background-image:linear-gradient(#95aabf,#547092);background-image:-webkit-linear-gradient(#95aabf,#547092);-ms-filter:\"progid:DXImageTransform.Microsoft.gradient( startColorstr='#95aabf', endColorstr='#547092',GradientType=0 )\"}.scrollable.modern-skin .scroll-bar.vertical{width:10px}.scrollable.modern-skin .scroll-bar.horizontal{height:10px;margin-top:2px}");t.b("\n" + i);t.b("/**");t.b("\n" + i);t.b(" * Minified file. Third-party version information can be found in /package.json.");t.b("\n" + i);t.b(" * Original filename: \\src\\styles\\style.css");t.b("\n" + i);t.b(" */");t.b("\n" + i);t.b("#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;margin-left:7px}#emote-menu-button.active{border-radius:2px;background-color:rgba(128,128,128,.5)}.emote-menu{padding:5px;z-index:1000;display:none;background-color:#202020}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-popular{height:38px}.emote-menu .draggable{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05) 5px,rgba(255,255,255,.05) 10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:-webkit-repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px);background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1) 5px,rgba(255,255,255,.1) 10px)}.emote-menu .group-header{border-top:1px solid #000;-webkit-box-shadow:0 1px 0 rgba(255,255,255,.05) inset;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;background-image:-webkit-gradient(linear,left bottom,left top,from(transparent),to(rgba(0,0,0,.5)));background-image:-webkit-linear-gradient(bottom,transparent,rgba(0,0,0,.5));background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center}.emote-menu .group-header img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:32px;height:32px}.emote-menu .emote div{max-width:32px;max-height:32px;background-repeat:no-repeat;-webkit-background-size:contain;background-size:contain;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;-webkit-box-shadow:0 1px 0 rgba(255,255,255,.05) inset;box-shadow:0 1px 0 rgba(255,255,255,.05) inset;padding:5px 0 2px;margin-top:5px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5;-webkit-background-size:contain!important;background-size:contain!important}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-home{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB2ZXJzaW9uPSIxLjEiCiAgIHdpZHRoPSI2NCIKICAgaGVpZ2h0PSI2NCIKICAgdmlld0JveD0iMCAwIDY0IDY0IgogICBpZD0iQ2FwYV8xIgogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGEKICAgaWQ9Im1ldGFkYXRhMzAwMSI+PHJkZjpSREY+PGNjOldvcmsKICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcwogICBpZD0iZGVmczI5OTkiIC8+CjxwYXRoCiAgIGQ9Im0gNTcuMDYyLDMxLjM5OCBjIDAuOTMyLC0xLjAyNSAwLjg0MiwtMi41OTYgLTAuMjAxLC0zLjUwOCBMIDMzLjg4NCw3Ljc4NSBDIDMyLjg0MSw2Ljg3MyAzMS4xNjksNi44OTIgMzAuMTQ4LDcuODI4IEwgNy4wOTMsMjguOTYyIGMgLTEuMDIxLDAuOTM2IC0xLjA3MSwyLjUwNSAtMC4xMTEsMy41MDMgbCAwLjU3OCwwLjYwMiBjIDAuOTU5LDAuOTk4IDIuNTA5LDEuMTE3IDMuNDYsMC4yNjUgbCAxLjcyMywtMS41NDMgdiAyMi41OSBjIDAsMS4zODYgMS4xMjMsMi41MDggMi41MDgsMi41MDggaCA4Ljk4NyBjIDEuMzg1LDAgMi41MDgsLTEuMTIyIDIuNTA4LC0yLjUwOCBWIDM4LjU3NSBoIDExLjQ2MyB2IDE1LjgwNCBjIC0wLjAyLDEuMzg1IDAuOTcxLDIuNTA3IDIuMzU2LDIuNTA3IGggOS41MjQgYyAxLjM4NSwwIDIuNTA4LC0xLjEyMiAyLjUwOCwtMi41MDggViAzMi4xMDcgYyAwLDAgMC40NzYsMC40MTcgMS4wNjMsMC45MzMgMC41ODYsMC41MTUgMS44MTcsMC4xMDIgMi43NDksLTAuOTI0IGwgMC42NTMsLTAuNzE4IHoiCiAgIGlkPSJwYXRoMjk5NSIKICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4KPC9zdmc+) no-repeat 50%}.emote-menu .icon-resize-handle{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB2ZXJzaW9uPSIxLjEiCiAgIHdpZHRoPSIxNiIKICAgaGVpZ2h0PSIxNiIKICAgdmlld0JveD0iMCAwIDE2IDE2IgogICBpZD0iQ2FwYV8xIgogICB4bWw6c3BhY2U9InByZXNlcnZlIj48bWV0YWRhdGEKICAgaWQ9Im1ldGFkYXRhNDM1NyI+PHJkZjpSREY+PGNjOldvcmsKICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQogICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPjxkYzp0aXRsZT48L2RjOnRpdGxlPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48ZGVmcwogICBpZD0iZGVmczQzNTUiIC8+CjxwYXRoCiAgIGQ9Ik0gMTMuNSw4IEMgMTMuMjI1LDggMTMsOC4yMjQgMTMsOC41IHYgMy43OTMgTCAzLjcwNywzIEggNy41IEMgNy43NzYsMyA4LDIuNzc2IDgsMi41IDgsMi4yMjQgNy43NzYsMiA3LjUsMiBoIC01IEwgMi4zMDksMi4wMzkgMi4xNSwyLjE0NCAyLjE0NiwyLjE0NiAyLjE0MywyLjE1MiAyLjAzOSwyLjMwOSAyLDIuNSB2IDUgQyAyLDcuNzc2IDIuMjI0LDggMi41LDggMi43NzYsOCAzLDcuNzc2IDMsNy41IFYgMy43MDcgTCAxMi4yOTMsMTMgSCA4LjUgQyA4LjIyNCwxMyA4LDEzLjIyNSA4LDEzLjUgOCwxMy43NzUgOC4yMjQsMTQgOC41LDE0IGggNSBsIDAuMTkxLC0wLjAzOSBjIDAuMTIxLC0wLjA1MSAwLjIyLC0wLjE0OCAwLjI3LC0wLjI3IEwgMTQsMTMuNTAyIFYgOC41IEMgMTQsOC4yMjQgMTMuNzc1LDggMTMuNSw4IHoiCiAgIGlkPSJwYXRoNDM1MSIKICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4KPC9zdmc+) no-repeat 50%;cursor:nwse-resize!important}.emote-menu .icon-pin{background:url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB2ZXJzaW9uPSIxLjEiCiAgIHdpZHRoPSIxNiIKICAgaGVpZ2h0PSIxNiIKICAgaWQ9InN2ZzMwMDUiPgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTMwMjMiPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxkZWZzCiAgICAgaWQ9ImRlZnMzMDIxIiAvPgogIDxnCiAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC43OTMwNzgyLDAsMCwwLjc5MzA3ODIsLTIuMTcwOTg1LC04MTQuNjkyOTkpIgogICAgIGlkPSJnMzAwNyI+CiAgICA8ZwogICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC43MDcxMSwwLjcwNzExLC0wLjcwNzExLDAuNzA3MTEsNzM3LjcwNzU1LDI5NS40ODgwOCkiCiAgICAgICBpZD0iZzMwMDkiPgogICAgICA8ZwogICAgICAgICBpZD0iZzM3NTUiPgogICAgICAgIDxwYXRoCiAgICAgICAgICAgZD0iTSA5Ljc4MTI1LDAgQyA5LjQ3NDA1NjIsMC42ODkxMTIgOS41MjA2OCwxLjUyMzA4NTMgOS4zMTI1LDIuMTg3NSBMIDQuOTM3NSw2LjU5Mzc1IEMgMy45NTg5NjA4LDYuNDI5NDgzIDIuOTQ3NzU0OCw2LjUzMjc4OTkgMiw2LjgxMjUgTCA1LjAzMTI1LDkuODQzNzUgMC41NjI1LDE0LjMxMjUgMCwxNiBDIDAuNTY5Mjk2MjgsMTUuNzk1NjI2IDEuMTY3NzM3OCwxNS42NDAyMzcgMS43MTg3NSwxNS40MDYyNSBMIDYuMTU2MjUsMTAuOTY4NzUgOS4xODc1LDE0IGMgMC4yNzk2ODIzLC0wLjk0Nzc4MyAwLjM4MzE1MjgsLTEuOTU4OTM3IDAuMjE4NzUsLTIuOTM3NSAxLjUwMDAxMSwtMS40ODk1Nzk4IDMuMDAwMDAxLC0yLjk3OTE1OSA0LjUsLTQuNDY4NzUgMC42MDExMDIsLTAuMDMxMzYxIDEuODIyMTM4LC0wLjA5NjEzNyAyLC0wLjQ2ODc1IEMgMTMuODc5ODkyLDQuMDY5NDgwMyAxMS44NDI4NjUsMi4wMjAyMjgyIDkuNzgxMjUsMCB6IgogICAgICAgICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuODkxNTkzNzQsLTAuODkxNTkzNzQsMC44OTE1OTM3NCwwLjg5MTU5Mzc0LC0yLjI2NTUsMTAzNy4xMzQ1KSIKICAgICAgICAgICBpZD0icGF0aDMwMTEiCiAgICAgICAgICAgc3R5bGU9ImZpbGw6I2ZmZmZmZjtmaWxsLW9wYWNpdHk6MSIgLz4KICAgICAgPC9nPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==) no-repeat 50%;-webkit-transition:all .25s ease;transition:all .25s ease}.emote-menu .icon-pin:hover,.emote-menu.pinned .icon-pin{-webkit-transform:rotate(-45deg);-ms-transform:rotate(-45deg);transform:rotate(-45deg);opacity:1}.emote-menu .scrollable.default-skin{padding-right:0;padding-bottom:0}.emote-menu .scrollable.default-skin .scroll-bar .thumb{background-color:#555;opacity:.2;z-index:1}");return t.fl(); },partials: {}, subs: {  }});
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
	var pkg = {"name":"twitch-chat-emotes","version":"0.6.3","homepage":"http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/","bugs":"https://github.com/cletusc/Userscript--Twitch-Chat-Emotes/issues","author":"Ryan Chatham <ryan.b.chatham@gmail.com> (https://github.com/cletusc)","repository":{"type":"git","url":"https://github.com/cletusc/Userscript--Twitch-Chat-Emotes.git"},"userscript":{"name":"Twitch Chat Emotes","namespace":"#Cletus","version":"{{{pkg.version}}}","description":"Adds a button to Twitch that allows you to \"click-to-insert\" an emote.","copyright":"2011+, {{{pkg.author}}}","author":"{{{pkg.author}}}","icon":"http://www.gravatar.com/avatar.php?gravatar_id=6875e83aa6c563790cb2da914aaba8b3&r=PG&s=48&default=identicon","license":["MIT; http://opensource.org/licenses/MIT","CC BY-NC-SA 3.0; http://creativecommons.org/licenses/by-nc-sa/3.0/"],"homepage":"{{{pkg.homepage}}}","supportURL":"{{{pkg.bugs}}}","contributionURL":"http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/#donate","grant":"none","include":"http://*.twitch.tv/*","exclude":["http://api.twitch.tv/*","http://chatdepot.twitch.tv/*","http://*.twitch.tv/*/profile*"]},"scripts":{"install":"napa"},"devDependencies":{"napa":"~0.4.1","gulp":"^3.8.3","hogan.js":"^3.0.2","gulp-concat":"^2.2.0","gulp-conflict":"^0.1.2","gulp-css-base64":"^1.1.0","gulp-minify-css":"^0.3.5","gulp-header":"^1.0.2","gulp-hogan-compile":"^0.2.1","vinyl-map":"^1.0.1","gulp-rename":"^1.2.0","gulp-uglify":"^0.3.1","gulp-autoprefixer":"0.0.8"},"napa":{"jquery-custom-scrollbar":"mzubala/jquery-custom-scrollbar#0.5.5"}};
	var $ = null;
	var jQuery = null;

	// Start script.
// Script-wide variables.
//-----------------------
var emotes = {
	usable: [],
	get raw() {
		if (window.App) {
			return window.App.__container__.lookup('controller:emoticons').get('emoticons');
		}
		return [];
	},
	subscriptions: {
		badges: {},
		emotes: {}
	}
};
var emotePopularity = false;
var isInitiated = false;

// DOM elements.
var elements = {
	// The button to send a chat message.
	chatButton: null,
	// The area where the menu button will be placed.
	menuButtonContainer: null,
	// The area where all chat messages are contained.
	chatContainer: null,
	// The input field for chat messages.
	chatBox: null,
	// The button used to show the menu.
	menuButton: null,
	// The menu that contains all emotes.
	menu: null
};

var SCRIPT_NAME = pkg.userscript.name;
var MESSAGES = {
	NO_CHAT_ELEMENT: 'There is no chat element on the page, unable to continue.',
	OBJECTS_NOT_LOADED: 'Needed objects haven\'t loaded yet.',
	TIMEOUT_SCRIPT_LOAD: 'Script took too long to load. Refresh to try again.'
};

var helpers = {
	user: {
		/**
		 * Check if user is logged in, and prompts them to if they aren't.
		 * @return {boolean} `true` if logged in, `false` if logged out.
		 */
		login: function () {
			// Check if logged in already.
			if (window.Twitch && window.Twitch.user.isLoggedIn()) {
				return true;
			}
			// Not logged in, call Twitch's login method.
			$.login();
			return false;	
		}
	}
};

// Quick manipulation of script-wide variables.
//---------------------------------------------
// Prefix all messages with script name.
for (var message in MESSAGES) {
	if (MESSAGES.hasOwnProperty(message)) {
		MESSAGES[message] = '[' + SCRIPT_NAME + ']: ' + MESSAGES[message];
	}
}

// Only enable script if we have the right variables.
//---------------------------------------------------
(function init(time) {
	var routes = window.App && (window.App.ChannelRoute || window.App.ChatRoute);
	var objectsLoaded = (
		window.Twitch !== undefined &&
		(
			window.App !== undefined &&
			window.App.__container__ !== undefined &&
			window.App.__container__.lookup('controller:emoticons').get('emoticons') !== undefined &&
			window.App.__container__.lookup('controller:emoticons').get('emoticons').length
		) &&
		window.jQuery !== undefined &&
		// Chat button.
		document.querySelector('#chat_speak, .send-chat-button')
	);
	if (!isInitiated && routes) {
		var activate = {
			activate: function () {
				this._super();
				init(50);
			}
		};

		if (window.App.ChannelRoute) {
			window.App.ChannelRoute.reopen(activate);
			isInitiated = true;
		}
		if (window.App.ChatRoute) {
			window.App.ChatRoute.reopen(activate);
			isInitiated = true;
		}
	}
	if (!objectsLoaded || !routes) {
		// Errors in approximately 102400ms.
		if (time >= 60000) {
			console.error(MESSAGES.TIMEOUT_SCRIPT_LOAD);
			return;
		}
		if (time >= 10000) {
			if (!objectsLoaded) {
				console.warn(MESSAGES.OBJECTS_NOT_LOADED);
			}
		}
		setTimeout(init, time, time * 2);
		return;
	}
	setup();
})(50);

// Start of functions.
//--------------------
/**
 * Runs initial setup of DOM and variables.
 */
function setup() {
	loadjQueryPlugins();

	elements.chatButton = $('.send-chat-button');
	elements.menuButtonContainer = $('.chat-buttons-container .chat-option-buttons');
	elements.chatBox = $('.chat-interface textarea');
	elements.chatContainer = $('.chat-messages');

	// No chat, just exit.
	if (!elements.chatButton.length) {
		console.warn(MESSAGES.NO_CHAT_ELEMENT);
		return;
	}

	createMenuElements();
	addStyle(templates.styles());
	bindListeners();
	showNews();

	// Get active subscriptions.
	window.Twitch.api.get(
		'/api/users/:login/tickets',
		{
			offset: 0,
			limit: 100,
			unended: true
		}
	).done(function (api) {
		api.tickets.forEach(function (ticket) {
			// Get subscriptions with emotes.
			if (ticket.product.emoticons && ticket.product.emoticons.length) {
				var badge = ticket.product.features.badge;
				var channel = ticket.product.owner_name;
				// Add channel badges.
				if (badge) {
					badge = 'http://static-cdn.jtvnw.net/jtv_user_pictures/' + [badge.prefix, badge.owner, badge.type, badge.uid, badge.sizes[0]].join('-') + '.' + badge.format;
				}
				else {
					badge = 'https://static-cdn.jtvnw.net/jtv_user_pictures/subscriber-star.png';
				}
				emotes.subscriptions.badges[channel] = badge;
				
				// Add emotes channel.
				ticket.product.emoticons.forEach(function (emote) {
					emotes.subscriptions.emotes[getEmoteFromRegEx(new RegExp(emote.regex))] = {
						channel: channel,
						url: emote.url
					};
				});
			}
		});
	});
}

/**
 * Creates the initial menu elements
 */
function createMenuElements() {
	// Remove menu button if found.
	elements.menuButton = $('#emote-menu-button');
	if (elements.menuButton.length) {
		elements.menuButton.remove();
	}
	// Create menu button.
	elements.menuButton = $(templates.emoteButton());
	elements.menuButton.appendTo(elements.menuButtonContainer);
	elements.menuButton.hide();

	// Only correct styling for non-BetterTTV.
	if (window.BetterTTV) {
		elements.menuButton.fadeIn();
	}
	else {
		elements.chatButton.animate({'left': '121px'}, {
			complete: function () {
				elements.menuButton.fadeIn();
			}
		});
	}

	// Remove menu if found.
	elements.menu = $('#emote-menu-for-twitch');
	if (elements.menu.length) {
		elements.menu.remove();
	}
	// Create menu.
	elements.menu = $(templates.menu());
	elements.menu.appendTo(document.body);
}

/**
 * Bind event listeners.
 */
function bindListeners() {

	function toggleMenu() {
		// Menu shown, hide it.
		if (elements.menu.is(':visible')) {
			elements.menu.hide();
			elements.menu.removeClass('pinned');
			elements.menuButton.removeClass('active');
		}
		// Menu hidden, show it.
		else if (helpers.user.login()) {
			populateEmotesMenu();
			elements.menu.show();
			elements.menuButton.addClass('active');

			$(document).on('mouseup', checkForClickOutside);

			// Menu moved, move it back.
			if (elements.menu.hasClass('moved')) {
				elements.menu.offset(JSON.parse(elements.menu.attr('data-offset')));
			}
			// Never moved, make it the same size as the chat window.
			else {
				var diff = elements.menu.height() - elements.menu.find('#all-emotes-group').height();
				// Adjust the size and position of the popup.
				elements.menu.height(elements.chatContainer.outerHeight() - (elements.menu.outerHeight() - elements.menu.height()));
				elements.menu.width(elements.chatContainer.outerWidth() - (elements.menu.outerWidth() - elements.menu.width()));
				elements.menu.offset(elements.chatContainer.offset());
				// Fix `.emotes-all` height.
				elements.menu.find('#all-emotes-group').height(elements.menu.height() - diff);
				elements.menu.find('#all-emotes-group').width(elements.menu.width());
			}
			// Recalculate any scroll bars.
			elements.menu.find('.scrollable').customScrollbar('resize');
		}

		function checkForClickOutside(e) {
			// Not outside of the menu, ignore the click.
			if ($(e.target).is('#emote-menu-for-twitch, #emote-menu-for-twitch *')) {
				return;
			}
			// Clicked on the menu button, just remove the listener and let the normal listener handle it.
			if (!elements.menu.is(':visible') || $(e.target).is('#emote-menu-button, #emote-menu-button *')) {
				$(document).off('mouseup', checkForClickOutside);
				return;
			}
			// Clicked outside, make sure the menu isn't pinned.
			if (!elements.menu.hasClass('pinned')) {
				// Menu wasn't pinned, remove listener.
				$(document).off('mouseup', checkForClickOutside);
				toggleMenu();
			}
		}
	}

	// Toggle menu.
	elements.menuButton.on('click', toggleMenu);

	// Make draggable.
	elements.menu.draggable({
		handle: '.draggable',
		start: function () {
			$(this).addClass('pinned');
			$(this).addClass('moved');
		},
		stop: function () {
			elements.menu.attr('data-offset', JSON.stringify(elements.menu.offset()));
		},
		containment: $(document.body)
	});

	elements.menu.resizable({
		handle: '[data-command="resize-handle"]',
		resize: function () {
			$(this).addClass('pinned');
			$(this).addClass('moved');
			// Recalculate any scroll bars.
			elements.menu.find('.scrollable').customScrollbar('resize');
		},
		alsoResize: elements.menu.find('.scrollable'),
		containment: $(document.body),
		minHeight: 180,
		minWidth: 200
	});

	// Enable the popularity reset.
	elements.menu.find('[data-command="reset-popularity"]').on('click', function () {
		emotePopularityClear();
		populateEmotesMenu();
	});

	// Enable menu pinning.
	elements.menu.find('[data-command="toggle-pinned"]').on('click', function () {
		elements.menu.toggleClass('pinned');
	});

	// Enable emote clicking (delegated).
	elements.menu.on('click', '.emote', function () {
		insertEmoteText($(this).attr('data-emote'));
	});

	elements.menu.find('.scrollable').customScrollbar({
		skin: 'default-skin',
		hScroll: false,
		preventDefaultScroll: true
	});
}

/**
 * Populates the popup menu with current emote data.
 */
function populateEmotesMenu() {
	var container;

	refreshUsableEmotes();

	// Add popular emotes.
	container = elements.menu.find('#popular-emotes-group');
	container.html('');
	emotes.usable.sort(sortByPopularity);
	emotes.usable.forEach(function (emote) {
		createEmote(emote, container);
	});

	// Add all emotes.
	container = elements.menu.find('#all-emotes-group');
	if (container.find('.overview').length) {
		container = container.find('.overview');
	}
	container.html('');
	emotes.usable.sort(sortBySet);
	emotes.usable.forEach(function (emote) {
		createEmote(emote, container, true);
	});

	// Recalculate any scroll bars.
	elements.menu.find('.scrollable').customScrollbar('resize');

	/**
	 * Sort by popularity: most used -> least used
	 */
	function sortByPopularity(a, b) {
		var aGet = emotePopularityGet(a.text);
		var bGet = emotePopularityGet(b.text);
		var aNumber = typeof aGet === 'number';
		var bNumber = typeof bGet === 'number';
		if (aNumber && !bNumber) {
			return -1;
		}
		if (bNumber && !aNumber) {
			return 1;
		}
		if (aGet < bGet) {
			return 1;
		}
		if (aGet > bGet) {
			return -1;
		}
		return sortByNormal(a, b);
	}

	/**
	 * Sort by alphanumeric in this order: symbols -> numbers -> AaBb... -> numbers
	 */
	function sortByNormal(a, b){
		a = a.text;
		b = b.text;
		if (a.toLowerCase() < b.toLowerCase()) {
			return -1;
		}
		if (a.toLowerCase() > b.toLowerCase()) {
			return 1;
		}
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		return 0;
	}

	/**
	 * Sort by emoticon set: basic smileys -> no set -> subscription emotes
	 */
	function sortBySet(a, b){
		// Override for turbo emotes.
		if (
			(a.channel && a.channel === 'Twitch Turbo') &&
			(!b.channel || (b.channel && b.channel !== 'Twitch Turbo'))
		) {
			return -1;
		}
		if (
			(b.channel && b.channel === 'Twitch Turbo') &&
			(!a.channel || (a.channel && a.channel !== 'Twitch Turbo'))
		) {
			return 1;
		}
		// Override for basic emotes.
		var basicEmotes = [':(', ':)', ':/', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o', '#/', ':7', ':>', ':S', '<]'];
		if (basicEmotes.indexOf(a.text) >= 0 &&	basicEmotes.indexOf(b.text) < 0) {
			return -1;
		}
		if (basicEmotes.indexOf(b.text) >= 0 &&	basicEmotes.indexOf(a.text) < 0) {
			return 1;
		}
		// Sort by channel name.
		if (a.channel && !b.channel) {
			return 1;
		}
		if (b.channel && !a.channel) {
			return -1;
		}
		if (a.channel && b.channel) {
			// Force addon emote groups below standard Twitch groups.
			if (emotes.subscriptions.badges[a.channel] && !emotes.subscriptions.badges[b.channel]) {
				return -1;
			}
			if (emotes.subscriptions.badges[b.channel] && !emotes.subscriptions.badges[a.channel]) {
				return 1;
			}

			var channelSort = sortByNormal({text: a.channel}, {text: b.channel});
			var normalSort = sortByNormal(a, b);
			if (channelSort === 0) {
				return normalSort;
			}
			return channelSort;
		}
		// Get it back to a stable sort.
		return sortByNormal(a, b);
	}
}

/**
 * Refreshes the usable emotes. An emote is deemed usable if it either has no set or the set is in your user info. For turbo sets, it will use the turbo if in your user info, otherwise fall back to default.
 */
function refreshUsableEmotes() {
	emotes.usable = [];
	emotes.raw.forEach(function (emote) {
		// Allow hiding of emotes from the menu.
		if (emote.hidden) {
			return;
		}
		if (!emote.text) {
			emote.text = getEmoteFromRegEx(emote.regex);
		}
		if (emotes.subscriptions.emotes[emote.text]) {
			emote.channel = emotes.subscriptions.emotes[emote.text].channel;
		}
		var defaultImage;
		emote.images.some(function (image) {
			if (image.emoticon_set === null) {
				defaultImage = image;
			}
			if (emotes.subscriptions.emotes[emote.text] && image.url === emotes.subscriptions.emotes[emote.text].url) {
				emote.image = image;
				return true;
			}
		});
		emote.image = emote.image || defaultImage;

		// Only add the emote if there is a URL.
		if (emote.image && emote.image.url !== null) {
			emotes.usable.push(emote);
		}
	});
}

/**
 * Adds / sets popularity of an emote. Note: saves popularity data to storage each time this is called.
 * @param {string} text          The text of the emote (e.g. "Kappa").
 * @param {number} [forceAmount] The amount of popularity to force the emote to have. If not specificed, popularity will increase by 1.
 */
function emotePopularityAdd(text, forceAmount) {
	emotePopularityInit();
	if (emotePopularity[text] === undefined) {
		emotePopularity[text] = 0;
	}
	if (typeof forceAmount === 'number' && forceAmount >= 0) {
		emotePopularity[text] = forceAmount;
	}
	else {
		emotePopularity[text]++;
	}
	setSetting('emote-popularity-tracking', JSON.stringify(emotePopularity));
}

/**
 * Gets the current popularity of an emote.
 * @param  {string} text The text of the emote (e.g. "Kappa").
 * @return {number}      The amount of popularity. Possible to be 0 if it has been forced.
 * @return {boolean}     `false` if the emote is not in the popularity tracking data (never been added by `emotePopularityAdd`).
 */
function emotePopularityGet(text) {
	emotePopularityInit();
	if (typeof emotePopularity[text] === 'number' && emotePopularity[text] >= 0) {
		return emotePopularity[text];
	}
	return false;
}

/**
 * Clears the current emote popularity tracking data.
 */
function emotePopularityClear() {
	deleteSetting('emote-popularity-tracking');
	emotePopularity = false;
	emotePopularityInit();
}

/**
 * Initiates the popularity tracking. This will pull data from storage, or if none exists, set some common defaults.
 */
function emotePopularityInit() {
	if (!emotePopularity) {
		emotePopularity = JSON.parse(getSetting('emote-popularity-tracking', '{}'));
		emotePopularityAdd('BibleThump', 0);
		emotePopularityAdd('DansGame', 0);
		emotePopularityAdd('FailFish', 0);
		emotePopularityAdd('Kappa', 0);
		emotePopularityAdd('Kreygasm', 0);
		emotePopularityAdd('SwiftRage', 0);
	}
}

/**
 * Inserts an emote into the chat box.
 * @param {string} text The text of the emote (e.g. "Kappa").
 */
function insertEmoteText(text) {
	emotePopularityAdd(text);
	// Get input.
	var element = document.querySelector('#chat_text_input, .chat-interface textarea');

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
	window.App.__container__.lookup('controller:chat').get('currentRoom').set('messageToSend', text);
	element.focus();
	// Put cursor at end.
	selectionEnd = element.selectionStart + text.length;
	element.setSelectionRange(selectionEnd, selectionEnd);

	// Close popup if it hasn't been moved by the user.
	if (!elements.menu.hasClass('pinned')) {
		elements.menuButton.click();
	}
	// Re-populate as it is still open.
	else {
		populateEmotesMenu();
	}
}

/**
 * Creates the emote element and listens for a click event that will add the emote text to the chat.
 * @param {object}  emote      The emote that you want to add. This object should be one coming from `emotes`.
 * @param {element} container  The HTML element that the emote should be appended to.
 * @param {boolean} showHeader Whether a header shouldbe created if found. Only creates the header once.
 */
function createEmote(emote, container, showHeader) {
	// Emote not usable or no container, can't add.
	if (!emote || !emote.image || !container.length) {
		return;
	}
	if (showHeader) {
		if (emote.channel && emote.channel !== 'Twitch Turbo') {
			var badge = emotes.subscriptions.badges[emote.channel] || emote.badge;
			// Add notice about addon emotes.
			if (!emotes.subscriptions.badges[emote.channel] && !elements.menu.find('.group-header.addon-emotes-header').length) {
				container.append(
					$(templates.emoteGroupHeader({
						isAddonHeader: true
					}))
				);
			}
			if (!elements.menu.find('.group-header[data-emote-channel="' + emote.channel + '"]').length) {
				container.append(
					$(templates.emoteGroupHeader({
						badge: badge,
						channel: emote.channel
					}))
				);
			}
		}
	}

	container.append(
		$(templates.emote({
			image: emote.image,
			text: emote.text
		}))
	);
}

/**
 * Show latest news.
 */
function showNews() {
	var dismissedNews = JSON.parse(getSetting('twitch-chat-emotes:dismissed-news', '[]'));
	var cachedNews = JSON.parse(getSetting('twitch-chat-emotes:cached-news', '{}'));
	// Only poll news feed once per day.
	if (Date.now() - getSetting('twitch-chat-emotes:news-date', 0) > 86400000) {
		$.ajax('https://api.github.com/repos/cletusc/Userscript--Twitch-Chat-Emotes/contents/news.json', {
			dataType: 'json',
			headers: {
				'Accept': 'application/vnd.github.v3.raw+json',
				'User-Agent': 'cletusc/Userscript--Twitch-Chat-Emotes'
			}
		}).done(function (data) {
			cachedNews = data || cachedNews;
			setSetting('twitch-chat-emotes:cached-news', JSON.stringify(cachedNews));
		}).always(function () {
			handleNewsFeed();
			setSetting('twitch-chat-emotes:news-date', Date.now());
		});
	}
	else {
		handleNewsFeed();
	}

	// Handles displaying of news feed.
	function handleNewsFeed() {
		for (var newsId in cachedNews) {
			if (cachedNews.hasOwnProperty(newsId) && dismissedNews.indexOf(newsId) === -1) {
				// TODO #43
			}
		}
		$('#chat_lines, .chat-messages').on('click', 'a[data-command="twitch-chat-emotes:dismiss-news"]', function (evt) {
			evt.preventDefault();
			dismissedNews.push($(this).data('news-id'));
			setSetting('twitch-chat-emotes:dismissed-news', JSON.stringify(dismissedNews));
			$(this).parent().parent().remove();
		});
	}
}

/**
 * Gets the usable emote text from a regex.
 * @attribute http://userscripts.org/scripts/show/160183 (adaption)
 */
function getEmoteFromRegEx(regex) {
	if (typeof regex === 'string') {
		regex = new RegExp(regex);
	}
	return decodeURI(regex.source)
		.replace('&gt\\;', '>') // right angle bracket
		.replace('&lt\\;', '<') // left angle bracket
		.replace(/\(\?![^)]*\)/g, '') // remove negative group
		.replace(/\(([^|])*\|?[^)]*\)/g, '$1') // pick first option from a group
		.replace(/\[([^|])*\|?[^\]]*\]/g, '$1') // pick first character from a character group
		.replace(/[^\\]\?/g, '') // remove optional chars
		.replace(/^\\b|\\b$/g, '') // remove boundaries
		.replace(/\\/g, ''); // unescape
}

// Generic functions.
//-------------------
/**
 * Adds a stylesheet to the document.
 * @param {string} text The styles to be added.
 */
function addStyle(text) {
	var style = document.createElement('style');
	style.textContent = text;
	document.querySelector('head').appendChild(style);
}

/**
 * Gets a storage value.
 * @param  {string} aKey     The key you want to get.
 * @param  {mixed}  aDefault The default value to return if there isn't anything in storage.
 * @return {mixed}           The value in storage or `aDefault` if there isn't anything in storage.
 */
function getSetting(aKey, aDefault) {
	var val = localStorage.getItem(aKey);
	if (val === null && typeof aDefault !== 'undefined') {
		return aDefault;
	}
	return val;
}
/**
 * Sets a storage value.
 * @param {string} aKey The key you want to set.
 * @param {mixed}  aVal The value you want to store.
 */
function setSetting(aKey, aVal) {
	localStorage.setItem(aKey, aVal);
}

/**
 * Deletes a storage key.
 * @param {string} aKey The key you want to set.
 */
function deleteSetting(aKey) {
	localStorage.removeItem(aKey);
}

	// End script.

	function loadjQueryPlugins() {
		$ = jQuery = window.jQuery;

		// Start jQuery plugins.
/**
 * Minified file. Third-party version information can be found in /package.json.
 * Original filename: \node_modules\jquery-custom-scrollbar\jquery.custom-scrollbar.js
 */
!function(e){e.fn.customScrollbar=function(i,t){var o={skin:void 0,hScroll:!0,vScroll:!0,updateOnWindowResize:!1,animationSpeed:300,onCustomScroll:void 0,swipeSpeed:1,wheelSpeed:40,fixedThumbWidth:void 0,fixedThumbHeight:void 0},s=function(i,t){this.$element=e(i),this.options=t,this.addScrollableClass(),this.addSkinClass(),this.addScrollBarComponents(),this.options.vScroll&&(this.vScrollbar=new n(this,new r)),this.options.hScroll&&(this.hScrollbar=new n(this,new l)),this.$element.data("scrollable",this),this.initKeyboardScrolling(),this.bindEvents()};s.prototype={addScrollableClass:function(){this.$element.hasClass("scrollable")||(this.scrollableAdded=!0,this.$element.addClass("scrollable"))},removeScrollableClass:function(){this.scrollableAdded&&this.$element.removeClass("scrollable")},addSkinClass:function(){"string"!=typeof this.options.skin||this.$element.hasClass(this.options.skin)||(this.skinClassAdded=!0,this.$element.addClass(this.options.skin))},removeSkinClass:function(){this.skinClassAdded&&this.$element.removeClass(this.options.skin)},addScrollBarComponents:function(){this.assignViewPort(),0==this.$viewPort.length&&(this.$element.wrapInner('<div class="viewport" />'),this.assignViewPort(),this.viewPortAdded=!0),this.assignOverview(),0==this.$overview.length&&(this.$viewPort.wrapInner('<div class="overview" />'),this.assignOverview(),this.overviewAdded=!0),this.addScrollBar("vertical","prepend"),this.addScrollBar("horizontal","append")},removeScrollbarComponents:function(){this.removeScrollbar("vertical"),this.removeScrollbar("horizontal"),this.overviewAdded&&this.$element.unwrap(),this.viewPortAdded&&this.$element.unwrap()},removeScrollbar:function(e){this[e+"ScrollbarAdded"]&&this.$element.find(".scroll-bar."+e).remove()},assignViewPort:function(){this.$viewPort=this.$element.find(".viewport")},assignOverview:function(){this.$overview=this.$viewPort.find(".overview")},addScrollBar:function(e,i){0==this.$element.find(".scroll-bar."+e).length&&(this.$element[i]("<div class='scroll-bar "+e+"'><div class='thumb'></div></div>"),this[e+"ScrollbarAdded"]=!0)},resize:function(e){this.vScrollbar&&this.vScrollbar.resize(e),this.hScrollbar&&this.hScrollbar.resize(e)},scrollTo:function(e){this.vScrollbar&&this.vScrollbar.scrollToElement(e),this.hScrollbar&&this.hScrollbar.scrollToElement(e)},scrollToXY:function(e,i){this.scrollToX(e),this.scrollToY(i)},scrollToX:function(e){this.hScrollbar&&this.hScrollbar.scrollOverviewTo(e,!0)},scrollToY:function(e){this.vScrollbar&&this.vScrollbar.scrollOverviewTo(e,!0)},remove:function(){this.removeScrollableClass(),this.removeSkinClass(),this.removeScrollbarComponents(),this.$element.data("scrollable",null),this.removeKeyboardScrolling(),this.vScrollbar&&this.vScrollbar.remove(),this.hScrollbar&&this.hScrollbar.remove()},setAnimationSpeed:function(e){this.options.animationSpeed=e},isInside:function(i,t){var o=e(i),s=e(t),n=o.offset(),l=s.offset();return n.top>=l.top&&n.left>=l.left&&n.top+o.height()<=l.top+s.height()&&n.left+o.width()<=l.left+s.width()},initKeyboardScrolling:function(){var e=this;this.elementKeydown=function(i){document.activeElement===e.$element[0]&&(e.vScrollbar&&e.vScrollbar.keyScroll(i),e.hScrollbar&&e.hScrollbar.keyScroll(i))},this.$element.attr("tabindex","-1").keydown(this.elementKeydown)},removeKeyboardScrolling:function(){this.$element.removeAttr("tabindex").unbind("keydown",this.elementKeydown)},bindEvents:function(){this.options.onCustomScroll&&this.$element.on("customScroll",this.options.onCustomScroll)}};var n=function(e,i){this.scrollable=e,this.sizing=i,this.$scrollBar=this.sizing.scrollBar(this.scrollable.$element),this.$thumb=this.$scrollBar.find(".thumb"),this.setScrollPosition(0,0),this.resize(),this.initMouseMoveScrolling(),this.initMouseWheelScrolling(),this.initTouchScrolling(),this.initMouseClickScrolling(),this.initWindowResize()};n.prototype={resize:function(e){this.scrollable.$viewPort.height(this.scrollable.$element.height()),this.sizing.size(this.scrollable.$viewPort,this.sizing.size(this.scrollable.$element)),this.viewPortSize=this.sizing.size(this.scrollable.$viewPort),this.overviewSize=this.sizing.size(this.scrollable.$overview),this.ratio=this.viewPortSize/this.overviewSize,this.sizing.size(this.$scrollBar,this.viewPortSize),this.thumbSize=this.calculateThumbSize(),this.sizing.size(this.$thumb,this.thumbSize),this.maxThumbPosition=this.calculateMaxThumbPosition(),this.maxOverviewPosition=this.calculateMaxOverviewPosition(),this.enabled=this.overviewSize>this.viewPortSize,void 0===this.scrollPercent&&(this.scrollPercent=0),this.enabled?this.rescroll(e):this.setScrollPosition(0,0),this.$scrollBar.toggle(this.enabled)},calculateThumbSize:function(){var e,i=this.sizing.fixedThumbSize(this.scrollable.options);return e=i?i:this.ratio*this.viewPortSize,Math.max(e,this.sizing.minSize(this.$thumb))},initMouseMoveScrolling:function(){var i=this;this.$thumb.mousedown(function(e){i.enabled&&i.startMouseMoveScrolling(e)}),this.documentMouseup=function(e){i.stopMouseMoveScrolling(e)},e(document).mouseup(this.documentMouseup),this.documentMousemove=function(e){i.mouseMoveScroll(e)},e(document).mousemove(this.documentMousemove),this.$thumb.click(function(e){e.stopPropagation()})},removeMouseMoveScrolling:function(){this.$thumb.unbind(),e(document).unbind("mouseup",this.documentMouseup),e(document).unbind("mousemove",this.documentMousemove)},initMouseWheelScrolling:function(){var e=this;this.scrollable.$element.mousewheel(function(i,t,o,s){e.enabled&&e.mouseWheelScroll(o,s)&&(i.stopPropagation(),i.preventDefault())})},removeMouseWheelScrolling:function(){this.scrollable.$element.unbind("mousewheel")},initTouchScrolling:function(){if(document.addEventListener){var e=this;this.elementTouchstart=function(i){e.enabled&&e.startTouchScrolling(i)},this.scrollable.$element[0].addEventListener("touchstart",this.elementTouchstart),this.documentTouchmove=function(i){e.touchScroll(i)},document.addEventListener("touchmove",this.documentTouchmove),this.elementTouchend=function(i){e.stopTouchScrolling(i)},this.scrollable.$element[0].addEventListener("touchend",this.elementTouchend)}},removeTouchScrolling:function(){document.addEventListener&&(this.scrollable.$element[0].removeEventListener("touchstart",this.elementTouchstart),document.removeEventListener("touchmove",this.documentTouchmove),this.scrollable.$element[0].removeEventListener("touchend",this.elementTouchend))},initMouseClickScrolling:function(){var e=this;this.scrollBarClick=function(i){e.mouseClickScroll(i)},this.$scrollBar.click(this.scrollBarClick)},removeMouseClickScrolling:function(){this.$scrollBar.unbind("click",this.scrollBarClick)},initWindowResize:function(){if(this.scrollable.options.updateOnWindowResize){var i=this;this.windowResize=function(){i.resize()},e(window).resize(this.windowResize)}},removeWindowResize:function(){e(window).unbind("resize",this.windowResize)},isKeyScrolling:function(e){return null!=this.keyScrollDelta(e)},keyScrollDelta:function(e){for(var i in this.sizing.scrollingKeys)if(i==e)return this.sizing.scrollingKeys[e](this.viewPortSize);return null},startMouseMoveScrolling:function(i){this.mouseMoveScrolling=!0,e("html").addClass("not-selectable"),this.setUnselectable(e("html"),"on"),this.setScrollEvent(i)},stopMouseMoveScrolling:function(){this.mouseMoveScrolling=!1,e("html").removeClass("not-selectable"),this.setUnselectable(e("html"),null)},setUnselectable:function(e,i){e.attr("unselectable")!=i&&(e.attr("unselectable",i),e.find(":not(input)").attr("unselectable",i))},mouseMoveScroll:function(e){if(this.mouseMoveScrolling){var i=this.sizing.mouseDelta(this.scrollEvent,e);this.scrollThumbBy(i),this.setScrollEvent(e)}},startTouchScrolling:function(e){e.touches&&1==e.touches.length&&(this.setScrollEvent(e.touches[0]),this.touchScrolling=!0,e.stopPropagation())},touchScroll:function(e){if(this.touchScrolling&&e.touches&&1==e.touches.length){var i=-this.sizing.mouseDelta(this.scrollEvent,e.touches[0])*this.scrollable.options.swipeSpeed,t=this.scrollOverviewBy(i);t&&(e.stopPropagation(),e.preventDefault(),this.setScrollEvent(e.touches[0]))}},stopTouchScrolling:function(e){this.touchScrolling=!1,e.stopPropagation()},mouseWheelScroll:function(e,i){var t=-this.sizing.wheelDelta(e,i)*this.scrollable.options.wheelSpeed;return 0!=t?this.scrollOverviewBy(t):void 0},mouseClickScroll:function(e){var i=this.viewPortSize-20;e["page"+this.sizing.scrollAxis()]<this.$thumb.offset()[this.sizing.offsetComponent()]&&(i=-i),this.scrollOverviewBy(i)},keyScroll:function(e){var i=e.which;this.enabled&&this.isKeyScrolling(i)&&this.scrollOverviewBy(this.keyScrollDelta(i))&&e.preventDefault()},scrollThumbBy:function(e){var i=this.thumbPosition();i+=e,i=this.positionOrMax(i,this.maxThumbPosition);var t=this.scrollPercent;this.scrollPercent=i/this.maxThumbPosition;var o=i*this.maxOverviewPosition/this.maxThumbPosition;return this.setScrollPosition(o,i),t!=this.scrollPercent?(this.triggerCustomScroll(t),!0):!1},thumbPosition:function(){return this.$thumb.position()[this.sizing.offsetComponent()]},scrollOverviewBy:function(e){var i=this.overviewPosition()+e;return this.scrollOverviewTo(i,!1)},overviewPosition:function(){return-this.scrollable.$overview.position()[this.sizing.offsetComponent()]},scrollOverviewTo:function(e,i){e=this.positionOrMax(e,this.maxOverviewPosition);var t=this.scrollPercent;this.scrollPercent=e/this.maxOverviewPosition;var o=this.scrollPercent*this.maxThumbPosition;return i?this.setScrollPositionWithAnimation(e,o):this.setScrollPosition(e,o),t!=this.scrollPercent?(this.triggerCustomScroll(t),!0):!1},positionOrMax:function(e,i){return 0>e?0:e>i?i:e},triggerCustomScroll:function(e){this.scrollable.$element.trigger("customScroll",{scrollAxis:this.sizing.scrollAxis(),direction:this.sizing.scrollDirection(e,this.scrollPercent),scrollPercent:100*this.scrollPercent})},rescroll:function(e){if(e){var i=this.positionOrMax(this.overviewPosition(),this.maxOverviewPosition);this.scrollPercent=i/this.maxOverviewPosition;var t=this.scrollPercent*this.maxThumbPosition;this.setScrollPosition(i,t)}else{var t=this.scrollPercent*this.maxThumbPosition,i=this.scrollPercent*this.maxOverviewPosition;this.setScrollPosition(i,t)}},setScrollPosition:function(e,i){this.$thumb.css(this.sizing.offsetComponent(),i+"px"),this.scrollable.$overview.css(this.sizing.offsetComponent(),-e+"px")},setScrollPositionWithAnimation:function(e,i){var t={},o={};t[this.sizing.offsetComponent()]=i+"px",this.$thumb.animate(t,this.scrollable.options.animationSpeed),o[this.sizing.offsetComponent()]=-e+"px",this.scrollable.$overview.animate(o,this.scrollable.options.animationSpeed)},calculateMaxThumbPosition:function(){return this.sizing.size(this.$scrollBar)-this.thumbSize},calculateMaxOverviewPosition:function(){return this.sizing.size(this.scrollable.$overview)-this.sizing.size(this.scrollable.$viewPort)},setScrollEvent:function(e){var i="page"+this.sizing.scrollAxis();this.scrollEvent&&this.scrollEvent[i]==e[i]||(this.scrollEvent={pageX:e.pageX,pageY:e.pageY})},scrollToElement:function(i){var t=e(i);if(this.sizing.isInside(t,this.scrollable.$overview)&&!this.sizing.isInside(t,this.scrollable.$viewPort)){{var o=t.offset(),s=this.scrollable.$overview.offset();this.scrollable.$viewPort.offset()}this.scrollOverviewTo(o[this.sizing.offsetComponent()]-s[this.sizing.offsetComponent()],!0)}},remove:function(){this.removeMouseMoveScrolling(),this.removeMouseWheelScrolling(),this.removeTouchScrolling(),this.removeMouseClickScrolling(),this.removeWindowResize()}};var l=function(){};l.prototype={size:function(e,i){return i?e.width(i):e.width()},minSize:function(e){return parseInt(e.css("min-width"))||0},fixedThumbSize:function(e){return e.fixedThumbWidth},scrollBar:function(e){return e.find(".scroll-bar.horizontal")},mouseDelta:function(e,i){return i.pageX-e.pageX},offsetComponent:function(){return"left"},wheelDelta:function(e){return e},scrollAxis:function(){return"X"},scrollDirection:function(e,i){return i>e?"right":"left"},scrollingKeys:{37:function(){return-10},39:function(){return 10}},isInside:function(i,t){var o=e(i),s=e(t),n=o.offset(),l=s.offset();return n.left>=l.left&&n.left+o.width()<=l.left+s.width()}};var r=function(){};return r.prototype={size:function(e,i){return i?e.height(i):e.height()},minSize:function(e){return parseInt(e.css("min-height"))||0},fixedThumbSize:function(e){return e.fixedThumbHeight},scrollBar:function(e){return e.find(".scroll-bar.vertical")},mouseDelta:function(e,i){return i.pageY-e.pageY},offsetComponent:function(){return"top"},wheelDelta:function(e,i){return i},scrollAxis:function(){return"Y"},scrollDirection:function(e,i){return i>e?"down":"up"},scrollingKeys:{38:function(){return-10},40:function(){return 10},33:function(e){return-(e-20)},34:function(e){return e-20}},isInside:function(i,t){var o=e(i),s=e(t),n=o.offset(),l=s.offset();return n.top>=l.top&&n.top+o.height()<=l.top+s.height()}},this.each(function(){if(void 0==i&&(i=o),"string"==typeof i){var n=e(this).data("scrollable");n&&n[i](t)}else{if("object"!=typeof i)throw"Invalid type of options";i=e.extend(o,i),new s(e(this),i)}})}}(jQuery),function(e){function i(i){var t=i||window.event,o=[].slice.call(arguments,1),s=0,n=0,l=0;return i=e.event.fix(t),i.type="mousewheel",t.wheelDelta&&(s=t.wheelDelta/120),t.detail&&(s=-t.detail/3),l=s,void 0!==t.axis&&t.axis===t.HORIZONTAL_AXIS&&(l=0,n=s),void 0!==t.wheelDeltaY&&(l=t.wheelDeltaY/120),void 0!==t.wheelDeltaX&&(n=t.wheelDeltaX/120),o.unshift(i,s,n,l),(e.event.dispatch||e.event.handle).apply(this,o)}var t=["DOMMouseScroll","mousewheel"];if(e.event.fixHooks)for(var o=t.length;o;)e.event.fixHooks[t[--o]]=e.event.mouseHooks;e.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var e=t.length;e;)this.addEventListener(t[--e],i,!1);else this.onmousewheel=i},teardown:function(){if(this.removeEventListener)for(var e=t.length;e;)this.removeEventListener(t[--e],i,!1);else this.onmousewheel=null}},e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}})}(jQuery);
/**
 * Minified file. Third-party version information can be found in /package.json.
 * Original filename: \src\plugins\resizable.js
 */
!function(e){e.fn.resizable=function(t){function i(e){var t=e.data,i={};t.diffX=Math.round((e.pageX-t.pageX)/h.snapSize)*h.snapSize,t.diffY=Math.round((e.pageY-t.pageY)/h.snapSize)*h.snapSize,(Math.abs(t.diffX)>0||Math.abs(t.diffY)>0)&&(h.element.height()!==t.height+t.diffY&&t.height+t.diffY>=h.minHeight&&t.height+t.diffY<=h.maxHeight&&(h.containment?t.outerHeight+t.diffY+t.offset.top<=h.containment.offset().top+h.containment.outerHeight():!0)&&(h.element.height(t.height+t.diffY),i.height=!0),h.element.width()!==t.width+t.diffX&&t.width+t.diffX>=h.minWidth&&t.width+t.diffX<=h.maxWidth&&(h.containment?t.outerWidth+t.diffX+t.offset.left<=h.containment.offset().left+h.containment.outerWidth():!0)&&(h.element.width(t.width+t.diffX),i.width=!0),(i.height||i.width)&&(h.resizeOnce&&(h.resizeOnce.bind(h.element)(e.data),h.resizeOnce=null),h.resize&&h.resize.bind(h.element)(e.data),h.alsoResize&&(!i.height||"height"!==h.alsoResizeType&&"both"!==h.alsoResizeType||h.alsoResize.height(t.alsoResizeHeight+t.diffY),!i.width||"width"!==h.alsoResizeType&&"both"!==h.alsoResizeType||h.alsoResize.width(t.alsoResizeWidth+t.diffX))))}function n(t){t.preventDefault(),h.start&&h.start.bind(h.element)();var n={alsoResizeHeight:h.alsoResize?h.alsoResize.height():0,alsoResizeWidth:h.alsoResize?h.alsoResize.width():0,height:h.element.height(),offset:h.element.offset(),outerHeight:h.element.outerHeight(),outerWidth:h.element.outerWidth(),pageX:t.pageX,pageY:t.pageY,width:h.element.width()};e(document).on("mousemove","*",n,i),e(document).on("mouseup","*",s)}function s(){h.stop&&h.stop.bind(h.element)(),e(document).off("mousemove","*",i),e(document).off("mouseup","*",s)}var h=e.extend({alsoResize:null,alsoResizeType:"both",containment:null,create:null,destroy:null,handle:".resize-handle",maxHeight:9999,maxWidth:9999,minHeight:0,minWidth:0,resize:null,resizeOnce:null,snapSize:1,start:null,stop:null},t);if(h.element=e(this),h.handle){if(h.alsoResize&&["both","height","width"].indexOf(h.alsoResizeType)>=0&&(h.alsoResize=e(h.alsoResize)),h.containment&&(h.containment=e(h.containment)),h.handle=e(h.handle),h.snapSize=h.snapSize<1?1:h.snapSize,"destroy"===t)return h.handle.off("mousedown",n),h.destroy&&h.destroy.bind(this)(),this;h.handle.on("mousedown",n),h.create&&h.create.bind(this)()}return this}}(jQuery);
		// End jQuery plugins.
	}

// End wrapper.
})(this.unsafeWindow || window, window.chrome ? true : false);
