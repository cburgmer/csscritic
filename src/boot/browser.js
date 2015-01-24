/* exported csscritic */
var csscritic = (function () {
    "use strict";

    var packageVersion = csscriticLib.packageVersion || 'dev',
        util = csscriticLib.util();

    var domStorage = csscriticLib.domstorage(util, localStorage),
        indexedDbStorage = csscriticLib.indexeddbstorage(util),
        migrateToIndexedDbStorage = csscriticLib.migratetoindexeddbstorage(domStorage, indexedDbStorage);

    var browserRenderer = csscriticLib.browserRenderer(util, csscriticLib.jobQueue, rasterizeHTML),
        reporting = csscriticLib.reporting(browserRenderer, migrateToIndexedDbStorage, util),
        regression = csscriticLib.regression(browserRenderer, util, imagediff),
        queryFilter = csscriticLib.urlQueryFilter(window.location);

    var main = csscriticLib.main(
        regression,
        reporting,
        util,
        migrateToIndexedDbStorage,
        queryFilter
    );

    var basicHTMLReporterUtil = csscriticLib.basicHTMLReporterUtil(),
        basicHTMLReporter = csscriticLib.basicHTMLReporter(util, basicHTMLReporterUtil, window.document);

    var pageNavigationHandlingFallback = csscriticLib.pageNavigationHandlingFallback(),
        niceReporter = csscriticLib.niceReporter(util, queryFilter, pageNavigationHandlingFallback, packageVersion);

    return {
        add: main.add,
        execute: main.execute,

        addReporter: reporting.addReporter,

        BasicHTMLReporter: basicHTMLReporter.BasicHTMLReporter,
        NiceReporter: niceReporter.NiceReporter
    };
}());
