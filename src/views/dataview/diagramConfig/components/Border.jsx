import React from 'react';
import PropTypes from 'prop-types'
import _ from 'lodash';

import ColorOptionColumn from '../../components/ColorOptionColumn'
import Select from 'react-bootstrap-myui/lib/Select';

class Border extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      field: props.field || 'border',
      data: {
        color: props.configInfo && props.configInfo.color,
        style: props.configInfo && props.configInfo.style,
        width: (props.configInfo && props.configInfo.width) || (props.configInfo.style ? 1 : '')
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
    const {
      color,
      style,
      width
    } = this.state.data

    return (
      <div className="content">
        <div className="layout-config-column">
          <span className="layout-config-column-title">边框颜色</span>
          <ColorOptionColumn
            onChange={this.handleConfirmColorChange.bind(this)}
            field="color"
            color={color}
          />
        </div>
        <div className="layout-config-column form">
          <span className="layout-config-column-title">边框粗细</span>
          <Select
            value={style}
            maxHeight={160}
            width={85}
            openSearch={false}
            onSelected={this.handleChangeSelect.bind(this)}
          >
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </Select>
          <input className="border-input"
            type="text"
            value={width}
            onChange={this.handleChangeText.bind(this)}
            onBlur={this.handleConfirmChangeText.bind(this)}
          />
          <span className="layout-config-column-suffix">px</span>
        </div>
      </div>
    )
  }

  // 输入事件
  handleChangeText(e) {
    const width = e.target.value
    this.setState(preState => ({
      data: {
        ...preState.data,
        width
      }
    }))
  }

  // 确认输入
  handleConfirmChangeText(e) {
    const width = e.target.value
    this.setState(preState => ({
      data: {
        ...preState.data,
        width
      }
    }))
    this.props.onChange(this.state.field, 'width', width)
  }

  // 选择线形
  handleChangeSelect(option) {
    const newStyle = option.value
    this.setState(preState => ({
      data: {
        ...preState.data,
        style: newStyle
      }
    }))
    this.props.onChange(this.state.field, 'style', newStyle)
  }

  // 确定颜色选择
  handleConfirmColorChange(fieldName, color) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [fieldName]: color
      }
    }))
    this.props.onChange(this.state.field, fieldName, color)
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
