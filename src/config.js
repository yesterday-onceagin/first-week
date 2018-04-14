const DEV = process.env.NODE_ENV !== 'production'

module.exports = {
  // 环境变量
  DEV,

  // 子目录
  baseAlias: '',

  //请求前缀
  apiDomain: '/api',

  //组件库根地址
  chartlibsRootUrl: '/chartlibs'
}
