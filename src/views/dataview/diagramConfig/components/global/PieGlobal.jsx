import React from 'react'
import PropTypes from 'prop-types'
import SliderInput from '../../../../../components/SliderInput'
import _ from 'lodash'

import classnames from 'classnames'
import NumberInput from '../../../../../components/NumberInput'
import Input from 'react-bootstrap-myui/lib/Input';

export default class PieGlobal extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  }

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
    const { labelLine, labelName, labelPercent, labelValue, scroll } = data
    return (<div>
      <div>
        <div className="title">轮播
          <span onClick={this.handleChange.bind(this, 'scroll.checked', !(scroll && scroll.checked))}>
            <Input
              type="checkbox"
              checked={scroll && scroll.checked}
              onChange={() => { }}
            />
          </span>
        </div>
        {scroll.checked && <div className="content">
          <div className="layout-config-column has-suffix">
            <span className="layout-config-column-title sub">轮播间隔</span>
            <span className="layout-config-column-suffix">s</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              value={scroll.interval}
              minValue={1}
              onChange={this.handleChange.bind(this, 'scroll.interval')}
            />
          </div>
        </div>}
        <div className="title">标签间距</div>
        <div className="content">
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">标签距中心</span>
            <SliderInput
              className="config"
              minValue={0}
              maxValue={100}
              step={1}
              value={labelLine.length1}
              onChange={this.handleChange.bind(this, 'labelLine.length1')}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">轴线距中心</span>
            <SliderInput
              className="config"
              minValue={0}
              maxValue={100}
              step={1}
              value={labelLine.length2}
              onChange={this.handleChange.bind(this, 'labelLine.length2')}
            />
          </div>
        </div>
      </div>
      <hr />
      {this.renderLabelConfig('维度标签', labelName, 'labelName')}
      <hr />
      {this.renderLabelConfig('数值标签', labelValue, 'labelValue')}
      <hr />
      {this.renderLabelConfig('百分比标签', labelPercent, 'labelPercent')}
      
    </div>)
  }

  renderLabelConfig(title, data, path) {
    return (<div>
      <div className="title">
        {title}
        <span onClick={this.handleChange.bind(this, `${path}.show`, !data.show)}>
          <Input
            type="checkbox"
            checked={data.show}
            onChange={() => { }}
          />
        </span>
      </div>
      {data.show && <div className="content">
        <div className="layout-config-column has-suffix">
          <span className="layout-config-column-title sub">字号</span>
          <span className="layout-config-column-suffix">px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            value={data.fontSize}
            minValue={12}
            onChange={this.handleChange.bind(this, `${path}.fontSize`)}
          />
        </div>
        {data.lineHeight &&
          <div className="layout-config-column has-suffix">
            <span className="layout-config-column-title sub">行高</span>
            <span className="layout-config-column-suffix">px</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              value={data.lineHeight}
              minValue={1}
              onChange={this.handleChange.bind(this, `${path}.lineHeight`)}
            />
          </div>
        }
      </div>}
    </div>)
  }
  handleChange(key, value) {
    const { data } = this.state
    _.set(data, key, value)
    this.props.onChange('global', key, value)
  }
}
