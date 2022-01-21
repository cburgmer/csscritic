csscriticLib.util = function () {
    "use strict";

    var module = {};

    module.getDataURIForImage = function (image) {
        var canvas = window.document.createElement("canvas"),
            context = canvas.getContext("2d");

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        context.drawImage(image, 0, 0);

        return canvas.toDataURL("image/png");
    };

    module.getImageForUrl = function (url) {
        return new Promise(function (fulfill, reject) {
            var image = new window.Image();

            image.onload = function () {
                fulfill(image);
            };
            image.onerror = function () {
                reject();
            };
            image.src = url;
        });
    };

    var getUncachableURL = function (url) {
        var delimiter;
        if (url.indexOf("?") < 0) {
            delimiter = "?";
        } else {
            delimiter = "&";
        }
        return url + delimiter + "_=" + Date.now();
    };

    module.loadAsBlob = function (url) {
        return new Promise(function (fulfill, reject) {
            var xhr = new XMLHttpRequest();

            xhr.onload = function () {
                if (xhr.status === 200 || xhr.status === 0) {
                    fulfill(xhr.response);
                } else {
                    reject(new Error(xhr.statusText));
                }
            };

            xhr.onerror = function (e) {
                reject(e);
            };

            try {
                xhr.open("get", getUncachableURL(url), true);
                xhr.responseType = "blob";
                xhr.send();
            } catch (e) {
                reject(e);
            }
        });
    };

    module.loadBlobAsText = function (blob) {
        return new Promise(function (fulfill, reject) {
            var reader = new FileReader();

            reader.onload = function (e) {
                fulfill(e.target.result);
            };

            reader.onerror = function () {
                reject();
            };

            reader.readAsText(blob);
        });
    };

    module.loadBlobAsDataURI = function (blob) {
        return new Promise(function (fulfill, reject) {
            var reader = new FileReader();

            reader.onload = function (e) {
                fulfill(e.target.result);
            };

            reader.onerror = function () {
                reject();
            };

            reader.readAsDataURL(blob);
        });
    };

    // excludeKeys(theMap, excludeKey...)
    module.excludeKeys = function (theMap) {
        var excludeKeys = Array.prototype.slice.call(arguments, 1),
            newMap = {};

        Object.keys(theMap).forEach(function (key) {
            if (excludeKeys.indexOf(key) === -1) {
                newMap[key] = theMap[key];
            }
        });

        return newMap;
    };

    module.serializeMap = function (theMap) {
        var serializationEntries = [],
            keys = Object.keys(theMap);

        keys.sort();
        keys.forEach(function (key) {
            serializationEntries.push(key + "=" + theMap[key]);
        });
        return serializationEntries.join(",");
    };

    module.clone = function (object) {
        var theClone = {},
            i;
        for (i in object) {
            if (object.hasOwnProperty(i)) {
                theClone[i] = object[i];
            }
        }
        return theClone;
    };

    module.workAroundTransparencyIssueInFirefox = function (image) {
        // Work around bug https://bugzilla.mozilla.org/show_bug.cgi?id=790468 where the content of a canvas
        //   drawn to another one will be slightly different if transparency is involved.
        // Here the reference image has been drawn to a canvas once (to serialize it to localStorage), while the
        //   image of the newly rendered page hasn't.  Solution: apply the same transformation to the second image, too.
        var dataUri;
        try {
            dataUri = module.getDataURIForImage(image);
        } catch (e) {
            // Fallback for Chrome & Safari
            return Promise.resolve(image);
        }

        return module.getImageForUrl(dataUri);
    };

    module.hasTestSuitePassed = function (comparisons) {
        var nonPassingTestCases = comparisons.filter(function (comparison) {
                return comparison.status !== "passed";
            }),
            allPassed = nonPassingTestCases.length === 0,
            hasValidTestSetup = comparisons.length > 0;

        return hasValidTestSetup && allPassed;
    };

    module.all = function (functionReturnValues) {
        var defer = ayepromise.defer(),
            pendingFunctionCalls = functionReturnValues.length,
            resolvedValues = [];

        var functionCallResolved = function (value, idx) {
            pendingFunctionCalls -= 1;
            resolvedValues[idx] = value;

            if (pendingFunctionCalls === 0) {
                defer.resolve(resolvedValues);
            }
        };

        if (functionReturnValues.length === 0) {
            defer.resolve([]);
            return defer.promise;
        }

        functionReturnValues.forEach(function (returnValue, idx) {
            if (returnValue && returnValue.then) {
                returnValue.then(
                    function (result) {
                        functionCallResolved(result, idx);
                    },
                    function (e) {
                        defer.reject(e);
                    }
                );
            } else {
                functionCallResolved(returnValue, idx);
            }
        });
        return defer.promise;
    };

    return module;
};
