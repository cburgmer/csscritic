csscriticLib.fallbackFilter = function (backingFilter) {
    "use strict";

    var module = {};

    module.isComparisonSelected = function (comparison) {
        return backingFilter.isComparisonSelected(comparison);
    };

    module.filterUrlFor = function (selection) {
        return backingFilter.filterUrlFor(selection);
    };

    module.clearFilterUrl = function (selection) {
        return backingFilter.clearFilterUrl(selection);
    };

    return module;
};
