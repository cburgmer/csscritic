/* jshint evil: true */
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


var waitFor = function (truthyTest) {
    var maxPolls = 20,
        sleepDuration = 100,
        iterationCount = 0,
        defer = ayepromise.defer();

    var poll = function () {
        var successful = truthyTest();
        if (successful) {
            defer.resolve();
        } else if (iterationCount === maxPolls) {
            defer.reject();
        } else {
            iterationCount += 1;
            setTimeout(function () {
                poll();
            }, sleepDuration);
        }
    };

    setTimeout(function () {
        poll();
    }, 100);

    return defer.promise;
};

var loadPage = function (url) {
    var page = require('webpage').create(),
        defer = ayepromise.defer();

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
            defer.resolve(page);
        }
    });

    return defer.promise;
};

var selectASingleTestCase = function () {
    document.querySelector('#pageThatDoesNotExist .titleLink').click();
};

var getComparisonCount = function () {
    return document.querySelectorAll('.comparison').length;
};

var runAll = function () {
    document.querySelector('.runAll').click();
};

var regressionTestToExecute = function (page) {
    return function () {
        return page.evaluate(function () {
            return document.querySelector('#header.fail');
        });
    };
};

var assertEquals = function (value, expectedValue, manualMsg) {
    if (value === expectedValue) {
        console.log(manualMsg + ": '" + value + "' ✓");
        return;
    } else {
        throw new Error(manualMsg + ": '" + expectedValue + "' but found '" + value +"'");
    }
};


var page;

loadPage(fs.absolute(csscriticLoadingPage))
    .then(function (thePage) {
        page = thePage;

        console.log("Waiting for regression test to finish executing");
        return waitFor(regressionTestToExecute(page));
    })
    .then(function () {
        console.log("Selecting first comparison");

        page.evaluate(selectASingleTestCase);
        return waitFor(regressionTestToExecute(page));
    })
    .then(function () {
        var comparisonCount = page.evaluate(getComparisonCount);

        assertEquals(comparisonCount, 1, "Expecting amount of comparison(s)");
    })
    .then(function () {
        console.log('Clicking "Run all"');

        page.evaluate(runAll);
        return waitFor(regressionTestToExecute(page));
    })
    .then(function () {
        var comparisonCount = page.evaluate(getComparisonCount);

        assertEquals(comparisonCount, 2, "Expecting amount of comparison(s)");
    })
    .then(function () {
        console.log('Smoke test successful');
        phantom.exit();
    }, function (err) {
        console.error(err);
        phantom.exit(1);
    });
