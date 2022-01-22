csscriticLib.jobQueue = function () {
    "use strict";

    var module = {};

    var jobQueue = [],
        busy = false;

    var runJob = function (job) {
        var result = job.func();

        job.fulfill(result);
        return result;
    };

    var nextInQueue = function () {
        var job;
        if (jobQueue.length > 0) {
            busy = true;

            job = jobQueue.shift();

            runJob(job).then(nextInQueue, nextInQueue);
        } else {
            busy = false;
        }
    };

    module.execute = function (func) {
        return new Promise(function (fulfill) {
            var job = {
                func: func,
                fulfill: fulfill,
            };

            jobQueue.push(job);
            if (!busy) {
                nextInQueue();
            }
        });
    };

    return module;
};
