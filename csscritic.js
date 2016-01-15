/*
 * CSS Critic loader
 *
 * Just include
 *    <script src="csscritic.js"></script>
 * and you are good to go.
 */
/*jslint evil: true */
(function () {
    "use strict";

    var cssDependencies = [
            'src/browser/niceReporter.css'
        ],
        jsDependencies = [
            'src/boot/scope.js',
            'src/browser/pageNavigationHandlingFallback.js',
            'src/browser/niceReporter.js',
            'src/browser/browserRenderer.js',
            'src/browser/indexedDbStorage.js',
            'src/browser/jobQueue.js',
            'src/browser/urlQueryFilter.js',
            'src/browser/fallbackFilter.js',
            'src/util.js',
            'src/reporting.js',
            'src/regression.js',
            'src/main.js',
            'packageVersion.js',
            'src/boot/browser.js'
        ],
        externalJsDependencies = [
            'rasterizehtml/dist/rasterizeHTML.allinone.js',
            'imagediff/imagediff.js',
            'ayepromise/ayepromise.js'
        ];

    var getCurrentScript = function () {
        return document.currentScript || (function() {
          var scripts = document.getElementsByTagName('script');
          return scripts[scripts.length - 1];
        })();
    };

    var getBasePath = function () {
        var script = getCurrentScript(),
            src = script.attributes.src.value;

        return src.substring(0, src.lastIndexOf('/') + 1);
    };

    var loadCssDependency = function (path) {
        document.write('<link rel="stylesheet" href="' + path + '">');
    };

    var loadJsDependency = function (path) {
        document.write('<script src="' + path + '"></script>');
    };

    var loadExternalJsDependency = function (basePath, path) {
        loadJsDependency(basePath + '../../node_modules/' + path);
        // Fallback to npm <3
        loadJsDependency(basePath + 'node_modules/' + path);
    };

    var basePath = getBasePath();

    cssDependencies.forEach(function (path) {
        loadCssDependency(basePath + path);
    });

    externalJsDependencies.forEach(function (path) {
        loadExternalJsDependency(basePath, path);
    });

    jsDependencies.forEach(function (path) {
        loadJsDependency(basePath + path);
    });
}());
