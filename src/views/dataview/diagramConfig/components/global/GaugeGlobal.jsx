import React from 'react'
import PropTypes from 'prop-types'

import ColorOptionColumn from '../../../components/ColorOptionColumn'
import SliderInput from '../../../../../components/SliderInput'

import _ from 'lodash'

class GaugeGlobal extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func,
    chartCode: PropTypes.string
  };

  constructor(props) {
    super(props)
    let _radius = 75
    let _color = '#C7E0FF'
    let _length = 70
    let _pointerColor = 'RGBA(255,255,255,0.3)'

    if (props.configInfo) {
      _radius = props.configInfo.radius
      _color = props.configInfo.color
      _length = props.configInfo.pointer ? props.configInfo.pointer.length : 70
      _pointerColor = props.configInfo.pointer ? props.configInfo.pointer.color : 'RGBA(255,255,255,0.3)'
    }
    this.state = {
      data: {
        radius: _radius,
        color: _color,
        length: _length,
        pointerColor: _pointerColor
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
  }

  render() {
    const { radius, color, length, pointerColor } = this.state.data
    const { chartCode } = this.props
    return (
      <div>
        <div className="layout-config-column form">
          <span className="layout-config-column-title">内半径</span>
          <SliderInput
            className="config"
            minValue={0}
            maxValue={100}
            tipFormatter={v => `${v}%`}
            step={1}
            style={{ width: '100%', height: '30px', lineHeight: '30px', margin: 'auto 0' }}
            value={radius}
            onChange={this.handleChangeRadius.bind(this, 'radius')}
          />
        </div>
        {chartCode === 'split_gauge' && <div><div className="layout-config-column form">
          <span className="layout-config-column-title">指针长度</span>
          <SliderInput
            className="config"
            minValue={0}
            maxValue={100}
            tipFormatter={v => `${v}%`}
            step={1}
            style={{ width: '100%', height: '30px', lineHeight: '30px', margin: 'auto 0' }}
            value={length}
            onChange={this.handleChangeRadius.bind(this, 'length')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title">指针颜色</span>
          <ColorOptionColumn
            onChange={this.handleConfirmColorChange}
            field="pointerColor"
            color={pointerColor}
          />
        </div></div>}
        <div className="layout-config-column">
          <span className="layout-config-column-title">饼图底色</span>
          <ColorOptionColumn
            onChange={this.handleConfirmColorChange}
            field="color"
            color={color}
          />
        </div>
      </div>
    )
  }

  // 变更sliderInput
  handleChangeRadius = (type, value) => {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [type]: value
      }
    }))
    this.props.onChange('global', type === 'radius' ? 'radius' : 'pointer.length', value)
  }

  // 确定颜色选择
  handleConfirmColorChange = (field, newColor) => {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [field]: newColor
      }
    }))
    this.props.onChange('global', field === 'pointerColor' ? 'pointer.color' : 'color', newColor)
  };
}

export default GaugeGlobal
