import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import echarts from 'echarts'
import { Connect, Utils } from 'dmp-chart-sdk'


const { DataUtils } = Utils

// 转换数据
const _dataProcess = (data, indicators) => {
  const dimsData = Utils.DataUtils.pluckDimsData(data, indicators)
  const numsData = Utils.DataUtils.pluckNumsData(data, indicators)
  return { ...dimsData, ...numsData }
}

const _transformFunnelData = (data, indicators) => {
  data.forEach((item) => {
    Object.keys(item).map((key) =>{
      if(item[key] == null) {
        item[key] = '-'
      }
    })
  })

  const { dims, nums, numsDisplayFormat } = _dataProcess(data, indicators);
  const _data = []
  const _dims = Object.entries(dims)
  const _nums = Object.entries(nums)
  let total_data = 0
  let total_percent = 0
  if (_dims.length > 0) {
    _dims[0][1].forEach((item, i) => {
      const value = _nums[0] ? +_nums[0][1][i] : null
      total_data += Number(value)
      _data.push({name: item, value})
    })
  } else {
    _nums.forEach((item) => {
      total_data += Number(item[1][0])
      _data.push({ name: item[0], value: item[1][0]})
    })
  }
  // 添加百分比
  _data.forEach((item, index) => {
    if(index === _data.length -1) {
      item.percent = 1 - total_percent
    } else {
      item.percent = +Number(item.value / total_data).toFixed(4)
      total_percent += +item.percent
    }
  })

  return {
    dataArr: _data,
    dimsForRelated: indicators.dims[0],
    displayFormat: numsDisplayFormat
  }
}

// 应用配色方案
const _attachColorStyle = (sery, colorTheme, seryIndex ) => {
  const color = Utils.Theme.getEchartColorFromTheme(echarts, colorTheme, seryIndex, 0)
  const originColor = Utils.Theme.getColorFromTheme(colorTheme, seryIndex, 0)
  _.set(sery, 'itemStyle.normal.color', color)
  // 如果是渐变颜色  那么label需要设置一个颜色  否则默认为黑色
  if (Array.isArray(originColor)) {
    _.set(sery, 'label.normal.color', originColor[0])
  }
}

const _format = (dF, value) => {
  return `${Utils.formatDisplay(value, dF)}${(dF && dF.column_unit_name && dF.column_unit_name) || ''}`
}


// 图表提示框
const _gC = function (color) {
  //渐变
  if (typeof color === 'object') {
    return color.colorStops[0].color
  }
  return color
}

const _tooltip = (options, dataOrigin) => {
  const { displayFormat, dimsForRelated } = dataOrigin || {}
  const dF = displayFormat || {}

  const defaultTooltip = window.DEFAULT_ECHARTS_OPTIONS.tooltip

  // 调整显示 toottip
  options.tooltip.backgroundColor = defaultTooltip.backgroundColor;
  options.tooltip.extraCssText = defaultTooltip.extraCssText;
  options.tooltip.enterable = true
  options.tooltip.hideDelay = 500

  const valueFS = '10px'

  options.tooltip.formatter = (data) => {
    let valueStr = data.value
    let _dF = null
    if (dimsForRelated) {      // 有维度
      const keys = Object.keys(dF)
      if (keys.length > 0) {
        _dF = dF[keys[0]]
      }
    } else {
      _dF = dF[data.name]
    }
    if (_dF) {
      valueStr = _format(_dF, valueStr)
    }
    return `<span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${data.name}: ${valueStr} (${Number(data.percent).toFixed(2)}%)</span>`
  }
  return options
}


class Funnel extends React.Component {
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
      data: _transformFunnelData(data, indicators),
      seriesTmpl: {
        data: [],
        cursor: 'auto',
        selectedMode: 'single',
        emphasis: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
    }
    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false;
    this.connectStore = {
      currentName: {},
      chartRelated: false   
    }

    // 暴露的static 方法
    this.getChart = () => this.graph 
    if (props.clearRelated) {
      this.connectStore = {
        currentName: {},
        chartRelated: false
      }
    }
  }

  componentDidMount() {
    const { data } = this.state
    Array.isArray(data.dataArr) && this.runDrawGraph()
  }

  componentWillReceiveProps(nextProps) {
    const { clearRelated, chartId } = nextProps
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        data: _transformFunnelData(nextProps.data.data, nextProps.data.indicators)
      })
    }
    if (clearRelated || chartId !== this.props.chartId) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
        chartRelated: false
      }
    }
  }

  shouldComponentUpdate(nextProps, netxState) {
    const { chartUuid, layerToolboxShow, config } = this.props
    return !_.isEqual(chartUuid, nextProps.chartUuid) 
    || nextProps.layerToolboxShow !== layerToolboxShow
    || (nextProps.config && !_.isEqual(nextProps.config, config))
  }

  componentDidUpdate(nextProps) {
    const { scale } = this.props
    const { data } = this.state
    if (Array.isArray(data.dataArr)) {
      this.runDrawGraph( scale !== nextProps.scale)
    }
  }

  componentWillMount() {
    this.validConnect = true;
    this.hasBindClickEvent = false;
    if(this.graph) {
      this.graph.dispose()
    }
  }

  render() {
    return (
      <div className="graph-inner-box">
      <div className="graph-inner-box-wrap" ref={(node) => { this.graphNode = node }}></div>  
      </div>
    );
  }

  runDrawGraph(reInit) {
    const { scale } = this.props
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom)
      Utils.scaleChart(this.graph, scale)
    }

    const options = this.getOptions()

    // 加上noMerge = true参数即可防止使用到上一次的配置
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
        if (through) {
          events.onPenetrateQuery('funnel', arg)
        }
      })
    } else if(!designTime && (!Array.isArray(throughList) || throughList.length === 0)) {
      // 必须穿透状态才能联动
      const graphConnectClickEvent = (params) => {
        if(params.event && params.event.event && params.event.event.stopPropagation) {
          params.event.event.stopPropagation()
        }
        if (this.validConnect) {
          this._handleChange(params)
        }
      }
      if(!this.hasBindClickEvent) {
        this.graph.on('click', graphConnectClickEvent)
      }
    }
  }

  _getLegendOption(opts, data, scale = 1 ) {
    const o = {
      show: false,
      ...window.DEFAULT_ECHARTS_OPTIONS.lengend,
      textStyle: {
        ...window.DEFAULT_ECHARTS_OPTIONS.textStyle
      },
      data
    }
    if(opts) {
      // console.log(opts)
      o.show = opts.show
      o.itemWidth = opts.fontSize * 0.8333333333333334 * scale
      o.itemHeight = opts.fontSize * 0.8333333333333334 * scale
      o.itemGap = +opts.gap * scale
      o.textStyle.fontSize = +opts.fontSize * scale
      o.textStyle.color = opts.color
      // 获取位置
      const posArr = (opts.position || 'top-center').split('-');   //  这里分号必须加上去
      ([o.top, o.left] = posArr)
    }
    return o
  }

  getOptions() {
    const { currentRelatedChartId, chartId, config } = this.props
    const { data } = this.state
    const chartData = this._convertData()
    this.length = chartData.series.data.length

    // 联动刷选之后
    if (this.connectStore.chartRelated && (currentRelatedChartId === chartId)) {
      chartData.series.data.forEach((item) => {
        const oldStyle = item.itemStyle
        item.itemStyle = {
          normal: {
            color: this.connectStore.currentName.name === item.name ? oldStyle.normal.color : '#666666',
          },
          emphasis: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      })
    }

    // 自定义tooltip
    const options = _tooltip({
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        trigger: 'item',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine
      },
      grid: window.DEFAULT_ECHARTS_OPTIONS.grid,
      toolbox: {
        show: this.props.layerToolboxShow,
        right: 60,
        top: 0,
        iconStyle: {
          normal: {
            borderColor: '#698EBB'
          },
          emphasis: {
            borderColor: '#698EBB'
          }
        },
        feature: {
          dataView: {
            show: true,
            readOnly: true,
            backgroundColor: window.DEFAULT_ECHARTS_OPTIONS.dataview_color[0],
            buttonColor: window.DEFAULT_ECHARTS_OPTIONS.dataview_color[1],
            optionToContent: (opt) => {
              const { series } = opt
              let table = '<div class="table-view-wrap" style="overflow: auto;"><table style="width:98%;text-align:center;line-height: 24px;" class="data-view-table"><tbody><tr>';
              series[0].data.forEach((item) => {
                let value = ''
                value += `<td>${item.name}</td>`
                value += `<td>${item.value}</td>`
                table += `<tr>${value}</tr>`
              })
              table += '</tbody></table></div>'
              return table;
            }
          },
          saveAsImage: {
            show: true,
            title: '保存为图'
          }
        }
      },
      // 图例: 传入layoutOption中的legend chartData中的legend
      legend:  this._getLegendOption(config.legend, chartData.legend),
      series: [
        chartData.series
      ]
    }, data)
    return options
  }

  _convertData() {
    const { through, currentRelatedChartId, chartId, config } = this.props
    const { data, seriesTmpl } = this.state
    const { colorTheme } = config.theme
    const seriesData = Array.isArray(data.dataArr) ? data.dataArr.concat([]) : []

    seriesTmpl.type = 'funnel'
    seriesTmpl.sort = 'none'

    if (((!currentRelatedChartId || currentRelatedChartId === chartId) && data.dimsForRelated) || through) {
      seriesTmpl.cursor = 'pointer'
    }
    seriesTmpl.data = seriesData.map((item, i) => {
      const dataItem = {
        ...item,
        value: +item.value ? Number(+item.value).toFixed(2) : 0
      }
      colorTheme && _attachColorStyle(dataItem, colorTheme, i)
      return dataItem
    })

    return {
      legend: Array.isArray(data.dataArr) ? data.dataArr.map(item => item.name) : [],
      series: seriesTmpl
    }
  }

  _handleChange(params) {  // 是否处于选中状态  发起单图联动拼接conditions 
    const { chartRelated, currentName } = this.connectStore
    const { chartId, currentRelatedChartId, events, designTime } = this.props
    const { data } = this.state
    const { dimsForRelated } = data
    
    const conditions = []
    //如果当前数据集筛选中currentRelatedChartId为空 或者chartId等于currentRelatedChartId就进行逻辑, 必须维度存在的情况下
    if((!currentRelatedChartId || currentRelatedChartId === chartId) && dimsForRelated) {
      this.hasBindClickEvent = true;
      this.validConnect = false;
      if (chartRelated && params.name === currentName.name) {
        this.connectStore = {
          currentName: {},
          chartRelated: false
        }
      }  else {
        let condition = {}
        condition = { ...condition, col_value: params.name, col_name: dimsForRelated.col_name, dim: dimsForRelated, operator: '='}
        conditions.push(condition)
        
        this.connectStore = {
          currentName: params,
          chartRelated: true
        }
      }
      if (events.onRelateChart && !designTime) {
        events.onRelateChart(conditions, chartId, () => {
          this.validConnect = true;
          this.hasBindClickEvent = false;
          this.bindEvents()
        })
      }
    }
  }
  
  
}

export default Connect()(Funnel)
