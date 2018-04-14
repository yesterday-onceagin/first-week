import React from 'react';
import PropTypes from 'prop-types'
import RCSlider from 'rc-slider';

import 'rc-slider/assets/index.css'; //eslint-disable-line
import './reset-slider.less';

const Slider = RCSlider.createSliderWithTooltip(RCSlider)

class SliderInput extends React.Component {
  static propTypes = {
    value: PropTypes.number.isRequired,  //value
    onChange: PropTypes.func, //onAfterChange回调
    onInput: PropTypes.func,             // onChange回调
    tipFormatter: PropTypes.func,  //格式化
    className: PropTypes.string,
    maxValue: PropTypes.number,
    minValue: PropTypes.number,
    step: PropTypes.number,
    style: PropTypes.object,
    disabled: PropTypes.bool
  }

  static defaultProps = {
    disabled: false,
    maxValue: +Infinity,
    className: 'custom',
    minValue: 0,
    step: 1
  }

  constructor(props) {
    super(props);
    this.state = {
      value: props.value
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.value !== nextProps.value) {
      this.setState({
        value: nextProps.value
      });
    }
  }

  render() {
    const { disabled, maxValue, minValue, step, tipFormatter, style, className } = this.props

    const { value } = this.state

    return (
      <div className="sliderbar" style ={style}>
        <Slider
          className={className}
          disabled={disabled}
          min={minValue}
          max={maxValue}
          step={step}
          value={value}
          tipFormatter={ tipFormatter }
          onAfterChange={this.handleAfterChange.bind(this)}
          onChange={this.handleChange.bind(this)}
        />
      </div>
    )
  }

  //onTouchEnd触发值变动回调
  handleAfterChange(value) {
    this.props.onChange && this.props.onChange(value)
  }

  //
  handleChange(value) {
    this.setState({
      value
    })
    this.props.onInput && this.props.onInput(value)
  }
}

export default SliderInput;
