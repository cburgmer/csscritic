describe("Regression testing", function () {
    "use strict";

    var csscritic, regression, rendererBackend, storageBackend, reporting, imagediff;

    var util = csscriticLib.util();

    var htmlImage, referenceImage, viewport;

    var setUpRenderedImage = function (image, errors) {
        errors = errors || [];
        rendererBackend.render.and.returnValue(testHelper.successfulPromise({
            image: image,
            errors: errors
        }));
    };

    var setUpReferenceImage = function (image, viewport) {
        storageBackend.readReferenceImage.and.callFake(function (testCase, successCallback) {
            successCallback(image, viewport);
        });
    };

    var setUpReferenceImageToBeMissing = function () {
        storageBackend.readReferenceImage.and.callFake(function (testCase, successCallback, errorCallback) {
            errorCallback();
        });
    };

    var setUpImageEqualityToBe = function (equal) {
        imagediff.equal.and.returnValue(equal);
    };

    beforeEach(function () {
        htmlImage = jasmine.createSpy('htmlImage');
        referenceImage = {
            width: 42,
            height: 7
        };
        viewport = {
            width: 98,
            height: 76
        };

        storageBackend = jasmine.createSpyObj('storageBackend', ['readReferenceImage', 'storeReferenceImage']);

        spyOn(util, 'workAroundTransparencyIssueInFirefox').and.callFake(function (image) {
            return testHelper.successfulPromise(image);
        });

        rendererBackend = jasmine.createSpyObj('renderer', ['render']);
        imagediff = jasmine.createSpyObj('imagediff', ['diff', 'equal']);

        reporting = jasmine.createSpyObj('reporting', ['doReportComparisonStarting', 'doReportComparison', 'doReportTestSuite']);
        reporting.doReportComparisonStarting.and.returnValue(testHelper.successfulPromise());
        reporting.doReportComparison.and.returnValue(testHelper.successfulPromise());
        reporting.doReportTestSuite.and.returnValue(testHelper.successfulPromise());

        regression = csscriticLib.regression(rendererBackend, storageBackend, util, imagediff);

        csscritic = csscriticLib.main(
            regression,
            reporting,
            util);
    });

    describe("adding & executing", function () {
        beforeEach(function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);
            setUpImageEqualityToBe(true);
        });

        it("should return on an empty list of tests", function (done) {
            csscritic.execute(function (passed) {
                expect(passed).toBeTruthy();

                done();
            });
        });

        it("should handle a missing callback", function () {
            csscritic.execute();
        });

        it("should compare the rendered page against the reference image", function (done) {
            regression.compare({url: "differentpage.html"}).then(function () {
                expect(storageBackend.readReferenceImage).toHaveBeenCalledWith({url: "differentpage.html"}, jasmine.any(Function), jasmine.any(Function));
                expect(imagediff.equal).toHaveBeenCalledWith(htmlImage, referenceImage);

                done();
            });
        });

        it("should render page using the viewport's size", function (done) {
            regression.compare({url: "samplepage.html"}).then(function () {
                expect(rendererBackend.render).toHaveBeenCalledWith(jasmine.objectContaining({
                    url: "samplepage.html",
                    width: 98,
                    height: 76
                }));

                done();
            });
        });

        it("should execute regression test", function () {
            spyOn(regression, 'compare').and.returnValue(testHelper.successfulPromise());
            csscritic.add("test_case");
            csscritic.execute(function () {
                expect(regression.compare).toHaveBeenCalledWith({
                    url: "test_case"
                });
            });
        });

        it("should pass test case parameters to the renderer", function (done) {
            regression.compare({
                    url: 'samplepage.html',
                    hover: '.a.selector',
                    active: '.another.selector'
                })
                .then(function () {
                    expect(rendererBackend.render).toHaveBeenCalledWith({
                        url: "samplepage.html",
                        hover: '.a.selector',
                        active: '.another.selector',
                        width: 98,
                        height: 76
                    });

                    done();
                });
        });
    });

    describe("on a passing comparison", function () {
        beforeEach(function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);
            setUpImageEqualityToBe(true);
        });

        it("should report success", function (done) {
            csscritic.add("samplepage.html");

            csscritic.execute(function (passed) {
                expect(imagediff.equal).toHaveBeenCalledWith(htmlImage, referenceImage);

                expect(passed).toBeTruthy();

                done();
            });
        });

        it("should report a successful comparison", function (done) {
            regression.compare({url: "differentpage.html"}).then(function (comparison) {
                expect(comparison).toEqual({
                    status: "passed",
                    testCase: {
                        url: "differentpage.html"
                    },
                    htmlImage: htmlImage,
                    referenceImage: referenceImage,
                    renderErrors: [],
                    viewportWidth: viewport.width,
                    viewportHeight: viewport.height
                });

                done();
            });
        });

        it("should report a list of errors during rendering", function (done) {
            setUpRenderedImage(htmlImage, ["oneUrl", "anotherUrl"]);

            regression.compare({url: "differentpage.html"}).then(function (comparison) {
                expect(comparison).toEqual(jasmine.objectContaining({
                    renderErrors: ["oneUrl", "anotherUrl"],
                }));

                done();
            });
        });

        it("should report overall success in the test suite", function (done) {
            csscritic.add("succeedingpage.html");
            csscritic.execute(function () {
                expect(reporting.doReportTestSuite).toHaveBeenCalledWith(jasmine.any(Object), true);

                done();
            });
        });
    });

    describe("on a failing comparison", function () {
        beforeEach(function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);
            setUpImageEqualityToBe(false);
        });

        it("should report failure", function (done) {
            csscritic.add("samplepage.html");

            csscritic.execute(function (passed) {
                expect(imagediff.equal).toHaveBeenCalledWith(htmlImage, referenceImage);

                expect(passed).toBeFalsy();

                done();
            });
        });

        it("should report a failing comparison", function (done) {
            regression.compare({url: "differentpage.html"}).then(function (comparison) {
                expect(comparison).toEqual({
                    status: "failed",
                    testCase: {
                        url: "differentpage.html"
                    },
                    htmlImage: htmlImage,
                    referenceImage: referenceImage,
                    renderErrors: [],
                    viewportWidth: viewport.width,
                    viewportHeight: viewport.height
                });

                done();
            });
        });

        it("should report a failure in the test suite", function (done) {
            csscritic.add("failingpage.html");
            csscritic.execute(function () {
                expect(reporting.doReportTestSuite).toHaveBeenCalledWith(jasmine.any(Object), false);

                done();
            });
        });
    });

    describe("on a reference missing", function () {
        beforeEach(function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImageToBeMissing();
        });

        it("should report failure", function (done) {
            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediff.equal).not.toHaveBeenCalled();

                done();
            });
        });

        it("should provide a appropriately sized page rendering", function (done) {
            regression.compare({url: "differentpage.html"}).then(function () {
                expect(rendererBackend.render).toHaveBeenCalledWith(jasmine.objectContaining({
                    url: "differentpage.html",
                    width: 800,
                    height: 100
                }));

                done();
            });
        });

        it("should report a missing reference image", function (done) {
            regression.compare({url: "differentpage.html"}).then(function (comparison) {
                expect(comparison).toEqual({
                    status: "referenceMissing",
                    testCase: {
                        url: "differentpage.html"
                    },
                    htmlImage: htmlImage,
                    referenceImage: null,
                    renderErrors: [],
                    viewportWidth: jasmine.any(Number),
                    viewportHeight: jasmine.any(Number)
                });

                done();
            });
        });

        it("should report a list of errors during rendering", function (done) {
            setUpRenderedImage(htmlImage, ["oneUrl", "anotherUrl"]);

            regression.compare({url: "differentpage.html"}).then(function (comparison) {
                expect(comparison).toEqual(jasmine.objectContaining({
                    renderErrors: ["oneUrl", "anotherUrl"],
                }));

                done();
            });
        });
    });

    describe("on error", function () {
        beforeEach(function () {
            rendererBackend.render.and.returnValue(testHelper.failedPromise());
        });

        it("should report failure", function (done) {
            setUpReferenceImageToBeMissing();

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediff.equal).not.toHaveBeenCalled();

                done();
            });
        });

        it("should report the comparison", function (done) {
            setUpReferenceImageToBeMissing();

            regression.compare({url: "differentpage.html"}).then(function (comparison) {
                expect(comparison).toEqual({
                    status: "error",
                    testCase: {
                        url: "differentpage.html"
                    }
                });

                done();
            });
        });
    });

    describe("Reporting", function () {
        var reporter;

        var triggerDelayedPromise = function () {
            jasmine.clock().tick(100);
        };

        beforeEach(function () {
            jasmine.clock().install();
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        beforeEach(function () {
            reporter = {};
            csscritic.addReporter(reporter);
        });

        it("should report a starting comparison", function () {
            csscritic.add("samplepage.html");
            csscritic.execute();

            expect(reporting.doReportComparisonStarting).toHaveBeenCalledWith([reporter], [{
                url: "samplepage.html"
            }]);
        });

        it("should wait for reporting on starting comparison to finish", function () {
            var defer = ayepromise.defer(),
                callback = jasmine.createSpy('callback');

            reporting.doReportComparisonStarting.and.returnValue(defer.promise);
            csscritic.execute(callback);

            triggerDelayedPromise();
            expect(callback).not.toHaveBeenCalled();

            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

        it("should call final report on empty test case list and report as successful", function (done) {
            csscritic.execute(function () {
                expect(reporting.doReportTestSuite).toHaveBeenCalledWith([reporter], true);

                done();
            });

            triggerDelayedPromise();
        });

        it("should wait for reporting on comparison to finish", function () {
            var defer = ayepromise.defer(),
                callback = jasmine.createSpy('callback');

            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);

            reporting.doReportComparison.and.returnValue(defer.promise);
            csscritic.add('a_test');
            csscritic.execute(callback);

            triggerDelayedPromise();
            expect(callback).not.toHaveBeenCalled();

            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

        it("should wait for reporting on final report to finish", function () {
            var defer = ayepromise.defer(),
                callback = jasmine.createSpy('callback');

            reporting.doReportTestSuite.and.returnValue(defer.promise);
            csscritic.execute(callback);

            triggerDelayedPromise();
            expect(callback).not.toHaveBeenCalled();

            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

    });
});
