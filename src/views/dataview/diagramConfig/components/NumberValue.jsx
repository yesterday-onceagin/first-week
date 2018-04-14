import React from 'react'
import PropTypes from 'prop-types'

import ColorOptionColumn from '../../components/ColorOptionColumn'
import NumberInput from '../../../../components/NumberInput'
import SliderInput from '../../../../components/SliderInput'
import classnames from 'classnames'

import _ from 'lodash'

import { FONT_STYLES, FONT_ALIGNS } from '../../constants/fontOptions'

class NumberValue extends React.Component {
  static propTypes = {
    noStyle: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.array
    ]),
    noLineHeight: PropTypes.bool,
    field: PropTypes.string,
    configInfo: PropTypes.object,
    onChange: PropTypes.func,
    chart: PropTypes.object
  };

  static defaultProps = {
    noStyle: false,
    noLineHeight: false
  };

  constructor(props) {
    super(props)
    this.state = {
      field: props.field || 'numberValue',
      data: props.configInfo ? _.cloneDeep(props.configInfo) : {}
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.configInfo, nextProps.configInfo)) {
      this.setState({
        data: _.cloneDeep(nextProps.configInfo)
      })
    }
    if (nextProps.field && this.props.field !== nextProps.field) {
      this.setState({
        field: nextProps.field
      })
    }
  }

  render() {
    const { chart_code } = this.props.chart
    const { field, data } = this.state
    const { fontSize, color, insideColor } = data

    return (
      <div className="content">
        <div className="layout-config-column has-suffix">
          <span className="layout-config-column-title">字号</span>
          <span className="layout-config-column-suffix">px</span>
          <NumberInput
            changeOnBlur={true}
            debounce={true}
            minValue={12}
            step={1}
            name="layout-config-size-width"
            value={fontSize}
            onChange={this.handleChangeInput.bind(this, 'fontSize')}
          />
        </div>
        <div className="layout-config-column">
          <span className="layout-config-column-title">颜色</span>
          <ColorOptionColumn
            onChange={this.handleConfirmColorChange.bind(this)}
            field="color"
            color={color}
          />
        </div>
        {field === 'liquidText' && <div className="layout-config-column">
          <span className="layout-config-column-title">内部颜色</span>
          <ColorOptionColumn
            onChange={this.handleConfirmColorChange.bind(this)}
            field="insideColor"
            color={insideColor}
          />
        </div>}
        {chart_code !== 'split_gauge' && chart_code !== 'liquid_fill' && this.renderFontLineHeightOption()}
        {this.renderFontStyleOption()}
        {(chart_code === 'split_gauge' || chart_code === 'liquid_fill') && this.renderFontDistanceOption()}
        {field === 'numberValue' && this.renderFontAlignOption()}
        {field === 'numberValue' && this.renderBackgroundOption()}
        {field === 'numberValue' && this.renderMarginOption()}
        {field === 'numberValue' && this.renderBorderRadiusOption()}
      </div>
    )
  }

  // 渲染文字行高设置
  renderFontLineHeightOption() {
    const { noLineHeight } = this.props
    const { lineHeight } = this.state.data

    return !noLineHeight ? (
      <div className="layout-config-column has-suffix">
        <span className="layout-config-column-title">行高</span>
        <span className="layout-config-column-suffix">px</span>
        <NumberInput
          changeOnBlur={true}
          debounce={true}
          minValue={12}
          step={1}
          name="layout-config-size-width"
          value={lineHeight}
          onChange={this.handleChangeInput.bind(this, 'lineHeight')}
        />
      </div>
    ) : null
  }

  //渲染仪表盘文本
  renderFontDistanceOption() {
    const { distance } = this.state.data
    return (<div className="layout-config-column form">
      <span className="layout-config-column-title">高度位置</span>
      <SliderInput
        className="config"
        minValue={-100}
        maxValue={100}
        step={2}
        style={{ width: '100%', height: '30px', lineHeight: '30px', margin: 'auto 0' }}
        value={distance}
        onChange={this.handleChangeInput.bind(this, 'distance')}
      />
    </div>)
  }

  // 渲染字体样式设置
  renderFontStyleOption() {
    const { noStyle } = this.props
    const { fontStyle } = this.state.data
    const fontStyleArrs = fontStyle ? fontStyle.split(',') : []
    return noStyle === true ? null : (
      <div className="layout-config-column">
        <span className="layout-config-column-title">样式</span>
        {
          FONT_STYLES.map((item) => {
            const _clsName = classnames('diagram-title-font-style-icon', {
              [item.key]: true,
              active: fontStyleArrs.indexOf(item.key) > -1
            })
            // 排除不需要的style设置项
            if (Array.isArray(noStyle) && noStyle.indexOf(item.key) > -1) {
              return null
            }
            return (
              <i key={`diagram-title-font-style-${item.key}`}
                title={item.name}
                className={_clsName}
                onClick={this.handleChangeStyle.bind(this, item.key)}
              >
                {item.icon}
              </i>
            )
          })
        }
      </div>
    )
  }

  // 渲染字体对齐设置
  renderFontAlignOption() {
    const { textAlign } = this.state.data
    return (
      <div className="layout-config-column">
        <span className="layout-config-column-title">对齐</span>
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
                onClick={this.handleChangeInput.bind(this, 'textAlign', item.key)}
              />
            )
          })
        }
      </div>
    )
  }

  // 渲染数值背景的设置
  renderBackgroundOption() {
    const { background } = this.state.data
    return (
      <div className="layout-config-column">
        <span className="layout-config-column-title">背景颜色</span>
        <ColorOptionColumn
          onChange={this.handleConfirmColorChange.bind(this)}
          field="background"
          color={background}
        />
      </div>
    )
  }

  // 渲染数值间距的设置
  renderMarginOption() {
    const { margin } = this.state.data
    return (
      <div className="layout-config-column has-suffix">
        <span className="layout-config-column-title">数字间距</span>
        <span className="layout-config-column-suffix">px</span>
        <NumberInput
          changeOnBlur={true}
          debounce={true}
          step={1}
          name="layout-config-margin"
          value={margin}
          onChange={this.handleChangeInput.bind(this, 'margin')}
        />
      </div>
    )
  }

  // 渲染数值背景块的圆角的设置
  renderBorderRadiusOption() {
    const { borderRadius } = this.state.data
    return (
      <div className="layout-config-column has-suffix">
        <span className="layout-config-column-title">圆角</span>
        <span className="layout-config-column-suffix">px</span>
        <NumberInput
          changeOnBlur={true}
          debounce={true}
          minValue={0}
          step={1}
          name="layout-config-border-radius"
          value={borderRadius}
          onChange={this.handleChangeInput.bind(this, 'borderRadius')}
        />
      </div>
    )
  }

  // 输入事件
  handleChangeInput(fieldName, value) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [fieldName]: value
      }
    }), () => {
      this.props.onChange(this.state.field, fieldName, value)
    })
  }

  // 变更标题文字样式
  handleChangeStyle(style) {
    const styleArray = this.state.data.fontStyle ? this.state.data.fontStyle.split(',') : []
    const styleIndex = styleArray.indexOf(style)

    if (styleIndex > -1) {
      styleArray.splice(styleIndex, 1)
    } else {
      styleArray.push(style)
    }
    _.set(this.state.data, 'fontStyle', styleArray.join(','))
    this.setState({ ...this.state }, () => {
      this.props.onChange(this.state.field, 'fontStyle', styleArray.join(','))
    })
  }

  // 确定颜色选择
  handleConfirmColorChange(fieldName, color) {
    this.setState(preState => ({
      data: {
        ...preState.data,
        [fieldName]: color
      }
    }))
    this.props.onChange(this.state.field, fieldName, color)
  }
}

export default NumberValue
