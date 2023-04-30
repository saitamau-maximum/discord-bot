#!/bin/bash

FILE_DIR=$(
    cd $(dirname $0)
    pwd
)

cd $FILE_DIR
npm run start
