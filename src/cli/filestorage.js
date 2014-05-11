csscriticLib.filestorage = function (util) {
    "use strict";

    var module = {};

    var fs = require("fs");

    module.options = {
        basePath: "./"
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

    var filePathForKey = function (key) {
        return module.options.basePath + key + ".json";
    };

    module.storeReferenceImage = function (testCase, pageImage, viewport) {
        var key, uri, dataObj;

        uri = util.getDataURIForImage(pageImage);
        dataObj = {
            referenceImageUri: uri,
            viewport: {
                width: viewport.width,
                height: viewport.height
            }
        };

        key = buildKey(testCase);

        fs.write(filePathForKey(key), JSON.stringify(dataObj), "w");
    };

    var parseStoredItem = function (dataObjString) {
        var dataObj;

        if (! dataObjString) {
            throw new Error("No data supplied");
        }

        dataObj = JSON.parse(dataObjString);

        if (!dataObj.referenceImageUri) {
            throw new Error("No reference image found");
        }

        return dataObj;
    };

    var failedPromise = function () {
        var defer = ayepromise.defer();
        defer.reject();
        return defer.promise;
    };

    module.readReferenceImage = function (testCase, successCallback, errorCallback) {
        var key = buildKey(testCase),
            filePath = filePathForKey(key),
            dataObj;

        var p;

        if (! fs.exists(filePath)) {
            p = failedPromise();
            p.then(null, errorCallback);
            return p;
        }

        try {
            dataObj = parseStoredItem(fs.read(filePath));
        } catch (e) {
            p = failedPromise();
            p.then(null, errorCallback);
            return p;
        }

        p = util.getImageForUrl(dataObj.referenceImageUri).then(function (img) {
            var viewport = dataObj.viewport || {
                width: img.width,
                height: img.height
            };

            return {
                image: img,
                viewport: viewport
            };
        });

        p.then(function (result) {
            if (successCallback) {
                successCallback(result.image, result.viewport);
            }
        }, errorCallback);

        return p;
    };

    return module;
};
