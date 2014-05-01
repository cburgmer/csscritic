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

    module.readReferenceImage = function (testCase, successCallback, errorCallback) {
        var key = buildKey(testCase),
            filePath = filePathForKey(key),
            dataObj;

        if (! fs.exists(filePath)) {
            errorCallback();
            return;
        }

        try {
            dataObj = parseStoredItem(fs.read(filePath));
        } catch (e) {
            errorCallback();
            return;
        }

        util.getImageForUrl(dataObj.referenceImageUri).then(function (img) {
            var viewport = dataObj.viewport || {
                width: img.width,
                height: img.height
            };

            successCallback(img, viewport);
        }, errorCallback);
    };

    return module;
};
