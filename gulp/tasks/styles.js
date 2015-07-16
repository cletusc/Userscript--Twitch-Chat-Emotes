var gulp = require('gulp');
var cssBase64 = require('gulp-css-base64');
var minify = require('gulp-minify-css');
var prefix = require('gulp-autoprefixer');
var header = require('gulp-header');
var concat = require('gulp-concat');
var css2js = require('gulp-css2js');

var minifyText = [
	'/**',
	' * Minified style.',
	' * Original filename: <%= file.path.replace(file.cwd, \'\') %>',
	' */\n'
].join('\n');

gulp.task('styles', function () {
	return gulp.src([
			'node_modules/jquery.scrollbar/jquery.scrollbar.css',
			'src/styles/style.css'
		])
		.pipe(cssBase64())
		.pipe(prefix())
		.pipe(minify())
		.pipe(header(minifyText))
		.pipe(concat('styles.css'))
		.pipe(css2js({
			trimSpacesBeforeNewline: false,
			trimTrailingNewline: false,
			prefix: [
				'(function (doc, cssText) {',
				'    var id = "emote-menu-for-twitch-styles";',
				'    var styleEl = doc.getElementById(id);',
				'    if (!styleEl) {',
				'        styleEl = doc.createElement("style");',
				'        styleEl.id = id;',
				'        doc.getElementsByTagName("head")[0].appendChild(styleEl);',
				'    }',
				'    if (styleEl.styleSheet) {',
				'        if (!styleEl.styleSheet.disabled) {',
				'            styleEl.styleSheet.cssText = cssText;',
				'        }',
				'    } else {',
				'        try {',
				'            styleEl.innerHTML = cssText;',
				'        } catch (ignore) {',
				'            styleEl.innerText = cssText;',
				'        }',
				'    }',
				'}(document, "'
			].join('\n')
		}))
		.pipe(gulp.dest('build'));
});
