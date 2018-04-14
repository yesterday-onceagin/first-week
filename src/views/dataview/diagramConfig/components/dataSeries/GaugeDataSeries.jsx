import React from 'react'
import PropTypes from 'prop-types'

import Input from 'react-bootstrap-myui/lib/Input'

import _ from 'lodash'

class GaugeDataSeries extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    chart: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      data: {
        percentage: props.configInfo && props.configInfo.percentage,
        desired_value: props.configInfo ? (props.configInfo.desired_value || '') : '',
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
    const { percentage, desired_value } = this.state.data
    return (
      <div>
        <div className="title">
          目标值
        </div>
        <div className="content">
          <div className="layout-config-column form" style={{ padding: '0 0 10px 0' }}>
            <Input className="color-picker-input"
              type="text"
              style={this.STYLE_SHEET.borderInput}
              value={desired_value}
              onChange={this.handleChange}
              onBlur={this.handleConfirm}
            />
          </div>
        </div>
        {
          (percentage !== undefined) && <div className="title">
            显示百分比
            <span onClick={this.hanldeChecked.bind(this, percentage)}>
              <Input
                type="checkbox"
                checked={percentage}
              />
            </span>
          </div>
        }
      </div>
    )
  }

  hanldeChecked = (checked) => {
    this.setState(preState => ({
      data: {
        ...preState.data,
        percentage: !checked
      }
    }), () => {
      this.props.onChange('dataSeries', 'percentage', !checked)
    })
  };

  handleChange = (e) => {
    const value = e.target.value || ''
    this.setState(preState => ({
      data: {
        ...preState.data,
        desired_value: value
      }
    }))
  };

  handleConfirm = (e) => {
    const value = e.target.value || ''
    this.setState(preState => ({
      data: {
        ...preState.data,
        desired_value: value
      }
    }), () => {
      this.props.onChange('dataSeries', 'desired_value', value)
    })
  };

  STYLE_SHEET = {
    borderInput: {
      width: '100%',
      height: '30px',
      lineHeight: '30px',
      padding: '0 5px',
      float: 'left'
    }
  }
}

export default GaugeDataSeries
