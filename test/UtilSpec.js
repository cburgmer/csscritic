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

    describe("map", function () {
        it("should map each value to one function call and then call complete function", function () {
            var completedValues = [],
                completed = false;

            csscritic.util.map([1, 2, 3], function (val, callback) {
                completedValues.push(val);

                callback();
            }, function () {
                completed = true;
            });

            expect(completed).toBeTruthy();
            expect(completedValues).toEqual([1, 2, 3]);
        });

        it("should pass computed results as array to complete function", function () {
            var computedResults = null;

            csscritic.util.map([1, 2, 3], function (val, callback) {
                callback(val + 1);
            }, function (results) {
                computedResults = results;
            });

            expect(computedResults).toEqual([2, 3, 4]);
        });

        it("should call complete if empty list is passed", function () {
            var completed = false,
                computedResults = null;

            csscritic.util.map([], function () {}, function (results) {
                completed = true;
                computedResults = results;
            });

            expect(completed).toBeTruthy();
            expect(computedResults).toEqual([]);
        });

        it("should not call complete until last value is handled", function () {
            var completedValues = [],
                completed = false,
                lastCallback = null;

            csscritic.util.map([1, 2, 3], function (val, callback) {
                completedValues.push(val);

                if (val < 3) {
                    callback();
                } else {
                    lastCallback = callback;
                }
            }, function () {
                completed = true;
            });

            expect(completed).toBeFalsy();

            lastCallback();

            expect(completed).toBeTruthy();
        });

    });

});
