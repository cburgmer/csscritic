/*
 * CSS Critic loader
 *
 * Just include
 *    <script src="csscritic.js"></script>
 * and you are good to go.
 */
(function () {
    var thisFileName = 'csscritic.js',
        cssDependencies = [
            'src/browser/basichtmlreporter.css'
        ],
        jsDependencies = [
            'node_modules/rasterizehtml/dist/rasterizeHTML.allinone.js',
            'node_modules/imagediff/imagediff.js',
            'node_modules/ayepromise/ayepromise.js',
            'src/scope.js',
            'src/browser/basichtmlreporterutil.js',
            'src/browser/basichtmlreporter.js',
            'src/browser/browserrenderer.js',
            'src/browser/domstorage.js',
            'src/browser/jobqueue.js',
            'src/utils.js',
            'src/csscritic.js',
            'src/boot.js'
        ];

    var getBasePath = function () {
        var script = document.querySelector('script[src*="' + thisFileName + '"]'),
            src = script.attributes.src.value;

        return src.substring(0, src.indexOf(thisFileName));
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
