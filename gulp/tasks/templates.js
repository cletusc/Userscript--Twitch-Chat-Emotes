var gulp = require('gulp');
var compiler = require('gulp-hogan-compile');

gulp.task('templates', function () {

	return gulp.src('src/templates/*.html')
		.pipe(compiler('templates.js', {
			wrapper: 'commonjs',
			hoganModule: 'hogan.js/lib/template.js'
		}))
		.pipe(gulp.dest('./build'));
});
