describe("Job Queue", function () {
    var subject;

    beforeEach(function () {
        subject = csscritic.jobQueue();
    });

    it("should execute a single job", function () {
        var defer = ayepromise.defer(),
            job = jasmine.createSpy("job").and.returnValue(defer.promise);
        subject.execute(job);

        expect(job).toHaveBeenCalled();
    });

    it("should execute two jobs sequencially", function (done) {
        var defer1 = ayepromise.defer(),
            job1 = jasmine.createSpy("job1").and.returnValue(defer1.promise),
            defer2 = ayepromise.defer(),
            job2 = jasmine.createSpy("job2").and.returnValue(defer2.promise);

        subject.execute(job1);
        subject.execute(job2);

        expect(job1).toHaveBeenCalled();
        expect(job2).not.toHaveBeenCalled();

        defer1.resolve();

        defer1.promise.then(function () {
            expect(job2).toHaveBeenCalled();

            done();
        });
    });

    it("should execute following job even if it fails", function (done) {
        var defer1 = ayepromise.defer(),
            job1 = jasmine.createSpy("job1").and.returnValue(defer1.promise),
            defer2 = ayepromise.defer(),
            job2 = jasmine.createSpy("job2").and.returnValue(defer2.promise);

        subject.execute(job1);
        subject.execute(job2);

        expect(job1).toHaveBeenCalled();
        expect(job2).not.toHaveBeenCalled();

        defer1.reject();

        defer1.promise.then(null, function () {
            expect(job2).toHaveBeenCalled();

            done();
        });
    });
});
