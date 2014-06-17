// ==UserScript==
// @name Twitch Chat Emotes
// @namespace #Cletus
// @version 0.5.17
// @description Adds a button to Twitch that allows you to "click-to-insert" an emote.
// @copyright 2011+, Ryan Chatham <ryan.b.chatham@gmail.com> (https://github.com/cletusc)
// @author Ryan Chatham <ryan.b.chatham@gmail.com> (https://github.com/cletusc)
// @icon http://www.gravatar.com/avatar.php?gravatar_id=6875e83aa6c563790cb2da914aaba8b3&r=PG&s=48&default=identicon
// @license Creative Commons; http://creativecommons.org/licenses/by-nc-sa/3.0/
// @homepage http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/
// @supportURL https://github.com/cletusc/Userscript--Twitch-Chat-Emotes/issues
// @contributionURL http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/#donate
// @grant none
// @include http://*.twitch.tv/*
// @exclude http://api.twitch.tv/*
// @exclude http://*.twitch.tv/*/profile*
// ==/UserScript==

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

/* Third-party scripts minified. */
var Hogan={};!function(a,b){function c(a){return String(null===a||void 0===a?"":a)}function d(a){return a=c(a),j.test(a)?a.replace(e,"&amp;").replace(f,"&lt;").replace(g,"&gt;").replace(h,"&#39;").replace(i,"&quot;"):a}a.Template=function(a,c,d,e){this.r=a||this.r,this.c=d,this.options=e,this.text=c||"",this.buf=b?[]:""},a.Template.prototype={r:function(){return""},v:d,t:c,render:function(a,b,c){return this.ri([a],b||{},c)},ri:function(a,b,c){return this.r(a,b,c)},rp:function(a,b,c,d){var e=c[a];return e?(this.c&&"string"==typeof e&&(e=this.c.compile(e,this.options)),e.ri(b,c,d)):""},rs:function(a,b,c){var d=a[a.length-1];if(!k(d))return void c(a,b,this);for(var e=0;e<d.length;e++)a.push(d[e]),c(a,b,this),a.pop()},s:function(a,b,c,d,e,f,g){var h;return k(a)&&0===a.length?!1:("function"==typeof a&&(a=this.ls(a,b,c,d,e,f,g)),h=""===a||!!a,!d&&h&&b&&b.push("object"==typeof a?a:b[b.length-1]),h)},d:function(a,b,c,d){var e=a.split("."),f=this.f(e[0],b,c,d),g=null;if("."===a&&k(b[b.length-2]))return b[b.length-1];for(var h=1;h<e.length;h++)f&&"object"==typeof f&&e[h]in f?(g=f,f=f[e[h]]):f="";return d&&!f?!1:(d||"function"!=typeof f||(b.push(g),f=this.lv(f,b,c),b.pop()),f)},f:function(a,b,c,d){for(var e=!1,f=null,g=!1,h=b.length-1;h>=0;h--)if(f=b[h],f&&"object"==typeof f&&a in f){e=f[a],g=!0;break}return g?(d||"function"!=typeof e||(e=this.lv(e,b,c)),e):d?!1:""},ho:function(a,b,c,d,e){var f=this.c,g=this.options;g.delimiters=e;var d=a.call(b,d);return d=null==d?String(d):d.toString(),this.b(f.compile(d,g).render(b,c)),!1},b:b?function(a){this.buf.push(a)}:function(a){this.buf+=a},fl:b?function(){var a=this.buf.join("");return this.buf=[],a}:function(){var a=this.buf;return this.buf="",a},ls:function(a,b,c,d,e,f,g){var h=b[b.length-1],i=null;if(!d&&this.c&&a.length>0)return this.ho(a,h,c,this.text.substring(e,f),g);if(i=a.call(h),"function"==typeof i){if(d)return!0;if(this.c)return this.ho(i,h,c,this.text.substring(e,f),g)}return i},lv:function(a,b,d){var e=b[b.length-1],f=a.call(e);return"function"==typeof f&&(f=c(f.call(e)),this.c&&~f.indexOf("{{"))?this.c.compile(f,this.options).render(e,d):c(f)}};var e=/&/g,f=/</g,g=/>/g,h=/\'/g,i=/\"/g,j=/[&<>\"\']/,k=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)}}("undefined"!=typeof exports?exports:Hogan);

var templates = function() {
var t = {
  'emote' : new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"emote\" data-emote=\"");_.b(_.v(_.f("text",c,p,0)));_.b("\" title=\"");_.b(_.v(_.f("text",c,p,0)));_.b("\">\r");_.b("\n" + i);_.b("	");_.b(_.t(_.f("image",c,p,0)));_.b("\r");_.b("\n" + i);_.b("</div>\r");_.b("\n");return _.fl();;}),
  'emoteButton' : new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<button class=\"button glyph-only\" title=\"Emote Menu\" id=\"emote-menu-button\"></button>\r");_.b("\n");return _.fl();;}),
  'emoteGroupHeader' : new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("isAddonHeader",c,p,1),c,p,0,18,218,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("	<div class=\"group-header addon-emotes-header\" title=\"Below are emotes added by an addon. Only those who also have the same addon installed can see these emotes in chat.\">\r");_.b("\n" + i);_.b("		Addon Emotes\r");_.b("\n" + i);_.b("	</div>\r");_.b("\n");});c.pop();}_.b("\r");_.b("\n" + i);if(!_.s(_.f("isAddonHeader",c,p,1),c,p,1,0,0,"")){_.b("	<div class=\"group-header\" data-emote-channel=\"");_.b(_.v(_.f("channel",c,p,0)));_.b("\"><img src=\"");_.b(_.v(_.f("badge",c,p,0)));_.b("\" />");_.b(_.v(_.f("channel",c,p,0)));_.b("</div>\r");_.b("\n");};return _.fl();;}),
  'menu' : new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"emote-menu dropmenu\" id=\"emote-menu-for-twitch\">\r");_.b("\n" + i);_.b("	<div class=\"draggable\"></div>\r");_.b("\n" + i);_.b("\r");_.b("\n" + i);_.b("	<div class=\"group-header\">All Emotes</div>\r");_.b("\n" + i);_.b("	<div class=\"group-container scrollable\" id=\"all-emotes-group\"></div>\r");_.b("\n" + i);_.b("\r");_.b("\n" + i);_.b("	<div class=\"group-header\">Popular Emotes</div>\r");_.b("\n" + i);_.b("	<div class=\"group-container single-row\" id=\"popular-emotes-group\"></div>\r");_.b("\n" + i);_.b("\r");_.b("\n" + i);_.b("	<div class=\"footer\">\r");_.b("\n" + i);_.b("		<a class=\"pull-left icon icon-github\" href=\"https://github.com/cletusc/Userscript--Twitch-Chat-Emotes\" target=\"_blank\" title=\"Visit the project page on Github\"></a>\r");_.b("\n" + i);_.b("		<a class=\"pull-left icon icon-popular-emotes-location\" data-command=\"toggle-popular-emote-location\" title=\"Change popular emotes location\"></a>\r");_.b("\n" + i);_.b("		<a title=\"Reset the popularity of the emotes back to default\" data-command=\"reset-popularity\">Reset Popularity</a>\r");_.b("\n" + i);_.b("		<a class=\"pull-right icon icon-resize-handle\" data-command=\"resize-handle\"></a>\r");_.b("\n" + i);_.b("	</div>\r");_.b("\n" + i);_.b("</div>\r");_.b("\n");return _.fl();;}),
  'newsMessage' : new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\r");_.b("\n" + i);_.b("<div class=\"twitch-chat-emotes-news\">\r");_.b("\n" + i);_.b("	[");_.b(_.v(_.f("scriptName",c,p,0)));_.b("] News: ");_.b(_.t(_.f("message",c,p,0)));_.b(" (<a href=\"#\" data-command=\"twitch-chat-emotes:dismiss-news\" data-news-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\">Dismiss</a>)\r");_.b("\n" + i);_.b("</div>\r");_.b("\n");return _.fl();;}),
  'styles' : new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("/* CSS minified. */\r");_.b("\n" + i);_.b(".scrollable{position:relative}.scrollable:focus{outline:0}.scrollable .viewport{position:relative;overflow:hidden}.scrollable .viewport .overview{position:absolute}.scrollable .scroll-bar{display:none}.scrollable .scroll-bar.vertical{position:absolute;right:0;height:100%}.scrollable .scroll-bar.horizontal{position:relative;width:100%}.scrollable .scroll-bar .thumb{position:absolute}.scrollable .scroll-bar.vertical .thumb{width:100%;min-height:10px}.scrollable .scroll-bar.horizontal .thumb{height:100%;min-width:10px;left:0}.not-selectable{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.scrollable.default-skin{padding-right:10px;padding-bottom:6px}.scrollable.default-skin .scroll-bar.vertical{width:6px}.scrollable.default-skin .scroll-bar.horizontal{height:6px}.scrollable.default-skin .scroll-bar .thumb{background-color:#000;opacity:.4;border-radius:3px;-moz-border-radius:4px;-webkit-border-radius:4px}.scrollable.default-skin .scroll-bar:hover .thumb{opacity:.6}.scrollable.gray-skin{padding-right:17px}.scrollable.gray-skin .scroll-bar{border:1px solid gray;background-color:#d3d3d3}.scrollable.gray-skin .scroll-bar .thumb{background-color:gray}.scrollable.gray-skin .scroll-bar:hover .thumb{background-color:#000}.scrollable.gray-skin .scroll-bar.vertical{width:10px}.scrollable.gray-skin .scroll-bar.horizontal{height:10px;margin-top:2px}.scrollable.modern-skin{padding-right:17px}.scrollable.modern-skin .scroll-bar{border:1px solid gray;border-radius:4px;-moz-border-radius:4px;-webkit-border-radius:4px;-moz-box-shadow:inset 0 0 5px #888;-webkit-box-shadow:inset 0 0 5px #888;box-shadow:inset 0 0 5px #888}.scrollable.modern-skin .scroll-bar .thumb{background-color:#95aabf;border-radius:4px;-moz-border-radius:4px;-webkit-border-radius:4px;border:1px solid #536984}.scrollable.modern-skin .scroll-bar.vertical .thumb{width:8px;background:-moz-linear-gradient(left,#95aabf 0,#547092 100%);background:-webkit-gradient(linear,left top,right top,color-stop(0%,#95aabf),color-stop(100%,#547092));background:-webkit-linear-gradient(left,#95aabf 0,#547092 100%);background:-o-linear-gradient(left,#95aabf 0,#547092 100%);background:-ms-linear-gradient(left,#95aabf 0,#547092 100%);background:linear-gradient(to right,#95aabf 0,#547092 100%);-ms-filter:\"progid:DXImageTransform.Microsoft.gradient( startColorstr='#95aabf', endColorstr='#547092',GradientType=1 )\"}.scrollable.modern-skin .scroll-bar.horizontal .thumb{height:8px;background-image:linear-gradient(#95aabf,#547092);background-image:-o-linear-gradient(#95aabf,#547092);background-image:-moz-linear-gradient(#95aabf,#547092);background-image:-webkit-linear-gradient(#95aabf,#547092);background-image:-ms-linear-gradient(#95aabf,#547092);-ms-filter:\"progid:DXImageTransform.Microsoft.gradient( startColorstr='#95aabf', endColorstr='#547092',GradientType=0 )\"}.scrollable.modern-skin .scroll-bar.vertical{width:10px}.scrollable.modern-skin .scroll-bar.horizontal{height:10px;margin-top:2px}#emote-menu-button{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKUSURBVDhPfZTNi1JRGMZvMIsWUZts5SIXFYK0CME/IGghxVC7WUoU1NBixI+mRSD4MQzmxziKO3XUBhRmUGZKdBG40XEGU6d0GFGZcT4qxW1hi7fzvNwZqKwDD5z7vs/vueeee+6VMJxO5wUhhdvtfuHz+T4tLS2NhegfGsMDLxiwHIIhLi57PJ75VCr1Y39/n4bDIY1Go4lCDx54wYCVYzjoVjQa/dxutyfCkwSvYJpgOSQf708tuBa1yWRy/L+V/Cl4wYBFhhTxfLhum/esiiJ1u12KRCJksVhofX2dTk5OzkHMUUMPHnjB2F55VpEhPde/Lbx8FqBEIkHpdJoMBgNptVrS6XRUqVTOg7a3t2lmZob0ej2p1Wr2ggGLDOnJ3QSZH4coHo/TysoKhygUCtJoNFQsFmkwGLAwR7hSqSSVSsVeMGCRIT29F6fXJi8Xy+Uymc1mmp6eJofDQfV6nU5PT1mY2+127uHxSqUSh4FFhhQLvrvtcrm+YpkHBwdUrVZpa2uLarUadTodOjw8ZGGOGnrwwAsGLDLw1i4uLrzRYeOOj49pb2+Pdnd3qdVq8StGAIQ5ao1Ggz3wggGLDD4C4izcEcWfR0dHbMrlcrSxscGbjVAIK8lms7S5ucmB/X6fXz9YDsEQFzdjsVit2Wzyqc1kMrwfVquVjEYjzc3NkclkIpvNRmtra+yBVzAfBXtDjuGgS8FgcFbc8QvuhjNSKBQoFAqR6LFEn/L5PPfggXd5eXkWrBzDQdC1QCBgFoeut7Ozw/tyBp2FQzhPwtOFFwzY34Yo4A9wRXzdD8LhcE48wncE9no9Fuaoid574bkPLxgZ/3uI5pTQVfFlP/L7/Wmhb7JSXq/3IXrwyHZ5SNIvGCnqyh+J7+gAAAAASUVORK5CYII=)!important;background-position:50%;background-repeat:no-repeat;cursor:pointer;margin-left:7px}#emote-menu-button.active{border-radius:2px;background-color:rgba(128,128,128,.5)}.emote-menu{padding:5px;z-index:1000;background-color:#202020}.emote-menu a{color:#fff}.emote-menu a:hover{cursor:pointer;text-decoration:underline;color:#ccc}.emote-menu .emotes-popular{height:38px}.emote-menu .draggable{background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.05)5px,rgba(255,255,255,.05)10px);cursor:move;height:7px;margin-bottom:3px}.emote-menu .draggable:hover{background-image:repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.1)5px,rgba(255,255,255,.1)10px)}.emote-menu .group-header{border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05)inset;background-image:linear-gradient(to top,transparent,rgba(0,0,0,.5));padding:2px;color:#ddd;text-align:center}.emote-menu .group-header img{margin-right:8px}.emote-menu .emote{display:inline-block;padding:2px;margin:1px;cursor:pointer;border-radius:5px;text-align:center;position:relative;width:32px;height:32px}.emote-menu .emote img{max-width:32px;max-height:32px;margin:auto;position:absolute;top:0;bottom:0;left:0;right:0}.emote-menu .single-row{overflow:hidden;height:37px}.emote-menu .single-row .emote{display:inline-block;margin-bottom:100px}.emote-menu .emote:hover{background-color:rgba(255,255,255,.1)}.emote-menu .pull-left{float:left}.emote-menu .pull-right{float:right}.emote-menu .footer{text-align:center;border-top:1px solid #000;box-shadow:0 1px 0 rgba(255,255,255,.05)inset;padding:5px 0 2px;margin-top:5px}.emote-menu .footer .pull-left{margin-right:5px}.emote-menu .footer .pull-right{margin-left:5px}.emote-menu .icon{height:16px;width:16px;opacity:.5}.emote-menu .icon:hover{opacity:1}.emote-menu .icon-github{background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiIAAC4iAari3ZIAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAWpJREFUOE+F0ssrRGEYx/EZBhs2ssHCrCasFf4DFiKyERuytRMZESl3WxsbK0s2FlKKxkIJOyRpEgtyv19yfH/H87qm86tPvee9POd5z0zodzzPK8I4NnFuNjCKmG37GxbTMYEXrKMb9aYHKviMYaTZsY8wocPzOEENbOUrzIWhYmeYQ8SW/MUxnKICekMhNJ+FTBvraiOohK414A7HoNbqUAvlCcd4NRprj1KFBmhPVAWGsAXXYlCqkYJt9KnAGvrhxkFJWOe66ooGaq8REdwgKBdQBy1IqsARmqArqFhQktC5VhxosIpBa2sKQZm0vfrPLGmg++uD5KAYKvhflpGNVOwjrgIFeEAbZhFFGXbhkkAJwvZ2tX+HPD1rohdXtnAI/axvcPE/nO0thT52p39Y4UEtzeAS7SjHI1zUYQaacY1p+AU/w4SKxHEPfRP9A1003sEt9IKfh7+HxXx0YRF7ZgEdyLVtllDoHUPsDkVplXakAAAAAElFTkSuQmCC) no-repeat 50%}.emote-menu .icon-popular-emotes-location{background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAgCAYAAAAbifjMAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAClSURBVEhL7ZRBDoAgEAN9uj9fKaFkl61EiN5sMgcLnYMHDjObcTbUWUWWDQyZW4ksC37MSEkqCmrMJEn4KMzGTJCsjpku2RkzVbI7Zk4KFGPUnSpQ4HAMunQ3FY1f8IIAYOBRd74TYDBGSlLR+AWLAhwoxqg7/T3YTX8PdiTYhH+wIqlj4AVPJX0M/JjMJGEMwodDSdIYpMLhJXIMZOnA8HZsZscFnEfNs2qCgdQAAAAASUVORK5CYII=) no-repeat 50% top}.emote-menu .icon-popular-emotes-location.popular-on-bottom{background-position:bottom}.emote-menu .icon-resize-handle{background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAAAX0lEQVQ4T6WPUQ7AIAhDPfpuzuyHxpGK7SR5IVYeCS0irqChAw0daOhAQwcaijyAfShARv1aMOWOfcJHBnmgIsvo8glMRkkLtnLneEIpg3U4c5LRtycoMqpcMIaLd7QXl2chH51cR7QAAAAASUVORK5CYII=) no-repeat 50%;cursor:nwse-resize!important}.emote-menu .scrollable.default-skin{padding-right:0;padding-bottom:0}.emote-menu .scrollable.default-skin .scroll-bar .thumb{background-color:#555;opacity:.2;z-index:1}");return _.fl();;})
},
r = function(n) {
  var tn = t[n];
  return function(c, p, i) {
    return tn.render(c, p || t, i);
  };
};
return {
  'emote' : r('emote'),
  'emoteButton' : r('emoteButton'),
  'emoteGroupHeader' : r('emoteGroupHeader'),
  'menu' : r('menu'),
  'newsMessage' : r('newsMessage'),
  'styles' : r('styles')
};
}();

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
		},
		emotePopularity = false,
		$,
		jQuery,
		isInitiated = false,

		elemChatButton,
		elemChatButtonsContainer,
		elemChatInput,
		elemEmoteButton,
		elemEmoteMenu,

		SCRIPT_NAME = 'Twitch Chat Emotes',
		DEBUG = location.hash === '#twitch-chat-emotes-debug',
		MESSAGES = {
			ALREADY_RUNNING: 'There is already an instance of this script running, cancelling this instance.',
			NO_CHAT_ELEMENT: 'There is no chat element on the page, unable to continue.',
			NOT_LOGGED_IN: 'You are not logged in, please log in first before using the emote menu.',
			OBJECTS_NOT_LOADED: 'Needed objects haven\'t loaded yet.',
			TIMEOUT_SCRIPT_LOAD: 'Script took too long to load. Refresh to try again.'
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
		var	loggedIn = window.Twitch && window.Twitch.user.isLoggedIn(),
			routes = window.App && (window.App.ChannelRoute || window.App.ChatRoute),
			objectsLoaded = (
				window.Twitch !== undefined &&
				(
					window.App !== undefined &&
					window.App.__container__ !== undefined &&
					window.App.__container__.lookup('controller:emoticons').get('emoticons') !== undefined &&
					window.App.__container__.lookup('controller:emoticons').get('emoticons').length
				) &&
				window.$j !== undefined &&
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
		if (document.querySelector('#emote-menu-for-twitch')) {
			console.warn(MESSAGES.ALREADY_RUNNING);
			return;
		}
		if (!objectsLoaded || !loggedIn || !routes) {
			// Errors in approximately 102400ms.
			if (time >= 60000) {
				console.error(MESSAGES.TIMEOUT_SCRIPT_LOAD);
				return;
			}
			if (time >= 10000) {
				if (!loggedIn) {
					console.error(MESSAGES.NOT_LOGGED_IN);
					return;
				}
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
		$ = jQuery = window.$j;

		elemChatButton = $('.send-chat-button');
		elemChatButtonsContainer = $('.chat-buttons-container .chat-option-buttons');
		elemChatInput = $('.chat-interface textarea');

		// No chat, just exit.
		if (!elemChatButton.length) {
			console.warn(MESSAGES.NO_CHAT_ELEMENT);
			return;
		}

		loadPlugins();
		createMenuElements();
		addStyle(templates.styles());
		bindListeners();
		showNews();

		// Get active subscriptions.
		window.Twitch.api.get("/api/users/:login/tickets").done(function (api) {
			debug(api, 'Response from `/api/user/:login/tickets`.', true);
			api.tickets.forEach(function (ticket) {
				// Get subscriptions with emotes.
				if (ticket.product.emoticons && ticket.product.emoticons.length) {
					var badge = ticket.product.features.badge,
						channel = ticket.product.owner_name;
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
		elemEmoteButton = $(templates.emoteButton());
		elemEmoteButton.appendTo(elemChatButtonsContainer);
		elemEmoteButton.hide();

		// Only correct styling for non-BetterTTV.
		if (window.BetterTTV) {
			elemEmoteButton.fadeIn();
		}
		else {
			elemChatButton.animate({'left': '121px'}, {
				complete: function () {
					elemEmoteButton.fadeIn();
				}
			});
		}

		// Create emote menu.
		elemEmoteMenu = $(templates.menu());
		elemEmoteMenu.appendTo(document.body);
	}

	/**
	 * Bind event listeners.
	 */
	function bindListeners() {
		// Handle popup.
		elemEmoteButton.popup('click_to_close', elemEmoteMenu, {
			above: true
		});

		// Toggle buttons.
		elemEmoteButton.on('click', function () {
			elemEmoteMenu.removeClass('has_moved');
			if (elemEmoteMenu.is(':visible')) {
				$(this).addClass('active');
				if (elemEmoteMenu.hasClass('not_default_location')) {
					elemEmoteMenu.offset(JSON.parse(elemEmoteMenu.attr('data-offset')));
				}
				else {
					var diff = elemEmoteMenu.height() - elemEmoteMenu.find('#all-emotes-group').height();
					var elemChatLines = $('.chat-messages');

					// Adjust the size and position of the popup.
					elemEmoteMenu.height(elemChatLines.outerHeight() - (elemEmoteMenu.outerHeight() - elemEmoteMenu.height()));
					elemEmoteMenu.width(elemChatLines.outerWidth() - (elemEmoteMenu.outerWidth() - elemEmoteMenu.width()));
					elemEmoteMenu.offset(elemChatLines.offset());
					// Fix `.emotes-all` height.
					elemEmoteMenu.find('#all-emotes-group').height(elemEmoteMenu.height() - diff);
					elemEmoteMenu.find('#all-emotes-group').width(elemEmoteMenu.width());
					// Recalculate any scroll bars.
					elemEmoteMenu.find('.scrollable').customScrollbar('resize');
				}
			}
			else {
				$(this).removeClass('active');
			}
			populateEmotesMenu();
		});

		// Restore outside clicks to close popup, but only when it hasn't been moved.
		elemEmoteMenu.on('clickoutside', function () {
			if (!$(this).hasClass('has_moved') && $(this).is(':visible')) {
				elemEmoteButton.click();
			}
		});

		// Make draggable.
		elemEmoteMenu.draggable({
			handle: '.draggable',
			start: function () {
				$(this).addClass('has_moved');
				$(this).addClass('not_default_location');
			},
			stop: function () {
				elemEmoteMenu.attr('data-offset', JSON.stringify(elemEmoteMenu.offset()));
			},
			containment: $(document.body)
		});

		elemEmoteMenu.resizable({
			handle: '[data-command="resize-handle"]',
			resize: function () {
				$(this).addClass('has_moved');
				$(this).addClass('not_default_location');
				// Recalculate any scroll bars.
				elemEmoteMenu.find('.scrollable').customScrollbar('resize');
			},
			alsoResize: elemEmoteMenu.find('.scrollable'),
			containment: $(document.body),
			minHeight: 180,
			minWidth: 200
		});

		// Enable the popularity reset.
		elemEmoteMenu.find('[data-command="reset-popularity"]').on('click', function () {
			emotePopularityClear();
			populateEmotesMenu();
		});

		// Enable the popular emotes location changing button.
		elemEmoteMenu.find('[data-command="toggle-popular-emote-location"]').on('click', function () {
			var current = +getSetting('emote-popular-on-top', 0);
			setSetting('emote-popular-on-top', current ? 0 : 1);
			fixPopularEmotesLocation(!current);
		});

		// Enable emote clicking (delegated).
		elemEmoteMenu.on('click', '.emote', function () {
			insertEmoteText($(this).attr('data-emote'));
		});

		elemEmoteMenu.find('.scrollable').customScrollbar({
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

		fixPopularEmotesLocation(+getSetting('emote-popular-on-top', false));
		refreshUsableEmotes();

		// Add popular emotes.
		container = elemEmoteMenu.find('#popular-emotes-group');
		container.html('');
		emotes.usable.sort(sortByPopularity);
		emotes.usable.forEach(function (emote) {
			createEmote(emote, container);
		});

		// Add all emotes.
		container = elemEmoteMenu.find('#all-emotes-group');
		if (container.find('.overview').length) {
			container = container.find('.overview');
		}
		container.html('');
		emotes.usable.sort(sortBySet);
		emotes.usable.forEach(function (emote) {
			createEmote(emote, container, true);
		});

		// Recalculate any scroll bars.
		elemEmoteMenu.find('.scrollable').customScrollbar('resize');

		/**
		 * Sort by popularity: most used -> least used
		 */
		function sortByPopularity(a, b) {
			var aGet = emotePopularityGet(a.text),
				bGet = emotePopularityGet(b.text),
				aNumber = typeof aGet === 'number',
				bNumber = typeof bGet === 'number';
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
			var basicEmotes = [':(', ':)', ':/', ':D', ':o', ':p', ':z', ';)', ';p', '<3', '>(', 'B)', 'R)', 'o_o'];
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

				var channelSort = sortByNormal({text: a.channel}, {text: b.channel}),
					normalSort = sortByNormal(a, b);
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
	 * Moves the popular emotes based on whether it should be on top.
	 * @param  {boolean} onTop Should the popular emotes be on top? `true` = on top, `false` = on bottom.
	 */
	function fixPopularEmotesLocation(onTop) {
		var body = elemEmoteMenu.find('#popular-emotes-group'),
			header = body.prev(),
			all = elemEmoteMenu.find('#all-emotes-group'),
			icon = elemEmoteMenu.find('.icon-popular-emotes-location');
		if (onTop) {
			header.insertBefore(all.prev());
			body.insertBefore(all.prev());
			icon.removeClass('popular-on-bottom');
		}
		else {
			body.insertAfter(all);
			header.insertAfter(all);
			icon.addClass('popular-on-bottom');
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
			// Fix missing image.html on new layout.
			if (emote.image && !emote.image.html) {
				emote.image.html = '<img src="' + emote.image.url + '">';
			}

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
		if (!elemEmoteMenu.hasClass('has_moved')) {
			elemEmoteButton.click();
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
				if (!emotes.subscriptions.badges[emote.channel] && !elemEmoteMenu.find('.group-header.addon-emotes-header').length) {
					container.append(
						$(templates.emoteGroupHeader({
							isAddonHeader: true
						}))
					);
				}
				if (!elemEmoteMenu.find('.group-header[data-emote-channel="' + emote.channel + '"]').length) {
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
				image: emote.image.html,
				text: emote.text
			}))
		);
	}

	/**
	 * Show latest news.
	 */
	function showNews() {
		var dismissedNews = JSON.parse(getSetting('twitch-chat-emotes:dismissed-news', '[]')),
			cachedNews = JSON.parse(getSetting('twitch-chat-emotes:cached-news', '{}'));
		// Only poll news feed once per day.
		if (DEBUG || Date.now() - getSetting('twitch-chat-emotes:news-date', 0) > 86400000) {
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
	 * Load jQuery plugins.
	 */
	function loadPlugins() {
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

		/**
		 * Custom Scroll Bar
		 * https://github.com/mzubala/jquery-custom-scrollbar
		 */
		(function(e){e.fn.customScrollbar=function(i,t){var o={skin:undefined,hScroll:true,vScroll:true,updateOnWindowResize:false,animationSpeed:300,onCustomScroll:undefined,swipeSpeed:1,wheelSpeed:40,fixedThumbWidth:undefined,fixedThumbHeight:undefined};var s=function(i,t){this.$element=e(i);this.options=t;this.addScrollableClass();this.addSkinClass();this.addScrollBarComponents();if(this.options.vScroll)this.vScrollbar=new n(this,new r);if(this.options.hScroll)this.hScrollbar=new n(this,new l);this.$element.data("scrollable",this);this.initKeyboardScrolling();this.bindEvents()};s.prototype={addScrollableClass:function(){if(!this.$element.hasClass("scrollable")){this.scrollableAdded=true;this.$element.addClass("scrollable")}},removeScrollableClass:function(){if(this.scrollableAdded)this.$element.removeClass("scrollable")},addSkinClass:function(){if(typeof this.options.skin=="string"&&!this.$element.hasClass(this.options.skin)){this.skinClassAdded=true;this.$element.addClass(this.options.skin)}},removeSkinClass:function(){if(this.skinClassAdded)this.$element.removeClass(this.options.skin)},addScrollBarComponents:function(){this.assignViewPort();if(this.$viewPort.length==0){this.$element.wrapInner('<div class="viewport" />');this.assignViewPort();this.viewPortAdded=true}this.assignOverview();if(this.$overview.length==0){this.$viewPort.wrapInner('<div class="overview" />');this.assignOverview();this.overviewAdded=true}this.addScrollBar("vertical","prepend");this.addScrollBar("horizontal","append")},removeScrollbarComponents:function(){this.removeScrollbar("vertical");this.removeScrollbar("horizontal");if(this.overviewAdded)this.$element.unwrap();if(this.viewPortAdded)this.$element.unwrap()},removeScrollbar:function(e){if(this[e+"ScrollbarAdded"])this.$element.find(".scroll-bar."+e).remove()},assignViewPort:function(){this.$viewPort=this.$element.find(".viewport")},assignOverview:function(){this.$overview=this.$viewPort.find(".overview")},addScrollBar:function(e,i){if(this.$element.find(".scroll-bar."+e).length==0){this.$element[i]("<div class='scroll-bar "+e+"'><div class='thumb'></div></div>");this[e+"ScrollbarAdded"]=true}},resize:function(e){if(this.vScrollbar)this.vScrollbar.resize(e);if(this.hScrollbar)this.hScrollbar.resize(e)},scrollTo:function(e){if(this.vScrollbar)this.vScrollbar.scrollToElement(e);if(this.hScrollbar)this.hScrollbar.scrollToElement(e)},scrollToXY:function(e,i){this.scrollToX(e);this.scrollToY(i)},scrollToX:function(e){if(this.hScrollbar)this.hScrollbar.scrollOverviewTo(e,true)},scrollToY:function(e){if(this.vScrollbar)this.vScrollbar.scrollOverviewTo(e,true)},remove:function(){this.removeScrollableClass();this.removeSkinClass();this.removeScrollbarComponents();this.$element.data("scrollable",null);this.removeKeyboardScrolling();if(this.vScrollbar)this.vScrollbar.remove();if(this.hScrollbar)this.hScrollbar.remove()},setAnimationSpeed:function(e){this.options.animationSpeed=e},isInside:function(i,t){var o=e(i);var s=e(t);var n=o.offset();var l=s.offset();return n.top>=l.top&&n.left>=l.left&&n.top+o.height()<=l.top+s.height()&&n.left+o.width()<=l.left+s.width()},initKeyboardScrolling:function(){var e=this;this.elementKeydown=function(i){if(document.activeElement===e.$element[0]){if(e.vScrollbar)e.vScrollbar.keyScroll(i);if(e.hScrollbar)e.hScrollbar.keyScroll(i)}};this.$element.attr("tabindex","-1").keydown(this.elementKeydown)},removeKeyboardScrolling:function(){this.$element.removeAttr("tabindex").unbind("keydown",this.elementKeydown)},bindEvents:function(){if(this.options.onCustomScroll)this.$element.on("customScroll",this.options.onCustomScroll)}};var n=function(e,i){this.scrollable=e;this.sizing=i;this.$scrollBar=this.sizing.scrollBar(this.scrollable.$element);this.$thumb=this.$scrollBar.find(".thumb");this.setScrollPosition(0,0);this.resize();this.initMouseMoveScrolling();this.initMouseWheelScrolling();this.initTouchScrolling();this.initMouseClickScrolling();this.initWindowResize()};n.prototype={resize:function(e){this.scrollable.$viewPort.height(this.scrollable.$element.height());this.sizing.size(this.scrollable.$viewPort,this.sizing.size(this.scrollable.$element));this.viewPortSize=this.sizing.size(this.scrollable.$viewPort);this.overviewSize=this.sizing.size(this.scrollable.$overview);this.ratio=this.viewPortSize/this.overviewSize;this.sizing.size(this.$scrollBar,this.viewPortSize);this.thumbSize=this.calculateThumbSize();this.sizing.size(this.$thumb,this.thumbSize);this.maxThumbPosition=this.calculateMaxThumbPosition();this.maxOverviewPosition=this.calculateMaxOverviewPosition();this.enabled=this.overviewSize>this.viewPortSize;if(this.scrollPercent===undefined)this.scrollPercent=0;if(this.enabled)this.rescroll(e);else this.setScrollPosition(0,0);this.$scrollBar.toggle(this.enabled)},calculateThumbSize:function(){var e=this.sizing.fixedThumbSize(this.scrollable.options);var i;if(e)i=e;else i=this.ratio*this.viewPortSize;return Math.max(i,this.sizing.minSize(this.$thumb))},initMouseMoveScrolling:function(){var i=this;this.$thumb.mousedown(function(e){if(i.enabled)i.startMouseMoveScrolling(e)});this.documentMouseup=function(e){i.stopMouseMoveScrolling(e)};e(document).mouseup(this.documentMouseup);this.documentMousemove=function(e){i.mouseMoveScroll(e)};e(document).mousemove(this.documentMousemove);this.$thumb.click(function(e){e.stopPropagation()})},removeMouseMoveScrolling:function(){this.$thumb.unbind();e(document).unbind("mouseup",this.documentMouseup);e(document).unbind("mousemove",this.documentMousemove)},initMouseWheelScrolling:function(){var e=this;this.scrollable.$element.mousewheel(function(i,t,o,s){if(e.enabled){if(e.mouseWheelScroll(o,s)){i.stopPropagation();i.preventDefault()}}})},removeMouseWheelScrolling:function(){this.scrollable.$element.unbind("mousewheel")},initTouchScrolling:function(){if(document.addEventListener){var e=this;this.elementTouchstart=function(i){if(e.enabled)e.startTouchScrolling(i)};this.scrollable.$element[0].addEventListener("touchstart",this.elementTouchstart);this.documentTouchmove=function(i){e.touchScroll(i)};document.addEventListener("touchmove",this.documentTouchmove);this.elementTouchend=function(i){e.stopTouchScrolling(i)};this.scrollable.$element[0].addEventListener("touchend",this.elementTouchend)}},removeTouchScrolling:function(){if(document.addEventListener){this.scrollable.$element[0].removeEventListener("touchstart",this.elementTouchstart);document.removeEventListener("touchmove",this.documentTouchmove);this.scrollable.$element[0].removeEventListener("touchend",this.elementTouchend)}},initMouseClickScrolling:function(){var e=this;this.scrollBarClick=function(i){e.mouseClickScroll(i)};this.$scrollBar.click(this.scrollBarClick)},removeMouseClickScrolling:function(){this.$scrollBar.unbind("click",this.scrollBarClick)},initWindowResize:function(){if(this.scrollable.options.updateOnWindowResize){var i=this;this.windowResize=function(){i.resize()};e(window).resize(this.windowResize)}},removeWindowResize:function(){e(window).unbind("resize",this.windowResize)},isKeyScrolling:function(e){return this.keyScrollDelta(e)!=null},keyScrollDelta:function(e){for(var i in this.sizing.scrollingKeys)if(i==e)return this.sizing.scrollingKeys[e](this.viewPortSize);return null},startMouseMoveScrolling:function(i){this.mouseMoveScrolling=true;e("html").addClass("not-selectable");this.setUnselectable(e("html"),"on");this.setScrollEvent(i)},stopMouseMoveScrolling:function(i){this.mouseMoveScrolling=false;e("html").removeClass("not-selectable");this.setUnselectable(e("html"),null)},setUnselectable:function(e,i){if(e.attr("unselectable")!=i){e.attr("unselectable",i);e.find(":not(input)").attr("unselectable",i)}},mouseMoveScroll:function(e){if(this.mouseMoveScrolling){var i=this.sizing.mouseDelta(this.scrollEvent,e);this.scrollThumbBy(i);this.setScrollEvent(e)}},startTouchScrolling:function(e){if(e.touches&&e.touches.length==1){this.setScrollEvent(e.touches[0]);this.touchScrolling=true;e.stopPropagation()}},touchScroll:function(e){if(this.touchScrolling&&e.touches&&e.touches.length==1){var i=-this.sizing.mouseDelta(this.scrollEvent,e.touches[0])*this.scrollable.options.swipeSpeed;var t=this.scrollOverviewBy(i);if(t){e.stopPropagation();e.preventDefault();this.setScrollEvent(e.touches[0])}}},stopTouchScrolling:function(e){this.touchScrolling=false;e.stopPropagation()},mouseWheelScroll:function(e,i){var t=-this.sizing.wheelDelta(e,i)*this.scrollable.options.wheelSpeed;if(t!=0)return this.scrollOverviewBy(t)},mouseClickScroll:function(e){var i=this.viewPortSize-20;if(e["page"+this.sizing.scrollAxis()]<this.$thumb.offset()[this.sizing.offsetComponent()])// mouse click over thumb
		i=-i;this.scrollOverviewBy(i)},keyScroll:function(e){var i=e.which;if(this.enabled&&this.isKeyScrolling(i)){if(this.scrollOverviewBy(this.keyScrollDelta(i)))e.preventDefault()}},scrollThumbBy:function(e){var i=this.thumbPosition();i+=e;i=this.positionOrMax(i,this.maxThumbPosition);var t=this.scrollPercent;this.scrollPercent=i/this.maxThumbPosition;var o=i*this.maxOverviewPosition/this.maxThumbPosition;this.setScrollPosition(o,i);if(t!=this.scrollPercent){this.triggerCustomScroll(t);return true}else return false},thumbPosition:function(){return this.$thumb.position()[this.sizing.offsetComponent()]},scrollOverviewBy:function(e){var i=this.overviewPosition()+e;return this.scrollOverviewTo(i,false)},overviewPosition:function(){return-this.scrollable.$overview.position()[this.sizing.offsetComponent()]},scrollOverviewTo:function(e,i){e=this.positionOrMax(e,this.maxOverviewPosition);var t=this.scrollPercent;this.scrollPercent=e/this.maxOverviewPosition;var o=this.scrollPercent*this.maxThumbPosition;if(i)this.setScrollPositionWithAnimation(e,o);else this.setScrollPosition(e,o);if(t!=this.scrollPercent){this.triggerCustomScroll(t);return true}else return false},positionOrMax:function(e,i){if(e<0)return 0;else if(e>i)return i;else return e},triggerCustomScroll:function(e){this.scrollable.$element.trigger("customScroll",{scrollAxis:this.sizing.scrollAxis(),direction:this.sizing.scrollDirection(e,this.scrollPercent),scrollPercent:this.scrollPercent*100})},rescroll:function(e){if(e){var i=this.positionOrMax(this.overviewPosition(),this.maxOverviewPosition);this.scrollPercent=i/this.maxOverviewPosition;var t=this.scrollPercent*this.maxThumbPosition;this.setScrollPosition(i,t)}else{var t=this.scrollPercent*this.maxThumbPosition;var i=this.scrollPercent*this.maxOverviewPosition;this.setScrollPosition(i,t)}},setScrollPosition:function(e,i){this.$thumb.css(this.sizing.offsetComponent(),i+"px");this.scrollable.$overview.css(this.sizing.offsetComponent(),-e+"px")},setScrollPositionWithAnimation:function(e,i){var t={};var o={};t[this.sizing.offsetComponent()]=i+"px";this.$thumb.animate(t,this.scrollable.options.animationSpeed);o[this.sizing.offsetComponent()]=-e+"px";this.scrollable.$overview.animate(o,this.scrollable.options.animationSpeed)},calculateMaxThumbPosition:function(){return this.sizing.size(this.$scrollBar)-this.thumbSize},calculateMaxOverviewPosition:function(){return this.sizing.size(this.scrollable.$overview)-this.sizing.size(this.scrollable.$viewPort)},setScrollEvent:function(e){var i="page"+this.sizing.scrollAxis();if(!this.scrollEvent||this.scrollEvent[i]!=e[i])this.scrollEvent={pageX:e.pageX,pageY:e.pageY}},scrollToElement:function(i){var t=e(i);if(this.sizing.isInside(t,this.scrollable.$overview)&&!this.sizing.isInside(t,this.scrollable.$viewPort)){var o=t.offset();var s=this.scrollable.$overview.offset();var n=this.scrollable.$viewPort.offset();this.scrollOverviewTo(o[this.sizing.offsetComponent()]-s[this.sizing.offsetComponent()],true)}},remove:function(){this.removeMouseMoveScrolling();this.removeMouseWheelScrolling();this.removeTouchScrolling();this.removeMouseClickScrolling();this.removeWindowResize()}};var l=function(){};l.prototype={size:function(e,i){if(i)return e.width(i);else return e.width()},minSize:function(e){return parseInt(e.css("min-width"))||0},fixedThumbSize:function(e){return e.fixedThumbWidth},scrollBar:function(e){return e.find(".scroll-bar.horizontal")},mouseDelta:function(e,i){return i.pageX-e.pageX},offsetComponent:function(){return"left"},wheelDelta:function(e,i){return e},scrollAxis:function(){return"X"},scrollDirection:function(e,i){return e<i?"right":"left"},scrollingKeys:{37:function(e){return-10},39:function(e){return 10}},isInside:function(i,t){var o=e(i);var s=e(t);var n=o.offset();var l=s.offset();return n.left>=l.left&&n.left+o.width()<=l.left+s.width()}};var r=function(){};r.prototype={size:function(e,i){if(i)return e.height(i);else return e.height()},minSize:function(e){return parseInt(e.css("min-height"))||0},fixedThumbSize:function(e){return e.fixedThumbHeight},scrollBar:function(e){return e.find(".scroll-bar.vertical")},mouseDelta:function(e,i){return i.pageY-e.pageY},offsetComponent:function(){return"top"},wheelDelta:function(e,i){return i},scrollAxis:function(){return"Y"},scrollDirection:function(e,i){return e<i?"down":"up"},scrollingKeys:{38:function(e){return-10},40:function(e){return 10},33:function(e){return-(e-20)},34:function(e){return e-20}},isInside:function(i,t){var o=e(i);var s=e(t);var n=o.offset();var l=s.offset();return n.top>=l.top&&n.top+o.height()<=l.top+s.height()}};return this.each(function(){if(i==undefined)i=o;if(typeof i=="string"){var n=e(this).data("scrollable");if(n)n[i](t)}else if(typeof i=="object"){i=e.extend(o,i);new s(e(this),i)}else throw"Invalid type of options"})}})(jQuery);(function(e){var i=["DOMMouseScroll","mousewheel"];if(e.event.fixHooks){for(var t=i.length;t;){e.event.fixHooks[i[--t]]=e.event.mouseHooks}}e.event.special.mousewheel={setup:function(){if(this.addEventListener){for(var e=i.length;e;){this.addEventListener(i[--e],o,false)}}else{this.onmousewheel=o}},teardown:function(){if(this.removeEventListener){for(var e=i.length;e;){this.removeEventListener(i[--e],o,false)}}else{this.onmousewheel=null}}};e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}});function o(i){var t=i||window.event,o=[].slice.call(arguments,1),s=0,n=true,l=0,r=0;i=e.event.fix(t);i.type="mousewheel";// Old school scrollwheel delta
		if(t.wheelDelta){s=t.wheelDelta/120}if(t.detail){s=-t.detail/3}// New school multidimensional scroll (touchpads) deltas
		r=s;// Gecko
		if(t.axis!==undefined&&t.axis===t.HORIZONTAL_AXIS){r=0;l=s}// Webkit
		if(t.wheelDeltaY!==undefined){r=t.wheelDeltaY/120}if(t.wheelDeltaX!==undefined){l=t.wheelDeltaX/120}// Add event and delta to the front of the arguments
		o.unshift(i,s,l,r);return(e.event.dispatch||e.event.handle).apply(this,o)}})(jQuery);
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

	/**
	 * Logs a message only when global `DEBUG` is true.
	 * @param {mixed}   obj                 The object to log.
	 * @param {string}  [description = '']  The message describing the debug.
	 * @param {boolean} [stringify = false] Whether `obj` should be passed through `JSON.stringify`.
	 */
	function debug(obj, description, stringify) {
		if (DEBUG) {
			console.log('[DEBUG][' + (SCRIPT_NAME || 'UNKNOWN SCRIPT') + ']: ' + (description || ''), (stringify ? JSON.stringify(obj) : obj));
		}
	}

// End wrapper.
})(this.unsafeWindow || window, window.chrome ? true : false);
