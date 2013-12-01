# [Install](https://raw.github.com/cletusc/Userscript--Twitch-Chat-Emotes/master/script.user.js)

Click the install link above to install this userscript. Please make sure to check out the compatibility section to see if your userscript engine is compatible.

# Description

Adds a button to Twitch that allows you to "click-to-insert" an emote. Emotes are always up-to-date using Twitch's API and will only show the emotes that you can actually use.

# Screenshots

![Emotes menu shown](http://i.imgur.com/41i5o0k.jpg "Emotes menu shown")

# Categories

Emotes are categorized in two groups to make it easier for you to use them and to use them quickly.

## Popular Emotes

Emotes that you use frequently. The more you use an emote, the more likely it is that it will appear here. You can reset at any time and the popular will default to a few that I've noticed are popular within the community.

## All Emotes

All emotes that you can possibly use, including subscription sets and Turbo sets. They are sorted in this order (top-to-bottom):

- Basic Emotes ( ![:)](http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-ebf60cd72f7aa600-24x18.png ":)") and the Turbo set alternatives)
- Non-basic Emotes (everything that isn't a basic emote and not a subscription set)
- Subscription Emotes (sorted and grouped by the channel name)

# FAQ

#### Q: Why aren't my Turbo / Subscription emotes showing up?
A: Twitch API needs to fully load before your emotes will appear. Once your Turbo / Subscription emotes are "usable" according to Twitch, the emotes popup will update.

# Compatibility

Although the script may work on other platforms, they have not been fully tested and there may be bugs. Unless listed otherwise, compatibility tests are done using the latest **stable** release of the various browsers/userscript engines at the time of the latest commit and older versions may not be supported at all. It is *highly recommended* that you always use the latest version of each platform. If you find a problem with the script, or want compatibility with a certain userscript engine, please post an issue and I will see what I can do.

## Compatible

- [![](http://i.imgur.com/IOKeLzP.png) Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) on [![](http://i.imgur.com/JuYGnoB.png) Mozilla Firefox Desktop](http://www.mozilla.org/en-US/firefox/fx/#desktop)
- [![](http://i.imgur.com/MNYcKd0.png) Scriptish](https://addons.mozilla.org/en-US/firefox/addon/scriptish/) on [![](http://i.imgur.com/JuYGnoB.png) Mozilla Firefox Desktop](http://www.mozilla.org/en-US/firefox/fx/#desktop)
- Natively on [![](http://i.imgur.com/HVYSfs3.png) Google Chrome](https://www.google.com/intl/en/chrome/browser/)
- [![](http://i.imgur.com/OHKOagu.png) Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) on [![](http://i.imgur.com/HVYSfs3.png) Google Chrome](https://www.google.com/intl/en/chrome/browser/)
- Natively on [![](http://i.imgur.com/ytNXBe7.png) Opera Desktop](http://www.opera.com/)
- [![](http://i.imgur.com/6B00N1P.png) Violent monkey](https://addons.opera.com/en/extensions/details/violent-monkey/) on [![](http://i.imgur.com/ytNXBe7.png) Opera Desktop](http://www.opera.com/)

## Incompatible

- None at the moment

# Integration

Other scripts / addons may add their own emotes to this menu. This script pulls the latest emotes from `window.CurrentChat.emoticons` and will always stay synced with it. In order to add emotes, add them to `window.CurrentChat.emoticons` in the same format that Twitch does. Below is a function I've written to assist in adding custom emotes properly along with example usage. Please let me know of any possible issues or suggestions you have to integrate with the emotes menu.

```javascript
        /**
         * Adds custom emotes so that anyone can use (and see) them.
         * @param {object}  emotes                               A array of objects where each emote's options are detailed below as `emote.*`.
         * @param {number}  emote.height                         The emote height, in pixels.
         * @param {number}  emote.width                          The emote width, in pixels.
         * @param {string}  emote.regex                          The regex to parse messages with. Keep it simple.
         * @param {string}  emote.url                            The emote image. This can be a data URI.
         * @param {boolean} [emote.hidden=false]                 Whether the emote should be hidden from the Twitch Chat Emotes menu.
         * @param {string}  [emote.text=null]                    The text to use with Twitch Chat Emotes. Use this if the text doesn't show the correct value on the emotes menu.
         * @param {string}  [channel='Custom Non-Twitch Emotes'] The channel name to show on Twitch Chat Emotes. This should be something unique to your script.
         * @param {string}  [badgeImage=null]                    The badge image to show on Twitch Chat Emotes. SHOULD be 16px x 16px. This can be a data URI.
         */
        function addCustomEmotes(emotes, channel, badgeImage) {
            emotes.forEach(function (emoteData) {
                var imageData = {
                    emoticon_set: null,
                    height: emoteData.height,
                    html: '<span class="emoticon" style="background-image: url(' + emoteData.url + '); height: ' + emoteData.height + 'px; width: ' + emoteData.width + 'px;"></span>',
                    url: emoteData.url,
                    width: emoteData.width,
                };
                var emote = {
                    images: [imageData],
                    image: imageData,
                    regex: new RegExp('\\b' + emoteData.regex + '\\b', 'g'),
                    // Custom attributes to hook into Twitch Chat Emotes.
                    text: emoteData.text || null,
                    channel: channel || 'Custom Non-Twitch Emotes',
                    badge: badgeImage || null,
                    hidden: emoteData.hidden || false
                };
                // Add to the page.
                window.CurrentChat.emoticons.push(emote);
                window.CurrentChat.default_emoticons.push(emote);
            });
        }

        // Example usage.
        addCustomEmotes([
            {
                // The emote.* options.
                url: 'https://dl.dropboxusercontent.com/u/30070822/ttvchat/famine.png',
                width: 90,
                height: 30,
                regex: 'FamineHey'
            },
            {
                // The emote.* options.
                url: 'http://i.imgur.com/uCoFk8G.png',
                width: 32,
                height: 32,
                regex: '(YOOHOO|15Hcig8|195pYTD|(?:vine).*?(?:ou))',
                // Hidden from the menu as it is only to prevent spam, not to be used on the emotes menu.
                hidden: true
            }
            // ...
        ], 'My Awesome Addon', 'http://somepage.com/badge.jpg');
```

# Donate

If you like this userscript, please consider making a donation. I do all userscripts in my spare time and I am very grateful to receive any amount that you can spare.

[![Donate using PayPal](https://www.paypalobjects.com/WEBSCR-640-20110306-1/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=E7567UFRV7N9N&lc=US&item_name=Userscript%20Donation&item_number=0&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted "Donate using PayPal")
