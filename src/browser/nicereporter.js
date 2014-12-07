csscriticLib.niceReporter = function () {
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

    var addTickToProgressBar = function () {
        var progressBar = theProgressBar();

        var tick = elementFor('<li></li>');
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

    var addComparison = function (testCase) {
        var container = getOrCreateContainer(),
            comparison = elementFor(template('<section class="comparison"><h3 class="title">{{url}}</h3></section>', {
                url: testCase.url
            }));

        container.appendChild(comparison);
    };

    module.NiceReporter = function () {
        return {
            reportComparisonStarting: function (comparison) {
                addTickToProgressBar();
                addComparison(comparison.testCase);
            },
            reportComparison: function (comparison) {
                markTickDone(comparison.status);
            },
            reportTestSuite: function (result) {
                colorProgressBar(result.success);
            }
        };
    };

    return module;
};
