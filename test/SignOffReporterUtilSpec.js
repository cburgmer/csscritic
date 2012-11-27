describe("SignOffReporterUtil", function () {
    describe("loadFullDocument", function () {
        it("should return a fully inlined document", function () {
            var fixtureUrl = csscriticTestPath + "fixtures/",
                pageUrl = fixtureUrl + 'pageToInline.html',
                content = null;

            csscritic.signOffReporterUtil.loadFullDocument(pageUrl, function (fullContent) {
                content = fullContent;
            });

            waitsFor(function () {
                return content !== null;
            });

            runs(function () {
                expect(content).toMatch(/<style type="text\/css">\s*p\s*\{\s*font-size: 12px;\s*\}/);
            });
        });
    });

    describe("calculateFingerprint", function () {
        it("should return the SHA2 hash for a given content", function () {
            var hash = csscritic.signOffReporterUtil.calculateFingerprint("the given content");

            expect(hash).toEqual("94f8e929ff9a65f9146f86226aee1c3cc1fa0bc5ad7bbceee792000b");
        });
    });
});
