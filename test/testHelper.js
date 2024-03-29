"use strict";

window.testHelper = (function () {
    var module = {};

    var fixturesPath = "fixtures/";

    module.fixture = function (path) {
        return fixturesPath + path;
    };

    var loadImage = function (url, successCallback, errorCallback) {
        var image = new window.Image();

        image.onload = function () {
            successCallback(image);
        };
        image.onerror = errorCallback;
        image.src = url;
    };

    module.loadImageFromUrl = function (url, successCallback) {
        loadImage(url, successCallback, function () {
            console.error("Error loading image " + url + " in test", url);
        });
    };

    module.deferFake = function (value) {
        var successHandler,
            resolved = false;
        return {
            resolve: function () {
                if (successHandler) {
                    successHandler(value);
                }
                resolved = true;
            },
            promise: {
                then: function (theSuccessHandler) {
                    if (resolved) {
                        theSuccessHandler(value);
                    } else {
                        successHandler = theSuccessHandler;
                    }
                },
            },
        };
    };

    return module;
})();
