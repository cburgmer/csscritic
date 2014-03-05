describe("Basic HTML reporter", function () {
    var reporter, htmlImage, referenceImage, updatedReferenceImage, differenceImageCanvas, highlightedDifferenceImageCanvas;

    beforeEach(function () {
        spyOn(csscritic.basicHTMLReporterUtil, 'supportsReadingHtmlFromCanvas');

        reporter = csscritic.BasicHTMLReporter();

        htmlImage = window.document.createElement("img");
        referenceImage = new window.Image();
        updatedReferenceImage = new window.Image();
        differenceImageCanvas = window.document.createElement("canvas");
        highlightedDifferenceImageCanvas = window.document.createElement("canvas");

        spyOn(csscritic.basicHTMLReporterUtil, 'getDifferenceCanvas').and.callFake(function (imageA, imageB) {
            if (imageA === htmlImage && imageB === referenceImage) {
                return differenceImageCanvas;
            }
        });

        spyOn(csscritic.basicHTMLReporterUtil, 'getHighlightedDifferenceCanvas').and.callFake(function (imageA, imageB) {
            if (imageA === htmlImage && imageB === referenceImage) {
                return highlightedDifferenceImageCanvas;
            }
        });
    });

    afterEach(function () {
        $("#csscritic_basichtmlreporter").remove();
    });

    it("should show an entry for the reported test", function () {
        reporter.reportComparison({
            status: "passed",
            pageUrl: "page_url",
            pageImage: htmlImage,
            referenceImage: referenceImage
        });

        expect($("#csscritic_basichtmlreporter")).toExist();
        expect($("#csscritic_basichtmlreporter .comparison")).toExist();
    });

    it("should call the callback when finished reporting comparison", function () {
        var callback = jasmine.createSpy("callback");

        reporter.reportComparison({}, callback);

        expect(callback).toHaveBeenCalled();
    });

    it("should call the callback when finished reporting test suite", function () {
        var callback = jasmine.createSpy('callback'),
            report = {success: 'passed'};

        reporter.report(report, callback);

        expect(callback).toHaveBeenCalled();
    });

    it("should show the page url", function () {
        reporter.reportComparison({
            status: "passed",
            pageUrl: "page_url<img>",
            pageImage: htmlImage,
            referenceImage: referenceImage
        });

        expect($("#csscritic_basichtmlreporter .comparison .pageUrl").text()).toEqual("page_url<img>");
    });

    it("should show a link to the page", function () {
        reporter.reportComparison({
            status: "passed",
            pageUrl: "dir/page_url",
            pageImage: htmlImage,
            referenceImage: referenceImage
        });

        expect($("#csscritic_basichtmlreporter .comparison a.pageUrl")).toHaveAttr("href", "dir/page_url");
    });

    it("should show page render errors", function () {
        reporter.reportComparison({
            status: "passed",
            pageUrl: "page_url<img>",
            renderErrors: ["theFirstBadUrl", "yetAnotherBadUrl"],
            pageImage: htmlImage,
            referenceImage: referenceImage
        });

        expect($("#csscritic_basichtmlreporter .comparison .loadErrors")).toExist();
        expect($("#csscritic_basichtmlreporter .comparison .loadErrors")).toHaveClass("warning");
        expect($("#csscritic_basichtmlreporter .comparison .loadErrors li").length).toEqual(2);
        expect($("#csscritic_basichtmlreporter .comparison .loadErrors li").get(0).textContent).toContain("theFirstBadUrl");
        expect($("#csscritic_basichtmlreporter .comparison .loadErrors li").get(1).textContent).toContain("yetAnotherBadUrl");
    });

    describe("on running tests", function () {

        it("should render all currently running", function () {
            reporter.reportComparisonStarting({
                pageUrl: "page_url"
            });

            expect($("#csscritic_basichtmlreporter .comparison")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison.running")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .pageUrl").text()).toEqual("page_url");
        });

        it("should call the callback when finished reporting", function () {
            var callback = jasmine.createSpy("callback");

            reporter.reportComparisonStarting({}, callback);

            expect(callback).toHaveBeenCalled();
        });

        it("should report the final result 'on top' of the running entry", function () {
            reporter.reportComparisonStarting({
                pageUrl: "page_url"
            });
            reporter.reportComparison({
                status: "passed",
                pageUrl: "page_url",
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter .comparison").length).toEqual(1);
            expect($("#csscritic_basichtmlreporter .comparison.running")).not.toExist();
        });
    });

    describe("on completion", function () {
        it("should render the time taken", function () {
            var dateNowValues = [1000, 2034];
            spyOn(Date, "now").and.callFake(function () {
                return dateNowValues.shift();
            });

            reporter.reportComparisonStarting({
                pageUrl: "some_page.html"
            });
            reporter.report({success: true}, function () {});
            expect($("#csscritic_basichtmlreporter .timeTaken")).toExist();
            expect($("#csscritic_basichtmlreporter .timeTaken").text()).toEqual("finished in 1.034s");
        });

        it("should render the time taken as 0 when no test cases given", function () {
            reporter.report({success: true}, function () {});
            expect($("#csscritic_basichtmlreporter .timeTaken")).toExist();
            expect($("#csscritic_basichtmlreporter .timeTaken").text()).toEqual("finished in 0.000s");
        });
    });

    describe("Passed tests", function () {

        it("should show an entry as passed", function () {
            reporter.reportComparison({
                status: "passed",
                pageUrl: "page_url",
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter .passed.comparison")).toExist();
        });

        it("should show the status as passed", function () {
            reporter.reportComparison({
                status: "passed",
                pageUrl: "page_url",
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

            expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("passed");
        });

    });

    describe("Failed tests", function () {
        var paramsOnFailingTest, resizePageImageSpy, acceptPageSpy;

        beforeEach(function () {
            resizePageImageSpy = jasmine.createSpy("resizePageImage").and.callFake(function (width, height, callback) {
                callback(updatedReferenceImage);
            });
            acceptPageSpy = jasmine.createSpy("acceptPage");

            paramsOnFailingTest = {
                status: "failed",
                pageUrl: "page_url",
                pageImage: htmlImage,
                resizePageImage: resizePageImageSpy,
                acceptPage: acceptPageSpy,
                referenceImage: referenceImage
            };
        });

        it("should show an entry as failed", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .failed.comparison")).toExist();
        });

        it("should show the status as failed", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("failed");
        });

        it("should show the diff on a failing comparison", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .differenceCanvasContainer canvas").get(0)).toBe(differenceImageCanvas);
        });

        it("should show the highlighted diff on a failing comparison", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .highlightedDifferenceCanvas").get(0)).toBe(highlightedDifferenceImageCanvas);
        });

        it("should show the rendered page for reference and so that the user can save it", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer img").get(0)).toBe(htmlImage);
        });

        it("should show a caption with the rendered page", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .outerPageImageContainer .pageImageContainer img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .outerPageImageContainer .caption")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .outerPageImageContainer .caption").text()).toEqual("Page");
        });

        it("should provide an inner div between page container and canvas for styling purposes", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer .innerPageImageContainer img")).toExist();
        });

        it("should show the reference image", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .referenceImageContainer img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .referenceImageContainer img").get(0)).toBe(referenceImage);
        });

        it("should show a caption with the image reference", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .outerReferenceImageContainer .referenceImageContainer img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .outerReferenceImageContainer .caption")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .outerReferenceImageContainer .caption").text()).toEqual("Reference");
        });

        it("should allow the user to accept the rendered page and update the reference image", function () {
            reporter.reportComparison(paramsOnFailingTest);

            expect($("#csscritic_basichtmlreporter .comparison .updateHint")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .updateHint")).toHaveClass("warning");
            expect($("#csscritic_basichtmlreporter .comparison .updateHint").text()).toContain("accept");
            expect($("#csscritic_basichtmlreporter .comparison .updateHint button")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .updateHint .finished").css("display")).toEqual("none");

            $("#csscritic_basichtmlreporter .comparison .updateHint button").click();

            expect(acceptPageSpy).toHaveBeenCalled();
            expect($("#csscritic_basichtmlreporter .comparison .updateHint .finished").css("display")).toEqual("inline");
        });

        it("should resize the page canvas when user resizes the container", function () {
            reporter.reportComparison(paramsOnFailingTest);

            $("#csscritic_basichtmlreporter .comparison .pageImageContainer").css({
                width: 42,
                height: 24
            }).trigger("mouseup");

            expect(resizePageImageSpy).toHaveBeenCalledWith(42, 24, jasmine.any(Function));
            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer img")[0]).toBe(updatedReferenceImage);
        });

    });

    describe("Missing image references", function () {
        var paramsOnMissingReference, resizePageImageSpy, acceptPageSpy;

        beforeEach(function () {
            resizePageImageSpy = jasmine.createSpy("resizePageImage").and.callFake(function (width, height, callback) {
                callback(updatedReferenceImage);
            });
            acceptPageSpy = jasmine.createSpy("acceptPage");

            paramsOnMissingReference = {
                status: "referenceMissing",
                pageUrl: "page_url<img>",
                pageImage: htmlImage,
                resizePageImage: resizePageImageSpy,
                acceptPage: acceptPageSpy
            };
        });

        it("should show an entry as status 'referenceMissing'", function () {
            reporter.reportComparison(paramsOnMissingReference);

            expect($("#csscritic_basichtmlreporter .referenceMissing.comparison")).toExist();
        });

        it("should show the status as 'missing reference'", function () {
            reporter.reportComparison(paramsOnMissingReference);

            expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("missing reference");
        });

        it("should show the rendered page for reference", function () {
            reporter.reportComparison(paramsOnMissingReference);

            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer img").get(0)).toBe(htmlImage);
        });

        it("should allow the user to accept the rendered page", function () {
            reporter.reportComparison(paramsOnMissingReference);

            expect($("#csscritic_basichtmlreporter .comparison .saveHint")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .saveHint")).toHaveClass("warning");
            expect($("#csscritic_basichtmlreporter .comparison .saveHint").text()).toContain("Accept");
            expect($("#csscritic_basichtmlreporter .comparison .saveHint button")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .saveHint .finished").css("display")).toEqual("none");

            $("#csscritic_basichtmlreporter .comparison .saveHint button").click();

            expect(acceptPageSpy).toHaveBeenCalled();
            expect($("#csscritic_basichtmlreporter .comparison .saveHint .finished").css("display")).toEqual("inline");
        });

        it("should provide an inner div between container and canvas for styling purposes", function () {
            reporter.reportComparison(paramsOnMissingReference);

            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer .innerPageImageContainer img")).toExist();
        });

        it("should resize the canvas when user resizes the container", function () {
            reporter.reportComparison(paramsOnMissingReference);

            $("#csscritic_basichtmlreporter .comparison .pageImageContainer").css({
                width: 42,
                height: 24
            }).trigger("mouseup");

            expect(resizePageImageSpy).toHaveBeenCalledWith(42, 24, jasmine.any(Function));
            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer img")[0]).toBe(updatedReferenceImage);
        });

        it("should correctly set the current image size after a resize", function (done) {
            csscriticTestHelper.createImageOfSize(123, 234, function (img) {
                updatedReferenceImage = img;

                reporter.reportComparison(paramsOnMissingReference);

                $("#csscritic_basichtmlreporter .comparison .pageImageContainer").css({
                    width: 42,
                    height: 24
                }).trigger("mouseup");

                expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer").width()).toEqual(123);
                expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer").height()).toEqual(234);

                done();
            });
        });
    });

    describe("Erroneous tests", function () {
        var paramsOnErroneousTest;

        beforeEach(function () {
            paramsOnErroneousTest = {
                status: "error",
                pageUrl: "page_url",
                pageImage: null
            };
        });

        it("should show an entry as erroneous", function () {
            reporter.reportComparison(paramsOnErroneousTest);

            expect($("#csscritic_basichtmlreporter .error.comparison")).toExist();
        });

        it("should show the status is 'error'", function () {
            reporter.reportComparison(paramsOnErroneousTest);

            expect($("#csscritic_basichtmlreporter .comparison .status").text()).toEqual("error");
        });

        it("should say what the error is about", function () {
            reporter.reportComparison(paramsOnErroneousTest);

            expect($("#csscritic_basichtmlreporter .comparison .errorMsg")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .errorMsg")).toHaveClass("warning");
            expect($("#csscritic_basichtmlreporter .comparison .errorMsg").text()).toContain("could not be rendered");
            expect($("#csscritic_basichtmlreporter .comparison .errorMsg").text()).toContain("page_url");
        });

    });

    describe("Mouse over image preview", function () {
        beforeEach(function () {
            reporter.reportComparison({
                status: "passed",
                pageUrl: "page_url",
                pageImage: htmlImage,
                referenceImage: referenceImage
            });

            setFixtures('<style>' +
                '#csscritic_basichtmlreporter_tooltip {' +
                '    width: 100px;' +
                '}' +
                '</style>');
        });

        it("should show a preview image on mouse over", function () {
            expect(typeof $("#csscritic_basichtmlreporter .comparison").get(0).onmouseover).toEqual("function");

            $("#csscritic_basichtmlreporter .comparison").get(0).onmouseover({});

            expect($("#csscritic_basichtmlreporter_tooltip")).toBeVisible();
            expect($("#csscritic_basichtmlreporter_tooltip").children().get(0)).toBe(referenceImage);
        });

        it("should hide the tooltip on mouse out", function () {
            $("#csscritic_basichtmlreporter .comparison").get(0).onmouseover({});

            expect($("#csscritic_basichtmlreporter_tooltip")).toBeVisible();

            $("#csscritic_basichtmlreporter .comparison").get(0).onmouseout();

            expect($("#csscritic_basichtmlreporter_tooltip")).not.toBeVisible();
        });
    });

    describe("Browser compatibility warning", function () {
        afterEach(function () {
            $(".browserWarning").remove();
        });

        it("should show a warning if the browser is not supported", function () {
            csscritic.basicHTMLReporterUtil.supportsReadingHtmlFromCanvas.and.callFake(function (callback) {
                callback(false);
            });

            reporter = csscritic.BasicHTMLReporter();

            expect($(".browserWarning")).toExist();
        });

        it("should not show a warning if the browser is supported", function () {
            csscritic.basicHTMLReporterUtil.supportsReadingHtmlFromCanvas.and.callFake(function (callback) {
                callback(true);
            });

            reporter = csscritic.BasicHTMLReporter();

            expect($(".browserWarning")).not.toExist();
        });
    });
});
