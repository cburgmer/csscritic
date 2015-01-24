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



var serializeFunctions = function (funcList) {
    return '[' + funcList.map(function (f) { return '' + f; }) + ']';
};

var allOf = function (functions, arg) {

    var executeFunc = function (serializedFunctions, param) {
        // deserialize functions
        var funcList = eval(serializedFunctions);

        var workOnList = function () {
            if (funcList.length === 0) {
                return param;
            }
            var func = funcList.shift();
            var ret = func(param);

            return ret.then(function (newParam) {
                return workOnList(funcList, newParam);
            });
        };

        workOnList();
    };

    var serializedFunctions = serializeFunctions(functions);

    return {
        func: executeFunc,
        params: [serializedFunctions, arg]
    };
};

var loadPageAndEvaluate = function (url, evaluateList) {
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
        var evaluate = allOf(evaluateList);

        if (status !== 'success') {
            defer.reject('Unable to load the address!');
        } else {
            page.evaluate.apply(page, [evaluate.func].concat(evaluate.params));

            // "Watchdog", exit eventually & fail if above breaks
            window.setTimeout(function () {
                defer.reject('Page did not respond in time');
            }, 2000);
        }
    });

    return defer.promise;
};

var executeRegressionTest = function () {
    csscritic.addReporter(csscritic.NiceReporter());
    // Don't care about the examples
    csscritic.add('pageThatDoesNotExist');
    csscritic.add('yetAnotherPageThatDoesNotExist');
    return csscritic.execute();
};

var selectASingleTestCase = function () {
    console.log("Selecting first comparison");
    document.querySelector('#pageThatDoesNotExist .titleLink').click();
};

var assertOneComparisonHasRun = function () {
    var comparisonCount = document.querySelectorAll('.comparison').length;

    console.log("Found " + comparisonCount + " comparison(s)");
    if (comparisonCount === 1) {
        window.callPhantom();
    }
};

var runAll = function () {
    console.log('Clicking "Run all"');
    document.querySelector('.runAll').click();
};

var assertTwoComparisonsHaveRun = function () {
    var comparisonCount = document.querySelectorAll('.comparison').length;

    console.log("Found " + comparisonCount + " comparison(s)");
    if (comparisonCount === 2) {
        window.callPhantom();
    }
};

var reloadAnd = function () {
    var funcs = Array.prototype.slice.call(arguments, 0);

    return function (result) {
        return loadPageAndEvaluate(result.url, [executeRegressionTest].concat(funcs));
    };
};


loadPageAndEvaluate(fs.absolute(csscriticLoadingPage), [executeRegressionTest, selectASingleTestCase])
    .then(reloadAnd(assertOneComparisonHasRun))
    .then(reloadAnd(runAll))
    .then(reloadAnd(assertTwoComparisonsHaveRun))
    .then(function () {
        console.log('Smoke test successful');
        phantom.exit();
    }, function (err) {
        console.error(err);
        phantom.exit(1);
    });
