window.csscritic = window.csscritic || {};

csscritic.signOffReporter = function () {
    var module = {};

    var calculateFingerprintForPage = function (pageUrl, callback) {
        csscritic.signOffReporterUtil.loadFullDocument(pageUrl, function (content) {
            var actualFingerprint = csscritic.signOffReporterUtil.calculateFingerprint(content);

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

    var acceptSignedOffPage = function (result, signedOffPages, callback) {
        var signedOffPageEntry;

        if (result.status === "failed" || result.status === "referenceMissing") {
            signedOffPageEntry = findPage(result.pageUrl, signedOffPages);

            calculateFingerprintForPage(result.pageUrl, function (actualFingerprint) {
                if (signedOffPageEntry) {
                    if (actualFingerprint === signedOffPageEntry.fingerprint) {
                        console.log("Generating reference image for " + result.pageUrl);
                        result.acceptPage();
                    } else {
                        console.log("Fingerprint does not match for " + result.pageUrl + ", current fingerprint " + actualFingerprint);
                    }
                } else {
                    console.log("No sign-off for " + result.pageUrl + ", current fingerprint " + actualFingerprint);
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
            reportComparison: function (result, callback) {
                if (! Array.isArray(signedOffPages)) {
                    csscritic.signOffReporterUtil.loadFingerprintJson(signedOffPages, function (json) {
                        acceptSignedOffPage(result, json, callback);
                    });
                } else {
                    acceptSignedOffPage(result, signedOffPages, callback);
                }
            }
        };
    };

    return module;
};

csscritic.SignOffReporter = csscritic.signOffReporter().SignOffReporter;
