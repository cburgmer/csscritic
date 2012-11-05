describe("Utilities", function () {
    describe("getImageForUrl", function () {
        it("should load an image", function () {
            var the_image = null,
                imgUrl = csscriticTestPath + "fixtures/green.png";

            csscritic.util.getImageForUrl(imgUrl, function (image) {
                the_image = image;
            });

            waitsFor(function () {
                return the_image !== null;
            });

            runs(function () {
                expect(the_image instanceof HTMLElement).toBeTruthy();
                expect(the_image.nodeName).toEqual("IMG");
                expect(the_image.src.substr(-imgUrl.length)).toEqual(imgUrl);
            });

        });

        it("should handle a missing image", function () {
            var errorCalled = false;

            csscritic.util.getImageForUrl("does_not_exist.png", function () {}, function () {
                errorCalled = true;
            });

            waitsFor(function () {
                return errorCalled;
            });

            runs(function () {
                expect(errorCalled).toBeTruthy();
            });
        });
    });

    describe("getDataURIForImage", function () {
        it("should return the data URI for the given image", function () {
            var imageDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=",
                image = null,
                dataUri;

            csscriticTestHelper.loadImageFromUrl(imageDataUri, function (the_image) {
                image = the_image;
            });

            waitsFor(function () {
                return image !== null;
            });

            runs(function () {
                dataUri = csscritic.util.getDataURIForImage(image);
                expect(dataUri).toContain(imageDataUri.substr(0, 10));
            });
        });
    });

});