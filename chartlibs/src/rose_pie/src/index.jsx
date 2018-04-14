import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import echarts from 'echarts'
import { Connect, Utils } from 'dmp-chart-sdk'

const { DataUtils } = Utils

// 转换Table数据
const _dataProcess = (data, indicators) => {
  const dimsData = DataUtils.pluckDimsData(data, indicators);
  const numsData = DataUtils.pluckNumsData(data, indicators);
  return { ...dimsData, ...numsData }
}

const _transformRosePieData = (data, indicators) => {
  data.forEach((item) => {
    Object.keys(item).map((key) => {
      if(item[key] == null) {
        item[key] = '-'
      }
    })
  })
  
  const { dims, nums, numsDisplayFormat } = _dataProcess(data, indicators);
  const _data = [];
  const _dims = Object.entries(dims);  
  const _nums = Object.entries(nums);
  let total_data = 0;
  let total_percent = 0;
  if(_dims.length > 0) {
    _dims[0][1].forEach((item, i) => {
      const value = _nums[0] ? +_nums[0][1][i] : null;
      total_data += Number(value);
      _data.push({name: item, value})
    })
  } else{
    _nums.forEach((item, index) => {
      total_data += Number(item[1][0]);
      _data.push({name: item[0], value: item[1][0]})
    })
  }

  // 添加百分比
  _data.forEach((item, index) => {
    if(index === _data.length-1) {
      item.percent = 1- total_percent;
    } else {
      item.percent = +Number(item.value / total_data).toFixed(4)
      total_percent += item.percent
    }
  })

  return {
    dataArr: _data,
    dimsForRelated: indicators.dims[0],
    displayFormat: numsDisplayFormat 
  }
}

// 应用配色方案
const _attachColorStyle = (sery, colorTheme, seryIndex) => {
  const color = Utils.Theme.getEchartColorFromTheme(echarts, colorTheme, seryIndex, 0)
  const originColor = Utils.Theme.getColorFromTheme(colorTheme, seryIndex, 0)
  _.set(sery, 'itemStyle.normal.color', color)
  // 如果是渐变色, 那么label 需要设置一个颜色, 否则默认为黑色了
  if (Array.isArray(originColor)) {
    _.set(sery, 'label.normal.color', originColor[0])
  }
}

const _format = function (dF, value) {
  return `${Utils.formatDisplay(value, dF)}${(dF && dF.column_unit_name && dF.column_unit_name) || ''}`
}

// 玫瑰图标签样式
const  _attachRosePieLabelStyle = (series, options, dataOrigin) => {
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

  const { labelLine, labelName, labelValue, labelPercent, labelColor, scroll } = options
  _.set(series, 'labelLine.normal.length', labelLine.length1)
  _.set(series, 'labelLine.normal.length2', labelLine.length2)
  //根据是否轮播决定label是否显示
  _.set(series, 'labelLine.normal.show', !scroll.checked)
  _.set(series, 'label.normal.show', !scroll.checked)
  _.set(series, 'label.emphasis.show', true)
  // 标签颜色 
  if (labelColor.show) {
    _.set(series, 'label.normal.color', labelColor.color)
  }
  _.set(series, 'label.normal.rich', {
    
    n: { // 维度标签
      fontSize: labelName.fontSize,     
      color: series.label && series.label.normal.color,  // 解决渐变色的bug
    },
    p: {   // 百分比标签
      fontSize: labelPercent.fontSize,
      color: series.label && series.label.normal.color
    },
    v: {   // 数值标签
      fontSize: labelValue.fontSize,
      color: series.label && series.label.normal.color,
      lineHeight: labelValue.lineHeight
    }
  })

  _.set(series, 'label.normal.formatter', (params) => {
    const value = _dF ? _format(_dF, params.value) : params.value

    return [
      labelName.show ? `{n|${params.name}}` : '',

      (labelName.show && labelPercent.show) ? ': ' : '',

      labelPercent.show ? `{p|${params.percent}%}` : '',

      (labelName.show || labelPercent.show) && labelValue.show ? '\n' : '',

      labelValue.show ? `{v|${value}}` : ''
    ].join('')
  })
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

class RosePie extends React.Component {
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
      msg: '玫瑰图',
      data: _transformRosePieData(data, indicators),
      seriesTmpl: {
        data: [],
        cursor: 'auto',
        selectedMode: 'single',
        labelLine: {
          normal: {
            show: true,
            length: 10,
            length2: 10
          },
          emphasis: {
            show: true,
            length: 10,
            length2: 10
          }
        },
        emphasis: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      scrollSpeed: props.config.global ? props.config.global.scroll.interval * 1000 : 3000, //轮播速度
    }

    this.isInit = true     //是否可以重置轮播
    this.validConnect = true    //是否联动有效、
    this.hasBindClickEvent = false    // 是否绑定事件
    this.connectStore = {
      currentName: {},   // 缓存选中的列
      chartRelated: false    //是否触发联动
    }

    // 暴露的static方法
    this.getChart = () => this.graph
    if(props.clearRelated) {
      this.connectStore = {
        currentName: {},
        chartRelated: false
      }
    }
  }

  componentDidMount() {
    const { config } = this.props
    const { data } = this.state
    Array.isArray(data.dataArr) && this.runDrawGraph()
    if(config.global && config.global.scroll.checked && this.isInit) {
      this.isInit = false;
      this.start()
    }
  }

  componentWillReceiveProps(nextProps) {
    const { clearRelated, chartId, config } = nextProps;
    if(!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        data: _transformRosePieData(nextProps.data.data, nextProps.data.indicators)
      })
    }

    if (clearRelated || chartId !== this.props.chartId) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
        chartRelated: false
      }
    }
    if(this.props.config.global && config.global.scroll.interval !== this.props.config.global.scroll.interval) {
      this.setState({
        scrollSpeed: config.global.scroll.interval * 1000
      })
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { chartUuid, layerToolboxShow, config } = this.props;
    // 饼图因为有排序,需要单独对data进行判断
    return !_.isEqual(chartUuid, nextProps.chartUuid)   
    || nextProps.layerToolboxShow !== layerToolboxShow 
    || (nextProps.config && !_.isEqual(nextProps.config, config))
  }

  componentDidUpdate(nextProps) {
    const { scale, config } = this.props;
    const { data } = this.state;
    if(Array.isArray(data.dataArr)) {
      this.runDrawGraph( scale !== nextProps.scale)
    }

    // 开启轮播
    if(nextProps.config.global) {
      if(config.global.scroll && config.global.scroll.checked && this.isInit) {
        this.isInit = false;
        this.start()
      }
      // 轮播状态发生变化时
      if(config.global.scroll.checked !== nextProps.config.global.scroll.checked) {
        this.isInit = true;
        if(config.global.scroll.checked) {
            this.isInit = false;
            this.start()
        } else {
          this.isInit = true;
          this.clear()
        }
      }

      // 轮播间隔发生变化
      if(config.global.scroll.interval !== nextProps.config.global.scroll.interval && config.global.scroll.checked) {
        this.isInit = false;
        this.start()
      }
    }
  }

  componentWillMount() {
    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    if (this.graph) {
      this.graph.dispose()
    }
    //清空interval
    if (this.interval) clearInterval(this.interval)
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
    if(!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom)
      Utils.scaleChart(this.graph, scale)
    }

    const options = this.getOptions()

    this.graph.setOption(options, true)

    this.bindEvents()
  }
 

 
  bindEvents(){
    const { through, throughList, events, designTime  } = this.props
    this.graph.off('click')
    if(through) {
      this.graph.on('click', (arg) => {
        if(!designTime && arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if(through) {
          events.onPenetrateQuery('pie', arg)
        }
      })
    } else if(!designTime && (!Array.isArray(throughList) || throughList.length === 0)) {
      // 必须非穿透状态才能联动
      const graphConnectClickEvent = (params) => {
        if(params.event && params.event.event && params.event.event.stopPropagation) {
          params.event.event.stopPropagation()
        }
        if(this.validConnect) {
          this._handleChange(params)
        }
      }
      if(!this.hasBindClickEvent) {
        this.graph.on('click', graphConnectClickEvent)
      }
    }
  }

  _getLegendOption(opts, data, scale = 1) {
    const o ={
      show: false,  // 默认不显示
      ...window.DEFAULT_ECHARTS_OPTIONS.legend,
      textStyle: {
        ...window.DEFAULT_ECHARTS_OPTIONS.textStyle
      },
      data
    }
    if(opts) {
      o.show = opts.show;
      o.itemWidth = opts.fontSize * 0.8333333333333334 * scale;
      o.itemHeight = opts.fontSize * 0.8333333333333334 * scale;
      o.itemGap = +opts.gap * scale;
      o.textStyle.fontSize = +opts.fontSize * scale;
      o.textStyle.color = opts.color;
      // 获取位置
      const posArr = (opts.position || 'top-center').split('-');
      ([o.top, o.left] = posArr)
    }
    return o
  }


  getOptions() {
    const { currentRelatedChartId, chartId, config } = this.props;
    const { data } = this.state;
    const chartData = this._convertData()
    this.length = chartData.series.data.length;
    // 刷新联动之后
    if(this.connectStore.chartRelated && (currentRelatedChartId === chartId)) {
      chartData.series.data.forEach((item) =>{
        const oldStyle = item.itemStyle
        item.itemStyle = {
          normal: {
            color: this.connectStore.currentName.name === item.name ? oldStyle.normal.color : '#666'
          },
          emphasis: {
            shadowBlur: 10,
            shadowOffsetX:0,
            shadowColor: 'rgba(0,0,0,0.5)'
          }
        }
      })
    }

    //自定义 tooltip
    const options = _tooltip({
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        trigger: 'item',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine,
      },
      grid: window.DEFAULT_ECHARTS_OPTIONS.grid,
      toolbox: {
        show: this.props.layerToolboxShow,
        right: 60,
        top: 0,
        iconStyle: {
          normal: {
            borderColor: '#698EBB'
          }
        },
        emphasis: {
          normal: {
            borderColor: '#698EBB'
          }
        },
        feature: {
          dataView: {
            show: true,   //是否显示工具栏
            readOnly: true, // 数据预览
            backgroundColor: window.DEFAULT_ECHARTS_OPTIONS.dataview_color[0],
            buttonColor: window.DEFAULT_ECHARTS_OPTIONS.dataview_color[1],
            optionToContent: (opt) => {
              const { series } = opt;
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
          saveAsImage: {   // 是否保存为图
            show: true,
            title: '保存为图'
          }
        }
      },

      // 图例： 传入layoutOption中的legend chartData中的legend
      legend: this._getLegendOption(config.legend, chartData.legend),
      series: [
        chartData.series
      ]
    },data)

    return options
  }


  _convertData() {
    const { currentRelatedChartId, chartId, config, through } = this.props
    const { data, seriesTmpl } = this.state
    const { colorTheme } = config.theme

    const seriesData = Array.isArray(data.dataArr) ? data.dataArr.concat([]) : [] 

    seriesTmpl.type = 'pie'
    seriesTmpl.radius = '55%'
    seriesTmpl.center = ['50%', '55%']
    seriesTmpl.roseType = 'radius'

    if(((!currentRelatedChartId || currentRelatedChartId === chartId) && data.dimsForRelated) || through) {
      seriesTmpl.cursor = 'pointer';
    }
    seriesTmpl.data = seriesData.map((item, i) => {
      const dataItem = {
        ...item,
        value: +item.value ? Number(+item.value).toFixed(2) : 0
      }

      colorTheme && _attachColorStyle(dataItem, colorTheme, i)
      _attachRosePieLabelStyle(dataItem, config.global, data)
      return dataItem
    })

    return {
      legend: Array.isArray(data.dataArr) ? data.dataArr.map(item => item.name) : [],
      series: seriesTmpl
    }
  } 

  // 开始轮播
  start(){
    this.count = 0;
    this.clear();
    const { scrollSpeed } = this.state;
    this.interval = setInterval(() => {
      this.graph.dispatchAction({
        type: 'downplay',
        seriesIndex: 0
      })
      this.graph.dispatchAction({
        type: 'highlight',
        seriesIndex: 0,
        dataIndex: (this.count++) % this.length
      })
    }, scrollSpeed)
  }

  // 清除轮播
  clear() {
    if(this.interval) clearInterval(this.interval)
  }

  // 饼图被惦记改变了
  _handleChange(params) {
    // 是否已经处于选中状态  发起单图联动拼接conditions
    const { chartRelated, currentName } = this.connectStore;
    const { chartId, currentRelatedChartId, events, designTime } = this.props
    const { data } = this.state
    const { dimsForRelated } = data
    console.log(currentRelatedChartId, chartId)
    const conditions = []
    if((!currentRelatedChartId || currentRelatedChartId === chartId) && dimsForRelated) {
      this.hasBindClickEvent = true;
      this.validConnect = false;
      if(chartRelated && params.name === currentName.name) {
        this.connectStore = {
          currentName: {},
          chartRelated: false
        }
      } else {
        let condition = {}
        condition = { ...condition, col_value: params.name, col_name: dimsForRelated.col_name, dim: dimsForRelated, operator: '='}
        conditions.push(condition)

        this.connectStore = {
          currentName: params,
          chartRelated: true
        }        
      }
      if(events.onRelateChart && !designTime) {
        events.onRelateChart(conditions, chartId, () => {
          this.validConnect = true
          this.hasBindClickEvent = false
          this.bindEvents()
        })
      }   
    }
  }

}

export default Connect()(RosePie)
