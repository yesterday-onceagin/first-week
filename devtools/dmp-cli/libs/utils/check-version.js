'use strict';

var log = require('./log');
var latest = require('latest-version');
var co = require('co');

module.exports = function (config, callback) {
  co(function* () {
    let name = config.name;
    var newVersion = yield latest(name);
    var nowVersion = config.version;
    if (nowVersion !== newVersion) {
      log.warn(name + ' 最新版本为' + newVersion + ', 本地版本为' + nowVersion);
      log.warn('请升级 -- npm install -g ' + name + '@latest');
    } else {
      log.info('本地版本为最新版本' + newVersion);
    }
    callback && callback();
  });
}