#!/bin/bash
set -e

path="./node_modules/.bin:$PATH"

function installDependencies {
    npm install
}

function build {
    PATH=$path grunt $@
}

if [ ! -d node_modules ]; then
    installDependencies
fi

build

echo -e "\n\033[32m\033[1mLooking good!\033[0m"
