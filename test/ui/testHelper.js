window.testHelper = (function () {
    "use strict";

    var testHelper = {};

    var mockImagediff = function () {
        window.imagediff = {
            diff: function (imageA, imageB) {
                var canvas = document.createElement("canvas"),
                    height = Math.max(imageA.height, imageB.height),
                    width = Math.max(imageA.width, imageB.width);
                return canvas.getContext("2d").createImageData(width, height);
            }
        };
    };

    var setUpMocks = function () {
        var mocks = {};

        var mockImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3AsECh0kn2LdqQAAAKlJREFUeNrt3bERADAIAzGT/XeGLQiFfgR0rql0OjrTcwIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABASIgAgJEQIAICBABAaJvlXcuFiIgQAQEiIAAERAgAiIgQAQEiIAAERAgAiIgQAQEiIAAERAgAiIgQAQEiIAA0U4DUeIDxDHtCI8AAAAASUVORK5CYII=";

        var heigherMockImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAACWCAYAAAAouC1GAAABSklEQVR4nO3OsQ3AMADDsJzez9vZFygoaMK7znm5Sh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIAVh7AygNYeQArD2DlAaw8gJUHsPIA1nnP4xfdzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM7If7AKXEFkl4JVdsAAAAAElFTkSuQmCC";

        mocks.image = function () {
            var image = window.document.createElement("img");
            image.src = mockImageUrl;
            // Work around image being loaded asynchronously and the reporter needing the size immediatelly
            image.height = 100;
            image.width = 100;
            return image;
        };

        mocks.heigherImage = function () {
            var image = window.document.createElement("img");
            image.src = heigherMockImageUrl;
            // Work around image being loaded asynchronously and the reporter needing the size immediatelly
            image.height = 150;
            image.width = 100;
            return image;
        };

        mocks.differenceImageCanvas = function () {
            return window.document.createElement("canvas");
        };

        mocks.differenceImageData = function (width, height) {
            return mocks.differenceImageCanvas().getContext("2d").createImageData(width, height);
        };

        return mocks;
    };

    testHelper.comparison = function (status, testCase, renderErrors, resizable) {
        var dummyFunc = function () {},
            mocks = setUpMocks(),
            pageImage;

        testCase = testCase || {};
        testCase.url = testCase.url || "aPage.html";

        if (status === 'error') {
            pageImage = null;
        } else {
            pageImage = mocks.image();
        }

        return aComparison(status, testCase, pageImage, renderErrors || [], resizable);
    };

    testHelper.comparisonWithLargerPageImage = function () {
        var mocks = setUpMocks();

        return aComparison('failed', {url: 'aPage.html'}, mocks.heigherImage(), [], false);
    };

    var aComparison = function (status, testCase, pageImage, renderErrors, resizable) {
        var dummyFunc = function () {},
            mocks = setUpMocks(),
            comparison;

        comparison = {
            status: status,
            testCase: testCase,
            renderErrors: renderErrors
        };

        comparison.pageImage = pageImage;

        if (status === 'failed' || status === 'passed') {
            comparison.referenceImage = mocks.image();
        }

        if (status === 'failed') {
            comparison.differenceImageData = mocks.differenceImageData(pageImage.width, pageImage.height);
        }

        if (status === 'failed' || status === 'referenceMissing') {
            if (resizable !== false) {
                comparison.resizePageImage = dummyFunc;
            }
            comparison.acceptPage = dummyFunc;
        }

        return comparison;
    };

    testHelper.startingComparison = function () {
        return {
            pageUrl: "aPage.html",
            testCase: {
                url: "aPage.html"
            }
        };
    };

    testHelper.increasePageImageSizeToShowTransparentBackground = function () {
        var elements = document.getElementsByClassName("currentPageResizableCanvas");
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

    testHelper.passingTestSuite = function () {
        return {
            success: true
        };
    };

    testHelper.failingTestSuite = function () {
        return {
            success: false
        };
    };

    testHelper.setUp = function () {
        mockImagediff();
        mockCanvasReadSupport();
    };

    testHelper.constructBasicHTMLReporter = function () {
        var util = csscriticLib.util(),
            basicHTMLReporterUtil = csscriticLib.basicHTMLReporterUtil(),
            basicHTMLReporter = csscriticLib.basicHTMLReporter(util, basicHTMLReporterUtil, window.document);

        return basicHTMLReporter.BasicHTMLReporter();
    };

    testHelper.constructNiceReporter = function () {
        var util = csscriticLib.util(),
            niceReporter = csscriticLib.niceReporter(util);

        return niceReporter.NiceReporter();
    };

    return testHelper;
}());
