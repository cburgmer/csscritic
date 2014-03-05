describe("BasicHTMLReporter utilities", function () {

    describe("supportsReadingHtmlFromCanvas", function () {
        var canvas, context;
        beforeEach(function () {
            canvas = jasmine.createSpyObj('canvas', ['getContext']);
            context = jasmine.createSpyObj('context', ['drawImage', 'getImageData']);
            canvas.getContext.and.returnValue(context);

            spyOn(document, 'createElement').and.callFake(function (tagName) {
                if (tagName === 'canvas') {
                    return canvas;
                }
            });
        });

        it("should return false when reading HTML from a canvas is not supported", function (done) {
            context.getImageData.and.throwError(new Error());

            csscritic.basicHTMLReporterUtil.supportsReadingHtmlFromCanvas(function (supported) {
                expect(supported).toBe(false);

                done();
            });
        });

        it("should return true when reading HTML from a canvas is supported", function (done) {
            csscritic.basicHTMLReporterUtil.supportsReadingHtmlFromCanvas(function (supported) {
                expect(supported).toBe(true);

                done();
            });
        });
    });

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
            jasmine.addMatchers(imagediffForJasmine2);
        });

        it("should return the canvas with the correct filling", function (done) {
            csscriticTestHelper.loadImageFromUrl(csscriticTestPath + "fixtures/green.png", function (imageA) {
                csscriticTestHelper.loadImageFromUrl(csscriticTestPath + "fixtures/redWithLetter.png", function (imageB) {
                    csscriticTestHelper.loadImageFromUrl(diffReferenceUrl, function (referenceImage) {
                        var resultingCanvas = csscritic.basicHTMLReporterUtil.getDifferenceCanvas(imageA, imageB);

                        expect(resultingCanvas).toImageDiffEqual(referenceImage);

                        done();
                    });
                });
            });
        });
    });

});
