import React from 'react'
import PropTypes from 'prop-types'
import Input from 'react-bootstrap-myui/lib/Input'
import _ from 'lodash'

import TimeSpinner from '../../diagramConfig/propComponents/TimeSpinner'

class TimedRefresh extends React.Component {
  static propTypes = {
    config: PropTypes.object,
    onChangeRefresh: PropTypes.func
  }

  constructor(props) {
    super(props)
    const { config } = props
    this.state = {
      isOpen: (config && config.isOpen) || false,
      time: (config && config.time) || 0,
      unit: (config && config.unit) || 'second'
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.config, this.props.config)) {
      const { config } = nextProps
      this.setState({
        isOpen: (config && config.isOpen) || false,
        time: (config && config.time) || 0,
        unit: (config && config.unit) || 'second'
      })
    }
  }

  render() {
    const { isOpen, time, unit } = this.state
    return (
      <div className="item-wrap field-wrap">
        <div className="item-line">
          <div className="item-title">定时刷新</div>
          <div className="item-content">
            <Input
              label=" "
              type="checkbox"
              checked={isOpen}
              onChange={this.hanldeChecked.bind(this, isOpen)} />
          </div>
        </div>
        {isOpen ? <div className="item-line" style={{ height: '30px' }}>
          <TimeSpinner
            data={{ time, unit }}
            onChange={this.handleChangeTime}
          />
        </div> : null}
      </div>
    )
  }

  hanldeChecked(isOpen) {
    this.setState(prevState => ({
      ...prevState,
      isOpen: !isOpen
    }), () => {
      this.props.onChangeRefresh('refresh_rate', JSON.stringify(this.state))
    })
  }

  handleChangeTime = (data) => {
    this.setState(prevState => ({
      ...prevState,
      ...data
    }), () => {
      this.props.onChangeRefresh('refresh_rate', JSON.stringify(this.state))
    })
  }
}

export default TimedRefresh
