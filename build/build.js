/*eslint-disable */
process.env.NODE_ENV = 'production'

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const { argv } = require('yargs')
// const webpackConfig = argv.buildMode == 'chart' ? require(`./webpack.buildChart.conf`) : require('./webpack.prod.conf')

let webpackConfig = null
switch (argv.buildMode) {
  case 'chart':
    webpackConfig = require(`./webpack.buildchart.conf`)
    break;
  case 'simulator':
    webpackConfig = require(`./webpack.buildSimulator.conf`)
    break;
  case 'chartsdk':
    webpackConfig = require(`./webpack.buildChartsdk.conf`)
    break;
  default:
    webpackConfig = require('./webpack.prod.conf')
    break;
}

console.log(chalk.cyan('building for production...\n'))

webpack(webpackConfig, (err, stats) => {
  if (err) throw err
  process.stdout.write(`${stats.toString({
    colors: true,
    modules: true,
    children: false,
    chunks: true,
    chunkModules: false
  })}\n\n`)

  //构建chart完成时，更新manifest（临时方案）
  if (argv.buildMode == 'chart') {
    const chartlibsDir = fs.readdirSync(path.join(__dirname, '../dist/chartlibs'))
    if (chartlibsDir) {
      let manifest = {}
      chartlibsDir.forEach(lib => {
        const libdir = path.join(__dirname, '../dist/chartlibs/' + lib)
        if (fs.statSync(libdir).isDirectory()) {
          const libFiles = fs.readdirSync(libdir)
          for (let i = 0; i < libFiles.length; i++) {
            const file = libFiles[i]
            const regExp = new RegExp('^' + lib + '\-(\\w{8})\.js$')
            const libPath = file.match(regExp)

            if (libPath) {
              // 修改每个组件package文件内的md5version
              if (lib === argv.code) {
                const lib_package = path.join(__dirname, '../dist/chartlibs/' + lib + '/package.json')
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

              manifest[lib] = libPath[0]
              break;
            }
          }
        }
      })
      fs.writeFileSync(path.join(__dirname, '../dist/chartlibs/manifest.js'), 'window.chartlibs =' + JSON.stringify(manifest))
    }
  }

  console.log(chalk.cyan('  Build complete.\n'))
  console.log(chalk.yellow('  Tip: built files are meant to be served over an HTTP server.\n' +
    '  Opening index.html over file:// won\'t work.\n'))
})
