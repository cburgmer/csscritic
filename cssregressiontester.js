// cssregressiontester
// Distributed under the MIT License
/*global window, rasterizeHTML, imagediff*/

var cssregressiontester = (function () {
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

    var report = function (passed, pageUrl, pageCanvas, referenceUrl, referenceImage) {
        var i,
            result = {
                passed: passed,
                pageUrl: pageUrl,
                pageCanvas: pageCanvas,
                referenceUrl: referenceUrl,
                referenceImage: referenceImage
            };

        if (!reporters.length) {
            return;
        }

        if (!passed) {
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
                var passed = imagediff.equal(htmlCanvas, referenceImage);

                if (callback !== undefined) {
                    callback(passed);
                }

                report(passed, pageUrl, htmlCanvas, referenceImageUrl, referenceImage);
            });
        });
    };

    return module;
}());

cssregressiontester.BasicHTMLReporter = function () {
    var module = {},
        reportBody = null;

    var createBodyOnce = function () {
        if (reportBody === null) {
            reportBody = window.document.createElement("div");
            reportBody.id = "cssregressiontester_basichtmlreporter";

            window.document.getElementsByTagName("body")[0].appendChild(reportBody);
        }
    };

    var createEntry = function (result) {
        var entry = window.document.createElement("div"),
            status = window.document.createElement("span"),
            pageUrl = window.document.createElement("span"),
            differenceCanvasContainer;

        entry.className = "comparison";

        if (result.passed) {
            entry.className += " passed";
        } else {
            entry.className += " failed";
        }

        entry.appendChild(pageUrl);
        pageUrl.className = "pageUrl";
        pageUrl.textContent = result.pageUrl;

        entry.appendChild(status);
        status.className = "status";
        if (result.passed) {
            status.textContent = "passed";
        } else {
            status.textContent = "failed";
        }

        if (!result.passed) {
            differenceCanvasContainer = window.document.createElement("div");
            differenceCanvasContainer.className = "differenceCanvas";
            differenceCanvasContainer.appendChild(cssregressiontester.util.getCanvasForImageData(result.differenceImageData));
            entry.appendChild(differenceCanvasContainer);
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
