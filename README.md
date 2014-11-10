CSS Critic
==========

A lightweight framework for regression testing of Cascading Style Sheets.

What?
-----
One picture says more than 1000 words:

<img src="http://cburgmer.github.io/csscritic-examples/testsuite_in_action.png" alt="CSS Critic testing the TodoMVC app">

Need more than 1000 words? [Watch the screencast](http://youtu.be/AqQ2bNPtF60) or checkout [CSS Critic Examples](https://github.com/cburgmer/csscritic-examples) for a hands-on experience with example applications that have their UI tested. Fast forward to [see it in action testing the TodoMVC application](http://cburgmer.github.io/csscritic-examples/angularjs/).

Why?
----
Your web stack should be fully testable - even your UI including CSS. CSS Critic can shine here. For example, let it supervise changes to your project's styleguide so you know things are looking good. CSS Critic should be a tool that's simple enough for a designer on a single project to use out-of-the-box.

Install
-------

    $ npm install csscritic

See `node_modules/csscritic/example/RegressionRunner.html` for an example on how to take it from there.

How it works
------------

CSS Critic checks your current layout constantly against a reference image you have provided in the past. If your layout breaks (or simply changes - CSS Critic can't tell) your tests fail.

*Get started:*

1. Create a `RegressionRunner.html` similar to the one under [`example/`](example/) and put it with your code that is to be tested.

2. Register your page under test via:

    ```js
    csscritic.add({
        url: 'SOME_URL',     // link to the test case HTML document
        // Optionally:
        hover: 'A.SELECTOR', // element receiving an :hover effect
        active: 'A.SELECTOR' // element receiving an :active effect
    });
    csscritic.execute();
    ```

3. Open the RegressionRunner.html in Firefox for the first time and save the resulting image as future reference.

4. Re-run the RegressionRunner.html and see your test passing. Congratulations.

*What do I do if my test fails?*

1. Have a look at the diff image and visually check what has changed.

2. If the change is an unwanted one fix your CSS,

3. If deliberate generate a new reference image.

Developing CSS Critic
---------------------
For linting, tests and minification install Node.js and run

    $ ./go

[![Build Status](https://travis-ci.org/cburgmer/csscritic.svg?branch=master)](https://travis-ci.org/cburgmer/csscritic)

Limitations
-----------

- Works in Firefox only (alternatively see the [experimental CLI runner](https://github.com/cburgmer/csscritic/wiki/CLI-runner))
- [Same-origin restrictions](https://developer.mozilla.org/en-US/docs/Same_origin_policy_for_JavaScript) apply when sourcing files. All files referenced need to be inside the same directory as the `RegressionRunner.html` or in ones below.
- Because of the way the HTML is rendered to the canvas inside the browser form inputs and certain more esoteric pages might fail to render correctly. Here the CLI runner can be of some help as it uses the native interface to render pages.

For more information see the [FAQ](https://github.com/cburgmer/csscritic/wiki/FAQ) and [API](https://github.com/cburgmer/csscritic/wiki/API).

Licensed under MIT. Maintained by [@cburgmer](https://twitter.com/cburgmer). Copyright (c) 2012, 2013 ThoughtWorks, Inc.
