describe("Workarounds", function () {
    var autoAcceptingReporter = {
            reportComparison: function (result, callback) {
                result.acceptPage();
                callback();
            }
        };

    afterEach(function () {
        localStorage.clear();
        csscritic.clearReporters();
    });

    ifNotInWebkitIt("should work around transparency making pages non-comparable", function () {
        var success = null;

        // Create reference image first
        csscritic.addReporter(autoAcceptingReporter);
        csscritic.compare({url: csscriticTestPath + "fixtures/transparencyBug.html"}, function (result) {
            success = result;
        });

        waitsFor(function () {
            return success !== null;
        });

        runs(function () {
            csscritic.clearReporters();
            success = null;

            // Now test against the reference
            csscritic.compare({url: csscriticTestPath + "fixtures/transparencyBug.html"}, function (result) {
                success = result;
            });
        });

        waitsFor(function () {
            return success !== null;
        });

        runs(function () {
            expect(success).toEqual("passed");
        });
    });
});
