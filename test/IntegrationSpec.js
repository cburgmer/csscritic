describe("Integration", function () {
    var theReferenceImageUri;

    beforeEach(function () {
        theReferenceImageUri = "data:image/png;base64," +
            "iVBORw0KGgoAAAANSUhEUgAAAUoAAACXCAYAAABz/hJAAAADB0lEQVR4nO3UsQ3EMAADMY+ezf39I70iiARuhTv3nKvvdP495+pDs" +
            "Sk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpv" +
            "QYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mO" +
            "QUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FG" +
            "WRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllV" +
            "WxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsS" +
            "k9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQ" +
            "YZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQ" +
            "UVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGW" +
            "RWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVbFpvQYZJRVsSk9BhllVWxKj0FGWRWb0mOQUVYFAAAAAAAAAAAAAAAAAA" +
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC8+QHYzUrJwyGFmgAAAABJRU5ErkJggg==";
    });

    afterEach(function () {
        localStorage.clear();
        csscritic.clear();
        $("#csscritic_basichtmlreporter").remove();
    });

    it("should complete in any browser", function () {
        var testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html",
            passed;

        csscritic.addReporter(csscritic.BasicHTMLReporter());
        csscritic.add(testPageUrl);
        csscritic.execute(function (result) {
            passed = result;
        });

        waitsFor(function () {
            return passed !== undefined;
        });

        runs(function () {
            expect(passed).toBe(false);
            expect($("#csscritic_basichtmlreporter .referenceMissing.comparison")).toExist();
        });
    });

    it("should compare an image with its reference and return true if similar", function () {
        var testImageUrl = csscriticTestPath + "fixtures/redWithLetter.png",
            theReferenceImageUri, passed;

        csscritic.util.getImageForUrl(testImageUrl, function (image) {
            theReferenceImageUri = csscritic.util.getDataURIForImage(image);

        });

        waitsFor(function () {
            return theReferenceImageUri !== undefined;
        });

        runs(function () {
            localStorage.setItem(testImageUrl, JSON.stringify({
                referenceImageUri: theReferenceImageUri
            }));

            csscritic.add(testImageUrl);
            csscritic.execute(function (result) {
                passed = result;
            });
        });

        waitsFor(function () {
            return passed !== undefined;
        });

        runs(function () {
            expect(passed).toBe(true);
        });
    });

    ifNotInWebkitIt("should compare a page with its reference image and return true if similar", function () {
        var testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html",
            passed;

        localStorage.setItem(testPageUrl, JSON.stringify({
            referenceImageUri: theReferenceImageUri
        }));

        csscritic.add(testPageUrl);
        csscritic.execute(function (result) {
            passed = result;
        });

        waitsFor(function () {
            return passed !== undefined;
        });

        runs(function () {
            expect(passed).toBe(true);
        });
    });

    ifNotInWebkitIt("should store a reference when a result is accepted", function () {
        var testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html",
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]),
            passed, sizeAdjusted;

        reporter.reportComparison.andCallFake(function (result, callback) {
            callback();
        });

        csscritic.addReporter(reporter);
        csscritic.add(testPageUrl);
        csscritic.execute(function (result) {
            passed = result;
        });

        waitsFor(function () {
            return passed !== undefined;
        });

        runs(function () {
            expect(passed).toBe(false);
            expect(reporter.reportComparison).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Function));

            reporter.reportComparison.mostRecentCall.args[0].resizePageImage(330, 151, function () {
                sizeAdjusted = true;
            });
        });

        waitsFor(function () {
            return sizeAdjusted;
        });

        runs(function () {
            var referenceObjString, referenceObj;

            reporter.reportComparison.mostRecentCall.args[0].acceptPage();

            referenceObjString = localStorage.getItem(testPageUrl);
            referenceObj = JSON.parse(referenceObjString);
            expect(referenceObj.referenceImageUri).toEqual(theReferenceImageUri);
        });
    });

    ifNotInWebkitIt("should properly report a failing comparison", function () {
        var testPageUrl = csscriticTestPath + "fixtures/brokenPage.html",
            passed;

        localStorage.setItem(testPageUrl, JSON.stringify({
            referenceImageUri: theReferenceImageUri
        }));

        csscritic.addReporter(csscritic.BasicHTMLReporter());
        csscritic.add(testPageUrl);
        csscritic.execute(function (result) {
            passed = result;
        });

        waitsFor(function () {
            return passed !== undefined;
        });

        runs(function () {
            // Make sure we provided all the parameters to the reporter
            expect($("#csscritic_basichtmlreporter .failed.comparison")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .pageUrl").text()).toEqual(testPageUrl);
            expect($("#csscritic_basichtmlreporter .comparison .loadErrors")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .loadErrors").text()).toContain("background_image_does_not_exist.jpg");
            expect($("#csscritic_basichtmlreporter .comparison .differenceCanvasContainer canvas")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .referenceImageContainer img")).toExist();
        });
    });

    ifNotInWebkitIt("should correctly re-render a page overflowing the given viewport", function () {
        var testPageUrl = csscriticTestPath + "fixtures/overflowingPage.html",
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]),
            result, status;

        csscritic.addReporter(reporter);

        // Accept first rendering
        reporter.reportComparison.andCallFake(function (theResult, callback) {
            result = theResult;
            callback();
        });
        csscritic.add(testPageUrl);
        csscritic.execute();

        waitsFor(function () {
            return result !== undefined;
        });

        runs(function () {
            result.acceptPage();
        });

        // Re-render
        runs(function () {
            csscritic.clear();
            csscritic.addReporter(reporter);
            csscritic.add(testPageUrl);
            csscritic.execute(function (theStatus) {
                status = theStatus;
            });
        });

        waitsFor(function () {
            return status !== undefined;
        });

        runs(function () {
            expect(status).toBe(true);
        });
    });

});
