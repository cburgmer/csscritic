var csscritic;

(function () {
    "use strict";

    var util = csscriticLib.util(),
        browserRenderer = csscriticLib.browserRenderer(util, csscriticLib.jobQueue, rasterizeHTML),
        domstorage = csscriticLib.domstorage(util, localStorage),
        reporting = csscriticLib.reporting(browserRenderer, domstorage, util);

    csscritic = csscriticLib.main(
        browserRenderer,
        domstorage,
        reporting,
        util,
        imagediff);

    // Export convenience constructors
    var basicHTMLReporterUtil = csscriticLib.basicHTMLReporterUtil(),
        basicHTMLReporter = csscriticLib.basicHTMLReporter(util, basicHTMLReporterUtil, window.document);

    csscritic.BasicHTMLReporter = basicHTMLReporter.BasicHTMLReporter;
}());
