csscriticLib.niceReporter = function (util) {
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
        progressBarId = 'progressBar',
        statusTotalId = 'statusTotalCount',
        statusIssueId = 'statusIssueCount';

    var getOrCreateContainer = function () {
        var reporterId = "csscritic_nicereporter",
            reportBody = document.getElementById(reporterId);

        if (reportBody === null) {
            reportBody = elementFor(template('<div id="{{reporterId}}">' +
                                             '<header id="{{headerId}}">' +
                                             '<ul id="{{progressBarId}}"></ul>' +
                                             '<div>' +
                                             '<span id="{{statusTotalId}}">0</span> entries, ' +
                                             '<span id="{{statusIssueId}}">0</span> need some love' +
                                             '</div>' +
                                             '</header>' +
                                             '</div>', {
                                                 reporterId: reporterId,
                                                 headerId: headerId,
                                                 progressBarId: progressBarId,
                                                 statusTotalId: statusTotalId,
                                                 statusIssueId: statusIssueId
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

    // header

    var setOutcomeOnHeader = function (successful) {
        var header = findElementFor(headerId);

        header.classList.add(successful ? 'pass' : 'fail');
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

        var tick = elementFor(template('<li><a href="#{{linkTarget}}">⚫</a></li>', {
            linkTarget: escapeId(linkTarget)
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

    var totalComparisonCount = 0,
        totalIssueCount = 0;

    var incrementTotalComparisonCount = function () {
        var statusTotal = findElementFor(statusTotalId);
        totalComparisonCount += 1;
        statusTotal.textContent = totalComparisonCount;
    };

    var incrementTotalIssueCount = function () {
        var statusIssue = findElementFor(statusIssueId);
        totalIssueCount += 1;
        statusIssue.textContent = totalIssueCount;
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

    var addComparison = function (url, key) {
        var container = getOrCreateContainer(),
            comparison = elementFor(template('<section class="comparison" id="{{id}}">' +
                                             '<h3 class="title">{{url}} <a href="{{url}}">↗</a></h3>' +
                                             '</section>', {
                                                 url: url,
                                                 id: escapeId(key)
                                             }));

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

    var imageWrapper = function (image) {
        var wrapper = elementFor('<div class="imageWrapper"></div>');
        wrapper.appendChild(image);
        return wrapper;
    };

    var imageContainer = function (image, imageForDiff) {
        var imageContainerClassName = 'imageContainer',
            outerImageContainer = elementFor(template('<div><div class="{{imageContainerClassName}}"></div></div>', {
                imageContainerClassName: imageContainerClassName
            })),
            imageContainer = outerImageContainer.querySelector('.' + imageContainerClassName);

        imageContainer.appendChild(imageWrapper(image));

        if (imageForDiff) {
            imageContainer.appendChild(getDifferenceCanvas(image, imageForDiff));
        }

        return outerImageContainer;
    };

    var changedImageContainer = function (pageImage, acceptPage) {
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
        acceptButton.onclick = acceptPage;

        return outerChangedImageContainer;
    };

    var showComparisonWithDiff = function (pageImage, referenceImage, acceptPage, container) {
        container.appendChild(imageContainer(referenceImage, pageImage));
        container.appendChild(changedImageContainer(canvasForImage(pageImage), acceptPage));
    };

    var showComparisonWithRenderedPage = function (pageImage, container) {
        container.appendChild(imageContainer(canvasForImage(pageImage)));
    };

    var showComparisonWithoutReference = function (pageImage, acceptPage, container) {
        container.appendChild(changedImageContainer(canvasForImage(pageImage), acceptPage));
    };

    module.NiceReporter = function () {
        var progressTickElements = {},
            runningComparisonEntries = {};

        return {
            reportComparisonStarting: function (comparison) {
                var key = comparisonKey(comparison.testCase);
                
                var tickElement = addTickToProgressBar(key);
                progressTickElements[key] = tickElement;

                incrementTotalComparisonCount();

                var comparisonElement = addComparison(comparison.testCase.url, key);
                runningComparisonEntries[key] = comparisonElement;
            },
            reportComparison: function (comparison) {
                var key = comparisonKey(comparison.testCase),
                    tickElement = progressTickElements[key],
                    entry = runningComparisonEntries[key];

                markTickDone(comparison.status, tickElement);

                if (comparison.status !== 'passed') {
                    incrementTotalIssueCount();
                }
                if (comparison.status === 'failed') {
                    showComparisonWithDiff(comparison.pageImage, comparison.referenceImage, comparison.acceptPage, entry);
                } else if (comparison.status === 'referenceMissing') {
                    showComparisonWithoutReference(comparison.pageImage, comparison.acceptPage, entry);
                } else if (comparison.status === 'passed') {
                    showComparisonWithRenderedPage(comparison.pageImage, entry);
                }

                entry.classList.add(comparison.status);
            },
            reportTestSuite: function (result) {
                setOutcomeOnHeader(result.success);
            }
        };
    };

    return module;
};
