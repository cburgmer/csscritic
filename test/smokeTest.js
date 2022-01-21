#!/usr/bin/env node
"use strict";

/* jshint ignore:start */
const path = require("path");
const fs = require("fs");
const http = require("http");
const puppeteer = require("puppeteer");

const webserverPort = 8099;

if (process.argv.length !== 3) {
    console.log("Usage: smokeTest.js csscriticLoadingHtmlPage");
    process.exit(1);
}

const csscriticLoadingPage = process.argv[2];

const loadPage = async (browser, url) => {
    const page = await browser.newPage();

    // Provide some inspection
    page.on("console", (msg) => {
        for (let i = 0; i < msg.args().length; ++i) {
            console.log(`${i}: ${msg.args()[i]}`);
        }
    });
    page.on("pageerror", (msg) => {
        console.error(msg);
    });

    // Open page
    await page.setViewport({ width: 400, height: 300 });
    await page.goto(url);
    return page;
};

const startWebserver = (port) => {
    http.createServer(function (request, response) {
        const filePath = "." + request.url.replace(/\?.*$/, "");

        fs.readFile(filePath, function (error, content) {
            if (error) {
                if (error.code == "ENOENT") {
                    response.writeHead(404);
                    response.end();
                } else {
                    response.writeHead(500);
                    response.end();
                }
            } else {
                response.writeHead(200);
                response.end(content, "utf-8");
            }
        });
    }).listen(port);
};

// user actions

const selectASingleTestCase = () => {
    document
        .querySelector("#pageThatDoesNotExist\\,component\\=some_component")
        .parentElement.querySelector(".titleLink")
        .click();
};

const getComparisonCount = () => {
    return document.querySelectorAll(".comparison").length;
};

const runAll = () => {
    document.querySelector(".runAll").click();
};

const jumpToLastComparison = () => {
    var progressElements = document.querySelectorAll(".progressBar li a"),
        lastElement = progressElements[progressElements.length - 1];
    lastElement.click();
};

const jumpBackInHistory = () => {
    window.history.back();
};

const regressionTestToExecute = async (page) =>
    page.waitForSelector(".header.fail");

// poor man's asserts

var assertEquals = function (value, expectedValue, name) {
    var expectation = "Expecting " + name + " to equal '" + expectedValue + "'";
    if (value === expectedValue) {
        console.log(expectation + " ✓");
    } else {
        throw new Error(expectation + " but found '" + value + "'");
    }
};

var assertNotEquals = function (value, notExpectedValue, name) {
    var expectation =
        "Expecting " +
        name +
        " not to equal '" +
        notExpectedValue +
        "': '" +
        value +
        "'";
    if (value === notExpectedValue) {
        throw new Error(expectation);
    } else {
        console.log(expectation + " ✓");
    }
};

var assertMatches = function (value, regex, name) {
    var expectation =
        "Expecting " + name + " to match " + regex + ": '" + value + "'";
    if (regex.test(value)) {
        console.log(expectation + " ✓");
    } else {
        throw new Error(expectation);
    }
};

const runTestAgainst = async (browser, pageUrl, options) => {
    const withNavigationFallback = options.withNavigationFallback;

    console.log("Running test against " + pageUrl);

    const page = await loadPage(browser, pageUrl);

    // 1
    console.log("Waiting for regression test to finish executing");
    await regressionTestToExecute(page);

    // 2
    console.log("Jumping to last comparison");
    await page.evaluate(jumpToLastComparison);
    await page.waitForFunction("window.scrollY > 0");

    let scrollY = await page.evaluate("window.scrollY");
    assertNotEquals(scrollY, 0, "scrollY");

    if (withNavigationFallback) {
        assertEquals(page.url(), pageUrl, "page url");
    } else {
        assertMatches(page.url(), /#/, "page url");
    }

    // 3
    console.log("Jumping back");
    await page.evaluate(jumpBackInHistory);
    await new Promise((f) => setTimeout(f, 500));
    assertEquals(page.url(), pageUrl, "page url");

    // scrollY = await page.evaluate("window.scrollY");
    // assertEquals(scrollY, 0, "scrollY");

    // 4
    console.log("Selecting first comparison");
    await page.evaluate(selectASingleTestCase);
    await regressionTestToExecute(page);

    let comparisonCount = await page.evaluate(getComparisonCount);

    assertEquals(comparisonCount, 1, "number of comparisons");
    if (withNavigationFallback) {
        assertEquals(page.url(), pageUrl, "page url");
    } else {
        assertMatches(page.url(), /\?filter/, "page url");
    }

    // 5
    console.log('Clicking "Run all"');

    await page.evaluate(runAll);
    await regressionTestToExecute(page);

    comparisonCount = await page.evaluate(getComparisonCount);

    assertEquals(comparisonCount, 2, "number of comparisons");
    if (withNavigationFallback) {
        assertEquals(page.url(), pageUrl, "page url");
    } else {
        assertMatches(page.url(), /\?$/, "page url");
    }
};

(async () => {
    try {
        const browser = await puppeteer.launch({
            args: ["--allow-file-access-from-files"],
            slowMo: 100,
            headless: true,
        });

        await runTestAgainst(
            browser,
            "file://" + path.resolve(csscriticLoadingPage),
            {
                withNavigationFallback: true,
            }
        );

        startWebserver(webserverPort);
        await runTestAgainst(
            browser,
            "http://localhost:" + webserverPort + "/" + csscriticLoadingPage,
            { withNavigationFallback: false }
        );

        browser.close();

        console.log("Smoke test successful");
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
/* jshint ignore:end */
