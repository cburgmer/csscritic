CSS Critic
==========

A lightweight framework for regression testing of Cascading Style Sheets.

[Project page](http://cburgmer.github.com/csscritic)

[Watch the screencast](http://youtu.be/AqQ2bNPtF60) to get an idea what this is about. Also check out [CSS Critic Examples](https://github.com/cburgmer/csscritic-examples) which collects example applications with a UI test suite built on top of CSS Critic.

[![Build Status](https://secure.travis-ci.org/cburgmer/csscritic.png?branch=master)](http://travis-ci.org/cburgmer/csscritic)

Install
-------

    $ bower install csscritic

See `bower_components/csscritic/example/RegressionRunner.html` for an example.

How it works
------------

CSS Critic checks your current layout constantly against a reference image you have provided in the past. If your layout breaks (or simply changes - CSS Critic can't tell) your tests fail.

*Get started:*

1. Create a `RegressionRunner.html` similar to the one under [`example/`](example/) and put it with your code that is to be tested.

2. Register your page under test via:

        csscritic.add(PUT_THE_PAGE_URL_HERE);
        csscritic.execute();

3. Open the RegressionRunner.html in Firefox for the first time and save the resulting image as future reference.

4. Re-run the RegressionRunner.html and see your test passing. Congratulations.

*What do I do if my test fails?*

1. Have a look at the diff image and visually check what has changed.

2. If the change is an unwanted one fix your CSS,

3. If deliberate generate a new reference image.

Running from the command line
-----------------------------

Currently in the making is a command-line runner using [PhantomJS](http://phantomjs.org/). While still not fit for a
shared build-pipeline (e.g. no easy way to "fix" builds) the first shot is up and running:

    $ phantomjs dist/csscritic-phantom.js -f example/signedOff.json example/pageUnderTest.html

If the fingerprint of the page under test matches the one given in the `signedOff.json` file then the CLI will generate a reference image. In the future we want to combine both a signing-off process with the image diff approach to share accepted renderings inside a development team.

Developing CSS Critic
---------------------
For linting, tests and minification install Node.js and run

    $ ./go

Limitations
-----------

- Works in Firefox only (see above for the experimental PhantomJS runner)
- [Same-origin restrictions](https://developer.mozilla.org/en-US/docs/Same_origin_policy_for_JavaScript) apply when sourcing files. All files referenced need to be inside the same directory as the `RegressionRunner.html` or in ones below.
- Because of the way the HTML is rendered to the canvas inside the browser certain more esoteric pages might fail to render correctly. Here the CLI runner can be of some help as it uses the native interface to render pages.

Licensed under MIT. Maintained by [@cburgmer](https://twitter.com/cburgmer). Copyright (c) 2012, 2013 ThoughtWorks, Inc.
