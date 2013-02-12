window.csscritic = (function (module, renderer, storage, window, imagediff) {
    var reporters, testCases;

    var clear = function () {
        reporters = [];
        testCases = [];
    };

    clear();

    module.util = {};

    module.util.getDataURIForImage = function (image) {
        var canvas = window.document.createElement("canvas"),
            context = canvas.getContext("2d");

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0);

        return canvas.toDataURL("image/png");
    };

    module.util.getImageForUrl = function (url, successCallback, errorCallback) {
        var image = new window.Image();

        image.onload = function () {
            successCallback(image);
        };
        if (errorCallback) {
            image.onerror = errorCallback;
        }
        image.src = url;
    };

    module.util.workAroundTransparencyIssueInFirefox = function (image, callback) {
        // Work around bug https://bugzilla.mozilla.org/show_bug.cgi?id=790468 where the content of a canvas
        //   drawn to another one will be slightly different if transparency is involved.
        // Here the reference image has been drawn to a canvas once (to serialize it to localStorage), while the
        //   image of the newly rendered page hasn't.  Solution: apply the same transformation to the second image, too.
        var dataUri;
        try {
            dataUri = module.util.getDataURIForImage(image);
        } catch (e) {
            // Fallback for Chrome & Safari
            callback(image);
            return;
        }

        module.util.getImageForUrl(dataUri, function (newImage) {
            callback(newImage);
        });
    };

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

    var report = function (status, pageUrl, pageImage, referenceImage, erroneousUrls, callback) {
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

                report(textualStatus, pageUrl, htmlImage, referenceImage, erroneousUrls, function () {
                    if (callback) {
                        callback(textualStatus);
                    }
                });
            });
        }, function () {
            var textualStatus = "error";

            report(textualStatus, pageUrl, null, null, null, function () {
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
        var testCaseCount = testCases.length,
            finishedCount = 0,
            passed = true;

        testCases.forEach(function (pageUrl) {
            module.compare(pageUrl, function (status) {
                passed &= status === "passed";

                finishedCount += 1;
                if (finishedCount === testCaseCount) {
                    callback(passed);
                }
            });
        });
    };

    module.clear = clear;

    return module;
}(window.csscritic || {}, window.csscritic.renderer, window.csscritic.storage, window, imagediff));
