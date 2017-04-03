#!/bin/bash

DATA_URL="http://bmeg.io"
PORT=8080

echo "starting proxy to $DATA_URL through localhost port $PORT"

python proxy.py $DATA_URL --port $PORT

