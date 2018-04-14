import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'

import PaddingConfig from '../../common/PaddingConfig'
import LineStyle from '../../common/LineStyle'
import LabelValueStyle from '../../common/LabelValueStyle'

export default class LineGlobal extends React.Component {
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
      <hr />
      <LineStyle
        lineStyle={data}
        onChange={this.handleChange.bind(this)}
      />
      <hr />
      <LabelValueStyle
        labelStyle={data.lineLabel}
        onChange={this.handleChangeLabelValue.bind(this)}
      />
    </div>)
  }

  handleChange(property, value) {
    const { data } = this.state
    data[property] = value
    this.props.onChange('global', property, value)
  }

  handleChangeLabelValue(key, value) {
    const { data } = this.state
    data.lineLabel[key] = value
    this.props.onChange('global.lineLabel', key, value)
  }
}
