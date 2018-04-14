import React from 'react';
import PropTypes from 'prop-types'
import _ from 'lodash';

import ColorOptionColumn from '../../components/ColorOptionColumn'

class Background extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props)

    let color = 'transparent'

    if (props.configInfo) {
      color = props.field ? props.configInfo.background : props.configInfo.color
    }

    this.state = {
      field: props.field || 'background',
      data: {
        color
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
  }

  render() {
    const { color } = this.state.data

    return (
      <div className="content">
        <div className="layout-config-column">
          <span className="layout-config-column-title">背景颜色</span>
          <ColorOptionColumn
            onChange={this.handleConfirmColorChange.bind(this)}
            field="color"
            color={color}
          />
        </div>
      </div>
    )
  }

  // 确定颜色选择
  handleConfirmColorChange(fieldName, color) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [fieldName]: color
      }
    }))
    const background = this.state.field !== 'background' ? 'background' : 'color'
    this.props.onChange(this.state.field, background, color)
  }
}

export default Background
