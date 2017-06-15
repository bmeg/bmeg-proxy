var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'site/js');
var APP_DIR = path.resolve(__dirname, 'src/js/bmeg');

// see https://github.com/react-toolbox/react-toolbox-example

var config = {
  entry: {
    vertex: ['whatwg-fetch', APP_DIR + '/vertex.jsx'],
    cohorts: [APP_DIR + '/cohorts.jsx'],
    response: [APP_DIR + '/response.jsx'],
    search: [APP_DIR + '/search.jsx']
  } ,
  resolve: {
    extensions: [".js", ".json", ".css"]
  },
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
        loader: 'babel-loader',
        options: {
          presets: [
            ["es2015", { modules: false }],
            "stage-2",
            "react"
          ],
          plugins: [
            "transform-node-env-inline"
          ]
        }
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
              sourceMap: true,
              importLoaders: 1,
              localIdentName: "[name]--[local]--[hash:base64:8]"
            }
          },
          "postcss-loader" // has separate config, see postcss.config.js nearby
        ]
      }
    ]
  }
};

module.exports = config;
