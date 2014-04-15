describe("Regression testing", function () {
    var csscritic, imagediff;

    var util = csscriticLib.util(),
        browserRenderer = csscriticLib.browserRenderer(util, csscriticLib.jobQueue, rasterizeHTML),
        domstorage = csscriticLib.domstorage(util, localStorage);

    var render, readReferenceImage,
        htmlImage, referenceImage, viewport;

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

    var setUpRenderer = function (image, errors) {
        errors = errors || [];
        render.and.returnValue(successfulPromise({
            image: image,
            errors: errors
        }));
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

    describe("adding & executing", function () {
        var setUpImageDiffAndReturn = function (equal) {
            imagediff.equal.and.returnValue(equal);
        };

        beforeEach(function () {
            setUpRenderer(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });
        });

        it("should compare a page", function (done) {
            setUpImageDiffAndReturn(true);

            csscritic.add("samplepage.html");

            expect(imagediff.equal).not.toHaveBeenCalled();

            csscritic.execute(function (passed) {
                expect(imagediff.equal).toHaveBeenCalledWith(htmlImage, referenceImage);

                expect(passed).toBeTruthy();

                done();
            });
        });

        it("should report fail on a failing test case", function (done) {
            setUpImageDiffAndReturn(false);

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
            setUpImageDiffAndReturn(true);

            csscritic.add({url: "differentpage.html"});
            csscritic.execute(function () {
                expect(readReferenceImage).toHaveBeenCalledWith("differentpage.html", jasmine.any(Function), jasmine.any(Function));
                expect(imagediff.equal).toHaveBeenCalledWith(htmlImage, referenceImage);

                done();
            });
        });

        it("should render page using the viewport's size", function (done) {
            setUpImageDiffAndReturn(true);

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function () {
                expect(render).toHaveBeenCalledWith({
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
            setUpRenderer(htmlImage);

            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });
        });

        it("should provide a appropriately sized page rendering", function (done) {
            csscritic.add({url: "differentpage.html"});
            csscritic.execute(function () {
                expect(render).toHaveBeenCalledWith({
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
            setUpRenderer(htmlImage);

            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediff.equal).not.toHaveBeenCalled();

                done();
            });
        });

        it("should handle page render error", function (done) {
            render.and.returnValue(failedPromise());
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediff.equal).not.toHaveBeenCalled();

                done();
            });
        });

        it("should handle page render error even when reference image exists", function (done) {
            render.and.returnValue(failedPromise());
            readReferenceImage.and.callFake(function (pageUrl, successCallback) {
                successCallback(referenceImage, viewport);
            });

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediff.equal).not.toHaveBeenCalled();

                done();
            });
        });
    });

});
