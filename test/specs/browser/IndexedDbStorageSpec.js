describe("IndexedDB storage", function () {
    "use strict";

    var util = csscriticLib.util();

    var db;

    var constructStorage = function (util) {
        return csscriticLib.indexeddbstorage(util);
    };

    beforeEach(function (done) {
        var request = indexedDB.open('csscritic', 1);
        request.onsuccess = function (event) {
            db = event.target.result;
            done();
        };
        request.onupgradeneeded = function(event) {
            var db = event.target.result;

            db.createObjectStore('references', { keyPath: "testCase.url" });
        };
    });

    afterEach(function (done) {
        db.close();

        var request = indexedDB.deleteDatabase('csscritic');
        request.onsuccess = done;
    });

    var readStoredReferenceImage = function (key) {
    };

    var storeReferenceImage = function (keyString, stringData) {
        // TODO move away from JSON encoded test input, doesn't match internals of this module
        var data = JSON.parse(stringData);
        var keyValues = keyString.split(',');
        var testCase = {url: keyValues[0]};
        keyValues.slice(1).forEach(function (kv) { var pair = kv.split('='); testCase[pair[0]] = pair[1]; });
        db.transaction(['references'], 'readwrite')
            .objectStore('references')
            .add({testCase: testCase, data: data});
    };

    loadStoragePluginSpecs(constructStorage, readStoredReferenceImage, storeReferenceImage);
});
