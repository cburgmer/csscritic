describe("Fallback Filter", function () {
    "use strict";

    var fallbackFilter, windowLocation;

    var aComparison = function (url) {
        return {
            testCase: {
                url: url
            }
        };
    };

    beforeEach(function () {
        windowLocation = jasmine.createSpyObj('window.location', ['reload']);

        fallbackFilter = csscriticLib.fallbackFilter(windowLocation);
    });

    afterEach(function () {
        sessionStorage.clear();
    });

    it("should return a dead URL for the filter URL", function () {
        var theSelection = "the_selection";

        expect(fallbackFilter.filterUrlFor(theSelection)).toEqual('#');
    });

    it("should return a dead URL for the clear URL", function () {
        expect(fallbackFilter.clearFilterUrl()).toEqual('#');
    });

    it("should store the selection in the sessionStorage", function () {
        var theSelection = 'the_selection';

        fallbackFilter.filterFor(theSelection);

        expect(sessionStorage.getItem('csscriticFallbackFilter')).toEqual(theSelection);
    });

    it("should reload the runner on filter", function () {
        var theSelection = 'the_selection';

        fallbackFilter.filterFor(theSelection);

        expect(windowLocation.reload).toHaveBeenCalled();
    });

    it("should clear the stored selection", function () {
        sessionStorage.setItem('csscriticFallbackFilter', 'some_selection');

        fallbackFilter.clearFilter();

        expect(sessionStorage.getItem('csscriticFallbackFilter')).toBe(null);
    });

    it("should reload the runner on clear", function () {
        fallbackFilter.clearFilter();

        expect(windowLocation.reload).toHaveBeenCalled();
    });

    it("should filter matching selection", function () {
        sessionStorage.setItem('csscriticFallbackFilter', 'someUrl');

        expect(fallbackFilter.isComparisonSelected(aComparison('someUrl'))).toBe(true);
    });

    it("should filter out a comparison if URL does not match", function () {
        sessionStorage.setItem('csscriticFallbackFilter', 'someUrl');

        expect(fallbackFilter.isComparisonSelected(aComparison('someNotMatchingUrl'))).toBe(false);
    });

    it("should not filter if no selection stored", function () {
        expect(fallbackFilter.isComparisonSelected(aComparison('someUrl'))).toBe(true);
    });
});
