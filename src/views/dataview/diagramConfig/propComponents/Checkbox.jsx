import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import Input from 'react-bootstrap-myui/lib/Input';

class Checkbox extends React.Component {
  static propTypes = {
    data: PropTypes.bool,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      checked: props.data || false
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        checked: nextProps.data || false
      })
    }
  }

  render() {
    const { checked } = this.state

    return (
      <div style={{ textAlign: 'right' }} className="checkbox-container">
        <Input
          label=" "
          type="checkbox"
          checked={checked}
          onClick={this.handleCheckChange.bind(this)}
          onChange={() => { }}
        />
      </div>
    )
  }

  handleCheckChange(e) {
    const { checked } = e.target
    this.setState({
      checked
    }, () => {
      this.props.onChange(checked)
    })
  }
}

export default Checkbox
