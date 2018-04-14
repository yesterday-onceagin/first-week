import React from 'react';
import _ from 'lodash'

import Input from 'react-bootstrap-myui/lib/Input';
import NumberInput from '../../../../../components/NumberInput';
import SliderInput from '../../../../../components/SliderInput';
import ColorOptionColumn from '../../../components/ColorOptionColumn';

import PaddingConfig from '../../common/PaddingConfig'
import LineStyle from '../../common/LineStyle'

class DoubleAxisGlobal extends React.Component {
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
    const { data } = this.state
    return (
      <div>
        <PaddingConfig
          padding={data}
          onChange={this.handleChange.bind(this)}
        />

        <hr/>

        <div className="title">
          柱子样式
        </div>
        <div className="content">
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">柱间间距</span>
            <SliderInput
              className="config"
              tipFormatter= { v => `${v}`}
              minValue={0}
              maxValue={1}
              step={0.01}
              value={data.barDistance}
              onChange={this.handleChange.bind(this, 'barDistance')}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">柱子背景</span>
            <ColorOptionColumn
              field="barBackground"
              color={data.barBackground}
              onChange={this.handleChange.bind(this)}
            />
          </div>
        </div>

        <hr/>
        <LineStyle
          lineStyle={data}
          onChange={this.handleChange.bind(this)}
        />
        
        <hr/>

        <div className="title">
          柱子值标签
          <span onClick={this.hanldeChecked.bind(this, 'barLabel', data.barLabel)}>
            <Input
              type="checkbox"
              checked={data.barLabel}
              onChange={() => { }}
            />
          </span>
        </div>
        { data.barLabel && this.renderBarLabel() }
        
        <hr/>

        <div className="title">
          折线值标签
          <span onClick={this.hanldeChecked.bind(this, 'lineLabel', data.lineLabel)}>
            <Input
              type="checkbox"
              checked={data.lineLabel}
              onChange={() => { }}
            />
          </span>
        </div>
        { data.lineLabel && this.renderLineLabel() }
      </div>
    )
  }

  // 渲染柱子值标签
  renderBarLabel() {
    const { data } = this.state
    return (
      <div className="content">
        <div className="layout-config-column has-suffix">
          <span className="layout-config-column-title sub">字号</span>
          <span className="layout-config-column-suffix">px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={1}
            step={1}
            name="barLabelSize"
            value={data.barLabelSize}
            onChange={this.handleChange.bind(this, 'barLabelSize')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">颜色</span>
          <ColorOptionColumn
            field="barLabelColor"
            color={data.barLabelColor}
            onChange={this.handleChange.bind(this)}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">间距</span>
          <SliderInput
            className="config"
            tipFormatter={v => `${v}px`}
            minValue={-20}
            maxValue={20}
            step={1}
            value={data.barLabelDistance}
            onChange={this.handleChange.bind(this, 'barLabelDistance')}
          />
        </div>
      </div>
    )
  }

  // 渲染折线值标签
  renderLineLabel() {
    const { data } = this.state
    return (
      <div className="content">
        <div className="layout-config-column has-suffix">
          <span className="layout-config-column-title sub">字号</span>
          <span className="layout-config-column-suffix">px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={1}
            step={1}
            name="lineLabelSize"
            value={data.lineLabelSize}
            onChange={this.handleChange.bind(this, 'lineLabelSize')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">颜色</span>
          <ColorOptionColumn
            field="lineLabelColor"
            color={data.lineLabelColor}
            onChange={this.handleChange.bind(this)}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">间距</span>
          <SliderInput
            minValue={0}
            maxValue={20}
            className="config"
            tipFormatter={v => `${v}px`}
            step={1}
            value={data.lineLabelDistance}
            onChange={this.handleChange.bind(this, 'lineLabelDistance')}
          />
        </div>
      </div>
    )
  }

  hanldeChecked(field, value) {
    const { data } = this.state
    data[field] = !value
    this.props.onChange('global', field, !value)
  }

  handleChangeSelectValue(type, option) {
    const { data } = this.state
    data[type] = option.value
    this.props.onChange('global', type, option.value)
  }

  handleChange(property, value) {
    const { data } = this.state
    data[property] = value
    this.props.onChange('global', property, this.state.data[property])
  }

  handleInput(property) {
    const { data } = this.state
    this.props.onChange('global', property, data[property])
  }

  handleChangeInput(property, e) {
    const { data } = this.state
    data[property] = e.target.value
    this.setState({
      ...data
    })
  }

  handleItemClick(property) {
    const { data } = this.state
    data[property] = !data[property]
    this.setState({
      ...data
    }, () => {
      this.props.onChange('global', property, this.state.data[property])
    })
  }
}

export default DoubleAxisGlobal
