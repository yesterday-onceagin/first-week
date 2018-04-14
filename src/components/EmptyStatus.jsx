import React from 'react'
import PropTypes from 'prop-types'

class EmptyStatus extends React.Component {
  static propTypes = {
    icon: PropTypes.string,
    text: PropTypes.string,
    textSize: PropTypes.string,
    iconSize: PropTypes.string,
    className: PropTypes.string
  };

  static defaultProps = {
    icon: 'dmpicon-empty-report',
    text: '暂无数据',
    textSize: '18px',
    iconSize: '100px'
  };

  render() {
    const { className, icon, text, textSize, iconSize } = this.props;

    return (
      <div style={this.STYLE_SHEET.emptyWrap} className={`empty-data-status ${className || ''}`}>
        <div style={{
          ...this.STYLE_SHEET.emptyBox,
          fontSize: textSize
        }} className="empty-data-status-box hint-color">
          <i className={icon} style={{
            ...this.STYLE_SHEET.emptyIcon,
            fontSize: iconSize
          }} />
          {text}
        </div>
      </div>
    )
  }

  STYLE_SHEET = {
    emptyWrap: {
      width: '100%',
      height: '100%',
      position: 'relative'
    },
    emptyBox: {
      fontSize: '18px',
      textAlign: 'center',
      position: 'absolute',
      width: '100%',
      top: '50%',
      transform: 'translate(0%, -50%)'
    },
    emptyIcon: {
      display: 'block',
      fontSize: '100px',
      paddingBottom: '10px'
    }
  }
}

export default EmptyStatus
