csscriticLib.domstorage = function (util, localStorage) {
    "use strict";

    var module = {};

    module.storeReferenceImage = function (key, pageImage, viewport) {
        var uri, dataObj;

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

        localStorage.setItem(key, JSON.stringify(dataObj));
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

    module.readReferenceImage = function (key, successCallback, errorCallback) {
        var dataObj;

        try {
            dataObj = parseStoredItem(localStorage.getItem(key));
        } catch (e) {
            errorCallback();
            return;
        }

        util.getImageForUrl(dataObj.referenceImageUri, function (img) {
            var viewport = dataObj.viewport || {
                width: img.width,
                height: img.height
            };

            successCallback(img, viewport);
        }, errorCallback);
    };

    return module;
};
