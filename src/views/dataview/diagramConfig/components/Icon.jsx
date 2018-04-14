import React from 'react'
import _ from 'lodash'

import NumberInput from '../../../../components/NumberInput';
import ColorOptionColumn from '../../components/ColorOptionColumn';
import SliderInput from '../../../../components/SliderInput';

class Icon extends React.Component {
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
    const { fontSize, color, marginRight } = this.state.data
    return (<div className="content">
      <div className="layout-config-column has-suffix">
        <span className="layout-config-column-title">字号</span>
        <span className="layout-config-column-suffix">px</span>
        <NumberInput
          changeOnBlur={true}
          debounce={true}
          minValue={12}
          step={1}
          name="name"
          value={fontSize}
          onChange={this.handleChangeValue.bind(this, 'fontSize')}
        />
      </div>
      <div className="layout-config-column">
        <span className="layout-config-column-title">颜色</span>
        <ColorOptionColumn
          onChange={this.handleChangeValue.bind(this)}
          field="color"
          color={color}
        />
      </div>
      <div className="layout-config-column">
        <span className="layout-config-column-title">边距</span>
        <SliderInput
          className="config"
          minValue={0}
          maxValue={100}
          step={1}
          style={{ width: '100%', height: '30px', lineHeight: '30px', margin: 'auto 0' }}
          value={marginRight}
          onChange={this.handleChangeValue.bind(this, 'marginRight')}
        />
      </div>
    </div>)
  }

  handleChangeValue(path, value) {
    _.set(this.state.data, path, value)
    this.setState({}, () => {
      this.props.onChange('icon', path, value)
    })
  }
}

export default Icon
