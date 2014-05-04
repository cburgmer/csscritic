/*
 * CSS Critic loader
 *
 * Just include
 *    <script src="csscritic.js"></script>
 * and you are good to go.
 */
(function () {
    var cssDependencies = [
            'src/browser/basichtmlreporter.css'
        ],
        jsDependencies = [
            'node_modules/rasterizehtml/dist/rasterizeHTML.allinone.js',
            'node_modules/imagediff/imagediff.js',
            'node_modules/ayepromise/ayepromise.js',
            'src/boot/scope.js',
            'src/browser/basichtmlreporterutil.js',
            'src/browser/basichtmlreporter.js',
            'src/browser/browserrenderer.js',
            'src/browser/domstorage.js',
            'src/browser/jobqueue.js',
            'src/utils.js',
            'src/csscritic.js',
            'src/boot/browser.js'
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
