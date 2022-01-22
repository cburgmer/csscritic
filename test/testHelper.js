"use strict";

window.testHelper = (function () {
    var module = {},
        tempPath = null,
        tempPathCounter = 0;

    module.fixturesPath = "fixtures/";

    module.fixture = function (path) {
        return module.fixturesPath + path;
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

    module.testImageUrl = function (url, callback) {
        loadImage(
            url,
            function () {
                callback(true);
            },
            function () {
                callback(false);
            }
        );
    };

    module.createImageOfSize = function (width, height, callback) {
        module.loadImageFromUrl(
            "data:image/svg+xml;charset=utf-8," +
                encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
                        width +
                        '" height="' +
                        height +
                        '"></svg>'
                ),
            callback
        );
    };

    module.getFileUrl = function (filePath) {
        var fs = require("fs");

        return "file://" + fs.absolute(filePath);
    };

    function tempPathName() {
        return "/tmp/csscriticTest." + Math.floor(Math.random() * 10000) + "/";
    }

    var createMainTempPath = function () {
        var fs = require("fs"),
            path = tempPathName();

        while (fs.exists(path)) {
            path = tempPathName();
        }

        fs.makeDirectory(path);
        return path;
    };

    module.createTempPath = function () {
        var fs = require("fs"),
            tempSubPath;

        if (tempPath === null) {
            tempPath = createMainTempPath();
        }
        tempSubPath = tempPath + "/" + tempPathCounter + "/";
        tempPathCounter += 1;
        fs.makeDirectory(tempSubPath);
        return tempSubPath;
    };

    module.failedPromise = function (e) {
        var defer = ayepromise.defer();
        defer.reject(e);
        return defer.promise;
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

    var doWait = function (predicate, timeout, callback) {
        var checkIntervalLengh = 100;

        if (predicate()) {
            callback(true);
        } else if (timeout > 0) {
            setTimeout(function () {
                doWait(predicate, timeout - checkIntervalLengh, callback);
            }, checkIntervalLengh);
        } else {
            callback(false);
        }
    };

    module.waitsFor = function (predicate) {
        var timeout = 2000;

        return new Promise(function (fulfill, reject) {
            doWait(predicate, timeout, function (predicateResovled) {
                if (predicateResovled) {
                    fulfill();
                } else {
                    reject();
                }
            });
        });
    };

    return module;
})();
