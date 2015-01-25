csscriticLib.urlQueryFilter = function (windowLocation) {
    "use strict";

    var module = {};

    var filterParam = 'filter';

    var parseUrlSearch = function (search) {
        var paramString = search.replace(/^\?/, '');
        if (!paramString) {
            return [];
        }
        return paramString
            .split('&')
            .map(function (keyValue) {
                var equalsIdx = keyValue.indexOf('='),
                    key, value;

                if (equalsIdx >= 0) {
                    key = keyValue.substr(0, equalsIdx);
                    value = keyValue.substr(equalsIdx + 1);
                } else {
                    key = keyValue;
                }
                return {
                    key: key,
                    value: value
                };
            });
    };

    var serializeKeyValuePair = function (pair) {
        if (pair.value) {
            return pair.key + '=' + pair.value;
        }
        return pair.key;
    };

    var getSelectedUrl = function () {
        var filterKeyValue = parseUrlSearch(windowLocation.search)
                .filter(function (entryPair) {
                    return entryPair.key === filterParam;
                })
                .pop();

        if (filterKeyValue) {
            return decodeURIComponent(filterKeyValue.value);
        }
    };

    var selectedUrl = getSelectedUrl(),
        existingQueryParams = parseUrlSearch(windowLocation.search);

    // interface towards main.js

    module.isComparisonSelected = function (comparison) {
        return !selectedUrl ||  comparison.testCase.url === selectedUrl;
    };

    // interface towards browser reporters

    var queryPart = function (selection) {
        var queryParams = existingQueryParams
                .filter(function (pair) {
                    return pair.key !== filterParam;
                });
        if (selection) {
            queryParams.push({
                key: filterParam,
                value: encodeURIComponent(selection)
            });
        }

        return '?' + queryParams.map(serializeKeyValuePair).join('&');
    };

    module.filterUrlFor = function (selection) {
        return queryPart(selection);
    };

    module.clearFilterUrl = function () {
        return queryPart();
    };

    return module;
};
