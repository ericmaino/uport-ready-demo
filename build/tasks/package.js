'use strict';

var gulp = require('gulp');
var path = require('path');
var zip = require('gulp-zip');
var minimist = require('minimist');
var fs = require('fs');
var defaultRoot = path.join(__dirname, "../..");

var knownOptions = {
    string: 'packageName',
    string: 'packagePath',
    default: { packageName: "Package.zip", packagePath: path.join(defaultRoot, '_package') }
};

var options = minimist(process.argv.slice(2), knownOptions);

gulp.task('package', function () {

    var packagePaths = ['**',
        '!**/_package/**',
        '!**/typings/**',
        '!typings',
        '!_package',
        '!gulpfile.js'];

    //add exclusion patterns for all dev dependencies
    var packageJSON = JSON.parse(fs.readFileSync(path.join(defaultRoot, 'package.json'), 'utf8'));
    var devDeps = packageJSON.devDependencies;

    for (var propName in devDeps) {
        var excludePattern1 = "!**/node_modules/" + propName + "/**";
        var excludePattern2 = "!**/node_modules/" + propName;
        packagePaths.push(excludePattern1);
        packagePaths.push(excludePattern2);
    }

    for (var i=0; i<packagePaths.length; i++)
    {
        packagePaths[i] = path.join(defaultRoot, packagePaths[i]);
    }
    
    return gulp.src(packagePaths)
        .pipe(zip(options.packageName))
        .pipe(gulp.dest(options.packagePath));
});