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

    var reporterContainer = function () {
        return $('#csscritic_nicereporter');
    };
    
    beforeEach(function () {
        reporter = csscriticLib.niceReporter(util).NiceReporter();
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
});
