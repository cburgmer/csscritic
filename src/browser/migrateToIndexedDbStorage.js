csscriticLib.migratetoindexeddbstorage = function (domStorage, indexedDbStorage) {
    "use strict";

    var module = {};

    module.storeReferenceImage = function (testCase, referenceImage, viewport) {
        return indexedDbStorage.storeReferenceImage(testCase, referenceImage, viewport);
    };

    var fallbackToDomStorageAndMigrate = function (testCase) {
        return domStorage.readReferenceImage(testCase)
            .then(function (result) {
                return module.storeReferenceImage(testCase, result.image, result.viewport)
                    .then(function () {
                        return result;
                    });
            });
    };

    module.readReferenceImage = function (testCase) {
        return indexedDbStorage.readReferenceImage(testCase)
            .then(null, function () {
                return fallbackToDomStorageAndMigrate(testCase);
            });
    };

    return module;
};
