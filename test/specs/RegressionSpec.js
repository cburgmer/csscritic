describe("Regression testing", function () {
    var getImageForPageUrl, readReferenceImage,
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

    var setUpGetImageForPageUrl = function (image, errors) {
        errors = errors || [];
        getImageForPageUrl.and.returnValue(successfulPromise({
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

        getImageForPageUrl = spyOn(csscritic.renderer, 'getImageForPageUrl');
        readReferenceImage = spyOn(csscritic.storage, 'readReferenceImage');

        spyOn(csscritic.util, 'workAroundTransparencyIssueInFirefox').and.callFake(function (image, callback) {
            callback(image);
        });

        spyOn(imagediff, 'diff');
    });

    afterEach(function () {
        csscritic.clear();
    });

    describe("adding & executing", function () {
        var imagediffEqual;

        var setUpImageDiffAndReturn = function (equal) {
            imagediffEqual.and.returnValue(equal);
        };

        beforeEach(function () {
            imagediffEqual = spyOn(imagediff, 'equal');

            setUpGetImageForPageUrl(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });
        });

        it("should compare a page", function (done) {
            setUpImageDiffAndReturn(true);

            csscritic.add("samplepage.html");

            expect(imagediffEqual).not.toHaveBeenCalled();

            csscritic.execute(function (passed) {
                expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

                expect(passed).toBeTruthy();

                done();
            });
        });

        it("should report fail on a failing test case", function (done) {
            setUpImageDiffAndReturn(false);

            csscritic.add("samplepage.html");

            csscritic.execute(function (passed) {
                expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

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
                expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

                done();
            });
        });

        it("should render page using the viewport's size", function (done) {
            setUpImageDiffAndReturn(true);

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function () {
                expect(getImageForPageUrl).toHaveBeenCalledWith({
                    url: "samplepage.html",
                    width: 98,
                    height: 76,
                    proxyUrl: null
                });

                done();
            });
        });

    });

    describe("First generation of a reference image", function () {
        beforeEach(function () {
            setUpGetImageForPageUrl(htmlImage);

            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });
        });

        it("should provide a appropriately sized page rendering", function (done) {
            csscritic.add({url: "differentpage.html"});
            csscritic.execute(function () {
                expect(getImageForPageUrl).toHaveBeenCalledWith({
                    url: "differentpage.html",
                    width: 800,
                    height: 100,
                    proxyUrl: null
                });

                done();
            });
        });
    });

    describe("Configuration error handling", function () {
        var imagediffEqual;

        beforeEach(function () {
            imagediffEqual = spyOn(imagediff, 'equal');
        });

        it("should handle missing reference image", function (done) {
            setUpGetImageForPageUrl(htmlImage);

            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediffEqual).not.toHaveBeenCalled();

                done();
            });
        });

        it("should handle page render error", function (done) {
            getImageForPageUrl.and.returnValue(failedPromise());
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediffEqual).not.toHaveBeenCalled();

                done();
            });
        });

        it("should handle page render error even when reference image exists", function (done) {
            getImageForPageUrl.and.returnValue(failedPromise());
            readReferenceImage.and.callFake(function (pageUrl, successCallback) {
                successCallback(referenceImage, viewport);
            });

            csscritic.add({url: "samplepage.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(false);
                expect(imagediffEqual).not.toHaveBeenCalled();

                done();
            });
        });
    });

});
