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
    page.viewportSize = {width: 400, height: 300};
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

var jumpToLastComparison = function () {
    var progressElements = document.querySelectorAll('#progressBar li a'),
        lastElement = progressElements[progressElements.length - 1];
    lastElement.click();
};

var jumpBackInHistory = function () {
    window.history.back();
};

var getWindowScrollY = function () {
    return window.scrollY;
};

var regressionTestToExecute = function (page) {
    return function () {
        return page.evaluate(function () {
            return document.querySelector('#header.fail');
        });
    };
};

var assertEquals = function (value, expectedValue, manualMsg) {
    var expectation = "Expecting " + manualMsg + " to equal '" + expectedValue + "'";
    if (value === expectedValue) {
        console.log(expectation + " ✓");
    } else {
        throw new Error(expectation + " but found '" + value +"'");
    }
};

var assertNotEquals = function (value, notExpectedValue, name) {
    var expectation = "Expecting " + name + " not to equal '" + notExpectedValue + "': '" + value + "'";
    if (value === notExpectedValue) {
        throw new Error(expectation);
    } else {
        console.log(expectation + " ✓");
    }
};


var pageUrl = 'file://' + fs.absolute(csscriticLoadingPage),
    page;

loadPage(pageUrl)
    .then(function (thePage) {
        page = thePage;

        console.log("Waiting for regression test to finish executing");
        return waitFor(regressionTestToExecute(page));
    })
    .then(function () {
        console.log("Jumping to last comparison");
        page.evaluate(jumpToLastComparison);

        return waitFor(function () {
            return page.evaluate(getWindowScrollY) > 0;
        });
    })
    .then(function () {
        var scrollY = page.evaluate(getWindowScrollY);

        assertNotEquals(scrollY, 0, "scrollY");
        assertEquals(page.url, pageUrl, "page url");
    })
    .then(function () {
        console.log("Jumping back");
        page.evaluate(jumpBackInHistory);
    })
    .then(function () {
        var scrollY = page.evaluate(getWindowScrollY);

        assertEquals(scrollY, 0, "scrollY");
        assertEquals(page.url, pageUrl, "page url");
    })
    .then(function () {
        console.log("Selecting first comparison");

        page.evaluate(selectASingleTestCase);
        return waitFor(regressionTestToExecute(page));
    })
    .then(function () {
        var comparisonCount = page.evaluate(getComparisonCount);

        assertEquals(comparisonCount, 1, "number of comparisons");
    })
    .then(function () {
        console.log('Clicking "Run all"');

        page.evaluate(runAll);
        return waitFor(regressionTestToExecute(page));
    })
    .then(function () {
        var comparisonCount = page.evaluate(getComparisonCount);

        assertEquals(comparisonCount, 2, "number of comparisons");
    })
    .then(function () {
        console.log('Smoke test successful');
        phantom.exit();
    }, function (err) {
        console.error(err);
        page.render('smokeTestError.png');
        phantom.exit(1);
    });
