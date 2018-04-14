process.env.NODE_ENV = 'production'

var path = require('path')
var fs = require('fs')
var webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

var webpackConfig = require('../../webpack.buildChart.config')
var pack = require('../utils/pack')
var log = require('../utils/log')

module.exports = (option, callback) => {
  log.info('组件打包服务启动中...')
  var source = option.source
  if (source) {
    // 组件相关配置
    var configUrl = path.join(source, '/package.json')
    var chartPackageJsonStr = fs.readFileSync(configUrl).toString()
    var chartPackageJson = chartPackageJsonStr ? JSON.parse(chartPackageJsonStr) : null
    if (chartPackageJson) {
      var chartCode = chartPackageJson.name
      log.info('正在打包组件' + chartCode)

      webpackConfig.entry = {}
      webpackConfig.entry[chartCode] = path.resolve(source, './index.js')
      webpackConfig.output.path = path.resolve(source, './dist')
      webpackConfig.output.publicPath = `/chartlibs/${chartCode}/`

      var babelRule = webpackConfig.module.rules.find(rule => rule.loader.indexOf('babel-loader') > -1)
      babelRule.include.push(source)
      babelRule.exclude.push(path.resolve(source, 'node_modules'))

      webpackConfig.plugins.unshift(new CleanWebpackPlugin([path.resolve(source, './dist'), path.resolve(source, './pack')], {
        allowExternal: true
      }))

      webpackConfig.plugins.push(new CopyWebpackPlugin([
        {
          from: path.resolve(source, `./package.json`),
          to: path.resolve(source, './dist')
        },
        {
          from: path.resolve(source, `./platform`),
          to: path.resolve(source, './dist/platform')
        }
      ]))

      webpack(webpackConfig, (err, stats) => {
        if (err) throw err
        process.stdout.write(`${stats.toString({
          colors: true,
          modules: true,
          children: false,
          chunks: true,
          chunkModules: false
        })}\n\n`)

        //修改package.json的md5Version
        const libdir = path.join(source, './dist')
        if (fs.statSync(libdir).isDirectory()) {
          const libFiles = fs.readdirSync(libdir)
          for (let i = 0; i < libFiles.length; i++) {
            const file = libFiles[i]
            const regExp = new RegExp('^' + chartCode + '\-(\\w{8})\.js$')
            const libPath = file.match(regExp)

            if (libPath) {
              const lib_package = path.join(source, './dist/package.json')
              const lib_package_file = fs.readFileSync(lib_package)
              if (lib_package_file) {
                const lib_package_buffer = lib_package_file.toString()
                const packageJson = JSON.parse(lib_package_buffer)
                if (packageJson && packageJson.platform) {
                  packageJson.platform.md5version = libPath[1]
                  fs.writeFileSync(lib_package, JSON.stringify(packageJson))
                }
              }
            }
          }
        }

        // 压缩
        pack(path.join(source, './pack'), path.join(source, './dist'), chartCode, function (err) {
          if (err) {
            return log.err(err);
          } else {
            log.info('组件打包完成')
          }
        })
      })
    }
  }
}