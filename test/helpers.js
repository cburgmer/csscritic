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
