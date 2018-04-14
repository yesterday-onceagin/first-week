import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts';
import isEqual from 'lodash/isEqual';
import fmtSeries from '../../utils/fmtSeries';
import { formatDisplay } from '../../utils/generateDisplayFormat';
import markLine from '../extension/markLine'
import dataZoom from '../extension/dataZoom'
import tooltip from '../extension/tooltip'
import _ from 'lodash';

import { attachColorStyle, scaleChart, getAxisLabelRotateAngle, getEchartRenderer } from '../../utils/echartOptionHelper'
import { getLegendOption, getGridOption } from '../../../../helpers/dashboardUtils'

window.echarts = echarts

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

class Column extends React.Component {
  static HORIZON_TYPE = ['horizon_bar', 'horizon_stack_bar'];

  static propTypes = {
    code: PropTypes.string,
    data: PropTypes.object,
    clearSelect: PropTypes.bool,
    legendTheme: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object
    ]),
    layoutOptions: PropTypes.object,
    func_config: PropTypes.object,
    mode: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    sort: PropTypes.string,
    events: PropTypes.shape({
      onSort: PropTypes.func,
      onChartChange: PropTypes.func,
    }),
    scaleRate: PropTypes.number,
    currentId: PropTypes.string,
    through: PropTypes.bool,
    fullScreen: PropTypes.bool,
    editable: PropTypes.bool,
    throughList: PropTypes.array,
    operatorShow: PropTypes.bool,
    id: PropTypes.string,
    platform: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {
      seriesTmpl: {
        cursor: 'auto',
        name: '直接访问',
        type: 'bar',
        data: [320, 332, 301, 334, 390, 330, 320]
      },
      operatorShow: props.operatorShow
    }
    // 暴露static
    this.getChart = () => this.graph
    this.connectStore = {
      currentName: {},
      chartRelated: false
    }
    this.validConnect = true;
    this.hasBindClickEvent = false;
  }

  componentDidMount() {
    const { data } = this.props
    if (data) this.runDrawGraph()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.clearSelect) {
      this.connectStore = {
        currentName: {},
        chartRelated: false
      }
    }
    if (nextProps.operatorShow !== this.props.operatorShow) {
      this.setState({
        operatorShow: nextProps.operatorShow
      })
    }
  }

  shouldComponentUpdate(nextProps) {
    const { uuid, layoutOptions, operatorShow } = nextProps
    return !isEqual(uuid, this.props.uuid)
      || this.props.operatorShow !== operatorShow
      || (layoutOptions && !isEqual(layoutOptions, this.props.layoutOptions))
  }

  componentDidUpdate(preProps) {
    const { data, scaleRate, layoutOptions } = this.props
    if (data) {
      const isReinit = (layoutOptions && !isEqual(layoutOptions, preProps.layoutOptions))
      this.runDrawGraph((scaleRate !== preProps.scaleRate) || isReinit)
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

  runDrawGraph(reInit) {
    const { seriesTmpl } = this.state
    const { data, scaleRate, func_config, fullScreen, through, currentId, code, layoutOptions, platform } = this.props
    const chartType = this._getChartType()
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, getEchartRenderer(platform))
      if (platform !== 'mobile') {
        scaleChart(this.graph, scaleRate)
      }
    }

    if (through || (!currentId || currentId === this.props.id)) {
      seriesTmpl.cursor = 'pointer';
    }

    let options = this.getOptions()
    // tootltip
    options = tooltip(options, null, fullScreen, data, this.graph, this.graphDom)

    // 辅助线 配置 升级 
    if (_.get(func_config, 'markLine')) {
      // 辅助线数据 + 配置信息
      const markerData = {
        data: func_config.markLine,
        x: layoutOptions.x.markline,
        y: layoutOptions.y.markline
      }
      // 是否是水平条形图
      const horizon = Column.HORIZON_TYPE.indexOf(code) > -1

      options = markLine(options, markerData, horizon, _.get(data, `displayFormat.${data.primaryNum}`))
    }
    // 如果有缩略轴
    if (_.get(func_config, 'thumbnail') && !chartType.horizon) {
      options.grid.bottom = 40
      options = dataZoom(options, this.graphDom, func_config.thumbnail_value)
    }
    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
    this.bindEvents()
  }

  bindEvents() {
    const { through, throughList, events, editable } = this.props
    this.graph.off('click')
    this.graph.off('legendselectchanged')

    if (through) {
      const graphThroughEvent = (arg) => {
        if (!editable && arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if (arg.componentType === 'markLine' || !through) {
          return;
        }
        events.onThrough('cluster_column', arg)
      }
      this.graph.on('click', graphThroughEvent)
    } else if (!editable && (!Array.isArray(throughList) || throughList.length === 0)) {
      // 绑定点击事件
      const graphConnectClickEvent = (arg) => {
        if (arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if (arg.componentType !== 'markLine' && this.validConnect) {
          this._handleChange(arg)
        }
      }
      if (!Column.hasBindClickEvent) {
        this.graph.on('click', graphConnectClickEvent)
      }
    }

    // 点击legend的时候需要适配背景
    this.graph.on('legendselectchanged', (params) => {
      if (this._getChartType().stack) {
        return
      }
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

  getOptions() {
    let chartData = this._convertData()
    chartData = this._applyColorStyle(chartData)

    const { data, layoutOptions, legendTheme } = this.props
    const { operatorShow } = this.state
    const dims = _.keys(data.dims)[0]
    //用作toolbox过滤掉用作背景色的柱子
    const { length } = _.keys(data.nums)
    const xAxis = [{
      type: 'category',
      data: chartData.axis,
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
    }]
    const yAxis = [{
      max: chartData.maxV,
      type: 'value',
      axisLine: {
        ...window.DEFAULT_ECHARTS_OPTIONS.axisLine
      },
      splitLine: window.DEFAULT_ECHARTS_OPTIONS.splitLine,
      axisLabel: {
        ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
        formatter: (value) => {
          const { primaryNum, displayFormat } = data
          return formatDisplay(value, displayFormat[primaryNum])
        }
      },
      axisTick: {
        show: false
      }
    }]
    const options = {
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        trigger: 'axis',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine,
        axisPointer: {
          type: 'shadow'
        }
      },
      toolbox: {
        show: operatorShow,
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
              let axisData = []
              if (this._getChartType().horizon) {
                axisData = opt.yAxis[0].data
              } else {
                axisData = opt.xAxis[0].data
              }
              const { series } = opt;
              let th = ''
              series.forEach((item, i) => {
                if (i > length - 1) return
                th += `<td style="line-height: 24px">${item.name}</td>`
              })
              let table = `<div class="table-view-wrap" style="overflow: auto;"><table style="width:100%;text-align:center;line-height: 24px;" class="data-view-table"><tbody><tr><td style="line-height: 24px">${dims}</td>${th}</tr>`;
              for (let i = 0, l = axisData.length; i < l; i++) {
                let value = ''
                series.forEach((item, index) => {
                  if (index > length - 1) return
                  value += `<td style="line-height: 24px">${item.data[i].value}</td>`
                })
                table += `<tr><td style="line-height: 24px">${axisData[i]}</td>${value}</tr>`;
              }
              table += '</tbody></table></div>';
              return table;
            }

          },
          saveAsImage: {
            show: true,
            title: '下载为图'
          }
        }
      },
      // 图例: 传入layoutOption中的legend chartData中的legend
      legend: getLegendOption(layoutOptions.legend, chartData.legend, legendTheme),
      // 边距: 传入layoutOption中的global以及默认边距
      grid: getGridOption(layoutOptions.global, window.DEFAULT_ECHARTS_OPTIONS.grid),
      series: chartData.series
    }

    if (this._getChartType().horizon) {
      options.xAxis = _.cloneDeep(yAxis)
      options.yAxis = _.cloneDeep(xAxis)
    } else {
      options.xAxis = _.cloneDeep(xAxis)
      options.yAxis = _.cloneDeep(yAxis)
    }
    // x轴设置
    if (_.get(layoutOptions, 'x')) {
      const { label, axis } = layoutOptions.x
      // 轴线
      _.set(options.xAxis[0].axisLine, 'show', axis.show)
      _.set(options.xAxis[0].axisTick, 'show', axis.show)
      _.set(options.xAxis[0].axisLine, 'lineStyle.color', axis.color)
      // 轴标签
      _.set(options.xAxis[0].axisLabel, 'show', label.show)
      _.set(options.xAxis[0].axisLabel, 'fontSize', label.size)
      _.set(options.xAxis[0].axisLabel, 'color', label.color)
      // 轴标签是否显示全部
      _.set(options.xAxis[0].axisLabel, 'interval', label.showAll ? 0 : 'auto')
      // 轴标签角度
      const rotateAngle = getAxisLabelRotateAngle(label.angle, 'x')
      if (rotateAngle !== null) {
        _.set(options.xAxis[0].axisLabel, 'rotate', rotateAngle);
      }
    }
    // y轴设置
    if (_.get(layoutOptions, 'y')) {
      const { label, axis } = layoutOptions.y
      // 轴线
      _.set(options.yAxis[0].axisLine, 'show', axis.show)
      _.set(options.yAxis[0].axisTick, 'show', axis.show)
      _.set(options.yAxis[0].axisLine, 'lineStyle.color', axis.color)
      // 轴标签
      _.set(options.yAxis[0].axisLabel, 'show', label.show)
      _.set(options.yAxis[0].axisLabel, 'fontSize', label.size)
      _.set(options.yAxis[0].axisLabel, 'color', label.color)
      // 轴标签角度
      const rotateAngle = getAxisLabelRotateAngle(label.angle, 'y')
      if (rotateAngle !== null) {
        _.set(options.yAxis[0].axisLabel, 'rotate', rotateAngle);
      }
    }
    return options
  }

  _applyColorStyle(chartData) {
    const { series, axis } = chartData
    const { legendTheme, code } = this.props
    let relatedIndex = -1
    if (this.connectStore.chartRelated) {
      relatedIndex = axis.indexOf(this.connectStore.currentName.name)
    }
    // 因为series的背景柱子不应该设置colorTheme
    const lastIndex = this._getChartType().stack ? (series.length - 2) : ((series.length / 2) - 1)
    series.forEach((sery, i) => {
      if (i <= lastIndex) {
        legendTheme && attachColorStyle({ type: 'bar', code }, sery, legendTheme, i, lastIndex + 1, relatedIndex)
      }
    })
    return chartData
  }

  // 获取类型vertical or horizon
  _getChartType() {
    const { code } = this.props
    return {
      horizon: code === 'horizon_bar' || code === 'horizon_stack_bar',
      stack: code === 'stack_bar' || code === 'horizon_stack_bar'
    }
  }

  generateMax(list) {
    const array = []
    list.forEach((item) => {
      array.push(item.value)
    })
    return Math.max(...array)
  }

  _convertData() {
    const { data, layoutOptions } = this.props
    const { seriesTmpl } = this.state

    const legend = []
    const series = []
    const axis = []
    const dims = Object.entries(data.dims)
    const keys = _.keys(data.nums)
    const chartType = this._getChartType()

    keys.forEach((item) => {
      legend.push(item)

      const _series = Object.assign({}, seriesTmpl, { stack: chartType.stack })
      _series.name = item
      _series.data = data.nums[item].map(value => ({ value: fmtSeries(value) }))

      data.nums[item].forEach((d, key) => {
        const _axis = []
        dims.forEach((dim) => {
          _axis.push(dim[1][key])
        })
        // 判断是否有再push
        if (_.findIndex(axis, x => x === _axis.join('&')) === -1) {
          axis.push(_axis.join('&'))
        }
      })

      series.push(_series)
    })

    const dataLen = series.length  //记录不包含 背景色的柱子

    const maxV = __getNumsMax(data.nums, chartType.stack)
    
    if (_.get(layoutOptions, 'global')) {
      const { barDistance, barBackground } = layoutOptions.global
      // 添加模拟背景色柱子
      const backgroundSery = {
        name: '_background_',    // 这个名字不能改, 在tooltip中需要标识
        type: 'bar',
        [chartType.horizon ? 'yAxisIndex' : 'xAxisIndex']: 1,
        z: -1,
        itemStyle: {
          normal: {
            color: barBackground
          }
        },
        data: _.fill(Array(data.nums[keys[0]].length), maxV)
      }
      // 堆叠
      if (chartType.stack) {
        series.push(backgroundSery)
      } else {
        for (let i = 0; i < keys.length; i++) {
          series.push(backgroundSery)
        }
      }

      series.forEach((item) => {
        item.barCategoryGap = `${barDistance * 100}%`
      })
    }

    // 值标签
    if (_.get(layoutOptions, 'global.barLabel')) {
      const { barLabelDistance, barLabelColor, barLabelSize, barLabelType, barLabelAlign } = layoutOptions.global
      let position = ''
      let distance = 5
      if (chartType.stack) {
        position = barLabelType
        distance = 5
      } else if (chartType.horizon) {
        position = 'right'
        if (barLabelAlign === 'inside') {
          position = 'inside'
        }
        distance = barLabelDistance
      } else {
        position = 'top'
        distance = barLabelDistance
      }
      series.forEach((item, i) => {
        // 目前只有条形图可以设置label靠右边, 需要显示到背景的柱子上
        if (barLabelAlign === 'right' && i >= dataLen) {
          const label = {
            normal: {
              distance: 5,
              rotate: 0,
              position,
              show: true,
              fontSize: barLabelSize,
              color: barLabelColor,
              formatter: (params) => {
                const { dataIndex, seriesIndex } = params
                const realSeryIndex = seriesIndex - dataLen
                const realSery = series[realSeryIndex]
                let value = '--'
                if (realSery) {
                  value = typeof realSery.data[dataIndex] === 'object' ? realSery.data[dataIndex].value : value
                  const { axisNum, displayFormat } = data
                  value = formatDisplay(value, displayFormat[axisNum[realSeryIndex]], true)
                }
                return value
              }
            }
          }
          item.label = label
        } else if (barLabelAlign === 'right' && i < dataLen) {
          item.label = {
            normal: {
              show: false
            }
          }
        } else if (barLabelAlign !== 'right' && i < dataLen) {
          const label = {
            normal: {
              distance,
              rotate: 0,
              position,
              show: true,
              fontSize: barLabelSize,
              color: barLabelColor,
              formatter: (params) => {
                const { axisNum, displayFormat } = data
                return formatDisplay(params.value, displayFormat[axisNum[i]], true)
              }
            }
          }
          item.label = label
        } else if (barLabelAlign !== 'right' && i >= dataLen) {
          item.label = {
            normal: {
              show: false
            }
          }
        }
      })
    } else {
      series.forEach((item) => {
        item.label = {
          normal: {
            show: false
          },
          emphasis: {
            show: false
          }
        }
      })
    }
    return {
      legend,
      axis,
      series,
      maxV
    }
  }

  // 操作值变化
  _handleChange(params) {
    const { chartRelated, currentName } = this.connectStore
    const { data, id, currentId, events } = this.props
    const dims = data.dimsForRelated
    const conditions = []

    //如果当前数据集筛选中currentId为空 或者Id等于currentId就进行逻辑
    //2017-08-23 新增如果没有维度 则不联动的限制
    if ((!currentId || currentId === id) && dims && dims.length > 0) {
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
      if (events.onChartChange) {
        events.onChartChange(conditions, id, () => {
          this.hasBindClickEvent = false
          this.validConnect = true
          this.bindEvents()
        })
      }
    }
  }
}

export default Column;
