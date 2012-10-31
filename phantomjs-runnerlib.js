window.csscritic = (function (module) {
    var system = require("system");

    module.phantomjsRunner = {};

    var runCompare = function (testDocuments, doneHandler) {
        var finishedCount = 0;

        csscritic.addReporter(csscritic.AutoAcceptingReporter());

        testDocuments.forEach(function (testDocument) {
            console.log("Testing", testDocument, "...");

            csscritic.compare(testDocument, function (status) {
                finishedCount += 1;
                console.log(status);

                if (finishedCount === testDocuments.length) {
                    doneHandler();
                }
            });
        });
    };

    module.phantomjsRunner.main = function () {
        if (system.args.length < 2) {
            console.log("CSS critic regression runner for PhantomJS");
            console.log("Usage: phantomjs-regressionrunner.js A_DOCUMENT.html [ANOTHER_DOCUMENT.html ...]");
            phantom.exit(2);
        } else {
            runCompare(system.args.slice(1), function () {
                phantom.exit(0);
            });
        }
    };

    return module;
}(window.csscritic || {}));

csscritic.phantomjsRunner.main();
