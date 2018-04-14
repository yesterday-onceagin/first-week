/* 时间区间筛选*/
import React from 'react'
import PropTypes from 'prop-types'
import DatePicker from '../../../../components/DatePicker'
import Select from 'react-bootstrap-myui/lib/Select'
import moment from 'moment'

window._m = moment

import './indicator-date.less'

const _date2Range = function (date/*string or range*/, type) {
  const f = 'YYYY-MM-DD'
  if (typeof date === 'string') {
    if (date === '') {
      return []
    }
    const list = []
    const m = moment(date)
    switch (type) {
      case 'W':
        list[0] = m.add(-m.weekday(), 'days').format(f)
        list[1] = m.add(6 - m.weekday(), 'days').format(f)
        break
      case 'M': {
        const mm = moment({ year: m.year(), month: m.month() })
        list[0] = mm.format(f)
        list[1] = mm.add(mm.daysInMonth() - 1, 'days').format(f)
        break
      }
      // 按季度
      case 'S': {
        const ms = 3 // 三个月一个季度
        const startM = Math.floor(m.month() / 3) * 3
        list[0] = moment({ year: m.year(), month: startM }).format(f)
        list[1] = moment({ year: m.year(), month: startM + ms }).add(-1, 'days').format(f)
        break
      }
      case 'Y':
        list[0] = moment({ year: m.year() }).format(f)
        list[1] = moment({ year: m.year() + 1 }).add(-1, 'days').format(f)
        break
      default:
        list[0] = date
        list[1] = date
        break
    }
    return list
  }
  return date
}

class IndicatorDate extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    select_mode: PropTypes.string,
    events: PropTypes.shape({
      onSelectorChange: PropTypes.func
    }),
    id: PropTypes.string,
    editable: PropTypes.bool
  }
  constructor(props) {
    super(props)
    this.state = {
      date: [],
      isValid: true,
      type: 'A'
    }
  }

  render() {
    let { date, isValid, type } = this.state
    const { data, defaultValue } = this.props
    const hasDim = data && data.dim
    const alias = hasDim ? (data.dim.alias || data.dim.alias_name || data.dim.col_name) : ''

    isValid = (data && data.dim.data_type === '日期')
    if (defaultValue) {
      date = defaultValue.split(',')
    }

    const isSingle = type !== 'A'

    return (
      <div className="graph-inner-box">
        <div className="indicator-date-wrap">
          <div className="indicator-date-inner-wrap">
            {isValid && <div className="time-container">
              <div className="fl" style={{ marginRight: '10px' }}>
                <label>{`${alias}(区间)`}</label>
              </div>
              <div className="fl">
                <Select style={{ width: '82px' }} value={type} onSelected={this.handleSelectDateType.bind(this)}>
                  <option value="A">全部</option>
                  <option value="W">按周</option>
                  <option value="M">按月</option>
                  <option value="S">按季度</option>
                  <option value="Y">按年</option>
                </Select>
              </div>
              <div className="fl" style={{ minWidth: '220px' }}>
                <DatePicker value={date} onSelected={this.handledate.bind(this, 'date')} placeholder="开始时间" single={isSingle} />
              </div>
            </div>}
            {!isValid && <div className="error-tips">请选择时间类型作为维度</div>}
          </div>
        </div>
      </div>
    );
  }

  handledate(field, value) {
    const { data, id, events, editable } = this.props
    const conditions = []
    value = _date2Range(value, this.state.type)
    this.state[field] = value
    this.state[field].forEach((item, i) => {
      if (i === 0 && !!item) {
        conditions.push({
          col_name: data.dim.col_name,
          field_name: data.dim.col_name,
          field_id: data.dim.dim || data.dim.id,
          col_value: item,
          operator: '>='
        })
      } else if (item) {
        conditions.push({
          col_name: data.dim.col_name,
          field_name: data.dim.col_name,
          field_id: data.dim.dim || data.dim.id,
          col_value: item,
          operator: '<='
        })
      }
    })

    this.setState({
      ...this.state
    }, () => {
      if (events.onDateChange && !editable) {
        events.onDateChange(conditions, id, 'time_interval_filter')
      }
    })
  }

  handleSelectDateType({ value }) {
    this.setState({
      type: value
    })
  }
}

IndicatorDate.PropTypes = {
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
    onDateChange: PropTypes.func
  },
  /**
   * 用作确定筛选层级,按日、按天、按月
   * @type {[type]}
   */
  dateType: PropTypes.string
}

export default IndicatorDate;
