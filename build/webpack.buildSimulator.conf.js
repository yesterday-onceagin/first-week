const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')

const baseWebpackConfig = require('./webpack.base.conf')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const webpackConfig = merge(baseWebpackConfig, {
  // devtool: '#source-map',
  entry: {
    dmpsimulator: path.resolve(__dirname, '../src/views/dataview/simulator/index')
  },
  output: {
    path: path.resolve(__dirname, '../devtools/dmp-cli/src/components/dmpsimulator'),
    filename: '[name].js',
    publicPath: '../',
    library: 'DmpSimulator',
    libraryTarget: 'umd'
  },
  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom'
    },
    lodash: {
      root: '_',
      commonjs2: 'lodash',
      commonjs: 'lodash',
      amd: 'lodash',
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            'less-loader'
          ]
        })
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.HashedModuleIdsPlugin(),
    new ExtractTextPlugin({
      filename: 'css/[name].min.css',
      disable: false,
      allChunks: true
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
        dead_code: true
      },
      sourceMap: false
    }),
    new CleanWebpackPlugin([
      path.resolve(__dirname, '../devtools/dmp-cli/src/components/dmpsimulator'),
      path.resolve(__dirname, '../devtools/dmp-cli/build'),
    ], { allowExternal: true }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, './dll'),
        to: path.resolve(__dirname, '../devtools/dmp-cli/build/dll'),
        ignore: ['prod/*.*']
      },
      {
        from: path.resolve(__dirname, './manifest'),
        to: path.resolve(__dirname, '../devtools/dmp-cli/build/manifest')
      },
      {
        from: path.resolve(__dirname, './chartsdk'),
        to: path.resolve(__dirname, '../devtools/dmp-cli/build/chartsdk'),
        ignore: ['prod/*.*']
      }
    ])
  ]
})

module.exports = webpackConfig
