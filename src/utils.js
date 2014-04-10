window.csscritic = (function (module) {
    module.util = {};

    module.util.getDataURIForImage = function (image) {
        var canvas = window.document.createElement("canvas"),
            context = canvas.getContext("2d");

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0);

        return canvas.toDataURL("image/png");
    };

    module.util.getImageForUrl = function (url, successCallback, errorCallback) {
        var image = new window.Image();

        image.onload = function () {
            successCallback(image);
        };
        if (errorCallback) {
            image.onerror = errorCallback;
        }
        image.src = url;
    };

    module.util.getImageForBinaryContent = function (content, callback) {
        var image = new window.Image();

        image.onload = function () {
            callback(image);
        };
        image.onerror = function () {
            callback(null);
        };
        image.src = 'data:image/png;base64,' + btoa(content);
    };

    var getBinary = function (data) {
        var binaryContent = "";

        for (var i = 0; i < data.length; i++) {
            binaryContent += String.fromCharCode(data.charCodeAt(i) & 0xFF);
        }
        return binaryContent;
    };

    var getUncachableURL = function (url) {
        return url + "?_=" + Date.now();
    };

    module.util.ajax = function (url) {
        var defer = ayepromise.defer(),
            xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.status === 200 || xhr.status === 0) {
                defer.resolve(getBinary(xhr.response));
            } else {
                defer.reject();
            }
        };

        xhr.onerror = function () {
            defer.reject();
        };

        try {
            xhr.open('get', getUncachableURL(url), true);
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
            xhr.send();
        } catch (e) {
            defer.reject();
        }

        return defer.promise;
    };

    module.util.workAroundTransparencyIssueInFirefox = function (image, callback) {
        // Work around bug https://bugzilla.mozilla.org/show_bug.cgi?id=790468 where the content of a canvas
        //   drawn to another one will be slightly different if transparency is involved.
        // Here the reference image has been drawn to a canvas once (to serialize it to localStorage), while the
        //   image of the newly rendered page hasn't.  Solution: apply the same transformation to the second image, too.
        var dataUri;
        try {
            dataUri = module.util.getDataURIForImage(image);
        } catch (e) {
            // Fallback for Chrome & Safari
            callback(image);
            return;
        }

        module.util.getImageForUrl(dataUri, function (newImage) {
            callback(newImage);
        });
    };

    module.util.map = function (list, func, callback) {
        var completedCount = 0,
            results = [],
            i;

        if (list.length === 0) {
            callback(results);
        }

        var callForItem = function (idx) {
            function funcFinishCallback(result) {
                completedCount += 1;

                results[idx] = result;

                if (completedCount === list.length) {
                    callback(results);
                }
            }

            func(list[idx], funcFinishCallback);
        };

        for(i = 0; i < list.length; i++) {
            callForItem(i);
        }
    };

    return module;
}(window.csscritic || {}));
