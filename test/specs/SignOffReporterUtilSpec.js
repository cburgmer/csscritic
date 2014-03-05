describe("SignOffReporterUtil", function () {
    describe("loadFullDocument", function () {
        it("should return a fully inlined document", function (done) {
            var fixtureUrl = csscriticTestPath + "fixtures/",
                pageUrl = fixtureUrl + 'pageToInline.html';

            csscritic.signOffReporterUtil.loadFullDocument(pageUrl, function (content) {
                expect(content).toMatch(/<style type="text\/css">\s*p\s*\{\s*font-size: 12px;\s*\}/);
                expect(content).toMatch(/<script>\s*var s = "hello";/);

                done();
            });
        });
    });

    describe("loadFingerprintJson", function () {
        it("should load a json file and return the content", function (done) {
            var fixtureUrl = csscriticTestPath + "fixtures/",
                jsonUrl = fixtureUrl + 'fingerprints.json';

            csscritic.signOffReporterUtil.loadFingerprintJson(jsonUrl, function (result) {
                expect(result).toEqual([{
                    pageUrl: 'pageUnderTest.html',
                    fingerprint: "fIngRPrinT"
                }]);

                done();
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
