csscriticLib.indexeddbstorage = function (util) {
    "use strict";

    var module = {};

    var getDb = function () {
        var defer = ayepromise.defer(),
            request = indexedDB.open('csscritic', 1);

        request.onsuccess = function (event) {
            var db = event.target.result;
            defer.resolve(db);
        };
        return defer.promise;
    };

    var buildKey = function (testCase) {
        var testCaseParameters = util.excludeKey(testCase, 'url'),
            serializedParameters = util.serializeMap(testCaseParameters),
            key = testCase.url;

        if (serializedParameters) {
            key += ',' + serializedParameters;
        }

        return key;
    };

    module.storeReferenceImage = function () {
        var defer = ayepromise.defer();
        defer.resolve();
        return defer.promise;
    };

    module.readReferenceImage = function (testCase) {
        var defer = ayepromise.defer(),
            key = buildKey(testCase);

        getDb().then(function (db) {
            var request = db.transaction(['references'])
                .objectStore('references')
                .get(key);

            request.onsuccess = function () {
                db.close();
                
                if (request.result === undefined || request.result.reference === undefined || request.result.reference.imageUri === undefined) {
                    defer.reject();
                    return;
                }
                
                var dataObj = request.result.reference;

                util.getImageForUrl(dataObj.imageUri).then(function (img) {
                    var viewport = dataObj.viewport || {
                        width: img.width,
                        height: img.height
                    };

                    defer.resolve({
                        image: img,
                        viewport: viewport
                    });
                });
            };
        });

        return defer.promise;
    };

    return module;
};
