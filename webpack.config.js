var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'site/js');
var APP_DIR = path.resolve(__dirname, 'src/js/bmeg');

var config = {
  entry: {
    vertex: ['whatwg-fetch', APP_DIR + '/vertex.jsx'],
    cohorts: [APP_DIR + '/cohorts.jsx'],
  } ,
  devtool: 'source-map',
  output: {
    path: BUILD_DIR,
    filename: "[name].bundle.js"
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
