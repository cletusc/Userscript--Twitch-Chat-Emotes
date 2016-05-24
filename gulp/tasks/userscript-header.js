var generateUserscriptHeader = require('generate-userscript-header');
var gulp = require('gulp');
var readJSON = require('../util/readJSON');
var header = require('gulp-header');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('userscript-header', ['browserify'], function () {
	var pkg = readJSON('package.json');
	return gulp.src('./build/app.js')
		.pipe(header('/* Script compiled using build script. Script uses Browserify for CommonJS modules. */\n\n'))
		.pipe(header(generateUserscriptHeader(pkg.userscript, {pkg: pkg})))
		.pipe(rename('script.user.js'))
		.pipe(gulp.dest(''))
		.pipe(uglify())
		.pipe(header('/*! ' + pkg.userscript.name + ' v' + pkg.version + ', ' + (new Date().toUTCString()) + ', ' + pkg.homepage + ' */\n'))
		.pipe(rename('script.min.js'))
		.pipe(gulp.dest(''));
});
