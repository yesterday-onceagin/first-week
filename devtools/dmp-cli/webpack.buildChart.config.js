const path = require('path')
const webpack = require('webpack')
const VueLoaderOptionsPlugin = require('vue-loader-options-plugin')

var resolve = (_path) => {
  return path.resolve(__dirname, `${_path}`)
}

const dllManifestDir = path.resolve(__dirname, './build/manifest/prod')

const webpackConfig = {
  devtool: '#source-map',
  entry: null,
  output: {
    filename: '[name]-[chunkhash:8].js',
    library: 'chart_[name]',
    libraryTarget: 'umd'
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
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.HashedModuleIdsPlugin(),
    new VueLoaderOptionsPlugin({
      babel: {
        extends: path.resolve(__dirname, './.babelrc')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
        dead_code: true
      },
      sourceMap: true
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
}

module.exports = webpackConfig
