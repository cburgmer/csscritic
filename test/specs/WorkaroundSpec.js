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
