describe("Phantom storage support for reference images", function () {
    var fs = require("fs"),
        imgUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAKUlEQVQ4jWNYt27df2Lwo0ePiMIMowaOGjgsDSRWIbEWjxo4auCwNBAAenk4PB4atggAAAAASUVORK5CYII=",
        img = null;

    beforeEach(function () {
        csscriticTestHelper.loadImageFromUrl(imgUri, function (image) {
            img = image;
        });
        this.addMatchers(imagediff.jasmine);

        csscritic.filestorage.options.basePath = csscriticTestHelper.createTempPath();
    });

    it("should store a the rendered page to Web storage", function () {
        var stringValue, value,
            readImage = null;

        waitsFor(function () {
            return img != null;
        });

        runs(function () {
            csscritic.filestorage.storeReferenceImage("somePage.html", img);

            stringValue = fs.read(csscritic.filestorage.options.basePath + "somePage.html.json");
            expect(stringValue).not.toBeNull();

            value = JSON.parse(stringValue);
            csscriticTestHelper.loadImageFromUrl(value.referenceImageUri, function (image) {
                readImage = image;
            });
        });

        waitsFor(function () {
            return readImage != null;
        });

        runs(function () {
            expect(img).toImageDiffEqual(readImage);
        });
    });

    it("should read in a reference image from Web storage", function () {
        var readImage,
            getImageForUrlSpy = spyOn(csscritic.util, 'getImageForUrl').andCallFake(function (uri, success) {
            success("read image fake");
        });

        fs.write(csscritic.filestorage.options.basePath + "someOtherPage.html.json", '{"referenceImageUri": "' + imgUri + '"}', 'w');

        csscritic.filestorage.readReferenceImage("someOtherPage.html", function (img) {
            readImage = img;
        }, function () {});

        expect(getImageForUrlSpy).toHaveBeenCalledWith(imgUri, jasmine.any(Function), jasmine.any(Function));
        expect(readImage).toEqual("read image fake");
    });

    it("should call error handler if no reference image has been stored", function () {
        var errorCalled = false;

        csscritic.filestorage.readReferenceImage("yetAnotherPage.html", function () {}, function () {
            errorCalled = true;
        });

        expect(errorCalled).toBeTruthy();
    });

    it("should call error handler if the content's JSON is invalid", function () {
        var errorCalled = false;

        fs.write(csscritic.filestorage.options.basePath + "evenMoarPage.html.json", ';', 'w');
        csscritic.filestorage.readReferenceImage("evenMoarPage.html", function () {}, function () {
            errorCalled = true;
        });

        expect(errorCalled).toBeTruthy();
    });

    it("should call error handler if the image is missing", function () {
        var errorCalled = false;

        fs.write(csscritic.filestorage.options.basePath + "yetyetAnotherPage.html.json", '{}', 'w');
        csscritic.filestorage.readReferenceImage("yetyetAnotherPage.html", function () {}, function () {
            errorCalled = true;
        });

        expect(errorCalled).toBeTruthy();
    });

    it("should call error handler if read reference image is invalid", function () {
        var errorCalled = false;
        spyOn(csscritic.util, 'getImageForUrl').andCallFake(function (uri, success, error) {
            error();
        });

        fs.write(csscritic.filestorage.options.basePath + "alreadyEnoughOfPage.html.json", '{"referenceImageUri": "broken uri"}', 'w');
        csscritic.filestorage.readReferenceImage("alreadyEnoughOfPage.html", function () {}, function () {
            errorCalled = true;
        });

        expect(errorCalled).toBeTruthy();
    });
});
