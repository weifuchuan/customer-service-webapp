import merge from 'webpack-merge';
import baseConfig from './webpack.config.base';
import path from 'path';
import { resolveApp } from './kit';
import process from 'process';
import webpack from 'webpack';

const TerserPlugin = require('terser-webpack-plugin');

export default merge(baseConfig as any, {
  mode: 'production',
  devtool: false,

  output: {
    path: resolveApp('build'),
    filename: 'static/js/[name].[chunkhash:4].bundle.js',
    chunkFilename: 'static/js/[id].[chunkhash:4].chunk.js',
    publicPath: process.env.PUBLIC_PATH ? process.env.PUBLIC_PATH : '/'
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true
          }
        },
        parallel: true,
        cache: true,
        sourceMap: false
      })
    ], 
  }
});
