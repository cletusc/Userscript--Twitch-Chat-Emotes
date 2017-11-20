var browserify = require('browserify');
var bundleLogger = require('../util/bundleLogger');
var gulp = require('gulp');
var handleErrors = require('../util/handleErrors');
var source = require('vinyl-source-stream');

gulp.task('browserify', ['templates', 'styles'], function() {
	var bundler = browserify({
		// Specify the entry point of your app
		entries: ['./src/script.js'],
		// Add file extentions to make optional in your requires
		extensions: ['.coffee', '.hbs'],
		// Enable source maps!
		debug: true
	});

	var bundle = function () {
		// Log when bundling starts
		bundleLogger.start();

		return bundler
			// runs deamdify to make jquery-ui import compatible
			.transform({global: true}, 'deamdify')
			.bundle()
			// Report compile errors
			.on('error', handleErrors)
			// Use vinyl-source-stream to make the
			// stream gulp compatible. Specifiy the
			// desired output filename here.
			.pipe(source('app.js'))
			// Specify the output destination
			.pipe(gulp.dest('./build/'))
			// Log when bundling completes!
			.on('end', bundleLogger.end);
	};

	return bundle();
});
