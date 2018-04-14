#!/usr/bin/env node

var chalk = require('chalk')
var cmd = require('commander')
var config = require('../package.json')
var version = require('../libs/utils/check-version')
var log = require('../libs/utils/log')
var _ = require('lodash');

var logo =
  ` 
  ██████╗  ███╗   ███╗ ██████╗ 
  ██╔══██╗ ████╗ ████║ ██╔══██╗
  ██║  ██║ ██╔████╔██║ ██████╔╝
  ██║  ██║ ██║╚██╔╝██║ ██╔═══╝ 
  ██████╔╝ ██║ ╚═╝ ██║ ██║     
  ╚═════╝  ╚═╝     ╚═╝ ╚═╝                                                                                             
`;

console.log(chalk.cyan(logo))

config = _.merge(config, require('../config'));

var COMMANDMAP = {
  comInit: require('../libs/init'),        //初始化
  preview: require('../libs/preview'),     //预览
  package: require('../libs/package'),     //打包
}

function exec(command, ...args) {
  log.debugModeSwitch(args[0].debug);
  version(config, function () {
    COMMANDMAP[command](config, ...args);
  })
}

cmd
  .usage('[options] <folder|file...>')
  .version('v' + config.version, '-v, --version')
  .description('DMP图表组件开发工具')

cmd.command('init')
  .option('-d --debug', 'debug mode')
  .description('初始化组件')
  .action((...args) => exec('comInit', ...args))

cmd
  .command('run')
  .option('-p --port [value]', 'custom server port')
  .option('-s --silent', 'keep silent')
  .option('-d --debug', 'debug mode')
  .description('运行组件')
  .action((...args) => exec('preview', ...args))

cmd
  .command('package')
  .option('-d --debug', 'debug mode')
  .description('打包组件')
  .action((...args) => exec('package', ...args))

cmd
  .command('latest')
  .description('检测开发工具最新版本')
  .action(() => version(config));

cmd.parse(process.argv)

if (!cmd.args.length) {
  cmd.help()
}


