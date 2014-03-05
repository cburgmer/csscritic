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

        spyOn(csscritic.util, 'workAroundTransparencyIssueInFirefox').and.callFake(function (image, callback) {
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
            spyOn(imagediff, 'equal').and.returnValue(true);
            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, []);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add("samplepage.html");
            csscritic.execute();

            expect(reporter.reportComparison).not.toHaveBeenCalled();
            reporter.reportComparisonStarting.calls.mostRecent().args[1]();
            expect(reporter.reportComparison).toHaveBeenCalled();
        });

    });

    describe("reportComparison", function () {

        it("should call the callback only after the reporter finished", function () {
            var callback = jasmine.createSpy("callback");

            spyOn(imagediff, 'equal').and.returnValue(true);

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.compare({url: "samplepage.html"}, callback);

            expect(callback).not.toHaveBeenCalled();
            reporter.reportComparison.calls.mostRecent().args[1]();
            expect(callback).toHaveBeenCalled();

        });

        it("should report a successful comparison", function () {
            spyOn(imagediff, 'equal').and.returnValue(true);

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.compare({url: "differentpage.html"});

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
            spyOn(imagediff, 'equal').and.returnValue(false);

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.compare({url: "differentpage.html"});

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
            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare({url: "differentpage.html"});

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                pageUrl: "differentpage.html",
                pageImage: htmlImage,
                resizePageImage: jasmine.any(Function),
                acceptPage: jasmine.any(Function)
            }, jasmine.any(Function));
        });

        it("should report an error if the page does not exist", function () {
            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, successCallback, errorCallback) {
                errorCallback();
            });
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare({url: "samplepage.html"});

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
            spyOn(imagediff, 'equal').and.returnValue(true);

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                if (width === 16) {
                    callback(newHtmlImage);
                } else {
                    callback(htmlImage);
                }
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.compare({url: "differentpage.html"});

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
            expect(getImageForPageUrl).toHaveBeenCalledWith("differentpage.html", 16, 34, null, jasmine.any(Function));
            expect(result.pageImage).toBe(newHtmlImage);
        });

        it("should provide a method to accept the rendered page and store as new reference", function () {
            var storeReferenceImageSpy = spyOn(csscritic.storage, 'storeReferenceImage');
            spyOn(imagediff, 'equal').and.returnValue(true);

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.compare({url: "differentpage.html"});

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
            var storeReferenceImageSpy = spyOn(csscritic.storage, 'storeReferenceImage');

            readReferenceImage.and.callFake(function (pageUrl, callback, errorCallback) {
                errorCallback();
            });
            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });

            csscritic.compare({url: "differentpage.html"});

            reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

            expect(storeReferenceImageSpy).toHaveBeenCalledWith(jasmine.any(String), htmlImage, {
                width: 800,
                height: 100
            });
        });

        it("should store the viewport's updated size on accept", function () {
            var storeReferenceImageSpy = spyOn(csscritic.storage, 'storeReferenceImage'),
                result;

            readReferenceImage.and.callFake(function (pageUrl, callback, errorCallback) {
                errorCallback();
            });
            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });

            csscritic.compare({url: "differentpage.html"});

            result = reporter.reportComparison.calls.mostRecent().args[0];

            result.resizePageImage(16, 34, function () {});

            result.acceptPage();

            expect(storeReferenceImageSpy).toHaveBeenCalledWith(jasmine.any(String), htmlImage, {
                width: 16,
                height: 34
            });
        });

        it("should provide a list of errors during rendering", function () {
            spyOn(imagediff, 'equal').and.returnValue(true);

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, ["oneUrl", "anotherUrl"]);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.compare({url: "differentpage.html"});

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
            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, ["oneUrl", "anotherUrl"]);
            });
            readReferenceImage.and.callFake(function (pageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare({url: "differentpage.html"});

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
            spyOn(imagediff, 'equal').and.returnValue(true);

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, []);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.compare({url: "differentpage.html"});

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

            spyOn(imagediff, 'equal').and.returnValue(true);

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage, []);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            reporter.reportComparison.and.callFake(function () {
                expect(callbackTriggered).toBeFalsy();
            });

            csscritic.compare({url: "differentpage.html"}, function () {
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
            spyOn(imagediff, 'equal').and.returnValue(false);

            getImageForPageUrl.and.callFake(function (pageUrl, width, height, proxyUrl, callback) {
                callback(htmlImage);
            });
            readReferenceImage.and.callFake(function (pageUrl, callback) {
                callback(referenceImage, viewport);
            });

            csscritic.add("failingpage.html");

            csscritic.execute();

            reporter.reportComparison.calls.mostRecent().args[1]();
            expect(reporter.report).toHaveBeenCalledWith({
                success: false
            }, jasmine.any(Function));
        });
    });
});
