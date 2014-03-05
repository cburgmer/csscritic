window.loadStoragePluginSpecs = function (storagePlugin, readStoredReferenceImage, storeMockReferenceImage) {
    var imgUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAKUlEQVQ4jWNYt27df2Lwo0ePiMIMowaOGjgsDSRWIbEWjxo4auCwNBAAenk4PB4atggAAAAASUVORK5CYII=",
        img = null;

    beforeEach(function (done) {
        jasmine.addMatchers(imagediffForJasmine2);

        csscriticTestHelper.loadImageFromUrl(imgUri, function (image) {
            img = image;

            done();
        });
    });

    it("should store a the rendered page", function (done) {
        var stringValue, value;

        storagePlugin.storeReferenceImage("somePage.html", img, {
            width: 47,
            height: 11
        });

        stringValue = readStoredReferenceImage("somePage.html");
        expect(stringValue).not.toBeNull();

        value = JSON.parse(stringValue);
        csscriticTestHelper.loadImageFromUrl(value.referenceImageUri, function (image) {
            expect(image).toImageDiffEqual(img);

            done();
        });
    });

    it("should store the viewport's size", function () {
        var image = "the image",
            storedValue;

        spyOn(csscritic.util, 'getDataURIForImage');

        storagePlugin.storeReferenceImage("somePage.html", image, {
            width: 47,
            height: 11
        });

        storedValue = JSON.parse(readStoredReferenceImage("somePage.html"));

        expect(storedValue.viewport.width).toEqual(47);
        expect(storedValue.viewport.height).toEqual(11);
    });

    it("should read in a reference image", function () {
        var readImage,
            getImageForUrlSpy = spyOn(csscritic.util, 'getImageForUrl').and.callFake(function (uri, success) {
                success("read image fake");
            });

        storeMockReferenceImage("somePage.html", JSON.stringify({
            referenceImageUri: imgUri
        }));

        storagePlugin.readReferenceImage("somePage.html", function (img) {
            readImage = img;
        }, function () {});

        expect(getImageForUrlSpy).toHaveBeenCalledWith(imgUri, jasmine.any(Function), jasmine.any(Function));
        expect(readImage).toEqual("read image fake");
    });

    it("should return the viewport's size", function () {
        var viewportSize;

        spyOn(csscritic.util, 'getImageForUrl').and.callFake(function (uri, success) {
            success("read image fake");
        });

        storeMockReferenceImage("somePage.html", JSON.stringify({
            referenceImageUri: "some image uri",
            viewport: {
                width: 19,
                height: 84
            }
        }));

        storagePlugin.readReferenceImage("somePage.html", function (img, theViewportSize) {
            viewportSize = theViewportSize;
        });

        expect(viewportSize.width).toEqual(19);
        expect(viewportSize.height).toEqual(84);
    });

    it("should return the viewport's size and fallback to the image's size", function () {
        var viewportSize;

        spyOn(csscritic.util, 'getImageForUrl').and.callFake(function (uri, success) {
            success({
                width: 12,
                height: 34
            });
        });

        storeMockReferenceImage("somePage.html", JSON.stringify({
            referenceImageUri: imgUri
        }));

        storagePlugin.readReferenceImage("somePage.html", function (img, theViewportSize) {
            viewportSize = theViewportSize;
        });

        expect(viewportSize.width).toEqual(12);
        expect(viewportSize.height).toEqual(34);
    });

    it("should call error handler if no reference image has been stored", function () {
        var errorCallback = jasmine.createSpy('errorCallback');

        storagePlugin.readReferenceImage("somePage.html", function () {}, errorCallback);

        expect(errorCallback).toHaveBeenCalled();
    });

    it("should call error handler if the image is missing", function () {
        var errorCallback = jasmine.createSpy('errorCallback');

        storeMockReferenceImage("somePage.html", JSON.stringify({}));
        storagePlugin.readReferenceImage("somePage.html", function () {}, errorCallback);

        expect(errorCallback).toHaveBeenCalled();
    });

    it("should call error handler if read reference image is invalid", function () {
        var errorCallback = jasmine.createSpy('errorCallback');

        spyOn(csscritic.util, 'getImageForUrl').and.callFake(function (uri, success, error) {
            error();
        });

        storeMockReferenceImage( "somePage.html", JSON.stringify({
            referenceImageUri: "broken uri"
        }));
        storagePlugin.readReferenceImage("somePage.html", function () {}, errorCallback);

        expect(errorCallback).toHaveBeenCalled();
    });

    it("should call error handler if the content's JSON is invalid", function () {
        var errorCallback = jasmine.createSpy('errorCallback');

        storeMockReferenceImage("somePage.html", ';');
        storagePlugin.readReferenceImage("somePage.html", function () {}, errorCallback);

        expect(errorCallback).toHaveBeenCalled();
    });
};
