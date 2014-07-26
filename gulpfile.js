// Regular npm modules.
var gulp = require('gulp');
var hogan = require('hogan.js');

// Gulp npm modules.
var concat = require('gulp-concat');
var conflict = require('gulp-conflict');
var cssBase64 = require('gulp-css-base64');
var cssMin = require('gulp-minify-css');
var header = require('gulp-header');
var hoganCompiler = require('gulp-hogan-compile')
var map = require('vinyl-map');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var prefix = require('gulp-autoprefixer');

// Custom modules.
var generateUserscriptHeader = require('./gulp/generate-userscript-header');
var files = require('./gulp/files');

var minifyText = [
	'/**',
	' * Minified file. Third-party version information can be found in /package.json.',
	' * Original filename: <%= file.path.replace(file.cwd, \'\') %>',
	' */\n'
].join('\n');
var templateData = {};

gulp.task('vendor-js', function () {
	return gulp.src(files.vendorJS)
		.pipe(uglify())
		.pipe(header(minifyText))
		.pipe(concat('vendor.js'))
		.pipe(map(function (contents) {
			templateData.vendorJS = contents.toString();
		}));
});

gulp.task('styles', function () {
	return gulp.src(files.CSS)
		.pipe(cssBase64())
		.pipe(prefix())
		.pipe(cssMin())
		.pipe(header(minifyText))
		.pipe(concat('styles.css'))
		.pipe(gulp.dest('build'));
});

gulp.task('jquery-plugins', function () {
	return gulp.src(files.jQueryPlugins)
		.pipe(uglify())
		.pipe(header(minifyText))
		.pipe(concat('plugins.js'))
		.pipe(map(function (contents) {
			templateData.jQueryPlugins = contents.toString();
		}));
});

gulp.task('templates', function () {
	return gulp.src(files.templates)
		.pipe(hoganCompiler('templates.js', {
			// hoganModule: null,
			wrapper: false
		}))
		.pipe(map(function (contents) {
			templateData.templates = contents.toString();
		}));
});

gulp.task('script', function () {
	return gulp.src('src/script.js')
		.pipe(map(function (contents) {
			templateData.script = contents.toString();
		}));
});

gulp.task('compile-script', ['vendor-js', 'styles', 'jquery-plugins', 'templates', 'script'], function () {
	var pkg = templateData.pkg = readJSON('package.json');
	templateData.pkgJSON = JSON.stringify(pkg);

	return gulp.src('gulp/script-template.js')
		.pipe(map(function (contents) {
			var template = hogan.compile(contents.toString());
			return template.render(templateData);
		}))
		.pipe(header(generateUserscriptHeader(pkg.userscript, {pkg: pkg})))
		.pipe(rename('script.user.js'))
		.pipe(gulp.dest(''))
		.pipe(uglify())
		.pipe(header('/*! ' + pkg.userscript.name + ' v' + pkg.version + ', ' + (new Date().toUTCString()) + ', ' + pkg.homepage + ' */\n'))
		.pipe(rename('script.min.js'))
		.pipe(gulp.dest(''));
});

gulp.task('init', function () {
	console.log('Moving config files to /build.');
	return gulp.src('gulp/config/*')
		.pipe(conflict('build/config'))
		.pipe(gulp.dest('build/config'));
});

gulp.task('default', ['compile-script'], function (done) {
	var paths = readJSON('build/config/script-copy-paths.json');
	if (!paths) {
		console.error('Unable to find config. Run `gulp init` then enter copy paths in /build/config/script-copy-paths.json.');
		return done();
	}

	console.log('Moving compiled script to your browsers.');
	paths.forEach(function (path) {
		gulp.src('script.user.js')
			.pipe(rename(path.filename))
			.pipe(gulp.dest(path.dir));
	});

	done();
});

gulp.task('watch', function () {
	gulp.watch(['src', 'package.json'], ['default']);
});

function readJSON(filename) {
	var fs = require('fs');
	if (!fs.existsSync(filename)) {
		return false;
	}
	return JSON.parse(fs.readFileSync(filename, 'utf8'));
}
