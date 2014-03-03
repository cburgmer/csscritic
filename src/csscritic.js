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

                renderer.getImageForPageUrl(comparison.pageUrl, width, height, proxyUrl, function (image) {
                    result.pageImage = image;
                    callback(image);
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
        var i, result,
            finishedReporterCount = 0,
            reporterCount = reporters.length,
            finishUp = function () {
                finishedReporterCount += 1;
                if (finishedReporterCount === reporterCount) {
                    callback();
                }
            };

        if (!reporterCount) {
            callback();
            return;
        }

        result = buildReportResult(comparison);

        for (i = 0; i < reporterCount; i++) {
            reporters[i].reportComparison(result, finishUp);
        }
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

    var loadPageAndReportResult = function (pageUrl, pageWidth, pageHeight, referenceImage, callback) {

        renderer.getImageForPageUrl(pageUrl, pageWidth, pageHeight, proxyUrl, function (htmlImage, renderErrors) {
            var isEqual, textualStatus;

            workaroundFirefoxResourcesSporadicallyMissing(htmlImage, referenceImage);

            module.util.workAroundTransparencyIssueInFirefox(htmlImage, function (adaptedHtmlImage) {
                if (referenceImage) {
                    isEqual = imagediff.equal(adaptedHtmlImage, referenceImage);
                    textualStatus = isEqual ? "passed" : "failed";
                } else {
                    textualStatus = "referenceMissing";
                }

                reportComparison({
                        status: textualStatus,
                        pageUrl: pageUrl,
                        htmlImage: htmlImage,
                        referenceImage: referenceImage,
                        renderErrors: renderErrors,
                        viewportWidth: pageWidth,
                        viewportHeight: pageHeight
                    },
                    function () {
                        if (callback) {
                            callback(textualStatus);
                        }
                    }
                );
            });
        }, function () {
            var textualStatus = "error";

            reportComparison({
                    status: textualStatus,
                    pageUrl: pageUrl
                },
                function () {
                    if (callback) {
                        callback(textualStatus);
                    }
                }
            );
        });
    };

    module.compare = function (testCase, callback) {
        storage.readReferenceImage(testCase.url, function (referenceImage, viewport) {
            loadPageAndReportResult(testCase.url, viewport.width, viewport.height, referenceImage, callback);
        }, function () {
            loadPageAndReportResult(testCase.url, 800, 100, null, callback);
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
                module.compare(testCase, function (status) {
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
