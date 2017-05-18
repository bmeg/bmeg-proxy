var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'static/js');
var APP_DIR = path.resolve(__dirname, 'src/js/bmeg');

var config = {
  entry: ['whatwg-fetch', APP_DIR + '/use_case_2.jsx'],
  devtool: 'source-map',
  output: {
    path: BUILD_DIR,
    filename: 'use_case_2_webpack.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?/,
        include: [APP_DIR],
        loader: 'babel-loader'
      }
    ]
  }
};

module.exports = config;
