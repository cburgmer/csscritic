describe("HtmlFileReporter", function () {
    var fixtureUrl = csscriticTestPath + "fixtures/",
        reporter,
        htmlImage, referenceImage, differenceImageCanvas,
        reporterOutputPath;

    var finished,
        callback = function () {
            finished = true;
        },
        isFinished = function () {
            return finished;
        };

    beforeEach(function () {
        reporterOutputPath = csscriticTestHelper.getOrCreateTempPath();
        reporter = csscritic.HtmlFileReporter(reporterOutputPath);

        htmlImage = null;
        referenceImage = null;
        differenceImageCanvas = window.document.createElement("canvas");

        finished = false;

        this.addMatchers(imagediff.jasmine);

        csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(fixtureUrl + "green.png"), function (image) {
            htmlImage = image;
        });
        csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(fixtureUrl + "greenWithTransparency.png"), function (image) {
            referenceImage = image;
        });

        waitsFor(function () {
            return htmlImage != null && referenceImage != null;
        });
    });

    describe("on status passed", function () {
        var testResult;

        beforeEach(function () {
            testResult = {
                status: "passed",
                pageUrl: "page_url",
                pageImage: htmlImage,
                referenceImage: referenceImage
            };
        });

        it("should call the callback when finished reporting", function () {
            reporter.reportComparison(testResult, callback);

            waitsFor(isFinished);

            runs(function () {
                expect(isFinished).toBeTruthy();
            });
        });

        it("should save the rendered page", function () {
            var resultImage = null;

            reporter.reportComparison(testResult, callback);

            waitsFor(isFinished);

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

    describe("on status failed", function () {
        var testResult;

        beforeEach(function () {
            testResult = {
                status: "failed",
                pageUrl: "page_url",
                pageImage: htmlImage,
                referenceImage: referenceImage
            };
        });

        it("should save the reference image", function () {
            var resultImage = null;

            reporter.reportComparison(testResult, callback);

            waitsFor(isFinished);

            runs(function () {
                csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(reporterOutputPath + "page_url.reference.png"), function (image) {
                    resultImage = image;
                });
            });

            waitsFor(function () {
                return resultImage != null;
            });

            runs(function () {
                expect(resultImage).toImageDiffEqual(referenceImage);
            });
        });
    });
});
