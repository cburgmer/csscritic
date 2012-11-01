window.isWebkit = navigator.userAgent.indexOf("WebKit") >= 0;
window.ifNotInWebkitIt = function(text, functionHandle) {
    if (! window.isWebkit) {
        return it(text, functionHandle);
    } else {
        safeLog('Warning: "' + text + '" is disabled on this platform');
    }
};
window.safeLog = function (msg) {
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
};

window.csscriticTestHelper = (function () {
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
