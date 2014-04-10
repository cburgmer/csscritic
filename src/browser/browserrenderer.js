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

    var loadImageFromContent = function (content, parameters) {
        return module.util.getImageForBinaryContent(content)
            .then(function (image) {
                return {
                    image: image,
                    errors: []
                };
            }, function () {
                // It's not an image, so it must be a HTML page
                return enqueueRenderHtmlJob({
                    html: content,
                    baseUrl: parameters.url,
                    width: parameters.width,
                    height: parameters.height,
                    hover: parameters.hover
                });
            });
    };

    module.renderer.browserRenderer = function (parameters) {
        if (parameters.proxyUrl) {
            parameters.url = parameters.proxyUrl + "/inline?url=" + parameters.url;
        }
        return module.util.ajax(parameters.url)
            .then(function (content) {
                return loadImageFromContent(content, parameters);
            });
    };

    module.renderer.getImageForPageUrl = module.renderer.browserRenderer;
    return module;
}(window.csscritic || {}, rasterizeHTML));
