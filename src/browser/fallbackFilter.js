csscriticLib.fallbackFilter = function (windowLocation) {
    "use strict";

    var module = {};

    var storageKey = 'csscriticFallbackFilter';

    module.isComparisonSelected = function (comparison) {
        var selectedUrl = sessionStorage.getItem(storageKey);
        return !selectedUrl || comparison.testCase.url === selectedUrl;
    };

    module.filterUrlFor = function () {
        return '#';
    };

    module.filterFor = function (selection) {
        sessionStorage.setItem(storageKey, selection);

        windowLocation.reload();
    };

    module.clearFilterUrl = function () {
        return '#';
    };

    module.clearFilter = function () {
        sessionStorage.removeItem(storageKey);

        windowLocation.reload();
    };

    return module;
};
