import PropTypes from 'prop-types';
import React, { Component } from 'react';
import echarts from 'echarts';
import _ from 'lodash';

import fmtSeries from '../../utils/fmtSeries';
import { formatDisplay } from '../../utils/generateDisplayFormat';

import markLine from '../extension/markLine';
import dataZoom from '../extension/dataZoom';
import tooltip from '../extension/tooltip';
import { attachColorStyle, scaleChart, getAxisLabelRotateAngle, getEchartRenderer } from '../../utils/echartOptionHelper';

class FlowBar extends Component {
  static propTypes = {
    code: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    clearSelect: PropTypes.bool,
    data: PropTypes.object,
    func_config: PropTypes.object,
    throughList: PropTypes.array,
    id: PropTypes.string,
    currentId: PropTypes.string,
    legendTheme: PropTypes.object,
    scaleRate: PropTypes.number,
    fullScreen: PropTypes.bool,
    events: PropTypes.shape({
      onChartChange: PropTypes.func,
      onThrough: PropTypes.func,
    }),
    operatorShow: PropTypes.bool,
    layoutOptions: PropTypes.object,
    through: PropTypes.bool,
    editable: PropTypes.bool,
    platform: PropTypes.string
  };

  static DEFAULT_OPTION = {
    stack: '总量'
  };

  constructor(props) {
    super(props)
    this.state = {
      seriesTmpl: {
        name: '增量',
        type: 'bar',
        stack: FlowBar.DEFAULT_OPTION.stack,
        itemStyle: {
          normal: {
            barBorderColor: 'rgba(0,0,0,0)',
            color: 'rgba(0,0,0,0)'
          },
          emphasis: {
            barBorderColor: 'rgba(0,0,0,0)',
            color: 'rgba(0,0,0,0)'
          }
        },
        data: [0, 1700, 1400, 1200, 300, 0]
      },
      operatorShow: props.operatorShow
    }
    this.getChart = () => this.graph
    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    this.connectStore = {
      currentName: {}, //缓存选中的区域
      chartRelated: false  //是否已触发联动
    };
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
    return !_.isEqual(uuid, nextProps.uuid)
      || nextProps.operatorShow !== operatorShow
      || (nextProps.layoutOptions && !_.isEqual(nextProps.layoutOptions, layoutOptions))
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
    options = tooltip(options, null, fullScreen, data, this.graph, this.graphDom, 'flow_bar')

    if (func_config) {
      // 辅助线
      if (func_config.markLine) {
        // 辅助线数据 + 配置信息
        const markerData = {
          data: func_config.markLine,
          y: layoutOptions.y.markline
        }

        options = markLine(options, markerData, false, data.displayFormat[data.primaryNum])
      }
      // 如果添加 datazoom. x轴的角度应该 rotate 为60
      if (func_config.thumbnail) {
        options.grid.bottom = 40
        options = dataZoom(options, this.graphDom)
      }
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
    }]

    const yAxis = [{
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
        axisPointer: {            // 坐标轴指示器，坐标轴触发有效
          type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
        }
      },
      toolbox: {
        show: this.state.operatorShow,
        top: 0,
        right: 60,
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
              const axisData = opt.xAxis[0].data
              const { series } = opt;
              let th = ''
              series.forEach((item) => {
                if (item.name !== '增量') {
                  th += `<td style="line-height: 24px">${item.name}</td>`
                }
              })
              let table = `<div class="table-view-wrap" style="overflow: auto;"><table style="width:100%;text-align:center;line-height: 24px;" class="data-view-table"><tbody><tr><td style="line-height: 24px">${dims}</td>${th}</tr>`;
              for (let i = 0, l = axisData.length; i < l; i++) {
                let value = ''
                series.forEach((item) => {
                  if (item.name !== '增量') {
                    value += `<td style="line-height: 24px">${item.data[i].value}</td>`
                  }
                })
                table += `<tr><td style="line-height: 24px">${axisData[i]}</td>${value}</tr>`;
              }
              table += '</tbody></table></div>';
              return table;
            }

          },
          saveAsImage: {
            show: true,
            title: '保存'
          }
        }
      },
      legend: {
        show: false,
        ...window.DEFAULT_ECHARTS_OPTIONS.lengend,
        data: chartData.legend,
        textStyle: window.DEFAULT_ECHARTS_OPTIONS.textStyle
      },
      grid: window.DEFAULT_ECHARTS_OPTIONS.grid,
      series: chartData.series
    }
    // setting前clone对象
    options.xAxis = _.cloneDeep(xAxis)
    options.yAxis = _.cloneDeep(yAxis)
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
      // 轴标签显示全部
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
    // 需要根据联动来设置颜色信息
    const { series, axis } = chartData
    const { legendTheme, code } = this.props
    let relatedIndex = -1
    if (this.connectStore.chartRelated) {
      relatedIndex = axis.indexOf(this.connectStore.currentName.name)
    }

    series.forEach((sery, i) => {
      if (i > 0 && legendTheme) {
        attachColorStyle({ type: 'flow_bar', code }, sery, legendTheme, i - 1, series.length - 1, relatedIndex)
        chartData.series[i] = {
          ...sery,
          itemStyle: {
            normal: {
              color: sery.data[0].itemStyle.normal.color
            }
          }
        }
      }
    })
    return chartData
  }

  _convertData() {
    let total = 0
    const series_data = []
    let _data = []
    let series = []
    const { data } = this.props
    const { seriesTmpl } = this.state
    const axis = []
    const legend = []
    const totalLegend = Object.assign({}, seriesTmpl)
    // 转成数据
    const dims = Object.entries(data.dims)
    /* 
    dims nums data 的数组长度是一样的。
    dims 
    用第一列的数据进行排序
    */
    const keys = data.nums && Object.keys(data.nums)

    keys && keys.forEach((item) => {
      const _series = Object.assign({}, seriesTmpl)

      legend.push(item)
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
    })

    axis.push(FlowBar.DEFAULT_OPTION.stack)

    totalLegend.data = [{ value: 0 }]

    Object.keys(data.nums).forEach((key) => {
      _data = []
      total = 0

      data.nums[key].forEach((num) => {
        let newNum = num ? parseFloat(typeof num === 'number' ? num.toFixed(1) : num) : 0
        if (Number.isNaN(newNum)) {
          newNum = 0
        }
        total += newNum
        _data.push({ value: newNum })
      })

      _data.push({ value: total })

      series_data.push({
        name: data.primaryNum,
        type: 'bar',
        stack: FlowBar.DEFAULT_OPTION.stack,
        label: {
          normal: {
            show: false,
            position: 'top'
          }
        },
        data: _data
      })
    })

    let num = 0
    for (let i = 0; i < _data.length - 2; i++) {
      num += _data[i].value

      totalLegend.data.push({
        value: num
      })
    }

    series.push(totalLegend)
    series = series.concat(series_data)

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
        events.onChartChange(conditions, id, (validConnect) => {
          this.validConnect = validConnect
          this.hasBindClickEvent = false
          this.bindEvents()
        })
      }
    }
  }
}

export default FlowBar;
