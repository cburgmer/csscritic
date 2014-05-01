describe("Reporting", function () {
    "use strict";

    var csscritic, rendererBackend, storageBackend, imagediff;

    var util = csscriticLib.util();

    var htmlImage, referenceImage, viewport;

    var successfulPromiseFake = function (value) {
        return {
            then: function (successHandler) {
                successHandler(value);
            }
        };
    };

    var failedPromise = function () {
        return {
            then: function (_, failHandler) {
                failHandler();
            }
        };
    };

    var setUpRenderedImage = function (image, errors) {
        errors = errors || [];
        rendererBackend.render.and.returnValue(successfulPromiseFake({
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
            return successfulPromiseFake(image);
        });

        rendererBackend = jasmine.createSpyObj('renderer', ['render']);
        storageBackend = jasmine.createSpyObj('storageBackend', ['readReferenceImage', 'storeReferenceImage']);
        imagediff = jasmine.createSpyObj('imagediff', ['diff', 'equal']);

        csscritic = csscriticLib.main(
            rendererBackend,
            storageBackend,
            util,
            imagediff);
    });

    describe("genereal", function () {
        it("should make all reporter methods optional", function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);

            csscritic.addReporter({});

            csscritic.add("samplepage.html");
            csscritic.execute();
        });
    });

    describe("reportComparisonStarting", function () {
        var reporter;

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["reportComparisonStarting"]);
            csscritic.addReporter(reporter);
        });

        it("should report a starting comparison", function () {
            csscritic.add("samplepage.html");
            csscritic.execute();

            expect(reporter.reportComparisonStarting).toHaveBeenCalledWith({
                testCase: {
                    url: "samplepage.html"
                }
            }, jasmine.any(Function));
        });

        it("should only procede once the reporter returned", function () {
            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);
            setUpImageEqualityToBe(true);

            csscritic.add("samplepage.html");
            csscritic.execute();

            expect(storageBackend.readReferenceImage).not.toHaveBeenCalled();
            reporter.reportComparisonStarting.calls.mostRecent().args[1]();
            expect(storageBackend.readReferenceImage).toHaveBeenCalled();
        });

    });

    describe("reportComparison", function () {
        var reporter;

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]);
            csscritic.addReporter(reporter);
        });

        it("should call the callback only after the reporter finished", function () {
            var callback = jasmine.createSpy("callback");

            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);
            setUpImageEqualityToBe(true);

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(callback);

            expect(callback).not.toHaveBeenCalled();
            reporter.reportComparison.calls.mostRecent().args[1]();

            expect(callback).toHaveBeenCalled();
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
            }, jasmine.any(Function));
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
            }, jasmine.any(Function));
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
            }, jasmine.any(Function));
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
            }, jasmine.any(Function));
        });

        it("should provide a method to repaint the HTML given width and height", function () {
            var finished = false,
                newHtmlImage = "newHtmlImage",
                result;
            setUpImageEqualityToBe(true);

            rendererBackend.render.and.callFake(function (parameters) {
                if (parameters.width === 16) {
                    return successfulPromiseFake({
                        image: newHtmlImage,
                        errors: []
                    });
                } else {
                    return successfulPromiseFake({
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
            }, jasmine.any(Function));
            result = reporter.reportComparison.calls.mostRecent().args[0];

            result.resizePageImage(16, 34, function () {
                finished = true;
            });

            expect(finished).toBeTruthy();
            expect(rendererBackend.render).toHaveBeenCalledWith({
                url: "differentpage.html",
                width: 16,
                height: 34
            });
            expect(result.pageImage).toBe(newHtmlImage);
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
            }, jasmine.any(Function));

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
            }), jasmine.any(Function));
        });

        it("should provide a list of errors during rendering independently of whether the reference image exists", function () {
            setUpRenderedImage(htmlImage, ["oneUrl", "anotherUrl"]);
            setUpReferenceImageToBeMissing();

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith(jasmine.objectContaining({
                renderErrors: ["oneUrl", "anotherUrl"],
            }), jasmine.any(Function));
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
            }, jasmine.any(Function));
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

        it("should call final report", function () {
            csscritic.execute();

            expect(reporter.report).toHaveBeenCalledWith({
                success: true
            }, jasmine.any(Function));
        });

        it("should indicate fail in final report", function () {
            setUpImageEqualityToBe(false);

            setUpRenderedImage(htmlImage);
            setUpReferenceImage(referenceImage, viewport);

            csscritic.add("failingpage.html");

            csscritic.execute();

            expect(reporter.report).toHaveBeenCalledWith({
                success: false
            }, jasmine.any(Function));
        });
    });
});
