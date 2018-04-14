import React from 'react';
import PropTypes from 'prop-types'
import _ from 'lodash'

import Input from 'react-bootstrap-myui/lib/Input';
import Select from 'react-bootstrap-myui/lib/Select';
import NumberInput from '../../../../../components/NumberInput';
import ColorOptionColumn from '../../../components/ColorOptionColumn';

class ScatterMapGlobal extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  }
  constructor(props) {
    super(props)
    //初始化默认值,防止旧数据报错
    let _labelColor = '#FFF'
    let _showLabel = false
    let _fontSize = 12
    let _type = 'circle'
    const { configInfo } = props
    if (configInfo && configInfo.scatter) {
      _showLabel = configInfo.scatter.showLabel
      _fontSize = configInfo.scatter.fontSize
      _labelColor = configInfo.scatter.labelColor
      _type = configInfo.scatter.type
    }
    this.state = {
      data: {
        scatter: {
          type: _type,
          showLabel: _showLabel,
          fontSize: _fontSize,
          labelColor: _labelColor,
        }
      }
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
    const { data } = this.state
    const { type, showLabel, labelColor, fontSize } = data.scatter
    return (
      <div>
        <div className="title">
          散点设置
        </div>
        <div className="content">
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">散点样式</span>
            <Select
              value={type}
              maxHeight={160}
              width={'100%'}
              openSearch={false}
              onSelected={this.handleChangeSelect.bind(this, 'type')}
            >
              <option value="circle">气泡</option>
              <option value="pin">水滴</option>
              <option value="rect">方形</option>
              <option value="roundRect">弧形</option>
              <option value="triangle">三角形</option>
              <option value="diamond">钻石</option>
              <option value="arrow">箭头</option>
            </Select>
          </div>

        </div>

        <hr/>

        <div className="title">
          值标签
          <span onClick={this.hanldeChecked.bind(this, 'showLabel', showLabel)}>
            <Input
              type="checkbox"
              checked={showLabel}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          showLabel && (
            <div className="content">
              <div className="layout-config-column">
                <span className="layout-config-column-title sub">字号</span>
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={1}
                  step={1}
                  name="fontSize"
                  value={fontSize}
                  onChange={this.handleChange.bind(this, 'fontSize')}
                />
              </div>
              <div className="layout-config-column">
                <span className="layout-config-column-title sub">颜色</span>
                <ColorOptionColumn
                  field="labelColor"
                  color={labelColor}
                  onChange={this.handleConfirmColorChange.bind(this)}
                />
              </div>
            </div>
          )
        }
      </div>
    )
  }

  hanldeChecked(field, value) {
    const { data } = this.state
    data.scatter[field] = !value
    this.props.onChange('global', `scatter.${field}`, !value)
  }

  handleChange(property, value) {
    const { data } = this.state
    data.scatter[property] = value
    this.setState({
      ...data
    }, () => {
      this.props.onChange('global', `scatter.${property}`, value)
    })
  }

  handleChangeSelect(property, option) {
    const { data } = this.state
    data.scatter[property] = option.value
    this.setState({
      ...data
    }, () => {
      this.props.onChange('global', `scatter.${property}`, option.value)
    })
  }

  handleConfirmColorChange(fieldName, color) {
    const { data } = this.state
    data.scatter[fieldName] = color
    this.setState({
      ...data
    })
    this.props.onChange('global', `scatter.${fieldName}`, color)
  }
}

export default ScatterMapGlobal
