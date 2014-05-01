var csscritic;

(function () {
    "use strict";

    var util = csscriticLib.util(),
        browserRenderer = csscriticLib.browserRenderer(util, csscriticLib.jobQueue, rasterizeHTML),
        domstorage = csscriticLib.domstorage(util, localStorage);

    csscritic = csscriticLib.main(
        browserRenderer,
        domstorage,
        util,
        imagediff);

    // Export convenience constructors
    var basicHTMLReporterUtil = csscriticLib.basicHTMLReporterUtil(),
        basicHTMLReporter = csscriticLib.basicHTMLReporter(util, basicHTMLReporterUtil, window.document);

    csscritic.BasicHTMLReporter = basicHTMLReporter.BasicHTMLReporter;
}());
