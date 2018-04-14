import React from 'react'
import PropTypes from 'prop-types'

import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'
import Popover from 'react-bootstrap-myui/lib/Popover'

import ColorPicker from '../../../components/ColorPicker'
import classnames from 'classnames'

class ColorOptionColumn extends React.Component {
  static propTypes = {
    right: PropTypes.string,
    field: PropTypes.string,
    color: PropTypes.string,
    onChange: PropTypes.func
  };

  static defaultProps = {
    field: 'color',
    color: 'transparent',
    right: '4px'
  };

  constructor(props) {
    super(props)
    this.state = {
      color: props.color || 'transparent'
    }
  }

  componentWillReceiveProps(nextProps) {
    const { color } = nextProps
    if (this.props.color !== color) {
      this.setState({
        color: color || 'transparent'
      })
    }
  }

  render() {
    const { color } = this.state
    // 颜色值是否有效
    const noValidColor = this._isNoColor(color)
    // 颜色选择器按钮的className
    const btnClass = classnames('layout-config-color-btn', {
      'no-color': noValidColor
    })
    const colorText = typeof color === 'string' ? color.toUpperCase() : ''
    return (
      <div className="layout-config-column-color-option" style={this.STYLE_SHEET.configColumn}>
        <div className="form color-picker-input-container"
          style={this.STYLE_SHEET.colorPickInputContainer}
        >
          <input className="color-picker-input"
            type="text"
            style={this.STYLE_SHEET.colorPickInput}
            value={colorText}
            onChange={this.handleChangeColorInput}
            onBlur={this.handleConfirmColorInput}
          />
        </div>
        <OverlayTrigger
          rootClose
          container={document.body}
          trigger="click"
          placement="left"
          overlay={
            <Popover className="color-picker-popover-container">
              <ColorPicker
                color={color}
                changeAtOnce={false}
                onSure={this.handleConfirmColorChange}
                onHide={this.handleHideColorPickerPopover}
              />
            </Popover>
          }
        >
          <div className={btnClass} style={{
            ...this.STYLE_SHEET.colorPickerBtn,
            backgroundColor: noValidColor ? 'transparent' : color,
            right: this.props.right
          }}>
            <i className="dmpicon-triangle" style={this.STYLE_SHEET.colorPickerIcon}/>
          </div>
        </OverlayTrigger>
      </div>
    )
  }

  // 颜色选择器的输入框输入
  handleChangeColorInput = (e) => {
    const newValue = e.target.value
    this.setState(() => ({
      color: newValue
    }))
  };

  // 确定颜色变更
  handleConfirmColorInput = (e) => {
    let newValue = e.target.value
    // 不符合颜色格式的 重置为透明色
    if (!/(^rgba?\([\,0-9\.]+\)$)|(^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$)/i.test(newValue)) {
      newValue = 'transparent'
    }
    this.handleConfirmColorChange(newValue)
  };

  // 确定颜色选择
  handleConfirmColorChange = (color) => {
    const { onChange, field } = this.props
    this.setState(() => ({ color }))
    onChange(field, color)
  };

  // 隐藏颜色选择器 并还原为上一次确定后的颜色
  handleHideColorPickerPopover = (color) => {
    if (color) {
      this.setState(() => ({ color }))
    }
    // 触发关闭popover
    document.body.click();
  };

  // 判断是否有颜色值
  _isNoColor(color) {
    return !color || color === 'transparent' || color === 'none';
  }

  STYLE_SHEET = {
    configColumn: {
      lineHeight: '30px',
      fontSize: '12px',
      width: '100%',
      height: '30px',
    },
    colorPickerBtn: {
      width: '24px',
      height: '24px',
      position: 'absolute',
      right: '4px',
      top: '3px',
      borderWidth: '1px',
      padding: '1px',
      borderStyle: 'solid',
    },
    colorPickerIcon: {
      position: 'absolute',
      right: '-4px',
      bottom: '-4px',
      transform: 'rotateZ(-45deg)',
      fontSize: '12px'
    },
    colorPickInputContainer: {
      width: '100%',
      height: '100%',
      padding: '0 30px 0 0'
    },
    colorPickInput: {
      width: '100%',
      height: '100%',
      lineHeight: '30px'
    }
  }
}

export default ColorOptionColumn
