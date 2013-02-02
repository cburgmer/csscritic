describe("Browser renderer", function () {
    var the_image;

    beforeEach(function () {
        the_image = "the_image";
    });

    it("should draw the url to the given canvas and disable caching", function () {
        var image = null,
            drawUrlSpy = spyOn(rasterizeHTML, "drawURL").andCallFake(function (url, options, callback) {
                callback(the_image, []);
            });

        csscritic.renderer.browserRenderer("the_url", 42, 7, function (result_image) {
            image = result_image;
        });

        expect(the_image).toBe(image);
        expect(drawUrlSpy).toHaveBeenCalledWith("the_url", {cache: false, width: 42, height: 7, executeJs: true}, jasmine.any(Function));
    });

    it("should call the error handler if a page does not exist", function () {
        var hasError = false;
        spyOn(rasterizeHTML, "drawURL").andCallFake(function (url, options, callback) {
            callback(the_image, [{
                resourceType: "page",
                url: url
            }]);
        });

        csscritic.renderer.browserRenderer("the_url", 42, 7, function () {}, function () {
            hasError = true;
        });

        expect(hasError).toBeTruthy();
    });

    it("should work without a callback on error", function () {
        spyOn(rasterizeHTML, "drawURL").andCallFake(function (url, options, callback) {
            callback(the_image, [{
                resourceType: "page",
                url: url
            }]);
        });
        csscritic.renderer.browserRenderer("the_url", 42, 7);
    });

    it("should report erroneous resource urls", function () {
        var erroneousResourceUrls = null,
            fixtureUrl = csscriticTestPath + "fixtures/",
            pageUrl = fixtureUrl + "brokenPage.html";

        csscritic.renderer.browserRenderer(pageUrl, 42, 7, function (result_image, erroneousUrls) {
            erroneousResourceUrls = erroneousUrls;
        });

        waitsFor(function () {
            return erroneousResourceUrls !== null;
        });

        runs(function () {
            expect(erroneousResourceUrls).not.toBeNull();
            erroneousResourceUrls.sort();
            expect(erroneousResourceUrls).toEqual([
                fixtureUrl + "background_image_does_not_exist.jpg",
                fixtureUrl + "css_does_not_exist.css",
                fixtureUrl + "image_does_not_exist.png"
            ]);
        });
    });

});