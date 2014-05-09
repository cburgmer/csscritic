csscriticLib.main = function (renderer, storage, util, imagediff) {
    "use strict";

    var module = {};

    var reporters = [],
        testCases = [];

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

    var reportComparisonStarting = function (testCases) {
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

    var reportComparison = function (comparison) {
        var result = buildReportResult(comparison);

        return util.all(reporters.map(function (reporter) {
            if (reporter.reportComparison) {
                return reporter.reportComparison(result);
            }
        }));
    };

    var reportTestSuite = function (passed) {
        return util.all(reporters.map(function (reporter) {
            if (reporter.report) {
                return reporter.report({success: passed});
            }
        }));
    };

    module.addReporter = function (reporter) {
        reporters.push(reporter);
    };

    var workaroundFirefoxResourcesSporadicallyMissing = function (htmlImage, referenceImage) {
        if (referenceImage) {
            // This does nothing meaningful for us, but seems to trigger Firefox to load any missing resources.
            imagediff.diff(htmlImage, referenceImage);
        }
    };

    var loadPageAndReportResult = function (testCase, viewport, referenceImage, callback) {
        renderer.render({
            url: testCase.url,
            hover: testCase.hover,
            active: testCase.active,
            width: viewport.width,
            height: viewport.height
        }).then(function (renderResult) {
            workaroundFirefoxResourcesSporadicallyMissing(renderResult.image, referenceImage);

            util.workAroundTransparencyIssueInFirefox(renderResult.image).then(function (adaptedHtmlImage) {
                var isEqual, textualStatus;

                if (referenceImage) {
                    isEqual = imagediff.equal(adaptedHtmlImage, referenceImage);
                    textualStatus = isEqual ? "passed" : "failed";
                } else {
                    textualStatus = "referenceMissing";
                }

                reportComparison({
                    status: textualStatus,
                    testCase: testCase,
                    htmlImage: renderResult.image,
                    referenceImage: referenceImage,
                    renderErrors: renderResult.errors,
                    viewportWidth: viewport.width,
                    viewportHeight: viewport.height
                }).then(function () {
                    callback(textualStatus === "passed");
                });
            });
        }, function () {
            var textualStatus = "error";

            reportComparison({
                status: textualStatus,
                testCase: testCase
            }).then(function () {
                callback(false);
            });
        });
    };

    var compare = function (testCase, callback) {
        var defaultViewport = {width: 800, height: 100};

        storage.readReferenceImage(testCase, function (referenceImage, viewport) {
            loadPageAndReportResult(testCase, viewport, referenceImage, callback);
        }, function () {
            loadPageAndReportResult(testCase, defaultViewport, null, callback);
        });
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

    module.execute = function (callback) {
        reportComparisonStarting(testCases).then(function () {

            util.all(testCases.map(function (testCase) {
                var defer = ayepromise.defer();

                compare(testCase, function (v) {
                    defer.resolve(v);
                });

                return defer.promise;
            })).then(function (results) {
                var allPassed = results.indexOf(false) === -1;

                reportTestSuite(allPassed).then(function () {
                    if (callback) {
                        callback(allPassed);
                    }
                });
            });
        });
    };

    return module;
};
