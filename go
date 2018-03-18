#!/bin/bash
set -e

npm install
PATH="./node_modules/.bin:$PATH" grunt $@

echo -e "\n\033[32m\033[1mLooking good!\033[0m"
