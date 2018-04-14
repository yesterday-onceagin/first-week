import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import ColorOptionColumn from '../../components/ColorOptionColumn'
import NumberInput from '@components/NumberInput'
import Select from 'react-bootstrap-myui/lib/Select'

class Border extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    onChange: PropTypes.func,
    styleLabel: PropTypes.string,
    colorLabel: PropTypes.string,
    hideColor: PropTypes.bool
  };

  static defaultProps = {
    hideColor: false,
    styleLabel: '粗细',
    colorLabel: '颜色'
  };

  constructor(props) {
    super(props)
    const { borderColor, borderStyle, borderWidth } = props && props.data
    this.state = {
      borderColor: borderColor || 'transparent',
      borderStyle: borderStyle || 'solid',
      borderWidth: borderWidth || 0
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps && !_.isEqual(this.props.data, nextProps.data)) {
      const { borderColor, borderStyle, borderWidth } = nextProps.data
      this.setState({
        borderColor: borderColor || 'transparent',
        borderStyle: borderStyle || 'solid',
        borderWidth: borderWidth || 0
      })
    }
  }

  render() {
    const { styleLabel, colorLabel, hideColor } = this.props
    const { borderColor, borderStyle, borderWidth } = this.state

    return (
      <div>
        {!hideColor && <div className="layout-config-column">
          <span className="layout-config-column-title">{colorLabel}</span>
          <ColorOptionColumn
            onChange={this.handleConfirmColorChange.bind(this)}
            color={borderColor}
          />
        </div>}
        <div className="layout-config-column form">
          <span className="layout-config-column-title">{styleLabel}</span>
          <Select
            value={borderStyle}
            maxHeight={160}
            width={85}
            openSearch={false}
            onSelected={this.handleChangeSelect.bind(this)}
          >
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </Select>
          <div style={{ width: '85px', display: 'inline-block', marginLeft: '10px', height: '30px' }}>
            <NumberInput className="border-input"
              changeOnBlur={true}
              debounce={true}
              value={+borderWidth}
              onChange={this.handleConfirmChangeText.bind(this)}
            />
          </div>
          <span className="layout-config-column-suffix">px</span>
        </div>
      </div>
    )
  }

  // 确认输入
  handleConfirmChangeText(value) {
    this.setState({
      borderWidth: value
    }, () => {
      this.props.onChange(this.state)
    })
  }

  // 选择线形
  handleChangeSelect(option) {
    const newStyle = option.value
    this.setState({
      borderStyle: newStyle
    }, () => {
      this.props.onChange(this.state)
    })
  }

  // 确定颜色选择
  handleConfirmColorChange(fieldName, color) { //fildName后续需要删掉，为兼容ColorOptionColumn暂时保留
    this.setState({
      borderColor: color
    }, () => {
      this.props.onChange(this.state)
    })
  }

  STYLE_SELECT_TEXT = {
    solid: '实线',
    dashed: '虚线',
    dotted: '点线'
  };

  STYLE_SHEET = {
    selectText: {
      position: 'absolute',
      left: '104px',
      lineHeight: '30px',
      zIndex: 1
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
    fontStyleIcon: {
      fontSize: '12px',
      cursor: 'pointer',
      float: 'right',
      marginLeft: '6px',
      padding: '0 8px'
    },
    configColumn: {
      lineHeight: '30px',
      fontSize: '12px',
      width: '100%',
      height: '40px',
      position: 'relative',
      padding: '0 0 10px 94px',
      color: '#fff'
    },
    configColumnTitle: {
      position: 'absolute',
      left: 0,
      lineHeight: '30px'
    },
    // 颜色选择的输入框
    colorPickInputContainer: {
      width: '100%',
      height: '100%',
      padding: '0 30px 0 0'
    },
    colorPickInput: {
      width: '100%',
      height: '100%',
      lineHeight: '30px'
    },
    pxUnit: {
      position: 'absolute',
      right: '6px',
      lineHeight: '30px'
    },
  }
}

export default Border
