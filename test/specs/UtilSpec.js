describe("Utility", function () {
    describe("getImageForUrl", function () {
        it("should load an image", function (done) {
            var imgUrl = csscriticTestPath + "fixtures/green.png";

            csscritic.util.getImageForUrl(imgUrl, function (image) {
                expect(image instanceof HTMLElement).toBeTruthy();
                expect(image.nodeName).toEqual("IMG");
                expect(image.src.substr(-imgUrl.length)).toEqual(imgUrl);

                done();
            });
        });

        it("should handle a missing image", function (done) {
            csscritic.util.getImageForUrl("does_not_exist.png", function () {}, function () {
                done();
            });
        });
    });

    describe("getDataURIForImage", function () {
        it("should return the data URI for the given image", function (done) {
            var imageDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=";

            csscriticTestHelper.loadImageFromUrl(imageDataUri, function (image) {
                var dataUri = csscritic.util.getDataURIForImage(image);
                expect(dataUri).toContain(imageDataUri.substr(0, 10));

                done();
            });
        });
    });

    describe("getImageForBinaryContent", function () {
        it("should load an image", function (done) {
            var imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2P8DwQACgAD/il4QJ8AAAAASUVORK5CYII=';

            csscritic.util.getImageForBinaryContent(atob(imageData), function (image) {
                expect(image instanceof HTMLElement).toBeTruthy();
                expect(image.nodeName).toEqual("IMG");
                expect(image.src).toEqual('data:image/png;base64,' + imageData);

                done();
            });
        });

        it("should handle invalid image content", function (done) {
            csscritic.util.getImageForBinaryContent("invalid content", function (image) {
                expect(image).toBe(null);

                done();
            });
        });
    });

    describe("ajax", function () {

        it("should load content from a URL", function (done) {
            var errorCallback = jasmine.createSpy("errorCallback");

            csscritic.util.ajax(jasmine.getFixtures().fixturesPath + "simple.js", function (content) {
                expect(content).toEqual('var s = "hello";\n');

                done();
            }, errorCallback);
        });

        it("should load binary data", function (done) {
            csscritic.util.ajax(jasmine.getFixtures().fixturesPath + "green.png", function (content) {
                expect(btoa(content)).toEqual("iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABFElEQVR4nO3OMQ0AAAjAMPybhnsKxrHUQGc2r+iBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YGQHgjpgZAeCOmBkB4I6YHAAV821mT1w27RAAAAAElFTkSuQmCC");

                done();
            }, function () {});
        });

        it("should call error callback on fail", function (done) {
            csscritic.util.ajax(jasmine.getFixtures().fixturesPath + "non_existing_url.html", function () {}, function () {
                done();
            });
        });

        it("should not cache repeated calls by default", function () {
            var dateNowSpy = spyOn(window.Date, 'now').and.returnValue(42),
                ajaxRequest = jasmine.createSpyObj("ajaxRequest", ["open", "addEventListener", "overrideMimeType", "send"]);

            spyOn(window, "XMLHttpRequest").and.returnValue(ajaxRequest);

            csscritic.util.ajax("non_existing_url.html", function () {}, function () {});

            expect(ajaxRequest.open.calls.mostRecent().args[1]).toEqual('non_existing_url.html?_=42');

            dateNowSpy.and.returnValue(43);
            csscritic.util.ajax("non_existing_url.html", function () {}, function () {});
            expect(ajaxRequest.open.calls.mostRecent().args[1]).toEqual('non_existing_url.html?_=43');
        });

    });

    describe("map", function () {
        it("should map each value to one function call and then call complete function", function () {
            var completedValues = [],
                completed = false;

            csscritic.util.map([1, 2, 3], function (val, callback) {
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

            csscritic.util.map([1, 2, 3], function (val, callback) {
                callback(val + 1);
            }, function (results) {
                computedResults = results;
            });

            expect(computedResults).toEqual([2, 3, 4]);
        });

        it("should call complete if empty list is passed", function () {
            var completed = false,
                computedResults = null;

            csscritic.util.map([], function () {}, function (results) {
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

            csscritic.util.map([1, 2, 3], function (val, callback) {
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

    describe("executor queue", function () {
        afterEach(function () {
            csscritic.util.queue.clear();
        });

        it("should execute a single job", function () {
            var job = jasmine.createSpy("job");
            csscritic.util.queue.execute(job);

            expect(job).toHaveBeenCalled();
        });

        it("should execute two jobs sequencially", function () {
            var job1 = jasmine.createSpy("job1"),
                job2 = jasmine.createSpy("job2");
            csscritic.util.queue.execute(job1);
            csscritic.util.queue.execute(job2);

            expect(job1).toHaveBeenCalled();
            expect(job2).not.toHaveBeenCalled();

            job1.calls.mostRecent().args[0]();
            expect(job2).toHaveBeenCalled();
        });
    });

});
