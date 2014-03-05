describe("Regression testing", function () {
    var getImageForPageUrl, readReferenceImage,
        htmlImage, referenceImage, viewport;

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
            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });
        });

        it("should compare a page", function () {
            var passed = null,
                imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').and.returnValue(true);

            csscritic.add("samplepage.html");

            expect(imagediffEqual).not.toHaveBeenCalled();

            csscritic.execute(function (result) {
                passed = result;
            });

            expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

            expect(passed).toBeTruthy();
        });

        it("should report fail on a failing test case", function () {
            var passed = null,
                imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').and.returnValue(false);

            csscritic.add("samplepage.html");

            csscritic.execute(function (result) {
                passed = result;
            });

            expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

            expect(passed).toBeFalsy();
        });

        it("should return on an empty list of tests", function () {
            var passed = null;

            csscritic.execute(function (result) {
                passed = result;
            });

            expect(passed).toBeTruthy();
        });

        it("should handle a missing callback", function () {
            csscritic.execute();
        });
    });

    describe("Reference comparison", function () {
        beforeEach(function () {
            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });
        });

        it("should read the reference image and compare against the rendered page", function () {
            var imagediffEqual = spyOn(imagediff, 'equal');

            csscritic.compare({url: "differentpage.html"}, function () {});

            expect(readReferenceImage).toHaveBeenCalledWith("differentpage.html", jasmine.any(Function), jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);
        });

        it("should render page using the viewport's size", function () {
            spyOn(imagediff, 'equal');

            csscritic.compare({url: "samplepage.html"}, function () {});

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 98, 76, null, jasmine.any(Function), jasmine.any(Function));
        });

        it("should compare a page and return 'passed' on success", function () {
            var status, imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').and.returnValue(true);

            csscritic.compare({url: "samplepage.html"}, function (result) {
                status = result;
            });

            expect(status).toEqual('passed');
        });

        it("should compare a page and return 'failed' on failure", function () {
            var status, imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').and.returnValue(false);

            csscritic.compare({url: "differentpage.html"}, function (result) {
                status = result;
            });

            expect(status).toEqual("failed");
        });

        it("should make the callback optional", function () {
            spyOn(imagediff, 'equal').and.returnValue(true);

            csscritic.compare({url: "samplepage.html"});
        });
    });

    describe("First generation of a reference image", function () {
        beforeEach(function () {
            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });
        });

        it("should provide a appropriately sized page rendering", function () {
            csscritic.compare({url: "differentpage.html"});

            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 800, 100, null, jasmine.any(Function), jasmine.any(Function));
        });
    });

    describe("Configuration error handling", function () {
        var imagediffEqual;

        beforeEach(function () {
            imagediffEqual = spyOn(imagediff, 'equal');
        });

        it("should return 'referenceMissing' if the reference image cannot be loaded", function () {
            var status;

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, successCallback) {
                successCallback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare({url: "samplepage.html"}, function (result) {
                status = result;
            });

            expect(status).toEqual('referenceMissing');
            expect(imagediffEqual).not.toHaveBeenCalled();
        });

        it("should return 'error' if the page does not exist", function () {
            var status;

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare({url: "samplepage.html"}, function (result) {
                status = result;
            });

            expect(status).toEqual('error');
            expect(imagediffEqual).not.toHaveBeenCalled();
        });

        it("should return 'error' if the page does not exist even if the reference image does", function () {
            var status;

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.and.callFake(function (pageUrl, successCallback) {
                successCallback(referenceImage, viewport);
            });

            csscritic.compare({url: "samplepage.html"}, function (result) {
                status = result;
            });

            expect(status).toEqual('error');
            expect(imagediffEqual).not.toHaveBeenCalled();
        });
    });

});
