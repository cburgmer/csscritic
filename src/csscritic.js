window.csscritic = (function (module, renderer, storage, imagediff) {
    var reporters, testCases, proxyUrl;

    var clear = function () {
        reporters = [];
        testCases = [];
        proxyUrl = null;
    };

    clear();

    module.setProxy = function (newProxyUrl) {
        proxyUrl = newProxyUrl;
    };

    var buildReportResult = function (comparison) {
        var viewportWidth = comparison.viewportWidth,
            viewportHeight = comparison.viewportHeight;
        var result = {
                status: comparison.status,
                pageUrl: comparison.pageUrl,
                pageImage: comparison.htmlImage
            };

        if (comparison.htmlImage) {
            result.resizePageImage = function (width, height, callback) {
                viewportWidth = width;
                viewportHeight = height;

                renderer.getImageForPageUrl({
                    url: comparison.pageUrl,
                    width: width,
                    height: height,
                    proxyUrl: proxyUrl
                }).then(function (renderResult) {
                    result.pageImage = renderResult.image;
                    callback(renderResult.image);
                });
            };
            result.acceptPage = function () {
                storage.storeReferenceImage(comparison.pageUrl, result.pageImage, {
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

    var reportComparisonStarting = function (testCases, callback) {
        module.util.map(testCases, function (testCase, finishTestCase) {
            module.util.map(reporters, function (reporter, finishReporter) {
                if (reporter.reportComparisonStarting) {
                    reporter.reportComparisonStarting({pageUrl: testCase.url}, finishReporter);
                } else {
                    finishReporter();
                }
            }, finishTestCase);
        }, callback);
    };

    var reportComparison = function (comparison, callback) {
        var result = buildReportResult(comparison);

        module.util.map(reporters, function (reporter, finishUp) {
            if (reporter.reportComparison) {
                reporter.reportComparison(result, finishUp);
            } else {
                finishUp();
            }
        }, callback);
    };

    var reportTestSuite = function (passed, callback) {
        module.util.map(reporters, function (reporter, finish) {
            if (reporter.report) {
                reporter.report({success: passed}, finish);
            } else {
                finish();
            }
        }, callback);
    };

    module.addReporter = function (reporter) {
        reporters.push(reporter);
    };

    module.clearReporters = function () {
        reporters = [];
    };

    var workaroundFirefoxResourcesSporadicallyMissing = function (htmlImage, referenceImage) {
        if (referenceImage) {
            // This does nothing meaningful for us, but seems to trigger Firefox to load any missing resources.
            imagediff.diff(htmlImage, referenceImage);
        }
    };

    var loadPageAndReportResult = function (testCase, viewport, referenceImage, callback) {

        renderer.getImageForPageUrl({
            url: testCase.url,
            width: viewport.width,
            height: viewport.height,
            proxyUrl: proxyUrl
        }).then(function (renderResult) {
            var isEqual, textualStatus;

            workaroundFirefoxResourcesSporadicallyMissing(renderResult.image, referenceImage);

            module.util.workAroundTransparencyIssueInFirefox(renderResult.image, function (adaptedHtmlImage) {
                if (referenceImage) {
                    isEqual = imagediff.equal(adaptedHtmlImage, referenceImage);
                    textualStatus = isEqual ? "passed" : "failed";
                } else {
                    textualStatus = "referenceMissing";
                }

                reportComparison({
                        status: textualStatus,
                        pageUrl: testCase.url,
                        htmlImage: renderResult.image,
                        referenceImage: referenceImage,
                        renderErrors: renderResult.errors,
                        viewportWidth: viewport.width,
                        viewportHeight: viewport.height
                    },
                    function () {
                        callback(textualStatus);
                    }
                );
            });
        }, function () {
            var textualStatus = "error";

            reportComparison({
                    status: textualStatus,
                    pageUrl: testCase.url
                },
                function () {
                    callback(textualStatus);
                }
            );
        });
    };

    var compare = function (testCase, callback) {
        var defaultViewport = {width: 800, height: 100};

        storage.readReferenceImage(testCase.url, function (referenceImage, viewport) {
            loadPageAndReportResult(testCase, viewport, referenceImage, callback);
        }, function () {
            loadPageAndReportResult(testCase, defaultViewport, null, callback);
        });
    };

    module.add = function (testCase) {
        // Support url as only test case input
        if (typeof testCase === 'string') {
            testCase = {
                url: testCase
            };
        }

        testCases.push(testCase);
    };

    module.execute = function (callback) {
        reportComparisonStarting(testCases, function () {

            module.util.map(testCases, function (testCase, finish) {
                compare(testCase, function (status) {
                    finish(status === "passed");
                });
            }, function (results) {
                var allPassed = results.indexOf(false) === -1;

                reportTestSuite(allPassed, function () {
                    if (callback) {
                        callback(allPassed);
                    }
                });
            });
        });
    };

    module.clear = clear;

    return module;
}(window.csscritic || {}, window.csscritic.renderer, window.csscritic.storage, imagediff));
