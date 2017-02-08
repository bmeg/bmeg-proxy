var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'build');
var APP_DIR = path.resolve(__dirname, 'src/js/bmeg');

var config = {
  entry: APP_DIR + '/vertex.jsx',
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
