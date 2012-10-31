CSS critic
==========

A lightweight framework for regression testing of Cascading Style Sheets.

See `example/RegressionRunner.html` for an example. Also [watch the screencast here](http://youtu.be/AqQ2bNPtF60).

[![Build Status](https://secure.travis-ci.org/cburgmer/csscritic.png?branch=master)](http://travis-ci.org/cburgmer/csscritic)

How it works
------------

CSS critic checks your current layout constantly against a reference image you have provided in the past. If your layout breaks (or simply changes - CSS critic can't tell) your tests fail.

*Get started:*

1. Create a `RegressionRunner.html` similar to the one under `example/` and put it with your code that is to be tested.

2. Register your page under test via:

        csscritic.compare(PUT_THE_PAGE_URL_HERE);

3. Open the RegressionRunner.html in Firefox for the first time.

4. Follow the hint and save the resulting image as future reference.

5. Re-run the RegressionRunner.html and see your test passing. Congratulations.

*What do I do if my test fails?*

1. Have a look at the diff image and visually check what has changed.

2. If the change is an unwanted one fix your CSS,

3. If deliberate generate a new reference image.

Testing
-------
Run

    $ npm install
    $ ./node_modules/.bin/bower install
    $ ./go

for linting, jasmine tests and minification.

Limitations
-----------

- Currently works in Firefox only.
- [Same-origin restrictions](https://developer.mozilla.org/en-US/docs/Same_origin_policy_for_JavaScript) apply when sourcing files.
- Because of the way the HTML is rendered to the canvas, all external resources need to be inlined. This part is still in active development (e.g. @Import and non-woff webfonts are missing).

Licensed under MIT. Reach out [on Twitter](https://twitter.com/cburgmer)