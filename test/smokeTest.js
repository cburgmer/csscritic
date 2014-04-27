"use strict";

var fs = require("fs"),
    page = require('webpage').create();

page.open(fs.absolute('test/smokeTest.html'), function (status) {
    if (status !== 'success') {
        console.log('Unable to load the address!');
        phantom.exit(1);
    } else {
        page.onConsoleMessage = function (msg) {
            if (msg === 'execution done') {
                console.log('Smoke test successful');
                phantom.exit();
            } else {
                console.log(msg);
            }
        };

        page.includeJs(fs.absolute('dist/csscritic.allinone.js'), function () {
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
        });

        // "Watchdog", exit eventually & fail if above breaks
        window.setTimeout(function () {
            phantom.exit(1);
        }, 2000);
    }
});
