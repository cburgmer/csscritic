describe('Migrate to IndexedDB storage', function () {
    "use strict";

    var util = csscriticLib.util();

    var constructStorage = function (utilDependency) {
        var domStorage = csscriticLib.domstorage(utilDependency, localStorage),
            indexedDbStorage = csscriticLib.indexeddbstorage(utilDependency);
        return csscriticLib.migratetoindexeddbstorage(domStorage, indexedDbStorage);
    };

    var storeReferenceImageToDomStorage = function (key, stringData) {
        var defer = ayepromise.defer();
        localStorage.setItem(key, stringData);
        defer.resolve();
        return defer.promise;
    };

    var getDb = function () {
        var defer = ayepromise.defer();

        var request = indexedDB.open('csscritic', 1);
        request.onsuccess = function (event) {
            var db = event.target.result;
            defer.resolve(db);
        };
        return defer.promise;
    };

    var storeReferenceImageToIndexedDb = function (key, stringData) {
        var defer = ayepromise.defer();
        // TODO move away from JSON encoded test input, doesn't match internals of this module
        var data = JSON.parse(stringData),
            dataObj = {};
        if (data.referenceImageUri) {
            dataObj.imageUri = data.referenceImageUri;
        }
        if (data.viewport) {
            dataObj.viewport = data.viewport;
        }
        getDb().then(function (db) {
            var request = db.transaction(['references'], 'readwrite')
                .objectStore('references')
                .add({testCase: key, reference: dataObj});

            request.onsuccess = function () {
                db.close();
                defer.resolve();
            };
        });
        return defer.promise;
    };

    var readStoredReferenceImage = function (key) {
        var defer = ayepromise.defer();

        getDb().then(function (db) {
            var request = db.transaction(['references'])
                .objectStore('references')
                .get(key);

            request.onsuccess = function () {
                db.close();
                // TODO stop using JSON string as interface in test
                defer.resolve(JSON.stringify({
                    referenceImageUri: request.result.reference.imageUri,
                    viewport: request.result.reference.viewport
                }));
            };
        });
        return defer.promise;
    };

    var successfulPromise = function (value) {
        var defer = ayepromise.defer();
        defer.resolve(value);
        return defer.promise;
    };

    afterEach(function (done) {
        localStorage.clear();

        var request = indexedDB.deleteDatabase('csscritic');
        request.onsuccess = done;
    });

    describe('on migration', function () {
        if (!isPhantom) {
            loadStoragePluginSpecs(constructStorage, readStoredReferenceImage, storeReferenceImageToDomStorage);
        }
    });

    describe('ongoing migration', function () {
        ifNotInPhantomIt("should transfer referenceImage from localStorage to indexedDB", function (done) {
            var storage = constructStorage(util),
                imageUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAKUlEQVQ4jWNYt27df2Lwo0ePiMIMowaOGjgsDSRWIbEWjxo4auCwNBAAenk4PB4atggAAAAASUVORK5CYII=",
                testCaseUrl = "somePage.html";

            storeReferenceImageToDomStorage(testCaseUrl, JSON.stringify({
                referenceImageUri: imageUri,
                viewport: {
                    width: 12,
                    height: 34
                }
            })).then(function () {
                return storage.readReferenceImage({url: testCaseUrl});
            }).then(function () {
                return readStoredReferenceImage(testCaseUrl);
            }).then(function (jsonResult) {
                var result = JSON.parse(jsonResult);

                expect(result.referenceImageUri).toEqual(imageUri);
                expect(result.viewport).toEqual({
                    width: 12,
                    height: 34
                });

                done();
            });
        });
    });

    describe('when already migrated', function () {
        beforeEach(function (done) {
            spyOn(util, 'getImageForUrl').and.returnValue(successfulPromise('image'));

            var request = indexedDB.open('csscritic', 1);
            request.onsuccess = function (event) {
                var db = event.target.result;
                db.close();
                done();
            };
            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                db.createObjectStore('references', { keyPath: "testCase" });
            };
        });

        if (!isPhantom) {
            loadStoragePluginSpecs(constructStorage, readStoredReferenceImage, storeReferenceImageToIndexedDb);
        }

        ifNotInPhantomIt('should prefer image from indexedDB over localStorage', function (done) {
            var storage = constructStorage(util),
                testCaseUrl = "somePage.html";

            storeReferenceImageToDomStorage(testCaseUrl, JSON.stringify({
                referenceImageUri: 'uri_from_localstorage'
            })).then(function () {
                return storeReferenceImageToIndexedDb(testCaseUrl, JSON.stringify({
                    referenceImageUri: 'uri_from_indexeddb'
                }));
            }).then(function () {
                return storage.readReferenceImage({url: testCaseUrl});
            }).then(function () {
                expect(util.getImageForUrl).toHaveBeenCalledWith('uri_from_indexeddb');
                done();
            });
        });
    });
});
