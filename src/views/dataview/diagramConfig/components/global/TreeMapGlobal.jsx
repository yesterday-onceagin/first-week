import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'

import NumberInput from '../../../../../components/NumberInput';

import ColorOptionColumn from '../../../components/ColorOptionColumn'

export default class TreeMapGlobal extends React.Component {
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
      <div className="title">
        值标签
      </div>
      <div className="content">
        <div className="layout-config-column has-suffix">
          <span className="layout-config-column-title sub">字号</span>
          <span className="layout-config-column-suffix">px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={12}
            step={1}
            name="fontSize"
            value={data.label.fontSize}
            onChange={this.handleChange.bind(this, 'label.fontSize')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">颜色</span>
          <ColorOptionColumn
            field="label.color"
            color={data.label.color}
            onChange={this.handleChange.bind(this)}
          />
        </div>

      </div>
    </div>)
  }

  handleChange(path, value) {
    const { data } = this.state
    _.set(data, path, value)
    this.setState({
      data
    }, () => {
      this.props.onChange('global', path, value)
    })
  }
}
