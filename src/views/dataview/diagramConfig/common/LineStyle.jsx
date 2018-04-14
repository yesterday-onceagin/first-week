//折线样式
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import Select from 'react-bootstrap-myui/lib/Select'
import NumberInput from '../../../../components/NumberInput'

export default class LineStyle extends React.Component {
  static propTypes = {
    lineStyle: PropTypes.object,
    onChange: PropTypes.func,
  }
  constructor(props) {
    super(props)
    this.state = {
      lineSize: props.lineStyle.lineSize
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      lineSize: nextProps.lineStyle.lineSize
    })
  }

  render() {
    const { lineStyle, onChange } = this.props
    const { lineSize } = this.state
    const cn = classnames('icon-checkbox', { checked: lineStyle.lineSmooth })
    
    return (<div>
      <div className="title">折线样式</div>
      <div className="content">
        <div className="layout-config-column form">
          <span className="layout-config-column-title sub">折线粗细</span>
          <Select
            value={lineStyle.lineType}
            maxHeight={160}
            width={85}
            openSearch={false}
            onSelected={this.handleChangeSelectValue.bind(this, 'lineType')}
          >
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dot">点线</option>
          </Select>
          <input className="border-input"
            type="text"
            value={lineSize}
            onChange={this.handleChangeInput.bind(this, 'lineSize')}
            onBlur={this.handleChange.bind(this, 'lineSize')}
          />
          <span className="layout-config-column-suffix">px</span>
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">圆点半径</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={1}
            step={1}
            name="lineItem"
            value={lineStyle.lineItem}
            onChange={onChange.bind(this, 'lineItem')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title sub">近似曲线</span>
          <div className="checkbox-container">
            <i className={cn} onClick={this.handleToggle.bind(this, 'lineSmooth')}/>
          </div>
        </div>
      </div>
    </div>)
  }

  handleChangeSelectValue(type, option) {
    this.props.onChange(type, option.value)
  }

  handleChangeInput(key, e) {
    this.setState({
      [key]: e.target.value
    })
  }

  handleChange(key) {
    this.props.onChange(key, this.state[key])
  }

  handleToggle(key) {
    const { lineStyle, onChange } = this.props
    onChange(key, !lineStyle[key])
  }
}
