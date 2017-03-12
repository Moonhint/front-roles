var gulp = require('gulp');
var copy = require('gulp-copy');
var clean = require('gulp-clean');

var sourceFiles = ['front-roles.js', './node_modules/crypto-js/*'];
var destination = 'simulation/node_modules/front-roles/';

gulp.task('clean', function(){
  return gulp
      .src(destination, {read: false})
      .pipe(clean());
});

gulp.task('copy', function(){
  return gulp
      .src(sourceFiles)
      .pipe(copy(destination, { }));
});


gulp.task('simulate', ['clean', 'copy'])

// gulp.task('css', function(){
//   return gulp.src('client/templates/*.less')
//     .pipe(less())
//     .pipe(minifyCSS())
//     .pipe(gulp.dest('build/css'))
// });
