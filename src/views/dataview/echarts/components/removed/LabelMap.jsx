import React from 'react'
import PropTypes from 'prop-types'
import echarts from 'echarts'
import _ from 'lodash'
import { scaleChart } from '../../utils/echartOptionHelper'
import { formatDisplay } from '../../utils/generateDisplayFormat';

// 标记点原位置(用于连线)
let itemAreas = [];

// 标签容器碰撞检测
// const hitTest = (origin, areas, w, h, excludIndex = undefined) => {
//   let isHit = false
//   let hitArea = null
//   areas.every((area, index) => {
//     if (excludIndex === index) {
//       return true
//     }
//     // 水平方向相对位置
//     const horizonPos = origin.x - area.x;
//     // 垂直方向相对位置
//     const verticalPos = origin.y - area.y;
//     // 判断是否在碰撞区域内
//     if (Math.abs(horizonPos) < w && Math.abs(verticalPos) < h) {
//       isHit = true;
//       // 将发生碰撞的区域返回
//       hitArea = {
//         x: area.x,
//         y: area.y
//       }
//       // 一旦检测到有碰撞结束
//       return false;
//     }
//     return true;
//   })

//   return {
//     result: isHit,
//     hitArea
//   };
// }

class LabelMap extends React.Component {
  static propTypes = {
    code: PropTypes.string,
    uuid: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]),
    style: PropTypes.object,
    data: PropTypes.object,
    dataGrid: PropTypes.object,
    legendTheme: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.object
    ]),
    id: PropTypes.string,
    scaleRate: PropTypes.number,
    events: PropTypes.object,
    through: PropTypes.bool,
    editable: PropTypes.bool,
    clearSelect: PropTypes.bool,
    currentId: PropTypes.string,
    throughList: PropTypes.array,
    layoutOptions: PropTypes.object
  };

  constructor(props) {
    super(props)
    this.state = {
      maxLength: 10,
      convertedData: null,
      labelWidth: 70,
      labelHeight: 70,
      labelCoords: [],
      baseLabelMargin: 30,                // 标签默认到容器边的距离
      labelMapStyles: this._getGlobalStyles(props.layoutOptions || {}),   // 剥离需要的样式 防止频繁刷新
      uuid: new Date().getTime()
    }

    this.validConnect = true;  // 联动是否有效
    this.connectStore = {
      currentName: {}, //缓存选中的区域
      chartRelated: false  //是否已触发联动
    };

    this.getChart = () => ({
      // 特殊处理，先调用echart实例的resize方法，然后重绘（用于重新计算lineWidth）
      resize: () => {
        this.setState({
          uuid: new Date().getTime()
        })
      },
      chart: this.graph
    })

    if (props.clearSelect) {
      this.connectStore = {
        currentName: {}, //缓存选中的列
        chartRelated: false
      }
    }
  }

  componentWillMount() {
    // 预先进行数据处理
    const { code, id, data } = this.props

    if (data) {
      this._convertGeoData(data, (_data) => {
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
    this.runDrawEmptyGraph()
  }

  componentWillReceiveProps(nextProps) {
    const { code, data, id, clearSelect, layoutOptions } = nextProps
    if (clearSelect || id !== this.props.id) {
      this.connectStore = {
        currentName: {},
        chartRelated: false
      }
    }
    if (!_.isEqual(this.props.data, data) && data) {
      this._convertGeoData(data, (_data) => {
        if (_data.geoCoordMap && _.keys(_data.geoCoordMap).length > 0) {
          window[`${code}::${id}`] = _data
        } else if (window[`${code}::${id}`]) {
          _data = window[`${code}::${id}`]
        }
        this.setState(() => ({ convertedData: _data }))
      })
    }
    if (layoutOptions && !_.isEqual(this.props.layoutOptions, layoutOptions)) {
      this.setState({
        labelMapStyles: this._getGlobalStyles(layoutOptions)
      })
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { uuid, dataGrid } = this.props
    const { convertedData, labelCoords, labelMapStyles } = this.state
    const nextConvertedData = nextState.convertedData
    const sizeChanged = dataGrid && (dataGrid.w !== nextProps.dataGrid.w || dataGrid.h !== nextProps.dataGrid.h)
    const dataChanged = !_.isEqual(convertedData, nextConvertedData)
    const labelChanged = !_.isEqual(labelCoords, nextState.labelCoords)
    const styleChanged = nextState.labelMapStyles && !_.isEqual(nextState.labelMapStyles, labelMapStyles)
    if (labelChanged || styleChanged || dataChanged) {
      return true;
    }
    // uuid变化 尺寸 数据变化
    if (uuid !== nextProps.uuid || sizeChanged || this.state.uuid !== nextState.uuid) {
      this.graph.resize()
      return true
    }
    return false
  }

  componentDidUpdate() {
    const { convertedData } = this.state
    if (convertedData) {
      this.runDrawGraph()
    } else {
      this.runDrawEmptyGraph()
    }
  }

  render() {
    const { id, style } = this.props
    const { uuid } = this.state
    return [
      <div key={`graph-inner-box-${id}-${uuid}`} className="graph-inner-box" style={style} ref={(node) => { this.graphNode = node }} />,
      ...this.renderLabels()
    ]
  }

  renderLabels() {
    const { id, scaleRate, through, throughList, events, editable, designTime, currentId } = this.props
    const { convertedData, labelHeight, labelWidth, labelCoords, labelMapStyles } = this.state
    const { chartRelated, currentName } = this.connectStore

    // 如果没有数据或正在绘制地图
    if (!convertedData) {
      return []
    }
    const { lenged } = convertedData
    // 开始组织label标签的DOM
    const labels = convertedData.data.map((item, index) => {
      const { name, values } = item
      const coord = labelCoords[index]

      if (!coord) {
        return null
      }

      const labelLeft = coord.x - (coord.isLeft ? labelWidth : 0)
      const labelTop = coord.y - (labelHeight / 2) - 2
      const lineLengthX = Math.abs(coord.x - coord.originX)
      const lineLengthY = Math.abs(coord.y - coord.originY)
      const isRelated = chartRelated && (currentId === id)
      const isOutOfConnect = isRelated && currentName.name !== item.name

      const clickEvent = (e) => {
        if (through) {
          if (!editable && e.stopPropagation) {
            e.stopPropagation()
          }
          events.onThrough('label_map', name)
        } else if (!designTime && !editable && (!Array.isArray(throughList) || throughList.length === 0)) {
          // 必須非穿透狀態才联动
          if (e.stopPropagation) {
            e.stopPropagation()
          }
          if (this.validConnect) {
            this.handleClickLabel({ name })
          }
        }
      }
      // 鼠标移入移出事件参数
      const mouseEventParam = {
        chartId: id,
        name,
        index
      }

      const valueSpans = lenged.map((key) => {
        const value = values[key];
        return <span key={`label-map-label-value-${id}-${key}`} style={{ padding: '2px 0', fontSize: '16px' }}>{value}</span>
      })

      if (valueSpans.length > 1) {
        valueSpans[2] = valueSpans[1];
        valueSpans[1] = (
          <span className="label-map-label-value-split" key={`label-map-label-value-split-${id}`} style={{
            display: 'block',
            width: '20px',
            height: '2px',
            margin: '4px 0',
            background: isOutOfConnect ? '#666' : labelMapStyles.valueColor
          }}/>
        )
      }

      return (
        <div className="label-map-label" ref={(node) => { this[`label-map-label-${id}-${index}}`] = node }}
          key={`label-map-label-${id}-${index}}`}
          style={{
            ...this.STYLES.label,
            width: `${labelWidth}px`,
            height: `${labelHeight}px`,
            borderColor: isOutOfConnect ? '#666' : labelMapStyles.borderColor,
            color: isOutOfConnect ? '#666' : labelMapStyles.valueColor,
            left: `${labelLeft}px`,
            top: `${labelTop}px`,
            transform: scaleRate > 1.1 ? 'translate3d(0,0,2px)' : 'none',
          }}
          onMouseEnter={this.handleLabelMouseEnter.bind(this, mouseEventParam, isRelated, isOutOfConnect)}
          onMouseLeave={this.handleLabelMouseLeave.bind(this, mouseEventParam, isRelated, isOutOfConnect)}
          onClick={clickEvent}
        >
          <span className="label-map-label-name" style={{
            fontSize: '16px',
            padding: '5px',
            position: 'absolute',
            whiteSpace: 'nowrap',
            left: `${coord.isLeft ? (labelWidth) : 0}px`,
            transform: coord.isLeft ? 'none' : 'translateX(-100%)',
            top: `${(labelHeight / 2) - 10 - 16}px`,
            color: isOutOfConnect ? '#666' : labelMapStyles.nameColor,
          }}>{name}</span>
          {valueSpans}
          <i ref={(node) => { this[`label-map-label-line-${id}-${index}}`] = node }} style={{
            ...this.STYLES.labelLine,
            width: `${lineLengthX}px`,
            height: `${lineLengthY}px`,
            borderLeftWidth: coord.isLeft ? 0 : '1px',
            borderRightWidth: coord.isLeft ? '1px' : 0,
            borderBottomWidth: coord.isDown ? '1px' : 0,
            borderTopWidth: coord.isDown ? 0 : '1px',
            borderColor: isOutOfConnect ? '#666' : labelMapStyles.borderColor,
            left: `${coord.isLeft ? (labelWidth - 2) : -lineLengthX - 2}px`,
            top: `${(coord.isDown ? -lineLengthY : 0) + (labelHeight / 2)}px`
          }} />
        </div>
      )
    })
    return labels
  }

  // 标签被点击改变
  handleClickLabel(params) {
    // 是否已经是处于选中状态 发起单图联动拼接conditions
    const { chartRelated, currentName } = this.connectStore
    const { data, id, currentId, events } = this.props
    const dims = data.dimsForRelated
    const conditions = []

    //如果当前数据集筛选中currentId为空 或者Id等于currentId就进行逻辑, 如果维度存在的情况下
    if ((!currentId || currentId === id) && dims[0]) {
      this.validConnect = false
      if (chartRelated && params.name === currentName.name) {
        this.connectStore = {
          currentName: {},
          chartRelated: false
        }
      } else {
        conditions.push({
          col_value: params.name,
          col_name: dims[0].col_name,
          operator: '=',
          dim: dims[0]
        })

        this.connectStore = {
          currentName: params,
          chartRelated: true
        }
      }
      if (events.onChartChange) {
        events.onChartChange(conditions, id, () => {
          this.validConnect = true
        })
      }
    }
  }

  // 标签鼠标进入
  handleLabelMouseEnter({ chartId, index, name }) {
    const { currentId, id } = this.props
    const { labelMapStyles } = this.state
    const { chartRelated, currentName } = this.connectStore
    const isRelated = chartRelated && (currentId === id)
    const isOutOfConnect = isRelated && currentName.name !== name
    if (isOutOfConnect) {
      return
    }
    const dom = this[`label-map-label-${chartId}-${index}}`]
    const line = this[`label-map-label-line-${chartId}-${index}}`]
    $(dom).css({
      borderColor: labelMapStyles.hoverColor,
      color: labelMapStyles.hoverColor,
      zIndex: 100
    })
    $(dom).find('.label-map-label-value-split').css({ backgroundColor: labelMapStyles.hoverColor })
    $(dom).find('.label-map-label-name').css({ color: labelMapStyles.hoverColor })
    $(line).css({ borderColor: labelMapStyles.hoverColor })
    this.graph.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      name
    })
  }

  // 标签鼠标移出
  handleLabelMouseLeave({ chartId, index, name }) {
    const { currentId, id } = this.props
    const { labelMapStyles } = this.state
    const { chartRelated, currentName } = this.connectStore
    const isRelated = chartRelated && (currentId === id)
    const isOutOfConnect = isRelated && currentName.name !== name
    if (isOutOfConnect) {
      return
    }
    const dom = this[`label-map-label-${chartId}-${index}}`]
    const line = this[`label-map-label-line-${chartId}-${index}}`]
    $(dom).css({
      borderColor: labelMapStyles.borderColor,
      color: labelMapStyles.valueColor,
      zIndex: 1
    })
    $(dom).find('.label-map-label-value-split').css({ backgroundColor: labelMapStyles.valueColor })
    $(dom).find('.label-map-label-name').css({ color: labelMapStyles.nameColor })
    $(line).css({ borderColor: labelMapStyles.borderColor })
    this.graph.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
      name
    })
  }

  // 绘制空地图
  runDrawEmptyGraph() {
    const { scaleRate } = this.props
    if (this.graph) {
      this.graph.dispose()
    }
    this.graphDom = this.graphNode
    this.graph = echarts.init(this.graphNode)
    if (scaleRate) {
      scaleChart(this.graph, scaleRate)
    }
    const options = this._getOption()
    this.graph.setOption(options)
  }

  // 绘制有数据的图
  runDrawGraph(callback) {
    const { scaleRate, currentId, id } = this.props
    const { convertedData, labelWidth, labelHeight, baseLabelMargin, labelMapStyles } = this.state
    if (this.graph) {
      this.graph.dispose()
    }
    this.graphDom = this.graphNode
    this.graph = echarts.init(this.graphNode)
    if (scaleRate) {
      scaleChart(this.graph, scaleRate)
    }
    // 获取基本配置
    const options = this._getOption()
    this.graph.setOption(options, true)
    // 坐标点配置数据
    itemAreas = []
    const xArray = []
    const chartData = convertedData.data.map((item) => {
      const coord = this.graph.convertToPixel('geo', item.geoCoord)
      coord[0] = Math.round(coord[0]) % 2 !== 0 ? (Math.round(coord[0]) + 1) : Math.round(coord[0])
      coord[1] = Math.round(coord[1]) % 2 !== 0 ? (Math.round(coord[1]) + 1) : Math.round(coord[1])

      itemAreas.push({
        x: coord[0],
        y: coord[1]
      })
      xArray.push(coord[0])
      let itemStyle = {
        normal: {
          color: labelMapStyles.markColor,
          borderColor: labelMapStyles.markShadowColor,
          borderWidth: 15
        },
        emphasis: {
          color: labelMapStyles.markHoverColor,
          borderColor: labelMapStyles.markHoverShadowColor,
          borderWidth: 15
        }
      }
      const { chartRelated, currentName } = this.connectStore
      // 联动刷选之后
      if (chartRelated && (currentId === id) && currentName.name !== item.name) {
        itemStyle = {
          normal: {
            color: '#ccc',
            borderColor: 'rgba(111, 111, 111, 0.5)',
            borderWidth: 15
          },
          emphasis: {
            color: '#ccc',
            borderColor: 'rgba(111, 111, 111, 0.5)',
            borderWidth: 15
          }
        }
      }
      return {
        name: item.name,
        value: item.value,
        x: coord[0],
        y: coord[1],
        fixed: true,
        draggable: false,
        hoverAnimation: false,
        label: {
          normal: {
            show: false
          },
          emphasis: {
            show: false
          }
        },
        itemStyle
      }
    })
    // 对xArray排序
    xArray.sort()
    const xLen = xArray.length
    const midIndex = (xLen & 1) === 0 ? Math.floor((xLen - 1) / 2) : ((xLen - 1) / 2)
    const midX = xArray[midIndex]
    itemAreas.forEach((item) => {
      item.isLeft = item.x <= midX
    })
    const labelAreas = _.cloneDeep(itemAreas)
    // 获取容器大小
    const chartW = this.graph.getWidth()
    const chartH = this.graph.getHeight()
    
    // 计数 左边右分别多少个
    let countLeft = 0
    let countRight = 0

    const leftUnitMargin = Math.floor((chartH - (baseLabelMargin * 2)) / (midIndex + 1))
    const rightUnitMargin = Math.floor((chartH - (baseLabelMargin * 2)) / (xLen - midIndex - 1))
    labelAreas.forEach((item, index) => {
      // 记录下原始位置
      item.originX = item.x
      item.originY = item.y

      // 区分左右进行处理
      if (item.isLeft) {
        item.x = labelWidth + baseLabelMargin
        item.y = chartH - (labelHeight / 2) - baseLabelMargin - (leftUnitMargin * countLeft)
        countLeft++
      } else {
        item.x = chartW - labelWidth - baseLabelMargin
        item.y = chartH - (labelHeight / 2) - baseLabelMargin - (rightUnitMargin * countRight)
        countRight++
      }
      
      item.isDown = item.y > item.originY

      // 先确定一个基础偏移量
      // item.x = item.isLeft ? (labelWidth + baseLabelMargin) : (chartW - labelWidth - baseLabelMargin)

      // DEFINE迭代计算额外的偏移量
      // const calc = () => {
      //   const hitResult = hitTest(item, labelAreas, labelWidth, labelHeight, index)
      //   // 定义单位
      //   const wUnit = labelWidth / 2
      //   const hUnit = labelHeight / 3
      //   if (hitResult.result) {
      //     if (Math.abs(hitResult.hitArea.y - item.y) < Math.abs(hitResult.hitArea.x - item.x)) {
      //       // 如果在碰撞区域下方
      //       if (item.isDown || item.y >= hitResult.hitArea.y) {
      //         item.y += hUnit
      //       } else {
      //         item.y -= hUnit
      //       }
      //       item.isDown = item.y > item.originY
      //     } else {
      //       item.x += (item.isLeft ? 1 : -1) * wUnit
      //     }
      //     calc()
      //   }
      // }
      // // DO计算偏移量
      // calc()

      // 如果出现计算到与初始距离过近的情况
      // if (Math.abs(item.x - item.originX) < baseLabelMargin) {
      //   if (!item.isLeft && item.x >= item.originX) {
      //     item.isLeft = true
      //     item.x = labelWidth + baseLabelMargin
      //     calc()
      //   } else if (item.isLeft && item.x < item.originX) {
      //     item.isLeft = false
      //     item.x = chartW - labelWidth - baseLabelMargin
      //     calc()
      //   }
      // }
      
      // 如果X方向调整过度的情况（本来在右侧，被调整到偏左或反之）重置到左侧再进行一次计算
      // if (!item.isLeft && item.x < item.originX) {
      //   item.isLeft = true
      //   item.x = labelWidth + baseLabelMargin
      //   calc()
      // } else if (item.isLeft && item.x >= item.originX) {
      //   item.isLeft = false
      //   item.x = chartW - labelWidth - baseLabelMargin
      //   calc()
      // }
    })
    this.setState({
      labelCoords: labelAreas
    })
    // 标签点配置数据
    const linkData = convertedData.data.map(item => ({
      name: `__${item.name}`,
      value: item.value,
      draggable: false,
      symbolSize: 0,
      itemStyle: {
        normal: {
          color: 'transparent'
        }
      }
    }))
    // 关系图配置最终数据
    const graphData = [].concat(chartData, linkData)
    // 组装
    options.series = [
      {
        name: 'data',
        type: 'graph',
        // coordinateSystem: 'geo',
        layout: 'force',
        symbolSize: 10,
        lineStyle: {
          normal: {
            color: 'rgba(21,195,224,1)',
            opacity: 1,
            width: 1,
            curveness: 0
          }
        },
        animation: false,
        data: graphData
      }
    ]
    // 加上noMerge = true参数即可防止使用到上一次的配置
    this.graph.setOption(options, true)
    callback && callback()
  }

  // 调用接口取得坐标数据
  _convertGeoData(dataOrigin, callback) {
    console.log(dataOrigin)
    // 异步方法
    AMap.plugin(['AMap.Geocoder'], () => {
      const { dims, nums, displayFormat } = dataOrigin
      const lenged = _.keys(nums)
      const dims_value = _.values(dims)[0]
      const nums_value = _.values(nums[lenged[0]])
      const nums_value_len = nums_value.length
      const geocoder = new AMap.Geocoder();
      // 使用Promise.all 使得回调只执行一次
      Promise.all(dims_value.slice(0, this.state.maxLength).map((item, i) => new Promise((resolve) => {
        const values = {}
        lenged.forEach((key) => {
          if (displayFormat[key]) {
            values[key] = formatDisplay(nums[key][i], displayFormat[key])
          } else {
            values[key] = nums[key][i]
          }
        })
        // data
        const data = {
          name: dims_value[i],
          values
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
            geoCoordMap,
            data
          })
        })
      }))).then((obj) => {
        if (typeof callback === 'function' && Array.isArray(obj) && obj.length > 0) {
          const mapData = {}
          obj.forEach((item) => {
            const geoCoord = item.geoCoordMap[item.data.name]
            mapData.data = _.concat(mapData.data || [], {
              ...item.data,
              geoCoord
            })
            if (!mapData.length) {
              mapData.length = item.length
            }
            if (!mapData.lenged) {
              mapData.lenged = item.lenged
            }
          })
          mapData.data = _.sortBy(mapData.data, p => p.geoCoord[1])
          callback(mapData)
        }
      })
    });
  }

  // 获取颜色
  _getGlobalStyles(layouts) {
    if (!layouts) {
      layouts = this.props.layoutOptions || {}
    }

    let { global } = layouts
    
    if (!global) {
      global = {}
    }

    return {
      borderColor: global.borderColor || '#20ADE2',
      nameColor: global.nameColor || '#C7E0FF',
      valueColor: global.valueColor || '#C7E0FF',
      hoverColor: global.hoverColor || '#41DFE3',
      markColor: global.markColor || '#FFFFFF',
      markHoverColor: global.markHoverColor || '#41DFE3',
      markShadowColor: global.markShadowColor || 'rgba(29, 169, 206, 0.5)',
      markHoverShadowColor: global.markHoverShadowColor || 'rgba(29, 169, 206, 0.5)',
      mapColor: global.mapColor || '#488DFB',
      mapBorderColor: global.mapBorderColor || '#00B2FF'
    }
  }

  // 获取基本配置项
  _getOption() {
    const { labelMapStyles } = this.state
    return {
      backgroundColor: 'transparent',
      title: {
        left: 'center',
        textStyle: {
          color: '#fff'
        }
      },
      tooltip: {
        trigger: 'none'
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
            areaColor: labelMapStyles.mapColor,
            borderColor: labelMapStyles.mapBorderColor
          },
          emphasis: {
            areaColor: labelMapStyles.mapColor
          }
        },
        zlevel: 0,
        z: 0,
        silent: true
      },
      animation: false,
      series: []
    }
  }

  STYLES = {
    label: {
      cursor: 'pointer',
      lineHeight: 1,
      borderWidth: '2px',
      borderStyle: 'solid',
      borderRadius: '50%',
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      transition: 'color, background, border-color .2s'
    },
    // 标签连线
    labelLine: {
      position: 'absolute',
      borderStyle: 'solid',
      transition: 'border-color .2s',
      pointerEvents: 'none'
    }
  };
}

export default LabelMap;
