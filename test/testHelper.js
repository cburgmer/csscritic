window.testHelper = (function () {
    "use strict";

    var module = {},
        tempPath = null,
        tempPathCounter = 0;

    var isPhantomJs = navigator.userAgent.indexOf("PhantomJS") >= 0,
        isRunFromTheProjectRoot = isPhantomJs;

    var fixturePath = (isRunFromTheProjectRoot ? 'test/' : '' ) + 'fixtures/';

    module.fixture = function (path) {
        return fixturePath + path;
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
        loadImage(url, function () {
            callback(true);
        }, function () {
            callback(false);
        });
    };

    module.createImageOfSize = function (width, height, callback) {
        module.loadImageFromUrl('data:image/svg+xml;charset=utf-8,' +
            encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"></svg>'),
            callback);
    };

    module.getFileUrl = function (filePath) {
        var fs = require("fs");

        return "file://" + fs.absolute(filePath);
    };

    function tempPathName () {
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
        tempSubPath = tempPath + '/' + tempPathCounter + '/';
        tempPathCounter += 1;
        fs.makeDirectory(tempSubPath);
        return tempSubPath;
    };

    return module;
}());
