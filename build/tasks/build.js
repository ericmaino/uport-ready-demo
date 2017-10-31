'use strict';

var gulp = require('gulp');
var sourceMaps = require('gulp-sourcemaps');
var tsc = require('gulp-typescript');
var gulpConfig = require('./../gulp-config');
var ncp = require('ncp').ncp;

gulp.task('transpile', ['clean'], function () {
    var tsResult = gulp
        .src(gulpConfig.allTypescript, {
            base: '.'
        })
        .pipe(sourceMaps.init())
        .pipe(tsc(gulpConfig.typescriptCompilerOptions))
        .on('error', function (err) {
            throw new Error('TypeScript transpilation error: ' + err);
        });

    return tsResult.js
        .pipe(sourceMaps.write('.'))
        .pipe(gulp.dest(''));
});

gulp.task('copy-public', function () {
    ncp(gulpConfig.srcPublicDir, gulpConfig.relPublicDir, function (err) {
        if (err) {
            throw new Error('Gulp copy error: ' + err);
        }
    });
});