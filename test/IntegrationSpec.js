describe("Integration", function () {
    ifNotInWebkitIt("should compare a page with its reference image and return true if similar", function () {
        var success = null;

        csscritic.compare("fixtures/pageUnderTest.html", "fixtures/pageUnderTestReference.png", function (result) {
            success = result;
        });

        waitsFor(function () {
            return success !== null;
        });

        runs(function () {
            expect(success).toBeTruthy();
        });
    });
});
