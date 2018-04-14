import React from 'react'
import PropTypes from 'prop-types'
import Select from 'react-bootstrap-myui/lib/Select'
import CustomThemeDialog from './CustomThemeDialog'
import _ from 'lodash'
import { getAllColorThemes, getThemeByKey } from '../../../../../constants/echart'

import '../../components/dataSeries/icon-color-theme.less'

const STYLE_SHEET = {
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

export default class ColorThemeConfig extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    gradient: PropTypes.bool,
    chart: PropTypes.object,
    onChange: PropTypes.func
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
    const { configDialog } = this.state
    const { data, gradient } = this.props
    const colorTheme = data
    const COLOR_THEMES = _.cloneDeep(getAllColorThemes(gradient))
    const themeName = getThemeByKey(colorTheme.themeKey).name

    return (<div>
      <div className="row">
        <div className="col-xs-8">
          <div className="themekey-select-wrapper" style={{ position: 'relative' }}>
            <div style={STYLE_SHEET.iconShow}>
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
    </div>)
  }

  renderDialog() {
    const { data, ...others } = this.props
    return <CustomThemeDialog
      colorTheme={data}
      onChangeTheme={this.handleChangeTheme.bind(this)}
      onClose={this.toggleDialogShow.bind(this)}
      {...others}
    />
  }

  handleChangeSelect({ value }) {
    const { data, onChange } = this.props

    if (value === data.themeKey) {
      return
    }
    onChange({
      ...data,
      themeKey: value,
      customColors: []
    })
  }

  handleChangeTheme(colorTheme) {
    const { data, onChange } = this.props
    if (colorTheme && !_.isEqual(colorTheme, data)) {
      onChange({
        ...data,
        ...colorTheme
      })
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
}
