describe("Utilities", function () {
    describe("drawPageUrl", function () {
        var the_canvas, clearRectSpy;

        beforeEach(function () {
            clearRectSpy = jasmine.createSpy("clearRect");
            the_canvas = {
                width: null,
                height: null,
                getContext: jasmine.createSpy("getContext").andCallFake(function (what) {
                    if (what === "2d") {
                        return {clearRect: clearRectSpy};
                    }
                })
            };

        });

        it("should draw the url to the given canvas", function () {
            var finished = false,
                drawUrlSpy = spyOn(rasterizeHTML, "drawURL").andCallFake(function (url, canvas, callback) {
                    callback(canvas);
                });

            csscritic.util.drawPageUrl("the_url", the_canvas, 42, 7, function () {
                finished = true;
            });

            expect(finished).toBeTruthy();
            expect(the_canvas.width).toEqual(42);
            expect(the_canvas.height).toEqual(7);
            expect(drawUrlSpy).toHaveBeenCalledWith("the_url", the_canvas, jasmine.any(Function));
        });

        it("should clear the area before drawing", function () {
            spyOn(rasterizeHTML, "drawURL").andCallFake(function (url, canvas, callback) {
                callback(canvas);
            });
            csscritic.util.drawPageUrl("the_url", the_canvas, 42, 7, function () {});

            expect(clearRectSpy).toHaveBeenCalledWith(0, 0, 42, 7);
        });

        it("should call the error handler if a page does not exist", function () {
            var hasError = false;

            csscritic.util.drawPageUrl("the_url", the_canvas, 42, 7, function () {}, function () {
                hasError = true;
            });

            waitsFor(function () {
                return hasError;
            });

            runs(function () {
                expect(hasError).toBeTruthy();
            });
        });

        it("should work without a callback", function () {
            spyOn(rasterizeHTML, "drawURL").andCallFake(function (url, canvas, callback) {
                callback(canvas);
            });
            csscritic.util.drawPageUrl("the_url", the_canvas, 42, 7);
        });

        it("should work without a callback on error", function () {
            csscritic.util.drawPageUrl("the_url", the_canvas, 42, 7);
        });
    });

    describe("getCanvasForPageUrl", function () {
        it("should draw the url to a canvas", function () {
            var the_canvas = null,
                drawPageUrlSpy = spyOn(csscritic.util, 'drawPageUrl').andCallFake(function (url, canvas, width, height, successCallback, errorCallback) {
                    successCallback();
                });

            csscritic.util.getCanvasForPageUrl("the_url", 42, 7, function (canvas) {
                the_canvas = canvas;
            }, function () {});

            waitsFor(function () {
                return the_canvas !== null;
            });

            runs(function () {
                expect(the_canvas instanceof HTMLElement).toBeTruthy();
                expect(the_canvas.nodeName).toEqual("CANVAS");

                expect(drawPageUrlSpy).toHaveBeenCalledWith("the_url", the_canvas, 42, 7, jasmine.any(Function), jasmine.any(Function));
            });
        });

        it("should call the error handler if a page does not exist", function () {
            var hasError = false;
            spyOn(csscritic.util, 'drawPageUrl').andCallFake(function (url, canvas, width, height, successCallback, errorCallback) {
                errorCallback();
            });

            csscritic.util.getCanvasForPageUrl("the_url", 42, 7, function () {}, function () {
                hasError = true;
            });

            waitsFor(function () {
                return hasError;
            });

            runs(function () {
                expect(hasError).toBeTruthy();
            });
        });
    });

    describe("getImageForUrl", function () {
        it("should load an image", function () {
            var the_image = null,
                imgUrl = csscriticTestPath + "fixtures/green.png";

            csscritic.util.getImageForUrl(imgUrl, function (image) {
                the_image = image;
            });

            waitsFor(function () {
                return the_image !== null;
            });

            runs(function () {
                expect(the_image instanceof HTMLElement).toBeTruthy();
                expect(the_image.nodeName).toEqual("IMG");
                expect(the_image.src.substr(-imgUrl.length)).toEqual(imgUrl);
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

    describe("getCanvasForImageData", function () {
        var canvas, canvasImageData;

        beforeEach(function () {
            var context;

            // Create some unique canvas
            canvas = window.document.createElement("canvas");
            canvas.width = 4;
            canvas.height = 2;
            context = canvas.getContext("2d");
            context.moveTo(0, 0);
            context.lineTo(2, 2);
            context.stroke();
            canvasImageData = context.getImageData(0, 0, 4, 2);
        });

        it("should return the canvas", function () {
            var resultingCanvas = csscritic.util.getCanvasForImageData(canvasImageData);

            expect(resultingCanvas instanceof HTMLElement).toBeTruthy();
            expect(resultingCanvas.nodeName).toEqual("CANVAS");
            expect(resultingCanvas.width).toEqual(4);
            expect(resultingCanvas.height).toEqual(2);
            expect(resultingCanvas.getContext("2d").getImageData(0, 0, 4, 2).data).toEqual(canvasImageData.data);
        });
    });
});