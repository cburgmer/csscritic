describe("Main", function () {
    "use strict";

    var csscritic, regression, reporting, storage;

    var util = csscriticLib.util();

    var reporter;

    var setUpComparison = function (comparison) {
        regression.compare.and.returnValue(testHelper.successfulPromise(comparison));
    };

    var setUpReferenceImage = function (image, viewport) {
        storage.readReferenceImage.and.returnValue(testHelper.successfulPromise({
            image: image,
            viewport: viewport
        }));
    };

    var setUpReferenceImageMissing = function () {
        storage.readReferenceImage.and.returnValue(testHelper.failedPromise());
    };

    beforeEach(function () {
        reporting = jasmine.createSpyObj('reporting', ['doReportComparisonStarting', 'doReportComparison', 'doReportTestSuite']);
        reporting.doReportComparisonStarting.and.returnValue(testHelper.successfulPromise());
        reporting.doReportComparison.and.returnValue(testHelper.successfulPromise());
        reporting.doReportTestSuite.and.returnValue(testHelper.successfulPromise());

        regression = jasmine.createSpyObj('regression', ['compare']);
        storage = jasmine.createSpyObj('storage', ['readReferenceImage']);

        csscritic = csscriticLib.main(
            regression,
            reporting,
            util,
            storage);

        reporter = {};
    });

    describe("adding & executing", function () {
        var comparison;

        beforeEach(function () {
            comparison = "the_comparison";
            setUpComparison(comparison);
            setUpReferenceImage('the image', 'the viewport');
        });

        it("should execute regression test", function (done) {
            setUpComparison("the_comparison");

            csscritic.add("test_case");
            csscritic.execute().then(function () {
                expect(regression.compare).toHaveBeenCalledWith({
                    url: "test_case"
                });

                done();
            });
        });

        it("should result in success", function (done) {
            spyOn(util, 'hasTestSuitePassed').and.returnValue(true);
            csscritic.add("samplepage.html");

            csscritic.execute().then(function (success) {
                expect(success).toBeTruthy();
                expect(util.hasTestSuitePassed).toHaveBeenCalledWith([comparison]);

                done();
            });
        });

        it("should report overall success in the test suite", function (done) {
            spyOn(util, 'hasTestSuitePassed').and.returnValue(true);
            csscritic.addReporter(reporter);
            csscritic.add("samplepage.html");
            csscritic.execute().then(function () {
                expect(reporting.doReportTestSuite).toHaveBeenCalledWith([reporter], true);

                done();
            });
        });

        it("should result in failure", function (done) {
            spyOn(util, 'hasTestSuitePassed').and.returnValue(false);
            csscritic.add("samplepage.html");

            csscritic.execute().then(function (success) {
                expect(success).toBeFalsy();
                expect(util.hasTestSuitePassed).toHaveBeenCalledWith([comparison]);

                done();
            });
        });

        it("should report a failure in the test suite", function (done) {
            spyOn(util, 'hasTestSuitePassed').and.returnValue(false);
            csscritic.addReporter(reporter);
            csscritic.add("samplepage.html");
            csscritic.execute().then(function () {
                expect(reporting.doReportTestSuite).toHaveBeenCalledWith([reporter], false);

                done();
            });
        });
    });

    describe("Reporting", function () {
        var triggerDelayedPromise = function () {
            jasmine.clock().tick(100);
        };

        beforeEach(function () {
            jasmine.clock().install();
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        beforeEach(function () {
            csscritic.addReporter(reporter);
        });

        it("should report a starting comparison with reference image", function () {
            setUpReferenceImage('the image', 'the viewport');

            csscritic.add("samplepage.html");
            csscritic.execute();

            triggerDelayedPromise();
            expect(reporting.doReportComparisonStarting).toHaveBeenCalledWith([reporter], [{
                testCase: {
                    url: "samplepage.html"
                },
                referenceImage: 'the image',
                viewport: 'the viewport'
            }]);
        });

        it("should report a starting comparison without reference image", function () {
            setUpReferenceImageMissing();

            csscritic.add("samplepage.html");
            csscritic.execute();

            triggerDelayedPromise();
            expect(reporting.doReportComparisonStarting).toHaveBeenCalledWith([reporter], [{
                testCase: {
                    url: "samplepage.html"
                }
            }]);
        });

        it("should wait for reporting on starting comparison to finish", function () {
            var defer = ayepromise.defer(),
                callback = jasmine.createSpy('callback');

            reporting.doReportComparisonStarting.and.returnValue(defer.promise);
            csscritic.execute().then(callback);

            triggerDelayedPromise();
            expect(callback).not.toHaveBeenCalled();

            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

        it("should call final report on empty test case list and report as successful", function (done) {
            csscritic.execute().then(function () {
                expect(reporting.doReportTestSuite).toHaveBeenCalledWith([reporter], true);

                done();
            });

            triggerDelayedPromise();
        });

        it("should wait for reporting on comparison to finish", function () {
            var defer = ayepromise.defer(),
                callback = jasmine.createSpy('callback');

            setUpReferenceImage('the image', 'the viewport');
            setUpComparison({
                status: "success"
            });

            reporting.doReportComparison.and.returnValue(defer.promise);
            csscritic.add('a_test');
            csscritic.execute().then(callback);

            triggerDelayedPromise();
            expect(callback).not.toHaveBeenCalled();

            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

        it("should wait for reporting on final report to finish", function () {
            var defer = ayepromise.defer(),
                callback = jasmine.createSpy('callback');

            reporting.doReportTestSuite.and.returnValue(defer.promise);
            csscritic.execute().then(callback);

            triggerDelayedPromise();
            expect(callback).not.toHaveBeenCalled();

            defer.resolve();

            triggerDelayedPromise();
            expect(callback).toHaveBeenCalled();
        });

    });
});
