import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

window._m = moment
import { Connect, PropComponents } from '@views/dataview/components/DmpChartDev'

import './time.less'

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
      } break
      // 按季度
      case 'S': {
        const ms = 3 // 三个月一个季度
        const startM = Math.floor(m.month() / 3) * 3
        const lastDate = moment({ year: m.year(), month: startM + ms - 1 })
        list[0] = moment({ year: m.year(), month: startM }).format(f)
        list[1] = lastDate.add(lastDate.daysInMonth() - 1, 'days').format(f)
      } break
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

class TimeIntervalFilter extends React.Component {
  static propTypes = {
    designTime: PropTypes.bool,
    data: PropTypes.object,
    config: PropTypes.object,
    events: PropTypes.object,
    chartId: PropTypes.string
  }

  constructor(props) {
    super(props)
    const { defaultValue } = props.data || {}
    this.state = {
      type: 'A',
      date: (defaultValue && defaultValue.split(',')) || []
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.data && nextProps.data && this.props.data.defaultValue !== nextProps.data.defaultValue) {
      const { defaultValue } = nextProps.data || {}
      this.setState({
        date: (defaultValue && defaultValue.split(',')) || []
      })
    }
  }

  render() {
    const { data } = this.props
    const { date, type } = this.state

    const { dims } = data.indicators || {}
    const dim = dims && dims[0]
    const hasDim = !!dim
    const alias = hasDim ? (dim.alias || dim.alias_name || dim.col_name) : ''

    const isSingle = type !== 'A'
    const isValid = dim.data_type === '日期'
    return (
      <div className="graph-inner-box">
        <div className="indicator-date-wrap">
          <div className="indicator-date-inner-wrap">
            {isValid && <div className="time-container">
              <div className="fl indicator-title" style={this.STYLE_SHEET.indicatorTitle}>
                {`${alias}(区间)`}
              </div>
              <div className="fl" style={{ width: '90px' }}>
                <PropComponents.Select
                  style={{ width: '90px' }}
                  data={type}
                  options={[
                    { value: 'A', text: '全部' },
                    { value: 'W', text: '按周' },
                    { value: 'M', text: '按月' },
                    { value: 'S', text: '按季度' },
                    { value: 'Y', text: '按年' },
                  ]}
                  onChange={this.handleSelectDateType.bind(this)}
                />
              </div>
              <div className="fl" style={{ minWidth: '200px', flex: 2 }}>
                <PropComponents.DatePicker
                  placeholder="开始时间"
                  single={isSingle}
                  parentEl="#dashboard-for-view-container"
                  data={date}
                  onChange={this.handledate.bind(this)}
                />
              </div>
            </div>}
            {!isValid && <div className="error-tips">请选择时间类型作为维度</div>}
          </div>
        </div>
      </div>
    )
  }

  handledate(value) {
    const { designTime, data, events, chartId } = this.props
    const { dims } = data.indicators || {}
    const dim = dims && dims[0]
    const newDate = _date2Range(value, this.state.type)
    const conditions = []
    newDate.forEach((item, i) => {
      if (i === 0 && !!item) {
        conditions.push({
          field_name: dim.col_name,
          field_id: dim.dim || dim.id,
          col_value: item,
          operator: '>=',
          formula_mode: dim.formula_mode
        })
      } else if (item) {
        conditions.push({
          field_name: dim.col_name,
          field_id: dim.dim || dim.id,
          col_value: item,
          operator: '<=',
          formula_mode: dim.formula_mode
        })
      }
    })
    this.setState({
      date: newDate
    }, () => {
      if (designTime) {
        events && events.onChangeDatasetDefaultValue && events.onChangeDatasetDefaultValue(this.state.date.join(','))
      } else {
        events && events.onFilterChange && events.onFilterChange(conditions, chartId)
      }
    })
  }

  handleSelectDateType(value) {
    this.setState({
      type: value
    })
  }

  STYLE_SHEET = {
    indicatorTitle: {
      marginRight: '5px',
      fontWeight: 'bold',
      flex: 1,
      whiteSpace: 'nowrap'
    }
  };
}

export default Connect()(TimeIntervalFilter)
