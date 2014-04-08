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

    var doRenderHtml = function (parameters, successCallback, errorCallback) {
        // Execute render jobs one after another to stabilise rendering (especially JS execution).
        // Also provides a more fluid response. Performance seems not to be affected.
        module.util.queue.execute(function (doneSignal) {
            var drawOptions = {
                    cache: 'repeated',
                    cacheBucket: cache,
                    width: parameters.width,
                    height: parameters.height,
                    executeJs: true,
                    executeJsTimeout: 50,
                    baseUrl: parameters.baseUrl
                };
            if (parameters.hover) {
                drawOptions.hover = parameters.hover;
            }

            rasterizeHTML.drawHTML(parameters.html, drawOptions, function (image, errors) {
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

    module.renderer.browserRenderer = function (parameters, successCallback, errorCallback) {
        var url = parameters.url;
        if (parameters.proxyUrl) {
            url = parameters.proxyUrl + "/inline?url=" + parameters.url;
        }
        module.util.ajax(url, function (content) {
            module.util.getImageForBinaryContent(content, function (image) {
                if (image) {
                    successCallback(image, []);
                } else {
                    doRenderHtml({
                        baseUrl: url,
                        html: content,
                        width: parameters.width,
                        height: parameters.height,
                        hover: parameters.hover
                    }, function (image, renderErrors) {
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
