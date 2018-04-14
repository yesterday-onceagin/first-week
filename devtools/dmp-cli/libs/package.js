'use strict';

var buildChart = require('./common/buildChart');
var path = require('path');
var fs = require('fs');
var log = require('./utils/log');
var Utils = require('./utils');

module.exports = function (config, source, args) {
  if (typeof source !== 'string') {
    args = source;
    source = process.cwd();
  }

  var fstat, cwd = process.cwd(), nmstat;
  source = Utils.isAbsPath(source) && source || path.join(cwd, source);

  try {
    fstat = fs.statSync(source);
  } catch (e) {
    log.err('source not found', e);
    return;
  }

  if (fstat.isDirectory()) {
    var mainUrl = path.join(source, '/index.js');
    var configUrl = path.join(source, '/package.json');
    try {
      fstat = fs.statSync(mainUrl);
      fstat = fs.statSync(configUrl);
    } catch (e) {
      log.err('source not found', e);
      return;
    }

    //打包
    buildChart({
      root: config.root,
      source: source,
      config: config
    });
  } else {
    log.err('unknow type input source', source);
  }
}
