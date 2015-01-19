"use strict";

require.paths.push('../node_modules/ayepromise');

var fs = require("fs"),
    system = require("system"),
    ayepromise = require('ayepromise'),
    csscriticLoadingPage;

if (system.args.length !== 2) {
    console.log('Usage: smokeTest.js csscriticLoadingHtmlPage');
    phantom.exit(1);
}

csscriticLoadingPage = system.args[1];



var loadPageAndEvaluate = function (url, evaluateFunc) {
    var page = require('webpage').create(),
        defer = ayepromise.defer(),
        initialNavigationFired = false;

    // resolve either on navigation or on explicit callback
    page.onNavigationRequested = function (url) {
        if (!initialNavigationFired) {
            initialNavigationFired = true;
            return;
        }
        defer.resolve({
            url: url
        });
    };
    page.onCallback = function () {
        defer.resolve({
            url: page.url
        });
    };
    // Provide some inspection
    page.onConsoleMessage = function (msg) {
        console.log(msg);
    };
    page.onError = function(message) {
        console.error(message);
    };
    // Open page
    page.open(url, function (status) {
        if (status !== 'success') {
            defer.reject('Unable to load the address!');
        } else {
            page.evaluateAsync(evaluateFunc);

            // "Watchdog", exit eventually & fail if above breaks
            window.setTimeout(function () {
                defer.reject('Page did not respond in time');
            }, 2000);
        }
    });

    return defer.promise;
};

var selectASingleTestCase = function () {
    csscritic.addReporter(csscritic.NiceReporter());
    // Don't care about the examples
    csscritic.add('pageThatDoesNotExist');
    csscritic.add('yetAnotherPageThatDoesNotExist');
    csscritic.execute().then(function () {
        console.log("Selecting first comparison");
        document.querySelector('#pageThatDoesNotExist .titleLink').click();
    });
};

var assertOneComparisonHasRun = function () {
    csscritic.addReporter(csscritic.NiceReporter());
    // Don't care about the examples
    csscritic.add('pageThatDoesNotExist');
    csscritic.add('yetAnotherPageThatDoesNotExist');
    csscritic.execute().then(function () {
        var comparisonCount = document.querySelectorAll('.comparison').length;

        console.log("Found " + comparisonCount + " comparison(s)");
        if (comparisonCount === 1) {
            window.callPhantom();
        }
    });
};

var runAll = function () {
    csscritic.addReporter(csscritic.NiceReporter());
    // Don't care about the examples
    csscritic.add('pageThatDoesNotExist');
    csscritic.add('yetAnotherPageThatDoesNotExist');
    csscritic.execute().then(function () {
        console.log('Clicking "Run all"');
        document.querySelector('.runAll').click();
    });
};

var assertTwoComparisonsHaveRun = function () {
    csscritic.addReporter(csscritic.NiceReporter());
    // Don't care about the examples
    csscritic.add('pageThatDoesNotExist');
    csscritic.add('yetAnotherPageThatDoesNotExist');
    csscritic.execute().then(function () {
        var comparisonCount = document.querySelectorAll('.comparison').length;

        console.log("Found " + comparisonCount + " comparison(s)");
        if (comparisonCount === 2) {
            window.callPhantom();
        }
    });
};

loadPageAndEvaluate(fs.absolute(csscriticLoadingPage), selectASingleTestCase)
    .then(function (result) {
        return loadPageAndEvaluate(result.url, assertOneComparisonHasRun);
    })
    .then(function (result) {
        return loadPageAndEvaluate(result.url, runAll);
    })
    .then(function (result) {
        return loadPageAndEvaluate(result.url, assertTwoComparisonsHaveRun);
    })
    .then(function () {
        console.log('Smoke test successful');
        phantom.exit();
    }, function (err) {
        console.error(err);
        phantom.exit(1);
    });
