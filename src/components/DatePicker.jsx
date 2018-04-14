import React from 'react'
import PropTypes from 'prop-types'
import Button from 'react-bootstrap-myui/lib/Button';
import DateRangePicker from 'react-bootstrap-myui/lib/DateRangePicker';
import moment from 'moment';

class DatePicker extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    single: PropTypes.bool,
    onSelected: PropTypes.func,
    timePicker: PropTypes.bool,
    value: PropTypes.oneOfType([
      PropTypes.string, //  单选
      PropTypes.array // 多选
    ]),
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    drops: PropTypes.oneOf(['up', 'down']),
    clearable: PropTypes.bool,               // 清除按钮
  };

  static defaultProps = {
    timePicker: false,
    single: true,
    drops: 'down',
    value: '',
    clearable: true,
  };

  constructor(props) {
    super(props);

    const rangeMin = props.minDate || '01/01/1900 00:00:00'
    const rangeMax = props.maxDate || '01/01/2100 23:59:59'

    // 引入时分秒
    this.time_suffix_exp = props.timePicker ? ' HH:mm:ss' : ''
    this.dateRange = {
      min: moment(rangeMin, `MM/DD/YYYY${this.time_suffix_exp}`),   // 时间格式需要是 moment
      max: moment(rangeMax, `MM/DD/YYYY${this.time_suffix_exp}`)
    }
  }

  render() {
    const { value, single, style, timePicker, drops, clearable } = this.props

    let startDate = moment()
    let endDate = moment()

    /* 
    * timePicker
    * timePicker24Hour
    * timePickerSeconds
    */

    if (value && typeof value === 'string') {
      startDate = moment(value, `YYYY-MM-DD${this.time_suffix_exp}`)
      endDate = moment(value, `YYYY-MM-DD${this.time_suffix_exp}`)
    } else if (Array.isArray(value) && value.length === 2) {
      startDate = moment(value[0], `YYYY-MM-DD${this.time_suffix_exp}`)
      endDate = moment(value[1], `YYYY-MM-DD${this.time_suffix_exp}`)
    }

    return (
      <div style={{ position: 'relative' }}>
        <DateRangePicker
          singleDatePicker={single}
          timePicker={timePicker}
          timePicker24Hour={timePicker}
          timePickerSeconds={timePicker}
          alwaysShowCalendars={timePicker}
          showDropdowns
          drops={drops}
          autoUpdateInput
          minDate={this.dateRange.min}
          maxDate={this.dateRange.max}
          startDate={startDate}
          endDate={endDate}
          onApply={this.handleSelect.bind(this)}
          linkedcalendars={timePicker}
          style={style}
        >
          {this.renderTextBtn(single, value)}
        </DateRangePicker>
        {clearable && this.renderCloseBtn(single, value)}
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
    const { single, onSelected } = this.props
    const startDate = picker.startDate.format(`YYYY-MM-DD${this.time_suffix_exp}`)
    if (!single) {
      const endDate = picker.endDate.format(`YYYY-MM-DD${this.time_suffix_exp}`)
      onSelected && onSelected([startDate, endDate])
    } else {
      onSelected && onSelected(startDate)
    }
  }

  handleClear(e) {
    e.stopPropagation();
    const { single, onSelected } = this.props
    if (!single) {
      onSelected && onSelected([])
    } else {
      onSelected && onSelected('')
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
  };
}

export default DatePicker;
