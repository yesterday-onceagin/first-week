import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'
import _ from 'lodash'
import tooltip from '../extension/tooltip'
import { attachColorStyle, scaleChart, getEchartRenderer } from '../../utils/echartOptionHelper'
import { getLegendOption } from '@helpers/dashboardUtils'

class Radar extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    code: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    data: PropTypes.object,
    layoutOptions: PropTypes.object,
    scaleRate: PropTypes.number,
    fullScreen: PropTypes.bool,
    legendTheme: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object
    ]),
    platform: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {
      seriesTmpl: {
        type: 'radar',
        symbol: 'none',
        data: [{
          value: [4300, 10000, 28000, 35000, 50000, 19000],
          name: '预算分配（Allocated Budget）'
        }, {
          value: [5000, 14000, 28000, 31000, 42000, 21000],
          name: '实际开销（Actual Spending）'
        }]
      }
    }

    this.getChart = () => this.graph
  }

  componentDidMount() {
    const { data } = this.props
    data && this.runDrawGraph();
  }

  shouldComponentUpdate(nextProps) {
    const { uuid, layoutOptions } = nextProps
    return !_.isEqual(uuid, this.props.uuid)
      || (layoutOptions && !_.isEqual(layoutOptions, this.props.layoutOptions))
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
    const { style } = this.props
    return <div className="graph-inner-box" style={style} ref={(node) => { this.graphNode = node }}></div>
  }

  runDrawGraph(reInit) {
    const { scaleRate, platform } = this.props
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, getEchartRenderer(platform))
      if (platform !== 'mobile') {
        scaleChart(this.graph, scaleRate)
      }
    }

    const options = this.getOptions()

    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
  }

  getOptions() {
    const { data, layoutOptions } = this.props
    const chart_data = this._convertData()
    const options = {
      color: window.DEFAULT_ECHARTS_OPTIONS.color,
      tooltip: {
        confine: false
      },
      // 图例: 传入layoutOption中的legend chartData中的legend
      legend: getLegendOption(layoutOptions.legend, chart_data.legend),
      grid: window.DEFAULT_ECHARTS_OPTIONS.grid,
      radar: {
        // shape: 'circle',
        center: ['50%', '55%'],
        radius: '75%',
        indicator: chart_data.indicator,
        nameGap: '5',
        name: {
          show: true
        },
        splitArea: window.DEFAULT_ECHARTS_OPTIONS.splitArea,
        splitLine: window.DEFAULT_ECHARTS_OPTIONS.radar_splitLine,
        axisLine: window.DEFAULT_ECHARTS_OPTIONS.axisLine
      },
      name: {
        textStyle: window.DEFAULT_ECHARTS_OPTIONS.textStyle,
      },
      series: chart_data.series
    }

    if (chart_data.indicator.length === 0) {
      delete options.radar.indicator
      delete options.series
    }

    // 如果 indicator 的 length > 20
    if (chart_data.indicator.length > 20) {
      options.radar.name.show = false
    }

    // 自定义 tootltip
    return tooltip(options, chart_data.indicator, this.props.fullScreen, data, this.graph, this.graphDom)
  }

  _convertData() {
    const { data, legendTheme, code, layoutOptions } = this.props
    const { seriesTmpl } = this.state
    const legend = []
    const series = []
    const indicator = []

    // 算最大值的
    let values = []
    data && Array.isArray(data.series) && data.series.forEach((item) => {
      legend.push(item.name)

      const _series = Object.assign({}, seriesTmpl)
      _series.data = data.series.map((ditem, j) => {
        const _item = _.cloneDeep(ditem)
        _item.value = ditem.value.map(value => this.fmtSeries(value))
        legendTheme && attachColorStyle({ type: seriesTmpl.type, code }, _item, legendTheme, j)
        return _item
      })

      series.push(_series)

      values = values.concat(item.value)
    })

    if (data && Array.isArray(data.dim)) {
      data.dim.forEach((item) => {
        indicator.push({
          name: item,
          max: layoutOptions.dataSeries.desired_value || this._getMaxCoords(values)
        })
      })
    }
    return {
      legend,
      indicator,
      series
    }
  }

  fmtSeries(data) {
    let _data = data
    if (!Number.isNaN(+data)) {
      if (data !== null && data !== '') {
        // 如果含有小数点
        if (data.toString().indexOf('.') > -1) {
          _data = Number(+data).toFixed(2)
        }
      } else {
        _data = 0
      }
    } else {
      _data = 0
    }
    return _data
  }

  _getMaxCoords(values) {
    let max = 0
    let min = 0

    const sort_values = values.sort((a, b) => a - b)
    max = +sort_values[sort_values.length - 1]
    min = +sort_values[0]

    const coord = Math.floor(max + max - min)
    return coord > 0 ? coord : 1
  }
}

export default Radar;
