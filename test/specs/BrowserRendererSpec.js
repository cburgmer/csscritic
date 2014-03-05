describe("Browser renderer", function () {
    var the_image;

    beforeEach(function () {
        the_image = "the_image";

        spyOn(csscritic.util.queue, 'execute').and.callFake(function (func) {
            func(function () {});
        });
    });

    it("should draw an image directly", function () {
        var image = null,
            theUrl = "the url",
            theBinaryContent = "the content",
            theImage = "the image";

        spyOn(csscritic.util, 'ajax').and.callFake(function (url, successCallback) {
            if (url === theUrl) {
                successCallback(theBinaryContent);
            }
        });
        spyOn(csscritic.util, 'getImageForBinaryContent').and.callFake(function (content, callback) {
            if (content === theBinaryContent) {
                callback(theImage);
            } else {
                callback(null);
            }
        });

        csscritic.renderer.browserRenderer(theUrl, 42, 7, null, function (resultImage) {
            image = resultImage;
        });

        expect(image).toBe(theImage);
    });

    it("should call the error handler if a page does not exist", function () {
        var successCallback = jasmine.createSpy("success"),
            errorCallback = jasmine.createSpy("error");
        spyOn(csscritic.util, 'ajax').and.callFake(function (url, successCallback, errorCallback) {
            errorCallback();
        });

        csscritic.renderer.browserRenderer("the_url", 42, 7, null, successCallback, errorCallback);

        expect(successCallback).not.toHaveBeenCalled();
        expect(errorCallback).toHaveBeenCalled();
    });

    it("should work without a callback on error", function () {
        spyOn(csscritic.util, 'ajax').and.callFake(function (url, successCallback, errorCallback) {
            errorCallback();
        });
        csscritic.renderer.browserRenderer("the_url", 42, 7);
    });

    describe("HTML page rendering", function () {
        var theUrl = "the url",
            theHtml = "some html";

        beforeEach(function () {
            spyOn(csscritic.util, 'ajax').and.callFake(function (url, successCallback) {
                var relativeFixtureUrl;
                if (url === theUrl) {
                    successCallback(theHtml);
                } else {
                    relativeFixtureUrl = url.replace(jasmine.getFixtures().fixturesPath, "");
                    successCallback([readFixtures(relativeFixtureUrl)]);
                }
            });
            spyOn(csscritic.util, 'getImageForBinaryContent').and.callFake(function (content, callback) {
                callback(null);
            });
        });

        it("should draw the html page if url is not an image, disable caching and execute JavaScript", function () {
            var image = null,
                drawHtmlSpy = spyOn(rasterizeHTML, "drawHTML").and.callFake(function (html, options, callback) {
                    if (html === theHtml) {
                        callback(the_image, []);
                    }
                });

            csscritic.renderer.browserRenderer(theUrl, 42, 7, null, function (result_image) {
                image = result_image;
            });

            expect(the_image).toBe(image);
            expect(drawHtmlSpy).toHaveBeenCalledWith(theHtml, {
                cache: 'repeated',
                cacheBucket: jasmine.any(Object),
                width: 42,
                height: 7,
                executeJs: true,
                executeJsTimeout: 50,
                baseUrl: theUrl
            }, jasmine.any(Function));
        });

        it("should call the error handler if a page could not be rendered", function () {
            var successCallback = jasmine.createSpy("success"),
                errorCallback = jasmine.createSpy("error");
            spyOn(rasterizeHTML, "drawHTML").and.callFake(function (html, options, callback) {
                callback(null, [{
                    resourceType: "document"
                }]);
            });

            csscritic.renderer.browserRenderer(theUrl, 42, 7, null, successCallback, errorCallback);

            expect(successCallback).not.toHaveBeenCalled();
            expect(errorCallback).toHaveBeenCalled();
        });

        it("should report errors from rendering", function (done) {
            var fixtureUrl = csscriticTestPath + "fixtures/",
                pageUrl = fixtureUrl + "brokenPage.html";

            csscritic.renderer.browserRenderer(pageUrl, 42, 7, null, function (result_image, errors) {
                expect(errors).not.toBeNull();
                expect(errors.length).toBe(3);
                errors.sort();
                expect(errors).toEqual([
                    "Unable to load background-image " + fixtureUrl + "background_image_does_not_exist.jpg",
                    "Unable to load image " + fixtureUrl + "image_does_not_exist.png",
                    "Unable to load stylesheet " + fixtureUrl + "css_does_not_exist.css"
                ]);

                done();
            });
        });
    });

});
