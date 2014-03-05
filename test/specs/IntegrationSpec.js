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

    it("should complete in any browser", function (done) {
        var testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html";

        csscritic.addReporter(csscritic.BasicHTMLReporter());
        csscritic.add(testPageUrl);
        csscritic.execute(function (passed) {
            expect(passed).toBe(false);
            expect($("#csscritic_basichtmlreporter .referenceMissing.comparison")).toExist();

            done();
        });
    });

    it("should compare an image with its reference and return true if similar", function (done) {
        var testImageUrl = csscriticTestPath + "fixtures/redWithLetter.png";

        csscritic.util.getImageForUrl(testImageUrl, function (image) {
            var theReferenceImageUri = csscritic.util.getDataURIForImage(image);

            localStorage.setItem(testImageUrl, JSON.stringify({
                referenceImageUri: theReferenceImageUri
            }));

            csscritic.add(testImageUrl);
            csscritic.execute(function (passed) {
                expect(passed).toBe(true);

                done();
            });
        });
    });

    ifNotInWebkitIt("should compare a page with its reference image and return true if similar", function (done) {
        var testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html";

        localStorage.setItem(testPageUrl, JSON.stringify({
            referenceImageUri: theReferenceImageUri
        }));

        csscritic.add(testPageUrl);
        csscritic.execute(function (passed) {
            expect(passed).toBe(true);

            done();
        });

    });

    ifNotInWebkitIt("should store a reference when a result is accepted", function (done) {
        var testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html",
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]);

        reporter.reportComparison.and.callFake(function (result, callback) {
            callback();
        });

        csscritic.addReporter(reporter);
        csscritic.add(testPageUrl);
        csscritic.execute(function (passed) {
            expect(passed).toBe(false);
            expect(reporter.reportComparison).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Function));

            reporter.reportComparison.calls.mostRecent().args[0].resizePageImage(330, 151, function () {
                var referenceObjString, referenceObj;

                reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

                referenceObjString = localStorage.getItem(testPageUrl);
                referenceObj = JSON.parse(referenceObjString);
                expect(referenceObj.referenceImageUri).toEqual(theReferenceImageUri);

                done();
            });
        });
    });

    ifNotInWebkitIt("should properly report a failing comparison", function (done) {
        var testPageUrl = csscriticTestPath + "fixtures/brokenPage.html";

        localStorage.setItem(testPageUrl, JSON.stringify({
            referenceImageUri: theReferenceImageUri
        }));

        csscritic.addReporter(csscritic.BasicHTMLReporter());
        csscritic.add(testPageUrl);
        csscritic.execute(function () {
            expect($("#csscritic_basichtmlreporter .failed.comparison")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .pageUrl").text()).toEqual(testPageUrl);
            expect($("#csscritic_basichtmlreporter .comparison .loadErrors")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .loadErrors").text()).toContain("background_image_does_not_exist.jpg");
            expect($("#csscritic_basichtmlreporter .comparison .differenceCanvasContainer canvas")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .pageImageContainer img")).toExist();
            expect($("#csscritic_basichtmlreporter .comparison .referenceImageContainer img")).toExist();

            done();
        });
    });

    ifNotInWebkitIt("should correctly re-render a page overflowing the given viewport", function (done) {
        var testPageUrl = csscriticTestPath + "fixtures/overflowingPage.html",
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]),
            result;

        csscritic.addReporter(reporter);

        // Accept first rendering
        reporter.reportComparison.and.callFake(function (theResult, callback) {
            result = theResult;
            callback();
        });
        csscritic.add(testPageUrl);
        csscritic.execute(function () {
            result.acceptPage();

            csscritic.clear();
            csscritic.addReporter(reporter);
            csscritic.add(testPageUrl);
            csscritic.execute(function (status) {
                expect(status).toBe(true);

                done();
            });
        });
    });

});
