window.csscritic = (function (module) {
    module.renderer = module.renderer || {};

    var getFileUrl = function (address) {
        var fs = require("fs");

        return address.indexOf("://") === -1 ? "file://" + fs.absolute(address) : address;
    };

    var getDataUriForBase64PNG = function (pngBase64) {
        return "data:image/png;base64," + pngBase64;
    };

    var getImageForUrl = function (url) {
        var defer = ayepromise.defer(),
            image = new window.Image();

        image.onload = function () {
            defer.resolve(image);
        };
        image.onerror = defer.reject;
        image.src = url;

        return defer.promise;
    };

    var renderPage = function (page) {
        var base64PNG, imgURI;

        base64PNG = page.renderBase64("PNG");
        imgURI = getDataUriForBase64PNG(base64PNG);

        return getImageForUrl(imgURI);
    };

    var waitFor = function (millis) {
        var defer = ayepromise.defer();
        setTimeout(defer.resolve, millis);
        return defer.promise;
    };

    var openPage = function (url, width, height) {
        var defer = ayepromise.defer(),
            page = require("webpage").create(),
            errorneousResources = [];

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

        page.open(url, function (status) {
            if (status === "success") {
                defer.resolve({
                    page: page,
                    errorneousResources: errorneousResources
                });
            } else {
                defer.reject();
            }
        });

        return defer.promise;
    };

    module.renderer.phantomjsRenderer = function (parameters, successCallback, errorCallback) {
        openPage(getFileUrl(parameters.url), parameters.width, parameters.height)
            .then(function (result) {
                return waitFor(200)
                    .then(function () {
                        return renderPage(result.page);
                    })
                    .then(function (image) {
                        return {
                            image: image,
                            errors: result.errorneousResources
                        };
                    });
            })
            .then(function (result) {
                successCallback(result.image, result.errors);
            }, errorCallback);
    };

    module.renderer.getImageForPageUrl = module.renderer.phantomjsRenderer;
    return module;
}(window.csscritic || {}));
