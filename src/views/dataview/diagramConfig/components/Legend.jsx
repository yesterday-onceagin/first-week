import React from 'react';
import PropTypes from 'prop-types'

import Select from 'react-bootstrap-myui/lib/Select'
import ColorOptionColumn from '../../components/ColorOptionColumn'
import NumberInput from '../../../../components/NumberInput'

import _ from 'lodash'

class Legend extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      field: props.field || 'legend',
      data: props.configInfo ? _.cloneDeep(props.configInfo) : {}
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
    const { fontSize, color, position, gap } = this.state.data

    return (
      <div className="content">
        <div className="layout-config-column has-suffix">
          <span className="layout-config-column-title">字号</span>
          <span className="layout-config-column-suffix">px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={1}
            step={1}
            name="layout-config-size-width"
            value={fontSize}
            onChange={this.handleChangeInput.bind(this, 'fontSize')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title">颜色</span>
          <ColorOptionColumn
            onChange={this.handleConfirmColorChange.bind(this)}
            field="color"
            color={color}
          />
        </div>
        <div className="layout-config-column form">
          <span className="layout-config-column-title">位置</span>
          <Select
            value={position}
            maxHeight={120}
            width="100%"
            openSearch={false}
            onSelected={this.handleChangeSelect.bind(this)}
          >
            {
              this.LEGEND_POSITIONS.map(item => (
                <option value={item.key} key={`legend-position-option-${item.key}`}>
                  {item.name}
                </option>
              ))
            }
          </Select>
        </div>
        <div className="layout-config-column has-suffix">
          <span className="layout-config-column-title">间距</span>
          <span className="layout-config-column-suffix">px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={0}
            step={1}
            name="layout-config-size-width"
            value={gap}
            onChange={this.handleChangeInput.bind(this, 'gap')}
          />
        </div>
      </div>
    )
  }

  // 输入事件
  handleChangeInput(fieldName, value) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [fieldName]: value
      }
    }), () => {
      this.props.onChange(this.state.field, fieldName, value)
    })
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

  // 图例位置选择
  handleChangeSelect(opts) {
    const newValue = opts.value
    this.setState(preState => ({
      data: {
        ...preState.data,
        position: newValue
      }
    }), () => {
      this.props.onChange('legend', 'position', newValue)
    })
  }

  // 图例位置定义
  LEGEND_POSITIONS = [{
    name: '顶部居中',
    key: 'top-center'
  }, {
    name: '顶部居左',
    key: 'top-left'
  }, {
    name: '顶部居右',
    key: 'top-right'
  }, {
    name: '底部居中',
    key: 'bottom-center'
  }, {
    name: '底部居左',
    key: 'bottom-left'
  }, {
    name: '底部居右',
    key: 'bottom-right'
  }];
}

export default Legend
