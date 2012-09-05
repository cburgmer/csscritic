/*! CSS critic - v0.1.0 - 2012-09-05
* http://www.github.com/cburgmer/csscritic
* Copyright (c) 2012 Christoph Burgmer; Licensed MIT */

var csscritic = (function () {
    var module = {},
        reporters = [];

    module.util = {};

    var rasterizeHTMLDidntFindThePage = function (errors) {
        var didntFindPage = false;
        errors.forEach(function (error) {
            if (error.resourceType === "page") {
                didntFindPage = true;
            }
        });
        return didntFindPage;
    };

    module.util.drawPageUrl = function (pageUrl, htmlCanvas, width, height, successCallback, errorCallback) {
        htmlCanvas.width = width;
        htmlCanvas.height = height;

        htmlCanvas.getContext("2d").clearRect(0, 0, width, height);
        rasterizeHTML.drawURL(pageUrl, htmlCanvas, function (c, errors) {
            if (errors !== undefined && rasterizeHTMLDidntFindThePage(errors)) {
                if (errorCallback) {
                    errorCallback();
                }
            } else {
                if (successCallback) {
                    successCallback();
                }
            }
        });
    };

    module.util.getCanvasForPageUrl = function (pageUrl, width, height, successCallback, errorCallback) {
        var htmlCanvas = window.document.createElement("canvas");

        module.util.drawPageUrl(pageUrl, htmlCanvas, width, height, function () {
            successCallback(htmlCanvas);
        }, errorCallback);
    };

    module.util.getImageForUrl = function (url, successCallback, errorCallback) {
        var img = new window.Image();

        img.onload = function () {
            successCallback(img);
        };
        if (errorCallback) {
            img.onerror = errorCallback;
        }
        img.src = url;
    };

    module.util.getCanvasForImageData = function (imageData) {
        var canvas = window.document.createElement("canvas"),
            context;

        canvas.height = imageData.height;
        canvas.width  = imageData.width;

        context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);

        return canvas;
    };

    var report = function (status, pageUrl, pageCanvas, referenceUrl, referenceImage) {
        var i,
            result = {
                status: status,
                pageUrl: pageUrl,
                pageCanvas: pageCanvas,
                referenceUrl: referenceUrl,
                referenceImage: referenceImage
            };

        if (!reporters.length) {
            return;
        }

        if (pageCanvas) {
            result.resizePageCanvas = function (width, height, callback) {
                module.util.drawPageUrl(pageUrl, pageCanvas, width, height, callback);
            };
        }

        if (status === "failed") {
            result.differenceImageData = imagediff.diff(pageCanvas, referenceImage);
        }

        for (i = 0; i < reporters.length; i++) {
            reporters[i].reportComparison(result);
        }
    };

    module.addReporter = function (reporter) {
        reporters.push(reporter);
    };

    module.clearReporters = function () {
        reporters = [];
    };

    module.referencePath = null;

    var getReferenceImageUrl = function (url) {
        if (module.referencePath) {
            return (/\/$/).test(module.referencePath) ? module.referencePath + url : module.referencePath + "/" + url;
        }
        return url;
    };

    var getDefaultReferenceImageUrlForPageUrl = function (pageUrl) {
        var defaultReferenceImageUrl = pageUrl;
        if (pageUrl.substr(-5) === ".html") {
            defaultReferenceImageUrl = pageUrl.substr(0, pageUrl.length - 5);
        }
        defaultReferenceImageUrl += "_reference.png";
        return defaultReferenceImageUrl;
    };

    var parseOptionalParameters = function (pageUrl, referenceImageUrl, callback) {
        var parameters = {
            pageUrl: pageUrl,
            referenceImageUrl: getDefaultReferenceImageUrlForPageUrl(pageUrl),
            callback: null
        };

        if (typeof callback === "undefined" && typeof referenceImageUrl === "function") {
            parameters.callback = referenceImageUrl;
        } else {
            if (typeof referenceImageUrl !== "undefined") {
                parameters.referenceImageUrl = referenceImageUrl;
            }

            if (typeof callback !== "undefined") {
                parameters.callback = callback;
            }
        }
        return parameters;
    };

    var handlePageUrlLoadError = function (params) {
        var textualStatus = "error";

        if (params.callback) {
            params.callback(textualStatus);
        }

        report(textualStatus, params.pageUrl, null, params.referenceImageUrl);
    };

    module.compare = function (pageUrl, referenceImageUrl, callback) {
        var params = parseOptionalParameters(pageUrl, referenceImageUrl, callback),
            prefixedImageUrl = getReferenceImageUrl(params.referenceImageUrl);

        module.util.getImageForUrl(prefixedImageUrl, function (referenceImage) {
            module.util.getCanvasForPageUrl(params.pageUrl, referenceImage.width, referenceImage.height, function (htmlCanvas) {
                var isEqual = imagediff.equal(htmlCanvas, referenceImage),
                    textualStatus = isEqual ? "passed" : "failed";

                if (params.callback) {
                    params.callback(textualStatus);
                }

                report(textualStatus, params.pageUrl, htmlCanvas, prefixedImageUrl, referenceImage);
            }, function () {
                handlePageUrlLoadError(params);
            });
        }, function () {
            module.util.getCanvasForPageUrl(params.pageUrl, 800, 600, function (htmlCanvas) {
                var textualStatus = "referenceMissing";

                if (params.callback) {
                    params.callback(textualStatus);
                }

                report(textualStatus, params.pageUrl, htmlCanvas, prefixedImageUrl);
            }, function () {
                handlePageUrlLoadError(params);
            });
        });
    };

    return module;
}());

csscritic.BasicHTMLReporter = function () {
    var module = {},
        reportBody = null;

    var registerResizeHandler = function (element, handler) {
        var width = element.style.width,
            height = element.style.height;

        element.onmouseup = function () {
            if (width !== element.style.width || height !== element.style.height) {
                width = element.style.width;
                height = element.style.height;
                handler(width, height);
            }
        };
    };

    var createBodyOnce = function () {
        if (reportBody === null) {
            reportBody = window.document.createElement("div");
            reportBody.id = "csscritic_basichtmlreporter";

            window.document.getElementsByTagName("body")[0].appendChild(reportBody);
        }
    };

    var createPageCanvasContainer = function (result, withCaption) {
        var outerPageCanvasContainer = window.document.createElement("div"),
            pageCanvasContainer = window.document.createElement("div"),
            pageCanvasInnerContainer = window.document.createElement("div"),
            caption;

        pageCanvasContainer.className = "pageCanvasContainer";
        pageCanvasContainer.style.width = result.pageCanvas.width + "px";
        pageCanvasContainer.style.height = result.pageCanvas.height + "px";

        if (withCaption) {
            caption = window.document.createElement("span");
            caption.className = "caption";
            caption.textContent = "Page";
            outerPageCanvasContainer.appendChild(caption);
        }

        pageCanvasInnerContainer.className = "innerPageCanvasContainer";
        pageCanvasInnerContainer.appendChild(result.pageCanvas);
        pageCanvasContainer.appendChild(pageCanvasInnerContainer);

        registerResizeHandler(pageCanvasContainer, function () {
            var width = parseInt(pageCanvasContainer.style.width, 10),
                height = parseInt(pageCanvasContainer.style.height, 10);
            result.resizePageCanvas(width, height);
        });

        outerPageCanvasContainer.className = "outerPageCanvasContainer";
        outerPageCanvasContainer.appendChild(pageCanvasContainer);

        return outerPageCanvasContainer;
    };

    var createReferenceImageContainer = function (result) {
        var outerReferenceImageContainer = window.document.createElement("div"),
            referenceImageContainer = window.document.createElement("div"),
            caption = window.document.createElement("span");

        referenceImageContainer.className = "referenceImageContainer";
        referenceImageContainer.appendChild(result.referenceImage);

        caption.className = "caption";
        caption.textContent = "Reference";

        outerReferenceImageContainer.className = "outerReferenceImageContainer";
        outerReferenceImageContainer.appendChild(caption);
        outerReferenceImageContainer.appendChild(referenceImageContainer);
        return outerReferenceImageContainer;
    };

    var createSaveHint = function (result) {
        var saveHint = window.document.createElement("div");
        saveHint.className = "saveHint warning";
        saveHint.textContent = "To create the future reference please right click on the rendered page and save it under '" + result.referenceUrl + "' relative to this document.";
        return saveHint;
    };

    var createUpdateHint = function (result) {
        var updateHint = window.document.createElement("div");
        updateHint.className = "updateHint warning";
        updateHint.textContent = "You can update the reference (thus overwriting the current one) by saving the rendered page under '" + result.referenceUrl + "' relative to this document.";
        return updateHint;
    };

    var createErrorMsg = function (result) {
        var errorMsg = window.document.createElement("div");
        errorMsg.className = "errorMsg warning";
        errorMsg.textContent = "The page '" + result.pageUrl + "' could not be read. Make sure the path lies within the same origin as this document.";
        return errorMsg;
    };

    var createDifferenceCanvasContainer = function (result) {
        var differenceCanvasContainer = window.document.createElement("div");
        differenceCanvasContainer.className = "differenceCanvasContainer";
        differenceCanvasContainer.appendChild(csscritic.util.getCanvasForImageData(result.differenceImageData));
        return differenceCanvasContainer;
    };

    var createStatus = function (result) {
        var status = window.document.createElement("span");
        status.className = "status";

        if (result.status === "passed") {
            status.textContent = "passed";
        } else if (result.status === "failed") {
            status.textContent = "failed";
        } else if (result.status === "referenceMissing") {
            status.textContent = "missing reference";
        } else if (result.status === "error") {
            status.textContent = "error";
        }
        return status;
    };

    var createPageUrl = function (result) {
        var pageUrl = window.document.createElement("span");
        pageUrl.className = "pageUrl";
        pageUrl.textContent = result.pageUrl;
        return pageUrl;
    };

    var createEntry = function (result) {
        var entry = window.document.createElement("div");

        entry.className = "comparison " + result.status;

        entry.appendChild(createPageUrl(result));
        entry.appendChild(createStatus(result));

        if (result.status === "failed") {
            entry.appendChild(createDifferenceCanvasContainer(result));
            entry.appendChild(createPageCanvasContainer(result, true));
            entry.appendChild(createReferenceImageContainer(result));
            entry.appendChild(createUpdateHint(result));
        } else if (result.status === "referenceMissing") {
            entry.appendChild(createSaveHint(result));
            entry.appendChild(createPageCanvasContainer(result));
        } else if (result.status === "error") {
            entry.appendChild(createErrorMsg(result));
        }

        return entry;
    };

    module.reportComparison = function (result) {
        var node = createEntry(result);

        createBodyOnce();
        reportBody.appendChild(node);
    };

    return module;
};
