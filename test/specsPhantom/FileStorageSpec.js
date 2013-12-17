describe("Phantom storage support for reference images", function () {
    var fs = require("fs");

    beforeEach(function () {
        csscritic.filestorage.options.basePath = csscriticTestHelper.createTempPath();
    });

    var readStoredReferenceImage = function (key) {
            return fs.read(csscritic.filestorage.options.basePath + key + ".json");
        },
        storeReferenceImage = function (key, stringData) {
            fs.write(csscritic.filestorage.options.basePath + key + ".json", stringData, 'w');
        };

    loadStoragePluginSpecs(csscritic.filestorage, readStoredReferenceImage, storeReferenceImage);
});
