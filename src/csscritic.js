csscriticLib.main = function (renderer, storage, reporting, util, imagediff) {
    "use strict";

    var module = {};

    var reporters = [],
        testCases = [];


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

                reporting.doReportComparison(reporters, {
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

            reporting.doReportComparison(reporters, {
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
        reporting.doReportComparisonStarting(reporters, testCases).then(function () {

            util.all(testCases.map(function (testCase) {
                var defer = ayepromise.defer();

                compare(testCase, function (v) {
                    defer.resolve(v);
                });

                return defer.promise;
            })).then(function (results) {
                var allPassed = results.indexOf(false) === -1;

                reporting.doReportTestSuite(reporters, allPassed).then(function () {
                    if (callback) {
                        callback(allPassed);
                    }
                });
            });
        });
    };

    return module;
};
