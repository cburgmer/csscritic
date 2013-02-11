window.csscritic = (function (module, webpage) {

    var reportComparison = function (result, basePath, callback) {
        var imagesToWrite = [];

        if (result.status !== "error") {
            imagesToWrite.push({
                imageUrl: result.pageImage.src,
                width: result.pageImage.width,
                height: result.pageImage.height,
                target: basePath + getTargetBaseName(result.pageUrl) + ".png"
            });
        }
        if (result.status === "failed") {
            imagesToWrite.push({
                imageUrl: result.referenceImage.src,
                width: result.referenceImage.width,
                height: result.referenceImage.height,
                target: basePath + getTargetBaseName(result.pageUrl) + ".reference.png"
            });
            imagesToWrite.push({
                imageUrl: getDifferenceCanvas(result.pageImage, result.referenceImage).toDataURL('image/png'),
                width: result.referenceImage.width,
                height: result.referenceImage.height,
                target: basePath + getTargetBaseName(result.pageUrl) + ".diff.png"
            });
        }

        renderUrlsToFile(imagesToWrite, function () {
            if (callback) {
                callback();
            }
        });
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
        var page = webpage.create();

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
            }
        };
    };

    return module;
}(window.csscritic || {}, require("webpage")));
