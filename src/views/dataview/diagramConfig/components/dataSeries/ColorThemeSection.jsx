import React from 'react'
import PropTypes from 'prop-types'

import ColorThemeDialog from './ColorThemeDialog';
import Select from 'react-bootstrap-myui/lib/Select';
import _ from 'lodash'
import { getAllColorThemes, getThemeByKey } from '../../../../../constants/echart'

import './icon-color-theme.less'

class ColorThemeSection extends React.Component {
  static propTypes = {
    colorTheme: PropTypes.object,
    chart: PropTypes.object,
    onChangeTheme: PropTypes.func
  };

  constructor(props) {
    super(props)
    this.state = {
      configDialog: {
        show: false
      }
    }
  }

  render() {
    const { colorTheme, chart } = this.props
    const { configDialog } = this.state
    const COLOR_THEMES = _.cloneDeep(getAllColorThemes())
    //水位图暂时过滤掉
    if (chart.chart_code === 'liquid_fill') {
      Object.keys(COLOR_THEMES).forEach((key) => {
        if (COLOR_THEMES[key].type === 1) {
          delete COLOR_THEMES[key]
        }
      })
    }
    const themeName = getThemeByKey(colorTheme.themeKey).name
    return (
      <div className="col">
        <div className="title">
          配色方案
        </div>
        <div className="content">
          <div className="row">
            <div className="col-xs-8">
              <div className="themekey-select-wrapper" style={{ position: 'relative' }}>
                <div style={this.STYLE_SHEET.iconShow}>
                  <i className={`icon-color-theme ${colorTheme.themeKey}`} />
                  <span>{themeName}</span>
                </div>
                <Select
                  className="theme-key-select"
                  value={colorTheme.themeKey}
                  maxHeight={160}
                  width={'100%'}
                  openSearch={false}
                  onSelected={this.handleChangeSelect.bind(this)}
                >
                  {
                    Object.keys(COLOR_THEMES).map(themeKey => (
                      <option value={themeKey} key={`color-theme-select-option-${themeKey}`}>
                        <div className={`icon-color-theme ${themeKey}`} />
                        <span>{COLOR_THEMES[themeKey].name}</span>
                      </option>
                    ))
                  }
                </Select>
              </div>
            </div>
            <div className="col-xs-4">
              <button className="color-theme-custom-btn"
                onClick={this.toggleDialogShow.bind(this)}
                style={{ lineHeight: '30px' }}
              >
                自定义
              </button>
              {configDialog.show && this.renderDialog()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderDialog() {
    const { colorTheme, chart, chartData } = this.props
    return (
      <ColorThemeDialog
        chart={chart}
        chartData={chartData}
        colorTheme={colorTheme}
        onChangeTheme={this.handleChangeTheme.bind(this)}
        onClose={this.toggleDialogShow.bind(this)}
      />
    )
  }

  handleChangeSelect({ value }) {
    const { colorTheme, onChangeColorTheme } = this.props
    if (value === colorTheme.themeKey) {
      return
    }
    onChangeColorTheme({
      ...colorTheme,
      themeKey: value,
      customColors: []
    })
  }

  handleChangeTheme(colorTheme) {
    if (colorTheme) {
      this.props.onChangeColorTheme(colorTheme)
    }
    this.toggleDialogShow()
  }

  toggleDialogShow() {
    this.setState({
      configDialog: {
        ...this.state.configDialog,
        show: !this.state.configDialog.show
      }
    })
  }

  STYLE_SHEET = {
    iconShow: {
      position: 'absolute',
      left: '1px',
      top: '1px',
      right: '27px',
      bottom: '1px',
      padding: '0 0 0 10px',
      zIndex: 1,
      lineHeight: '30px',
      pointerEvents: 'none'
    }
  }
}

export default ColorThemeSection
