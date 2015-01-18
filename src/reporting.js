csscriticLib.reporting = function (renderer, storage, util) {
    "use strict";

    var module = {};

    var testCaseIsResizable = function (testCase) {
        return testCase.width === undefined && testCase.height === undefined;
    };

    var attachPageAcceptHelpers = function (comparison) {
        var viewportWidth, viewportHeight;

        if (comparison.pageImage) {
            viewportWidth = comparison.viewport.width;
            viewportHeight = comparison.viewport.height;

            if (testCaseIsResizable(comparison.testCase)) {
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
            }
            comparison.acceptPage = function () {
                storage.storeReferenceImage(comparison.testCase, comparison.pageImage, {
                    width: viewportWidth,
                    height: viewportHeight
                });
            };
        }
    };

    module.doReportConfiguredComparison = function (reporters, configuredComparison, isSelected) {
        return util.all(reporters.map(function (reporter) {
            var reportingFunc = isSelected ? reporter.reportComparisonStarting : reporter.reportDeselectedComparison;
            if (reportingFunc) {
                return reportingFunc(configuredComparison);
            }
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
