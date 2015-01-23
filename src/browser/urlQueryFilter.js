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

        return decodeURIComponent(filterKeyValues[0].replace(filterRegex, ''));
    };

    var selectedUrl = getSelectedUrl();

    // interface towards main.js

    module.isComparisonSelected = function (comparison) {
        return !selectedUrl ||  comparison.testCase.url === selectedUrl;
    };

    // interface towards browser reporters

    var buildFilterSearchPart = function (selection) {
        return "?filter=" + encodeURIComponent(selection);
    };

    module.filterUrlFor = function (selection) {
        return buildFilterSearchPart(selection);
    };

    module.setSelection = function (selection) {
        windowLocation.search = buildFilterSearchPart(selection);
    };

    return module;
};
