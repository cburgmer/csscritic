describe("Web storage support for reference images", function () {
    "use strict";

    var util = csscriticLib.util();

    var constructDomstorage = function (util) {
        return csscriticLib.domstorage(util, localStorage);
    };

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

    loadStoragePluginSpecs(constructDomstorage, readStoredReferenceImage, storeReferenceImage);

    it("should alert the user that possibly the wrong browser is used", function () {
        var storage = constructDomstorage(util);

        var theImage = "the image",
            alertSpy = spyOn(window, 'alert');

        spyOn(util, 'getDataURIForImage').and.throwError("can't read canvas");

        try {
            storage.storeReferenceImage({url: "somePage.html"}, theImage, 47, 11);
            expect(true).toBe(false);
        } catch (e) {}

        expect(alertSpy).toHaveBeenCalled();
    });
});
