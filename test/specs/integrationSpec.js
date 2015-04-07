describe("Integration", function () {
    "use strict";

    var windowLocation = {search: ''},
        theReferenceImageUri;

    var util = csscriticLib.util(),
        csscritic;

    var aCssCriticInstance = function () {
        var browserRenderer = csscriticLib.browserRenderer(util, csscriticLib.jobQueue, rasterizeHTML),
            storage = csscriticLib.indexeddbstorage(util),
            reporting = csscriticLib.reporting(browserRenderer, storage, util),
            regression = csscriticLib.regression(browserRenderer, util, imagediff),
            urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);

        var main = csscriticLib.main(
            regression,
            reporting,
            util,
            storage,
            urlQueryFilter);

        var niceReporter = csscriticLib.niceReporter(window,
                                                     util,
                                                     urlQueryFilter,
                                                     csscriticLib.pageNavigationHandlingFallback(),
                                                     rasterizeHTML,
                                                     'dev');

        return {
            addReporter: reporting.addReporter,

            add: main.add,
            execute: main.execute,

            NiceReporter: niceReporter.NiceReporter
        };
    };

    var getDb = function () {
        var defer = ayepromise.defer();

        var request = indexedDB.open('csscritic', 1);
        request.onsuccess = function (event) {
            var db = event.target.result;
            defer.resolve(db);
        };
        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            db.createObjectStore('references', { keyPath: "testCase" });
        };
        return defer.promise;
    };

    var storeReferenceImage = function (key, data) {
        var defer = ayepromise.defer();
        getDb().then(function (db) {
            var request = db.transaction(['references'], 'readwrite')
                    .objectStore('references')
                    .add({testCase: key, reference: data});

            request.onsuccess = function () {
                db.close();
                defer.resolve();
            };
        });
        return defer.promise;
    };

    var readReferenceImage = function (key) {
        var defer = ayepromise.defer();

        getDb().then(function (db) {
            var request = db.transaction(['references'])
                    .objectStore('references')
                    .get(key);

            request.onsuccess = function () {
                db.close();
                // TODO stop using JSON string as interface in test
                defer.resolve(request.result.reference);
            };
        });
        return defer.promise;
    };

    beforeEach(function () {
        csscritic = aCssCriticInstance();
    });

    var originalTitle;

    beforeEach(function () {
        originalTitle = document.title;
    });

    afterEach(function () {
        document.title = originalTitle;
    });

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

    afterEach(function (done) {
        $(".cssCriticNiceReporter").remove();

        var request = indexedDB.deleteDatabase('csscritic');
        request.onsuccess = done;
    });

    ifNotInPhantomIt("should complete in any browser", function (done) {
        var testPageUrl = testHelper.fixture("pageUnderTest.html");

        csscritic.addReporter(csscritic.NiceReporter());
        csscritic.add(testPageUrl);
        csscritic.execute().then(function (passed) {
            expect(passed).toBe(false);
            expect($(".cssCriticNiceReporter .referenceMissing.comparison")).toExist();

            done();
        });
    });

    ifNotInPhantomIt("should compare an image with its reference and return true if similar", function (done) {
        var testImageUrl = testHelper.fixture("redWithLetter.png");

        util.getImageForUrl(testImageUrl).then(function (image) {
            var theReferenceImageUri = util.getDataURIForImage(image);

            return storeReferenceImage(testImageUrl, {
                imageUri: theReferenceImageUri
            });
        }).then(function () {
            csscritic.add(testImageUrl);
            csscritic.execute().then(function (passed) {
                expect(passed).toBe(true);

                done();
            });
        });
    });

    ifNotInWebkitIt("should compare a page with its reference image and return true if similar", function (done) {
        var testPageUrl = testHelper.fixture("pageUnderTest.html");

        storeReferenceImage(testPageUrl, {
            imageUri: theReferenceImageUri
        }).then(function () {
            csscritic.add(testPageUrl);
            csscritic.execute().then(function (passed) {
                expect(passed).toBe(true);

                done();
            });
        });
    });

    ifNotInWebkitIt("should store a reference when a result is accepted", function (done) {
        var testPageUrl = testHelper.fixture("pageUnderTest.html"),
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]);

        csscritic.addReporter(reporter);
        csscritic.add(testPageUrl);
        csscritic.execute().then(function (passed) {
            expect(passed).toBe(false);
            expect(reporter.reportComparison).toHaveBeenCalledWith(jasmine.any(Object));

            reporter.reportComparison.calls.mostRecent().args[0].resizePageImage(330, 151).then(function () {
                reporter.reportComparison.calls.mostRecent().args[0].acceptPage();

                readReferenceImage(testPageUrl).then(function (referenceObj) {
                    expect(referenceObj.imageUri).toEqual(theReferenceImageUri);

                    done();
                });
            });
        });
    });

    ifNotInWebkitIt("should properly report a failing comparison", function (done) {
        var testPageUrl = testHelper.fixture("brokenPage.html");

        storeReferenceImage(testPageUrl, {
            imageUri: theReferenceImageUri
        }).then(function () {
            csscritic.addReporter(csscritic.NiceReporter());
            csscritic.add(testPageUrl);
            csscritic.execute().then(function () {
                expect($(".cssCriticNiceReporter .failed.comparison")).toExist();
                expect($(".cssCriticNiceReporter .comparison .titleLink").text()).toEqual(testPageUrl);
                expect($(".cssCriticNiceReporter .comparison .errorText")).toExist();
                expect($(".cssCriticNiceReporter .comparison .errorText").text()).toContain("background_image_does_not_exist.jpg");
                expect($(".cssCriticNiceReporter .comparison .imageContainer img")).toExist();
                expect($(".cssCriticNiceReporter .comparison .imageContainer canvas")).toExist();
                expect($(".cssCriticNiceReporter .comparison .changedImageContainer canvas")).toExist();

                done();
            });
        });
    });

    ifNotInWebkitIt("should correctly re-render a page overflowing the given viewport", function (done) {
        var testPageUrl = testHelper.fixture("overflowingPage.html"),
            reporter = jasmine.createSpyObj("Reporter", ["reportComparison"]),
            result;

        csscritic.addReporter(reporter);

        // Accept first rendering
        reporter.reportComparison.and.callFake(function (theResult) {
            result = theResult;
        });

        csscritic.add(testPageUrl);
        csscritic.execute().then(function () {
            var anothercsscritic = aCssCriticInstance();
            result.acceptPage();

            anothercsscritic.addReporter(reporter);
            anothercsscritic.add(testPageUrl);
            anothercsscritic.execute().then(function (status) {
                expect(status).toBe(true);

                done();
            });
        });
    });
});
