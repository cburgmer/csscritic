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

    module.isComparisonSelected = function (comparison) {
        return !selectedUrl ||  comparison.testCase.url === selectedUrl;
    };

    module.setSelection = function (selection) {
        windowLocation.search = "?filter=" + encodeURIComponent(selection);
    };

    return module;
};
