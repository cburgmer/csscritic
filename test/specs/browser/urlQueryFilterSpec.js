describe("Url Query Filter", function () {
    "use strict";

    var urlQueryFilter;

    var windowLocation;

    var setFilter = function (filter) {
        windowLocation.search = '?filter=' + filter;
    };

    var aComparison = function (url) {
        return {
            testCase: {
                url: url
            }
        };
    };

    beforeEach(function () {
        windowLocation = {
            search: ''
        };

        urlQueryFilter = csscriticLib.urlQueryFilter(windowLocation);
    });

    it("should change the browser's location to include the selection", function () {
        urlQueryFilter.setSelection("the targeted test");

        expect(windowLocation.search).toEqual('?filter=the%20targeted%20test');
    });

    it("should find a comparison by url", function () {
        var comparison = aComparison('aTest');
        setFilter('aTest');

        expect(urlQueryFilter.filterComparisons([comparison])).toEqual([comparison]);
    });

    it("should filter out a comparison if url does not match", function () {
        var comparison = aComparison('aTest');
        setFilter('someOtherTest');

        expect(urlQueryFilter.filterComparisons([comparison])).toEqual([]);
    });

    it("should filter with multiple items", function () {
        var matchingComparison = aComparison('the matching comparison');
        setFilter('the matching comparison');

        expect(urlQueryFilter.filterComparisons([aComparison('nonMatching'),
                                                 matchingComparison,
                                                 aComparison('anotherNonMatching')]))
            .toEqual([matchingComparison]);
    });

    it("should not filter if no query given", function () {
        var firstComparison = aComparison('firstComparison'),
            secondComparison = aComparison('secondComparison');

        expect(urlQueryFilter.filterComparisons([firstComparison, secondComparison]))
            .toEqual([firstComparison, secondComparison]);
    });

    it("should not filter if an empty filter is given", function () {
        var firstComparison = aComparison('firstComparison'),
            secondComparison = aComparison('secondComparison');
        setFilter('');

        expect(urlQueryFilter.filterComparisons([firstComparison, secondComparison]))
            .toEqual([firstComparison, secondComparison]);
    });
});
