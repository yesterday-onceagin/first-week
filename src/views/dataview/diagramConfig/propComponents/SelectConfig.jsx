import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import Select from 'react-bootstrap-myui/lib/Select'

class SelectConfig extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    data: PropTypes.any,
    options: PropTypes.array,
    onChange: PropTypes.func
  };

  static defaultProps = {
    options: []
  };

  constructor(props) {
    super(props)
    this.state = {
      selectedVal: props.data || ''
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        selectedVal: nextProps.data || ''
      })
    }
  }

  render() {
    const { options, style } = this.props
    const { selectedVal } = this.state

    return (
      <div style={style}>
        <Select
          value={selectedVal}
          maxHeight={160}
          width="100%"
          openSearch={false}
          onSelected={this.handleSelectChange.bind(this)}
        >
          {
            options && options.map(option => <option key={option.value} value={option.value}>{option.text}</option>)
          }
        </Select>
      </div>
    )
  }

  handleSelectChange(option) {
    const selectedVal = option.value
    this.setState({
      selectedVal
    }, () => {
      this.props.onChange(selectedVal)
    })
  }
}

export default SelectConfig
