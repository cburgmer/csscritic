describe("Reporter", function () {
    describe("Basic HTML reporter", function () {
        var reporter, htmlCanvas, referenceImage, differenceImageCanvas, differenceImageData;

        beforeEach(function () {
            reporter = csscritic.BasicHTMLReporter();

            htmlCanvas = window.document.createElement("canvas");
            referenceImage = new window.Image();
            differenceImageCanvas = window.document.createElement("canvas");
            differenceImageData = differenceImageCanvas.getContext("2d").createImageData(1, 1);
            
            spyOn(csscritic.util, 'getCanvasForImageData').andCallFake(function (differenceImageData) {
                return differenceImageCanvas;
            });
        });

        afterEach(function () {
            $("#csscritic_basichtmlreporter").remove();
        });

        it("should show an entry for the reported test", function () {
            reporter.reportComparison({
                status: "passed",
                pageUrl: "page_url",
                pageCanvas: htmlCanvas,
                referenceUrl: "reference_img_url",
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison")).toExist();
        });

        it("should show the page url", function () {
            reporter.reportComparison({
                status: "passed",
                pageUrl: "page_url<img>",
                pageCanvas: htmlCanvas,
                referenceUrl: "reference_img_url",
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter .comparison .pageUrl").text()).toEqual("page_url<img>");
        });

        describe("Passed tests", function () {

            it("should show an entry as passed", function () {
                reporter.reportComparison({
                    status: "passed",
                    pageUrl: "page_url",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url",
                    referenceImage: referenceImage
                });

                expect($("#csscritic_basichtmlreporter .passed.comparison")).toExist();
            });

            it("should show the status as passed", function () {
                reporter.reportComparison({
                    status: "passed",
                    pageUrl: "page_url",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url",
                    referenceImage: referenceImage
                });

                expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("passed");
            });

        });

        describe("Failed tests", function () {

            it("should show an entry as failed", function () {
                reporter.reportComparison({
                    status: "failed",
                    pageUrl: "page_url",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url",
                    referenceImage: referenceImage,
                    differenceImageData: differenceImageData
                });

                expect($("#csscritic_basichtmlreporter .failed.comparison")).toExist();
            });

            it("should show the status as failed", function () {
                reporter.reportComparison({
                    status: "failed",
                    pageUrl: "page_url",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url",
                    referenceImage: referenceImage,
                    differenceImageData: differenceImageData
                });

                expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("failed");
            });

            it("should show the diff on a failing comparison", function () {
                reporter.reportComparison({
                    status: "failed",
                    pageUrl: "page_url<img>",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url",
                    referenceImage: referenceImage,
                    differenceImageData: differenceImageData
                });

                expect($("#csscritic_basichtmlreporter .comparison .differenceCanvas canvas").get(0)).toBe(differenceImageCanvas);
            });

        });

        describe("Missing image references", function () {

            it("should show an entry as status 'referenceMissing'", function () {
                reporter.reportComparison({
                    status: "referenceMissing",
                    pageUrl: "page_url<img>",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url"
                });

                expect($("#csscritic_basichtmlreporter .referenceMissing.comparison")).toExist();
            });

            it("should show the status as 'missing reference'", function () {
                reporter.reportComparison({
                    status: "referenceMissing",
                    pageUrl: "page_url<img>",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url"
                });

                expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("missing reference");
            });

            it("should indicate a missing reference image", function () {
                reporter.reportComparison({
                    status: "referenceMissing",
                    pageUrl: "page_url<img>",
                    pageCanvas: htmlCanvas,
                    referenceUrl: "reference_img_url"
                });

                expect($("#csscritic_basichtmlreporter .comparison .pageCanvas canvas").get(0)).toBe(htmlCanvas);
            });

        });
    });
});
