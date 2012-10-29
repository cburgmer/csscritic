// PhantomJS regression runner for csscritic
// In the current stage pages will be auto-accepted in the default size. Failing tests need to be dealt with manually.

phantom.injectJs("lib/imagediff.js");
phantom.injectJs("components/rasterizeHTML.js/lib/URI.js");
phantom.injectJs("components/rasterizeHTML.js/lib/cssParser.js");
phantom.injectJs("components/rasterizeHTML.js/rasterizeHTML.js");
phantom.injectJs("phantomjsrenderer.js");
phantom.injectJs("autoacceptingreporter.js");
phantom.injectJs("csscritic.js");

var runCompare = function (testDocuments, doneHandler) {
    csscritic.addReporter(csscritic.AutoAcceptingReporter());

    testDocuments.forEach(function (testDocument, i) {
        console.log("Testing", testDocument, "...");

        csscritic.compare(testDocument, function (status) {
            console.log(status);

            if (i === testDocuments.length - 1) {
                doneHandler();
            }
        });
    });
};

var main = function () {
    if (phantom.args.length === 0) {
        console.log("CSS critic regression runner for PhantomJS");
        console.log("Usage: phantomjs-regressionrunner.js A_DOCUMENT.html [ANOTHER_DOCUMENT.html ...]");
        phantom.exit(2);
    } else {
        runCompare(phantom.args, function () {
            phantom.exit(0);
        });
    }
};

main();
