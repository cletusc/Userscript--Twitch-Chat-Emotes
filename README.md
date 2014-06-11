# [Homepage](http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/)

This is the build guide and source for the [Emote Menu for Twitch](http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/). Normal users should check out the homepage as it is a lot more friendly. For developers that want to contribute, check out the build guide below, make some neat changes, then open a pull request.

# Building

In order to speed up building and testing, this project uses [npm](https://www.npmjs.org/) and [grunt](http://gruntjs.com/) to build the script.

### Basics

1. Make sure npm is installed as per their docs.
2. Run `npm install` to get the latest dependencies.
3. Make sure `grunt-cli` is globally installed: `npm install -g grunt-cli`.
4. Make changes to the script in the `src` folder (or other files as shown in the locations section below).
5. Run `grunt` to build the compiled script.

### Source files

- Userscript metadata: All userscript metadata is found in `package.json` within the `userscript` property and must be valid JSON.
- Templates: All templates are found in `src/templates` and are compiled using [hogan](https://www.npmjs.org/package/grunt-hogan). Templates are accessible within `src/script.js` by referencing `templates.filename();`. For a filename of `foo.html`, you can reference it by `templates.foo();`. You may pass in data to the template like so: `templates.foo({bar: 'baz'});`
- Styles: All CSS styles are found in `src/styles`. When adding a new file, you must also [add the filename to the Gruntfile](https://github.com/search?q=%22build%2Fstyles.css%22+path%3A%2FGruntfile.js+repo%3Acletusc%2FUserscript--Twitch-Chat-Emotes&type=Code&ref=searchresults) in the correct order.
- News updates: All news updates should be put in `news.json` and must be valid JSON. The key must be a timestamp in the form of `YYYY-MM-DDTHH:MM`, e.g. `2014-02-05T15:07` and the value will be your message. All links must have `target="_blank"`.

### Compiled files

- `script.user.js`: This is the userscript file which has all of the required metadata to work with the various userscript engines.
- `script.min.js`: This is the browser-ready minified version of the script. This is ideal for referencing by third-party scripts. Third-party scripts should only check for updates directly from Github once every 24 hours; do not directly reference the Github file. For direct linking, you should mirror this script to a CDN and use that instead.

### Grunt commands

- `grunt`: Compiles the script.
- `grunt watch`: Watches for changes to `package.json` and files in `src/` and automatically runs `grunt`.
- `grunt init`: Creates a simple `build/script-paths.json`. Every time you compile, the compiled userscript will be copied to all paths in this file. This allows you to easily test the userscript using your normal engine (Greasemonkey or others). With `grunt watch`, all you need to do is make the changes in the source, and refresh your browser! An example file might look like this:

```json
[
    "D:/AppData/Mozilla Firefox/Profiles/default/gm_scripts/Twitch_Chat_Emotes/script.user.js"
]
```
