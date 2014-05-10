(function () {
    "use strict";

    var util = csscriticLib.util(),
        phantomRenderer = csscriticLib.phantomjsRenderer(),
        filestorage = csscriticLib.filestorage(util),
        reporting = csscriticLib.reporting(phantomRenderer, filestorage, util),
        regression = csscriticLib.regression(phantomRenderer, filestorage, util, imagediff);

    var csscritic = csscriticLib.main(
        regression,
        reporting,
        util);

    // Export convenience constructors
    var signOffReporterUtil = csscriticLib.signOffReporterUtil(util, inlineresources, jsSHA),
        signOffReporter = csscriticLib.signOffReporter(signOffReporterUtil),
        htmlFileReporter = csscriticLib.htmlFileReporter(util),
        terminalReporter = csscriticLib.terminalReporter(window.console);

    csscritic.HtmlFileReporter = htmlFileReporter.HtmlFileReporter;
    csscritic.SignOffReporter = signOffReporter.SignOffReporter;
    csscritic.TerminalReporter = terminalReporter.TerminalReporter;

    var runner = csscriticLib.phantomjsRunner(csscritic);
    runner.main();
}());
