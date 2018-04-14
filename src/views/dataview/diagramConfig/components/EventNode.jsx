import React from 'react';
import PropTypes from 'prop-types'
import _ from 'lodash'

import NumberInput from '../../../../components/NumberInput'
import ColorOptionColumn from '../../components/ColorOptionColumn'

/* 全局样式设置*/
class EventNode extends React.Component {
  static propTypes = {
    chart: PropTypes.object.isRequired,
    onChange: PropTypes.func
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
        <div className="layout-config-column has-suffix">
          <span className="layout-config-column-title">节点大小</span>
          <span className="layout-config-column-suffix">px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={5}
            maxValue={14}
            step={1}
            name="interVal"
            value={config.node_size}
            onChange={this.handleChange.bind(this, 'node_size')}
          />
        </div>

        <hr/>

        <div className="title">
          默认样式
        </div>
        <div className="content">
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">节点填充色</span>
            <ColorOptionColumn
              onChange={this.handleConfirmColorChange.bind(this)}
              field="node_color"
              color={config.node_color}
            />
          </div>
        </div>

        <hr/>

        <div className="title">
          选中样式
        </div>
        <div className="content">
          <div className="layout-config-column">
            <span className="layout-config-column-title sub">节点填充色</span>
            <ColorOptionColumn
              onChange={this.handleConfirmColorChange.bind(this)}
              field="selected_node_color"
              color={config.selected_node_color}
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
      this.props.onChange('eventNode', property, this.state.config[property])
    })
  }

  handleItemClick(property) {
    const { config } = this.state
    config[property] = !config[property]
    this.setState({
      ...config
    }, () => {
      this.props.onChange('eventNode', property, this.state.config[property])
    })
  }

  // 确定颜色选择
  handleConfirmColorChange(field, color) {
    _.set(this.state.config, field, color)
    this.setState({
      ...this.state
    }, () => {
      this.props.onChange('eventNode', field, this.state.config[field])
    })
  }
}

export default EventNode
