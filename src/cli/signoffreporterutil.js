csscriticLib.signOffReporterUtil = function (util, inlineresources, JsSHA) {
    "use strict";

    var module = {};

    var getFileUrl = function (address) {
        var fs;

        if (window.require) {
            fs = require("fs");

            return address.indexOf("://") === -1 ? "file://" + fs.absolute(address) : address;
        } else {
            return address;
        }
    };

    module.loadFullDocument = function (pageUrl, callback) {
        var absolutePageUrl = getFileUrl(pageUrl),
            doc = window.document.implementation.createHTMLDocument("");

        util.ajax(absolutePageUrl).then(function (content) {
            doc.documentElement.innerHTML = content;

            inlineresources.inlineReferences(doc, {baseUrl: absolutePageUrl, cache: false}).then(function () {
                callback('<html>' +
                    doc.documentElement.innerHTML +
                    '</html>');
            });
        }, function () {
            console.log("Error loading document for sign-off: " + pageUrl + ". For accessing URLs over HTTP you need CORS enabled on that server.");
        });
    };

    module.loadFingerprintJson = function (url, callback) {
        var absoluteUrl = getFileUrl(url);

        util.ajax(absoluteUrl).then(function (content) {
            callback(JSON.parse(content));
        });
    };

    module.calculateFingerprint = function (content) {
        var shaObj = new JsSHA(content, "TEXT");

        return shaObj.getHash("SHA-224", "HEX");
    };

    return module;
};
