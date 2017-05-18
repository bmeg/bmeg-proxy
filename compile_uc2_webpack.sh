#!/bin/bash

echo "compile webpack as specified in webpack.config.js"

node_modules/.bin/webpack \
	--config uc2_webpack.config.js \
	-d \
	--progress \
	;
