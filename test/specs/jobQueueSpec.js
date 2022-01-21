describe("Job Queue", function () {
    "use strict";

    var subject;

    beforeEach(function () {
        subject = csscriticLib.jobQueue();
    });

    it("should execute a single job", function () {
        var job = jasmine
            .createSpy("job")
            .and.returnValue(new Promise(function () {}));
        subject.execute(job);

        expect(job).toHaveBeenCalled();
    });

    it("should execute two jobs sequencially", function (done) {
        var job1Fulfill,
            job1Promise = new Promise(function (fulfill) {
                job1Fulfill = fulfill;
            }),
            job1 = jasmine.createSpy("job1").and.returnValue(job1Promise),
            job2 = jasmine
                .createSpy("job2")
                .and.returnValue(new Promise(function () {}));

        subject.execute(job1);
        subject.execute(job2);

        expect(job1).toHaveBeenCalled();
        expect(job2).not.toHaveBeenCalled();

        job1Fulfill();

        job1Promise.then(function () {
            expect(job2).toHaveBeenCalled();

            done();
        });
    });

    it("should execute following job even if it fails", function (done) {
        var job1Reject,
            job1Promise = new Promise(function (_, reject) {
                job1Reject = reject;
            }),
            job1 = jasmine.createSpy("job1").and.returnValue(job1Promise),
            job2 = jasmine
                .createSpy("job2")
                .and.returnValue(new Promise(function () {}));

        subject.execute(job1);
        subject.execute(job2);

        expect(job1).toHaveBeenCalled();
        expect(job2).not.toHaveBeenCalled();

        job1Reject();

        job1Promise.then(null, function () {
            expect(job2).toHaveBeenCalled();

            done();
        });
    });

    it("should return a promise for the job to be executed", function (done) {
        var jobFulfill,
            jobPromise = new Promise(function (fulfill) {
                jobFulfill = fulfill;
            }),
            job = jasmine.createSpy("job").and.returnValue(jobPromise),
            jobExecutionSpy = jasmine.createSpy("jobExecution");

        var executionPromise = subject.execute(job);
        executionPromise.then(jobExecutionSpy);

        jobFulfill("the_result");

        jobPromise.then(function () {
            setTimeout(function () {
                expect(jobExecutionSpy).toHaveBeenCalledWith("the_result");

                done();
            }, 10);
        });
    });

    it("should handle rejection for the returned promise of the executed job", function (done) {
        var jobReject,
            jobPromise = new Promise(function (_, reject) {
                jobReject = reject;
            }),
            job = jasmine.createSpy("job").and.returnValue(jobPromise),
            jobExecutionSpy = jasmine.createSpy("jobExecution"),
            e = new Error();

        var executionPromise = subject.execute(job);
        executionPromise.then(null, jobExecutionSpy);

        jobReject(e);

        jobPromise.then(null, function () {
            setTimeout(function () {
                expect(jobExecutionSpy).toHaveBeenCalledWith(e);

                done();
            }, 10);
        });
    });
});
