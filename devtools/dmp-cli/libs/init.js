'use strict';

var inquirer = require("inquirer");
var fs = require('fs');
var shelljs = require('shelljs');
var Path = require('path');
var process = require('process');
var urllib = require('urllib');
var log = require('./utils/log');
var _ = require('lodash');
var unzip = require('unzip');

module.exports = function (config, args, haha) {
  shelljs.config.verbose = true;
  shelljs.config.silent = true;

  function createDirForCom(answers, newProject) {
    log.debug('[2]创建组件目录.');
    var err = fs.mkdirSync('./' + answers.comName);
    if (!err) {
      process.chdir('./' + answers.comName);
      return __download(answers).then(function () {
        shelljs.exec('npm install');
      })
    } else {
      throw '创建组件目录失败:' + (err.stack || err);
    }
  }

  function __download(answers) {
    log.debug('[3]下载示例组件.')
    var zipName = 'dmp-chart-example.zip'
    if (answers.comJsFramework === 'vue') {
      zipName = 'dmp-chart-vue-example.zip'
    }
    var repository = config.server + '/mic-open/dmp/template/' + zipName
    return urllib.request(repository).then(function (res) {
      if (!res || !res.data || !res.headers || res.status !== 200) throw '下载组件失败.';
      return res;
    }).then(function (data) {
      return new Promise((resolve) => {
        var fileurl = Path.join(config.root, config.cacheDir, zipName);

        fs.writeFileSync(fileurl, data.data);
        fs.createReadStream(fileurl).pipe(unzip.Parse())
          .on('entry', function (entry) {
            var fileName = entry.path
            var comName = answers.comName;

            var type = entry.type;   // 'Directory' or 'File'
            if (type == 'Directory') {
              fs.mkdirSync(Path.join('.', fileName))
            }

            if (type == 'File' && fileName.indexOf('DS_Store') === -1) {
              entry.on('data', function (content) {
                content = content.toString('utf-8');

                log.debug('entry on data [' + fileName + ']:');

                if (fileName === 'package.json') {
                  content = JSON.parse(content);
                  content.name = answers.comName;
                  content.version = '0.0.1';
                  content.description = answers.comDesc;
                  if (content.platform) {
                    content.platform.name = answers.comCnName
                  }
                  content = JSON.stringify(content, null, 2);
                }

                fs.writeFileSync(Path.join('.', fileName), content);
              })
            }

          }).on('close', function () {
            resolve();
          }).on('error', function (err) {
            console.log('err:', err)
          });
      })
    }).catch(function (e) {
      throw e.stack || e;
    })
  }

  function showQuestions(examples) {
    log.debug('[1]输入组件信息.')
    var questions = [
      {
        type: "input",
        name: "comName",
        message: "?你要创建的组件英文名(字母, -, 数字)是...",
        validate: function (value) {
          if (!value) {
            return '不允许为空';
          }

          if (fs.existsSync(value)) {
            return '该组件目录本地已存在！';
          }
          return true;
        }
      },
      {
        type: "input",
        name: "comCnName",
        message: "?你要创建的组件中文名是...",
        validate: function (value) {
          if (!value) {
            return '不允许为空';
          }
          return true;
        }
      },
      {
        type: "input",
        name: "comDesc",
        message: "?你要创建的组件描述是...",
        validate: function (value) {
          if (!value) {
            return '不允许为空';
          }
          return true;
        }
      },
      {
        type: "list",
        name: "comJsFramework",
        message: "?开发组件所使用的JS框架是...",
        choices: ["react", "vue"]
      }
    ];

    return inquirer.prompt(questions).then(function (answers) {
      return answers;
    });
  }

  showQuestions()
    .then(createDirForCom)
    .then(function () {
      log.info('组件创建完毕');
    }).catch(function (e) {
      log.err(e);
    })
}