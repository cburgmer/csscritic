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

    var progressBarId = 'progressBar';

    var getOrCreateContainer = function () {
        var reporterId = "csscritic_nicereporter",
            reportBody = document.getElementById(reporterId);

        if (reportBody === null) {
            reportBody = elementFor(template('<div id="{{reporterId}}"><ul id="{{progressBarId}}"></ul></div>', {
                reporterId: reporterId,
                progressBarId: progressBarId
            }));

            document.getElementsByTagName("body")[0].appendChild(reportBody);
        }

        return reportBody;
    };

    // progress bar

    var theProgressBar = function () {
        var container = getOrCreateContainer();
        return container.querySelector('#' + progressBarId);
    };

    var addTickToProgressBar = function (linkTarget) {
        var progressBar = theProgressBar();

        var tick = elementFor(template('<li><a href="#{{linkTarget}}">⚫</a></li>', {
            linkTarget: linkTarget
        }));
        tick.classList.add('inprogress');
        progressBar.appendChild(tick);
    };

    var markTickDone = function (status) {
        var progressBar = theProgressBar(),
            unfinishedTick = progressBar.querySelector('.inprogress');

        unfinishedTick.classList.remove('inprogress');
        unfinishedTick.classList.add(status);
    };

    var colorProgressBar = function (successful) {
        var progressBar = theProgressBar();

        progressBar.classList.add(successful ? 'pass' : 'fail');
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

    var imageContainerClassName = 'imageContainer';

    var addComparison = function (url, key) {
        var container = getOrCreateContainer(),
            comparison = elementFor(template('<section class="comparison" id="{{id}}">' +
                                             '<h3 class="title">{{url}}</h3>' +
                                             '<div class="{{imageContainerClassName}}"></div>' +
                                             '</section>', {
                                                 url: url,
                                                 id: key,
                                                 imageContainerClassName: imageContainerClassName
                                             }));

        container.appendChild(comparison);

        return comparison;
    };

    var showComparisonWithRenderedPage = function (pageImage, comparison) {
        var imageContainer = comparison.querySelector('.' + imageContainerClassName);

        imageContainer.appendChild(pageImage);
    };

    module.NiceReporter = function () {
        var runningComparisonEntries = {};

        return {
            reportComparisonStarting: function (comparison) {
                var key = comparisonKey(comparison.testCase);
                
                addTickToProgressBar(key);
                var comparisonElement = addComparison(comparison.testCase.url, key);
                runningComparisonEntries[key] = comparisonElement;
            },
            reportComparison: function (comparison) {
                var key = comparisonKey(comparison.testCase);

                markTickDone(comparison.status);
                if (comparison.pageImage) {
                    showComparisonWithRenderedPage(comparison.pageImage, runningComparisonEntries[key]);
                }
            },
            reportTestSuite: function (result) {
                colorProgressBar(result.success);
            }
        };
    };

    return module;
};
