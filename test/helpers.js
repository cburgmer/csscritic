"use strict";

window.imagediffForJasmine2 = {
    // work around imagediff only supporting jasmine 1.x
    toImageDiffEqual: function () {
        return {
            compare: function (actual, expected, tolerancePercentage) {
                var context = { actual: actual },
                    result = {};
                result.pass = imagediff.jasmine.toImageDiffEqual.call(
                    context,
                    expected,
                    tolerancePercentage
                );
                return result;
            },
        };
    },
};
