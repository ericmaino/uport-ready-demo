'use strict';

var path = require('path');
var srcRoot = './src';
var outputRoot = './release';
var testRoot = './release/tests';
var typescriptDefinitions = './node_modules/@types/**/index.d.ts';
var tsconfig = path.resolve('tsconfig.json');
var srcPublicDir = path.resolve('public');

module.exports = {
    packageJSON: path.resolve('package.json'),
    root: srcRoot,
    output: outputRoot,
    bundle: path.resolve('bundle.js'),
    allJavascript: [
        '!node_modules/**',
        outputRoot + '/**/*.js'
    ],
    allTypescript: [
        srcRoot + '/**/*.ts'
    ],
    allTranspiledTypeDefs: [
        outputRoot + '/**/*.d.ts'
    ],
    allTranspiledSourceMaps: [
        outputRoot + '/**/*.js.map'
    ],
    allTranspiledJavascript: [
        `!${outputRoot}/bundle.js`,
        outputRoot + '/**/*.js',
        testRoot + '/**/*.js'
    ],
    allJavascriptToTest: [
        outputRoot + '/Skills/**/*.js'
    ],
    javascriptUnitTests: [
        testRoot + '/unit/**/*.js'
    ],
    typescriptCompilerOptions: tsconfig,
    srcPublicDir: srcPublicDir,
    relPublicDir: `${outputRoot}/public`
};