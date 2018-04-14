import React from 'react';
import PropTypes from 'prop-types';

import Select from 'react-bootstrap-myui/lib/Select'
import Input from 'react-bootstrap-myui/lib/Input'
import NumberInput from '../../../../components/NumberInput'
import ColorOptionColumn from '../../components/ColorOptionColumn'
import SliderInput from '../../../../components/SliderInput'

import classnames from 'classnames'
import _ from 'lodash'

import { FONT_STYLES, FONT_ALIGNS } from '../../constants/fontOptions'

const _getStyleText = function (oldText, style) {
  const styleArray = oldText.split(',')
  const styleIndex = styleArray.indexOf(style)
  if (styleIndex > -1) {
    styleArray.splice(styleIndex, 1)
  } else {
    styleArray.push(style)
  }
  return styleArray.join(',')
}

class TableColumn extends React.Component {
  static propTypes = {
    configInfo: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    indexCol: false,
    onChange: () => { }
  };

  constructor(props) {
    super(props)
    this.state = {
      data: _.cloneDeep(props.configInfo)
    }
  }

  render() {
    const { data } = this.state
    return (<div>
      {Array.isArray(data.list) ? this.renderCols() : this.renderIndexCol()}
    </div>)
  }

  renderCols() {
    const { data } = this.state
    return data.list.map((col, i) => {
      const { fontSize, color, fontStyle, textAlign, colWidth, background, type, imageWidth, styleChecked } = col
      const fontStyleArrs = fontStyle ? fontStyle.split(',') : []
      return (<div className="config-segment" key={i}>
        <div className="segment-title title" style={{ lineHeight: '20px', marginBottom: '10px' }}>
          {`列${i + 1}`}
        </div>
        <div className="content" style={{ paddingLeft: '10px' }}>
          <div className="title">
            文本样式
            <span onClick={this.handleChangeValue.bind(this, i, 'styleChecked', !styleChecked)}>
              <Input
                type="checkbox"
                checked={styleChecked}
                onChange={() => { }}
              />
            </span>
          </div>
          {styleChecked && <div style={{ paddingLeft: '10px' }}>
            <div className="row-section">
              <div className="layout-config-column" style={{ ...this.STYLE_SHEET.configColumn, padding: '0 26px 10px 94px' }}>
                <span style={this.STYLE_SHEET.configColumnTitle}>字号</span>
                <span style={this.STYLE_SHEET.pxUnit}>px</span>
                <NumberInput
                  changeOnBlur={true}
                  debounce={true}
                  minValue={12}
                  step={1}
                  name="layout-config-size-width"
                  value={fontSize}
                  onChange={this.handleChangeValue.bind(this, i, 'fontSize')}
                />
              </div>
            </div>
            <div className="row-section">
              <div className="layout-config-column" style={{ ...this.STYLE_SHEET.configColumn, padding: '0 0 10px 94px' }}>
                <span style={this.STYLE_SHEET.configColumnTitle}>颜色</span>
                <ColorOptionColumn
                  onChange={this.handleChangeValue.bind(this, i)}
                  field="color"
                  color={color}
                />
              </div>
            </div>
            <div className="row-section">
              <div className="layout-config-column" style={this.STYLE_SHEET.configColumn}>
                <span style={this.STYLE_SHEET.configColumnTitle}>样式</span>
                {
                  FONT_STYLES.map((item) => {
                    const _clsName = classnames('diagram-title-font-style-icon', {
                      [item.key]: true,
                      active: fontStyleArrs.indexOf(item.key) > -1
                    })
                    return (
                      <i key={`diagram-title-font-style-${item.key}`}
                        title={item.name}
                        className={_clsName}
                        style={this.STYLE_SHEET.fontStyleIcon}
                        onClick={this.handleChangeStyle.bind(this, i, item.key)}
                      >
                        {item.icon}
                      </i>
                    )
                  })
                }
              </div>
            </div>

            <div className="row-section">
              <div className="layout-config-column" style={this.STYLE_SHEET.configColumn}>
                <span style={this.STYLE_SHEET.configColumnTitle}>对齐</span>
                {
                  FONT_ALIGNS.map((item) => {
                    const _clsName = classnames('diagram-title-font-align-icon', {
                      [item.icon]: true,
                      active: item.key === textAlign
                    })
                    return (
                      <i key={`diagram-title-font-align-${item.key}`}
                        title={item.name}
                        className={_clsName}
                        style={this.STYLE_SHEET.fontAlignIcon}
                        onClick={this.handleChangeValue.bind(this, i, 'textAlign', item.key)}
                      />
                    )
                  })
                }
              </div>
            </div>

            <div className="row-section">
              <div className="layout-config-column" style={{ ...this.STYLE_SHEET.configColumn, padding: '0 0 10px 94px' }}>
                <span style={this.STYLE_SHEET.configColumnTitle}>背景颜色</span>
                <ColorOptionColumn
                  onChange={this.handleChangeValue.bind(this, i)}
                  field="background"
                  color={background}
                />
              </div>
            </div>
          </div>}

          <div className="title">其他</div>
          <div style={{ paddingLeft: '10px' }}>
            <div className="row-section">
              {this.renderSlider('列宽占比', colWidth, 0, 100, 0.5, this.handleChangeValue.bind(this, i, 'colWidth'))}
            </div>

            <div className="row-section">
              <div className="layout-config-column" style={this.STYLE_SHEET.configColumn}>
                <span style={this.STYLE_SHEET.configColumnTitle}>内容类型</span>
                <Select
                  value={type}
                  maxHeight={160}
                  width={200}
                  openSearch={false}
                  onSelected={this.handleChangeSelect.bind(this, i, 'type')}
                >
                  <option value={'text'}>文字</option>
                  <option value={'image'}>图片</option>
                </Select>
              </div>
            </div>
            {type === 'image' &&
              <div className="row-section">
                {this.renderSlider('图片占比', imageWidth, 0, 100, 0.5, this.handleChangeValue.bind(this, i, 'imageWidth'))}
              </div>
            }
          </div>
        </div>
        <hr />
      </div>)
    })
  }

  renderIndexCol() {
    const { data } = this.state
    const { header, fontSize, fontStyle, color, colWidth, radius, background } = data
    const fontStyleArrs = fontStyle ? fontStyle.split(',') : []

    return (<div>
      <div className="layout-config-column" style={this.STYLE_SHEET.configColumn}>
        <span style={this.STYLE_SHEET.configColumnTitle}>表头内容</span>
        <form>
          <Input type="text"
            style={{ height: '30px', padding: '0 10px' }}
            value={header}
            onChange={this.handleChangeText.bind(this, 'header', false)}
            onBlur={this.handleChangeText.bind(this, 'header', true)}
          />
        </form>
      </div>
      <div className="layout-config-column" style={{ ...this.STYLE_SHEET.configColumn, padding: '0 26px 10px 94px' }}>
        <span style={this.STYLE_SHEET.configColumnTitle}>字号</span>
        <span style={this.STYLE_SHEET.pxUnit}>px</span>
        <NumberInput
          changeOnBlur={true}
          debounce={true}
          minValue={12}
          step={1}
          name="layout-config-size-width"
          value={fontSize}
          onChange={this.handleChangeIndexColValue.bind(this, 'fontSize')}
        />
      </div>
      <div className="layout-config-column" style={{ ...this.STYLE_SHEET.configColumn, padding: '0 0 10px 94px' }}>
        <span style={this.STYLE_SHEET.configColumnTitle}>颜色</span>
        <ColorOptionColumn
          onChange={this.handleChangeIndexColValue.bind(this)}
          name="颜色"
          field="color"
          color={color}
        />
      </div>
      <div className="layout-config-column" style={this.STYLE_SHEET.configColumn}>
        <span style={this.STYLE_SHEET.configColumnTitle}>样式</span>
        {
          FONT_STYLES.map((item) => {
            const _clsName = classnames('diagram-title-font-style-icon', {
              [item.key]: true,
              active: fontStyleArrs.indexOf(item.key) > -1
            })
            return (
              <i key={`diagram-title-font-style-${item.key}`}
                title={item.name}
                className={_clsName}
                style={this.STYLE_SHEET.fontStyleIcon}
                onClick={this.handleChangeIndexStyle.bind(this, item.key)}
              >
                {item.icon}
              </i>
            )
          })
        }
      </div>
      {this.renderSlider('列宽占比', colWidth, 0, 100, 0.5, this.handleChangeIndexColValue.bind(this, 'colWidth'))}
      {this.renderSlider('半径占比', radius, 0, 100, 0.5, this.handleChangeIndexColValue.bind(this, 'radius'))}
      <div className="layout-config-column" style={{ ...this.STYLE_SHEET.configColumn, padding: '0 0 10px 94px' }}>
        <span style={this.STYLE_SHEET.configColumnTitle}>序号背景</span>
        <ColorOptionColumn
          onChange={this.handleChangeIndexColValue.bind(this)}
          field="background"
          color={background}
        />
      </div>
    </div>)
  }

  renderSlider(title, value, min, max, step, onChange) {
    return <div className="layout-config-column" style={this.STYLE_SHEET.configColumn}>
      <span style={this.STYLE_SHEET.configColumnTitle}>{title}</span>
      <SliderInput
        className="config"
        minValue={min}
        maxValue={max}
        step={step}
        style={{ width: '100%', height: '30px', lineHeight: '30px', margin: 'auto 0' }}
        value={value}
        onChange={onChange}
      />
    </div>
  }

  handleChangeValue(index, key, value) {
    const data = this.state.data
    _.set(data.list[index], key, value)
    this.setState({
      data
    }, () => {
      this.props.onChange(`cols.list[${index}]`, key, value)
    })
  }

  handleConfirmColorChange() {

  }

  handleChangeStyle(index, style) {
    const styleValue = _getStyleText(this.state.data.list[index].fontStyle, style)
    _.set(this.state.data.list[index], 'fontStyle', styleValue)
    this.setState({})
    this.handleChangeValue(index, 'fontStyle', styleValue)
  }

  handleChangeSelect(index, key, { value }) {
    this.handleChangeValue(index, key, value)
  }

  handleChangeIndexColValue(path, value, save = true) {
    const data = this.state.data
    _.set(data, path, value)
    this.setState({
      data
    })
    if (save) {
      this.props.onChange('indexCol', path, value)
    }
  }

  handleChangeText(path, save, e) {
    const value = e.target.value
    this.handleChangeIndexColValue(path, value, save)
  }

  handleChangeIndexStyle(style) {
    const styleValue = _getStyleText(this.state.data.fontStyle, style)
    this.setState({
      data: {
        ...this.state.data,
        fontStyle: styleValue
      }
    })
    this.handleChangeIndexColValue('fontStyle', styleValue)
  }

  STYLE_SHEET = {
    configColumn: {
      lineHeight: '30px',
      fontSize: '12px',
      width: '100%',
      height: 40,
      position: 'relative',
      padding: '0 0 10px 94px',
      color: '#fff'
    },
    configColumnTitle: {
      position: 'absolute',
      left: 0,
      lineHeight: '30px'
    },
    pxUnit: {
      position: 'absolute',
      right: 6,
      lineHeight: '30px'
    },
    fontStyleIcon: {
      fontSize: '12px',
      cursor: 'pointer',
      float: 'right',
      marginLeft: 6,
      padding: '0 8px'
    },
    fontAlignIcon: {
      lineHeight: '24px',
      fontSize: '12px',
      cursor: 'pointer',
      float: 'right',
      marginLeft: 4,
      padding: '0 6px'
    },
    // SWITCH BTN
    switchBtn: {
      width: 34,
      height: 14,
      lineHeight: '14px',
      float: 'right',
      right: 14,
      top: 8
    },
  }
}

export default TableColumn
