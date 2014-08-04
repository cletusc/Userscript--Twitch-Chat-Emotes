var gulp = require('gulp');

gulp.task('build', ['templates', 'styles', 'browserify', 'userscript-header']);
