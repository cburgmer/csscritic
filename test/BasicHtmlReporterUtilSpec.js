describe("BasicHTMLReporter utilities", function () {
    describe("getDifferenceCanvas", function () {
        var diffReferenceUrl = "data:image/png;base64," +
            "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAD/0lEQVR4nO3bTYhNYRzH8T+DmZCRTEjyEiWZlJKwMJqSzSy8JQs1WbCg" +
            "5GXDgt1IQiwGpWahpiipWYgFilhZDOUtJSODQqa8z4ufxXmmee7tee6cc89znd+Z+Xf6LmbmTs99/p+ae+85ZwQQaDxJ1k9AUxDqFIQs" +
            "BSFLQchSELIUhCwFIUtByAoO0g3BRQh+EmwujwUHOQCBGJSsN5fHgoJ8h2CqAVkCwV+CDeatoCAXDMbgcYtgg3krKMjSIpANBBvMW8FA" +
            "7hZhCARjIHhGsMk8FQxkkwNEINhNsMk8FQSkC4IqD8hECL4QbDQvBQE57MEYPFoINpqXUoP8gmC6GXwTBLUOkNkQ9BJsNg+lBmmzBn8P" +
            "gn0OEIGgnWCzeSg1yHIz8Hrz9UtE766KjxUEm81DqUAeWgM/b31/vQNEIHhAsGH2UoFsN4OeAsE36/sdHpAtBBtmr2yQ9xCMN4PeU/Sz" +
            "AQjmOUCqIHhDsGnmygY5Zg36qePnJxwgAsFBgk0zVxZILwQzzYAbPI/5DEGNA6QWhX/etAAg7daAr5Z4XLMDRCA4R7Bx1soCWWUGOwul" +
            "P/A98oAsRPQ6k/XmGUsMYg/5aIzHr/SgdBBsnrHEIIN/hsZB8C7G4y97QNYRbJ6xRCCfIKg2A90c83d+Q1DnQekkGABbiUBarGHeTvB7" +
            "RzwgzQQDYCs2SD8Ec8wgFydc5C3c10uqIfhIMASmYoNcswZ5toyFNjpABNEHzKyHwFRskAZriMchaE3YTg/IDESvM1kPgqVYIE88wwx1" +
            "tBEMgqVYILsqDLKMYBAsDQvyFdGNCgJBI6JP5uX2uATKHYJhMDQsyClraFcCLNjoAWkiGAZDJUEGIJhvBlYHwZ8AC/ouXo2F4BXBQLKu" +
            "JMh1a2ChrmMMQLDAg7KXYCBZVxJkrTWs5wEXPeMBmQxBD8FQKEHss7prAi/aY4bvOk4SDIUSZKs1pEsVWHiHB2QuBH0Eg6ECeYHoRVYQ" +
            "3WNViXtzb3hABKP7g6ITZJs1nKQnEuPWC8EED8giRCczsx4OBch9FN55WMkLSfUeEMHo/R/FApBODJ1it9/5fKjAwn3wX7gSCCbBfXvR" +
            "SE/6EV1sOoShUySuF9rTiG6m7k6x2GtEp0haUfiW2nfUQLAfgpsQ/CAY1n8B6YoxGPtYnWKxaQnXso9StxuNpCTrJ6ApCHUKQpaCkKUg" +
            "ZCkIWQpCloKQpSBkKQhZCkKWgpClIGQpCFkKQpaCkKUgZCkIWQpCloKQpSBkKQhZCkKWgpClIGQpCFkKQpaCkKUgZCkIWQpCloKQpSBk" +
            "KQhZCkKWgpClIGQpCFkKQpaCkKUgZCkIWQpCloKQpSBkKQhZCkKWgpClIGT9Ax6gM07b4lNXAAAAAElFTkSuQmCC";

        beforeEach(function () {
            this.addMatchers(imagediff.jasmine);
        });

        it("should return the canvas with the correct filling", function () {
            var imageA = null,
                imageB = null,
                resultingCanvas = null,
                referenceImage = null;

            csscriticTestHelper.loadImageFromUrl(csscriticTestPath + "fixtures/green.png", function (image) {
                imageA = image;
            });
            csscriticTestHelper.loadImageFromUrl(csscriticTestPath + "fixtures/redWithLetter.png", function (image) {
                imageB = image;
            });
            csscriticTestHelper.loadImageFromUrl(diffReferenceUrl, function (image) {
                referenceImage = image;
            });

            waitsFor(function () {
                return imageA !== null && imageB !== null && referenceImage !== null;
            });

            runs(function () {
                resultingCanvas = csscritic.basicHTMLReporterUtil.getDifferenceCanvas(imageA, imageB);
            });

            waitsFor(function () {
                return resultingCanvas !== null;
            });

            runs(function () {
                expect(resultingCanvas).toImageDiffEqual(referenceImage);
            });
        });
    });

});