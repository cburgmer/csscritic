window.csscritic = (function (module, document) {
    module.basicHTMLReporterUtil = {};

    module.basicHTMLReporterUtil.getDifferenceCanvas = function (imageA, imageB) {
        var differenceImageData = imagediff.diff(imageA, imageB),
            canvas = document.createElement("canvas"),
            context;

        canvas.height = differenceImageData.height;
        canvas.width  = differenceImageData.width;

        context = canvas.getContext("2d");
        context.putImageData(differenceImageData, 0, 0);

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
        var differenceCanvasContainer = document.createElement("div");
        differenceCanvasContainer.className = "differenceCanvasContainer";
        differenceCanvasContainer.appendChild(module.basicHTMLReporterUtil.getDifferenceCanvas(result.pageImage, result.referenceImage));
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

    var createRunningEntry = function (comparison) {
        var entry = document.createElement("div");

        entry.className = "comparison running";

        entry.appendChild(createPageUrl(comparison));

        return entry;
    };

    var addFinalEntry = function (comparison, node, runningComparisonEntries) {
        var reportBody = getOrCreateBody(),
            runningComparisonNode = runningComparisonEntries[comparison.pageUrl];

        if (runningComparisonNode) {
            reportBody.insertBefore(node, runningComparisonNode);
            reportBody.removeChild(runningComparisonNode);
        } else {
            reportBody.appendChild(node);
        }
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
                var node = createEntry(comparison);

                addFinalEntry(comparison, node, runningComparisonEntries);

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
