/* Work around https://bugzilla.mozilla.org/show_bug.cgi?id=1005634
 * Replaces anchors with inner page targets with a JavaScript navigation handling implementation.
 */
csscriticLib.pageNavigationHandlingFallback = function (windowLocation) {
    "use strict";

    var module = {};

    var fakeTargetClassName = 'fakeTarget';

    var clearFakeActiveClass = function () {
        var previousTargets = Array.prototype.slice.call(document.querySelectorAll('.' + fakeTargetClassName));
        previousTargets.forEach(function (elem) {
            elem.classList.remove(fakeTargetClassName);
        });
    };

    var triggerFakeActiveClass = function (targetElement) {
        targetElement.classList.add(fakeTargetClassName);
    };

    var scrollTo = function (id) {
        var targetElement;

        clearFakeActiveClass();
        if (id) {
            targetElement = document.getElementById(id);
            targetElement.scrollIntoView();
            triggerFakeActiveClass(targetElement);
        } else {
            window.scrollTo(0, 0);
        }
    };

    var globalNavigationHandlingInstalled = false;

    var installGlobalNavigationHandling = function () {
        if (!globalNavigationHandlingInstalled) {
            globalNavigationHandlingInstalled = true;

            window.onpopstate = function (e) {
                scrollTo(e.state);
            };
        }
    };

    var startsWith = function (str, prefix) {
        return str.substr(0, prefix.length) === prefix;
    };

    var needsFallback = function () {
        return startsWith(windowLocation.href, 'file://');
    };

    module.install = function (element) {
        if (!needsFallback()) {
            return;
        }
        installGlobalNavigationHandling();

        element.onclick = function (e) {
            var targetLink = e.target.href,
                targetId = targetLink.substr(targetLink.indexOf('#')+1);

            scrollTo(targetId);
            history.pushState(targetId, targetId);
            e.preventDefault();
        };
    };

    return module;
};
