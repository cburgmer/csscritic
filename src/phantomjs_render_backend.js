var port = 8765;

phantom.injectJs("../components/rasterizeHTML.js/dist/rasterizeHTML.allinone.js");

function get(url, mimeType, successCallback, errorCallback) {
    var page = require("webpage").create(),
        basePageMatch = /^(https?:)?\/\/[^\/]+/.exec(url)
        basePage = basePageMatch ? basePageMatch[0] : url;

    // HACK for relative protocol support
    if (basePage.indexOf("//") === 0) {
        basePage = "http:" + basePage;
    }

    page.open(basePage, function(status) {
        if (status !== 'success') {
            errorCallback("internal error");
            return;
        }

        page.onConsoleMessage = function (msg) {
            var params;
            try {
                params = JSON.parse(msg);
            } catch (e) {
                console.log("Error: Can't understand internal command " + msg + " : " + e);
                return;
            }


            if (params.status === 'success') {
                successCallback(params.content);
            } else {
                errorCallback();
            }
        };

        page.evaluate(function (url, mimeType) {
            var ajaxRequest = new window.XMLHttpRequest(),
                repond = function (status, content) {
                    console.log(JSON.stringify({
                        status: status,
                        content: content
                    }));
                };
            ajaxRequest.addEventListener("load", function () {
                if (ajaxRequest.status === 200 || ajaxRequest.status === 0) {
                    repond('success', ajaxRequest.response);
                } else {
                    repond('error');
                }
            }, false);

            ajaxRequest.addEventListener("error", function () {
                repond('error');
            }, false);

            ajaxRequest.open('GET', url, true);
            if (mimeType) {
                ajaxRequest.overrideMimeType(mimeType);
            }
            try {
                ajaxRequest.send(null);
            } catch (err) {
                repond('error');
            }
        }, url, mimeType);
    });
}

var getUncachableURL = function (url, workAroundCaching) {
    if (workAroundCaching) {
        return url + "?_=" + Date.now();
    } else {
        return url;
    }
};

function ajax(url, options, successCallback, errorCallback) {
    var augmentedUrl;

    options = options || {};
    augmentedUrl = getUncachableURL(url, options.cache === false);

    get(augmentedUrl, options.mimeType, successCallback, errorCallback);
};

rasterizeHTMLInline.util.ajax = ajax;

function loadDocument(url, successCallback, errorCallback) {
    get(url, null, function (html) {
        var doc = window.document.implementation.createHTMLDocument("");
        doc.documentElement.innerHTML = html;

        rasterizeHTMLInline.inlineReferences(doc, {baseUrl: url}, function (allErrors) {
            rasterizeHTML.util.executeJavascript(doc, 200, function (doc, errors) {
                successCallback(doc, allErrors.concat(errors));
            });
        });
    }, errorCallback);
}

function loadPage(url, successCallback, errorCallback) {
    loadDocument(url, function (doc, errors) {
        var html = (new window.XMLSerializer()).serializeToString(doc.documentElement)
        successCallback(html, errors);
    }, errorCallback);
}

function loadPageSvg(url, width, height, successCallback, errorCallback) {
    loadDocument(url, function (doc, errors) {
        var svg = rasterizeHTML.getSvgForDocument(doc, width, height);
        successCallback(svg, errors);
    }, errorCallback);
}

function parseUrl(url) {
    var params = {};
    url.substring(url.indexOf("?") + 1).split('&').forEach(function(keyValue) {
        var param = keyValue.split('=', 2);
        params[param[0]] = param[1];
    });
    return params;
}

function serveInlinedPage(request, response) {
    var params;

    if (request.url.indexOf("?") < 0) {
        response.statusCode = 500;
        response.write("");
        response.close();
        return;
    }

    params = parseUrl(request.url);

    loadPage(params.url, function (htmlContent) {
        response.statusCode = 200;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
        response.write(htmlContent);
        response.close();
    }, function () {
        response.statusCode = 500;
        response.write("");
        response.close();
    });
}

function servePageSvg(request, response) {
    var params;

    if (request.url.indexOf("?") < 0) {
        response.statusCode = 500;
        response.write("");
        response.close();
        return;
    }

    params = parseUrl(request.url);

    loadPageSvg(params.url, params.width, params.height, function (svgContent) {
        response.statusCode = 200;
        response.setHeader("Content-Type", "image/svg+xml");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
        response.write(svgContent);
        response.close();
    }, function () {
        response.statusCode = 500;
        response.write("");
        response.close();
    });
}

function startWebserver() {

    var fs = require('fs'),
        server = require('webserver').create();

    var launched = server.listen(port, function(request, response) {
        console.log("Requested " + request.url);

        if (/\/svg(\?|$)/.test(request.url)) {
            servePageSvg(request, response);
        } else if (/\/inline(\?|$)/.test(request.url)) {
            serveInlinedPage(request, response);
        } else {
            response.statusCode = 404;
            response.write("");
            response.close();
        }
    });

    if (!launched) {
        console.log("Error: Unable to start internal web server on port", port);
        phantom.exit(1);
    }

}

startWebserver();
