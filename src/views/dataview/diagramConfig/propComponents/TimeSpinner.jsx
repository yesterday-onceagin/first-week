import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import Select from 'react-bootstrap-myui/lib/Select'
import NumberInput from '../../../../components/NumberInput'

class TimeSpinner extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    onChange: PropTypes.func
  }

  static defaultProps = {
    data: {
      time: 0,
      unit: 'hour'
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      time: (props.data && props.data.time) || 0,
      unit: (props.data && props.data.unit) || 'hour'
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        time: (nextProps.data && nextProps.data.time) || 0,
        unit: (nextProps.data && nextProps.data.unit) || 'hour'
      })
    }
  }

  render() {
    const { time, unit } = this.state
    return (
      <div className="time-spiner-wrap" style={{ clear: 'both', height: '100%' }}>
        <div style={{ width: '100px', paddingLeft: '5px', float: 'right' }}>
          <Select
            value={unit}
            maxHeight={160}
            width={'100%'}
            openSearch={false}
            onSelected={this.handleChangeUnit.bind(this)}>
            <option value="hour">小时</option>
            <option value="minute">分钟</option>
            <option value="second">秒</option>
          </Select>
        </div>
        <div style={{ overflow: 'hidden', height: '100%' }}>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={0}
            maxValue={60}
            step={1}
            name="interVal"
            value={time}
            onChange={this.handleChangeTime.bind(this)}
          />
        </div>
      </div >
    )
  }

  handleChangeTime(time) {
    this.setState({
      time
    }, () => {
      this.props.onChange(this.state)
    })
  }

  handleChangeUnit(option) {
    this.setState({
      unit: option.value
    }, () => {
      this.props.onChange(this.state)
    })
  }
}

export default TimeSpinner
