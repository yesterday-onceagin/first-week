import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'
import 'echarts-liquidfill'
import _ from 'lodash'
import { scaleChart, getEchartColor, getEchartRenderer } from '../../utils/echartOptionHelper'

window.isEqual = _.isEqual
/**
 * 水位图
 */
class LiquidFill extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    code: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    data: PropTypes.object,
    clearSelect: PropTypes.bool,
    isHidden: PropTypes.bool,
    currentId: PropTypes.string,
    editable: PropTypes.bool,
    func_config: PropTypes.object,
    scaleRate: PropTypes.number,
    layoutOptions: PropTypes.object,
    operatorShow: PropTypes.bool,
    legendTheme: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object
    ]),
    fullScreen: PropTypes.bool,
    id: PropTypes.string,
    platform: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {
      seriesTmpl: {
        type: 'liquidFill',
        data: [],
        radius: '80%'
      }
    }

    // 暴露的static 方法
    this.getChart = () => this.graph
  }

  componentDidMount() {
    const { data, isHidden } = this.props
    if (Array.isArray(data.value) && !isHidden) {
      this.runDrawGraph()
    }
  }

  shouldComponentUpdate(nextProps) {
    const { uuid, operatorShow, layoutOptions, isHidden } = this.props
    return !_.isEqual(uuid, nextProps.uuid)
      || isHidden !== nextProps.isHidden
      || nextProps.operatorShow !== operatorShow
      || (!!nextProps.layoutOptions && !_.isEqual(nextProps.layoutOptions, layoutOptions))
  }

  componentDidUpdate(preProps) {
    const { data, scaleRate, legendTheme, isHidden } = this.props
    if (Array.isArray(data.value) && !isHidden) {
      this.runDrawGraph(scaleRate !== preProps.scaleRate || !_.isEqual(preProps.legendTheme, legendTheme));
    } else if (this.graph) {
      this.graph.clear()
    }
  }

  componentWillUnmount() {
    if (this.graph) {
      this.graph.dispose()
    }
  }

  render() {
    const { style } = this.props
    return <div className="graph-inner-box">
      <div className="graph-inner-box-wrap" style={style} ref={(node) => { this.graphNode = node }}></div>
    </div>
  }

  runDrawGraph(reInit) {
    const { scaleRate } = this.props
    
    if (this.graph || reInit) {
      this.graph.dispose()
    }
    this.graphDom = this.graphNode
    // this.graph = echarts.init(this.graphDom, null, getEchartRenderer(platform))
    this.graph = echarts.init(this.graphDom)
    scaleChart(this.graph, scaleRate)

    const options = this.getOptions()

    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
  }

  getOptions() {
    // const { data, fullScreen, func_config} = this.props
    // const { layoutOptions } = this.props
    const chartData = this._convertData()
    const options = {
      series: chartData.series
    }
    return options
  }

  _getOptions(layoutOptions) {
    const option = {}
    // 加载波浪设置
    if (layoutOptions.liquidWave) {
      option.liquidWave = {
        count: layoutOptions.liquidWave.count,
        wave: layoutOptions.liquidWave.wave,
        timeline: layoutOptions.liquidWave.timeline,
        opacity: layoutOptions.liquidWave.opacity,
        gap: layoutOptions.liquidWave.gap,
        direction: layoutOptions.liquidWave.direct
      }
    }
    // 加载文本配置
    if (layoutOptions.liquidText) {
      const fontStyleArr = layoutOptions.liquidText.fontStyle ? layoutOptions.liquidText.fontStyle.split(',') : []
      option.liquidText = {
        fontSize: layoutOptions.liquidText.fontSize,
        lineHeight: layoutOptions.liquidText.lineHeight,
        distance: layoutOptions.liquidText.distance,
        color: layoutOptions.liquidText.color,
        insideColor: layoutOptions.liquidText.insideColor,
        fontWeight: fontStyleArr.indexOf('bold') > -1 ? 'bold' : 'normal',
        fontStyle: fontStyleArr.indexOf('italic') > -1 ? 'italic' : 'normal'
      }
    }
    // 加载数据系列配置
    if (layoutOptions.dataSeries) {
      option.dataSeries = {
        desired_value: layoutOptions.dataSeries.desired_value
      }
    }
    return option
  }

  _convertData() {
    const seriesTmpl = { ...this.state.seriesTmpl }
    const { data, legendTheme, code, layoutOptions } = this.props
    // const arrData = seriesData.sort((a, b) => b.value - a.value)
    const { liquidText, dataSeries, liquidWave } = this._getOptions(layoutOptions)
    const max = dataSeries.desired_value ? Number(+dataSeries.desired_value) : ((data.desire && data.desire[0]) || data.value[0] || 0)
    seriesTmpl.label = {
      normal: {
        show: true,
        fontSize: liquidText.fontSize,
        fontWeight: liquidText.fontWeight,
        fontStyle: liquidText.fontStyle,
        insideColor: liquidText.insideColor,
        color: liquidText.color,
        offset: [0, liquidText.distance]
      }
    }
    seriesTmpl.backgroundStyle = 'transparent'
    //根据周期设置是否存在动画
    seriesTmpl.waveAnimation = liquidWave.timeline !== 0
    seriesTmpl.direction = liquidWave.direction
    //波浪宽度
    seriesTmpl.waveLength = `${liquidWave.count}%`
    //振幅
    seriesTmpl.amplitude = liquidWave.wave
    //相位
    //seriesTmpl.phase = liquidWave.gap
    seriesTmpl.period = (value, index) => {
      if (liquidWave.timeline === 0) return 1000
      return (1000 * index) + (liquidWave.timeline * 1000)
    }
    seriesTmpl.itemStyle = {
      normal: {
        opacity: liquidWave.opacity
      }
    }
    //设置百分比和颜色
    //新增数据为null的处理, 只取data.value[0]
    const value1 = typeof data.value[0] === 'number' ? data.value[0] : 0
    const percent = (typeof max === 'number') ? Number(value1 / max).toFixed(2) : 0
    const dataItem = {
      value: percent
    }
    seriesTmpl.data = [dataItem]
    const color = []
    const legendColor = legendTheme || { v: '1', themeKey: 'tech', customColors: [], affect: 0 }
    color.push(getEchartColor(legendColor, 0, code))
    seriesTmpl.color = color
    return {
      series: seriesTmpl
    }
  }
}

export default LiquidFill;
