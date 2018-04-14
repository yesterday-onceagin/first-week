import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'
import _ from 'lodash'
import { MAX_SCATTER_RADIUS, MIN_SCATTER_RADIUS } from '../../../../constants/echart'
import { attachColorStyle, scaleChart, getEchartColor, getEchartRenderer } from '../../utils/echartOptionHelper'
import { formatDisplay } from '../../utils/generateDisplayFormat';
import tooltip from '../extension/tooltip';
import chinaRegObj from '../constants/china';
// 手动注册china轮廓
echarts.registerMap('china', chinaRegObj)

const convertData = (_data, value) => {
  const res = [];
  for (let i = 0; i < value.length; i++) {
    const geoCoord = _data.geoCoordMap[value[i].name];
    if (geoCoord) {
      res.push({
        name: value[i].name,
        value: geoCoord.concat(value[i].value)
      });
    }
  }
  return res;
};

class ScatterMap extends React.Component {
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
    id: PropTypes.string,
    layoutOptions: PropTypes.object,
    scaleRate: PropTypes.number,
    events: PropTypes.object,
    through: PropTypes.bool,
    platform: PropTypes.string
  };

  constructor(props) {
    super(props)
    this.state = {
      maxLength: 20,
      convertedData: null
    }

    this.getChart = () => this.graph
  }

  componentWillMount() {
    // 预先进行数据处理
    const { code, data, id } = this.props
    if (data) {
      this._convertData(data, (_data) => {
        if (_data.geoCoordMap && _.keys(_data.geoCoordMap).length > 0) {
          window[`${code}::${id}`] = _data
        } else if (window[`${code}::${id}`]) {
          _data = window[`${code}::${id}`]
        }
        this.setState(() => ({ convertedData: _data }))
      })
    }
  }

  componentDidMount() {
    if (this.state.convertedData) {
      this.runDrawGraph()
    } else {
      this.runDrawGraphEmpty()
    }
  }

  componentWillReceiveProps(nextProps) {
    const { data, code, id } = nextProps
    if (!_.isEqual(this.props.data, data) && data) {
      this._convertData(data, (_data) => {
        if (_data.geoCoordMap && _.keys(_data.geoCoordMap).length > 0) {
          window[`${code}::${id}`] = _data
        } else if (window[`${code}::${id}`]) {
          _data = window[`${code}::${id}`]
        }
        this.setState(() => ({ convertedData: _data }))
      })
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { uuid, layoutOptions } = this.props
    const { convertedData } = this.state
    return uuid !== nextProps.uuid
    || !_.isEqual(convertedData, nextState.convertedData)
    || !_.isEqual(layoutOptions, nextProps.layoutOptions)
  }

  componentDidUpdate(preProps) {
    const { convertedData, scaleRate } = this.state
    if (convertedData) {
      this.runDrawGraph(scaleRate !== preProps.scaleRate)
    }
  }

  render() {
    const { ...others } = this.props
    return <div className="graph-inner-box" style={others.style} ref={(node) => { this.graphNode = node }}></div>
  }

  // 绘制空图
  runDrawGraphEmpty() {
    const { scaleRate, platform } = this.props
    const options = this._getOption()
    if (!this.graph) {
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, getEchartRenderer(platform))
    } else {
      // 不再销毁实例，仅解绑点击事件，避免地图不显示
      this.graph.off('click')
    }
    
    if (platform !== 'mobile') {
      scaleChart(this.graph, scaleRate)
    }
    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
  }

  // 绘制有数据的图
  runDrawGraph(reInit) {
    const { legendTheme, data, scaleRate, code, through, events, layoutOptions, platform } = this.props
    let { showIndex, showNumber, color, type } = layoutOptions.scatterConfig
    //兼容旧数据，设为默认值
    if (!layoutOptions.scatterConfig) {
      showIndex = '1'
      showNumber = 5
      color = '#41DFE3'
      type = 'circle'
    }
    let { scatter } = layoutOptions.global ? layoutOptions.global : {}
    if (!scatter) {
      scatter = {
        type: 'circle',
        labelColor: '#ffffff',
        fontSize: 12,
        showLabel: false
      }
    }
    const { convertedData } = this.state
    const dataOrigin = data
    if (!this.graph || reInit) {
      this.graph && this.graph.dispose()
      this.graphDom = this.graphNode
      this.graph = echarts.init(this.graphDom, null, getEchartRenderer(platform))
      if (platform !== 'mobile') {
        scaleChart(this.graph, scaleRate)
      }
    } else {
      // 不再销毁实例，仅解绑点击事件，避免地图不显示
      this.graph.off('click')
    }

    const scatterStyleObj = legendTheme ? attachColorStyle({ type: 'scatter_map', code }, {}, legendTheme, 0) : { itemStyle: { normal: { color: window.DEFAULT_ECHARTS_OPTIONS.color[0] } } }

    const chartData = convertData(convertedData, convertedData.data)
    let effectData = chartData
    let scatterData = chartData
    const { length } = chartData
    //前N or 后N
    if (showIndex === '1') {
      effectData = effectData.sort((a, b) => b.value[2] - a.value[2])
      scatterData = scatterData.sort((a, b) => b.value[2] - a.value[2])
    } else {
      effectData = effectData.sort((a, b) => a.value[2] - b.value[2])
      scatterData = scatterData.sort((a, b) => a.value[2] - b.value[2])
    }
    if (showNumber > length - 1) {
      effectData = effectData.slice(0, showNumber)
      scatterData = []
    } else {
      effectData = effectData.slice(0, showNumber)
      scatterData = scatterData.slice(showNumber, length)
    }
    let options = this._getOption()
    //设置散点样式
    options.series = [
      {
        name: convertedData.lenged[0],
        type: 'scatter',
        symbol: scatter.type,
        cursor: 'auto',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize(val) {
          // 最小值和最大值 相同的情况
          const differ = convertedData.staffSize.max - convertedData.staffSize.min > 0 ? (convertedData.staffSize.max - convertedData.staffSize.min) : 1
          const step = (MAX_SCATTER_RADIUS - MIN_SCATTER_RADIUS) / differ
          return +val[2] > 0 ? (MIN_SCATTER_RADIUS + (step * (Math.floor(val[2] - convertedData.staffSize.min)))) : 0
        },
        label: {
          normal: {
            formatter: (params) => {
              const { primaryNum, displayFormat } = data
              const value =  formatDisplay(params.value[2], displayFormat[primaryNum])
              return `${value}\n${params.name}`
            },
            position: 'inside',
            align: 'center',
            show: scatter.showLabel,
            color: scatter.labelColor,
            fontSize: scatter.fontSize
          },
          emphasis: {
            show: true,
            opacity: 1
          }
        },
        ...scatterStyleObj
      },
      {
        name: convertedData.lenged[0],
        type: 'effectScatter',
        cursor: 'auto',
        coordinateSystem: 'geo',
        data: effectData,
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke'
        },
        symbol: type,
        symbolSize(val) {
          // 最小值和最大值 相同的情况
          const differ = convertedData.staffSize.max - convertedData.staffSize.min > 0 ? (convertedData.staffSize.max - convertedData.staffSize.min) : 1
          const step = (MAX_SCATTER_RADIUS - MIN_SCATTER_RADIUS) / differ
          return +val[2] > 0 ? (MIN_SCATTER_RADIUS + (step * (Math.floor(val[2] - convertedData.staffSize.min)))) : 0
        },
        label: {
          normal: {
            formatter: (params) => {
              const { primaryNum, displayFormat } = data
              const value =  formatDisplay(params.value[2], displayFormat[primaryNum])
              return `${value}\n${params.name}`
            },
            position: 'inside',
            show: scatter.showLabel,
            color: scatter.labelColor,
            fontSize: scatter.fontSize
          },
          emphasis: {
            show: true,
            opacity: 1
          }
        },
        ...scatterStyleObj
      }
    ]
    //单独设置颜色
    if (color) {
      const itemStyle = {
        normal: {
          color,
          opacity: 0.7
        }
      }
      options.series[1].itemStyle = itemStyle
    }
    options = tooltip(options, 'scatter_map', false, dataOrigin, this.graph, this.graphDom)
    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
    // 穿透点击
    if (through) {
      const throughEvent = (arg) => {
        // 只有在点击了数据系列时才触发联动事件
        if (arg.componentType === 'series') {
          events.onThrough('scatter_map', arg)
        }
      }
      this.graph.on('click', throughEvent)
    }
  }

  // 调用接口取得坐标数据
  _convertData(dataOrigin, callback) {
    // 异步方法
    AMap.plugin(['AMap.Geocoder'], () => {
      const { dims, nums } = dataOrigin
      const lenged = _.keys(nums)
      const dims_value = _.values(dims)[0]
      const nums_value = _.values(nums)[0]
      const nums_value_len = nums_value.length
      const staffSize = this._getSymboSize(nums_value)
      const geocoder = new AMap.Geocoder();
      // 使用Promise.all 使得回调只执行一次
      Promise.all(dims_value.slice(0, this.state.maxLength).map((item, i) => new Promise((resolve) => {
        // data
        const data = {
          name: dims_value[i],
          value: nums_value[i]
        }
        // 地理编码,返回地理编码结果
        geocoder.getLocation(item, (status, result) => {
          let geoCoordMap = null
          if (status === 'complete' && result.info === 'OK') {
            const { location } = result.geocodes[0]
            geoCoordMap = {
              [item]: [location.lng, location.lat]
            }
          }
          resolve({
            length: nums_value_len,
            lenged,
            staffSize,
            geoCoordMap,
            data
          })
        })
      }))).then((obj) => {
        if (typeof callback === 'function' && Array.isArray(obj) && obj.length > 0) {
          const mapData = {}
          obj.forEach((item) => {
            mapData.data = _.concat(mapData.data || [], item.data)
            mapData.geoCoordMap = _.assign(mapData.geoCoordMap, item.geoCoordMap)
            if (!mapData.length) {
              mapData.length = item.length
            }
            if (!mapData.lenged) {
              mapData.lenged = item.lenged
            }
            if (!mapData.staffSize) {
              mapData.staffSize = item.staffSize
            }
          })
          callback(mapData)
        }
      })
    });
  }

  // 获取基本配置项
  _getOption() {
    const { legendTheme } = this.props
    // 只支持一种颜色
    const mapColor = legendTheme ? getEchartColor(legendTheme, 1) : window.DEFAULT_ECHARTS_OPTIONS.color[1]
    const borderColor = legendTheme ? getEchartColor(legendTheme, 2) : window.DEFAULT_ECHARTS_OPTIONS.color[2]
    return {
      backgroundColor: 'transparent',
      title: {
        left: 'center',
        textStyle: {
          color: '#fff'
        }
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        show: false  // 暂时隐藏图例
      },
      geo: {
        map: 'china',
        label: {
          emphasis: {
            show: false
          }
        },
        roam: false,
        itemStyle: {
          normal: {
            areaColor: mapColor,
            borderColor
          },
          emphasis: {
            areaColor: mapColor
          }
        }
      },
      series: []
    }
  }

  _getSymboSize(staffSize) {
    const _staffSize = staffSize.filter(item => item >= 0)
    return {
      max: Math.max.apply(null, _staffSize),
      min: Math.min.apply(null, _staffSize)
    }
  }
}

export default ScatterMap;
