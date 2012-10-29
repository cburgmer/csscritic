describe("PhantomJS renderer", function () {
    var oldRequire = window.require,
        fsModuleMock, webpageModuleMock, pageMock, testPageUrl, imageBase64, theReferenceImageUri;

    beforeEach(function () {
        testPageUrl = csscriticTestPath + "fixtures/pageUnderTest.html";

        imageBase64 =
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
        theReferenceImageUri = "data:image/png;base64," + imageBase64;

        fsModuleMock = jasmine.createSpyObj("fs", ["absolute"]);
        fsModuleMock.absolute.andCallFake(function (path) { return path; });

        pageMock = jasmine.createSpyObj("page", ["open", "renderBase64"]);
        pageMock.renderBase64.andReturn(imageBase64);

        webpageModuleMock = jasmine.createSpyObj("webpage", ["create"]);
        webpageModuleMock.create.andReturn(pageMock);

        window.require = jasmine.createSpy("require").andCallFake(function (moduleName) {
            if (moduleName === "fs") {
                return fsModuleMock;
            } else if (moduleName === "webpage") {
                return webpageModuleMock;
            }
        });

        this.addMatchers(imagediff.jasmine);
    });

    afterEach(function () {
        window.require = oldRequire;
    });

    it("should draw the url to the given canvas", function () {
        var image = null,
            referenceImage = null;

        pageMock.open.andCallFake(function (url, callback) {
            callback("success");
        });

        csscritic.renderer.phantomjsRenderer(testPageUrl, 330, 151, function (result_image) {
            image = result_image;
        });

        csscriticTestHelper.loadImageFromUrl(theReferenceImageUri, function (result_image) {
            referenceImage = result_image;
        });

        waitsFor(function () {
            return image !== null && referenceImage !== null;
        });

        runs(function () {
            expect(image).toImageDiffEqual(referenceImage);
            expect(pageMock.viewportSize).toEqual({
                width: 330,
                height: 151
            });
        });
    });

    it("should call the error handler if a page does not exist", function () {
        var hasError = false;

        pageMock.open.andCallFake(function (url, callback) {
            callback("fail");
        });

        csscritic.renderer.phantomjsRenderer("the_url_that_doesnt_exist", 42, 7, function () {}, function () {
            hasError = true;
        });

        waitsFor(function () {
            return hasError;
        });

        runs(function () {
            expect(hasError).toBeTruthy();
        });
    });

    it("should call the error handler if a resulting image is erroneous", function () {
        var hasError = false;

        pageMock.renderBase64.reset();
        pageMock.renderBase64.andReturn("broken_img");
        pageMock.open.andCallFake(function (url, callback) {
            callback("success");
        });

        csscritic.renderer.phantomjsRenderer(testPageUrl, 330, 151, function () {}, function () {
            hasError = true;
        });

        waitsFor(function () {
            return hasError;
        });

        runs(function () {
            expect(hasError).toBeTruthy();
        });
    });

    it("should work without a callback on error", function () {
        pageMock.open.andCallFake(function (url, callback) {
            callback("fail");
        });

        csscritic.renderer.phantomjsRenderer("the_url", 42, 7);
    });

});