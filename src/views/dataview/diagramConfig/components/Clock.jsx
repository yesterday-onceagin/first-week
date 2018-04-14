import React from 'react'
import _ from 'lodash'
import classnames from 'classnames'

import Input from 'react-bootstrap-myui/lib/Input'
import NumberInput from '../../../../components/NumberInput'
import ColorOptionColumn from '../../components/ColorOptionColumn'

import { FONT_STYLES } from '../../constants/fontOptions'

const _getStyleText = function (oldText, style) {
  const styleArray = oldText.split(',')
  const styleIndex = styleArray.indexOf(style)
  if (styleIndex > -1) {
    styleArray.splice(styleIndex, 1)
  } else {
    styleArray.push(style)
  }
  return styleArray.join(',')
}

class Clock extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      data: _.cloneDeep(props.configInfo)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.configInfo && !_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
  }

  render() {
    const { fontSize, color, fontStyle, format } = this.state.data
    const fontStyleArrs = fontStyle ? fontStyle.split(',') : []

    return (<div className="content">
      <div className="layout-config-column has-suffix">
        <span className="layout-config-column-title">字号</span>
        <span className="layout-config-column-suffix">px</span>
        <NumberInput
          changeOnBlur={true}
          debounce={true}
          minValue={12}
          step={1}
          name="name"
          value={+fontSize}
          onChange={this.handleChangeValue.bind(this, 'fontSize')}
        />
      </div>
      <div className="layout-config-column">
        <span className="layout-config-column-title">颜色</span>
        <ColorOptionColumn
          onChange={this.handleChangeValue.bind(this)}
          field="color"
          color={color}
        />
      </div>
      <div className="layout-config-column">
        <span className="layout-config-column-title">样式</span>
        {
          FONT_STYLES.map((item) => {
            const _clsName = classnames('diagram-title-font-style-icon', {
              [item.key]: true,
              active: fontStyleArrs.indexOf(item.key) > -1
            })
            return (
              <i key={`diagram-title-font-style-${item.key}`}
                title={item.name}
                className={_clsName}
                onClick={this.handleChangeStyle.bind(this, item.key)}
              >
                {item.icon}
              </i>
            )
          })
        }
      </div>
      <div className="layout-config-column">
        <span className="layout-config-column-title">格式化</span>
        <form>
          <Input type="text"
            style={{ height: '30px', padding: '0 10px', fontSize: '12px' }}
            placeholder="YYYY年MM月DD日 HH:mm:ss"
            onChange={this.handleChangeText.bind(this, 'format', false)}
            onBlur={this.handleChangeText.bind(this, 'format', true)}
            value={format}
          />
        </form>
      </div>
    </div>)
  }

  handleChangeValue(path, value) {
    _.set(this.state.data, path, value)
    this.setState({}, () => {
      this.props.onChange('clock', path, value)
    })
  }

  handleChangeStyle(style) {
    const styleValue = _getStyleText(this.state.data.fontStyle, style)
    _.set(this.state.data, 'fontStyle', styleValue)
    this.setState({})
    this.handleChangeValue('fontStyle', styleValue)
  }

  handleChangeText(path, save, e) {
    const newValue = e.target.value
    if (save) {
      this.handleChangeValue(path, newValue)
    } else {
      _.set(this.state.data, path, newValue)
      this.setState({})
    }
  }
}

export default Clock
