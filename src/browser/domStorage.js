csscriticLib.domstorage = function (util, localStorage) {
    "use strict";

    var module = {};

    var buildKey = function (testCase) {
        var testCaseParameters = util.excludeKeys(testCase, 'url'),
            serializedParameters = util.serializeMap(testCaseParameters),
            key = testCase.url;

        if (serializedParameters) {
            key += ',' + serializedParameters;
        }

        return key;
    };

    var successfulPromise = function () {
        var defer = ayepromise.defer();
        defer.resolve();
        return defer.promise;
    };

    module.storeReferenceImage = function (testCase, pageImage, viewport) {
        var uri, dataObj, key;

        try {
            uri = util.getDataURIForImage(pageImage);
        } catch (e) {
            window.alert("An error occurred reading the canvas. Are you sure you are using Firefox?\n" + e);
            throw e;
        }
        dataObj = {
            referenceImageUri: uri,
            viewport: {
                width: viewport.width,
                height: viewport.height
            }
        };

        key = buildKey(testCase);

        localStorage.setItem(key, JSON.stringify(dataObj));

        return successfulPromise();
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

    module.readReferenceImage = function (testCase) {
        var key = buildKey(testCase),
            dataObj;

        try {
            dataObj = parseStoredItem(localStorage.getItem(key));
        } catch (e) {
            return failedPromise();
        }

        return util.getImageForUrl(dataObj.referenceImageUri).then(function (img) {
            var viewport = dataObj.viewport || {
                width: img.width,
                height: img.height
            };

            return {
                image: img,
                viewport: viewport
            };
        });
    };

    return module;
};
