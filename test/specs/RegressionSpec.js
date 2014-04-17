describe("Regression testing", function () {
    "use strict";

    var csscritic, rendererBackend, storageBackend, imagediff;

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
        storageBackend.readReferenceImage.and.callFake(function (pageUrl, successCallback) {
            successCallback(image, viewport);
        });
    };

    var setUpReferenceImageToBeMissing = function () {
        storageBackend.readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
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

        csscritic = csscriticLib.main(
            rendererBackend,
            storageBackend,
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
                expect(storageBackend.readReferenceImage).toHaveBeenCalledWith("differentpage.html", jasmine.any(Function), jasmine.any(Function));
                expect(imagediff.equal).toHaveBeenCalledWith(htmlImage, referenceImage);

                done();
            });
        });

        it("should render page using the viewport's size", function (done) {
            setUpImageEqualityToBe(true);

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function () {
                expect(rendererBackend.render).toHaveBeenCalledWith({
                    url: "samplepage.html",
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
                expect(rendererBackend.render).toHaveBeenCalledWith({
                    url: "differentpage.html",
                    width: 800,
                    height: 100
                });

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

});
