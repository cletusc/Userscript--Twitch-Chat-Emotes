# [Homepage][homepage]

This is the build guide and source for the [Emote Menu for Twitch][homepage]. Normal users should check out the [homepage][homepage] as it is a lot more friendly. For developers that want to contribute, check out the build guide below, make some neat changes, then open a pull request.

# Building

In order to speed up building and testing, this project uses [npm][npm] and [gulp][gulp] to build the script.

### Basics

1. Make sure [npm][npm] is installed as per their docs.
2. Run `npm install` to get the latest dependencies.
3. Make sure [gulp][gulp] is globally installed: `npm install -g gulp`.
4. Make changes to the script in the `src` folder (or other files as shown in the locations section below).
5. Run `gulp` to build the compiled script.

### Source files

- Userscript metadata: All userscript metadata is found in `package.json` within the `userscript` property and must be valid JSON.
- Templates: All templates are found in `src/templates` and are compiled with [hogan.js][hogan.js] using [mustache syntax][mustache spec]. Templates are accessible within `src/script.js` by referencing `templates.filename();`. For a filename of `foo.html`, you can reference it by `templates.foo();`. You may pass in data to the template like so: `templates.foo({bar: 'baz'});`. All templates are automatically referenced as partials for all other templates.
- Styles: All CSS styles are found in `src/styles`. When adding a new file, you must also add the file to `gulp/files.js` in the correct order. Do not use vendor-specific property prefixes (`-webkit`, `-moz`, etc.) as this project uses [autoprefixer][autoprefixer] to prefix properties with the required vendor-specific prefixes.
- News updates: All news updates should be put in `news.json` and must be valid JSON. The key must be a timestamp in the form of `YYYY-MM-DDTHH:MM`, e.g. `2014-02-05T15:07` and the value will be your message. All links must have `target="_blank"`.

### Third-party files

This script uses a few third-party files to make things easier. All third-party files such as styles or javascript (including jQuery plugins) are minified with the source filename included. Version information can be found in the `package.json`. For any minified javascript files that are found in `src`, these are files that will eventually be split off from this repo.

Adding a third-party file is very simple.

1. Add the package to the `package.json`. For packages without a `package.json`, add them under the `napa` property.
2. Run `npm install`.
3. Add the files that need to be included to `gulp/files.js` in the correct order. Typically files will be located in `node_modules`.

Each time you compile the script, the third party files will automatically be included.

### Compiled files

- [script.user.js][script.user.js]: This is the userscript file which has all of the required metadata to work with the various userscript engines.
- [script.min.js][script.min.js]: This is the browser-ready minified version of the script. This is ideal for referencing by third-party scripts. Third-party scripts should only check for updates directly from Github once every 24 hours; do not directly reference the Github file. For direct linking, you should mirror this script to a CDN and use that instead.

### Version numbers

This project uses [Semantic Versioning][semantic versioning] for all releases. Version numbers are changed when creating a **stable** release. Developer or non-stable releases will be marked as the same version they were originally branched from. When referring to a developer or non-stable release, reference it's commit SHA or reference the download link that you used.

### Installing developer versions

A developer may ask you to install a developer version, or you may choose to install a specific version from a commit. The initial steps to install are the same as found [on the homepage install section][homepage install], but instead, you will use an install link directly from the source. A developer will provide an install link to a version for you--use the link they provide to install instead of the install button on the home page.

You may retrieve your own install link by visiting the [script.user.js][script.user.js] file, and pressing the "Raw" button, which will redirect you to the install link to use (or, if you have a userscript engine installed, it will install it right then and there). If you need an install link for a specific commit, while on the [script.user.js][script.user.js] file, press `y` which will change the link to reference the exact commit, then the "Raw" button for the install link for that commit.

_Please note: versions directly installed are strictly for testing only. Once you are done testing, please install the [latest stable version][homepage install]._

### Debugging

To enable full debug messages, you must toggle a flag so we know it is OK to bug you with the logging.

1. Open the developer console.
2. Enter `emoteMenu.toggleDebug();` in your console.
3. You will get a message showing the debug message status.
4. Refresh to start getting full debug messages.

### [Gulp][gulp] commands

- `gulp`: Compiles the script.
- `gulp watch`: Watches for changes to `package.json` and files in `src/` and automatically runs `gulp`.
- `gulp init`: Creates a simple `build/config/script-copy-paths.json`. Every time you compile, the compiled userscript will be copied to all paths in this file. This allows you to easily test the userscript using your normal engine (Greasemonkey or others). With `gulp watch`, all you need to do is make the changes in the source, and refresh your browser! An example file might look like this:

```json
[
	{
		"dir": "D:/AppData/Mozilla Firefox/Profiles/default/gm_scripts/Twitch_Chat_Emotes",
		"filename": "script.user.js"
	}
]
```

### Windows developers

Due to a limit of folder nesting in Windows, more specifically length of the path, you may be unable to delete the `node_modules` folder. The easiest method that I have found to clear the `node_modules` folder is to use [rimraf][rimraf], however it can be destructive, so be careful and check for typos before you send the commands.

1. Browse to the project folder.
2. Install [rimraf][rimraf]: `npm install rimraf -g`
3. Clear the `node_modules` folder: `rimraf node_modules`

Some reading on the matter:

- [joyent/node#6960](https://github.com/joyent/node/issues/6960)
- [lodash/lodash#501](https://github.com/lodash/lodash/issues/501)
- [gulpjs/gulp-util#23](https://github.com/gulpjs/gulp-util/pull/23)

[homepage]: http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/
[homepage install]: http://cletusc.github.io/Userscript--Twitch-Chat-Emotes/#install
[script.user.js]: script.user.js
[script.min.js]: script.min.js
[semantic versioning]: http://semver.org/
[npm]: https://www.npmjs.org/
[gulp]: http://gulpjs.com/
[rimraf]: https://www.npmjs.org/package/rimraf
[hogan.js]: http://twitter.github.io/hogan.js/
[mustache spec]: http://mustache.github.io/mustache.5.html
[autoprefixer]: https://github.com/ai/autoprefixer
