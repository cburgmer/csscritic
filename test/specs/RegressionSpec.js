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
        beforeEach(function () {
            setUpGetImageForPageUrl(htmlImage);
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });
        });

        it("should compare a page", function (done) {
            var imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').and.returnValue(true);

            csscritic.add("samplepage.html");

            expect(imagediffEqual).not.toHaveBeenCalled();

            csscritic.execute(function (passed) {
                expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

                expect(passed).toBeTruthy();

                done();
            });
        });

        it("should report fail on a failing test case", function (done) {
            var imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').and.returnValue(false);

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
    });

    describe("Reference comparison", function () {
        beforeEach(function () {
            setUpGetImageForPageUrl(htmlImage);

            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });
        });

        it("should read the reference image and compare against the rendered page", function (done) {
            var imagediffEqual = spyOn(imagediff, 'equal');

            csscritic.compare({url: "differentpage.html"}, function () {
                expect(readReferenceImage).toHaveBeenCalledWith("differentpage.html", jasmine.any(Function), jasmine.any(Function));
                expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

                done();
            });
        });

        it("should render page using the viewport's size", function (done) {
            spyOn(imagediff, 'equal');

            csscritic.compare({url: "samplepage.html"}, function () {
                expect(getImageForPageUrl).toHaveBeenCalledWith({
                    url: "samplepage.html",
                    width: 98,
                    height: 76,
                    proxyUrl: null
                });

                done();
            });
        });

        it("should compare a page and return 'passed' on success", function (done) {
            var imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').and.returnValue(true);

            csscritic.compare({url: "samplepage.html"}, function (status) {
                expect(status).toEqual('passed');

                done();
            });
        });

        it("should compare a page and return 'failed' on failure", function (done) {
            var imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').and.returnValue(false);

            csscritic.compare({url: "differentpage.html"}, function (status) {
                expect(status).toEqual("failed");

                done();
            });
        });

        it("should make the callback optional", function () {
            spyOn(imagediff, 'equal').and.returnValue(true);

            csscritic.compare({url: "samplepage.html"});
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
            csscritic.compare({url: "differentpage.html"}, function () {
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

        it("should return 'referenceMissing' if the reference image cannot be loaded", function (done) {
            setUpGetImageForPageUrl(htmlImage);

            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare({url: "samplepage.html"}, function (status) {
                expect(status).toEqual('referenceMissing');
                expect(imagediffEqual).not.toHaveBeenCalled();

                done();
            });
        });

        it("should return 'error' if the page does not exist", function (done) {
            getImageForPageUrl.and.returnValue(failedPromise());
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare({url: "samplepage.html"}, function (status) {
                expect(status).toEqual('error');
                expect(imagediffEqual).not.toHaveBeenCalled();

                done();
            });
        });

        it("should return 'error' if the page does not exist even if the reference image does", function (done) {
            getImageForPageUrl.and.returnValue(failedPromise());
            readReferenceImage.and.callFake(function (pageUrl, successCallback) {
                successCallback(referenceImage, viewport);
            });

            csscritic.compare({url: "samplepage.html"}, function (status) {
                expect(status).toEqual('error');
                expect(imagediffEqual).not.toHaveBeenCalled();

                done();
            });
        });
    });

});
