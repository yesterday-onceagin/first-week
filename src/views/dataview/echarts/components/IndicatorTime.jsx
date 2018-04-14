import React from 'react'
import PropTypes from 'prop-types'
import DatePicker from '@components/DatePicker';

import './indicator-time.less';
/* 时间区间筛选*/
class IndicatorTime extends React.Component {
  static propTypes = {
    /**
     * 待注入的数据
     * @type {[type]}
     */
    data: PropTypes.object,
    /**
     * 用作筛选报告
     * @type {[type]}
     */
    events: {
      onTimeChange: PropTypes.func
    },
    /**
     * 用作确定筛选层级,按日、按天、按月
     * @type {[type]}
     */
    dateType: PropTypes.string
  };
  
  constructor(props) {
    super(props)
    this.state = {
      begin_date: '',
      isValid: true  //是否是时间类型
    }
  }

  render() {
    let { begin_date, isValid } = this.state

    const { data, defaultValue } = this.props
    const alias = data ? (data.dim.alias || data.dim.alias_name || data.dim.col_name) : ''
    isValid = (data && data.dim && data.dim.data_type === '日期')
    if (defaultValue && new Date(defaultValue).toString() !== 'Invalid Date') {
      begin_date = defaultValue
    }

    return (
      <div className="graph-inner-box">
        <div className="indicator-time-wrap">
          <div className="indicator-time-inner-wrap">
            {isValid && <div className="time-container">
              <div className="fl" style={{ marginRight: '10px' }}>
                <label>{alias}</label>
              </div>
              <div className="fl" style={{ minWidth: '220px' }}>
                <DatePicker value={begin_date} onSelected={this.handledate.bind(this, 'begin_date')} placeholder="选择时间" />
              </div>
            </div>}
            {!isValid && <div className="error-tips">请选择时间类型作为维度</div>}
          </div>
        </div>
      </div>
    );
  }

  handledate(field, value) {
    const { data, events, id } = this.props
    const conditions = []

    this.state[field] = value
    if (this.state[field]) {
      conditions.push({
        col_name: data.dim.col_name,
        col_value: value,
        operator: '=',
        dim: data.dim
      })
    }

    this.setState({
      ...this.state
    }, () => {
      if (events.onTimeChange) {
        events.onTimeChange(conditions, id, 'time_filter')
      }
    })
  }
}

export default IndicatorTime;
