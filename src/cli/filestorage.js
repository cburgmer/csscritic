window.csscritic = window.csscritic || {};

csscritic.filestorage = (function (fs) {
    var module = {};

    module.options = {
        basePath: "./"
    };

    var filePathForKey = function (key) {
        return module.options.basePath + key + ".json";
    };

    module.storeReferenceImage = function (key, pageImage, viewport) {
        var uri, dataObj;

        uri = csscritic.util.getDataURIForImage(pageImage);
        dataObj = {
            referenceImageUri: uri,
            viewport: {
                width: viewport.width,
                height: viewport.height
            }
        };

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

    module.readReferenceImage = function (key, successCallback, errorCallback) {
        var filePath = filePathForKey(key),
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

        csscritic.util.getImageForUrl(dataObj.referenceImageUri, function (img) {
            var viewport = dataObj.viewport || {
                width: img.width,
                height: img.height
            };

            successCallback(img, viewport);
        }, errorCallback);
    };

    return module;
}(require("fs")));

csscritic.storage = {};
csscritic.storage.storeReferenceImage = csscritic.filestorage.storeReferenceImage;
csscritic.storage.readReferenceImage = csscritic.filestorage.readReferenceImage;
