// PhantomJS regression runner for csscritic
// In the current stage pages will be auto-accepted in the default size. Failing tests need to be dealt with manually.

var system = require("system");

phantom.injectJs("lib/imagediff.js");
phantom.injectJs("components/rasterizeHTML.js/lib/URI.js");
phantom.injectJs("components/rasterizeHTML.js/lib/cssParser.js");
phantom.injectJs("components/rasterizeHTML.js/rasterizeHTML.js");
phantom.injectJs("phantomjsrenderer.js");
phantom.injectJs("autoacceptingreporter.js");
phantom.injectJs("csscritic.js");

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

var main = function () {
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

main();
