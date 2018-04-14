import React from 'react'
import PropTypes from 'prop-types'
import AreaDitu from './ditu/AreaDitu'
import { Connect, Utils } from 'dmp-chart-sdk'
import _ from 'lodash'

import './area_map.less'

const { formatDisplay, Theme, generateReportRedirectUrl } = Utils

const _pluckGeoInfo = function (data, colName) {
  if (data[`${colName}_longitude`] && data[`${colName}_latitude`]) {
    // 模仿高德api 返回的数据格式, 以统一处理
    return {
      addressComponent: {
        country: data[`${colName}_country`],
        province: data[`${colName}_province`],
        city: data[`${colName}_city`],
        district: data[`${colName}_district`],
        street: data[`${colName}_street`],
      },
      location: {
        lat: data[`${colName}_latitude`],
        lng: data[`${colName}_longitude`]
      },
      // 后台 标识'省' '市' '地区' 详情看 http://lbs.amap.com/api/javascript-api/reference/lnglat-to-address
      level: data[`${colName}_level`]
    }
  }
  return null
}

/**
 * 区域地图组件
 */
class AreaMap extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  static propTypes = {
    // 是否为设计时
    designTime: PropTypes.bool,
    // 数据源
    data: PropTypes.object,
    // 配置项
    config: PropTypes.object,
    // 可用事件
    events: PropTypes.object,
    // 组件图层位置尺寸等信息
    layer: PropTypes.object,
    dashboardName: PropTypes.string,
    editable: PropTypes.bool,
    platform: PropTypes.string,
    configInList: PropTypes.array
  };

  constructor(props) {
    super(props)
    this.state = {
      mapMarking: false
    }
    this.getChart = () => null
  }

  componentDidMount() {
    this.initMap()
    this.runMapWithData()
  }

  componentDidUpdate(preProps) {
    const { data, config } = this.props
    if (!_.isEqual(data, preProps.data)) {
      this.runMapWithData()
    }
    if (!_.isEqual(config.theme.colorTheme, preProps.config.theme.colorTheme) ||
      !_.isEqual(config.mapCustomSetting.unionLabel, preProps.config.mapCustomSetting.unionLabel) ||
      !_.isEqual(config.mapCustomSetting.labelShow, preProps.config.mapCustomSetting.labelShow) ||
      !_.isEqual(config.mapCustomSetting.label, preProps.config.mapCustomSetting.label)
    ) {
      this._updateStyle()
    }
    if (!_.isEqual(config.mapCustomSetting.areaSetting.list, preProps.config.mapCustomSetting.areaSetting.list)) {
      this.setChartAreaConfig()
    }
  }

  componentWillUnmount() {
    this.disposeMap()
  }

  render() {
    const { designTime } = this.props
    const { mapMarking } = this.state
    return <div className="graph-inner-box map" ref={(node) => { this.graphNode = node }} onClick={this.handleContainerClick.bind(this)}>
      <div className="zoom-container">
        {designTime && <button className={mapMarking ? 'active' : ''} style={{ marginBottom: '5px' }} onClick={this.handleAddCustomMarker.bind(this)} title="标记地点">
          <i style={{ fontSize: '15px' }} className="dmpicon-map-flag-empty" />
        </button>}
        <button onClick={this.handleZoom.bind(this, true)} title="放大一级">+</button>
        <button onClick={this.handleZoom.bind(this, false)} title="缩小一级">-</button>
        <button onClick={this.handleRestMap.bind(this)} title="缩放到中国"><i style={{ fontSize: '12px' }} className="dmpicon-chart-map"/></button>
      </div>
    </div>
  }

  initMap() {
    const { config } = this.props
    const { pos } = config.mapCustomSetting // layoutOptions.mapOption.pos
    this._chart = new AreaDitu(this.graphNode, { ...pos })
    // this._chart.setAreaConfig(layoutOptions.areaConfig)
    // 区域设置依赖地图的状态和数据 所以需要暴露出去
    window.__areaDitu__ = this._chart
    // this._handleParseAddressStart = this.handleParseAddressStart.bind(this)
    // this._handleParseAddressComplete = this.handleParseAddressComplete.bind(this)
    // this._handleParseAddressFailed = this.handleParseAddressFailed.bind(this)
    this._debounceHandleZoomend = _.debounce(this.updateMapOptionPos.bind(this), 1500)

    // this._chart.on('parseStart', this._handleParseAddressStart.bind(this))
    // this._chart.on('parseComplete', this._handleParseAddressComplete.bind(this))
    // this._chart.on('parseFailed', this._handleParseAddressFailed.bind(this))
    this._chart.on('zoomend', this._debounceHandleZoomend)
    this._chart.on('moveend', this._debounceHandleZoomend)
    this._chart.on('addressClick', this.handleAdressClick.bind(this))
    this._chart.on('customMarkEnd', this.handleAddMarkerEnd.bind(this))
    this._updateStyle()
    this.setChartAreaConfig()
    this.setCustomMarkers()
  }

  bindDimClick() {
    this._handleDimClick = this._handleDimClick || this.handleDimClick.bind(this)
    this._chart.on('dimClick', this._handleDimClick)
  }

  unbindDimClick() {
    this._chart.off('dimClick', this._handleDimClick)
  }
 
  disposeMap() {
    this._chart.dispose()
    delete window.__areaDitu__
  }
  runMapWithData() {
    const labelDim = this._getLabelDim()
    let config = {}
    if (labelDim && labelDim.dashboard_jump_config) {
      if (typeof labelDim.dashboard_jump_config === 'string') {
        config = JSON.parse(labelDim.dashboard_jump_config)
      } else {
        config = labelDim.dashboard_jump_config
      }
    }
    if (!this.props.editable && labelDim && config && config.isOpen) {
      this.bindDimClick()
    } else {
      this.unbindDimClick()
    }
    this._chart.setData(this._convertData())
  }

  updateMapOptionPos(/* eventName */) {
    const { events, configInList, designTime } = this.props
    // 如果是发布, 不需实时保存地图的位置
    if (!designTime) {
      return
    }
    const { updateConfig } = events || {}
    // 如果不存在updateConfig方法 直接跳出
    if (!updateConfig) {
      return
    }
    // 查找自定义地图设置的index
    const mapCustomSettingIndex = _.findIndex(configInList, item => item.field === 'mapCustomSetting')
    // 如果不存在则跳出 存在则进行设置更新
    if (mapCustomSettingIndex === -1) {
      return;
    }
    const latlng = this._chart.center()
    const center = [latlng.lng, latlng.lat]
    const zoom = this._chart.zoom()
    const { items } = configInList[mapCustomSettingIndex]
    for (let j = 0; j < items.length; j++) {
      if (items[j].field === 'pos') {
        items[j].data.zoom = zoom
        items[j].data.center = center
        break
      }
    }
    // for (let i = 0; i < configInList.length; i++) {
    //   if (configInList[i].field === 'mapCustomSetting') {
    //     const { items } = configInList[i]
    //     for (let j = 0; j < items.length; j++) {
    //       if (items[j].field === 'pos') {
    //         items[j].data.zoom = zoom
    //         items[j].data.center = center
    //         break
    //       }
    //     }
    //     break
    //   }
    // }
    updateConfig(configInList)
  }

  updateMapOptionCustomMarkers() {
    const { events, configInList } = this.props
    const { updateConfig } = events || {}
    // 如果不存在updateConfig方法 直接跳出
    if (!updateConfig) {
      return;
    }
    // 查找自定义地图设置的index
    const mapCustomSettingIndex = _.findIndex(configInList, item => item.field === 'mapCustomSetting')
    // 如果不存在则跳出 存在则进行设置更新
    if (mapCustomSettingIndex === -1) {
      return;
    }
    // 获取所有的自定义标记数据
    const allMarkers = this._chart.getAllCustomMarkersData()
    // 查找自定义标记配置所在的INDEX
    const customMarkersIndex = _.findIndex(configInList[mapCustomSettingIndex].items, item => item.field === 'customMarkers')
    // 如果没有则插入 有则更新
    if (customMarkersIndex === -1) {
      configInList[mapCustomSettingIndex].items.push({
        field: 'customMarkers',
        data: {
          list: allMarkers
        }
      })
    } else {
      configInList[mapCustomSettingIndex].items[customMarkersIndex].data.list = allMarkers
    }
    // for (let i = 0; i < configInList.length; i++) {
    //   if (configInList[i].field === 'mapCustomSetting') {
    //     const { items } = configInList[i]
    //     let hasProp = false
    //     for (let j = 0; j < items.length; j++) {
    //       if (items[j].field === 'customMarkers') {
    //         items[j].data = {
    //           ...items[j].data,
    //           list: allMarkers
    //         }
    //         hasProp = true
    //         break
    //       }
    //     }
    //     if (!hasProp) {
    //       items.push({
    //         field: 'customMarkers',
    //         data: {
    //           list: allMarkers
    //         }
    //       })
    //     }
    //     break
    //   }
    // }
    updateConfig(configInList)
  }

  _updateStyle() {
    const { config, designTime } = this.props
    this._chart.updateChartStyle({
      designTime,
      addressColor: params => Theme.getColorFromTheme(config.theme.colorTheme, params.index),
      unionLabel: config.mapCustomSetting.unionLabel,
      labelShow: config.mapCustomSetting.labelShow,
      labelColor: config.mapCustomSetting.label.color,
      labelBackground: config.mapCustomSetting.label.background
    })
  }

  _getAddressDimIndex = function () {
    const { data } = this.props
    let addressDimIndex = -1
    // const originData = data.data
    const { indicators } = data
    const { dims } = indicators

    dims.forEach((dim, i) => {
      if (addressDimIndex === -1 && dim.data_type === '地址') {
        addressDimIndex = i
      }
    })
    if (dims.length > 0) {
      addressDimIndex = Math.max(addressDimIndex, 0)
    }
    return addressDimIndex
  }

  _getLabelDim = function () {
    const { data } = this.props
    const addressDimIndex = this._getAddressDimIndex()
    let labelDim = {}
    if (addressDimIndex > -1) {
      labelDim = data.indicators.dims[addressDimIndex === 0 ? 1 : 0]
    }
    return labelDim
  }

  _convertData() {
    const { data/* , config */ } = this.props
    const areaData = {
      // 作为地址
      addressDim: { name: '', colName: '', data: [], geoInfo: null },
      // 其他的dims
      dims: [],
      nums: {}
    }
    if (data && data.indicators.dims.length === 2) {
      const addressDimIndex = this._getAddressDimIndex()
      const originData = data.data
      const { indicators } = data
      const { dims, nums } = indicators

      /* 目前只支持两个个维度
      /* 如果两个都是字符串, 那么第一个作为地址字符串, 高德解析出地理位置
          如果有一个是地址类型的, 那个地址类型当做地址
      */
      dims.forEach((dim, i) => {
        const name = dim.alias_name || dim.alias
        const { col_name } = dim
        if (addressDimIndex === i) {
          areaData.addressDim.name = name
          areaData.addressDim.colName = col_name
        } else {
          areaData.dims.push({
            data: [],
            colName: col_name,
            name
          })
        }
      })

      // 数值维度
      const numsColNames = []
      const numsNames = []
      nums.forEach((num) => {
        const numName = num.alias || num.alias_name
        numsColNames.push((num.formula_mode ? (`${num.formula_mode}_`) : '') + num.col_name)
        numsNames.push(numName)
        const displayFormat = num.display_format
        areaData.nums[numName] = {
          data: [],
          formatter: params => (
            displayFormat ? `${formatDisplay(params.value, displayFormat)}${displayFormat.column_unit_name}` : params.value
          )
        }
      })
      // 处理data
      for (let i = 0, l = originData.length; i < l; i++) {
        const item = originData[i]
        areaData.addressDim.data.push({
          value: item[areaData.addressDim.colName],
          geoInfo: _pluckGeoInfo(item, areaData.addressDim.colName)
        })
        areaData.dims.forEach((d) => {
          d.data.push(item[d.colName])
        })
        numsColNames.forEach((col, j) => {
          areaData.nums[numsNames[j]].data.push(Number.isNaN(item[col]) ? '--' : item[col])
        })
      }
    }

    return areaData
  }

  setChartAreaConfig() {
    const { config } = this.props
    this._chart.setAreaConfig(config.mapCustomSetting.areaSetting)
  }

  setCustomMarkers() {
    const { config } = this.props
    this._chart.setCustomMarkerData(_.cloneDeep(_.get(config, 'mapCustomSetting.customMarkers.list', []) || []))
  }

  handleZoom(zoomIn) {
    if (zoomIn) {
      this._chart.zoomIn()
    } else {
      this._chart.zoomOut()
    }
  }

  handleContainerClick() {
  }

  handleRestMap() {
    this._chart.resetMap()
  }

  // 地址点击
  handleAdressClick(type, params) {
    const { data } = this.props
    const addressDimIndex = this._getAddressDimIndex()
    let addressDim = null
    if (addressDimIndex > -1) {
      addressDim = data.indicators.dims[addressDimIndex]
    }
    // console.log(addressDim, params, '909090909999999999999999')
    // 添加联动, 穿透等代码
    !this.props.editable && this.reportRedirect(addressDim, params)
    return true
  }

  // 标签点击
  handleDimClick(type, params) {
    const labelDim = this._getLabelDim()
    // console.log(labelDim, params, '=================================')
    // 添加联动, 穿透等代码
    this.reportRedirect(labelDim, params)
    return true
  }

  //跳转链接
  reportRedirect(dim, params) {
    let config = {}
    const { dashboard_jump_config } = dim
    const { protocol, host } = window.location
    if (dashboard_jump_config) {
      if (typeof dashboard_jump_config === 'string') {
        config = JSON.parse(dashboard_jump_config)
      } else {
        config = dashboard_jump_config
      }
      if (config.isOpen) {
        const callback = (url) => {
          if (!url) {
            return;
          }

          if (config.direct_way === 2) {
            window.open(`${protocol}//${host}${url}`, '_blank')
          } else if (config.direct_way === 1 && this.props.platform === 'mobile') {
            this.context.router.push(url)
          } else if (config.direct_way === 1) {
            this.context.router.replace(url)
          }
        }
        
        generateReportRedirectUrl(config, params.value, this.props.dashboardName, callback)
      }
    }
  }

  handleAddCustomMarker() {
    this.setState({
      mapMarking: true
    })
    // 开始添加自定义标注
    this._chart.startMarking()
  }

  handleAddMarkerEnd(type, cancel) {
    this.setState({
      mapMarking: false
    })
    // 保存到服务器
    if (!cancel) {
      this.updateMapOptionCustomMarkers()
    }
  }
}
export default Connect()(AreaMap)
