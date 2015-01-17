csscriticLib.niceReporter = function (util, packageVersion) {
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

    // stuff

    var headerId = 'header',
        timeTakenId = 'timeTaken',
        progressBarId = 'progressBar',
        statusTotalId = 'statusTotalCount',
        statusIssueId = 'statusIssueCount';

    var getOrCreateContainer = function () {
        var reporterId = "csscritic_nicereporter",
            reportBody = document.getElementById(reporterId);

        if (reportBody === null) {
            reportBody = elementFor(template('<div id="{{reporterId}}">' +
                                             '<header id="{{headerId}}">' +
                                             '<span class="cssCriticVersion">CSS Critic {{packageVersion}}</span>' +
                                             '<span id="{{timeTakenId}}"></span>' +
                                             '<ul id="{{progressBarId}}"></ul>' +
                                             '<div class="statusText">' +
                                             '<span id="{{statusTotalId}}">0</span> entries, ' +
                                             '<span id="{{statusIssueId}}">0</span> need some love' +
                                             '</div>' +
                                             '</header>' +
                                             '</div>', {
                                                 reporterId: reporterId,
                                                 headerId: headerId,
                                                 timeTakenId: timeTakenId,
                                                 progressBarId: progressBarId,
                                                 statusTotalId: statusTotalId,
                                                 statusIssueId: statusIssueId,
                                                 packageVersion: packageVersion
                                             }));

            document.getElementsByTagName("body")[0].appendChild(reportBody);
        }

        return reportBody;
    };

    var findElementFor = function (elementId) {
        var container = getOrCreateContainer();
        return container.querySelector('#' + elementId);
    };

    var escapeId = function (id) {
        return id.replace(' ', '_', 'g');
    };

    // document title

    var originalTitle;

    var updateStatusInDocumentTitle = function (totalCount, doneCount) {
        if (originalTitle === undefined) {
            originalTitle = document.title;
        }

        document.title = "(" + doneCount + "/" + totalCount + ") " + originalTitle;
    };

    // header

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

    var showTimeTaken = function (timeTakenInMillis) {
        var timeTaken = findElementFor(timeTakenId);
        timeTaken.textContent = "finished in " + renderMilliseconds(timeTakenInMillis) + "s";
    };

    var setOutcomeOnHeader = function (successful) {
        var header = findElementFor(headerId);

        header.classList.add(successful ? 'pass' : 'fail');
    };

    var showAcceptAllButtonIfNeccessary = function (acceptableEntries) {
        var header = findElementFor(headerId),
            button = elementFor('<button class="acceptAll">... accept all (I know what I\'m doing)</button>');

        if (acceptableEntries.length > 2) {
            button.onclick = function () {
                acceptableEntries.forEach(function (acceptableEntry) {
                    acceptableEntry.acceptPage();
                    acceptComparison(acceptableEntry.entry);
                });

                button.setAttribute('disabled', 'disabled');
            };

            header.appendChild(button);
        }
    };

    // progress bar

    var scrollTo = function (id) {
        var targetElement;

        if (id) {
            targetElement = document.getElementById(id);
            targetElement.scrollIntoView();
        } else {
            window.scrollTo(0, 0);
        }
    };

    var globalNavigationHandlingInstalled = false;

    var installGlobalNavigationHandling = function () {
        if (!globalNavigationHandlingInstalled) {
            globalNavigationHandlingInstalled = true;

            window.onpopstate = function (e) {
                scrollTo(e.state);
            };
        }
    };

    var installExplicitNavigationHandling = function (element) {
        installGlobalNavigationHandling();

        element.onclick = function (e) {
            var targetLink = e.target.href,
                targetId = targetLink.substr(targetLink.indexOf('#')+1);

            scrollTo(targetId);
            history.pushState(targetId, targetId);
            e.preventDefault();
        };
    };

    var addTickToProgressBar = function (linkTarget) {
        var progressBar = findElementFor(progressBarId);

        var tick = elementFor(template('<li><a href="#{{linkTarget}}" title="{{title}}"></a></li>', {
            linkTarget: escapeId(linkTarget),
            title: linkTarget
        }));
        tick.classList.add('inprogress');
        progressBar.appendChild(tick);

        // work around https://bugzilla.mozilla.org/show_bug.cgi?id=1005634
        installExplicitNavigationHandling(tick.querySelector('a'));

        return tick;
    };

    var markTickDone = function (status, tickElement) {
        tickElement.classList.remove('inprogress');
        tickElement.classList.add(status);
    };

    // status bar

    var updateStatusBar = function (totalCount, issueCount) {
        var statusTotal = findElementFor(statusTotalId),
            statusIssue = findElementFor(statusIssueId);
        statusTotal.textContent = totalCount;
        statusIssue.textContent = issueCount;
    };

    // comparisons

    var comparisonKey = function (testCase) {
        var testCaseParameters = util.excludeKey(testCase, 'url'),
            serializedParameters = util.serializeMap(testCaseParameters),
            key = testCase.url;

        if (serializedParameters) {
            return key + ',' + serializedParameters;
        }

        return key;
    };

    var runningComparisonClassName = 'running',
        imageContainerClassName = 'imageContainer',
        errorContainerClassName = 'errorText';

    var imageWrapper = function (image) {
        var wrapper = elementFor('<div class="imageWrapper"></div>');
        wrapper.appendChild(image);
        return wrapper;
    };

    var serializeValue = function (value) {
        if (typeof value === 'string') {
            return "'" + value + "'";
        }
        return value;
    };

    var testCaseParameters = function (testCase) {
        var parameters = util.excludeKey(testCase, 'url'),
            keys = Object.keys(parameters);

        if (!keys.length) {
            return '';
        }
        keys.sort();

        return '<dl class="parameters">' +
            keys.map(function (key) {
                return template('<dt>{{key}}</dt><dd>{{value}}</dd>', {
                    key: key,
                    value: serializeValue(parameters[key])
                });
            }).join('\n') +
            '</dl>';
    };

    var addComparison = function (testCase, referenceImage, key) {
        var container = getOrCreateContainer(),
            comparison = elementFor(template('<section class="comparison {{runningComparisonClassName}}" id="{{id}}">' +
                                             '<h3 class="title">' +
                                             '{{url}} ' +
                                             '<a href="{{url}}">↗</a>' +
                                             testCaseParameters(testCase) +
                                             '</h3>' +
                                             '<div class="{{errorContainerClassName}}"></div>' +
                                             '<div><div class="{{imageContainerClassName}}"></div></div>' +
                                             '</section>', {
                                                 url: testCase.url,
                                                 id: escapeId(key),
                                                 runningComparisonClassName: runningComparisonClassName,
                                                 errorContainerClassName: errorContainerClassName,
                                                 imageContainerClassName: imageContainerClassName
                                             })),
            imageContainer = comparison.querySelector('.' + imageContainerClassName);

        if (referenceImage) {
            imageContainer.appendChild(imageWrapper(referenceImage));
        }

        container.appendChild(comparison);

        return comparison;
    };

    var canvasForImageCanvas = function (imageData) {
        var canvas = document.createElement("canvas"),
            context;

        canvas.height = imageData.height;
        canvas.width  = imageData.width;

        context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);

        return canvas;
    };

    var diffPageImages = function (imageA, imageB) {
        return imagediff.diff(imageA, imageB, {align: 'top'});
    };

    var embossChanges = function (imageData) {
        var d = imageData.data,
            i;
        for (i = 0; i < d.length; i += 4) {
            if (d[i] === 0 && d[i+1] === 0 && d[i+2] === 0) {
                d[i+3] = 0;
            } else {
                d[i] = 0;
                d[i+1] = 0;
                d[i+2] = 255;
                d[i+3] = 255;
            }
        }
        return imageData;
    };

    var getDifferenceCanvas = function (imageA, imageB) {
        var differenceImageData = diffPageImages(imageA, imageB),
            canvas = canvasForImageCanvas(embossChanges(differenceImageData));

        canvas.classList.add('diff');
        return canvas;
    };

    // Use a canvas for display to work around https://bugzilla.mozilla.org/show_bug.cgi?id=986403
    var canvasForImage = function (image) {
        var canvas = document.createElement("canvas"),
            width  = image.naturalWidth,
            height = image.naturalHeight,
            context;

        canvas.width  = width;
        canvas.height = height;

        context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        // fix size in css so the tests will show something (canvas is not supported so far)
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        return canvas;
    };

    var addImageDiff = function (image, imageForDiff, container) {
        var imageContainer = container.querySelector('.' + imageContainerClassName);

        imageContainer.appendChild(getDifferenceCanvas(image, imageForDiff));
    };

    var acceptComparison = function (container) {
        var acceptButton = container.querySelector('button');
        acceptButton.setAttribute('disabled', 'disabled');
        acceptButton.textContent = "✓";
        container.classList.add('accepted');
    };

    var changedImageContainer = function (pageImage, acceptPage, container) {
        var changedImageContainerClassName = 'changedImageContainer',
            outerChangedImageContainer = elementFor(template('<div class="outerChangedImageContainer">' +
                                                             '<div class="{{changedImageContainerClassName}}"></div>' +
                                                             '<button><span>Accept</span></button>' +
                                                             '</div>', {
                                                                 changedImageContainerClassName: changedImageContainerClassName
                                                             })),
            changedImageContainer = outerChangedImageContainer.querySelector('.' + changedImageContainerClassName),
            acceptButton = outerChangedImageContainer.querySelector('button');

        changedImageContainer.appendChild(imageWrapper(pageImage));
        acceptButton.onclick = function () {
            acceptPage();
            acceptComparison(container);
        };

        return outerChangedImageContainer;
    };

    var showComparisonWithDiff = function (pageImage, referenceImage, acceptPage, container) {
        addImageDiff(referenceImage, pageImage, container);
        container.appendChild(changedImageContainer(canvasForImage(pageImage), acceptPage, container));
    };

    var showComparisonWithRenderedPage = function (pageImage, container) {
        var imageContainer = container.querySelector('.' + imageContainerClassName);

        imageContainer.innerHTML = '';
        imageContainer.appendChild(imageWrapper(canvasForImage(pageImage)));
    };

    var showComparisonWithoutReference = function (pageImage, acceptPage, container) {
        container.appendChild(changedImageContainer(canvasForImage(pageImage), acceptPage, container));
    };

    var sameOriginWarning = 'Make sure the path lies within the ' +
        '<a href="https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy">' +
        'same origin' +
        '</a> ' +
        'as this document.';

    var showComparisonWithError = function (url, container) {
        var errorMsg = elementFor(template('<span>' +
                                           'The page "{{url}}" could not be rendered. ' +
                                           sameOriginWarning +
                                           '</span>', {
                                               url: url
                                           })),
            errorContainer = container.querySelector('.' + errorContainerClassName);
        errorContainer.appendChild(errorMsg);
    };

    var showRenderErrors = function (errors, container) {
        var errorMsg = elementFor(template('<span>' +
                                           'Had the following errors rendering the page:' +
                                           '<ul></ul>' +
                                           sameOriginWarning +
                                           '</span>')),
            listElement = errorMsg.querySelector('ul'),
            errorContainer = container.querySelector('.' + errorContainerClassName);

        errors.map(function (error) {
            return elementFor(template('<li>{{msg}}</li>', {msg: error}));
        }).forEach(function (li) {
            listElement.appendChild(li);
        });

        errorContainer.appendChild(errorMsg);
    };

    var updateComparisonStatus = function (status, container) {
        container.classList.remove(runningComparisonClassName);
        container.classList.add(status);
    };

    // browser warning

    var supportsReadingHtmlFromCanvas = function (callback) {
        var canvas = document.createElement("canvas"),
            svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><foreignObject></foreignObject></svg>',
            image = new Image();

        image.onload = function () {
            var context = canvas.getContext("2d");
            try {
                context.drawImage(image, 0, 0);
                // This will fail in Chrome & Safari
                canvas.toDataURL("image/png");
            } catch (e) {
                callback(false);
                return;
            }
            callback(true);
        };
        if (!window.URL || !window.URL.createObjectURL || (navigator.userAgent.indexOf('WebKit') >= 0 && navigator.userAgent.indexOf('Chrome') <= 0)) {
            // PhantomJS & Safari
            image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        } else {
            image.src = window.URL.createObjectURL(new Blob([svg], {"type": "image/svg+xml;charset=utf-8"}));
        }
    };

    var browserIssueChecked = false;

    var showBrowserWarningIfNeeded = function () {
        if (browserIssueChecked) {
            return;
        }
        browserIssueChecked = true;

        supportsReadingHtmlFromCanvas(function (supported) {
            if (supported) {
                return;
            }

            getOrCreateContainer().appendChild(elementFor(
                '<div class="browserWarning">' +
                    'Your browser is currently not supported, ' +
                    'as it does not support reading rendered HTML from the canvas ' +
                    '(<a href="https://code.google.com/p/chromium/issues/detail?id=294129">Chrome #294129</a>, ' +
                    '<a href="https://bugs.webkit.org/show_bug.cgi?id=17352">Safari #17352</a>). How about trying Firefox?' +
                    '</div>'
            ));
        });
    };

    // the reporter

    module.NiceReporter = function () {
        var totalCount = 0,
            doneCount = 0,
            issueCount = 0,
            progressTickElements = {},
            runningComparisonEntries = {},
            acceptableComparisons = [],
            timeStarted;

        return {
            reportComparisonStarting: function (comparison) {
                totalCount += 1;
                if (!timeStarted) {
                    timeStarted = Date.now();
                }

                showBrowserWarningIfNeeded();
                updateStatusInDocumentTitle(totalCount, doneCount);
                updateStatusBar(totalCount, issueCount);

                var key = comparisonKey(comparison.testCase);

                var tickElement = addTickToProgressBar(key);
                progressTickElements[key] = tickElement;

                var comparisonElement = addComparison(comparison.testCase, comparison.referenceImage, key);
                runningComparisonEntries[key] = comparisonElement;
            },
            reportComparison: function (comparison) {
                var key = comparisonKey(comparison.testCase),
                    tickElement = progressTickElements[key],
                    entry = runningComparisonEntries[key];

                doneCount += 1;
                if (comparison.status !== 'passed') {
                    issueCount += 1;
                }

                updateStatusInDocumentTitle(totalCount, doneCount);
                updateStatusBar(totalCount, issueCount);
                markTickDone(comparison.status, tickElement);

                if (comparison.status === 'failed') {
                    showComparisonWithDiff(comparison.pageImage, comparison.referenceImage, comparison.acceptPage, entry);
                    acceptableComparisons.push(comparison);
                } else if (comparison.status === 'referenceMissing') {
                    showComparisonWithoutReference(comparison.pageImage, comparison.acceptPage, entry);
                    acceptableComparisons.push(comparison);
                } else if (comparison.status === 'passed') {
                    showComparisonWithRenderedPage(comparison.pageImage, entry);
                } else if (comparison.status === 'error') {
                    showComparisonWithError(comparison.testCase.url, entry);
                }

                if (comparison.renderErrors.length > 0) {
                    showRenderErrors(comparison.renderErrors, entry);
                }

                updateComparisonStatus(comparison.status, entry);
            },
            reportTestSuite: function (result) {
                var acceptableEntries = acceptableComparisons.map(function (comparison) {
                    var key = comparisonKey(comparison.testCase);
                    return {
                        acceptPage: comparison.acceptPage,
                        entry: runningComparisonEntries[key]
                    };
                });

                showTimeTaken(timeStarted ? Date.now() - timeStarted : 0);
                setOutcomeOnHeader(result.success);
                showAcceptAllButtonIfNeccessary(acceptableEntries);
            }
        };
    };

    return module;
};
