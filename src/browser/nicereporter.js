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

    // header

    var setOutcomeOnHeader = function (successful) {
        var header = findElementFor(headerId);

        header.classList.add(successful ? 'pass' : 'fail');
    };

    // progress bar

    var addTickToProgressBar = function (linkTarget) {
        var progressBar = findElementFor(progressBarId);

        var tick = elementFor(template('<li><a href="#{{linkTarget}}">⚫</a></li>', {
            linkTarget: linkTarget
        }));
        tick.classList.add('inprogress');
        progressBar.appendChild(tick);
    };

    var markTickDone = function (status) {
        var progressBar = findElementFor(progressBarId),
            unfinishedTick = progressBar.querySelector('.inprogress');

        unfinishedTick.classList.remove('inprogress');
        unfinishedTick.classList.add(status);
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

    var changedImageContainerClassName = 'changedImageContainer',
        imageContainerClassName = 'imageContainer';

    var addComparison = function (url, key) {
        var container = getOrCreateContainer(),
            comparison = elementFor(template('<section class="comparison" id="{{id}}">' +
                                             '<h3 class="title">{{url}} <a href="{{url}}">↗</a></h3>' +
                                             '<div><div class="{{imageContainerClassName}}"></div></div>' +
                                             '<div class="{{changedImageContainerClassName}}"></div>' +
                                             '</section>', {
                                                 url: url,
                                                 id: key,
                                                 imageContainerClassName: imageContainerClassName,
                                                 changedImageContainerClassName: changedImageContainerClassName
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
        var differenceImageData = diffPageImages(imageA, imageB);

        return canvasForImageCanvas(embossChanges(differenceImageData));
    };

    var imageWrapper = function (image) {
        var wrapper = elementFor('<div class="imageWrapper"></div>');
        wrapper.appendChild(image);
        return wrapper;
    };

    var showComparisonWithDiff = function (pageImage, referenceImage, comparison) {
        var changedImageContainer = comparison.querySelector('.' + changedImageContainerClassName),
            imageContainer = comparison.querySelector('.' + imageContainerClassName);

        changedImageContainer.appendChild(imageWrapper(pageImage));
        imageContainer.appendChild(imageWrapper(referenceImage));
        imageContainer.appendChild(getDifferenceCanvas(referenceImage, pageImage));

        comparison.classList.add('failed');
    };

    var showComparisonWithRenderedPage = function (pageImage, comparison) {
        var imageContainer = comparison.querySelector('.' + imageContainerClassName);

        imageContainer.appendChild(imageWrapper(pageImage));
    };

    module.NiceReporter = function () {
        var runningComparisonEntries = {};

        return {
            reportComparisonStarting: function (comparison) {
                var key = comparisonKey(comparison.testCase);
                
                addTickToProgressBar(key);
                incrementTotalComparisonCount();
                var comparisonElement = addComparison(comparison.testCase.url, key);
                runningComparisonEntries[key] = comparisonElement;
            },
            reportComparison: function (comparison) {
                var key = comparisonKey(comparison.testCase);

                markTickDone(comparison.status);
                if (comparison.status !== 'passed') {
                    incrementTotalIssueCount();
                }
                if (comparison.status === 'failed') {
                    showComparisonWithDiff(comparison.pageImage, comparison.referenceImage, runningComparisonEntries[key]);
                } else if (comparison.pageImage) {
                    showComparisonWithRenderedPage(comparison.pageImage, runningComparisonEntries[key]);
                }
            },
            reportTestSuite: function (result) {
                setOutcomeOnHeader(result.success);
            }
        };
    };

    return module;
};
