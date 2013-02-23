window.csscritic = (function (module, renderer, storage, window, imagediff) {
    var reporters, testCases;

    var clear = function () {
        reporters = [];
        testCases = [];
    };

    clear();

    var buildReportResult = function (status, pageUrl, pageImage, referenceImage, erroneousPageUrls) {
        var result = {
                status: status,
                pageUrl: pageUrl,
                pageImage: pageImage
            };

        if (pageImage) {
            result.resizePageImage = function (width, height, callback) {
                renderer.getImageForPageUrl(pageUrl, width, height, function (image) {
                    result.pageImage = image;
                    callback(image);
                });
            };
            result.acceptPage = function () {
                storage.storeReferenceImage(pageUrl, result.pageImage);
            };
        }

        if (referenceImage) {
            result.referenceImage = referenceImage;
        }

        if (erroneousPageUrls && erroneousPageUrls.length) {
            result.erroneousPageUrls = erroneousPageUrls;
        }

        return result;
    };

    var reportComparisonStarting = function (testCases, callback) {
        module.util.map(testCases, function (pageUrl, finishTestCase) {
            module.util.map(reporters, function (reporter, finishReporter) {
                if (reporter.reportComparisonStarting) {
                    reporter.reportComparisonStarting({pageUrl: pageUrl}, finishReporter);
                } else {
                    finishReporter();
                }
            }, finishTestCase);
        }, callback);
    };

    var reportComparison = function (status, pageUrl, pageImage, referenceImage, erroneousUrls, callback) {
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

        result = buildReportResult(status, pageUrl, pageImage, referenceImage, erroneousUrls);

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

        renderer.getImageForPageUrl(pageUrl, pageWidth, pageHeight, function (htmlImage, erroneousUrls) {
            var isEqual, textualStatus;

            workaroundFirefoxResourcesSporadicallyMissing(htmlImage, referenceImage);

            module.util.workAroundTransparencyIssueInFirefox(htmlImage, function (adaptedHtmlImage) {
                if (referenceImage) {
                    isEqual = imagediff.equal(adaptedHtmlImage, referenceImage);
                    textualStatus = isEqual ? "passed" : "failed";
                } else {
                    textualStatus = "referenceMissing";
                }

                reportComparison(textualStatus, pageUrl, htmlImage, referenceImage, erroneousUrls, function () {
                    if (callback) {
                        callback(textualStatus);
                    }
                });
            });
        }, function () {
            var textualStatus = "error";

            reportComparison(textualStatus, pageUrl, null, null, null, function () {
                if (callback) {
                    callback(textualStatus);
                }
            });
        });
    };

    module.compare = function (pageUrl, callback) {
        storage.readReferenceImage(pageUrl, function (referenceImage) {
            loadPageAndReportResult(pageUrl, referenceImage.width, referenceImage.height, referenceImage, callback);
        }, function () {
            loadPageAndReportResult(pageUrl, 800, 600, null, callback);
        });
    };

    module.add = function (pageUrl) {
        testCases.push(pageUrl);
    };

    module.execute = function (callback) {
        reportComparisonStarting(testCases, function () {

            module.util.map(testCases, function (pageUrl, finish) {
                module.compare(pageUrl, function (status) {
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
}(window.csscritic || {}, window.csscritic.renderer, window.csscritic.storage, window, imagediff));
