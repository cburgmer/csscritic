window.csscritic = (function (module) {

    var reportComparison = function (result, basePath) {
        var targetImageFileName = getTargetName(result.pageUrl),
            targetImagePath = basePath + targetImageFileName,
            image = result.pageImage;

        renderUrlToFile(image.src, targetImagePath, image.width, image.height);
    };

    var getTargetName = function (filePath) {
        var fileName = filePath.substr(filePath.lastIndexOf("/")+1),
            stripEnding = ".html";

        if (fileName.substr(fileName.length - stripEnding.length) === stripEnding) {
            fileName = fileName.substr(0, fileName.length - stripEnding.length);
        }
        return fileName + ".png";
    };

    var renderUrlToFile = function (url, filePath, width, height) {
        var page = require("webpage").create();

        page.viewportSize = {
            width: width,
            height: height
        };

        page.open(url, function () {
            page.render(filePath);
        });
    };

    module.HtmlFileReporter = function (basePath) {
        basePath = basePath || "./";

        return {
            reportComparison: function (result) {
                return reportComparison(result, basePath);
            }
        };
    };

    return module;
}(window.csscritic || {}));
