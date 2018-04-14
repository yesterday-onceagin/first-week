import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

class InputConfig extends React.Component {
  static propTypes = {
    data: PropTypes.string,
    onChange: PropTypes.func,
    type: PropTypes.oneOf(['input', 'textarea']),
    placeholder: PropTypes.string
  };

  static defaultProps = {
    type: 'input'
  }

  constructor(props) {
    super(props)
    this.state = {
      inputVal: props.data || ''
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        inputVal: nextProps.data || ''
      })
    }
  }

  render() {
    const { type, placeholder } = this.props
    const { inputVal } = this.state
    const InputComponent = type === 'input' ? 'input' : 'textarea'
    return (
      <div className="form color-picker-input-container">
        <InputComponent className="input-box"
          type="text"
          value={inputVal}
          rows="3"
          placeholder={placeholder || ''}
          onChange={this.handleChangeContent.bind(this)}
          onBlur={this.handleConfirmContent.bind(this)}
        />
      </div>
    )
  }

  // 输入文字
  handleChangeContent(e) {
    const newValue = e.target.value
    this.setState(() => ({
      inputVal: newValue
    }))
  }

  // 失去焦点(确认变更)
  handleConfirmContent(e) {
    const newValue = e.target.value
    this.setState(() => ({
      inputVal: newValue
    }))
    this.props.onChange(newValue)
  }
}

export default InputConfig
