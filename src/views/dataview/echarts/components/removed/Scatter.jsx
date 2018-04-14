import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts';
import _ from 'lodash';
import { MAX_SCATTER_RADIUS, MIN_SCATTER_RADIUS } from '../../../../constants/echart';

import { formatDisplay } from '../../utils/generateDisplayFormat';
import { attachColorStyle, scaleChart } from '../../utils/echartOptionHelper';
import { getGridOption } from '../../../../helpers/dashboardUtils'

import tooltip from '../extension/tooltip';

class Scatter extends React.Component {
  static propTypes = {
    code: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    data: PropTypes.object,
    legendTheme: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object
    ]),
    layoutOptions: PropTypes.object,
    fullScreen: PropTypes.bool,
    scaleRate: PropTypes.number
  };

  constructor(props) {
    super(props)

    this.getChart = () => this.graph
  }

  componentDidMount() {
    const { data } = this.props
    data && this.runDrawGraph();
  }

  shouldComponentUpdate(nextProps) {
    const { uuid, layoutOptions } = this.props
    return !_.isEqual(uuid, nextProps.uuid) || !_.isEqual(nextProps.layoutOptions, layoutOptions)
  }

  componentDidUpdate(preProps) {
    const { data, scaleRate } = this.props
    data && this.runDrawGraph(scaleRate !== preProps.scaleRate);
  }

  componentWillUnmount() {
    if (this.graph) {
      this.graph.dispose()
    }
  }

  render() {
    const { ...others } = this.props
    return <div className="graph-inner-box" style={others.style} ref={(node) => { this.graphNode = node }}></div>
  }

  runDrawGraph(reInit) {
    const { scaleRate } = this.props

    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom)
      if (scaleRate) {
        scaleChart(this.graph, scaleRate)
      }
    }

    const options = this.getOptions()
    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
  }

  getOptions() {
    const { fullScreen, data, layoutOptions } = this.props
    const { title_text, displayFormat } = data

    const chart_data = this._convertData()
    // scatter 现在只支持一个颜色
    const options = {
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        trigger: 'item',
        confine: window.DEFAULT_ECHARTS_OPTIONS.confine,
        axisPointer: {            // 坐标轴指示器，坐标轴触发有效
          type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
        }
      },
      grid: getGridOption(layoutOptions.global, window.DEFAULT_ECHARTS_OPTIONS.grid),
      legend: {                   // 不需要
        show: false
      },
      xAxis: {
        splitLine: {
          ...window.DEFAULT_ECHARTS_OPTIONS.splitLine
        },
        axisLine: {
          ...window.DEFAULT_ECHARTS_OPTIONS.axisLine
        },
        /*name: chart_data.xaxis_title_text,*/
        nameLocation: 'middle',
        axisLabel: {
          ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
          formatter: value => formatDisplay(value, displayFormat[title_text[0]])
        },
        nameGap: '25',
        scale: true,
        axisTick: {
          show: false
        }
      },
      yAxis: {
        splitLine: {
          ...window.DEFAULT_ECHARTS_OPTIONS.splitLine
        },
        axisLine: {
          ...window.DEFAULT_ECHARTS_OPTIONS.axisLine
        },
        /*name: chart_data.yaxis_title_text,*/
        nameLocation: 'middle',
        nameGap: '30',
        axisLabel: {
          ...window.DEFAULT_ECHARTS_OPTIONS.axisLabel,
          formatter: value => formatDisplay(value, displayFormat[title_text[1]])
        },
        scale: true,
        axisTick: {
          show: false
        }
      },
      series: [{
        data: chart_data.series,
        type: 'scatter',
        cursor: 'auto',
        symbolSize(_data) {
          // 最小值和最大值 相同的情况
          const differ = chart_data.staffSize.max - chart_data.staffSize.min > 0 ? (chart_data.staffSize.max - chart_data.staffSize.min) : 1
          const step = (MAX_SCATTER_RADIUS - MIN_SCATTER_RADIUS) / differ
          let size = _data.length > 3 ? (MIN_SCATTER_RADIUS + (step * (Math.floor(_data[2] - chart_data.staffSize.min))))
            : MIN_SCATTER_RADIUS
          size = size > MAX_SCATTER_RADIUS ? MAX_SCATTER_RADIUS : size
          size = size < MIN_SCATTER_RADIUS ? MIN_SCATTER_RADIUS : size

          return size
        }
      }]
    }
    //setting前clone对象
    options.xAxis = _.cloneDeep(options.xAxis)
    options.yAxis = _.cloneDeep(options.yAxis)
    //x轴设置
    if (layoutOptions && layoutOptions.x) {
      const { label, axis } = layoutOptions.x
      //轴线
      _.set(options.xAxis.axisLine, 'show', axis.show)
      _.set(options.xAxis.axisTick, 'show', axis.show)
      _.set(options.xAxis.axisLine, 'lineStyle.color', axis.color)
      //轴标签
      _.set(options.xAxis.axisLabel, 'show', label.show)
      _.set(options.xAxis.axisLabel, 'fontSize', label.size)
      _.set(options.xAxis.axisLabel, 'color', label.color)
    }
    //y轴设置
    if (layoutOptions && layoutOptions.y) {
      const { label, axis } = layoutOptions.y
      //轴线
      _.set(options.yAxis.axisLine, 'show', axis.show)
      _.set(options.yAxis.axisTick, 'show', axis.show)
      _.set(options.yAxis.axisLine, 'lineStyle.color', axis.color)
      //轴标签
      _.set(options.yAxis.axisLabel, 'show', label.show)
      _.set(options.yAxis.axisLabel, 'fontSize', label.size)
      _.set(options.yAxis.axisLabel, 'color', label.color)
    }
    return tooltip(options, chart_data.title_text, fullScreen, data, this.graph, this.graphDom)
  }

  _convertData() {
    const { data, legendTheme, code } = this.props
    const series = []
    const x_values = []
    const y_values = []
    const staffSizes = []

    let staffSize = 1

    data && Array.isArray(data.series) && data.series.forEach((item, i) => {
      // x, y, name
      const _series = { value: item.value.concat(item.name) }

      x_values.push(item.value[0])
      y_values.push(item.value[1])

      // 存入面积
      staffSizes.push(item.value[2] || MIN_SCATTER_RADIUS)
      legendTheme && attachColorStyle({ type: 'scatter', code }, _series, legendTheme, i)

      series.push(_series)
    })


    if (staffSizes.length > 0) {
      staffSize = this._getSymboSize(staffSizes)
    }

    return {
      title_text: data.title_text,
      series,
      staffSize
    }
  }

  _getSymboSize(staffSizes) {
    const min = staffSizes.sort((a, b) => a - b)[0]
    const max = staffSizes.sort((a, b) => b - a)[0]

    return {
      min: Math.floor(min),
      max: Math.floor(max)
    }
  }
}

export default Scatter;
