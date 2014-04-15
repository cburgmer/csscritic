/*
 * Roll-your-own PhantomJS test runner.
 *
 * All other runners out there are loading tests inside a PhantomJS page,
 * but we need to run our tests in the privileged context.
 */
var port = 8000;
window.localserver = "http://localhost:" + port;

function loadJasmine() {
    phantom.injectJs("./boot-jasmine-for-phantom.js");
}

function loadCode() {
    phantom.injectJs("./test/helpers.js");

    phantom.injectJs("./src/cli/phantomjsbind.js");
    phantom.injectJs("./node_modules/rasterizehtml/dist/rasterizeHTML.allinone.js");
    phantom.injectJs("./node_modules/jssha/src/sha.js");
    phantom.injectJs("./node_modules/imagediff/imagediff.js");
    phantom.injectJs("./src/scope.js");
    phantom.injectJs("./src/utils.js");
    phantom.injectJs("./src/cli/phantomjsrenderer.js");
    phantom.injectJs("./src/cli/terminalreporter.js");
    phantom.injectJs("./src/cli/htmlfilereporter.js");
    phantom.injectJs("./src/cli/signoffreporterutil.js");
    phantom.injectJs("./src/cli/signoffreporter.js");
    phantom.injectJs("./src/cli/filestorage.js");
    phantom.injectJs("./src/csscritic.js");
}

function loadTests() {
    phantom.injectJs("./specsShared/storagePluginSpecs.js");

    phantom.injectJs("./specsPhantom/FileStorageSpec.js");
    phantom.injectJs("./specsPhantom/PhantomJSRendererSpec.js");
    phantom.injectJs("./specsPhantom/HtmlFileReporterSpec.js");
    phantom.injectJs("./specsPhantom/TerminalReporterSpec.js");
    phantom.injectJs("./specsPhantom/SignOffReporterUtilSpec.js");
    phantom.injectJs("./specsPhantom/SignOffReporterSpec.js");

}

function startWebserver() {

    var fs = require('fs'),
        server = require('webserver').create();

    var launched = server.listen(port, function(request, response) {
        var localPath = '.' + request.url;

        if (fs.isReadable(localPath)) {
            response.statusCode = 200;
            response.write(fs.read(localPath));
        } else {
            response.statusCode = 404;
            response.write("");
        }
        response.close();
    });

    if (!launched) {
        window.console.log("Error: Unable to start internal web server on port", port);
        phantom.exit(1);
    }

}

loadJasmine();
loadCode();

window.csscriticTestPath = 'test/';

loadTests();

startWebserver();

// Provided by jasmineBootForPhantom.js
executeJasmine();

