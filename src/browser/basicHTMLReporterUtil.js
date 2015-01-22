csscriticLib.basicHTMLReporterUtil = function () {
    "use strict";

    var module = {};

    module.supportsReadingHtmlFromCanvas = function (callback) {
        var canvas = document.createElement("canvas"),
            svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><foreignObject></foreignObject></svg>',
            image = new Image();

        image.onload = function () {
            var context = canvas.getContext("2d");
            try {
                context.drawImage(image, 0, 0);
                // This will fail in Chrome & Safari
                context.getImageData(0, 0, 1, 1);
            } catch (e) {
                callback(false);
                // Firefox throws a 'NS_ERROR_NOT_AVAILABLE' if the SVG is faulty
                return false;
            }
            callback(true);
        };
        image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    };

    var canvasForImageCanvas = function (imageData) {
        var canvas = document.createElement("canvas"),
            context;

        canvas.height = imageData.height;
        canvas.width  = imageData.width;

        context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);

        return canvas;
    };

    var diffPageImages = function (imageA, imageB) {
        return imagediff.diff(imageA, imageB, {align: 'top'});
    };

    module.getDifferenceCanvas = function (imageA, imageB) {
        var differenceImageData = diffPageImages(imageA, imageB);

        return canvasForImageCanvas(differenceImageData);
    };

    var scale = function (byte) {
        var normalize = Math.log(256);

        return Math.floor(255 * Math.log(byte + 1) / normalize);
    };

    module.getHighlightedDifferenceCanvas = function (imageA, imageB) {
        var differenceImageData = diffPageImages(imageA, imageB);

        for (var i = 0; i < differenceImageData.data.length; i++) {
            if (i % 4 < 3) {
                differenceImageData.data[i] = scale(differenceImageData.data[i]);
            }
        }

        return canvasForImageCanvas(differenceImageData);
    };

    return module;
};

