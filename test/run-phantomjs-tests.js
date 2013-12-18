var port = 8000;
window.localserver = "http://localhost:" + port;

function loadJasmine() {
    phantom.injectJs("./bower_components/jasmine/lib/jasmine-core/jasmine.js");
    phantom.injectJs("./bower_components/jasmine/src/console/ConsoleReporter.js");
}

function loadCode() {
    phantom.injectJs("./test/helpers.js");

    phantom.injectJs("./bower_components/js-imagediff/imagediff.js");
    phantom.injectJs("./src/utils.js");
    phantom.injectJs("./src/phantomjsrenderer.js");
    phantom.injectJs("./src/htmlfilereporter.js");
    phantom.injectJs("./src/filestorage.js");
    phantom.injectJs("./src/csscritic.js");
}

function loadTests() {
    phantom.injectJs("./specsShared/storagePluginSpecs.js");

    phantom.injectJs("./specsPhantom/FileStorageSpec.js");
    phantom.injectJs("./specsPhantom/PhantomJSRendererSpec.js");
    phantom.injectJs("./specsPhantom/HtmlFileReporterSpec.js");
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

function runnerFinishListenerReporter() {
    return {
        reportRunnerResults: function (suite) {
            var results = suite.results(),
                failed = results.totalCount - results.passedCount;

            setTimeout(function () {
                phantom.exit(failed);
            }, 10);
        }
    };
}

function startJasmine() {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.addReporter(new jasmine.ConsoleReporter(function(msg) {
        var stdout = require("system").stdout;
        stdout.write(msg);
    }));
    jasmineEnv.addReporter(runnerFinishListenerReporter());

    jasmineEnv.updateInterval = 1000;
    jasmineEnv.execute();
}


loadJasmine();
loadCode();

window.csscriticTestPath = 'test/';

loadTests();

startWebserver();

startJasmine();

