csscriticLib.regression = function (renderer, storage, util, imagediff) {
    "use strict";

    var module = {};


    var workAroundFirefoxResourcesSporadicallyMissing = function (htmlImage, referenceImage) {
        if (referenceImage) {
            // This does nothing meaningful for us, but seems to trigger Firefox to load any missing resources.
            imagediff.diff(htmlImage, referenceImage);
        }
    };

    var workAroundBrowserIssues = function (pageImage, referenceImage) {
        workAroundFirefoxResourcesSporadicallyMissing(pageImage, referenceImage);

        return util.workAroundTransparencyIssueInFirefox(pageImage);
    };

    var compareRenderingAndReference = function (pageImage, referenceImage) {
        var isEqual;

        return workAroundBrowserIssues(pageImage, referenceImage).then(function (adaptedHtmlImage) {
            if (referenceImage) {
                isEqual = imagediff.equal(adaptedHtmlImage, referenceImage);
                return isEqual ? "passed" : "failed";
            } else {
                return "referenceMissing";
            }
        });
    };

    var loadPageAndCompare = function (testCase, viewport, referenceImage) {
        return renderer.render({
            url: testCase.url,
            hover: testCase.hover,
            active: testCase.active,
            width: viewport.width,
            height: viewport.height
        }).then(function (renderResult) {
            return compareRenderingAndReference(renderResult.image, referenceImage).then(function (textualStatus) {
                return {
                    status: textualStatus,
                    pageImage: renderResult.image,
                    referenceImage: referenceImage,
                    renderErrors: renderResult.errors,
                    viewport: util.clone(viewport)
                };
            });
        }, function () {
            return {status: "error"};
        }).then(function (comparison) {
            comparison.testCase = testCase;
            return comparison;
        });
    };

    var readReferenceImageIfAny = function (testCase) {
        var defaultViewport = {width: 800, height: 100};

        return storage.readReferenceImage(testCase).then(null, function () {
            return {
                viewport: defaultViewport,
                image: undefined
            };
        });
    };

    module.compare = function (testCase) {
        return readReferenceImageIfAny(testCase)
            .then(function (referenceImageRecord) {
                return loadPageAndCompare(testCase, referenceImageRecord.viewport, referenceImageRecord.image);
            });
    };

    return module;
};
