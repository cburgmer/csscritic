describe("Utility", function () {
    "use strict";

    var util = csscriticLib.util();

    describe("getImageForUrl", function () {
        it("should load an image", function (done) {
            var imgUrl = csscriticTestPath + "fixtures/green.png";

            util.getImageForUrl(imgUrl).then(function (image) {
                expect(image instanceof HTMLElement).toBeTruthy();
                expect(image.nodeName).toEqual("IMG");
                expect(image.src.substr(-imgUrl.length)).toEqual(imgUrl);

                done();
            });
        });

        it("should handle a missing image", function (done) {
            util.getImageForUrl("does_not_exist.png")
                .then(null, done);
        });
    });

    describe("getDataURIForImage", function () {
        it("should return the data URI for the given image", function (done) {
            var imageDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=";

            csscriticTestHelper.loadImageFromUrl(imageDataUri, function (image) {
                var dataUri = util.getDataURIForImage(image);
                expect(dataUri).toContain(imageDataUri.substr(0, 10));

                done();
            });
        });
    });

    describe("getImageForBinaryContent", function () {
        it("should load an image", function (done) {
            var imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=';

            util.getImageForBinaryContent(atob(imageData)).then(function (image) {
                expect(image instanceof HTMLElement).toBeTruthy();
                expect(image.nodeName).toEqual("IMG");
                expect(image.src).toEqual('data:image/png;base64,' + imageData);

                done();
            });
        });

        it("should handle invalid image content", function (done) {
            util.getImageForBinaryContent("invalid content")
                .then(null, done);
        });
    });

    describe("ajax", function () {

        it("should load content from a URL", function (done) {
            util.ajax(jasmine.getFixtures().fixturesPath + "simple.js").then(function (content) {
                expect(content).toEqual('var s = "hello";\n');

                done();
            });
        });

        it("should load binary data", function (done) {
            util.ajax(jasmine.getFixtures().fixturesPath + "green.png").then(function (content) {
                expect(btoa(content)).toEqual("iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABFElEQVR4nO3OMQ0AAAjAMPybhnsKxrHUQGc2r+iBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YHAAV821mT1w27RAAAAAElFTkSuQmCC");

                done();
            });
        });

        it("should call error callback on fail", function (done) {
            util.ajax(jasmine.getFixtures().fixturesPath + "non_existing_url.html").then(null, function () {
                done();
            });
        });

        it("should not cache repeated calls by default", function () {
            var dateNowSpy = spyOn(window.Date, 'now').and.returnValue(42),
                ajaxRequest = jasmine.createSpyObj("ajaxRequest", ["open", "addEventListener", "overrideMimeType", "send"]);

            spyOn(window, "XMLHttpRequest").and.returnValue(ajaxRequest);

            util.ajax("non_existing_url.html");

            expect(ajaxRequest.open.calls.mostRecent().args[1]).toEqual('non_existing_url.html?_=42');

            dateNowSpy.and.returnValue(43);
            util.ajax("non_existing_url.html");
            expect(ajaxRequest.open.calls.mostRecent().args[1]).toEqual('non_existing_url.html?_=43');
        });

    });

    describe("excludeKey", function () {
        it("should exclude a given key", function () {
            var result = util.excludeKey({
                theKey: 'theValue',
                anotherKey: 'anotherValue'
            }, 'theKey');

            expect(result).toEqual({
                anotherKey: 'anotherValue'
            });
        });

        it("should return an empty map if no key left", function () {
            var result = util.excludeKey({
                theKey: 'theValue'
            }, 'theKey');

            expect(result).toEqual({});
        });

        it("should return unchanged copy if key is not found", function () {
            var result = util.excludeKey({
                theKey: 'theValue'
            }, 'anotherKey');

            expect(result).toEqual({
                theKey: 'theValue'
            });
        });
    });

    describe("serializeMap", function () {
        it("should serialize a map with a single value", function () {
            var serialization = util.serializeMap({theKey: 'theValue'});
            expect(serialization).toEqual('theKey=theValue');
        });

        it("should serialize a map with a two values in alphabetic order", function () {
            var serialization = util.serializeMap({
                theKey: 'theValue',
                anotherKey: 'anotherValue'
            });
            expect(serialization).toEqual('anotherKey=anotherValue,theKey=theValue');
        });
    });

    describe("map", function () {
        it("should map each value to one function call and then call complete function", function () {
            var completedValues = [],
                completed = false;

            util.map([1, 2, 3], function (val, callback) {
                completedValues.push(val);

                callback();
            }, function () {
                completed = true;
            });

            expect(completed).toBeTruthy();
            expect(completedValues).toEqual([1, 2, 3]);
        });

        it("should pass computed results as array to complete function", function () {
            var computedResults = null;

            util.map([1, 2, 3], function (val, callback) {
                callback(val + 1);
            }, function (results) {
                computedResults = results;
            });

            expect(computedResults).toEqual([2, 3, 4]);
        });

        it("should call complete if empty list is passed", function () {
            var completed = false,
                computedResults = null;

            util.map([], function () {}, function (results) {
                completed = true;
                computedResults = results;
            });

            expect(completed).toBeTruthy();
            expect(computedResults).toEqual([]);
        });

        it("should not call complete until last value is handled", function () {
            var completedValues = [],
                completed = false,
                lastCallback = null;

            util.map([1, 2, 3], function (val, callback) {
                completedValues.push(val);

                if (val < 3) {
                    callback();
                } else {
                    lastCallback = callback;
                }
            }, function () {
                completed = true;
            });

            expect(completed).toBeFalsy();

            lastCallback();

            expect(completed).toBeTruthy();
        });

    });
});
