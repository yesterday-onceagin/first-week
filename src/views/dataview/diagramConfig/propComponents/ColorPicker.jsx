import React from 'react';
import PropTypes from 'prop-types'
import _ from 'lodash';

import ColorOptionColumn from '../../components/ColorOptionColumn'

class ColorPicker extends React.Component {
  static propTypes = {
    data: PropTypes.string,
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props)
    this.state = {
      color: props.data || 'transparent'
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        color: nextProps.data
      })
    }
  }

  render() {
    const { color } = this.state
    return (
      <div>
        <ColorOptionColumn
          color={color}
          onChange={this.handleConfirmColorChange.bind(this)}
        />
      </div>
    )
  }

  // 确定颜色选择
  handleConfirmColorChange(fieldName, color) { //fildName后续需要删掉，为兼容ColorOptionColumn暂时保留
    this.setState({
      color
    })
    this.props.onChange(color)
  }
}

export default ColorPicker
