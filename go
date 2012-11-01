#!/bin/bash

function testFailure {
    if [ $? != 0 ]; then
        exit 1;
    fi
}

function installBuildDependencies {
    npm install
}

function installDependencies {
    ./node_modules/.bin/bower install
}

function build {
    ./node_modules/.bin/grunt $@
    testFailure
}

function runPhantomJSOnlyTests {
    phantomjs test/run-phantomjs-tests.js
    testFailure
}

if [ ! -d node_modules ]; then
    installBuildDependencies
fi

if [ ! -d components ]; then
    installDependencies
fi

build
runPhantomJSOnlyTests
