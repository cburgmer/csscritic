(function () {
    "use strict";

    var util = csscriticLib.util(),
        phantomRenderer = csscriticLib.phantomjsRenderer(),
        filestorage = csscriticLib.filestorage(util);

    var csscritic = csscriticLib.main(
        phantomRenderer,
        filestorage,
        util,
        imagediff);

    // Export convenience constructors
    var signOffReporterUtil = csscriticLib.signOffReporterUtil(util, inlineresources, jsSHA),
        signOffReporter = csscriticLib.signOffReporter(signOffReporterUtil),
        htmlFileReporter = csscriticLib.htmlFileReporter(),
        terminalReporter = csscriticLib.terminalReporter(window.console);

    csscritic.HtmlFileReporter = htmlFileReporter.HtmlFileReporter;
    csscritic.SignOffReporter = signOffReporter.SignOffReporter;
    csscritic.TerminalReporter = terminalReporter.TerminalReporter;

    var runner = csscriticLib.phantomjsRunner(csscritic);
    runner.main();
}());
