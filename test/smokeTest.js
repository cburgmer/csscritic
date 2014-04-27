"use strict";

var fs = require("fs"),
    system = require("system"),
    page = require('webpage').create(),
    csscriticLoadingPage;


if (system.args.length !== 2) {
    console.log('Usage: smokeTest.js csscriticLoadingHtmlPage');
    phantom.exit(1);
}

csscriticLoadingPage = system.args[1];

page.onConsoleMessage = function (msg) {
    if (msg === 'execution done') {
        console.log('Smoke test successful');
        phantom.exit();
    } else {
        console.log(msg);
    }
};

page.open(fs.absolute(csscriticLoadingPage), function (status) {
    if (status !== 'success') {
        console.log('Unable to load the address!');
        phantom.exit(1);
    } else {
        page.evaluate(function () {
            // Integrate against the reporter
            csscritic.addReporter(csscritic.BasicHTMLReporter());
            // Don't care about the example
            csscritic.add('pageThatDoesNotExist');
            // When the callback is called, all is good
            csscritic.execute(function () {
                console.log('execution done');
            });
        });

        // "Watchdog", exit eventually & fail if above breaks
        window.setTimeout(function () {
            phantom.exit(1);
        }, 2000);
    }
});
