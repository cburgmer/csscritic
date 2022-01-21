csscriticLib.indexeddbstorage = function (util) {
    "use strict";

    var module = {};

    var createDb = function (db) {
        db.createObjectStore("references", { keyPath: "testCase" });
    };

    var getDb = function () {
        return new Promise(function (fulfill) {
            var request = indexedDB.open("csscritic", 1);

            request.onsuccess = function (event) {
                var db = event.target.result;
                fulfill(db);
            };
            request.onupgradeneeded = function (event) {
                var db = event.target.result;
                createDb(db);
            };
        });
    };

    var buildKey = function (testCase) {
        var testCaseParameters = util.excludeKeys(testCase, "url"),
            serializedParameters = util.serializeMap(testCaseParameters),
            key = testCase.url;

        if (serializedParameters) {
            key += "," + serializedParameters;
        }

        return key;
    };

    module.storeReferenceImage = function (testCase, referenceImage, viewport) {
        var imageUri = util.getDataURIForImage(referenceImage);

        var key = buildKey(testCase);

        return getDb().then(function (db) {
            return new Promise(function (fulfill) {
                var request = db
                    .transaction(["references"], "readwrite")
                    .objectStore("references")
                    .put({
                        testCase: key,
                        reference: {
                            imageUri: imageUri,
                            viewport: viewport,
                        },
                    });

                request.onsuccess = function () {
                    db.close();

                    fulfill();
                };
            });
        });
    };

    module.readReferenceImage = function (testCase) {
        var key = buildKey(testCase);

        return getDb()
            .then(function (db) {
                return new Promise(function (fulfill, reject) {
                    var request = db
                        .transaction(["references"])
                        .objectStore("references")
                        .get(key);

                    request.onsuccess = function () {
                        db.close();

                        if (
                            request.result === undefined ||
                            request.result.reference === undefined ||
                            request.result.reference.imageUri === undefined
                        ) {
                            reject();
                            return;
                        }

                        fulfill(request.result.reference);
                    };
                });
            })
            .then(function (dataObj) {
                return util
                    .getImageForUrl(dataObj.imageUri)
                    .then(function (img) {
                        var viewport = dataObj.viewport || {
                            width: img.width,
                            height: img.height,
                        };

                        return {
                            image: img,
                            viewport: viewport,
                        };
                    });
            });
    };

    return module;
};
