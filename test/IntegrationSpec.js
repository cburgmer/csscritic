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
        csscritic.clearReporters();
        $("#csscritic_basichtmlreporter").remove();
    });

    it("should complete in any browser", function () {
        var resultStatus = null,
            testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html";

        csscritic.addReporter(csscritic.BasicHTMLReporter());
        csscritic.compare(testPageUrl, function (result) {
            resultStatus = result;
        });

        waitsFor(function () {
            return resultStatus !== null;
        });

        runs(function () {
            expect(resultStatus).toEqual("referenceMissing");
            expect($("#csscritic_basichtmlreporter .referenceMissing.comparison")).toExist();
        });
    });

    it("should compare an image with its reference and return true if similar", function () {
        var resultStatus = null,
            testImageUrl = csscriticTestPath + "fixtures/redWithLetter.png",
            theReferenceImageUri;

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

            csscritic.compare(testImageUrl, function (result) {
                resultStatus = result;
            });
        });

        waitsFor(function () {
            return resultStatus !== null;
        });

        runs(function () {
            expect(resultStatus).toEqual("passed");
        });
    });

    ifNotInWebkitIt("should compare a page with its reference image and return true if similar", function () {
        var resultStatus = null,
            testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html";

        localStorage.setItem(testPageUrl, JSON.stringify({
            referenceImageUri: theReferenceImageUri
        }));

        csscritic.compare(testPageUrl, function (result) {
            resultStatus = result;
        });

        waitsFor(function () {
            return resultStatus !== null;
        });

        runs(function () {
            expect(resultStatus).toEqual("passed");
        });
    });

    ifNotInWebkitIt("should store a reference when a result is accepted", function () {
        var resultStatus = null,
            sizeAdjusted = false,
            testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html",
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]);

        reporter.reportComparison.andCallFake(function (result, callback) {
            callback();
        });

        csscritic.addReporter(reporter);
        csscritic.compare(testPageUrl, function (result) {
            resultStatus = result;
        });

        waitsFor(function () {
            return resultStatus !== null;
        });

        runs(function () {
            expect(resultStatus).toEqual("referenceMissing");
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
        var test_result = null,
            testPageUrl = csscriticTestPath + "fixtures/brokenPage.html";

        localStorage.setItem(testPageUrl, JSON.stringify({
            referenceImageUri: theReferenceImageUri
        }));

        csscritic.addReporter(csscritic.BasicHTMLReporter());
        csscritic.compare(testPageUrl, function (result) {
            test_result = result;
        });

        waitsFor(function () {
            return test_result !== null;
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
        csscritic.compare(testPageUrl);

        waitsFor(function () {
            return result !== undefined;
        });

        runs(function () {
            result.acceptPage();
        });

        // Re-render
        runs(function () {
            csscritic.compare(testPageUrl, function (theStatus) {
                status = theStatus;
            });
        });

        waitsFor(function () {
            return status !== undefined;
        });

        runs(function () {
            expect(status).toEqual('passed');
        });
    });

});
