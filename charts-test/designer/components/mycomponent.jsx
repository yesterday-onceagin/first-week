import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

class MyComponent extends React.Component {
  static propTypes = {
    chart: PropTypes.object,
    chartData: PropTypes.object,
    data: PropTypes.object,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props)
    this.state = {
      data: props.data
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.chart, this.props.chart)) {
      this.setState({
        data: nextProps.data
      })
    }
  }

  render() {
    const { data } = this.state
    return (
      <div className="diagram-design-config-content">
        <div className="form">
          <input
            type="text"
            className="form-control"
            value={data}
            onChange={this.handleChange}
          />
        </div>
      </div>
    )
  }

  handleChange = (e) => {
    const data = e.target.value
    this.setState({
      data
    }, () => {
      this.props.onChange(data)
    })
  }
}

export default MyComponent
