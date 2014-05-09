describe("Reporting", function () {
    "use strict";

    var csscritic, rendererBackend, storageBackend, reporting, imagediff;

    var util = csscriticLib.util();

    var htmlImage, referenceImage, viewport;

    var failedPromise = function () {
        return {
            then: function (_, failHandler) {
                failHandler();
            }
        };
    };

    var setUpRenderedImage = function (image, errors) {
        errors = errors || [];
        rendererBackend.render.and.returnValue(testHelper.successfulPromiseFake({
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
        htmlImage = "the_html_image";
        referenceImage = "the_reference_image";
        viewport = {
            width: 98,
            height: 76
        };


        spyOn(util, 'workAroundTransparencyIssueInFirefox').and.callFake(function (image) {
            return testHelper.successfulPromiseFake(image);
        });

        rendererBackend = jasmine.createSpyObj('renderer', ['render']);
        storageBackend = jasmine.createSpyObj('storageBackend', ['readReferenceImage', 'storeReferenceImage']);
        imagediff = jasmine.createSpyObj('imagediff', ['diff', 'equal']);

        reporting = csscriticLib.reporting(rendererBackend, storageBackend, util);

        csscritic = csscriticLib.main(
            rendererBackend,
            storageBackend,
            reporting,
            util,
            imagediff);
    });

    describe("reportComparisonStarting", function () {
        var reporter;

        var triggerDelayedPromise = function () {
            jasmine.clock().tick(100);
        };

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["reportComparisonStarting"]);
            csscritic.addReporter(reporter);

            jasmine.clock().install();
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        it("should report a starting comparison", function () {
            reporting.doReportComparisonStarting([reporter], [{
                url: "samplepage.html"
            }]);

            expect(reporter.reportComparisonStarting).toHaveBeenCalledWith({
                testCase: {
                    url: "samplepage.html"
                }
            });
        });

        it("should make method optional", function () {
            var startingComparison = "blah",
                emptyReporter = {};

            reporting.doReportComparisonStarting([emptyReporter], [startingComparison]);
        });

        it("should only fulfill once the reporter returned", function () {
            var startingComparison = "blah",
                defer = testHelper.deferFake(),
                callback = jasmine.createSpy('callback');

            reporter.reportComparisonStarting.and.returnValue(defer.promise);

            reporting.doReportComparisonStarting([reporter], [startingComparison]).then(callback);

            triggerDelayedPromise();

            expect(callback).not.toHaveBeenCalled();
            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

    });

    describe("reportComparison", function () {
        var reporter;

        var poorMansSynchronousAllImplementation = function (functionReturnValues) {
            var defer = testHelper.deferFake([]);
            if (functionReturnValues.length && functionReturnValues[0]) {
                functionReturnValues[0].then(defer.resolve);
                return defer.promise;
            } else {
                return testHelper.successfulPromiseFake([]);
            }
        };

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]);
            csscritic.addReporter(reporter);

            spyOn(util, 'all').and.callFake(poorMansSynchronousAllImplementation);
        });

        it("should make method optional", function () {
            var comparison = "blah",
                emptyReporter = {};

            reporting.doReportComparison([emptyReporter], [comparison]);
        });

        it("should finish execution only after the reporter finished", function (done) {
            var defer = testHelper.deferFake(),
                resolved = false;

            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);
            setUpImageEqualityToBe(true);

            reporter.reportComparison.and.returnValue(defer.promise);

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function () {
                expect(resolved).toBe(true);

                done();
            });

            resolved = true;
            defer.resolve();
        });

        it("should report a successful comparison", function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);
            setUpImageEqualityToBe(true);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                testCase: {
                    url: "differentpage.html"
                },
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });
        });

        it("should report a canvas showing the difference on a failing comparison", function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);
            setUpImageEqualityToBe(false);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "failed",
                testCase: {
                    url: "differentpage.html"
                },
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });
        });

        it("should report a missing reference image", function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImageToBeMissing();

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                testCase: {
                    url: "differentpage.html"
                },
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function)
            });
        });

        it("should report an error if the page does not exist", function () {
            rendererBackend.render.and.returnValue(failedPromise());
            setUpReferenceImageToBeMissing();

            csscritic.add({url: "samplepage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "error",
                testCase: {
                    url: "samplepage.html"
                },
                pageImage: undefined
            });
        });

        it("should provide a method to repaint the HTML given width and height", function () {
            var finished = false,
                newHtmlImage = "newHtmlImage",
                result;
            setUpImageEqualityToBe(true);

            rendererBackend.render.and.callFake(function (parameters) {
                if (parameters.width === 16) {
                    return testHelper.successfulPromiseFake({
                        image: newHtmlImage,
                        errors: []
                    });
                } else {
                    return testHelper.successfulPromiseFake({
                        image: htmlImage,
                        errors: []
                    });
                }
            });
            setUpReferenceImage(referenceImage, viewport);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                testCase: {
                    url: "differentpage.html"
                },
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });
            result = reporter.reportComparison.calls.mostRecent().args[0];

            result.resizePageImage(16, 34, function () {
                finished = true;
            });

            expect(finished).toBeTruthy();
            expect(rendererBackend.render).toHaveBeenCalledWith(jasmine.objectContaining({
                url: "differentpage.html",
                width: 16,
                height: 34
            }));
            expect(result.pageImage).toBe(newHtmlImage);
        });

        it("should pass the test case's additional parameters on resize", function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImageToBeMissing();

            csscritic.add({
                url: "differentpage.html",
                hover: '.selector'
            });
            csscritic.execute();

            rendererBackend.render.calls.reset();

            reporter.reportComparison.calls.mostRecent().args[0].resizePageImage(16, 34, function () {});

            expect(rendererBackend.render).toHaveBeenCalledWith(
                jasmine.objectContaining({hover: '.selector'})
            );
        });

        it("should provide a method to accept the rendered page and store as new reference", function () {
            setUpImageEqualityToBe(true);

            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                testCase: {
                    url: "differentpage.html"
                },
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });

            reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

            expect(storageBackend.storeReferenceImage).toHaveBeenCalledWith({url: "differentpage.html"}, htmlImage, jasmine.any(Object));
        });

        it("should store the viewport's size on accept", function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImageToBeMissing();

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

            expect(storageBackend.storeReferenceImage).toHaveBeenCalledWith(jasmine.any(Object), htmlImage, {
                width: 800,
                height: 100
            });
        });

        it("should pass the test case's additional parameters on accept", function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImageToBeMissing();

            csscritic.add({
                url: "differentpage.html",
                hover: '.selector'
            });
            csscritic.execute();

            reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

            expect(storageBackend.storeReferenceImage).toHaveBeenCalledWith(
                jasmine.objectContaining({hover: '.selector'}),
                htmlImage,
                jasmine.any(Object)
            );
        });

        it("should store the viewport's updated size on accept", function () {
            var result;

            setUpRenderedImage(htmlImage);
            setUpReferenceImageToBeMissing();

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            result = reporter.reportComparison.calls.mostRecent().args[0];

            result.resizePageImage(16, 34, function () {});

            result.acceptPage();

            expect(storageBackend.storeReferenceImage).toHaveBeenCalledWith(jasmine.any(Object), htmlImage, {
                width: 16,
                height: 34
            });
        });

        it("should provide a list of errors during rendering", function () {
            setUpImageEqualityToBe(true);
            setUpRenderedImage(htmlImage, ["oneUrl", "anotherUrl"]);
            setUpReferenceImage(referenceImage, viewport);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith(jasmine.objectContaining({
                renderErrors: ["oneUrl", "anotherUrl"],
            }));
        });

        it("should provide a list of errors during rendering independently of whether the reference image exists", function () {
            setUpRenderedImage(htmlImage, ["oneUrl", "anotherUrl"]);
            setUpReferenceImageToBeMissing();

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith(jasmine.objectContaining({
                renderErrors: ["oneUrl", "anotherUrl"],
            }));
        });

        it("should not pass along a list if no errors exist", function () {
            setUpImageEqualityToBe(true);
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                testCase: {
                    url: "differentpage.html"
                },
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            });
        });

        it("should get called before the success handler returns so that user actions don't interfere with reporting", function () {
            var callbackTriggered = false;

            setUpImageEqualityToBe(true);
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);

            reporter.reportComparison.and.callFake(function () {
                expect(callbackTriggered).toBeFalsy();
            });

            csscritic.add({url: "differentpage.html"});
            csscritic.execute(function () {
                callbackTriggered = true;
            });

            expect(reporter.reportComparison).toHaveBeenCalled();
        });
    });

    describe("report", function () {
        var reporter;

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["report"]);
            csscritic.addReporter(reporter);
        });

        it("should call final report", function (done) {
            csscritic.execute(function () {
                expect(reporter.report).toHaveBeenCalledWith({
                    success: true
                });

                done();
            });
        });

        it("should make method optional", function () {
            var emptyReporter = {};
            reporting.doReportTestSuite([emptyReporter], true);
        });

        it("should indicate fail in final report", function (done) {
            setUpImageEqualityToBe(false);

            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);

            csscritic.add("failingpage.html");

            csscritic.execute(function () {
                expect(reporter.report).toHaveBeenCalledWith({
                    success: false
                });

                done();
            });
        });

        it("should call the callback only after the reporter finished", function (done) {
            var defer = testHelper.deferFake(),
                resolved = false;

            reporter.report.and.returnValue(defer.promise);

            csscritic.execute(function () {
                expect(resolved).toBe(true);

                done();
            });

            defer.resolve();
            resolved = true;
        });

    });
});
