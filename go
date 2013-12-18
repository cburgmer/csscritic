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

function runCSSTest {
    # workaround for csscritic currently needing to be called twice
    phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log=./ test/ui/*.html || phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log=./ test/ui/*.html
}

if [ ! -d node_modules ]; then
    installBuildDependencies
fi

if [ ! -d bower_components ]; then
    installDependencies
fi

build
runCSSTest
