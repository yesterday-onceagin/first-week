import React from 'react'
import PropTypes from 'prop-types'

import NumberValue from './NumberValue'

import _ from 'lodash'

class NumberPrefix extends NumberValue {
  static propTypes = {
    field: PropTypes.string,
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      field: props.field || 'numberPrefix',
      data: props.configInfo ? _.cloneDeep(props.configInfo) : {}
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
    if (nextProps.field && this.props.field !== nextProps.field) {
      this.setState({
        field: nextProps.field
      })
    }
  }

  render() {
    const { field, data } = this.state
    const { content } = data

    return (
      <div className="content">
        <div className="layout-config-column form">
          <span className="layout-config-column-title">前缀</span>
          <div className="form color-picker-input-container">
            <input className="input-box"
              type="text"
              value={content}
              onChange={this.handleChangeContent}
              onBlur={this.handleConfirmContent}
            />
          </div>
        </div>
        <NumberValue {...this.props} field={field} noStyle/>
      </div>
    )
  }

  // 输入文字
  handleChangeContent = (e) => {
    const newValue = e.target.value
    this.setState(preState => ({
      data: {
        ...preState.data,
        content: newValue
      }
    }))
  };

  // 失去焦点(确认变更)
  handleConfirmContent = (e) => {
    const newValue = e.target.value
    this.setState(preState => ({
      data: {
        ...preState.data,
        content: newValue
      }
    }))
    this.props.onChange(this.state.field, 'content', newValue)
  };
}

export default NumberPrefix
