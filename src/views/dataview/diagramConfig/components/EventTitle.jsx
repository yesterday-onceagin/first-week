import React from 'react';
import PropTypes from 'prop-types'
import _ from 'lodash'

import NumberInput from '../../../../components/NumberInput'
import SliderInput from '../../../../components/SliderInput';
import ColorOptionColumn from '../../components/ColorOptionColumn'

/* 全局样式设置*/
class EventTitle extends React.Component {
  static propTypes = {
    chart: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    configInfo: PropTypes.object
  };

  constructor(props) {
    super(props)
    this.state = {
      chartCode: props.chart.chart_code,
      config: props.configInfo ? _.cloneDeep(props.configInfo) : {}
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.chart.chart_code !== this.props.chart.chart_code) {
      this.setState({
        chartCode: nextProps.chart.chart_code,
        config: _.cloneDeep(nextProps.configInfo)
      })
    }
    if (!_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        config: _.cloneDeep(nextProps.configInfo)
      })
    }
  }

  render() {
    const { config } = this.state
    return (
      <div>
        <div className="layout-config-column">
          <span className="layout-config-column-title">标签间距</span>
          <SliderInput
            className="config"
            tipFormatter= { v => `${v}px`}
            minValue={0}
            maxValue={50}
            step={1}
            value={config.distance}
            onChange={this.handleChange.bind(this, 'distance')}
          />
        </div>

        <hr/>

        <div className="title">
          默认样式
        </div>
        <div className="content">
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">字号</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={10}
              maxValue={20}
              step={1}
              name="default_size"
              value={config.size}
              onChange={this.handleChange.bind(this, 'size')}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">颜色</span>
            <ColorOptionColumn
              onChange={this.handleConfirmColorChange.bind(this)}
              field="color"
              color={config.color}
            />
          </div>
        </div>

        <hr/>

        <div className="title">
        选中样式
        </div>
        <div className="content">
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">字号</span>
            <NumberInput
              changeOnBlur={true}
              debounce={true}
              minValue={10}
              maxValue={20}
              step={1}
              name="default_size"
              value={config.selected_size}
              onChange={this.handleChange.bind(this, 'selected_size')}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">颜色</span>
            <ColorOptionColumn
              onChange={this.handleConfirmColorChange.bind(this)}
              field="selected_color"
              color={config.selected_color}
            />
          </div>
        </div>
      </div>
    )
  }

  handleChange(property, value) {
    const { config } = this.state
    config[property] = value
    this.setState({
      ...config
    }, () => {
      this.props.onChange('eventTitle', property, this.state.config[property])
    })
  }

  handleItemClick(property) {
    const { config } = this.state
    config[property] = !config[property]
    this.setState({
      ...config
    }, () => {
      this.props.onChange('eventTitle', property, this.state.config[property])
    })
  }

  // 确定颜色选择
  handleConfirmColorChange(field, color) {
    _.set(this.state.config, field, color)
    this.setState({
      ...this.state
    }, () => {
      this.props.onChange('eventTitle', field, this.state.config[field])
    })
  }
}

export default EventTitle
