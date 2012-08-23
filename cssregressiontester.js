// cssregressiontester
// Distributed under the MIT License
/*global window, rasterizeHTML, imagediff*/

var cssregressiontester = (function () {
    "use strict";

    var module = {};

    // TODO unit testing for util methods
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

    module.compare = function (pageUrl, referenceImageUrl, callback) {
        module.util.getImageForUrl(referenceImageUrl, function (referenceImageCanvas) {
            module.util.getCanvasForPageUrl(pageUrl, referenceImageCanvas.width, referenceImageCanvas.height, function (htmlCanvas) {
                callback(imagediff.equal(htmlCanvas, referenceImageCanvas));
            });
        });
    };

    return module;
}());
