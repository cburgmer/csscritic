/* exported csscritic */
var csscritic = (function () {
    "use strict";

    var installCallChain = function (func, self) {
        return function chainableProxy() {
            func.apply(null, arguments);
            return self;
        };
    };

    var startsWith = function (str, prefix) {
        // PhantomJS has no startsWith
        return str.substr(0, prefix.length) === prefix;
    };

    // Work around https://bugzilla.mozilla.org/show_bug.cgi?id=1005634
    var needsFallback = function () {
        return startsWith(window.location.href, 'file://');
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
        niceReporter = csscriticLib.niceReporter(
            util,
            filter,
            needsFallback() ? pageNavigationHandlingFallback : undefined,
            rasterizeHTML,
            packageVersion
        );


    var self = {};

    self.add = installCallChain(main.add, self);
    self.component = installCallChain(main.component, self);
    self.execute = main.execute;

    self.addReporter = installCallChain(reporting.addReporter, self);

    self.BasicHTMLReporter = basicHTMLReporter.BasicHTMLReporter;
    self.NiceReporter = niceReporter.NiceReporter;

    return self;
}());
