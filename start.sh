#!/bin/bash

source ~/.bashrc # add nvm to PATH

FILE_DIR=$(
    cd $(dirname $0)
    pwd
)

cd $FILE_DIR
/home/ubuntu/.nvm/versions/node/v20.12.0/bin/node dist/main.js
