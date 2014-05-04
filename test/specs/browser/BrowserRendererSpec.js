describe("Browser renderer", function () {
    "use strict";

    var util = csscriticLib.util(),
        browserRenderer;

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
        ajaxSpy = spyOn(util, 'ajax');

        var jobQueue = jasmine.createSpy('jobQueue').and.returnValue({
            execute: function (func) {
                return func();
            }
        });

        browserRenderer = csscriticLib.browserRenderer(util, jobQueue, rasterizeHTML);
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
        spyOn(util, 'getImageForBinaryContent').and.callFake(function (content) {
            if (content === theBinaryContent) {
                return successfulPromise(theImage);
            } else {
                return failedPromise();
            }
        });

        browserRenderer.render({
            url: theUrl,
            width: 42,
            height: 7
        }).then(function (result) {
            expect(result.image).toBe(theImage);

            done();
        });
    });

    it("should call the error handler if a page does not exist", function (done) {
        ajaxSpy.and.returnValue(failedPromise());

        browserRenderer.render({
            url: "the_url",
            width: 42,
            height: 7
        }).then(null, done);
    });

    describe("HTML page rendering", function () {
        var theUrl = "the url",
            theHtml = "some html";

        var readHtml = function (url) {
            var xhr = new window.XMLHttpRequest();

            xhr.open('GET', url, false);
            xhr.send(null);
            return xhr.response;
        };

        beforeEach(function () {
            ajaxSpy.and.callFake(function (url) {
                if (url === theUrl) {
                    return successfulPromise(theHtml);
                } else {
                    return successfulPromise([readHtml(url)]);
                }
            });
            spyOn(util, 'getImageForBinaryContent').and.returnValue(failedPromise());
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

            browserRenderer.render({
                url: theUrl,
                width: 42,
                height: 7
            }).then(function (result) {
                expect(result.image).toBe(the_image);
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

            browserRenderer.render({
                url: theUrl,
                width: 42,
                height: 7
            }).then(null, done);
        });

        it("should report errors from rendering", function (done) {
            var pageUrl = testHelper.fixture("brokenPage.html");

            browserRenderer.render({
                url: pageUrl,
                width: 42,
                height: 7
            }).then(function (result) {
                expect(result.errors).not.toBeNull();
                expect(result.errors.length).toBe(3);
                result.errors.sort();
                expect(result.errors).toEqual([
                    "Unable to load background-image " + testHelper.fixture("background_image_does_not_exist.jpg"),
                    "Unable to load image " + testHelper.fixture("image_does_not_exist.png"),
                    "Unable to load stylesheet " + testHelper.fixture("css_does_not_exist.css")
                ]);

                done();
            });
        });

        it("should render with hover effect", function (done) {
            spyOn(rasterizeHTML, "drawHTML").and.returnValue(successfulPromise({
                image: "the image",
                errors: []
            }));

            browserRenderer.render({
                url: theUrl,
                width: 42,
                height: 7,
                hover: ".someSelector"
            }).then(function () {
                expect(rasterizeHTML.drawHTML).toHaveBeenCalledWith(
                    jasmine.any(String),
                    jasmine.objectContaining({hover: ".someSelector"})
                );
                done();
            });
        });

        it("should render with active effect", function (done) {
            spyOn(rasterizeHTML, "drawHTML").and.returnValue(successfulPromise({
                image: "the image",
                errors: []
            }));

            browserRenderer.render({
                url: theUrl,
                width: 42,
                height: 7,
                active: ".someSelector"
            }).then(function () {
                expect(rasterizeHTML.drawHTML).toHaveBeenCalledWith(
                    jasmine.any(String),
                    jasmine.objectContaining({active: ".someSelector"})
                );
                done();
            });
        });
    });

});
