var path = require('path')
var fs = require('fs')
var express = require('express')
var webpack = require('webpack')
var opn = require('opn')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('../../webpack.config')
var config = require('../../config')
var log = require('../utils/log')

var app = express()

module.exports = (option) => {
  log.info('预览服务启动中...')
  var source = option.source
  var port = option.port

  // 为source目录建立符号链接，链接到dmp-cli/chartlibs
  const chartlibsDir = path.resolve(__dirname, '../../chartlibs')
  const linkdir = chartlibsDir + '/chartlink'

  try {
    if (fs.readlinkSync(linkdir)) {
      fs.unlinkSync(linkdir)
    }
  } catch (e) { }
  fs.symlinkSync(source, linkdir, 'dir')

  // proxy api requests
  Object.keys(config.proxyTable).forEach((context) => {
    let options = config.proxyTable[context]
    if (typeof options === 'string') {
      options = { target: options }
    }
    app.use(proxyMiddleware(options.filter || context, options))
  })

  try {
    // babel编译source目录
    if (source) {
      var babelRule = webpackConfig.module.rules.find(rule => rule.loader.indexOf('babel-loader') > -1)
      babelRule.include.push(source)
      babelRule.exclude.push(path.resolve(source, 'node_modules'))
    }

    var compiler = webpack(webpackConfig)
    var devMiddleware = require('webpack-dev-middleware')(compiler, {
      publicPath: '/',
      quiet: true,
      stats: {
        colors: true
      }
    })

    var hotMiddleware = require('webpack-hot-middleware')(compiler, {
      log: console.log
    })

    // force page reload when html-webpack-plugin template changes
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('html-webpack-plugin-after-emit', (data, cb) => {
        hotMiddleware.publish({ action: 'reload' })
        cb()
      })
    })

    // handle fallback for HTML5 history API
    app.use(require('connect-history-api-fallback')())

    // serve webpack bundle output
    app.use(devMiddleware)

    // enable hot-reload and state-preserving
    // compilation error display
    app.use(hotMiddleware)

    // serve pure static assets
    app.use('/build', express.static(path.resolve(__dirname, '../../build')))
    app.use('/chartsdk', express.static(path.resolve(__dirname, '../../build/chartsdk')))

    devMiddleware.waitUntilValid(() => {
      console.log(`> Listening at http://localhost:${port}\n`)
    })

    app.listen(port, function (err) {
      if (err) {
        log.err(err)
        return
      }
    })

    if (!option.silent) {
      opn('http://localhost:' + port);
      log.info('服务启动，如果浏览器还没打开，麻烦手动用chrome浏览器打开localhost:' + port);
    }

  } catch (e) {
    log.err(e.stack || e);
  }
}