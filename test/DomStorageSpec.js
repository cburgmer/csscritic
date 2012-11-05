describe("Web storage support for reference images", function () {
    var imgUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAKUlEQVQ4jWNYt27df2Lwo0ePiMIMowaOGjgsDSRWIbEWjxo4auCwNBAAenk4PB4atggAAAAASUVORK5CYII=",
        img = null;

    var loadImage = function (uri, callback) {
        var img = new window.Image();
        img.onload = callback;
        img.src = imgUri;
    };

    var getCanvasForImage = function (image) {
        var canvas = window.document.createElement("canvas"),
            context = canvas.getContext("2d");

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0);

        return canvas;
    };

    beforeEach(function () {
        loadImage(imgUri, function () {
            img = this;
        });
        this.addMatchers(imagediff.jasmine);

        localStorage.clear();
    });

    afterEach(function () {
        localStorage.clear();
    });

    it("should store a the rendered page to Web storage", function () {
        var canvas, stringValue, value,
            readImage = null;

        waitsFor(function () {
            return img != null;
        });

        runs(function () {
            canvas = getCanvasForImage(img);

            csscritic.domstorage.storeReferenceImage("somePage.html", canvas);

            stringValue = localStorage.getItem("somePage.html");
            expect(stringValue).not.toBeNull();

            value = JSON.parse(stringValue);
            loadImage(value.referenceImageUri, function () {
                readImage = this;
            });
        });

        waitsFor(function () {
            return readImage != null;
        });

        runs(function () {
            expect(img).toImageDiffEqual(readImage);
        });
    });

    it("should alert the user that possibly the wrong browser is used", function () {
        var canvas = {
                toDataURL: jasmine.createSpy("canvas").andThrow("can't read canvas")
            },
            alertSpy = spyOn(window, 'alert'),
            errorThrown = false;

        try {
            csscritic.domstorage.storeReferenceImage("somePage.html", canvas);
        } catch (e) {
            errorThrown = true;
        }

        expect(errorThrown).toBeTruthy();
        expect(alertSpy).toHaveBeenCalled();
    });

    it("should read in a reference image from Web storage", function () {
        var readImage,
            getImageForUrlSpy = spyOn(csscritic.util, 'getImageForUrl').andCallFake(function (uri, success) {
            success("read image fake");
        });

        localStorage.setItem("someOtherPage.html", '{"referenceImageUri": "' + imgUri + '"}');

        csscritic.domstorage.readReferenceImage("someOtherPage.html", function (img) {
            readImage = img;
        }, function () {});

        expect(getImageForUrlSpy).toHaveBeenCalledWith(imgUri, jasmine.any(Function), jasmine.any(Function));
        expect(readImage).toEqual("read image fake");
    });

    it("should call error handler if no reference image has been stored", function () {
        var errorCalled = false;

        csscritic.domstorage.readReferenceImage("someOtherPage.html", function () {}, function () {
            errorCalled = true;
        });

        expect(errorCalled).toBeTruthy();
    });

    it("should call error handler if read reference image is invalid", function () {
        var errorCalled = false;
        spyOn(csscritic.util, 'getImageForUrl').andCallFake(function (uri, success, error) {
            error();
        });

        localStorage.setItem("someOtherPage.html", '{"referenceImageUri": "broken uri"}');

        csscritic.domstorage.readReferenceImage("someOtherPage.html", function () {}, function () {
            errorCalled = true;
        });

        expect(errorCalled).toBeTruthy();
    });
});
