import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

const _parseFontStyle = function (fontStyle) {
  const fontStyleArr = fontStyle.split(',')
  return {
    fontStyle: fontStyleArr.indexOf('italic') > -1 ? 'italic' : 'normal',
    fontWeight: fontStyleArr.indexOf('bold') > -1 ? 'bold' : 'normal',
    textDecoration: fontStyleArr.indexOf('underline') > -1 ? 'underline' : 'none'
  }
}

const getFormattedDate = function (formater) {
  formater = formater || 'YYYY年MM月DD日 HH:mm:ss'
  return moment().format(formater)
}

class SimpleClock extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    layoutOptions: PropTypes.object
  };

  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this._interval = setInterval(() => {
      this.textNode.innerHTML = this._getFormatDate()
    }, 1000)
  }

  componentWillUnmount() {
    clearInterval(this._interval)
  }

  render() {
    return (
      <div className="graph-inner-box" style={{
        display: 'flex',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={this._getIconStyle()}><i className="dmpicon-time"/></span>
        <span style={this._getTextStyle()} ref={(dom) => { this.textNode = dom }}>{this._getFormatDate()}</span>
      </div>
    )
  }

  _getFormatDate() {
    return getFormattedDate(this.props.layoutOptions.clock.format)
  }

  _getIconStyle() {
    const { icon } = this.props.layoutOptions;
    const style = {
      ...icon,
      display: 'inline-block',
      fontSize: `${icon.fontSize}px`
    }
    style.lineHeight = style.fontSize
    style.width = style.fontSize
    style.height = style.fontSize
    return style
  }

  _getTextStyle() {
    const { clock } = this.props.layoutOptions
    return {
      ...clock,
      ..._parseFontStyle(clock.fontStyle),
      fontSize: `${clock.fontSize}px`
    }
  }

  _getStyle() {
    const { layoutOptions } = this.props

    let style = null

    if (layoutOptions) {
      style = {
        ...style,
        ...layoutOptions
      }
    }
    return style
  }
}

export default SimpleClock
