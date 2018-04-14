import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import SliderInput from '../../../../components/SliderInput'

class Slider extends React.Component {
  static propTypes = {
    data: PropTypes.any,
    onChange: PropTypes.func,
    max: PropTypes.number,
    min: PropTypes.number,
    step: PropTypes.number,
    tipFormatter: PropTypes.func
  };

  static defaultProps = {
    max: 1,
    min: 0,
    step: 0.01,
    tipFormatter: v => `${v}`
  };

  constructor(props) {
    super(props)
    this.state = {
      sliderVal: props.data || ''
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        sliderVal: nextProps.data || ''
      })
    }
  }

  render() {
    const { min, max, step, tipFormatter } = this.props
    const { sliderVal } = this.state

    return (
      <SliderInput
        className="config"
        minValue={min}
        maxValue={max}
        step={step}
        style={{ width: '100%', height: '30px', lineHeight: '30px', margin: 'auto 0' }}
        value={sliderVal}
        tipFormatter={tipFormatter}
        onChange={this.handleChangeSlider.bind(this)}
      />
    )
  }

  // 输入
  handleChangeSlider(value) {
    this.setState({
      sliderVal: value
    })
    this.props.onChange(value)
  }
}

export default Slider
