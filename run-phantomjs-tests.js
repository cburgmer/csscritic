/*global jasmine:true, csscriticTestPath:true */

phantom.injectJs("./test/lib/jasmine-1.2.0/jasmine.js");
phantom.injectJs("./test/lib/jasmine-console.js");

phantom.injectJs("./test/helpers.js");

phantom.injectJs("./lib/imagediff.js");
phantom.injectJs("./phantomjsrenderer.js");
phantom.injectJs("./csscritic.js");

csscriticTestPath = '';

var fs = require('fs');
fs.changeWorkingDirectory('./test');

phantom.injectJs("./PhantomJSRendererSpecForPhantom.js");

var jasmineEnv = jasmine.getEnv();
jasmineEnv.addReporter(new jasmine.ConsoleReporter(function(msg) {
    console.log(msg.replace('\n', ''));
}, function(reporter) {
    phantom.exit(reporter.results().failedCount);
}, true));

jasmineEnv.updateInterval = 1000;
jasmineEnv.execute();
