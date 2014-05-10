csscriticLib.main = function (regression, reporting, util) {
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

    var executeTestCase = function (testCase) {
        return regression.compare(testCase).then(function (comparison) {
            return reporting.doReportComparison(reporters, comparison).then(function () {
                return comparison;
            });
        });
    };

    var calculateOverallOutcome = function (comparisons) {
        var nonPassingTestCases = comparisons.filter(function (comparison) {
                return comparison.status !== "passed";
            }),
            allPassed = nonPassingTestCases.length === 0;

        return allPassed;
    };

    module.execute = function () {
        var allPassed;

        return reporting.doReportComparisonStarting(reporters, testCases)
            .then(function () {
                return util.all(testCases.map(
                    executeTestCase
                ));
            })
            .then(function (comparisons) {
                allPassed = calculateOverallOutcome(comparisons);
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
