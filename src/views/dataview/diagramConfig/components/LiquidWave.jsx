import React from 'react';
import PropTypes from 'prop-types'
import _ from 'lodash'

import SliderInput from '../../../../components/SliderInput';
import Select from 'react-bootstrap-myui/lib/Select';
/* 波浪样式设置*/
class LiquidWave extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    configInfo: PropTypes.object
  };

  constructor(props) {
    super(props)
    this.state = {
      config: props.configInfo ? _.cloneDeep(props.configInfo) : {}
    }
  }

  componentWillReceiveProps(nextProps) {
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
          <span className="layout-config-column-title">波浪宽度</span>
          <SliderInput
            className="config"
            minValue={1}
            maxValue={100}
            tipFormatter={v => `${v}%`}
            step={1}
            value={config.count}
            onChange={this.handleChange.bind(this, 'count')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title">振幅</span>
          <SliderInput
            className="config"
            minValue={1}
            maxValue={100}
            step={1}
            value={config.wave}
            onChange={this.handleChange.bind(this, 'wave')}
          />
        </div>
        {/* <div className="layout-config-column">
          <span className="layout-config-column-title">相位</span>
          <SliderInput
            className="config"
            minValue={0}
            maxValue={360}
            step={1}
            value={config.gap}
            onChange={this.handleChange.bind(this, 'gap')}
          />
        </div> */}
        <div className="layout-config-column">
          <span className="layout-config-column-title">周期(秒)</span>
          <SliderInput
            className="config"
            minValue={0}
            maxValue={10}
            step={1}
            value={config.timeline}
            onChange={this.handleChange.bind(this, 'timeline')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title">透明度</span>
          <SliderInput
            className="config"
            minValue={0}
            maxValue={1}
            step={0.1}
            value={config.opacity}
            onChange={this.handleChange.bind(this, 'opacity')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title">方向</span>
          <Select
            value={config.direct}
            maxHeight={160}
            width="100%"
            openSearch={false}
            onSelected={this.handleSelectChange.bind(this, 'direct')}
          >
            <option value="right">从左向右</option>
            <option value="left">从右向左</option>
          </Select>
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
      this.props.onChange('liquidWave', property, this.state.config[property])
    })
  }
  handleSelectChange(property, option) {
    const { config } = this.state
    config[property] = option.value
    this.setState({
      ...config
    }, () => {
      this.props.onChange('liquidWave', property, this.state.config[property])
    })
  }
}

export default LiquidWave
