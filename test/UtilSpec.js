describe("Utilities", function () {
    var drawUrlSpy;

    beforeEach(function () {
        drawUrlSpy = spyOn(rasterizeHTML, "drawURL").andCallFake(function (url, canvas, callback) {
            callback(canvas);
        });
    });

    describe("getCanvasForPageUrl", function () {
        it("should draw the url to a canvas", function () {
            var the_canvas = null;

            csscritic.util.getCanvasForPageUrl("the_url", 42, 7, function (canvas) {
                the_canvas = canvas;
            });

            waitsFor(function () {
                return the_canvas !== null;
            });

            runs(function () {
                expect(the_canvas instanceof HTMLElement).toBeTruthy();
                expect(the_canvas.nodeName).toEqual("CANVAS");

                expect(the_canvas.width).toEqual(42);
                expect(the_canvas.height).toEqual(7);
                expect(drawUrlSpy).toHaveBeenCalledWith("the_url", the_canvas, jasmine.any(Function));
            });
        });
    });

    describe("getImageForUrl", function () {
        it("should load an image", function () {
            var the_image = null;

            csscritic.util.getImageForUrl("fixtures/green.png", function (image) {
                the_image = image;
            });

            waitsFor(function () {
                return the_image !== null;
            });

            runs(function () {
                expect(the_image instanceof HTMLElement).toBeTruthy();
                expect(the_image.nodeName).toEqual("IMG");
                expect(the_image.src.substr(-"fixtures/green.png".length)).toEqual("fixtures/green.png");
            });

        });

        it("should handle a missing image", function () {
            var errorCalled = false;

            csscritic.util.getImageForUrl("does_not_exist.png", function () {}, function () {
                errorCalled = true;
            });

            waitsFor(function () {
                return errorCalled;
            });

            runs(function () {
                expect(errorCalled).toBeTruthy();
            });
        });
    });
});