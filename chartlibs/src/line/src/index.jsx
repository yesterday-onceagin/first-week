import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'
import _ from 'lodash'
import { Connect, Utils } from 'dmp-chart-sdk'

const { formatDisplay } = Utils
// 转换折线图数据
const _dataProcess = (data, indicators) => {
  let primaryNum = ''             //记录第一个num, 因为多数值的时候y轴需要需要第一个num 的display_format
  const axisNum = []

  const dimsData = Utils.DataUtils.pluckDimsData(data, indicators)
  const numsData = Utils.DataUtils.pluckNumsData(data, indicators, (hookData, num, index) => {
    if (index === 0) {
      primaryNum = hookData.key
    }
    axisNum.push(hookData.key)
    return hookData
  })
  return { ...dimsData, ...numsData, primaryNum, axisNum }
}

const _transformLineData = (data, indicators) => {
  data.forEach((item) => {
    Object.keys(item).map((key) => {
      if (item[key] == null) {
        item[key] = '-'
      }
    })
  })

  const { dims, nums, numsDisplayFormat, primaryNum, axisNum } = _dataProcess(data, indicators);

  return {
    dims,
    nums,
    axisNum,
    primaryNum,
    dimsForRelated: indicators.dims,
    displayFormat: numsDisplayFormat
  }
}

// 应用配色方案
const _attachColorStyle = function (sery, colorTheme, seryIndex, seriesLen, relatedIndex = -1/*联动的序号*/) {
  const color = Utils.Theme.getEchartColorFromTheme(echarts, colorTheme, seryIndex, 0)
  if (relatedIndex > -1) {
    _.set(sery, 'lineStyle.normal.color', '#666')
    _.set(sery, 'showAllSymbol', true)
  } else {
    _.set(sery, 'lineStyle.normal.color', color)
  }
  _.set(sery, 'symbol', 'circle')
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
    series.label.normal.formatter = (params) => Utils.formatDisplay(params.value, df[params.seriesName])
    // fix 渐变色 label颜色变成黑色的bug
    if (series.itemStyle && series.itemStyle.normal.color && series.itemStyle.normal.color.colorStops) {
      _.set(series, 'label.normal.color', series.itemStyle.normal.color.colorStops[0].color)
    }
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

class Line extends React.Component {
  static propTypes = {
    designTime: PropTypes.bool,    // 设计时(编辑区)
    data: PropTypes.object,        // 数据集返回的数据
    config: PropTypes.object,      // 样式配置数据
    events: PropTypes.object,      // 可触发的事件
    layer: PropTypes.object,       // 组件在编辑区的图层信息
    scale: PropTypes.number,       // 组件在编辑区的缩放比例
    platform: PropTypes.string,
  }

  constructor(props) {
    super(props)
    const { data, indicators } = props.data || {}
    this.state = {
      data: _transformLineData(data, indicators),
      theme: 'vintage',
      seriesTmpl: {
        cursor: 'auto',
        name: '邮件营销',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210]
      }
    }

    this.validConnect = true;       // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    this.connectStore = {
      currentName: {},     // 缓存选中的区域
      chartRelated: false  // 是否已触发联动
    };

    // 暴露的static 方法
    this.getChart = () => this.graph
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
        data: _transformLineData(nextProps.data.data, nextProps.data.indicators)
      })
    }

    if (nextProps.clearRelated || nextProps.chartId !== this.props.chartId) {
      this.connectStore = {
        currentName: {}, // 缓存选中的列
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
    if (data) this.runDrawGraph(scale !== preProps.scale)
  }

  componentWillUnmount() {
    this.validConnect = true        // 联动是否有效
    this.hasBindClickEvent = false  // 是否绑定事件
    if (this.graph) {
      this.graph.dispose()
    }
  }

  render() {
    return (
      <div className="graph-inner-box">
        <div className="graph-inner-box-wrap" ref={(node) => { this.graphNode = node }}></div>
      </div>
    )
  }

  runDrawGraph(reInit) {
    const { data, seriesTmpl } = this.state
    const { through, scale, config, platform } = this.props
    const { marklines } = this.props.data || {}

    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, Utils.getEchartRenderer(platform))
      if (platform !== 'mobile') {
        Utils.scaleChart(this.graph, scale)
      }
    }

    if (through) {
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

    this.graph.setOption(options, true)
    this.bindEvents()
  }

  bindEvents() {
    const { through, throughList, events, designTime } = this.props
    this.graph.off('click')

    if (through) {
      this.graph.on('click', (arg) => {
        if (!designTime && arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if (arg.componentType === 'markLine' || !this.props.through) {
          return;
        }
        events.onPenetrateQuery('line', arg)
      })
    } else if (!designTime && (!Array.isArray(throughList) || throughList.length === 0)) {
      // 必须是穿透状态才联动
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
    const { currentRelatedChartId, chartId, layerToolboxShow, config } = this.props
    const chart_data = this._convertData()

    //联动刷选之后
    if (this.connectStore.chartRelated && (currentRelatedChartId === chartId)) {
      chart_data.series.forEach((item) => {
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
        item.lineStyle.normal.color = '#666'
        item.showAllSymbol = true
        item.itemStyle = itemStyle
      })
    }

    const { data } = this.state
    const dims = Object.keys(data.dims)[0]
    const xAxis = {
      type: 'category',
      boundaryGap: false,
      data: chart_data.xAxis,
      axisLine: {
        ...window.DEFAULT_ECHARTS_OPTIONS.axisLine
      },
      axisLabel: {
        ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
        formatter: value => value
      },
      axisTick: {
        show: false
      }
    }
    const yAxis = {
      type: 'value',
      axisLine: {
        ...window.DEFAULT_ECHARTS_OPTIONS.axisLine
      },
      splitLine: {
        ...window.DEFAULT_ECHARTS_OPTIONS.splitLine
      },
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
    }
    // 如果可视区域的高度 > 450 . Bottom 可以
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
            show: true,
            title: '保存为图'
          }
        }
      },
      // 图例: 传入config中的legend chartData中的legend
      legend: this._getLegendOption(config.legend, chart_data.legend),
      grid: this._getGridOption(config.globalStyle && config.globalStyle.gap && config.globalStyle.gap.margin, window.DEFAULT_ECHARTS_OPTIONS.grid),
      xAxis: _.cloneDeep(xAxis),
      yAxis: _.cloneDeep(yAxis),
      series: chart_data.series
    }
    // x轴设置
    if (config && config.x) {
      const { label, axis } = config.x
      // 轴线
      _.set(options.xAxis.axisLine, 'show', axis.show)
      _.set(options.xAxis.axisTick, 'show', axis.show)
      _.set(options.xAxis.axisLine, 'lineStyle.color', axis.color)
      // 轴标签
      _.set(options.xAxis.axisLabel, 'show', label.show)
      _.set(options.xAxis.axisLabel, 'fontSize', label.fontSize)
      _.set(options.xAxis.axisLabel, 'color', label.color)
      // 轴标签是否显示全部
      _.set(options.xAxis.axisLabel, 'interval', label.showAll ? 0 : 'auto')
      // 轴标签角度
      switch (label.angle) {
        case 'horizon':
          _.set(options.xAxis.axisLabel, 'rotate', 0)
          break;
        case 'italic':
          _.set(options.xAxis.axisLabel, 'rotate', 45)
          break;
        case 'vertical':
          _.set(options.xAxis.axisLabel, 'rotate', 90)
          break;
        default:
          break;
      }
    }
    // y轴设置
    if (config && config.y) {
      const { label, axis } = config.y
      // 轴线
      _.set(options.yAxis.axisLine, 'show', axis.show)
      _.set(options.yAxis.axisTick, 'show', axis.show)
      _.set(options.yAxis.axisLine, 'lineStyle.color', axis.color)
      // 轴标签
      _.set(options.yAxis.axisLabel, 'show', label.show)
      _.set(options.yAxis.axisLabel, 'fontSize', label.fontSize)
      _.set(options.yAxis.axisLabel, 'color', label.color)
      // 轴标签角度
      switch (label.angle) {
        case 'horizon':
          _.set(options.yAxis.axisLabel, 'rotate', 0)
          break;
        case 'italic':
          _.set(options.yAxis.axisLabel, 'rotate', -45)
          break;
        case 'vertical':
          _.set(options.yAxis.axisLabel, 'rotate', 90)
          break;
        default:
          break;
      }
    }
    return options
  }

  _convertData() {
    const { currentRelatedChartId, chartId, through, config } = this.props
    const { colorTheme } = config.theme
    const { data, seriesTmpl } = this.state

    if (((!currentRelatedChartId || currentRelatedChartId === chartId) && data.dimsForRelated) || through) {
      seriesTmpl.cursor = 'pointer'
    }
    const legend = []
    const series = []
    const xAxis = []
    // 转成数据
    const dims = Object.entries(data.dims)
    // dims nums data 的数组长度是一样的。
    // dims 
    // 用第一列的数据进行排序
    data.nums && Object.keys(data.nums) && Object.keys(data.nums).forEach((item, i) => {
      legend.push(item)

      const _series = Object.assign({}, seriesTmpl, { stack: false })
      _series.name = item
      _series.data = [].concat(data.nums[item])
      _series.data = _series.data.map(value => Utils.DataUtils.noValueFormatter(value))

      _series.showAllSymbol = true

      colorTheme && _attachColorStyle(_series, colorTheme, i)
      if (config.globalStyle) {
        _attachLineStyle(_series, config.globalStyle.lineStyle)
        _attachLabelValueStyle(_series, config.globalStyle.lineLabel, data.displayFormat)
      }


      data.nums[item].forEach((d, _i) => {
        const _xaxis = []
        dims.forEach((_item) => {
          _xaxis.push(_item[1][_i])
        })
        // 去重
        if (_.findIndex(xAxis, x => x === _xaxis.join('&')) === -1) {
          xAxis.push(_xaxis.join('&'))
        }
      })

      series.push(_series)
    })

    return {
      legend,
      xAxis,
      series
    }
  }

  //折线图被点击改变
  _handleChange(params) {
    // 是否已经是处于选中状态 发起单图联动拼接conditions
    const { chartRelated, currentName } = this.connectStore
    const { chartId, currentRelatedChartId, events } = this.props
    const { data } = this.state
    const dims = data.dimsForRelated
    const conditions = []

    // 如果当前数据集筛选中currentId为空 或者Id等于currentId就进行逻辑
    if (!currentRelatedChartId || currentRelatedChartId === chartId) {
      this.hasBindClickEvent = true;
      this.validConnect = false
      if (chartRelated && params.name === currentName.name) {
        this.connectStore = {
          currentName: {},
          chartRelated: false
        }
      } else {
        // 拆分name 获得condition_value
        const valueArr = params.name.split('&')

        valueArr.forEach((item, index) => {
          let condition = {}
          // 处理字符为 col_value为-的情况
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
          this.validConnect = true
          this.hasBindClickEvent = false
          this.bindEvents()
        })
      }
    }
  }
}

export default Connect()(Line)
