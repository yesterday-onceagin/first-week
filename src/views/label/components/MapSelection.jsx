import React from 'react'
import PropTypes from 'prop-types'
import createReactClass from 'create-react-class';
import Input from 'react-bootstrap-myui/lib/Input';

import './map-selection.less';

const MapSelection = createReactClass({
  displayName: 'MapSelection',

  propTypes: {
    info: PropTypes.object,
    getComponent: PropTypes.func
  },

  getInitialState() {
    return {
      uuid: new Date().getTime(),
      zoom: 13,
      center: [],
      radius: 1000,
      city: ''
    }
  },

  componentDidMount() {
    const { getComponent, info } = this.props
    if (info) {
      this.setState({
        ...this.state,
        ...info
      }, this.initMap)
    } else {
      this.initMap();
    }
    // 通过回调。将子组件完全暴露给父组件，便于同步信息到父组件存储
    getComponent && getComponent(this)
  },

  render() {
    const { uuid, city } = this.state

    return (
      <div className="amap-wrapper" id={`amap-wrapper_${uuid}`}>
        <div className="form pull-right">
          <Input
            type="text"
            value={city}
            placeholder="请输入城市名"
            addonAfter={<i className="dmpicon-search" onClick={this.postionCity} />}
            onChange={this.handleChangeInfo}
          />
        </div>
        <div className="amap-inner-wrapper" id={`amap-inner-wrapper_${uuid}`}></div>
      </div>
    )
  },

  handleChangeInfo(e) {
    this.state.city = e.target.value
    this.setState({ ...this.state })
  },

  initMap() {
    const { uuid, zoom, center, radius } = this.state

    //地图中添加地图操作ToolBar插件
    //自动获取用户IP，返回当前城市
    if (center.length === 0) {
      AMap.plugin(['AMap.CitySearch', 'AMap.ToolBar', 'AMap.Geocoder', 'AMap.CircleEditor'], () => {
        //异步
        new AMap.CitySearch().getLocalCity((status, result) => {
          const cityAndBoundsOk = result && result.city && result.bounds;
          const statusOk = status === 'complete' && result.info === 'OK'
          if (statusOk && cityAndBoundsOk) {
            new AMap.Geocoder().getLocation(result.city, (s, r) => {
              if (s === 'complete' && r.info === 'OK') {
                // 如果当前 center 为空
                if (this.state.center.length === 0) {
                  const { lng, lat } = r.geocodes[0].location
                  this.state.center = [lng, lat]
                }
                this.map = new AMap.Map(`amap-inner-wrapper_${uuid}`, {
                  resizeEnable: true, // 地图容器尺寸变化
                  zoomEnable: true, // 缩放
                  dragEnable: true, // 拖拽
                  keyboardEnable: true, // 键盘移动
                  doubleClickZoom: false, // 禁止点击
                  mapStyle: window.MAPSTYLEK, // 皮肤
                  center: this.state.center,
                  zooms: [3, 15], // 地图缩放级别
                  zoom // 默认级别
                });
                this.drawCircle(this.map, this.state.center, radius)
              }
            })
          }
        })
      });
    } else {
      AMap.plugin(['AMap.CitySearch', 'AMap.ToolBar', 'AMap.Geocoder', 'AMap.CircleEditor'], () => {
        this.map = new AMap.Map(`amap-inner-wrapper_${uuid}`, {
          resizeEnable: true, // 地图容器尺寸变化
          zoomEnable: true, // 缩放
          dragEnable: true, // 拖拽
          keyboardEnable: true, // 键盘移动
          doubleClickZoom: false, // 禁止点击
          mapStyle: window.MAPSTYLEK, // 皮肤
          zooms: [3, 15], // 地图缩放级别
          zoom, // 默认级别
          center
        });

        this.drawCircle(this.map, center, radius)
      });
    }
  },

  // 定位后获取城市中心点 坐标
  // 绘制圆
  drawCircle(map, center, radius) {
    this.circle = new AMap.Circle({
      ...this.CIRCLE_SHEET,
      center, // 圆心位置
      radius //半径
    });

    this.circle.setMap(map);
    this.circleEditor = new AMap.CircleEditor(map, this.circle)
    this.circleEditor.open();

    this.circleEditor.on('move', (e) => {
      this.state.center = e.lnglat
    }).on('adjust', (e) => {
      this.state.radius = e.radius
    })

    // 绘制中心点
    this.marker = new AMap.Marker({
      content: "<i class='dmpicon-map-mark'></i>",
      position: center,
      offset: new AMap.Pixel(-11, -11),
      zIndex: 99999,
      draggable: true,
      map
    });

    this.marker.on('dragend', (MapsEvent) => {
      // 同步state
      this.state.center = [MapsEvent.lnglat.lng, MapsEvent.lnglat.lat]
      // 清空 map
      this.circle.setCenter(this.state.center)
    })
  },

  // 定位到城市
  postionCity() {
    const geocoder = new AMap.Geocoder();
    //地理编码,返回地理编码结果
    geocoder.getLocation(this.state.city, (status, result) => {
      if (status === 'complete' && result.info === 'OK') {
        const location = result.geocodes[0].location
        this.state.center = [location.lng, location.lat]
        this.map.setCenter(this.state.center)
        // 清除所有覆盖物
        this.map.clearMap()
        // 重新绘制 circle
        this.drawCircle(this.map, this.state.center, this.state.radius)
      }
    });
  },

  CIRCLE_SHEET: {
    strokeColor: '#00C0FF', //线颜色
    strokeOpacity: 0.52, //线透明度
    strokeWeight: 1, //线粗细度
    fillColor: '#00C0FF', //填充颜色
    fillOpacity: 0.52 //填充透明度
  },
})

export default MapSelection
