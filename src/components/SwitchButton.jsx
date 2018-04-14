import React from 'react'
import PropTypes from 'prop-types'

class SwitchButton extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    turnOn: PropTypes.func.isRequired,
    turnOff: PropTypes.func.isRequired,
    style: PropTypes.object,                  // button 容器样式
    activeStyle: PropTypes.object,            // button激活 容器样式
    circleStyle: PropTypes.object,            // button 内圆圈样式
    circleActiveStyle: PropTypes.object,      // button激活 内圆圈样式
    className: PropTypes.string,
    texts: PropTypes.object,
    editable: PropTypes.bool,
  };

  static defaultProps = {
    active: false,
    style: {
      width: '66px',
      height: '24px',
      lineHeight: '24px',
    },
    activeStyle: {
      width: '66px',
      height: '24px',
      lineHeight: '24px',
    },
    circleStyle: {
      width: '20px',
      height: '20px',
      left: '3px'
    },
    circleActiveStyle: {
      width: '20px',
      height: '20px',
      left: '43px'
    },
    texts: {
      on: '启用',
      off: '停用'
    },
    editable: true
  };

  render() {
    const {
      className,
      style,
      activeStyle,
      circleStyle,
      circleActiveStyle,
      texts,
      active,
      editable
    } = this.props;

    // 样式合并
    const bStyle = Object.assign({}, this.STYLE_SHEET.button, style);
    const bStyleActive = Object.assign({}, this.STYLE_SHEET.button, activeStyle);
    const cStyle = Object.assign({}, this.STYLE_SHEET.circle, circleStyle);
    const cStyleActive = Object.assign({}, this.STYLE_SHEET.circle, circleActiveStyle, { left: this.compileCircleActiveLeft(bStyle, cStyle) });

    // 文字样式
    const tStyle = {
      position: 'absolute',
      top: '0px',
      left: active ? '10px' : 'initial',
      right: active ? 'initial' : '10px',
      fontSize: '12px'
    };

    return (
      <button type="button"
        disabled={!editable}
        className={`switch-btn-dmp  ${className || ''}  ${active ? 'active' : ''}`}
        style={active ? bStyleActive : bStyle}
        onClick={this.handleClick.bind(this)}>
        <div style={active ? cStyleActive : cStyle} className="switch-btn-dmp-circle"></div>
        {
          texts ? (
            <span className="switch-btn-dmp-text" style={tStyle}>{texts[active ? 'on' : 'off']}</span>
          ) : null
        }
      </button>
    );
  }

  // 开关
  handleClick(e) {
    if (!this.props.active) {
      this.props.turnOn(e);
    } else {
      this.props.turnOff(e);
    }
  }

  // 计算
  compileCircleActiveLeft(bStyle, cStyle) {
    const bWidth = Number.parseInt(bStyle.width, 10);
    const cWidth = Number.parseInt(cStyle.width, 10);
    const cLeft = Number.parseInt(cStyle.left, 10);

    const posLeftNum = bWidth - cWidth - cLeft;

    return `${posLeftNum}px`;
  }

  STYLE_SHEET = {
    button: {
      display: 'block',
      position: 'relative',
      border: '0 none',
      padding: 0,
      outline: '0 none',
      borderRadius: '24px',
      transition: 'background .3s'
    },
    circle: {
      position: 'absolute',
      borderRadius: '50%',
      transition: 'left .3s',
      top: '2px'
    }
  }
}

export default SwitchButton;
