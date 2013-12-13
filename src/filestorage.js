window.csscritic = (function (module, fs) {
    module.storage = module.storage || {};
    module.filestorage = {};

    module.filestorage.options = {
        basePath: "./"
    };

    var filePathForKey = function (key) {
        return module.filestorage.options.basePath + key + ".json";
    };

    module.filestorage.storeReferenceImage = function (key, pageImage, viewportWidth, viewportHeight) {
        var uri, dataObj;

        uri = module.util.getDataURIForImage(pageImage);
        dataObj = {
            referenceImageUri: uri,
            viewport: {
                width: viewportWidth,
                height: viewportHeight
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

    module.filestorage.readReferenceImage = function (key, successCallback, errorCallback) {
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

        module.util.getImageForUrl(dataObj.referenceImageUri, function (img) {
            var viewport = dataObj.viewport || {
                width: img.width,
                height: img.height
            };

            successCallback(img, viewport);
        }, errorCallback);
    };

    module.storage.options = module.filestorage.options;
    module.storage.storeReferenceImage = module.filestorage.storeReferenceImage;
    module.storage.readReferenceImage = module.filestorage.readReferenceImage;
    return module;
}(window.csscritic || {}, require("fs")));
