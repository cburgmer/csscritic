csscriticLib.reporting = function (renderer, storage, util) {
    "use strict";

    var module = {};

    var buildReportResult = function (comparison) {
        var viewportWidth = comparison.viewportWidth,
            viewportHeight = comparison.viewportHeight;
        var result = {
                status: comparison.status,
                testCase: comparison.testCase,
                pageImage: comparison.htmlImage
            };

        if (comparison.htmlImage) {
            result.resizePageImage = function (width, height, callback) {
                viewportWidth = width;
                viewportHeight = height;

                renderer.render({
                    url: comparison.testCase.url,
                    hover: comparison.testCase.hover,
                    active: comparison.testCase.active,
                    width: width,
                    height: height
                }).then(function (renderResult) {
                    result.pageImage = renderResult.image;
                    callback(renderResult.image);
                });
            };
            result.acceptPage = function () {
                storage.storeReferenceImage(comparison.testCase, result.pageImage, {
                    width: viewportWidth,
                    height: viewportHeight
                });
            };
        }

        if (comparison.referenceImage) {
            result.referenceImage = comparison.referenceImage;
        }

        if (comparison.renderErrors && comparison.renderErrors.length) {
            result.renderErrors = comparison.renderErrors;
        }

        return result;
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
        var result = buildReportResult(comparison);

        return util.all(reporters.map(function (reporter) {
            if (reporter.reportComparison) {
                return reporter.reportComparison(result);
            }
        }));
    };

    module.doReportTestSuite = function (reporters, passed) {
        return util.all(reporters.map(function (reporter) {
            if (reporter.report) {
                return reporter.report({success: passed});
            }
        }));
    };

    return module;
};
