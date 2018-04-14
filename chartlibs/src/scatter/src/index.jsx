import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'
import _ from 'lodash'
import { Connect, Utils } from 'dmp-chart-sdk'

const MAX_SCATTER_RADIUS = 50  //散点图半径的最大值
const MIN_SCATTER_RADIUS = 35  //散点图半径的最小值

// 转换散点图数据
const _dataProcess = (data, indicators) => {
  const dimsData = Utils.DataUtils.pluckDimsData(data, indicators)
  const numsData = Utils.DataUtils.pluckNumsData(data, indicators)
  return { ...dimsData, ...numsData }
}

const _transformScatterData = (data, indicators) => {
  data.forEach((item) => {
    Object.keys(item).map((key) => {
      if (item[key] == null) {
        item[key] = '-'
      }
    })
  })

  const { dims, nums, numsDisplayFormat } = _dataProcess(data, indicators);

  const series = []
  const title_text = []

  Object.keys(nums).forEach((item) => {
    title_text.push(item)
  })

  // 有维度的情况
  if (Object.keys(dims).length > 0) {
    // 转换成对象
    const _dims = Object.entries(dims);
    const names = [];

    data.forEach((_data, key) => {
      const name = []
      _dims.forEach((item) => {
        name.push(`${item[0]}：${item[1][key]}`)
      })
      names.push(name)
    })

    data.forEach((item, i) => {
      const value = []
      title_text.forEach((_item) => {
        value.push(Utils.DataUtils.noValueFormatter(nums[_item][i]))
      })
      series.push({
        name: names[i],
        value
      })
    })
  } else {
    const value = []
    title_text.forEach((item) => {
      value.push(Utils.DataUtils.noValueFormatter(nums[item][0]))
    })
    series.push({
      name: '',
      value
    })
  }

  return {
    title_text,
    series,
    displayFormat: numsDisplayFormat
  }
}

// 应用配色方案
const _attachColorStyle = function (sery, colorTheme, seryIndex) {
  let color = Utils.Theme.getEchartColorFromTheme(echarts, colorTheme, seryIndex, 0)
  if (+colorTheme.affect !== 1) {
    color = Utils.Theme.getEchartColorFromTheme(echarts, colorTheme, 0, 0)
  }
  _.set(sery, 'itemStyle.normal.color', color)
  _.set(sery, 'itemStyle.normal.opacity', 0.7)
  return sery
}

// 图表提示框
const _gC = function (color) {
  if (typeof color === 'object') {
    return color.colorStops[0].color
  }
  return color
}

const _format = function (dF, value) {
  return `${Utils.formatDisplay(value, dF)}${(dF && dF.column_unit_name && dF.column_unit_name) || ''}`
}

const tooltip = (options, sub_data, dataOrigin) => {
  const { displayFormat } = dataOrigin || {}
  const dF = displayFormat || {}

  const defaultTooltip = window.DEFAULT_ECHARTS_OPTIONS.tooltip

  // 调整显示 toottip
  options.tooltip.backgroundColor = defaultTooltip.backgroundColor;
  options.tooltip.extraCssText = defaultTooltip.extraCssText;
  options.tooltip.enterable = true
  options.tooltip.hideDelay = 500

  const titleFS = '14px'
  const valueFS = '10px'

  options.tooltip.formatter = (data) => {
    const title = data.data.value[data.data.value.length - 1] || ''
    let text = ''

    sub_data && sub_data.forEach((item, i) => {
      const _dF = dF[item]
      let valueStr = data.data.value[i]
      valueStr = _format(_dF, valueStr)
      text += i < sub_data.length - 1
        ? `<span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${item}: ${valueStr}</span><br/>`
        : `<span style="font-size: ${valueFS}; color: ${_gC(data.color)}">${item}: ${valueStr}</span>`
    })
    return title ? `<span style="color: ${defaultTooltip.titleColor}; font-size: ${titleFS}; line-height: 150%">${title}</span><br/>${text}` : text
  }

  return options
}

class Scatter extends React.Component {
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
      data: _transformScatterData(data, indicators)
    }

    this.getChart = () => this.graph
  }

  componentDidMount() {
    const { data } = this.state
    data && this.runDrawGraph();
  }

  shouldComponentUpdate(nextProps) {
    const { chartUuid, config } = this.props
    return !_.isEqual(chartUuid, nextProps.chartUuid) || !_.isEqual(nextProps.config, config)
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        data: _transformScatterData(nextProps.data.data, nextProps.data.indicators)
      })
    }
  }

  componentDidUpdate(preProps) {
    const { data } = this.state
    const { scale } = this.props
    data && this.runDrawGraph(scale !== preProps.scale);
  }

  componentWillUnmount() {
    if (this.graph) {
      this.graph.dispose()
    }
  }

  render() {
    return <div className="graph-inner-box" ref={(node) => { this.graphNode = node }}></div>
  }

  runDrawGraph(reInit) {
    const { scale } = this.props

    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom)
      if (scale) {
        Utils.scaleChart(this.graph, scale)
      }
    }

    const options = this.getOptions()
    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
  }

  _getGridOption(opts, defaultConfig) {
    const gridOption = defaultConfig || {
      top: 40,
      right: 20,
      bottom: 20,
      left: 20,
      containLabel: true
    }
    if (opts) {
      const { top, bottom, left, right } = opts
      gridOption.top = top >= 0 ? top : 0
      gridOption.right = right >= 0 ? right : 0
      gridOption.bottom = bottom >= 0 ? bottom : 0
      gridOption.left = left >= 0 ? left : 0
    }
    return gridOption
  }

  getOptions() {
    const { data } = this.state
    const { config } = this.props
    const { title_text, displayFormat } = data

    const chart_data = this._convertData()
    const defaultEchartOptions = window.DEFAULT_ECHARTS_OPTIONS

    // scatter 现在只支持一个颜色
    const options = {
      color: defaultEchartOptions.color,
      tooltip: {
        trigger: 'item',
        confine: defaultEchartOptions.confine,
        axisPointer: {          // 坐标轴指示器，坐标轴触发有效
          type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
        }
      },
      grid: this._getGridOption(config.globalStyle && config.globalStyle.gap && config.globalStyle.gap.margin, defaultEchartOptions.grid),
      legend: {                 // 不需要
        show: false
      },
      xAxis: {
        splitLine: {
          ...defaultEchartOptions.splitLine
        },
        axisLine: {
          ...defaultEchartOptions.axisLine
        },
        nameLocation: 'middle',
        axisLabel: {
          ...defaultEchartOptions.axisLabel,
          formatter: value => Utils.formatDisplay(value, displayFormat[title_text[0]])
        },
        nameGap: '25',
        scale: true,
        axisTick: {
          show: false
        }
      },
      yAxis: {
        splitLine: {
          ...defaultEchartOptions.splitLine
        },
        axisLine: {
          ...defaultEchartOptions.axisLine
        },
        nameLocation: 'middle',
        nameGap: '30',
        axisLabel: {
          ...defaultEchartOptions.axisLabel,
          formatter: value => Utils.formatDisplay(value, displayFormat[title_text[1]])
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
    if (config && config.x) {
      const { label, axis } = config.x
      //轴线
      _.set(options.xAxis.axisLine, 'show', axis.show)
      _.set(options.xAxis.axisTick, 'show', axis.show)
      _.set(options.xAxis.axisLine, 'lineStyle.color', axis.color)
      //轴标签
      _.set(options.xAxis.axisLabel, 'show', label.show)
      _.set(options.xAxis.axisLabel, 'fontSize', label.fontSize)
      _.set(options.xAxis.axisLabel, 'color', label.color)
    }

    //y轴设置
    if (config && config.y) {
      const { label, axis } = config.y
      //轴线
      _.set(options.yAxis.axisLine, 'show', axis.show)
      _.set(options.yAxis.axisTick, 'show', axis.show)
      _.set(options.yAxis.axisLine, 'lineStyle.color', axis.color)
      //轴标签
      _.set(options.yAxis.axisLabel, 'show', label.show)
      _.set(options.yAxis.axisLabel, 'fontSize', label.fontSize)
      _.set(options.yAxis.axisLabel, 'color', label.color)
    }
    return tooltip(options, chart_data.title_text, data)
  }

  _convertData() {
    const { data } = this.state
    const { colorTheme } = this.props.config.theme
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
      colorTheme && _attachColorStyle(_series, colorTheme, i)

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

export default Connect()(Scatter)
