describe("Browser renderer", function () {
    var ajaxSpy;

    var successfulPromise = function (value) {
        var defer = ayepromise.defer();
        defer.resolve(value);
        return defer.promise;
    };

    var failedPromise = function () {
        var defer = ayepromise.defer();
        defer.reject();
        return defer.promise;
    };

    beforeEach(function () {
        ajaxSpy = spyOn(csscritic.util, 'ajax');

        spyOn(csscritic, 'jobQueue').and.returnValue({
            execute: function (func) {
                return func();
            }
        });
    });

    it("should draw an image directly", function (done) {
        var theUrl = "the url",
            theBinaryContent = "the content",
            theImage = "the image";

        ajaxSpy.and.callFake(function (url) {
            if (url === theUrl) {
                return successfulPromise(theBinaryContent);
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
        }, function (image) {
            expect(image).toBe(theImage);

            done();
        });
    });

    it("should call the error handler if a page does not exist", function (done) {
        ajaxSpy.and.returnValue(failedPromise());

        csscritic.renderer.browserRenderer({
            url: "the_url",
            width: 42,
            height: 7
        }, null, done);
    });

    describe("HTML page rendering", function () {
        var theUrl = "the url",
            theHtml = "some html";

        beforeEach(function () {
            ajaxSpy.and.callFake(function (url) {
                var relativeFixtureUrl;
                if (url === theUrl) {
                    return successfulPromise(theHtml);
                } else {
                    relativeFixtureUrl = url.replace(jasmine.getFixtures().fixturesPath, "");
                    return successfulPromise([readFixtures(relativeFixtureUrl)]);
                }
            });
            spyOn(csscritic.util, 'getImageForBinaryContent').and.callFake(function (content, callback) {
                callback(null);
            });
        });

        it("should draw the html page if url is not an image, disable caching and execute JavaScript", function (done) {
            var the_image = "the_image",
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
            }, function (image) {
                expect(image).toBe(the_image);
                expect(drawHtmlSpy).toHaveBeenCalledWith(theHtml, {
                    cache: 'repeated',
                    cacheBucket: jasmine.any(Object),
                    width: 42,
                    height: 7,
                    executeJs: true,
                    executeJsTimeout: 50,
                    baseUrl: theUrl
                });

                done();
            });
        });

        it("should call the error handler if a page could not be rendered", function (done) {
            spyOn(rasterizeHTML, "drawHTML").and.returnValue(failedPromise());

            csscritic.renderer.browserRenderer({
                url: theUrl,
                width: 42,
                height: 7
            }, null, done);
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

        it("should render with hover effect", function (done) {
            spyOn(rasterizeHTML, "drawHTML").and.returnValue(successfulPromise({
                image: "the image",
                errors: []
            }));

            csscritic.renderer.browserRenderer({
                url: theUrl,
                width: 42,
                height: 7,
                hover: ".someSelector"
            }, function () {
                expect(rasterizeHTML.drawHTML).toHaveBeenCalledWith(
                    jasmine.any(String),
                    jasmine.objectContaining({hover: ".someSelector"})
                );
                done();
            });
        });
    });

});
