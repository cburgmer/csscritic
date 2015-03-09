csscriticLib.fallbackFilter = function (windowLocation) {
    "use strict";

    var module = {};

    var storageKey = 'csscriticFallbackFilter';

    module.isComparisonSelected = function (comparison) {
        var selectedUrl = sessionStorage.getItem(storageKey);
        return !selectedUrl || comparison.testCase.url === selectedUrl;
    };

    module.filterFor = function (testCase) {
        sessionStorage.setItem(storageKey, testCase.url);

        windowLocation.reload();
    };

    module.clearFilter = function () {
        sessionStorage.removeItem(storageKey);

        windowLocation.reload();
    };

    return module;
};
