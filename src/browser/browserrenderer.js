window.csscritic = (function (module, rasterizeHTML) {
    module.renderer = module.renderer || {};

    var cache = {};

    var extractErrorMessages = function (errors) {
        return errors.map(function (error) {
            return error.msg;
        });
    };

    var doRenderHtml = function (parameters, successCallback, errorCallback) {
        // Execute render jobs one after another to stabilise rendering (especially JS execution).
        // Also provides a more fluid response. Performance seems not to be affected.
        module.queue.execute(function (doneSignal) {
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

            rasterizeHTML.drawHTML(parameters.html, drawOptions).then(function (result) {
                var renderErrors = extractErrorMessages(result.errors);

                successCallback(result.image, renderErrors);

                doneSignal();
            }, function () {
                errorCallback();

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
