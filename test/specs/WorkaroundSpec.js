describe("Workarounds", function () {
    "use strict";

    var csscritic;

    var aOnceAutoAcceptingReporter = function () {
            var onceAutoAcceptingReporterCalled = false;
            return {
                reportComparison: function (result) {
                    if (!onceAutoAcceptingReporterCalled) {
                        onceAutoAcceptingReporterCalled = true;
                        result.acceptPage();
                    }
                }
            };
        };

    beforeEach(function () {
        var util = csscriticLib.util(),
            browserRenderer = csscriticLib.browserRenderer(util, csscriticLib.jobQueue, rasterizeHTML),
            domstorage = csscriticLib.domstorage(util, localStorage),
            reporting = csscriticLib.reporting(browserRenderer, domstorage, util),
            regression = csscriticLib.regression(browserRenderer, domstorage, util, imagediff);

        csscritic = csscriticLib.main(
            regression,
            reporting,
            util);
    });

    afterEach(function () {
        localStorage.clear();
    });

    ifNotInWebkitIt("should work around transparency making pages non-comparable", function (done) {
        // Create reference image first
        csscritic.addReporter(aOnceAutoAcceptingReporter());
        csscritic.add({url: testHelper.fixture("transparencyBug.html")});
        csscritic.execute(function () {

            // Now test against the reference
            csscritic.add({url: testHelper.fixture("transparencyBug.html")});
            csscritic.execute(function (passed) {
                expect(passed).toBe(true);

                done();
            });
        });
    });
});
