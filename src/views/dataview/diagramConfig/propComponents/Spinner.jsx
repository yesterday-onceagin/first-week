import React from 'react'
import PropTypes from 'prop-types'

import NumberInput from '@components/NumberInput'
import _ from 'lodash'

class Spinner extends React.Component {
  static propTypes = {
    data: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    max: PropTypes.number,
    min: PropTypes.number,
    step: PropTypes.number,
    unit: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.bool
    ]),
    onChange: PropTypes.func
  }

  static defaultProps = {
    max: +Infinity,
    min: 0,
    step: 1,
    unit: 'px'
  }

  constructor(props) {
    super(props)
    this.state = {
      num: props.data || 0
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        num: nextProps.data
      })
    }
  }

  render() {
    const { max, min, unit, step } = this.props
    const { num } = this.state
    const noSuffix = unit === false

    return (
      <div style={{ paddingRight: noSuffix ? 0 : '26px', height: '100%' }}>
        {noSuffix ? null : <span className="layout-config-column-suffix">{unit}</span>}
        <NumberInput
          changeOnBlur={true}
          debounce={true}
          minValue={min}
          maxValue={max}
          step={step}
          value={+num}
          onChange={this.handleChangeInput.bind(this)}
        />
      </div>
    )
  }

  // 输入事件
  handleChangeInput(num) {
    this.setState({
      num
    }, () => {
      this.props.onChange(num)
    })
  }
}

export default Spinner
