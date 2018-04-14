import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import echarts from 'echarts'
import { Connect, Utils } from 'dmp-chart-sdk'

import './style.less'

const { DataUtils, scaleChart, formatDisplay, Theme, applyOptionMarkline, getEchartRenderer } = Utils

const { getEchartColorFromTheme } = Theme

// 获取所有值的最大值, 用来设置背景色柱子 等等
const __getNumsMax = (nums, stack) => {
  const keys = Object.keys(nums)
  if (keys.length === 0) {
    return
  }

  const key = keys[0]
  const data0 = nums[key]
  let maxV = -Infinity
  if (stack) {
    for (let i = 0; i < data0.length; i++) {
      const sumV = keys.reduce((pre, k) => (pre + (Number.isNaN(nums[k][i]) ? 0 : nums[k][i])), 0)
      maxV = Math.max(maxV, sumV)
    }
  } else {
    for (let i = 0; i < data0.length; i++) {
      const allV = []
      keys.forEach((k) => {
        const v = +nums[k][i]
        if (!Number.isNaN(v)) {
          allV.push(v)
        }
      })
      maxV = Math.max(maxV, Math.max.apply(null, allV))
    }
  }
  return maxV
}
// 设置 图例
// affect: 是否按数值配色方案
const _getLegendOption = (data, legendConfig, affect) => {
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
  // 按维度着色时不限时图例
  if (affect) {
    o.show = false
  }
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
// 应用配色方案
const _attachColorStyle = (sery, colorTheme, seryIndex, seriesLen, relatedIndex = -1/*联动的序号*/) => {
  const color = getEchartColorFromTheme(echarts, colorTheme, seryIndex, 0)
  // 设置series的颜色, legend要使用
  _.set(sery, 'itemStyle.normal.color', color)
  // 设置data 的每一个颜色
  if (Array.isArray(sery.data)) {
    // 柱状图的颜色可以支持多数值, 颜色设置为顺序排列获取
    sery.data.forEach((s, i) => {
      let c
      // 存在联动(i===relatedIndex) 或者 没有联动
      if (i === relatedIndex || relatedIndex <= -1) {
        c = +colorTheme.affect === 1 ? getEchartColorFromTheme(echarts, colorTheme, (seriesLen * i) + seryIndex, 0) : color
      } else {
        c = '#666'
      }
      _.set(s, 'itemStyle.normal.color', c)
    })
  }
  return sery
}

const _gC = (color) => {
  //渐变
  if (typeof color === 'object') {
    return color.colorStops[0].color
  }
  return color
}
// 应用tooltip
const _tooltip = function (options, dataOrigin) {
  const { numsDisplayFormat, /* dimsForRelated,  */zaxisDisplayFormat, desireDisplayFormat } = dataOrigin || {}
  const dF = numsDisplayFormat || {}
  const dFZaxis = zaxisDisplayFormat || {}
  const dFDesire = desireDisplayFormat || {}
  const format = function (_dF, value) {
    return `${formatDisplay(value, _dF)}${(_dF && _dF.column_unit_name && _dF.column_unit_name) || ''}`
  }
  const formatZaxis = function (_dFZaxis, value) {
    return `${formatDisplay(value, _dFZaxis)}${(_dFZaxis && _dFZaxis.column_unit_name && _dFZaxis.column_unit_name) || ''}`
  }
  const formatDesire = function (_dFDesire, value) {
    return `${formatDisplay(value, _dFDesire)}${(_dFDesire && _dFDesire.column_unit_name && _dFDesire.column_unit_name) || ''}`
  }
  options.tooltip.backgroundColor = '#22325d'
  options.tooltip.extraCssText = 'box-shadow: 2px 2px 8px #141E39;max-height: 450px;overflow-y:auto; transform: translateZ(1px);'
  options.tooltip.enterable = true
  options.tooltip.hideDelay = 500
  options.tooltip.formatter = function (data) {
    const titleColor = '#fff'
    const tmpl = []
    data.forEach((item, index) => {
      if (index === 0 && !!item.name) {
        tmpl.push(`<span style="color: ${titleColor}; font-size: 14px; line-height: 150%">${item.name}</span>`)
      }
      let valueStr = item.value
      if (dF[item.seriesName]) {
        valueStr = format(dF[item.seriesName], valueStr)
      } else if (dFZaxis[item.seriesName]) {
        valueStr = formatZaxis(dFZaxis[item.seriesName], valueStr)
      } else if (dFDesire[item.seriesName]) {
        valueStr = formatDesire(dFDesire[item.seriesName], valueStr)
      }
      // 去掉背景色tooltip
      if (item.seriesName !== '_background_') {
        tmpl.push(`<span style="font-size: 10px; color: ${_gC(item.color)}">${item.seriesName}: ${valueStr}</span>`)
      }
    })
    return tmpl.join('<br>')
  }
  return options
}

//获取desire数据
const getDataField = obj => (
  obj.formula_mode ? `desire_${obj.formula_mode}_${obj.col_name}` : `desire_${obj.col_name}`
)

const getDataAlias = obj => (
  obj.alias || obj.alias_name || obj.col_name
)

// 转换原始数据
const _dataProcess = (data, indicators) => {
  const dimsData = DataUtils.pluckDimsData(data, indicators)

  const numsData = DataUtils.pluckNumsData(data, indicators)

  const zaxisData = DataUtils.pluckZaxisData(data, indicators)

  const desireData = {}
  const desireDisplayFormat = {}
  indicators.desires.forEach((axis) => {
    const value = []
    const field = getDataField(axis)
    const key = `${getDataAlias(axis)}(目标值)`
    data.forEach((_data) => {
      value.push(_data[field])
    })

    desireData[key] = value
    desireDisplayFormat[key] = axis.display_format
  })
  return { ...dimsData, ...numsData, ...zaxisData, desire: { ...desireData }, desireDisplayFormat: { ...desireDisplayFormat } }
}

class ClusterColumn extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  static propTypes = {
    designTime: PropTypes.bool,    // 设计时(编辑区)
    data: PropTypes.object,        // 数据集返回的数据
    currentRelatedChartId: PropTypes.string,
    chartId: PropTypes.string,
    config: PropTypes.object,      // 样式配置数据
    events: PropTypes.object,      // 可触发的事件
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
    through: PropTypes.bool,       // 是否设置穿透
    throughList: PropTypes.array,  // 穿透图层列表
    isHidden: PropTypes.bool,      // 是否隐藏
    platform: PropTypes.string     // 显示方式pc or mobile
  }

  constructor(props) {
    super(props)
    this.seriesTmpl = {
      cursor: 'auto',
      name: '直接访问',
      type: 'bar',
      data: [320, 332, 301, 334, 390, 330, 320]
    }
    // const { data, indicators } = props.data || {}
    // this.state = {
    //   data: {
    //     ..._dataProcess(data, indicators)
    //   }
    // }

    this.connectStore = {
      currentName: {},
      chartRelated: false
    }
    this.validConnect = true
    this.hasBindClickEvent = false
  }

  componentDidMount() {
    const { data } = this.props
    if (data) this.runDrawGraph()
  }

  componentDidUpdate(preProps) {
    const { data, scale, config, through, throughList, layer, isHidden } = this.props
    // 旧
    const pre = {
      scale: preProps.scale,
      config: preProps.config,
      through: preProps.through,
      throughList: preProps.throughList
    }
    // 新
    const curr = { scale, config, through, throughList }
    // 需要更新图的情况
    if ((data && !_.isEqual(data, preProps.data)) || !_.isEqual(pre, curr)) {
      this.runDrawGraph(scale !== preProps.scale)
      this.resizeChart()
    }
    // 仅尺寸发生了变化 需要resize的情况
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

  bindEvents() {
    const { through, throughList, events, designTime, data } = this.props
    this.graph.off('click')
    this.graph.off('legendselectchanged')

    if (through) {
      const graphThroughEvent = (arg) => {
        if (!designTime && arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if (arg.componentType === 'markLine' || !through) {
          return;
        }
        events.onPenetrateQuery('cluster_column', arg)
      }
      this.graph.on('click', graphThroughEvent)
    } else if (!designTime && (!Array.isArray(throughList) || throughList.length === 0)) {
      // 绑定点击事件
      const graphConnectClickEvent = (arg) => {
        if (arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if (arg.componentType !== 'markLine' && this.validConnect) {
          this._handleFilter(arg)
        }
      }
      if (!this.hasBindClickEvent) {
        this.graph.on('click', graphConnectClickEvent)
      }
    }

    // 点击legend的时候需要适配背景
    if (data.indicators && data.indicators.desires && data.indicators.desires.length === 0) {
      this.graph.on('legendselectchanged', (params) => {
        const keys = Object.keys(params.selected)
        let length = 0
        keys.forEach((key) => {
          if (params.selected[key]) {
            length++
          }
        })
        const options = this.graph.getOption()
        const { series } = options
        // 判断是删除 还是 添加
        if (keys.length + length > series.length) {
          series.push(series[series.length - 1])
          // 至少保留一个背景的数据, 否则有bug
        } else if (series.length - keys.length > 1) {
          series.pop()
        }
        this.graph.setOption(options, true)
      })
    }
  }

  runDrawGraph(reInit) {
    const { scale, config, through, chartId, currentRelatedChartId, platform } = this.props
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
    if (through || (!currentRelatedChartId || currentRelatedChartId === chartId)) {
      this.seriesTmpl.cursor = 'pointer';
    }
    const { primaryNum, numsDisplayFormat } = dataOrigin
    let options = this.getOptions(dataOrigin)
    options = _tooltip(options, dataOrigin)
    // 辅助线
    if (_.get(marklines, 'length') > 0) {
      const markerData = {
        data: marklines,
        y: config.y.markline
      }
      options = applyOptionMarkline(options, markerData, false, numsDisplayFormat[primaryNum])
    }
    this.graph.setOption(options, true)
    this.bindEvents()
  }

  getOptions(dataOrigin) {
    const { config, data } = this.props
    const { legend, theme, x, y, global, zaxisConfig } = config
    const { zaxisLabel, zaxisLine } = zaxisConfig
    const { primaryNum, numsDisplayFormat, primaryAxis, zaxisDisplayFormat } = dataOrigin
    const { indicators } = data
    // 存在次轴
    const hasZaxis = primaryAxis && zaxisDisplayFormat
    let chartData = this._convertData(dataOrigin)
    chartData = this._applyColorStyle(chartData)
    // console.log(chartData, 8888888888)
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
      }, {
        type: 'category',
        data: chartData.axis,
        position: 'bottom',
        show: true,
        nameGap: 0,
        axisLine: {
          show: false,
          symbolSize: [0, 0]
        },
        axisLabel: {
          show: false,
          margin: 0,
          fontSize: 0,
          width: 0,
          height: 0,
          lineHeight: 0
        },
        axisTick: {
          show: false,
          length: 0
        },
        silent: true
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
      tooltip: {
        trigger: 'axis',
        confine: false,
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        containLabel: true,
        top: global.padding.grid.top,
        right: global.padding.grid.right,
        bottom: global.padding.grid.bottom,
        left: global.padding.grid.left
      },
      legend: _getLegendOption(chartData.legend, legend, theme.colorTheme.affect),
      series: chartData.series
    }
    // 如果存在次轴设置, 则添加yAxis
    if (hasZaxis) {
      const zAxis = {
        type: 'value',
        axisTick: {
          show: false
        },
        axisLine: {},
        axisLabel: {
          formatter: value => formatDisplay(value, zaxisDisplayFormat[primaryAxis])
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: 'rgba(73, 143, 225, 0.08)'
          }
        }
      }
      options.yAxis.push(zAxis)
    }
    //如果不存在目标值则设置最大值
    if (!indicators.desires || indicators.desires.length === 0) {
      options.yAxis[0].max = chartData.maxV
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
    if (hasZaxis) {
      _.set(options.yAxis[1].axisLine, 'show', zaxisLine.show)
      _.set(options.yAxis[1].axisTick, 'show', zaxisLine.show)
      _.set(options.yAxis[1].axisLine, 'lineStyle.color', zaxisLine.color)
      // 轴标签
      _.set(options.yAxis[1].axisLabel, 'show', zaxisLabel.show)
      _.set(options.yAxis[1].axisLabel, 'fontSize', zaxisLabel.fontSize)
      _.set(options.yAxis[1].axisLabel, 'color', zaxisLabel.color)
      // 轴标签角度
      const rotateAngleZaxis = _getAxisLabelRotateAngle(zaxisLabel.angle, 'y')
      if (rotateAngleZaxis !== null) {
        _.set(options.yAxis[1].axisLabel, 'rotate', rotateAngleZaxis);
      }
    }
    // 轴标签角度
    const rotateAngleY = _getAxisLabelRotateAngle(y.label.angle, 'y')
    if (rotateAngleY !== null) {
      _.set(options.yAxis[0].axisLabel, 'rotate', rotateAngleY);
    }

    return options
  }

  _convertData(dataOrigin) {
    const { data, config } = this.props
    const { global, zaxisConfig } = config
    const { seriesTmpl } = this
    const { dims, nums, zaxis, desire, numsDisplayFormat, primaryNum, primaryAxis, zaxisDisplayFormat } = dataOrigin
    const { indicators } = data
    const { colorTheme } = config.theme
    const dimsInList = Object.entries(dims)
    const numKeys = _.keys(nums)
    const zaxisKeys = _.keys(zaxis)
    const legend = []
    const series = []
    const axis = []
    const { barStyle, barLabel } = global
    const { zaxisStyle, zaxiValueLabel } = zaxisConfig || {}
    numKeys.forEach((item) => {
      legend.push(item)
      const _series = Object.assign({}, seriesTmpl)
      _series.name = item
      _series.data = nums[item].map(value => ({ value: DataUtils.noValueFormatter(value) }))
      //设置间距
      _series.barCategoryGap = `${barStyle.distance * 100}%`
      nums[item].forEach((d, key) => {
        const _axis = []
        dimsInList.forEach((dim) => {
          _axis.push(dim[1][key])
        })

        if (_.findIndex(axis, x => x === _axis.join('&')) === -1) {
          axis.push(_axis.join('&'))
        }
      })
      series.push(_series)
    })
    const dataLen = series.length  //记录不包含 背景色的柱子
    const chartCode = _.get(indicators, 'zaxis[0].chart_code', '') || ''
    //如果存在次轴
    if (primaryAxis && zaxisDisplayFormat) {
      zaxisKeys.forEach((item, i) => {
        legend.push(item)
        let _series = Object.assign({}, { cursor: 'auto', name: '', type: chartCode, data: [], yAxisIndex: 1 })
        //柱状图、折线图
        if (chartCode === 'line' || chartCode === 'area') {
          _series = Object.assign({}, { cursor: 'auto', name: '', type: 'line', data: [], yAxisIndex: 1 })
          _.set(_series, 'lineStyle.normal.type', zaxisStyle.lineType)
          _.set(_series, 'lineStyle.normal.width', zaxisStyle.lineWidth)
          _.set(_series, 'symbolSize', zaxisStyle.circleWidth * 2)
          _.set(_series, 'showAllSymbol', true)
          _.set(_series, 'symbol', 'circle')
          _.set(_series, 'smooth', zaxisStyle.lineSmooth)
          if (chartCode === 'area') {
            const color = getEchartColorFromTheme(echarts, colorTheme, dataLen + i, 0)
            _.set(_series, 'areaStyle.normal.color', color)
            _.set(_series, 'areaStyle.normal.opacity', 0.8)
            _.set(_series, 'z', -1)
          }
        }
        _series.name = item
        _series.data = zaxis[item].map(value => ({ value: DataUtils.noValueFormatter(value) }))
        //设置值标签
        if (zaxiValueLabel.show) {
          _series.label = {
            rotate: 0,
            distance: zaxiValueLabel.distance,
            position: 'top',
            show: true,
            fontSize: parseInt(zaxiValueLabel.fontSize, 10),
            color: zaxiValueLabel.color,
            formatter: params => formatDisplay(params.value, zaxisDisplayFormat[primaryAxis], true)
          }
        }
        series.push(_series)
      })
    }
    const maxV = __getNumsMax(nums, false)
    //如果存在目标值
    if (desire && indicators.desires.length > 0) {
      const desireKeys = _.keys(desire)
      const barCategoryGap = (barStyle.distance * 100) - 30
      const value = barCategoryGap >= 0 ? barCategoryGap : 0
      desireKeys.forEach((item) => {
        const _series = Object.assign({}, {
          cursor: 'auto',
          name: '',
          type: 'bar',
          data: [],
          z: -1,
          xAxisIndex: 1,
          itemStyle: {
            normal: {
              color: barStyle.background
            }
          },
          barCategoryGap: `${value}%`
        })
        _series.name = item

        _series.data = desire[item].map(_value => ({ value: DataUtils.noValueFormatter(_value) }))
        series.push(_series)
      })
    } else if (maxV > -Infinity) {
      // 添加模拟背景色柱子
      const backgroundSery = {
        name: '_background_',    // 这个名字不能改, 在tooltip中需要标识
        type: 'bar',
        xAxisIndex: 1,
        z: -1,
        itemStyle: {
          normal: {
            color: barStyle.background
          }
        },
        barCategoryGap: `${barStyle.distance * 100}%`,
        data: _.fill(Array(nums[numKeys[0]].length), maxV)
      }
      numKeys.forEach(() => {
        series.push(backgroundSery)
      })
      if (chartCode === 'bar') {
        zaxisKeys.forEach(() => {
          series.push(backgroundSery)
        })
      }
    }
    // 值标签
    series.forEach((item, i) => {
      if (i < dataLen) {
        if (barLabel.show) {
          item.label = {
            rotate: 0,
            distance: barLabel.distance,
            position: 'top',
            show: true,
            fontSize: parseInt(barLabel.fontSize, 10),
            color: barLabel.color,
            formatter: params => formatDisplay(params.value, numsDisplayFormat[primaryNum], true)
          }
        } else {
          _.set(item, 'label.show', false)
        }
      }
    })

    return {
      legend,
      axis,
      series,
      maxV
    }
  }

  _applyColorStyle(chartData) {
    const { series, axis, legend } = chartData
    const { colorTheme } = this.props.config.theme
    // 联动
    let relatedIndex = -1
    if (this.connectStore.chartRelated) {
      relatedIndex = axis.indexOf(this.connectStore.currentName.name)
    }
    // 因为series的背景柱子不应该设置colorTheme
    const lastIndex = legend.length - 1
    series.forEach((sery, i) => {
      if (i <= lastIndex) {
        colorTheme && _attachColorStyle(sery, colorTheme, i, lastIndex + 1, relatedIndex)
      }
    })
    return chartData
  }

  //跳转页面 col_value可能是string 可能是对象
  handleReportRedirect(config, col_value) {
    const { protocol, host } = window.location
    const colValues = {}
    const filterIds = []
    //isHref 是url直接跳转标识
    const callback = (url, isHref) => {
      if (isHref && url) {
        if (config.direct_way === 2) {
          window.open(url, '_blank')
        } else {
          window.location.href = url
        }
      } else if (config.direct_way === 2 && url) {
        window.open(`${protocol}//${host}${url}`, '_blank')
      } else if (url && config.direct_way === 1) {
        if (this.props.platform === 'mobile') {
          this.context.router.push(url)
        } else {
          this.context.router.replace(url)
        }
      }
    }
    if (config.related_dims && config.related_dims.length > 0 && typeof col_value === 'object') {
      config.related_dims.forEach((dim) => {
        const value = col_value[dim.chart_alias]
        if (value) {
          colValues[dim.dashboard_filter_id] = value
          filterIds.push(dim.dashboard_filter_id)
        }
      })
      config.dashboard_filter_id = filterIds
      Utils.generateReportRedirectUrl(config, colValues, this.props.dashboardName, callback)
    } else {
      Utils.generateReportRedirectUrl(config, col_value, this.props.dashboardName, callback)
    }
  }

  // 操作值变化, 联动、跳转
  _handleFilter(params) {
    const { chartRelated, currentName } = this.connectStore
    const { chartId, currentRelatedChartId, events } = this.props
    const { indicators, data } = this.props.data
    const { dims, nums } = indicators
    const { dimsReportRedirect, numsReportRedirect } = _dataProcess(data, indicators)
    const conditions = []
    let hasReportRedirect = false
    const dimKeys = []
    console.log(params, numsReportRedirect)
    //跳转优先级高于联动, 维度跳转优先级高于数值跳转
    //情况一维度数不为0
    if (dims && dims.length > 0) {
      dims.forEach((dim, index) => {
        const key = dim.alias || dim.alias_name || dim.col_name
        const reportObj = dimsReportRedirect[key]
        dimKeys.push(key)
        if (reportObj && !hasReportRedirect && reportObj.isOpen) {
          const keys = params.name.split('&')
          this.handleReportRedirect(reportObj, keys[index])
          hasReportRedirect = true
        }
      })
      nums.forEach((num) => {
        const key = num.alias || num.alias_name || num.col_name
        const reportObj = numsReportRedirect[key]
        if (reportObj && !hasReportRedirect && reportObj.isOpen) {
          const keys = params.name.split('&')
          //把params的值跟维度别名关联起来
          const keysArr = {}
          keys.forEach((k, i) => {
            keysArr[dimKeys[i]] = k
          })
          this.handleReportRedirect(reportObj, keysArr)
          hasReportRedirect = true
        }
      })
    } else {
      //情况二 无维度
      const key = params.seriesName
      const reportObj = numsReportRedirect[key]
      if (reportObj && !hasReportRedirect && reportObj.isOpen) {
        this.handleReportRedirect(reportObj, params.name)
        hasReportRedirect = true
      }
    }
    if (hasReportRedirect) return
  
    //如果当前数据集筛选中currentId为空 或者Id等于currentId就进行逻辑
    //2017-08-23 新增如果没有维度 则不联动的限制
    if ((!currentRelatedChartId || currentRelatedChartId === chartId) && dims && dims.length > 0) {
      this.hasBindClickEvent = true;
      this.validConnect = false;
      if (chartRelated && params.name === currentName.name) {
        this.connectStore = {
          currentName: {},
          chartRelated: false
        }
      } else {
        //拆分name 获得condition_value
        const valueArr = params.name.split('&')

        valueArr.forEach((item, index) => {
          let condition = {}
          // 拼接conditions
          if (dims[index]) {
            condition = { ...condition, col_value: item, col_name: dims[index].col_name, dim: dims[index], operator: '=' }
            conditions.push(condition)
          }
        })
        this.connectStore = {
          currentName: params,
          chartRelated: true
        }
      }
      if (events.onRelateChart) {
        events.onRelateChart(conditions, chartId, () => {
          this.hasBindClickEvent = false
          this.validConnect = true
          this.bindEvents()
        })
      }
    }
  }
}

export default Connect()(ClusterColumn)
