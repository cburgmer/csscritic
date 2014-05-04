describe("HtmlFileReporter", function () {
    "use strict";

    var fixtureUrl = csscriticTestPath + "fixtures/",
        reporter,
        htmlImage, referenceImage, differenceImageCanvas,
        reporterOutputPath;

    beforeEach(function (done) {

        htmlImage = null;
        referenceImage = null;
        differenceImageCanvas = window.document.createElement("canvas");

        jasmine.addMatchers(imagediffForJasmine2);

        testHelper.loadImageFromUrl(testHelper.getFileUrl(fixtureUrl + "green.png"), function (image) {
            htmlImage = image;

            testHelper.loadImageFromUrl(testHelper.getFileUrl(fixtureUrl + "greenWithTransparency.png"), function (image) {
                referenceImage = image;

                done();
            });
        });

        reporterOutputPath = testHelper.createTempPath();

        var htmlFileReporter = csscriticLib.htmlFileReporter();
        reporter = htmlFileReporter.HtmlFileReporter(reporterOutputPath);
    });

    describe("on status passed", function () {
        var testResult;

        beforeEach(function () {
            testResult = {
                status: "passed",
                testCase: {
                    url: "page_url"
                },
                pageImage: htmlImage,
                referenceImage: referenceImage
            };
        });

        it("should call the callback when finished reporting", function (done) {
            reporter.reportComparison(testResult, done);
        });

        it("should save the rendered page", function (done) {
            reporter.reportComparison(testResult, function () {
                testHelper.loadImageFromUrl(testHelper.getFileUrl(reporterOutputPath + "page_url.png"), function (image) {
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
                testCase: {
                    url: "page_url"
                },
                pageImage: htmlImage,
                referenceImage: referenceImage
            };

            testHelper.loadImageFromUrl(testHelper.getFileUrl(fixtureUrl + "greenWithTransparencyDiff.png"), function (image) {
                diffImage = image;

                done();
            });
        });

        it("should save the reference image", function (done) {
            reporter.reportComparison(testResult, function () {
                testHelper.loadImageFromUrl(testHelper.getFileUrl(reporterOutputPath + "page_url.reference.png"), function (image) {
                    expect(image).toImageDiffEqual(referenceImage);

                    done();
                });
            });
        });

        it("should save a difference image", function (done) {
            reporter.reportComparison(testResult, function () {
                testHelper.loadImageFromUrl(testHelper.getFileUrl(reporterOutputPath + "page_url.diff.png"), function (image) {
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
                testCase: {
                    url: "erroneous_page_url"
                },
                pageImage: null
            };
        });

        it("should not save a page image", function (done) {
            reporter.reportComparison(testResult, function () {
                testHelper.testImageUrl(testHelper.getFileUrl(reporterOutputPath + "erroneous_page_url.reference.png"), function (result) {
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
