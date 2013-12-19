window.testHelper = (function () {
    "use strict";

    var testHelper = {};

    var mockImagediff = function () {
        var canvas = document.createElement("canvas"),
            imageData;
        imageData = canvas.getContext("2d").createImageData(100, 100);

        window.imagediff = {
            diff: function () {
                return imageData;
            }
        };
    };

    var setUpMocks = function () {
        var mocks = {};

        var mockImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AsECh0kn2LdqQAAAKlJREFUeNrt3bERADAIAzGT/XeGLQiFfgR0rql0OjrTcwIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABAaJvlXcuFiIgQAQEiIAAERAgAiIgQAQEiIAAERAgAiIgQAQEiIAAERAgAiIgQAQEiIAA0U4DUeIDxDHtCI8AAAAASUVORK5CYII=";

        mocks.htmlImage = function () {
            var htmlImage = window.document.createElement("img");
            htmlImage.src = mockImageUrl;
            return htmlImage;
        };

        mocks.referenceImage = function () {
            var referenceImage = window.document.createElement("img");
            referenceImage.src = mockImageUrl;
            return referenceImage;
        };

        mocks.differenceImageCanvas = function () {
            return window.document.createElement("canvas");
        };

        mocks.differenceImageData = function () {
            return mocks.differenceImageCanvas().getContext("2d").createImageData(100, 100);
        };

        return mocks;
    };

    testHelper.comparison = function (status, renderErrors) {
        var dummyFunc = function () {},
            mocks = setUpMocks(),
            comparison = {
                status: status,
                pageUrl: "aPage.html",
                renderErrors: renderErrors
            };

        if (status === 'error') {
            comparison.pageImage = null;
        } else {
            comparison.pageImage = mocks.htmlImage();
        }

        if (status === 'failed' || status === 'passed') {
            comparison.referenceImage = mocks.referenceImage();
        }

        if (status === 'failed') {
            comparison.differenceImageData = mocks.differenceImageData();
        }

        if (status === 'failed' || status === 'referenceMissing') {
            comparison.resizePageImage = dummyFunc;
            comparison.acceptPage = dummyFunc;
        }

        return comparison;
    };

    testHelper.startingComparison = function () {
        return {
            pageUrl: "aPage.html"
        };
    };

    testHelper.increasePageImageSizeToShowTransparentBackground = function () {
        var elements = document.getElementsByClassName("pageImageContainer");
        Array.prototype.forEach.call(elements, function (elem) {
            elem.style.setProperty("width", "120px");
            elem.style.setProperty("height", "110px");
        });
    };

    testHelper.clickAcceptButtonToShowTick = function () {
        var elements = document.getElementsByTagName("button");
        Array.prototype.forEach.call(elements, function (elem) {
            elem.onclick();
        });
    };

    testHelper.triggerTooltip = function () {
        var comparison = document.querySelector(".comparison"),
            event = {
                pageX: 95,
                pageY: 25
            };
        comparison.onmouseover(event);
    };

    testHelper.mockTaintedCanvas = function () {
        CanvasRenderingContext2D.prototype.getImageData = function () {
            throw new Error();
        };
    };

    var mockCanvasReadSupport = function () {
        // Overwrite method to pass in PhantomJS
        CanvasRenderingContext2D.prototype.getImageData = function () {};
    };

    testHelper.mockDateWith = function (date) {
        window.Date = {
            now: function () {
                return date;
            }
        };
    };

    testHelper.setUp = function () {
        mockImagediff();
        mockCanvasReadSupport();
    };

    return testHelper;
}());
