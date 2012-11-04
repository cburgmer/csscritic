window.csscritic = (function (module) {
    module.renderer = module.renderer || {};

    var getFileUrl = function (address) {
        var fs = require("fs");

        return address.indexOf("://") === -1 ? "file://" + fs.absolute(address) : address;
    };

    var getDataUriForBase64PNG = function (pngBase64) {
        return "data:image/png;base64," + pngBase64;
    };

    var getImageForUrl = function (url, successCallback, errorCallback) {
        var image = new window.Image();

        image.onload = function () {
            successCallback(image);
        };
        if (errorCallback) {
            image.onerror = errorCallback;
        }
        image.src = url;
    };

    var renderPage = function (page, successCallback, errorCallback) {
        var base64PNG, imgURI;

        base64PNG = page.renderBase64("PNG");
        imgURI = getDataUriForBase64PNG(base64PNG);

        getImageForUrl(imgURI, function (image) {
            successCallback(image);
        }, errorCallback);
    };

    module.renderer.phantomjsRenderer = function (pageUrl, width, height, successCallback, errorCallback) {
        var page = require("webpage").create(),
            errorneousResources = [],
            handleError = function () {
                if (errorCallback) {
                    errorCallback();
                }
            };

        page.onResourceReceived = function (response) {
            var protocol = response.url.substr(0, 7);

            if (response.stage === "end" &&
                ((protocol !== "file://" && response.status >= 400) ||
                    (protocol === "file://" && !response.headers.length))) {
                errorneousResources.push(response.url);
            }
        };

        page.viewportSize = {
            width: width,
            height: height
        };

        page.open(getFileUrl(pageUrl), function (status) {
            if (status === "success") {
                renderPage(page, function (image) {
                    successCallback(image, errorneousResources);
                }, handleError);
            } else {
                handleError();
            }
        });
    };

    module.renderer.getImageForPageUrl = module.renderer.phantomjsRenderer;
    return module;
}(window.csscritic || {}));
