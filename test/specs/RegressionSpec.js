describe("Regression testing", function () {
    "use strict";

    var csscritic, rendererBackend, storageBackend, reporting, imagediff;

    var util = csscriticLib.util();

    var htmlImage, referenceImage, viewport;

    var successfulPromise = function (value) {
        var defer = ayepromise.defer();
        defer.resolve(value);
        return defer.promise;
    };

    var failedPromise = function () {
        var defer = ayepromise.defer();
        defer.reject();
        return defer.promise;
    };

    var setUpRenderedImage = function (image, errors) {
        errors = errors || [];
        rendererBackend.render.and.returnValue(successfulPromise({
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
            return successfulPromise(image);
        });

        rendererBackend = jasmine.createSpyObj('renderer', ['render']);
        imagediff = jasmine.createSpyObj('imagediff', ['diff', 'equal']);

        reporting = jasmine.createSpyObj('reporting', ['doReportComparisonStarting', 'doReportComparison', 'doReportTestSuite']);
        reporting.doReportComparisonStarting.and.returnValue(successfulPromise());
        reporting.doReportComparison.and.returnValue(successfulPromise());
        reporting.doReportTestSuite.and.returnValue(successfulPromise());

        csscritic = csscriticLib.main(
            rendererBackend,
            storageBackend,
            reporting,
            util,
            imagediff);
    });

    describe("adding & executing", function () {
        beforeEach(function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);
        });

        it("should compare a page", function (done) {
            setUpImageEqualityToBe(true);

            csscritic.add("samplepage.html");

            expect(imagediff.equal).not.toHaveBeenCalled();

            csscritic.execute(function (passed) {
                expect(imagediff.equal).toHaveBeenCalledWith(htmlImage, referenceImage);

                expect(passed).toBeTruthy();

                done();
            });
        });

        it("should report fail on a failing test case", function (done) {
            setUpImageEqualityToBe(false);

            csscritic.add("samplepage.html");

            csscritic.execute(function (passed) {
                expect(imagediff.equal).toHaveBeenCalledWith(htmlImage, referenceImage);

                expect(passed).toBeFalsy();

                done();
            });
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
            setUpImageEqualityToBe(true);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute(function () {
                expect(storageBackend.readReferenceImage).toHaveBeenCalledWith({url: "differentpage.html"}, jasmine.any(Function), jasmine.any(Function));
                expect(imagediff.equal).toHaveBeenCalledWith(htmlImage, referenceImage);

                done();
            });
        });

        it("should render page using the viewport's size", function (done) {
            setUpImageEqualityToBe(true);

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function () {
                expect(rendererBackend.render).toHaveBeenCalledWith(jasmine.objectContaining({
                    url: "samplepage.html",
                    width: 98,
                    height: 76
                }));

                done();
            });
        });

        it("should pass test case parameters to the renderer", function (done) {
            setUpImageEqualityToBe(true);

            csscritic.add({
                url: 'samplepage.html',
                hover: '.a.selector',
                active: '.another.selector'
            });
            csscritic.execute(function () {
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

    describe("First generation of a reference image", function () {
        beforeEach(function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImageToBeMissing();
        });

        it("should provide a appropriately sized page rendering", function (done) {
            csscritic.add({url: "differentpage.html"});
            csscritic.execute(function () {
                expect(rendererBackend.render).toHaveBeenCalledWith(jasmine.objectContaining({
                    url: "differentpage.html",
                    width: 800,
                    height: 100
                }));

                done();
            });
        });
    });

    describe("Configuration error handling", function () {
        it("should handle missing reference image", function (done) {
            setUpRenderedImage(htmlImage);
            setUpReferenceImageToBeMissing();


            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediff.equal).not.toHaveBeenCalled();

                done();
            });
        });

        it("should handle page render error", function (done) {
            rendererBackend.render.and.returnValue(failedPromise());
            setUpReferenceImageToBeMissing();

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediff.equal).not.toHaveBeenCalled();

                done();
            });
        });

        it("should handle page render error even when reference image exists", function (done) {
            rendererBackend.render.and.returnValue(failedPromise());
            setUpReferenceImage(referenceImage, viewport);

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediff.equal).not.toHaveBeenCalled();

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
            var defer = testHelper.deferFake(),
                callback = jasmine.createSpy('callback');

            reporting.doReportComparisonStarting.and.returnValue(defer.promise);
            reporting.doReportTestSuite.and.returnValue(testHelper.successfulPromiseFake());
            csscritic.execute(callback);

            jasmine.clock().tick(100);
            expect(callback).not.toHaveBeenCalled();

            defer.resolve();

            jasmine.clock().tick(100);
            expect(callback).toHaveBeenCalled();
        });

        it("should call final report on empty test case list and report as successful ", function () {
            reporting.doReportComparisonStarting.and.returnValue(testHelper.successfulPromiseFake());

            csscritic.execute();

            jasmine.clock().tick(100);
            expect(reporting.doReportTestSuite).toHaveBeenCalledWith([reporter], true);
        });

        it("should indicate fail in final report", function () {
            reporting.doReportComparisonStarting.and.returnValue(testHelper.successfulPromiseFake());

            setUpImageEqualityToBe(false);
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);

            csscritic.add("failingpage.html");
            csscritic.execute();

            triggerDelayedPromise();

            expect(reporting.doReportTestSuite).toHaveBeenCalledWith([reporter], false);
        });

        it("should wait for reporting on final report to finish", function () {
            var defer = testHelper.deferFake(),
                callback = jasmine.createSpy('callback');

            reporting.doReportComparisonStarting.and.returnValue(testHelper.successfulPromiseFake());
            reporting.doReportTestSuite.and.returnValue(defer.promise);
            csscritic.execute(callback);

            jasmine.clock().tick(100);
            expect(callback).not.toHaveBeenCalled();

            defer.resolve();

            jasmine.clock().tick(100);
            expect(callback).toHaveBeenCalled();
        });

    });
});
