import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import PaddingConfig from '../../common/PaddingConfig'

export default class AreamapGlobal extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      data: _.cloneDeep(props.configInfo)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.configInfo && !_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
  }

  render() {
    const { data } = this.state
    return (<div>
      <PaddingConfig
        padding={data}
        onChange={this.handleChange.bind(this)}
      />
    </div>)
  }

  handleChange(property, value) {
    const { data } = this.state
    data[property] = value
    this.props.onChange('global', property, value)
  }
}
