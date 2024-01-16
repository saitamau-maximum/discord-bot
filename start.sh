#!/bin/bash

source ~/.bashrc # add nvm to PATH

FILE_DIR=$(
    cd $(dirname $0)
    pwd
)

cd $FILE_DIR
npm run build
npm run start
