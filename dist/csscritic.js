/*! CSS critic - v0.1.0 - 2012-11-01
* http://www.github.com/cburgmer/csscritic
* Copyright (c) 2012 Christoph Burgmer; Licensed MIT */

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

window.csscritic = (function (module, renderer, window, imagediff) {
    var reporters = [];

    module.util = {};

    module.util.getDataURIForImage = function (image) {
        var canvas = window.document.createElement("canvas"),
            context = canvas.getContext("2d");

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0);

        return canvas.toDataURL("image/png");
    };

    module.util.getImageForUrl = function (url, successCallback, errorCallback) {
        var image = new window.Image();

        image.onload = function () {
            successCallback(image);
        };
        if (errorCallback) {
            image.onerror = errorCallback;
        }
        image.src = url;
    };

    module.util.workAroundTransparencyIssueInFirefox = function (image, callback) {
        // Work around bug https://bugzilla.mozilla.org/show_bug.cgi?id=790468 where the content of a canvas
        //   drawn to another one will be slightly different if transparency is involved.
        // Here the reference image has been drawn to a canvas once (to serialize it to localStorage), while the
        //   image of the newly rendered page hasn't.  Solution: apply the same transformation to the second image, too.
        var dataUri;
        try {
            dataUri = module.util.getDataURIForImage(image);
        } catch (e) {
            // Fallback for Chrome & Safari
            callback(image);
            return;
        }

        module.util.getImageForUrl(dataUri, function (newImage) {
            callback(newImage);
        });
    };

    module.util.storeReferenceImage = function (key, pageImage) {
        var uri, dataObj;

        try {
            uri = module.util.getDataURIForImage(pageImage);
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

    var buildReportResult = function (status, pageUrl, pageImage, referenceImage, erroneousPageUrls) {
        var result = {
                status: status,
                pageUrl: pageUrl,
                pageImage: pageImage
            };

        if (pageImage) {
            result.resizePageImage = function (width, height, callback) {
                renderer.getImageForPageUrl(pageUrl, width, height, function (image) {
                    result.pageImage = image;
                    callback(image);
                });
            };
            result.acceptPage = function () {
                module.util.storeReferenceImage(pageUrl, result.pageImage);
            };
        }

        if (referenceImage) {
            result.referenceImage = referenceImage;
        }

        if (erroneousPageUrls && erroneousPageUrls.length) {
            result.erroneousPageUrls = erroneousPageUrls;
        }

        if (status === "failed") {
            result.differenceImageData = imagediff.diff(pageImage, referenceImage);
        }

        return result;
    };

    var report = function (status, pageUrl, pageImage, referenceImage, erroneousUrls) {
        var i, result;

        if (!reporters.length) {
            return;
        }

        result = buildReportResult(status, pageUrl, pageImage, referenceImage, erroneousUrls);

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

    var loadPageAndReportResult = function (pageUrl, pageWidth, pageHeight, referenceImage, callback) {

        renderer.getImageForPageUrl(pageUrl, pageWidth, pageHeight, function (htmlImage, erroneousUrls) {
            var isEqual, textualStatus;

            module.util.workAroundTransparencyIssueInFirefox(htmlImage, function (adaptedHtmlImage) {
                if (referenceImage) {
                    isEqual = imagediff.equal(adaptedHtmlImage, referenceImage);
                    textualStatus = isEqual ? "passed" : "failed";
                } else {
                    textualStatus = "referenceMissing";
                }

                if (callback) {
                    callback(textualStatus);
                }

                report(textualStatus, pageUrl, htmlImage, referenceImage, erroneousUrls);
            });
        }, function () {
            var textualStatus = "error";

            if (callback) {
                callback(textualStatus);
            }

            report(textualStatus, pageUrl, null);
        });
    };

    module.compare = function (pageUrl, callback) {
        module.util.readReferenceImage(pageUrl, function (referenceImage) {
            loadPageAndReportResult(pageUrl, referenceImage.width, referenceImage.height, referenceImage, callback);
        }, function () {
            loadPageAndReportResult(pageUrl, 800, 600, null, callback);
        });
    };

    return module;
}(window.csscritic || {}, window.csscritic.renderer, window, imagediff));

window.csscritic = (function (module, document) {
    module.basicHTMLReporterUtil = {};

    module.basicHTMLReporterUtil.getCanvasForImageData = function (imageData) {
        var canvas = document.createElement("canvas"),
            context;

        canvas.height = imageData.height;
        canvas.width  = imageData.width;

        context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);

        return canvas;
    };

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

    var getOrCreateBody = function () {
        var reporterId = "csscritic_basichtmlreporter",
            reportBody = document.getElementById(reporterId);

        if (reportBody === null) {
            reportBody = document.createElement("div");
            reportBody.id = reporterId;

            document.getElementsByTagName("body")[0].appendChild(reportBody);
        }

        return reportBody;
    };

    var createPageCanvasContainer = function (result, withCaption) {
        var outerPageImageContainer = document.createElement("div"),
            pageImageContainer = document.createElement("div"),
            pageCanvasInnerContainer = document.createElement("div"),
            caption;

        pageImageContainer.className = "pageImageContainer";
        pageImageContainer.style.width = result.pageImage.width + "px";
        pageImageContainer.style.height = result.pageImage.height + "px";

        if (withCaption) {
            caption = document.createElement("span");
            caption.className = "caption";
            caption.textContent = "Page";
            outerPageImageContainer.appendChild(caption);
        }

        pageCanvasInnerContainer.className = "innerPageImageContainer";
        pageCanvasInnerContainer.appendChild(result.pageImage);
        pageImageContainer.appendChild(pageCanvasInnerContainer);

        registerResizeHandler(pageImageContainer, function () {
            var width = parseInt(pageImageContainer.style.width, 10),
                height = parseInt(pageImageContainer.style.height, 10),
                oldImage = result.pageImage;

            result.resizePageImage(width, height, function (updatedImage) {
                pageCanvasInnerContainer.removeChild(oldImage);
                pageCanvasInnerContainer.appendChild(updatedImage);
            });
        });

        outerPageImageContainer.className = "outerPageImageContainer";
        outerPageImageContainer.appendChild(pageImageContainer);

        return outerPageImageContainer;
    };

    var createReferenceImageContainer = function (result) {
        var outerReferenceImageContainer = document.createElement("div"),
            referenceImageContainer = document.createElement("div"),
            caption = document.createElement("span");

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
        var span = document.createElement("span");
        span.className = "finished";
        span.style.display = "none";
        return span;
    };

    var createSaveHint = function (result) {
        var saveHint = document.createElement("div"),
            acceptButton = document.createElement("button"),
            finishedIndicator = createFinishedIndicator();

        acceptButton.onclick = function () {
            result.acceptPage();
            finishedIndicator.style.display = '';
        };
        acceptButton.textContent = "Accept the rendered page";

        saveHint.className = "saveHint warning";
        saveHint.appendChild(acceptButton);
        saveHint.appendChild(document.createTextNode("and save this as later reference."));
        saveHint.appendChild(finishedIndicator);
        return saveHint;
    };

    var createUpdateHint = function (result) {
        var updateHint = document.createElement("div"),
            acceptButton = document.createElement("button"),
            finishedIndicator = createFinishedIndicator();

        acceptButton.onclick = function () {
            result.acceptPage();
            finishedIndicator.style.display = '';
        };
        acceptButton.textContent = "accept the rendered page";

        updateHint.className = "updateHint warning";
        updateHint.appendChild(document.createTextNode("You can"));
        updateHint.appendChild(acceptButton);
        updateHint.appendChild(document.createTextNode("thus making it the new reference."));
        updateHint.appendChild(finishedIndicator);
        return updateHint;
    };

    var createErroneousResourceWarning = function (result) {
        var loadErrors = document.createElement("div"),
            ul = document.createElement("ul");

        loadErrors.className = "loadErrors warning";
        loadErrors.appendChild(document.createTextNode("Could not load the referenced resources:"));
        loadErrors.appendChild(ul);

        result.erroneousPageUrls.forEach(function (url) {
            var urlWarningEntry = document.createElement("li");

            urlWarningEntry.textContent = url;
            ul.appendChild(urlWarningEntry);
        });

        loadErrors.appendChild(document.createTextNode("Make sure the paths lie within the same origin as this document."));
        return loadErrors;
    };

    var createErrorMsg = function (result) {
        var errorMsg = document.createElement("div");
        errorMsg.className = "errorMsg warning";
        errorMsg.textContent = "The page '" + result.pageUrl + "' could not be read. Make sure the path lies within the same origin as this document.";
        return errorMsg;
    };

    var createDifferenceCanvasContainer = function (result) {
        var differenceCanvasContainer = document.createElement("div");
        differenceCanvasContainer.className = "differenceCanvasContainer";
        differenceCanvasContainer.appendChild(module.basicHTMLReporterUtil.getCanvasForImageData(result.differenceImageData));
        return differenceCanvasContainer;
    };

    var createStatus = function (result) {
        var status = document.createElement("span");
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
        var pageUrl = document.createElement("a");
        pageUrl.className = "pageUrl";
        pageUrl.textContent = result.pageUrl;
        pageUrl.href = result.pageUrl;
        return pageUrl;
    };

    var getOrCreateDivWithId = function (id) {
        var tooltip = document.getElementById(id);

        if (!tooltip) {
            tooltip = document.createElement("div");
            tooltip.id = id;
            tooltip.style.display = "none";
            tooltip.style.position = "absolute";
            document.getElementsByTagName("body")[0].appendChild(tooltip);
        }

        return tooltip;
    };

    var emptyNode = function (node) {
        while (node.hasChildNodes()) {
            node.removeChild(node.lastChild);
        }
    };

    var addMouseOverHandlerForPreview = function (entry, result) {
        entry.onmouseover = function (event) {
            var tooltip = getOrCreateDivWithId("csscritic_basichtmlreporter_tooltip"),
                image = result.referenceImage;

            emptyNode(tooltip);
            tooltip.style.display = "block";
            tooltip.style.top = event.clientY + 10 + "px";
            tooltip.style.left = event.clientX + 10 + "px";

            tooltip.appendChild(image);
        };

        entry.onmouseout = function () {
            var tooltip = getOrCreateDivWithId("csscritic_basichtmlreporter_tooltip");

            tooltip.style.display = "none";
        };
    };

    var createEntry = function (result) {
        var entry = document.createElement("div");

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
        } else if (result.status === "passed") {
            addMouseOverHandlerForPreview(entry, result);
        }

        return entry;
    };

    var reportComparison = function (result) {
        var node = createEntry(result),
            reportBody = getOrCreateBody();

        reportBody.appendChild(node);
    };

    module.BasicHTMLReporter = function () {
        return {
            reportComparison: reportComparison
        };
    };

    return module;
}(window.csscritic || {}, window.document));
