csscriticLib.urlQueryFilter = function (windowLocation) {
    "use strict";

    var module = {};

    var getSelectedUrl = function () {
        var filterRegex = /^filter=/,
            filterKeyValues = windowLocation.search
                .replace(/^\?/, '')
                .split('&')
                .filter(function (keyValuePair) {
                    return keyValuePair.match(filterRegex);
                });

        if (filterKeyValues.length === 0) {
            return;
        }

        return filterKeyValues[0].replace(filterRegex, '');
    };

    module.filterComparisons = function (comparisons) {
        var selectedUrl = getSelectedUrl();

        if (!selectedUrl) {
            return comparisons;
        }

        return comparisons.filter(function (comparison) {
            return comparison.testCase.url === selectedUrl;
        });
    };

    module.setSelection = function (selection) {
        windowLocation.search = "?filter=" + encodeURIComponent(selection);
    };

    return module;
};
