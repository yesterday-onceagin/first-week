import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'
import _ from 'lodash'

import { Connect, Utils } from 'dmp-chart-sdk'

const { DataUtils } = Utils

// 转换面积图数据
const _dataProcess = (data, indicators) => {
  let primaryNum = ''
  const dimsData = DataUtils.pluckDimsData(data, indicators)
  const numsData = DataUtils.pluckNumsData(data, indicators, (hookData, num, index) => {
    if (index === 0) {
      primaryNum = hookData.key
    }
    return hookData
  })

  return { ...dimsData, ...numsData, primaryNum }
}

const _transformAreaData = (data, indicators) => {
  data.forEach((item) => {
    Object.keys(item).map((key) => {
      if (item[key] == null) {
        item[key] = '-'
      }
    })
  })

  const { dims, nums, numsDisplayFormat, primaryNum } = _dataProcess(data, indicators);

  let xAxis = []
  Object.keys(dims).map((dim) => {
    xAxis = dims[dim]
  })

  return {
    xAxis,
    series: nums,
    displayFormat: numsDisplayFormat,
    primaryNum,
    dimsForRelated: indicators.dims[0]
  }
}

// 应用配色方案
const _attachColorStyle = function (sery, colorTheme, seryIndex) {
  const color = Utils.Theme.getEchartColorFromTheme(echarts, colorTheme, seryIndex, 0)
  _.set(sery, 'symbol', 'circle')
  _.set(sery, 'lineStyle.normal.color', color)
  _.set(sery, 'areaStyle.normal.color', color)
  _.set(sery, 'areaStyle.normal.opacity', 0.8)
  _.set(sery, 'itemStyle.normal.color', color)
  return sery
}

// 应用折线样式
const _attachLineStyle = function (series, lineStyle) {
  _.set(series, 'lineStyle.normal.type', lineStyle && lineStyle.lineBorder && lineStyle.lineBorder.borderStyle)
  _.set(series, 'lineStyle.normal.width', lineStyle && lineStyle.lineBorder && lineStyle.lineBorder.borderWidth)
  _.set(series, 'symbolSize', lineStyle && lineStyle.radius && (lineStyle.radius * 2))
  _.set(series, 'smooth', lineStyle && lineStyle.lineSmooth)
}

// 应用标签值样式
export function _attachLabelValueStyle(series, lineLabel, df) {
  if (lineLabel) {
    const { fontSize, distance, show } = lineLabel
    _.set(series, 'label.normal.show', show)
    _.set(series, 'label.normal.distance', distance)
    _.set(series, 'label.normal.fontSize', fontSize)
    _.set(series, 'label.normal.rotate', 0)
    series.label.normal.formatter = (params) => {
      return Utils.formatDisplay(params.value, df[params.seriesName])
    }
    // fix 渐变色 label颜色变成黑色的bug
    if (series.itemStyle && series.itemStyle.normal.color && series.itemStyle.normal.color.colorStops) {
      _.set(series, 'label.normal.color', series.itemStyle.normal.color.colorStops[0].color)
    }
  }
}

// 获取轴标签的旋转角度
export function _getAxisLabelRotateAngle(angle, axisType = 'x') {
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

// 图表提示框
const _gC = function (color) {
  if (typeof color === 'object') {
    return color.colorStops[0].color
  }
  return color
}

const _format = function (dF, value) {
  return `${Utils.formatDisplay(value, dF)}${(dF && dF.column_unit_name && dF.column_unit_name) || ''}`
}

const _tooltip = (options, dataOrigin) => {
  const { displayFormat } = dataOrigin || {}
  const dF = displayFormat || {}

  const defaultTooltip = window.DEFAULT_ECHARTS_OPTIONS.tooltip

  // 调整显示 toottip
  options.tooltip.backgroundColor = defaultTooltip.backgroundColor;
  options.tooltip.extraCssText = defaultTooltip.extraCssText;
  options.tooltip.enterable = true
  options.tooltip.hideDelay = 500

  const { titleColor } = defaultTooltip
  const titleFS = '14px'
  const valueFS = '10px'

  options.tooltip.formatter = (data) => {
    if (data && data.componentType === 'markLine') {
      return `<span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${data.name}</span>`
    }

    const tmpl = []
    data.forEach((item, index) => {
      if (index === 0 && !!item.name) {
        tmpl.push(`<span style="color: ${titleColor}; font-size: ${titleFS}; line-height: 150%">${item.name}</span>`)
      }
      let valueStr = item.value
      const _dF = dF[item.seriesName]
      valueStr = _format(_dF, valueStr)

      // 去掉背景色tooltip
      if (item.seriesName !== '_background_') {
        tmpl.push(`<span style="font-size: ${valueFS}; color: ${_gC(item.color)}">${item.seriesName}: ${valueStr}</span>`)
      }
    })
    return tmpl.join('<br>')
  }

  return options
}

class Area extends React.Component {
  static propTypes = {
    designTime: PropTypes.bool,    // 设计时(编辑区)
    data: PropTypes.object,        // 数据集返回的数据
    config: PropTypes.object,      // 样式配置数据
    events: PropTypes.object,      // 可触发的事件
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
  }

  constructor(props) {
    super(props)
    const { data, indicators } = props.data || {}
    this.state = {
      data: _transformAreaData(data, indicators),
      seriesTmpl: {
        name: '联盟广告',
        type: 'line',
        cursor: 'auto',
        data: [220, 182, 191, 234, 290, 330, 310]
      }
    }
    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    // 暴露的static 方法
    this.getChart = () => this.graph
    this.connectStore = {
      currentName: {}, //缓存选中的区域
      chartRelated: false  //是否已触发联动
    }
  }

  componentDidMount() {
    const { data } = this.state
    if (data) {
      this.runDrawGraph();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        data: _transformAreaData(nextProps.data.data, nextProps.data.indicators)
      })
    }

    if (nextProps.clearRelated || nextProps.chartId !== this.props.chartId) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
        chartRelated: false
      }
    }
  }

  shouldComponentUpdate(nextProps) {
    const { chartUuid, config, layerToolboxShow } = this.props
    return !_.isEqual(chartUuid, nextProps.chartUuid)
      || nextProps.layerToolboxShow !== layerToolboxShow
      || (nextProps.config && !_.isEqual(nextProps.config, config))
  }

  componentDidUpdate(preProps) {
    const { scale } = this.props
    const { data } = this.state
    if (data) {
      this.runDrawGraph(scale !== preProps.scale)
    }
  }

  componentWillUnmount() {
    this.validConnect = true  // 联动是否有效
    this.hasBindClickEvent = false // 是否绑定事件
    if (this.graph) {
      this.graph.dispose()
    }
  }

  render() {
    return <div className="graph-inner-box">
      <div className="graph-inner-box-wrap" ref={(node) => { this.graphNode = node }}></div>
    </div>
  }

  runDrawGraph(reInit) {
    const { data, seriesTmpl } = this.state
    const { scale, currentRelatedChartId, chartId, through, config, platform } = this.props
    const { marklines } = this.props.data || {}

    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, Utils.getEchartRenderer(platform))
      if (platform !== 'mobile') {
        Utils.scaleChart(this.graph, scale)
      }
    }


    if (through || (!currentRelatedChartId || currentRelatedChartId === chartId)) {
      seriesTmpl.cursor = 'pointer';
    }

    const { displayFormat, primaryNum } = data
    let options = this.getOptions()
    options = _tooltip(options, data)

    // 辅助线
    if (marklines && marklines.length > 0) {
      const markerData = {
        data: marklines,
        y: config.y.markline
      }
      options = Utils.applyOptionMarkline(options, markerData, false, displayFormat[primaryNum])
    }

    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
    this.bindEvents()
  }

  bindEvents() {
    const { events, through, throughList, designTime } = this.props
    this.graph.off('click')
    if (through) {
      this.graph.on('click', (arg) => {
        if (!designTime && arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if (arg.componentType === 'markLine' || !through) {
          return;
        }
        events.onPenetrateQuery('area', arg)
      })
    } else if (!designTime && (!Array.isArray(throughList) || throughList.length === 0)) {
      // 必須非穿透狀態才联动
      const graphConnectClickEvent = (arg) => {
        if (arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if (arg.componentType !== 'markLine' && this.validConnect) {
          this._handleChange(arg)
        }
      }
      if (!this.hasBindClickEvent) {
        this.graph.on('click', graphConnectClickEvent)
      }
    }
  }

  _getLegendOption(opts, data) {
    const o = {
      show: false,        // 默认不显示
      ...window.DEFAULT_ECHARTS_OPTIONS.lengend,
      textStyle: {
        ...window.DEFAULT_ECHARTS_OPTIONS.textStyle
      },
      data
    }
    if (opts) {
      o.show = opts.show
      o.itemWidth = opts.fontSize * 0.8333333333333334
      o.itemHeight = opts.fontSize * 0.8333333333333334
      o.itemGap = +opts.gap
      o.textStyle.fontSize = +opts.fontSize
      o.textStyle.color = opts.color
      // 获得位置
      const posArr = (opts.position || 'top-center').split('-');
      ([o.top, o.left] = posArr)
    }
    return o
  }

  _getGridOption(opts, defaultConfig) {
    const gridOption = defaultConfig || {
      top: 40,
      right: 20,
      bottom: 20,
      left: 20,
      containLabel: true
    }
    if (opts) {
      const { top, bottom, left, right } = opts
      gridOption.top = top >= 0 ? top : 0
      gridOption.right = right >= 0 ? right : 0
      gridOption.bottom = bottom >= 0 ? bottom : 0
      gridOption.left = left >= 0 ? left : 0
    }
    return gridOption
  }

  getOptions() {
    const chartData = this._convertData()
    const { config, layerToolboxShow, currentRelatedChartId, chartId } = this.props
    const { data } = this.state
    const dims = data.dimsForRelated.alias_name

    // 联动刷选之后
    if (this.connectStore.chartRelated && (currentRelatedChartId === chartId)) {
      chartData.series.forEach((item, i) => {
        const oldStyle = item.itemStyle
        const itemStyle = {
          normal: {
            color: (params) => {
              // 设置选中color
              const colorList = [
                oldStyle.normal.color, '#666666'
              ];
              if (this.connectStore.currentName.name) {
                if (params.name === this.connectStore.currentName.name) {
                  return colorList[0]
                }
                return colorList[1]
              }
              return oldStyle.normal.color
            }
          }
        }
        const symbolSize = (value, params) => {
          if (this.connectStore.currentName.name === params.name) {
            return 10
          }
          return 4
        }
        item.showAllSymbol = true
        item.symbolSize = symbolSize
        item.itemStyle = itemStyle
      })
    }

    const options = {
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        trigger: 'axis',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine
      },
      toolbox: {
        show: layerToolboxShow,
        right: 60,
        top: 0,
        iconStyle: {
          normal: {
            borderColor: '#698EBB'
          },
          emphasis: {
            borderColor: '#24BBF9'
          }
        },
        feature: {
          dataZoom: {
            show: true
          },
          dataView: {
            show: true,
            readOnly: true,
            backgroundColor: window.DEFAULT_ECHARTS_OPTIONS.dataview_color[0],
            buttonColor: window.DEFAULT_ECHARTS_OPTIONS.dataview_color[1],
            optionToContent: (opt) => {
              const axisData = opt.xAxis[0].data;
              const { series } = opt;
              let th = ''
              series.forEach((item) => {
                th += `<td style="line-height: 24px">${item.name}</td>`
              })
              let table = `<div class="table-view-wrap" style="overflow: auto;"><table style="width:100%;text-align:center;line-height: 24px;" class="data-view-table"><tbody><tr><td style="line-height: 24px">${dims}</td>${th}</tr>`;
              for (let i = 0, l = axisData.length; i < l; i++) {
                let value = ''
                series.forEach((item) => {
                  value += `<td style="line-height: 24px">${item.data[i]}</td>`
                })
                table += `<tr><td style="line-height: 24px">${axisData[i]}</td>${value}</tr>`;
              }
              table += '</tbody></table></div>';
              return table;
            }

          },
          saveAsImage: {
            show: true
          }
        }
      },
      // 图例: 传入layoutOption中的legend chartData中的legend
      legend: this._getLegendOption(config.legend, chartData.legend),
      grid: this._getGridOption(config.globalStyle && config.globalStyle.gap && config.globalStyle.gap.margin, window.DEFAULT_ECHARTS_OPTIONS.grid),
      xAxis: [{
        type: 'category',
        boundaryGap: false,
        axisLine: window.DEFAULT_ECHARTS_OPTIONS.axisLine,
        axisLabel: {
          ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
          formatter: value => value
        },
        data: chartData.xAxis,
        axisTick: {
          show: false
        }
      }],
      yAxis: [{
        type: 'value',
        axisLine: window.DEFAULT_ECHARTS_OPTIONS.axisLine,
        splitLine: window.DEFAULT_ECHARTS_OPTIONS.splitLine,
        axisLabel: {
          ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
          formatter: (value) => {
            const { primaryNum, displayFormat } = data
            return Utils.formatDisplay(value, displayFormat[primaryNum])
          }
        },
        axisTick: {
          show: false
        }
      }],
      series: chartData.series
    }
    // setting前clone对象
    options.xAxis = _.cloneDeep(options.xAxis)
    options.yAxis = _.cloneDeep(options.yAxis)
    // x轴设置 
    if (_.get(config, 'x')) {
      const { label, axis } = config.x
      //轴线
      _.set(options.xAxis[0].axisLine, 'show', axis.show)
      _.set(options.xAxis[0].axisTick, 'show', axis.show)
      _.set(options.xAxis[0].axisLine, 'lineStyle.color', axis.color)
      //轴标签
      _.set(options.xAxis[0].axisLabel, 'show', label.show)
      _.set(options.xAxis[0].axisLabel, 'fontSize', label.fontSize)
      _.set(options.xAxis[0].axisLabel, 'color', label.color)
      //轴标签角度、显示全部
      _.set(options.xAxis[0].axisLabel, 'interval', label.showAll ? 0 : 'auto')
      // 周标签角度
      const rotateAngle = _getAxisLabelRotateAngle(label.angle, 'x')
      if (rotateAngle !== null) {
        _.set(options.xAxis[0].axisLabel, 'rotate', rotateAngle);
      }
    }
    //y轴设置
    if (_.get(config, 'y')) {
      const { label, axis } = config.y
      //轴线
      _.set(options.yAxis[0].axisLine, 'show', axis.show)
      _.set(options.yAxis[0].axisTick, 'show', axis.show)
      _.set(options.yAxis[0].axisLine, 'lineStyle.color', axis.color)
      //轴标签
      _.set(options.yAxis[0].axisLabel, 'show', label.show)
      _.set(options.yAxis[0].axisLabel, 'fontSize', label.fontSize)
      _.set(options.yAxis[0].axisLabel, 'color', label.color)
      // 周标签角度
      const rotateAngle = _getAxisLabelRotateAngle(label.angle, 'y')
      if (rotateAngle !== null) {
        _.set(options.yAxis[0].axisLabel, 'rotate', rotateAngle);
      }
    }
    return options
  }

  _convertData() {
    const { config } = this.props
    const { data, seriesTmpl } = this.state
    const { colorTheme } = config.theme

    const legend = []
    const series = []
    // 用第一列的数据进行排序
    let xAxis = []
    data && data.series && Object.keys(data.series).forEach((item, i) => {
      legend.push(item)

      const _series = Object.assign({}, seriesTmpl, { stack: false })
      _series.name = item
      _series.data = data.series[item].map(value => Utils.DataUtils.noValueFormatter(value, 0))

      const _legendTheme = colorTheme || { v: '0', themeKey: 'tech', customColors: Array(0), affect: 0 }

      _attachColorStyle(_series, _legendTheme, i)
      if (config.globalStyle) {
        _series.showAllSymbol = true
        _attachLineStyle(_series, config.globalStyle.lineStyle)
        _attachLabelValueStyle(_series, config.globalStyle.lineLabel, data.displayFormat)
      }

      series.push(_series)
    })

    xAxis = Array.isArray(data.xAxis) ? data.xAxis : []

    return {
      legend,
      xAxis,
      series
    }
  }

  _handleChange(params) {
    //是否已经是处于选中状态 发起单图联动拼接conditions
    const { chartRelated, currentName } = this.connectStore
    const { chartId, currentRelatedChartId, events } = this.props
    const { data } = this.state
    const dim = data.dimsForRelated
    const conditions = []

    //如果当前数据集筛选中currentId为空 或者Id等于currentId就进行逻辑, 如果维度存在的情况下
    if (!currentRelatedChartId || currentRelatedChartId === chartId) {
      this.hasBindClickEvent = true;
      this.validConnect = false
      if (chartRelated && params.name === currentName.name) {
        this.connectStore = {
          currentName: {},
          chartRelated: false
        }
      } else {
        //condition_value
        let condition = {}
        condition = { ...condition, col_value: params.name, col_name: dim.col_name, dim, operator: '=' }
        conditions.push(condition)

        this.connectStore = {
          currentName: params,
          chartRelated: true
        }
      }

      if (events.onRelateChart) {
        events.onRelateChart(conditions, chartId, (validConnect) => {
          this.validConnect = validConnect
          this.hasBindClickEvent = false; // 是否绑定事件
          this.bindEvents()
        })
      }
    }
  }
}

export default Connect()(Area)
