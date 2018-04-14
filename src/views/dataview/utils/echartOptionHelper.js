import _ from 'lodash'
import echarts from 'echarts'
import { formatDisplay } from './generateDisplayFormat'

const format = function (dF, value) {
  return `${formatDisplay(value, dF)}${(dF && dF.column_unit_name && dF.column_unit_name) || ''}`
}

// 弧度转换成echarts [x1, y1, x2, y2]
const _angelToPoints = function (radians) {
  const { cos, sin, PI } = Math
  const offset = PI / 2
  // 根据圆的方程
  return [
    0.5 * cos(radians + offset) + 0.5,
    0.5 * sin(radians + offset) + 0.5,
    0.5 * cos(radians + PI + offset) + 0.5,
    0.5 * sin(radians + PI + offset) + 0.5,
  ]
}

const _getParamFromAngle = function (angle) {
  return _angelToPoints(angle / 180 * Math.PI)
  // 水平渐变
  // if (angle === 90) {
  //   return [0, 0, 1, 0]
  // }
  // return [0, 0, 0, 1]
}

// 生成普通颜色或者渐变色
export function getEchartColor(legendTheme, index, code) {
  const getColorFromColorTheme = window.DEFAULT_ECHARTS_OPTIONS.getColorFromColorTheme
  let color = getColorFromColorTheme(legendTheme, index, code)
  if (Array.isArray(color)) {
    const angle = color[2]
    const param = _getParamFromAngle(angle)
    color = new echarts.graphic.LinearGradient(param[0], param[1], param[2], param[3], [{ offset: 0, color: color[0] }, { offset: 1, color: color[1] }])
  }
  return color
}

/**
 * [getColorStyle description]
 * @param  {[type]} type  'line', 'bar'
 */
export function attachColorStyle({ type, code }, sery, legendTheme, seryIndex, totalSeries = 1, relatedIndex = -1/*联动的序号*/) {
  const { getColorFromColorTheme } = window.DEFAULT_ECHARTS_OPTIONS
  const color = getEchartColor(legendTheme, seryIndex, code)
  switch (type) {
    case 'line':
      if (relatedIndex > -1) {
        _.set(sery, 'lineStyle.normal.color', '#666')
        _.set(sery, 'showAllSymbol', true)
      } else {
        _.set(sery, 'lineStyle.normal.color', color)
      }
      _.set(sery, 'symbol', 'circle')
      _.set(sery, 'itemStyle.normal.color', color)
      break
    case 'treemap':
    case 'funnel':
    case 'pie': {
      const originColor = getColorFromColorTheme(legendTheme, seryIndex, code, true)
      _.set(sery, 'itemStyle.normal.color', color)
      // 如果是渐变色, 那么label 需要设置一个颜色, 否则默认为黑色了
      if (Array.isArray(originColor)) {
        if (type === 'treemap') {
          _.set(sery, 'label.normal.color', '#fff')
        } else {
          _.set(sery, 'label.normal.color', originColor[0])
        }
      }
      break
    }
    case 'liquid_fill': {
      const colorArr = sery.color ? sery.color : []
      colorArr[seryIndex] = color
      _.set(sery, 'color', colorArr)
      break
    }
    case 'bar':
      // 设置series的颜色, legend要使用
      _.set(sery, 'itemStyle.normal.color', color)
      // 设置data 的每一个颜色
      if (Array.isArray(sery.data)) {
        // 柱状图的颜色可以支持多数值, 颜色设置为顺序排列获取
        sery.data.forEach((s, i) => {
          let c
          // 存在联动(i===relatedIndex) 或者 没有联动
          if (i === relatedIndex || relatedIndex <= -1) {
            c = +legendTheme.affect === 1 ? getEchartColor(legendTheme, totalSeries * i + seryIndex, code) : color
          } else {
            c = '#666'
          }
          _.set(s, 'itemStyle.normal.color', c)
        })
      }
      break
    case 'flow_bar':
      _.set(sery, 'itemStyle.normal.color', color)
      if (Array.isArray(sery.data)) {
        const upColor = getEchartColor(legendTheme, 0, code)
        sery.data.forEach((s, i) => {
          let c
          const currentColor = upColor
          // 存在联动(i===relatedIndex) 或者 没有联动
          if (i === relatedIndex || relatedIndex <= -1) {
            c = currentColor
          } else {
            c = '#666'
          }
          _.set(s, 'itemStyle.normal.color', c)
        })
      }
      break
    case 'area':
      _.set(sery, 'symbol', 'circle')
      _.set(sery, 'lineStyle.normal.color', color)
      _.set(sery, 'areaStyle.normal.color', color)
      _.set(sery, 'areaStyle.normal.opacity', 0.8)
      _.set(sery, 'itemStyle.normal.color', color)
      break
    case 'radar':
      _.set(sery, 'symbol', 'circle')
      _.set(sery, 'lineStyle.normal.color', color)
      _.set(sery, 'itemStyle.normal.color', color)
      break
    case 'scatter_map':
    case 'scatter': {
      let c = color
      if (+legendTheme.affect !== 1) {
        c = getEchartColor(legendTheme, 0, code)
      }
      _.set(sery, 'itemStyle.normal.color', c)
      _.set(sery, 'itemStyle.normal.opacity', 0.7)
      break;
    }
    // 暂时无用
    case 'map':
      _.set(sery, 'itemStyle.normal.areaColor', color)
      _.set(sery, 'itemStyle.normal.borderColor', 'transparent')
      _.set(sery, 'itemStyle.normal.borderWidth', 2)
      break;
    default:
      break
  }
  return sery
}

// 全屏模式下需要调整字体大小和图例大小
export function adjustForFullSize(option, props) {
  const { fullScreen } = props

  if (option.radar) {
    _.set(option.radar, 'textStyle.fontSize', fullScreen ? 18 : 12)
  }

  if (option.legend) {
    _.set(option.legend, 'textStyle.fontSize', fullScreen ? 20 : 12)
  }

  if (option.yAxis) {
    _.set(option.yAxis, 'axisLabel.textStyle.fontSize', fullScreen ? 18 : 12)
  }

  if (option.xAxis) {
    _.set(option.xAxis, 'axisLabel.textStyle.fontSize', fullScreen ? 18 : 12)
  }

  if (option.series && option.series[0] && option.series[0].type === 'pie') {
    _.set(option, 'series[0].label.normal.textStyle.fontSize', fullScreen ? 18 : 12)
    _.set(option, 'series[0].label.emphasis.textStyle.fontSize', fullScreen ? 20 : 14)
  }

  return option
}

// 所有的echart 的option 都应该经过这个hook, 做统一处理比如 要统一修改字体
export function optionsHook(options, props = {}) {
  options = adjustForFullSize(options, props)
  return options
}

// 非官方的scale方法, 但是可以通过dpr重绘 实现css3 transform: scale() 不虚化的完美效果
// 注意: 此方法需要在chart init 之后, setOption之前使用, 否则没有效果
export function scaleChart(chart, scaleRate) {
  if (!scaleRate) {
    return
  }
  // 需要兼容mac retina
  chart._zr.painter.dpr = Math.max(scaleRate * window.devicePixelRatio, 1)
}

// 获取轴标签的旋转角度
export function getAxisLabelRotateAngle(angle, axisType = 'x') {
  switch (angle) {
    case 'horizon':
      return 0
    case 'italic':
      return axisType === 'x' ? 45 : -45
    case 'vertical':
      return 90
    default:
      return null
  }
}

// 折线样式
export function attachLineStyle(series, options) {
  _.set(series, 'lineStyle.normal.type', options.lineType)
  _.set(series, 'lineStyle.normal.width', options.lineSize)
  _.set(series, 'symbolSize', options.lineItem * 2)
  _.set(series, 'smooth', options.lineSmooth)
}
// 标签纸的演示, 比如折线图
export function attachLabelValueStyle(series, options) {
  /*
  const { displayFormat, dimsForRelated } = dataOrigin || {}
  const dF = displayFormat || {}
  let _dF = null
  if (dimsForRelated) {      // 有维度
    const keys = Object.keys(dF)
    if (keys.length > 0) {
      _dF = dF[keys[0]]
    }
  } else {
    _dF = dF[series.name]
  }
  */
  if (options) {
    const { size, distance, show } = options
    _.set(series, 'label.normal.show', show)
    _.set(series, 'label.normal.distance', distance)
    _.set(series, 'label.normal.fontSize', size)
    // fix 渐变色 label颜色变成黑色的bug
    if (series.itemStyle && series.itemStyle.normal.color && series.itemStyle.normal.color.colorStops) {
      _.set(series, 'label.normal.color', series.itemStyle.normal.color.colorStops[0].color)
    }
    // _.set(series, 'label.normal.formatter', ())
  }
}

// 饼图的标签样式
export function attachPieLabelStyle(series, options, dataOrigin) {
  const { displayFormat, dimsForRelated } = dataOrigin || {}
  const dF = displayFormat || {}

  let _dF = null
  if (dimsForRelated) {      // 有维度
    const keys = Object.keys(dF)
    if (keys.length > 0) {
      _dF = dF[keys[0]]
    }
  } else {
    _dF = dF[series.name]
  }

  const { labelLine, labelName, labelValue, labelPercent, scroll } = options
  _.set(series, 'labelLine.normal.length', labelLine.length1)
  _.set(series, 'labelLine.normal.length2', labelLine.length2)
  //根据是否轮播决定label是否显示
  _.set(series, 'labelLine.normal.show', !scroll.checked)
  _.set(series, 'label.normal.show', !scroll.checked)
  _.set(series, 'label.emphasis.show', true)
  _.set(series, 'label.normal.rich', {
    n: {
      fontSize: labelName.fontSize,
      color: series.label && series.label.normal.color  // 解决渐变色的bug
    },
    p: {
      fontSize: labelPercent.fontSize,
      color: series.label && series.label.normal.color
    },
    v: {
      fontSize: labelValue.fontSize,
      color: series.label && series.label.normal.color,
      lineHeight: labelValue.lineHeight
    }
  })

  _.set(series, 'label.normal.formatter', (params) => {
    const value = _dF ? format(_dF, params.value) : params.value

    return [
      labelName.show ? `{n|${params.name}}` : '',
      (labelName.show && labelPercent.show) ? ': ' : '',
      labelPercent.show ? `{p|${params.percent}%}` : '',
      (labelName.show || labelPercent.show) && labelValue.show ? '\n' : '',
      labelValue.show ? `{v|${value}}` : ''
    ].join('')
  })
}

// 取得文字样式
export function getFontStyles(fontStyle = '') {
  if (typeof fontStyle !== 'string') {
    fontStyle = ''
  }
  return {
    fontStyle: fontStyle.indexOf('italic') > -1 ? 'italic' : 'normal',
    fontWeight: fontStyle.indexOf('bold') > -1 ? 'bold' : 'normal',
    textDecoration: fontStyle.indexOf('underline') > -1 ? 'underline' : 'none'
  }
}

// 取得echart渲染引擎
export function getEchartRenderer(platform = 'pc') {
  if (platform === 'mobile') {
    return { renderer: 'svg' }
  }
  return { renderer: 'canvas' }
}
