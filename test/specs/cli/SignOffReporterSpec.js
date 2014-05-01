describe("SignOffReporter", function () {
    "use strict";

    var util = csscriticLib.util(),
        signOffReporterUtil = csscriticLib.signOffReporterUtil(util, inlineresources, jsSHA),
        signOffReporter;

    var htmlImage = "html image",
        referenceImage = "reference image",
        acceptPageSpy, loadFullDocumentSpy, calculateFingerprintSpy;

    beforeEach(function () {
        signOffReporter = csscriticLib.signOffReporter(signOffReporterUtil);

        acceptPageSpy = jasmine.createSpy("acceptPage");
        loadFullDocumentSpy = spyOn(signOffReporterUtil, 'loadFullDocument').and.callFake(function (url, callback) {
            callback("some content");
        });
        calculateFingerprintSpy = spyOn(signOffReporterUtil, 'calculateFingerprint').and.returnValue("fIngRPrinT");
    });

    it("should call the callback when finished reporting", function () {
        var callback = jasmine.createSpy("callback");

        var reporter = signOffReporter.SignOffReporter([{
            pageUrl: "something",
            fingerprint: "fIngRPrinT"
        }]);

        reporter.reportComparison({}, callback);

        expect(callback).toHaveBeenCalled();
    });

    it("should auto-accept a signed off version on a failing test", function () {
        var fixtureUrl = csscriticTestPath + "fixtures/",
            pageUrl = fixtureUrl + 'pageUnderTest.html';

        var reporter = signOffReporter.SignOffReporter([{
            pageUrl: pageUrl,
            fingerprint: "fIngRPrinT"
        }]);

        reporter.reportComparison({
            status: "failed",
            testCase: {
                url: pageUrl
            },
            pageImage: htmlImage,
            resizePageImage: function () {},
            acceptPage: acceptPageSpy,
            referenceImage: referenceImage
        });

        expect(acceptPageSpy).toHaveBeenCalled();

        expect(loadFullDocumentSpy).toHaveBeenCalledWith(pageUrl, jasmine.any(Function));
        expect(calculateFingerprintSpy).toHaveBeenCalledWith("some content");
    });

    it("should auto-accept a signed off version on a test with a missing reference", function () {
        var fixtureUrl = csscriticTestPath + "fixtures/",
            pageUrl = fixtureUrl + 'pageUnderTest.html';

        var reporter = signOffReporter.SignOffReporter([{
            pageUrl: pageUrl,
            fingerprint: "fIngRPrinT"
        }]);

        reporter.reportComparison({
            status: "referenceMissing",
            testCase: {
                url: pageUrl
            },
            pageImage: htmlImage,
            resizePageImage: function () {},
            acceptPage: acceptPageSpy
        });

        expect(acceptPageSpy).toHaveBeenCalled();

        expect(loadFullDocumentSpy).toHaveBeenCalledWith(pageUrl, jasmine.any(Function));
        expect(calculateFingerprintSpy).toHaveBeenCalledWith("some content");
    });

    it("should take fingerprints from a file", function () {
        var fixtureUrl = csscriticTestPath + "fixtures/",
            pageUrl = fixtureUrl + 'pageUnderTest.html';

        var reporter = signOffReporter.SignOffReporter('fingerprints.json');

        spyOn(signOffReporterUtil, 'loadFingerprintJson').and.callFake(function (url, callback) {
            callback([{
                pageUrl: pageUrl,
                fingerprint: "fIngRPrinT"
            }]);
        });

        reporter.reportComparison({
            status: "failed",
            testCase: {
                url: pageUrl
            },
            pageImage: htmlImage,
            resizePageImage: function () {},
            acceptPage: acceptPageSpy,
            referenceImage: referenceImage
        });

        expect(acceptPageSpy).toHaveBeenCalled();
    });
});
