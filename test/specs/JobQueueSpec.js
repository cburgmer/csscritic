describe("Job Queue", function () {
    var subject;

    beforeEach(function () {
        subject = csscritic.jobQueue();
    });

    it("should execute a single job", function () {
        var job = jasmine.createSpy("job");
        subject.execute(job);

        expect(job).toHaveBeenCalled();
    });

    it("should execute two jobs sequencially", function () {
        var job1 = jasmine.createSpy("job1"),
            job2 = jasmine.createSpy("job2");
        subject.execute(job1);
        subject.execute(job2);

        expect(job1).toHaveBeenCalled();
        expect(job2).not.toHaveBeenCalled();

        job1.calls.mostRecent().args[0]();
        expect(job2).toHaveBeenCalled();
    });
});
