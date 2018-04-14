import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'
import _ from 'lodash'
import { formatDisplay } from '../../utils/generateDisplayFormat'
import { scaleChart, getEchartColor, getFontStyles, getEchartRenderer } from '../../utils/echartOptionHelper'

/*
* 占比饼图
*/
class Gauge extends React.Component {
  static propTypes = {
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    layoutOptions: PropTypes.object,
    code: PropTypes.string,
    legendTheme: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object
    ]),
    data: PropTypes.object,
    animate: PropTypes.bool,
    platform: PropTypes.string,
    scaleRate: PropTypes.number
  };

  static defaultProps = {
    animate: false
  };

  constructor(props) {
    super(props);
    this.getChart = () => ({
      // 特殊处理，先调用echart实例的resize方法，然后重绘（用于重新计算lineWidth）
      resize: ({ width, height }) => {
        this.graph.resize(width, height)
        this.runDrawGraph()
      },
      chart: this.graph
    })
  }

  componentDidMount() {
    this.runDrawGraph()
  }

  shouldComponentUpdate(nextProps) {
    const { uuid, legendTheme, layoutOptions } = this.props
    const layoutChanged = nextProps.layoutOptions && !_.isEqual(nextProps.layoutOptions, layoutOptions)
    return !_.isEqual(uuid, nextProps.uuid)
      || legendTheme !== nextProps.legendTheme
      || layoutChanged
  }

  componentDidUpdate(preProps) {
    const { scaleRate } = this.props
    this.runDrawGraph(scaleRate !== preProps.scaleRate)
  }

  componentWillUnmount() {
    if (this.graph) {
      this.graph.dispose()
    }
  }

  render() {
    return <div className="graph-inner-box" ref={(node) => { this.echart_dom = node }}></div>
  }

  runDrawGraph(reInit) {
    const { scaleRate, platform } = this.props
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graph = echarts.init(this.echart_dom, null, getEchartRenderer(platform))
      if (platform !== 'mobile') {
        scaleChart(this.graph, scaleRate)
      }
    }
    const options = this.getOptions()
    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
  }

  getOptions() {
    const chartData = this._convertData()
    const options = {
      series: [
        chartData.series
      ]
    }
    return options
  }

  _convertData() {
    const { data, legendTheme, layoutOptions, code } = this.props
    // console.log(data)
    const { displayFormat } = data
    const dF = displayFormat[data.name] || {}
    const styleObj = this._getOptions(layoutOptions)
    // 内半径(环形宽度计算)
    const outterRadius = '95%'
    const lineWidth = ((Math.min(this.echart_dom.clientWidth, this.echart_dom.clientHeight) * 0.95 / 2) * ((100 - styleObj.global.radius) / 100)) || 1
    // 填充颜色
    const lineColor = legendTheme ? getEchartColor(legendTheme, 0, code) : '#41DFE3'
    const fillColor = styleObj.global.color
    // 百分比值整理
    const value1 = typeof (data.value[0]) === 'number' ? data.value[0] : 0
    const max = styleObj.dataSeries.desired_value ? Number(+styleObj.dataSeries.desired_value) : (data.desire && data.desire[0]) || data.value[0]
    const percent = typeof max === 'number' ? value1 / max : 0
    const isPercentMode = styleObj.dataSeries.percentage
    const formatValue = `${formatDisplay(value1, dF)}${dF.column_unit_name || ''}`

    const dataName = data.name

    const seriesTmpl = {
      type: 'gauge',
      radius: outterRadius,
      center: ['50%', '50%'],
      startAngle: 270,
      endAngle: -89.999999,
      clockwise: true,
      pointer: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: [[percent, lineColor], [1, fillColor]],
          width: lineWidth
        }
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      axisTick: {
        show: false
      },
      title: {
        show: styleObj.title.show,
        offsetCenter: [0, -Math.max(styleObj.title.lineHeight / 2, 7) - 1],
        textStyle: {
          color: styleObj.title.color,
          fontSize: styleObj.title.fontSize,
          lineHeight: styleObj.title.lineHeight,
          fontStyle: styleObj.title.fontStyle,
          fontWeight: styleObj.title.fontWeight
        }
      },
      detail: {
        show: true,
        formatter: () => {
          if (isPercentMode) {
            return Number.isNaN(percent) ? '-' : `${(percent * 100).toFixed(0)}%`
          }
          return formatValue
        },
        offsetCenter: [0, styleObj.title.show ? (Math.max(styleObj.gaugeText.lineHeight / 2, 7) + 1) : 0],
        textStyle: {
          color: styleObj.gaugeText.color,
          fontSize: styleObj.gaugeText.fontSize,
          lineHeight: styleObj.gaugeText.lineHeight,
          fontStyle: styleObj.gaugeText.fontStyle,
          fontWeight: styleObj.gaugeText.fontWeight
        }
      },
      data: [{ value: +data.value[0], name: dataName }]
    }
    return {
      series: seriesTmpl
    }
  }

  _getOptions(layoutOptions) {
    const option = {}
    // 加载global配置
    if (layoutOptions.global) {
      option.global = {
        radius: layoutOptions.global.radius,
        color: layoutOptions.global.color
      }
    }
    // 加载title配置
    if (layoutOptions.title) {
      option.title = {
        show: layoutOptions.title.show,
        fontSize: layoutOptions.title.fontSize,
        lineHeight: layoutOptions.title.lineHeight,
        color: layoutOptions.title.color,
        ...getFontStyles(layoutOptions.title.fontStyle)
      }
    }
    // 加载文本配置
    if (layoutOptions.gaugeText) {
      option.gaugeText = {
        fontSize: layoutOptions.gaugeText.fontSize,
        lineHeight: layoutOptions.gaugeText.lineHeight,
        color: layoutOptions.gaugeText.color,
        ...getFontStyles(layoutOptions.gaugeText.fontStyle)
      }
    }
    // 加载数据系列配置
    if (layoutOptions.dataSeries) {
      option.dataSeries = {
        desired_value: layoutOptions.dataSeries.desired_value,
        percentage: layoutOptions.dataSeries.percentage
      }
    }
    return option
  }
}

export default Gauge
