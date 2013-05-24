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

    module.util.getImageForBlob = function (blob, callback) {
        var reader = new FileReader(),
            img = new window.Image();

        img.onload = function () {
            callback(img);
        };
        img.onerror = function () {
            callback(null);
        };
        reader.onload = function (e) {
            img.src = e.target.result;
        };

        reader.readAsDataURL(blob);
    };

    module.util.getTextForBlob = function (blob, callback) {
        var reader = new FileReader();

        reader.onload = function (e) {
            callback(e.target.result);
        };

        reader.readAsText(blob);
    };

    var aBlob = function (content, properties) {
        // Workaround for old PhantomJS
        var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder,
            blobBuilder;
        try {
            return new Blob([content], properties);
        } catch (e) {
            blobBuilder = new BlobBuilder();
            blobBuilder.append(content[0]);
            return blobBuilder.getBlob(properties.type);
        }
    };

    var getBlobForBinary = function (data) {
        var binaryContent = "";

        for (var i = 0; i < data.length; i++) {
            binaryContent += String.fromCharCode(data.charCodeAt(i) & 0xFF);
        }
        return aBlob([binaryContent], {"type": "unknown"});
    };

    var getUncachableURL = function (url) {
        return url + "?_=" + Date.now();
    };

    module.util.ajax = function (url, successCallback, errorCallback) {
        var xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.status === 200 || xhr.status === 0) {
                if (xhr.response instanceof Blob) {
                    successCallback(xhr.response);
                } else {
                    // Workaround for Safari 6 not supporting xhr.responseType = 'blob'
                    successCallback(getBlobForBinary(xhr.response));
                }
            } else {
                errorCallback();
            }
        };

        xhr.onerror = function () {
            errorCallback();
        };

        try {
            xhr.open('get', getUncachableURL(url), true);
            xhr.responseType = 'blob';
            xhr.send();
        } catch (e) {
            errorCallback();
        }
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

    module.util.queue = {};

    var jobQueue = [],
        busy = false;

    var nextInQueue = function () {
        var func;
        if (jobQueue.length > 0) {
            busy = true;
            func = jobQueue.shift();
            func(nextInQueue);
        } else {
            busy = false;
        }
    };

    module.util.queue.execute = function (func) {
        jobQueue.push(func);
        if (!busy) {
            nextInQueue();
        }
    };

    module.util.queue.clear = function () {
        jobQueue = [];
        busy = false;
    };

    return module;
}(window.csscritic || {}));
