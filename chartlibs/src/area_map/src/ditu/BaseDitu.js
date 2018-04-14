// 高德地图的基础功能封装
const { AMap } = window

function BaseDitu(dom, options = {}) {
  options = {
    resizeEnable: true, // 地图容器尺寸变化
    zoomEnable: true, // 缩放
    dragEnable: true, // 拖拽
    keyboardEnable: true, // 键盘移动
    doubleClickZoom: false, // 禁止点击
    zooms: [3, 15], // 地图缩放级别
    zoom: 3,
    jogEnable: false,
    center: [105, 35],
    mapStyle: 'amap://styles/6be95d38db9b467d4c873f87ecebb768',   // 暗色主题
    // mapStyle: 'amap://styles/77a1ecd8056d31affeb07eca4979e17c',      // 白色主题
    // features,
    ...options
  }

  this._map = new AMap.Map(dom, options)
}

BaseDitu.prototype.resetMap = function () {
  this._map.setZoomAndCenter(3, [105, 35])
}

BaseDitu.prototype.zoom = function (zoom) {
  if (zoom) {
    this._map.setZoom(zoom)
  } else {
    return this._map.getZoom()
  }
}

BaseDitu.prototype.center = function (center) {
  if (center) {
    this._map.setCenter(center)
  } else {
    return this._map.getCenter()
  }
}

BaseDitu.prototype.setFitView = function () {
  this._map.setFitView()
}

BaseDitu.prototype.districtSearch = function (name, options) {
  return new Promise((resolve, reject) => {
    this._initDistrictSearch().then(() => {
      options = {
        showbiz: false,
        subdistrict: 0,     //返回下一级行政区
        extensions: 'all',  //返回行政区边界坐标组等具体信息
        level: 'city',       //查询行政级别为 市
        ...options,
      }
      const district = new AMap.DistrictSearch(options)
      //行政区查询
      district.search(name, (status, result) => {
        // console.log(name, result, '8080909090')
        if (result.info === 'OK') {
          const bounds = result.districtList[0].boundaries
          const { level, center } = result.districtList[0]
          // const center = result.districtList[0].center
          resolve && resolve({ name, level, bounds, center })
        } else {
          reject && reject()
        }
      })
    }).catch(reject)
  })
}

BaseDitu.prototype._initDistrictSearch = function () {
  return new Promise((resolve) => {
    if (AMap.DistrictSearch) {
      resolve()
    } else {
      AMap.service('AMap.DistrictSearch', resolve)
    }
  })
}

BaseDitu.prototype._initGeocodePlugin = function () {
  return new Promise((resolve) => {
    if (AMap.Geocoder) {
      resolve()
    } else {
      AMap.plugin('AMap.Geocoder', resolve)
    }
  })
}

// 通过一个地址字符, 找到它的省, 市, 区等信息
BaseDitu.prototype._getAddressInfo = function (address) {
  return new Promise((resolve, reject) => {
    this._initGeocodePlugin().then(() => {
      const geocoder = new AMap.Geocoder()
      geocoder.getLocation(address, (status, result) => {
        // console.log(address, result, '---------------------')
        if (status === 'complete' && result.info === 'OK') {
          resolve({ address, geocode: result.geocodes[0] }) // {location: , addressComponent: , ...}
        } else {
          resolve({ address, geocode: null })
        }
      })
    }).catch(reject)
  })
}

BaseDitu.prototype._setMapBounds = function (bounds) {
  this._map.setBounds(bounds)
}

BaseDitu.prototype._locationToPostion = function (location) {
  return [location.lng, location.lat]
}

export default BaseDitu
