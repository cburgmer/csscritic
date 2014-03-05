describe("HtmlFileReporter", function () {
    var fixtureUrl = csscriticTestPath + "fixtures/",
        reporter,
        htmlImage, referenceImage, differenceImageCanvas,
        reporterOutputPath;

    beforeEach(function (done) {
        reporterOutputPath = csscriticTestHelper.createTempPath();
        reporter = csscritic.HtmlFileReporter(reporterOutputPath);

        htmlImage = null;
        referenceImage = null;
        differenceImageCanvas = window.document.createElement("canvas");

        jasmine.addMatchers(imagediffForJasmine2);

        csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(fixtureUrl + "green.png"), function (image) {
            htmlImage = image;

            csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(fixtureUrl + "greenWithTransparency.png"), function (image) {
                referenceImage = image;

                done();
            });
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

        it("should call the callback when finished reporting", function (done) {
            reporter.reportComparison(testResult, done);
        });

        it("should save the rendered page", function (done) {
            reporter.reportComparison(testResult, function () {
                csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(reporterOutputPath + "page_url.png"), function (image) {
                    expect(image).toImageDiffEqual(htmlImage);

                    done();
                });

            });
        });
    });

    describe("on status failed", function () {
        var testResult,
            diffImage = null;

        beforeEach(function (done) {
            testResult = {
                status: "failed",
                pageUrl: "page_url",
                pageImage: htmlImage,
                referenceImage: referenceImage
            };

            csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(fixtureUrl + "greenWithTransparencyDiff.png"), function (image) {
                diffImage = image;

                done();
            });
        });

        it("should save the reference image", function (done) {
            reporter.reportComparison(testResult, function () {
                csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(reporterOutputPath + "page_url.reference.png"), function (image) {
                    expect(image).toImageDiffEqual(referenceImage);

                    done();
                });
            });
        });

        it("should save a difference image", function (done) {
            reporter.reportComparison(testResult, function () {
                csscriticTestHelper.loadImageFromUrl(csscriticTestHelper.getFileUrl(reporterOutputPath + "page_url.diff.png"), function (image) {
                    expect(image).toImageDiffEqual(diffImage);

                    done();
                });
            });
        });
    });

    describe("on status error", function () {
        var testResult;

        beforeEach(function () {
            testResult = {
                status: "error",
                pageUrl: "erroneous_page_url",
                pageImage: null
            };
        });

        it("should not save a page image", function (done) {
            reporter.reportComparison(testResult, function () {
                csscriticTestHelper.testImageUrl(csscriticTestHelper.getFileUrl(reporterOutputPath + "erroneous_page_url.reference.png"), function (result) {
                    expect(result).toBeFalsy();

                    done();
                });
            });
        });
    });

    describe("'s page output", function () {
        it("should save a HTML result page", function (done) {
            reporter.report({
                success: true
            }, function () {
                var content = require("fs").read(reporterOutputPath + "index.html");

                expect(content).toMatch(/Passed/);

                done();
            });
        });

        it("should mark a failed run", function (done) {
            reporter.report({
                success: false
            }, function () {
                var content = require("fs").read(reporterOutputPath + "index.html");

                expect(content).toMatch(/Failed/);

                done();
            });
        });
    });

});
