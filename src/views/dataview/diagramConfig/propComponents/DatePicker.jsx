import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import Button from 'react-bootstrap-myui/lib/Button'
import DateRangePicker from 'react-bootstrap-myui/lib/DateRangePicker'

import { dateToString } from '@helpers/dateUtils'

class DatePicker extends React.Component {
  static propTypes = {
    data: PropTypes.oneOfType([
      PropTypes.string, //  单选
      PropTypes.array // 多选
    ]),
    onChange: PropTypes.func,
    style: PropTypes.object,
    single: PropTypes.bool,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    parentEl: PropTypes.any
  }

  static defaultProps = {
    parentEl: 'body',
    single: true,
    data: ''
  }

  constructor(props) {
    super(props)
    this.state = {
      dateRange: {
        min: moment('01/01/1900', 'MM/DD/YYYY'),   // 时间格式需要是 moment
        max: moment('01/01/2100', 'MM/DD/YYYY')
      }
    }
  }

  render() {
    let startDate = moment(dateToString('MM/dd/yyyy', new Date()), 'MM/DD/YYYY')
    let endDate = moment(dateToString('MM/dd/yyyy', new Date()), 'MM/DD/YYYY')
    const { data, single, style, parentEl } = this.props
    const { dateRange } = this.state

    /* 
    * timePicker
    * timePicker24Hour
    * timePickerSeconds
    */

    if (data && typeof data === 'string') {
      startDate = moment(data, 'YYYY-MM-DD')
      endDate = moment(data, 'YYYY-MM-DD')
    } else if (Array.isArray(data) && data.length === 2) {
      startDate = moment(data[0], 'YYYY-MM-DD')
      endDate = moment(data[1], 'YYYY-MM-DD')
    }

    return (
      <div style={{ position: 'relative' }}>
        <DateRangePicker
          singleDatePicker={single}
          showDropdowns
          autoUpdateInput
          parentEl={$(parentEl)}
          minDate={dateRange.min}
          maxDate={dateRange.max}
          startDate={startDate}
          endDate={endDate}
          onApply={this.handleSelect.bind(this)}
          linkedCalendars={false}
          style={style}
        >
          {this.renderTextBtn(single, data)}
        </DateRangePicker>
        {this.renderCloseBtn(single, data)}
      </div>
    )
  }

  renderTextBtn(single, value) {
    const hasValue = value && value[0]
    return (
      <Button className="selected-date-range-btn">
        <span className="text">{Array.isArray(value) ? value.join(' 至 ') : value}</span>
        {(!hasValue) && (<i className="dmpicon-calendar" />)}
      </Button>
    )
  }

  renderCloseBtn(single, value) {
    const hasValue = value && value[0]
    return (hasValue) ? (
      <div style={this.CLEAR_STYLE} onClick={this.handleClear.bind(this)}>
        <i className="dmpicon-close" style={{ transform: 'scale(.6)', display: 'block', transformOrigin: 'center' }} />
      </div>
    ) : null
  }

  handleSelect(e, picker) {
    const { single, onChange } = this.props
    const startDate = picker.startDate.format('YYYY-MM-DD')
    if (!single) {
      const endDate = picker.endDate.format('YYYY-MM-DD')
      onChange && onChange([startDate, endDate])
    } else {
      onChange && onChange(startDate)
    }
  }

  handleClear(e) {
    e.stopPropagation();
    const { single, onChange } = this.props
    if (!single) {
      onChange && onChange([])
    } else {
      onChange && onChange('')
    }
  }

  CLEAR_STYLE = {
    position: 'absolute',
    top: '50%',
    marginTop: '-13px',
    right: 0,
    width: 26,
    height: 26,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '12px',
    cursor: 'pointer'
  }
}

export default DatePicker
