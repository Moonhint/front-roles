'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const copy = require('gulp-copy');
const clean = require('gulp-clean');
const minify = require('gulp-minify');
const rename = require("gulp-rename");
const run_sequence = require('run-sequence');

gulp.task('clean-sim', function(){
  return gulp
      .src(['simulation/node_modules', 'simulation/bower_components'], {read: false})
      .pipe(clean());
});

gulp.task('clean-map', function(){
  return gulp
      .src('map', {read: false})
      .pipe(clean());
});

gulp.task('clean-build', function(){
  return gulp
      .src(['./front-roles.js', './front-roles.min.js'], {read: false})
      .pipe(clean());
});

gulp.task('copy-node', function(){
  return gulp
      .src(['./front-roles.min.js', './front-roles.js'])
      .pipe(copy('./simulation/node_modules/front-roles/'));
});

gulp.task('copy-bower', function(){
  return gulp
      .src(['./front-roles.min.js', './front-roles.js'])
      .pipe(copy('./simulation/bower_components/front-roles/'));
});

gulp.task('copy-angular', function(){
  return gulp
      .src(['./node_modules/angular/*'])
      .pipe(copy('./simulation/'), {});
});

gulp.task('copy-crypto-node', function(){
  return gulp
      .src(['./node_modules/crypto-js/*'])
      .pipe(copy('./simulation/node_modules', {prefix: 1}));
});

gulp.task('copy-crypto-bower', function(){
  return gulp
      .src(['./node_modules/crypto-js/*'])
      .pipe(copy('./simulation/bower_components', {prefix: 1}));
});

gulp.task('copy-min-build', function(){
  return gulp
      .src('./map/index.min.js')
      .pipe(rename("./front-roles.min.js"))
      .pipe(gulp.dest("."));
});

gulp.task('copy-build', function(){
  return gulp
      .src('./map/index.js')
      .pipe(rename("./front-roles.js"))
      .pipe(gulp.dest("."));
});

gulp.task('map', () => {
  return gulp
      .src('index.js')
      .pipe(babel({
          presets: ['es2015']
      }))
      .pipe(gulp.dest('map'));
});

gulp.task('compress', function() {
  return gulp.src('map/*.js')
    .pipe(minify({
        ext:{
            src:'.js',
            min:'.min.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['.combo.js', '-min.js']
    }))
    .pipe(gulp.dest('map'))
});

gulp.task('simulate', function(){
  run_sequence('clean-map', 'map', 'compress', 'clean-sim',
               'copy-node', 'copy-bower', 'copy-angular',
               'copy-crypto-node', 'copy-crypto-bower');
});


gulp.task('build', function(){
  run_sequence( 'clean-map', 'map', 'compress',
                'clean-build',
                'copy-build', 'copy-min-build');
});
