describe("Fallback Filter", function () {
    "use strict";

    var fallbackFilter, backingFilter, windowLocation;

    var setWindowLocation = function (href) {
        windowLocation.href = href;
    };

    beforeEach(function () {
        backingFilter = jasmine.createSpyObj('backingFilter', [
            'isComparisonSelected',
            'filterUrlFor',
            'clearFilterUrl'
        ]);

        windowLocation = {
            href: ''
        };

        fallbackFilter = csscriticLib.fallbackFilter(backingFilter, windowLocation);
    });

    describe('HTTP URLs', function () {
        beforeEach(function () {
            setWindowLocation('http://something/something');
        });

        it("should route through to backing filter for a positive selection query", function () {
            var theComparison = 'the_comparison';
            backingFilter.isComparisonSelected.and.returnValue(true);

            var ret = fallbackFilter.isComparisonSelected(theComparison);

            expect(backingFilter.isComparisonSelected).toHaveBeenCalledWith(theComparison);
            expect(ret).toBe(true);
        });


        it("should route through to backing filter for a negative selection query", function () {
            var theComparison = 'the_comparison';
            backingFilter.isComparisonSelected.and.returnValue(false);

            var ret = fallbackFilter.isComparisonSelected(theComparison);

            expect(ret).toBe(false);
        });

        it("should route through to backing filter for filter URL", function () {
            var theSelection = "the_selection";
            backingFilter.filterUrlFor.and.returnValue('the_url');

            var ret = fallbackFilter.filterUrlFor(theSelection);

            expect(backingFilter.filterUrlFor).toHaveBeenCalledWith(theSelection);
            expect(ret).toBe('the_url');
        });

        it("should route through to backing filter for clear URL", function () {
            var theSelection = "the_selection";
            backingFilter.clearFilterUrl.and.returnValue('the_url');

            var ret = fallbackFilter.clearFilterUrl(theSelection);

            expect(backingFilter.clearFilterUrl).toHaveBeenCalledWith(theSelection);
            expect(ret).toBe('the_url');
        });
    });
});
