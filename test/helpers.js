"use strict";

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


window.imagediffForJasmine2 = {
    // work around imagediff only supporting jasmine 1.x
    toImageDiffEqual: function () {
        return {
            compare: function (actual, expected, tolerancePercentage) {
                var context = {actual: actual},
                    result = {};
                result.pass = imagediff.jasmine.toImageDiffEqual.call(context, expected, tolerancePercentage);
                return result;
            }
        };
    }
};

