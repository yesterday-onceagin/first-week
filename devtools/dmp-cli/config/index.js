'use strict';

var path = require('path');

var defaultConfig = {
  debug: true,
  server: 'http://oss-cn-hangzhou.aliyuncs.com',
  cacheDir: 'tmp_cache',
  root: path.join(__dirname, '../'),
  proxyTable: {
    '/api': {
      target: 'https://dmp-devtool-test.mypaas.com.cn',
      changeOrigin: true,

      //修改代理响应头cookie域名与开发域名一致，方便登录认证
      // cookieDomainRewrite: 'dmp-dev.mypaas.com.cn',
      pathRewrite: {
        '^/api': '/api/demo'
      }
    }
  }
}

module.exports = defaultConfig;