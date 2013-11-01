#!/bin/bash
set -e

function installBuildDependencies {
    npm install
}

function installDependencies {
    ./node_modules/.bin/bower --version
    ./node_modules/.bin/bower install
}

function build {
    ./node_modules/.bin/grunt $@
}

function runPhantomJSOnlyTests {
    phantomjs test/run-phantomjs-tests.js
}

function runCSSTest {
    # workaround for csscritic currently needing to be called twice
    phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log=./ test/BasicHtmlReporterLayout.html || phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log=./ test/BasicHtmlReporterLayout.html
}

if [ ! -d node_modules ]; then
    installBuildDependencies
fi

if [ ! -d bower_components ]; then
    installDependencies
fi

build
runPhantomJSOnlyTests
runCSSTest
