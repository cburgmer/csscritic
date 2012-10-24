window.csscritic = (function () {
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
        rasterizeHTML.drawURL(pageUrl, htmlCanvas, {cache: false}, function (c, errors) {
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

    var drawUrlToCanvas = function (url, canvas, callback) {
        var context = canvas.getContext("2d");

        module.util.getImageForUrl(url, function (image) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0);

            callback();
        });
    };

    module.util.workAroundTransparencyIssueInFirefox = function (canvas, callback) {
        // Work around bug https://bugzilla.mozilla.org/show_bug.cgi?id=790468 where the content of a canvas
        //   drawn to another one will be slightly different if transparency is involved.
        //   Solution: re-draw the canvas to itself, thus reaching a stable output
        var newCanvas = window.document.createElement("canvas");
        newCanvas.height = canvas.height;
        newCanvas.width  = canvas.width;

        drawUrlToCanvas(canvas.toDataURL("image/png"), newCanvas, function () {
            callback(newCanvas);
        });
    };

    module.util.getCanvasForPageUrl = function (pageUrl, width, height, successCallback, errorCallback) {
        var htmlCanvas = window.document.createElement("canvas");

        module.util.drawPageUrl(pageUrl, htmlCanvas, width, height, function (erroneousResourceUrls) {
            successCallback(htmlCanvas, erroneousResourceUrls);
        }, errorCallback);
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

    var loadPageAndReportResult = function (pageUrl, pageWidth, pageHeight, referenceImage, callback) {

        module.util.getCanvasForPageUrl(pageUrl, pageWidth, pageHeight, function (htmlCanvas, erroneousUrls) {
            var isEqual, textualStatus;

            module.util.workAroundTransparencyIssueInFirefox(htmlCanvas, function (adaptedHtmlCanvas) {
                if (referenceImage) {
                    isEqual = imagediff.equal(adaptedHtmlCanvas, referenceImage);
                    textualStatus = isEqual ? "passed" : "failed";
                } else {
                    textualStatus = "referenceMissing";
                }

                if (callback) {
                    callback(textualStatus);
                }

                report(textualStatus, pageUrl, htmlCanvas, referenceImage, erroneousUrls);
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
}());
