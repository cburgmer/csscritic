window.csscritic = (function (module) {

    var acceptMissingReference = function (result, callback) {
        if (result.status === "referenceMissing") {
            result.acceptPage();
        }

        if (callback) {
            callback();
        }
    };

    module.AutoAcceptingReporter = function () {
        return {
            reportComparison: acceptMissingReference
        };
    };

    return module;
}(window.csscritic || {}));
