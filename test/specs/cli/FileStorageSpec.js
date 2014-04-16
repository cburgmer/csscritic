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
        tempPath = csscriticTestHelper.createTempPath();
    });

    var readStoredReferenceImage = function (key) {
            return fs.read(tempPath + key + ".json");
        },
        storeReferenceImage = function (key, stringData) {
            fs.write(tempPath + key + ".json", stringData, 'w');
        };

    loadStoragePluginSpecs(constructStorage, readStoredReferenceImage, storeReferenceImage);
});
