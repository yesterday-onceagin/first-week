import React from 'react'
import PropTypes from 'prop-types'
import Dialog from 'react-bootstrap-myui/lib/Dialog'
import Button from 'react-bootstrap-myui/lib/Button'
import Select from 'react-bootstrap-myui/lib/Select'
import OverlayTrigger from 'react-bootstrap-myui/lib/OverlayTrigger'
import Popover from 'react-bootstrap-myui/lib/Popover'
import { ChromePicker, SketchPicker } from 'react-color'
import classnames from 'classnames'
import _ from 'lodash'
import SliderInput from '../../../../../components/SliderInput'

import { getColorFromColorTheme, getAllColorThemes, customColorAtIndex, getThemeByKey } from '../../../../../constants/echart'
import { CHART_HAS_AFFECT } from '../../../../../constants/dashboard'

import './color-theme-dialog.less'
import './color-picker.less'

const getColNames = function (dataArr = []) {
  return dataArr.map(item => item.col_name)
}

const _rgbaToString = function (rgb) {
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`
}

class ColorThemeDialog extends React.Component {
  static propTypes = {
    colorTheme: PropTypes.object,
    onChangeTheme: PropTypes.func,
    onClose: PropTypes.func,
    chart: PropTypes.object,
    chartData: PropTypes.object,
  };

  constructor(props) {
    super(props)
    this.state = {
      colorThemeCopy: _.cloneDeep(props.colorTheme),
      themeKeySelected: props.colorTheme.themeKey,
      legendIndex: 0                                  // 当前选中的legend
    }
  }

  componentWillReceiveProps() {
    // if (this.props.colorTheme !== nextProps.colorTheme) {
    //   this.setState({
    //     colorThemeCopy: _.cloneDeep(nextProps.colorTheme),
    //     themeKeySelected: nextProps.colorTheme.themeKey,
    //     legendIndex: 0
    //   })
    // }
  }

  render() {
    const { chart } = this.props
    const { colorThemeCopy, themeKeySelected, legendIndex } = this.state
    const COLOR_THEMES = _.cloneDeep(getAllColorThemes())
    if (chart.chart_code === 'liquid_fill') {
      Object.keys(COLOR_THEMES).forEach((key) => {
        if (COLOR_THEMES[key].type === 1) {
          delete COLOR_THEMES[key]
        }
      })
    }
    const themeType = COLOR_THEMES[themeKeySelected].type           // 单色还是渐变色
    const isApplyed = themeKeySelected === colorThemeCopy.themeKey

    const currentColorAtLegend = getColorFromColorTheme(colorThemeCopy, legendIndex, chart.chart_code)
    let colorThemeListActiveIndex = -1
    // 需要应用 了主题
    if (themeKeySelected === colorThemeCopy.themeKey) {
      const colors = getThemeByKey(colorThemeCopy.themeKey).colors
      if (Array.isArray(currentColorAtLegend)) {
        for (let i = 0; i < colors.length; i++) {
          if (_.isEqual(getColorFromColorTheme({ themeKey: themeKeySelected }, i, chart.chart_code), currentColorAtLegend)) {
            colorThemeListActiveIndex = i
            break
          }
        }
      } else {
        // 字符串
        colorThemeListActiveIndex = colors.indexOf(currentColorAtLegend)
      }
    }

    return <Dialog
      show
      onHide={this.handleClose.bind(this)}
      backdrop="static"
      size={{ width: '472px' }}
      className="legend-color-editor-dialog"
    >
      <Dialog.Header closeButton>
        <Dialog.Title>颜色设置</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <div className="color-preview-container">
          <div className="legend-values">
            <div className="title">数据颜色{this.renderAffectButton()}</div>
            <div className="legend-color-container">
              <ul className="legend-pane">
                {this.renderLegendList(colorThemeCopy, legendIndex)}
              </ul>
            </div>
          </div>
          <div className="legend-theme" ref={(instance) => { this.contentDom = instance }}>
            <div className="title clear-f">
              <span className="float-l" style={{ marginRight: '13px' }}>配色方案：</span>
              <span className="float-l" style={{ marginRight: '13px' }}>
                <Select width={92} value={themeKeySelected} onSelected={this.handleSelectTheme.bind(this)}>
                  {Object.keys(COLOR_THEMES).map(themeKey => <option key={themeKey} value={themeKey}>{COLOR_THEMES[themeKey].name}</option>)}
                </Select>
              </span>
              <span className="float-l">
                <button className="btn apply-btn" onClick={this.handleApplyTheme.bind(this)}>应用</button>
              </span>
            </div>
            <div className="theme-color-list">
              <ul className="pane">
                {getThemeByKey(themeKeySelected).colors.map((color, i) => {
                  const colorStr = Array.isArray(color) ? `linear-gradient(90deg, ${color[0]}, ${color[1]})` : color
                  const checked = i === colorThemeListActiveIndex
                  return <li key={i} className={`color-thumb${checked ? ' checked' : ''}`} style={{ background: colorStr }} onClick={this.handleThemeColorClick.bind(this, color)}>
                    <i className="dmpicon-tick"></i>
                  </li>
                })}
              </ul>
              {isApplyed && (themeType === 0 ?
                <div className="custom-color" ref={(node) => { this.picker_popver_container = node }}>
                  <OverlayTrigger
                    trigger="click"
                    placement="bottom"
                    rootClose
                    overlay={this.renderColorPicker(currentColorAtLegend, this.handleSelectColorPick.bind(this))}
                    // container={() => this.picker_popver_container}
                    onEnter={this.handleColorpickEntered.bind(this)}
                  >
                    <div>
                      <span className="color" style={{ background: currentColorAtLegend }}></span>
                      <span>自定义颜色</span>
                    </div>
                  </OverlayTrigger>
                </div>
                :
                <div className="custom-grad-color">
                  <h6 style={{ textAlign: 'left', marginTop: '20px' }}>自定义颜色</h6>
                  <div>
                    <div ref={(node) => { this.picker_popver_container = node }}>
                      <OverlayTrigger
                        trigger="click"
                        placement="bottom"
                        rootClose
                        overlay={this.renderColorPicker(currentColorAtLegend[0], this.handleSetGradColor.bind(this, 0))}
                        onEnter={this.handleColorpickEntered.bind(this)}
                      >
                        <span className="start-color" style={{ background: currentColorAtLegend[0] }}></span>
                      </OverlayTrigger>
                      <span className="color-result" style={{ background: `linear-gradient(90deg, ${currentColorAtLegend[0]}, ${currentColorAtLegend[1]})` }}></span>
                      <OverlayTrigger
                        trigger="click"
                        placement="bottom"
                        rootClose
                        overlay={this.renderColorPicker(currentColorAtLegend[1], this.handleSetGradColor.bind(this, 1))}
                        onEnter={this.handleColorpickEntered.bind(this)}
                      >
                        <span className="end-color" style={{ background: currentColorAtLegend[1] }}></span>
                      </OverlayTrigger>
                    </div>
                  </div>
                  <h6 style={{ textAlign: 'left', marginBottom: 0 }}>{`角度(${currentColorAtLegend[2]})`}</h6>
                  <div className="clearfix">
                    <div className="float-l" style={{ margin: '5px 20px 0 5px' }}>
                      <SliderInput
                        className="config"
                        minValue={0}
                        maxValue={360}
                        step={1}
                        tipFormatter= { v => `${v}`}
                        style={{ width: '135px' }}
                        value={+currentColorAtLegend[2]}
                        onInput={this.handleSetGradColor.bind(this, 2)}
                      />
                    </div>
                    <div className="float-l" style={{ display: 'inline-block', padding: '5px', background: '#141E39' }}>
                      <span style={{
                        display: 'block',
                        width: '30px',
                        height: '30px',
                        borderRadius: '2px',
                        background: `linear-gradient(${currentColorAtLegend[2]}deg, ${currentColorAtLegend[0]}, ${currentColorAtLegend[1]})`
                      }}></span>
                    </div>
                  </div>
                  <div></div>
                </div>)
              }
            </div>
          </div>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button bsStyle="primary" onClick={this.handleSure.bind(this)} >确定</Button>
        <Button bsStyle="default" onClick={this.handleClose.bind(this)} >取消</Button>
      </Dialog.Footer>
    </Dialog>
  }

  renderLegendList(colorTheme, selectIndex) {
    const legends = this._getLegends()
    return legends.map((name, i) => {
      const color = getColorFromColorTheme(colorTheme, i)
      const colorStr = Array.isArray(color) ? `linear-gradient(90deg, ${color[0]}, ${color[1]})` : color
      return <li
        key={i}
        className={`legend-color-item nowrap${selectIndex === i ? ' active' : ''}`}
        onClick={selectIndex === undefined ? null : this.handleSelectLegend.bind(this, i)}
      >
        <i className="color-thumb-sm" style={{ background: colorStr }} />
        <span title={name} className="name">{name}</span>
      </li>
    })
  }


  renderColorPicker(color, onChange) {
    return <Popover className="color-picker-overlay">
      <div className="dmp-color-picker-container form" onKeyDown={ e => e.nativeEvent.stopImmediatePropagation() }>
        <SketchPicker
          className="dmp-color-picker-content"
          color={color}
          disableAlpha={false}
          onChange={onChange}
        />
      </div>
      <div className="float-r" style={{ marginTop: '10px', marginBottom: '10px' }}>
        <Button bsStyle="primary" onClick={this.handleSelectColorpickerSure.bind(this)}>确定</Button>
        <Button bsStyle="default" onClick={this.handleCancleSelectColor.bind(this)}>取消</Button>
      </div>
    </Popover>
  }

  renderAffectButton() {
    const { chart } = this.props
    const { colorThemeCopy } = this.state
    const hasAffect = CHART_HAS_AFFECT.indexOf(chart.chart_code) > -1 && chart.dims.length > 0

    if (hasAffect) {
      const popover = <Popover className="dashboard-popover">
        <div onClick={this.handleChooseAffect.bind(this, 1)} className={classnames('sub-btn', { active: +colorThemeCopy.affect === 1 })}>按维度</div>
        <div onClick={this.handleChooseAffect.bind(this, 0)} className={classnames('sub-btn', { active: +colorThemeCopy.affect !== 1 })}>按数值</div>
      </Popover>

      return (
        <OverlayTrigger
          trigger="click"
          rootClose
          placement="bottom"
          overlay={popover}
        >
          <button title="切换方式" className="dmpicon-exchange float-r" style={{ marginTop: '5px', marginRight: '5px' }}></button>
        </OverlayTrigger>
      );
    }
    return ''
  }

  handleChangeSelect() {

  }

  handleClose() {
    this.props.onClose()
  }

  handleSelectLegend(index) {
    this.setState({
      legendIndex: index
    })
  }

  handleSelectTheme({ value }) {
    this.setState({
      themeKeySelected: value
    })
  }

  handleApplyTheme() {
    this.setState({
      colorThemeCopy: {
        ...this.state.colorThemeCopy,
        themeKey: this.state.themeKeySelected,
        customColors: []                        // reset custome colors
      }
    })
  }

  handleSetGradColor(index, colorObj) {
    // 渐变色
    const { chart } = this.props
    const { legendIndex, colorThemeCopy } = this.state
    let color = getColorFromColorTheme(colorThemeCopy, legendIndex, chart.chart_code)
    // 一定要是渐变色数组
    if (Array.isArray(color)) {
      color = color.concat([])
      color[index] = colorObj.hex ? _rgbaToString(colorObj.rgb) : colorObj           // 设置颜色或者角度
      this._setColorAtLegend(color)
    }
  }

  handleSelectColorPick(colorObj) {
    this._setColorAtLegend(_rgbaToString(colorObj.rgb))
  }

  handleColorpickEntered() {
    // 需要保存oldColor 取消按钮需要恢复
    this.oldCustomeColorAtIndex = this._getCurrentCustomColor()
  }

  handleSelectColorpickerSure() {
    // hide colorpicker
    this.picker_popver_container.click()
  }

  handleCancleSelectColor() {
    this.state.colorThemeCopy.customColors[this.state.legendIndex] = this.oldCustomeColorAtIndex
    this.picker_popver_container.click()
    this.setState({})
  }

  handleThemeColorClick(color) {
    this._setColorAtLegend(color)
  }

  handleSure() {
    const { colorThemeCopy } = this.state
    const { onChangeTheme } = this.props
    if (onChangeTheme) {
      onChangeTheme(colorThemeCopy)
    }
  }

  // 0: default, 1: custom
  handleChooseAffect(affect) {
    const { colorThemeCopy } = this.state
    this.setState({
      colorThemeCopy: {
        ...colorThemeCopy,
        affect
      }
    })
    this.contentDom.click()
  }

  _getCurrentCustomColor() {
    const { colorThemeCopy, legendIndex } = this.state
    return colorThemeCopy.customColors[legendIndex]
  }

  _setColorAtLegend(color) {
    const { legendIndex } = this.state
    this.state.colorThemeCopy.themeKey = this.state.themeKeySelected
    this.setState({
      colorThemeCopy: customColorAtIndex(this.state.colorThemeCopy, { index: legendIndex, color })
    })
  }

  _getLegends() {
    const { chart, chartData } = this.props
    const { colorThemeCopy } = this.state
    let legends = []
    const customAffect = +colorThemeCopy.affect === 1         // 目前只有柱状图和散点图支持

    if (chart) {
      switch (chart.chart_code) {
        case 'stack_line':
        case 'stack_area':
        case 'line':
        case 'area':
        case 'radar':
        case 'gauge':
        case 'split_gauge':
        case 'liquid_fill':
        case 'flow_bar':
          legends = chart.nums.map(item => item.alias || item.text)
          break

        case 'horizon_stack_bar':
        case 'double_axis':
        case 'stack_bar':
        case 'cluster_column':
        case 'horizon_bar':
          if (customAffect) {
            const colNames = getColNames(chart.dims)
            chartData.forEach((dataItem) => {
              const strArr = colNames.map((name, i) => (i > 0 ? '&' : '') + dataItem[name]).join('')

              if (chart.nums.length > 1) {
                chart.nums.forEach((num) => {
                  legends.push(`${strArr}_${num.alias || num.text}`)
                })
              } else {
                legends.push(strArr)
              }
            })
          } else {
            legends = chart.nums.map(item => item.alias || item.text)
          }
          break

        case 'treemap':
        case 'rose_pie':
        case 'pie':
        case 'circle_pie':
        case 'circle_rose_pie':
        case 'funnel':
          const colName = chart.dims[0]
            && chart.dims[0].col_name
          // 一个维度, 一个数值
          if (colName) {
            legends = chartData && Array.isArray(chartData) ? chartData.map(item => item[colName]) : []
          } else {   // 0个维度 多个数值
            legends = chart.nums.map(item => item.alias || item.text)
          }
          break
        case 'scatter':
          if (customAffect) {
            const colNames = getColNames(chart.dims)
            chartData.forEach((dataItem) => {
              const _name = colNames.map((name, i) => (i > 0 ? '&' : '') + dataItem[name]).join('')
              legends.push(_name)
            })
          } else {
            legends = chartData && chartData.length > 0 ? ['散点颜色'] : []
          }
          break

        case 'scatter_map':
          legends = chartData && chartData.length > 0 ? ['散点颜色', '地图颜色', '轮廓颜色'] : []
          break
        default:
          break
      }
    }
    return legends
  }

  STYLE_SHEET = {

  }
}

export default ColorThemeDialog
