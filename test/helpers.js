var isWebkit = navigator.userAgent.indexOf("WebKit") >= 0,
    ifNotInWebkitIt = function(text, functionHandle) {
        if (! isWebkit) {
            return it(text, functionHandle);
        } else {
            safeLog('Warning: "' + text + '" is disabled on this platform');
        }
    },
    safeLog = function (msg) {
        if (window.console && console.log) {
            console.log(msg);
        }
    };

var csscriticTestHelper = (function () {
    var module = {};

    module.loadImageFromUrl = function (url, successCallback) {
        var image = new window.Image();

        image.onload = function () {
            successCallback(image);
        };
        image.onerror = function () {
            safeLog("Error loading image in test", url);
        };
        image.src = url;
    };

    return module;
}());
