import BaseDitu from './BaseDitu'
import _ from 'lodash'
import { /* areaMapStyles,  */converStyleToMap, color2MapPlogonStyle } from './constants'

import './area-ditu.less'

const { AMap } = window
// 最大的岛面积(平方米) 参考香港
const _minArea = 1000 * 1000 * 1000
// 由于需要解决点击区域, 但是不能取消冒泡到地图的bug(高德bug)
let _isAddressJustClick = false

function AreaDitu(dom, options) {
  BaseDitu.call(this, dom, options)
  // 缓存区域信息字典
  this._areaCache = {}

  this._addressCache = {}

  this._data = {
    addressDim: {
      color: null,
      name: '',
      colName: '',
      data: [/*{value: , geoInfo: }*/]
    },
    dims: [],
    nums: {}
  }

  this._customMarkerList = {
    list: [],                     // 原始数据, 来源AreaMap 的 config
    markers: []                   // 地图markers
  }

  this._event = {
    parseStart: [],         // 开始解析地址
    parseComplete: [],      // 解析完成
    parseFailed: [],        // 解析有失败
    areasComplete: [],      // 暂时没有用
    areasFailed: [],        // 按时无用
    zoomend: [],            // 地图缩放结束
    moveend: [],            // 地图移动结束
    beforeAction: [],       // 暂时无用
    addressClick: [],       // 点击地址
    dimClick: [],           // 点击显示的维度
    customMarkEnd: [],      // 点标记添加结束
  }

  this._state = {
    parsing: false,         // 正在解析地址
    pointMarking: false     // 正在添加自定义点标记
  }

  this._style = {
    unionLabel: false,
    labelShow: 'auto',
  }

  this._groupLabels = []

  this._areaConfig = null  // 自定义区域信息

  this._areaToolMarker = null

  this._customMarkerTemp = null  // 自定点标

  this._visibleLabelAddresses = []  // 可见的标签地址

  this._init()
}

AreaDitu.prototype = Object.create(BaseDitu.prototype)

AreaDitu.prototype._init = function () {
  this._map.on('zoomend', this._handleZoomend.bind(this))
  this._map.on('zoomstart', this._handleZoomstart.bind(this))
  // this._map.plugin(["AMap.ToolBar"], () => {
  //   const tool = new AMap.ToolBar()
  //   this._map.addControl(tool)
  // })
  this._map.on('movestart', this._handleMovestart.bind(this))
  this._map.on('moveend', this._handleMoveend.bind(this))
  this._map.on('click', this._handleMapClick.bind(this))
  this._map.on('mousemove', this._handleMapMouseMove.bind(this))
  this._map.on('rightclick', this._handleRightClick.bind(this))
  this._map.setDefaultCursor('default')
}

// 数据格式参考构造函数
AreaDitu.prototype.setData = function (data) {
  this._data = {
    ...this._data,
    ...data
  }
  this._cleanCache()
  this._clearAllAreaMarkers()
  this.render()
}

AreaDitu.prototype._getDimByIndex = function (index) {
  const { dims } = this._data
  // 目前只支持一个维度
  if (dims && dims[index]) {
    // const keys = Object.keys(dims)
    // const key = keys[0]
    return dims[index].data || []
  }
  return []
}

AreaDitu.prototype.render = function () {
  this.parseAddressesAndRender()
}

// 解析一个地址点, 并找到相应的地区,市和省, 并绘制区域, 缓存所有的绘制对象
AreaDitu.prototype.parseAddressesAndRender = function () {
  this.trigger('parseStart')
  const promiseList = []
  const addressDimDataUniq = _.uniqBy(this._data.addressDim.data || [], item => item.value)
  addressDimDataUniq.forEach(({ value, geoInfo }) => {
    // 如果有缓存
    if (this._addressCache[value]) {
      // 但是如果数值发生变化, 那么需要更细infoMark 的显示信息
      return
    }
    if (geoInfo) {
      promiseList.push(Promise.resolve({ address: value, geocode: geoInfo }))
    } else {
      const pro = this._getAddressInfo(value)
      promiseList.push(pro)
    }
  })

  Promise.all(promiseList).then((geocodes) => {
    geocodes.forEach(({ address, geocode }) => {
      if (!geocode) {
        console.warn('geocode not found! ', address)
        return
      }
      // const { location, addressComponent } = geocode
      // const { province, city, district } = addressComponent
      // 缓存, 注意: 地址已经去重了
      this._addressCache[address] = {
        ...this._addressCache[address],
        geocode
      }
    })
    // 触发解析完成的事件
    this.trigger('parseComplete')
    this.renderAllAdresses()
    // this.initAllAreas()
  }).catch((e) => {
    this.trigger('parseFailed')
    throw Error(e)
  })
}

AreaDitu.prototype.renderAllAdresses = function () {
  const addressDimData = this._data.addressDim.data || []
  const dimArray = this._getDimByIndex(0)
  const dimLen = dimArray.length
  const promiseList = []
  const addressSet = []
  addressDimData.forEach(({ value }, i) => {
    // 点
    const title = dimLen === 0 ? '[请拖入第二个维度]' : (dimArray[i] || '--')
    const data = this._addressCache[value]
    if (data) {
      const { geocode } = data
      if (geocode) {
        const { location, level } = geocode
        const isArea = this._isArea(level)
        // 除去重复的地址高德api请求
        const hasInitedPolygons = addressSet.indexOf(value) > -1
        if (!hasInitedPolygons) {
          addressSet.push(value)
        }
        promiseList.push(this.renderAddressToMap(isArea, hasInitedPolygons, value, title, this._locationToPostion(location), i))
      }
    }
  })
}

AreaDitu.prototype._getAllAddressFromCache = function () {
  return Object.getOwnPropertyNames(this._addressCache)
}

AreaDitu.prototype._getAddressIndex = function (address) {
  return this._getAllAddressFromCache().indexOf(address)
}

AreaDitu.prototype.getAllAreaFromPoints = function () {
  return this._getAllAreaFromPoints()
}

// return ['xxx省', 'xxx', 'xxx']
AreaDitu.prototype._getAllAreaFromPoints = function () {
  const areaKeys = Object.getOwnPropertyNames(this._addressCache)
  return _.uniq(areaKeys)
}
// 每次setData之后需要清空没必要的缓存
AreaDitu.prototype._cleanCache = function () {
  const addressKeyList = this._data.addressDim.data.map(({ value }) => value)
  const pointKeys = Object.getOwnPropertyNames(this._addressCache)
  pointKeys.forEach((key) => {
    const cache = this._addressCache[key]
    if (addressKeyList.indexOf(key) === -1) {
      cache.polygons && this._map.remove(cache.polygons)
      cache.marker && this._map.remove(cache.marker)
      cache.areaMarker && this._map.remove(cache.areaMarker)
      delete this._addressCache[key]
    }
  })
}

AreaDitu.prototype.areaAddressInit = function (address, areaName) {
  return new Promise((resolve) => {
    this.districtSearch(areaName).then((info) => {
      const { bounds, level } = info
      const show = this._shouldLayerShow(level)
      const eventHandle = this._handleAddressEvent.bind(this, address)
      const polygons = []
      if (Array.isArray(bounds)) {
        const boundsLen = bounds.length
        bounds.forEach((bound) => {
          //生成行政区划polygon
          const polygon = new AMap.Polygon({
            path: bound,
            bubble: false              // 高德你这个配置有用? 生效了?
          })
          // 需要把小岛过滤掉, 否则需要遍历的太多, 但是至少保留一个
          if ((boundsLen === 1) || (polygon.getArea() > _minArea)) {
            polygon.setMap(this._map)
            polygon.on('click', eventHandle)
            // polygon.on('mousemove', eventHandle)
            // polygon.on('mouseout', eventHandle)
            if (!show) {
              polygon.hide()
            }
            polygons.push(polygon)
          }
          //缓存
          this._addressCache[address] = {
            ...this._addressCache[address],
            polygons
          }
        })
        // for (let i = 0, l = bounds.length; i < l; i++) {
        //   //生成行政区划polygon
        //   const polygon = new AMap.Polygon({
        //     path: bounds[i],
        //     bubble: false              // 高德你这个配置有用? 生效了?
        //   })
        //   // 需要把小岛过滤掉, 否则需要遍历的太多, 但是至少保留一个
        //   if ((l === 1) || (polygon.getArea() > _minArea)) {
        //     polygon.setMap(this._map)
        //     polygon.on('click', eventHandle)
        //     // polygon.on('mousemove', eventHandle)
        //     // polygon.on('mouseout', eventHandle)
        //     if (!show) {
        //       polygon.hide()
        //     }
        //     polygons.push(polygon)
        //   }
        //   //缓存
        //   this._addressCache[address] = {
        //     ...this._addressCache[address],
        //     polygons
        //   }
        // }
      }
      this._updateAddressStyle(address)
      resolve({ polygons })
    }).catch((e) => {
      resolve({})
      console.warn('区域地图: areaAddressInit error: ', e)
    })
  })
}

AreaDitu.prototype._clearAllAreaMarkers = function () {
  Object.getOwnPropertyNames(this._addressCache).forEach((address) => {
    const cache = this._addressCache[address]
    if (cache.areaMarker) {
      this._map.remove(cache.areaMarker)
      cache.areaMarker = null
    }
  })
}

AreaDitu.prototype._updateAreaMarker = function (address, isArea, dataIndex, title) {
  const cache = this._addressCache[address]
  const numData = this.getDataByIndex(dataIndex)
  if (numData.keys.length === 0) {
    return
  }
  const infoList = numData.keys.map((key, i) => {
    const { value, formatter } = numData.values[i]
    const formatterV = formatter ? formatter({ value }) : value
    return `<div class="item">${key} : ${formatterV}</div>`
  })

  const areaMarker = (cache && cache.areaMarker) ? cache.areaMarker : new AMap.Marker({
    map: this._map,
    offset: new AMap.Pixel(0, isArea ? 0 : -35),
    title: `地理位置: ${address}`,
    zIndex: 1500
  })

  let content = areaMarker.getContent()
  // 注意: 这是聚合显示数据
  if (content) {
    content = $(content).append([`<div class="title">${title}</div>`, `<div class="content">${infoList.join('')}</div>`])
  } else {
    content = $(`<div class="tip-marker"><div class="title">${title}</div><div class="content">${infoList.join('')}</div></div>`)
    const contentStyle = this._getCustomAreaStyle(address)
    if (contentStyle) {
      content.css(contentStyle)
    }
  }

  if (this._event.dimClick.length > 0) {
    const titles = content.find('.title')
    // 注意: 只需要绑定最后一个即可, 前面的已经绑定了事件
    $(titles[titles.length - 1]).addClass('link').attr('title', title).on('click', this._handleDimClick.bind(this, title))
  }


  areaMarker.setPosition(cache.position)
  areaMarker.setContent(content[0])
  if (!this._shouldLayerShow('addressLabel', { address })) {
    areaMarker.hide()
  }
  this._addressCache[address] = {
    ...this._addressCache[address],
    areaMarker
  }
}

AreaDitu.prototype._updateAllAreaMarkers = function () {
  // 聚合同名的label
  // const { unionLabel } = this._style
  // const show = this._shouldLayerShow('areaMarker')
  const addressDimData = this._data.addressDim.data || []
  const dimArray = this._getDimByIndex(0)
  this._clearAllAreaMarkers()
  // 第一步
  // const addressSet = []
  addressDimData.forEach(({ value }, i) => {
    const cache = this._addressCache[value]
    if (!cache) {
      return
    }
    const { geocode } = cache
    const { level } = geocode
    const isArea = this._isArea(level)
    const title = dimArray[i] || '--'
    this._updateAreaMarker(value, isArea, i, title)
  })
}

AreaDitu.prototype._updateAllAddressStyle = function () {
  Object.getOwnPropertyNames(this._addressCache).forEach((address) => {
    this._updateAddressStyle(address)
  })
}

AreaDitu.prototype._updateAddressStyle = function (address) {
  const cache = this._addressCache[address]
  if (cache) {
    const themeStyle = this._getThemeStyle(address)
    const style = this._getAreaStyleByConfig(address)
    cache.polygons && cache.polygons.forEach((polygon) => {
      polygon.setOptions({
        ...polygon.getOptions(),
        ...themeStyle,
        ...style
      })
    })
  }
}
// 标签标题的点击事件, 主要用来处理联动, 穿透, 报告筛选
AreaDitu.prototype._handleDimClick = function (name, event) {
  if (this.trigger('dimClick', { value: name, event })) {
    // 在这里执行默认的代码
    // console.log('执行默认dimClick代码...............................................')
  }
}
// 地址事件 如点击事件, 主要用来处理联动, 穿透, 报告筛选
AreaDitu.prototype._handleAddressEvent = function (address, event) {
  // const position = this._locationToPostion(e.lnglat)
  const cache = this._addressCache[address]
  switch (event.type) {
    case 'click':
      // 执行自定义方法
      if (this.trigger('addressClick', { data: cache, value: address, event })) {
        // 执行默认方法
        // console.log('执行默认addressClick代码...............................................')
        // 只显示当前点击的标签, 隐藏没有点击的
        this._pushLabelVisibleAddress(address)
        this._updateAllAreaMarkers()
        // 取消click的冒泡, 高德不支持, 只能模拟
        _isAddressJustClick = true
        setTimeout(() => {
          _isAddressJustClick = false
        }, 200)
      }
      // const bounds = e.target.getBounds()
      // this._setMapBounds(bounds)
      break
    case 'mousemove':
      // this._showAreaTooltip(name, position)
      break
    case 'mouseout':
      // this._hideAreaTooltip()
      break
    default:
      break
  }
  // console.log(arguments, '90-90-890-80-80809809', this._areaCache)
}

// 设置区域的边框 填充等样式
// AreaDitu.prototype.setAreaStyle = function (name, style) {
//   const cache = this._areaCache[name]
//   if (style && cache && cache.polygons) {
//     cache.polygons.forEach((polygon) => {
//       polygon.setOptions({
//         ...polygon.getOptions(),
//         ...style
//       })
//     })
//   }
// }

AreaDitu.prototype.renderAddressToMap = function (isArea, hasInitedPolygons, name, title, position, dataIndex) {
  const cache = this._addressCache[name]

  this._addressCache[name] = {
    ...this._addressCache[name],
    position,
  }

  this._updateAreaMarker(name, isArea, dataIndex, title)

  // 地址是一个区域
  if (isArea) {
    const { geocode } = cache || {}
    if (geocode) {
      // 使用缓存
      if (_.get(cache, 'polygons.length') > 0) {
        this._updateAddressStyle(name)
      } else if (!hasInitedPolygons) {
      // get area info from api
        const areaName = this._getAreaNameFromGeocode(geocode)
        return this.areaAddressInit(name, areaName)
      }
      return Promise.resolve({})
    }
    console.warn('区域地图: get area info from api, but geocode is not found!')
    return Promise.resolve({})
  }
  let marker = cache && cache.marker
  if (!marker) {
    marker = new AMap.Marker({
      map: this._map,
      icon: 'http://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
      zIndex: 1000,
      title: name
    })
    const eventHandle = this._handleAddressEvent.bind(this, name)
    marker.on('click', eventHandle)
  }

  marker.setPosition(position)
  if (!this._shouldLayerShow('infoPin')) {
    marker.hide()
  }
  this._addressCache[name] = {
    ...this._addressCache[name],
    marker,
  }
  return Promise.resolve({ marker })
}

AreaDitu.prototype._handleZoomstart = function () {
  // this.trigger('beforeAction')
}

AreaDitu.prototype._handleZoomend = function () {
  // const zoom = this.zoom()
  // areas
  const keys = Object.getOwnPropertyNames(this._areaCache)
  keys.forEach((key) => {
    const data = this._areaCache[key]
    const { level, polygons } = data
    const show = this._shouldLayerShow(level)
    const isVisible = this._isDistrictVisible(key)
    // 保证效率, 不掉没有必要的遍历
    if (show !== isVisible) {
      polygons.forEach((polygon) => {
        show ? polygon.show() : polygon.hide()
      })
    }
  })

  // layers
  const shouldInfoPinShow = this._shouldLayerShow('infoPin')
  const shouldInfoMarkerShow = this._shouldLayerShow('infoMarker')
  const pointKeys = Object.getOwnPropertyNames(this._addressCache)
  pointKeys.forEach((pointKey) => {
    const data = this._addressCache[pointKey]
    const { marker, infoMarker, /* polygons,  */areaMarker } = data
    // 标记地址点(非区域)
    if (marker) {
      shouldInfoPinShow ? marker.show() : marker.hide()
    }
    // 标记点的tooltip(非区域)
    if (infoMarker) {
      shouldInfoMarkerShow ? infoMarker.show() : infoMarker.hide()
    }
    if (areaMarker) {
      const shouldAreaMarkerShow = this._shouldLayerShow('addressLabel', { address: pointKey })
      shouldAreaMarkerShow ? areaMarker.show() : areaMarker.hide()
    }
  })

  this.trigger('zoomend')
}

AreaDitu.prototype._handleMovestart = function () {
  // this.trigger('beforeAction')
}

AreaDitu.prototype._handleMoveend = function () {
  this.trigger('moveend')
  // this.updateGroupLabels()
}

AreaDitu.prototype._handleMapClick = function (e) {
  this.stopEditCustomMarker()
  const { lnglat } = e
  if (this._state.pointMarking) {
    this._updateCustomMarkerTemp(lnglat)
    this.stopMarking()
  } else if (!_isAddressJustClick && this._resetLabelVisibleAddress()) {
    this._updateAllAreaMarkers()
  }
}

AreaDitu.prototype._handleMapMouseMove = function (e) {
  const { lnglat } = e
  if (this._state.pointMarking) {
    this._updateCustomMarkerTemp(lnglat)
  }
}
// 右键
AreaDitu.prototype._handleRightClick = function () {
  // not save
  this.stopMarking(true)
}

AreaDitu.prototype._showAreaTooltip = function (info, position) {
  this._areaToolMarker = this._areaToolMarker || new AMap.Marker({
    map: this._map,
    offset: new AMap.Pixel(0, -10)
  })

  this._areaToolMarker.setPosition(position)
  this._areaToolMarker.setContent(`<div class="tip-marker">${info}</div>`)
  this._areaToolMarker.show()
}

AreaDitu.prototype._hideAreaTooltip = function () {
  this._areaToolMarker && this._areaToolMarker.hide()
}

AreaDitu.prototype._shouldLayerShow = function (level, params) {
  const zoom = this.zoom()
  switch (level) {
    case 'province':
      return true
    case 'city':
      return true          // zoom > 4
    case 'district':
      return true//zoom > 7
    // 点地址的pin
    case 'infoPin':
      return true
    // 点地址的tooltip
    case 'infoMarker':
      return zoom > 5//zoom > 7
    case 'addressLabel':
      return this._getAddressMarkerVisiblity(params.address)
    default:
      return true
  }
}

AreaDitu.prototype._isDistrictVisible = function (name) {
  const data = this._areaCache[name]
  if (data && data.polygons) {
    return data.polygons[0] && data.polygons[0].getVisible()
  }
  return false
}

AreaDitu.prototype.updateChartStyle = function (style) {
  this._style = {
    ...this._style,
    ...style
  }

  this._updateAllAddressStyle()
  this._updateAllAreaMarkers()
}

AreaDitu.prototype.getDataByIndex = function (i) {
  const { unionLabel } = this._style
  const { nums, dims } = this._data
  const dimData = dims[0] && dims[0].data
  const data = { keys: [], values: [] }
  if (unionLabel) {
    // 聚合同名数据
    const label = dimData[i]
    const firstIndex = dimData.indexOf(label)
    if (i === firstIndex) {
      data.keys = Object.getOwnPropertyNames(nums)
      data.keys.forEach((key) => {
        let totalValue = 0
        dimData.forEach((item, j) => {
          if (label === item) {
            const value = nums[key].data[j]
            totalValue += Number.isNaN(value) ? 0 : (+value)
          }
        })
        data.values.push({ value: totalValue, formatter: nums[key].formatter })
      })
    }
  } else {
    data.keys = Object.getOwnPropertyNames(nums)
    data.keys.forEach((key) => {
      data.values.push({ value: nums[key].data[i], formatter: nums[key].formatter })
    })
  }

  return data
}
// 绑定自定义事件
AreaDitu.prototype.on = function (eventName, handle) {
  const handleList = this._event[eventName]
  if (handle && (handleList.indexOf(handle) === -1)) {
    handleList.push(handle)
  }
  if (eventName === 'dimClick') {
    this._updateAllAreaMarkers()
  }
}
// 解除绑定事件
AreaDitu.prototype.off = function (eventName, handle) {
  const handleList = this._event[eventName]
  const index = handleList.indexOf(handle)
  if (index > -1) {
    handleList.splice(index, 1)
  }
  if (eventName === 'dimClick') {
    this._updateAllAreaMarkers()
  }
}
// 触发一个事件
AreaDitu.prototype.trigger = function (eventName, params) {
  switch (eventName) {
    case 'parseStart':
      this._state.parsing = true
      break
    case 'parseComplete':
      this._state.parsing = false
      break
    case 'parseFailed':
      this._state.parsing = false
      break
    default:
      break
  }
  const handleList = this._event[eventName]
  return handleList.map(handle => handle(eventName, params)).every(result => !!result)
}

// key: 省, 市, 地区
AreaDitu.prototype._getAreaStyleByConfig = function (key, level) {
  // 使用用户配置
  let customStyle = null
  if (this._areaConfig && this._areaConfig.list) {
    const { list } = this._areaConfig
    for (let i = 0, l = list.length; i < l; i++) {
      const { areas, style } = list[i]
      if (areas.indexOf(key) > -1) {
        customStyle = style
        break
      }
    }
  }
  if (!customStyle) {
    return {}
  }
  return converStyleToMap(customStyle, level)
}

AreaDitu.prototype._getThemeStyle = function (address) {
  if (this._style.addressColor) {
    const index = this._getAddressIndex(address)
    return color2MapPlogonStyle(this._style.addressColor({ index }))
  }
  return {}
}

AreaDitu.prototype.updateStyles = function () {
  const areaKeys = Object.getOwnPropertyNames(this._areaCache)
  areaKeys.forEach((key) => {
    const cache = this._areaCache[key]
    const { level, polygons } = cache
    const style = this._getAreaStyleByConfig(key, level)
    polygons.forEach((polygon) => {
      polygon.setOptions({
        // ...polygon.getOptions(),
        ...style
      })
    })
  })
}

AreaDitu.prototype.isParsing = function () {
  return this._state.parsing
}

AreaDitu.prototype.setAreaConfig = function (areaConfig) {
  this._areaConfig = {
    ...this._areaConfig,
    ...areaConfig
  }
  this._updateAllAddressStyle()
  this._updateAllAreaMarkers()
  // this.updateStyles()
  // this.updateGroupLabels()
}

AreaDitu.prototype.updateGroupLabels = function () {
  this._map.remove(this._groupLabels)
  if (Object.getOwnPropertyNames(this._areaCache).length === 0) {
    return
  }
  const list = this._areaConfig && this._areaConfig.list
  if (list) {
    this._groupLabels = list.map((areaData) => {
      const { style } = areaData
      const content = $(`<div class="tip-marker">${areaData.name}</div>`)
      if (style) {
        content.css('font-size', `${style.fontSize}px`)
        content.css('color', style.color)
      }
      const position = areaData.position && (areaData.position.length > 1) ? areaData.position : this._getGroupPostion(areaData.areas)
      return new AMap.Marker({
        map: this._map,
        content: content[0],
        draggable: false,
        zIndex: 2000,
        offset: new AMap.Pixel(0, 0),
        position,
      })
    })
  }
}

AreaDitu.prototype._getCustomAreaStyle = function (address) {
  const { labelColor, labelBackground } = this._style
  const list = this._areaConfig.list || []
  const markerStyle = {
    color: labelColor,
    background: labelBackground
  }
  for (let i = 0, l = list.length; i < l; i++) {
    const { areas, style } = list[i]
    if (areas.indexOf(address) > -1) {
      markerStyle.fontSize = style.fontSize
      markerStyle.color = style.color
    }
  }
  return markerStyle
}

AreaDitu.prototype._getGroupPostion = function (areasList) {
  let position = null
  let maxArea = 0
  // 找到面积最大的
  areasList.forEach((areaName) => {
    const data = this._areaCache[areaName]
    if (_.get(data, 'polygons.length') > 0) {
      data.polygons.forEach((polygon) => {
        const area = polygon.getArea()
        if (area > maxArea) {
          maxArea = area
          position = polygon.getBounds().getCenter()
        }
      })
    }
  })
  // for (let i = 0, l = areasList.length; i < l; i++) {
  //   const name = areasList[i]
  //   const data = this._areaCache[name]
  //   if (data && data.polygons && data.polygons.length > 0) {
  //     for (let j = 0, len = data.polygons.length; j < len; j++) {
  //       const polygon = data.polygons[j]
  //       const area = polygon.getArea()
  //       if (area > maxArea) {
  //         maxArea = area
  //         position = polygon.getBounds().getCenter()
  //       }
  //     }
  //   }
  // }
  return position
}

AreaDitu.prototype.zoomIn = function () {
  this._map.zoomIn()
}

AreaDitu.prototype.zoomOut = function () {
  this._map.zoomOut()
}

AreaDitu.prototype.dispose = function () {
  this._areaCache = {}
  this._addressCache = {}
  this._map.destroy()
}

// 省 市 地区 区县 算作 地区, 否则为地点 参考http://lbs.amap.com/api/javascript-api/reference/lnglat-to-address
AreaDitu.prototype._isArea = function (level) {
  const regArr = ['国家', 'country', '省', 'province', '市', 'city', '区县', 'district']
  if (regArr.indexOf(level) > -1) {
    return true
  }
  return false
  // switch (level) {
  //   case '国家':
  //   case 'country':
  //   case '省':
  //   case 'province':
  //   case '市':
  //   case 'city':
  //   case '区县':
  //   case 'district':
  //     return true
  //   default:
  //     return false
  // }
}

AreaDitu.prototype._getAreaNameFromGeocode = function (geocode) {
  const { level } = geocode
  const { province, city, district } = geocode.addressComponent
  switch (level) {
    case '省':
    case 'province':
      return province
    case '市':
    case 'city':
      return city
    case '区县':
    case 'district':
      return district
    default:
      return province
  }
}

AreaDitu.prototype.setCustomMarkerData = function (list) {
  this._customMarkerList.list = list || []
  this._renderCustomMarkers()
}

AreaDitu.prototype._renderCustomMarkers = function () {
  this._map.remove(this._customMarkerList.markers)
  this._customMarkerList.markers = this._customMarkerList.list.map((markerData, i) => {
    const { position, type, name } = markerData
    const isFlag = type.indexOf('A') > -1   // 是否是旗子
    const marker = new AMap.Marker({
      map: this._map,
      offset: new AMap.Pixel(isFlag ? -4 : -13, -30),
      content: `<span class="custom-marker dmpicon-map-flag ${type}"></span>`,
      bubble: false,
      label: {
        content: `<span class="marker-label">${name}</span>`,
        offset: new AMap.Pixel(30, 5)
      },
      cursor: 'pointer',
      zIndex: 1600,
      position
    })
    marker.on('click', () => {
      // 发布时不让修改
      if (this._style.designTime) {
        this.startEditCustomMarker(i)
      }
    })
    return marker
  })
}
// 编辑一个marker的名称和图标样式, 弹出一个设置对话框
AreaDitu.prototype.startEditCustomMarker = function (index) {
  const { position, name, type } = this._customMarkerList.list[index]
  const isFlag = type.indexOf('A') > -1
  this._markerEditor = this._markerEditor || new AMap.InfoWindow({
    isCustom: true,
    content: '',
    offset: new AMap.Pixel(isFlag ? 10 : 0, -35)
  })

  const $content = $(`<div class="custom-marker-editor">
    <div class="title"><span>设置标记</span><button title="删除" class="del-btn"><i class="dmpicon-del"></i></button><button title="关闭" class="close-btn"><i class="dmpicon-close"></i></button></div>
    <form>
      <div class="name-section"><span class="sub-title">名称</span><input type="text" /></div>
      <div class="types-section"><span class="sub-title">形状</span><div class="types">${['A0', 'A1', 'A2', 'A3', 'B0', 'B1', 'B2', 'B3'].map(_name => `<i data-type="${_name}" class="${_name}"></i>`).join('')}</div></div>
      <div style="text-align:right"><button type="button" class="btn btn-primary">保存</button></div>
    </form>
  </div>`)
  $content.on('keydown', e => e.stopPropagation())
  $content.find('.name-section input').val(name)
  $content.find(`.${type}`).addClass('checked')

  $content.find('.del-btn').on('click', () => {
    this.removeCustomMarker(index)
    this.stopEditCustomMarker()
    this.trigger('customMarkEnd')
  })

  $content.find('.close-btn').on('click', () => {
    this.stopEditCustomMarker()
  })

  $content.find('.types i').on('click', (e) => {
    const $target = $(e.target)
    $target.addClass('checked').siblings().removeClass('checked')
  })
  // 保存
  $content.find('.btn-primary').on('click', () => {
    const _name = $content.find('.name-section input').val()
    const _type = $content.find('.types i.checked').data().type
    this._updateCustomMarker({ type: _type, name: _name }, index)
    this.stopEditCustomMarker()
    this.trigger('customMarkEnd')
  })

  this._markerEditor.setContent($content[0])
  this._markerEditor.open(this._map, position)
}
// 更新自定义的marker
AreaDitu.prototype._updateCustomMarker = function (data, index) {
  if (this._customMarkerList.list[index]) {
    this._customMarkerList.list[index] = {
      ...this._customMarkerList.list[index],
      ...data
    }
    this._renderCustomMarkers()
  }
}

AreaDitu.prototype.stopEditCustomMarker = function () {
  if (this._markerEditor) {
    this._map.remove(this._markerEditor)
    this._markerEditor = null
  }
}

AreaDitu.prototype.removeCustomMarker = function (index) {
  if (index >= 0) {
    this._customMarkerList.list.splice(index, 1)
    this._map.remove(this._customMarkerList.markers.splice(index, 1))
  }
}
// 开始添加 自定义点标记
AreaDitu.prototype.startMarking = function () {
  this._state.pointMarking = true
}
// 更新位置
AreaDitu.prototype._updateCustomMarkerTemp = function (position) {
  this._customMarkerTemp = this._customMarkerTemp || new AMap.Marker({
    map: this._map,
    offset: new AMap.Pixel(-4, -30),
    content: '<span style="color:#E53737" class="custom-marker dmpicon-map-flag"></span>',
    bubble: true,
    label: {
      content: '点击左键标记位置，右键退出',
      offset: new AMap.Pixel(20, 35)
    },
    zIndex: 1600
  })
  this._customMarkerTemp.setPosition(position)
}

AreaDitu.prototype.stopMarking = function (cancel) {
  this._state.pointMarking = false
  if (this._customMarkerTemp) {
    const position = this._locationToPostion(this._customMarkerTemp.getPosition())
    this._map.remove(this._customMarkerTemp)
    if (!cancel) {
      this._addCustomMarker(position)
      this.startEditCustomMarker(this._customMarkerList.list.length - 1)
      this._renderCustomMarkers()
    }
  }
  this.trigger('customMarkEnd', cancel)
  this._customMarkerTemp = null
}

AreaDitu.prototype._addCustomMarker = function (position) {
  const type = 'A0'
  const name = '我的标记'
  this._customMarkerList.list.push({
    position,
    type,
    name,
  })
}

AreaDitu.prototype.getAllCustomMarkersData = function () {
  return this._customMarkerList.list
}
// 比如, 鼠标点击某个地址的时候, 只显示该地址的标签
AreaDitu.prototype._pushLabelVisibleAddress = function (address) {
  if (this._visibleLabelAddresses.indexOf(address) === -1) {
    this._visibleLabelAddresses.push(address)
    return true
  }
  return false
}
// 重置, 比如点击地图非标签区域
AreaDitu.prototype._resetLabelVisibleAddress = function () {
  const oldLen = this._visibleLabelAddresses.length
  this._visibleLabelAddresses = []
  return oldLen > 0
}

AreaDitu.prototype._getAddressMarkerVisiblity = function (address) {
  if (this._visibleLabelAddresses.length > 0) {
    return this._visibleLabelAddresses.indexOf(address) > -1
  }
  // 按照用户的设置来
  const { labelShow } = this._style
  const zoom = this.zoom()
  if (labelShow === 'show') {
    return true
  } else if (labelShow === 'hide') {
    return false
  }
  return zoom > 4
}

export default AreaDitu
