describe("Nice reporter", function () {
    "use strict";

    var reporter;

    var util = csscriticLib.util();

    var aPassedTest = function (testCase) {
        testCase = testCase || {
            url: "aPage.html"
        }; 
        return {
            status: "passed",
            testCase: testCase
        };
    };

    var aFailedTest = function (pageImage, referenceImage) {
        return {
            status: 'failed',
            testCase: {
                url: 'aPage.html'
            },
            pageImage: pageImage,
            referenceImage: referenceImage
        };
    };

    var reporterContainer = function () {
        return $('#csscritic_nicereporter');
    };
    
    beforeEach(function () {
        reporter = csscriticLib.niceReporter(util).NiceReporter();
        jasmine.addMatchers(imagediffForJasmine2);
    });

    afterEach(function () {
        reporterContainer().remove();
    });

    it("should link to comparison in progress bar", function () {
        var test = aPassedTest();
        reporter.reportComparisonStarting(test);
        reporter.reportComparison(test);

        expect(reporterContainer().find('#progressBar a').attr('href')).toEqual('#aPage.html');
        expect(reporterContainer().find('section').attr('id')).toEqual('aPage.html');
    });

    it("should link to comparison in progress bar with extended test case", function () {
        var test = aPassedTest({url: 'aTest.html', width: 42});
        reporter.reportComparisonStarting(test);
        reporter.reportComparison(test);

        expect(reporterContainer().find('#progressBar a').attr('href')).toEqual('#aTest.html,width=42');
        expect(reporterContainer().find('section').attr('id')).toEqual('aTest.html,width=42');
    });

    it("should link to the test case's href", function () {
        var test = aPassedTest();
        reporter.reportComparisonStarting(test);
        reporter.reportComparison(test);

        expect(reporterContainer().find('.comparison .title a').attr('href')).toEqual('aPage.html');
    });

    it("should show a difference canvas on a failed comparison", function (done) {
        testHelper.loadImageFromUrl(testHelper.fixture("blue.png"), function (expectedDiffImage) {
            testHelper.loadImageFromUrl(testHelper.fixture("green.png"), function (pageImage) {
                testHelper.loadImageFromUrl(testHelper.fixture("redWithLetter.png"), function (referenceImage) {
                    var test = aFailedTest(pageImage, referenceImage);
                    reporter.reportComparisonStarting(test);
                    reporter.reportComparison(test);

                    expect(reporterContainer().find('canvas').get(0)).toImageDiffEqual(expectedDiffImage);
                    done();
                });
            });
        });
    });
});
