describe("BasicHTMLReporter utilities", function () {
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
            var resultingCanvas = csscritic.basicHTMLReporterUtils.getCanvasForImageData(canvasImageData);

            expect(resultingCanvas instanceof HTMLElement).toBeTruthy();
            expect(resultingCanvas.nodeName).toEqual("CANVAS");
            expect(resultingCanvas.width).toEqual(4);
            expect(resultingCanvas.height).toEqual(2);
            expect(resultingCanvas.getContext("2d").getImageData(0, 0, 4, 2).data).toEqual(canvasImageData.data);
        });
    });

});