var gulp = require('gulp');
var conflict = require('gulp-conflict');

gulp.task('init-config', function() {
	return gulp.src('gulp/config/*')
		.pipe(conflict('build/config'))
		.pipe(gulp.dest('build/config'));
});
