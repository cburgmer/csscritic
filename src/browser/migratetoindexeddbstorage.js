csscriticLib.migratetoindexeddbstorage = function (domStorage, indexedDbStorage) {
    "use strict";

    var module = {};

    module.storeReferenceImage = function (testCase, referenceImage, viewport) {
        return indexedDbStorage.storeReferenceImage(testCase, referenceImage, viewport);
    };

    module.readReferenceImage = function (testCase) {
        return indexedDbStorage.readReferenceImage(testCase)
            .then(null, function () {
                return domStorage.readReferenceImage(testCase);
            });
    };

    return module;
};
