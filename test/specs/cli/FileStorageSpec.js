describe("Phantom storage support for reference images", function () {
    "use strict";

    var fs = require("fs"),
        tempPath;

    var constructStorage = function (util) {
        var filestorage = csscriticLib.filestorage(util);
        filestorage.options.basePath = tempPath;
        return filestorage;
    };

    beforeEach(function () {
        tempPath = testHelper.createTempPath();
    });

    var readStoredReferenceImage = function (key) {
        var defer = ayepromise.defer();
        defer.resolve(fs.read(tempPath + key + ".json"));
        return defer.promise;
    };

    var storeReferenceImage = function (key, stringData) {
        var defer = ayepromise.defer();
        fs.write(tempPath + key + ".json", stringData, 'w');
        defer.resolve();
        return defer.promise;
    };

    loadStoragePluginSpecs(constructStorage, readStoredReferenceImage, storeReferenceImage);
});
