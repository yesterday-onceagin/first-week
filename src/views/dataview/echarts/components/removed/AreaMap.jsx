import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import AreaDitu from './Amap/AreaDitu'

export default class AreaMap extends React.Component {
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
    scaleRate: PropTypes.number,
    events: PropTypes.object,
    through: PropTypes.bool
  }

  constructor(props) {
    super(props)
    this.state = {
      mapState: {
        parsing: false,       // 正在解析地址
        parseError: false,   // 解析错误
        areaList: [],
      }
    }

    this.getChart = () => null
  }

  componentDidMount() {
    this.initMap()
    this.runMapWithData()
  }

  componentDidUpdate(preProps) {
    const { data, layoutOptions } = this.props
    if (!_.isEqual(data, preProps.data)) {
      this.runMapWithData()
    }
    if (!_.isEqual(layoutOptions.areaConfig.list, preProps.layoutOptions.areaConfig.list)) {
      this._chart.setAreaConfig(layoutOptions.areaConfig)
    }
  }

  componentWillUnmount() {
    this.disposeMap()
  }

  render() {
    // const { layoutOptions } = this.props
    // const style = {
    //   marginTop: layoutOptions.global.top + 'px',
    //   marginRight: layoutOptions.global.right + 'px',
    //   marginBottom: layoutOptions.global.bottom + 'px',
    //   marginLeft: layoutOptions.global.left + 'px',
    // }
    return <div className="graph-inner-box map" ref={(node) => { this.graphNode = node }}></div>
  }

  initMap() {
    const { layoutOptions } = this.props
    const pos = layoutOptions.mapOption.pos
    this._chart = new AreaDitu(this.graphNode, { ...pos })
    this._chart.setAreaConfig(layoutOptions.areaConfig)
    // 区域设置依赖地图的状态和数据 所以需要暴露出去
    window.__areaDitu__ = this._chart
    this._handleParseAddressStart = this.handleParseAddressStart.bind(this)
    this._handleParseAddressComplete = this.handleParseAddressComplete.bind(this)
    this._handleParseAddressFailed = this.handleParseAddressFailed.bind(this)
    this._debounceHandleZoomend = _.debounce(this.updateMapOption.bind(this), 3000)
    this._beforeAction = this.handleBeforeAction.bind(this)

    this._chart.on('parseStart', this._handleParseAddressStart.bind(this))
    this._chart.on('parseComplete', this._handleParseAddressComplete.bind(this))
    this._chart.on('parseFailed', this._handleParseAddressFailed.bind(this))
    this._chart.on('zoomend', this._debounceHandleZoomend)
    this._chart.on('moveend', this._debounceHandleZoomend)
    this._chart.on('beforeAction', this._beforeAction)
  }

  disposeMap() {
    this._chart.off('parseStart', this._handleParseAddressStart)
    this._chart.off('parseComplete', this._handleParseAddressComplete)
    this._chart.off('parseFailed', this._handleParseAddressFailed)
    this._chart.off('zoomend', this._debounceHandleZoomend)
    this._chart.off('moveend', this._debounceHandleZoomend)
    this._chart.off('beforeAction', this._beforeAction)
    this._chart.dispose()
  }

  runMapWithData() {
    const { data } = this.props
    if (data) {
      this._chart.setData(data)
    }
  }

  handleParseAddressStart() {
    this.setState({
      mapState: {
        ...this.state.mapState,
        parsing: true
      }
    })
  }

  handleParseAddressComplete() {
    const areaList = this._chart.getAllAreaFromPoints()
    this.setState({
      mapState: {
        ...this.state.mapState,
        parsing: false,
        areaList
      }
    })
  }

  handleParseAddressFailed() {
    this.setState({
      mapState: {
        ...this.state.mapState,
        parsing: false,
        parseError: true
      }
    })
  }

  updateMapOption(eventName) {
    const latlng = this._chart.center()
    const center = [latlng.lng, latlng.lat]
    const zoom = this._chart.zoom()
    if (window.__saveMapOption__) {
      window.__saveMapOption__(center, zoom)
    }
  }

  handleBeforeAction() {
    this.graphNode.click()
  }
}
