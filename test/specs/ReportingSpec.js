describe("Reporting", function () {
    var csscritic, imagediff;

    var util = csscriticLib.util(),
        browserRenderer = csscriticLib.browserRenderer(util, csscriticLib.jobQueue, rasterizeHTML),
        domstorage = csscriticLib.domstorage(util, localStorage);

    var render, readReferenceImage,
        htmlImage, referenceImage, viewport;

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

    var setUpRenderer = function (image, errors) {
        errors = errors || [];
        render.and.returnValue(successfulPromiseFake({
            image: image,
            errors: errors
        }));
    };

    var setUpImageDiffAndReturn = function (equal) {
        imagediff.equal.and.returnValue(equal);
    };

    beforeEach(function () {
        htmlImage = "the_html_image";
        referenceImage = "the_reference_image";
        viewport = {
            width: 98,
            height: 76
        };

        render = spyOn(browserRenderer, 'render');
        readReferenceImage = spyOn(domstorage, 'readReferenceImage');

        spyOn(util, 'workAroundTransparencyIssueInFirefox').and.callFake(function (image, callback) {
            callback(image);
        });

        imagediff = jasmine.createSpyObj('imagediff', ['diff', 'equal']);

        csscritic = csscriticLib.main(
            browserRenderer,
            domstorage,
            util,
            imagediff);
    });

    describe("genereal", function () {
        it("should make all reporter methods optional", function () {
            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

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
                pageUrl: "samplepage.html"
            }, jasmine.any(Function));
        });

        it("should only procede once the reporter returned", function () {
            setUpRenderer(htmlImage);
            setUpImageDiffAndReturn(true);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add("samplepage.html");
            csscritic.execute();

            expect(readReferenceImage).not.toHaveBeenCalled();
            reporter.reportComparisonStarting.calls.mostRecent().args[1]();
            expect(readReferenceImage).toHaveBeenCalled();
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

            setUpImageDiffAndReturn(true);

            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(callback);

            expect(callback).not.toHaveBeenCalled();
            reporter.reportComparison.calls.mostRecent().args[1]();

            expect(callback).toHaveBeenCalled();
        });

        it("should report a successful comparison", function () {
            setUpImageDiffAndReturn(true);
            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            }, jasmine.any(Function));
        });

        it("should report a canvas showing the difference on a failing comparison", function () {
            setUpImageDiffAndReturn(false);
            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "failed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            }, jasmine.any(Function));
        });

        it("should report a missing reference image", function () {
            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function)
            }, jasmine.any(Function));
        });

        it("should report an error if the page does not exist", function () {
            render.and.returnValue(failedPromise());
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.add({url: "samplepage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "error",
                pageUrl: "samplepage.html",
                pageImage: undefined
            }, jasmine.any(Function));
        });

        it("should provide a method to repaint the HTML given width and height", function () {
            var finished = false,
                newHtmlImage = "newHtmlImage",
                result;
            setUpImageDiffAndReturn(true);

            render.and.callFake(function (parameters) {
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
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
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
            expect(render).toHaveBeenCalledWith({
                url: "differentpage.html",
                width: 16,
                height: 34
            });
            expect(result.pageImage).toBe(newHtmlImage);
        });

        it("should provide a method to accept the rendered page and store as new reference", function () {
            var storeReferenceImageSpy = spyOn(domstorage, 'storeReferenceImage');
            setUpImageDiffAndReturn(true);

            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            }, jasmine.any(Function));

            reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

            expect(storeReferenceImageSpy).toHaveBeenCalledWith("differentpage.html", htmlImage, jasmine.any(Object));
        });

        it("should store the viewport's size on accept", function () {
            var storeReferenceImageSpy = spyOn(domstorage, 'storeReferenceImage');

            readReferenceImage.and.callFake(function (pageUrl, callback, errorCallback) {
                errorCallback();
            });
            setUpRenderer(htmlImage);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

            expect(storeReferenceImageSpy).toHaveBeenCalledWith(jasmine.any(String), htmlImage, {
                width: 800,
                height: 100
            });
        });

        it("should store the viewport's updated size on accept", function () {
            var storeReferenceImageSpy = spyOn(domstorage, 'storeReferenceImage'),
                result;

            readReferenceImage.and.callFake(function (pageUrl, callback, errorCallback) {
                errorCallback();
            });
            setUpRenderer(htmlImage);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            result = reporter.reportComparison.calls.mostRecent().args[0];

            result.resizePageImage(16, 34, function () {});

            result.acceptPage();

            expect(storeReferenceImageSpy).toHaveBeenCalledWith(jasmine.any(String), htmlImage, {
                width: 16,
                height: 34
            });
        });

        it("should provide a list of errors during rendering", function () {
            setUpImageDiffAndReturn(true);
            render.and.returnValue(successfulPromiseFake({
                image: htmlImage,
                errors: ["oneUrl", "anotherUrl"]
            }));
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                renderErrors: ["oneUrl", "anotherUrl"],
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            }, jasmine.any(Function));
        });

        it("should provide a list of errors during rendering independently of whether the reference image exists", function () {
            setUpRenderer(htmlImage, ["oneUrl", "anotherUrl"]);
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                pageUrl: "differentpage.html",
                renderErrors: ["oneUrl", "anotherUrl"],
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function)
            }, jasmine.any(Function));
        });

        it("should not pass along a list if no errors exist", function () {
            setUpImageDiffAndReturn(true);
            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add({url: "differentpage.html"});
            csscritic.execute();

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            }, jasmine.any(Function));
        });

        it("should get called before the success handler returns so that user actions don't interfere with reporting", function () {
            var callbackTriggered = false;

            setUpImageDiffAndReturn(true);
            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

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
            setUpImageDiffAndReturn(false);

            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add("failingpage.html");

            csscritic.execute();

            expect(reporter.report).toHaveBeenCalledWith({
                success: false
            }, jasmine.any(Function));
        });
    });
});
