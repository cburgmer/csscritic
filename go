#!/bin/bash
set -e

function installDependencies {
    npm install
}

function build {
    ./node_modules/.bin/grunt $@
}

function runCSSTest {
    # workaround for csscritic currently needing to be called twice
    mkdir -p build
    phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log=./build/ test/ui/*.html || phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log=./build/ test/ui/*.html
}

if [ ! -d node_modules ]; then
    installDependencies
fi

build
runCSSTest
