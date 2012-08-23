describe("Regression testing", function () {
    var getCanvasForPageUrl, getImageForUrl,
        htmlCanvas, referenceImageCanvas;

    beforeEach(function () {
        htmlCanvas = jasmine.createSpy('htmlCanvas');
        referenceImageCanvas = {
            width: 42,
            height: 7
        };

        getCanvasForPageUrl = spyOn(cssregressiontester.util, 'getCanvasForPageUrl').andCallFake(function (pageUrl, width, height, callback) {
            callback(htmlCanvas);
        });
        getImageForUrl = spyOn(cssregressiontester.util, 'getImageForUrl').andCallFake(function (referenceImageUrl, callback) {
            callback(referenceImageCanvas);
        });
    });

    it("should compare a page with a reference image and return true on success", function () {
        var success = null,
            imagediffEqual;

        imagediffEqual = spyOn(imagediff, 'equal').andReturn(true);

        cssregressiontester.compare("samplepage.html", "samplepage_reference.png", function (result) {
            success = result;
        });

        waitsFor(function () {
            return success !== null;
        });

        runs(function () {
            expect(getCanvasForPageUrl).toHaveBeenCalledWith("samplepage.html", 42, 7, jasmine.any(Function));
            expect(getImageForUrl).toHaveBeenCalledWith("samplepage_reference.png", jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlCanvas, referenceImageCanvas);

            expect(success).toBeTruthy();
        });
    });

    it("should compare a page with a reference image and return false on failure", function () {
        var success = null,
            imagediffEqual;

        imagediffEqual = spyOn(imagediff, 'equal').andReturn(false);

        success = cssregressiontester.compare("differentpage.html", "samplepage_reference.png", function (result) {
            success = result;
        });

        waitsFor(function () {
            return success !== null;
        });

        runs(function () {
            expect(getCanvasForPageUrl).toHaveBeenCalledWith("differentpage.html", 42, 7, jasmine.any(Function));
            expect(getImageForUrl).toHaveBeenCalledWith("samplepage_reference.png", jasmine.any(Function));
            expect(imagediffEqual).toHaveBeenCalledWith(htmlCanvas, referenceImageCanvas);

            expect(success).toBeFalsy();
        });
    });
});
