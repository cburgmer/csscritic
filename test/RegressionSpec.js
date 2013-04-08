describe("Regression testing", function () {
    var getImageForPageUrl, readReferenceImage,
        htmlImage, referenceImage;

    beforeEach(function () {
        htmlImage = jasmine.createSpy('htmlImage');
        referenceImage = {
            width: 42,
            height: 7
        };

        getImageForPageUrl = spyOn(csscritic.renderer, 'getImageForPageUrl');
        readReferenceImage = spyOn(csscritic.storage, 'readReferenceImage');

        spyOn(csscritic.util, 'workAroundTransparencyIssueInFirefox').andCallFake(function (image, callback) {
            callback(image);
        });

        spyOn(imagediff, 'diff');
    });

    afterEach(function () {
        csscritic.clear();
    });

    describe("adding & executing", function () {
        beforeEach(function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });
        });

        it("should compare a page", function () {
            var passed = null,
                imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').andReturn(true);

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

            imagediffEqual = spyOn(imagediff, 'equal').andReturn(false);

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
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });
        });

        it("should compare a page with a reference image and return 'passed' on success", function () {
            var status, imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, null, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

            expect(status).toEqual('passed');
        });

        it("should compare a page with a reference image and return 'failed' on failure", function () {
            var status, imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').andReturn(false);

            csscritic.compare("differentpage.html", function (result) {
                status = result;
            });

            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 42, 7, null, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("differentpage.html", jasmine.any(Function), jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

            expect(status).toEqual("failed");
        });

        it("should make the callback optional", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html");

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, null, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));
        });

        it("should make the reference image url optional", function () {
            var status;

            spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, null, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));

            expect(status).toEqual('passed');
        });

        it("should make both reference image url and callback optional", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html");

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, null, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));
        });
    });

    describe("Configuration error handling", function () {
        var imagediffEqual;

        beforeEach(function () {
            imagediffEqual = spyOn(imagediff, 'equal');
        });

        it("should return 'referenceMissing' if the reference image cannot be loaded", function () {
            var status;

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, successCallback) {
                successCallback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(status).toEqual('referenceMissing');
            expect(imagediffEqual).not.toHaveBeenCalled();
        });

        it("should return 'error' if the page does not exist", function () {
            var status;

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(status).toEqual('error');
            expect(imagediffEqual).not.toHaveBeenCalled();
        });

        it("should return 'error' if the page does not exist even if the reference image does", function () {
            var status;

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback) {
                successCallback(referenceImage);
            });

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(status).toEqual('error');
            expect(imagediffEqual).not.toHaveBeenCalled();
        });
    });

});
