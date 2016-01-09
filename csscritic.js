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
            'src/reporter/niceReporter.css'
        ],
        jsDependencies = [
            'node_modules/rasterizehtml/dist/rasterizeHTML.allinone.js',
            'node_modules/imagediff/imagediff.js',
            'node_modules/ayepromise/ayepromise.js',
            'src/scope.js',
            'src/reporter/pageNavigationHandlingFallback.js',
            'src/reporter/niceReporter.js',
            'src/reporter/urlQueryFilter.js',
            'src/reporter/fallbackFilter.js',
            'src/jobQueue.js',
            'src/browserRenderer.js',
            'src/indexedDbStorage.js',
            'src/util.js',
            'src/reporting.js',
            'src/regression.js',
            'src/main.js',
            'packageVersion.js',
            'src/init.js'
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

    var basePath = getBasePath();

    cssDependencies.forEach(function (path) {
        loadCssDependency(basePath + path);
    });

    jsDependencies.forEach(function (path) {
        loadJsDependency(basePath + path);
    });
}());
