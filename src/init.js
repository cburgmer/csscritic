/* exported csscritic */
var csscritic = (function () {
    "use strict";

    var installCallChain = function (func, self) {
        return function chainableProxy() {
            func.apply(null, arguments);
            return self;
        };
    };

    var packageVersion = csscriticLib.packageVersion || "dev",
        util = csscriticLib.util();

    var indexedDbStorage = csscriticLib.indexeddbstorage(util);

    var browserRenderer = csscriticLib.browserRenderer(
            util,
            csscriticLib.jobQueue,
            rasterizeHTML
        ),
        reporting = csscriticLib.reporting(
            browserRenderer,
            indexedDbStorage,
            util
        ),
        regression = csscriticLib.regression(browserRenderer, util, imagediff),
        queryFilter = csscriticLib.urlQueryFilter(window.location);

    var main = csscriticLib.main(
        regression,
        reporting,
        util,
        indexedDbStorage,
        queryFilter
    );

    var niceReporter = csscriticLib.niceReporter(
        window,
        util,
        queryFilter,
        rasterizeHTML,
        packageVersion
    );

    var self = {};

    self.add = installCallChain(main.add, self);
    self.component = installCallChain(main.component, self);
    self.execute = main.execute;

    self.addReporter = installCallChain(reporting.addReporter, self);

    self.NiceReporter = niceReporter.NiceReporter;

    return self;
})();
