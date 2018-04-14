import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'

import _ from 'lodash'
import { attachColorStyle, scaleChart, attachPieLabelStyle/* , getEchartRenderer */ } from '../../utils/echartOptionHelper'
import { getLegendOption } from '../../../../helpers/dashboardUtils'
import tooltip from '../extension/tooltip'

window.isEqual = _.isEqual

class Pie extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    code: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    data: PropTypes.object,
    events: PropTypes.shape({
      onChartChange: PropTypes.func      // 联动 
    }),
    clearSelect: PropTypes.bool,
    currentId: PropTypes.string,
    editable: PropTypes.bool,
    func_config: PropTypes.object,
    scaleRate: PropTypes.number,
    layoutOptions: PropTypes.object,
    operatorShow: PropTypes.bool,
    legendTheme: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object
    ]),
    fullScreen: PropTypes.bool,
    through: PropTypes.bool,
    throughList: PropTypes.array,
    id: PropTypes.string,
    platform: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {
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
      scrollSpeed: props.layoutOptions.global ? props.layoutOptions.global.scroll.interval * 1000 : 3000, //轮播速度
    }
    this.isInit = true //是否可以重置饼图轮播
    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    this.connectStore = {
      currentName: {}, //缓存选中的区域
      chartRelated: false  //是否已触发联动
    };

    // 暴露的static 方法
    this.getChart = () => this.graph
    if (props.clearSelect) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
        chartRelated: false
      }
    }
  }

  componentDidMount() {
    const { data, layoutOptions } = this.props
    Array.isArray(data.dataArr) && this.runDrawGraph()
    if (layoutOptions.global && layoutOptions.global.scroll.checked && this.isInit) {
      this.isInit = false
      this.start()
    }
  }

  componentWillReceiveProps(nextProps) {
    const { clearSelect, id, layoutOptions } = nextProps
    if (clearSelect || id !== this.props.id) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
        chartRelated: false
      }
    }
    if (this.props.layoutOptions.global && layoutOptions.global.scroll.interval !== this.props.layoutOptions.global.scroll.interval) {
      this.setState({
        scrollSpeed: layoutOptions.global.scroll.interval * 1000
      })
    }
  }

  shouldComponentUpdate(nextProps) {
    const { uuid, operatorShow, layoutOptions } = this.props
    // 饼图因为有排序，需要单独对data进行判断
    return !_.isEqual(uuid, nextProps.uuid)
      || nextProps.operatorShow !== operatorShow
      || (nextProps.layoutOptions && !_.isEqual(nextProps.layoutOptions, layoutOptions))
  }

  componentDidUpdate(preProps) {
    const { data, scaleRate, layoutOptions } = this.props
    if (Array.isArray(data.dataArr)) {
      this.runDrawGraph(scaleRate !== preProps.scaleRate);
    }
    //开启轮播
    if (preProps.layoutOptions.global) {
      if (layoutOptions.global.scroll && layoutOptions.global.scroll.checked && this.isInit) {
        this.isInit = false
        this.start()
      }
      //轮播状态发生变化时
      if (layoutOptions.global.scroll.checked !== preProps.layoutOptions.global.scroll.checked) {
        this.isInit = true
        if (layoutOptions.global.scroll.checked) {
          this.isInit = false
          this.start()
        } else {
          this.isInit = true
          this.clear()
        }
      }
      //轮播间隔发生变化时
      if (layoutOptions.global.scroll.interval !== preProps.layoutOptions.global.scroll.interval && layoutOptions.global.scroll.checked) {
        this.isInit = false
        this.start()
      }
    }
  }

  componentWillUnmount() {
    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    if (this.graph) {
      this.graph.dispose()
    }
    //清空interval
    if (this.interval) clearInterval(this.interval)
  }

  render() {
    const { style } = this.props
    return <div className="graph-inner-box">
      <div className="graph-inner-box-wrap" style={style} ref={(node) => { this.graphNode = node }}></div>
    </div>
  }

  runDrawGraph(reInit) {
    const { scaleRate/* , platform */ } = this.props
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom/* , null, getEchartRenderer(platform) */)
      // if (platform !== 'mobile') {
      scaleChart(this.graph, scaleRate)
      // }
    }

    const options = this.getOptions()

    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)

    this.bindEvents()
  }

  bindEvents() {
    const { through, throughList, events, editable } = this.props
    this.graph.off('click')
    if (through) {
      this.graph.on('click', (arg) => {
        if (!editable && arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if (through) {
          events.onThrough('pie', arg)
        }
      })
    } else if (!editable && (!Array.isArray(throughList) || throughList.length === 0)) {
      // 必須非穿透狀態才联动
      const graphConnectClickEvent = (params) => {
        if (params.event && params.event.event && params.event.event.stopPropagation) {
          params.event.event.stopPropagation()
        }
        if (this.validConnect) {
          this._handleChange(params)
        }
      }
      if (!this.hasBindClickEvent) {
        this.graph.on('click', graphConnectClickEvent)
      }
    }
  }

  getOptions() {
    const { data, fullScreen, func_config, currentId, id, layoutOptions } = this.props
    const chartData = this._convertData()
    this.length = chartData.series.data.length
    // 联动刷选之后
    if (this.connectStore.chartRelated && (currentId === id)) {
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

    // 自定义 tootltip
    const options = tooltip({
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        trigger: 'item',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine
      },
      grid: window.DEFAULT_ECHARTS_OPTIONS.grid,
      toolbox: {
        show: this.props.operatorShow,
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
      legend: getLegendOption(layoutOptions.legend, chartData.legend),
      series: [
        chartData.series
      ]
    }, data.dataArr, fullScreen, data, this.graph, this.graphDom)

    // displayItem存在的情况
    if (Array.isArray(chartData.series.data) && func_config && func_config.display_item && func_config.display_item.show) {
      options.series[0].data = options.series[0].data.slice(0, func_config.display_item.value || 20)
    }
    return options
  }

  _convertData() {
    const seriesTmpl = { ...this.state.seriesTmpl }
    const { data, legendTheme, through, currentId, id, code, layoutOptions } = this.props
    const seriesData = Array.isArray(data.dataArr) ? data.dataArr.concat([]) : []
    const chartType = this._getCharType()

    if (chartType.type === 'pie') {
      seriesTmpl.type = 'pie'
      seriesTmpl.radius = chartType.circle ? [chartType.roseType ? '20%' : '35%', '55%'] : '55%'
      seriesTmpl.center = ['50%', '55%']
      seriesTmpl.roseType = chartType.roseType ? 'radius' : false
    } else {
      seriesTmpl.type = 'funnel'
      seriesTmpl.sort = 'none'
    }

    if (((!currentId || currentId === id) && data.dimsForRelated) || through) {
      seriesTmpl.cursor = 'pointer'
    }
    seriesTmpl.data = seriesData.map((item, i) => {
      const dataItem = {
        ...item,
        value: +item.value ? Number(+item.value).toFixed(2) : 0
      }
      // 下面两个 调用顺序不能改变, 否则会bug
      legendTheme && attachColorStyle({ type: seriesTmpl.type, code }, dataItem, legendTheme, i)
      if (chartType.type === 'pie') {
        attachPieLabelStyle(dataItem, layoutOptions.global, data)
      }
      return dataItem
    })


    return {
      legend: Array.isArray(data.dataArr) ? data.dataArr.map(item => item.name) : [],
      series: seriesTmpl
    }
  }

  _getCharType() {
    const { code } = this.props
    return {
      roseType: code === 'rose_pie' || code === 'circle_rose_pie',
      circle: code === 'circle_pie' || code === 'circle_rose_pie',
      type: ['pie', 'rose_pie', 'circle_pie', 'circle_rose_pie'].indexOf(code) > -1 ? 'pie' : 'funnel'
    }
  }
  //开启轮播
  start() {
    this.count = 0
    const { scrollSpeed } = this.state
    this.clear()
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

  //清楚轮播
  clear() {
    if (this.interval) clearInterval(this.interval)
  }

  //饼图被点击改变
  _handleChange(params) {
    //是否已经是处于选中状态 发起单图联动拼接conditions
    const { chartRelated, currentName } = this.connectStore
    const { data, id, currentId, events } = this.props
    const dim = data.dimsForRelated
    const conditions = []
    //如果当前数据集筛选中currentId为空 或者Id等于currentId就进行逻辑, 如果维度存在的情况下
    if ((!currentId || currentId === id) && dim) {
      this.hasBindClickEvent = true;
      this.validConnect = false
      if (chartRelated && params.name === currentName.name) {
        this.connectStore = {
          currentName: {},
          chartRelated: false
        }
        //恢复轮播
        // if (layoutOptions.global && layoutOptions.global.scroll.checked) this.start()
      } else {
        let condition = {}
        condition = { ...condition, col_value: params.name, col_name: dim.col_name, dim, operator: '=' }
        conditions.push(condition)

        this.connectStore = {
          currentName: params,
          chartRelated: true
        }
        //清空轮播
        // this.clear()
      }
      if (events.onChartChange) {
        events.onChartChange(conditions, id, () => {
          this.validConnect = true
          this.hasBindClickEvent = false; // 是否绑定事件
          this.bindEvents()
        })
      }
    }
  }
}

export default Pie;
