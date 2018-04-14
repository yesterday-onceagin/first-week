import React from 'react'
import PropTypes from 'prop-types'

import Input from 'react-bootstrap-myui/lib/Input';
import NumberInput from '../../../../../components/NumberInput';
import ColorOptionColumn from '../../../components/ColorOptionColumn';

import _ from 'lodash'
import classnames from 'classnames'

import { FONT_ALIGNS } from '../../../constants/fontOptions'

class TableGlobal extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
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
    const { scroll, cell, qianN } = this.state.data

    return (
      <div>
        <div className="title">
          滚动设置
          <span onClick={this.handleChangeValue.bind(this, 'scroll.checked', !scroll.checked)}>
            <Input
              type="checkbox"
              checked={scroll.checked}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          scroll.checked && <div className="content">
            {this.renderNumberSection('间隔时间', scroll.interVal, 'scroll.interVal', 1, 60, 1, 's')}
            {this.renderNumberSection('锁定行数', scroll.ln, 'scroll.ln', 0, Infinity, 1, '')}
          </div>
        }
        <hr />
        <div className="title">
          单元格
          <span onClick={this.handleChangeValue.bind(this, 'cell.checked', !cell.checked)}>
            <Input
              type="checkbox"
              checked={cell.checked}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          cell.checked && <div className="content">
            {this.renderNumberSection('字号', cell.fontSize, 'cell.fontSize', 12, 100, 1)}
            <div className="layout-config-column">
              <span className="layout-config-column-title sub">颜色</span>
              <ColorOptionColumn
                onChange={this.handleChangeValue.bind(this)}
                field="cell.color"
                color={cell.color}
              />
            </div>
            {this.renderNumberSection('行高', cell.lineHeight, 'cell.lineHeight', 12, 100, 1)}
            {this.renderAlignSection('文本对齐', cell.textAlign, 'cell.textAlign')}
          </div>
        }
        <hr />
        <div className="title">
          前N行设置
          <span onClick={this.handleChangeValue.bind(this, 'qianN.checked', !qianN.checked)}>
            <Input
              type="checkbox"
              checked={qianN.checked}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          qianN.checked && <div className="content">
            {this.renderNumberSection('行数', qianN.end, 'qianN.end', 0, 1000, 1, '')}
            {this.renderNumberSection('字号', qianN.fontSize, 'qianN.fontSize', 12, 100, 1)}
            <div className="layout-config-column">
              <span className="layout-config-column-title sub">颜色</span>
              <ColorOptionColumn
                onChange={this.handleChangeValue.bind(this)}
                field="qianN.color"
                color={qianN.color}
              />
            </div>
            {this.renderNumberSection('行高', qianN.lineHeight, 'qianN.lineHeight', 12, 100, 1)}
            {this.renderAlignSection('文本对齐', qianN.textAlign, 'qianN.textAlign')}
            <div className="layout-config-column">
              <span className="layout-config-column-title sub">背景颜色</span>
              <ColorOptionColumn
                onChange={this.handleChangeValue.bind(this)}
                field="qianN.background"
                color={qianN.background}
              />
            </div>
          </div>
        }
      </div>
    )
  }

  renderNumberSection(title, value, path, min, max, step, suffix = 'px') {
    return (
      <div className="layout-config-column has-suffix">
        <span className="layout-config-column-title sub">{title}</span>
        <span className="layout-config-column-suffix">{suffix}</span>
        <NumberInput
          changeOnBlur={true}
          debounce={true}
          minValue={min}
          maxValue={max}
          step={step}
          name="name"
          value={value}
          onChange={this.handleChangeValue.bind(this, path)}
        />
      </div>
    )
  }

  renderAlignSection(title, value, path) {
    return (
      <div className="layout-config-column">
        <span className="layout-config-column-title sub">{title}</span>
        {
          FONT_ALIGNS.map((item) => {
            const clsName = classnames('diagram-title-font-align-icon', {
              [item.icon]: true,
              active: item.key === value
            })
            return (
              <i key={`diagram-simple-text-font-align-${item.key}`}
                title={item.name}
                className={clsName}
                onClick={this.handleChangeValue.bind(this, path, item.key)}
              />
            )
          })
        }
      </div>
    )
  }

  handleChangeValue(path, value) {
    _.set(this.state.data, path, value)
    this.setState({}, () => {
      this.props.onChange('global', path, value)
    })
  }
}

export default TableGlobal
