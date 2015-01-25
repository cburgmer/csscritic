/* exported csscritic */
var csscritic = (function () {
    "use strict";

    // Work around https://bugzilla.mozilla.org/show_bug.cgi?id=1005634
    var needsFallback = function () {
        return window.location.href.startsWith('file://');
    };

    var packageVersion = csscriticLib.packageVersion || 'dev',
        util = csscriticLib.util();

    var domStorage = csscriticLib.domstorage(util, localStorage),
        indexedDbStorage = csscriticLib.indexeddbstorage(util),
        migrateToIndexedDbStorage = csscriticLib.migratetoindexeddbstorage(domStorage, indexedDbStorage);

    var browserRenderer = csscriticLib.browserRenderer(util, csscriticLib.jobQueue, rasterizeHTML),
        reporting = csscriticLib.reporting(browserRenderer, migrateToIndexedDbStorage, util),
        regression = csscriticLib.regression(browserRenderer, util, imagediff),
        queryFilter = csscriticLib.urlQueryFilter(window.location),
        fallbackFilter = csscriticLib.fallbackFilter(window.location);

    var filter = needsFallback() ? fallbackFilter : queryFilter;

    var main = csscriticLib.main(
        regression,
        reporting,
        util,
        migrateToIndexedDbStorage,
        filter
    );

    var basicHTMLReporterUtil = csscriticLib.basicHTMLReporterUtil(),
        basicHTMLReporter = csscriticLib.basicHTMLReporter(util, basicHTMLReporterUtil, window.document);

    var pageNavigationHandlingFallback = csscriticLib.pageNavigationHandlingFallback(window.location),
        niceReporter = csscriticLib.niceReporter(util, filter, pageNavigationHandlingFallback, packageVersion);

    return {
        add: main.add,
        execute: main.execute,

        addReporter: reporting.addReporter,

        BasicHTMLReporter: basicHTMLReporter.BasicHTMLReporter,
        NiceReporter: niceReporter.NiceReporter
    };
}());
