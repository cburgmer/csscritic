describe("DOM storage", function () {
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
        var defer = ayepromise.defer();
        defer.resolve(localStorage.getItem(key));
        return defer.promise;
    };

    var storeReferenceImage = function (key, stringData) {
        var defer = ayepromise.defer();
        localStorage.setItem(key, stringData);
        defer.resolve();
        return defer.promise;
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
