var port = 8000;
window.localserver = "http://localhost:" + port;

function loadJasmine() {
    phantom.injectJs("./test/lib/jasmine-1.2.0/jasmine.js");
    phantom.injectJs("./test/lib/jasmine-console.js");
}

function loadCode() {
    phantom.injectJs("./test/helpers.js");

    phantom.injectJs("./lib/imagediff.js");
    phantom.injectJs("./src/utils.js");
    phantom.injectJs("./src/phantomjsrenderer.js");
    phantom.injectJs("./src/htmlfilereporter.js");
    phantom.injectJs("./src/filestorage.js");
    phantom.injectJs("./src/csscritic.js");
}

function loadTests() {
    phantom.injectJs("./FileStorageSpecForPhantom.js");
    phantom.injectJs("./PhantomJSRendererSpecForPhantom.js");
    phantom.injectJs("./HtmlFileReporterSpecForPhantom.js");
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

function startJasmine() {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.addReporter(new jasmine.ConsoleReporter(function(msg) {
        window.console.log(msg.replace('\n', ''));
    }, function(reporter) {
        phantom.exit(reporter.results().failedCount);
    }, true));

    jasmineEnv.updateInterval = 1000;
    jasmineEnv.execute();
}


loadJasmine();
loadCode();

window.csscriticTestPath = 'test/';

loadTests();

startWebserver();

startJasmine();

