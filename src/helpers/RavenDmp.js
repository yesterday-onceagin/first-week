import Raven from 'raven-js'

class RavenDmp {
  constructor() {
    this.raven = Raven
  }

  // 初始化
  init(opts = {}) {
    const { hostname } = window.location;
    const { userAgent } = window.navigator;
    const account = localStorage.getItem('account') || '未填写用户名';
    const tenantCode = localStorage.getItem('tenant_code') || '未填写企业代码';
    // 判断环境
    const env = /^dmp-(test|dbeta|dev)/.test(hostname) ? 'test' : 'prod'
    this.raven.config(this.SENTRY_HOST[env]).setExtraContext({
      ...opts,
      Host: hostname,
      Browser: userAgent,
      UserAccount: account,
      tenantCode
    }).install()
  }

  // 捕获错误
  capture(error, extraInfo = {}) {
    this.raven.captureException(error, extraInfo)
  }

  SENTRY_HOST = {
    // 测试环境sentry地址
    test: 'https://581f173a47094f9a9d510e913df3fdd7@sentry-test.mypaas.com.cn/91',
    // 生产环境sentry地址
    prod: 'https://afbd2bad83804bae8aef35e565679cdc@sentry.mypaas.com.cn/35'
  }
}

export default RavenDmp
