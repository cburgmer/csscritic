window.csscritic = (function (module, rasterizeHTML) {
    module.renderer = module.renderer || {};

    var cache = {};

    var jobQueue;

    var getOrCreateJobQueue = function () {
        if (!jobQueue) {
            jobQueue = module.jobQueue();
        }
        return jobQueue;
    };

    var extractErrorMessages = function (errors) {
        return errors.map(function (error) {
            return error.msg;
        });
    };

    var doRenderHtml = function (parameters) {
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

        return rasterizeHTML.drawHTML(parameters.html, drawOptions).then(function (result) {
            var renderErrors = extractErrorMessages(result.errors);

            return {
                image: result.image,
                errors: renderErrors
            };
        });
    };

    var enqueueRenderHtmlJob = function (parameters) {
        // Execute render jobs one after another to stabilise rendering (especially JS execution).
        // Also provides a more fluid response. Performance seems not to be affected.
        return getOrCreateJobQueue().execute(function () {
            return doRenderHtml(parameters);
        });
    };

    module.renderer.browserRenderer = function (parameters, successCallback, errorCallback) {
        var url = parameters.url;
        if (parameters.proxyUrl) {
            url = parameters.proxyUrl + "/inline?url=" + parameters.url;
        }
        module.util.ajax(url).then(function (content) {
            module.util.getImageForBinaryContent(content).then(function (image) {
                successCallback(image, []);
            }, function () {
                enqueueRenderHtmlJob({
                    baseUrl: url,
                    html: content,
                    width: parameters.width,
                    height: parameters.height,
                    hover: parameters.hover
                })
                .then(function (result) {
                    successCallback(result.image, result.errors);
                },
                errorCallback);
            });
        }, errorCallback);
    };

    module.renderer.getImageForPageUrl = module.renderer.browserRenderer;
    return module;
}(window.csscritic || {}, rasterizeHTML));
