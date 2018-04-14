var path = require('path')
var webpack = require('webpack')

var HtmlWebpackPlugin = require('html-webpack-plugin')
var HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin')
var ProgressBarPlugin = require('progress-bar-webpack-plugin')
var VueLoaderOptionsPlugin = require('vue-loader-options-plugin')

var dllManifestDir = path.resolve(__dirname, './build/manifest/dev')

var resolve = (_path) => {
  return path.resolve(__dirname, `${_path}`)
}

var webpackConfig = {
  devtool: '#cheap-module-eval-source-map',
  entry: {
    main: [
      'webpack-hot-middleware/client?noInfo=false&reload=false',
      resolve('./src/main')
    ]
  },
  output: {
    filename: 'js/[name].bundle.js',
    chunkFilename: 'js/chunks/[id].[chunkhash:8].js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.vue', '.json'],
    modules: [path.resolve(__dirname, "node_modules"), "node_modules"]
  },
  resolveLoader: {
    modules: [path.resolve(__dirname, "node_modules"), "node_modules"]
  },
  externals: {
    'dmp-chart-sdk': 'DmpChartSDK'
  },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader?cacheDirectory=true',
        include: [resolve('src'), resolve('chartlibs')],
        exclude: [resolve('node_modules'), resolve('src/components/dmpsimulator')],
        options: {
          extends: path.resolve(__dirname, './.babelrc')
        }
      },
      {
        test: /\.(png|jpe?g|gif|ico)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          limit: 8192,
          name: 'images/[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          limit: 8192,
          name: 'fonts/[name].[hash:7].[ext]'
        }
      },
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
    new ProgressBarPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"'
      }
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new VueLoaderOptionsPlugin({
      babel: {
        extends: path.resolve(__dirname, './.babelrc')
      }
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
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, './index.html'),
      inject: true
    }),
    new HtmlWebpackIncludeAssetsPlugin({
      assets: ['/chartsdk/dev/dmp-chart-sdk.js'],
      append: false,
      hash: true,
      publicPath: ''
    }),
    new HtmlWebpackIncludeAssetsPlugin({
      assets: ['/chartsdk/css/dmp-chart-sdk.min.css'],
      append: false,
      hash: true,
      publicPath: ''
    }),
  ]
}

module.exports = webpackConfig
