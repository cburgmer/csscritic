csscriticLib.basicHTMLReporter = function (util, reporterUtil, document) {
    "use strict";

    var module = {};

    // our very own templating implementation

    var escapeValue = function (value) {
        return value.toString()
            .replace(/&/g, '&amp;')
            .replace(new RegExp('<'), '&lt;', 'g') // work around https://github.com/cburgmer/inlineresources/issues/2
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    var template = function (templateStr, values) {
        return templateStr.replace(/\{\{(\w+)\}\}/g, function (_, param) {
            var value = values[param] || '';
            return escapeValue(value);
        });
    };

    var elementFor = function (htmlString) {
        var tmp = document.createElement('body');
        tmp.insertAdjacentHTML('beforeend', htmlString);
        return tmp.firstChild;
    };

    // other stuff

    var cssPixelValue = function (pxValue) {
        return parseInt(pxValue, 10);
    };

    var registerResizeHandler = function (element, handler) {
        var width = cssPixelValue(element.style.width),
            height = cssPixelValue(element.style.height);

        element.onmouseup = function () {
            var newWidth = cssPixelValue(element.style.width),
                newHeight = cssPixelValue(element.style.height);
            if (width !== newWidth || height !== newHeight) {
                width = newWidth;
                height = newHeight;
                handler(width, height);
            }
        };
    };

    var getOrCreateBody = function () {
        var reporterId = "csscritic_basichtmlreporter",
            reportBody = document.getElementById(reporterId);

        if (reportBody === null) {
            reportBody = elementFor(template('<div id="{{reporterId}}"><div class="timeTaken"></div></div>', {
                reporterId: reporterId
            }));

            document.getElementsByTagName("body")[0].appendChild(reportBody);
        }

        return reportBody;
    };

    // content building

    var createPageCanvasContainer = function (result, withCaption) {
        var caption = '',
            outerPageImageContainer, pageImageContainer, innerPageImageContainer;

        if (withCaption) {
            caption = '<span class="caption">Page</span>';
        }

        outerPageImageContainer = elementFor(template(
            '<div class="outerPageImageContainer">' +
            caption +
            '<div class="pageImageContainer" style="width: {{width}}px; height: {{height}}px;">' +
            '<div class="innerPageImageContainer"></div>' +
            '</div>' +
            '</div>', {
            width: result.pageImage.width,
            height: result.pageImage.height
        }));

        pageImageContainer = outerPageImageContainer.querySelector('.pageImageContainer');
        innerPageImageContainer = outerPageImageContainer.querySelector('.innerPageImageContainer');

        innerPageImageContainer.appendChild(result.pageImage);

        registerResizeHandler(pageImageContainer, function (width, height) {
            var oldImage = result.pageImage;

            result.resizePageImage(width, height).then(function (updatedImage) {
                pageImageContainer.style.width = updatedImage.width + "px";
                pageImageContainer.style.height = updatedImage.height + "px";

                innerPageImageContainer.removeChild(oldImage);
                innerPageImageContainer.appendChild(updatedImage);
            });
        });

        return outerPageImageContainer;
    };

    var createReferenceImageContainer = function (result) {
        var outerReferenceImageContainer = elementFor(
                '<div class="outerReferenceImageContainer">' +
                '<span class="caption">Reference</span>' +
                '<div class="referenceImageContainer">' +
                '</div>' +
                '</div>'
            );

        var referenceImageContainer = outerReferenceImageContainer.querySelector('.referenceImageContainer');
        referenceImageContainer.appendChild(result.referenceImage);

        return outerReferenceImageContainer;
    };

    var createAcceptHint = function (result, parameters) {
        var acceptHint = elementFor(template(
                '<div class="{{className}}">' +
                '{{prefix}}' +
                '<button>{{buttonCaption}}</button>' +
                '{{postfix}}' +
                '</div>',
                parameters
            ));

        var acceptButton = acceptHint.querySelector('button');

        acceptButton.onclick = function () {
            result.acceptPage();
            acceptHint.classList.add('finished');
        };
        return acceptHint;
    };

    var createSaveHint = function (result) {
        return createAcceptHint(result, {
            className: 'saveHint',
            prefix: '',
            buttonCaption: 'Accept the rendered page',
            postfix: 'and save this as later reference.'
        });
    };

    var createUpdateHint = function (result) {
        return createAcceptHint(result, {
            className: 'updateHint',
            prefix: 'You can',
            buttonCaption: 'accept the rendered page',
            postfix: 'thus making it the new reference.'
        });
    };

    var makeUnsortedList = function (items) {
        var lis = items.map(function (value) {
            return template('<li>{{value}}</li>', {
                value: value
            });
        });

        return '<ul>' + lis.join('\n') + '</ul>';
    };

    var createErroneousResourceWarning = function (result) {
        return elementFor('<div class="loadErrors">' +
            'Had the following errors rendering the page:' +
            makeUnsortedList(result.renderErrors) +
            'Make sure that resource paths lie within the same origin as this document.' +
            '</div>'
        );
    };

    var createErrorMsg = function (comparison) {
        return elementFor(template(
            '<div class="errorMsg">' +
            "The page '{{url}}' could not be rendered. Make sure the path lies within the same origin as this document." +
            '</div>', {
            url: comparison.testCase.url
        }));
    };

    var createDifferenceCanvasContainer = function (result) {
        var differenceCanvasContainer = elementFor(
                '<div class="differenceCanvasContainer"><div class="innerDifferenceCanvasContainer"></div></div>'
            ),
            innerDifferenceCanvasContainer = differenceCanvasContainer.querySelector('.innerDifferenceCanvasContainer'),
            differenceCanvas = reporterUtil.getDifferenceCanvas(result.pageImage, result.referenceImage),
            highlightedDifferenceCanvas = reporterUtil.getHighlightedDifferenceCanvas(result.pageImage, result.referenceImage);

        differenceCanvas.className = "differenceCanvas";
        innerDifferenceCanvasContainer.appendChild(differenceCanvas);

        highlightedDifferenceCanvas.className = "highlightedDifferenceCanvas";
        innerDifferenceCanvasContainer.appendChild(highlightedDifferenceCanvas);

        return differenceCanvasContainer;
    };

    var textualStatus = {
        passed: 'passed',
        failed: 'failed',
        referenceMissing: 'missing reference',
        error: 'error'
    };

    var createStatus = function (result) {
        return elementFor(template('<span class="status">{{status}}</span>', {
            status: textualStatus[result.status]
        }));
    };

    var getOrCreateDivWithId = function (id) {
        var tooltip = document.getElementById(id);

        if (!tooltip) {
            tooltip = elementFor(template('<div id="{{id}}" style="display: none; position: absolute;"></div>', {
                id: id
            }));
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

    var fillEntry = function (entry, comparison) {
        entry.className += " " + comparison.status;

        entry.appendChild(createStatus(comparison));

        if (comparison.renderErrors && comparison.renderErrors.length) {
            entry.appendChild(createErroneousResourceWarning(comparison));
        }

        if (comparison.status === "failed") {
            entry.appendChild(createDifferenceCanvasContainer(comparison));
            entry.appendChild(createPageCanvasContainer(comparison, true));
            entry.appendChild(createReferenceImageContainer(comparison));
            entry.appendChild(createUpdateHint(comparison));
        } else if (comparison.status === "referenceMissing") {
            entry.appendChild(createSaveHint(comparison));
            entry.appendChild(createPageCanvasContainer(comparison));
        } else if (comparison.status === "error") {
            entry.appendChild(createErrorMsg(comparison));
        } else if (comparison.status === "passed") {
            addMouseOverHandlerForPreview(entry, comparison);
        }
    };

    var testCaseParameters = function (comparison) {
        var parameters = util.excludeKey(comparison.testCase, 'url'),
            keys = Object.keys(parameters);

        if (!keys.length) {
            return '';
        }
        keys.sort();

        return '<dl class="parameters">' +
            keys.map(function (key) {
                return template('<dt>{{key}}</dt><dd>{{value}}</dd>', {
                    key: key,
                    value: parameters[key]
                });
            }).join('\n') +
            '</dl>';
    };

    var createRunningEntry = function (comparison) {
        return elementFor(template(
            '<div class="comparison running">' +
            '<a href="{{url}}" class="pageUrl">{{url}}</a>' +
            testCaseParameters(comparison) +
            '</div>', {
            url: comparison.testCase.url
        }));
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

    var createTimer = function () {
        var timeStarted = Date.now();

        return {
            stop: function () {
                var timeTaken = (timeStarted === null) ? 0 : Date.now() - timeStarted;
                return timeTaken;
            }
        };
    };

    var showTimeTaken = function (timer) {
        var reportBody = getOrCreateBody(),
            timeTaken = (timer === null) ? 0 : timer.stop(),
            timeTakenNode = reportBody.getElementsByClassName("timeTaken")[0];

        timeTakenNode.textContent = "finished in " + renderMilliseconds(timeTaken) + "s";
    };

    var showBrowserWarningIfNeeded = function () {
        reporterUtil.supportsReadingHtmlFromCanvas(function (supported) {
            if (supported) {
                return;
            }

            getOrCreateBody().appendChild(elementFor(
                '<div class="browserWarning">' +
                'Your browser is currently not supported, ' +
                'as it does not support reading rendered HTML from the canvas ' +
                '(<a href="https://code.google.com/p/chromium/issues/detail?id=294129">Chrome #294129</a>, ' +
                '<a href="https://bugs.webkit.org/show_bug.cgi?id=17352">Safari #17352</a>). How about trying Firefox?' +
                '</div>'
            ));
        });
    };

    module.BasicHTMLReporter = function () {
        var runningComparisonEntries = {},
            timer = null;

        showBrowserWarningIfNeeded();

        var getOrCreateComparisonEntry = function (comparison) {
            var key = util.serializeMap(comparison.testCase),
                node;

            if (! runningComparisonEntries[key]) {
                node = createRunningEntry(comparison);
                getOrCreateBody().appendChild(node);

                runningComparisonEntries[key] = node;
            }

            return runningComparisonEntries[key];
        };

        return {
            reportComparisonStarting: function (comparison) {
                if (timer === null) {
                    timer = createTimer();
                }

                getOrCreateComparisonEntry(comparison);
            },
            reportComparison: function (comparison) {
                // Work with old api `compare()` where no start node is created
                var node = getOrCreateComparisonEntry(comparison);

                addFinalEntry(comparison, node);
            },
            reportTestSuite: function () {
                showTimeTaken(timer);
            }
        };
    };

    return module;
};
