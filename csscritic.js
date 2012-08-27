// csscritic
// Distributed under the MIT License
// For source and documentation visit:
// http://www.github.com/cburgmer/csscritic
/*global window, rasterizeHTML, imagediff*/

var csscritic = (function () {
    "use strict";

    var module = {},
        reporters = [];

    module.util = {};

    module.util.getCanvasForPageUrl = function (pageUrl, width, height, callback) {
        var htmlCanvas = window.document.createElement("canvas");

        // TODO better deal with with & height to check for size differences
        htmlCanvas.width = width;
        htmlCanvas.height = height;

        rasterizeHTML.drawURL(pageUrl, htmlCanvas, function () {
            callback(htmlCanvas);
        });
    };

    module.util.getImageForUrl = function (url, successCallback, errorCallback) {
        var img = new window.Image();

        img.onload = function () {
            successCallback(img);
        };
        if (errorCallback) {
            img.onerror = errorCallback;
        }
        img.src = url;
    };

    // TODO unit test for that
    module.util.getCanvasForImageData = function (imageData) {
        var canvas = window.document.createElement("canvas"),
            context;

        canvas.height = imageData.height;
        canvas.width  = imageData.width;

        context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);

        return canvas;
    };

    var report = function (status, pageUrl, pageCanvas, referenceUrl, referenceImage) {
        var i,
            result = {
                status: status,
                pageUrl: pageUrl,
                pageCanvas: pageCanvas,
                referenceUrl: referenceUrl,
                referenceImage: referenceImage
            };

        if (!reporters.length) {
            return;
        }

        if (status === "failed") {
            result.differenceImageData = imagediff.diff(pageCanvas, referenceImage);
        }

        for (i = 0; i < reporters.length; i++) {
            reporters[i].reportComparison(result);
        }
    };

    module.addReporter = function (reporter) {
        reporters.push(reporter);
    };

    module.clearReporters = function () {
        reporters = [];
    };

    module.compare = function (pageUrl, referenceImageUrl, callback) {
        var passed;

        module.util.getImageForUrl(referenceImageUrl, function (referenceImage) {
            module.util.getCanvasForPageUrl(pageUrl, referenceImage.width, referenceImage.height, function (htmlCanvas) {
                var passed = imagediff.equal(htmlCanvas, referenceImage),
                    textualStatus = passed ? "passed" : "failed";

                if (callback !== undefined) {
                    callback(textualStatus);
                }

                report(textualStatus, pageUrl, htmlCanvas, referenceImageUrl, referenceImage);
            });
        }, function () {
            module.util.getCanvasForPageUrl(pageUrl, 800, 600, function (htmlCanvas) {
                var textualStatus = "referenceMissing";

                if (callback !== undefined) {
                    callback(textualStatus);
                }

                report(textualStatus, pageUrl, htmlCanvas, referenceImageUrl);
            });
        });
    };

    return module;
}());

csscritic.BasicHTMLReporter = function () {
    var module = {},
        reportBody = null;

    var createBodyOnce = function () {
        if (reportBody === null) {
            reportBody = window.document.createElement("div");
            reportBody.id = "csscritic_basichtmlreporter";

            window.document.getElementsByTagName("body")[0].appendChild(reportBody);
        }
    };

    var createEntry = function (result) {
        var entry = window.document.createElement("div"),
            status = window.document.createElement("span"),
            pageUrl = window.document.createElement("span"),
            pageCanvasContainer, differenceCanvasContainer, saveHint;

        entry.className = "comparison " + result.status;

        entry.appendChild(pageUrl);
        pageUrl.className = "pageUrl";
        pageUrl.textContent = result.pageUrl;

        entry.appendChild(status);
        status.className = "status";
        if (result.status === "passed") {
            status.textContent = "passed";
        } else if (result.status === "failed") {
            status.textContent = "failed";
        } else if (result.status === "referenceMissing") {
            status.textContent = "missing reference";
        }

        if (result.status === "failed") {
            differenceCanvasContainer = window.document.createElement("div");
            differenceCanvasContainer.className = "differenceCanvas";
            differenceCanvasContainer.appendChild(csscritic.util.getCanvasForImageData(result.differenceImageData));
            entry.appendChild(differenceCanvasContainer);
        }

        if (result.status === "referenceMissing") {
            saveHint = window.document.createElement("div");
            saveHint.className = "saveHint warning";
            saveHint.textContent = "To create the future reference please right click on the rendered page and save it under '" + result.referenceUrl + "' relative to this document.";
            entry.appendChild(saveHint);

            pageCanvasContainer = window.document.createElement("div");
            pageCanvasContainer.className = "pageCanvas";
            pageCanvasContainer.style.width = result.pageCanvas.width + "px";
            pageCanvasContainer.style.height = result.pageCanvas.height + "px";
            pageCanvasContainer.appendChild(result.pageCanvas);
            entry.appendChild(pageCanvasContainer);
        }

        return entry;
    };

    module.reportComparison = function (result) {
        var node = createEntry(result);

        createBodyOnce();
        reportBody.appendChild(node);
    };

    return module;
};
