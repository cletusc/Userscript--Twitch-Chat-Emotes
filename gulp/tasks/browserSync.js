var gulp = require('gulp');
var readJSON = require('../util/readJSON');
var rename = require('gulp-rename');

gulp.task('browserSync', ['build'], function (done) {
	var paths = readJSON('./build/config/script-copy-paths.json');
	if (!paths) {
		console.error('Unable to find config. Run `gulp init-config` then enter copy paths in /build/config/script-copy-paths.json.');
		return done();
	}

	paths.forEach(function (path) {
		gulp.src('script.user.js')
			.pipe(rename(path.filename))
			.pipe(gulp.dest(path.dir));
	});

	done();
});

