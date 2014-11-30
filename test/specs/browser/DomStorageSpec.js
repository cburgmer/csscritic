describe("DOM storage", function () {
    "use strict";

    var util = csscriticLib.util();

    var constructDomstorage = function (utilDependency) {
        return csscriticLib.domstorage(utilDependency, localStorage);
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

    var storeMockReferenceImage = function (key, stringData) {
        var defer = ayepromise.defer();
        localStorage.setItem(key, stringData);
        defer.resolve();
        return defer.promise;
    };

    loadStoragePluginSpecs(constructDomstorage, readStoredReferenceImage, storeMockReferenceImage);

    it("should call error handler if the content's JSON is invalid", function (done) {
        var storage = constructDomstorage(util);
        storeMockReferenceImage("somePage.html", ';');
        storage.readReferenceImage({url: "somePage.html"}).then(null, done);
    });

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
