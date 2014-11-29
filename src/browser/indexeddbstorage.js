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

    module.storeReferenceImage = function () {};

    module.readReferenceImage = function (testCase) {
        var defer = ayepromise.defer();

        getDb().then(function (db) {
            var request = db.transaction(['references'])
                .objectStore('references')
                .get(testCase.url);

            request.onsuccess = function (event) {
                db.close();
                
                if (request.result === undefined || request.result.data.referenceImageUri === undefined) {
                    defer.reject();
                    return;
                }
                
                var dataObj = request.result.data;

                util.getImageForUrl(dataObj.referenceImageUri).then(function (img) {
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
