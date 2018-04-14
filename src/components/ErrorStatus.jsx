import React from 'react'
import PropTypes from 'prop-types'
import errorImage from '../static/images/license.png'

class ErrorStatus extends React.Component {
  static propTypes = {
    fontSize: PropTypes.number,
    text: PropTypes.string
  };

  static defaultProps = {
    fontSize: 16,
    text: '发生了未知的错误，请刷新浏览器再尝试'
  };

  render() {
    const { fontSize, text } = this.props
    return (
      <div className="dmp-error-status" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="dmp-error-status-img" style={{
          backgroundImage: `url(${errorImage})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'auto 100%',
          flex: 1
        }}>
        
        </div>
        <div className="dmp-error-status-text hint-color" style={{
          fontSize: `${fontSize}px`,
          textAlign: 'center',
          lineHeight: fontSize < 30 ? '50px' : `${fontSize * 2}px`,
          height: fontSize < 30 ? '50px' : `${fontSize * 2}px`,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden'
        }}>
          {text}
        </div>
      </div>
    )
  }
}

export default ErrorStatus
