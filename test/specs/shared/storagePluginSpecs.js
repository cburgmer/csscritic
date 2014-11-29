var loadStoragePluginSpecs = function (constructStorage, readStoredReferenceImage, storeMockReferenceImage) {
    "use strict";

    var imgUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAKUlEQVQ4jWNYt27df2Lwo0ePiMIMowaOGjgsDSRWIbEWjxo4auCwNBAAenk4PB4atggAAAAASUVORK5CYII=",
        img = null,
        storage;

    var util = csscriticLib.util();

    var setUpImageReturnedForUrl = function (image) {
        util.getImageForUrl.and.returnValue(testHelper.successfulPromise(image));
    };

    var setUpImageForUrlToFail = function (e) {
        util.getImageForUrl.and.returnValue(testHelper.failedPromise(e));
    };

    beforeEach(function (done) {
        spyOn(util, 'getImageForUrl');

        storage = constructStorage(util);

        jasmine.addMatchers(imagediffForJasmine2);

        testHelper.loadImageFromUrl(imgUri, function (image) {
            img = image;

            done();
        });
    });

    it("should store a the rendered page", function (done) {
        var stringValue, value;

        storage.storeReferenceImage({url: "somePage.html"}, img, {
            width: 47,
            height: 11
        });

        stringValue = readStoredReferenceImage("somePage.html");
        expect(stringValue).not.toBeNull();

        value = JSON.parse(stringValue);
        testHelper.loadImageFromUrl(value.referenceImageUri, function (image) {
            expect(image).toImageDiffEqual(img);

            done();
        });
    });

    it("should store the viewport's size", function () {
        var image = "the image",
            storedValue;

        spyOn(util, 'getDataURIForImage');

        storage.storeReferenceImage({url: "somePage.html"}, image, {
            width: 47,
            height: 11
        });

        storedValue = JSON.parse(readStoredReferenceImage("somePage.html"));

        expect(storedValue.viewport.width).toEqual(47);
        expect(storedValue.viewport.height).toEqual(11);
    });

    it("should honour test case parameters when storing", function () {
        var stringValue;

        storage.storeReferenceImage({
                url: 'somePage.html',
                hover: 'aValue',
                active: 'anotherValue'
            },
            img,
            {}
        );

        stringValue = readStoredReferenceImage("somePage.html,active=anotherValue,hover=aValue");
        expect(stringValue).not.toBeNull();
    });

    it("should read in a reference image", function (done) {
        setUpImageReturnedForUrl("read image fake");

        storeMockReferenceImage("somePage.html", JSON.stringify({
            referenceImageUri: imgUri
        }));

        storage.readReferenceImage({url: "somePage.html"}).then(function (result) {
            expect(util.getImageForUrl).toHaveBeenCalledWith(imgUri);
            expect(result.image).toEqual("read image fake");

            done();
        });
    });

    it("should return the viewport's size", function (done) {
        setUpImageReturnedForUrl("read image fake");

        storeMockReferenceImage("somePage.html", JSON.stringify({
            referenceImageUri: "some image uri",
            viewport: {
                width: 19,
                height: 84
            }
        }));

        storage.readReferenceImage({url: "somePage.html"}).then(function (result) {
            expect(result.viewport.width).toEqual(19);
            expect(result.viewport.height).toEqual(84);

            done();
        });
    });

    it("should return the viewport's size and fallback to the image's size", function (done) {
        setUpImageReturnedForUrl({
            width: 12,
            height: 34
        });

        storeMockReferenceImage("somePage.html", JSON.stringify({
            referenceImageUri: imgUri
        }));

        storage.readReferenceImage({url: "somePage.html"}).then(function (result) {
            expect(result.viewport.width).toEqual(12);
            expect(result.viewport.height).toEqual(34);

            done();
        });
    });

    it("should call error handler if no reference image has been stored", function (done) {
        storage.readReferenceImage({url: "somePage.html"}).then(null, done);
    });

    it("should call error handler if the image is missing", function (done) {
        storeMockReferenceImage("somePage.html", JSON.stringify({}));

        storage.readReferenceImage({url: "somePage.html"}).then(null, done);
    });

    it("should call error handler if read reference image is invalid", function (done) {
        setUpImageForUrlToFail();

        storeMockReferenceImage( "somePage.html", JSON.stringify({
            referenceImageUri: "broken uri"
        }));
        storage.readReferenceImage({url: "somePage.html"}).then(null, done);
    });

    it("should call error handler if the content's JSON is invalid", function (done) {
        storeMockReferenceImage("somePage.html", ';');
        storage.readReferenceImage({url: "somePage.html"}).then(null, done);
    });

    it("should honour test case parameters when reading", function (done) {
        setUpImageReturnedForUrl("read image fake");

        storeMockReferenceImage("somePage.html,active=anotherValue,hover=aValue", JSON.stringify({
            referenceImageUri: imgUri
        }));

        storage.readReferenceImage({
                url: 'somePage.html',
                hover: 'aValue',
                active: 'anotherValue'
            })
            .then(function (img) {
                expect(img).not.toBeNull();

                done();
            });
    });
};
