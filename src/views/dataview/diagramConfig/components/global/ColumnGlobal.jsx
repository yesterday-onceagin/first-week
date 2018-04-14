import React from 'react';
import _ from 'lodash'

import Input from 'react-bootstrap-myui/lib/Input';
import Select from 'react-bootstrap-myui/lib/Select';
import NumberInput from '../../../../../components/NumberInput';
import SliderInput from '../../../../../components/SliderInput';
import ColorOptionColumn from '../../../components/ColorOptionColumn';

import PaddingConfig from '../../common/PaddingConfig'

class ColumnGlobal extends React.Component {
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
    const padding = {
      top: data.top,
      right: data.right,
      bottom: data.bottom,
      left: data.left
    }
    return (
      <div>
        <PaddingConfig
          padding={padding}
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
              style={{ width: '100%', height: '30px', lineHeight: '30px' }}
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

        <div className="title">
          值标签
          <span onClick={this.hanldeChecked.bind(this, 'barLabel', data.barLabel)}>
            <Input
              type="checkbox"
              checked={data.barLabel}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          data.barLabel && (
            <div className="content">
              <div className="layout-config-column has-suffix">
                <span className="layout-config-column-title sub">字号</span>
                <span className="layout-config-column-suffix">px</span>
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={12}
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
              {
                this._getChartType().horizon && this._getChartType().stack && (
                  <div className="layout-config-column">
                    <span className="layout-config-column-title sub">位置</span>
                    <Select
                      value={data.barLabelType}
                      maxHeight={160}
                      width="100%"
                      openSearch={false}
                      onSelected={this.handleSelectChange.bind(this, 'barLabelType')}
                    >
                      <option value="inside">居中</option>
                      <option value="insideLeft">左侧</option>
                      <option value="insideRight">右侧</option>
                    </Select>
                  </div>
                )
              }
              {
                !this._getChartType().horizon && this._getChartType().stack && (
                  <div className="layout-config-column">
                    <span className="layout-config-column-title sub">位置</span>
                    <Select
                      value={data.barLabelType}
                      maxHeight={160}
                      width="100%"
                      openSearch={false}
                      onSelected={this.handleSelectChange.bind(this, 'barLabelType')}
                    >
                      <option value="inside">居中</option>
                      <option value="insideTop">顶部</option>
                      <option value="insideBottom">底部</option>
                    </Select>
                  </div>
                )
              }
              {
                !this._getChartType().stack && (
                  <div className="layout-config-column">
                    <span className="layout-config-column-title sub">间距</span>
                    <SliderInput
                      className="config"
                      tipFormatter= { v => `${v}px`}
                      minValue={-20}
                      maxValue={50}
                      step={1}
                      style={{ width: '100%', height: '30px', lineHeight: '30px' }}
                      value={data.barLabelDistance}
                      onChange={this.handleChange.bind(this, 'barLabelDistance')}
                    />
                  </div>
                )
              }
              {
                data.barLabelAlign !== undefined && (
                  <div className="layout-config-column">
                    <span className="layout-config-column-title sub">位置</span>
                    <Select
                      value={data.barLabelAlign}
                      maxHeight={160}
                      width="100%"
                      openSearch={false}
                      onSelected={this.handleSelectChange.bind(this, 'barLabelAlign')}
                    >
                      <option value="right">右对齐</option>
                      <option value="left">居右</option>
                      <option value="inside">居中</option>
                    </Select>
                  </div>
                )
              }
            </div>
          )
        }
      </div>
    )
  }

  hanldeChecked(field, value) {
    const { data } = this.state
    data[field] = !value
    this.props.onChange('global', field, !value)
  }

  handleChange(property, value) {
    const { data } = this.state
    data[property] = value
    this.setState({
      ...data
    }, () => {
      this.props.onChange('global', property, this.state.data[property])
    })
  }

  handleSelectChange(property, option) {
    const { data } = this.state
    data[property] = option.value
    this.setState({
      ...data
    }, () => {
      this.props.onChange('global', property, this.state.data[property])
    })
  }

  //是否是堆叠、是否水平
  _getChartType() {
    const { chartCode } = this.props
    return {
      horizon: chartCode === 'horizon_bar' || chartCode === 'horizon_stack_bar',
      stack: chartCode === 'stack_bar' || chartCode === 'horizon_stack_bar'
    }
  }
}

export default ColumnGlobal
