describe("Web storage support for reference images", function () {
    beforeEach(function () {
        localStorage.clear();
    });

    afterEach(function () {
        localStorage.clear();
    });

    var readStoredReferenceImage = function (key) {
            return localStorage.getItem(key);
        },
        storeReferenceImage = function (key, stringData) {
            localStorage.setItem(key, stringData);
        };

    loadStoragePluginSpecs(csscritic.domstorage, readStoredReferenceImage, storeReferenceImage);

    it("should alert the user that possibly the wrong browser is used", function () {
        var theImage = "the image",
            alertSpy = spyOn(window, 'alert');

        spyOn(csscritic.util, 'getDataURIForImage').and.throwError("can't read canvas");

        try {
            csscritic.domstorage.storeReferenceImage("somePage.html", theImage, 47, 11);
            expect(true).toBe(false);
        } catch (e) {}

        expect(alertSpy).toHaveBeenCalled();
    });
});
