describe("Queue", function () {
    afterEach(function () {
        csscritic.queue.clear();
    });

    it("should execute a single job", function () {
        var job = jasmine.createSpy("job");
        csscritic.queue.execute(job);

        expect(job).toHaveBeenCalled();
    });

    it("should execute two jobs sequencially", function () {
        var job1 = jasmine.createSpy("job1"),
            job2 = jasmine.createSpy("job2");
        csscritic.queue.execute(job1);
        csscritic.queue.execute(job2);

        expect(job1).toHaveBeenCalled();
        expect(job2).not.toHaveBeenCalled();

        job1.calls.mostRecent().args[0]();
        expect(job2).toHaveBeenCalled();
    });
});

