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
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
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
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
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

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
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

            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("differentpage.html", jasmine.any(Function), jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlImage, referenceImage);

            expect(status).toEqual("failed");
        });

        it("should make the callback optional", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html");

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));
        });

        it("should make the reference image url optional", function () {
            var status;

            spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html", function (result) {
                status = result;
            });

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
            expect(readReferenceImage).toHaveBeenCalledWith("samplepage.html", jasmine.any(Function), jasmine.any(Function));

            expect(status).toEqual('passed');
        });

        it("should make both reference image url and callback optional", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html");

            expect(getImageForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function), jasmine.any(Function));
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

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, successCallback) {
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

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, successCallback, errorCallback) {
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

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, successCallback, errorCallback) {
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

    describe("Reporting", function () {
        var reporter;

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison", "report"]);
            csscritic.addReporter(reporter);
        });

        it("should call the callback only after the reporter finished", function () {
            var callback = jasmine.createSpy("callback");

            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("samplepage.html", callback);

            expect(callback).not.toHaveBeenCalled();
            reporter.reportComparison.mostRecentCall.args[1]();
            expect(callback).toHaveBeenCalled();

        });

        it("should report a successful comparison", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

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
            spyOn(imagediff, 'equal').andReturn(false);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

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
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function)
            }, jasmine.any(Function));
        });

        it("should provide a appropriately sized page rendering on a missing reference image", function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html");

            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 800, 600, jasmine.any(Function), jasmine.any(Function));
        });

        it("should report an error if the page does not exist", function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("samplepage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "error",
                pageUrl: "samplepage.html",
                pageImage: null
            }, jasmine.any(Function));
        });

        it("should provide a method to repaint the HTML given width and height", function () {
            var finished = false,
                newHtmlImage = jasmine.createSpy("newHtmlImage"),
                result;
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                if (width === 16) {
                    callback(newHtmlImage);
                } else {
                    callback(htmlImage);
                }
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            }, jasmine.any(Function));
            result = reporter.reportComparison.mostRecentCall.args[0];

            result.resizePageImage(16, 34, function () {
                finished = true;
            });

            expect(finished).toBeTruthy();
            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 16, 34, jasmine.any(Function));
            expect(result.pageImage).toBe(newHtmlImage);
        });

        it("should provide a method to accept the rendered page and store as new reference", function () {
            var storeReferenceImageSpy = spyOn(csscritic.storage, 'storeReferenceImage');
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            }, jasmine.any(Function));

            reporter.reportComparison.mostRecentCall.args[0].acceptPage();

            expect(storeReferenceImageSpy).toHaveBeenCalledWith("differentpage.html", htmlImage);
        });

        it("should provide a list of URLs that couldn't be loaded", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage, ["oneUrl", "anotherUrl"]);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                erroneousPageUrls: ["oneUrl", "anotherUrl"],
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function),
                referenceImage: referenceImage
            }, jasmine.any(Function));
        });

        it("should provide a list of URLs that couldn't be loaded independently of whether the reference image exists", function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage, ["oneUrl", "anotherUrl"]);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                pageUrl: "differentpage.html",
                erroneousPageUrls: ["oneUrl", "anotherUrl"],
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function)
            }, jasmine.any(Function));
        });

        it("should not pass along a list if no errors exist", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage, []);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html");

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

            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage, []);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            reporter.reportComparison.andCallFake(function () {
                expect(callbackTriggered).toBeFalsy();
            });

            csscritic.compare("differentpage.html", function () {
                callbackTriggered = true;
            });

            expect(reporter.reportComparison).toHaveBeenCalled();
        });

        it("should call final report", function () {
            csscritic.execute();

            expect(reporter.report).toHaveBeenCalledWith({
                success: true
            }, jasmine.any(Function));
        });

        it("should indicate fail in final report", function () {
            spyOn(imagediff, 'equal').andReturn(false);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.add("failingpage.html");

            csscritic.execute();

            reporter.reportComparison.mostRecentCall.args[1]();
            expect(reporter.report).toHaveBeenCalledWith({
                success: false
            }, jasmine.any(Function));
        });

    });

});
