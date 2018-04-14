const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const { argv } = require('yargs')
const config = require('../config')

const baseWebpackConfig = require('./webpack.base.conf')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')

const sourcemap = argv.sourcemap !== undefined ? !!argv.sourcemap : config.build.productionSourceMap

const { env } = argv
const dllManifestDir = path.resolve(__dirname, `./manifest/${env}`)

const chartsdkDir = env === 'prod' ? path.resolve(__dirname, '../dist/chartsdk') : path.resolve(__dirname, './chartsdk')

const webpackConfig = merge(baseWebpackConfig, {
  bail: true,
  devtool: '#source-map',
  entry: {
    'dmp-chart-sdk': path.resolve(__dirname, '../src/views/dataview/chartsdk/dmp-chart-sdk'),
  },
  output: {
    path: chartsdkDir,
    filename: `${env}/[name].js`,
    publicPath: '/chartsdk/',
    library: 'DmpChartSDK',
    libraryTarget: 'umd'
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
    new OptimizeCSSPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
        dead_code: true
      },
      sourceMap: sourcemap
    }),
    new CleanWebpackPlugin([chartsdkDir], {
      allowExternal: true
    }),
    new webpack.DllReferencePlugin({
      context: dllManifestDir,
      manifest: require(path.join(dllManifestDir, 'dependence-manifest.json'))
    }),
    new webpack.DllReferencePlugin({
      context: dllManifestDir,
      manifest: require(path.join(dllManifestDir, 'vendor-manifest.json'))
    }),
    new webpack.DllReferencePlugin({
      context: dllManifestDir,
      manifest: require(path.join(dllManifestDir, 'external-manifest.json'))
    })
  ]
})

module.exports = webpackConfig
