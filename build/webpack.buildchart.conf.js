const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const { argv } = require('yargs')
const config = require('../config')

const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const dllManifestDir = path.resolve(__dirname, './manifest/prod')

const sourcemap = argv.sourcemap !== undefined ? !!argv.sourcemap : config.build.productionSourceMap

// chart目录
const chartlibs = _path => path.resolve(__dirname, `../chartlibs/${_path}`)
const distChartlibs = _path => path.resolve(__dirname, `../dist/chartlibs/${_path}`)

// 解析chartCode
const chartCode = argv.code
if (!chartCode || (chartCode && typeof chartCode !== 'string')) {
  const error = 'param \'code\' is required! e.g. \'npm run build:chart -- --code ***\''
  throw error
}

const chartFile = chartlibs(`src/${chartCode.toLowerCase()}/index.js`)

const webpackConfig = merge(baseWebpackConfig, {
  bail: true,
  devtool: '#source-map',
  entry: {
    [chartCode]: chartFile
  },
  output: {
    path: distChartlibs(chartCode),
    filename: '[name]-[chunkhash:8].js',
    publicPath: `/chartlibs/${chartCode}/`,
    library: 'chart_[name]',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
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
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
        dead_code: true
      },
      sourceMap: sourcemap
    }),
    new CleanWebpackPlugin([distChartlibs(chartCode)], {
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
    }),
    new CopyWebpackPlugin([
      {
        from: chartlibs(`src/${chartCode.toLowerCase()}/package.json`),
        to: distChartlibs(chartCode)
      },
      {
        from: chartlibs(`src/${chartCode.toLowerCase()}/platform`),
        to: distChartlibs(`${chartCode}/platform`)
      }
    ])
  ]
})

module.exports = webpackConfig
