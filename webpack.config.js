var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'site/js');
var APP_DIR = path.resolve(__dirname, 'src/js/bmeg');

var config = {
  entry: ['whatwg-fetch', APP_DIR + '/vertex.jsx'],
  devtool: 'source-map',
  output: {
    path: BUILD_DIR,
    filename: 'bmeg.js'
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
