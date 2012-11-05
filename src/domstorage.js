window.csscritic = (function (module) {
    module.storage = module.storage || {};
    module.domstorage = {};

    module.domstorage.storeReferenceImage = function (key, pageImage) {
        var uri, dataObj;

        try {
            uri = module.util.getDataURIForImage(pageImage);
        } catch (e) {
            window.alert("An error occurred reading the canvas. Are you sure you are using Firefox?\n" + e);
            throw e;
        }
        dataObj = {
            referenceImageUri: uri
        };

        localStorage.setItem(key, JSON.stringify(dataObj));
    };

    module.domstorage.readReferenceImage = function (key, successCallback, errorCallback) {
        var dataObjString = localStorage.getItem(key),
            dataObj;

        if (dataObjString) {
            dataObj = JSON.parse(dataObjString);

            module.util.getImageForUrl(dataObj.referenceImageUri, function (img) {
                successCallback(img);
            }, errorCallback);
        } else {
            errorCallback();
        }
    };

    module.storage.storeReferenceImage = module.domstorage.storeReferenceImage;
    module.storage.readReferenceImage = module.domstorage.readReferenceImage;
    return module;
}(window.csscritic || {}));
