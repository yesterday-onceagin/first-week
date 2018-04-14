import React from 'react'
import PropTypes from 'prop-types'

import ColorOptionColumn from '../../../components/ColorOptionColumn'

import _ from 'lodash'

class LabelmapGlobal extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

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
    return (
      <div>
        <div className="title">标签</div>
        <div className="content">
          {this.renderColorConfig('维度颜色', 'nameColor')}
          {this.renderColorConfig('数值颜色', 'valueColor')}
          {this.renderColorConfig('线框颜色', 'borderColor')}
          {this.renderColorConfig('悬浮颜色', 'hoverColor')}
        </div>
        <hr/>
        <div className="title">地图</div>
        <div className="content">
          {this.renderColorConfig('区域颜色', 'mapColor')}
          {this.renderColorConfig('轮廓颜色', 'mapBorderColor')}
        </div>
        <hr/>
        <div className="title">地图标记</div>
        <div className="content">
          {this.renderColorConfig('中心颜色', 'markColor')}
          {this.renderColorConfig('圆环颜色', 'markShadowColor')}
          {this.renderColorConfig('悬浮中心颜色', 'markHoverColor')}
          {this.renderColorConfig('悬浮圆环颜色', 'markHoverShadowColor')}
        </div>
      </div>
    )
  }

  renderColorConfig(title, fieldName) {
    const { data } = this.state
    return (
      <div className="layout-config-column">
        <span className="layout-config-column-title sub">{title}</span>
        <ColorOptionColumn
          onChange={this.handleConfirmColorChange.bind(this)}
          field={fieldName}
          color={data[fieldName]}
        />
      </div>
    )
  }

  handleConfirmColorChange(field, newColor) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [field]: newColor
      }
    }))
    this.props.onChange('global', field, newColor)
  }

  handleChange(property, value) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [property]: value
      }
    }))
    this.props.onChange('global', property, value)
  }
}

export default LabelmapGlobal
