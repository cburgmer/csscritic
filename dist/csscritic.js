/*! CSS critic - v0.1.0 - 2012-09-14
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

    var getErroneousResourceUrls = function (errors) {
        var erroneousResourceUrls = [];

        errors.forEach(function (error) {
            if (error.url) {
                erroneousResourceUrls.push(error.url);
            }
        });

        return erroneousResourceUrls;
    };

    module.util.drawPageUrl = function (pageUrl, htmlCanvas, width, height, successCallback, errorCallback) {
        htmlCanvas.width = width;
        htmlCanvas.height = height;

        htmlCanvas.getContext("2d").clearRect(0, 0, width, height);
        rasterizeHTML.drawURL(pageUrl, htmlCanvas, function (c, errors) {
            var erroneousResourceUrls = errors === undefined ? [] : getErroneousResourceUrls(errors);

            if (errors !== undefined && rasterizeHTMLDidntFindThePage(errors)) {
                if (errorCallback) {
                    errorCallback();
                }
            } else {
                if (successCallback) {
                    successCallback(erroneousResourceUrls);
                }
            }
        });
    };

    module.util.getCanvasForPageUrl = function (pageUrl, width, height, successCallback, errorCallback) {
        var htmlCanvas = window.document.createElement("canvas");

        module.util.drawPageUrl(pageUrl, htmlCanvas, width, height, function (erroneousResourceUrls) {
            successCallback(htmlCanvas, erroneousResourceUrls);
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

    module.util.storeReferenceImage = function (key, canvas) {
        var uri, dataObj;

        try {
            uri = canvas.toDataURL("image/png");
        } catch (e) {
            window.alert("An error occurred reading the canvas. Are you sure you are using Firefox?\n" + e);
            throw e;
        }
        dataObj = {
            referenceImageUri: uri
        };

        localStorage.setItem(key, JSON.stringify(dataObj));
    };

    module.util.readReferenceImage = function (key, successCallback, errorCallback) {
        var dataObjString = localStorage.getItem(key),
            dataObj;

        if (dataObjString) {
            dataObj = JSON.parse(dataObjString);

            module.util.getImageForUrl(dataObj.referenceImageUri, function (img) {
                successCallback(img);
            }, errorCallback);
        } else {
            errorCallback();
        }
    };

    var buildReportResult = function (status, pageUrl, pageCanvas, referenceImage, erroneousPageUrls) {
        var result = {
                status: status,
                pageUrl: pageUrl,
                pageCanvas: pageCanvas
            };

        if (pageCanvas) {
            result.resizePageCanvas = function (width, height, callback) {
                module.util.drawPageUrl(pageUrl, pageCanvas, width, height, callback);
            };
            result.acceptPage = function () {
                module.util.storeReferenceImage(pageUrl, pageCanvas);
            };
        }

        if (referenceImage) {
            result.referenceImage = referenceImage;
        }

        if (erroneousPageUrls && erroneousPageUrls.length) {
            result.erroneousPageUrls = erroneousPageUrls;
        }

        if (status === "failed") {
            result.differenceImageData = imagediff.diff(pageCanvas, referenceImage);
        }

        return result;
    };

    var report = function (status, pageUrl, pageCanvas, referenceImage, erroneousUrls) {
        var i, result;

        if (!reporters.length) {
            return;
        }

        result = buildReportResult(status, pageUrl, pageCanvas, referenceImage, erroneousUrls);

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

    var handlePageUrlLoadError = function (pageUrl, callback) {
        var textualStatus = "error";

        if (callback) {
            callback(textualStatus);
        }

        report(textualStatus, pageUrl, null);
    };

    module.compare = function (pageUrl, callback) {
        module.util.readReferenceImage(pageUrl, function (referenceImage) {
            module.util.getCanvasForPageUrl(pageUrl, referenceImage.width, referenceImage.height, function (htmlCanvas, erroneousUrls) {
                var isEqual = imagediff.equal(htmlCanvas, referenceImage),
                    textualStatus = isEqual ? "passed" : "failed";

                if (callback) {
                    callback(textualStatus);
                }

                report(textualStatus, pageUrl, htmlCanvas, referenceImage, erroneousUrls);
            }, function () {
                handlePageUrlLoadError(pageUrl, callback);
            });
        }, function () {
            module.util.getCanvasForPageUrl(pageUrl, 800, 600, function (htmlCanvas, erroneousUrls) {
                var textualStatus = "referenceMissing";

                if (callback) {
                    callback(textualStatus);
                }

                report(textualStatus, pageUrl, htmlCanvas, null, erroneousUrls);
            }, function () {
                handlePageUrlLoadError(pageUrl, callback);
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

    var createFinishedIndicator = function () {
        var span = window.document.createElement("span");
        span.className = "finished";
        span.style.display = "none";
        return span;
    };

    var createSaveHint = function (result) {
        var saveHint = window.document.createElement("div"),
            acceptButton = window.document.createElement("button"),
            finishedIndicator = createFinishedIndicator();

        acceptButton.onclick = function () {
            result.acceptPage();
            finishedIndicator.style.display = '';
        };
        acceptButton.textContent = "Accept the rendered page";

        saveHint.className = "saveHint warning";
        saveHint.appendChild(acceptButton);
        saveHint.appendChild(window.document.createTextNode("and save this as later reference."));
        saveHint.appendChild(finishedIndicator);
        return saveHint;
    };

    var createUpdateHint = function (result) {
        var updateHint = window.document.createElement("div"),
            acceptButton = window.document.createElement("button"),
            finishedIndicator = createFinishedIndicator();

        acceptButton.onclick = function () {
            result.acceptPage();
            finishedIndicator.style.display = '';
        };
        acceptButton.textContent = "accept the rendered page";

        updateHint.className = "updateHint warning";
        updateHint.appendChild(window.document.createTextNode("You can"));
        updateHint.appendChild(acceptButton);
        updateHint.appendChild(window.document.createTextNode("thus making it the new reference."));
        updateHint.appendChild(finishedIndicator);
        return updateHint;
    };

    var createErroneousResourceWarning = function (result) {
        var loadErrors = window.document.createElement("div"),
            ul = window.document.createElement("ul");

        loadErrors.className = "loadErrors warning";
        loadErrors.appendChild(window.document.createTextNode("Could not load the referenced resources:"));
        loadErrors.appendChild(ul);

        result.erroneousPageUrls.forEach(function (url) {
            var urlWarningEntry = window.document.createElement("li");

            urlWarningEntry.textContent = url;
            ul.appendChild(urlWarningEntry);
        });

        loadErrors.appendChild(window.document.createTextNode("Make sure the paths lie within the same origin as this document."));
        return loadErrors;
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

        if (result.erroneousPageUrls) {
            entry.appendChild(createErroneousResourceWarning(result));
        }

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
