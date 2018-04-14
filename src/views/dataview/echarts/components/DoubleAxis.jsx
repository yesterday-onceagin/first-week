import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash';
import echarts from 'echarts';
import isEqual from 'lodash/isEqual';
import fmtSeries from '../../utils/fmtSeries';
import { formatDisplay } from '../../utils/generateDisplayFormat';

import markLine from '../extension/markLine';
import dataZoom from '../extension/dataZoom';
import tooltip from '../extension/tooltip';
import { attachColorStyle, scaleChart, getAxisLabelRotateAngle, getEchartRenderer } from '../../utils/echartOptionHelper'
import { getLegendOption, getGridOption } from '../../../../helpers/dashboardUtils'
import { DEFAULT_DIAGRAM_CONFIG } from '../../diagramConfig/constants/index'

window.echarts = echarts

class DoubleAxis extends React.Component {
  static propTypes = {
    code: PropTypes.string,
    data: PropTypes.object,
    clearSelect: PropTypes.bool,
    legendTheme: PropTypes.object,
    func_config: PropTypes.object,
    layoutOptions: PropTypes.object,
    mode: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    sort: PropTypes.string,
    events: PropTypes.shape({
      onSort: PropTypes.func,
      onChartChange: PropTypes.func,      // 联动
    }),
    editable: PropTypes.bool,
    operatorShow: PropTypes.bool,
    scaleRate: PropTypes.number,
    currentId: PropTypes.string,
    through: PropTypes.bool,
    fullScreen: PropTypes.bool,
    throughList: PropTypes.array,
    id: PropTypes.string,
    platform: PropTypes.string
  };

  //设置layoutOptions默认值,以防外面传入null
  static defaultProps = {
    layoutOptions: _.cloneDeep(DEFAULT_DIAGRAM_CONFIG.double_axis)
  };
  constructor(props) {
    super(props)
    //double Axis默認為Bar
    this.state = {
      seriesTmpl: {
        cursor: 'auto',
        name: '直接访问',
        type: 'bar',
        data: [320, 332, 301, 334, 390, 330, 320]
      },
      operatorShow: props.operatorShow
    }
    this.validConnect = true
    // 是否绑定事件
    this.hasBindClickEvent = false
    this.connectStore = {
      currentName: {}, //缓存选中的区域
      chartRelated: false  //是否已触发联动
    }
    // 暴露的static 方法
    this.getChart = () => this.graph
    // 重置辅助线
    this.resetMarkline = this.runDrawGraph

    if (props.clearSelect) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
        chartRelated: false
      }
    }
  }

  componentDidMount() {
    const { data } = this.props
    if (data) this.runDrawGraph()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.clearSelect || nextProps.id !== this.props.id) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
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
    const { uuid, operatorShow, layoutOptions } = this.props
    return !isEqual(uuid, nextProps.uuid)
      || nextProps.operatorShow !== operatorShow
      || (nextProps.layoutOptions && !isEqual(nextProps.layoutOptions, layoutOptions))
  }

  componentDidUpdate(preProps) {
    const { data, scaleRate } = this.props
    if (data) this.runDrawGraph(scaleRate !== preProps.scaleRate);
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
    const { seriesTmpl } = this.state
    const { data, scaleRate, func_config, fullScreen, through, currentId, layoutOptions, platform } = this.props
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
    // 自定义 tootltip
    options = tooltip(options, null, fullScreen, data, this.graph, this.graphDom, 'double_axis')
    // 重置 grid
    options.grid.containLabel = true

    // 辅助线 辅助线暂时以y轴为准
    if (_.get(func_config, 'markLine')) {
      // 辅助线数据 + 配置信息
      const markerData = {
        data: func_config.markLine,
        y: layoutOptions.y.markline,
        z: layoutOptions.z.markline,
        $el: this.graph,              // z轴 辅助线的长度 由 dom 宽度决定
        type: 'double_axis',
        margin: {
          left: layoutOptions.global.left,
          right: layoutOptions.global.right,
          top: layoutOptions.global.top,
          bottom: layoutOptions.global.bottom
        }
      }
      options = markLine(options, markerData, false, _.get(data, `displayFormat.${(data.axisNum)[0]}`))
    }
    // 如果添加 datazoom. x轴的角度应该 rotate 为60
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

  getOptions() {
    let chartData = this._convertData()
    chartData = this._applyColorStyle(chartData)

    const { data, layoutOptions } = this.props
    const dims = Object.keys(data.dims)[0]
    const xAxis = [{
      type: 'category',
      data: chartData.axis,
      axisLine: { ...window.DEFAULT_ECHARTS_OPTIONS.axisLine },
      axisLabel: {
        ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
        formatter: value => value
      },
      splitLine: {
        ...window.DEFAULT_ECHARTS_OPTIONS.splitLine,
        show: false
      },
      axisTick: { show: false }
    }]
    const max = this.generateMax(chartData.series[0].data)
    const yAxis = [{
      max,
      type: 'value',
      name: chartData.legend[0],
      axisLine: { ...window.DEFAULT_ECHARTS_OPTIONS.axisLine },
      splitLine: {
        ...window.DEFAULT_ECHARTS_OPTIONS.splitLine,
        show: false
      },
      axisLabel: {
        ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
        formatter: (value) => {
          const { axisNum, displayFormat } = data
          return formatDisplay(value, displayFormat[axisNum[0]])
        }
      },
      axisTick: { show: false }
    },
    {
      type: 'value',
      name: chartData.legend[1],
      axisLine: { ...window.DEFAULT_ECHARTS_OPTIONS.axisLine },
      splitLine: { show: false },
      axisLabel: {
        ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
        formatter: (value) => {
          const { axisNum, displayFormat } = data
          return formatDisplay(value, displayFormat[axisNum[1]])
        }
      },
      position: 'right',
      axisTick: { show: false }
    }]

    const options = {
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        trigger: 'axis',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine,
        axisPointer: {            // 坐标轴指示器，坐标轴触发有效
          type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
        }
      },
      toolbox: {
        show: this.state.operatorShow,
        right: 60,
        top: 0,
        iconStyle: {
          normal: { borderColor: '#698EBB' },
          emphasis: { borderColor: '#24BBF9' }
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
              const { series } = opt
              let th = ''
              series.forEach((item, i) => {
                if (i > 1) {
                  return
                }
                th += `<td style="line-height: 24px">${item.name}</td>`
              })
              let table = `<div class="table-view-wrap" style="overflow: auto;"><table style="width:100%;text-align:center;line-height: 24px;" class="data-view-table"><tbody><tr><td style="line-height: 24px">${dims}</td>${th}</tr>`;
              for (let i = 0, l = axisData.length; i < l; i++) {
                let value = ''
                series.forEach((item, index) => {
                  if (index > 1) {
                    return
                  }
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
            title: '保存为图'
          }
        }
      },
      // 图例: 传入layoutOption中的legend chartData中的legend
      legend: getLegendOption(layoutOptions.legend, chartData.legend),
      // 边距: 传入layoutOption中的global以及默认边距
      grid: getGridOption(layoutOptions.global, window.DEFAULT_ECHARTS_OPTIONS.grid),
      series: chartData.series,
      xAxis: _.cloneDeep(xAxis),
      yAxis
    }

    if (_.get(layoutOptions, 'x')) {
      const { label, axis } = layoutOptions.x
      // 设置轴线
      _.set(options.xAxis[0].axisLine, 'show', axis.show)
      _.set(options.xAxis[0].axisTick, 'show', axis.show)
      _.set(options.xAxis[0].axisLine, 'lineStyle.color', axis.color)
      // 设置轴标签
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
    options.yAxis[0] = _.cloneDeep(yAxis[0])
    options.yAxis[1] = _.cloneDeep(yAxis[1])
    if (_.get(layoutOptions, 'y')) {
      const { label, axis } = layoutOptions.y
      //设置轴线
      _.set(options.yAxis[0].axisLine, 'show', axis.show)
      _.set(options.yAxis[0].axisTick, 'show', axis.show)
      _.set(options.yAxis[0].axisLine.lineStyle, 'color', axis.color)
      //设置轴标签
      _.set(options.yAxis[0].axisLabel, 'show', label.show)
      _.set(options.yAxis[0].axisLabel, 'fontSize', label.size)
      _.set(options.yAxis[0].axisLabel, 'color', label.color)
      //设置name标签
      !axis.show && _.set(options.yAxis[0], 'name', '')
    }

    if (_.get(layoutOptions, 'z')) {
      const { label, axis } = layoutOptions.z
      //设置轴线
      _.set(options.yAxis[1].axisLine, 'show', axis.show)
      _.set(options.yAxis[1].axisTick, 'show', axis.show)
      _.set(options.yAxis[1].axisLine.lineStyle, 'color', axis.color)
      //设置轴标签
      _.set(options.yAxis[1].axisLabel, 'show', label.show)
      _.set(options.yAxis[1].axisLabel, 'fontSize', label.size)
      _.set(options.yAxis[1].axisLabel, 'color', label.color)
      //设置name标签
      !axis.show && _.set(options.yAxis[1], 'name', '')
    }
    return options
  }

  generateMax(list) {
    const array = []
    list.forEach((item) => {
      if (!Number.isNaN(+item.value)) {
        array.push(+item.value)
      }
    })
    return Math.max(...array)
  }

  _applyColorStyle(chartData) {
    // 需要根据联动来设置颜色信息
    const { series, axis } = chartData
    const { legendTheme, code } = this.props
    let relatedIndex = -1
    if (this.connectStore.chartRelated) {
      relatedIndex = axis.indexOf(this.connectStore.currentName.name)
    }
    legendTheme && attachColorStyle({ type: 'bar', code }, series[0], legendTheme, 0, series[0].length, relatedIndex)
    legendTheme && attachColorStyle({ type: 'line', code }, series[1], legendTheme, 1, series[1].length, relatedIndex)
    return chartData
  }

  // 判断类型 是否为条形图或堆叠图
  _getChartType() {
    const { code } = this.props
    return {
      horizon: code === 'horizon_bar' || code === 'horizon_stack_bar',
      stack: code === 'stack_bar' || code === 'horizon_stack_bar'
    }
  }

  _convertData() {
    const { data, layoutOptions } = this.props
    const { seriesTmpl } = this.state

    const legend = []
    const series = []
    const axis = []
    // 转成数据
    const dims = Object.entries(data.dims)
    // dims nums data 的数组长度是一样的。
    // dims 
    const keys = _.keys(data.nums)
    keys.forEach((item) => {
      legend.push(item)

      const _series = Object.assign({}, seriesTmpl, { stack: this._getChartType().stack })
      _series.name = item
      _series.data = data.nums[item].map(value => ({ value: fmtSeries(value) }))

      data.nums[item].forEach((d, key) => {
        const _axis = []
        dims.forEach((dim) => {
          _axis.push(dim[1][key])
        })
        //判断是否有再push
        if (_.findIndex(axis, x => x === _axis.join('&')) === -1) {
          axis.push(_axis.join('&'))
        }
      })
      series.push(_series)
    })
    //柱状图柱子背景赋值
    if (_.get(layoutOptions, 'global')) {
      const { barDistance, barBackground } = layoutOptions.global
      //获取series[0]的最大值
      const dataShadow = []
      const max = this.generateMax(series[0].data)
      series[0].data.forEach((item) => {
        dataShadow.push(max - item.value)
      })
      series.forEach((item) => {
        item.barCategoryGap = `${barDistance * 100}%`
      })
      const _series = {
        type: 'bar',
        itemStyle: {
          normal: {
            color: barBackground
          }
        },
        data: dataShadow,
        animation: false,
        stack: true
      }
      series.push(_series)
    }
    // 柱子值标签赋值
    if (_.get(layoutOptions, 'global.barLabel')) {
      const { barLabelDistance, barLabelColor, barLabelSize } = layoutOptions.global

      const label = {
        normal: {
          show: true,
          distance: barLabelDistance,
          fontSize: barLabelSize,
          color: barLabelColor,
          position: 'top',
          formatter: (params) => {
            const { axisNum, displayFormat } = data
            return formatDisplay(params.value, displayFormat[axisNum[0]])
          }
        }
      }
      series[0].label = label
    } else {
      series[0].label = {
        normal: {
          show: false
        }
      }
    }
    // 折线值标签
    if (_.get(layoutOptions, 'global.lineLabel')) {
      const { lineLabelDistance, lineLabelColor, lineLabelSize } = layoutOptions.global

      const label = {
        normal: {
          show: true,
          distance: lineLabelDistance,
          fontSize: lineLabelSize,
          color: lineLabelColor,
          position: 'top',
          formatter: (params) => {
            const { axisNum, displayFormat } = data
            return formatDisplay(params.value, displayFormat[axisNum[1]])
          }
        }
      }
      series[1].label = label
    } else {
      series[1].label = {
        normal: {
          show: false
        }
      }
    }

    // 折线样式
    if (_.get(layoutOptions, 'global')) {
      const { lineType, lineSize, lineItem, lineSmooth } = layoutOptions.global
      const lineStyle = {
        normal: {
          type: lineType,
          width: lineSize
        }
      }
      series[1].lineStyle = lineStyle
      series[1].symbolSize = lineItem * 2
      series[1].lineStyle = lineStyle
      series[1].smooth = lineSmooth
      series[1].showAllSymbol = true
    }

    series[0].stack = true
    series[1].yAxisIndex = 1
    series[1].type = 'line'
    return {
      legend,
      axis,
      series
    }
  }

  //柱状图被点击改变
  _handleChange(params) {
    //是否已经是处于选中状态 发起单图联动拼接conditions
    const { chartRelated, currentName } = this.connectStore
    const { data, id, currentId, events } = this.props
    const dims = data.dimsForRelated
    const conditions = []
    //如果当前数据集筛选中currentId为空 或者Id等于currentId就进行逻辑
    //2017-08-23 新增如果没有维度 则不联动的限制
    if ((!currentId || currentId === id) && dims && dims.length > 0) {
      this.hasBindClickEvent = true;
      this.validConnect = false
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
          //处理字符为 col_value为-的情况
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
          this.validConnect = true
          this.hasBindClickEvent = false
          this.bindEvents()
        })
      }
    }
  }
}

export default DoubleAxis;
