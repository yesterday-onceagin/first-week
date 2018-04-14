import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts';
import _ from 'lodash';
import { formatDisplay } from '../../utils/generateDisplayFormat';
import fmtSeries from '../../utils/fmtSeries';
import { attachColorStyle, scaleChart, attachLineStyle, attachLabelValueStyle, getAxisLabelRotateAngle, getEchartRenderer } from '../../utils/echartOptionHelper';
import { getLegendOption, getGridOption } from '../../../../helpers/dashboardUtils'

import markLine from '../extension/markLine';
import dataZoom from '../extension/dataZoom';
import tooltip from '../extension/tooltip';

class Area extends React.Component {
  static propTypes = {
    code: PropTypes.string,
    data: PropTypes.object,
    clearSelect: PropTypes.bool,
    func_config: PropTypes.object,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    throughList: PropTypes.array,
    id: PropTypes.string,
    currentId: PropTypes.string,
    events: PropTypes.shape({
      onChartChange: PropTypes.func, // 联动
      onThrough: PropTypes.func
    }),
    legendTheme: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object
    ]),
    scaleRate: PropTypes.number,
    through: PropTypes.bool,
    fullScreen: PropTypes.bool,
    editable: PropTypes.bool,
    operatorShow: PropTypes.bool,
    layoutOptions: PropTypes.object,
    platform: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {
      seriesTmpl: {
        name: '联盟广告',
        type: 'line',
        cursor: 'auto',
        data: [220, 182, 191, 234, 290, 330, 310]
      }
    }
    this.validConnect = true;  // 联动是否有效
    this.hasBindClickEvent = false; // 是否绑定事件
    // 暴露的static 方法
    this.getChart = () => this.graph
    this.connectStore = {
      currentName: {}, //缓存选中的区域
      chartRelated: false  //是否已触发联动
    }
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
        currentName: {}, //缓存选中的列
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
    if (data) {
      this.runDrawGraph(scaleRate !== preProps.scaleRate)
    }
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
    const { data, scaleRate, func_config, fullScreen, currentId, id, through, layoutOptions, platform } = this.props
    
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, getEchartRenderer(platform))
      if (platform !== 'mobile') {
        scaleChart(this.graph, scaleRate)
      }
    }
    

    if (through || (!currentId || currentId === id)) {
      seriesTmpl.cursor = 'pointer';
    }

    let options = this.getOptions()

    if (func_config) {
      // 辅助线
      if (func_config.markLine) {
        // 辅助线数据 + 配置信息
        const markerData = {
          data: func_config.markLine,
          y: layoutOptions.y.markline,
        }
        options = markLine(options, markerData, false, _.get(data, `displayFormat.${data.primaryNum}`))
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
    const { events, through, throughList, editable } = this.props
    this.graph.off('click')
    if (through) {
      this.graph.on('click', (arg) => {
        if (!editable && arg.event && arg.event.event && arg.event.event.stopPropagation) {
          arg.event.event.stopPropagation()
        }
        if (arg.componentType === 'markLine' || !through) {
          return;
        }
        events.onThrough('area', arg)
      })
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
    const chartData = this._convertData()
    const { data, layoutOptions, code, operatorShow, currentId, id } = this.props
    const dims = data.dimsForRelated.alias_name

    // 联动刷选之后
    if (this.connectStore.chartRelated && (currentId === id)) {
      chartData.series.forEach((item, i) => {
        const activeStyleFromTheme = attachColorStyle({ type: 'area', code }, {}, this.props.legendTheme, i)
        const itemStyle = {
          normal: {
            color: (params) => {
              // 设置选中color
              const colorList = [
                activeStyleFromTheme.itemStyle.normal.color, '#666666'
              ];
              if (this.connectStore.currentName.name) {
                if (params.name === this.connectStore.currentName.name) {
                  return colorList[0]
                }
                return colorList[1]
              }
              return activeStyleFromTheme.itemStyle.normal.color
            }
          }
        }
        const symbolSize = (value, params) => {
          if (this.connectStore.currentName.name === params.name) {
            return 10
          }
          return 4
        }
        item.showAllSymbol = true
        item.symbolSize = symbolSize
        item.itemStyle = itemStyle
      })
    }

    const options = {
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        trigger: 'axis',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine
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
          dataZoom: {
            show: true
          },
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
            show: true
          }
        }
      },
      // 图例: 传入layoutOption中的legend chartData中的legend
      legend: getLegendOption(layoutOptions.legend, chartData.legend),
      grid: getGridOption(layoutOptions.global, window.DEFAULT_ECHARTS_OPTIONS.grid),
      xAxis: [{
        type: 'category',
        boundaryGap: false,
        axisLine: window.DEFAULT_ECHARTS_OPTIONS.axisLine,
        axisLabel: {
          ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
          formatter: value => value
        },
        data: chartData.xAxis,
        axisTick: {
          show: false
        }
      }],
      yAxis: [{
        type: 'value',
        axisLine: window.DEFAULT_ECHARTS_OPTIONS.axisLine,
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
      }],
      series: chartData.series
    }
    // setting前clone对象
    options.xAxis = _.cloneDeep(options.xAxis)
    options.yAxis = _.cloneDeep(options.yAxis)
    // x轴设置 
    if (_.get(layoutOptions, 'x')) {
      const { label, axis } = layoutOptions.x
      //轴线
      _.set(options.xAxis[0].axisLine, 'show', axis.show)
      _.set(options.xAxis[0].axisTick, 'show', axis.show)
      _.set(options.xAxis[0].axisLine, 'lineStyle.color', axis.color)
      //轴标签
      _.set(options.xAxis[0].axisLabel, 'show', label.show)
      _.set(options.xAxis[0].axisLabel, 'fontSize', label.size)
      _.set(options.xAxis[0].axisLabel, 'color', label.color)
      //轴标签角度、显示全部
      _.set(options.xAxis[0].axisLabel, 'interval', label.showAll ? 0 : 'auto')
      // 周标签角度
      const rotateAngle = getAxisLabelRotateAngle(label.angle, 'x')
      if (rotateAngle !== null) {
        _.set(options.xAxis[0].axisLabel, 'rotate', rotateAngle);
      }
    }
    //y轴设置
    if (_.get(layoutOptions, 'y')) {
      const { label, axis } = layoutOptions.y
      //轴线
      _.set(options.yAxis[0].axisLine, 'show', axis.show)
      _.set(options.yAxis[0].axisTick, 'show', axis.show)
      _.set(options.yAxis[0].axisLine, 'lineStyle.color', axis.color)
      //轴标签
      _.set(options.yAxis[0].axisLabel, 'show', label.show)
      _.set(options.yAxis[0].axisLabel, 'fontSize', label.size)
      _.set(options.yAxis[0].axisLabel, 'color', label.color)
      // 周标签角度
      const rotateAngle = getAxisLabelRotateAngle(label.angle, 'y')
      if (rotateAngle !== null) {
        _.set(options.yAxis[0].axisLabel, 'rotate', rotateAngle);
      }
    }
    return options
  }

  _convertData() {
    const { data, legendTheme, code, layoutOptions } = this.props
    const { seriesTmpl } = this.state

    const legend = []
    const series = []
    // 用第一列的数据进行排序
    let xAxis = []
    data && data.series && Object.keys(data.series).forEach((item, i) => {
      legend.push(item)

      const _series = Object.assign({}, seriesTmpl, { stack: this._getChartType().stack })
      _series.name = item
      _series.data = data.series[item].map(value => fmtSeries(value, 0))

      const _legendTheme = legendTheme || { v: '0', themeKey: 'tech', customColors: Array(0), affect: 0 }

      attachColorStyle({ type: 'area', code }, _series, _legendTheme, i)
      if (layoutOptions.global) {
        _series.showAllSymbol = true
        attachLineStyle(_series, layoutOptions.global)
        attachLabelValueStyle(_series, layoutOptions.global.lineLabel)
      }

      series.push(_series)
    })

    xAxis = Array.isArray(data.xAxis) ? data.xAxis : []

    return {
      legend,
      xAxis,
      series
    }
  }

  _getChartType() {
    const { code } = this.props
    return {
      stack: code === 'stack_area'
    }
  }

  _handleChange(params) {
    //是否已经是处于选中状态 发起单图联动拼接conditions
    const { chartRelated, currentName } = this.connectStore
    const { data, id, currentId, events } = this.props
    const dim = data.dimsForRelated
    const conditions = []

    //如果当前数据集筛选中currentId为空 或者Id等于currentId就进行逻辑, 如果维度存在的情况下
    if (!currentId || currentId === id) {
      this.hasBindClickEvent = true;
      this.validConnect = false
      if (chartRelated && params.name === currentName.name) {
        this.connectStore = {
          currentName: {},
          chartRelated: false
        }
      } else {
        //condition_value
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
export default Area;
