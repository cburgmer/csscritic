window.csscritic = (function (module) {
    var system = require("system");

    module.phantomjsRunner = {};

    var parseArguments = function (args) {
        var i = 0,
            arg, value,
            parsedArguments = {
                opts: {},
                args: []
            };

        while(i < args.length) {
            if (args[i][0] === "-") {
                arg = args[i];
                value = args[i+1];
                parsedArguments.opts[arg] = value;
                if (i + 1 < args.length) {
                    i += 1;
                } else {
                    throw new Error("Invalid arguments");
                }
            } else {
                arg = args[i];
                parsedArguments.args.push(arg);
            }
            i += 1;
        }

        return parsedArguments;
    };

    var runCompare = function (testDocuments, signedOffPages, doneHandler) {
        var finishedCount = 0;

        signedOffPages = signedOffPages || [];

        csscritic.addReporter(csscritic.SignOffReporter(signedOffPages));
        csscritic.addReporter(csscritic.TerminalReporter());
        csscritic.addReporter(csscritic.HtmlFileReporter());

        testDocuments.forEach(function (testDocument) {
            var passed = true;

            csscritic.compare(testDocument, function (status) {
                finishedCount += 1;
                passed = passed && (status === "passed");

                if (finishedCount === testDocuments.length) {
                    doneHandler(passed);
                }
            });
        });
    };

    module.phantomjsRunner.main = function () {
        var parsedArguments = parseArguments(system.args.slice(1)),
            signedOffPages = parsedArguments.opts['-f'];

        if (parsedArguments.args.length < 1) {
            console.log("CSS critic regression runner for PhantomJS");
            console.log("Usage: phantomjs-regressionrunner.js [-f SIGNED_OFF.json] A_DOCUMENT.html [ANOTHER_DOCUMENT.html ...]");
            phantom.exit(2);
        } else {
            runCompare(parsedArguments.args, signedOffPages, function (passed) {
                var ret = passed ? 0 : 1;

                phantom.exit(ret);
            });
        }
    };

    return module;
}(window.csscritic || {}));

csscritic.phantomjsRunner.main();
