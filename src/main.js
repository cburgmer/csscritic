csscriticLib.main = function (regression, reporting, util, storage, selectionFilter) {
    "use strict";

    var module = {};

    var reporters = [],
        testCases = [];


    module.addReporter = function (reporter) {
        reporters.push(reporter);
    };

    var supportUrlAsOnlyTestCaseInput = function (testCase) {
        if (typeof testCase === 'string') {
            return {
                url: testCase
            };
        }
        return testCase;
    };

    module.add = function (testCase) {
        testCases.push(supportUrlAsOnlyTestCaseInput(testCase));
    };

    var fetchStartingComparisons = function (testCases) {
        return util.all(testCases.map(function (testCase) {
            return storage.readReferenceImage(testCase)
                .then(function (referenceImageRecord) {
                    return {
                        testCase: testCase,
                        referenceImage: referenceImageRecord.image,
                        viewport: referenceImageRecord.viewport
                    };
                }, function () {
                    // no referenceImage found
                    return {
                        testCase: testCase
                    };
                });
        }));
    };

    var selectComparisons = function (configuredComparisons) {
        return configuredComparisons.map(function (configuredComparison) {
            return {
                configuredComparison: configuredComparison,
                selected: !selectionFilter || selectionFilter.isComparisonSelected(configuredComparison)
            };
        });
    };

    var reportConfiguredComparisons = function (comparisonSelection) {
        return util.all(comparisonSelection.map(function (selection) {
            var isSelected = selection.selected;
            return reporting.doReportConfiguredComparison(reporters, selection.configuredComparison, isSelected);
        }));
    };

    var executeTestCase = function (startingComparison) {
        return regression.compare(startingComparison).then(function (comparison) {
            return reporting.doReportComparison(reporters, comparison).then(function () {
                return comparison;
            });
        });
    };

    module.execute = function () {
        var comparisonSelection, allPassed;

        return fetchStartingComparisons(testCases)
            .then(function (startingComp) {
                comparisonSelection = selectComparisons(startingComp);

                return reportConfiguredComparisons(comparisonSelection);
            })
            .then(function () {
                var selectedComparisons = comparisonSelection.filter(function (selection) {
                    return selection.selected;
                }).map(function (selection) {
                    return selection.configuredComparison;
                });

                return util.all(selectedComparisons.map(
                    executeTestCase
                ));
            })
            .then(function (comparisons) {
                allPassed = util.hasTestSuitePassed(comparisons);
            })
            .then(function () {
                return reporting.doReportTestSuite(reporters, allPassed);
            })
            .then(function () {
                return allPassed;
            });
    };

    return module;
};
