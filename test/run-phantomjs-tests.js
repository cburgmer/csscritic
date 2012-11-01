var port = 8000;
window.localserver = "http://localhost:" + port;

function loadJasmine() {
    phantom.injectJs("./test/lib/jasmine-1.2.0/jasmine.js");
    phantom.injectJs("./test/lib/jasmine-console.js");
}

function loadCode() {
    phantom.injectJs("./test/helpers.js");

    phantom.injectJs("./lib/imagediff.js");
    phantom.injectJs("./src/phantomjsrenderer.js");
    phantom.injectJs("./src/csscritic.js");
}

function loadTests() {
    phantom.injectJs("./PhantomJSRendererSpecForPhantom.js");
}

function startWebserver() {

    var fs = require('fs'),
        server = require('webserver').create();

    server.listen(port, function(request, response) {
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

window.csscriticTestPath = '';

var fs = require('fs');
fs.changeWorkingDirectory('./test');

loadTests();

startWebserver();

startJasmine();

