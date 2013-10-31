window.csscritic = (function (module, rasterizeHTML) {
    module.renderer = module.renderer || {};

    var cache = {};

    var getRenderErrors = function (errors) {
        var renderErrors = [];

        errors.forEach(function (error) {
            if (error.msg) {
                renderErrors.push(error.msg);
            }
        });

        return renderErrors;
    };

    var doRenderHtml = function (url, html, width, height, successCallback, errorCallback) {
        // Execute render jobs one after another to stabilise rendering (especially JS execution).
        // Also provides a more fluid response. Performance seems not to be affected.
        module.util.queue.execute(function (doneSignal) {
            rasterizeHTML.drawHTML(html, {
                    cache: 'repeated',
                    cacheBucket: cache,
                    width: width,
                    height: height,
                    executeJs: true,
                    executeJsTimeout: 50,
                    baseUrl: url
                }, function (image, errors) {
                var renderErrors = errors === undefined ? [] : getRenderErrors(errors);

                if (! image) {
                    errorCallback();
                } else {
                    successCallback(image, renderErrors);
                }

                doneSignal();
            });
        });
    };

    module.renderer.browserRenderer = function (pageUrl, width, height, proxyUrl, successCallback, errorCallback) {
        var url = pageUrl;
        if (proxyUrl) {
            url = proxyUrl + "/inline?url=" + pageUrl;
        }
        module.util.ajax(url, function (content) {
            module.util.getImageForBinaryContent(content, function (image) {
                if (image) {
                    successCallback(image, []);
                } else {
                    doRenderHtml(url, content, width, height, function (image, renderErrors) {
                        successCallback(image, renderErrors);
                    }, function () {
                        if (errorCallback) {
                            errorCallback();
                        }
                    });
                }
            });
        }, function () {
            if (errorCallback) {
                errorCallback();
            }
        });
    };

    module.renderer.getImageForPageUrl = module.renderer.browserRenderer;
    return module;
}(window.csscritic || {}, rasterizeHTML));
