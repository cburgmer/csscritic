csscritic.BasicHTMLReporter = function () {
    var module = {};

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
            reportBody = window.document.getElementById(reporterId);

        if (reportBody === null) {
            reportBody = window.document.createElement("div");
            reportBody.id = reporterId;

            window.document.getElementsByTagName("body")[0].appendChild(reportBody);
        }

        return reportBody;
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

    var getOrCreateDivWithId = function (id) {
        var tooltip = window.document.getElementById(id);

        if (!tooltip) {
            tooltip = window.document.createElement("div");
            tooltip.id = id;
            tooltip.style.display = "none";
            tooltip.style.position = "absolute";
            window.document.getElementsByTagName("body")[0].appendChild(tooltip);
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
        } else if (result.status === "passed") {
            addMouseOverHandlerForPreview(entry, result);
        }

        return entry;
    };

    module.reportComparison = function (result) {
        var node = createEntry(result),
            reportBody = getOrCreateBody();

        reportBody.appendChild(node);
    };

    return module;
};
