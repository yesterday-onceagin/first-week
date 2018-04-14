import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import echarts from 'echarts'
import { Connect, Utils } from 'dmp-chart-sdk'

const { DataUtils, scaleChart, formatDisplay, applyOptionMarkline, getEchartRenderer } = Utils

const fmtInteger = (ints) => {
  if (Number.isNaN(+ints)) {
    return '-'
  }

  ints = (+ints).toFixed(2).split('.')
  const arr = ints[0].split('').reverse()
  const newArr = []

  arr.forEach((item, i) => {
    if (i % 3 === 2 && i !== (arr.length - 1)) {
      newArr.push(item)
      if (!Number.isNaN(arr[i + 1])) {          //防止-,234,234.34情况
        newArr.push(',')
      }
    } else {
      newArr.push(item)
    }
  })

  return `${newArr.reverse().join('')}.${ints[1]}`
}

// 设置 图例
// affect: 是否按数值配色方案
const _getLegendOption = (data, legendConfig) => {
  const o = {
    show: legendConfig.show,
    itemWidth: legendConfig.fontSize * 0.8333333333333334,
    itemHeight: legendConfig.fontSize * 0.8333333333333334,
    itemGap: +legendConfig.gap,
    textStyle: {
      fontSize: legendConfig.fontSize,
      color: legendConfig.color
    },
    data
  }
  // 获得位置
  const posArr = (legendConfig.position || 'top-center').split('-');
  ([o.top, o.left] = posArr)
  return o
}

// 获取轴标签的旋转角度
const _getAxisLabelRotateAngle = (angle, axisType = 'x') => {
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

// 应用tooltip
const _tooltip = function (options, dataOrigin, indicators) {
  const { numsDisplayFormat } = dataOrigin || {}
  const { dims, nums } = indicators || {}
  const dF = numsDisplayFormat || {}

  const format = function (_dF, value) {
    return `${formatDisplay(value, _dF)}${(_dF && _dF.column_unit_name && _dF.column_unit_name) || ''}`
  }
  options.tooltip.backgroundColor = '#22325d'
  options.tooltip.extraCssText = 'box-shadow: 2px 2px 8px #141E39;max-height: 450px;overflow-y:auto; transform: translateZ(1px);'
  options.tooltip.enterable = true
  options.tooltip.hideDelay = 500
  options.tooltip.formatter = function (data) {
    const titleColor = '#fff'
    const tmpl = []
    data.forEach((item, index) => {
      // index 0为K线图数据
      if (index === 0 && !!item.name) {
        const dim = dims ? dims[0] : {}
        const dimTitle = dim.alias || dim.alias_name || dim.col_name
        tmpl.push(`<span style="color: ${titleColor}; font-size: 14px; line-height: 150%">${dimTitle} ${item.name}</span>`)
        if (nums && nums.length >= 4) {
          nums.slice(0, 4).forEach((_item, _index) => {
            const numName = _item.alias || _item.alias_name || _item.col_name
            let valueStr = _.get(item, `data.${_index + 1}`, '-')
            if (dF[numName]) {
              valueStr = format(dF[numName], valueStr)
            }
            tmpl.push(`<span style="color: ${item.color}; font-size: 14px; line-height: 150%">${numName} : ${valueStr}</span>`)
          })
        }
      } else {
        // 均值曲线或自定义字段
        let valueStr = item.value
        if (dF[item.seriesName]) {
          valueStr = format(dF[item.seriesName], valueStr)
        } else if (/^\d+日均线$/.test(item.seriesName)) {
          valueStr = fmtInteger(valueStr)
        }
        tmpl.push(`<span style="color: ${item.color}; font-size: 14px; line-height: 150%">${item.seriesName} : ${valueStr}</span>`)
      }
    })
    return tmpl.join('<br>')
  }
  return options
}

// 转换原始数据
const _dataProcess = (data, indicators) => {
  const dimsData = DataUtils.pluckDimsData(data, indicators)
  const numsData = DataUtils.pluckNumsData(data, indicators)
  return { ...dimsData, ...numsData }
}

// 转换K线图专用数据
const _convertCandlestickData = (nums, indicatorNums = []) => {
  // 只取前4个数值
  const data = indicatorNums.slice(0, 4).map((item) => {
    const alias = item.alias || item.alias_name || item.col_name
    return nums[alias]
  })
  const lineData = []
  if (indicatorNums.length === 5) {
    const item = indicatorNums[4]
    const alias = item.alias || item.alias_name || item.col_name
    lineData.push(...nums[alias])
  }
  return {
    candlestick: _.zip(...data),
    line: lineData
  }
}

// 计算日均线
const calculateMA = (data, dayCount) => {
  const result = []
  for (let i = 0, len = data.length; i < len; i++) {
    if (i < dayCount - 1) {
      result.push('-')
      continue
    }
    let sum = 0
    for (let j = 0; j < dayCount; j++) {
      sum += data[i - j][1]
    }
    
    result.push(sum / dayCount)
  }
  return result
}

class Candlestick extends React.Component {
  static propTypes = {
    designTime: PropTypes.bool,    // 设计时(编辑区)
    data: PropTypes.object,        // 数据集返回的数据
    currentRelatedChartId: PropTypes.string,
    chartId: PropTypes.string,
    config: PropTypes.object,      // 样式配置数据
    events: PropTypes.object,      // 可触发的事件
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
    isHidden: PropTypes.bool,      // 是否隐藏
    platform: PropTypes.string     // 显示方式pc or mobile
  };

  constructor(props) {
    super(props)
    this.seriesTmpl = {
      cursor: 'auto',
      name: 'K线',
      type: 'candlestick',
      data: [320, 332, 301, 334, 390, 330, 320]
    }
  }

  componentDidMount() {
    const { data } = this.props
    if (data) this.runDrawGraph()
  }

  componentDidUpdate(preProps) {
    const { data, scale, config, layer, isHidden } = this.props
    if ((data && !_.isEqual(data, preProps.data)) || !_.isEqual(config, preProps.config) || scale !== preProps.scale) {
      this.runDrawGraph(scale !== preProps.scale)
      this.resizeChart()
    }

    if (layer.h !== preProps.layer.h || layer.w !== preProps.layer.w || isHidden !== preProps.isHidden) {
      this.resizeChart()
    }
  }

  componentWillUnmount() {
    this.validConnect = true
    this.hasBindClickEvent = false
    if (this.graph) {
      this.graph.dispose()
    }
  }

  render() {
    return <div className="graph-inner-box">
      <div className="graph-inner-box-wrap" ref={(node) => { this.graphNode = node }}></div>
    </div>
  }

  resizeChart() {
    if (this.graph) {
      this.graph.resize()
    }
  }

  runDrawGraph(reInit) {
    const { scale, config, platform } = this.props
    const { data, indicators, marklines } = this.props.data || {}

    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, getEchartRenderer(platform))
      if (platform !== 'mobile') {
        scaleChart(this.graph, scale)
      }
    }
    const dataOrigin = _dataProcess(data, indicators)
    const { primaryNum, numsDisplayFormat } = dataOrigin
    let options = this.getOptions(dataOrigin)
    options = _tooltip(options, dataOrigin, indicators)
    // 辅助线
    if (marklines && marklines.length > 0) {
      const markerData = {
        data: marklines,
        y: config.y.markline
      }
      options = applyOptionMarkline(options, markerData, false, numsDisplayFormat[primaryNum])
    }
    this.graph.setOption(options, true)
  }

  getOptions(dataOrigin) {
    const { config } = this.props
    const { global, x, y, theme, legend } = config
    const { primaryNum, numsDisplayFormat } = dataOrigin
    const chartData = this._convertData(dataOrigin)
    const options = {
      // x轴, 第一个为数据轴, 第二个为背景轴
      xAxis: [{
        type: 'category',
        data: chartData.axis,
        axisLine: {
          lineStyle: {
            color: '#79A1D0',
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {}
      }],
      yAxis: [{
        type: 'value',
        axisTick: {
          show: false
        },
        axisLine: {},
        axisLabel: {
          formatter: value => formatDisplay(value, numsDisplayFormat[primaryNum])
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: 'rgba(73, 143, 225, 0.08)'
          }
        }
      }],
      dataZoom: [
        {
          type: 'inside',
          start: 50,
          end: 100
        },
        {
          show: true,
          type: 'slider',
          dataBackground: {
            lineStyle: {
              color: '#FFFFFF'
            },
            areaStyle: {
              color: '#FFFFFF',
              opacity: 0.18
            }
          },
          textStyle: {
            color: '#FFFFFF'
          },
          borderColor: 'rgba(255,255,255,.8)',
          start: 50,
          end: 100
        }
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      grid: {
        containLabel: true,
        top: global.padding.grid.top,
        right: global.padding.grid.right,
        bottom: global.padding.grid.bottom,
        left: global.padding.grid.left
      },
      legend: _getLegendOption(chartData.legend, legend),
      series: chartData.series
    }
    // x轴设置
    // 轴线
    _.set(options.xAxis[0].axisLine, 'show', x.axis.show)
    _.set(options.xAxis[0].axisTick, 'show', x.axis.show)
    _.set(options.xAxis[0].axisLine, 'lineStyle.color', x.axis.color)
    // 轴标签
    _.set(options.xAxis[0].axisLabel, 'show', x.label.show)
    _.set(options.xAxis[0].axisLabel, 'fontSize', x.label.fontSize)
    _.set(options.xAxis[0].axisLabel, 'color', x.label.color)
    // 轴标签是否显示全部
    _.set(options.xAxis[0].axisLabel, 'interval', x.label.showAll ? 0 : 'auto')
    // 轴标签角度
    const rotateAngle = _getAxisLabelRotateAngle(x.label.angle, 'x')
    if (rotateAngle !== null) {
      _.set(options.xAxis[0].axisLabel, 'rotate', rotateAngle);
    }
    // y轴设置
    // 轴线
    _.set(options.yAxis[0].axisLine, 'show', y.axis.show)
    _.set(options.yAxis[0].axisTick, 'show', y.axis.show)
    _.set(options.yAxis[0].axisLine, 'lineStyle.color', y.axis.color)
    // 轴标签
    _.set(options.yAxis[0].axisLabel, 'show', y.label.show)
    _.set(options.yAxis[0].axisLabel, 'fontSize', y.label.fontSize)
    _.set(options.yAxis[0].axisLabel, 'color', y.label.color)
    // 轴标签角度
    const rotateAngleY = _getAxisLabelRotateAngle(y.label.angle, 'y')
    if (rotateAngleY !== null) {
      _.set(options.yAxis[0].axisLabel, 'rotate', rotateAngleY);
    }

    // 设置K线颜色
    _.set(options.series, '0.itemStyle', {
      normal: {
        color: theme.upColor,
        color0: theme.downColor,
        borderColor: theme.upBorderColor,
        borderColor0: theme.downBorderColor
      }
    })

    return options
  }

  _convertData(dataOrigin) {
    const { seriesTmpl } = this
    const { dims, nums } = dataOrigin
    const { indicators } = this.props.data || {}
    const { global } = this.props.config
    const series = []
    const legend = ['K线']
    const axis = _.values(dims)[0]
    // 获得基本数据
    const baseData = _convertCandlestickData(nums, indicators.nums)
    // 组织K线图series
    const _series = Object.assign({}, seriesTmpl)
    _series.data = baseData.candlestick
    series.push(_series)
    // 均线配置
    if (_.get(global, 'movingAverage.show', false)) {
      const { lineStyle, lineWidth, circleWidth, lines } = global.movingAverage
      if (Array.isArray(lines) && lines.length > 0) {
        lines.forEach((line) => {
          const _maSeries = {
            name: line.name,
            type: 'line',
            data: calculateMA(_series.data, line.dayCount),
            smooth: true,
            symbolSize: circleWidth,
            itemStyle: {
              // 用于tooltip获得颜色
              color: line.color
            },
            lineStyle: {
              type: lineStyle,
              width: lineWidth,
              color: line.color,
              opacity: 1
            }
          }
          legend.push(line.name)
          series.push(_maSeries)
        })
      }
    }
    // 自定义字段展示（如果有第5个数值字段）
    if (baseData.line.length > 0) {
      const lineItem = indicators.nums[4]
      const lineName = lineItem.alias || lineItem.alias_name || lineItem.col_name
      const { lineSmooth, lineStyle, lineWidth, circleWidth, color } = global.lineConfig
      const lineSeries = {
        name: lineName,
        type: 'line',
        data: baseData.line,
        smooth: lineSmooth,
        symbolSize: circleWidth,
        itemStyle: {
          // 用于tooltip获得颜色
          color
        },
        lineStyle: {
          type: lineStyle,
          width: lineWidth,
          opacity: 1,
          color
        }
      }
      legend.push(lineName)
      series.push(lineSeries)
    }

    return {
      axis,
      series,
      legend,
      maxV: 0
    }
  }
}

export default Connect()(Candlestick)
