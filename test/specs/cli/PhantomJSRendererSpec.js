describe("PhantomJS renderer", function () {
    "use strict";

    var phantomjsRenderer;

    var oldRequire = window.require,
        fixtureUrl = csscriticTestPath + "fixtures/",
        webpageModuleMock, pageMock, testPageUrl, theReferenceImageUri;

    var setupPageMock = function () {
        pageMock = jasmine.createSpyObj("page", ["open", "renderBase64"]);

        webpageModuleMock = jasmine.createSpyObj("webpage", ["create"]);
        webpageModuleMock.create.and.returnValue(pageMock);

        window.require = jasmine.createSpy("require").and.callFake(function (moduleName) {
            if (moduleName === "webpage") {
                return webpageModuleMock;
            } else {
                return oldRequire(moduleName);
            }
        });
    };

    var getFileUrl = function (address) {
        var fs = require("fs");

        return address.indexOf("://") === -1 ? "file://" + fs.absolute(address) : address;
    };

    beforeEach(function () {
        phantomjsRenderer = csscriticLib.phantomjsRenderer();

        testPageUrl = fixtureUrl + "pageUnderTest.html";

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

        jasmine.addMatchers(imagediffForJasmine2);
    });

    afterEach(function () {
        window.require = oldRequire;
    });

    it("should draw the url to the given canvas", function (done) {
        phantomjsRenderer.render({
            url: testPageUrl,
            width: 330,
            height: 151
        }).then(function (result) {
            testHelper.loadImageFromUrl(theReferenceImageUri, function (referenceImage) {
                expect(result.image).toImageDiffEqual(referenceImage);
                done();
            });
        });
    });

    it("should call the error handler if a page does not exist", function (done) {
        phantomjsRenderer.render({
            url: "the_url_that_doesnt_exist",
            width: 42,
            height: 7
        }).then(null, done);
    });

    it("should call the error handler if a resulting image is erroneous", function (done) {
        setupPageMock();

        pageMock.renderBase64.and.returnValue("broken_img");
        pageMock.open.and.callFake(function (url, callback) {
            callback("success");
        });

        phantomjsRenderer.render({
            url: testPageUrl,
            width: 330,
            height: 151
        }).then(null, done);
    });

    it("should report errors from rendering", function (done) {
        var pageUrl = fixtureUrl + "brokenPage.html";

        phantomjsRenderer.render({
            url: pageUrl,
            width: 42,
            height: 7
        }).then(function (result) {
            var errors = result.errors;
            expect(errors).not.toBeNull();
            errors.sort();
            expect(errors).toEqual([
                "Unable to load resource " + getFileUrl(fixtureUrl + "background_image_does_not_exist.jpg"),
                "Unable to load resource " + getFileUrl(fixtureUrl + "css_does_not_exist.css"),
                "Unable to load resource " + getFileUrl(fixtureUrl + "image_does_not_exist.png")
            ]);

            done();
        });
    });

    it("should report errors from rendering with http urls", function (done) {
        var servedFixtureUrl = localserver + "/" + fixtureUrl,
            pageUrl = servedFixtureUrl + "brokenPage.html";

        phantomjsRenderer.render({
            url: pageUrl,
            width: 42,
            height: 7
        }).then(function (result) {
            var errors = result.errors;
            expect(errors).not.toBeNull();
            errors.sort();
            expect(errors).toEqual([
                "Unable to load resource " + servedFixtureUrl + "background_image_does_not_exist.jpg",
                "Unable to load resource " + servedFixtureUrl + "css_does_not_exist.css",
                "Unable to load resource " + servedFixtureUrl + "image_does_not_exist.png"
            ]);

            done();
        });
    });

    it("should report errors from script execution", function (done) {
        var pageUrl = fixtureUrl + "erroneousJs.html";

        phantomjsRenderer.render({
            url: pageUrl,
            width: 42,
            height: 7
        }).then(function (result) {
            console.log(result.errors);
            expect(result.errors).not.toBeNull();
            expect(result.errors).toEqual(["ReferenceError: Can't find variable: undefinedVar"]);

            done();
        });
    });

});
