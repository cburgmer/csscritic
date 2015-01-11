csscriticLib.main = function (regression, reporting, util, storage) {
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

    var executeTestCase = function (testCase) {
        return regression.compare(testCase).then(function (comparison) {
            return reporting.doReportComparison(reporters, comparison).then(function () {
                return comparison;
            });
        });
    };

    module.execute = function () {
        var allPassed;

        return fetchStartingComparisons(testCases)
            .then(function (startingComparisons) {
                return reporting.doReportComparisonStarting(reporters, startingComparisons);
            })
            .then(function () {
                return util.all(testCases.map(
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
