describe("HtmlFileReporter", function () {
    var fixtureUrl = csscriticTestPath + "fixtures/",
        reporter,
        htmlImage, referenceImage, differenceImageCanvas,
        reporterOutputPath;

    beforeEach(function () {
        reporterOutputPath = csscriticTestHelper.getOrCreateTempPath();
        reporter = csscritic.HtmlFileReporter(reporterOutputPath);

        htmlImage = null;
        referenceImage = null;
        differenceImageCanvas = window.document.createElement("canvas");

        this.addMatchers(imagediff.jasmine);

        csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(fixtureUrl + "green.png"), function (image) {
            htmlImage = image;
            referenceImage = image;
        });

        waitsFor(function () {
            return htmlImage != null && referenceImage != null;
        });
    });

    it("should call the callback when finished reporting", function () {
        var callback = jasmine.createSpy("callback");

        reporter.reportComparison({
            status: "passed",
            pageUrl: "page_url",
            pageImage: htmlImage,
            referenceImage: referenceImage
        }, callback);

        expect(callback).toHaveBeenCalled();
    });

    it("should save rendered page on status passed", function () {
        var resultImage = null;

        runs(function () {
            reporter.reportComparison({
                status: "passed",
                pageUrl: "page_url",
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

        });

        // TODO wait for reporter.reportComparison() to finish
        waits(1000);

        runs(function () {
            csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(reporterOutputPath + "page_url.png"), function (image) {
                resultImage = image;
            });
        });

        waitsFor(function () {
            return resultImage != null;
        });

        runs(function () {
            expect(resultImage).toImageDiffEqual(htmlImage);
        });
    });
});
