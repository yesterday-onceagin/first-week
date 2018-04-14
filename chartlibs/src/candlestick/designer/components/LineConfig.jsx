import React from 'react'
import PropTypes from 'prop-types'

import { PropComponents } from 'dmp-chart-sdk'
import Select from 'react-bootstrap-myui/lib/Select'

import _ from 'lodash'

class LineConfig extends React.Component {
  static propTypes = {
    chart: PropTypes.object,
    data: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      option: _.cloneDeep(props.data) || []
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        option: _.cloneDeep(nextProps.data) || []
      })
    }
  }

  render() {
    const { option } = this.state
    const num5 = _.get(this.props, 'chart.nums.4')
    // 仅当有第5个数值字段时才展示
    if (!num5) {
      return null
    }
    const num5Name = num5.alias || num5.alias_name || num5.col_name
    return (
      <div className="diagram-design-config-content">
        <div className="title">
          {`折线配置（${num5Name}）`}
        </div>
        <div className="layout-config-column form">
          <span className="layout-config-column-title sub">曲线粗细</span>
          <Select
            value={option.lineStyle}
            maxHeight={160}
            width={85}
            openSearch={false}
            onSelected={({ value }) => { this.handleChangeConfig('lineStyle', value) }}
          >
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
          </Select>
          <div style={{ width: '110px', display: 'inline-block', marginLeft: '10px', height: '30px' }}>
            <PropComponents.Spinner
              min={1}
              data={option.lineWidth}
              onChange={(data) => { this.handleChangeConfig('lineWidth', data) }}
            />
          </div>
        </div>

        <div className="layout-config-column">
          <span className="layout-config-column-title sub">圆点半径</span>
          <PropComponents.Spinner
            min={1}
            data={option.circleWidth}
            onChange={(data) => { this.handleChangeConfig('circleWidth', data) }}
          />
        </div>

        <div className="layout-config-column">
          <span className="layout-config-column-title sub">近似曲线</span>
          <PropComponents.Checkbox
            data={option.lineSmooth}
            onChange={(data) => { this.handleChangeConfig('lineSmooth', data) }}
          />
        </div>

        <div className="layout-config-column">
          <span className="layout-config-column-title sub">折线颜色</span>
          <PropComponents.ColorPicker
            data={option.color}
            onChange={(data) => { this.handleChangeConfig('color', data) }}
          />
        </div>
      </div>
    )
  }

  // 修改配置
  handleChangeConfig(field, data) {
    this.setState((preState) => {
      const option = _.cloneDeep(preState.option)
      option[field] = data
      return { option }
    }, () => {
      this.props.onChange(this.state.option)
    })
  }
}

export default LineConfig
