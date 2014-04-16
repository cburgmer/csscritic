describe("Workarounds", function () {
    "use strict";

    var autoAcceptingReporter = {
            reportComparison: function (result, callback) {
                result.acceptPage();
                callback();
            }
        };

    var csscritic;

    beforeEach(function () {
        var util = csscriticLib.util(),
            browserRenderer = csscriticLib.browserRenderer(util, csscriticLib.jobQueue, rasterizeHTML),
            domstorage = csscriticLib.domstorage(util, localStorage);

        csscritic = csscriticLib.main(
            browserRenderer,
            domstorage,
            util,
            imagediff);
    });

    afterEach(function () {
        localStorage.clear();
    });

    ifNotInWebkitIt("should work around transparency making pages non-comparable", function (done) {
        // Create reference image first
        csscritic.addReporter(autoAcceptingReporter);
        csscritic.add({url: csscriticTestPath + "fixtures/transparencyBug.html"});
        csscritic.execute(function () {
            csscritic.clearReporters();

            // Now test against the reference
            csscritic.add({url: csscriticTestPath + "fixtures/transparencyBug.html"});
            csscritic.execute(function (passed) {
                expect(passed).toBe(true);

                done();
            });
        });
    });
});
