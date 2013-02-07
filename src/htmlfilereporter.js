window.csscritic = (function (module) {

    var reportComparison = function (result, basePath, callback) {
        var imagesToWrite = [];

        imagesToWrite.push({
            image: result.pageImage,
            target: basePath + getTargetBaseName(result.pageUrl) + ".png"
        });
        if (result.status === "failed") {
            imagesToWrite.push({
                image: result.referenceImage,
                target: basePath + getTargetBaseName(result.pageUrl) + ".reference.png"
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

        entrys.forEach(function (entry) {
            renderUrlToFile(entry.image.src, entry.target, entry.image.width, entry.image.height, function () {
                urlsWritten += 1;

                if (entrys.length === urlsWritten) {
                    callback();
                }
            });
        });
    };

    var renderUrlToFile = function (url, filePath, width, height, callback) {
        var page = require("webpage").create();

        page.viewportSize = {
            width: width,
            height: height
        };

        page.open(url, function () {
            page.render(filePath);

            callback();
        });
    };

    module.HtmlFileReporter = function (basePath) {
        basePath = basePath || "./";

        return {
            reportComparison: function (result, callback) {
                return reportComparison(result, basePath, callback);
            }
        };
    };

    return module;
}(window.csscritic || {}));
