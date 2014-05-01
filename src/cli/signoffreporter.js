csscriticLib.signOffReporter = function (signOffReporterUtil) {
    "use strict";

    var module = {};

    var calculateFingerprintForPage = function (pageUrl, callback) {
        signOffReporterUtil.loadFullDocument(pageUrl, function (content) {
            var actualFingerprint = signOffReporterUtil.calculateFingerprint(content);

            callback(actualFingerprint);
        });
    };

    var findPage = function (pageUrl, signedOffPages) {
        var signedOffPage = null;

        signedOffPages.forEach(function (entry) {
            if (entry.pageUrl === pageUrl) {
                signedOffPage = entry;
            }
        });

        return signedOffPage;
    };

    var acceptSignedOffPage = function (comparison, signedOffPages, callback) {
        var signedOffPageEntry;

        if (comparison.status === "failed" || comparison.status === "referenceMissing") {
            signedOffPageEntry = findPage(comparison.testCase.url, signedOffPages);

            calculateFingerprintForPage(comparison.testCase.url, function (actualFingerprint) {
                if (signedOffPageEntry) {
                    if (actualFingerprint === signedOffPageEntry.fingerprint) {
                        console.log("Generating reference image for " + comparison.testCase.url);
                        comparison.acceptPage();
                    } else {
                        console.log("Fingerprint does not match for " + comparison.testCase.url + ", current fingerprint " + actualFingerprint);
                    }
                } else {
                    console.log("No sign-off for " + comparison.testCase.url + ", current fingerprint " + actualFingerprint);
                }

                if (callback) {
                    callback();
                }
            });
        } else {
            if (callback) {
                callback();
            }
        }
    };

    module.SignOffReporter = function (signedOffPages) {
        return {
            reportComparison: function (comparison, callback) {
                if (! Array.isArray(signedOffPages)) {
                    signOffReporterUtil.loadFingerprintJson(signedOffPages, function (json) {
                        acceptSignedOffPage(comparison, json, callback);
                    });
                } else {
                    acceptSignedOffPage(comparison, signedOffPages, callback);
                }
            }
        };
    };

    return module;
};
