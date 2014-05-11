csscriticLib.reporting = function (renderer, storage, util) {
    "use strict";

    var module = {};

    var attachPageAcceptHelpers = function (comparison) {
        var viewportWidth, viewportHeight;

        if (comparison.pageImage) {
            viewportWidth = comparison.viewport.width;
            viewportHeight = comparison.viewport.height;
            comparison.resizePageImage = function (width, height) {
                viewportWidth = width;
                viewportHeight = height;

                return renderer.render({
                    url: comparison.testCase.url,
                    hover: comparison.testCase.hover,
                    active: comparison.testCase.active,
                    width: width,
                    height: height
                }).then(function (renderResult) {
                    comparison.pageImage = renderResult.image;
                    return renderResult.image;
                });
            };
            comparison.acceptPage = function () {
                storage.storeReferenceImage(comparison.testCase, comparison.pageImage, {
                    width: viewportWidth,
                    height: viewportHeight
                });
            };
        }
    };

    module.doReportComparisonStarting = function (reporters, testCases) {
        return util.all(testCases.map(function (testCase) {
            return util.all(reporters.map(function (reporter) {
                if (reporter.reportComparisonStarting) {
                    return reporter.reportComparisonStarting({
                        testCase: testCase
                    });
                }
            }));
        }));
    };

    module.doReportComparison = function (reporters, comparison) {
        var result = util.clone(comparison);

        attachPageAcceptHelpers(result);

        return util.all(reporters.map(function (reporter) {
            if (reporter.reportComparison) {
                return reporter.reportComparison(result);
            }
        }));
    };

    module.doReportTestSuite = function (reporters, passed) {
        return util.all(reporters.map(function (reporter) {
            if (reporter.reportTestSuite) {
                return reporter.reportTestSuite({success: passed});
            }
        }));
    };

    return module;
};
