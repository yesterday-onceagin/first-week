import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts';
import _ from 'lodash';
import { attachColorStyle, scaleChart/* , getEchartRenderer */ } from '../../utils/echartOptionHelper';

import { formatDisplay } from '../../utils/generateDisplayFormat'

import tooltip from '../extension/tooltip';

class TreeMap extends React.Component {
  static propTypes = {
    code: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    data: PropTypes.object,
    events: {
      onChartChange: PropTypes.func      // 联动 
    },
    clearSelect: PropTypes.bool,
    currentId: PropTypes.string,
    editable: PropTypes.bool,
    layoutOptions: PropTypes.object,
    legendTheme: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object
    ]),
    fullScreen: PropTypes.bool,
    scaleRate: PropTypes.number,
    through: PropTypes.bool,
    throughList: PropTypes.array,
    platform: PropTypes.string,
    id: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {
      seriesTmpl: {
        type: 'treemap',
        roam: false, //是否开启拖拽漫游（移动和缩放）
        nodeClick: false, //点击节点后的行为,false无反应
        breadcrumb: {
          show: false
        },
        data: [],
        cursor: 'auto',
        label: { //描述了每个矩形中，文本标签的样式。
          normal: {
            show: true,
            position: 'inside'
          }
        }
      }
    }
    this.connectStore = {
      currentName: {}, //缓存选中的区域
      chartRelated: false  //是否已触发联动
    };
    // 暴露的static 方法
    this.getChart = () => this.graph
    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    if (props.clearSelect) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
        chartRelated: false
      }
    }
  }

  componentDidMount() {
    const { data } = this.props
    Array.isArray(data.dataArr) && this.runDrawGraph();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.clearSelect) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
        chartRelated: false
      }
    }
  }

  shouldComponentUpdate(nextProps) {
    const { uuid, layoutOptions } = this.props
    return !_.isEqual(uuid, nextProps.uuid) ||
      (nextProps.layoutOptions && !_.isEqual(nextProps.layoutOptions, layoutOptions))
  }

  componentDidUpdate(preProps) {
    const { data, scaleRate } = this.props
    if (Array.isArray(data.dataArr)) {
      this.runDrawGraph(scaleRate !== preProps.scaleRate);
    }
  }

  componentWillUnmount() {
    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    if (this.graph) {
      this.graph.dispose()
    }
  }

  render() {
    const { ...others } = this.props
    return <div className="graph-inner-box">
      <div className="graph-inner-box-wrap" style={others.style} ref={(node) => { this.graphNode = node }}></div>
    </div>
  }

  runDrawGraph(reInit) {
    const { scaleRate/* , platform */ } = this.props
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom/* , null, getEchartRenderer(platform) */)
      scaleChart(this.graph, scaleRate)
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
    const { data, fullScreen, currentId, id, scaleRate } = this.props
    const chartData = this._convertData()

    // 联动刷选之后
    if (this.connectStore.chartRelated && (currentId === id)) {
      chartData.series.data.forEach((item) => {
        const oldStyle = item.itemStyle
        item.itemStyle = {
          normal: {
            color: this.connectStore.currentName.name === item.name ? oldStyle.normal.color : '#666666',
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
      legend: {
        ...window.DEFAULT_ECHARTS_OPTIONS.lengend,
        show: false,
        data: chartData.legend,
        textStyle: window.DEFAULT_ECHARTS_OPTIONS.textStyle,
      },
      series: [
        chartData.series
      ]
    }, data.dataArr, fullScreen, data, this.graph, this.graphDom, 'treemap', scaleRate)

    // 当分类 》 10, 出现 scroll
    // if (Array.isArray(chartData.series.data) && chartData.series.data.length > 20) {
    //   options.series[0].data = options.series[0].data.sort((a, b) => (b.value - a.value)).slice(0, 20)
    // }

    return options
  }

  _convertData() {
    const { seriesTmpl } = this.state
    const { data, legendTheme, through, currentId, id, code, layoutOptions } = this.props
    const seriesData = Array.isArray(data.dataArr) ? data.dataArr : []

    if (((!currentId || currentId === id) && data.dimsForRelated) || through) {
      seriesTmpl.cursor = 'pointer'
    }

    seriesTmpl.data = seriesData.map((item, i) => {
      const dataItem = {
        ...item,
        name: item.name,
        value: +item.value ? Number(+item.value).toFixed(2) : 0,
        label: {
          normal: {
            formatter: (params) => {
              const { displayFormat } = data
              let { value } = params
              if (displayFormat) {
                const keys = Object.keys(displayFormat)
                if (keys.length > 0) {
                  value = formatDisplay(value, displayFormat[keys[0]])
                }
              }
              return `${params.name}: ${value}`
            },
          }
        }
      }

      legendTheme && attachColorStyle({ type: seriesTmpl.type, code }, dataItem, legendTheme, i)
      if (code === 'treemap') {
        const { label } = layoutOptions.global
        _.set(dataItem, 'label.normal.color', label.color)
        _.set(dataItem, 'label.normal.fontSize', label.fontSize)
      }

      return dataItem
    })

    return {
      legend: Array.isArray(data.dataArr) ? data.dataArr.map(item => item.name) : [],
      series: seriesTmpl
    }
  }

  _formatName(name) {
    return name.replace(/(.{5})/g, '$1\n')
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
      } else {
        let condition = {}
        condition = { ...condition, col_value: params.name, col_name: dim.col_name, dim, operator: '=' }
        conditions.push(condition)

        this.connectStore = {
          currentName: params,
          chartRelated: true
        }
      }
      if (events.onChartChange) {
        events.onChartChange(conditions, id, (validConnect) => {
          this.validConnect = validConnect
          this.hasBindClickEvent = false; // 是否绑定事件
          this.bindEvents()
        })
      }
    }
  }
}

export default TreeMap;
