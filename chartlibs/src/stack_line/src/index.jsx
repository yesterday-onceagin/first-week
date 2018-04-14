import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'
import _ from 'lodash'

import { Connect, Utils } from 'dmp-chart-sdk'
import './style.less'

// 转换Table数据
const _dataProcess = (data, indicators) => {
  let primaryNum = ''    //记录第一个num, 因为多数值的时候y轴需要需要第一个num 的display_format
  const axisNum = []
  const dimsData = Utils.DataUtils.pluckDimsData(data, indicators)  // 从data中获取维度的字段数据
  const numsData = Utils.DataUtils.pluckNumsData(data, indicators, (hookData, num, index) => {   //从data中获取数值字段的数据

    if (index === 0) {
      primaryNum = hookData.key
    }
    axisNum.push(hookData.key)  // 添加key属性

    return hookData
  })

  return { ...dimsData, ...numsData, primaryNum, axisNum }
}

const _transformLineData = (data, indicators) => {
  data.forEach((item) => {
    Object.keys(item).map((key) => {
      if (item[key] == null) {
        item[key] = ''
      }
    })
  })

  const { dims, nums, numsDisplayFormat, primaryNum, axisNum } = _dataProcess(data, indicators)

  return { dims, nums, displayFormat: numsDisplayFormat, dimsForRelated: indicators.dims, axisNum, primaryNum }
}


// 应用配色方案
const _attachColorStyle = function (sery, colorTheme, seryIndex, seriesLen, realedIndex = -1 /* 联动的序号*/) {
  const color = Utils.Theme.getEchartColorFromTheme(echarts, colorTheme, seryIndex, 0)
  if (realedIndex > -1) {
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
const _attachLineStyle = function (series, stackLineStyle) {
  _.set(series, 'lineStyle.normal.type', stackLineStyle && stackLineStyle.lineBorder && stackLineStyle.lineBorder.borderStyle)
  _.set(series, 'lineStyle.normal.width', stackLineStyle && stackLineStyle.lineBorder && stackLineStyle.lineBorder.borderWidth)
  _.set(series, 'symbolSize', stackLineStyle && stackLineStyle.radius && (stackLineStyle.radius * 2))
  _.set(series, 'smooth', stackLineStyle && stackLineStyle.lineSmooth)
}

// 应用标签值样式
export function _attachLabelValueStyle(series, stackLineLabel, df) {
  if (stackLineLabel) {
    const { fontSize, distance, checked } = stackLineLabel
    _.set(series, 'label.normal.show', checked)
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

// 图标提示框

const _gC = (color) => {
  // 渐变
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

class StackLine extends React.Component {
  static PropTypes = {
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
    this.validConnect = true  // 联动是否有效
    this.hasBindClickEvent = false // 是否绑定事件
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
    const { data, seriesTmpl } = this.state   // data 数据 axisNum dims dimsForRelated  displayFormat nums primaryNum  
    const { though, scale, config, platform } = this.props   // config 配置的图表样式  though  通过   scale  图表大小 platform  平台  PC端
    const { marklines } = this.props.data || {}  // 获取辅助线的数据

    if (!this.graph || reInit) {  // 判断初始化有没有图形 
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, Utils.getEchartRenderer(platform))
      if (platform !== 'mobile') {
        Utils.scaleChart(this.graph, scale)
      }
    }

    if (though) {
      seriesTmpl.cursor = 'pointer';   //  高亮 指针光标
    }

    const { displayFormat, primaryNum } = data   // this.state.data 获取  displayFormat   {签约套数: Object, 签约金额: Object} primaryNum：签约套数
    let options = this.getOptions()    // 定义options 
    options = _tooltip(options, data)  // options 会用带封装的_tooltip 里面的方法

    // 辅助线 
    if (marklines && marklines.length) {
      const markerData = {
        data: marklines,
        y: config.y.markline
      }
      options = Utils.applyOptionMarkline(options, markerData, false, displayFormat[primaryNum])   //调用extension/markLine  目录下的方法  在Utils/UtilsForDmpChart 里面导出的方法
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

  _getLegendOption(opts, data) {     //     getLegendOption 方法的目录位置/helpers/dashboardUtils'
    const o = {
      show: false,
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
      o.itemGap = +opts.pad
      o.textStyle.fontSize = +opts.fontSize
      o.textStyle.color = opts.color
      // 获得位置
      const posArr = (opts.position || 'top-center').split('-');
      ([o.top, o.left] = posArr)
    }
    return o

  }

  /**
 * 获取边距配置
 * @param {Object} opts (layoutOptions.global)
 * @param {Object} defaultConfig
 */
  _getGridOption(opts, defaultConfig, scale = 1) {
    const gridOption = defaultConfig || window.DEFAULT_ECHARTS_OPTIONS.grid
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
    const { currentRelatedChartId, chartId, layerToolboxShow, config } = this.props    // currentRelatedChartId 当前有关图表的id  chartId  图表ID   layerToolboxShow  false 工具层是否显示 
    const chart_data = this._converData()

    // 刷新联动之后

    if (this.connectStore.chartRelated && (currentRelatedChartId === chartId)) {
      chart_data.series.forEach((item) => {
        const oldStyle = item.itemStyle
        const itemStyle = {
          normal: {
            color: (parmas) => {
              //设置color
              const colorList = [
                oldStyle.normal.color , "#666"
              ];
              if (this.connectStore.currentName.name) {
                if (parmas.name === this.connectStore.currentName.name) {
                  return colorList[0]
                }
                return colorList[1]
              }
              return oldStyle.normal.color
            }
          }
        }
        item.lineStyle.normal.color = "#666"
        item.showAllSymbol = true
        item.itemStyle = itemStyle
      })
    }
    const { data } = this.state
    const dims = Object.keys(data.dims)[0]
    const xAxis = {
      type: 'category',
      boundaryGap: false,   // 边界间隙 
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

    // 如果可视区的高度 > 450 

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
            borderColor: "#24BBF9"
          }
        },
        feature: {
          dataView: {
            show: true,
            readOnly: true,
            backgroundColor: window.DEFAULT_ECHARTS_OPTIONS.dataview_color[0],
            buttonColor: window.DEFAULT_ECHARTS_OPTIONS.dataview_color[1],
            optionToContent: (opt) => {
              const axisData = opt.xAxis[0].data
              const { series } = opt
              let th = ''
              series.forEach((item) => {
                th += `<td style="line-heeight: 24px"> ${item.name}`
              })
              let table =
                `<div class="table-view-warp" style="overflow: auto;"><table style="width: 100%;text-angle: center;line-height: 24px;" class="data-view-table"><tbody><tr><td style="line-height: 24px">${dims}</td>${th}</tr>`;
              for (let i = 0, l = axisData.length; i < l; i++) {
                let value = ''
                series.forEach((item) => {
                  value += `<td style="line-height:24px">${item.data[i]}</td>`
                })
                table += `<tr><td style="line-height: 24px;">${axisData[i]}</td>${value}</tr>`;
              }
              table += `</tbody></table></div>`
              return table
            }
          },
          saveAsImage: {
            show: true,
            title: '保存为图'
          }
        }
      },
      //  图例: 传入config中的legend chartData中的legend
      legend: this._getLegendOption(config.legend, chart_data.legend),
      grid: this._getGridOption(config.globalStyle && config.globalStyle.pad && config.globalStyle.pad.margin, window.DEFAULT_ECHARTS_OPTIONS.grid),
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
      // 轴标签是否显示全部
      _.set(options.yAxis.axisLabel, 'interval', label.showAll ? 0 : 'auto')
      // 轴标签角度
      switch (label.angle) {
        case 'horizon':
          _.set(options.yAxis.axisLabel, 'rotate', 0);
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

  _converData() {
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
    // dims nums data 的数组长度是一样的
    // 用第一列的数据进行排序
    data.nums && Object.keys(data.nums) && Object.keys(data.nums).forEach((item, i) => {
      legend.push(item)

      // const _series = Object.assign({}, seriesTmpl, { stack:false})
      const _series = Object.assign({}, seriesTmpl, { stack: this._getChartType().stack })
      _series.name = item
      _series.data = [].concat(data.nums[item])
      _series.data = _series.data.map(value => Utils.DataUtils.noValueFormatter(value))   // noValueFormatter   路径位置 utils/fmtSeries  在 UtilsForDmpChart里面导出
      _series.showAllSymbol = true

      colorTheme && _attachColorStyle(_series, colorTheme, i)
      if (config.globalStyle) {
        _attachLineStyle(_series, config.globalStyle.stackStyle)
        _attachLabelValueStyle(_series, config.globalStyle.stackLable, data.displayFormat)
      }
      data.nums[item].forEach((d, n) => {
        const _xaxis = []
        dims.forEach((_item) => {
          _xaxis.push(_item[1][n])
        })
        // 去重
        if (_.findIndex(xAxis, x => x === _xaxis.join('&')) === -1) {
          xAxis.push(_xaxis.join('&'))
        }
      })
      series.push(_series)
    })
    return { legend, xAxis, series }

  }

  _getChartType() {
    const { code } = this.props
    return {
      stack: code === 'stack_line'
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

    // 如果当前数据集筛选中currentRelatedChartId为空 或者chartId等于currentRelatedChartId就进行逻辑
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



export default Connect()(StackLine)