describe("TerminalReporter", function () {
    var reporter,
        htmlImage, referenceImage, differenceImageCanvas,
        consoleLogSpy;

    beforeEach(function () {
        reporter = csscritic.TerminalReporter();

        htmlImage = window.document.createElement("img");
        referenceImage = new window.Image();
        differenceImageCanvas = window.document.createElement("canvas");

        consoleLogSpy = spyOn(window.console, "log");
    });

    it("should log successful status to output", function () {
        reporter.reportComparison({
            status: "passed",
            pageUrl: "page_url",
            pageImage: htmlImage,
            referenceImage: referenceImage
        });

        expect(consoleLogSpy).toHaveBeenCalledWith("Testing page_url... \033[32m\033[1mpassed\033[0m");
    });

    it("should call the callback when finished reporting", function () {
        var callback = jasmine.createSpy("callback");

        reporter.reportComparison({}, callback);

        expect(callback).toHaveBeenCalled();
    });

    it("should log failing status to output", function () {
        reporter.reportComparison({
            status: "failed",
            pageUrl: "the_page_url",
            pageImage: htmlImage,
            resizePageImage: function () {},
            acceptPage: function () {},
            referenceImage: referenceImage
        });

        expect(consoleLogSpy).toHaveBeenCalledWith("Testing the_page_url... \033[31m\033[1mfailed\033[0m");
    });

    it("should log referenceMissing status to output", function () {
        reporter.reportComparison({
            status: "referenceMissing",
            pageUrl: "the_page_url",
            pageImage: htmlImage,
            resizePageImage: function () {},
            acceptPage: function () {}
        });

        expect(consoleLogSpy).toHaveBeenCalledWith("Testing the_page_url... \033[31m\033[1mreferenceMissing\033[0m");
    });

    it("should log error status to output", function () {
        reporter.reportComparison({
            status: "error",
            pageUrl: "page_url",
            pageImage: null
        });

        expect(consoleLogSpy).toHaveBeenCalledWith("Testing page_url... \033[31m\033[1merror\033[0m");
    });

    it("should log render errors to output", function () {
        reporter.reportComparison({
            status: "passed",
            pageUrl: "page_url",
            pageImage: htmlImage,
            referenceImage: referenceImage,
            renderErrors: ["aBrokenURL"]
        });

        expect(consoleLogSpy).toHaveBeenCalledWith("\033[31mError(s) loading page_url:\033[0m");
        expect(consoleLogSpy).toHaveBeenCalledWith("\033[31m\033[1m  aBrokenURL\033[0m");
    });
});
