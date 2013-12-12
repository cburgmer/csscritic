describe("Reporting", function () {
    var reporter,
        getImageForPageUrl, readReferenceImage,
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

        spyOn(csscritic.util, 'workAroundTransparencyIssueInFirefox').andCallFake(function (image, callback) {
            callback(image);
        });

        spyOn(imagediff, 'diff');

        reporter = jasmine.createSpyObj("Reporter", ["reportComparison", "report"]);
        csscritic.addReporter(reporter);
    });

    afterEach(function () {
        csscritic.clear();
    });

    describe("reportComparisonStarting", function () {
        beforeEach(function () {
            reporter.reportComparisonStarting = jasmine.createSpy("reportComparisonStarting");
        });

        it("should report a starting comparison", function () {
            csscritic.add("samplepage.html");
            csscritic.execute();

            expect(reporter.reportComparisonStarting).toHaveBeenCalledWith({
                pageUrl: "samplepage.html"
            }, jasmine.any(Function));
        });

        it("should only procede once the reporter returned", function () {
            spyOn(imagediff, 'equal').andReturn(true);
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, []);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add("samplepage.html");
            csscritic.execute();

            expect(reporter.reportComparison).not.toHaveBeenCalled();
            reporter.reportComparisonStarting.mostRecentCall.args[1]();
            expect(reporter.reportComparison).toHaveBeenCalled();
        });

    });

    describe("reportComparison", function () {

        it("should call the callback only after the reporter finished", function () {
            var callback = jasmine.createSpy("callback");

            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.compare("samplepage.html", callback);

            expect(callback).not.toHaveBeenCalled();
            reporter.reportComparison.mostRecentCall.args[1]();
            expect(callback).toHaveBeenCalled();

        });

        it("should report a successful comparison", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
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

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
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
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
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
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html");

            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 800, 600, null, jasmine.any(Function), jasmine.any(Function));
        });

        it("should report an error if the page does not exist", function () {
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("samplepage.html");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "error",
                pageUrl: "samplepage.html",
                pageImage: undefined
            }, jasmine.any(Function));
        });

        it("should provide a method to repaint the HTML given width and height", function () {
            var finished = false,
                newHtmlImage = jasmine.createSpy("newHtmlImage"),
                result;
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                if (width === 16) {
                    callback(newHtmlImage);
                } else {
                    callback(htmlImage);
                }
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
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
            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 16, 34, null, jasmine.any(Function));
            expect(result.pageImage).toBe(newHtmlImage);
        });

        it("should provide a method to accept the rendered page and store as new reference", function () {
            var storeReferenceImageSpy = spyOn(csscritic.storage, 'storeReferenceImage');
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
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

            expect(storeReferenceImageSpy).toHaveBeenCalledWith("differentpage.html", htmlImage, jasmine.any(Number), jasmine.any(Number));
        });

        it("should store the viewport's size on accept", function () {
            var storeReferenceImageSpy = spyOn(csscritic.storage, 'storeReferenceImage');

            readReferenceImage.andCallFake(function (pageUrl, callback, errorCallback) {
                errorCallback();
            });
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });

            csscritic.compare("differentpage.html");

            reporter.reportComparison.mostRecentCall.args[0].acceptPage();

            expect(storeReferenceImageSpy).toHaveBeenCalledWith(jasmine.any(String), htmlImage, 800, 600);
        });

        it("should store the viewport's updated size on accept", function () {
            var storeReferenceImageSpy = spyOn(csscritic.storage, 'storeReferenceImage'),
                result;

            readReferenceImage.andCallFake(function (pageUrl, callback, errorCallback) {
                errorCallback();
            });
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });

            csscritic.compare("differentpage.html");

            result = reporter.reportComparison.mostRecentCall.args[0];

            result.resizePageImage(16, 34, function () {});

            result.acceptPage();

            expect(storeReferenceImageSpy).toHaveBeenCalledWith(jasmine.any(String), htmlImage, 16, 34);
        });

        it("should provide a list of errors during rendering", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, ["oneUrl", "anotherUrl"]);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.compare("differentpage.html");

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
            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, ["oneUrl", "anotherUrl"]);
            });
            readReferenceImage.andCallFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html");

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
            spyOn(imagediff, 'equal').andReturn(true);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, []);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
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

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, []);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            reporter.reportComparison.andCallFake(function () {
                expect(callbackTriggered).toBeFalsy();
            });

            csscritic.compare("differentpage.html", function () {
                callbackTriggered = true;
            });

            expect(reporter.reportComparison).toHaveBeenCalled();
        });
    });

    describe("report", function () {

        it("should call final report", function () {
            csscritic.execute();

            expect(reporter.report).toHaveBeenCalledWith({
                success: true
            }, jasmine.any(Function));
        });

        it("should indicate fail in final report", function () {
            spyOn(imagediff, 'equal').andReturn(false);

            getImageForPageUrl.andCallFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.andCallFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
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
