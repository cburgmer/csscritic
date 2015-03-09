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

    it("should store the selection in the sessionStorage", function () {
        fallbackFilter.filterFor({url: 'the_selection'});

        expect(sessionStorage.getItem('csscriticFallbackFilter')).toEqual('the_selection');
    });

    it("should reload the runner on filter", function () {
        fallbackFilter.filterFor({url: 'the_selection'});

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
