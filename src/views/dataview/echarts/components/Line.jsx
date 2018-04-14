import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import echarts from 'echarts';
import '../../../../constants/echart';

import fmtSeries from '../../utils/fmtSeries';
import { formatDisplay } from '../../utils/generateDisplayFormat';
import { attachColorStyle, scaleChart, attachLineStyle, attachLabelValueStyle, getEchartRenderer } from '../../utils/echartOptionHelper'
import { getLegendOption, getGridOption } from '../../../../helpers/dashboardUtils'

import markLine from '../extension/markLine';
import dataZoom from '../extension/dataZoom';
import tooltip from '../extension/tooltip';

class Line extends React.Component {
  static propTypes = {
    code: PropTypes.string,
    data: PropTypes.object,
    clearSelect: PropTypes.bool,
    legendTheme: PropTypes.object,
    scaleRate: PropTypes.number,
    through: PropTypes.bool,
    fullScreen: PropTypes.bool,
    events: PropTypes.shape({
      onSort: PropTypes.func,
      onThrough: PropTypes.func,
      onChartChange: PropTypes.func,  // 联动
    }),
    layoutOptions: PropTypes.object,
    func_config: PropTypes.object,
    operatorShow: PropTypes.bool,
    mode: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    sort: PropTypes.string,
    throughList: PropTypes.array,
    id: PropTypes.string,
    currentId: PropTypes.string,
    platform: PropTypes.string,
    editable: PropTypes.bool
  };

  constructor(props) {
    super(props)
    this.state = {
      theme: 'vintage',
      seriesTmpl: {
        cursor: 'auto',
        name: '邮件营销',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230, 210]
      },
      sort: window.DEFAULT_ECHARTS_OPTIONS.sort_method.findIndex(item => item === props.sort), // 无排序、升序、降序、
    }

    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    this.connectStore = {
      currentName: {}, // 缓存选中的区域
      chartRelated: false  // 是否已触发联动
    };
    // 暴露的static 方法
    this.getChart = () => this.graph
  }

  componentDidMount() {
    const { data } = this.props
    if (data) {
      this.runDrawGraph();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.clearSelect || nextProps.id !== this.props.id) {
      this.connectStore = {
        currentName: {}, // 缓存选中的列
        chartRelated: false
      }
    }
  }

  shouldComponentUpdate(nextProps) {
    const { uuid, layoutOptions, operatorShow } = this.props
    return !_.isEqual(uuid, nextProps.uuid)
      || nextProps.operatorShow !== operatorShow
      || (nextProps.layoutOptions && !_.isEqual(nextProps.layoutOptions, layoutOptions))
  }

  componentDidUpdate(preProps) {
    const { data, scaleRate } = this.props
    if (data) this.runDrawGraph(scaleRate !== preProps.scaleRate)
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
    const { data, through, func_config, fullScreen, scaleRate, layoutOptions, platform } = this.props
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, getEchartRenderer(platform))
      if (platform !== 'mobile') {
        scaleChart(this.graph, scaleRate)
      }
    }

    if (through) {
      seriesTmpl.cursor = 'pointer';
    }

    let options = this.getOptions()

    if (func_config) {
      // 辅助线
      if (func_config.markLine) {
        // 辅助线数据 + 配置信息
        const markerData = {
          data: func_config.markLine,
          y: layoutOptions.y.markline
        }
        options = markLine(options, markerData, false, data.displayFormat && data.displayFormat[data.primaryNum])
      }
      // 如果添加 datazoom. x轴的角度应该 rotate 为60
      if (func_config.thumbnail) {
        options.grid.bottom = 40
        options = dataZoom(options, this.graphDom, func_config.thumbnail_value)
      }
    }
    // 自定义 tootltip
    options = tooltip(options, null, fullScreen, data, this.graph, this.graphDom)
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
        if (arg.componentType === 'markLine' || !this.props.through) {
          return;
        }
        events.onThrough('line', arg)
      })
    } else if (!editable && (!Array.isArray(throughList) || throughList.length === 0)) {
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

  _applyColorStyle(chartData) {
    // 需要根据联动来设置颜色信息
    const { series, xAxis } = chartData
    const { legendTheme, code, currentId, id } = this.props
    // console.log('_applyColorStyle', id)
    let relatedIndex = -1
    if (this.connectStore.chartRelated && (currentId === id)) {
      relatedIndex = xAxis.indexOf(this.connectStore.currentName.name)
      // console.log('_applyColorStyle', relatedIndex)
    }
    series.forEach((item, i) => {
      // console.log(item)
      legendTheme && attachColorStyle({ type: 'line', code }, item, legendTheme, i, series.length, relatedIndex)
    })
    // console.log(chartData)
    return chartData
  }

  getOptions() {
    const { currentId, id } = this.props
    const chart_data = this._convertData()
    //this._applyColorStyle(chart_data)
    // console.log('getOptions', id)
    //联动刷选之后
    if (this.connectStore.chartRelated && (currentId === id)) {
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
    const { data, layoutOptions } = this.props
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
          return formatDisplay(value, displayFormat[primaryNum])
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
      // 图例: 传入layoutOption中的legend chartData中的legend
      legend: getLegendOption(layoutOptions.legend, chart_data.legend),
      grid: getGridOption(layoutOptions.global, window.DEFAULT_ECHARTS_OPTIONS.grid),
      xAxis: _.cloneDeep(xAxis),
      yAxis: _.cloneDeep(yAxis),
      series: chart_data.series
    }
    // x轴设置
    if (layoutOptions && layoutOptions.x) {
      const { label, axis } = layoutOptions.x
      // 轴线
      _.set(options.xAxis.axisLine, 'show', axis.show)
      _.set(options.xAxis.axisTick, 'show', axis.show)
      _.set(options.xAxis.axisLine, 'lineStyle.color', axis.color)
      // 轴标签
      _.set(options.xAxis.axisLabel, 'show', label.show)
      _.set(options.xAxis.axisLabel, 'fontSize', label.size)
      _.set(options.xAxis.axisLabel, 'color', label.color)
      // 轴标签是否显示全部
      _.set(options.xAxis.axisLabel, 'interval', label.showAll ? 0 : 'auto')
      // 轴标签角度
      switch (label.angle) {
        case 'horizon':
          _.set(options.xAxis.axisLabel, 'rotate', 0);
          break;
        case 'italic':
          _.set(options.xAxis.axisLabel, 'rotate', 45);
          break;
        case 'vertical':
          _.set(options.xAxis.axisLabel, 'rotate', 90);
          break;
        default:
          break;
      }
    }
    // y轴设置
    if (layoutOptions && layoutOptions.y) {
      const { label, axis } = layoutOptions.y
      // 轴线
      _.set(options.yAxis.axisLine, 'show', axis.show)
      _.set(options.yAxis.axisTick, 'show', axis.show)
      _.set(options.yAxis.axisLine, 'lineStyle.color', axis.color)
      // 轴标签
      _.set(options.yAxis.axisLabel, 'show', label.show)
      _.set(options.yAxis.axisLabel, 'fontSize', label.size)
      _.set(options.yAxis.axisLabel, 'color', label.color)
      // 轴标签角度
      switch (label.angle) {
        case 'horizon':
          _.set(options.yAxis.axisLabel, 'rotate', 0);
          break;
        case 'italic':
          _.set(options.yAxis.axisLabel, 'rotate', -45);
          break;
        case 'vertical':
          _.set(options.yAxis.axisLabel, 'rotate', 90);
          break;
        default:
          break;
      }
    }
    return options
  }

  _convertData() {
    const { data, legendTheme, currentId, id, through, code, layoutOptions } = this.props
    const { seriesTmpl } = this.state

    if (((!currentId || currentId === id) && data.dimsForRelated) || through) {
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

      const _series = Object.assign({}, seriesTmpl, { stack: this._getChartType().stack })
      _series.name = item
      _series.data = [].concat(data.nums[item])
      _series.data = _series.data.map(value => fmtSeries(value))

      _series.showAllSymbol = true

      legendTheme && attachColorStyle({ type: seriesTmpl.type, code }, _series, legendTheme, i)
      if (layoutOptions.global) {
        attachLineStyle(_series, layoutOptions.global)
        attachLabelValueStyle(_series, layoutOptions.global.lineLabel, data)
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
    const { data, id, currentId, events } = this.props
    const dims = data.dimsForRelated
    const conditions = []

    // 如果当前数据集筛选中currentId为空 或者Id等于currentId就进行逻辑
    if (!currentId || currentId === id) {
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

export default Line;
