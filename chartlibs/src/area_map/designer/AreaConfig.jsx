import React from 'react'
import AreaConfigDialog from './AreaConfigDialog'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { PropComponents } from '@views/dataview/components/DmpChartDev'

export default class AreaConfig extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props)
    this.state = {
      data: _.cloneDeep(props.data),
      dialog: {
        show: false
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.data, nextProps.data)) {
      this.setState({
        data: _.cloneDeep(nextProps.data)
      })
    }
  }

  render() {
    const { dialog } = this.state
    return (
      <div>
        <div className="title">
          区域设置
          <span className="dmpicon-edit float-r"
            style={{ cursor: 'pointer' }}
            onClick={this.toggleConfigDialog.bind(this)}
          />
        </div>
        { dialog.show && this.renderDialog() }
        {this.renderAreaList()}
      </div>
    )
  }

  renderDialog() {
    const { list } = this.state.data
    return <AreaConfigDialog areaGroup={list}  onSure={this.handleSure.bind(this)} onCancel={this.toggleConfigDialog.bind(this)}/>
  }

  renderAreaList() {
    const { list } = this.state.data
    return list.map((areaData, i) => {
      const { fontSize, color, background, borderColor } = areaData.style || {}
      const cityTitle = `包含: ${areaData.areas.join(',') || '(空)'}`
      return <div key={i} style={{ paddingLeft: '10px' }}>
        <div className="subtitle" title={cityTitle} style={{ marginBottom: '10px' }}>{areaData.name}</div>
        <div className="content" style={{ paddingLeft: '10px' }}>
          <div className="layout-config-column">
            <span className="layout-config-column-title">字号</span>
            <PropComponents.Spinner
              min={12}
              data={fontSize}
              onChange={this.handleChangeAreaConfig.bind(this, i, 'style.fontSize')}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title">颜色</span>
            <PropComponents.ColorPicker
              onChange={this.handleChangeAreaConfig.bind(this, i, 'style.color')}
              data={color || 'rgba(255,255,255,1)'}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title">背景色</span>
            <PropComponents.ColorPicker
              onChange={this.handleChangeAreaConfig.bind(this, i, 'style.background')}
              data={background || 'rgba(51, 107, 255, 0.2)'}
            />
          </div>
          <div className="layout-config-column">
            <span className="layout-config-column-title">边界色</span>
            <PropComponents.ColorPicker
              onChange={this.handleChangeAreaConfig.bind(this, i, 'style.borderColor')}
              data={borderColor || 'rgba(44, 213, 255, 0.5)'}
            />
          </div>
        </div>
      </div>
    })
  }

  toggleConfigDialog() {
    this.setState({
      dialog: {
        ...this.state.dialog,
        show: !this.state.dialog.show
      }
    })
  }

  handleSure(areaGroup) {
    this.setState({
      data: {
        ...this.state.data,
        list: areaGroup
      }
    }, () => {
      this.props.onChange(this.state.data)
    })
    this.toggleConfigDialog()
  }

  // handleChangeValue(path, value) {

  // }

  handleChangeAreaConfig(index, key, value) {
    const { list } = this.state.data
    _.set(list[index], key, value)
    this.setState({
      data: {
        ...this.state.data,
        list
      }
    }, () => {
      this.props.onChange(this.state.data)
    })
  }
}
