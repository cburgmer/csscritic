describe("Regression testing", function () {
    var getCanvasForPageUrl, getImageForUrl,
        htmlCanvas, referenceImage;

    beforeEach(function () {
        htmlCanvas = jasmine.createSpy('htmlCanvas');
        referenceImage = {
            width: 42,
            height: 7
        };

        getCanvasForPageUrl = spyOn(csscritic.util, 'getCanvasForPageUrl');
        getImageForUrl = spyOn(csscritic.util, 'getImageForUrl');
    });

    afterEach(function () {
        csscritic.clearReporters();
    });

    describe("Reference comparison", function () {

        beforeEach(function () {
            getCanvasForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlCanvas);
            });
            getImageForUrl.andCallFake(function (referenceImageUrl, callback) {
                callback(referenceImage);
            });
        });

        it("should compare a page with a reference image and return 'passed' on success", function () {
            var status, imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').andReturn(true);

            csscritic.compare("samplepage.html", "samplepage_reference.png", function (result) {
                status = result;
            });

            expect(getCanvasForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function));
            expect(getImageForUrl).toHaveBeenCalledWith("samplepage_reference.png", jasmine.any(Function), jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlCanvas, referenceImage);

            expect(status).toEqual('passed');
        });

        it("should compare a page with a reference image and return 'failed' on failure", function () {
            var status, imagediffEqual;

            imagediffEqual = spyOn(imagediff, 'equal').andReturn(false);

            csscritic.compare("differentpage.html", "samplepage_reference.png", function (result) {
                status = result;
            });

            expect(getCanvasForPageUrl).toHaveBeenCalledWith("differentpage.html", 42, 7, jasmine.any(Function));
            expect(getImageForUrl).toHaveBeenCalledWith("samplepage_reference.png", jasmine.any(Function), jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlCanvas, referenceImage);

            expect(status).toEqual("failed");
        });
    });

    describe("Configuration error handling", function () {
        it("should return 'referenceMissing' when the reference image cannot be loaded", function () {
            var status;

            getCanvasForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlCanvas);
            });
            getImageForUrl.andCallFake(function (referenceImageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("samplepage.html", "samplepage_reference.png", function (result) {
                status = result;
            });

            expect(status).toEqual('referenceMissing');
        });

    });

    describe("Reporting", function () {
        var reporter, diffCanvas;

        beforeEach(function () {
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]);
            csscritic.addReporter(reporter);

            diffCanvas = jasmine.createSpy('diffCanvas');
        });

        it("should report a successful comparison", function () {
            spyOn(imagediff, 'equal').andReturn(true);

            getCanvasForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlCanvas);
            });
            getImageForUrl.andCallFake(function (referenceImageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html", "samplepage_reference.png");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageCanvas: htmlCanvas,
                resizePageCanvas: jasmine.any(Function),
                referenceUrl: "samplepage_reference.png",
                referenceImage: referenceImage
            });
        });

        it("should report a canvas showing the difference on a failing comparison", function () {
            var imagediffDiffSpy = spyOn(imagediff, 'diff').andReturn(diffCanvas);
            spyOn(imagediff, 'equal').andReturn(false);

            getCanvasForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlCanvas);
            });
            getImageForUrl.andCallFake(function (referenceImageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html", "samplepage_reference.png");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "failed",
                pageUrl: "differentpage.html",
                pageCanvas: htmlCanvas,
                resizePageCanvas: jasmine.any(Function),
                referenceUrl: "samplepage_reference.png",
                referenceImage: referenceImage,
                differenceImageData: diffCanvas
            });
            expect(imagediffDiffSpy).toHaveBeenCalledWith(htmlCanvas, referenceImage);
        });

        it("should report a missing reference image", function () {
            getCanvasForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlCanvas);
            });
            getImageForUrl.andCallFake(function (referenceImageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html", "samplepage_reference.png");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "referenceMissing",
                pageUrl: "differentpage.html",
                pageCanvas: htmlCanvas,
                resizePageCanvas: jasmine.any(Function),
                referenceUrl: "samplepage_reference.png"
            });
        });

        it("should provide a appropriately sized page rendering on a missing reference image", function () {
            getCanvasForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlCanvas);
            });
            getImageForUrl.andCallFake(function (referenceImageUrl, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.compare("differentpage.html", "samplepage_reference.png");

            expect(getCanvasForPageUrl).toHaveBeenCalledWith("differentpage.html", 800, 600, jasmine.any(Function));
        });

        it("should provide a method to repaint the HTML given width and height", function () {
            var drawPageUrlSpy = spyOn(csscritic.util, 'drawPageUrl').andCallFake(function (url, canvas, width, height, callback) {
                    callback();
                }),
                finished = false;
            spyOn(imagediff, 'equal').andReturn(true);

            getCanvasForPageUrl.andCallFake(function (pageUrl, width, height, callback) {
                callback(htmlCanvas);
            });
            getImageForUrl.andCallFake(function (referenceImageUrl, callback) {
                callback(referenceImage);
            });

            csscritic.compare("differentpage.html", "samplepage_reference.png");

            expect(reporter.reportComparison).toHaveBeenCalledWith({
                status: "passed",
                pageUrl: "differentpage.html",
                pageCanvas: htmlCanvas,
                resizePageCanvas: jasmine.any(Function),
                referenceUrl: "samplepage_reference.png",
                referenceImage: referenceImage
            });

            reporter.reportComparison.mostRecentCall.args[0].resizePageCanvas(16, 34, function () {
                finished = true;
            });

            expect(finished).toBeTruthy();
            expect(drawPageUrlSpy).toHaveBeenCalledWith("differentpage.html", htmlCanvas, 16, 34, jasmine.any(Function));
        });

    });
});
