# CSS Critic

<a href="https://www.npmjs.org/package/csscritic">
    <img src="https://badge.fury.io/js/csscritic.svg"
        align="right" alt="NPM version" height="18">
</a>
A lightweight tool for regression testing of Cascading Style Sheets.

## What?

One picture might say more than 1000 words:

<img src="http://cburgmer.github.io/csscritic-examples/nicereporter_in_action.png" alt="CSS Critic testing the TodoMVC app">

For background information [watch the screencast](http://youtu.be/AqQ2bNPtF60) or if you feel like playing around have a look at the [runnable instance](http://runnable.com/VXJo7YUrGNMz4gnD/csscritic-1-2-0-in-action). This [example project](https://github.com/cburgmer/csscritic-examples) helps you get started with your own setup.

## Why?

Your web stack should be fully testable. CSS Critic closes the gap in front end testing and makes HTML & CSS testable - no more broken UI. For example, make it supervise changes to your project's responsive styleguide so you know things are looking good.

## How is it different to the other tools out there?

We believe that your UI will change often enough that a lightweight process on managing changes (near instant feedback, anyone?) is more important than a heavy-weight one which could offer tighter control. Also CSS Critic aims at bridging the gap between user experience (UX) people and (UI) developers. You probably won't find any easier way of sharing your UI tests than as the simple web page that CSS Critic basically is. And don't feel put down by the "CSS" bit, you may throw anything at it that can be converted into a simple image.

## How to install?

    $ npm install csscritic

See `node_modules/csscritic/example/RegressionRunner.html` for an example on how to take it from there.

## How does it work?

CSS Critic checks your current layout constantly against a reference image you have provided in the past. If your layout breaks (or simply changes - CSS Critic can't tell) your tests fail.

*Get started:*

1. Create a `RegressionRunner.html` similar to the one under [`example/`](example/) and put it with your code that is to be tested.

2. Register your page under test via:

    ```js
    csscritic.add({
        url: 'SOME_URL',  // link to the test case HTML document
        desc: 'some text' // optionally, a description of the test case (see API for even more options)
    });
    ```

3. Serve the directory on a local webserver via `python3 -m http.server` and open the RegressionRunner.html in your favourite browser

4. Now save the resulting image as future reference.

5. Re-run the RegressionRunner.html and see your test passing. Congratulations.

*What do I do if my test fails?*

1. Have a look at the diff image and visually inspect what has changed.

2. If the change is an unwanted one fix your CSS,

3. If deliberate accept the change (generating a new reference image).

## Developing CSS Critic

For tests install Node.js and run

    $ npm install && npm test

To see CSS Critic testing its own UI run

    $ python3 -m http.server
    $ open http://localhost:8000/test/RegressionRunner.html

## Limitations

- Needs to be run via a webserver, as `file://` is limited by browsers due to security concerns.
- [Same-origin restrictions](https://developer.mozilla.org/en-US/docs/Same_origin_policy_for_JavaScript) apply when sourcing files.
- Because of the way the HTML is rendered internally certain limitations apply, see [the documentation of the render backend](https://github.com/cburgmer/rasterizeHTML.js/wiki/Limitations).

For more information see the [FAQ](https://github.com/cburgmer/csscritic/wiki/FAQ) and [API](https://github.com/cburgmer/csscritic/wiki/API).

Licensed under MIT. Maintained by [@cburgmer](https://twitter.com/cburgmer). Copyright (c) 2012, 2013 ThoughtWorks, Inc.
