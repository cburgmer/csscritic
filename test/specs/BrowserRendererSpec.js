describe("Browser renderer", function () {
    var the_image;

    beforeEach(function () {
        the_image = "the_image";

        spyOn(csscritic.queue, 'execute').and.callFake(function (func) {
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

        csscritic.renderer.browserRenderer({
            url: theUrl,
            width: 42,
            height: 7
        }, function (resultImage) {
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

        csscritic.renderer.browserRenderer({
            url: "the_url",
            width: 42,
            height: 7
        }, successCallback, errorCallback);

        expect(successCallback).not.toHaveBeenCalled();
        expect(errorCallback).toHaveBeenCalled();
    });

    it("should work without a callback on error", function () {
        spyOn(csscritic.util, 'ajax').and.callFake(function (url, successCallback, errorCallback) {
            errorCallback();
        });
        csscritic.renderer.browserRenderer({
            url: "the_url",
            width: 42,
            height: 7
        });
    });

    describe("HTML page rendering", function () {
        var theUrl = "the url",
            theHtml = "some html";

        var successfulPromise = function (value) {
            return {
                then: function (successHandler) {
                    successHandler(value);
                }
            };
        };

        var failedPromise = function () {
            return {
                then: function (_, failHandler) {
                    failHandler();
                }
            };
        };

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
                drawHtmlSpy = spyOn(rasterizeHTML, "drawHTML").and.callFake(function (html) {
                    if (html === theHtml) {
                        return successfulPromise({
                            image: the_image,
                            errors: []
                        });
                    }
                });

            csscritic.renderer.browserRenderer({
                url: theUrl,
                width: 42,
                height: 7
            }, function (result_image) {
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
            });
        });

        it("should call the error handler if a page could not be rendered", function () {
            var successCallback = jasmine.createSpy("success"),
                errorCallback = jasmine.createSpy("error");
            spyOn(rasterizeHTML, "drawHTML").and.returnValue(failedPromise());

            csscritic.renderer.browserRenderer({
                url: theUrl,
                width: 42,
                height: 7
            }, successCallback, errorCallback);

            expect(successCallback).not.toHaveBeenCalled();
            expect(errorCallback).toHaveBeenCalled();
        });

        it("should report errors from rendering", function (done) {
            var fixtureUrl = csscriticTestPath + "fixtures/",
                pageUrl = fixtureUrl + "brokenPage.html";

            csscritic.renderer.browserRenderer({
                url: pageUrl,
                width: 42,
                height: 7
            }, function (result_image, errors) {
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

        it("should render with hover effect", function () {
            var successCallback = jasmine.createSpy("success"),
                errorCallback = jasmine.createSpy("error");
            spyOn(rasterizeHTML, "drawHTML").and.returnValue(successfulPromise({
                image: "the image",
                errors: []
            }));

            csscritic.renderer.browserRenderer({
                url: theUrl,
                width: 42,
                height: 7,
                hover: ".someSelector"
            }, successCallback, errorCallback);

            expect(rasterizeHTML.drawHTML).toHaveBeenCalledWith(
                jasmine.any(String),
                jasmine.objectContaining({hover: ".someSelector"})
            );
        });
    });

});
