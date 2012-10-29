window.csscritic = (function (module) {

    var acceptMissingReference = function (result) {
        if (result.status === "referenceMissing") {
            result.acceptPage();
        }
    };

    module.AutoAcceptingReporter = function () {
        return {
            reportComparison: acceptMissingReference
        };
    };

    return module;
}(window.csscritic || {}));
