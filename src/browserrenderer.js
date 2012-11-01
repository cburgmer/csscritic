window.csscritic = (function (module, rasterizeHTML) {
    module.renderer = module.renderer || {};

    var rasterizeHTMLDidntFindThePage = function (errors) {
        var didntFindPage = false;
        errors.forEach(function (error) {
            if (error.resourceType === "page") {
                didntFindPage = true;
            }
        });
        return didntFindPage;
    };

    var getErroneousResourceUrls = function (errors) {
        var erroneousResourceUrls = [];

        errors.forEach(function (error) {
            if (error.url) {
                erroneousResourceUrls.push(error.url);
            }
        });

        return erroneousResourceUrls;
    };

    module.renderer.browserRenderer = function (pageUrl, width, height, successCallback, errorCallback) {
        rasterizeHTML.drawURL(pageUrl, {cache: false, width: width, height: height}, function (image, errors) {
            var erroneousResourceUrls = errors === undefined ? [] : getErroneousResourceUrls(errors);

            if (errors !== undefined && rasterizeHTMLDidntFindThePage(errors)) {
                if (errorCallback) {
                    errorCallback();
                }
            } else {
                if (successCallback) {
                    successCallback(image, erroneousResourceUrls);
                }
            }
        });
    };

    module.renderer.getImageForPageUrl = module.renderer.browserRenderer;
    return module;
}(window.csscritic || {}, rasterizeHTML));
