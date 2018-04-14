require('./loadScript')
import _ from 'lodash'

import { chartlibsRootUrl } from '../config'
// 自定义的组件缓存数组
window.__CUSTOM_CHARTS = {}

const loadCustomChart = (chart_code, callback) => {
  if (typeof chart_code === 'object') {
    // 开发工具传递的是对象
    const chart = chart_code
    const echart = (chart && chart.echart) || null
    if (echart) {
      echart.isCustom = true
    }

    const chartcode = echart.info && echart.info.code
    if (chartcode && !window.__CUSTOM_CHARTS[chartcode]) {
      window.__CUSTOM_CHARTS[chartcode] = _.cloneDeep(echart)
    }
    callback && callback(_.cloneDeep(echart))
  } else if (typeof chart_code === 'string') {
    if (process.env.NODE_ENV === 'development') {
      let echart = null
      try {
        echart = require(`../../chartlibs/src/${chart_code}/index`) || null
      } catch (e) {
        echart = null
        console.error(e)
      }

      if (echart && echart.default) {
        echart = echart.default
        echart.isCustom = true
      }

      if (!window.__CUSTOM_CHARTS[chart_code]) {
        window.__CUSTOM_CHARTS[chart_code] = _.cloneDeep(echart)
      }
      callback && callback(_.cloneDeep(echart))
    } else {
      if (window.__CUSTOM_CHARTS[chart_code]) {
        callback && callback(_.cloneDeep(window.__CUSTOM_CHARTS[chart_code]))
        return
      }

      let chartUrl = `${chartlibsRootUrl}/${chart_code}/${chart_code}.js`
      if (window.chartlibs && window.chartlibs[chart_code]) {
        chartUrl = `${chartlibsRootUrl}/${chart_code}/${window.chartlibs[chart_code]}`
      }

      loadScript(chartUrl, () => {
        const echartVar = `chart_${chart_code}`
        const echart = (window[echartVar] && window[echartVar].default) || null
        if (echart) {
          echart.isCustom = true
        }

        if (!window.__CUSTOM_CHARTS[chart_code]) {
          window.__CUSTOM_CHARTS[chart_code] = _.cloneDeep(echart)
        }
        callback && callback(_.cloneDeep(echart))
      })
    }
  }
}

export default loadCustomChart
