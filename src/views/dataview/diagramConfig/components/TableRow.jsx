import React from 'react';

import Select from 'react-bootstrap-myui/lib/Select';
import Input from 'react-bootstrap-myui/lib/Input';
import ColorOptionColumn from '../../components/ColorOptionColumn'

import _ from 'lodash';

class TableRow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      data: _.cloneDeep(props.configInfo)
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
    const { splitLine, oddEven } = this.state.data

    return (
      <div>
        <div className="title">
          分割线
          <span onClick={this.hanldeChecked.bind(this, 'splitLine', splitLine.checked)}>
            <Input
              type="checkbox"
              checked={splitLine.checked}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          splitLine.checked && <div className="content">
            <div className="layout-config-column">
              <span className="layout-config-column-title sub">颜色</span>
              <ColorOptionColumn
                onChange={this.handleConfirmColorChange.bind(this)}
                field="splitLine.color"
                color={splitLine.color}
              />
            </div>
            <div className="layout-config-column form">
              <span className="layout-config-column-title sub">粗细</span>
              <Select
                value={splitLine.style}
                maxHeight={160}
                width={85}
                openSearch={true}
                onSelected={this.handleChangeSelect.bind(this)}
              >
                <option value="solid">实线</option>
                <option value="dashed">虚线</option>
                <option value="dotted">点线</option>
              </Select>
              <input className="border-input"
                type="text"
                value={splitLine.width}
                onChange={this.handleChangeText.bind(this)}
              />
              <span className="layout-config-column-suffix">px</span>
            </div>
          </div>
        }

        <hr />

        <div className="title">
          区分奇偶行
          <span onClick={this.hanldeChecked.bind(this, 'oddEven', oddEven.checked)}>
            <Input
              type="checkbox"
              checked={oddEven.checked}
              onChange={() => { }}
            />
          </span>
        </div>
        {
          oddEven.checked && <div className="content">
            <div className="layout-config-column">
              <span className="layout-config-column-title sub">奇行背景色</span>
              <ColorOptionColumn
                onChange={this.handleConfirmColorChange.bind(this)}
                field="oddEven.oddBackgroundColor"
                color={oddEven.oddBackgroundColor}
              />
            </div>
            <div className="layout-config-column">
              <span className="layout-config-column-title sub">偶行背景色</span>
              <ColorOptionColumn
                onChange={this.handleConfirmColorChange.bind(this)}
                field="oddEven.evenBackgroundColor"
                color={oddEven.evenBackgroundColor}
              />
            </div>
          </div>
        }
      </div>
    );
  }

  hanldeChecked(field, checked) {
    _.set(this.state.data, `${field}.checked`, !checked)
    this.setState({
      ...this.state
    }, () => {
      this.props.onChange('rows', `${field}.checked`, !checked)
    })
  }

  handleChangeText(e) {
    const newValue = e.target.value
    _.set(this.state.data, 'splitLine.width', newValue)
    this.setState({
      ...this.state
    }, () => {
      this.props.onChange('rows', 'splitLine.width', newValue)
    })
  }

  handleChangeSelect(option) {
    _.set(this.state.data, 'splitLine.style', option.value)
    this.setState({
      ...this.state
    }, () => {
      this.props.onChange('rows', 'splitLine.style', option.value)
    })
  }

  // 确定颜色选择
  handleConfirmColorChange(field, color) {
    _.set(this.state.data, field, color)

    this.setState({
      ...this.state
    }, () => {
      this.props.onChange('rows', field, color)
    })
  }

  STYLE_SELECT_TEXT = {
    solid: '实线',
    dashed: '虚线',
    dotted: '点线'
  };
}

export default TableRow
