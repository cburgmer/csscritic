window.csscritic = (function (module, window) {

    var ATTRIBUTES_TO_ANSI = {
            "off": 0,
            "bold": 1,
            "red": 31,
            "green": 32
        };

    var inColor = function (string, color) {
        var color_attributes = color && color.split("+"),
            ansi_string = "";

        if (!color_attributes) {
            return string;
        }

        color_attributes.forEach(function (colorAttr) {
            ansi_string += "\033[" + ATTRIBUTES_TO_ANSI[colorAttr] + "m";
        });
        ansi_string += string + "\033[" + ATTRIBUTES_TO_ANSI['off'] + "m";

        return ansi_string;
    };

    var statusColor = {
            passed: "green+bold",
            failed: "red+bold",
            error: "red+bold",
            referenceMissing: "red+bold"
        };

    var reportComparison = function (result) {
        var color = statusColor[result.status] || "",
            statusStr = inColor(result.status, color);

        window.console.log("Testing " + result.pageUrl + "... " + statusStr);
    };

    module.TerminalReporter = function () {
        return {
            reportComparison: reportComparison
        };
    };

    return module;
}(window.csscritic || {}, window));
