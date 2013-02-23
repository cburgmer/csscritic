/*! CSS critic - v0.1.0 - 2013-02-23
* http://www.github.com/cburgmer/csscritic
* Copyright (c) 2013 Christoph Burgmer, Copyright (c) 2012 ThoughtWorks, Inc.; Licensed MIT */

window.csscritic = (function (module) {
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

    module.util.map = function (list, func, callback) {
        var completedCount = 0,
            results = [],
            i;

        if (list.length === 0) {
            callback(results);
        }

        var callForItem = function (idx) {
            function funcFinishCallback(result) {
                completedCount += 1;

                results[idx] = result;

                if (completedCount === list.length) {
                    callback(results);
                }
            }

            func(list[idx], funcFinishCallback);
        };

        for(i = 0; i < list.length; i++) {
            callForItem(i);
        }
    };

    module.util.queue = {};

    var jobQueue = [],
        busy = false;

    var nextInQueue = function () {
        var func;
        if (jobQueue.length > 0) {
            busy = true;
            func = jobQueue.shift();
            func(nextInQueue);
        } else {
            busy = false;
        }
    };

    module.util.queue.execute = function (func) {
        jobQueue.push(func);
        if (!busy) {
            nextInQueue();
        }
    };

    module.util.queue.clear = function () {
        jobQueue = [];
        busy = false;
    };

    return module;
}(window.csscritic || {}));

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

    var doRender = function (pageUrl, width, height, successCallback, errorCallback) {
        rasterizeHTML.drawURL(pageUrl, {
                cache: false,
                width: width,
                height: height,
                executeJs: true,
                executeJsTimeout: 50
            }, function (image, errors) {
            var erroneousResourceUrls = errors === undefined ? [] : getErroneousResourceUrls(errors);

            if (errors !== undefined && rasterizeHTMLDidntFindThePage(errors)) {
                errorCallback();
            } else {
                successCallback(image, erroneousResourceUrls);
            }
        });
    };

    module.renderer.browserRenderer = function (pageUrl, width, height, successCallback, errorCallback) {
        // Execute render jobs one after another to stabilise rendering (especially JS execution).
        // Also provides a more fluid response. Performance seems not to be affected.
        module.util.queue.execute(function (doneSignal) {
            doRender(pageUrl, width, height, function (image, erroneousResourceUrls) {
                successCallback(image, erroneousResourceUrls);

                doneSignal();
            }, function () {
                if (errorCallback) {
                    errorCallback();
                }
                doneSignal();
            });
        });
    };

    module.renderer.getImageForPageUrl = module.renderer.browserRenderer;
    return module;
}(window.csscritic || {}, rasterizeHTML));

window.csscritic = (function (module, localStorage) {
    module.storage = module.storage || {};
    module.domstorage = {};

    module.domstorage.storeReferenceImage = function (key, pageImage) {
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

    module.domstorage.readReferenceImage = function (key, successCallback, errorCallback) {
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

    module.storage.storeReferenceImage = module.domstorage.storeReferenceImage;
    module.storage.readReferenceImage = module.domstorage.readReferenceImage;
    return module;
}(window.csscritic || {}, localStorage));

window.csscritic = (function (module, renderer, storage, window, imagediff) {
    var reporters, testCases;

    var clear = function () {
        reporters = [];
        testCases = [];
    };

    clear();

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
                storage.storeReferenceImage(pageUrl, result.pageImage);
            };
        }

        if (referenceImage) {
            result.referenceImage = referenceImage;
        }

        if (erroneousPageUrls && erroneousPageUrls.length) {
            result.erroneousPageUrls = erroneousPageUrls;
        }

        return result;
    };

    var reportComparisonStarting = function (testCases, callback) {
        module.util.map(testCases, function (pageUrl, finishTestCase) {
            module.util.map(reporters, function (reporter, finishReporter) {
                if (reporter.reportComparisonStarting) {
                    reporter.reportComparisonStarting({pageUrl: pageUrl}, finishReporter);
                } else {
                    finishReporter();
                }
            }, finishTestCase);
        }, callback);
    };

    var reportComparison = function (status, pageUrl, pageImage, referenceImage, erroneousUrls, callback) {
        var i, result,
            finishedReporterCount = 0,
            reporterCount = reporters.length,
            finishUp = function () {
                finishedReporterCount += 1;
                if (finishedReporterCount === reporterCount) {
                    callback();
                }
            };

        if (!reporterCount) {
            callback();
            return;
        }

        result = buildReportResult(status, pageUrl, pageImage, referenceImage, erroneousUrls);

        for (i = 0; i < reporterCount; i++) {
            reporters[i].reportComparison(result, finishUp);
        }
    };

    var reportTestSuite = function (passed, callback) {
        module.util.map(reporters, function (reporter, finish) {
            if (reporter.report) {
                reporter.report({success: passed}, finish);
            } else {
                finish();
            }
        }, callback);
    };

    module.addReporter = function (reporter) {
        reporters.push(reporter);
    };

    module.clearReporters = function () {
        reporters = [];
    };

    var workaroundFirefoxResourcesSporadicallyMissing = function (htmlImage, referenceImage) {
        if (referenceImage) {
            // This does nothing meaningful for us, but seems to trigger Firefox to load any missing resources.
            imagediff.diff(htmlImage, referenceImage);
        }
    };

    var loadPageAndReportResult = function (pageUrl, pageWidth, pageHeight, referenceImage, callback) {

        renderer.getImageForPageUrl(pageUrl, pageWidth, pageHeight, function (htmlImage, erroneousUrls) {
            var isEqual, textualStatus;

            workaroundFirefoxResourcesSporadicallyMissing(htmlImage, referenceImage);

            module.util.workAroundTransparencyIssueInFirefox(htmlImage, function (adaptedHtmlImage) {
                if (referenceImage) {
                    isEqual = imagediff.equal(adaptedHtmlImage, referenceImage);
                    textualStatus = isEqual ? "passed" : "failed";
                } else {
                    textualStatus = "referenceMissing";
                }

                reportComparison(textualStatus, pageUrl, htmlImage, referenceImage, erroneousUrls, function () {
                    if (callback) {
                        callback(textualStatus);
                    }
                });
            });
        }, function () {
            var textualStatus = "error";

            reportComparison(textualStatus, pageUrl, null, null, null, function () {
                if (callback) {
                    callback(textualStatus);
                }
            });
        });
    };

    module.compare = function (pageUrl, callback) {
        storage.readReferenceImage(pageUrl, function (referenceImage) {
            loadPageAndReportResult(pageUrl, referenceImage.width, referenceImage.height, referenceImage, callback);
        }, function () {
            loadPageAndReportResult(pageUrl, 800, 600, null, callback);
        });
    };

    module.add = function (pageUrl) {
        testCases.push(pageUrl);
    };

    module.execute = function (callback) {
        reportComparisonStarting(testCases, function () {

            module.util.map(testCases, function (pageUrl, finish) {
                module.compare(pageUrl, function (status) {
                    finish(status === "passed");
                });
            }, function (results) {
                var allPassed = results.indexOf(false) === -1;

                reportTestSuite(allPassed, function () {
                    if (callback) {
                        callback(allPassed);
                    }
                });
            });
        });
    };

    module.clear = clear;

    return module;
}(window.csscritic || {}, window.csscritic.renderer, window.csscritic.storage, window, imagediff));

window.csscritic = (function (module, document) {
    module.basicHTMLReporterUtil = {};

    var canvasForImageCanvas = function (imageData) {
        var canvas = document.createElement("canvas"),
            context;

        canvas.height = imageData.height;
        canvas.width  = imageData.width;

        context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);

        return canvas;
    };

    module.basicHTMLReporterUtil.getDifferenceCanvas = function (imageA, imageB) {
        var differenceImageData = imagediff.diff(imageA, imageB);

        return canvasForImageCanvas(differenceImageData);
    };

    var scale = function (byte) {
        var normalize = Math.log(256);

        return Math.floor(255 * Math.log(byte + 1) / normalize);
    };

    module.basicHTMLReporterUtil.getHighlightedDifferenceCanvas = function (imageA, imageB) {
        var differenceImageData = imagediff.diff(imageA, imageB);

        for (var i = 0; i < differenceImageData.data.length; i++) {
            if (i % 4 < 3) {
                differenceImageData.data[i] = scale(differenceImageData.data[i]);
            }
        }

        return canvasForImageCanvas(differenceImageData);
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
            reportBody = document.getElementById(reporterId),
            timeTaken;

        if (reportBody === null) {
            reportBody = document.createElement("div");
            reportBody.id = reporterId;

            timeTaken = document.createElement("div");
            timeTaken.className = "timeTaken";
            reportBody.appendChild(timeTaken);

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
        var differenceCanvasContainer = document.createElement("div"),
            innerDifferenceCanvasContainer = document.createElement("div"),
            differenceCanvas = module.basicHTMLReporterUtil.getDifferenceCanvas(result.pageImage, result.referenceImage),
            highlightedDifferenceCanvas = module.basicHTMLReporterUtil.getHighlightedDifferenceCanvas(result.pageImage, result.referenceImage);

        differenceCanvasContainer.className = "differenceCanvasContainer";

        innerDifferenceCanvasContainer.className = "innerDifferenceCanvasContainer";
        differenceCanvasContainer.appendChild(innerDifferenceCanvasContainer);

        differenceCanvas.className = "differenceCanvas";
        innerDifferenceCanvasContainer.appendChild(differenceCanvas);

        highlightedDifferenceCanvas.className = "highlightedDifferenceCanvas";
        innerDifferenceCanvasContainer.appendChild(highlightedDifferenceCanvas);

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

    var createPageUrl = function (comparison) {
        var pageUrl = document.createElement("a");
        pageUrl.className = "pageUrl";
        pageUrl.textContent = comparison.pageUrl;
        pageUrl.href = comparison.pageUrl;
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
            tooltip.style.top = event.pageY + 10 + "px";
            tooltip.style.left = event.pageX + 10 + "px";

            tooltip.appendChild(image);
        };

        entry.onmousemove = function (event) {
            var tooltip = getOrCreateDivWithId("csscritic_basichtmlreporter_tooltip");

            tooltip.style.top = event.pageY + 10 + "px";
            tooltip.style.left = event.pageX + 10 + "px";
        };

        entry.onmouseout = function () {
            var tooltip = getOrCreateDivWithId("csscritic_basichtmlreporter_tooltip");

            tooltip.style.display = "none";
        };
    };

    var fillEntry = function (entry, result) {
        entry.className += " " + result.status;

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
    };

    var createRunningEntry = function (comparison) {
        var entry = document.createElement("div");

        entry.className = "comparison running";

        entry.appendChild(createPageUrl(comparison));

        return entry;
    };

    var addFinalEntry = function (comparison, runningNode) {
        runningNode.className = runningNode.className.replace(" running", "");
        fillEntry(runningNode, comparison);
    };

    var padNumber = function (number, length) {
        number += '';
        while (number.length < length) {
            number = "0" + number;
        }
        return number;
    };

    var renderMilliseconds = function (time) {
        var seconds = Math.floor(time / 1000),
            milliSeconds = time % 1000;
        return seconds + '.' + padNumber(milliSeconds, 3);
    };

    module.BasicHTMLReporter = function () {
        var runningComparisonEntries = {},
            timeStarted = null;

        return {
            reportComparisonStarting: function (comparison, callback) {
                var node = createRunningEntry(comparison),
                    reportBody = getOrCreateBody();

                if (timeStarted === null) {
                    timeStarted = Date.now();
                }

                reportBody.appendChild(node);

                runningComparisonEntries[comparison.pageUrl] = node;

                if (callback) {
                    callback();
                }
            },
            reportComparison: function (comparison, callback) {
                var node = runningComparisonEntries[comparison.pageUrl];
                if (!node) {
                    // Work with old api `compare()` where no start node is created
                    node = createRunningEntry(comparison);
                    getOrCreateBody().appendChild(node);
                }

                addFinalEntry(comparison, node);

                if (callback) {
                    callback();
                }
            },
            report: function () {
                var reportBody = getOrCreateBody(),
                    timeTaken = (timeStarted === null) ? 0 : Date.now() - timeStarted,
                    timeTakenNode = reportBody.getElementsByClassName("timeTaken")[0];

                timeTakenNode.textContent = "finished in " + renderMilliseconds(timeTaken) + "s";
            }
        };
    };

    return module;
}(window.csscritic || {}, window.document));
