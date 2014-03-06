#!/bin/bash
set -e

function installDependencies {
    npm install
}

function build {
    ./node_modules/.bin/grunt $@
}

function runCSSTest {
    DATE=$(date "+%Y-%m-%dT%H:%M:%S")
    BUILD_DIR="./build/${DATE}"
    mkdir -p "${BUILD_DIR}"

    # workaround for csscritic currently needing to be called twice
    phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log="${BUILD_DIR}" test/ui/*.html || phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log="${BUILD_DIR}" test/ui/*.html

    echo -e "\033[32m\033[1mAll UI tests are passing\033[0m\n"

    echo "Now make sure that the fingerprints are up-to-date so we don't push something that travis is unable to check"
    mv test/ui/*.html.json "${BUILD_DIR}"
    # again, workaround for csscritic currently needing to be called twice
    phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log="${BUILD_DIR}" test/ui/*.html || phantomjs dist/csscritic-phantom.js -f test/signedOff.json --log="${BUILD_DIR}" test/ui/*.html
}

if [ ! -d node_modules ]; then
    installDependencies
fi

build
runCSSTest

echo -e "\n\033[32m\033[1mLooking good!\033[0m"
