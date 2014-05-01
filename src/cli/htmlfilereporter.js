csscriticLib.htmlFileReporter = function () {
    "use strict";

    var module = {};

    var reportComparison = function (comparison, basePath, callback) {
        var imagesToWrite = [];

        if (comparison.status !== "error") {
            imagesToWrite.push({
                imageUrl: comparison.pageImage.src,
                width: comparison.pageImage.width,
                height: comparison.pageImage.height,
                target: basePath + getTargetBaseName(comparison.testCase.url) + ".png"
            });
        }
        if (comparison.status === "failed") {
            imagesToWrite.push({
                imageUrl: comparison.referenceImage.src,
                width: comparison.referenceImage.width,
                height: comparison.referenceImage.height,
                target: basePath + getTargetBaseName(comparison.testCase.url) + ".reference.png"
            });
            imagesToWrite.push({
                imageUrl: getDifferenceCanvas(comparison.pageImage, comparison.referenceImage).toDataURL('image/png'),
                width: comparison.referenceImage.width,
                height: comparison.referenceImage.height,
                target: basePath + getTargetBaseName(comparison.testCase.url) + ".diff.png"
            });
        }

        renderUrlsToFile(imagesToWrite, function () {
            if (callback) {
                callback();
            }
        });
    };

    var compileReport = function (results, basePath, callback) {
        var fs = require("fs"),
            content = results.success ? "Passed" : "Failed",
            document = "<html><body>" + content + "</body></html>";

        fs.write(basePath + "index.html", document, "w");
        callback();
    };

    var getTargetBaseName = function (filePath) {
        var fileName = filePath.substr(filePath.lastIndexOf("/")+1),
            stripEnding = ".html";

        if (fileName.substr(fileName.length - stripEnding.length) === stripEnding) {
            fileName = fileName.substr(0, fileName.length - stripEnding.length);
        }
        return fileName;
    };

    var renderUrlsToFile = function (entrys, callback) {
        var urlsWritten = 0;

        if (entrys.length === 0) {
            callback();
            return;
        }

        entrys.forEach(function (entry) {
            renderUrlToFile(entry.imageUrl, entry.target, entry.width, entry.height, function () {
                urlsWritten += 1;

                if (entrys.length === urlsWritten) {
                    callback();
                }
            });
        });
    };

    var renderUrlToFile = function (url, filePath, width, height, callback) {
        var webpage = require("webpage"),
            page = webpage.create();

        page.viewportSize = {
            width: width,
            height: height
        };

        page.open(url, function () {
            page.render(filePath);

            callback();
        });
    };

    var getDifferenceCanvas = function (imageA, imageB) {
        var differenceImageData = imagediff.diff(imageA, imageB),
            canvas = document.createElement("canvas"),
            context;

        canvas.height = differenceImageData.height;
        canvas.width  = differenceImageData.width;

        context = canvas.getContext("2d");
        context.putImageData(differenceImageData, 0, 0);

        return canvas;
    };

    module.HtmlFileReporter = function (basePath) {
        basePath = basePath || "./";

        if (basePath[basePath.length - 1] !== '/') {
            basePath += '/';
        }

        return {
            reportComparison: function (result, callback) {
                return reportComparison(result, basePath, callback);
            },
            report: function (results, callback) {
                return compileReport(results, basePath, callback);
            }
        };
    };

    return module;
};
